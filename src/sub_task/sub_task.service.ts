import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubTask } from './entities/sub_task.entity';
import { CreateSubTaskDto } from './dto/create-sub_task.dto';
import { UpdateSubTaskDto } from './dto/update-sub_task.dto';
import { errorHandler } from '../utils';
import { Task } from 'src/task/entities/task.entity';
import { BusinessException } from 'src/business-exception';
import { SUB_TASK_CONSTANT, TASK_CONSTANT } from 'src/constants';

@Injectable()
export class SubTaskService {
  constructor(
    @InjectRepository(SubTask)
    private readonly subTaskRepository: Repository<SubTask>,
  ) { }
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
    const queryRunner =
      await this.subTaskRepository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const subTask = await queryRunner.manager.findOne(SubTask, {
        where: {
          id,
        },
      });

      if (!subTask) {
        return BusinessException.notFound(SUB_TASK_CONSTANT.NOT_FOUND);
      }

      subTask.status = 'completed';
      subTask.updateby = userId;
      subTask.updateName = userName;
      await queryRunner.manager.update(SubTask, subTask.id, subTask);

      const task = await queryRunner.manager.findOne(Task, {
        where: {
          id: subTask.taskId,
        },
      });

      task.status = 'in-progress';
      task.updateby = userId;
      task.updateName = userName;

      if (!task) {
        return BusinessException.notFound(TASK_CONSTANT.NOT_FOUND);
      }

      await queryRunner.manager.update(Task, task.id, task);

      await queryRunner.commitTransaction();

      return true;
    } catch (error) {
      errorHandler(error);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
}
