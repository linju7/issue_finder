import psycopg2
from expand_keyword_map import keyword_map
from security import DB_password

def create_keyword_table():
    """키워드 확장 테이블 생성"""
    try:
        connection = psycopg2.connect(
            dbname="test",
            user="junil",
            password=DB_password,
            host="localhost",
            port="5432"
        )
        cursor = connection.cursor()
        
        # 테이블 생성 SQL
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS contact_expand (
            original_keyword VARCHAR(100) NOT NULL,
            expanded_keyword VARCHAR(100) NOT NULL,
            PRIMARY KEY (original_keyword, expanded_keyword)
        );
        """
        
        cursor.execute(create_table_sql)
        
        # 인덱스 생성
        index_sqls = [
            "CREATE INDEX IF NOT EXISTS idx_contact_expand_original ON contact_expand(original_keyword);"
        ]
        
        for sql in index_sqls:
            cursor.execute(sql)
        
        connection.commit()
        cursor.close()
        connection.close()
        
        print("✅ contact_expand 테이블 생성 완료!")
        return True
        
    except Exception as e:
        print(f"❌ 테이블 생성 오류: {e}")
        return False

def insert_keyword_data():
    """기존 키워드 맵 데이터를 DB에 삽입"""
    try:
        connection = psycopg2.connect(
            dbname="test",
            user="junil",
            password=DB_password,
            host="localhost",
            port="5432"
        )
        cursor = connection.cursor()
        
        # 기존 데이터 삭제 (중복 방지)
        cursor.execute("DELETE FROM contact_expand;")
        print("기존 데이터 삭제 완료")
        
        # 키워드 데이터 삽입
        insert_count = 0
        for service_name, keywords in keyword_map.items():
            for original, expanded in keywords.items():
                cursor.execute(
                    "INSERT INTO contact_expand (original_keyword, expanded_keyword) VALUES (%s, %s);",
                    (original, expanded)
                )
                insert_count += 1
                print(f"  {original} → {expanded}")
        
        connection.commit()
        cursor.close()
        connection.close()
        
        print(f"✅ 키워드 데이터 삽입 완료! (총 {insert_count}개)")
        return True
        
    except Exception as e:
        print(f"❌ 데이터 삽입 오류: {e}")
        return False

def verify_data():
    """삽입된 데이터 확인"""
    try:
        connection = psycopg2.connect(
            dbname="test",
            user="junil",
            password=DB_password,
            host="localhost",
            port="5432"
        )
        cursor = connection.cursor()
        
        # 데이터 개수 확인
        cursor.execute("SELECT COUNT(*) FROM contact_expand;")
        count = cursor.fetchone()[0]
        
        print(f"\n📊 삽입된 데이터 확인: 총 {count}개 키워드")
        
        # 샘플 데이터 확인
        cursor.execute("SELECT * FROM contact_expand LIMIT 5;")
        samples = cursor.fetchall()
        
        print("\n📋 샘플 데이터:")
        for row in samples:
            print(f"  {row[0]} → {row[1]}")
        
        cursor.close()
        connection.close()
        
    except Exception as e:
        print(f"❌ 데이터 확인 오류: {e}")

def main():
    """메인 실행 함수"""
    print("🚀 키워드 확장 DB 설정 시작")
    print("=" * 50)
    
    # 1. 테이블 생성
    if create_keyword_table():
        # 2. 데이터 삽입
        if insert_keyword_data():
            # 3. 데이터 확인
            verify_data()
            
            print("\n" + "=" * 50)
            print("🎉 키워드 확장 DB 설정 완료!")
            print("이제 expand_keywords.py를 실행할 수 있습니다.")
        else:
            print("❌ 데이터 삽입 실패")
    else:
        print("❌ 테이블 생성 실패")

if __name__ == "__main__":
    main() 