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
    const { nama, identifier, password, current_password, role, email, id_kelas, status_aktif } = req.body;

    const [existing] = await pool.query('SELECT id, password FROM pengguna WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    if (password) {
      if (!current_password) {
        return res.status(400).json({ success: false, message: 'Kata sandi lama wajib diisi' });
      }
      if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return res.status(400).json({ success: false, message: 'Kata sandi baru minimal 8 karakter dan harus mengandung huruf serta angka' });
      }
      const validPassword = await bcrypt.compare(current_password, existing[0].password);
      if (!validPassword) {
        return res.status(400).json({ success: false, message: 'Kata sandi lama tidak sesuai' });
      }
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

// GET profil pribadi (untuk user yang login)
const getProfilSaya = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.nama, p.identifier, p.role, p.email,
             p.foto_url, p.status_aktif, p.id_kelas,
             k.nama as nama_kelas
      FROM pengguna p
      LEFT JOIN kategori_kelas k ON p.id_kelas = k.id
      WHERE p.id = ?
    `, [req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profil tidak ditemukan' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// PUT profil pribadi (update nama/email/password)
const updateProfilSaya = async (req, res) => {
  try {
    const { nama, email, password, current_password } = req.body;

    if (password) {
      if (!current_password) {
        return res.status(400).json({ success: false, message: 'Kata sandi lama wajib diisi' });
      }
      if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return res.status(400).json({ success: false, message: 'Kata sandi baru minimal 8 karakter dan harus mengandung huruf serta angka' });
      }
      const [existing] = await pool.query('SELECT id, password FROM pengguna WHERE id = ?', [req.user.id]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
      }
      const validPassword = await bcrypt.compare(current_password, existing[0].password);
      if (!validPassword) {
        return res.status(400).json({ success: false, message: 'Kata sandi lama tidak sesuai' });
      }
    }

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query('UPDATE pengguna SET nama=?, email=?, password=? WHERE id=?', [nama, email, hashedPassword, req.user.id]);
    } else {
      await pool.query('UPDATE pengguna SET nama=?, email=? WHERE id=?', [nama, email, req.user.id]);
    }
    res.json({ success: true, message: 'Profil berhasil diperbarui' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

module.exports = { getAllPengguna, getPenggunaById, createPengguna, updatePengguna, deletePengguna, getProfilSaya, updateProfilSaya };
