package middlewares

import (
	"net/http"
	"strings"
	"smart-gallery-backend/utils"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 获取 Authorization Header
		tokenString := c.GetHeader("Authorization")
		
		// 2. 检查格式是否为 "Bearer <token>"
		if tokenString == "" || !strings.HasPrefix(tokenString, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未提供 Token 或格式错误"})
			c.Abort()
			return
		}

		// 3. 提取 Token 部分
		tokenString = strings.TrimPrefix(tokenString, "Bearer ")

		// 4. 解析 Token
		claims, err := utils.ParseToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token 无效或已过期"})
			c.Abort()
			return
		}

		// 5. 将解析出的 UserID 存入上下文，供后续 Controller 使用
		c.Set("userID", claims.UserID)
		c.Next()
	}
}
