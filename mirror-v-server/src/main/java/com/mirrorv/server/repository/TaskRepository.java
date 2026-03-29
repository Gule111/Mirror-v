package com.mirrorv.server.repository;

import com.mirrorv.server.entity.TaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * 任务持久层接口，集成 JPA 提供基础 CRUD 操作
 */
@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, UUID> {
}
