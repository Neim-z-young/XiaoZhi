# 小智 XiaoZhi - DevOps 技术评估文档

## 一、技术选型

| 组件 | 选择 | 理由 |
|------|------|------|
| 容器化 | Docker | 标准化的应用打包与交付 |
| 编排 | Kubernetes (K3s轻量) | 可扩展、高可用 |
| CI/CD | Jenkins / GitLab CI | 灵活扩展、插件丰富 |
| 代码仓库 | Git | 版本控制 |
| 配置管理 | Ansible | 幂等性好、语法简洁 |
| 监控 | Prometheus + Grafana | 云原生、易集成 |
| 日志 | ELK (Elasticsearch + Logstash + Kibana) | 集中日志管理 |
| 镜像仓库 | Harbor | 企业级安全 |
| 服务网格 | 可选 | 后期微服务扩展 |

---

## 二、CI/CD 流水线设计

### 2.1 流水线阶段

```
┌─────────────────────────────────────────────────────────────┐
│                        CI/CD Pipeline                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [代码提交] → [代码扫描] → [单元测试] → [构建镜像] → [集成测试] │
│                                                              │
│       ↓                                                      │
│                                                              │
│  [安全扫描] → [镜像推送] → [部署预发] → [自动验收] → [部署生产] │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 质量门禁

| 阶段 | 检查项 | 阈值 |
|------|--------|------|
| 代码扫描 | SonarQube | 阻断 B/C 级漏洞 |
| 单元测试 | Jest / Mocha | 覆盖率 > 70% |
| 安全扫描 | Trivy / Clair | 无高危漏洞 |
| 集成测试 | Pytest / Supertest | 全部通过 |
| 性能测试 | k6 / JMeter | P99 < 500ms |

### 2.3 部署策略

| 环境 | 策略 | 说明 |
|------|------|------|
| 开发环境 | 直接部署 | 快速迭代 |
| 测试环境 | 蓝绿部署 | 零 downtime |
| 预发环境 | 金丝雀发布 | 灰度验证 |
| 生产环境 | 金丝雀 → 全量 | 可回滚 |

---

## 三、容器化架构设计

### 3.1 服务组件

| 服务 | 镜像 | 副本 | 说明 |
|------|------|------|------|
| xiaozhi-frontend | nginx:alpine | 2-10 | 前端应用 |
| xiaozhi-backend | node:18-alpine | 2-10 | 后端API |
| xiaozhi-worker | node:18-alpine | 1-5 | 异步任务处理 |
| xiaozhi-mcp | node:18-alpine | 1-3 | MCP协议服务 |
| postgres | postgres:15 | 主从 | 主数据库 |
| redis | redis:7-alpine | 主从 | 缓存 + 会话 |
| vector-store | pgvector/pgvector | 1 | 向量存储 |

### 3.2 Docker Compose 本地开发

```yaml
# docker-compose.yml
services:
  frontend:
    build: ./frontend
    ports: ["3000:80]
    depends_on: [backend]
    
  backend:
    build: ./backend
    ports: ["8080:8080]
    environment:
      - DATABASE_URL=postgres://xiaozhi:xxx@postgres:5432/xiaozhi
      - REDIS_URL=redis://redis:6379
    depends_on: [postgres, redis]
    
  postgres:
    image: pgvector/pgvector:pg15
    volumes: [postgres_data:/var/lib/postgresql/data]
    
  redis:
    image: redis:7-alpine
    volumes: [redis_data:/data]
    
  mcp-server:
    build: ./mcp-server
    ports: ["8081:8081]
    
volumes:
  postgres_data
  redis_data
```

---

## 四、Kubernetes 部署架构

### 4.1 命名空间

```yaml
# 命名空间隔离
namespaces:
  - xiaozhi-dev      # 开发环境
  - xiaozhi-test     # 测试环境
  - xiaozhi-staging  # 预发环境
  - xiaozhi-prod     # 生产环境
```

### 4.2 资源配置建议

| 组件 | CPU请求 | CPU限制 | 内存请求 | 内存限制 |
|------|---------|---------|----------|----------|
| frontend | 100m | 500m | 128Mi | 512Mi |
| backend | 200m | 1000m | 256Mi | 1Gi |
| worker | 200m | 1000m | 256Mi | 1Gi |
| mcp | 100m | 500m | 128Mi | 512Mi |

### 4.3 HPA 自动扩缩容

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: xiaozhi-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: xiaozhi-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

## 五、监控与可观测性

### 5.1 监控指标

| 类别 | 指标 | 工具 |
|------|------|------|
| **基础设施** | CPU/内存/磁盘/网络 | node_exporter |
| **应用** | QPS/延迟/错误率 | prometheus client |
| **业务** | 对话量/插件调用/Token消耗 | 自定义指标 |
| **数据库** | 连接数/查询延迟/慢查询 | postgres_exporter |
| **缓存** | 命中率/内存使用 | redis_exporter |

### 5.2 日志收集

```
[容器日志] → [Fluentd/Promtail] → [Loki/Elasticsearch] → [Grafana/Kibana]
```

### 5.3 告警规则

| 级别 | 场景 | 通知方式 |
|------|------|----------|
| P1 紧急 | 服务不可用 | 电话 + 短信 |
| P2 严重 | 错误率 > 5% | 短信 + 钉钉 |
| P3 警告 | 延迟 > 1s | 邮件 + 钉钉 |
| P4 提示 | 磁盘 > 70% | 邮件 |

---

## 六、安全设计

### 6.1 安全措施

| 层级 | 措施 |
|------|------|
| 网络 | VPC隔离、Security Group、Network Policy |
| 认证 | JWT、OAuth2、MFA |
| 授权 | RBAC、ABAC |
| 密钥 | Vault / Kubernetes Secrets |
| 传输 | TLS 1.3 |
| 镜像 | 扫描签名、私库拉取 |

### 6.2 插件沙箱安全

| 控制项 | 实现 |
|--------|------|
| 资源限制 | Docker/Kubernetes 资源Quota |
| 网络隔离 | NetworkPolicy 禁止插件访问外网 |
| 文件系统 | 只读根目录、写权限限定 |
| Syscall过滤 | Seccomp、白名单机制 |
| 进程限制 | 禁止 fork/cgroups |

---

## 七、分阶段实施计划

### 第一阶段：基础架构（1-2周）

| 任务 | 说明 |
|------|------|
| 代码仓库搭建 | GitLab + 分支策略 |
| Docker化 | 应用容器化 |
| CI流水线 | 基础构建 + 测试 + 部署 |
| 日志系统 | ELK 部署 |

### 第二阶段：自动化部署（2-3周）

| 任务 | 说明 |
|------|------|
| K8s集群 | 开发/测试环境 |
| 镜像仓库 | Harbor |
| CI/CD完善 | 安全扫描 + 自动部署 |
| 监控基础 | Prometheus + Grafana |

### 第三阶段：生产级能力（2-3周）

| 任务 | 说明 |
|------|------|
| 高可用架构 | 多副本 + 负载均衡 |
| 自动扩缩容 | HPA 配置 |
| 灾备方案 | 数据备份 + 恢复演练 |
| 安全加固 | 密钥管理 + 渗透测试 |

---

## 八、关键风险点

| 风险 | 影响 | 建议 |
|------|------|------|
| K8s学习成本 | 团队上手慢 | 前期用 docker-compose 过渡 |
| 多环境一致性 | 配置漂移 | GitOps 管理基础设施 |
| 插件沙箱安全 | 潜在逃逸风险 | 严格网络策略 + 定期审计 |
| 向量库性能 | 大规模检索慢 | 后期引入专用向量引擎 |

---

## 九、结论

| 评估项 | 结论 |
|--------|------|
| **总体可行性** | 很高 |
| **技术风险** | 低，方案成熟 |
| **第一阶段周期** | 1-2周完成基础CI/CD |
| **主要挑战** | K8s集群管理、插件沙箱安全 |

---

## 十、下一步行动

- [ ] 制定 Git 分支策略与 Commit 规范
- [ ] 输出 Dockerfile 与 docker-compose 开发环境
- [ ] 设计 Kubernetes 部署清单
- [ ] 制定监控指标与告警规则
- [ ] 制定备份与灾备方案
