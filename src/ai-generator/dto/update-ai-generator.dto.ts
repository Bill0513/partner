import { PartialType } from '@nestjs/swagger';
import { CreateAiGeneratorDto } from './create-ai-generator.dto';

export class UpdateAiGeneratorDto extends PartialType(CreateAiGeneratorDto) {}
