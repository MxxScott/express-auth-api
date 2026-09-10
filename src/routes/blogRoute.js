const express = require('express')
const { createPost, fetchPost, getPostByID, editPost, deletePost } = require('../controllers/blogController')
const upload = require('../utils/upload')
const { auth } = require('../middleware/authMiddleware')

// Creating a Route
const route = express.Router()

// Create one blog post from the JSON request body.
route.post('/', auth, upload.single('image'), createPost)

// Fetch the Posts in our database and sort according to date created at
route.get('/', fetchPost)

// Get by Id
route.get('/:id', getPostByID)

// Update the fields provided in the request body.
route.patch('/:id', auth, editPost)

// Delete one blog post by its ID.
route.delete('/:id', auth, deletePost)

module.exports = route