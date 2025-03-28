import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common.dto';

export class TaskFindAllDto extends PaginationDto {
  @IsString()
  @IsIn(['high', 'medium', 'low'])
  priority: 'high' | 'medium' | 'low';

  @IsOptional()
  @IsBoolean()
  onlyMe?: boolean;
}
