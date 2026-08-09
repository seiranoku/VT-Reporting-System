import { Module } from '@nestjs/common';
import { BurpReportService } from './burp-report.service';
import { OwaspReportService } from './owasp-report.service';
import { PdfService } from './pdf.service';
import { ReportService } from './report.service';
import { ReportsController } from './reports.controller';

@Module({
  controllers: [ReportsController],
  providers: [
    PdfService,
    BurpReportService,
    OwaspReportService,
    ReportService,
  ],
  exports: [ReportService],
})
export class ReportsModule {}
