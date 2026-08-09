import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Methodology } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOwaspTestDto } from './dto/create-owasp-test.dto';
import { UpdateOwaspTestDto } from './dto/update-owasp-test.dto';

const testInclude = {
  category: {
    select: { id: true, code: true, name: true, sortOrder: true },
  },
  findings: {
    select: { id: true, title: true, severity: true, status: true },
  },
};

@Injectable()
export class OwaspService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findCategories() {
    return this.prisma.owaspCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getAssessmentChecklist(assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { id: true, methodology: true, assessmentNumber: true },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${assessmentId} not found`);
    }

    if (assessment.methodology !== Methodology.OWASP) {
      throw new BadRequestException('Assessment is not OWASP methodology');
    }

    const categories = await this.prisma.owaspCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const tests = await this.prisma.owaspTest.findMany({
      where: { assessmentId },
      orderBy: { createdAt: 'asc' },
      include: testInclude,
    });

    return {
      assessment,
      categories: categories.map((category) => ({
        ...category,
        tests: tests.filter((t) => t.categoryId === category.id),
      })),
    };
  }

  findTests(assessmentId: string, categoryId?: string) {
    return this.prisma.owaspTest.findMany({
      where: {
        assessmentId,
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: { createdAt: 'asc' },
      include: testInclude,
    });
  }

  async findOneTest(id: string) {
    const test = await this.prisma.owaspTest.findUnique({
      where: { id },
      include: testInclude,
    });
    if (!test) {
      throw new NotFoundException(`OWASP test ${id} not found`);
    }
    return test;
  }

  async createTest(dto: CreateOwaspTestDto) {
    await this.ensureOwaspAssessment(dto.assessmentId);
    await this.ensureCategory(dto.categoryId);

    const test = await this.prisma.owaspTest.create({
      data: {
        assessmentId: dto.assessmentId,
        categoryId: dto.categoryId,
        testCase: dto.testCase,
        testObjective: dto.testObjective,
        testProcedure: dto.testProcedure,
        result: dto.result,
        notes: dto.notes,
      },
      include: testInclude,
    });
    await this.audit.log('CREATE', 'OwaspTest', test.id);
    return test;
  }

  async updateTest(id: string, dto: UpdateOwaspTestDto) {
    await this.findOneTest(id);

    const test = await this.prisma.owaspTest.update({
      where: { id },
      data: {
        testCase: dto.testCase,
        testObjective: dto.testObjective,
        testProcedure: dto.testProcedure,
        result: dto.result,
        notes: dto.notes,
      },
      include: testInclude,
    });
    await this.audit.log('UPDATE', 'OwaspTest', test.id);
    return test;
  }

  async removeTest(id: string) {
    await this.findOneTest(id);
    await this.prisma.owaspTest.delete({ where: { id } });
    await this.audit.log('DELETE', 'OwaspTest', id);
    return { deleted: true, id };
  }

  private async ensureOwaspAssessment(assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { id: true, methodology: true },
    });
    if (!assessment) {
      throw new NotFoundException(`Assessment ${assessmentId} not found`);
    }
    if (assessment.methodology !== Methodology.OWASP) {
      throw new BadRequestException('Assessment is not OWASP methodology');
    }
  }

  private async ensureCategory(categoryId: string) {
    const category = await this.prisma.owaspCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new BadRequestException('Invalid OWASP category');
    }
  }
}
