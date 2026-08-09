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
import { CreateFindingDto } from './dto/create-finding.dto';
import { UpdateFindingDto } from './dto/update-finding.dto';
import { FindingsService } from './findings.service';

@ApiTags('findings')
@Controller('findings')
export class FindingsController {
  constructor(private readonly findingsService: FindingsService) {}

  @Get()
  @ApiOperation({ summary: 'List findings' })
  @ApiQuery({ name: 'assessmentId', required: false })
  findAll(@Query('assessmentId') assessmentId?: string) {
    return this.findingsService.findAll(assessmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get finding by id' })
  findOne(@Param('id') id: string) {
    return this.findingsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create finding' })
  create(@Body() dto: CreateFindingDto) {
    return this.findingsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update finding' })
  update(@Param('id') id: string, @Body() dto: UpdateFindingDto) {
    return this.findingsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete finding' })
  remove(@Param('id') id: string) {
    return this.findingsService.remove(id);
  }
}
