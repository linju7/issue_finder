import json
import os
from expand_keyword_map import keyword_map
from security import configs

def apply_keyword_expansion(title, keyword_map):
    """키워드 확장을 적용하여 제목을 변환"""
    bidirectional_map = {**keyword_map, **{v: k for k, v in keyword_map.items()}}
    for key, value in bidirectional_map.items():
        title = title.replace(key, f"{key} {value} ")  # 확장 단어 사이에 공백 추가
    return title

def expand_service_keywords(service_name):
    """특정 서비스의 JSON 파일에 키워드 확장을 적용하고 별도 파일로 저장"""
    json_file = f"./issue_data/{service_name}/plane_issue.json"
    output_file = f"./issue_data/{service_name}/expanded_issue.json"
    
    if not os.path.exists(json_file):
        print(f"{service_name} 서비스의 JSON 파일이 없습니다: {json_file}")
        return
    
    # 서비스별 키워드 맵 가져오기
    service_keyword_map = keyword_map.get(service_name, {})
    if not service_keyword_map:
        print(f"{service_name} 서비스의 키워드 맵이 없습니다.")
        return
    
    with open(json_file, "r", encoding="utf-8") as f:
        issues = json.load(f)
    
    if not issues:
        print(f"{service_name} 서비스에 처리할 데이터가 없습니다.")
        return
    
    # 키워드 확장 적용
    expanded_issues = []
    for issue in issues:
        expanded_issue = issue.copy()  # 원본 데이터 복사
        expanded_issue['expanded_title'] = apply_keyword_expansion(issue['title'], service_keyword_map)
        expanded_issues.append(expanded_issue)
    
    # expanded_issue.json 파일로 저장
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(expanded_issues, f, ensure_ascii=False, indent=4)
    
    print(f"{service_name} 서비스: {len(expanded_issues)}개 이슈에 키워드 확장 적용 완료 → {output_file}")

def expand_all_services_keywords():
    """모든 서비스에 대해 키워드 확장 적용"""
    for service_name in configs.keys():
        print(f"\n=== {service_name} 서비스 키워드 확장 시작 ===")
        expand_service_keywords(service_name)

if __name__ == "__main__":
    expand_all_services_keywords()