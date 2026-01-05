from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
import json
import re
from pathlib import Path

app = FastAPI(title="BotsuInsure API", description="Botswana Insurance Comparison")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data from JSON files
def load_products():
    data_dir = Path(__file__).parent.parent / "data"
    products = []
    
    companies = [
        {"id": 1, "name": "Liberty Life Botswana (Pty) Limited", "type": "life_funeral"},
        {"id": 2, "name": "Metropolitan Life Botswana", "type": "life"},
        {"id": 3, "name": "Botsogo Health Plan", "type": "medical"},
        {"id": 4, "name": "Botswana Public Officers Medical Aid Scheme (BPOMAS)", "type": "medical"},
        {"id": 5, "name": "Pula Medical Aid Fund (Pulamed)", "type": "medical"},
    ]
    
    # Load Liberty files
    with open(data_dir / "funeral_liberty_boago.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        for p in data["products"]:
            products.append({
                "id": len(products) + 1,
                "name": p["product_name"],
                "category": p["category"],
                "company": companies[0],
                "sum_assured": p.get("sum_assured"),
                "premiums": p.get("premiums", []),
                "waiting_period_natural": p.get("waiting_period_natural"),
                "waiting_period_accidental": p.get("waiting_period_accidental"),
                "key_features": p.get("key_features", [])
            })
    
    with open(data_dir / "hospital_cashback.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        for p in data["products"]:
            products.append({
                "id": len(products) + 1,
                "name": p["product_name"],
                "category": p["category"],
                "company": companies[0],
                "sum_assured": p.get("sum_assured"),
                "premiums": p.get("premiums", []),
                "waiting_period_natural": p.get("waiting_period_natural"),
                "waiting_period_accidental": p.get("waiting_period_accidental"),
                "key_features": p.get("key_features", [])
            })
    
    with open(data_dir / "life_metropolitan_mothusi.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        for p in data["products"]:
            products.append({
                "id": len(products) + 1,
                "name": p["product_name"],
                "category": p["category"],
                "company": companies[1],
                "sum_assured": p.get("sum_assured"),
                "premiums": p.get("premiums", []),
                "waiting_period_natural": p.get("waiting_period_natural"),
                "waiting_period_accidental": p.get("waiting_period_accidental"),
                "key_features": p.get("key_features", [])
            })
    
    # Load medical plans
    medical_data = [
        ("medical_botsogo_2025.json", companies[2]),
        ("medical_bpomas_2025.json", companies[3]),
        ("medical_pulamed_2025.json", companies[4]),
    ]
    
    def extract_number(text):
        if not text: return 0
        nums = re.findall(r'[\d,]+\.?\d*', str(text))
        return float(nums[0].replace(',', '')) if nums else 0
    
    for filename, company in medical_data:
        with open(data_dir / filename, "r", encoding="utf-8") as f:
            data = json.load(f)
            for plan in data["plans"]:
                # Handle premiums
                premiums = []
                if isinstance(plan.get("premiums"), list):
                    premiums = plan["premiums"]
                
                products.append({
                    "id": len(products) + 1,
                    "name": plan["plan_name"],
                    "category": "medical",
                    "company": company,
                    "annual_limit": extract_number(plan.get("annual_limit")),
                    "co_payment": plan.get("co_payment"),
                    "hospital_network": plan.get("hospital_network"),
                    "maternity_cover": plan.get("maternity_cover"),
                    "chronic_cover": plan.get("chronic_cover"),
                    "dental_optical": plan.get("dental_optical"),
                    "waiting_period_natural": plan.get("waiting_period"),
                    "premiums": premiums
                })
    
    print(f"✅ Loaded {len(products)} products")
    return products

# Load products on startup
PRODUCTS = load_products()

@app.get("/")
def root():
    return {"message": "BotsuInsure API - Compare Botswana Insurance Plans"}

@app.get("/api/products", response_model=List[dict])
def get_products(category: Optional[str] = None, company: Optional[str] = None):
    filtered = PRODUCTS
    
    if category:
        filtered = [p for p in filtered if p["category"] == category]
    if company:
        filtered = [p for p in filtered if company.lower() in p["company"]["name"].lower()]
    
    return filtered

@app.get("/api/products/{product_id}", response_model=dict)
def get_product(product_id: int):
    product = next((p for p in PRODUCTS if p["id"] == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.get("/api/compare")
def compare_products(product_ids: str, salary: Optional[float] = None):
    ids = [int(id) for id in product_ids.split(",") if id.strip().isdigit()]
    products = [p for p in PRODUCTS if p["id"] in ids]
    
    comparison = []
    for p in products:
        item = {
            "id": p["id"],
            "name": p["name"],
            "company": p["company"]["name"],
            "category": p["category"],
            "key_features": p.get("key_features", []),
            "waiting_period_natural": p.get("waiting_period_natural")
        }
        
        if p["category"] == "medical":
            item.update({
                "annual_limit": p.get("annual_limit"),
                "co_payment": p.get("co_payment"),
                "hospital_network": p.get("hospital_network")
            })
        else:
            item.update({
                "sum_assured": p.get("sum_assured"),
                "premiums": p.get("premiums", [])
            })
        
        comparison.append(item)
    
    return {"comparison": comparison}

@app.post("/api/leads")
def create_lead(lead: dict):
    return {
        "success": True,
        "message": "Lead submitted successfully.",
        "lead_id": f"LEAD-{datetime.now().timestamp()}",
        "data": lead
    }

@app.get("/api/companies")
def get_companies():
    companies = [
        {"id": 1, "name": "Liberty Life Botswana (Pty) Limited", "type": "life_funeral"},
        {"id": 2, "name": "Metropolitan Life Botswana", "type": "life"},
        {"id": 3, "name": "Botsogo Health Plan", "type": "medical"},
        {"id": 4, "name": "Botswana Public Officers Medical Aid Scheme (BPOMAS)", "type": "medical"},
        {"id": 5, "name": "Pula Medical Aid Fund (Pulamed)", "type": "medical"},
    ]
    return companies

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)