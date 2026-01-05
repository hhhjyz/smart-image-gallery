FROM node:22-alpine AS deps
WORKDIR /app
# 配置 npm 镜像（国内加速）
RUN npm config set registry https://registry.npmmirror.com
COPY package.json package-lock.json* ./
RUN npm ci || npm install

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5173
# Run vite in dev mode and bind to all interfaces so container is accessible
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
