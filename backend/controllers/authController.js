const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Identifier dan password wajib diisi'
      });
    }

    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT * FROM pengguna WHERE identifier = ?', [identifier]);
    conn.release();

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Identifier atau password salah'
      });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Identifier atau password salah'
      });
    }

    const token = jwt.sign(
      { id: user.id, nama: user.nama, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        id: user.id,
        nama: user.nama,
        role: user.role,
        token: token
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = { login };