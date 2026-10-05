/**
 * E-Library MTs Al-Falah Klender - Buku Controller
 */

let allBuku = [];
let allKategori = [];
let allMapel = [];
let bukuToDelete = null;

document.addEventListener('DOMContentLoaded', async () => {
  initSidebar('buku');
  initHeader('Manajemen Buku', 'KATALOG & INVENTARIS', 'Kelola seluruh katalog buku fisik & digital kurikulum madrasah.');
  await loadDropdownMaster();
  await loadBuku();
});

async function loadDropdownMaster() {
  const [resKat, resMapel] = await Promise.all([
    fetchAPI('/kategori-buku'),
    fetchAPI('/mata-pelajaran')
  ]);

  if (resKat && resKat.success) {
    allKategori = resKat.data;
    const filterKat = document.getElementById('filter-kategori');
    const formKat = document.getElementById('id-kategori');
    allKategori.forEach(k => {
      filterKat.innerHTML += `<option value="${k.id}">${k.nama}</option>`;
      formKat.innerHTML += `<option value="${k.id}">${k.nama}</option>`;
    });
  }

  if (resMapel && resMapel.success) {
    allMapel = resMapel.data;
    const formMapel = document.getElementById('id-mata-pelajaran');
    allMapel.forEach(m => {
      formMapel.innerHTML += `<option value="${m.id}">${m.nama}</option>`;
    });
  }

}

async function loadBuku() {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">Memuat data buku...</td></tr>`;

  const res = await fetchAPI('/buku');
  if (res && res.success) {
    allBuku = res.data;
    renderTable(allBuku);
  } else {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--error); padding: 32px;">Gagal memuat katalog buku</td></tr>`;
  }
}

