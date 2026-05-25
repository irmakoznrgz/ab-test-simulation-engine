from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from src.ingestion import *
from src.stats_engine import *
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Dynamic Voucher and Revenue Optimizer API")

#CORS Settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserActionPayload(BaseModel):
    user_id: str = Field(..., description="Unique user ID")
    group_name: str = Field(..., pattern="^[AB]$", description="'A' or 'B'")
    converted: int = Field(..., ge=0, le=1, description="0: No purchase, 1: Purchased")
    purchase_amount: float = Field(0.0, description="User's cart total")

class StatusPayload(BaseModel):
    status: str = Field(..., pattern="^(RUNNING|STOPPED)$", description="Test status")

class PowerAnalysisPayload(BaseModel):
    base_rate: float
    mde_relative: float


@app.post("/api/track-action")
def track_action(payload: UserActionPayload):
    current_status = get_test_status()
    if current_status == "STOPPED":
        raise HTTPException(status_code=400, detail="Test is currently stopped. Cannot track actions.")
    
    success = insert_user_action(
        user_id=payload.user_id,
        group_name=payload.group_name,
        converted=payload.converted,
        purchase_amount=payload.purchase_amount
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Database error while inserting action.")
        
    return {"message": "Action tracked successfully"}

@app.get("/api/test-status")
def get_status():
    status = get_test_status()
    return {"status": status}

@app.post("/api/test-status")
def change_status(payload: StatusPayload):
    success = update_test_status(payload.status)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update test status.")
    return {"message": f"Test status updated to {payload.status}"}

@app.post("/api/power-analysis")
def power_analysis(payload: PowerAnalysisPayload):
    result = calculate_required_sample_size(
        base_rate=payload.base_rate,
        mde_relative=payload.mde_relative
    )
    return result

@app.get("/api/results")
def get_test_results():
    stats_data = get_conversion_stats()
    amounts_A, amounts_B = get_purchase_amounts()
    
    analysis = calculate_ab_test_results(stats_data, amounts_A, amounts_B)
    
    return analysis