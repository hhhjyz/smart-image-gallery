# MySQL 数据库脚本说明

本目录包含项目所需的 MySQL 建库建表脚本和示例数据。

## 文件列表

| 文件 | 说明 |
|------|------|
| `schema.sql` | 建库建表脚本，创建 `smart_gallery` 数据库及 `users`、`images` 表 |
| `seed.sql` | 示例数据脚本，插入测试用户和图片记录 |

## 使用方法

### 方式一：Docker Compose 自动初始化

在 `docker-compose.yml` 中，MySQL 容器启动时会自动创建 `smart_gallery` 数据库。后端服务启动后会通过 GORM 的 `AutoMigrate` 自动创建表结构。

```bash
docker compose up --build
```

### 方式二：手动执行脚本

1. 确保 MySQL 服务已启动（本地或 Docker）
2. 执行建表脚本：

```bash
# 连接到 MySQL 并执行脚本
mysql -u root -p < mysql/schema.sql

# （可选）插入示例数据
mysql -u root -p < mysql/seed.sql
```

### 方式三：在 MySQL 客户端中执行

```sql
source /path/to/smart-image-gallery/mysql/schema.sql;
source /path/to/smart-image-gallery/mysql/seed.sql;
```

## 表结构说明

### users 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| deleted_at | DATETIME | 软删除时间 |
| username | VARCHAR(255) | 用户名，唯一 |
| email | VARCHAR(255) | 邮箱，唯一 |
| password | TEXT | bcrypt 哈希密码 |

### images 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| deleted_at | DATETIME | 软删除时间 |
| user_id | BIGINT | 外键，关联 users.id |
| file_name | VARCHAR(512) | 原始文件名 |
| url | TEXT | 原图 URL |
| thumbnail_url | TEXT | 缩略图 URL |
| tags | TEXT | AI 生成的标签 |
| camera_model | VARCHAR(255) | 相机型号 |
| shooting_time | VARCHAR(255) | 拍摄时间 |
| resolution | VARCHAR(64) | 分辨率 |
| aperture | VARCHAR(64) | 光圈 |
| iso | VARCHAR(64) | ISO 感光度 |

## 注意事项

- 示例数据中的密码哈希对应明文 `password123`
- 生产环境请使用 `/api/auth/register` 接口创建用户，后端会自动对密码进行 bcrypt 哈希
- 后端启动时会自动执行 GORM AutoMigrate，因此即使不手动执行 `schema.sql`，表也会被自动创建
