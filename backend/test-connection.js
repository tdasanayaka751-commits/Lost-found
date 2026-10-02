require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set in .env');
  process.exit(1);
}

console.log('[Test] Connecting to MongoDB...');

mongoose.connect(uri)
  .then(() => {
    console.log('[Test] MongoDB connection successful');
    return mongoose.connection.close();
  })
  .then(() => {
    console.log('[Test] Connection closed');
    process.exit(0);
  })
  .catch(err => {
    console.error('[Test] MongoDB connection error:', err.message || err);
    process.exit(1);
  });
