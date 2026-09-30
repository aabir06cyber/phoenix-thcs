from fastapi import FastAPI
import router
from database_orm import engine, Base
from config import settings
from engine import QwenSynthesizer, RemoteClipScorer
from fastapi.middleware.cors import CORSMiddleware

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from contextlib import asynccontextmanager
import ee

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize Google Earth Engine
    try:
        ee.Initialize(project=settings.gee_project)
        print("GEE Initialized successfully.")
    except Exception as e:
        print(f"GEE Initialization Warning: {e}")

    # 2. Pre-load Heavy ML weights once on startup
    print("Loading ML models to memory...")
    router.clip_scorer = RemoteClipScorer()
    router.qwen_synthesizer = QwenSynthesizer()

    # 4. Start APScheduler for targeted overpass runs
    # NOAA-20 & NOAA-21 overpass + 4hr NRT delay (Runs at exactly 04:30, 05:30, 16:30, 17:30 IST)
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        router.run_engine, 
        CronTrigger(hour='4,5,16,17', minute='30', timezone='Asia/Kolkata')
    )
    scheduler.start()
    print("APScheduler started: Targeted FIRMS polling locked to IST overpass windows.")

    yield

    # Clean shutdown
    scheduler.shutdown()
    await engine.dispose()

app = FastAPI(title="MVP for 26162 - FireBenders")
app.include_router(router=router.router)
app.add_middleware(CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials = True
)

@app.get("/health")
async def get_health():
    return {"UP and RUNNING!"}