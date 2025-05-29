import json
import os
from expand_keyword_map import keyword_map

def apply_keyword_expansion(title, keyword_map):
    """키워드 확장을 적용하여 제목을 변환"""
    bidirectional_map = {**keyword_map, **{v: k for k, v in keyword_map.items()}}
    for key, value in bidirectional_map.items():
        title = title.replace(key, f"{key} {value} ")  # 확장 단어 사이에 공백 추가
    return title

def expand_titles_in_json():
    """JSON 파일을 읽어와 키워드 확장을 적용하고 저장"""
    input_file = "./issue_data/plane_issue.json"
    output_file = "./issue_data/expanded_data.json"

    with open(input_file, "r", encoding="utf-8") as f:
        issues = json.load(f)

    for issue in issues:
        issue['expanded_title'] = apply_keyword_expansion(issue['title'], keyword_map)

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(issues, f, ensure_ascii=False, indent=4)

    print(f"Expanded issues have been saved to {output_file}")

if __name__ == "__main__":
    expand_titles_in_json()