let currentBook = null;

document.addEventListener('DOMContentLoaded', async () => {
  renderNav('');
  renderFooter();
  
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('id');
  const fromPage = urlParams.get('from') || 'katalog';
  
  const btnBack = document.getElementById('btn-back');
  const backText = document.getElementById('back-text');
  
  if (fromPage === 'dashboard') {
    btnBack.href = 'dashboard.html';
    backText.textContent = 'Kembali ke Beranda';
  } else {
    btnBack.href = 'katalog.html';
    backText.textContent = 'Kembali ke Katalog';
  }
  
  if (!bookId) {
    showUserToast('ID buku tidak valid', 'error');
    setTimeout(() => window.location.href = 'dashboard.html', 2000);
    return;
  }
  
  await loadBookDetail(bookId);
});

async function loadBookDetail(id) {
  const res = await fetchUserAPI(`/buku/${id}`);
  
  if (!res?.success) {
    showUserToast('Gagal memuat detail buku', 'error');
    document.getElementById('book-title').textContent = 'Buku tidak ditemukan';
    document.getElementById('book-description').innerHTML = '<p>Data buku tidak dapat dimuat.</p>';
    return;
  }
  
  currentBook = res.data;
  renderBookDetail(currentBook);
}

function renderBookDetail(book) {
  document.title = `${book.judul} — E-Library MTs Al-Falah Klender`;
  
  document.getElementById('book-cover').src = coverUrl(book.cover_url);
  document.getElementById('book-cover').alt = `Sampul ${book.judul}`;
  
  const badges = [];
  if (book.nama_kategori) {
    badges.push(`<span class="detail-badge badge-category">Kategori: ${book.nama_kategori}</span>`);
  }
  if (book.nama_mata_pelajaran) {
    badges.push(`<span class="detail-badge badge-mapel">Mata Pelajaran: ${book.nama_mata_pelajaran}</span>`);
  }
  if (book.tingkat_kelas) {
    badges.push(`<span class="detail-badge badge-class">Kelas: ${book.tingkat_kelas}</span>`);
  }
  document.getElementById('book-badges').innerHTML = badges.join('');
  
  const titleTags = [];
  if (book.nama_kategori) {
    titleTags.push(`<span class="title-tag title-tag-primary">${book.nama_kategori}</span>`);
  }
  if (book.tahun_terbit) {
    titleTags.push(`<span class="title-tag title-tag-secondary">Kurikulum Merdeka ${book.tahun_terbit}</span>`);
  }
  document.getElementById('title-tags').innerHTML = titleTags.join('');
  
  document.getElementById('book-title').textContent = book.judul;
  
  document.getElementById('book-subtitle').textContent = book.deskripsi?.split('\n')[0] || 'Panduan Pembelajaran untuk Madrasah Tsanawiyah';
  
  const infoItems = [];
  
  infoItems.push(`
    <div class="info-item">
      <div class="info-label">Penulis</div>
      <div class="info-value">${book.penulis || '-'}</div>
    </div>
  `);
  
  infoItems.push(`
    <div class="info-item">
      <div class="info-label">Penerbit</div>
      <div class="info-value">${book.penerbit || '-'}</div>
    </div>
  `);
  
  infoItems.push(`
    <div class="info-item">
      <div class="info-label">Tahun Terbit</div>
      <div class="info-value">${book.tahun_terbit ? `${book.tahun_terbit} (Edisi Revisi)` : '-'}</div>
    </div>
  `);
  
  infoItems.push(`
    <div class="info-item">
      <div class="info-label">ISBN</div>
      <div class="info-value">${book.isbn || '-'}</div>
    </div>
  `);
  
  infoItems.push(`
    <div class="info-item">
      <div class="info-label">Tingkat Kelas</div>
      <div class="info-value">${book.tingkat_kelas ? `Kelas ${book.tingkat_kelas}` : 'Semua Tingkat'}</div>
    </div>
  `);
  
  infoItems.push(`
    <div class="info-item">
      <div class="info-label">Mata Pelajaran</div>
      <div class="info-value">${book.nama_mata_pelajaran || 'Tidak Terkait Mapel'}</div>
    </div>
  `);
  
  const stokTersedia = book.stok_tersedia || 0;
  const stokTotal = book.stok_total || 0;
  let stockClass = 'highlight';
  let stockText = `${stokTersedia} Buku Tersedia di Perpustakaan`;
  
  if (stokTersedia === 0) {
    stockClass = 'error';
    stockText = 'Stok Habis (Tidak Tersedia)';
  } else if (stokTersedia <= stokTotal * 0.2) {
    stockClass = 'warning';
    stockText = `${stokTersedia} Buku Tersedia (Stok Terbatas)`;
  }
  
  infoItems.push(`
    <div class="info-item">
      <div class="info-label">Stok Fisik Tersedia</div>
      <div class="info-value ${stockClass}">${stockText}</div>
    </div>
  `);
  
  infoItems.push(`
    <div class="info-item">
      <div class="info-label">Durasi Peminjaman</div>
      <div class="info-value warning">${book.durasi_peminjaman || 7} Hari (Tidak Dapat Diperpanjang)</div>
    </div>
  `);
  
  document.getElementById('book-info-grid').innerHTML = infoItems.join('');
  
  document.getElementById('book-description').innerHTML = book.deskripsi 
    ? `<p>${book.deskripsi.replace(/\n/g, '</p><p>')}</p>` 
    : '<p style="color: #64748b; font-style: italic;">Deskripsi buku belum tersedia.</p>';
}

function readBook() {
  if (!currentBook) return;
  
  if (!currentBook.pdf_url) {
    showUserToast('E-book belum tersedia untuk buku ini', 'error');
    return;
  }
  
  recordRead(currentBook.id);
  window.open(currentBook.pdf_url, '_blank');
}

async function downloadBook() {
  if (!currentBook) return;
  
  if (!currentBook.pdf_url) {
    showUserToast('E-book belum tersedia untuk diunduh', 'error');
    return;
  }
  
  try {
    showUserToast('Memulai unduhan...', 'info');
    const response = await fetch(currentBook.pdf_url);
    if (!response.ok) throw new Error('Gagal mengunduh PDF');
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentBook.judul}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    
    recordRead(currentBook.id);
    showUserToast(`Download "${currentBook.judul}" berhasil`, 'success');
  } catch (error) {
    showUserToast('Gagal mengunduh buku', 'error');
  }
}

async function borrowBook() {
  if (!currentBook) return;
  
  if (!currentBook.stok_tersedia || currentBook.stok_tersedia === 0) {
    showUserToast('Stok buku tidak tersedia', 'error');
    return;
  }
  
  const confirmBorrow = confirm(`Anda akan mengajukan peminjaman buku "${currentBook.judul}". Lanjutkan?`);
  if (!confirmBorrow) return;
  
  const res = await fetchUserAPI('/peminjaman', {
    method: 'POST',
    body: JSON.stringify({ id_buku: currentBook.id })
  });
  
  if (res?.success) {
    showUserToast('Pengajuan peminjaman berhasil! Menunggu persetujuan admin.', 'success');
  } else {
    showUserToast(res?.message || 'Gagal mengajukan peminjaman', 'error');
  }
}

function recordRead(idBuku) {
  fetchUserAPI('/riwayat-baca', {
    method: 'POST',
    body: JSON.stringify({ id_buku: idBuku })
  });
}
