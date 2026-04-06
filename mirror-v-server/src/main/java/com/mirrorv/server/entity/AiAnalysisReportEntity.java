package com.mirrorv.server.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "ai_analysis_reports")
@EntityListeners(AuditingEntityListener.class)
public class AiAnalysisReportEntity {

    @Id
    @Column(columnDefinition = "UUID")
    private UUID id;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "analysis_result", columnDefinition = "TEXT", nullable = false)
    private String analysisResult;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
