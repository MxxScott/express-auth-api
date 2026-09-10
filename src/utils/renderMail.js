const fs = require('fs');
const path = require('path');

const renderEmail = (filename, data = {}) => {
    // 1. Adjust this path to wherever your HTML templates are stored
    // Example: path.join(__dirname, '../templates', filename)
    const filePath = path.join(__dirname, '..', filename);
    
    // 2. Read template file
    let html = fs.readFileSync(filePath, 'utf8');

    // 3. Safely replace placeholders like {{safeName}} without regex or $ sign bugs
    Object.keys(data).forEach(key => {
        const value = data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
        html = html.split(`{{${key}}}`).join(value);
    });

    return html;
};

module.exports = renderEmail;