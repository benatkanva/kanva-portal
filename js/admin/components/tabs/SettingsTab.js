import { BaseComponent, Form, Modal } from '../index';

/**
 * Settings Tab Component
 * Manages application-wide settings in the admin dashboard
 */
class SettingsTab extends BaseComponent {
    /**
     * Create a new SettingsTab
     * @param {Object} options - Component options
     * @param {Object} [options.settings={}] - Initial settings
     * @param {Function} [options.onSave] - Callback when settings are saved
     */
    constructor({
        settings = {},
        onSave = null,
        ...rest
    } = {}) {
        super({
            settings: this.normalizeSettings(settings),
            isSaving: false,
            activeTab: 'general',
            ...rest
        });

        // Bind methods
        this.handleSave = this.handleSave.bind(this);
        this.handleTabChange = this.handleTabChange.bind(this);
        this.showResetConfirmation = this.showResetConfirmation.bind(this);
    }

    /**
     * Normalize settings to ensure consistent structure
     */
    normalizeSettings(settings) {
        return {
            general: {
                siteTitle: 'Kanva Portal',
                adminEmail: 'admin@example.com',
                timezone: 'America/Los_Angeles',
                dateFormat: 'MM/DD/YYYY',
                timeFormat: '12h',
                itemsPerPage: 10,
                ...(settings.general || {})
            },
            display: {
                theme: 'light',
                primaryColor: '#0d6efd',
                secondaryColor: '#6c757d',
                enableAnimations: true,
                showHelpText: true,
                ...(settings.display || {})
            },
            security: {
                require2FA: false,
                sessionTimeout: 30, // minutes
                passwordExpiry: 90, // days
                failedLoginAttempts: 5,
                ...(settings.security || {})
            },
            notifications: {
                emailNotifications: true,
                emailOrderConfirmation: true,
                emailShippingUpdate: true,
                emailMarketing: false,
                ...(settings.notifications || {})
            },
            maintenance: {
                maintenanceMode: false,
                maintenanceMessage: 'We\'re currently performing scheduled maintenance. We\'ll be back soon!',
                ...(settings.maintenance || {})
            },
            // Add any additional settings sections here
            ...settings
        };
    }

    /**
     * Render the settings tab
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'settings-tab';
        
        // Header
        const header = document.createElement('div');
        header.className = 'd-flex justify-content-between align-items-center mb-4';
        header.innerHTML = `
            <div>
                <h3 class="mb-1">Settings</h3>
                <p class="text-muted mb-0">Configure application settings and preferences</p>
            </div>
            <div>
                <button class="btn btn-outline-secondary me-2" id="resetSettingsBtn">
                    <i class="fas fa-undo me-1"></i> Reset to Defaults
                </button>
                <button class="btn btn-primary" id="saveSettingsBtn" disabled>
                    <span class="spinner-border spinner-border-sm me-2 d-none" id="saveSettingsSpinner"></span>
                    Save Changes
                </button>
            </div>
        `;
        
        // Settings content
        const content = document.createElement('div');
        content.className = 'row g-4';
        
        // Sidebar navigation
        const sidebar = document.createElement('div');
        sidebar.className = 'col-md-3';
        sidebar.innerHTML = `
            <div class="list-group">
                <a href="#" class="list-group-item list-group-item-action ${this.data.activeTab === 'general' ? 'active' : ''}" 
                   data-tab="general">
                    <i class="fas fa-cog me-2"></i> General
                </a>
                <a href="#" class="list-group-item list-group-item-action ${this.data.activeTab === 'display' ? 'active' : ''}" 
                   data-tab="display">
                    <i class="fas fa-palette me-2"></i> Display
                </a>
                <a href="#" class="list-group-item list-group-item-action ${this.data.activeTab === 'security' ? 'active' : ''}" 
                   data-tab="security">
                    <i class="fas fa-shield-alt me-2"></i> Security
                </a>
                <a href="#" class="list-group-item list-group-item-action ${this.data.activeTab === 'notifications' ? 'active' : ''}" 
                   data-tab="notifications">
                    <i class="fas fa-bell me-2"></i> Notifications
                </a>
                <a href="#" class="list-group-item list-group-item-action ${this.data.activeTab === 'maintenance' ? 'active' : ''}" 
                   data-tab="maintenance">
                    <i class="fas fa-tools me-2"></i> Maintenance
                </a>
            </div>
        `;
        
        // Main content area
        const mainContent = document.createElement('div');
        mainContent.className = 'col-md-9';
        mainContent.id = 'settingsContent';
        
        // Assemble the content
        content.appendChild(sidebar);
        content.appendChild(mainContent);
        
        // Assemble the component
        this.element.appendChild(header);
        this.element.appendChild(content);
        
        // Render the active tab
        this.renderActiveTab();
        
        // Add event listeners
        this.addEventListeners();
        
        return this.element;
    }
    
    /**
     * Render the active settings tab
     */
    renderActiveTab() {
        const content = this.element.querySelector('#settingsContent');
        if (!content) return;
        
        content.innerHTML = '';
        
        switch (this.data.activeTab) {
            case 'general':
                this.renderGeneralSettings(content);
                break;
            case 'display':
                this.renderDisplaySettings(content);
                break;
            case 'security':
                this.renderSecuritySettings(content);
                break;
            case 'notifications':
                this.renderNotificationSettings(content);
                break;
            case 'maintenance':
                this.renderMaintenanceSettings(content);
                break;
            default:
                this.renderGeneralSettings(content);
        }
    }
    
