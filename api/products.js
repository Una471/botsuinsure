// api/products.js - Vercel Serverless Function
import fs from 'fs';
import path from 'path';

// Helper to read JSON files
function readJSON(filename) {
  const filePath = path.join(process.cwd(), 'data', filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Load all data
const funeral = readJSON('funeral_liberty_boago.json');
const hospital = readJSON('hospital_cashback.json');
const life = readJSON('life_metropolitan_mothusi.json');
const botsogo = readJSON('medical_botsogo_2025.json');
const bpomas = readJSON('medical_bpomas_2025.json');
const pulamed = readJSON('medical_pulamed_2025.json');

// Companies data
const companies = [
  { id: 1, name: "Liberty Life Botswana (Pty) Limited", type: "life_funeral" },
  { id: 2, name: "Metropolitan Life Botswana", type: "life" },
  { id: 3, name: "Botsogo Health Plan", type: "medical" },
  { id: 4, name: "Botswana Public Officers Medical Aid Scheme (BPOMAS)", type: "medical" },
  { id: 5, name: "Pula Medical Aid Fund (Pulamed)", type: "medical" },
];

// Combine all products
let allProducts = [];
let productId = 1;

// Helper function
function extractNumber(text) {
  if (!text) return 0;
  const numbers = text.toString().match(/[\d,]+\.?\d*/g);
  if (numbers) {
    return parseFloat(numbers[0].replace(/,/g, ''));
  }
  return 0;
}

// 1. Add Liberty products
funeral.products.forEach(p => {
  allProducts.push({
    id: productId++,
    name: p.product_name,
    category: p.category,
    company_id: 1,
    company: companies[0],
    sum_assured: p.sum_assured,
    premiums: p.premiums || [],
    waiting_period_natural: p.waiting_period_natural,
    waiting_period_accidental: p.waiting_period_accidental,
    age_min: p.age_min,
    age_max: p.age_max,
    key_features: p.key_features || [],
    exclusions: p.exclusions
  });
});

hospital.products.forEach(p => {
  allProducts.push({
    id: productId++,
    name: p.product_name,
    category: p.category,
    company_id: 1,
    company: companies[0],
    sum_assured: p.sum_assured,
    premiums: p.premiums || [],
    waiting_period_natural: p.waiting_period_natural,
    waiting_period_accidental: p.waiting_period_accidental,
    age_min: p.age_min,
    age_max: p.age_max,
    key_features: p.key_features || [],
    exclusions: p.exclusions
  });
});

// 2. Add Metropolitan products
life.products.forEach(p => {
  allProducts.push({
    id: productId++,
    name: p.product_name,
    category: p.category,
    company_id: 2,
    company: companies[1],
    sum_assured: p.sum_assured,
    premiums: p.premiums || [],
    waiting_period_natural: p.waiting_period_natural,
    waiting_period_accidental: p.waiting_period_accidental,
    age_min: p.age_min,
    age_max: p.age_max,
    key_features: p.key_features || [],
    exclusions: p.exclusions
  });
});

// 3. Add Medical plans
// Botsogo
botsogo.plans.forEach(plan => {
  allProducts.push({
    id: productId++,
    name: plan.plan_name,
    category: 'medical',
    company_id: 3,
    company: companies[2],
    annual_limit: extractNumber(plan.annual_limit),
    co_payment: plan.co_payment,
    hospital_network: plan.hospital_network,
    maternity_cover: plan.maternity_cover,
    chronic_cover: plan.chronic_cover,
    dental_optical: plan.dental_optical,
    waiting_period_natural: plan.waiting_period,
    premiums: [],
    key_features: []
  });
});

// BPOMAS
bpomas.plans.forEach(plan => {
  allProducts.push({
    id: productId++,
    name: plan.plan_name,
    category: 'medical',
    company_id: 4,
    company: companies[3],
    annual_limit: plan.annual_limit,
    co_payment: plan.co_payment,
    hospital_network: plan.hospital_network,
    maternity_cover: plan.maternity_cover,
    chronic_cover: plan.chronic_cover,
    dental_optical: plan.dental_optical,
    waiting_period_natural: plan.waiting_period,
    premiums: plan.premiums || [],
    key_features: []
  });
});

// PulaMed
pulamed.plans.forEach(plan => {
  allProducts.push({
    id: productId++,
    name: plan.plan_name,
    category: 'medical',
    company_id: 5,
    company: companies[4],
    annual_limit: plan.annual_limit,
    co_payment: plan.co_payment,
    hospital_network: plan.hospital_network,
    maternity_cover: plan.maternity_cover,
    chronic_cover: plan.chronic_cover,
    dental_optical: plan.dental_optical,
    waiting_period_natural: plan.waiting_period,
    premiums: plan.premiums || [],
    key_features: []
  });
});

console.log(`Loaded ${allProducts.length} products`);

// Main API handler
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { query } = req;
  const path = req.url.split('?')[0];
  
  // GET /api/products
  if (path === '/api/products' || path === '/api/products/') {
    let filtered = [...allProducts];
    
    if (query.category) {
      filtered = filtered.filter(p => p.category === query.category);
    }
    
    if (query.company) {
      filtered = filtered.filter(p => 
        p.company.name.toLowerCase().includes(query.company.toLowerCase())
      );
    }
    
    res.status(200).json(filtered);
    return;
  }
  
  // GET /api/products/{id}
  else if (path.startsWith('/api/products/')) {
    const id = parseInt(path.split('/').pop());
    const product = allProducts.find(p => p.id === id);
    
    if (product) {
      res.status(200).json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
    return;
  }
  
  // GET /api/compare
  else if (path === '/api/compare' || path === '/api/compare/') {
    const productIds = query.product_ids ? query.product_ids.split(',').map(id => parseInt(id)) : [];
    const salary = query.salary ? parseFloat(query.salary) : null;
    
    const products = allProducts.filter(p => productIds.includes(p.id));
    
    const comparisonData = products.map(product => {
      const item = {
        id: product.id,
        name: product.name,
        company: product.company.name,
        category: product.category,
        key_features: product.key_features || [],
        waiting_period_natural: product.waiting_period_natural,
        waiting_period_accidental: product.waiting_period_accidental
      };
      
      if (product.category === 'medical') {
        item.annual_limit = product.annual_limit;
        item.co_payment = product.co_payment;
        item.hospital_network = product.hospital_network;
        
        // Calculate premium
        if (salary && product.premiums && product.premiums.length > 0) {
          const rule = product.premiums.find(p => 
            (!p.min_salary || salary >= p.min_salary) && 
            (!p.max_salary || salary <= p.max_salary)
          );
          item.calculated_premium = rule ? rule.monthly_premium : null;
        }
      } else {
        item.sum_assured = product.sum_assured;
        item.premiums = product.premiums || [];
      }
      
      return item;
    });
    
    res.status(200).json({ comparison: comparisonData });
    return;
  }
  
  // POST /api/leads
  else if (req.method === 'POST' && (path === '/api/leads' || path === '/api/leads/')) {
    const leadData = req.body;
    
    res.status(200).json({
      success: true,
      message: "Lead submitted successfully. The insurer will contact you shortly.",
      lead_id: `LEAD-${Date.now()}`,
      data: leadData
    });
    return;
  }
  
  // GET /api/companies
  else if (path === '/api/companies' || path === '/api/companies/') {
    res.status(200).json(companies);
    return;
  }
  
  // GET /api/products/calculate
  else if (path === '/api/products/calculate' || path === '/api/products/calculate/') {
    const salary = parseFloat(query.salary) || 0;
    const category = query.category || 'medical';
    
    const products = allProducts.filter(p => p.category === category);
    
    const result = products.map(product => {
      let calculated_premium = null;
      
      if (product.premiums && product.premiums.length > 0) {
        const rule = product.premiums.find(p => 
          (!p.min_salary || salary >= p.min_salary) && 
          (!p.max_salary || salary <= p.max_salary)
        );
        calculated_premium = rule ? rule.monthly_premium : null;
      }
      
      return {
        id: product.id,
        name: product.name,
        company: product.company,
        category: product.category,
        annual_limit: product.annual_limit,
        co_payment: product.co_payment,
        waiting_period_natural: product.waiting_period_natural,
        premiums: product.premiums || [],
        calculated_premium: calculated_premium
      };
    });
    
    res.status(200).json(result);
    return;
  }
  
  // GET /api/ (root)
  else if (path === '/api' || path === '/api/') {
    res.status(200).json({ message: "BotsuInsure API - Compare Botswana Insurance Plans" });
    return;
  }
  
  // Not found
  res.status(404).json({ error: 'Endpoint not found' });
}