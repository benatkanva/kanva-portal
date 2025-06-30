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
        
        // Admin Utils
        if (typeof AdminUtils !== 'undefined') {
            this.modules.admin = AdminUtils;
            console.log('✅ AdminUtils initialized');
        } else {
            console.warn('❌ AdminUtils not found');
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
    initializeAdminPanel() {
        // Check if admin access is enabled
        const urlParams = new URLSearchParams(window.location.search);
        const hasAdminParam = urlParams.has('admin');
        const hasAdminToken = localStorage.getItem('kanvaAdminToken');
        
        if (hasAdminParam || hasAdminToken) {
            console.log('🔒 Admin access detected');
            
            // Show admin panel
            const adminPanel = document.getElementById('adminPanel');
            if (adminPanel) {
                adminPanel.classList.add('show');
            }
            
            // Initialize admin components
            if (this.modules.admin) {
                this.modules.admin.initialize();
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

/**
 * Initialize admin panel
 */
initializeAdminPanel() {
    // Check if admin access is enabled
    const urlParams = new URLSearchParams(window.location.search);
    const hasAdminParam = urlParams.has('admin');
    const hasAdminToken = localStorage.getItem('kanvaAdminToken');
    
    if (hasAdminParam || hasAdminToken) {
        console.log('🔒 Admin access detected');
        
        // Show admin panel
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.classList.add('show');
        }
        
        // Initialize admin components
        if (this.modules.admin) {
            this.modules.admin.initialize();
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
function handleAdminAccess() {
    console.log('🔐 Admin access requested');
    
    // Check if already authenticated in this session
    const isAuthenticated = sessionStorage.getItem('kanva_admin_auth') === 'true';
    
    if (isAuthenticated) {
        openFullPageAdmin();
        return;
    }
    
    // Prompt for password
    const password = prompt('Enter admin password:');
    
    if (password === 'kanva123') {
        console.log('✅ Admin authentication successful');
        sessionStorage.setItem('kanva_admin_auth', 'true');
        openFullPageAdmin();
    } else if (password !== null) {
        console.warn('❌ Admin authentication failed');
        alert('Incorrect password. Access denied.');
    }
}

/**
 * Open full-page admin dashboard
 */
function openFullPageAdmin() {
    console.log('🚀 Opening full-page admin dashboard');
    
    // Check if admin dashboard is available
    if (window.AdminDashboard && window.calculator) {
        try {
            // Initialize admin dashboard if not already done
            if (!window.adminDashboard) {
                window.adminDashboard = new AdminDashboard({
                    calculator: window.calculator,
                    adminManager: window.adminManager || null
                });
            }
            
            // Show the admin dashboard
            window.adminDashboard.show();
            
        } catch (error) {
            console.error('❌ Failed to open admin dashboard:', error);
            alert('Failed to open admin dashboard. Please check console for details.');
        }
    } else {
        console.error('❌ Admin dashboard not available');
        alert('Admin dashboard is not available. Please ensure all admin modules are loaded.');
    }
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.handleAdminAccess = handleAdminAccess;
    window.openFullPageAdmin = openFullPageAdmin;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { KanvaApp, handleCalculatorReady, handleAdminAccess, openFullPageAdmin };
}
