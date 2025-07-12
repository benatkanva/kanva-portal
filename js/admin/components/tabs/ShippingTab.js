import { BaseComponent, DataTable, Modal, Form } from '../index';

/**
 * Shipping Tab Component
 * Manages the shipping configuration section of the admin dashboard
 */
class ShippingTab extends BaseComponent {
    /**
     * Create a new ShippingTab
     * @param {Object} options - Component options
     * @param {Object} [options.shipping={}] - Initial shipping configuration
     * @param {Function} [options.onSave] - Callback when shipping config is saved
     */
    constructor({
        shipping = {},
        onSave = null,
        ...rest
    } = {}) {
        super({
            shipping: this.normalizeShippingData(shipping),
            activeSection: 'ground', // 'ground' or 'ltl'
            isEditing: false,
            currentZone: null,
            ...rest
        });

        // Bind methods
        this.handleSectionChange = this.handleSectionChange.bind(this);
        this.handleAddZone = this.handleAddZone.bind(this);
        this.handleEditZone = this.handleEditZone.bind(this);
        this.handleDeleteZone = this.handleDeleteZone.bind(this);
        this.handleSaveZone = this.handleSaveZone.bind(this);
        this.handleCancelEdit = this.handleCancelEdit.bind(this);
        this.handleSavePalletParams = this.handleSavePalletParams.bind(this);
        this.renderZoneForm = this.renderZoneForm.bind(this);
        this.renderPalletParamsForm = this.renderPalletParamsForm.bind(this);
    }

    /**
     * Normalize shipping data to ensure consistent structure
     */
    normalizeShippingData(shipping) {
        const defaultData = {
            palletParameters: {
                unitsPerDisplayBox: 12,
                displayBoxesPerMasterCase: 12,
                masterCasesPerLayer: 11,
                halfPallet: 22,
                fullPallet: 56,
                groundShippingThreshold: 11
            },
            groundShipping: {
                zones: {
                    1: { 
                        name: 'Zone 1', 
                        color: '#d4edda', 
                        states: ['CA'],
                        rates: {
                            '1-3': 5.00,
                            '4-8': 10.00,
                            '9-11': 15.00,
                            '1-master': 20.00
                        }
                    },
                    // Default zones 2-4 with sample data
                    ...Array.from({ length: 3 }, (_, i) => i + 2).reduce((acc, zoneNum) => ({
                        ...acc,
                        [zoneNum]: {
                            name: `Zone ${zoneNum}`,
                            color: zoneNum === 2 ? '#fff3cd' : 
                                   zoneNum === 3 ? '#e2e3e5' : '#f8d7da',
                            states: [],
                            rates: {
                                '1-3': 5.00 + (zoneNum * 5),
                                '4-8': 10.00 + (zoneNum * 5),
                                '9-11': 15.00 + (zoneNum * 5),
                                '1-master': 20.00 + (zoneNum * 5)
                            }
                        }
                    }), {})
                }
            },
            ltlZones: {
                // Default LTL zones
                1: { name: 'Zone 1', rate: 100.00, states: ['CA', 'NV', 'AZ'] },
                2: { name: 'Zone 2', rate: 150.00, states: ['OR', 'WA', 'ID', 'UT'] },
                3: { name: 'Zone 3', rate: 200.00, states: ['CO', 'NM', 'TX', 'OK'] },
                4: { name: 'Zone 4', rate: 250.00, states: ['MT', 'WY', 'ND', 'SD', 'NE', 'KS', 'MO', 'AR', 'LA'] },
                5: { name: 'Zone 5', rate: 300.00, states: ['MN', 'IA', 'WI', 'IL', 'IN', 'MI', 'OH', 'KY', 'TN', 'MS', 'AL', 'GA', 'FL', 'SC', 'NC', 'VA', 'WV', 'MD', 'DE', 'NJ', 'PA', 'NY', 'CT', 'RI', 'MA', 'VT', 'NH', 'ME'] },
                6: { name: 'Hawaii & Alaska', rate: 500.00, states: ['HI', 'AK'] }
            }
        };

        // Merge with provided data
        return {
            ...defaultData,
            ...shipping,
            palletParameters: {
                ...defaultData.palletParameters,
                ...(shipping.palletParameters || {})
            },
            groundShipping: {
                ...defaultData.groundShipping,
                ...(shipping.groundShipping || {})
            },
            ltlZones: {
                ...defaultData.ltlZones,
                ...(shipping.ltlZones || {})
            }
        };
    }

