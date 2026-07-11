// ============================================
// dex.js — 図鑑と統計の表示
// ============================================

function renderStats() {
  $('statToday').textContent = state.stats.todayCount;
  $('statTotal').textContent = state.stats.total;
  $('statStreak').textContent = state.stats.streak;
}

function renderDex() {
  // レアカプセル
  const rareRow = $('rareRow');
  rareRow.innerHTML = '';
  RARE_POOL.forEach(ch => {
    const filled = !!state.rareDex[ch];
    const slot = document.createElement('div');
    slot.className = 'rare-slot' + (filled ? ' filled' : '');
    slot.textContent = filled ? ch : '?';
    slot.title = filled ? `${ch} × ${state.rareDex[ch]}` : '未獲得';
    rareRow.appendChild(slot);
  });

  // カテゴリ別図鑑
  const container = $('dexContainer');
  container.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const group = document.createElement('div');
    group.className = 'dex-group';
    const collected = CHAR_POOL.filter(ch => state.dex[cat.id + '|' + ch]).length;
    group.innerHTML = `
      <div class="dex-cat-title">
        <span class="dex-cat-dot" style="background:${cat.hex}"></span>
        ${cat.emoji} ${cat.id} <span style="color:var(--text-dim);font-weight:400;">（${collected}/${CHAR_POOL.length}）</span>
      </div>
      <div class="dex-grid"></div>
    `;
    const grid = group.querySelector('.dex-grid');
    CHAR_POOL.forEach(ch => {
      const key = cat.id + '|' + ch;
      const filled = !!state.dex[key];
      const slot = document.createElement('div');
      slot.className = 'dex-slot' + (filled ? ' filled' : '');
      if (filled) slot.style.border = `1px solid ${cat.hex}55`;
      slot.textContent = filled ? ch : '';
      slot.title = filled ? `${ch} × ${state.dex[key]}` : '未獲得';
      grid.appendChild(slot);
    });
    container.appendChild(group);
  });
}
