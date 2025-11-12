require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// ✅ Trust Railway proxy (fixes rate-limit + X-Forwarded-For issues)
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

// ========== HEALTH CHECK (MUST BE FIRST!) ==========
// ✅ Railway health check endpoint - responds immediately, no DB needed
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is alive 🚀' });
});

// ✅ For verifying Railway deployment
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

console.log('🚀 Starting backend...');
console.log('📡 Mongo URI:', process.env.MONGO_URI ? 'Found ✅' : 'Missing ❌');
console.log('🌍 Port:', PORT);

// ✅ START SERVER FIRST (so Railway healthcheck can reach it)
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Listening on: http://0.0.0.0:${PORT}`);
});

// ✅ THEN connect to MongoDB in background (won't block server startup)
mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('✅ Connected to MongoDB');
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        // Don't exit - server can still respond to healthchecks
    });

// ✅ Graceful shutdown for Railway
process.on('SIGTERM', () => {
    console.log('⚠️ SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        mongoose.connection.close(false, () => {
            console.log('✅ MongoDB closed');
            process.exit(0);
        });
    });
});