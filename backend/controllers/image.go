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

	"github.com/disintegration/imaging"
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

	// 读取文件内容
	fileBytes, err := io.ReadAll(src)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "文件读取失败"})
		return
	}

	// AI分析图片
	aiTags := utils.AnalyzeImage(fileBytes)

	// 提取EXIF信息
	exifData := utils.ExtractExif(fileBytes)

	// 基于EXIF生成检索标签
	exifTags := utils.ExifTagsFromData(exifData)
	mergedTags := utils.MergeTags(aiTags, exifTags)

	// 生成文件名
	ext := filepath.Ext(fileHeader.Filename)
	uniqueId := uuid.New().String()
	originalFileName := uniqueId + ext
	thumbnailFileName := "thumb-" + uniqueId + ".jpg"

	// 上传原图
	originalUrl, err := utils.UploadFile(fileHeader, originalFileName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "原图上传失败"})
		return
	}

	// 生成缩略图
	var thumbnailUrl string

	img, _, err := image.Decode(bytes.NewReader(fileBytes))
	if err == nil {
		thumbImg := imaging.Resize(img, 400, 0, imaging.Lanczos)
		buf := new(bytes.Buffer)
		err = jpeg.Encode(buf, thumbImg, &jpeg.Options{Quality: 80})
		if err == nil {
			thumbnailUrl, _ = utils.UploadBuffer(buf.Bytes(), thumbnailFileName, "image/jpeg")
		}
	}

	if thumbnailUrl == "" {
		thumbnailUrl = originalUrl
	}

	// 存入数据库
	imageModel := models.Image{
		UserID:       userID.(uint),
		FileName:     fileHeader.Filename,
		Url:          originalUrl,
		ThumbnailUrl: thumbnailUrl,
		Tags:         mergedTags,
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

// GetImages 获取用户图片列表
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
	result := db.Order("created_at desc").Find(&images)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": images})
}

// UpdateImageTags 更新图片标签
func UpdateImageTags(c *gin.Context) {
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

// DeleteImage 删除图片
func DeleteImage(c *gin.Context) {
	userID, _ := c.Get("userID")
	imageID := c.Param("id")
	var image models.Image
	if err := database.DB.Where("id = ? AND user_id = ?", imageID, userID).First(&image).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "图片不存在"})
		return
	}

	// 删除MinIO中的文件
	utils.RemoveFile(path.Base(image.Url))
	if image.ThumbnailUrl != "" && image.ThumbnailUrl != image.Url {
		utils.RemoveFile(path.Base(image.ThumbnailUrl))
	}

	database.DB.Delete(&image)
	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

// GetAllImagesPublic 获取所有图片（公开接口）
func GetAllImagesPublic(c *gin.Context) {
	searchQuery := c.Query("q")
	var images []models.Image

	db := database.DB.Model(&models.Image{})
	if searchQuery != "" {
		likeQuery := "%" + searchQuery + "%"
		db = db.Where("file_name LIKE ? OR tags LIKE ? OR camera_model LIKE ?", likeQuery, likeQuery, likeQuery)
	}

	result := db.Order("created_at desc").Find(&images)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": images})
}

// GetGalleryStats 获取图库统计信息
func GetGalleryStats(c *gin.Context) {
	var totalCount int64
	database.DB.Model(&models.Image{}).Count(&totalCount)

	var images []models.Image
	database.DB.Find(&images)

	tagCount := make(map[string]int)
	cameraCount := make(map[string]int)

	for _, img := range images {
		if img.Tags != "" {
			tags := splitTags(img.Tags)
			for _, tag := range tags {
				if tag != "" {
					tagCount[tag]++
				}
			}
		}
		if img.CameraModel != "" {
			cameraCount[img.CameraModel]++
		}
	}

	// 转换为切片并排序
	type TagStat struct {
		Tag   string `json:"tag"`
		Count int    `json:"count"`
	}
	var topTags []TagStat
	for tag, count := range tagCount {
		topTags = append(topTags, TagStat{Tag: tag, Count: count})
	}
	for i := 0; i < len(topTags); i++ {
		for j := i + 1; j < len(topTags); j++ {
			if topTags[j].Count > topTags[i].Count {
				topTags[i], topTags[j] = topTags[j], topTags[i]
			}
		}
	}
	if len(topTags) > 10 {
		topTags = topTags[:10]
	}

	c.JSON(http.StatusOK, gin.H{
		"total_images": totalCount,
		"top_tags":     topTags,
		"cameras":      cameraCount,
	})
}

// splitTags 分割标签字符串
func splitTags(tags string) []string {
	var result []string
	current := ""
	for _, ch := range tags {
		if ch == ',' || ch == '，' {
			if current != "" {
				result = append(result, current)
				current = ""
			}
		} else {
			current += string(ch)
		}
	}
	if current != "" {
		result = append(result, current)
	}
	return result
}
