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
  private abortControllers = new Map<string, AbortController>();

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    private readonly aiGateway: AIGatewayService,
  ) {}

  async sendMessage(sessionId: string, userId: string, content: string, model?: string): Promise<Message> {
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
    let selectedModel = model || 'gpt-4o-mini';
    
    if (!model && session.agentId) {
      const agent = await this.agentRepository.findOne({ where: { id: session.agentId } });
      if (agent) {
        selectedModel = agent.modelId || selectedModel;
        if (agent.prompt) {
          aiMessages.unshift({ role: 'system', content: agent.prompt });
        }
      }
    }

    try {
      // 调用 AI
      const response = await this.aiGateway.complete({
        model: selectedModel,
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

  async getAIStream(sessionId: string, userId: string, content: string, model?: string): Promise<AsyncGenerator<string>> {
    // 验证会话
    let session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId },
    });
    
    if (!session) {
      // 如果会话不存在，创建一个新的
      session = new Session();
      session.id = sessionId;
      session.userId = userId;
      session.lastMessageAt = new Date();
      session.createdAt = new Date();
      await this.sessionRepository.save(session);
    }

    // 保存用户消息
    const userMessage = new Message();
    userMessage.sessionId = sessionId;
    userMessage.role = 'user';
    userMessage.content = content;
    await this.messageRepository.save(userMessage);

    // 获取历史消息
    const historyMessages = await this.getMessages(sessionId, userId);
    const aiMessages: AIMessage[] = historyMessages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));
    aiMessages.push({ role: 'user', content });

    // 获取模型（优先使用传入的模型，其次使用 agent 配置，最后默认）
    let selectedModel = model || 'gpt-4o-mini';
    if (!model && session.agentId) {
      const agent = await this.agentRepository.findOne({ where: { id: session.agentId } });
      if (agent?.modelId) {
        selectedModel = agent.modelId;
      }
    }
    this.logger.log(`getAIStream: received model="${model}", selectedModel="${selectedModel}", session.agentId="${session.agentId}"`);

    // 创建 AbortController 用于中断
    const abortController = new AbortController();
    this.abortControllers.set(sessionId, abortController);

    // 返回异步生成器
    const self = this;
    return (async function*() {
      try {
        for await (const chunk of self.aiGateway.stream({ model: selectedModel, messages: aiMessages })) {
          if (abortController.signal.aborted) {
            break;
          }
          yield chunk.content;
        }
      } finally {
        self.abortControllers.delete(sessionId);
      }
    })();
  }

  stopGeneration(sessionId: string): void {
    const controller = this.abortControllers.get(sessionId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(sessionId);
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
