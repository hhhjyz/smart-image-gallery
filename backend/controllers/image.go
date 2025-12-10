package controllers

import (
	"io"
	"net/http"
	"path"
	"path/filepath"
	"smart-gallery-backend/database"
	"smart-gallery-backend/models"
	"smart-gallery-backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// UploadImage 处理图片上传
func UploadImage(c *gin.Context) {
	userID, _ := c.Get("userID")

	// 1. 获取上传的文件 Header
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请上传文件"})
		return
	}

	// 2. 打开文件流
	src, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "无法读取文件"})
		return
	}
	defer src.Close()

	// 3. ✨ 关键步骤：读取文件内容到内存
	// 因为流只能读一次，我们要把它读出来，分别发给 AI 和 MinIO
	fileBytes, err := io.ReadAll(src)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "文件读取失败"})
		return
	}

	// 4. ✨ 调用智谱 AI 进行分析 (传入二进制数据)
	// 注意：这里是同步调用，可能会让前端等待几秒钟
	aiTags := utils.AnalyzeImage(fileBytes)

	// 5. 上传到 MinIO
	// 生成唯一文件名
	ext := filepath.Ext(fileHeader.Filename)
	newFileName := uuid.New().String() + ext

	// 由于 src 已经被读完了，我们需要用 fileBytes 重新创建一个 Reader 给 MinIO 用
	// 这里我们需要稍微修改一下 utils.UploadFile 的调用方式，或者我们在这里直接处理 MinIO 上传逻辑
	// 为了保持 utils 封装，我们还是把“流”重置一下比较好，但 multipart.File 不一定支持 Seek。
	// 所以最稳妥的方法是：直接用 MinIO Client 的 PutObject 上传 byte reader。

	// 这里我们做一个小小的 hack，直接调用 utils 里的变量，或者复用 upload 逻辑
	// 为了不破坏 utils/minio.go 的结构，我们用最简单的方法：
	// 让 utils.UploadFile 能够接受一个重新构造的 header (比较麻烦)
	// 或者 -> 我们直接在这里调用 MinIO SDK 上传（如果你不介意逻辑写在这里）

	// *更好的方案*：为了配合你现在的 utils.UploadFile 签名 (它接收 *multipart.FileHeader)
	// 我们其实很难在不修改 utils 的情况下传入内存数据。
	// 所以，最简单的做法是：**不要在 Controller 里读完流**，而是让 utils.UploadFile 帮我们读，或者修改 utils。

	// 鉴于目前是教学项目，我们采用 **"重置 Seek"** 的方法（如果是磁盘文件支持 Seek）
	// 如果 src 支持 Seek (通常临时文件支持)，我们可以回退指针
	if seeker, ok := src.(io.Seeker); ok {
		seeker.Seek(0, 0) // 回到文件开头
	} else {
		// 如果不支持 Seek，这是一个潜在风险。但在 Gin 默认配置下，小文件是内存流，大文件是临时文件，通常都支持。
	}

	// 调用 MinIO 上传
	url, err := utils.UploadFile(fileHeader, newFileName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "MinIO 上传失败: " + err.Error()})
		return
	}

	// 6. 存入数据库
	image := models.Image{
		UserID:   userID.(uint),
		FileName: fileHeader.Filename,
		Url:      url,
		Tags:     aiTags, // 保存 AI 识别的标签
	}

	if err := database.DB.Create(&image).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库保存失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "上传成功",
		"image":   image,
	})
}

// GetImages 保持不变
func GetImages(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	var images []models.Image
	result := database.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&images)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取图片列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": images,
	})
}

// DeleteImage 保持不变
func DeleteImage(c *gin.Context) {
	userID, _ := c.Get("userID")
	imageID := c.Param("id")

	var image models.Image

	if err := database.DB.Where("id = ? AND user_id = ?", imageID, userID).First(&image).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "图片不存在或无权删除"})
		return
	}

	objectName := path.Base(image.Url)

	if err := utils.RemoveFile(objectName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "文件删除失败"})
		return
	}

	database.DB.Delete(&image)

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}
