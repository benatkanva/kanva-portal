import BaseComponent from './BaseComponent';

/**
 * Admin Layout Component
 * Main container for the admin dashboard
 */
class AdminLayout extends BaseComponent {
    /**
     * Create a new AdminLayout
     * @param {Object} options - Component options
     * @param {string} [options.title='Admin Dashboard'] - Page title
     * @param {string} [options.activeTab='products'] - Active tab ID
     * @param {boolean} [options.showHeader=true] - Whether to show the header
     * @param {boolean} [options.showFooter=true] - Whether to show the footer
     */
    constructor({
        title = 'Admin Dashboard',
        activeTab = 'products',
        showHeader = true,
        showFooter = true,
        ...rest
    } = {}) {
        super({
            title,
            activeTab,
            showHeader,
            showFooter,
            ...rest
        });
        
        // Bind methods
        this.setActiveTab = this.setActiveTab.bind(this);
    }
    
    /**
     * Render the admin layout
     */
    render() {
        // Create main container
        this.element = document.createElement('div');
        this.element.className = 'admin-layout';
        this.element.innerHTML = `
            ${this.data.showHeader ? this.renderHeader() : ''}
            <main class="admin-main">
                <div class="admin-content" id="adminContent">
                    <!-- Content will be rendered here -->
                </div>
            </main>
            ${this.data.showFooter ? this.renderFooter() : ''}
        `;
        
        return this.element;
    }
    
    /**
     * Render the header section
     */
    renderHeader() {
        return `
            <header class="admin-header">
                <div class="container-fluid">
                    <div class="d-flex justify-content-between align-items-center py-3">
                        <h1 class="h4 mb-0">${this.data.title}</h1>
                        <div class="admin-actions">
                            <button id="saveAdminChanges" class="btn btn-primary btn-sm">
                                <i class="fas fa-save me-1"></i> Save Changes
                            </button>
                            <button id="refreshData" class="btn btn-outline-secondary btn-sm ms-2">
                                <i class="fas fa-sync-alt me-1"></i> Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }
    
    /**
     * Render the footer section
     */
    renderFooter() {
        return `
            <footer class="admin-footer py-3 border-top">
                <div class="container-fluid">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="text-muted small">
                            Kanva Portal Admin v${window.app?.version || '1.0.0'}
                        </div>
                        <div>
                            <button id="adminLogout" class="btn btn-link btn-sm text-muted">
                                <i class="fas fa-sign-out-alt me-1"></i> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        `;
    }
    
    /**
     * Set the active tab
     * @param {string} tabId - ID of the tab to activate
     */
    setActiveTab(tabId) {
        this.setState({ activeTab: tabId });
    }
    
    /**
     * Get the content container element
     */
    get contentContainer() {
        return this.element?.querySelector('#adminContent');
    }
    
    /**
     * Lifecycle hook - called after component is mounted
     */
    onMount() {
        // Add event listeners
        const saveBtn = this.element.querySelector('#saveAdminChanges');
        const refreshBtn = this.element.querySelector('#refreshData');
        const logoutBtn = this.element.querySelector('#adminLogout');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.emit('save'));
        }
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.emit('refresh'));
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.emit('logout'));
        }
    }
    
    /**
     * Lifecycle hook - called before component is unmounted
     */
    onBeforeUnmount() {
        // Clean up event listeners
        const saveBtn = this.element?.querySelector('#saveAdminChanges');
        const refreshBtn = this.element?.querySelector('#refreshData');
        const logoutBtn = this.element?.querySelector('#adminLogout');
        
        if (saveBtn) {
            saveBtn.removeEventListener('click', () => this.emit('save'));
        }
        
        if (refreshBtn) {
            refreshBtn.removeEventListener('click', () => this.emit('refresh'));
        }
        
        if (logoutBtn) {
            logoutBtn.removeEventListener('click', () => this.emit('logout'));
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.AdminLayout = AdminLayout;
}

export default AdminLayout;
