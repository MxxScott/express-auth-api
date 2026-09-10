const bcrypt = require('bcryptjs')
const User = require('../models/authModel')
const jwt = require('jsonwebtoken')
const { publicUser, normalizeEmail, validateCredentials, handleError } = require('../utils/userUtils')
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
            html: `
                <!doctype html>
                <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta name="x-apple-disable-message-reformatting">
                    <title>Welcome to Our App</title>
                    <!--[if mso]>
                    <style>table, td, div, p, a { font-family: Arial, sans-serif !important; }</style>
                    <![endif]-->
                </head>
                <body style="margin:0; padding:0; background-color:#f3f6fb; color:#172033; font-family:Arial, Helvetica, sans-serif;">
                    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
                        Your account is ready. Welcome to the community.
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f3f6fb;">
                        <tr>
                            <td align="center" style="padding:40px 16px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px; background-color:#ffffff; border-radius:20px; overflow:hidden;">
                                    <tr>
                                        <td style="padding:34px 40px; background-color:#172554;">
                                            <p style="margin:0; color:#93c5fd; font-size:13px; font-weight:bold; letter-spacing:2px; text-transform:uppercase;">THE TEAM</p>
                                            <h1 style="margin:18px 0 0; color:#ffffff; font-size:34px; line-height:1.15; font-weight:700;">Welcome aboard.</h1>
                                            <p style="margin:14px 0 0; color:#bfdbfe; font-size:16px; line-height:1.6;">A new chapter starts with one small step.</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:40px;">
                                            <p style="margin:0 0 18px; color:#172033; font-size:19px; line-height:1.5;">Hi ${safeName},</p>
                                            <p style="margin:0 0 18px; color:#526079; font-size:16px; line-height:1.7;">
                                                Your account is officially ready. Thanks for choosing to join us - we are genuinely excited to have you here.
                                            </p>
                                            <p style="margin:0 0 28px; color:#526079; font-size:16px; line-height:1.7;">
                                                Everything is set up and waiting for you. Sign in, explore what is possible, and make this space your own.
                                            </p>
                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                <tr>
                                                    <td style="border-radius:10px; background-color:#2563eb;">
                                                        <a href="${process.env.APP_URL || '#'}" style="display:inline-block; padding:15px 24px; color:#ffffff; font-size:15px; font-weight:bold; text-decoration:none;">Explore your account &rarr;</a>
                                                    </td>
                                                </tr>
                                            </table>
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:34px;">
                                                <tr><td style="height:1px; background-color:#e5eaf2; font-size:1px; line-height:1px;">&nbsp;</td></tr>
                                            </table>
                                            <p style="margin:24px 0 0; color:#7b879d; font-size:14px; line-height:1.6;">
                                                If you did not create this account, you can safely ignore this email or contact our support team.
                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:24px 40px; background-color:#f8fafc;">
                                            <p style="margin:0; color:#8a96aa; font-size:12px; line-height:1.6; text-align:center;">
                                                You are receiving this message because an account was created with this email address.<br>
                                                &copy; ${new Date().getFullYear()} The Team. All rights reserved.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>`
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
