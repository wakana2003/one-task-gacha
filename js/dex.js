// ============================================
// dex.js — 図鑑と統計の表示（ドット動物の画像版）
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
  RARE_POOL.forEach(img => {
    const filled = !!state.rareDex[img];
    const slot = document.createElement('div');
    slot.className = 'rare-slot' + (filled ? ' filled' : '');
    if (filled) {
      const el = document.createElement('img');
      el.src = img;
      el.alt = animalName(img);
      el.className = 'dex-img';
      slot.appendChild(el);
      slot.title = `${animalName(img)} × ${state.rareDex[img]}`;
      slot.onclick = () => openAnimalModal(img, state.rareDex[img], true);
    } else {
      slot.textContent = '?';
      slot.title = '未獲得';
    }
    rareRow.appendChild(slot);
  });

  // カテゴリ別図鑑
  const container = $('dexContainer');
  container.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const pool = DEX_POOL[cat.id] || [];
    const group = document.createElement('div');
    group.className = 'dex-group';
    const collected = pool.filter(img => state.dex[cat.id + '|' + img]).length;
    group.innerHTML = `
      <div class="dex-cat-title">
        <span class="dex-cat-dot" style="background:${cat.hex}"></span>
        ${catIcon(cat.emoji)} ${cat.id} <span style="color:var(--text-dim);font-weight:400;">（${collected}/${pool.length}）</span>
      </div>
      <div class="dex-grid"></div>
    `;
    const grid = group.querySelector('.dex-grid');
    pool.forEach(img => {
      const key = cat.id + '|' + img;
      const filled = !!state.dex[key];
      const slot = document.createElement('div');
      slot.className = 'dex-slot' + (filled ? ' filled' : '');
      if (filled) {
        slot.style.border = `1px solid ${cat.hex}55`;
        const el = document.createElement('img');
        el.src = img;
        el.alt = animalName(img);
        el.className = 'dex-img';
        slot.appendChild(el);
        slot.title = `${animalName(img)} × ${state.dex[key]}`;
        slot.onclick = () => openAnimalModal(img, state.dex[key], false);
      } else {
        slot.title = '未獲得';
      }
      grid.appendChild(slot);
    });
    container.appendChild(group);
  });
}

// ---- 動物の詳細モーダル ----
function openAnimalModal(img, count, isRare) {
  const imgEl = $('animalDetailImg');
  imgEl.src = img;
  imgEl.alt = animalName(img);
  imgEl.classList.toggle('rare', isRare);
  $('animalDetailName').textContent = animalName(img);
  $('animalDetailBadge').textContent = isRare ? '✨ レアどうぶつ' : 'どうぶつ';
  $('animalDetailBadge').classList.toggle('rare', isRare);
  $('animalDetailCount').textContent = `これまでに ${count} 回 手に入れた`;
  $('animalModal').classList.add('show');
}
function closeAnimalModal() {
  $('animalModal').classList.remove('show');
}