import sys
import os
import time

# 将项目根目录加入路径，防止 import 报错
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.audio_processor import transcribe_video
from utils.logger import logger

def run_test():
    # 修正路径：
    # __file__ 是 scripts/test_asr.py
    # 往上一层是 scripts/
    # 往上两层是 mirror-v-ai-worker/
    # 往上三层才是项目的根目录 Mirror-v0.1.0/
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    test_video = os.path.join(base_dir, "storage", "test_video.mp4")
    temp_dir = os.path.join(base_dir, "storage", "temp_audio")
    
    print("=" * 60)
    print("  Mirror-V ASR (Whisper + FFmpeg) 环境验证测试")
    print("=" * 60)
    print(f"检测视频文件: {test_video}")

    if not os.path.exists(test_video):
        print(f"\n❌ 错误：找不到测试视频文件！")
        print(f"请确保该路径存在一个视频文件: {test_video}")
        return

    print("\n🚀 正在加载 Whisper 模型并识别（初次运行可能较慢）...")
    start_time = time.time()
    
    try:
        # 调用核心 ASR 函数
        result = transcribe_video(test_video, temp_dir)
        
        duration = time.time() - start_time
        print(f"\n✅ ASR 测试成功！耗时: {duration:.2f}s")
        print("-" * 30)
        print(f"识别到的文本内容：\n\n{result['text']}")
        print("-" * 30)
        print(f"视频总时长预估：{result['duration']:.2f} 秒")
        
    except Exception as e:
        print(f"\n❌ ASR 测试发生异常：")
        print(f"错误类型: {type(e).__name__}")
        print(f"错误详情: {e}")
        print("\n💡 提示：请检查 FFmpeg 是否在环境变量中，以及 Whisper 模型是否下载完整。")

if __name__ == "__main__":
    run_test()
