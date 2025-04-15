import { Injectable } from '@nestjs/common';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Reward, RewardStatus } from './entities/reward.entity';
import { Repository } from 'typeorm';
import { Rule } from './entities/rule.entity';
import { RewardFindAllDto } from './dto/list-reward.dto';
import { UserService } from 'src/user/user.service';
import { ALLOWED_SORT_FIELDS, REWARD_CONSTANT } from 'src/constants';
import { RemoveRewardDto } from './dto/remove-reward.dto';
import {
  ExchangeDto,
  ExchangeListDto,
  ExchangeOperationDto,
  OperationType,
} from './dto/exchange.dto';
import { Exchange, ExchangeStatus } from './entities/exchange.entity';
import { User } from 'src/user/entities/user.entity';
import { errorHandler } from 'src/utils';
import { BusinessException } from 'src/business-exception';
import * as dayjs from 'dayjs';
import { MessageService } from 'src/message/message.service';
import { LikeAction, LikeRewardDto } from './dto/like-reward.dto';
import { RewardLike } from './entities/reward-like.entity';

@Injectable()
export class RewardService {
  constructor(
    @InjectRepository(Reward)
    private rewardRepository: Repository<Reward>,
    @InjectRepository(Rule)
    private ruleRepository: Repository<Rule>,
    private userService: UserService,

    @InjectRepository(Exchange)
    private exchangeRepository: Repository<Exchange>,

    @InjectRepository(RewardLike)
    private rewardLikeRepository: Repository<RewardLike>,
    private readonly messageService: MessageService,
  ) {}

  async list(queryDto: RewardFindAllDto, userId: number) {
    try {
      const { page = 1, size = 10, sort, order, isMy = 1 } = queryDto;
      const queryBuilder = this.rewardRepository.createQueryBuilder('reward');

      let partnerId: number | null = null;

      if (isMy == 0) {
        partnerId = await this.userService.getPartner(userId);
      }

      if (isMy == 1) {
        queryBuilder.andWhere('reward.createby = :createby', {
          createby: userId,
        });
      } else {
        queryBuilder.andWhere('(reward.createby = :partnerId)', {
          partnerId: partnerId,
        });
      }

      const sortField = ALLOWED_SORT_FIELDS.includes(sort)
        ? sort
        : 'createtime';

      const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

      queryBuilder.orderBy(`reward.${sortField}`, sortOrder);

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
      errorHandler(error);
    }
  }

  async detail(id: number) {
    const reward = await this.rewardRepository.findOne({
      where: { id },
    });

    if (!reward) {
      return BusinessException.notFound(REWARD_CONSTANT.NOT_FOUND);
    }

    const rules = await this.ruleRepository.find({
      where: { rewardId: id },
    });

    const like = await this.rewardLikeRepository.findOne({
      where: {
        rewardId: reward.id,
      },
    });

    return {
      ...reward,
      rules,
      like: like ? 1 : 0,
    };
  }

