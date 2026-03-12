// Simple wrapper to start server with better error handling
console.log('Starting server...');
console.log('Current directory:', __dirname);
console.log('Node version:', process.version);

try {
    console.log('Loading dependencies...');
    require('express');
    console.log('✓ Express loaded');
    require('cors');
    console.log('✓ CORS loaded');
    require('dotenv');
    console.log('✓ dotenv loaded');
    
    console.log('Starting server.js...');
    require('./server.js');
} catch (error) {
    console.error('ERROR starting server:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
}

