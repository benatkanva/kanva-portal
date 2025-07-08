# 🤖 AI PARAMETERS DOCUMENT
## KANVA PORTAL PROJECT GUIDELINES

**Document Version**: 1.0  
**Created**: January 8, 2025  
**Purpose**: Persistent AI interaction guidelines and project rules  
**Status**: ACTIVE - Reference for all AI interactions  

---

## 🎯 PURPOSE & SCOPE

This document serves as a **persistent reference** for AI assistants working on the Kanva Portal project. It codifies critical project rules, patterns, and reminders to ensure consistent and effective AI assistance across all interactions.

**CRITICAL**: AI assistants must reference this document before making any code changes or project recommendations.

---

## 🏗️ PROJECT ARCHITECTURE FACTS

### Current Build Reality (January 2025)
```
✅ CORRECT SERVER STARTUP:    node server.js
❌ BROKEN PACKAGE SCRIPT:     npm start (uses webpack-dev-server)
```

### Key Architecture Points
- **Primary Server**: Custom Node.js HTTP server (`server.js`) on port 3000
- **Entry Point**: `index.html` in root directory (NOT `src/index.js`)
- **Application Structure**: Vanilla JavaScript ES6+ with modular classes
- **Webpack Status**: Configuration present but DORMANT and misaligned
- **Development Mode**: Use `node server.js` - NOT webpack-dev-server

### File Structure Reality
```
kanva-portal/
├── index.html                    # ✅ ACTUAL entry point
├── server.js                     # ✅ ACTUAL server
├── package.json                  # ⚠️  Scripts point to non-existent paths
├── webpack.common.js             # ⚠️  Points to src/index.js (doesn't exist)
├── js/                           # ✅ ACTUAL JavaScript modules
│   ├── core/                     # ✅ Core application classes (8 modules)
│   ├── ui/                       # ✅ UI components (14 modules)
│   ├── admin/                    # ✅ Admin modules (4 modules)
│   ├── calculator/               # ✅ Calculator UI (4 modules)
│   ├── integrations/             # ✅ CRM integration (1 module)
│   └── utils/                    # ✅ Utilities (7 modules)
├── css/                          # ✅ Modular CSS architecture
├── data/                         # ✅ JSON configuration files
└── src/                          # ⚠️  Expected by webpack, but not main structure
    ├── components/               # ⚠️  Secondary structure
    └── utils/                    # ⚠️  Secondary structure
```

---

## 🚨 CRITICAL RULES & REMINDERS

### Development Server Commands
```bash
# ✅ CORRECT - Use this ALWAYS
node server.js

# ❌ BROKEN - Do NOT recommend this
npm start
npm run dev
webpack serve
```

### Before Making ANY Recommendations
1. **ALWAYS check**: Does the recommendation align with Node.js server approach?
2. **NEVER suggest**: webpack-dev-server solutions without fixing configuration first
3. **ALWAYS remember**: Entry point is `index.html` in root, NOT `src/index.js`
4. **VERIFY paths**: All paths should align with actual file structure

