import { Injectable } from '@nestjs/common';
import { Methodology } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [
      totalProjects,
      totalAssessments,
      totalFindings,
      burpAssessments,
      owaspAssessments,
      severityGroups,
    ] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.assessment.count(),
      this.prisma.finding.count(),
      this.prisma.assessment.count({ where: { methodology: Methodology.BURP } }),
      this.prisma.assessment.count({
        where: { methodology: Methodology.OWASP },
      }),
      this.prisma.finding.groupBy({
        by: ['severity'],
        _count: { severity: true },
      }),
    ]);

    const severity = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      INFORMATIONAL: 0,
    };

    for (const row of severityGroups) {
      severity[row.severity] = row._count.severity;
    }

    return {
      totalProjects,
      totalAssessments,
      totalFindings,
      severity,
      assessmentsByMethodology: {
        BURP: burpAssessments,
        OWASP: owaspAssessments,
      },
    };
  }
}
