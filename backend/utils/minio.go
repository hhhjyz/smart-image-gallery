package utils

import (
	"bytes"
	"context"
	"log"
	"mime/multipart"
	"os"
	"strconv"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var MinioClient *minio.Client
var BucketName = "images" // 默认 Bucket 名称

// InitMinio 从环境变量读取配置并初始化 MinIO 客户端
func InitMinio() {
	endpoint := getEnv("MINIO_ENDPOINT", "localhost:9000")
	accessKeyID := getEnv("MINIO_ACCESS_KEY", "admin")
	secretAccessKey := getEnv("MINIO_SECRET_KEY", "password123")
	useSSLStr := getEnv("MINIO_USE_SSL", "false")
	bucket := getEnv("MINIO_BUCKET", "images")

	useSSL, _ := strconv.ParseBool(useSSLStr)

	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		log.Fatalln("MinIO 连接失败:", err)
	}

	log.Println("成功连接到 MinIO")
	MinioClient = client
	BucketName = bucket
}

// UploadFile 上传文件到 MinIO
// 返回值: (上传后的相对路径, 错误)
func UploadFile(file *multipart.FileHeader, objectName string) (string, error) {
	ctx := context.Background()
	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	// 上传文件
	_, err = MinioClient.PutObject(ctx, BucketName, objectName, src, file.Size, minio.PutObjectOptions{
		ContentType: file.Header.Get("Content-Type"),
	})
	if err != nil {
		return "", err
	}

	// 返回相对路径，前端会根据当前 hostname 动态拼接完整 URL
	// 格式: /minio/images/xxx.jpg
	relativePath := "/minio/" + BucketName + "/" + objectName
	return relativePath, nil
}

func RemoveFile(objectName string) error {
	ctx := context.Background()
	// 调用 MinIO SDK 删除对象
	return MinioClient.RemoveObject(ctx, BucketName, objectName, minio.RemoveObjectOptions{})
}

func UploadBuffer(data []byte, objectName string, contentType string) (string, error) {
	ctx := context.Background()
	reader := bytes.NewReader(data)

	_, err := MinioClient.PutObject(ctx, BucketName, objectName, reader, int64(len(data)), minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", err
	}

	// 返回相对路径
	relativePath := "/minio/" + BucketName + "/" + objectName
	return relativePath, nil
}

// getEnv helper
func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
