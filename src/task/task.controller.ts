import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskService } from './task.service';
import { RequireLogin, UserInfo } from 'src/custom.decorator';
import { TaskFindAllDto } from './dto/task.dto';

@Controller('task')
export class TaskController {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly taskService: TaskService) {}

  @RequireLogin()
  @Post('create')
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @UserInfo('id') userId,
    @UserInfo('nickname') nickname,
  ) {
    return await this.taskService.create(createTaskDto, userId, nickname);
  }

  @Get('list')
  @RequireLogin()
  async list(@Query() queryDto: TaskFindAllDto, @UserInfo('id') userId) {
    return await this.taskService.list(queryDto, userId);
  }

  @Get('detail')
  @RequireLogin()
  async detail(@Query('id') id: number) {
    return await this.taskService.detail(id);
  }

  @Post(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @UserInfo('id') userId: number,
    @UserInfo('nickname') nickname,
  ) {
    return this.taskService.update(id, updateTaskDto, userId, nickname);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskService.remove(+id);
  }
}
