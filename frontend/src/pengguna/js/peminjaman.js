document.addEventListener('DOMContentLoaded', async () => {
  renderNav('peminjaman');
  renderFooter();
  await loadPeminjaman();
});

async function loadPeminjaman() {
  const res = await fetchUserAPI('/peminjaman/saya');
  const grid = document.getElementById('loan-grid');
  if (!res?.success) {
    grid.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">cloud_off</span><p>Peminjaman tidak dapat dimuat.</p></div>';
    return;
  }
  const loans = res.data;
  if (!loans.length) {
    grid.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">assignment</span><p>Belum ada riwayat peminjaman.</p></div>';
    return;
  }
  const byStatus = { menunggu: [], disetujui: [], ditolak: [], dikembalikan: [] };
  loans.forEach(loan => {
    const arr = byStatus[loan.status] || [];
    arr.push(loan);
    byStatus[loan.status] = arr;
  });

  const sections = [
    { key: 'menunggu', label: 'Permintaan', icon: 'hourglass_empty' },
    { key: 'disetujui', label: 'Aktif', icon: 'book_outlined' },
    { key: 'ditolak', label: 'Ditolak', icon: 'cancel' },
    { key: 'dikembalikan', label: 'Dikembalikan', icon: 'check_circle' }
  ];

  let html = '';
  sections.forEach(({ key, label }) => {
    const items = byStatus[key] || [];
    if (!items.length) return;
    html += `<section><h2>${label} <span class="badge badge-${key}">${items.length}</span></h2><div class="loan-list">`;
    items.forEach(loan => {
      html += `<div class="loan-item">
        <img src="${coverUrl(loan.cover_url)}" alt="">
        <div class="loan-content">
          <h3>${loan.judul_buku}</h3>
          <p class="loan-author">${loan.penulis}</p>
          <div class="loan-meta">
            <span class="material-symbols-outlined">event_available</span><span>Pinjam: ${formatUserDate(loan.tgl_pinjam)}</span>
            <span class="material-symbols-outlined">event_busy</span><span>Tempo: ${formatUserDate(loan.tgl_jatuh_tempo)}</span>
          </div>
          <div class="loan-status">${statusBadge(loan.status)}</div>
          ${loan.catatan_admin ? `<blockquote>${loan.catatan_admin}</blockquote>` : ''}
          ${loan.pdf_url ? `<a class="text-link" href="detail.html?id=${loan.id_buku}"><span class="material-symbols-outlined">menu_book</span> Baca buku</a>` : ''}
        </div>
      </div>`;
    });
    html += '</div></section>';
  });
  grid.innerHTML = html;
}
