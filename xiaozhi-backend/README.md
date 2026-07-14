# 小智 XiaoZhi - 后端

插件化 AI 助手平台后端服务

## 技术栈

- **框架**: NestJS + TypeScript
- **数据库**: PostgreSQL + pgvector
- **缓存**: Redis
- **认证**: JWT + Passport

## 快速开始

### 1. 启动基础设施

```bash
docker-compose up -d
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置

编辑 `config.yaml` 修改数据库连接等配置。

### 4. 启动开发服务器

```bash
pnpm start:dev
```

### 5. 访问 API 文档

http://localhost:3000/api/docs

## 目录结构

```
src/
├── main.ts                 # 入口
├── app.module.ts           # 根模块
├── config/                 # 配置
├── entities/               # TypeORM 实体
├── modules/
│   ├── agents/            # 智能体模块
│   ├── sessions/          # 会话模块
│   ├── chat/              # 对话模块
│   ├── workspaces/        # 工作区模块
│   ├── plugins/           # 插件模块
│   ├── knowledge/         # 知识库模块
│   └── memory/            # 记忆模块
└── utils/                  # 工具函数
```

## API 概览

| 模块 | 路径 | 说明 |
|------|------|------|
| 智能体 | `/api/v1/agents` | CRUD、绑定插件 |
| 会话 | `/api/v1/sessions` | 会话管理 |
| 对话 | `/api/v1/chat` | SSE 流式对话 |
| 工作区 | `/api/v1/workspaces` | 文件索引 |
| 知识库 | `/api/v1/knowledge-bases` | 文档 RAG |
| 插件 | `/api/v1/plugins` | MCP/A2A 插件 |
| 记忆 | `/api/v1/memory` | 短时/长时记忆 |

## 待完成

- [ ] 完善所有模块 CRUD
- [ ] 接入 MCP SDK
- [ ] 实现 SSE 流式对话
- [ ] vm2 沙箱 POC
- [ ] 认证模块 JWT
- [ ] 操作审计
