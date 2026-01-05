# 数据导出/导入脚本

本目录包含用于备份和恢复项目数据的脚本。

## 脚本说明

| 脚本 | 用途 |
|------|------|
| `export_data.sh` | 导出 MySQL 数据和 MinIO 图片到 `backup/` 目录 |
| `import_data.sh` | 从 `backup/` 目录导入数据到运行中的容器 |

## 使用方法

### 导出数据（打包项目前执行）

```bash
# 确保容器正在运行
docker compose up -d

# 执行导出脚本
chmod +x scripts/export_data.sh
./scripts/export_data.sh
```

导出后会生成：
```
backup/
├── mysql_backup.sql    # MySQL 完整数据
└── minio_images/       # 所有上传的图片文件
```

### 导入数据（老师收到项目后执行）

```bash
# 1. 启动所有容器
docker compose up -d

# 2. 等待几秒让服务完全启动
sleep 5

# 3. 执行导入脚本
chmod +x scripts/import_data.sh
./scripts/import_data.sh
```

## 完整流程示例

### 学生端（导出并打包）

```bash
cd smart-image-gallery

# 启动服务（如果未启动）
docker compose up -d

# 导出数据
./scripts/export_data.sh

# 打包整个项目（包含 backup/ 目录）
cd ..
zip -r smart-image-gallery.zip smart-image-gallery/
```

### 老师端（解压并运行）

```bash
# 解压项目
unzip smart-image-gallery.zip
cd smart-image-gallery

# 启动容器
docker compose up -d --build

# 等待服务启动
sleep 10

# 导入数据
./scripts/import_data.sh

# 访问网站
open http://localhost:5173
```

## 注意事项

1. **导出前确保容器运行**：脚本需要连接到运行中的 Docker 容器
2. **MinIO bucket**：首次运行时需要在 MinIO 控制台创建 `images` bucket 并设置为 public
3. **数据一致性**：导出时建议暂停上传操作，确保数据完整
