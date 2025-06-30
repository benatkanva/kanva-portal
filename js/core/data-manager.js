/**
 * Data Manager
 * Handles all data loading and management for the application
 */

class DataManager {
    constructor() {
        this.data = {
            products: {},
            tiers: {},
            shipping: { zones: {}, states: [] },
            payment: {},
            adminEmails: []
        };
        this.adminStatus = false;
        this.products = {};
        this.tiers = {};
        this.shipping = {};
        this.adminEmails = [];
    }

    async loadAllData() {
        try {
            console.log('Loading all data...');
            
            // Load products
            const productsResponse = await fetch('data/products.json');
            this.products = await productsResponse.json();
            this.data.products = this.products;
            
            // Load tiers
            const tiersResponse = await fetch('data/tiers.json');
            this.tiers = await tiersResponse.json();
            this.data.tiers = this.tiers;
            
            // Load shipping data
            const shippingResponse = await fetch('data/shipping.json');
            this.shipping = await shippingResponse.json();
            this.data.shipping = this.shipping;
            
            // Load admin emails
            try {
                const adminEmailsResponse = await fetch('data/admin-emails.json');
                this.adminEmails = await adminEmailsResponse.json();
                console.log('Admin emails loaded:', this.adminEmails.length);
            } catch (error) {
                console.warn('Could not load admin emails:', error);
                this.adminEmails = [];
            }
            
            console.log('All data loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    /**
     * Check if current user is an admin
     * @param {string} [email] - Optional email to check (defaults to current user's email in Copper)
     * @returns {Promise<boolean>} True if user is admin
     */
    async isAdmin(email) {
        // Check if we have admin emails loaded
        if (!this.adminEmails || this.adminEmails.length === 0) {
            await this.loadAllData();
        }
        
        // If email is provided, check against admin emails
        if (email) {
            return this.adminEmails.includes(email.toLowerCase());
        }
        
        // Check if we're in Copper context and get current user's email
        if (window.Copper && window.Copper.user && window.Copper.user.email) {
            return this.adminEmails.includes(window.Copper.user.email.toLowerCase());
        }
        
        // Fallback to session storage for password-based login
        const adminSession = sessionStorage.getItem('adminSession');
        if (adminSession) {
            try {
                const { email: sessionEmail, expires } = JSON.parse(adminSession);
                if (new Date(expires) > new Date()) {
                    return this.adminEmails.includes(sessionEmail.toLowerCase());
                }
            } catch (e) {
                console.warn('Invalid admin session', e);
            }
        }
        
        return false;
    }

    /**
     * Verify admin password and create a session
     * @param {string} password - The password to verify
     * @returns {boolean} True if password is correct
     */
    verifyAdminPassword(password) {
        // In a real app, this would be hashed and stored securely
        const ADMIN_PASSWORD = 'kanva123';
        return password === ADMIN_PASSWORD;
    }

    /**
     * Create an admin session
     * @param {string} email - The admin's email
     * @param {number} [durationHours=4] - Session duration in hours
     */
    createAdminSession(email, durationHours = 4) {
        const expires = new Date();
        expires.setHours(expires.getHours() + durationHours);

        sessionStorage.setItem('adminSession', JSON.stringify({
            email: email.toLowerCase(),
            expires: expires.toISOString()
        }));
    }

    /**
     * Clear the admin session
     */
    clearAdminSession() {
        sessionStorage.removeItem('adminSession');
    }

    detectAdmin() {
        // Check URL parameters for admin email
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');

        if (email && this.adminEmails.includes(email)) {
            this.adminStatus = true;
        } else {
            // Development mode - enable admin by default
            this.adminStatus = true;
        }

        
        console.log(`👤 Admin status: ${this.adminStatus}`);
    }

    getData() {
        return this.data;
    }

    isAdmin() {
        return this.adminStatus;
    }

    getProducts() {
        return this.products || this.data.products || {};
    }

    getTiers() {
        return this.tiers || this.data.tiers || {};
    }

    getShipping() {
        return this.shipping || this.data.shipping || {};
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.DataManager = DataManager;
}
