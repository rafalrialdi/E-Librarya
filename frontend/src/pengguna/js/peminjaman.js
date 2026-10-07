document.addEventListener('DOMContentLoaded', async () => {
  renderNav('peminjaman');
  renderFooter();
  await loadPeminjaman();
  await fetchAndRenderNotifications();
});

async function loadPeminjaman() {
  const res = await fetchUserAPI('/peminjaman/saya');
  
  if (res?.success && res.data?.length > 0) {
    renderAllSections(res.data);
  } else {
    renderEmptyStates();
  }
}

function renderAllSections(loans) {
  // Filter by status
  const pengajuan = loans.filter(l => l.status === 'menunggu');
  const aktif = loans.filter(l => l.status === 'disetujui');
  const riwayat = loans.filter(l => l.status === 'dikembalikan');
  
  renderRail('pengajuan', pengajuan, renderPengajuanCard);
  renderRail('aktif', aktif, renderAktifCard);
  renderRail('riwayat', riwayat, renderRiwayatCard);
  
  document.getElementById('count-pengajuan').textContent = pengajuan.length;
  document.getElementById('count-aktif').textContent = aktif.length;
  document.getElementById('count-riwayat').textContent = riwayat.length;
}

function renderRail(sectionId, items, cardRenderer) {
  const rail = document.getElementById(`rail-${sectionId}`);
  
  if (!rail) return;
  
  if (items.length === 0) {
    rail.innerHTML = getEmptyRail(sectionId);
  } else {
    rail.innerHTML = items.map(cardRenderer).join('');
  }
}

function getEmptyRail(sectionId) {
  const configs = {
    pengajuan: {
      icon: 'pending',
      title: 'Belum ada pengajuan',
      desc: 'Anda belum mengajukan peminjaman buku manapun'
    },
    aktif: {
      icon: 'book',
      title: 'Tidak ada buku dipinjam',
      desc: 'Saat ini Anda tidak memiliki buku yang sedang dipinjam'
    },
    riwayat: {
      icon: 'history',
      title: 'Riwayat kosong',
      desc: 'Belum ada buku yang pernah dikembalikan'
    }
  };
  
  const cfg = configs[sectionId];
  return `
    <div class="empty-rail">
      <div>
        <span class="material-symbols-outlined" style="font-size: 48px; color: #334155; margin-bottom: 12px; display: block;">${cfg.icon}</span>
        <strong style="color: #cbd5e1; display: block; margin-bottom: 4px;">${cfg.title}</strong>
        <span>${cfg.desc}</span>
      </div>
    </div>
  `;
}

function renderPengajuanCard(loan) {
  return `
    <article class="loan-card">
      <img src="${coverUrl(loan.cover_url)}" alt="${loan.judul_buku}" class="loan-card-cover">
      <div class="loan-card-info">
        <span class="status-badge status-menunggu">Menunggu</span>
        <h3 class="loan-card-title">${loan.judul_buku}</h3>
        <dl class="loan-card-meta">
          <div><dt>Pinjam:</dt><dd>${formatUserDate(loan.tgl_pinjam)}</dd></div>
          <div><dt>Jatuh Tempo:</dt><dd>${formatUserDate(loan.tgl_jatuh_tempo)}</dd></div>
        </dl>
      </div>
    </article>
  `;
}

function renderAktifCard(loan) {
  return `
    <article class="loan-card">
      <img src="${coverUrl(loan.cover_url)}" alt="${loan.judul_buku}" class="loan-card-cover">
      <div class="loan-card-info">
        <span class="status-badge status-disetujui">Sedang Dipinjam</span>
        <h3 class="loan-card-title">${loan.judul_buku}</h3>
        <dl class="loan-card-meta">
          <div><dt>Pinjam:</dt><dd>${formatUserDate(loan.tgl_pinjam)}</dd></div>
          <div><dt>Jatuh Tempo:</dt><dd>${formatUserDate(loan.tgl_jatuh_tempo)}</dd></div>
        </dl>
      </div>
    </article>
  `;
}

function renderRiwayatCard(loan) {
  return `
    <article class="loan-card">
      <img src="${coverUrl(loan.cover_url)}" alt="${loan.judul_buku}" class="loan-card-cover">
      <div class="loan-card-info">
        <span class="status-badge" style="background: rgba(100, 116, 139, .15); color: #94a3b8; border: 1px solid rgba(100, 116, 139, .3);">Dikembalikan</span>
        <h3 class="loan-card-title">${loan.judul_buku}</h3>
        <dl class="loan-card-meta">
          <div><dt>Pinjam:</dt><dd>${formatUserDate(loan.tgl_pinjam)}</dd></div>
          <div><dt>Tgl Kembali:</dt><dd>${formatUserDate(loan.tgl_kembali)}</dd></div>
        </dl>
      </div>
    </article>
  `;
}

function renderEmptyStates() {
  document.getElementById('rail-pengajuan').innerHTML = getEmptyRail('pengajuan');
  document.getElementById('rail-aktif').innerHTML = getEmptyRail('aktif');
  document.getElementById('rail-riwayat').innerHTML = getEmptyRail('riwayat');
  document.getElementById('count-pengajuan').textContent = 0;
  document.getElementById('count-aktif').textContent = 0;
  document.getElementById('count-riwayat').textContent = 0;
}