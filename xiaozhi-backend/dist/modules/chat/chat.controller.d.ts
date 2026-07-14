import { Response } from 'express';
import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    sendMessage(body: {
        sessionId: string;
        message: string;
        model?: string;
    }): Promise<import("../../entities/message.entity").Message>;
    streamChat(sessionId: string, message: string, model: string, res: Response): Promise<void>;
    stopGeneration(sessionId: string): {
        success: boolean;
    };
    feedback(messageId: string, body: {
        rating: 'like' | 'dislike';
        comment?: string;
    }): Promise<import("../../entities/message.entity").Message>;
}
