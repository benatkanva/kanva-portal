/**
 * Template Manager
 * Handles HTML template generation and rendering
 */

class TemplateManager {
    constructor() {
        this.templates = {};
        this.stateData = null;
        this.loadStateData();
    }

    /**
     * Load US states data for dropdowns
     */
    async loadStateData() {
        try {
            const response = await fetch('./data/us-states.json');
            this.stateData = await response.json();
        } catch (error) {
            console.error('Failed to load state data:', error);
            // Fallback to basic state list
            this.stateData = {
                states: [
                    { code: "CA", name: "California" },
                    { code: "NY", name: "New York" },
                    { code: "TX", name: "Texas" }
                ]
            };
        }
    }

    /**
     * Generate state dropdown options HTML
     */
    generateStateOptions() {
        if (!this.stateData) return '<option value="">Loading states...</option>';
        
        return this.stateData.states.map(state => 
            `<option value="${state.code}">${state.code}</option>`
        ).join('\n');
    }

    /**
     * Get shipping zone for state
     */
    getShippingZone(stateCode) {
        if (!this.stateData) return 'Standard';
        
        const state = this.stateData.states.find(s => s.code === stateCode);
        return state ? state.shippingZone : 'Standard';
    }

    /**
     * Get shipping cost for zone
     */
    getShippingCost(zone) {
        if (!this.stateData || !this.stateData.shippingZones[zone]) return 0;
        return this.stateData.shippingZones[zone].cost;
    }

    /**
     * Populate state dropdown in existing HTML
     */
    populateStateDropdown(selectElement) {
        if (!selectElement) return;
        
        // Keep the first option (placeholder)
        const placeholder = selectElement.querySelector('option[value=""]');
        selectElement.innerHTML = '';
        
        if (placeholder) {
            selectElement.appendChild(placeholder);
        }
        
        // Add state options
        if (this.stateData) {
            this.stateData.states.forEach(state => {
                const option = document.createElement('option');
                option.value = state.code;
                option.textContent = state.code;
                selectElement.appendChild(option);
            });
        }
    }

    /**
     * Initialize existing elements with dynamic data
     */
    initializeElements() {
        // Populate state dropdowns
        const stateSelects = document.querySelectorAll('#customerState, select[id*="state"]');
        stateSelects.forEach(select => this.populateStateDropdown(select));
    }

    /**
     * Get template by name (for future expansion)
     */
    getTemplate(name) {
        return this.templates[name] || null;
    }

    /**
     * Register a template
     */
    registerTemplate(name, template) {
        this.templates[name] = template;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.TemplateManager = TemplateManager;
}
