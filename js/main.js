// ============================================
// main.js — タブ切り替え・イベント登録・初期化
// ============================================

function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  $('tab-' + name).classList.add('active');
  document.querySelector(`.nav-btn[data-tab="${name}"]`).classList.add('active');
}

// ---- 初期描画 ----
renderMachine();
renderCatChips();
renderTimeChips();
renderNewTaskCatChips();
renderNewTaskTimeChips();
renderTaskList();
renderStats();
renderDex();
updatePullHint();
save();

// ---- イベント ----
document.querySelectorAll('.nav-btn').forEach(b => {
  b.onclick = () => switchTab(b.dataset.tab);
});

$('pullBtn').onclick = () => {
  const machine = $('machineWrap');
  pullSound.currentTime = 0;        // 連打しても毎回頭から鳴る
  pullSound.play().catch(() => {}); // 再生できない環境でもエラーで止めない
  setTimeout(() => pullSound.pause(), 1000);
  machine.style.transition = 'transform .08s';
  machine.style.transform = 'translateX(-4px) rotate(-1deg)';
  setTimeout(() => { machine.style.transform = 'translateX(4px) rotate(1deg)'; }, 80);
  setTimeout(() => { machine.style.transform = 'translateX(0) rotate(0)'; }, 160);
  setTimeout(pullGacha, 220);
};

$('startTaskBtn').onclick = startTimer;
$('rerollBtn').onclick = pullGacha;
$('skipBtn').onclick = () => {
  closeResultModal();
  toast('スキップしました。気が向いたらまた引いてね');
};
$('timerDoneBtn').onclick = completeCurrentTask;

$('addTaskBtn').onclick = addTask;
$('newTaskText').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
$('micBtn').onclick = startVoice;

$('completeCloseBtn').onclick = () => {
  $('completeModal').classList.remove('show');
  switchTab('collection');
};
$('completeCloseBtn2').onclick = () => {
  $('completeModal').classList.remove('show');
};

// 編集モーダル
$('editSaveBtn').onclick = saveEdit;
$('editCancelBtn').onclick = closeEditModal;
$('editDueClear').onclick = () => {
  $('editDue').value = '';
  if (editFreq === 0) { editFreq = 1; renderEditChips(); } // 〆切を外した一回きりは毎日に戻す
};
$('editDue').addEventListener('change', () => {
  if ($('editDue').value) { editFreq = 0; renderEditChips(); } // 〆切を入れたら一回きりに
});
