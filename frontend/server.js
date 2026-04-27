// frontend/server.js - Simple static file server
const express = require('express');
const path = require('path');
const app = express();

// Serve static files
app.use(express.static(__dirname));

// Handle all routes - serve index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Frontend server running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
});