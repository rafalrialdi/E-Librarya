/**
 * E-Library MTs Al-Falah Klender - Profil Admin Controller
 */

let currentAdminId = null;

document.addEventListener('DOMContentLoaded', async () => {
  initSidebar('profil');
  initHeader('Profil Admin', 'ADMINISTRASI PENGGUNA', 'Kelola informasi akun administrator dan perbarui kata sandi sistem E-Library MTs Al-Falah Klender.');
  await loadAdminProfile();
  
  document.getElementById('password-baru').addEventListener('input', validatePassword);
  document.getElementById('password-konfirmasi').addEventListener('input', validatePassword);
});

async function loadAdminProfile() {
  currentAdminId = localStorage.getItem('id');
  const storedNama = localStorage.getItem('nama') || 'Administrator';
  document.getElementById('admin-display-nama').innerText = storedNama;

  if (!currentAdminId) return;

  const res = await fetchAPI(`/pengguna/${currentAdminId}`);
  if (res && res.success) {
    const admin = res.data;
    document.getElementById('admin-display-nama').innerText = admin.nama;
    document.getElementById('admin-nip').innerText = admin.identifier || '-';
    document.getElementById('admin-email').innerText = admin.email || 'admin@mtsalfalah.sch.id';
  }
}

function toggleProfilePassword(inputId, button) {
  const input = document.getElementById(inputId);
  const icon = button.querySelector('.material-symbols-outlined');
  const visible = input.type === 'text';
  input.type = visible ? 'password' : 'text';
  icon.textContent = visible ? 'visibility' : 'visibility_off';
}

function validatePassword() {
  const newPassword = document.getElementById('password-baru').value;
  const confirmPassword = document.getElementById('password-konfirmasi').value;
  
  const reqLength = document.getElementById('req-length');
  const reqCombo = document.getElementById('req-combo');
  const reqMatch = document.getElementById('req-match');
  
  if (newPassword.length >= 8) {
    reqLength.classList.add('valid');
  } else {
    reqLength.classList.remove('valid');
  }
  
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  if (hasLetter && hasNumber) {
    reqCombo.classList.add('valid');
  } else {
    reqCombo.classList.remove('valid');
  }
  
  if (confirmPassword && newPassword === confirmPassword) {
    reqMatch.classList.add('valid');
  } else {
    reqMatch.classList.remove('valid');
  }
}

async function handleGantiPassword(e) {
  e.preventDefault();
  const pwdLama = document.getElementById('password-lama').value;
  const pwdBaru = document.getElementById('password-baru').value;
  const pwdKonf = document.getElementById('password-konfirmasi').value;
  const btn = document.getElementById('btn-submit-pwd');

  if (!pwdLama) {
    showToast('Kata sandi lama wajib diisi', 'error');
    return;
  }

  if (pwdBaru.length < 8) {
    showToast('Kata sandi baru minimal 8 karakter', 'error');
    return;
  }

  const hasLetter = /[a-zA-Z]/.test(pwdBaru);
  const hasNumber = /[0-9]/.test(pwdBaru);
  if (!hasLetter || !hasNumber) {
    showToast('Kata sandi harus kombinasi huruf dan angka', 'error');
    return;
  }

  if (pwdBaru !== pwdKonf) {
    showToast('Konfirmasi kata sandi tidak cocok', 'error');
    return;
  }

  if (!currentAdminId) {
    showToast('ID sesi admin tidak ditemukan', 'error');
    return;
  }

  const adminRes = await fetchAPI(`/pengguna/${currentAdminId}`);
  if (!adminRes || !adminRes.success) {
    showToast('Gagal memvalidasi data admin', 'error');
    return;
  }

  const currentAdmin = adminRes.data;

  btn.disabled = true;
  btn.innerText = 'Menyimpan...';

  const res = await fetchAPI(`/pengguna/${currentAdminId}`, {
    method: 'PUT',
    body: JSON.stringify({
      nama: currentAdmin.nama,
      role: currentAdmin.role,
      identifier: currentAdmin.identifier,
      email: currentAdmin.email,
      status_aktif: currentAdmin.status_aktif,
      current_password: pwdLama,
      password: pwdBaru
    })
  });

  btn.disabled = false;
  btn.innerText = 'Simpan Kata Sandi Baru';

  if (res && res.success) {
    showToast('Kata sandi berhasil diperbarui');
    document.getElementById('form-password').reset();
    document.querySelectorAll('.requirement-item').forEach(item => {
      item.classList.remove('valid');
    });
  } else {
    showToast(res ? res.message : 'Gagal memperbarui kata sandi', 'error');
  }
}