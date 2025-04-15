// src/message/message.module.ts
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from './message.service';
import { Message } from './entities/message.entity';
import { MessageController } from './message.controller';

@Global() // 使模块变为全局模块，这样其他模块不需要导入即可使用
@Module({
  imports: [TypeOrmModule.forFeature([Message])],
  providers: [MessageService],
  exports: [MessageService],
  controllers: [MessageController], // 导出服务，让其他模块可以使用
})
export class MessageModule {}