    /**
     * Render the shipping tab
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'shipping-tab';
        
        // Navigation tabs for Ground vs LTL
        const navTabs = document.createElement('ul');
        navTabs.className = 'nav nav-tabs mb-4';
        navTabs.innerHTML = `
            <li class="nav-item">
                <a class="nav-link ${this.data.activeSection === 'ground' ? 'active' : ''}" 
                   href="#" data-section="ground">
                    <i class="fas fa-truck me-1"></i> Ground Shipping
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link ${this.data.activeSection === 'ltl' ? 'active' : ''}" 
                   href="#" data-section="ltl">
                    <i class="fas fa-pallet me-1"></i> LTL Shipping
                </a>
            </li>
        `;
        
        // Content area
        const content = document.createElement('div');
        content.className = 'shipping-content';
        
        // Assemble the component
        this.element.appendChild(navTabs);
        this.element.appendChild(content);
        
        // Render the active section
        this.renderActiveSection();
        
        // Add event listeners
        this.addEventListeners();
        
        return this.element;
    }
    
    /**
     * Render the active section (Ground or LTL)
     */
    renderActiveSection() {
        const content = this.element.querySelector('.shipping-content');
        if (!content) return;
        
        content.innerHTML = '';
        
        if (this.data.activeSection === 'ground') {
            this.renderGroundShippingSection(content);
        } else {
            this.renderLTLShippingSection(content);
        }
    }
    
