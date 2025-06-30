/**
 * Email Generator Utility
 * Handles generation, formatting, and export of email templates
 */

class EmailGenerator {
    constructor() {
        this.templates = null;
        this.isLoaded = false;
        
        this.initialize();
    }

    /**
     * Initialize the email generator
     */
    async initialize() {
        console.log('📧 Initializing email generator...');
        await this.loadTemplates();
        this.setupEventListeners();
        console.log('✅ Email generator initialized');
    }

    /**
     * Load email templates from JSON file
     */
    async loadTemplates() {
        try {
            const response = await fetch('./data/email-templates.json');
            if (!response.ok) {
                throw new Error('Failed to load email templates');
            }
            this.templates = await response.json();
            this.isLoaded = true;
            console.log('✅ Email templates loaded');
        } catch (error) {
            console.error('❌ Failed to load email templates:', error);
            // Fallback to basic templates
            this.templates = {
                quote: { subject: 'Quote Request', body: 'Basic quote template' },
                followUp: { subject: 'Follow Up', body: 'Basic follow up template' }
            };
        }
    }

    /**
     * Set up event listeners for email-related UI elements
     */
    setupEventListeners() {
        // Listen for product changes to update quote names
        document.addEventListener('change', (event) => {
            if (event.target.id === 'primaryProduct') {
                this.updateQuoteNameFromProduct();
            }
        });
    }

    /**
     * Generate a professional quote email
     * @param {Object} options - Email generation options
     * @returns {string} Formatted email content
     */
    generateEmail(options = {}) {
        if (!this.isLoaded || !this.templates) {
            console.error('❌ Email templates not loaded');
            return 'Email templates are still loading. Please try again.';
        }

        const {
            type = 'quote',
            data = {},
            recipient = {},
            sender = {}
        } = options;

        // Get the appropriate template based on type
        const template = this.templates[type];
        if (!template) {
            throw new Error(`Unknown email template type: ${type}`);
        }

        // Prepare template variables
        const variables = this.prepareTemplateVariables(data, recipient, sender, type);
        
        // Render the template
        const subject = this.renderTemplate(template.subject, variables);
        const body = this.renderTemplate(template.body, variables);
        
        return {
            subject,
            body,
            fullEmail: `Subject: ${subject}\n\n${body}`
        };
    }

    /**
     * Prepare variables for template rendering
     */
    prepareTemplateVariables(data, recipient, sender, type) {
        const calc = data.calculation || data;
        const formData = data.formData || this.getFormData();
        const timestamp = new Date().toLocaleString();
        const userEmail = sender.email || (typeof appState !== 'undefined' && appState.currentUser?.email) || '[YOUR EMAIL]';
        const userName = sender.name || (typeof appState !== 'undefined' && appState.currentUser?.name) || '[YOUR NAME]';
        
        // Calculate totals and product details
        const isMultipleProducts = Array.isArray(calc);
        const calculations = isMultipleProducts ? calc : [calc];
        
        let productDetails = '';
        let grandTotal = 0;
        let totalUnits = 0;
        let totalDisplayBoxes = 0;
        
        if (isMultipleProducts) {
            calculations.forEach((item, index) => {
                const itemTemplate = this.templates.product_templates.multi_product_item;
                productDetails += this.renderTemplate(itemTemplate, {
                    productNumber: index + 1,
                    productName: item.product?.name || 'Product',
                    masterCases: item.masterCases || 0,
                    displayBoxes: item.displayBoxes || 0,
                    totalUnits: this.formatNumber(item.totalUnits || 0),
                    unitPrice: item.unitPrice || '$0.00',
                    tierName: item.tierInfo?.name || 'Standard',
                    total: item.total || '$0.00'
                }) + '\n\n';
                grandTotal += item.raw?.total || 0;
                totalUnits += item.totalUnits || 0;
                totalDisplayBoxes += item.displayBoxes || 0;
            });
        } else {
            const item = calculations[0] || {};
            const itemTemplate = this.templates.product_templates.single_product;
            productDetails = this.renderTemplate(itemTemplate, {
                productName: item.product?.name || 'Product',
                masterCases: item.masterCases || 0,
                displayBoxes: item.displayBoxes || 0,
                totalUnits: this.formatNumber(item.totalUnits || 0),
                unitPrice: item.unitPrice || '$0.00',
                tierName: item.tierInfo?.name || 'Standard',
                casePrice: item.casePrice || '$0.00',
                subtotal: item.subtotal || '$0.00',
                shipping: item.shipping || '$0.00',
                creditCardFee: item.creditCardFee || '$0.00',
                total: item.total || '$0.00'
            });
            grandTotal = item.raw?.total || 0;
            totalUnits = item.totalUnits || 0;
            totalDisplayBoxes = item.displayBoxes || 0;
        }
        
        // Order summary for multi-product
        let orderSummary = '';
        if (isMultipleProducts && typeof appState !== 'undefined' && appState.lastMultiProductCalculation?.summary) {
            const summary = appState.lastMultiProductCalculation.summary;
            orderSummary = this.renderTemplate(this.templates.product_templates.order_summary, {
                totalDisplayBoxes: this.formatNumber(totalDisplayBoxes),
                totalUnits: this.formatNumber(totalUnits),
                subtotal: this.formatCurrency(summary.subtotal),
                shipping: this.formatCurrency(summary.shipping),
                creditCardFee: this.formatCurrency(summary.creditCardFee),
                grandTotal: this.formatCurrency(summary.grandTotal)
            });
            grandTotal = summary.grandTotal;
        }
        
        // Payment information
        const achThreshold = (typeof adminConfig !== 'undefined' && adminConfig.payment?.achThreshold) || 2500;
        const requiresACH = grandTotal >= achThreshold;
        let paymentInfo;
        if (requiresACH) {
            paymentInfo = this.renderTemplate(this.templates.payment.ach_required, {
                achThreshold: this.formatNumber(achThreshold)
            });
        } else {
            paymentInfo = this.templates.payment.standard_options;
        }
        
        return {
            quoteName: formData.quoteName || 'Product Quote',
            companyName: formData.companyName || recipient.company || '[COMPANY NAME]',
            segment: formData.segment || '[CUSTOMER SEGMENT]',
            emailDomain: formData.emailDomain || 'company.com',
            phone: formData.phone || '[PHONE NUMBER]',
            maxRetail: formData.maxRetail || '5.00',
            productDetails,
            orderSummary,
            paymentInfo,
            achRequired: requiresACH ? '(DocuSign/ACH)' : '',
            userName,
            userEmail,
            timestamp,
            quoteId: this.generateQuoteId(),
            productSummary: `${totalUnits} units across ${calculations.length} product${calculations.length > 1 ? 's' : ''}`
        };
    }

