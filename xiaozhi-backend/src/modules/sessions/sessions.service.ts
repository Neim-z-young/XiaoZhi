import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../../entities/session.entity';
import { Message } from '../../entities/message.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async create(userId: string, createSessionDto: any): Promise<Session> {
    const session = new Session();
    Object.assign(session, { ...createSessionDto, userId, lastMessageAt: new Date() });
    return this.sessionRepository.save(session) as Promise<Session>;
  }

  async findAll(userId: string, page = 1, pageSize = 20, agentId?: string): Promise<{ list: Session[]; total: number }> {
    const query = this.sessionRepository.createQueryBuilder('session')
      .where('session.user_id = :userId', { userId })
      .andWhere('session.deleted_at IS NULL');

    if (agentId) {
      query.andWhere('session.agent_id = :agentId', { agentId });
    }

    const [list, total] = await query
      .orderBy('session.last_message_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total };
  }

  async findOne(id: string, userId: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id, userId },
      relations: ['messages'],
    });
    if (!session) {
      throw new NotFoundException('会话不存在');
    }
    return session;
  }

  async update(id: string, userId: string, updateSessionDto: any): Promise<Session> {
    const session = await this.findOne(id, userId);
    Object.assign(session, updateSessionDto);
    return this.sessionRepository.save(session);
  }

  async remove(id: string, userId: string): Promise<void> {
    const session = await this.findOne(id, userId);
    await this.sessionRepository.softRemove(session);
  }

  async getMessages(sessionId: string, userId: string, before?: string, limit = 50): Promise<Message[]> {
    await this.findOne(sessionId, userId);
    
    const query = this.messageRepository.createQueryBuilder('message')
      .where('message.session_id = :sessionId', { sessionId })
      .orderBy('message.created_at', 'DESC')
      .take(limit);

    if (before) {
      query.andWhere('message.id < :before', { before });
    }

    return query.getMany();
  }

  async updateLastMessageTime(sessionId: string): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      lastMessageAt: new Date(),
    });
  }
}
