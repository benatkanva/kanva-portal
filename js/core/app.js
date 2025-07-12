/**
 * Kanva Botanicals Quote Calculator - Main Application
 * 
 * This is the main entry point for the application that initializes
 * all components and handles the application lifecycle.
 */

// Main application class
class KanvaApp {
    constructor() {
        this.version = '1.0.0';
        this.modules = {};
        this.isInitialized = false;
        
        // Bind methods
        this.initialize = this.initialize.bind(this);
        this.detectEnvironment = this.detectEnvironment.bind(this);
        this.initializeCopperIntegration = this.initializeCopperIntegration.bind(this);
        this.initializeCoreModules = this.initializeCoreModules.bind(this);
        this.initializeUI = this.initializeUI.bind(this);
        this.setupEventListeners = this.setupEventListeners.bind(this);
        this.performInitialCalculations = this.performInitialCalculations.bind(this);
        this.initializeAdminPanel = this.initializeAdminPanel.bind(this);
        this.handleAdminButtonClick = this.handleAdminButtonClick.bind(this);
        this.checkAdminManager = this.checkAdminManager.bind(this);
        this.showError = this.showError.bind(this);
        this.handleInitializationError = this.handleInitializationError.bind(this);
    }

    /**
     * Initialize the application
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('App already initialized');
            return;
        }

        console.log(`🚀 Starting Kanva Botanicals Quote Calculator v${this.version}...`);

        try {
            // Detect environment (Copper CRM vs standalone)
            this.detectEnvironment();
            
            // Initialize core modules
            await this.initializeCoreModules();
            
            // Initialize UI components
            await this.initializeUI();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Perform initial calculations
            await this.performInitialCalculations();
            
            // Initialize admin panel if admin access is detected
            await this.initializeAdminPanel();
            
            // Mark as initialized
            this.isInitialized = true;
            console.log('✅ Application initialized successfully');
            
            // Dispatch ready event
            document.dispatchEvent(new CustomEvent('app:ready'));
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Detect environment and mode
     */
    detectEnvironment() {
        // Check if running in Copper CRM
        this.isCopper = window.location.hostname.includes('copper') || 
                       document.querySelector('meta[name="copper-app"]') !== null;
        
        // Set application mode
        this.mode = this.isCopper ? 'copper' : 'standalone';
        
        console.log(`🌍 Environment detected: ${this.mode}`);
        
        if (this.isCopper) {
            this.initializeCopperIntegration();
        }
    }
    
    /**
     * Initialize Copper CRM integration
     */
    initializeCopperIntegration() {
        if (typeof CopperIntegration !== 'undefined') {
            console.log('🔥 Initializing Copper CRM integration...');
            CopperIntegration.initialize();
        }
    }

