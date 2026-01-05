from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class CompanyResponse(BaseModel):
    id: int
    name: str
    type: str
    
    class Config:
        from_attributes = True

class ProductResponse(BaseModel):
    id: int
    name: str
    category: str
    company: CompanyResponse
    annual_limit: Optional[float] = None
    sum_assured: Optional[str] = None
    waiting_period_natural: Optional[str] = None
    waiting_period_accidental: Optional[str] = None
    
    class Config:
        from_attributes = True

class ProductDetailResponse(ProductResponse):
    description: Optional[str] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    exclusions: Optional[str] = None
    key_features: List[str] = []
    premiums: List[Dict[str, Any]] = []
    co_payment: Optional[str] = None
    hospital_network: Optional[str] = None
    maternity_cover: Optional[str] = None
    chronic_cover: Optional[str] = None
    dental_optical: Optional[str] = None

class LeadCreate(BaseModel):
    product_id: int
    name: str
    phone: str
    email: str
    notes: Optional[str] = None

class ComparisonResponse(BaseModel):
    comparison: List[Dict[str, Any]]