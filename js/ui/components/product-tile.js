/**
 * Product Tile Component
 * Creates interactive product tiles with images, pricing, and click animations
 */

// Prevent duplicate class declarations
if (typeof ProductTile !== 'undefined') {
    console.debug('[ProductTile] Class already declared, skipping redeclaration');
} else {

class ProductTile {
    constructor(productData, options = {}) {
        console.debug('[ProductTile] constructor called with:', productData, options);
        this.product = productData;
        this.options = {
            showAnimation: true,
            showPrice: true,
            showImage: true,
            clickHandler: null,
            ...options
        };
        this.element = null;
        
        // Ensure component styles are loaded
        this.loadComponentStyles();
    }
    
    /**
     * Load required CSS for this component
     */
    loadComponentStyles() {
        if (window.CSSLoader) {
            // Load product tile and card styles
            window.CSSLoader.loadComponentCSS('product-tile');
            window.CSSLoader.loadComponentCSS('cards');
            window.CSSLoader.loadComponentCSS('buttons');
        }
    }

    /**
     * Create the product tile element
     * @returns {HTMLElement}
     */
    create() {
        console.debug('[ProductTile] create called for product:', this.product);
        if (!this.product || !this.product.name) {
            console.warn('[ProductTile] Missing or invalid product data:', this.product);
        }
        const tile = document.createElement('div');
        tile.className = 'product-tile card h-100';
        tile.setAttribute('data-product-key', this.product.key || this.product.id);
        
        tile.innerHTML = `
            <div class="card-body text-center p-2 d-flex flex-column h-100">
                ${this.createImageSection()}
                ${this.createInfoSection()}
                ${this.createClickIndicator()}
            </div>
        `;

        this.element = tile;
        this.attachEventListeners();
        return tile;
    }

    /**
     * Create the image section
     * @returns {string}
     */
    createImageSection() {
        console.debug('[ProductTile] createImageSection for:', this.product && this.product.name);
        if (!this.options.showImage) return '';
        
        const imageUrl = this.getImageUrl();
        
        // If no image URL is available, return empty string
        if (!imageUrl) {
            console.debug('[ProductTile] No image URL available for product:', {
                productKey: this.product?.key,
                productName: this.product?.name
            });
            return '';
        }
        
        return `
            <div class="product-tile-image mb-2">
                <img 
                    src="${imageUrl}" 
                    alt="${this.product.name || 'Product image'}" 
                    class="img-fluid"
                    loading="lazy"
                    onerror="console.error('Failed to load product image:', { 
                        src: this.src, 
                        productKey: '${this.product?.key || 'unknown'}',
                        timestamp: new Date().toISOString() 
                    }); this.style.display='none';"
                    data-product-key="${this.product?.key || ''}"
                >
                <div class="product-tile-overlay">
                    <i class="fas fa-plus-circle"></i>
                </div>
            </div>
        `;
    }

    /**
     * Create the info section
     * @returns {string}
     */
    createInfoSection() {
        const badgeHtml = this.createBadges();
        const priceHtml = this.options.showPrice ? this.createPriceDisplay() : '';
        
        return `
            <div class="product-tile-info flex-grow-1">
                <div class="product-tile-name">${this.product.name}</div>
                ${badgeHtml}
                ${priceHtml}
                <div class="product-tile-meta">${this.product.description || ''}</div>
            </div>
        `;
    }

    /**
     * Create product badges (NEW, EXTRACT SHOTS, etc.)
     * @returns {string}
     */
    createBadges() {
        const badges = [];
        
        if (this.product.isBestSeller) {
            badges.push('<span class="product-badge badge-best">BEST SELLER</span>');
        }
        if (this.product.isNew) {
            badges.push('<span class="product-badge badge-new">NEW</span>');
        }
        if (this.product.category === 'extract_shots') {
            badges.push('<span class="product-badge badge-extract">EXTRACT SHOTS</span>');
        }
        if (this.product.category === '2oz_wellness') {
            badges.push('<span class="product-badge badge-wellness">2OZ WELLNESS</span>');
        }
        return badges.length ? `<div class="product-badges">${badges.join('')}</div>` : '';
    }

    /**
     * Create price display
     * @returns {string}
     */
    createPriceDisplay() {
        // Use flat product.price and unitsPerCase/displayBoxesPerCase from products.json
        const unitPrice = this.product.price || 0;
        const unitsPerDisplayBox = this.product.unitsPerDisplayBox || 12;
        const displayBoxesPerCase = this.product.displayBoxesPerCase || 12;
        const unitsPerCase = this.product.unitsPerCase || (unitsPerDisplayBox * displayBoxesPerCase) || 144;

        const displayBoxPrice = unitPrice * unitsPerDisplayBox;
        const masterCasePrice = unitPrice * unitsPerCase;

        return `
            <div class="product-tile-pricing">
                <div class="price-unit">Unit: <strong>$${unitPrice.toFixed(2)}</strong></div>
                <div class="price-display-box">Display Box (${unitsPerDisplayBox}): <strong>$${displayBoxPrice.toFixed(2)}</strong></div>
                <div class="price-master-case">Master Case (${unitsPerCase}): <strong>$${masterCasePrice.toFixed(2)}</strong></div>
            </div>
        `;
    }

    /**
     * Create click indicator overlay
     * @returns {string}
     */
    createClickIndicator() {
        return `
            <div class="product-tile-click-indicator">
                <i class="fas fa-check-circle"></i>
                <span>Added!</span>
            </div>
        `;
    }

    /**
     * Get product image URL with debug information
     * @returns {string}
     */
    getImageUrl() {
        // If no image is specified, log debug info and return empty string
        if (!this.product || !this.product.image) {
            const debugInfo = {
                message: 'Product image is missing',
                product: this.product ? this.product.key || 'unknown' : 'undefined',
                timestamp: new Date().toISOString()
            };
            console.debug('[ProductTile] Missing product image:', debugInfo);
            return '';
        }
        
        // If it's a full HTTP/HTTPS URL, use as-is
        if (this.product.image.startsWith('http')) {
            return this.product.image;
        }
        
        // If image path already includes assets/, use as-is
        if (this.product.image.startsWith('assets/')) {
            return this.product.image;
        }
        
        // Construct the full path to the image
        const imageName = this.product.image.endsWith('.png') 
            ? this.product.image 
            : `${this.product.image}.png`;
            
        const fullPath = `assets/product_renders/${imageName}`;
        
        // Log debug information for tracking
        console.debug('[ProductTile] Image details:', {
            productKey: this.product.key || 'unknown',
            imagePath: fullPath,
            resolvedPath: new URL(fullPath, window.location.origin).href,
            timestamp: new Date().toISOString()
        });
        
        return fullPath;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Make entire tile clickable, but only trigger add if not already added
        if (this.options.clickHandler) {
            this.element.addEventListener('click', (e) => {
                // Only trigger for main tile or overlay/button
                if (e.target.closest('.product-tile-inner') || e.target.closest('.product-tile-overlay')) {
                    this.options.clickHandler(this.product);
                }
            });
        }

        this.element.addEventListener('mouseenter', () => {
            this.element.classList.add('hover');
        });

        this.element.addEventListener('mouseleave', () => {
            this.element.classList.remove('hover');
        });
    }

    /**
     * Handle tile click
     * @param {Event} e 
     */
    handleClick(e) {
        e.preventDefault();
        
        if (this.element.classList.contains('clicking')) return;

        // Add click animation
        if (this.options.showAnimation) {
            this.showClickAnimation();
        }

        // Call custom click handler if provided
        if (this.options.clickHandler && typeof this.options.clickHandler === 'function') {
            this.options.clickHandler(this.product, this.element);
        }

        // Default behavior - add to quote
        this.addToQuote();
    }

    /**
     * Show click animation
     */
    showClickAnimation() {
        this.element.classList.add('clicking');
        
        const indicator = this.element.querySelector('.product-tile-click-indicator');
        if (indicator) {
            indicator.classList.add('show');
        }

        setTimeout(() => {
            this.element.classList.remove('clicking');
            if (indicator) {
                indicator.classList.remove('show');
            }
        }, 1500);
    }

    /**
     * Add product to quote
     */
    addToQuote() {
        if (window.calculator && window.calculator.addProduct) {
            window.calculator.addProduct(this.product.key || this.product.id);
        } else if (window.ProductManager && window.ProductManager.addProductToQuote) {
            window.ProductManager.addProductToQuote(this.product.key || this.product.id);
        }
    }

    /**
     * Update product data
     * @param {Object} newData 
     */
    updateProduct(newData) {
        this.product = { ...this.product, ...newData };
        if (this.element) {
            const newElement = this.create();
            this.element.replaceWith(newElement);
        }
    }

    /**
     * Static method to create multiple tiles
     * @param {Array} products 
     * @param {Object} options 
     * @returns {Array}
     */
    static createMultiple(products, options = {}) {
        return products.map(product => {
            const tile = new ProductTile(product, options);
            return tile.create();
        });
    }
}

// Export for use in other modules (inside the declaration guard)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductTile;
} else if (typeof window !== 'undefined') {
    // Export to window if not already there
    if (!window.ProductTile) {
        window.ProductTile = ProductTile;
        console.debug('[ProductTile] Class exported to window.ProductTile');
    } else {
        console.debug('[ProductTile] Class already exists on window, skipping export');
    }
}

} // End of ProductTile class declaration guard
