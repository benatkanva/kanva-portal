import { BaseComponent, AdminLayout, TabNavigation } from './index';
import AuthManager from './AuthManager';
import { ProductsTab, TiersTab, ShippingTab, IntegrationsTab, SettingsTab } from './tabs';

/**
 * Admin Dashboard Component
 * Main container for the admin dashboard that manages all tab components
 */
class AdminDashboard extends BaseComponent {
    /**
     * Create a new AdminDashboard
     * @param {Object} options - Component options
     * @param {Object} options.data - Initial data for the dashboard
     * @param {Function} options.onSave - Callback when data is saved
     * @param {Object} options.calculator - Calculator instance
     * @param {Object} options.adminManager - AdminManager instance
     */
    constructor({
        data = {},
        onSave = null,
        calculator = null,
        adminManager = null,
        onUnauthenticated = null,
        ...rest
    } = {}) {
        super({
            data: this.normalizeData(data),
            activeTab: 'products',
            isInitialized: false,
            isLoading: false,
            isAuthenticated: false,
            ...rest
        });

        // Store instances
        this.calculator = calculator;
        this.adminManager = adminManager;
        this.onSaveCallback = onSave;
        this.onUnauthenticated = onUnauthenticated;
        
        // Initialize auth manager if not provided
        if (!this.adminManager) {
            this.authManager = new AuthManager({
                onLogin: this.handleLogin.bind(this),
                onLogout: this.handleLogout.bind(this)
            });
        } else {
            // Use provided admin manager
            this.authManager = adminManager;
            this.setState({ isAuthenticated: true });
        }
        
        // Bind methods
        this.handleTabChange = this.handleTabChange.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleRefresh = this.handleRefresh.bind(this);
        this.handleLogin = this.handleLogin.bind(this);
        this.initializeTabs = this.initializeTabs.bind(this);
    }

    /**
     * Normalize data to ensure consistent structure
     */
    normalizeData(data) {
        return {
            products: Array.isArray(data.products) ? data.products : [],
            tiers: data.tiers || {},
            shipping: data.shipping || {},
            integrations: data.integrations || {},
            settings: data.settings || {},
            // Add any additional data normalization here
            ...data
        };
    }

    /**
     * Initialize tab components
     */
    initializeTabs() {
        this.tabs = {
            products: new ProductsTab({
                products: this.data.products,
                tiers: this.data.tiers,
                onSave: (products) => {
                    this.handleDataUpdate('products', products);
                }
            }),
            
            tiers: new TiersTab({
                tiers: this.data.tiers,
                onSave: (tiers) => {
                    this.handleDataUpdate('tiers', tiers);
                }
            }),
            
            shipping: new ShippingTab({
                shipping: this.data.shipping,
                onSave: (shipping) => {
                    this.handleDataUpdate('shipping', shipping);
                }
            }),
            
            integrations: new IntegrationsTab({
                integrations: this.data.integrations,
                onSave: (integrations) => {
                    this.handleDataUpdate('integrations', integrations);
                }
            }),
            
            settings: new SettingsTab({
                settings: this.data.settings,
                onSave: (settings) => {
                    this.handleDataUpdate('settings', settings);
                }
            })
        };
    }

    /**
     * Handle tab change
     */
    handleTabChange(tabId) {
        if (tabId === this.data.activeTab) return;
        
        this.setState({
            activeTab: tabId
        });
        
        // Update the content area with the selected tab
        this.renderActiveTab();
    }
    
    /**
     * Handle data update from a tab
     */
    handleDataUpdate(key, value) {
        const updatedData = {
            ...this.data,
            [key]: value
        };
        
        this.setState({
            data: updatedData
        });
        
        // Enable save button when data changes
        this.enableSaveButton();
    }
    
    /**
     * Enable the save button
     */
    enableSaveButton() {
        if (this.layout && this.layout.enableSaveButton) {
            this.layout.enableSaveButton();
        }
    }
    
    /**
     * Handle save action
     */
    async handleSave() {
        if (this.isSaving) return;
        
        this.isSaving = true;
        
        // Show loading state
        if (this.layout && this.layout.setLoadingState) {
            this.layout.setLoadingState(true, 'Saving changes...');
        }
        
        try {
            // In a real app, this would be an API call
            console.log('Saving data:', this.data);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Call the onSave callback if provided
            if (typeof this.onSaveCallback === 'function') {
                await this.onSaveCallback(this.data);
            }
            
            // Show success message
            if (this.layout && this.layout.showNotification) {
                this.layout.showNotification('Changes saved successfully', 'success');
            }
            
            // Disable save button after successful save
            if (this.layout && this.layout.disableSaveButton) {
                this.layout.disableSaveButton();
            }
        } catch (error) {
            console.error('Error saving data:', error);
            
            // Show error message
            if (this.layout && this.layout.showNotification) {
                this.layout.showNotification(
                    error.message || 'Failed to save changes. Please try again.',
                    'error'
                );
            }
        } finally {
            this.isSaving = false;
            
            // Hide loading state
            if (this.layout && this.layout.setLoadingState) {
                this.layout.setLoadingState(false);
            }
        }
    }
    
