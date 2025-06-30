/**
 * Formatters
 * Utility functions for formatting data
 */

class Formatters {
    /**
     * Format a number as currency
     * @param {number} amount - The amount to format
     * @param {string} currency - Currency code (default: 'USD')
     * @param {number} decimals - Number of decimal places (default: 2)
     * @returns {string} Formatted currency string
     */
    static currency(amount, currency = 'USD', decimals = 2) {
        if (isNaN(amount)) return '$0.00';
        
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(amount);
    }

    /**
     * Format a number with thousands separators
     * @param {number} number - The number to format
     * @param {number} decimals - Number of decimal places (default: 0)
     * @returns {string} Formatted number string
     */
    static number(number, decimals = 0) {
        if (isNaN(number)) return '0';
        
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }

    /**
     * Format a number as a percentage
     * @param {number} value - The value to format (0-1)
     * @param {number} decimals - Number of decimal places (default: 1)
     * @returns {string} Formatted percentage string
     */
    static percentage(value, decimals = 1) {
        if (isNaN(value)) return '0%';
        
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    }

    /**
     * Format a date string
     * @param {Date|string|number} date - Date to format
     * @param {string} locale - Locale string (default: 'en-US')
     * @param {Object} options - Intl.DateTimeFormat options
     * @returns {string} Formatted date string
     */
    static date(date, locale = 'en-US', options = {}) {
        try {
            const dateObj = date instanceof Date ? date : new Date(date);
            if (isNaN(dateObj.getTime())) return 'Invalid Date';
            
            const defaultOptions = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            
            return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options })
                .format(dateObj);
        } catch (e) {
            console.error('Error formatting date:', e);
            return 'Invalid Date';
        }
    }

    /**
     * Format a phone number
     * @param {string} phone - The phone number to format
     * @returns {string} Formatted phone number
     */
    static phone(phone) {
        if (!phone) return '';
        
        // Remove all non-digit characters
        const cleaned = ('' + phone).replace(/\D/g, '');
        
        // Check if number is valid
        const match = cleaned.match(/^(\d{1,3})?(\d{3})(\d{3})(\d{4})$/);
        
        if (match) {
            // Format as (123) 456-7890
            return `(${match[2]}) ${match[3]}-${match[4]}`;
        }
        
        // Return original if format doesn't match
        return phone;
    }

    /**
     * Truncate text to a maximum length
     * @param {string} text - The text to truncate
     * @param {number} maxLength - Maximum length before truncation
     * @param {string} ellipsis - Ellipsis character(s) (default: '...')
     * @returns {string} Truncated text
     */
    static truncate(text, maxLength = 100, ellipsis = '...') {
        if (typeof text !== 'string') return '';
        if (text.length <= maxLength) return text;
        
        return text.substring(0, maxLength).trim() + ellipsis;
    }

    /**
     * Format bytes to human-readable format
     * @param {number} bytes - Number of bytes
     * @param {number} decimals - Number of decimal places (default: 2)
     * @returns {string} Formatted string (e.g., "1.5 MB")
     */
    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Convert a string to title case
     * @param {string} str - The string to convert
     * @returns {string} Title-cased string
     */
    static toTitleCase(str) {
        if (!str) return '';
        
        return str.replace(
            /\w\S*/g,
            txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    /**
     * Format a duration in milliseconds to a human-readable format
     * @param {number} ms - Duration in milliseconds
     * @returns {string} Formatted duration (e.g., "2h 30m")
     */
    static formatDuration(ms) {
        if (isNaN(ms)) return '0s';
        
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    /**
     * Format a string to kebab-case
     * @param {string} str - The string to convert
     * @returns {string} kebab-cased string
     */
    static toKebabCase(str) {
        if (!str) return '';
        return str
            .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
            .map(x => x.toLowerCase())
            .join('-');
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.Formatters = Formatters;
}
