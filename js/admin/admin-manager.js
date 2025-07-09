/**
 * Admin Manager
 * Handles admin authentication, dashboard access, and admin functionality
 * 
 * Key Features:
 * - Secure admin authentication with session management
 * - Custom login modal UI
 * - Admin dashboard initialization with calculator readiness checks
 * - Session persistence with 12-hour expiration
 * - Copper CRM integration support
 */
class AdminManager {
    constructor(calculator = null, dataManager = null) {
        // Admin state
        this.isAdmin = false;
        this.isInitialized = false;
        this.adminDashboard = null;
        this.loginModal = null;
        
        // Admin credentials (in production, these should be managed server-side)
        this.adminPassword = 'kanva123'; // Default password
        this.adminEmails = [
            'admin@kanvabotanicals.com',
            'ben@kanvabotanicals.com',
            'joe@kanvabotanicals.com'
        ];
        
        // Handle both object and direct parameter styles
        if (typeof calculator === 'object' && calculator !== null && calculator.calculator) {
            // Called with object: new AdminManager({calculator, dataManager})
            this.calculator = calculator.calculator;
            this.dataManager = calculator.dataManager || null;
        } else {
            // Called with direct parameters: new AdminManager(calculator, dataManager)
            this.calculator = calculator;
            this.dataManager = dataManager;
        }
        
        // Bind all methods to prevent context loss
        this.init = this.init.bind(this);
        this.initAdminButton = this.initAdminButton.bind(this);
        this.toggleAdminPanel = this.toggleAdminPanel.bind(this);
        this.verifyAdminEmail = this.verifyAdminEmail.bind(this);
        this.showLoginPrompt = this.showLoginPrompt.bind(this);
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
        this.checkAdminStatus = this.checkAdminStatus.bind(this);
        this.createLoginModal = this.createLoginModal.bind(this);
        this.showLoginError = this.showLoginError.bind(this);
        this.hideLoginError = this.hideLoginError.bind(this);
        this.showAdminPanel = this.showAdminPanel.bind(this);
        this.hideAdminPanel = this.hideAdminPanel.bind(this);
        this.initAdminDashboard = this.initAdminDashboard.bind(this);
        this.waitForCalculatorReady = this.waitForCalculatorReady.bind(this);
        this.handleAdminLogin = this.handleAdminLogin.bind(this);
        this.showAdminLogin = this.showAdminLogin.bind(this);
        this.hideAdminLogin = this.hideAdminLogin.bind(this);
        this.openFullDashboard = this.openFullDashboard.bind(this);
        this.setupEventListeners = this.setupEventListeners.bind(this);
        this.initAdminUI = this.initAdminUI.bind(this);
        this.showAdminButton = this.showAdminButton.bind(this);
        
        // Initialize admin button if in browser environment
        if (typeof document !== 'undefined') {
            requestAnimationFrame(() => this.initAdminButton());
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
     * Initialize the admin button in the UI
     */
    initAdminButton() {
        try {
            // Use the existing header button
            const adminBtn = document.getElementById('adminToggle');
            if (!adminBtn) {
                console.warn('Admin button not found in header, will create one');
                this.showAdminButton();
                return;
            }
            
            // Set up click handler
            adminBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleAdminPanel();
            });
            
            console.log('Admin button initialized');
        } catch (error) {
            console.error('Error initializing admin button:', error);
        }
    }

