const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');

import {
  createBoard,
  createPiece,
  collides,
  mergePiece,
  clearLines,
  rotateMatrix,
  getDropInterval,
  getCyberSecurityQuestionByTime,
  getDifficultyByPlayTime,
  getShapeRewardPool,
  PIECE_COLORS,
  randomPiece
} from './tetris-core.mjs';

const COLS = 10;
const ROWS = 20;
const BASE_BLOCK = 30;
const FULLSCREEN_BLOCK = 38;
let BLOCK = BASE_BLOCK;

let board = createBoard(COLS, ROWS);
let currentPiece = null;
let nextPiece = randomPiece();
let nextQueue = Array.from({ length: 3 }, () => randomPiece());
let score = 0;
let lines = 0;
let level = 1;
let isRunning = false;
let isPaused = false;
let lastTime = 0;
let dropAccumulator = 0;
let guest = true;
let user = null;
let animationFrameId = null;
let combo = 0;
let soundEnabled = true;
let musicEnabled = true;
let currentTheme = 'neon';
let touchActive = false;
let savedState = null;
let lastSfxAt = 0;
let lastGamepadState = {
  left: false,
  right: false,
  down: false,
  rotate: false,
  hardDrop: false
};
let gamepadRepeatTimers = {
  left: 0,
  right: 0,
  down: 0,
  rotate: 0,
  hardDrop: 0
};
let challengeActive = false;
let challengeTimerId = null;
let challengeElapsedMs = 0;
let challengeDeadline = 0;
let nextChallengeAt = 60000;
let challengeQuestion = null;
let challengeLevel = 0;

