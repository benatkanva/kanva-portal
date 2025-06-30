/**
 * Admin Manager
 * Handles admin-related functionality and UI
 */
class AdminManager {
    constructor({ calculator, dataManager } = {}) {
        this.calculator = calculator || {};
        this.dataManager = dataManager || {
            getData: async () => ({}),
            saveData: async () => {},
            getAllData: async () => ({ products: [], tiers: [], shipping: { zones: [] } })
        };
        
        // Admin state
        this.isInitialized = false;
        this.isAdmin = false;
        this.adminDashboard = null;
        this.adminPassword = 'kanva123';
        
        // Bind methods
        this.init = this.init.bind(this);
        this.showAdminPanel = this.showAdminPanel.bind(this);
        this.hideAdminPanel = this.hideAdminPanel.bind(this);
        this.toggleAdminPanel = this.toggleAdminPanel.bind(this);
        this.checkAdminStatus = this.checkAdminStatus.bind(this);
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
        this.initAdminUI = this.initAdminUI.bind(this);
        this.initAdminDashboard = this.initAdminDashboard.bind(this);
    }
    
    /**
     * Initialize the admin manager
     */
    async init() {
        if (this.isInitialized) return true;
        
        try {
            console.log('AdminManager: Initializing...');
            
            // Check admin status
            this.isAdmin = await this.checkAdminStatus();
            
            // Initialize admin UI elements
            this.initAdminUI();
            
            // Show admin button if user is admin or in development
            if (this.isAdmin || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                this.showAdminButton();
                
                // Initialize dashboard if already authenticated
                if (this.isAdmin) {
                    await this.initAdminDashboard();
                }
            }
            
            // Initialize event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('AdminManager: Initialized successfully');
            return true;
        } catch (error) {
            console.error('AdminManager: Initialization error:', error);
            return false;
        }
    }
    
    /**
     * Initialize the admin dashboard
     */
    async initAdminDashboard() {
        try {
            // Only load the admin dashboard if it's not already loaded
            if (typeof AdminDashboard === 'undefined') {
                console.warn('AdminDashboard class not found. Make sure admin-dashboard.js is loaded.');
                return false;
            }
            
            if (!this.adminDashboard) {
                this.adminDashboard = new AdminDashboard({
                    calculator: this.calculator,
                    adminManager: this
                });
                
                // Initialize the dashboard
                await this.adminDashboard.init();
                
                // Attach to window for debugging
                if (window) {
                    window.adminDashboard = this.adminDashboard;
                }
                
                console.log('AdminDashboard initialized successfully');
            }
            
            return true;
        } catch (error) {
            console.error('Error initializing AdminDashboard:', error);
            return false;
        }
    }
    
    /**
     * Check admin status from URL or localStorage
     */
    async checkAdminStatus() {
        // Check if we're in Copper context and user is admin
        if (window.Copper && window.Copper.user && window.Copper.user.email) {
            const isAdmin = await this.dataManager.isAdmin();
            if (isAdmin) {
                console.log('Admin access granted via Copper context');
                return true;
            }
        }
        
        // Check for session-based admin access
        const adminSession = sessionStorage.getItem('adminSession');
        if (adminSession) {
            try {
                const { email, expires } = JSON.parse(adminSession);
                if (new Date(expires) > new Date()) {
                    const isAdmin = await this.dataManager.isAdmin(email);
                    if (isAdmin) {
                        console.log('Admin access granted via session');
                        return true;
                    }
                } else {
                    sessionStorage.removeItem('adminSession');
                }
            } catch (e) {
                console.error('Error parsing admin session:', e);
                sessionStorage.removeItem('adminSession');
            }
        }
        
        // Check for URL parameter (for testing)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('admin')) {
            const testEmail = 'test@kanvabotanicals.com';
            this.dataManager.createAdminSession(testEmail, 4); // 4 hour session
            console.log('Temporary admin session created for testing');
            return true;
        }
        
