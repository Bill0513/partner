import { Module } from '@nestjs/common';
import { RewardService } from './reward.service';
import { RewardController } from './reward.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reward } from './entities/reward.entity';
import { Rule } from './entities/rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reward, Rule])],
  controllers: [RewardController],
  providers: [RewardService],
})
export class RewardModule {}
