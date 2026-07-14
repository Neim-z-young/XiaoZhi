import { Session } from './session.entity';
export declare class Message {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    meta: Record<string, any> | null;
    feedback: 'like' | 'dislike';
    feedbackComment: string | null;
    createdAt: Date;
    session: Session;
}
