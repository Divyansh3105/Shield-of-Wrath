// ============ PERFORMANCE OPTIMIZATIONS ============
// Lazy load heavy features
let particlesLoaded = false;
let audioLoaded = false;

// Intersection Observer for lazy loading
const lazyLoadObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        lazyLoadObserver.unobserve(img);
      }
    }
  });
});

// Debounced resize handler
let resizeTimeout;
function debouncedResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(resizeCanvas, 100);
}

// ============ AUTO-HIDE CURSOR ============
let cursorTimeout;
const CURSOR_HIDE_DELAY = 2000; // 2 seconds

function showCursor() {
  document.body.style.cursor = "url('asset/Cursor.cur') 32 32, auto";
  clearTimeout(cursorTimeout);

  cursorTimeout = setTimeout(() => {
    document.body.style.cursor = "none";
  }, CURSOR_HIDE_DELAY);
}

// Initialize cursor behavior
document.addEventListener("mousemove", showCursor);
document.addEventListener("mousedown", showCursor);
document.addEventListener("keydown", showCursor);

// Show cursor initially
showCursor();

// ============ CANVAS & PARTICLES ============
const canvas = document.getElementById("particles-canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", debouncedResize);

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

// THEME MUSIC - Lazy load audio
let wrathMusic, shieldMusic;

function initAudio() {
  if (audioLoaded) return;

  wrathMusic = new Audio("asset/wrath.mp3");
  shieldMusic = new Audio("asset/Shield.mp3");

  wrathMusic.loop = true;
  shieldMusic.loop = true;
  wrathMusic.volume = 0.6;
  shieldMusic.volume = 0.6;

  // Preload audio
  wrathMusic.preload = "metadata";
  shieldMusic.preload = "metadata";

  audioLoaded = true;
}

// functions
function playWrathMusic() {
  initAudio();
  if (shieldMusic) {
    shieldMusic.pause();
    shieldMusic.currentTime = 0;
  }
  wrathMusic?.play().catch(() => {});
}

function playShieldMusic() {
  initAudio();
  if (wrathMusic) {
    wrathMusic.pause();
    wrathMusic.currentTime = 0;
  }
  shieldMusic?.play().catch(() => {});
}

// initialize particles lazily
function initParticles() {
  if (particlesLoaded) return;

  for (let i = 0; i < 60; i++) fireParticles.push(new FireParticle()); // Reduced from 80
  for (let i = 0; i < 40; i++) iceParticles.push(new IceParticle()); // Reduced from 60

  particlesLoaded = true;
}

// Optimized particle system with performance monitoring
let lastFrameTime = 0;
let frameCount = 0;
let isLowPerformance = false;

function animateParticles(currentTime) {
  if (!particlesLoaded) {
    requestAnimationFrame(animateParticles);
    return;
  }

  // Performance monitoring
  if (currentTime - lastFrameTime > 16.67) { // If frame takes longer than 60fps
    frameCount++;
    if (frameCount > 10) {
      isLowPerformance = true;
      // Reduce particle count for low-end devices
      if (fireParticles.length > 30) {
        fireParticles = fireParticles.slice(0, 30);
        iceParticles = iceParticles.slice(0, 20);
      }
    }
  } else {
    frameCount = Math.max(0, frameCount - 1);
  }

  lastFrameTime = currentTime;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const particles = currentMode === "wrath" ? fireParticles : iceParticles;
  const maxParticles = isLowPerformance ? 20 : particles.length;

  for (let i = 0; i < maxParticles; i++) {
    particles[i].update();
    particles[i].draw();
  }

  requestAnimationFrame(animateParticles);
}

// Start particles after a delay
setTimeout(initParticles, 1000);
animateParticles();

// ============ IMAGE OPTIMIZATION ============
// Lazy load images with intersection observer
function setupLazyLoading() {
  const lazyImages = document.querySelectorAll('img[data-src]');

  if ('IntersectionObserver' in window) {
    lazyImages.forEach(img => {
      lazyLoadObserver.observe(img);
    });
  } else {
    // Fallback for older browsers
    lazyImages.forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }
}

