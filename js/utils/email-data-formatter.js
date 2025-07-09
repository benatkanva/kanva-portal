/**
 * Email Data Formatter
 * Handles formatting of calculation data for email templates
 */

class EmailDataFormatter {
    /**
     * Format single product data for email
     * @param {Array} lineItems - Array of product line items
     * @param {Object} quote - Quote details
     * @returns {Object} Formatted email data
     */
    static formatSingleProduct(lineItems, quote) {
        if (!lineItems || lineItems.length === 0) {
            return {
                subject: 'Your Quote Request',
                body: 'No products were included in your quote.'
            };
        }

        const product = lineItems[0];
        const subtotal = quote?.subtotal || 0;
        const tax = quote?.tax || 0;
        const total = quote?.total || 0;

        return {
            subject: `Quote for ${product.name}`,
            body: `
                <h2>Quote for ${product.name}</h2>
                <p>Quantity: ${product.quantity}</p>
                <p>Price per unit: $${product.price?.toFixed(2) || '0.00'}</p>
                <p>Subtotal: $${subtotal.toFixed(2)}</p>
                <p>Tax (${(quote?.taxRate || 0) * 100}%): $${tax.toFixed(2)}</p>
                <h3>Total: $${total.toFixed(2)}</h3>
                <p>Thank you for your interest in Kanva Botanicals!</p>
            `.trim()
        };
    }

    /**
     * Format multiple products data for email
     * @param {Array} lineItems - Array of product line items
     * @param {Object} quote - Quote details
     * @returns {Object} Formatted email data
     */
    static formatMultiProduct(lineItems, quote) {
        if (!lineItems || lineItems.length === 0) {
            return {
                subject: 'Your Quote Request',
                body: 'No products were included in your quote.'
            };
        }

        const subtotal = quote?.subtotal || 0;
        const tax = quote?.tax || 0;
        const total = quote?.total || 0;
        const shipping = quote?.shipping || 0;

        // Generate product rows
        const productRows = lineItems.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.price?.toFixed(2) || '0.00'}</td>
                <td>$${(item.quantity * item.price).toFixed(2)}</td>
            </tr>
        `).join('');

        return {
            subject: `Your Kanva Botanicals Quote (${lineItems.length} ${lineItems.length === 1 ? 'Item' : 'Items'})`,
            body: `
                <h2>Your Kanva Botanicals Quote</h2>
                <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productRows}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="text-align: right;">Subtotal:</td>
                            <td>$${subtotal.toFixed(2)}</td>
                        </tr>
                        ${shipping > 0 ? `
                        <tr>
                            <td colspan="3" style="text-align: right;">Shipping:</td>
                            <td>$${shipping.toFixed(2)}</td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td colspan="3" style="text-align: right;">Tax (${(quote?.taxRate || 0) * 100}%):</td>
                            <td>$${tax.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="text-align: right; font-weight: bold;">Total:</td>
                            <td style="font-weight: bold;">$${total.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
                <p>Thank you for your interest in Kanva Botanicals!</p>
            `.trim()
        };
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.EmailDataFormatter = EmailDataFormatter;
}