const scoreNode = document.getElementById('score');
const levelNode = document.getElementById('level');
const linesNode = document.getElementById('lines');
const statusNode = document.getElementById('status');
const fxLayer = document.getElementById('fxLayer');
const authPanel = document.getElementById('authPanel');
const gamePanel = document.getElementById('gamePanel');
const gameCard = document.querySelector('.game-card');
const authMessage = document.getElementById('authMessage');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const introScreen = document.getElementById('introScreen');
const introStartBtn = document.getElementById('introStartBtn');
const bootProgressFill = document.getElementById('bootProgressFill');
const bootStatusText = document.getElementById('bootStatusText');
const controllerIndicator = document.getElementById('controllerIndicator');
const settingsOverlay = document.getElementById('settingsOverlay');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
const bindButtons = document.querySelectorAll('.bind-btn');
const gamepadBindButtons = document.querySelectorAll('.gamepad-bind-btn');
const calibrationOverlay = document.getElementById('calibrationOverlay');
const calibrationBtn = document.getElementById('calibrationBtn');
const closeCalibrationBtn = document.getElementById('closeCalibrationBtn');
const profileButtons = document.querySelectorAll('.profile-btn');
const profileSummaryList = document.getElementById('profileSummaryList');
const profileUseBtn = document.getElementById('profileUseBtn');
const profileDefaultsBtn = document.getElementById('profileDefaultsBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const gameOverScore = document.getElementById('gameOverScore');
const gameOverMessage = document.getElementById('gameOverMessage');
const gameOverRestartBtn = document.getElementById('gameOverRestartBtn');
const gameOverMainMenuBtn = document.getElementById('gameOverMainMenuBtn');
const startBtn = document.getElementById('startBtn');
const modal = document.getElementById('modal');
const questionBox = document.getElementById('questionBox');
const timerBar = document.getElementById('timerBar');
const questionStatus = document.getElementById('questionStatus');

const defaultKeybinds = {
  left: 'KeyA',
  right: 'KeyD',
  down: 'KeyS',
  rotate: 'KeyW',
  hardDrop: 'Space',
  pause: 'KeyP'
};

const controllerProfiles = {
  arcade: {
    left: 'KeyA',
    right: 'KeyD',
    down: 'KeyS',
    rotate: 'KeyW',
    hardDrop: 'Space',
    pause: 'KeyP'
  },
  classic: {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    down: 'ArrowDown',
    rotate: 'ArrowUp',
    hardDrop: 'ShiftLeft',
    pause: 'KeyP'
  }
};

const SETTINGS_KEY = 'cyber-tetris-keybinds';
const PROFILE_KEY = 'cyber-tetris-profile';

const loadKeybinds = () => {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (!saved) return { ...defaultKeybinds };

  try {
    const parsed = JSON.parse(saved);
    return { ...defaultKeybinds, ...parsed };
  } catch (error) {
    return { ...defaultKeybinds };
  }
};

let keybinds = loadKeybinds();
let activeProfile = localStorage.getItem(PROFILE_KEY) || 'arcade';
let awaitingBind = null;
let awaitingGamepadBind = null;
let gamepadKeybinds = {
  left: 0,
  right: 1,
  down: 2,
  rotate: 7,
  hardDrop: null
};
let audioContext = null;
let musicLoopId = null;
let musicStep = 0;

function restoreDefaultBindings() {
  keybinds = { ...defaultKeybinds };
  gamepadKeybinds = {
    left: 0,
    right: 1,
    down: 2,
    rotate: 7,
    hardDrop: null
  };
  saveKeybinds();
  saveGamepadKeybinds();
  refreshBindButtons();
}

function saveGamepadKeybinds() {
  localStorage.setItem('cyber-tetris-gamepad-keybinds', JSON.stringify(gamepadKeybinds));
}

function loadGamepadKeybinds() {
  const saved = localStorage.getItem('cyber-tetris-gamepad-keybinds');
  if (!saved) return { ...gamepadKeybinds };

  try {
    const parsed = JSON.parse(saved);
    const merged = { ...gamepadKeybinds, ...parsed };
    if (merged.hardDrop === null || merged.hardDrop === undefined) {
      merged.hardDrop = null;
    }
    return merged;
  } catch (error) {
    return { ...gamepadKeybinds };
  }
}

const loadSavedGamepadKeybinds = () => {
  gamepadKeybinds = loadGamepadKeybinds();
};

loadSavedGamepadKeybinds();
function ensureAudio() {
  if (!audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    audioContext = new AudioCtor();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

function playTone(frequency, duration, type = 'square', volume = 0.05) {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  const now = audioContext.currentTime;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playSfx(type) {
  if (!soundEnabled) return;
  ensureAudio();
  if (!audioContext) return;

  const now = Date.now();
  if (now - lastSfxAt < 60 && type !== 'game-over') {
    return;
  }
  lastSfxAt = now;

  switch (type) {
    case 'start':
      playTone(220, 0.12, 'triangle', 0.08);
      playTone(330, 0.14, 'triangle', 0.08);
      break;
    case 'move':
      playTone(180, 0.03, 'square', 0.03);
      break;
    case 'rotate':
      playTone(260, 0.05, 'sawtooth', 0.04);
      break;
    case 'clear':
      playTone(520, 0.09, 'triangle', 0.06);
      playTone(660, 0.1, 'triangle', 0.05);
      break;
    case 'game-over':
      playTone(120, 0.18, 'sawtooth', 0.08);
      playTone(80, 0.22, 'square', 0.08);
      break;
    default:
      break;
  }
}

function stopMusicLoop() {
  if (musicLoopId) {
    clearInterval(musicLoopId);
    musicLoopId = null;
  }
  musicStep = 0;
}

function playJazzTone(frequency, duration, type = 'sine', volume = 0.02, detune = 0) {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.detune.value = detune;

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playMusicLoop() {
  if (!musicEnabled || !soundEnabled) return;
  ensureAudio();
  if (!audioContext || musicLoopId) return;

  const progressions = [
    [220, 277, 329],
    [196, 246, 293],
    [174, 220, 261],
    [146, 196, 220]
  ];

  const playJazzPhrase = () => {
    if (!musicEnabled || !soundEnabled || !audioContext) return;

    const chord = progressions[musicStep % progressions.length];
    const bass = chord[0] / 2;

    playJazzTone(bass, 1.2, 'triangle', 0.025, -5);
    chord.forEach((frequency, index) => {
      const delay = index * 0.12;
      setTimeout(() => playJazzTone(frequency, 0.75, 'sine', 0.018 + index * 0.003, index === 0 ? 4 : -4), delay * 1000);
    });

    if (musicStep % 2 === 0) {
      setTimeout(() => playJazzTone(chord[1] * 0.5, 0.8, 'triangle', 0.018, 2), 280);
    }

    musicStep += 1;
  };

  playJazzPhrase();
  musicLoopId = setInterval(playJazzPhrase, 1400);
}

function syncBoardSize() {
  BLOCK = document.body.classList.contains('game-fullscreen') ? FULLSCREEN_BLOCK : BASE_BLOCK;
  canvas.width = COLS * BLOCK;
  canvas.height = ROWS * BLOCK;
  nextCanvas.width = 150;
  nextCanvas.height = 150;
  canvas.style.width = `${COLS * BLOCK}px`;
  canvas.style.height = `${ROWS * BLOCK}px`;
}

function triggerScorePop() {
  scoreNode.classList.remove('score-pop');
  void scoreNode.offsetWidth;
  scoreNode.classList.add('score-pop');
}

function triggerBoardFlash() {
  if (!canvas) return;
  canvas.classList.remove('board-flash');
  void canvas.offsetWidth;
  canvas.classList.add('board-flash');
  setTimeout(() => canvas.classList.remove('board-flash'), 180);
}

function spawnClearBurst() {
  if (!fxLayer) return;

  const burstCount = 18;
  for (let i = 0; i < burstCount; i += 1) {
    const particle = document.createElement('span');
    particle.className = 'fx-particle';
    const originX = Math.random() * 240 + 30;
    const originY = Math.random() * 200 + 80;
    const dx = (Math.random() - 0.5) * 120;
    const dy = (Math.random() - 0.7) * 130;
    particle.style.left = `${originX}px`;
    particle.style.top = `${originY}px`;
    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);
    particle.style.background = i % 2 === 0
      ? 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(90,229,255,0.9) 35%, rgba(57,230,165,0.28) 100%)'
      : 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(57,230,165,0.9) 35%, rgba(57,230,165,0.18) 100%)';
    fxLayer.appendChild(particle);
    setTimeout(() => particle.remove(), 520);
  }
}

function updateHud() {
  scoreNode.textContent = score.toLocaleString();
  levelNode.textContent = String(level);
  linesNode.textContent = String(lines);
}

function getKeyLabel(code) {
  if (!code) return 'Unassigned';
  if (code === 'Space') return 'Space';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code;
}

function refreshBindButtons() {
  bindButtons.forEach((button) => {
    const action = button.dataset.action;
    button.textContent = getKeyLabel(keybinds[action]);
    button.classList.toggle('pending', awaitingBind === action);
  });

  gamepadBindButtons.forEach((button) => {
    const action = button.dataset.action;
    const mappedButton = gamepadKeybinds[action];
    button.textContent = mappedButton === undefined || mappedButton === null ? 'Unassigned' : `Button ${mappedButton + 1}`;
    button.classList.toggle('pending', awaitingGamepadBind === action);
  });
}

function saveKeybinds() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(keybinds));
}

