-- ===========================================
-- MySQL 建库建表脚本 (smart_gallery)
-- 对应后端 GORM models: User, Image
-- ===========================================

-- 1. 创建数据库
CREATE DATABASE IF NOT EXISTS `smart_gallery`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `smart_gallery`;

-- 2. 用户表 (users)
-- 对应 models.User，包含 gorm.Model 的 id, created_at, updated_at, deleted_at
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(3) NULL DEFAULT NULL,
  `updated_at` DATETIME(3) NULL DEFAULT NULL,
  `deleted_at` DATETIME(3) NULL DEFAULT NULL,
  `username` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` TEXT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_username` (`username`),
  UNIQUE KEY `idx_users_email` (`email`),
  INDEX `idx_users_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. 图片表 (images)
-- 对应 models.Image，存储图片元信息与 EXIF 数据
CREATE TABLE IF NOT EXISTS `images` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(3) NULL DEFAULT NULL,
  `updated_at` DATETIME(3) NULL DEFAULT NULL,
  `deleted_at` DATETIME(3) NULL DEFAULT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '所属用户ID',
  `file_name` VARCHAR(512) DEFAULT NULL COMMENT '原始文件名',
  `url` TEXT DEFAULT NULL COMMENT '原图访问URL',
  `tags` TEXT DEFAULT NULL COMMENT 'AI生成的标签',
  `thumbnail_url` TEXT DEFAULT NULL COMMENT '缩略图URL',
  `camera_model` VARCHAR(255) DEFAULT NULL COMMENT '相机型号',
  `shooting_time` VARCHAR(255) DEFAULT NULL COMMENT '拍摄时间',
  `resolution` VARCHAR(64) DEFAULT NULL COMMENT '分辨率',
  `aperture` VARCHAR(64) DEFAULT NULL COMMENT '光圈',
  `iso` VARCHAR(64) DEFAULT NULL COMMENT 'ISO感光度',
  PRIMARY KEY (`id`),
  INDEX `idx_images_user_id` (`user_id`),
  INDEX `idx_images_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_images_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
