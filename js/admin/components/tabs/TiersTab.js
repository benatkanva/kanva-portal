import { BaseComponent, DataTable, Modal, Form } from '../index';

/**
 * Tiers Tab Component
 * Manages the pricing tiers section of the admin dashboard
 */
class TiersTab extends BaseComponent {
    /**
     * Create a new TiersTab
     * @param {Object} options - Component options
     * @param {Array} [options.tiers=[]] - Initial tiers data
     * @param {Function} [options.onSave] - Callback when tiers are saved
     */
    constructor({
        tiers = {},
        onSave = null,
        ...rest
    } = {}) {
        super({
            tiers: this.normalizeTiers(tiers),
            isEditing: false,
            currentTier: null,
            ...rest
        });

        // Bind methods
        this.handleAddTier = this.handleAddTier.bind(this);
        this.handleEditTier = this.handleEditTier.bind(this);
        this.handleDeleteTier = this.handleDeleteTier.bind(this);
        this.handleSaveTier = this.handleSaveTier.bind(this);
        this.handleCancelEdit = this.handleCancelEdit.bind(this);
        this.renderTierForm = this.renderTierForm.bind(this);
    }

    /**
     * Normalize tiers data to ensure consistent structure
     */
    normalizeTiers(tiers) {
        if (!tiers || typeof tiers !== 'object') {
            return {};
        }
        
        // Convert to array, normalize, then back to object
        return Object.entries(tiers).reduce((acc, [id, tier]) => {
            acc[id] = {
                id,
                name: tier.name || `Tier ${id}`,
                description: tier.description || '',
                threshold: parseInt(tier.threshold || 1, 10),
                margin: parseFloat(tier.margin || 0),
                isDefault: Boolean(tier.isDefault),
                ...tier
            };
            return acc;
        }, {});
    }

    /**
     * Render the tiers tab
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'tiers-tab';
        
        // Toolbar with add button
        const toolbar = document.createElement('div');
        toolbar.className = 'd-flex justify-content-between align-items-center mb-4';
        toolbar.innerHTML = `
            <h3>Pricing Tiers</h3>
            <button class="btn btn-primary" id="addTierBtn">
                <i class="fas fa-plus me-1"></i> Add Tier
            </button>
        `;
        
        // Tiers table
        const tableContainer = document.createElement('div');
        tableContainer.className = 'tiers-table';
        
        // Help text
        const helpText = document.createElement('div');
        helpText.className = 'alert alert-info mb-4';
        helpText.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            <strong>How Tiers Work:</strong> Tiers determine pricing based on order quantity. 
            Each tier has a minimum quantity threshold and a margin percentage that applies to the base price.
        `;
        
        // Assemble the component
        this.element.appendChild(toolbar);
        this.element.appendChild(helpText);
        this.element.appendChild(tableContainer);
        
        // Render the tiers table
        this.renderTiersTable();
        
        // Add event listeners
        this.addEventListeners();
        
        return this.element;
    }
    
    /**
     * Render the tiers data table
     */
    renderTiersTable() {
        const tableContainer = this.element.querySelector('.tiers-table');
        if (!tableContainer) return;
        
        // Clear existing table
        tableContainer.innerHTML = '';
        
        // Convert tiers object to array for the table
        const tiersArray = Object.values(this.data.tiers);
        
        // Define table columns
        const columns = [
            {
                key: 'name',
                label: 'Tier Name',
                sortable: true,
                formatter: (value, row) => {
                    const defaultBadge = row.isDefault 
                        ? '<span class="badge bg-primary ms-2">Default</span>' 
                        : '';
                    return `${value}${defaultBadge}`;
                }
            },
            {
                key: 'threshold',
                label: 'Min Qty',
                sortable: true,
                formatter: (value) => `${value}+ units`
            },
            {
                key: 'margin',
                label: 'Margin %',
                sortable: true,
                formatter: (value) => `${value}%`
            },
            {
                key: 'description',
                label: 'Description',
                sortable: false,
                formatter: (value) => value || '—'
            },
            {
                key: 'actions',
                label: 'Actions',
                actions: [
                    {
                        id: 'edit',
                        icon: 'edit',
                        label: 'Edit',
                        class: 'btn-outline-primary btn-sm',
                        disabled: (row) => row.isDefault
                    },
                    {
                        id: 'delete',
                        icon: 'trash',
                        label: 'Delete',
                        class: 'btn-outline-danger btn-sm',
                        disabled: (row) => row.isDefault
                    },
                    {
                        id: 'set_default',
                        icon: 'star',
                        label: 'Set as Default',
                        class: 'btn-outline-warning btn-sm',
                        hidden: (row) => row.isDefault
                    }
                ]
            }
        ];
        
        // Create and render the data table
        this.tiersTable = new DataTable({
            columns,
            data: tiersArray,
            sort: { key: 'threshold', direction: 'asc' },
            pagination: {
                enabled: true,
                pageSize: 10
            }
        });
        
        tableContainer.appendChild(this.tiersTable.render());
    }
    