    /**
     * Toggle the admin panel visibility
     */
    async toggleAdminPanel() {
        const adminBtn = document.getElementById('adminToggle') || document.getElementById('adminAccessBtn');
        const originalText = adminBtn ? adminBtn.innerHTML : '';
        
        try {
            // Disable button and show loading state
            if (adminBtn) {
                adminBtn.disabled = true;
                adminBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            }
            
            console.log('🔘 Toggling admin panel...');
            
            // Check if already authenticated
            const isAuthenticated = await this.checkAdminStatus();
            console.log('🔐 Authentication status:', isAuthenticated);
            
            if (!isAuthenticated) {
                console.log('🔑 Showing login prompt...');
                // Show login prompt if not authenticated
                const loggedIn = await this.showLoginPrompt();
                if (!loggedIn) {
                    console.log('❌ Login cancelled or failed');
                    return;
                }
                console.log('✅ Login successful');
            }
            
            // Initialize dashboard if needed
            if (!this.adminDashboard) {
                console.log('🔄 Initializing admin dashboard...');
                try {
                    await this.initAdminDashboard();
                    console.log('✅ Admin dashboard initialized');
                } catch (error) {
                    console.error('❌ Failed to initialize admin dashboard:', error);
                    throw new Error(`Failed to initialize admin panel: ${error.message}`);
                }
            }
            
            // Toggle dashboard visibility
            if (this.adminDashboard && typeof this.adminDashboard.show === 'function') {
                if (this.adminDashboard.isVisible) {
                    console.log('👋 Hiding admin panel');
                    this.adminDashboard.hide();
                    console.log('✅ Admin panel hidden');
                } else {
                    console.log('👀 Showing admin panel');
                    this.adminDashboard.show();
                    console.log('✅ Admin panel shown');
                }
            } else {
                throw new Error('Admin dashboard not available or show method missing');
            }
            
        } catch (error) {
            console.error('❌ Error toggling admin panel:', error);
            
            // Show detailed error message
            const errorMessage = `Error accessing admin panel: ${error.message || 'Unknown error'}\n\n` +
                               'Please try the following:\n' +
                               '1. Refresh the page\n' +
                               '2. Clear your browser cache\n' +
                               '3. Check the browser console for more details';
            
            alert(errorMessage);
            
            // Re-throw the error for further handling
            throw error;
            
        } finally {
            // Always re-enable the button and restore its original state
            if (adminBtn) {
                setTimeout(() => {
                    adminBtn.disabled = false;
                    adminBtn.innerHTML = originalText;
                }, 500);
            }
        }
    }

    /**
     * Verify if an email is in the admin whitelist
     * @param {string} email - Email to verify
     * @returns {boolean} True if email is authorized
     */
    verifyAdminEmail(email) {
        if (!email) return false;
        return this.adminEmails.some(adminEmail => 
            adminEmail.toLowerCase() === email.trim().toLowerCase()
        );
    }

    /**
     * Show the login prompt modal
     * @returns {Promise<boolean>} True if login was successful
     */
    async showLoginPrompt() {
        return new Promise((resolve) => {
            try {
                // Create modal if it doesn't exist
                if (!this.loginModal) {
                    this.createLoginModal();
                }
                
                // Show modal
                this.loginModal.style.display = 'flex';
                
                // Focus email input
                const emailInput = this.loginModal.querySelector('#admin-email');
                if (emailInput) {
                    emailInput.focus();
                }
                
                // Handle form submission
                const form = this.loginModal.querySelector('form');
                const onSubmit = async (e) => {
                    e.preventDefault();
                    
                    const email = form.querySelector('#admin-email').value;
                    const password = form.querySelector('#admin-password').value;
                    
                    try {
                        const success = await this.login(email, password);
                        if (success) {
                            this.loginModal.style.display = 'none';
                            form.removeEventListener('submit', onSubmit);
                            resolve(true);
                        }
                    } catch (error) {
                        console.error('Login error:', error);
                        this.showLoginError(error.message || 'Login failed');
                    }
                };
                
                form.addEventListener('submit', onSubmit);
                
                // Handle cancel button
                const cancelBtn = this.loginModal.querySelector('.cancel-btn');
                if (cancelBtn) {
                    const onCancel = () => {
                        this.loginModal.style.display = 'none';
                        form.removeEventListener('submit', onSubmit);
                        cancelBtn.removeEventListener('click', onCancel);
                        resolve(false);
                    };
                    cancelBtn.addEventListener('click', onCancel);
                }
                
            } catch (error) {
                console.error('Error showing login prompt:', error);
                resolve(false);
            }
        });
    }
    
    /**
     * Handle admin login
     * @param {string} email - Admin email
     * @param {string} password - Admin password
     * @returns {Promise<boolean>} True if login was successful
     */
    async login(email, password) {
        try {
            if (!email || !password) {
                throw new Error('Email and password are required');
            }
            
            // Verify email is in admin whitelist
            const isAdminEmail = this.verifyAdminEmail(email);
            if (!isAdminEmail) {
                throw new Error('Access denied. Invalid admin credentials.');
            }
            
            // Verify password (in production, this should be handled server-side)
            if (password !== this.adminPassword) {
                throw new Error('Invalid email or password');
            }
            
            // Create session
            const session = {
                email: email,
                timestamp: new Date().toISOString(),
                expires: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // 12 hours from now
            };
            
            // Store session
            sessionStorage.setItem('kanvaAdminSession', JSON.stringify(session));
            this.isAdmin = true;
            
            console.log(`Admin login successful for ${email}`);
            
            // Initialize dashboard if not already done
            if (!this.adminDashboard) {
                await this.initAdminDashboard();
            }
            
            return true;
            
        } catch (error) {
            console.error('Login failed:', error);
            throw error; // Re-throw to be handled by caller
        }
    }
    
