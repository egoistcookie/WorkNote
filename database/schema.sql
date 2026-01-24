-- 工作笔记小程序数据库表结构
-- 数据库: worknote
-- 字符集: utf8mb4

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `worknote` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE `worknote`;

-- 创建数据库用户（如果不存在）
-- 注意：MySQL 8.0+ 需要使用 CREATE USER IF NOT EXISTS，旧版本可能需要先检查用户是否存在
CREATE USER IF NOT EXISTS 'worknote'@'localhost' IDENTIFIED BY 'Srcb@2026';
CREATE USER IF NOT EXISTS 'worknote'@'%' IDENTIFIED BY 'Srcb@2026';

-- 授予权限（仅授予 worknote 数据库的权限）
GRANT ALL PRIVILEGES ON worknote.* TO 'worknote'@'localhost';
GRANT ALL PRIVILEGES ON worknote.* TO 'worknote'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 1. 用户信息表
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `openid` VARCHAR(64) NOT NULL COMMENT '微信openid',
  `nickname` VARCHAR(100) DEFAULT NULL COMMENT '昵称',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `theme` VARCHAR(20) DEFAULT 'warm' COMMENT '主题偏好(warm/cool)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户信息表';

-- 2. 分类表
CREATE TABLE IF NOT EXISTS `categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `name` VARCHAR(100) NOT NULL COMMENT '分类名称',
  `color` VARCHAR(20) NOT NULL DEFAULT '#969799' COMMENT '分类颜色',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_name` (`user_id`, `name`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- 3. 流水线任务表
CREATE TABLE IF NOT EXISTS `timeline_tasks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `category_id` BIGINT UNSIGNED NOT NULL COMMENT '分类ID',
  `title` VARCHAR(200) NOT NULL COMMENT '任务标题',
  `description` TEXT DEFAULT NULL COMMENT '任务描述',
  `date` DATE NOT NULL COMMENT '任务日期',
  `start_time` TIME DEFAULT NULL COMMENT '开始时间(HH:mm:ss)',
  `end_time` TIME DEFAULT NULL COMMENT '结束时间(HH:mm:ss)',
  `duration` INT UNSIGNED DEFAULT 0 COMMENT '总时长(秒)',
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态(pending/in_progress/paused/completed/cancelled)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_date` (`date`),
  KEY `idx_user_date` (`user_id`, `date`),
  CONSTRAINT `fk_timeline_task_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_timeline_task_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='流水线任务表';

-- 4. 时间段表
CREATE TABLE IF NOT EXISTS `time_segments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '时间段ID',
  `task_id` BIGINT UNSIGNED NOT NULL COMMENT '任务ID',
  `start_datetime` DATETIME NOT NULL COMMENT '开始时间(YYYY-MM-DD HH:mm:ss)',
  `end_datetime` DATETIME DEFAULT NULL COMMENT '结束时间(YYYY-MM-DD HH:mm:ss)',
  `duration` INT UNSIGNED DEFAULT 0 COMMENT '时长(秒)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_start_datetime` (`start_datetime`),
  CONSTRAINT `fk_segment_task` FOREIGN KEY (`task_id`) REFERENCES `timeline_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='时间段表';

-- 5. 待办任务表
CREATE TABLE IF NOT EXISTS `todo_tasks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '待办ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `category_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '分类ID(关联到分类表，可为空)',
  `title` VARCHAR(200) NOT NULL COMMENT '待办标题',
  `description` TEXT DEFAULT NULL COMMENT '待办描述',
  `priority` VARCHAR(30) NOT NULL DEFAULT 'urgent_important' COMMENT '优先级(urgent_important/important_not_urgent/urgent_not_important/not_urgent_not_important)',
  `start_date` DATE DEFAULT NULL COMMENT '开始日期',
  `end_date` DATE DEFAULT NULL COMMENT '结束日期',
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态(pending/completed)',
  `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_status` (`status`),
  KEY `idx_user_status` (`user_id`, `status`),
  CONSTRAINT `fk_todo_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_todo_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='待办任务表';

-- 6. 每日计划总结表
CREATE TABLE IF NOT EXISTS `daily_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `date` DATE NOT NULL COMMENT '日期',
  `type` VARCHAR(20) NOT NULL COMMENT '类型(morning/evening)',
  `content` TEXT NOT NULL COMMENT '内容',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_date_type` (`user_id`, `date`, `type`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_date` (`date`),
  CONSTRAINT `fk_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日计划总结表';

-- 7. 数据上传记录表（用于记录上传历史）
CREATE TABLE IF NOT EXISTS `upload_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `upload_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  `file_size` INT UNSIGNED DEFAULT 0 COMMENT '文件大小(字节)',
  `task_count` INT UNSIGNED DEFAULT 0 COMMENT '导入任务数',
  `todo_count` INT UNSIGNED DEFAULT 0 COMMENT '导入待办数',
  `log_count` INT UNSIGNED DEFAULT 0 COMMENT '导入日志数',
  `category_count` INT UNSIGNED DEFAULT 0 COMMENT '导入分类数',
  `status` VARCHAR(20) DEFAULT 'success' COMMENT '状态(success/failed)',
  `error_message` TEXT DEFAULT NULL COMMENT '错误信息',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_upload_time` (`upload_time`),
  CONSTRAINT `fk_upload_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据上传记录表';