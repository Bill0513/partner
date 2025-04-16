// src/ai-generator/ai-generator.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiGeneratorController } from './ai-generator.controller';
import { AiGeneratorService } from './ai-generator.service';

@Module({
  imports: [ConfigModule], // 如果已经在AppModule中设置了isGlobal:true，这一行可以省略
  controllers: [AiGeneratorController],
  providers: [AiGeneratorService],
  exports: [AiGeneratorService],
})
export class AiGeneratorModule {}
