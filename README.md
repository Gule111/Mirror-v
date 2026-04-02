🛸 Mirror-V: AI-Powered Video Analytics Pipeline
Mirror-V 是一款工业级的视频内容解析系统。它采用“双引擎”架构：由 Spring Boot 负责业务编排与任务调度，由 Python + OpenCV + Whisper 负责高性能的视频抽帧与语音转录。

🏗️ 系统架构 (Architecture)
本系统由四个核心容器组成，通过 Docker 实现环境隔离：

Mirror-V Server (Java): 基于 Spring Boot 3.x，提供 RESTful API，负责任务持久化与分发。

Mirror-V Worker (Python): 核心 AI 引擎，负责视频抽帧 (OpenCV) 与语音识别 (Whisper)。

Redis: 作为消息中间件，通过 BLPOP 实现任务的异步长轮询。

PostgreSQL: 统一的状态存储中心，记录任务全生命周期。

🚀 核心特性 (Features)
异步解耦: 采用生产者-消费者模型，Java 端接单后立即返回，由 Python 端在后台静默处理。

状态机追踪: 任务经历 PENDING -> PROCESSING -> SUCCESS/FAILED 完整闭环。

多模态解析:

视觉: 基于 OpenCV 的智能等间隔抽帧。

听觉: 基于 OpenAI Whisper 的本地化 ASR（语音转文字）处理。

高可用设计: Python 端具备 Signal Handler 优雅停机机制，确保在容器重启时不丢失任务进度。

🛠️ 技术栈 (Tech Stack)
Backend (Java)
Framework: Spring Boot, Spring Data JPA

Database: PostgreSQL

Messaging: Redis (Lettuce)

AI Worker (Python)
Vision: OpenCV (cv2)

Audio/ASR: OpenAI Whisper, FFmpeg

Database Engine: Psycopg2 (Connection Pooling)

📂 项目结构 (Structure)
Plaintext

mirror-v/
├── mirror-v-server/          # Java 后端 (API 接口 & 业务逻辑)
│   ├── src/
│   └── Dockerfile
├── mirror-v-ai-worker/       # Python AI 引擎 (抽帧 & 语音识别)
│   ├── core/                 # 核心处理器 (OpenCV, Whisper)
│   ├── models.py             # 数据库访问层 (CRUD)
│   ├── main.py               # 任务监听入口 (Redis Consumer)
│   └── Dockerfile
└── docker-compose.yml        # 一键编排脚本
⚡ 快速启动 (Quick Start)
1. 环境准备
确保你的环境中已安装 Docker 和 Docker Compose。

2. 启动基础服务
Bash

docker-compose up -d mirror_v_db mirror_v_redis
3. 运行项目
分别启动 Java 服务端与 Python Worker：

Bash

# 在 Java 目录
mvn spring-boot:run

# 在 Python 目录
python main.py
🛡️ Harness & Monitoring (监控与质量)
作为 Harness Engineer，本项目集成了以下监控维度：

性能埋点: 记录 Step 1-4 每一阶段的执行耗时，便于定位 OpenCV 或模型推理瓶颈。

连接池管理: Python 端通过 SimpleConnectionPool 实现线程安全的数据库访问。

单元测试: 提供 models.py 的独立 Mock 测试模块，确保持久层稳固。
