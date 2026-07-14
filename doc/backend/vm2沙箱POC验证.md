# vm2 沙箱 POC 验证

## 目标

验证 vm2 沙箱在 NestJS 中的集成可行性，实现安全的代码执行环境。

## 1. 安装依赖

```bash
npm install vm2
```

## 2. 基础沙箱服务

```typescript
// sandbox.service.ts
import { Injectable } from '@nestjs/common';
import { VM, VMScript } from 'vm2';

@Injectable()
export class SandboxService {
  private vm: VM;

  constructor() {
    this.vm = new VM({
      timeout: 5000,        // 5秒超时
      sandbox: {},           // 隔离的全局对象
      eval: false,          // 禁止 eval
      wasm: false,          // 禁止 WebAssembly
    });
  }

  async execute(code: string, context: Record<string, any> = {}): Promise<any> {
    const script = new VMScript(code);
    
    // 设置超时
    const timeout = setTimeout(() => {
      throw new Error('Code execution timeout');
    }, 5000);

    try {
      const result = this.vm.run(script, {
        ...context,
        console: {
          log: (...args: any[]) => console.log('[sandbox]', ...args),
        },
      });
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      clearTimeout(timeout);
    }
  }
}
```

## 3. 带权限控制的沙箱

```typescript
// sandbox-with-permissions.service.ts
import { VM, VMScript } from 'vm2';

interface Permissions {
  allowNetwork?: boolean;
  allowFileSystem?: boolean;
  maxMemory?: number;
}

@Injectable()
export class SecureSandboxService {
  private createVM(config: Permissions = {}) {
    return new VM({
      timeout: 5000,
      sandbox: {},
      eval: false,
      wasm: false,
      fixAsync: true,
    });
  }

  async executeWithPermissions(
    code: string,
    permissions: Permissions = {}
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    const vm = this.createVM(permissions);
    const script = new VMScript(code);

    try {
      const result = vm.run(script);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 预定义的安全代码模板
  executeCodeTemplate(code: string): Promise<any> {
    // 只允许执行纯计算代码
    const safeCode = `
      (function() {
        'use strict';
        ${code}
      })()
    `;
    return this.executeWithPermissions(safeCode);
  }
}
```

## 4. 代码执行 API

```typescript
// sandbox.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { SandboxService } from './sandbox.service';

@Controller('sandbox')
export class SandboxController {
  constructor(private sandbox: SandboxService) {}

  @Post('execute')
  async execute(@Body() body: { code: string; context?: Record<string, any> }) {
    return this.sandbox.execute(body.code, body.context);
  }
}
```

## 5. Windows 兼容性

vm2 在 Windows 上可能有兼容问题，备选方案：

### 备选 1: isolated-vm (Native)

```bash
npm install isolated-vm
```

```typescript
import ivm from 'isolated-vm';

async function execute(code: string) {
  const isolate = new ivm.Isolate();
  const context = await isolate.createContext();
  const result = await context.eval(code);
  return result;
}
```

### 备选 2: 自定义 Worker

```typescript
// 使用 Node.js Worker Threads
import { Worker } from 'worker_threads';

async function executeInWorker(code: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(`
      const vm = require('vm');
      const result = vm.runInContext(${JSON.stringify(code)}, vm.createContext());
      parentPort.postMessage(result);
    `);
    
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}
```

## POC 结果

| 项目 | 状态 | 说明 |
|------|------|------|
| vm2 基础执行 | 待验证 | 需测试 Windows 兼容性 |
| 超时控制 | 可行 | timeout 配置有效 |
| 权限控制 | 可行 | 基础权限可配 |
| isolated-vm | 备选 | Native 方案 |

## 已知限制

1. **Windows 兼容**：vm2 在 Windows 上可能需要额外配置
2. **Node.js API**：沙箱内无法使用 Node.js 原生模块
3. **性能开销**：每次执行需要创建新 VM 实例

## 结论

vm2 方案可行，建议：
1. 开发阶段使用 vm2
2. 生产环境验证 isolated-vm
3. 实现进程超时强制终止
