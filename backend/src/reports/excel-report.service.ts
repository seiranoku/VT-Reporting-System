import { Injectable } from '@nestjs/common';
import { Methodology } from '@prisma/client';
import ExcelJS from 'exceljs';
import type { ReportAssessmentData } from './report.types';

const COLORS = {
  headerBg: 'FF0F1C2E',
  headerFg: 'FFFFFFFF',
  accent: 'FF1F6FEB',
  altRow: 'FFF4F6F8',
  border: 'FFD7DEE8',
  title: 'FF0F1C2E',
  critical: 'FFB91C1C',
  high: 'FFEA580C',
  medium: 'FFCA8A04',
  low: 'FF2563EB',
  info: 'FF64748B',
  pass: 'FF15803D',
  fail: 'FFB91C1C',
  muted: 'FF6B7280',
};

@Injectable()
export class ExcelReportService {
  async generate(data: ReportAssessmentData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'VT Reporting System';
    workbook.created = new Date();
    workbook.modified = new Date();

    this.buildRingkasanSheet(workbook, data);
    this.buildTemuanSheet(workbook, data);
    this.buildDetailTemuanSheet(workbook, data);

    if (data.methodology === Methodology.OWASP) {
      this.buildOwaspSheet(workbook, data);
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  private buildRingkasanSheet(
    workbook: ExcelJS.Workbook,
    data: ReportAssessmentData,
  ) {
    const sheet = workbook.addWorksheet('Ringkasan', {
      views: [{ showGridLines: false }],
    });

    sheet.columns = [
      { key: 'a', width: 28 },
      { key: 'b', width: 55 },
      { key: 'c', width: 18 },
      { key: 'd', width: 14 },
    ];

    const methodLabel =
      data.methodology === Methodology.BURP ? 'Burp Suite' : 'OWASP';

    sheet.mergeCells('A1:D1');
    const title = sheet.getCell('A1');
    title.value = 'LAPORAN PENGUJIAN KERENTANAN (Vulnerability Testing)';
    title.font = { bold: true, size: 16, color: { argb: COLORS.title } };
    title.alignment = { vertical: 'middle' };
    sheet.getRow(1).height = 28;

    sheet.mergeCells('A2:D2');
    const subtitle = sheet.getCell('A2');
    subtitle.value = `Metodologi: ${methodLabel}`;
    subtitle.font = { bold: true, size: 12, color: { argb: COLORS.accent } };

    sheet.mergeCells('A3:D3');
    sheet.getCell('A3').value =
      'Dokumen ini disusun otomatis oleh VT Reporting System. Istilah teknis (severity, status, OWASP, HTTP, dll.) tetap menggunakan istilah baku.';
    sheet.getCell('A3').font = {
      size: 9,
      italic: true,
      color: { argb: COLORS.muted },
    };
    sheet.getCell('A3').alignment = { wrapText: true };
    sheet.getRow(3).height = 32;

    let row = 5;
    sheet.getCell(`A${row}`).value = 'Informasi Assessment';
    this.styleSectionHeader(sheet.getCell(`A${row}`));
    sheet.mergeCells(`A${row}:D${row}`);
    row += 1;

    const meta: Array<[string, string]> = [
      ['Nomor Assessment', data.assessmentNumber],
      ['Nama Project', data.project.name],
      ['Target URL', data.project.targetUrl],
      ['Environment', data.project.environment],
      ['Tester', data.tester],
      ['Status Assessment', data.status],
      [
        'Periode Pengujian',
        this.formatDateRange(data.startDate, data.endDate),
      ],
      ['Jumlah Temuan', String(data.findings.length)],
    ];

    if (data.methodology === Methodology.OWASP) {
      meta.push(['Jumlah Test Case OWASP', String(data.owaspTests.length)]);
    }

    for (const [label, value] of meta) {
      sheet.getCell(`A${row}`).value = label;
      sheet.getCell(`A${row}`).font = { bold: true, size: 10 };
      sheet.getCell(`A${row}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.altRow },
      };
      sheet.mergeCells(`B${row}:D${row}`);
      sheet.getCell(`B${row}`).value = value;
      sheet.getCell(`B${row}`).alignment = { wrapText: true };
      this.applyThinBorder(sheet.getCell(`A${row}`));
      this.applyThinBorder(sheet.getCell(`B${row}`));
      row += 1;
    }

    row += 1;
    sheet.getCell(`A${row}`).value = 'Ringkasan Eksekutif';
    this.styleSectionHeader(sheet.getCell(`A${row}`));
    sheet.mergeCells(`A${row}:D${row}`);
    row += 1;

    const severity = this.countSeverities(data.findings);
    const openCount = data.findings.filter((f) =>
      ['OPEN', 'IN_PROGRESS', 'RETEST'].includes(f.status),
    ).length;

    let summaryText: string;
    if (data.methodology === Methodology.BURP) {
      summaryText =
        `Laporan ini merangkum hasil Vulnerability Testing terhadap aplikasi ${data.project.name} ` +
        `menggunakan metodologi Burp Suite beserta validasi manual. ` +
        `Tercatat ${data.findings.length} temuan (finding), di mana ${openCount} masih berstatus terbuka / perlu retest. ` +
        `Temuan dengan severity Critical dan High sebaiknya diprioritaskan untuk perbaikan.`;
    } else {
      const fail = data.owaspTests.filter((t) => t.result === 'FAIL').length;
      summaryText =
        `Laporan ini merangkum hasil pengujian berbasis OWASP Top 10 terhadap ${data.project.name}. ` +
        `Terdapat ${data.owaspTests.length} test case pada ${data.owaspCategories.length} kategori, ` +
        `dengan ${fail} hasil FAIL yang menghasilkan ${data.findings.length} temuan. ` +
        `Item berstatus NOT TESTED perlu dilanjutkan pada assessment berikutnya.`;
    }

    sheet.mergeCells(`A${row}:D${row + 1}`);
    const summaryCell = sheet.getCell(`A${row}`);
    summaryCell.value = summaryText;
    summaryCell.alignment = { wrapText: true, vertical: 'top' };
    summaryCell.font = { size: 10 };
    sheet.getRow(row).height = 48;
    row += 3;

    sheet.getCell(`A${row}`).value = 'Rekap Severity';
    this.styleSectionHeader(sheet.getCell(`A${row}`));
    sheet.mergeCells(`A${row}:B${row}`);
    row += 1;

    this.writeSimpleTable(
      sheet,
      row,
      ['Severity', 'Jumlah'],
      [
        ['CRITICAL', String(severity.CRITICAL)],
        ['HIGH', String(severity.HIGH)],
        ['MEDIUM', String(severity.MEDIUM)],
        ['LOW', String(severity.LOW)],
        ['INFORMATIONAL', String(severity.INFORMATIONAL)],
      ],
      [0, 1],
    );
    row += 7;

    if (data.methodology === Methodology.OWASP) {
      const stats = this.countTestResults(data.owaspTests);
      sheet.getCell(`A${row}`).value = 'Rekap Hasil Test OWASP';
      this.styleSectionHeader(sheet.getCell(`A${row}`));
      sheet.mergeCells(`A${row}:B${row}`);
      row += 1;
      this.writeSimpleTable(
        sheet,
        row,
        ['Hasil Test', 'Jumlah'],
        [
          ['PASS', String(stats.PASS)],
          ['FAIL', String(stats.FAIL)],
          ['NOT_APPLICABLE', String(stats.NOT_APPLICABLE)],
          ['NOT_TESTED', String(stats.NOT_TESTED)],
          ['Total', String(data.owaspTests.length)],
        ],
        [0, 1],
      );
      row += 7;
    }

    sheet.getCell(`A${row}`).value = 'Kesimpulan';
    this.styleSectionHeader(sheet.getCell(`A${row}`));
    sheet.mergeCells(`A${row}:D${row}`);
    row += 1;

    const conclusion =
      data.methodology === Methodology.BURP
        ? `Assessment Burp Suite pada ${data.project.name} menghasilkan ${data.findings.length} temuan. ` +
          `Disarankan melakukan remediasi bertahap mulai dari severity tertinggi, kemudian retest untuk memastikan perbaikan efektif.`
        : `Assessment OWASP pada ${data.project.name} mencakup kategori Top 10 dengan ${data.findings.length} temuan tercatat. ` +
          `Lengkapi item NOT TESTED dan prioritaskan remediasi temuan Critical/High sebelum rilis produksi.`;

    sheet.mergeCells(`A${row}:D${row + 1}`);
    sheet.getCell(`A${row}`).value = conclusion;
    sheet.getCell(`A${row}`).alignment = { wrapText: true, vertical: 'top' };
    sheet.getRow(row).height = 40;
  }

  private buildTemuanSheet(
    workbook: ExcelJS.Workbook,
    data: ReportAssessmentData,
  ) {
    const sheet = workbook.addWorksheet('Daftar Temuan', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    const includeOwasp = data.methodology === Methodology.OWASP;
    const headers = includeOwasp
      ? [
          'ID',
          'Judul Temuan',
          'Severity',
          'Status',
          'Kategori OWASP',
          'HTTP Method',
          'URL Terdampak',
          'Parameter',
          'Jumlah Evidence',
        ]
      : [
          'ID',
          'Judul Temuan',
          'Severity',
          'Confidence',
          'Status',
          'HTTP Method',
          'URL Terdampak',
          'Parameter',
          'Jumlah Evidence',
        ];

    sheet.columns = headers.map((header, index) => ({
      header,
      key: `c${index}`,
      width: this.columnWidthFor(header),
    }));

    this.styleHeaderRow(sheet.getRow(1));

    data.findings.forEach((finding, index) => {
      const id = `F-${String(index + 1).padStart(3, '0')}`;
      const values = includeOwasp
        ? [
            id,
            finding.title,
            finding.severity,
            finding.status,
            finding.owaspCategory
              ? `${finding.owaspCategory.code} — ${finding.owaspCategory.name}`
              : '—',
            finding.httpMethod ?? '—',
            finding.affectedUrl ?? '—',
            finding.parameter ?? '—',
            finding.evidences.length,
          ]
        : [
            id,
            finding.title,
            finding.severity,
            finding.confidence ?? '—',
            finding.status,
            finding.httpMethod ?? '—',
            finding.affectedUrl ?? '—',
            finding.parameter ?? '—',
            finding.evidences.length,
          ];

      const row = sheet.addRow(values);
      this.styleDataRow(row, index);
      this.colorSeverityCell(row.getCell(3), finding.severity);
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
    });

    if (data.findings.length === 0) {
      const row = sheet.addRow(['—', 'Tidak ada temuan pada assessment ini.', '', '', '', '', '', '', '']);
      this.styleDataRow(row, 0);
    }

    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(1, data.findings.length + 1), column: headers.length },
    };
  }

  private buildDetailTemuanSheet(
    workbook: ExcelJS.Workbook,
    data: ReportAssessmentData,
  ) {
    const sheet = workbook.addWorksheet('Detail Temuan', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    const headers = [
      'ID',
      'Judul Temuan',
      'Severity',
      'Confidence',
      'Status',
      'Kategori OWASP',
      'HTTP Method',
      'URL Terdampak',
      'Parameter',
      'Deskripsi',
      'Dampak (Impact)',
      'Rekomendasi',
      'Referensi',
      'Evidence',
    ];

    sheet.columns = headers.map((header, index) => ({
      header,
      key: `d${index}`,
      width: this.columnWidthFor(header),
    }));

    this.styleHeaderRow(sheet.getRow(1));

    data.findings.forEach((finding, index) => {
      const row = sheet.addRow([
        `F-${String(index + 1).padStart(3, '0')}`,
        finding.title,
        finding.severity,
        finding.confidence ?? '—',
        finding.status,
        finding.owaspCategory
          ? `${finding.owaspCategory.code} — ${finding.owaspCategory.name}`
          : '—',
        finding.httpMethod ?? '—',
        finding.affectedUrl ?? '—',
        finding.parameter ?? '—',
        finding.description ?? '—',
        finding.impact ?? '—',
        finding.recommendation ?? '—',
        finding.reference ?? '—',
        finding.evidences.length > 0
          ? finding.evidences.map((e) => e.fileName).join(', ')
          : 'Tidak ada',
      ]);
      this.styleDataRow(row, index);
      this.colorSeverityCell(row.getCell(3), finding.severity);
      row.height = 60;
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'top', wrapText: true };
      });
    });

    if (data.findings.length === 0) {
      const row = sheet.addRow([
        '—',
        'Tidak ada temuan yang dicatat untuk assessment ini.',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ]);
      this.styleDataRow(row, 0);
    }

    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: {
        row: Math.max(1, data.findings.length + 1),
        column: headers.length,
      },
    };
  }

  private buildOwaspSheet(
    workbook: ExcelJS.Workbook,
    data: ReportAssessmentData,
  ) {
    const sheet = workbook.addWorksheet('Checklist OWASP', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { header: 'Kode', key: 'code', width: 10 },
      { header: 'Kategori OWASP', key: 'name', width: 36 },
      { header: 'PASS', key: 'pass', width: 10 },
      { header: 'FAIL', key: 'fail', width: 10 },
      { header: 'NOT_APPLICABLE', key: 'na', width: 16 },
      { header: 'NOT_TESTED', key: 'nt', width: 14 },
      { header: 'Total Test', key: 'total', width: 12 },
    ];
    this.styleHeaderRow(sheet.getRow(1));

    const summary = this.buildCategorySummary(
      data.owaspCategories,
      data.owaspTests,
    );

    summary.forEach((item, index) => {
      const total =
        item.PASS + item.FAIL + item.NOT_APPLICABLE + item.NOT_TESTED;
      const row = sheet.addRow([
        item.code,
        item.name,
        item.PASS,
        item.FAIL,
        item.NOT_APPLICABLE,
        item.NOT_TESTED,
        total,
      ]);
      this.styleDataRow(row, index);
      row.getCell(3).font = { color: { argb: COLORS.pass }, bold: true };
      row.getCell(4).font = { color: { argb: COLORS.fail }, bold: true };
    });

    let rowIdx = summary.length + 3;
    sheet.getCell(`A${rowIdx}`).value = 'Daftar Test Case';
    this.styleSectionHeader(sheet.getCell(`A${rowIdx}`));
    sheet.mergeCells(`A${rowIdx}:G${rowIdx}`);
    rowIdx += 1;

    const detailHeaders = [
      'Kode Kategori',
      'Nama Kategori',
      'Test Case',
      'Hasil',
    ];
    detailHeaders.forEach((header, i) => {
      const cell = sheet.getCell(rowIdx, i + 1);
      cell.value = header;
    });
    this.styleHeaderRow(sheet.getRow(rowIdx));
    rowIdx += 1;

    const categoryMap = new Map(
      data.owaspCategories.map((c) => [c.id, c] as const),
    );

    data.owaspTests.forEach((test, index) => {
      const category = categoryMap.get(test.categoryId);
      const row = sheet.getRow(rowIdx);
      row.values = [
        category?.code ?? '—',
        category?.name ?? '—',
        test.testCase,
        test.result,
      ];
      this.styleDataRow(row, index);
      if (test.result === 'FAIL') {
        row.getCell(4).font = { color: { argb: COLORS.fail }, bold: true };
      } else if (test.result === 'PASS') {
        row.getCell(4).font = { color: { argb: COLORS.pass }, bold: true };
      }
      rowIdx += 1;
    });

    if (data.owaspTests.length === 0) {
      sheet.getCell(`A${rowIdx}`).value =
        'Belum ada test case OWASP pada assessment ini.';
    }
  }

  private writeSimpleTable(
    sheet: ExcelJS.Worksheet,
    startRow: number,
    headers: string[],
    rows: string[][],
    columns: number[],
  ) {
    headers.forEach((header, i) => {
      const cell = sheet.getCell(startRow, columns[i]! + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: COLORS.headerFg }, size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.headerBg },
      };
      this.applyThinBorder(cell);
    });

    rows.forEach((values, rowIndex) => {
      values.forEach((value, colIndex) => {
        const cell = sheet.getCell(
          startRow + 1 + rowIndex,
          columns[colIndex]! + 1,
        );
        cell.value = value;
        if (rowIndex % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLORS.altRow },
          };
        }
        this.applyThinBorder(cell);
        if (colIndex === 0 && headers[0] === 'Severity') {
          this.colorSeverityCell(cell, value);
        }
      });
    });
  }

  private styleSectionHeader(cell: ExcelJS.Cell) {
    cell.font = { bold: true, size: 12, color: { argb: COLORS.headerFg } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.accent },
    };
    cell.alignment = { vertical: 'middle' };
  }

  private styleHeaderRow(row: ExcelJS.Row) {
    row.height = 22;
    row.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: COLORS.headerFg }, size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.headerBg },
      };
      cell.alignment = { vertical: 'middle', wrapText: true };
      this.applyThinBorder(cell);
    });
  }

  private styleDataRow(row: ExcelJS.Row, index: number) {
    row.eachCell((cell) => {
      if (index % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLORS.altRow },
        };
      }
      this.applyThinBorder(cell);
      cell.font = { size: 10 };
    });
  }

  private applyThinBorder(cell: ExcelJS.Cell) {
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.border } },
      left: { style: 'thin', color: { argb: COLORS.border } },
      bottom: { style: 'thin', color: { argb: COLORS.border } },
      right: { style: 'thin', color: { argb: COLORS.border } },
    };
  }

  private colorSeverityCell(cell: ExcelJS.Cell, severity: string) {
    const map: Record<string, string> = {
      CRITICAL: COLORS.critical,
      HIGH: COLORS.high,
      MEDIUM: COLORS.medium,
      LOW: COLORS.low,
      INFORMATIONAL: COLORS.info,
    };
    const color = map[severity];
    if (color) {
      cell.font = { bold: true, color: { argb: color }, size: 10 };
    }
  }

  private columnWidthFor(header: string): number {
    const widths: Record<string, number> = {
      ID: 8,
      'Judul Temuan': 36,
      Severity: 14,
      Confidence: 12,
      Status: 14,
      'Kategori OWASP': 28,
      'HTTP Method': 12,
      'URL Terdampak': 40,
      Parameter: 16,
      'Jumlah Evidence': 14,
      Deskripsi: 45,
      'Dampak (Impact)': 35,
      Rekomendasi: 40,
      Referensi: 28,
      Evidence: 28,
    };
    return widths[header] ?? 18;
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