function renderProfileSummary(profileName) {
  const profile = controllerProfiles[profileName] || controllerProfiles.arcade;
  const rows = Object.entries(profile).map(([action, key]) => {
    const labelMap = {
      left: 'Move Left',
      right: 'Move Right',
      down: 'Soft Drop',
      rotate: 'Rotate',
      hardDrop: 'Hard Drop',
      pause: 'Pause'
    };

    return `<li><span>${labelMap[action] || action}</span><strong>${getKeyLabel(key)}</strong></li>`;
  });

  profileSummaryList.innerHTML = rows.join('');
  profileButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.profile === profileName);
  });
}

function setControllerProfile(profileName) {
  activeProfile = profileName;
  localStorage.setItem(PROFILE_KEY, profileName);
  keybinds = { ...controllerProfiles[profileName] };
  saveKeybinds();
  refreshBindButtons();
  renderProfileSummary(profileName);
}

function setKeybind(action, code) {
  keybinds[action] = code;
  saveKeybinds();
  refreshBindButtons();
}

function openSettings() {
  settingsOverlay.classList.remove('hidden');
}

function closeSettings() {
  settingsOverlay.classList.add('hidden');
  awaitingBind = null;
  refreshBindButtons();
}

function openCalibration() {
  calibrationOverlay.classList.remove('hidden');
  renderProfileSummary(activeProfile);
}

function closeCalibration() {
  calibrationOverlay.classList.add('hidden');
}

function applyKeyAction(action) {
  if (action === 'pause') {
    if (!isRunning) {
      return;
    }
    isRunning = false;
    statusNode.textContent = 'PAUSED';
    setTimeout(() => {
      if (!isRunning && currentPiece) {
        isRunning = true;
        statusNode.textContent = 'LIVE';
      }
    }, 200);
    return;
  }

  if (challengeActive) return;
  if (!currentPiece || !isRunning) return;

  if (action === 'left') {
    movePiece(-1);
  } else if (action === 'right') {
    movePiece(1);
  } else if (action === 'down') {
    softDrop();
  } else if (action === 'rotate') {
    rotatePiece();
  } else if (action === 'hardDrop') {
    hardDrop();
  }
}

function getKeyActionFromCode(value) {
  const keyValue = String(value ?? '').trim();
  if (!keyValue) return null;

  const match = Object.entries(keybinds).find(([, code]) => code === keyValue);
  return match ? match[0] : null;
}

function readGamepad() {
  if (!navigator.getGamepads) return null;

  const pads = navigator.getGamepads();
  for (const pad of pads) {
    if (pad) return pad;
  }

  return null;
}

function triggerRepeatedGamepadAction(action, now) {
  const repeatDelay = {
    left: 120,
    right: 120,
    down: 35,
    rotate: 150,
    hardDrop: 260
  }[action] ?? 140;

  if (!gamepadRepeatTimers[action] || now - gamepadRepeatTimers[action] >= repeatDelay) {
    applyKeyAction(action);
    gamepadRepeatTimers[action] = now;
  }
}

function handleGamepadInput() {
  if (gamePanel.classList.contains('hidden') || !isRunning || isPaused || challengeActive) {
    lastGamepadState = { left: false, right: false, down: false, rotate: false, hardDrop: false };
    gamepadRepeatTimers = { left: 0, right: 0, down: 0, rotate: 0, hardDrop: 0 };
    return;
  }

  const pad = readGamepad();
  if (!pad) {
    lastGamepadState = { left: false, right: false, down: false, rotate: false, hardDrop: false };
    gamepadRepeatTimers = { left: 0, right: 0, down: 0, rotate: 0, hardDrop: 0 };
    return;
  }

  if (awaitingGamepadBind) {
    for (let index = 0; index < pad.buttons.length; index += 1) {
      if (pad.buttons[index]?.pressed) {
        gamepadKeybinds[awaitingGamepadBind] = index;
        saveGamepadKeybinds();
        awaitingGamepadBind = null;
        refreshBindButtons();
        break;
      }
    }
  }

  const now = Date.now();
  const deadZone = 0.35;
  const primaryStickX = pad.axes[0] ?? 0;
  const primaryStickY = pad.axes[1] ?? 0;
  const secondaryStickX = pad.axes[2] ?? 0;
  const secondaryStickY = pad.axes[3] ?? 0;
  const dpadLeft = pad.buttons[14]?.pressed || false;
  const dpadRight = pad.buttons[15]?.pressed || false;
  const dpadDown = pad.buttons[13]?.pressed || false;
  const dpadUp = pad.buttons[12]?.pressed || false;

  const leftPressed = (primaryStickX <= -deadZone) || (secondaryStickX <= -deadZone) || dpadLeft;
  const rightPressed = (primaryStickX >= deadZone) || (secondaryStickX >= deadZone) || dpadRight;
  const downPressed = dpadDown || (primaryStickY >= deadZone) || (secondaryStickY >= deadZone);

  const rotateIndex = gamepadKeybinds.rotate ?? 7;
  const hardDropIndex = gamepadKeybinds.hardDrop;
  const rotatePressed = !!pad.buttons[rotateIndex]?.pressed && !dpadUp;
  const hardDropPressed = typeof hardDropIndex === 'number' ? !!pad.buttons[hardDropIndex]?.pressed : false;

  if (leftPressed && (!lastGamepadState.left || now - gamepadRepeatTimers.left > 120)) {
    triggerRepeatedGamepadAction('left', now);
  }
  if (rightPressed && (!lastGamepadState.right || now - gamepadRepeatTimers.right > 120)) {
    triggerRepeatedGamepadAction('right', now);
  }
  if (downPressed && (!lastGamepadState.down || now - gamepadRepeatTimers.down > 90)) {
    triggerRepeatedGamepadAction('down', now);
  }
  if (rotatePressed && (!lastGamepadState.rotate || now - gamepadRepeatTimers.rotate > 150)) {
    triggerRepeatedGamepadAction('rotate', now);
  }
  if (hardDropPressed && (!lastGamepadState.hardDrop || now - gamepadRepeatTimers.hardDrop > 260)) {
    triggerRepeatedGamepadAction('hardDrop', now);
  }

  lastGamepadState = {
    left: leftPressed,
    right: rightPressed,
    down: downPressed,
    rotate: rotatePressed,
    hardDrop: hardDropPressed
  };
}

