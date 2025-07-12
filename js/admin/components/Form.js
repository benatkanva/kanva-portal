import BaseComponent from './BaseComponent';

/**
 * Form Component
 * A reusable form component with validation and field management
 */
class Form extends BaseComponent {
    /**
     * Create a new Form
     * @param {Object} options - Component options
     * @param {Array} [options.fields=[]] - Form field definitions
     * @param {Object} [options.initialValues={}] - Initial form values
     * @param {boolean} [options.showSubmit=true] - Whether to show the submit button
     * @param {string} [options.submitLabel='Submit'] - Submit button label
     * @param {string} [options.submitClass='btn-primary'] - Submit button CSS class
     * @param {boolean} [options.showReset=false] - Whether to show the reset button
     * @param {string} [options.resetLabel='Reset'] - Reset button label
     * @param {string} [options.resetClass='btn-secondary'] - Reset button CSS class
     * @param {string} [options.layout='vertical'] - Form layout ('vertical' or 'horizontal')
     * @param {boolean} [options.liveValidation=true] - Whether to validate on field change
     * @param {boolean} [options.requiredText='Required'] - Text to show for required fields
     */
    constructor({
        fields = [],
        initialValues = {},
        showSubmit = true,
        submitLabel = 'Submit',
        submitClass = 'btn-primary',
        showReset = false,
        resetLabel = 'Reset',
        resetClass = 'btn-secondary',
        layout = 'vertical',
        liveValidation = true,
        requiredText = 'Required',
        ...rest
    } = {}) {
        super({
            fields: this.normalizeFields(fields, initialValues),
            values: { ...initialValues },
            errors: {},
            touched: {},
            isSubmitting: false,
            isValid: false,
            showSubmit,
            submitLabel,
            submitClass,
            showReset,
            resetLabel,
            resetClass,
            layout,
            liveValidation,
            requiredText,
            ...rest
        });
        
        // Bind methods
        this.handleChange = this.handleChange.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleReset = this.handleReset.bind(this);
        this.validateForm = this.validateForm.bind(this);
        this.validateField = this.validateField.bind(this);
        this.setFieldValue = this.setFieldValue.bind(this);
        this.setFieldTouched = this.setFieldTouched.bind(this);
        this.setFieldError = this.setFieldError.bind(this);
        this.setValues = this.setValues.bind(this);
        this.setErrors = this.setErrors.bind(this);
        this.setTouched = this.setTouched.bind(this);
        this.resetForm = this.resetForm.bind(this);
        this.getFieldValue = this.getFieldValue.bind(this);
        this.getFieldError = this.getFieldError.bind(this);
        this.isFieldTouched = this.isFieldTouched.bind(this);
        this.isFieldValid = this.isFieldValid.bind(this);
    }
    
    /**
     * Normalize field definitions and set initial values
     */
    normalizeFields(fields, initialValues) {
        return fields.map(field => ({
            type: 'text',
            required: false,
            disabled: false,
            readOnly: false,
            placeholder: '',
            helpText: '',
            options: [],
            rows: 3,
            cols: 30,
            step: 1,
            min: null,
            max: null,
            minLength: null,
            maxLength: null,
            pattern: null,
            autoComplete: 'on',
            autoFocus: false,
            className: '',
            wrapperClass: '',
            labelClass: '',
            inputClass: '',
            validation: null,
            ...field,
            value: initialValues[field.name] ?? field.defaultValue ?? ''
        }));
    }
    
    /**
     * Render the form
     */
    render() {
        this.element = document.createElement('form');
        this.element.className = `admin-form ${this.data.layout === 'horizontal' ? 'form-horizontal' : ''}`;
        this.element.noValidate = true;
        
        // Render form fields
        const fieldsHtml = this.data.fields.map(field => this.renderField(field)).join('');
        
        // Render form actions
        const actionsHtml = this.renderFormActions();
        
        this.element.innerHTML = `
            ${fieldsHtml}
            ${actionsHtml}
        `;
        
        // Add event listeners
        this.addEventListeners();
        
        // Initial validation
        this.validateForm();
        
        return this.element;
    }
    
