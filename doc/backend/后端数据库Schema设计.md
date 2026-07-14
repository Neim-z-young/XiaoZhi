# 小智 XiaoZhi - 数据库 Schema 设计

## 一、数据库选型

| 数据库 | 用途 |
|--------|------|
| PostgreSQL | 主数据库，存储结构化数据 |
| pgvector | PostgreSQL 扩展，向量存储检索 |
| Redis | 会话缓存、短时记忆 |

---

## 二、ER 图概要

```
User ─────< Agent ─────< AgentPlugin >─────> Plugin
  │                                        │
  │                                        │
  └────< Session >────< Message >          │
             │                              │
             └────< Workspace >────< WorkspaceFile
                                                    │
                                              KnowledgeBase ─────< Document
```

---

## 三、表结构设计

### 3.1 用户表 (users)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  role VARCHAR(20) DEFAULT 'user',  -- 'user' | 'admin'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### 3.2 智能体表 (agents)
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  avatar VARCHAR(500),
  model_id VARCHAR(100) NOT NULL,
  prompt TEXT,
  settings JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_model_id ON agents(model_id);
```

### 3.3 插件表 (plugins)
```sql
CREATE TABLE plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL,  -- 'mcp' | 'a2a' | 'builtin'
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_plugins_type ON plugins(type);
CREATE INDEX idx_plugins_enabled ON plugins(enabled);
```

### 3.4 智能体-插件关联表 (agent_plugins)
```sql
CREATE TABLE agent_plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  plugin_id UUID REFERENCES plugins(id) ON DELETE CASCADE,
  config JSONB DEFAULT '{}',  -- 插件在此智能体中的配置
  position INT DEFAULT 0,  -- 调用顺序
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_id, plugin_id)
);
CREATE INDEX idx_agent_plugins_agent_id ON agent_plugins(agent_id);
CREATE INDEX idx_agent_plugins_plugin_id ON agent_plugins(plugin_id);
```

### 3.5 会话表 (sessions)
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  workspace_id UUID,  -- 关联工作区
  title VARCHAR(255),
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_agent_id ON sessions(agent_id);
CREATE INDEX idx_sessions_workspace_id ON sessions(workspace_id);
CREATE INDEX idx_sessions_last_message ON sessions(last_message_at DESC);
```

### 3.6 消息表 (messages)
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,  -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  meta JSONB DEFAULT '{}',  -- 扩展信息：模型、token用量等
  feedback VARCHAR(20),  -- 'like' | 'dislike'
  feedback_comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

### 3.7 工作区表 (workspaces)
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  root_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);
```

### 3.8 文件索引表 (workspace_files)
```sql
CREATE TABLE workspace_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  path VARCHAR(1000) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,  -- 'file' | 'directory'
  size BIGINT,
  content_hash VARCHAR(64),
  vector_id UUID,  -- 向量化后的向量ID
  metadata JSONB DEFAULT '{}',
  indexed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, path)
);
CREATE INDEX idx_workspace_files_workspace_id ON workspace_files(workspace_id);
CREATE INDEX idx_workspace_files_path ON workspace_files(workspace_id, path);
CREATE INDEX idx_workspace_files_vector_id ON workspace_files(vector_id);
```

### 3.9 知识库表 (knowledge_bases)
```sql
CREATE TABLE knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX idx_knowledge_bases_user_id ON knowledge_bases(user_id);
```

### 3.10 文档表 (documents)
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id UUID REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  file_path VARCHAR(500),
  file_size BIGINT,
  mime_type VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending' | 'processing' | 'ready' | 'failed'
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  chunk_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_documents_knowledge_base_id ON documents(knowledge_base_id);
CREATE INDEX idx_documents_status ON documents(status);
```

### 3.11 文档块表 (document_chunks)
```sql
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INT NOT NULL,
  vector_id UUID,  -- pgvector 向量ID
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_vector_id ON document_chunks(vector_id);
```

