import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../../entities/workspace.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
  ) {}

  async create(userId: string, createDto: any): Promise<Workspace> {
    const workspace = new Workspace();
    Object.assign(workspace, { ...createDto, userId });
    return this.workspaceRepository.save(workspace) as Promise<Workspace>;
  }

  async findAll(userId: string): Promise<Workspace[]> {
    return this.workspaceRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id, userId },
    });
    if (!workspace) {
      throw new NotFoundException('工作区不存在');
    }
    return workspace;
  }

  async update(id: string, userId: string, updateDto: any): Promise<Workspace> {
    const workspace = await this.findOne(id, userId);
    Object.assign(workspace, updateDto);
    return this.workspaceRepository.save(workspace) as Promise<Workspace>;
  }

  async remove(id: string, userId: string): Promise<void> {
    const workspace = await this.findOne(id, userId);
    await this.workspaceRepository.softRemove(workspace);
  }

  async getFileTree(id: string, userId: string, relativePath = '/'): Promise<any> {
    const workspace = await this.findOne(id, userId);
    const fullPath = path.join(workspace.rootPath, relativePath);

    if (!fs.existsSync(fullPath)) {
      return { path: relativePath, items: [] };
    }

    const items = fs.readdirSync(fullPath, { withFileTypes: true });
    return {
      path: relativePath,
      items: items.map((item) => ({
        name: item.name,
        type: item.isDirectory() ? 'directory' : 'file',
        size: item.isFile() ? fs.statSync(path.join(fullPath, item.name)).size : 0,
      })),
    };
  }

  async search(id: string, userId: string, query: string): Promise<any[]> {
    // TODO: 实现文件搜索
    console.log(`Searching in workspace ${id} for: ${query}`);
    return [];
  }
}
