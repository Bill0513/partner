import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty } from 'class-validator';
import { PaginationDto } from 'src/common.dto';

export class RewardFindAllDto extends PaginationDto {
  @IsNotEmpty()
  @IsBoolean()
  @Type(() => Boolean)
  isMy: boolean;
}
