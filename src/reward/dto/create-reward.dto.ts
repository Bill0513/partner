import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRuleDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}

export class CreateRewardDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  @IsNotEmpty()
  reward: number;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  startDate: string;

  @IsString()
  @IsOptional()
  endDate: string;

  @IsEnum(['permanent', 'limited'])
  validity: 'permanent' | 'limited';

  rules: CreateRuleDto[];
}
