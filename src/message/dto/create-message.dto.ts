import { Optional } from '@nestjs/common';
import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { MessageType } from '../../constants';

export class CreateMessageDto {
  @IsEnum(MessageType)
  type: MessageType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsInt()
  @IsNotEmpty()
  userId: number;

  @Optional()
  condition?: Record<string, any>;
}
