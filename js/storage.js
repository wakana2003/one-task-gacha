// ============================================
// storage.js — 定数・状態・保存（localStorage）
// ============================================

const $ = id => document.getElementById(id);
const KEY = 'taskGachaV2';

// ---- カテゴリ定義（増やすときはここに足す）----
const CATEGORIES = [
  { id: '仕事',   hex: '#ff6fa5', emoji: '💼' },
  { id: '家事',   hex: '#3fe0b8', emoji: '🧹' },
  { id: '勉強',   hex: '#6ec8ff', emoji: '📚' },
  { id: '健康',   hex: '#ffc845', emoji: '💪' },
  { id: '趣味',   hex: '#b48cff', emoji: '🎨' },
  { id: 'その他', hex: '#9aa0c7', emoji: '🗂️' },
];
const catInfo = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

// ---- ガチャで使う時間の選択肢 ----
const TIME_OPTIONS = [
  { id: 5,    label: '5分' },
  { id: 15,   label: '15分' },
  { id: 30,   label: '30分' },
  { id: 60,   label: '1時間' },
  { id: 9999, label: 'こだわらない' },
];

// ---- 図鑑・大当たり ----
// カテゴリごとに12種のドット動物。全76種すべて別の動物
const DEX_POOL = {
  '仕事': [
    'dot_animal_png/morumotto_albino.png',
    'dot_animal_png/hebi.png',
    'dot_animal_png/tasmaniadevil.png',
    'dot_animal_png/buta.png',
    'dot_animal_png/inoshishi.png',
    'dot_animal_png/fennec.png',
    'dot_animal_png/harinezumi.png',
    'dot_animal_png/hato_white.png',
    'dot_animal_png/seiuchi.png',
    'dot_animal_png/kitsune_02_leaf_yellowgreen.png',
    'dot_animal_png/hamster_gray.png',
    'dot_animal_png/lesser_panda.png',
  ],
  '家事': [
    'dot_animal_png/ferret.png',
    'dot_animal_png/ottosei.png',
    'dot_animal_png/saru_nihonzaru.png',
    'dot_animal_png/kangaroo.png',
    'dot_animal_png/usagi_black.png',
    'dot_animal_png/taka_white.png',
    'dot_animal_png/uribo_01.png',
    'dot_animal_png/koala.png',
    'dot_animal_png/fukuro_menfukuro.png',
    'dot_animal_png/suzume.png',
    'dot_animal_png/kawauso.png',
    'dot_animal_png/itachi.png',
  ],
  '勉強': [
    'dot_animal_png/gorilla.png',
    'dot_animal_png/namakemono.png',
    'dot_animal_png/yagi_shiroyagi.png',
    'dot_animal_png/tsuru.png',
    'dot_animal_png/kamonohashi.png',
    'dot_animal_png/ahiru.png',
    'dot_animal_png/hiyoko.png',
    'dot_animal_png/beaver.png',
    'dot_animal_png/kamo_female.png',
    'dot_animal_png/shimaenaga.png',
    'dot_animal_png/niwatori_female.png',
    'dot_animal_png/mejiro.png',
  ],
  '健康': [
    'dot_animal_png/ashika.png',
    'dot_animal_png/momonga_ezomomonga.png',
    'dot_animal_png/kirin_yellow.png',
    'dot_animal_png/capybara.png',
    'dot_animal_png/uma_black.png',
    'dot_animal_png/tanuki_leaf_yellowgreen.png',
    'dot_animal_png/ushi_black_tsuno.png',
    'dot_animal_png/rakko.png',
    'dot_animal_png/zo.png',
    'dot_animal_png/sekiseiinko_greenkei_female.png',
    'dot_animal_png/iruka.png',
    'dot_animal_png/manatee.png',
  ],
  '趣味': [
    'dot_animal_png/sai.png',
    'dot_animal_png/azarashi_gomafuazarashi.png',
    'dot_animal_png/panda_02.png',
    'dot_animal_png/tonakai.png',
    'dot_animal_png/okojo_natsuge.png',
    'dot_animal_png/risu_02.png',
    'dot_animal_png/todo.png',
    'dot_animal_png/karasu.png',
    'dot_animal_png/quokka.png',
    'dot_animal_png/kaba.png',
    'dot_animal_png/marmot.png',
    'dot_animal_png/alpaca_gray.png',
  ],
  'その他': [
    'dot_animal_png/meerkat.png',
    'dot_animal_png/okami_halloween_white.png',
    'dot_animal_png/dog_chihuahua_long_red.png',
    'dot_animal_png/uguisu.png',
    'dot_animal_png/kaeru_02.png',
    'dot_animal_png/kuma_shirokuma.png',
    'dot_animal_png/tsubame.png',
    'dot_animal_png/nezumi_black.png',
    'dot_animal_png/komori_02.png',
    'dot_animal_png/manulneko.png',
    'dot_animal_png/penguin_adeliepenguin.png',
    'dot_animal_png/hakucho_hina.png',
  ],
};
// レア（大当たり産）は特別感のある4種
const RARE_POOL = [
  'dot_animal_png/ryu.png',
  'dot_animal_png/tora_whitetiger.png',
  'dot_animal_png/hyo_kurohyo.png',
  'dot_animal_png/lion_whitelion_male.png',
];
const DEX_SIZE = 12; // 1カテゴリあたりの図鑑枠数
const LUCKY_TASKS = [
  { text: '1分だけ深呼吸する', minutes: 1 },
  { text: '好きな音楽を1曲だけ聴く', minutes: 3 },
  { text: '窓の外を1分眺めてぼーっとする', minutes: 1 },
  { text: '温かい飲み物を淹れて一息つく', minutes: 5 },
  { text: '好きな動画を1本だけ見る', minutes: 5 },
  { text: '軽くストレッチする', minutes: 2 },
  { text: '5分だけ目を閉じて休む', minutes: 5 },
  { text: 'お気に入りの写真を見返す', minutes: 2 },
];
const JACKPOT_CHANCE = 0.12;

