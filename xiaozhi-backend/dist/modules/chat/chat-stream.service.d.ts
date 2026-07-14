export declare class ChatStreamService {
    private abortControllers;
    createStream(sessionId: string): {
        controller: AbortController;
        stream: ReadableStream;
    };
    stopStream(sessionId: string): void;
    private sleep;
}
