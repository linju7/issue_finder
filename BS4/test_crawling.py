import asyncio
import json
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from crawling_target import html_input
from extract_keyword import keyword_map

def extract_links_and_summaries(html_content, keyword_map):
    soup = BeautifulSoup(html_content, 'html.parser')
    results = []

    rows = soup.find_all('div', {'role': 'row'})
    for row in rows:
        link_tag = row.find('a', {'data-testid': 'business-list.ui.list-view.key-cell.issue-key'})
        if link_tag and link_tag.get('href'):
            link = f"https://linju7nts.atlassian.net{link_tag['href']}"
        else:
            continue

        summary_tag = row.find('span', {'data-testid': 'business-list.ui.list-view.summary-cell'})
        if summary_tag:
            summary = summary_tag.get_text(strip=True)
            expanded_summary = expand_keywords(summary, keyword_map)  # 키워드 확장 적용
        else:
            summary = None
            expanded_summary = None

        results.append({
            'link': link,
            'title': summary,
            'expanded_title': expanded_summary  # 확장된 텍스트 추가
        })

    return results

def expand_keywords(text, keyword_map):
    # 양방향 매핑 생성
    bidirectional_map = {}
    for key, value in keyword_map.items():
        bidirectional_map[key] = value
        bidirectional_map[value] = key

    # 텍스트 변환
    for key, value in bidirectional_map.items():
        text = text.replace(key, f"{key} {value}")
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
