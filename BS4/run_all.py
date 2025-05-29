import subprocess

def run_script(script_name):
    """주어진 스크립트를 실행"""
    try:
        print(f"Running {script_name}...")
        subprocess.run(["python3", script_name], check=True)
        print(f"{script_name} executed successfully.\n")
    except subprocess.CalledProcessError as e:
        print(f"Error occurred while running {script_name}: {e}")
        exit(1)

def main():
    """세 개의 파일을 순차적으로 실행"""
    scripts = [
        "./save_links_to_json.py",
        "./expand_keywords.py",
        "./save_to_database.py"
    ]

    for script in scripts:
        run_script(script)

    print("All scripts executed successfully.")

if __name__ == "__main__":
    main()