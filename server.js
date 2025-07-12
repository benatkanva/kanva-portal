const path = require('path');
const fs = require('fs');
const http = require('http');
const url = require('url');
const { createLogger, format, transports } = require('winston');

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Load Fishbowl ERP connector library
let Fishbowl;
try {
    Fishbowl = require('node-fishbowl').Fishbowl || require('node-fishbowl');
    console.log('✅ Fishbowl library loaded');
} catch (error) {
    console.warn('⚠️ Fishbowl library not available. Install node-fishbowl to enable Fishbowl ERP integration');
}

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

// MIME types configuration with proper ES module support
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.cjs': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.wasm': 'application/wasm'
};

// Add charset for JavaScript files
const CHARSET_OVERRIDES = {
    '.js': 'utf-8',
    '.mjs': 'utf-8',
    '.cjs': 'utf-8',
    '.json': 'utf-8',
    '.html': 'utf-8',
    '.css': 'utf-8'
};

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

// MIME types are defined at the top of the file with ES module support

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

        // Fishbowl ERP test endpoint
        if (parsedUrl.pathname === '/api/fishbowl/test' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                let params;
                try {
                    params = JSON.parse(body);
                } catch (e) {
                    res.writeHead(400, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
                    return;
                }
                if (!Fishbowl) {
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({ success: false, error: 'Fishbowl library not available' }));
                    return;
                }
                const FBClass = Fishbowl.Fishbowl ? Fishbowl.Fishbowl : Fishbowl;
                const fb = new FBClass({
                    host: params.host,
                    port: params.port,
                    username: params.username,
                    password: params.password,
                    IAID: params.IAID,
                    IAName: params.IAName,
                    IADescription: params.IADescription
                });
                fb.sendRequest({ action: 'ExecuteQueryRq', params: { Query: 'select * from customer' } })
                    .then(response => {
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({ success: true, message: 'Connected to Fishbowl ERP', data: response }));
                    })
                    .catch(error => {
                        res.writeHead(500, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({ success: false, error: error.message }));
                    });
            });
            return;
        }

        // Copper CRM test endpoint (reads creds from env)
        if (parsedUrl.pathname === '/api/copper/test' && req.method === 'GET') {
            const apiKey = config.get('COPPER_API_KEY') || process.env.COPPER_API_KEY;
            const userEmail = config.get('COPPER_USER_EMAIL') || process.env.COPPER_USER_EMAIL;
            const apiUrl = config.get('COPPER_API_URL') || 'https://api.copper.com/developer_api/v1';
            fetch(`${apiUrl}/account`, {
                headers: {
                    'X-PW-AccessToken': apiKey,
                    'X-PW-Application': 'developer_api',
                    'X-PW-UserEmail': userEmail,
                    'Content-Type': 'application/json'
                }
            })
            .then(r => {
                if (r.ok) {
                    return r.json().then(data => {
                        res.writeHead(200, {'Content-Type':'application/json'});
                        res.end(JSON.stringify({ success: true, message: `Connected to ${data.name}` }));
                    });
                } else {
                    res.writeHead(r.status, {'Content-Type':'application/json'});
                    res.end(JSON.stringify({ success: false, error: `${r.status} ${r.statusText}` }));
                }
            }).catch(error => {
                res.writeHead(500, {'Content-Type':'application/json'});
                res.end(JSON.stringify({ success: false, error: error.message }));
            });
            return;
        }

        // Fishbowl test via env (GET)
        if (parsedUrl.pathname === '/api/fishbowl/test' && req.method === 'GET') {
            if (!Fishbowl) {
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({ success: false, error: 'Fishbowl library not available' }));
                return;
            }
            const fbHost = config.get('FISHBOWL_HOST') || process.env.FISHBOWL_HOST;
            const fbPort = config.get('FISHBOWL_PORT') || process.env.FISHBOWL_PORT;
            const fbUser = config.get('FISHBOWL_USERNAME') || process.env.FISHBOWL_USERNAME;
            const fbPass = config.get('FISHBOWL_PASSWORD') || process.env.FISHBOWL_PASSWORD;
            const IAID = config.get('FISHBOWL_IAID') || process.env.FISHBOWL_IAID;
            const IAName = config.get('FISHBOWL_IANAME') || process.env.FISHBOWL_IANAME;
            const IADesc = config.get('FISHBOWL_IADESCRIPTION') || process.env.FISHBOWL_IADESCRIPTION;
            const FBClass = Fishbowl.Fishbowl ? Fishbowl.Fishbowl : Fishbowl;
            const fb = new FBClass({
                host: fbHost,
                port: fbPort,
                username: fbUser,
                password: fbPass,
                IAID: IAID,
                IAName: IAName,
                IADescription: IADesc
            });
            fb.sendRequest({ action: 'ExecuteQueryRq', params: { Query: 'select * from customer' } })
                .then(responseData => {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({ success: true, message: 'Connected to Fishbowl ERP', data: responseData }));
                })
                .catch(err => {
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({ success: false, error: err.message }));
                });
            return;
        }

    // Resolve file path relative to APP_ROOT, remove leading slash if present
    const relativePath = parsedUrl.pathname.startsWith('/') ? parsedUrl.pathname.slice(1) : parsedUrl.pathname;
    let pathname = path.join(APP_ROOT, relativePath);
    
    // If URL has no file extension or ends with '/', serve index.html for SPA routing
    if (path.extname(pathname) === '' || parsedUrl.pathname.endsWith('/')) {
        pathname = path.join(APP_ROOT, 'index.html');
    }
    
    // Get file extension and set content type
    const ext = path.extname(pathname);
    let contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // Ensure JavaScript files have the correct MIME type and charset
    if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
        contentType = 'application/javascript; charset=utf-8';
    }
    
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
    
    // Set content type header with charset for text-based files
    const headers = { 'Content-Type': contentType };
    
    // Add charset for text-based content
    if (contentType.startsWith('text/') || 
        contentType.includes('javascript') || 
        contentType.includes('json') || 
        contentType.includes('css')) {
        if (!contentType.includes('charset')) {
            headers['Content-Type'] = `${contentType}; charset=utf-8`;
        }
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
                        res.writeHead(200, { 
                            'Content-Type': 'text/html; charset=utf-8',
                            'X-Content-Type-Options': 'nosniff'
                        });
                        res.end(content, 'utf-8');
                    }
                });
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // Set default headers
            const headers = {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            };
            
            // Determine content type with proper MIME type and charset
            let finalContentType = contentType;
            
            // Special handling for JavaScript files
            if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
                // For all JavaScript files, use application/javascript
                finalContentType = 'application/javascript';
                
                // For admin scripts, ensure UTF-8 encoding
                if (parsedUrl.pathname.includes('/js/admin/')) {
                    finalContentType += '; charset=utf-8';
                }
            }
            
            // Add charset for text-based files if not already set
            const charset = CHARSET_OVERRIDES[ext];
            if (charset && !finalContentType.includes('charset=')) {
                finalContentType = `${finalContentType}; charset=${charset}`;
            }
            
            // Set the final content type
            headers['Content-Type'] = finalContentType;
            
            res.writeHead(200, headers);
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
