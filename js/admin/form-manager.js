/**
 * Form Manager
 * Handles form rendering, validation, and submission for admin forms
 */

class FormManager {
    /**
     * Initialize the form manager
     * @param {Object} options - Configuration options
     * @param {AdminDashboard} options.dashboard - The admin dashboard instance
     * @param {DataManager} options.dataManager - The data manager instance
     * @param {ModalManager} options.modalManager - The modal manager instance
     */
    constructor({ dashboard, dataManager, modalManager }) {
        if (!dashboard) {
            console.error('FormManager: Dashboard instance is required');
            throw new Error('Dashboard instance is required');
        }

        this.dashboard = dashboard;
        this.dataManager = dataManager || {
            getData: async () => {},
            saveData: async () => {},
            getAllData: async () => ({ products: [], tiers: [], shipping: { zones: [] } })
        };
        
        this.modalManager = modalManager || {
            alert: (message) => window.alert(message),
            confirm: (message) => window.confirm(message),
            prompt: (options) => window.prompt(options?.message || '')
        };
        
        this.forms = new Map();
        this.initialized = false;
    }

    /**
     * Initialize form manager
     */
    init() {
        if (this.initialized) {
            console.warn('FormManager already initialized');
            return;
        }
        
        try {
            this.setupEventListeners();
            this.initialized = true;
            console.log('FormManager initialized');
        } catch (error) {
            console.error('Error initializing FormManager:', error);
            throw error;
        }
    }

    /**
     * Setup event listeners for form actions
     */
    setupEventListeners() {
        // Handle add product button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#add-product')) {
                e.preventDefault();
                this.showProductForm();
            }
            
            // Handle edit product button
            const editBtn = e.target.closest('.edit-product');
            if (editBtn) {
                e.preventDefault();
                const productId = editBtn.dataset.id;
                this.showProductForm(productId);
            }
            
            // Handle delete product button
            const deleteBtn = e.target.closest('.delete-product');
            if (deleteBtn) {
                e.preventDefault();
                const productId = deleteBtn.dataset.id;
                this.confirmDelete('product', productId);
            }
            
