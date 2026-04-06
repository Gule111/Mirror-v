package com.mirrorv.server.repository;

import com.mirrorv.server.entity.VideoAssetEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VideoAssetRepository extends JpaRepository<VideoAssetEntity, UUID> {
    List<VideoAssetEntity> findByTaskIdOrderByTimestampInVideoAsc(UUID taskId);
}
