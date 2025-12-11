package models

import "gorm.io/gorm"

type Image struct {
	gorm.Model
	UserID       uint   `json:"user_id"`
	FileName     string `json:"file_name"`
	Url          string `json:"url"`
	Tags         string `json:"tags"` // AI 标签
	ThumbnailUrl string `json:"thumbnail_url"`
	// ✨ 新增：EXIF 信息字段
	CameraModel  string `json:"camera_model"`  // 相机型号
	ShootingTime string `json:"shooting_time"` // 拍摄时间
	Resolution   string `json:"resolution"`    // 分辨率 (例如 1920x1080)
	Aperture     string `json:"aperture"`      // 光圈 (例如 f/2.8)
	ISO          string `json:"iso"`           // 感光度
}
