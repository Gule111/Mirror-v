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
from utils.logger import logger


def extract_frames(video_path: str, output_folder: str, interval: int = 1) -> list[dict]:
    """
    从视频文件中按固定时间间隔抽取帧并保存为 JPEG。

    Args:
        video_path:     视频文件的绝对路径（支持 mp4/avi/mov 等 OpenCV 可解码格式）
        output_folder:  帧图片的输出目录，不存在时自动创建
        interval:       抽帧间隔（单位：秒），默认每 1 秒取一帧

    Returns:
        list[dict]: 每个元素包含:
            - "file_path":  保存的帧图片绝对路径
            - "timestamp":  该帧在视频中的时间戳（秒，float）

    Raises:
        FileNotFoundError:  视频文件不存在
        ValueError:         视频文件无法打开或 FPS 无效
    """
    # ── 0. 参数校验 ──────────────────────────────────────────
    video_path = os.path.normpath(video_path)
    output_folder = os.path.normpath(output_folder)

    if not os.path.isfile(video_path):
        raise FileNotFoundError(f"视频文件不存在: {video_path}")

    os.makedirs(output_folder, exist_ok=True)
    logger.info("[VideoProcessor] 输出目录已就绪: %s", output_folder)

    # ── 1. 打开视频 ─────────────────────────────────────────
    cap = cv2.VideoCapture(video_path)
    try:
        if not cap.isOpened():
            raise ValueError(f"无法打开视频文件: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        if fps <= 0:
            raise ValueError(f"视频 FPS 无效 ({fps})，文件可能已损坏: {video_path}")

        duration = total_frames / fps
        step = int(fps * interval)  # 每隔 step 帧取一帧

        logger.info(
            "[VideoProcessor] 视频信息 — FPS: %.2f | 总帧数: %d | 时长: %.2fs | 采样步长: %d 帧",
            fps, total_frames, duration, step,
        )

        # ── 2. 逐帧采样 ────────────────────────────────────
        extracted: list[dict] = []
        frame_index = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break  # 视频读取结束

            if frame_index % step == 0:
                timestamp = round(frame_index / fps, 3)
                filename = f"frame_{timestamp:.3f}.jpg"
                save_path = os.path.join(output_folder, filename)

                cv2.imwrite(save_path, frame)
                extracted.append({
                    "file_path": save_path,
                    "timestamp": timestamp,
                })

            frame_index += 1

        logger.info(
            "[VideoProcessor] 抽帧完成 — 共提取 %d 帧，保存至 %s",
            len(extracted), output_folder,
        )
        return extracted

    except Exception:
        logger.exception("[VideoProcessor] 抽帧过程中发生异常")
        raise
    finally:
        # ── 3. 无论成功或失败，必须释放视频句柄 ──────────────
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
