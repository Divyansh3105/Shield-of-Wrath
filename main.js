// ============================================
// SHIELD HERO QUIZ - THEMES + DUAL PARTICLES
// ============================================

// ============ CANVAS & PARTICLES ============
const canvas = document.getElementById("particles-canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// FIRE particle class (Wrath)
class FireParticle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + 10;
    this.size = Math.random() * 3 + 1;
    this.speedY = Math.random() * 2 + 1;
    this.speedX = (Math.random() - 0.5) * 0.5;
    this.life = 1;
    this.decay = Math.random() * 0.01 + 0.005;
    this.color = Math.random() > 0.5 ? "#ff4444" : "#ff8800";
  }
  update() {
    this.y -= this.speedY;
    this.x += this.speedX + Math.sin(this.y * 0.01) * 0.3;
    this.life -= this.decay;
    if (this.life <= 0) this.reset();
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.life * 0.7;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ICE particle class (Shield) - gentle drifting snowflakes/glow
class IceParticle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = -10 - Math.random() * 200;
    this.size = Math.random() * 3 + 0.6;
    this.speedY = Math.random() * 0.6 + 0.2;
    this.speedX = (Math.random() - 0.5) * 0.8;
    this.opacity = Math.random() * 0.8 + 0.2;
    this.twist = Math.random() * Math.PI * 2;
    this.twistSpeed = Math.random() * 0.02 + 0.005;
  }
  update() {
    this.y += this.speedY;
    this.twist += this.twistSpeed;
    this.x += Math.sin(this.twist) * 0.4 + this.speedX;
    this.opacity -= 0.0005;
    if (this.y > canvas.height + 10 || this.opacity <= 0) this.reset();
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    const g = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      this.size * 3
    );
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.6, "rgba(180,255,255,0.6)");
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

let fireParticles = [];
let iceParticles = [];
let currentMode = "wrath"; // 'wrath' or 'shield'

// initialize
for (let i = 0; i < 80; i++) fireParticles.push(new FireParticle());
for (let i = 0; i < 60; i++) iceParticles.push(new IceParticle());

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentMode === "wrath") {
    fireParticles.forEach((p) => {
      p.update();
      p.draw();
    });
  } else {
    iceParticles.forEach((p) => {
      p.update();
      p.draw();
    });
  }

  requestAnimationFrame(animateParticles);
}
animateParticles();

// ============ QUIZ LOGIC (original code merged) ============
let currentQuestion = 0;
let totalScore = 0;
const totalQuestions = 15;
let timerInterval = null;
let timeRemaining = 0;
let difficultyLevel = "medium";
let playerName = "";
let quizStartTime = null;

const correctAnswers = [
  "Naofumi Iwatani",
  "Shield",
  "Raphtalia",
  "Demi-human",
  "Melromarc",
  "Filolial egg",
  "Malty",
  "The Devil of the Shield",
  "The Waves of Catastrophe",
  "Itsuki Kawasumi",
  "Mirellia Q Melromarc",
  "Shield Copy",
  "Zombie Dragon",
  "Queen of the Filolials",
  "Naofumi's anger and hatred",
];

const difficultySettings = {
  easy: { time: 45, label: "Easy" },
  medium: { time: 30, label: "Medium" },
  hard: { time: 20, label: "Hard" },
};

const $ = (id) => document.getElementById(id);

// ============ EVENT LISTENERS & BINDINGS ============
document.addEventListener("DOMContentLoaded", () => {
  $("startBtn").addEventListener("click", startQuiz);
  $("prevBtn").addEventListener("click", previousQuestion);
  $("nextBtn").addEventListener("click", nextQuestion);
  $("restartBtn").addEventListener("click", restartQuiz);
  $("difficulty").addEventListener("change", (e) => {
    difficultyLevel = e.target.value;
  });
  $("playerName").addEventListener("keypress", (e) => {
    if (e.key === "Enter") startQuiz();
  });

  bindOptionListeners();
  initTheme(); // load saved theme or default
});

/* ============================
   Loading screen + character controls
   ============================ */
const loadingScreen = document.getElementById("loadingScreen");
const loaderFill = document.getElementById("loaderFill");
let loaderProgress = 0;
let loaderTimer = null;

function showLoadingScreen() {
  if (!loadingScreen) return;
  loadingScreen.classList.remove("hidden");
  loadingScreen.setAttribute("aria-hidden", "false");
  loaderProgress = 0;
  if (loaderTimer) clearInterval(loaderTimer);
  loaderFill.style.width = "0%";

  // faux progress to feel cinematic; real assets can bump it via setLoadingProgress()
  loaderTimer = setInterval(() => {
    loaderProgress += Math.random() * 10; // random step
    if (loaderProgress >= 95) {
      loaderProgress = 95;
      clearInterval(loaderTimer);
    }
    loaderFill.style.width = Math.round(loaderProgress) + "%";
  }, 420);
}

