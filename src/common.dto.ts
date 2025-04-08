import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  size?: number = 10;

  @IsOptional()
  @IsString()
  sort?: string = 'createdAt';
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}

export interface PaginatedResult<T> {
  list: T[];
  meta: {
    total: number;
    page: number;
    size: number;
    isLast: number;
  };
}
