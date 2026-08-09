import { Injectable } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { PdfService } from './pdf.service';
import type { ReportAssessmentData } from './report.types';

@Injectable()
export class OwaspReportService {
  constructor(
    private readonly pdfService: PdfService,
    private readonly config: ConfigService,
  ) {}

  async generate(data: ReportAssessmentData): Promise<Buffer> {
    const doc = this.pdfService.createDocument();
    const project = data.project;
    const storagePath =
      this.config.get<string>('STORAGE_PATH') ?? './storage/evidence';

    const testStats = this.countTestResults(data.owaspTests);
    const severityCounts = this.countSeverities(data.findings);
    const categorySummary = this.buildCategorySummary(
      data.owaspCategories,
      data.owaspTests,
    );

    this.pdfService.coverPage(doc, 'Vulnerability Testing Report', 'OWASP', [
      { label: 'Project', value: project.name },
      { label: 'Assessment Number', value: data.assessmentNumber },
      { label: 'Target', value: project.targetUrl },
      { label: 'Environment', value: project.environment },
      { label: 'Tester', value: data.tester },
      {
        label: 'Assessment Date',
        value: this.formatDateRange(data.startDate, data.endDate),
      },
    ]);

    this.pdfService.sectionTitle(doc, '1. Executive Summary');
    this.pdfService.bodyText(
      doc,
      `This report summarizes the OWASP Top 10 based Vulnerability Testing for ${project.name}.`,
    );
    this.pdfService.simpleTable(
      doc,
      ['Test Result', 'Count'],
      [
        ['Total Test', String(data.owaspTests.length)],
        ['PASS', String(testStats.PASS)],
        ['FAIL', String(testStats.FAIL)],
        ['NOT APPLICABLE', String(testStats.NOT_APPLICABLE)],
        ['NOT TESTED', String(testStats.NOT_TESTED)],
      ],
      [200, 80],
    );
    doc.moveDown(0.4);
    this.pdfService.simpleTable(
      doc,
      ['Severity', 'Count'],
      [
        ['Critical', String(severityCounts.CRITICAL)],
        ['High', String(severityCounts.HIGH)],
        ['Medium', String(severityCounts.MEDIUM)],
        ['Low', String(severityCounts.LOW)],
        ['Informational', String(severityCounts.INFORMATIONAL)],
      ],
      [200, 80],
    );

    this.pdfService.sectionTitle(doc, '2. Scope');
    this.pdfService.keyValue(doc, 'Project', project.name);
    this.pdfService.keyValue(doc, 'Target URL', project.targetUrl);
    this.pdfService.keyValue(doc, 'Environment', project.environment);
    this.pdfService.keyValue(
      doc,
      'Assessment Date',
      this.formatDateRange(data.startDate, data.endDate),
    );

    this.pdfService.sectionTitle(doc, '3. Methodology');
    this.pdfService.bodyText(
      doc,
      'The assessment followed the OWASP Top 10 categories. For each category, test cases were defined with objectives and procedures. Results were recorded as PASS, FAIL, NOT APPLICABLE, or NOT TESTED. Failed tests produced findings with severity and remediation guidance.',
    );

    this.pdfService.sectionTitle(doc, '4. OWASP Summary');
    this.pdfService.simpleTable(
      doc,
      ['Category', 'PASS', 'FAIL', 'N/A', 'Not Tested'],
      categorySummary.map((row) => [
        `${row.code} ${row.name}`,
        String(row.PASS),
        String(row.FAIL),
        String(row.NOT_APPLICABLE),
        String(row.NOT_TESTED),
      ]),
      [220, 50, 50, 50, 70],
    );

    this.pdfService.sectionTitle(doc, '5. Detailed Findings');
    if (data.findings.length === 0) {
      this.pdfService.bodyText(doc, 'No findings were recorded for this assessment.');
    } else {
      data.findings.forEach((finding, index) => {
        this.pdfService.ensureSpace(doc, 140);
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#0f1c2e')
          .text(
            `Finding ${String(index + 1).padStart(3, '0')}: ${finding.title}`,
          );
        doc.moveDown(0.4);

        this.pdfService.keyValue(
          doc,
          'OWASP Category',
          finding.owaspCategory
            ? `${finding.owaspCategory.code} — ${finding.owaspCategory.name}`
            : '—',
        );
        this.pdfService.keyValue(doc, 'Severity', finding.severity);
        this.pdfService.keyValue(doc, 'Description', finding.description ?? '—');
        this.pdfService.keyValue(doc, 'Impact', finding.impact ?? '—');
        this.pdfService.keyValue(doc, 'Affected URL', finding.affectedUrl ?? '—');
        this.pdfService.keyValue(
          doc,
          'Recommendation',
          finding.recommendation ?? '—',
        );
        this.pdfService.keyValue(doc, 'Status', finding.status);

        const images = finding.evidences.filter((e) =>
          e.mimeType.startsWith('image/'),
        );
        if (images.length > 0) {
          this.pdfService.keyValue(doc, 'Evidence', '');
          for (const evidence of images.slice(0, 3)) {
            const absolute = join(storagePath, evidence.filePath);
            if (!existsSync(absolute)) continue;
            try {
              this.pdfService.ensureSpace(doc, 220);
              doc.image(readFileSync(absolute), {
                fit: [450, 200],
              });
              doc.fontSize(8).fillColor('#666666').text(evidence.fileName);
              doc.moveDown(0.5);
            } catch {
              // skip
            }
          }
        } else if (finding.evidences.length > 0) {
          this.pdfService.keyValue(
            doc,
            'Evidence',
            finding.evidences.map((e) => e.fileName).join(', '),
          );
        } else {
          this.pdfService.keyValue(doc, 'Evidence', 'None');
        }

        doc.moveDown(0.8);
      });
    }

    this.pdfService.sectionTitle(doc, '6. Conclusion');
    this.pdfService.bodyText(
      doc,
      `The OWASP assessment covered ${data.owaspCategories.length} Top 10 categories with ${data.owaspTests.length} test case(s). ${testStats.FAIL} test(s) failed and produced ${data.findings.length} finding(s). Remaining NOT TESTED items should be completed in a follow-up assessment. Priority remediation is recommended for Critical and High severity findings.`,
    );

    this.pdfService.drawHeaderFooter(doc, `${data.assessmentNumber} · OWASP`);
    return this.pdfService.collectBuffer(doc);
  }

