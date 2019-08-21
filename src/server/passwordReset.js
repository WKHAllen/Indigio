const nodemailer = require('nodemailer');
const fs = require('fs');
const database = require('./database');
try {
    const loginInfo = require('./loginInfo');
    var indigioEmail = loginInfo.email;
    var indigioPassword = loginInfo.password;
} catch (err) {
    var indigioEmail = process.env.EMAIL_ADDRESS;
    var indigioPassword = process.env.EMAIL_PASSWORD;
}

const emailBodyFile = 'passwordReset.html';

function sendEmail(email, resetURL) {
    fs.readFile(emailBodyFile, {encoding: 'utf-8'}, (err, data) => {
        if (err) throw err;
        var transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            auth: {
                user: indigioEmail,
                pass: indigioPassword
            }
        });
        var mailOptions = {
            from: loginInfo.email,
            to: email,
            subject: 'Indigio Password Reset',
            html: data.replace('{}', resetURL),
            text: `
                Indigio Password Reset\n
                To reset your password, please click on the following link and you will be taken to a page that will ask for your new password.\n
                ${resetURL}\n
                If you did not request to change your password, please disregard this email, and your password will not be changed.\n
                Sincerely,
                The Indigio Dev Team
            `
        }
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) throw err;
        });
    });
}

function passwordReset(email, hostname) {
    database.newPasswordResetID(email, (resetID) => {
        var params = new URLSearchParams();
        params.set('resetID', resetID);
        sendEmail(email, hostname + '/password-reset/?' + params.toString());
    });
}

module.exports = {
    'passwordReset': passwordReset
}
