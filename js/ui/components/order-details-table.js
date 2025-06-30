/**
 * Order Details Table Component
 * Creates a compact, responsive table for displaying line items
 */
class OrderDetailsTable {
    constructor(options = {}) {
        this.options = {
            showImages: true,
            showLineTotal: false, // Made false for compact design
            showActions: true,
            allowEdit: true,
            ...options
        };
        this.element = null;
        this.lineItems = [];
        
        // Ensure component styles are loaded
        this.loadComponentStyles();
    }
    
    /**
     * Load required CSS for this component
     */
    loadComponentStyles() {
        if (window.CSSLoader) {
            // Load tables and card styles
            window.CSSLoader.loadComponentCSS('tables');
            window.CSSLoader.loadComponentCSS('cards');
        }        
    }


    
    /**
     * Create the table element
     * @param {Array} lineItems 
     * @returns {HTMLElement}
     */
    create(lineItems = []) {
        console.log('📋 OrderDetailsTable.create called with:', lineItems.length, 'items');
        console.log('📋 Line items data:', lineItems);
        
        this.lineItems = lineItems;
        
        const container = document.createElement('div');
        container.className = 'order-details-table-container';
        
        if (!lineItems.length) {
            console.log('📋 No line items, showing empty state');
            container.innerHTML = this.createEmptyState();
            this.element = container;
            return container;
        }

        console.log('📋 Creating table with', lineItems.length, 'line items');
        
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="fas fa-list-alt"></i> 
                        Order Details by Line Item
                    </h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        ${this.createTable()}
                    </div>
                </div>
            </div>
        `;

        this.element = container;
        this.attachEventListeners();
        
        console.log('✅ OrderDetailsTable created successfully, container element:', container);
        return container;
    }

    /**
     * Create empty state display
     * @returns {string}
     */
    createEmptyState() {
        return `
            <div class="alert alert-info text-center">
                <i class="fas fa-shopping-cart fa-2x mb-2"></i>
                <p class="mb-0">No products in quote yet. Add products from the catalog above.</p>
            </div>
        `;
    }

    /**
     * Create the table HTML
     * @returns {string}
     */
    createTable() {
        return `
            <table class="table table-hover mb-0">
                ${this.createTableHeader()}
                <tbody>
                    ${this.lineItems.map(item => this.createTableRow(item)).join('')}
                </tbody>
            </table>
        `;
    }

    /**
     * Create table header
     * @returns {string}
     */
    createTableHeader() {
        const imageCol = this.options.showImages ? '<th width="60">Image</th>' : '';
        const lineTotalCol = this.options.showLineTotal ? '<th width="120">Line Total</th>' : '';
        const actionsCol = this.options.showActions ? '<th width="60">Actions</th>' : '';

        return `
            <thead class="table-dark">
                <tr>
                    ${imageCol}
                    <th width="100">Item #</th>
                    <th>Product</th>
                    <th width="120">Quantity</th>
                    <th width="100">Unit Price</th>
                    ${lineTotalCol}
                    ${actionsCol}
                </tr>
            </thead>
        `;
    }

    /**
     * Create a table row for a line item
     * @param {Object} item 
     * @returns {string}
     */
    createTableRow(item) {
        const product = this.getProductData(item);
        const quantities = this.calculateQuantities(item);
        const pricing = this.calculatePricing(item);
        
        const imageCol = this.options.showImages ? this.createImageColumn(product) : '';
        const lineTotalCol = this.options.showLineTotal ? `<td class="text-end"><span class="h6 text-success mb-0">$${pricing.lineTotal}</span></td>` : '';
        const actionsCol = this.options.showActions ? this.createActionsColumn(item) : '';

        return `
            <tr data-line-id="${item.id}">
                ${imageCol}
                <td>
                    <small class="text-muted">${product.itemNumber || item.productKey}</small>
                </td>
                <td>
                    <strong>${product.name || 'Unknown Product'}</strong>
                    <br>
                    <small class="text-muted">${product.description || ''}</small>
                </td>
                <td>
                    ${this.createQuantityDisplay(quantities)}
                </td>
                <td class="text-end">
                    <strong>$${pricing.unitPrice}</strong>
                    <br>
                    <small class="text-muted">per unit</small>
                </td>
                ${lineTotalCol}
                ${actionsCol}
            </tr>
        `;
    }

    /**
     * Create image column
     * @param {Object} product 
     * @returns {string}
     */
    createImageColumn(product) {
        const imageUrl = this.getProductImageUrl(product);
        return `
            <td>
                <img src="${imageUrl}" 
                     alt="${product.name}" 
                     class="img-thumbnail" 
                     style="width: 40px; height: 40px; object-fit: cover;">
            </td>
        `;
    }

    /**
     * Create quantity display
     * @param {Object} quantities 
     * @returns {string}
     */
    createQuantityDisplay(quantities) {
        return `
            <div class="quantity-breakdown">
                <div><strong>${quantities.masterCases}</strong> cases</div>
                <div><strong>${quantities.displayBoxes}</strong> boxes</div>
                <div><strong>${quantities.totalUnits}</strong> units</div>
            </div>
        `;
    }

    /**
     * Create actions column
     * @param {Object} item 
     * @returns {string}
     */
    createActionsColumn(item) {
        console.log('🔧 Creating action column for item ID:', item.id);
        
        const buttonHtml = `
            <td class="text-center">
                <button type="button" 
                        class="btn btn-sm btn-outline-danger remove-line-item" 
                        data-line-id="${item.id}"
                        title="Remove item"
                        style="border: 2px solid #dc3545; color: #dc3545; background: white; padding: 0.25rem 0.5rem; cursor: pointer;">
                    <i class="fas fa-times"></i> Delete
                </button>
            </td>
        `;
        
        console.log('🔧 Generated button HTML:', buttonHtml);
        return buttonHtml;
    }

    /**
     * Get product data for a line item
     * @param {Object} item 
     * @returns {Object}
     */
    getProductData(item) {
        // Try multiple paths to get product data
        let products = null;
        
        // First try: calculator.dataManager.getProducts()
        if (window.calculator?.dataManager?.getProducts) {
            products = window.calculator.dataManager.getProducts();
        }
        // Second try: calculator.dataManager.products
        else if (window.calculator?.dataManager?.products) {
            products = window.calculator.dataManager.products;
        }
        // Third try: calculator.dataManager.data.products
        else if (window.calculator?.dataManager?.data?.products) {
            products = window.calculator.dataManager.data.products;
        }
        
        // Get product by key or use embedded product data
        let product = {};
        if (products && item.productKey) {
            product = products[item.productKey] || {};
        }
        
        // Merge with any embedded product data
        if (item.productData) {
            product = { ...product, ...item.productData };
        }
        
        console.log('🔍 Product data lookup:', {
            productKey: item.productKey,
            productsAvailable: !!products,
            productFound: !!product.name,
            product: product
        });
        
        return product;
    }

    /**
     * Calculate quantities for display
     * @param {Object} item 
     * @returns {Object}
     */
    calculateQuantities(item) {
        const masterCases = item.masterCases || 0;
        
        // Get product data for accurate calculations
        const product = this.getProductData(item);
        
        // Use product configuration for calculations
        const displayBoxesPerCase = product.displayBoxesPerCase || 12;
        const unitsPerDisplayBox = product.unitsPerDisplayBox || 12;
        const unitsPerCase = product.unitsPerCase || (displayBoxesPerCase * unitsPerDisplayBox);
        
        // Calculate quantities based on master cases
        const displayBoxes = masterCases * displayBoxesPerCase;
        const totalUnits = masterCases * unitsPerCase;
        
        const result = {
            masterCases,
            displayBoxes,
            totalUnits
        };
        
        console.log('🧮 Quantity calculation:', {
            productKey: item.productKey,
            masterCases,
            displayBoxesPerCase,
            unitsPerDisplayBox,
            unitsPerCase,
            result
        });

        return result;
    }

    /**
     * Calculate pricing for display
     * @param {Object} item 
     * @returns {Object}
     */
    calculatePricing(item) {
        const product = this.getProductData(item);
        const quantities = this.calculateQuantities(item);
        
        // Use the actual unit price from the item or product
        const unitPrice = item.unitPrice || product.price || 0;
        
        // Calculate line total using the correct total units
        const lineTotal = quantities.totalUnits * unitPrice;
        
        const result = {
            unitPrice: unitPrice.toFixed(2),
            lineTotal: lineTotal.toFixed(2)
        };
        
        console.log('💰 Pricing calculation:', {
            productKey: item.productKey,
            unitPrice,
            totalUnits: quantities.totalUnits,
            lineTotal,
            result
        });

        return result;
    }

    /**
     * Get tier-adjusted price
     * @param {Object} product 
     * @param {Object} item 
     * @returns {number|null}
     */
    getTierAdjustedPrice(product, item) {
        if (window.calculator?.calculationEngine?.getTierPrice) {
            return window.calculator.calculationEngine.getTierPrice(item.productKey);
        }
        return null;
    }

    /**
     * Get product image URL
     * @param {Object} product 
     * @returns {string}
     */
    getProductImageUrl(product) {
        if (product.image && product.image.startsWith('http')) {
            return product.image;
        }
        return product.image || 'assets/images/placeholder.jpg';
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        if (!this.element) {
            console.error('🚫 OrderDetailsTable.attachEventListeners: No element found');
            return;
        }

        console.log('🎯 Attaching event listeners to OrderDetailsTable element:', this.element);

        // Remove item buttons - add debugging
        this.element.addEventListener('click', (e) => {
            console.log('💆 OrderDetailsTable click event:', e.target);
            
            if (e.target.closest('.remove-line-item')) {
                console.log('🎯 Delete button clicked!');
                const button = e.target.closest('.remove-line-item');
                const lineId = button.dataset.lineId;
                console.log('🔑 Line ID to remove:', lineId);
                this.removeLineItem(lineId);
            } else {
                console.log('🔍 Click was not on a delete button');
            }
        });
        
        console.log('✅ Event listeners attached successfully');
    }

    /**
     * Remove line item
     * @param {string} lineId 
     */
    removeLineItem(lineId) {
        console.log('🗑️ OrderDetailsTable.removeLineItem called with ID:', lineId);
        
        if (window.ProductManager?.removeLine) {
            console.log('🗑️ Calling ProductManager.removeLine');
            window.ProductManager.removeLine(lineId);
        } else if (window.calculator?.removeLineItem) {
            console.log('🗑️ Calling window.calculator.removeLineItem');
            window.calculator.removeLineItem(lineId);
        } else {
            console.error('🗑️ No remove method available');
        }
    }

    /**
     * Update table with new line items
     * @param {Array} lineItems 
     */
    update(lineItems) {
        const newElement = this.create(lineItems);
        if (this.element && this.element.parentNode) {
            this.element.parentNode.replaceChild(newElement, this.element);
        }
    }

    /**
     * Static method to create table
     * @param {Array} lineItems 
     * @param {Object} options 
     * @returns {HTMLElement}
     */
    static create(lineItems, options = {}) {
        const table = new OrderDetailsTable(options);
        return table.create(lineItems);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrderDetailsTable;
} else {
    window.OrderDetailsTable = OrderDetailsTable;
}

// Global test function for debugging
window.testOrderDetailsTable = function() {
    console.log('🧪 Testing OrderDetailsTable update...');
    console.log('🧪 OrderDetailsTable available:', typeof window.OrderDetailsTable);
    
    if (window.calculator && window.calculator.lineItems) {
        const lineItems = window.calculator.lineItems;
        console.log('🧪 Found', lineItems.length, 'line items:', lineItems);
        
        const uiManager = window.calculator.uiManager;
        if (uiManager && uiManager.renderProductLines) {
            console.log('🧪 Calling renderProductLines...');
            uiManager.renderProductLines(lineItems);
        } else {
            console.log('🧪 UIManager or renderProductLines not found');
        }
    } else {
        console.log('🧪 Calculator or lineItems not found');
    }
};
