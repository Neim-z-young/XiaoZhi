import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { ToolRegistry, ToolLevel, ToolDefinition } from './tool-registry.service';

const execAsync = promisify(exec);

@Injectable()
export class ToolService {
  private readonly logger = new Logger(ToolService.name);

  // 沙箱根目录
  private readonly SANDBOX_ROOTS = [
    path.join(os.homedir(), '.xiaozhi', 'sandbox'),
    'D:\\project\\XiaoZhi',
    process.cwd(),
  ];

  constructor(private readonly toolRegistry: ToolRegistry) {
    this.registerBuiltInTools();
  }

  // 验证路径是否在沙箱允许范围内
  private validateSandboxPath(targetPath: string): { valid: boolean; error?: string } {
    const normalizedPath = path.normalize(targetPath);

    // 检查是否在允许的根目录下
    for (const root of this.SANDBOX_ROOTS) {
      const normalizedRoot = path.normalize(root);
      if (normalizedPath.startsWith(normalizedRoot) ||
          normalizedPath.replace(/\\/g, '/').startsWith(normalizedRoot.replace(/\\/g, '/'))) {
        return { valid: true };
      }
    }

    return {
      valid: false,
      error: `路径不在允许范围内: ${targetPath}。请使用 ~/.xiaozhi/sandbox 目录下的文件。`,
    };
  }

