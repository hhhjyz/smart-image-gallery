package database

import (
	"fmt"
	"log"
	"os"
	"smart-gallery-backend/models" // 引用下面的 models 包

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

// getEnv 返回环境变量或默认值
func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func Connect() {
	// 从环境变量读取数据库连接配置，保留兼容的默认值
	user := getEnv("DB_USER", "root")
	password := getEnv("DB_PASSWORD", "rootpassword")
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "3306")
	name := getEnv("DB_NAME", "smart_gallery")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", user, password, host, port, name)

	connection, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("无法连接数据库:", err)
	}

	fmt.Println("✅ 成功连接到 MySQL 数据库!")

	// 自动迁移模式：自动创建或更新数据库表结构
	// 这里注册所有的 Model
	err = connection.AutoMigrate(&models.User{}, &models.Image{})
	if err != nil {
		log.Fatal("数据库迁移失败:", err)
	}

	DB = connection
}
