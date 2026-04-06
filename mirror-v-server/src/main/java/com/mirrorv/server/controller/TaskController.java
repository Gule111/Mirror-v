package com.mirrorv.server.controller;

import com.mirrorv.server.dto.TaskRequest;
import com.mirrorv.server.entity.TaskEntity;
import com.mirrorv.server.exception.RedisQueueException;
import com.mirrorv.server.service.TaskService;
import com.qiniu.storage.Configuration;
import com.qiniu.storage.Region;
import com.qiniu.storage.UploadManager;
import com.qiniu.util.Auth;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;

/**
 * 任务控制层 — 薄 Controller，仅负责参数校验、异常处理与响应封装
 * 核心业务逻辑已下沉至 {@link TaskService}
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tasks")
@CrossOrigin
public class TaskController {

    private final TaskService taskService;

    @Value("${qiniu.access-key}")
    private String accessKey;

    @Value("${qiniu.secret-key}")
    private String secretKey;

    @Value("${qiniu.bucket}")
    private String bucket;

    @Value("${qiniu.domain}")
    private String domain;

    @Value("${app.storage.dir:./storage}")
    private String storageDir;

    /**
     * 构造函数注入 TaskService
     */
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostConstruct
    public void init() {
        // Ensure storage directory exists
        try {
            Files.createDirectories(Paths.get(storageDir));
        } catch (IOException e) {
            log.error("Failed to create storage directory", e);
        }
    }

    /**
     * 原有 JSON 方式创建新任务
     */
    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody TaskRequest request) {
        return processTaskCreation(request);
    }

    /**
     * 新增：通过上传视频文件创建新任务
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadAndCreateTask(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") String userId) {
        
        log.info("收到视频上传请求: userId={}, fileName={}, size={}", userId, file.getOriginalFilename(), file.getSize());

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(errorResponse("上传的文件不能为空"));
        }

        try {
            // 生成唯一文件名避免冲突
            String originalFileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "video.mp4";
            String extension = "";
            int dotIndex = originalFileName.lastIndexOf('.');
            if (dotIndex > 0) {
                extension = originalFileName.substring(dotIndex);
            }
            String newFileName = "video/" + UUID.randomUUID().toString() + extension;
            
            // 使用七牛云上传
            Configuration cfg = new Configuration(Region.autoRegion());
            UploadManager uploadManager = new UploadManager(cfg);
            Auth auth = Auth.create(accessKey, secretKey);
            String upToken = auth.uploadToken(bucket);
            
            log.info("开始流式上传至七牛云 OSS: {}", newFileName);
            uploadManager.put(file.getInputStream(), newFileName, upToken, null, null);
            
            // 拼接七牛云外网访问地址
            String videoUrl = domain.endsWith("/") ? domain + newFileName : domain + "/" + newFileName;
            // 确保有协议头
            if (!videoUrl.startsWith("http")) {
                videoUrl = "http://" + videoUrl;
            }
            
            log.info("文件已成功直传至七牛云: {}", videoUrl);

            // 构造请求给 Service
            TaskRequest request = new TaskRequest();
            request.setUserId(userId);
            request.setVideoUrl(videoUrl);

            return processTaskCreation(request);

        } catch (Exception e) {
            log.error("上传视频至七牛云失败", e);
            return ResponseEntity.internalServerError().body(errorResponse("上传视频失败: " + e.getMessage()));
        }
    }

    private ResponseEntity<?> processTaskCreation(TaskRequest request) {
        log.info("处理任务创建逻辑: {}", request);

        if (request.getVideoUrl() == null || request.getVideoUrl().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(errorResponse("videoUrl 不能为空"));
        }
        if (request.getUserId() == null || request.getUserId().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(errorResponse("userId 不能为空"));
        }

        try {
            TaskEntity savedTask = taskService.createTask(request);

            Map<String, String> response = new HashMap<>();
            response.put("taskId", savedTask.getId().toString());
            response.put("status", savedTask.getStatus());
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("userId 格式不合法: {}", request.getUserId());
            return ResponseEntity.badRequest().body(errorResponse("userId 格式不正确，应为 UUID 格式"));
        } catch (RedisQueueException e) {
            log.error("Redis 队列推送失败: {}", e.getMessage());
            return ResponseEntity.status(502).body(errorResponse("任务分发失败: " + e.getMessage()));
        } catch (Exception e) {
            log.error("任务创建异常", e);
            return ResponseEntity.internalServerError().body(errorResponse("系统内部错误: " + e.getMessage()));
        }
    }

    /**
     * 根据 ID 查询任务状态及报告
     */
    @GetMapping("/{taskId}")
    public ResponseEntity<?> getTaskStatus(@PathVariable String taskId) {
        log.info("查询任务状态: taskId={}", taskId);

        try {
            UUID uuid = UUID.fromString(taskId);
            Map<String, Object> response = taskService.getTaskDetails(uuid);

            if (response == null) {
                return ResponseEntity.status(404).body(errorResponse("找不到任务 ID: " + taskId));
            }

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("无效的 UUID 格式: {}", taskId);
            return ResponseEntity.badRequest().body(errorResponse("无效的任务 ID 格式"));
        } catch (Exception e) {
            log.error("查询任务状态异常", e);
            return ResponseEntity.internalServerError().body(errorResponse("系统内部错误: " + e.getMessage()));
        }
    }

    /**
     * 根据路径查询静态资源 (例如图片)
     */
    @GetMapping("/assets")
    public ResponseEntity<Resource> getImageAsset(@RequestParam("path") String path) {
        log.info("请求图片资源: path={}", path);
        try {
            Path reqFile = Paths.get(path).normalize().toAbsolutePath();
            Path storageDirPath = Paths.get(storageDir).normalize().toAbsolutePath();
            
            // 安全校验：请求的文件必须位于 storageDir 目录下
            if (!reqFile.startsWith(storageDirPath)) {
                 log.warn("拒绝访问越权文件: {}", reqFile);
                 return ResponseEntity.status(403).build();
            }
            
            Resource resource = new UrlResource(reqFile.toUri());
            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(resource);
            } else {
                log.warn("文件不存在或不可读: {}", reqFile);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("读取图片资源失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    private Map<String, String> errorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}
