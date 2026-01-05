# 智能图库

基于 Go + React 的智能图片管理系统，支持 AI 图片识别、EXIF 信息提取、图片编辑等功能。

## 技术栈

- **后端**: Go 1.24 + Gin + GORM
- **前端**: React 19 + Vite + Tailwind CSS
- **数据库**: MySQL 8.0
- **对象存储**: MinIO
- **AI 服务**: 智谱 GLM-4V

## 快速启动

### 环境要求

- Docker 和 Docker Compose

### 启动服务

```bash
# 在项目根目录运行
docker compose up --build
```

### 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:5173 | 主界面 |
| 后端 API | http://localhost:8080/api | REST API |
| MinIO 控制台 | http://localhost:9001 | 用户名: admin, 密码: password123 |

## 数据管理

项目提供了数据导入/导出脚本，方便在不同环境间迁移数据。

### 导出数据

将当前运行环境中的数据（MySQL 数据库 + MinIO 图片文件）导出到 `backup/` 目录：

```bash
./scripts/export_data.sh
```

导出内容：
```
backup/
├── mysql_backup.sql    # MySQL 数据库备份
└── minio_images/       # 图片文件
```

### 导入数据

从 `backup/` 目录导入数据到运行中的容器：

```bash
# 确保容器已启动
docker compose up -d

# 等待服务就绪后执行导入
./scripts/import_data.sh
```


