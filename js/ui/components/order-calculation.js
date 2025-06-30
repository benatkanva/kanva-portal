/**
 * Order Calculation Component
 * Creates the order calculation panel with subtotal, shipping, fees, and total
 */
class OrderCalculation {
    constructor(options = {}) {
        this.options = {
            showTierInfo: true,
            showProgressBar: true,
            showMargin: true,
            position: 'right-panel',
            ...options
        };
        this.element = null;
        this.calculationData = {};
        
        // Ensure component styles are loaded
        this.loadComponentStyles();
    }
    
    /**
     * Load required CSS for this component
     */
    loadComponentStyles() {
        if (window.CSSLoader) {
            // Load activity panel, cards, forms, and calculation display styles
            window.CSSLoader.loadComponentCSS('activity-panel');
            window.CSSLoader.loadComponentCSS('cards');
            window.CSSLoader.loadComponentCSS('forms');
            window.CSSLoader.loadComponentCSS('calculation-display');
        }
    }

    /**
     * Create the order calculation element
     * @param {Object} calculationData 
     * @returns {HTMLElement}
     */
    create(calculationData = {}) {
        this.calculationData = calculationData;

        const container = document.createElement('div');
        container.className = 'order-calculation-container';
        
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-calculator"></i> Order Calculation</h3>
                </div>
                <div class="card-body">
                    ${this.createCalculationDisplay()}
                    ${this.options.showTierInfo ? this.createTierInfo() : ''}
                </div>
            </div>
        `;

        this.element = container;
        return container;
    }

    /**
     * Create the main calculation display
     * @returns {string}
     */
    createCalculationDisplay() {
        const data = this.calculationData;
        
        return `
            <div class="calculation-display">
                <div class="calc-row">
                    <span>Subtotal:</span>
                    <span class="calc-amount" id="subtotalAmount">$${this.formatAmount(data.subtotal)}</span>
                </div>
                <div class="calc-row">
                    <span>Shipping:</span>
                    <span class="calc-amount" id="shippingAmount">$${this.formatAmount(data.shipping)}</span>
                </div>
                <div class="calc-row">
                    <span>Credit Card Fee (Waived - $10K+):</span>
                    <span class="calc-amount" id="creditCardFee">$${this.formatAmount(data.creditCardFee)}</span>
                </div>
                <div class="calc-row total-row">
                    <span><strong>Total:</strong></span>
                    <span class="calc-amount total-amount" id="totalAmount">
                        <strong>$${this.formatAmount(data.total)}</strong>
                    </span>
                </div>
            </div>
        `;
    }

    /**
     * Create tier information display
     * @returns {string}
     */
    createTierInfo() {
        const tierData = this.calculationData.tierInfo;
        if (!tierData) return '';

        return `
            <div class="tier-section">
                ${this.createVolumeDiscountCard()}
            </div>
        `;
    }

    /**
     * Create volume discount card
     * @returns {string}
     */
    createVolumeDiscountCard() {
        const tierData = this.calculationData.tierInfo;
        if (!tierData) return '';

        const tierName = tierData.name || 'TIER 3';
        const marginPercent = tierData.margin ? (tierData.margin * 100).toFixed(2) : '15.00';
        const masterCases = this.calculationData.totalCases || 0;
        const originalSubtotal = this.calculationData.originalSubtotal || 0;
        const discountAmount = originalSubtotal - (this.calculationData.subtotal || 0);
        const discountPercent = originalSubtotal > 0 ? 
            ((discountAmount / originalSubtotal) * 100).toFixed(2) : '0.00';

        return `
            <div class="volume-discount-card">
                <div class="discount-header">
                    <span class="volume-discount-label">Volume Discount Applied</span>
                    <span class="badge bg-success tier-badge">${tierName}</span>
                    <span class="margin-display">Margin: ${marginPercent}%</span>
                </div>
                
                <div class="discount-details">
                    <div class="detail-row">
                        <span>Master Cases:</span>
                        <span><strong>${masterCases}</strong></span>
                    </div>
                    <div class="detail-row">
                        <span>Original Subtotal:</span>
                        <span>$${this.formatAmount(originalSubtotal)}</span>
                    </div>
                    <div class="detail-row discount-amount">
                        <span>Volume Discount (${discountPercent}%):</span>
                        <span>-$${this.formatAmount(discountAmount)}</span>
                    </div>
                </div>

                ${this.options.showProgressBar ? this.createTierProgressBar() : ''}
                
                <div class="tier-achievement">
                    <i class="fas fa-trophy text-warning"></i>
                    <span>You've reached our highest volume tier!</span>
                </div>
            </div>
        `;
    }

    /**
     * Create tier progress bar
     * @returns {string}
     */
    createTierProgressBar() {
        return `
            <div class="tier-progress-section">
                <div class="tier-levels">
                    <div class="tier-level tier-level-achieved">
                        <span class="tier-level-badge">TIER 2</span>
                    </div>
                    <div class="tier-level tier-level-achieved tier-level-current">
                        <span class="tier-level-badge">TIER 3</span>
                    </div>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar progress-bar-full"></div>
                </div>
            </div>
        `;
    }

    /**
     * Format amount for display
     * @param {number} amount 
     * @returns {string}
     */
    formatAmount(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) return '0.00';
        return amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    /**
     * Update calculation display
     * @param {Object} newData 
     */
    update(newData) {
        this.calculationData = { ...this.calculationData, ...newData };
        
        if (this.element) {
            // Update the amounts using the more efficient updateAmounts method
            this.updateAmounts({
                subtotal: newData.subtotal || 0,
                shipping: newData.shipping || 0,
                creditCardFee: newData.creditCardFee || 0,
                total: newData.total || 0
            });
            
            // Update tier info if needed
            if (newData.tierInfo) {
                this.updateTierInfo(newData.tierInfo);
            }
        } else {
            console.warn('OrderCalculation.update: this.element is null, cannot update calculation display.');
        }
    }

    /**
     * Update individual amounts without full rebuild
     * @param {Object} amounts 
     */
    updateAmounts(amounts) {
        if (!this.element) return;

        const elements = {
            subtotal: this.element.querySelector('#subtotalAmount'),
            shipping: this.element.querySelector('#shippingAmount'),
            creditCardFee: this.element.querySelector('#creditCardFee'),
            total: this.element.querySelector('#totalAmount')
        };

        Object.entries(amounts).forEach(([key, value]) => {
            if (elements[key]) {
                const formattedAmount = `$${this.formatAmount(value)}`;
                if (key === 'total') {
                    elements[key].innerHTML = `<strong>${formattedAmount}</strong>`;
                } else {
                    elements[key].textContent = formattedAmount;
                }
            }
        });

        // Update internal data
        this.calculationData = { ...this.calculationData, ...amounts };
    }

    /**
     * Show/hide tier information
     * @param {boolean} show 
     */
    toggleTierInfo(show) {
        if (!this.element) return;
        
        const tierSection = this.element.querySelector('.tier-section');
        if (tierSection) {
            tierSection.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Add loading state
     */
    showLoading() {
        if (!this.element) return;
        
        const calcDisplay = this.element.querySelector('.calculation-display');
        if (calcDisplay) {
            calcDisplay.classList.add('loading');
        }
    }

    /**
     * Remove loading state
     */
    hideLoading() {
        if (!this.element) return;
        
        const calcDisplay = this.element.querySelector('.calculation-display');
        if (calcDisplay) {
            calcDisplay.classList.remove('loading');
        }
    }

    /**
     * Update tier information display
     * @param {Object} tierInfo 
     */
    updateTierInfo(tierInfo) {
        if (!this.element || !tierInfo) return;
        
        const tierSection = this.element.querySelector('.tier-section');
        if (tierSection) {
            // Update tier badge if it exists
            const tierBadge = tierSection.querySelector('.tier-level-badge');
            if (tierBadge) {
                tierBadge.textContent = tierInfo.name || 'TIER 3';
            }
            
            // Update margin info if it exists
            const marginInfo = tierSection.querySelector('.margin-info');
            if (marginInfo && tierInfo.margin) {
                const marginPercent = (tierInfo.margin * 100).toFixed(2);
                marginInfo.textContent = `${marginPercent}% margin`;
            }
        }
    }

    /**
     * Static method to create calculation panel
     * @param {Object} calculationData 
     * @param {Object} options 
     * @returns {OrderCalculation}
     */
    static create(calculationData, options = {}) {
        const calc = new OrderCalculation(options);
        calc.create(calculationData);
        return calc;
    }

    /**
     * Static method to update existing calculation or create new one
     * @param {string} containerId 
     * @param {Object} calculationData 
     * @param {Object} options 
     */
    static updateOrCreate(containerId, calculationData, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const calc = new OrderCalculation(options);
        const element = calc.create(calculationData);
        
        container.innerHTML = '';
        container.appendChild(element);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrderCalculation;
} else {
    window.OrderCalculation = OrderCalculation;
}