    /**
     * Log out the current admin session
     * @returns {boolean} True if logout was successful
     */
    logout() {
        try {
            // Clear session
            sessionStorage.removeItem('kanvaAdminSession');
            this.isAdmin = false;
            
            // Hide admin dashboard if visible
            if (this.adminDashboard && this.adminDashboard.isVisible) {
                this.adminDashboard.hide();
            }
            
            console.log('Admin logged out successfully');
            return true;
            
        } catch (error) {
            console.error('Error during logout:', error);
            return false;
        }
    }
    
    /**
     * Check if there's a valid admin session
     * @returns {Promise<boolean>} True if a valid admin session exists
     */
    async checkAdminStatus() {
        try {
            const session = sessionStorage.getItem('kanvaAdminSession');
            if (!session) {
                this.isAdmin = false;
                return false;
            }
            
            const { email, expires } = JSON.parse(session);
            const isExpired = new Date(expires) < new Date();
            
            if (isExpired) {
                console.log('Admin session expired');
                sessionStorage.removeItem('kanvaAdminSession');
                this.isAdmin = false;
                return false;
            }
            
            // Verify email is still in admin list
            const isAdminEmail = this.verifyAdminEmail(email);
            this.isAdmin = isAdminEmail;
            
            if (!isAdminEmail) {
                console.warn('Admin email no longer authorized:', email);
                sessionStorage.removeItem('kanvaAdminSession');
                return false;
            }
            
            console.log('Valid admin session found for:', email);
            return true;
            
        } catch (error) {
            console.error('Error checking admin status:', error);
            this.isAdmin = false;
            return false;
        }
    }
    
    /**
     * Initialize the admin dashboard
     * @returns {Promise<boolean>} True if initialization was successful
     */
    async initAdminDashboard() {
        try {
            if (this.adminDashboard) {
                return true; // Already initialized
            }
            
            // Check if AdminDashboard class is available
            if (typeof AdminDashboard === 'undefined') {
                throw new Error('AdminDashboard class not found. Make sure admin-dashboard.js is loaded.');
            }
            
            // Wait for calculator to be ready
            const isReady = await this.waitForCalculatorReady();
            if (!isReady) {
                throw new Error('Calculator is not ready. Please wait and try again.');
            }
            
            // Initialize the admin dashboard
            this.adminDashboard = new AdminDashboard({
                calculator: this.calculator,
                adminManager: this
            });
            
            await this.adminDashboard.init();
            
            // Make dashboard globally available for debugging
            if (window) {
                window.adminDashboard = this.adminDashboard;
            }
            
            console.log('Admin dashboard initialized successfully');
            return true;
            
        } catch (error) {
            console.error('Error initializing admin dashboard:', {
                error: error.toString(),
                message: error.message,
                stack: error.stack,
                hasCalculator: !!this.calculator,
                calculatorReady: this.calculator?.isReady,
                windowCalculator: !!window.calculator,
                windowCalculatorReady: window.calculator?.isReady
            });
            
            if (typeof document !== 'undefined') {
                setTimeout(() => {
                    alert(`Error initializing admin dashboard: ${error.message}\n\nPlease refresh the page and try again.`);
                }, 100);
            }
            
            throw error;
        }
    }
    
