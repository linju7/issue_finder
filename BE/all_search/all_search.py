import json
import os
import numpy as np
from sentence_transformers import SentenceTransformer, util

# 모델 로드 (전역 변수로 설정하여 재사용)
MODEL = SentenceTransformer('all-MiniLM-L6-v2', cache_folder='./model_cache')

# JSON 데이터 로드 함수
def load_data(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        raise FileNotFoundError(f"파일을 찾을 수 없습니다: {file_path}")
    except json.JSONDecodeError:
        raise ValueError("JSON 파일을 파싱하는 데 실패했습니다.")

# SBERT 기반 코사인 유사도 계산 함수
def calculate_cosine_similarity(target, data, model=MODEL):
    # 제목 리스트 추출
    titles = [item['title'] for item in data]

    # 제목과 입력 텍스트를 임베딩
    title_embeddings = model.encode(titles, convert_to_tensor=True)
    target_embedding = model.encode(target, convert_to_tensor=True)

    # 코사인 유사도 계산
    similarities = util.cos_sim(target_embedding, title_embeddings)

    # 가장 유사한 제목의 인덱스와 유사도 점수 반환
    most_similar_index = np.argmax(similarities.cpu().numpy())
    similarity_score = similarities[0][most_similar_index].item()

    return most_similar_index, similarity_score

# 검색 기능 구현
def do_all_search(target):
    # 1. JSON 데이터 로드
    current_dir = os.path.dirname(__file__)  # 현재 파일의 디렉토리
    file_path = os.path.join(current_dir, "../issue_data/test_data.json")  # 상대 경로로 설정

    data = load_data(file_path)

    # 2. 코사인 유사도 계산
    most_similar_index, similarity_score = calculate_cosine_similarity(target, data)

    # 3. 결과 반환
    return {
        "target": target,
        "most_similar_title": data[most_similar_index]['title'],
        "similarity_score": similarity_score,
        "link": data[most_similar_index]['link']
    }