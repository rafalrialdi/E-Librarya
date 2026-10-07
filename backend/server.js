const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache control 600 detik khusus GET, no-store untuk mutasi
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=600');
  } else {
    res.set('Cache-Control', 'no-store');
  }
  next();
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/pengguna', require('./routes/penggunaRoutes'));
app.use('/api/kategori-buku', require('./routes/kategoriBukuRoutes'));
app.use('/api/kategori-kelas', require('./routes/kategoriKelasRoutes'));
app.use('/api/mata-pelajaran', require('./routes/mataPelajaranRoutes'));
app.use('/api/buku', require('./routes/bukuRoutes'));
app.use('/api/peminjaman', require('./routes/peminjamanRoutes'));
app.use('/api/riwayat-baca', require('./routes/riwayatBacaRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});