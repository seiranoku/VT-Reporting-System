import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StartScanDto } from './dto/start-scan.dto';
import { ScansService } from './scans.service';

@ApiTags('scans')
@Controller('scans')
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post('start')
  @ApiOperation({
    summary:
      'Create/reuse a project, probe the API endpoint, and auto-fill Burp + OWASP assessments',
  })
  start(@Body() dto: StartScanDto) {
    return this.scansService.start(dto);
  }
}
