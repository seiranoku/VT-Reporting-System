import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AssessmentStatus, Methodology } from '@prisma/client';

export class CreateAssessmentDto {
  @ApiProperty({ example: 'cmsl9wzio0000pd01f72h3ids' })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({ example: 'VT-2026-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  assessmentNumber!: string;

  @ApiProperty({ enum: Methodology, example: Methodology.BURP })
  @IsEnum(Methodology)
  methodology!: Methodology;

  @ApiProperty({ example: 'Security Team' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  tester!: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-05' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Initial Burp Suite assessment' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    enum: AssessmentStatus,
    example: AssessmentStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(AssessmentStatus)
  status?: AssessmentStatus;
}
