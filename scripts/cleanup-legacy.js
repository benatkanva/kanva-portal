/**
 * Cleanup Script for Legacy Calculator Code
 * 
 * This script helps migrate from the old calculator-consolidated.js to the new modular structure.
 * Run this script after verifying that the new implementation works correctly.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = path.join(__dirname, '..');
const LEGACY_FILE = path.join(PROJECT_ROOT, 'js', 'calculator-consolidated.js');
const BACKUP_FILE = path.join(PROJECT_ROOT, 'js', 'calculator-consolidated.js.backup');

// Check if the legacy file exists
if (!fs.existsSync(LEGACY_FILE)) {
    console.log('✅ No legacy calculator file found. Nothing to clean up.');
    process.exit(0);
}

// Check if the new structure is in place
const requiredFiles = [
    'js/calculator/base-calculator.js',
    'js/calculator/pricing-calculator.js',
    'js/calculator/main-calculator.js',
    'js/integrations/copper-crm.js'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(PROJECT_ROOT, file)));

if (missingFiles.length > 0) {
    console.error('❌ Error: Some required files are missing:');
    missingFiles.forEach(file => console.error(`  - ${file}`));
    console.error('\nPlease complete the migration before removing the legacy file.');
    process.exit(1);
}

// Verify the new implementation is working
console.log('✅ All required files are present');
console.log('ℹ️  Verifying new implementation...');

try {
    // Check if the new calculator is properly exported
    const mainCalculator = require(path.join(PROJECT_ROOT, 'js', 'calculator', 'main-calculator.js'));
    if (typeof mainCalculator !== 'function') {
        throw new Error('main-calculator.js does not export the calculator class');
    }
    console.log('✅ New calculator implementation is valid');
} catch (error) {
    console.error('❌ Error verifying new implementation:', error.message);
    process.exit(1);
}

// Create backup if it doesn't exist
if (!fs.existsSync(BACKUP_FILE)) {
    console.log('ℹ️  Creating backup of legacy file...');
    fs.copyFileSync(LEGACY_FILE, BACKUP_FILE);
    console.log(`✅ Backup created at: ${BACKUP_FILE}`);
} else {
    console.log(`ℹ️  Backup already exists at: ${BACKUP_FILE}`);
}

// Remove the legacy file
console.log('ℹ️  Removing legacy file...');
fs.unlinkSync(LEGACY_FILE);
console.log(`✅ Removed legacy file: ${LEGACY_FILE}`);

console.log('\n🎉 Cleanup complete! The legacy calculator file has been removed.');
console.log('A backup has been kept at:', BACKUP_FILE);
console.log('\nNext steps:');
console.log('1. Test your application thoroughly');
console.log('2. Update any build processes or documentation that referenced the old file');
console.log('3. Once confirmed working, you can optionally remove the backup file');

// Update package.json scripts if it exists
const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    try {
        const pkg = require(packageJsonPath);
        if (pkg.scripts && pkg.scripts.dev) {
            pkg.scripts.dev = pkg.scripts.dev
                .replace('js/calculator-consolidated.js', '')
                .replace(/\s+/g, ' ')
                .trim();
            
            fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
            console.log('\n✅ Updated package.json scripts');
        }
    } catch (error) {
        console.warn('⚠️  Could not update package.json:', error.message);
    }
}
