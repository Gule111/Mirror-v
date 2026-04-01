package com.mirrorv.server.exception;

/**
 * Redis 队列操作异常
 * 当任务推送至 Redis 队列失败时抛出此异常
 */
public class RedisQueueException extends RuntimeException {

    public RedisQueueException(String message) {
        super(message);
    }

    public RedisQueueException(String message, Throwable cause) {
        super(message, cause);
    }
}
