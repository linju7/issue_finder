from fastapi import FastAPI, HTTPException, Request
from search.search import search
from security import AUTH
from expand_keyword.retrieve_expanded_keyword import retrieve_expanded_keyword
from expand_keyword.update_expanded_keyword import update_expanded_keyword
from expand_keyword.delete_expanded_keyword import delete_expanded_keyword
from expand_keyword.create_expanded_keyword import create_expanded_keyword
from datetime import datetime

app = FastAPI()

# 인증 키 (환경 변수로 관리)
AUTH_KEY = AUTH


# 검색 API
@app.post("/search")
async def search_api(request: Request):
    # 요청 데이터 추출
    body = await request.json()
    target = body.get("target")
    auth = body.get("auth")

    # 필수 값 검증
    if not target or not auth:
        raise HTTPException(status_code=400, detail="Missing 'target' or 'auth' in request body")

    # 인증값 검증
    if auth != AUTH_KEY:
        raise HTTPException(status_code=401, detail="Invalid authentication key")

    # 검색 실행
    try:
        response = search(target)
        print(f'검색 내용 : {target}, 검색한 시각 : {datetime.now()}')
    except Exception as e:
        print(e)  # 에러 메시지 출력
        raise HTTPException(status_code=500, detail=str(e))

    # 결과 반환
    return response

# 확장 키워드 조회 API
@app.post("/expand/retrieve")
async def expand_retrieve_api(request: Request):
    # 요청 데이터 추출
    body = await request.json()
    service_name = body.get("service_name")
    auth = body.get("auth")

    # 필수 값 검증
    if not service_name or not auth:
        raise HTTPException(status_code=400, detail="Missing 'service_name' or 'auth' in request body")

    # 인증값 검증
    if auth != AUTH_KEY:
        raise HTTPException(status_code=401, detail="Invalid authentication key")

    # 확장 키워드 조회 실행
    try:
        keywords = retrieve_expanded_keyword(service_name)
        print(f'확장 키워드 조회 - 서비스: {service_name}, 결과 수: {len(keywords)}')
        return {"keywords": keywords}
    except Exception as e:
        print(e)  # 에러 메시지 출력
        raise HTTPException(status_code=500, detail=str(e))

# 확장 키워드 추가 API
@app.post("/expand/create")
async def expand_create_api(request: Request):
    # 요청 데이터 추출
    body = await request.json()
    service_name = body.get("service_name")
    original_keyword = body.get("original_keyword")
    expanded_keyword = body.get("expanded_keyword")
    auth = body.get("auth")

    # 필수 값 검증
    if not all([service_name, original_keyword, expanded_keyword, auth]):
        raise HTTPException(status_code=400, detail="Missing required fields in request body")

    # 인증값 검증
    if auth != AUTH_KEY:
        raise HTTPException(status_code=401, detail="Invalid authentication key")

    # 확장 키워드 추가 실행
    try:
        result = create_expanded_keyword(service_name, original_keyword, expanded_keyword)
        print(f'확장 키워드 추가 - 서비스: {service_name}, {original_keyword} ⇄ {expanded_keyword}')
        return result
    except Exception as e:
        print(e)  # 에러 메시지 출력
        raise HTTPException(status_code=500, detail=str(e))

# 확장 키워드 수정 API
@app.post("/expand/update")
async def expand_update_api(request: Request):
    # 요청 데이터 추출
    body = await request.json()
    service_name = body.get("service_name")
    original_keyword = body.get("original_keyword")
    expanded_keyword = body.get("expanded_keyword")
    new_original = body.get("new_original")
    new_expanded = body.get("new_expanded")
    auth = body.get("auth")

    # 필수 값 검증
    if not all([service_name, original_keyword, expanded_keyword, new_original, new_expanded, auth]):
        raise HTTPException(status_code=400, detail="Missing required fields in request body")

    # 인증값 검증
    if auth != AUTH_KEY:
        raise HTTPException(status_code=401, detail="Invalid authentication key")

    # 확장 키워드 수정 실행
    try:
        result = update_expanded_keyword(service_name, original_keyword, expanded_keyword, new_original, new_expanded)
        print(f'확장 키워드 수정 - 서비스: {service_name}, {original_keyword}→{new_original}, {expanded_keyword}→{new_expanded}')
        return result
    except Exception as e:
        print(e)  # 에러 메시지 출력
        raise HTTPException(status_code=500, detail=str(e))

# 확장 키워드 삭제 API
@app.post("/expand/delete")
async def expand_delete_api(request: Request):
    # 요청 데이터 추출
    body = await request.json()
    service_name = body.get("service_name")
    original_keyword = body.get("original_keyword")
    expanded_keyword = body.get("expanded_keyword")
    auth = body.get("auth")

    # 필수 값 검증
    if not all([service_name, original_keyword, expanded_keyword, auth]):
        raise HTTPException(status_code=400, detail="Missing required fields in request body")

    # 인증값 검증
    if auth != AUTH_KEY:
        raise HTTPException(status_code=401, detail="Invalid authentication key")

    # 확장 키워드 삭제 실행
    try:
        result = delete_expanded_keyword(service_name, original_keyword, expanded_keyword)
        print(f'확장 키워드 삭제 - 서비스: {service_name}, {original_keyword} ⇄ {expanded_keyword}')
        return result
    except Exception as e:
        print(e)  # 에러 메시지 출력
        raise HTTPException(status_code=500, detail=str(e))

# 모든 API 라우트 선언 후에 static mount!
from fastapi.staticfiles import StaticFiles
# React 빌드 결과물 서빙
import os
if os.path.exists("../FE/build") and os.listdir("../FE/build"):
    app.mount("/", StaticFiles(directory="../FE/build", html=True), name="static")
else:
    print("⚠️  React 빌드 파일이 없습니다. 'cd FE && npm run build' 를 실행하세요.")
    # 개발 중에는 React dev server를 사용하세요