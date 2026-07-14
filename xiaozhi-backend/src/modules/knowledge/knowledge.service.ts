import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeBase } from '../../entities/knowledge-base.entity';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(KnowledgeBase)
    private readonly knowledgeBaseRepository: Repository<KnowledgeBase>,
  ) {}

  async create(userId: string, createDto: any): Promise<KnowledgeBase> {
    const kb = new KnowledgeBase();
    Object.assign(kb, { ...createDto, userId });
    return this.knowledgeBaseRepository.save(kb) as Promise<KnowledgeBase>;
  }

  async findAll(userId: string): Promise<KnowledgeBase[]> {
    return this.knowledgeBaseRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<KnowledgeBase> {
    const kb = await this.knowledgeBaseRepository.findOne({
      where: { id, userId },
    });
    if (!kb) {
      throw new NotFoundException('知识库不存在');
    }
    return kb;
  }

  async update(id: string, userId: string, updateDto: any): Promise<KnowledgeBase> {
    const kb = await this.findOne(id, userId);
    Object.assign(kb, updateDto);
    return this.knowledgeBaseRepository.save(kb);
  }

  async remove(id: string, userId: string): Promise<void> {
    const kb = await this.findOne(id, userId);
    await this.knowledgeBaseRepository.softRemove(kb);
  }

  async search(id: string, userId: string, query: string, topK = 5): Promise<any[]> {
    // 验证知识库存在
    await this.findOne(id, userId);
    
    // TODO: 实现实际的 RAG 检索
    // 1. 将查询向量化
    // 2. 在 pgvector 中检索相似文档块
    // 3. 返回检索结果
    return [
      { documentId: 'doc-1', content: '模拟检索结果：' + query, score: 0.95 },
    ];
  }
}
