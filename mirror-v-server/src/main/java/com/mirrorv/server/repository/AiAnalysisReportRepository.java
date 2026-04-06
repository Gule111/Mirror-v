package com.mirrorv.server.repository;

import com.mirrorv.server.entity.AiAnalysisReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiAnalysisReportRepository extends JpaRepository<AiAnalysisReportEntity, UUID> {
    Optional<AiAnalysisReportEntity> findByTaskId(UUID taskId);
}
