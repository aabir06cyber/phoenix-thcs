from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, update
from sqlalchemy.orm import selectinload

from database_orm import get_db, session
import db_models, schemas
from feature_engg import fetch_and_cluster_firms, enrich_cluster_features

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
import asyncio, json, traceback
import modal
from datetime import datetime
router = APIRouter(prefix="/api/v1.2/clusters", tags=["cluster", "clusters"])
connected_clients = []

# ---------------------------------------------------------------------------
# Modal GPU worker (see modal_app.py). Names must match what you deployed.
# ---------------------------------------------------------------------------
MODAL_APP_NAME = "phoenix-ml"
MODAL_CLASS_NAME = "Evaluator"
MODAL_CALL_TIMEOUT_S = 1800   # cold start (first-ever start downloads weights) + inference
SSE_KEEPALIVE_S = 15

_evaluator = None
_run_lock = asyncio.Lock()    # the scheduler and POST / must never run the pipeline at the same time


def _get_evaluator():
    global _evaluator
    if _evaluator is None:
        _evaluator = modal.Cls.from_name(MODAL_APP_NAME, MODAL_CLASS_NAME)()
    return _evaluator


async def evaluate_on_modal(cluster: dict) -> dict:
    """cluster dict -> verdict dict, computed on the Modal T4."""
    call = _get_evaluator().evaluate.remote.aio(dict(cluster))
    return await asyncio.wait_for(call, timeout=MODAL_CALL_TIMEOUT_S)


def _fallback_verdict(reason: str) -> dict:
    # Used only when Modal is unreachable/fails. Stored with confidence 0.0 so these rows are easy to find
    # (SELECT ... FROM analysis_history WHERE confidence = 0) and re-classify later.
    return {
        "final_class": "Uncertain / Ambiguous Event",
        "confidence": 0.0,
        "is_persistent_source": False,
        "route": "fast",
        "reasoning": reason,
    }


async def _broadcast(payload: dict):
    message = json.dumps(payload)
    for client in list(connected_clients):
        await client.put(message)


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------
RECURRENCE_QUERY = text("""
    SELECT cluster_id, active_days_count, total_detections_in_month, max_frp_mw, last_seen
    FROM clusters
    WHERE ST_DWithin(
        ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
        ST_SetSRID(ST_MakePoint(centroid_longitude, centroid_latitude), 4326)::geography,
        1500
    )
    AND last_seen >= NOW() - INTERVAL '14 days'
    ORDER BY last_seen DESC LIMIT 1;
""")


async def _update_existing_cluster(db: AsyncSession, c: dict, existing):
    new_active_days = existing["active_days_count"]

    # Increment active days if the new detections fall on a different calendar date
    if c["last_seen"].date() > existing["last_seen"].date():
        new_active_days += 1

    await db.execute(
        update(db_models.clusters)
        .where(db_models.clusters.cluster_id == existing["cluster_id"])
        .values(
            last_seen=c["last_seen"],
            total_detections_in_month=existing["total_detections_in_month"] + c["total_detections_in_month"],
            max_frp_mw=max(existing["max_frp_mw"] or 0.0, c["max_frp_mw"] or 0.0),
            active_days_count=new_active_days,
        )
    )
    await db.commit()

    # Graduation check: did an episodic fire cross the 3-day persistence threshold?
    if new_active_days >= 3:
        await db.execute(
            update(db_models.analysis_history)
            .where(db_models.analysis_history.cluster_id == existing["cluster_id"])
            .values(is_persistant=True)
        )
        await db.commit()

        await _broadcast({
            "event": "cluster_updated",
            "cluster_id": existing["cluster_id"],
            "is_persistant": True,
            "active_days": new_active_days,
        })


async def _create_and_classify_cluster(db: AsyncSession, c: dict):
    features = await enrich_cluster_features(c["centroid_latitude"], c["centroid_longitude"], c["first_seen"], db)
    c.update(features)

    db.add(db_models.clusters(**c))
    await db.commit()

    # Heavy ML runs on Modal (GPU). If it fails we still record a row so the cluster isn't left unanalysed.
    try:
        verdict = await evaluate_on_modal(c)
    except Exception as exc:
        print(f"Modal evaluation failed for {c['cluster_id']}: {exc!r}")
        traceback.print_exc()
        verdict = _fallback_verdict(f"Modal call failed: {exc!r}")

    db.add(db_models.analysis_history(
        cluster_id=c["cluster_id"],
        final_class=verdict["final_class"],
        confidence=verdict["confidence"],
        is_persistant=verdict["is_persistent_source"],
        route=verdict["route"],
    ))
    await db.commit()

    await _broadcast({
        "event": "new_fire_analyzed",
        "cluster_id": c["cluster_id"],
        "latitude": c["centroid_latitude"],
        "longitude": c["centroid_longitude"],
        "final_class": verdict["final_class"],
        "is_persistant": bool(verdict["is_persistent_source"]),
        "confidence": float(verdict["confidence"]),
        "route": verdict["route"],
    })


