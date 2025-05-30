import json
import os
import numpy as np
import psycopg2
import re
from konlpy.tag import Mecab
from sentence_transformers import SentenceTransformer, util
from sklearn.feature_extraction.text import TfidfVectorizer
from security import DB_password

# SBERT 모델 로드
MODEL = SentenceTransformer('snunlp/KR-SBERT-V40K-klueNLI-augSTS')

# 데이터베이스에서 데이터 로드
def fetch_data():
    connection = psycopg2.connect(
        dbname="test",
        user="junil",
        password=DB_password,
        host="localhost",
        port="5432"
    )
    cursor = connection.cursor()

    query = "SELECT link, title, expanded_title FROM pairing_content;"
    cursor.execute(query)
    rows = cursor.fetchall()

    cursor.close()
    connection.close()

    return [{"link": row[0], "title": row[1], "expanded_title": row[2]} for row in rows]

# 텍스트 전처리
def preprocess_text(text):
    if not text:
        return ""
    mecab = Mecab(dicpath='/opt/homebrew/lib/mecab/dic/mecab-ko-dic')
    text = re.sub(r'[^\w\s]', '', text)  # 특수문자 제거
    text = re.sub(r'\s+', ' ', text).strip()  # 공백 정리
    tokens = mecab.morphs(text)  # 형태소 분석
    stopwords = {'은', '는', '이', '가', '을', '를', '에', '의', '도', '로', '와', '과', '하다', '되다', '있다', '없다'}  # 불용어
    return ' '.join([token for token in tokens if token not in stopwords])

# TF-IDF 점수 계산
def compute_tfidf(target, corpus):
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus + [target])
    target_vector = tfidf_matrix[-1]
    scores = (tfidf_matrix[:-1] * target_vector.T).toarray().flatten()
    return scores

# SBERT 코사인 유사도 계산
def compute_similarity(target, corpus, model=MODEL):
    target_embedding = model.encode(preprocess_text(target), convert_to_tensor=True, normalize_embeddings=True)
    corpus_embeddings = model.encode([preprocess_text(text) for text in corpus], convert_to_tensor=True, normalize_embeddings=True)
    similarities = util.cos_sim(target_embedding, corpus_embeddings)
    return similarities.cpu().numpy()[0]

# 검색 실행
def search(target):
    data = fetch_data()
    corpus = [item['expanded_title'] for item in data]

    # 유사도 계산
    cosine_scores = compute_similarity(target, corpus)
    tfidf_scores = compute_tfidf(preprocess_text(target), corpus)

    # 결과 생성
    results = []
    for i, item in enumerate(data):
        final_score = float(cosine_scores[i]) * 0.7 + float(tfidf_scores[i]) * 0.3
        results.append({
            "title": item['title'],
            "link": item['link'],
            "similarity_score": float(cosine_scores[i]),
            "keyword_score": float(tfidf_scores[i]),
            "final_score": final_score
        })

    # 점수 기준으로 정렬
    results = sorted(results, key=lambda x: x['final_score'], reverse=True)

    return {
        "target": target,
        "results": results
    }