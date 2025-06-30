/**
 * Configuration Manager
 * Handles application configuration, defaults, and persistence
 */

class ConfigManager {
    static defaultConfig = {
        debug: true,
        apiBaseUrl: '/api',
        defaultCurrency: 'USD',
        adminPassword: 'kanva123',
        version: '1.0.0',
        adminEmails: ['admin@kanvabotanicals.com'],
        // Add other default configuration here
    };

    /**
     * Load configuration from localStorage or use defaults
     * @returns {Object} The loaded configuration
     */
    static load() {
        try {
            const savedConfig = localStorage.getItem('kanvaConfig');
            if (savedConfig) {
                return this.mergeConfigs(this.defaultConfig, JSON.parse(savedConfig));
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
        return this.getDefaultConfig();
    }

    /**
     * Save configuration to localStorage
     * @param {Object} config - Configuration to save
     */
    static save(config) {
        try {
            localStorage.setItem('kanvaConfig', JSON.stringify(config));
            return true;
        } catch (error) {
            console.error('Error saving config:', error);
            return false;
        }
    }

    /**
     * Get default configuration
     * @returns {Object} Default configuration
     */
    static getDefaultConfig() {
        return JSON.parse(JSON.stringify(this.defaultConfig));
    }

    /**
     * Merge configurations (saved overwrites defaults)
     */
    static mergeConfigs(defaultConfig, savedConfig) {
        return {
            ...defaultConfig,
            ...savedConfig,
            // Deep merge specific objects if needed
            shipping: { ...defaultConfig.shipping, ...(savedConfig.shipping || {}) },
            payment: { ...defaultConfig.payment, ...(savedConfig.payment || {}) },
        };
    }

    /**
     * Reset to default configuration
     */
    static reset() {
        try {
            localStorage.removeItem('kanvaConfig');
            return true;
        } catch (error) {
            console.error('Error resetting config:', error);
            return false;
        }
    }
}

// Shipping zone management
const ShippingManager = {
    // Get shipping zone for a state
    getZoneForState(state) {
        const stateUpper = state?.toUpperCase();
        if (!stateUpper) return null;
        
        // Define shipping zones (move to config if needed)
        const zones = {
            'ZONE_1': ['CA', 'OR', 'WA', 'NV', 'AZ', 'ID', 'MT', 'WY', 'UT', 'CO', 'NM'],
            'ZONE_2': ['TX', 'OK', 'KS', 'NE', 'SD', 'ND', 'MN', 'IA', 'MO', 'AR', 'LA'],
            'ZONE_3': ['WI', 'IL', 'IN', 'MI', 'OH', 'KY', 'TN', 'MS', 'AL', 'GA', 'FL', 'SC', 'NC', 'VA', 'WV', 'MD', 'DE', 'NJ', 'PA', 'NY', 'CT', 'RI', 'MA', 'VT', 'NH', 'ME']
        };

        for (const [zone, states] of Object.entries(zones)) {
            if (states.includes(stateUpper)) {
                return zone;
            }
        }
        return 'ZONE_4'; // Default zone for all other states
    },

    // Calculate shipping cost based on quantity and zone
    calculateShipping(totalDisplayBoxes, totalMasterCases, state) {
        const zone = this.getZoneForState(state);
        const config = ConfigManager.load();
        
        // Get shipping rates from config or use defaults
        const shippingRates = config.shipping?.rates || {
            'ZONE_1': { perCase: 25, minFee: 150 },
            'ZONE_2': { perCase: 30, minFee: 175 },
            'ZONE_3': { perCase: 35, minFee: 200 },
            'ZONE_4': { perCase: 45, minFee: 250 }
        };

        const rate = shippingRates[zone] || shippingRates['ZONE_4'];
        const calculatedCost = totalMasterCases * rate.perCase;
        
        return Math.max(calculatedCost, rate.minFee);
    },

    // Get all zones for dropdown
    getAllZones() {
        return [
            { id: 'ZONE_1', name: 'West Coast' },
            { id: 'ZONE_2', name: 'Central' },
            { id: 'ZONE_3', name: 'East Coast' },
            { id: 'ZONE_4', name: 'Other/International' }
        ];
    }
};

// Tier management
const TierManager = {
    // Get tier for given quantity
    getTier(masterCases) {
        const tiers = this.getAll();
        // Sort tiers by minQuantity in descending order
        const sortedTiers = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
        
        // Find the first tier where masterCases >= minQuantity
        return sortedTiers.find(tier => masterCases >= tier.minQuantity) || sortedTiers[sortedTiers.length - 1];
    },

    // Get all tiers
    getAll() {
        const config = ConfigManager.load();
        return config.tiers || [
            { id: 'tier1', name: 'Tier 1', minQuantity: 0, discount: 0 },
            { id: 'tier2', name: 'Tier 2', minQuantity: 10, discount: 0.05 },
            { id: 'tier3', name: 'Tier 3', minQuantity: 25, discount: 0.1 },
            { id: 'tier4', name: 'Tier 4', minQuantity: 50, discount: 0.15 },
            { id: 'tier5', name: 'Tier 5', minQuantity: 100, discount: 0.2 }
        ];
    },

    // Get next tier info for upselling
    getNextTier(currentMasterCases) {
        const tiers = this.getAll();
        // Sort tiers by minQuantity in ascending order
        const sortedTiers = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
        
        // Find the first tier where minQuantity > currentMasterCases
        const nextTier = sortedTiers.find(tier => tier.minQuantity > currentMasterCases);
        
        if (!nextTier) return null;
        
        return {
            ...nextTier,
            casesNeeded: nextTier.minQuantity - currentMasterCases
        };
    }
};

// Product management
const ProductConfigManager = {
    // Get all products
    getAll() {
        const config = ConfigManager.load();
        return config.products || [];
    },

    // Get specific product
    get(productKey) {
        return this.getAll().find(p => p.key === productKey);
    },

    // Get product options for dropdowns
    getOptions() {
        return this.getAll().map(product => ({
            value: product.key,
            label: product.name,
            data: product
        }));
    }
};

// Auth management
const AuthManager = {
    // Check if user is admin
    isAdmin(email) {
        if (!email) return false;
        const config = ConfigManager.load();
        const adminEmails = config.adminEmails || [];
        return adminEmails.includes(email.toLowerCase());
    },

    // Set current user
    setUser(user) {
        try {
            sessionStorage.setItem('kanvaUser', JSON.stringify(user));
            return true;
        } catch (error) {
            console.error('Error setting user:', error);
            return false;
        }
    },

    // Get current user
    getUser() {
        try {
            return JSON.parse(sessionStorage.getItem('kanvaUser'));
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }
};

// Initialize configuration on script load
console.log('🔧 Initializing Kanva Botanicals configuration...');

// For backward compatibility
const config = ConfigManager.load();

// Make available globally
if (typeof window !== 'undefined') {
    window.KanvaConfig = config;
    window.ConfigManager = ConfigManager;
    window.ShippingManager = ShippingManager;
    window.TierManager = TierManager;
    window.ProductConfigManager = ProductConfigManager;
    window.AuthManager = AuthManager;
}

// For backward compatibility
function getConfig(cb) {
    if (typeof cb === 'function') {
        cb(ConfigManager.load());
    }
    return ConfigManager.load();
}

// Export for CommonJS
try {
    module.exports = {
        ConfigManager,
        ShippingManager,
        TierManager,
        ProductManager,
        AuthManager,
        getConfig
    };
} catch (e) {}

console.log('✅ Configuration module loaded successfully');