  private registerBuiltInTools(): void {
    // L1/L3: 读取文件（优先沙箱命令，失败后用原生 fs）
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
      requiresConfirm: true,
      handler: async ({ path: filePath }: { path: string }) => {
        const validation = this.validateSandboxPath(filePath);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
        
        // 优先使用沙箱命令执行
        const isWindows = process.platform === 'win32';
        const readCmd = isWindows ? `type "${filePath}"` : `cat "${filePath}"`;
        
        try {
          const result = await this.executeSandboxCommand(readCmd, path.dirname(filePath));
          if (result.success && result.stdout.trim()) {
            return {
              success: true,
              content: result.stdout,
              executionDetails: {
                terminal: isWindows ? 'PowerShell' : 'Bash',
                command: readCmd,
                cwd: path.dirname(filePath),
              },
            };
          }
          // 命令失败或输出为空，尝试原生 fs
          const content = await fsPromises.readFile(filePath, 'utf-8');
          return {
            success: true,
            content,
            executionDetails: {
              terminal: 'Node.js fs',
              command: `fs.readFile("${filePath}")`,
              cwd: path.dirname(filePath),
            },
          };
        } catch {
          // 命令执行出错，尝试原生 fs
          try {
            const content = await fsPromises.readFile(filePath, 'utf-8');
            return { success: true, content };
          } catch (fsError: any) {
            return { success: false, error: `读取文件失败: ${fsError.message}` };
          }
        }
      },
    });

    // L1/L3: 列出目录（优先沙箱命令，失败后用原生 fs）
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
      requiresConfirm: true,
      handler: async ({ path: dirPath }: { path: string }) => {
        const validation = this.validateSandboxPath(dirPath);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
        
        // 优先使用沙箱命令执行
        const isWindows = process.platform === 'win32';
        const listCmd = isWindows ? `Get-ChildItem -Path "${dirPath}" | Select-Object Name, Mode` : `ls -la "${dirPath}"`;
        
        try {
          const result = await this.executeSandboxCommand(listCmd, dirPath);
          if (result.success && result.stdout.trim()) {
            return {
              success: true,
              content: `[${dirPath}]\n${result.stdout}`,
              executionDetails: {
                terminal: isWindows ? 'PowerShell' : 'Bash',
                command: listCmd,
                cwd: dirPath,
              },
            };
          }
          // 命令失败或输出为空，尝试原生 fs
          const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });
          const formattedEntries = entries.map(e => ({
            name: e.name,
            type: e.isDirectory() ? 'directory' : 'file',
          }));
          return {
            success: true,
            content: `[${dirPath}]\n${JSON.stringify(formattedEntries, null, 2)}`,
            executionDetails: {
              terminal: 'Node.js fs',
              command: `fs.readdir("${dirPath}")`,
              cwd: dirPath,
            },
          };
        } catch {
          // 命令执行出错，尝试原生 fs
          try {
            const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });
            const formattedEntries = entries.map(e => ({
              name: e.name,
              type: e.isDirectory() ? 'directory' : 'file',
            }));
            return {
              success: true,
              content: `[${dirPath}]\n${JSON.stringify(formattedEntries, null, 2)}`,
            };
          } catch (fsError: any) {
            return { success: false, error: `列出目录失败: ${fsError.message}` };
          }
        }
      },
    });

    // L1/L3: 搜索文件（优先沙箱命令，失败后用原生 fs）
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
      requiresConfirm: true,
      handler: async ({ path: searchPath, pattern }: { path: string; pattern: string }) => {
        const validation = this.validateSandboxPath(searchPath);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
        
        // 优先使用沙箱命令执行
        const isWindows = process.platform === 'win32';
        const searchCmd = isWindows 
          ? `Get-ChildItem -Path "${searchPath}" -Recurse -Filter "*${pattern}*" | Select-Object FullName, Mode`
          : `find "${searchPath}" -name "*${pattern}*"`;
        
        try {
          const result = await this.executeSandboxCommand(searchCmd, searchPath);
          if (result.success && result.stdout.trim()) {
            return {
              success: true,
              content: result.stdout,
              executionDetails: {
                terminal: isWindows ? 'PowerShell' : 'Bash',
                command: searchCmd,
                cwd: searchPath,
              },
            };
          }
          // 命令失败或输出为空，尝试原生 fs
          const entries = await fsPromises.readdir(searchPath, { withFileTypes: true });
          const matches = entries
            .filter(e => e.name.includes(pattern))
            .map(e => ({ name: e.name, type: e.isDirectory() ? 'directory' : 'file' }));
          return {
            success: true,
            content: JSON.stringify(matches),
            executionDetails: {
              terminal: 'Node.js fs',
              command: `fs.readdir("${searchPath}") with filter "${pattern}"`,
              cwd: searchPath,
            },
          };
        } catch {
          // 命令执行出错，尝试原生 fs
          try {
            const entries = await fsPromises.readdir(searchPath, { withFileTypes: true });
            const matches = entries
              .filter(e => e.name.includes(pattern))
              .map(e => ({ name: e.name, type: e.isDirectory() ? 'directory' : 'file' }));
            return {
              success: true,
              content: JSON.stringify(matches),
            };
          } catch (fsError: any) {
            return { success: false, error: `搜索文件失败: ${fsError.message}` };
          }
        }
      },
    });

    // L3/L4: 写入文件（优先沙箱命令，失败后用原生 fs）
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
        const validation = this.validateSandboxPath(filePath);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
        
        // 优先使用沙箱命令执行
        const isWindows = process.platform === 'win32';
        // Windows 使用 Set-Content，Linux 使用 tee/cat
        const writeCmd = isWindows 
          ? `Set-Content -Path "${filePath}" -Value "${content.replace(/"/g, '`"')}"`
          : `echo "${content.replace(/"/g, '\\"')}" > "${filePath}"`;
        
        try {
          const result = await this.executeSandboxCommand(writeCmd, path.dirname(filePath));
          if (result.success) {
            return {
              success: true,
              content: `File written: ${filePath}`,
              executionDetails: {
                terminal: isWindows ? 'PowerShell' : 'Bash',
                command: writeCmd,
                cwd: path.dirname(filePath),
              },
            };
          }
          // 命令失败，尝试原生 fs
          await fsPromises.writeFile(filePath, content, 'utf-8');
          return {
            success: true,
            content: `File written: ${filePath}`,
            executionDetails: {
              terminal: 'Node.js fs',
              command: `fs.writeFile("${filePath}")`,
              cwd: path.dirname(filePath),
            },
          };
        } catch {
          // 命令执行出错，尝试原生 fs
          try {
            await fsPromises.writeFile(filePath, content, 'utf-8');
            return { success: true, content: `File written: ${filePath}` };
          } catch (fsError: any) {
            return { success: false, error: `写入文件失败: ${fsError.message}` };
          }
        }
      },
    });

    // L4: 执行命令（需要确认）- 沙箱安全增强版
    this.toolRegistry.register({
      name: 'command_execute',
      description: '执行Shell命令（沙箱保护）',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: '要执行的命令' },
          cwd: { type: 'string', description: '工作目录（可选）' },
        },
        required: ['command'],
      },
      level: ToolLevel.L4_HIGH_RISK,
      requiresConfirm: true,
      handler: ({ command, cwd }: { command: string; cwd?: string }) => {
        return new Promise((resolve) => {
          // ========== 沙箱安全检查 ==========
          // 1. 禁止的危险命令
          const dangerousPatterns = [
            /rm\s+-rf\s+\//i,           // 删除系统
            /mkfs\./i,                   // 格式化
            /dd\s+if=/i,                 // 直接磁盘写入
            /:(){ :|:& };:/i,           // Fork炸弹
            /\.\.\/.*\.conf/i,          // 路径穿越
          ];
          
          for (const pattern of dangerousPatterns) {
            if (pattern.test(command)) {
              resolve({ success: false, error: '禁止执行危险命令' });
              return;
            }
          }
          
          // 2. 只允许特定命令（白名单）
          const allowedCommands = [
            'dir', 'ls', 'pwd', 'cd', 'echo', 'type', 'cat',
            'find', 'grep', 'head', 'tail', 'wc', 'sort', 'uniq',
            'node', 'npm', 'pnpm', 'git', 'curl', 'ping',
            'tasklist', 'taskkill', 'ps', 'kill', 'netstat',
            'Get-Process', 'Get-ChildItem', 'Select-Object', 'Where-Object',
          ];
          
          // 提取命令名
          const firstWord = command.trim().split(/\s+/)[0].toLowerCase();
          const baseCmd = firstWord.replace(/^.*[\\\/]/, ''); // 去除路径
          
          // 如果包含管道或逻辑运算符，检查所有命令
          const allCommands = command.split(/[|;&]`/).map(c => c.trim().split(/\s+/)[0].toLowerCase());
          const hasDangerous = allCommands.some(cmd => {
            const base = cmd.replace(/^.*[\\\/]/, '');
            return !allowedCommands.includes(base);
          });
          
          if (hasDangerous) {
            resolve({ success: false, error: `命令不在白名单允许范围内: ${baseCmd}` });
            return;
          }
          
          // 3. 工作目录限制
          const allowedRoots = [
            'D:\\project\\XiaoZhi',
            process.cwd(),
          ];
          
          if (cwd) {
            const isAllowed = allowedRoots.some(root => 
              cwd.startsWith(root) || cwd.startsWith(root.replace(/\\/g, '/'))
            );
            if (!isAllowed) {
              resolve({ success: false, error: `工作目录不在允许范围内: ${cwd}` });
              return;
            }
          }

          // ========== 执行命令 ==========
          const isWindows = process.platform === 'win32';
          const shell = isWindows ? 'powershell.exe' : '/bin/bash';
          const shellArgs = isWindows ? ['-Command', command] : ['-c', command];
          
          // 默认工作目录：用户目录下的 .xiaozhi/sandbox 文件夹
          const defaultWorkDir = isWindows
            ? path.join(os.homedir(), '.xiaozhi', 'sandbox')
            : path.join(os.homedir(), '.xiaozhi', 'sandbox');
          
          // 确保工作目录存在
          const workDir = cwd || defaultWorkDir;
          if (!fs.existsSync(workDir)) {
            fs.mkdirSync(workDir, { recursive: true });
          }
          
          let stdout = '';
          let stderr = '';
          
          const child = spawn(shell, shellArgs, {
            cwd: workDir,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env, NODE_OPTIONS: '' },
          });
          
          child.stdout?.on('data', (data) => {
            stdout += data.toString();
          });
          
          child.stderr?.on('data', (data) => {
            stderr += data.toString();
          });
          
          // 超时控制：30秒
          const timeout = setTimeout(() => {
            try {
              if (process.platform === 'win32') {
                spawn('taskkill', ['/pid', child.pid!.toString(), '/f', '/t']);
              } else {
                process.kill(-child.pid!, 'SIGKILL');
              }
            } catch (e) {}
            resolve({ success: false, error: '命令执行超时（30秒）' });
          }, 30000);
          
          child.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0) {
              resolve({
                success: true,
                content: stdout || '命令执行完成（无输出）',
                executionDetails: {
                  terminal: isWindows ? 'PowerShell' : 'Bash',
                  command: command,
                  cwd: workDir,
                },
              });
            } else {
              resolve({
                success: false,
                error: stderr || `命令执行失败，退出码: ${code}`,
                executionDetails: {
                  terminal: isWindows ? 'PowerShell' : 'Bash',
                  command: command,
                  cwd: workDir,
                },
              });
            }
          });
          
          child.on('error', (err) => {
            clearTimeout(timeout);
            resolve({ success: false, error: `命令执行错误: ${err.message}` });
          });
        });
      },
    });

    this.logger.log('Built-in tools registered');
  }

  // 执行沙箱命令的辅助方法
  private executeSandboxCommand(command: string, workDir: string): Promise<{ success: boolean; stdout: string; stderr: string; exitCode: number | null }> {
    return new Promise((resolve) => {
      const isWindows = process.platform === 'win32';
      const shell = isWindows ? 'powershell.exe' : '/bin/bash';
      const shellArgs = isWindows ? ['-Command', command] : ['-c', command];

      // 确保工作目录存在
      if (!fs.existsSync(workDir)) {
        fs.mkdirSync(workDir, { recursive: true });
      }

      let stdout = '';
      let stderr = '';

      const child = spawn(shell, shellArgs, {
        cwd: workDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, NODE_OPTIONS: '' },
      });

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // 超时控制：10秒
      const timeout = setTimeout(() => {
        try {
          if (process.platform === 'win32') {
            spawn('taskkill', ['/pid', child.pid!.toString(), '/f', '/t']);
          } else {
            process.kill(-child.pid!, 'SIGKILL');
          }
        } catch (e) {}
        resolve({ success: false, stdout, stderr, exitCode: null });
      }, 10000);

      child.on('close', (code) => {
        clearTimeout(timeout);
        resolve({
          success: code === 0,
          stdout,
          stderr,
          exitCode: code,
        });
      });

      child.on('error', (err) => {
        clearTimeout(timeout);
        resolve({ success: false, stdout, stderr, exitCode: null });
      });
    });
  }
}
