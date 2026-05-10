const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const rootEnvPath = path.resolve(__dirname, '..', '.env');
const localEnvPath = path.resolve(__dirname, '.env');
const exampleEnvPath = path.resolve(__dirname, '..', '.env.example');
let envPath = null;
if (fs.existsSync(rootEnvPath)) {
  envPath = rootEnvPath;
} else if (fs.existsSync(localEnvPath)) {
  envPath = localEnvPath;
} else if (fs.existsSync(exampleEnvPath)) {
  envPath = exampleEnvPath;
  console.warn('No .env file found; loading defaults from .env.example. Copy .env.example to .env for local development.');
}
if (envPath) {
  const dotenvResult = require('dotenv').config({ path: envPath });
  if (dotenvResult.error) {
    console.warn(`Unable to load environment file at ${envPath}:`, dotenvResult.error);
  } else {
    console.log(`Loaded environment from ${envPath}`);
  }
} else {
  console.warn('No .env file found in server/ or repo root; relying on existing environment variables.');
}

const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resume');
const jobRoutes = require('./routes/jobs');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://madhusankamrd_db_user:JwNoFtmR7chUfoOg@cluster0.mq3bbks.mongodb.net/?appName=Cluster0';
if (!process.env.MONGO_URI) {
  console.warn('MONGO_URI is not set. Defaulting to local MongoDB at mongodb://127.0.0.1:27017/job-recommendation.');
}

mongoose.connect(MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/jobs', jobRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;