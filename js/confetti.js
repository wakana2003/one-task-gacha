// ============================================
// confetti.js — 紙吹雪の演出
// ============================================

function confetti(n = 18) {
  const emojis = ['🎉', '✨', '⭐', '🎊', '💫'];
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.animationDuration = (1.2 + Math.random() * 1.5) + 's';
    el.style.animationDelay = Math.random() * .3 + 's';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
}
