/**
 * E-Library MTs Al-Falah Klender - Kategori Kelas Controller
 */

let allKelas = [];
let kelasToDelete = null;

document.addEventListener('DOMContentLoaded', () => {
  initSidebar('kategori-kelas');
  initHeader('Kategori Kelas', 'DATA KURIKULUM', 'Kelola daftar tingkat dan rombongan belajar siswa MTs Al-Falah Klender.');
  loadKelas();
});

async function loadKelas() {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">Memuat data...</td></tr>`;

  const res = await fetchAPI('/kategori-kelas');
  if (res && res.success) {
    allKelas = res.data;
    renderTable(allKelas);
  } else {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--error); padding: 32px;">Gagal memuat data kelas</td></tr>`;
  }
}

function renderTable(data) {
  const tbody = document.getElementById('table-body');
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">Belum ada data kelas</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((item, index) => `
    <tr>
      <td style="text-align: center; color: var(--text-muted);">${index + 1}</td>
      <td><strong style="color: var(--text-primary);">${item.nama}</strong></td>
      <td><span class="badge" style="background: rgba(123, 208, 255, 0.15); color: var(--secondary); border: 1px solid rgba(123, 208, 255, 0.3);">Kelas ${item.tingkat}</span></td>
      <td style="color: var(--text-secondary);">${item.wali_kelas || '-'}</td>
      <td style="text-align: center;">
        <button class="btn btn-secondary btn-icon" title="Edit" onclick="openEditModal(${item.id}, '${item.nama}', '${item.tingkat}', '${item.wali_kelas || ''}')">
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
  const filtered = allKelas.filter(item => 
    item.nama.toLowerCase().includes(keyword) || 
    (item.wali_kelas && item.wali_kelas.toLowerCase().includes(keyword))
  );
  renderTable(filtered);
}

function openTambahModal() {
  document.getElementById('form-kelas').reset();
  document.getElementById('kelas-id').value = '';
  document.getElementById('modal-title').innerHTML = `
    <span class="material-symbols-outlined" style="color: var(--primary);">meeting_room</span>
    <span>Tambah Kategori Kelas</span>
  `;
  openModal('modal-form');
}

function openEditModal(id, nama, tingkat, waliKelas) {
  document.getElementById('kelas-id').value = id;
  document.getElementById('nama-kelas').value = nama;
  document.getElementById('tingkat-kelas').value = tingkat;
  document.getElementById('wali-kelas').value = waliKelas;
  document.getElementById('modal-title').innerHTML = `
    <span class="material-symbols-outlined" style="color: var(--primary);">edit</span>
    <span>Edit Kategori Kelas</span>
  `;
  openModal('modal-form');
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('kelas-id').value;
  const nama = document.getElementById('nama-kelas').value.trim();
  const tingkat = document.getElementById('tingkat-kelas').value;
  const wali_kelas = document.getElementById('wali-kelas').value.trim();

  if (!nama || !tingkat) {
    showToast('Nama kelas dan tingkat wajib diisi', 'error');
    return;
  }

  const endpoint = id ? `/kategori-kelas/${id}` : '/kategori-kelas';
  const method = id ? 'PUT' : 'POST';

  const res = await fetchAPI(endpoint, {
    method,
    body: JSON.stringify({ nama, tingkat, wali_kelas })
  });

  if (res && res.success) {
    showToast(id ? 'Kelas berhasil diperbarui' : 'Kelas berhasil ditambahkan');
    closeModal('modal-form');
    loadKelas();
  } else {
    showToast(res ? res.message : 'Gagal menyimpan kelas', 'error');
  }
}

function openHapusModal(id, nama) {
  kelasToDelete = id;
  document.getElementById('hapus-nama').innerText = nama;
  document.getElementById('btn-konfirmasi-hapus').onclick = executeHapus;
  openModal('modal-hapus');
}

async function executeHapus() {
  if (!kelasToDelete) return;
  const res = await fetchAPI(`/kategori-kelas/${kelasToDelete}`, { method: 'DELETE' });
  if (res && res.success) {
    showToast('Kelas berhasil dihapus');
    closeModal('modal-hapus');
    loadKelas();
  } else {
    showToast(res ? res.message : 'Gagal menghapus kelas', 'error');
  }
  kelasToDelete = null;
}
