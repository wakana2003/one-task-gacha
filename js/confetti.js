function confetti(n = 18) {
  const images = [
    'effect/kirakira_01_lightyellow.png',
    'effect/kirakira_02_lightyellow.png',
    'effect/kirakira_01_yellow.png',
    'effect/kirakira_02_yellow.png',
    'effect/kogeki_hit_01.png',
  ];
  for (let i = 0; i < n; i++) {
    const el = document.createElement('img');   // div → img に変更
    el.className = 'confetti';
    el.src = images[Math.floor(Math.random() * images.length)];  // textContent → src
    el.alt = '';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.animationDuration = (1.2 + Math.random() * 1.5) + 's';
    el.style.animationDelay = Math.random() * .3 + 's';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
}