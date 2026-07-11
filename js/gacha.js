// ============================================
// gacha.js — ガチャの抽選・演出・完了処理
// ============================================

function pull() {
  const pool = remaining();
  if (!pool.length || spinning || state.currentId !== null) return;
  spinning = true;
  $('result').style.display = 'none';
  updatePullBtn();

  const capsule = $('capsule');
  const roulette = $('roulette');
  capsule.classList.remove('pop');
  capsule.classList.add('shaking');
  capsule.textContent = '🔮';

  // ルーレット演出
  let ticks = 0;
  const maxTicks = 14 + Math.floor(Math.random() * 6);
  const interval = setInterval(() => {
    roulette.textContent = '▶ ' + pool[Math.floor(Math.random() * pool.length)].name;
    ticks++;
    if (ticks >= maxTicks) {
      clearInterval(interval);
      finish(pool);
    }
  }, 110);
}

function finish(pool) {
  currentTask = pool[Math.floor(Math.random() * pool.length)];
  const capsule = $('capsule');
  capsule.classList.remove('shaking');
  capsule.textContent = '✨';
  capsule.classList.add('pop');
  $('roulette').textContent = '';

  state.totalPulls++;
  state.todayPulls++;
  state.currentId = currentTask.id;
  save();
  renderStats();

  confetti();
  $('resultName').textContent = currentTask.name;
  $('result').style.display = 'block';
  spinning = false;
  updatePullBtn();
}

// 「完了！」ボタンの処理
function completeTask() {
  if (!currentTask) return;
  const t = state.tasks.find(x => x.id === currentTask.id);
  if (t) t.done = true;
  state.dontotal++;
  currentTask = null;
  state.currentId = null;
  save();
  renderStats();
  renderTasks();
  $('result').style.display = 'none';
  $('capsule').textContent = '🔮';
  confetti(30);
}