// Optimize canvas rendering
function optimizeCanvas() {
  // Use lower resolution on mobile devices
  const isMobile = window.innerWidth < 768;
  const pixelRatio = isMobile ? 1 : Math.min(window.devicePixelRatio, 2);

  canvas.width = window.innerWidth * pixelRatio;
  canvas.height = window.innerHeight * pixelRatio;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';

  ctx.scale(pixelRatio, pixelRatio);

  // Optimize canvas context
  ctx.imageSmoothingEnabled = !isMobile; // Disable on mobile for performance
}

function resizeCanvas() {
  optimizeCanvas();
}

// ============ QUIZ LOGIC (original code merged) ============
let currentQuestion = 0;
let totalScore = 0;
const totalQuestions = 15;
let timerInterval = null;
let timeRemaining = 0;
let difficultyLevel = "medium";
let playerName = "";
let quizStartTime = null;
let soundEnabled = true;
let bestScore = 0;
let totalAttempts = 0;

// Sound effects (using Web Audio API for simple beeps)
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContextClass();

function playSound(frequency, duration, type = "sine") {
  if (!soundEnabled) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + duration
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playClickSound() {
  playSound(800, 0.1);
}

function playSuccessSound() {
  playSound(523.25, 0.15);
  setTimeout(() => playSound(659.25, 0.15), 100);
  setTimeout(() => playSound(783.99, 0.2), 200);
}

function playErrorSound() {
  playSound(200, 0.2, "sawtooth");
}

function playTransitionSound() {
  playSound(440, 0.08);
}

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
  // Setup performance optimizations
  setupLazyLoading();
  optimizeCanvas();

  $("startBtn").addEventListener("click", startQuiz);
  $("prevBtn").addEventListener("click", previousQuestion);
  $("nextBtn").addEventListener("click", nextQuestion);
  $("restartBtn").addEventListener("click", restartQuiz);
  $("difficulty").addEventListener("change", (e) => {
    difficultyLevel = e.target.value;
    playClickSound();
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

function showLoadingScreen() {
  if (!loadingScreen) return;
  loadingScreen.classList.remove("hidden");
  loadingScreen.setAttribute("aria-hidden", "false");
}

function hideLoadingScreen(instant = false) {
  if (!loadingScreen) return;
  setTimeout(
    () => {
      loadingScreen.classList.add("hidden");
      loadingScreen.setAttribute("aria-hidden", "true");
    },
    instant ? 80 : 800
  );
}

/* Preload high-res images / important assets then hide loader */
/* Preload important assets then hide loader */
function preloadImportantAssets(list = []) {
  if (!list.length) {
    simulateLoading();
    return;
  }

  let loaded = 0;
  const progressBar = document.getElementById("loaderProgress");
  const progressPercent = document.getElementById("loaderPercent");
  const progressStatus = document.getElementById("loaderStatus");

  const statuses = [
    "Loading assets...",
    "Summoning heroes...",
    "Preparing shields...",
    "Almost ready...",
  ];

  // Use Promise.all for faster parallel loading
  const imagePromises = list.map((src, index) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded++;
        const percent = Math.floor((loaded / list.length) * 100);

        if (progressBar) progressBar.style.width = percent + "%";
        if (progressPercent) progressPercent.textContent = percent + "%";
        if (progressStatus) {
          const statusIndex = Math.min(
            Math.floor((loaded / list.length) * statuses.length),
            statuses.length - 1
          );
          progressStatus.textContent = statuses[statusIndex];
        }
        resolve();
      };
      img.src = src;
    });
  });

  Promise.all(imagePromises).then(() => {
    setTimeout(() => {
      if (progressStatus) progressStatus.textContent = "Ready!";
      setTimeout(() => hideLoadingScreen(), 300);
    }, 200);
  });
}

