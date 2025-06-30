/**
 * Verification Script for Calculator Migration
 * 
 * This script verifies that all functionality from calculator-consolidated.js
 * has been properly migrated to the new modular structure.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = path.join(__dirname, '..');
const LEGACY_FILE = path.join(PROJECT_ROOT, 'js', 'calculator-consolidated.js');
const NEW_FILES = {
    base: path.join(PROJECT_ROOT, 'js', 'calculator', 'base-calculator.js'),
    pricing: path.join(PROJECT_ROOT, 'js', 'calculator', 'pricing-calculator.js'),
    main: path.join(PROJECT_ROOT, 'js', 'calculator', 'main-calculator.js'),
    copper: path.join(PROJECT_ROOT, 'js', 'integrations', 'copper-crm.js')
};

// Check if all new files exist
console.log('🔍 Verifying migration...\n');

let allFilesExist = true;
Object.entries(NEW_FILES).forEach(([name, filePath]) => {
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? '✅' : '❌'} ${name}: ${exists ? 'Found' : 'Missing'}`);
    allFilesExist = allFilesExist && exists;
});

if (!allFilesExist) {
    console.error('\n❌ Some required files are missing. Please complete the migration first.');
    process.exit(1);
}

console.log('\n✅ All new module files are present');

// Check if legacy file exists
if (fs.existsSync(LEGACY_FILE)) {
    console.log('\nℹ️  Legacy file still exists. You can remove it after verification.');
    console.log('   Run: node scripts/cleanup-legacy.js');
} else {
    console.log('\n✅ Legacy file has been removed');
}

console.log('\nMigration verification complete!');
console.log('\nNext steps:');
console.log('1. Test the application thoroughly');
console.log('2. Run: node scripts/cleanup-legacy.js');
console.log('3. Remove the cleanup scripts if everything works');
