/**
 * Base Calculator Module
 * Contains shared functionality for all calculator modules
 */

// Expose BaseCalculator globally
window.BaseCalculator = class BaseCalculator {
    constructor(calculator) {
        this.calculator = calculator;
        this.data = calculator.data;
        this.settings = calculator.settings;
    }

    /**
     * Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (this.calculator.notificationManager) {
            this.calculator.notificationManager.show(message, type);
        } else {
            console[type === 'error' ? 'error' : 'log'](`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Show error
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Get product by key
     */
    getProduct(key) {
        if (!key) return null;
        
        if (Array.isArray(this.data.products)) {
            return this.data.products.find(p => p.id === key || p.sku === key);
        } else if (this.data.products && typeof this.data.products === 'object') {
            return this.data.products[key];
        }
        
        return null;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.BaseCalculator = BaseCalculator;
}
