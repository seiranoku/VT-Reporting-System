import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'API root' })
  getRoot() {
    return this.appService.getRoot();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check including database connectivity' })
  getHealth() {
    return this.appService.getHealth();
  }
}
