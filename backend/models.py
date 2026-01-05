from sqlalchemy import Column, Integer, String, Float, Text, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    type = Column(String(50))  # medical, life, funeral, etc.
    description = Column(Text, nullable=True)
    
    products = relationship("Product", back_populates="company")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)  # medical, life, funeral, hospital_cash
    company_id = Column(Integer, ForeignKey("companies.id"))
    
    # Common fields
    description = Column(Text, nullable=True)
    waiting_period_natural = Column(String(100), nullable=True)
    waiting_period_accidental = Column(String(100), nullable=True)
    age_min = Column(Integer, nullable=True)
    age_max = Column(Integer, nullable=True)
    exclusions = Column(Text, nullable=True)
    key_features = Column(JSON, nullable=True)  # Store as JSON array
    
    # Medical specific
    annual_limit = Column(Float, nullable=True)
    co_payment = Column(String(200), nullable=True)
    hospital_network = Column(Text, nullable=True)
    maternity_cover = Column(Text, nullable=True)
    chronic_cover = Column(Text, nullable=True)
    dental_optical = Column(Text, nullable=True)
    
    # Life/Funeral specific
    sum_assured = Column(String(200), nullable=True)
    
    # Pricing
    premiums = Column(JSON, nullable=True)  # Store premium array
    
    company = relationship("Company", back_populates="products")

class PricingRule(Base):
    __tablename__ = "pricing_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    min_salary = Column(Float, nullable=True)
    max_salary = Column(Float, nullable=True)
    monthly_premium = Column(Float, nullable=False)
    
    product = relationship("Product")