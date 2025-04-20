import { Module } from '@nestjs/common';
import { RewardService } from './reward.service';
import { RewardController } from './reward.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reward } from './entities/reward.entity';
import { Rule } from './entities/rule.entity';
import { UserModule } from '../user/user.module';
import { Exchange } from './entities/exchange.entity';
import { RewardLike } from './entities/reward-like.entity';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reward, Rule, Exchange, RewardLike]),
    UserModule,
    MessageModule,
  ],
  controllers: [RewardController],
  providers: [RewardService],
})
export class RewardModule { }
