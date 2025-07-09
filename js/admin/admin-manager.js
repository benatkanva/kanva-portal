/**
 * AdminManager - Handles admin authentication and dashboard functionality
 * Fixed version that properly handles admin button clicks and panel toggling
 */
class AdminManager {
    constructor() {
        console.log('AdminManager: Creating instance...');
        
        // Initialize properties
        this.isInitialized = false;
        this.isAdmin = false;
        this.adminDashboard = null;
        this.adminEmails = [
            'ben@kanvabotanicals.com',
            'admin@kanvabotanicals.com',
            'support@kanvabotanicals.com',
            'test@admin.com'
        ];
        
        // Bind all methods to ensure proper context
        this.init = this.init.bind(this);
        this.initAdminButton = this.initAdminButton.bind(this);
        this.toggleAdminPanel = this.toggleAdminPanel.bind(this);
        this.showAdminPanel = this.showAdminPanel.bind(this);
        this.hideAdminPanel = this.hideAdminPanel.bind(this);
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
        this.checkAdminStatus = this.checkAdminStatus.bind(this);
        this.createLoginModal = this.createLoginModal.bind(this);
        this.showLoginError = this.showLoginError.bind(this);
        this.hideLoginError = this.hideLoginError.bind(this);
        this.initAdminDashboard = this.initAdminDashboard.bind(this);
        this.waitForCalculatorReady = this.waitForCalculatorReady.bind(this);
        this.handleAdminLogin = this.handleAdminLogin.bind(this);
        this.showAdminLogin = this.showAdminLogin.bind(this);
        this.hideAdminLogin = this.hideAdminLogin.bind(this);
        this.openFullDashboard = this.openFullDashboard.bind(this);
        this.setupEventListeners = this.setupEventListeners.bind(this);
        this.initAdminUI = this.initAdminUI.bind(this);
        this.showAdminButton = this.showAdminButton.bind(this);
        
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
            const adminToggle = document.getElementById('adminToggle');
            console.log('🔍 Admin toggle button search result:', adminToggle ? 'Found' : 'Not found');
            
            if (adminToggle) {
                console.log('✅ Found admin toggle button in header with ID:', adminToggle.id);
                console.log('🔍 Current button properties:', {
                    'visible': adminToggle.offsetParent !== null,
                    'display': window.getComputedStyle(adminToggle).display,
                    'hasClickHandler': adminToggle.onclick !== null
                });
                
                // Remove any existing event listeners to prevent duplicates
                adminToggle.removeEventListener('click', this.handleAdminButtonClick);
                
                // Add our click handler with explicit binding
                const boundHandler = this.handleAdminButtonClick.bind(this);
                adminToggle.addEventListener('click', boundHandler);
                
                // Attach single click handler to avoid duplicate toggles
                console.log('✅ Admin button click handler attached via addEventListener');
                return;
            }
            
            // If no header button exists, create a floating one
            console.warn('⚠️ Admin button not found in header, creating floating button');
            this.createFloatingAdminButton();
            
        } catch (error) {
            console.error('❌ Error initializing admin button:', error);
        }
    }

    /**
     * Handle admin button click - NEW METHOD
     */
    handleAdminButtonClick(e) {
        console.log('🔐 Admin button clicked!', e.target);
        console.log('AdminManager instance state:', {
            isInitialized: this.isInitialized,
            isAdmin: this.isAdmin,
            adminDashboard: this.adminDashboard ? 'exists' : 'null'
        });
        e.preventDefault();
        e.stopPropagation();
        
        try {
            console.log('Attempting to toggle admin panel...');
            this.toggleAdminPanel();
        } catch (error) {
            console.error('❌ Error handling admin button click:', error);
            alert('Error opening admin panel. Check console for details.');
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
        console.log('🔄 Toggling admin panel...');
        
        try {
            // Check if user is authenticated
            if (!this.isAdmin) {
                console.log('🔐 User not authenticated, showing login');
                this.showAdminLogin();
                return;
            }
            
            // Initialize dashboard if it doesn't exist
            if (!this.adminDashboard) {
                console.log('⚡ Initializing admin dashboard...');
                await this.initAdminDashboard();
            }
            
            // Open full admin dashboard directly when user clicks admin button and is authenticated
            console.log('🚀 Opening full admin dashboard directly from toggle');
            await this.openFullDashboard();
            
        } catch (error) {
            console.error('❌ Error toggling admin panel:', error);
            alert('Error accessing admin panel. Please check console for details.');
        }
    }

    /**
     * Check if user has admin privileges
     */
    async checkAdminStatus() {
        try {
            // Check for valid session
            const adminEmail = sessionStorage.getItem('kanva_admin_email');
            const adminToken = sessionStorage.getItem('kanva_admin_token');
            
            if (adminEmail && adminToken && this.adminEmails.includes(adminEmail)) {
                console.log('Valid admin session found for:', adminEmail);
                return true;
            }
            
            // Check for development environment
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('Development environment detected, granting admin access');
                sessionStorage.setItem('kanva_admin_email', 'dev@localhost');
                sessionStorage.setItem('kanva_admin_token', 'dev_session');
                console.log('Development admin session created for testing');
                return true;
            }
            
            console.log('No valid admin session found');
            return false;
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }

    /**
     * Show admin login modal
     */
    showAdminLogin() {
        console.log('📝 Showing admin login');
        
        // Remove existing login modal
        const existingModal = document.getElementById('adminLoginModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create login modal
        const loginModal = document.createElement('div');
        loginModal.id = 'adminLoginModal';
        loginModal.style.cssText = `
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
        `;
        
        loginModal.innerHTML = `
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                min-width: 400px;
                max-width: 90vw;
            ">
                <h3 style="margin: 0 0 1.5rem 0; color: #17351A; text-align: center;">Admin Login</h3>
                <form id="adminLoginForm">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email:</label>
                        <input type="email" id="adminEmail" style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 1px solid #ddd;
                            border-radius: 6px;
                            font-size: 1rem;
                        " placeholder="Enter admin email" required>
                    </div>
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Password:</label>
                        <input type="password" id="adminPassword" style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 1px solid #ddd;
                            border-radius: 6px;
                            font-size: 1rem;
                        " placeholder="Enter password" required>
                    </div>
                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button type="button" id="cancelLogin" style="
                            padding: 0.75rem 1.5rem;
                            background: #6b7280;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 1rem;
                        ">Cancel</button>
                        <button type="submit" style="
                            padding: 0.75rem 1.5rem;
                            background: #93D500;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 1rem;
                        ">Login</button>
                    </div>
                </form>
                <div id="loginError" style="
                    margin-top: 1rem;
                    padding: 0.75rem;
                    background: #fee2e2;
                    color: #dc2626;
                    border-radius: 6px;
                    display: none;
                "></div>
            </div>
        `;
        
        document.body.appendChild(loginModal);
        
        // Focus email input
        setTimeout(() => {
            document.getElementById('adminEmail').focus();
        }, 100);
        
        // Set up event listeners
        document.getElementById('cancelLogin').addEventListener('click', () => {
            this.hideAdminLogin();
        });
        
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAdminLogin();
        });
        
        // Close on outside click
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                this.hideAdminLogin();
            }
        });
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
            this.showAdminPanel();
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
        console.log('🔐 Logging out admin user');
        // Remove full dashboard modal if open
        const fullModal = document.getElementById('adminModal');
        if (fullModal) {
            console.log('🔴 Removing full dashboard modal');
            fullModal.remove();
        }
        
        // Clear session
        sessionStorage.removeItem('kanva_admin_email');
        sessionStorage.removeItem('kanva_admin_token');
        
        this.isAdmin = false;
        this.hideAdminPanel();
        
        // Show logout confirmation
        alert('Logged out successfully');
        
        console.log('✅ Admin logout completed');
    }

    /**
     * Open full admin dashboard in modal
     */
    async openFullDashboard() {
        try {
            console.log('🚀 Opening full dashboard in modal...');
            
            // Store the current adminDashboard instance before hiding the panel
            const currentDashboard = this.adminDashboard;
            
            this.hideAdminPanel();
            
            // Restore the adminDashboard instance after hiding the panel
            this.adminDashboard = currentDashboard;
            
            // Ensure calculator is ready before proceeding
            await this.waitForCalculatorReady().catch(err => {
                console.warn('Calculator not ready, continuing anyway:', err);
            });
            
            // Ensure admin dashboard is initialized
            if (!this.adminDashboard) {
                console.log('⏳ Initializing admin dashboard...');
                await this.initAdminDashboard();
            } else {
                console.log('✅ Using existing admin dashboard instance');
                // Early break for Copper CRM environment
                const isCopper = typeof window.Copper !== 'undefined';
                console.log('🔍 Copper CRM environment detected:', isCopper);
                if (isCopper) {
                    console.log('💻 Copper CRM: opening custom modal');
                    this.createAdminModal();
                    return;
                }
            }
            
            // Determine environment: prefer custom modal in Copper CRM environment
                const inCopper = typeof window.Copper !== 'undefined';
                console.log('🔍 Copper CRM environment detected:', inCopper);
                if (!inCopper && typeof window.openAdminModal === 'function') {
                    console.log('💻 Using global openAdminModal function');
                    window.openAdminModal();
                    console.log('✅ Full dashboard modal opened via global function');
                } else if (this.adminDashboard && typeof this.adminDashboard.renderInContainer === 'function') {
                    console.log('💻 Using fallback custom modal creation');
                    this.createAdminModal();
                    console.log('✅ Full dashboard opened in custom modal');
                } else {
                    console.error('Cannot open admin dashboard: Modal rendering not available');
                    // Try to initialize admin dashboard one more time
                    if (typeof AdminDashboard === 'function') {
                        console.log('🔄 Attempting to reinitialize admin dashboard...');
                        this.adminDashboard = new AdminDashboard({
                            calculator: window.calculator || this.calculator,
                            adminManager: this
                        });
                        await this.adminDashboard.init();
                        this.createAdminModal();
                        console.log('✅ Admin dashboard reinitialized and opened in modal');
                    } else {
                        alert('Admin dashboard modal functionality not available. Please check console for details.');
                    }
                }

        } catch (error) {
            console.error('AdminManager: Error opening full dashboard:', error);
            alert('Error opening dashboard: ' + error.message);
        }
    }

    /**
     * Show admin button in the interface
     */
    showAdminButton() {
        // This method ensures the admin button is visible
        // The actual button creation is handled by initAdminButton()
        console.log('🔘 Admin button visibility ensured');
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
            closeButton.addEventListener('click', () => {
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
                        console.log('🚪 Full dashboard logout button clicked');
                        this.logout();
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
window.AdminManager = AdminManager;

// Register the class globally for use by other modules
if (typeof window !== 'undefined') {
    console.log('AdminManager class registered globally');
    window.AdminManager = AdminManager;
}

console.log('✅ AdminManager loaded and ready');