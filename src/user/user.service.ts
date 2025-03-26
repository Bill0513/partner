import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { TaskService } from 'src/task/task.service';
import { AuthUserDto } from '../auth/dto/auth.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly taskService: TaskService,
  ) {}

  async create(authUserDto: AuthUserDto) {
    try {
      const userTemp = this.userRepository.create();

      const { username, nickname, sex, password } = authUserDto;

      userTemp.username = username;
      userTemp.nickname = nickname;
      userTemp.sex = sex;
      userTemp.password = await bcrypt.hash(password, 10);
      userTemp.uId = Math.random().toString(16).substr(2, 8).toUpperCase();

      const user = await this.userRepository.save(userTemp);
      return user.id;
    } catch (error) {
      throw new Error('创建用户失败'); // 抛出异常
    }
  }

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    const tasks = await this.taskService.findRecentlyInfo(userId);
    let couple = {};
    if (user.partnerId) {
      couple = await this.userRepository.findOne({
        select: {
          id: true,
          nickname: true,
          avatar: true,
        },
        where: {
          id: user.partnerId,
        },
      });
    }

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      sex: user.sex,
      uId: user.uId,
      reward: user.reward,
      taskDesc: tasks,
      checkInDays: 0,
      avatar: user.avatar,
      couple,
      bindingTime: user.bindingTime,
    };
  }

  async find({ username, id }: { username?: string; id?: number }) {
    return await this.userRepository.findOne({
      where: {
        username,
        id,
      },
    });
  }

  async setPartner(uId: string, userId: number) {
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const tempUser = await this.userRepository.findOne({
        where: {
          uId,
        },
      });

      if (!tempUser) {
        throw new BadRequestException('绑定码无效');
      }

      const tempUser2 = await this.userRepository.findOne({
        where: {
          id: userId,
        },
      });

      if (tempUser.id === tempUser2.id) {
        throw new BadRequestException('绑定码无效');
      }

      const bindingTime = Date.now();

      await queryRunner.manager.update(User, tempUser.id, {
        partnerId: tempUser2.id,
        bindingTime: bindingTime,
      });
      await queryRunner.manager.update(User, tempUser2.id, {
        partnerId: tempUser.id,
        bindingTime: bindingTime,
      });

      await queryRunner.commitTransaction();

      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(error);
    } finally {
      await queryRunner.release();
    }
  }
}
