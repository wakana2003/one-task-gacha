// ============================================
// storage.js — 状態の管理と保存（localStorage）
// ============================================

const $ = id => document.getElementById(id);
const KEY = 'oneTaskGacha';

// ガチャのカテゴリ定義（増やしたいときはここに足すだけ）
const CATS = [
  { id: '日常', emoji: '🏠' },
  { id: '掃除', emoji: '🧹' },
  { id: '勉強', emoji: '📚' },
  { id: '運動', emoji: '💪' },
];
const catEmoji = id => {
  const c = CATS.find(c => c.id === id);
  return c ? c.emoji : '🏠';
};

// 日付ヘルパー（ローカル時刻基準）
const dateToStr = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayISO = () => dateToStr(new Date());
const addDays = n => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return dateToStr(d);
};

// アプリ全体で共有する状態
let state = {
  tasks: [],            // {id, name, cat, freq, nextDue}
  totalPulls: 0,
  dontotal: 0,          // 完了タスク累計
  todayPulls: 0,
  todayDate: '',
  currentId: null       // 引いたけど未完了のタスクID
};

// 保存データの読み込み
try {
  const saved = JSON.parse(localStorage.getItem(KEY));
  if (saved) state = Object.assign(state, saved);
} catch (e) {}

// 旧バージョンのデータを新形式に変換
state.tasks.forEach(t => {
  if (!t.cat) t.cat = '日常';
  if (!t.freq) t.freq = 1;                              // 何日ごとに復活するか
  if (!t.nextDue) t.nextDue = t.done ? addDays(1) : todayISO(); // 次に出す日
  delete t.done;
});

// 日付が変わったら「今日のガチャ」をリセット
if (state.todayDate !== todayISO()) {
  state.todayDate = todayISO();
  state.todayPulls = 0;
}

const save = () => localStorage.setItem(KEY, JSON.stringify(state));

// 出す時期が来ているか
const isDue = t => t.nextDue <= todayISO();

// いま選択中のカテゴリ（'all' = すべて）
let selectedCat = 'all';

// 抽選対象 = 選択中カテゴリ かつ 時期が来ているタスク
const remaining = () =>
  state.tasks.filter(t => isDue(t) && (selectedCat === 'all' || t.cat === selectedCat));

// ガチャの実行中フラグと、いま引いているタスク（全ファイル共有）
let spinning = false;
let currentTask = null;
