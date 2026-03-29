package com.mirrorv.server.controller;

import com.mirrorv.server.entity.TaskEntity;
import com.mirrorv.server.repository.TaskRepository;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 任务控制层，负责接收前端任务请求、持久化并分发至 Redis 队列
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/tasks")
@CrossOrigin // 开启跨域处理以支持前端调用
public class TaskController {

    private final TaskRepository taskRepository;
    private final StringRedisTemplate redisTemplate;
    
    // Redis 队列 Key 规范
    private static final String TASK_QUEUE_KEY = "mirror_v_task_queue";

    public TaskController(TaskRepository taskRepository, StringRedisTemplate redisTemplate) {
        this.taskRepository = taskRepository;
        this.redisTemplate = redisTemplate;
    }

    /**
     * 接收新任务请求
     * @param request 包含 videoUrl 和 userId 的请求体
     * @return 包含 taskId 和 status 的响应
     */
    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody TaskRequest request) {
        log.info("Received task request: {}", request);

        // 1. 参数校验
        if (request.getVideoUrl() == null || request.getVideoUrl().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("videoUrl 不能为空"));
        }
        if (request.getUserId() == null || request.getUserId().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("userId 不能为空"));
        }

        try {
            // 2. 构造 TaskEntity 并存入 PostgreSQL
            TaskEntity task = new TaskEntity();
            task.setVideoUrl(request.getVideoUrl());
            task.setUserId(UUID.fromString(request.getUserId())); // 可能会抛出 IllegalArgumentException
            task.setStatus("PENDING");

            TaskEntity savedTask = taskRepository.save(task);
            String taskId = savedTask.getId().toString();
            log.info("Task saved to database with ID: {}", taskId);

            // 3. 将任务 ID 压入 Redis 列表
            redisTemplate.opsForList().rightPush(TASK_QUEUE_KEY, taskId);
            log.info("Task ID pushed to Redis queue: {}", TASK_QUEUE_KEY);

            // 4. 构建返回结果
            Map<String, String> response = new HashMap<>();
            response.put("taskId", taskId);
            response.put("status", savedTask.getStatus());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID format for userId: {}", request.getUserId());
            return ResponseEntity.badRequest().body(createErrorResponse("userId 格式不正确，应为 UUID 格式"));
        } catch (Exception e) {
            log.error("Error processing task creation", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("系统内部错误: " + e.getMessage()));
        }
    }

    /**
     * 根据 ID 获取任务状态及报告
     * @param taskId 任务 UUID 字符串
     * @return 包含 status 和 report 的响应
     */
    @GetMapping("/{taskId}")
    public ResponseEntity<?> getTaskStatus(@PathVariable String taskId) {
        log.info("Querying status for task ID: {}", taskId);

        try {
            // 1. 转换 UUID 并查询数据库
            UUID uuid = UUID.fromString(taskId);
            return taskRepository.findById(uuid)
                    .map(task -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("taskId", task.getId().toString());
                        response.put("status", task.getStatus());
                        response.put("report", task.getReport());
                        response.put("createdAt", task.getCreatedAt());
                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> ResponseEntity.status(404).body(createErrorResponse("找不到任务 ID: " + taskId)));

        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID format: {}", taskId);
            return ResponseEntity.badRequest().body(createErrorResponse("无效的任务 ID 格式"));
        } catch (Exception e) {
            log.error("Error querying task status", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("系统内部错误: " + e.getMessage()));
        }
    }

    /**
     * 内部类：任务请求实体
     */
    @Data
    public static class TaskRequest {
        private String videoUrl;
        private String userId;
    }

    /**
     * 辅助方法：创建错误响应格式
     */
    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}