    /**
     * Initialize core modules
     */
    async initializeCoreModules() {
        console.log('⚙️ Initializing core modules...');
        
        // Initialize CSS Loader first if available
        if (typeof window.CSSLoader !== 'undefined') {
            window.CSSLoader.initialize();
            console.log('✅ CSSLoader initialized');
        } else {
            console.warn('❌ CSSLoader not found - UI styling may be affected');
        }
        
        // Configuration Manager
        if (typeof ConfigManager !== 'undefined') {
            this.modules.config = ConfigManager;
            console.log('✅ ConfigManager initialized');
        } else {
            console.warn('❌ ConfigManager not found');
        }
        
        // Data Loader
        if (typeof DataLoader !== 'undefined') {
            this.modules.data = DataLoader;
            console.log('✅ DataLoader initialized');
        } else {
            console.warn('❌ DataLoader not found');
        }
        
        // Tax Utilities
        if (typeof TaxUtils !== 'undefined') {
            this.modules.tax = TaxUtils;
            console.log('✅ TaxUtils initialized');
        } else {
            console.warn('❌ TaxUtils not found');
        }
        
        // Notification Manager
        if (typeof NotificationManager !== 'undefined') {
            this.modules.notifications = NotificationManager;
            this.modules.notifications.initialize();
            console.log('✅ NotificationManager initialized');
        } else {
            console.warn('❌ NotificationManager not found');
        }
        
        // Multi-Product Manager
        if (typeof MultiProductManager !== 'undefined') {
            this.modules.multiProduct = MultiProductManager;
            console.log('✅ MultiProductManager initialized');
        } else {
            console.warn('❌ MultiProductManager not found');
        }
        
        // Admin Manager - Simplified initialization
        const initAdminManager = async () => {
            console.log('🔄 Initializing AdminManager...');
            
            const adminButton = document.getElementById('adminToggle');
            
            // Handle admin button click
            async function handleAdminButtonClick(e) {
                e.preventDefault();
                console.log('🖱️ Admin button clicked');
                
                try {
                    // Check if AdminManager is available in window.kanva
                    if (!window.kanva || !window.kanva.AdminManager) {
                        console.log('🔄 Waiting for AdminManager to be ready...');
                        await new Promise((resolve) => {
                            const checkAdminManager = () => {
                                if (window.kanva?.AdminManager) {
                                    console.log('✅ AdminManager is now available');
                                    resolve();
                                } else {
                                    console.log('⏳ Still waiting for AdminManager...');
                                    setTimeout(checkAdminManager, 100);
                                }
                            };
                            checkAdminManager();
                        });
                    }
                    
                    // Initialize AdminManager if needed
                    if (!this.adminManager) {
                        console.log('🔧 Creating new AdminManager instance...');
                        this.adminManager = new window.kanva.AdminManager({
                            calculator: window.calculator,
                            dataManager: this.dataManager
                        });
                        
                        await this.adminManager.init();
                        console.log('✅ AdminManager initialized successfully');
                    }
                    
                    // Show admin panel
                    if (typeof this.adminManager.showAdminPanel === 'function') {
                        console.log('🖥️ Showing admin panel...');
                        await this.adminManager.showAdminPanel();
                    } else {
                        throw new Error('showAdminPanel method not found on AdminManager');
                    }
                } catch (error) {
                    console.error('❌ Failed to initialize AdminManager:', error);
                    // Show error to user
                    if (window.NotificationManager) {
                        window.NotificationManager.showError(
                            'Admin Panel Error', 
                            'Failed to load admin panel. Please check console for details.'
                        );
                    }
                }
            }
            
            // Attach click handler if button exists
            if (adminButton) {
                console.log('🔘 Found admin button, attaching click handler...');
                adminButton.addEventListener('click', this.handleAdminButtonClick.bind(this));
                adminButton.style.display = 'block';
            } else {
                console.warn('⚠️ Admin button not found in the DOM');
            }
            
            console.log('✅ AdminManager setup complete');
            
        } catch (error) {
            console.error('❌ Error initializing AdminManager instance:', {
                error: error,
                message: error.message,
                stack: error.stack
            });
            
            // Show error to user if NotificationManager is available
            if (window.NotificationManager) {
                window.NotificationManager.showError(
                    'Admin Initialization Error',
                    'Failed to initialize admin panel. Please check console for details.'
                );
            }
        }
    }
    
    /**
     * Handle admin button click
     */
    async handleAdminButtonClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🖱️ Admin button clicked');
        
        // Check if we have the admin module initialized
        if (!this.modules?.admin) {
            console.warn('⚠️ Admin module not initialized, trying to initialize...');
            await this.initializeAdminPanel();
            
            if (!this.modules?.admin) {
                console.error('❌ Admin module still not available after initialization attempt');
                return;
            }
        }
        