function renderTable(data) {
  const tbody = document.getElementById('table-body');
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">Belum ada koleksi buku</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(item => `
    <tr data-buku-id="${item.id}">
      <td style="text-align: center;">
        <img src="${item.cover_url || '../../../assset/logosekolah.jpeg'}" alt="Cover" class="book-cover-cell">
      </td>
      <td>
        <strong style="color: var(--text-primary); font-size: 14px;">${item.judul}</strong>
        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
          Penulis: ${item.penulis} ${item.tahun_terbit ? `(${item.tahun_terbit})` : ''}
        </div>
      </td>
      <td style="color: var(--text-primary); font-size: 12px;">${item.isbn || '-'}</td>
      <td>
        <div class="book-badge-stack">
          <span class="badge book-category-badge">${item.nama_kategori || 'Umum'}</span>
          <span class="badge book-class-badge">${item.tingkat_kelas ? `Kelas ${item.tingkat_kelas}` : 'Semua'}</span>
        </div>
      </td>
      <td style="text-align: center;">
        <span style="font-weight: 700; color: ${item.stok_tersedia > 0 ? 'var(--tertiary)' : 'var(--error)'};">${item.stok_tersedia}</span>
        <span style="color: var(--text-muted); font-size: 11px;"> / ${item.stok_total}</span>
      </td>
      <td style="text-align: center;">
        ${item.pdf_url ? `
          <a href="${item.pdf_url}" target="_blank" style="color: var(--secondary); text-decoration: none;" title="Buka PDF">
            <span class="material-symbols-outlined">picture_as_pdf</span>
          </a>
        ` : `<span style="color: var(--text-muted);">-</span>`}
      </td>
      <td style="text-align: center;">
        <button class="btn btn-secondary btn-icon" title="Edit" onclick="openEditModal(${item.id})">
          <span class="material-symbols-outlined" style="font-size: 18px;">edit</span>
        </button>
        <button class="btn btn-danger btn-icon" title="Hapus" onclick="openHapusModal(${item.id}, '${item.judul.replace(/'/g, "\\'")}')" style="margin-left: 6px;">
          <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
        </button>
      </td>
    </tr>
  `).join('');
}

function filterData() {
  const keyword = document.getElementById('search-input').value.toLowerCase();
  const kategoriId = document.getElementById('filter-kategori').value;

  const filtered = allBuku.filter(item => {
    const matchKeyword = item.judul.toLowerCase().includes(keyword) || 
                         item.penulis.toLowerCase().includes(keyword) ||
                         (item.isbn && item.isbn.toLowerCase().includes(keyword));
    const matchKategori = !kategoriId || String(item.id_kategori) === String(kategoriId);
    return matchKeyword && matchKategori;
  });

  renderTable(filtered);
}

function handleCoverSelect(input) {
  if (input.files && input.files[0]) {
    document.getElementById('label-cover').innerText = input.files[0].name;
  }
}

function handlePdfSelect(input) {
  if (input.files && input.files[0]) {
    document.getElementById('label-pdf').innerText = input.files[0].name;
  }
}

function openTambahModal() {
  document.getElementById('form-buku').reset();
  document.getElementById('buku-id').value = '';
  document.getElementById('file-cover').value = '';
  document.getElementById('file-pdf').value = '';
  document.getElementById('label-cover').innerText = 'Pilih cover (JPG/PNG)';
  document.getElementById('label-pdf').innerText = 'Pilih berkas PDF';
  document.getElementById('modal-title').innerHTML = `
    <span class="material-symbols-outlined" style="color: var(--primary);">menu_book</span>
    <span>Tambah Buku Baru</span>
  `;
  document.getElementById('btn-submit-buku').innerText = 'Simpan Buku';
  openModal('modal-form');
}

async function openEditModal(id) {
  document.getElementById('form-buku').reset();
  document.getElementById('file-cover').value = '';
  document.getElementById('file-pdf').value = '';

  let b = allBuku.find(item => String(item.id) === String(id));
  if (!b) {
    const res = await fetchAPI(`/buku/${id}`);
    if (!res || !res.success) {
      showToast('Gagal memuat detail buku', 'error');
      return;
    }
    b = res.data;
  }

  document.getElementById('buku-id').value = b.id;
  document.getElementById('judul').value = b.judul || '';
  document.getElementById('penulis').value = b.penulis || '';
  document.getElementById('penerbit').value = b.penerbit || '';
  document.getElementById('tahun-terbit').value = b.tahun_terbit || '';
  document.getElementById('isbn').value = b.isbn || '';
  document.getElementById('id-kategori').value = b.id_kategori || '';
  document.getElementById('id-mata-pelajaran').value = b.id_mata_pelajaran || '';
  document.getElementById('tingkat-kelas').value = b.tingkat_kelas || '';
  document.getElementById('stok-total').value = b.stok_total !== undefined ? b.stok_total : '';
  document.getElementById('deskripsi').value = b.deskripsi || '';

  document.getElementById('label-cover').innerText = b.cover_url ? 'Ganti Cover (sudah ada)' : 'Pilih cover (JPG/PNG)';
  document.getElementById('label-pdf').innerText = b.pdf_url ? 'Ganti PDF (sudah ada)' : 'Pilih berkas PDF';

  document.getElementById('modal-title').innerHTML = `
    <span class="material-symbols-outlined" style="color: var(--primary);">edit</span>
    <span>Edit Data Buku</span>
  `;
  document.getElementById('btn-submit-buku').innerText = 'Simpan Perubahan';
  openModal('modal-form');
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('buku-id').value;
  const submitBtn = document.getElementById('btn-submit-buku');

  const formData = new FormData();
  formData.append('judul', document.getElementById('judul').value.trim());
  formData.append('penulis', document.getElementById('penulis').value.trim());
  formData.append('penerbit', document.getElementById('penerbit').value.trim());
  formData.append('tahun_terbit', document.getElementById('tahun-terbit').value);
  formData.append('isbn', document.getElementById('isbn').value.trim());
  formData.append('id_kategori', document.getElementById('id-kategori').value);
  formData.append('id_mata_pelajaran', document.getElementById('id-mata-pelajaran').value);
  formData.append('tingkat_kelas', document.getElementById('tingkat-kelas').value);
  formData.append('stok_total', document.getElementById('stok-total').value);
  formData.append('durasi_peminjaman', '7');
  formData.append('deskripsi', document.getElementById('deskripsi').value.trim());

  const fileCover = document.getElementById('file-cover').files[0];
  if (fileCover) formData.append('cover', fileCover);

  const filePdf = document.getElementById('file-pdf').files[0];
  if (filePdf) formData.append('pdf', filePdf);

  submitBtn.disabled = true;
  submitBtn.innerText = id ? 'Memperbarui...' : 'Mengunggah & Menyimpan...';

  const endpoint = id ? `/buku/${id}` : '/buku';
  const method = id ? 'PUT' : 'POST';

  const res = await fetchAPI(endpoint, {
    method,
    body: formData
  });

  submitBtn.disabled = false;
  submitBtn.innerText = id ? 'Simpan Perubahan' : 'Simpan Buku';

  if (res && res.success) {
    showToast(id ? 'Buku berhasil diperbarui' : 'Buku berhasil ditambahkan');
    closeModal('modal-form');
    document.getElementById('form-buku').reset();
    document.getElementById('file-cover').value = '';
    document.getElementById('file-pdf').value = '';
    await loadBuku();
  } else {
    showToast(res ? res.message : 'Gagal menyimpan buku', 'error');
  }
}

function openHapusModal(id, judul) {
  bukuToDelete = id;
  document.getElementById('hapus-judul').innerText = judul;
  document.getElementById('btn-konfirmasi-hapus').onclick = executeHapus;
  openModal('modal-hapus');
}

async function executeHapus() {
  if (!bukuToDelete) return;
  const idYangDihapus = String(bukuToDelete);
  const tombolHapus = document.getElementById('btn-konfirmasi-hapus');
  tombolHapus.disabled = true;
  tombolHapus.innerText = 'Menghapus...';
  const res = await fetchAPI(`/buku/${idYangDihapus}`, { method: 'DELETE' });
  if (res && res.success) {
    const row = document.querySelector(`tr[data-buku-id="${idYangDihapus}"]`);
    if (row) {
      row.classList.add('row-removing');
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    allBuku = allBuku.filter(item => String(item.id) !== idYangDihapus);
    renderTable(allBuku);
    showToast('Buku berhasil dihapus');
    closeModal('modal-hapus');
  } else {
    showToast(res ? res.message : 'Gagal menghapus buku', 'error');
  }
  tombolHapus.disabled = false;
  tombolHapus.innerText = 'Ya, Hapus';
  bukuToDelete = null;
}
