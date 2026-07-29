import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { ToolRegistry, ToolLevel, ToolDefinition } from './tool-registry.service';

const execAsync = promisify(exec);

// 检测文件编码
async function detectAndReadFile(filePath: string): Promise<{ content: string; encoding: string }> {
  // 先尝试用 UTF-8 读取
  try {
    const content = await fsPromises.readFile(filePath, 'utf-8');
    // 检查是否有乱码特征（替换字符）
    const hasReplacements = content.includes('\ufffd');
    if (!hasReplacements) {
      return { content, encoding: 'utf-8' };
    }
  } catch {
    // 继续尝试其他编码
  }

  // 尝试 GBK（Windows 中文环境常用）
  try {
    const buffer = await fsPromises.readFile(filePath);
    // 使用 PowerShell 转换为 UTF-8
    const { stdout } = await execAsync(
      `powershell -Command "[System.IO.File]::ReadAllText('${filePath.replace(/\\/g, '\\\\')}', [System.Text.Encoding]::Default)"`,
      { encoding: 'utf-8' }
    );
    if (stdout) {
      return { content: stdout, encoding: 'gbk' };
    }
  } catch {
    // 继续
  }

  // 最后尝试 binary 并尝试解码
  try {
    const buffer = await fsPromises.readFile(filePath);
    // 尝试 UTF-8 解码
    const content = buffer.toString('utf-8');
    return { content, encoding: 'utf-8 (binary)' };
  } catch {
    return { content: '[无法读取文件内容]', encoding: 'unknown' };
  }
}

// 目录类型枚举
export enum DirectoryType {
  SANDBOX = 'sandbox',       // 沙箱目录 ~/.xiaozhi/sandbox
  WORKSPACE = 'workspace',    // 用户工作区
  MCP = 'mcp',              // MCP 服务器配置的目录
  DENIED = 'denied',         // 拒绝访问
}

// 目录根配置
interface DirectoryRoot {
  path: string;
  type: DirectoryType;
  label: string;
}

@Injectable()
export class ToolService {
  private readonly logger = new Logger(ToolService.name);

  // 动态工作区目录
  private workspaceRoots: DirectoryRoot[] = [];

  // MCP 服务器配置的目录
  private mcpDirectories: DirectoryRoot[] = [];

  // 静态目录根配置
  private readonly staticDirectories: DirectoryRoot[] = [
    { path: path.join(os.homedir(), '.xiaozhi', 'sandbox'), type: DirectoryType.SANDBOX, label: '沙箱目录' },
  ];

  constructor(private readonly toolRegistry: ToolRegistry) {
    this.registerBuiltInTools();
  }

  // 更新允许的工作区目录
  updateWorkspaceRoots(workspaces: Array<{ id?: string; name?: string; path: string; enabled: boolean }>): void {
    this.workspaceRoots = workspaces
      .filter(w => w.enabled)
      .map(w => ({
        path: path.normalize(w.path),
        type: DirectoryType.WORKSPACE,
        label: w.name || '工作区',
      }));
    this.logger.log(`Workspace roots updated: ${this.workspaceRoots.map(r => `${r.label}(${r.path})`).join(', ') || 'none'}`);
  }

  // 获取所有目录根
  getAllDirectories(): DirectoryRoot[] {
    return [...this.staticDirectories, ...this.workspaceRoots, ...this.mcpDirectories];
  }

  // 递归搜索文件
  private async searchFiles(dirPath: string, pattern: string): Promise<string> {
    const results: string[] = [];

    async function search(currentPath: string) {
      try {
        const entries = await fsPromises.readdir(currentPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          if (entry.name.includes(pattern)) {
            const mode = entry.isDirectory() ? 'd-----' : '-a----';
            results.push(`${fullPath}\t${mode}`);
          }
          if (entry.isDirectory()) {
            await search(fullPath);
          }
        }
      } catch {
        // 忽略无法访问的目录
      }
    }

    await search(dirPath);
    if (results.length === 0) {
      return `No files matching "${pattern}" found in ${dirPath}`;
    }
    return `FullName\tMode\n${results.join('\n')}`;
  }

  // 更新 MCP 服务器配置的目录
  updateMcpDirectories(directories: Array<{ path: string; serverName?: string }>): void {
    this.mcpDirectories = directories.map(d => ({
      path: path.normalize(d.path),
      type: DirectoryType.MCP,
      label: d.serverName || 'MCP 目录',
    }));
    this.logger.log(`MCP directories updated: ${this.mcpDirectories.map(r => `${r.label}(${r.path})`).join(', ') || 'none'}`);
  }

