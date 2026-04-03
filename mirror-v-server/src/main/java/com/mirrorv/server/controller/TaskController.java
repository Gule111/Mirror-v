package com.mirrorv.server.controller;

import com.mirrorv.server.dto.TaskRequest;
import com.mirrorv.server.entity.TaskEntity;
import com.mirrorv.server.exception.RedisQueueException;
import com.mirrorv.server.service.TaskService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

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

    // Storage directory relative to project root or use an absolute path for safety
    private static final String STORAGE_DIR = "D:/workspace/Mirror-v/Mirror-v0.1.0/storage";

    /**
     * 构造函数注入 TaskService
     */
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
        
        // Ensure storage directory exists
        try {
            Files.createDirectories(Paths.get(STORAGE_DIR));
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
            String newFileName = UUID.randomUUID().toString() + extension;
            
            // 拼接绝对路径
            Path targetLocation = Paths.get(STORAGE_DIR, newFileName);
            
            // 将文件保存到磁盘
            Files.copy(file.getInputStream(), targetLocation);
            log.info("文件已保存至: {}", targetLocation.toAbsolutePath());

            // 构造请求给 Service
            TaskRequest request = new TaskRequest();
            request.setUserId(userId);
            request.setVideoUrl(targetLocation.toAbsolutePath().toString().replace("\\", "/"));

            return processTaskCreation(request);

        } catch (IOException e) {
            log.error("保存视频文件失败", e);
            return ResponseEntity.internalServerError().body(errorResponse("保存视频文件失败: " + e.getMessage()));
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
            TaskEntity task = taskService.getTaskById(uuid);

            if (task == null) {
                return ResponseEntity.status(404).body(errorResponse("找不到任务 ID: " + taskId));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("taskId", task.getId().toString());
            response.put("userId", task.getUserId().toString());
            response.put("status", task.getStatus());
            response.put("createdAt", task.getCreatedAt());
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("无效的 UUID 格式: {}", taskId);
            return ResponseEntity.badRequest().body(errorResponse("无效的任务 ID 格式"));
        } catch (Exception e) {
            log.error("查询任务状态异常", e);
            return ResponseEntity.internalServerError().body(errorResponse("系统内部错误: " + e.getMessage()));
        }
    }

    private Map<String, String> errorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}
