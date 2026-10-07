const pool = require('../config/database');

const getAllPeminjaman = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT pm.*, p.nama as nama_pengguna, p.identifier, p.role,
             b.judul as judul_buku, b.cover_url
      FROM peminjaman pm
      JOIN pengguna p ON pm.id_pengguna = p.id
      JOIN buku b ON pm.id_buku = b.id
      ORDER BY pm.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const getPeminjamanById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT pm.*, p.nama as nama_pengguna, p.identifier, p.role,
             b.judul as judul_buku, b.cover_url, b.penulis
      FROM peminjaman pm
      JOIN pengguna p ON pm.id_pengguna = p.id
      JOIN buku b ON pm.id_buku = b.id
      WHERE pm.id = ?
    `, [id]);

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Peminjaman tidak ditemukan' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const getPeminjamanByPengguna = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const [rows] = await pool.query(`
      SELECT pm.*, b.judul as judul_buku, b.cover_url, b.penulis
      FROM peminjaman pm
      JOIN buku b ON pm.id_buku = b.id
      WHERE pm.id_pengguna = ?
      ORDER BY pm.created_at DESC
    `, [id_pengguna]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const createPeminjaman = async (req, res) => {
  try {
    const { id_buku } = req.body;
    const id_pengguna = req.user.id;

    if (!id_buku) return res.status(400).json({ success: false, message: 'ID buku wajib diisi' });

    // Cek buku ada dan stok tersedia
    const [buku] = await pool.query('SELECT * FROM buku WHERE id = ?', [id_buku]);
    if (buku.length === 0) return res.status(404).json({ success: false, message: 'Buku tidak ditemukan' });
    if (buku[0].stok_tersedia <= 0) return res.status(400).json({ success: false, message: 'Stok buku tidak tersedia' });

    // Cek peminjaman aktif
    const [aktif] = await pool.query(
      `SELECT id FROM peminjaman WHERE id_pengguna = ? AND id_buku = ? AND status IN ('menunggu', 'disetujui')`,
      [id_pengguna, id_buku]
    );
    if (aktif.length > 0) return res.status(400).json({ success: false, message: 'Kamu sudah meminjam buku ini' });

    const tgl_pinjam = new Date().toISOString().split('T')[0];
    const tgl_jatuh_tempo = new Date(Date.now() + buku[0].durasi_peminjaman * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [result] = await pool.query(
      'INSERT INTO peminjaman (id_pengguna, id_buku, tgl_pinjam, tgl_jatuh_tempo, status) VALUES (?, ?, ?, ?, ?)',
      [id_pengguna, id_buku, tgl_pinjam, tgl_jatuh_tempo, 'menunggu']
    );

    res.status(201).json({ success: true, message: 'Permintaan peminjaman berhasil dikirim', data: { id: result.insertId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const updateStatusPeminjaman = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, catatan_admin } = req.body;

    const validStatus = ['disetujui', 'ditolak', 'dikembalikan'];
    if (!validStatus.includes(status)) return res.status(400).json({ success: false, message: 'Status tidak valid' });

    const [existing] = await pool.query('SELECT * FROM peminjaman WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Peminjaman tidak ditemukan' });

    const peminjaman = existing[0];
    const oldStatus = peminjaman.status;

    // Update stok buku
    if (status === 'disetujui' && oldStatus === 'menunggu') {
      await pool.query('UPDATE buku SET stok_tersedia = stok_tersedia - 1 WHERE id = ?', [peminjaman.id_buku]);
    }
    if (status === 'dikembalikan' && oldStatus === 'disetujui') {
      await pool.query('UPDATE buku SET stok_tersedia = stok_tersedia + 1 WHERE id = ?', [peminjaman.id_buku]);
    }
    if (status === 'ditolak' && oldStatus === 'menunggu') {
      // Stok tidak berubah karena belum disetujui
    }

    const tgl_kembali = status === 'dikembalikan' ? new Date().toISOString().split('T')[0] : peminjaman.tgl_kembali;

    await pool.query(
      'UPDATE peminjaman SET status = ?, catatan_admin = ?, tgl_kembali = ? WHERE id = ?',
      [status, catatan_admin || null, tgl_kembali, id]
    );

    // Insert notifikasi jika status berubah ke disetujui atau ditolak (dari menunggu)
    if ((status === 'disetujui' || status === 'ditolak') && oldStatus === 'menunggu') {
      const [bukuData] = await pool.query('SELECT judul FROM buku WHERE id = ?', [peminjaman.id_buku]);
      const judulBuku = bukuData.length > 0 ? bukuData[0].judul : 'Buku';
      
      await pool.query(
        `INSERT INTO notifikasi (id_peminjaman, id_pengguna, judul_buku, status, catatan_admin)
         VALUES (?, ?, ?, ?, ?)`,
        [id, peminjaman.id_pengguna, judulBuku, status, catatan_admin || null]
      );
    }

    // Return data for notification trigger
    const [bukuData] = await pool.query('SELECT judul FROM buku WHERE id = ?', [peminjaman.id_buku]);
    const judulBuku = bukuData.length > 0 ? bukuData[0].judul : 'Buku';

    res.json({ 
      success: true, 
      message: `Status peminjaman berhasil diupdate ke ${status}`,
      data: {
        id_peminjaman: id,
        id_pengguna: peminjaman.id_pengguna,
        judul_buku: judulBuku,
        status: status,
        catatan_admin: catatan_admin || null,
        old_status: oldStatus
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

module.exports = { getAllPeminjaman, getPeminjamanById, createPeminjaman, updateStatusPeminjaman, getPeminjamanByPengguna };