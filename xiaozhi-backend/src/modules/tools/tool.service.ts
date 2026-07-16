import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { ToolRegistry, ToolLevel, ToolDefinition } from './tool-registry.service';

const execAsync = promisify(exec);

@Injectable()
export class ToolService {
  private readonly logger = new Logger(ToolService.name);

  constructor(private readonly toolRegistry: ToolRegistry) {
    this.registerBuiltInTools();
  }

  private registerBuiltInTools(): void {
    // L1: 读取文件
    this.toolRegistry.register({
      name: 'file_read',
      description: '读取文件内容',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' },
        },
        required: ['path'],
      },
      level: ToolLevel.L1_SAFE,
      handler: async ({ path: filePath }: { path: string }) => {
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
      },
    });

    // L1: 列出目录
    this.toolRegistry.register({
      name: 'directory_list',
      description: '列出目录内容',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '目录路径' },
        },
        required: ['path'],
      },
      level: ToolLevel.L1_SAFE,
      handler: async ({ path: dirPath }: { path: string }) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        return JSON.stringify(
          entries.map(e => ({
            name: e.name,
            type: e.isDirectory() ? 'directory' : 'file',
          })),
        );
      },
    });

    // L1: 搜索文件
    this.toolRegistry.register({
      name: 'file_search',
      description: '搜索文件',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '搜索目录' },
          pattern: { type: 'string', description: '搜索模式' },
        },
        required: ['path', 'pattern'],
      },
      level: ToolLevel.L1_SAFE,
      handler: async ({ path: searchPath, pattern }: { path: string; pattern: string }) => {
        // 简化实现，实际应使用 glob
        const entries = await fs.readdir(searchPath, { withFileTypes: true });
        const matches = entries
          .filter(e => e.name.includes(pattern))
          .map(e => ({ name: e.name, type: e.isDirectory() ? 'directory' : 'file' }));
        return JSON.stringify(matches);
      },
    });

    // L3: 写入文件（需要确认）
    this.toolRegistry.register({
      name: 'file_write',
      description: '写入文件内容',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' },
          content: { type: 'string', description: '文件内容' },
        },
        required: ['path', 'content'],
      },
      level: ToolLevel.L3_MEDIUM_RISK,
      requiresConfirm: true,
      handler: async ({ path: filePath, content }: { path: string; content: string }) => {
        await fs.writeFile(filePath, content, 'utf-8');
        return `File written: ${filePath}`;
      },
    });

    // L3: 执行命令（需要确认）
    this.toolRegistry.register({
      name: 'command_execute',
      description: '执行Shell命令',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: '要执行的命令' },
          cwd: { type: 'string', description: '工作目录' },
        },
        required: ['command'],
      },
      level: ToolLevel.L4_HIGH_RISK,
      requiresConfirm: true,
      handler: ({ command, cwd }: { command: string; cwd?: string }) => {
        return new Promise((resolve) => {
          const isWindows = process.platform === 'win32';
          const shell = isWindows ? 'powershell.exe' : '/bin/bash';
          const shellArgs = isWindows ? ['-Command', command] : ['-c', command];

          const child = spawn(shell, shellArgs, {
            cwd: cwd || process.cwd(),
            detached: true,
            stdio: 'ignore'
          });

          child.unref();

          // 立即返回，不等待进程结束
          resolve(`进程已启动，PID: ${child.pid}`);
        });
      },
    });

    this.logger.log('Built-in tools registered');
  }
}
