/**
 * E-Library MTs Al-Falah Klender - Kategori Buku Controller
 */

let allKategori = [];
let kategoriToDelete = null;

document.addEventListener('DOMContentLoaded', () => {
  initSidebar('kategori-buku');
  initHeader('Kategori Buku', 'DATA KURIKULUM', 'Kelola kategori buku untuk memudahkan klasifikasi dan pencarian bahan ajar.');
  loadKategori();
});

async function loadKategori() {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 32px;">Memuat data...</td></tr>`;

  const res = await fetchAPI('/kategori-buku');
  if (res && res.success) {
    allKategori = res.data;
    renderTable(allKategori);
  } else {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--error); padding: 32px;">Gagal memuat data kategori</td></tr>`;
  }
}

function renderTable(data) {
  const tbody = document.getElementById('table-body');
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 32px;">Belum ada data kategori</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((item, index) => `
    <tr data-kategori-id="${item.id}">
      <td style="text-align: center; color: var(--text-muted);">${index + 1}</td>
      <td><span class="table-value-badge">${item.nama}</span></td>
      <td style="color: var(--text-secondary);">${formatDate(item.created_at)}</td>
      <td style="text-align: center;">
        <button class="btn btn-secondary btn-icon" title="Edit" onclick="openEditModal(${item.id}, '${item.nama}')">
          <span class="material-symbols-outlined" style="font-size: 18px;">edit</span>
        </button>
        <button class="btn btn-danger btn-icon" title="Hapus" onclick="openHapusModal(${item.id}, '${item.nama}')" style="margin-left: 6px;">
          <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
        </button>
      </td>
    </tr>
  `).join('');
}

function filterData() {
  const keyword = document.getElementById('search-input').value.toLowerCase();
  const filtered = allKategori.filter(item => item.nama.toLowerCase().includes(keyword));
  renderTable(filtered);
}

function openTambahModal() {
  document.getElementById('form-kategori').reset();
  document.getElementById('kategori-id').value = '';
  document.getElementById('modal-title').innerHTML = `
    <span class="material-symbols-outlined" style="color: var(--primary);">category</span>
    <span>Tambah Kategori Buku</span>
  `;
  openModal('modal-form');
}

function openEditModal(id, nama) {
  document.getElementById('kategori-id').value = id;
  document.getElementById('nama-kategori').value = nama;
  document.getElementById('modal-title').innerHTML = `
    <span class="material-symbols-outlined" style="color: var(--primary);">edit</span>
    <span>Edit Kategori Buku</span>
  `;
  openModal('modal-form');
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('kategori-id').value;
  const nama = document.getElementById('nama-kategori').value.trim();

  if (!nama) {
    showToast('Nama kategori wajib diisi', 'error');
    return;
  }

  const endpoint = id ? `/kategori-buku/${id}` : '/kategori-buku';
  const method = id ? 'PUT' : 'POST';

  const tombolSimpan = document.querySelector('#form-kategori button[type="submit"]');
  tombolSimpan.disabled = true;
  tombolSimpan.innerText = id ? 'Memperbarui...' : 'Menyimpan...';
  const res = await fetchAPI(endpoint, {
    method,
    body: JSON.stringify({ nama })
  });
  tombolSimpan.disabled = false;
  tombolSimpan.innerText = 'Simpan';

  if (res && res.success) {
    showToast(id ? 'Kategori berhasil diperbarui' : 'Kategori berhasil ditambahkan');
    closeModal('modal-form');
    await loadKategori();
  } else {
    showToast(res ? res.message : 'Gagal menyimpan kategori', 'error');
  }
}

function openHapusModal(id, nama) {
  kategoriToDelete = id;
  document.getElementById('hapus-nama').innerText = nama;
  document.getElementById('btn-konfirmasi-hapus').onclick = executeHapus;
  openModal('modal-hapus');
}

async function executeHapus() {
  if (!kategoriToDelete) return;
  const idYangDihapus = String(kategoriToDelete);
  const tombolHapus = document.getElementById('btn-konfirmasi-hapus');
  tombolHapus.disabled = true;
  tombolHapus.innerText = 'Menghapus...';
  const res = await fetchAPI(`/kategori-buku/${idYangDihapus}`, { method: 'DELETE' });
  if (res && res.success) {
    const row = document.querySelector(`tr[data-kategori-id="${idYangDihapus}"]`);
    if (row) {
      row.classList.add('row-removing');
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    allKategori = allKategori.filter(item => String(item.id) !== idYangDihapus);
    renderTable(allKategori);
    showToast('Kategori berhasil dihapus');
    closeModal('modal-hapus');
  } else {
    showToast(res ? res.message : 'Gagal menghapus kategori', 'error');
  }
  tombolHapus.disabled = false;
  tombolHapus.innerText = 'Ya, Hapus';
  kategoriToDelete = null;
}