        // Toggle admin panel
        if (typeof this.modules.admin.toggleAdminPanel === 'function') {
            this.modules.admin.toggleAdminPanel();
        }
    }
    
    /**
     * Check if AdminManager is available
     */
    checkAdminManager() {
        return !!window.kanva?.AdminManager;
    }
    
    /**
     * Initialize core modules
     */
    async initializeCoreModules() {
        console.log('⚙️ Initializing core modules...');
        
        // Initialize CSS Loader first if available
        if (typeof window.CSSLoader !== 'undefined') {
            window.CSSLoader.initialize();
            console.log('✅ CSSLoader initialized');
        } else {
            console.warn('❌ CSSLoader not found - UI styling may be affected');
        }
        
        // Order Details Manager
    if (typeof OrderDetailsManager !== 'undefined') {
        this.modules.orderDetails = new OrderDetailsManager();
        console.log('✅ OrderDetailsManager initialized');
    } else {
        console.warn('❌ OrderDetailsManager not found');
    }
    
    // Email Generator
    if (typeof EmailGenerator !== 'undefined') {
        this.modules.email = EmailGenerator;
        console.log('✅ EmailGenerator initialized');
    } else {
        console.warn('❌ EmailGenerator not found');
    }
    
    // Initialize the calculator
    if (typeof KanvaCalculator !== 'undefined') {
        this.calculator = new KanvaCalculator();
        await this.calculator.init();
        console.log('✅ Calculator initialized');
    } else {
        console.error('❌ KanvaCalculator not found - critical error');
        throw new Error('Failed to initialize calculator');
    }
}

    /**
     * Initialize UI components
     */
    async initializeUI() {
        console.log('🎨 Initializing UI components...');
        
        // Initialize any UI components that need it
        if (this.modules.notifications) {
            this.modules.notifications.initialize();
        }
        
        // Initialize calculator UI if available
        if (this.calculator && typeof this.calculator.initializeUI === 'function') {
            this.calculator.initializeUI();
        }
        
        // Initialize admin panel if needed
        if (this.modules.admin) {
            this.initializeAdminPanel();
        }
        
        // Set up responsive behavior
        this.setupResponsiveUI();
        
        // Don't add empty line items on startup
        // Users will add products by clicking on product tiles
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        console.log('🔌 Setting up event listeners...');
        
        // Add any global event listeners here
        document.addEventListener('tax:rateChanged', (e) => this.onTaxRateChanged(e));
        document.addEventListener('product:updated', (e) => this.onProductUpdated(e));
        document.addEventListener('admin:settingsUpdated', (e) => this.onAdminSettingsUpdated(e));
    }

    /**
     * Perform initial calculations
     */
    async performInitialCalculations() {
        console.log('🧮 Performing initial calculations...');
        
        try {
            // Load initial data if needed
            if (this.modules.data) {
                await this.modules.data.loadAll();
            }
            
            // Update UI with initial values
            this.updateUI();
            
        } catch (error) {
            console.error('Error during initial calculations:', error);
            this.showError('Failed to load initial data');
        }
    }

    /**
     * Update UI with current state
     */
    updateUI() {
        // Update any UI elements that depend on application state
        if (this.modules.orderDetails && typeof this.modules.orderDetails.renderLineItemDetails === 'function') {
            this.modules.orderDetails.renderLineItemDetails();
        }
    }

    /**
     * Handle tax rate changes
     */
    onTaxRateChanged(event) {
        const { newRate } = event.detail;
        console.log(`Tax rate changed to: ${newRate}%`);
        
        // Update any components that depend on tax rate
        if (this.modules.orderDetails) {
            this.modules.orderDetails.updateTax(newRate);
        }
    }

    /**
     * Handle product updates
     */
    onProductUpdated(event) {
        const { product, action } = event.detail;
        console.log(`Product ${action}:`, product);
        
        // Update UI as needed
        this.updateUI();
    }

    /**
     * Handle admin settings updates
     */
    onAdminSettingsUpdated(event) {
        const { settings } = event.detail;
        console.log('Admin settings updated:', settings);
        
        // Apply any setting changes that affect the UI
        this.applySettings(settings);
    }

    /**
     * Apply settings to the application
     */
    applySettings(settings) {
        // Apply theme settings if needed
        if (settings.theme) {
            this.applyTheme(settings.theme);
        }
        
        // Apply any other settings
        // ...
    }


    /**
     * Apply theme settings
     */
    applyTheme(theme) {
        // Apply theme to the UI
        const root = document.documentElement;
        
        // Update CSS variables based on theme
        if (theme.primaryColor) {
            root.style.setProperty('--primary-color', theme.primaryColor);
        }
        
        if (theme.secondaryColor) {
            root.style.setProperty('--secondary-color', theme.secondaryColor);
        }
        
        // Add/remove dark mode class
        if (theme.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    /**
     * Set up responsive UI behavior
     */
    setupResponsiveUI() {
        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
        
        // Initial check
        this.handleResize();
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        const isMobile = window.innerWidth < 768;
        document.body.classList.toggle('mobile-view', isMobile);
        
        // Notify components about resize
        document.dispatchEvent(new CustomEvent('app:resize', {
            detail: { isMobile }
        }));
    }

    /**
     * Initialize admin panel
     */
    /**
     * Initialize admin panel with enhanced AdminManager loading
     */
    async initializeAdminPanel() {
        console.log('🔧 [1/5] initializeAdminPanel called');
        
        try {
            // Check for admin access
            const hasAdminAccess = await this.checkAdminAccess();
            if (!hasAdminAccess) {
                console.log('🔒 [2/5] No admin access detected, skipping admin panel initialization');
                return;
            }
            
            console.log('🔒 [3/5] Admin access detected - initializing...');
            
            // Wait for AdminManager to be available
            const adminManager = await this.ensureAdminManager();
            if (!adminManager) {
                console.error('❌ [4/5] Failed to initialize AdminManager');
                return;
            }
            
            console.log('✅ [5/5] Admin panel initialization complete');
            
        } catch (error) {
            console.error('❌ Error in initializeAdminPanel:', error);
        }
    }
    
    /**
     * Check if admin access is granted
     */
    async checkAdminAccess() {
        const urlParams = new URLSearchParams(window.location.search);
        const hasAdminParam = urlParams.has('admin');
        const hasAdminToken = localStorage.getItem('kanvaAdminToken') || 
                            sessionStorage.getItem('kanva_admin_token') || 
                            sessionStorage.getItem('kanva_admin_email');
        const isDevMode = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '';
        
        console.log('🔍 [2/5] Admin access check:', {
            hasAdminParam,
            hasAdminToken: !!hasAdminToken,
            isDevMode,
            hostname: window.location.hostname
        });
        
        return hasAdminParam || hasAdminToken || isDevMode;
    }
    
    /**
     * Ensure AdminManager is properly loaded and initialized
     */
    async ensureAdminManager() {
        // Wait for AdminManager to be ready
        if (window.kanva?.adminManagerLoading) {
            console.log('⏳ [3.1/5] Waiting for AdminManager to load...');
            await window.kanva.adminManagerLoading;
        }
        
        // Check if AdminManager is available in window.kanva namespace
        const AdminManager = window.kanva?.AdminManager;
        if (typeof AdminManager !== 'function') {
            console.error('❌ [3.2/5] AdminManager not found in window.kanva');
            return null;
        }
        
        // Initialize AdminManager if not already done
        if (!this.modules.admin) {
            console.log('🔄 [3.3/5] Creating new AdminManager instance...');
            try {
                this.modules.admin = new AdminManager({
                    calculator: this.calculator,
                    dataManager: this.modules.dataManager
                });
                console.log('✅ [3.4/5] AdminManager instance created');
            } catch (error) {
                console.error('❌ [3.4/5] Failed to create AdminManager instance:', error);
                return null;
            }
        }
        
        // Initialize AdminManager if available
        if (this.modules.admin && typeof this.modules.admin.init === 'function') {
            console.log('⚙️ [3.5/5] Initializing AdminManager...');
            try {
                await this.modules.admin.init();
                console.log('✅ [3.6/5] AdminManager initialized successfully');
                
                // Show admin button if the method exists
                if (typeof this.modules.admin.showAdminButton === 'function') {
                    console.log('👆 [3.7/5] Showing admin button...');
                    this.modules.admin.showAdminButton();
                }
                
                return this.modules.admin;
                
            } catch (initError) {
                console.error('❌ [3.6/5] Error initializing AdminManager:', {
                    error: initError,
                    message: initError.message,
                    stack: initError.stack
                });
                return null;
            }
        }
                
                // Show admin button if hidden (legacy approach)
                const adminBtn = document.getElementById('adminToggle');
                if (adminBtn) {
                    console.log('👆 [4/5] Showing legacy admin button');
                    adminBtn.style.display = 'inline-block';
                    
                    // Ensure click handler is attached
                    const handleAdminButtonClick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🖱️ Legacy admin button clicked');
                        
                        // Check if we have the admin module initialized
                        if (!this.modules || !this.modules.admin) {
                            console.warn('⚠️ Admin module not initialized');
                            
                            // Try to initialize it on demand
                            if (window.AdminManager) {
                                console.log('🔄 Initializing AdminManager on demand...');
                                this.modules = this.modules || {};
                                this.modules.admin = new window.AdminManager({
                                    calculator: this.calculator,
                                    dataManager: this.modules.dataManager
                                });
                                
                                // Initialize and then toggle
                                this.modules.admin.init().then(() => {
                                    console.log('✅ AdminManager initialized on demand');
                                    this.modules.admin.toggleAdminPanel();
                                }).catch(error => {
                                    console.error('❌ Failed to initialize AdminManager on demand:', error);
                                });
                                return false;
                            }
                            
                            console.warn('⚠️ AdminManager not available in global scope');
                            return false;
                        }
                        
                        // Check if toggleAdminPanel exists
                        if (typeof this.modules.admin.toggleAdminPanel === 'function') {
                            console.log('🔄 Toggling admin panel...');
                            this.modules.admin.toggleAdminPanel();
                        } else {
                            console.warn('⚠️ toggleAdminPanel method not found on AdminManager instance');
                            console.log('Available methods:', Object.keys(this.modules.admin).filter(key => typeof this.modules.admin[key] === 'function'));
                            
                            // Fallback to showing the admin panel directly
                            if (typeof this.modules.admin.showAdminPanel === 'function') {
                                console.log('🔄 Falling back to showAdminPanel...');
                                this.modules.admin.showAdminPanel();
                            } else {
                                console.error('❌ No admin panel methods available');
                            }
                        }
                        
                        return false;
                    };
                    
                    // Attach the click handler
                    adminBtn.addEventListener('click', handleAdminButtonClick);
                } else {
                    console.log('ℹ️ [4/5] No legacy admin button found');
                }
                
                console.log('✅ [5/5] Admin panel initialization complete');
            } else {
                console.log('👤 [2/5] Admin access not requested');
            }
        } catch (error) {
            console.error('❌ [5/5] Failed to initialize admin panel:', {
                error: error,
                message: error.message,
                stack: error.stack
            });
            
            // Show error to user if possible
            const errorMessage = 'Failed to initialize admin panel. Please check console for details.';
            if (this.showError) {
                this.showError(errorMessage);
            } else {
                console.error('⚠️ showError method not available');
                alert(errorMessage);
            }
        }
    }

    /**
     * Show error notification
     */
    showError(message, details = '') {
        console.error(message, details);
        
        if (this.modules.notifications) {
            this.modules.notifications.showError(message);
        } else {
            // Fallback to alert if notifications aren't available
            alert(`Error: ${message}`);
        }
    }
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        const errorMessage = `Failed to initialize application: ${error.message}`;
        this.showError(errorMessage);
        
        // Show error in UI if possible
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.innerHTML = `
                <div class="error-container">
                    <h2>Application Error</h2>
                    <p>${errorMessage}</p>
                    <p>Please refresh the page or contact support if the problem persists.</p>
                </div>
            `;
        }
    }

