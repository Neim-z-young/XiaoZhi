import { Injectable, Logger } from '@nestjs/common';
import { VM, VMScript } from 'vm2';

export interface SandboxOptions {
  timeout?: number;
  maxMemory?: number;
  allowNetwork?: boolean;
  allowFileSystem?: boolean;
}

export interface ExecuteResult {
  success: boolean;
  result?: any;
  error?: string;
  logs?: string[];
}

@Injectable()
export class SandboxService {
  private readonly logger = new Logger(SandboxService.name);

  async execute(
    code: string,
    context: Record<string, any> = {},
    options: SandboxOptions = {},
  ): Promise<ExecuteResult> {
    const timeout = options.timeout || 5000;
    const logs: string[] = [];

    const vm = new VM({
      timeout,
      sandbox: {
        console: {
          log: (...args: any[]) => {
            logs.push(args.map(a => JSON.stringify(a)).join(' '));
          },
          error: (...args: any[]) => {
            logs.push('[ERROR] ' + args.map(a => JSON.stringify(a)).join(' '));
          },
          warn: (...args: any[]) => {
            logs.push('[WARN] ' + args.map(a => JSON.stringify(a)).join(' '));
          },
        },
        ...context,
      },
      eval: false,
      wasm: false,
      fixAsync: true,
    });

    const script = new VMScript(code);

    try {
      const result = vm.run(script);
      return {
        success: true,
        result,
        logs,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        logs,
      };
    }
  }

  async executeFunction(
    fn: Function,
    args: any[] = [],
    context: Record<string, any> = {},
    options: SandboxOptions = {},
  ): Promise<ExecuteResult> {
    const fnCode = fn.toString();
    const wrappedCode = `
      (${fnCode})(...args)
    `;

    return this.execute(wrappedCode, { args, ...context }, options);
  }
}
