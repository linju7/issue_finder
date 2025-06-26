import json
import os
import psycopg2
from security import configs, DB_CONFIG

def get_keyword_map_from_db(service_name):
    """DB에서 해당 서비스의 키워드 맵을 조회"""
    try:
        connection = psycopg2.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # 해당 서비스의 키워드 맵 조회
        expand_table = f"{service_name}_expand"
        query = f"SELECT original_keyword, expanded_keyword FROM {expand_table};"
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
    """키워드 확장을 적용하여 제목을 변환 (단방향: original -> expanded)"""
    if not keyword_map:
        return title
    
    # 단방향 매핑만 사용 (original -> expanded)
    expanded_title = title
    
    for original_keyword, expanded_keyword in keyword_map.items():
        # original keyword를 만나면 "original expanded" 형태로 확장
        if original_keyword in expanded_title:
            expanded_title = expanded_title.replace(
                original_keyword, 
                f"{original_keyword} {expanded_keyword}"
            )
    
    return expanded_title

def expand_service_keywords(service_name):
    """특정 서비스의 데이터베이스에서 읽어와 키워드 확장을 적용하고 다시 저장"""
    try:
        # DB에서 해당 서비스의 키워드 맵 가져오기
        keyword_map_dict = get_keyword_map_from_db(service_name)
        if not keyword_map_dict:
            print(f"{service_name} 서비스의 키워드 맵이 DB에 없습니다. 키워드 확장을 건너뜁니다.")
            return
        
        # DB 연결
        connection = psycopg2.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # 해당 서비스 테이블에서 원본 데이터 조회
        select_query = f"SELECT link, title FROM {service_name}"
        cursor.execute(select_query)
        rows = cursor.fetchall()
        
        if not rows:
            print(f"{service_name} 서비스에 처리할 데이터가 없습니다.")
            connection.close()
            return
        
        # 키워드 확장 적용 및 데이터베이스 업데이트
        updated_count = 0
        for link, title in rows:
            expanded_title = apply_keyword_expansion(title, keyword_map_dict)
            
            # expanded_title 컬럼 업데이트
            update_query = f"""
                UPDATE {service_name} 
                SET expanded_title = %s 
                WHERE link = %s
            """
            cursor.execute(update_query, (expanded_title, link))
            updated_count += 1
        
        connection.commit()
        connection.close()
        
        print(f"{service_name} 서비스: {updated_count}개 이슈에 키워드 확장 적용 완료 (데이터베이스 업데이트)")
        
    except Exception as e:
        print(f"{service_name} 서비스 키워드 확장 중 오류: {e}")
        if 'connection' in locals():
            connection.close()

def expand_all_services_keywords():
    """모든 서비스에 대해 키워드 확장 적용"""
    for service_name in configs.keys():
        print(f"\n=== {service_name} 서비스 키워드 확장 시작 ===")
        expand_service_keywords(service_name)


if __name__ == "__main__":
    expand_all_services_keywords()