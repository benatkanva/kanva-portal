const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Ensure consistent application root directory regardless of where the server is started from
const APP_ROOT = __dirname;

const PORT = process.env.PORT || 3000;

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

// Create HTTP server with improved request handling
const server = http.createServer((req, res) => {
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

// Start server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Application root directory: ${APP_ROOT}`);
    console.log('Press Ctrl+C to stop the server');
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
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
