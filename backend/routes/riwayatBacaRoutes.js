const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { addRiwayatBaca, getRiwayatBacaSaya } = require('../controllers/riwayatBacaController');

router.get('/saya', verifyToken, getRiwayatBacaSaya);
router.post('/', verifyToken, addRiwayatBaca);

module.exports = router;