    /**
     * Render a form field
     */
    renderField(field) {
        const fieldId = `form-field-${field.name}`;
        const isInvalid = this.data.errors[field.name] && this.data.touched[field.name];
        const fieldClasses = [
            'form-group',
            `form-group-${field.type}`,
            field.required ? 'required' : '',
            isInvalid ? 'has-error' : '',
            field.wrapperClass
        ].filter(Boolean).join(' ');
        
        const labelClasses = [
            'form-label',
            this.data.layout === 'horizontal' ? 'col-form-label' : '',
            field.labelClass
        ].filter(Boolean).join(' ');
        
        const inputClasses = [
            'form-control',
            isInvalid ? 'is-invalid' : '',
            field.inputClass
        ].filter(Boolean).join(' ');
        
        const helpText = field.helpText ? `
            <small class="form-text text-muted">${field.helpText}</small>
        ` : '';
        
        const errorMessage = isInvalid ? `
            <div class="invalid-feedback">
                ${this.data.errors[field.name]}
            </div>
        ` : '';
        
        const label = field.label ? `
            <label for="${fieldId}" class="${labelClasses}">
                ${field.label}
                ${field.required ? ' <span class="text-danger">*</span>' : ''}
            </label>
        ` : '';
        
        const input = this.renderInput(field, fieldId, inputClasses);
        
        if (this.data.layout === 'horizontal') {
            return `
                <div class="${fieldClasses} row mb-3">
                    ${label ? `
                        <div class="col-sm-3">
                            ${label}
                        </div>
                        <div class="col-sm-9">
                            ${input}
                            ${helpText}
                            ${errorMessage}
                        </div>
                    ` : `
                        <div class="col-sm-9 offset-sm-3">
                            <div class="form-check">
                                ${input}
                                <label class="form-check-label" for="${fieldId}">
                                    ${field.label}
                                    ${field.required ? ' <span class="text-danger">*</span>' : ''}
                                </label>
                            </div>
                            ${helpText}
                            ${errorMessage}
                        </div>
                    `}
                </div>
            `;
        }
        
        return `
            <div class="${fieldClasses} mb-3">
                ${label}
                ${input}
                ${helpText}
                ${errorMessage}
            </div>
        `;
    }
    
    /**
     * Render form input based on field type
     */
    renderInput(field, fieldId, inputClasses) {
        const commonAttrs = `
            id="${fieldId}"
            name="${field.name}"
            class="${inputClasses}"
            ${field.required ? 'required' : ''}
            ${field.disabled ? 'disabled' : ''}
            ${field.readOnly ? 'readonly' : ''}
            ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
            ${field.autoFocus ? 'autofocus' : ''}
            ${field.autoComplete ? `autocomplete="${field.autoComplete}"` : ''}
            ${field.pattern ? `pattern="${field.pattern}"` : ''}
            ${field.min !== null && field.min !== undefined ? `min="${field.min}"` : ''}
            ${field.max !== null && field.max !== undefined ? `max="${field.max}"` : ''}
            ${field.minLength !== null && field.minLength !== undefined ? `minlength="${field.minLength}"` : ''}
            ${field.maxLength !== null && field.maxLength !== undefined ? `maxlength="${field.maxLength}"` : ''}
            ${field.step ? `step="${field.step}"` : ''}
        `;
        
        switch (field.type) {
            case 'textarea':
                return `
                    <textarea ${commonAttrs} rows="${field.rows}" cols="${field.cols}">${field.value || ''}</textarea>
                `;
                
            case 'select':
                const options = Array.isArray(field.options) 
                    ? field.options.map(opt => {
                        if (typeof opt === 'string') {
                            return { value: opt, label: opt };
                        }
                        return opt;
                    })
                    : [];
                
                return `
                    <select ${commonAttrs}>
                        ${field.placeholder ? `
                            <option value="" disabled ${!field.value ? 'selected' : ''}>
                                ${field.placeholder}
                            </option>
                        ` : ''}
                        ${options.map(opt => `
                            <option 
                                value="${opt.value}" 
                                ${String(opt.value) === String(field.value) ? 'selected' : ''}
                            >
                                ${opt.label || opt.value}
                            </option>
                        `).join('')}
                    </select>
                `;
                
            case 'checkbox':
            case 'radio':
                if (field.options && field.options.length > 0) {
                    return field.options.map((opt, index) => {
                        const optionId = `${fieldId}-${index}`;
                        const optionValue = typeof opt === 'object' ? opt.value : opt;
                        const optionLabel = typeof opt === 'object' ? opt.label : opt;
                        const isChecked = Array.isArray(field.value) 
                            ? field.value.includes(optionValue)
                            : String(field.value) === String(optionValue);
                        
                        return `
                            <div class="form-check ${field.type === 'radio' ? 'form-check-inline' : ''}">
                                <input 
                                    type="${field.type}"
                                    id="${optionId}"
                                    name="${field.name}${field.type === 'checkbox' ? '[]' : ''}"
                                    class="form-check-input ${isChecked ? 'is-valid' : ''}"
                                    value="${optionValue}"
                                    ${isChecked ? 'checked' : ''}
                                    ${field.required ? 'required' : ''}
                                    ${field.disabled ? 'disabled' : ''}
                                >
                                <label class="form-check-label" for="${optionId}">
                                    ${optionLabel || optionValue}
                                </label>
                            </div>
                        `;
                    }).join('');
                }
                
                return `
                    <div class="form-check">
                        <input 
                            type="${field.type}"
                            ${commonAttrs}
                            ${field.value ? 'checked' : ''}
                            value="${field.value || 'on'}"
                        >
                    </div>
                `;
                
            case 'file':
                return `
                    <input type="file" ${commonAttrs}>
                `;
                
            case 'hidden':
                return `
                    <input type="hidden" name="${field.name}" value="${field.value || ''}">
                `;
                
            default:
                return `
                    <input 
                        type="${field.type}" 
                        ${commonAttrs}
                        value="${field.value || ''}"
                    >
                `;
        }
    }
    
