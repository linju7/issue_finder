from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from security import cookies

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

# div class="issue-table-wrapper" 요소 가져오기
try:
    issue_table_wrapper = driver.find_element(By.CLASS_NAME, "issue-table-wrapper")
    html_content = issue_table_wrapper.get_attribute("outerHTML")  # 해당 요소의 전체 HTML 가져오기

    # HTML을 파일에 저장
    output_file_path = "/Users/user/Desktop/Code/issue_finder/BS4/test/issue_table_wrapper.html"
    with open(output_file_path, "w", encoding="utf-8") as file:
        file.write(html_content)

    print(f"HTML content saved to {output_file_path}")
except Exception as e:
    print(f"Error: {e}")

driver.quit()