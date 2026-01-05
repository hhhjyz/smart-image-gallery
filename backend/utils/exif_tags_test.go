package utils

import (
	"strings"
	"testing"
)

func TestExifTagsFromData_FullExif(t *testing.T) {
	exif := ExifData{
		CameraModel:  "iPhone 14 Pro",
		ShootingTime: "2024-08-15 14:30:00",
		Resolution:   "4032x3024",
		Aperture:     "f/1.8",
		ISO:          "100",
	}
	tags := ExifTagsFromData(exif)

	// 期望包含的标签
	expected := []string{
		"相机:iPhone 14 Pro",
		"时间:下午",
		"月份:8",
		"季节:夏",
		"方向:横图",
		"分辨率:高",
	}

	for _, e := range expected {
		found := false
		for _, tag := range tags {
			if tag == e {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("期望标签 %q 未找到，实际标签: %v", e, tags)
		}
	}
}

func TestExifTagsFromData_PartialExif(t *testing.T) {
	// 只有分辨率，无相机/时间
	exif := ExifData{
		CameraModel:  "",
		ShootingTime: "",
		Resolution:   "1920x1080",
	}
	tags := ExifTagsFromData(exif)

	// 应该有方向和分辨率标签
	hasOrientation := false
	hasResolution := false
	for _, tag := range tags {
		if strings.HasPrefix(tag, "方向:") {
			hasOrientation = true
		}
		if strings.HasPrefix(tag, "分辨率:") {
			hasResolution = true
		}
	}

	if !hasOrientation {
		t.Errorf("缺少方向标签，实际: %v", tags)
	}
	if !hasResolution {
		t.Errorf("缺少分辨率标签，实际: %v", tags)
	}

	// 不应该有相机/时间标签
	for _, tag := range tags {
		if strings.HasPrefix(tag, "相机:") {
			t.Errorf("不应有相机标签，实际: %v", tags)
		}
	}
}

func TestExifTagsFromData_NoExif(t *testing.T) {
	exif := ExifData{
		Resolution: "未知",
	}
	tags := ExifTagsFromData(exif)

	// 应该返回空列表
	if len(tags) != 0 {
		t.Errorf("无 EXIF 时应返回空标签，实际: %v", tags)
	}
}

func TestExifTagsFromData_NightTime(t *testing.T) {
	exif := ExifData{
		ShootingTime: "2024-12-25 23:30:00",
		Resolution:   "800x600",
	}
	tags := ExifTagsFromData(exif)

	hasNight := false
	hasWinter := false
	for _, tag := range tags {
		if tag == "时间:夜晚" {
			hasNight = true
		}
		if tag == "季节:冬" {
			hasWinter = true
		}
	}

	if !hasNight {
		t.Errorf("期望有夜晚标签，实际: %v", tags)
	}
	if !hasWinter {
		t.Errorf("期望有冬季标签，实际: %v", tags)
	}
}

func TestMergeTags(t *testing.T) {
	existing := "风景,人物"
	extra := []string{"相机:iPhone", "风景", "方向:横图"}

	result := MergeTags(existing, extra)

	// 应该去重
	parts := strings.Split(result, ",")
	if len(parts) != 4 {
		t.Errorf("期望4个标签，实际: %d (%s)", len(parts), result)
	}

	// 检查包含所有预期标签
	expected := map[string]bool{"风景": true, "人物": true, "相机:iPhone": true, "方向:横图": true}
	for _, p := range parts {
		if !expected[p] {
			t.Errorf("意外标签: %s", p)
		}
	}
}