function spawnPiece() {
  currentPiece = nextPiece;
  nextPiece = randomPiece();
  currentPiece.x = Math.floor((COLS - currentPiece.matrix[0].length) / 2);
  currentPiece.y = 0;

  if (collides(board, currentPiece)) {
    endGame();
  }
}

function clearChallengeSession() {
  challengeActive = false;
  challengeQuestion = null;
  challengeDeadline = 0;
  if (challengeTimerId) {
    clearInterval(challengeTimerId);
    challengeTimerId = null;
  }
  if (modal) {
    modal.classList.add('hidden');
  }
  if (timerBar) {
    timerBar.style.width = '100%';
  }
  if (questionStatus) {
    questionStatus.textContent = '';
  }
}

function resumeGameAfterChallenge(message = 'Challenge complete. Back in the grid.') {
  challengeActive = false;
  challengeQuestion = null;
  challengeDeadline = 0;
  if (challengeTimerId) {
    clearInterval(challengeTimerId);
    challengeTimerId = null;
  }
  if (modal) {
    modal.classList.add('hidden');
  }
  if (timerBar) {
    timerBar.style.width = '100%';
  }
  if (questionStatus) {
    questionStatus.textContent = message;
  }
  if (isRunning) {
    isPaused = false;
    lastTime = 0;
  }
  nextChallengeAt = challengeElapsedMs + getNextChallengeDelay();
  syncStartButtonState();
}

function getChallengeDifficulty() {
  return getDifficultyByPlayTime(challengeElapsedMs);
}

function getNextChallengeDelay() {
  const base = 60000;
  const difficultyBoost = Math.min(30000, Math.max(0, challengeElapsedMs - 60000) * 0.06);
  return Math.max(60000, base + difficultyBoost + Math.random() * 15000);
}

function getChallengeSpeedMultiplier() {
  return 1 + challengeLevel * 0.08;
}

const REWARD_SHAPE_MATRIX = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[1, 1, 0], [0, 1, 1]],
  [[0, 1, 1], [1, 1, 0]]
];

function getRewardLabel(shapeType) {
  const labels = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
  return labels[shapeType] || `BLOCK ${shapeType + 1}`;
}

function getRewardPreviewMarkup(shapeType) {
  const matrix = REWARD_SHAPE_MATRIX[shapeType] || REWARD_SHAPE_MATRIX[0];
  const color = PIECE_COLORS[shapeType] || PIECE_COLORS[0];
  const cellSize = 18;
  const width = Math.max(...matrix.map((row) => row.length)) * cellSize;
  const height = matrix.length * cellSize;
  const cells = [];

  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) return;
      cells.push(`
        <span
          style="position:absolute; left:${x * cellSize}px; top:${y * cellSize}px; width:${cellSize}px; height:${cellSize}px; background:${color}; border:2px solid rgba(7,16,13,0.9); box-shadow: inset 0 0 18px rgba(255,255,255,0.15); border-radius:3px;"
        ></span>
      `);
    });
  });

  return `
    <div aria-label="${getRewardLabel(shapeType)} block preview" style="position:relative; width:${width}px; height:${height}px; margin:0 auto; display:flex; align-items:center; justify-content:center;">
      ${cells.join('')}
    </div>
  `;
}

