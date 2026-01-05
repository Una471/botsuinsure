// api/products.js - SIMPLE VERSION
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load JSON data
const loadJSON = (filename) => {
  try {
    const filePath = path.join(__dirname, '..', 'data', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return { products: [], plans: [] };
  }
};

// Load all data
const funeral = loadJSON('funeral_liberty_boago.json');
const hospital = loadJSON('hospital_cashback.json');
const life = loadJSON('life_metropolitan_mothusi.json');
const botsogo = loadJSON('medical_botsogo_2025.json');
const bpomas = loadJSON('medical_bpomas_2025.json');
const pulamed = loadJSON('medical_pulamed_2025.json');

// All products
let allProducts = [];

// Add products
let id = 1;

// Liberty Funeral
if (funeral.products) {
  funeral.products.forEach(p => {
    allProducts.push({
      id: id++,
      name: p.product_name || 'Unknown',
      category: p.category || 'funeral',
      company: 'Liberty Life Botswana (Pty) Limited',
      sum_assured: p.sum_assured,
      premiums: p.premiums || [],
      waiting_period_natural: p.waiting_period_natural,
      key_features: p.key_features || []
    });
  });
}

// Liberty Hospital Cash
if (hospital.products) {
  hospital.products.forEach(p => {
    allProducts.push({
      id: id++,
      name: p.product_name || 'Unknown',
      category: p.category || 'hospital_cash',
      company: 'Liberty Life Botswana (Pty) Limited',
      sum_assured: p.sum_assured,
      premiums: p.premiums || [],
      waiting_period_natural: p.waiting_period_natural,
      key_features: p.key_features || []
    });
  });
}

// Metropolitan Life
if (life.products) {
  life.products.forEach(p => {
    allProducts.push({
      id: id++,
      name: p.product_name || 'Unknown',
      category: p.category || 'life',
      company: 'Metropolitan Life Botswana',
      sum_assured: p.sum_assured,
      premiums: p.premiums || [],
      waiting_period_natural: p.waiting_period_natural,
      key_features: p.key_features || []
    });
  });
}

// Medical plans
const addMedicalPlans = (plans, companyName) => {
  if (plans) {
    plans.forEach(plan => {
      allProducts.push({
        id: id++,
        name: plan.plan_name || 'Unknown',
        category: 'medical',
        company: companyName,
        annual_limit: plan.annual_limit,
        co_payment: plan.co_payment,
        hospital_network: plan.hospital_network,
        waiting_period_natural: plan.waiting_period,
        premiums: plan.premiums || [],
        key_features: []
      });
    });
  }
};

addMedicalPlans(botsogo.plans, 'Botsogo Health Plan');
addMedicalPlans(bpomas.plans, 'Botswana Public Officers Medical Aid Scheme (BPOMAS)');
addMedicalPlans(pulamed.plans, 'Pula Medical Aid Fund (Pulamed)');

console.log(`Total products: ${allProducts.length}`);

// API Handler
export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { method, url, query } = req;
  const path = url.split('?')[0];
  
  // GET /api/products
  if (method === 'GET' && path === '/api/products') {
    let filtered = [...allProducts];
    
    if (query.category) {
      filtered = filtered.filter(p => p.category === query.category);
    }
    
    if (query.company) {
      filtered = filtered.filter(p => 
        p.company.toLowerCase().includes(query.company.toLowerCase())
      );
    }
    
    res.status(200).json(filtered);
    return;
  }
  
  // GET /api/compare
  if (method === 'GET' && path === '/api/compare') {
    const ids = query.product_ids ? query.product_ids.split(',').map(id => parseInt(id)) : [];
    const products = allProducts.filter(p => ids.includes(p.id));
    
    res.status(200).json({ comparison: products });
    return;
  }
  
  // POST /api/leads
  if (method === 'POST' && path === '/api/leads') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const leadData = JSON.parse(body || '{}');
      res.status(200).json({
        success: true,
        message: 'Lead submitted',
        lead_id: `LEAD-${Date.now()}`,
        data: leadData
      });
    });
    return;
  }
  
  // GET /api/companies
  if (method === 'GET' && path === '/api/companies') {
    const companies = [
      'Liberty Life Botswana (Pty) Limited',
      'Metropolitan Life Botswana',
      'Botsogo Health Plan',
      'Botswana Public Officers Medical Aid Scheme (BPOMAS)',
      'Pula Medical Aid Fund (Pulamed)'
    ];
    res.status(200).json(companies.map((name, idx) => ({ id: idx + 1, name })));
    return;
  }
  
  // Default 404
  res.status(404).json({ error: 'Not found' });
}