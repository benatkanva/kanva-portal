import { BaseComponent, DataTable, Modal, Form } from '../index';

/**
 * Products Tab Component
 * Manages the products section of the admin dashboard
 */
class ProductsTab extends BaseComponent {
    /**
     * Create a new ProductsTab
     * @param {Object} options - Component options
     * @param {Array} [options.products=[]] - Initial products data
     * @param {Object} [options.tiers={}] - Pricing tiers data
     * @param {Function} [options.onSave] - Callback when products are saved
     */
    constructor({
        products = [],
        tiers = {},
        onSave = null,
        ...rest
    } = {}) {
        super({
            products,
            tiers,
            isEditing: false,
            currentProduct: null,
            ...rest
        });

        // Bind methods
        this.handleAddProduct = this.handleAddProduct.bind(this);
        this.handleEditProduct = this.handleEditProduct.bind(this);
        this.handleDeleteProduct = this.handleDeleteProduct.bind(this);
        this.handleSaveProduct = this.handleSaveProduct.bind(this);
        this.handleCancelEdit = this.handleCancelEdit.bind(this);
        this.renderProductForm = this.renderProductForm.bind(this);
    }

    /**
     * Render the products tab
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'products-tab';
        
        // Toolbar with add button
        const toolbar = document.createElement('div');
        toolbar.className = 'd-flex justify-content-between align-items-center mb-4';
        toolbar.innerHTML = `
            <h3>Products</h3>
            <button class="btn btn-primary" id="addProductBtn">
                <i class="fas fa-plus me-1"></i> Add Product
            </button>
        `;
        
        // Products table
        const tableContainer = document.createElement('div');
        tableContainer.className = 'products-table';
        
        // Assemble the component
        this.element.appendChild(toolbar);
        this.element.appendChild(tableContainer);
        
        // Render the products table
        this.renderProductsTable();
        
        // Add event listeners
        this.addEventListeners();
        
        return this.element;
    }
    
    /**
     * Render the products data table
     */
    renderProductsTable() {
        const tableContainer = this.element.querySelector('.products-table');
        if (!tableContainer) return;
        
        // Clear existing table
        tableContainer.innerHTML = '';
        
        // Define table columns
        const columns = [
            {
                key: 'name',
                label: 'Product Name',
                sortable: true
            },
            {
                key: 'itemNumber',
                label: 'Item #',
                sortable: true
            },
            {
                key: 'price',
                label: 'Price',
                sortable: true,
                formatter: (value) => `$${parseFloat(value).toFixed(2)}`
            },
            {
                key: 'msrp',
                label: 'MSRP',
                sortable: true,
                formatter: (value) => value ? `$${parseFloat(value).toFixed(2)}` : 'N/A'
            },
            {
                key: 'active',
                label: 'Status',
                sortable: true,
                formatter: (value) => `
                    <span class="badge ${value ? 'bg-success' : 'bg-secondary'}">
                        ${value ? 'Active' : 'Inactive'}
                    </span>
                `
            },
            {
                key: 'actions',
                label: 'Actions',
                actions: [
                    {
                        id: 'edit',
                        icon: 'edit',
                        label: 'Edit',
                        class: 'btn-outline-primary btn-sm'
                    },
                    {
                        id: 'delete',
                        icon: 'trash',
                        label: 'Delete',
                        class: 'btn-outline-danger btn-sm'
                    }
                ]
            }
        ];
        
        // Create and render the data table
        this.productsTable = new DataTable({
            columns,
            data: this.data.products,
            selectable: true,
            pagination: {
                enabled: true,
                pageSize: 10
            },
            onRowClick: (row) => this.handleEditProduct(row.id)
        });
        
        tableContainer.appendChild(this.productsTable.render());
    }
    
