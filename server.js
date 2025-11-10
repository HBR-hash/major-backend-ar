require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(express.json());
app.use(helmet());
app.use(cors({ origin: '*' })); // Allow all origins during testing

// Basic rate limiter (to prevent abuse)
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30 // limit to 30 requests per minute per IP
});
app.use(limiter);

// ✅ Default route for testing (important for Railway)
app.get('/', (req, res) => {
    res.json({ message: 'Backend live and working! 🚀' });
});

// ✅ Main API route
app.use('/api/auth', authRoutes);

// Port
const PORT = process.env.PORT || 5000;

// ✅ Database connection and server start
async function start() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error('MONGO_URI missing in env');

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB');

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

start();