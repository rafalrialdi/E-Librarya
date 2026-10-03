const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const {
  getAllPengguna,
  getPenggunaById,
  createPengguna,
  updatePengguna,
  deletePengguna
} = require('../controllers/penggunaController');

router.get('/', verifyToken, verifyAdmin, getAllPengguna);
router.get('/:id', verifyToken, verifyAdmin, getPenggunaById);
router.post('/', verifyToken, verifyAdmin, createPengguna);
router.put('/:id', verifyToken, verifyAdmin, updatePengguna);
router.delete('/:id', verifyToken, verifyAdmin, deletePengguna);

module.exports = router;