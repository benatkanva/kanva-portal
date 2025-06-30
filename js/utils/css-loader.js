/**
 * CSS Loader Utility
 * Handles dynamic loading of CSS files for modular components
 */

class CSSLoader {
    constructor() {
        this.loadedStyles = new Set();
        this.baseUrl = window.location.origin;
        this.initialized = false;
    }

    /**
     * Initialize the CSS loader
     * Preloads main.css and other essential styles
     */
    initialize() {
        if (this.initialized) return;

        console.log('🎨 Initializing CSS Loader');
        
        // Always ensure main.css is loaded first as it imports everything
        this.loadCSSFile('/css/main.css', true);
        
        // Preload essential styles
        this.preloadEssentialStyles();

        this.initialized = true;
        console.log('✅ CSS Loader initialized');
        
        // Dispatch event that CSS is ready
        document.dispatchEvent(new CustomEvent('css:ready'));
    }
    
    /**
     * Preload all essential CSS files for the application
     */
    preloadEssentialStyles() {
        console.log('📚 Preloading essential styles');
        
        // Essential layout styles
        const layouts = ['grid', 'header', 'sidebar', 'footer'];
        layouts.forEach(layout => this.loadLayoutCSS(layout));
        
        // Essential component styles
        const components = [
            'activity-panel',
            'alerts',
            'buttons',
            'cards', 
            'calculation-display',
            'forms',
            'modals',
            'notifications',
            'product-tile',
            'tables',
            'tabs'
        ];
        components.forEach(component => this.loadComponentCSS(component));
        
        console.log('🎯 Essential styles preloaded');
    }

    /**
     * Load a CSS file if it's not already loaded
     * @param {string} path - Path to CSS file (relative to origin)
     * @param {boolean} force - Force reload even if already loaded
     * @returns {Promise} - Promise that resolves when CSS is loaded
     */
    loadCSSFile(path, force = false) {
        // Handle both relative and absolute paths
        const fullPath = path.startsWith('/') ? path : `/${path}`;
        const cssUrl = new URL(fullPath, this.baseUrl).href;

        // Skip if already loaded and not forced
        if (this.loadedStyles.has(cssUrl) && !force) {
            console.debug(`CSS already loaded: ${cssUrl}`);
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = cssUrl;

            link.onload = () => {
                console.debug(`CSS loaded: ${cssUrl}`);
                this.loadedStyles.add(cssUrl);
                resolve();
            };

            link.onerror = (err) => {
                console.error(`Failed to load CSS: ${cssUrl}`, err);
                reject(new Error(`Failed to load CSS: ${cssUrl}`));
            };

            document.head.appendChild(link);
        });
    }

    /**
     * Load component CSS file
     * @param {string} componentName - Component name (e.g., 'product-tile')
     * @returns {Promise} - Promise that resolves when CSS is loaded
     */
    loadComponentCSS(componentName) {
        return this.loadCSSFile(`/css/components/${componentName}.css`);
    }

    /**
     * Load layout CSS file
     * @param {string} layoutName - Layout name (e.g., 'header')
     * @returns {Promise} - Promise that resolves when CSS is loaded
     */
    loadLayoutCSS(layoutName) {
        return this.loadCSSFile(`/css/layouts/${layoutName}.css`);
    }

    /**
     * Load multiple CSS files
     * @param {Array} paths - Array of paths to CSS files
     * @returns {Promise} - Promise that resolves when all CSS files are loaded
     */
    loadMultipleCSS(paths) {
        const promises = paths.map(path => this.loadCSSFile(path));
        return Promise.all(promises);
    }

    /**
     * Get loading status
     * @returns {Object} - Status object
     */
    getStatus() {
        return {
            initialized: this.initialized,
            loadedFiles: Array.from(this.loadedStyles)
        };
    }
}

// Create singleton instance
const cssLoader = new CSSLoader();

// Auto-initialize when script is loaded
document.addEventListener('DOMContentLoaded', () => {
    cssLoader.initialize();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = cssLoader;
} else if (typeof window !== 'undefined') {
    window.CSSLoader = cssLoader;
}