/**
 * Update UI with current state
 */
updateUI() {
    // Update any UI elements that depend on application state
    if (this.modules.orderDetails && typeof this.modules.orderDetails.renderLineItemDetails === 'function') {
        this.modules.orderDetails.renderLineItemDetails();
    }
}

/**
 * Handle tax rate changes
 */
onTaxRateChanged(event) {
    const { newRate } = event.detail;
    console.log(`Tax rate changed to: ${newRate}%`);
    
    // Update any components that depend on tax rate
    if (this.modules.orderDetails) {
        this.modules.orderDetails.updateTax(newRate);
    }
}

/**
 * Handle product updates
 */
onProductUpdated(event) {
    const { product, action } = event.detail;
    console.log(`Product ${action}:`, product);
    
    // Update UI as needed
    this.updateUI();
}

/**
 * Handle admin settings updates
 */
onAdminSettingsUpdated(event) {
    const { settings } = event.detail;
    console.log('Admin settings updated:', settings);
    
    // Apply any setting changes that affect the UI
    this.applySettings(settings);
}

/**
 * Apply settings to the application
 */
applySettings(settings) {
    // Apply theme settings if needed
    if (settings.theme) {
        this.applyTheme(settings.theme);
    }
    
    // Apply any other settings
    // ...
}

