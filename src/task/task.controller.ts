import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Request,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskService } from './task.service';
import { RequireLogin } from 'src/custom.decorator';

@Controller('task')
export class TaskController {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly taskService: TaskService) {}

  @RequireLogin()
  @Post('create')
  async create(@Body() createTaskDto: CreateTaskDto, @Req() req: Request) {
    return await this.taskService.create(
      createTaskDto,
      req['user'].id,
      req['user'].nickname,
    );
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
