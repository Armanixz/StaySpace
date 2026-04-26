const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const VerificationToken = require('../models/VerificationToken');
const transporter = require('../config/emailConfig');

// Helper: generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Helper: build user response payload
const userPayload = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  token,
});

// Helper: generate a 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 2-STEP VERIFICATION FEATURE — Send verification code to email (without creating user yet)
const sendVerificationCode = async (email, name, registrationData) => {
  const code = generateVerificationCode();
  const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Store verification code and registration data temporarily
  await VerificationToken.findOneAndUpdate(
    { email },
    {
      email,
      verificationCode: code,
      verificationCodeExpiry: expiryTime,
      registrationData,
    },
    { upsert: true, new: true }
  );

  // Email template
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'StaySpace - Email Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome to StaySpace, ${name}!</h2>
          
          <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
            Thank you for signing up. To complete your registration, please verify your email address using the code below:
          </p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; text-align: center; margin: 30px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Your verification code:</p>
            <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 5px;">${code}</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
            This code will expire in <strong>10 minutes</strong>. If you didn't create this account, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
            StaySpace Team<br>
            © 2024 StaySpace. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { code, expiryTime };
  } catch (error) {
    console.error('Email error:', error);
    throw new Error('Failed to send verification code');
  }
};

// @desc    Step 1: Register user and send verification code (NO ACCOUNT CREATED YET)
// @route   POST /api/auth/register
// @access  Public
// 2-STEP VERIFICATION FEATURE — Send code without creating account
const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, phone, role } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // 2-STEP VERIFICATION FEATURE — Send code WITHOUT creating account
    const registrationData = { name, password, phone, role };
    const { code, expiryTime } = await sendVerificationCode(email, name, registrationData);

    res.status(200).json({
      message: 'Verification code sent to email. Complete verification to create your account.',
      email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Step 2: Verify email code
// @desc    Step 2: Verify email code and CREATE ACCOUNT
// @route   POST /api/auth/verify-code
// @access  Public
// 2-STEP VERIFICATION FEATURE — Verify code and create account
const verifyEmailCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required' });
  }

  try {
    // Find verification token
    const verification = await VerificationToken.findOne({ email });
    if (!verification) {
      return res.status(404).json({ message: 'Verification request not found. Please register again.' });
    }

    // Check if code is expired
    if (new Date() > verification.verificationCodeExpiry) {
      await VerificationToken.deleteOne({ email });
      return res.status(400).json({ message: 'Verification code has expired. Please register again.' });
    }

    // Check if code matches
    if (verification.verificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // 2-STEP VERIFICATION FEATURE — NOW create the user account
    const { name, password, phone, role } = verification.registrationData;
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      isVerified: true, // Account is verified immediately
    });

    // Delete verification token
    await VerificationToken.deleteOne({ email });

    // Generate token and return user data
    const token = generateToken(user._id);
    res.json({
      message: 'Email verified successfully! Account created.',
      ...userPayload(user, token),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

// @desc    Resend verification code
// @route   POST /api/auth/resend-code
// @access  Public
// 2-STEP VERIFICATION FEATURE — Resend code
const resendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Find verification token
    const verification = await VerificationToken.findOne({ email });
    if (!verification) {
      return res.status(404).json({ message: 'No pending verification found. Please register again.' });
    }

    // Get registration data
    const { registrationData } = verification;
    const name = registrationData.name;

    // Send new verification code
    const { code, expiryTime } = await sendVerificationCode(email, name, registrationData);

    res.json({
      message: 'New verification code sent to email. It will expire in 10 minutes.',
      email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while resending code' });
  }
};

// @desc    Login user and return token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 2-STEP VERIFICATION FEATURE — Check if user has pending verification
    const pendingVerification = await VerificationToken.findOne({ email });
    
    // If user not in User collection but has pending verification, they need to verify
    if (pendingVerification && !user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email first',
        email: user.email,
        requiresVerification: true,
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json(userPayload(user, generateToken(user._id)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update logged-in user's profile
// @route   PUT /api/auth/profile
// @access  Private
// Arman — allows any logged-in user to update their name, phone, or password
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, phone, password } = req.body;

    if (name && name.trim()) user.name = name.trim();
    if (phone && phone.trim()) user.phone = phone.trim();
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      user.password = password;
    }

    await user.save();
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerUser, verifyEmailCode, resendVerificationCode, loginUser, updateProfile };
