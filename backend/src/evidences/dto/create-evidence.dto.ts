import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEvidenceDto {
  @ApiProperty({ description: 'Finding ID to attach evidence to' })
  @IsString()
  @IsNotEmpty()
  findingId!: string;
}
