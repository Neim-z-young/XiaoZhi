# 小智 XiaoZhi - 后端

插件化 AI 助手平台后端服务

## 技术栈

- **框架**: NestJS + TypeScript
- **数据库**: SQLite (开发) / PostgreSQL + pgvector (生产)
- **缓存**: Redis
- **认证**: JWT + Passport

## 快速开始

### 1. 安装依赖

```bash
cd xiaozhi-backend
npm install
```

### 2. 配置数据库

编辑 `config.yaml`：

```yaml
# 开发环境（使用 SQLite，无需安装数据库）
database:
  type: sqlite

# 生产环境（使用 PostgreSQL）
database:
  type: postgres
  host: localhost
  port: 5432
  username: postgres
  password: postgres
  database: xiaozhi
```

### 3. 启动

```bash
npm run start:dev
```

访问 http://localhost:3000/api/docs 查看 API 文档。

## 模块

| 模块 | 路径 | 说明 | 状态 |
|------|------|------|------|
| 认证 | `/auth` | 登录、Token | ✅ 完成 |
| 智能体 | `/agents` | CRUD、绑定插件 | ✅ 完成 |
| 会话 | `/sessions` | 会话管理 | ✅ 完成 |
| 对话 | `/chat` | 消息、SSE 流式 | ✅ 完成 |
| 工作区 | `/workspaces` | 文件索引 | ✅ 完成 |
| 知识库 | `/knowledge-bases` | 文档 RAG | ✅ 完成 |
| 插件 | `/plugins` | MCP/A2A 插件 | ✅ 完成 |
| 记忆 | `/memory` | 短时/长时记忆 | ✅ 完成 |
| 系统 | `/system` | 健康检查、模型列表 | ✅ 完成 |

## 目录结构

```
src/
├── main.ts                    # 入口
├── app.module.ts              # 根模块
├── config/                    # 配置
├── entities/                  # TypeORM 实体
├── modules/
│   ├── auth/                 # 认证
│   ├── agents/              # 智能体
│   ├── sessions/            # 会话
│   ├── chat/                # 对话
│   ├── workspaces/          # 工作区
│   ├── plugins/             # 插件
│   ├── knowledge/           # 知识库
│   ├── memory/              # 记忆
│   └── system/              # 系统
└── utils/                    # 工具函数
```

## POC 验证文档

- [MCP SDK POC 验证](../doc/backend/MCP-SDK-POC验证.md)
- [vm2 沙箱 POC 验证](../doc/backend/vm2沙箱POC验证.md)

## API 示例

### 登录
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### 创建智能体
```bash
curl -X POST http://localhost:3000/agents \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "我的助手", "modelId": "gpt-4o-mini"}'
```

### 发送消息
```bash
curl -X POST http://localhost:3000/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "<session-id>", "message": "你好"}'
```

## 下一步计划

- [ ] 接入真实 AI 模型（OpenAI/Claude）
- [ ] 实现 MCP SDK 集成
- [ ] vm2 沙箱生产验证
- [ ] Redis 缓存集成
- [ ] 向量检索集成 (pgvector)
- [ ] 操作审计
