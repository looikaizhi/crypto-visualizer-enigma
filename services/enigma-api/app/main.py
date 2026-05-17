from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.enigma import router as enigma_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(enigma_router)
