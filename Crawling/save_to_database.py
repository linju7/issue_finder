import json
import os
import psycopg2
from security import DB_CONFIG, configs

def save_service_to_database(service_name):
    """특정 서비스의 원본 JSON 데이터를 해당 서비스 테이블에 저장"""
    
    # 원본 JSON 파일 경로
    json_file = f"./issue_data/{service_name}/plane_issue.json"
    
    if not os.path.exists(json_file):
        print(f"{service_name} 서비스의 원본 JSON 파일이 없습니다: {json_file}")
        print(f"먼저 save_links_to_json.py를 실행해주세요.")
        return
    
    # JSON 데이터 로드
    with open(json_file, "r", encoding="utf-8") as f:
        issues = json.load(f)
    
    if not issues:
        print(f"{service_name} 서비스에 저장할 데이터가 없습니다.")
        return
    
    # DB 연결
    connection = psycopg2.connect(**DB_CONFIG)
    cursor = connection.cursor()
    
    # UPSERT 쿼리 생성 (기존 데이터 유지하면서 새 데이터 추가/업데이트)
    insert_query = f"""
        INSERT INTO {service_name} (link, title, expanded_title)
        VALUES (%s, %s, %s)
        ON CONFLICT (link) DO UPDATE
        SET title = EXCLUDED.title,
            expanded_title = EXCLUDED.title,
            updated_at = NOW();
        """
    
    # 데이터 삽입
    inserted_count = 0
    for issue in issues:
        try:
            cursor.execute(insert_query, (
                issue['link'],
                issue['title'],  # 원본 제목
                issue['title']   # expanded_title에 임시로 원본 제목 저장 (나중에 키워드 확장에서 업데이트)
            ))
            inserted_count += 1
        except Exception as e:
            print(f"데이터 UPSERT 오류: {e}")
            continue
    
    connection.commit()
    cursor.close()
    connection.close()
    
    print(f"{service_name} 서비스: {inserted_count}개 이슈가 {service_name} 테이블에 추가/업데이트되었습니다.")

def save_all_services_to_database():
    """모든 서비스의 데이터를 각각의 테이블에 저장"""
    for service_name in configs.keys():
        print(f"\n=== {service_name} 서비스 DB 저장 시작 ===")
        save_service_to_database(service_name)

if __name__ == "__main__":
    save_all_services_to_database()