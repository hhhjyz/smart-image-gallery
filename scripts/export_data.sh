#!/bin/bash
# ===========================================
# 数据导出脚本
# 导出 MySQL 数据和 MinIO 图片文件
# ===========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "[INFO] 开始导出数据..."
echo "备份目录: $BACKUP_DIR"

# 创建备份目录
mkdir -p "$BACKUP_DIR/minio_images"

# 1. 导出 MySQL 数据
echo ""
echo "[INFO] 正在导出 MySQL 数据..."
docker exec gallery_db mysqldump -u root -prootpassword smart_gallery > "$BACKUP_DIR/mysql_backup.sql"
echo "[OK] MySQL 数据已导出到: $BACKUP_DIR/mysql_backup.sql"

# 2. 导出 MinIO 图片文件
echo ""
echo "[INFO] 正在导出 MinIO 图片文件..."
# 先清空旧的备份
rm -rf "$BACKUP_DIR/minio_images/*" 2>/dev/null || true
# 从容器复制文件
docker cp gallery_minio:/data/images/. "$BACKUP_DIR/minio_images/" 2>/dev/null || echo "[WARN] MinIO images bucket 可能为空或不存在"
echo "[OK] MinIO 图片已导出到: $BACKUP_DIR/minio_images/"

# 3. 统计信息
echo ""
echo "[INFO] 导出统计:"
if [ -f "$BACKUP_DIR/mysql_backup.sql" ]; then
    echo "   - MySQL 备份文件大小: $(du -h "$BACKUP_DIR/mysql_backup.sql" | cut -f1)"
fi
if [ -d "$BACKUP_DIR/minio_images" ]; then
    IMAGE_COUNT=$(find "$BACKUP_DIR/minio_images" -type f 2>/dev/null | wc -l | tr -d ' ')
    echo "   - MinIO 图片数量: $IMAGE_COUNT 个文件"
fi

echo ""
echo "[DONE] 数据导出完成!"
echo ""
echo "备份文件位置:"
echo "   $BACKUP_DIR/"
echo "   ├── mysql_backup.sql    # MySQL 数据"
echo "   └── minio_images/       # 图片文件"
echo ""
echo "提示: 将 backup/ 文件夹与项目一起打包提交"
