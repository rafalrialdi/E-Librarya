const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const {
  getAllPeminjaman,
  getPeminjamanById,
  createPeminjaman,
  updateStatusPeminjaman,
  getPeminjamanByPengguna
} = require('../controllers/peminjamanController');

router.get('/', verifyToken, verifyAdmin, getAllPeminjaman);
router.get('/saya', verifyToken, getPeminjamanByPengguna);
router.get('/:id', verifyToken, getPeminjamanById);
router.post('/', verifyToken, createPeminjaman);
router.put('/:id/status', verifyToken, verifyAdmin, updateStatusPeminjaman);

module.exports = router;