/**
 * E-Library MTs Al-Falah Klender - Profil Admin Controller
 */

let currentAdminId = null;

document.addEventListener('DOMContentLoaded', async () => {
  initSidebar('profil');
  initHeader('Profil Admin', 'ADMINISTRASI PENGGUNA', 'Kelola informasi akun administrator dan perbarui kata sandi sistem E-Library MTs Al-Falah Klender.');
  await loadAdminProfile();
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

async function handleGantiPassword(e) {
  e.preventDefault();
  const pwdBaru = document.getElementById('password-baru').value;
  const pwdKonf = document.getElementById('password-konfirmasi').value;
  const btn = document.getElementById('btn-submit-pwd');

  if (pwdBaru.length < 6) {
    showToast('Kata sandi baru minimal 6 karakter', 'error');
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

  // Mengambil data terkini agar field wajib seperti nama & identifier tetap terjaga saat update
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
      password: pwdBaru
    })
  });

  btn.disabled = false;
  btn.innerText = 'Simpan Kata Sandi Baru';

  if (res && res.success) {
    showToast('Kata sandi berhasil diperbarui');
    document.getElementById('form-password').reset();
  } else {
    showToast(res ? res.message : 'Gagal memperbarui kata sandi', 'error');
  }
}
