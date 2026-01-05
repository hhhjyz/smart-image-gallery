package utils

import (
	"bytes"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"log"
	"strings"
	"time"

	"github.com/dsoprea/go-exif/v3"
	exifcommon "github.com/dsoprea/go-exif/v3/common"
)

// ExifData 定义我们需要提取的信息结构
type ExifData struct {
	CameraModel  string
	ShootingTime string
	Resolution   string
	Aperture     string
	ISO          string
}

// ExtractExif 从图片二进制数据中提取EXIF信息
func ExtractExif(fileData []byte) ExifData {
	data := ExifData{
		CameraModel:  "",
		ShootingTime: "",
		Resolution:   "未知",
		Aperture:     "-",
		ISO:          "-",
	}

	imgConfig, _, err := image.DecodeConfig(bytes.NewReader(fileData))
	if err == nil {
		data.Resolution = fmt.Sprintf("%dx%d", imgConfig.Width, imgConfig.Height)
	}

	rawExif, err := exif.SearchAndExtractExif(fileData)
	if err != nil {
		return data
	}

	im, err := exifcommon.NewIfdMappingWithStandard()
	if err != nil {
		log.Println("EXIF Mapping初始化失败:", err)
		return data
	}
	ti := exif.NewTagIndex()

	_, index, err := exif.Collect(im, ti, rawExif)
	if err != nil {
		log.Println("EXIF解析警告:", err)
		return data
	}

	rootIfd := index.RootIfd

	// 相机型号
	if results, err := rootIfd.FindTagWithName("Model"); err == nil && len(results) > 0 {
		if val, err := results[0].Value(); err == nil {
			data.CameraModel = strings.Trim(fmt.Sprintf("%v", val), "\x00")
		}
	}

	// 获取Exif子IFD
	exifIfd, err := rootIfd.ChildWithIfdPath(exifcommon.IfdExifStandardIfdIdentity)

	if err == nil {
		// 拍摄时间
		if results, err := exifIfd.FindTagWithName("DateTimeOriginal"); err == nil && len(results) > 0 {
			if val, err := results[0].Value(); err == nil {
				timeStr := strings.Trim(fmt.Sprintf("%v", val), "\x00")
				if t, err := time.Parse("2006:01:02 15:04:05", timeStr); err == nil {
					data.ShootingTime = t.Format("2006-01-02 15:04:05")
				}
			}
		}

		// 光圈
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

		// ISO
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
			if val, err := results[0].Value(); err == nil {
				data.ISO = fmt.Sprintf("%v", val)
			}
		}
	}

	return data
}
