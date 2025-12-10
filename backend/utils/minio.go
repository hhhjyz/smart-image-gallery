package utils

import (
	"context"
	"log"
	"mime/multipart"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var MinioClient *minio.Client
var BucketName = "images" // 必须和你之前在浏览器里创建的 Bucket 名字一致

func InitMinio() {
	endpoint := "localhost:9000"
	accessKeyID := "admin"
	secretAccessKey := "password123"
	useSSL := false

	// 初始化 MinIO 客户端
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		log.Fatalln("MinIO 连接失败:", err)
	}

	log.Println("✅ 成功连接到 MinIO!")
	MinioClient = client
}

// UploadFile 上传文件到 MinIO
// 返回值: (上传后的访问URL, 错误)
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

	// 拼接访问 URL (开发环境直接拼接 localhost)
	// 注意：这里假设 Bucket 设为了 public
	url := "http://localhost:9000/" + BucketName + "/" + objectName
	return url, nil
}

func RemoveFile(objectName string) error {
	ctx := context.Background()
	// 调用 MinIO SDK 删除对象
	return MinioClient.RemoveObject(ctx, BucketName, objectName, minio.RemoveObjectOptions{})
}
