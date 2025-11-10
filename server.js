require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());
app.use(helmet());

// CORS config: allow your app or all origins during testing
app.use(cors({
    origin: '*' // in production, replace '*' with your frontend URL
}));

// Basic rate limiter (protect OTP route)
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30 // limit to 30 requests per minute per IP
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

async function start() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error('MONGO_URI missing in env');

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

start();