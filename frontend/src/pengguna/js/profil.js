document.addEventListener('DOMContentLoaded', async () => {
  renderNav('profil');
  renderFooter();
  const res = await fetchUserAPI('/pengguna/profil/saya');
  if (!res?.success) { showUserToast('Profil tidak dapat dimuat', 'error'); return; }
  const user = res.data;
  document.getElementById('user-name').textContent = user.nama;
  document.getElementById('user-role').textContent = user.role === 'siswa' ? 'Siswa' : 'Guru';
  document.getElementById('user-email').textContent = user.email || '-';
  document.getElementById('user-kelas').textContent = user.nama_kelas || '-';
  document.getElementById('user-status').textContent = user.status_aktif ? 'Aktif' : 'Tidak aktif';
  document.getElementById('user-status').className = 'status ' + (user.status_aktif ? 'status-disetujui' : 'status-ditolak');
  document.getElementById('profile-pic').src = user.foto_url ? user.foto_url : '../../../assset/iconpengguna.svg';
  document.getElementById('edit-name').value = user.nama;
  document.getElementById('edit-email').value = user.email || '';
});
document.getElementById('save-profile').addEventListener('click', async () => {
  const nama = document.getElementById('edit-name').value.trim();
  const email = document.getElementById('edit-email').value.trim();
  if (!nama) { showUserToast('Nama tidak boleh kosong', 'error'); return; }
  document.getElementById('save-profile').disabled = true;
  document.getElementById('save-profile').innerHTML = '<span class="spinner"></span> Menyimpan...';
  const res = await fetchUserAPI('/pengguna/profil/saya', { method: 'PUT', body: JSON.stringify({ nama, email }) });
  document.getElementById('save-profile').disabled = false;
  document.getElementById('save-profile').textContent = 'Simpan';
  if (res?.success) { showUserToast('Profil berhasil diperbarui', 'success'); localStorage.setItem('nama', nama); document.getElementById('user-name').textContent = nama; } else showUserToast(res?.message || 'Gagal memperbarui profil', 'error');
});
document.getElementById('save-password').addEventListener('click', async () => {
  const current = document.getElementById('current-password').value;
  const newPass = document.getElementById('new-password').value;
  const confirmPass = document.getElementById('confirm-password').value;
  if (!current || !newPass) { showUserToast('Isi kata sandi lama dan baru', 'error'); return; }
  if (newPass.length < 8 || !/[A-Za-z]/.test(newPass) || !/[0-9]/.test(newPass)) { showUserToast('Kata sandi baru minimal 8 karakter dan harus mengandung huruf serta angka', 'error'); return; }
  if (newPass !== confirmPass) { showUserToast('Konfirmasi kata sandi tidak cocok', 'error'); return; }
  document.getElementById('save-password').disabled = true;
  document.getElementById('save-password').innerHTML = '<span class="spinner"></span> Mengganti...';
  const res = await fetchUserAPI('/pengguna/profil/saya', { method: 'PUT', body: JSON.stringify({ password: newPass, current_password: current }) });
  document.getElementById('save-password').disabled = false;
  document.getElementById('save-password').textContent = 'Ganti Kata Sandi';
  if (res?.success) { showUserToast('Kata sandi berhasil diganti', 'success'); document.getElementById('change-password-form').reset(); } else showUserToast(res?.message || 'Gagal mengganti kata sandi', 'error');
});
