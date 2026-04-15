const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'FANTASYNG Backend API is running 🚀',
    status: 'success',
    database: 'Connected'
  });
});

// TODO: Add routes - Phase 3+

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
