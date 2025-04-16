import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { TaskService } from 'src/task/task.service';
import { AuthUserDto } from '../auth/dto/auth.dto';
import { errorHandler } from 'src/utils';
import { Factory } from 'vue3-avataaars';
import { UpdateAvatarDto } from './dto/updateAvatar.dto';
import { BusinessException } from 'src/business-exception';
import { USER_CONSTANT } from 'src/constants';
import { MessageService } from 'src/message/message.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => TaskService))
    private readonly taskService: TaskService,
    private readonly messageService: MessageService,
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
      userTemp.avatar = JSON.stringify(Factory());

      const user = await this.userRepository.save(userTemp);
      return user.id;
    } catch (error) {
      errorHandler(error);
    }
  }

  async getProfile(userId: number) {
    try {
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
    } catch (error) {
      errorHandler(error);
    }
  }

  async find({ username, id }: { username?: string; id?: number }) {
    try {
      return await this.userRepository.findOne({
        where: {
          username,
          id,
        },
      });
    } catch (error) {
      errorHandler(error);
    }
  }

  async setPartner(uId: string, userId: number) {
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tempUser = await this.userRepository.findOne({
        where: { uId },
      });

      if (!tempUser) {
        return BusinessException.badRequest(USER_CONSTANT.UID_ERROR);
      }

      const tempUser2 = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!tempUser2) {
        return BusinessException.badRequest(USER_CONSTANT.NOT_FOUND);
      }

      if (tempUser.id === tempUser2.id) {
        return BusinessException.badRequest(USER_CONSTANT.NO_BINGDING_MY);
      }

      // 检查是否已有伴侣
      if (tempUser.partnerId) {
        return BusinessException.badRequest(USER_CONSTANT.EXIST_PARTNER);
      }

      if (tempUser2.partnerId) {
        return BusinessException.badRequest(USER_CONSTANT.EXIST_PARTNER2);
      }

      const bindingTime = new Date();

      await queryRunner.manager.update(User, tempUser.id, {
        partnerId: tempUser2.id,
        bindingTime: bindingTime,
      });

      await queryRunner.manager.update(User, tempUser2.id, {
        partnerId: tempUser.id,
        bindingTime: bindingTime,
      });

      await this.messageService.sendSystemMessage(
        tempUser.id,
        '伴侣绑定成功',
        `绑定成功！${tempUser2.nickname} 已成为您的新伴侣！`,
      );
      await this.messageService.sendSystemMessage(
        tempUser2.id,
        '伴侣绑定成功',
        `绑定成功！${tempUser.nickname} 已成为您的新伴侣！`,
      );

      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      errorHandler(error);
    } finally {
      await queryRunner.release();
    }
  }

  async getPartner(userId: number): Promise<number | null> {
    try {
      const user = await this.userRepository.findOne({
        where: {
          id: userId,
        },
      });

      if (user.partnerId) {
        return user.partnerId;
      } else {
        return null;
      }
    } catch (error) {
      errorHandler(error);
    }
  }

  async updateAvatar(userId: number, updateAvatarDto: UpdateAvatarDto) {
    try {
      const existUser = await this.userRepository.findOne({
        where: {
          id: userId,
        },
      });

      if (!existUser) {
        return BusinessException.notFound(USER_CONSTANT.NOT_FOUND);
      }

      existUser.avatar = updateAvatarDto.avatar;

      await this.userRepository.update(existUser.id, existUser);

      return true;
    } catch (error) {
      errorHandler(error);
    }
  }
}
