/**
 * Product Manager
 * Handles product-related UI functionality
 */

class ProductManager {
    /**
     * Initialize the product manager
     */
    static init() {
        this.setupProductCatalog();
        this.setupSearchFilter();
        this.setupEventListeners();
        this.setupEmptyState();
        
        // Hide subtotal area in product details section as it's redundant
        this.hideProductDetailsTotals();
        
        console.log('🔧 ProductManager initialized');
    }
    
    /**
     * Hide subtotal area in product details section
     */
    static hideProductDetailsTotals() {
        // Hide the subtotal area in product details since it's duplicated in order calculations
        const orderDetailsTotals = document.querySelector('.product-order-section .order-details-totals');
        if (orderDetailsTotals) {
            orderDetailsTotals.style.display = 'none';
        }
        
        // Hide any standalone subtotal elements that might be in the product order section
        const subtotalSelectors = [
            '.product-order-section .subtotal-row', 
            '.product-order-section .subtotal-display',
            '.product-order-section .subtotal',
            '.product-order-section table.order-summary',
            '.product-order-body > table',
            '.product-order-section [id*="subtotal"]',
            '.product-order-body > .row:last-child'
        ];
        
        // Apply combined selector to catch all possible subtotal elements
        const combinedSelector = subtotalSelectors.join(', ');
        const subtotalElements = document.querySelectorAll(combinedSelector);
        
        subtotalElements.forEach(element => {
            element.style.display = 'none';
        });
        
        // Run this again after a short delay to catch any elements that might be added later
        setTimeout(() => {
            document.querySelectorAll(combinedSelector).forEach(element => {
                element.style.display = 'none';
            });
        }, 500);
    }
    
    /**
     * Setup the empty state for product lines
     */
    static setupEmptyState() {
        // Clear any existing product lines from DOM and calculator
        this.clearAllProductLines();
        
        // Find existing product lines container in HTML
        let productLinesContainer = document.getElementById('productLinesContainer');
        
        // Find existing empty state element or use the default one from HTML
        let emptyState = document.getElementById('emptyState');
        
        // If no empty state exists, create our own with better styling
        if (!emptyState) {
            emptyState = document.createElement('div');
            emptyState.id = 'emptyState';
            emptyState.className = 'text-center p-4 empty-state';
            
            // Insert in the appropriate section
            const productOrderSection = document.querySelector('.product-order-section .card-body');
            if (productOrderSection) {
                // Insert at the beginning of the product order section
                productOrderSection.insertBefore(emptyState, productOrderSection.firstChild);
            }
        }
        
        // Update the empty state with nicer content regardless if it existed or not
        emptyState.innerHTML = `
            <div class="empty-state-icon mb-3">
                <i class="fas fa-shopping-cart fa-3x text-muted"></i>
            </div>
            <h4 class="text-muted mb-2">No products added yet</h4>
            <p class="text-muted">Select products from the catalog above to get started</p>
            <p class="text-muted small">Click the "Add Product" button to add products to your quote</p>
        `;
        
        // Make sure the empty state is visible and product lines container is hidden
        if (emptyState) emptyState.style.display = 'block';
        if (productLinesContainer) productLinesContainer.style.display = 'none';
    }
    
    /**
     * Clear all product lines from UI and calculator
     */
    static clearAllProductLines() {
        // Clear calculator line items if calculator exists
        if (window.calculator && window.calculator.lineItems) {
            // Reset the calculator's line items array
            window.calculator.lineItems = [];
            
            // If UIManager exists, tell it to update
            if (window.calculator.uiManager) {
                window.calculator.uiManager.renderProductLines([]);
                window.calculator.calculateAll();
            }
        }
        
        // Remove any existing product line elements from the DOM
        const existingLines = document.querySelectorAll('.product-line-item');
        existingLines.forEach(line => line.remove());
        
        // Also check for any 'Unknown Product' elements that might be hardcoded
        const unknownProducts = document.querySelectorAll('.product-order-body [class*="product-"]');
        unknownProducts.forEach(element => {
            if (element.textContent && element.textContent.includes('Unknown Product')) {
                element.remove();
            }
        });
    }
    
