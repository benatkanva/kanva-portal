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
        this.lineItems = lineItems;
        
        const container = document.createElement('div');
        container.className = 'order-details-table-container';
        
        if (!lineItems.length) {
            container.innerHTML = this.createEmptyState();
            this.element = container;
            return container;
        }

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
        return `
            <td class="text-center">
                <button type="button" 
                        class="btn btn-sm btn-outline-danger remove-line-item" 
                        data-line-id="${item.id}"
                        title="Remove item">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;
    }

    /**
     * Get product data for a line item
     * @param {Object} item 
     * @returns {Object}
     */
    getProductData(item) {
        const products = window.calculator?.dataManager?.getProducts() || {};
        return products[item.productKey] || item.productData || {};
    }

    /**
     * Calculate quantities for display
     * @param {Object} item 
     * @returns {Object}
     */
    calculateQuantities(item) {
        const masterCases = item.masterCases || 0;
        const displayBoxes = masterCases * 12; // 12 boxes per case
        const totalUnits = displayBoxes * 12;  // 12 units per box

        return {
            masterCases,
            displayBoxes,
            totalUnits
        };
    }

    /**
     * Calculate pricing for display
     * @param {Object} item 
     * @returns {Object}
     */
    calculatePricing(item) {
        const quantities = this.calculateQuantities(item);
        const product = this.getProductData(item);
        
        // Get tier-adjusted pricing if available
        const tierPrice = this.getTierAdjustedPrice(product, item);
        const unitPrice = tierPrice || product.pricing?.unit || 0;
        const lineTotal = quantities.totalUnits * unitPrice;

        return {
            unitPrice: unitPrice.toFixed(2),
            lineTotal: lineTotal.toFixed(2)
        };
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
        if (!this.element) return;

        // Remove item buttons
        this.element.addEventListener('click', (e) => {
            if (e.target.closest('.remove-line-item')) {
                const button = e.target.closest('.remove-line-item');
                const lineId = button.dataset.lineId;
                this.removeLineItem(lineId);
            }
        });
    }

    /**
     * Remove line item
     * @param {string} lineId 
     */
    removeLineItem(lineId) {
        if (window.calculator?.removeLineItem) {
            window.calculator.removeLineItem(lineId);
        } else if (window.ProductManager?.removeLine) {
            window.ProductManager.removeLine(lineId);
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
