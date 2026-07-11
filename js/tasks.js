// ============================================
// tasks.js — タスクの追加・一覧表示・カテゴリタブ
// ============================================

function renderStats() {
  $('todayCount').textContent = state.todayPulls;
  $('totalCount').textContent = state.totalPulls;
  $('doneCount').textContent = state.dontotal;
}

// カテゴリタブ（すべて + 各カテゴリ）
function renderCatTabs() {
  const wrap = $('catTabs');
  wrap.innerHTML = '';
  const tabs = [{ id: 'all', emoji: '🎰', label: 'すべて' },
                ...CATS.map(c => ({ id: c.id, emoji: c.emoji, label: c.id }))];
  tabs.forEach(tab => {
    const btn = document.createElement('button');
    btn.className = 'cat-tab' + (selectedCat === tab.id ? ' active' : '');
    // 抽選対象の残り件数をバッジ表示
    const n = state.tasks.filter(t => isDue(t) && (tab.id === 'all' || t.cat === tab.id)).length;
    btn.textContent = `${tab.emoji} ${tab.label}${n ? ` (${n})` : ''}`;
    btn.onclick = () => {
      selectedCat = tab.id;
      renderCatTabs();
      renderTasks();
    };
    wrap.appendChild(btn);
  });
}

// 頻度の表示用テキスト
function freqText(n) {
  if (n === 1) return '毎日';
  if (n === 7) return '週1';
  if (n === 14) return '2週間ごと';
  return `${n}日ごと`;
}

// 次に出るまでの残り日数
function daysUntil(dateStr) {
  const ms = new Date(dateStr) - new Date(todayISO());
  return Math.max(0, Math.round(ms / 86400000));
}

function renderTasks() {
  const ul = $('taskList');
  ul.innerHTML = '';
  const shown = state.tasks.filter(t => selectedCat === 'all' || t.cat === selectedCat);
  shown.forEach(t => {
    const li = document.createElement('li');
    const due = isDue(t);
    if (!due) li.classList.add('done');

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = (due ? '⬜ ' : '✅ ') + t.name;

    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = `${catEmoji(t.cat)} ${t.cat}・${freqText(t.freq)}` +
      (due ? '' : `・あと${daysUntil(t.nextDue)}日で復活`);
    name.appendChild(meta);

    const del = document.createElement('button');
    del.textContent = '✕';
    del.title = '削除';
    del.onclick = () => {
      state.tasks = state.tasks.filter(x => x.id !== t.id);
      if (state.currentId === t.id) { // 引いた本人を消したらロック解除
        state.currentId = null;
        currentTask = null;
        resetResultCard();
        $('capsule').textContent = '🔮';
      }
      save(); renderCatTabs(); renderTasks();
    };
    li.append(name, del);
    ul.appendChild(li);
  });
  $('emptyMsg').style.display = shown.length ? 'none' : 'block';
  updatePullBtn();
}

function updatePullBtn() {
  const btn = $('pullBtn');
  const n = remaining().length;
  btn.disabled = n === 0 || spinning || state.currentId !== null;
  if (state.currentId !== null) {
    btn.textContent = '今のタスクを完了しよう！';
  } else if (n === 0) {
    btn.textContent = selectedCat === 'all' ? '今引けるタスクがないよ' : `${selectedCat}ガチャは今引けないよ`;
  } else {
    const label = selectedCat === 'all' ? 'ガチャ' : `${selectedCat}ガチャ`;
    btn.textContent = `${label}を引く（残り ${n} 件）`;
  }
}

// カテゴリ選択プルダウンを生成
function renderCatSelect() {
  const sel = $('taskCat');
  sel.innerHTML = '';
  CATS.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.emoji} ${c.id}`;
    sel.appendChild(opt);
  });
  // タブでカテゴリを選んでいたら、それを初期値に
  if (selectedCat !== 'all') sel.value = selectedCat;
}

function addTask() {
  const input = $('taskInput');
  const name = input.value.trim();
  if (!name) return;
  state.tasks.push({
    id: Date.now() + Math.random(),
    name,
    cat: $('taskCat').value,
    freq: 1,              // デフォルトは毎日（完了時のスライダーで変えられる）
    nextDue: todayISO()
  });
  input.value = '';
  save();
  renderCatTabs();
  renderTasks();
}
