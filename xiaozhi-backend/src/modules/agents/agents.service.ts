import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../../entities/agent.entity';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
  ) {}

  async create(userId: string, createAgentDto: any): Promise<Agent> {
    const agent = new Agent();
    Object.assign(agent, { ...createAgentDto, userId });
    return this.agentRepository.save(agent) as Promise<Agent>;
  }

  async findAll(userId: string, page = 1, pageSize = 20, keyword?: string): Promise<{ list: Agent[]; total: number }> {
    const query = this.agentRepository.createQueryBuilder('agent')
      .where('agent.user_id = :userId', { userId })
      .andWhere('agent.deleted_at IS NULL');

    if (keyword) {
      query.andWhere('(agent.name ILIKE :keyword OR agent.description ILIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    const [list, total] = await query
      .orderBy('agent.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total };
  }

  async findOne(id: string, userId: string): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { id, userId },
      relations: ['plugins'],
    });
    if (!agent) {
      throw new NotFoundException('智能体不存在');
    }
    return agent;
  }

  async update(id: string, userId: string, updateAgentDto: any): Promise<Agent> {
    const agent = await this.findOne(id, userId);
    Object.assign(agent, updateAgentDto);
    return this.agentRepository.save(agent);
  }

  async remove(id: string, userId: string): Promise<void> {
    const agent = await this.findOne(id, userId);
    await this.agentRepository.softRemove(agent);
  }
}
