# Global configuration
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/mirror_v")
DIFY_API_KEY = os.getenv("DIFY_API_KEY", "")
