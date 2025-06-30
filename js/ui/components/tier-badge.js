/**
 * Tier Badge Component
 * Creates a compact tier display showing current tier, volume, and benefits
 */
class TierBadge {
    constructor(options = {}) {
        this.options = {
            position: 'after-table', // 'after-table', 'inline', 'floating'
            showProgress: true,
            showMargin: true,
            compact: true,
            ...options
        };
        this.element = null;
        this.currentTier = null;
        this.totalCases = 0;
    }

    /**
     * Create the tier badge element
     * @param {Object} tierInfo 
     * @param {number} totalCases 
     * @returns {HTMLElement}
     */
    create(tierInfo, totalCases = 0) {
        this.currentTier = tierInfo;
        this.totalCases = totalCases;

        const badge = document.createElement('div');
        badge.id = 'tierBadge';
        badge.className = this.getBadgeClasses();
        
        badge.innerHTML = this.options.compact ? 
            this.createCompactContent() : 
            this.createFullContent();

        this.element = badge;
        return badge;
    }

    /**
     * Get CSS classes for the badge
     * @returns {string}
     */
    getBadgeClasses() {
        const baseClasses = ['tier-badge'];
        
        if (this.options.compact) {
            baseClasses.push('tier-badge-compact');
        }
        
        if (this.currentTier && this.currentTier.name) {
            baseClasses.push(`tier-badge-${this.currentTier.name.toLowerCase()}`);
        }

        return baseClasses.join(' ');
    }

    /**
     * Create compact tier badge content
     * @returns {string}
     */
    createCompactContent() {
        if (!this.currentTier) return '';

        const tierName = this.currentTier.name || 'No Tier';
        const marginPercent = this.getMarginPercent();
        const casesDisplay = this.totalCases;

        return `
            <div class="tier-info-compact">
                <span class="badge bg-success me-2">${tierName}</span>
                <span class="tier-cases me-2">
                    <i class="fas fa-boxes"></i> 
                    <strong>${casesDisplay}</strong> cases
                </span>
                ${this.options.showMargin ? `
                    <span class="tier-margin">
                        <i class="fas fa-percentage text-success"></i>
                        ${marginPercent}% margin
                    </span>
                ` : ''}
            </div>
        `;
    }

    /**
     * Create full tier badge content
     * @returns {string}
     */
    createFullContent() {
        if (!this.currentTier) return this.createNoTierContent();

        const tierName = this.currentTier.name || 'No Tier';
        const marginPercent = this.getMarginPercent();
        const discount = this.getDiscountPercent();
        const nextTier = this.getNextTierInfo();

        return `
            <div class="tier-info-full">
                <div class="tier-header">
                    <span class="badge bg-success tier-name">${tierName}</span>
                    <span class="tier-cases">
                        <strong>${this.totalCases}</strong> Master Cases
                    </span>
                </div>
                
                <div class="tier-details">
                    ${this.options.showMargin ? `
                        <div class="tier-benefit">
                            <i class="fas fa-percentage text-success"></i>
                            Volume Discount: <strong>${discount}%</strong>
                        </div>
                        <div class="tier-benefit">
                            <i class="fas fa-chart-line text-success"></i>
                            Margin: <strong>${marginPercent}%</strong>
                        </div>
                    ` : ''}
                </div>

                ${this.options.showProgress && nextTier ? this.createProgressBar(nextTier) : ''}
            </div>
        `;
    }

    /**
     * Create no tier content
     * @returns {string}
     */
    createNoTierContent() {
        return `
            <div class="tier-info-none">
                <span class="badge bg-secondary">No Volume Tier</span>
                <small class="text-muted ms-2">${this.totalCases} cases</small>
            </div>
        `;
    }

    /**
     * Create progress bar to next tier
     * @param {Object} nextTier 
     * @returns {string}
     */
    createProgressBar(nextTier) {
        const progress = Math.min((this.totalCases / nextTier.masterCases) * 100, 100);
        const remaining = nextTier.masterCases - this.totalCases;

        return `
            <div class="tier-progress">
                <div class="progress-info">
                    <small>Next tier: <strong>${nextTier.name}</strong></small>
                    <small>${remaining > 0 ? `${remaining} cases to go` : 'Tier achieved!'}</small>
                </div>
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar bg-success" 
                         style="width: ${progress}%"
                         aria-valuenow="${progress}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get margin percentage
     * @returns {string}
     */
    getMarginPercent() {
        if (!this.currentTier || !this.currentTier.margin) return '0.00';
        return (this.currentTier.margin * 100).toFixed(2);
    }

    /**
     * Get discount percentage
     * @returns {string}
     */
    getDiscountPercent() {
        if (!this.currentTier || !this.currentTier.discount) return '0.00';
        return (this.currentTier.discount * 100).toFixed(2);
    }

    /**
     * Get next tier information
     * @returns {Object|null}
     */
    getNextTierInfo() {
        if (!window.calculator?.dataManager?.getTiers) return null;
        
        const tiers = window.calculator.dataManager.getTiers();
        const currentTierIndex = tiers.findIndex(tier => 
            tier.name === this.currentTier?.name
        );
        
        return currentTierIndex >= 0 && currentTierIndex < tiers.length - 1 
            ? tiers[currentTierIndex + 1] 
            : null;
    }

    /**
     * Update badge with new tier information
     * @param {Object} tierInfo 
     * @param {number} totalCases 
     */
    update(tierInfo, totalCases) {
        const newElement = this.create(tierInfo, totalCases);
        if (this.element && this.element.parentNode) {
            this.element.parentNode.replaceChild(newElement, this.element);
        }
    }

    /**
     * Insert badge into DOM at specified position
     * @param {HTMLElement} targetElement 
     */
    insertAfter(targetElement) {
        if (!this.element || !targetElement) return;
        
        if (targetElement.nextSibling) {
            targetElement.parentNode.insertBefore(this.element, targetElement.nextSibling);
        } else {
            targetElement.parentNode.appendChild(this.element);
        }
    }

    /**
     * Remove badge from DOM
     */
    remove() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    /**
     * Static method to create and insert tier badge
     * @param {Object} tierInfo 
     * @param {number} totalCases 
     * @param {Object} options 
     * @returns {TierBadge}
     */
    static createAndShow(tierInfo, totalCases, options = {}) {
        const badge = new TierBadge(options);
        const element = badge.create(tierInfo, totalCases);
        
        // Find target location based on options
        let targetElement;
        if (options.position === 'after-table') {
            targetElement = document.getElementById('orderDetailsTable');
        } else if (options.targetId) {
            targetElement = document.getElementById(options.targetId);
        }
        
        if (targetElement) {
            badge.insertAfter(targetElement);
        }
        
        return badge;
    }

    /**
     * Static method to update existing badge or create new one
     * @param {Object} tierInfo 
     * @param {number} totalCases 
     * @param {Object} options 
     */
    static updateOrCreate(tierInfo, totalCases, options = {}) {
        let existingBadge = document.getElementById('tierBadge');
        
        if (existingBadge) {
            const badge = new TierBadge(options);
            const newElement = badge.create(tierInfo, totalCases);
            existingBadge.parentNode.replaceChild(newElement, existingBadge);
        } else {
            TierBadge.createAndShow(tierInfo, totalCases, options);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TierBadge;
} else {
    window.TierBadge = TierBadge;
}
