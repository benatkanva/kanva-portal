/**
 * Functionality Verification Script
 * 
 * This script verifies that all functionality from the old calculator-consolidated.js
 * has been properly migrated to the new modular structure.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = path.join(__dirname, '..');
const LEGACY_BACKUP = path.join(PROJECT_ROOT, 'js', 'calculator-consolidated.js.backup');
const NEW_FILES = {
    base: path.join(PROJECT_ROOT, 'js', 'calculator', 'base-calculator.js'),
    pricing: path.join(PROJECT_ROOT, 'js', 'calculator', 'pricing-calculator.js'),
    main: path.join(PROJECT_ROOT, 'js', 'calculator', 'main-calculator.js'),
    copper: path.join(PROJECT_ROOT, 'js', 'integrations', 'copper-crm.js')
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

// Helper functions
function readFileSafe(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        return null;
    }
}

function extractFunctionsAndMethods(content) {
    if (!content) return [];
    
    // Match function declarations and class methods
    const functionRegex = /(?:function\s+([a-zA-Z0-9_$]+)\s*\(|(?:^|\s)(?:async\s+)?([a-zA-Z0-9_$]+)\s*=\s*\(|(?:^|\s)(?:async\s+)?([a-zA-Z0-9_$]+)\s*\()/gm;
    const classMethodRegex = /(?:^|\s)(?:async\s+)?([a-zA-Z0-9_$]+)\s*\(/gm;
    
    const functions = new Set();
    let match;
    
    // Find function declarations
    while ((match = functionRegex.exec(content)) !== null) {
        const funcName = match[1] || match[2] || match[3];
        if (funcName && !funcName.match(/^(if|for|while|catch|function|class|const|let|var)$/)) {
            functions.add(funcName);
        }
    }
    
    // Find class methods
    const classContent = content.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
    const classMethodMatches = classContent.matchAll(classMethodRegex);
    
    for (const match of classMethodMatches) {
        const methodName = match[1];
        if (methodName && !methodName.match(/^(if|for|while|catch|function|class|const|let|var)$/)) {
            functions.add(methodName);
        }
    }
    
    return Array.from(functions).sort();
}

function compareFunctionality() {
    console.log(`${colors.bright}🔍 Comparing functionality between old and new implementations...${colors.reset}\n`);
    
    // Read legacy file
    const legacyContent = readFileSafe(LEGACY_BACKUP);
    if (!legacyContent) {
        console.error(`${colors.red}❌ Error: Could not find legacy backup file at ${LEGACY_BACKUP}${colors.reset}`);
        return;
    }
    
    // Read new files
    const newContents = {};
    let allNewContent = '';
    
    for (const [name, filePath] of Object.entries(NEW_FILES)) {
        const content = readFileSafe(filePath);
        if (content) {
            newContents[name] = content;
            allNewContent += '\n' + content;
        } else {
            console.error(`${colors.red}❌ Error: Could not find ${name} file at ${filePath}${colors.reset}`);
        }
    }
    
    // Extract functions and methods
    const legacyFunctions = extractFunctionsAndMethods(legacyContent);
    const newFunctions = extractFunctionsAndMethods(allNewContent);
    
    // Find missing functions
    const missingFunctions = legacyFunctions.filter(func => !newFunctions.includes(func));
    const newFunctionsAdded = newFunctions.filter(func => !legacyFunctions.includes(func));
    
    // Report results
    console.log(`${colors.bright}📊 Functionality Comparison:${colors.reset}`);
    console.log(`- Legacy functions: ${legacyFunctions.length}`);
    console.log(`- New functions: ${newFunctions.length}`);
    console.log(`- New functions added: ${newFunctionsAdded.length}`);
    
    if (missingFunctions.length > 0) {
        console.log(`\n${colors.yellow}⚠️  Potentially missing functions (${missingFunctions.length}):${colors.reset}`);
        missingFunctions.forEach(func => console.log(`  - ${func}`));
    } else {
        console.log(`\n${colors.green}✅ All legacy functions appear to have been migrated${colors.reset}`);
    }
    
    if (newFunctionsAdded.length > 0) {
        console.log(`\n${colors.cyan}ℹ️  New functions added (${newFunctionsAdded.length}):${colors.reset}`);
        newFunctionsAdded.forEach(func => console.log(`  + ${func}`));
    }
    
    // Check for important patterns
    const importantPatterns = [
        'calculateTotal',
        'updateProductLine',
        'loadData',
        'init',
        'handleSubmit',
        'render',
        'updateUI',
        'saveQuote',
        'loadQuote',
        'resetCalculator'
    ];
    
    console.log(`\n${colors.bright}🔍 Checking for important patterns:${colors.reset}`);
    
    importantPatterns.forEach(pattern => {
        const inLegacy = legacyContent.includes(pattern);
        const inNew = allNewContent.includes(pattern);
        
        if (inLegacy && !inNew) {
            console.log(`${colors.red}❌ Missing pattern: ${pattern}${colors.reset}`);
        } else if (inLegacy && inNew) {
            console.log(`${colors.green}✓ ${pattern}${colors.reset}`);
        } else if (!inLegacy && inNew) {
            console.log(`${colors.cyan}+ ${pattern} (new)${colors.reset}`);
        }
    });
    
    // Check data loading
    console.log(`\n${colors.bright}📦 Data Loading Verification:${colors.reset}`);
    
    const dataFiles = ['products', 'tiers', 'shipping', 'payment', 'admin-emails'];
    dataFiles.forEach(file => {
        const legacyHasIt = legacyContent.includes(`data/${file}.json`);
        const newHasIt = allNewContent.includes(`data/${file}.json`);
        
        if (legacyHasIt && !newHasIt) {
            console.log(`${colors.red}❌ Data file not found in new code: ${file}.json${colors.reset}`);
        } else if (legacyHasIt && newHasIt) {
            console.log(`${colors.green}✓ ${file}.json${colors.reset}`);
        } else if (!legacyHasIt && newHasIt) {
            console.log(`${colors.cyan}+ ${file}.json (new)${colors.reset}`);
        }
    });
}

// Run the comparison
compareFunctionality();

console.log(`\n${colors.bright}✅ Verification complete!${colors.reset}`);
