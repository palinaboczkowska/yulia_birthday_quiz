// ════════════════════════════════════════════════════════
//  BIRTHDAY QUIZ  —  script.js
// ════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────
//  QUIZ DATA
//  To customise:
//    • Change FINAL_PHRASE (letters in order must match answers below)
//    • word     — display word; use _ for the blank
//    • answer   — the single correct letter (UPPERCASE)
//    • imageUrl — swap with your own photo path or URL
// ─────────────────────────────────────────────────────────
const FINAL_PHRASE = "SWEDISH HOUSE MAFIA";

const questions = [
  { word: "_TEPAN NIKOLAEVICH", answer: "S", imageUrl: "images/1.jpg" },
  { word: "_E",                 answer: "W", imageUrl: "images/2.png" },
  { word: "AP_ROL",             answer: "E", imageUrl: "images/3.jpg" },
  { word: "GOSPOD' GOSPO_'",    answer: "D", imageUrl: "images/4.jpg" },
  { word: "YUL_A",              answer: "I", imageUrl: "images/5.JPG" },
  { word: "SA_HKA",             answer: "S", imageUrl: "images/6.jpg" },
  { word: "POISKU_I",           answer: "H", imageUrl: "images/7.jpg" },
  { word: "BUHLO_OD",           answer: "H", imageUrl: "images/8.JPG" },
  { word: "GOG_L'",             answer: "O", imageUrl: "images/9.jpg" },
  { word: "EXC_SE ME",          answer: "U", imageUrl: "images/10.jpg" },
  { word: "B_NSON",             answer: "E", imageUrl: "images/11.JPG" },
  { word: "MAL_Ö",              answer: "M", imageUrl: "images/12.jpg" },
  { word: "PALINK_",            answer: "A", imageUrl: "images/13.JPG" },
  { word: "YUL'KIN _ORUM",      answer: "F", imageUrl: "images/14.png" },
  { word: "CHA_KA",             answer: "I", imageUrl: "images/15.JPG" },
  { word: "P_TRUL'",            answer: "A", imageUrl: "images/16.jpg" },
];

// ─────────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────────
let soundEnabled = true;

// ─────────────────────────────────────────────────────────
//  DOM REFS
// ─────────────────────────────────────────────────────────
const screens = {
  intro:    document.getElementById("intro-screen"),
  quiz:     document.getElementById("quiz-screen"),
  suspense: document.getElementById("suspense-screen"),
  reveal:   document.getElementById("reveal-screen"),
};
const startBtn      = document.getElementById("start-btn");
const slideArea     = document.getElementById("slide-area");
const progressFill  = document.getElementById("progress-fill");
const progressLabel = document.getElementById("progress-label");
const restartBtn    = document.getElementById("restart-btn");
const soundBtn      = document.getElementById("sound-btn");
const canvas        = document.getElementById("confetti-canvas");
const ctx           = canvas.getContext("2d");

// ─────────────────────────────────────────────────────────
//  ANIMATION PARTICLES  (single shared RAF loop)
// ─────────────────────────────────────────────────────────
let particles = [];
let animRAF   = null;

// ─────────────────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────────────────
function init() {
  resizeCanvas();

  startBtn.addEventListener("click", startQuiz);
  document.getElementById("suspense-btn").addEventListener("click", showReveal);
  restartBtn.addEventListener("click", () => location.reload());
  soundBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? "♪" : "♪̶";
  });
  window.addEventListener("resize", resizeCanvas);

  spawnConfetti(110);
}

// ─────────────────────────────────────────────────────────
//  SCREEN TRANSITIONS
// ─────────────────────────────────────────────────────────
function showScreen(id) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[id].classList.add("active");
}

function startQuiz() {
  fadeOutParticles("confetti");
  showScreen("quiz");
  renderSlide(0);
}


