import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { SubTaskService } from 'src/sub_task/sub_task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private subTaskService: SubTaskService,
  ) {}
  async create(createTaskDto: CreateTaskDto, userId: number, userName: string) {
    const queryRunner =
      this.taskRepository.manager.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const task = await this.taskRepository.create();
      const {
        title,
        description,
        date,
        time,
        priority,
        reward,
        location,
        subTasks,
      } = createTaskDto;
      task.title = title;
      task.description = description;
      task.date = date;
      task.time = time;
      task.priority = priority;
      task.reward = reward;
      task.location = location || null;
      task.createby = userId;
      task.createName = userName;

      const result = await queryRunner.manager.save(task);

      if (subTasks) {
        // 使用同一个事务处理子任务
        for (const subTask of subTasks) {
          // 如果子任务创建失败，会抛出异常并被外层catch捕获
          // 然后整个事务（包括主任务和已创建的子任务）都会被回滚
          await this.subTaskService.create(
            subTask,
            result.id,
            userId,
            userName,
          );
        }
      }

      // 所有操作成功后提交事务
      await queryRunner.commitTransaction();
      return result.id;
    } catch (error) {
      // 当任何错误发生时（包括子任务创建错误），
      // 回滚整个事务，这会撤销所有数据库更改，
      // 包括主任务和所有已创建的子任务
      await queryRunner.rollbackTransaction();
      throw new Error(error);
    } finally {
      await queryRunner.release();
    }
  }

  async findRecentlyInfo(userId: number) {
    try {
      const [completedList, completedNum] =
        await this.taskRepository.findAndCount({
          select: {
            id: true,
            title: true,
            updatetime: true,
            status: true,
            reward: true,
            priority: true,
          },
          where: {
            status: 'completed',
            updateby: userId,
          },
          order: {
            updatetime: 'DESC',
          },
        });

      const total = await this.taskRepository.findAndCount({
        where: {
          updateby: userId,
        },
      });

      // 确保 rate 最低为 0，不为 null 或 NaN
      const rate = total[1] > 0 ? (completedNum / total[1]) * 100 : 0;

      const recentlyList = completedList.slice(0, 3);

      return {
        rate,
        completedNum,
        recentlyList,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  findAll() {
    return `This action returns all task`;
  }

  findOne(id: number) {
    return `This action returns a #${id} task`;
  }

  update(id: number, updateTaskDto: UpdateTaskDto) {
    console.log(updateTaskDto);
    return `This action updates a #${id} task`;
  }

  remove(id: number) {
    return `This action removes a #${id} task`;
  }
}
