const fs = require('fs');

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

function createDataFile(name, dir = '/api/data', path = `${dir}/${name}`) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
    return 1;
}

module.exports = createDataFile;