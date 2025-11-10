const crypto = require('crypto');

function generateOTP() {
    // 6-digit numeric OTP
    return (Math.floor(100000 + Math.random() * 900000)).toString();
}

function expiry(minutes = 5) {
    return new Date(Date.now() + minutes * 60 * 1000);
}

module.exports = {
    generateOTP,
    expiry
};