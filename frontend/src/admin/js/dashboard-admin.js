const API_URL = 'http://localhost:3000/api';
const menuButton = document.querySelector('#menu-button');
const sidebarBackdrop = document.querySelector('#sidebar-backdrop');
const logoutButton = document.querySelector('#logout-button');
const dateLabel = document.querySelector('#current-date');
const syncLabel = document.querySelector('#dashboard-sync');
const loansList = document.querySelector('#loans-list');
const chartEmpty = document.querySelector('#chart-empty');
const chartVisual = document.querySelector('#chart-visual');

const statFieldNames = [
  'total_buku',
  'total_buku_digital',
  'total_buku_fisik',
  'total_guru',
  'total_siswa',
  'total_peminjaman'
];

const formatNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat('id-ID').format(number)
    : '—';
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).format(date);
};

const setEmptyState = (title, description) => {
  if (!loansList) return;
  loansList.replaceChildren();
  const empty = document.createElement('div');
  empty.className = 'loans-empty';
  empty.setAttribute('role', 'status');
  const icon = document.createElement('span');
  icon.className = 'empty-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '▤';
  const heading = document.createElement('strong');
  heading.textContent = title;
  const message = document.createElement('span');
  message.textContent = description;
  empty.append(icon, heading, message);
  loansList.append(empty);
};

const createLoanCard = (peminjaman) => {
  const card = document.createElement('article');
  card.className = 'loan-card';

  const cover = document.createElement('img');
  cover.className = 'loan-cover';
  cover.alt = peminjaman.judul ? `Sampul ${peminjaman.judul}` : 'Sampul buku';
  cover.src = peminjaman.cover_url || '../../../assset/logosekolah.jpeg';
  cover.addEventListener('error', () => {
    cover.src = '../../../assset/logosekolah.jpeg';
  }, { once: true });

  const details = document.createElement('div');
  details.className = 'loan-details';
  const status = document.createElement('span');
  status.className = 'loan-status';
  status.textContent = peminjaman.status || 'disetujui';
  const title = document.createElement('h3');
  title.textContent = peminjaman.judul || 'Judul buku tidak tersedia';
  const borrower = document.createElement('p');
  borrower.className = 'loan-borrower';
  borrower.textContent = peminjaman.nama || 'Nama peminjam tidak tersedia';
  const role = document.createElement('span');
  role.className = 'loan-role';
  role.textContent = peminjaman.role || 'Pengguna';
  details.append(status, title, borrower, role);

  const dates = document.createElement('div');
  dates.className = 'loan-dates';
  const borrowed = document.createElement('div');
  const borrowedLabel = document.createElement('span');
  borrowedLabel.textContent = 'Tanggal pinjam';
  const borrowedDate = document.createElement('strong');
  borrowedDate.textContent = formatDate(peminjaman.tgl_pinjam);
  borrowed.append(borrowedLabel, borrowedDate);
  const due = document.createElement('div');
  const dueLabel = document.createElement('span');
  dueLabel.textContent = 'Jatuh tempo';
  const dueDate = document.createElement('strong');
  dueDate.textContent = formatDate(peminjaman.tgl_jatuh_tempo);
  due.append(dueLabel, dueDate);
  dates.append(borrowed, due);

  card.append(cover, details, dates);
  return card;
};

const renderLoans = (peminjamanAktif = []) => {
  if (!loansList) return;
  if (!Array.isArray(peminjamanAktif) || peminjamanAktif.length === 0) {
    setEmptyState('Tidak ada peminjaman aktif', 'Peminjaman yang disetujui dan belum dikembalikan akan muncul di sini.');
    return;
  }

  const sortedLoans = [...peminjamanAktif].sort((a, b) => {
    const dueA = new Date(a.tgl_jatuh_tempo || 0).getTime();
    const dueB = new Date(b.tgl_jatuh_tempo || 0).getTime();
    return dueA - dueB;
  });
  loansList.replaceChildren(...sortedLoans.map(createLoanCard));
};