    /**
     * Render the tier form in a modal
     */
    renderTierForm() {
        // Form fields configuration
        const fields = [
            {
                type: 'hidden',
                name: 'id'
            },
            {
                type: 'text',
                name: 'name',
                label: 'Tier Name',
                required: true,
                placeholder: 'e.g., Wholesale, Retail, Bulk',
                helpText: 'A descriptive name for this pricing tier'
            },
            {
                type: 'number',
                name: 'threshold',
                label: 'Minimum Quantity',
                required: true,
                min: '1',
                step: '1',
                placeholder: 'e.g., 10',
                helpText: 'Minimum order quantity to qualify for this tier'
            },
            {
                type: 'number',
                name: 'margin',
                label: 'Margin Percentage',
                required: true,
                min: '0',
                max: '1000',
                step: '0.01',
                placeholder: 'e.g., 30.50',
                helpText: 'The profit margin percentage applied to the base cost'
            },
            {
                type: 'textarea',
                name: 'description',
                label: 'Description',
                placeholder: 'Enter a description for this tier',
                rows: 3,
                helpText: 'Optional description to provide more context about this tier'
            },
            {
                type: 'checkbox',
                name: 'isDefault',
                label: 'Set as Default Tier',
                helpText: 'This tier will be used as the default for new products',
                disabled: this.data.currentTier && !this.data.currentTier.isDefault
            }
        ];
        
        // Create form instance
        const form = new Form({
            fields,
            submitLabel: this.data.currentTier ? 'Update Tier' : 'Add Tier',
            onCancel: this.handleCancelEdit
        });
        
        // If editing, set the form values
        if (this.data.currentTier) {
            form.setValues(this.data.currentTier);
        }
        
        // Create modal with form
        this.modal = new Modal({
            title: this.data.currentTier ? 'Edit Pricing Tier' : 'Add New Pricing Tier',
            content: form.element,
            size: 'md',
            onConfirm: () => form.submit(),
            onCancel: this.handleCancelEdit
        });
        
        // Handle form submission
        form.on('submit', (formData) => {
            this.handleSaveTier(formData);
        });
        
        // Show the modal
        this.modal.open();
    }
    
    /**
     * Handle add tier button click
     */
    handleAddTier() {
        this.setState({
            isEditing: true,
            currentTier: {
                id: `tier_${Date.now()}`,
                name: '',
                threshold: 1,
                margin: 0,
                description: '',
                isDefault: false
            }
        });
        
        this.renderTierForm();
    }
    
    /**
     * Handle edit tier
     */
    handleEditTier(tierId) {
        const tier = this.data.tiers[tierId];
        if (!tier) return;
        
        this.setState({
            isEditing: true,
            currentTier: { ...tier }
        });
        
        this.renderTierForm();
    }
    
