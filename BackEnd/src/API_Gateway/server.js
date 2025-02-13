const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Routes
const userRoutes = require('./src/routes/userRouter');
const productRoutes = require('./src/routes/productRouter');

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});

app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something broke!',
        error: err.message
    });
});

const PORT = process.env.PORT || 5555;
app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
});