// ============================================
// tasks.js — タスクの追加・一覧表示・リセット
// ============================================

function renderStats() {
  $('todayCount').textContent = state.todayPulls;
  $('totalCount').textContent = state.totalPulls;
  // $('doneCount').textContent = state.dontotal;
  $('todayCount').textContent = state.dontotal;
}

function renderTasks() {
  const ul = $('taskList');
  ul.innerHTML = '';
  state.tasks.forEach(t => {
    const li = document.createElement('li');
    if (t.done) li.classList.add('done');
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = (t.done ? '✅ ' : '⬜ ') + t.name;
    const del = document.createElement('button');
    del.textContent = '✕';
    del.title = '削除';
    del.onclick = () => {
      state.tasks = state.tasks.filter(x => x.id !== t.id);
      if (state.currentId === t.id) { // 引いた本人を消したらロック解除
        state.currentId = null;
        currentTask = null;
        $('result').style.display = 'none';
        $('capsule').textContent = '🔮';
      }
      save(); renderTasks();
    };
    li.append(name, del);
    ul.appendChild(li);
  });
  $('emptyMsg').style.display = state.tasks.length ? 'none' : 'block';
  updatePullBtn();
}

function updatePullBtn() {
  const btn = $('pullBtn');
  const n = remaining().length;
  btn.disabled = n === 0 || spinning || state.currentId !== null;
  if (state.currentId !== null) {
    btn.textContent = '今のタスクを完了しよう！';
  } else {
    btn.textContent = n === 0 ? 'タスクを追加してね' : `ガチャを引く（残り ${n} 件）`;
  }
}

function addTask() {
  const input = $('taskInput');
  const name = input.value.trim();
  if (!name) return;
  state.tasks.push({ id: Date.now() + Math.random(), name, done: false });
  input.value = '';
  save();
  renderTasks();
}

// 完了タスクをすべて未完了に戻す（新しい1日）
function resetDoneTasks() {
  state.tasks.forEach(t => t.done = false);
  save();
  renderTasks();
}
