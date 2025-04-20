import { Controller, Get, Query } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageListDto } from './dto/message.dto';
import { RequireLogin, UserInfo } from '../custom.decorator';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) { }

  @Get('list')
  @RequireLogin()
  async messageList(
    @Query() messageListDto: MessageListDto,
    @UserInfo('id') userId: number,
  ) {
    return await this.messageService.messageList(messageListDto, userId);
  }

  @Get('read')
  @RequireLogin()
  async markAsRead(@Query('id') id: string) {
    return await this.messageService.markAsRead(id);
  }

  @Get('readAll')
  @RequireLogin()
  async markAllAsRead(@UserInfo('id') userId: number) {
    return await this.messageService.markAllAsRead(userId);
  }
}
