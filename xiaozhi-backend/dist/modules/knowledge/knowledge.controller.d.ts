import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
export declare class KnowledgeController {
    private readonly knowledgeService;
    constructor(knowledgeService: KnowledgeService);
    create(createDto: CreateKnowledgeBaseDto): Promise<import("../../entities/knowledge-base.entity").KnowledgeBase>;
    findAll(): Promise<import("../../entities/knowledge-base.entity").KnowledgeBase[]>;
    findOne(id: string): Promise<import("../../entities/knowledge-base.entity").KnowledgeBase>;
    update(id: string, updateDto: any): Promise<import("../../entities/knowledge-base.entity").KnowledgeBase>;
    remove(id: string): Promise<void>;
    search(id: string, body: {
        query: string;
        topK?: number;
    }): Promise<any[]>;
}
