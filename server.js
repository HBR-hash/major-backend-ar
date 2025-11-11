require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// ✅ Trust Railway proxy to fix express-rate-limit & 500 errors
app.set('trust proxy', 1);

// ========== MIDDLEWARE ==========
app.use(express.json());
app.use(helmet());
app.use(cors({ origin: '*' }));

// ========== RATE LIMIT ==========
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
});
app.use(limiter);

// ========== HEALTH CHECK ==========
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is alive 🚀' });
});

// ✅ Add a base API route to verify Railway easily
app.get('/api', (req, res) => {
    res.status(200).json({ message: 'API running successfully ✅' });
});

// ========== ROUTES ==========
try {
    const authRoutes = require('./routes/auth');
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes loaded');
} catch (err) {
    console.error('⚠️ Failed to load authRoutes:', err.message);
}

// ========== START SERVER ==========
const PORT = process.env.PORT || 8080;

async function start() {
    console.log('🚀 Starting backend...');
    console.log('📡 Mongo URI:', process.env.MONGO_URI ? 'Found ✅' : 'Missing ❌');
    console.log('🌍 Port:', PORT);

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌐 Listening on: http://0.0.0.0:${PORT}`);
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err.message);
        process.exit(1);
    }
}

start();