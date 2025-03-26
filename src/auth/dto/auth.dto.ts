import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';

export class AuthUserDto {
  @ApiProperty({ description: '用户名', required: true })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @ApiProperty({ description: '密码', required: true })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;

  @IsString()
  @Length(1, 10, { message: '昵称长度1-10位' })
  @IsNotEmpty({ message: '昵称不能为空' })
  nickname: string;

  @IsNumber()
  @IsNotEmpty({ message: '性别不能为空' })
  sex: number;
}
