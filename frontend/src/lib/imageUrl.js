/**
 * 图片 URL 处理工具
 * 将相对路径或旧的 localhost URL 转换为当前主机可访问的完整 URL
 */

// 获取 MinIO 的基础 URL（根据当前访问的主机名动态生成）
export const getMinioBaseUrl = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:9000`;
};

/**
 * 将图片路径转换为完整的可访问 URL
 * 支持以下格式：
 * - 相对路径: /minio/images/xxx.jpg -> http://{hostname}:9000/images/xxx.jpg
 * - 旧格式 localhost: http://localhost:9000/images/xxx.jpg -> http://{hostname}:9000/images/xxx.jpg
 * - 旧格式 IP: http://10.x.x.x:9000/images/xxx.jpg -> http://{hostname}:9000/images/xxx.jpg
 * - 已是正确格式: 直接返回
 */
export const getImageUrl = (url) => {
  if (!url) return '';
  
  const hostname = window.location.hostname;
  const minioBase = `http://${hostname}:9000`;
  
  // 1. 相对路径格式: /minio/images/xxx.jpg
  if (url.startsWith('/minio/')) {
    // 移除 /minio 前缀，保留 /images/xxx.jpg
    const path = url.replace('/minio', '');
    return minioBase + path;
  }
  
  // 2. 旧的完整 URL 格式，替换 host 部分
  // 匹配 http://xxx:9000/images/... 格式
  const urlPattern = /^https?:\/\/[^\/]+(:9000)?\/images\//;
  if (urlPattern.test(url)) {
    // 提取 /images/xxx.jpg 部分
    const pathMatch = url.match(/\/images\/.+$/);
    if (pathMatch) {
      return minioBase + pathMatch[0];
    }
  }
  
  // 3. 其他格式，直接返回
  return url;
};

export default { getMinioBaseUrl, getImageUrl };
