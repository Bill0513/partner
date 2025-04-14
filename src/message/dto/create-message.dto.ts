// src/message/dto/create-message.dto.ts
import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { MessageType } from 'src/constants';

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
}
