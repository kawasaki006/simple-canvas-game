const express = require('express');
const path = require('path');
const app = express();

// Serve static files from public directory
app.use(express.static('public'));

// Serve the src directory for ES modules
app.use('/src', express.static('src'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});