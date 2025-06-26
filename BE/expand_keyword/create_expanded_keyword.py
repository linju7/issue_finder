import psycopg2
from security import DB_CONFIG
import re

def create_expanded_keyword(service_name: str, original_keyword: str, expanded_keyword: str):
    """새로운 확장 키워드를 추가"""
    
    # 서비스명 검증 (SQL 인젝션 방지)
    if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', service_name):
        raise ValueError("Invalid service name format")
    
    table_name = f"{service_name}_expand"
    
    try:
        # PostgreSQL 연결
        conn = psycopg2.connect(**DB_CONFIG)
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
            # 테이블이 존재하지 않으면 생성
            create_table_query = f"""
                CREATE TABLE {table_name} (
                    id SERIAL PRIMARY KEY,
                    original_keyword VARCHAR(255) NOT NULL,
                    expanded_keyword VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """
            cursor.execute(create_table_query)
        
        # 중복 키워드 체크
        check_query = f"""
            SELECT COUNT(*) FROM {table_name} 
            WHERE original_keyword = %s AND expanded_keyword = %s
        """
        cursor.execute(check_query, (original_keyword, expanded_keyword))
        if cursor.fetchone()[0] > 0:
            conn.close()
            raise Exception("Keyword pair already exists")
        
        # 키워드 추가
        insert_query = f"""
            INSERT INTO {table_name} (original_keyword, expanded_keyword) 
            VALUES (%s, %s)
        """
        cursor.execute(insert_query, (original_keyword, expanded_keyword))
        
        conn.commit()
        conn.close()
        
        return {"message": "Keyword created successfully"}
        
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        raise Exception(f"Database error: {str(e)}") 