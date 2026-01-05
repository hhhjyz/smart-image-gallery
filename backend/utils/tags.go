package utils

import "strings"

// MergeTags 将逗号分隔的 tag 字符串与新增 tag 列表合并，去重后以英文逗号拼接返回。
// 兼容旧数据：忽略空白项。
func MergeTags(existing string, extra []string) string {
	seen := map[string]struct{}{}
	out := make([]string, 0)

	addOne := func(t string) {
		t = strings.TrimSpace(t)
		if t == "" {
			return
		}
		if _, ok := seen[t]; ok {
			return
		}
		seen[t] = struct{}{}
		out = append(out, t)
	}

	// existing: "a,b,c"
	for _, t := range strings.Split(existing, ",") {
		addOne(t)
	}
	for _, t := range extra {
		addOne(t)
	}

	return strings.Join(out, ",")
}
