/**
 * E-Library MTs Al-Falah Klender - Shared Admin Module
 */

const API_BASE = 'http://localhost:3000/api';

// 1. Auth Guard: Validasi Sesi & Role Admin
(function initAuthGuard() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token || role !== 'admin') {
    localStorage.clear();
    window.location.href = '../../login/html/login (1).html';
  }
})();

// 2. Fetch Wrapper dengan Authorization Header
async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const defaultHeaders = {
    'Authorization': `Bearer ${token}`
  };

  // Jangan set Content-Type jika mengirim FormData
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    if (res.status === 401 || res.status === 403) {
      showToast('Sesi telah berakhir atau akses ditolak', 'error');
      setTimeout(() => {
        localStorage.clear();
        window.location.href = '../../login/html/login (1).html';
      }, 1000);
      return null;
    }
    const data = await res.json();
    if (!res.ok) {
      console.warn(`[API] Endpoint ${endpoint} returned ${res.status}:`, data);
    }
    return data;
  } catch (err) {
    console.error('API Error:', err);
    showToast('Gagal terhubung ke server', 'error');
    return null;
  }
}

// 3. Render Komponen Sidebar Terpadu
function initSidebar(activeMenuKey) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const menus = [
    { key: 'dashboard', label: 'Dashboard Admin', icon: 'dashboard', href: 'dashboard.html' },
    { key: 'portal', label: 'Dashboard Guru & Siswa', icon: 'auto_stories', href: '../../pengguna/html/dashboard.html' },
    { key: 'buku', label: 'Manajemen Buku', icon: 'menu_book', href: 'buku.html' },
    { key: 'pengguna', label: 'Manajemen Pengguna', icon: 'group', href: 'pengguna.html' },
    { key: 'kategori-buku', label: 'Kategori Buku', icon: 'category', href: 'kategori-buku.html' },
    { key: 'mata-pelajaran', label: 'Mata Pelajaran', icon: 'school', href: 'mata-pelajaran.html' },
    { key: 'kategori-kelas', label: 'Kategori Kelas', icon: 'meeting_room', href: 'kategori-kelas.html' },
    { key: 'peminjaman', label: 'Peminjaman', icon: 'sync_alt', href: 'peminjaman.html' },
    { key: 'profil', label: 'Profil', icon: 'account_circle', href: 'profil.html' },
    { key: 'logout', label: 'Logout', icon: 'logout', href: '#', isLogout: true }
  ];

  sidebar.className = 'sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <img src="../../../assset/logosekolah.jpeg" alt="Logo" class="sidebar-logo">
      <div class="sidebar-brand">
        <h1>E-Library</h1>
        <p>MTs Al-Falah Klender</p>
      </div>
    </div>
    <nav class="sidebar-nav">
      ${menus.map(m => `
        <a href="${m.href}" class="nav-link ${m.key === activeMenuKey ? 'active' : ''}" ${m.isLogout ? 'onclick="openLogoutModal(event)"' : ''}>
          <span class="material-symbols-outlined">${m.icon}</span>
          <span>${m.label}</span>
        </a>
      `).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="server-status">
        <span class="status-dot"></span>
        <span>Server MTs Online v0.1</span>
      </div>
    </div>
  `;
}

// 4. Inisialisasi Header
function initHeader(pageTitle, pageBadge = 'Admin Console', pageDesc = '') {
  const header = document.getElementById('top-header');
  if (!header) return;

  const adminName = localStorage.getItem('nama') || 'Administrator';

  header.className = 'top-header';
  header.innerHTML = `
    <div class="header-title-box">
      <div class="header-title-row">
        <h2 class="header-title">${pageTitle}</h2>
        <span class="header-badge">${pageBadge}</span>
      </div>
      ${pageDesc ? `<p class="header-subtitle">${pageDesc}</p>` : ''}
    </div>
    <div class="header-actions">
      <a href="profil.html" class="user-pill">
        <img src="../../../assset/iconpengguna.svg" alt="Avatar" class="user-avatar">
        <div class="user-info-text">
          <span class="user-name">${adminName}</span>
          <span class="user-role">ADMIN</span>
        </div>
      </a>
    </div>
  `;
}

// 5. Toast Notification System
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? 'check_circle' : 'error';
  toast.innerHTML = `
    <span class="material-symbols-outlined">${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3200);
}

// 6. Modal Helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

// 7. Global Logout Modal
function openLogoutModal(e) {
  if (e) e.preventDefault();
  openModal('modal-logout');
}

function confirmLogout() {
  localStorage.clear();
  window.location.href = '../../login/html/login (1).html';
}

// Helper Format Tanggal
function formatDate(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}
