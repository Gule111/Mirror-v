package com.mirrorv.server.service;

import com.mirrorv.server.dto.TaskRequest;
import com.mirrorv.server.entity.TaskEntity;
import com.mirrorv.server.exception.RedisQueueException;
import com.mirrorv.server.repository.TaskRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * 任务服务层，承载核心业务逻辑
 * <p>
 * 职责：DTO → Entity 转换、持久化、Redis 队列分发
 */
@Slf4j
@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final StringRedisTemplate redisTemplate;

    /**
     * Redis 队列 Key，与 Python AI Worker 的 BLPOP 对接
     */
    private static final String TASK_QUEUE_KEY = "mirror_v_task_queue";

    /**
     * 构造函数注入（Constructor Injection），符合 Spring 推荐实践
     */
    public TaskService(TaskRepository taskRepository, StringRedisTemplate redisTemplate) {
        this.taskRepository = taskRepository;
        this.redisTemplate = redisTemplate;
    }

    /**
     * 创建任务：DTO 转 Entity → 持久化至 PostgreSQL → 推送至 Redis 队列
     *
     * @param dto 前端传入的任务请求
     * @return 持久化后的 TaskEntity（含数据库生成的 UUID）
     * @throws RedisQueueException 当 Redis 推送失败时抛出
     */
    public TaskEntity createTask(TaskRequest dto) {
        // 1. DTO → Entity 转换
        TaskEntity task = new TaskEntity();
        task.setVideoUrl(dto.getVideoUrl());
        task.setUserId(UUID.fromString(dto.getUserId()));
        task.setStatus("PENDING");

        // 2. 持久化至 PostgreSQL
        TaskEntity savedTask = taskRepository.save(task);
        String taskId = savedTask.getId().toString();
        log.info("✅ [DB] 任务已存入数据库 | taskId={}, status={}", taskId, savedTask.getStatus());

        // 3. 推送至 Redis 队列（rightPush 对应 Python 端 BLPOP）
        try {
            redisTemplate.opsForList().rightPush(TASK_QUEUE_KEY, taskId);
            log.info("✅ [Redis] 任务 ID 已推入队列 | queue={}, taskId={}", TASK_QUEUE_KEY, taskId);
        } catch (Exception e) {
            log.error("❌ [Redis] 任务推送至队列失败 | queue={}, taskId={}, error={}",
                    TASK_QUEUE_KEY, taskId, e.getMessage(), e);
            throw new RedisQueueException(
                    "Redis 队列推送失败，任务已存入数据库但未分发。taskId=" + taskId, e);
        }

        return savedTask;
    }

    /**
     * 根据 ID 查询任务
     *
     * @param taskId 任务 UUID
     * @return 任务实体（Optional 已在 Controller 层处理）
     */
    public TaskEntity getTaskById(UUID taskId) {
        return taskRepository.findById(taskId).orElse(null);
    }
}
