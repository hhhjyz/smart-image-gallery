package main

import (
	"smart-gallery-backend/controllers"
	"smart-gallery-backend/database"
	"smart-gallery-backend/middlewares"
	"smart-gallery-backend/utils"

	"github.com/gin-gonic/gin"
)

func main() {
	database.Connect()
	utils.InitMinio()

	r := gin.Default()

	// CORS配置
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// 公开路由
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", controllers.Register)
		auth.POST("/login", controllers.Login)
	}

	// MCP公开接口
	mcp := r.Group("/api/mcp")
	{
		mcp.GET("/images", controllers.GetAllImagesPublic)
		mcp.GET("/stats", controllers.GetGalleryStats)
	}

	// 受保护路由
	protected := r.Group("/api")
	protected.Use(middlewares.AuthMiddleware())
	{
		protected.POST("/images/upload", controllers.UploadImage)
		protected.GET("/images", controllers.GetImages)
		protected.DELETE("/images/:id", controllers.DeleteImage)
		protected.PUT("/images/:id/tags", controllers.UpdateImageTags)
	}

	r.Run(":8080")
}
