/**
 * UI Manager
 * Handles all UI rendering and updates
 */

class UIManager {
    constructor(calculator) {
        this.calculator = calculator;
        // Initialize ModalManager if available, otherwise use fallback
        this.modalManager = (typeof ModalManager !== 'undefined') ? new ModalManager() : null;
        this.notificationManager = (typeof NotificationManager !== 'undefined') ? NotificationManager : null;
        // Initialize template manager for dynamic content
        this.templateManager = (typeof TemplateManager !== 'undefined') ? new TemplateManager() : null;
        
        // Store references to modular components
        this.currentOrderDetailsTable = null;
        this.currentTierBadge = null;
        this.currentOrderCalculation = null;
        this.currentShippingZone = null;
        
        // Track if components are ready
        this.componentsReady = false;
        
        // Load essential UI CSS files
        this.ensureUIStylesLoaded();
        
        this.setupComponentListeners();
    }
    
    /**
     * Ensure UI styles are loaded
     */
    ensureUIStylesLoaded() {
        if (window.CSSLoader) {
            console.log('🎨 UIManager: Loading essential UI styles');
            
            // Load layout styles
            window.CSSLoader.loadLayoutCSS('grid');
            
            // Load component styles for all primary UI components
            const essentialComponents = [
                'activity-panel',
                'buttons',
                'cards',
                'forms',
                'modals',
                'product-tile',
                'product-order',
                'tables',
                'calculation-display'
            ];
            
            essentialComponents.forEach(component => {
                window.CSSLoader.loadComponentCSS(component);
            });
            
            console.log('✅ UIManager: Essential styles loaded');
        } else {
            console.warn('⚠️ CSSLoader not available - UI styling may be affected');
        }
    }

    setupComponentListeners() {
        // Listen for when UI components are ready
        document.addEventListener('uiComponentsReady', (event) => {
            console.log('🎨 UI Components are now ready', event.detail);
            this.componentsReady = true;
            console.log('✅ UIManager componentsReady set to true');
            
            // Initialize modular components
            this.initializeComponents();
            
            // Re-render product catalog with components now available
            this.populateProductReference();
        });
        
        console.log('🔊 UIManager listening for uiComponentsReady event');
        
        // Check if components are already ready (timing issue fix)
        if (window.UIComponents && Object.keys(window.UIComponents).length > 0) {
            console.log('🔄 Components already ready, setting componentsReady = true');
            this.componentsReady = true;
            // Small delay to ensure all initialization is complete
            setTimeout(() => {
                this.initializeComponents();
                this.populateProductReference();
            }, 100);
        }
    }

    initialize() {
        this.populateProductDropdowns();
        this.populateStateDropdowns();
        this.populateProductReference();
        this.updateAdminUI();
        
        // Initialize template-based elements
        if (this.templateManager) {
            this.templateManager.initializeElements();
        }
    }
    
    /**
     * Initialize modular UI components when they become available
     */
    initializeComponents() {
        console.log('UIManager: Initializing modular components...');
        
        // Initialize OrderDetailsTable if available
        if (window.OrderDetailsTable) {
            try {
                this.currentOrderDetailsTable = new window.OrderDetailsTable();
                console.log('UIManager: OrderDetailsTable initialized successfully');
            } catch (error) {
                console.error('UIManager: Failed to initialize OrderDetailsTable:', error);
                this.currentOrderDetailsTable = null;
            }
        } else {
            console.log('UIManager: OrderDetailsTable not available, using legacy rendering');
        }
        
        // Initialize OrderCalculation if available
        if (window.OrderCalculation) {
            try {
                // Don't create a new component, just initialize for updating existing elements
                this.currentOrderCalculation = new window.OrderCalculation();
                console.log('UIManager: OrderCalculation initialized for updating existing display');
            } catch (error) {
                console.error('UIManager: Failed to initialize OrderCalculation:', error);
                this.currentOrderCalculation = null;
            }
        } else {
            console.log('UIManager: OrderCalculation not available, using legacy rendering');
        }
        
        // TierBadge will be initialized on-demand when needed
        console.log('');
    }

    showApp() {
        const loadingEl = document.getElementById('loading');
        const appEl = document.getElementById('app');
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (appEl) appEl.style.display = 'block';
        
        this.updateEmptyState();
        this.updateCalculationDisplay({});
    }

    updateCalculationDisplay(quote) {
        // Use modular OrderCalculation component if available
        if (window.OrderCalculation) {
            const calculationData = {
                subtotal: quote.subtotal || 0,
                shipping: quote.shipping || 0,
                creditCardFee: quote.creditCardFee || 0,
                total: quote.total || 0,
                tierInfo: quote.tierInfo || null,
                loading: false
            };
            
            const container = document.querySelector('#calculationDisplay');
            if (container) {
                console.log('🔍 OrderCalculation debug:', {
                    currentOrderCalculation: !!this.currentOrderCalculation,
                    hasElement: this.currentOrderCalculation?.element ? true : false,
                    containerFound: !!container
                });
                
                // Create or update order calculation component
                if (this.currentOrderCalculation && this.currentOrderCalculation.element) {
                    console.log('🔄 Updating existing OrderCalculation');
                    this.currentOrderCalculation.update(calculationData);
                } else {
                    console.log('🆕 Creating new OrderCalculation');
                    this.currentOrderCalculation = new window.OrderCalculation({
                        showTierInfo: true,
                        showBreakdown: true,
                        compact: false
                    });
                    
                    const calcElement = this.currentOrderCalculation.create(calculationData);
                    console.log('🔍 Created OrderCalculation element:', !!calcElement);
                    console.log('🔍 OrderCalculation.element set:', !!this.currentOrderCalculation.element);
                    
                    // Replace container content instead of replacing the container itself
                    container.innerHTML = '';
                    container.appendChild(calcElement);
                }
            }
        } else {
            // Fallback to legacy rendering
            this.updateCalculationDisplayLegacy(quote);
        }
        
        this.updateShippingZoneDisplay();
    }
    
