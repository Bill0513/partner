import { Controller, Get, Query } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageListDto } from './dto/message.dto';
import { RequireLogin, UserInfo } from 'src/custom.decorator';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('list')
  @RequireLogin()
  async messageList(
    @Query() messageListDto: MessageListDto,
    @UserInfo('id') userId: number,
  ) {
    return await this.messageService.messageList(messageListDto, userId);
  }
}
