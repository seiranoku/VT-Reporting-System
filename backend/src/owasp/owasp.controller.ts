import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateOwaspTestDto } from './dto/create-owasp-test.dto';
import { UpdateOwaspTestDto } from './dto/update-owasp-test.dto';
import { OwaspService } from './owasp.service';

@ApiTags('owasp')
@Controller('owasp')
export class OwaspController {
  constructor(private readonly owaspService: OwaspService) {}

  @Get('categories')
  @ApiOperation({ summary: 'List OWASP Top 10 categories' })
  findCategories() {
    return this.owaspService.findCategories();
  }

  @Get('checklist/:assessmentId')
  @ApiOperation({ summary: 'OWASP checklist for an assessment (A01–A10 + tests)' })
  getChecklist(@Param('assessmentId') assessmentId: string) {
    return this.owaspService.getAssessmentChecklist(assessmentId);
  }

  @Get('tests')
  @ApiOperation({ summary: 'List OWASP tests for an assessment' })
  @ApiQuery({ name: 'assessmentId', required: true })
  @ApiQuery({ name: 'categoryId', required: false })
  findTests(
    @Query('assessmentId') assessmentId: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.owaspService.findTests(assessmentId, categoryId);
  }

  @Get('tests/:id')
  @ApiOperation({ summary: 'Get OWASP test by id' })
  findOneTest(@Param('id') id: string) {
    return this.owaspService.findOneTest(id);
  }

  @Post('tests')
  @ApiOperation({ summary: 'Create OWASP test' })
  createTest(@Body() dto: CreateOwaspTestDto) {
    return this.owaspService.createTest(dto);
  }

  @Put('tests/:id')
  @ApiOperation({ summary: 'Update OWASP test' })
  updateTest(@Param('id') id: string, @Body() dto: UpdateOwaspTestDto) {
    return this.owaspService.updateTest(id, dto);
  }

  @Delete('tests/:id')
  @ApiOperation({ summary: 'Delete OWASP test' })
  removeTest(@Param('id') id: string) {
    return this.owaspService.removeTest(id);
  }
}