    /**
     * Create a new product line element
     * @param {Object} lineItem - Line item data
     * @param {number} index - Line index
     * @returns {HTMLElement} - Product line element
     */
    static createProductLine(lineItem = {}, index = 0) {
        const lineId = lineItem.id || `line_${Date.now()}_${index}`;
        const productKey = lineItem.productKey || '';
        const masterCases = lineItem.masterCases || 1;
        const displayBoxes = lineItem.displayBoxes || 12;
        
        const lineElement = document.createElement('div');
        lineElement.className = 'product-line mb-3 p-3 border rounded';
        lineElement.setAttribute('data-line-id', lineId);
        
        lineElement.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-3">
                    <label class="form-label">Product</label>
                    <select class="form-select product-select" data-field="productKey">
                        <option value="">Select Product...</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <label class="form-label">Master Cases</label>
                    <input type="number" class="form-control" data-field="masterCases" 
                           value="${masterCases}" min="0" step="1">
                </div>
                <div class="col-md-2">
                    <label class="form-label">Display Boxes</label>
                    <input type="number" class="form-control" data-field="displayBoxes" 
                           value="${displayBoxes}" min="0" step="1">
                </div>
                <div class="col-md-2">
                    <label class="form-label">Cost/Unit</label>
                    <input type="text" class="form-control cost-display" readonly>
                </div>
                <div class="col-md-2">
                    <label class="form-label">Line Total</label>
                    <input type="text" class="form-control line-total-display" readonly>
                </div>
                <div class="col-md-1">
                    <button type="button" class="btn btn-outline-danger btn-sm remove-line" 
                            title="Remove Line">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Populate product dropdown
        this.populateProductSelect(lineElement.querySelector('.product-select'), productKey);
        
        // Add event listeners
        this.addLineEventListeners(lineElement, lineId);
        
        return lineElement;
    }
    
    /**
     * Render interactive product tiles using modular components
     * @param {HTMLElement} container - Container element
     */
    static renderProductCatalog(container) {
        if (!container) return;
        
        console.log('🎨 Rendering product catalog');
        
        // Ensure required CSS is loaded
        if (window.CSSLoader) {
            // Load product tile and cards CSS
            window.CSSLoader.loadComponentCSS('product-tile');
            window.CSSLoader.loadComponentCSS('cards');
        } else {
            console.warn('CSSLoader not available. Product catalog styling may be incomplete.');
        }
        
        // Check if we have products data
        const calculator = window.calculator;
        const dataManager = calculator?.dataManager;
        const products = dataManager?.products || dataManager?.data?.products;
        
        console.log('🔍 Calculator available:', !!calculator);
        console.log('🔍 DataManager available:', !!dataManager);
        console.log('🔍 Products available:', !!products, products ? Object.keys(products).length : 0);
        
        if (!products || Object.keys(products).length === 0) {
            console.warn('No products data available');
            container.innerHTML = '<p class="text-muted">Loading products...</p>';
            return;
        }
        
        // Create product tiles grid - smaller tiles in rows for quick selection
        const tilesGrid = document.createElement('div');
        tilesGrid.className = 'row g-2';
        
        Object.entries(products).forEach(([productKey, product]) => {
            const tileCol = document.createElement('div');
            // Smaller tiles: 6 per row on large screens, 4 on medium, 2 on small
            tileCol.className = 'col-6 col-md-3 col-lg-2';
            
            const tile = this.createProductTile(productKey, product);
            tileCol.appendChild(tile);
            tilesGrid.appendChild(tileCol);
        });
        
        container.innerHTML = '';
        container.appendChild(tilesGrid);
        
        console.log('✅ Product catalog rendered');
    }
    
