import { IsOptional, IsString } from 'class-validator';

export class CreateSubTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
