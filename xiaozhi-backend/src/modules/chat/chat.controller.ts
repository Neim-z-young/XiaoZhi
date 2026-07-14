import { Controller, Post, Get, Body, Param, Query, Res, Sse } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { Observable, Subject } from 'rxjs';

@ApiTags('对话')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: '发送消息' })
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(
      sendMessageDto.sessionId,
      'default-user-id',
      sendMessageDto.message,
    );
  }

  @Sse(':sessionId/stream')
  @ApiOperation({ summary: 'SSE 流式对话' })
  async streamChat(
    @Param('sessionId') sessionId: string,
    @Body() sendMessageDto: SendMessageDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // TODO: 实际实现需要调用 AI 模型并流式返回
    // 这里发送模拟数据
    const sendSSE = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendSSE({ content: '这是一条模拟流式响应，实际需要接入 AI 模型', done: false });

    setTimeout(() => {
      sendSSE({ content: '', done: true });
      res.end();
    }, 1000);

    return;
  }

  @Post(':sessionId/stop')
  @ApiOperation({ summary: '中断生成' })
  stopGeneration(@Param('sessionId') sessionId: string) {
    // TODO: 实现中断逻辑
    return { success: true, message: '生成已中断' };
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
