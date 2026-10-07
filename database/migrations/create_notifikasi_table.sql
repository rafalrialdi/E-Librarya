-- Migration: Create notifikasi table
-- Description: Tabel untuk menyimpan notifikasi peminjaman (disetujui/ditolak) untuk pengguna
-- Date: 2026-10-07

CREATE TABLE notifikasi (
    id_notifikasi INT AUTO_INCREMENT PRIMARY KEY,
    id_peminjaman INT NOT NULL,
    id_pengguna INT NOT NULL,
    judul_buku VARCHAR(255) NOT NULL,
    status ENUM('disetujui', 'ditolak') NOT NULL,
    catatan_admin TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_peminjaman) REFERENCES peminjaman(id_peminjaman) ON DELETE CASCADE,
    FOREIGN KEY (id_pengguna) REFERENCES pengguna(id_pengguna) ON DELETE CASCADE
);

CREATE INDEX idx_notifikasi_pengguna ON notifikasi(id_pengguna, is_read, created_at);
CREATE INDEX idx_notifikasi_peminjaman ON notifikasi(id_peminjaman);