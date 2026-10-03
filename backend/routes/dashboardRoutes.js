const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { getDashboardAdmin, getDashboardPengguna } = require('../controllers/dashboardController');

router.get('/admin', verifyToken, verifyAdmin, getDashboardAdmin);
router.get('/pengguna', verifyToken, getDashboardPengguna);

module.exports = router;