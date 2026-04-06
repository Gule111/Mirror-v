import json
import urllib.request
import urllib.error
from config import DIFY_API_KEY, DIFY_API_BASE_URL
from utils.logger import logger

DIFY_API_URL = DIFY_API_BASE_URL

def _parse_json_res(res_json: dict) -> str:
    """内部工具：从 Dify 复杂的响应中提取并清洗最终的分析报告 JSON。"""
    try:
        # 优先提取 result 字段（我们在 Dify 代码输出节点里定义的）
        outputs = res_json.get("data", {}).get("outputs", {})
        final_str = outputs.get("result", "")
        
        if not final_str and isinstance(outputs, str):
            final_str = outputs
            
        return str(final_str)
    except Exception:
        return json.dumps(res_json, ensure_ascii=False)

def analyze_video_content(content: str, duration: float, frame_urls: list[str] = None) -> str | None:
    """
    调用 Dify 工作流进行深度视频分析。
    
    Args:
        content:     ASR 转录文本
        duration:    视频时长
        frame_urls:  由七牛云返回的 6 张关键帧 URL 列表
        
    Returns:
        str: 包含“超级分析报告”的嵌套 JSON 字符串
    """
    if not DIFY_API_KEY:
        logger.error("[Dify] DIFY_API_KEY 未配置，无法调用大模型工作流！")
        return None

    headers = {
        "Authorization": f"Bearer {DIFY_API_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    # 构造核心负载
    data = {
        "inputs": {
            "content": content,
            "duration": duration,
            "video_category": "短视频爆款（通用）",
            "video_frames": "" # 占位符，用于绕过 Dify Start 节点的必填校验
        },
        "response_mode": "blocking",
        "user": "mirror-v-worker",
        "files": []
    }
    
    # 注入多模态视觉文件 (Remote URL 方式)
    if frame_urls:
        for url in frame_urls:
            data["files"].append({
                "type": "image",
                "transfer_method": "remote_url",
                "url": url
            })
    
    req_body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(DIFY_API_URL, data=req_body, headers=headers, method="POST")
    
    try:
        logger.info("[Dify] 发起多模态分析请求 (图片数: %d, 内容长度: %d)", len(data["files"]), len(content))
        with urllib.request.urlopen(req, timeout=180) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            
            # 解析并提取报告
            analysis_report = _parse_json_res(res_json)
            logger.info("[Dify] 分析报告已回传完毕")
            return analysis_report
                
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        logger.error("[Dify] 接口返回异常: %s - %s", e.code, err_msg)
        return None
    except Exception as e:
        logger.exception("[Dify] 通信链路故障: %s", e)
        return None
