import json
import psycopg2  # PostgreSQL 연결을 위한 라이브러리
from extract_keyword import keyword_map
from security import DB_password

def expand_keywords(text, keyword_map):
    # 양방향 매핑 생성
    bidirectional_map = {}
    for key, value in keyword_map.items():
        bidirectional_map[key] = value
        bidirectional_map[value] = key

    # 텍스트 변환 (확장 단어 사이에 공백 추가)
    for key, value in bidirectional_map.items():
        text = text.replace(key, f"{key} {value} ")  # 확장 단어 사이에 공백 추가
    return text

def save_to_database(data):
    # PostgreSQL 데이터베이스 연결
    connection = psycopg2.connect(
        dbname="test",
        user="junil",
        password=DB_password,  # 비밀번호를 입력하세요
        host="localhost",
        port="5432"
    )
    cursor = connection.cursor()

    # 데이터 삽입
    insert_query = """
    INSERT INTO pairing_content (link, title, expanded_title)
    VALUES (%s, %s, %s)
    ON CONFLICT (link) DO UPDATE
    SET title = EXCLUDED.title,
        expanded_title = EXCLUDED.expanded_title,
        updated_at = NOW();
    """
    for item in data:
        cursor.execute(insert_query, (item['link'], item['title'], item['expanded_title']))

    # 변경사항 커밋 및 연결 종료
    connection.commit()
    cursor.close()
    connection.close()

# JSON 파일 읽기
input_file = "/Users/user/Desktop/Code/issue_finder/BS4/test/extracted_data.json"
with open(input_file, "r", encoding="utf-8") as f:
    extracted_data = json.load(f)

# 키워드 확장 적용
for item in extracted_data:
    item['expanded_title'] = expand_keywords(item['title'], keyword_map)

# 데이터베이스에 저장
save_to_database(extracted_data)

print("Data has been saved to the database.")