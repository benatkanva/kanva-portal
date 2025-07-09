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
     * Initialize the admin button in the UI - FIXED VERSION
     */
    initAdminButton() {
        try {
            console.log('Admin button initialized');
            
            // Look for the existing header button first
            const adminToggle = document.getElementById('adminToggle');
            if (adminToggle) {
                console.log('✅ Found admin toggle button in header');
                
                // Remove any existing event listeners to prevent duplicates
                adminToggle.removeEventListener('click', this.handleAdminButtonClick);
                
                // Add our click handler
                adminToggle.addEventListener('click', this.handleAdminButtonClick.bind(this));
                
                console.log('✅ Admin button click handler attached');
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
        console.log('🔐 Admin button clicked!');
        e.preventDefault();
        e.stopPropagation();
        
        try {
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
     * Toggle the admin panel visibility - FIXED VERSION
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
            
            // Check if panel already exists
            const existingPanel = document.getElementById('adminPanel');
            if (existingPanel && existingPanel.style.display === 'block') {
                console.log('🔽 Hiding admin panel');
                this.hideAdminPanel();
                return;
            }
            
            console.log('🔼 Showing admin panel');
            this.showAdminPanel();
            
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
        console.log('✅ Admin panel created and shown');
    }

    /**
     * Hide admin panel
     */
    hideAdminPanel() {
        const panel = document.getElementById('adminPanel');
        if (panel) {
            panel.remove();
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
            if (typeof AdminDashboard !== 'undefined') {
                this.adminDashboard = new AdminDashboard();
                await this.adminDashboard.init();
                console.log('Admin dashboard initialized successfully');
            } else {
                console.warn('AdminDashboard class not available');
            }
        } catch (error) {
            console.error('Error initializing admin dashboard:', error);
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
     * Open full admin dashboard
     */
    openFullDashboard() {
        try {
            console.log('🚀 Opening full dashboard...');
            
            if (this.adminDashboard && typeof this.adminDashboard.show === 'function') {
                this.hideAdminPanel();
                this.adminDashboard.show();
                console.log('✅ Full dashboard opened');
            } else {
                console.log('📄 Redirecting to admin.html...');
                // Fallback to admin.html page
                window.open('admin.html', '_blank');
            }
        } catch (error) {
            console.error('AdminManager: Error opening full dashboard:', error);
            alert('Error opening dashboard. Please check console for details.');
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