# 小智 XiaoZhi

插件化 Web AI 助手平台 —— 通过插件自由切换与扩展底层能力,让同一套系统在不同业务领域专注于不同场景。

> 核心能力标准化,插件可插拔;兼容 MCP / A2A 主流协议;内置记忆与知识库,支持 RAG 增强。

---

## 核心特性

- **多模型接入** —— 支持 OpenAI、Anthropic、本地/企业网关等多家模型,可在后台动态配置与切换。
- **插件化架构** —— 基于 MCP、A2A 协议适配外部能力,插件即插即用、启用/禁用灵活。
- **智能体管理** —— 一个界面完成智能体创建,绑定模型、插件、知识库与提示词模板。
- **工作区管理** —— 会话关联工作区,自动索引文件结构,支持文件名与内容的语义搜索。
- **记忆系统** —— 短时(会话上下文)与长时(跨会话偏好)记忆分层管理。
- **知识库 / RAG** —— 支持 PDF、Word、Markdown、TXT 文档上传、切分与混合检索。
- **安全沙箱** —— 敏感操作(命令执行、文件修改、API 调用)可配置审查与沙箱执行。

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 · TypeScript · Vite · Zustand · TailwindCSS · Radix UI · React Router |
| 后端 | NestJS 10 · TypeScript · TypeORM · Passport JWT |
| 数据库 | SQLite(开箱即用)/ PostgreSQL + pgvector(生产) |
| 缓存 | Redis |
| 集成 | @modelcontextprotocol/sdk · vm2 沙箱 |

## 目录结构

```
XiaoZhi/
├── xiaozhi-backend/     # NestJS 后端服务
│   ├── src/
│   │   ├── modules/     # auth / agents / chat / workspace / plugins / memory / knowledge ...
│   │   ├── entities/    # TypeORM 实体
│   │   └── config/      # 配置加载
│   ├── config.yaml      # 后端主配置(数据库、模型、MCP、向量)
│   └── docker-compose.yml  # PostgreSQL(pgvector) + Redis
├── xiaozhi-frontend/    # React 前端应用
│   └── src/
│       ├── pages/       # Chat / Agents / Plugins / Workspaces / Models / McpServers / Tools / Settings
│       ├── stores/      # Zustand 状态
│       └── services/    # API 服务
└── doc/                 # 需求、架构、设计、接口与变更文档
```

## 快速开始

### 前置要求

- Node.js 18+
- 包管理器:npm(或 pnpm)

### 1. 启动后端

```bash
cd xiaozhi-backend
npm install
npm run start:dev
```

- 服务地址:http://localhost:3000
- API 前缀:`/api`,接口文档:http://localhost:3000/api/docs

默认使用 SQLite(数据文件 `./data/xiaozhi.db`),无需额外安装数据库即可运行。

### 2. 启动前端

```bash
cd xiaozhi-frontend
npm install
npm run dev
```

- 访问地址:http://localhost:3001
- 前端通过 Vite 代理将 `/api` 转发到 `http://localhost:3000`

### 3. 登录

默认开发账号:**admin / admin123**

## 配置说明

后端配置位于 [`xiaozhi-backend/config.yaml`](./xiaozhi-backend/config.yaml),主要包含:

- **database** —— `sqlite`(默认)或 `postgres`
- **models** —— 已启用模型列表,支持 `apiKey` 直填或 `apiKeyEnv` 环境变量引用
- **embedding** —— 向量模式:`none` / `api` / `pgvector`
- **mcp** —— 默认 MCP 服务器

使用 PostgreSQL + pgvector 与 Redis 时:

```bash
cd xiaozhi-backend
docker compose up -d
```

## 文档

- [需求及架构文档](./doc/插件式AI助手平台需求及架构文档.md)
- [后端技术评估](./doc/backend/后端技术评估文档.md) · [后端 API 接口设计](./doc/backend/后端API接口设计.md) · [数据库 Schema 设计](./doc/backend/后端数据库Schema设计.md)
- [前端技术评估](./doc/frontend/前端技术评估文档.md)
- [MCP SDK POC 验证](./doc/backend/MCP-SDK-POC验证.md) · [vm2 沙箱 POC 验证](./doc/backend/vm2沙箱POC验证.md)
- 子项目说明:[后端](./xiaozhi-backend/README.md) · [前端](./xiaozhi-frontend/README.md)

## License

[MIT](./LICENSE) © 2026 OYounGY