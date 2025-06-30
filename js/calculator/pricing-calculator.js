/**
 * Pricing Calculator Module
 * Handles all pricing-related calculations
 */

class PricingCalculator extends (window.BaseCalculator || class { constructor() {} }) {
    constructor(calculator) {
        if (window.BaseCalculator) {
            super(calculator);
        }
        this.calculator = calculator;
    }

    /**
     * Calculate line item price based on quantity and tier
     */
    calculateLineItemPrice(lineItem) {
        if (!lineItem || !lineItem.productData) return 0;
        
        const product = lineItem.productData;
        const quantity = parseFloat(lineItem.quantity) || 0;
        
        // Check for custom unit price override
        if (lineItem.customUnitPrice !== undefined) {
            return quantity * lineItem.customUnitPrice;
        }
        
        // Get tier pricing if available
        const tierPricing = this.getTierPricing(product, quantity);
        if (tierPricing) {
            return quantity * tierPricing.price;
        }
        
        // Fallback to default pricing
        return quantity * (product.price || 0);
    }
    
    /**
     * Get tier pricing for a product based on quantity
     */
    getTierPricing(product, quantity) {
        if (!product || !product.pricing || !product.pricing.tiers) return null;
        
        // Sort tiers by minQuantity in descending order
        const sortedTiers = [...product.pricing.tiers].sort((a, b) => b.minQuantity - a.minQuantity);
        
        // Find the highest tier where minQuantity <= quantity
        return sortedTiers.find(tier => quantity >= tier.minQuantity) || null;
    }
    
    /**
     * Calculate subtotal for all line items
     */
    calculateSubtotal(lineItems) {
        if (!Array.isArray(lineItems)) return 0;
        
        return lineItems.reduce((sum, item) => {
            return sum + this.calculateLineItemPrice(item);
        }, 0);
    }
    
    /**
     * Calculate credit card fee
     */
    calculateCreditCardFee(amount) {
        const includeFee = document.getElementById('includeCreditCardFee')?.checked || false;
        if (!includeFee) return 0;
        
        return amount * (this.settings.creditCardFeeRate || 0.03);
    }
    
    /**
     * Calculate shipping cost
     */
    calculateShipping(subtotal, zone) {
        const manualShippingInput = document.getElementById('manualShipping');
        const manualShipping = manualShippingInput ? parseFloat(manualShippingInput.value) : 0;
        
        if (manualShipping > 0) {
            return manualShipping;
        }
        
        if (!zone || !this.data.shipping?.zones?.[zone]) {
            return 0;
        }
        
        const zoneData = this.data.shipping.zones[zone];
        const rate = zoneData.ltlPercentage / 100 || 0;
        
        // Apply min/max rates
        const minRate = this.settings.shippingRateMin || 0.005;
        const maxRate = this.settings.shippingRateMax || 0.025;
        const adjustedRate = Math.min(Math.max(rate, minRate), maxRate);
        
        return subtotal * adjustedRate;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.PricingCalculator = PricingCalculator;
}
