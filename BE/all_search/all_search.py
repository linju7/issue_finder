import json
import os
import numpy as np
from sentence_transformers import SentenceTransformer, util
from sklearn.feature_extraction.text import TfidfVectorizer
from konlpy.tag import Okt
import re
import psycopg2  # PostgreSQL 연결을 위한 라이브러리
from security import DB_password  # DB 비밀번호를 가져옵니다

# 모델 로드 (한국어 특화 SBERT 모델)
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

# PostgreSQL 데이터베이스에서 데이터 로드 함수
def load_data_from_db():
    # PostgreSQL 데이터베이스 연결
    connection = psycopg2.connect(
        dbname="test",
        user="junil",
        password=DB_password,  # 비밀번호를 입력하세요
        host="localhost",
        port="5432"
    )
    cursor = connection.cursor()

    # 데이터 조회 쿼리
    select_query = "SELECT link, title, expanded_title FROM pairing_content;"
    cursor.execute(select_query)

    # 데이터 가져오기
    rows = cursor.fetchall()

    # 결과를 JSON 형식으로 변환
    data = []
    for row in rows:
        data.append({
            "link": row[0],
            "title": row[1],
            "expanded_title": row[2]
        })

    # 연결 종료
    cursor.close()
    connection.close()

    return data

# 텍스트 전처리 함수 (형태소 분석 및 불용어 제거)
def preprocess_text(text):
    if not text: 
        return ""
    okt = Okt()
    text = re.sub(r'[^\w\s]', '', text)  # 특수문자 제거
    text = re.sub(r'\s+', ' ', text).strip()  # 공백 정리
    tokens = okt.morphs(text, stem=True)  # 형태소 분석
    stopwords = {'은', '는', '이', '가', '을', '를', '에', '의', '도', '로', '와', '과', '하다', '되다', '있다', '없다'}  # 불용어
    return ' '.join([token for token in tokens if token not in stopwords])

# TF-IDF 기반 키워드 매칭 점수 계산 함수
def calculate_tfidf_score(target, data):
    vectorizer = TfidfVectorizer()
    corpus = data + [target]
    tfidf_matrix = vectorizer.fit_transform(corpus)
    target_vector = tfidf_matrix[-1]
    scores = (tfidf_matrix[:-1] * target_vector.T).toarray().flatten()
    return scores

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
    # 데이터베이스에서 데이터 로드
    data = load_data_from_db()

    # 데이터에서 expanded_title이 있는 항목만 필터링
    filtered_data = [item for item in data if item.get('expanded_title')]
    expanded_texts = [preprocess_text(item['expanded_title']) for item in filtered_data]

    # 코사인 유사도 계산
    cosine_scores = calculate_cosine_similarity(target, filtered_data)

    # TF-IDF 기반 키워드 매칭 점수 계산
    tfidf_scores = calculate_tfidf_score(preprocess_text(target), expanded_texts)

    # 결과 생성
    results = []
    for i, item in enumerate(filtered_data):
        # 유사도 임계값 설정 (코사인 유사도 기준)
        if cosine_scores[i] < 0.3 and tfidf_scores[i] < 0.1:
            continue
        results.append({
            "title": str(item.get('title', '')),  # 원본 title 반환
            "similarity_score": float(cosine_scores[i]),
            "keyword_score": float(tfidf_scores[i]),
            "final_score": float(cosine_scores[i] * 0.7 + tfidf_scores[i] * 0.3),  # 가중 평균
            "link": str(item.get('link', ''))
        })

    # 결과 정렬 (최종 점수 기준)
    results = sorted(results, key=lambda x: x['final_score'], reverse=True)

    return {
        "target": str(target),
        "results": results
    }