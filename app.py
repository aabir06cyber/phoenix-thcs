import json
from contextlib import asynccontextmanager

import ee
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import router
from config import settings
from database_orm import engine


def init_earth_engine() -> None:
    """Service-account login on servers; falls back to local `earthengine authenticate` creds."""
    try:
        if settings.gee_service_account_json:
            email = json.loads(settings.gee_service_account_json)["client_email"]
            creds = ee.ServiceAccountCredentials(email, key_data=settings.gee_service_account_json)
            ee.Initialize(credentials=creds, project=settings.gee_project)
            print("GEE Initialized (service account).")
        else:
            ee.Initialize(project=settings.gee_project)
            print("GEE Initialized (local credentials).")
    except Exception as e:
        print(f"GEE Initialization Warning: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Earth Engine (still used here for LULC / NDVI enrichment in feature_engg.py)
    init_earth_engine()

    # 2. ML models are NOT loaded here any more: they live on Modal (modal_app.py).

    # 3. Targeted overpass runs. NOAA-20 & NOAA-21 overpass + ~4h NRT delay
    #    (04:30, 05:30, 16:30, 17:30 IST).
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        router.run_engine,
        CronTrigger(hour="4,5,16,17", minute="30", timezone="Asia/Kolkata"),
        id="firms_overpass_run",
        max_instances=1,        # never overlap two runs
        coalesce=True,          # if several triggers were missed, run once
        misfire_grace_time=900, # still run if the loop was busy at :30 (default grace is 1 second)
    )
    scheduler.start()
    print("APScheduler started: FIRMS polling locked to IST overpass windows.")

    yield

    scheduler.shutdown()
    await engine.dispose()


app = FastAPI(title="MVP for 26162 - FireBenders", lifespan=lifespan)
app.include_router(router=router.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


@app.get("/health")
async def get_health():
    return {"status": "UP and RUNNING!"}
