import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { TaskService } from '../task/task.service';
import { AuthUserDto } from '../auth/dto/auth.dto';
import { errorHandler } from '../utils';
import { Factory } from 'vue3-avataaars';
import { UpdateAvatarDto } from './dto/updateAvatar.dto';
import { BusinessException } from '../business-exception';
import { USER_CONSTANT } from '../constants';
import { MessageService } from '../message/message.service';
import { LoginLog } from './entities/login-log.entity';
import * as dayjs from 'dayjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => TaskService))
    private readonly taskService: TaskService,
    private readonly messageService: MessageService,

    @InjectRepository(LoginLog)
    private loginLogRepository: Repository<LoginLog>,
  ) { }

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

      // ✅ 获取连续打卡天数
      const checkInDays = await this.getStreakDays(userId);

      return {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        sex: user.sex,
        uId: user.uId,
        reward: user.reward,
        taskDesc: tasks,
        checkInDays: checkInDays,
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

  async unbindPartner(userId: number) {
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 查找当前用户
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return BusinessException.badRequest(USER_CONSTANT.NOT_FOUND);
      }

      const partnerId = user.partnerId;
      if (!partnerId) {
        return BusinessException.badRequest(USER_CONSTANT.NO_PARTNER_BOUND);
      }

      // 查找伴侣用户
      const partner = await this.userRepository.findOne({
        where: { id: partnerId },
      });
      if (!partner) {
        // 如果伴侣数据缺失，也清理自己状态
        await queryRunner.manager.update(User, user.id, {
          partnerId: null,
          bindingTime: null,
          reward: 0,
        });
        await queryRunner.commitTransaction();
        return true;
      }

      // 清理双方partnerId和bindingTime
      await queryRunner.manager.update(User, user.id, {
        partnerId: null,
        bindingTime: null,
        reward: 0,
      });

      await queryRunner.manager.update(User, partner.id, {
        partnerId: null,
        bindingTime: null,
        reward: 0,
      });

      // 发送系统消息通知双方
      await this.messageService.sendSystemMessage(
        user.id,
        '解除伴侣绑定',
        `您已成功解除与 ${partner.nickname} 的伴侣绑定。`,
      );

      await this.messageService.sendSystemMessage(
        partner.id,
        '解除伴侣绑定',
        `${user.nickname} 已解除与您的伴侣绑定。`,
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

  async getAvatarById(userId: number): Promise<{ avatar: string | null }> {
    try {
      const user = await this.userRepository.findOne({
        select: ['avatar'],
        where: { id: userId },
      });
      if (!user) {
        // 可以根据需求抛错或者返回默认头像
        return { avatar: null };
      }
      return { avatar: user.avatar };
    } catch (error) {
      errorHandler(error);
    }
  }

  /**
   * 1. 记录用户当天第一次登录（只有当天没打过卡才会记录）
   * 成功时返回 `isFirstLoginToday: true`，否则返回 `false`
   */
  async recordLogin(userId: number): Promise<{ isFirstLoginToday: boolean }> {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const existedTodayLog = await this.loginLogRepository.findOne({
        where: {
          userId: userId,
          loginDate: today,
        },
      });
      if (!existedTodayLog) {
        const log = new LoginLog();
        log.userId = userId;
        log.loginDate = today;
        await this.loginLogRepository.save(log);
        return { isFirstLoginToday: true };
      }

      return { isFirstLoginToday: false };
    } catch (error) {
      errorHandler(error);
    }
  }

  async getStreakDays(userId: number): Promise<number> {
    // 1. 查出所有登录记录（按日期倒序）
    const logs = await this.loginLogRepository.find({
      where: { userId: userId },
      order: { loginDate: 'DESC' },
    });
    if (!logs.length) return 0; // 从来没打过卡
    let streakDays = 1;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    // 2. 计算连续打卡天数（从前一天开始检查）
    for (let i = 1; i < logs.length; i++) {
      const prevLogDate = new Date(logs[i - 1].loginDate);
      const currLogDate = new Date(logs[i].loginDate);
      // 相差一天（24小时）
      if (prevLogDate.getTime() - currLogDate.getTime() === 86400000) {
        streakDays++;
      } else {
        break; // 断了连续，停止计算
      }
    }
    // 3. 判断今天是否打卡
    const lastLogDate = new Date(logs[0].loginDate).toDateString();
    const todayString = today.toDateString();
    // 如果最后一天不是今天，说明今天还没打卡，连续天数归零
    if (lastLogDate !== todayString) {
      return 0;
    }

    if (streakDays < 0) {
      streakDays = 0;
    }
    return streakDays;
  }
}
