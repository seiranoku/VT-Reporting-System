import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export type PdfDoc = InstanceType<typeof PDFDocument>;

@Injectable()
export class PdfService {
  createDocument(): PdfDoc {
    return new PDFDocument({
      size: 'A4',
      margins: { top: 56, bottom: 56, left: 50, right: 50 },
      bufferPages: true,
      info: {
        Title: 'Vulnerability Testing Report',
        Author: 'VT Reporting System',
      },
    });
  }

  async collectBuffer(doc: PdfDoc): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }

  drawHeaderFooter(doc: PdfDoc, subtitle: string) {
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);

      doc
        .fontSize(8)
        .fillColor('#666666')
        .text('VT Reporting System', 50, 24, { lineBreak: false })
        .text(subtitle, 50, 24, {
          align: 'right',
          width: doc.page.width - 100,
          lineBreak: false,
        });

      doc
        .moveTo(50, 40)
        .lineTo(doc.page.width - 50, 40)
        .strokeColor('#cccccc')
        .stroke();

      const pageLabel = `Page ${i + 1} of ${range.count}`;
      doc
        .fontSize(8)
        .fillColor('#666666')
        .text(pageLabel, 50, doc.page.height - 36, {
          align: 'center',
          width: doc.page.width - 100,
          lineBreak: false,
        });
    }
  }

  coverPage(
    doc: PdfDoc,
    title: string,
    methodologyLabel: string,
    fields: Array<{ label: string; value: string }>,
  ) {
    doc
      .fontSize(22)
      .fillColor('#0f1c2e')
      .text('VULNERABILITY TESTING REPORT', { align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(16).fillColor('#1f6feb').text(methodologyLabel, {
      align: 'center',
    });

    doc.moveDown(2);
    doc.fontSize(11).fillColor('#333333');

    for (const field of fields) {
      doc
        .font('Helvetica-Bold')
        .text(`${field.label}: `, { continued: true })
        .font('Helvetica')
        .text(field.value || '—');
      doc.moveDown(0.35);
    }

    doc.addPage();
  }

  sectionTitle(doc: PdfDoc, text: string) {
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor('#0f1c2e').font('Helvetica-Bold').text(text);
    doc
      .moveTo(50, doc.y + 2)
      .lineTo(doc.page.width - 50, doc.y + 2)
      .strokeColor('#1f6feb')
      .lineWidth(1)
      .stroke();
    doc.moveDown(0.8);
    doc.font('Helvetica').fillColor('#333333').fontSize(10);
  }

  bodyText(doc: PdfDoc, text: string) {
    doc.font('Helvetica').fontSize(10).fillColor('#333333').text(text, {
      align: 'justify',
      lineGap: 2,
    });
    doc.moveDown(0.6);
  }

  keyValue(doc: PdfDoc, label: string, value: string) {
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#222222')
      .text(`${label}: `, { continued: true })
      .font('Helvetica')
      .fillColor('#333333')
      .text(value || '—');
    doc.moveDown(0.25);
  }

  ensureSpace(doc: PdfDoc, needed: number) {
    if (doc.y + needed > doc.page.height - 60) {
      doc.addPage();
    }
  }

  simpleTable(
    doc: PdfDoc,
    headers: string[],
    rows: string[][],
    colWidths: number[],
  ) {
    const startX = 50;
    const rowHeight = 18;
    const drawRow = (cells: string[], bold: boolean, y: number) => {
      let x = startX;
      cells.forEach((cell, i) => {
        doc
          .font(bold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8)
          .fillColor('#222222')
          .text(cell, x + 3, y + 4, {
            width: colWidths[i] - 6,
            height: rowHeight - 4,
            ellipsis: true,
          });
        x += colWidths[i];
      });
    };

    this.ensureSpace(doc, rowHeight * (rows.length + 2));
    let y = doc.y;
    drawRow(headers, true, y);
    y += rowHeight;
    doc
      .moveTo(startX, y)
      .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y)
      .strokeColor('#999999')
      .stroke();

    for (const row of rows) {
      if (y + rowHeight > doc.page.height - 60) {
        doc.addPage();
        y = doc.y;
        drawRow(headers, true, y);
        y += rowHeight;
      }
      drawRow(row, false, y);
      y += rowHeight;
    }

    doc.y = y + 8;
  }
}
