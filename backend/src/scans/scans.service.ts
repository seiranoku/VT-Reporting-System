import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssessmentStatus,
  FindingStatus,
  Methodology,
  OwaspTestResult,
  Prisma,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { StartScanDto } from './dto/start-scan.dto';
import { runSecurityChecks } from './scanner/checks';
import { probeHttp } from './scanner/http-probe';
import type { ScanFindingDraft } from './scanner/probe.types';

@Injectable()
export class ScansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async start(dto: StartScanDto) {
    const method = (dto.httpMethod ?? 'GET').toUpperCase();
    const headers = normalizeHeaders(dto.headers);
    const tester = dto.tester?.trim() || 'Auto Scanner';
    const targetUrl = dto.targetUrl.trim();

    const project = await this.resolveProject(dto, targetUrl);

    const request = {
      url: targetUrl,
      method,
      headers,
      body: dto.body?.trim() || undefined,
    };

    const baseline = await probeHttp(request);
    const drafts = await runSecurityChecks(request, baseline);

    const stamp = formatStamp(new Date());
    const burpNumber = `VT-AUTO-${stamp}-B`;
    const owaspNumber = `VT-AUTO-${stamp}-O`;

    const issueDrafts = drafts.filter((d) => d.result === 'FAIL');
    const owaspDrafts = uniqueByTestCase(drafts);

    const result = await this.prisma.$transaction(async (tx) => {
      const burp = await tx.assessment.create({
        data: {
          projectId: project.id,
          assessmentNumber: burpNumber,
          methodology: Methodology.BURP,
          tester,
          startDate: new Date(),
          endDate: new Date(),
          status: AssessmentStatus.COMPLETED,
          description: buildAssessmentDescription(
            'Automated Burp-style probe',
            method,
            targetUrl,
            baseline,
          ),
        },
      });

      const owasp = await tx.assessment.create({
        data: {
          projectId: project.id,
          assessmentNumber: owaspNumber,
          methodology: Methodology.OWASP,
          tester,
          startDate: new Date(),
          endDate: new Date(),
          status: AssessmentStatus.IN_PROGRESS,
          description: buildAssessmentDescription(
            'Automated OWASP-oriented checklist from probe',
            method,
            targetUrl,
            baseline,
          ),
        },
      });

      const categories = await tx.owaspCategory.findMany();
      const categoryByCode = new Map(categories.map((c) => [c.code, c]));

      const burpFindings = await this.createFindings(
        tx,
        burp.id,
        issueDrafts,
        method,
        targetUrl,
        null,
      );

      const owaspTests: { id: string; testCase: string; result: string }[] = [];
      const owaspFindingsCreated: string[] = [];

      for (const draft of owaspDrafts) {
        const category = categoryByCode.get(draft.owaspCode);
        if (!category) {
          continue;
        }

        const test = await tx.owaspTest.create({
          data: {
            assessmentId: owasp.id,
            categoryId: category.id,
            testCase: draft.testCase,
            testObjective: draft.testObjective,
            testProcedure: draft.testProcedure,
            result: mapOwaspResult(draft.result),
            notes: draft.notes ?? truncate(draft.description, 500),
          },
        });
        owaspTests.push({
          id: test.id,
          testCase: test.testCase,
          result: test.result,
        });

        if (draft.result === 'FAIL') {
          const finding = await tx.finding.create({
            data: {
              assessmentId: owasp.id,
              owaspCategoryId: category.id,
              owaspTestId: test.id,
              title: draft.title,
              severity: draft.severity,
              confidence: draft.confidence,
              affectedUrl: draft.affectedUrl || targetUrl,
              httpMethod: draft.httpMethod || method,
              parameter: draft.parameter,
              description: draft.description,
              impact: draft.impact,
              recommendation: draft.recommendation,
              reference: draft.reference,
              status: FindingStatus.OPEN,
            },
          });
          owaspFindingsCreated.push(finding.id);
        }
      }

      return {
        burp,
        owasp,
        burpFindingIds: burpFindings,
        owaspTests,
        owaspFindingIds: owaspFindingsCreated,
      };
    });

    await this.audit.log('CREATE', 'Scan', project.id);
    await this.audit.log('CREATE', 'Assessment', result.burp.id);
    await this.audit.log('CREATE', 'Assessment', result.owasp.id);

