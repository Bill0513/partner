import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from 'src/common.dto';

export class TaskFindAllDto extends PaginationDto {
  @IsString()
  @IsIn(['high', 'medium', 'low'])
  priority: 'high' | 'medium' | 'low';

  @IsOptional()
  @IsBoolean()
  onlyMe?: boolean;
}

export class RemoveTaskDto {
  @IsInt()
  @IsNotEmpty()
  id: number;
}

export class CompletedTaskDto {
  @IsInt()
  @IsNotEmpty()
  id: number;
}
