const path = require('path')

const sendPage = (res, page) => {
    res.sendFile(path.join(__dirname, '..', page))
}

const home = (req, res) => {
    sendPage(res, 'index.html')
}

const blog = (req, res) => {
    sendPage(res, 'blog.html')
}

const login = (req, res) => {
    sendPage(res, 'login.html')
}

const profile = (req, res) => {
    sendPage(res, 'profile.html')
}

// The page itself is public, the /admin/* API routes are what enforce the role
const admin = (req, res) => {
    sendPage(res, 'admin.html')
}

const favicon = (req, res) => {
    sendPage(res, 'favicon.svg')
}

module.exports = { home, login, profile, admin, blog, favicon }