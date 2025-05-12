from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from all_search.all_search import do_all_search
from security import AUTH

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 필요한 도메인만 허용하거나 "*"로 모든 도메인 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 인증 키 (환경 변수로 관리)
AUTH_KEY = AUTH

# 기본 라우트
@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

# 검색 API
@app.post("/all/search")
async def all_search(request: Request):
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
        response = do_all_search(target)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 결과 반환
    return response