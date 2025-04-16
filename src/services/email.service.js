const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

const transport = nodemailer.createTransport(config.email.smtp);
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}

const sendEmail = async (to, subject, text) => {
  const msg = { from: config.email.from, to, subject, text };
  await transport.sendMail(msg);
};


const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `http://link-to-app/reset-password?token=${token}`;
  const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};

const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  await sendEmail(to, subject, text);
};

const sendOtpOnEmail = async (to, otp) => {
  const subject = 'Forgot password OTP';
  // replace this url with the link to the email verification page of your front-end app
  const text = `Dear user,
To verify your email, click on this link: ${otp}
If you did not create an account, then ignore this emaotpil.`;
  await sendEmail(to, subject, text);
};

const sendCustomJewelEmail = async ({ to, attachment, data }) => {
  try {
    // Use the data parameter instead of formData
    const { name, email, mobile, type, metal, budget, message, filePath } = data;

    let attachments = [];

    if (attachment && fs.existsSync(attachment.path)) {
      attachments.push({
        filename: attachment.filename,
        path: attachment.path,
        cid: attachment.cid
      });
    }

    // Your email sending logic here
    // For example using nodemailer:
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Custom Jewelry Request Received',
      html: `<p>Thank you ${name} for your custom jewelry request!</p>
                 <p>We've received your details:</p>
                 <ul>
                   <li>Type: ${type}</li>
                   <li>Metal: ${metal}</li>
                   <li>Budget: ${budget}</li>
                   <li>Message: ${message}</li>
                 </ul>
                 ${attachments.length ? `
                  <h3>Your Design:</h3>
                  <img src="cid:${attachment.cid}" style="max-width: 100%; border: 1px solid #eee;">
                  <p>We'll use this as reference for your custom piece.</p>
                ` : ''}
                
                <p>We'll contact you within 24 hours at ${data.mobile}.</p>
              `,
      attachments
    };

    // Send the email using your email transporter
    await transport.sendMail(mailOptions);
    if (attachment) {
      fs.unlink(attachment.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

  } catch (error) {
    console.error('Error sending custom jewel email:', error);
    throw error;
  }
};



module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendOtpOnEmail,
  sendCustomJewelEmail
};
