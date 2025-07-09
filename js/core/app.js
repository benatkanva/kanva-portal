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
        
        // Admin Manager - Initialize only if available
        try {
            if (typeof AdminManager === 'function' && this.calculator) {
                console.log('🛠️ Initializing AdminManager...');
                this.modules.admin = new AdminManager({
                    calculator: this.calculator,
                    dataManager: this.modules.dataManager
                });
                // Note: We'll initialize the AdminManager asynchronously in initializeAdminPanel()
                console.log('✅ AdminManager instance created (will be initialized later)');
            } else {
                console.warn('⚠️ AdminManager not available yet, will retry during admin panel initialization');
            }
        } catch (error) {
            console.error('❌ Error creating AdminManager instance:', error);
            // Don't fail the whole app if admin fails to initialize
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
    async initializeAdminPanel() {
        console.log('🔧 Initializing admin panel...');
        
        try {
            // Check if admin access is enabled via URL parameter or token
            const urlParams = new URLSearchParams(window.location.search);
            const hasAdminParam = urlParams.has('admin');
            const hasAdminToken = localStorage.getItem('kanvaAdminToken') || sessionStorage.getItem('kanva_admin_token');
            const isDevMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (hasAdminParam || hasAdminToken || isDevMode) {
                console.log('🔒 Admin access detected');
                
                // Initialize AdminManager if not already done
                if (!this.modules.admin && typeof AdminManager === 'function') {
                    console.log('🔄 Creating AdminManager instance...');
                    this.modules.admin = new AdminManager({
                        calculator: this.calculator,
                        dataManager: this.modules.dataManager
                    });
                }
                
                // Initialize AdminManager asynchronously
                if (this.modules.admin && typeof this.modules.admin.init === 'function') {
                    console.log('⚙️ Initializing AdminManager...');
                    await this.modules.admin.init();
                    
                    console.log('✅ AdminManager initialized successfully');
                } else {
                    console.warn('⚠️ AdminManager not available or missing init method');
                }
                
                // Show admin button if hidden
                const adminBtn = document.getElementById('adminToggle');
                if (adminBtn) {
                    adminBtn.style.display = 'inline-block';
                }
                
                // Show admin panel if it exists
                const adminPanel = document.getElementById('adminPanel');
                if (adminPanel) {
                    adminPanel.classList.add('show');
                }
            } else {
                console.log('👤 Admin access not requested');
            }
        } catch (error) {
            console.error('❌ Failed to initialize admin panel:', error);
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
    window.KanvaApp = KanvaApp;
    window.handleAdminAccess = handleAdminAccess;
    window.openAdminModal = openAdminModal;
    console.log('✅ Global app components assigned:', {
        KanvaApp: typeof window.KanvaApp,
        handleAdminAccess: typeof window.handleAdminAccess,
        openAdminModal: typeof window.openAdminModal
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { KanvaApp, handleAdminAccess, openAdminModal };
}
