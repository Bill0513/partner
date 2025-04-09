import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class UpdateAvatarDto {
  @IsNotEmpty()
  @IsInt()
  id: number;

  @IsString()
  @IsNotEmpty()
  avatar: string;
}
