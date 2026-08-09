import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD',
] as const;

export class StartScanDto {
  @ApiPropertyOptional({
    description: 'Existing project id. If omitted, a new project is created.',
  })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ example: 'Data Service - Post Pengajuan' })
  @ValidateIf((o: StartScanDto) => !o.projectId)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 'https://api.example.com/v1/resource' })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  @MaxLength(2000)
  targetUrl!: string;

  @ApiPropertyOptional({ example: 'Development', default: 'Development' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  environment?: string;

  @ApiProperty({
    enum: HTTP_METHODS,
    example: 'POST',
    default: 'GET',
  })
  @IsOptional()
  @IsIn(HTTP_METHODS)
  httpMethod?: (typeof HTTP_METHODS)[number];

  @ApiPropertyOptional({
    description: 'Request headers as key/value object',
    example: { Authorization: 'Bearer …', 'Content-Type': 'application/json' },
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Raw request body (JSON string for POST/PUT/PATCH)',
    example: '{"nama":"test","nik":"123"}',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100_000)
  body?: string;

  @ApiPropertyOptional({ example: 'Auto Scanner', default: 'Auto Scanner' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tester?: string;
}
