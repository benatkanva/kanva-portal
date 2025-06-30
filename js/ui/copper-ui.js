/**
 * Copper CRM UI Components
 * Handles all UI elements specific to Copper CRM integration
 */

class CopperUI {
    constructor(calculator) {
        this.calculator = calculator;
        this.copper = calculator.copper;
        this.elements = {};
    }

    /**
     * Initialize Copper UI components
     */
    initialize() {
        this.createUIElements();
        this.bindEvents();
        this.checkCopperContext();
    }

    /**
     * Create Copper-specific UI elements
     */
    createUIElements() {
        // Main container for Copper UI
        const container = document.createElement('div');
        container.id = 'copper-ui-container';
        container.className = 'copper-ui';
        container.style.display = 'none';
        
        // Customer info section
        container.innerHTML = `
            <div class="copper-customer-info">
                <div class="customer-header">
                    <h3><i class="fas fa-building"></i> Customer</h3>
                    <button id="copper-customer-search" class="btn btn-sm btn-outline-secondary">
                        <i class="fas fa-search"></i> Change
                    </button>
                </div>
                <div id="copper-customer-details" class="customer-details">
                    <div class="loading">Loading customer data...</div>
                </div>
            </div>
            <div class="copper-actions">
                <button id="copper-save-quote" class="btn btn-primary">
                    <i class="fas fa-save"></i> Save to Copper
                </button>
                <button id="copper-email-quote" class="btn btn-outline-secondary">
                    <i class="fas fa-envelope"></i> Email Quote
                </button>
            </div>
        `;

        // Add to DOM
        const mainContainer = document.querySelector('.calculator-container');
        if (mainContainer) {
            mainContainer.prepend(container);
        }

        // Store references to elements
        this.elements = {
            container,
            customerDetails: container.querySelector('#copper-customer-details'),
            saveButton: container.querySelector('#copper-save-quote'),
            emailButton: container.querySelector('#copper-email-quote'),
            searchButton: container.querySelector('#copper-customer-search')
        };
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Save quote to Copper
        this.elements.saveButton?.addEventListener('click', () => this.handleSaveQuote());
        
        // Email quote
        this.elements.emailButton?.addEventListener('click', () => this.handleEmailQuote());
        
        // Customer search
        this.elements.searchButton?.addEventListener('click', () => this.showCustomerSearch());
    }

    /**
     * Check if we're in Copper context and update UI accordingly
     */
    async checkCopperContext() {
        try {
            const customer = await this.copper.getCurrentCustomer();
            if (customer) {
                this.updateCustomerDisplay(customer);
                this.elements.container.style.display = 'block';
            } else {
                this.showCustomerSearch();
            }
        } catch (error) {
            console.error('Error checking Copper context:', error);
            this.showError('Failed to connect to Copper CRM');
        }
    }

    /**
     * Update customer information display
     */
    updateCustomerDisplay(customer) {
        if (!this.elements.customerDetails) return;

        const { name, emails = [], phone_numbers = [], company_name } = customer;
        const email = emails.length > 0 ? emails[0].email : 'No email';
        const phone = phone_numbers.length > 0 ? phone_numbers[0].number : 'No phone';

        this.elements.customerDetails.innerHTML = `
            <div class="customer-name">${name || 'No Name'}</div>
            ${company_name ? `<div class="customer-company">${company_name}</div>` : ''}
            <div class="customer-email"><i class="fas fa-envelope"></i> ${email}</div>
            <div class="customer-phone"><i class="fas fa-phone"></i> ${phone}</div>
        `;
    }

    /**
     * Show customer search modal
     */
    async showCustomerSearch() {
        // Implementation for customer search modal
        console.log('Customer search would open here');
    }

    /**
     * Handle saving quote to Copper
     */
    async handleSaveQuote() {
        try {
            this.setLoading(true);
            const quoteData = this.calculator.getQuoteData();
            await this.copper.saveQuote(quoteData);
            this.showNotification('Quote saved to Copper successfully!', 'success');
        } catch (error) {
            console.error('Error saving quote:', error);
            this.showError(`Failed to save quote: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Handle emailing quote
     */
    async handleEmailQuote() {
        // Implementation for emailing quote
        console.log('Email quote would be sent here');
    }

    /**
     * Show loading state
     */
    setLoading(isLoading) {
        const buttons = [this.elements.saveButton, this.elements.emailButton];
        buttons.forEach(button => {
            if (button) {
                button.disabled = isLoading;
                const icon = button.querySelector('i');
                if (icon) {
                    icon.className = isLoading ? 'fas fa-spinner fa-spin' : icon.className;
                }
            }
        });
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (this.calculator.notificationManager) {
            this.calculator.notificationManager.show(message, type);
        } else {
            // Fallback to simple alert
            alert(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.CopperUI = CopperUI;
}
