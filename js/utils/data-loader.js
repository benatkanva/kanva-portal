/**
 * Data Loader Utility
 * Handles loading of JSON data files from the server
 */

class DataLoader {
    /**
     * Loads a JSON file from the data/ directory
     * @param {string} filename - Name of the file to load (e.g., 'products.json')
     * @returns {Promise<Object>} Parsed JSON data
     */
    static async load(filename) {
        try {
            const response = await fetch(`data/${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${filename}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error loading ${filename}:`, error);
            throw error;
        }
    }

    /**
     * Loads all configuration data in parallel
     * @returns {Promise<Object>} Object containing all loaded data
     */
    static async loadAll() {
        try {
            const [products, tiers, shipping, payment, adminEmails] = await Promise.all([
                this.load('products.json').catch(() => []),
                this.load('tiers.json').catch(() => []),
                this.load('shipping.json').catch(() => ({})),
                this.load('payment.json').catch(() => ({})),
                this.load('admin-emails.json').catch(() => [])
            ]);

            return {
                products,
                tiers,
                shipping,
                payment,
                adminEmails
            };
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    /**
     * Save data to a JSON file (simulated - in a real app, this would call an API)
     * @param {string} filename - Name of the file to save to
     * @param {Object} data - Data to save
     * @returns {Promise<boolean>} Whether the save was successful
     */
    static async save(filename, data) {
        try {
            // In a real app, this would be an API call to save the data
            console.log(`Saving data to ${filename}:`, data);
            return true;
        } catch (error) {
            console.error(`Error saving ${filename}:`, error);
            throw error;
        }
    }

    /**
     * Initialize default data if no data exists
     */
    static async initializeDefaultData() {
        try {
            // Check if data exists
            await this.load('products.json');
        } catch (error) {
            // If loading fails, initialize default data
            console.log('Initializing default data...');
            
            const defaultData = {
                products: [
                    {
                        id: 'premium-oil',
                        name: 'Premium CBD Oil',
                        description: 'High-quality CBD oil for daily use',
                        price: 49.99,
                        sku: 'CBD-OIL-001',
                        category: 'oils',
                        inStock: true
                    },
                    // Add more default products as needed
                ],
                tiers: [
                    { id: 'tier1', name: 'Retail', minQuantity: 1, discount: 0 },
                    { id: 'tier2', name: 'Wholesale', minQuantity: 10, discount: 0.15 },
                    { id: 'tier3', name: 'Distributor', minQuantity: 50, discount: 0.25 }
                ],
                shipping: {
                    zones: [
                        { id: 'ZONE_1', name: 'West Coast', baseRate: 15, perItem: 2.5 },
                        { id: 'ZONE_2', name: 'Central', baseRate: 20, perItem: 3 },
                        { id: 'ZONE_3', name: 'East Coast', baseRate: 25, perItem: 3.5 },
                        { id: 'ZONE_4', name: 'International', baseRate: 50, perItem: 5 }
                    ]
                },
                payment: {
                    terms: 'Net 30',
                    methods: ['ACH', 'Credit Card', 'Wire Transfer'],
                    discounts: {
                        ACH: 0.02, // 2% discount for ACH
                        'Wire Transfer': 0.01 // 1% discount for wire
                    }
                },
                adminEmails: ['admin@kanvabotanicals.com']
            };

            // In a real app, this would save to the server
            console.log('Default data initialized. In a real app, this would save to the server.');
            return defaultData;
        }
    }
}

// Initialize default data when the module loads
DataLoader.initializeDefaultData().catch(console.error);

// Make available globally
window.DataLoader = DataLoader;

// Make available globally
if (typeof window !== 'undefined') {
    window.DataLoader = DataLoader;
}

// Export for CommonJS
try {
    module.exports = DataLoader;
} catch (e) {}
