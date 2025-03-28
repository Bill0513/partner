import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubTask } from './entities/sub_task.entity';
import { CreateSubTaskDto } from './dto/create-sub_task.dto';
import { UpdateSubTaskDto } from './dto/update-sub_task.dto';

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

  async update(
    updateSubTaskDto: UpdateSubTaskDto,
    taskId: number,
    userId: number,
    userName: string,
  ) {
    const { id, title, description } = updateSubTaskDto;

    if (id) {
      const subTask = await this.subTaskRepository.findOne({
        where: {
          id,
        },
      });

      subTask.title = title;
      subTask.description = description;
      subTask.taskId = taskId;
      subTask.updateby = userId;
      subTask.updateName = userName;

      await this.subTaskRepository.save(subTask);
    } else {
      const tmpSubTask = this.subTaskRepository.create();
      tmpSubTask.title = title;
      tmpSubTask.description = description;
      tmpSubTask.taskId = taskId;
      tmpSubTask.updateby = userId;
      tmpSubTask.updateName = userName;

      await this.subTaskRepository.save(tmpSubTask);
    }

    return true;
  }

  async findByTaskId(taskId: number) {
    return await this.subTaskRepository.find({
      where: {
        taskId,
      },
    });
  }

  async remove(id: number) {
    const subTask = await this.subTaskRepository.findOne({
      where: {
        id,
      },
    });

    if (subTask) {
      await this.subTaskRepository.remove(subTask);
    }
    return true;
  }
}
