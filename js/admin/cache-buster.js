/**
 * Cache Buster Script
 * Helps resolve script loading/caching issues in Copper CRM environment
 */

(function() {
    // Self-executing function to avoid polluting global scope
    
    // Create cache buster object
    const CacheBuster = {
        version: '1.0.0',
        timestamp: new Date().getTime(),
        
        /**
         * Force reload all scripts with cache busting
         */
        forceReload: function() {
            console.log('🔄 Force reloading all scripts with cache busting...');
            
            // Get all script tags
            const scripts = document.querySelectorAll('script[src]');
            
            // Track reloaded scripts
            const reloadedScripts = [];
            
            // Process each script
            scripts.forEach(script => {
                const originalSrc = script.getAttribute('src');
                
                // Skip already processed scripts or scripts with query params
                if (reloadedScripts.includes(originalSrc) || originalSrc.includes('?v=')) {
                    return;
                }
                
                // Create new script element
                const newScript = document.createElement('script');
                
                // Add cache busting parameter
                const cacheBustSrc = originalSrc.includes('?') 
                    ? `${originalSrc}&_cb=${this.timestamp}` 
                    : `${originalSrc}?_cb=${this.timestamp}`;
                
                // Set attributes
                newScript.src = cacheBustSrc;
                newScript.async = false;
                
                // Add to document
                document.head.appendChild(newScript);
                
                // Track reloaded script
                reloadedScripts.push(originalSrc);
                console.log(`✅ Reloaded: ${originalSrc} → ${cacheBustSrc}`);
            });
            
            console.log(`🔄 Reloaded ${reloadedScripts.length} scripts with cache busting`);
            
            // Show success message
            this.showReloadMessage();
            
            return reloadedScripts.length;
        },
        
        /**
         * Show reload message to user
         */
        showReloadMessage: function() {
            // Create toast notification
            const toast = document.createElement('div');
            toast.className = 'cache-buster-toast';
            toast.innerHTML = `
                <div class="toast-icon">🔄</div>
                <div class="toast-content">
                    <div class="toast-title">Cache Refreshed</div>
                    <div class="toast-message">All scripts have been reloaded with cache busting.</div>
                </div>
                <button class="toast-close">&times;</button>
            `;
            
            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .cache-buster-toast {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: #fff;
                    border-left: 4px solid #93D500;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    border-radius: 4px;
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    max-width: 320px;
                    z-index: 9999;
                    animation: slideIn 0.3s ease-out;
                }
                .toast-icon {
                    font-size: 24px;
                    margin-right: 12px;
                }
                .toast-content {
                    flex: 1;
                }
                .toast-title {
                    font-weight: bold;
                    margin-bottom: 4px;
                }
                .toast-message {
                    font-size: 14px;
                    color: #666;
                }
                .toast-close {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #999;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            
            // Add to document
            document.head.appendChild(style);
            document.body.appendChild(toast);
            
            // Add close button handler
            const closeBtn = toast.querySelector('.toast-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    toast.remove();
                });
            }
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 5000);
        },
        
        /**
         * Check if we're in Copper CRM environment
         */
        isInCopperEnvironment: function() {
            return typeof window.Copper !== 'undefined';
        },
        
        /**
         * Initialize cache buster
         */
        init: function() {
            console.log('🔄 Initializing Cache Buster...');
            
            // Add global access
            window.CacheBuster = this;
            
            // Add keyboard shortcut (Ctrl+Shift+R)
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                    e.preventDefault();
                    this.forceReload();
                }
            });
            
            // Add reload button to admin panel if in development
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                setTimeout(() => {
                    const adminPanel = document.querySelector('.admin-panel');
                    if (adminPanel) {
                        const reloadBtn = document.createElement('button');
                        reloadBtn.className = 'btn btn-sm btn-secondary';
                        reloadBtn.innerHTML = '🔄 Refresh Cache';
                        reloadBtn.style.position = 'absolute';
                        reloadBtn.style.top = '10px';
                        reloadBtn.style.right = '10px';
                        reloadBtn.addEventListener('click', () => this.forceReload());
                        adminPanel.appendChild(reloadBtn);
                    }
                }, 2000);
            }
            
            console.log('✅ Cache Buster initialized');
            
            // Return self for chaining
            return this;
        }
    };
    
    // Initialize cache buster
    CacheBuster.init();
    
    // Add global function for easy access
    window.refreshCache = function() {
        return CacheBuster.forceReload();
    };
    
    console.log('🔄 Cache Buster loaded successfully. Use Ctrl+Shift+R or call window.refreshCache() to force reload scripts.');
})();
