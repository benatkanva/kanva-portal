/**
 * Migration Script: Update admin-dashboard.js to use new component-based architecture
 * 
 * This script helps migrate the old admin-dashboard.js to use the new modular components.
 * It creates a backup of the original file and generates a new version that uses the
 * component-based approach.
 */

const fs = require('fs');
const path = require('path');

// Paths
const adminDashboardPath = path.join(__dirname, 'js', 'admin', 'admin-dashboard.js');
const backupPath = path.join(__dirname, 'js', 'admin', 'admin-dashboard.old.js');
const newContent = `/**
 * Admin Dashboard - Component-Based Implementation
 * 
 * This is the updated version of the admin dashboard that uses the new component-based architecture.
 * The actual implementation has been moved to individual component files in the js/admin/components/ directory.
 */

// Import the AdminDashboard component and initialize it
import { AdminDashboard } from './index';

// The AdminDashboard class is now imported from './components/AdminDashboard'
// and initialized in the admin/index.js file.

// For backward compatibility, we'll export the AdminDashboard class
export { AdminDashboard };

document.addEventListener('DOMContentLoaded', () => {
    // The actual initialization is now handled by admin/index.js
    console.log('Admin Dashboard loaded with component-based architecture');
});
`;

// Check if the admin-dashboard.js file exists
if (fs.existsSync(adminDashboardPath)) {
    try {
        // Read the current content
        const currentContent = fs.readFileSync(adminDashboardPath, 'utf8');
        
        // Create a backup of the original file
        fs.writeFileSync(backupPath, currentContent, 'utf8');
        console.log(`Backup created at: ${backupPath}`);
        
        // Write the new content
        fs.writeFileSync(adminDashboardPath, newContent, 'utf8');
        console.log('admin-dashboard.js has been updated to use the new component-based architecture');
        
        console.log('\nMigration completed successfully!');
        console.log('1. A backup of the original file was created as admin-dashboard.old.js');
        console.log('2. The admin-dashboard.js file has been updated to use the new component-based approach');
        console.log('3. The actual implementation is now in the js/admin/components/ directory');
        console.log('\nNext steps:');
        console.log('1. Update your HTML to load the new entry point: js/admin/index.js');
        console.log('2. Test all admin dashboard functionality');
        console.log('3. Remove the backup file (admin-dashboard.old.js) once you\'ve confirmed everything works');
        
    } catch (error) {
        console.error('Error during migration:', error.message);
        process.exit(1);
    }
} else {
    console.error(`Error: ${adminDashboardPath} not found`);
    process.exit(1);
}
