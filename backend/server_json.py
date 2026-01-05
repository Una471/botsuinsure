from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import re
from pathlib import Path
from typing import List, Optional

app = FastAPI(title="BotsuInsure API", description="Botswana Insurance Comparison")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the correct path to data folder
current_dir = Path(__file__).parent
data_dir = current_dir.parent / "data"

def extract_number(text):
    """Extract numbers from strings like 'BWP 2,215,000'"""
    if not text:
        return 0
    numbers = re.findall(r'[\d,]+\.?\d*', str(text))
    if numbers:
        return float(numbers[0].replace(',', ''))
    return 0

# Load all JSON data
def load_all_data():
    all_products = []
    product_counter = 1
    
    companies = [
        {"id": 1, "name": "Liberty Life Botswana (Pty) Limited", "type": "life_funeral"},
        {"id": 2, "name": "Metropolitan Life Botswana", "type": "life"},
        {"id": 3, "name": "Botsogo Health Plan", "type": "medical"},
        {"id": 4, "name": "Botswana Public Officers Medical Aid Scheme (BPOMAS)", "type": "medical"},
        {"id": 5, "name": "Pula Medical Aid Fund (Pulamed)", "type": "medical"},
    ]
    
    # 1. Liberty Funeral
    with open(data_dir / "funeral_liberty_boago.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        for product in data["products"]:
            product_name = product.get("name") or product.get("product_name") or "Unknown Product"
            all_products.append({
                "id": product_counter,
                "name": product_name,
                "category": product.get("category", "funeral"),
                "company_id": 1,
                "company": companies[0],
                "sum_assured": product.get("sum_assured"),
                "premiums": product.get("premiums", []),
                "waiting_period_natural": product.get("waiting_period_natural"),
                "waiting_period_accidental": product.get("waiting_period_accidental"),
                "age_min": product.get("age_min"),
                "age_max": product.get("age_max"),
                "key_features": product.get("key_features", []),
                "exclusions": product.get("exclusions")
            })
            product_counter += 1
    
    # 2. Liberty Hospital Cash
    with open(data_dir / "hospital_cashback.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        for product in data["products"]:
            product_name = product.get("name") or product.get("product_name") or "Unknown Product"
            all_products.append({
                "id": product_counter,
                "name": product_name,
                "category": product.get("category", "hospital_cash"),
                "company_id": 1,
                "company": companies[0],
                "sum_assured": product.get("sum_assured"),
                "premiums": product.get("premiums", []),
                "waiting_period_natural": product.get("waiting_period_natural"),
                "waiting_period_accidental": product.get("waiting_period_accidental"),
                "age_min": product.get("age_min"),
                "age_max": product.get("age_max"),
                "key_features": product.get("key_features", []),
                "exclusions": product.get("exclusions")
            })
            product_counter += 1
    
    # 3. Metropolitan Life
    with open(data_dir / "life_metropolitan_mothusi.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        for product in data["products"]:
            product_name = product.get("name") or product.get("product_name") or "Unknown Product"
            all_products.append({
                "id": product_counter,
                "name": product_name,
                "category": product.get("category", "life"),
                "company_id": 2,
                "company": companies[1],
                "sum_assured": product.get("sum_assured"),
                "premiums": product.get("premiums", []),
                "waiting_period_natural": product.get("waiting_period_natural"),
                "waiting_period_accidental": product.get("waiting_period_accidental"),
                "age_min": product.get("age_min"),
                "age_max": product.get("age_max"),
                "key_features": product.get("key_features", []),
                "exclusions": product.get("exclusions")
            })
            product_counter += 1
    
    # 4. Medical plans
    medical_files = [
        ("medical_botsogo_2025.json", 3),
        ("medical_bpomas_2025.json", 4),
        ("medical_pulamed_2025.json", 5),
    ]
    
    for filename, company_id in medical_files:
        with open(data_dir / filename, "r", encoding="utf-8") as f:
            data = json.load(f)
            if "plans" in data:
                for plan in data["plans"]:
                    # Handle premiums
                    premiums = []
                    if isinstance(plan.get("premiums"), list):
                        premiums = plan["premiums"]
                    elif plan.get("premiums") and isinstance(plan["premiums"], str):
                        matches = re.findall(r'(\d+(?:,\d+)*(?:\.\d+)?)', plan["premiums"])
                        if matches:
                            try:
                                premium_value = float(matches[0].replace(',', ''))
                                premiums = [{"monthly_premium": premium_value}]
                            except:
                                pass
                    
                    all_products.append({
                        "id": product_counter,
                        "name": plan.get("plan_name", "Unknown Plan"),
                        "category": "medical",
                        "company_id": company_id,
                        "company": companies[company_id - 1],
                        "annual_limit": extract_number(plan.get("annual_limit", "0")),
                        "co_payment": plan.get("co_payment"),
                        "hospital_network": plan.get("hospital_network"),
                        "maternity_cover": plan.get("maternity_cover"),
                        "chronic_cover": plan.get("chronic_cover"),
                        "dental_optical": plan.get("dental_optical"),
                        "waiting_period_natural": plan.get("waiting_period"),
                        "premiums": premiums,
                        "key_features": []
                    })
                    product_counter += 1
    
    print(f"✅ Loaded {len(all_products)} products from JSON files")
    for product in all_products:
        print(f"  - {product['name']} ({product['company']['name']})")
    
    return all_products, companies

# Load data
ALL_PRODUCTS, ALL_COMPANIES = load_all_data()

# Rest of the API endpoints stay the same as before...
@app.get("/")
def root():
    return {"message": "BotsuInsure API - Compare Botswana Insurance Plans"}

@app.get("/api/products")
def get_products(category: Optional[str] = None, company: Optional[str] = None):
    filtered = ALL_PRODUCTS
    
    if category:
        filtered = [p for p in filtered if p.get("category") == category]
    
    if company:
        filtered = [p for p in filtered if company.lower() in p["company"]["name"].lower()]
    
    return filtered

@app.get("/api/products/{product_id}")
def get_product(product_id: int):
    product = next((p for p in ALL_PRODUCTS if p.get("id") == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.get("/api/compare")
def compare_products(product_ids: str, salary: Optional[float] = None):
    ids = [int(id.strip()) for id in product_ids.split(",") if id.strip().isdigit()]
    
    products = [p for p in ALL_PRODUCTS if p.get("id") in ids]
    
    comparison_data = []
    for product in products:
        item = {
            "id": product.get("id"),
            "name": product.get("name"),
            "company": product.get("company", {}).get("name", ""),
            "category": product.get("category", ""),
            "key_features": product.get("key_features", []),
            "waiting_period_natural": product.get("waiting_period_natural"),
            "waiting_period_accidental": product.get("waiting_period_accidental")
        }
        
        if product.get("category") == "medical":
            item.update({
                "annual_limit": product.get("annual_limit"),
                "co_payment": product.get("co_payment"),
                "hospital_network": product.get("hospital_network"),
                "calculated_premium": calculate_medical_premium(product, salary) if salary else None
            })
        else:
            item.update({
                "sum_assured": product.get("sum_assured"),
                "premiums": product.get("premiums", [])
            })
        
        comparison_data.append(item)
    
    return {"comparison": comparison_data}

def calculate_medical_premium(product, salary):
    premiums = product.get("premiums", [])
    if not premiums:
        return None
    
    for premium in premiums:
        if isinstance(premium, dict):
            min_salary = premium.get("min_salary", 0)
            max_salary = premium.get("max_salary", float('inf'))
            if min_salary <= salary <= max_salary:
                return premium.get("monthly_premium")
    
    return None

@app.post("/api/leads")
def create_lead(lead: dict):
    return {
        "success": True,
        "message": "Lead submitted successfully.",
        "lead_id": f"LEAD-{len(ALL_PRODUCTS) + 1}",
        "data": lead
    }

@app.get("/api/companies")
def get_companies():
    return ALL_COMPANIES

@app.get("/api/products/calculate")
def calculate_premiums(salary: float, category: str = "medical"):
    products = [p for p in ALL_PRODUCTS if p.get("category") == category]
    
    result = []
    for product in products:
        calculated_premium = calculate_medical_premium(product, salary) if salary else None
        
        result.append({
            "id": product["id"],
            "name": product["name"],
            "company": product["company"],
            "category": product["category"],
            "annual_limit": product.get("annual_limit"),
            "co_payment": product.get("co_payment"),
            "waiting_period_natural": product.get("waiting_period_natural"),
            "premiums": product.get("premiums", []),
            "calculated_premium": calculated_premium
        })
    
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)