    /**
     * Render the Ground Shipping section
     */
    renderGroundShippingSection(container) {
        // Pallet Parameters Card
        const palletParamsCard = document.createElement('div');
        palletParamsCard.className = 'card mb-4';
        palletParamsCard.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Pallet Parameters</h5>
                <button class="btn btn-sm btn-outline-primary" id="editPalletParamsBtn">
                    <i class="fas fa-edit me-1"></i> Edit
                </button>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p class="mb-1"><strong>Units per Display Box:</strong> ${this.data.shipping.palletParameters.unitsPerDisplayBox}</p>
                        <p class="mb-1"><strong>Display Boxes per Master Case:</strong> ${this.data.shipping.palletParameters.displayBoxesPerMasterCase}</p>
                        <p class="mb-1"><strong>Master Cases per Layer:</strong> ${this.data.shipping.palletParameters.masterCasesPerLayer}</p>
                    </div>
                    <div class="col-md-6">
                        <p class="mb-1"><strong>Half Pallet (Master Cases):</strong> ${this.data.shipping.palletParameters.halfPallet}</p>
                        <p class="mb-1"><strong>Full Pallet (Master Cases):</strong> ${this.data.shipping.palletParameters.fullPallet}</p>
                        <p class="mb-1"><strong>Ground Shipping Threshold:</strong> ${this.data.shipping.palletParameters.groundShippingThreshold} master cases</p>
                    </div>
                </div>
                <div class="alert alert-info mt-3 mb-0">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Note:</strong> Ground shipping is used for orders under ${this.data.shipping.palletParameters.groundShippingThreshold} master cases. 
                    Larger orders will use LTL shipping rates.
                </div>
            </div>
        `;
        
        // Ground Shipping Zones Card
        const zonesCard = document.createElement('div');
        zonesCard.className = 'card';
        zonesCard.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Ground Shipping Zones</h5>
                <button class="btn btn-sm btn-primary" id="addZoneBtn">
                    <i class="fas fa-plus me-1"></i> Add Zone
                </button>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Zone</th>
                                <th>States</th>
                                <th>1-3 Boxes</th>
                                <th>4-8 Boxes</th>
                                <th>9-11 Boxes</th>
                                <th>1 Master Case</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="zonesTableBody">
                            ${this.renderZonesTableRows()}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Assemble the section
        container.appendChild(palletParamsCard);
        container.appendChild(zonesCard);
    }
    
    /**
     * Render the LTL Shipping section
     */
    renderLTLShippingSection(container) {
        // LTL Shipping Info Card
        const infoCard = document.createElement('div');
        infoCard.className = 'card mb-4';
        infoCard.innerHTML = `
            <div class="card-header">
                <h5 class="mb-0">LTL Shipping Information</h5>
            </div>
            <div class="card-body">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>LTL Shipping</strong> is used for orders of ${this.data.shipping.palletParameters.groundShippingThreshold}+ 
                    master cases. Rates are calculated based on the destination zone.
                </div>
                
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-light">
                            <tr>
                                <th>Zone</th>
                                <th>States</th>
                                <th>Rate</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(this.data.shipping.ltlZones).map(([zoneId, zone]) => `
                                <tr>
                                    <td>${zone.name}</td>
                                    <td>${zone.states.join(', ')}</td>
                                    <td>$${zone.rate.toFixed(2)}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary edit-ltl-zone" data-zone="${zoneId}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Assemble the section
        container.appendChild(infoCard);
    }
    
    /**
     * Render zones table rows
     */
    renderZonesTableRows() {
        return Object.entries(this.data.shipping.groundShipping.zones).map(([zoneId, zone]) => {
            const states = Array.isArray(zone.states) ? zone.states.join(', ') : zone.states || '';
            return `
                <tr style="background-color: ${zone.color}30;">
                    <td>${zone.name}</td>
                    <td>${states}</td>
                    <td>$${zone.rates['1-3'].toFixed(2)}</td>
                    <td>$${zone.rates['4-8'].toFixed(2)}</td>
                    <td>$${zone.rates['9-11'].toFixed(2)}</td>
                    <td>$${zone.rates['1-master'].toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-zone" data-zone="${zoneId}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-zone" data-zone="${zoneId}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    /**
     * Render the zone form in a modal
     */
    renderZoneForm() {
        const isNew = !this.data.currentZone;
        const zone = this.data.currentZone || {
            id: `zone_${Date.now()}`,
            name: '',
            color: '#ffffff',
            states: [],
            rates: {
                '1-3': 0,
                '4-8': 0,
                '9-11': 0,
                '1-master': 0
            }
        };
        
        // Form fields configuration
        const fields = [
            {
                type: 'hidden',
                name: 'id',
                value: zone.id
            },
            {
                type: 'text',
                name: 'name',
                label: 'Zone Name',
                required: true,
                value: zone.name,
                placeholder: 'e.g., Zone 1, West Coast, etc.'
            },
            {
                type: 'color',
                name: 'color',
                label: 'Zone Color',
                value: zone.color || '#ffffff',
                helpText: 'Used for visual identification in the interface'
            },
            {
                type: 'tags',
                name: 'states',
                label: 'States',
                value: Array.isArray(zone.states) ? zone.states.join(',') : zone.states || '',
                placeholder: 'Enter state codes (e.g., CA, NV, AZ)',
                helpText: 'Comma-separated list of 2-letter state codes'
            },
            {
                type: 'divider',
                label: 'Shipping Rates',
                helpText: 'Enter rates for different quantity ranges'
            },
            {
                type: 'number',
                name: 'rate_1_3',
                label: '1-3 Boxes',
                value: zone.rates['1-3'],
                min: '0',
                step: '0.01',
                required: true,
                prepend: '$',
                className: 'mb-3'
            },
            {
                type: 'number',
                name: 'rate_4_8',
                label: '4-8 Boxes',
                value: zone.rates['4-8'],
                min: '0',
                step: '0.01',
                required: true,
                prepend: '$',
                className: 'mb-3'
            },
            {
                type: 'number',
                name: 'rate_9_11',
                label: '9-11 Boxes',
                value: zone.rates['9-11'],
                min: '0',
                step: '0.01',
                required: true,
                prepend: '$',
                className: 'mb-3'
            },
            {
                type: 'number',
                name: 'rate_1_master',
                label: '1 Master Case',
                value: zone.rates['1-master'],
                min: '0',
                step: '0.01',
                required: true,
                prepend: '$',
                helpText: 'Rate for shipping a single master case (${this.data.shipping.palletParameters.displayBoxesPerMasterCase} display boxes)'
            }
        ];
        
        // Create form instance
        const form = new Form({
            fields,
            submitLabel: isNew ? 'Add Zone' : 'Update Zone',
            onCancel: this.handleCancelEdit
        });
        
        // Create modal with form
        this.modal = new Modal({
            title: isNew ? 'Add Shipping Zone' : 'Edit Shipping Zone',
            content: form.element,
            size: 'md',
            onConfirm: () => form.submit(),
            onCancel: this.handleCancelEdit
        });
        
        // Handle form submission
        form.on('submit', (formData) => {
            // Format the data for the zone
            const zoneData = {
                id: formData.id,
                name: formData.name,
                color: formData.color,
                states: formData.states.split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
                rates: {
                    '1-3': parseFloat(formData.rate_1_3) || 0,
                    '4-8': parseFloat(formData.rate_4_8) || 0,
                    '9-11': parseFloat(formData.rate_9_11) || 0,
                    '1-master': parseFloat(formData.rate_1_master) || 0
                }
            };
            
            this.handleSaveZone(zoneData);
        });
        
        // Show the modal
        this.modal.open();
    }
    
    /**
     * Render the pallet parameters form in a modal
     */
    renderPalletParamsForm() {
        const params = this.data.shipping.palletParameters;
        
        // Form fields configuration
        const fields = [
            {
                type: 'divider',
                label: 'Product Packaging',
                helpText: 'Define how products are packaged'
            },
            {
                type: 'number',
                name: 'unitsPerDisplayBox',
                label: 'Units per Display Box',
                value: params.unitsPerDisplayBox,
                min: '1',
                step: '1',
                required: true,
                helpText: 'Number of individual units in each display box'
            },
            {
                type: 'number',
                name: 'displayBoxesPerMasterCase',
                label: 'Display Boxes per Master Case',
                value: params.displayBoxesPerMasterCase,
                min: '1',
                step: '1',
                required: true,
                helpText: 'Number of display boxes that fit in one master case'
            },
            {
                type: 'number',
                name: 'masterCasesPerLayer',
                label: 'Master Cases per Layer',
                value: params.masterCasesPerLayer,
                min: '1',
                step: '1',
                required: true,
                helpText: 'Number of master cases that fit on one layer of a pallet'
            },
            {
                type: 'divider',
                label: 'Pallet Configuration',
                helpText: 'Define pallet capacities'
            },
            {
                type: 'number',
                name: 'halfPallet',
                label: 'Half Pallet (Master Cases)',
                value: params.halfPallet,
                min: '1',
                step: '1',
                required: true,
                helpText: 'Number of master cases that fit on a half pallet'
            },
            {
                type: 'number',
                name: 'fullPallet',
                label: 'Full Pallet (Master Cases)',
                value: params.fullPallet,
                min: '1',
                step: '1',
                required: true,
                helpText: 'Number of master cases that fit on a full pallet'
            },
            {
                type: 'divider',
                label: 'Shipping Thresholds'
            },
            {
                type: 'number',
                name: 'groundShippingThreshold',
                label: 'Ground Shipping Threshold (Master Cases)',
                value: params.groundShippingThreshold,
                min: '1',
                step: '1',
                required: true,
                helpText: 'Maximum number of master cases that can be shipped via ground. Orders exceeding this will use LTL rates.'
            }
        ];
        
        // Create form instance
        const form = new Form({
            fields,
            submitLabel: 'Save Parameters',
            onCancel: this.handleCancelEdit
        });
        
        // Create modal with form
        this.modal = new Modal({
            title: 'Edit Pallet Parameters',
            content: form.element,
            size: 'md',
            onConfirm: () => form.submit(),
            onCancel: this.handleCancelEdit
        });
        
        // Handle form submission
        form.on('submit', (formData) => {
            this.handleSavePalletParams({
                unitsPerDisplayBox: parseInt(formData.unitsPerDisplayBox, 10) || 12,
                displayBoxesPerMasterCase: parseInt(formData.displayBoxesPerMasterCase, 10) || 12,
                masterCasesPerLayer: parseInt(formData.masterCasesPerLayer, 10) || 11,
                halfPallet: parseInt(formData.halfPallet, 10) || 22,
                fullPallet: parseInt(formData.fullPallet, 10) || 56,
                groundShippingThreshold: parseInt(formData.groundShippingThreshold, 10) || 11
            });
        });
        
        // Show the modal
        this.modal.open();
    }
    
    /**
     * Handle section change (Ground/LTL)
     */
    handleSectionChange(section) {
        if (section === this.data.activeSection) return;
        
        this.setState({
            activeSection: section
        });
        
        this.renderActiveSection();
    }
    
    /**
     * Handle add zone button click
     */
    handleAddZone() {
        this.setState({
            isEditing: true,
            currentZone: null
        });
        
        this.renderZoneForm();
    }
    
    /**
     * Handle edit zone
     */
    handleEditZone(zoneId) {
        const zone = this.data.shipping.groundShipping.zones[zoneId];
        if (!zone) return;
        
        this.setState({
            isEditing: true,
            currentZone: { ...zone, id: zoneId }
        });
        
        this.renderZoneForm();
    }
    
    /**
     * Handle delete zone
     */
    handleDeleteZone(zoneId) {
        if (!confirm('Are you sure you want to delete this shipping zone? This action cannot be undone.')) {
            return;
        }
        
        const updatedZones = { ...this.data.shipping.groundShipping.zones };
        delete updatedZones[zoneId];
        
        const updatedShipping = {
            ...this.data.shipping,
            groundShipping: {
                ...this.data.shipping.groundShipping,
                zones: updatedZones
            }
        };
        
        this.setState({
            shipping: updatedShipping,
            isEditing: false,
            currentZone: null
        });
        
        // Notify parent component
        if (typeof this.data.onSave === 'function') {
            this.data.onSave(updatedShipping);
        }
        
        // Re-render the section
        this.renderActiveSection();
        
        // Show success message
        this.showNotification('Shipping zone deleted successfully', 'success');
    }
    
    /**
     * Handle save zone
     */
    handleSaveZone(zoneData) {
        const updatedZones = {
            ...this.data.shipping.groundShipping.zones,
            [zoneData.id]: {
                name: zoneData.name,
                color: zoneData.color,
                states: zoneData.states,
                rates: zoneData.rates
            }
        };
        
        const updatedShipping = {
            ...this.data.shipping,
            groundShipping: {
                ...this.data.shipping.groundShipping,
                zones: updatedZones
            }
        };
        
        // Update state
        this.setState({
            shipping: updatedShipping,
            isEditing: false,
            currentZone: null
        });
        
        // Close the modal
        if (this.modal) {
            this.modal.close();
        }
        
        // Re-render the section
        this.renderActiveSection();
        
        // Notify parent component
        if (typeof this.data.onSave === 'function') {
            this.data.onSave(updatedShipping);
        }
        
        // Show success message
        this.showNotification(
            `Shipping zone ${zoneData.id ? 'updated' : 'added'} successfully`,
            'success'
        );
    }
    
    /**
     * Handle save pallet parameters
     */
    handleSavePalletParams(params) {
        const updatedShipping = {
            ...this.data.shipping,
            palletParameters: {
                ...this.data.shipping.palletParameters,
                ...params
            }
        };
        
        // Update state
        this.setState({
            shipping: updatedShipping,
            isEditing: false
        });
        
        // Close the modal
        if (this.modal) {
            this.modal.close();
        }
        
        // Re-render the section
        this.renderActiveSection();
        
        // Notify parent component
        if (typeof this.data.onSave === 'function') {
            this.data.onSave(updatedShipping);
        }
        
        // Show success message
        this.showNotification('Pallet parameters updated successfully', 'success');
    }
    
    /**
     * Handle cancel edit
     */
    handleCancelEdit() {
        this.setState({
            isEditing: false,
            currentZone: null
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
        // Section navigation
        const navLinks = this.element.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                if (section) {
                    this.handleSectionChange(section);
                }
            });
        });
        
        // Add zone button
        const addZoneBtn = this.element.querySelector('#addZoneBtn');
        if (addZoneBtn) {
            addZoneBtn.addEventListener('click', this.handleAddZone);
        }
        
        // Edit pallet params button
        const editPalletParamsBtn = this.element.querySelector('#editPalletParamsBtn');
        if (editPalletParamsBtn) {
            editPalletParamsBtn.addEventListener('click', () => {
                this.renderPalletParamsForm();
            });
        }
        
        // Edit/delete zone buttons (delegated)
        this.element.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-zone');
            const deleteBtn = e.target.closest('.delete-zone');
            
            if (editBtn) {
                e.preventDefault();
                const zoneId = editBtn.getAttribute('data-zone');
                if (zoneId) {
                    this.handleEditZone(zoneId);
                }
            } else if (deleteBtn) {
                e.preventDefault();
                const zoneId = deleteBtn.getAttribute('data-zone');
                if (zoneId) {
                    this.handleDeleteZone(zoneId);
                }
            }
        });
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
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ShippingTab = ShippingTab;
}

export default ShippingTab;
