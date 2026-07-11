// ============================================
// storage.js — 状態の管理と保存（localStorage）
// ============================================

const $ = id => document.getElementById(id);
const KEY = 'oneTaskGacha';

// アプリ全体で共有する状態
let state = {
  tasks: [],            // {id, name, done}
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

// 日付が変わったら「今日のガチャ」をリセット
const todayStr = new Date().toISOString().slice(0, 10);
if (state.todayDate !== todayStr) {
  state.todayDate = todayStr;
  state.todayPulls = 0;
}

const save = () => localStorage.setItem(KEY, JSON.stringify(state));

// 未完了タスクだけを取り出す
const remaining = () => state.tasks.filter(t => !t.done);

// ガチャの実行中フラグと、いま引いているタスク（全ファイル共有）
let spinning = false;
let currentTask = null;
