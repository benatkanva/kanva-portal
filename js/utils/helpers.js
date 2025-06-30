/**
 * Helpers
 * Utility functions for common operations
 */

class Helpers {
    /**
     * Debounce a function
     * @param {Function} func - The function to debounce
     * @param {number} wait - The time to wait in milliseconds
     * @returns {Function} The debounced function
     */
    static debounce(func, wait = 300) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    /**
     * Throttle a function
     * @param {Function} func - The function to throttle
     * @param {number} limit - The time limit in milliseconds
     * @returns {Function} The throttled function
     */
    static throttle(func, limit = 300) {
        let inThrottle;
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Deep clone an object
     * @param {Object} obj - The object to clone
     * @returns {Object} A deep clone of the object
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj);
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.deepClone(item));
        }
        
        if (obj instanceof Object) {
            const clone = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clone[key] = this.deepClone(obj[key]);
                }
            }
            return clone;
        }
        
        return obj;
    }

    /**
     * Merge objects deeply
     * @param {Object} target - The target object
     * @param {...Object} sources - The source objects
     * @returns {Object} The merged object
     */
    static deepMerge(target, ...sources) {
        if (!sources.length) return target;
        
        const source = sources.shift();
        
        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this.deepMerge(target[key], source[key]);
                } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
                    target[key] = [...new Set([...target[key], ...source[key]])];
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
        
        return this.deepMerge(target, ...sources);
    }

    /**
     * Check if a value is an object
     * @param {*} item - The item to check
     * @returns {boolean} True if the item is an object
     */
    static isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }

    /**
     * Generate a unique ID
     * @param {number} length - The length of the ID
     * @returns {string} A unique ID
     */
    static generateId(length = 8) {
        return Math.random().toString(36).substring(2, length + 2);
    }

    /**
     * Format bytes to a human-readable string
     * @param {number} bytes - The number of bytes
     * @param {number} decimals - The number of decimal places
     * @returns {string} The formatted string
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
     * Get the type of a value
     * @param {*} value - The value to check
     * @returns {string} The type of the value
     */
    static getType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    /**
     * Check if a value is a function
     * @param {*} value - The value to check
     * @returns {boolean} True if the value is a function
     */
    static isFunction(value) {
        return typeof value === 'function';
    }

    /**
     * Check if a value is a string
     * @param {*} value - The value to check
     * @returns {boolean} True if the value is a string
     */
    static isString(value) {
        return typeof value === 'string' || value instanceof String;
    }

    /**
     * Check if a value is a number
     * @param {*} value - The value to check
     * @returns {boolean} True if the value is a number
     */
    static isNumber(value) {
        return typeof value === 'number' && isFinite(value);
    }

    /**
     * Check if a value is a boolean
     * @param {*} value - The value to check
     * @returns {boolean} True if the value is a boolean
     */
    static isBoolean(value) {
        return value === true || value === false || 
               (typeof value === 'object' && value !== null && 
                typeof value.valueOf() === 'boolean');
    }

    /**
     * Check if a value is a plain object
     * @param {*} value - The value to check
     * @returns {boolean} True if the value is a plain object
     */
    static isPlainObject(value) {
        return Object.prototype.toString.call(value) === '[object Object]';
    }

    /**
     * Check if a value is a DOM element
     * @param {*} value - The value to check
     * @returns {boolean} True if the value is a DOM element
     */
    static isElement(value) {
        return value instanceof Element || value instanceof HTMLDocument;
    }

    /**
     * Check if a value is a NodeList
     * @param {*} value - The value to check
     * @returns {boolean} True if the value is a NodeList
     */
    static isNodeList(value) {
        return NodeList.prototype.isPrototypeOf(value);
    }

    /**
     * Check if a value is a jQuery object
     * @param {*} value - The value to check
     * @returns {boolean} True if the value is a jQuery object
     */
    static isJQuery(value) {
        return value && typeof value.jquery !== 'undefined';
    }

    /**
     * Convert a NodeList to an array
     * @param {NodeList} nodeList - The NodeList to convert
     * @returns {Array} An array of nodes
     */
    static toArray(nodeList) {
        return Array.prototype.slice.call(nodeList);
    }

    /**
     * Get the current scroll position
     * @returns {Object} An object with x and y properties
     */
    static getScrollPosition() {
        return {
            x: window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0,
            y: window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
        };
    }

    /**
     * Scroll to a specific position
     * @param {number} x - The x position
     * @param {number} y - The y position
     * @param {Object} options - Scroll options
     */
    static scrollTo(x, y, options = {}) {
        const { behavior = 'smooth', duration = 400 } = options;
        
        if (behavior === 'smooth') {
            const start = this.getScrollPosition();
            const changeY = y - start.y;
            const changeX = x - start.x;
            const startTime = performance.now();
            
            const animateScroll = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const easeInOutCubic = t => 
                    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
                
                window.scrollTo(
                    start.x + changeX * easeInOutCubic(progress),
                    start.y + changeY * easeInOutCubic(progress)
                );
                
                if (elapsed < duration) {
                    window.requestAnimationFrame(animateScroll);
                }
            };
            
            window.requestAnimationFrame(animateScroll);
        } else {
            window.scrollTo(x, y);
        }
    }

    /**
     * Scroll an element into view
     * @param {HTMLElement} element - The element to scroll into view
     * @param {Object} options - Scroll options
     */
    static scrollIntoView(element, options = {}) {
        if (!element) return;
        
        const {
            behavior = 'smooth',
            block = 'start',
            inline = 'nearest',
            offset = 0
        } = options;
        
        if (typeof element.scrollIntoView === 'function') {
            element.scrollIntoView({
                behavior,
                block,
                inline
            });
            
            // Apply offset if needed
            if (offset !== 0) {
                const scrollPosition = this.getScrollPosition();
                window.scrollTo({
                    top: scrollPosition.y + offset,
                    behavior
                });
            }
        } else {
            // Fallback for older browsers
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition + offset;
            
            this.scrollTo(0, offsetPosition, { behavior });
        }
    }

    /**
     * Get the position of an element relative to the document
     * @param {HTMLElement} element - The element to get the position of
     * @returns {Object} An object with top, right, bottom, and left properties
     */
    static getElementPosition(element) {
        if (!element) return null;
        
        const rect = element.getBoundingClientRect();
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        return {
            top: rect.top + scrollTop,
            right: rect.right + scrollLeft,
            bottom: rect.bottom + scrollTop,
            left: rect.left + scrollLeft,
            width: rect.width,
            height: rect.height
        };
    }

    /**
     * Check if an element is in the viewport
     * @param {HTMLElement} element - The element to check
     * @param {number} offset - The offset in pixels
     * @returns {boolean} True if the element is in the viewport
     */
    static isInViewport(element, offset = 0) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        return (
            rect.top >= -offset &&
            rect.left >= -offset &&
            rect.bottom <= (windowHeight + offset) &&
            rect.right <= (windowWidth + offset)
        );
    }

    /**
     * Add a class to an element
     * @param {HTMLElement} element - The element to add the class to
     * @param {string} className - The class name to add
     */
    static addClass(element, className) {
        if (!element || !className) return;
        
        if (element.classList) {
            element.classList.add(className);
        } else {
            element.className += ` ${className}`;
        }
    }

    /**
     * Remove a class from an element
     * @param {HTMLElement} element - The element to remove the class from
     * @param {string} className - The class name to remove
     */
    static removeClass(element, className) {
        if (!element || !className) return;
        
        if (element.classList) {
            element.classList.remove(className);
        } else {
            element.className = element.className.replace(
                new RegExp(`(^|\\s)${className}(\\s|$)`),
                ' '
            ).replace(/\s+/g, ' ').trim();
        }
    }

    /**
     * Toggle a class on an element
     * @param {HTMLElement} element - The element to toggle the class on
     * @param {string} className - The class name to toggle
     */
    static toggleClass(element, className) {
        if (!element || !className) return;
        
        if (element.classList) {
            element.classList.toggle(className);
        } else {
            const classes = element.className.split(' ');
            const existingIndex = classes.indexOf(className);
            
            if (existingIndex >= 0) {
                classes.splice(existingIndex, 1);
            } else {
                classes.push(className);
            }
            
            element.className = classes.join(' ');
        }
    }

    /**
     * Check if an element has a class
     * @param {HTMLElement} element - The element to check
     * @param {string} className - The class name to check for
     * @returns {boolean} True if the element has the class
     */
    static hasClass(element, className) {
        if (!element || !className) return false;
        
        if (element.classList) {
            return element.classList.contains(className);
        } else {
            return new RegExp(`(^|\\s)${className}(\\s|$)`).test(element.className);
        }
    }

    /**
     * Get the computed style of an element
     * @param {HTMLElement} element - The element to get the style of
     * @param {string} property - The CSS property to get
     * @returns {string} The computed style value
     */
    static getStyle(element, property) {
        if (!element || !property) return '';
        
        const style = window.getComputedStyle(element, null);
        return style.getPropertyValue(property);
    }

    /**
     * Set multiple styles on an element
     * @param {HTMLElement} element - The element to set styles on
     * @param {Object} styles - An object of CSS properties and values
     */
    static setStyles(element, styles) {
        if (!element || !styles) return;
        
        Object.assign(element.style, styles);
    }

    /**
     * Get the value of a CSS variable
     * @param {string} name - The name of the CSS variable (with or without --)
     * @param {HTMLElement} element - The element to get the variable from (defaults to document.documentElement)
     * @returns {string} The value of the CSS variable
     */
    static getCssVariable(name, element = document.documentElement) {
        if (!name) return '';
        
        const varName = name.startsWith('--') ? name : `--${name}`;
        return getComputedStyle(element).getPropertyValue(varName).trim();
    }

    /**
     * Set a CSS variable
     * @param {string} name - The name of the CSS variable (with or without --)
     * @param {string} value - The value to set
     * @param {HTMLElement} element - The element to set the variable on (defaults to document.documentElement)
     */
    static setCssVariable(name, value, element = document.documentElement) {
        if (!name || value === undefined) return;
        
        const varName = name.startsWith('--') ? name : `--${name}`;
        element.style.setProperty(varName, value);
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.Helpers = Helpers;
}
