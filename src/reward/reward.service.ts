import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Reward, RewardStatus } from './entities/reward.entity';
import { Repository } from 'typeorm';
import { Rule } from './entities/rule.entity';
import { RewardFindAllDto } from './dto/list-reward.dto';
import { UserService } from 'src/user/user.service';
import { ALLOWED_SORT_FIELDS } from 'src/constants';
import { RemoveRewardDto } from './dto/remove-reward.dto';
import { ExchangeDto, ExchangeListDto } from './dto/exchange.dto';
import { Exchange } from './entities/exchange.entity';
import { User } from 'src/user/entities/user.entity';
import { errorHandler } from 'src/utils';
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
  ) { }

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
        if (partnerId) {
          queryBuilder.andWhere(
            '(reward.createby = :userId OR reward.createby = :partnerId)',
            {
              userId: userId,
              partnerId: partnerId,
            },
          );
        } else {
          // 当isMy为false且没有伴侣时，应该查询所有奖励或者只查询自己的
          // 这里改为查询自己的奖励，避免查不到数据
          queryBuilder.andWhere('reward.createby = :userId', {
            userId: userId,
          });
        }
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
      throw new NotFoundException('未找到');
    }

    const rules = await this.ruleRepository.find({
      where: { rewardId: id },
    });

    return {
      ...reward,
      rules,
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

      // Commit the transaction
      await queryRunner.commitTransaction();

      return result.id;
    } catch (error) {
      console.log(error);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('创建失败: ' + error.message);
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
        throw new NotFoundException(`找不到ID为${updateRewardDto.id}的奖励`);
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
        throw new NotFoundException(`找不到ID为${id}的奖励`);
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
      throw new InternalServerErrorException(`系统错误: ${error.message}`);
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
        throw new NotFoundException('未找到');
      }

      await this.rewardRepository.remove(existReward);

      return true;
    } catch (error) {
      throw new InternalServerErrorException('系统错误: ' + error.message);
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
        throw new NotFoundException('未找到奖励');
      }

      if (existReward.enableNum === 0) {
        throw new BadRequestException('数量不够兑换');
      }

      const user = await this.userService.find({
        username: userName,
        id: userId,
      });

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      if (user.reward < existReward.reward) {
        throw new BadRequestException('钱不够兑换该奖励');
      }

      await queryRunner.manager.update(User, userId, {
        reward: user.reward - existReward.reward,
      });

      await queryRunner.manager.update(Reward, exchangeDto.id, {
        enableNum: existReward.enableNum - 1,
      });

      const exchange = await queryRunner.manager.create(Exchange, {
        reward: existReward.reward,
        rewardId: existReward.id,
        rewardTitle: existReward.title,
        publishId: existReward.createby,
        publishName: existReward.createName,
        createby: userId,
        createName: userName,
        status: 'pending',
      });

      await queryRunner.manager.save(exchange);

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

      queryBuilder.andWhere('exchange.createby = :createby', {
        createby: userId,
      });

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
}
