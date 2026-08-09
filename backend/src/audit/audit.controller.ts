import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';

@ApiTags('audit')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List recent audit logs' })
  @ApiQuery({ name: 'limit', required: false })
  findRecent(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 50;
    return this.auditService.findRecent(
      Number.isFinite(parsed) ? parsed : 50,
    );
  }
}
