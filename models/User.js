const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
    code: String,
    expiresAt: Date,
    used: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true },
    otp: OTPSchema
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);