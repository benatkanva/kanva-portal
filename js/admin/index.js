/**
 * Admin Dashboard Entry Point
 * Initializes authentication and mounts the AdminDashboard component
 */

import AdminManager from './admin-manager';
import AdminDashboard from './components/AdminDashboard';
import { AuthManager } from './components/AuthManager';

// Export for module usage
export { 
    AdminManager, 
    AuthManager,
    AdminDashboard as default 
};

// Expose to global scope for backward compatibility
if (typeof window !== 'undefined') {
    try {
        console.log('🔄 Initializing admin module in global scope...');
        
        // Always ensure these are available in the global scope
        window.AdminManager = AdminManager;
        window.AdminDashboard = AdminDashboard;
        
        // Add to window.kanva if it exists
        if (window.kanva) {
            window.kanva.AdminManager = AdminManager;
            window.kanva.AdminDashboard = AdminDashboard;
        }
        
        console.log('✅ Admin module exposed to global scope:', { 
            AdminManager: !!window.AdminManager,
            AdminDashboard: !!window.AdminDashboard 
        });
        
        // Dispatch event when AdminManager is loaded
        const event = new CustomEvent('adminManagerLoaded', { 
            detail: { 
                AdminManager: window.AdminManager,
                AdminDashboard: window.AdminDashboard
            } 
        });
        
        // Use setTimeout to ensure this runs after other scripts
        setTimeout(() => {
            console.log('📢 Dispatching adminManagerLoaded event');
            window.dispatchEvent(event);
        }, 100); // Slight delay to ensure other scripts are ready
        
    } catch (error) {
        console.error('❌ Error initializing admin module:', error);
    }
} else {
    console.warn('⚠️ window object not available for admin module initialization');
}

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const config = {
        // In a real app, these would be fetched from the server
        initialData: {
            products: [],
            tiers: {},
            shipping: {},
            integrations: {},
            settings: {}
        },
        // Add any other configuration options here
    };

    // Create a container for the admin dashboard
    const appContainer = document.getElementById('admin-app');
    if (!appContainer) {
        console.error('Admin app container not found');
        return;
    }

    let adminDashboard = null;

    // Initialize the AdminDashboard after successful authentication
    const initAdminDashboard = async (isAuthenticated = false) => {
        try {
            console.log('Initializing Admin Dashboard...');
            
            // Clear any existing content
            appContainer.innerHTML = '';

            // Create and render the AdminDashboard
            adminDashboard = new AdminDashboard({
                data: config.initialData,
                onSave: async (data) => {
                    // In a real app, this would save data to the server
                    console.log('Saving data to server...', data);
                    
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Return true to indicate success, or throw an error on failure
                    return true;
                },
                calculator: window.KanvaCalculator, // Assuming this is globally available
                adminManager: window.AdminManager,  // Use existing or create new AuthManager
                onUnauthenticated: handleLogout     // Handle when user logs out
            });

            // Render the dashboard
            const dashboardElement = adminDashboard.render();
            appContainer.appendChild(dashboardElement);
            
            // Call onMount after the component is added to the DOM
            if (adminDashboard.onMount) {
                adminDashboard.onMount();
            }
            
            // Make the adminDashboard instance available globally for debugging
            window.adminDashboard = adminDashboard;
            
            console.log('Admin Dashboard initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Admin Dashboard:', error);
            showError('Failed to load Admin Dashboard', error);
        }
    };

    // Handle user logout
    const handleLogout = () => {
        console.log('User logged out, showing login screen');
        initAuthFlow(false);
    };

    // Show error message
    const showError = (title, error) => {
        appContainer.innerHTML = `
            <div class="alert alert-danger m-4">
                <h4 class="alert-heading">${title}</h4>
                <p>${error?.message || 'An unknown error occurred'}</p>
                <hr>
                <p class="mb-0">Please try refreshing the page or contact support if the problem persists.</p>
            </div>
        `;
    };

    // Initialize authentication flow
    const initAuthFlow = (isAuthenticated) => {
        appContainer.innerHTML = `
            <div id="auth-container" class="d-flex justify-content-center align-items-center" style="min-height: 60vh;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;

        // If already authenticated, initialize the dashboard
        if (isAuthenticated) {
            initAdminDashboard(true);
            return;
        }

        // Otherwise, show login
        const authManager = new AuthManager({
            onLogin: (email) => {
                console.log('User logged in:', email);
                initAdminDashboard(true);
            },
            onLogout: handleLogout
        });

        // Render the auth UI
        const authContainer = document.getElementById('auth-container');
        if (authContainer) {
            authContainer.innerHTML = '';
            authContainer.appendChild(authManager.render());
            
            // Show login modal if not authenticated
            if (!isAuthenticated) {
                setTimeout(() => authManager.showLogin(), 300);
            }
        }
    };

    // Check if all required dependencies are loaded
    const checkDependencies = () => {
        const requiredGlobals = ['KanvaCalculator'];
        const missingDeps = requiredGlobals.filter(global => !window[global]);
        
        if (missingDeps.length > 0) {
            console.warn('Missing global dependencies:', missingDeps);
            showError('Missing Dependencies', new Error(`Required dependencies not found: ${missingDeps.join(', ')}`));
            return false;
        }
        
        return true;
    };

    // Initialize the application
    const init = () => {
        if (!checkDependencies()) return;
        
        // Check if user is already authenticated
        const isAuthenticated = sessionStorage.getItem('kanva_admin_token') !== null;
        
        // Initialize the appropriate flow
        if (isAuthenticated) {
            initAdminDashboard(true);
        } else {
            initAuthFlow(false);
        }
    };

    // Start the application with dependency checking
    const startApp = () => {
        if (checkDependencies()) {
            init();
        } else {
            // Try again after a short delay in case dependencies are still loading
            const maxAttempts = 5;
            let attempts = 0;
            
            const waitForDeps = setInterval(() => {
                attempts++;
                
                if (checkDependencies() || attempts >= maxAttempts) {
                    clearInterval(waitForDeps);
                    
                    if (attempts >= maxAttempts) {
                        console.error('Failed to load all required dependencies');
                        showError('Initialization Error', new Error('Failed to load all required dependencies'));
                    } else {
                        init();
                    }
                }
            }, 500);
        }
    };

    // Start the application
    startApp();
});

// Export for use in other modules
export { AdminDashboard } from './components/AdminDashboard';

