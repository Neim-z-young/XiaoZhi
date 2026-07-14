# 小智 XiaoZhi - 前端

插件化 AI 助手平台前端

## 技术栈

| 组件 | 选择 |
|------|------|
| 框架 | React 18 + TypeScript |
| 构建工具 | Vite |
| 状态管理 | Zustand |
| UI 框架 | TailwindCSS + Radix UI |
| 路由 | React Router v6 |
| HTTP | Axios |
| 表单验证 | React Hook Form + Zod |
| 国际化 | i18next |
| 图标 | Lucide React |
| Markdown | react-markdown |
| 动画 | Framer Motion |

## 快速开始

### 1. 安装依赖

```bash
cd xiaozhi-frontend
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3001

### 3. 构建生产版本

```bash
npm run build
npm run preview
```

## 项目结构

```
src/
├── main.tsx                 # 入口
├── App.tsx                 # 根组件
├── components/              # 组件
│   ├── ui/                # 基础 UI 组件
│   ├── layout/           # 布局组件
│   └── common/           # 通用组件
├── pages/                  # 页面
│   ├── Chat/             # 对话
│   ├── Agents/           # 智能体管理
│   ├── Plugins/           # 插件市场
│   ├── Knowledge/         # 知识库
│   └── Settings/          # 设置
├── stores/                # Zustand 状态
├── services/              # API 服务
├── hooks/                 # 自定义 Hooks
├── types/                 # TypeScript 类型
├── i18n/                  # 国际化
└── styles/                # 全局样式
```

## 页面说明

| 页面 | 路由 | 说明 |
|------|------|------|
| 对话 | `/chat` | 核心对话界面 |
| 智能体 | `/agents` | 智能体 CRUD |
| 插件 | `/plugins` | 插件市场 |
| 设置 | `/settings` | 主题、语言等配置 |

## 状态管理 (Zustand)

| Store | 用途 |
|-------|------|
| `authStore` | 用户认证状态 |
| `chatStore` | 对话、会话状态 |
| `agentStore` | 智能体状态 |
| `settingsStore` | 应用设置 |

## API 服务

API 请求通过 `/api` 代理到后端服务器（默认 http://localhost:3000）。

```typescript
import { agentsApi } from '@/services/agents';

// 获取智能体列表
const { data } = await agentsApi.list();
```

## 开发指南

### 添加新页面

1. 在 `src/pages/` 创建页面组件
2. 在 `App.tsx` 添加路由

```tsx
<Route path="/new-page" element={<NewPage />} />
```

### 添加状态

```typescript
// src/stores/newStore.ts
import { create } from 'zustand';

interface NewStore {
  count: number;
  increment: () => void;
}

export const useNewStore = create<NewStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

### 添加 API

```typescript
// src/services/newApi.ts
import api from './api';

export const newApi = {
  list: () => api.get('/new-resource'),
};
```

## 待完成

- [ ] 完善对话页面 SSE 流式接收
- [ ] 智能体管理页面
- [ ] 插件市场页面
- [ ] 知识库页面上传组件
- [ ] 设置页面主题切换
- [ ] i18n 国际化
- [ ] 单元测试
