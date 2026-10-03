const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const {
  getAllKategoriKelas,
  createKategoriKelas,
  updateKategoriKelas,
  deleteKategoriKelas
} = require('../controllers/kategoriKelasController');

router.get('/', verifyToken, getAllKategoriKelas);
router.post('/', verifyToken, verifyAdmin, createKategoriKelas);
router.put('/:id', verifyToken, verifyAdmin, updateKategoriKelas);
router.delete('/:id', verifyToken, verifyAdmin, deleteKategoriKelas);

module.exports = router;