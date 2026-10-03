const pool = require('../config/database');

const getDashboardAdmin = async (req, res) => {
  try {
    // Total buku
    const [[{ total_buku }]] = await pool.query('SELECT COUNT(*) as total_buku FROM buku');

    // Total pengguna (siswa + guru)
    const [[{ total_siswa }]] = await pool.query('SELECT COUNT(*) as total_siswa FROM pengguna WHERE role = "siswa"');
    const [[{ total_guru }]] = await pool.query('SELECT COUNT(*) as total_guru FROM pengguna WHERE role = "guru"');

    // Total peminjaman per status
    const [[{ total_menunggu }]] = await pool.query('SELECT COUNT(*) as total_menunggu FROM peminjaman WHERE status = "menunggu"');
    const [[{ total_disetujui }]] = await pool.query('SELECT COUNT(*) as total_disetujui FROM peminjaman WHERE status = "disetujui"');
    const [[{ total_dikembalikan }]] = await pool.query('SELECT COUNT(*) as total_dikembalikan FROM peminjaman WHERE status = "dikembalikan"');
    const [[{ total_ditolak }]] = await pool.query('SELECT COUNT(*) as total_ditolak FROM peminjaman WHERE status = "ditolak"');

    // Peminjaman terbaru
    const [peminjaman_terbaru] = await pool.query(`
      SELECT pm.id, pm.status, pm.tgl_pinjam, pm.tgl_jatuh_tempo,
             p.nama as nama_pengguna, p.role,
             b.judul as judul_buku, b.cover_url
      FROM peminjaman pm
      JOIN pengguna p ON pm.id_pengguna = p.id
      JOIN buku b ON pm.id_buku = b.id
      ORDER BY pm.created_at DESC
      LIMIT 5
    `);

    // Buku terbaru
    const [buku_terbaru] = await pool.query(`
      SELECT id, judul, penulis, cover_url, stok_tersedia, created_at
      FROM buku
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Peminjaman per bulan (6 bulan terakhir)
    const [peminjaman_per_bulan] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as bulan,
             COUNT(*) as jumlah
      FROM peminjaman
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY bulan
      ORDER BY bulan ASC
    `);

    res.json({
      success: true,
      data: {
        statistik: {
          total_buku,
          total_siswa,
          total_guru,
          total_menunggu,
          total_disetujui,
          total_dikembalikan,
          total_ditolak
        },
        peminjaman_terbaru,
        buku_terbaru,
        peminjaman_per_bulan
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const getDashboardPengguna = async (req, res) => {
  try {
    const id_pengguna = req.user.id;

    // Total peminjaman saya
    const [[{ total_peminjaman }]] = await pool.query(
      'SELECT COUNT(*) as total_peminjaman FROM peminjaman WHERE id_pengguna = ?', [id_pengguna]
    );

    // Peminjaman aktif (disetujui)
    const [[{ total_aktif }]] = await pool.query(
      'SELECT COUNT(*) as total_aktif FROM peminjaman WHERE id_pengguna = ? AND status = "disetujui"', [id_pengguna]
    );

    // Total buku dibaca
    const [[{ total_dibaca }]] = await pool.query(
      'SELECT COUNT(*) as total_dibaca FROM riwayat_baca WHERE id_pengguna = ?', [id_pengguna]
    );

    // Peminjaman terbaru saya
    const [peminjaman_saya] = await pool.query(`
      SELECT pm.id, pm.status, pm.tgl_pinjam, pm.tgl_jatuh_tempo,
             b.judul as judul_buku, b.cover_url, b.penulis
      FROM peminjaman pm
      JOIN buku b ON pm.id_buku = b.id
      WHERE pm.id_pengguna = ?
      ORDER BY pm.created_at DESC
      LIMIT 5
    `, [id_pengguna]);

    // Riwayat baca terbaru
    const [riwayat_baca] = await pool.query(`
      SELECT rb.tgl_baca, b.id as id_buku, b.judul, b.penulis, b.cover_url
      FROM riwayat_baca rb
      JOIN buku b ON rb.id_buku = b.id
      WHERE rb.id_pengguna = ?
      ORDER BY rb.tgl_baca DESC
      LIMIT 5
    `, [id_pengguna]);

    // Buku terbaru di katalog
    const [buku_terbaru] = await pool.query(`
      SELECT id, judul, penulis, cover_url, stok_tersedia
      FROM buku
      ORDER BY created_at DESC
      LIMIT 6
    `);

    res.json({
      success: true,
      data: {
        statistik: {
          total_peminjaman,
          total_aktif,
          total_dibaca
        },
        peminjaman_saya,
        riwayat_baca,
        buku_terbaru
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

module.exports = { getDashboardAdmin, getDashboardPengguna };