            // Handle form submissions
            if (e.target.closest('form[data-form-type]')) {
                e.preventDefault();
                const form = e.target.closest('form');
                this.handleFormSubmit(form);
            }
        });
    }

    /**
     * Show the product form
     * @param {string} productId - The ID of the product to edit (optional)
     */
    async showProductForm(productId = null) {
        const isEdit = !!productId;
        let product = null;
        
        if (isEdit) {
            const { products } = await this.dataManager.getData('products');
            product = products.find(p => p.id === productId);
            if (!product) {
                this.dashboard.notificationManager.show('Product not found', 'error');
                return;
            }
        } else {
            // Default values for new product
            product = {
                id: `prod_${Date.now()}`,
                name: '',
                description: '',
                category: '',
                price: 0,
                cost: 0,
                size: '',
                sku: '',
                inStock: true,
                isActive: true
            };
        }

        // Generate form HTML
        const formHtml = `
            <form data-form-type="product" data-product-id="${product.id}">
                <div class="form-row">
                    <div class="form-group">
                        <label for="product-name">Product Name *</label>
                        <input type="text" id="product-name" name="name" 
                               value="${this.escapeHtml(product.name)}" required>
                    </div>
                    <div class="form-group">
                        <label for="product-sku">SKU</label>
                        <input type="text" id="product-sku" name="sku" 
                               value="${this.escapeHtml(product.sku || '')}">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="product-category">Category</label>
                        <input type="text" id="product-category" name="category" 
                               value="${this.escapeHtml(product.category || '')}">
                    </div>
                    <div class="form-group">
                        <label for="product-size">Size</label>
                        <input type="text" id="product-size" name="size" 
                               value="${this.escapeHtml(product.size || '')}">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="product-price">Price *</label>
                        <div class="input-group">
                            <span class="input-group-text">$</span>
                            <input type="number" id="product-price" name="price" 
                                   step="0.01" min="0" value="${parseFloat(product.price || 0).toFixed(2)}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="product-cost">Cost</label>
                        <div class="input-group">
                            <span class="input-group-text">$</span>
                            <input type="number" id="product-cost" name="cost" 
                                   step="0.01" min="0" value="${parseFloat(product.cost || 0).toFixed(2)}">
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="product-description">Description</label>
                    <textarea id="product-description" name="description" 
                              rows="3">${this.escapeHtml(product.description || '')}</textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-check">
                        <input type="checkbox" id="product-in-stock" name="inStock" 
                               class="form-check-input" ${product.inStock ? 'checked' : ''}>
                        <label class="form-check-label" for="product-in-stock">In Stock</label>
                    </div>
                    <div class="form-check">
                        <input type="checkbox" id="product-active" name="isActive" 
                               class="form-check-input" ${product.isActive !== false ? 'checked' : ''}>
                        <label class="form-check-label" for="product-active">Active</label>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" data-dismiss="modal">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> ${isEdit ? 'Update' : 'Save'} Product
                    </button>
                </div>
            </form>
        `;

        // Show modal with form
        this.modalManager.show({
            title: `${isEdit ? 'Edit' : 'Add New'} Product`,
            content: formHtml,
            size: 'lg',
            onShow: () => {
                // Initialize any form plugins or validators here
            }
        });
    }

    /**
     * Handle form submission
     * @param {HTMLFormElement} form - The form element
     */
    async handleFormSubmit(form) {
        const formType = form.dataset.formType;
        const formData = this.getFormData(form);
        
        try {
            switch (formType) {
                case 'product':
                    await this.saveProduct(formData);
                    break;
                // Add other form types here
                default:
                    throw new Error(`Unknown form type: ${formType}`);
            }
            
            // Show success message
            this.dashboard.notificationManager.show(
                `${formType.charAt(0).toUpperCase() + formType.slice(1)} saved successfully`,
                'success'
            );
            
            // Close the modal
            this.modalManager.hide();
            
            // Refresh the dashboard
            this.dashboard.render();
            
        } catch (error) {
            console.error('Error saving form data:', error);
            this.dashboard.notificationManager.show(
                `Error saving ${formType}: ${error.message}`,
                'error'
            );
        }
    }

    /**
     * Save product data
     * @param {Object} productData - The product data to save
     */
    async saveProduct(productData) {
        const { products } = await this.dataManager.getData('products');
        const existingIndex = products.findIndex(p => p.id === productData.id);
        
        // Convert string values to appropriate types
        const processedData = {
            ...productData,
            price: parseFloat(productData.price) || 0,
            cost: parseFloat(productData.cost) || 0,
            inStock: productData.inStock === 'on' || productData.inStock === true,
            isActive: productData.isActive === 'on' || productData.isActive === true
        };
        
        if (existingIndex >= 0) {
            // Update existing product
            products[existingIndex] = { ...products[existingIndex], ...processedData };
        } else {
            // Add new product
            products.push(processedData);
        }
        
        // Save the updated products array
        await this.dataManager.updateData('products', { products });
    }

    /**
     * Confirm deletion of an item
     * @param {string} type - The type of item to delete (e.g., 'product')
     * @param {string} id - The ID of the item to delete
     */
    async confirmDelete(type, id) {
        const itemName = await this.getItemName(type, id);
        
        this.modalManager.confirm({
            title: `Delete ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
            confirmText: 'Delete',
            confirmClass: 'btn-danger',
            onConfirm: async () => {
                try {
                    await this.deleteItem(type, id);
                    this.dashboard.notificationManager.show(
                        `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
                        'success'
                    );
                    this.dashboard.render();
                } catch (error) {
                    console.error(`Error deleting ${type}:`, error);
                    this.dashboard.notificationManager.show(
                        `Error deleting ${type}: ${error.message}`,
                        'error'
                    );
                }
            }
        });
    }

    /**
     * Delete an item
     * @param {string} type - The type of item to delete
     * @param {string} id - The ID of the item to delete
     */
    async deleteItem(type, id) {
        switch (type) {
            case 'product':
                const { products } = await this.dataManager.getData('products');
                const updatedProducts = products.filter(p => p.id !== id);
                await this.dataManager.updateData('products', { products: updatedProducts });
                break;
            // Add other item types here
            default:
                throw new Error(`Unsupported item type: ${type}`);
        }
    }

    /**
     * Get the display name of an item
     * @param {string} type - The type of item
     * @param {string} id - The ID of the item
     * @returns {Promise<string>} The item's display name
     */
    async getItemName(type, id) {
        switch (type) {
            case 'product':
                const { products } = await this.dataManager.getData('products');
                const product = products.find(p => p.id === id);
                return product ? product.name : `#${id}`;
            // Add other item types here
            default:
                return `#${id}`;
        }
    }

    /**
     * Get form data as an object
     * @param {HTMLFormElement} form - The form element
     * @returns {Object} The form data as key-value pairs
     */
    getFormData(form) {
        const formData = {};
        const formElements = form.elements;
        
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            
            if (element.name && !element.disabled) {
                if (element.type === 'checkbox') {
                    formData[element.name] = element.checked;
                } else if (element.type === 'radio' && !element.checked) {
                    // Skip unchecked radio buttons
                    continue;
                } else if (element.type === 'file') {
                    // Handle file uploads
                    formData[element.name] = element.files;
                } else {
                    formData[element.name] = element.value;
                }
            }
        }
        
        // Add any additional data from data attributes
        if (form.dataset.productId) {
            formData.id = form.dataset.productId;
        }
        
        return formData;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} str - The string to escape
     * @returns {string} The escaped string
     */
    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.FormManager = FormManager;
}
