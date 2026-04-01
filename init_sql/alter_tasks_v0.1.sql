-- Mirror-V 架构对齐补丁 (v0.1)
-- 目标：同步 tasks 表结构，增加 user_id，移除冗余的 report

-- 1. 增加 user_id 字段 (UUID 类型)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID;

-- 2. 移除冗余的 report 字段 (如果有的话)
-- 注意：如果该字段不存在，DROP COLUMN 会报错，使用 IF EXISTS
ALTER TABLE tasks DROP COLUMN IF EXISTS report;

-- 3. 确保 is_deleted 字段存在 (已经在 create_tables.sql 中，但为了稳妥加上)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN tasks.user_id IS '所属用户 ID';
COMMENT ON COLUMN tasks.is_deleted IS '逻辑删除标识';
