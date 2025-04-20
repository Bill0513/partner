import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubTask } from './entities/sub_task.entity';
import { SubTaskController } from './sub_task.controller';
import { SubTaskService } from './sub_task.service';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [TypeOrmModule.forFeature([SubTask]), MessageModule],
  controllers: [SubTaskController],
  providers: [SubTaskService],
  exports: [SubTaskService],
})
export class SubTaskModule { }
