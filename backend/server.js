const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const itemRoutes = require('./src/routes/itemRoutes');
const claimRoutes = require('./src/routes/claimRoutes');
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');

const app = express();

// Connect to Database
connectDB();

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Serve uploaded static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint (for Render / Railway monitoring)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'UniFind - Campus Lost & Found API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[UniFind Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
