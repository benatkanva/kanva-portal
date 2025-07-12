import BaseComponent from './BaseComponent';

/**
 * Modal Component
 * A reusable modal dialog component with Bootstrap 5 integration
 */
class Modal extends BaseComponent {
    /**
     * Create a new Modal
     * @param {Object} options - Component options
     * @param {string} [options.title=''] - Modal title
     * @param {string|HTMLElement} [options.content=''] - Modal content (can be HTML string or DOM element)
     * @param {string} [options.size='md'] - Modal size (sm, md, lg, xl, fullscreen)
     * @param {boolean} [options.backdrop=true] - Whether to show backdrop
     * @param {boolean} [options.keyboard=true] - Whether to close on ESC key
     * @param {boolean} [options.focus=true] - Whether to focus the modal when opened
     * @param {boolean} [options.showClose=true] - Whether to show the close button
     * @param {string} [options.closeLabel='Close'] - Close button label
     * @param {string} [options.confirmLabel='Save changes'] - Confirm button label
     * @param {boolean} [options.showFooter=true] - Whether to show the footer
     * @param {boolean} [options.scrollable=true] - Whether the modal content is scrollable
     * @param {boolean} [options.centered=true] - Whether to vertically center the modal
     */
    constructor({
        title = '',
        content = '',
        size = 'md',
        backdrop = true,
        keyboard = true,
        focus = true,
        showClose = true,
        closeLabel = 'Close',
        confirmLabel = 'Save changes',
        showFooter = true,
        scrollable = true,
        centered = true,
        ...rest
    } = {}) {
        super({
            title,
            content,
            size,
            backdrop,
            keyboard,
            focus,
            showClose,
            closeLabel,
            confirmLabel,
            showFooter,
            scrollable,
            centered,
            isOpen: false,
            ...rest
        });
        
        // Bind methods
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleBackdropClick = this.handleBackdropClick.bind(this);
        this.handleConfirm = this.handleConfirm.bind(this);
        this.handleClose = this.handleClose.bind(this);
        
        // Generate unique ID for the modal
        this.modalId = `modal-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create the modal element
        this.render();
    }
    
    /**
     * Render the modal
     */
    render() {
        // Create modal element if it doesn't exist
        if (!this.element) {
            this.element = document.createElement('div');
            this.element.className = 'modal fade';
            this.element.id = this.modalId;
            this.element.tabIndex = -1;
            this.element.setAttribute('aria-hidden', 'true');
            
            // Add to DOM if not already there
            if (!document.body.contains(this.element)) {
                document.body.appendChild(this.element);
            }
        }
        
        // Modal dialog classes
        const dialogClasses = [
            'modal-dialog',
            this.data.scrollable ? 'modal-dialog-scrollable' : '',
            this.data.centered ? 'modal-dialog-centered' : '',
            this.data.size ? `modal-${this.data.size}` : ''
        ].filter(Boolean).join(' ');
        
        // Modal content
        const modalContent = typeof this.data.content === 'string' 
            ? this.data.content 
            : this.data.content?.outerHTML || '';
        
        // Build modal HTML
        this.element.innerHTML = `
            <div class="${dialogClasses}">
                <div class="modal-content">
                    ${this.renderHeader()}
                    <div class="modal-body">
                        ${modalContent}
                    </div>
                    ${this.data.showFooter ? this.renderFooter() : ''}
                </div>
            </div>
        `;
        
        // If content is a DOM element, replace the inner content
        if (this.data.content instanceof HTMLElement) {
            const modalBody = this.element.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
                modalBody.appendChild(this.data.content);
            }
        }
        
        // Initialize Bootstrap modal if available
        this.initializeBootstrapModal();
        
        return this.element;
    }
    
    /**
     * Render the modal header
     */
    renderHeader() {
        return `
            <div class="modal-header">
                <h5 class="modal-title">${this.data.title}</h5>
                ${this.data.showClose ? `
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Render the modal footer
     */
    renderFooter() {
        return `
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                    ${this.data.closeLabel}
                </button>
                <button type="button" class="btn btn-primary" id="${this.modalId}-confirm">
                    ${this.data.confirmLabel}
                </button>
            </div>
        `;
    }
    
    /**
     * Initialize Bootstrap modal
     */
    initializeBootstrapModal() {
        // Check if Bootstrap is available
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            // Initialize modal if not already done
            if (!this.bsModal) {
                this.bsModal = new bootstrap.Modal(this.element, {
                    backdrop: this.data.backdrop ? true : 'static',
                    keyboard: this.data.keyboard,
                    focus: this.data.focus
                });
                
                // Add event listeners
                this.element.addEventListener('hidden.bs.modal', () => {
                    this.isOpen = false;
                    this.emit('hidden');
                });
                
                this.element.addEventListener('shown.bs.modal', () => {
                    this.isOpen = true;
                    this.emit('shown');
                    
                    // Focus the first focusable element
                    if (this.data.focus) {
                        const focusable = this.element.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                        if (focusable) focusable.focus();
                    }
                });
            }
        } else {
            console.warn('Bootstrap 5 not found. Modal functionality will be limited.');
        }
    }
    
    /**
     * Open the modal
     */
    open() {
        if (this.bsModal) {
            this.bsModal.show();
        } else {
            // Fallback if Bootstrap is not available
            this.element.classList.add('show');
            this.element.style.display = 'block';
            this.element.setAttribute('aria-modal', 'true');
            this.element.removeAttribute('aria-hidden');
            
            // Add backdrop
            if (this.data.backdrop) {
                this.addBackdrop();
            }
            
            // Add event listeners
            document.addEventListener('keydown', this.handleKeyDown);
            document.addEventListener('click', this.handleBackdropClick);
            
            // Set focus
            if (this.data.focus) {
                const focusable = this.element.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusable) focusable.focus();
            }
            
            this.isOpen = true;
            this.emit('shown');
        }
    }
    
    /**
     * Close the modal
     */
    close() {
        if (this.bsModal) {
            this.bsModal.hide();
        } else {
            // Fallback if Bootstrap is not available
            this.element.classList.remove('show');
            this.element.style.display = 'none';
            this.element.setAttribute('aria-hidden', 'true');
            this.element.removeAttribute('aria-modal');
            
            // Remove backdrop
            this.removeBackdrop();
            
            // Remove event listeners
            document.removeEventListener('keydown', this.handleKeyDown);
            document.removeEventListener('click', this.handleBackdropClick);
            
            this.isOpen = false;
            this.emit('hidden');
        }
    }
    
    /**
     * Toggle the modal
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    /**
     * Handle keydown events (for ESC key)
     */
    handleKeyDown(e) {
        if (e.key === 'Escape' && this.data.keyboard) {
            this.close();
        }
    }
    
    /**
     * Handle backdrop click
     */
    handleBackdropClick(e) {
        if (this.data.backdrop === true && e.target === this.element) {
            this.close();
        }
    }
    
    /**
     * Handle confirm button click
     */
    handleConfirm() {
        this.emit('confirm');
    }
    
    /**
     * Handle close button click
     */
    handleClose() {
        this.close();
    }
    
    /**
     * Add backdrop element
     */
    addBackdrop() {
        if (!this.backdropElement) {
            this.backdropElement = document.createElement('div');
            this.backdropElement.className = 'modal-backdrop fade show';
            document.body.appendChild(this.backdropElement);
            
            // Add modal-open class to body
            document.body.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = this.getScrollbarWidth() + 'px';
        }
    }
    
    /**
     * Remove backdrop element
     */
    removeBackdrop() {
        if (this.backdropElement) {
            this.backdropElement.remove();
            this.backdropElement = null;
            
            // Remove modal-open class from body
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
    }
    
    /**
     * Get scrollbar width
     */
    getScrollbarWidth() {
        // Create a temporary div to measure scrollbar width
        const scrollDiv = document.createElement('div');
        scrollDiv.style.width = '100px';
        scrollDiv.style.height = '100px';
        scrollDiv.style.overflow = 'scroll';
        scrollDiv.style.position = 'absolute';
        scrollDiv.style.top = '-9999px';
        document.body.appendChild(scrollDiv);
        
        // Calculate scrollbar width
        const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
        
        // Clean up
        document.body.removeChild(scrollDiv);
        
        return scrollbarWidth;
    }
    
    /**
     * Set modal title
     * @param {string} title - New title
     */
    setTitle(title) {
        this.setState({ title });
        
        // Update title in the DOM if already rendered
        const titleEl = this.element?.querySelector('.modal-title');
        if (titleEl) {
            titleEl.textContent = title;
        }
    }
    
    /**
     * Set modal content
     * @param {string|HTMLElement} content - New content
     */
    setContent(content) {
        this.setState({ content });
        
        // Update content in the DOM if already rendered
        const bodyEl = this.element?.querySelector('.modal-body');
        if (bodyEl) {
            if (content instanceof HTMLElement) {
                bodyEl.innerHTML = '';
                bodyEl.appendChild(content);
            } else {
                bodyEl.innerHTML = content;
            }
        }
    }
    
    /**
     * Lifecycle hook - called after component is mounted
     */
    onMount() {
        // Add event listeners
        const confirmBtn = this.element?.querySelector(`#${this.modalId}-confirm`);
        const closeBtn = this.element?.querySelector('[data-bs-dismiss="modal"]');
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', this.handleConfirm);
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', this.handleClose);
        }
    }
    
    /**
     * Lifecycle hook - called before component is unmounted
     */
    onBeforeUnmount() {
        // Clean up event listeners
        const confirmBtn = this.element?.querySelector(`#${this.modalId}-confirm`);
        const closeBtn = this.element?.querySelector('[data-bs-dismiss="modal"]');
        
        if (confirmBtn) {
            confirmBtn.removeEventListener('click', this.handleConfirm);
        }
        
        if (closeBtn) {
            closeBtn.removeEventListener('click', this.handleClose);
        }
        
        // Close modal if open
        if (this.isOpen) {
            this.close();
        }
        
        // Remove from DOM
        if (this.element && document.body.contains(this.element)) {
            document.body.removeChild(this.element);
        }
        
        // Remove backdrop
        this.removeBackdrop();
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.Modal = Modal;
}

export default Modal;
