import { IsInt, IsNotEmpty } from 'class-validator';
import { PaginationDto } from '../../common.dto';

export class ExchangeDto {
  @IsInt()
  @IsNotEmpty()
  id: number;
}

export class ExchangeListDto extends PaginationDto { }

export enum OperationType {
  CONFIRM = 'CONFIRM',
  COMPLETED = 'COMPLETED',
  REJECT = 'REJECT',
}

export class ExchangeOperationDto {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsNotEmpty()
  type: OperationType;
}