  async create(
    createRewardDto: CreateRewardDto,
    userId: number,
    userName: string,
  ) {
    const queryRunner =
      this.rewardRepository.manager.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Use queryRunner manager to create and save
      const tmpReward = queryRunner.manager.create(Reward, {
        title: createRewardDto.title,
        description: createRewardDto.description,
        reward: createRewardDto.reward,
        validity: createRewardDto.validity,
        createName: userName,
        createby: userId,
        totalNum: createRewardDto.totalNum,
        enableNum: createRewardDto.totalNum,
        image: createRewardDto.image,
        category: createRewardDto.category,
        isHot: createRewardDto.isHot ? 1 : 0,
        status: RewardStatus.PENDING,
      });

      if (tmpReward.validity === 'limited') {
        tmpReward.startDate = createRewardDto.startDate;
        tmpReward.endDate = createRewardDto.endDate;
      }

      const result = await queryRunner.manager.save(tmpReward);

      if (createRewardDto.rules && createRewardDto.rules.length) {
        for (const rule of createRewardDto.rules) {
          // Use queryRunner manager for rules too
          const tmpRule = queryRunner.manager.create(Rule, {
            title: rule.title,
            rewardId: result.id,
            createby: userId,
            createName: userName,
          });

          await queryRunner.manager.save(Rule, tmpRule);
        }
      }

      const partnerId = await this.userService.getPartner(userId);

      await this.messageService.sendRewardMessage(
        partnerId,
        '奖励上新',
        `您的伴侣发布了新的奖励《${tmpReward.title}》，点击按钮可查看详情！`,
      );

      // Commit the transaction
      await queryRunner.commitTransaction();

      return result.id;
    } catch (error) {
      console.log(error);
      await queryRunner.rollbackTransaction();
      errorHandler(error);
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    updateRewardDto: UpdateRewardDto,
    userId: number,
    userName: string,
  ) {
    const queryRunner =
      this.rewardRepository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existReward = await queryRunner.manager.findOne(Reward, {
        where: {
          id: updateRewardDto.id,
        },
      });

      if (!existReward) {
        return BusinessException.notFound(REWARD_CONSTANT.NOT_FOUND);
      }

      existReward.updateName = userName;
      existReward.updateby = userId;

      if (updateRewardDto.title) {
        existReward.title = updateRewardDto.title;
      }

      if (updateRewardDto.description) {
        existReward.description = updateRewardDto.description;
      }

      if (updateRewardDto.reward) {
        existReward.reward = updateRewardDto.reward;
      }

      if (updateRewardDto.validity) {
        existReward.validity = updateRewardDto.validity;
        if (updateRewardDto.validity === 'limited') {
          if (updateRewardDto.startDate) {
            existReward.startDate = updateRewardDto.startDate;
          }
          if (updateRewardDto.endDate) {
            existReward.endDate = updateRewardDto.endDate;
          }
        } else {
          existReward.startDate = '';
          existReward.endDate = '';
        }
      }

      if (updateRewardDto.totalNum) {
        existReward.totalNum = updateRewardDto.totalNum;
      }

      existReward.isHot = updateRewardDto.isHot;

      await queryRunner.manager.save(Reward, existReward);

      if (updateRewardDto.rules) {
        const existRules = await queryRunner.manager.find(Rule, {
          where: {
            rewardId: existReward.id,
          },
        });

        const keepRuleIds = updateRewardDto.rules
          .filter((v) => v.id)
          .map((v) => v.id);

        const deleteRuleIds = existRules.filter(
          (v) => !keepRuleIds.includes(v.id),
        );

        if (deleteRuleIds.length) {
          const idsToDelete = deleteRuleIds.map((rule) => rule.id);
          await queryRunner.manager.delete(Rule, idsToDelete);
        }

        for (const rule of updateRewardDto.rules) {
          if (rule.id) {
            await queryRunner.manager.update(Rule, rule.id, {
              title: rule.title,
              updateby: userId,
              updateName: userName,
            });
          } else {
            const tmpRule = queryRunner.manager.create(Rule, {
              title: rule.title,
              rewardId: updateRewardDto.id,
              createby: userId,
              updateby: userId,
              createName: userName,
              updateName: userName,
            });

            await queryRunner.manager.save(tmpRule);
          }
        }
      }

      await queryRunner.commitTransaction();
      return updateRewardDto.id;
    } catch (error) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async hot(id: number, userId: number, userName: string) {
    try {
      const existReward = await this.rewardRepository.findOne({
        where: {
          id,
        },
      });
      if (!existReward) {
        return BusinessException.notFound(REWARD_CONSTANT.NOT_FOUND);
      }

      const hotReward = await this.rewardRepository.findOne({
        where: {
          isHot: 1,
        },
      });

      if (hotReward) {
        hotReward.isHot = 0;
      }

      existReward.isHot = 1;
      existReward.updateby = userId;
      existReward.updateName = userName;

      await this.rewardRepository.save(hotReward);
      await this.rewardRepository.save(existReward);

      return true;
    } catch (error) {
      errorHandler(error);
    }
  }

  async remove(removeDto: RemoveRewardDto) {
    try {
      const { id } = removeDto;

      const existReward = await this.rewardRepository.findOne({
        where: {
          id,
        },
      });

      if (!existReward) {
        return BusinessException.notFound(REWARD_CONSTANT.NOT_FOUND);
      }

      await this.rewardRepository.remove(existReward);

      return true;
    } catch (error) {
      errorHandler(error);
    }
  }

