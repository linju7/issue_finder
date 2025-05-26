import json
from bs4 import BeautifulSoup
from crawling_target import html_input
from extract_keyword import keyword_map
import psycopg2  # PostgreSQL 연결을 위한 라이브러리

def extract_links_and_summaries(html_content, keyword_map):
    soup = BeautifulSoup(html_content, 'html.parser')
    results = []

    # HTML에서 각 row를 찾음
    rows = soup.select('tbody > tr')  # tbody > tr을 기준으로 찾음
    for row in rows:
        # 링크와 텍스트 추출
        link_tag = row.select_one('td.summary')
        if link_tag:
            # 모든 <a> 태그를 선택
            issue_links = link_tag.select('a.issue-link')
            if len(issue_links) > 1:  # 두 번째 링크가 있는지 확인
                issue_link = issue_links[1]  # 두 번째 <a> 태그 선택
                href = issue_link.get('href')  # href 속성 추출
                text = issue_link.get_text(strip=True)  # 텍스트 추출
                full_link = f"https://jira.navercorp.com{href}"  # 링크 앞에 도메인 추가
            else:
                full_link = None
                text = None
        else:
            full_link = None
            text = None

        # 제목 추출
        title_tag = row.select_one('td.summary')
        if title_tag:
            title = text  # 두 번째 링크의 텍스트를 제목으로 사용
            expanded_title = expand_keywords(title, keyword_map) if title else None  # 키워드 확장 적용
        else:
            title = None
            expanded_title = None

        # 결과에 추가
        results.append({
            'link': full_link,
            'title': title,
            'expanded_title': expanded_title  # 확장된 텍스트 추가
        })

    return results

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
        password="your_password",  # 비밀번호를 입력하세요
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

# 링크와 summary 추출
extracted_data = extract_links_and_summaries(html_input, keyword_map)

# 데이터베이스에 저장
save_to_database(extracted_data)

print("Data has been saved to the database.")