import psycopg2
from security import DB_password
import re

def retrieve_expanded_keyword(service_name: str):
    """서비스명에 해당하는 확장 키워드들을 조회"""
    
    # 서비스명 검증 (SQL 인젝션 방지)
    if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', service_name):
        raise ValueError("Invalid service name format")
    
    table_name = f"{service_name}_expand"
    
    try:
        # PostgreSQL 연결
        conn = psycopg2.connect(
            dbname="test",
            user="junil",
            password=DB_password,
            host="localhost",
            port="5432"
        )
        cursor = conn.cursor()
        
        # 테이블 존재 여부 확인
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = %s
            );
        """, (table_name,))
        
        table_exists = cursor.fetchone()[0]
        if not table_exists:
            # 테이블이 존재하지 않으면 빈 리스트 반환
            conn.close()
            return []
        
        # 확장 키워드 조회 (테이블명은 검증된 후 직접 삽입)
        query = f"SELECT original_keyword, expanded_keyword FROM {table_name}"
        cursor.execute(query)
        rows = cursor.fetchall()
        conn.close()
        
        # 결과를 딕셔너리 리스트로 변환
        keywords = []
        for row in rows:
            keywords.append({
                "original": row[0],
                "expanded": row[1]
            })
        
        return keywords
        
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        raise Exception(f"Database error: {str(e)}")