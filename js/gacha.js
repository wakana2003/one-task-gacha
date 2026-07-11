// ============================================
// gacha.js — ガチャマシン・抽選・タイマー・完了
// ============================================

// ---- マシンのSVG描画 ----
function renderMachine() {
  const wrap = $('machineWrap');
  const colors = CATEGORIES.map(c => c.hex);
  // const positions = [[95,150],[135,140],[175,150],[115,175],[155,178],[95,195],[175,198],[135,205]];
  const positions = [[75,140],[135,110],[195,140],[120,145],[155,140],[95,165],[175,168],[135,175],[99,120]];
  let capsules = '';
  positions.forEach((p, i) => {
    const col = colors[i % colors.length];
    capsules += `
      <g class="capsule">
        <circle cx="${p[0]}" cy="${p[1]}" r="15" fill="${col}" opacity="0.92"/>
        <path d="M ${p[0]-15} ${p[1]} A 15 15 0 0 1 ${p[0]+15} ${p[1]}" fill="#ffffff" opacity="0.35"/>
      </g>`;
  });
  wrap.innerHTML = `
  <svg viewBox="0 0 270 330" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="domeGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#4a3f86"/>
        <stop offset="100%" stop-color="#241f45"/>
      </linearGradient>
      <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ff6fa5"/>
        <stop offset="100%" stop-color="#c94a7d"/>
      </linearGradient>
    </defs>
    <path d="M 40 210 A 95 105 0 0 1 230 210 L 230 215 L 40 215 Z" fill="url(#domeGrad)" stroke="#5c4fa0" stroke-width="3"/>
    <ellipse cx="135" cy="112" rx="95" ry="103" fill="url(#domeGrad)" stroke="#5c4fa0" stroke-width="3"/>
    <ellipse cx="105" cy="70" rx="26" ry="14" fill="#ffffff" opacity="0.10"/>
    ${capsules}
    <rect x="112" y="210" width="46" height="14" fill="#5c4fa0"/>
    <rect x="30" y="224" width="210" height="90" rx="18" fill="url(#bodyGrad)" stroke="#8a2f57" stroke-width="3"/>
    <rect x="50" y="240" width="80" height="46" rx="10" fill="#3a1330" opacity="0.55"/>
    <circle cx="70" cy="263" r="7" fill="#ffd84d"/>
    <rect x="86" y="253" width="30" height="20" rx="3" fill="#241021"/>
    <rect x="150" y="258" width="66" height="34" rx="8" fill="#241021" opacity="0.5"/>
    <rect x="158" y="264" width="50" height="14" rx="4" fill="#1a0c17"/>
    <rect x="42" y="314" width="18" height="12" rx="3" fill="#8a2f57"/>
    <rect x="210" y="314" width="18" height="12" rx="3" fill="#8a2f57"/>
  </svg>`;
}

// ---- 抽選プール: ジャンル + 時間 + 復活時期が来ているもの ----
function poolForFilters() {
  return state.tasks.filter(t => {
    const catOk = selectedCat === 'all' || t.category === selectedCat;
    const timeOk = selectedTime === 9999 || t.minutes <= selectedTime;
    return catOk && timeOk && isDue(t);
  });
}

// 〆切までの残り日数に応じた重み（〆切なしは1）
function taskWeight(t) {
  if (!t.due) return 1;
  const d = Math.round((new Date(t.due) - new Date(todayISO())) / 86400000);
  if (d <= 1) return 8;   // 明日まで
  if (d <= 2) return 5;
  if (d <= 3) return 3;
  return 2;               // 〆切がある時点で少し出やすく
}

function weightedPick(pool) {
  const total = pool.reduce((s, t) => s + taskWeight(t), 0);
  let r = Math.random() * total;
  for (const t of pool) {
    r -= taskWeight(t);
    if (r <= 0) return t;
  }
  return pool[pool.length - 1];
}

