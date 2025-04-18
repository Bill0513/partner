// src/ai-generator/ai-generator.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';
import { CreateTaskDto } from 'src/task/dto/create-task.dto';
import { CreateRewardDto } from 'src/reward/dto/create-reward.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiGeneratorService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly apiModel: string;
  constructor(private configService: ConfigService) {
    // 从环境变量中读取配置
    this.apiUrl = this.configService.get<string>('AI_API_URL');
    this.apiKey = this.configService.get<string>('AI_API_KEY');
    this.apiModel = this.configService.get<string>('AI_API_MODEL');

    // 验证配置是否存在
    if (!this.apiUrl || !this.apiKey || !this.apiModel) {
      console.error(
        'AI API 配置缺失! 请检查.env文件中的AI_API_URL和AI_API_KEY和AI_API_MODEL',
      );
    }
  }

  // 简化的流式任务生成
  async generateTaskStream(
    partialData: Partial<CreateTaskDto>,
    response: Response,
  ): Promise<void> {
    const prompt = this.generateTaskPrompt(partialData);

    // 设置SSE响应头（关键修改）
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no'); // 防止Nginx缓冲

    try {
      const apiResponse = await axios.post(
        this.apiUrl,
        {
          messages: [{ role: 'user', content: prompt }],
          model: this.apiModel,
          stream: true,
          max_tokens: 8192,
          temperature: 0.7,
          top_p: 0.7,
          top_k: 50,
          frequency_penalty: 0.5,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        },
      );

      apiResponse.data.on('data', (chunk) => {
        console.log('接收到数据块:', chunk.toString('utf8'));
        const lines = chunk
          .toString('utf8')
          .split('\n')
          .filter((line) => line.trim() !== '');
        lines.forEach((line) => {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const jsonData = JSON.parse(line.replace(/^data: /, ''));
              // 处理内容输出
              if (jsonData.choices?.[0]?.delta?.content) {
                const content = jsonData.choices[0].delta.content;
                // 确保每条消息都符合SSE规范，以双换行结束
                response.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch (error) {
              console.error('处理数据错误:', error);
            }
          }
        });
      });
      // 结束时的处理
      apiResponse.data.on('end', () => {
        console.log('流结束');
        // 发送一个完成标记，让前端知道流已结束
        response.write(`data: ${JSON.stringify({ complete: true })}\n\n`);
        response.write('data: [DONE]\n\n');
        response.end();
      });

      apiResponse.data.on('error', (err) => {
        console.error('流式传输错误:', err);
        response.write(
          `event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`,
        );
        response.end();
      });
    } catch (error) {
      console.error('AI请求失败:', error);
      response.write(
        `event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`,
      );
      response.end();
    }
  }

  // 简化的流式奖励生成 (结构与任务生成类似)
  async generateRewardStream(
    partialData: Partial<CreateRewardDto>,
    response: Response,
  ): Promise<void> {
    const prompt = this.generateRewardPrompt(partialData);

    try {
      const apiResponse = await axios.post(
        this.apiUrl,
        {
          messages: [{ role: 'user', content: prompt }],
          model: this.apiModel,
          stream: true,
          max_tokens: 8192,
          temperature: 0.7,
          top_p: 0.7,
          top_k: 50,
          frequency_penalty: 0.5,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        },
      );
      apiResponse.data.on('data', (chunk) => {
        const lines = chunk
          .toString('utf8')
          .split('\n')
          .filter((line) => line.trim() !== '');

        lines.forEach((line) => {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const jsonData = JSON.parse(line.replace(/^data: /, ''));
              if (jsonData.choices?.[0]?.delta?.content) {
                const content = jsonData.choices[0].delta.content;
                response.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch (error) {
              console.error('处理数据错误:', error);
            }
          }
        });
      });
      apiResponse.data.on('end', () => {
        response.write('data: [DONE]\n\n');
      });
      apiResponse.data.on('error', (err) => {
        console.error('流式传输错误:', err);
        response.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        response.end();
      });
    } catch (error) {
      console.error('AI请求失败:', error);
      response.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      response.end();
    }
  }

  private generateTaskPrompt(existingData: Partial<CreateTaskDto>): string {
    return `基于以下已有信息，生成一个情侣互动任务的完整数据（JSON格式）：
  ${JSON.stringify(existingData)}
  
  ## 生成规则
  1. 【最重要】如果已提供title，则必须以title作为核心主题，所有其他内容（描述、子任务等）都应紧密围绕title展开，确保高度相关性和连贯性
  2. 生成内容应温馨、有爱、积极健康，能促进情侣关系，创造美好回忆
  3. 任务应具有可执行性，明确具体，避免模糊不清的建议
  4. 如果用户已提供部分字段，必须保留这些值，只生成缺失的字段
  
  ## 输出格式要求（纯文本）：
[主题] 
这里显示任务标题（如已提供则使用原标题）
[任务描述]
这里用100-200字详细描述任务，包含：
- 任务的价值和意义
- 需要提前准备的事项
- 具体的执行方式
- 预期的互动效果
[执行步骤]
1. 第一步：具体操作说明（如"准备所需材料：..."）
2. 第二步：互动要点（如"过程中可以..."）
3. 第三步：情感表达建议（如"完成后别忘了..."）
（通常需要3-5个步骤）
## 内容生成指引
根据主题类型调整内容方向：
1. 活动类（如"一起做饭"）：重点描述互动过程和情感交流机会
2. 惊喜类（如"制作礼物"）：强调创意点和惊喜效果的实现方法
3. 成长类（如"学习技能"）：突出共同进步的价值和协作方式
4. 情感类（如"表达爱意"）：提供多种情感表达的具体形式
## 特别注意
1. 最终输出必须是可直接展示的完整文本
2. 不要包含任何元信息或解释性文字
3. 步骤间要有逻辑顺序，形成完整流程
4. 语言要自然流畅，适合口头交流
5. 避免使用项目符号以外的任何标记符号
请直接输出符合要求的纯文本内容，不要包含额外说明。`;
  }

  private generateRewardPrompt(existingData: Partial<CreateRewardDto>): string {
    return `基于以下已有信息，生成一个情侣之间可兑换的奖励数据（JSON格式）：
  ${JSON.stringify(existingData)}
  
  ## 核心生成规则
  1. 【最高优先级】如果已提供title，必须以title作为核心主题，所有其他内容（描述、规则等）都必须紧密围绕title展开，确保高度相关性和连贯性
  2. 所有生成内容应浪漫、有创意、温馨，能增进情侣感情并创造美好回忆
  3. 所有字段必须协调一致，共同构成一个连贯、合理的奖励体系
  4. 如果用户已提供任何字段，必须保留这些值，只生成缺失的字段
  
  ## 根据title类型，相应调整内容方向：
  - 如果title是服务类（如"按摩服务"、"做饭服务"），description应详述服务内容和流程，rules应包含服务兑换方式和注意事项
  - 如果title是权利类（如"决定权"、"选择权"），description应明确权利范围，rules应说明如何行使权利和有效期限
  - 如果title是体验类（如"约会"、"旅行"），description应描述体验细节和意义，rules应包含体验安排和双方责任
  - 如果title是情感类（如"拥抱"、"表白"），description应富有感染力和温度，rules应强调情感表达的方式和时机
  
  ## 输出JSON格式要求：
  {
    "title": "字符串，吸引人且富有情感的奖励标题（如已提供则保留原值）",
    "description": "字符串，详细描述奖励内容，必须与title高度相关，包含情感价值和兑换体验，200-300字为宜",
    "rules": [
      {
        "title": "字符串，奖励兑换或享受的具体规则，应有3-5条规则，每条都必须与title奖励直接相关"
      }
    ],
  }
  
  ## 规则生成指南
  - 规则必须直接关联title描述的奖励，而非通用规则
  - 规则应包含兑换条件、使用方式、有效期限等实用信息
  - 规则应体现情感价值，增强奖励的意义和乐趣
  - 每条规则都应具体、清晰，避免模糊不清的表述
  
  ## 类别选择参考
  根据title内容，从以下类别中选择最匹配的一个：
  - ROMANTIC（浪漫类，如约会、惊喜等）
  - SERVICE（服务类，如做饭、按摩等）
  - PRIVILEGE（特权类，如决定权、选择权等）
  - EMOTIONAL（情感类，如表白、亲密行为等）
  - MATERIAL（物质类，如小礼物、心仪物品等）
  - ADVENTURE（冒险类，如探险、尝试新事物等）
  - OTHER（其他类型）
  
  ## 特别注意
  1. 严格按照JSON格式返回，不要包含任何额外的解释性文字
  2. 所有生成内容必须与title高度一致，构成一个内容连贯的整体奖励
  3. 返回的JSON必须语法有效，可直接解析
  4. reward点数必须根据奖励内容的价值合理设置
  
  只返回符合要求的JSON数据，不要有前言后语。`;
  }
}
