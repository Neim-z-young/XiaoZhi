import { Controller, Post, Get, Body, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ChatService } from './chat.service';

@ApiTags('对话')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: '发送消息' })
  async sendMessage(
    @Body() body: { sessionId: string; message: string; model?: string },
  ) {
    return this.chatService.sendMessage(
      body.sessionId,
      'default-user-id',
      body.message,
      body.model,
    );
  }

  @Get(':sessionId/stream')
  @ApiOperation({ summary: 'SSE 流式对话' })
  async streamChat(
    @Param('sessionId') sessionId: string,
    @Query('message') message: string,
    @Query('model') model: string,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const sendSSE = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // 调用 AI 获取流式响应
      const aiStream = await this.chatService.getAIStream(
        sessionId,
        'default-user-id',
        message,
        model,
      );

      for await (const chunk of aiStream) {
        sendSSE({ content: chunk, done: false });
      }
      sendSSE({ content: '', done: true });
    } catch (error) {
      console.error('Stream error:', error);
      sendSSE({ content: `错误: ${error.message}`, done: true });
    }

    res.end();
  }

  @Post(':sessionId/stop')
  @ApiOperation({ summary: '中断生成' })
  stopGeneration(@Param('sessionId') sessionId: string) {
    this.chatService.stopGeneration(sessionId);
    return { success: true };
  }

  @Post('messages/:messageId/feedback')
  @ApiOperation({ summary: '消息反馈' })
  feedback(
    @Param('messageId') messageId: string,
    @Body() body: { rating: 'like' | 'dislike'; comment?: string },
  ) {
    return this.chatService.feedback(
      messageId,
      'default-user-id',
      body.rating,
      body.comment,
    );
  }
}
