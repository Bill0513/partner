import { IsInt, IsNotEmpty } from 'class-validator';

export class RemoveRewardDto {
  @IsInt()
  @IsNotEmpty()
  id: number;
}
