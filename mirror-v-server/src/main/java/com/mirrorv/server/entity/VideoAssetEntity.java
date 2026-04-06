package com.mirrorv.server.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "video_assets")
@EntityListeners(AuditingEntityListener.class)
public class VideoAssetEntity {

    @Id
    @Column(columnDefinition = "UUID")
    private UUID id;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "asset_type", nullable = false)
    private String assetType = "FRAME";

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "timestamp_in_video")
    private Float timestampInVideo;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
