#!/bin/bash
# ===========================================
# 数据导入脚本
# 导入 MySQL 数据和 MinIO 图片文件
# ===========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backup"

echo "[INFO] 开始导入数据..."
echo "备份目录: $BACKUP_DIR"

# 检查备份目录是否存在
if [ ! -d "$BACKUP_DIR" ]; then
    echo "[ERROR] 备份目录不存在: $BACKUP_DIR"
    echo "请确保 backup/ 文件夹存在并包含备份文件"
    exit 1
fi

# 检查容器是否运行
if ! docker ps | grep -q gallery_db; then
    echo "[ERROR] MySQL 容器 (gallery_db) 未运行"
    echo "请先运行: docker compose up -d"
    exit 1
fi

if ! docker ps | grep -q gallery_minio; then
    echo "[ERROR] MinIO 容器 (gallery_minio) 未运行"
    echo "请先运行: docker compose up -d"
    exit 1
fi

# 1. 等待 MySQL 就绪
echo ""
echo "[INFO] 等待 MySQL 就绪..."
for i in {1..30}; do
    if docker exec gallery_db mysqladmin ping -h localhost -u root -prootpassword --silent 2>/dev/null; then
        echo "[OK] MySQL 已就绪"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "[ERROR] MySQL 启动超时"
        exit 1
    fi
    sleep 1
done

# 2. 导入 MySQL 数据
if [ -f "$BACKUP_DIR/mysql_backup.sql" ]; then
    echo ""
    echo "[INFO] 正在导入 MySQL 数据..."
    docker exec -i gallery_db mysql -u root -prootpassword smart_gallery < "$BACKUP_DIR/mysql_backup.sql"
    echo "[OK] MySQL 数据导入完成"
else
    echo "[WARN] 未找到 MySQL 备份文件: $BACKUP_DIR/mysql_backup.sql"
fi

# 3. 导入 MinIO 图片文件
if [ -d "$BACKUP_DIR/minio_images" ] && [ "$(ls -A "$BACKUP_DIR/minio_images" 2>/dev/null)" ]; then
    echo ""
    echo "[INFO] 正在导入 MinIO 图片文件..."
    
    # 确保 MinIO 中的 images 目录存在
    docker exec gallery_minio mkdir -p /data/images
    
    # 复制文件到容器
    docker cp "$BACKUP_DIR/minio_images/." gallery_minio:/data/images/
    echo "[OK] MinIO 图片导入完成"
else
    echo "[WARN] 未找到 MinIO 图片文件或文件夹为空: $BACKUP_DIR/minio_images/"
fi

# 4. 统计信息
echo ""
echo "[INFO] 导入统计:"
USERS=$(docker exec gallery_db mysql -u root -prootpassword -N -e "SELECT COUNT(*) FROM smart_gallery.users WHERE deleted_at IS NULL" 2>/dev/null || echo "0")
IMAGES=$(docker exec gallery_db mysql -u root -prootpassword -N -e "SELECT COUNT(*) FROM smart_gallery.images WHERE deleted_at IS NULL" 2>/dev/null || echo "0")
echo "   - 用户数: $USERS"
echo "   - 图片记录数: $IMAGES"

echo ""
echo "[DONE] 数据导入完成!"
echo ""
echo "现在可以访问:"
echo "   - 前端: http://localhost:5173"
echo "   - 后端 API: http://localhost:8080/api"
echo "   - MinIO 控制台: http://localhost:9001"
