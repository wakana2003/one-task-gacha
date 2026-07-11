// ============================================
// voice.js — 音声入力と自然言語の解析
// 「毎週風呂掃除」「金曜までにレポートを出す」→ タスクに変換
// ============================================

// 全角数字→半角数字
function zen2han(s) {
  return parseInt(String(s).replace(/[０-９]/g, c => '０１２３４５６７８９'.indexOf(c)), 10);
}

// 発話テキストを {name, freq, due} に解析する
// freq: 復活日数（0 = 一回きり）/ due: 期限 YYYY-MM-DD（なければ null）
function parseVoiceInput(raw) {
  let text = raw.trim();
  let freq = 1;      // 何も言わなければ毎日
  let due = null;

  const eat = (re, fn) => {
    const m = text.match(re);
    if (m) { fn(m); text = text.replace(re, ' '); }
  };

  // --- 繰り返し ---
  eat(/毎日/, () => { freq = 1; });
  eat(/(毎週|週に?一回?|週[1１]回?|週いち)/, () => { freq = 7; });
  eat(/週に?([2-6２-６])回?/, m => { freq = Math.max(1, Math.round(7 / zen2han(m[1]))); });
  eat(/(毎月|月に?一回?|月[1１]回?|月いち)/, () => { freq = 30; });
  eat(/([0-9０-９]+)日(ごと|おき)に?/, m => { freq = Math.max(1, zen2han(m[1])); });

  // --- 期限（言われたら一回きりタスクにする）---
  const setDue = n => { due = addDays(n); freq = 0; };
  eat(/(今日中|今日まで)に?/, () => setDue(0));
  eat(/明日までに?/, () => setDue(1));
  eat(/(明後日|あさって)までに?/, () => setDue(2));
  eat(/今週(中|末)?までに?|今週中に?/, () => {
    const dow = new Date().getDay();               // 日曜=0
    setDue(dow === 0 ? 0 : 7 - dow);               // 今週の日曜まで
  });
  eat(/来週までに?/, () => setDue(7));
  eat(/([月火水木金土日])曜日?までに?/, m => {
    const target = '日月火水木金土'.indexOf(m[1]);
    const diff = (target - new Date().getDay() + 7) % 7 || 7; // 次のその曜日
    setDue(diff);
  });
  eat(/([0-9０-９]{1,2})日までに?/, m => {
    const day = zen2han(m[1]);
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth(), day);
    if (day < now.getDate()) d.setMonth(d.getMonth() + 1);    // 過ぎてたら来月
    due = dateToStr(d);
    freq = 0;
  });

  // --- 残りがタスク名。語尾や助詞を軽く掃除 ---
  let name = text
    .replace(/(を|に)?(やる|する|やります|します|終わらせる|出す)$/, m =>
      /出す$/.test(m) ? m : '')                    // 「レポートを出す」の「出す」は残す
    .replace(/^(えっと|えーと|あの)+/, '')
    .replace(/[、。\s]+/g, ' ')
    .trim();

  return { name, freq, due };
}

// ---- 音声認識（Web Speech API）----
let recognizing = false;

function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    showToast('このブラウザは音声入力に対応していないよ（Chrome/Edge/Safariで開いてね）');
    return;
  }
  if (recognizing) return;

  const rec = new SR();
  rec.lang = 'ja-JP';
  rec.interimResults = true;

  const mic = $('micBtn');
  recognizing = true;
  mic.classList.add('listening');
  $('taskInput').placeholder = '聞いてるよ…（例：毎週 風呂掃除）';

  rec.onresult = e => {
    const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    $('taskInput').value = transcript;             // 途中経過を表示
    if (e.results[e.results.length - 1].isFinal) {
      const parsed = parseVoiceInput(transcript);
      if (!parsed.name) {
        showToast('タスク名が聞き取れなかった…もう一回どうぞ');
        $('taskInput').value = '';
        return;
      }
      state.tasks.push({
        id: Date.now() + Math.random(),
        name: parsed.name,
        cat: $('taskCat').value,
        freq: parsed.freq,
        due: parsed.due,
        nextDue: todayISO()
      });
      save();
      $('taskInput').value = '';
      renderCatTabs();
      renderTasks();
      const freqLabel = parsed.due
        ? `〆${parsed.due.slice(5).replace('-', '/')}`
        : freqText(parsed.freq);
      showToast(`🎤 「${parsed.name}」を ${freqLabel} で登録したよ`);
    }
  };
  rec.onerror = e => {
    showToast(e.error === 'not-allowed'
      ? 'マイクの使用を許可してね'
      : '聞き取れなかった…もう一回どうぞ');
  };
  rec.onend = () => {
    recognizing = false;
    mic.classList.remove('listening');
    $('taskInput').placeholder = 'タスクを追加（例：机の上を片付ける）';
  };
  rec.start();
}

// ---- トースト表示 ----
let toastTimer = null;
function showToast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4000);
}
