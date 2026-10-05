document.addEventListener('DOMContentLoaded', async () => {
  renderNav('peminjaman');
  renderFooter();
  await loadPeminjaman();
});

async function loadPeminjaman() {
  const res = await fetchUserAPI('/peminjaman/saya');
  
  if (res?.success && res.data?.length > 0) {
    renderPeminjaman(res.data);
  }
}

function renderPeminjaman(loans) {
  const list = document.getElementById('loan-list');
  list.innerHTML = loans.map(loan => `
    <div style="background: #1a232e; border: 1px solid #2d3f52; border-radius: 12px; padding: 16px; margin-bottom: 16px; display: flex; gap: 16px;">
      <img src="${coverUrl(loan.cover_url)}" alt="${loan.judul_buku}" style="width: 80px; height: 106px; object-fit: cover; border-radius: 8px;">
      <div style="flex: 1;">
        ${statusBadge(loan.status)}
        <h3 style="margin: 8px 0; font-size: 16px; color: #f8fafc;">${loan.judul_buku}</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 12px; color: #94a3b8;">
          <div><strong>Tgl Pinjam:</strong> ${formatUserDate(loan.tgl_pinjam)}</div>
          <div><strong>Jatuh Tempo:</strong> ${formatUserDate(loan.tgl_jatuh_tempo)}</div>
        </div>
      </div>
    </div>
  `).join('');
}
