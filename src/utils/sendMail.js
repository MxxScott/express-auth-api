const transporter = require("../config/mail");

const sendMail = async ({ to, subject, html, text }) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html,
            ...(text ? { text } : {})
        };
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

module.exports = sendMail;