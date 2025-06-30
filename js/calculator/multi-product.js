/**
 * Multi-Product Utilities
 * Handles multi-product line items and calculations
 */

const MultiProductManager = {
    /**
     * Renumber product lines after removal
     */
    renumberProductLines() {
        const productRows = document.querySelectorAll('.product-row');
        productRows.forEach((row, index) => {
            // Update row number
            const rowNumber = row.querySelector('.row-number');
            if (rowNumber) {
                rowNumber.textContent = index + 1;
            }
            
            // Update input names with new index
            const inputs = row.querySelectorAll('[name^="products["]');
            inputs.forEach(input => {
                const newName = input.name.replace(/\[\d+\]/, `[${index}]`);
                input.name = newName;
            });
        });
    },

    /**
     * Update multi-product results display
     * @param {Object} results - Calculation results
     */
    updateMultiProductResultsDisplay(results) {
        const container = document.getElementById('multiProductResults');
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        if (!results || !results.lineItems || results.lineItems.length === 0) {
            container.innerHTML = '<p>No products added yet.</p>';
            return;
        }

        // Create results table
        const table = document.createElement('table');
        table.className = 'min-w-full divide-y divide-gray-200';
        
        // Table header
        const thead = document.createElement('thead');
        thead.className = 'bg-gray-50';
        thead.innerHTML = `
            <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            </tr>
        `;
        
        // Table body
        const tbody = document.createElement('tbody');
        tbody.className = 'bg-white divide-y divide-gray-200';
        
        // Add line items
        results.lineItems.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${this.escapeHtml(item.name)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    ${item.quantity}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    ${this.formatCurrency(item.unitPrice)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    ${this.formatCurrency(item.total)}
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Add subtotal, tax, and total rows
        const tfoot = document.createElement('tfoot');
        tfoot.innerHTML = `
            <tr>
                <td colspan="3" class="px-6 py-2 text-right text-sm font-medium text-gray-500">Subtotal:</td>
                <td class="px-6 py-2 text-right text-sm font-medium text-gray-900">
                    ${this.formatCurrency(results.subtotal)}
                </td>
            </tr>
            <tr>
                <td colspan="3" class="px-6 py-2 text-right text-sm font-medium text-gray-500">
                    Tax (${(results.taxRate * 100).toFixed(2)}%):
                </td>
                <td class="px-6 py-2 text-right text-sm font-medium text-gray-900">
                    ${this.formatCurrency(results.taxAmount)}
                </td>
            </tr>
            <tr class="border-t border-gray-200">
                <td colspan="3" class="px-6 py-2 text-right text-sm font-bold text-gray-900">Total:</td>
                <td class="px-6 py-2 text-right text-sm font-bold text-gray-900">
                    ${this.formatCurrency(results.total)}
                </td>
            </tr>
        `;
        
        // Assemble table
        table.appendChild(thead);
        table.appendChild(tbody);
        table.appendChild(tfoot);
        
        // Add to container
        container.appendChild(table);
        
        // Show the container if it was hidden
        container.classList.remove('hidden');
    },
    
    /**
     * Format a number as currency
     * @private
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    },
    
    /**
     * Escape HTML to prevent XSS
     * @private
     */
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};

// Make available globally
window.MultiProductManager = MultiProductManager;

// Make available globally
if (typeof window !== 'undefined') {
    window.MultiProductManager = MultiProductManager;
}

// Export for CommonJS
try {
    module.exports = MultiProductManager;
} catch (e) {}
