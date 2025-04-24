import json
import os
import time
import numpy as np
from sentence_transformers import SentenceTransformer, util

# JSON 데이터 로드
def load_data(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)

# SBERT 기반 유사도 계산
def calculate_sbert_similarity(titles, new_title, model):
    # 제목과 새로운 입력을 임베딩
    title_embeddings = model.encode(titles, convert_to_tensor=True)
    new_title_embedding = model.encode(new_title, convert_to_tensor=True)
    
    # 코사인 유사도 계산
    similarities = util.cos_sim(new_title_embedding, title_embeddings)
    most_similar_index = np.argmax(similarities)  # 가장 유사한 제목의 인덱스
    return most_similar_index, similarities[0][most_similar_index].item()

# 메인 함수
if __name__ == "__main__":
    # JSON 파일 경로 (상대경로로 설정)
    current_dir = os.path.dirname(__file__)
    file_path = os.path.join(current_dir, "test_data.json")
    
    # 데이터 로드
    data = load_data(file_path)
    titles = [item['title'] for item in data]
    
    # 새로운 입력
    new_title = "백엔드 데이터베이스"
    
    # Sentence-BERT 모델 로드
    model = SentenceTransformer('all-MiniLM-L6-v2', cache_folder='./model_cache')  # 경량화된 SBERT 모델
    
    # 실행 시간 측정 시작
    start_time = time.time()
    
    # SBERT 기반 유사도 계산
    most_similar_index, similarity_score = calculate_sbert_similarity(titles, new_title, model)
    
    # 실행 시간 측정 종료
    end_time = time.time()
    
    # 결과 출력
    print(f"새로운 입력: {new_title}")
    print(f"가장 유사한 제목: {titles[most_similar_index]} (Index: {most_similar_index})")
    print(f"유사도 점수: {similarity_score:.4f}")
    print(f"실행 시간: {end_time - start_time:.2f}초")