const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    res.json({
      status: 'success',
      data: {
        server: {
          status: 'running',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        },
        database: {
          status: dbStatus[dbState],
          connected: dbState === 1
        }
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error performing health check'
    });
  }
});

module.exports = router; 