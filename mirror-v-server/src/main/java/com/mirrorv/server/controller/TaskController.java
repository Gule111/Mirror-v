package com.mirrorv.server.controller;

import com.mirrorv.server.dto.TaskRequest;
import com.mirrorv.server.entity.TaskEntity;
import com.mirrorv.server.exception.RedisQueueException;
import com.mirrorv.server.service.TaskService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    /**
     * 构造函数注入 TaskService
     */
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    /**
     * 创建新任务
     *
     * @param request 包含 videoUrl 和 userId 的请求体
     * @return 包含 taskId 和 status 的响应
     */
    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody TaskRequest request) {
        log.info("收到任务创建请求: {}", request);

        // 1. 参数校验
        if (request.getVideoUrl() == null || request.getVideoUrl().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(errorResponse("videoUrl 不能为空"));
        }
        if (request.getUserId() == null || request.getUserId().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(errorResponse("userId 不能为空"));
        }

        try {
            // 2. 调用 Service 层完成核心业务
            TaskEntity savedTask = taskService.createTask(request);

            // 3. 构建成功响应
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
     *
     * @param taskId 任务 UUID 字符串
     * @return 包含 status 和 report 的响应
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

    /**
     * 辅助方法：构建统一错误响应
     */
    private Map<String, String> errorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}