function simulateLoading() {
  const progressBar = document.getElementById("loaderProgress");
  const progressPercent = document.getElementById("loaderPercent");
  const progressStatus = document.getElementById("loaderStatus");

  const statuses = [
    "Loading assets...",
    "Summoning heroes...",
    "Preparing shields...",
    "Ready!",
  ];

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 20 + 10; // Faster loading
    if (progress > 100) progress = 100;

    if (progressBar) progressBar.style.width = progress + "%";
    if (progressPercent)
      progressPercent.textContent = Math.floor(progress) + "%";
    if (progressStatus) {
      const statusIndex = Math.min(
        Math.floor((progress / 100) * (statuses.length - 1)),
        statuses.length - 1
      );
      progressStatus.textContent = statuses[statusIndex];
    }

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => hideLoadingScreen(), 300);
    }
  }, 150); // Faster intervals
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

  // find background images used by page (optimized list)
  const bgImages = [
    "asset/shieldhero.webp",
    "asset/shieldmode.webp",
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
window.setCharacterFloating = setCharacterFloating;

function bindOptionListeners() {
  document.querySelectorAll(".option").forEach((opt) => {
    opt.addEventListener("click", function (e) {
      const input = this.querySelector("input");
      const groupName = input.name;

      document
        .querySelectorAll(`input[name="${groupName}"]`)
        .forEach((i) => i.closest(".option").classList.remove("selected"));

      this.classList.add("selected");
      input.checked = true;

      // Add ripple effect
      createRipple(this, e);

      // Play click sound
      playClickSound();
    });
  });
}

// Ripple effect for options
function createRipple(element, e) {
  const ripple = document.createElement("span");
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
    left: ${x}px;
    top: ${y}px;
    pointer-events: none;
    opacity: 0.5;
    transform: scale(0);
    animation: rippleEffect 0.6s ease-out;
  `;

  const optionContent = element.querySelector(".option-content");
  optionContent.style.position = "relative";
  optionContent.style.overflow = "hidden";
  optionContent.appendChild(ripple);

  setTimeout(() => ripple.remove(), 600);
}

document.addEventListener("keydown", (e) => {
  const quizVisible = !$("quiz").classList.contains("hidden");

  // Only work inside quiz
  if (!quizVisible) return;

  const options = document.querySelectorAll(
    `.question-set.active .option input`
  );

  let currentIndex = [...options].findIndex((o) => o.checked);

  // -------------------------
  // 1. ArrowDown (Move down options)
  // -------------------------
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (currentIndex < options.length - 1) {
      currentIndex++;
    } else {
      currentIndex = 0; // wrap around
    }
    selectOptionByIndex(options, currentIndex);
    return;
  }

  // -------------------------
  // 2. ArrowUp (Move up options)
  // -------------------------
  if (e.key === "ArrowUp") {
    e.preventDefault();
    if (currentIndex > 0) {
      currentIndex--;
    } else {
      currentIndex = options.length - 1; // wrap up
    }
    selectOptionByIndex(options, currentIndex);
    return;
  }

  // -------------------------
  // 3. ArrowRight (Next question)
  // -------------------------
  if (e.key === "ArrowRight") {
    e.preventDefault();
    if (currentQuestion < totalQuestions - 1) {
      nextQuestion();
    }
    return;
  }

  // -------------------------
  // 4. ArrowLeft (Previous question)
  // -------------------------
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    if (currentQuestion > 0) {
      previousQuestion();
    }
    return;
  }

  // -------------------------
  // 5. Enter (Next / Finish)
  // -------------------------
  if (e.key === "Enter") {
    e.preventDefault();
    nextQuestion();
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
    playErrorSound();
    return;
  }

  if (soundEnabled) {
    if (currentMode === "shield") playShieldMusic();
    else playWrathMusic();
  }

  playSuccessSound();

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
  const previousQuestion = document.querySelector(".question-set.active");

  // Add exit animation to previous question
  if (previousQuestion) {
    previousQuestion.classList.add("exiting");
    setTimeout(() => {
      previousQuestion.classList.remove("active", "exiting");
    }, 400);
  }

  // Add entering animation to new question
  setTimeout(
    () => {
      questionSets[currentQuestion].classList.add("entering");
      setTimeout(() => {
        questionSets[currentQuestion].classList.remove("entering");
        questionSets[currentQuestion].classList.add("active");
      }, 50);
    },
    previousQuestion ? 200 : 0
  );

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
    shakeElement($("quiz"));
    playErrorSound();
    return;
  }

  playTransitionSound();

  if (currentQuestion < totalQuestions - 1) {
    currentQuestion++;
    showQuestion();
    startTimer();
  } else {
    showResults();
  }
}

// Shake animation for validation feedback
function shakeElement(element) {
  element.style.animation = "shake 0.5s";
  setTimeout(() => {
    element.style.animation = "";
  }, 500);
}

function previousQuestion() {
  if (currentQuestion > 0) {
    playTransitionSound();
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

  // Update detailed stats
  updateDetailedStats(totalTime, percentage);

  // Display achievements
  displayAchievements(totalScore, totalTime);

  // Trigger confetti for good scores
  if (percentage >= 80) {
    setTimeout(() => triggerConfetti(), 500);
  }
}

function updateDetailedStats(totalTime, percentage) {
  // Format time taken (MM:SS)
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;
  const timeFormatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  $("timeTaken").textContent = timeFormatted;

  // Calculate average speed per question
  const avgTimePerQuestion = Math.round(totalTime / totalQuestions);
  $("avgSpeed").textContent = `${avgTimePerQuestion}s/q`;

  // Display accuracy
  $("accuracy").textContent = percentage + "%";
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
  const saved = localStorage.getItem("shieldhero-theme");

  if (saved === "shield") {
    document.body.classList.add("shield-mode");
    currentMode = "shield";
  } else {
    document.body.classList.remove("shield-mode");
    currentMode = "wrath";
  }

  updateThemeVisuals();
}

function updateThemeVisuals() {
  updateSVGColors();
}

themeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("shield-mode");
  const isShield = document.body.classList.contains("shield-mode");

  // Update aria-pressed for accessibility
  themeToggleBtn.setAttribute("aria-pressed", isShield ? "true" : "false");

  if (isShield) {
    currentMode = "shield";
    localStorage.setItem("shieldhero-theme", "shield");
    playShieldMusic(); // audio works after click
  } else {
    currentMode = "wrath";
    localStorage.setItem("shieldhero-theme", "wrath");
    playWrathMusic(); // audio works after click
  }

  if (currentMode === "shield") burstParticles("ice");
  else burstParticles("fire");

  updateThemeVisuals();

  // Add button shake effect
  themeToggleBtn.style.animation = "buttonShake 0.5s ease";
  setTimeout(() => {
    themeToggleBtn.style.animation = "";
  }, 500);
});

function burstParticles(type = "fire") {
  for (let i = 0; i < 20; i++) {
    const p = type === "fire" ? new FireParticle() : new IceParticle();
    p.x = window.innerWidth / 2;
    p.y = window.innerHeight / 2;
    p.size = Math.random() * 4 + 4;
    p.speedY = (Math.random() - 0.5) * 4;
    p.speedX = (Math.random() - 0.5) * 4;
    if (type === "fire") fireParticles.push(p);
    else iceParticles.push(p);
  }
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

// Particle burst effect for theme toggle
function createThemeParticleBurst() {
  const colors =
    currentMode === "wrath"
      ? ["#ff4444", "#ff8800", "#ffcc00", "#ff6666"]
      : ["#00b8b8", "#00ffaa", "#33cccc", "#00ff88"];

  const particleCount = 20;
  const rect = themeToggleBtn.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    const angle = (Math.PI * 2 * i) / particleCount;
    const velocity = 100 + Math.random() * 100;
    const size = Math.random() * 6 + 3;

    particle.className = "theme-particle";
    particle.style.cssText = `
      position: fixed;
      width: ${size}px;
      height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: 50%;
      left: ${centerX}px;
      top: ${centerY}px;
      pointer-events: none;
      z-index: 10000;
      box-shadow: 0 0 10px currentColor;
      --angle: ${angle};
      --velocity: ${velocity}px;
      animation: particleBurst 0.8s ease-out forwards;
    `;

    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 800);
  }
}

// Confetti effect for high scores
function triggerConfetti() {
  const colors =
    currentMode === "wrath"
      ? ["#ff4444", "#ff8800", "#ffcc00", "#ff6666"]
      : ["#00b8b8", "#00ffaa", "#33cccc", "#00ff88"];

  const confettiCount = 50;

  for (let i = 0; i < confettiCount; i++) {
    setTimeout(() => {
      const confetti = document.createElement("div");
      confetti.className = "confetti";
      confetti.style.cssText = `
        position: fixed;
        width: ${Math.random() * 10 + 5}px;
        height: ${Math.random() * 10 + 5}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * 100}vw;
        top: -20px;
        opacity: ${Math.random() * 0.7 + 0.3};
        transform: rotate(${Math.random() * 360}deg);
        pointer-events: none;
        z-index: 9999;
        animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
      `;
      document.body.appendChild(confetti);

      setTimeout(() => confetti.remove(), 5000);
    }, i * 30);
  }
}

// ============ SOUND TOGGLE ============
function toggleSound() {
  soundEnabled = !soundEnabled;
  const soundToggle = $("soundToggle");

  if (soundEnabled) {
    soundToggle.textContent = "🔊";
    soundToggle.setAttribute("aria-label", "Mute sound");
    if (currentMode === "shield") playShieldMusic();
    else playWrathMusic();
  } else {
    soundToggle.textContent = "🔇";
    soundToggle.setAttribute("aria-label", "Unmute sound");
    wrathMusic.pause();
    shieldMusic.pause();
  }

  localStorage.setItem(
    "shieldhero-sound",
    soundEnabled ? "enabled" : "disabled"
  );
  playClickSound();
}

function initSoundPreference() {
  const saved = localStorage.getItem("shieldhero-sound");
  soundEnabled = saved !== "disabled";

  const soundToggle = $("soundToggle");
  if (soundToggle) {
    soundToggle.textContent = soundEnabled ? "🔊" : "🔇";
    soundToggle.setAttribute(
      "aria-label",
      soundEnabled ? "Mute sound" : "Unmute sound"
    );
  }
}

// ============ STATS TRACKING ============
function loadStats() {
  const stats = JSON.parse(localStorage.getItem("shieldhero-stats") || "{}");
  bestScore = stats.bestScore || 0;
  totalAttempts = stats.totalAttempts || 0;
  updateStartScreenStats();
}

function updateStartScreenStats() {
  const bestScoreEl = $("bestScore");
  const totalAttemptsEl = $("totalAttempts");

  if (bestScoreEl) {
    bestScoreEl.textContent = `${bestScore}/${totalQuestions}`;
  }
  if (totalAttemptsEl) {
    totalAttemptsEl.textContent = totalAttempts;
  }
}

function saveStats() {
  const newBestScore = Math.max(bestScore, totalScore);
  const newTotalAttempts = totalAttempts + 1;

  const stats = {
    bestScore: newBestScore,
    totalAttempts: newTotalAttempts,
    lastPlayed: new Date().toISOString(),
  };

  localStorage.setItem("shieldhero-stats", JSON.stringify(stats));

  // Update global variables
  bestScore = newBestScore;
  totalAttempts = newTotalAttempts;

  // Update display
  updateStartScreenStats();
}

// Call saveStats when showing results
const originalShowResults = showResults;
showResults = function () {
  originalShowResults();
  saveStats();
};

// ============ ANIMATIONS ============
// Add CSS animations dynamically
const style = document.createElement("style");
style.textContent = `
  @keyframes rippleEffect {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
    20%, 40%, 60%, 80% { transform: translateX(10px); }
  }

  @keyframes buttonShake {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-10deg); }
    75% { transform: rotate(10deg); }
  }

  @keyframes particleBurst {
    to {
      transform: translate(
        calc(cos(var(--angle)) * var(--velocity)),
        calc(sin(var(--angle)) * var(--velocity))
      );
      opacity: 0;
    }
  }

  @keyframes confettiFall {
    to {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }

`;
document.head.appendChild(style);

console.log("🛡️ Shield Hero Quiz initialized!");
