import json
from bs4 import BeautifulSoup
from crawling_target import html_input
from extract_keyword import keyword_map

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

def save_to_json_file(data, file_path):
    with open(file_path, 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=4)

# 링크와 summary 추출
extracted_data = extract_links_and_summaries(html_input, keyword_map)

# JSON 파일로 저장
output_file_path = "../BE/issue_data/test_data.json"  # 저장할 파일 경로
save_to_json_file(extracted_data, output_file_path)

print(f"Data has been saved to {output_file_path}")
