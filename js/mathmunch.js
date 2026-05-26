/**
 * MathMunch shared module
 * Sound FX · Progress Tracker · Score Counter · Game Summary Card · Adaptive Difficulty
 * Injected into all game and book pages via <script> tag.
 */
(function () {
  'use strict';

  // ─────────────────────────────────────────────
  // SOUND FX  (Web Audio API — zero external files)
  // ─────────────────────────────────────────────
  let _audioCtx = null;

  function ctx() {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
  }

  function tone(freq, type, startDelay, duration, gainPeak) {
    try {
      const c = ctx();
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime + startDelay);
      gain.gain.setValueAtTime(0.001, c.currentTime + startDelay);
      gain.gain.linearRampToValueAtTime(gainPeak, c.currentTime + startDelay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startDelay + duration);
      osc.start(c.currentTime + startDelay);
      osc.stop(c.currentTime + startDelay + duration + 0.05);
    } catch (_) {}
  }

  window.SoundFX = {
    correct() {
      tone(523, 'sine', 0,    0.12, 0.25);  // C5
      tone(659, 'sine', 0.08, 0.12, 0.25);  // E5
      tone(784, 'sine', 0.16, 0.20, 0.28);  // G5
    },
    wrong() {
      tone(280, 'sawtooth', 0,    0.10, 0.20);
      tone(210, 'sawtooth', 0.10, 0.18, 0.15);
    },
    complete() {
      [523, 659, 784, 1047].forEach((f, i) =>
        tone(f, 'sine', i * 0.13, 0.35, 0.30)
      );
    },
    pageFlip() { tone(900, 'sine', 0, 0.06, 0.08); },
    tick()     { tone(1200, 'sine', 0, 0.04, 0.06); }
  };

  document.addEventListener('click', () => {
    if (_audioCtx && _audioCtx.state === 'suspended') _audioCtx.resume();
  }, { once: true });


  // ─────────────────────────────────────────────
  // PROGRESS TRACKER
  // ─────────────────────────────────────────────
  const PROGRESS_KEY = 'mm_progress';

  function loadP() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
    catch (_) { return {}; }
  }

  function saveP(data) {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(data)); } catch (_) {}
  }

  function gameId() {
    return window.location.pathname.split('/').pop().replace('.html', '');
  }

  function strand() {
    const p = window.location.pathname;
    if (p.includes('/number/'))     return 'number';
    if (p.includes('/geometry/'))   return 'geometry';
    if (p.includes('/statistics/')) return 'statistics';
    if (p.includes('/books/'))      return 'books';
    return 'other';
  }

  function updateStreak(data) {
    const today = new Date().toDateString();
    if (data.lastActiveDay === today) return;
    const yesterday = new Date(Date.now() - 86_400_000).toDateString();
    data.streak = (data.lastActiveDay === yesterday) ? (data.streak || 0) + 1 : 1;
    data.lastActiveDay = today;
  }

  function recordGameComplete(score, total) {
    const data  = loadP();
    const id    = gameId();
    const st    = strand();
    const title = document.title.split('–')[0].trim();
    const now   = Date.now();

    if (!data.games) data.games = {};
    const g = data.games[id] || { played: 0, bestScore: 0, totalScore: 0, title, strand: st };
    g.played++;
    g.lastScore   = score;
    g.totalScore += score;
    g.lastPlayed  = now;
    g.total       = total || 10;
    g.title       = title;
    g.strand      = st;
    if (score > g.bestScore) g.bestScore = score;
    data.games[id] = g;

    data.totalScore  = (data.totalScore  || 0) + score;
    data.gamesPlayed = (data.gamesPlayed || 0) + 1;
    updateStreak(data);
    saveP(data);
  }

  function recordBookPage(page, total) {
    const data  = loadP();
    const id    = gameId();
    const title = document.title.split('–')[0].trim();
    const now   = Date.now();

    if (!data.books) data.books = {};
    const b = data.books[id] || { lastPage: 0, completed: false, title };
    b.lastPage   = Math.max(b.lastPage, page);
    b.lastRead   = now;
    b.title      = title;
    b.totalPages = total || 8;
    if (page >= (total || 8)) b.completed = true;
    data.books[id] = b;
    updateStreak(data);
    saveP(data);
  }

  window.ProgressTracker = { recordGameComplete, recordBookPage, load: loadP };


  // ─────────────────────────────────────────────
  // ANIMATED SCORE COUNTER
  // ─────────────────────────────────────────────
  function countUp(el, from, to, durationMs) {
    const start = performance.now();
    const range = to - from;
    if (range <= 0) return;
    (function tick(now) {
      const t    = Math.min((now - start) / durationMs, 1);
      const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
      el.textContent = Math.round(from + range * ease);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = to;
    })(performance.now());
  }
  window.CountUp = countUp;


  // ─────────────────────────────────────────────
  // ADAPTIVE DIFFICULTY
  // ─────────────────────────────────────────────
  const DIFF_KEY = 'mm_difficulty';
  let _sessionCorrect = 0;
  let _sessionWrong   = 0;

  const AdaptiveDifficulty = {
    record(isCorrect) {
      if (isCorrect) _sessionCorrect++;
      else           _sessionWrong++;
      // Persist running totals after every answer
      try {
        const d  = JSON.parse(localStorage.getItem(DIFF_KEY) || '{}');
        const id = gameId();
        if (!d[id]) d[id] = { correct: 0, wrong: 0, plays: 0 };
        d[id].correct = (d[id].correct || 0) + (isCorrect ? 1 : 0);
        d[id].wrong   = (d[id].wrong   || 0) + (isCorrect ? 0 : 1);
        localStorage.setItem(DIFF_KEY, JSON.stringify(d));
      } catch (_) {}
    },
    get() {
      try {
        const d = JSON.parse(localStorage.getItem(DIFF_KEY) || '{}');
        const g = d[gameId()];
        if (!g || (g.correct + g.wrong) < 10) return 'medium';
        const ratio = g.correct / (g.correct + g.wrong);
        if (ratio >= 0.80) return 'hard';
        if (ratio <= 0.45) return 'easy';
        return 'medium';
      } catch (_) { return 'medium'; }
    },
    level() { return { easy: 1, medium: 2, hard: 3 }[this.get()] || 2; },
    sessionRatio() {
      const t = _sessionCorrect + _sessionWrong;
      return t > 0 ? _sessionCorrect / t : 0.5;
    }
  };
  window.AdaptiveDifficulty = AdaptiveDifficulty;


  // ─────────────────────────────────────────────
  // GAME SUMMARY CARD
  // ─────────────────────────────────────────────
  let _gameStartTime = null;

  // Next-game lookup by strand (for Play Next suggestion)
  const _NEXT = {
    number:     ['counting-safari','add-subtract-adventure','fraction-forest','multiplication-mountains','place-value-party','number-quest','times-table-tornado','division-dungeon','number-line-hop','rounding-rocket'],
    geometry:   ['shape-explorer','angle-adventurer','area-arena','symmetry-lab','coordinate-commander','perimeter-patrol','transformation-station','measure-mission','time-tracker','volume-voyage'],
    statistics: ['bar-chart-builder','data-detective','chance-castle','mean-machine','pie-chart-party','tally-town','venn-voyage','line-graph-lab','graph-garden','carroll-diagram'],
  };

  function _pickNext() {
    const st   = strand();
    const pool = _NEXT[st] || [];
    if (!pool.length) return null;
    const played = Object.keys(loadP().games || {});
    const fresh  = pool.filter(id => !played.includes(id));
    const source = fresh.length ? fresh : pool;
    const pick   = source[Math.floor(Math.random() * source.length)];
    // Avoid suggesting the current game
    return pick === gameId() ? source[(source.indexOf(pick) + 1) % source.length] : pick;
  }

  function _injectSummaryStyles() {
    if (document.getElementById('mm-ss')) return;
    const s = document.createElement('style');
    s.id = 'mm-ss';
    s.textContent = `
      #mmSummary{position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.72);
        backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;
        animation:mmFI .25s ease}
      @keyframes mmFI{from{opacity:0}to{opacity:1}}
      .mm-card{background:#fff;border-radius:28px;padding:36px 32px;max-width:400px;width:92%;
        text-align:center;box-shadow:0 24px 64px rgba(0,0,0,.28);
        font-family:'Lexend',system-ui,sans-serif;
        animation:mmSU .35s cubic-bezier(.22,1,.36,1)}
      @keyframes mmSU{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
      .mm-emoji{font-size:3.2rem;margin-bottom:6px}
      .mm-title{font-family:'Quicksand',system-ui,sans-serif;font-size:1.55rem;font-weight:700;color:#191C1E;margin-bottom:2px}
      .mm-sub{font-size:.82rem;color:#727785;margin-bottom:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mm-stars{font-size:2rem;letter-spacing:3px;margin-bottom:14px}
      .mm-sf{color:#FBBF24}.mm-se{color:#E2E8F0}
      .mm-row{display:flex;gap:10px;margin-bottom:14px}
      .mm-s{background:#F8FAFC;border-radius:14px;padding:12px;flex:1;border:2px solid #E2E8F0}
      .mm-sv{font-family:'Quicksand',sans-serif;font-size:1.35rem;font-weight:700;color:#191C1E}
      .mm-sl{font-size:.68rem;color:#727785;margin-top:2px}
      .mm-nb{background:linear-gradient(135deg,#FFF7ED,#FEF3C7)!important;border-color:#FED7AA!important}
      .mm-nb .mm-sv{color:#C2410C}
      .mm-db{display:inline-block;padding:3px 12px;border-radius:999px;font-size:.72rem;font-weight:700;margin-bottom:14px}
      .mm-de{background:#D1FAE5;color:#065F46}.mm-dm{background:#DBEAFE;color:#1E40AF}.mm-dh{background:#FEE2E2;color:#991B1B}
      .mm-btns{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
      .mm-btn{padding:11px 20px;border-radius:999px;font-family:'Lexend',sans-serif;font-size:.85rem;font-weight:700;
        cursor:pointer;border:none;text-decoration:none;transition:transform .1s;display:inline-flex;align-items:center;gap:6px}
      .mm-btn:hover{transform:translateY(-2px)}
      .mm-bp{background:#F97316;color:#fff;box-shadow:0 4px 0 #C2410C}
      .mm-bs{background:#F1F5F9;color:#424754;box-shadow:0 2px 0 #CBD5E1}
    `;
    document.head.appendChild(s);
  }

  function showSummaryCard(score, total, prevBest) {
    if (strand() === 'books') return;
    _injectSummaryStyles();

    const pct   = total ? score / total : 0;
    const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : pct > 0 ? 1 : 0;
    const emoji = ['💪','👍','⭐','🏆'][stars];
    const title = ['Keep Practising!','Good Effort!','Great Work!','Perfect Score!'][stars];

    const isNewBest = score > (prevBest || 0);
    const timeSec   = _gameStartTime ? Math.round((Date.now() - _gameStartTime) / 1000) : null;
    const timeStr   = timeSec !== null
      ? (timeSec >= 60 ? Math.floor(timeSec / 60) + 'm ' + (timeSec % 60) + 's' : timeSec + 's')
      : '—';

    const diff  = AdaptiveDifficulty.get();
    const dCls  = { easy: 'mm-de', medium: 'mm-dm', hard: 'mm-dh' }[diff];
    const dLbl  = { easy: '🟢 Easy Mode', medium: '🔵 Standard Mode', hard: '🔴 Challenge Mode' }[diff];

    const nextId   = _pickNext();
    const nextHref = nextId ? './' + nextId + '.html' : 'index.html';
    const nextLbl  = nextId ? '▶ Play Next' : '🎮 More Games';

    const root = window.location.pathname.includes('/books/') ? '../' : '../../';

    const overlay = document.createElement('div');
    overlay.id = 'mmSummary';
    overlay.innerHTML = `
      <div class="mm-card">
        <div class="mm-emoji">${emoji}</div>
        <div class="mm-title">${title}</div>
        <div class="mm-sub">${(document.title.split('–')[0] || '').trim()}</div>
        <div class="mm-stars">
          ${'<span class="mm-sf">★</span>'.repeat(stars)}${'<span class="mm-se">★</span>'.repeat(3 - stars)}
        </div>
        <div class="mm-row">
          <div class="mm-s ${isNewBest ? 'mm-nb' : ''}">
            <div class="mm-sv">${score}/${total}</div>
            <div class="mm-sl">${isNewBest ? '🏅 New Best!' : 'Score'}</div>
          </div>
          <div class="mm-s">
            <div class="mm-sv">${timeStr}</div>
            <div class="mm-sl">Time Taken</div>
          </div>
          <div class="mm-s">
            <div class="mm-sv">${Math.max(score, prevBest || 0)}/${total}</div>
            <div class="mm-sl">Personal Best</div>
          </div>
        </div>
        <span class="mm-db ${dCls}">${dLbl}</span>
        <div class="mm-btns">
          <button class="mm-btn mm-bp" onclick="location.reload()">↺ Play Again</button>
          <a class="mm-btn mm-bs" href="${nextHref}">${nextLbl} →</a>
          <a class="mm-btn mm-bs" href="${root}dashboard.html">📊 My Journey</a>
        </div>
      </div>`;

    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }


  // ─────────────────────────────────────────────
  // AUTO-DETECT EVENTS  (MutationObserver)
  // ─────────────────────────────────────────────
  let _endFired = false;

  function onEndScreenShown() {
    if (_endFired) return;
    _endFired = true;
    SoundFX.complete();

    setTimeout(() => {
      const scoreEl = document.getElementById('score') || document.getElementById('scoreDisplay');
      const score   = scoreEl ? (parseInt(scoreEl.textContent) || 0) : 0;
      const total   = 10;

      // Read personal best BEFORE saving new score
      const prevData = loadP();
      const prevBest = prevData.games && prevData.games[gameId()]
        ? (prevData.games[gameId()].bestScore || 0) : 0;

      recordGameComplete(score, total);
      showSummaryCard(score, total, prevBest);
    }, 350);
  }

  const END_IDS = new Set(['endScreen', 'endOverlay', 'endWrap']);

  const mutObs = new MutationObserver(mutations => {
    for (const m of mutations) {

      // ── Text node change → animated score counter ──
      if (m.type === 'characterData') {
        const el = m.target.parentElement;
        if (el && (el.id === 'score' || el.id === 'scoreDisplay' || el.classList.contains('score'))) {
          const from = parseInt(m.oldValue) || 0;
          const to   = parseInt(m.target.data) || 0;
          if (to > from) countUp(el, from, to, 500);
        }
        continue;
      }

      if (m.type !== 'attributes') continue;
      const el   = m.target;
      const prev = m.oldValue || '';
      const curr = el.className || '';

      if (m.attributeName === 'class') {
        // Correct / wrong sounds + difficulty tracking
        if (!prev.includes('correct') && curr.includes('correct') && !curr.includes('incorrect')) {
          SoundFX.correct();
          AdaptiveDifficulty.record(true);
          if (!_gameStartTime) _gameStartTime = Date.now();
        }
        if (!prev.includes('wrong') && curr.includes('wrong')) {
          SoundFX.wrong();
          AdaptiveDifficulty.record(false);
          if (!_gameStartTime) _gameStartTime = Date.now();
        }
        // End screen via classList.add('show')
        if (!prev.includes('show') && curr.includes('show')) {
          if (END_IDS.has(el.id) || el.classList.contains('end-card-wrap')) {
            onEndScreenShown();
          }
        }
      }

      // End screen via style.display (older pattern)
      if (m.attributeName === 'style' && END_IDS.has(el.id)) {
        if (el.style.display === 'flex' && (m.oldValue || '').includes('none')) {
          onEndScreenShown();
        }
      }
    }
  });

  function startObserving() {
    mutObs.observe(document.body, {
      subtree:               true,
      attributes:            true,
      attributeOldValue:     true,
      attributeFilter:       ['class', 'style'],
      characterData:         true,
      characterDataOldValue: true,
    });

    // Book page tracking
    if (typeof window.goToPage === 'function') {
      const _orig = window.goToPage;
      window.goToPage = function (n) {
        _orig(n);
        SoundFX.pageFlip();
        recordBookPage(n, window.TOTAL_PAGES || 8);
      };
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserving);
  } else {
    startObserving();
  }


  // ─────────────────────────────────────────────
  // LEARNING OBJECTIVES PANEL
  // ─────────────────────────────────────────────

  const OBJECTIVES = {
    // ── NUMBER ──────────────────────────────────
    'counting-safari': {
      grade: 'Grade 1', stageColor: '#3B82F6', indonesianGrade: 'Kelas 1 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Nn1.01', text: 'Count, read and write numbers to 20; use one-to-one correspondence' },
        { type: 'indonesian', code: '1.B.1', text: 'Membilang dan membaca bilangan 1–20 dengan korespondensi satu-satu' },
      ]
    },
    'ten-frame-treasure': {
      grade: 'Grade 1', stageColor: '#3B82F6', indonesianGrade: 'Kelas 1 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Nn1.01', text: 'Count and represent numbers to 20 using ten frames' },
        { type: 'cambridge', code: 'Nn1.05', text: 'Know number bonds to 10; identify pairs that make 10' },
        { type: 'indonesian', code: '1.B.1', text: 'Membilang bilangan 1–20 menggunakan kerangka sepuluh' },
      ]
    },
    'odd-even-explorer': {
      grade: 'Grade 1', stageColor: '#3B82F6', indonesianGrade: 'Kelas 1 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Nn1.03', text: 'Identify odd and even numbers to 20; explain the pattern' },
        { type: 'indonesian', code: '1.B.3', text: 'Mengenal bilangan ganjil dan genap sampai 20; menjelaskan polanya' },
      ]
    },
    'skip-counting-spaceship': {
      grade: 'Grades 1–2', stageColor: '#3B82F6', indonesianGrade: 'Kelas 1–2 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Nn1.04', text: 'Skip count forwards and backwards in 2s, 5s and 10s' },
        { type: 'cambridge', code: 'Nn2.02', text: 'Count in steps of 2, 3, 4, 5 and 10 from any number' },
        { type: 'indonesian', code: '1.B.4', text: 'Berhitung loncat 2, 5, dan 10; mengenali pola bilangan' },
      ]
    },
    'number-bonds-blaster': {
      grade: 'Grade 1', stageColor: '#3B82F6', indonesianGrade: 'Kelas 1 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Nn1.05', text: 'Know number bonds to 10 and 20 by heart; use to add and subtract mentally' },
        { type: 'indonesian', code: '1.B.5', text: 'Hafal pasangan bilangan sampai 10 dan 20; menerapkan dalam penjumlahan dan pengurangan' },
      ]
    },
    'add-subtract-adventure': {
      grade: 'Grade 1', stageColor: '#3B82F6', indonesianGrade: 'Kelas 1 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Nn1.06', text: 'Add and subtract numbers within 20; use number bonds and counting on strategies' },
        { type: 'indonesian', code: '1.B.5', text: 'Melakukan penjumlahan dan pengurangan bilangan dalam 20 menggunakan berbagai strategi' },
      ]
    },
    'place-value-party': {
      grade: 'Grades 2–4', stageColor: '#3B82F6', indonesianGrade: 'Kelas 2–4 / Fase A–B',
      objectives: [
        { type: 'cambridge', code: 'Nn2.01', text: 'Understand place value in 2-digit numbers (tens and ones)' },
        { type: 'cambridge', code: 'Nn3.01', text: 'Understand place value in 3-digit numbers; compare and order' },
        { type: 'cambridge', code: 'Nn4.01', text: 'Understand place value in 4-digit numbers; multiply/divide by 10 and 100' },
        { type: 'indonesian', code: '2.B.1', text: 'Memahami nilai tempat puluhan dan satuan pada bilangan dua angka' },
      ]
    },
    'number-line-hop': {
      grade: 'Grades 2–4', stageColor: '#3B82F6', indonesianGrade: 'Kelas 2–4 / Fase A–B',
      objectives: [
        { type: 'cambridge', code: 'Nn2.01', text: 'Order and compare 2-digit numbers on a number line' },
        { type: 'cambridge', code: 'Nn4.04', text: 'Understand negative numbers on a number line' },
        { type: 'indonesian', code: '2.B.1', text: 'Membandingkan dan mengurutkan bilangan pada garis bilangan' },
      ]
    },
    'fraction-forest': {
      grade: 'Grades 1–5', stageColor: '#3B82F6', indonesianGrade: 'Kelas 1–5 / Fase A–C',
      objectives: [
        { type: 'cambridge', code: 'Nn1.07', text: 'Find one half and one quarter of shapes and sets of objects' },
        { type: 'cambridge', code: 'Nn2.06', text: 'Recognise and use halves, quarters, thirds and three quarters' },
        { type: 'cambridge', code: 'Nn4.05', text: 'Recognise and generate equivalent fractions; add and subtract like fractions' },
        { type: 'indonesian', code: '2.B.6', text: 'Mengenal pecahan ½, ¼, ⅓, dan ¾ sebagai bagian dari keseluruhan' },
      ]
    },
    'times-table-tornado': {
      grade: 'Grades 2–3', stageColor: '#3B82F6', indonesianGrade: 'Kelas 2–3 / Fase A–B',
      objectives: [
        { type: 'cambridge', code: 'Nn2.04', text: 'Understand multiplication as repeated addition; recall ×2, ×5, ×10 tables' },
        { type: 'cambridge', code: 'Nn3.03', text: 'Recall multiplication tables for 2, 3, 4, 5, 6 and 10' },
        { type: 'indonesian', code: '2.B.4', text: 'Memahami perkalian sebagai penjumlahan berulang; hafal perkalian 2, 5, 10' },
        { type: 'indonesian', code: '3.B.3', text: 'Hafal perkalian 1–10; menerapkan perkalian untuk memecahkan masalah' },
      ]
    },
    'multiplication-mountains': {
      grade: 'Grades 2–4', stageColor: '#3B82F6', indonesianGrade: 'Kelas 2–4 / Fase A–B',
      objectives: [
        { type: 'cambridge', code: 'Nn2.04', text: 'Understand and use multiplication as repeated addition; use arrays' },
        { type: 'cambridge', code: 'Nn3.03', text: 'Recall and apply multiplication tables for 2, 3, 4, 5, 6 and 10' },
        { type: 'cambridge', code: 'Nn4.03', text: 'Short multiplication: 2-digit × 1-digit using formal written methods' },
        { type: 'indonesian', code: '3.B.3', text: 'Hafal perkalian 1–10; memahami konsep perkalian sebagai penjumlahan berulang' },
      ]
    },
    'division-dungeon': {
      grade: 'Grades 2–4', stageColor: '#3B82F6', indonesianGrade: 'Kelas 2–4 / Fase A–B',
      objectives: [
        { type: 'cambridge', code: 'Nn2.05', text: 'Understand division as grouping and sharing; link to multiplication' },
        { type: 'cambridge', code: 'Nn3.04', text: 'Divide by 2, 3, 4, 5 and 10 with and without remainders' },
        { type: 'cambridge', code: 'Nn4.03', text: 'Short division: 2-digit ÷ 1-digit; interpret remainders in context' },
        { type: 'indonesian', code: '3.B.4', text: 'Memahami pembagian sebagai kebalikan perkalian; menghitung dengan sisa' },
      ]
    },
    'decimal-diner': {
      grade: 'Grades 4–6', stageColor: '#EA580C', indonesianGrade: 'Kelas 4–6 / Fase B–C',
      objectives: [
        { type: 'cambridge', code: 'Nn4.06', text: 'Understand tenths and hundredths as decimals; order decimals to 2 d.p.' },
        { type: 'cambridge', code: 'Nn5.03', text: 'Convert fluently between fractions, decimals and percentages' },
        { type: 'cambridge', code: 'Nn6.03', text: 'Calculate percentage increase and decrease in real-world contexts' },
        { type: 'indonesian', code: '4.B.6', text: 'Memahami desimal persepuluhan dan perseratusan; membandingkan dan mengurutkan' },
      ]
    },
    'rounding-rocket': {
      grade: 'Grade 3', stageColor: '#7C3AED', indonesianGrade: 'Kelas 3 / Fase B',
      objectives: [
        { type: 'cambridge', code: 'Nn3.06', text: 'Round whole numbers to the nearest 10 and 100' },
        { type: 'indonesian', code: '3.B.6', text: 'Membulatkan bilangan ke puluhan dan ratusan terdekat' },
      ]
    },
    'negative-number-ninja': {
      grade: 'Grades 4–5', stageColor: '#EA580C', indonesianGrade: 'Kelas 4–5 / Fase B–C',
      objectives: [
        { type: 'cambridge', code: 'Nn4.04', text: 'Understand and use negative numbers on a number line; order negatives' },
        { type: 'cambridge', code: 'Nn5.02', text: 'Use negative numbers in context; calculate across zero' },
        { type: 'indonesian', code: '4.B.4', text: 'Mengenal dan menggunakan bilangan negatif pada garis bilangan' },
        { type: 'indonesian', code: '5.B.1', text: 'Bilangan bulat positif dan negatif; operasi dan posisi pada garis bilangan' },
      ]
    },
    'factor-finder': {
      grade: 'Grades 4–6', stageColor: '#EA580C', indonesianGrade: 'Kelas 4–6 / Fase B–C',
      objectives: [
        { type: 'cambridge', code: 'Nn4.07', text: 'Find all factors and multiples of numbers; identify common factors' },
        { type: 'cambridge', code: 'Nn6.01', text: 'Identify prime numbers to 100; find prime factors; understand square numbers' },
        { type: 'cambridge', code: 'Nn6.02', text: 'Calculate the Highest Common Factor (HCF) and Lowest Common Multiple (LCM)' },
        { type: 'indonesian', code: '4.B.7', text: 'Mencari FPB dan KPK dua bilangan; mengenal faktor dan kelipatan' },
      ]
    },
    'number-quest': {
      grade: 'Grades 2–6', stageColor: '#3B82F6', indonesianGrade: 'Kelas 2–6 / Fase A–C',
      objectives: [
        { type: 'cambridge', code: 'Nn2.03', text: 'Add and subtract 2-digit numbers using written and mental methods' },
        { type: 'cambridge', code: 'Nn4.01', text: 'Place value in 4-digit numbers; multiply and divide by 10 and 100' },
        { type: 'cambridge', code: 'Nn5.04', text: 'Understand and apply order of operations (brackets first, then × and ÷)' },
        { type: 'indonesian', code: '4.B.2', text: 'Penjumlahan dan pengurangan bilangan empat angka menggunakan strategi tertulis' },
      ]
    },
    'number-compare': {
      grade: 'Grade 1', stageColor: '#3B82F6', indonesianGrade: 'Kelas 1 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Nn1.02', text: 'Compare and order numbers to 20 using < > = symbols' },
        { type: 'indonesian', code: '1.B.2', text: 'Membandingkan dan mengurutkan bilangan sampai 20 menggunakan <, >, =' },
      ]
    },
    'hundred-square-hunt': {
      grade: 'Grade 3', stageColor: '#7C3AED', indonesianGrade: 'Kelas 3 / Fase B',
      objectives: [
        { type: 'cambridge', code: 'Nn3.02', text: 'Use a 100-square to recognise number sequences and patterns' },
        { type: 'indonesian', code: '3.B.2', text: 'Menggunakan tabel 100 untuk mengenali pola dan urutan bilangan' },
      ]
    },
    'double-half-dash': {
      grade: 'Grade 3', stageColor: '#7C3AED', indonesianGrade: 'Kelas 3 / Fase B',
      objectives: [
        { type: 'cambridge', code: 'Nn3.05', text: 'Double and halve numbers up to 100; derive related facts' },
        { type: 'indonesian', code: '3.B.5', text: 'Menggandakan dan membagi dua bilangan sampai 100; menggunakan fakta turunan' },
      ]
    },
    'column-calculator': {
      grade: 'Grade 4', stageColor: '#EA580C', indonesianGrade: 'Kelas 4 / Fase B',
      objectives: [
        { type: 'cambridge', code: 'Nn4.02', text: 'Add and subtract 3- and 4-digit numbers using formal written column methods' },
        { type: 'indonesian', code: '4.B.2', text: 'Menjumlahkan dan mengurangkan bilangan 3–4 angka dengan metode kolom bersusun' },
      ]
    },
    'big-number-blitz': {
      grade: 'Grade 5', stageColor: '#E11D48', indonesianGrade: 'Kelas 5 / Fase C',
      objectives: [
        { type: 'cambridge', code: 'Nn5.01', text: 'Read, write and order numbers up to 1 000 000; understand place value' },
        { type: 'indonesian', code: '5.B.1', text: 'Membaca, menulis, dan mengurutkan bilangan sampai 1.000.000; memahami nilai tempat' },
      ]
    },
    'long-multiplication-lab': {
      grade: 'Grade 5', stageColor: '#E11D48', indonesianGrade: 'Kelas 5 / Fase C',
      objectives: [
        { type: 'cambridge', code: 'Nn5.05', text: 'Multiply 2-digit numbers by 2-digit numbers using long multiplication' },
        { type: 'indonesian', code: '5.B.5', text: 'Mengalikan bilangan dua angka dengan dua angka menggunakan cara panjang' },
      ]
    },
    'remainder-ranger': {
      grade: 'Grade 5', stageColor: '#E11D48', indonesianGrade: 'Kelas 5 / Fase C',
      objectives: [
        { type: 'cambridge', code: 'Nn5.06', text: 'Divide numbers with remainders; interpret remainders in context' },
        { type: 'indonesian', code: '5.B.6', text: 'Membagi bilangan dengan sisa; menafsirkan sisa dalam konteks masalah' },
      ]
    },
    'percent-plaza': {
      grade: 'Grade 6', stageColor: '#EA580C', indonesianGrade: 'Kelas 6 / Fase C',
      objectives: [
        { type: 'cambridge', code: 'Nn6.04', text: 'Calculate percentages of quantities; convert fluently between fractions, decimals and percentages' },
        { type: 'indonesian', code: '6.B.4', text: 'Menghitung persentase suatu bilangan; mengonversi antara pecahan, desimal, dan persen' },
      ]
    },
    'problem-pyramid': {
      grade: 'Grade 6', stageColor: '#EA580C', indonesianGrade: 'Kelas 6 / Fase C',
      objectives: [
        { type: 'cambridge', code: 'Nn6.05', text: 'Solve multi-step word problems using all four operations; choose appropriate methods' },
        { type: 'indonesian', code: '6.B.5', text: 'Memecahkan soal cerita bertingkat menggunakan empat operasi; memilih strategi yang tepat' },
      ]
    },

    // ── GEOMETRY ────────────────────────────────
    'shape-explorer': {
      grade: 'Grades 1–2', stageColor: '#10B981', indonesianGrade: 'Kelas 1–2 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Gm1.01', text: 'Name, sort and describe common 2D shapes by their properties' },
        { type: 'cambridge', code: 'Gm2.01', text: 'Describe properties of 2D shapes: number of sides, corners and symmetry' },
        { type: 'indonesian', code: '1.G.1', text: 'Mengenal dan mendeskripsikan bentuk-bentuk 2D (lingkaran, segitiga, segiempat)' },
        { type: 'indonesian', code: '2.G.1', text: 'Mengelompokkan dan mengklasifikasikan bangun datar berdasarkan sifat-sifatnya' },
      ]
    },
    '3d-shape-safari': {
      grade: 'Grade 1', stageColor: '#10B981', indonesianGrade: 'Kelas 1 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Gm1.02', text: 'Name, sort and describe common 3D shapes; identify faces, edges and vertices' },
        { type: 'indonesian', code: '1.G.2', text: 'Mengenal bangun ruang (kubus, balok, kerucut, bola, tabung) dan sifat-sifatnya' },
      ]
    },
    'pattern-builder': {
      grade: 'Grades 1–3', stageColor: '#10B981', indonesianGrade: 'Kelas 1–3 / Fase A–B',
      objectives: [
        { type: 'cambridge', code: 'Gm1.04', text: 'Recognise, copy, continue and create repeating patterns using shapes and colours' },
        { type: 'cambridge', code: 'Nn3.07', text: 'Recognise and extend number sequences; identify and describe the rule' },
        { type: 'indonesian', code: '1.P.1', text: 'Mengenal dan melanjutkan pola sederhana menggunakan bentuk dan warna' },
        { type: 'indonesian', code: '3.A.1', text: 'Mengenali, melanjutkan, dan membuat pola bilangan; menjelaskan aturan pola' },
      ]
    },
    'position-pilot': {
      grade: 'Grades 1–2', stageColor: '#10B981', indonesianGrade: 'Kelas 1–2 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Gm1.03', text: 'Describe position, direction and movement using everyday language (left, right, above, below)' },
        { type: 'indonesian', code: '1.G.3', text: 'Mendeskripsikan posisi dan arah menggunakan bahasa sehari-hari (kiri, kanan, atas, bawah)' },
      ]
    },
    'symmetry-lab': {
      grade: 'Grades 2–5', stageColor: '#10B981', indonesianGrade: 'Kelas 2–5 / Fase A–C',
      objectives: [
        { type: 'cambridge', code: 'Gm2.02', text: 'Recognise and draw lines of symmetry in 2D shapes and patterns' },
        { type: 'cambridge', code: 'Gm5.04', text: 'Reflect shapes in mirror lines; describe reflections as transformations' },
        { type: 'indonesian', code: '2.G.2', text: 'Mengenal simetri lipat pada bangun datar; menggambar sumbu simetri' },
        { type: 'indonesian', code: '5.G.4', text: 'Melakukan dan mendeskripsikan refleksi bangun datar' },
      ]
    },
    'measure-mission': {
      grade: 'Grades 1–3', stageColor: '#10B981', indonesianGrade: 'Kelas 1–3 / Fase A–B',
      objectives: [
        { type: 'cambridge', code: 'Gm1.05', text: 'Compare and order lengths, heights and masses using non-standard and standard units' },
        { type: 'cambridge', code: 'Gm2.03', text: 'Measure length in centimetres and metres; measure mass in grams and kilograms' },
        { type: 'cambridge', code: 'Gm3.01', text: 'Measure length, mass and capacity in standard units; convert between cm and m, g and kg' },
        { type: 'indonesian', code: '3.P.1', text: 'Menggunakan satuan baku untuk mengukur panjang (cm, m) dan berat (g, kg)' },
      ]
    },
    'time-tracker': {
      grade: 'Grades 1–2', stageColor: '#10B981', indonesianGrade: 'Kelas 1–2 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Gm1.06', text: 'Read and write the time to the hour and half hour on analogue and digital clocks' },
        { type: 'cambridge', code: 'Gm2.04', text: 'Tell the time to the quarter and half hour; understand am/pm' },
        { type: 'indonesian', code: '1.P.2', text: 'Membaca waktu (jam) pada jam analog dan digital' },
        { type: 'indonesian', code: '2.P.4', text: 'Membaca dan menuliskan waktu sampai setengah jam dan seperempat jam' },
      ]
    },
    'calendar-quest': {
      grade: 'Grade 3', stageColor: '#7C3AED', indonesianGrade: 'Kelas 3 / Fase B',
      objectives: [
        { type: 'cambridge', code: 'Gm3.01', text: 'Use standard units of time; read and interpret calendars' },
        { type: 'indonesian', code: '3.P.3', text: 'Membaca dan menggunakan kalender; menghitung selang waktu dalam hari, minggu, bulan' },
      ]
    },
    'money-market': {
      grade: 'Grade 2', stageColor: '#3B82F6', indonesianGrade: 'Kelas 2 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Gm2.05', text: 'Recognise coins and notes; find totals and give change using mental strategies' },
        { type: 'indonesian', code: '2.P.3', text: 'Mengenal uang koin dan uang kertas; menghitung total dan uang kembalian' },
      ]
    },
    'angle-adventurer': {
      grade: 'Grades 3–6', stageColor: '#7C3AED', indonesianGrade: 'Kelas 3–6 / Fase B–C',
      objectives: [
        { type: 'cambridge', code: 'Gm3.02', text: 'Recognise right angles; compare angles as greater or less than a right angle' },
        { type: 'cambridge', code: 'Gm4.02', text: 'Classify angles as acute, right, obtuse or reflex; measure angles using a protractor' },
        { type: 'cambridge', code: 'Gm6.03', text: 'Calculate missing angles using the angle sum of triangles (180°) and polygons' },
        { type: 'indonesian', code: '4.G.2', text: 'Mengenal jenis-jenis sudut (lancip, siku-siku, tumpul, refleks); mengukur dengan busur derajat' },
      ]
    },
    'perimeter-patrol': {
      grade: 'Grades 3 & 6', stageColor: '#7C3AED', indonesianGrade: 'Kelas 3 & 6 / Fase B–C',
      objectives: [
        { type: 'cambridge', code: 'Gm3.03', text: 'Calculate the perimeter of rectilinear shapes by adding all side lengths' },
        { type: 'cambridge', code: 'Gm6.04', text: 'Calculate the circumference of a circle using C = πd' },
        { type: 'indonesian', code: '3.P.2', text: 'Menghitung keliling bangun datar dengan menjumlahkan panjang sisi-sisinya' },
        { type: 'indonesian', code: '6.G.2', text: 'Menghitung keliling lingkaran menggunakan rumus K = πd' },
      ]
    },
    'area-arena': {
      grade: 'Grades 4–6', stageColor: '#EA580C', indonesianGrade: 'Kelas 4–6 / Fase B–C',
      objectives: [
        { type: 'cambridge', code: 'Gm4.01', text: 'Calculate the area of rectangles and composite shapes by counting squares or using formulae' },
        { type: 'cambridge', code: 'Gm5.01', text: 'Calculate the area of triangles (½ × base × height) and parallelograms' },
        { type: 'cambridge', code: 'Gm6.04', text: 'Calculate the area of a circle using A = πr²' },
        { type: 'indonesian', code: '4.P.1', text: 'Menghitung luas persegi dan persegi panjang; mengenal satuan luas baku (cm², m²)' },
      ]
    },
    'coordinate-commander': {
      grade: 'Grades 4 & 6', stageColor: '#EA580C', indonesianGrade: 'Kelas 4 & 6 / Fase B–C',
      objectives: [
        { type: 'cambridge', code: 'Gm4.03', text: 'Plot and read coordinates in the first quadrant; describe positions and movements' },
        { type: 'cambridge', code: 'Gm6.01', text: 'Plot and read coordinates in all four quadrants; reflect shapes in axes' },
        { type: 'indonesian', code: '4.G.3', text: 'Menggunakan koordinat pada kuadran pertama untuk menggambar dan mendeskripsikan posisi' },
        { type: 'indonesian', code: '6.G.1', text: 'Menggunakan koordinat Kartesius empat kuadran; merefleksikan bangun datar' },
      ]
    },
    'net-navigator': {
      grade: 'Grade 5', stageColor: '#E11D48', indonesianGrade: 'Kelas 5 / Fase C',
      objectives: [
        { type: 'cambridge', code: 'Gm5.03', text: 'Identify and sketch nets of 3D shapes; build 3D shapes from nets' },
        { type: 'indonesian', code: '5.G.3', text: 'Mengenal jaring-jaring bangun ruang (kubus, balok, prisma); membuat dan mengidentifikasi jaring-jaring' },
      ]
    },
    'transformation-station': {
      grade: 'Grades 5–6', stageColor: '#E11D48', indonesianGrade: 'Kelas 5–6 / Fase C',
      objectives: [
        { type: 'cambridge', code: 'Gm5.04', text: 'Perform and describe reflections, rotations (90°/180°) and translations on a coordinate grid' },
        { type: 'cambridge', code: 'Gm6.02', text: 'Perform complex combinations of transformations; describe the effect on shape and position' },
        { type: 'indonesian', code: '5.G.4', text: 'Melakukan transformasi bangun datar: refleksi, rotasi (90° dan 180°), dan translasi' },
        { type: 'indonesian', code: '6.G.1', text: 'Transformasi lanjutan pada koordinat Kartesius empat kuadran' },
      ]
    },
    'volume-voyage': {
      grade: 'Grade 5', stageColor: '#E11D48', indonesianGrade: 'Kelas 5 / Fase C',
      objectives: [
        { type: 'cambridge', code: 'Gm5.02', text: 'Calculate the volume of cuboids using length × width × height; count unit cubes' },
        { type: 'indonesian', code: '5.G.2', text: 'Menghitung volume kubus dan balok menggunakan rumus panjang × lebar × tinggi' },
      ]
    },
    'capacity-cove': {
      grade: 'Grade 2', stageColor: '#10B981', indonesianGrade: 'Kelas 2 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Gm2.06', text: 'Compare and estimate capacity using litres and millilitres; read scales' },
        { type: 'indonesian', code: '2.P.6', text: 'Membandingkan dan mengestimasi kapasitas dalam liter dan mililiter; membaca skala' },
      ]
    },
    'turn-and-angle': {
      grade: 'Grade 3', stageColor: '#7C3AED', indonesianGrade: 'Kelas 3 / Fase B',
      objectives: [
        { type: 'cambridge', code: 'Gm3.04', text: 'Understand whole, half and quarter turns; identify right angles and perpendicular lines' },
        { type: 'indonesian', code: '3.G.4', text: 'Memahami putaran penuh, setengah, dan seperempat; mengenal sudut siku-siku dan garis tegak lurus' },
      ]
    },
    'grid-explorer': {
      grade: 'Grade 4', stageColor: '#EA580C', indonesianGrade: 'Kelas 4 / Fase B',
      objectives: [
        { type: 'cambridge', code: 'Gm4.04', text: 'Read and plot coordinates in all four quadrants of a coordinate grid' },
        { type: 'indonesian', code: '4.G.4', text: 'Membaca dan memplot koordinat pada keempat kuadran sistem koordinat Kartesius' },
      ]
    },

    // ── STATISTICS ───────────────────────────────
    'tally-town': {
      grade: 'Grades 1–3', stageColor: '#F97316', indonesianGrade: 'Kelas 1–3 / Fase A–B',
      objectives: [
        { type: 'cambridge', code: 'St1.02', text: 'Record data by counting objects and using tally marks' },
        { type: 'cambridge', code: 'St3.01', text: 'Collect and organise data in frequency tables using tally charts' },
        { type: 'indonesian', code: '1.D.2', text: 'Mencatat data dengan turus dan menghitung frekuensi' },
        { type: 'indonesian', code: '3.D.1', text: 'Mengumpulkan data dan mencatat dalam tabel frekuensi menggunakan turus' },
      ]
    },
    'graph-garden': {
      grade: 'Grades 1–2', stageColor: '#F97316', indonesianGrade: 'Kelas 1–2 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'St1.03', text: 'Read simple tables and pictograms; answer questions about the data' },
        { type: 'cambridge', code: 'St2.02', text: 'Read and interpret pictograms and simple bar charts; compare values' },
        { type: 'indonesian', code: '1.D.3', text: 'Membaca informasi dari tabel sederhana dan piktogram' },
        { type: 'indonesian', code: '2.D.2', text: 'Membaca dan menafsirkan piktogram dan diagram batang sederhana' },
      ]
    },
    'data-detective': {
      grade: 'Grades 1–4', stageColor: '#F97316', indonesianGrade: 'Kelas 1–4 / Fase A–B',
      objectives: [
        { type: 'cambridge', code: 'St1.01', text: 'Sort and classify objects by one criterion; count items in each group' },
        { type: 'cambridge', code: 'St2.03', text: 'Answer questions about data in charts and tables; draw conclusions' },
        { type: 'cambridge', code: 'St4.02', text: 'Complete and interpret frequency tables; identify the mode' },
        { type: 'indonesian', code: '1.D.1', text: 'Mengelompokkan benda berdasarkan satu sifat; menghitung jumlah setiap kelompok' },
      ]
    },
    'bar-chart-builder': {
      grade: 'Grades 2–4', stageColor: '#F97316', indonesianGrade: 'Kelas 2–4 / Fase A–B',
      objectives: [
        { type: 'cambridge', code: 'St2.02', text: 'Read, construct and interpret simple bar charts' },
        { type: 'cambridge', code: 'St3.02', text: 'Construct and interpret bar charts with a given scale; answer questions about the data' },
        { type: 'cambridge', code: 'St4.03', text: 'Construct and interpret bar charts; compare data sets' },
        { type: 'indonesian', code: '3.D.1', text: 'Mengumpulkan data dan menyajikan dalam diagram batang berskala' },
      ]
    },
    'carroll-diagram': {
      grade: 'Grade 3', stageColor: '#7C3AED', indonesianGrade: 'Kelas 3 / Fase B',
      objectives: [
        { type: 'cambridge', code: 'St3.03', text: 'Sort data using Carroll diagrams with two criteria (yes/no for each property)' },
        { type: 'indonesian', code: '3.D.3', text: 'Menggunakan diagram Carroll untuk mengelompokkan data dengan dua kriteria ya/tidak' },
      ]
    },
    'venn-voyage': {
      grade: 'Grade 3', stageColor: '#7C3AED', indonesianGrade: 'Kelas 3 / Fase B',
      objectives: [
        { type: 'cambridge', code: 'St3.03', text: 'Sort data using Venn diagrams with two overlapping criteria; identify items in the intersection' },
        { type: 'indonesian', code: '3.D.3', text: 'Menggunakan diagram Venn untuk mengelompokkan data dengan dua kriteria yang tumpang tindih' },
      ]
    },
    'line-graph-lab': {
      grade: 'Grade 4', stageColor: '#EA580C', indonesianGrade: 'Kelas 4 / Fase B',
      objectives: [
        { type: 'cambridge', code: 'St4.01', text: 'Read and plot data on line graphs; identify trends and patterns over time' },
        { type: 'indonesian', code: '4.D.1', text: 'Membaca dan menggambar grafik garis; mengidentifikasi tren dan perubahan data' },
      ]
    },
    'frequency-forest': {
      grade: 'Grade 4', stageColor: '#EA580C', indonesianGrade: 'Kelas 4 / Fase B',
      objectives: [
        { type: 'cambridge', code: 'St4.02', text: 'Complete frequency tables with grouped data; identify the mode from a table' },
        { type: 'indonesian', code: '4.D.2', text: 'Membuat dan menafsirkan tabel frekuensi; menentukan modus dari kumpulan data' },
      ]
    },
    'mean-machine': {
      grade: 'Grades 5–6', stageColor: '#E11D48', indonesianGrade: 'Kelas 5–6 / Fase C',
      objectives: [
        { type: 'cambridge', code: 'St5.01', text: 'Calculate the mean of a data set by totalling all values and dividing by the count' },
        { type: 'cambridge', code: 'St6.01', text: 'Calculate and interpret mean, median, mode and range; compare distributions' },
        { type: 'indonesian', code: '5.D.1', text: 'Menghitung mean (rata-rata) suatu kumpulan data' },
        { type: 'indonesian', code: '6.D.1', text: 'Menghitung dan menafsirkan mean, median, modus, dan jangkauan; membandingkan dua kumpulan data' },
      ]
    },
    'pie-chart-party': {
      grade: 'Grades 5–6', stageColor: '#E11D48', indonesianGrade: 'Kelas 5–6 / Fase C',
      objectives: [
        { type: 'cambridge', code: 'St5.03', text: 'Read, construct and interpret pie charts; link sector sizes to fractions and percentages' },
        { type: 'cambridge', code: 'St6.03', text: 'Justify choice of data representation; interpret complex charts including pie and line graphs' },
        { type: 'indonesian', code: '5.D.2', text: 'Menyajikan data dalam diagram lingkaran; menghubungkan dengan pecahan dan persen' },
        { type: 'indonesian', code: '6.D.2', text: 'Menyajikan dan menafsirkan data dalam grafik kompleks; memilih representasi yang tepat' },
      ]
    },
    'chance-castle': {
      grade: 'Grades 5–6', stageColor: '#E11D48', indonesianGrade: 'Kelas 5–6 / Fase C',
      objectives: [
        { type: 'cambridge', code: 'St5.02', text: 'Describe probability using the likelihood scale from impossible to certain' },
        { type: 'cambridge', code: 'St6.02', text: 'Calculate the probability of single and combined events as a fraction, decimal or percentage' },
        { type: 'indonesian', code: '5.D.3', text: 'Memahami konsep peluang; menentukan peluang suatu kejadian sederhana' },
        { type: 'indonesian', code: '6.D.3', text: 'Menghitung peluang kejadian tunggal dan majemuk sederhana' },
      ]
    },
    'spin-sort': {
      grade: 'Grades 5–6', stageColor: '#E11D48', indonesianGrade: 'Kelas 5–6 / Fase C',
      objectives: [
        { type: 'cambridge', code: 'St5.02', text: 'Describe probability using the likelihood scale; compare the probability of different outcomes' },
        { type: 'cambridge', code: 'St6.02', text: 'Calculate the probability of events from spinners and other random devices' },
        { type: 'indonesian', code: '5.D.3', text: 'Menentukan peluang suatu kejadian dari percobaan (dadu, spinner)' },
        { type: 'indonesian', code: '6.D.3', text: 'Menghitung dan membandingkan peluang dari berbagai kejadian' },
      ]
    },
    'data-collector': {
      grade: 'Grade 2', stageColor: '#F97316', indonesianGrade: 'Kelas 2 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'St2.01', text: 'Collect and record data by counting objects; organise results in a simple table' },
        { type: 'indonesian', code: '2.D.1', text: 'Mengumpulkan dan mencatat data dengan menghitung benda; menyusun dalam tabel sederhana' },
      ]
    },

    // ── BOOKS ────────────────────────────────────
    'the-pizza-fraction-adventure': {
      grade: 'Grades 1–5', stageColor: '#8B5CF6', indonesianGrade: 'Kelas 1–5 / Fase A–C',
      objectives: [
        { type: 'cambridge', code: 'Nn1.07', text: 'Find one half and one quarter of shapes and sets; understand equal sharing' },
        { type: 'cambridge', code: 'Nn2.06', text: 'Recognise halves, quarters, thirds and three quarters; write using fraction notation' },
        { type: 'cambridge', code: 'Nn4.05', text: 'Recognise equivalent fractions; add and subtract fractions with the same denominator' },
        { type: 'indonesian', code: '2.B.6', text: 'Mengenal pecahan ½, ¼, ⅓, ¾ sebagai bagian dari keseluruhan benda nyata' },
      ]
    },
    'the-counting-caterpillar': {
      grade: 'Grades 1–2', stageColor: '#3B82F6', indonesianGrade: 'Kelas 1–2 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Nn1.01', text: 'Count, read and write numbers to 20; understand the order of numbers' },
        { type: 'cambridge', code: 'Nn1.04', text: 'Skip count in 2s, 5s and 10s; recognise and describe counting patterns' },
        { type: 'cambridge', code: 'Nn2.02', text: 'Count in steps of 2, 3, 4, 5 and 10 from any number' },
        { type: 'indonesian', code: '1.B.1', text: 'Membilang bilangan 1–20 dengan urutan yang benar' },
      ]
    },
    // ── EY STORY BOOKS ───────────────────────────
    'bennys-balloon-day': {
      grade: 'Early Years', stageColor: '#F97316', indonesianGrade: 'PAUD / Pra-Sekolah',
      objectives: [
        { type: 'cambridge', code: 'EYNn.01', text: 'Count objects from 1 to 5; match numerals to quantities; understand one-to-one correspondence' },
        { type: 'cambridge', code: 'EYNn.02', text: 'Recognise and name numerals 1–5; understand that each number represents a quantity' },
        { type: 'indonesian', code: 'PAUD.B.1', text: 'Membilang benda 1–5 dengan korespondensi satu-satu; mengenal lambang bilangan 1–5' },
      ]
    },
    'the-shape-garden': {
      grade: 'Early Years', stageColor: '#8B5CF6', indonesianGrade: 'PAUD / Pra-Sekolah',
      objectives: [
        { type: 'cambridge', code: 'EYGm.01', text: 'Identify, name and describe 2D shapes: circle, square, triangle, rectangle; count sides and corners' },
        { type: 'cambridge', code: 'EYGm.02', text: 'Find and describe shapes in the environment; sort shapes by their properties' },
        { type: 'indonesian', code: 'PAUD.G.1', text: 'Mengenal dan menyebutkan bentuk 2D: lingkaran, persegi, segitiga, persegi panjang dalam kehidupan sehari-hari' },
      ]
    },
    'big-ella-little-max': {
      grade: 'Early Years', stageColor: '#06B6D4', indonesianGrade: 'PAUD / Pra-Sekolah',
      objectives: [
        { type: 'cambridge', code: 'EYNn.03', text: 'Compare and describe sizes using language: big/small, tall/short, long/short, heavy/light' },
        { type: 'cambridge', code: 'EYGm.03', text: 'Compare lengths, heights and weights using direct comparison and everyday language' },
        { type: 'indonesian', code: 'PAUD.B.2', text: 'Membandingkan ukuran benda menggunakan bahasa: besar/kecil, tinggi/pendek, panjang/pendek, berat/ringan' },
      ]
    },
    'mias-colour-sort': {
      grade: 'Early Years', stageColor: '#EC4899', indonesianGrade: 'PAUD / Pra-Sekolah',
      objectives: [
        { type: 'cambridge', code: 'EYSt.01', text: 'Sort objects into groups by a given criterion (colour, size, shape); explain sorting decisions' },
        { type: 'cambridge', code: 'EYSt.02', text: 'Count items in sorted groups; compare totals in different groups' },
        { type: 'indonesian', code: 'PAUD.S.1', text: 'Mengelompokkan benda berdasarkan warna, ukuran, atau bentuk; menghitung jumlah benda dalam setiap kelompok' },
      ]
    },
    'shapes-all-around-us': {
      grade: 'Grades 1–2', stageColor: '#10B981', indonesianGrade: 'Kelas 1–2 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Gm1.01', text: 'Name, sort and describe common 2D shapes; find shapes in the environment' },
        { type: 'cambridge', code: 'Gm1.02', text: 'Name, sort and describe common 3D shapes; find examples in real life' },
        { type: 'cambridge', code: 'Gm2.01', text: 'Describe properties of 2D shapes: sides, corners and lines of symmetry' },
        { type: 'indonesian', code: '1.G.1', text: 'Mengenal bentuk-bentuk 2D dan 3D dalam lingkungan sehari-hari' },
      ]
    },
    'the-great-multiplication-race': {
      grade: 'Grades 2–4', stageColor: '#7C3AED', indonesianGrade: 'Kelas 2–4 / Fase A–B',
      objectives: [
        { type: 'cambridge', code: 'Nn2.04', text: 'Understand multiplication as repeated addition; use arrays; recall ×2, ×5, ×10' },
        { type: 'cambridge', code: 'Nn3.03', text: 'Recall multiplication tables for 2, 3, 4, 5, 6 and 10; apply to solve problems' },
        { type: 'cambridge', code: 'Nn4.03', text: 'Short multiplication: 2-digit × 1-digit using formal written methods' },
        { type: 'indonesian', code: '2.B.4', text: 'Memahami perkalian sebagai penjumlahan berulang; hafal perkalian 2, 5, 10' },
      ]
    },

    // ── P1 STORY BOOKS ───────────────────────────
    'leo-counts-to-twenty': {
      grade: 'Grade 1', stageColor: '#3B82F6', indonesianGrade: 'Kelas 1 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Nn1.01', text: 'Count, read and write numbers to 20; use one-to-one correspondence' },
        { type: 'cambridge', code: 'Nn1.02', text: 'Compare and order numbers to 20; use < > = symbols' },
        { type: 'indonesian', code: '1.B.1', text: 'Membilang dan membaca bilangan 1–20 dengan korespondensi satu-satu' },
      ]
    },
    'the-shape-kingdom': {
      grade: 'Grade 1', stageColor: '#10B981', indonesianGrade: 'Kelas 1 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Gm1.01', text: 'Name, sort and describe common 2D shapes; find shapes in the environment' },
        { type: 'cambridge', code: 'Gm1.02', text: 'Describe properties of 2D shapes: number of sides, corners and right angles' },
        { type: 'indonesian', code: '1.G.1', text: 'Mengenal dan menyebutkan nama bentuk 2D; mendeskripsikan sisi dan sudut' },
      ]
    },
    'odd-even-island': {
      grade: 'Grade 1', stageColor: '#8B5CF6', indonesianGrade: 'Kelas 1 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Nn1.03', text: 'Identify odd and even numbers to 20; explain the pattern using pairs' },
        { type: 'indonesian', code: '1.B.3', text: 'Mengenal bilangan ganjil dan genap sampai 20; menjelaskan pola berpasangan' },
      ]
    },

    // ── P2 STORY BOOKS ───────────────────────────
    'the-number-train': {
      grade: 'Grade 2', stageColor: '#10B981', indonesianGrade: 'Kelas 2 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Nn2.03', text: 'Add and subtract 2-digit numbers mentally and using written strategies' },
        { type: 'cambridge', code: 'Nn2.01', text: 'Understand place value in 2-digit numbers; partition into tens and ones' },
        { type: 'indonesian', code: '2.B.3', text: 'Melakukan penjumlahan dan pengurangan bilangan dua angka menggunakan berbagai strategi' },
      ]
    },
    'mias-measurement-mission': {
      grade: 'Grade 2', stageColor: '#F97316', indonesianGrade: 'Kelas 2 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Gm2.03', text: 'Measure length in centimetres and metres; estimate and compare lengths' },
        { type: 'cambridge', code: 'Gm2.04', text: 'Measure mass in kilograms and grams; compare using balance and scales' },
        { type: 'indonesian', code: '2.G.3', text: 'Mengukur panjang dalam cm dan m; mengukur massa dalam kg dan g' },
      ]
    },
    'the-sharing-bakery': {
      grade: 'Grade 2', stageColor: '#8B5CF6', indonesianGrade: 'Kelas 2 / Fase A',
      objectives: [
        { type: 'cambridge', code: 'Nn2.06', text: 'Recognise halves, quarters, thirds and three quarters; use fraction notation' },
        { type: 'cambridge', code: 'Nn1.07', text: 'Find one half and one quarter of shapes and sets of objects' },
        { type: 'indonesian', code: '2.B.6', text: 'Mengenal pecahan ½, ¼, ⅓, ¾ dan menggunakan notasi pecahan' },
      ]
    },

    // ── P3 STORY BOOKS ───────────────────────────
    'the-times-table-quest': {
      grade: 'Grade 3', stageColor: '#8B5CF6', indonesianGrade: 'Kelas 3 / Fase B',
      objectives: [
        { type: 'cambridge', code: 'Nn3.03', text: 'Recall multiplication and division facts for 2, 3, 4, 5, 6 and 10 times tables' },
        { type: 'cambridge', code: 'Nn3.04', text: 'Understand the relationship between multiplication and division as inverse operations' },
        { type: 'indonesian', code: '3.B.3', text: 'Menghafal fakta perkalian dan pembagian untuk 2, 3, 4, 5, 6, dan 10' },
      ]
    },
    'the-hundred-square-mystery': {
      grade: 'Grade 3', stageColor: '#F97316', indonesianGrade: 'Kelas 3 / Fase B',
      objectives: [
        { type: 'cambridge', code: 'Nn3.02', text: 'Recognise and describe patterns on a 100-square; use to support mental calculation' },
        { type: 'cambridge', code: 'Nn3.01', text: 'Count, read and write numbers to 1000; understand place value in 3-digit numbers' },
        { type: 'indonesian', code: '3.B.2', text: 'Mengenal dan mendeskripsikan pola bilangan pada bagan 100; menggunakannya untuk perhitungan' },
      ]
    },
    'the-symmetry-detectives': {
      grade: 'Grade 3', stageColor: '#10B981', indonesianGrade: 'Kelas 3 / Fase B',
      objectives: [
        { type: 'cambridge', code: 'Gm2.02', text: 'Identify lines of symmetry in 2D shapes and pictures; complete symmetric figures' },
        { type: 'cambridge', code: 'Gm2.01', text: 'Describe and classify 2D shapes by their properties including symmetry' },
        { type: 'indonesian', code: '3.G.2', text: 'Mengidentifikasi sumbu simetri pada bangun datar; melengkapi gambar simetris' },
      ]
    },

    // ── P4 STORY BOOKS ───────────────────────────
    'the-decimal-dragon': {
      grade: 'Grade 4', stageColor: '#3B82F6', indonesianGrade: 'Kelas 4 / Fase B',
      objectives: [
        { type: 'cambridge', code: 'Nn4.06', text: 'Understand decimals as tenths and hundredths; place on a number line; round to nearest whole' },
        { type: 'cambridge', code: 'Nn4.01', text: 'Understand place value in numbers with up to 2 decimal places' },
        { type: 'indonesian', code: '4.B.6', text: 'Memahami desimal sebagai persepuluhan dan perseratusan; membandingkan dan membulatkan' },
      ]
    },
    'the-area-adventure': {
      grade: 'Grade 4', stageColor: '#10B981', indonesianGrade: 'Kelas 4 / Fase B',
      objectives: [
        { type: 'cambridge', code: 'Gm4.01', text: 'Calculate the area of rectangles by counting unit squares and using length × width' },
        { type: 'cambridge', code: 'Gm4.02', text: 'Measure and calculate the perimeter of rectangles and other rectilinear shapes' },
        { type: 'indonesian', code: '4.G.1', text: 'Menghitung luas persegi panjang dengan menghitung satuan kotak dan rumus p × l' },
      ]
    },
    'data-detective-academy': {
      grade: 'Grade 4', stageColor: '#F97316', indonesianGrade: 'Kelas 4 / Fase B',
      objectives: [
        { type: 'cambridge', code: 'St4.01', text: 'Read and interpret bar charts, pictograms and line graphs; identify patterns and trends' },
        { type: 'cambridge', code: 'St4.02', text: 'Collect and organise data in tables; choose appropriate charts to display data' },
        { type: 'indonesian', code: '4.D.1', text: 'Membaca dan menafsirkan diagram batang, piktogram, dan grafik garis' },
      ]
    },

    // ── P5 STORY BOOKS ───────────────────────────
    'the-fraction-kingdom': {
      grade: 'Grade 5', stageColor: '#DC2626', indonesianGrade: 'Kelas 5 / Fase C',
      objectives: [
        { type: 'cambridge', code: 'Nn4.05', text: 'Recognise and generate equivalent fractions; simplify fractions using common factors' },
        { type: 'cambridge', code: 'Nn5.04', text: 'Add and subtract fractions with different denominators; convert between mixed numbers and improper fractions' },
        { type: 'indonesian', code: '5.B.4', text: 'Mengenal pecahan senilai; menyederhanakan pecahan; menjumlahkan dan mengurangkan pecahan berbeda penyebut' },
      ]
    },
    'the-coordinate-compass': {
      grade: 'Grade 5', stageColor: '#0284C7', indonesianGrade: 'Kelas 5 / Fase C',
      objectives: [
        { type: 'cambridge', code: 'Gm4.03', text: 'Read and plot coordinates in all four quadrants; translate and reflect shapes on a grid' },
        { type: 'cambridge', code: 'Gm5.03', text: 'Use coordinates to describe translations; find midpoints of line segments' },
        { type: 'indonesian', code: '5.G.3', text: 'Membaca dan menggambar koordinat; menggambarkan translasi dan refleksi bangun pada koordinat' },
      ]
    },
    'the-percentage-palace': {
      grade: 'Grade 5', stageColor: '#C2410C', indonesianGrade: 'Kelas 5 / Fase C',
      objectives: [
        { type: 'cambridge', code: 'Nn5.03', text: 'Understand percentage as number of parts per 100; convert between fractions, decimals and percentages' },
        { type: 'cambridge', code: 'Nn5.05', text: 'Find percentages of amounts; calculate percentage increase and decrease' },
        { type: 'indonesian', code: '5.B.3', text: 'Memahami persentase sebagai bagian per 100; mengonversi antara pecahan, desimal, dan persen' },
      ]
    },

    // ── P6 STORY BOOKS ───────────────────────────
    'the-prime-number-mystery': {
      grade: 'Grade 6', stageColor: '#6D28D9', indonesianGrade: 'Kelas 6 / Fase C',
      objectives: [
        { type: 'cambridge', code: 'Nn6.01', text: 'Identify prime numbers to 100; find prime factors using factor trees; understand square numbers' },
        { type: 'cambridge', code: 'Nn6.02', text: 'Find HCF and LCM using prime factorisation; apply to solve problems' },
        { type: 'indonesian', code: '6.B.1', text: 'Mengidentifikasi bilangan prima sampai 100; faktorisasi prima; KPK dan FPB dengan pohon faktor' },
      ]
    },
    'the-ratio-rangers': {
      grade: 'Grade 6', stageColor: '#059669', indonesianGrade: 'Kelas 6 / Fase C',
      objectives: [
        { type: 'cambridge', code: 'Nn6.04', text: 'Understand and use ratio to compare quantities; simplify ratios and divide in a given ratio' },
        { type: 'cambridge', code: 'Nn6.05', text: 'Solve problems involving direct proportion; use proportion in scale, recipes and conversions' },
        { type: 'indonesian', code: '6.B.4', text: 'Memahami dan menggunakan perbandingan; membagi bilangan dalam rasio tertentu; menyelesaikan masalah proporsi' },
      ]
    },
    'the-statistics-saga': {
      grade: 'Grade 6', stageColor: '#0EA5E9', indonesianGrade: 'Kelas 6 / Fase C',
      objectives: [
        { type: 'cambridge', code: 'St6.01', text: 'Calculate mean, median, mode and range of data sets; know when to use each average' },
        { type: 'cambridge', code: 'St6.02', text: 'Interpret frequency tables and graphs; compare two data sets using statistics' },
        { type: 'indonesian', code: '6.D.1', text: 'Menghitung mean, median, modus, dan jangkauan; membandingkan dua kumpulan data menggunakan statistik' },
      ]
    },
  };

  function _injectObjectivesPanel() {
    const id  = gameId();
    const obj = OBJECTIVES[id];
    if (!obj) return;

    // ── Determine path depth for curriculum-map link ──
    const isBook = window.location.pathname.includes('/books/');
    const mapHref = isBook ? '../curriculum-map.html' : '../../curriculum-map.html';

    // ── Build objective rows HTML ──
    const rows = obj.objectives.map(o => {
      const isCam = o.type === 'cambridge';
      const bg    = isCam ? '#EFF6FF' : '#ECFDF5';
      const color = isCam ? '#1D4ED8' : '#065F46';
      return `<div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:8px;">
        <span style="background:${bg};color:${color};font-size:.65rem;font-weight:700;padding:2px 7px;border-radius:6px;white-space:nowrap;flex-shrink:0;margin-top:1px">${o.code}</span>
        <span style="font-size:.75rem;color:#424754;line-height:1.45">${o.text}</span>
      </div>`;
    }).join('');

    const gradePill = `<div style="display:inline-flex;align-items:center;gap:5px;background:${obj.stageColor}18;border:1.5px solid ${obj.stageColor}44;border-radius:999px;padding:2px 10px;margin-bottom:12px;">
      <span style="font-size:.72rem;font-weight:700;color:${obj.stageColor}">${obj.grade}</span>
      <span style="font-size:.65rem;color:#727785">·</span>
      <span style="font-size:.65rem;color:#727785">${obj.indonesianGrade}</span>
    </div>`;

    const panel = document.createElement('div');

    if (!isBook) {
      // ── GAME SIDEBAR CARD ──
      const sidebar = document.querySelector('.sidebar');
      if (!sidebar) return;
      panel.className = 'stat-card';
      panel.id = 'mm-obj-panel';
      panel.style.cssText = 'padding:14px 16px;';
      panel.innerHTML = `
        <div class="stat-label" style="color:#8B5CF6;margin-bottom:8px">📋 LEARNING OBJECTIVES</div>
        ${gradePill}
        ${rows}
        <a href="${mapHref}" style="display:inline-flex;align-items:center;gap:4px;font-size:.72rem;font-weight:700;color:#8B5CF6;text-decoration:none;margin-top:4px">View curriculum map →</a>
      `;
      sidebar.appendChild(panel);
    } else {
      // ── BOOK STRIP BELOW NAV-BAR ──
      const navBar = document.getElementById('navBar');
      if (!navBar) return;
      panel.id = 'mm-obj-panel';
      panel.style.cssText = 'background:#F8FAFC;border:2px solid #E2E8F0;border-radius:16px;padding:14px 20px;margin-bottom:16px;';
      panel.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px;">
          <span style="font-size:.78rem;font-weight:700;color:#8B5CF6;letter-spacing:.04em">📋 LEARNING OBJECTIVES</span>
          ${gradePill.replace('margin-bottom:12px','margin-bottom:0')}
          <a href="${mapHref}" style="font-size:.72rem;font-weight:700;color:#8B5CF6;text-decoration:none;white-space:nowrap">View curriculum map →</a>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:4px 20px">${rows}</div>
      `;
      navBar.insertAdjacentElement('afterend', panel);
    }
  }

  // Inject after DOM is ready (same timing as startObserving)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _injectObjectivesPanel);
  } else {
    _injectObjectivesPanel();
  }

  // ── FIX GAME NAV BAR LINKS ──
  // Patches the broken href="#" Badges/Progress links and the misleading Play Now button
  // across all game pages without modifying 45+ individual files.
  (function fixGameNav() {
    const isBook = window.location.pathname.includes('/books/');
    const root   = isBook ? '../' : '../../';
    const dash   = root + 'dashboard.html';

    function patch() {
      document.querySelectorAll('.site-nav a').forEach(function (a) {
        const text = a.textContent.trim();
        if (a.getAttribute('href') === '#') {
          if (text === 'Badges')   a.href = dash + '#badges';
          if (text === 'Progress') a.href = dash;
        }
      });
      const playNow = document.querySelector('.btn-play-now');
      if (playNow) {
        playNow.textContent = '📊 My Journey';
        playNow.href        = dash;
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', patch);
    } else {
      patch();
    }
  })();

})();
