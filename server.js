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
app.use(cors({ origin: '*' }));

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30
});
app.use(limiter);

// ✅ Simple health route for Railway check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Backend running 🚀' });
});

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 8080;

async function start() {
    console.log('🚀 Starting backend...');
    console.log('📡 Using Mongo URI:', process.env.MONGO_URI ? 'Found ✅' : 'Missing ❌');
    console.log('🌍 Port:', PORT);

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err.message);
    }
}

start();