    /**
     * Create a product tile element
     */
    static createProductTile(productKey, product) {
        const tile = document.createElement('div');
        tile.className = 'product-tile card h-100 shadow-sm';
        tile.style.cursor = 'pointer';
        tile.style.transition = 'transform 0.2s, box-shadow 0.2s';
        
        // Add hover effects
        tile.addEventListener('mouseenter', () => {
            tile.style.transform = 'translateY(-2px)';
            tile.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });
        
        tile.addEventListener('mouseleave', () => {
            tile.style.transform = 'translateY(0)';
            tile.style.boxShadow = '';
        });
        
        // Get image URL from product data
        const imageUrl = product.image || 'assets/images/placeholder.jpg';
        console.debug('[ProductManager] Image URL for', productKey, ':', imageUrl);
        
        tile.innerHTML = `
            <div class="card-body text-center p-2">
                <div class="product-image-container mb-2">
                    <img src="${imageUrl}" alt="${product.name}" 
                         class="product-image" 
                         style="width: 50px; height: 50px; object-fit: contain; border-radius: 6px;"
                         onerror="this.src='assets/images/placeholder.jpg';">
                </div>
                <h6 class="card-title mb-1" style="font-size: 0.85rem; font-weight: 600; color: #2c3e50; line-height: 1.2;">${product.name}</h6>
                <div class="pricing-info mb-1">
                    <span class="unit-price" style="font-size: 0.9rem; font-weight: 700; color: #27ae60;">$${product.price?.toFixed(2) || '0.00'}</span>
                    <span class="price-label" style="font-size: 0.7rem; color: #7f8c8d; display: block;">per case</span>
                </div>
                <div class="product-badges">
                    ${product.isBestSeller ? '<span class="badge bg-warning text-dark" style="font-size: 0.6rem;">BEST</span>' : ''}
                    <span class="badge bg-primary" style="font-size: 0.6rem;">${product.category?.toUpperCase() || 'PRODUCT'}</span>
                </div>
                <div class="quick-add-indicator mt-1" style="font-size: 0.7rem; color: #6c757d;">
                    <i class="fas fa-plus-circle"></i> Click to add
                </div>
            </div>
        `;
        
        // Add click handler
        tile.addEventListener('click', () => {
            ProductManager.addProductToQuote(productKey);
        });
        
        return tile;
    }
    
    /**
     * Add product to quote
     */
    static addProductToQuote(productKey) {
        if (!window.calculator) {
            console.error('Calculator not available');
            return;
        }
        
        const calculator = window.calculator;
        const dataManager = calculator?.dataManager;
        const products = dataManager?.products || dataManager?.data?.products;
        const product = products?.[productKey];
        if (!product) {
            console.error('Product not found:', productKey);
            return;
        }
        
        // Hide empty state if it's visible
        const emptyState = document.getElementById('productEmptyState');
        if (emptyState) emptyState.style.display = 'none';
        
        // Show the product lines container
        const productLinesContainer = document.getElementById('productLinesContainer');
        if (productLinesContainer) productLinesContainer.style.display = 'block';
        const orderDetailsCard = document.querySelector('.product-order-section');
        if (orderDetailsCard) orderDetailsCard.style.display = 'block';
        
        // Add product line to calculator
        const lineId = `line_${Date.now()}`;
        
        // Use product data from products.json for quantities
        const unitsPerCase = product.unitsPerCase;
        const displayBoxesPerCase = product.displayBoxesPerCase;
        const unitsPerDisplayBox = product.unitsPerDisplayBox;
        
        // Calculate values based on 1 master case as default
        const masterCases = 1;
        const displayBoxes = masterCases * displayBoxesPerCase;
        const units = masterCases * unitsPerCase;
        const unitPrice = product.price || 0;
        const total = unitPrice * units;
        
        const newLine = {
            id: lineId,
            productKey: productKey,
            masterCases: masterCases,
            displayBoxes: displayBoxes,
            units: units,
            unitPrice: unitPrice,
            total: total,
            productData: product
        };
        
        // Add to calculator's line items
        if (!window.calculator.lineItems) {
            window.calculator.lineItems = [];
        }
        window.calculator.lineItems.push(newLine);
        
        // Immediately render the new product line in the UI
        this.renderProductLine(newLine, productLinesContainer);
        
        // Update calculator and totals
        if (window.calculator.calculateAll) {
            window.calculator.calculateAll();
        }
        
        // Update the Order Details table
        if (window.UIManager && window.UIManager.getInstance) {
            const uiManager = window.UIManager.getInstance();
            if (uiManager && uiManager.updateOrderDetailsTable) {
                uiManager.updateOrderDetailsTable();
            }
        }
        
        // Show notification
        if (window.NotificationManager) {
            window.NotificationManager.showSuccess(`${product.name} added to quote!`, 'Product Added');
        }
        
        console.log('✅ Product added to quote:', productKey);
    }
    
