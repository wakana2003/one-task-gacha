// ============================================
// gacha.js — ガチャの抽選・演出・完了処理
// ============================================

// 「次はいつ？」スライダーの対象タスク
let scheduleTarget = null;

// 結果カードを初期状態（今やること表示）に戻す
function resetResultCard() {
  $('result').style.display = 'none';
  $('resultView').style.display = 'block';
  $('scheduleView').style.display = 'none';
  scheduleTarget = null;
}

function pull() {
  const pool = remaining();
  if (!pool.length || spinning || state.currentId !== null) return;
  spinning = true;
  resetResultCard();
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

// スライダーの値 → 表示テキスト
function fmtDays(n) {
  if (n === 1) return '明日';
  if (n === 7) return '1週間後';
  if (n === 14) return '2週間後';
  return `${n}日後`;
}

// 「完了！」ボタン → 記録して「次はいつ？」スライダーを表示
function completeTask() {
  if (!currentTask) return;
  const t = state.tasks.find(x => x.id === currentTask.id);
  currentTask = null;
  state.currentId = null;
  state.dontotal++;
  if (t) t.nextDue = addDays(t.freq); // ひとまず今の頻度で次回を予約（スライダーで上書き可）
  save();
  renderStats();
  renderCatTabs();
  renderTasks();
  $('capsule').textContent = '🔮';
  confetti(30);

  // スライダー表示（今の頻度を初期値に）
  if (t) {
    scheduleTarget = t;
    $('resultView').style.display = 'none';
    $('scheduleView').style.display = 'block';
    $('schRange').value = Math.min(14, Math.max(1, t.freq));
    $('schLabel').textContent = fmtDays(parseInt($('schRange').value, 10));
  } else {
    resetResultCard();
  }
}

// スライダー確定 → 頻度と次回日を更新
function confirmSchedule() {
  if (scheduleTarget) {
    const n = parseInt($('schRange').value, 10);
    scheduleTarget.freq = n;      // 次回以降もこの頻度で復活
    scheduleTarget.nextDue = addDays(n);
    save();
    renderCatTabs();
    renderTasks();
  }
  resetResultCard();
  updatePullBtn();
}
