// ============================================
// main.js — イベント登録と初期表示
// ============================================

// タスク追加
$('addBtn').onclick = addTask;
$('taskInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

// 一覧の表示/非表示
$('toggleBtn').onclick = () => {
  const ul = $('taskList');
  ul.classList.toggle('hidden');
  $('toggleBtn').textContent = ul.classList.contains('hidden') ? '見る' : '隠す';
};

// ガチャ
$('pullBtn').onclick = pull;
$('doneBtn').onclick = completeTask;

// 「次はいつ？」スライダー
$('schRange').addEventListener('input', () => {
  $('schLabel').textContent = fmtDays(parseInt($('schRange').value, 10));
});
$('schOkBtn').onclick = confirmSchedule;

// ---- 初期表示 ----
// 未完了のまま閉じていたら、引いたタスクを復元してロック継続
if (state.currentId !== null) {
  const t = state.tasks.find(x => x.id === state.currentId);
  if (t) {
    currentTask = t;
    $('capsule').textContent = '✨';
    $('resultName').textContent = t.name;
    $('result').style.display = 'block';
  } else {
    state.currentId = null;
  }
}
save();
renderStats();
renderCatTabs();
renderCatSelect();
renderTasks();