// ---- 日付ヘルパー（ローカル時刻基準）----
const dateToStr = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayISO = () => dateToStr(new Date());
const addDays = n => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return dateToStr(d);
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---- 状態 ----
// task: {id, text, category, minutes, freq, nextDue, due}
//   freq: 何日ごとに復活するか（0 = 一回きり、完了で削除）
//   nextDue: 次に抽選対象になる日 / due: 期限（あれば）
let state = {
  tasks: [],
  dex: {},        // "カテゴリ|絵文字" -> 獲得数
  rareDex: {},    // "絵文字" -> 獲得数
  stats: { total: 0, todayCount: 0, todayDate: '', streak: 0, lastDate: null },
};

function defaultTasks() {
  return [
    { id: uid(), text: 'メール受信箱を整理する', category: '仕事', minutes: 15, freq: 1, nextDue: todayISO(), due: null },
    { id: uid(), text: 'シンクの食器を洗う',     category: '家事', minutes: 10, freq: 1, nextDue: todayISO(), due: null },
    { id: uid(), text: '参考書を1ページ読む',    category: '勉強', minutes: 5,  freq: 1, nextDue: todayISO(), due: null },
    { id: uid(), text: '軽く散歩する',           category: '健康', minutes: 20, freq: 1, nextDue: todayISO(), due: null },
  ];
}

try {
  const saved = JSON.parse(localStorage.getItem(KEY));
  if (saved) state = Object.assign(state, saved);
} catch (e) {}
if (!state.tasks.length && state.stats.total === 0) state.tasks = defaultTasks();

// 足りない属性を補完（旧データ対策）
state.tasks.forEach(t => {
  if (!t.category) t.category = 'その他';
  if (!t.minutes) t.minutes = 15;
  if (t.freq === undefined) t.freq = 1;
  if (!t.nextDue) t.nextDue = todayISO();
  if (t.due === undefined) t.due = null;
});

// 日付が変わったら今日のカウントをリセット
if (state.stats.todayDate !== todayISO()) {
  state.stats.todayDate = todayISO();
  state.stats.todayCount = 0;
}

const save = () => localStorage.setItem(KEY, JSON.stringify(state));

// 抽選対象になる時期が来ているか
const isDue = t => t.nextDue <= todayISO();

// ---- 画面をまたぐ一時状態 ----
let selectedCat = 'all';
let selectedTime = 15;
let newTaskCat = '家事';
let newTaskTime = 15;
let currentPick = null;   // {id, text, minutes, category, isJackpot}
let timerInterval = null;
let timerRemaining = 0;

// ---- トースト ----
let toastTimer = null;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}
