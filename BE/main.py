from fastapi import FastAPI

app = FastAPI()

# 기본 라우트
@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

# 간단한 API 호출 예시
@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}