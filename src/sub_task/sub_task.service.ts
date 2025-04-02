import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubTask } from './entities/sub_task.entity';
import { CreateSubTaskDto } from './dto/create-sub_task.dto';
import { UpdateSubTaskDto } from './dto/update-sub_task.dto';
import { errorHandler } from 'src/utils';

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
      errorHandler(error);
    }
  }

  async update(
    updateSubTaskDto: UpdateSubTaskDto,
    taskId: number,
    userId: number,
    userName: string,
  ) {
    try {
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
        tmpSubTask.createby = userId;
        tmpSubTask.createName = userName;
        tmpSubTask.updateby = userId;
        tmpSubTask.updateName = userName;

        await this.subTaskRepository.save(tmpSubTask);
      }

      return true;
    } catch (error) {
      errorHandler(error);
    }
  }

  async findByTaskId(taskId: number) {
    try {
      return await this.subTaskRepository.find({
        where: {
          taskId,
        },
      });
    } catch (error) {
      errorHandler(error);
    }
  }

  async remove(id: number) {
    try {
      const subTask = await this.subTaskRepository.findOne({
        where: {
          id,
        },
      });

      if (subTask) {
        await this.subTaskRepository.remove(subTask);
      }
      return true;
    } catch (error) {
      errorHandler(error);
    }
  }

  async complete(id: number, userId: number, userName: string) {
    try {
      const subTask = await this.subTaskRepository.findOne({
        where: {
          id,
        },
      });

      if (!subTask) {
        throw new BadRequestException('子任务不存在');
      }

      subTask.status = 'completed';
      subTask.updateby = userId;
      subTask.updateName = userName;
      await this.subTaskRepository.save(subTask);
      return true;
    } catch (error) {
      errorHandler(error);
    }
  }
}
