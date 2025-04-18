// src/ai-generator/ai-generator.controller.ts
import { Controller, Post, Body, HttpCode, Res } from '@nestjs/common';
import { Response } from 'express';
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
    @Res() response: Response,
  ): Promise<void> {
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');

    try {
      await this.aiGeneratorService.generateTaskStream(partialData, response);
    } catch (error) {
      console.error('Stream error:', error);
      response.end(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    }
  }

  @Post('generate-reward')
  @HttpCode(200)
  async generateReward(
    @Body() partialData: Partial<CreateRewardDto>,
    @Res() response: Response,
  ): Promise<void> {
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');

    try {
      await this.aiGeneratorService.generateRewardStream(partialData, response);
    } catch (error) {
      console.error('Stream error:', error);
      response.end(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    }
  }
}