/**
 * Apply theme settings
 */
applyTheme(theme) {
    // Apply theme to the UI
    const root = document.documentElement;
    
    // Update CSS variables based on theme
    if (theme.primaryColor) {
        root.style.setProperty('--primary-color', theme.primaryColor);
    }
    
    if (theme.secondaryColor) {
        root.style.setProperty('--secondary-color', theme.secondaryColor);
    }
    
    // Add/remove dark mode class
    if (theme.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

/**
 * Set up responsive UI behavior
 */
setupResponsiveUI() {
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            this.handleResize();
        }, 250);
    });
    
    // Initial check
    this.handleResize();
}

/**
 * Handle window resize
 */
handleResize() {
    const isMobile = window.innerWidth < 768;
    document.body.classList.toggle('mobile-view', isMobile);
    
    // Notify components about resize
    document.dispatchEvent(new CustomEvent('app:resize', {
        detail: { isMobile }
    }));
}

// This is a duplicate method that was removed - the real implementation is above

/**
 * Show error notification
 */
showError(message, details = '') {
    console.error(message, details);
    
    if (this.modules.notifications) {
        this.modules.notifications.showError(message);
    } else {
        // Fallback to alert if notifications aren't available
        alert(`Error: ${message}`);
    }
}

/**
 * Handle initialization errors
 */
