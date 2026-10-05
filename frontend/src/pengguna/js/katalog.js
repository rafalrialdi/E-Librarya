document.addEventListener('DOMContentLoaded', async () => {
  renderNav('katalog');
  renderFooter();
  const params = new URLSearchParams(location.search);
  document.getElementById('search-book').value = params.get('q') || '';
  await Promise.all([loadCatalog(), loadFilters()]);
  document.getElementById('search-book').addEventListener('input', renderFilteredBooks);
  ['filter-category', 'filter-subject', 'filter-class', 'filter-sort'].forEach(id => document.getElementById(id).addEventListener('change', renderFilteredBooks));
});
let books = [];
async function loadCatalog() { const res = await fetchUserAPI('/buku'); if (res?.success) { books = res.data; renderFilteredBooks(); } else document.getElementById('catalog-grid').innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">cloud_off</span><p>Katalog belum dapat dimuat.</p></div>'; }
async function loadFilters() {
  const [categories, subjects, classes] = await Promise.all([fetchUserAPI('/kategori-buku'), fetchUserAPI('/mata-pelajaran'), fetchUserAPI('/kategori-kelas')]);
  if (categories?.success) document.getElementById('filter-category').innerHTML += categories.data.map(item => `<option value="${item.id}">${item.nama}</option>`).join('');
  if (subjects?.success) document.getElementById('filter-subject').innerHTML += subjects.data.map(item => `<option value="${item.id}">${item.nama}</option>`).join('');
  if (classes?.success) document.getElementById('filter-class').innerHTML += classes.data.map(item => `<option value="${item.id}">${item.nama}</option>`).join('');
}
function renderFilteredBooks() {
  const query = document.getElementById('search-book').value.toLowerCase();
  const category = document.getElementById('filter-category').value;
  const subject = document.getElementById('filter-subject').value;
  const classId = document.getElementById('filter-class').value;
  const sort = document.getElementById('filter-sort').value;
  const filtered = books.filter(book => (!query || `${book.judul} ${book.penulis} ${book.nama_mata_pelajaran}`.toLowerCase().includes(query)) && (!category || String(book.id_kategori) === category) && (!subject || String(book.id_mata_pelajaran) === subject) && (!classId || String(book.id_kelas) === classId));
  filtered.sort((a, b) => sort === 'title-desc' ? b.judul.localeCompare(a.judul) : sort === 'year-newest' ? (b.tahun_terbit || 0) - (a.tahun_terbit || 0) : sort === 'year-oldest' ? (a.tahun_terbit || 0) - (b.tahun_terbit || 0) : a.judul.localeCompare(b.judul));
  document.getElementById('catalog-count').textContent = `Menampilkan ${filtered.length} Buku Tersedia`;
  document.getElementById('catalog-grid').innerHTML = filtered.length ? filtered.map(stitchCatalogCard).join('') : '<div class="empty-state"><span class="material-symbols-outlined">search_off</span><p>Tidak ada buku yang cocok. Coba kata kunci lain.</p></div>';
}
function stitchCatalogCard(book) { return `<article class="catalog-card"><a href="detail.html?id=${book.id}" class="catalog-cover"><img src="${coverUrl(book.cover_url)}" alt="Sampul ${book.judul}"></a><span class="catalog-tag">${book.nama_kategori || 'Koleksi'}</span><h2>${book.judul}</h2><p>${book.penulis || 'Penulis tidak tercantum'}${book.tahun_terbit ? ` • ${book.tahun_terbit}` : ''}</p><div class="stitch-card-actions"><a class="btn btn-primary" href="detail.html?id=${book.id}"><span class="material-symbols-outlined">menu_book</span> Baca Buku</a><button class="btn btn-secondary" onclick="downloadCatalogBook(${book.id})"><span class="material-symbols-outlined">download</span> Download Buku</button></div></article>`; }
async function downloadCatalogBook(id) { const res = await fetchUserAPI(`/buku/${id}`); if (!res?.success || !res.data.pdf_url) { showUserToast('E-book belum tersedia', 'error'); return; } await fetchUserAPI('/riwayat-baca', { method: 'POST', body: JSON.stringify({ id_buku: id }) }); window.open(res.data.pdf_url, '_blank'); }
function resetCatalogFilters() { ['search-book', 'filter-category', 'filter-subject', 'filter-class'].forEach(id => document.getElementById(id).value = ''); document.getElementById('filter-sort').value = 'title-asc'; renderFilteredBooks(); }
