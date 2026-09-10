const bcrypt = require('bcryptjs')
const User = require('../models/authModel')
const jwt = require('jsonwebtoken')
const { publicUser, normalizeEmail, validateCredentials, handleError } = require('../utils/userUtils')
const renderEmail = require('../utils/renderMail')
const sendMail = require('../utils/sendMail')

const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const signToken = (user) => jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
)

// Register User
const register = async (req, res) => {
    try {
        const { name, password, role } = req.body;
        const email = normalizeEmail(req.body.email);

        const invalid = validateCredentials({ name, email, password });
        if (invalid) {
            return res.status(400).json({ message: invalid });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' })
        }

        // Hash Password
        const hashPass = await bcrypt.hash(password, 10)

        // Create User (role is optional, the schema defaults it to 'user')
        const user = await User.create({
            name,
            email,
            password: hashPass,
            ...(role ? { role } : {})
        });

        // Send Welcome Email
        const safeName = escapeHtml(user.name);
        await sendMail({
            to: user.email,
            subject: 'You are officially in - welcome to the next chapter of your journey',
            text: `Hi ${user.name},\n\nYour account is ready. Welcome to the community - we are excited to have you with us.\n\nYou can now sign in and start exploring everything we have built for you.\n\nSee you inside,\nThe Team`,
            html: renderEmail('welcomeEmail.html', {
                safeName: safeName,
                appUrl: process.env.APP_URL || '#',
                year: new Date().getFullYear()
            })
        });

        res.status(201).json({
            message: 'User Created Successfully',
            user: publicUser(user),
            token: signToken(user)
        });
    } catch (error) {
        handleError(res, error, 'register')
    }
}

const login = async (req, res) => {
    try {
        const { password } = req.body;
        const email = normalizeEmail(req.body.email);

        const invalid = validateCredentials({ email, password }, { requireName: false });
        if (invalid) {
            return res.status(400).json({ message: invalid });
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.status(200).json({
            message: 'Login Successful',
            user: publicUser(user),
            token: signToken(user)
        });
    } catch (error) {
        handleError(res, error, 'login')
    }
}

// Current user's own profile
const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user });
    } catch (error) {
        handleError(res, error, 'getUser')
    }
}

// Delete the current user's own account
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'Your account was deleted successfully', user: publicUser(user) });
    } catch (error) {
        handleError(res, error, 'deleteUser')
    }
}

module.exports = { register, login, getUser, deleteUser }