    /**
     * Legacy calculation display update (fallback)
     */
    updateCalculationDisplayLegacy(quote) {
        const formatCurrency = Formatters.currency;
        
        // Update summary values
        const updateElement = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = formatCurrency(value || 0);
        };
        
        updateElement('subtotalAmount', quote.subtotal);
        updateElement('shippingAmount', quote.shipping);
        updateElement('creditCardFee', quote.creditCardFee);
        updateElement('totalAmount', quote.total);
        
        this.updateTierInfo(quote.tierInfo);
    }

    updateTierInfo(tierInfo) {
        const tierInfoElement = document.getElementById('tierInfo');
        if (!tierInfoElement) return;
        
        if (tierInfo) {
            tierInfoElement.style.display = 'block';
            tierInfoElement.innerHTML = `
                <strong>Tier Applied:</strong> ${tierInfo.tier.toUpperCase()}<br>
                <strong>Discount:</strong> ${tierInfo.discount}%<br>
                <strong>Volume:</strong> ${tierInfo.totalCases} master cases
            `;
        } else {
            tierInfoElement.style.display = 'none';
        }
    }

    renderProductLines(lineItems) {
        const container = document.getElementById('productLinesContainer');
        if (!container) return;
        
        // Clear existing lines
        container.innerHTML = '';
        
        if (!lineItems || lineItems.length === 0) {
            this.updateEmptyState();
            return;
        }
        
        lineItems.forEach((item, index) => {
            const lineElement = this.createProductLineElement(item, index);
            container.appendChild(lineElement);
        });
        
        this.updateEmptyState();
    }
    
    createProductLineElement(item, index) {
        const products = this.calculator.dataManager.getProducts();
        const div = document.createElement('div');
        div.className = 'product-line';
        div.dataset.lineId = item.id;
        
        // Create product select dropdown
        const productSelect = document.createElement('select');
        productSelect.className = 'form-control product-select';
        productSelect.name = 'productKey';
        productSelect.required = true;
        
        // Add product options
        Object.entries(products).forEach(([key, product]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = product.name;
            option.selected = key === item.productKey;
            productSelect.appendChild(option);
        });
        
        // Create quantity input
        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.className = 'form-control';
        quantityInput.name = 'masterCases';
        quantityInput.min = '0';
        quantityInput.step = '0.5';
        quantityInput.value = item.masterCases || 0;
        quantityInput.required = true;
        
        // Create remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-danger remove-line-btn';
        removeBtn.innerHTML = '&times;';
        
        // Assemble the line
        div.appendChild(productSelect);
        div.appendChild(quantityInput);
        div.appendChild(removeBtn);
        
        return div;
    }

    updateEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const addBtn = document.getElementById('addProductBtn');
        const productLinesContainer = document.getElementById('productLinesContainer');
        const orderDetailsTable = document.getElementById('orderDetailsTable');
        
        const hasItems = this.calculator.lineItems?.length > 0;
        
        // Show/hide empty state message
        if (emptyState) emptyState.style.display = hasItems ? 'none' : 'block';
        
        // Show/hide product lines container
        if (productLinesContainer) productLinesContainer.style.display = hasItems ? 'block' : 'none';
        
        // Clear order details table if no items
        if (!hasItems && orderDetailsTable) orderDetailsTable.innerHTML = '';
        
        if (addBtn) addBtn.style.display = 'inline-block';
    }

    populateProductDropdowns() {
        const productSelects = document.querySelectorAll('.product-select');
        const products = this.calculator.dataManager.getProducts();
        
        productSelects.forEach(select => {
            // Clear existing options
            select.innerHTML = '';
            
            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select a product';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            select.appendChild(defaultOption);
            
            // Add product options
            Object.entries(products).forEach(([key, product]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = product.name;
                select.appendChild(option);
            });
        });
    }

    populateStateDropdown() {
        const stateSelect = document.getElementById('customerState');
        if (!stateSelect) return;
        
        const shippingData = this.calculator.dataManager.getShipping();
        if (!shippingData || !shippingData.states) return;
        
        // Clear existing options
        stateSelect.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a state';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        stateSelect.appendChild(defaultOption);
        
        // Add state options
        shippingData.states.forEach(state => {
            const option = document.createElement('option');
            option.value = state.code;
            option.textContent = state.name;
            stateSelect.appendChild(option);
        });
    }

    populateProductReference() {
        console.debug('[UIManager] populateProductReference called. componentsReady:', this.componentsReady);
        const catalogContainer = document.getElementById('productCatalog');
        console.debug('[UIManager] productCatalog container:', catalogContainer);
        if (!catalogContainer) return;

        // Check if calculator and product data are ready
        const calculator = window.calculator;
        const dataManager = calculator?.dataManager;
        const products = dataManager?.products || dataManager?.data?.products || null;
        
        console.debug('[UIManager] Calculator available:', !!calculator);
        console.debug('[UIManager] DataManager available:', !!dataManager);
        if (dataManager) {
            console.debug('[UIManager] DataManager.products:', !!dataManager.products, dataManager.products ? Object.keys(dataManager.products).length : 0);
            console.debug('[UIManager] DataManager.data.products:', !!dataManager.data?.products, dataManager.data?.products ? Object.keys(dataManager.data.products).length : 0);
        }
        console.debug('[UIManager] Final products:', products ? Object.keys(products).length : 0);

        // Show loading spinner until BOTH components and product data are ready
        if (!this.componentsReady || !products || Object.keys(products).length === 0) {
            console.warn('[UIManager] Waiting for components/data. componentsReady:', this.componentsReady, 'products loaded:', products ? Object.keys(products).length : 0);
            catalogContainer.innerHTML = '<div class="text-center py-4"><span class="spinner-border"></span> Loading product catalog...</div>';
            
            // Retry after a short delay if this is the first few attempts
            if (!this.retryCount) this.retryCount = 0;
            this.retryCount++;
            
            if (this.retryCount < 10) {
                console.log('🔄 Retrying populateProductReference in 500ms (attempt', this.retryCount, '/10)');
                setTimeout(() => {
                    this.populateProductReference();
                }, 500);
            } else {
                console.error('❌ Failed to load product catalog after 10 attempts');
                catalogContainer.innerHTML = '<div class="alert alert-warning">Unable to load product catalog. Please refresh the page.</div>';
            }
            return;
        }

        // Reset retry count on success
        this.retryCount = 0;
        
        // Use modular ProductManager to render catalog
        if (typeof ProductManager !== 'undefined' && ProductManager.renderProductCatalog) {
            try {
                ProductManager.renderProductCatalog(catalogContainer);
                console.log('✅ Product catalog rendered by ProductManager.');
            } catch (error) {
                console.error('❌ Failed to render product catalog:', error);
                catalogContainer.innerHTML = '<div class="alert alert-danger">Failed to load product catalog. Please refresh or contact support.</div>';
                // Fallback to legacy rendering
                if (ProductManager.renderProductCatalogLegacy) {
                    try {
                        ProductManager.renderProductCatalogLegacy(catalogContainer);
                        console.log('🔄 Fallback: Legacy product catalog rendered.');
                    } catch (legacyError) {
                        console.error('❌ Legacy product catalog rendering also failed:', legacyError);
                    }
                }
            }
        } else {
            console.warn('⚠️ ProductManager not available, skipping product catalog rendering');
            catalogContainer.innerHTML = '<div class="alert alert-warning">Product catalog is loading...</div>';
        }
    }

    updateAdminUI() {
        const adminElements = document.querySelectorAll('[data-admin-only]');
        const isAdmin = this.calculator.dataManager.isAdmin();
        
        adminElements.forEach(el => {
            el.style.display = isAdmin ? 'block' : 'none';
        });
    }

    updateShippingZoneDisplay() {
        // Use modular ShippingZone component if available
        if (window.ShippingZone) {
            const container = document.getElementById('shippingZoneDisplay') || 
                            document.querySelector('.shipping-zone-container');
            if (!container) return;
            
            const shippingData = this.calculator?.dataManager?.getShipping() || {};
            const currentZone = this.calculator?.currentShippingZone;
            
            const zoneInfo = {
                currentZone: currentZone,
                zones: shippingData.zones || {},
                states: shippingData.states || [],
                manualOverride: this.calculator?.manualShippingOverride || null
            };
            
            // Create or update shipping zone component
            if (this.currentShippingZone) {
                this.currentShippingZone.update(zoneInfo);
            } else {
                this.currentShippingZone = new window.ShippingZone({
                    showStateSelector: true,
                    showManualOverride: true,
                    compact: true
                });
                
                const zoneElement = this.currentShippingZone.create(zoneInfo);
                if (container.tagName === 'DIV' && container.children.length === 0) {
                    container.appendChild(zoneElement);
                } else {
                    container.replaceWith(zoneElement);
                }
            }
        } else {
            // Fallback to legacy rendering
            this.updateShippingZoneDisplayLegacy();
        }
    }
    
    /**
     * Legacy shipping zone display (fallback)
     */
    updateShippingZoneDisplayLegacy() {
        const zoneDisplay = document.getElementById('shippingZoneDisplay');
        if (!zoneDisplay) return;
        
        const zone = this.calculator.currentShippingZone;
        if (!zone) {
            zoneDisplay.textContent = 'No shipping zone selected';
            return;
        }
        
        const shippingData = this.calculator.dataManager.getShipping();
        const zoneData = shippingData.zones[zone];
        
        if (zoneData) {
            zoneDisplay.textContent = `Shipping to ${zoneData.name} Zone`;
        } else {
            zoneDisplay.textContent = 'Unknown shipping zone';
        }
    }

    /**
     * Populate product dropdowns
     */
    populateProductDropdowns() {
        const productSelects = document.querySelectorAll('.product-select');
        
        productSelects.forEach(select => {
            this.populateProductDropdown(select);
        });
        
        console.log('✅ Product dropdowns populated');
    }

    populateProductDropdown(selectElement) {
        if (!selectElement) return;
        
        // Clear existing options except the first one
        selectElement.innerHTML = '<option value="">Select a product...</option>';
        
        // Get products from data manager
        const productsData = this.calculator.dataManager?.getProducts() || this.calculator.data?.products || {};
        
        // Handle both array and object product structures
        let products = [];
        if (Array.isArray(productsData)) {
            products = productsData;
        } else if (productsData && typeof productsData === 'object') {
            products = Object.entries(productsData).map(([key, product]) => ({
                ...product,
                id: key
            }));
        }
        
        // Sort products by name
        products.sort((a, b) => (a.name || a.title || '').localeCompare(b.name || b.title || ''));
        
        // Add options
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name || product.title || 'Unknown'} - ${product.sku || product.id || 'No SKU'}`;
            selectElement.appendChild(option);
        });
    }
    
    /**
     * Populate state dropdown from shipping zones
     */
    populateStateDropdown() {
        const stateSelect = document.getElementById('customerState');
        const shippingData = this.calculator.dataManager?.getShipping() || this.calculator.data?.shipping;
        
        if (!stateSelect || !shippingData?.zones) return;
        
        // Clear existing options
        stateSelect.innerHTML = '<option value="">Select state...</option>';
        
        // Collect all states from zones
        const allStates = [];
        Object.values(shippingData.zones).forEach(zone => {
            if (zone.states && Array.isArray(zone.states)) {
                zone.states.forEach(stateCode => {
                    allStates.push({
                        code: stateCode,
                        name: this.getStateName(stateCode)
                    });
                });
            }
        });
        
        // Sort states alphabetically by name
        allStates.sort((a, b) => a.name.localeCompare(b.name));
        
        // Add options
        allStates.forEach(state => {
            const option = document.createElement('option');
            option.value = state.code;
            option.textContent = state.name;
            stateSelect.appendChild(option);
        });
        
        console.log('✅ State dropdown populated with', allStates.length, 'states');
    }
    
    /**
     * Convert state code to full name
     */
    getStateName(code) {
        const stateNames = {
            'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
            'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
            'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
            'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
            'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
            'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
            'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
            'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
            'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
            'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
            'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
            'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
            'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
        };
        return stateNames[code] || code;
    }

    /**
     * Update admin UI - placeholder for now
     */
    updateAdminUI() {
        // This would update admin-specific UI elements
        // Implementation depends on admin requirements
        console.log('✅ Admin UI updated');
    }

    showNotification(message, type = 'info') {
        if (this.notificationManager) {
            this.notificationManager.show(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    /**
     * Render product lines in the order details section
     */
    renderProductLines(lineItems) {
        const container = document.getElementById('productLinesContainer');
        if (!container) {
            console.warn('Product lines container not found');
            return;
        }
        
        // Clear existing lines
        container.innerHTML = '';
        
        // Filter out any invalid line items (no product key, zero quantities, etc.)
        const validLineItems = Array.isArray(lineItems) ? lineItems.filter(item => {
            return item && item.productKey && item.masterCases && parseFloat(item.masterCases) > 0;
        }) : [];
        
        // Handle empty state
        if (!validLineItems.length) {
            // Explicitly hide the container
            container.style.display = 'none';
            // Show empty state and clear order details table
            this.updateEmptyState(true); // true = force empty state
            this.renderOrderDetailsTable([]);
            return;
        }
        
        // We have items, so show the container
        container.style.display = 'block';
        
        // Add each product line to the container
        validLineItems.forEach((item, index) => {
            if (typeof ProductManager !== 'undefined' && ProductManager.createProductLine) {
                const lineElement = ProductManager.createProductLine(item, index);
                container.appendChild(lineElement);
            } else {
                console.warn('⚠️ ProductManager.createProductLine not available');
            }
        });
        
        // Also render the order details table
        this.renderOrderDetailsTable(validLineItems);
        
        // Update empty state (should be hidden now)
        this.updateEmptyState();
    }

    /**
     * Update empty state visibility
     * @param {boolean} forceEmpty - If true, force empty state to be shown
     */
    updateEmptyState(forceEmpty = false) {
        const emptyState = document.getElementById('emptyState');
        const container = document.getElementById('productLinesContainer');
        
        if (!emptyState) {
            console.warn('Empty state element not found');
            return;
        }
        
        if (forceEmpty) {
            // Force empty state to be shown
            emptyState.style.display = 'block';
            if (container) container.style.display = 'none';
            return;
        }
        
        // Normal check based on product lines
        if (container) {
            const hasItems = container.children.length > 0;
            // Update empty state visibility
            emptyState.style.display = hasItems ? 'none' : 'block';
            // Also update container visibility
            container.style.display = hasItems ? 'block' : 'none';
        } else {
            // No container, show empty state
            emptyState.style.display = 'block';
        }
    }
    
    /**
     * Render order details table using modular component
     * @param {Array} lineItems - Array of line items
     */
    renderOrderDetailsTable(lineItems = []) {
        const container = document.getElementById('orderDetailsTable');
        if (!container) {
            console.warn('Order details table container not found');
            return;
        }
        
        // Wait for UI components to be ready
        if (!window.OrderDetailsTable) {
            // Fallback to legacy rendering if components not loaded
            return this.renderOrderDetailsTableLegacy(lineItems);
        }
        
        // Process line items for the component
        const processedItems = lineItems.map(item => ({
            ...item,
            id: item.id || item.productKey,
            productData: this.getProductData(item.productKey)
        }));
        
        // Clear container and render using modular component
        const tableComponent = new window.OrderDetailsTable({
            showImages: true,
            showLineTotal: false, // Compact design
            showActions: true,
            allowEdit: true
        });
        
        const tableElement = tableComponent.create(processedItems);
        container.innerHTML = '';
        container.appendChild(tableElement);
        
        // Store reference for later updates
        this.currentOrderTable = tableComponent;
        
        // Attach event listeners for remove buttons
        this.attachOrderTableListeners(container);
    }
    
    /**
     * Legacy order details table rendering (fallback)
     * @param {Array} lineItems 
     */
    renderOrderDetailsTableLegacy(lineItems = []) {
        const container = document.getElementById('orderDetailsTable');
        if (!container) return;
        
        if (!lineItems.length) {
            container.innerHTML = `
                <div class="alert alert-info text-center">
                    <i class="fas fa-shopping-cart fa-2x mb-2"></i>
                    <p class="mb-0">No products in quote yet. Add products from the catalog above.</p>
                </div>
            `;
            return;
        }
        
        const products = window.calculator?.dataManager?.getProducts() || {};
        
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0"><i class="fas fa-list-alt"></i> Order Details by Line Item</h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-dark">
                                <tr>
                                    <th width="60">Image</th>
                                    <th width="100">Item #</th>
                                    <th>Product</th>
                                    <th width="120">Qty</th>
                                    <th width="100">Unit Price</th>
                                    <th width="60">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${lineItems.map((item, index) => {
                                    const product = products[item.productKey] || {};
                                    const displayBoxes = (typeof ProductManager !== 'undefined' && ProductManager.calculateDisplayBoxes) ? ProductManager.calculateDisplayBoxes(item) : 0;
                                    const totalUnits = (typeof ProductManager !== 'undefined' && ProductManager.calculateTotalUnits) ? ProductManager.calculateTotalUnits(item) : 0;
                                    const unitPrice = (typeof ProductManager !== 'undefined' && ProductManager.getCostPerUnit) ? ProductManager.getCostPerUnit(item) : 0;
                                    const lineTotal = (typeof ProductManager !== 'undefined' && ProductManager.calculateLineTotal) ? ProductManager.calculateLineTotal(item) : 0;
                                    
                                    return `
                                        <tr data-line-id="${item.id}">
                                            <td>
                                                <img src="${product.image || 'assets/images/placeholder.jpg'}" 
                                                     alt="${product.name}" 
                                                     class="img-thumbnail" 
                                                     style="width: 40px; height: 40px; object-fit: cover;">
                                            </td>
                                            <td>
                                                <small class="text-muted">${product.itemNumber || item.productKey}</small>
                                            </td>
                                            <td>
                                                <strong>${product.name || 'Unknown Product'}</strong>
                                                <br>
                                                <small class="text-muted">${product.description || ''}</small>
                                            </td>
                                            <td>
                                                <div class="quantity-breakdown">
                                                    <div><strong>${item.masterCases || 0}</strong> cases</div>
                                                    <div><strong>${displayBoxes}</strong> boxes</div>
                                                    <div><strong>${totalUnits}</strong> units</div>
                                                </div>
                                            </td>
                                            <td class="text-end">
                                                <strong>$${unitPrice}</strong>
                                                <br>
                                                <small class="text-muted">per unit</small>
                                            </td>
                                            <td class="text-center">
                                                <button type="button" 
                                                        class="btn btn-sm btn-outline-danger remove-line-item" 
                                                        data-line-id="${item.id}"
                                                        title="Remove item">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners for remove buttons
        container.querySelectorAll('.remove-line-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const lineId = e.target.closest('button').dataset.lineId;
                if (typeof ProductManager !== 'undefined' && ProductManager.removeLineItem) {
                    ProductManager.removeLineItem(lineId);
                } else {
                    console.warn('⚠️ ProductManager.removeLineItem not available');
                }
            });
        });
        
        // Add tier information display
        this.updateTierDisplay();
        
        console.log('✅ Order details table rendered');
    }
    
    /**
     * Get product data for a given product key
     * @param {string} productKey 
     * @returns {Object}
     */
    getProductData(productKey) {
        const products = window.calculator?.dataManager?.getProducts() || {};
        return products[productKey] || {};
    }
    
    /**
     * Attach event listeners to order table
     * @param {HTMLElement} container 
     */
    attachOrderTableListeners(container) {
        // Add event listeners for remove buttons
        container.addEventListener('click', (e) => {
            if (e.target.closest('.remove-line-item')) {
                const button = e.target.closest('.remove-line-item');
                const lineId = button.dataset.lineId;
                if (typeof ProductManager !== 'undefined' && ProductManager.removeLine) {
                    ProductManager.removeLine(lineId);
                } else if (window.calculator?.removeLine) {
                    window.calculator.removeLine(lineId);
                } else {
                    console.warn('⚠️ No removeLine method available');
                }
            }
        });
    }
    
    /**
     * Update tier display information
     */
    updateTierDisplay() {
        if (!window.calculator) return;
        
        const totalCases = window.calculator.lineItems.reduce((sum, item) => {
            return sum + (parseFloat(item.masterCases) || 0);
        }, 0);
        
        const tiers = window.calculator.dataManager?.getTiers() || {};
        const currentTier = window.calculator.calculationEngine?.getCurrentTier(totalCases, tiers);
        
        if (currentTier) {
            this.showTierBadge(currentTier, totalCases);
        }
    }
    
    /**
     * Show tier badge using modular component
     */
    showTierBadge(tierInfo, totalCases) {
        // Use modular TierBadge component if available
        if (window.TierBadge) {
            const options = {
                compact: true,
                showProgress: true,
                showDiscount: true
            };
            
            // Create or update tier badge
            if (this.currentTierBadge) {
                this.currentTierBadge.update(tierInfo, totalCases);
            } else {
                this.currentTierBadge = new window.TierBadge(options);
                this.currentTierBadge.create(tierInfo, totalCases);
                
                // Insert after order details table
                const targetElement = document.querySelector('#orderDetailsTable');
                if (targetElement) {
                    this.currentTierBadge.insertAfter(targetElement);
                }
            }
        } else {
            // Fallback to legacy rendering
            this.showTierBadgeLegacy(tierInfo, totalCases);
        }
    }
    
    /**
     * Legacy tier badge rendering (fallback)
     */
    showTierBadgeLegacy(tierInfo, totalCases) {
        // Create or update tier badge
        let tierBadge = document.getElementById('tierBadge');
        if (!tierBadge) {
            tierBadge = document.createElement('div');
            tierBadge.id = 'tierBadge';
            tierBadge.className = 'tier-badge alert alert-info d-flex justify-content-between align-items-center';
            
            // Insert after order details table
            const orderTable = document.getElementById('orderDetailsTable');
            if (orderTable && orderTable.parentNode) {
                orderTable.parentNode.insertBefore(tierBadge, orderTable.nextSibling);
            }
        }
        
        const tierClass = this.getTierBadgeClass(tierInfo.key);
        tierBadge.className = `tier-badge alert ${tierClass} d-flex justify-content-between align-items-center mt-3`;
        
        tierBadge.innerHTML = `
            <div class="tier-info-compact">
                <span class="badge bg-success me-2">${tierInfo.name || tierInfo.key}</span>
                <span><strong>${totalCases}</strong> cases</span>
                <span class="text-success ms-2">
                    <i class="fas fa-percentage"></i> Volume discount applied
                </span>
            </div>
        `;
    }
    
    /**
     * Calculate tier progress percentage
     */
    calculateTierProgress(currentVolume, tierInfo) {
        if (!tierInfo.maxCases) return 100; // Max tier
        const progress = (currentVolume / tierInfo.maxCases) * 100;
        return Math.min(100, Math.max(0, progress));
    }
    
    /**
     * Get appropriate CSS class for tier badge
     */
    getTierBadgeClass(tierKey) {
        switch (tierKey) {
            case 'tier1': return 'alert-info';
            case 'tier2': return 'alert-warning';
            case 'tier3': return 'alert-success';
            default: return 'alert-secondary';
        }
    }

    /**
     * Populate all state dropdowns
     */
    populateStateDropdowns() {
        const stateSelects = document.querySelectorAll('select[id*="state"], select[id*="State"]');
        stateSelects.forEach(select => {
            if (this.templateManager) {
                this.templateManager.populateStateDropdown(select);
            }
        });
        console.log('✅ State dropdowns populated');
    }

    /**
     * Get shipping zone for state
     */
    getShippingZone(stateCode) {
        if (this.templateManager) {
            return this.templateManager.getShippingZone(stateCode);
        }
        return 'Standard'; // Fallback
    }

    /**
     * Update shipping zone display with state code
     */
    updateShippingZoneDisplay(stateCode) {
        // Use modular ShippingZone component if available
        if (window.ShippingZone && this.currentShippingZone) {
            const zone = stateCode ? this.getShippingZone(stateCode) : null;
            const cost = zone && this.templateManager ? this.templateManager.getShippingCost(zone) : 0;
            
            const zoneInfo = {
                currentZone: zone,
                selectedState: stateCode,
                shippingCost: cost,
                manualOverride: this.calculator?.manualShippingOverride || null
            };
            
            this.currentShippingZone.update(zoneInfo);
        } else {
            // Fallback to legacy rendering
            this.updateShippingZoneDisplayLegacyWithState(stateCode);
        }
    }
    
    /**
     * Legacy shipping zone display with state (fallback)
     */
    updateShippingZoneDisplayLegacyWithState(stateCode) {
        const zoneDisplay = document.getElementById('shippingZoneDisplay');
        if (!zoneDisplay) return;
        
        if (!stateCode) {
            zoneDisplay.textContent = 'Select a state to see shipping info';
            return;
        }
        
        const zone = this.getShippingZone(stateCode);
        const cost = this.templateManager ? this.templateManager.getShippingCost(zone) : 0;
        
        if (cost > 0) {
            zoneDisplay.textContent = `Shipping Zone: ${zone} (+$${cost})`;
        } else {
            zoneDisplay.textContent = `Shipping Zone: ${zone} (Free)`;
        }
    }
    
    /**
     * Update calculation display with quote data
     * Called by KanvaCalculator after calculations
     */
    updateCalculationDisplay(quote) {
        console.log('🧮 Updating calculation display with quote:', quote);
        console.log('🔍 OrderCalculation available:', !!window.OrderCalculation);
        console.log('🔍 currentOrderCalculation initialized:', !!this.currentOrderCalculation);
        
        // Update OrderCalculation component if available
        if (window.OrderCalculation && this.currentOrderCalculation) {
            console.log('🧮 Using modular OrderCalculation component');
            try {
                const calculationData = {
                    subtotal: quote.subtotal || 0,
                    shipping: quote.shipping || 0,
                    creditCardFee: quote.creditCardFee || 0,
                    total: quote.total || 0,
                    tierInfo: quote.currentTier ? {
                        name: quote.currentTier.name,
                        margin: quote.currentTier.margin
                    } : null
                };
                this.currentOrderCalculation.update(calculationData);
                console.log('✅ OrderCalculation updated successfully');
            } catch (error) {
                console.warn('⚠️ OrderCalculation update failed:', error);
                console.log('🧮 Falling back to legacy calculation display');
                this.updateCalculationDisplayLegacy(quote);
            }
        } else {
            console.log('🧮 Falling back to legacy calculation display');
            console.log('🔍 OrderCalculation available:', !!window.OrderCalculation);
            console.log('🔍 currentOrderCalculation initialized:', !!this.currentOrderCalculation);
            // Fallback to legacy calculation display
            this.updateCalculationDisplayLegacy(quote);
        }
        
        // Update tier badge if available
        if (quote.currentTier) {
            this.updateTierDisplay(quote.currentTier, quote.totalMasterCases);
        }
    }
    
    /**
     * Legacy calculation display update
     */
    updateCalculationDisplayLegacy(quote) {
        console.log('🔧 Starting legacy calculation display update');
        
        // The calculationDisplay in the Product & Order Details section has been removed
        // Only update the dedicated Order Calculation section now
        
        // Update the dedicated Order Calculation section
        const subtotalAmount = document.querySelector('#subtotalAmount');
        const shippingAmount = document.querySelector('#shippingAmount');
        const creditCardFee = document.querySelector('#creditCardFee');
        const totalAmount = document.querySelector('#totalAmount');
        
        if (subtotalAmount) subtotalAmount.textContent = `$${quote.subtotal?.toFixed(2) || '0.00'}`;
        if (shippingAmount) shippingAmount.textContent = `$${quote.shipping?.toFixed(2) || '0.00'}`;
        if (creditCardFee) creditCardFee.textContent = `$${quote.creditCardFee?.toFixed(2) || '0.00'}`;
        if (totalAmount) totalAmount.textContent = `$${quote.total?.toFixed(2) || '0.00'}`;
        
        console.log('✅ Legacy calculation display updated successfully');
        console.log('📊 Quote totals - Subtotal: $', quote.subtotal?.toFixed(2), 'Total: $', quote.total?.toFixed(2));
    }
    
    /**
     * Render product lines in the order details table
     * Called by KanvaCalculator when line items change
     */
    renderProductLines(lineItems) {
        console.log('📋 Rendering product lines:', lineItems);
        console.log('🔍 OrderDetailsTable available:', !!window.OrderDetailsTable);
        console.log('🔍 currentOrderDetailsTable initialized:', !!this.currentOrderDetailsTable);
        
        // Initialize OrderDetailsTable if not already initialized but available
        if (window.OrderDetailsTable && !this.currentOrderDetailsTable) {
            console.log('🔧 Initializing OrderDetailsTable on-demand');
            try {
                this.currentOrderDetailsTable = new window.OrderDetailsTable();
                console.log('✅ OrderDetailsTable initialized successfully on-demand');
            } catch (error) {
                console.error('❌ Failed to initialize OrderDetailsTable on-demand:', error);
                this.currentOrderDetailsTable = null;
            }
        }
        
        // Update OrderDetailsTable component if available
        if (window.OrderDetailsTable && this.currentOrderDetailsTable) {
            console.log('📋 Using modular OrderDetailsTable component');
            console.log('📋 Line items to render:', lineItems.length, lineItems);
            try {
                const updatedTable = this.currentOrderDetailsTable.create(lineItems);
                const container = document.querySelector('#orderDetailsTable');
                console.log('🔍 OrderDetailsTable container found:', !!container);
                console.log('🔍 UpdatedTable created:', !!updatedTable);
                
                if (container && updatedTable) {
                    container.innerHTML = '';
                    container.appendChild(updatedTable);
                    console.log('✅ OrderDetailsTable updated successfully');
                } else {
                    console.warn('⚠️ OrderDetailsTable container or updatedTable not found');
                    if (!container) {
                        console.warn('🚨 Container #orderDetailsTable not found in DOM');
                    }
                    if (!updatedTable) {
                        console.warn('🚨 OrderDetailsTable.create() returned null/undefined');
                    }
                }
            } catch (error) {
                console.error('❌ Error updating OrderDetailsTable:', error);
                console.error('❌ Error stack:', error.stack);
                // Fallback to legacy rendering
                console.log('📋 Falling back to legacy product lines rendering due to error');
                this.renderProductLinesLegacy(lineItems);
            }
        } else {
            console.log('📋 Falling back to legacy product lines rendering');
            // Fallback to legacy product lines rendering
            this.renderProductLinesLegacy(lineItems);
        }
    }
    
    /**
     * Legacy product lines rendering
     */
    renderProductLinesLegacy(lineItems) {
        console.log('🔧 Starting legacy product lines rendering');
        const container = document.querySelector('#productLinesContainer');
        console.log('🔍 productLinesContainer found:', !!container);
        if (!container) {
            console.warn('⚠️ Product lines container not found');
            return;
        }
        
        // Note: calculationDisplay in the Product & Order Details section has been removed
        // Calculations are now only shown in the dedicated Order Calculation card
        
        // Always clear existing product lines first to prevent duplication
        container.innerHTML = '';
        
        // If no line items, show empty state and exit
        if (!lineItems || lineItems.length === 0) {
            // Show empty state
            const emptyState = document.getElementById('emptyState');
            if (emptyState) {
                emptyState.style.display = 'block';
                // Make sure the product lines container is hidden
                container.style.display = 'none';
            }
            return;
        }
        
        // We have items, so hide empty state and show container
        const emptyState = document.getElementById('emptyState');
        if (emptyState) emptyState.style.display = 'none';
        container.style.display = 'block';
        
        // Filter out any line items with no product data or invalid master cases
        const validLineItems = lineItems.filter(line => {
            // Skip lines with no product key
            if (!line.productKey) return false;
            
            // Skip lines with zero or invalid quantities
            if (!line.masterCases || parseFloat(line.masterCases) <= 0) return false;
            
            // Ensure product exists in catalog
            const product = this.getProductByKey(line.productKey);
            return product !== null && product !== undefined;
        });
            
        const linesHtml = validLineItems.map(line => {
            const product = this.getProductByKey(line.productKey);
            // Only use known products with valid data
            if (!product) return '';
            
            const productName = product.name;
            const unitPrice = product.price || 0;
            const masterCases = line.masterCases || 0;
            const displayBoxes = line.displayBoxes || (masterCases * 12); // 12 displays per case
            const totalUnits = displayBoxes * 12; // 12 units per display
            const lineTotal = masterCases * unitPrice;
            
            return `
                <div class="product-line-item border rounded p-3 mb-3" data-line-id="${line.id}">
                    <div class="row align-items-center">
                        <div class="col-md-3">
                            <div class="d-flex align-items-center">
                                <img src="${product?.image || 'assets/placeholder-product.png'}" 
                                     class="product-thumb me-2" 
                                     style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;"
                                     onerror="this.src='assets/placeholder-product.png'">
                                <div>
                                    <div class="fw-bold">${productName}</div>
                                    <div class="text-muted small">${totalUnits} total units • $${unitPrice.toFixed(2)}/case</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small text-muted mb-1">Master Cases</label>
                            <input type="number" 
                                   class="form-control form-control-sm quantity-input" 
                                   value="${masterCases}" 
                                   min="0" 
                                   step="1"
                                   data-line-id="${line.id}"
                                   data-field="masterCases">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small text-muted mb-1">Display Boxes</label>
                            <input type="number" 
                                   class="form-control form-control-sm quantity-input" 
                                   value="${displayBoxes}" 
                                   min="0" 
                                   step="1"
                                   data-line-id="${line.id}"
                                   data-field="displayBoxes">
                        </div>
                        <div class="col-md-2 text-center">
                            <div class="fw-bold">$${lineTotal.toFixed(2)}</div>
                            <div class="text-muted small">${totalUnits} units</div>
                        </div>
                        <div class="col-md-3 text-end">
                            <div class="btn-group btn-group-sm" role="group">
                                <button type="button" class="btn btn-outline-primary" 
                                        onclick="ProductManager.updateLine('${line.id}')"
                                        title="Update quantities">
                                    <i class="fas fa-save"></i> Update
                                </button>
                                <button type="button" class="btn btn-outline-danger" 
                                        onclick="ProductManager.removeLine('${line.id}')"
                                        title="Remove item">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = linesHtml;
        
        // Add event listeners for quantity inputs
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const lineId = input.getAttribute('data-line-id');
                    if (lineId) {
                        ProductManager.updateLine(lineId);
                    }
                }
            });
        });
        console.log('✅ Legacy product lines rendered successfully. Lines count:', lineItems.length);
    }
    
    /**
     * Helper method to get product by key
     */
    getProductByKey(productKey) {
        if (!productKey) {
            console.warn('getProductByKey called with empty productKey');
            return null;
        }
        
        const calculator = window.calculator || this.calculator;
        const dataManager = calculator?.dataManager;
        
        // Try multiple data access patterns
        let products = null;
        if (dataManager) {
            products = dataManager.products || dataManager.data?.products || dataManager.getProducts?.();
        }
        
        if (!products) {
            console.warn('No products data available in getProductByKey');
            return null;
        }
        
        const product = products[productKey];
        if (!product) {
            console.warn(`Product not found for key: ${productKey}`);
            console.debug('Available product keys:', Object.keys(products));
        }
        
        return product;
    }
}

// Make available globally
if (typeof window !== 'undefined' && !window.UIManager) {
    window.UIManager = UIManager;
}
