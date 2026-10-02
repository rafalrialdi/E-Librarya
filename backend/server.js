const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
require('./config/database'); 
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache control 600 detik
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=600');
  next();
});

// Test route
app.get('/', (req, res) => {
  res.json({ success: true, message: 'E-Library API berjalan' });
});

// Routes (akan ditambah nanti)
// app.use('/api/auth', require('./routes/authRoutes'));

// Handler 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// Handler error global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});