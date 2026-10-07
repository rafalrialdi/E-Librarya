const pool = require('../config/database');
const supabase = require('../config/supabase');

const BUCKET = 'e-library';

const uploadToSupabase = async (file, folder) => {
  const ext = file.originalname.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
  const path = `perpustakaan/${folder}/${fileName}`;

  try {
    const { error, data } = await supabase.storage.from(BUCKET).upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

    if (error) {
      console.error('Supabase upload error:', JSON.stringify(error, null, 2));
      
      // Provide more specific error messages
      if (error.message?.includes('bucket not found') || error.message?.includes('Bucket not found')) {
        throw new Error(`Bucket storage '${BUCKET}' tidak ditemukan. Pastikan bucket sudah dibuat di Supabase Dashboard.`);
      }
      if (error.message?.includes('not authorized') || error.message?.includes('Unauthorized')) {
        throw new Error('Autentikasi Supabase gagal. Periksa SUPABASE_SERVICE_KEY di environment variables.');
      }
      if (error.message?.includes('fetch failed') || error.message?.includes('ECONNREFUSED')) {
        throw new Error('Tidak dapat terhubung ke Supabase Storage. Periksa koneksi internet dan SUPABASE_URL.');
      }
      throw new Error(`Upload gagal: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    
    if (!publicUrlData?.publicUrl) {
      throw new Error('Gagal mendapatkan URL publik file');
    }

    return { url: publicUrlData.publicUrl, path };
  } catch (err) {
    console.error('Upload error:', err.message);
    throw err;
  }
};

const deleteFromSupabase = async (path) => {
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
};

const getAllBuku = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*, 
             kb.nama as nama_kategori,
             mp.nama as nama_mata_pelajaran,
             kk.nama as nama_kelas
      FROM buku b
      LEFT JOIN kategori_buku kb ON b.id_kategori = kb.id
      LEFT JOIN mata_pelajaran mp ON b.id_mata_pelajaran = mp.id
      LEFT JOIN kategori_kelas kk ON b.id_kelas = kk.id
      ORDER BY b.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const getBukuById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT b.*,
             kb.nama as nama_kategori,
             mp.nama as nama_mata_pelajaran,
             kk.nama as nama_kelas
      FROM buku b
      LEFT JOIN kategori_buku kb ON b.id_kategori = kb.id
      LEFT JOIN mata_pelajaran mp ON b.id_mata_pelajaran = mp.id
      LEFT JOIN kategori_kelas kk ON b.id_kelas = kk.id
      WHERE b.id = ?
    `, [id]);

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Buku tidak ditemukan' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const createBuku = async (req, res) => {
  try {
    const { judul, penulis, penerbit, tahun_terbit, isbn, id_kategori, id_mata_pelajaran, tingkat_kelas, id_kelas, stok_total, durasi_peminjaman, deskripsi } = req.body;

    if (!judul || !penulis) return res.status(400).json({ success: false, message: 'Judul dan penulis wajib diisi' });

    let cover_url = null, cover_path = null;
    let pdf_url = null, pdf_path = null;

    if (req.files?.cover) {
      const uploaded = await uploadToSupabase(req.files.cover[0], 'cover');
      cover_url = uploaded.url;
      cover_path = uploaded.path;
    }

    if (req.files?.pdf) {
      const uploaded = await uploadToSupabase(req.files.pdf[0], 'pdf');
      pdf_url = uploaded.url;
      pdf_path = uploaded.path;
    }

    const stok = parseInt(stok_total) || 0;

    const [result] = await pool.query(
      `INSERT INTO buku (judul, penulis, penerbit, tahun_terbit, isbn, id_kategori, id_mata_pelajaran, tingkat_kelas, id_kelas, stok_total, stok_tersedia, durasi_peminjaman, deskripsi, cover_url, cover_path, pdf_url, pdf_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [judul, penulis, penerbit || null, tahun_terbit || null, isbn || null, id_kategori || null, id_mata_pelajaran || null, tingkat_kelas || null, id_kelas || null, stok, stok, durasi_peminjaman || 7, deskripsi || null, cover_url, cover_path, pdf_url, pdf_path]
    );

    res.status(201).json({ success: true, message: 'Buku berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Terjadi kesalahan server' });
  }
};

const updateBuku = async (req, res) => {
  try {
    const { id } = req.params;
    const { judul, penulis, penerbit, tahun_terbit, isbn, id_kategori, id_mata_pelajaran, tingkat_kelas, id_kelas, stok_total, durasi_peminjaman, deskripsi } = req.body;

    const [existing] = await pool.query('SELECT * FROM buku WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Buku tidak ditemukan' });

    const buku = existing[0];

    let cover_url = buku.cover_url, cover_path = buku.cover_path;
    let pdf_url = buku.pdf_url, pdf_path = buku.pdf_path;

    if (req.files?.cover) {
      await deleteFromSupabase(buku.cover_path);
      const uploaded = await uploadToSupabase(req.files.cover[0], 'cover');
      cover_url = uploaded.url;
      cover_path = uploaded.path;
    }

    if (req.files?.pdf) {
      await deleteFromSupabase(buku.pdf_path);
      const uploaded = await uploadToSupabase(req.files.pdf[0], 'pdf');
      pdf_url = uploaded.url;
      pdf_path = uploaded.path;
    }

    const stok = parseInt(stok_total) || buku.stok_total;
    const selisih = stok - buku.stok_total;
    const stok_tersedia = Math.max(0, buku.stok_tersedia + selisih);

    await pool.query(
      `UPDATE buku SET judul=?, penulis=?, penerbit=?, tahun_terbit=?, isbn=?, id_kategori=?, id_mata_pelajaran=?, tingkat_kelas=?, id_kelas=?, stok_total=?, stok_tersedia=?, durasi_peminjaman=?, deskripsi=?, cover_url=?, cover_path=?, pdf_url=?, pdf_path=? WHERE id=?`,
      [judul, penulis, penerbit || null, tahun_terbit || null, isbn || null, id_kategori || null, id_mata_pelajaran || null, tingkat_kelas || null, id_kelas || null, stok, stok_tersedia, durasi_peminjaman || 7, deskripsi || null, cover_url, cover_path, pdf_url, pdf_path, id]
    );

    res.json({ success: true, message: 'Buku berhasil diupdate' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const deleteBuku = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM buku WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Buku tidak ditemukan' });

    const buku = existing[0];

    await deleteFromSupabase(buku.cover_path);
    await deleteFromSupabase(buku.pdf_path);

    await pool.query('DELETE FROM buku WHERE id = ?', [id]);
    res.json({ success: true, message: 'Buku berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

module.exports = { getAllBuku, getBukuById, createBuku, updateBuku, deleteBuku };