/**
 * E-Library MTs Al-Falah Klender - Mata Pelajaran Controller
 */

let allMapel = [];
let mapelToDelete = null;

document.addEventListener('DOMContentLoaded', () => {
  initSidebar('mata-pelajaran');
  initHeader('Mata Pelajaran', 'DATA KURIKULUM', 'Kelola daftar kurikulum & mata pelajaran madrasah.');
  loadMapel();
});

async function loadMapel() {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">Memuat data...</td></tr>`;

  const res = await fetchAPI('/mata-pelajaran');
  if (res && res.success) {
    allMapel = res.data;
    renderTable(allMapel);
  } else {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--error); padding: 32px;">Gagal memuat data mata pelajaran</td></tr>`;
  }
}

function renderTable(data) {
  const tbody = document.getElementById('table-body');
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">Belum ada data mata pelajaran</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((item, index) => `
    <tr data-mapel-id="${item.id}">
      <td style="text-align: center; color: var(--text-muted);">${index + 1}</td>
      <td><span class="table-value-badge">${item.nama}</span></td>
      <td>
        ${item.kelompok ? `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: var(--primary); border: 1px solid rgba(245, 158, 11, 0.3);">${item.kelompok}</span>` : '-'}
      </td>
      <td style="color: var(--text-primary);">${item.kode || '-'}</td>
      <td style="color: var(--text-secondary);">${item.tingkat_kelas || 'Semua'}</td>
      <td style="text-align: center;">
        <button class="btn btn-secondary btn-icon" title="Edit" onclick="openEditModal(${item.id}, '${item.nama}', '${item.kelompok || ''}', '${item.kode || ''}', '${item.tingkat_kelas || ''}')">
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
  const filtered = allMapel.filter(item => 
    item.nama.toLowerCase().includes(keyword) || 
    (item.kelompok && item.kelompok.toLowerCase().includes(keyword)) ||
    (item.kode && item.kode.toLowerCase().includes(keyword))
  );
  renderTable(filtered);
}

function openTambahModal() {
  document.getElementById('form-mapel').reset();
  document.getElementById('mapel-id').value = '';
  document.getElementById('modal-title').innerHTML = `
    <span class="material-symbols-outlined" style="color: var(--primary);">school</span>
    <span>Tambah Mata Pelajaran</span>
  `;
  openModal('modal-form');
}

function openEditModal(id, nama, kelompok, kode, tingkatKelas) {
  document.getElementById('mapel-id').value = id;
  document.getElementById('nama-mapel').value = nama;
  document.getElementById('kelompok-mapel').value = kelompok;
  document.getElementById('kode-mapel').value = kode;
  document.getElementById('tingkat-kelas').value = tingkatKelas;
  document.getElementById('modal-title').innerHTML = `
    <span class="material-symbols-outlined" style="color: var(--primary);">edit</span>
    <span>Edit Mata Pelajaran</span>
  `;
  openModal('modal-form');
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('mapel-id').value;
  const nama = document.getElementById('nama-mapel').value.trim();
  const kelompok = document.getElementById('kelompok-mapel').value;
  const kode = document.getElementById('kode-mapel').value.trim();
  const tingkat_kelas = document.getElementById('tingkat-kelas').value.trim();

  if (!nama) {
    showToast('Nama mata pelajaran wajib diisi', 'error');
    return;
  }

  const endpoint = id ? `/mata-pelajaran/${id}` : '/mata-pelajaran';
  const method = id ? 'PUT' : 'POST';

  const tombolSimpan = document.querySelector('#form-mapel button[type="submit"]');
  tombolSimpan.disabled = true;
  tombolSimpan.innerText = id ? 'Memperbarui...' : 'Menyimpan...';
  const res = await fetchAPI(endpoint, {
    method,
    body: JSON.stringify({ nama, kelompok, kode, tingkat_kelas })
  });
  tombolSimpan.disabled = false;
  tombolSimpan.innerText = 'Simpan';

  if (res && res.success) {
    showToast(id ? 'Mata pelajaran berhasil diperbarui' : 'Mata pelajaran berhasil ditambahkan');
    closeModal('modal-form');
    await loadMapel();
  } else {
    showToast(res ? res.message : 'Gagal menyimpan mata pelajaran', 'error');
  }
}

function openHapusModal(id, nama) {
  mapelToDelete = id;
  document.getElementById('hapus-nama').innerText = nama;
  document.getElementById('btn-konfirmasi-hapus').onclick = executeHapus;
  openModal('modal-hapus');
}

async function executeHapus() {
  if (!mapelToDelete) return;
  const idYangDihapus = String(mapelToDelete);
  const tombolHapus = document.getElementById('btn-konfirmasi-hapus');
  tombolHapus.disabled = true;
  tombolHapus.innerText = 'Menghapus...';
  const res = await fetchAPI(`/mata-pelajaran/${idYangDihapus}`, { method: 'DELETE' });
  if (res && res.success) {
    const row = document.querySelector(`tr[data-mapel-id="${idYangDihapus}"]`);
    if (row) {
      row.classList.add('row-removing');
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    allMapel = allMapel.filter(item => String(item.id) !== idYangDihapus);
    renderTable(allMapel);
    showToast('Mata pelajaran berhasil dihapus');
    closeModal('modal-hapus');
  } else {
    showToast(res ? res.message : 'Gagal menghapus mata pelajaran', 'error');
  }
  tombolHapus.disabled = false;
  tombolHapus.innerText = 'Ya, Hapus';
  mapelToDelete = null;
}