    /**
     * Render form actions (submit, reset buttons)
     */
    renderFormActions() {
        if (!this.data.showSubmit && !this.data.showReset) {
            return '';
        }
        
        const submitBtn = this.data.showSubmit ? `
            <button 
                type="submit" 
                class="btn ${this.data.submitClass} me-2"
                ${this.data.isSubmitting ? 'disabled' : ''}
            >
                ${this.data.isSubmitting ? `
                    <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Processing...
                ` : this.data.submitLabel}
            </button>
        ` : '';
        
        const resetBtn = this.data.showReset ? `
            <button 
                type="button" 
                class="btn ${this.data.resetClass}"
                ${this.data.isSubmitting ? 'disabled' : ''}
            >
                ${this.data.resetLabel}
            </button>
        ` : '';
        
        return `
            <div class="form-actions mt-4">
                ${submitBtn}
                ${resetBtn}
            </div>
        `;
    }
    
    /**
     * Add event listeners to form elements
     */
    addEventListeners() {
        if (!this.element) return;
        
        // Form submission
        this.element.addEventListener('submit', this.handleSubmit);
        
        // Form reset
        const resetBtn = this.element.querySelector('button[type="button"]');
        if (resetBtn) {
            resetBtn.addEventListener('click', this.handleReset);
        }
        
        // Input change events
        const inputs = this.element.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            // Skip file inputs for change events (handled separately)
            if (input.type === 'file') {
                input.addEventListener('change', (e) => this.handleChange(e, true));
            } else {
                input.addEventListener('input', this.handleChange);
                input.addEventListener('change', this.handleChange);
            }
            
            // Blur events for validation
            if (this.data.liveValidation) {
                input.addEventListener('blur', this.handleBlur);
            }
        });
    }
    
    /**
     * Handle form submission
     */
    handleSubmit(e) {
        e.preventDefault();
        
        // Mark all fields as touched for validation
        const touched = {};
        this.data.fields.forEach(field => {
            touched[field.name] = true;
        });
        
        this.setState({
            touched,
            isSubmitting: true
        });
        
        // Validate form
        const errors = this.validateForm();
        const isValid = Object.keys(errors).length === 0;
        
        this.setState({
            errors,
            isValid,
            isSubmitting: false
        });
        
        if (isValid) {
            // Get form values
            const formData = this.getFormData();
            
            // Emit submit event with form data
            this.emit('submit', formData);
        } else {
            // Focus first invalid field
            const firstErrorField = this.data.fields.find(field => errors[field.name]);
            if (firstErrorField) {
                const input = this.element.querySelector(`[name="${firstErrorField.name}"]`);
                if (input) input.focus();
            }
        }
    }
    
    /**
     * Handle form reset
     */
    handleReset() {
        this.resetForm();
        this.emit('reset');
    }
    
    /**
     * Handle input change
     */
    handleChange(e, isFile = false) {
        const target = e.target;
        const name = target.name;
        let value;
        
        if (isFile) {
            // Handle file input
            value = target.files[0];
        } else if (target.type === 'checkbox') {
            // Handle checkboxes
            if (target.name.endsWith('[]')) {
                // Multiple checkboxes with the same name
                const checkboxes = this.element.querySelectorAll(`input[name="${target.name}"]`);
                value = Array.from(checkboxes)
                    .filter(checkbox => checkbox.checked)
                    .map(checkbox => checkbox.value);
            } else {
                // Single checkbox
                value = target.checked;
            }
        } else if (target.type === 'radio') {
            // Handle radio buttons
            const selected = this.element.querySelector(`input[name="${target.name}"]:checked`);
            value = selected ? selected.value : '';
        } else {
            // Handle other input types
            value = target.type === 'number' && target.value !== '' 
                ? parseFloat(target.value) 
                : target.value;
        }
        
        // Update field value
        this.setFieldValue(name, value);
        
        // Validate field if live validation is enabled and field has been touched
        if (this.data.liveValidation && this.data.touched[name]) {
            this.validateField(name, value);
        }
        
        // Emit change event
        this.emit('change', {
            name,
            value,
            event: e
        });
    }
    
    /**
     * Handle input blur
     */
    handleBlur(e) {
        const name = e.target.name;
        
        // Mark field as touched
        this.setFieldTouched(name, true);
        
        // Validate field if live validation is enabled
        if (this.data.liveValidation) {
            const value = this.getFieldValue(name);
            this.validateField(name, value);
        }
        
        // Emit blur event
        this.emit('blur', {
            name,
            value: e.target.value,
            event: e
        });
    }
    
    /**
     * Validate the entire form
     */
    validateForm() {
        const errors = {};
        
        this.data.fields.forEach(field => {
            const value = this.getFieldValue(field.name);
            const error = this.validateField(field.name, value, true);
            
            if (error) {
                errors[field.name] = error;
            }
        });
        
        // Update form validity
        this.setState({
            errors,
            isValid: Object.keys(errors).length === 0
        });
        
        return errors;
    }
    
    /**
     * Validate a single field
     */
    validateField(name, value, silent = false) {
        const field = this.data.fields.find(f => f.name === name);
        if (!field) return null;
        
        let error = null;
        
        // Required validation
        if (field.required) {
            if (value === null || value === undefined || value === '') {
                error = this.data.requiredText;
            } else if (Array.isArray(value) && value.length === 0) {
                error = this.data.requiredText;
            }
        }
        
        // Min length validation
        if (!error && field.minLength !== null && value && value.length < field.minLength) {
            error = `Must be at least ${field.minLength} characters`;
        }
        
        // Max length validation
        if (!error && field.maxLength !== null && value && value.length > field.maxLength) {
            error = `Must be no more than ${field.maxLength} characters`;
        }
        
        // Min value validation
        if (!error && field.min !== null && value !== '' && !isNaN(value) && parseFloat(value) < field.min) {
            error = `Must be at least ${field.min}`;
        }
        
        // Max value validation
        if (!error && field.max !== null && value !== '' && !isNaN(value) && parseFloat(value) > field.max) {
            error = `Must be no more than ${field.max}`;
        }
        
        // Pattern validation
        if (!error && field.pattern && value) {
            const regex = new RegExp(field.pattern);
            if (!regex.test(value)) {
                error = field.patternMessage || 'Invalid format';
            }
        }
        
        // Custom validation
        if (!error && typeof field.validation === 'function') {
            const customError = field.validation(value, this.getFormData());
            if (customError) {
                error = customError;
            }
        }
        
        if (!silent) {
            // Update field error state
            this.setFieldError(name, error);
        }
        
        return error;
    }
    
    /**
     * Get form data as an object
     */
    getFormData() {
        const formData = {};
        
        this.data.fields.forEach(field => {
            formData[field.name] = this.getFieldValue(field.name);
        });
        
        return formData;
    }
    
    /**
     * Set form values
     */
    setValues(values) {
        if (!values || typeof values !== 'object') return;
        
        // Update field values
        const updatedFields = this.data.fields.map(field => {
            if (values.hasOwnProperty(field.name)) {
                return { ...field, value: values[field.name] };
            }
            return field;
        });
        
        this.setState({
            fields: updatedFields,
            values: { ...this.data.values, ...values }
        });
        
        // Re-validate form
        this.validateForm();
    }
    
    /**
     * Set a field value
     */
    setFieldValue(name, value) {
        const fieldIndex = this.data.fields.findIndex(f => f.name === name);
        if (fieldIndex === -1) return;
        
        // Update field value
        const updatedFields = [...this.data.fields];
        updatedFields[fieldIndex] = {
            ...updatedFields[fieldIndex],
            value
        };
        
        // Update form values
        const updatedValues = { ...this.data.values };
        
        // Handle array values for checkboxes
        if (name.endsWith('[]')) {
            const baseName = name.replace(/\[\]$/, '');
            if (!Array.isArray(updatedValues[baseName])) {
                updatedValues[baseName] = [];
            }
            
            // This is a simplified version - actual implementation would need to handle
            // adding/removing from the array based on the checkbox state
            updatedValues[baseName] = Array.isArray(value) ? value : [value];
        } else {
            updatedValues[name] = value;
        }
        
        this.setState({
            fields: updatedFields,
            values: updatedValues
        });
    }
    
    /**
     * Set field errors
     */
    setErrors(errors) {
        this.setState({
            errors: { ...this.data.errors, ...errors },
            isValid: Object.keys({ ...this.data.errors, ...errors }).length === 0
        });
    }
    
    /**
     * Set a field error
     */
    setFieldError(name, error) {
        const updatedErrors = { ...this.data.errors };
        
        if (error) {
            updatedErrors[name] = error;
        } else {
            delete updatedErrors[name];
        }
        
        this.setErrors(updatedErrors);
    }
    
    /**
     * Set touched state for fields
     */
    setTouched(touched) {
        this.setState({
            touched: { ...this.data.touched, ...touched }
        });
    }
    
    /**
     * Set a field's touched state
     */
    setFieldTouched(name, isTouched = true) {
        this.setTouched({ [name]: isTouched });
    }
    
    /**
     * Reset the form to initial values
     */
    resetForm(initialValues = null) {
        const values = initialValues || this.data.initialValues || {};
        
        this.setState({
            values: { ...values },
            errors: {},
            touched: {},
            isSubmitting: false,
            isValid: false
        });
        
        // Reset form fields
        if (this.element) {
            this.element.reset();
        }
    }
    
    /**
     * Get a field's value
     */
    getFieldValue(name) {
        const field = this.data.fields.find(f => f.name === name);
        return field ? field.value : undefined;
    }
    
    /**
     * Get a field's error message
     */
    getFieldError(name) {
        return this.data.errors[name] || '';
    }
    
    /**
     * Check if a field has been touched
     */
    isFieldTouched(name) {
        return !!this.data.touched[name];
    }
    
    /**
     * Check if a field is valid
     */
    isFieldValid(name) {
        return !this.data.errors[name];
    }
    
    /**
     * Submit the form programmatically
     */
    submit() {
        if (this.element) {
            const submitEvent = new Event('submit', { cancelable: true });
            this.element.dispatchEvent(submitEvent);
        }
    }
    
    /**
     * Lifecycle hook - called after component is mounted
     */
    onMount() {
        // Focus first non-hidden, non-disabled input
        const firstInput = this.element?.querySelector('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
        if (firstInput && !this.data.fields.find(f => f.autoFocus)) {
            firstInput.focus();
        }
    }
    
    /**
     * Lifecycle hook - called before component is unmounted
     */
    onBeforeUnmount() {
        // Clean up event listeners
        if (this.element) {
            this.element.removeEventListener('submit', this.handleSubmit);
            
            const resetBtn = this.element.querySelector('button[type="button"]');
            if (resetBtn) {
                resetBtn.removeEventListener('click', this.handleReset);
            }
            
            const inputs = this.element.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.type === 'file') {
                    input.removeEventListener('change', this.handleChange);
                } else {
                    input.removeEventListener('input', this.handleChange);
                    input.removeEventListener('change', this.handleChange);
                }
                
                if (this.data.liveValidation) {
                    input.removeEventListener('blur', this.handleBlur);
                }
            });
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.Form = Form;
}

export default Form;
