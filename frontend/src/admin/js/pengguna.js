/**
 * E-Library MTs Al-Falah Klender - Pengguna Controller
 */

let allPengguna = [];
let allKelas = [];
let penggunaToDelete = null;

document.addEventListener('DOMContentLoaded', async () => {
  initSidebar('pengguna');
  initHeader('Manajemen Pengguna', 'ADMINISTRASI PENGGUNA', 'Kelola akun Administrator, Guru, dan Siswa MTs Al-Falah Klender.');
  await loadKelas();
  await loadPengguna();
});

async function loadKelas() {
  const res = await fetchAPI('/kategori-kelas');
  if (res && res.success) {
    allKelas = res.data;
    const select = document.getElementById('id-kelas');
    select.innerHTML = `<option value="">Pilih Kelas</option>`;
    allKelas.forEach(k => {
      select.innerHTML += `<option value="${k.id}">Kelas ${k.nama}</option>`;
    });
  }
}

async function loadPengguna() {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">Memuat data pengguna...</td></tr>`;

  const res = await fetchAPI('/pengguna');
  if (res && res.success) {
    allPengguna = res.data;
    renderTable(allPengguna);
  } else {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--error); padding: 32px;">Gagal memuat pengguna</td></tr>`;
  }
}

function renderTable(data) {
  const tbody = document.getElementById('table-body');
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">Belum ada akun pengguna</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((item, index) => {
    let roleBadgeClass = 'role-badge-siswa';
    if (item.role === 'admin') roleBadgeClass = 'role-badge-admin';
    if (item.role === 'guru') roleBadgeClass = 'role-badge-guru';

    return `
      <tr data-user-id="${item.id}">
        <td style="text-align: center; color: var(--text-muted);">${index + 1}</td>
        <td>
          <strong style="color: var(--text-primary); font-size: 13px;">${item.nama}</strong>
          ${item.email ? `<div style="font-size: 11px; color: var(--text-secondary);">${item.email}</div>` : ''}
        </td>
        <td><strong class="identifier-cell">${item.identifier}</strong></td>
        <td style="text-align: center;">
          <span class="badge ${roleBadgeClass}">${item.role.toUpperCase()}</span>
        </td>
        <td style="color: var(--text-secondary); font-size: 12px;">
          ${item.role === 'siswa' ? (item.nama_kelas ? `Kelas ${item.nama_kelas}` : '-') : '-'}
        </td>
        <td style="text-align: center;">
          <span class="badge ${item.status_aktif ? 'badge-approved' : 'badge-rejected'}">
            ${item.status_aktif ? 'Aktif' : 'Nonaktif'}
          </span>
        </td>
        <td style="text-align: center;">
          <button class="btn btn-secondary btn-icon" title="Edit" onclick="openEditModal(${item.id})">
            <span class="material-symbols-outlined" style="font-size: 18px;">edit</span>
          </button>
          <button class="btn btn-danger btn-icon" title="Hapus" onclick="openHapusModal(${item.id}, '${item.nama.replace(/'/g, "\\'")}')" style="margin-left: 6px;">
            <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterData() {
  const keyword = document.getElementById('search-input').value.toLowerCase();
  const role = document.getElementById('filter-role').value;

  const filtered = allPengguna.filter(item => {
    const matchKeyword = item.nama.toLowerCase().includes(keyword) || 
                         item.identifier.toLowerCase().includes(keyword);
    const matchRole = !role || item.role === role;
    return matchKeyword && matchRole;
  });

  renderTable(filtered);
}

function handleRoleChange(role) {
  const labelId = document.getElementById('label-identifier');
  const groupKelas = document.getElementById('group-kelas');

  if (role === 'siswa') {
    labelId.innerHTML = `NIS (Nomor Induk Siswa) <span class="req">*</span>`;
    groupKelas.style.display = 'block';
  } else if (role === 'guru') {
    labelId.innerHTML = `NIP (Nomor Induk Pegawai) <span class="req">*</span>`;
    groupKelas.style.display = 'none';
  } else {
    labelId.innerHTML = `NIP Administrator <span class="req">*</span>`;
    groupKelas.style.display = 'none';
  }
}

function openTambahModal() {
  document.getElementById('form-pengguna').reset();
  document.getElementById('pengguna-id').value = '';
  document.getElementById('role').value = 'siswa';
  handleRoleChange('siswa');

  document.getElementById('password').required = true;
  document.getElementById('pwd-req').style.display = 'inline';
  document.getElementById('pwd-hint').style.display = 'none';

  document.getElementById('modal-title').innerHTML = `
    <span class="material-symbols-outlined" style="color: var(--primary);">person_add</span>
    <span>Tambah Pengguna Baru</span>
  `;
  document.getElementById('btn-submit-pengguna').innerText = 'Simpan Pengguna';
  openModal('modal-form');
}

async function openEditModal(id) {
  let p = allPengguna.find(item => String(item.id) === String(id));
  if (!p) {
    const res = await fetchAPI(`/pengguna/${id}`);
    if (!res || !res.success) {
      showToast('Gagal memuat pengguna', 'error');
      return;
    }
    p = res.data;
  }

  document.getElementById('pengguna-id').value = p.id;
  document.getElementById('nama').value = p.nama;
  document.getElementById('role').value = p.role;
  handleRoleChange(p.role);

  document.getElementById('identifier').value = p.identifier;
  document.getElementById('email').value = p.email || '';
  document.getElementById('id-kelas').value = p.id_kelas || '';
  document.getElementById('status-aktif').value = p.status_aktif !== undefined ? p.status_aktif : '1';

  document.getElementById('password').value = '';
  document.getElementById('password').required = false;
  document.getElementById('pwd-req').style.display = 'none';
  document.getElementById('pwd-hint').style.display = 'block';

  document.getElementById('modal-title').innerHTML = `
    <span class="material-symbols-outlined" style="color: var(--primary);">edit</span>
    <span>Edit Data Pengguna</span>
  `;
  document.getElementById('btn-submit-pengguna').innerText = 'Simpan Perubahan';
  openModal('modal-form');
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('pengguna-id').value;
  const nama = document.getElementById('nama').value.trim();
  const role = document.getElementById('role').value;
  const identifier = document.getElementById('identifier').value.trim();
  const email = document.getElementById('email').value.trim();
  const id_kelas = role === 'siswa' ? (document.getElementById('id-kelas').value || null) : null;
  const status_aktif = parseInt(document.getElementById('status-aktif').value);
  const password = document.getElementById('password').value;

  if (!id && !password) {
    showToast('Kata sandi wajib diisi untuk pengguna baru', 'error');
    return;
  }

  const payload = {
    nama,
    role,
    identifier,
    email: email || null,
    id_kelas,
    status_aktif
  };

  if (password && password.trim() !== '') {
    payload.password = password;
  }

  const endpoint = id ? `/pengguna/${id}` : '/pengguna';
  const method = id ? 'PUT' : 'POST';

  const submitBtn = document.getElementById('btn-submit-pengguna');
  submitBtn.disabled = true;
  submitBtn.innerText = id ? 'Memperbarui...' : 'Menyimpan...';

  const res = await fetchAPI(endpoint, {
    method,
    body: JSON.stringify(payload)
  });

  submitBtn.disabled = false;
  submitBtn.innerText = id ? 'Simpan Perubahan' : 'Simpan Pengguna';

  if (res && res.success) {
    showToast(id ? 'Pengguna berhasil diperbarui' : 'Pengguna berhasil ditambahkan');
    closeModal('modal-form');
    await loadPengguna();
  } else {
    showToast(res ? res.message : 'Gagal menyimpan pengguna', 'error');
  }
}

function togglePasswordVisibility() {
  const input = document.getElementById('password');
  const icon = document.querySelector('.password-toggle .material-symbols-outlined');
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  icon.textContent = isPassword ? 'visibility_off' : 'visibility';
}

function openHapusModal(id, nama) {
  penggunaToDelete = id;
  document.getElementById('hapus-nama').innerText = nama;
  document.getElementById('btn-konfirmasi-hapus').onclick = executeHapus;
  openModal('modal-hapus');
}

async function executeHapus() {
  if (!penggunaToDelete) return;

  const idYangDihapus = String(penggunaToDelete);
  const tombolHapus = document.getElementById('btn-konfirmasi-hapus');
  tombolHapus.disabled = true;
  tombolHapus.innerText = 'Menghapus...';

  const res = await fetchAPI(`/pengguna/${idYangDihapus}`, { method: 'DELETE' });
  if (res && res.success) {
    const row = document.querySelector(`tr[data-user-id="${idYangDihapus}"]`);
    if (row) {
      row.classList.add('row-removing');
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    allPengguna = allPengguna.filter(item => String(item.id) !== idYangDihapus);
    renderTable(allPengguna);
    showToast('Pengguna berhasil dihapus');
    closeModal('modal-hapus');
  } else {
    showToast(res ? res.message : 'Gagal menghapus pengguna', 'error');
  }
  tombolHapus.disabled = false;
  tombolHapus.innerText = 'Ya, Hapus';
  penggunaToDelete = null;
}
