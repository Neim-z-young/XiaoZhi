"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeAdapter = void 0;
class ClaudeAdapter {
    constructor(config) {
        this.apiKey = config.apiKey || '';
        this.baseURL = config.baseURL || 'https://api.anthropic.com/v1';
    }
    async complete(request) {
        const systemMessage = request.messages.find(m => m.role === 'system');
        const otherMessages = request.messages.filter(m => m.role !== 'system');
        const response = await fetch(`${this.baseURL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: request.model,
                messages: otherMessages.map(m => ({ role: m.role, content: m.content })),
                system: systemMessage?.content,
                temperature: request.temperature ?? 0.7,
                max_tokens: request.maxTokens ?? 2048,
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Claude API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        return {
            content: data.content?.[0]?.text || '',
            model: data.model,
        };
    }
    async *stream(request) {
        const systemMessage = request.messages.find(m => m.role === 'system');
        const otherMessages = request.messages.filter(m => m.role !== 'system');
        const response = await fetch(`${this.baseURL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: request.model,
                messages: otherMessages.map(m => ({ role: m.role, content: m.content })),
                system: systemMessage?.content,
                temperature: request.temperature ?? 0.7,
                max_tokens: request.maxTokens ?? 2048,
                stream: true,
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Claude API error: ${response.status} - ${error}`);
        }
        const reader = response.body?.getReader();
        if (!reader)
            throw new Error('No response body');
        const decoder = new TextDecoder();
        let buffer = '';
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.type === 'content_block_delta') {
                                const content = parsed.delta?.text || '';
                                if (content) {
                                    yield { content, done: false };
                                }
                            }
                            else if (parsed.type === 'message_delta') {
                                yield { content: '', done: true };
                                return;
                            }
                        }
                        catch {
                        }
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
        yield { content: '', done: true };
    }
}
exports.ClaudeAdapter = ClaudeAdapter;
//# sourceMappingURL=claude.adapter.js.map