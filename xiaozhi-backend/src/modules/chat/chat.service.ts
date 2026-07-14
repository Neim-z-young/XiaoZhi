import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../../entities/session.entity';
import { Message } from '../../entities/message.entity';
import { Agent } from '../../entities/agent.entity';
import { AIGatewayService } from '../ai/ai-gateway.service';
import { AIMessage } from '../ai/ai-adapter.interface';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    private readonly aiGateway: AIGatewayService,
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
    const userMessage = new Message();
    userMessage.sessionId = sessionId;
    userMessage.role = 'user';
    userMessage.content = content;
    await this.messageRepository.save(userMessage);

    // 更新会话最后消息时间
    await this.sessionRepository.update(sessionId, {
      lastMessageAt: new Date(),
    });

    // 获取历史消息构建上下文
    const historyMessages = await this.getMessages(sessionId, userId);
    const aiMessages: AIMessage[] = historyMessages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    // 添加当前用户消息
    aiMessages.push({ role: 'user', content });

    // 获取智能体配置
    let model = 'gpt-4o-mini';
    let systemPrompt = '你是一个有帮助的 AI 助手。';
    
    if (session.agentId) {
      const agent = await this.agentRepository.findOne({ where: { id: session.agentId } });
      if (agent) {
        model = agent.modelId || model;
        if (agent.prompt) {
          aiMessages.unshift({ role: 'system', content: agent.prompt });
        }
      }
    }

    try {
      // 调用 AI
      const response = await this.aiGateway.complete({
        model,
        messages: aiMessages,
        temperature: 0.7,
      });

      // 保存 AI 回复
      const assistantMessage = new Message();
      assistantMessage.sessionId = sessionId;
      assistantMessage.role = 'assistant';
      assistantMessage.content = response.content;
      assistantMessage.meta = { model: response.model, usage: response.usage };
      await this.messageRepository.save(assistantMessage);

      return assistantMessage;
    } catch (error) {
      this.logger.error(`AI call failed: ${error.message}`);
      
      // 保存错误回复
      const errorMessage = new Message();
      errorMessage.sessionId = sessionId;
      errorMessage.role = 'assistant';
      errorMessage.content = `抱歉，发生了错误：${error.message}`;
      errorMessage.meta = { error: true };
      await this.messageRepository.save(errorMessage);

      return errorMessage;
    }
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