const createSvgElement = (name, attributes = {}) => {
  const element = document.createElementNS('http://www.w3.org/2000/svg', name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
};

const renderMonthlyChart = (monthlyData = []) => {
  if (!chartVisual || !chartEmpty || !Array.isArray(monthlyData) || monthlyData.length === 0) return;

  const months = monthlyData.slice(-12);
  const width = 960;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 35, left: 42 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(1, ...months.flatMap((month) => [
    Number(month.jumlah_siswa) || 0,
    Number(month.jumlah_guru) || 0
  ]));
  const x = (index) => padding.left + (months.length < 2 ? chartWidth / 2 : (index / (months.length - 1)) * chartWidth);
  const y = (value) => padding.top + chartHeight - ((Number(value) || 0) / maxValue) * chartHeight;
  const svg = createSvgElement('svg', {
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-label': 'Grafik jumlah peminjaman bulanan untuk siswa dan guru'
  });

  for (let index = 0; index < 4; index += 1) {
    const gridY = padding.top + (chartHeight / 3) * index;
    svg.append(createSvgElement('line', {
      x1: padding.left, y1: gridY, x2: width - padding.right, y2: gridY,
      class: 'chart-grid-line'
    }));
  }

  const lines = [
    { field: 'jumlah_siswa', className: 'student-line' },
    { field: 'jumlah_guru', className: 'teacher-line' }
  ];
  lines.forEach(({ field, className }) => {
    const points = months.map((month, index) => `${x(index)},${y(month[field])}`).join(' ');
    svg.append(createSvgElement('polyline', { points, class: className }));
    months.forEach((month, index) => {
      svg.append(createSvgElement('circle', {
        cx: x(index), cy: y(month[field]), r: 3.5, class: `${className}-point`
      }));
    });
  });

  months.forEach((month, index) => {
    const label = createSvgElement('text', { x: x(index), y: height - 9, class: 'chart-month-label' });
    label.textContent = month.bulan || '';
    svg.append(label);
  });

  chartVisual.replaceChildren(svg);
  chartVisual.hidden = false;
  chartEmpty.hidden = true;
};

const renderDashboard = (data) => {
  const statistik = data.statistik || {};
  statFieldNames.forEach((fieldName) => {
    const valueElement = document.querySelector(`[data-stat="${fieldName}"]`);
    if (valueElement) valueElement.textContent = formatNumber(statistik[fieldName]);
  });

  renderLoans(data.peminjaman_aktif || []);
  renderMonthlyChart(data.peminjaman_per_bulan || []);
  if (syncLabel) {
    syncLabel.innerHTML = '<span class="sync-dot"></span> Data diperbarui';
  }
};

const loadDashboard = async () => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_URL}/dashboard/admin`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Gagal mengambil data dashboard.');
    }
    renderDashboard(result.data || {});
  } catch (error) {
    if (syncLabel) {
      syncLabel.innerHTML = '<span class="sync-dot sync-dot-error"></span> Data belum dapat dimuat';
      syncLabel.title = error.message;
    }
    setEmptyState('Data dashboard belum tersedia', 'Pastikan backend menyediakan endpoint GET /api/dashboard/admin.');
    if (chartEmpty) {
      chartEmpty.querySelector('strong').textContent = 'Grafik belum dapat dimuat';
      chartEmpty.querySelector('span:last-child').textContent = 'Pastikan backend menyediakan data peminjaman bulanan.';
    }
  }
};

if (dateLabel) {
  dateLabel.textContent = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date());
}

const adminName = localStorage.getItem('nama');
if (adminName) {
  const nameElement = document.querySelector('#admin-name');
  const avatarElement = document.querySelector('.avatar');
  if (nameElement) nameElement.textContent = adminName;
  if (avatarElement) avatarElement.textContent = adminName.charAt(0).toUpperCase();
}

const closeSidebar = () => {
  document.body.classList.remove('sidebar-open');
  menuButton?.setAttribute('aria-expanded', 'false');
};

menuButton?.addEventListener('click', () => {
  const isOpen = document.body.classList.toggle('sidebar-open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

sidebarBackdrop?.addEventListener('click', closeSidebar);
document.querySelectorAll('.nav-link').forEach((link) => link.addEventListener('click', closeSidebar));

logoutButton?.addEventListener('click', () => {
  ['token', 'role', 'nama', 'id'].forEach((key) => localStorage.removeItem(key));
  window.location.href = '../../login/html/login (1).html';
});

loadDashboard();
