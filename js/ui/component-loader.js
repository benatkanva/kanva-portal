/**
 * Component Loader
 * Loads and initializes all UI components
 * Also handles loading of component CSS files
 */
class ComponentLoader {
    constructor() {
        this.loadedComponents = new Set();
        this.pendingLoads = new Map();
        this.componentCSSMap = {
            // Map component names to their CSS files
            'ProductManager': 'product-tile',
            'ProductTile': 'product-tile',
            'OrderDetailsTable': 'tables',
            'TierBadge': 'badges',
            'OrderCalculation': 'activity-panel',
            'ShippingZone': 'forms'
        };
    }

    /**
     * Load a single component
     * @param {string} componentPath 
     * @returns {Promise}
     */
    async loadComponent(componentPath) {
        if (this.loadedComponents.has(componentPath)) {
            return Promise.resolve();
        }

        if (this.pendingLoads.has(componentPath)) {
            return this.pendingLoads.get(componentPath);
        }

        const loadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = componentPath;
            script.onload = () => {
                this.loadedComponents.add(componentPath);
                this.pendingLoads.delete(componentPath);
                resolve();
            };
            script.onerror = () => {
                this.pendingLoads.delete(componentPath);
                reject(new Error(`Failed to load component: ${componentPath}`));
            };
            document.head.appendChild(script);
        });

        this.pendingLoads.set(componentPath, loadPromise);
        return loadPromise;
    }

    /**
     * Load multiple components in parallel
     * @param {Array} componentPaths 
     * @returns {Promise}
     */
    async loadComponents(componentPaths) {
        const loadPromises = componentPaths.map(path => this.loadComponent(path));
        return Promise.all(loadPromises);
    }

    /**
     * Load all core UI components
     * @returns {Promise}
     */
    async loadCoreComponents() {
        // Most components are already loaded via script tags in index.html
        // Only load components that are missing or need dynamic loading
        const coreComponents = [
            // All components now loaded via script tags in index.html
            // This array is kept for future dynamic component loading
        ];

        try {
            await this.loadComponents(coreComponents);
            console.log('✅ All core UI components loaded successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to load core components:', error);
            return false;
        }
    }

    /**
     * Check if a component is loaded
     * @param {string} componentName 
     * @returns {boolean}
     */
    isComponentLoaded(componentName) {
        return window[componentName] !== undefined;
    }

    /**
     * Wait for a component to be available
     * @param {string} componentName 
     * @param {number} timeout 
     * @returns {Promise}
     */
    waitForComponent(componentName, timeout = 5000) {
        return new Promise((resolve, reject) => {
            if (this.isComponentLoaded(componentName)) {
                resolve(window[componentName]);
                return;
            }

            const checkInterval = setInterval(() => {
                if (this.isComponentLoaded(componentName)) {
                    clearInterval(checkInterval);
                    clearTimeout(timeoutId);
                    resolve(window[componentName]);
                }
            }, 100);

            const timeoutId = setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error(`Component ${componentName} not available after ${timeout}ms`));
            }, timeout);
        });
    }

    /**
     * Load CSS for a specific component
     * @param {string} componentName - Name of the component
     * @returns {Promise}
     */
    loadComponentCSS(componentName) {
        // Skip if CSSLoader isn't available
        if (!window.CSSLoader) {
            console.warn(`⚠️ CSSLoader not available, can't load CSS for ${componentName}`);
            return Promise.resolve();
        }

        // Get CSS file name from map
        const cssName = this.componentCSSMap[componentName] || componentName.toLowerCase();
        
        // Load the CSS using CSSLoader
        console.debug(`🎨 Loading CSS for ${componentName}`);
        return window.CSSLoader.loadComponentCSS(cssName)
            .then(() => {
                console.debug(`✅ Loaded CSS for ${componentName}`);
            })
            .catch(err => {
                console.error(`❌ Failed to load CSS for ${componentName}:`, err);
            });
    }

    /**
     * Initialize all components after loading
     */
    initializeComponents() {
        // Initialize component registry with available components
        if (!window.UIComponents) {
            window.UIComponents = {};
        }
        
        // Register components that are available
        const availableComponents = {
            ProductManager: window.ProductManager,
            ProductTile: window.ProductTile,
            OrderDetailsTable: window.OrderDetailsTable,
            TierBadge: window.TierBadge,
            OrderCalculation: window.OrderCalculation,
            ShippingZone: window.ShippingZone,
            ProductGrid: window.ProductGrid
        };
        
        // Only register components that actually exist and load their CSS
        Object.keys(availableComponents).forEach(name => {
            if (availableComponents[name]) {
                window.UIComponents[name] = availableComponents[name];
                // Load the component's CSS
                this.loadComponentCSS(name);
            }
        });

        console.log('🎨 UI Components initialized:', Object.keys(window.UIComponents));
        console.log('🔍 Available components:', Object.keys(availableComponents).filter(name => availableComponents[name]));
    }

    /**
     * Create a component instance
     * @param {string} componentName 
     * @param {Array} args 
     * @returns {Object}
     */
    createComponent(componentName, ...args) {
        const ComponentClass = window.UIComponents?.[componentName] || window[componentName];
        
        if (!ComponentClass) {
            throw new Error(`Component ${componentName} not found`);
        }

        return new ComponentClass(...args);
    }

    /**
     * Render component to container
     * @param {string} componentName 
     * @param {string|HTMLElement} container 
     * @param {Array} args 
     * @returns {Object}
     */
    renderComponent(componentName, container, ...args) {
        const component = this.createComponent(componentName, ...args);
        const element = component.create ? component.create(...args) : component;
        
        const targetElement = typeof container === 'string' 
            ? document.getElementById(container) || document.querySelector(container)
            : container;

        if (targetElement) {
            targetElement.innerHTML = '';
            targetElement.appendChild(element);
        }

        return component;
    }

    /**
     * Get loading status
     * @returns {Object}
     */
    getStatus() {
        return {
            loaded: Array.from(this.loadedComponents),
            pending: Array.from(this.pendingLoads.keys()),
            available: Object.keys(window.UIComponents || {})
        };
    }
}

// Create global component loader instance
window.ComponentLoader = new ComponentLoader();

// Auto-load core components when script loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Loading UI components...');
    const success = await window.ComponentLoader.loadCoreComponents();
    
    // Always initialize components since they're loaded via script tags
    window.ComponentLoader.initializeComponents();
    
    // Trigger custom event for when components are ready
    console.log('📡 Dispatching uiComponentsReady event...');
    const event = new CustomEvent('uiComponentsReady', {
        detail: { 
            loader: window.ComponentLoader,
            success: success,
            timestamp: Date.now()
        }
    });
    document.dispatchEvent(event);
    console.log('✅ uiComponentsReady event dispatched');
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLoader;
}