  private countTestResults(tests: ReportAssessmentData['owaspTests']) {
    const counts = {
      PASS: 0,
      FAIL: 0,
      NOT_APPLICABLE: 0,
      NOT_TESTED: 0,
    };
    for (const t of tests) {
      if (t.result in counts) {
        counts[t.result as keyof typeof counts] += 1;
      }
    }
    return counts;
  }

  private countSeverities(findings: ReportAssessmentData['findings']) {
    const counts = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      INFORMATIONAL: 0,
    };
    for (const f of findings) {
      if (f.severity in counts) {
        counts[f.severity as keyof typeof counts] += 1;
      }
    }
    return counts;
  }

  private buildCategorySummary(
    categories: ReportAssessmentData['owaspCategories'],
    tests: ReportAssessmentData['owaspTests'],
  ) {
    return categories.map((category) => {
      const related = tests.filter((t) => t.categoryId === category.id);
      return {
        code: category.code,
        name: category.name,
        PASS: related.filter((t) => t.result === 'PASS').length,
        FAIL: related.filter((t) => t.result === 'FAIL').length,
        NOT_APPLICABLE: related.filter((t) => t.result === 'NOT_APPLICABLE')
          .length,
        NOT_TESTED: related.filter((t) => t.result === 'NOT_TESTED').length,
      };
    });
  }

  private formatDateRange(start: Date | null, end: Date | null): string {
    const fmt = (d: Date | null) =>
      d ? d.toISOString().slice(0, 10) : null;
    const s = fmt(start);
    const e = fmt(end);
    if (s && e) return `${s} – ${e}`;
    return s ?? e ?? '—';
  }
}
