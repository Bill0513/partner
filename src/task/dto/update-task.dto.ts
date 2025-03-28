import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { UpdateSubTaskDto } from 'src/sub_task/dto/update-sub_task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  subTasks?: UpdateSubTaskDto[];
}
