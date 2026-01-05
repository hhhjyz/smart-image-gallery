#!/usr/bin/env node

/**
 * Smart Gallery MCP Server
 * 提供 MCP 接口，允许大模型通过对话方式检索图库中的图片
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

// 配置
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

// 创建 axios 实例 - 使用 MCP 公开接口，无需认证
const api = axios.create({
  baseURL: `${BACKEND_URL}/api/mcp`,
  timeout: 10000,
});

// 创建 MCP 服务器
const server = new Server(
  {
    name: "smart-gallery-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 定义可用的工具
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_images",
        description: "搜索图库中的图片。可以按标签、文件名、相机型号等关键词搜索。返回匹配的图片列表。",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "搜索关键词，可以是标签（如：风景、人像、日落）、文件名、相机型号等",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "list_all_images",
        description: "列出图库中的所有图片。返回图片列表，包含文件名、标签、拍摄时间等信息。",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "返回的最大图片数量，默认 20",
            },
          },
        },
      },
      {
        name: "get_image_details",
        description: "获取指定图片的详细信息，包括 EXIF 数据（相机型号、拍摄时间、分辨率、光圈、ISO 等）。",
        inputSchema: {
          type: "object",
          properties: {
            image_id: {
              type: "number",
              description: "图片 ID",
            },
          },
          required: ["image_id"],
        },
      },
      {
        name: "get_images_by_tag",
        description: "按标签筛选图片。返回包含指定标签的所有图片。",
        inputSchema: {
          type: "object",
          properties: {
            tag: {
              type: "string",
              description: "要筛选的标签，如：风景、美食、人像等",
            },
          },
          required: ["tag"],
        },
      },
      {
        name: "get_gallery_stats",
        description: "获取图库统计信息，包括图片总数、常用标签、相机型号分布等。",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "search_images": {
        const { query } = args;
        const response = await api.get("/images", { params: { q: query } });
        const images = response.data.data || [];
        
        if (images.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `没有找到与 "${query}" 相关的图片。`,
              },
            ],
          };
        }

        const result = images.map((img) => ({
          id: img.ID,
          file_name: img.file_name,
          tags: img.tags,
          camera: img.camera_model,
          shooting_time: img.shooting_time,
          url: img.url,
        }));

        return {
          content: [
            {
              type: "text",
              text: `找到 ${images.length} 张与 "${query}" 相关的图片：\n\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }

      case "list_all_images": {
        const limit = args?.limit || 20;
        const response = await api.get("/images", { params: { q: "" } });
        const images = (response.data.data || []).slice(0, limit);

        if (images.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "图库中暂无图片。",
              },
            ],
          };
        }

        const result = images.map((img) => ({
          id: img.ID,
          file_name: img.file_name,
          tags: img.tags,
          upload_time: img.CreatedAt,
        }));

        return {
          content: [
            {
              type: "text",
              text: `图库共有图片，以下是前 ${images.length} 张：\n\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }

      case "get_image_details": {
        const { image_id } = args;
        const response = await api.get("/images", { params: { q: "" } });
        const images = response.data.data || [];
        const image = images.find((img) => img.ID === image_id);

        if (!image) {
          return {
            content: [
              {
                type: "text",
                text: `未找到 ID 为 ${image_id} 的图片。`,
              },
            ],
          };
        }

        const details = {
          id: image.ID,
          file_name: image.file_name,
          tags: image.tags,
          url: image.url,
          thumbnail_url: image.thumbnail_url,
          exif: {
            camera_model: image.camera_model || "未知",
            shooting_time: image.shooting_time || "未知",
            resolution: image.resolution || "未知",
            aperture: image.aperture || "未知",
            iso: image.iso || "未知",
          },
          upload_time: image.CreatedAt,
        };

        return {
          content: [
            {
              type: "text",
              text: `图片详情：\n\n${JSON.stringify(details, null, 2)}`,
            },
          ],
        };
      }

      case "get_images_by_tag": {
        const { tag } = args;
        const response = await api.get("/images", { params: { q: tag } });
        const images = response.data.data || [];

        // 进一步过滤，确保标签匹配
        const filtered = images.filter(
          (img) => img.tags && img.tags.toLowerCase().includes(tag.toLowerCase())
        );

        if (filtered.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `没有找到带有标签 "${tag}" 的图片。`,
              },
            ],
          };
        }

        const result = filtered.map((img) => ({
          id: img.ID,
          file_name: img.file_name,
          tags: img.tags,
          camera: img.camera_model,
        }));

        return {
          content: [
            {
              type: "text",
              text: `找到 ${filtered.length} 张带有标签 "${tag}" 的图片：\n\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }

      case "get_gallery_stats": {
        const response = await api.get("/stats");
        const stats = response.data;

        return {
          content: [
            {
              type: "text",
              text: `图库统计信息：\n\n- 图片总数: ${stats.total_images}\n- 热门标签: ${JSON.stringify(stats.top_tags, null, 2)}\n- 相机分布: ${JSON.stringify(stats.cameras, null, 2)}`,
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `未知工具: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `调用失败: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Smart Gallery MCP Server 已启动");
}

main().catch(console.error);
