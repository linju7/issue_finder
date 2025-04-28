import json
import os
import numpy as np
from sentence_transformers import SentenceTransformer, util

# 모델 로드 (전역 변수로 설정하여 재사용)
MODEL = SentenceTransformer('multi-qa-mpnet-base-dot-v1', cache_folder='./model_cache')

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
    # 확장된 텍스트(expanded_title)를 사용
    expanded_texts = [item['expanded_title'] for item in data if item['expanded_title']]

    # 임베딩 및 유사도 계산
    embeddings = model.encode(expanded_texts, convert_to_tensor=True)
    target_embedding = model.encode(target, convert_to_tensor=True)
    similarities = util.cos_sim(target_embedding, embeddings)
    similarity_scores = similarities.cpu().numpy()[0]
    sorted_indices = np.argsort(similarity_scores)[::-1]

    return sorted_indices, similarity_scores

# 검색 기능 구현 (수정)
def do_all_search(target):
    current_dir = os.path.dirname(__file__)
    file_path = os.path.join(current_dir, "../issue_data/test_data.json")
    data = load_data(file_path)

    # 코사인 유사도 계산
    sorted_indices, similarity_scores = calculate_cosine_similarity(target, data)

    # 결과 생성
    results = []
    for index in sorted_indices:
        results.append({
            "title": str(data[index]['title']),  # 원본 title 반환
            "similarity_score": float(similarity_scores[index]),
            "link": str(data[index]['link'])
        })

    return {
        "target": str(target),
        "results": results
    }