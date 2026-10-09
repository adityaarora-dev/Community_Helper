const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');

const app = express();

// Enable CORS for frontend requests
app.use(cors());

// Request body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    service: 'Supabase PostgreSQL Backend Service',
    status: 'online',
    healthCheck: '/health',
    apiHealthCheck: '/api/health',
  });
});

// Mount health routes
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route '${req.originalUrl}' not found.`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ [Unhandled Server Error]:', err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

module.exports = app;
