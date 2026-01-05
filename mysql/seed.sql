-- ===========================================
-- MySQL 示例数据脚本 (smart_gallery)
-- ===========================================
-- 注意：password 字段存储的是 bcrypt 哈希值。
-- 推荐使用后端 /api/auth/register 接口创建用户（会自动哈希密码）。
-- 下面的示例哈希对应明文密码 "password123"（bcrypt cost=10）

USE `smart_gallery`;

-- 示例用户（密码: password123）
-- 此哈希为示例，实际使用时建议通过 API 注册
INSERT INTO `users` (`created_at`, `updated_at`, `username`, `email`, `password`) VALUES
  (NOW(), NOW(), 'alice', 'alice@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqUb.gB1d/eVhWqJptjWxHtIzZFCe'),
  (NOW(), NOW(), 'bob', 'bob@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqUb.gB1d/eVhWqJptjWxHtIzZFCe');

-- 示例图片记录（假设 user_id=1 即 alice）
INSERT INTO `images` (`created_at`, `updated_at`, `user_id`, `file_name`, `url`, `thumbnail_url`, `tags`, `camera_model`, `shooting_time`, `resolution`, `aperture`, `iso`) VALUES
  (NOW(), NOW(), 1, 'sunset.jpg', 'http://localhost:9000/images/sunset.jpg', 'http://localhost:9000/images/thumb-sunset.jpg', '日落,海滩,风景', 'Canon EOS 80D', '2024-06-15 18:30:00', '6000x4000', 'f/2.8', '100'),
  (NOW(), NOW(), 1, 'portrait.jpg', 'http://localhost:9000/images/portrait.jpg', 'http://localhost:9000/images/thumb-portrait.jpg', '人像,室内', 'Sony A7III', '2024-07-20 14:00:00', '4240x2832', 'f/1.8', '200');