function renderChallengeQuestion(question) {
  if (!questionBox || !modal) return;

  const difficulty = getChallengeDifficulty();
  const elapsedSeconds = Math.max(0, Math.floor(challengeElapsedMs / 1000));
  const difficultyLabel = difficulty.toUpperCase();

  questionBox.innerHTML = `
    <p class="eyebrow">CYBER SECURITY CHECK • ${difficultyLabel} • ${elapsedSeconds}s</p>
    <h3>${question.prompt}</h3>
    <div class="challenge-actions">
      ${question.choices.map((choice, index) => `
        <button type="button" class="btn secondary small challenge-option" data-choice="${index}">${choice}</button>
      `).join('')}
    </div>
  `;

  questionBox.querySelectorAll('.challenge-option').forEach((button) => {
    button.addEventListener('click', () => {
      const choiceIndex = Number(button.dataset.choice);
      const isCorrect = choiceIndex === question.answerIndex;

      if (challengeTimerId) {
        clearInterval(challengeTimerId);
        challengeTimerId = null;
      }

      if (isCorrect) {
        const rewardPool = getShapeRewardPool(3);
        questionBox.innerHTML = `
          <p class="eyebrow">REWARD TOKEN</p>
          <h3>Choose your next block</h3>
          <div class="challenge-actions">
            ${rewardPool.map((shapeType, index) => `
              <button type="button" class="btn secondary small reward-option" data-shape="${shapeType}" data-choice-index="${index + 1}" aria-label="Choose ${getRewardLabel(shapeType)} block with key ${index + 1}">
                <span style="display:flex; align-items:center; justify-content:center; gap:10px; flex-direction:column; width:100%;">
                  <span style="font-size:11px; letter-spacing:0.18em; opacity:0.8;">KEY ${index + 1}</span>
                  ${getRewardPreviewMarkup(shapeType)}
                  <span style="font-size:18px; font-weight:700; letter-spacing:0.06em;">${getRewardLabel(shapeType)}</span>
                </span>
              </button>
            `).join('')}
          </div>
        `;
        questionStatus.textContent = 'Access granted. Select the next block option with 1, 2, or 3.';
        timerBar.style.width = '100%';

        questionBox.querySelectorAll('.reward-option').forEach((buttonNode) => {
          buttonNode.addEventListener('click', () => {
            const selectedType = Number(buttonNode.dataset.shape);
            nextPiece = createPiece(selectedType);
            nextQueue[0] = nextPiece;
            challengeLevel += 1;
            drawNext();
            resumeGameAfterChallenge(`Reward applied. Challenge level ${challengeLevel} online.`);
          });
        });
        return;
      }

      challengeLevel = Math.max(0, challengeLevel);
      resumeGameAfterChallenge(`Incorrect. Correct answer: ${question.choices[question.answerIndex]}`);
    });
  });
}

function triggerCyberChallenge() {
  if (!isRunning || challengeActive || !questionBox || !modal) return;

  challengeActive = true;
  challengeQuestion = getCyberSecurityQuestionByTime(challengeElapsedMs);
  const challengeTimeout = 30000;
  challengeDeadline = Date.now() + challengeTimeout;
  modal.classList.remove('hidden');
  questionStatus.textContent = `Playtime checkpoint reached at ${Math.floor(challengeElapsedMs / 1000)}s. ${getChallengeDifficulty().toUpperCase()} difficulty active.`;
  timerBar.style.width = '100%';
  renderChallengeQuestion(challengeQuestion);

  if (challengeTimerId) {
    clearInterval(challengeTimerId);
  }

  challengeTimerId = setInterval(() => {
    if (!challengeActive) return;

    const remaining = Math.max(0, challengeDeadline - Date.now());
    const percent = (remaining / challengeTimeout) * 100;
    timerBar.style.width = `${percent}%`;

    if (remaining <= 0) {
      clearInterval(challengeTimerId);
      challengeTimerId = null;
      resumeGameAfterChallenge(`Time expired. Correct answer: ${challengeQuestion.choices[challengeQuestion.answerIndex]}`);
    }
  }, 80);
}

function syncStartButtonState() {
  if (!startBtn) return;

  startBtn.classList.toggle('active', isRunning);
  startBtn.textContent = isRunning ? 'RUNNING' : 'START GAME';
  startBtn.setAttribute('aria-pressed', String(isRunning));
}

function resetGame() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  clearChallengeSession();
  challengeElapsedMs = 0;
  challengeLevel = 0;
  nextChallengeAt = 60000;
  board = createBoard(COLS, ROWS);
  score = 0;
  lines = 0;
  level = 1;
  combo = 0;
  dropAccumulator = 0;
  lastTime = 0;
  syncBoardSize();
  currentPiece = randomPiece();
  nextQueue = Array.from({ length: 3 }, () => randomPiece());
  nextPiece = nextQueue[0];
  currentPiece.x = Math.floor((COLS - currentPiece.matrix[0].length) / 2);
  currentPiece.y = 0;
  isRunning = false;
  isPaused = false;
  statusNode.textContent = 'READY';
  syncStartButtonState();
  updateHud();
  draw();
  drawNext();
}

function startGame() {
  if (!currentPiece) {
    resetGame();
  }

  if (isRunning) return;

  challengeElapsedMs = 0;
  challengeLevel = 0;
  nextChallengeAt = 60000;
  playSfx('start');
  if (musicEnabled && soundEnabled) {
    playMusicLoop();
  }
  isRunning = true;
  isPaused = false;
  lastTime = 0;
  statusNode.textContent = 'LIVE';
  syncStartButtonState();
  animationFrameId = requestAnimationFrame(gameLoop);
}

function endGame() {
  clearChallengeSession();
  stopMusicLoop();
  isRunning = false;
  statusNode.textContent = 'GAME OVER';
  syncStartButtonState();
  if (gameCard) {
    gameCard.classList.remove('shake');
    void gameCard.offsetWidth;
    gameCard.classList.add('shake');
    setTimeout(() => gameCard.classList.remove('shake'), 420);
  }
  playSfx('game-over');

  if (!guest && user) {
    fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, score })
    }).catch(() => undefined);
  }

  gameOverScore.textContent = score.toLocaleString();
  gameOverMessage.textContent = guest
    ? 'Guest mode is not saved, but the run was clean. Recalibrate and try again.'
    : 'Your score has been registered. Re-enter the node and push higher.';
  gameOverOverlay.classList.remove('hidden');
}

