#!/usr/bin/env node

/**
 * Environment Check Script
 * 
 * This script checks for required environment variables and creates a .env file
 * with default values if it doesn't exist.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Define required environment variables and their default values
const envConfig = `# Environment Configuration
# ======================

# Application Environment (development, production, test)
NODE_ENV=development

# Server Configuration
PORT=3000
HOST=localhost

# GitHub Integration
GITHUB_TOKEN=your-github-token-here
GITHUB_REPO=benatkanva/kanva-portal
GITHUB_BRANCH=main
GITHUB_USERNAME=kanva-admin
GITHUB_EMAIL=admin@kanva.com

# Security
SESSION_SECRET=your-session-secret-key-here
CSRF_ENABLED=true

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
LOG_FILE=app.log

# Copper CRM (Optional)
# COPPER_API_KEY=
# COPPER_EMAIL=
# COPPER_USER_ID=
`;

// Path to .env file
const envPath = path.join(process.cwd(), '.env');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.log('\x1b[33m%s\x1b[0m', '⚠️  .env file not found!');
  console.log('\x1b[36m%s\x1b[0m', 'Creating a new .env file with default values...');
  
  // Create .env file with default values
  fs.writeFileSync(envPath, envConfig);
  
  console.log('\x1b[32m%s\x1b[0m', '✅ .env file created successfully!');
  console.log('\x1b[36m%s\x1b[0m', 'Please update the values in the .env file as needed.');
} else {
  // Check if all required variables are present in existing .env
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NODE_ENV',
    'PORT',
    'GITHUB_TOKEN',
    'GITHUB_REPO',
    'GITHUB_BRANCH',
    'GITHUB_USERNAME',
    'GITHUB_EMAIL',
    'SESSION_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => 
    !new RegExp(`^${varName}=`, 'm').test(envContent)
  );
  
  if (missingVars.length > 0) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️  The following required variables are missing from your .env file:');
    missingVars.forEach(varName => console.log(`  - ${varName}`));
    console.log('\x1b[36m%s\x1b[0m', 'Please update your .env file with these variables.');
  }
}

// Make the script executable
if (process.platform !== 'win32') {
  fs.chmodSync(envPath, '600'); // Read/write for owner only
}
