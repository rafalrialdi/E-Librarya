const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const {
  getAllMataPelajaran,
  createMataPelajaran,
  updateMataPelajaran,
  deleteMataPelajaran
} = require('../controllers/mataPelajaranController');

router.get('/', verifyToken, getAllMataPelajaran);
router.post('/', verifyToken, verifyAdmin, createMataPelajaran);
router.put('/:id', verifyToken, verifyAdmin, updateMataPelajaran);
router.delete('/:id', verifyToken, verifyAdmin, deleteMataPelajaran);

module.exports = router;