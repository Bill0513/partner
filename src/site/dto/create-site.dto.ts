import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength } from 'class-validator';

export class CreateSiteDto {
  @IsNotEmpty({
    message: '网站名称不能为空',
  })
  @MaxLength(50, {
    message: '网站名称最长为 50 字符',
  })
  @ApiProperty()
  title: string;

  @MaxLength(255, {
    message: '网站描述最长为 255 字符',
  })
  @ApiProperty()
  desc: string;

  @IsNotEmpty({
    message: '网站地址不能为空',
  })
  @MaxLength(255, {
    message: '网站地址最长为 255 字符',
  })
  @ApiProperty()
  url: string;
}
