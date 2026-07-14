"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatStreamService = void 0;
const common_1 = require("@nestjs/common");
let ChatStreamService = class ChatStreamService {
    constructor() {
        this.abortControllers = new Map();
    }
    createStream(sessionId) {
        const controller = new AbortController();
        this.abortControllers.set(sessionId, controller);
        const stream = new ReadableStream({
            start: (ctrl) => {
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
    stopStream(sessionId) {
        const controller = this.abortControllers.get(sessionId);
        if (controller) {
            controller.abort();
            this.abortControllers.delete(sessionId);
        }
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};
exports.ChatStreamService = ChatStreamService;
exports.ChatStreamService = ChatStreamService = __decorate([
    (0, common_1.Injectable)()
], ChatStreamService);
//# sourceMappingURL=chat-stream.service.js.map