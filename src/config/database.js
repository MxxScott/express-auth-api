const mongoose = require('mongoose')

const connectDB = async (uri) => {
    try {
        await mongoose.connect(uri);
        console.log('MONGODB Connection Successful!')
        return 1
    } catch (error) {
        console.log('MONGODB Connection Failed!', error)
        return 0
    }
}

module.exports = connectDB