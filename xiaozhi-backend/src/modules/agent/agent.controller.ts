import { Controller, Get, Post, Param, Query, Body, Res, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { AgentExecutor, AgentStreamEvent } from './agent-executor.service';

@ApiTags('Agent')
@Controller('agent')
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(private readonly agentExecutor: AgentExecutor) {}

  @Get('stream')
  @ApiOperation({ summary: 'Agent 流式对话' })
  async streamChat(
    @Query('message') message: string,
    @Query('model') model: string,
    @Query('sessionId') sessionId: string,
    @Res() res: Response,
  ) {
    this.logger.log(`streamChat called: message="${message}", model="${model}"`);
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const sendSSE = (data: AgentStreamEvent) => {
      this.logger.log(`SSE send: ${JSON.stringify(data)}`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const generator = this.agentExecutor.execute(message, {
        model: model || 'gpt-4o-mini',
        maxIterations: 10,
      }, {
        onEvent: sendSSE,
        messages: [],
      });

      for await (const event of generator) {
        // 事件已通过 onEvent 发送，这里只处理循环结束
        if (event.type === 'done' || event.type === 'error') {
          break;
        }
      }
    } catch (error: any) {
      this.logger.error(`streamChat error: ${error.message}`);
      sendSSE({ type: 'error', content: error.message });
    }

    res.end();
  }
}
