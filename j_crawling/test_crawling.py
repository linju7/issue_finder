import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from crawling_target import html_input

def extract_links_and_summaries(html_content):
    # BeautifulSoup으로 HTML 파싱
    soup = BeautifulSoup(html_content, 'html.parser')

    # 링크와 summary 데이터를 저장할 리스트
    results = []

    # summary 데이터를 가진 요소 찾기
    rows = soup.find_all('div', {'role': 'row'})

    for row in rows:
        # 링크 추출
        link_tag = row.find('a', {'data-testid': 'business-list.ui.list-view.key-cell.issue-key'})
        if link_tag and link_tag.get('href'):
            link = f"https://linju7nts.atlassian.net{link_tag['href']}"
        else:
            continue

        # summary 추출
        summary_tag = row.find('span', {'data-testid': 'business-list.ui.list-view.summary-cell'})
        if summary_tag:
            summary = summary_tag.get_text(strip=True)
        else:
            summary = None

        # 결과 저장
        results.append({'link': link, 'summary': summary})

    return results

# 링크와 summary 추출
extracted_data = extract_links_and_summaries(html_input)
print("Extracted Data:")
for idx, data in enumerate(extracted_data, start=1):
    print(f"{idx}. Link: {data['link']}, Summary: {data['summary']}")
