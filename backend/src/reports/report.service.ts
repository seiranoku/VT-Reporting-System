import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Methodology } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BurpReportService } from './burp-report.service';
import { ExcelReportService } from './excel-report.service';
import { OwaspReportService } from './owasp-report.service';
import type { ReportAssessmentData } from './report.types';

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly burpReportService: BurpReportService,
    private readonly owaspReportService: OwaspReportService,
    private readonly excelReportService: ExcelReportService,
  ) {}

  async getMetadata(assessmentId: string) {
    const assessment = await this.loadAssessment(assessmentId);
    const severityBreakdown = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      INFORMATIONAL: 0,
    };
    for (const finding of assessment.findings) {
      severityBreakdown[finding.severity] += 1;
    }

    return {
      assessmentId: assessment.id,
      assessmentNumber: assessment.assessmentNumber,
      methodology: assessment.methodology,
      project: assessment.project.name,
      targetUrl: assessment.project.targetUrl,
      environment: assessment.project.environment,
      tester: assessment.tester,
      status: assessment.status,
      findingCount: assessment.findings.length,
      owaspTestCount: assessment.owaspTests.length,
      severityBreakdown,
      reportType:
        assessment.methodology === Methodology.BURP
          ? 'BURP_SUITE'
          : 'OWASP',
      filenamePdf: this.buildFilename(assessment, 'pdf'),
      filenameExcel: this.buildFilename(assessment, 'xlsx'),
      filename: this.buildFilename(assessment, 'pdf'),
    };
  }

  async generatePdf(assessmentId: string): Promise<{
    buffer: Buffer;
    filename: string;
    methodology: Methodology;
  }> {
    const assessment = await this.loadAssessment(assessmentId);
    const filename = this.buildFilename(assessment, 'pdf');

    const buffer =
      assessment.methodology === Methodology.BURP
        ? await this.burpReportService.generate(assessment)
        : await this.owaspReportService.generate(assessment);

    return {
      buffer,
      filename,
      methodology: assessment.methodology,
    };
  }

  async generateExcel(assessmentId: string): Promise<{
    buffer: Buffer;
    filename: string;
    methodology: Methodology;
  }> {
    const assessment = await this.loadAssessment(assessmentId);
    const filename = this.buildFilename(assessment, 'xlsx');
    const buffer = await this.excelReportService.generate(assessment);

    return {
      buffer,
      filename,
      methodology: assessment.methodology,
    };
  }

  private async loadAssessment(
    assessmentId: string,
  ): Promise<ReportAssessmentData> {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        project: true,
        findings: {
          orderBy: [{ severity: 'asc' }, { createdAt: 'asc' }],
          include: {
            owaspCategory: { select: { code: true, name: true } },
            evidences: {
              select: {
                id: true,
                fileName: true,
                filePath: true,
                mimeType: true,
              },
            },
          },
        },
        owaspTests: {
          select: {
            id: true,
            categoryId: true,
            testCase: true,
            result: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${assessmentId} not found`);
    }

    if (
      assessment.methodology !== Methodology.BURP &&
      assessment.methodology !== Methodology.OWASP
    ) {
      throw new BadRequestException('Unsupported methodology for report');
    }

    const owaspCategories =
      assessment.methodology === Methodology.OWASP
        ? await this.prisma.owaspCategory.findMany({
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              code: true,
              name: true,
              sortOrder: true,
            },
          })
        : [];

    return {
      id: assessment.id,
      assessmentNumber: assessment.assessmentNumber,
      methodology: assessment.methodology,
      tester: assessment.tester,
      startDate: assessment.startDate,
      endDate: assessment.endDate,
      description: assessment.description,
      status: assessment.status,
      project: {
        id: assessment.project.id,
        name: assessment.project.name,
        targetUrl: assessment.project.targetUrl,
        environment: assessment.project.environment,
        description: assessment.project.description,
      },
      findings: assessment.findings,
      owaspCategories,
      owaspTests: assessment.owaspTests,
    };
  }

  private buildFilename(
    assessment: {
      assessmentNumber: string;
      methodology: Methodology;
    },
    extension: 'pdf' | 'xlsx',
  ): string {
    const safeNumber = assessment.assessmentNumber.replace(/[^\w.-]+/g, '_');
    const type =
      assessment.methodology === Methodology.BURP ? 'Burp' : 'OWASP';
    return `VT_Report_${safeNumber}_${type}.${extension}`;
  }
}