    /**
     * Handle delete tier
     */
    handleDeleteTier(tierId) {
        const tier = this.data.tiers[tierId];
        if (!tier || tier.isDefault) return;
        
        if (!confirm('Are you sure you want to delete this tier? Products using this tier will be moved to the default tier.')) {
            return;
        }
        
        // Create a new tiers object without the deleted tier
        const { [tierId]: _, ...updatedTiers } = this.data.tiers;
        
        this.setState({
            tiers: updatedTiers,
            isEditing: false,
            currentTier: null
        });
        
        // Notify parent component
        if (typeof this.data.onSave === 'function') {
            this.data.onSave(updatedTiers);
        }
        
        // Re-render the table
        this.renderTiersTable();
        
        // Show success message
        this.showNotification('Tier deleted successfully', 'success');
    }
    
    /**
     * Set a tier as the default
     */
    handleSetDefaultTier(tierId) {
        const tier = this.data.tiers[tierId];
        if (!tier || tier.isDefault) return;
        
        // Update all tiers to set the new default and unset the old one
        const updatedTiers = Object.entries(this.data.tiers).reduce((acc, [id, t]) => {
            acc[id] = {
                ...t,
                isDefault: id === tierId
            };
            return acc;
        }, {});
        
        this.setState({
            tiers: updatedTiers
        });
        
        // Notify parent component
        if (typeof this.data.onSave === 'function') {
            this.data.onSave(updatedTiers);
        }
        
        // Re-render the table
        this.renderTiersTable();
        
        // Show success message
        this.showNotification('Default tier updated successfully', 'success');
    }
    
    /**
     * Handle save tier
     */
    handleSaveTier(formData) {
        const { id, ...tierData } = formData;
        const isNew = !id;
        const tierId = id || `tier_${Date.now()}`;
        
        // If this is being set as default, ensure no other tiers are default
        let updatedTiers = { ...this.data.tiers };
        
        if (tierData.isDefault) {
            updatedTiers = Object.entries(updatedTiers).reduce((acc, [tId, tier]) => {
                acc[tId] = {
                    ...tier,
                    isDefault: tId === tierId
                };
                return acc;
            }, {});
        }
        
        // Add/update the tier
        updatedTiers[tierId] = {
            ...(updatedTiers[tierId] || {}),
            ...tierData,
            id: tierId,
            threshold: parseInt(tierData.threshold, 10),
            margin: parseFloat(tierData.margin)
        };
        
        // Update state
        this.setState({
            tiers: updatedTiers,
            isEditing: false,
            currentTier: null
        });
        
        // Close the modal
        if (this.modal) {
            this.modal.close();
        }
        
        // Re-render the table
        this.renderTiersTable();
        
        // Notify parent component
        if (typeof this.data.onSave === 'function') {
            this.data.onSave(updatedTiers);
        }
        
        // Show success message
        this.showNotification(
            `Tier ${isNew ? 'added' : 'updated'} successfully`,
            'success'
        );
    }
    
    /**
     * Handle cancel edit
     */
    handleCancelEdit() {
        this.setState({
            isEditing: false,
            currentTier: null
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
        // Add tier button
        const addBtn = this.element.querySelector('#addTierBtn');
        if (addBtn) {
            addBtn.addEventListener('click', this.handleAddTier);
        }
        
        // Handle table actions
        if (this.tiersTable) {
            this.tiersTable.on('action', ({ actionId, row }) => {
                if (actionId === 'edit') {
                    this.handleEditTier(row.id);
                } else if (actionId === 'delete') {
                    this.handleDeleteTier(row.id);
                } else if (actionId === 'set_default') {
                    this.handleSetDefaultTier(row.id);
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
        
        if (this.tiersTable) {
            this.tiersTable.destroy();
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.TiersTab = TiersTab;
}

export default TiersTab;
