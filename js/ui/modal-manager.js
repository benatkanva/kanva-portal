/**
 * Modal Manager
 * Handles creation and management of modal dialogs
 */

class ModalManager {
    constructor() {
        this.activeModal = null;
        this.modalStack = [];
        this.setupEventListeners();
    }

    /**
     * Show a modal dialog
     * @param {string} title - Modal title
     * @param {string} content - HTML content
     * @param {Object} options - Modal options
     */
    show(title, content, options = {}) {
        // Close any existing modal
        this.close();

        // Create modal elements
        const modal = document.createElement('div');
        modal.className = 'modal fade show';
        modal.style.display = 'block';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        
        modal.innerHTML = `
            <div class="modal-dialog ${options.size ? 'modal-' + options.size : ''}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${this.getModalFooter(options.buttons)}
                </div>
            </div>
        `;

        // Add to document
        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        
        // Store reference
        this.activeModal = modal;
        this.modalStack.push(modal);
        
        // Focus first input if present
        const firstInput = modal.querySelector('input, select, textarea, button');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        return modal;
    }

    /**
     * Close the active modal
     */
    close() {
        if (!this.activeModal) return;
        
        // Remove from DOM
        this.activeModal.remove();
        this.modalStack.pop();
        
        // Update active modal reference
        this.activeModal = this.modalStack.length > 0 
            ? this.modalStack[this.modalStack.length - 1] 
            : null;
            
        // Remove modal-open class if no more modals
        if (this.modalStack.length === 0) {
            document.body.classList.remove('modal-open');
        }
    }

    /**
     * Close all modals
     */
    closeAll() {
        while (this.modalStack.length > 0) {
            const modal = this.modalStack.pop();
            if (modal && modal.remove) {
                modal.remove();
            }
        }
        this.activeModal = null;
        document.body.classList.remove('modal-open');
    }

    /**
     * Show a confirmation dialog
     * @param {string} message - Confirmation message
     * @param {Function} onConfirm - Callback when confirmed
     * @param {string} confirmText - Confirm button text
     * @param {string} cancelText - Cancel button text
     */
    confirm(message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel') {
        return new Promise((resolve) => {
            const content = `
                <div class="confirmation-dialog">
                    <p>${message}</p>
                </div>
            `;
            
            const buttons = [
                {
                    text: cancelText,
                    class: 'btn-secondary',
                    onClick: () => {
                        this.close();
                        resolve(false);
                    }
                },
                {
                    text: confirmText,
                    class: 'btn-primary',
                    onClick: () => {
                        this.close();
                        if (typeof onConfirm === 'function') onConfirm();
                        resolve(true);
                    }
                }
            ];
            
            this.show('Confirm Action', content, { buttons });
        });
    }

    /**
     * Show a prompt dialog
     * @param {string} message - Prompt message
     * @param {string} defaultValue - Default input value
     * @param {Function} onSubmit - Callback with input value
     */
    prompt(message, defaultValue = '', onSubmit) {
        const inputId = 'modal-prompt-input';
        const content = `
            <div class="prompt-dialog">
                <label for="${inputId}">${message}</label>
                <input type="text" id="${inputId}" class="form-control" value="${defaultValue}">
            </div>
        `;
        
        const buttons = [
            {
                text: 'Cancel',
                class: 'btn-secondary',
                onClick: () => this.close()
            },
            {
                text: 'Submit',
                class: 'btn-primary',
                onClick: () => {
                    const value = document.getElementById(inputId).value;
                    this.close();
                    if (typeof onSubmit === 'function') onSubmit(value);
                }
            }
        ];
        
        const modal = this.show('Input Required', content, { buttons });
        
        // Focus input and add enter key handler
        setTimeout(() => {
            const input = modal.querySelector('input');
            if (input) {
                input.focus();
                input.select();
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const value = input.value;
                        this.close();
                        if (typeof onSubmit === 'function') onSubmit(value);
                    }
                });
            }
        }, 100);
        
        return modal;
    }

    // Helper methods
    getModalFooter(buttons) {
        if (!buttons || buttons.length === 0) return '';
        
        const footerButtons = buttons.map(btn => 
            `<button type="button" class="btn ${btn.class || 'btn-secondary'}" data-dismiss="${btn.dismiss ? 'modal' : ''}">
                ${btn.text}
            </button>`
        ).join('\n');
        
        return `
            <div class="modal-footer">
                ${footerButtons}
            </div>
        `;
    }

    setupEventListeners() {
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close();
            }
        });
        
        // Close on backdrop click
        document.addEventListener('click', (e) => {
            if (this.activeModal && e.target === this.activeModal) {
                this.close();
            }
        });
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ModalManager = ModalManager;
}
