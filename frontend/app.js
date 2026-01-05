const API_BASE = "/api";
let selectedProducts = new Set();

// Load all products on page load
document.addEventListener('DOMContentLoaded', function() {
    loadMedicalPlans();
    loadLifePlans();
    loadFuneralPlans();
    loadHospitalCashPlans();
    
    // Setup lead form
    document.getElementById('leadForm').addEventListener('submit', submitLead);
    
    // Update selected count display
    updateSelectedCount();
});

async function loadMedicalPlans() {
    try {
        const response = await fetch(`${API_BASE}/api/products?category=medical`);
        const products = await response.json();
        displayMedicalPlans(products);
    } catch (error) {
        console.error('Error loading medical plans:', error);
    }
}

async function loadLifePlans() {
    try {
        const response = await fetch(`${API_BASE}/api/products?category=life`);
        const products = await response.json();
        displayProducts(products, 'lifePlans');
    } catch (error) {
        console.error('Error loading life plans:', error);
    }
}

async function loadFuneralPlans() {
    try {
        const response = await fetch(`${API_BASE}/api/products?category=funeral`);
        const products = await response.json();
        displayProducts(products, 'funeralPlans');
    } catch (error) {
        console.error('Error loading funeral plans:', error);
    }
}

async function loadHospitalCashPlans() {
    try {
        const response = await fetch(`${API_BASE}/api/products?category=hospital_cash`);
        const products = await response.json();
        displayProducts(products, 'hospitalCashPlans');
    } catch (error) {
        console.error('Error loading hospital cash plans:', error);
    }
}

function displayMedicalPlans(products) {
    const container = document.getElementById('medicalPlans');
    container.innerHTML = '';
    
    products.forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });
}

function displayProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    products.forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });
}

