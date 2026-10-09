const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');
const schemeRoutes = require('./routes/schemeRoutes');

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
    service: 'Intelligent Community Resource Chatbot API',
    status: 'online',
    healthCheck: '/health',
    chatEndpoint: '/api/chat',
    usersEndpoint: '/api/users',
    schemesEndpoint: '/api/schemes',
    serviceCentersEndpoint: '/api/service-centers',
  });
});

// Mount routes
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api', schemeRoutes);

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
