from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from all_search.all_search import search
from security import AUTH

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 인증 키 (환경 변수로 관리)
AUTH_KEY = AUTH

# 기본 라우트
@app.get("/")
def read_root():
    return {"message": "API is running"}

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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 결과 반환
    return response