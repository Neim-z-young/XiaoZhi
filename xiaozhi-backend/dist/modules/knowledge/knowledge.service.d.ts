import { Repository } from 'typeorm';
import { KnowledgeBase } from '../../entities/knowledge-base.entity';
export declare class KnowledgeService {
    private readonly knowledgeBaseRepository;
    constructor(knowledgeBaseRepository: Repository<KnowledgeBase>);
    create(userId: string, createDto: any): Promise<KnowledgeBase>;
    findAll(userId: string): Promise<KnowledgeBase[]>;
    findOne(id: string, userId: string): Promise<KnowledgeBase>;
    update(id: string, userId: string, updateDto: any): Promise<KnowledgeBase>;
    remove(id: string, userId: string): Promise<void>;
    search(id: string, userId: string, query: string, topK?: number): Promise<any[]>;
}
