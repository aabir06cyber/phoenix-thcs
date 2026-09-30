from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, update
from sqlalchemy.orm import selectinload

from database_orm import get_db, session
import db_models, schemas
from feature_engg import fetch_and_cluster_firms, enrich_cluster_features
from engine import evaluate_cluster

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
import asyncio, json

router = APIRouter(prefix="/api/v1.2/clusters", tags=["cluster", "clusters"])
connected_clients = []

clip_scorer = None
qwen_synthesizer = None

async def run_engine():
    """Autonomous FIRMS pipeline running DBSCAN, enrichment, and ML evaluation."""
    async with session() as db:
        new_clusters = await fetch_and_cluster_firms(db)
        if not new_clusters:
            return

        for c in new_clusters:
            # 1. Spatial Recurrence Check (1.5km radius, 14-day memory)
            recurrence_query = text("""
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
            
            existing_match = await db.execute(
                recurrence_query, {"lon": c["centroid_longitude"], "lat": c["centroid_latitude"]}
            )
            existing_cluster = existing_match.mappings().first()

            if existing_cluster:
                # 2A. Update Existing Cluster 
                new_active_days = existing_cluster["active_days_count"]
                
                # Increment active days if the new detections fall on a different calendar date
                if c["last_seen"].date() > existing_cluster["last_seen"].date(): 
                    new_active_days += 1
                
                await db.execute(
                    update(db_models.clusters)
                    .where(db_models.clusters.cluster_id == existing_cluster["cluster_id"])
                    .values(
                        last_seen=c["last_seen"],
                        total_detections_in_month=existing_cluster["total_detections_in_month"] + c["total_detections_in_month"],
                        max_frp_mw=max(existing_cluster["max_frp_mw"], c["max_frp_mw"]),
                        active_days_count=new_active_days
                    )
                )
                await db.commit()

                # Graduation Check: Did an episodic fire cross the 3-day persistence threshold?
                if new_active_days >= 3:
                    await db.execute(
                        update(db_models.analysis_history)
                        .where(db_models.analysis_history.cluster_id == existing_cluster["cluster_id"])
                        .values(is_persistant=True)
                    )
                    await db.commit()
                    
                    payload = {
                        "event": "cluster_updated",
                        "cluster_id": existing_cluster["cluster_id"],
                        "is_persistant": True,
                        "active_days": new_active_days
                    }
                    
                    # Safe iteration over connected clients
                    for client in list(connected_clients):
                        await client.put(json.dumps(payload))
                
                continue # Skip ML model execution for already tracked fires

            # 2B. Process Brand New Cluster
            features = await enrich_cluster_features(c["centroid_latitude"], c["centroid_longitude"], c["first_seen"], db)
            c.update(features)

            db.add(db_models.clusters(**c))
            await db.commit()

            # Execute Heavy ML Evaluator in background thread to prevent event loop freeze
            verdict = await asyncio.to_thread(evaluate_cluster, c, clip_scorer, qwen_synthesizer)

            db.add(db_models.analysis_history(
                cluster_id=c["cluster_id"],
                final_class=verdict["final_class"],
                confidence=verdict["confidence"],
                is_persistant=verdict["is_persistent_source"],
                route=verdict["route"]
            ))
            await db.commit()
            
            payload = {
                "event": "new_fire_analyzed",
                "cluster_id": c["cluster_id"],
                "latitude": c["centroid_latitude"],
                "longitude": c["centroid_longitude"],
                "final_class": verdict["final_class"],
                "is_persistant": bool(verdict["is_persistent_source"]),
                "confidence": float(verdict["confidence"]),
                "route": verdict["route"],
            }
            
            for client in list(connected_clients):
                await client.put(json.dumps(payload))

@router.post("/", response_model=schemas.ClusterModel)
async def create_cluster(
    cluster: schemas.ClusterModel,
    backgroundtasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    cluster_data = cluster.model_dump(exclude={"analysis_bp"})
    new_cluster = db_models.clusters(**cluster_data)
    db.add(new_cluster)
    await db.commit()
    await db.refresh(new_cluster)

    backgroundtasks.add_task(run_engine)

    return new_cluster

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
async def sse_update(request: Request):
    async def generator():
        client = asyncio.Queue()
        connected_clients.append(client)

        try:
            while True:
                if await request.is_disconnected():
                    break
                data = await client.get()
                yield f"data:{data}\n\n"
        finally:
            connected_clients.remove(client)
        
    return StreamingResponse(generator(), media_type="text/event-stream")
