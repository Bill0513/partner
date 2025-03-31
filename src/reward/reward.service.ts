import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Reward } from './entities/reward.entity';
import { Repository } from 'typeorm';
import { Rule } from './entities/rule.entity';

@Injectable()
export class RewardService {
  constructor(
    @InjectRepository(Reward)
    private rewardRepository: Repository<Reward>,
    @InjectRepository(Rule)
    private ruleRepository: Repository<Rule>,
  ) {}
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

  findAll() {
    return `This action returns all reward`;
  }

  findOne(id: number) {
    return `This action returns a #${id} reward`;
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
          await queryRunner.manager.delete(Reward, deleteRuleIds);
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

  remove(id: number) {
    return `This action removes a #${id} reward`;
  }
}
