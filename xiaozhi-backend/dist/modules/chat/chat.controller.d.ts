import { Response } from 'express';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    sendMessage(sendMessageDto: SendMessageDto): Promise<import("../../entities/message.entity").Message>;
    streamChat(sessionId: string, sendMessageDto: SendMessageDto, res: Response): Promise<void>;
    stopGeneration(sessionId: string): {
        success: boolean;
        message: string;
    };
    feedback(messageId: string, body: {
        rating: 'like' | 'dislike';
        comment?: string;
    }): Promise<import("../../entities/message.entity").Message>;
}
