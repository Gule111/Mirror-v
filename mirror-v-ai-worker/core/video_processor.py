"""
video_processor.py — OpenCV 视频抽帧模块

职责：
    1. 读取视频文件，按固定时间间隔抽取关键帧
    2. 将抽取的帧保存为 JPEG 图片到指定目录
    3. 返回帧文件路径与时间戳的列表，供后续模块消费

依赖：opencv-python (cv2)
"""

import os
import cv2
import uuid
from qiniu import Auth, put_data
from utils.logger import logger
from config import QINIU_AK, QINIU_SK, QINIU_BUCKET, QINIU_DOMAIN

def extract_frames(video_path: str, task_id: str, interval: int = 1) -> list[dict]:
    """
    从视频文件中按固定时间间隔抽取帧并直传至七牛云 OSS。

    Args:
        video_path:     视频文件的绝对路径或网络路径
        task_id:        任务ID，用于构建云端存储前缀路径
        interval:       抽帧间隔，默认1秒

    Returns:
        list[dict]: 包含公网 OSS URL 和时间戳的列表
    """
    # ── 0. 准备七牛云 ──────────────────────────────────────────
    auth = Auth(QINIU_AK, QINIU_SK)
    
    # ── 1. 打开视频 ─────────────────────────────────────────
    is_network_url = video_path.startswith("http://") or video_path.startswith("https://")
    if not is_network_url:
        video_path = os.path.normpath(video_path)
        if not os.path.isfile(video_path):
            raise FileNotFoundError(f"视频文件不存在: {video_path}")

    cap = cv2.VideoCapture(video_path)
    try:
        if not cap.isOpened():
            raise ValueError(f"无法打开视频文件: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if fps <= 0:
            raise ValueError(f"视频 FPS 无效 ({fps})")

        duration = total_frames / fps
        step = int(fps * interval)

        logger.info(
            "[VideoProcessor] 准备抽帧并直传 OSS — FPS: %.2f | 总帧数: %d | 采样步长: %d 帧",
            fps, total_frames, step,
        )

        # ── 2. 逐帧采样并直传 (优化：开头3秒截取6张) ─────────────────────
        extracted: list[dict] = []
        # 计算采样周期：3秒内采6张，即每 0.5 秒采一张
        sample_interval = 0.5
        step = int(fps * sample_interval)
        
        frame_index = 0
        count = 0
        max_frames = 6
        max_time = 3.0

        while count < max_frames:
            # 跳转到对应帧位置，提高效率
            target_frame = count * step
            if target_frame >= total_frames:
                break
                
            cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
            ret, frame = cap.read()
            if not ret:
                break

            timestamp = round(target_frame / fps, 3)
            if timestamp > max_time and count > 0: # 超过3秒且已经有截图则停止
                break

            # 编码帧为 JPEG 内存二进制数据
            success, buffer = cv2.imencode('.jpg', frame)
            if not success:
                logger.warning("[VideoProcessor] 帧编码 JPEG 失败 t=%.2f", timestamp)
                count += 1
                continue
            
            image_bytes = buffer.tobytes()
            # 构造 OSS 对象名：确保在独立任务文件夹下
            filename = f"video/frames/{task_id}/frame_{count}_{timestamp:.3f}.jpg"
            
            # 请求上传 token 并直传二进制流
            token = auth.upload_token(QINIU_BUCKET, filename, 3600)
            ret_info, info = put_data(token, filename, image_bytes)
            
            if info.status_code == 200:
                domain = QINIU_DOMAIN.rstrip("/")
                url = f"{domain}/{filename}"
                if not url.startswith("http"):
                    url = "http://" + url
                extracted.append({
                    "file_path": url,
                    "timestamp": timestamp,
                })
            else:
                logger.error("[VideoProcessor] 上传失败: %s", info.error)

            count += 1

        logger.info("[VideoProcessor] 抽帧直传 OSS 完成 — 共提取 %d 帧 (限于开头3秒)", len(extracted))
        return extracted

    except Exception:
        logger.exception("[VideoProcessor] 抽帧直传过程中发生异常")
        raise
    finally:
        cap.release()
        logger.info("[VideoProcessor] 视频句柄已释放: %s", video_path)


# ═══════════════════════════════════════════════════════════════
# 独立运行 Mock 测试
# ═══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    # ⚠️ 请根据实际文件路径修改以下两个变量
    mock_video = "D:/workspace/Mirror-v/storage/test_video.mp4"
    mock_output = "D:/workspace/Mirror-v/storage/frames/test_task_001"

    print("=" * 60)
    print("  Mirror-V VideoProcessor — Mock 抽帧测试")
    print("=" * 60)
    print(f"  视频路径:   {mock_video}")
    print(f"  输出目录:   {mock_output}")
    print(f"  抽帧间隔:   1 秒")
    print("=" * 60)

    try:
        results = extract_frames(mock_video, mock_output, interval=1)
        print(f"\n✅ 抽帧成功！共提取 {len(results)} 帧:\n")
        for i, item in enumerate(results, 1):
            print(f"  [{i:03d}] t={item['timestamp']:.3f}s  →  {item['file_path']}")
    except FileNotFoundError as e:
        print(f"\n❌ 文件未找到: {e}")
        print("   请检查 mock_video 路径是否正确，确保测试视频文件存在。")
    except ValueError as e:
        print(f"\n❌ 视频错误: {e}")
    except Exception as e:
        print(f"\n❌ 未知错误: {e}")
