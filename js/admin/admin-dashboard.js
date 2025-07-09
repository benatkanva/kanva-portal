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
            // Create a minimal calculator instance if not provided
            this.calculator = calculator || {
                dataManager: window.DataManager ? new DataManager() : {
                    getData: () => ({}),
                    saveData: async () => {}
                },
                calculationEngine: window.CalculationEngine ? new CalculationEngine() : {
                    calculate: () => ({})
                },
                getSettings: () => ({}),
                updateSettings: () => {},
                saveSettings: async () => {},
                loadData: async () => {}
            };
            
            console.log('AdminDashboard: Initialized with', this.calculator ? 'calculator' : 'minimal implementation');
            this.adminManager = adminManager;
            
            // Bind methods to prevent context loss
            this.init = this.init.bind(this);
            this.show = this.show.bind(this);
            this.hide = this.hide.bind(this);
            this.toggle = this.toggle.bind(this);
            this.switchTab = this.switchTab.bind(this);
            this.loadTabContent = this.loadTabContent.bind(this);
            this.saveChanges = this.saveChanges.bind(this);
            this.showNotification = this.showNotification.bind(this);
            this.handleDashboardClick = this.handleDashboardClick.bind(this);
            this.renderInContainer = this.renderInContainer.bind(this);
            
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
            
            // Form state
            this.currentProduct = null;
            this.isEditing = false;
            
            // Default product structure
            this.defaultProduct = {
                id: '',
                name: '',
                price: 0,
                msrp: 0,
                unitsPerCase: 0,
                displayBoxesPerCase: 0,
                unitsPerDisplayBox: 0,
                description: '',
                category: '',
                isBestSeller: false,
                image: '',
                active: true,
                masterCaseDimensions: {
                    length: 0,
                    width: 0,
                    height: 0,
                    weight: 0
                },
                displayBoxDimensions: {
                    length: 0,
                    width: 0,
                    height: 0,
                    weight: 0
                }
            };
        }
        
        /**
         * Initialize the admin dashboard
         */
        async init() {
            if (this.isInitialized) {
                console.log('✅ AdminDashboard already initialized');
                return true;
            }
            
            console.log('⚙️ Initializing AdminDashboard...');
            
            try {
                // Create the dashboard UI
                this.createUI();
                
                // Load initial data
                await this.loadProducts();
                
                // Set up event listeners
                this.setupEventListeners();
                
                // Initialize Copper CRM integration if available
                this.initializeCopperIntegration();
                
                // Load saved credentials
                this.loadSavedCredentials();
                
                // Initialize the default tab
                this.switchTab('products');
                
                // Set up global event delegation for dynamic elements
                document.addEventListener('click', (e) => {
                    // Handle edit product button
                    const editBtn = e.target.closest('.edit-product');
                    if (editBtn) {
                        e.preventDefault();
                        const productId = editBtn.dataset.id;
                        this.showProductForm(productId);
                        return;
                    }
                    
                    // Handle delete product button
                    const deleteBtn = e.target.closest('.delete-product');
                    if (deleteBtn) {
                        e.preventDefault();
                        const productId = deleteBtn.dataset.id;
                        if (confirm('Are you sure you want to delete this product?')) {
                            this.deleteProduct(productId);
                        }
                        return;
                    }
                    
                    // Handle add product button
                    if (e.target.matches('#addProductBtn') || e.target.closest('#addProductBtn')) {
                        e.preventDefault();
                        this.showProductForm();
                        return;
                    }
                    
                    // Handle cancel button in product form
                    if (e.target.matches('#cancelProductBtn') || e.target.closest('#cancelProductBtn')) {
                        e.preventDefault();
                        this.loadTabContent('products');
                        return;
                    }
                });
                
                // Handle form submissions
                document.addEventListener('submit', (e) => {
                    if (e.target.matches('#productForm')) {
                        e.preventDefault();
                        this.handleProductFormSubmit(e.target);
                    }
                });
                
                this.isInitialized = true;
                console.log('AdminDashboard initialized successfully');
                return true;
            } catch (error) {
                console.error('Failed to initialize AdminDashboard:', error);
                this.showNotification('Failed to initialize admin dashboard', 'error');
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
            
            // Tab switching
            document.addEventListener('click', (e) => {
                const tabBtn = e.target.closest('.admin-tab');
                if (tabBtn) {
                    const tabId = tabBtn.dataset.tab;
                    this.switchTab(tabId);
                }
            });
            
            // Save changes button
            document.addEventListener('click', (e) => {
                if (e.target.closest('#saveAdminChanges')) {
                    this.saveChanges();
                }
            });
            
            // Add product button
            document.addEventListener('click', (e) => {
                if (e.target.closest('#addProductBtn')) {
                    this.showProductForm();
                }
            });
            
            // Edit product button
            document.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.edit-product');
                if (editBtn) {
                    const productId = editBtn.dataset.id;
                    this.editProduct(productId);
                }
            });
            
            // Delete product button
            document.addEventListener('click', (e) => {
                const deleteBtn = e.target.closest('.delete-product');
                if (deleteBtn) {
                    const productId = deleteBtn.dataset.id;
                    if (confirm('Are you sure you want to delete this product?')) {
                        this.deleteProduct(productId);
                    }
                }
            });
            
            // Product form submission
            document.addEventListener('submit', (e) => {
                if (e.target.matches('#productForm')) {
                    e.preventDefault();
                    this.handleProductFormSubmit(e.target);
                }
            });
            
            // Cancel button in product form
            document.addEventListener('click', (e) => {
                if (e.target.closest('#cancelProductBtn')) {
                    this.loadTabContent('products');
                }
            });
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
            if (!this.dashboard) return;
            
            const tabContent = this.dashboard.querySelector('.admin-tab-content');
            if (!tabContent) return;
            
            // Update active tab
            const tabs = this.dashboard.querySelectorAll('.admin-tab');
            tabs.forEach(tab => {
                if (tab.dataset.tab === tabId) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
            
            this.currentTab = tabId;
            
            // Render tab content
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
                    html = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Tab content not found</p></div>';
            }
            
            tabContent.innerHTML = html;
            
            // Apply saved credentials to form fields
            if (tabId === 'integrations') {
                this.applySavedCredentials();
                this.initializeCopperIntegration();
            }
        }
        
        /**
         * Render the Products tab content
         */
        renderProductsTab() {
            let html = `
                <div class="admin-section">
                    <div class="section-header">
                        <h4><i class="fas fa-box"></i> Product Catalog</h4>
                        <button class="btn btn-sm btn-primary" id="addProductBtn">
                            <i class="fas fa-plus"></i> Add Product
                        </button>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="thead-light">
                                <tr>
                                    <th>Status</th>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>MSRP</th>
                                    <th>Units/Case</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            if (this.products.length === 0) {
                html += `
                    <tr>
                        <td colspan="7" class="text-center py-4">
                            <div class="empty-state">
                                <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                                <h5>No products found</h5>
                                <p class="text-muted">Get started by adding your first product</p>
                                <button class="btn btn-primary" id="addFirstProductBtn">
                                    <i class="fas fa-plus"></i> Add Your First Product
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                this.products.forEach(product => {
                    const statusBadge = product.active 
                        ? '<span class="badge badge-success">Active</span>' 
                        : '<span class="badge badge-secondary">Inactive</span>';
                        
                    const bestSellerBadge = product.isBestSeller 
                        ? ' <span class="badge badge-warning"><i class="fas fa-star"></i> Best Seller</span>' 
                        : '';
                    
                    html += `
                        <tr data-product-id="${product.id}" class="${!product.active ? 'table-secondary' : ''}">
                            <td>${statusBadge}</td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="product-thumb" style="background-image: url('${product.image || 'https://via.placeholder.com/50'}')"></div>
                                    <div class="ml-2">
                                        <div class="font-weight-bold">${product.name || 'Unnamed Product'}</div>
                                        <small class="text-muted">${product.id}</small>
                                        ${bestSellerBadge}
                                    </div>
                                </div>
                            </td>
                            <td>${product.category || '-'}</td>
                            <td>$${product.price ? product.price.toFixed(2) : '0.00'}</td>
                            <td>${product.msrp ? '$' + product.msrp.toFixed(2) : '-'}</td>
                            <td>${product.unitsPerCase || '-'}</td>
                            <td>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary edit-product" data-id="${product.id}" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-outline-danger delete-product" data-id="${product.id}" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
            }
            
            html += `
                            </tbody>
                        </table>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <div class="text-muted">
                            Showing ${this.products.length} product${this.products.length !== 1 ? 's' : ''}
                        </div>
                        <button class="btn btn-outline-primary" id="exportProductsBtn">
                            <i class="fas fa-file-export"></i> Export CSV
                        </button>
                    </div>
                </div>
            `;
            
            return html;
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
         * Initialize Copper CRM integration
         */
        initializeCopperIntegration() {
            try {
                // Check if Copper integration is available
                if (window.CopperIntegration && typeof window.CopperIntegration.initialize === 'function') {
                    console.log('🔄 Initializing Copper CRM integration from AdminDashboard...');
                    
                    // Initialize Copper integration
                    const isInCopperEnv = window.CopperIntegration.initialize();
                    
                    console.log(`✅ Copper CRM integration ${isInCopperEnv ? 'initialized in Copper environment' : 'initialized in standalone mode'}`);
                    return true;
                } else {
                    console.warn('⚠️ Copper CRM integration not available');
                    return false;
                }
            } catch (error) {
                console.error('❌ Error initializing Copper CRM integration:', error);
                return false;
            }
        }
        
        /**
         * Load saved credentials for integrations
         */
        loadSavedCredentials() {
            try {
                // Load GitHub credentials
                const savedGitConfig = localStorage.getItem('gitConfig');
                if (savedGitConfig) {
                    try {
                        this.savedGitConfig = JSON.parse(savedGitConfig);
                        console.log('✅ GitHub credentials loaded');
                    } catch (e) {
                        console.warn('⚠️ Error parsing saved GitHub config:', e);
                    }
                }
                
                // Load Copper credentials
                const copperApiKey = localStorage.getItem('copperApiKey');
                const copperUserEmail = localStorage.getItem('copperUserEmail');
                
                if (copperApiKey && copperUserEmail) {
                    console.log('✅ Copper CRM credentials loaded');
                    
                    // Apply to form fields when tab is loaded
                    this.savedCopperConfig = {
                        apiKey: copperApiKey,
                        userEmail: copperUserEmail
                    };
                }
                
                return true;
            } catch (error) {
                console.error('❌ Error loading saved credentials:', error);
                return false;
            }
        }
        
        /**
         * Initialize Copper CRM integration
         */
        initializeCopperIntegration() {
            try {
                // Check for existing credentials
                const apiKey = localStorage.getItem('copperApiKey');
                const userEmail = localStorage.getItem('copperUserEmail');
                
                if (!apiKey || !userEmail) {
                    console.log('⚠️ No Copper CRM credentials found');
                    this.updateCopperStatusIndicator(false);
                    return false;
                }
                
                // Configure Copper SDK if available
                if (window.CopperIntegration && typeof window.CopperIntegration.configureSdk === 'function') {
                    const credentials = { apiKey, userEmail };
                    
                    // Attempt to configure SDK with saved credentials
                    window.CopperIntegration.configureSdk(credentials)
                        .then(result => {
                            if (result) {
                                console.log('✅ Copper SDK configured successfully from admin panel');
                                this.updateCopperStatusIndicator(true);
                            } else {
                                console.warn('⚠️ Copper SDK configuration failed');
                                this.updateCopperStatusIndicator(false);
                            }
                        })
                        .catch(error => {
                            console.error('❌ Error configuring Copper SDK:', error);
                            this.updateCopperStatusIndicator(false);
                        });
                } else {
                    console.warn('⚠️ Copper Integration module not available');
                    this.updateCopperStatusIndicator(false);
                }
                
                return true;
            } catch (error) {
                console.error('❌ Error initializing Copper integration:', error);
                this.updateCopperStatusIndicator(false);
                return false;
            }
        }
        
        /**
         * Apply saved credentials to form fields
         */
        applySavedCredentials() {
            try {
                // Apply GitHub credentials
                if (this.savedGitConfig) {
                    const repoField = document.getElementById('githubRepo');
                    const branchField = document.getElementById('githubBranch');
                    const tokenField = document.getElementById('githubToken');
                    
                    if (repoField && this.savedGitConfig.repo) {
                        repoField.value = this.savedGitConfig.repo;
                    }
                    
                    if (branchField && this.savedGitConfig.branch) {
                        branchField.value = this.savedGitConfig.branch;
                    }
                    
                    if (tokenField && this.savedGitConfig.token) {
                        tokenField.value = this.savedGitConfig.token;
                    }
                }
                
                // Apply Copper credentials
                if (this.savedCopperConfig) {
                    const apiKeyField = document.getElementById('copperApiKey');
                    const userEmailField = document.getElementById('copperUserEmail');
                    
                    if (apiKeyField && this.savedCopperConfig.apiKey) {
                        apiKeyField.value = this.savedCopperConfig.apiKey;
                    }
                    
                    if (userEmailField && this.savedCopperConfig.userEmail) {
                        userEmailField.value = this.savedCopperConfig.userEmail;
                    }
                    
                    // Update connection status indicator
                    const statusIndicator = document.querySelector('.integration-card:nth-child(2) .connection-status');
                    if (statusIndicator) {
                        statusIndicator.classList.remove('disconnected');
                        statusIndicator.classList.add('connected');
                        statusIndicator.innerHTML = '<i class="fas fa-check-circle"></i> Connected';
                    }
                }
                
                return true;
            } catch (error) {
                console.error('❌ Error applying saved credentials:', error);
                return false;
            }
        }
        
        /**
         * Render the Integrations tab content
         */
        renderIntegrationsTab() {
            const hasGitIntegration = this.savedGitConfig?.token || false;
            const hasCopperIntegration = this.savedCopperConfig?.apiKey || false;
            
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
                    <div class="integration-card copper-settings-container">
                        <div class="integration-header">
                            <div class="integration-title">
                                <i class="fas fa-address-book"></i>
                                <h5>Copper CRM Integration</h5>
                            </div>
                            <span class="connection-status ${hasCopperIntegration ? 'connected' : 'disconnected'}" id="copperConnectionStatus">
                                <i class="fas ${hasCopperIntegration ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                ${hasCopperIntegration ? 'Connected' : 'Not Connected'}
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
         * Load product data from the calculator's data manager or fall back to local file
         */
        async loadProducts() {
            console.log('Loading products...');
            
            try {
                // Try to load from calculator's data manager first
                if (this.calculator?.dataManager?.getData) {
                    const data = this.calculator.dataManager.getData();
                    if (data?.products) {
                        this.products = Array.isArray(data.products) ? data.products : [];
                        console.log(`Loaded ${this.products.length} products from calculator data manager`);
                        return;
                    }
                }
                
                // Fall back to local file
                try {
                    const response = await fetch('/data/products.json');
                    if (response.ok) {
                        const data = await response.json();
                        this.products = Array.isArray(data) ? data : [];
                        console.log(`Loaded ${this.products.length} products from local file`);
                        return;
                    }
                } catch (error) {
                    console.warn('Failed to load products from local file:', error);
                }
                
                // If all else fails, initialize with empty array
                this.products = [];
                console.log('No products found, initialized with empty array');
                
            } catch (error) {
                console.error('Error loading products:', error);
                this.products = [];
                throw error; // Re-throw to be caught by the caller
            }
        }
        
        /**
         * Load data from various sources (GitHub, localStorage, defaults)
         */
        async loadData() {
            console.log('Loading admin data...');
            
            try {
                // Load products
                await this.loadProducts();
                
                // Load other data (tiers, shipping, etc.)
                if (this.calculator?.dataManager?.getData) {
                    const data = this.calculator.dataManager.getData();
                    if (data) {
                        this.tiers = Array.isArray(data.tiers) ? data.tiers : [];
                        this.shipping = typeof data.shipping === 'object' ? data.shipping : { zones: [] };
                        console.log('Data loaded from calculator data manager');
                        return;
                    }
                }
                
                // Fall back to default data
                this.loadDefaultData();
                console.log('Using default data');
                
            } catch (error) {
                console.error('Error loading data:', error);
                this.loadDefaultData();
                throw error; // Re-throw to be caught by the caller
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
                
                // Update Copper integration if available
                if (window.CopperIntegration && typeof window.CopperIntegration.configureSdk === 'function') {
                    try {
                        const credentials = { apiKey, userEmail };
                        const configResult = await window.CopperIntegration.configureSdk(credentials);
                        
                        if (configResult) {
                            console.log('✅ Copper SDK reconfigured with new credentials from admin panel');
                            this.updateCopperStatusIndicator(true);
                        } else {
                            console.warn('⚠️ Copper SDK reconfiguration attempted but may not have succeeded');
                            this.updateCopperStatusIndicator(false);
                        }
                    } catch (e) {
                        console.error('❌ Could not reconfigure Copper CRM integration:', e);
                        this.updateCopperStatusIndicator(false);
                    }
                }
                
                this.showNotification('Copper CRM settings saved successfully', 'success');
                return true;
                
            } catch (error) {
                this.showNotification(`Error saving Copper settings: ${error.message}`, 'error');
                return false;
            }
        }
        
        /**
         * Update Copper CRM status indicator in the admin panel
         * @param {boolean} isConnected - Whether the connection is successful
         */
        updateCopperStatusIndicator(isConnected) {
            const statusIndicator = document.getElementById('copperConnectionStatus');
            if (!statusIndicator) {
                // Create status indicator if it doesn't exist
                const container = document.querySelector('.copper-settings-container');
                if (container) {
                    const indicator = document.createElement('div');
                    indicator.id = 'copperConnectionStatus';
                    indicator.className = isConnected ? 'connection-status connected' : 'connection-status disconnected';
                    indicator.innerHTML = isConnected ? 
                        '<i class="fas fa-plug"></i> Connected to Copper CRM' : 
                        '<i class="fas fa-exclamation-triangle"></i> Not connected to Copper CRM';
                    container.prepend(indicator);
                }
            } else {
                // Update existing indicator
                statusIndicator.className = isConnected ? 'connection-status connected' : 'connection-status disconnected';
                statusIndicator.innerHTML = isConnected ? 
                    '<i class="fas fa-plug"></i> Connected to Copper CRM' : 
                    '<i class="fas fa-exclamation-triangle"></i> Not connected to Copper CRM';
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
                /**
         * Display a toast notification using NotificationManager
         * @param {string} message - The message to display
         * @param {string} type - Notification type: 'success', 'error', 'warning', 'info'
         */
        showNotification(message, type = 'info') {
            if (window.NotificationManager) {
                const methodMap = {
                    'success': 'showSuccess',
                    'error': 'showError',
                    'warning': 'showWarning',
                    'info': 'showInfo'
                };
                const method = methodMap[type] || 'showInfo';
                window.NotificationManager[method](message);
            } else {
                console.log(`${type.toUpperCase()}: ${message}`);
            }
        }

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
                localStorage.removeItem('kanvaSettings');
                localStorage.removeItem('gitConfig');
                localStorage.removeItem('copperApiKey');
                localStorage.removeItem('copperUserEmail');
                
                this.products = [];
                this.tiers = [];
                this.shipping = { zones: [] };
                this.savedGitConfig = null;
                
                this.showNotification('App data reset to defaults', 'success');
                
            } catch (error) {
                console.error('Error resetting app data:', error);
                this.showNotification('Failed to reset app data', 'error');
            }
        }
        
        /**
         * Shows the product form for adding or editing a product
         * @param {string} productId - The ID of the product to edit, or null for a new product
         */
        showProductForm(productId = null) {
            this.isEditing = !!productId;
            this.currentProduct = productId ? this.products.find(p => p.id === productId) || { ...this.defaultProduct }
                : { ...this.defaultProduct, id: `prod_${Date.now()}` };
            
            const formHtml = `
                <div class="admin-form-container">
                    <h3>${this.isEditing ? 'Edit' : 'Add New'} Product</h3>
                    <form id="productForm" class="admin-form">
                        <input type="hidden" name="id" value="${this.currentProduct.id}">
                        
                        <div class="form-group">
                            <label for="name">Product Name *</label>
                            <input type="text" id="name" name="name" value="${this.currentProduct.name || ''}" required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="price">Price *</label>
                                <input type="number" id="price" name="price" step="0.01" min="0" 
                                       value="${this.currentProduct.price || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="msrp">MSRP</label>
                                <input type="number" id="msrp" name="msrp" step="0.01" min="0"
                                       value="${this.currentProduct.msrp || ''}">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="unitsPerCase">Units per Case</label>
                                <input type="number" id="unitsPerCase" name="unitsPerCase" min="1"
                                       value="${this.currentProduct.unitsPerCase || ''}">
                            </div>
                            <div class="form-group">
                                <label for="unitsPerDisplayBox">Units per Display Box</label>
                                <input type="number" id="unitsPerDisplayBox" name="unitsPerDisplayBox" min="1"
                                       value="${this.currentProduct.unitsPerDisplayBox || ''}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="category">Category</label>
                            <input type="text" id="category" name="category" 
                                   value="${this.currentProduct.category || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label for="description">Description</label>
                            <textarea id="description" name="description" rows="3">${this.currentProduct.description || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="image">Image URL</label>
                            <input type="url" id="image" name="image" value="${this.currentProduct.image || ''}">
                        </div>
                        
                        <div class="form-group form-check">
                            <input type="checkbox" id="isBestSeller" name="isBestSeller" 
                                   ${this.currentProduct.isBestSeller ? 'checked' : ''}>
                            <label for="isBestSeller">Mark as Best Seller</label>
                        </div>
                        
                        <div class="form-group form-check">
                            <input type="checkbox" id="active" name="active" 
                                   ${this.currentProduct.active !== false ? 'checked' : ''}>
                            <label for="active">Active</label>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                ${this.isEditing ? 'Update' : 'Add'} Product
                            </button>
                            <button type="button" id="cancelProductBtn" class="btn btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            `;
            
            // Set the tab content
            const tabContent = document.querySelector('#adminDashboard .tab-content');
            if (tabContent) {
                tabContent.innerHTML = formHtml;
                tabContent.scrollIntoView({ behavior: 'smooth' });
            }
        }
        
        /**
         * Handles the product form submission
         * @param {HTMLFormElement} form - The form element
         */
        async handleProductFormSubmit(form) {
            try {
                const formData = new FormData(form);
                const productData = {
                    id: formData.get('id'),
                    name: formData.get('name'),
                    price: parseFloat(formData.get('price')) || 0,
                    msrp: parseFloat(formData.get('msrp')) || 0,
                    unitsPerCase: parseInt(formData.get('unitsPerCase')) || 0,
                    unitsPerDisplayBox: parseInt(formData.get('unitsPerDisplayBox')) || 0,
                    category: formData.get('category') || '',
                    description: formData.get('description') || '',
                    image: formData.get('image') || '',
                    isBestSeller: formData.get('isBestSeller') === 'on',
                    active: formData.get('active') !== 'false',
                    lastUpdated: new Date().toISOString()
                };
                
                // Validate required fields
                if (!productData.name || isNaN(productData.price)) {
                    this.showNotification('Please fill in all required fields', 'error');
                    return;
                }
                
                // Update or add the product
                if (this.isEditing) {
                    const index = this.products.findIndex(p => p.id === productData.id);
                    if (index !== -1) {
                        this.products[index] = { ...this.products[index], ...productData };
                        this.showNotification('Product updated successfully', 'success');
                    }
                } else {
                    this.products.push(productData);
                    this.showNotification('Product added successfully', 'success');
                }
                
                // Save the updated products
                await this.saveProducts();
                
                // Return to products list
                this.loadTabContent('products');
                
            } catch (error) {
                console.error('Error saving product:', error);
                this.showNotification('Failed to save product', 'error');
            }
        }
        
        /**
         * Deletes a product
         * @param {string} productId - The ID of the product to delete
         */
        async deleteProduct(productId) {
            try {
                const index = this.products.findIndex(p => p.id === productId);
                if (index !== -1) {
                    this.products.splice(index, 1);
                    await this.saveProducts();
                    this.showNotification('Product deleted successfully', 'success');
                    this.loadTabContent('products');
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                this.showNotification('Failed to delete product', 'error');
            }
        }
        
        /**
         * Shows the admin dashboard
         */
        show() {
            if (!this.isInitialized) {
                console.warn('AdminDashboard not initialized. Initializing now...');
                this.init().then(() => this.show());
                return;
            }
            
            if (!this.dashboard) return;
            
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
        
        /**
         * Render the admin dashboard in a specified container
         * @param {HTMLElement} container - The container element to render the dashboard in
         */
        renderInContainer(container) {
            try {
                if (!container) {
                    throw new Error('No container provided for admin dashboard');
                }
                
                console.log('📋 Rendering admin dashboard in container...');
                
                // Store reference to the container
                this.dashboard = container;
                
                // Create the dashboard structure
                container.innerHTML = `
                    <div class="admin-header">
                        <h2>Admin Dashboard</h2>
                        <div class="admin-tabs">
                            <button class="admin-tab ${this.currentTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
                                <i class="fas fa-tachometer-alt"></i> Dashboard
                            </button>
                            <button class="admin-tab ${this.currentTab === 'products' ? 'active' : ''}" data-tab="products">
                                <i class="fas fa-box"></i> Products
                            </button>
                            <button class="admin-tab ${this.currentTab === 'github' ? 'active' : ''}" data-tab="github">
                                <i class="fab fa-github"></i> GitHub
                            </button>
                            <button class="admin-tab ${this.currentTab === 'copper' ? 'active' : ''}" data-tab="copper">
                                <i class="fas fa-address-book"></i> Copper CRM
                            </button>
                            <button class="admin-tab ${this.currentTab === 'settings' ? 'active' : ''}" data-tab="settings">
                                <i class="fas fa-cog"></i> Settings
                            </button>
                        </div>
                    </div>
                    <div class="admin-content">
                        <div id="admin-tab-content" class="tab-content"></div>
                    </div>
                    <div class="admin-footer">
                        <button id="saveAdminChanges" class="btn btn-primary">
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                        <button id="adminLogout" class="btn btn-outline-secondary">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                `;
                
                // Add event listeners
                this.addEventListeners(container);
                
                // Load the current tab content
                this.loadTabContent(this.currentTab);
                
                // Set visibility state
                this.isVisible = true;
                
                console.log('✅ Admin dashboard rendered in container');
            } catch (error) {
                console.error('❌ Error rendering admin dashboard in container:', error);
                throw error;
            }
        }
        
        /**
         * Add event listeners to the dashboard elements
         * @param {HTMLElement} container - The dashboard container
         */
        addEventListeners(container) {
            // Tab switching
            const tabs = container.querySelectorAll('.admin-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const tabName = e.currentTarget.dataset.tab;
                    this.switchTab(tabName);
                });
            });
            
            // Save button
            const saveBtn = container.querySelector('#saveAdminChanges');
            if (saveBtn) {
                saveBtn.addEventListener('click', this.saveChanges);
            }
            
            // Logout button
            const logoutBtn = container.querySelector('#adminLogout');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    this.hide();
                    if (this.adminManager && typeof this.adminManager.logout === 'function') {
                        this.adminManager.logout();
                    }
                });
            }
            
            // Dashboard click handler for delegated events
            container.addEventListener('click', this.handleDashboardClick);
        }
    }

    // Export the class
    if (typeof window !== 'undefined') {
        window.AdminDashboard = AdminDashboard;
    } 
})();
