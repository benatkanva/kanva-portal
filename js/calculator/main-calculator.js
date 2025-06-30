/**
 * Consolidated Kanva Botanicals Quote Calculator
 * Combines features from calculator.js, kanva-calculator.js, and multi-product-calculator.js
 */

class KanvaCalculator {
    constructor() {
        // Initialize data structure
        this.data = {
            products: {},
            tiers: {},
            shipping: { zones: {}, states: [] },
            payment: {},
            adminEmails: []
        };
        
        // Initialize state
        this.lineItems = [];
        this.quote = {
            products: [],
            lineItems: [], 
            subtotal: 0,
            shipping: 0,
            creditCardFee: 0,
            total: 0,
            tierInfo: null
        };
        
        // Settings
        this.settings = {
            creditCardFeeRate: 0.03, // 3%
            shippingRateMin: 0.005,  // 0.5%
            shippingRateMax: 0.025,  // 2.5%
            palletThreshold: 0.5     // Half pallet threshold
        };
        
        // Admin state
        this.isAdmin = false;
        this.isReady = false;
        this.currentShippingZone = null;
        this.adminPassword = 'kanva123'; // Default admin password
        
        // Copper CRM Integration
        this.copperCredentials = {
            apiKey: '',
            userEmail: ''
        };
        this.copperFields = [];
        this.fieldMappings = [];
        this.copperSettings = {
            autoSync: true,
            autoPopulate: true,
            syncOnSave: true
        };
        
        // Initialize modules
        // Note: Pricing functionality is built into this class
        
        // Bind methods
        this.init = this.init.bind(this);
        this.calculateAll = this.calculateAll.bind(this);
        this.updateProductLine = this.updateProductLine.bind(this);
    }
    
    /**
     * Initialize the calculator
     */
    async init() {
        console.log('🧮 Initializing Kanva Calculator...');
        
        try {
            await this.loadData();
            this.detectAdmin();
            this.initializeUI();
            
            // Load saved state if any
            this.loadState();
            
            // Check for admin session
            this.checkAdminSession();
            
            this.isReady = true;
            return this;
        } catch (error) {
            console.error('Failed to initialize calculator:', error);
            throw error;
        }
    }
    