    /**
     * Render General settings
     */
    renderGeneralSettings(container) {
        const { general } = this.data.settings;
        
        const form = new Form({
            id: 'generalSettingsForm',
            fields: [
                {
                    type: 'text',
                    name: 'siteTitle',
                    label: 'Site Title',
                    value: general.siteTitle,
                    required: true
                },
                {
                    type: 'email',
                    name: 'adminEmail',
                    label: 'Admin Email',
                    value: general.adminEmail,
                    required: true
                },
                {
                    type: 'select',
                    name: 'timezone',
                    label: 'Timezone',
                    value: general.timezone,
                    options: [
                        { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
                        { value: 'America/Denver', label: 'Mountain Time (MT)' },
                        { value: 'America/Chicago', label: 'Central Time (CT)' },
                        { value: 'America/New_York', label: 'Eastern Time (ET)' },
                        { value: 'UTC', label: 'UTC' }
                    ],
                    required: true
                },
                {
                    type: 'select',
                    name: 'dateFormat',
                    label: 'Date Format',
                    value: general.dateFormat,
                    options: [
                        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                        { value: 'MMM D, YYYY', label: 'MMM D, YYYY' },
                        { value: 'D MMM, YYYY', label: 'D MMM, YYYY' }
                    ],
                    required: true
                },
                {
                    type: 'select',
                    name: 'timeFormat',
                    label: 'Time Format',
                    value: general.timeFormat,
                    options: [
                        { value: '12h', label: '12-hour (2:30 PM)' },
                        { value: '24h', label: '24-hour (14:30)' }
                    ],
                    required: true
                },
                {
                    type: 'number',
                    name: 'itemsPerPage',
                    label: 'Items Per Page',
                    value: general.itemsPerPage,
                    min: 5,
                    max: 100,
                    helpText: 'Number of items to display per page in tables and lists'
                }
            ],
            onChange: () => this.enableSaveButton()
        });
        
        container.appendChild(form.render());
    }
    
    /**
     * Render Display settings
     */
    renderDisplaySettings(container) {
        const { display } = this.data.settings;
        
        const form = new Form({
            id: 'displaySettingsForm',
            fields: [
                {
                    type: 'select',
                    name: 'theme',
                    label: 'Theme',
                    value: display.theme,
                    options: [
                        { value: 'light', label: 'Light' },
                        { value: 'dark', label: 'Dark' },
                        { value: 'system', label: 'System Default' }
                    ]
                },
                {
                    type: 'color',
                    name: 'primaryColor',
                    label: 'Primary Color',
                    value: display.primaryColor
                },
                {
                    type: 'color',
                    name: 'secondaryColor',
                    label: 'Secondary Color',
                    value: display.secondaryColor
                },
                {
                    type: 'checkbox',
                    name: 'enableAnimations',
                    label: 'Enable Animations',
                    checked: display.enableAnimations,
                    helpText: 'Enable UI animations and transitions'
                },
                {
                    type: 'checkbox',
                    name: 'showHelpText',
                    label: 'Show Help Text',
                    checked: display.showHelpText,
                    helpText: 'Display helpful tooltips and guidance throughout the interface'
                }
            ],
            onChange: () => this.enableSaveButton()
        });
        
        container.appendChild(form.render());
    }
    
    /**
     * Render Security settings
     */
    renderSecuritySettings(container) {
        const { security } = this.data.settings;
        
        const form = new Form({
            id: 'securitySettingsForm',
            fields: [
                {
                    type: 'checkbox',
                    name: 'require2FA',
                    label: 'Require Two-Factor Authentication',
                    checked: security.require2FA,
                    helpText: 'Enforce two-factor authentication for all admin users'
                },
                {
                    type: 'number',
                    name: 'sessionTimeout',
                    label: 'Session Timeout (minutes)',
                    value: security.sessionTimeout,
                    min: 5,
                    max: 1440,
                    helpText: 'Duration of inactivity before automatic logout'
                },
                {
                    type: 'number',
                    name: 'passwordExpiry',
                    label: 'Password Expiry (days)',
                    value: security.passwordExpiry,
                    min: 0,
                    helpText: 'Number of days before passwords expire (0 to disable)'
                },
                {
                    type: 'number',
                    name: 'failedLoginAttempts',
                    label: 'Failed Login Attempts',
                    value: security.failedLoginAttempts,
                    min: 1,
                    helpText: 'Number of failed login attempts before account lockout'
                }
            ],
            onChange: () => this.enableSaveButton()
        });
        
        container.appendChild(form.render());
    }
    
    /**
     * Render Notification settings
     */
    renderNotificationSettings(container) {
        const { notifications } = this.data.settings;
        
        const form = new Form({
            id: 'notificationSettingsForm',
            fields: [
                {
                    type: 'checkbox',
                    name: 'emailNotifications',
                    label: 'Enable Email Notifications',
                    checked: notifications.emailNotifications,
                    helpText: 'Enable or disable all email notifications'
                },
                {
                    type: 'divider',
                    label: 'Email Notifications',
                    helpText: 'Select which email notifications to receive'
                },
                {
                    type: 'checkbox',
                    name: 'emailOrderConfirmation',
                    label: 'Order Confirmations',
                    checked: notifications.emailOrderConfirmation,
                    disabled: !notifications.emailNotifications,
                    helpText: 'Send email when a new order is placed'
                },
                {
                    type: 'checkbox',
                    name: 'emailShippingUpdate',
                    label: 'Shipping Updates',
                    checked: notifications.emailShippingUpdate,
                    disabled: !notifications.emailNotifications,
                    helpText: 'Send email when order status changes'
                },
                {
                    type: 'checkbox',
                    name: 'emailMarketing',
                    label: 'Marketing Emails',
                    checked: notifications.emailMarketing,
                    disabled: !notifications.emailNotifications,
                    helpText: 'Receive promotional and marketing emails'
                }
            ],
            onChange: (formData) => {
                // Toggle disabled state of email notification checkboxes
                if (formData.hasOwnProperty('emailNotifications')) {
                    const checkboxes = container.querySelectorAll('input[type="checkbox"]:not([name="emailNotifications"])');
                    checkboxes.forEach(checkbox => {
                        checkbox.disabled = !formData.emailNotifications;
                    });
                }
                this.enableSaveButton();
            }
        });
        
        container.appendChild(form.render());
    }
    
    /**
     * Render Maintenance settings
     */
    renderMaintenanceSettings(container) {
        const { maintenance } = this.data.settings;
        
        const form = new Form({
            id: 'maintenanceSettingsForm',
            fields: [
                {
                    type: 'checkbox',
                    name: 'maintenanceMode',
                    label: 'Maintenance Mode',
                    checked: maintenance.maintenanceMode,
                    helpText: 'Enable to put the site in maintenance mode. Only administrators will be able to access the site.'
                },
                {
                    type: 'textarea',
                    name: 'maintenanceMessage',
                    label: 'Maintenance Message',
                    value: maintenance.maintenanceMessage,
                    rows: 4,
                    helpText: 'Message to display to users when maintenance mode is active'
                }
            ],
            onChange: () => this.enableSaveButton()
        });
        
        container.appendChild(form.render());
    }
    
    /**
     * Enable the save button
     */
    enableSaveButton() {
        const saveBtn = this.element.querySelector('#saveSettingsBtn');
        if (saveBtn) {
            saveBtn.disabled = false;
        }
    }
    
    /**
     * Handle save settings
     */
    handleSave() {
        const activeTab = this.data.activeTab;
        const form = document.getElementById(`${activeTab}SettingsForm`);
        
        if (!form) return;
        
        const formData = new FormData(form);
        const formValues = {};
        
        // Convert FormData to plain object
        for (let [key, value] of formData.entries()) {
            // Handle checkboxes
            if (value === 'on') {
                formValues[key] = form.querySelector(`[name="${key}"]`).checked;
            } else {
                formValues[key] = value;
            }
        }
        
        // Update settings
        const updatedSettings = {
            ...this.data.settings,
            [activeTab]: {
                ...this.data.settings[activeTab],
                ...formValues
            }
        };
        
        // Show loading state
        const saveBtn = this.element.querySelector('#saveSettingsBtn');
        const spinner = this.element.querySelector('#saveSettingsSpinner');
        
        if (saveBtn) saveBtn.disabled = true;
        if (spinner) spinner.classList.remove('d-none');
        
        // In a real app, this would be an API call
        console.log('Saving settings:', updatedSettings);
        
        // Simulate API call
        setTimeout(() => {
            // Update state
            this.setState({
                settings: updatedSettings,
                isSaving: false
            });
            
            // Reset loading state
            if (saveBtn) saveBtn.disabled = true;
            if (spinner) spinner.classList.add('d-none');
            
            // Notify parent component
            if (typeof this.data.onSave === 'function') {
                this.data.onSave(updatedSettings);
            }
            
            // Show success message
            this.showNotification('Settings saved successfully', 'success');
        }, 1000);
    }
    
    /**
     * Handle tab change
     */
    handleTabChange(tabId) {
        if (tabId === this.data.activeTab) return;
        
        this.setState({
            activeTab: tabId
        });
        
        this.renderActiveTab();
    }
    
    /**
     * Show reset confirmation dialog
     */
    showResetConfirmation() {
        const modal = new Modal({
            title: 'Reset Settings',
            content: `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Warning:</strong> This will reset all ${this.data.activeTab} settings to their default values.
                    This action cannot be undone.
                </div>
                <p>Are you sure you want to continue?</p>
            `,
            size: 'md',
            buttons: [
                {
                    id: 'cancel',
                    label: 'Cancel',
                    variant: 'secondary'
                },
                {
                    id: 'reset',
                    label: 'Reset Settings',
                    variant: 'danger'
                }
            ],
            onButtonClick: (buttonId) => {
                if (buttonId === 'reset') {
                    // Reset to default settings for the current tab
                    const defaultSettings = this.normalizeSettings({});
                    const updatedSettings = {
                        ...this.data.settings,
                        [this.data.activeTab]: defaultSettings[this.data.activeTab]
                    };
                    
                    this.setState({
                        settings: updatedSettings
                    });
                    
                    // Re-render the current tab
                    this.renderActiveTab();
                    
                    // Notify parent component
                    if (typeof this.data.onSave === 'function') {
                        this.data.onSave(updatedSettings);
                    }
                    
                    // Show success message
                    this.showNotification('Settings reset to defaults', 'success');
                }
                
                modal.close();
            }
        });
        
        modal.open();
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
        // Tab navigation
        const tabLinks = this.element.querySelectorAll('[data-tab]');
        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = link.getAttribute('data-tab');
                this.handleTabChange(tabId);
            });
        });
        
        // Save button
        const saveBtn = this.element.querySelector('#saveSettingsBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSave());
        }
        
        // Reset button
        const resetBtn = this.element.querySelector('#resetSettingsBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', this.showResetConfirmation);
        }
        
        // Form changes
        const forms = this.element.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('change', () => this.enableSaveButton());
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
    window.SettingsTab = SettingsTab;
}

export default SettingsTab;
