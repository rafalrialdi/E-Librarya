const pool = require('../config/database');

const getAllKategoriBuku = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM kategori_buku ORDER BY nama');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const createKategoriBuku = async (req, res) => {
  try {
    const { nama } = req.body;
    if (!nama) return res.status(400).json({ success: false, message: 'Nama wajib diisi' });

    const [existing] = await pool.query('SELECT id FROM kategori_buku WHERE nama = ?', [nama]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: 'Kategori sudah ada' });

    const [result] = await pool.query('INSERT INTO kategori_buku (nama) VALUES (?)', [nama]);
    res.status(201).json({ success: true, message: 'Kategori berhasil dibuat', data: { id: result.insertId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const updateKategoriBuku = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama } = req.body;
    if (!nama) return res.status(400).json({ success: false, message: 'Nama wajib diisi' });

    const [existing] = await pool.query('SELECT id FROM kategori_buku WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });

    const [dup] = await pool.query('SELECT id FROM kategori_buku WHERE nama = ? AND id != ?', [nama, id]);
    if (dup.length > 0) return res.status(400).json({ success: false, message: 'Nama kategori sudah digunakan' });

    await pool.query('UPDATE kategori_buku SET nama = ? WHERE id = ?', [nama, id]);
    res.json({ success: true, message: 'Kategori berhasil diupdate' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const deleteKategoriBuku = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id FROM kategori_buku WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });

    await pool.query('DELETE FROM kategori_buku WHERE id = ?', [id]);
    res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

module.exports = { getAllKategoriBuku, createKategoriBuku, updateKategoriBuku, deleteKategoriBuku };