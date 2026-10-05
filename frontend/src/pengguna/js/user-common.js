const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000/api' : `${window.location.protocol}//${window.location.hostname}:3000/api`;
(function guard() {
  const token = localStorage.getItem('token');
  if (!token) window.location.href = '../../login/html/login (1).html';
})();

async function fetchUserAPI(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers, cache: options.method && options.method !== 'GET' ? 'no-store' : 'default' });
    const data = await response.json();
    if (response.status === 401 || response.status === 403) { localStorage.clear(); window.location.href = '../../login/html/login (1).html'; return null; }
    return data;
  } catch (error) { showUserToast('Server belum dapat dihubungi', 'error'); return null; }
}

function renderNav(active) {
  const nav = document.getElementById('user-nav');
  if (!nav) return;
  const name = localStorage.getItem('nama') || 'Pengguna';
  const role = localStorage.getItem('role') === 'guru' ? 'Guru' : localStorage.getItem('role') === 'admin' ? 'Admin' : 'Siswa';
  const identifier = localStorage.getItem('identifier') || 'Nomor identitas pengguna';
  const email = localStorage.getItem('email') || 'Email belum diisi';
  nav.innerHTML = `<div class="nav-inner"><a class="brand" href="dashboard.html"><img src="../../../assset/logosekolah.jpeg" alt="Logo MTs Al-Falah"><span><strong>E-Library MTs Al-Falah Klender</strong><small>Portal Literasi Digital Madrasah</small></span></a><div class="nav-links"><a class="${active === 'dashboard' ? 'active' : ''}" href="dashboard.html">Beranda</a><a class="${active === 'katalog' ? 'active' : ''}" href="katalog.html">Buku</a><a class="${active === 'peminjaman' ? 'active' : ''}" href="peminjaman.html">Peminjaman</a></div><div class="nav-user"><button class="icon-button" data-has-notifications="false" aria-label="Notifikasi" onclick="toggleNotifications()"><span class="material-symbols-outlined">notifications</span><i id="notification-dot" style="display:none"></i></button><button class="profile-trigger" onclick="toggleUserMenu()"><img src="../../../assset/iconpengguna.svg" alt="Profil"><span>${name}</span><span class="material-symbols-outlined">expand_more</span></button><div class="user-menu profile-menu" id="user-menu"><div class="profile-menu-head"><strong>${name}</strong><span class="role-chip">${role}</span><small>NIP: ${identifier}</small><small>${email}</small></div><a href="profil.html"><span class="material-symbols-outlined">account_circle</span> Profil & Ganti Password</a><button onclick="logoutUser()"><span class="material-symbols-outlined">logout</span> Keluar / Logout</button></div><div class="notification-popover" id="notification-popover"><div class="notification-head"><strong>Notifikasi</strong><span id="notification-count" style="display:none"></span></div><div id="notification-content"></div></div></div></div>`;
}
async function loadProfileDetails() {
  const res = await fetchUserAPI('/pengguna/profil/saya');
  if (!res?.success) return null;
  const user = res.data;
  localStorage.setItem('nama', user.nama || 'Pengguna');
  localStorage.setItem('identifier', user.identifier || '');
  localStorage.setItem('email', user.email || '');
  const head = document.querySelector('.profile-menu-head');
  if (head) head.innerHTML = `<strong>${user.nama || 'Pengguna'}</strong><span class="role-chip">${user.role === 'guru' ? 'Guru' : user.role === 'admin' ? 'Admin' : 'Siswa'}</span><small>NIP: ${user.identifier || '-'}</small><small>${user.email || 'Email belum diisi'}</small>`;
  const triggerName = document.querySelector('.profile-trigger > span:not(.material-symbols-outlined)');
  if (triggerName) triggerName.textContent = user.nama || 'Pengguna';
  return user;
}
function renderFooter() { const footer = document.getElementById('site-footer'); if (footer) footer.innerHTML = `<div class="user-footer-inner"><strong>Sistem Informasi Perpustakaan Digital MTs Al-Falah Klender Terakreditasi · Berbasis Kurikulum Kementerian Agama RI</strong><span>© 2026 MTs Al-Falah Klender Jakarta Timur. Hak Cipta Dilindungi Undang-Undang.</span></div>`; }
function toggleUserMenu() { document.getElementById('user-menu')?.classList.toggle('open'); document.getElementById('notification-popover')?.classList.remove('open'); }
function toggleNotifications() {
  const button = document.querySelector('.icon-button');
  document.getElementById('notification-popover')?.classList.toggle('open');
  document.getElementById('user-menu')?.classList.remove('open');
}
function renderLoanNotifications(loans = []) {
  const approved = loans.filter(item => item.status === 'disetujui');
  const dot = document.getElementById('notification-dot');
  const count = document.getElementById('notification-count');
  const content = document.getElementById('notification-content');
  const button = document.querySelector('.icon-button');
  if (!dot || !count || !content || !button) return;
  if (!approved.length) { button.dataset.hasNotifications = 'false'; dot.style.display = 'none'; count.style.display = 'none'; content.innerHTML = ''; return; }
  dot.style.display = 'block'; count.style.display = 'inline-block'; count.textContent = `${approved.length} Baru`; const item = approved[0];
  content.innerHTML = `<div class="notification-item"><span class="material-symbols-outlined">check_circle</span><div><strong>Peminjaman Disetujui!</strong><p>Permohonan peminjaman buku "${item.judul_buku}" telah disetujui Admin. Silakan ambil buku di perpustakaan.</p><a href="peminjaman.html">Lihat Peminjaman Saya <span class="material-symbols-outlined">arrow_forward</span></a></div></div>`;
}
function logoutUser() { localStorage.clear(); window.location.href = '../../login/html/login (1).html'; }
function showUserToast(message, type = 'success') { let box = document.getElementById('user-toast'); if (!box) { box = document.createElement('div'); box.id = 'user-toast'; document.body.appendChild(box); } const item = document.createElement('div'); item.className = `toast ${type}`; item.textContent = message; box.appendChild(item); setTimeout(() => item.remove(), 3200); }
function formatUserDate(value) { return value ? new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'; }
function coverUrl(url) { return url || '../../../assset/logosekolah.jpeg'; }
function bookCard(book) { return `<article class="book-card"><a href="detail.html?id=${book.id}" class="cover-frame"><img src="${coverUrl(book.cover_url)}" alt="Sampul ${book.judul}"></a><div class="book-card-body"><span class="book-tag">${book.nama_kategori || book.nama_mata_pelajaran || 'Koleksi'}</span><h3><a href="detail.html?id=${book.id}">${book.judul}</a></h3><p>${book.penulis || 'Penulis tidak tercantum'}</p><a class="text-link" href="detail.html?id=${book.id}">Lihat buku <span class="material-symbols-outlined">arrow_forward</span></a></div></article>`; }
function statusBadge(status) { const labels = { menunggu: 'Menunggu', disetujui: 'Sedang dipinjam', ditolak: 'Ditolak', dikembalikan: 'Dikembalikan' }; return `<span class="status status-${status}">${labels[status] || status}</span>`; }
document.addEventListener('click', event => {
  if (!event.target.closest('.nav-user')) {
    document.getElementById('user-menu')?.classList.remove('open');
    document.getElementById('notification-popover')?.classList.remove('open');
  }
});
