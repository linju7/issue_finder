from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By

def check_chromedriver():
    try:
        # ChromeDriver 경로 설정 (PATH에 추가된 경우 경로 생략 가능)
        service = Service()  # 경로를 명시적으로 지정하려면 Service("/path/to/chromedriver") 사용
        driver = webdriver.Chrome(service=service)

        # Chrome 브라우저 열기
        driver.get("https://www.google.com")

        # 페이지 제목 출력
        print("ChromeDriver가 정상적으로 작동합니다!")
        print("페이지 제목:", driver.title)

        # 브라우저 닫기
        driver.quit()

    except Exception as e:
        print("ChromeDriver가 제대로 작동하지 않습니다.")
        print("오류 메시지:", str(e))

if __name__ == "__main__":
    check_chromedriver()