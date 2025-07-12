import { BaseComponent, Form, Modal } from '../index';

/**
 * Integrations Tab Component
 * Manages third-party integrations in the admin dashboard
 */
class IntegrationsTab extends BaseComponent {
    /**
     * Create a new IntegrationsTab
     * @param {Object} options - Component options
     * @param {Object} [options.integrations={}] - Initial integrations configuration
     * @param {Function} [options.onSave] - Callback when integrations are saved
     */
    constructor({
        integrations = {},
        onSave = null,
        ...rest
    } = {}) {
        super({
            integrations: this.normalizeIntegrationsData(integrations),
            isSaving: false,
            ...rest
        });

        // Bind methods
        this.handleSave = this.handleSave.bind(this);
        this.handleCopperAuth = this.handleCopperAuth.bind(this);
        this.renderIntegrationCard = this.renderIntegrationCard.bind(this);
    }

    /**
     * Normalize integrations data to ensure consistent structure
     */
    normalizeIntegrationsData(integrations) {
        return {
            copper: {
                enabled: false,
                apiKey: '',
                userEmail: '',
                ...(integrations.copper || {})
            },
            // Add other integrations here as needed
            ...integrations
        };
    }

    /**
     * Render the integrations tab
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'integrations-tab';
        
        // Header
        const header = document.createElement('div');
        header.className = 'd-flex justify-content-between align-items-center mb-4';
        header.innerHTML = `
            <div>
                <h3 class="mb-1">Integrations</h3>
                <p class="text-muted mb-0">Connect third-party services to extend functionality</p>
            </div>
        `;
        
        // Integrations list
        const integrationsList = document.createElement('div');
        integrationsList.className = 'row g-4';
        
        // Copper CRM Integration Card
        integrationsList.appendChild(this.renderIntegrationCard(
            'Copper CRM',
            'copper',
            'Connect with Copper CRM to sync customer data and opportunities',
            'fas fa-address-card',
            'primary',
            this.data.integrations.copper || { enabled: false }
        ));
        
        // Add more integration cards here as needed
        
        // Assemble the component
        this.element.appendChild(header);
        this.element.appendChild(integrationsList);
        
        // Add event listeners
        this.addEventListeners();
        
        return this.element;
    }
    
    /**
     * Render an integration card
     */
    renderIntegrationCard(name, id, description, icon, color, config) {
        const card = document.createElement('div');
        card.className = 'col-md-6';
        card.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <div class="icon-container bg-${color}-subtle text-${color} rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                            <i class="${icon} fa-lg"></i>
                        </div>
                        <h5 class="card-title mb-0">${name}</h5>
                        <div class="form-check form-switch ms-auto">
                            <input class="form-check-input integration-toggle" 
                                   type="checkbox" 
                                   role="switch" 
                                   id="${id}Enabled"
                                   data-integration="${id}"
                                   ${config.enabled ? 'checked' : ''}>
                            <label class="form-check-label" for="${id}Enabled">
                                ${config.enabled ? 'Enabled' : 'Disabled'}
                            </label>
                        </div>
                    </div>
                    <p class="card-text text-muted">${description}</p>
                    
                    <div class="integration-settings" id="${id}Settings" 
                         style="display: ${config.enabled ? 'block' : 'none'};">
                        ${this.renderIntegrationSettings(id, config)}
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }
    
    /**
     * Render integration-specific settings
     */
    renderIntegrationSettings(integrationId, config) {
        switch (integrationId) {
            case 'copper':
                return this.renderCopperSettings(config);
            // Add cases for other integrations
            default:
                return '<div class="alert alert-warning">No configuration available for this integration.</div>';
        }
    }
    
