const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const User = require('../models/User');
const { generateOTP, expiry } = require('../utils/otp');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY; // or whichever SMS provider
const FAST2SMS_SENDER_ID = process.env.FAST2SMS_SENDER_ID || 'FSTSMS';

// -------------------- REGISTER --------------------
router.post('/register', async(req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!email || !phone || !password) {
            return res.status(400).json({ message: 'Missing fields' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = new User({
            name,
            email,
            phone,
            passwordHash,
        });

        await user.save();
        return res.status(201).json({ message: 'Registered successfully' });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// -------------------- LOGIN --------------------
router.post('/login', async(req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Missing fields' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id, email: user.email },
            JWT_SECRET, { expiresIn: '7d' }
        );

        return res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                phone: user.phone,
                name: user.name,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// -------------------- REQUEST OTP --------------------
router.post('/request-otp', async(req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const code = generateOTP();
        const expiresAt = expiry(5); // OTP valid for 5 minutes

        user.otp = { code, expiresAt, used: false };
        await user.save();

        // Send SMS via Fast2SMS (example)
        if (!FAST2SMS_API_KEY) {
            console.warn('FAST2SMS_API_KEY not set — OTP not sent but stored in DB');
            return res.json({
                message: 'OTP generated (no SMS API key)',
                code, // for testing only
            });
        }

        await axios.post(
            'https://www.fast2sms.com/dev/bulkV2', {
                variables_values: code,
                route: 'otp',
                numbers: user.phone,
            }, {
                headers: {
                    authorization: FAST2SMS_API_KEY,
                    'Content-Type': 'application/json',
                },
            }
        );

        return res.json({ message: 'OTP sent successfully' });
    } catch (err) {
        // 👇 Fixed: no optional chaining issues
        console.error(
            'request-otp error:',
            (err.response && err.response.data) || err.message || err
        );
        return res.status(500).json({ message: 'Server error' });
    }
});

// -------------------- VERIFY OTP --------------------
router.post('/verify-otp', async(req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ message: 'Missing fields' });
        }

        const user = await User.findOne({ email });
        if (!user || !user.otp) {
            return res.status(404).json({ message: 'OTP not found' });
        }

        if (user.otp.used) {
            return res.status(400).json({ message: 'OTP already used' });
        }

        if (new Date() > user.otp.expiresAt) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        if (user.otp.code !== code) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        user.otp.used = true;
        await user.save();

        // Issue token on OTP verification
        const token = jwt.sign({ userId: user._id, email: user.email },
            JWT_SECRET, { expiresIn: '7d' }
        );

        return res.json({ message: 'OTP verified successfully', token });
    } catch (err) {
        console.error(
            'verify-otp error:',
            (err.response && err.response.data) || err.message || err
        );
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;