handleInitializationError(error) {
    const errorMessage = `Failed to initialize application: ${error.message}`;
    this.showError(errorMessage);
    
    // Show error in UI if possible
    const appContainer = document.getElementById('app');
    if (appContainer) {
        appContainer.innerHTML = `
            <div class="error-container">
                <h2>Application Error</h2>
                <p>${errorMessage}</p>
                <p>Please refresh the page or contact support if the problem persists.</p>
            </div>
        `;
    }
}
}

// Create the application instance
const app = new KanvaApp();
console.log('✅ KanvaApp instance created:', { 
    version: app.version,
    isInitialized: app.isInitialized,
    constructor: app.constructor.name
});

// Make available globally
if (typeof window !== 'undefined') {
    window.KanvaApp = KanvaApp; // Make class constructor available
    window.app = app; // Instance for debugging
}

// Function to handle calculator ready event
function handleCalculatorReady() {
    console.log('🎯 Calculator ready event received');
    if (!app.isInitialized) {
        console.log('🚀 Initializing KanvaApp...');
        app.initialize().catch(error => {
            console.error('❌ Failed to initialize KanvaApp:', error);
        });
    }
}

// Check if calculator is already ready
if (window.calculator && window.calculator.isReady) {
    console.log('🔍 Calculator already ready, initializing app...');
    handleCalculatorReady();
} else {
    // Wait for calculator ready event
    console.log('⏳ Waiting for calculator to be ready...');
    document.addEventListener('calculator:ready', handleCalculatorReady);
}

// Also initialize when DOM is ready as a fallback
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🌐 DOM fully loaded');
        if (!app.isInitialized) {
            // If calculator still not ready after DOM load, try to initialize anyway
            setTimeout(handleCalculatorReady, 100);
        }
    });
} else {
    console.log('🌐 DOM already loaded');
    setTimeout(handleCalculatorReady, 100);
};

/**
 * Handle admin access with password protection
 * Password: kanva123
 */
