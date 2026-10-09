require('dotenv').config();
const app = require('./app');
const { testConnection, pool } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start Express server
const server = app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 Express server running on http://localhost:${PORT}`);
  console.log(`📡 Health Check URL: http://localhost:${PORT}/health`);
  console.log(`====================================================`);

  // Verify database connection on server start
  try {
    await testConnection();
  } catch (err) {
    console.error('⚠️ [Startup Warning] Database initial ping failed:', err.message);
  }
});

// Graceful shutdown handling
const handleShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await pool.end();
      console.log('Database connection pool closed.');
    } catch (err) {
      console.error('Error while closing database pool:', err.message);
    }
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