    /**
     * Handle refresh action
     */
    async handleRefresh() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        // Show loading state
        if (this.layout && this.layout.setLoadingState) {
            this.layout.setLoadingState(true, 'Refreshing data...');
        }
        
        try {
            // In a real app, this would fetch fresh data from the server
            console.log('Refreshing data...');
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // For demo purposes, we'll just reload the current data
            // In a real app, you would fetch fresh data from the server
            const freshData = { ...this.data };
            
            // Update state with fresh data
            this.setState({
                data: freshData,
                // Reset any form states if needed
                activeTab: this.data.activeTab
            });
            
            // Re-initialize tabs with fresh data
            this.initializeTabs();
            this.renderActiveTab();
            
            // Show success message
            if (this.layout && this.layout.showNotification) {
                this.layout.showNotification('Data refreshed successfully', 'success');
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
            
            // Show error message
            if (this.layout && this.layout.showNotification) {
                this.layout.showNotification(
                    error.message || 'Failed to refresh data. Please try again.',
                    'error'
                );
            }
        } finally {
            this.isLoading = false;
            
            // Hide loading state
            if (this.layout && this.layout.setLoadingState) {
                this.layout.setLoadingState(false);
            }
        }
    }
    
    /**
     * Handle logout action
     */
    handleLogout() {
        // In a real app, this would log the user out
        console.log('Logging out...');
        
        // Show confirmation dialog
        if (confirm('Are you sure you want to log out?')) {
            // Redirect to logout URL or trigger logout flow
            window.location.href = '/logout';
        }
    }
    
    /**
     * Render the active tab
     */
    renderActiveTab() {
        const { activeTab } = this.data;
        const content = this.element.querySelector('.admin-content');
        
        if (!content) return;
        
        // Clear existing content
        content.innerHTML = '';
        
        // Get the active tab component
        const activeTabComponent = this.tabs[activeTab];
        
        if (activeTabComponent) {
            // Render the active tab
            const tabElement = activeTabComponent.render();
            content.appendChild(tabElement);
            
            // Call onMount if the component has been mounted before
            if (activeTabComponent.onMount) {
                activeTabComponent.onMount();
            }
        } else {
            // Fallback if tab component is not found
            content.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Tab content not available.
                </div>
            `;
        }
    }
    
    /**
     * Render the admin dashboard
     */
    render() {
        // Initialize tabs if not already done
        if (!this.tabs) {
            this.initializeTabs();
        }
        
        // Create main container
        this.element = document.createElement('div');
        this.element.className = 'admin-dashboard';
        
        // Create admin layout
        this.layout = new AdminLayout({
            title: 'Admin Dashboard',
            onSave: this.handleSave,
            onRefresh: this.handleRefresh,
            onLogout: this.handleLogout,
            showNotification: (message, type = 'info') => {
                // This will be called by child components to show notifications
                if (this.layout && this.layout.showNotification) {
                    this.layout.showNotification(message, type);
                }
            }
        });
        
        // Create tab navigation
        const tabNavigation = new TabNavigation({
            tabs: [
                { id: 'products', label: 'Products', icon: 'box' },
                { id: 'tiers', label: 'Pricing Tiers', icon: 'tags' },
                { id: 'shipping', label: 'Shipping', icon: 'truck' },
                { id: 'integrations', label: 'Integrations', icon: 'plug' },
                { id: 'settings', label: 'Settings', icon: 'cog' }
            ],
            activeTab: this.data.activeTab,
            onTabChange: this.handleTabChange
        });
        
        // Create content area
        const content = document.createElement('div');
        content.className = 'admin-content';
        
        // Assemble the layout
        this.layout.setHeader(tabNavigation.render());
        this.layout.setContent(content);
        
        // Render the active tab
        this.renderActiveTab();
        
        // Render the layout
        const layoutElement = this.layout.render();
        this.element.appendChild(layoutElement);
        
        // Mark as initialized
        if (!this.data.isInitialized) {
            this.setState({
                isInitialized: true
            });
        }
        
        return this.element;
    }
    
    /**
     * Lifecycle hook - called after component is mounted
     */
    onMount() {
        // Add any additional setup needed after the component is mounted
        console.log('AdminDashboard mounted');
    }
    
    /**
     * Lifecycle hook - called before component is unmounted
     */
    onBeforeUnmount() {
        // Clean up any event listeners or resources
        console.log('AdminDashboard will unmount');
        
        // Clean up tab components
        if (this.tabs) {
            Object.values(this.tabs).forEach(tab => {
                if (tab && typeof tab.onBeforeUnmount === 'function') {
                    tab.onBeforeUnmount();
                }
            });
        }
        
        // Clean up layout
        if (this.layout && typeof this.layout.onBeforeUnmount === 'function') {
            this.layout.onBeforeUnmount();
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.AdminDashboard = AdminDashboard;
}

export default AdminDashboard;
