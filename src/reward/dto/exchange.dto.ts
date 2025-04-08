import { IsInt, IsNotEmpty } from 'class-validator';
import { PaginationDto } from 'src/common.dto';

export class ExchangeDto {
  @IsInt()
  @IsNotEmpty()
  id: number;
}

export class ExchangeListDto extends PaginationDto {}