// ─────────────────────────────────────────────────────────
//  SLIDE RENDERING
// ─────────────────────────────────────────────────────────
function renderSlide(idx) {
  const q     = questions[idx];
  const total = questions.length;

  // Progress bar
  progressFill.style.width  = `${(idx / total) * 100}%`;
  progressLabel.textContent = `Step ${idx + 1} of ${total}`;

  // Build card element
  const card        = document.createElement("div");
  card.className    = "slide-card";   // starts without .active → opacity 0
  card.innerHTML    = buildSlideHTML(q);
  slideArea.appendChild(card);

  // Two rAF delay so the browser registers the initial opacity:0
  requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add("active")));

  // Wire up interactions
  const input   = card.querySelector(".letter-input");
  const nextBtn = card.querySelector(".slide-next-btn");

  input.focus();

  input.addEventListener("input", (e) => {
    const val = e.target.value.toUpperCase();
    e.target.value = val;
    handleGuess(val, q.answer, input, nextBtn);
  });

  // Enter key advances when correct
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !nextBtn.disabled) advanceSlide(card, idx);
  });
  nextBtn.addEventListener("click", () => advanceSlide(card, idx));
}

const SLIDE_HINT = "What's the missing letter?";

function buildSlideHTML(q) {
  // Group letters by word so each word wraps as a unit on mobile
  const wordHTML = q.word.split(" ").map(token => {
    const lettersHTML = token.split("").map(ch => {
      if (ch === "_") {
        return `<div class="letter-block">
                  <input class="letter-input" type="text" maxlength="1"
                    autocomplete="off" autocorrect="off"
                    autocapitalize="characters" spellcheck="false"
                    inputmode="text" aria-label="Missing letter">
                </div>`;
      }
      return `<div class="letter-block"><span class="letter-char">${ch}</span></div>`;
    }).join("");
    return `<div class="word-group">${lettersHTML}</div>`;
  }).join("");

  return `
    <div class="slide-image">
      <img src="${q.imageUrl}" alt="" loading="lazy"
           onerror="this.style.display='none'">
      <div class="slide-image-overlay"></div>
    </div>
    <div class="slide-bottom">
      <p class="slide-hint">${SLIDE_HINT}</p>
      <div class="word-display">${wordHTML}</div>
      <button class="btn btn-primary slide-next-btn" disabled>
        Next <span class="btn-arrow">→</span>
      </button>
    </div>`;
}

// ─────────────────────────────────────────────────────────
//  GUESS VALIDATION
// ─────────────────────────────────────────────────────────
function handleGuess(val, answer, input, nextBtn) {
  if (!val) {
    input.classList.remove("correct", "wrong");
    nextBtn.disabled = true;
    return;
  }

  if (val === answer) {
    input.classList.add("correct");
    input.classList.remove("wrong");
    nextBtn.disabled = false;
    playTone("correct");
    nextBtn.focus();
  } else {
    input.classList.remove("correct");
    input.classList.add("wrong");
    nextBtn.disabled = true;
    playTone("wrong");
    // Clear the bad input after the shake animation
    setTimeout(() => {
      input.value = "";
      input.classList.remove("wrong");
      input.focus();
    }, 380);
  }
}

// ─────────────────────────────────────────────────────────
//  SLIDE ADVANCE
// ─────────────────────────────────────────────────────────
function advanceSlide(card, idx) {
  // Exit animation
  card.classList.remove("active");
  card.classList.add("exiting");
  setTimeout(() => card.remove(), 420);

  const next = idx + 1;
  if (next < questions.length) {
    setTimeout(() => renderSlide(next), 200);
  } else {
    // All questions answered → finish progress then suspense screen
    setTimeout(() => {
      progressFill.style.width = "100%";
      setTimeout(() => showScreen("suspense"), 350);
    }, 180);
  }
}

// ─────────────────────────────────────────────────────────
//  REVEAL SCREEN
// ─────────────────────────────────────────────────────────
function showReveal() {
  showScreen("reveal");
  setTimeout(startTyping, 350);
}

