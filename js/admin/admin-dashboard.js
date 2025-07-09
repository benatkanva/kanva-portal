/**
 * Admin Dashboard
 * Handles the admin dashboard UI and functionality
 * Fixed version that addresses all the structural issues
 */

// Wrap in IIFE to avoid polluting global scope
(function() {
    'use strict';

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
            
            // Bind methods to prevent context loss
            this.init = this.init.bind(this);
            this.show = this.show.bind(this);
            this.hide = this.hide.bind(this);
            this.toggle = this.toggle.bind(this);
            this.switchTab = this.switchTab.bind(this);
            this.loadTabContent = this.loadTabContent.bind(this);
            this.saveChanges = this.saveChanges.bind(this);
            this.handleDashboardClick = this.handleDashboardClick.bind(this);
            
            // State
            this.isInitialized = false;
            this.isVisible = false;
            this.dashboard = null;
            this.currentTab = 'products';
            
            // Data storage
            this.products = [];
            this.tiers = [];
            this.shipping = { zones: [] };
            this.savedGitConfig = null;
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
                this.loadSavedCredentials();
                
                this.isInitialized = true;
                console.log('AdminDashboard initialized successfully');
                return true;
            } catch (error) {
                console.error('Failed to initialize AdminDashboard:', error);
                throw error;
            }
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
            dashboard.className = 'admin-dashboard'; // Add base class
            // Remove inline display:none as we're using CSS classes for visibility
            
            dashboard.innerHTML = `
                <div class="admin-dashboard-overlay"></div>
                <div class="admin-dashboard-content">
                    <div class="admin-dashboard-header">
                        <h3><i class="fas fa-cogs"></i> Kanva Admin Dashboard</h3>
                        <button class="btn btn-sm btn-close" id="closeAdminDashboard" title="Close">×</button>
                    </div>
                    <div class="admin-dashboard-body">
                        <div class="admin-tabs">
                            <button class="admin-tab active" data-tab="products">
                                <i class="fas fa-box"></i> Products
                            </button>
                            <button class="admin-tab" data-tab="tiers">
                                <i class="fas fa-layer-group"></i> Tiers
                            </button>
                            <button class="admin-tab" data-tab="shipping">
                                <i class="fas fa-shipping-fast"></i> Shipping
                            </button>
                            <button class="admin-tab" data-tab="integrations">
                                <i class="fas fa-plug"></i> Integrations
                            </button>
                            <button class="admin-tab" data-tab="settings">
                                <i class="fas fa-cog"></i> Settings
                            </button>
                        </div>
                        <div class="admin-tab-content" id="adminTabContent">
                            <div class="text-center py-8">
                                <div class="spinner"></div>
                                <p>Loading...</p>
                            </div>
                        </div>
                    </div>
                    <div class="admin-dashboard-footer">
                        <div class="footer-left">
                            <small class="text-muted">Kanva Botanicals Admin v1.0</small>
                        </div>
                        <div class="footer-right">
                            <button class="btn btn-secondary" id="cancelAdminChanges">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                            <button class="btn btn-primary" id="saveAdminChanges">
                                <i class="fas fa-save"></i> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(dashboard);
            this.dashboard = dashboard;
            
            console.log('Dashboard UI created successfully');
        }
        
        /**
         * Set up event listeners
         */
        setupEventListeners() {
            if (!this.dashboard) {
                console.error('Dashboard element not found');
                return;
            }

            // Use event delegation for all dashboard clicks
            this.dashboard.addEventListener('click', this.handleDashboardClick);
            
            // Handle escape key to close dashboard
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isVisible) {
                    this.hide();
                }
            });
            
            console.log('Event listeners set up successfully');
        }
        
        /**
         * Handle all dashboard click events
         */
        handleDashboardClick(e) {
            const target = e.target;
            
            // Close button or overlay click
            if (target.closest('#closeAdminDashboard') || target.classList.contains('admin-dashboard-overlay')) {
                this.hide();
                return;
            }

            // Tab switching
            const tabBtn = target.closest('.admin-tab');
            if (tabBtn) {
                const tabId = tabBtn.dataset.tab;
                this.switchTab(tabId);
                return;
            }

            // Save button
            if (target.closest('#saveAdminChanges')) {
                this.saveChanges();
                return;
            }

            // Cancel button
            if (target.closest('#cancelAdminChanges')) {
                this.hide();
                return;
            }

            // GitHub integration buttons
            if (target.closest('#testGithubConnection')) {
                this.testGithubConnection();
                return;
            }

            if (target.closest('#saveGithubSettings')) {
                this.saveGithubSettings();
                return;
            }

            // Toggle GitHub token visibility
            if (target.closest('#toggleGithubToken')) {
                this.togglePasswordVisibility('githubToken');
                return;
            }

            // Copper CRM integration buttons
            if (target.closest('#testCopperConnection')) {
                this.testCopperConnection();
                return;
            }

            if (target.closest('#saveCopperSettings')) {
                this.saveCopperSettings();
                return;
            }

            // Toggle Copper API key visibility
            if (target.closest('#toggleCopperApiKey')) {
                this.togglePasswordVisibility('copperApiKey');
                return;
            }

            // Reset app data
            if (target.closest('#resetAppData')) {
                if (confirm('Are you sure you want to reset all data to defaults? This cannot be undone.')) {
                    this.resetAppData();
                }
                return;
            }
        }
        
        /**
         * Switch between tabs
         * @param {string} tabId - The ID of the tab to switch to
         */
        switchTab(tabId) {
            // Update active tab
            this.dashboard.querySelectorAll('.admin-tab').forEach(tab => {
                tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
            });
            
            // Store current tab
            this.currentTab = tabId;
            
            // Load tab content
            this.loadTabContent(tabId);
        }
        
        /**
         * Load content for a specific tab
         * @param {string} tabId - The ID of the tab to load content for
         */
        loadTabContent(tabId) {
            const contentEl = this.dashboard.querySelector('#adminTabContent');
            if (!contentEl) {
                console.error('Tab content element not found');
                return;
            }
            
            console.log(`Loading content for tab: ${tabId}`);
            
            // Show loading state
            contentEl.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading ${tabId}...</p>
                </div>
            `;
            
            // Render content based on tab
            let content = '';
            
            switch (tabId) {
                case 'products':
                    content = this.renderProductsTab();
                    break;
                case 'tiers':
                    content = this.renderTiersTab();
                    break;
                case 'shipping':
                    content = this.renderShippingTab();
                    break;
                case 'integrations':
                    content = this.renderIntegrationsTab();
                    break;
                case 'settings':
                    content = this.renderSettingsTab();
                    break;
                default:
                    content = '<div class="text-center py-8"><p>Tab content not found</p></div>';
            }
            
            // Update content
            contentEl.innerHTML = content;
            
            // Apply saved credentials if on integrations tab
            if (tabId === 'integrations') {
                setTimeout(() => {
                    this.applySavedCredentials();
                }, 100);
            }
        }
        
        /**
         * Render the Products tab content
         */
        renderProductsTab() {
            return `
                <div class="admin-section">
                    <div class="section-header">
                        <h4><i class="fas fa-box"></i> Product Catalog</h4>
                        <button class="btn btn-sm btn-primary" id="addProductBtn">
                            <i class="fas fa-plus"></i> Add Product
                        </button>
                    </div>
                    
                    <div class="products-grid">
                        ${this.products.length > 0 ? this.products.map(product => `
                            <div class="product-card" data-product-id="${product.id}">
                                <div class="product-header">
                                    <h5>${product.name || 'Unnamed Product'}</h5>
                                    <span class="product-status ${product.active ? 'active' : 'inactive'}">
                                        ${product.active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div class="product-details">
                                    <p><strong>Category:</strong> ${product.category || 'N/A'}</p>
                                    <p><strong>Base Price:</strong> $${(product.basePrice || 0).toFixed(2)}</p>
                                    <p><strong>MSRP:</strong> $${(product.msrp || 0).toFixed(2)}</p>
                                </div>
                                <div class="product-actions">
                                    <button class="btn btn-sm btn-outline-primary edit-product" data-id="${product.id}">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger delete-product" data-id="${product.id}">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<div class="empty-state"><i class="fas fa-box-open"></i><p>No products found</p></div>'}
                    </div>
                </div>
            `;
        }
        
        /**
         * Render the Tiers tab content
         */
        renderTiersTab() {
            return `
                <div class="admin-section">
                    <div class="section-header">
                        <h4><i class="fas fa-layer-group"></i> Pricing Tiers</h4>
                        <button class="btn btn-sm btn-primary" id="addTierBtn">
                            <i class="fas fa-plus"></i> Add Tier
                        </button>
                    </div>
                    <p class="section-description">Configure volume discount tiers for wholesale pricing.</p>
                    
                    <div class="tiers-container">
                        ${this.tiers.length > 0 ? this.tiers.map((tier, index) => `
                            <div class="tier-card" data-tier-index="${index}">
                                <div class="tier-header">
                                    <h5>Tier ${index + 1}</h5>
                                    <span class="tier-discount">${(tier.discount * 100).toFixed(0)}% OFF</span>
                                </div>
                                <div class="tier-details">
                                    <p><strong>Min Quantity:</strong> ${tier.minQty}</p>
                                    <p><strong>Max Quantity:</strong> ${tier.maxQty || '∞'}</p>
                                    <p><strong>Discount:</strong> ${(tier.discount * 100).toFixed(1)}%</p>
                                </div>
                                <div class="tier-actions">
                                    <button class="btn btn-sm btn-outline-primary edit-tier" data-index="${index}">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger delete-tier" data-index="${index}">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<div class="empty-state"><i class="fas fa-layer-group"></i><p>No pricing tiers configured</p></div>'}
                    </div>
                </div>
            `;
        }
        
        /**
         * Render the Shipping tab content
         */
        renderShippingTab() {
            return `
                <div class="admin-section">
                    <div class="section-header">
                        <h4><i class="fas fa-shipping-fast"></i> Shipping Configuration</h4>
                        <button class="btn btn-sm btn-primary" id="addShippingZoneBtn">
                            <i class="fas fa-plus"></i> Add Zone
                        </button>
                    </div>
                    <p class="section-description">Configure shipping rates and zones for different regions.</p>
                    
                    <div class="shipping-zones">
                        ${this.shipping.zones && Object.keys(this.shipping.zones).length > 0 
                            ? Object.entries(this.shipping.zones).map(([zoneId, zone]) => `
                                <div class="shipping-zone-card" data-zone-id="${zoneId}">
                                    <div class="zone-header">
                                        <h5>${zone.name}</h5>
                                        <span class="zone-rate">$${(zone.baseRate || 0).toFixed(2)} base</span>
                                    </div>
                                    <div class="zone-details">
                                        <p><strong>Base Rate:</strong> $${(zone.baseRate || 0).toFixed(2)}</p>
                                        <p><strong>Rate per lb:</strong> $${(zone.ratePerPound || 0).toFixed(3)}</p>
                                        <p><strong>States:</strong> ${zone.states ? zone.states.join(', ') : 'None'}</p>
                                    </div>
                                    <div class="zone-actions">
                                        <button class="btn btn-sm btn-outline-primary edit-zone" data-zone-id="${zoneId}">
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger delete-zone" data-zone-id="${zoneId}">
                                            <i class="fas fa-trash"></i> Delete
                                        </button>
                                    </div>
                                </div>
                            `).join('')
                            : '<div class="empty-state"><i class="fas fa-shipping-fast"></i><p>No shipping zones configured</p></div>'
                        }
                    </div>
                </div>
            `;
        }
        
        /**
         * Render the Integrations tab content
         */
        renderIntegrationsTab() {
            const hasGitIntegration = this.savedGitConfig?.token;
            
            return `
                <div class="admin-section">
                    <h4><i class="fas fa-plug"></i> System Integrations</h4>
                    <p class="section-description">Connect external services to enhance functionality.</p>
                    
                    <!-- GitHub Integration -->
                    <div class="integration-card">
                        <div class="integration-header">
                            <div class="integration-title">
                                <i class="fab fa-github"></i>
                                <h5>GitHub Integration</h5>
                            </div>
                            <span class="connection-status ${hasGitIntegration ? 'connected' : 'disconnected'}" id="githubConnectionStatus">
                                <i class="fas ${hasGitIntegration ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                ${hasGitIntegration ? 'Connected' : 'Not Connected'}
                            </span>
                        </div>
                        <p>Save configuration changes directly to your GitHub repository.</p>
                        
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="githubRepo">Repository:</label>
                                <input type="text" class="form-control" id="githubRepo" 
                                       value="benatkanva/kanva-portal" 
                                       placeholder="username/repo">
                                <small class="form-text">Format: username/repository-name</small>
                            </div>
                            <div class="form-group">
                                <label for="githubBranch">Branch:</label>
                                <input type="text" class="form-control" id="githubBranch" 
                                       value="master" 
                                       placeholder="master">
                                <small class="form-text">Default branch to commit to</small>
                            </div>
                            <div class="form-group">
                                <label for="githubToken">Personal Access Token:</label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="githubToken" 
                                           placeholder="github_pat_...">
                                    <button class="btn btn-outline-secondary" type="button" id="toggleGithubToken">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                                <small class="form-text">Create a fine-grained token with 'Contents' read/write access</small>
                            </div>
                        </div>
                        
                        <div class="integration-actions">
                            <button class="btn btn-primary" id="testGithubConnection">
                                <i class="fas fa-plug"></i> Test Connection
                            </button>
                            <button class="btn btn-success" id="saveGithubSettings">
                                <i class="fas fa-save"></i> Save Settings
                            </button>
                        </div>
                        <div id="githubTestResult" class="test-result" style="display: none;"></div>
                    </div>
                    
                    <!-- Copper CRM Integration -->
                    <div class="integration-card">
                        <div class="integration-header">
                            <div class="integration-title">
                                <i class="fas fa-address-book"></i>
                                <h5>Copper CRM Integration</h5>
                            </div>
                            <span class="connection-status disconnected">
                                <i class="fas fa-times-circle"></i> Not Connected
                            </span>
                        </div>
                        <p>Sync customer data and save quotes directly to your CRM.</p>
                        
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="copperApiKey">API Key:</label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="copperApiKey" 
                                           placeholder="Enter your Copper API key">
                                    <button class="btn btn-outline-secondary" type="button" id="toggleCopperApiKey">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                                <small class="form-text">Available in your Copper account settings</small>
                            </div>
                            <div class="form-group">
                                <label for="copperUserEmail">User Email:</label>
                                <input type="email" class="form-control" id="copperUserEmail" 
                                       placeholder="Your Copper login email">
                                <small class="form-text">Email address for your Copper account</small>
                            </div>
                        </div>
                        
                        <div class="integration-actions">
                            <button class="btn btn-primary" id="testCopperConnection">
                                <i class="fas fa-plug"></i> Test Connection
                            </button>
                            <button class="btn btn-success" id="saveCopperSettings">
                                <i class="fas fa-save"></i> Save Settings
                            </button>
                        </div>
                        <div id="copperTestResult" class="test-result" style="display: none;"></div>
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
                    <h4><i class="fas fa-cog"></i> Application Settings</h4>
                    <p class="section-description">Configure general application settings and preferences.</p>
                    
                    <div class="settings-grid">
                        <div class="settings-card">
                            <h5><i class="fas fa-lock"></i> Security</h5>
                            <div class="form-group">
                                <label for="adminPassword">Admin Password:</label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="adminPassword" 
                                           placeholder="Enter new admin password">
                                    <button class="btn btn-outline-secondary" type="button" id="toggleAdminPassword">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                                <small class="form-text">Leave blank to keep current password</small>
                            </div>
                        </div>
                        
                        <div class="settings-card">
                            <h5><i class="fas fa-palette"></i> Appearance</h5>
                            <div class="form-group">
                                <label for="themeMode">Theme Mode:</label>
                                <select class="form-control" id="themeMode">
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="auto">Auto</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="settings-card">
                            <h5><i class="fas fa-globe"></i> Localization</h5>
                            <div class="form-group">
                                <label for="defaultCurrency">Default Currency:</label>
                                <select class="form-control" id="defaultCurrency">
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="CAD">CAD ($)</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="settings-card danger">
                            <h5><i class="fas fa-exclamation-triangle"></i> Danger Zone</h5>
                            <p>These actions cannot be undone. Please be careful.</p>
                            <button class="btn btn-danger" id="resetAppData">
                                <i class="fas fa-exclamation-triangle"></i> Reset All Data to Defaults
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        /**
         * Load data from various sources (GitHub, localStorage, defaults)
         */
        async loadData() {
            try {
                console.log('Loading admin data...');
                
                // Try to load from GitHub first if configured
                if (this.savedGitConfig?.token) {
                    try {
                        const [products, tiers, shipping] = await Promise.all([
                            this.fetchFromGitHub('data/products.json'),
                            this.fetchFromGitHub('data/tiers.json'),
                            this.fetchFromGitHub('data/shipping.json')
                        ]);
                        
                        this.products = products || [];
                        this.tiers = tiers || [];
                        this.shipping = shipping || { zones: [] };
                        
                        this.showNotification('Data loaded from GitHub', 'success');
                        return;
                    } catch (gitError) {
                        console.warn('Failed to load from GitHub, trying local fallback:', gitError);
                    }
                }
                
                // Fallback to default data
                this.loadDefaultData();
                this.showNotification('Using default data', 'info');
                
            } catch (error) {
                console.error('Error loading data:', error);
                this.loadDefaultData();
                this.showNotification('Error loading data, using defaults', 'warning');
            }
        }
        
        /**
         * Load default data structure
         */
        loadDefaultData() {
            this.products = [
                {
                    id: 'focus-flow',
                    name: 'Focus+Flow',
                    category: 'Kava + Kratom',
                    basePrice: 4.50,
                    msrp: 9.99,
                    active: true
                },
                {
                    id: 'release-relax',
                    name: 'Release+Relax',
                    category: 'Kanna + Kava',
                    basePrice: 4.50,
                    msrp: 9.99,
                    active: true
                }
            ];
            
            this.tiers = [
                { minQty: 1, maxQty: 4, discount: 0 },
                { minQty: 5, maxQty: 9, discount: 0.10 },
                { minQty: 10, maxQty: null, discount: 0.15 }
            ];
            
            this.shipping = {
                zones: {
                    'domestic': {
                        name: 'Domestic (US)',
                        baseRate: 8.50,
                        ratePerPound: 0.75,
                        states: ['US']
                    }
                }
            };
        }
        
        /**
         * Fetch data from GitHub repository
         */
        async fetchFromGitHub(filePath) {
            const repo = this.savedGitConfig?.repo || 'benatkanva/kanva-portal';
            const branch = this.savedGitConfig?.branch || 'master';
            const token = this.savedGitConfig?.token;
            
            if (!token) {
                throw new Error('GitHub token is required');
            }
            
            const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`;
            
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            
            const fileData = await response.json();
            const content = atob(fileData.content.replace(/\s/g, ''));
            return JSON.parse(content);
        }
        
        /**
         * Load saved GitHub credentials
         */
        loadSavedCredentials() {
            try {
                const savedConfig = localStorage.getItem('gitConfig');
                if (savedConfig) {
                    this.savedGitConfig = JSON.parse(savedConfig);
                    console.log('Loaded saved GitHub credentials');
                }
            } catch (error) {
                console.error('Error loading saved credentials:', error);
            }
        }
        
        /**
         * Apply saved credentials to form
         */
        applySavedCredentials() {
            if (!this.savedGitConfig) return;
            
            const repoInput = document.getElementById('githubRepo');
            const branchInput = document.getElementById('githubBranch');
            const tokenInput = document.getElementById('githubToken');
            
            if (repoInput) repoInput.value = this.savedGitConfig.repo || '';
            if (branchInput) branchInput.value = this.savedGitConfig.branch || 'master';
            if (tokenInput && this.savedGitConfig.token) {
                tokenInput.value = '••••••••••••••••';
                tokenInput.dataset.originalValue = this.savedGitConfig.token;
            }
        }
        
        /**
         * Test GitHub connection
         */
        async testGithubConnection() {
            const repo = document.getElementById('githubRepo')?.value.trim();
            const token = document.getElementById('githubToken')?.value.trim();
            
            if (!repo || !token) {
                this.showNotification('Please enter repository and token', 'error');
                return false;
            }
            
            const resultEl = document.getElementById('githubTestResult');
            if (resultEl) {
                resultEl.innerHTML = '<div class="alert alert-info"><i class="fas fa-spinner fa-spin"></i> Testing connection...</div>';
                resultEl.style.display = 'block';
            }
            
            try {
                const response = await fetch(`https://api.github.com/repos/${repo}`, {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (resultEl) {
                    resultEl.innerHTML = `
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle"></i> Successfully connected to ${data.full_name}
                        </div>
                    `;
                }
                
                // Update status badge
                const statusBadge = document.getElementById('githubConnectionStatus');
                if (statusBadge) {
                    statusBadge.className = 'connection-status connected';
                    statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Connected';
                }
                
                this.showNotification('GitHub connection successful', 'success');
                return true;
                
            } catch (error) {
                if (resultEl) {
                    resultEl.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle"></i> Connection failed: ${error.message}
                        </div>
                    `;
                }
                
                this.showNotification(`GitHub connection failed: ${error.message}`, 'error');
                return false;
            }
        }
        
        /**
         * Save GitHub settings
         */
        async saveGithubSettings() {
            const repo = document.getElementById('githubRepo')?.value.trim();
            const branch = document.getElementById('githubBranch')?.value.trim() || 'master';
            const tokenInput = document.getElementById('githubToken');
            const token = tokenInput?.dataset.originalValue || tokenInput?.value.trim();
            
            if (!repo || !token) {
                this.showNotification('Please enter repository and token', 'error');
                return false;
            }
            
            try {
                // Test connection first
                const isConnected = await this.testGithubConnection();
                if (!isConnected) {
                    this.showNotification('Connection test failed. Settings not saved.', 'error');
                    return false;
                }
                
                // Save to localStorage
                const gitConfig = { repo, branch, token };
                localStorage.setItem('gitConfig', JSON.stringify(gitConfig));
                this.savedGitConfig = gitConfig;
                
                this.showNotification('GitHub settings saved successfully', 'success');
                return true;
                
            } catch (error) {
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
                resultEl.innerHTML = '<div class="alert alert-info"><i class="fas fa-spinner fa-spin"></i> Testing connection...</div>';
                resultEl.style.display = 'block';
            }
            
            try {
                const response = await fetch('https://api.copper.com/developer_api/v1/account', {
                    headers: {
                        'X-PW-AccessToken': apiKey,
                        'X-PW-Application': 'developer_api',
                        'X-PW-UserEmail': userEmail,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (resultEl) {
                    resultEl.innerHTML = `
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle"></i> Successfully connected to ${data.name}
                        </div>
                    `;
                }
                
                this.showNotification('Copper CRM connection successful', 'success');
                return true;
                
            } catch (error) {
                if (resultEl) {
                    resultEl.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle"></i> Connection failed: ${error.message}
                        </div>
                    `;
                }
                
                this.showNotification(`Copper connection failed: ${error.message}`, 'error');
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
                    this.showNotification('Connection test failed. Settings not saved.', 'error');
                    return false;
                }
                
                // Save to localStorage
                localStorage.setItem('copperApiKey', apiKey);
                localStorage.setItem('copperUserEmail', userEmail);
                
                this.showNotification('Copper CRM settings saved successfully', 'success');
                return true;
                
            } catch (error) {
                this.showNotification(`Error saving Copper settings: ${error.message}`, 'error');
                return false;
            }
        }
        
        /**
         * Toggle password field visibility
         */
        togglePasswordVisibility(inputId) {
            const input = document.getElementById(inputId);
            const button = document.querySelector(`#toggle${inputId.charAt(0).toUpperCase() + inputId.slice(1)}`);
            const icon = button?.querySelector('i');
            
            if (input && icon) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            }
        }
        
        /**
         * Save all changes
         */
        async saveChanges() {
            try {
                const saveBtn = document.getElementById('saveAdminChanges');
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                }
                
                // Collect and save data based on current tab
                switch (this.currentTab) {
                    case 'integrations':
                        await this.saveIntegrationSettings();
                        break;
                    case 'settings':
                        await this.saveAppSettings();
                        break;
                    default:
                        this.showNotification('Saving changes...', 'info');
                        // Add specific save logic for other tabs
                        break;
                }
                
                this.showNotification('Changes saved successfully', 'success');
                
            } catch (error) {
                console.error('Error saving changes:', error);
                this.showNotification(`Error saving changes: ${error.message}`, 'error');
            } finally {
                const saveBtn = document.getElementById('saveAdminChanges');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
                }
            }
        }
        
        /**
         * Save integration settings
         */
        async saveIntegrationSettings() {
            // This will be called by the individual save buttons
            console.log('Integration settings saved via individual buttons');
        }
        
        /**
         * Save app settings
         */
        async saveAppSettings() {
            const adminPassword = document.getElementById('adminPassword')?.value.trim();
            const themeMode = document.getElementById('themeMode')?.value;
            const defaultCurrency = document.getElementById('defaultCurrency')?.value;
            
            const settings = {
                adminPassword: adminPassword || undefined,
                themeMode,
                defaultCurrency,
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem('kanvaSettings', JSON.stringify(settings));
            
            // Update admin manager if password changed
            if (adminPassword && this.adminManager) {
                this.adminManager.adminPassword = adminPassword;
            }
        }
        
        /**
         * Reset app data to defaults
         */
        async resetAppData() {
            try {
                // Clear localStorage
                const keys = Object.keys(localStorage).filter(key => 
                    key.startsWith('kanva') || key.startsWith('git') || key.startsWith('copper')
                );
                keys.forEach(key => localStorage.removeItem(key));
                
                // Reset data to defaults
                this.loadDefaultData();
                this.savedGitConfig = null;
                
                // Refresh current tab
                this.loadTabContent(this.currentTab);
                
                this.showNotification('All data reset to defaults', 'success');
                
            } catch (error) {
                console.error('Error resetting data:', error);
                this.showNotification(`Error resetting data: ${error.message}`, 'error');
            }
        }
        
        /**
         * Show notification to user
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
            }, 5000);
            
            // Close button handler
            const closeBtn = notification.querySelector('.notification-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => notification.remove());
            }
        }
        
        /**
         * Get notification icon class
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
                console.warn('AdminDashboard not initialized. Initializing now...');
                this.init().then(() => this.show());
                return;
            }
            
            if (!this.dashboard) {
                console.error('Dashboard element not found');
                return;
            }
            
            // Add visible class for smooth transition
            this.dashboard.classList.add('visible');
            this.isVisible = true;
            document.body.style.overflow = 'hidden';
            
            // Load the first tab
            this.switchTab(this.currentTab || 'products');
            
            console.log('Admin dashboard shown');
        }
        
        /**
         * Hide the admin dashboard
         */
        hide() {
            if (!this.dashboard) return;
            
            // Remove visible class for smooth transition
            this.dashboard.classList.remove('visible');
            this.isVisible = false;
            document.body.style.overflow = '';
            
            console.log('Admin dashboard hidden');
        }
        
        /**
         * Toggle dashboard visibility
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
        console.log('AdminDashboard class registered globally');
    }
    
    // Export for module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AdminDashboard;
    }

})();