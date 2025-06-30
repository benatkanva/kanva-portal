const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = path.join(__dirname, '..');
const LEGACY_BACKUP = path.join(PROJECT_ROOT, 'js', 'calculator-consolidated.js.backup');
const NEW_FILES = [
    path.join(PROJECT_ROOT, 'js', 'calculator', 'base-calculator.js'),
    path.join(PROJECT_ROOT, 'js', 'calculator', 'pricing-calculator.js'),
    path.join(PROJECT_ROOT, 'js', 'calculator', 'main-calculator.js'),
    path.join(PROJECT_ROOT, 'js', 'integrations', 'copper-crm.js')
];

// Helper function to read file safely
function readFileSafe(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
        return null;
    }
}

// Get all function names from content
function getFunctionNames(content) {
    if (!content) return [];
    
    // Match function declarations and class methods
    const functionRegex = /(?:function\s+([a-zA-Z0-9_$]+)\s*\(|(?:^|\s)(?:async\s+)?([a-zA-Z0-9_$]+)\s*=\s*\(|(?:^|\s)(?:async\s+)?([a-zA-Z0-9_$]+)\s*\()/gm;
    const matches = [];
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
        const funcName = match[1] || match[2] || match[3];
        if (funcName && !['if', 'for', 'while', 'catch', 'function', 'class', 'const', 'let', 'var'].includes(funcName)) {
            matches.push(funcName);
        }
    }
    
    return [...new Set(matches)].sort();
}

// Main verification function
function verifyFunctionality() {
    console.log('🔍 Verifying functionality migration...\n');
    
    // Read legacy file
    const legacyContent = readFileSafe(LEGACY_BACKUP);
    if (!legacyContent) {
        console.error('❌ Error: Could not read legacy backup file');
        return;
    }
    
    // Read new files
    let allNewContent = '';
    for (const file of NEW_FILES) {
        const content = readFileSafe(file);
        if (content) {
            allNewContent += '\n' + content;
        } else {
            console.error(`❌ Error: Could not read file: ${file}`);
            return;
        }
    }
    
    // Get function names
    const legacyFunctions = getFunctionNames(legacyContent);
    const newFunctions = getFunctionNames(allNewContent);
    
    // Find missing functions
    const missingFunctions = legacyFunctions.filter(fn => !newFunctions.includes(fn));
    
    console.log(`📊 Found ${legacyFunctions.length} functions in legacy code`);
    console.log(`📊 Found ${newFunctions.length} functions in new code`);
    
    if (missingFunctions.length > 0) {
        console.log(`\n⚠️  ${missingFunctions.length} functions from legacy code not found in new code:`);
        missingFunctions.forEach(fn => console.log(`  - ${fn}`));
    } else {
        console.log('\n✅ All functions from legacy code found in new code');
    }
    
    // Check for important patterns
    console.log('\n🔍 Checking for important patterns...');
    const patterns = [
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
    
    patterns.forEach(pattern => {
        const inLegacy = legacyContent.includes(pattern);
        const inNew = allNewContent.includes(pattern);
        
        if (inLegacy && !inNew) {
            console.log(`❌ Missing pattern: ${pattern}`);
        } else if (inLegacy && inNew) {
            console.log(`✓ ${pattern} (found)`);
        }
    });
}

// Run verification
verifyFunctionality();
console.log('\n✅ Verification complete');
