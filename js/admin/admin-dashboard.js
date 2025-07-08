/**
 * Admin Dashboard
 * Handles the admin dashboard UI and functionality
 */

class AdminDashboard {
    /**
     * Initialize the admin dashboard
     * @param {Object} options - Configuration options
     * @param {KanvaCalculator} options.calculator - The main calculator instance
     * @param {AdminManager} options.adminManager - The admin manager instance
     */
    constructor({ calculator, adminManager } = {}) {
        if (!calculator) {
            console.error('AdminDashboard: Calculator instance is required');
            throw new Error('Calculator instance is required');
        }

        this.calculator = calculator;
        this.adminManager = adminManager;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);
        this.toggle = this.toggle.bind(this);
        
        // State
        this.isInitialized = false;
        this.isVisible = false;
    }
    
    /**
     * Initialize the admin dashboard
     */
    async init() {
        if (this.isInitialized) {
            console.warn('AdminDashboard already initialized');
            return true;
        }

        console.log('Initializing AdminDashboard...');

        try {
            // Create the dashboard UI
            this.createUI();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadData();
            
            // Load saved credentials
            if (this.dashboard) {
                await this.loadSavedCredentials();
            } else {
                console.warn('Dashboard element not found for loading saved credentials');
            }
            
            this.isInitialized = true;
            console.log('AdminDashboard initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize AdminDashboard:', error);
            throw error;
        }
    }
    
    /**
     * Load saved GitHub credentials from localStorage and environment variables
     * @returns {boolean} True if credentials were loaded successfully
     */
    loadSavedCredentials() {
        try {
            console.log('Loading saved credentials...');
            
            // Try to load from localStorage first
            const savedGitConfig = localStorage.getItem('gitConfig');
            let gitConfig = null;
            
            if (savedGitConfig) {
                try {
                    gitConfig = JSON.parse(savedGitConfig);
                    console.log('Loaded GitHub config from localStorage:', {
                        ...gitConfig,
                        token: gitConfig.token ? '***' + gitConfig.token.slice(-4) : 'none'
                    });
                } catch (e) {
                    console.error('Error parsing saved GitHub config:', e);
                }
            }
            
            // If no saved config, try to get from environment
            if (!gitConfig && window.DataManager) {
                const dataManager = this.adminManager?.dataManager || new DataManager();
                if (dataManager.hasGitIntegration()) {
                    gitConfig = dataManager.gitConfig;
                    console.log('Using GitHub config from environment');
                }
            }
            
            // Update form fields when integrations tab is loaded
            this.savedGitConfig = gitConfig; // Store for later use
            
            return !!gitConfig;
            
        } catch (error) {
            console.error('Error loading saved credentials:', error);
            return false;
        }
    }
    
    /**
     * Apply saved credentials to the integrations form
     */
    applySavedCredentials() {
        if (!this.savedGitConfig) return;
        
        const githubForm = this.dashboard?.querySelector('#githubIntegrationForm');
        if (!githubForm) {
            // Try to find form elements directly
            const repoInput = document.getElementById('githubRepo');
            const tokenInput = document.getElementById('githubToken');
            const branchInput = document.getElementById('githubBranch');
            const statusBadge = document.getElementById('githubConnectionStatus');
            
            if (repoInput) repoInput.value = this.savedGitConfig.repo || '';
            if (tokenInput) {
                // Don't show the actual token, but mark that we have one
                tokenInput.value = this.savedGitConfig.token ? '••••••••••••••••' : '';
                tokenInput.dataset.originalValue = this.savedGitConfig.token || '';
            }
            if (branchInput) branchInput.value = this.savedGitConfig.branch || 'master';
            
            // Update connection status
            if (statusBadge) {
                statusBadge.innerHTML = `
                    <span class="badge bg-success">
                        <i class="fas fa-check-circle"></i> Connected
                    </span>
                `;
            }
            
            console.log('Applied saved credentials to form');
            return true;
        }
        
        return false;
    }
    
    /**
     * Create the dashboard UI
     */
    createUI() {
        // Remove existing dashboard if it exists
        const existingDashboard = document.getElementById('adminDashboard');
        if (existingDashboard) {
            existingDashboard.remove();
        }
        
        // Create dashboard container
        const dashboard = document.createElement('div');
        dashboard.id = 'adminDashboard';
        dashboard.className = 'admin-dashboard';
        dashboard.style.display = 'none';
        
        dashboard.innerHTML = `
            <div class="admin-dashboard-overlay"></div>
            <div class="admin-dashboard-content">
                <div class="admin-dashboard-header">
                    <h3>Admin Dashboard</h3>
                    <button class="btn btn-sm btn-close" id="closeAdminDashboard">×</button>
                </div>
                <div class="admin-dashboard-body">
                    <div class="admin-tabs">
                        <button class="admin-tab active" data-tab="products">Products</button>
                        <button class="admin-tab" data-tab="tiers">Tiers</button>
                        <button class="admin-tab" data-tab="shipping">Shipping</button>
                        <button class="admin-tab" data-tab="integrations">Integrations</button>
                        <button class="admin-tab" data-tab="settings">Settings</button>
                    </div>
                    <div class="admin-tab-content">
                        <!-- Tab content will be loaded here -->
                        <div class="text-center py-8">
                            <div class="spinner"></div>
                            <p>Loading...</p>
                        </div>
                    </div>
                </div>
                <div class="admin-dashboard-footer">
                    <button class="btn btn-secondary" id="cancelAdminChanges">Cancel</button>
                    <button class="btn btn-primary" id="saveAdminChanges">Save Changes</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dashboard);
        this.dashboard = dashboard;
        
        console.log('Dashboard created successfully:', this.dashboard);
    }
    
    /**
     * Load data for the dashboard
     */
    async loadData() {
        try {
            // Load data using the data manager if available
            if (this.adminManager.dataManager && typeof this.adminManager.dataManager.getData === 'function') {
                this.products = await this.adminManager.dataManager.getData('products');
                this.tiers = await this.adminManager.dataManager.getData('tiers');
                this.shipping = await this.adminManager.dataManager.getData('shipping');
            } else {
                // Fallback to direct fetch if data manager is not available
                const [productsRes, tiersRes, shippingRes] = await Promise.all([
                    fetch('data/products.json').then(res => res.json()),
                    fetch('data/tiers.json').then(res => res.json()),
                    fetch('data/shipping.json').then(res => res.json())
                ]);
                
                this.products = productsRes;
                this.tiers = tiersRes;
                this.shipping = shippingRes;
            }
            
            return true;
        } catch (error) {
            console.error('Error loading admin data:', error);
            throw error;
        }
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        if (!this.dashboard) {
            console.error('Dashboard element not found');
            return;
        }

        // Bind methods
        this.testGithubConnection = this.testGithubConnection.bind(this);
        this.saveGithubSettings = this.saveGithubSettings.bind(this);
        this.testCopperConnection = this.testCopperConnection.bind(this);
        this.saveCopperSettings = this.saveCopperSettings.bind(this);

        // Remove any existing event listeners to prevent duplicates
        this.dashboard.removeEventListener('click', this.handleDashboardClick);
        
        // Create bound event handler
        this.handleDashboardClick = this.handleDashboardClick.bind(this);
        
        // Use event delegation for all dashboard clicks
        this.dashboard.addEventListener('click', this.handleDashboardClick);
        
        console.log('Event listeners set up successfully');
    }
    
    /**
     * Handle all dashboard click events
     */
    handleDashboardClick(e) {
        console.log('Dashboard click detected:', e.target);
        
        // Close button
        if (e.target.closest('#closeAdminDashboard') || e.target === this.dashboard.querySelector('.admin-dashboard-overlay')) {
            this.hide();
            return;
        }

        // Tab switching
        const tabBtn = e.target.closest('.admin-tab');
        if (tabBtn) {
            const tabId = tabBtn.dataset.tab;
            this.switchTab(tabId);
            return;
        }

        // Save button
        if (e.target.closest('#saveAdminChanges')) {
            console.log('Save Changes clicked');
            this.saveChanges();
            return;
        }

        // Cancel button
        if (e.target.closest('#cancelAdminChanges')) {
            if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                this.hide();
            }
            return;
        }

        // Toggle password visibility
        if (e.target.closest('#togglePassword')) {
            const passwordInput = document.getElementById('adminPassword');
            if (passwordInput) {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                const icon = e.target.closest('button')?.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-eye');
                    icon.classList.toggle('fa-eye-slash');
                }
            }
            return;
        }

        // Reset app data
        if (e.target.closest('#resetAppData')) {
            if (confirm('Are you sure you want to reset all data to defaults? This cannot be undone.')) {
                this.resetAppData();
            }
            return;
        }

        // GitHub integration buttons
        if (e.target.closest('#testGithubConnection')) {
            this.testGithubConnection();
            return;
        }

        if (e.target.closest('#saveGithubSettings')) {
            this.saveGithubSettings();
            return;
        }

        // Toggle GitHub token visibility
        if (e.target.closest('#toggleGithubToken')) {
            const tokenInput = document.getElementById('githubToken');
            const icon = e.target.closest('button')?.querySelector('i');
            if (tokenInput && icon) {
                tokenInput.type = tokenInput.type === 'password' ? 'text' : 'password';
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
            return;
        }

        // Toggle Copper API key visibility
        if (e.target.closest('#toggleCopperApiKey')) {
            const apiKeyInput = document.getElementById('copperApiKey');
            const icon = e.target.closest('button')?.querySelector('i');
            if (apiKeyInput && icon) {
                apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
            return;
        }

        // Copper CRM integration buttons
        if (e.target.closest('#testCopperConnection')) {
            this.testCopperConnection();
            return;
        }

        if (e.target.closest('#saveCopperSettings')) {
            this.saveCopperSettings();
            return;
        }
    }
    
    /**
     * Switch between tabs
     * @param {string} tabId - The ID of the tab to switch to
     */
    switchTab(tabId) {
        // Update active tab
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
        });
        
        // Load tab content
        this.loadTabContent(tabId);
    }
    
    /**
     * Load content for a specific tab
     * @param {string} tabId - The ID of the tab to load content for
     */
    async loadTabContent(tabId) {
        const contentEl = document.querySelector('.admin-tab-content');
        if (!contentEl) return;
        
        // Show loading state
        contentEl.innerHTML = `
            <div class="text-center py-8">
                <div class="spinner"></div>
                <p>Loading ${tabId}...</p>
            </div>
        `;
        
        try {
            let html = '';
            
            switch (tabId) {
                case 'products':
                    html = this.renderProductsTab();
                    break;
                case 'tiers':
                    html = this.renderTiersTab();
                    break;
                case 'shipping':
                    html = this.renderShippingTab();
                    break;
                case 'integrations':
                    html = this.renderIntegrationsTab();
                    break;
                case 'settings':
                    html = this.renderSettingsTab();
                    break;
                default:
                    html = '<p>Tab not found</p>';
            }
            
            contentEl.innerHTML = html;
            
            // Apply saved credentials if we're on the integrations tab
            if (tabId === 'integrations') {
                setTimeout(() => {
                    this.applySavedCredentials();
                }, 100);
            }
            
        } catch (error) {
            console.error(`Error loading tab ${tabId}:`, error);
            contentEl.innerHTML = `
                <div class="alert alert-danger">
                    <h4>Error loading ${tabId}</h4>
                    <p>${error.message || 'An unknown error occurred'}</p>
                </div>
            `;
        }
    }
    
    /**
     * Render the Products tab content
     */
    renderProductsTab() {
        if (!this.products || !this.products.length) {
            return '<p>No products found</p>';
        }
        
        return `
            <div class="admin-section">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4>Product Catalog</h4>
                    <button class="btn btn-sm btn-primary" id="addProductBtn">
                        <i class="fas fa-plus"></i> Add Product
                    </button>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Base Price</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.products.map(product => `
                                <tr>
                                    <td>${product.id}</td>
                                    <td>${product.name}</td>
                                    <td>${product.category || 'N/A'}</td>
                                    <td>$${product.basePrice?.toFixed(2) || '0.00'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary edit-product" data-id="${product.id}">
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger delete-product" data-id="${product.id}">
                                            <i class="fas fa-trash"></i> Delete
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    /**
     * Render the Tiers tab content
     */
    renderTiersTab() {
        if (!this.tiers || !this.tiers.length) {
            return '<p>No tiers found</p>';
        }
        
        return `
            <div class="admin-section">
                <h4>Pricing Tiers</h4>
                <p>Configure pricing tiers for volume discounts.</p>
                
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Min Qty</th>
                                <th>Max Qty</th>
                                <th>Discount %</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.tiers.map((tier, index) => `
                                <tr>
                                    <td>${tier.minQty}</td>
                                    <td>${tier.maxQty || '∞'}</td>
                                    <td>${tier.discount * 100}%</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary edit-tier" data-index="${index}">
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    /**
     * Render the Shipping tab content
     */
    renderShippingTab() {
        if (!this.shipping || !this.shipping.zones) {
            return '<p>No shipping data found</p>';
        }
        
        return `
            <div class="admin-section">
                <h4>Shipping Zones</h4>
                <p>Configure shipping rates by zone.</p>
                
                <div class="shipping-zones">
                    ${Object.entries(this.shipping.zones || {}).map(([zoneId, zone]) => `
                        <div class="card mb-3">
                            <div class="card-header">
                                <h5>${zone.name}</h5>
                            </div>
                            <div class="card-body">
                                <div class="form-group">
                                    <label>Base Rate ($)</label>
                                    <input type="number" class="form-control" value="${zone.baseRate || '0.00'}" step="0.01" min="0">
                                </div>
                                <div class="form-group">
                                    <label>Rate per lb ($)</label>
                                    <input type="number" class="form-control" value="${zone.ratePerPound || '0.00'}" step="0.001" min="0">
                                </div>
                                <div class="form-group">
                                    <label>States (comma-separated)</label>
                                    <input type="text" class="form-control" value="${zone.states ? zone.states.join(', ') : ''}">
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Test GitHub connection
     */
    async testGithubConnection() {
        const repo = document.getElementById('githubRepo')?.value.trim();
        const branch = document.getElementById('githubBranch')?.value.trim() || 'master';
        const token = document.getElementById('githubToken')?.value.trim();
        
        if (!repo || !token) {
            this.showNotification('Please enter repository and token', 'error');
            return false;
        }
        
        const resultEl = document.getElementById('githubTestResult');
        const statusBadge = document.getElementById('githubConnectionStatus');
        
        if (resultEl) {
            resultEl.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-spinner fa-spin"></i> Testing GitHub connection...
                </div>
            `;
            resultEl.style.display = 'block';
        }
        
        // Update status to connecting
        if (statusBadge) {
            statusBadge.innerHTML = `
                <span class="badge bg-info">
                    <i class="fas fa-spinner fa-spin"></i> Connecting...
                </span>
            `;
        }
        
        try {
            // Test GitHub API connection
            const response = await fetch(`https://api.github.com/repos/${repo}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Update status to connected
            if (statusBadge) {
                statusBadge.innerHTML = `
                    <span class="badge bg-success">
                        <i class="fas fa-check-circle"></i> Connected
                    </span>
                `;
            }
            
            if (resultEl) {
                resultEl.innerHTML = `
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle"></i> Successfully connected to ${data.full_name}<br>
                        <small>Default branch: <strong>${data.default_branch}</strong></small>
                    </div>
                `;
                
                // Auto-update branch field if it's wrong
                const branchInput = document.getElementById('githubBranch');
                if (branchInput && branchInput.value !== data.default_branch) {
                    branchInput.value = data.default_branch;
                    resultEl.innerHTML += `
                        <div class="alert alert-info mt-2">
                            <i class="fas fa-info-circle"></i> Branch updated to repository default: <strong>${data.default_branch}</strong>
                        </div>
                    `;
                }
            }
            
            // Save the connection status
            localStorage.setItem('githubConnectionStatus', 'connected');
            
            return true;
        } catch (error) {
            console.error('GitHub connection test failed:', error);
            
            // Update status to disconnected
            if (statusBadge) {
                statusBadge.innerHTML = `
                    <span class="badge bg-danger">
                        <i class="fas fa-times-circle"></i> Not Connected
                    </span>
                `;
            }
            
            if (resultEl) {
                resultEl.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> Connection failed: ${error.message}
                    </div>
                `;
            }
            
            // Save the connection status
            localStorage.setItem('githubConnectionStatus', 'disconnected');
            
            return false;
        }
    }
    
    /**
     * Save GitHub settings
     */
    async saveGithubSettings() {
        const repo = document.getElementById('githubRepo')?.value.trim();
        const branch = document.getElementById('githubBranch')?.value.trim() || 'master';
        const token = document.getElementById('githubToken')?.value.trim();
        
        if (!repo || !token) {
            this.showNotification('Please enter repository and token', 'error');
            return false;
        }
        
        try {
            // Test connection first
            const isConnected = await this.testGithubConnection();
            
            if (!isConnected) {
                this.showNotification('Failed to verify GitHub connection. Settings not saved.', 'error');
                return false;
            }
            
            // Save settings
            if (this.adminManager?.dataManager) {
                await this.adminManager.dataManager.updateConfig({
                    GITHUB_REPO: repo,
                    GITHUB_BRANCH: branch,
                    GITHUB_TOKEN: token
                });
                
                this.showNotification('GitHub settings saved successfully', 'success');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error saving GitHub settings:', error);
            this.showNotification(`Error saving GitHub settings: ${error.message}`, 'error');
            return false;
        }
    }
    
    /**
     * Test Copper CRM connection
     */
    async testCopperConnection() {
        const apiKey = document.getElementById('copperApiKey')?.value.trim();
        const userEmail = document.getElementById('copperUserEmail')?.value.trim();
        
        if (!apiKey || !userEmail) {
            this.showNotification('Please enter API key and user email', 'error');
            return false;
        }
        
        const resultEl = document.getElementById('copperTestResult');
        if (resultEl) {
            resultEl.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-spinner fa-spin"></i> Testing Copper CRM connection...
                </div>
            `;
            resultEl.style.display = 'block';
        }
        
        try {
            // Test Copper API connection
            const response = await fetch('https://api.copper.com/developer_api/v1/account', {
                method: 'GET',
                headers: {
                    'X-PW-AccessToken': apiKey,
                    'X-PW-Application': 'developer_api',
                    'X-PW-UserEmail': userEmail,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Copper API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (resultEl) {
                resultEl.innerHTML = `
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle"></i> Successfully connected to ${data.name} (${data.id})
                    </div>
                `;
            }
            
            return true;
        } catch (error) {
            console.error('Copper connection test failed:', error);
            
            if (resultEl) {
                resultEl.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> Connection failed: ${error.message}
                    </div>
                `;
            }
            
            return false;
        }
    }
    
    /**
     * Save Copper CRM settings
     */
    async saveCopperSettings() {
        const apiKey = document.getElementById('copperApiKey')?.value.trim();
        const userEmail = document.getElementById('copperUserEmail')?.value.trim();
        
        if (!apiKey || !userEmail) {
            this.showNotification('Please enter API key and user email', 'error');
            return false;
        }
        
        try {
            // Test connection first
            const isConnected = await this.testCopperConnection();
            
            if (!isConnected) {
                this.showNotification('Failed to verify Copper connection. Settings not saved.', 'error');
                return false;
            }
            
            // Save settings
            if (this.adminManager?.dataManager) {
                await this.adminManager.dataManager.updateConfig({
                    COPPER_API_KEY: apiKey,
                    COPPER_USER_EMAIL: userEmail
                });
                
                this.showNotification('Copper CRM settings saved successfully', 'success');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error saving Copper settings:', error);
            this.showNotification(`Error saving Copper settings: ${error.message}`, 'error');
            return false;
        }
    }
    
    /**
     * Render the Integrations tab content
     */
    renderIntegrationsTab() {
        const hasGitIntegration = this.adminManager?.dataManager?.hasGitIntegration?.();
        const hasCopperIntegration = this.adminManager?.dataManager?.config?.COPPER_API_KEY;
        
        return `
            <div class="admin-section">
                <h4>Integrations</h4>
                
                <!-- GitHub Integration -->
                <div class="integration-card mb-4">
                    <h4><i class="fab fa-github"></i> GitHub Integration</h4>
                    <p>Connect to GitHub to save configuration changes directly to your repository.</p>
                    <div class="form-group">
                        <label>Connection Status:</label>
                        <span id="githubConnectionStatus" class="badge ${hasGitIntegration ? 'bg-success' : 'bg-warning'}">
                            <i class="fas ${hasGitIntegration ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                            ${hasGitIntegration ? 'Connected' : 'Not Connected'}
                        </span>
                    </div>
                    <div class="form-group">
                        <label>Repository:</label>
                        <input type="text" class="form-control" id="githubRepo" 
                               value="${this.adminManager?.dataManager?.gitConfig?.repo || 'benatkanva/kanva-portal'}" 
                               placeholder="username/repo">
                    </div>
                    <div class="form-group">
                        <label>Branch:</label>
                        <input type="text" class="form-control" id="githubBranch" 
                               value="${this.adminManager?.dataManager?.gitConfig?.branch || 'master'}" 
                               placeholder="master">
                        <small class="form-text text-muted">Your repository uses 'master' as the default branch</small>
                    </div>
                    <div class="form-group">
                        <label>Personal Access Token:</label>
                        <div class="input-group">
                            <input type="password" class="form-control" id="githubToken" 
                                   value="${this.adminManager?.dataManager?.gitConfig?.token ? '••••••••••••••••' : ''}" 
                                   placeholder="github_pat_...">
                            <button class="btn btn-outline-secondary" type="button" id="toggleGithubToken">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <small class="form-text text-muted">Create a fine-grained token with 'Contents' read/write access</small>
                    </div>
                    <div class="mt-3">
                        <button class="btn btn-primary me-2" id="testGithubConnection">
                            <i class="fas fa-plug"></i> Test Connection
                        </button>
                        <button class="btn btn-success" id="saveGithubSettings">
                            <i class="fas fa-save"></i> Save Settings
                        </button>
                    </div>
                    <div id="githubTestResult" class="mt-3" style="display: none;"></div>
                </div>
                
                <!-- Copper CRM Integration -->
                <div class="integration-card">
                    <h4><i class="fas fa-address-book"></i> Copper CRM Integration</h4>
                    <p>Connect to Copper CRM to sync customer and order data.</p>
                    <div class="form-group">
                        <label>Connection Status:</label>
                        <span class="badge ${hasCopperIntegration ? 'bg-success' : 'bg-warning'}">
                            ${hasCopperIntegration ? 'Connected' : 'Not Connected'}
                        </span>
                    </div>
                    <div class="form-group">
                        <label>API Key:</label>
                        <div class="input-group">
                            <input type="password" class="form-control" id="copperApiKey" 
                                   value="${this.adminManager?.dataManager?.config?.COPPER_API_KEY ? '••••••••••••••••' : ''}" 
                                   placeholder="Enter your Copper API key">
                            <button class="btn btn-outline-secondary" type="button" id="toggleCopperApiKey">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <small class="form-text text-muted">Get this from your Copper account settings</small>
                    </div>
                    <div class="form-group">
                        <label>User Email:</label>
                        <input type="email" class="form-control" id="copperUserEmail" 
                               value="${this.adminManager?.dataManager?.config?.COPPER_USER_EMAIL || ''}" 
                               placeholder="Your Copper login email">
                    </div>
                    <div class="mt-3">
                        <button class="btn btn-primary me-2" id="testCopperConnection">
                            <i class="fas fa-plug"></i> Test Connection
                        </button>
                        <button class="btn btn-success" id="saveCopperSettings">
                            <i class="fas fa-save"></i> Save Settings
                        </button>
                    </div>
                    <div id="copperTestResult" class="mt-3" style="display: none;"></div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render the Settings tab content
     */
    renderSettingsTab() {
        return `
            <div class="admin-section">
                <h4>Application Settings</h4>
                
                <div class="form-group">
                    <label for="adminPassword">Admin Password</label>
                    <div class="input-group">
                        <input type="password" class="form-control" id="adminPassword" 
                               value="${this.adminManager?.adminPassword || ''}">
                        <div class="input-group-append">
                            <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    <small class="form-text text-muted">Leave blank to keep current password</small>
                </div>
                
                <div class="form-group mt-4">
                    <button class="btn btn-danger" id="resetAppData">
                        <i class="fas fa-exclamation-triangle"></i> Reset All Data to Defaults
                    </button>
                    <p class="text-muted mt-2">Warning: This will reset all products, tiers, and settings to their default values.</p>
                </div>
            </div>
        `;
    }
    
    /**
     * Collect form data from all tabs
     * @returns {Object} Collected form data
     */
    collectFormData() {
        if (!this.dashboard) {
            console.error('Dashboard element not found');
            throw new Error('Dashboard not initialized');
        }
        
        const formData = { 
            products: {}, 
            tiers: {}, 
            shipping: { zones: {}, states: [] }, 
            settings: {},
            integrations: {
                github: {},
                copper: {}
            }
        };
        
        try {
            // Collect products data if the products table exists
            const productsTable = this.dashboard.querySelector('#productsTable');
            if (productsTable) {
                const productRows = productsTable.querySelectorAll('tbody tr');
                productRows.forEach(row => {
                    const id = row.dataset.id;
                    if (id) {
                        formData.products[id] = {
                            name: row.querySelector('[name$="[name]"]')?.value || '',
                            category: row.querySelector('[name$="[category]"]')?.value || '',
                            price: parseFloat(row.querySelector('[name$="[price]"]')?.value) || 0,
                            isActive: row.querySelector('[name$="[isActive]"]')?.checked || false
                        };
                    }
                });
            }

            // Collect tiers data if the tiers table exists
            const tiersTable = this.dashboard.querySelector('#tiersTable');
            if (tiersTable) {
                const tierRows = tiersTable.querySelectorAll('tbody tr');
                tierRows.forEach(row => {
                    const id = row.dataset.id;
                    if (id) {
                        formData.tiers[id] = {
                            name: row.querySelector('[name$="[name]"]')?.value || '',
                            multiplier: parseFloat(row.querySelector('[name$="[multiplier]"]')?.value) || 1,
                            minQuantity: parseInt(row.querySelector('[name$="[minQuantity]"]')?.value) || 0,
                            isActive: row.querySelector('[name$="[isActive]"]')?.checked || false
                        };
                    }
                });
            }

            // Collect shipping data
            const shippingZones = this.dashboard.querySelectorAll('.shipping-zone');
            shippingZones.forEach(zone => {
                const zoneId = zone.dataset.zoneId;
                if (zoneId) {
                    formData.shipping.zones[zoneId] = {
                        name: zone.querySelector('[name^="zone-name"]')?.value || '',
                        countries: (zone.querySelector('[name^="zone-countries"]')?.value || '').split(',').map(s => s.trim()),
                        rates: []
                    };

                    // Collect shipping rates for this zone
                    const rateRows = zone.querySelectorAll('.shipping-rate');
                    rateRows.forEach(rateRow => {
                        formData.shipping.zones[zoneId].rates.push({
                            minOrder: parseFloat(rateRow.querySelector('[name$="-min"]')?.value) || 0,
                            maxOrder: parseFloat(rateRow.querySelector('[name$="-max"]')?.value) || 0,
                            cost: parseFloat(rateRow.querySelector('[name$="-cost"]')?.value) || 0,
                            isFree: rateRow.querySelector('[name$="-free"]')?.checked || false
                        });
                    });
                }
            });

            // Collect settings
            const settingsForm = this.dashboard.querySelector('#settingsForm');
            if (settingsForm) {
                formData.settings = {
                    taxRate: parseFloat(settingsForm.querySelector('[name="tax-rate"]')?.value) || 0,
                    currency: settingsForm.querySelector('[name="currency"]')?.value || 'USD',
                    adminEmail: settingsForm.querySelector('[name="admin-email"]')?.value || ''
                };
            }
            
            // Collect GitHub integration data
            const githubForm = this.dashboard.querySelector('#githubIntegrationForm');
            if (githubForm) {
                formData.integrations.github = {
                    repo: githubForm.querySelector('[name="github_repo"]')?.value || '',
                    branch: githubForm.querySelector('[name="github_branch"]')?.value || 'master',
                    token: githubForm.querySelector('[name="github_token"]')?.value || ''
                };
            }
            
            // Collect Copper CRM integration data
            const copperForm = this.dashboard.querySelector('#copperIntegrationForm');
            if (copperForm) {
                formData.integrations.copper = {
                    apiKey: copperForm.querySelector('[name="copper_api_key"]')?.value || '',
                    userEmail: copperForm.querySelector('[name="copper_user_email"]')?.value || ''
                };
            }

            return formData;
        } catch (error) {
            console.error('Error collecting form data:', error);
            throw new Error(`Failed to collect form data: ${error.message}`);
        }
    }

    /**
     * Save data directly via Git API
     * @param {Object} formData - Data to save
     */
    async saveViaGit(formData) {
        // Check if we have GitHub credentials in the form data
        const githubForm = this.dashboard?.querySelector('#githubIntegrationForm');
        const repo = githubForm?.querySelector('[name="github_repo"]')?.value.trim();
        const token = githubForm?.querySelector('[name="github_token"]')?.value.trim();
        const branch = githubForm?.querySelector('[name="github_branch"]')?.value.trim() || 'master';
        
        // If we have GitHub credentials but no data manager, initialize it
        if (repo && token && (!this.adminManager?.dataManager || !this.adminManager.dataManager.hasGitIntegration?.())) {
            try {
                // Initialize data manager with GitHub credentials
                if (window.DataManager) {
                    this.adminManager = this.adminManager || {};
                    this.adminManager.dataManager = this.adminManager.dataManager || new DataManager();
                    
                    // Configure Git integration
                    this.adminManager.dataManager.configureGit({
                        repo,
                        branch,
                        token,
                        username: 'kanva-admin',
                        email: 'admin@kanva.com'
                    });
                    
                    console.log('Initialized DataManager with GitHub integration');
                } else {
                    throw new Error('DataManager is not available');
                }
            } catch (error) {
                console.error('Failed to initialize Git integration:', error);
                throw new Error('Failed to set up Git integration. Please check your credentials and try again.');
            }
        }
        
        // If we still don't have Git integration, try to use localStorage credentials
        if (!this.adminManager?.dataManager?.hasGitIntegration?.()) {
            const savedGitConfig = localStorage.getItem('gitConfig');
            if (savedGitConfig) {
                try {
                    const gitConfig = JSON.parse(savedGitConfig);
                    if (window.DataManager) {
                        this.adminManager = this.adminManager || {};
                        this.adminManager.dataManager = this.adminManager.dataManager || new DataManager();
                        this.adminManager.dataManager.configureGit(gitConfig);
                        console.log('Initialized DataManager with saved Git configuration');
                    }
                } catch (error) {
                    console.error('Error loading saved Git configuration:', error);
                }
            }
        }
        
        // If we still don't have Git integration, throw an error
        if (!this.adminManager?.dataManager?.hasGitIntegration?.()) {
            throw new Error('Git integration not configured. Please set up Git credentials in the Integrations tab.');
        }

        try {
            // Save products
            if (formData.products) {
                await this.adminManager.dataManager.saveData(formData.products, 'products');
            }
            
            // Save tiers
            if (formData.tiers) {
                await this.adminManager.dataManager.saveData(formData.tiers, 'tiers');
            }
            
            // Save shipping
            if (formData.shipping) {
                await this.adminManager.dataManager.saveData(formData.shipping, 'shipping');
            }
            
            // Save settings
            if (formData.settings) {
                await this.adminManager.dataManager.saveData(formData.settings, 'settings');
            }
            
            console.log('All changes saved via Git');
            
            // Update connection status in UI
            const statusBadge = document.getElementById('githubConnectionStatus');
            if (statusBadge) {
                statusBadge.innerHTML = `
                    <span class="badge bg-success">
                        <i class="fas fa-check-circle"></i> Connected
                    </span>
                `;
            }
            
        } catch (error) {
            console.error('Error saving via Git:', error);
            throw new Error(`Failed to save data: ${error.message}`);
        }
    }
    
    /**
     * Save changes made in the admin dashboard
     */
    async saveChanges() {
        console.log('Save changes called');
        
        try {
            // Show loading state
            const saveBtn = document.getElementById('saveAdminChanges');
            const originalText = saveBtn?.innerHTML || 'Save Changes';
            
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            }
            
            // Collect form data
            console.log('Collecting form data...');
            const formData = this.collectFormData();
            console.log('Form data collected:', formData);
            
            // Save via Git if available, otherwise save locally
            if (this.adminManager?.dataManager?.hasGitIntegration?.()) {
                console.log('Saving via Git...');
                await this.saveViaGit(formData);
            } else {
                console.log('Saving locally...');
                // Fallback to localStorage or local data manager
                if (this.adminManager?.dataManager) {
                    // Use the data manager to save locally
                    await this.adminManager.dataManager.saveData(formData.products, 'products');
                    await this.adminManager.dataManager.saveData(formData.tiers, 'tiers');
                    await this.adminManager.dataManager.saveData(formData.shipping, 'shipping');
                    await this.adminManager.dataManager.saveData(formData.settings, 'settings');
                } else {
                    // Save to localStorage as last resort
                    localStorage.setItem('kanva_products', JSON.stringify(formData.products));
                    localStorage.setItem('kanva_tiers', JSON.stringify(formData.tiers));
                    localStorage.setItem('kanva_shipping', JSON.stringify(formData.shipping));
                    localStorage.setItem('kanva_settings', JSON.stringify(formData.settings));
                }
            }
            
            // Show success message
            this.showNotification('Changes saved successfully', 'success');
            
            // Reload calculator data if needed
            if (this.calculator && typeof this.calculator.loadData === 'function') {
                await this.calculator.loadData();
            }
            
        } catch (error) {
            console.error('Error saving changes:', error);
            this.showNotification(`Error saving changes: ${error.message}`, 'error');
        } finally {
            // Reset button state
            const saveBtn = document.getElementById('saveAdminChanges');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            }
        }
    }
    
    /**
     * Reset all application data to defaults
     */
    async resetAppData() {
        try {
            // Show loading state
            this.showNotification('Resetting data to defaults...', 'info');
            
            // Reset via data manager if available
            if (this.adminManager?.dataManager && typeof this.adminManager.dataManager.resetToDefaults === 'function') {
                await this.adminManager.dataManager.resetToDefaults();
            } else {
                // Clear localStorage
                const keys = Object.keys(localStorage).filter(key => key.startsWith('kanva_'));
                keys.forEach(key => localStorage.removeItem(key));
            }
            
            // Reload data
            await this.loadData();
            
            // Refresh current tab
            const activeTab = document.querySelector('.admin-tab.active');
            if (activeTab) {
                this.switchTab(activeTab.dataset.tab);
            }
            
            this.showNotification('Data reset to defaults successfully', 'success');
            
        } catch (error) {
            console.error('Error resetting data:', error);
            this.showNotification(`Error resetting data: ${error.message}`, 'error');
        }
    }
    
    /**
     * Show a notification to the user
     * @param {string} message - The message to display
     * @param {string} type - The type of notification (success, error, warning, info)
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Auto-remove after delay
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => notification.remove());
        }
    }
    
    /**
     * Get the appropriate icon for a notification type
     * @param {string} type - The notification type
     * @returns {string} The icon class
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        return icons[type] || 'fa-info-circle';
    }
    
    /**
     * Show the admin dashboard
     */
    show() {
        if (!this.isInitialized) {
            console.warn('AdminDashboard not initialized. Call init() first.');
            return;
        }
        
        // Ensure dashboard element exists
        if (!this.dashboard) {
            console.error('Dashboard element not found. Recreating...');
            this.createUI();
        }
        
        if (!this.dashboard) {
            console.error('Failed to create dashboard element');
            return;
        }
        
        this.dashboard.style.display = 'block';
        this.isVisible = true;
        document.body.style.overflow = 'hidden';
        
        // Load the first tab by default
        this.switchTab('products');
    }
    
    /**
     * Hide the admin dashboard
     */
    hide() {
        if (this.dashboard) {
            this.dashboard.style.display = 'none';
            this.isVisible = false;
            document.body.style.overflow = '';
        }
    }
    
    /**
     * Toggle the admin dashboard visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.AdminDashboard = AdminDashboard;
}