function startBootSequence() {
  if (introStartBtn.disabled) return;

  introStartBtn.disabled = true;
  introStartBtn.classList.remove('press-start');

  let progress = 0;
  const steps = [
    { value: 20, label: 'LOADING CORE' },
    { value: 48, label: 'SYNCING GRID' },
    { value: 72, label: 'CALIBRATING INPUT' },
    { value: 100, label: 'READY' }
  ];

  const tick = () => {
    const step = steps.find((item) => progress < item.value) || steps[steps.length - 1];
    const index = steps.indexOf(step);
    const nextValue = step.value;
    const nextLabel = step.label;

    if (progress >= 100) {
      bootProgressFill.style.width = '100%';
      bootStatusText.textContent = 'READY';
      introStartBtn.textContent = 'ENTER NODE';
      introStartBtn.classList.add('press-start');
      introStartBtn.disabled = false;
      setTimeout(() => {
        introScreen.classList.add('hidden');
        authPanel.classList.remove('hidden');
        playSfx('start');
      }, 250);
      return;
    }

    progress = Math.min(progress + 16 + index * 6, nextValue);
    bootProgressFill.style.width = `${progress}%`;
    bootStatusText.textContent = nextLabel;
    setTimeout(tick, 120);
  };

  bootStatusText.textContent = 'LOADING CORE';
  tick();
}

function movePiece(direction) {
  if (!currentPiece || !isRunning) return;
  const candidate = { ...currentPiece, x: currentPiece.x + direction };
  if (!collides(board, candidate)) {
    currentPiece = candidate;
    playSfx('move');
  }
}

function rotatePiece() {
  if (!currentPiece || !isRunning) return;

  const rotated = rotateMatrix(currentPiece.matrix);
  const offsets = [0, -1, 1, -2, 2];

  for (const offset of offsets) {
    const candidate = { ...currentPiece, x: currentPiece.x + offset, matrix: rotated };
    if (!collides(board, candidate)) {
      currentPiece = candidate;
      playSfx('rotate');
      return;
    }
  }
}

function lockPiece() {
  board = mergePiece(board, currentPiece);
  const result = clearLines(board);
  board = result.board;
  const cleared = result.linesCleared;
  lines += cleared;

  if (cleared > 0) {
    combo += 1;
    const multiplier = 1 + (combo - 1) * 0.5;
    const lineScore = [0, 100, 300, 500, 800][cleared] * level * multiplier;
    score += Math.round(lineScore);
    triggerScorePop();
    triggerBoardFlash();
    spawnClearBurst();
    playSfx('clear');
  } else {
    combo = 0;
  }

  level = Math.floor(lines / 10) + 1;
  updateHud();
  spawnPiece();
  drawNext();
}

function softDrop() {
  if (!currentPiece || !isRunning) return;

  const candidate = { ...currentPiece, y: currentPiece.y + 1 };
  if (!collides(board, candidate)) {
    currentPiece = candidate;
    return;
  }

  lockPiece();
}

function hardDrop() {
  if (!currentPiece || !isRunning) return;

  while (!collides(board, { ...currentPiece, y: currentPiece.y + 1 })) {
    currentPiece = { ...currentPiece, y: currentPiece.y + 1 };
  }

  lockPiece();
}

function drawMatrix(targetCtx, matrix, offsetX, offsetY, ghost = false) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) return;

      const px = offsetX + x;
      const py = offsetY + y;
      if (px < 0 || py < 0 || px >= COLS || py >= ROWS) return;

      targetCtx.fillStyle = ghost ? 'rgba(255,255,255,0.14)' : PIECE_COLORS[value - 1];
      targetCtx.fillRect(px * BLOCK, py * BLOCK, BLOCK, BLOCK);
      targetCtx.strokeStyle = ghost ? 'rgba(255,255,255,0.18)' : '#07100d';
      targetCtx.lineWidth = 2;
      targetCtx.strokeRect(px * BLOCK, py * BLOCK, BLOCK, BLOCK);
    });
  });
}

function drawBoard() {
  ctx.fillStyle = '#05080a';
  ctx.fillRect(0, 0, COLS * BLOCK, ROWS * BLOCK);

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const value = board[y][x];
      if (!value) continue;

      ctx.fillStyle = PIECE_COLORS[value - 1];
      ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
      ctx.strokeStyle = '#06100c';
      ctx.lineWidth = 2;
      ctx.strokeRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
    }
  }

  if (currentPiece) {
    let ghost = { ...currentPiece };
    while (!collides(board, { ...ghost, y: ghost.y + 1 })) {
      ghost = { ...ghost, y: ghost.y + 1 };
    }

    drawMatrix(ctx, ghost.matrix, ghost.x, ghost.y, true);
    drawMatrix(ctx, currentPiece.matrix, currentPiece.x, currentPiece.y);
  }
}

function drawNext() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  nextCtx.fillStyle = '#05080a';
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

  if (!nextQueue.length) return;

  const previewPieces = nextQueue.slice(0, 3);
  const cellSize = 24;
  previewPieces.forEach((piece, index) => {
    const matrix = piece.matrix;
    const offsetX = 12 + Math.floor((4 - matrix[0].length) / 2);
    const offsetY = 8 + index * 38 + Math.floor((4 - matrix.length) / 2);
    drawMatrix(nextCtx, matrix, offsetX, offsetY);
  });
}

function draw() {
  drawBoard();
  drawNext();
}

