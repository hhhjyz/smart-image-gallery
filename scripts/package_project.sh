#!/bin/bash
# ===========================================
# 项目打包脚本
# 打包源代码用于作业提交
# ===========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="smart-image-gallery_${TIMESTAMP}.zip"

cd "$PROJECT_DIR"

echo "📦 开始打包项目..."
echo "项目目录: $PROJECT_DIR"

# 创建临时目录
TEMP_DIR=$(mktemp -d)
PACKAGE_DIR="$TEMP_DIR/smart-image-gallery"
mkdir -p "$PACKAGE_DIR"

# 复制项目文件（排除不需要的文件）
echo ""
echo "📂 复制项目文件..."

# 后端
cp -r backend "$PACKAGE_DIR/"
rm -rf "$PACKAGE_DIR/backend/tmp" 2>/dev/null || true

# 前端（排除 node_modules）
mkdir -p "$PACKAGE_DIR/frontend"
cp -r frontend/src "$PACKAGE_DIR/frontend/"
cp -r frontend/public "$PACKAGE_DIR/frontend/"
cp frontend/package.json "$PACKAGE_DIR/frontend/"
cp frontend/vite.config.js "$PACKAGE_DIR/frontend/"
cp frontend/tailwind.config.js "$PACKAGE_DIR/frontend/"
cp frontend/postcss.config.js "$PACKAGE_DIR/frontend/"
cp frontend/eslint.config.js "$PACKAGE_DIR/frontend/"
cp frontend/index.html "$PACKAGE_DIR/frontend/"
cp frontend/README.md "$PACKAGE_DIR/frontend/" 2>/dev/null || true

# MCP 服务器（排除 node_modules）
mkdir -p "$PACKAGE_DIR/mcp-server"
cp mcp-server/package.json "$PACKAGE_DIR/mcp-server/"
cp mcp-server/index.js "$PACKAGE_DIR/mcp-server/"
cp mcp-server/README.md "$PACKAGE_DIR/mcp-server/" 2>/dev/null || true

# MySQL 初始化脚本
cp -r mysql "$PACKAGE_DIR/" 2>/dev/null || true

# SQLite 文件（如果有）
cp -r sqlite "$PACKAGE_DIR/" 2>/dev/null || true

# Docker 配置
cp docker-compose.yml "$PACKAGE_DIR/"

# 脚本
cp -r scripts "$PACKAGE_DIR/"

# 文档
cp README.DOCKER.md "$PACKAGE_DIR/" 2>/dev/null || true

# 创建 .gitignore（方便后续使用）
cat > "$PACKAGE_DIR/.gitignore" << 'EOF'
# Dependencies
node_modules/
vendor/

# Build outputs
dist/
build/
tmp/

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db

# Backup
backup/

# Logs
*.log
EOF

# 打包
echo ""
echo "🗜️  正在压缩..."
cd "$TEMP_DIR"
zip -r "$PROJECT_DIR/$PACKAGE_NAME" smart-image-gallery -x "*.git*"

# 清理
rm -rf "$TEMP_DIR"

# 统计
echo ""
echo "📊 打包统计:"
echo "   - 文件大小: $(du -h "$PROJECT_DIR/$PACKAGE_NAME" | cut -f1)"

echo ""
echo "✨ 打包完成！"
echo "📁 文件位置: $PROJECT_DIR/$PACKAGE_NAME"
echo ""
echo "📋 包含内容:"
echo "   - backend/       Go 后端代码"
echo "   - frontend/      React 前端代码"
echo "   - mcp-server/    MCP 服务器代码"
echo "   - mysql/         数据库初始化脚本"
echo "   - scripts/       工具脚本"
echo "   - docker-compose.yml"
