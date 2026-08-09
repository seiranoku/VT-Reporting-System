import { Controller, Get, Param, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportService } from './report.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportService: ReportService) {}

  @Get(':assessmentId')
  @ApiOperation({ summary: 'Preview report metadata for an assessment' })
  getMetadata(@Param('assessmentId') assessmentId: string) {
    return this.reportService.getMetadata(assessmentId);
  }

  @Get(':assessmentId/pdf')
  @ApiOperation({ summary: 'Generate and download PDF report' })
  @ApiProduces('application/pdf')
  async downloadPdfGet(
    @Param('assessmentId') assessmentId: string,
    @Res() res: Response,
  ) {
    return this.sendPdf(assessmentId, res);
  }

  @Post(':assessmentId/pdf')
  @ApiOperation({ summary: 'Generate PDF report (POST)' })
  @ApiProduces('application/pdf')
  async downloadPdfPost(
    @Param('assessmentId') assessmentId: string,
    @Res() res: Response,
  ) {
    return this.sendPdf(assessmentId, res);
  }

  private async sendPdf(assessmentId: string, res: Response) {
    const { buffer, filename } =
      await this.reportService.generatePdf(assessmentId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }
}
