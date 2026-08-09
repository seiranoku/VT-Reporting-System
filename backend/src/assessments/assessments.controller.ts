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
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { AssessmentsService } from './assessments.service';

@ApiTags('assessments')
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List assessments' })
  @ApiQuery({ name: 'projectId', required: false })
  findAll(@Query('projectId') projectId?: string) {
    return this.assessmentsService.findAll(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assessment by id' })
  findOne(@Param('id') id: string) {
    return this.assessmentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create assessment (BURP or OWASP)' })
  create(@Body() dto: CreateAssessmentDto) {
    return this.assessmentsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update assessment' })
  update(@Param('id') id: string, @Body() dto: UpdateAssessmentDto) {
    return this.assessmentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete assessment' })
  remove(@Param('id') id: string) {
    return this.assessmentsService.remove(id);
  }
}
