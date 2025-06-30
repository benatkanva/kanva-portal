/**
 * Core Kanva Calculator class
 * Main orchestrator for the calculator application
 */

class KanvaCalculator {
    constructor() {
        this.dataManager = new DataManager();
        this.calculationEngine = new CalculationEngine();
        this.uiManager = new UIManager(this);
        this.eventManager = new EventManager(this);
        this.adminManager = null;
        
        // Initialize Copper integration if available
        if (typeof CopperIntegration !== 'undefined') {
            this.copper = CopperIntegration;
            this.copperUI = new CopperUI(this);
        } else {
            console.warn('Copper CRM integration not available');
        }
        
        // Core state
        this.lineItems = [];
        this.quote = this.resetQuote();
        this.isReady = false;
        this.currentShippingZone = null;
        
        // Settings
        this.settings = {
            creditCardFeeRate: 0.03,
            shippingRateMin: 0.005,
            shippingRateMax: 0.025,
            palletThreshold: 0.5
        };
    }

    async init() {
        console.log('🧮 Initializing Kanva Calculator...');
        
        try {
            // Initialize data and UI first
            await this.dataManager.loadAllData();
            this.uiManager.initialize();
            this.eventManager.bindEvents();
            
            // Initialize Copper integration if available
            if (this.copper) {
                try {
                    this.copper.initialize();
                    this.copperUI.initialize();
                } catch (copperError) {
                    console.warn('Failed to initialize Copper integration:', copperError);
                }
            }
            
            // Initialize admin if authorized
            if (this.dataManager.isAdmin()) {
                this.adminManager = new AdminManager(this);
                await this.adminManager.init();
                this.addAdminButtonToHeader();
                
                // Show admin panel if URL has admin parameter
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.has('admin')) {
                    this.showAdminPanel();
                }
            }
            
            this.isReady = true;
            this.uiManager.showApp();
            
            // Make calculator globally available
            window.calculator = this;
            
            console.log('✅ Kanva Calculator initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize calculator:', error);
            throw error;
        }
    }

    // Core calculation methods
    calculateAll() {
        // Clean up lineItems array first
        this.cleanupLineItems();
        
        this.quote = this.resetQuote();
        this.calculationEngine.calculateLineItems(this.lineItems, this.quote, this.dataManager.getData());
        this.calculationEngine.calculateShipping(this.quote, this.currentShippingZone, this.dataManager.getData());
        this.calculationEngine.calculateCreditCardFee(this.quote, this.settings);
        this.calculationEngine.calculateTotal(this.quote);
        
        this.uiManager.updateCalculationDisplay(this.quote);
    }
    
    // Clean up lineItems array to remove any DOM elements
    cleanupLineItems() {
        if (!this.lineItems) return;
        
        const originalLength = this.lineItems.length;
        
        // Filter out DOM elements, keep only data objects with ID
        this.lineItems = this.lineItems.filter(item => {
            // Check if it's a proper data object (not a DOM element)
            const isDataObject = item && typeof item === 'object' && 
                                !(item instanceof HTMLElement) && 
                                typeof item.id === 'string';
            
            if (!isDataObject) {
                console.log('🗑️ Removing invalid item from lineItems:', item);
            }
            
            return isDataObject;
        });
        
        if (originalLength !== this.lineItems.length) {
            console.log(`✨ Cleaned lineItems array: ${originalLength} → ${this.lineItems.length} items`);
        }
    }

    // Line item management
    addProductLine() {
        console.log('⚠️ addProductLine called - this should not be used');
        console.log('⚠️ Use ProductManager.addProductToQuote() instead');
        
        // Don't push DOM elements into lineItems array
        // ProductManager.createProductLine() returns a DOM element, not data
        // The lineItems array should only contain data objects
        
        // Create a minimal line item data object instead
        const lineId = `line_${Date.now()}`;
        const newLineData = {
            id: lineId,
            productKey: '',
            masterCases: 1,
            displayBoxes: 12,
            units: 0,
            unitPrice: 0,
            total: 0
        };
        
        this.lineItems.push(newLineData);
        this.uiManager.renderProductLines(this.lineItems);
    }

    removeProductLine(lineId) {
        this.lineItems = this.lineItems.filter(item => item.id !== lineId);
        this.uiManager.renderProductLines(this.lineItems);
        this.calculateAll();
    }

    updateProductLine(lineId, field, value) {
        // Update line item using ProductManager if needed
        this.updateCalculationDisplay();
        this.calculateAll();
    }

    /**
     * Update calculation display (delegates to UIManager)
     */
    updateCalculationDisplay() {
        if (this.uiManager && typeof this.uiManager.updateCalculationDisplay === 'function') {
            this.uiManager.updateCalculationDisplay(this.quote);
        } else {
            console.warn('UIManager or updateCalculationDisplay not available');
        }
    }

    addProductToQuote(productKey) {
        // Delegate to ProductManager static method
        if (typeof ProductManager !== 'undefined' && ProductManager.addProductToQuote) {
            ProductManager.addProductToQuote(productKey);
        } else {
            console.warn('ProductManager.addProductToQuote not available');
        }
    }

    // Utility methods
    resetQuote() {
        return {
            products: [],
            lineItems: [],
            subtotal: 0,
            shipping: 0,
            creditCardFee: 0,
            total: 0,
            tierInfo: null
        };
    }

    // Admin methods
    showProductManager() {
        this.adminManager?.showProductManager();
    }

    showTierManager() {
        this.adminManager?.showTierManager();
    }
    
    /**
     * Toggle admin panel visibility
     */
    toggleAdminPanel() {
        const adminPanel = document.getElementById('adminPanel');
        if (!adminPanel) return;
        
        if (adminPanel.style.display === 'none' || !adminPanel.style.display) {
            this.showAdminPanel();
        } else {
            this.hideAdminPanel();
        }
    }
    
    /**
     * Show admin panel
     */
    showAdminPanel() {
        const adminPanel = document.getElementById('adminPanel');
        if (!adminPanel) return;
        
        // Initialize admin if not already done
        if (this.adminManager) {
            this.adminManager.showAdminPanel();
            adminPanel.style.display = 'block';
            
            // Add active class to toggle button if it exists
            const adminToggle = document.querySelector('.admin-toggle');
            if (adminToggle) {
                adminToggle.classList.add('active');
            }
        } else {
            console.warn('Admin manager not initialized');
        }
    }
    
    /**
     * Hide admin panel
     */
    hideAdminPanel() {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.style.display = 'none';
            
            // Remove active class from toggle button if it exists
            const adminToggle = document.querySelector('.admin-toggle');
            if (adminToggle) {
                adminToggle.classList.remove('active');
            }
        }
    }
    
    /**
     * Add admin button to header
     */
    addAdminButtonToHeader() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;
        
        // Check if button already exists
        if (document.getElementById('adminButton')) return;
        
        const adminButton = document.createElement('button');
        adminButton.id = 'adminButton';
        adminButton.className = 'btn btn-sm btn-outline-secondary';
        adminButton.innerHTML = '<i class="fas fa-cog"></i> Admin';
        adminButton.onclick = (e) => {
            e.preventDefault();
            this.toggleAdminPanel();
        };
        
        headerActions.appendChild(adminButton);
    }
    
    /**
     * Get current quote data for external use (e.g., saving to CRM)
     */
    getQuoteData() {
        return {
            ...this.quote,
            lineItems: this.lineItems,
            timestamp: new Date().toISOString(),
            quoteNumber: `Q-${Date.now().toString().slice(-6)}`
        };
    }

    showShippingManager() {
        this.adminManager?.showShippingManager();
    }

    showCopperManager() {
        this.adminManager?.showCopperManager();
    }

    showGitHubSettings() {
        this.adminManager?.showGitHubSettings();
    }

    // Integration methods for email generation
    getCalculationSummary() {
        return EmailDataFormatter.formatSingleProduct(this.lineItems, this.quote);
    }

    getCalculationForEmail() {
        return EmailDataFormatter.formatMultiProduct(this.lineItems, this.quote);
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.KanvaCalculator = KanvaCalculator;
}
