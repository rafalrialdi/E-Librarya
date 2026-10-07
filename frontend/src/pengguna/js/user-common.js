const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000/api' : `${window.location.protocol}//${window.location.hostname}:3000/api`;
const CACHE_TTL = 10 * 60 * 1000; // 10 menit

(function guard() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '../../login/html/login (1).html';
  }
})();

// Cache Versioning System (10 menit TTL)
function getResourceKey(endpoint) {
  const clean = endpoint.split('?')[0].replace(/^\//, '');
  return clean.split('/')[0] || 'root';
}

function getCacheVersion(resourceKey) {
  try {
    const stored = localStorage.getItem(`cache_ver_${resourceKey}`);
    const timestamp = localStorage.getItem(`cache_ts_${resourceKey}`);
    if (stored && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      if (age < CACHE_TTL) return stored;
    }
    // Expired or not exist - generate new
    const newVer = Date.now().toString();
    localStorage.setItem(`cache_ver_${resourceKey}`, newVer);
    localStorage.setItem(`cache_ts_${resourceKey}`, Date.now().toString());
    return newVer;
  } catch (e) {
    return Date.now().toString();
  }
}

function invalidateCache(endpoint) {
  const key = getResourceKey(endpoint);
  const newVer = Date.now().toString();
  try {
    localStorage.setItem(`cache_ver_${key}`, newVer);
    localStorage.setItem(`cache_ts_${key}`, Date.now().toString());
    // Also invalidate related resources
    const allResources = ['dashboard', 'buku', 'kategori-buku', 'mata-pelajaran', 'kategori-kelas', 'peminjaman', 'pengguna', 'profil', 'riwayat-baca'];
    allResources.forEach(r => {
      localStorage.setItem(`cache_ver_${r}`, newVer);
      localStorage.setItem(`cache_ts_${r}`, Date.now().toString());
    });
  } catch (e) {}
}

async function fetchUserAPI(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const resourceKey = getResourceKey(endpoint);

  const config = {
    cache: isGet ? 'default' : 'no-store',
    ...options,
    headers
  };

  try {
    const version = getCacheVersion(resourceKey);
    const requestUrl = isGet
      ? `${API_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}v=${version}`
      : `${API_BASE}${endpoint}`;

    const response = await fetch(requestUrl, config);
    const data = await response.json();
    
    if (response.status === 401 || response.status === 403) { 
      localStorage.clear(); 
      window.location.href = '../../login/html/login (1).html'; 
      return null; 
    }
    
    if (!isGet && response.ok) {
      invalidateCache(endpoint);
    }
    
    return data;
  } catch (error) { 
    showUserToast('Server belum dapat dihubungi', 'error'); 
    return null; 
  }
}

function renderNav(active) {
  const nav = document.getElementById('user-nav');
  if (!nav) return;
  const name = localStorage.getItem('nama') || 'Pengguna';
  const role = localStorage.getItem('role') === 'guru' ? 'Guru' : localStorage.getItem('role') === 'admin' ? 'Admin' : 'Siswa';
  const identifier = localStorage.getItem('identifier') || 'Nomor identitas pengguna';
  const email = localStorage.getItem('email') || 'Email belum diisi';
  nav.innerHTML = `<div class="nav-inner"><a class="brand" href="dashboard.html"><img src="../../../assset/logosekolah.jpeg" alt="Logo MTs Al-Falah"><span><strong>E-Library MTs Al-Falah Klender</strong><small>Portal Literasi Digital Madrasah</small></span></a><div class="nav-links"><a class="${active === 'dashboard' ? 'active' : ''}" href="dashboard.html">Beranda</a><a class="${active === 'katalog' ? 'active' : ''}" href="katalog.html">Buku</a><a class="${active === 'peminjaman' ? 'active' : ''}" href="peminjaman.html">Peminjaman</a></div><div class="nav-user"><button class="icon-button" data-has-notifications="false" aria-label="Notifikasi" onclick="toggleNotifications()"><span class="material-symbols-outlined">notifications</span><i id="notification-dot" style="display:none"></i></button><button class="profile-trigger" onclick="toggleUserMenu()"><img src="../../../assset/iconpengguna.svg" alt="Profil"><span>${name}</span><span class="material-symbols-outlined">expand_more</span></button><div class="user-menu profile-menu" id="user-menu"><div class="profile-menu-head"><strong>${name}</strong><span class="role-chip">${role}</span><small>NIP: ${identifier}</small><small>${email}</small></div><a href="profil.html"><span class="material-symbols-outlined">account_circle</span> Profil & Ganti Password</a><button onclick="logoutUser()"><span class="material-symbols-outlined">logout</span> Keluar / Logout</button></div><div class="notification-popover" id="notification-popover"><div class="notification-head"><strong>Notifikasi</strong><span id="notification-count" style="display:none"></span></div><div id="notification-content"></div></div></div></div>`;
  
  loadProfileDetails().then(() => startNotifPolling());
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
  const rejected = loans.filter(item => item.status === 'ditolak');
  
  const dot = document.getElementById('notification-dot');
  const count = document.getElementById('notification-count');
  const content = document.getElementById('notification-content');
  const button = document.querySelector('.icon-button');
  const popover = document.getElementById('notification-popover');
  
  if (!dot || !count || !content || !button || !popover) return;
  
  const allNotifications = [
    ...approved.map(item => ({ ...item, notifType: 'disetujui' })),
    ...rejected.map(item => ({ ...item, notifType: 'ditolak' }))
  ];
  
  const activeNotifications = allNotifications.filter(notif => {
    const notifId = `notif_${notif.id_peminjaman}`;
    const viewedAt = localStorage.getItem(notifId);
    if (viewedAt) {
      const elapsed = Date.now() - parseInt(viewedAt);
      return elapsed < 24 * 60 * 60 * 1000;
    }
    return true;
  });
  
  if (!activeNotifications.length) {
    button.dataset.hasNotifications = 'false';
    dot.style.display = 'none';
    count.style.display = 'none';
    content.innerHTML = '<div style="padding: 20px; text-align: center; color: #64748b; font-size: 13px;">Tidak ada notifikasi baru</div>';
    popover.style.pointerEvents = 'none';
    return;
  }
  
  button.dataset.hasNotifications = 'true';
  dot.style.display = 'block';
  count.style.display = 'inline-block';
  count.textContent = `${activeNotifications.length} Baru`;
  popover.style.pointerEvents = 'auto';
  
  const item = activeNotifications[0];
  
  if (item.notifType === 'disetujui') {
    content.innerHTML = `<div class="notification-item"><span class="material-symbols-outlined">check_circle</span><div><strong>Peminjaman Disetujui!</strong><p>Permohonan peminjaman buku "${item.judul_buku}" telah disetujui Admin. Silakan ambil buku di perpustakaan.</p><a href="peminjaman.html">Lihat Peminjaman Saya <span class="material-symbols-outlined">arrow_forward</span></a></div></div>`;
  } else {
    content.innerHTML = `<div class="notification-item"><span class="material-symbols-outlined" style="color: #ef4444;">cancel</span><div><strong>Peminjaman Ditolak</strong><p>Permohonan peminjaman buku "${item.judul_buku}" ditolak Admin.${item.catatan_admin ? ` Alasan: ${item.catatan_admin}` : ''}</p><a href="peminjaman.html">Lihat Peminjaman Saya <span class="material-symbols-outlined">arrow_forward</span></a></div></div>`;
  }
  
  popover.addEventListener('mouseenter', function markAsViewed() {
    activeNotifications.forEach(notif => {
      const notifId = `notif_${notif.id_peminjaman}`;
      if (!localStorage.getItem(notifId)) {
        localStorage.setItem(notifId, Date.now().toString());
      }
    });
    popover.removeEventListener('mouseenter', markAsViewed);
  }, { once: true });
}
function logoutUser() { stopNotifPolling(); localStorage.clear(); window.location.href = '../../login/html/login (1).html'; }
function showUserToast(message, type = 'success') { let box = document.getElementById('user-toast'); if (!box) { box = document.createElement('div'); box.id = 'user-toast'; document.body.appendChild(box); } const item = document.createElement('div'); item.className = `toast ${type}`; item.textContent = message; box.appendChild(item); setTimeout(() => item.remove(), 3200); }
function formatUserDate(value) { return value ? new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'; }
function coverUrl(url) { return url || ''; }
function bookCard(book) { return `<article class="book-card"><a href="detail.html?id=${book.id}" class="cover-frame"><img src="${coverUrl(book.cover_url)}" alt="Sampul ${book.judul}"></a><div class="book-card-body"><span class="book-tag">${book.nama_kategori || book.nama_mata_pelajaran || 'Koleksi'}</span><h3><a href="detail.html?id=${book.id}">${book.judul}</a></h3><p>${book.penulis || 'Penulis tidak tercantum'}</p><a class="text-link" href="detail.html?id=${book.id}">Lihat buku <span class="material-symbols-outlined">arrow_forward</span></a></div></article>`; }
function statusBadge(status) { const labels = { menunggu: 'Menunggu', disetujui: 'Sedang dipinjam', ditolak: 'Ditolak', dikembalikan: 'Dikembalikan' }; return `<span class="status status-${status}">${labels[status] || status}</span>`; }
document.addEventListener('click', event => {
  if (!event.target.closest('.nav-user')) {
    document.getElementById('user-menu')?.classList.remove('open');
    document.getElementById('notification-popover')?.classList.remove('open');
  }
});

// ===== NOTIFIKASI POLLING & RENDER =====
let notifPollingInterval = null;

async function fetchUnreadCount() {
  try {
    const res = await fetchUserAPI('/pengguna/notifikasi/count?unread=true');
    if (res?.success && typeof res.count === 'number') {
      updateNotifBadge(res.count);
    } else {
      hideNotifBadge();
    }
  } catch (e) { console.warn('Notif poll error', e); }
}

function updateNotifBadge(count) {
  const dot = document.getElementById('notification-dot');
  const countEl = document.getElementById('notification-count');
  const button = document.querySelector('.icon-button');
  if (!dot || !countEl || !button) return;
  
  if (count > 0) {
    button.dataset.hasNotifications = 'true';
    dot.style.display = 'block';
    countEl.style.display = 'inline-block';
    countEl.textContent = `${count} Baru`;
  } else {
    hideNotifBadge();
  }
}

function hideNotifBadge() {
  const dot = document.getElementById('notification-dot');
  const countEl = document.getElementById('notification-count');
  const button = document.querySelector('.icon-button');
  const popover = document.getElementById('notification-popover');
  if (dot) dot.style.display = 'none';
  if (countEl) countEl.style.display = 'none';
  if (button) button.dataset.hasNotifications = 'false';
  if (popover) popover.style.pointerEvents = 'none';
}

async function fetchAndRenderNotifications() {
  try {
    const res = await fetchUserAPI('/pengguna/notifikasi?is_read=false');
    if (res?.success && Array.isArray(res.data)) {
      renderLoanNotifications(res.data);
    } else {
      renderLoanNotifications([]);
    }
  } catch (e) { console.warn('Fetch notifications error', e); }
}

function renderLoanNotifications(notifications = []) {
  const dot = document.getElementById('notification-dot');
  const count = document.getElementById('notification-count');
  const content = document.getElementById('notification-content');
  const button = document.querySelector('.icon-button');
  const popover = document.getElementById('notification-popover');
  const notifHead = document.querySelector('.notification-head');
  
  if (!dot || !count || !content || !button || !popover) return;
  
  const activeNotifications = notifications.filter(notif => {
    const notifId = `notif_${notif.id_peminjaman}`;
    const viewedAt = localStorage.getItem(notifId);
    if (viewedAt) {
      const elapsed = Date.now() - parseInt(viewedAt);
      return elapsed < 24 * 60 * 60 * 1000;
    }
    return true;
  });
  
  if (!activeNotifications.length) {
    button.dataset.hasNotifications = 'false';
    dot.style.display = 'none';
    count.style.display = 'none';
    content.innerHTML = '<div style="padding: 20px; text-align: center; color: #64748b; font-size: 13px;">Tidak ada notifikasi baru</div>';
    popover.style.pointerEvents = 'none';
    if (notifHead) notifHead.innerHTML = '<strong>Notifikasi</strong><span id="notification-count" style="display:none"></span>';
    return;
  }
  
  button.dataset.hasNotifications = 'true';
  dot.style.display = 'block';
  count.style.display = 'inline-block';
  count.textContent = `${activeNotifications.length} Baru`;
  popover.style.pointerEvents = 'auto';
  
  if (notifHead) {
    notifHead.innerHTML = `<strong>Notifikasi</strong><span id="notification-count" style="display:inline-block">${activeNotifications.length} Baru</span><button class="mark-all-read-btn" onclick="markAllNotificationsAsRead()" style="margin-left:8px;padding:2px 8px;font-size:11px;background:var(--bg-input);border:1px solid var(--border-default);border-radius:4px;color:var(--text-secondary);cursor:pointer;">Tandai semua dibaca</button>`;
  }
  
  content.innerHTML = activeNotifications.map(item => {
    const notifId = item.id_notifikasi || item.id;
    const isApproved = item.status === 'disetujui';
    return `
      <div class="notification-item" data-notif-id="${notifId}">
        <span class="material-symbols-outlined" style="color:${isApproved ? 'var(--tertiary)' : 'var(--error)'}">${isApproved ? 'check_circle' : 'cancel'}</span>
        <div class="notif-text">
          <strong>${isApproved ? 'Peminjaman Disetujui!' : 'Peminjaman Ditolak'}</strong>
          <p>Permohonan peminjaman buku "${item.judul_buku}" ${isApproved ? 'telah disetujui Admin. Silakan ambil buku di perpustakaan.' : `ditolak Admin.${item.catatan_admin ? ` Alasan: ${item.catatan_admin}` : ''}`}</p>
        </div>
        <div class="notif-actions">
          <a href="peminjaman.html" class="notif-link">Lihat <span class="material-symbols-outlined">arrow_forward</span></a>
          <button class="notif-mark-read" onclick="markNotificationAsRead('${notifId}')" title="Tandai dibaca"><span class="material-symbols-outlined">done</span></button>
        </div>
      </div>
    `;
  }).join('');
  
  popover.addEventListener('mouseenter', function markAsViewed() {
    activeNotifications.forEach(notif => {
      const notifId = `notif_${notif.id_peminjaman}`;
      if (!localStorage.getItem(notifId)) {
        localStorage.setItem(notifId, Date.now().toString());
      }
    });
    popover.removeEventListener('mouseenter', markAsViewed);
  }, { once: true });
}

async function markNotificationAsRead(notifId) {
  try {
    const res = await fetchUserAPI(`/pengguna/notifikasi/${notifId}/baca`, { method: 'PUT' });
    if (res?.success) {
      await Promise.all([fetchUnreadCount(), fetchAndRenderNotifications()]);
      localStorage.setItem('notif_sync', Date.now().toString());
    }
  } catch (e) { console.error('Mark read failed', e); }
}

async function markAllNotificationsAsRead() {
  try {
    const res = await fetchUserAPI('/pengguna/notifikasi/baca-semua', { method: 'PUT' });
    if (res?.success) {
      await Promise.all([fetchUnreadCount(), fetchAndRenderNotifications()]);
      localStorage.setItem('notif_sync', Date.now().toString());
    }
  } catch (e) { console.error('Mark all read failed', e); }
}

window.addEventListener('storage', (e) => {
  if (e.key === 'notif_sync') {
    fetchUnreadCount();
    fetchAndRenderNotifications();
  }
});

function startNotifPolling() {
  if (notifPollingInterval) return;
  fetchUnreadCount();
  fetchAndRenderNotifications();
  notifPollingInterval = setInterval(() => {
    fetchUnreadCount();
    fetchAndRenderNotifications();
  }, 100000);
}

function stopNotifPolling() {
  if (notifPollingInterval) {
    clearInterval(notifPollingInterval);
    notifPollingInterval = null;
  }
  hideNotifBadge();
}

function clearOldNotificationKeys() {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('notif_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {}
}

window.stopNotifPolling = stopNotifPolling;
window.fetchAndRenderNotifications = fetchAndRenderNotifications;
window.markNotificationAsRead = markNotificationAsRead;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;