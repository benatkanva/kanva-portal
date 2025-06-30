/**
 * Clean Product Manager
 * Simplified version to get the app working
 */

class ProductManager {
    /**
     * Create a new product line element
     */
    static createProductLine(lineItem = {}, index = 0) {
        const lineId = lineItem.id || `product-${Date.now()}-${index}`;
        const products = window.calculator?.dataManager?.getProducts() || {};
        const productData = products[lineItem.productKey] || {};
        
        const line = document.createElement('div');
        line.className = 'card product-line';
        line.dataset.lineId = lineId;
        
        line.innerHTML = `
            <div class="card-body">
                <h6>${productData.name || 'Unknown Product'}</h6>
                <p>Quantity: ${lineItem.quantity || 0}</p>
                <button class="btn btn-sm btn-danger remove-line-item" data-line-id="${lineId}">Remove</button>
            </div>
        `;
        
        return line;
    }

    /**
     * Render product catalog
     */
    static renderProductCatalog(container) {
        if (!container) {
            console.warn('[ProductManager] No container provided for product catalog');
            return;
        }

        try {
            const products = window.calculator?.dataManager?.getProducts() || {};
            const productKeys = Object.keys(products);
            
            if (productKeys.length === 0) {
                container.innerHTML = '<div class="alert alert-info">No products available</div>';
                return;
            }

            const gridContainer = document.createElement('div');
            gridContainer.className = 'row';
            
            productKeys.forEach(key => {
                const product = products[key];
                const tile = this.createProductTile(key, product);
                const col = document.createElement('div');
                col.className = 'col-md-4 mb-3';
                col.appendChild(tile);
                gridContainer.appendChild(col);
            });
            
            container.innerHTML = '';
            container.appendChild(gridContainer);
            console.log('✅ Product catalog rendered successfully');
            
        } catch (error) {
            console.error('[ProductManager] Error rendering product catalog:', error);
            container.innerHTML = '<div class="alert alert-danger">Failed to render products</div>';
        }
    }

    /**
     * Create a simple product tile
     */
    static createProductTile(productKey, product) {
        const tile = document.createElement('div');
        tile.className = 'product-tile card';
        tile.style.cursor = 'pointer';
        tile.dataset.productKey = productKey;
        
        tile.innerHTML = `
            <div class="card-body text-center">
                <img src="${product.image || 'assets/images/placeholder.jpg'}" 
                     alt="${product.name}" 
                     class="img-fluid mb-2" 
                     style="max-height: 100px; object-fit: contain;">
                <h6 class="card-title">${product.name}</h6>
                <p class="card-text small text-muted">$${product.price || '0.00'}</p>
                <button class="btn btn-primary btn-sm">Add to Quote</button>
            </div>
        `;
        
        tile.addEventListener('click', () => {
            this.addProductToQuote(productKey);
        });
        
        return tile;
    }

    /**
     * Add product to quote
     */
    static addProductToQuote(productKey) {
        console.log('[ProductManager] Adding product to quote:', productKey);
        if (window.calculator && window.calculator.addProductLine) {
            window.calculator.addProductLine(productKey);
        } else {
            console.warn('[ProductManager] Calculator not available');
        }
    }

    /**
     * Remove line item
     */
    static removeLineItem(lineId) {
        console.log('[ProductManager] Removing line item:', lineId);
        if (window.calculator && window.calculator.removeLineItem) {
            window.calculator.removeLineItem(lineId);
        } else {
            console.warn('[ProductManager] Calculator not available');
        }
    }

    /**
     * Calculate display boxes
     */
    static calculateDisplayBoxes(item) {
        return item.quantity || 0;
    }

    /**
     * Calculate total units
     */
    static calculateTotalUnits(item) {
        return item.quantity || 0;
    }

    /**
     * Get cost per unit
     */
    static getCostPerUnit(item) {
        return item.unitPrice || 0;
    }

    /**
     * Calculate line total
     */
    static calculateLineTotal(item) {
        return (item.quantity || 0) * (item.unitPrice || 0);
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ProductManager = ProductManager;
    console.log('✅ ProductManager loaded and available globally');
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductManager;
}