        console.log('No valid admin session found');
        return false;
    }
    
    /**
     * Initialize admin UI elements
     */
    initAdminUI() {
        // Add admin button if it doesn't exist
        if (!document.getElementById('adminButton')) {
            const header = document.querySelector('.header-actions');
            if (header) {
                const adminBtn = document.createElement('button');
                adminBtn.id = 'adminButton';
                adminBtn.className = 'btn btn-sm btn-outline-secondary';
                adminBtn.innerHTML = '<i class="fas fa-cog"></i> Admin';
                adminBtn.onclick = this.toggleAdminPanel;
                header.appendChild(adminBtn);
            }
        }
        
        // Add admin panel if it doesn't exist
        if (!document.getElementById('adminPanel')) {
            const app = document.getElementById('app');
            if (app) {
                const adminPanel = document.createElement('div');
                adminPanel.id = 'adminPanel';
                adminPanel.className = 'admin-panel';
                adminPanel.style.display = 'none';
                adminPanel.innerHTML = `
                    <div class="admin-panel-header">
                        <h3>Admin Panel</h3>
                        <button class="btn btn-sm btn-close" id="closeAdminPanel">×</button>
                    </div>
                    <div class="admin-panel-body">
                        <div class="admin-section">
                            <h4>Admin Tools</h4>
                            <button class="btn btn-block btn-primary mb-2" id="adminLogoutBtn">Logout</button>
                        </div>
                    </div>
                `;
                app.appendChild(adminPanel);
            }
        }
        
        // Add admin login form if it doesn't exist
        if (!document.getElementById('adminLoginForm')) {
            const app = document.getElementById('app');
            if (app) {
                const adminLoginForm = document.createElement('div');
                adminLoginForm.id = 'adminLoginForm';
                adminLoginForm.className = 'admin-login-form';
                adminLoginForm.style.display = 'none';
                adminLoginForm.innerHTML = `
                    <h3>Admin Login</h3>
                    <form>
                        <div class="form-group">
                            <label for="adminEmail">Email:</label>
                            <input type="email" id="adminEmail" class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="adminPassword">Password:</label>
                            <input type="password" id="adminPassword" class="form-control">
                        </div>
                        <button class="btn btn-primary" id="adminLoginBtn">Login</button>
                    </form>
                `;
                app.appendChild(adminLoginForm);
            }
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close button in panel
        document.addEventListener('click', (e) => {
            if (e.target.id === 'closeAdminPanel' || e.target.closest('#closeAdminPanel')) {
                this.hideAdminPanel();
            }
            
            // Logout button
            if (e.target.id === 'adminLogoutBtn' || e.target.closest('#adminLogoutBtn')) {
                this.logout();
            }
            
            // Login button
            if (e.target.id === 'adminLoginBtn' || e.target.closest('#adminLoginBtn')) {
                this.login();
            }
        });
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('adminPanel');
            const button = document.getElementById('adminButton');
            
            if (panel && panel.style.display === 'block' && 
                !panel.contains(e.target) && 
                e.target !== button && 
                !button.contains(e.target)) {
                this.hideAdminPanel();
            }
        });
    }
    
    /**
     * Show admin panel
     */
    showAdminPanel() {
        // If user is not authenticated, show login prompt
        if (!this.isAdmin) {
            this.showAdminLogin();
            return;
        }
        
        // Show the admin dashboard if available
        if (this.adminDashboard) {
            this.adminDashboard.show();
        } else {
            // Fallback to simple admin panel
            const panel = document.getElementById('adminPanel');
            if (panel) {
                panel.style.display = 'block';
                // Focus first input if any
                const firstInput = panel.querySelector('input, select, button');
                if (firstInput) firstInput.focus();
            }
        }
    }
    
    /**
     * Show admin login form
     */
    showAdminLogin() {
        const loginForm = document.getElementById('adminLoginForm');
        if (loginForm) {
            loginForm.style.display = 'block';
            // Focus email input
            const emailInput = loginForm.querySelector('#adminEmail');
            if (emailInput) emailInput.focus();
        }
    }
    
    /**
     * Hide admin panel
     */
    hideAdminPanel() {
        const panel = document.getElementById('adminPanel');
        if (panel) panel.style.display = 'none';
    }
    
    /**
     * Toggle admin panel visibility
     */
    toggleAdminPanel() {
        if (!this.isAdmin) {
            this.showAdminLogin();
            return;
        }
        
        const adminPanel = document.getElementById('adminPanel');
        if (!adminPanel) return;
        
        if (adminPanel.style.display === 'none' || !adminPanel.style.display) {
            this.showAdminPanel();
        } else {
            this.hideAdminPanel();
        }
    }
    
    /**
     * Handle admin login
     * @param {string} email - Admin email
     * @param {string} password - Admin password
     * @returns {Promise<boolean>} - Whether login was successful
     */
    async login(email, password) {
        try {
            // Simple password check - in production, use proper authentication
            const isAuthenticated = password === this.adminPassword;
            
            if (isAuthenticated) {
                this.isAdmin = true;
                localStorage.setItem('kanvaAdminToken', 'admin_authenticated');
                await this.initAdminDashboard();
                this.showAdminPanel();
            } else if (this.adminDashboard) {
                this.adminDashboard.showNotification('Invalid password', 'error');
            } else {
                alert('Invalid password');
            }
            
            return isAuthenticated;
        } catch (error) {
            console.error('Login error:', error);
            
            // Show error message if dashboard is available
            if (this.adminDashboard) {
                this.adminDashboard.showNotification(`Login error: ${error.message}`, 'error');
            } else {
                alert(`Login error: ${error.message}`);
            }
            return false;
        }
    }
    
    /**
     * Logout from admin
     */
    async logout() {
        try {
            this.isAdmin = false;
            localStorage.removeItem('kanvaAdminToken');
            
            // Hide the admin panel
            this.hideAdminPanel();
            
            // Show a logout message if the dashboard is available
            if (this.adminDashboard) {
                this.adminDashboard.showNotification('Successfully logged out', 'info');
                
                // Hide the dashboard
                this.adminDashboard.hide();
            }
            
            // Optionally reload the page to clear any admin-specific state
            // window.location.href = window.location.pathname;
            
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            return false;
        }
    }

    /**
     * Populate admin fields with current config data
     */
    populateAdminFields() {
        try {
            const config = this.dataManager.getData() || {};
            const products = config.products || {};
            const tiers = config.tiers || {};
            const shipping = config.shipping || {};
            const payment = config.payment || {};
            
            // Populate product pricing fields
            Object.keys(products).forEach(key => {
                const product = products[key];
                const priceField = document.getElementById(`admin_${key}_price`);
                const msrpField = document.getElementById(`admin_${key}_msrp`);
                const unitsField = document.getElementById(`admin_${key}_units`);
                
                if (priceField && product.price) priceField.value = product.price;
                if (msrpField && product.msrp) msrpField.value = product.msrp;
                if (unitsField && product.unitsPerCase) unitsField.value = product.unitsPerCase;
            });

            // Populate tier fields
            if (tiers.tier2) {
                const tier2ThresholdField = document.getElementById('admin_tier2_threshold');
                const tier2DiscountField = document.getElementById('admin_tier2_discount');
                if (tier2ThresholdField) tier2ThresholdField.value = tiers.tier2.threshold;
                if (tier2DiscountField) tier2DiscountField.value = (tiers.tier2.discount || 0) * 100;
            }
            
            if (tiers.tier3) {
                const tier3ThresholdField = document.getElementById('admin_tier3_threshold');
                const tier3DiscountField = document.getElementById('admin_tier3_discount');
                if (tier3ThresholdField) tier3ThresholdField.value = tiers.tier3.threshold;
                if (tier3DiscountField) tier3DiscountField.value = (tiers.tier3.discount || 0) * 100;
            }

            // Populate shipping and payment fields
            const shippingRateField = document.getElementById('admin_shipping_rate');
            const freeShippingField = document.getElementById('admin_free_shipping');
            const achThresholdField = document.getElementById('admin_ach_threshold');
            
            if (shippingRateField && shipping.rate) shippingRateField.value = shipping.rate * 100;
            if (freeShippingField && shipping.freeThreshold) freeShippingField.value = shipping.freeThreshold;
            if (achThresholdField && payment.achThreshold) achThresholdField.value = payment.achThreshold;
            
            console.log('✅ Admin fields populated');
        } catch (error) {
            console.error('❌ Error populating admin fields:', error);
        }
    }

    /**
     * Save admin settings from form fields
     */
    async saveAdminSettings() {
        console.log('💾 Saving admin settings...');
        
        try {
            const config = await this.dataManager.getAllData() || {};
            const products = config.products || {};
            
            // Save product settings
            Object.keys(products).forEach(key => {
                const priceField = document.getElementById(`admin_${key}_price`);
                const msrpField = document.getElementById(`admin_${key}_msrp`);
                const unitsField = document.getElementById(`admin_${key}_units`);
                
                if (priceField && priceField.value) {
                    products[key].price = parseFloat(priceField.value);
                }
                if (msrpField && msrpField.value) {
                    products[key].msrp = parseFloat(msrpField.value);
                }
                if (unitsField && unitsField.value) {
                    products[key].unitsPerCase = parseInt(unitsField.value);
                }
            });

            // Save tier settings
            const tier2ThresholdField = document.getElementById('admin_tier2_threshold');
            const tier2DiscountField = document.getElementById('admin_tier2_discount');
            const tier3ThresholdField = document.getElementById('admin_tier3_threshold');
            const tier3DiscountField = document.getElementById('admin_tier3_discount');
            
            if (!config.tiers) config.tiers = {};
            if (!config.tiers.tier2) config.tiers.tier2 = {};
            if (!config.tiers.tier3) config.tiers.tier3 = {};
            
            if (tier2ThresholdField && tier2ThresholdField.value) {
                config.tiers.tier2.threshold = parseFloat(tier2ThresholdField.value);
            }
            if (tier2DiscountField && tier2DiscountField.value) {
                config.tiers.tier2.discount = parseFloat(tier2DiscountField.value) / 100;
            }
            if (tier3ThresholdField && tier3ThresholdField.value) {
                config.tiers.tier3.threshold = parseFloat(tier3ThresholdField.value);
            }
            if (tier3DiscountField && tier3DiscountField.value) {
                config.tiers.tier3.discount = parseFloat(tier3DiscountField.value) / 100;
            }

            // Save shipping and payment settings
            const shippingRateField = document.getElementById('admin_shipping_rate');
            const freeShippingField = document.getElementById('admin_free_shipping');
            const achThresholdField = document.getElementById('admin_ach_threshold');
            
            if (!config.shipping) config.shipping = {};
            if (!config.payment) config.payment = {};
            
            if (shippingRateField && shippingRateField.value) {
                config.shipping.rate = parseFloat(shippingRateField.value) / 100;
            }
            if (freeShippingField && freeShippingField.value) {
                config.shipping.freeThreshold = parseFloat(freeShippingField.value);
            }
            if (achThresholdField && achThresholdField.value) {
                config.payment.achThreshold = parseFloat(achThresholdField.value);
            }

            // Save the configuration
            await this.dataManager.saveData(config);
            
            console.log('✅ Admin settings saved successfully');
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.showSuccess('Admin settings saved successfully!');
            }
            
            // Trigger recalculation if calculator is available
            if (this.calculator && this.calculator.calculateAll) {
                this.calculator.calculateAll();
            }
            
        } catch (error) {
            console.error('❌ Error saving admin settings:', error);
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.showError('Failed to save admin settings: ' + error.message);
            }
        }
    }

    /**
     * Reset admin settings to defaults
     */
    async resetAdminSettings() {
        console.log('🔄 Resetting admin settings...');
        
        if (confirm('Are you sure you want to reset all admin settings to defaults? This cannot be undone.')) {
            try {
                // Reset to default configuration
                await this.dataManager.resetToDefaults();
                
                // Repopulate fields
                this.populateAdminFields();
                
                console.log('✅ Admin settings reset to defaults');
                
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.showSuccess('Admin settings reset to defaults');
                }
                
            } catch (error) {
                console.error('❌ Error resetting admin settings:', error);
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.showError('Failed to reset admin settings: ' + error.message);
                }
            }
        }
    }

    /**
     * Export admin configuration
     */
    async exportAdminConfig() {
        console.log('📤 Exporting admin config...');
        
        try {
            const config = await this.dataManager.getAllData();
            const dataStr = JSON.stringify(config, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            // Create download link
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = 'kanva-quotes-config.json';
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('✅ Admin config exported');
            
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.showSuccess('Configuration exported successfully!');
            }
            
        } catch (error) {
            console.error('❌ Error exporting admin config:', error);
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.showError('Failed to export configuration: ' + error.message);
            }
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.AdminManager = AdminManager;
}

// Global wrapper functions for HTML onclick compatibility
window.showAdminPanel = function() {
    if (window.adminManager) {
        window.adminManager.showAdminPanel();
    }
};

window.hideAdminPanel = function() {
    if (window.adminManager) {
        window.adminManager.hideAdminPanel();
    }
};

window.populateAdminFields = function() {
    if (window.adminManager) {
        window.adminManager.populateAdminFields();
    }
};

window.saveAdminSettings = function() {
    if (window.adminManager) {
        window.adminManager.saveAdminSettings();
    }
};

window.resetAdminSettings = function() {
    if (window.adminManager) {
        window.adminManager.resetAdminSettings();
    }
};

window.exportAdminConfig = function() {
    if (window.adminManager) {
        window.adminManager.exportAdminConfig();
    }
};

console.log('✅ AdminManager loaded');
