import json
import os
import numpy as np
import psycopg2
import re
from sentence_transformers import SentenceTransformer, util
from security import DB_password

# MeCab 안전 import
try:
    import MeCab
    _mecab_available = True
except ImportError:
    print("MeCab이 설치되지 않았습니다.")
    _mecab_available = False

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

    query = "SELECT link, title, expanded_title FROM contact;"
    cursor.execute(query)
    rows = cursor.fetchall()

    cursor.close()
    connection.close()

    return [{"link": row[0], "title": row[1], "expanded_title": row[2]} for row in rows]

# MeCab 태거 (안전한 초기화)
_mecab_tagger = None

def get_mecab_tagger():
    global _mecab_tagger
    if not _mecab_available:
        return None
    
    if _mecab_tagger is None:
        # 다양한 MeCab 초기화 옵션들 (macOS M1/M2 대응)
        init_options = [
            '',  # 기본 설정
            '-O wakati',  # 형태소만 출력
            '-d /opt/homebrew/lib/mecab/dic/mecab-ko-dic',  # 한국어 사전 경로 (Homebrew)
            '-d /usr/local/lib/mecab/dic/mecab-ko-dic',     # 한국어 사전 경로 (기본)
            '-d /opt/homebrew/lib/mecab/dic/ipadic',        # 일본어 사전 (fallback)
            '-d /usr/local/lib/mecab/dic/ipadic',           # 일본어 사전 (기본)
            '-r /dev/null',  # 설정 파일 무시
            '--node-format=%m,%f[7]\\n --unk-format=%m,*\\n --eos-format=\\n'  # 커스텀 포맷
        ]
        
        for option in init_options:
            try:
                print(f"MeCab 초기화 시도: {option if option else '기본 설정'}")
                _mecab_tagger = MeCab.Tagger(option)
                # 테스트 파싱으로 정상 동작 확인
                test_result = _mecab_tagger.parse("테스트")
                if test_result and 'EOS' in test_result:
                    print(f"MeCab 초기화 성공: {option if option else '기본 설정'}")
                    break
                else:
                    _mecab_tagger = None
            except Exception as e:
                print(f"MeCab 옵션 '{option}' 실패: {e}")
                _mecab_tagger = None
                continue
        
        if _mecab_tagger is None:
            print("모든 MeCab 초기화 방법 실패")
            _mecab_tagger = False
    
    return _mecab_tagger if _mecab_tagger is not False else None

# 텍스트 전처리 (기술 문서 최적화)
def preprocess_text(text):
    if not text:
        return ""
    
    # 기본 정리
    text = re.sub(r'\s+', ' ', text).strip()
    
    # MeCab 사용 가능할 때
    tagger = get_mecab_tagger()
    if tagger:
        try:
            # MeCab으로 기본형 추출
            result = tagger.parse(text)
            tokens = []
            
            for line in result.strip().split('\n'):
                if line == 'EOS' or '\t' not in line:
                    continue
                    
                parts = line.split('\t')
                if len(parts) >= 2:
                    surface = parts[0]
                    features = parts[1].split(',')
                    
                    # 기본형 사용 (어간 통일)
                    if len(features) >= 7 and features[6] != '*':
                        token = features[6].lower()
                    else:
                        token = surface.lower()
                    
                    # 의미있는 토큰만 (2글자 이상 또는 영숫자)
                    if len(token) >= 2 or re.match(r'^[a-zA-Z0-9]+$', token):
                        tokens.append(token)
            
            # 기술 문서 불용어 제거
            stopwords = {
                '하다', '되다', '있다', '없다', '이다', '때문', '통해', '위해', '대해',
                '것', '수', '등', '및', '또는', '그리고', '하지만', '그러나', '때'
            }
            
            filtered_tokens = [t for t in tokens if t not in stopwords]
            
            # 중복 제거하되 순서 유지
            seen = set()
            unique_tokens = []
            for token in filtered_tokens:
                if token not in seen:
                    unique_tokens.append(token)
                    seen.add(token)
            
            return ' '.join(unique_tokens)
            
        except Exception as e:
            print(f"MeCab 처리 오류: {e}")
            # MeCab 실패 시 기본 처리로 fallback
    
    # MeCab 없거나 실패 시 기본 전처리
    print("기본 전처리 사용 중")  # 임시 확인용
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    tokens = [t.lower() for t in text.split() if len(t) >= 2]
    
    # 중복 제거
    seen = set()
    unique_tokens = []
    for token in tokens:
        if token not in seen:
            unique_tokens.append(token)
            seen.add(token)
    
    return ' '.join(unique_tokens)

# 키워드 매칭 점수 계산 (부분 매칭 포함)
def calculate_keyword_score(target, corpus):
    target_keywords = set(target.split())
    if not target_keywords:
        return np.array([0] * len(corpus))
    
    scores = []
    for text in corpus:
        text_keywords = set(text.split())
        
        # 정확 매칭
        exact_matches = len(target_keywords & text_keywords)
        exact_score = exact_matches / len(target_keywords)
        
        # 부분 매칭 (기술 용어 특성상 중요)
        partial_score = 0
        for target_kw in target_keywords:
            for text_kw in text_keywords:
                if target_kw in text_kw or text_kw in target_kw:
                    partial_score += 0.3 / len(target_keywords)
                    break
        
        final_score = exact_score * 0.8 + partial_score * 0.2
        scores.append(min(final_score, 1.0))
    
    return np.array(scores)

# SBERT 코사인 유사도 계산
def compute_similarity(target, corpus, model=MODEL):
    target_processed = preprocess_text(target)
    corpus_processed = [preprocess_text(text) for text in corpus]
    
    target_embedding = model.encode(target_processed, convert_to_tensor=True, normalize_embeddings=True)
    corpus_embeddings = model.encode(corpus_processed, convert_to_tensor=True, normalize_embeddings=True)
    similarities = util.cos_sim(target_embedding, corpus_embeddings)
    return similarities.cpu().numpy()[0]

# 검색 실행
def search(target):
    data = fetch_data()
    # expanded_title이 있는 항목만 필터링
    filtered_data = [item for item in data if item.get('expanded_title')]
    corpus = [item['expanded_title'] for item in filtered_data]

    # 코사인 유사도 계산
    cosine_scores = compute_similarity(target, corpus)
    # 키워드 매칭 점수 계산
    keyword_scores = calculate_keyword_score(preprocess_text(target), [preprocess_text(text) for text in corpus])

    # 결과 생성
    results = []
    for i, item in enumerate(filtered_data):
        # 기술 문서 특성에 맞는 임계값
        if cosine_scores[i] < 0.2 and keyword_scores[i] < 0.1:
            continue
        
        # 정확한 점수 계산 (float 변환 명시)
        cosine_score = float(cosine_scores[i])
        keyword_score = float(keyword_scores[i]) 
        final_score = cosine_score * 0.7 + keyword_score * 0.3
        
        results.append({
            "title": str(item.get('title', '')),
            "link": str(item.get('link', '')),
            "similarity_score": final_score,  # 실제 정렬 기준으로 변경
            "cosine_score": cosine_score,     # 순수 코사인 유사도 (디버그용)
            "keyword_score": keyword_score,
            "final_score": final_score
        })

    # 결과 정렬 (최종 점수 기준)
    results = sorted(results, key=lambda x: x['final_score'], reverse=True)
    
    return {
        "target": str(target),
        "results": results
    }