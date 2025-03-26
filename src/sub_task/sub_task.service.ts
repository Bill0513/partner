import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubTask } from './entities/sub_task.entity';
import { CreateSubTaskDto } from './dto/create-sub_task.dto';

@Injectable()
export class SubTaskService {
  constructor(
    @InjectRepository(SubTask)
    private readonly subTaskRepository: Repository<SubTask>,
  ) {}
  async create(
    createSubTaskDto: CreateSubTaskDto,
    taskId: number,
    userId: number,
    userName: string,
  ) {
    try {
      const { title, description } = createSubTaskDto;
      const tempSubTask = this.subTaskRepository.create();
      tempSubTask.title = title;
      tempSubTask.description = description;
      tempSubTask.status = 'pending';
      tempSubTask.taskId = taskId;
      tempSubTask.createby = userId;
      tempSubTask.createName = userName;
      const subTask = await this.subTaskRepository.save(tempSubTask);
      return subTask.id;
    } catch (error) {
      throw new Error('创建子任务失败'); // 抛出异常
    }
  }

  findAll() {
    return `This action returns all subTask`;
  }

  findOne(id: number) {
    return `This action returns a #${id} subTask`;
  }

  update(id: number) {
    return `This action updates a #${id} subTask`;
  }

  remove(id: number) {
    return `This action removes a #${id} subTask`;
  }
}
