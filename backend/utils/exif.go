package utils

import (
	"bytes"
	"fmt"
	"image"
	_ "image/jpeg" // 注册图片解码器
	_ "image/png"
	"log"
	"strings"
	"time"

	"github.com/dsoprea/go-exif/v3"
	exifcommon "github.com/dsoprea/go-exif/v3/common" // ⚠️ 别名修正：common -> exifcommon
)

// ExifData 定义我们需要提取的信息结构
type ExifData struct {
	CameraModel  string
	ShootingTime string
	Resolution   string
	Aperture     string
	ISO          string
}

// ExtractExif 从图片二进制数据中提取 EXIF 信息
func ExtractExif(fileData []byte) ExifData {
	// 1. 设置默认值
	data := ExifData{
		CameraModel:  "",
		ShootingTime: "",
		Resolution:   "未知",
		Aperture:     "-",
		ISO:          "-",
	}

	// 2. 获取基础分辨率
	imgConfig, _, err := image.DecodeConfig(bytes.NewReader(fileData))
	if err == nil {
		data.Resolution = fmt.Sprintf("%dx%d", imgConfig.Width, imgConfig.Height)
	}

	// 3. 尝试提取原始 EXIF 数据块
	rawExif, err := exif.SearchAndExtractExif(fileData)
	if err != nil {
		return data
	}

	// 4. 解析 EXIF 数据
	im, err := exifcommon.NewIfdMappingWithStandard() // 接收两个返回值
	if err != nil {
		log.Println("⚠️ EXIF Mapping 初始化失败:", err)
		return data
	}
	ti := exif.NewTagIndex()

	// 修正：我们忽略 Collect 返回的第一个参数 (rootIfd)，改用 index.RootIfd
	_, index, err := exif.Collect(im, ti, rawExif)
	if err != nil {
		log.Println("⚠️ EXIF 解析警告:", err)
		return data
	}

	// 使用 index.RootIfd，它的类型明确是 *Ifd
	rootIfd := index.RootIfd

	// 5. 提取具体字段

	// --- 相机型号 (位于 IFD0) ---
	if results, err := rootIfd.FindTagWithName("Model"); err == nil && len(results) > 0 {
		if val, err := results[0].Value(); err == nil {
			data.CameraModel = strings.Trim(fmt.Sprintf("%v", val), "\x00")
		}
	}

	// --- 获取 Exif 子 IFD (大多数拍摄参数在这里) ---
	// 修正：直接传递 Tag ID 0x8769 (Exif Offset) 作为路径
	exifIfd, err := rootIfd.ChildWithIfdPath(exifcommon.IfdExifStandardIfdIdentity)

	if err == nil {
		// --- 拍摄时间 ---
		if results, err := exifIfd.FindTagWithName("DateTimeOriginal"); err == nil && len(results) > 0 {
			if val, err := results[0].Value(); err == nil {
				timeStr := strings.Trim(fmt.Sprintf("%v", val), "\x00")
				if t, err := time.Parse("2006:01:02 15:04:05", timeStr); err == nil {
					data.ShootingTime = t.Format("2006-01-02 15:04:05")
				}
			}
		}

		// --- 光圈 (FNumber) ---
		if results, err := exifIfd.FindTagWithName("FNumber"); err == nil && len(results) > 0 {
			if val, err := results[0].Value(); err == nil {
				switch v := val.(type) {
				case []exifcommon.Rational:
					if len(v) > 0 && v[0].Denominator != 0 {
						f := float64(v[0].Numerator) / float64(v[0].Denominator)
						data.Aperture = fmt.Sprintf("f/%.1f", f)
					}
				}
			}
		}

		// --- ISO ---
		if results, err := exifIfd.FindTagWithName("ISOSpeedRatings"); err == nil && len(results) > 0 {
			if val, err := results[0].Value(); err == nil {
				switch v := val.(type) {
				case []uint16:
					if len(v) > 0 {
						data.ISO = fmt.Sprintf("%d", v[0])
					}
				}
			}
		} else if results, err := exifIfd.FindTagWithName("PhotographicSensitivity"); err == nil && len(results) > 0 {
			// 备选标签名 (某些相机使用这个)
			if val, err := results[0].Value(); err == nil {
				data.ISO = fmt.Sprintf("%v", val)
			}
		}
	}

	return data
}
