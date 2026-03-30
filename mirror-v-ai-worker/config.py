# Global configuration — 从 .env 文件加载敏感信息
import os
from dotenv import load_dotenv

# 加载项目根目录下的 .env 文件
load_dotenv()

# ── Redis ────────────────────────────────────────────────────
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# ── PostgreSQL（拆分参数，供 psycopg2 连接池使用）──────────────
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "mirror_v")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

# 保留完整 URL，供其他场景使用
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
)

# ── Dify ─────────────────────────────────────────────────────
DIFY_API_KEY = os.getenv("DIFY_API_KEY", "")
