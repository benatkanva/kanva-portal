/**
 * Admin Dashboard Test Script
 * This script helps verify that the admin dashboard and Copper CRM integration are working correctly
 */

// Self-executing function to avoid polluting global scope
(function() {
    console.log('🧪 Running Admin Dashboard Test Script...');
    
    // Test functions
    const AdminTest = {
        /**
         * Run all tests
         */
        runAllTests: async function() {
            try {
                console.group('🧪 Admin Dashboard Tests');
                
                // Test admin initialization
                await this.testAdminInitialization();
                
                // Test admin dashboard
                await this.testAdminDashboard();
                
                // Test Copper CRM integration
                await this.testCopperIntegration();
                
                console.groupEnd();
                console.log('✅ All tests completed successfully');
                
                return true;
            } catch (error) {
                console.error('❌ Test failed:', error);
                console.groupEnd();
                return false;
            }
        },
        
        /**
         * Test admin initialization
         */
        testAdminInitialization: async function() {
            console.group('🔍 Testing Admin Initialization');
            
            // Check if AdminManager is defined
            if (typeof AdminManager !== 'function') {
                throw new Error('AdminManager is not defined');
            }
            console.log('✅ AdminManager is defined');
            
            // Check if AdminDashboard is defined
            if (typeof AdminDashboard !== 'function') {
                throw new Error('AdminDashboard is not defined');
            }
            console.log('✅ AdminDashboard is defined');
            
            // Check if app has AdminManager instance
            if (!window.app || !window.app.modules || !window.app.modules.admin) {
                console.warn('⚠️ App does not have AdminManager instance');
            } else {
                console.log('✅ App has AdminManager instance');
            }
            
            console.groupEnd();
            return true;
        },
        
        /**
         * Test admin dashboard
         */
        testAdminDashboard: async function() {
            console.group('🔍 Testing Admin Dashboard');
            
            try {
                // Create test instance
                const testAdminManager = new AdminManager({
                    calculator: window.calculator || {},
                    dataManager: window.DataManager ? new DataManager() : {}
                });
                
                // Initialize admin manager
                await testAdminManager.init();
                console.log('✅ AdminManager initialized');
                
                // Check if admin dashboard is created
                if (!testAdminManager.adminDashboard) {
                    throw new Error('AdminDashboard not created by AdminManager');
                }
                console.log('✅ AdminDashboard created');
                
                // Test dashboard initialization
                const dashboardInitialized = await testAdminManager.adminDashboard.init();
                if (!dashboardInitialized) {
                    throw new Error('AdminDashboard initialization failed');
                }
                console.log('✅ AdminDashboard initialized');
                
                // Clean up test instance
                testAdminManager.adminDashboard = null;
                
                console.groupEnd();
                return true;
            } catch (error) {
                console.error('❌ Admin Dashboard test failed:', error);
                console.groupEnd();
                throw error;
            }
        },
        
        /**
         * Test Copper CRM integration
         */
        testCopperIntegration: async function() {
            console.group('🔍 Testing Copper CRM Integration');
            
            // Check if CopperIntegration is defined
            if (typeof CopperIntegration !== 'object') {
                console.warn('⚠️ CopperIntegration is not defined');
                console.groupEnd();
                return false;
            }
            console.log('✅ CopperIntegration is defined');
            
            // Check if initialize method exists
            if (typeof CopperIntegration.initialize !== 'function') {
                console.warn('⚠️ CopperIntegration.initialize is not a function');
                console.groupEnd();
                return false;
            }
            console.log('✅ CopperIntegration.initialize is a function');
            
            // Check saved credentials
            const apiKey = localStorage.getItem('copperApiKey');
            const userEmail = localStorage.getItem('copperUserEmail');
            
            if (apiKey && userEmail) {
                console.log('✅ Copper credentials found in localStorage');
            } else {
                console.warn('⚠️ Copper credentials not found in localStorage');
            }
            
            // Test connection if credentials exist
            if (apiKey && userEmail) {
                try {
                    const response = await fetch('https://api.copper.com/developer_api/v1/account', {
                        method: 'GET',
                        headers: {
                            'X-PW-AccessToken': apiKey,
                            'X-PW-Application': 'developer_api',
                            'X-PW-UserEmail': userEmail,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        console.log('✅ Copper API connection successful');
                    } else {
                        console.warn('⚠️ Copper API connection failed:', response.status);
                    }
                } catch (error) {
                    console.warn('⚠️ Copper API connection error:', error);
                }
            }
            
            console.groupEnd();
            return true;
        }
    };
    
    // Run tests when script is loaded
    window.runAdminTests = async function() {
        return await AdminTest.runAllTests();
    };
    
    // Auto-run tests if in development mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setTimeout(async () => {
            await AdminTest.runAllTests();
        }, 2000); // Wait for app to initialize
    }
    
    console.log('🧪 Admin Test Script loaded successfully');
})();
