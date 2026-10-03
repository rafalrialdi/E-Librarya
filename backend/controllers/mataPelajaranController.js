const pool = require('../config/database');

const getAllMataPelajaran = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM mata_pelajaran ORDER BY nama');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const createMataPelajaran = async (req, res) => {
  try {
    const { nama, kelompok, kode, tingkat_kelas } = req.body;
    if (!nama) return res.status(400).json({ success: false, message: 'Nama wajib diisi' });

    const [result] = await pool.query(
      'INSERT INTO mata_pelajaran (nama, kelompok, kode, tingkat_kelas) VALUES (?, ?, ?, ?)',
      [nama, kelompok || null, kode || null, tingkat_kelas || null]
    );
    res.status(201).json({ success: true, message: 'Mata pelajaran berhasil dibuat', data: { id: result.insertId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const updateMataPelajaran = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, kelompok, kode, tingkat_kelas } = req.body;
    if (!nama) return res.status(400).json({ success: false, message: 'Nama wajib diisi' });

    const [existing] = await pool.query('SELECT id FROM mata_pelajaran WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Mata pelajaran tidak ditemukan' });

    await pool.query(
      'UPDATE mata_pelajaran SET nama = ?, kelompok = ?, kode = ?, tingkat_kelas = ? WHERE id = ?',
      [nama, kelompok || null, kode || null, tingkat_kelas || null, id]
    );
    res.json({ success: true, message: 'Mata pelajaran berhasil diupdate' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const deleteMataPelajaran = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id FROM mata_pelajaran WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Mata pelajaran tidak ditemukan' });

    await pool.query('DELETE FROM mata_pelajaran WHERE id = ?', [id]);
    res.json({ success: true, message: 'Mata pelajaran berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

module.exports = { getAllMataPelajaran, createMataPelajaran, updateMataPelajaran, deleteMataPelajaran };