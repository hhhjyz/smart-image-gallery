# Smart Gallery MCP Server

这是一个 MCP (Model Context Protocol) 服务器，允许 AI 助手（如 Claude）通过对话方式检索你的智能图库中的图片。

## 功能

| 工具 | 说明 |
|------|------|
| `search_images` | 按关键词搜索图片（标签、文件名、相机型号） |
| `list_all_images` | 列出所有图片 |
| `get_image_details` | 获取图片详情（含 EXIF 信息） |
| `get_images_by_tag` | 按标签筛选图片 |
| `get_gallery_stats` | 获取图库统计信息 |

## 安装

```bash
cd mcp-server
npm install
```

## 配置 Claude Desktop

在 Claude Desktop 的配置文件中添加此 MCP 服务器：

### macOS
配置文件位置: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "smart-gallery": {
      "command": "node",
      "args": ["/Users/hhhjyz/Desktop/Code/smart-image-gallery/mcp-server/index.js"],
      "env": {
        "BACKEND_URL": "http://localhost:8080"
      }
    }
  }
}
```

### Windows
配置文件位置: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "smart-gallery": {
      "command": "node",
      "args": ["C:\\path\\to\\smart-image-gallery\\mcp-server\\index.js"],
      "env": {
        "BACKEND_URL": "http://localhost:8080"
      }
    }
  }
}
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `BACKEND_URL` | 后端 API 地址 | `http://localhost:8080` |

## 使用示例

配置完成后，重启 Claude Desktop，然后你可以这样对话：

- "帮我搜索所有风景照片"
- "我的图库里有多少张照片？"
- "找出所有用 Canon 相机拍的照片"
- "获取 ID 为 5 的图片的详细信息"
- "显示图库统计，有哪些常用标签？"

## 注意事项

1. 确保后端服务 (`docker compose up`) 正在运行
2. MCP 服务器需要能访问后端 API（使用公开的 `/api/mcp/*` 接口，无需认证）
