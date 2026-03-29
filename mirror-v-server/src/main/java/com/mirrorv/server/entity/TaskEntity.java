package com.mirrorv.server.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 任务实体类，对应数据库中的 tasks 表
 */
@Data
@Entity
@Table(name = "tasks")
@EntityListeners(AuditingEntityListener.class)
public class TaskEntity {

    /**
     * 主键 ID，使用 UUID 自动生成
     */
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID")
    private UUID id;

    /**
     * 用户 ID，非空
     */
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /**
     * 视频 URL 地址，非空
     */
    @Column(name = "video_url", nullable = false)
    private String videoUrl;

    /**
     * 任务状态，默认为 PENDING
     */
    @Column(name = "status", nullable = false)
    private String status = "PENDING";

    /**
     * 任务分析报告（JSON 格式或文本，可选）
     */
    @Column(name = "report")
    private String report;

    /**
     * 任务创建时间，由 JPA 自动审计记录
     */
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 任务更新时间，由 JPA 自动审计记录
     */
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
