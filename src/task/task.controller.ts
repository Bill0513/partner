import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskService } from './task.service';
import { RequireLogin, UserInfo } from 'src/custom.decorator';

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

  @Get()
  findAll() {
    return this.taskService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(+id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskService.remove(+id);
  }
}
