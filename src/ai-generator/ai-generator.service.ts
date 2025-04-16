// src/ai-generator/ai-generator.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
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
  async generateTask(
    partialData: Partial<CreateTaskDto>,
  ): Promise<CreateTaskDto> {
    const prompt = this.generateTaskPrompt(partialData);

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          messages: [{ role: 'user', content: prompt }],
          model: this.apiModel,
          stream: false,
          max_tokens: 8192,
          temperature: 0.7,
          top_p: 0.7,
          top_k: 50,
          frequency_penalty: 0.5,
          n: 1,
          // 其他可能需要的参数
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log(response, 54);

      // 解析并验证返回数据
      const generatedData = this.parseGeneratedData(response.data);
      return { ...partialData, ...generatedData } as CreateTaskDto;
    } catch (error) {
      console.error('AI生成任务数据失败:', error);
      throw new HttpException(
        'Failed to generate task data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async generateReward(
    partialData: Partial<CreateRewardDto>,
  ): Promise<CreateRewardDto> {
    const prompt = this.generateRewardPrompt(partialData);

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          messages: [{ role: 'user', content: prompt }],
          model: this.apiModel,
          stream: false,
          max_tokens: 8192,
          temperature: 0.7,
          top_p: 0.7,
          top_k: 50,
          frequency_penalty: 0.5,
          n: 1,
          // 其他可能需要的参数
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log(response, 54);

      // 解析并验证返回数据
      const generatedData = this.parseGeneratedData(response.data);
      return { ...partialData, ...generatedData } as CreateRewardDto;
    } catch (error) {
      console.error('AI生成奖励数据失败:', error);
      throw new HttpException(
        'Failed to generate reward data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
    
    ## 根据title的不同类型，相应调整内容方向：
    - 如果title是活动类（如"一起做饭"），description应包含活动准备、过程和互动要点，subTasks应分解活动步骤
    - 如果title是惊喜类（如"制作惊喜礼物"），description应包含保密技巧和创意点，subTasks应包含准备和执行步骤
    - 如果title是成长类（如"学习新技能"），description应强调共同成长意义，subTasks应包含学习和实践步骤
    - 如果title是情感类（如"表达爱意"），description应富有感染力，subTasks应包含情感表达的不同方式
    
    ## 输出JSON格式要求：
    {
      "title": "字符串，吸引人且富有爱意的任务标题（如已提供则保留原值）",
      "description": "字符串，详细任务描述，必须与title高度相关，包含情感价值和执行指南，200-300字为宜",
      "subTasks": [
        {
          "title": "字符串，子任务标题，必须是完成主任务的具体步骤或组成部分，通常需要3-5个子任务"
        }
      ]
    }
    
    ## 特别注意
    1. 严格按照JSON格式返回，不要包含任何额外的解释性文字
    2. subTasks必须是完成主任务的逻辑步骤，而非无关的独立任务
    3. 所有生成内容必须与title高度一致，构成一个内容连贯的整体任务
    4. 返回的JSON必须语法有效，可直接解析
    
    只返回符合要求的JSON数据，不要有前言后语。`;
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

  /**
   * 解析AI模型生成的响应数据
   * @param responseData - AI API返回的原始响应数据
   * @returns 解析后的JSON对象
   * @throws HttpException 当解析失败时
   */
  private parseGeneratedData(responseData: any): any {
    try {
      // 记录原始响应数据类型和结构
      console.log(`响应数据类型: ${typeof responseData}`);
      console.log(`响应数据结构: ${JSON.stringify(responseData, null, 2)}`);

      // 情况1: 如果是字符串，直接尝试解析JSON
      if (typeof responseData === 'string') {
        try {
          return JSON.parse(responseData);
        } catch (error) {
          console.error('响应是字符串但不是有效的JSON:', error);
          // 检查是否可能是带有额外内容的JSON
          const possibleJson = this.extractJsonFromString(responseData);
          if (possibleJson) {
            return possibleJson;
          }
          throw error;
        }
      }

      // 情况2: 适配硅基流动等API结构，直接包含content字段
      else if (responseData && responseData.content) {
        try {
          return JSON.parse(responseData.content);
        } catch (error) {
          console.error('content字段不是有效的JSON:', error);
          // 尝试从content中提取JSON
          const possibleJson = this.extractJsonFromString(responseData.content);
          if (possibleJson) {
            return possibleJson;
          }
          throw error;
        }
      }

      // 情况3: 适配标准OpenAI或类似的API格式
      else if (
        responseData &&
        responseData.choices &&
        responseData.choices.length > 0
      ) {
        const message = responseData.choices[0].message;

        if (message && message.content) {
          try {
            return JSON.parse(message.content);
          } catch (error) {
            console.error('message.content不是有效的JSON:', error);
            // 尝试从message.content中提取JSON
            const possibleJson = this.extractJsonFromString(message.content);
            if (possibleJson) {
              return possibleJson;
            }
            throw error;
          }
        } else {
          console.error('找不到message.content字段');
          throw new Error('AI响应缺少content字段');
        }
      }

      // 情况4: 如果responseData本身就是JSON对象，直接返回
      else if (responseData && typeof responseData === 'object') {
        // 检查是否有可能包含我们需要的数据结构
        console.warn('未找到预期的数据结构，直接返回响应对象');
        return responseData;
      }

      // 没有匹配任何已知格式
      throw new Error('无法识别的AI响应数据格式');
    } catch (error) {
      console.error('解析AI响应失败:', error);
      throw new HttpException(
        `Failed to parse AI response: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 尝试从包含其他文本的字符串中提取有效的JSON对象
   * @param text - 可能包含JSON的字符串
   * @returns 解析出的JSON对象，如果无法提取则返回null
   */
  private extractJsonFromString(text: string): any | null {
    try {
      // 尝试查找文本中的JSON部分
      const jsonRegex = /{[\s\S]*}/;
      const match = text.match(jsonRegex);

      if (match && match[0]) {
        return JSON.parse(match[0]);
      }
      return null;
    } catch (error) {
      console.error('从字符串中提取JSON失败:', error);
      return null;
    }
  }
}
