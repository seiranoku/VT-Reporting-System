import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Methodology } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFindingDto } from './dto/create-finding.dto';
import { UpdateFindingDto } from './dto/update-finding.dto';

const findingInclude = {
  assessment: {
    select: {
      id: true,
      assessmentNumber: true,
      methodology: true,
      project: { select: { id: true, name: true } },
    },
  },
  owaspCategory: {
    select: { id: true, code: true, name: true },
  },
  evidences: {
    orderBy: { createdAt: 'desc' as const },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      fileSize: true,
      createdAt: true,
    },
  },
  _count: { select: { evidences: true } },
};

@Injectable()
export class FindingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll(assessmentId?: string) {
    return this.prisma.finding.findMany({
      where: assessmentId ? { assessmentId } : undefined,
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      include: findingInclude,
    });
  }

  async findOne(id: string) {
    const finding = await this.prisma.finding.findUnique({
      where: { id },
      include: findingInclude,
    });

    if (!finding) {
      throw new NotFoundException(`Finding ${id} not found`);
    }

    return finding;
  }

  async create(dto: CreateFindingDto) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: dto.assessmentId },
      select: { id: true, methodology: true },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${dto.assessmentId} not found`);
    }

    await this.validateOwaspFields(
      assessment.methodology,
      dto.owaspCategoryId,
      dto.owaspTestId,
    );

    const finding = await this.prisma.finding.create({
      data: {
        assessmentId: dto.assessmentId,
        title: dto.title,
        severity: dto.severity,
        confidence: dto.confidence,
        affectedUrl: dto.affectedUrl,
        httpMethod: dto.httpMethod,
        parameter: dto.parameter,
        description: dto.description,
        impact: dto.impact,
        recommendation: dto.recommendation,
        reference: dto.reference,
        status: dto.status,
        owaspCategoryId: dto.owaspCategoryId,
        owaspTestId: dto.owaspTestId,
        cvssScore: dto.cvssScore,
        cvssVector: dto.cvssVector,
      },
      include: findingInclude,
    });
    await this.audit.log('CREATE', 'Finding', finding.id);
    return finding;
  }

  async update(id: string, dto: UpdateFindingDto) {
    const existing = await this.prisma.finding.findUnique({
      where: { id },
      include: {
        assessment: { select: { methodology: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Finding ${id} not found`);
    }

    const owaspCategoryId =
      dto.owaspCategoryId === undefined
        ? existing.owaspCategoryId
        : dto.owaspCategoryId;
    const owaspTestId =
      dto.owaspTestId === undefined ? existing.owaspTestId : dto.owaspTestId;

    await this.validateOwaspFields(
      existing.assessment.methodology,
      owaspCategoryId,
      owaspTestId,
    );

    const finding = await this.prisma.finding.update({
      where: { id },
      data: {
        title: dto.title,
        severity: dto.severity,
        confidence: dto.confidence,
        affectedUrl: dto.affectedUrl,
        httpMethod: dto.httpMethod,
        parameter: dto.parameter,
        description: dto.description,
        impact: dto.impact,
        recommendation: dto.recommendation,
        reference: dto.reference,
        status: dto.status,
        owaspCategoryId: dto.owaspCategoryId,
        owaspTestId: dto.owaspTestId,
        cvssScore: dto.cvssScore,
        cvssVector: dto.cvssVector,
      },
      include: findingInclude,
    });
    await this.audit.log('UPDATE', 'Finding', finding.id);
    return finding;
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.finding.delete({ where: { id } });
    await this.audit.log('DELETE', 'Finding', id);
    return { deleted: true, id };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.finding.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Finding ${id} not found`);
    }
  }

  private async validateOwaspFields(
    methodology: Methodology,
    owaspCategoryId?: string | null,
    owaspTestId?: string | null,
  ) {
    if (methodology === Methodology.OWASP && !owaspCategoryId) {
      throw new BadRequestException(
        'OWASP Category is required for OWASP assessments',
      );
    }

    if (owaspCategoryId) {
      const category = await this.prisma.owaspCategory.findUnique({
        where: { id: owaspCategoryId },
        select: { id: true },
      });
      if (!category) {
        throw new BadRequestException('Invalid OWASP category');
      }
    }

    if (owaspTestId) {
      const test = await this.prisma.owaspTest.findUnique({
        where: { id: owaspTestId },
        select: { id: true },
      });
      if (!test) {
        throw new BadRequestException('Invalid OWASP test');
      }
    }
  }
}
