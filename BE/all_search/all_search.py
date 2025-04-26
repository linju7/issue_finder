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

# SBERT 기반 코사인 유사도 계산 함수 (수정)
def calculate_cosine_similarity(target, data, model=MODEL):
    # 제목 리스트 추출
    titles = [item['title'] for item in data]

    # 제목과 입력 텍스트를 임베딩
    title_embeddings = model.encode(titles, convert_to_tensor=True)
    target_embedding = model.encode(target, convert_to_tensor=True)

    # 코사인 유사도 계산
    similarities = util.cos_sim(target_embedding, title_embeddings)

    # 유사도 점수를 numpy 배열로 변환
    similarity_scores = similarities.cpu().numpy()[0]

    # 유사도 점수를 기준으로 정렬된 인덱스 반환
    sorted_indices = np.argsort(similarity_scores)[::-1]

    return sorted_indices, similarity_scores

# 검색 기능 구현 (수정)
def do_all_search(target):
    # 1. JSON 데이터 로드
    current_dir = os.path.dirname(__file__)  # 현재 파일의 디렉토리
    file_path = os.path.join(current_dir, "../issue_data/test_data.json")  # 상대 경로로 설정

    data = load_data(file_path)

    # 2. 코사인 유사도 계산
    sorted_indices, similarity_scores = calculate_cosine_similarity(target, data)

    # 3. 결과 생성
    results = []
    for index in sorted_indices:
        results.append({
            "title": str(data[index]['title']),  # 문자열로 변환
            "similarity_score": float(similarity_scores[index]),  # numpy.float32 -> float 변환
            "link": str(data[index]['link'])  # 문자열로 변환
        })

    return {
        "target": str(target),  # 문자열로 변환
        "results": results
    }