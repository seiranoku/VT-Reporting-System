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

    this.pdfService.coverPage(doc, 'Laporan Pengujian Kerentanan', 'OWASP', [
      { label: 'Project', value: project.name },
      { label: 'Nomor Assessment', value: data.assessmentNumber },
      { label: 'Target', value: project.targetUrl },
      { label: 'Environment', value: project.environment },
      { label: 'Tester', value: data.tester },
      {
        label: 'Periode Pengujian',
        value: this.formatDateRange(data.startDate, data.endDate),
      },
    ]);

    this.pdfService.sectionTitle(doc, '1. Ringkasan Eksekutif');
    this.pdfService.bodyText(
      doc,
      `Laporan ini merangkum hasil Vulnerability Testing berbasis OWASP Top 10 terhadap ${project.name}.`,
    );
    this.pdfService.simpleTable(
      doc,
      ['Hasil Test', 'Jumlah'],
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
      ['Severity', 'Jumlah'],
      [
        ['Critical', String(severityCounts.CRITICAL)],
        ['High', String(severityCounts.HIGH)],
        ['Medium', String(severityCounts.MEDIUM)],
        ['Low', String(severityCounts.LOW)],
        ['Informational', String(severityCounts.INFORMATIONAL)],
      ],
      [200, 80],
    );

    this.pdfService.sectionTitle(doc, '2. Ruang Lingkup');
    this.pdfService.keyValue(doc, 'Project', project.name);
    this.pdfService.keyValue(doc, 'Target URL', project.targetUrl);
    this.pdfService.keyValue(doc, 'Environment', project.environment);
    this.pdfService.keyValue(
      doc,
      'Periode Pengujian',
      this.formatDateRange(data.startDate, data.endDate),
    );

    this.pdfService.sectionTitle(doc, '3. Metodologi');
    this.pdfService.bodyText(
      doc,
      'Assessment mengikuti kategori OWASP Top 10. Untuk setiap kategori, test case disusun dengan objektif dan prosedur. Hasil dicatat sebagai PASS, FAIL, NOT APPLICABLE, atau NOT TESTED. Test yang FAIL menghasilkan temuan beserta severity dan rekomendasi perbaikan.',
    );

    this.pdfService.sectionTitle(doc, '4. Ringkasan OWASP');
    this.pdfService.simpleTable(
      doc,
      ['Kategori', 'PASS', 'FAIL', 'N/A', 'Not Tested'],
      categorySummary.map((row) => [
        `${row.code} ${row.name}`,
        String(row.PASS),
        String(row.FAIL),
        String(row.NOT_APPLICABLE),
        String(row.NOT_TESTED),
      ]),
      [220, 50, 50, 50, 70],
    );

    this.pdfService.sectionTitle(doc, '5. Detail Temuan');
    if (data.findings.length === 0) {
      this.pdfService.bodyText(
        doc,
        'Tidak ada temuan yang dicatat pada assessment ini.',
      );
    } else {
      data.findings.forEach((finding, index) => {
        this.pdfService.ensureSpace(doc, 140);
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#0f1c2e')
          .text(
            `Temuan ${String(index + 1).padStart(3, '0')}: ${finding.title}`,
          );
        doc.moveDown(0.4);

        this.pdfService.keyValue(
          doc,
          'Kategori OWASP',
          finding.owaspCategory
            ? `${finding.owaspCategory.code} — ${finding.owaspCategory.name}`
            : '—',
        );
        this.pdfService.keyValue(doc, 'Severity', finding.severity);
        this.pdfService.keyValue(doc, 'Deskripsi', finding.description ?? '—');
        this.pdfService.keyValue(doc, 'Dampak (Impact)', finding.impact ?? '—');
        this.pdfService.keyValue(
          doc,
          'URL Terdampak',
          finding.affectedUrl ?? '—',
        );
        this.pdfService.keyValue(
          doc,
          'Rekomendasi',
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
          this.pdfService.keyValue(doc, 'Evidence', 'Tidak ada');
        }

        doc.moveDown(0.8);
      });
    }

    this.pdfService.sectionTitle(doc, '6. Kesimpulan');
    this.pdfService.bodyText(
      doc,
      `Assessment OWASP mencakup ${data.owaspCategories.length} kategori Top 10 dengan ${data.owaspTests.length} test case. ${testStats.FAIL} test berstatus FAIL dan menghasilkan ${data.findings.length} temuan. Item NOT TESTED sebaiknya dilanjutkan pada assessment berikutnya. Prioritaskan remediasi temuan Critical dan High.`,
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
