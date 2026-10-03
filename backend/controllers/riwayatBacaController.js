const pool = require('../config/database');

const getRiwayatBacaSaya = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const [rows] = await pool.query(`
      SELECT rb.*, b.judul, b.penulis, b.cover_url
      FROM riwayat_baca rb
      JOIN buku b ON rb.id_buku = b.id
      WHERE rb.id_pengguna = ?
      ORDER BY rb.tgl_baca DESC
    `, [id_pengguna]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const addRiwayatBaca = async (req, res) => {
  try {
    const { id_buku } = req.body;
    const id_pengguna = req.user.id;

    if (!id_buku) return res.status(400).json({ success: false, message: 'ID buku wajib diisi' });

    const [buku] = await pool.query('SELECT id FROM buku WHERE id = ?', [id_buku]);
    if (buku.length === 0) return res.status(404).json({ success: false, message: 'Buku tidak ditemukan' });

    await pool.query(
      'INSERT INTO riwayat_baca (id_pengguna, id_buku) VALUES (?, ?)',
      [id_pengguna, id_buku]
    );

    res.status(201).json({ success: true, message: 'Riwayat baca berhasil ditambahkan' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

module.exports = { getRiwayatBacaSaya, addRiwayatBaca };