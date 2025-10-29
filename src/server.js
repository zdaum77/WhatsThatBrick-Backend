require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 4000;
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error('Error: MONGO_URL is not defined in .env file');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGO_URL)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});