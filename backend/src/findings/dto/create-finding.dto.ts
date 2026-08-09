import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Confidence, FindingStatus, Severity } from '@prisma/client';

export class CreateFindingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  assessmentId!: string;

  @ApiProperty({ example: 'SQL Injection' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title!: string;

  @ApiProperty({ enum: Severity })
  @IsEnum(Severity)
  severity!: Severity;

  @ApiPropertyOptional({ enum: Confidence })
  @IsOptional()
  @IsEnum(Confidence)
  confidence?: Confidence;

  @ApiPropertyOptional({ example: 'https://example.local/login' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  affectedUrl?: string;

  @ApiPropertyOptional({ example: 'POST' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  httpMethod?: string;

  @ApiPropertyOptional({ example: 'username' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  parameter?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  impact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  recommendation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reference?: string;

  @ApiPropertyOptional({ enum: FindingStatus })
  @IsOptional()
  @IsEnum(FindingStatus)
  status?: FindingStatus;

  @ApiPropertyOptional({ description: 'OWASP category id (required for OWASP assessments)' })
  @IsOptional()
  @IsString()
  owaspCategoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  owaspTestId?: string;

  @ApiPropertyOptional({ example: 7.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  cvssScore?: number;

  @ApiPropertyOptional({ example: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cvssVector?: string;
}
