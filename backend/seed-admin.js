const pool = require('./config/database');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const conn = await pool.getConnection();
    await conn.query(
      'INSERT INTO pengguna (nama, identifier, password, role) VALUES (?, ?, ?, ?)',
      ['Administrator', 'admin001', hashedPassword, 'admin']
    );
    conn.release();
    
    console.log('Admin user berhasil dibuat. NIP: admin001, Password: admin123');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

seedAdmin();