    /**
     * Render the product form in a modal
     */
    renderProductForm() {
        // Get tier options for the select field
        const tierOptions = Object.entries(this.data.tiers).map(([id, tier]) => ({
            value: id,
            label: tier.name || `Tier ${id}`
        }));
        
        // Form fields configuration
        const fields = [
            {
                type: 'hidden',
                name: 'id'
            },
            {
                type: 'text',
                name: 'name',
                label: 'Product Name',
                required: true,
                placeholder: 'Enter product name'
            },
            {
                type: 'text',
                name: 'itemNumber',
                label: 'Item Number',
                required: true,
                placeholder: 'Enter item number'
            },
            {
                type: 'textarea',
                name: 'description',
                label: 'Description',
                placeholder: 'Enter product description',
                rows: 3
            },
            {
                type: 'number',
                name: 'price',
                label: 'Price',
                required: true,
                placeholder: '0.00',
                step: '0.01',
                min: '0'
            },
            {
                type: 'number',
                name: 'msrp',
                label: 'MSRP',
                placeholder: '0.00',
                step: '0.01',
                min: '0',
                helpText: 'Leave empty if same as price'
            },
            {
                type: 'select',
                name: 'tier',
                label: 'Pricing Tier',
                options: [
                    { value: '', label: 'Select a tier' },
                    ...tierOptions
                ],
                helpText: 'Select the pricing tier for this product'
            },
            {
                type: 'checkbox',
                name: 'active',
                label: 'Active',
                checked: true,
                helpText: 'Inactive products will not appear in the calculator'
            },
            {
                type: 'file',
                name: 'image',
                label: 'Product Image',
                accept: 'image/*',
                helpText: 'Upload a product image (JPG, PNG, or GIF)'
            }
        ];
        
        // Create form instance
        const form = new Form({
            fields,
            submitLabel: 'Save Product',
            onCancel: this.handleCancelEdit
        });
        
        // If editing, set the form values
        if (this.data.currentProduct) {
            form.setValues(this.data.currentProduct);
        }
        
        // Create modal with form
        this.modal = new Modal({
            title: this.data.currentProduct ? 'Edit Product' : 'Add New Product',
            content: form.element,
            size: 'lg',
            onConfirm: () => form.submit(),
            onCancel: this.handleCancelEdit
        });
        
        // Handle form submission
        form.on('submit', (formData) => {
            this.handleSaveProduct(formData);
        });
        
        // Show the modal
        this.modal.open();
    }
    
    /**
     * Handle add product button click
     */
    handleAddProduct() {
        this.setState({
            isEditing: true,
            currentProduct: null
        });
        
        this.renderProductForm();
    }
    
    /**
     * Handle edit product
     */
    handleEditProduct(productId) {
        const product = this.data.products.find(p => p.id === productId);
        if (!product) return;
        
        this.setState({
            isEditing: true,
            currentProduct: { ...product }
        });
        
        this.renderProductForm();
    }
    
    /**
     * Handle delete product
     */
    handleDeleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }
        
        // In a real app, this would be an API call
        const updatedProducts = this.data.products.filter(p => p.id !== productId);
        
        this.setState({
            products: updatedProducts
        });
        
        // Notify parent component
        if (typeof this.data.onSave === 'function') {
            this.data.onSave(updatedProducts);
        }
        
        // Re-render the table
        this.renderProductsTable();
        
        // Show success message
        this.showNotification('Product deleted successfully', 'success');
    }
    
    /**
     * Handle save product
     */
    handleSaveProduct(formData) {
        let updatedProducts;
        
        if (formData.id) {
            // Update existing product
            updatedProducts = this.data.products.map(p => 
                p.id === formData.id ? { ...p, ...formData } : p
            );
        } else {
            // Add new product
            const newProduct = {
                ...formData,
                id: `prod_${Date.now()}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            updatedProducts = [...this.data.products, newProduct];
        }
        
        // Update state
        this.setState({
            products: updatedProducts,
            isEditing: false,
            currentProduct: null
        });
        
        // Close the modal
        if (this.modal) {
            this.modal.close();
        }
        
        // Re-render the table
        this.renderProductsTable();
        
        // Notify parent component
        if (typeof this.data.onSave === 'function') {
            this.data.onSave(updatedProducts);
        }
        
        // Show success message
        this.showNotification(
            `Product ${formData.id ? 'updated' : 'added'} successfully`,
            'success'
        );
    }
    
    /**
     * Handle cancel edit
     */
    handleCancelEdit() {
        this.setState({
            isEditing: false,
            currentProduct: null
        });
        
        if (this.modal) {
            this.modal.close();
        }
    }
    
    /**
     * Show a notification
     */
    showNotification(message, type = 'info') {
        // In a real app, you would use a notification component
        console.log(`[${type.toUpperCase()}] ${message}`);
        // This would typically show a toast notification
        alert(`${type.toUpperCase()}: ${message}`);
    }
    
    /**
     * Add event listeners
     */
    addEventListeners() {
        // Add product button
        const addBtn = this.element.querySelector('#addProductBtn');
        if (addBtn) {
            addBtn.addEventListener('click', this.handleAddProduct);
        }
        
        // Handle table actions
        if (this.productsTable) {
            this.productsTable.on('action', ({ actionId, row }) => {
                if (actionId === 'edit') {
                    this.handleEditProduct(row.id);
                } else if (actionId === 'delete') {
                    this.handleDeleteProduct(row.id);
                }
            });
        }
    }
    
    /**
     * Lifecycle hook - called after component is mounted
     */
    onMount() {
        // Add any additional setup needed after the component is mounted
    }
    
    /**
     * Lifecycle hook - called before component is unmounted
     */
    onBeforeUnmount() {
        // Clean up any event listeners or resources
        if (this.modal) {
            this.modal.close();
        }
        
        if (this.productsTable) {
            this.productsTable.destroy();
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ProductsTab = ProductsTab;
}

export default ProductsTab;
