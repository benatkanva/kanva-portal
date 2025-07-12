import BaseComponent from './BaseComponent';

/**
 * Tab Navigation Component
 * Handles tab switching in the admin dashboard
 */
class TabNavigation extends BaseComponent {
    /**
     * Create a new TabNavigation
     * @param {Object} options - Component options
     * @param {string} [options.activeTab='products'] - ID of the active tab
     * @param {Array} [options.tabs=[]] - Array of tab objects with {id, label, icon, badge, disabled}
     * @param {string} [options.orientation='horizontal'] - 'horizontal' or 'vertical'
     */
    constructor({
        activeTab = 'products',
        tabs = [
            { id: 'products', label: 'Products', icon: 'box' },
            { id: 'tiers', label: 'Pricing Tiers', icon: 'tags' },
            { id: 'shipping', label: 'Shipping', icon: 'truck' },
            { id: 'integrations', label: 'Integrations', icon: 'plug' },
            { id: 'settings', label: 'Settings', icon: 'cog' }
        ],
        orientation = 'horizontal',
        ...rest
    } = {}) {
        super({
            activeTab,
            tabs,
            orientation,
            ...rest
        });
        
        // Bind methods
        this.setActiveTab = this.setActiveTab.bind(this);
        this.handleTabClick = this.handleTabClick.bind(this);
    }
    
    /**
     * Render the tab navigation
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = `admin-tab-navigation ${this.data.orientation}`;
        
        const nav = document.createElement('nav');
        nav.className = 'nav';
        
        if (this.data.orientation === 'vertical') {
            nav.classList.add('flex-column');
        }
        
        nav.innerHTML = this.data.tabs.map(tab => this.renderTab(tab)).join('');
        
        this.element.appendChild(nav);
        return this.element;
    }
    
    /**
     * Render a single tab
     * @param {Object} tab - Tab configuration
     */
    renderTab(tab) {
        const isActive = tab.id === this.data.activeTab;
        const isDisabled = tab.disabled || false;
        const badge = tab.badge ? `<span class="badge bg-primary ms-2">${tab.badge}</span>` : '';
        
        return `
            <button class="nav-link ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}"
                    data-tab="${tab.id}"
                    ${isDisabled ? 'disabled' : ''}>
                <i class="fas fa-${tab.icon || 'circle'} me-2"></i>
                ${tab.label}
                ${badge}
            </button>
        `;
    }
    
    /**
     * Set the active tab
     * @param {string} tabId - ID of the tab to activate
     */
    setActiveTab(tabId) {
        if (!this.data.tabs.some(tab => tab.id === tabId)) {
            console.warn(`Tab with ID "${tabId}" not found`);
            return;
        }
        
        this.setState({ activeTab: tabId });
        this.emit('tabChange', tabId);
    }
    
    /**
     * Handle tab click event
     * @param {Event} e - Click event
     */
    handleTabClick(e) {
        const tabButton = e.target.closest('.nav-link');
        if (!tabButton) return;
        
        e.preventDefault();
        
        const tabId = tabButton.dataset.tab;
        if (tabId && tabId !== this.data.activeTab) {
            this.setActiveTab(tabId);
        }
    }
    
    /**
     * Lifecycle hook - called after component is mounted
     */
    onMount() {
        this.element.addEventListener('click', this.handleTabClick);
    }
    
    /**
     * Lifecycle hook - called before component is unmounted
     */
    onBeforeUnmount() {
        this.element.removeEventListener('click', this.handleTabClick);
    }
    
    /**
     * Update the tab badge
     * @param {string} tabId - ID of the tab
     * @param {string|number|null} badge - Badge text or null to remove
     */
    updateTabBadge(tabId, badge) {
        const tab = this.data.tabs.find(t => t.id === tabId);
        if (!tab) return;
        
        const newTabs = this.data.tabs.map(t => 
            t.id === tabId ? { ...t, badge } : t
        );
        
        this.setState({ tabs: newTabs });
    }
    
    /**
     * Enable/disable a tab
     * @param {string} tabId - ID of the tab
     * @param {boolean} disabled - Whether to disable the tab
     */
    setTabDisabled(tabId, disabled = true) {
        const newTabs = this.data.tabs.map(tab => 
            tab.id === tabId ? { ...tab, disabled } : tab
        );
        
        this.setState({ tabs: newTabs });
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.TabNavigation = TabNavigation;
}

export default TabNavigation;
