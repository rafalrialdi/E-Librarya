const pool = require('../config/database');

const getAllKategoriKelas = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM kategori_kelas ORDER BY tingkat, nama');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const createKategoriKelas = async (req, res) => {
  try {
    const { nama, tingkat, wali_kelas } = req.body;
    if (!nama || !tingkat) return res.status(400).json({ success: false, message: 'Nama dan tingkat wajib diisi' });

    const [existing] = await pool.query('SELECT id FROM kategori_kelas WHERE nama = ?', [nama]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: 'Kelas sudah ada' });

    const [result] = await pool.query(
      'INSERT INTO kategori_kelas (nama, tingkat, wali_kelas) VALUES (?, ?, ?)',
      [nama, tingkat, wali_kelas || null]
    );
    res.status(201).json({ success: true, message: 'Kelas berhasil dibuat', data: { id: result.insertId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const updateKategoriKelas = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, tingkat, wali_kelas } = req.body;
    if (!nama || !tingkat) return res.status(400).json({ success: false, message: 'Nama dan tingkat wajib diisi' });

    const [existing] = await pool.query('SELECT id FROM kategori_kelas WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan' });

    const [dup] = await pool.query('SELECT id FROM kategori_kelas WHERE nama = ? AND id != ?', [nama, id]);
    if (dup.length > 0) return res.status(400).json({ success: false, message: 'Nama kelas sudah digunakan' });

    await pool.query(
      'UPDATE kategori_kelas SET nama = ?, tingkat = ?, wali_kelas = ? WHERE id = ?',
      [nama, tingkat, wali_kelas || null, id]
    );
    res.json({ success: true, message: 'Kelas berhasil diupdate' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const deleteKategoriKelas = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id FROM kategori_kelas WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan' });

    await pool.query('DELETE FROM kategori_kelas WHERE id = ?', [id]);
    res.json({ success: true, message: 'Kelas berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

module.exports = { getAllKategoriKelas, createKategoriKelas, updateKategoriKelas, deleteKategoriKelas };