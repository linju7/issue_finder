import json
import os
import time
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# JSON 데이터 로드
def load_data(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)

# 코사인 유사도 계산
def calculate_cosine_similarity(titles, new_title):
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform(titles + [new_title])  # 기존 제목 + 새로운 제목 벡터화
    similarity_matrix = cosine_similarity(vectors)
    new_title_similarity = similarity_matrix[-1][:-1]  # 새로운 제목과 기존 제목 간의 유사도
    most_similar_index = np.argmax(new_title_similarity)  # 가장 유사한 제목의 인덱스
    return most_similar_index, new_title_similarity[most_similar_index]

# 메인 함수
if __name__ == "__main__":
    # JSON 파일 경로 (상대경로로 설정)
    current_dir = os.path.dirname(__file__)  # 현재 스크립트의 디렉토리
    file_path = os.path.join(current_dir, "test_data.json")  # 확장된 데이터 파일 사용
    
    # 데이터 로드
    data = load_data(file_path)
    titles = [item['title'] for item in data]
    
    # 새로운 입력
    new_title = "백엔드 "
    
    # 실행 시간 측정 시작
    start_time = time.time()
    
    # 코사인 유사도 계산
    most_similar_index, similarity_score = calculate_cosine_similarity(titles, new_title)
    
    # 실행 시간 측정 종료
    end_time = time.time()
    
    # 결과 출력
    print(f"새로운 입력: {new_title}")
    print(f"가장 유사한 제목: {titles[most_similar_index]} (Index: {most_similar_index})")
    print(f"유사도 점수: {similarity_score:.4f}")
    print(f"실행 시간: {end_time - start_time:.2f}초")