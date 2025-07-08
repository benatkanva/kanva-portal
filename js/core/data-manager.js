/**
 * Data Manager
 * Handles all data loading and management for the application
 */

class DataManager {
    constructor() {
        this.data = {};
        this.products = {};
        this.tiers = {};
        this.shipping = {};
        this.adminStatus = false;
        this.adminEmails = [];
        this.gitConfig = null;
        this.copperConfig = null;
        this.loadConfigFromEnv();
        this.loadConfigFromLocalStorage();
    }

    loadConfigFromEnv() {
        // Load from environment variables if available
        if (typeof process !== 'undefined' && process.env) {
            // Load GitHub config
            if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
                this.gitConfig = {
                    token: process.env.GITHUB_TOKEN,
                    repo: process.env.GITHUB_REPO,
                    branch: process.env.GITHUB_BRANCH || 'master', // Changed default to master
                    username: process.env.GITHUB_USERNAME || 'kanva-admin',
                    email: process.env.GITHUB_EMAIL || 'admin@kanva.com'
                };
            }
            
            // Load Copper config
            if (process.env.COPPER_API_KEY && process.env.COPPER_EMAIL) {
                this.copperConfig = {
                    apiKey: process.env.COPPER_API_KEY,
                    email: process.env.COPPER_EMAIL,
                    apiUrl: process.env.COPPER_API_URL || 'https://api.copper.com/developer_api/v1',
                    // Add other Copper-specific settings as needed
                };
            }
        }
    }

    /**
     * Load configuration from localStorage
     */
    loadConfigFromLocalStorage() {
        try {
            // Load GitHub config from localStorage
            const savedGitConfig = localStorage.getItem('gitConfig');
            if (savedGitConfig && !this.gitConfig) {
                this.gitConfig = JSON.parse(savedGitConfig);
                console.log('GitHub config loaded from localStorage');
            }
            
            // Load Copper config from localStorage
            const savedCopperConfig = localStorage.getItem('copperConfig');
            if (savedCopperConfig && !this.copperConfig) {
                this.copperConfig = JSON.parse(savedCopperConfig);
                console.log('Copper config loaded from localStorage');
            }
        } catch (error) {
            console.error('Error loading config from localStorage:', error);
        }
    }

    /**
     * Configure Git integration
     * @param {Object} config - Git configuration
     */
    configureGit(config) {
        if (!config || !config.token || !config.repo) {
            throw new Error('GitHub configuration requires both token and repository');
        }
        
        this.gitConfig = {
            ...config,
            branch: config.branch || 'master', // Changed default to master
            username: config.username || 'kanva-admin',
            email: config.email || 'admin@kanva.com'
        };
        
        // Save to localStorage for persistence
        localStorage.setItem('gitConfig', JSON.stringify(this.gitConfig));
        console.log('GitHub configuration saved');
    }
    
    configureCopper(config) {
        if (!config || !config.apiKey || !config.email) {
            throw new Error('Copper configuration requires both API key and email');
        }
        
        this.copperConfig = {
            ...config,
            apiUrl: config.apiUrl || 'https://api.copper.com/developer_api/v1'
        };
        
        // Save to localStorage for persistence
        localStorage.setItem('copperConfig', JSON.stringify(this.copperConfig));
        console.log('Copper configuration saved');
    }

    /**
     * Check if Git integration is available
     * @returns {boolean}
     */
    hasGitIntegration() {
        return !!(this.gitConfig?.token && this.gitConfig?.repo);
    }
    
    hasCopperIntegration() {
        return !!(this.copperConfig?.apiKey && this.copperConfig?.email && this.copperConfig?.apiUrl);
    }

    /**
     * Validate branch exists in repository
     * @param {string} branch - Branch name to validate
     * @returns {Promise<boolean>} True if branch exists
     */
    async validateBranch(branch) {
        if (!this.hasGitIntegration()) {
            throw new Error('Git integration not configured');
        }

        try {
            const response = await fetch(`https://api.github.com/repos/${this.gitConfig.repo}/branches/${branch}`, {
                headers: {
                    'Authorization': `token ${this.gitConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            return response.ok;
        } catch (error) {
            console.warn(`Error validating branch ${branch}:`, error);
            return false;
        }
    }

    /**
     * Get repository's default branch
     * @returns {Promise<string>} Default branch name
     */
    async getDefaultBranch() {
        if (!this.hasGitIntegration()) {
            throw new Error('Git integration not configured');
        }

        try {
            const response = await fetch(`https://api.github.com/repos/${this.gitConfig.repo}`, {
                headers: {
                    'Authorization': `token ${this.gitConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                const repoData = await response.json();
                return repoData.default_branch;
            }
        } catch (error) {
            console.warn('Error getting default branch:', error);
        }

        // Fallback to master for benatkanva/kanva-portal
        return this.gitConfig.repo === 'benatkanva/kanva-portal' ? 'master' : 'main';
    }

    /**
     * Save data to GitHub repository
     * @param {Object} data - Data to save
     * @param {string} filename - Filename (products, tiers, shipping, etc.)
     * @returns {Promise<boolean>} Success status
     */
    async saveData(data, filename) {
        if (!this.hasGitIntegration()) {
            throw new Error('Git integration not configured. Please set up GitHub credentials first.');
        }

        try {
            // Validate and potentially fix branch
            let branchToUse = this.gitConfig.branch;
            
            // Check if specified branch exists
            const branchExists = await this.validateBranch(branchToUse);
            if (!branchExists) {
                console.warn(`Branch '${branchToUse}' not found, attempting to use default branch`);
                
                // Get the repository's default branch
                const defaultBranch = await this.getDefaultBranch();
                console.log(`Using default branch: ${defaultBranch}`);
                
                // Update our config to use the correct branch
                branchToUse = defaultBranch;
                this.gitConfig.branch = defaultBranch;
                
                // Save updated config
                localStorage.setItem('gitConfig', JSON.stringify(this.gitConfig));
            }

            const filepath = `data/${filename}.json`;
            const content = JSON.stringify(data, null, 2);
            
            console.log(`Saving ${filename}.json to GitHub on branch '${branchToUse}'...`);
            
            // Get current file to get its SHA (required for updates)
            let sha = null;
            try {
                const getResponse = await fetch(`https://api.github.com/repos/${this.gitConfig.repo}/contents/${filepath}?ref=${branchToUse}`, {
                    headers: {
                        'Authorization': `token ${this.gitConfig.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (getResponse.ok) {
                    const fileData = await getResponse.json();
                    sha = fileData.sha;
                    console.log(`Found existing file, SHA: ${sha}`);
                } else if (getResponse.status === 404) {
                    console.log(`File ${filepath} doesn't exist yet, will create new file`);
                } else {
                    console.warn(`Unexpected response when checking file: ${getResponse.status}`);
                }
            } catch (error) {
                console.log(`File ${filepath} doesn't exist yet, will create new file`);
            }

            // Prepare the commit data
            const commitData = {
                message: `Update ${filename}.json from admin panel`,
                content: btoa(unescape(encodeURIComponent(content))), // Base64 encode
                branch: branchToUse,
                committer: {
                    name: this.gitConfig.username,
                    email: this.gitConfig.email
                }
            };

            // Add SHA if updating existing file
            if (sha) {
                commitData.sha = sha;
            }

            console.log(`Committing to branch: ${branchToUse}`);

            // Save to GitHub
            const response = await fetch(`https://api.github.com/repos/${this.gitConfig.repo}/contents/${filepath}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.gitConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(commitData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GitHub API error: ${response.status} - ${errorData.message}`);
            }

            const result = await response.json();
            console.log(`✅ Successfully saved ${filename}.json to GitHub:`, result.commit.html_url);
            
            // Update local data
            this.data[filename] = data;
            if (filename === 'products') this.products = data;
            if (filename === 'tiers') this.tiers = data;
            if (filename === 'shipping') this.shipping = data;
            
            return true;
        } catch (error) {
            console.error(`Error saving ${filename}.json to GitHub:`, error);
            throw error;
        }
    }

    /**
     * Load data from GitHub repository or local files
     * @param {string} filename - Filename to load
     * @returns {Promise<Object>} Loaded data
     */
    async getData(filename) {
        // If we have Git integration, try loading from GitHub first
        if (this.hasGitIntegration()) {
            try {
                const branchToUse = this.gitConfig.branch;
                const filepath = `data/${filename}.json`;
                const response = await fetch(`https://api.github.com/repos/${this.gitConfig.repo}/contents/${filepath}?ref=${branchToUse}`, {
                    headers: {
                        'Authorization': `token ${this.gitConfig.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (response.ok) {
                    const fileData = await response.json();
                    const content = atob(fileData.content); // Decode from base64
                    const data = JSON.parse(content);
                    
                    // Cache locally
                    this.data[filename] = data;
                    if (filename === 'products') this.products = data;
                    if (filename === 'tiers') this.tiers = data;
                    if (filename === 'shipping') this.shipping = data;
                    
                    console.log(`Loaded ${filename}.json from GitHub (branch: ${branchToUse})`);
                    return data;
                }
            } catch (error) {
                console.warn(`Failed to load ${filename} from GitHub, falling back to local:`, error);
            }
        }

        // Fallback to local file loading
        return this.loadLocalData(filename);
    }

    /**
     * Load data from local files
     * @param {string} filename - Filename to load
     * @returns {Promise<Object>} Loaded data
     */
    async loadLocalData(filename) {
        try {
            const response = await fetch(`data/${filename}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Cache locally
            this.data[filename] = data;
            if (filename === 'products') this.products = data;
            if (filename === 'tiers') this.tiers = data;
            if (filename === 'shipping') this.shipping = data;
            
            return data;
        } catch (error) {
            console.error(`Error loading local ${filename}.json:`, error);
            throw error;
        }
    }

    /**
     * Update configuration
     * @param {Object} newConfig - Configuration updates
     */
    async updateConfig(newConfig) {
        try {
            // Update Git configuration if provided
            if (newConfig.GITHUB_REPO || newConfig.GITHUB_TOKEN) {
                const gitConfig = {
                    repo: newConfig.GITHUB_REPO || this.gitConfig?.repo,
                    branch: newConfig.GITHUB_BRANCH || this.gitConfig?.branch || 'master', // Default to master
                    token: newConfig.GITHUB_TOKEN || this.gitConfig?.token,
                    username: newConfig.GITHUB_USERNAME || this.gitConfig?.username || 'benatkanva',
                    email: newConfig.GITHUB_EMAIL || this.gitConfig?.email || 'admin@kanva.com'
                };
                
                this.configureGit(gitConfig);
            }

            // Update other configuration as needed
            if (newConfig.COPPER_API_KEY) {
                localStorage.setItem('copperApiKey', newConfig.COPPER_API_KEY);
            }
            
            if (newConfig.COPPER_USER_EMAIL) {
                localStorage.setItem('copperUserEmail', newConfig.COPPER_USER_EMAIL);
            }

            console.log('Configuration updated successfully');
            return true;
        } catch (error) {
            console.error('Error updating configuration:', error);
            throw error;
        }
    }

    async loadAllData() {
        try {
            console.log('Loading all data...');
            
            // Load products
            const productsResponse = await fetch('data/products.json');
            this.products = await productsResponse.json();
            this.data.products = this.products;
            
            // Load tiers
            const tiersResponse = await fetch('data/tiers.json');
            this.tiers = await tiersResponse.json();
            this.data.tiers = this.tiers;
            
            // Load shipping data
            const shippingResponse = await fetch('data/shipping.json');
            this.shipping = await shippingResponse.json();
            this.data.shipping = this.shipping;
            
            // Load admin emails
            try {
                const adminEmailsResponse = await fetch('data/admin-emails.json');
                this.adminEmails = await adminEmailsResponse.json();
                console.log('Admin emails loaded:', this.adminEmails.length);
            } catch (error) {
                console.warn('Could not load admin emails:', error);
                this.adminEmails = [];
            }
            
            console.log('All data loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    /**
     * Check if current user is an admin
     * @param {string} [email] - Optional email to check (defaults to current user's email in Copper)
     * @returns {Promise<boolean>} True if user is admin
     */
    async isAdmin(email) {
        // Check if we have admin emails loaded
        if (!this.adminEmails || this.adminEmails.length === 0) {
            await this.loadAllData();
        }
        
        // If email is provided, check against admin emails
        if (email) {
            return this.adminEmails.includes(email.toLowerCase());
        }
        
        // Check if we're in Copper context and get current user's email
        if (window.Copper && window.Copper.user && window.Copper.user.email) {
            return this.adminEmails.includes(window.Copper.user.email.toLowerCase());
        }
        
        // Fallback to session storage for password-based login
        const adminSession = sessionStorage.getItem('adminSession');
        if (adminSession) {
            try {
                const { email: sessionEmail, expires } = JSON.parse(adminSession);
                if (new Date(expires) > new Date()) {
                    return this.adminEmails.includes(sessionEmail.toLowerCase());
                }
            } catch (e) {
                console.warn('Invalid admin session', e);
            }
        }
        
        return false;
    }

    /**
     * Verify admin password and create a session
     * @param {string} password - The password to verify
     * @returns {boolean} True if password is correct
     */
    verifyAdminPassword(password) {
        // In a real app, this would be hashed and stored securely
        const ADMIN_PASSWORD = 'kanva123';
        return password === ADMIN_PASSWORD;
    }

    /**
     * Create an admin session
     * @param {string} email - The admin's email
     * @param {number} [durationHours=4] - Session duration in hours
     */
    createAdminSession(email, durationHours = 4) {
        const expires = new Date();
        expires.setHours(expires.getHours() + durationHours);

        sessionStorage.setItem('adminSession', JSON.stringify({
            email: email.toLowerCase(),
            expires: expires.toISOString()
        }));
    }

    /**
     * Clear the admin session
     */
    clearAdminSession() {
        sessionStorage.removeItem('adminSession');
    }

    detectAdmin() {
        // Check URL parameters for admin email
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');

        if (email && this.adminEmails.includes(email)) {
            this.adminStatus = true;
        } else {
            // Development mode - enable admin by default
            this.adminStatus = true;
        }

        
        console.log(`👤 Admin status: ${this.adminStatus}`);
    }

    getData() {
        return this.data;
    }

    isAdmin() {
        return this.adminStatus;
    }

    getProducts() {
        return this.products || this.data.products || {};
    }

    getTiers() {
        return this.tiers || this.data.tiers || {};
    }

    getShipping() {
        return this.shipping || this.data.shipping || {};
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.DataManager = DataManager;
}