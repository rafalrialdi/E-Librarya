const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// GET semua pengguna
const getAllPengguna = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.nama, p.identifier, p.role, p.email, 
             p.foto_url, p.status_aktif, p.id_kelas,
             k.nama as nama_kelas
      FROM pengguna p
      LEFT JOIN kategori_kelas k ON p.id_kelas = k.id
      ORDER BY p.role, p.nama
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// GET pengguna by ID
const getPenggunaById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT p.id, p.nama, p.identifier, p.role, p.email,
             p.foto_url, p.status_aktif, p.id_kelas,
             k.nama as nama_kelas
      FROM pengguna p
      LEFT JOIN kategori_kelas k ON p.id_kelas = k.id
      WHERE p.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// POST create pengguna
const createPengguna = async (req, res) => {
  try {
    const { nama, identifier, password, role, email, id_kelas, status_aktif } = req.body;

    if (!nama || !identifier || !password || !role) {
      return res.status(400).json({ success: false, message: 'Nama, identifier, password, dan role wajib diisi' });
    }

    // Cek identifier sudah ada
    const [existing] = await pool.query('SELECT id FROM pengguna WHERE identifier = ?', [identifier]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Identifier sudah digunakan' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO pengguna (nama, identifier, password, role, email, id_kelas, status_aktif) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nama, identifier, hashedPassword, role, email || null, id_kelas || null, status_aktif ?? 1]
    );

    res.status(201).json({ success: true, message: 'Pengguna berhasil dibuat', data: { id: result.insertId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// PUT update pengguna
const updatePengguna = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, identifier, password, role, email, id_kelas, status_aktif } = req.body;

    // Cek pengguna ada
    const [existing] = await pool.query('SELECT id FROM pengguna WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    // Cek identifier sudah dipakai pengguna lain
    if (identifier) {
      const [dupIdentifier] = await pool.query('SELECT id FROM pengguna WHERE identifier = ? AND id != ?', [identifier, id]);
      if (dupIdentifier.length > 0) {
        return res.status(400).json({ success: false, message: 'Identifier sudah digunakan' });
      }
    }

    let updateQuery = 'UPDATE pengguna SET nama=?, identifier=?, role=?, email=?, id_kelas=?, status_aktif=?';
    let params = [nama, identifier, role, email || null, id_kelas || null, status_aktif ?? 1];

    // Update password hanya kalau diisi
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password=?';
      params.push(hashedPassword);
    }

    updateQuery += ' WHERE id=?';
    params.push(id);

    await pool.query(updateQuery, params);

    res.json({ success: true, message: 'Pengguna berhasil diupdate' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// DELETE pengguna
const deletePengguna = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id FROM pengguna WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    await pool.query('DELETE FROM pengguna WHERE id = ?', [id]);

    res.json({ success: true, message: 'Pengguna berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

module.exports = { getAllPengguna, getPenggunaById, createPengguna, updatePengguna, deletePengguna };