### 3.12 操作审计表 (operation_logs)
```sql
CREATE TABLE operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_id UUID,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB DEFAULT '{}',
  risk_level VARCHAR(10),  -- 'low' | 'medium' | 'high' | 'critical'
  approved BOOLEAN,
  approved_by UUID,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX idx_operation_logs_risk_level ON operation_logs(risk_level);
CREATE INDEX idx_operation_logs_created_at ON operation_logs(created_at);
```

---

## 四、向量存储设计 (pgvector)

### 4.1 向量维度配置
```sql
-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 向量维度根据 embedding 模型选择
-- OpenAI text-embedding-3-small: 1536 维
-- text-embedding-3-large: 3072 维
-- 建议统一使用 1536 维（性价比最高）
```

### 4.2 长时记忆向量表
```sql
CREATE TABLE long_term_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_long_term_memory_embedding ON long_term_memory USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_long_term_memory_agent_id ON long_term_memory(agent_id);
```

### 4.3 文档向量表
```sql
-- 使用 document_chunks 表的 vector_id 关联
-- 向量实际存储在单独的向量表中，便于分区管理
CREATE TABLE document_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id UUID REFERENCES document_chunks(id) ON DELETE CASCADE,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_document_vectors_embedding ON document_vectors USING ivfflat (embedding vector_cosine_ops);
```

### 4.4 向量相似度检索示例
```sql
-- 检索最相关的记忆
SELECT id, content, 1 - (embedding <=> $1) as similarity
FROM long_term_memory
WHERE agent_id = $2
ORDER BY embedding <=> $1
LIMIT 5;

-- 检索相关文档块
SELECT dc.id, dc.content, 1 - (dv.embedding <=> $1) as similarity
FROM document_vectors dv
JOIN document_chunks dc ON dc.id = dv.chunk_id
JOIN documents d ON d.id = dc.document_id
WHERE d.knowledge_base_id = $2
ORDER BY dv.embedding <=> $1
LIMIT 5;
```

---

## 五、Redis 数据结构

### 5.1 短时记忆（会话级）
```
Key: session:{sessionId}:short_memory
Type: List
TTL: 7 days
Value: JSON string of message { role, content, timestamp }
```

### 5.2 会话上下文缓存
```
Key: session:{sessionId}:context
Type: Hash
TTL: 1 hour
Fields:
  - last_message_id: string
  - message_count: number
  - token_count: number
```

### 5.3 用户在线状态
```
Key: user:{userId}:online
Type: String
TTL: 5 minutes (心跳续期)
Value: timestamp
```

### 5.4 插件调用锁
```
Key: plugin:{pluginId}:lock
Type: String
TTL: 30 seconds
Value: sessionId
```

---

## 六、索引优化策略

### 6.1 主数据库索引
| 表 | 索引 | 类型 | 用途 |
|----|------|------|------|
| sessions | last_message_at | B-tree DESC | 最近会话优先 |
| messages | session_id + created_at | 复合索引 | 历史消息分页 |
| operation_logs | created_at + risk_level | 复合索引 | 审计查询 |

### 6.2 向量索引
| 表 | 索引类型 | 距离度量 | 适用场景 |
|----|----------|----------|----------|
| long_term_memory | IVFFlat | Cosine | 记忆检索 |
| document_vectors | IVFFlat | Cosine | 文档检索 |

### 6.3 分区策略
```sql
-- 消息表按月分区（可选，根据数据量决定）
CREATE TABLE messages (
  LIKE messages_base INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- 创建月度分区
CREATE TABLE messages_2025_01 PARTITION OF messages
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

---

## 七、迁移脚本规范

```sql
-- 版本化迁移脚本命名
-- V{version}__{description}.sql
-- 示例: V001__initial_schema.sql

-- 迁移记录表
CREATE TABLE schema_migrations (
  version VARCHAR(50) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
