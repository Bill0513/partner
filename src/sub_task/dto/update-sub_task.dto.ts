import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateSubTaskDto {
  @IsInt()
  @IsOptional()
  id?: number;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
