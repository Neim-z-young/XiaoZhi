import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Agent } from '../../entities/agent.entity';
import { Plugin } from '../../entities/plugin.entity';
import { AgentExportDto, ImportResultDto } from './dto/agent-export.dto';
import { AIGatewayService } from '../ai/ai-gateway.service';

// 长度限制
const LIMITS = {
  name: 30,
  slug: 50,
  description: 5000,
  prompt: 10000,
};

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(Plugin)
    private readonly pluginRepository: Repository<Plugin>,
    private readonly aiGatewayService: AIGatewayService,
  ) {}

  async create(userId: string, createAgentDto: any): Promise<Agent> {
    const agent = new Agent();
    const { mcpServers, toolNames, ...rest } = createAgentDto;
    Object.assign(agent, { ...rest, userId });
    if (!agent.settings) {
      agent.settings = {};
    }
    if (mcpServers) {
      agent.mcpServers = mcpServers;
    }
    if (toolNames && toolNames.length > 0) {
      agent.toolNames = toolNames;
    }
    return this.agentRepository.save(agent) as Promise<Agent>;
  }

  async findAll(userId: string, page = 1, pageSize = 20, keyword?: string): Promise<{ list: Agent[]; total: number }> {
    const qb = this.agentRepository
      .createQueryBuilder('agent')
      .where('agent.user_id = :userId', { userId })
      .andWhere('agent.deleted_at IS NULL');

    if (keyword) {
      qb.andWhere('(agent.name ILIKE :keyword OR agent.description ILIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    const total = await qb.getCount();
    
    const list = await qb
      .orderBy('agent.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();
    
    // 单独加载 plugins 关系
    const agentIds = list.map(a => a.id);
    if (agentIds.length > 0) {
      const agentsWithPlugins = await this.agentRepository
        .createQueryBuilder('agent')
        .leftJoinAndSelect('agent.plugins', 'plugins')
        .where('agent.id IN (:...ids)', { ids: agentIds })
        .getMany();
      
      // 合并 plugins 数据
      const pluginsMap = new Map(agentsWithPlugins.map(a => [a.id, a.plugins || []]));
      list.forEach(agent => {
        (agent as any).plugins = pluginsMap.get(agent.id) || [];
      });
    }

    return { list, total };
  }

  async findOne(id: string, userId: string): Promise<Agent | null> {
    const agent = await this.agentRepository.findOne({
      where: { id, userId },
      relations: ['plugins'],
    });
    return agent;
  }

  async findById(id: string): Promise<Agent | null> {
    // 不验证 userId，直接通过 ID 查找
    const agent = await this.agentRepository.findOne({
      where: { id },
      relations: ['plugins'],
    });
    return agent;
  }

  async update(id: string, userId: string, updateAgentDto: any): Promise<Agent> {
    const agent = await this.findOne(id, userId);
    if (!agent) {
      throw new NotFoundException('智能体不存在');
    }

    // 锁定状态下不允许修改
    if (agent.locked) {
      throw new ForbiddenException('智能体已锁定，无法修改');
    }

    const { mcpServers, toolNames, ...rest } = updateAgentDto;

    // 不允许修改锁定状态以外的字段
    const allowedFields = ['name', 'slug', 'description', 'modelId', 'prompt', 'settings', 'enabled'];
    const filteredDto = Object.keys(rest)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => ({ ...obj, [key]: rest[key] }), {});

    Object.assign(agent, filteredDto);

    // 处理 mcpServers
    if (mcpServers !== undefined) {
      agent.mcpServers = mcpServers;
    }

    // 处理 toolNames
    if (toolNames !== undefined) {
      agent.toolNames = toolNames && toolNames.length > 0 ? toolNames : [];
    }

    return this.agentRepository.save(agent);
  }

  async remove(id: string, userId: string): Promise<void> {
    const agent = await this.findOne(id, userId);
    if (!agent) {
      throw new NotFoundException('智能体不存在');
    }

    // 锁定状态下不允许删除
    if (agent.locked) {
      throw new ForbiddenException('智能体已锁定，无法删除');
    }

    await this.agentRepository.softRemove(agent);
  }

  /**
   * 锁定/解锁智能体
   */
  async toggleLock(id: string, userId: string, lock: boolean): Promise<Agent> {
    const agent = await this.findOne(id, userId);
    if (!agent) {
      throw new NotFoundException('智能体不存在');
    }
    agent.locked = lock;
    return this.agentRepository.save(agent);
  }

  /**
   * 导出智能体为 Markdown 格式
   */
  exportAgent(agent: Agent): string {
    const lines: string[] = [
      '# ' + (agent.name || ''),
      '',
      '## 英文标识名',
      agent.slug || this.generateSlug(agent.name),
      '',
      '## 描述',
      agent.description || '',
      '',
      '## 提示词',
      agent.prompt || '',
    ];
    return lines.join('\n');
  }

  /**
   * 导入智能体（支持模板格式和智能解析）
   */
  async importAgent(userId: string, content: string): Promise<ImportResultDto> {
    const errors: string[] = [];
    
    // 尝试解析模板格式
    const parsed = this.parseTemplateFormat(content);
    
    if (!parsed.name) {
      errors.push('缺少名称，请使用模板格式或在文本中包含 ### 名称');
    }
    
    // 验证长度
    if (parsed.name && parsed.name.length > LIMITS.name) {
      errors.push(`名称超过${LIMITS.name}字限制`);
    }
    if (parsed.description && parsed.description.length > LIMITS.description) {
      errors.push(`描述超过${LIMITS.description}字限制`);
    }
    if (parsed.prompt && parsed.prompt.length > LIMITS.prompt) {
      errors.push(`提示词超过${LIMITS.prompt}字限制`);
    }
    
    if (errors.length > 0) {
      return { success: false, errors };
    }
    
    // 生成 slug
    const slug = parsed.slug || this.generateSlug(parsed.name!);
    if (slug.length > LIMITS.slug) {
      errors.push(`英文标识名超过${LIMITS.slug}字限制`);
    }
    
    if (errors.length > 0) {
      return { success: false, errors };
    }
    
    // 创建智能体
    const agent = await this.create(userId, {
      name: parsed.name,
      slug: parsed.slug || this.generateSlug(parsed.name!),
      description: parsed.description || '',
      prompt: parsed.prompt || '',
      modelId: 'default',
      settings: {},
      enabled: true,
    });
    
    return { success: true, agent };
  }

  /**
   * 解析模板格式（支持 Markdown 和旧格式）
   */
  private parseTemplateFormat(content: string): AgentExportDto {
    const result: AgentExportDto = { rawText: content };
    
    // Markdown 格式 # 名称\n内容
    const mdPatterns = {
      name: /^#\s*(.+)/m,
      slug: /^##\s*英文标识名\s*\n([^\n]*)/im,
      description: /^##\s*描述\s*\n([\s\S]*?)(?=^##|\n*$)/im,
      prompt: /^##\s*提示词\s*\n([\s\S]*?)$/im,
    };
    
    // 旧格式 ### 名称\n内容
    const oldPatterns = {
      name: /^###\s*名称\s*\n([^\n]*)/im,
      slug: /^###\s*英文标识名\s*\n([^\n]*)/im,
      description: /^###\s*描述\s*\n([\s\S]*?)(?=^###|\n*$)/im,
      prompt: /^###\s*提示词\s*\n([\s\S]*?)$/im,
    };
    
    // 先尝试 Markdown 格式
    const mdNameMatch = content.match(mdPatterns.name);
    if (mdNameMatch) result.name = mdNameMatch[1].trim();
    
    const mdSlugMatch = content.match(mdPatterns.slug);
    if (mdSlugMatch) result.slug = mdSlugMatch[1].trim();
    
    const mdDescMatch = content.match(mdPatterns.description);
    if (mdDescMatch) result.description = mdDescMatch[1].trim();
    
    const mdPromptMatch = content.match(mdPatterns.prompt);
    if (mdPromptMatch) result.prompt = mdPromptMatch[1].trim();
    
    // 如果是旧格式或智能解析
    if (!result.name && !result.prompt) {
      const oldNameMatch = content.match(oldPatterns.name);
      if (oldNameMatch) result.name = oldNameMatch[1].trim();
      
      const oldSlugMatch = content.match(oldPatterns.slug);
      if (oldSlugMatch) result.slug = oldSlugMatch[1].trim();
      
      const oldDescMatch = content.match(oldPatterns.description);
      if (oldDescMatch) result.description = oldDescMatch[1].trim();
      
      const oldPromptMatch = content.match(oldPatterns.prompt);
      if (oldPromptMatch) result.prompt = oldPromptMatch[1].trim();
    }
    
    // 如果都不是，尝试智能解析
    if (!result.name && !result.prompt) {
      return this.smartParse(content);
    }
    
    return result;
  }

  /**
   * 智能解析非模板格式文本
   */
  private smartParse(content: string): AgentExportDto {
    const result: AgentExportDto = { rawText: content };
    
    // 尝试识别第一行作为名称
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      result.name = lines[0].substring(0, LIMITS.name);
    }
    
    // 尝试识别提示词模式
    const promptPatterns = [
      /你是(.*)/i,
      /你是一个?(.*)/i,
      /角色(.*)/i,
      /设定(.*)/i,
    ];
    
    for (const pattern of promptPatterns) {
      const match = content.match(pattern);
      if (match) {
        result.prompt = content.substring(content.indexOf(match[0])).substring(0, LIMITS.prompt);
        result.description = content.substring(0, content.indexOf(match[0])).trim().substring(0, LIMITS.description);
        break;
      }
    }
    
    // 如果还是没识别出来，整个内容作为提示词
    if (!result.prompt && content.length > 10) {
      result.prompt = content.substring(0, LIMITS.prompt);
    }
    
    return result;
  }

  /**
   * 根据内容生成智能体信息（使用 AI）
   */
  async generateAgent(content: string, modelId: string): Promise<{ name: string; slug: string; description: string; prompt: string }> {
    const prompt = `你是一个智能体配置生成器。请根据用户提供的原始内容，生成一个完整的智能体配置。

请生成以下四个字段：
1. name（名称，${LIMITS.name}字以内）
2. slug（英文标识名，只能包含小写字母、数字和连字符，用于 URL 标识，如 "my-agent"）
3. description（描述，${LIMITS.description}字以内）
4. prompt（提示词，${LIMITS.prompt}字以内，应该定义这个智能体的角色、能力、工作方式等）

请以 JSON 格式返回，格式如下：
{
  "name": "智能体名称",
  "slug": "english-slug-name",
  "description": "智能体描述",
  "prompt": "智能体提示词"
}

用户内容：
${content.substring(0, 5000)}

请直接返回 JSON，不要有其他内容。`;

    try {
      const response = await this.aiGatewayService.complete({
        model: modelId,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        maxTokens: 2000,
      });

      const text = response.content || '';
      
      // 提取 JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI 返回格式错误');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // 验证并清理数据
      return {
        name: (parsed.name || '未命名智能体').substring(0, LIMITS.name),
        slug: (parsed.slug || this.generateSlug(parsed.name || 'agent')).substring(0, LIMITS.slug),
        description: (parsed.description || '').substring(0, LIMITS.description),
        prompt: (parsed.prompt || content).substring(0, LIMITS.prompt),
      };
    } catch (error) {
      console.error('Generate agent failed:', error);
      throw new Error('AI 生成失败，请检查模型配置');
    }
  }

  /**
   * 根据名称生成英文标识名
   */
  private generateSlug(name: string): string {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, LIMITS.slug);
  }
}
