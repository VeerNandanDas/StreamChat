// utils/sendEmail.js
import nodemailer from "nodemailer"

export const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    secure: false,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.MAILTRAP_MAIL, 
    to,
    subject,
    text,
    html,
  };


  await transporter.sendMail(mailOptions);
};


