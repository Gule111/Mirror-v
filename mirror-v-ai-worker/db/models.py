"""
models.py — PostgreSQL 数据持久层

职责：
    1. 维护一个线程安全的数据库连接池（psycopg2.pool.SimpleConnectionPool）
    2. 提供 update_task_status / save_video_assets 等 CRUD 函数
    3. 所有数据库操作必须经过本模块，禁止在 main.py 中直接写 SQL

依赖：psycopg2-binary
"""

import uuid
import psycopg2
import psycopg2.pool
import psycopg2.extras
from config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
from utils.logger import logger

# ═══════════════════════════════════════════════════════════════
# 连接池（模块级单例）
# ═══════════════════════════════════════════════════════════════
_pool: psycopg2.pool.SimpleConnectionPool | None = None


def _get_pool() -> psycopg2.pool.SimpleConnectionPool:
    """
    获取数据库连接池（懒加载单例）。
    首次调用时创建，后续复用同一个池。
    """
    global _pool
    if _pool is None or _pool.closed:
        logger.info(
            "[DB] 正在创建连接池 → %s@%s:%s/%s",
            DB_USER, DB_HOST, DB_PORT, DB_NAME,
        )
        try:
            _pool = psycopg2.pool.SimpleConnectionPool(
                minconn=1,
                maxconn=5,
                host=DB_HOST,
                port=DB_PORT,
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD,
            )
            logger.info("[DB] 连接池创建成功")
        except psycopg2.Error as e:
            logger.exception("[DB] 连接池创建失败")
            raise ConnectionError(f"无法连接到数据库: {e}") from e
    return _pool


def get_connection():
    """
    从连接池中取出一个连接。
    调用方必须在使用完毕后调用 release_connection() 归还。
    """
    return _get_pool().getconn()


def release_connection(conn):
    """将连接归还给连接池。"""
    pool = _get_pool()
    if conn and not conn.closed:
        pool.putconn(conn)


# ═══════════════════════════════════════════════════════════════
# CRUD 函数
# ═══════════════════════════════════════════════════════════════


def update_task_status(task_id: str, status: str) -> int:
    """
    更新 tasks 表中指定任务的状态。

    Args:
        task_id:  任务 UUID 字符串
        status:   目标状态（PENDING / PROCESSING / SUCCESS / FAILED）

    Returns:
        int: 受影响的行数（0 表示 task_id 不存在）

    Raises:
        psycopg2.Error: 数据库操作失败时向上抛出
    """
    sql = """
        UPDATE tasks
        SET status     = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute(sql, (status, task_id))
            rowcount = cur.rowcount
        conn.commit()
        logger.info(
            "[DB] update_task_status — task_id=%s, status=%s, affected=%d",
            task_id, status, rowcount,
        )
        return rowcount
    except psycopg2.Error:
        if conn:
            conn.rollback()
        logger.exception("[DB] update_task_status 失败 — task_id=%s", task_id)
        raise
    finally:
        if conn:
            release_connection(conn)


def save_video_assets(task_id: str, file_paths: list[dict]) -> int:
    """
    批量将抽帧结果插入 video_assets 表。

    Args:
        task_id:     任务 UUID 字符串
        file_paths:  帧信息列表，每个元素包含:
                     - "file_path":  图片保存路径
                     - "timestamp":  该帧在视频中的时间戳（秒）

    Returns:
        int: 成功插入的行数

    Raises:
        psycopg2.Error: 数据库操作失败时向上抛出
    """
    if not file_paths:
        logger.warning("[DB] save_video_assets — 空列表，跳过插入")
        return 0

    sql = """
        INSERT INTO video_assets (id, task_id, asset_type, file_path, timestamp_in_video)
        VALUES (%s, %s, %s, %s, %s)
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            rows = []
            for item in file_paths:
                rows.append((
                    str(uuid.uuid4()),       # id — 主键 UUID
                    task_id,                 # task_id — 外键
                    "FRAME",                 # asset_type — 固定为 FRAME
                    item["file_path"],       # file_path
                    item.get("timestamp"),   # timestamp_in_video
                ))
            psycopg2.extras.execute_batch(cur, sql, rows)
            inserted = cur.rowcount
        conn.commit()
        logger.info(
            "[DB] save_video_assets — task_id=%s, 插入 %d 条帧记录",
            task_id, inserted,
        )
        return inserted
    except psycopg2.Error:
        if conn:
            conn.rollback()
        logger.exception("[DB] save_video_assets 失败 — task_id=%s", task_id)
        raise
    finally:
        if conn:
            release_connection(conn)


