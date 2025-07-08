/**
 * Configuration Manager
 * Handles environment variables and application configuration
 */

class Config {
    constructor() {
        this.config = {};
        this.loadConfig();
    }

    /**
     * Load configuration from environment variables
     */
    loadConfig() {
        // Server configuration
        this.config = {
            // Environment
            env: process.env.NODE_ENV || 'development',
            isProduction: process.env.NODE_ENV === 'production',
            isDevelopment: process.env.NODE_ENV !== 'production',
            
            // GitHub Integration
            github: {
                token: process.env.GITHUB_TOKEN || '',
                repo: process.env.GITHUB_REPO || 'benatkanva/kanva-portal',
                branch: process.env.GITHUB_BRANCH || 'main',
                username: process.env.GITHUB_USERNAME || 'kanva-admin',
                email: process.env.GITHUB_EMAIL || 'admin@kanva.com'
            },
            
            // Server
            server: {
                port: parseInt(process.env.PORT || '3000', 10),
                host: process.env.HOST || '0.0.0.0',
                sessionSecret: process.env.SESSION_SECRET || 'your-secret-key',
                csrfEnabled: process.env.CSRF_ENABLED !== 'false'
            },
            
            // Logging
            logging: {
                level: process.env.LOG_LEVEL || 'info',
                file: process.env.LOG_FILE || 'app.log'
            },
            
            // CORS
            cors: {
                origin: process.env.CORS_ORIGIN || '*',
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization']
            },
            
            // Copper CRM
            copper: {
                apiKey: process.env.COPPER_API_KEY || '',
                email: process.env.COPPER_EMAIL || '',
                userId: process.env.COPPER_USER_ID || ''
            }
        };
        
        // Validate required configurations
        this.validateConfig();
    }
    
    /**
     * Validate required configuration
     */
    validateConfig() {
        // Check GitHub configuration in production
        if (this.config.isProduction) {
            if (!this.config.github.token) {
                console.warn('⚠️  GITHUB_TOKEN is not set. Git integration will be disabled.');
            }
            
            if (this.config.github.token && this.config.github.token === 'your-token-here') {
                console.warn('⚠️  Using default GitHub token. Please update your .env file.');
            }
            
            if (this.config.server.sessionSecret === 'your-secret-key') {
                console.warn('⚠️  Using default session secret. Please update SESSION_SECRET in .env');
            }
        }
    }
    
    /**
     * Get configuration value by path
     * @param {string} path - Path to configuration (e.g., 'github.token')
     * @param {*} defaultValue - Default value if not found
     * @returns {*}
     */
    get(path, defaultValue = null) {
        return path.split('.').reduce((config, key) => 
            config && config[key] !== undefined ? config[key] : defaultValue, this.config);
    }
    
    /**
     * Get all configuration
     * @returns {Object}
     */
    getAll() {
        return this.config;
    }
}

// Create and export a singleton instance
const config = new Config();

// Make available globally
if (typeof window !== 'undefined') {
    window.AppConfig = config;
}

export default config;
