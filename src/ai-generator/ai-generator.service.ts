// src/ai-generator/ai-generator.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';
import { CreateTaskDto } from '../task/dto/create-task.dto';
import { CreateRewardDto } from '../reward/dto/create-reward.dto';
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

  // 奖励流式生成 (修改后)
  async generateRewardStream(
    partialData: Partial<CreateRewardDto>,
    response: Response,
  ): Promise<void> {
    // 使用新的、要求纯文本输出的 prompt
    const prompt = this.generateRewardPrompt(partialData);
    // 设置 SSE 响应头 (与 Task 保持一致)
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no'); // 防止Nginx等代理缓冲
    try {
      const apiResponse = await axios.post(
        this.apiUrl,
        {
          messages: [{ role: 'user', content: prompt }],
          model: this.apiModel,
          stream: true,
          max_tokens: 2048, // 可以适当调整
          temperature: 0.7,
          top_p: 0.7,
          // 根据需要添加或移除其他参数
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'text/event-stream', // 明确接受类型
          },
          responseType: 'stream',
        },
      );
      // --- 流处理逻辑 (与 Task 基本一致) ---
      apiResponse.data.on('data', (chunk: Buffer) => {
        // console.log('接收到 Reward 数据块:', chunk.toString('utf8')); // 调试时打开
        const lines = chunk
          .toString('utf8')
          .split('\n')
          .filter((line) => line.trim() !== '');
        lines.forEach((line) => {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const jsonData = JSON.parse(line.substring(5));
              if (jsonData.choices?.[0]?.delta?.content) {
                const content = jsonData.choices[0].delta.content;
                // console.log('Reward Content:', content); // 调试时打开
                response.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch (error) {
              console.error('处理 Reward 数据错误:', error, '原始行:', line);
              // response.write(`event: error\ndata: ${JSON.stringify({ message: 'Error parsing stream chunk' })}\n\n`);
            }
          } else if (line === 'data: [DONE]') {
            console.log('Reward Stream [DONE] received');
          }
        });
      });
      apiResponse.data.on('end', () => {
        console.log('Reward 流结束');
        // response.write(`event: complete\ndata: ${JSON.stringify({ success: true })}\n\n`);
        response.write('data: [DONE]\n\n');
        response.end();
      });
      apiResponse.data.on('error', (err) => {
        console.error('Reward 流式传输错误:', err);
        response.write(
          `event: error\ndata: ${JSON.stringify({ error: err.message || 'Stream error' })}\n\n`,
        );
        response.end();
      });
    } catch (error) {
      console.error(
        'AI Reward 请求失败:',
        error.response?.data || error.message,
      );
      if (!response.writableEnded) {
        try {
          response
            .status(500)
            .write(
              `event: error\ndata: ${JSON.stringify({ error: error.message || 'AI request failed' })}\n\n`,
            );
          response.end();
        } catch (e) {
          console.error('Error writing error response:', e);
        }
      }
    }
  }

  private generateTaskPrompt(existingData: Partial<CreateTaskDto>): string {
    return `基于以下已有信息，生成一个情侣互动任务的完整数据（JSON格式）：
  ${JSON.stringify(existingData)}
  
  ## 生成规则 
  // (保持之前的规则不变: 核心要求简单日常、主题聚焦、基调温馨、可执行、数据保留)
  1.  **【核心要求】** 生成的任务必须**简单、具体、接地气**，是情侣在**日常生活中可以轻松完成**的小互动，侧重于表达心意和增加情趣，避免设计复杂、耗时过长或需要特殊条件才能完成的活动。
  2.  **【主题聚焦】** 如果已提供title，则必须以title作为核心主题，所有其他内容（描述、子任务等）都应紧密围绕title展开，确保任务内容与标题高度相关且不跑题。
  3.  **【基调】** 生成内容应温馨、有爱、积极健康，能促进情侣关系，创造轻松愉快的回忆。
  4.  **【可执行性】** 任务步骤必须清晰、明确，具有很强的**实际操作性**，一看就知道具体要做什么。
  5.  **【数据保留】** 如果用户已提供部分字段，必须保留这些值，只生成缺失的字段。

  ## 输出格式要求（纯文本）：
  **【【【！！！极其重要！！！】】】**
  **请严格、精确地按照以下格式输出纯文本，不要包含任何markdown标记、代码块或其他任何多余字符。前端将严格按照此格式进行解析。**

  [主题]
  任务标题文本（单行）

  [任务描述]
  任务描述文本（可以多行，但紧跟在标记下方）

  [执行步骤]
  1. 第一个步骤的文本描述（单行）
  2. 第二个步骤的文本描述（单行）
  3. 第三个步骤的文本描述（单行）
  (根据需要生成2-4个步骤。**每个步骤必须另起一行，并且严格以"数字. "开头，例如"1. "、"2. "等。步骤文本结束后，不允许有任何其他内容或空行。**）

  **【格式检查清单】**
  *   确保输出以 [主题] 开始。
  *   确保 [主题] 后紧跟标题文本，然后是换行符。
  *   确保之后是 [任务描述] 标记，然后换行，再是描述文本。
  *   确保描述文本后是 [执行步骤] 标记，然后换行。
  *   确保每个步骤都另起一行，以 数字. （注意有个空格）开头。
  *   确保最后一个步骤结束后，没有任何多余的字符或换行。
  *   标记本身 [主题] [任务描述] [执行步骤] 必须完全一致，包括方括号。

  ## 内容生成指引
  // (保持之前的指引不变: 口吻亲密、紧扣标题、侧重日常、避免过度设计)
  *   **【口吻是关键】**：**用词要口语化、有温度**，想象你就是正在对你的爱人撒娇、或者充满期待地提出这个小要求。多使用第二人称“你”，并且自然融入“我”或“我们”的感受。可以使用一些自然的语气词（比如“呀、哦、呢、嘛”），但要**适度**，避免油腻或不自然。
  *   **紧扣标题**：严格根据标题生成**对应强度和复杂度**的任务。如果标题很简单（如“夸我一句”），描述和步骤就要非常直接和充满情感。
  *   **侧重日常**：多从生活细节入手，比如：简单的肢体接触（给我捏捏肩）、言语关怀（今天说三遍爱我）、小的服务行为（帮我拿下快递）、制造微小惊喜（给我分享一首你觉得代表我的歌）等。
  *   **避免过度设计**：保持任务的**朴素和真诚**，重点是**情感的传递**，而不是任务本身的复杂度。

  ## 特别注意
  1.  最终输出必须是可直接展示的完整纯文本。
  2.  **绝对不要包含**任何元信息、解释性文字、markdown标记（如）或任何不属于上述格式要求的内容。
  3.  步骤间要有清晰的逻辑顺序。
  4.  语言要**极其自然、口语化**，模拟情侣对话。
  5.  除了步骤开头的 数字. 外，**不要使用任何项目符号**（如 * - ·）。

  请直接输出符合要求的纯文本内容。`;
  }

  private generateRewardPrompt(existingData: Partial<CreateRewardDto>): string {
    // 注意：移除了原来 JSON 输出的要求，改为纯文本格式
    return `基于以下已有的奖励信息，生成一个完整、吸引人的情侣奖励描述和规则：
  已有信息: ${JSON.stringify(existingData)}
  ## 生成核心规则
  1.  **【主题聚焦】** 如果已提供\`title\`，必须以此为核心主题，所有生成内容（描述、规则）都应紧密围绕它展开，确保高度相关。
  2.  **【基调】** 内容应浪漫、有创意、温馨，能增进情侣感情，创造美好回忆。避免低俗或无趣的内容。
  3.  **【数据保留】** 如果用户已提供字段（如 \`title\`, \`description\`），优先使用并围绕其补充，只生成缺失或需要丰富的内容。
  4.  **【内容协调】** 生成的描述和规则必须相互协调，共同构成一个合理且吸引人的奖励。
  ## 输出格式要求（纯文本）：
  **【【【！！！极其重要！！！】】】**
  **请严格、精确地按照以下格式输出纯文本，不要包含任何markdown标记、代码块（包括\`\`\`）或其他任何多余字符。前端将严格按照此格式进行解析。**
  [奖励标题]
  奖励标题文本（单行，简洁、诱人、体现奖励核心）
  [奖励描述]
  奖励描述文本（可以多行，详细生动地描绘兑换这个奖励能带来的体验和情感价值，字数在50-150字之间为宜）
  [使用规则]
  1. 第一条规则文本（单行，清晰说明兑换或使用的条件、方式、限制等）
  2. 第二条规则文本（单行）
  3. 第三条规则文本（单行）
  (根据奖励性质生成2-5条规则。**每条规则必须另起一行，并且严格以"数字. "开头，例如"1. "、"2. "等。规则文本结束后，不允许有任何其他内容或空行。**）
  **【格式检查清单】**
  *   确保输出以 \`[奖励标题]\` 开始。
  *   确保 \`[奖励标题]\` 后紧跟标题文本，然后是 **一个** 换行符。
  *   确保之后是 \`[奖励描述]\` 标记，然后换行，再是描述文本。描述文本可以包含换行。
  *   确保描述文本后是 \`[使用规则]\` 标记，然后换行。
  *   确保每条规则都另起一行，以 "数字. " （注意有个空格）开头。
  *   确保最后一条规则结束后，没有任何多余的字符或换行。
  *   标记本身 \`[奖励标题]\` \`[奖励描述]\` \`[使用规则]\` 必须完全一致，包括方括号。
  ## 内容生成指引
  *   **描述生动诱人**：用充满画面感和情感的语言描述奖励，让对方充满期待。突出奖励的特别之处和情感价值。
  *   **规则清晰实用**：规则要具体、可操作，避免模糊不清。可以包含：
      *   兑换时机（例如：随时兑换、特殊纪念日加倍）
      *   使用限制（例如：需要提前预约、仅限工作日使用）
      *   特殊说明（例如：本奖励不可转让、解释权归XXX所有:P）
      *   情感提示（例如：兑换时请给我一个大大的拥抱）
  *   **紧扣类别**：如果用户选择了类别（date, food, service, gift, other），生成的内容应体现该类别的特点。
      *   date: 侧重约会体验、氛围、地点。
      *   food: 侧重美食口味、制作过程或餐厅选择。
      *   service: 侧重服务内容、时长、效果。
      *   gift: 侧重礼物的意义、惊喜感。
      *   other: 保持创意和趣味性。
  *   **口吻亲密**：可以使用轻松、俏皮或深情的口吻，模拟情侣间的对话。
  ## 特别注意
  1.  最终输出必须是可直接展示给用户的完整纯文本。
  2.  **绝对不要包含**任何元信息、解释性文字、markdown标记（如\`###\` \`*\`）或任何不属于上述格式要求的内容。
  3.  规则应具有一定的趣味性和情侣间的互动性。
  4.  语言要**自然、有爱**。
  5.  除了规则开头的 "数字. " 外，**不要使用任何项目符号**（如 * - ·）。
  请直接输出符合要求的纯文本内容。`;
  }
}