function createProductCard(product) {
    const div = document.createElement('div');
    div.className = 'col-md-4 mb-4';
    
    // Get product image
    const productImage = getProductImage(product.name, product.company.name);
    
    // Get company logo data
    const logoData = getCompanyLogo(product.company.name);
    
    // Get price display
let priceHtml = '';
if (product.category === 'medical') {
    if (product.calculated_premium && product.calculated_premium !== 'N/A') {
        // Show calculated premium
        priceHtml = `
            <div class="price-badge calculated">
                <span class="badge bg-info">Calculated</span>
                P${product.calculated_premium}/month
                <small class="d-block text-white-50">For your salary</small>
            </div>
        `;
    } else {
        const minPremium = getMinPremium(product.premiums);
        if (minPremium !== 'N/A') {
            priceHtml = `<div class="price-badge">From P${minPremium}/month</div>`;
        } else {
            priceHtml = `<div class="price-badge text-muted">Premium on request</div>`;
        }
    }
}
    
    // Create logo HTML - Simplified without company name badge
let logoHtml = '';
if (logoData.image) {
    logoHtml = `
        <div class="company-logo-container">
            <img src="${logoData.image}" alt="${logoData.name}" class="company-logo">
        </div>
    `;
} else {
    logoHtml = `
        <div class="company-logo-container">
            <div class="company-logo-placeholder" style="background: ${logoData.bgColor};">
                ${logoData.text}
            </div>
        </div>
    `;
}
    
    div.innerHTML = `
        <div class="card product-card h-100">
            <!-- Product Image with Company Logo -->
            <div class="product-image" style="background-image: url('${productImage}')">
                <div class="product-overlay"></div>
                ${logoHtml}
            </div>
            
            <!-- Product Details -->
            <div class="card-body">
                <h5 class="card-title product-title">${product.name}</h5>
                <h6 class="card-subtitle mb-2 product-company">${product.company.name}</h6>
                
                ${priceHtml}
                
                <div class="product-features">
                    ${product.annual_limit ? `<p><strong>Annual Limit:</strong> P${formatNumber(product.annual_limit)}</p>` : ''}
                    ${product.sum_assured ? `<p><strong>Cover:</strong> ${product.sum_assured}</p>` : ''}
                    ${product.waiting_period_natural ? `<p><strong>Waiting Period:</strong> ${product.waiting_period_natural}</p>` : ''}
                    ${product.co_payment ? `<p><strong>Co-payment:</strong> ${product.co_payment}</p>` : ''}
                </div>
                
                <div class="mt-auto">
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <button class="btn btn-get-quote" onclick="showLeadForm(${product.id})">
                            <i class="fas fa-quote-right me-1"></i> Get Quote
                        </button>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input compare-checkbox" 
                                   type="checkbox" 
                                   onclick="toggleCompare(${product.id})" 
                                   id="compare${product.id}"
                                   ${selectedProducts.has(product.id) ? 'checked' : ''}>
                            <label class="form-check-label compare-label" for="compare${product.id}">
                                <i class="fas fa-balance-scale me-1"></i> Compare
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return div;
}

function getCompanyLogo(companyName) {
    const logos = {
        'Pula Medical Aid Fund (Pulamed)': 'images/logos/pulamed.png',
        'Botswana Public Officers Medical Aid Scheme (BPOMAS)': 'images/logos/bpomas.png',
        'Botsogo Health Plan': 'images/logos/botsogo.png',
        'Liberty Life Botswana (Pty) Limited': 'images/logos/liberty.png',
        'Metropolitan Life Botswana': 'images/logos/metropolitan.png'
    };
    
    for (const [key, value] of Object.entries(logos)) {
        if (companyName.includes(key.split(' ')[0])) {
            return value;
        }
    }
    return null;
}

function getCompanyColor(companyName) {
    const colors = {
        'Pula Medical Aid Fund (Pulamed)': '#4CAF50',
        'Botswana Public Officers Medical Aid Scheme (BPOMAS)': '#2196F3',
        'Botsogo Health Plan': '#FF9800',
        'Liberty Life Botswana (Pty) Limited': '#9C27B0',
        'Metropolitan Life Botswana': '#F44336'
    };
    
    for (const [key, value] of Object.entries(colors)) {
        if (companyName.includes(key.split(' ')[0])) {
            return value;
        }
    }
    return '#6c757d';
}

function getMinPremium(premiums) {
    if (!premiums || premiums.length === 0) return 'N/A';
    
    // If premiums is a string, try to extract number
    if (typeof premiums === 'string') {
        const matches = premiums.match(/\d+(?:,\d+)*(?:\.\d+)?/);
        return matches ? matches[0].replace(',', '') : 'N/A';
    }
    
    // Handle array of objects
    if (Array.isArray(premiums)) {
        let min = Infinity;
        premiums.forEach(p => {
            if (p && p.monthly_premium && p.monthly_premium < min) {
                min = p.monthly_premium;
            }
        });
        
        return min === Infinity ? 'N/A' : min;
    }
    
    return 'N/A';
}

function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function toggleCompare(productId) {
    const checkbox = document.getElementById(`compare${productId}`);
    
    if (checkbox.checked) {
        selectedProducts.add(productId);
    } else {
        selectedProducts.delete(productId);
    }
    
    updateSelectedCount();
    
    // Auto-show comparison if at least 2 selected
    if (selectedProducts.size >= 2) {
        // Don't auto-show, just update count
    }
}

function updateSelectedCount() {
    const countElement = document.getElementById('selectedCount');
    if (countElement) {
        countElement.textContent = selectedProducts.size;
        countElement.className = selectedProducts.size >= 2 ? 'text-success fw-bold' : '';
    }
}

async function showComparison() {
    if (selectedProducts.size < 2) {
        alert('Please select at least 2 plans to compare by checking their "Compare" boxes.');
        return;
    }
    
    const productIds = Array.from(selectedProducts).join(',');
    const salary = document.getElementById('salaryInput')?.value;
    
    let url = `${API_BASE}/api/compare?product_ids=${productIds}`;
    if (salary) {
        url += `&salary=${salary}`;
    }
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const comparisonHtml = generateComparisonTable(data.comparison);
        document.getElementById('comparisonTable').innerHTML = comparisonHtml;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('compareModal'));
        modal.show();
    } catch (error) {
        console.error('Error comparing products:', error);
        alert('Error loading comparison. Please try again.');
    }
}

function generateComparisonTable(products) {
    let html = `
        <div class="table-responsive">
            <table class="table table-bordered table-hover comparison-table">
                <thead class="table-primary">
                    <tr>
                        <th class="align-middle" style="width: 20%">Feature</th>
    `;
    
    // Header with product images and company logos
    products.forEach(p => {
        const productImage = getProductImage(p.name, p.company);
        const logoData = getCompanyLogo(p.company);
        
        html += `
            <th class="text-center" style="width: 40%">
                <!-- Product Image -->
                <div class="comparison-product-image mb-3" style="
                    height: 80px;
                    background-image: url('${productImage}');
                    background-size: cover;
                    background-position: center;
                    border-radius: 10px;
                    position: relative;
                    margin: 0 auto;
                    width: 90%;
                ">
                    <!-- Company Logo in top-right -->
                    <div class="comparison-logo-container" style="
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        z-index: 10;
                    ">
        `;
        
        if (logoData.image) {
            html += `<img src="${logoData.image}" alt="${p.company}" style="
                width: 45px;
                height: 45px;
                object-fit: contain;
                border: none;
                background: transparent;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
            ">`;
        } else {
            html += `<div style="
                width: 45px;
                height: 45px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 1rem;
                border: none;
                background: ${logoData.bgColor};
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
                border-radius: 0;
            ">${logoData.text}</div>`;
        }
        
        html += `
                    </div>
                    <div class="product-overlay" style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.4));
                        border-radius: 10px;
                    "></div>
                </div>
                
                <div class="comparison-product-info">
                    <strong class="d-block mb-1">${p.name}</strong>
                    <small class="text-muted">${p.company}</small>
                </div>
            </th>
        `;
    });
    html += '</tr></thead><tbody>';
    
    // Price Row
    html += '<tr><td class="fw-bold">Monthly Premium</td>';
    products.forEach(p => {
        let price = 'N/A';
        if (p.calculated_premium) {
            price = p.calculated_premium;
        } else if (p.premiums && p.premiums.length > 0) {
            const minPremium = getMinPremium(p.premiums);
            price = minPremium !== 'N/A' ? minPremium : 'N/A';
        }
        html += `<td class="fw-bold text-success">P${price}/month</td>`;
    });
    html += '</tr>';
    
    // Category-specific fields
    if (products[0].category === 'medical') {
        html += '<tr><td class="fw-bold">Annual Limit</td>';
        products.forEach(p => {
            const limit = p.annual_limit ? `P${formatNumber(p.annual_limit)}` : 'N/A';
            html += `<td>${limit}</td>`;
        });
        html += '</tr>';
        
        html += '<tr><td class="fw-bold">Co-payment</td>';
        products.forEach(p => {
            html += `<td>${p.co_payment || 'N/A'}</td>`;
        });
        html += '</tr>';
        
        html += '<tr><td class="fw-bold">Hospital Network</td>';
        products.forEach(p => {
            const network = p.hospital_network || 'N/A';
            html += `<td class="text-start small">${network.substring(0, 80)}${network.length > 80 ? '...' : ''}</td>`;
        });
        html += '</tr>';
    } else if (products[0].category === 'hospital_cash') {
        html += '<tr><td class="fw-bold">Cover Amount</td>';
        products.forEach(p => {
            html += `<td class="small">${p.sum_assured || 'N/A'}</td>`;
        });
        html += '</tr>';
        
        html += '<tr><td class="fw-bold">Daily Benefit</td>';
        products.forEach(p => {
            // Extract daily benefit from sum_assured
            const sumAssured = p.sum_assured || '';
            const dailyMatch = sumAssured.match(/P(\d+)/);
            const dailyBenefit = dailyMatch ? `P${dailyMatch[1]}/day` : 'N/A';
            html += `<td>${dailyBenefit}</td>`;
        });
        html += '</tr>';
    } else {
        html += '<tr><td class="fw-bold">Cover Amount</td>';
        products.forEach(p => {
            html += `<td>${p.sum_assured || 'N/A'}</td>`;
        });
        html += '</tr>';
    }
    
    // Waiting Period
    html += '<tr><td class="fw-bold">Waiting Period (Natural)</td>';
    products.forEach(p => {
        html += `<td>${p.waiting_period_natural || 'N/A'}</td>`;
    });
    html += '</tr>';
    
    // Key Features
    html += '<tr><td class="fw-bold">Key Features</td>';
    products.forEach(p => {
        const features = p.key_features || [];
        const featureList = features.slice(0, 3).map(f => `• ${f}`).join('<br>');
        html += `<td class="text-start small" style="font-size: 0.85rem;">${featureList || 'N/A'}</td>`;
    });
    html += '</tr>';
    
    // Action buttons
    html += '<tr><td class="fw-bold">Get Quote</td>';
    products.forEach(p => {
        html += `
            <td>
                <button class="btn btn-sm btn-outline-primary w-100" onclick="showLeadForm(${p.id})">
                    Request Quote
                </button>
            </td>
        `;
    });
    html += '</tr>';
    
    html += '</tbody></table></div>';
    return html;
}

