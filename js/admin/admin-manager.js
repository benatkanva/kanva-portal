import AuthManager from './components/AuthManager';

/**
 * AdminManager - Handles admin authentication and dashboard functionality
 * Updated to use the new AuthManager component
 */
class AdminManager {
    constructor() {
        console.log('AdminManager: Creating instance...');
        
        // Initialize properties
        this.isInitialized = false;
        this.isAdmin = false;
        this.adminDashboard = null;
        
        // Initialize AuthManager
        this.authManager = new AuthManager({
            onLogin: this.handleAuthLogin.bind(this),
            onLogout: this.handleAuthLogout.bind(this)
        });
        
        // Bind all methods to ensure proper context
        this.init = this.init.bind(this);
        this.initAdminButton = this.initAdminButton.bind(this);
        this.toggleAdminPanel = this.toggleAdminPanel.bind(this);
        this.showAdminPanel = this.showAdminPanel.bind(this);
        this.hideAdminPanel = this.hideAdminPanel.bind(this);
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
        this.checkAdminStatus = this.checkAdminStatus.bind(this);
        this.handleAuthLogin = this.handleAuthLogin.bind(this);
        this.handleAuthLogout = this.handleAuthLogout.bind(this);
        this.initAdminDashboard = this.initAdminDashboard.bind(this);
        this.waitForCalculatorReady = this.waitForCalculatorReady.bind(this);
        this.handleAdminLogin = this.handleAdminLogin.bind(this);
        this.showAdminLogin = this.showAdminLogin.bind(this);
        this.hideAdminLogin = this.hideAdminLogin.bind(this);
        this.openFullDashboard = this.openFullDashboard.bind(this);
        this.setupEventListeners = this.setupEventListeners.bind(this);
        this.initAdminUI = this.initAdminUI.bind(this);
        this.showAdminButton = this.showAdminButton.bind(this);
        this.handleAdminButtonClick = this.handleAdminButtonClick.bind(this);
        
        // Initialize admin button when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initAdminButton();
            });
        } else {
            // DOM is already ready
            setTimeout(() => this.initAdminButton(), 100);
        }
    }

    /**
     * Initialize the AdminManager
     * @returns {Promise<boolean>} True if initialization was successful
     */
    async init() {
        if (this.isInitialized) return true;
        
        try {
            console.log('AdminManager: Initializing...');
            
            // Check for existing admin session
            this.isAdmin = await this.checkAdminStatus();

            // Set up event listeners
            this.setupEventListeners();

            // Initialize admin UI if needed
            if (this.isAdmin) {
                await this.initAdminUI();
            }

            // Show admin button if user is admin or in development
            if (this.isAdmin || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                this.showAdminButton();
                
                // Initialize dashboard if already authenticated
                if (this.isAdmin) {
                    await this.initAdminDashboard();
                }
            }

            this.isInitialized = true;
            console.log('AdminManager: Initialized successfully');
            return true;
        } catch (error) {
            console.error('AdminManager: Initialization failed', error);
            // Don't throw error to prevent blocking app initialization
            // Instead, log the error and continue
            return false;
        }
    }

    /**
     * Initialize the admin button in the UI - FIXED VERSION
     */
    initAdminButton() {
        try {
            console.log('🔍 Initializing admin button - DOM ready state:', document.readyState);
            
            // Look for the existing header button first
            let adminToggle = document.getElementById('adminToggle');
            console.log('🔍 Admin toggle button search result:', adminToggle ? 'Found' : 'Not found');
            
            // If button doesn't exist, try to create it
            if (!adminToggle) {
                console.log('🔧 Creating admin toggle button...');
                adminToggle = document.createElement('button');
                adminToggle.id = 'adminToggle';
                adminToggle.className = 'btn btn-admin';
                adminToggle.innerHTML = 'Admin';
                document.body.appendChild(adminToggle);
                console.log('✅ Created admin toggle button');
            }
            
            if (adminToggle) {
                console.log('✅ Found/created admin toggle button with ID:', adminToggle.id);
                
                // Make sure button is visible
                adminToggle.style.display = 'block';
                adminToggle.style.visibility = 'visible';
                
                // Remove any existing click handlers
                const newToggle = adminToggle.cloneNode(true);
                adminToggle.parentNode.replaceChild(newToggle, adminToggle);
                adminToggle = newToggle;
                
                // Add our click handler
                console.log('🔧 Adding click handler to admin button');
                const boundHandler = (e) => {
                    console.log('🖱️ Admin button clicked');
                    this.handleAdminButtonClick(e);
                };
                
                // Use both onclick and addEventListener for maximum compatibility
                adminToggle.onclick = boundHandler;
                adminToggle.addEventListener('click', boundHandler, { once: false });
                
                // Store reference to the bound handler for cleanup
                this._boundButtonHandler = boundHandler;
                
                // Test the click handler programmatically
                console.log('🔍 Testing admin button click handler...');
                try {
                    adminToggle.click();
                } catch (e) {
                    console.warn('⚠️ Could not programmatically click admin button:', e);
                }
                
                return;
            }
            
            // If we still don't have a button, create a floating one
            console.warn('⚠️ Could not find or create admin button in header, creating floating button');
            this.createFloatingAdminButton();
            
        } catch (error) {
            console.error('❌ Error initializing admin button:', error);
            // Fallback to creating floating button on error
            try {
                this.createFloatingAdminButton();
            } catch (e) {
                console.error('❌ Failed to create floating admin button:', e);
            }
        }
    }

    /**
     * Handle admin button click - UPDATED to properly trigger auth flow
     */
    handleAdminButtonClick(e) {
        console.log('🔵 [1/5] Admin button clicked!');
        
        // Prevent default and stop propagation
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Log the current state
        console.log('🔵 [2/5] AdminManager state:', {
            isInitialized: this.isInitialized,
            isAdmin: this.isAdmin,
            authManager: this.authManager ? 'initialized' : 'not initialized',
            authManagerMethods: this.authManager ? Object.keys(this.authManager) : 'N/A'
        });
        
        try {
            // Check if user is already authenticated
            if (this.isAdmin) {
                console.log('🔵 [3/5] User is admin, toggling admin panel...');
                this.toggleAdminPanel();
            } else {
                console.log('🔵 [3/5] User not authenticated, showing login form...');
                // Show the login modal
                if (this.authManager && typeof this.authManager.showLogin === 'function') {
                    this.authManager.showLogin();
                } else if (this.showAdminLogin) {
                    // Fallback to legacy method
                    this.showAdminLogin();
                } else {
                    console.error('❌ [4/5] No auth methods available');
                    this.showNotification('Authentication system not available. Please refresh the page and try again.', 'error');
                    return;
                }
                
                // Initialize admin dashboard if not already done
                if (!this.adminDashboard) {
                    console.log('🔵 [4/5] Initializing admin dashboard...');
                    this.initAdminDashboard().catch(err => {
                        console.error('Error initializing admin dashboard:', err);
                    });
                }
            }
            
            console.log('✅ [5/5] Admin button click handled successfully');
        } catch (error) {
            console.error('❌ [5/5] Error in handleAdminButtonClick:', {
                error: error,
                message: error.message,
                stack: error.stack
            });
            // Show a more user-friendly error message
            this.showNotification('Error accessing admin panel. Please try again.', 'error');
        }
    }

    /**
     * Create floating admin button if header button doesn't exist - NEW METHOD
     */
    createFloatingAdminButton() {
        // Remove existing floating button if present
        const existingBtn = document.getElementById('adminButton');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        // Create floating admin button
        const adminButton = document.createElement('button');
        adminButton.id = 'adminButton';
        adminButton.className = 'btn btn-outline-secondary admin-button';
        adminButton.innerHTML = '<i class="fas fa-cog"></i> Admin';
        adminButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            border-radius: 25px;
            padding: 10px 20px;
            background: white;
            border: 2px solid #93D500;
            color: #93D500;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.2s ease;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
        `;
        
        // Add hover effects
        adminButton.addEventListener('mouseenter', () => {
            adminButton.style.background = '#93D500';
            adminButton.style.color = 'white';
            adminButton.style.transform = 'translateY(-2px)';
        });
        
        adminButton.addEventListener('mouseleave', () => {
            adminButton.style.background = 'white';
            adminButton.style.color = '#93D500';
            adminButton.style.transform = 'translateY(0)';
        });
        
        // Add click handler
        adminButton.addEventListener('click', this.handleAdminButtonClick.bind(this));
        
        document.body.appendChild(adminButton);
        console.log('✅ Floating admin button created');
    }

    /**
     * Toggle the admin panel visibility
     */
    async toggleAdminPanel() {
        console.log('🔄 [1/5] toggleAdminPanel called');
        
        try {
            console.log('🔍 [2/5] Checking admin status...');
            // Check for valid session status
            this.isAdmin = await this.checkAdminStatus();
            console.log('🔍 [2/5] Admin status:', this.isAdmin ? 'Authenticated' : 'Not authenticated');
            
            if (!this.isAdmin) {
                console.log('🔐 [3/5] User not authenticated, showing login');
                this.showAdminLogin();
                return;
            }
            
            // If we have an existing dashboard, just toggle its visibility
            if (this.adminDashboard) {
                console.log('🔍 [3/5] Admin dashboard exists, toggling visibility...');
                const dashboard = document.getElementById('admin-app');
                console.log('🔍 [3/5] Dashboard element:', dashboard);
                
                if (dashboard) {
                    const isVisible = dashboard.style.display !== 'none';
                    console.log(`🔍 [3/5] Dashboard visibility: ${isVisible ? 'visible' : 'hidden'}`);
                    
                    if (isVisible) {
                        console.log('🔍 [3/5] Hiding admin panel');
                        this.hideAdminPanel();
                    } else {
                        console.log('🔍 [3/5] Showing admin panel');
                        this.showAdminPanel();
                    }
                } else {
                    console.warn('⚠️ [3/5] Dashboard element not found, initializing...');
                    await this.initAdminDashboard();
                }
                return;
            }
            
            // Initialize dashboard if it doesn't exist
            console.log('⚡ [4/5] Initializing admin dashboard...');
            await this.initAdminDashboard();
            console.log('✅ [5/5] Admin dashboard initialized');
            
        } catch (error) {
            console.error('❌ [5/5] Error in toggleAdminPanel:', {
                error: error,
                message: error.message,
                stack: error.stack
            });
            this.showNotification('Error accessing admin panel. Please refresh and try again.', 'error');
        }
    }

    /**
     * Check if user has admin privileges
     */
    async checkAdminStatus() {
        try {
            // Check with AuthManager for authentication status
            this.isAdmin = await this.authManager.checkAuthStatus();
            return this.isAdmin;
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }

    /**
     * Handle successful authentication
     */
    handleAuthLogin(email) {
        console.log('AuthManager: User logged in:', email);
        this.isAdmin = true;
        
        // Toggle admin panel visibility
        if (this.isAdmin) {
            this.hideAdminPanel();
        } else {
            this.showAdminLogin();
        }
    }
    
    // Show the admin panel (main method called from the app)
    async showAdminPanel() {
        console.log('🔧 [AdminManager] Showing admin panel...');
        
        try {
            // Ensure we're authenticated
            if (!this.isAdmin) {
                console.log('🔐 Admin not authenticated, showing login...');
                return this.showAdminLogin();
            }
            
            // Initialize the dashboard if not already done
            if (!this.adminDashboard) {
                console.log('🔄 Initializing admin dashboard...');
                await this.initAdminDashboard();
            }
            
            // Show the dashboard
            if (this.adminDashboard && typeof this.adminDashboard.show === 'function') {
                console.log('🖥️ Showing admin dashboard...');
                await this.adminDashboard.show();
            } else {
                console.error('❌ Admin dashboard not properly initialized');
                throw new Error('Admin dashboard failed to initialize');
            }
            
            console.log('✅ Admin panel shown successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to show admin panel:', error);
            
            // Show error to user
            if (window.NotificationManager) {
                window.NotificationManager.showError(
                    'Admin Panel Error',
                    'Failed to load admin panel. Please try again.'
                );
            }
            
            // Re-throw the error for the caller to handle
            throw error;
        }
    }

    /**
     * Handle logout
     */
    handleAuthLogout() {
        console.log('AuthManager: User logged out');
        this.isAdmin = false;
        this.hideAdminPanel();
        this.showAdminButton();
    }

    /**
     * Show admin login modal
     */
    showAdminLogin() {
        console.log('🔵 [1/3] showAdminLogin called');
        
        try {
            if (!this.authManager) {
                throw new Error('AuthManager is not initialized');
            }
            
            console.log('🔍 [2/3] AuthManager state:', {
                isInitialized: this.authManager.isInitialized,
                isAuthenticated: this.authManager.isAuthenticated,
                allowedEmails: this.authManager.allowedEmails ? 'configured' : 'not configured'
            });
            
            console.log('🔍 [2/3] Calling authManager.showLogin()...');
            this.authManager.showLogin();
            console.log('✅ [3/3] authManager.showLogin() completed');
            
        } catch (error) {
            console.error('❌ [3/3] Error in showAdminLogin:', {
                error: error,
                message: error.message,
                stack: error.stack
            });
            this.showNotification('Error showing login form. Please try again.', 'error');
        }
    }

    /**
     * Hide admin login modal
     */
    hideAdminLogin() {
        const loginModal = document.getElementById('adminLoginModal');
        if (loginModal) {
            loginModal.remove();
        }
    }
    
    /**
     * Handle admin login form submission
     */
    async handleAdminLogin() {
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;
        
        // Simple authentication (in production, this would be server-side)
        if (this.adminEmails.includes(email) && password === 'kanva123') {
            // Set session
            sessionStorage.setItem('kanva_admin_email', email);
            sessionStorage.setItem('kanva_admin_token', `token_${Date.now()}`);
            
            this.isAdmin = true;
            this.hideAdminLogin();
            
            // Initialize dashboard
            await this.initAdminDashboard();
            
            console.log('✅ Admin login successful');
            await this.openFullDashboard();
        } else {
            this.showLoginError('Invalid email or password');
        }
    }

    /**
     * Show login error message
     */
    showLoginError(message) {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    /**
     * Show admin panel - FIXED VERSION
     */
    showAdminPanel() {
        console.log('📋 Creating admin panel...');
        
        // Remove existing panel
        const existingPanel = document.getElementById('adminPanel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        // Create admin panel
        const adminPanel = document.createElement('div');
        adminPanel.id = 'adminPanel';
        adminPanel.style.cssText = `
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            z-index: 9999;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            padding: 1.5rem;
            min-width: 280px;
            animation: slideInRight 0.3s ease;
            border: 1px solid #e5e7eb;
            display: block;
        `;
        
        adminPanel.innerHTML = `
            <div class="admin-panel-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid #e5e7eb;
            ">
                <h3 style="margin: 0; color: #17351A; font-size: 1.25rem; font-weight: 600;">Admin Panel</h3>
                <button id="closeAdminPanel" style="
                    background: none;
                    border: none;
                    color: #6b7280;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                ">×</button>
            </div>
            <div class="admin-panel-body">
                <div class="admin-section">
                    <h4 style="color: #374151; font-size: 1rem; margin: 0 0 1rem 0; font-weight: 600;">Admin Tools</h4>
                    <button id="openFullDashboard" style="
                        width: 100%;
                        margin-bottom: 0.75rem;
                        padding: 0.75rem 1rem;
                        border: 1px solid transparent;
                        border-radius: 6px;
                        font-size: 0.9rem;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                        text-decoration: none;
                        background: #93D500;
                        color: white;
                        border-color: #93D500;
                    ">
                        <i class="fas fa-cogs"></i> Open Full Dashboard
                    </button>
                    <button id="adminLogoutBtn" style="
                        width: 100%;
                        margin-bottom: 0;
                        padding: 0.75rem 1rem;
                        border: 1px solid #6b7280;
                        border-radius: 6px;
                        font-size: 0.9rem;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                        text-decoration: none;
                        background: #6b7280;
                        color: white;
                    ">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(adminPanel);
        
        // Set up event listeners for the admin panel buttons
        this.setupAdminPanelListeners(adminPanel);
        
        console.log('✅ Admin panel created and shown');
    }
    
    /**
     * Set up event listeners for admin panel buttons
     */
    setupAdminPanelListeners(panel) {
        // Open Full Dashboard button
        const openDashboardBtn = panel.querySelector('#openFullDashboard');
        if (openDashboardBtn) {
            openDashboardBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🚀 Open Full Dashboard button clicked');
                this.openFullDashboard();
            });
        }
        
        // Close panel button
        const closeBtn = panel.querySelector('#closeAdminPanel');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔴 Close admin panel button clicked');
                this.hideAdminPanel();
            });
        }
        
        // Logout button
        const logoutBtn = panel.querySelector('#adminLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🚪 Admin logout button clicked');
                this.logout();
            });
        }
        
        console.log('✅ Admin panel event listeners set up');
    }

    /**
     * Hide admin panel
     */
    hideAdminPanel() {
        // Important: Don't store/restore the dashboard here as it can cause issues
        // with the toggle flow. The toggleAdminPanel method now handles this.
        
        const panel = document.getElementById('adminPanel');
        if (panel) {
            // Remove any existing animation end listeners to prevent memory leaks
            const newPanel = panel.cloneNode(true);
            panel.parentNode.replaceChild(newPanel, panel);
            newPanel.remove();
            
            console.log('✅ Admin panel hidden and removed from DOM');
        }
    }

    /**
     * Initialize admin UI elements
     */
    initAdminUI() {
        // This method can be used to set up any additional UI elements
        console.log('🎨 Admin UI initialized');
    }

    /**
     * Setup event listeners - IMPROVED VERSION
     */
    setupEventListeners() {
        // Use event delegation to handle dynamically created elements
        document.addEventListener('click', (e) => {
            // Close button in panel
            if (e.target.id === 'closeAdminPanel' || e.target.closest('#closeAdminPanel')) {
                e.preventDefault();
                e.stopPropagation();
                this.hideAdminPanel();
            }
            
            // Open full dashboard button
            if (e.target.id === 'openFullDashboard' || e.target.closest('#openFullDashboard')) {
                e.preventDefault();
                e.stopPropagation();
                this.openFullDashboard();
            }
            
            // Logout button
            if (e.target.id === 'adminLogoutBtn' || e.target.closest('#adminLogoutBtn')) {
                e.preventDefault();
                e.stopPropagation();
                this.logout();
            }
        });
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('adminPanel');
            const adminToggle = document.getElementById('adminToggle');
            const adminButton = document.getElementById('adminButton');
            
            if (panel && panel.style.display === 'block') {
                // Check if click was outside panel and not on admin buttons
                if (!panel.contains(e.target) && 
                    e.target !== adminToggle && 
                    e.target !== adminButton &&
                    !adminToggle?.contains(e.target) && 
                    !adminButton?.contains(e.target)) {
                    this.hideAdminPanel();
                }
            }
        });
        
        console.log('🔗 Event listeners set up');
    }

    /**
     * Initialize admin dashboard
     */
    async initAdminDashboard() {
        try {
            // Check if AdminDashboard class is available
            if (typeof AdminDashboard !== 'function') {
                console.error('AdminDashboard class not available');
                
                // Try to dynamically load AdminDashboard if needed
                if (typeof document !== 'undefined') {
                    console.log('Attempting to load AdminDashboard script...');
                    
                    // Check if script is already in the document
                    const existingScript = document.querySelector('script[src*="admin-dashboard.js"]');
                    if (!existingScript) {
                        await new Promise((resolve, reject) => {
                            const script = document.createElement('script');
                            script.src = '/js/admin/admin-dashboard.js';
                            script.onload = resolve;
                            script.onerror = () => reject(new Error('Failed to load AdminDashboard script'));
                            document.head.appendChild(script);
                        });
                        console.log('AdminDashboard script loaded');
                    }
                    
                    // Wait a moment for script to initialize
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Check again if AdminDashboard is available
                    if (typeof AdminDashboard !== 'function') {
                        throw new Error('AdminDashboard class not found after loading attempt');
                    }
                } else {
                    throw new Error('AdminDashboard class not found');
                }
            }
            
            // Create a minimal calculator instance if not available
            const calculator = this.calculator || window.calculator || {
                dataManager: window.DataManager ? new DataManager() : {},
                calculationEngine: window.CalculationEngine ? new CalculationEngine() : {},
                getSettings: () => ({}),
                updateSettings: () => {},
                saveSettings: async () => {},
                loadData: async () => {}
            };
            
            this.adminDashboard = new AdminDashboard({
                calculator: calculator,
                adminManager: this
            });
            
            await this.adminDashboard.init();
            console.log('Admin dashboard initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing admin dashboard:', error);
            
            // Safe notification display that doesn't rely on this.showNotification
            try {
                if (typeof this.showNotification === 'function') {
                    this.showNotification('Failed to initialize admin dashboard', 'error');
                } else {
                    console.warn('showNotification method not available');
                    // Fallback to alert if in browser environment
                    if (typeof alert === 'function') {
                        alert('Failed to initialize admin dashboard: ' + error.message);
                    }
                }
            } catch (notifyError) {
                console.error('Error showing notification:', notifyError);
            }
            
            return false;
        }
    }

    /**
     * Wait for calculator to be ready
     */
    async waitForCalculatorReady() {
        return new Promise((resolve) => {
            if (window.calculator && window.calculator.isReady) {
                console.log('✅ Calculator is ready');
                resolve(true);
                return;
            }
            
            console.log('⏳ Waiting for calculator...');
            
            const checkReady = () => {
                if (window.calculator && window.calculator.isReady) {
                    console.log('✅ Calculator is ready');
                    resolve(true);
                } else {
                    setTimeout(checkReady, 100);
                }
            };
            
            checkReady();
        });
    }

    /**
     * Logout admin user
     */
    logout() {
        console.log('AdminManager: Logging out admin user');
        this.authManager.logout();
    }

    /**
     * Open full admin dashboard in modal
     */
    async openFullDashboard() {
        try {
            console.log('🚀 Opening Admin Dashboard...');
            // Hide admin panel
            this.hideAdminPanel();

            // Wait for calculator readiness
            await this.waitForCalculatorReady();

            // Initialize dashboard if not already done
            if (!this.adminDashboard) {
                console.log('📝 Initializing Admin Dashboard...');
                const initialized = await this.initAdminDashboard();
                if (!initialized) throw new Error('Admin Dashboard initialization failed');
            }

            // Create and show modal
            this.createAdminModal();
        } catch (error) {
            console.error('❌ Error opening Admin Dashboard:', error);
            alert('Failed to open admin dashboard: ' + error.message);
        }
    }
    showAdminButton() {
        console.log('🔘 Ensuring admin button visibility');
        // Initialize admin button UI
        this.initAdminButton();
    }

    /**
     * Create login modal (legacy method for compatibility)
     */
    createLoginModal() {
        this.showAdminLogin();
    }

    /**
     * Show login error (legacy method for compatibility)
     */
    showLoginError(message) {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    /**
     * Hide login error (legacy method for compatibility)
     */
    hideLoginError() {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    /**
     * Login method (legacy compatibility)
     */
    login() {
        this.showAdminLogin();
    }

    /**
     * Create admin modal for dashboard
     */
    createAdminModal() {
    // Remove existing admin modal if already open
    const existingAdminModal = document.getElementById('adminModal');
    if (existingAdminModal) {
        existingAdminModal.remove();
    }
        try {
            console.log('🏗️ Creating admin modal with dashboard state:', {
                dashboardExists: !!this.adminDashboard,
                hasRenderMethod: this.adminDashboard && typeof this.adminDashboard.renderInContainer === 'function'
            });
            
            // Create modal container
            const modal = document.createElement('div');
            modal.id = 'adminModal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow-y: auto;
            `;
            
            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.className = 'admin-modal-content';
            modalContent.style.cssText = `
                background: white;
                border-radius: 8px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                width: 90%;
                max-width: 1200px;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
            `;
            
            // Add close button
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '&times;';
            closeButton.style.cssText = `
                position: absolute;
                top: 10px;
                right: 15px;
                font-size: 24px;
                background: none;
                border: none;
                cursor: pointer;
                color: #333;
                z-index: 1;
            `;
            closeButton.addEventListener('click', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                console.log('🔴 Admin modal close button clicked');
                // Store dashboard reference before removing modal
                const currentDashboard = this.adminDashboard;
                modal.remove();
                // Restore dashboard reference
                this.adminDashboard = currentDashboard;
            });
            
            // Create dashboard container
            const dashboardContainer = document.createElement('div');
            dashboardContainer.id = 'adminDashboardContainer';
            dashboardContainer.style.cssText = `
                padding: 20px;
                width: 100%;
                height: 100%;
            `;
            
            // Assemble modal
            modalContent.appendChild(closeButton);
            modalContent.appendChild(dashboardContainer);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // Render dashboard in container
            if (this.adminDashboard && typeof this.adminDashboard.renderInContainer === 'function') {
                console.log('🎨 Rendering admin dashboard in container');
                this.adminDashboard.renderInContainer(dashboardContainer);
                console.log('✅ Admin dashboard rendered successfully');
                // Attach logout listener inside full dashboard modal
                const logoutBtnInModal = dashboardContainer.querySelector('#adminLogout');
                if (logoutBtnInModal) {
                    logoutBtnInModal.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        console.log('🚪 Full dashboard logout button clicked');
                        this.logout();
                    });
                }
                // Attach save changes listener inside full dashboard modal
                const saveBtnInModal = dashboardContainer.querySelector('#saveAdminChanges');
                if (saveBtnInModal) {
                    saveBtnInModal.addEventListener('click', (e) => {
                        e.preventDefault();
                        console.log('💾 Full dashboard save button clicked');
                        this.adminDashboard.saveChanges();
                    });
                }
            } else {
                console.error('❌ Admin dashboard not available or renderInContainer method missing', {
                    dashboardExists: !!this.adminDashboard,
                    dashboardMethods: this.adminDashboard ? Object.keys(this.adminDashboard) : 'N/A'
                });
                dashboardContainer.innerHTML = '<div style="padding: 40px; text-align: center;">Error: Admin dashboard not available</div>';
            }
            
            // Close on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    console.log('🔴 Admin modal outside click detected');
                    // Store dashboard reference before removing modal
                    const currentDashboard = this.adminDashboard;
                    modal.remove();
                    // Restore dashboard reference
                    this.adminDashboard = currentDashboard;
                }
            });
            
            console.log('✅ Admin modal created and displayed');
            return modal;
        } catch (error) {
            console.error('❌ Error creating admin modal:', error);
            return null;
        }
    }
}

// First expose to global scope at the module level
if (typeof window !== 'undefined') {
    // Create kanva namespace if it doesn't exist
    window.kanva = window.kanva || {};
    
    // Expose AdminManager to window and kanva namespace
    window.kanva.AdminManager = AdminManager;
    
    // Add debug info
    console.log('✅ AdminManager class exposed to window.kanva.AdminManager');
    
    // Dispatch event when AdminManager is available
    const event = new CustomEvent('AdminManagerReady', { 
        detail: { 
            AdminManager: AdminManager,
            timestamp: new Date().toISOString() 
        },
        bubbles: true,
        cancelable: true
    });
    
    // Dispatch on both window and document
    window.dispatchEvent(event);
    document.dispatchEvent(new CustomEvent('AdminManagerReady', event));
    
    console.log('📢 AdminManagerReady event dispatched');
}

// Export the AdminManager class
export default AdminManager;

// Add CSS for animations
if (!document.getElementById('admin-animations')) {
    const style = document.createElement('style');
    style.id = 'admin-animations';
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateY(-50%) translateX(20px);
            }
            to {
                opacity: 1;
                transform: translateY(-50%) translateX(0);
            }
        }
        
        .admin-button:hover {
            transform: translateY(-2px) !important;
        }
        
        .admin-button:active {
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
}

// Make AdminManager available globally
if (typeof window !== 'undefined') {
    try {
        // Expose AdminManager to the global scope
        window.AdminManager = AdminManager;
        
        // Also expose it as a property of the window.kanvaApp if it exists
        if (!window.kanvaApp) {
            window.kanvaApp = {};
        }
        window.kanvaApp.AdminManager = AdminManager;
        
        console.log('✅ AdminManager loaded and registered globally');
        
        // Log that we're about to dispatch the event
        console.log('🔄 Dispatching adminManagerReady event...');
        
        // Dispatch an event that AdminManager is ready
        const event = new CustomEvent('adminManagerReady', { 
            detail: { 
                message: 'AdminManager is now available',
                timestamp: new Date().toISOString()
            } 
        });
        
        // Log when the event is dispatched
        document.addEventListener('adminManagerReady', (e) => {
            console.log('✅ adminManagerReady event dispatched', e.detail);
        }, { once: true });
        
        document.dispatchEvent(event);
        
        // Also log to window for debugging
        console.log('🔍 window.AdminManager available:', typeof window.AdminManager === 'function' ? '✅' : '❌');
        
    } catch (error) {
        console.error('❌ Error registering AdminManager globally:', error);
    }
} else {
    console.log('✅ AdminManager loaded (non-browser environment)');
}