# 小智 XiaoZhi - 后端 API 接口设计

## 一、API 设计规范

### 基础信息
- **Base URL**: `/api/v1`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **错误码规范**: `{ "code": number, "message": string, "data": any }`

### HTTP 状态码
| 状态码 | 含义 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 二、认证接口

### 2.1 用户登录
```
POST /auth/login
Request:
{
  "username": string,
  "password": string
}
Response:
{
  "code": 200,
  "data": {
    "token": string,
    "refreshToken": string,
    "expiresIn": number
  }
}
```

### 2.2 刷新 Token
```
POST /auth/refresh
Request:
{
  "refreshToken": string
}
```

### 2.3 退出登录
```
POST /auth/logout
Headers: Authorization: Bearer <token>
```

---

## 三、智能体管理接口

### 3.1 创建智能体
```
POST /agents
Headers: Authorization: Bearer <token>
Request:
{
  "name": string,
  "description": string,
  "avatar": string,
  "modelId": string,
  "prompt": string,
  "pluginIds": string[],
  "enabled": boolean
}
Response:
{
  "code": 201,
  "data": { Agent }
}
```

### 3.2 获取智能体列表
```
GET /agents
Headers: Authorization: Bearer <token>
Query:
  - page: number (default: 1)
  - pageSize: number (default: 20)
  - keyword: string (optional)
Response:
{
  "code": 200,
  "data": {
    "list": Agent[],
    "total": number,
    "page": number,
    "pageSize": number
  }
}
```

### 3.3 获取智能体详情
```
GET /agents/:id
Headers: Authorization: Bearer <token>
Response:
{
  "code": 200,
  "data": { Agent }
}
```

### 3.4 更新智能体
```
PUT /agents/:id
Headers: Authorization: Bearer <token>
Request: Partial<Agent>
```

### 3.5 删除智能体
```
DELETE /agents/:id
Headers: Authorization: Bearer <token>
```

### 3.6 绑定/解绑插件
```
POST /agents/:id/plugins
Headers: Authorization: Bearer <token>
Request:
{
  "pluginIds": string[]
}

DELETE /agents/:id/plugins/:pluginId
```

---

## 四、会话管理接口

### 4.1 创建会话
```
POST /sessions
Headers: Authorization: Bearer <token>
Request:
{
  "agentId": string,
  "workspaceId": string (optional),
  "title": string (optional)
}
Response:
{
  "code": 201,
  "data": { Session }
}
```

### 4.2 获取会话列表
```
GET /sessions
Headers: Authorization: Bearer <token>
Query:
  - agentId: string (optional)
  - page: number
  - pageSize: number
```

### 4.3 获取会话详情
```
GET /sessions/:id
```

### 4.4 删除会话
```
DELETE /sessions/:id
```

### 4.5 获取会话消息历史
```
GET /sessions/:id/messages
Query:
  - before: string (messageId, optional, for pagination)
  - limit: number (default: 50)
```

---

## 五、对话接口

### 5.1 发送消息（SSE 流式）
```
POST /chat
Headers: Authorization: Bearer <token>
Request:
{
  "sessionId": string,
  "agentId": string,
  "message": string,
  "stream": boolean (default: true)
}
Response (SSE):
event: message
data: { "content": string, "id": string, "done": boolean }

event: error
data: { "code": number, "message": string }
```

### 5.2 中断生成
```
POST /chat/:sessionId/stop
```

### 5.3 消息反馈
```
POST /messages/:id/feedback
Request:
{
  "rating": "like" | "dislike",
  "comment": string (optional)
}
```

---

## 六、工作区管理接口

### 6.1 创建工作区
```
POST /workspaces
Headers: Authorization: Bearer <token>
Request:
{
  "name": string,
  "description": string,
  "rootPath": string
}
```

### 6.2 获取工作区列表
```
GET /workspaces
```

### 6.3 获取工作区文件树
```
GET /workspaces/:id/files
Query:
  - path: string (optional, default: "/")
Response:
{
  "code": 200,
  "data": {
    "path": string,
    "items": [
      { "name": string, "type": "file" | "directory", "size": number, "modifiedAt": string }
    ]
  }
}
```

### 6.4 搜索文件
```
GET /workspaces/:id/search
Query:
  - q: string (search keyword)
  - type: "all" | "code" | "doc" (optional)
  - limit: number
```

---

## 七、知识库接口

### 7.1 上传文档
```
POST /knowledge-bases/:id/documents
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
Request:
  - file: File
  - metadata: JSON string { "title": string, "tags": string[] }
```

### 7.2 获取文档列表
```
GET /knowledge-bases/:id/documents
Query:
  - page, pageSize
  - status: "pending" | "processing" | "ready" | "failed"
```

### 7.3 删除文档
```
DELETE /knowledge-bases/:id/documents/:docId
```

### 7.4 触发文档向量化
```
POST /knowledge-bases/:id/documents/:docId/vectorize
```

### 7.5 RAG 检索
```
POST /knowledge-bases/:id/search
Request:
{
  "query": string,
  "topK": number (default: 5)
}
Response:
{
  "code": 200,
  "data": {
    "results": [
      { "documentId": string, "content": string, "score": number }
    ]
  }
}
```

---

## 八、插件管理接口

### 8.1 获取插件列表
```
GET /plugins
Query:
  - type: "mcp" | "a2a" | "builtin"
  - enabled: boolean
```

### 8.2 安装插件
```
POST /plugins
Request:
{
  "type": "mcp" | "a2a",
  "config": {
    "name": string,
    "command": string (for MCP),
    "url": string (for A2A),
    "auth": object (optional)
  }
}
```

### 8.3 卸载插件
```
DELETE /plugins/:id
```

### 8.4 启用/禁用插件
```
PATCH /plugins/:id
Request:
{
  "enabled": boolean
}
```

### 8.5 获取插件工具列表
```
GET /plugins/:id/tools
```

### 8.6 测试插件工具
```
POST /plugins/:id/tools/:toolId/test
Request:
{
  "params": object
}
```

---

## 九、记忆系统接口

### 9.1 写入短时记忆
```
POST /memory/short-term
Request:
{
  "sessionId": string,
  "content": string,
  "type": "user" | "assistant" | "system"
}
```

### 9.2 读取短时记忆
```
GET /memory/short-term/:sessionId
```

### 9.3 写入长时记忆
```
POST /memory/long-term
Request:
{
  "agentId": string,
  "content": string,
  "embedding": number[]
}
```

### 9.4 检索长时记忆
```
POST /memory/long-term/search
Request:
{
  "agentId": string,
  "query": string,
  "embedding": number[],
  "topK": number
}
```

### 9.5 总结短时记忆写入长时
```
POST /memory/consolidate
Request:
{
  "sessionId": string,
  "agentId": string
}
```

---

## 十、系统接口

### 10.1 获取模型列表
```
GET /models
```

### 10.2 健康检查
```
GET /health
Response:
{
  "status": "ok",
  "version": string,
  "uptime": number
}
```

### 10.3 获取系统统计
```
GET /stats
```
