// ============================================
// voice.js — 音声入力と自然言語の解析
// 「家事で 毎週 30分で 風呂掃除」→ タスクに変換
// ============================================

function zen2han(s) {
  return parseInt(String(s).replace(/[０-９]/g, c => '０１２３４５６７８９'.indexOf(c)), 10);
}

// ---- タスク名からカテゴリと所要時間を推測する辞書 ----
// 上から順に判定するので、より具体的な語を上に置く
const CATEGORY_HINTS = [
  { re: /レポート|課題|宿題|勉強|予習|復習|単語|参考書|過去問|論文|研究|テスト|試験|資格/, cat: '勉強' },
  { re: /メール|会議|資料|報告|プレゼン|請求書|経費|打ち合わせ|議事録|スライド/, cat: '仕事' },
  { re: /掃除|洗濯|皿|食器|ゴミ|料理|買い物|片付け|風呂|トイレ|シンク|布団|アイロン|冷蔵庫/, cat: '家事' },
  { re: /散歩|筋トレ|ストレッチ|ジム|ランニング|ヨガ|運動|体操|歯医者|病院|薬/, cat: '健康' },
  { re: /ゲーム|絵を?描|ピアノ|ギター|読書|映画|アニメ|編み物|プラモ|カメラ|推し/, cat: '趣味' },
];
const MINUTE_HINTS = [
  { re: /レポート|論文|プレゼン|スライド|過去問|模様替え/, min: 60 },
  { re: /課題|宿題|勉強|予習|復習|資料|報告|買い物|料理|風呂掃除/, min: 30 },
  { re: /掃除|洗濯|片付け|散歩|筋トレ|ランニング|会議|議事録/, min: 20 },
  { re: /皿|食器|シンク|メール|単語|ストレッチ|薬/, min: 10 },
  { re: /ゴミ/, min: 5 },
];
function guessCategory(text) {
  const hit = CATEGORY_HINTS.find(h => h.re.test(text));
  return hit ? hit.cat : null;
}
function guessMinutes(text) {
  const hit = MINUTE_HINTS.find(h => h.re.test(text));
  return hit ? hit.min : null;
}

// 発話テキストを {text, category, minutes, freq, due} に解析
function parseVoiceInput(raw) {
  let text = raw.trim();
  let freq = 1;               // 何も言わなければ毎日
  let due = null;
  let minutes = null;         // 言わなければフォームの選択値
  let category = null;        // 言わなければフォームの選択値

  const eat = (re, fn) => {
    const m = text.match(re);
    if (m) { fn(m); text = text.replace(re, ' '); }
  };

  // --- カテゴリ（文頭で「家事で」「勉強の」のように言われたときだけ）---
  const catNames = CATEGORIES.map(c => c.id).join('|');
  eat(new RegExp(`^\\s*(${catNames})(で|の)`), m => { category = m[1]; });

  // --- かかる時間 ---
  eat(/([0-9０-９]+)分(で|くらい|ぐらい|かかる)?/, m => { minutes = Math.max(1, zen2han(m[1])); });
  eat(/([0-9０-９]+)時間(で|くらい|ぐらい|かかる)?/, m => { minutes = Math.max(1, zen2han(m[1]) * 60); });

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
    const dow = new Date().getDay();
    setDue(dow === 0 ? 0 : 7 - dow);
  });
  eat(/来週までに?/, () => setDue(7));
  eat(/([月火水木金土日])曜日?までに?/, m => {
    const target = '日月火水木金土'.indexOf(m[1]);
    const diff = (target - new Date().getDay() + 7) % 7 || 7;
    setDue(diff);
  });
  eat(/([0-9０-９]{1,2})日までに?/, m => {
    const day = zen2han(m[1]);
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth(), day);
    if (day < now.getDate()) d.setMonth(d.getMonth() + 1);
    due = dateToStr(d);
    freq = 0;
  });

  // --- 残りがタスク名。語尾を軽く掃除 ---
  const name = text
    .replace(/(を|に)?(やる|する|やります|します|終わらせる)$/, '')
    .replace(/^(えっと|えーと|あの)+/, '')
    .replace(/[、。\s]+/g, ' ')
    .trim();

  return { text: name, category, minutes, freq, due };
}

// ---- 音声認識（Web Speech API）----
let recognizing = false;

function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    toast('このブラウザは音声入力に対応していないよ（Chrome/Edge/Safariで開いてね）');
    return;
  }
  if (recognizing) return;

  const rec = new SR();
  rec.lang = 'ja-JP';
  rec.interimResults = true;

  const mic = $('micBtn');
  const input = $('newTaskText');
  recognizing = true;
  mic.classList.add('listening');
  input.placeholder = '聞いてるよ…（例：家事で 毎週 風呂掃除）';

  rec.onresult = e => {
    const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    input.value = transcript; // 途中経過を表示
    if (e.results[e.results.length - 1].isFinal) {
      const p = parseVoiceInput(transcript);
      if (!p.text) {
        toast('タスク名が聞き取れなかった…もう一回どうぞ');
        input.value = '';
        return;
      }
      // 優先順位: 発話で明示 > タスク名から推測 > フォームの選択値
      const category = p.category || guessCategory(p.text) || 'その他';
      const minutes = p.minutes || guessMinutes(p.text) || 90;
      registerTask({ text: p.text, category, minutes, freq: p.freq, due: p.due });
      input.value = '';
      const parts = [];
      parts.push(category);
      parts.push(p.due ? `〆${p.due.slice(5).replace('-', '/')}` : freqText(p.freq));
      parts.push(`約${minutes}分`);
      toast(`🎤 「${p.text}」を登録（${parts.join('・')}）違ったら一覧から直してね`);
    }
  };
  rec.onerror = e => {
    toast(e.error === 'not-allowed' ? 'マイクの使用を許可してね' : '聞き取れなかった…もう一回どうぞ');
  };
  rec.onend = () => {
    recognizing = false;
    mic.classList.remove('listening');
    input.placeholder = '例）洗濯物をたたむ';
  };
  rec.start();
}
