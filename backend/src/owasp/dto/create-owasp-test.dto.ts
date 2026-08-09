import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { OwaspTestResult } from '@prisma/client';

export class CreateOwaspTestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  assessmentId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiProperty({ example: 'Vertical privilege escalation via IDOR' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  testCase!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  testObjective?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  testProcedure?: string;

  @ApiPropertyOptional({ enum: OwaspTestResult })
  @IsOptional()
  @IsEnum(OwaspTestResult)
  result?: OwaspTestResult;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
