// ============================================
// tasks.js — チップUI・タスク一覧・追加/削除
// ============================================

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function freqText(n) {
  if (n === 0) return '一回きり';
  if (n === 1) return '毎日';
  if (n === 7) return '週1';
  if (n === 30) return '毎月';
  return `${n}日ごと`;
}

function daysUntil(dateStr) {
  const ms = new Date(dateStr) - new Date(todayISO());
  return Math.max(0, Math.round(ms / 86400000));
}

// ---- ガチャ画面のチップ ----
function renderCatChips() {
  const el = $('catChips');
  el.innerHTML = '';
  const all = document.createElement('button');
  all.className = 'chip' + (selectedCat === 'all' ? ' selected' : '');
  all.dataset.cat = 'all';
  all.textContent = '🎯 すべて';
  all.onclick = () => { selectedCat = 'all'; renderCatChips(); updatePullHint(); };
  el.appendChild(all);
  CATEGORIES.forEach(c => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (selectedCat === c.id ? ' selected' : '');
    chip.dataset.cat = c.id;
    chip.textContent = `${c.emoji} ${c.id}`;
    chip.onclick = () => { selectedCat = c.id; renderCatChips(); updatePullHint(); };
    el.appendChild(chip);
  });
}

function renderTimeChips() {
  const el = $('timeChips');
  el.innerHTML = '';
  TIME_OPTIONS.forEach(t => {
    const chip = document.createElement('button');
    chip.className = 'chip time' + (selectedTime === t.id ? ' selected' : '');
    chip.textContent = '⏱ ' + t.label;
    chip.onclick = () => { selectedTime = t.id; renderTimeChips(); updatePullHint(); };
    el.appendChild(chip);
  });
}

// ---- タスク追加フォームのチップ ----
function renderNewTaskCatChips() {
  const el = $('newTaskCatChips');
  el.innerHTML = '';
  CATEGORIES.forEach(c => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (newTaskCat === c.id ? ' selected' : '');
    chip.dataset.cat = c.id;
    chip.textContent = `${c.emoji} ${c.id}`;
    chip.onclick = () => { newTaskCat = c.id; renderNewTaskCatChips(); };
    el.appendChild(chip);
  });
}

function renderNewTaskTimeChips() {
  const el = $('newTaskTimeChips');
  el.innerHTML = '';
  [5, 10, 15, 30, 45, 60, 90].forEach(m => {
    const chip = document.createElement('button');
    chip.className = 'chip time' + (newTaskTime === m ? ' selected' : '');
    chip.textContent = m + '分';
    chip.onclick = () => { newTaskTime = m; renderNewTaskTimeChips(); };
    el.appendChild(chip);
  });
}

// ---- 抽選対象の件数をヒントに表示 ----
function updatePullHint() {
  const n = poolForFilters().length;
  $('pullHint').textContent = n
    ? `条件に合うタスクは ${n} 件。ランダムで1つ選びます`
    : 'この条件で引けるタスクがありません（時間やジャンルを変えてみて）';
}

// ---- タスク一覧 ----
function renderTaskList() {
  const el = $('taskList');
  if (!state.tasks.length) {
    el.innerHTML = '<div class="empty-state"><span class="big">📭</span>まだタスクがありません。<br>上のフォームか🎤マイクから追加してみましょう。</div>';
    return;
  }
  el.innerHTML = '';
  state.tasks.slice().sort((a, b) => a.category.localeCompare(b.category)).forEach(t => {
    const info = catInfo(t.category);
    const due = isDue(t);
    const row = document.createElement('div');
    row.className = 'task-item' + (due ? '' : ' sleeping');

    let tags = `${info.emoji} ${t.category} ・ 約${t.minutes}分 ・ ${freqText(t.freq)}`;
    if (t.due) {
      const overdue = t.due < todayISO();
      tags += ` ・ <span class="${overdue ? 'overdue' : ''}">〆${t.due.slice(5).replace('-', '/')}${overdue ? ' ⚠過ぎてる！' : ''}</span>`;
    }
    if (!due) tags += ` ・ あと${daysUntil(t.nextDue)}日で復活`;

    row.innerHTML = `
      <div class="task-dot" style="background:${info.hex}"></div>
      <div class="task-body">
        <div class="task-text">${escapeHtml(t.text)}</div>
        <div class="task-tags">${tags}</div>
      </div>
      <button class="task-del" data-id="${t.id}">✕</button>
    `;
    row.querySelector('.task-del').onclick = () => deleteTask(t.id);
    el.appendChild(row);
  });
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  save();
  renderTaskList();
  updatePullHint();
  toast('タスクを削除しました');
}

// 手動追加（音声は voice.js から registerTask を呼ぶ）
function addTask() {
  const input = $('newTaskText');
  const text = input.value.trim();
  if (!text) { toast('タスクの内容を入力してください'); return; }
  registerTask({ text, category: newTaskCat, minutes: newTaskTime, freq: 1, due: null });
  input.value = '';
  toast('タスクを追加しました 🎉');
}

// 追加処理の共通口
function registerTask({ text, category, minutes, freq, due }) {
  state.tasks.push({
    id: uid(),
    text,
    category,
    minutes,
    freq,
    due: due || null,
    nextDue: todayISO(),
  });
  save();
  renderTaskList();
  updatePullHint();
}