    return {
      project,
      probe: {
        statusCode: baseline.statusCode,
        statusText: baseline.statusText,
        durationMs: baseline.durationMs,
        error: baseline.error,
        finalUrl: baseline.finalUrl,
        redirected: baseline.redirected,
      },
      burpAssessment: {
        id: result.burp.id,
        assessmentNumber: result.burp.assessmentNumber,
        findingsCreated: result.burpFindingIds.length,
      },
      owaspAssessment: {
        id: result.owasp.id,
        assessmentNumber: result.owasp.assessmentNumber,
        testsCreated: result.owaspTests.length,
        findingsCreated: result.owaspFindingIds.length,
      },
      summary: {
        checksRun: drafts.length,
        issuesFound: issueDrafts.length,
        pass: drafts.filter((d) => d.result === 'PASS').length,
        fail: drafts.filter((d) => d.result === 'FAIL').length,
        notTested: drafts.filter((d) => d.result === 'NOT_TESTED').length,
      },
    };
  }

  private async resolveProject(dto: StartScanDto, targetUrl: string) {
    if (dto.projectId) {
      const existing = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
      });
      if (!existing) {
        throw new NotFoundException(`Project ${dto.projectId} not found`);
      }

      if (existing.targetUrl !== targetUrl) {
        return this.prisma.project.update({
          where: { id: existing.id },
          data: { targetUrl },
        });
      }
      return existing;
    }

    if (!dto.name?.trim()) {
      throw new BadRequestException('name is required when creating a project');
    }

    const project = await this.prisma.project.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || autoDescription(dto),
        targetUrl,
        environment: dto.environment?.trim() || 'Development',
      },
    });
    await this.audit.log('CREATE', 'Project', project.id);
    return project;
  }

  private async createFindings(
    tx: Prisma.TransactionClient,
    assessmentId: string,
    drafts: ScanFindingDraft[],
    method: string,
    targetUrl: string,
    owaspCategoryId: string | null,
  ) {
    const ids: string[] = [];
    for (const draft of drafts) {
      const finding = await tx.finding.create({
        data: {
          assessmentId,
          owaspCategoryId,
          title: draft.title,
          severity: draft.severity,
          confidence: draft.confidence,
          affectedUrl: draft.affectedUrl || targetUrl,
          httpMethod: draft.httpMethod || method,
          parameter: draft.parameter,
          description: draft.description,
          impact: draft.impact,
          recommendation: draft.recommendation,
          reference: draft.reference,
          status: FindingStatus.OPEN,
        },
      });
      ids.push(finding.id);
    }
    return ids;
  }
}

function normalizeHeaders(
  headers?: Record<string, string>,
): Record<string, string> {
  if (!headers) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (key?.trim() && value != null && String(value).length > 0) {
      out[key.trim()] = String(value);
    }
  }
  return out;
}

function formatStamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

function mapOwaspResult(
  result: ScanFindingDraft['result'],
): OwaspTestResult {
  switch (result) {
    case 'PASS':
      return OwaspTestResult.PASS;
    case 'FAIL':
      return OwaspTestResult.FAIL;
    case 'NOT_APPLICABLE':
      return OwaspTestResult.NOT_APPLICABLE;
    default:
      return OwaspTestResult.NOT_TESTED;
  }
}

function uniqueByTestCase(drafts: ScanFindingDraft[]): ScanFindingDraft[] {
  const seen = new Set<string>();
  const out: ScanFindingDraft[] = [];
  for (const draft of drafts) {
    const key = `${draft.owaspCode}:${draft.testCase}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(draft);
  }
  return out;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function buildAssessmentDescription(
  title: string,
  method: string,
  url: string,
  baseline: {
    statusCode: number | null;
    durationMs: number;
    error: string | null;
  },
): string {
  const status = baseline.error
    ? `error: ${baseline.error}`
    : `HTTP ${baseline.statusCode ?? 'n/a'} in ${baseline.durationMs}ms`;
  return `${title}\nRequest: ${method} ${url}\nProbe: ${status}\nGenerated by VT Auto Scanner (light checks — review manually).`;
}

function autoDescription(dto: StartScanDto): string {
  const method = (dto.httpMethod ?? 'GET').toUpperCase();
  return `Auto-created for ${method} scan against ${dto.targetUrl}`;
}
