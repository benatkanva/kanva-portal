/**
 * Event Manager
 * Handles all event bindings and event-related functionality
 */

class EventManager {
    constructor(calculator) {
        this.calculator = calculator;
        this.initialized = false;
    }

    bindEvents() {
        if (this.initialized) return;
        
        // Product line events
        document.addEventListener('click', (e) => {
            // Add product line
            if (e.target.matches('#addProductBtn')) {
                e.preventDefault();
                this.calculator.addProductLine();
            }
            
            // Remove product line
            if (e.target.matches('.remove-line-btn')) {
                const lineId = e.target.closest('.product-line').dataset.lineId;
                this.calculator.removeProductLine(lineId);
            }
        });

        // Input change events
        document.addEventListener('change', (e) => {
            const lineElement = e.target.closest('.product-line');
            if (!lineElement) return;
            
            const lineId = lineElement.dataset.lineId;
            const field = e.target.name;
            const value = e.target.value;
            
            this.calculator.updateProductLine(lineId, field, value);
        });

        // Shipping state change
        const stateSelect = document.getElementById('customerState');
        if (stateSelect) {
            stateSelect.addEventListener('change', (e) => {
                this.calculator.currentShippingZone = this.getZoneForState(e.target.value);
                this.calculator.calculateAll();
            });
        }

        // Credit card fee toggle
        const ccFeeToggle = document.getElementById('includeCreditCardFee');
        if (ccFeeToggle) {
            ccFeeToggle.addEventListener('change', () => {
                this.calculator.calculateAll();
            });
        }

        // Manual shipping override
        const manualShipping = document.getElementById('manualShipping');
        if (manualShipping) {
            manualShipping.addEventListener('input', () => {
                this.calculator.calculateAll();
            });
        }

        // Admin events
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-admin-action]')) {
                e.preventDefault();
                const action = e.target.dataset.adminAction;
                this.handleAdminAction(action);
            }
        });

        this.initialized = true;
    }

    getZoneForState(stateCode) {
        if (!stateCode || !this.calculator.dataManager) return null;
        
        const shippingData = this.calculator.dataManager.getShipping();
        if (!shippingData || !shippingData.zones) return null;
        
        for (const [zoneKey, zone] of Object.entries(shippingData.zones)) {
            if (zone.states && zone.states.includes(stateCode)) {
                return zoneKey;
            }
        }
        return null;
    }

    handleAdminAction(action) {
        if (!this.calculator.isAdmin) return;
        
        switch (action) {
            case 'show-product-manager':
                this.calculator.showProductManager();
                break;
            case 'show-tier-manager':
                this.calculator.showTierManager();
                break;
            case 'show-shipping-manager':
                this.calculator.showShippingManager();
                break;
            case 'show-copper-manager':
                this.calculator.showCopperManager();
                break;
            case 'show-github-settings':
                this.calculator.showGitHubSettings();
                break;
            default:
                console.warn('Unknown admin action:', action);
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.EventManager = EventManager;
}
