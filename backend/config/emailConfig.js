// NOTIFICATION FEATURE — Email configuration setup for sending notifications
const nodemailer = require('nodemailer')
require('dotenv').config()

// NOTIFICATION FEATURE — Configure email transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

module.exports = transporter
