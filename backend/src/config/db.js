const mongoose = require('mongoose');
const dns = require('dns');

// Configure public DNS servers to resolve MongoDB Atlas SRV records
// across mobile hotspots and local ISPs that block SRV queries
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore if custom environment restricts setting DNS
}

// Helper to safely build a MongoDB URI from components
function buildMongoUriFromEnv() {
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASS;
  const hosts = process.env.MONGO_HOSTS; // comma separated hosts with ports
  const dbName = process.env.MONGO_DB || 'unifind_lost_and_found';
  const params = process.env.MONGO_PARAMS || 'ssl=true&replicaSet=atlas-l7w4i1-shard-0&authSource=admin&appName=Cluster1';

  if (!user || !pass || !hosts) return null;

  const encodedPass = encodeURIComponent(pass);
  return `mongodb://${user}:${encodedPass}@${hosts}/${dbName}?${params}`;
}

const connectDB = async () => {
  try {
    // Priority: explicit MONGODB_URI, then built-from-components, then local fallback
    let mongoURI = process.env.MONGODB_URI || buildMongoUriFromEnv() || 'mongodb://127.0.0.1:27017/unifind_lost_and_found';

    // Sanitize for logging (remove credentials)
    const safeLog = mongoURI.replace(/:\/\/.*?:.*?@/, '://<redacted>:<redacted>@');

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`[MongoDB] Connected to database host: ${conn.connection.host}`);
    console.log(`[MongoDB] Using URI: ${safeLog}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error] ${error.message}`);
    if (error.message && /auth/i.test(error.message)) {
      console.error('[MongoDB] Authentication failed — check MONGO_USER / MONGO_PASS, authSource, and Atlas Network Access IP whitelist.');
    }
    process.exit(1);
  }
};

module.exports = connectDB;
