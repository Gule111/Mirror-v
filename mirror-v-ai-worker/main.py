"""
main.py — Mirror-V AI Worker 指挥中心

职责：
    1. 使用 Redis blpop 阻塞式监听 mirror_v_task_queue 队列
    2. 获取 task_id 后编排全链路处理流程（抽帧 → 入库）
    3. 维护任务状态机（PENDING → PROCESSING → SUCCESS / FAILED）

依赖：redis, psycopg2-binary, opencv-python
"""

import os
import sys
import signal
import time
import redis

from config import REDIS_URL
from utils.logger import logger
from db.models import (
    update_task_status,
    get_video_path,
    save_video_assets,
    save_video_transcript,
    close_pool,
)
from core.video_processor import extract_frames
from core.audio_processor import transcribe_video

# ═══════════════════════════════════════════════════════════════
# 常量
# ═══════════════════════════════════════════════════════════════
TASK_QUEUE_KEY = "mirror_v_task_queue"

# 帧输出根目录（规范：使用 ../storage/ 作为相对路径根目录）
STORAGE_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "storage")
)

# ═══════════════════════════════════════════════════════════════
# 优雅停机
# ═══════════════════════════════════════════════════════════════
_shutdown_flag = False


def _signal_handler(signum, frame):
    """接收到中断信号时，设置停机标志。"""
    global _shutdown_flag
    sig_name = signal.Signals(signum).name
    logger.info("[Main] 收到信号 %s，准备优雅停机...", sig_name)
    _shutdown_flag = True


# 注册信号处理（Ctrl+C / kill）
signal.signal(signal.SIGINT, _signal_handler)
signal.signal(signal.SIGTERM, _signal_handler)


# ═══════════════════════════════════════════════════════════════
# 单任务处理流程
# ═══════════════════════════════════════════════════════════════
def process_task(task_id: str):
    """
    处理单个任务的完整链路：
        1. 标记 PROCESSING
        2. 查询视频路径
        3. 语音转文字 (ASR) -> 入库
        4. 抽帧 -> 保存帧文件
        5. 帧记录入库
        6. 标记 SUCCESS
    """
    logger.info("[TaskID: %s] ========== 开始处理任务 ==========", task_id)
    start_time = time.time()

    try:
        # ── Step 1: 更新状态为 PROCESSING ─────────────────
        step_start = time.time()
        update_task_status(task_id, "PROCESSING")
        logger.info(
            "[TaskID: %s] Step 1/5 — 状态更新为 PROCESSING (%.2fs)",
            task_id, time.time() - step_start,
        )

        # ── Step 2: 获取视频路径 ──────────────────────────
        step_start = time.time()
        video_url = get_video_path(task_id)
        if not video_url:
            raise ValueError(f"任务 {task_id} 的视频路径为空或任务不存在")
        logger.info(
            "[TaskID: %s] Step 2/5 — 获取视频路径: %s (%.2fs)",
            task_id, video_url, time.time() - step_start,
        )

        # ── Step 3: ASR 语音转文字 ────────────────────────
        step_start = time.time()
        temp_audio_dir = os.path.join(STORAGE_DIR, "temp_audio")
        asr_result = transcribe_video(video_url, temp_audio_dir)
        
        # 将台词保存到数据库
        save_video_transcript(task_id, asr_result["text"], asr_result["duration"])
        
        logger.info(
            "[TaskID: %s] Step 3/5 — ASR 完成，台词长度 %d (%.2fs)",
            task_id, len(asr_result["text"]), time.time() - step_start,
        )

        # ── Step 4: OpenCV 抽帧 ──────────────────────────
        step_start = time.time()
        output_folder = os.path.join(STORAGE_DIR, "frames", task_id)
        frames = extract_frames(video_url, output_folder, interval=1)
        logger.info(
            "[TaskID: %s] Step 4/5 — 抽帧完成，共 %d 帧 (%.2fs)",
            task_id, len(frames), time.time() - step_start,
        )

        # ── Step 4: 帧记录写入数据库 ─────────────────────
        step_start = time.time()
        inserted = save_video_assets(task_id, frames)
        logger.info(
            "[TaskID: %s] Step 5/5 — 帧记录入库，共插入 %d 条 (%.2fs)",
            task_id, inserted, time.time() - step_start,
        )

        # ── 完成：标记 SUCCESS ────────────────────────────
        update_task_status(task_id, "SUCCESS")
        total_time = time.time() - start_time
        logger.info(
            "[TaskID: %s] ✅ 任务处理成功 — 总耗时: %.2fs",
            task_id, total_time,
        )

    except Exception as e:
        # ── 异常：标记 FAILED ─────────────────────────────
        total_time = time.time() - start_time
        logger.exception(
            "[TaskID: %s] ❌ 任务处理失败 — 耗时: %.2fs, 错误: %s",
            task_id, total_time, e,
        )
        try:
            update_task_status(task_id, "FAILED")
        except Exception:
            logger.exception("[TaskID: %s] 更新 FAILED 状态时也出错了", task_id)


# ═══════════════════════════════════════════════════════════════
# 主入口
# ═══════════════════════════════════════════════════════════════
def main():
    logger.info("=" * 60)
    logger.info("  Mirror-V AI Worker 正在启动...")
    logger.info("  Redis:    %s", REDIS_URL)
    logger.info("  Queue:    %s", TASK_QUEUE_KEY)
    logger.info("  Storage:  %s", STORAGE_DIR)
    logger.info("=" * 60)

    # ── 1. 连接 Redis ─────────────────────────────────────
    try:
        r = redis.from_url(REDIS_URL, decode_responses=True)
        r.ping()
        logger.info("[Main] Redis 连接成功")
    except redis.ConnectionError as e:
        logger.error("[Main] Redis 连接失败: %s", e)
        sys.exit(1)

    # ── 2. 死循环监听队列 ─────────────────────────────────
    logger.info("[Main] 开始监听队列 [%s]，等待任务...", TASK_QUEUE_KEY)

    try:
        while not _shutdown_flag:
            # blpop 带超时，便于周期性检查停机标志
            result = r.blpop(TASK_QUEUE_KEY, timeout=5)

            if result is None:
                # 超时，无任务，继续循环（检查停机标志）
                continue

            # result = (queue_name, task_id)
            _, task_id = result
            task_id = task_id.strip()

            if not task_id:
                logger.warning("[Main] 收到空 task_id，跳过")
                continue

            logger.info("[Main] 收到任务: %s", task_id)
            process_task(task_id)

    except KeyboardInterrupt:
        logger.info("[Main] 收到 KeyboardInterrupt，退出监听循环")

    finally:
        # ── 3. 优雅停机：清理资源 ─────────────────────────
        logger.info("[Main] 正在清理资源...")
        try:
            close_pool()
        except Exception:
            logger.exception("[Main] 关闭数据库连接池时出错")

        logger.info("[Main] Mirror-V AI Worker 已停止。再见 👋")


if __name__ == "__main__":
    main()
