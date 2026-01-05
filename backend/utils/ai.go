package utils

import (
	"bufio"
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

const (
	// 智谱 AI 配置
	ZhipuAPIKey = "7f373589ee5340ea873da5a358d71fb7.TCLlpo4Q1c9xoH4t"
	ZhipuAPIURL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
)

// Request 结构体 (流式请求)
type ZhipuRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	Stream   bool      `json:"stream"` // 启用流式传输
}

type Message struct {
	Role    string        `json:"role"`
	Content []ContentPart `json:"content"`
}

type ContentPart struct {
	Type     string    `json:"type"`
	Text     string    `json:"text,omitempty"`
	ImageURL *ImageURL `json:"image_url,omitempty"`
}

type ImageURL struct {
	URL string `json:"url"`
}

// StreamResponse 结构体 (解析流式响应块)
type ZhipuStreamResponse struct {
	Choices []struct {
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
}

// AnalyzeImage 调用智谱GLM-4V分析图片内容
func AnalyzeImage(fileData []byte) string {
	log.Println("正在调用智谱GLM-4V分析图片...")

	// 将图片转换为Base64
	base64Str := base64.StdEncoding.EncodeToString(fileData)
	imgDataURL := fmt.Sprintf("data:image/jpeg;base64,%s", base64Str)

	// 构造请求
	requestBody := ZhipuRequest{
		Model:  "glm-4v-flash",
		Stream: true,
		Messages: []Message{
			{
				Role: "user",
				Content: []ContentPart{
					{
						Type: "image_url",
						ImageURL: &ImageURL{
							URL: imgDataURL,
						},
					},
					{
						Type: "text",
						Text: "请分析这张图片，提取唯一一个最描述画面内容的关键标签（例如：风景）。请直接返回标签，不要包含任何其他解释性文字。",
					},
				},
			},
		},
	}

	jsonData, _ := json.Marshal(requestBody)

	// 发送HTTP请求
	req, err := http.NewRequest("POST", ZhipuAPIURL, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Println("创建请求失败:", err)
		return "AI请求失败"
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+ZhipuAPIKey)

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("API连接失败:", err)
		return "网络错误"
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("智谱API错误 (%d): %s", resp.StatusCode, string(body))
		return "AI服务异常"
	}

	// 处理流式响应
	reader := bufio.NewReader(resp.Body)
	var fullContent strings.Builder

	for {
		line, err := reader.ReadBytes('\n')
		if err != nil {
			if err == io.EOF {
				break
			}
			log.Println("读取流出错:", err)
			break
		}

		lineStr := strings.TrimSpace(string(line))

		if lineStr == "" || strings.HasPrefix(lineStr, ":") {
			continue
		}

		if strings.HasPrefix(lineStr, "data: ") {
			dataContent := strings.TrimPrefix(lineStr, "data: ")

			if dataContent == "[DONE]" {
				break
			}

			var streamResp ZhipuStreamResponse
			if err := json.Unmarshal([]byte(dataContent), &streamResp); err != nil {
				continue
			}

			if len(streamResp.Choices) > 0 {
				content := streamResp.Choices[0].Delta.Content
				fullContent.WriteString(content)
			}
		}
	}

	resultTags := strings.TrimSpace(fullContent.String())

	if resultTags != "" {
		resultTags = strings.ReplaceAll(resultTags, "。", "")
		resultTags = strings.ReplaceAll(resultTags, "，", ",")
		resultTags = strings.ReplaceAll(resultTags, "<|begin_of_box|>", "")
		resultTags = strings.ReplaceAll(resultTags, "<|end_of_box|>", "")

		log.Printf("AI识别成功: %s", resultTags)
		return resultTags
	}

	return "未识别"
}
