import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateSubTaskDto {
  @IsInt()
  id: number;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