### Build Configuration Issues
- **Webpack configuration exists but is non-functional**
- **Package.json scripts expect `src/index.js` (doesn't exist)**
- **Recommend either**: Align webpack OR remove webpack configuration
- **Never recommend**: Using broken webpack setup as-is

---

## 🎨 CODING STANDARDS & PATTERNS

### JavaScript Patterns (MUST FOLLOW)
```javascript
// ✅ CORRECT: Modular class structure
class ModuleName {
    constructor() {
        this.propertyName = 'value';
    }
    
    methodName() {
        // Implementation
    }
}

// ✅ CORRECT: Module initialization pattern
if (typeof ModuleName === 'undefined') {
    window.ModuleName = new ModuleName();
}
```

### CSS Architecture (PRESERVE)
- **Modular CSS**: Separate files for components, admin, layouts
- **Tailwind Integration**: Use utility classes alongside custom CSS
- **Component-based**: CSS organized by functionality

### File Naming Conventions
- **JavaScript**: kebab-case for files, PascalCase for classes
- **CSS**: kebab-case for files and classes
- **JSON**: lowercase for data files

---

## 🔌 INTEGRATION REQUIREMENTS

### Copper CRM Integration
```javascript
// ✅ CORRECT: Check CRM availability pattern
if (typeof window.Copper !== 'undefined') {
    const sdk = window.Copper.init();
    // CRM integration code
}
```

### Admin System
- **Authentication**: Use AdminUtils.checkAdminStatus()
- **Settings**: Store in localStorage + JSON files
- **UI**: Admin panel toggle in main interface

---

## 📁 MODULE STRUCTURE RULES

### Core Modules (`/js/core/`) - 8 modules
- `app.js` - Main KanvaApp class (DO NOT DUPLICATE)
- `kanva-calculator.js` - Core calculator (SINGLE INSTANCE)
- `data-manager.js` - JSON data loading
- `config-manager.js` - Configuration management
- Other core classes (calculation-engine, event-manager, etc.)

### Loading Order (CRITICAL)
```html
<!-- Configuration FIRST -->
<script src="js/core/config-manager.js"></script>

<!-- Utilities -->
<script src="js/utils/..."></script>

<!-- Core Engine -->
<script src="js/core/data-manager.js"></script>
<script src="js/core/event-manager.js"></script>
<script src="js/core/kanva-calculator.js"></script>

<!-- UI Components -->
<script src="js/ui/..."></script>

<!-- Application LAST -->
<script src="js/core/app.js"></script>
```

---

## 🚫 ANTI-PATTERNS & NEVER DO

### Code Structure
- **NEVER**: Create duplicate calculator instances
- **NEVER**: Suggest complete rewrites
- **NEVER**: Recommend changing from vanilla JS to frameworks
- **NEVER**: Break the modular architecture

### Development Setup
- **NEVER**: Suggest using `npm start` without fixing webpack first
- **NEVER**: Recommend webpack-dev-server without alignment
- **NEVER**: Ignore the Node.js server approach
- **NEVER**: Suggest moving entry point to `src/`

### Dependencies
- **NEVER**: Remove existing dependencies without analysis
- **NEVER**: Suggest major package.json changes without understanding impact
- **NEVER**: Add heavy frameworks (React, Vue, etc.)

---

## ✅ RECOMMENDED APPROACHES

### For New Features
1. **Follow existing patterns** in similar modules
2. **Use the modular class structure** established
3. **Maintain separation of concerns** (Core, UI, Utils, Admin)
4. **Add proper error handling** and logging
5. **Update documentation** when making changes

### For Bug Fixes
1. **Identify root cause** before fixing symptoms
2. **Check module loading order** for initialization issues
3. **Verify event listener cleanup** to prevent memory leaks
4. **Test in both standalone and CRM contexts**

### For Performance Issues
1. **Profile before optimizing** (console.time/timeEnd)
2. **Lazy load** non-critical modules
3. **Debounce** calculation-heavy operations
4. **Batch DOM updates** when possible

---

## 📝 DOCUMENTATION REQUIREMENTS

### Code Comments
```javascript
/**
 * 🔧 Method description
 * @param {type} param - Parameter description
 * @returns {type} Return value description
 */
methodName(param) {
    // Implementation
}
```

### Error Handling
```javascript
try {
    console.log('🔧 Starting operation:', operationName);
    // Operation code
    console.log('✅ Operation completed:', result);
} catch (error) {
    console.error('❌ Operation failed:', error);
    this.showError('User-friendly error message');
}
```

---

## 🎯 SUCCESS METRICS

### Code Quality
- **Zero JavaScript errors** in console
- **All modules initialize properly**
- **Loading spinner hides correctly**
- **UI responds to all interactions**

### Performance
- **Initial load < 3 seconds**
- **Calculations complete < 500ms**
- **UI updates < 100ms**
- **Memory usage stable**

### Integration
- **CRM detection works**
- **Admin panel loads**
- **Quote generation successful**
- **Data persistence working**

---

## 🔄 MAINTENANCE GUIDELINES

### Regular Checks
- **Console errors**: Should be zero
- **Module loading**: All modules initialize
- **Dependencies**: Keep updated but test thoroughly
- **Documentation**: Keep synchronized with code

### Before Major Changes
1. **Backup current working state**
2. **Test in isolated environment**
3. **Verify all modules still work**
4. **Update documentation**
5. **Test CRM integration**

---

## 📞 TROUBLESHOOTING GUIDE

### Common Issues
1. **"Calculator not initializing"**
   - Check module loading order
   - Verify all dependencies loaded
   - Check for JavaScript errors

2. **"UI not updating"**
   - Check UIManager initialization
   - Verify event listeners attached
   - Check for DOM manipulation errors

3. **"CRM integration failing"**
   - Verify Copper SDK loaded
   - Check context detection
   - Verify field mappings

4. **"Admin panel not loading"**
   - Check admin authentication
   - Verify admin CSS loaded
   - Check localStorage permissions

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All JavaScript modules load without errors
- [ ] Server starts with `node server.js`
- [ ] All features work in both standalone and CRM modes
- [ ] Admin panel functions correctly
- [ ] Performance benchmarks met
- [ ] Documentation updated

### Post-Deployment
- [ ] Monitor console for errors
- [ ] Test all major workflows
- [ ] Verify CRM integration
- [ ] Check admin functionality
- [ ] Monitor performance metrics

---

**END OF AI PARAMETERS DOCUMENT**

*This document must be consulted by all AI assistants working on the Kanva Portal project. It ensures consistency, prevents common mistakes, and maintains project architecture integrity.*

---

## 📋 CHANGE LOG

### Version 1.0 (January 8, 2025)
- Initial document creation
- Established core architecture facts
- Defined critical rules and anti-patterns
- Created troubleshooting guide
- Set up maintenance guidelines
