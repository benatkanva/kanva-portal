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
        
        try {
            console.log('Initializing AdminDashboard...');
            
            // Create the dashboard UI
            this.createUI();
            
            // Load initial data
            await this.loadData();
            
            // Set up event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('AdminDashboard initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing AdminDashboard:', error);
            throw error;
        }
    }
    
    /**
     * Create the dashboard UI
     */
    createUI() {
        // Create dashboard container if it doesn't exist
        if (!document.getElementById('adminDashboard')) {
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
        }
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
        // Close button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'closeAdminDashboard' || e.target.closest('#closeAdminDashboard')) {
                this.hide();
            }
            
            // Cancel button
            if (e.target.id === 'cancelAdminChanges' || e.target.closest('#cancelAdminChanges')) {
                if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                    this.hide();
                }
            }
            
            // Save button
            if (e.target.id === 'saveAdminChanges' || e.target.closest('#saveAdminChanges')) {
                this.saveChanges();
            }
            
            // Tab switching
            if (e.target.classList.contains('admin-tab')) {
                const tabId = e.target.getAttribute('data-tab');
                this.switchTab(tabId);
            }
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isVisible && e.target.classList.contains('admin-dashboard-overlay')) {
                this.hide();
            }
        });
        
        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
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
                case 'settings':
                    html = this.renderSettingsTab();
                    break;
                default:
                    html = '<p>Tab not found</p>';
            }
            
            contentEl.innerHTML = html;
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
     * Render the Settings tab content
     */
    renderSettingsTab() {
        return `
            <div class="admin-section">
                <h4>Application Settings</h4>
                
                <div class="form-group">
                    <label>Credit Card Fee Rate (%)</label>
                    <input type="number" class="form-control" id="ccFeeRate" 
                           value="${(this.calculator.settings?.creditCardFeeRate * 100 || 3).toFixed(2)}" 
                           step="0.01" min="0" max="10">
                </div>
                
                <div class="form-group">
                    <label>Default Admin Password</label>
                    <div class="input-group">
                        <input type="password" class="form-control" id="adminPassword" 
                               value="${this.adminManager.adminPassword || ''}">
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
     * Save changes made in the admin dashboard
     */
    async saveChanges() {
        try {
            // Show loading state
            const saveBtn = document.getElementById('saveAdminChanges');
            const originalText = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            // TODO: Implement actual save logic
            // This would involve collecting data from the form fields
            // and saving it using the data manager
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
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
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
            }
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