    /**
     * Initialize UI elements
     */
    initializeUI() {
        this.populateProductDropdowns();
        this.setupEventListeners();
        this.updateShippingZoneDisplay();
        this.updateAdminUI();
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Add product button
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => this.addProductLine());
        }
        
        // Calculate button
        const calculateBtn = document.getElementById('calculateBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculateAll());
        }
        
        // Admin login/logout
        const adminLoginBtn = document.getElementById('adminLoginBtn');
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', () => this.loginAdmin());
        }
        
        // Manual shipping override
        const manualShippingInput = document.getElementById('manualShipping');
        if (manualShippingInput) {
            manualShippingInput.addEventListener('change', (e) => {
                this.calculateShipping();
                this.updateOrderDetails();
            });
        }
    }
    
    /**
     * Check for existing admin session
     */
    checkAdminSession() {
        const adminToken = localStorage.getItem('kanvaAdminToken');
        if (adminToken && adminToken === btoa(this.adminPassword)) {
            this.isAdmin = true;
            this.updateAdminUI();
        }
    }
    
    /**
     * Save current state to localStorage
     */
    saveState() {
        const state = {
            lineItems: this.lineItems,
            currentShippingZone: this.currentShippingZone,
            isAdmin: this.isAdmin
        };
        localStorage.setItem('kanvaCalculatorState', JSON.stringify(state));
    }
    
    /**
     * Load data from JSON files
     */
    async loadData() {
        try {
            // Load products
            const productsResponse = await fetch('data/products.json');
            if (!productsResponse.ok) throw new Error(`Failed to load products.json: ${productsResponse.statusText}`);
            this.data.products = await productsResponse.json();
            
            // Load tiers
            const tiersResponse = await fetch('data/tiers.json');
            if (!tiersResponse.ok) throw new Error(`Failed to load tiers.json: ${tiersResponse.statusText}`);
            this.data.tiers = await tiersResponse.json();
            
            // Load shipping data
            const shippingResponse = await fetch('data/shipping.json');
            if (!shippingResponse.ok) throw new Error(`Failed to load shipping.json: ${shippingResponse.statusText}`);
            const shippingData = await shippingResponse.json();
            
            // Process shipping data
            this.data.shipping = {
                zones: {},
                states: []
            };
            
            // Extract zones and states from shipping data
            if (shippingData && shippingData.zones) {
                this.data.shipping.zones = shippingData.zones;
                
                // Extract all unique states from all zones
                const allStates = new Set();
                Object.values(shippingData.zones).forEach(zone => {
                    if (zone.states && Array.isArray(zone.states)) {
                        zone.states.forEach(state => allStates.add(state));
                    }
                });
                
                this.data.shipping.states = Array.from(allStates).sort();
            }
            
            console.log('📦 Data loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load data:', error);
            throw new Error('Failed to load required data files');
        }
    }
    
    /**
     * Add a new product line
     */
    addProductLine(productKey = '') {
        const newLine = {
            id: 'line-' + Date.now(),
            productKey: productKey,
            quantity: 1,
            unitPrice: 0,
            total: 0,
            productData: productKey ? this.data.products[productKey] : null
        };
        
        if (productKey && this.data.products[productKey]) {
            const product = this.data.products[productKey];
            newLine.unitPrice = product.price || 0;
            newLine.total = newLine.quantity * newLine.unitPrice;
        }
        
        this.lineItems.push(newLine);
        this.renderProductLines();
        this.saveState();
        return newLine;
    }
    
    /**
     * Remove a product line
     */
    removeProductLine(lineId) {
        this.lineItems = this.lineItems.filter(item => item.id !== lineId);
        this.renderProductLines();
        this.calculateAll();
        this.saveState();
    }
    
    /**
     * Update a product line
     */
    updateProductLine(lineId, field, value) {
        const lineItem = this.lineItems.find(item => item.id === lineId);
        if (!lineItem) return;
        
        if (field === 'productKey') {
            const product = this.data.products[value];
            if (product) {
                lineItem.productKey = value;
                lineItem.productData = product;
                lineItem.unitPrice = product.price || 0;
                lineItem.total = lineItem.quantity * lineItem.unitPrice;
            }
        } else if (field === 'quantity') {
            const quantity = parseFloat(value) || 0;
            lineItem.quantity = quantity;
            lineItem.total = quantity * lineItem.unitPrice;
        } else if (field === 'unitPrice') {
            const price = parseFloat(value) || 0;
            lineItem.unitPrice = price;
            lineItem.total = lineItem.quantity * price;
        }
        
        this.renderProductLines();
        this.calculateAll();
        this.saveState();
    }
    
    /**
     * Calculate all values
     */
    calculateAll() {
        // Calculate subtotal
        this.quote.subtotal = this.lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
        
        // Calculate shipping
        this.calculateShipping();
        
        // Calculate credit card fee (3% of subtotal + shipping)
        this.quote.creditCardFee = (this.quote.subtotal + this.quote.shipping) * this.settings.creditCardFeeRate;
        
        // Calculate total
        this.quote.total = this.quote.subtotal + this.quote.shipping + this.quote.creditCardFee;
        
        // Update UI
        this.updateOrderDetails();
        this.saveState();
    }
    
    /**
     * Calculate shipping based on order value and shipping zone
     */
    calculateShipping() {
        try {
            // Check for manual shipping override
            const manualShippingInput = document.getElementById('manualShipping');
            const manualShipping = manualShippingInput ? parseFloat(manualShippingInput.value) || 0 : 0;
            
            if (manualShipping > 0) {
                this.quote.shipping = manualShipping;
                return;
            }
            
            // If no shipping zone is set, shipping is 0
            if (!this.currentShippingZone) {
                this.quote.shipping = 0;
                return;
            }
            
            // Get the current zone
            const zone = this.data.shipping.zones[this.currentShippingZone];
            if (!zone) {
                console.warn(`Shipping zone not found: ${this.currentShippingZone}`);
                this.quote.shipping = 0;
                return;
            }
            
            // Calculate shipping based on zone rate and order subtotal
            if (this.quote.subtotal > 0) {
                // Use the zone rate if available, otherwise use default rate
                const zoneRate = typeof zone.rate === 'number' ? zone.rate : this.settings.shippingRateMin;
                
                // Apply min/max bounds to the shipping rate
                const shippingRate = Math.max(
                    this.settings.shippingRateMin,
                    Math.min(this.settings.shippingRateMax, zoneRate)
                );
                
                // Calculate shipping cost
                this.quote.shipping = this.quote.subtotal * shippingRate;
                
                // Apply any fixed shipping costs if defined
                if (typeof zone.fixedCost === 'number' && zone.fixedCost > 0) {
                    this.quote.shipping = Math.max(this.quote.shipping, zone.fixedCost);
                }
                
                // Round to 2 decimal places
                this.quote.shipping = Math.round(this.quote.shipping * 100) / 100;
            } else {
                this.quote.shipping = 0;
            }
        } catch (error) {
            console.error('Error calculating shipping:', error);
            this.quote.shipping = 0;
        }
    }
    
    /**
     * Update the order details display
     */
    updateOrderDetails() {
        // Update subtotal
        const subtotalEl = document.getElementById('subtotal');
        if (subtotalEl) {
            subtotalEl.textContent = this.formatCurrency(this.quote.subtotal);
        }
        
        // Update shipping
        const shippingEl = document.getElementById('shipping');
        if (shippingEl) {
            shippingEl.textContent = this.formatCurrency(this.quote.shipping);
        }
        
        // Update credit card fee
        const feeEl = document.getElementById('creditCardFee');
        if (feeEl) {
            feeEl.textContent = this.formatCurrency(this.quote.creditCardFee);
        }
        
        // Update total
        const totalEl = document.getElementById('total');
        if (totalEl) {
            totalEl.textContent = this.formatCurrency(this.quote.total);
        }
    }
    
    /**
     * Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    }
    
    /**
     * Render product lines in the UI
     */
    renderProductLines() {
        const container = document.getElementById('productLinesContainer');
        if (!container) return;
        
        // Clear existing content
        container.innerHTML = '';
        
        // Add each line item
        this.lineItems.forEach((lineItem, index) => {
            const product = lineItem.productData || {};
            const productOptions = Object.entries(this.data.products || {})
                .map(([key, prod]) => `<option value="${key}" ${lineItem.productKey === key ? 'selected' : ''}>${prod.name || key}</option>`)
                .join('');
            
            const lineHtml = `
                <div class="product-line" data-line-id="${lineItem.id}">
                    <div class="product-line-header">
                        <h4>Product ${index + 1}</h4>
                        <button type="button" class="btn btn-sm btn-danger" onclick="calculator.removeProductLine('${lineItem.id}')">
                            Remove
                        </button>
                    </div>
                    <div class="form-group">
                        <label>Product</label>
                        <select class="form-control product-select" 
                                onchange="calculator.updateProductLine('${lineItem.id}', 'productKey', this.value)">
                            <option value="">Select a product...</option>
                            ${productOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Quantity</label>
                        <input type="number" class="form-control" 
                               value="${lineItem.quantity}" 
                               onchange="calculator.updateProductLine('${lineItem.id}', 'quantity', this.value)" 
                               min="1">
                    </div>
                    <div class="form-group">
                        <label>Unit Price</label>
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <span class="input-group-text">$</span>
                            </div>
                            <input type="number" class="form-control" 
                                   value="${lineItem.unitPrice || ''}" 
                                   onchange="calculator.updateProductLine('${lineItem.id}', 'unitPrice', this.value)" 
                                   step="0.01" min="0">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Line Total</label>
                        <div class="form-control-plaintext">
                            ${this.formatCurrency(lineItem.total || 0)}
                        </div>
                    </div>
                </div>
            `;
            
            container.insertAdjacentHTML('beforeend', lineHtml);
        });
        
        // Show/hide empty state
        this.updateEmptyState();
    }
    
    /**
     * Update empty state visibility
     */
    updateEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const productLines = document.getElementById('productLinesContainer');
        
        if (emptyState && productLines) {
            emptyState.style.display = this.lineItems.length ? 'none' : 'block';
            productLines.style.display = this.lineItems.length ? 'block' : 'none';
        }
    }
    
    /**
     * Update admin UI based on current state
     */
    updateAdminUI() {
        const adminPanel = document.getElementById('adminPanel');
        const adminLoginBtn = document.getElementById('adminLoginBtn');
        const adminLogoutBtn = document.getElementById('adminLogoutBtn');
        
        if (adminPanel) {
            adminPanel.style.display = this.isAdmin ? 'block' : 'none';
        }
        
        if (adminLoginBtn) {
            adminLoginBtn.style.display = this.isAdmin ? 'none' : 'block';
        }
        
        if (adminLogoutBtn) {
            adminLogoutBtn.style.display = this.isAdmin ? 'block' : 'none';
            adminLogoutBtn.onclick = () => this.logoutAdmin();
        }
    }
    
    /**
     * Login as admin
     */
    loginAdmin() {
        const password = prompt('Enter admin password:');
        if (password === this.adminPassword) {
            this.isAdmin = true;
            localStorage.setItem('kanvaAdminToken', btoa(password));
            this.updateAdminUI();
            this.saveState();
        } else if (password !== null) {
            alert('Incorrect password');
        }
    }
    
    /**
     * Logout from admin
     */
    logoutAdmin() {
        this.isAdmin = false;
        localStorage.removeItem('kanvaAdminToken');
        this.updateAdminUI();
        this.saveState();
    }
    
    /**
     * Populate product dropdowns
     */
    populateProductDropdowns() {
        const productSelects = document.querySelectorAll('.product-select');
        if (!productSelects.length) return;
        
        const options = Object.entries(this.data.products || {})
            .map(([key, product]) => 
                `<option value="${key}">${product.name || key}</option>`
            )
            .join('');
        
        productSelects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = `<option value="">Select a product...</option>${options}`;
            if (currentValue) {
                select.value = currentValue;
            }
        });
    }
    
    /**
     * Update shipping zone display
     */
    updateShippingZoneDisplay() {
        const shippingZoneInfo = document.getElementById('shippingZoneInfo');
        if (!shippingZoneInfo) return;
        
        if (this.currentShippingZone) {
            const zone = this.data.shipping.zones[this.currentShippingZone];
            if (zone) {
                shippingZoneInfo.innerHTML = `
                    <div class="shipping-zone-display">
                        <strong>Shipping Zone:</strong> ${zone.name || this.currentShippingZone}
                        <button class="btn btn-sm btn-link" onclick="calculator.clearShippingZone()">Change</button>
                        ${zone.rate ? `<div class="shipping-rate">Rate: ${(zone.rate * 100).toFixed(1)}% of order value</div>` : ''}
                    </div>
                `;
                return;
            }
        }
        
        // If no zone selected or zone not found, show state selection
        const states = this.data.shipping.states || [];
        shippingZoneInfo.innerHTML = `
            <div class="shipping-zone-prompt">
                <div class="alert alert-warning mb-2">
                    <i class="fas fa-info-circle"></i> Please select a state to calculate shipping
                </div>
                <div class="form-group">
                    <select id="stateSelect" class="form-control form-control-sm">
                        <option value="">Select a state...</option>
                        ${states.map(state => 
                            `<option value="${state}">${state}</option>`
                        ).join('')}
                    </select>
                </div>
                <button class="btn btn-primary btn-sm mt-2" onclick="calculator.setShippingZone()">
                    <i class="fas fa-truck"></i> Set Shipping Zone
                </button>
            </div>
        `;
    }
    
    /**
     * Set shipping zone based on selected state
     */
    setShippingZone() {
        const stateSelect = document.getElementById('stateSelect');
        if (!stateSelect) {
            console.error('State select element not found');
            return;
        }
        
        const state = stateSelect.value.trim();
        if (!state) {
            alert('Please select a state');
            return;
        }
        
        // Find which zone this state belongs to
        for (const [zoneId, zone] of Object.entries(this.data.shipping.zones || {})) {
            if (zone.states && Array.isArray(zone.states) && zone.states.includes(state)) {
                this.currentShippingZone = zoneId;
                console.log(`Set shipping zone to ${zoneId} for state ${state}`);
                
                // Update UI and save state
                this.calculateAll();
                this.updateShippingZoneDisplay();
                this.saveState();
                
                // Show success message
                this.showNotification(`Shipping zone set to ${zone.name || zoneId}`, 'success');
                return;
            }
        }
        
        // If we get here, no zone was found for the state
        console.error(`No shipping zone found for state: ${state}`);
        this.showError('No shipping information available for the selected state. Please contact support.');
    }
    
    /**
     * Clear current shipping zone
     */
    clearShippingZone() {
        this.currentShippingZone = null;
        this.updateShippingZoneDisplay();
        this.calculateAll();
        this.saveState();
    }
    
    /**
     * Load state from localStorage
     */
    loadState() {
        const savedState = localStorage.getItem('kanvaCalculatorState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                this.lineItems = state.lineItems || [];
                this.currentShippingZone = state.currentShippingZone;
                this.isAdmin = state.isAdmin || false;
                
                // Re-render UI
                this.renderProductLines();
                this.updateAdminUI();
                this.updateShippingZoneDisplay();
                this.calculateAll();
            } catch (e) {
                console.error('Error loading saved state:', e);
            }
        }
    }
    
    /**
     * Add a product to the quote from the catalog
     * @param {string} productKey - The product key from products.json
     */
    addProductToQuote(productKey) {
        const product = this.dataManager.getProduct(productKey);
        if (!product) {
            this.showError(`Product ${productKey} not found`);
            return;
        }
        
        // Create a new line item with the selected product
        const lineItem = {
            id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            productKey: productKey,
            productData: product,
            units: 144, // Default to 1 master case (144 units)
            unitPrice: product.price || 0,
            customPrice: null
        };
        
        // Calculate derived quantities
        this.updateLineItemQuantities(lineItem);
        
        // Add to line items
        this.lineItems.push(lineItem);
        
        // Update UI
        this.renderProductLines();
        this.calculateAll();
        this.saveState();
        
        // Show success notification
        this.showNotification(`Added ${product.name} to quote`, 'success');
        
        // Scroll to the product details section
        const detailsSection = document.querySelector('.card:has(#productLinesContainer)');
        if (detailsSection) {
            detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    /**
     * Update line item quantities based on units
     * Calculation: 12 units = 1 display, 12 displays = 1 master case (144 units per case)
     * @param {Object} lineItem - Line item to update
     */
    updateLineItemQuantities(lineItem) {
        const units = lineItem.units || 0;
        const unitsPerDisplay = 12;
        const displaysPerCase = 12;
        const unitsPerCase = unitsPerDisplay * displaysPerCase; // 144
        
        // Calculate quantities
        lineItem.displays = Math.ceil(units / unitsPerDisplay);
        lineItem.cases = Math.ceil(units / unitsPerCase);
        lineItem.displayBoxes = lineItem.displays; // Alias for compatibility
        
        // Calculate pricing
        lineItem.lineTotal = units * lineItem.unitPrice;
        
        return lineItem;
    }
    
    /**
     * Detect admin status from URL or localStorage
     */
    detectAdmin() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('admin')) {
            this.isAdmin = true;
            localStorage.setItem('kanvaAdminToken', btoa(this.adminPassword));
        } else {
            this.checkAdminSession();
        }
    }
    
    /**
     * Show notification message to the user
     */
    showNotification(message, type = 'info') {
        // Try to use notification manager if available
        if (window.NotificationManager && typeof window.NotificationManager.show === 'function') {
            window.NotificationManager.show(message, type);
            return;
        }
        
        // Fallback to console
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Try to show in error container as fallback
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer && type === 'success') {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
            errorContainer.style.backgroundColor = '#d4edda';
            errorContainer.style.color = '#155724';
            setTimeout(() => {
                errorContainer.style.display = 'none';
                errorContainer.style.backgroundColor = '';
                errorContainer.style.color = '';
            }, 3000);
        }
    }
    
    /**
     * Show error message to the user
     */
    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 5000);
        } else {
            console.error('Error:', message);
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.KanvaCalculator = KanvaCalculator;
    
    // Initialize calculator when the DOM is ready
    const initCalculator = () => {
        if (!window.calculator) {
            try {
                window.calculator = new KanvaCalculator();
                if (window.calculator && typeof window.calculator.init === 'function') {
                    window.calculator.init().then(() => {
                        console.log('✅ Calculator initialized successfully');
                        // Dispatch event when calculator is ready
                        document.dispatchEvent(new CustomEvent('calculator:ready', {
                            detail: { calculator: window.calculator }
                        }));
                    }).catch(error => {
                        console.error('❌ Failed to initialize calculator:', error);
                    });
                } else {
                    console.error('❌ Calculator initialization failed: init method not found');
                }
            } catch (error) {
                console.error('❌ Error creating calculator instance:', error);
            }
        }
    };
    
    // Initialize immediately if DOM is already loaded, otherwise wait for DOMContentLoaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log('🚀 Initializing calculator (DOM already ready)');
        initCalculator();
    } else {
        console.log('⏳ Waiting for DOM to be ready before initializing calculator...');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 DOM ready, initializing calculator...');
            initCalculator();
        });
    }
}

// Export for Node.js/CommonJS
try {
    module.exports = KanvaCalculator;
} catch (e) {
    // Not in a CommonJS environment
}
