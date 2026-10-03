const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const {
  getAllBuku,
  getBukuById,
  createBuku,
  updateBuku,
  deleteBuku
} = require('../controllers/bukuController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', verifyToken, getAllBuku);
router.get('/:id', verifyToken, getBukuById);
router.post('/', verifyToken, verifyAdmin, upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), createBuku);
router.put('/:id', verifyToken, verifyAdmin, upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), updateBuku);
router.delete('/:id', verifyToken, verifyAdmin, deleteBuku);

module.exports = router;