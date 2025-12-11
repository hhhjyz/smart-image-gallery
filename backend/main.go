package main

import (
	"smart-gallery-backend/controllers"
	"smart-gallery-backend/database"
	"smart-gallery-backend/middlewares" // 引入中间件包
	"smart-gallery-backend/utils"       // 引入工具包 (MinIO)

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. 初始化数据库连接
	database.Connect()

	// 2. 初始化 MinIO 连接 (新增)
	utils.InitMinio()

	// 3. 设置 Gin 路由
	r := gin.Default()

	// CORS 配置：允许跨域请求
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		// 注意：这里必须把 Authorization 加入允许的 Header，否则前端带 Token 的请求会被浏览器拦截
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// 4. 公开路由组 (不需要登录)
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", controllers.Register)
		auth.POST("/login", controllers.Login)
	}

	// 5. 受保护路由组 (需要登录) (新增)
	// 所有 /api 下（除了 auth）的请求都会经过 AuthMiddleware
	protected := r.Group("/api")
	protected.Use(middlewares.AuthMiddleware())
	{
		// 图片上传接口
		protected.POST("/images/upload", controllers.UploadImage)

		protected.GET("/images", controllers.GetImages)

		protected.DELETE("/images/:id", controllers.DeleteImage)

		protected.PUT("/images/:id/tags", controllers.UpdateImageTags)
	}

	// 6. 启动服务
	r.Run(":8080")
}
