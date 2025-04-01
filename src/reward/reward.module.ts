import { Module } from '@nestjs/common';
import { RewardService } from './reward.service';
import { RewardController } from './reward.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reward } from './entities/reward.entity';
import { Rule } from './entities/rule.entity';
import { UserModule } from 'src/user/user.module';
import { Exchange } from './entities/exchange.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reward, Rule, Exchange]), UserModule],
  controllers: [RewardController],
  providers: [RewardService],
})
export class RewardModule {}