function showLeadForm(productId) {
    document.getElementById('selectedProductId').value = productId;
    const modal = new bootstrap.Modal(document.getElementById('leadModal'));
    modal.show();
}

async function submitLead(event) {
    event.preventDefault();
    
    const leadData = {
        product_id: parseInt(document.getElementById('selectedProductId').value),
        name: document.getElementById('leadName').value,
        phone: document.getElementById('leadPhone').value,
        email: document.getElementById('leadEmail').value,
        notes: ''
    };
    
    try {
        const response = await fetch(`${API_BASE}/api/leads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(leadData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Thank you! The insurer will contact you shortly.');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('leadModal'));
            modal.hide();
            
            // Reset form
            document.getElementById('leadForm').reset();
        } else {
            alert('Error submitting form. Please try again.');
        }
    } catch (error) {
        console.error('Error submitting lead:', error);
        alert('Error submitting form. Please try again.');
    }
}


function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        
        // Update navigation active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Find and activate the corresponding nav link
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
        if (navLink) {
            navLink.classList.add('active');
        }
    }
}

// ==== IMAGE FUNCTIONS ====

function getProductImage(productName, companyName) {
    // Map product names to your local images
    const imageMap = {
        // PulaMed Products
        'Executive': 'images/products/pulamed/executive.jpg',
        'Deluxe': 'images/products/pulamed/deluxe.jpg',
        'Galaxy': 'images/products/pulamed/galaxy.jpg',
        'Flexi': 'images/products/pulamed/flexi.jpg',
        
        // BPOMAS Products
        'Standard Benefit Option': 'images/products/bpomas/standard.jpg',
        'Standard': 'images/products/bpomas/standard.jpg',
        'High Benefit Option': 'images/products/bpomas/high.jpg',
        'High': 'images/products/bpomas/high.jpg',
        'Premium Benefit Option': 'images/products/bpomas/premium.jpg',
        'Premium': 'images/products/bpomas/premium.jpg',
        
        // Botsogo Products
        'Diamond': 'images/products/botsogo/diamond.jpg',
        'Platinum': 'images/products/botsogo/platinum.jpg',
        'Ruby': 'images/products/botsogo/ruby.jpg',
        'Bronze': 'images/products/botsogo/bronze.jpg',
        
        // Metropolitan Life Products
        'Mothusi Life Cover - Lifeline': 'images/products/metropolitan/lifeline.jpg',
        'Lifeline': 'images/products/metropolitan/lifeline.jpg',
        'Mothusi Life Cover - Term Shield': 'images/products/metropolitan/termshield.jpg',
        'Term Shield': 'images/products/metropolitan/termshield.jpg',
        'Mothusi Life Cover - Home Secure': 'images/products/metropolitan/homesecure.jpg',
        'Home Secure': 'images/products/metropolitan/homesecure.jpg',
        'Mothusi': 'images/products/metropolitan/default.jpg',
        
        // Liberty Life Products
        'Boago Funeral Plan': 'images/products/liberty/boago.jpg',
        'Boago': 'images/products/liberty/boago.jpg',
        'Funeral': 'images/products/liberty/boago.jpg',
        'Hospital Cash Back Benefit': 'images/products/liberty/hospitalcash.jpg',
        'Hospital Cash': 'images/products/liberty/hospitalcash.jpg'
    };
    
    // Try exact match first
    for (const [key, value] of Object.entries(imageMap)) {
        if (productName.includes(key)) {
            return value;
        }
    }
    
    // Fallback by company
    if (companyName.includes('Pula') || companyName.includes('Pulamed')) {
        return 'images/products/pulamed/default.jpg';
    } else if (companyName.includes('BPOMAS')) {
        return 'images/products/bpomas/default.jpg';
    } else if (companyName.includes('Botsogo')) {
        return 'images/products/botsogo/default.jpg';
    } else if (companyName.includes('Metropolitan')) {
        return 'images/products/metropolitan/default.jpg';
    } else if (companyName.includes('Liberty')) {
        return 'images/products/liberty/default.jpg';
    }
    
    // Ultimate fallback
    return 'images/products/default.jpg';
}

function getCompanyLogo(companyName) {
    // More precise matching
    const logoMap = {
        'Pula Medical Aid Fund (Pulamed)': {
            image: 'images/logos/pulamed.png',
            bgColor: '#4CAF50',
            text: 'PM',
            name: 'PulaMed',
            shortName: 'PulaMed'
        },
        'Botswana Public Officers Medical Aid Scheme (BPOMAS)': {
            image: 'images/logos/bpomas.png',
            bgColor: '#2196F3',
            text: 'BP',
            name: 'BPOMAS',
            shortName: 'BPOMAS'
        },
        'Botsogo Health Plan': {
            image: 'images/logos/botsogo.png',
            bgColor: '#FF9800',
            text: 'BH',
            name: 'Botsogo Health',
            shortName: 'Botsogo'
        },
        'Liberty Life Botswana (Pty) Limited': {
            image: 'images/logos/liberty.png',
            bgColor: '#9C27B0',
            text: 'LL',
            name: 'Liberty Life',
            shortName: 'Liberty'
        },
        'Metropolitan Life Botswana': {
            image: 'images/logos/metropolitan.png',
            bgColor: '#F44336',
            text: 'ML',
            name: 'Metro',
            shortName: 'Metro'
        }
    };
    
    // Exact match first
    if (logoMap[companyName]) {
        return logoMap[companyName];
    }
    
    // Partial matching for variations
    if (companyName.includes('Pula') || companyName.includes('Pulamed')) {
        return logoMap['Pula Medical Aid Fund (Pulamed)'];
    } else if (companyName.includes('BPOMAS') || companyName.includes('Botswana Public Officers')) {
        return logoMap['Botswana Public Officers Medical Aid Scheme (BPOMAS)'];
    } else if (companyName.includes('Botsogo')) {
        return logoMap['Botsogo Health Plan'];
    } else if (companyName.includes('Liberty')) {
        return logoMap['Liberty Life Botswana (Pty) Limited'];
    } else if (companyName.includes('Metropolitan')) {
        return logoMap['Metropolitan Life Botswana'];
    }
    
    // Default fallback
    return {
        image: null,
        bgColor: '#6c757d',
        text: 'INS',
        name: 'Insurance',
        shortName: 'Insurer'
    };
}