    /**
     * Wait for the calculator to be ready
     * @param {number} maxAttempts - Maximum number of attempts (default: 30)
     * @param {number} interval - Interval between attempts in ms (default: 1000)
     * @returns {Promise<boolean>} True when calculator is ready
     */
    waitForCalculatorReady(maxAttempts = 30, interval = 1000) {
        return new Promise((resolve) => {
            let attempts = 0;
            let lastError = null;
            
            const checkReady = () => {
                try {
                    // Check multiple possible calculator references
                    const calculator = this.calculator || window.calculator || (window.app && window.app.calculator);
                    
                    if (calculator && (calculator.isReady || calculator.isReady === undefined)) {
                        console.log('✅ Calculator is ready');
                        this.calculator = calculator; // Update reference
                        resolve(true);
                        return;
                    }
                    
                    attempts++;
                    console.log(`⏳ Waiting for calculator (${attempts}/${maxAttempts}):`, {
                        hasCalculator: !!calculator,
                        isReady: calculator ? calculator.isReady : 'no calculator',
                        calculatorType: calculator ? typeof calculator : 'undefined',
                        windowCalculator: !!window.calculator,
                        windowApp: !!window.app
                    });
                    
                    // Check if we've exceeded max attempts
                    if (attempts >= maxAttempts) {
                        const errorMsg = `Calculator not ready after ${maxAttempts} attempts. Last error: ${lastError || 'No error'}`;
                        console.error(`❌ ${errorMsg}`);
                        console.error('Debug info:', {
                            calculatorExists: !!calculator,
                            calculatorType: calculator ? typeof calculator : 'undefined',
                            calculatorKeys: calculator ? Object.keys(calculator) : [],
                            windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('calc') || k.toLowerCase().includes('kanva')),
                            appState: window.app ? {
                                isInitialized: window.app.isInitialized,
                                modules: window.app.modules ? Object.keys(window.app.modules) : 'no modules'
                            } : 'no app'
                        });
                        resolve(false);
                        return;
                    }
                    
                    // Try again after interval
                    setTimeout(checkReady, interval);
                } catch (error) {
                    lastError = error.message;
                    console.error('Error checking calculator readiness:', error);
                    attempts++;
                    
                    if (attempts >= maxAttempts) {
                        console.error(`❌ Failed to check calculator after ${maxAttempts} attempts`);
                        resolve(false);
                        return;
                    }
                    
                    setTimeout(checkReady, interval);
                }
            };
            
            // Start checking
            checkReady();
        });
    }
    
    /**
     * Initialize admin UI elements
     */
    initAdminUI() {
        // Create admin panel container if it doesn't exist
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
                            <button class="btn btn-block btn-primary mb-2" id="openFullDashboard">
                                <i class="fas fa-cogs"></i> Open Full Dashboard
                            </button>
                            <button class="btn btn-block btn-secondary mb-2" id="adminLogoutBtn">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </div>
                `;
                app.appendChild(adminPanel);
            }
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Use event delegation to handle dynamically created elements
        document.addEventListener('click', (e) => {
            // Close button in panel
            if (e.target.id === 'closeAdminPanel' || e.target.closest('#closeAdminPanel')) {
                this.hideAdminPanel();
            }
            
            // Open full dashboard button
            if (e.target.id === 'openFullDashboard' || e.target.closest('#openFullDashboard')) {
                this.openFullDashboard();
            }
            
            // Logout button
            if (e.target.id === 'adminLogoutBtn' || e.target.closest('#adminLogoutBtn')) {
                this.logout();
            }
        });
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('adminPanel');
            const button = document.getElementById('adminButton') || document.getElementById('adminToggle');
            
            if (panel && panel.style.display === 'block' && 
                !panel.contains(e.target) && 
                button && e.target !== button && 
                !button.contains(e.target)) {
                this.hideAdminPanel();
            }
        });
    }
    
    /**
     * Handle admin login form submission
     */
    async handleAdminLogin() {
        const email = document.getElementById('adminEmail')?.value.trim();
        const password = document.getElementById('adminPasswordInput')?.value.trim();
        
        if (!email || !password) {
            alert('Please enter email and password');
            return;
        }
        
        const success = await this.login(email, password);
        if (success) {
            this.hideAdminLogin();
            this.showAdminPanel();
        }
    }
    
    /**
     * Show admin login form
     */
    showAdminLogin() {
        const loginForm = document.getElementById('adminLoginForm');
        if (loginForm) {
            loginForm.style.display = 'block';
            // Focus password input (email is pre-filled)
            const passwordInput = loginForm.querySelector('#adminPasswordInput');
            if (passwordInput) {
                passwordInput.focus();
            }
        }
    }
    
    /**
     * Hide admin login form
     */
    hideAdminLogin() {
        const loginForm = document.getElementById('adminLoginForm');
        if (loginForm) {
            loginForm.style.display = 'none';
            // Clear password field
            const passwordInput = loginForm.querySelector('#adminPasswordInput');
            if (passwordInput) {
                passwordInput.value = '';
            }
        }
    }
    
    /**
     * Show admin panel
     */
    showAdminPanel() {
        if (!this.isAdmin) {
            this.showAdminLogin();
            return;
        }
        
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.style.display = 'block';
            
            // Focus first button
            const firstButton = adminPanel.querySelector('button:not(#closeAdminPanel)');
            if (firstButton) {
                firstButton.focus();
            }
        }
    }
    
    /**
     * Hide admin panel
     */
    hideAdminPanel() {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.style.display = 'none';
        }
    }
    
    /**
     * Open full dashboard (called from admin panel button)
     */
    async openFullDashboard() {
        try {
            this.hideAdminPanel(); // Hide the simple panel first
            
            // Ensure dashboard is initialized
            if (!this.adminDashboard) {
                await this.initAdminDashboard();
            }
            
            if (this.adminDashboard && typeof this.adminDashboard.show === 'function') {
                this.adminDashboard.show();
            } else {
                console.error('AdminManager: Cannot open dashboard - not properly initialized');
                alert('Dashboard not available. Please refresh the page.');
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
        // Remove existing admin button if present
        const existingBtn = document.getElementById('adminButton');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        // Check if there's already an admin toggle in the header
        const headerToggle = document.getElementById('adminToggle');
        if (headerToggle) {
            // Use the existing button
            headerToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleAdminPanel();
            });
            return;
        }
        
        // Create admin button
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
        adminButton.addEventListener('click', () => {
            this.toggleAdminPanel();
        });
        
        document.body.appendChild(adminButton);
    }
    
    /**
     * Create login modal
     */
    createLoginModal() {
        // Remove existing modal if any
        const existingModal = document.getElementById('adminLoginModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'adminLoginModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        // Modal content
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            width: 90%;
        `;
        
        // Form
        const form = document.createElement('form');
        
        // Title
        const title = document.createElement('h3');
        title.textContent = 'Admin Login';
        title.style.cssText = `
            margin: 0 0 1.5rem 0;
            text-align: center;
            color: #17351A;
        `;
        
        // Email field
        const emailGroup = document.createElement('div');
        emailGroup.style.marginBottom = '1rem';
        const emailLabel = document.createElement('label');
        emailLabel.textContent = 'Email';
        emailLabel.style.cssText = `
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #374151;
        `;
        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.id = 'admin-email';
        emailInput.name = 'email';
        emailInput.required = true;
        emailInput.style.cssText = `
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
            font-size: 14px;
        `;
        
        // Password field
        const passwordGroup = document.createElement('div');
        passwordGroup.style.marginBottom = '1.5rem';
        const passwordLabel = document.createElement('label');
        passwordLabel.textContent = 'Password';
        passwordLabel.style.cssText = `
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #374151;
        `;
        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.id = 'admin-password';
        passwordInput.name = 'password';
        passwordInput.required = true;
        passwordInput.style.cssText = `
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
            font-size: 14px;
        `;
        
        // Error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'login-error';
        errorMsg.style.cssText = `
            color: #e74c3c;
            margin-bottom: 1rem;
            min-height: 1.5rem;
            display: none;
            text-align: center;
            font-size: 14px;
        `;
        
        // Buttons
        const buttonGroup = document.createElement('div');
        buttonGroup.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
        `;
        
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => {
            modal.style.display = 'none';
            form.reset();
            this.hideLoginError();
            if (modal.resolvePromise) modal.resolvePromise(false);
        };
        cancelBtn.style.cssText = `
            padding: 0.5rem 1rem;
            background: #f1f1f1;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `;
        
        const loginBtn = document.createElement('button');
        loginBtn.type = 'submit';
        loginBtn.textContent = 'Login';
        loginBtn.style.cssText = `
            padding: 0.5rem 1.5rem;
            background: #93D500;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `;
        
        // Assemble the form
        emailGroup.appendChild(emailLabel);
        emailGroup.appendChild(emailInput);
        passwordGroup.appendChild(passwordLabel);
        passwordGroup.appendChild(passwordInput);
        
        buttonGroup.appendChild(cancelBtn);
        buttonGroup.appendChild(loginBtn);
        
        form.appendChild(title);
        form.appendChild(emailGroup);
        form.appendChild(passwordGroup);
        form.appendChild(errorMsg);
        form.appendChild(buttonGroup);
        
        content.appendChild(form);
        modal.appendChild(content);
        
        // Add to document
        document.body.appendChild(modal);
        
        // Store references
        this.loginModal = modal;
        this.loginError = errorMsg;
    }
    
    /**
     * Show login error message
     */
    showLoginError(message) {
        if (this.loginError) {
            this.loginError.textContent = message;
            this.loginError.style.display = 'block';
        }
    }
    
    /**
     * Hide login error message
     */
    hideLoginError() {
        if (this.loginError) {
            this.loginError.style.display = 'none';
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.AdminManager = AdminManager;
    console.log('AdminManager class registered globally');
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

console.log('✅ AdminManager loaded and ready');