/**
 * Shipping Zone Component
 * Creates the shipping zone information panel with state selection and manual override
 */
class ShippingZone {
    constructor(options = {}) {
        this.options = {
            showManualOverride: true,
            showZoneMap: false,
            allowStateSelection: true,
            ...options
        };
        this.element = null;
        this.currentState = null;
        this.shippingData = {};
        
        // Ensure component styles are loaded
        this.loadComponentStyles();
    }
    
    /**
     * Load required CSS for this component
     */
    loadComponentStyles() {
        if (window.CSSLoader) {
            // Load shipping zone related styles
            window.CSSLoader.loadComponentCSS('forms');
            window.CSSLoader.loadComponentCSS('cards');
            window.CSSLoader.loadComponentCSS('buttons');
        }
    }

    /**
     * Create the shipping zone element
     * @param {Object} shippingData 
     * @returns {HTMLElement}
     */
    create(shippingData = {}) {
        this.shippingData = shippingData;

        const container = document.createElement('div');
        container.className = 'shipping-zone-container';
        
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-truck"></i> Shipping Zone</h3>
                </div>
                <div class="card-body">
                    ${this.createShippingInfo()}
                    ${this.options.allowStateSelection ? this.createStateSelector() : ''}
                    ${this.options.showManualOverride ? this.createManualOverride() : ''}
                </div>
            </div>
        `;

        this.element = container;
        this.attachEventListeners();
        return container;
    }

    /**
     * Create shipping information display
     * @returns {string}
     */
    createShippingInfo() {
        if (!this.currentState && !this.shippingData.selectedState) {
            return `
                <div id="shippingZoneInfo" class="shipping-zone-info">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        Select a state to see shipping information
                    </div>
                </div>
            `;
        }

        const stateInfo = this.getStateInfo();
        if (!stateInfo) {
            return `
                <div id="shippingZoneInfo" class="shipping-zone-info">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        Shipping information not available for selected state
                    </div>
                </div>
            `;
        }

        return `
            <div id="shippingZoneInfo" class="shipping-zone-info">
                ${this.createZoneDetails(stateInfo)}
            </div>
        `;
    }

    /**
     * Create zone details display
     * @param {Object} stateInfo 
     * @returns {string}
     */
    createZoneDetails(stateInfo) {
        const stateName = stateInfo.name || this.currentState;
        const zone = stateInfo.zone || 'Unknown';
        const rate = stateInfo.rate || 0;
        const transitDays = stateInfo.transitDays || 'N/A';

        return `
            <div class="zone-details">
                <div class="zone-header">
                    <h5 class="mb-2">
                        <i class="fas fa-map-marker-alt text-primary"></i>
                        ${stateName}
                    </h5>
                    <span class="badge bg-primary">Zone ${zone}</span>
                </div>
                
                <div class="zone-info-grid">
                    <div class="zone-info-item">
                        <div class="info-label">Shipping Rate</div>
                        <div class="info-value">
                            <strong>$${rate.toFixed(2)}</strong>
                            <small class="text-muted">per 100 lbs</small>
                        </div>
                    </div>
                    
                    <div class="zone-info-item">
                        <div class="info-label">Transit Time</div>
                        <div class="info-value">
                            <strong>${transitDays}</strong>
                            <small class="text-muted">business days</small>
                        </div>
                    </div>
                    
                    <div class="zone-info-item">
                        <div class="info-label">Service Type</div>
                        <div class="info-value">
                            <strong>Ground</strong>
                            <small class="text-muted">standard delivery</small>
                        </div>
                    </div>
                </div>

                ${this.createShippingCalculation()}
            </div>
        `;
    }

    /**
     * Create shipping calculation display
     * @returns {string}
     */
    createShippingCalculation() {
        const totalWeight = this.shippingData.totalWeight || 0;
        const shippingCost = this.shippingData.shippingCost || 0;

        if (!totalWeight) {
            return `
                <div class="shipping-calculation">
                    <small class="text-muted">
                        <i class="fas fa-info-circle"></i>
                        Add products to calculate shipping cost
                    </small>
                </div>
            `;
        }

        return `
            <div class="shipping-calculation">
                <div class="calc-details">
                    <div class="calc-row">
                        <span>Total Weight:</span>
                        <span><strong>${totalWeight.toFixed(1)} lbs</strong></span>
                    </div>
                    <div class="calc-row">
                        <span>Shipping Cost:</span>
                        <span class="text-success"><strong>$${shippingCost.toFixed(2)}</strong></span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create state selector dropdown
     * @returns {string}
     */
    createStateSelector() {
        return `
            <div class="form-group mt-3">
                <label for="stateSelect">
                    <i class="fas fa-map-marked-alt"></i>
                    Select State for Shipping Calculation
                </label>
                <select id="stateSelect" class="form-select">
                    <option value="">Choose a state...</option>
                    ${this.createStateOptions()}
                </select>
            </div>
        `;
    }

    /**
     * Create state options for dropdown
     * @returns {string}
     */
    createStateOptions() {
        const states = this.getAvailableStates();
        return states.map(state => `
            <option value="${state.code}" ${state.code === this.currentState ? 'selected' : ''}>
                ${state.name} (Zone ${state.zone})
            </option>
        `).join('');
    }

    /**
     * Create manual shipping override section
     * @returns {string}
     */
    createManualOverride() {
        const manualAmount = this.shippingData.manualShipping || '';
        
        return `
            <div class="form-group mt-3">
                <label for="manualShipping">
                    <i class="fas fa-edit"></i>
                    Manual Shipping Override
                </label>
                <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input type="number" 
                           id="manualShipping" 
                           class="form-control"
                           step="0.01" 
                           placeholder="0.00"
                           value="${manualAmount}">
                    <button class="btn btn-outline-secondary" type="button" id="clearManualShipping">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <small class="form-text text-muted">
                    Override calculated shipping with a custom amount
                </small>
            </div>
        `;
    }

    /**
     * Get state information
     * @returns {Object|null}
     */
    getStateInfo() {
        const stateCode = this.currentState || this.shippingData.selectedState;
        if (!stateCode) return null;

        // Get from shipping data or calculator
        if (window.calculator?.dataManager?.getShippingZones) {
            const zones = window.calculator.dataManager.getShippingZones();
            return zones[stateCode];
        }

        return this.shippingData.stateInfo || null;
    }

    /**
     * Get available states
     * @returns {Array}
     */
    getAvailableStates() {
        // Get from shipping data or calculator
        if (window.calculator?.dataManager?.getShippingZones) {
            const zones = window.calculator.dataManager.getShippingZones();
            return Object.entries(zones).map(([code, info]) => ({
                code,
                name: info.name,
                zone: info.zone
            }));
        }

        // Default US states
        return [
            { code: 'CA', name: 'California', zone: 1 },
            { code: 'NV', name: 'Nevada', zone: 1 },
            { code: 'AZ', name: 'Arizona', zone: 2 },
            { code: 'TX', name: 'Texas', zone: 3 },
            { code: 'FL', name: 'Florida', zone: 4 },
            { code: 'NY', name: 'New York', zone: 5 }
        ];
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        if (!this.element) return;

        // State selection
        const stateSelect = this.element.querySelector('#stateSelect');
        if (stateSelect) {
            stateSelect.addEventListener('change', (e) => {
                this.handleStateChange(e.target.value);
            });
        }

        // Manual shipping override
        const manualShipping = this.element.querySelector('#manualShipping');
        if (manualShipping) {
            manualShipping.addEventListener('input', (e) => {
                this.handleManualShippingChange(e.target.value);
            });
        }

        // Clear manual shipping
        const clearButton = this.element.querySelector('#clearManualShipping');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearManualShipping();
            });
        }
    }

    /**
     * Handle state selection change
     * @param {string} stateCode 
     */
    handleStateChange(stateCode) {
        this.currentState = stateCode;
        
        // Update shipping info
        this.updateShippingInfo();
        
        // Trigger calculation update
        if (window.calculator?.updateShippingState) {
            window.calculator.updateShippingState(stateCode);
        }

        // Emit custom event
        const event = new CustomEvent('stateChanged', {
            detail: { stateCode, shippingZone: this }
        });
        this.element.dispatchEvent(event);
    }

    /**
     * Handle manual shipping change
     * @param {string} value 
     */
    handleManualShippingChange(value) {
        const amount = parseFloat(value) || 0;
        
        // Update internal data
        this.shippingData.manualShipping = amount;
        
        // Trigger calculation update
        if (window.calculator?.updateManualShipping) {
            window.calculator.updateManualShipping(amount);
        }

        // Emit custom event
        const event = new CustomEvent('manualShippingChanged', {
            detail: { amount, shippingZone: this }
        });
        this.element.dispatchEvent(event);
    }

    /**
     * Clear manual shipping override
     */
    clearManualShipping() {
        const input = this.element.querySelector('#manualShipping');
        if (input) {
            input.value = '';
            this.handleManualShippingChange('');
        }
    }

    /**
     * Update shipping information display
     */
    updateShippingInfo() {
        const infoContainer = this.element.querySelector('#shippingZoneInfo');
        if (infoContainer) {
            infoContainer.innerHTML = this.createShippingInfo().match(/<div id="shippingZoneInfo"[^>]*>(.*?)<\/div>/s)[1];
        }
    }

    /**
     * Update with new shipping data
     * @param {Object} newData 
     */
    update(newData) {
        this.shippingData = { ...this.shippingData, ...newData };
        
        if (this.element) {
            const newElement = this.create(this.shippingData);
            this.element.parentNode.replaceChild(newElement, this.element);
        }
    }

    /**
     * Static method to create shipping zone
     * @param {Object} shippingData 
     * @param {Object} options 
     * @returns {ShippingZone}
     */
    static create(shippingData, options = {}) {
        const zone = new ShippingZone(options);
        zone.create(shippingData);
        return zone;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShippingZone;
} else {
    window.ShippingZone = ShippingZone;
}
