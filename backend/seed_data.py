import json
import os
import re
from sqlalchemy.orm import Session
from models import Company, Product, PricingRule
from database import engine, Base

def extract_number(text):
    """Extract numbers from strings like 'BWP 2,215,000'"""
    if not text:
        return 0
    numbers = re.findall(r'[\d,]+\.?\d*', str(text))
    if numbers:
        return float(numbers[0].replace(',', ''))
    return 0

def seed_database():
    Base.metadata.create_all(bind=engine)
    
    from database import SessionLocal
    db = SessionLocal()
    
    try:
        # Clear existing data
        db.query(PricingRule).delete()
        db.query(Product).delete()
        db.query(Company).delete()
        
        # Create companies from YOUR data
        companies_data = [
            {"name": "Liberty Life Botswana (Pty) Limited", "type": "life_funeral"},
            {"name": "Metropolitan Life Botswana", "type": "life"},
            {"name": "Botsogo Health Plan", "type": "medical"},
            {"name": "Botswana Public Officers Medical Aid Scheme (BPOMAS)", "type": "medical"},
            {"name": "Pula Medical Aid Fund (Pulamed)", "type": "medical"},
        ]
        
        companies = {}
        for company_data in companies_data:
            company = Company(**company_data)
            db.add(company)
            db.flush()  # Get ID
            companies[company.name] = company.id
        
        db.commit()
        
        # Load and process YOUR JSON files
        json_files = [
            ("funeral_liberty_boago.json", "Liberty Life Botswana (Pty) Limited"),
            ("hospital_cashback.json", "Liberty Life Botswana (Pty) Limited"),
            ("life_metropolitan_mothusi.json", "Metropolitan Life Botswana"),
            ("medical_botsogo_2025.json", "Botsogo Health Plan"),
            ("medical_bpomas_2025.json", "Botswana Public Officers Medical Aid Scheme (BPOMAS)"),
            ("medical_pulamed_2025.json", "Pula Medical Aid Fund (Pulamed)"),
        ]
        
        for filename, company_name in json_files:
            filepath = os.path.join("..", "data", filename)
            
            if not os.path.exists(filepath):
                print(f"Warning: {filepath} not found")
                continue
                
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            company_id = companies[company_name]
            
            if "plans" in data:  # Medical data
                for plan in data["plans"]:
                    # Handle premiums properly
                    premiums = []
                    if isinstance(plan.get("premiums"), list):
                        premiums = plan["premiums"]
                    elif plan.get("premiums") and isinstance(plan["premiums"], str):
                        # Try to extract premium from string
                        premium_text = plan["premiums"]
                        if "P" in premium_text or "p" in premium_text:
                            # Extract first number found
                            matches = re.findall(r'(\d+(?:,\d+)*(?:\.\d+)?)', premium_text)
                            if matches:
                                try:
                                    premium_value = float(matches[0].replace(',', ''))
                                    premiums = [{"monthly_premium": premium_value}]
                                except:
                                    pass
                    
                    product = Product(
                        name=plan["plan_name"],
                        category="medical",
                        company_id=company_id,
                        annual_limit=extract_number(plan.get("annual_limit", "0")),
                        co_payment=plan.get("co_payment"),
                        hospital_network=plan.get("hospital_network"),
                        maternity_cover=plan.get("maternity_cover"),
                        chronic_cover=plan.get("chronic_cover"),
                        dental_optical=plan.get("dental_optical"),
                        waiting_period_natural=plan.get("waiting_period"),
                        key_features=[],
                        premiums=premiums
                    )
                    db.add(product)
                    db.flush()
                    
                    # Add pricing rules if premiums exist as structured data
                    if isinstance(plan.get("premiums"), list):
                        for premium_data in plan["premiums"]:
                            if isinstance(premium_data, dict) and "monthly_premium" in premium_data:
                                pricing_rule = PricingRule(
                                    product_id=product.id,
                                    min_salary=premium_data.get("min_salary"),
                                    max_salary=premium_data.get("max_salary"),
                                    monthly_premium=premium_data["monthly_premium"]
                                )
                                db.add(pricing_rule)
            
            elif "products" in data:  # Life/Funeral data
                for product_data in data["products"]:
                    # Ensure premiums is a list
                    premiums = product_data.get("premiums", [])
                    if not isinstance(premiums, list):
                        premiums = []
                    
                    product = Product(
                        name=product_data["product_name"],
                        category=product_data["category"],
                        company_id=company_id,
                        sum_assured=product_data.get("sum_assured"),
                        waiting_period_natural=product_data.get("waiting_period_natural"),
                        waiting_period_accidental=product_data.get("waiting_period_accidental"),
                        age_min=product_data.get("age_min"),
                        age_max=product_data.get("age_max"),
                        exclusions=product_data.get("exclusions"),
                        key_features=product_data.get("key_features", []),
                        premiums=premiums
                    )
                    db.add(product)
        
        db.commit()
        print("=" * 60)
        print("Database seeded successfully with REAL Botswana insurance data!")
        print("=" * 60)
        print(f"✓ Added {len(companies)} companies")
        
        # Count products by category
        medical_count = db.query(Product).filter(Product.category == "medical").count()
        life_count = db.query(Product).filter(Product.category == "life").count()
        funeral_count = db.query(Product).filter(Product.category == "funeral").count()
        hospital_cash_count = db.query(Product).filter(Product.category == "hospital_cash").count()
        
        print(f"✓ Medical Plans: {medical_count}")
        print(f"✓ Life Insurance: {life_count}")
        print(f"✓ Funeral Plans: {funeral_count}")
        print(f"✓ Hospital Cash: {hospital_cash_count}")
        print(f"✓ TOTAL PRODUCTS: {medical_count + life_count + funeral_count + hospital_cash_count}")
        print("=" * 60)
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()