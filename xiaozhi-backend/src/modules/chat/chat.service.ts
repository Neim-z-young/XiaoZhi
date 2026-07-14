import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../../entities/session.entity';
import { Message } from '../../entities/message.entity';
import { Agent } from '../../entities/agent.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
  ) {}

  async sendMessage(sessionId: string, userId: string, content: string): Promise<Message> {
    // 验证会话存在
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new NotFoundException('会话不存在');
    }

    // 保存用户消息
    const userMessage = this.messageRepository.create({
      sessionId,
      role: 'user',
      content,
    });
    await this.messageRepository.save(userMessage);

    // 更新会话最后消息时间
    await this.sessionRepository.update(sessionId, {
      lastMessageAt: new Date(),
    });

    // TODO: 调用 AI 模型获取回复
    // 这里暂时返回模拟响应
    const assistantMessage = this.messageRepository.create({
      sessionId,
      role: 'assistant',
      content: '这是一个模拟响应，实际需要接入 AI 模型',
      meta: { model: session.agentId ? 'simulated' : 'none' },
    });
    await this.messageRepository.save(assistantMessage);

    return assistantMessage;
  }

  async getMessages(sessionId: string, userId: string, before?: string, limit = 50): Promise<Message[]> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new NotFoundException('会话不存在');
    }

    const query = this.messageRepository.createQueryBuilder('message')
      .where('message.session_id = :sessionId', { sessionId })
      .orderBy('message.created_at', 'DESC')
      .take(limit);

    if (before) {
      query.andWhere('message.id < :before', { before });
    }

    return query.getMany();
  }

  async feedback(messageId: string, userId: string, rating: 'like' | 'dislike', comment?: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['session'],
    });
    if (!message || message.session.userId !== userId) {
      throw new NotFoundException('消息不存在');
    }

    message.feedback = rating;
    message.feedbackComment = comment ?? null;
    return this.messageRepository.save(message);
  }
}
