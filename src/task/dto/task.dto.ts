import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from '../../common.dto';

export class TaskFindAllDto extends PaginationDto {
  @IsString()
  @IsIn(['pending', 'in-progress', 'completed'])
  status: 'pending' | 'in-progress' | 'completed';

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