  async exchange(exchangeDto: ExchangeDto, userId: number, userName: string) {
    const queryRunner =
      await this.rewardRepository.manager.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const existReward = await queryRunner.manager.findOne(Reward, {
        where: {
          id: exchangeDto.id,
        },
      });

      if (!existReward) {
        return BusinessException.notFound(REWARD_CONSTANT.NOT_FOUND);
      }

      if (existReward.validity === 'limited') {
        if (
          dayjs().isBefore(dayjs(existReward.startDate)) ||
          dayjs().isAfter(dayjs(existReward.endDate))
        ) {
          return BusinessException.badRequest(REWARD_CONSTANT.OVER_DATE);
        }
      }

      if (existReward.enableNum === 0) {
        return BusinessException.badRequest(REWARD_CONSTANT.NO_ENABLE_NUM);
      }

      const user = await this.userService.find({
        username: userName,
        id: userId,
      });

      if (!user) {
        return BusinessException.notFound(REWARD_CONSTANT.NO_EXCHANGE_USER);
      }

      if (user.reward < existReward.reward) {
        return BusinessException.badRequest(REWARD_CONSTANT.NO_EXCHANGE_MONEY);
      }

      await queryRunner.manager.update(User, userId, {
        reward: user.reward - existReward.reward,
      });

      await queryRunner.manager.update(Reward, exchangeDto.id, {
        enableNum: existReward.enableNum - 1,
        status:
          existReward.enableNum - 1 === 0
            ? RewardStatus.COMPLETED
            : RewardStatus.IN_PROGRESS,
      });

      const exchange = await queryRunner.manager.create(Exchange, {
        reward: existReward.reward,
        rewardId: existReward.id,
        rewardTitle: existReward.title,
        rewardDescription: existReward.description,
        publishId: existReward.createby,
        publishName: existReward.createName,
        createby: userId,
        createName: userName,
        status: ExchangeStatus.PENDING,
      });

      await queryRunner.manager.save(exchange);

      await this.messageService.sendRewardMessage(
        exchange.publishId,
        '新增兑换',
        `您发布的奖励《${exchange.rewardTitle}》，已被兑换！`,
      );

      await queryRunner.commitTransaction();

      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async exchangeList(exchangeListDto: ExchangeListDto, userId: number) {
    try {
      const { page, size, sort, order } = exchangeListDto;
      const queryBuilder =
        this.exchangeRepository.createQueryBuilder('exchange');

      const partnerId = await this.userService.getPartner(userId);

      queryBuilder.andWhere(
        'exchange.createby = :createby OR exchange.createby = :partnerId',
        {
          createby: userId,
          partnerId: partnerId,
        },
      );

      const sortField = ALLOWED_SORT_FIELDS.includes(sort)
        ? sort
        : 'createtime';

      const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

      queryBuilder.orderBy(`exchange.${sortField}`, sortOrder);

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
      throw error;
    }
  }

  async exchangeOperation(
    exchangeOperationDto: ExchangeOperationDto,
    userId: number,
    userName: string,
  ) {
    try {
      const { id, type } = exchangeOperationDto;

      const existExchange = await this.exchangeRepository.findOne({
        where: {
          id,
        },
      });

      if (!existExchange) {
        return BusinessException.notFound(REWARD_CONSTANT.NOT_FOUND_EXCHANGE);
      }

      if (type === OperationType.CONFIRM) {
        existExchange.status = ExchangeStatus.IN_PROGRESS;
      } else if (type === OperationType.COMPLETED) {
        existExchange.status = ExchangeStatus.COMPLETED;
      } else {
        existExchange.status = ExchangeStatus.REJECT;
      }

      existExchange.updateby = userId;
      existExchange.updateName = userName;

      await this.exchangeRepository.update(existExchange.id, existExchange);

      if (type === OperationType.REJECT) {
        await this.messageService.sendRewardMessage(
          existExchange.createby,
          '拒绝兑换',
          `您兑换的《${existExchange.rewardTitle}》已被发布者拒绝兑换！`,
        );
      } else if (type === OperationType.COMPLETED) {
        await this.messageService.sendRewardMessage(
          existExchange.createby,
          '完成兑换',
          `您兑换的《${existExchange.rewardTitle}》已被发布者兑现完成！`,
        );
      } else {
        await this.messageService.sendRewardMessage(
          existExchange.createby,
          '已确认奖励',
          `发布者已确认您兑换的《${existExchange.rewardTitle}》，请静待兑现！`,
        );
      }

      return true;
    } catch (error) {
      errorHandler(error);
    }
  }

  async toggleLike(dto: LikeRewardDto, userId: number) {
    try {
      const { rewardId, action } = dto;

      const reward = await this.rewardRepository.findOne({
        where: { id: rewardId },
      });
      if (!reward) throw BusinessException.notFound('该奖励不存在！');
      const exist = await this.rewardLikeRepository.findOne({
        where: { userId, rewardId },
      });
      if (action === LikeAction.LIKE) {
        if (!exist) {
          await this.rewardLikeRepository.save({ userId, rewardId });
        }
      } else {
        if (exist) {
          await this.rewardLikeRepository.remove(exist);
        }
      }

      return true;
    } catch (error) {
      errorHandler(error);
    }
  }
}
