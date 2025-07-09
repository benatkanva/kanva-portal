/**
 * Kanva Portal Integration Validator
 * Automatically validates the integration between Admin Dashboard and Copper CRM
 * 
 * This script runs a series of tests to ensure that:
 * 1. All required scripts are loaded
 * 2. Admin Dashboard initializes correctly
 * 3. Copper CRM integration is working
 * 4. Credentials are properly saved and applied
 */

(function() {
    // Self-executing function to avoid polluting global scope
    
    // Create validator object
    const IntegrationValidator = {
        version: '1.0.0',
        timestamp: new Date().getTime(),
        testResults: {},
        
        /**
         * Initialize validator
         */
        init: function() {
            console.log('🔍 Initializing Integration Validator...');
            
            // Add global access
            window.IntegrationValidator = this;
            
            // Wait for DOM content to be loaded
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.runTests());
            } else {
                // DOM already loaded, run tests after a short delay
                setTimeout(() => this.runTests(), 1000);
            }
            
            return this;
        },
        
        /**
         * Run all tests
         */
        runTests: function() {
            console.log('🔍 Running integration tests...');
            
            // Only run in development environment
            if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                console.log('🔍 Skipping tests in production environment');
                return;
            }
            
            // Run tests in sequence
            this.testScriptLoading()
                .then(() => this.testAdminInitialization())
                .then(() => this.testCopperIntegration())
                .then(() => this.testCredentialStorage())
                .then(() => this.displayResults())
                .catch(error => {
                    console.error('🔍 Test execution error:', error);
                    this.displayResults();
                });
        },
        
        /**
         * Test 1: Script Loading
         * Verify that all required scripts are loaded
         */
        testScriptLoading: async function() {
            console.log('🔍 Testing script loading...');
            
            const requiredScripts = [
                { name: 'AdminManager', check: () => typeof AdminManager === 'function' },
                { name: 'AdminDashboard', check: () => typeof AdminDashboard === 'function' },
                { name: 'CopperIntegration', check: () => typeof CopperIntegration === 'object' },
                { name: 'KanvaApp', check: () => typeof KanvaApp === 'function' },
                { name: 'CacheBuster', check: () => typeof window.CacheBuster === 'object' }
            ];
            
            const results = {};
            
            requiredScripts.forEach(script => {
                try {
                    results[script.name] = script.check();
                } catch (error) {
                    results[script.name] = false;
                    console.error(`🔍 Error checking ${script.name}:`, error);
                }
            });
            
            this.testResults.scriptLoading = {
                passed: Object.values(results).every(result => result),
                details: results
            };
            
            console.log('🔍 Script loading test results:', this.testResults.scriptLoading);
            
            return this.testResults.scriptLoading;
        },
        
        /**
         * Test 2: Admin Initialization
         * Verify that AdminManager and AdminDashboard initialize correctly
         */
        testAdminInitialization: async function() {
            console.log('🔍 Testing admin initialization...');
            
            const results = {
                adminManagerExists: typeof AdminManager === 'function',
                adminDashboardExists: typeof AdminDashboard === 'function',
                appHasAdminModule: false,
                adminModuleInitialized: false
            };
            
            // Check if app has AdminManager instance
            if (window.app && window.app.modules && window.app.modules.admin) {
                results.appHasAdminModule = true;
                
                // Check if admin module is initialized
                if (typeof window.app.modules.admin.isInitialized === 'boolean') {
                    results.adminModuleInitialized = window.app.modules.admin.isInitialized;
                }
            }
            
            this.testResults.adminInitialization = {
                passed: results.adminManagerExists && results.adminDashboardExists,
                details: results
            };
            
            console.log('🔍 Admin initialization test results:', this.testResults.adminInitialization);
            
            return this.testResults.adminInitialization;
        },
        
        /**
         * Test 3: Copper CRM Integration
         * Verify that Copper CRM integration is working
         */
        testCopperIntegration: async function() {
            console.log('🔍 Testing Copper CRM integration...');
            
            const results = {
                copperIntegrationExists: typeof CopperIntegration === 'object',
                initializeMethodExists: false,
                configureSdkMethodExists: false,
                environmentDetectionWorks: false,
                copperSdkAvailable: typeof window.Copper !== 'undefined'
            };
            
            // Check if CopperIntegration methods exist
            if (results.copperIntegrationExists) {
                results.initializeMethodExists = typeof CopperIntegration.initialize === 'function';
                results.configureSdkMethodExists = typeof CopperIntegration.configureSdk === 'function';
                
                // Check if environment detection works
                if (typeof CopperIntegration.isInCopperEnvironment === 'function') {
                    results.environmentDetectionWorks = true;
                    results.isInCopperEnvironment = CopperIntegration.isInCopperEnvironment();
                }
            }
            
            this.testResults.copperIntegration = {
                passed: results.copperIntegrationExists && results.initializeMethodExists && results.configureSdkMethodExists,
                details: results
            };
            
            console.log('🔍 Copper CRM integration test results:', this.testResults.copperIntegration);
            
            return this.testResults.copperIntegration;
        },
        
        /**
         * Test 4: Credential Storage
         * Verify that credentials are properly saved and applied
         */
        testCredentialStorage: async function() {
            console.log('🔍 Testing credential storage...');
            
            const results = {
                copperApiKeyExists: !!localStorage.getItem('copperApiKey'),
                copperUserEmailExists: !!localStorage.getItem('copperUserEmail'),
                gitConfigExists: !!localStorage.getItem('gitConfig')
            };
            
            // Check if credentials are masked properly
            if (results.copperApiKeyExists) {
                const apiKey = localStorage.getItem('copperApiKey');
                results.apiKeyMasked = `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`;
            }
            
            if (results.copperUserEmailExists) {
                const userEmail = localStorage.getItem('copperUserEmail');
                results.userEmailMasked = `${userEmail.substring(0, 3)}...${userEmail.substring(userEmail.indexOf('@'))}`;
            }
            
            this.testResults.credentialStorage = {
                passed: results.copperApiKeyExists && results.copperUserEmailExists,
                details: results
            };
            
            console.log('🔍 Credential storage test results:', this.testResults.credentialStorage);
            
            return this.testResults.credentialStorage;
        },
        
        /**
         * Display test results in UI
         */
        displayResults: function() {
            console.log('🔍 Displaying test results...');
            
            // Calculate overall status
            const allTests = Object.values(this.testResults);
            const allPassed = allTests.every(test => test.passed);
            const passedCount = allTests.filter(test => test.passed).length;
            const totalCount = allTests.length;
            
            // Create results container
            const container = document.createElement('div');
            container.className = 'integration-validator-results';
            container.innerHTML = `
                <div class="results-header ${allPassed ? 'success' : 'warning'}">
                    <h3>Integration Validator Results</h3>
                    <div class="status-badge ${allPassed ? 'success' : 'warning'}">
                        ${passedCount}/${totalCount} Tests Passed
                    </div>
                    <button class="close-button">&times;</button>
                </div>
                <div class="results-body">
                    ${this.renderTestResult('Script Loading', this.testResults.scriptLoading)}
                    ${this.renderTestResult('Admin Initialization', this.testResults.adminInitialization)}
                    ${this.renderTestResult('Copper CRM Integration', this.testResults.copperIntegration)}
                    ${this.renderTestResult('Credential Storage', this.testResults.credentialStorage)}
                </div>
                <div class="results-footer">
                    <button class="action-button rerun">Re-run Tests</button>
                    <button class="action-button refresh">Refresh Cache</button>
                </div>
            `;
            
            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .integration-validator-results {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 350px;
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 9999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    overflow: hidden;
                    max-height: 80vh;
                    display: flex;
                    flex-direction: column;
                }
                .results-header {
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    border-bottom: 1px solid #eee;
                }
                .results-header h3 {
                    margin: 0;
                    flex: 1;
                    font-size: 16px;
                }
                .results-header.success {
                    background: #f0f9eb;
                }
                .results-header.warning {
                    background: #fdf6ec;
                }
                .results-header.error {
                    background: #fef0f0;
                }
                .status-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                }
                .status-badge.success {
                    background: #67c23a;
                    color: white;
                }
                .status-badge.warning {
                    background: #e6a23c;
                    color: white;
                }
                .status-badge.error {
                    background: #f56c6c;
                    color: white;
                }
                .close-button {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #999;
                    margin-left: 8px;
                }
                .results-body {
                    padding: 16px;
                    overflow-y: auto;
                }
                .test-result {
                    margin-bottom: 16px;
                }
                .test-result:last-child {
                    margin-bottom: 0;
                }
                .test-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .test-name {
                    flex: 1;
                    font-weight: bold;
                }
                .test-status {
                    font-size: 12px;
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                .test-status.success {
                    background: #f0f9eb;
                    color: #67c23a;
                }
                .test-status.warning {
                    background: #fdf6ec;
                    color: #e6a23c;
                }
                .test-status.error {
                    background: #fef0f0;
                    color: #f56c6c;
                }
                .test-details {
                    background: #f9f9f9;
                    border-radius: 4px;
                    padding: 8px;
                    font-size: 12px;
                    font-family: monospace;
                    max-height: 150px;
                    overflow-y: auto;
                }
                .results-footer {
                    padding: 12px 16px;
                    display: flex;
                    justify-content: flex-end;
                    border-top: 1px solid #eee;
                    background: #f9f9f9;
                }
                .action-button {
                    padding: 6px 12px;
                    border-radius: 4px;
                    border: none;
                    cursor: pointer;
                    font-size: 12px;
                    margin-left: 8px;
                }
                .action-button.rerun {
                    background: #93D500;
                    color: white;
                }
                .action-button.refresh {
                    background: #409eff;
                    color: white;
                }
            `;
            
            // Add to document
            document.head.appendChild(style);
            document.body.appendChild(container);
            
            // Add event listeners
            const closeButton = container.querySelector('.close-button');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    container.remove();
                });
            }
            
            const rerunButton = container.querySelector('.action-button.rerun');
            if (rerunButton) {
                rerunButton.addEventListener('click', () => {
                    container.remove();
                    this.runTests();
                });
            }
            
            const refreshButton = container.querySelector('.action-button.refresh');
            if (refreshButton) {
                refreshButton.addEventListener('click', () => {
                    if (typeof window.refreshCache === 'function') {
                        window.refreshCache();
                        setTimeout(() => {
                            location.reload();
                        }, 1000);
                    } else {
                        location.reload();
                    }
                });
            }
        },
        
        /**
         * Render a single test result
         */
        renderTestResult: function(name, result) {
            if (!result) return '';
            
            const status = result.passed ? 'success' : 'warning';
            const statusText = result.passed ? 'PASSED' : 'WARNING';
            
            return `
                <div class="test-result">
                    <div class="test-header">
                        <div class="test-name">${name}</div>
                        <div class="test-status ${status}">${statusText}</div>
                    </div>
                    <div class="test-details">
                        ${JSON.stringify(result.details, null, 2)}
                    </div>
                </div>
            `;
        }
    };
    
    // Initialize validator
    IntegrationValidator.init();
})();
