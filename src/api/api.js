const fs = require('fs');
const path = require('path');

const data = {
    "users": [
        {
            "id": 1,
            "name": "John Doe",
            "email": "john.doe@example.com"
        },
        {
            "id": 2,
            "name": "Jane Smith",
            "email": "jane.smith@example.com"
        }
    ]
}

function createDataFile(name, dir = '/api/data', filePath = path.join(dir, name)) {
    fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(filePath)) {
        return false;
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
}

module.exports = createDataFile;