function hideLoadingScreen(instant = false) {
  if (!loadingScreen) return;
  // fill to 100% then fade
  loaderFill.style.width = "100%";
  setTimeout(
    () => {
      loadingScreen.classList.add("hidden");
      loadingScreen.setAttribute("aria-hidden", "true");
      // clean up
      if (loaderTimer) {
        clearInterval(loaderTimer);
        loaderTimer = null;
      }
    },
    instant ? 80 : 480
  );
}

/* Allow other parts of app to report progress (e.g. images, fonts) */
function setLoadingProgress(percent) {
  loaderProgress = Math.max(0, Math.min(100, percent));
  if (loaderFill) loaderFill.style.width = loaderProgress + "%";
  if (loaderProgress >= 100) hideLoadingScreen();
}

/* Preload high-res images / important assets then hide loader */
function preloadImportantAssets(list = []) {
  if (!list.length) {
    // short delay so loader doesn't vanish immediately on fast loads
    setTimeout(() => hideLoadingScreen(), 600);
    return;
  }
  let loaded = 0;
  list.forEach((src) => {
    const img = new Image();
    img.onload = img.onerror = () => {
      loaded++;
      setLoadingProgress(Math.round((loaded / list.length) * 100));
      if (loaded === list.length) {
        // small delay for polish
        setTimeout(() => hideLoadingScreen(), 360);
      }
    };
    img.src = src;
  });
}

/* Pause character float animations (useful when quiz begins) */
function setCharacterFloating(enabled = true) {
  const rap = document.querySelector(".char-raphtalia");
  const naf = document.querySelector(".char-naofumi");
  if (!rap || !naf) return;
  if (enabled) {
    rap.style.animationPlayState = "running";
    naf.style.animationPlayState = "running";
  } else {
    rap.style.animationPlayState = "paused";
    naf.style.animationPlayState = "paused";
  }
}

/* Integrate with existing DOMContentLoaded:
   - show loader on page start
   - then preload bg images used in CSS (if present)
*/
document.addEventListener("DOMContentLoaded", () => {
  // show loader right away
  showLoadingScreen();

  // find background images used by page (simple heuristic)
  const bgImages = [
    "asset/shieldhero.png",
    "asset/shieldmode.jpg",
    "asset/og-image.png",
  ];

  // preload them and wait to hide loader
  preloadImportantAssets(bgImages);

  // pause floating when quiz starts
  const startBtn = document.getElementById("startBtn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      // hide loading screen immediately (user moved on)
      hideLoadingScreen(true);
      setCharacterFloating(false);
    });
  }

  // Also hide loader when theme toggle or other startup actions finish
  // (call setLoadingProgress(100) from anywhere to close loader)
});

/* Optional: expose to window for debugging */
window.showLoadingScreen = showLoadingScreen;
window.hideLoadingScreen = hideLoadingScreen;
window.setLoadingProgress = setLoadingProgress;
window.setCharacterFloating = setCharacterFloating;

function bindOptionListeners() {
  document.querySelectorAll(".option").forEach((opt) => {
    opt.addEventListener("click", function () {
      const input = this.querySelector("input");
      const groupName = input.name;

      document
        .querySelectorAll(`input[name="${groupName}"]`)
        .forEach((i) => i.closest(".option").classList.remove("selected"));

      this.classList.add("selected");
      input.checked = true;
    });
  });
}

document.addEventListener("keydown", (e) => {
  const quizVisible = !$("quiz").classList.contains("hidden");

  // Only work inside quiz
  if (!quizVisible) return;

  const options = document.querySelectorAll(
    `.question-set.active .option input`
  );

  let index = [...options].findIndex((o) => o.checked);

  // -------------------------
  // 1. ArrowRight (Next question)
  // -------------------------
  if (e.key === "ArrowRight") {
    if (currentQuestion < totalQuestions - 1) {
      nextQuestion();
    }
    // If last question, ignore ArrowRight completely
    return;
  }

  // -------------------------
  // 2. ArrowLeft (Previous question)
  // -------------------------
  if (e.key === "ArrowLeft") {
    if (currentQuestion > 0) previousQuestion();
    return;
  }

  // -------------------------
  // 3. Enter (Next / Finish)
  // -------------------------
  if (e.key === "Enter") {
    nextQuestion();
    return;
  }

  // -------------------------
  // 4. ArrowDown (Move down options)
  // -------------------------
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (index < options.length - 1) index++;
    else index = 0; // wrap around

    selectOptionByIndex(options, index);
    return;
  }

  // -------------------------
  // 5. ArrowUp (Move up options)
  // -------------------------
  if (e.key === "ArrowUp") {
    e.preventDefault();
    if (index > 0) index--;
    else index = options.length - 1; // wrap up

    selectOptionByIndex(options, index);
    return;
  }
});