function gameLoop(timestamp) {
  if (!isRunning || isPaused) return;

  if (!lastTime) {
    lastTime = timestamp;
  }

  const delta = timestamp - lastTime;
  lastTime = timestamp;

  if (!challengeActive) {
    challengeElapsedMs += delta;
    if (challengeElapsedMs >= nextChallengeAt) {
      triggerCyberChallenge();
    }
  }

  if (challengeActive && !modal.classList.contains('hidden')) {
    const remaining = Math.max(0, challengeDeadline - Date.now());
    const percent = (remaining / 30000) * 100;
    timerBar.style.width = `${Math.max(0, percent)}%`;
  }

  if (challengeActive) {
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
    return;
  }

  dropAccumulator += delta;

  const baseInterval = Math.max(120, getDropInterval(level) - Math.floor(lines / 5) * 25);
  const interval = Math.max(90, baseInterval / getChallengeSpeedMultiplier());
  if (dropAccumulator >= interval) {
    dropAccumulator = 0;
    softDrop();
  }

  handleGamepadInput();
  draw();
  animationFrameId = requestAnimationFrame(gameLoop);
}

function login() {
  const email = document.getElementById('email').value.trim();
  const username = document.getElementById('username').value.trim();

  if (!email || !username) {
    authMessage.textContent = 'Enter both email and username.';
    return;
  }

  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username })
  })
    .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
    .then(({ ok, data }) => {
      if (!ok) {
        authMessage.textContent = data.error || 'Login failed.';
        return;
      }

      guest = false;
      user = data;
      localStorage.setItem('cyber-tetris-user', JSON.stringify(user));
      window.location.href = 'profile.html';
    })
    .catch(() => {
      authMessage.textContent = 'Unable to sign in right now.';
    });
}

function togglePause() {
  if (!isRunning) return;
  isPaused = !isPaused;
  const pauseOverlay = document.getElementById('pauseOverlay');
  if (isPaused) {
    pauseOverlay.classList.remove('hidden');
    statusNode.textContent = 'PAUSED';
  } else {
    pauseOverlay.classList.add('hidden');
    statusNode.textContent = 'LIVE';
    lastTime = 0;
    animationFrameId = requestAnimationFrame(gameLoop);
  }
}

function saveLocalGameState() {
  if (!currentPiece) return;
  savedState = {
    board,
    currentPiece,
    nextQueue,
    score,
    lines,
    level,
    guest,
    user,
    combo,
    isRunning
  };
  localStorage.setItem('cyber-tetris-saved-state', JSON.stringify(savedState));
}

function restoreLocalGameState() {
  const raw = localStorage.getItem('cyber-tetris-saved-state');
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.board)) return false;
    board = parsed.board;
    currentPiece = parsed.currentPiece;
    nextQueue = parsed.nextQueue || Array.from({ length: 3 }, () => randomPiece());
    nextPiece = nextQueue[0];
    score = Number(parsed.score) || 0;
    lines = Number(parsed.lines) || 0;
    level = Number(parsed.level) || 1;
    combo = Number(parsed.combo) || 0;
    guest = !!parsed.guest;
    user = parsed.user || null;
    isRunning = false;
    isPaused = false;
    lastTime = 0;
    statusNode.textContent = 'READY';
    updateHud();
    draw();
    drawNext();
    return true;
  } catch (error) {
    return false;
  }
}

