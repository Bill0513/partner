import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';
import { PaginationDto } from 'src/common.dto';

export class RewardFindAllDto extends PaginationDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  isMy: number;
}
