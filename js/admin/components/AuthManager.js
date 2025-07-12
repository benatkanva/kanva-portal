import { BaseComponent, Modal } from './index';

/**
 * AuthManager - Handles admin authentication for the dashboard
 */
class AuthManager extends BaseComponent {
    /**
     * Create a new AuthManager
     * @param {Object} options - Component options
     * @param {Array<string>} [options.allowedEmails=[]] - List of allowed admin emails
     * @param {Function} [options.onLogin] - Callback when login is successful
     * @param {Function} [options.onLogout] - Callback when user logs out
     */
    constructor({
        allowedEmails = [
            'ben@kanvabotanicals.com',
            'admin@kanvabotanicals.com',
            'support@kanvabotanicals.com',
            'test@admin.com'
        ],
        onLogin = null,
        onLogout = null,
        ...rest
    } = {}) {
        super({
            isAuthenticated: false,
            userEmail: null,
            isLoading: false,
            error: null,
            ...rest
        });

        this.allowedEmails = allowedEmails;
        this.onLogin = onLogin;
        this.onLogout = onLogout;
        this.loginModal = null;

        // Check for existing session
        this.checkAuthStatus();
    }

    /**
     * Check if user is authenticated
     */
    checkAuthStatus() {
        try {
            const email = sessionStorage.getItem('kanva_admin_email');
            const token = sessionStorage.getItem('kanva_admin_token');
            
            if (email && token && this.allowedEmails.includes(email)) {
                this.setState({
                    isAuthenticated: true,
                    userEmail: email
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error checking auth status:', error);
            return false;
        }
    }

    /**
     * Show login modal
     */
    showLogin() {
        console.log('🔵 [1/5] AuthManager.showLogin() called');
        
        try {
            // If modal already exists, just open it
            if (this.loginModal) {
                console.log('🔍 [2/5] Login modal exists, opening...');
                this.loginModal.open();
                console.log('✅ [5/5] Login modal opened successfully');
                return;
            }

            console.log('🔍 [2/5] Creating new login modal...');
            
            const modalContent = `
                <div class="login-modal">
                    <h3 class="mb-4">Admin Login</h3>
                    <form id="loginForm" class="needs-validation" novalidate>
                        <div class="mb-3">
                            <label for="loginEmail" class="form-label">Email address</label>
                            <input type="email" class="form-control" id="loginEmail" required>
                            <div class="invalid-feedback">Please enter a valid email address.</div>
                        </div>
                        <div class="mb-3">
                            <label for="loginPassword" class="form-label">Password</label>
                            <input type="password" class="form-control" id="loginPassword" required>
                            <div class="invalid-feedback">Please enter your password.</div>
                        </div>
                        <div id="loginError" class="alert alert-danger d-none" role="alert">
                            Invalid email or password.
                        </div>
                        <div class="d-grid gap-2">
                            <button type="submit" class="btn btn-primary">
                                <span class="spinner-border spinner-border-sm d-none" id="loginSpinner"></span>
                                Sign In
                            </button>
                        </div>
                    </form>
                </div>
            `;
            
            console.log('✅ [3/5] Login modal content created');

            this.loginModal = new Modal({
            id: 'authModal',
            title: 'Admin Login',
            content: modalContent,
            size: 'sm',
            showClose: true,
            onOpen: () => {
                const form = document.getElementById('loginForm');
                if (form) {
                    form.addEventListener('submit', this.handleLogin.bind(this));
                }
            },
            onClose: () => {
                const form = document.getElementById('loginForm');
                if (form) {
                    form.removeEventListener('submit', this.handleLogin.bind(this));
                }
            }
        });

        this.loginModal.open();
        console.log(' [5/5] Login modal created and opened');
        } catch (error) {
            console.error(' Error in AuthManager.showLogin:', {
                error: error,
                message: error.message,
                stack: error.stack
            });
            
            // Show error to user
            const errorMessage = error.message || 'Failed to load login form. Please try again.';
            alert(`Error: ${errorMessage}`);
        }
    }

    /**
     * Handle login form submission
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const form = e.target;
        const email = form.querySelector('#loginEmail').value.trim();
        const password = form.querySelector('#loginPassword').value;
        const errorEl = form.querySelector('#loginError');
        const spinner = form.querySelector('#loginSpinner');
        
        // Basic validation
        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add('was-validated');
            return;
        }
        
        this.setState({ isLoading: true });
        if (errorEl) errorEl.classList.add('d-none');
        if (spinner) spinner.classList.remove('d-none');
        
        try {
            // In a real app, this would be an API call to your backend
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // For demo, check against allowed emails (no password check)
            if (this.allowedEmails.includes(email)) {
                // Simulate successful login
                sessionStorage.setItem('kanva_admin_email', email);
                sessionStorage.setItem('kanva_admin_token', 'demo-token-' + Date.now());
                
                this.setState({
                    isAuthenticated: true,
                    userEmail: email,
                    error: null
                });
                
                if (this.loginModal) {
                    this.loginModal.close();
                }
                
                if (typeof this.onLogin === 'function') {
                    this.onLogin(email);
                }
                
                return true;
            } else {
                throw new Error('Invalid email or password');
            }
        } catch (error) {
            console.error('Login failed:', error);
            this.setState({ 
                error: error.message || 'Login failed. Please try again.'
            });
            
            if (errorEl) {
                errorEl.textContent = this.state.error;
                errorEl.classList.remove('d-none');
            }
            
            return false;
        } finally {
            this.setState({ isLoading: false });
            if (spinner) spinner.classList.add('d-none');
        }
    }

    /**
     * Log out the current user
     */
    logout() {
        sessionStorage.removeItem('kanva_admin_email');
        sessionStorage.removeItem('kanva_admin_token');
        
        this.setState({
            isAuthenticated: false,
            userEmail: null
        });
        
        if (typeof this.onLogout === 'function') {
            this.onLogout();
        }
        
        return true;
    }

    /**
     * Render user info and logout button
     */
    renderUserInfo() {
        if (!this.state.isAuthenticated) return '';
        
        return `
            <div class="user-info d-flex align-items-center">
                <span class="me-2">${this.state.userEmail}</span>
                <button class="btn btn-sm btn-outline-secondary" id="logoutBtn">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        `;
    }

    /**
     * Render the component
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'auth-manager';
        
        // Add event listeners if authenticated
        if (this.state.isAuthenticated) {
            setTimeout(() => {
                const logoutBtn = this.element.querySelector('#logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => this.logout());
                }
            }, 0);
        }
        
        return this.element;
    }
    
    /**
     * Lifecycle hook - called after component is mounted
     */
    onMount() {
        // Add any additional setup needed after the component is mounted
    }
    
    /**
     * Lifecycle hook - called before component is unmounted
     */
    onBeforeUnmount() {
        if (this.loginModal) {
            this.loginModal.destroy();
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.AuthManager = AuthManager;
}

export default AuthManager;
