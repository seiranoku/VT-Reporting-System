import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateOwaspTestDto } from './create-owasp-test.dto';

export class UpdateOwaspTestDto extends PartialType(
  OmitType(CreateOwaspTestDto, ['assessmentId', 'categoryId'] as const),
) {}