def get_task_by_id(task_id: str) -> dict | None:
    """
    根据 task_id 查询任务详情。

    Args:
        task_id: 任务 UUID 字符串

    Returns:
        dict | None: 任务记录字典，不存在则返回 None
    """
    sql = "SELECT id, video_url, status, created_at, updated_at FROM tasks WHERE id = %s"
    conn = None
    try:
        conn = get_connection()
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, (task_id,))
            row = cur.fetchone()
        if row:
            # 将 UUID 转为字符串，方便 JSON 序列化
            row["id"] = str(row["id"])
            logger.info("[DB] get_task_by_id — 找到任务: %s", task_id)
        else:
            logger.warning("[DB] get_task_by_id — 任务不存在: %s", task_id)
        return dict(row) if row else None
    except psycopg2.Error:
        logger.exception("[DB] get_task_by_id 失败 — task_id=%s", task_id)
        raise
    finally:
        if conn:
            release_connection(conn)


def get_video_path(task_id: str) -> str | None:
    """
    根据 task_id 查询该任务的原始视频路径。

    Args:
        task_id: 任务 UUID 字符串

    Returns:
        str | None: video_url（视频路径），任务不存在则返回 None
    """
    sql = "SELECT video_url FROM tasks WHERE id = %s"
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute(sql, (task_id,))
            row = cur.fetchone()
        if row:
            logger.info("[DB] get_video_path — task_id=%s, video_url=%s", task_id, row[0])
            return row[0]
        else:
            logger.warning("[DB] get_video_path — 任务不存在: %s", task_id)
            return None
    except psycopg2.Error:
        logger.exception("[DB] get_video_path 失败 — task_id=%s", task_id)
        raise
    finally:
        if conn:
            release_connection(conn)


def close_pool():
    """
    关闭数据库连接池（优雅停机时调用）。
    """
    global _pool
    if _pool and not _pool.closed:
        _pool.closeall()
        logger.info("[DB] 数据库连接池已关闭")
        _pool = None


# ═══════════════════════════════════════════════════════════════
# 独立运行 Mock 测试
# ═══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("=" * 60)
    print("  Mirror-V DB Models — 连接 & CRUD 测试")
    print("=" * 60)

    # ── 测试 1: 连接可达性 ─────────────────────────────────
    print("\n[Test 1] 尝试建立数据库连接...")
    try:
        test_conn = get_connection()
        print(f"  ✅ 连接成功 — server: {DB_HOST}:{DB_PORT}/{DB_NAME}")
        release_connection(test_conn)
    except Exception as e:
        print(f"  ❌ 连接失败: {e}")
        exit(1)

    # ── 测试 2: 查询 tasks 表前 5 条记录 ──────────────────
    print("\n[Test 2] 查询 tasks 表前 5 条记录...")
    try:
        conn = get_connection()
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT id, video_url, status, created_at FROM tasks ORDER BY created_at DESC LIMIT 5")
            rows = cur.fetchall()
        release_connection(conn)

        if rows:
            for i, row in enumerate(rows, 1):
                print(f"  [{i}] id={row['id']}  status={row['status']}  url={row['video_url'][:50]}...")
        else:
            print("  ⚠️ tasks 表为空，暂无记录")
    except Exception as e:
        print(f"  ❌ 查询失败: {e}")

    # ── 测试 3: 更新一个不存在的 task ─────────────────────
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    print(f"\n[Test 3] 尝试更新不存在的任务 (id={fake_uuid})...")
    try:
        affected = update_task_status(fake_uuid, "PROCESSING")
        if affected == 0:
            print(f"  ✅ 预期行为：受影响行数 = 0（任务不存在）")
        else:
            print(f"  ⚠️ 意外：受影响行数 = {affected}")
    except Exception as e:
        print(f"  ❌ 更新失败: {e}")

    print("\n" + "=" * 60)
    print("  所有测试完成")
    print("=" * 60)
