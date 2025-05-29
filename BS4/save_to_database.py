import json
import psycopg2
from security import DB_password

def insert_issues_into_db(issues):
    """데이터베이스에 이슈 데이터를 삽입"""
    connection = psycopg2.connect(
        dbname="test",
        user="junil",
        password=DB_password,
        host="localhost",
        port="5432"
    )
    cursor = connection.cursor()

    insert_query = """
    INSERT INTO pairing_content (link, title, expanded_title)
    VALUES (%s, %s, %s)
    ON CONFLICT (link) DO UPDATE
    SET title = EXCLUDED.title,
        expanded_title = EXCLUDED.expanded_title,
        updated_at = NOW();
    """
    for issue in issues:
        cursor.execute(insert_query, (issue['link'], issue['title'], issue['expanded_title']))

    connection.commit()
    cursor.close()
    connection.close()

def save_expanded_issues_to_db():
    """확장된 JSON 데이터를 읽어와 데이터베이스에 저장"""
    input_file = "./issue_data/expanded_data.json"

    with open(input_file, "r", encoding="utf-8") as f:
        issues = json.load(f)

    insert_issues_into_db(issues)
    print("Issues have been saved to the database.")

if __name__ == "__main__":
    save_expanded_issues_to_db()