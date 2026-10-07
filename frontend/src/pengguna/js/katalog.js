let allBooks = [];
let filteredBooks = [];
let currentPage = 1;
const booksPerPage = 12;

document.addEventListener('DOMContentLoaded', async () => {
  renderNav('katalog');
  renderFooter();
  await loadFilters();
  await loadBooks();
  await fetchAndRenderNotifications();
  
  document.getElementById('search-input').addEventListener('input', debounce(applyFilters, 300));
  document.getElementById('filter-kategori').addEventListener('change', applyFilters);
  document.getElementById('filter-mapel').addEventListener('change', applyFilters);
  document.getElementById('filter-kelas').addEventListener('change', applyFilters);
  document.getElementById('filter-sort').addEventListener('change', applyFilters);
});

async function loadFilters() {
  const [resKat, resMapel] = await Promise.all([
    fetchUserAPI('/kategori-buku'),
    fetchUserAPI('/mata-pelajaran')
  ]);
  
  if (resKat?.success) {
    const filterKat = document.getElementById('filter-kategori');
    resKat.data.forEach(k => {
      filterKat.innerHTML += `<option value="${k.id}">${k.nama}</option>`;
    });
  }
  
  if (resMapel?.success) {
    const filterMapel = document.getElementById('filter-mapel');
    resMapel.data.forEach(m => {
      filterMapel.innerHTML += `<option value="${m.id}">${m.nama}</option>`;
    });
  }
}

async function loadBooks() {
  const res = await fetchUserAPI('/buku');
  
  if (res?.success) {
    allBooks = res.data || [];
    filteredBooks = [...allBooks];
    applyFilters();
  } else {
    document.getElementById('catalog-grid').innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <span class="material-symbols-outlined">error</span>
        <h3>Gagal memuat katalog</h3>
        <p>Terjadi kesalahan saat memuat data buku</p>
      </div>
    `;
  }
}

function applyFilters() {
  const keyword = document.getElementById('search-input').value.toLowerCase();
  const kategoriId = document.getElementById('filter-kategori').value;
  const mapelId = document.getElementById('filter-mapel').value;
  const kelas = document.getElementById('filter-kelas').value;
  const sort = document.getElementById('filter-sort').value;
  
  filteredBooks = allBooks.filter(book => {
    const matchKeyword = !keyword || 
      (book.judul && book.judul.toLowerCase().includes(keyword)) ||
      (book.penulis && book.penulis.toLowerCase().includes(keyword));
    
    const matchKategori = !kategoriId || String(book.id_kategori || '') === String(kategoriId);
    const matchMapel = !mapelId || String(book.id_mata_pelajaran || '') === String(mapelId);
    const matchKelas = !kelas || book.tingkat_kelas === kelas;
    
    return matchKeyword && matchKategori && matchMapel && matchKelas;
  });
  
  filteredBooks.sort((a, b) => {
    switch(sort) {
      case 'title-desc':
        return (b.judul || '').localeCompare(a.judul || '');
      case 'year-newest':
        return (b.tahun_terbit || 0) - (a.tahun_terbit || 0);
      case 'year-oldest':
        return (a.tahun_terbit || 0) - (b.tahun_terbit || 0);
      default:
        return (a.judul || '').localeCompare(b.judul || '');
    }
  });
  
  currentPage = 1;
  renderBooks();
  updateBookCount();
}

function renderBooks() {
  const grid = document.getElementById('catalog-grid');
  const startIdx = (currentPage - 1) * booksPerPage;
  const endIdx = startIdx + booksPerPage;
  const booksToShow = filteredBooks.slice(startIdx, endIdx);
  
  if (booksToShow.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined">search_off</span>
        <h3>Tidak ada buku ditemukan</h3>
        <p>Coba ubah filter pencarian Anda</p>
      </div>
    `;
    document.getElementById('pagination').innerHTML = '';
    return;
  }
  
  grid.innerHTML = booksToShow.map(book => {
    const coverHtml = book.cover_url 
      ? `<img src="${book.cover_url}" alt="${book.judul}">` 
      : `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #1e293b; color: #334155;"><span class="material-symbols-outlined" style="font-size: 48px;">menu_book</span></div>`;
    
    return `
      <div class="book-card">
        <a href="detail.html?id=${book.id}&from=katalog" class="book-cover">
          ${coverHtml}
        </a>
        <div class="book-category">${book.nama_kategori || 'Umum'}</div>
        <h3 class="book-title">${book.judul}</h3>
        <div class="book-meta">${book.penerbit || 'Penerbit tidak tercantum'} • ${book.tahun_terbit || '-'}</div>
        <div class="book-actions">
          <button class="btn btn-read" onclick="readBook(${book.id}, '${book.pdf_url || ''}')">
            <span class="material-symbols-outlined">menu_book</span>
            <span>Baca Buku</span>
          </button>
          <button class="btn btn-download" onclick="downloadBook(${book.id}, '${String(book.judul).replace(/'/g, "\\'")}', '${book.pdf_url || ''}')">
            <span class="material-symbols-outlined">download</span>
            <span>Download Buku</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  renderPagination();
}

function renderPagination() {
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  const pagination = document.getElementById('pagination');
  
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  
  let html = `<span class="pagination-info">Halaman ${currentPage} dari ${totalPages}</span>`;
  
  html += `<button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
    <span class="material-symbols-outlined">chevron_left</span>
  </button>`;
  
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span style="color: #64748b; padding: 0 4px;">...</span>`;
    }
  }
  
  html += `<button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
    <span class="material-symbols-outlined">chevron_right</span>
  </button>`;
  
  pagination.innerHTML = html;
}

function changePage(page) {
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderBooks();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateBookCount() {
  document.getElementById('book-count').textContent = `${filteredBooks.length} Buku`;
}

function resetFilters() {
  document.getElementById('search-input').value = '';
  document.getElementById('filter-kategori').value = '';
  document.getElementById('filter-mapel').value = '';
  document.getElementById('filter-kelas').value = '';
  document.getElementById('filter-sort').value = 'title-asc';
  applyFilters();
}

function readBook(id, pdfUrl) {
  if (!pdfUrl) {
    showUserToast('E-book belum tersedia', 'error');
    return;
  }
  recordRead(id);
  window.open(pdfUrl, '_blank');
}

async function downloadBook(id, title, pdfUrl) {
  if (!pdfUrl) {
    showUserToast('E-book belum tersedia untuk diunduh', 'error');
    return;
  }
  
  try {
    showUserToast('Memulai unduhan...', 'info');
    const response = await fetch(pdfUrl);
    if (!response.ok) throw new Error('Gagal mengunduh');
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    
    recordRead(id);
    showUserToast(`Download "${title}" berhasil`, 'success');
  } catch (error) {
    showUserToast('Gagal mengunduh buku', 'error');
  }
}

function recordRead(id) {
  fetchUserAPI('/riwayat-baca', {
    method: 'POST',
    body: JSON.stringify({ id_buku: id })
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
