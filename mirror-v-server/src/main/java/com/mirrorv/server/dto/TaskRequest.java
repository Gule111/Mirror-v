package com.mirrorv.server.dto;

import lombok.Data;

/**
 * 任务创建请求 DTO
 */
@Data
public class TaskRequest {
    private String videoUrl;
    private String userId;
}
