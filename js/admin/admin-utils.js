/**
 * Admin Utilities
 * Handles admin panel UI interactions and settings management
 */

const AdminUtils = {
    /**
     * Show the admin panel
     */
    showAdminPanel() {
        const panel = document.getElementById('adminPanel');
        if (panel) {
            panel.classList.add('show');
            this.populateAdminFields();
            // Focus first input for better UX
            const firstInput = panel.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        }
    },

    /**
     * Hide the admin panel
     */
    hideAdminPanel() {
        const panel = document.getElementById('adminPanel');
        if (panel) {
            panel.classList.remove('show');
        }
    },

    /**
     * Populate admin form fields with current settings
     */
    populateAdminFields() {
        try {
            // Get current settings from config or use defaults
            const settings = {
                adminEmail: localStorage.getItem('adminEmail') || '',
                apiKey: localStorage.getItem('apiKey') || '',
                taxEnabled: localStorage.getItem('taxEnabled') === 'true' || false,
                defaultTaxRate: localStorage.getItem('defaultTaxRate') || '0.05',
                currency: localStorage.getItem('currency') || 'USD',
                companyName: localStorage.getItem('companyName') || 'Kanva Botanicals',
                // Add more settings as needed
            };

            // Set form field values
            for (const [key, value] of Object.entries(settings)) {
                const input = document.querySelector(`#adminSettings [name="${key}"]`);
                if (!input) continue;

                if (input.type === 'checkbox') {
                    input.checked = Boolean(value);
                } else {
                    input.value = value;
                }
            }

            console.log('Admin settings form populated');
        } catch (error) {
            console.error('Error populating admin fields:', error);
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.showError('Failed to load admin settings');
            }
        }
    },

    /**
     * Save admin settings from the form
     */
    async saveAdminSettings() {
        try {
            const form = document.getElementById('adminSettings');
            if (!form) throw new Error('Admin settings form not found');

            const formData = new FormData(form);
            const settings = {};

            // Convert FormData to plain object
            for (const [key, value] of formData.entries()) {
                settings[key] = value;
            }

            // Handle checkboxes
            form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                settings[checkbox.name] = checkbox.checked;
            });

            // Validate settings
            if (settings.adminEmail && !this.validateEmail(settings.adminEmail)) {
                throw new Error('Please enter a valid email address');
            }

            // Save to localStorage (in a real app, this would be an API call)
            for (const [key, value] of Object.entries(settings)) {
                localStorage.setItem(key, value);
            }

            console.log('Admin settings saved:', settings);
            
            // Show success message
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.showSuccess('Settings saved successfully');
            }

            // Close the panel after a short delay
            setTimeout(() => this.hideAdminPanel(), 1000);

            // Trigger settings update event
            document.dispatchEvent(new CustomEvent('adminSettingsUpdated', { detail: settings }));

            return true;
        } catch (error) {
            console.error('Error saving admin settings:', error);
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.showError(`Save failed: ${error.message}`);
            }
            return false;
        }
    },

    /**
     * Reset admin settings to defaults
     */
    resetAdminSettings() {
        if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
            return false;
        }

        try {
            // Clear all settings
            const settingsForm = document.getElementById('adminSettings');
            if (settingsForm) {
                settingsForm.reset();
            }

            // Clear all stored settings
            const settingsKeys = [
                'adminEmail', 'apiKey', 'taxEnabled', 'defaultTaxRate',
                'currency', 'companyName'
            ];
            
            settingsKeys.forEach(key => localStorage.removeItem(key));

            // Show success message
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.showSuccess('Settings reset to defaults');
            }

            return true;
        } catch (error) {
            console.error('Error resetting admin settings:', error);
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.showError('Failed to reset settings');
            }
            return false;
        }
    },

    /**
     * Export admin configuration
     */
    exportAdminConfig() {
        try {
            // Get all settings from localStorage
            const settings = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                settings[key] = localStorage.getItem(key);
            }

            // Create a download link
            const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(settings, null, 2))}`;
            const downloadLink = document.createElement('a');
            downloadLink.setAttribute('href', dataStr);
            downloadLink.setAttribute('download', `kanva-settings-${new Date().toISOString().split('T')[0]}.json`);
            
            // Trigger download
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // Show success message
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.showSuccess('Settings exported successfully');
            }

            return true;
        } catch (error) {
            console.error('Error exporting admin settings:', error);
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.showError('Failed to export settings');
            }
            return false;
        }
    },

    /**
     * Validate email address
     * @private
     */
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }
};

// Make available globally
window.AdminUtils = AdminUtils;

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners for admin panel buttons
    const showAdminBtn = document.getElementById('showAdminBtn');
    const closeAdminBtn = document.getElementById('closeAdminBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const resetSettingsBtn = document.getElementById('resetSettingsBtn');
    const exportSettingsBtn = document.getElementById('exportSettingsBtn');

    if (showAdminBtn) {
        showAdminBtn.addEventListener('click', () => AdminUtils.showAdminPanel());
    }

    if (closeAdminBtn) {
        closeAdminBtn.addEventListener('click', () => AdminUtils.hideAdminPanel());
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            AdminUtils.saveAdminSettings();
        });
    }

    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            AdminUtils.resetAdminSettings();
        });
    }

    if (exportSettingsBtn) {
        exportSettingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            AdminUtils.exportAdminConfig();
        });
    }
});

// Make available globally
if (typeof window !== 'undefined') {
    window.AdminUtils = AdminUtils;
}

// Export for CommonJS
try {
    module.exports = AdminUtils;
} catch (e) {}
