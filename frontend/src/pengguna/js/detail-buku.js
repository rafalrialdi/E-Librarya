document.addEventListener('DOMContentLoaded', async () => {
  renderNav('katalog');
  renderFooter();
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { document.querySelector('.book-detail').innerHTML = '<p>Parameter buku tidak ditemukan.</p>'; return; }
  const res = await fetchUserAPI(`/buku/${id}`);
  if (!res?.success) return;
  const book = res.data;
  document.getElementById('detail-cover').src = coverUrl(book.cover_url);
  document.getElementById('detail-title').textContent = book.judul;
  document.getElementById('detail-author').textContent = book.penulis || 'Tidak diketahui';
  document.getElementById('detail-publisher').textContent = `${book.penerbit || '-'}${book.tahun_terbit ? `, ${book.tahun_terbit}` : ''}`;
  document.getElementById('detail-isbn').textContent = book.isbn || '-';
  document.getElementById('detail-category').textContent = book.nama_kategori || '-';
  document.getElementById('detail-subject').textContent = book.nama_mata_pelajaran || '-';
  document.getElementById('detail-class').textContent = book.nama_kelas || book.tingkat_kelas || '-';
  document.getElementById('detail-stock').textContent = `${book.stok_tersedia || 0} dari ${book.stok_total || 0} tersedia`;
  document.getElementById('detail-desc').textContent = book.deskripsi || 'Deskripsi belum tersedia.';
  document.getElementById('btn-borrow').disabled = !(book.stok_tersedia > 0);
  document.getElementById('btn-borrow').onclick = () => borrowBook(book.id, book.judul);
  document.getElementById('btn-read').innerHTML = book.pdf_url ? '<span class="material-symbols-outlined">menu_book</span> Baca E-Book' : '<span class="material-symbols-outlined">download</span> Unduh PDF';
  document.getElementById('btn-read').onclick = () => downloadBook(book);
});
async function borrowBook(idBuku, title) { const res = await fetchUserAPI('/peminjaman', { method: 'POST', body: JSON.stringify({ id_buku: idBuku }) }); if (res) { showUserToast(res.success ? `Permintaan pinjam "${title}" terkirim` : res.message, res.success ? 'success' : 'error'); if (res.success) setTimeout(() => location.href = 'peminjaman.html', 1500); } }
async function downloadBook(book) { if (!book.pdf_url) { showUserToast('E-book belum tersedia', 'error'); return; } await fetchUserAPI('/riwayat-baca', { method: 'POST', body: JSON.stringify({ id_buku: book.id }) }); showUserToast(`Riwayat baca "${book.judul}" dicatat`, 'success'); if (book.pdf_url.startsWith('http')) window.open(book.pdf_url, '_blank'); else location.href = book.pdf_url; }
