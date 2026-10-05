document.addEventListener('DOMContentLoaded', async () => {
  renderNav('dashboard');
  renderFooter();
  const profile = await loadProfileDetails();
  document.getElementById('welcome-name').textContent = profile?.nama || localStorage.getItem('nama') || 'Pembaca';
  const [res, catalog] = await Promise.all([fetchUserAPI('/dashboard/pengguna'), fetchUserAPI('/buku')]);
  if (!res?.success) {
    document.getElementById('latest-books').innerHTML = '<div class="empty-state"><p>Data dashboard belum dapat dimuat.</p></div>';
    return;
  }
  const data = res.data || {};
  renderLoanNotifications(data.peminjaman_saya || []);
  const latestBooks = catalog?.success ? catalog.data.slice(0, 12) : (data.buku_terbaru || []);
  document.getElementById('latest-books').innerHTML = latestBooks.length ? latestBooks.map(stitchBookCard).join('') : '<div class="empty-state"><span class="material-symbols-outlined">menu_book</span><p>Belum ada koleksi terbaru.</p></div>';
  document.getElementById('reading-history').innerHTML = data.riwayat_baca?.length ? data.riwayat_baca.slice(0, 5).map(stitchHistoryCard).join('') : '<div class="empty-state"><span class="material-symbols-outlined">history</span><p>Riwayat baca masih kosong.</p></div>';
  document.getElementById('recent-loans').innerHTML = data.peminjaman_saya?.length ? data.peminjaman_saya.slice(0, 5).map(stitchLoanCard).join('') : '<div class="empty-state"><span class="material-symbols-outlined">assignment</span><p>Belum ada aktivitas peminjaman.</p></div>';
});

function stitchBookCard(book) {
  return `<article class="stitch-book-card"><a class="stitch-cover" href="detail.html?id=${book.id}&from=dashboard"><img src="${coverUrl(book.cover_url)}" alt="Sampul ${book.judul}"></a><div class="stitch-book-info"><h3 title="${book.judul}">${book.judul}</h3><p>${book.penulis || 'Penulis tidak tercantum'}${book.tahun_terbit ? ` • ${book.tahun_terbit}` : ''}</p></div><div class="stitch-card-actions"><a class="btn btn-primary" href="${book.pdf_url || `detail.html?id=${book.id}&from=dashboard`}" target="_blank" onclick="recordDashboardRead(${book.id})"><span class="material-symbols-outlined">menu_book</span> Baca Buku</a><a class="btn btn-secondary" href="${book.pdf_url || '#'}" download="${book.judul}.pdf" onclick="return prepareDashboardDownload(event, ${book.id}, '${String(book.judul).replace(/'/g, "\\'")}', '${book.pdf_url || ''}')"><span class="material-symbols-outlined">download</span> Download Buku</a></div></article>`;
}
function stitchLoanCard(item) {
  return `<article class="stitch-loan-card"><img src="${coverUrl(item.cover_url)}" alt="Sampul ${item.judul_buku}"><div><div>${statusBadge(item.status)}</div><h3>${item.judul_buku}</h3><dl><div><dt>Pinjam:</dt><dd>${formatUserDate(item.tgl_pinjam)}</dd></div><div><dt>Jatuh Tempo:</dt><dd>${formatUserDate(item.tgl_jatuh_tempo)}</dd></div></dl></div></article>`;
}
function stitchHistoryCard(item) {
  return `<article class="stitch-history-card"><a class="stitch-cover" href="detail.html?id=${item.id_buku}&from=dashboard"><img src="${coverUrl(item.cover_url)}" alt="Sampul ${item.judul}"></a><h3 title="${item.judul}">${item.judul}</h3><p><span class="material-symbols-outlined">history</span> Dibaca ${formatUserDate(item.tgl_baca)}</p><div class="stitch-card-actions"><a class="btn btn-primary" href="${item.pdf_url || `detail.html?id=${item.id_buku}&from=dashboard`}" target="_blank" onclick="recordDashboardRead(${item.id_buku})"><span class="material-symbols-outlined">menu_book</span> Baca Buku</a><a class="btn btn-secondary" href="${item.pdf_url || '#'}" download="${item.judul}.pdf" onclick="return prepareDashboardDownload(event, ${item.id_buku}, '${String(item.judul).replace(/'/g, "\\'")}', '${item.pdf_url || ''}')"><span class="material-symbols-outlined">download</span> Download Buku</a></div></article>`;
}
function recordDashboardRead(id) {
  fetchUserAPI('/riwayat-baca', { method: 'POST', body: JSON.stringify({ id_buku: id }) });
}
async function prepareDashboardDownload(event, id, title, pdfUrl) {
  event.preventDefault();
  if (!pdfUrl) { showUserToast('E-book belum tersedia', 'error'); return false; }
  try {
    const response = await fetch(pdfUrl);
    if (!response.ok) throw new Error('PDF gagal diambil');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `${title}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
    recordDashboardRead(id);
    showUserToast(`Download "${title}" dimulai`, 'success');
  } catch (error) {
    showUserToast('PDF tidak dapat diunduh', 'error');
  }
  return false;
}
