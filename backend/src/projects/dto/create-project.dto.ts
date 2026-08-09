import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'SIMPEG' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: 'Sistem Informasi Kepegawaian' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 'https://simpeg.example.go.id' })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  targetUrl!: string;

  @ApiProperty({ example: 'Production' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  environment!: string;
}
