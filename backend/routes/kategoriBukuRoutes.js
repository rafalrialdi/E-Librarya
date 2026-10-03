const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const {
  getAllKategoriBuku,
  createKategoriBuku,
  updateKategoriBuku,
  deleteKategoriBuku
} = require('../controllers/kategoriBukuController');

router.get('/', verifyToken, getAllKategoriBuku);
router.post('/', verifyToken, verifyAdmin, createKategoriBuku);
router.put('/:id', verifyToken, verifyAdmin, updateKategoriBuku);
router.delete('/:id', verifyToken, verifyAdmin, deleteKategoriBuku);

module.exports = router;