function bindInputs() {
  introStartBtn.addEventListener('click', () => {
    ensureAudio();
    startBootSequence();
  });

  const pauseBtn = document.getElementById('pauseBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const saveGameBtn = document.getElementById('saveGameBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const musicToggleBtn = document.getElementById('musicToggleBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  pauseBtn.addEventListener('click', togglePause);
  resumeBtn.addEventListener('click', () => { isPaused = false; document.getElementById('pauseOverlay').classList.add('hidden'); statusNode.textContent = 'LIVE'; lastTime = 0; animationFrameId = requestAnimationFrame(gameLoop); });
  saveGameBtn.addEventListener('click', () => { saveLocalGameState(); document.getElementById('pauseOverlay').classList.add('hidden'); isPaused = false; statusNode.textContent = 'READY'; });
  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggleBtn.textContent = `SFX: ${soundEnabled ? 'ON' : 'OFF'}`;
    if (!soundEnabled) {
      stopMusicLoop();
    } else if (isRunning) {
      playMusicLoop();
    }
  });
  musicToggleBtn.addEventListener('click', () => {
    musicEnabled = !musicEnabled;
    musicToggleBtn.textContent = `MUSIC: ${musicEnabled ? 'ON' : 'OFF'}`;
    if (!musicEnabled) {
      stopMusicLoop();
    } else if (isRunning) {
      playMusicLoop();
    }
  });
  themeToggleBtn.addEventListener('click', () => { currentTheme = currentTheme === 'neon' ? 'arcade' : 'neon'; document.body.dataset.theme = currentTheme; themeToggleBtn.textContent = `THEME: ${currentTheme.toUpperCase()}`; });

  settingsBtn.addEventListener('click', openSettings);
  calibrationBtn.addEventListener('click', openCalibration);
  closeSettingsBtn.addEventListener('click', closeSettings);
  closeCalibrationBtn.addEventListener('click', closeCalibration);
  saveSettingsBtn.addEventListener('click', () => {
    saveKeybinds();
    closeSettings();
  });
  profileUseBtn.addEventListener('click', () => {
    keybinds = { ...controllerProfiles[activeProfile] };
    saveKeybinds();
    refreshBindButtons();
    closeCalibration();
  });
  profileDefaultsBtn.addEventListener('click', () => {
    restoreDefaultBindings();
    renderProfileSummary(activeProfile);
  });
  resetDefaultsBtn.addEventListener('click', () => {
    restoreDefaultBindings();
  });

  profileButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setControllerProfile(button.dataset.profile);
    });
  });

  bindButtons.forEach((button) => {
    button.addEventListener('click', () => {
      awaitingBind = button.dataset.action;
      button.classList.add('pending');
      refreshBindButtons();
    });
  });

  gamepadBindButtons.forEach((button) => {
    button.addEventListener('click', () => {
      awaitingGamepadBind = button.dataset.action;
      button.classList.add('pending');
      refreshBindButtons();
    });
  });

  gameOverRestartBtn.addEventListener('click', () => {
    gameOverOverlay.classList.add('hidden');
    resetGame();
    startGame();
  });

  gameOverMainMenuBtn.addEventListener('click', () => {
    gameOverOverlay.classList.add('hidden');
    stopMusicLoop();
    resetGame();
    authPanel.classList.remove('hidden');
    gamePanel.classList.add('hidden');
    introScreen.classList.add('hidden');
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    }
  });

  document.getElementById('guestBtn').addEventListener('click', () => {
    guest = true;
    user = null;
    authPanel.classList.add('hidden');
    gamePanel.classList.remove('hidden');
    introScreen.classList.add('hidden');
    const restored = restoreLocalGameState();
    if (restored) {
      statusNode.textContent = 'READY';
      return;
    }
    resetGame();
  });

  document.getElementById('loginBtn').addEventListener('click', login);
  startBtn.addEventListener('click', startGame);

  document.querySelectorAll('.touch-btn').forEach((button) => {
    button.addEventListener('pointerdown', () => {
      touchActive = true;
      const action = button.dataset.touch;
      if (action === 'left') movePiece(-1);
      if (action === 'right') movePiece(1);
      if (action === 'down') softDrop();
      if (action === 'rotate') rotatePiece();
      if (action === 'hardDrop') hardDrop();
    });
  });

  fullscreenBtn.addEventListener('click', async () => {
    const target = document.getElementById('gamePanelWrap') || document.getElementById('gamePanel');
    if (!target) return;

    if (!document.fullscreenElement || document.fullscreenElement !== target) {
      try {
        await target.requestFullscreen();
      } catch (error) {
        document.body.classList.toggle('game-fullscreen');
      }
      return;
    }

    document.exitFullscreen();
  });

  document.addEventListener('fullscreenchange', () => {
    const isGameFullscreen = document.fullscreenElement === document.getElementById('gamePanelWrap') || document.fullscreenElement === document.getElementById('gamePanel');
    document.body.classList.toggle('game-fullscreen', isGameFullscreen);
    syncBoardSize();
  });

  document.addEventListener('keydown', (event) => {
    if (event.target && ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
      return;
    }

    if (awaitingBind) {
      event.preventDefault();
      event.stopPropagation();
      setKeybind(awaitingBind, event.code || event.key || 'Unassigned');
      awaitingBind = null;
      refreshBindButtons();
      return;
    }

    const rewardButtons = Array.from(questionBox?.querySelectorAll('.reward-option') || []);
    if (challengeActive && rewardButtons.length > 0) {
      const rewardChoice = Number(event.key);
      if ([1, 2, 3].includes(rewardChoice)) {
        const targetButton = rewardButtons[rewardChoice - 1];
        if (targetButton) {
          event.preventDefault();
          event.stopPropagation();
          targetButton.click();
          return;
        }
      }
    }

    if (challengeActive) {
      return;
    }

    const pressedKey = event.code || event.key;
    let actionMatch = getKeyActionFromCode(pressedKey);

    if (!actionMatch) {
      actionMatch = getKeyActionFromCode(event.key);
    }

    if (actionMatch) {
      if (actionMatch === 'hardDrop') {
        event.preventDefault();
      }
      if (settingsOverlay && !settingsOverlay.classList.contains('hidden')) {
        return;
      }
      if (gamePanel.classList.contains('hidden')) {
        return;
      }
      applyKeyAction(actionMatch);
      return;
    }

    if (gamePanel.classList.contains('hidden') || !isRunning) return;

    const defaultsMatch = {
      left: pressedKey === defaultKeybinds.left || pressedKey === 'ArrowLeft',
      right: pressedKey === defaultKeybinds.right || pressedKey === 'ArrowRight',
      down: pressedKey === defaultKeybinds.down || pressedKey === 'ArrowDown',
      rotate: pressedKey === defaultKeybinds.rotate || pressedKey === 'ArrowUp',
      hardDrop: pressedKey === defaultKeybinds.hardDrop || pressedKey === 'Space'
    };

    if (defaultsMatch.left) {
      movePiece(-1);
    } else if (defaultsMatch.right) {
      movePiece(1);
    } else if (defaultsMatch.down) {
      softDrop();
    } else if (defaultsMatch.rotate) {
      rotatePiece();
    } else if (defaultsMatch.hardDrop) {
      event.preventDefault();
      hardDrop();
    }
  });
}

function updateControllerStatus() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const connected = Array.from(pads).some(Boolean);

  if (!controllerIndicator) return;

  controllerIndicator.classList.toggle('connected', connected);
  controllerIndicator.querySelector('strong').textContent = connected ? 'CONTROLLER ONLINE' : 'CONTROLLER OFFLINE';
}

window.addEventListener('gamepadconnected', () => updateControllerStatus());
window.addEventListener('gamepaddisconnected', () => updateControllerStatus());
window.addEventListener('load', updateControllerStatus);

bindInputs();
refreshBindButtons();
renderProfileSummary(activeProfile);
updateControllerStatus();
updateHud();