async function handleAdminAccess() {
    console.log('🔐 Admin access requested');
    
    try {
        // Check if already authenticated in this session
        const isAuthenticated = sessionStorage.getItem('kanva_admin_auth') === 'true' || 
                               sessionStorage.getItem('kanva_admin_token');
        
        // Ensure calculator is available
        if (!window.calculator) {
            console.log('⏳ Waiting for calculator to be available...');
            await new Promise(resolve => {
                const checkCalculator = setInterval(() => {
                    if (window.calculator) {
                        clearInterval(checkCalculator);
                        resolve();
                    }
                }, 100);
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    clearInterval(checkCalculator);
                    resolve();
                }, 5000);
            });
        }
        
        if (!window.calculator) {
            throw new Error('Calculator not available');
        }
        
        // Check if we need to authenticate
        if (!isAuthenticated) {
            // Prompt for password
            const password = prompt('Enter admin password:');
            
            if (password !== 'kanva123') {
                if (password !== null) { // User didn't click cancel
                    console.warn('❌ Admin authentication failed');
                    alert('Incorrect password. Access denied.');
                }
                return;
            }
            
            console.log('✅ Admin authentication successful');
            sessionStorage.setItem('kanva_admin_auth', 'true');
            sessionStorage.setItem('kanva_admin_email', 'admin@kanvabotanicals.com');
            sessionStorage.setItem('kanva_admin_token', 'admin_authenticated');
        }
        
        // Use the app's AdminManager instance if available
        if (window.app && window.app.modules && window.app.modules.admin) {
            console.log('✅ Using existing AdminManager from app');
            
            // If AdminManager exists but isn't initialized, initialize it
            if (!window.app.modules.admin.isInitialized) {
                console.log('⚙️ Initializing existing AdminManager...');
                await window.app.modules.admin.init();
            }
            
            // Open the admin dashboard using the AdminManager's method
            if (typeof window.app.modules.admin.openFullDashboard === 'function') {
                console.log('📋 Opening admin dashboard via AdminManager...');
                await window.app.modules.admin.openFullDashboard();
                return;
            }
        }
        
        // Fallback: Create AdminManager if needed
        if (!window.adminManager) {
            console.log('📝 Creating AdminManager instance...');
            window.adminManager = new AdminManager({
                calculator: window.calculator,
                dataManager: window.calculator.modules?.dataManager
            });
            
            // Initialize AdminManager
            console.log('⚙️ Initializing AdminManager...');
            await window.adminManager.init();
            console.log('✅ AdminManager initialized successfully');
            
            // Open the full dashboard
            await window.adminManager.openFullDashboard();
        } else {
            // Use existing AdminManager
            console.log('📋 Opening admin dashboard modal...');
            await window.adminManager.openFullDashboard();
        }
        
        console.log('✅ Admin dashboard modal opened');
        
    } catch (error) {
        console.error('❌ Error in handleAdminAccess:', error);
        alert('Failed to open admin panel: ' + error.message);
    }
}

/**
 * Open admin dashboard in a modal
 * @global
 */
