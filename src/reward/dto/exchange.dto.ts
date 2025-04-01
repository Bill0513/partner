import { IsInt, IsNotEmpty } from 'class-validator';

export class ExchangeDto {
  @IsInt()
  @IsNotEmpty()
  id: number;
}
