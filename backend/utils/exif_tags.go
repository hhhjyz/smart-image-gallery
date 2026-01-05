package utils

import (
	"strconv"
	"strings"
	"time"
)

// ExifTagsFromData 根据EXIF数据生成检索标签
func ExifTagsFromData(exif ExifData) []string {
	var tags []string

	if model := strings.TrimSpace(exif.CameraModel); model != "" {
		tags = append(tags, "相机:"+model)
	}

	if exif.ShootingTime != "" {
		if t, err := time.Parse("2006-01-02 15:04:05", exif.ShootingTime); err == nil {
			h := t.Hour()
			tags = append(tags, "时间:"+timeBucket(h))
			tags = append(tags, "月份:"+strconv.Itoa(int(t.Month())))
			tags = append(tags, "季节:"+seasonBucket(int(t.Month())))
		}
	}

	w, h := parseResolution(exif.Resolution)
	if w > 0 && h > 0 {
		switch {
		case w > h:
			tags = append(tags, "方向:横图")
		case h > w:
			tags = append(tags, "方向:竖图")
		default:
			tags = append(tags, "方向:方图")
		}

		pixels := int64(w) * int64(h)
		switch {
		case pixels >= 8000000:
			tags = append(tags, "分辨率:高")
		case pixels >= 2000000:
			tags = append(tags, "分辨率:中")
		default:
			tags = append(tags, "分辨率:低")
		}
	}

	return uniqueNonEmpty(tags)
}

func timeBucket(hour int) string {
	switch {
	case hour >= 5 && hour < 8:
		return "清晨"
	case hour >= 8 && hour < 11:
		return "上午"
	case hour >= 11 && hour < 13:
		return "中午"
	case hour >= 13 && hour < 18:
		return "下午"
	case hour >= 18 && hour < 21:
		return "傍晚"
	default:
		return "夜晚"
	}
}

func seasonBucket(month int) string {
	switch month {
	case 3, 4, 5:
		return "春"
	case 6, 7, 8:
		return "夏"
	case 9, 10, 11:
		return "秋"
	default:
		return "冬"
	}
}

func parseResolution(res string) (int, int) {
	r := strings.TrimSpace(res)
	if r == "" || r == "未知" {
		return 0, 0
	}
	parts := strings.Split(r, "x")
	if len(parts) != 2 {
		return 0, 0
	}
	w, err1 := strconv.Atoi(strings.TrimSpace(parts[0]))
	h, err2 := strconv.Atoi(strings.TrimSpace(parts[1]))
	if err1 != nil || err2 != nil {
		return 0, 0
	}
	return w, h
}

func uniqueNonEmpty(in []string) []string {
	seen := map[string]struct{}{}
	out := make([]string, 0, len(in))
	for _, t := range in {
		t = strings.TrimSpace(t)
		if t == "" {
			continue
		}
		if _, ok := seen[t]; ok {
			continue
		}
		seen[t] = struct{}{}
		out = append(out, t)
	}
	return out
}
