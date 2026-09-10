const Post = require('../models/blogModel')
const mongoose = require('mongoose')
const cloudinary = require('../config/cloudinary')

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id)

const createPost = async (req, res) => {
    try {
        let imagePath = null
        if (req.file) {
            const result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`)
            imagePath = result.secure_url
        }
        const post = await Post.create({ ...req.body, image: imagePath })
        res.status(201).json(post)
    } catch (error) {
        console.log('Error creating blog post', error)

        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Title, content, and author are required' })
        }

        res.status(500).json({ error: 'Internal server error' })
    }
}

const fetchPost = async (req, res) => {
    try {
        const posts = await Post.find({}).sort({ createdAt: -1 })
        res.status(200).json(posts)
    } catch (error) {
        console.log('Error fetching blog posts', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

const getPostByID = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ error: 'Invalid post ID' })
        }

        const post = await Post.findById(req.params.id)
        if (!post) {
            return res.status(404).json({ error: 'Post not found' })
        }

        res.status(200).json(post)
    } catch (error) {
        console.log('Error fetching blog post', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

const editPost = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ error: 'Invalid post ID' })
        }

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: 'Update data is required' })
        }

        const post = await Post.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after', runValidators: true }
        )

        if (!post) {
            return res.status(404).json({ error: 'Post not found' })
        }

        res.status(200).json(post)
    } catch (error) {
        console.log('Error updating blog post', error)

        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Invalid post data' })
        }

        res.status(500).json({ error: 'Internal server error' })
    }
}

const deletePost = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ error: 'Invalid post ID' })
        }

        const post = await Post.findByIdAndDelete(req.params.id)

        if (!post) {
            return res.status(404).json({ error: 'Post not found' })
        }

        res.status(200).json({ message: 'Post deleted successfully' })
    } catch (error) {
        console.log('Error deleting blog post', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

module.exports = {createPost, fetchPost, getPostByID, editPost, deletePost}