// helper function to select an option
function selectOptionByIndex(options, i) {
  const input = options[i];
  const opt = input.closest(".option");

  // remove all selected first
  options.forEach((o) => o.closest(".option").classList.remove("selected"));

  opt.classList.add("selected");
  input.checked = true;
}

// ============ QUIZ FUNCTIONS (same as original) ============
function startQuiz() {
  playerName = $("playerName").value.trim();

  if (!playerName) {
    showAlert("Please enter your hero name!");
    $("playerName").focus();
    return;
  }

  $("startScreen").classList.add("hidden");
  $("quiz").classList.remove("hidden");

  quizStartTime = Date.now();
  currentQuestion = 0;
  totalScore = 0;

  showQuestion();
  startTimer();
}

function showAlert(message) {
  alert("⚠️ " + message);
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);

  timeRemaining = difficultySettings[difficultyLevel].time;
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      autoNextQuestion();
    } else if (timeRemaining <= 5) {
      $("timerCard").classList.add("warning");
    } else {
      $("timerCard").classList.remove("warning");
    }
  }, 1000);
}

function updateTimerDisplay() {
  $("timer").textContent = timeRemaining;
}

function autoNextQuestion() {
  if (currentQuestion < totalQuestions - 1) {
    currentQuestion++;
    showQuestion();
    startTimer();
  } else {
    showResults();
  }
}

function showQuestion() {
  const questionSets = document.querySelectorAll(".question-set");
  questionSets.forEach((set) => set.classList.remove("active"));
  questionSets[currentQuestion].classList.add("active");

  $("questionNum").textContent = `${currentQuestion + 1}/${totalQuestions}`;
  $("prevBtn").disabled = currentQuestion === 0;

  $("nextBtn").innerHTML =
    currentQuestion === totalQuestions - 1 ? "Finish ✓" : "Next ▶";

  const progressPercent = ((currentQuestion + 1) / totalQuestions) * 100;
  $("progressBar").style.width = progressPercent + "%";
  $("progressPercent").textContent = Math.round(progressPercent) + "%";
}

function nextQuestion() {
  const form = $("quiz");
  const selectedAnswer = form[`q${currentQuestion + 1}`]?.value;

  if (!selectedAnswer) {
    showAlert("Please select an answer!");
    return;
  }

  if (currentQuestion < totalQuestions - 1) {
    currentQuestion++;
    showQuestion();
    startTimer();
  } else {
    showResults();
  }
}

function previousQuestion() {
  if (currentQuestion > 0) {
    currentQuestion--;
    showQuestion();
    startTimer();
  }
}

function showResults() {
  clearInterval(timerInterval);

  const form = $("quiz");
  const questionSets = document.querySelectorAll(".question-set");
  let correctCount = 0;
  const quizEndTime = Date.now();
  const totalTime = Math.floor((quizEndTime - quizStartTime) / 1000);

  // Calculate score and mark answers
  for (let i = 0; i < totalQuestions; i++) {
    const selectedAnswer = form[`q${i + 1}`]?.value;
    const correctAnswer = correctAnswers[i];
    const isCorrect = selectedAnswer === correctAnswer;

    if (isCorrect) correctCount++;

    const questionSet = questionSets[i];
    questionSet.querySelectorAll(".option").forEach((option) => {
      const input = option.querySelector("input");
      if (input.value === correctAnswer) {
        option.classList.add("correct");
      } else if (input.checked && input.value !== correctAnswer) {
        option.classList.add("incorrect");
      }
    });
  }

  totalScore = correctCount;

  // Show results screen
  $("quiz").classList.add("hidden");
  $("results").classList.add("active");
  $("heroName").textContent = playerName;
  $("finalScore").textContent = `${totalScore}/${totalQuestions}`;

  const percentage = Math.round((totalScore / totalQuestions) * 100);
  $("scorePercent").textContent = percentage + "%";

  // Animate score ring
  const circumference = 2 * Math.PI * 80;
  setTimeout(() => {
    $("scoreRing").style.strokeDashoffset =
      circumference - (percentage / 100) * circumference;
  }, 100);

  // Set score message
  const messages = [
    { min: 15, text: "🏆 Perfect! True Shield Hero!" },
    { min: 12, text: "⭐ Excellent work, hero!" },
    { min: 8, text: "💪 Good effort!" },
    { min: 4, text: "📖 Keep training!" },
    { min: 0, text: "🔥 Try again, hero!" },
  ];
  $("scoreMessage").textContent = messages.find(
    (m) => totalScore >= m.min
  ).text;

  // Display achievements
  displayAchievements(totalScore, totalTime);
}