  // 验证路径是否在允许范围内，返回目录类型
  validatePath(targetPath: string): { valid: boolean; type: DirectoryType; error?: string } {
    const normalizedPath = path.normalize(targetPath);

    // 获取所有允许的目录
    const allDirectories = this.getAllDirectories();

    // 检查是否在允许的目录下
    for (const dir of allDirectories) {
      const normalizedRoot = path.normalize(dir.path);
      if (normalizedPath.startsWith(normalizedRoot) ||
          normalizedPath.replace(/\\/g, '/').startsWith(normalizedRoot.replace(/\\/g, '/'))) {
        return { valid: true, type: dir.type };
      }
    }

    return {
      valid: false,
      type: DirectoryType.DENIED,
      error: `路径不在允许范围内: ${targetPath}`,
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
        const validation = this.validatePath(filePath);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        // 优先使用沙箱命令执行（PowerShell 的 Get-Content 自动处理编码）
        const isWindows = process.platform === 'win32';
        const readCmd = isWindows
          ? `powershell -Command "Get-Content -Path '${filePath}' -Raw -Encoding UTF8"`
          : `cat "${filePath}"`;

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
          // 命令失败或输出为空，尝试使用编码检测读取
          const { content } = await detectAndReadFile(filePath);
          return {
            success: true,
            content,
            executionDetails: {
              terminal: 'Node.js fs (auto-detect)',
              command: `fs.readFile("${filePath}")`,
              cwd: path.dirname(filePath),
            },
          };
        } catch {
          // 命令执行出错，使用编码检测读取
          try {
            const { content } = await detectAndReadFile(filePath);
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
        const validation = this.validatePath(dirPath);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        // 使用 PowerShell 列出目录（自动处理编码）
        const isWindows = process.platform === 'win32';
        const listCmd = isWindows
          ? `powershell -Command "Get-ChildItem -Path '${dirPath}' | Format-Table Name, Mode -AutoSize"`
          : `ls -la "${dirPath}"`;

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
          const lines = entries.map(e => {
            const type = e.isDirectory() ? 'd-----' : '-a----';
            const name = e.name;
            return `${type}\t${name}`;
          });
          return {
            success: true,
            content: `[${dirPath}]\nName\tMode\n----\t----\n${lines.join('\n')}`,
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
            const lines = entries.map(e => {
              const type = e.isDirectory() ? 'd-----' : '-a----';
              const name = e.name;
              return `${type}\t${name}`;
            });
            return {
              success: true,
              content: `[${dirPath}]\nName\tMode\n----\t----\n${lines.join('\n')}`,
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
        const validation = this.validatePath(searchPath);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        // 使用 PowerShell 搜索文件
        const isWindows = process.platform === 'win32';
        const searchCmd = isWindows
          ? `powershell -Command "Get-ChildItem -Path '${searchPath}' -Recurse -Filter '*${pattern}*' | Select-Object FullName, Mode | Format-Table -AutoSize"`
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
          const matches = await this.searchFiles(searchPath, pattern);
          return {
            success: true,
            content: matches,
            executionDetails: {
              terminal: 'Node.js fs',
              command: `fs.search("${searchPath}", "${pattern}")`,
              cwd: searchPath,
            },
          };
        } catch {
          // 命令执行出错，尝试原生 fs
          try {
            const matches = await this.searchFiles(searchPath, pattern);
            return { success: true, content: matches };
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
        const validation = this.validatePath(filePath);
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

      // 确保工作目录存在
      if (!fs.existsSync(workDir)) {
        fs.mkdirSync(workDir, { recursive: true });
      }

      let stdout = '';
      let stderr = '';

      if (isWindows) {
        // Windows: 强制使用 UTF-8 编码
        const child = spawn('powershell.exe', ['-NoProfile', '-Command', `
          [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
          $OutputEncoding = [System.Text.Encoding]::UTF8
          chcp 65001 > $null
          ${command}
        `], {
          cwd: workDir,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env, NODE_OPTIONS: '' },
        });

        child.stdout?.on('data', (data) => {
          stdout += data.toString('utf-8');
        });

        child.stderr?.on('data', (data) => {
          stderr += data.toString('utf-8');
        });

        // 超时控制：10秒
        const timeout = setTimeout(() => {
          try {
            spawn('taskkill', ['/pid', child.pid!.toString(), '/f', '/t']);
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
      } else {
        // Linux/Mac
        const child = spawn('/bin/bash', ['-c', command], {
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
            process.kill(-child.pid!, 'SIGKILL');
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
      }
    });
  }
}