// Type the phrase character by character
function startTyping() {
  const el     = document.getElementById("reveal-typed");
  const cursor = document.getElementById("reveal-cursor");
  typeChar(FINAL_PHRASE, 0, el, () => {
    // All typed — hold briefly, kill cursor, then zoom
    setTimeout(() => {
      cursor.style.visibility = "hidden";
      cursor.style.animation  = "none";
      triggerZoom();
    }, 480);
  });
}

function typeChar(phrase, i, el, done) {
  if (i >= phrase.length) { done(); return; }
  el.textContent = phrase.slice(0, i + 1);
  // Longer pause at spaces so each word feels like a separate beat
  const delay = phrase[i] === " " ? 190 : 68;
  setTimeout(() => typeChar(phrase, i + 1, el, done), delay);
}

// Zoom the typed text toward the viewer, then reveal the concert poster
function triggerZoom() {
  const stage = document.getElementById("reveal-stage");
  stage.classList.add("zoom");

  let fired = false;
  function afterZoom() {
    if (fired) return;
    fired = true;

    // Fade in the whole poster background first
    document.querySelector(".reveal-after").classList.add("show");

    // Then stagger each element in
    setTimeout(() => {
      document.getElementById("reveal-artist").classList.add("show");
    }, 300);
    setTimeout(() => {
      document.getElementById("reveal-divider-line").classList.add("show");
    }, 650);
    setTimeout(() => {
      document.getElementById("reveal-date").classList.add("show");
      playTone("reveal");
    }, 900);
    setTimeout(() => {
      document.getElementById("reveal-tagline").classList.add("show");
      spawnFireworks();
      spawnAmbientParticles();
    }, 1200);
    setTimeout(() => {
      restartBtn.classList.add("show");
    }, 1800);
  }

  stage.addEventListener("animationend", afterZoom, { once: true });
  setTimeout(afterZoom, 1400); // fallback
}

// ─────────────────────────────────────────────────────────
//  AUDIO  (Web Audio API — no external files needed)
// ─────────────────────────────────────────────────────────
function playTone(type) {
  if (!soundEnabled) return;
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();

    if (type === "correct") {
      note(ac, "sine",    660, 0,    0.18, 0.18);
      note(ac, "sine",    880, 0.1,  0.10, 0.18);
    } else if (type === "wrong") {
      note(ac, "sawtooth", 220, 0,   0.12, 0.15);
      note(ac, "sawtooth", 160, 0.1, 0,    0.18);
    } else if (type === "reveal") {
      // Ascending arpeggio: C5 E5 G5 C6
      [523, 659, 784, 1047].forEach((f, i) => {
        note(ac, "sine", f, i * 0.14, 0.22, 0.3);
      });
    }
  } catch (_) { /* browser blocked audio — silently skip */ }
}

function note(ac, type, freq, startOffset, vol, dur) {
  const osc  = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = type;
  osc.frequency.value = freq;
  const t = ac.currentTime + startOffset;
  gain.gain.setValueAtTime(vol, t);
  gain.gain.linearRampToValueAtTime(0, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// ─────────────────────────────────────────────────────────
//  CANVAS  (confetti + fireworks share one RAF loop)
// ─────────────────────────────────────────────────────────
const PALETTE = [
  "#c77dff", "#ff6b9d", "#00f0c8", "#ffd700",
  "#ff9d00", "#7b61ff", "#ffffff", "#00cfff",
];
const rndColor = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

/* ── Confetti ── */
function spawnConfetti(count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      type: "confetti",
      x:      Math.random() * canvas.width,
      y:      -Math.random() * canvas.height * 0.8,
      w:      Math.random() * 9 + 4,
      h:      Math.random() * 5 + 2,
      color:  rndColor(),
      vx:     (Math.random() - 0.5) * 2,
      vy:     Math.random() * 3 + 1.5,
      angle:  Math.random() * Math.PI * 2,
      spin:   (Math.random() - 0.5) * 0.15,
      opacity: 1,
      fading: false,
    });
  }
  startLoop();
}

