require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware setup
app.use(express.json());
app.use(helmet());

// CORS configuration (allow all during testing)
app.use(cors({
    origin: '*'
}));

// Basic rate limiter
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30 // limit to 30 requests per minute per IP
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);

// Root route (for testing)
app.get('/', (req, res) => {
    res.json({ message: 'Backend running successfully 🚀' });
});

// Get port (Railway provides PORT automatically)
const PORT = process.env.PORT || 8080;

async function start() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error('❌ MONGO_URI missing in .env or Railway variables');

        // Connect to MongoDB
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB');

        // Bind to 0.0.0.0 (required for Railway and other hosts)
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });

    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

start();