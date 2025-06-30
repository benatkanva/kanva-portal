/**
 * Product Grid Layout Component
 * Creates responsive grid layouts for product tiles
 */
class ProductGrid {
    constructor(options = {}) {
        this.options = {
            columns: 'auto', // 'auto', 2, 3, 4, 5, 6
            gap: '20px',
            responsive: true,
            tileOptions: {},
            className: 'product-grid',
            ...options
        };
        this.element = null;
        this.products = [];
        this.tiles = [];
    }

    /**
     * Create the product grid
     * @param {Array} products 
     * @returns {HTMLElement}
     */
    create(products = []) {
        this.products = products;
        
        const grid = document.createElement('div');
        grid.className = this.getGridClasses();

        if (!products.length) {
            grid.innerHTML = this.createEmptyState();
            this.element = grid;
            return grid;
        }

        // Create a row container for single row layout
        const row = document.createElement('div');
        row.className = 'row';
        grid.appendChild(row);

        this.tiles = this.createProductTiles(products);
        this.tiles.forEach(tile => {
            // Wrap each tile in a column div
            const col = document.createElement('div');
            col.className = 'col-lg-2 col-md-3 col-6';
            col.appendChild(tile);
            row.appendChild(col);
        });

        this.element = grid;
        this.attachEventListeners();
        return grid;
    }

    /**
     * Get CSS classes for the grid
     * @returns {string}
     */
    getGridClasses() {
        const classes = [this.options.className];
        
        if (this.options.responsive) {
            classes.push('product-grid-responsive');
        }

        return classes.join(' ');
    }

    /**
     * Get inline styles for the grid
     * @returns {string}
     */
    getGridStyles() {
        // Styles are now handled by CSS classes for better maintainability
        return '';
    }

    /**
     * Create empty state display
     * @returns {string}
     */
    createEmptyState() {
        return `
            <div class="product-grid-empty">
                <div class="empty-state-content">
                    <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No Products Available</h5>
                    <p class="text-muted">Check back later for new products.</p>
                </div>
            </div>
        `;
    }

    /**
     * Create product tiles using the ProductTile component
     * @param {Array} products 
     * @returns {Array}
     */
    createProductTiles(products) {
        if (!window.ProductTile) {
            console.warn('ProductTile component not loaded');
            return [];
        }

        return products.map(product => {
            const tile = new window.ProductTile(product, {
                ...this.options.tileOptions,
                clickHandler: (productData, tileElement) => {
                    this.handleTileClick(productData, tileElement);
                }
            });
            return tile.create();
        });
    }

    /**
     * Handle tile click
     * @param {Object} productData 
     * @param {HTMLElement} tileElement 
     */
    handleTileClick(productData, tileElement) {
        // Emit custom event for product selection
        const event = new CustomEvent('productSelected', {
            detail: {
                product: productData,
                tile: tileElement,
                grid: this
            }
        });
        
        if (this.element) {
            this.element.dispatchEvent(event);
        }

        // Call custom click handler if provided
        if (this.options.onTileClick && typeof this.options.onTileClick === 'function') {
            this.options.onTileClick(productData, tileElement, this);
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        if (!this.element) return;

        // Handle responsive behavior
        if (this.options.responsive) {
            this.setupResponsiveBehavior();
        }
    }

    /**
     * Setup responsive behavior
     */
    setupResponsiveBehavior() {
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                this.updateResponsiveLayout(entry.contentRect);
            }
        });

        observer.observe(this.element);
    }

    /**
     * Update responsive layout based on container size
     * @param {Object} rect 
     */
    updateResponsiveLayout(rect) {
        const width = rect.width;
        let minColumnWidth = 280;
        
        // Adjust minimum column width based on screen size
        if (width < 768) {
            minColumnWidth = 250;
        } else if (width > 1200) {
            minColumnWidth = 300;
        }

        this.element.style.gridTemplateColumns = 
            `repeat(auto-fill, minmax(${minColumnWidth}px, 1fr))`;
    }

    /**
     * Filter products by category
     * @param {string} category 
     */
    filterByCategory(category) {
        const filteredProducts = category === 'all' 
            ? this.products 
            : this.products.filter(product => product.category === category);
        
        this.update(filteredProducts);
    }

    /**
     * Search products by name or description
     * @param {string} query 
     */
    search(query) {
        if (!query.trim()) {
            this.update(this.products);
            return;
        }

        const searchTerm = query.toLowerCase();
        const filteredProducts = this.products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm))
        );

        this.update(filteredProducts);
    }

    /**
     * Update grid with new products
     * @param {Array} products 
     */
    update(products) {
        const newElement = this.create(products);
        if (this.element && this.element.parentNode) {
            this.element.parentNode.replaceChild(newElement, this.element);
        }
    }

    /**
     * Add product to grid
     * @param {Object} product 
     */
    addProduct(product) {
        this.products.push(product);
        this.update(this.products);
    }

    /**
     * Remove product from grid
     * @param {string} productKey 
     */
    removeProduct(productKey) {
        this.products = this.products.filter(p => 
            (p.key || p.id) !== productKey
        );
        this.update(this.products);
    }

    /**
     * Get selected products (if tiles have selection state)
     * @returns {Array}
     */
    getSelectedProducts() {
        const selectedTiles = this.element.querySelectorAll('.product-tile.selected');
        return Array.from(selectedTiles).map(tile => {
            const productKey = tile.dataset.productKey;
            return this.products.find(p => (p.key || p.id) === productKey);
        }).filter(Boolean);
    }

    /**
     * Static method to create product grid
     * @param {Array} products 
     * @param {Object} options 
     * @returns {ProductGrid}
     */
    static create(products, options = {}) {
        const grid = new ProductGrid(options);
        grid.create(products);
        return grid;
    }

    /**
     * Static method to render grid into container
     * @param {string|HTMLElement} container 
     * @param {Array} products 
     * @param {Object} options 
     * @returns {ProductGrid}
     */
    static renderTo(container, products, options = {}) {
        const targetElement = typeof container === 'string' 
            ? document.getElementById(container) || document.querySelector(container)
            : container;

        if (!targetElement) {
            console.error('ProductGrid: Target container not found');
            return null;
        }

        const grid = new ProductGrid(options);
        const gridElement = grid.create(products);
        
        targetElement.innerHTML = '';
        targetElement.appendChild(gridElement);
        
        return grid;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductGrid;
} else {
    window.ProductGrid = ProductGrid;
}
