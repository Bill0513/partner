// src/message/message.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageType } from 'src/constants';
import { errorHandler } from 'src/utils';
import { BusinessException } from 'src/business-exception';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  /**
   * 创建消息
   */
  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    try {
      const message = this.messageRepository.create(createMessageDto);
      return this.messageRepository.save(message);
    } catch (error) {
      errorHandler(error);
    }
  }

  /**
   * 获取用户的所有消息
   */
  async findAllByUserId(userId: number): Promise<Message[]> {
    return await this.messageRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取用户未读消息
   */
  async findUnreadByUserId(userId: number): Promise<Message[]> {
    return await this.messageRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 标记消息为已读
   */
  async markAsRead(messageId: string) {
    try {
      const existMessage = await this.messageRepository.findOne({
        where: {
          id: messageId,
        },
      });

      if (!existMessage) {
        return BusinessException.notFound('此消息不存在');
      }
      await this.messageRepository.update(messageId, { isRead: true });

      return true;
    } catch (error) {
      errorHandler(error);
    }
  }

  /**
   * 标记用户的所有消息为已读
   */
  async markAllAsRead(userId: number): Promise<void> {
    try {
      await this.messageRepository.update(
        { userId, isRead: false },
        { isRead: true },
      );
    } catch (error) {
      errorHandler(error);
    }
  }

  /**
   * 删除消息
   */
  async remove(id: string) {
    try {
      const existMessage = await this.messageRepository.findOne({
        where: {
          id,
        },
      });

      if (!existMessage) {
        return BusinessException.notFound('此消息不存在');
      }

      await this.messageRepository.delete(id);
    } catch (error) {
      errorHandler(error);
    }
  }

  /**
   * 发送任务完成消息
   */
  async sendTaskMessage(
    userId: number,
    title: string,
    content: string,
  ): Promise<Message> {
    return this.create({
      type: MessageType.TASK,
      title,
      content,
      userId,
    });
  }

  /**
   * 发送系统消息
   */
  async sendSystemMessage(
    userId: number,
    title: string,
    content: string,
  ): Promise<Message> {
    return this.create({
      type: MessageType.SYSTEM,
      title,
      content,
      userId,
    });
  }

  async sendUserMessage(
    userId: number,
    title: string,
    content: string,
  ): Promise<Message> {
    return this.create({
      type: MessageType.USER,
      title,
      content,
      userId,
    });
  }

  async sendRewardMessage(
    userId: number,
    title: string,
    content: string,
  ): Promise<Message> {
    return this.create({
      type: MessageType.REWARD,
      title,
      content,
      userId,
    });
  }

  /**
   * 批量发送系统消息
   */
  async broadcastSystemMessage(
    userIds: number[],
    title: string,
    content: string,
  ): Promise<void> {
    const messages = userIds.map((userId) => ({
      type: MessageType.SYSTEM,
      title,
      content,
      userId,
      isRead: false,
    }));

    await this.messageRepository.insert(messages);
  }
}
