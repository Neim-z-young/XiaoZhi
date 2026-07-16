"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SandboxService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SandboxService = void 0;
const common_1 = require("@nestjs/common");
const vm2_1 = require("vm2");
let SandboxService = SandboxService_1 = class SandboxService {
    constructor() {
        this.logger = new common_1.Logger(SandboxService_1.name);
    }
    async execute(code, context = {}, options = {}) {
        const timeout = options.timeout || 5000;
        const logs = [];
        const vm = new vm2_1.VM({
            timeout,
            sandbox: {
                console: {
                    log: (...args) => {
                        logs.push(args.map(a => JSON.stringify(a)).join(' '));
                    },
                    error: (...args) => {
                        logs.push('[ERROR] ' + args.map(a => JSON.stringify(a)).join(' '));
                    },
                    warn: (...args) => {
                        logs.push('[WARN] ' + args.map(a => JSON.stringify(a)).join(' '));
                    },
                },
                ...context,
            },
            eval: false,
            wasm: false,
            fixAsync: true,
        });
        const script = new vm2_1.VMScript(code);
        try {
            const result = vm.run(script);
            return {
                success: true,
                result,
                logs,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                logs,
            };
        }
    }
    async executeFunction(fn, args = [], context = {}, options = {}) {
        const fnCode = fn.toString();
        const wrappedCode = `
      (${fnCode})(...args)
    `;
        return this.execute(wrappedCode, { args, ...context }, options);
    }
};
exports.SandboxService = SandboxService;
exports.SandboxService = SandboxService = SandboxService_1 = __decorate([
    (0, common_1.Injectable)()
], SandboxService);
//# sourceMappingURL=sandbox.service.js.map