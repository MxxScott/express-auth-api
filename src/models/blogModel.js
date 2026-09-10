    const mongoose = require('mongoose')

const postSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: false
    },
    category: {
        type: String,
        required: false
    },
    tags: {
        type: [String],
        required: false
    }

},
{
    timestamps: true
})
module.exports = mongoose.model("Post", postSchema)