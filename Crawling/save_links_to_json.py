from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import html
import json
import os
from security import cookies, configs

def parse_issue_links(html_content):
    """HTML에서 링크와 제목을 추출하여 리스트로 반환"""
    soup = BeautifulSoup(html_content, 'html.parser')
    issues = []

    rows = soup.select('tbody > tr')  # tbody > tr을 기준으로 찾음
    for row in rows:
        summary_cell = row.select_one('td.summary')  # summary 셀 찾기
        if not summary_cell:
            continue

        issue_links = summary_cell.select('a.issue-link')  # 모든 issue-link 클래스의 <a> 태그 찾기
        for link in issue_links:
            if 'parentIssue' in link.get('class', []):  # parentIssue 클래스 제외
                continue

            text = link.get_text(strip=True)
            if text == link.get('data-issue-key'):  # 텍스트가 이슈 번호만 포함된 경우 제외
                continue

            href = link.get('href')
            full_link = f"https://jira.navercorp.com{href}"

            if full_link and text:  # 링크와 텍스트가 존재하는 경우만 추가
                issues.append({
                    'link': full_link,
                    'title': html.unescape(text)  # HTML 엔티티 변환
                })

    return issues

def initialize_empty_json():
    """새로운 크롤링 세션을 위해 빈 리스트 반환 (기존 데이터 무시)"""
    return []

def save_issues_to_json():
    """Selenium을 사용해 여러 페이지 데이터를 추출하고 JSON 파일에 덧붙여서 저장"""
    chrome_options = Options()
    chrome_options.add_argument("--start-maximized")  # 브라우저 최대화
    driver = webdriver.Chrome(options=chrome_options)

    # 각 서비스별로 크롤링 수행
    for service_name, url_configs in configs.items():
        print(f"\n=== {service_name} 서비스 크롤링 시작 ===")
        
        # 새로운 크롤링 세션 시작 (기존 데이터 덮어쓰기)
        output_dir = f"./issue_data/{service_name}"
        os.makedirs(output_dir, exist_ok=True)
        output_file = os.path.join(output_dir, "plane_issue.json")
        all_issues = initialize_empty_json()  # 매번 새로 시작
        
        print(f"새로운 크롤링 세션 시작 (기존 데이터 무시)")

        # 첫 번째 요청에서만 쿠키 설정
        cookie_set = False

        # 해당 서비스의 모든 URL 크롤링
        for url_config in url_configs:
            target_url = url_config["url"]
            page = url_config["page"]
            
            print(f"URL 크롤링 중: {target_url[:50]}... (페이지: {page}개)")

            # 이슈 수집
            for start_index in range(0, page * 20, 20):
                paginated_url = f"{target_url}&startIndex={start_index}"
                driver.get(paginated_url)

                if not cookie_set:
                    for cookie in cookies:
                        driver.add_cookie(cookie)
                    driver.refresh()  # 페이지 새로고침하여 쿠키 적용
                    cookie_set = True

                issue_table = driver.find_element(By.CLASS_NAME, "issue-table-wrapper")
                html_content = issue_table.get_attribute("outerHTML")  # HTML 가져오기

                issues = parse_issue_links(html_content)
                all_issues.extend(issues)  # 기존 데이터에 덧붙이기

        # JSON 파일로 저장 (새로 크롤링한 데이터만)
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(all_issues, f, ensure_ascii=False, indent=4)

        print(f"{service_name}: 총 {len(all_issues)}개 이슈가 {output_file}에 저장되었습니다 (임시 파일).")

    driver.quit()

if __name__ == "__main__":
    save_issues_to_json()