function pullGacha() {
  const pool = poolForFilters();

  // 〆切が今日 or 過ぎているタスクは最優先で確定排出（大当たりよりも優先）
  const urgent = pool.filter(t => t.due && t.due <= todayISO());
  if (urgent.length) {
    const picked = urgent[Math.floor(Math.random() * urgent.length)];
    currentPick = { id: picked.id, text: picked.text, minutes: picked.minutes, category: picked.category, isJackpot: false };
    showResultModal();
    toast('⏰ 〆切のタスクだよ！今日中にやろう');
    return;
  }

  if (Math.random() < JACKPOT_CHANCE) {
    const lucky = LUCKY_TASKS[Math.floor(Math.random() * LUCKY_TASKS.length)];
    currentPick = { id: null, text: lucky.text, minutes: lucky.minutes, category: 'ラッキー', isJackpot: true };
    showResultModal();
    return;
  }
  if (!pool.length) {
    toast(state.tasks.length === 0
      ? 'まずはタスクを登録してください'
      : 'その条件に合うタスクがありません。条件を変えてみましょう');
    return;
  }
  // 〆切が近いタスクほど当たりやすい重み付き抽選
  const picked = weightedPick(pool);
  currentPick = { id: picked.id, text: picked.text, minutes: picked.minutes, category: picked.category, isJackpot: false };
  showResultModal();
}

function showResultModal() {
  const capsuleEl = $('revealCapsule');
  const info = currentPick.isJackpot ? { hex: '#ffd84d', emoji: '🍀' } : catInfo(currentPick.category);
  capsuleEl.style.background = `radial-gradient(circle at 35% 30%, #ffffff55, ${info.hex})`;
  capsuleEl.classList.remove('pop');
  void capsuleEl.offsetWidth; // アニメを再スタート
  capsuleEl.classList.add('pop');
  $('jackpotBanner').style.display = currentPick.isJackpot ? 'block' : 'none';
  const badge = $('resultBadge');
  badge.style.background = info.hex;
  badge.style.color = '#241021';
  badge.textContent = `${info.emoji} ${currentPick.category}`;
  $('resultTitle').textContent = currentPick.text;
  $('resultTime').textContent = `目安 ${currentPick.minutes}分`;
  const card = $('resultCard');
  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = '';
  $('resultModal').classList.add('show');
}

function closeResultModal() {
  $('resultModal').classList.remove('show');
}

// ---- タイマー ----
function startTimer() {
  closeResultModal();
  timerRemaining = currentPick.minutes * 60;
  $('timerTaskText').textContent = currentPick.text;
  $('timerBar').classList.add('show');
  updateTimerClock();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timerRemaining -= 1;
    updateTimerClock();
  }, 1000);
}

function updateTimerClock() {
  const m = Math.floor(Math.abs(timerRemaining) / 60);
  const s = Math.abs(timerRemaining) % 60;
  const sign = timerRemaining < 0 ? '-' : '';
  $('timerClock').textContent = `${sign}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ---- 完了 → カプセル獲得 + 次回スケジュール ----
function completeCurrentTask() {
  if (!currentPick) return;
  clearInterval(timerInterval);
  $('timerBar').classList.remove('show');

  // 図鑑への追加
  let emoji;
  const isRare = currentPick.isJackpot;
  if (isRare) {
    emoji = RARE_POOL[Math.floor(Math.random() * RARE_POOL.length)];
    state.rareDex[emoji] = (state.rareDex[emoji] || 0) + 1;
  } else {
    emoji = CHAR_POOL[Math.floor(Math.random() * CHAR_POOL.length)];
    const key = currentPick.category + '|' + emoji;
    state.dex[key] = (state.dex[key] || 0) + 1;
  }

  // 元タスクのスケジュール更新（一回きりは削除、繰り返しは freq 日後に復活）
  if (currentPick.id) {
    const t = state.tasks.find(x => x.id === currentPick.id);
    if (t) {
      if (t.freq === 0) {
        state.tasks = state.tasks.filter(x => x.id !== t.id);
      } else {
        t.nextDue = addDays(t.freq);
      }
    }
  }

  // 統計（連続日数）
  const st = state.stats;
  if (st.todayDate !== todayISO()) { st.todayCount = 0; st.todayDate = todayISO(); }
  const y = new Date(); y.setDate(y.getDate() - 1);
  const yesterday = dateToStr(y);
  if (st.lastDate === todayISO()) {
    // 今日すでに達成済み → 連続日数は変わらない
  } else if (st.lastDate === yesterday) {
    st.streak += 1;
  } else {
    st.streak = 1;
  }
  st.lastDate = todayISO();
  st.total += 1;
  st.todayCount += 1;
  save();

  $('completeEmoji').textContent = emoji;
  $('completeSub').textContent = isRare
    ? 'レアカプセルだ…！おつかれさま'
    : `「${currentPick.text}」やりきった！`;
  $('completeModal').classList.add('show');
  confetti(30);
  currentPick = null;
  renderStats();
  renderDex();
  renderTaskList();
  updatePullHint();
}
