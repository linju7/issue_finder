import psycopg2
from security import DB_CONFIG
import re

def delete_expanded_keyword(service_name: str, original_keyword: str, expanded_keyword: str):
    """키워드를 삭제"""
    
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
            conn.close()
            raise Exception(f"Table {table_name} does not exist")
        
        # 키워드 삭제
        delete_query = f"""
            DELETE FROM {table_name} 
            WHERE original_keyword = %s AND expanded_keyword = %s
        """
        cursor.execute(delete_query, (original_keyword, expanded_keyword))
        
        if cursor.rowcount == 0:
            conn.close()
            raise Exception("No matching keyword found to delete")
        
        conn.commit()
        conn.close()
        
        return {"message": "Keyword deleted successfully"}
        
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        raise Exception(f"Database error: {str(e)}") 