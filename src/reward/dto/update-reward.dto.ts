import { PartialType } from '@nestjs/swagger';
import { CreateRewardDto, CreateRuleDto } from './create-reward.dto';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateRuleDto extends CreateRuleDto {
  @IsInt()
  @IsOptional()
  id: number;
}

export class UpdateRewardDto extends PartialType(CreateRewardDto) {
  @IsInt()
  @IsNotEmpty()
  id: number;

  rules: UpdateRuleDto[];
}
