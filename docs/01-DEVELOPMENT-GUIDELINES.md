# 🏗️ KANVA BOTANICALS QUOTE CALCULATOR
## COMPREHENSIVE DEVELOPMENT GUIDELINES

**Document Version**: 2.0  
**Created**: June 29, 2025  
**Updated**: January 8, 2025  
**Project**: Kanva Botanicals Quote Calculator Portal  
**Status**: Active Development - Hybrid Architecture  

---

## 📋 TABLE OF CONTENTS

1. [PROJECT OVERVIEW](#project-overview)
2. [ARCHITECTURE ANALYSIS](#architecture-analysis)
3. [FILE STRUCTURE](#file-structure)
4. [TECHNICAL PATTERNS](#technical-patterns)
5. [DEVELOPMENT STANDARDS](#development-standards)
6. [MODULE SPECIFICATIONS](#module-specifications)
7. [DATA FLOW](#data-flow)
8. [INTEGRATION GUIDELINES](#integration-guidelines)
9. [DEPLOYMENT PROCEDURES](#deployment-procedures)
10. [TESTING REQUIREMENTS](#testing-requirements)

---

## 🎯 PROJECT OVERVIEW

### Application Purpose
**Kanva Botanicals Quote Calculator** is a sophisticated web application designed to generate accurate product quotes with integrated CRM functionality, admin management, and modern user interface.

### Core Functionality
- **Product Catalog Management**: Interactive product selection with visual tiles
- **Dynamic Pricing**: Volume-based tier pricing with automatic calculations
- **CRM Integration**: Full Copper CRM integration with customer search and auto-population
- **Admin Dashboard**: Comprehensive admin panel for configuration management
- **Quote Generation**: Professional quote output with PDF generation capabilities
- **Multi-Product Support**: Advanced line item management and calculations

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+) with modular class architecture
- **Server**: Custom Node.js HTTP server (server.js) on port 3000
- **Build Tools**: Webpack 5 configuration (dormant, needs alignment)
- **Styling**: Custom modular CSS + Tailwind CSS utilities
- **Data**: JSON-based configuration system
- **CRM**: Copper CRM SDK integration
- **Architecture**: Hybrid legacy/modern structure

---

## 🏗️ ARCHITECTURE ANALYSIS

### System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    KANVA QUOTES SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│  Frontend Layer (index.html + CSS + JavaScript)            │
├─────────────────────────────────────────────────────────────┤
│  Core Application (app.js + main-calculator.js)           │
├─────────────────────────────────────────────────────────────┤
│  Business Logic (pricing, calculations, validation)        │
├─────────────────────────────────────────────────────────────┤
│  Data Layer (JSON files + localStorage)                   │
├─────────────────────────────────────────────────────────────┤
│  Integration Layer (Copper CRM + Admin Panel)             │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy
```
KanvaApp (Main Application)
├── KanvaCalculator (Core Calculator)
│   ├── UIManager (UI Rendering)
│   ├── OrderDetailsManager (Line Items)
│   └── DataManager (Data Loading)
├── AdminDashboard (Admin Interface)
│   ├── AdminUtils (Utilities)
│   └── FormManager (Form Handling)
├── CopperIntegration (CRM Integration)
└── NotificationManager (User Feedback)
```

---

## 📁 FILE STRUCTURE

### Root Directory
```
kanva-portal/
├── index.html                    # Main application entry point
├── server.js                     # Custom Node.js HTTP server (port 3000)
├── admin.html                    # Standalone admin dashboard
├── copper_field_mapper.html      # CRM field mapping tool
├── package.json                  # NPM dependencies and scripts
├── webpack.*.js                  # Webpack build configuration (needs alignment)
├── start-server.bat              # Windows batch file for server startup
└── MIGRATION-GUIDE.md            # Legacy refactoring documentation
```

### Data Configuration (`/data/`)
```
data/
├── products.json                 # Product catalog (pricing, specs, images)
├── tiers.json                    # Volume pricing tiers (tier1/2/3)
├── shipping.json                 # Shipping zones and rates
├── payment.json                  # Payment methods and thresholds
└── admin-emails.json             # Admin notification emails
```

### CSS Architecture (`/css/`)
```
css/
├── main.css                      # Main entry point (imports all other files)
├── admin/                        # Admin interface styles
│   ├── dashboard.css
│   ├── forms.css
│   └── tables.css
├── components/                   # Reusable UI components
│   ├── activity-panel.css
│   ├── buttons.css
│   ├── forms.css
│   ├── modals.css
│   ├── notifications.css
│   └── product-tile.css
├── integrations/                 # Third-party integration styles
│   ├── copper-crm.css
│   └── hybrid.css
├── layouts/                      # Layout components
│   ├── footer.css
│   ├── grid.css
│   ├── header.css
│   └── sidebar.css
└── utilities/                    # Variables, mixins, and helper classes
    ├── _animations.css
    ├── _base.css
    ├── _utilities.css
    └── _variables.css
```

### JavaScript Modules (`/js/`)
```
js/
├── core/                         # Core application classes (8 modules)
│   ├── app.js                   # Main KanvaApp class and initialization
│   ├── kanva-calculator.js      # Core calculator engine
│   ├── calculation-engine.js     # Pricing calculations
│   ├── data-manager.js          # Data loading/management
│   ├── app-state.js             # Application state management
│   ├── config-manager.js        # Configuration management
│   ├── event-manager.js         # Event handling system
│   └── order-details-manager.js  # Line item management
├── ui/                          # User interface components (14 modules)
│   ├── ui-manager.js            # Main UI controller
│   ├── product-selector.js      # Product selection UI
│   ├── order-details-ui.js      # Order management UI
│   ├── admin-ui.js              # Admin interface
│   └── [10+ additional UI modules]
├── admin/                       # Admin-specific modules (4 modules)
├── calculator/                  # Calculator-specific UI (4 modules)
├── integrations/                # External integrations (1 module)
│   └── copper-integration.js    # CRM integration
└── utils/                       # Utility functions (7 modules)
    ├── formatting.js            # Number/currency formatting
    ├── validation.js            # Input validation
    └── [5 additional utility modules]
```

### Assets (`/assets/`)
```
assets/
├── logo/                         # Kanva branding assets
└── product_renders/              # Product thumbnail images (PNG)
```

---

## ⚙️ TECHNICAL PATTERNS

### JavaScript Patterns Used

#### 1. Class Constructors
```javascript
// Use 'new' keyword for instantiation
class KanvaCalculator { /* ... */ }
class UIManager { /* ... */ }
class AdminDashboard { /* ... */ }
class DataManager { /* ... */ }

// Usage
const calculator = new KanvaCalculator();
const uiManager = new UIManager(calculator);
```

#### 2. Object Literals
```javascript
// Use directly without 'new' keyword
const MultiProductManager = { /* methods */ };
const AdminUtils = { /* methods */ };
const TaxUtils = { /* methods */ };

// Usage
MultiProductManager.renumberProductLines();
AdminUtils.showAdminPanel();
```

#### 3. Static Method Classes
```javascript
// Call methods directly on class
class DataLoader {
    static async loadAll() { /* ... */ }
}

// Usage
await DataLoader.loadAll(); // NOT new DataLoader().loadAll()
```

### CSS Architecture Patterns

#### 1. Component-Based Styling
```css
/* Product tiles in components/product-tile.css */
.product-tile {
    transition: transform 0.2s ease;
    cursor: pointer;
}

.product-tile:hover {
    transform: translateY(-4px);
}
```

#### 2. Utility Classes (Tailwind)
```html
<div class="flex items-center justify-between p-4 bg-white rounded-lg shadow">
```

#### 3. BEM Methodology
```css
.line-items-table__header { }
.line-items-table__row { }
.line-items-table__cell--price { }
```

---

## 🎯 DEVELOPMENT STANDARDS

### Code Quality Standards

#### JavaScript Standards
- **ES6+ Features**: Use modern JavaScript (arrow functions, async/await, destructuring)
- **Error Handling**: Always implement try/catch blocks for async operations
- **Console Logging**: Use descriptive console messages with emojis for easy debugging
- **Variable Naming**: Use camelCase for variables, PascalCase for classes
- **Function Documentation**: Include JSDoc comments for complex functions

#### Example Code Structure
```javascript
/**
 * Add product to quote with proper validation
 * @param {string} productKey - Product identifier
 * @returns {boolean} Success status
 */
async addProductToQuote(productKey) {
    try {
        console.log('🛒 Adding product to quote:', productKey);
        
        const product = this.getProduct(productKey);
        if (!product) {
            this.showError('Product not found');
            return false;
        }
        
        // Implementation logic here
        
        console.log('✅ Product added successfully');
        return true;
    } catch (error) {
        console.error('❌ Error adding product:', error);
        this.showError('Failed to add product');
        return false;
    }
}
```

### CSS Standards
- **Mobile First**: Design for mobile, enhance for desktop
- **Component Isolation**: Each component should have isolated styles
- **Performance**: Use efficient selectors, minimize nesting
- **Consistency**: Follow existing design patterns in the modular CSS structure

### File Organization Standards
- **Single Responsibility**: Each file should have one primary purpose
- **Clear Naming**: File names should clearly indicate their purpose
- **Module Exports**: Always export classes/objects for global access
- **Dependencies**: Document all dependencies and initialization order

---

## 📦 MODULE SPECIFICATIONS

### Core Calculator Module (`main-calculator.js`)
**Purpose**: Primary calculation engine and state management

**Key Methods**:
- `initialize()` - Setup calculator with data loading
- `addProductToQuote(productKey)` - Add products to line items
- `updateCalculations()` - Recalculate totals and pricing
- `updateLineItemQuantities(lineItem)` - Handle unit conversions
- `showNotification(message, type)` - User feedback system

**Dependencies**: DataLoader, UIManager, OrderDetailsManager

### UI Manager Module (`ui-manager.js`)
**Purpose**: All user interface rendering and updates

**Key Methods**:
- `initialize()` - Setup UI components
- `populateProductCatalog()` - Render interactive product tiles
- `updateOrderSummary(results)` - Update totals display
- `renderLineItems(items)` - Display quote line items
- `updateDropdowns()` - Populate form dropdowns

**Dependencies**: Calculator instance, notification system

### Admin Dashboard Module (`admin-dashboard.js`)
**Purpose**: Complete admin interface management

**Key Features**:
- Settings management (local storage + JSON config)
- User interface for configuration changes
- Data export/import capabilities
- System status monitoring

### CRM Integration Module (`copper-integration.js`)
**Purpose**: Complete Copper CRM integration

**Key Features**:
- Customer/company/contact search
- Context-aware auto-population
- Quote saving as CRM activities
- Opportunity creation
- Field mapping interface

---

## 🔄 DATA FLOW

### Application Initialization Sequence
```
1. index.html loads → CSS files → DOM structure created
2. main-calculator.js executes → KanvaCalculator instance created
3. app.js detects calculator ready → KanvaApp initialized
4. DataLoader.loadAll() → JSON configuration loaded
5. UIManager.initialize() → UI components populated
6. CopperIntegration.initialize() → CRM detection
7. Application ready for user interaction
```

### User Interaction Flow
```
User Action → UI Event → Calculator Method → Data Update → UI Refresh → User Feedback
```

### Data Sources and Flow
```
JSON Files → DataLoader → Calculator State → UI Components → User Display
     ↓
Local Storage → Admin Settings → Configuration → Runtime Behavior
     ↓
CRM Context → Auto-population → Form Fields → Quote Generation
```

---

## 🚀 APPLICATION INITIALIZATION FLOW

### Current Architecture (Fixed - June 2025)

#### Script Loading Order
```html
<!-- Required Configuration (must load first) -->
<script src="js/core/config-manager.js"></script>

<!-- Utility Modules -->
<script src="js/utils/data-loader.js"></script>
<script src="js/utils/tax-utils.js"></script>
<script src="js/utils/email-generator.js"></script>

<!-- Calculator Modules -->
<script src="js/calculator/multi-product.js"></script>

<!-- Core Engine Modules -->
<script src="js/core/calculation-engine.js"></script>
<script src="js/core/data-manager.js"></script>
<script src="js/core/event-manager.js"></script>
<script src="js/core/order-details-manager.js"></script>
<script src="js/core/kanva-calculator.js"></script>

<!-- UI Modules -->
<script src="js/ui/modal-manager.js"></script>
<script src="js/ui/template-manager.js"></script>
<script src="js/ui/ui-manager.js"></script>
<script src="js/ui/notification-manager.js"></script>

<!-- Integration Modules -->
<script src="js/integrations/copper-crm.js"></script>

<!-- Admin System Modules -->
<script src="js/admin/admin-utils.js"></script>
<script src="js/admin/admin-manager.js"></script>
<script src="js/admin/admin-dashboard.js"></script>

<!-- Core Application (FINAL) -->
<script src="js/core/app.js"></script>
```

#### Initialization Sequence
1. **KanvaCalculator** auto-initializes from `core/kanva-calculator.js`
2. **DataManager** loads JSON configuration files
3. **UIManager** populates dropdowns and product catalog
4. **EventManager** binds all event listeners
5. **Loading spinner** is hidden via `UIManager.showApp()`
6. **Calculator ready event** is dispatched
7. **KanvaApp** in `core/app.js` detects the event and completes setup

#### Key Classes and Responsibilities
- **KanvaCalculator**: Main orchestrator, manages state and coordinates other modules
- **DataManager**: Loads and manages JSON data (products, tiers, shipping, etc.)
- **UIManager**: Handles all UI rendering, updates, and the loading spinner
- **EventManager**: Manages event binding and user interactions
- **CopperIntegration**: Handles CRM integration when available

### Recent Fixes (Modular Architecture Consolidation)

#### Issues Resolved
1. **Duplicate Initialization**: Removed redundant `calculator/main-calculator.js`
2. **Loading Spinner**: Fixed by ensuring `UIManager.showApp()` is called properly
3. **Missing Dependencies**: Added `core/data-manager.js` and `core/event-manager.js`
4. **Console Errors**: Eliminated duplicate calculator instances

#### Files Removed/Consolidated
- ❌ `js/calculator-consolidated.js` → Replaced with modular `js/calculator/main-calculator.js`
- ❌ `js/config.js` → Replaced with `js/core/config-manager.js`
- ❌ `js/notification-manager.js` → Replaced with `js/ui/notification-manager.js`
- ❌ `js/order-details.js` → Replaced with `js/core/order-details-manager.js`
- ❌ `js/calculator/main-calculator.js` → Replaced with `js/core/kanva-calculator.js`

#### Current Module Count
**28 JavaScript modules** in clean, organized structure:
- **Core**: 6 modules (app, config-manager, data-manager, event-manager, kanva-calculator, order-details-manager)
- **Calculator**: 3 modules (base-calculator, multi-product, pricing-calculator)
- **UI**: 5 modules (copper-ui, modal-manager, notification-manager, template-manager, ui-manager)
- **Utils**: 6 modules (data-loader, email-generator, formatters, helpers, tax-utils, validators)
- **Admin**: 4 modules (admin-dashboard, admin-manager, admin-utils, form-manager)
- **Integration**: 1 module (copper-crm)
- **Other**: 3 modules (product-manager)

---

## 🔌 INTEGRATION GUIDELINES

### Copper CRM Integration

#### Setup Requirements
```javascript
// Check CRM availability
if (typeof window.Copper !== 'undefined') {
    const sdk = window.Copper.init();
    // Initialize CRM features
}
```

#### Context Detection
- **Entity Mode**: Auto-populate from contact/company context
- **Left Nav Mode**: Enable customer search functionality
- **Standalone Mode**: Provide demo/test functionality

#### Data Synchronization
- Save quotes as CRM activities
- Create opportunities from quotes
- Maintain field mapping consistency

### Admin System Integration

#### Access Control
```javascript
// Admin authentication
const isAdmin = AdminUtils.checkAdminStatus();
if (isAdmin) {
    AdminDashboard.show();
}
```

## 🚀 DEPLOYMENT PROCEDURES

### Current Build Status
⚠️ **IMPORTANT**: The project has a hybrid build configuration:
- **Primary Server**: Custom Node.js server (`server.js`) - ACTIVE
- **Webpack Configuration**: Present but dormant, needs alignment
- **Entry Point**: `index.html` in root directory (not `src/index.js`)
- **Package Scripts**: `npm start` uses webpack-dev-server (non-functional)

### Development Environment Setup
```bash
# Start development server
node server.js
# Application available at: http://localhost:8080
```

### Production Deployment
1. **Code Review**: Ensure all modules follow established patterns
2. **Testing**: Run through complete user workflows
3. **Asset Optimization**: Minimize CSS/JS if needed
4. **Configuration**: Update data files for production
5. **CRM Setup**: Configure Copper integration settings

### Environment Configuration
- **Development**: Use demo data, extended logging
- **Staging**: Real data, CRM integration testing
- **Production**: Full CRM integration, minimal logging

---

## 🧪 TESTING REQUIREMENTS

### Unit Testing Areas
- Calculator methods (pricing, quantities, totals)
- Data loading and validation
- UI component rendering
- Admin panel functionality

### Integration Testing
- CRM connection and data flow
- Multi-product calculations
- Quote generation and export
- Admin settings persistence

### User Acceptance Testing
- Complete quote workflow
- Admin panel usage
- CRM integration scenarios
- Mobile responsiveness

### Testing Checklist
- [ ] All JavaScript modules initialize without errors
- [ ] Product catalog renders with correct images and pricing
- [ ] Quantity calculations work correctly (units/displays/cases)
- [ ] CRM integration detects context properly
- [ ] Admin panel loads and saves settings
- [ ] Quote generation produces accurate totals
- [ ] Mobile interface is fully functional

---

## 📝 CODING EXAMPLES

### Adding New Product Features
```javascript
// In main-calculator.js
addCustomProductFeature(feature) {
    try {
        console.log('🔧 Adding custom feature:', feature);
        
        // Validate feature
        if (!this.validateCustomFeature(feature)) {
            throw new Error('Invalid feature configuration');
        }
        
        // Update product data
        this.updateProductConfiguration(feature);
        
        // Refresh UI
        this.uiManager.updateProductCatalog();
        
        // Save to admin settings if needed
        if (this.adminUtils.isAdminMode()) {
            this.adminUtils.saveCustomFeature(feature);
        }
        
        this.showNotification('Feature added successfully', 'success');
        return true;
    } catch (error) {
        console.error('❌ Error adding feature:', error);
        this.showError('Failed to add custom feature');
        return false;
    }
}
```

### Creating New UI Components
```javascript
// In ui-manager.js
createCustomUIComponent(componentConfig) {
    const container = document.createElement('div');
    container.className = 'custom-component';
    
    // Use existing CSS patterns
    container.innerHTML = `
        <div class="component-header">
            <h3 class="component-title">${componentConfig.title}</h3>
        </div>
        <div class="component-body">
            ${componentConfig.content}
        </div>
    `;
    
    // Add event listeners
    this.setupComponentEvents(container, componentConfig);
    
    return container;
}
```

---

## 🎯 BEST PRACTICES

### Performance Optimization
- **Lazy Loading**: Load data only when needed
- **Event Debouncing**: Prevent excessive calculations
- **DOM Updates**: Batch DOM modifications
- **Memory Management**: Clean up event listeners

### Security Considerations
- **Input Validation**: Validate all user inputs
- **XSS Prevention**: Escape HTML content
- **Admin Access**: Secure admin panel access
- **Data Privacy**: Handle customer data appropriately

### Maintainability
- **Documentation**: Keep inline comments updated
- **Version Control**: Use meaningful commit messages
- **Code Reviews**: Review all changes before deployment
- **Refactoring**: Regularly improve code structure

---

## 📞 SUPPORT AND MAINTENANCE

### Common Issues and Solutions
1. **Calculator Not Initializing**: Check console for module loading errors
2. **CRM Integration Failing**: Verify Copper SDK availability
3. **UI Not Updating**: Check UIManager initialization sequence
4. **Admin Panel Access**: Verify admin authentication

### Development Support
- Console logging provides detailed operation tracking
- Error messages include context and suggested solutions
- All major functions include try/catch error handling
- UI feedback keeps users informed of system status

### Future Enhancement Areas
- **API Integration**: Additional CRM systems
- **Advanced Reporting**: Quote analytics and tracking
- **Mobile App**: Native mobile application
- **Advanced Admin**: Enhanced configuration options

---

**END OF DEVELOPMENT GUIDELINES**

*This document provides comprehensive guidance for developing, maintaining, and enhancing the Kanva Botanicals Quote Calculator application. All patterns and standards should be followed to ensure consistency and maintainability.*
