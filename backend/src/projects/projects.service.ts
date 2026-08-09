import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { assessments: true } },
      },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        assessments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            assessmentNumber: true,
            methodology: true,
            status: true,
            tester: true,
            startDate: true,
            endDate: true,
          },
        },
        _count: { select: { assessments: true } },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }

  async create(dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        targetUrl: dto.targetUrl,
        environment: dto.environment,
      },
    });
    await this.audit.log('CREATE', 'Project', project.id);
    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.ensureExists(id);

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        targetUrl: dto.targetUrl,
        environment: dto.environment,
      },
    });
    await this.audit.log('UPDATE', 'Project', project.id);
    return project;
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.project.delete({ where: { id } });
    await this.audit.log('DELETE', 'Project', id);
    return { deleted: true, id };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(`Project ${id} not found`);
    }
  }
}
