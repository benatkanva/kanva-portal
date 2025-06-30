/**
 * Global Application State
 * Centralized state management for Kanva Calculator
 */

// Global application state object
window.appState = {
    // Copper CRM Integration
    sdk: null,
    copperContext: null,
    contextEntity: null,
    currentUser: null,
    
    // Integration modes
    integrationMode: 'standalone',
    isActivityPanel: false,
    isLeftNav: false,
    isModalMode: false,
    isCopperActive: false,
    isAdmin: false,
    
    // Context flags
    hasEntityContext: false,
    
    // Calculation cache
    lastMultiProductCalculation: null,
    
    // System state
    isInitialized: false
};

console.log('🌐 Global appState initialized');