function fadeOutParticles(type) {
  particles.filter(p => p.type === type).forEach(p => { p.fading = true; });
}

/* ── Ambient particles (reveal screen background) ──
   Slow-rising glowing orbs that loop forever.
   Kept alive unconditionally so the loop never stops. */
function spawnAmbientParticles() {
  const AMBIENT_COLORS = ["#c77dff","#ff6b9d","#00f0c8","#ffd700","#7b61ff","#00cfff","#ff9d00"];
  const count = 65;
  for (let i = 0; i < count; i++) {
    particles.push({
      type:    "ambient",
      x:       Math.random() * canvas.width,
      y:       Math.random() * canvas.height,   // spread across screen from start
      vx:      (Math.random() - 0.5) * 0.28,
      vy:      -(Math.random() * 0.52 + 0.12),  // always upward, varied speed
      size:    Math.random() * 2.0 + 0.5,
      color:   AMBIENT_COLORS[Math.floor(Math.random() * AMBIENT_COLORS.length)],
      baseOpacity: Math.random() * 0.5 + 0.12,
      twinkle: Math.random() * Math.PI * 2,     // phase offset for shimmer
    });
  }
  startLoop();
}

/* ── Fireworks ── */
function spawnFireworks() {
  let bursts = 0;
  const burst = () => {
    if (bursts++ > 9) return;
    const cx = Math.random() * canvas.width;
    const cy = canvas.height * (0.15 + Math.random() * 0.45);
    for (let i = 0; i < 65; i++) {
      const angle = (Math.PI * 2 / 65) * i;
      const speed = Math.random() * 6 + 2;
      particles.push({
        type:  "firework",
        x: cx, y: cy,
        vx:    Math.cos(angle) * speed,
        vy:    Math.sin(angle) * speed,
        color: rndColor(),
        life:  1,
        size:  Math.random() * 4 + 2,
      });
    }
    startLoop();
    setTimeout(burst, 360);
  };
  burst();
  // Bonus confetti burst on reveal
  spawnConfetti(70);
}

/* ── Animation loop ── */
function startLoop() {
  if (!animRAF) animRAF = requestAnimationFrame(animFrame);
}

function animFrame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const alive = [];

  particles.forEach(p => {
    if (p.type === "confetti") {
      if (p.fading) {
        p.opacity -= 0.035;
      } else {
        p.x     += p.vx;
        p.y     += p.vy;
        p.angle += p.spin;
        // Loop fallen pieces back to the top
        if (p.y > canvas.height) {
          p.y = -12;
          p.x = Math.random() * canvas.width;
        }
      }
      if (p.opacity > 0) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle   = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        alive.push(p);
      }

    } else if (p.type === "firework") {
      p.x    += p.vx;
      p.y    += p.vy;
      p.vy   += 0.13;    // gravity
      p.vx   *= 0.98;    // air resistance
      p.life -= 0.016;

      if (p.life > 0) {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size * p.life), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        alive.push(p);
      }

    } else if (p.type === "ambient") {
      p.x       += p.vx;
      p.y       += p.vy;
      p.twinkle += 0.022;

      // Wrap: exit top → re-enter at bottom with fresh x
      if (p.y < -8) {
        p.y = canvas.height + 8;
        p.x = Math.random() * canvas.width;
      }

      // Shimmer: opacity breathes on a sine wave
      const alpha = p.baseOpacity * (0.55 + 0.45 * Math.sin(p.twinkle));

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = p.size * 7;   // soft neon halo
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      alive.push(p);  // ambient particles never die — they loop
    }
  });

  particles = alive;
  // Keep the loop alive as long as there are any particles
  animRAF   = alive.length > 0 ? requestAnimationFrame(animFrame) : null;
}

// ─────────────────────────────────────────────────────────
//  START
// ─────────────────────────────────────────────────────────
init();
