/**
 * Calculation Engine
 * Handles all calculation logic for the application
 */

class CalculationEngine {
    calculateLineItems(lineItems, quote, data) {
        quote.products = [];
        quote.lineItems = [];
        let totalCases = 0;
        
        // Calculate total cases first for tier determination
        lineItems.forEach(lineItem => {
            if (lineItem.masterCases) {
                totalCases += parseFloat(lineItem.masterCases) || 0;
            }
        });
        
        // Determine current tier
        const currentTier = this.getCurrentTier(totalCases, data.tiers);
        
        lineItems.forEach(lineItem => {
            if (!lineItem.productKey || !lineItem.masterCases) return;
            
            const product = data.products[lineItem.productKey] || {};
            const cases = parseFloat(lineItem.masterCases) || 0;
            
            // Get tier pricing for this product
            const tierPricing = this.getTierPrice(lineItem.productKey, currentTier, data.tiers);
            const unitPrice = tierPricing || product.price || 0;
            
            const unitsPerCase = product.unitsPerCase || 144;
            const displayBoxesPerCase = product.displayBoxesPerCase || 12;
            const displayBoxes = cases * displayBoxesPerCase;
            const totalUnits = cases * unitsPerCase;
            const lineTotal = totalUnits * unitPrice;
            
            const productLine = {
                key: lineItem.productKey,
                name: product.name || 'Unknown Product',
                cases: cases,
                displayBoxes: displayBoxes,
                totalUnits: totalUnits,
                unitPrice: unitPrice,
                unitsPerCase: unitsPerCase,
                lineTotal: lineTotal,
                tier: currentTier.key
            };
            
            quote.products.push(productLine);
            
            quote.lineItems.push({
                id: lineItem.id,
                productKey: lineItem.productKey,
                productName: product.name || 'Unknown Product',
                cases: cases,
                displayBoxes: displayBoxes,
                totalUnits: totalUnits,
                unitPrice: unitPrice,
                unitsPerCase: unitsPerCase,
                lineTotal: lineTotal,
                productData: product,
                tier: currentTier.key
            });
        });
        
        quote.subtotal = quote.products.reduce((sum, p) => sum + p.lineTotal, 0);
        quote.totalCases = totalCases;
        quote.currentTier = currentTier;
    }

    /**
     * Get current tier based on total cases
     */
    getCurrentTier(totalCases = 0, tiers = {}) {
        let bestTier = null;
        let highestThreshold = -1;
        
        for (const [tierKey, tierData] of Object.entries(tiers)) {
            const threshold = tierData.threshold || 0;
            if (totalCases >= threshold && threshold > highestThreshold) {
                bestTier = { ...tierData, key: tierKey };
                highestThreshold = threshold;
            }
        }
        
        // Default to tier1 if no tier found
        if (!bestTier && tiers.tier1) {
            bestTier = { ...tiers.tier1, key: 'tier1' };
        }
        
        return bestTier || { key: 'tier1', name: 'Tier 1', threshold: 0, prices: {} };
    }
    
    /**
     * Get tier price for specific product
     */
    getTierPrice(productKey, tier, tiers = {}) {
        if (!tier || !tier.key || !tiers[tier.key]) {
            return null;
        }
        
        const tierData = tiers[tier.key];
        if (tierData.prices && tierData.prices[productKey]) {
            return tierData.prices[productKey];
        }
        
        return null;
    }
    
    /**
     * Apply tier discount (deprecated - now using individual tier pricing)
     */
    applyTierDiscount(quote, totalCases, tiers) {
        // This method is deprecated as we now use individual tier pricing
        // Keeping for backward compatibility
        console.warn('applyTierDiscount is deprecated - using individual tier pricing instead');
    }

    calculateShipping(quote, currentShippingZone, data) {
        const manualShipping = this.getManualShipping();
        
        if (manualShipping > 0) {
            quote.shipping = manualShipping;
            return;
        }
        
        if (!currentShippingZone || quote.subtotal <= 0) {
            quote.shipping = 0;
            return;
        }
        
        const zoneData = data.shipping.zones[currentShippingZone];
        if (!zoneData) {
            quote.shipping = 0;
            return;
        }
        
        const ltlPercentage = zoneData.ltlPercentage / 100;
        quote.shipping = quote.subtotal * ltlPercentage;
    }

    calculateCreditCardFee(quote, settings) {
        const includeFee = document.getElementById('includeCreditCardFee')?.checked ?? true;
        const subtotalWithShipping = quote.subtotal + quote.shipping;
        
        if (includeFee && subtotalWithShipping < 10000) {
            quote.creditCardFee = subtotalWithShipping * settings.creditCardFeeRate;
        } else {
            quote.creditCardFee = 0;
        }
    }

    calculateTotal(quote) {
        quote.total = quote.subtotal + quote.shipping + quote.creditCardFee;
    }

    getManualShipping() {
        const manualShippingInput = document.getElementById('manualShipping');
        return manualShippingInput ? parseFloat(manualShippingInput.value) || 0 : 0;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.CalculationEngine = CalculationEngine;
}
