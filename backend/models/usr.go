package models

import (
	"gorm.io/gorm"
)

// User 定义用户表结构
type User struct {
	gorm.Model        // 包含 ID, CreatedAt, UpdatedAt, DeletedAt
	Username   string `gorm:"unique;not null" json:"username"`
	Email      string `gorm:"unique;not null" json:"email"`
	Password   string `json:"password"` // 存储哈希后的密码
}