    /**
     * Render template with variable substitution
     */
    renderTemplate(template, variables) {
        if (!template) return '';
        
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return variables[key] || match;
        });
    }

    /**
     * Get form data with updated field names
     */
    getFormData() {
        return {
            quoteName: document.getElementById('quoteName')?.value || 'Product Quote',
            companyName: document.getElementById('companyName')?.value || '[COMPANY NAME]',
            segment: document.getElementById('segment')?.value || '[CUSTOMER SEGMENT]',
            emailDomain: document.getElementById('emailDomain')?.value || 'company.com',
            phone: document.getElementById('phone')?.value || '[PHONE NUMBER]',
            maxRetail: document.getElementById('maxRetail')?.value || '5.00'
        };
    }
    
    /**
     * LEGACY: Generate a quote email (deprecated - use generateEmail with templates)
     */
    generateQuoteEmail(data, recipient, sender) {
        const { customerName, quoteNumber, quoteDate, items, subtotal, tax, total } = data;
        const formattedDate = new Date(quoteDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Format items as HTML table rows
        const itemRows = items.map(item => `
            <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${this.formatCurrency(item.unitPrice)}</td>
                <td>${this.formatCurrency(item.total)}</td>
            </tr>
        `).join('');

        return `
            <p>Dear ${customerName},</p>
            
            <p>Thank you for your interest in Kanva Botanicals products. 
            Please find your quote #${quoteNumber} (${formattedDate}) below:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #f5f5f5;">
                        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Description</th>
                        <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Qty</th>
                        <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Unit Price</th>
                        <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemRows}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="text-align: right; padding: 10px; border-top: 2px solid #ddd;">Subtotal:</td>
                        <td style="text-align: right; padding: 10px; border-top: 2px solid #ddd;">${this.formatCurrency(subtotal)}</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="text-align: right; padding: 10px;">Tax (${(tax / subtotal * 100).toFixed(2)}%):</td>
                        <td style="text-align: right; padding: 10px;">${this.formatCurrency(tax)}</td>
                    </tr>
                    <tr style="font-weight: bold;">
                        <td colspan="3" style="text-align: right; padding: 10px; border-top: 2px solid #ddd;">Total:</td>
                        <td style="text-align: right; padding: 10px; border-top: 2px solid #ddd;">${this.formatCurrency(total)}</td>
                    </tr>
                </tfoot>
            </table>
            
            <p>This quote is valid for 30 days from the date of issue. If you have any questions or would like to place an order, 
            please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>
            ${sender.name || 'Kanva Botanicals Team'}</p>
        `;
    }

    /**
     * Generate a follow-up email
     */
    generateFollowUpEmail(data = {}, recipient = {}) {
        const { customerName = 'Valued Customer', quoteNumber = '' } = data;
        
        return `
            <p>Dear ${customerName},</p>
            
            <p>I hope this email finds you well. I wanted to follow up regarding quote #${quoteNumber} that we sent you. 
            Do you have any questions or need any clarification about the products or pricing?</p>
            
            <p>We're here to help and would be happy to discuss how our products can meet your needs. Please don't hesitate 
            to reach out if you'd like to proceed with the order or if there's anything else we can assist you with.</p>
            
            <p>Best regards,<br>
            Kanva Botanicals Team</p>
        `;
    }

    /**
     * Generate a negotiation email
     */
    generateNegotiationEmail(data = {}, recipient = {}) {
        const { customerName = 'Valued Customer', quoteNumber = '' } = data;
        
        return `
            <p>Dear ${customerName},</p>
            
            <p>Thank you for your feedback regarding quote #${quoteNumber}. We appreciate your business and would like to 
            work with you to find a solution that meets your needs.</p>
            
            <p>While we strive to offer the most competitive pricing, we understand budget constraints. We'd be happy to 
            discuss potential adjustments to the order quantity or product mix that might better align with your budget 
            while still meeting your requirements.</p>
            
            <p>Please let us know what specific aspects of the quote you'd like to discuss, and we'll do our best to 
            accommodate your needs.</p>
            
            <p>Best regards,<br>
            Kanva Botanicals Team</p>
        `;
    }

    /**
     * Generate a closing email
     */
    generateClosingEmail(data = {}, recipient = {}) {
        const { customerName = 'Valued Customer', quoteNumber = '' } = data;
        
        return `
            <p>Dear ${customerName},</p>
            
            <p>We're excited to move forward with your order based on quote #${quoteNumber}. To complete your purchase, 
            please confirm the following details:</p>
            
            <ul>
                <li>Shipping address</li>
                <li>Billing information</li>
                <li>Preferred payment method</li>
                <li>Requested delivery date (if applicable)</li>
            </ul>
            
            <p>Once we receive your confirmation, we'll process your order and provide you with tracking information 
            as soon as it's available.</p>
            
            <p>Thank you for choosing Kanva Botanicals. We appreciate your business!</p>
            
            <p>Best regards,<br>
            Kanva Botanicals Team</p>
        `;
    }

    /**
     * Update quote name based on product selection
     */
    updateQuoteNameFromProduct() {
        const productSelect = document.getElementById('primaryProduct');
        const quoteNameInput = document.getElementById('quoteName');
        
        if (productSelect && quoteNameInput && !quoteNameInput.value) {
            const selectedOption = productSelect.options[productSelect.selectedIndex];
            if (selectedOption) {
                quoteNameInput.value = `${selectedOption.text} Quote`;
            }
        }
    }

    /**
     * Format a number as currency
     * @param {number} amount - The amount to format
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Copy email content to clipboard
     * @param {string} content - The content to copy
     * @returns {Promise<boolean>} Whether the copy was successful
     */
    async copyToClipboard(content) {
        try {
            await navigator.clipboard.writeText(content);
            this.showCopySuccess();
            return true;
        } catch (err) {
            console.error('Failed to copy text: ', err);
            return this.fallbackCopyEmail(content);
        }
    }

    /**
     * Fallback copy method for older browsers
     */
    fallbackCopyEmail(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showCopySuccess();
            }
            return successful;
        } catch (err) {
            console.error('Fallback copy failed:', err);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }

    /**
     * Show copy success visual feedback
     */
    showCopySuccess() {
        const notification = document.createElement('div');
        notification.textContent = 'Copied to clipboard!';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 20px';
        notification.style.backgroundColor = '#4CAF50';
        notification.style.color = 'white';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '1000';
        notification.style.transition = 'opacity 0.5s';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 2000);
    }

    /**
     * Export email content to a file
     * @param {string} content - The content to export
     * @param {string} filename - The filename to use
     * @param {string} type - The file type (e.g., 'text/plain', 'text/html')
     */
    exportToFile(content, filename = 'quote', type = 'text/plain') {
        try {
            const blob = new Blob([content], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Error exporting file:', error);
            return false;
        }
    }
}

// Initialize and make available globally
window.EmailGenerator = new EmailGenerator();

// Make available globally for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailGenerator;
} else if (typeof window !== 'undefined') {
    window.EmailGeneratorClass = EmailGenerator;
}

console.log('✅ Email generator module loaded successfully');