    /**
     * Render Copper CRM settings
     */
    renderCopperSettings(config) {
        const isConfigured = config.apiKey && config.userEmail;
        
        return `
            <div class="copper-settings">
                ${isConfigured ? this.renderCopperConnectedState(config) : this.renderCopperSetupForm(config)}
                
                <div class="mt-3 pt-3 border-top">
                    <h6 class="mb-2">Documentation</h6>
                    <ul class="list-unstyled">
                        <li class="mb-1">
                            <a href="https://developer.copper.com/" target="_blank" class="text-decoration-none">
                                <i class="fas fa-external-link-alt me-1"></i> Copper API Documentation
                            </a>
                        </li>
                        <li class="mb-1">
                            <a href="https://app.copper.com/account/api_keys" target="_blank" class="text-decoration-none">
                                <i class="fas fa-key me-1"></i> Get API Key
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    /**
     * Render Copper connected state
     */
    renderCopperConnectedState(config) {
        return `
            <div class="alert alert-success">
                <div class="d-flex align-items-center">
                    <i class="fas fa-check-circle me-2"></i>
                    <div>
                        <strong>Connected to Copper CRM</strong>
                        <div class="small">
                            Authenticated as ${config.userEmail}
                        </div>
                    </div>
                    <button class="btn btn-sm btn-outline-secondary ms-auto" id="reconnectCopper">
                        Reconnect
                    </button>
                </div>
            </div>
            
            <div class="mb-3">
                <label class="form-label">API Status</label>
                <div class="d-flex align-items-center">
                    <div class="me-2">
                        <span class="badge bg-success">Connected</span>
                    </div>
                    <div class="spinner-border spinner-border-sm text-primary d-none" role="status" id="copperStatusSpinner">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <button class="btn btn-sm btn-outline-primary ms-auto" id="testCopperConnection">
                        Test Connection
                    </button>
                </div>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Synchronization</label>
                <div class="d-flex flex-wrap gap-2">
                    <button class="btn btn-sm btn-outline-secondary" id="syncCopperCustomers">
                        <i class="fas fa-sync me-1"></i> Sync Customers
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" id="syncCopperOpportunities">
                        <i class="fas fa-exchange-alt me-1"></i> Sync Opportunities
                    </button>
                </div>
                <div class="form-text">Last sync: ${config.lastSync || 'Never'}</div>
            </div>
            
            <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                <button class="btn btn-sm btn-outline-danger" id="disconnectCopper">
                    <i class="fas fa-unlink me-1"></i> Disconnect
                </button>
                <button class="btn btn-sm btn-outline-secondary" id="showCopperSettings">
                    <i class="fas fa-cog me-1"></i> Advanced Settings
                </button>
            </div>
        `;
    }
    
    /**
     * Render Copper setup form
     */
    renderCopperSetupForm() {
        return `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                Connect your Copper account to sync customer data and opportunities.
            </div>
            
            <form id="copperSetupForm">
                <div class="mb-3">
                    <label for="copperUserEmail" class="form-label">Copper Email</label>
                    <input type="email" class="form-control" id="copperUserEmail" 
                           placeholder="your.email@example.com" required>
                    <div class="form-text">The email address you use to log in to Copper</div>
                </div>
                
                <div class="mb-3">
                    <label for="copperApiKey" class="form-label">API Key</label>
                    <div class="input-group">
                        <input type="password" class="form-control" id="copperApiKey" 
                               placeholder="Enter your API key" required>
                        <button class="btn btn-outline-secondary" type="button" id="toggleApiKey">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <div class="form-text">
                        <a href="https://app.copper.com/account/api_keys" target="_blank" class="text-decoration-none">
                            <i class="fas fa-external-link-alt me-1"></i> Get your API key from Copper
                        </a>
                    </div>
                </div>
                
                <div class="d-grid gap-2">
                    <button type="submit" class="btn btn-primary" id="connectCopper">
                        <span class="spinner-border spinner-border-sm me-2 d-none" role="status" id="copperConnectSpinner">
                            <span class="visually-hidden">Loading...</span>
                        </span>
                        Connect to Copper
                    </button>
                </div>
            </form>
        `;
    }
    
    /**
     * Handle save
     */
    handleSave(updatedIntegrations) {
        this.setState({
            isSaving: true,
            integrations: updatedIntegrations
        });
        
        // In a real app, this would be an API call
        console.log('Saving integrations:', updatedIntegrations);
        
        // Simulate API call
        setTimeout(() => {
            this.setState({ isSaving: false });
            
            // Notify parent component
            if (typeof this.data.onSave === 'function') {
                this.data.onSave(updatedIntegrations);
            }
            
            this.showNotification('Integration settings saved successfully', 'success');
        }, 1000);
    }
    
    /**
     * Handle Copper authentication
     */
    handleCopperAuth(action, credentials = null) {
        // In a real app, this would make an API call to authenticate with Copper
        console.log(`Copper auth action: ${action}`, credentials);
        
        // Show loading state
        const spinner = document.getElementById('copperConnectSpinner');
        const connectBtn = document.getElementById('connectCopper');
        
        if (spinner && connectBtn) {
            spinner.classList.remove('d-none');
            connectBtn.disabled = true;
        }
        
        // Simulate API call
        setTimeout(() => {
            if (action === 'connect') {
                // Update UI to show connected state
                const settingsContainer = document.querySelector('.copper-settings');
                if (settingsContainer) {
                    settingsContainer.innerHTML = this.renderCopperConnectedState({
                        ...credentials,
                        lastSync: new Date().toLocaleString()
                    });
                    this.addEventListeners();
                }
                
                // Update integrations state
                const updatedIntegrations = {
                    ...this.data.integrations,
                    copper: {
                        enabled: true,
                        ...credentials,
                        lastSync: new Date().toISOString()
                    }
                };
                
                this.handleSave(updatedIntegrations);
            } else if (action === 'disconnect') {
                // Update UI to show setup form
                const settingsContainer = document.querySelector('.copper-settings');
                if (settingsContainer) {
                    settingsContainer.innerHTML = this.renderCopperSetupForm();
                    this.addEventListeners();
                }
                
                // Update integrations state
                const { copper, ...otherIntegrations } = this.data.integrations;
                this.handleSave(otherIntegrations);
            } else if (action === 'test') {
                // Test connection
                this.showNotification('Connection to Copper CRM successful!', 'success');
            }
        }, 1500);
    }
    
    /**
     * Show a notification
     */
    showNotification(message, type = 'info') {
        // In a real app, you would use a notification component
        console.log(`[${type.toUpperCase()}] ${message}`);
        // This would typically show a toast notification
        alert(`${type.toUpperCase()}: ${message}`);
    }
    
    /**
     * Add event listeners
     */
    addEventListeners() {
        // Toggle integration
        const toggleSwitches = this.element.querySelectorAll('.integration-toggle');
        toggleSwitches.forEach(switchEl => {
            switchEl.addEventListener('change', (e) => {
                const integrationId = e.target.getAttribute('data-integration');
                const isEnabled = e.target.checked;
                
                // Toggle settings visibility
                const settingsEl = document.getElementById(`${integrationId}Settings`);
                if (settingsEl) {
                    settingsEl.style.display = isEnabled ? 'block' : 'none';
                }
                
                // Update state
                const updatedIntegrations = {
                    ...this.data.integrations,
                    [integrationId]: {
                        ...(this.data.integrations[integrationId] || {}),
                        enabled: isEnabled
                    }
                };
                
                this.handleSave(updatedIntegrations);
            });
        });
        
        // Copper Connect Form
        const copperForm = this.element.querySelector('#copperSetupForm');
        if (copperForm) {
            copperForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const email = document.getElementById('copperUserEmail').value.trim();
                const apiKey = document.getElementById('copperApiKey').value.trim();
                
                if (!email || !apiKey) {
                    this.showNotification('Please fill in all required fields', 'error');
                    return;
                }
                
                this.handleCopperAuth('connect', {
                    userEmail: email,
                    apiKey: apiKey
                });
            });
        }
        
        // Toggle API key visibility
        const toggleApiKeyBtn = this.element.querySelector('#toggleApiKey');
        if (toggleApiKeyBtn) {
            toggleApiKeyBtn.addEventListener('click', () => {
                const apiKeyInput = document.getElementById('copperApiKey');
                if (apiKeyInput) {
                    const type = apiKeyInput.type === 'password' ? 'text' : 'password';
                    apiKeyInput.type = type;
                    toggleApiKeyBtn.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
                }
            });
        }
        
        // Copper Actions
        const copperActions = ['disconnect', 'test', 'reconnect', 'syncCustomers', 'syncOpportunities'];
        copperActions.forEach(action => {
            const btn = this.element.querySelector(`#${action}Copper`);
            if (btn) {
                btn.addEventListener('click', () => {
                    if (action === 'test') {
                        const spinner = document.getElementById('copperStatusSpinner');
                        if (spinner) spinner.classList.remove('d-none');
                        
                        this.handleCopperAuth('test');
                        
                        setTimeout(() => {
                            if (spinner) spinner.classList.add('d-none');
                        }, 1500);
                    } else if (action === 'disconnect') {
                        if (confirm('Are you sure you want to disconnect from Copper? This will remove your API key and disable the integration.')) {
                            this.handleCopperAuth('disconnect');
                        }
                    } else if (action === 'reconnect') {
                        const settingsContainer = document.querySelector('.copper-settings');
                        if (settingsContainer) {
                            settingsContainer.innerHTML = this.renderCopperSetupForm();
                            this.addEventListeners();
                        }
                    } else if (action === 'syncCustomers' || action === 'syncOpportunities') {
                        const type = action === 'syncCustomers' ? 'customers' : 'opportunities';
                        this.showNotification(`Syncing ${type} with Copper...`, 'info');
                        // In a real app, this would trigger a sync
                    }
                });
            }
        });
    }
    
    /**
     * Lifecycle hook - called after component is mounted
     */
    onMount() {
        // Add any additional setup needed after the component is mounted
    }
    
    /**
     * Lifecycle hook - called before component is unmounted
     */
    onBeforeUnmount() {
        // Clean up any event listeners or resources
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.IntegrationsTab = IntegrationsTab;
}

export default IntegrationsTab;
