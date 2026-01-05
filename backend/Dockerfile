FROM golang:1.24-alpine AS build
WORKDIR /src

# Install git for module downloads if needed
RUN apk add --no-cache git

# 配置 Go 模块代理（国内加速）
ENV GOPROXY=https://goproxy.cn,direct
# 允许自动下载更新的 Go 工具链
ENV GOTOOLCHAIN=auto

# Copy go.mod/go.sum first for caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /app/main ./

FROM alpine:3.18
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /app/main .

EXPOSE 8080
CMD ["./main"]