async function openAdminModal() {
    console.log('🚀 Opening admin dashboard in modal');
    
    // Show loading state
    const loadingMessage = document.createElement('div');
    loadingMessage.id = 'adminLoading';
    loadingMessage.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px 40px;
        border-radius: 8px;
        z-index: 10000;
        text-align: center;
    `;
    loadingMessage.innerHTML = `
        <div class="spinner"></div>
        <p>Loading Admin Dashboard...</p>
    `;
    document.body.appendChild(loadingMessage);
    
    try {
        // Ensure KanvaCalculator is loaded
        if (typeof KanvaCalculator === 'undefined') {
            console.error('❌ KanvaCalculator class not available');
            throw new Error('KanvaCalculator class not available. Please refresh the page.');
        }
        
        // Initialize calculator if not already done
        if (!window.calculator) {
            console.log('⚙️ Initializing calculator...');
            try {
                window.calculator = new KanvaCalculator();
                await window.calculator.init();
                console.log('✅ Calculator initialized successfully');
            } catch (calcError) {
                console.error('❌ Failed to initialize calculator:', calcError);
                throw new Error('Failed to initialize calculator: ' + calcError.message);
            }
        }
        
        // Ensure calculator is available and ready
        if (!window.calculator || !window.calculator.isReady) {
            console.log('⏳ Waiting for calculator to be ready...');
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 50; // 5 seconds max wait
                
                const checkCalculator = setInterval(() => {
                    attempts++;
                    if (window.calculator && window.calculator.isReady) {
                        clearInterval(checkCalculator);
                        console.log('✅ Calculator is ready');
                        resolve();
                    } else if (attempts >= maxAttempts) {
                        clearInterval(checkCalculator);
                        reject(new Error('Calculator not ready after timeout'));
                    }
                }, 100);
            });
        }
        
        // Initialize AdminDashboard if not already done
        if (!window.adminDashboard) {
            console.log('📝 Creating AdminDashboard instance...');
            
            // Get or create admin manager
            let adminManager = null;
            if (window.calculator.modules?.admin) {
                adminManager = window.calculator.modules.admin;
                console.log('✅ Using existing AdminManager from calculator');
            } else if (window.AdminManager) {
                console.log('⚠️ Creating new AdminManager instance');
                adminManager = new AdminManager({
                    calculator: window.calculator,
                    dataManager: window.calculator.modules?.dataManager
                });
                await adminManager.init().catch(error => {
                    console.warn('⚠️ AdminManager init warning:', error);
                    // Continue with null adminManager
                });
            } else {
                console.warn('ℹ️ AdminManager not available, some features may be limited');
            }
            
            // Create dashboard instance
            window.adminDashboard = new AdminDashboard({
                calculator: window.calculator,
                adminManager: adminManager
            });
            
            // Initialize dashboard
            console.log('⚙️ Initializing AdminDashboard...');
            await window.adminDashboard.init();
            console.log('✅ AdminDashboard initialized successfully');
        }
        
        // Show the admin dashboard in modal
        console.log('📋 Showing admin dashboard in modal...');
        
        // Get or create modal element
        let adminModal = document.getElementById('adminModal');
        if (!adminModal) {
            adminModal = document.createElement('div');
            adminModal.id = 'adminModal';
            adminModal.className = 'modal';
            adminModal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>⚙️ Admin Settings</h3>
                        <button class="modal-close">×</button>
                    </div>
                    <div class="modal-body" id="adminModalBody">
                        <!-- Admin content will be inserted here -->
                    </div>
                </div>
            `;
            document.body.appendChild(adminModal);
            
            // Add close button handler
            const closeBtn = adminModal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    adminModal.style.display = 'none';
                });
            }
        }
        
        // Get modal body for content insertion
        const modalBody = adminModal.querySelector('#adminModalBody');
        if (modalBody) {
            // Clear previous content
            modalBody.innerHTML = '';
            
            // Create container for admin dashboard
            const adminContainer = document.createElement('div');
            adminContainer.id = 'adminDashboardContainer';
            modalBody.appendChild(adminContainer);
            
            // Render admin dashboard in the container
            window.adminDashboard.renderInContainer(adminContainer);
        }
        
        // Show modal
        adminModal.style.display = 'block';
        console.log('✅ Admin dashboard modal displayed');
        
    } catch (error) {
        console.error('❌ Failed to open admin dashboard modal:', error);
        
        // Show user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.id = 'adminError';
        errorMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f8d7da;
            color: #721c24;
            padding: 20px 40px;
            border-radius: 8px;
            border: 1px solid #f5c6cb;
            max-width: 500px;
            z-index: 10000;
        `;
        errorMessage.innerHTML = `
            <h4>Failed to load Admin Dashboard</h4>
            <p>${error.message || 'Unknown error occurred'}</p>
            <p>Please check the console for more details and try again.</p>
            <button onclick="document.getElementById('adminError').remove()" 
                    style="margin-top: 10px; padding: 5px 10px; cursor: pointer;">
                Close
            </button>
        `;
        document.body.appendChild(errorMessage);
        
    } finally {
        // Remove loading message
        if (document.body.contains(loadingMessage)) {
            document.body.removeChild(loadingMessage);
        }
    }
}

// Make classes and functions globally available
if (typeof window !== 'undefined') {
    // Double-check if KanvaApp is defined before assigning
    if (typeof KanvaApp === 'undefined') {
        console.warn('KanvaApp is not defined');
    } else {
        // Make KanvaApp globally available
        window.KanvaApp = KanvaApp;
        
        // Initialize the app when the DOM is fully loaded
        document.addEventListener('DOMContentLoaded', () => {
            const app = new KanvaApp();
            window.kanva = window.kanva || {};
            window.kanva.app = app;
            
            // Initialize the app
            app.initialize().catch(error => {
                console.error('Failed to initialize app:', error);
                
                // Show error in UI if possible
                const errorContainer = document.createElement('div');
                errorContainer.style.padding = '20px';
                errorContainer.style.color = '#721c24';
                errorContainer.style.backgroundColor = '#f8d7da';
                errorContainer.style.border = '1px solid #f5c6cb';
                errorContainer.style.borderRadius = '4px';
                errorContainer.style.margin = '20px';
                errorContainer.innerHTML = `
                    <h3>Application Error</h3>
                    <p>${error.message || 'An unknown error occurred during initialization.'}</p>
                    <p>Please check the browser console for more details.</p>
                `;
                
                const appContainer = document.getElementById('app') || document.body;
                appContainer.prepend(errorContainer);
            });
        });
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { KanvaApp, handleAdminAccess, openAdminModal };
}
