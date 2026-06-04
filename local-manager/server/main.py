"""ModHub 本地模组管理器 - FastAPI 服务"""

import sys
import os

# 将项目根目录加入 sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.routes import router

app = FastAPI(
    title="ModHub Local Manager",
    description="ModHub 本地模组管理器服务",
    version="1.0.0",
)

# CORS - 允许来自 Next.js 开发服务器的请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/local")


@app.get("/")
async def root():
    return {
        "service": "ModHub Local Manager",
        "version": "1.0.0",
        "status": "running",
    }


if __name__ == "__main__":
    import uvicorn
    print("Starting ModHub Local Manager on http://localhost:15800")
    uvicorn.run(app, host="127.0.0.1", port=15800)
