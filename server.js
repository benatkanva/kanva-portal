const path = require('path');
const fs = require('fs');
const http = require('http');
const url = require('url');
const { createLogger, format, transports } = require('winston');

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Simple config object for server startup
const config = {
    get: (key, defaultValue = null) => {
        // Handle direct environment variables
        if (key.includes('.')) {
            const [section, name] = key.split('.');
            const envVar = process.env[`${section.toUpperCase()}_${name.toUpperCase()}`];
            if (envVar === 'true') return true;
            if (envVar === 'false') return false;
            if (!isNaN(envVar) && envVar !== '') return Number(envVar);
            return envVar || defaultValue;
        }
        const envVar = process.env[key.toUpperCase()];
        if (envVar === 'true') return true;
        if (envVar === 'false') return false;
        if (!isNaN(envVar) && envVar !== '') return Number(envVar);
        return envVar || defaultValue;
    }
};

// Make config available globally
if (typeof global.AppConfig === 'undefined') {
    global.AppConfig = config;
}

// Ensure consistent application root directory
const APP_ROOT = __dirname;

// Create logs directory if it doesn't exist
const logsDir = path.join(APP_ROOT, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Configure logger with fallback to console if winston fails
let logger;
try {
    logger = createLogger({
        level: config.get('LOG_LEVEL', 'info'),
        format: format.combine(
            format.timestamp(),
            format.json()
        ),
        transports: [
            new transports.Console({
                format: format.combine(
                    format.colorize(),
                    format.simple()
                )
            }),
            new transports.File({ 
                filename: path.join(logsDir, config.get('LOG_FILE', 'server.log')),
                maxsize: 10485760, // 10MB
                maxFiles: 5
            })
        ]
    });
} catch (error) {
    console.error('Failed to configure logger, falling back to console:', error);
    logger = {
        error: console.error.bind(console),
        info: console.log.bind(console),
        warn: console.warn.bind(console),
        debug: console.debug.bind(console)
    };
}

// MIME types for different file extensions
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Create HTTP server with improved request handling and logging
const server = http.createServer((req, res) => {
    // Log request
    const startTime = Date.now();
    
    // Log the request
    logger.info(`${req.method} ${req.url}`, {
        ip: req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
    });
    
    // Response finished handler for logging
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    });
    // Handle OPTIONS requests for CORS (needed by some browsers)
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
            'Access-Control-Max-Age': '86400' // 24 hours
        });
        res.end();
        return;
    }
    // Parse URL
    const parsedUrl = url.parse(req.url);
    let pathname = path.join(APP_ROOT, parsedUrl.pathname);
    
    // If URL has no file extension or ends with '/', serve index.html for SPA routing
    if (path.extname(pathname) === '' || parsedUrl.pathname.endsWith('/')) {
        pathname = path.join(APP_ROOT, 'index.html');
    }
    
    // Get file extension and set content type
    const ext = path.extname(pathname);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // Log request
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} (${contentType})`);
    
    // Detailed logging for static files to help with debugging
    if (ext.match(/\.(css|js|png|jpg|jpeg|gif|svg)$/)) {
        console.log(`[STATIC ASSET] Serving: ${pathname.replace(APP_ROOT, '')}`);
    }
    
    // Add CORS headers for Windsurf browser compatibility
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // Set caching headers for static assets
    if (ext.match(/\.(css|js|json|png|jpg|jpeg|gif|svg|ico)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=0'); // No cache during debugging
    } else {
        res.setHeader('Cache-Control', 'no-cache');
    }
    
    // Read file
    fs.readFile(pathname, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Page not found, serve index.html for SPA routing
                fs.readFile(path.join(APP_ROOT, 'index.html'), (err, content) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Error loading index.html');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(content, 'utf-8');
                    }
                });
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(content, 'utf-8');
        }
    });
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // Don't crash the process in production
    if (config.get('env') === 'production') {
        process.exit(1);
    }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const port = config.get('PORT', 3000);
const host = config.get('HOST', 'localhost');
const env = config.get('NODE_ENV', 'development');

server.listen(port, host, () => {
    console.log(`Server running in ${env} mode`);
    console.log(`Server running at http://${host}:${port}/`);
    
    // Log Git integration status
    const githubToken = config.get('GITHUB_TOKEN');
    if (githubToken && githubToken !== 'your-github-token-here') {
        console.log('GitHub integration: ENABLED');
        console.log(`  Repository: ${config.get('GITHUB_REPO')}`);
        console.log(`  Branch: ${config.get('GITHUB_BRANCH')}`);
    } else {
        console.warn('GitHub integration: DISABLED (no token provided)');
    }
    
    // Log CORS configuration
    console.log(`CORS allowed origins: ${config.get('CORS_ORIGIN')}`);
    
    // Log Copper integration status if configured
    if (config.get('COPPER_API_KEY')) {
        console.log('Copper CRM integration: ENABLED');
    }
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use.`);
        console.error(`Port ${PORT} is already in use.`);
    } else {
        console.error('Server error:', error);
    }
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
        console.log('Server stopped');
        process.exit(0);
    });
});
