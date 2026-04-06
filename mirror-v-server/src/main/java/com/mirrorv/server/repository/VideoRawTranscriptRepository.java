package com.mirrorv.server.repository;

import com.mirrorv.server.entity.VideoRawTranscriptEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VideoRawTranscriptRepository extends JpaRepository<VideoRawTranscriptEntity, UUID> {
    Optional<VideoRawTranscriptEntity> findByTaskId(UUID taskId);
}