async def run_engine():
    """Autonomous FIRMS pipeline: DBSCAN -> enrichment -> ML evaluation (on Modal)."""
    if _run_lock.locked():
        print("run_engine: a run is already in progress, skipping this trigger.")
        return

    async with _run_lock:
        async with session() as db:
            new_clusters = await fetch_and_cluster_firms(db)
            if not new_clusters:
                print("run_engine: no new clusters.")
                return

            print(f"run_engine: processing {len(new_clusters)} clusters.")
            for c in new_clusters:
                try:
                    # Spatial recurrence check (1.5 km radius, 14-day memory)
                    match = await db.execute(
                        RECURRENCE_QUERY, {"lon": c["centroid_longitude"], "lat": c["centroid_latitude"]}
                    )
                    existing = match.mappings().first()

                    if existing:
                        await _update_existing_cluster(db, c, existing)  # already tracked: skip ML
                    else:
                        await _create_and_classify_cluster(db, c)
                except Exception:
                    # One bad cluster must not kill the rest of the run.
                    print(f"run_engine: failed on cluster {c.get('cluster_id')}")
                    traceback.print_exc()
                    await db.rollback()

@router.post("/", response_model=schemas.ClusterModel)
async def create_cluster(
    cluster: schemas.ClusterModel,
    backgroundtasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    # 1. Insert the cluster record
    cluster_data = cluster.model_dump(exclude={"analysis_bp"})
    new_cluster = db_models.clusters(**cluster_data)
    db.add(new_cluster)
    
    # 2. Insert the analysis history record if provided
    if cluster.analysis_bp:
        analysis_data = cluster.analysis_bp.model_dump()
        analysis_data["cluster_id"] = new_cluster.cluster_id
        new_analysis = db_models.analysis_history(**analysis_data)
        db.add(new_analysis)

    await db.commit()

    # 3. Attach the analysis data directly to the Pydantic-compatible object in memory
    # This completely avoids any post-insert SELECT queries that trigger the asyncpg OID 25 error.
    if cluster.analysis_bp:
        new_cluster.analysis_bp = new_analysis

    backgroundtasks.add_task(run_engine)
    
    return new_cluster

@router.get("/", response_model=list[schemas.ClusterModel])
async def list_clusters(limit: int = 500, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
        select(db_models.clusters)
        .options(selectinload(db_models.clusters.analysis_bp))
        .order_by(db_models.clusters.last_seen.desc())
        .limit(limit)
        )
        return result.scalars().all()
    except Exception as e:
        print(f"CRITICAL ERROR: {repr(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{cluster_id}", response_model=schemas.ClusterModel)
async def get_cluster_info(cluster_id: str, db: AsyncSession = Depends(get_db)):
    query_result = await db.execute(
        select(db_models.clusters).options(
            selectinload(db_models.clusters.analysis_bp)).where(
                db_models.clusters.cluster_id == cluster_id)
    )

    query_result = query_result.scalars().first()

    if not query_result:
        raise HTTPException(status_code=404, detail=f"Cluster Not Found (ID: {cluster_id})")
    
    return query_result

@router.get("/streaming/streams/sse_update")
async def sse_update(request: Request, db: AsyncSession = Depends(get_db)):
    async def generator():
        client = asyncio.Queue()
        connected_clients.append(client)

        try:
             # 1. INITIAL HYDRATION: Fetch and serialize clusters instantly using Pydantic
            try:
                result = await db.execute(
                    select(db_models.clusters)
                    .join(db_models.analysis_history)  # <--- THIS INNER JOIN FIXES IT
                    .options(selectinload(db_models.clusters.analysis_bp))
                    .order_by(db_models.clusters.last_seen.desc())
                    .limit(500)
                )
                clusters = result.scalars().all()
                
                # Convert ORM models to Pydantic models, then dump to JSON-compatible dicts
                pydantic_clusters = [schemas.ClusterModel.model_validate(c) for c in clusters]
                cluster_data = [p.model_dump(mode='json') for p in pydantic_clusters]
                
                yield f"data:{json.dumps(cluster_data)}\n\n"
            except Exception as e:
                print(f"Error sending initial cluster hydration: {e}")
            # 2. second part - real time data
            while True:
                if await request.is_disconnected():
                    break
                try:
                    data = await asyncio.wait_for(client.get(), timeout=SSE_KEEPALIVE_S)
                except asyncio.TimeoutError:
                    # Comment line: keeps proxies from closing an idle stream and lets us notice disconnects.
                    yield ": keepalive\n\n"
                    continue
                yield f"data:{data}\n\n"
        finally:
            connected_clients.remove(client)

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
