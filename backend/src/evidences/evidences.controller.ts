import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { EvidencesService } from './evidences.service';

@ApiTags('evidences')
@Controller('evidences')
export class EvidencesController {
  constructor(private readonly evidencesService: EvidencesService) {}

  @Get()
  @ApiOperation({ summary: 'List evidences for a finding' })
  @ApiQuery({ name: 'findingId', required: true })
  findByFinding(@Query('findingId') findingId: string) {
    return this.evidencesService.findByFinding(findingId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get evidence metadata' })
  findOne(@Param('id') id: string) {
    return this.evidencesService.findOne(id);
  }

  @Get(':id/file')
  @ApiOperation({ summary: 'Download evidence file' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const { evidence, stream } = await this.evidencesService.getFileStream(id);
    res.setHeader('Content-Type', evidence.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(evidence.fileName)}"`,
    );
    stream.pipe(res);
  }

  @Post()
  @ApiOperation({ summary: 'Upload evidence for a finding' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['findingId', 'file'],
      properties: {
        findingId: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  create(
    @Body() dto: CreateEvidenceDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.evidencesService.create(dto.findingId, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete evidence' })
  remove(@Param('id') id: string) {
    return this.evidencesService.remove(id);
  }
}
