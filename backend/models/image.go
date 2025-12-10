package models

import "gorm.io/gorm"

type Image struct {
	gorm.Model
	UserID   uint   `json:"user_id"`   // 外键：属于哪个用户
	FileName string `json:"file_name"` // 原始文件名
	Url      string `json:"url"`       // MinIO 访问链接
	Tags     string `json:"tags"`      // 可选：图片标签，逗号分隔
}