function displayAchievements(score, time) {
  const container = $("achievementBadges");
  container.innerHTML = "";

  const achievements = [];
  if (score === 15) achievements.push({ icon: "🏆", name: "Perfect Score!" });
  if (score >= 12) achievements.push({ icon: "⭐", name: "Excellent!" });
  if (time < 300) achievements.push({ icon: "⚡", name: "Speed Demon" });
  if (score >= 8) achievements.push({ icon: "💪", name: "Persistent" });

  achievements.forEach((achievement, index) => {
    setTimeout(() => {
      const badge = document.createElement("div");
      badge.className = "achievement-badge";
      badge.style.animationDelay = `${index * 0.2}s`;
      badge.innerHTML = `<span>${achievement.icon}</span><span>${achievement.name}</span>`;
      container.appendChild(badge);
    }, index * 200);
  });
}

function restartQuiz() {
  currentQuestion = 0;
  totalScore = 0;
  playerName = "";

  if (timerInterval) clearInterval(timerInterval);

  $("results").classList.remove("active");
  $("startScreen").classList.remove("hidden");
  $("quiz").reset();

  document.querySelectorAll(".option").forEach((option) => {
    option.classList.remove("selected", "correct", "incorrect");
  });

  document
    .querySelectorAll(".question-set")
    .forEach((q) => q.classList.remove("active"));

  $("progressBar").style.width = "0%";
  $("progressPercent").textContent = "0%";
  $("timer").textContent = "--";
  $("playerName").value = "";
  $("difficulty").value = "medium";
  difficultyLevel = "medium";

  // Reset score ring
  $("scoreRing").style.strokeDashoffset = 502;
}

// ============ THEME SWITCHER & SVG UPDATES ============
const themeToggleBtn = $("themeToggle");

function initTheme() {
  const saved = localStorage.getItem("shield_quiz_theme");
  if (saved === "shield") {
    setTheme("shield", false);
  } else {
    setTheme("wrath", false);
  }

  themeToggleBtn.addEventListener("click", () => {
    setTheme(currentMode === "wrath" ? "shield" : "wrath", true);
  });
}

function setTheme(mode, persist = true) {
  const body = document.body;
  currentMode = mode;

  if (mode === "shield") {
    body.classList.add("shield-mode");
    themeToggleBtn.textContent = "🔥 Wrath Mode";
    themeToggleBtn.setAttribute("aria-pressed", "true");
  } else {
    body.classList.remove("shield-mode");
    themeToggleBtn.textContent = "🛡 Shield Mode";
    themeToggleBtn.setAttribute("aria-pressed", "false");
  }

  // set particle mode
  if (mode === "wrath") {
    currentMode = "wrath";
  } else {
    currentMode = "shield";
  }

  updateSVGColors();

  if (persist) localStorage.setItem("shield_quiz_theme", mode);
}

function updateSVGColors() {
  const root = getComputedStyle(document.documentElement);
  const primary = root.getPropertyValue("--primary").trim() || "#ff4444";
  const accent = root.getPropertyValue("--accent").trim() || "#ff8800";

  // shield gradient stops
  const shieldStops = document.querySelectorAll("#shieldGrad stop");
  if (shieldStops && shieldStops.length >= 3) {
    shieldStops[0].style.stopColor = primary;
    shieldStops[1].style.stopColor = accent;
    shieldStops[2].style.stopColor = primary;
  }

  // sword gradient stops
  const swordStops = document.querySelectorAll("#swordGrad stop");
  if (swordStops && swordStops.length >= 2) {
    swordStops[0].style.stopColor = primary;
    swordStops[1].style.stopColor = accent;
  }

  // shield core
  const shieldCore = document.getElementById("shieldCore");
  if (shieldCore) {
    if (currentMode === "wrath")
      shieldCore.setAttribute("fill", primary || "#ff0000");
    else shieldCore.setAttribute("fill", accent || "#00ffaa");
  }

  // Update container box-shadow color dynamically
  const container = document.querySelector(".container");
  if (container) {
    container.style.boxShadow =
      currentMode === "wrath"
        ? `0 0 40px var(--glow-1), inset 0 0 80px rgba(255,68,68,0.08)`
        : `0 0 40px var(--glow-1), inset 0 0 80px rgba(0,200,200,0.06)`;
  }
}
