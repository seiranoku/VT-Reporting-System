import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateFindingDto } from './create-finding.dto';

export class UpdateFindingDto extends PartialType(
  OmitType(CreateFindingDto, ['assessmentId'] as const),
) {}
