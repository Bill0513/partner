import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { SubTaskService } from 'src/sub_task/sub_task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFindAllDto } from './dto/task.dto';
import { ALLOWED_SORT_FIELDS } from 'src/constants';
import { UserService } from 'src/user/user.service';
@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private subTaskService: SubTaskService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
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
      task.status = 'pending';

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

  async list(queryDto: TaskFindAllDto, userId: number) {
    try {
      const { page, size, priority, onlyMe, sort, order } = queryDto;
      const queryBuilder = this.taskRepository.createQueryBuilder('task');

      const partnerId = await this.userService.getPartner(userId);

      if (priority) {
        queryBuilder.andWhere('task.priority = :priority', { priority });
      }

      if (onlyMe) {
        queryBuilder.andWhere('task.createby = :createby', {
          createby: userId,
        });
      } else {
        if (partnerId) {
          queryBuilder.andWhere(
            '(task.createby = :userId OR task.createby = :partnerId)',
            {
              userId: userId,
              partnerId: partnerId,
            },
          );
        } else {
          queryBuilder.andWhere('task.createby = :createby', {
            createby: userId,
          });
        }
      }

      const sortField = ALLOWED_SORT_FIELDS.includes(sort)
        ? sort
        : 'createtime';

      const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

      queryBuilder.orderBy(`task.${sortField}`, sortOrder);

      const total = await queryBuilder.getCount();

      queryBuilder.skip((page - 1) * size).take(size);

      const list = await queryBuilder.getMany();

      // 计算是否为最后一页
      const isLast = page * size >= total;

      return {
        list,
        meta: {
          page: page,
          size: size,
          total: total,
          isLast: isLast,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'An error occurred while fetching tasks',
      );
    }
  }

  async detail(id: number) {
    const task = await this.taskRepository.findOne({
      where: {
        id,
      },
    });

    if (!task) {
      throw new BadRequestException('该任务不存在');
    }

    const subTasks = await this.subTaskService.findByTaskId(task.id);

    const data = Object.assign(task, { subTasks });

    return data;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, userId, nickname) {
    const queryRunner =
      this.taskRepository.manager.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // 1. 首先查找要更新的实体是否存在
      const task = await this.taskRepository.findOne({ where: { id } });

      if (!task) {
        throw new NotFoundException(`该任务不存在`);
      }

      if (task.createby !== userId) {
        throw new BadRequestException(`这不是你创建的任务`);
      }

      const {
        title,
        description,
        date,
        time,
        priority,
        reward,
        location,
        subTasks,
      } = updateTaskDto;

      task.title = title;
      task.description = description;
      task.date = date;
      task.time = time;
      task.priority = priority;
      task.reward = reward;
      task.location = location;
      task.updateby = userId;
      task.updateName = nickname;

      await queryRunner.manager.save(task);

      const subTaskList = await this.subTaskService.findByTaskId(task.id);

      const subTaskListIds = subTaskList.map((v) => v.id);

      subTasks.forEach((v) => {
        if (subTaskListIds.includes(v.id)) {
          const index = subTaskListIds.findIndex((c) => c === v.id);
          subTaskListIds.splice(index, 1);
        }
      });

      if (subTasks) {
        for (const subTask of subTasks) {
          await this.subTaskService.update(subTask, task.id, userId, nickname);
        }
      }

      if (subTaskListIds.length) {
        for (const subTaskId of subTaskListIds) {
          await this.subTaskService.remove(subTaskId);
        }
      }

      await queryRunner.commitTransaction();

      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('服务器错误');
    } finally {
      await queryRunner.release();
    }
  }

  remove(id: number) {
    return `This action removes a #${id} task`;
  }
}
