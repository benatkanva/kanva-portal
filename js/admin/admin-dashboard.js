/**
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