    /**
     * Render a single product line in the UI
     * @param {Object} lineItem - The product line item to render
     * @param {HTMLElement} container - The container to append the product line to
     */
    static renderProductLine(lineItem, container) {
        if (!container) return;
        
        const product = lineItem.productData || {};
        
        // Create the product line element
        const lineElement = document.createElement('div');
        lineElement.className = 'product-line-item border rounded mb-2';
        lineElement.setAttribute('data-line-id', lineItem.id);
        
        // Get product image URL
        const imageUrl = this.getProductImageUrl(lineItem.productKey) || 'assets/placeholder-product.png';
        
        // Create the line content using our new horizontal layout CSS classes
        lineElement.innerHTML = `
            <div class="product-line-horizontal">
                <!-- Delete Button (top-right) -->
                <div class="product-line-delete">
                    <button type="button" class="btn btn-sm btn-outline-danger" 
                        onclick="ProductManager.removeLine('${lineItem.id}')" title="Remove product">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Product Thumbnail -->
                <div class="product-line-thumbnail">
                    <img src="${imageUrl}" class="img-fluid rounded" style="width: 42px; height: 42px; object-fit: contain;"
                        onerror="this.src='assets/placeholder-product.png'">
                </div>
                
                <!-- Product Details Section -->
                <div class="product-line-details">
                    <!-- Product Name/Title -->
                    <div class="product-line-title">
                        <div class="fw-semibold text-truncate">${product.name || 'Unknown Product'}</div>
                        <div class="small text-muted">$${lineItem.unitPrice ? lineItem.unitPrice.toFixed(2) : '0.00'}/unit</div>
                    </div>
                    
                    <!-- Input Fields (horizontal layout) -->
                    <div class="product-line-inputs">
                        <!-- Master Cases -->
                        <div class="product-line-input-group">
                            <label class="form-label small text-muted mb-1">Master Cases</label>
                            <input type="number" class="form-control form-control-sm quantity-input" 
                                value="${lineItem.masterCases}" min="0" step="1" 
                                data-line-id="${lineItem.id}" data-field="masterCases">
                        </div>
                        
                        <!-- Display Boxes -->
                        <div class="product-line-input-group">
                            <label class="form-label small text-muted mb-1">Display Boxes</label>
                            <input type="number" class="form-control form-control-sm quantity-input" 
                                value="${lineItem.displayBoxes}" min="0" step="1" 
                                data-line-id="${lineItem.id}" data-field="displayBoxes">
                        </div>
                        
                        <!-- Unit Price -->
                        <div class="product-line-input-group">
                            <label class="form-label small text-muted mb-1">Unit Price</label>
                            <div class="input-group input-group-sm">
                                <span class="input-group-text">$</span>
                                <input type="text" class="form-control form-control-sm" 
                                    value="${lineItem.unitPrice ? lineItem.unitPrice.toFixed(2) : '0.00'}" readonly>
                            </div>
                        </div>
                        
                        <!-- Total Units -->
                        <div class="product-line-input-group">
                            <label class="form-label small text-muted mb-1">Total Units</label>
                            <input type="text" class="form-control form-control-sm" 
                                value="${lineItem.units}" readonly>
                        </div>
                        
                        <!-- Line Total -->
                        <div class="product-line-input-group">
                            <label class="form-label small text-muted mb-1">Line Total</label>
                            <div class="input-group input-group-sm">
                                <span class="input-group-text">$</span>
                                <input type="text" class="form-control form-control-sm" 
                                    value="${lineItem.total ? lineItem.total.toFixed(2) : '0.00'}" readonly>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Append to container
        container.appendChild(lineElement);
        
        // Add event listeners for quantity inputs
        const quantityInputs = lineElement.querySelectorAll('.quantity-input');
        quantityInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const lineId = e.target.getAttribute('data-line-id');
                ProductManager.updateLine(lineId);
            });
            
            input.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    const lineId = e.target.getAttribute('data-line-id');
                    ProductManager.updateLine(lineId);
                }
            });
        });
        
        console.log(`🔄 Rendered product line: ${product.name || 'Unknown Product'}`);
    }
    
    /**
     * Remove a product line from the quote
     */
    static removeLine(lineId) {
        if (!window.calculator || !window.calculator.lineItems) {
            console.error('Calculator or line items not available');
            return;
        }
        
        // Find the line item by ID
        const lineItemIndex = window.calculator.lineItems.findIndex(item => item.id === lineId);
        if (lineItemIndex < 0) {
            console.warn('Line item not found:', lineId);
            return;
        }
        
        // Get product info before removal (for notification)
        const product = window.calculator.lineItems[lineItemIndex].productData || {};
        const productName = product.name || 'Product';
        
        // Remove from calculator's line items
        window.calculator.lineItems.splice(lineItemIndex, 1);
        
        // Remove from DOM immediately
        const lineElement = document.querySelector(`.product-line-item[data-line-id="${lineId}"]`);
        if (lineElement && lineElement.parentNode) {
            lineElement.parentNode.removeChild(lineElement);
        }
        
        // Update calculator totals
        if (window.calculator.calculateAll) {
            window.calculator.calculateAll();
        }
        
        // Update the Order Details table
        if (window.UIManager && window.UIManager.getInstance) {
            const uiManager = window.UIManager.getInstance();
            if (uiManager && uiManager.updateOrderDetailsTable) {
                uiManager.updateOrderDetailsTable();
            }
        }
        
        // If no items left, show empty state
        if (window.calculator.lineItems.length === 0) {
            const emptyState = document.getElementById('productEmptyState');
            if (emptyState) emptyState.style.display = 'block';
            
            const productLinesContainer = document.getElementById('productLinesContainer');
            if (productLinesContainer) productLinesContainer.style.display = 'none';
        }
        
        // Show notification
        if (window.NotificationManager) {
            window.NotificationManager.showSuccess(`${productName} removed from quote`, 'Product Removed');
        }
        
        console.log('✅ Product line removed:', lineId);
    }
    
    /**
     * Update a product line with new quantities
     * @param {string} lineId - The ID of the line to update
     */
    static updateLine(lineId) {
        if (!window.calculator || !window.calculator.lineItems) {
            console.error('Calculator or line items not available');
            return;
        }
        
        // Find the line item by ID
        const lineItem = window.calculator.lineItems.find(item => item.id === lineId);
        if (!lineItem) {
            console.warn('Line item not found:', lineId);
            return;
        }
        
        // Get the line element from the DOM
        const lineElement = document.querySelector(`.product-line-item[data-line-id="${lineId}"]`);
        if (!lineElement) {
            console.warn('Line element not found:', lineId);
            return;
        }
        
        // Get product data for conversion calculations
        const dataManager = window.calculator?.dataManager;
        const products = dataManager?.products || dataManager?.data?.products;
        const product = products?.[lineItem.productKey];
        
        if (!product) {
            console.warn('Product data not found for line:', lineId);
            return;
        }
        
        // Get quantity information directly from product data in products.json
        const unitsPerCase = product.unitsPerCase;
        const displayBoxesPerCase = product.displayBoxesPerCase;
        const unitsPerDisplayBox = product.unitsPerDisplayBox;
        
        console.log(`📦 Product ${product.name} configuration:`, {
            unitsPerCase,
            displayBoxesPerCase,
            unitsPerDisplayBox
        });
        
        // Update values from form inputs
        const inputs = lineElement.querySelectorAll('[data-field]');
        let updatedField = null;
        
        inputs.forEach(input => {
            const field = input.getAttribute('data-field');
            const value = input.value;
            
            if (field && value !== undefined) {
                // Convert string values to appropriate types
                if (field === 'masterCases' || field === 'displayBoxes' || field === 'units') {
                    const oldValue = lineItem[field];
                    lineItem[field] = parseFloat(value) || 0;
                    
                    // If this field was changed, mark it for recalculation
                    if (oldValue !== lineItem[field]) {
                        updatedField = field;
                        console.log(`🔄 Updated ${field} from ${oldValue} to ${lineItem[field]}`);
                    }
                } else {
                    lineItem[field] = value;
                }
            }
        });
        
        // Perform automatic conversions based on which field was updated
        if (updatedField) {
            if (updatedField === 'masterCases') {
                // Master cases updated - calculate display boxes and units
                lineItem.displayBoxes = lineItem.masterCases * displayBoxesPerCase;
                lineItem.units = lineItem.masterCases * unitsPerCase;
                console.log(`🧮 Master cases conversion: ${lineItem.masterCases} cases → ${lineItem.displayBoxes} display boxes → ${lineItem.units} units`);
            } else if (updatedField === 'displayBoxes') {
                // Display boxes updated - calculate master cases and units
                lineItem.masterCases = (lineItem.displayBoxes / displayBoxesPerCase).toFixed(2);
                lineItem.units = lineItem.displayBoxes * unitsPerDisplayBox;
                console.log(`🧮 Display boxes conversion: ${lineItem.displayBoxes} boxes → ${lineItem.masterCases} cases → ${lineItem.units} units`);
            } else if (updatedField === 'units') {
                // Units updated - calculate master cases and display boxes
                lineItem.displayBoxes = Math.round(lineItem.units / unitsPerDisplayBox);
                lineItem.masterCases = (lineItem.units / unitsPerCase).toFixed(2);
                console.log(`🧮 Units conversion: ${lineItem.units} units → ${lineItem.displayBoxes} display boxes → ${lineItem.masterCases} cases`);
            }
            
            // Update line item pricing based on quantity
            lineItem.quantity = lineItem.units; // Set quantity to units for pricing calculations
            lineItem.unitPrice = product.price || 0;
            lineItem.total = lineItem.quantity * lineItem.unitPrice;
            console.log(`💰 Updated pricing: ${lineItem.quantity} units × $${lineItem.unitPrice} = $${lineItem.total}`);
            
            // Store the product data reference for easy access
            lineItem.productData = product;
            
            // Update the input fields with the new calculated values
            this.updateLineInputs(lineElement, lineItem);
            
            // Update calculator totals
            if (window.calculator.calculateAll) {
                window.calculator.calculateAll();
            }
            
            // Update the Order Details table
            if (window.UIManager && window.UIManager.getInstance) {
                const uiManager = window.UIManager.getInstance();
                if (uiManager && uiManager.updateOrderDetailsTable) {
                    uiManager.updateOrderDetailsTable();
                }
            }
        }
        
        // Trigger calculator update
        if (window.calculator.calculateAll) {
            window.calculator.calculateAll();
        }
    };
    
    /**
     * Update line input fields with calculated values
     * @param {HTMLElement} lineElement 
     * @param {Object} lineItem 
     */
    static updateLineInputs(lineElement, lineItem) {
        // Update all input fields with new values
        const masterCasesInput = lineElement.querySelector('[data-field="masterCases"]');
        const displayBoxesInput = lineElement.querySelector('[data-field="displayBoxes"]');
        const unitsInput = lineElement.querySelector('[data-field="units"]');
        const unitPriceInput = lineElement.querySelector('[data-field="unitPrice"]');
        const totalInput = lineElement.querySelector('[data-field="total"]');
        
        if (masterCasesInput) masterCasesInput.value = lineItem.masterCases;
        if (displayBoxesInput) displayBoxesInput.value = lineItem.displayBoxes;
        if (unitsInput) unitsInput.value = lineItem.units;
        if (unitPriceInput) unitPriceInput.value = lineItem.unitPrice?.toFixed(2) || '0.00';
        if (totalInput) totalInput.value = lineItem.total?.toFixed(2) || '0.00';
        
        // Also update any display elements that show the values
        const masterCasesDisplay = lineElement.querySelector('.master-cases-display');
        const displayBoxesDisplay = lineElement.querySelector('.display-boxes-display');
        const unitsDisplay = lineElement.querySelector('.units-display');
        const totalDisplay = lineElement.querySelector('.total-display');
        
        if (masterCasesDisplay) masterCasesDisplay.textContent = lineItem.masterCases;
        if (displayBoxesDisplay) displayBoxesDisplay.textContent = lineItem.displayBoxes;
        if (unitsDisplay) unitsDisplay.textContent = lineItem.units;
        if (totalDisplay) totalDisplay.textContent = `$${lineItem.total?.toFixed(2) || '0.00'}`;
        
        // Using lineItem.id instead of undefined lineId variable
        console.log('✅ Product line updated:', lineItem.id, lineItem);
    }
    
    /**
     * Get product image URL
     */
    static getProductImageUrl(productKey) {
        const imageMap = {
            'focus': 'assets/product_renders/Kanva_focus+flow_Box_Bottle_Master_4_30.png',
            'release': 'assets/product_renders/Kanva_Release+Relax_Box_Bottle_Master_4_30_v2.png',
            'zoom': 'assets/product_renders/Kanva_ZOOM_Bottle_Box_4_30.png',
            'mango': 'assets/product_renders/Kanva_Mango_3d_Display_Box_4_30.png',
            'raw': 'assets/product_renders/Kanva_RAW+Releaf_DisplayBox.png'
        };
        
        return imageMap[productKey] || 'assets/placeholder-product.png';
    }
    
    /**
     * Populate product select dropdown
     */
    static populateProductSelect(selectElement, selectedValue = '') {
        if (!selectElement) return;
        
        const products = window.calculator?.data?.products;
        if (!products) return;
        
        // Clear existing options except first
        selectElement.innerHTML = '<option value="">Select Product...</option>';
        
        // Add product options
        Object.entries(products).forEach(([key, product]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = product.name;
            if (key === selectedValue) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
    }
    
    /**
     * Add event listeners to product line
     */
    static addLineEventListeners(lineElement, lineId) {
        // Product selection change
        const productSelect = lineElement.querySelector('.product-select');
        productSelect?.addEventListener('change', (e) => {
            this.updateLineItem(lineId, 'productKey', e.target.value);
        });
        
        // Quantity changes
        const masterCasesInput = lineElement.querySelector('[data-field="masterCases"]');
        masterCasesInput?.addEventListener('change', (e) => {
            this.updateLineItem(lineId, 'masterCases', parseInt(e.target.value) || 0);
        });
        
        const displayBoxesInput = lineElement.querySelector('[data-field="displayBoxes"]');
        displayBoxesInput?.addEventListener('change', (e) => {
            this.updateLineItem(lineId, 'displayBoxes', parseInt(e.target.value) || 0);
        });
        
        // Remove line
        const removeBtn = lineElement.querySelector('.remove-line');
        removeBtn?.addEventListener('click', () => {
            this.removeLine(lineId);
        });
    }
    
    /**
     * Update line item data
     */
    static updateLineItem(lineId, field, value) {
        if (!window.calculator?.lineItems) return;
        
        const lineItem = window.calculator.lineItems.find(item => item.id === lineId);
        if (!lineItem) return;
        
        lineItem[field] = value;
        
        // Recalculate if needed
        if (window.calculator.calculateAll) {
            window.calculator.calculateAll();
        }
    }
    
    /**
     * Remove product line
     */
    static removeLine(lineId) {
        if (!window.calculator?.lineItems) return;
        
        const index = window.calculator.lineItems.findIndex(item => item.id === lineId);
        if (index > -1) {
            window.calculator.lineItems.splice(index, 1);
        }
        
        // Remove from DOM
        const lineElement = document.querySelector(`[data-line-id="${lineId}"]`);
        if (lineElement) {
            lineElement.remove();
        }
        
        // Recalculate
        if (window.calculator.calculateAll) {
            window.calculator.calculateAll();
        }
    }
    
    /**
     * Render product lines container
     */
    static renderProductLines(lineItems = [], container) {
        if (!container) {
            container = document.getElementById('productLinesContainer');
            if (!container) return;
        }
        
        container.innerHTML = '';
        
        // Add each product line
        lineItems.forEach((item, index) => {
            const line = this.createProductLine(item, index);
            container.appendChild(line);
        });
        
        // Update calculator after rendering
        window.calculator?.calculateAll();
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ProductManager = ProductManager;
}

console.log('✅ ProductManager loaded successfully');
