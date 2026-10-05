/**
 * E-Library MTs Al-Falah Klender - Peminjaman Controller
 */

let allPeminjaman = [];

document.addEventListener('DOMContentLoaded', () => {
  initSidebar('peminjaman');
  initHeader('Peminjaman Admin', 'SIRKULASI & APPROVAL', 'Kelola request peminjaman guru & siswa, konfirmasi sirkulasi buku fisik, dan riwayat peminjaman madrasah.');
  loadPeminjaman();
});

async function loadPeminjaman() {
  const res = await fetchAPI('/peminjaman');
  if (res && res.success) {
    allPeminjaman = res.data;
    renderAllSections(allPeminjaman);
  } else {
    showToast('Gagal memuat data peminjaman', 'error');
  }
}

function renderAllSections(data) {
  // 1. Seksi Request (Status: Menunggu)
  const listRequest = data.filter(p => p.status === 'menunggu');
  document.getElementById('badge-count-request').innerText = `${listRequest.length} Request`;
  const gridRequest = document.getElementById('grid-request');

  if (listRequest.length === 0) {
    gridRequest.innerHTML = `<p style="color: var(--text-muted); padding: 12px; grid-column: 1 / -1;">Tidak ada permintaan peminjaman baru saat ini.</p>`;
  } else {
    gridRequest.innerHTML = listRequest.map(item => `
      <div class="loan-card">
        <div class="loan-top">
          <img src="${item.cover_url || '../../../assset/logosekolah.jpeg'}" alt="Cover" class="loan-cover">
          <div class="loan-info">
            <div class="loan-title" title="${item.judul_buku}">${item.judul_buku}</div>
            <div class="loan-borrower">Peminjam: <strong>${item.nama_pengguna}</strong> (${item.role.toUpperCase()})</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">NIS/NIP: ${item.identifier}</div>
          </div>
        </div>
        <div class="loan-dates">
          <div class="loan-date-item">
            <label>Tgl Request</label>
            <span>${formatDate(item.created_at)}</span>
          </div>
          <div class="loan-date-item">
            <label>Durasi</label>
            <span>7 Hari</span>
          </div>
        </div>
        <div class="loan-actions">
          <button class="btn btn-success btn-sm" style="flex: 1;" onclick="updateStatus(${item.id}, 'disetujui')">
            <span class="material-symbols-outlined" style="font-size: 16px;">check</span>
            <span>Setujui</span>
          </button>
          <button class="btn btn-danger btn-sm" style="flex: 1;" onclick="updateStatus(${item.id}, 'ditolak')">
            <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
            <span>Tolak</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  // 2. Seksi Peminjaman Aktif (Status: Disetujui, belum dikembalikan)
  // Diurutkan dari tanggal jatuh tempo terdekat
  const listAktif = data.filter(p => p.status === 'disetujui').sort((a, b) => {
    return new Date(a.tgl_jatuh_tempo) - new Date(b.tgl_jatuh_tempo);
  });

  document.getElementById('badge-count-aktif').innerText = `${listAktif.length} Aktif`;
  const gridAktif = document.getElementById('grid-aktif');

  if (listAktif.length === 0) {
    gridAktif.innerHTML = `<p style="color: var(--text-muted); padding: 12px; grid-column: 1 / -1;">Tidak ada peminjaman buku aktif saat ini.</p>`;
  } else {
    gridAktif.innerHTML = listAktif.map(item => `
      <div class="loan-card">
        <div class="loan-top">
          <img src="${item.cover_url || '../../../assset/logosekolah.jpeg'}" alt="Cover" class="loan-cover">
          <div class="loan-info">
            <div class="loan-title" title="${item.judul_buku}">${item.judul_buku}</div>
            <div class="loan-borrower">Peminjam: <strong>${item.nama_pengguna}</strong> (${item.role.toUpperCase()})</div>
            <div style="margin-top: 4px;">
              <span class="badge badge-approved">Sedang Dipinjam</span>
            </div>
          </div>
        </div>
        <div class="loan-dates">
          <div class="loan-date-item">
            <label>Tgl Pinjam</label>
            <span>${formatDate(item.tgl_pinjam)}</span>
          </div>
          <div class="loan-date-item">
            <label>Jatuh Tempo</label>
            <span style="color: var(--primary); font-weight: 700;">${formatDate(item.tgl_jatuh_tempo)}</span>
          </div>
        </div>
        <div class="loan-actions">
          <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="updateStatus(${item.id}, 'dikembalikan')">
            <span class="material-symbols-outlined" style="font-size: 16px;">assignment_return</span>
            <span>Tandai Dikembalikan</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  // 3. Seksi Riwayat (Status: Dikembalikan)
  const listRiwayat = data.filter(p => p.status === 'dikembalikan');
  document.getElementById('badge-count-riwayat').innerText = `${listRiwayat.length} Selesai`;
  const tableRiwayat = document.getElementById('table-riwayat');

  if (listRiwayat.length === 0) {
    tableRiwayat.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">Belum ada riwayat pengembalian buku</td></tr>`;
  } else {
    tableRiwayat.innerHTML = listRiwayat.map((item, idx) => `
      <tr>
        <td style="text-align: center; color: var(--text-muted);">${idx + 1}</td>
        <td>
          <strong style="color: var(--text-primary); font-size: 13px;">${item.nama_pengguna}</strong>
          <div style="font-size: 11px; color: var(--text-secondary);">${item.identifier} (${item.role.toUpperCase()})</div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${item.judul_buku}</div>
        </td>
        <td style="color: var(--text-secondary);">${formatDate(item.tgl_pinjam)}</td>
        <td style="color: var(--text-secondary);">${formatDate(item.tgl_jatuh_tempo)}</td>
        <td style="color: var(--tertiary); font-weight: 600;">${formatDate(item.tgl_kembali)}</td>
        <td style="text-align: center;">
          <span class="badge badge-returned">Dikembalikan</span>
        </td>
      </tr>
    `).join('');
  }
}

function scrollCards(containerId, direction) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.scrollBy({ left: direction * 340, behavior: 'smooth' });
}

async function updateStatus(id, newStatus) {
  const res = await fetchAPI(`/peminjaman/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: newStatus })
  });

  if (res && res.success) {
    let msg = 'Peminjaman berhasil disetujui';
    if (newStatus === 'ditolak') msg = 'Peminjaman ditolak';
    if (newStatus === 'dikembalikan') msg = 'Buku berhasil dikembalikan dan stok diperbarui';

    showToast(msg);
    await loadPeminjaman();
  } else {
    showToast(res ? res.message : 'Gagal memperbarui status', 'error');
  }
}
