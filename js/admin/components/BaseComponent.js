/**
 * Base Component
 * Provides common functionality for all admin components
 */
class BaseComponent {
    /**
     * Create a new component
     * @param {Object} options - Component options
     * @param {HTMLElement} [options.container] - Container element to render into
     * @param {Object} [options.data] - Initial component data
     */
    constructor({ container = null, data = {} } = {}) {
        this.container = container;
        this.data = data;
        this.element = null;
        this.isMounted = false;
        
        // Bind methods
        this.render = this.render.bind(this);
        this.mount = this.mount.bind(this);
        this.unmount = this.unmount.bind(this);
    }
    
    /**
     * Render the component
     * Must be implemented by child classes
     */
    render() {
        throw new Error('Method "render" must be implemented by child class');
    }
    
    /**
     * Mount the component to the DOM
     * @param {HTMLElement} [target] - Optional target element to mount to
     */
    mount(target = null) {
        if (this.isMounted) return;
        
        const mountTarget = target || this.container;
        if (!mountTarget) {
            console.error('No target element provided for mounting');
            return;
        }
        
        if (!this.element) {
            this.render();
        }
        
        if (this.element) {
            mountTarget.appendChild(this.element);
            this.isMounted = true;
            this.onMount();
        }
    }
    
    /**
     * Unmount the component from the DOM
     */
    unmount() {
        if (!this.isMounted || !this.element || !this.element.parentNode) return;
        
        this.onBeforeUnmount();
        this.element.parentNode.removeChild(this.element);
        this.isMounted = false;
        this.onUnmount();
    }
    
    /**
     * Lifecycle hook - called after component is mounted
     */
    onMount() {
        // Can be overridden by child classes
    }
    
    /**
     * Lifecycle hook - called before component is unmounted
     */
    onBeforeUnmount() {
        // Can be overridden by child classes
    }
    
    /**
     * Lifecycle hook - called after component is unmounted
     */
    onUnmount() {
        // Can be overridden by child classes
    }
    
    /**
     * Update component data and re-render
     * @param {Object} newData - New data to merge with existing data
     */
    setState(newData) {
        this.data = { ...this.data, ...newData };
        if (this.isMounted) {
            this.render();
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.BaseComponent = BaseComponent;
}

export default BaseComponent;
