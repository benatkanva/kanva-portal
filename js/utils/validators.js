/**
 * Validators
 * Utility functions for data validation
 */

class Validators {
    /**
     * Check if a value is empty
     * @param {*} value - The value to check
     * @returns {boolean} True if the value is empty
     */
    static isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string' && value.trim() === '') return true;
        if (Array.isArray(value) && value.length === 0) return true;
        if (typeof value === 'object' && Object.keys(value).length === 0) return true;
        return false;
    }

    /**
     * Validate an email address
     * @param {string} email - The email to validate
     * @returns {boolean} True if the email is valid
     */
    static isEmail(email) {
        if (!email) return false;
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    /**
     * Validate a URL
     * @param {string} url - The URL to validate
     * @returns {boolean} True if the URL is valid
     */
    static isUrl(url) {
        if (!url) return false;
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate a phone number
     * @param {string} phone - The phone number to validate
     * @returns {boolean} True if the phone number is valid
     */
    static isPhone(phone) {
        if (!phone) return false;
        // Basic phone validation - allows various formats
        const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        return re.test(phone);
    }

    /**
     * Validate a credit card number
     * @param {string} cardNumber - The credit card number to validate
     * @returns {boolean} True if the credit card number is valid
     */
    static isCreditCard(cardNumber) {
        if (!cardNumber) return false;
        
        // Remove all non-digit characters
        const value = cardNumber.replace(/\D/g, '');
        
        // The Luhn Algorithm
        let sum = 0;
        let shouldDouble = false;
        
        for (let i = value.length - 1; i >= 0; i--) {
            let digit = parseInt(value.charAt(i), 10);
            
            if (shouldDouble) {
                digit *= 2;
                if (digit > 9) {
                    digit = (digit % 10) + 1;
                }
            }
            
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        
        return (sum % 10) === 0;
    }

    /**
     * Validate a date string
     * @param {string} dateString - The date string to validate
     * @param {string} format - The expected date format (e.g., 'YYYY-MM-DD')
     * @returns {boolean} True if the date is valid
     */
    static isDate(dateString, format = 'YYYY-MM-DD') {
        if (!dateString) return false;
        
        // Basic date validation - can be expanded for specific formats
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    /**
     * Check if a string contains only letters and numbers
     * @param {string} str - The string to validate
     * @returns {boolean} True if the string is alphanumeric
     */
    static isAlphanumeric(str) {
        if (!str) return false;
        const re = /^[a-zA-Z0-9]+$/;
        return re.test(str);
    }

    /**
     * Check if a string contains only letters
     * @param {string} str - The string to validate
     * @returns {boolean} True if the string contains only letters
     */
    static isAlpha(str) {
        if (!str) return false;
        const re = /^[a-zA-Z\s]+$/;
        return re.test(str);
    }

    /**
     * Check if a string is a valid password
     * @param {string} password - The password to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result with isValid and message
     */
    static validatePassword(password, options = {}) {
        const defaults = {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true
        };
        
        const config = { ...defaults, ...options };
        const errors = [];
        
        if (!password) {
            return {
                isValid: false,
                message: 'Password is required'
            };
        }
        
        if (password.length < config.minLength) {
            errors.push(`at least ${config.minLength} characters`);
        }
        
        if (config.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('one uppercase letter');
        }
        
        if (config.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('one lowercase letter');
        }
        
        if (config.requireNumbers && !/\d/.test(password)) {
            errors.push('one number');
        }
        
        if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('one special character');
        }
        
        const isValid = errors.length === 0;
        
        return {
            isValid,
            message: isValid 
                ? 'Password is valid' 
                : `Password must contain ${errors.join(', ')}`
        };
    }

    /**
     * Validate a form based on validation rules
     * @param {Object} formData - Form data to validate
     * @param {Object} validationRules - Validation rules for each field
     * @returns {Object} Validation result with isValid and errors
     */
    static validateForm(formData, validationRules) {
        const errors = {};
        let isValid = true;
        
        for (const [field, rules] of Object.entries(validationRules)) {
            const value = formData[field];
            const fieldErrors = [];
            
            for (const rule of rules) {
                if (rule.required && this.isEmpty(value)) {
                    fieldErrors.push(rule.message || 'This field is required');
                    continue;
                }
                
                if (rule.type === 'email' && !this.isEmail(value)) {
                    fieldErrors.push(rule.message || 'Please enter a valid email');
                }
                
                if (rule.type === 'url' && !this.isEmpty(value) && !this.isUrl(value)) {
                    fieldErrors.push(rule.message || 'Please enter a valid URL');
                }
                
                if (rule.type === 'phone' && !this.isEmpty(value) && !this.isPhone(value)) {
                    fieldErrors.push(rule.message || 'Please enter a valid phone number');
                }
                
                if (rule.minLength && value && value.length < rule.minLength) {
                    fieldErrors.push(rule.message || `Must be at least ${rule.minLength} characters`);
                }
                
                if (rule.maxLength && value && value.length > rule.maxLength) {
                    fieldErrors.push(rule.message || `Must be no more than ${rule.maxLength} characters`);
                }
                
                if (rule.pattern && value && !rule.pattern.test(value)) {
                    fieldErrors.push(rule.message || 'Invalid format');
                }
                
                if (rule.validate && typeof rule.validate === 'function') {
                    const customValidation = rule.validate(value, formData);
                    if (customValidation !== true) {
                        fieldErrors.push(customValidation || 'Validation failed');
                    }
                }
            }
            
            if (fieldErrors.length > 0) {
                errors[field] = fieldErrors;
                isValid = false;
            }
        }
        
        return { isValid, errors };
    }

    /**
     * Check if a string is a valid JSON
     * @param {string} str - The string to check
     * @returns {boolean} True if the string is valid JSON
     */
    static isJson(str) {
        if (typeof str !== 'string') return false;
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Check if a number is within a range
     * @param {number} value - The number to check
     * @param {Object} range - Range options
     * @returns {boolean} True if the number is within the range
     */
    static isInRange(value, { min, max }) {
        if (typeof value !== 'number' || isNaN(value)) return false;
        if (min !== undefined && value < min) return false;
        if (max !== undefined && value > max) return false;
        return true;
    }

    /**
     * Check if a string is a valid UUID
     * @param {string} str - The string to check
     * @returns {boolean} True if the string is a valid UUID
     */
    static isUuid(str) {
        if (!str) return false;
        const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return re.test(str);
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.Validators = Validators;
}
