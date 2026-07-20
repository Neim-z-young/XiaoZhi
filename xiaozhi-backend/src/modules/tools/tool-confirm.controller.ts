import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ToolRegistry, ToolCall } from '../tools/tool-registry.service';

@ApiTags('工具确认')
@Controller('tools')
export class ToolConfirmController {
  constructor(private readonly toolRegistry: ToolRegistry) {}

  @Get('pending')
  @ApiOperation({ summary: '获取待确认操作列表' })
  getPendingConfirmations(): ToolCall[] {
    return this.toolRegistry.getPendingConfirmations();
  }

  @Get('pending/:id')
  @ApiOperation({ summary: '获取单个待确认操作详情' })
  getPendingConfirmation(@Param('id') id: string): ToolCall | undefined {
    return this.toolRegistry.getPendingConfirmation(id);
  }

  @Post('approve/:id')
  @ApiOperation({ summary: '批准操作' })
  async approveConfirmation(@Param('id') id: string) {
    console.log(`[ToolConfirm] approve called with id: ${id}`);
    const call = this.toolRegistry.getPendingConfirmation(id);
    console.log(`[ToolConfirm] pending confirmation: ${JSON.stringify(call)}`);

    if (!call) {
      console.log(`[ToolConfirm] Confirmation not found for id: ${id}`);
      return { success: false, error: 'Confirmation not found' };
    }

    const tool = this.toolRegistry.getTool(call.toolName);
    console.log(`[ToolConfirm] tool found: ${JSON.stringify(tool ? { name: tool.name, level: tool.level } : null)}`);

    if (!tool) {
      console.log(`[ToolConfirm] Tool not found: ${call.toolName}`);
      return { success: false, error: 'Tool not found' };
    }

    // 执行工具
    let result;
    try {
      const handlerResult = await tool.handler(call.arguments);
      // handlerResult 可能已经是 { success, content/error } 格式，或者直接是内容
      if (typeof handlerResult === 'object' && 'success' in handlerResult) {
        result = handlerResult;
      } else {
        result = { success: true, content: handlerResult };
      }
    } catch (error: any) {
      result = { success: false, error: error.message };
    }

    // 删除待确认记录
    this.toolRegistry.deletePendingConfirmation(id);

    // 设置结果，这会 resolve AgentExecutor 中等待的 Promise
    this.toolRegistry.setApprovalResult(id, result);
    return result;
  }

  @Post('reject/:id')
  @ApiOperation({ summary: '拒绝操作' })
  rejectConfirmation(@Param('id') id: string) {
    this.toolRegistry.rejectApproval(id);
    return { success: true };
  }
}
