import { Controller, Get, Query } from '@nestjs/common';
import { SubTaskService } from './sub_task.service';
import { RequireLogin, UserInfo } from 'src/custom.decorator';

@Controller('sub-task')
export class SubTaskController {
  constructor(private readonly subTaskService: SubTaskService) {}

  @Get('complete')
  @RequireLogin()
  async complete(
    @Query('id') id: number,
    @UserInfo('id') userId: number,
    @UserInfo('nickname') userName: string,
  ) {
    return await this.subTaskService.complete(id, userId, userName);
  }
}
