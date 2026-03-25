-- 1. 任务表 (增加逻辑删除字段 is_deleted)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    is_deleted BOOLEAN DEFAULT FALSE,               -- 逻辑删除标识
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 素材表 (去掉 ON DELETE CASCADE)
CREATE TABLE IF NOT EXISTS video_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id),               -- 仅保留引用，不自动删除
    asset_type VARCHAR(20),
    file_path TEXT NOT NULL,
    timestamp_in_video DECIMAL(12, 3),               -- 解决 FLOAT 精度问题
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 台词表
CREATE TABLE IF NOT EXISTS video_raw_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id),
    content TEXT NOT NULL,
    duration DECIMAL(12, 3),                         -- 精确时长
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. AI报告表
CREATE TABLE IF NOT EXISTS ai_analysis_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id),
    hook_logic TEXT,
    content_structure JSONB,
    gold_quotes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
