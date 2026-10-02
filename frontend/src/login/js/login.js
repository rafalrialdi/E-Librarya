// ============================================
// LOGIN.JS — E-Library MTs Al-Falah Klender
// ============================================

const API_URL = 'http://localhost:3000/api';

// --- Cek jika sudah login, redirect ---
(function checkAlreadyLoggedIn() {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');
  if (!token || !role) return;

  if (role === 'admin') {
    window.location.href = '../../admin/html/dashboard.html';
  } else {
    window.location.href = '../../pengguna/html/dashboard.html';
  }
})();

// --- Switch Tab ---
function switchTab(tab) {
  const formPengguna = document.getElementById('form-pengguna');
  const formAdmin    = document.getElementById('form-admin');
  const tabPengguna  = document.getElementById('tab-pengguna');
  const tabAdmin     = document.getElementById('tab-admin');

  clearErrors();

  if (tab === 'pengguna') {
    formPengguna.style.display = 'flex';
    formAdmin.style.display    = 'none';
    tabPengguna.classList.add('active');
    tabAdmin.classList.remove('active');
  } else {
    formAdmin.style.display    = 'flex';
    formPengguna.style.display = 'none';
    tabAdmin.classList.add('active');
    tabPengguna.classList.remove('active');
  }
}

// --- Toggle Tampilkan/Sembunyikan Password ---
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon  = btn.querySelector('.material-symbols-outlined');

  if (input.type === 'password') {
    input.type  = 'text';
    icon.textContent = 'visibility_off';
  } else {
    input.type  = 'password';
    icon.textContent = 'visibility';
  }
}

// --- Tampilkan Error ---
function showError(elementId, pesan) {
  const el = document.getElementById(elementId);
  el.innerHTML = `<span class="material-symbols-outlined" style="font-size:16px;">error</span> ${pesan}`;
  el.style.display = 'flex';
}

// --- Hapus semua error ---
function clearErrors() {
  document.getElementById('error-pengguna').style.display = 'none';
  document.getElementById('error-admin').style.display    = 'none';
}

// --- Set loading state tombol ---
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation:spin 1s linear infinite;font-size:18px;">progress_activity</span> Memproses...`;
  } else {
    btn.disabled = false;
  }
}

// --- Login Guru/Siswa ---
async function handleLoginPengguna(e) {
  e.preventDefault();
  clearErrors();

  const nisNip   = document.getElementById('nis-nip').value.trim();
  const password = document.getElementById('password-pengguna').value;

  if (!nisNip || !password) {
    showError('error-pengguna', 'NIS/NIP dan kata sandi wajib diisi.');
    return;
  }

  setLoading('btn-pengguna', true);

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: nisNip, password })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showError('error-pengguna', data.message || 'NIS/NIP atau kata sandi salah.');
      setLoading('btn-pengguna', false);
      resetBtnPengguna();
      return;
    }

    // Cek role
    if (data.data.role === 'admin') {
      showError('error-pengguna', 'Akun ini adalah admin. Gunakan tab Administrator.');
      setLoading('btn-pengguna', false);
      resetBtnPengguna();
      return;
    }

    // Simpan token & data user
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('role',  data.data.role);
    localStorage.setItem('nama',  data.data.nama);
    localStorage.setItem('id',    data.data.id);

    // Redirect ke dashboard pengguna
    window.location.href = '../../pengguna/html/dashboard.html';

  } catch (err) {
    showError('error-pengguna', 'Gagal terhubung ke server. Coba beberapa saat lagi.');
    setLoading('btn-pengguna', false);
    resetBtnPengguna();
  }
}

function resetBtnPengguna() {
  const btn = document.getElementById('btn-pengguna');
  btn.disabled = false;
  btn.innerHTML = `<span class="material-symbols-outlined">login</span> Masuk ke E-Library`;
}

// --- Login Admin ---
async function handleLoginAdmin(e) {
  e.preventDefault();
  clearErrors();

  const nip      = document.getElementById('nip-admin').value.trim();
  const password = document.getElementById('password-admin').value;

  if (!nip || !password) {
    showError('error-admin', 'NIP dan kata sandi wajib diisi.');
    return;
  }

  setLoading('btn-admin', true);

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: nip, password })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showError('error-admin', data.message || 'NIP atau kata sandi salah.');
      setLoading('btn-admin', false);
      resetBtnAdmin();
      return;
    }

    // Cek role harus admin
    if (data.data.role !== 'admin') {
      showError('error-admin', 'Akun ini bukan Administrator. Gunakan tab Siswa / Guru.');
      setLoading('btn-admin', false);
      resetBtnAdmin();
      return;
    }

    // Simpan token & data user
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('role',  data.data.role);
    localStorage.setItem('nama',  data.data.nama);
    localStorage.setItem('id',    data.data.id);

    // Redirect ke dashboard admin
    window.location.href = '../../admin/html/dashboard.html';

  } catch (err) {
    showError('error-admin', 'Gagal terhubung ke server. Coba beberapa saat lagi.');
    setLoading('btn-admin', false);
    resetBtnAdmin();
  }
}

function resetBtnAdmin() {
  const btn = document.getElementById('btn-admin');
  btn.disabled = false;
  btn.innerHTML = `<span class="material-symbols-outlined">shield_person</span> Masuk sebagai Administrator`;
}

// --- CSS untuk animasi loading spinner ---
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
