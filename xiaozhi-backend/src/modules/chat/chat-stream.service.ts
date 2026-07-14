import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatStreamService {
  private abortControllers = new Map<string, AbortController>();

  createStream(sessionId: string): { controller: AbortController; stream: ReadableStream } {
    const controller = new AbortController();
    this.abortControllers.set(sessionId, controller);

    const stream = new ReadableStream({
      start: (ctrl) => {
        // 模拟流式响应
        const message = '这是一条模拟的流式响应，实际需要接入 AI 模型。';
        
        const sendChunk = async () => {
          for (let i = 0; i < message.length; i++) {
            if (controller.signal.aborted) {
              break;
            }
            ctrl.enqueue(`data: ${JSON.stringify({ content: message[i], done: false })}\n\n`);
            await this.sleep(50);
          }
          ctrl.enqueue(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
        };
        
        sendChunk();
      },
      cancel: () => {
        this.abortControllers.delete(sessionId);
      },
    });

    return { controller, stream };
  }

  stopStream(sessionId: string): void {
    const controller = this.abortControllers.get(sessionId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(sessionId);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
