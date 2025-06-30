/**
 * Tax Utilities
 * Handles tax rate detection and calculation
 */

const TaxUtils = {
    // State tax rates (simplified - in production, use a proper tax service)
    stateTaxRates: {
        'CA': 0.0725,  // California
        'NY': 0.04,    // New York
        'TX': 0.0625,  // Texas
        'WA': 0.065,   // Washington
        'FL': 0.06,    // Florida
        'IL': 0.0625,  // Illinois
        'PA': 0.06,    // Pennsylvania
        'OH': 0.0575,  // Ohio
        'GA': 0.04,    // Georgia
        'NC': 0.0475,  // North Carolina
        'NJ': 0.06625, // New Jersey
        'VA': 0.053,   // Virginia
        'MA': 0.0625,  // Massachusetts
        'AZ': 0.056,   // Arizona
        'CO': 0.029    // Colorado
    },

    // Default tax rate if state not found
    defaultTaxRate: 0.05,

    /**
     * Auto-detect tax rate based on customer location
     * @returns {Promise<number>} The detected tax rate
     */
    async detectTaxRate() {
        try {
            console.log('🏛️ Detecting tax rate...');
            
            // Get customer state from form
            const stateField = document.getElementById('stateTaxRate') || 
                            document.querySelector('input[placeholder*="State"]') ||
                            document.querySelector('select[name*="state"]');
            
            if (!stateField) {
                console.warn('No state field found for tax detection');
                return this.defaultTaxRate;
            }
            
            const state = stateField.value?.trim().toUpperCase();
            if (!state) {
                console.log('No state selected for tax calculation');
                return 0; // No tax if no state selected
            }
            
            // Get tax rate from our table
            const taxRate = this.stateTaxRates[state] || this.defaultTaxRate;
            console.log(`Detected tax rate for ${state}: ${(taxRate * 100).toFixed(2)}%`);
            
            // Update the tax rate field if it exists
            const taxRateField = document.getElementById('taxRate');
            if (taxRateField) {
                taxRateField.value = (taxRate * 100).toFixed(2);
                // Trigger change event to update calculations
                taxRateField.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            return taxRate;
            
        } catch (error) {
            console.error('Error detecting tax rate:', error);
            // Show error notification if available
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.showError('Failed to detect tax rate. Using default rate.');
            }
            return this.defaultTaxRate;
        }
    },
    
    /**
     * Calculate tax amount for a given subtotal and state
     * @param {number} subtotal - The subtotal amount
     * @param {string} state - The state code (e.g., 'CA', 'NY')
     * @returns {number} The calculated tax amount
     */
    calculateTax(subtotal, state) {
        if (!state) return 0;
        const rate = this.stateTaxRates[state.toUpperCase()] || 0;
        return subtotal * rate;
    },
    
    /**
     * Get all available states with tax rates
     * @returns {Array} Array of state objects with code, name, and rate
     */
    getAllStates() {
        return Object.entries(this.stateTaxRates).map(([code, rate]) => ({
            code,
            name: this.getStateName(code),
            rate: rate * 100 // Convert to percentage
        }));
    },
    
    /**
     * Get state name from state code
     * @private
     */
    getStateName(code) {
        const stateNames = {
            'CA': 'California', 'TX': 'Texas', 'FL': 'Florida', 'NY': 'New York',
            'PA': 'Pennsylvania', 'IL': 'Illinois', 'OH': 'Ohio', 'GA': 'Georgia',
            'NC': 'North Carolina', 'MI': 'Michigan', 'NJ': 'New Jersey',
            'VA': 'Virginia', 'WA': 'Washington', 'AZ': 'Arizona', 'MA': 'Massachusetts',
            'TN': 'Tennessee', 'IN': 'Indiana', 'MO': 'Missouri', 'MD': 'Maryland'
        };
        return stateNames[code] || code;
    },

    /**
     * Auto-detect tax rate and update form field
     * Compatible with HTML onclick handlers
     */
    autoDetectTaxRate() {
        try {
            console.log('🏛️ Auto-detecting tax rate...');
            
            // Get customer state from various possible fields
            const stateField = document.getElementById('stateTaxRate') || 
                              document.getElementById('customerState') ||
                              document.querySelector('input[placeholder*="State"]') ||
                              document.querySelector('select[name*="state"]');
            
            if (!stateField) {
                console.warn('No state field found for tax detection');
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.showWarning('Please enter customer state for accurate tax calculation');
                }
                return;
            }

            let state = '';
            
            // Try to get state from different possible fields
            if (stateField.value) {
                state = stateField.value.toUpperCase().substring(0, 2);
            } else {
                // Try to get from customer info fields
                const customerFields = ['customerState', 'companyState', 'billingState'];
                for (const fieldId of customerFields) {
                    const field = document.getElementById(fieldId);
                    if (field && field.value) {
                        state = field.value.toUpperCase().substring(0, 2);
                        break;
                    }
                }
            }

            if (!state) {
                console.warn('No state information found');
                if (typeof NotificationManager !== 'undefined') {
                    NotificationManager.showInfo('Enter customer state to calculate tax automatically');
                }
                return;
            }

            // Get tax rate for state (convert from percentage to decimal)
            const taxRatePercent = (this.stateTaxRates[state] || this.defaultTaxRate) * 100;
            
            // Update the state tax rate field
            const stateTaxInput = document.getElementById('stateTaxRate');
            if (stateTaxInput) {
                stateTaxInput.value = taxRatePercent.toFixed(2);
            }

            // Log success
            console.log(`✅ Tax rate for ${state}: ${taxRatePercent}%`);
            
            if (typeof NotificationManager !== 'undefined') {
                if (taxRatePercent > 0) {
                    NotificationManager.showSuccess(`Tax rate detected: ${taxRatePercent}% for ${state}`);
                } else {
                    NotificationManager.showInfo(`${state} has no state sales tax`);
                }
            }

            // Trigger calculation update if calculator is available
            if (typeof window.calculator !== 'undefined' && window.calculator.calculateAll) {
                window.calculator.calculateAll();
            } else if (typeof calculateMultiProductTotal === 'function') {
                calculateMultiProductTotal();
            }

        } catch (error) {
            console.error('❌ Error auto-detecting tax rate:', error);
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.showError('Failed to auto-detect tax rate: ' + error.message);
            }
        }
    }
};

// Make available globally
window.TaxUtils = TaxUtils;

// Global wrapper function for HTML onclick compatibility
window.autoDetectTaxRate = function() {
    return TaxUtils.autoDetectTaxRate();
};

console.log('✅ TaxUtils loaded successfully');
if (typeof window !== 'undefined') {
    window.TaxUtils = TaxUtils;
}

// Export for CommonJS
try {
    module.exports = TaxUtils;
} catch (e) {}
