const pool = require('../config/database');

const getNotifikasi = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { is_read, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE n.id_pengguna = ?';
    const params = [id_pengguna];

    if (is_read !== undefined) {
      whereClause += ' AND n.is_read = ?';
      params.push(is_read === 'true');
    }

    const [rows] = await pool.query(`
      SELECT n.*, pm.status as status_peminjaman
      FROM notifikasi n
      JOIN peminjaman pm ON n.id_peminjaman = pm.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [total] = await pool.query(`
      SELECT COUNT(*) as total FROM notifikasi n ${whereClause}
    `, params);

    res.json({ success: true, data: rows, pagination: { total: total[0].total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM notifikasi WHERE id_pengguna = ? AND is_read = FALSE',
      [id_pengguna]
    );
    res.json({ success: true, count: rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    const { id } = req.params;
    await pool.query(
      'UPDATE notifikasi SET is_read = TRUE WHERE id_notifikasi = ? AND id_pengguna = ?',
      [id, id_pengguna]
    );
    res.json({ success: true, message: 'Notifikasi ditandai dibaca' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const id_pengguna = req.user.id;
    await pool.query(
      'UPDATE notifikasi SET is_read = TRUE WHERE id_pengguna = ? AND is_read = FALSE',
      [id_pengguna]
    );
    res.json({ success: true, message: 'Semua notifikasi ditandai dibaca' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

module.exports = { getNotifikasi, getUnreadCount, markAsRead, markAllAsRead };