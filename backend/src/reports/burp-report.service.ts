import { Injectable } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { PdfService } from './pdf.service';
import type { ReportAssessmentData } from './report.types';

@Injectable()
export class BurpReportService {
  constructor(
    private readonly pdfService: PdfService,
    private readonly config: ConfigService,
  ) {}

  async generate(data: ReportAssessmentData): Promise<Buffer> {
    const doc = this.pdfService.createDocument();
    const project = data.project;
    const storagePath =
      this.config.get<string>('STORAGE_PATH') ?? './storage/evidence';

    const severityCounts = this.countSeverities(data.findings);

    this.pdfService.coverPage(
      doc,
      'Laporan Pengujian Kerentanan',
      'BURP SUITE',
      [
        { label: 'Project', value: project.name },
        { label: 'Nomor Assessment', value: data.assessmentNumber },
        { label: 'Target', value: project.targetUrl },
        { label: 'Environment', value: project.environment },
        { label: 'Tester', value: data.tester },
        {
          label: 'Periode Pengujian',
          value: this.formatDateRange(data.startDate, data.endDate),
        },
      ],
    );

    this.pdfService.sectionTitle(doc, '1. Ringkasan Eksekutif');
    this.pdfService.bodyText(
      doc,
      `Laporan ini merangkum hasil Vulnerability Testing terhadap ${project.name} menggunakan Burp Suite beserta validasi manual. Tercatat ${data.findings.length} temuan (finding).`,
    );
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
      'Pengujian dilakukan menggunakan Burp Suite (proxy, scanner, dan tools manual), dilanjutkan validasi manual terhadap isu yang teridentifikasi. False positive ditinjau dan dihilangkan bila tidak relevan. Evidence dikumpulkan untuk temuan yang terkonfirmasi.',
    );

    this.pdfService.sectionTitle(doc, '4. Ringkasan Temuan');
    this.pdfService.simpleTable(
      doc,
      ['ID', 'Temuan', 'Severity', 'Status'],
      data.findings.map((f, index) => [
        `F-${String(index + 1).padStart(3, '0')}`,
        f.title,
        f.severity,
        f.status,
      ]),
      [50, 250, 90, 80],
    );

    this.pdfService.sectionTitle(doc, '5. Detail Temuan');
    if (data.findings.length === 0) {
      this.pdfService.bodyText(
        doc,
        'Tidak ada temuan yang dicatat pada assessment ini.',
      );
    } else {
      data.findings.forEach((finding, index) => {
        this.pdfService.ensureSpace(doc, 160);
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#0f1c2e')
          .text(
            `Temuan ${String(index + 1).padStart(3, '0')}: ${finding.title}`,
          );
        doc.moveDown(0.4);

        this.pdfService.keyValue(doc, 'Severity', finding.severity);
        this.pdfService.keyValue(doc, 'Confidence', finding.confidence ?? '—');
        this.pdfService.keyValue(
          doc,
          'URL Terdampak',
          finding.affectedUrl ?? '—',
        );
        this.pdfService.keyValue(doc, 'HTTP Method', finding.httpMethod ?? '—');
        this.pdfService.keyValue(doc, 'Parameter', finding.parameter ?? '—');
        this.pdfService.keyValue(doc, 'Status', finding.status);
        this.pdfService.keyValue(doc, 'Deskripsi', finding.description ?? '—');
        this.pdfService.keyValue(doc, 'Dampak (Impact)', finding.impact ?? '—');
        this.pdfService.keyValue(
          doc,
          'Rekomendasi',
          finding.recommendation ?? '—',
        );
        this.pdfService.keyValue(doc, 'Referensi', finding.reference ?? '—');

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
              doc
                .fontSize(8)
                .fillColor('#666666')
                .text(evidence.fileName);
              doc.moveDown(0.5);
            } catch {
              // skip unreadable images
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
    const openCount = data.findings.filter(
      (f) =>
        f.status === 'OPEN' ||
        f.status === 'IN_PROGRESS' ||
        f.status === 'RETEST',
    ).length;
    this.pdfService.bodyText(
      doc,
      `Assessment Burp Suite terhadap ${project.name} mengidentifikasi ${data.findings.length} temuan, di mana ${openCount} masih terbuka atau memerlukan retest. Temuan severity Critical dan High sebaiknya diprioritaskan untuk remediasi. Retest disarankan setelah perbaikan selesai.`,
    );

    this.pdfService.drawHeaderFooter(
      doc,
      `${data.assessmentNumber} · Burp Suite`,
    );

    return this.pdfService.collectBuffer(doc);
  }

  private countSeverities(
    findings: ReportAssessmentData['findings'],
  ): Record<string, number> {
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

  private formatDateRange(start: Date | null, end: Date | null): string {
    const fmt = (d: Date | null) =>
      d ? d.toISOString().slice(0, 10) : null;
    const s = fmt(start);
    const e = fmt(end);
    if (s && e) return `${s} – ${e}`;
    return s ?? e ?? '—';
  }
}
