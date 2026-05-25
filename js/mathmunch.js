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

})();
