# Global configuration — 从 .env 文件加载敏感信息
import os
from dotenv import load_dotenv

# 加载 .env 环境变量
load_dotenv()

# ── Redis 配置 ───────────────────────────────────────────────
REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")
REDIS_DB = os.getenv("REDIS_DB", "0")

# 构建 Redis 连接 URL
if REDIS_PASSWORD:
    REDIS_URL = f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"
else:
    REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

# 新增：队列长轮询超时时间
QUEUE_POLL_TIMEOUT = int(os.getenv("QUEUE_POLL_TIMEOUT", "5"))

# ── Postgres 数据库配置 ────────────────────────────────────────
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "mirror_v")

# ── AI 工作节点配置 ──────────────────────────────────────────
# Dify，支持私有化部署网关
DIFY_API_BASE_URL = os.getenv("DIFY_API_BASE_URL", "https://api.dify.ai/v1/workflows/run")
DIFY_API_KEY = os.getenv("DIFY_API_KEY", "")

# ── Qiniu OSS ────────────────────────────────────────────────
QINIU_AK = os.getenv("QINIU_AK", "")
QINIU_SK = os.getenv("QINIU_SK", "")
QINIU_BUCKET = os.getenv("QINIU_BUCKET", "")
QINIU_DOMAIN = os.getenv("QINIU_DOMAIN", "")

# ── 文件存储及模型设置 ─────────────────────────────────────────
# 数据存储目录，默认使用当前项目的上级 storage 目录
STORAGE_DIR = os.getenv(
    "STORAGE_DIR",
    os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "storage"))
)

# Whisper 模型设置：可选 tiny, base, small, medium, large
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
# 如果用户使用了外部挂载的模型，可直接指向 .pt 文件
WHISPER_MODEL_PATH = os.getenv("WHISPER_MODEL_PATH", r"D:\workspace\Mirror-v\base\base.pt")
