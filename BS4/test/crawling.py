from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import html
from security import cookies

def extract_links_and_summaries(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    results = []

    # HTML에서 각 row를 찾음
    rows = soup.select('tbody > tr')  # tbody > tr을 기준으로 찾음
    for row in rows:
        # 링크와 텍스트 추출
        summary_cell = row.select_one('td.summary')  # summary 셀 찾기
        if summary_cell:
            # summary 셀 내부에서 모든 <a> 태그를 찾음
            issue_links = summary_cell.select('a.issue-link')  # 모든 issue-link 클래스의 <a> 태그 찾기
            for issue_link in issue_links:
                # parentIssue 클래스 제외
                if 'parentIssue' in issue_link.get('class', []):
                    continue

                # 텍스트가 이슈 번호만 포함된 경우 제외
                text = issue_link.get_text(strip=True)
                if text == issue_link.get('data-issue-key'):
                    continue

                # href 속성 추출 및 링크 생성
                href = issue_link.get('href')
                full_link = f"https://jira.navercorp.com{href}"

                # 결과에 추가
                if full_link and text:  # 링크와 텍스트가 존재하는 경우만 추가
                    results.append({
                        'link': full_link,
                        'text': html.unescape(text)  # HTML 엔티티 변환
                    })

    return results

# Chrome 옵션 설정
chrome_options = Options()
chrome_options.add_argument("--start-maximized")  # 브라우저 최대화
driver = webdriver.Chrome(options=chrome_options)

# 접속된 페이지 열기
url = "https://jira.navercorp.com/issues/?filter=-4&jql=project%20in%20(ADDRSUS%2C%20WMFE%2C%20WMAPP)%20order%20by%20created%20DESC"
driver.get(url)

for cookie in cookies:
    driver.add_cookie(cookie)

# 페이지 새로고침하여 쿠키 적용
driver.refresh()

# Selenium으로 HTML 가져오기
issue_table_wrapper = driver.find_element(By.CLASS_NAME, "issue-table-wrapper")
html_content = issue_table_wrapper.get_attribute("outerHTML")  # HTML 가져오기

# 링크와 텍스트 추출
extracted_data = extract_links_and_summaries(html_content)

# 결과 출력
for i, data in enumerate(extracted_data, start=1):
    print(f"{i}. Link: {data['link']}, Text: {data['text']}")