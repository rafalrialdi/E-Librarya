/**
 * E-Library MTs Al-Falah Klender - Dashboard Admin Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  initSidebar('dashboard');
  initHeader('Dashboard Admin', 'OVERVIEW & STATISTIK', 'Ringkasan sirkulasi peminjaman, statistik koleksi madrasah, dan monitoring pengembalian buku fisik.');
  await loadDashboardData();
});

async function loadDashboardData() {
  const res = await fetchAPI('/dashboard/admin');
  if (res && res.success) {
    const { statistik, peminjaman_per_bulan } = res.data;
    renderStatistik(statistik);
    renderChart(peminjaman_per_bulan);
  } else {
    showToast('Gagal memuat data statistik dashboard', 'error');
  }

  // Load Peminjaman Aktif secara langsung agar up to date
  await loadPeminjamanAktif();
}

function renderStatistik(s) {
  document.getElementById('stat-total-buku').innerText = s.total_buku || 0;
  document.getElementById('stat-total-guru').innerText = s.total_guru || 0;
  document.getElementById('stat-total-siswa').innerText = s.total_siswa || 0;
  document.getElementById('stat-total-menunggu').innerText = s.total_menunggu || 0;
  document.getElementById('stat-total-disetujui').innerText = s.total_disetujui || 0;
  document.getElementById('stat-total-dikembalikan').innerText = s.total_dikembalikan || 0;
}

function renderChart(dataBulanan) {
  const container = document.getElementById('chart-svg-box');
  if (!dataBulanan || dataBulanan.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 40px;">Belum ada data peminjaman dalam 6 bulan terakhir</p>`;
    return;
  }

  const width = 800;
  const height = 220;
  const padding = 40;

  const maxVal = Math.max(...dataBulanan.map(d => d.jumlah), 5);
  const stepX = (width - padding * 2) / (dataBulanan.length > 1 ? dataBulanan.length - 1 : 1);

  const points = dataBulanan.map((d, i) => {
    const x = padding + i * stepX;
    const y = height - padding - (d.jumlah / maxVal) * (height - padding * 2);
    return { x, y, bulan: d.bulan, jumlah: d.jumlah };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  const svg = `
    <svg viewBox="0 0 ${width} ${height}" class="svg-chart">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.0"/>
        </linearGradient>
      </defs>

      <!-- Area Gradient -->
      <path d="${areaD}" fill="url(#chartGrad)" />

      <!-- Garis Utama -->
      <path d="${pathD}" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" />

      <!-- Titik & Label -->
      ${points.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="5" fill="#f59e0b" stroke="#12181f" stroke-width="2" />
        <text x="${p.x}" y="${p.y - 10}" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="bold">${p.jumlah}</text>
        <text x="${p.x}" y="${height - 15}" text-anchor="middle" fill="#94a3b8" font-size="11">${p.bulan}</text>
      `).join('')}
    </svg>
  `;

  container.innerHTML = svg;
}

async function loadPeminjamanAktif() {
  const grid = document.getElementById('grid-peminjaman-aktif');
  const res = await fetchAPI('/peminjaman');

  if (!res || !res.success) {
    grid.innerHTML = `<p style="color: var(--error); padding: 16px;">Gagal memuat peminjaman aktif</p>`;
    return;
  }

  // PRD 6.3: Hanya yang statusnya disetujui (belum dikembalikan), urut dari tgl_jatuh_tempo paling mendekati
  const aktif = res.data.filter(p => p.status === 'disetujui').sort((a, b) => {
    return new Date(a.tgl_jatuh_tempo) - new Date(b.tgl_jatuh_tempo);
  });

  if (aktif.length === 0) {
    grid.innerHTML = `<p style="color: var(--text-muted); padding: 16px; grid-column: 1 / -1;">Tidak ada peminjaman buku yang aktif saat ini.</p>`;
    return;
  }

  grid.innerHTML = aktif.map(item => `
    <div class="loan-card">
      <div class="loan-top">
        <img src="${item.cover_url || '../../../assset/logosekolah.jpeg'}" alt="Cover" class="loan-cover">
        <div class="loan-info">
          <div class="loan-title" title="${item.judul_buku}">${item.judul_buku}</div>
          <div class="loan-borrower">Peminjam: <strong>${item.nama_pengguna}</strong></div>
          <div style="margin-top: 4px;">
            <span class="badge badge-approved">Disetujui</span>
          </div>
        </div>
      </div>
      <div class="loan-dates">
        <div class="loan-date-item">
          <label>Tgl Pinjam</label>
          <span>${formatDate(item.tgl_pinjam)}</span>
        </div>
        <div class="loan-date-item">
          <label>Jatuh Tempo</label>
          <span style="color: var(--primary); font-weight: 700;">${formatDate(item.tgl_jatuh_tempo)}</span>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="kembalikanBuku(${item.id})">
        <span class="material-symbols-outlined" style="font-size: 16px;">assignment_return</span>
        <span>Dikembalikan</span>
      </button>
    </div>
  `).join('');
}

async function kembalikanBuku(id) {
  const res = await fetchAPI(`/peminjaman/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'dikembalikan' })
  });

  if (res && res.success) {
    showToast('Buku berhasil ditandai telah dikembalikan. Stok bertambah +1.');
    await loadDashboardData();
  } else {
    showToast(res ? res.message : 'Gagal memperbarui status', 'error');
  }
}
