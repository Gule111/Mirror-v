"""
audio_processor.py — 语音识别 ASR 模块

职责：
    1. 调用 FFmpeg 从视频中提取音频 (MP3 格式)
    2. 使用 OpenAI Whisper 模型进行语音转文字
    3. 返回识别到的全量文本内容及预估时长

依赖：ffmpeg (系统级安装), openai-whisper
"""

import os
import subprocess
import whisper
from utils.logger import logger
from config import WHISPER_MODEL, WHISPER_MODEL_PATH

# 预加载模型（建议用 base 或 small，性能与效果的平衡点）
# 首次运行会自动从网络下载，约 150MB~500MB
_model_cache = None

def _get_model():
    global _model_cache
    if _model_cache is None:
        if WHISPER_MODEL_PATH and os.path.exists(WHISPER_MODEL_PATH):
            logger.info("[AudioProcessor] 正在从本地路径加载 Whisper 模型: %s", WHISPER_MODEL_PATH)
            _model_cache = whisper.load_model(WHISPER_MODEL_PATH)
        else:
            logger.info("[AudioProcessor] 正在加载 Whisper 模型 (%s)...", WHISPER_MODEL)
            _model_cache = whisper.load_model(WHISPER_MODEL)
        logger.info("[AudioProcessor] 模型加载完毕")
    return _model_cache

def extract_audio(video_path: str, output_audio_path: str) -> bool:
    """
    使用 FFmpeg 提取音频。
    """
    cmd = [
        "ffmpeg", "-y",             # 覆盖输出文件
        "-i", video_path,           # 输入视频
        "-vn",                      # 禁用视频
        "-ar", "16000",             # 采样率 (Whisper 推荐 16k)
        "-ac", "1",                  # 单声道
        "-ab", "128k",              # 比特率
        "-f", "mp3",                # 输出格式
        output_audio_path
    ]
    
    try:
        logger.info("[AudioProcessor] 正在提取音频: %s", video_path)
        # 执行命令，捕获输出便于调试
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return True
    except subprocess.CalledProcessError as e:
        logger.error("[AudioProcessor] FFmpeg 提取音频失败: %s", e.stderr)
        return False
    except Exception as e:
        logger.exception("[AudioProcessor] 提取音频时发生未知错误: %s", e)
        return False

def transcribe_video(video_path: str, temp_dir: str) -> dict:
    """
    核心流程：视频 -> 音频 -> 识别 -> 文本
    """
    is_network_url = video_path.startswith("http://") or video_path.startswith("https://")
    if not is_network_url:
        video_path = os.path.normpath(video_path)
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"找不到视频文件: {video_path}")

    os.makedirs(temp_dir, exist_ok=True)
    base_name = os.path.basename(video_path).split('.')[0]
    audio_path = os.path.join(temp_dir, f"{base_name}_temp.mp3")

    try:
        # 1. 提取音频
        if not extract_audio(video_path, audio_path):
            raise RuntimeError("音频提取失败，无法进行 ASR")

        # 2. 语音转文字
        model = _get_model()
        logger.info("[AudioProcessor] 正在进行语音转文字识别...")
        
        # initial_prompt 可以帮助模型更好地理解专业用语或特定语言，这里用简体中文句式强制约束模型输出简体
        result = model.transcribe(audio_path, language='zh', initial_prompt='你好，以下是一段普通话。')  
        
        return {
            "text": result.get("text", "").strip(),
            "duration": result.get("segments")[-1]["end"] if result.get("segments") else 0,
        }

    finally:
        # 3. 清理临时产物
        if os.path.exists(audio_path):
            try:
                os.remove(audio_path)
                logger.info("[AudioProcessor] 临时音频已清理: %s", audio_path)
            except Exception as e:
                logger.warning("[AudioProcessor] 清理临时音频失败: %s", e)

if __name__ == "__main__":
    # Mock 测试代码
    # 注意：运行前请确保本地有对应的测试视频
    TEST_VIDEO = "D:/workspace/Mirror-v/Mirror-v0.1.0/storage/test_video.mp4"
    TEMP_DIR = "D:/workspace/Mirror-v/Mirror-v0.1.0/storage/temp_audio"
    
    print("-" * 60)
    print("  Mirror-V AudioProcessor (Whisper) 单体测试")
    print("-" * 60)
    
    try:
        res = transcribe_video(TEST_VIDEO, TEMP_DIR)
        print("\n✅ 识别成功！")
        print(f"  时长预估: {res['duration']:.2f} 秒")
        print(f"  识别台词: \n\n{res['text']}\n")
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
