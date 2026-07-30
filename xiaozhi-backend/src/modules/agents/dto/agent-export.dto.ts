/**
 * 智能体导入导出格式
 * 模板格式：
 * ### 名称
 * 智能体名称
 * 
 * ### 英文标识名
 * my-agent
 * 
 * ### 描述
 * 智能体描述内容...
 * 
 * ### 提示词
 * 智能体提示词内容...
 */
export class AgentExportDto {
  /** 智能体名称 */
  name?: string;
  
  /** 英文标识名 */
  slug?: string;
  
  /** 描述 */
  description?: string;
  
  /** 提示词 */
  prompt?: string;
  
  /** 原始导出文本 */
  rawText?: string;
}

/**
 * 导入结果
 */
export class ImportResultDto {
  success: boolean;
  message?: string;
  agent?: any;
  errors?: string[];
}
