import json
import os
import numpy as np
from sentence_transformers import SentenceTransformer, util
from konlpy.tag import Okt
import re

# 모델 로드 (더 강력한 한국어 특화 모델로 변경)
MODEL = SentenceTransformer('snunlp/KR-SBERT-V40K-klueNLI-augSTS')

# JSON 데이터 로드 함수
def load_data(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        raise FileNotFoundError(f"파일을 찾을 수 없습니다: {file_path}")
    except json.JSONDecodeError:
        raise ValueError("JSON 파일을 파싱하는 데 실패했습니다.")

# 텍스트 전처리 함수 (정규화 추가)
def preprocess_text(text):
    if not text:  # None 또는 빈 문자열 처리
        return ""
    okt = Okt()
    text = re.sub(r'[^\w\s]', '', text)  # 특수문자 제거
    text = re.sub(r'\s+', ' ', text).strip()  # 공백 정리
    tokens = okt.morphs(text, stem=True)  # 형태소 분석
    stopwords = {'은', '는', '이', '가', '을', '를', '에', '의', '도', '로', '와', '과', '하다', '되다', '있다', '없다'}  # 불용어
    return ' '.join([token for token in tokens if token not in stopwords])

# 키워드 매칭 점수 계산 함수
def calculate_keyword_score(target, data):
    target_keywords = set(target.split())  # 입력된 키워드를 분리
    scores = []
    for text in data:
        text_keywords = set(text.split())
        match_count = len(target_keywords & text_keywords)  # 키워드 교집합 개수
        scores.append(match_count / len(target_keywords) if target_keywords else 0)
    return np.array(scores)

# SBERT 기반 코사인 유사도 계산 함수
def calculate_cosine_similarity(target, data, model=MODEL):
    # 텍스트 전처리
    target = preprocess_text(target)
    expanded_texts = [preprocess_text(item['expanded_title']) for item in data]

    # 임베딩 및 유사도 계산
    embeddings = model.encode(expanded_texts, convert_to_tensor=True, normalize_embeddings=True)
    target_embedding = model.encode(target, convert_to_tensor=True, normalize_embeddings=True)
    similarities = util.cos_sim(target_embedding, embeddings)
    similarity_scores = similarities.cpu().numpy()[0]
    return similarity_scores

# 검색 기능 구현
def do_all_search(target):
    current_dir = os.path.dirname(__file__)
    file_path = os.path.join(current_dir, "../issue_data/test_data.json")
    data = load_data(file_path)

    # 데이터에서 expanded_title이 있는 항목만 필터링
    filtered_data = [item for item in data if item.get('expanded_title')]
    expanded_texts = [preprocess_text(item['expanded_title']) for item in filtered_data]

    # 코사인 유사도 계산
    cosine_scores = calculate_cosine_similarity(target, filtered_data)

    # 키워드 매칭 점수 계산
    keyword_scores = calculate_keyword_score(preprocess_text(target), expanded_texts)

    # 결과 생성
    results = []
    for i, item in enumerate(filtered_data):
        # 유사도 임계값 설정 (코사인 유사도 기준)
        if cosine_scores[i] < 0.3 and keyword_scores[i] == 0:
            continue
        results.append({
            "title": str(item.get('title', '')),  # 원본 title 반환
            "similarity_score": float(cosine_scores[i]),
            "keyword_score": float(keyword_scores[i]),
            "final_score": float(cosine_scores[i] * 0.7 + keyword_scores[i] * 0.3),  # 가중 평균
            "link": str(item.get('link', ''))
        })

    # 결과 정렬 (최종 점수 기준)
    results = sorted(results, key=lambda x: x['final_score'], reverse=True)

    return {
        "target": str(target),
        "results": results
    }