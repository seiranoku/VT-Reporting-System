import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { createReadStream, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
  'application/xml',
  'text/xml',
  'application/octet-stream',
]);

@Injectable()
export class EvidencesService {
  private readonly storagePath: string;
  private readonly maxFileSizeBytes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {
    this.storagePath =
      this.config.get<string>('STORAGE_PATH') ?? './storage/evidence';
    const maxMb = Number(this.config.get<string>('MAX_FILE_SIZE_MB') ?? 10);
    this.maxFileSizeBytes = maxMb * 1024 * 1024;

    if (!existsSync(this.storagePath)) {
      mkdirSync(this.storagePath, { recursive: true });
    }
  }

  findByFinding(findingId: string) {
    return this.prisma.evidence.findMany({
      where: { findingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id },
    });
    if (!evidence) {
      throw new NotFoundException(`Evidence ${id} not found`);
    }
    return evidence;
  }

  async create(findingId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const finding = await this.prisma.finding.findUnique({
      where: { id: findingId },
      select: { id: true },
    });
    if (!finding) {
      throw new NotFoundException(`Finding ${findingId} not found`);
    }

    if (file.size > this.maxFileSizeBytes) {
      throw new BadRequestException(
        `File exceeds max size of ${this.maxFileSizeBytes / (1024 * 1024)}MB`,
      );
    }

    const mimeType = file.mimetype || 'application/octet-stream';
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException(`MIME type not allowed: ${mimeType}`);
    }

    const safeExt = extname(file.originalname).slice(0, 20);
    const storedName = `${randomUUID()}${safeExt}`;
    const absolutePath = join(this.storagePath, storedName);

    writeFileSync(absolutePath, file.buffer);

    const evidence = await this.prisma.evidence.create({
      data: {
        findingId,
        fileName: file.originalname,
        filePath: storedName,
        mimeType,
        fileSize: file.size,
      },
    });
    await this.audit.log('CREATE', 'Evidence', evidence.id);
    return evidence;
  }

  async remove(id: string) {
    const evidence = await this.findOne(id);
    const absolutePath = join(this.storagePath, evidence.filePath);

    await this.prisma.evidence.delete({ where: { id } });

    if (existsSync(absolutePath)) {
      unlinkSync(absolutePath);
    }

    await this.audit.log('DELETE', 'Evidence', id);
    return { deleted: true, id };
  }

  async getFileStream(id: string) {
    const evidence = await this.findOne(id);
    const absolutePath = join(this.storagePath, evidence.filePath);

    if (!existsSync(absolutePath)) {
      throw new NotFoundException('Evidence file missing on disk');
    }

    return {
      evidence,
      stream: createReadStream(absolutePath),
    };
  }
}
