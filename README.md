Mirror-v: Multi-modal AI Video Analysis & Diagnostic Platform
Mirror-v 是一款基于多智能体（Multi-Agent）架构的视频自动化分析与诊断平台。它不仅仅是一个视频处理工具，而是通过 LangGraph 构建了一个具备自我迭代能力的“AI 诊断室”，能够对视频内容进行多维度的深度理解与逻辑推演。

核心特性 | Key Features
🤖 多智能体协同编排 (Multi-Agent Orchestration): 采用 Planner-Executor-Reviewer 模型。由 Planner 拆解诊断任务，Executor 调用工具执行分析，Reviewer 进行逻辑校验，未通过则自动触发循环迭代。

👁️ 多模态感知流水线 (Multi-modal Pipeline): 融合 OpenCV 帧提取、Whisper 语音转译与 LLM 语义理解，实现音视轨的时间戳对齐（Timestamp Alignment）。

⚡ 高性能后端架构 (High-Performance Backend): 基于 Spring Boot 3 与 FastAPI 的混合架构，利用 Redis Pipeline 与两级缓存支撑高频数据访问。

🛠️ 工业级工程化实践 (Engineering Excellence): 严格遵循 CI/CD 流程，集成自动化测试与 Docker 容器化部署。

系统架构 | Architecture
本项目核心逻辑由 LangGraph 驱动的状态机管理：

State Definition: 维护全局 GraphState，记录视频元数据、提取的特征及诊断进度。

Conditional Routing: 根据 LLM 输出自动判断跳转分支——是继续提取特征，还是直接生成最终报告。

Persistence: 利用 LangGraph Checkpointer 实现长任务的状态持久化。

技术栈 | Tech Stack
Language: Java 21, Python 3.10+

Frameworks: Spring Boot 3, FastAPI, LangGraph, Dify

Infrastructure: Redis Stack, RabbitMQ, PostgreSQL (KingbaseES)

DevOps: Docker, GitHub Actions, Pytest/JUnit5, Nginx

工程化落地 | Engineering Practice
🔄 CI/CD Pipeline
本项目集成 GitHub Actions 自动化流水线，确保每一次 Push 或 PR 都能通过严格的质量检查：

Linting: 自动执行代码风格扫描（Flake8/Checkstyle）。

Automated Testing: 触发 Pytest 与 JUnit 单元测试，重点覆盖 Agent 的状态转移逻辑。

Build & Push: 测试通过后自动构建 Docker 镜像并推送至仓库。

🐳 容器化部署
提供多阶段构建的 Dockerfile，优化镜像体积，支持一键式容器化快速部署。

快速开始 | Quick Start
Bash

# 1. 克隆仓库
git clone https://github.com/Gule111/Mirror-v.git

# 2. 配置环境变量
cp .env.example .env

# 3. 启动服务 (Docker Compose 准备中)
docker-compose up -d
