// src/ai-generator/ai-generator.controller.ts
import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AiGeneratorService } from './ai-generator.service';
import { CreateTaskDto } from 'src/task/dto/create-task.dto';
import { CreateRewardDto } from 'src/reward/dto/create-reward.dto';

@Controller('ai-generator')
export class AiGeneratorController {
  constructor(private readonly aiGeneratorService: AiGeneratorService) {}

  @Post('generate-task')
  @HttpCode(200)
  async generateTask(
    @Body() partialData: Partial<CreateTaskDto>,
  ): Promise<CreateTaskDto> {
    return this.aiGeneratorService.generateTask(partialData);
  }

  @Post('generate-reward')
  @HttpCode(200)
  async generateReward(
    @Body() partialData: Partial<CreateRewardDto>,
  ): Promise<CreateRewardDto> {
    return this.aiGeneratorService.generateReward(partialData);
  }
}
