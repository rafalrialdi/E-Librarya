const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const {
  getAllPengguna,
  getPenggunaById,
  createPengguna,
  updatePengguna,
  deletePengguna,
  getProfilSaya,
  updateProfilSaya
} = require('../controllers/penggunaController');
const {
  getNotifikasi,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} = require('../controllers/notifikasiController');

router.get('/', verifyToken, verifyAdmin, getAllPengguna);
router.get('/profil/saya', verifyToken, getProfilSaya);

// Notifikasi routes - MUST BE BEFORE /:id to avoid route conflict
router.get('/notifikasi', verifyToken, getNotifikasi);
router.get('/notifikasi/count', verifyToken, getUnreadCount);
router.put('/notifikasi/:id/baca', verifyToken, markAsRead);
router.put('/notifikasi/baca-semua', verifyToken, markAllAsRead);

router.get('/:id', verifyToken, verifyAdmin, getPenggunaById);
router.post('/', verifyToken, verifyAdmin, createPengguna);
router.put('/profil/saya', verifyToken, updateProfilSaya);
router.put('/:id', verifyToken, verifyAdmin, updatePengguna);
router.delete('/:id', verifyToken, verifyAdmin, deletePengguna);

module.exports = router;