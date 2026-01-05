package models

import "gorm.io/gorm"

type Image struct {
	gorm.Model
	UserID       uint   `json:"user_id"`
	FileName     string `json:"file_name"`
	Url          string `json:"url"`
	Tags         string `json:"tags"` // AI 标签
	ThumbnailUrl string `json:"thumbnail_url"`
	// EXIF信息字段
	CameraModel  string `json:"camera_model"`
	ShootingTime string `json:"shooting_time"`
	Resolution   string `json:"resolution"`
	Aperture     string `json:"aperture"`
	ISO          string `json:"iso"`
}
