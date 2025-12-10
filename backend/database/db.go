package database

import (
	"fmt"
	"log"
	"smart-gallery-backend/models" // 引用下面的 models 包

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	// 连接本地的 Docker MySQL (端口 3306)
	// 用户名: root, 密码: rootpassword, 库名: smart_gallery
	dsn := "root:rootpassword@tcp(localhost:3306)/smart_gallery?charset=utf8mb4&parseTime=True&loc=Local"

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
