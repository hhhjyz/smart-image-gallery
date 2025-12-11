package controllers

import (
	"bytes"
	"image"
	"image/jpeg"
	"io"
	"net/http"
	"path"
	"path/filepath"
	"smart-gallery-backend/database"
	"smart-gallery-backend/models"
	"smart-gallery-backend/utils"

	"github.com/disintegration/imaging" // 👈 引入图像处理库
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// UploadImage 处理图片上传
func UploadImage(c *gin.Context) {
	userID, _ := c.Get("userID")

	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请上传文件"})
		return
	}

	src, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "无法读取文件"})
		return
	}
	defer src.Close()

	// 读取文件内容到内存
	fileBytes, err := io.ReadAll(src)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "文件读取失败"})
		return
	}

	// 1. 异步调用 AI 分析 (可以稍微加速响应，但为了简单这里还是同步)
	aiTags := utils.AnalyzeImage(fileBytes)

	// 2. 提取 EXIF
	exifData := utils.ExtractExif(fileBytes)

	// 3. 生成文件名
	ext := filepath.Ext(fileHeader.Filename)
	uniqueId := uuid.New().String()
	originalFileName := uniqueId + ext
	thumbnailFileName := "thumb-" + uniqueId + ".jpg" // 缩略图强制存为 jpg

	// 4. 上传原图 (复用 fileHeader，需重置 seek，或者直接用 minio putobject 传 buffer)
	// 为了兼容 utils.UploadFile 的逻辑，我们这里依然传 fileHeader
	// 注意：由于 fileBytes 读完了流，我们需要让 utils 里的 UploadFile 重新打开流
	// 只要 UploadFile 内部是 file.Open()，它会得到一个新的 reader，没问题。
	originalUrl, err := utils.UploadFile(fileHeader, originalFileName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "原图上传失败"})
		return
	}

	// 5. ✨ 生成缩略图
	var thumbnailUrl string

	// 解码图片
	img, _, err := image.Decode(bytes.NewReader(fileBytes))
	if err == nil {
		// 调整大小：宽度 400px，高度自动保持比例
		// imaging.Resize 使用 Lanczos 滤镜，质量较好
		thumbImg := imaging.Resize(img, 400, 0, imaging.Lanczos)

		// 将缩略图编码为 JPEG 字节流
		buf := new(bytes.Buffer)
		err = jpeg.Encode(buf, thumbImg, &jpeg.Options{Quality: 80})

		if err == nil {
			// 上传缩略图
			thumbnailUrl, _ = utils.UploadBuffer(buf.Bytes(), thumbnailFileName, "image/jpeg")
		}
	}

	// 如果生成失败（比如不支持的格式），就用原图链接代替
	if thumbnailUrl == "" {
		thumbnailUrl = originalUrl
	}

	// 6. 存入数据库
	imageModel := models.Image{
		UserID:       userID.(uint),
		FileName:     fileHeader.Filename,
		Url:          originalUrl,
		ThumbnailUrl: thumbnailUrl, // ✨ 保存缩略图链接
		Tags:         aiTags,
		CameraModel:  exifData.CameraModel,
		ShootingTime: exifData.ShootingTime,
		Resolution:   exifData.Resolution,
		Aperture:     exifData.Aperture,
		ISO:          exifData.ISO,
	}

	if err := database.DB.Create(&imageModel).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库保存失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "上传成功",
		"image":   imageModel,
	})
}

// GetImages 保持不变
func GetImages(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	searchQuery := c.Query("q")
	var images []models.Image
	db := database.DB.Where("user_id = ?", userID)
	if searchQuery != "" {
		likeQuery := "%" + searchQuery + "%"
		db = db.Where("file_name LIKE ? OR tags LIKE ?", likeQuery, likeQuery)
	}
	// GORM 会自动查询所有字段，包括 ThumbnailUrl
	result := db.Order("created_at desc").Find(&images)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": images})
}

// UpdateImageTags 保持不变
func UpdateImageTags(c *gin.Context) {
	// ... (代码内容同前，省略以节省空间) ...
	// 您之前的代码逻辑完全正确，这里不需要改动
	// 只需要保留函数定义即可
	userID, _ := c.Get("userID")
	imageID := c.Param("id")
	type UpdateTagsInput struct {
		Tags string `json:"tags"`
	}
	var input UpdateTagsInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}
	var image models.Image
	if err := database.DB.Where("id = ? AND user_id = ?", imageID, userID).First(&image).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "图片不存在"})
		return
	}
	image.Tags = input.Tags
	database.DB.Save(&image)
	c.JSON(http.StatusOK, gin.H{"message": "更新成功", "image": image})
}

// DeleteImage 保持不变
func DeleteImage(c *gin.Context) {
	userID, _ := c.Get("userID")
	imageID := c.Param("id")
	var image models.Image
	if err := database.DB.Where("id = ? AND user_id = ?", imageID, userID).First(&image).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "图片不存在"})
		return
	}

	// 删除原图
	utils.RemoveFile(path.Base(image.Url))
	// 删除缩略图 (如果有且不等于原图)
	if image.ThumbnailUrl != "" && image.ThumbnailUrl != image.Url {
		utils.RemoveFile(path.Base(image.ThumbnailUrl))
	}

	database.DB.Delete(&image)
	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}
