import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../../entities/workspace.entity';

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(
    @InjectRepository(Workspace)
    private workspaceRepo: Repository<Workspace>,
  ) {}

  async findAll(): Promise<Workspace[]> {
    return this.workspaceRepo.find();
  }

  async findOne(id: string): Promise<Workspace | null> {
    return this.workspaceRepo.findOne({ where: { id } });
  }

  async findEnabled(): Promise<Workspace[]> {
    return this.workspaceRepo.find({ where: { enabled: true } });
  }

  async create(data: Partial<Workspace>): Promise<Workspace> {
    const workspace = this.workspaceRepo.create(data);
    return this.workspaceRepo.save(workspace);
  }

  async update(id: string, data: Partial<Workspace>): Promise<Workspace | null> {
    await this.workspaceRepo.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.workspaceRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async enable(id: string): Promise<Workspace | null> {
    return this.update(id, { enabled: true });
  }

  async disable(id: string): Promise<Workspace | null> {
    return this.update(id, { enabled: false });
  }
}
