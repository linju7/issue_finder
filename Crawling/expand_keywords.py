import json
import os
import psycopg2
from security import configs, DB_password

def get_keyword_map_from_db():
    """DB에서 키워드 맵을 조회"""
    try:
        connection = psycopg2.connect(
            dbname="test",
            user="junil",
            password=DB_password,
            host="localhost",
            port="5432"
        )
        cursor = connection.cursor()
        
        # 키워드 맵 조회 (service_name 컬럼 제거됨)
        query = "SELECT original_keyword, expanded_keyword FROM contact_expand;"
        cursor.execute(query)
        rows = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        # 딕셔너리로 변환
        keyword_map = {}
        for original, expanded in rows:
            keyword_map[original] = expanded
        
        return keyword_map
        
    except Exception as e:
        print(f"DB에서 키워드 맵 조회 오류: {e}")
        return {}

def apply_keyword_expansion(title, keyword_map):
    """키워드 확장을 적용하여 제목을 변환"""
    if not keyword_map:
        return title
        
    # 양방향 매핑 생성 (original->expanded, expanded->original)
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
    
    # DB에서 공통 키워드 맵 가져오기
    keyword_map_dict = get_keyword_map_from_db()
    if not keyword_map_dict:
        print(f"키워드 맵이 DB에 없습니다.")
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
        expanded_issue['expanded_title'] = apply_keyword_expansion(issue['title'], keyword_map_dict)
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