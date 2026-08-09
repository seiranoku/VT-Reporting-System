import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll(projectId?: string) {
    return this.prisma.assessment.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            targetUrl: true,
            environment: true,
          },
        },
        _count: { select: { findings: true, owaspTests: true } },
      },
    });
  }

  async findOne(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        project: true,
        findings: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            severity: true,
            status: true,
            confidence: true,
          },
        },
        _count: { select: { findings: true, owaspTests: true } },
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${id} not found`);
    }

    return assessment;
  }

  async create(dto: CreateAssessmentDto) {
    await this.ensureProjectExists(dto.projectId);

    try {
      const assessment = await this.prisma.assessment.create({
        data: {
          projectId: dto.projectId,
          assessmentNumber: dto.assessmentNumber,
          methodology: dto.methodology,
          tester: dto.tester,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          description: dto.description,
          status: dto.status,
        },
        include: {
          project: {
            select: { id: true, name: true, targetUrl: true, environment: true },
          },
        },
      });
      await this.audit.log('CREATE', 'Assessment', assessment.id);
      return assessment;
    } catch (error) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateAssessmentDto) {
    await this.ensureExists(id);

    try {
      const assessment = await this.prisma.assessment.update({
        where: { id },
        data: {
          assessmentNumber: dto.assessmentNumber,
          methodology: dto.methodology,
          tester: dto.tester,
          startDate:
            dto.startDate === undefined
              ? undefined
              : dto.startDate
                ? new Date(dto.startDate)
                : null,
          endDate:
            dto.endDate === undefined
              ? undefined
              : dto.endDate
                ? new Date(dto.endDate)
                : null,
          description: dto.description,
          status: dto.status,
        },
        include: {
          project: {
            select: { id: true, name: true, targetUrl: true, environment: true },
          },
        },
      });
      await this.audit.log('UPDATE', 'Assessment', assessment.id);
      return assessment;
    } catch (error) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.assessment.delete({ where: { id } });
    await this.audit.log('DELETE', 'Assessment', id);
    return { deleted: true, id };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.assessment.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Assessment ${id} not found`);
    }
  }

  private async ensureProjectExists(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
  }

  private handleUniqueError(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Assessment number already exists');
    }
  }
}
