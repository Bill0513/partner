import { Controller } from '@nestjs/common';
import { SubTaskService } from './sub_task.service';

@Controller('sub-task')
export class SubTaskController {
  constructor(private readonly subTaskService: SubTaskService) {}
}
