import subprocess
import sys
import os
from security import configs

def run_script(script_name):
    """주어진 스크립트를 실행"""
    try:
        print(f"=== Running {script_name} ===")
        result = subprocess.run([sys.executable, script_name], check=True, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        print(f"{script_name} executed successfully.\n")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error occurred while running {script_name}: {e}")
        if e.stderr:
            print(f"Error details: {e.stderr}")
        exit(1)
    except FileNotFoundError:
        print(f"❌ Script not found: {script_name}")
        exit(1)

def main():
    """전체 크롤링 파이프라인을 순차적으로 실행"""
    print("🚀 크롤링 파이프라인 시작")
    print(f"📋 설정된 서비스: {list(configs.keys())}")
    print("=" * 50)
    
    scripts = [
        ("save_links_to_json.py", "이슈 크롤링 (임시 JSON 저장)"),
        ("save_to_database.py", "원본 데이터 데이터베이스 저장"),
        ("expand_keywords.py", "키워드 확장 (데이터베이스에서 처리)")
    ]

    for script_name, description in scripts:
        print(f"🔄 {description} 시작...")
        run_script(script_name)

    print("🎉 모든 작업이 성공적으로 완료되었습니다!")
    print("=" * 50)
    
    # 결과 요약
    print("📊 작업 완료 요약:")
    for service_name in configs.keys():
        print(f"  - {service_name} 서비스:")
        print(f"    ✓ issue_data/{service_name}/plane_issue.json (임시 파일)")
        print(f"    ✓ {service_name} 테이블 (원본 + 키워드 확장 데이터 저장 완료)")
        print(f"    ✓ 데이터베이스 중심 워크플로우 적용")

if __name__ == "__main__":
    main()