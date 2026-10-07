document.addEventListener('DOMContentLoaded', async () => {
  renderNav('');
  renderFooter();
  await loadProfileData();
  await fetchAndRenderNotifications();
  
  document.getElementById('new-password').addEventListener('input', validatePassword);
  document.getElementById('confirm-password').addEventListener('input', validatePassword);
});

async function loadProfileData() {
  const res = await fetchUserAPI('/pengguna/profil/saya');
  
  if (!res?.success) {
    showUserToast('Gagal memuat data profil', 'error');
    return;
  }
  
  const user = res.data;
  
  document.getElementById('profile-name').textContent = user.nama || 'Pengguna';
  document.getElementById('profile-nip').textContent = user.identifier || '-';
  document.getElementById('profile-email').textContent = user.email || '-';
  
  const role = user.role || localStorage.getItem('role');
  const badgesHtml = [];
  
  if (role === 'guru') {
    badgesHtml.push('<span class="badge-role badge-guru">Guru</span>');
  } else if (role === 'admin') {
    badgesHtml.push('<span class="badge-role badge-admin">Admin</span>');
  } else {
    badgesHtml.push('<span class="badge-role badge-siswa">Siswa</span>');
    document.getElementById('nip-label').textContent = 'Nomor Induk Siswa (NIS)';
  }
  
  badgesHtml.push('<span class="badge-role badge-active">Aktif</span>');
  document.getElementById('profile-badges').innerHTML = badgesHtml.join('');
}

function validatePassword() {
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
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

async function handlePasswordChange(e) {
  e.preventDefault();
  
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  if (newPassword.length < 8) {
    showUserToast('Kata sandi baru minimal 8 karakter', 'error');
    return;
  }
  
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  if (!hasLetter || !hasNumber) {
    showUserToast('Kata sandi harus kombinasi huruf dan angka', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showUserToast('Konfirmasi kata sandi tidak cocok', 'error');
    return;
  }
  
  const btnSubmit = document.getElementById('btn-submit');
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span><span>Menyimpan...</span>';
  
  const res = await fetchUserAPI('/pengguna/profil/saya', {
    method: 'PUT',
    body: JSON.stringify({
      nama: document.getElementById('profile-name').textContent,
      email: document.getElementById('profile-email').textContent,
      password: newPassword,
      current_password: currentPassword
    })
  });
  
  btnSubmit.disabled = false;
  btnSubmit.innerHTML = '<span class="material-symbols-outlined">save</span><span>Simpan Perubahan Kata Sandi</span>';
  
  if (res?.success) {
    showUserToast('Kata sandi berhasil diubah', 'success');
    resetForm();
  } else {
    showUserToast(res?.message || 'Gagal mengubah kata sandi', 'error');
  }
}

function togglePasswordVisibility(inputId, icon) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    icon.textContent = 'visibility_off';
  } else {
    input.type = 'password';
    icon.textContent = 'visibility';
  }
}

function resetForm() {
  document.getElementById('form-password').reset();
  document.querySelectorAll('.requirement-item').forEach(item => {
    item.classList.remove('valid');
  });
}