// ============================================================
// CLIPBLAST: PARTY HUNTER — Config
// ============================================================

const CFG = {
  W: 700, H: 460,
  PLAYER_SPEED: 3.2,
  SPEED_BOOST_MULT: 1.65,
  DASH_SPEED: 14,
  DASH_FRAMES: 10,
  WALL_PAD: 22,
  MAX_AMMO: 8,
  RELOAD_FRAMES: 90,
  INVINCIBLE_FRAMES: 80,
  PARTY_FREEZE_FRAMES: 180,
  SPEED_BOOST_FRAMES: 300,
  DASH_MAX_CHARGES: 3,
  DASH_COOLDOWN_FRAMES: 240,
  BULLET_COUNT: 5,
  BULLET_SPEED: 14,
  BULLET_LIFE: 22,
  SPAWN_INTERVAL_BASE: 150,
  MAX_HEALTH: 100,
  HEALTH_REGEN: 8,
  SAFE_SPAWN_DIST: 160,
  WAVE_ENEMIES_BASE: 6,
  WAVE_ENEMIES_GROWTH: 3,
  WAVE_SPAWN_SPEEDUP: 13,

  BOSS_WAVE: 11,
  BOSS2_WAVE: 22,
  BOSS_BASE_HP: 120,
  BOSS_SPEED: 1.8,
  MELEE_SWING_FRAMES: 18,
  MELEE_RANGE: 95,
  MELEE_CONE_ANGLE: 1.1,
  MELEE_DAMAGE: 4,
  GLOW_COOLDOWN: 45,
};

// World dimensions — mutated when descending to floor 2
let worldW = CFG.W;
let worldH = CFG.H;
let renderScale = 1.0;

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// Player body sprite (Clippy paperclip)
// In config.js — replace the playerImg lines with this:
const playerImg = new Image();
let playerCanvas = null; // will hold the black-stripped version

playerImg.onload = function() {
  // Strip black background
  const off = document.createElement('canvas');
  off.width  = playerImg.naturalWidth;
  off.height = playerImg.naturalHeight;
  const offCtx = off.getContext('2d');
  offCtx.drawImage(playerImg, 0, 0);
  const imageData = offCtx.getImageData(0, 0, off.width, off.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    // If pixel is very dark (black background), make transparent
    if (r < 30 && g < 30 && b < 30) {
      data[i+3] = 0;
    }
  }
  offCtx.putImageData(imageData, 0, 0);
  playerCanvas = off;
};
playerImg.src = '/Clipernator/sprites/Clippy.png';

// Shotgun sprite — follows mouse aim independently of body
const shotgunImg = new Image();
shotgunImg.src = '/Clipernator/sprites/Shotgun.png';

// Gun state — shared between draw.js and systems.js
// gunAngle: actual world-space angle the gun is pointing
// gunRecoil: 0..1, kicks back on shoot and decays
// playerMoveAngle: direction the body faces (from movement velocity)
let gunAngle = 0;
let gunRecoil = 0;
let playerMoveAngle = 0; // angle body faces — updated in sysPlayerMovement
let gunX = 0;   
let gunY = 0; 
let playerBobTimer = 0;

// ================================================================
// KEYBINDS — defaults + localStorage persistence
// ================================================================

const KEYBIND_DEFAULTS = {
  moveLeft:   'a',
  moveRight:  'd',
  moveUp:     'w',
  moveDown:   's',
  reload:     'r',
  dash:       'Shift',
  prizeWheel: 'q',
  pause:      'p',
};

const KEYBIND_LABELS = {
  moveLeft:   'Move Left',
  moveRight:  'Move Right',
  moveUp:     'Move Up',
  moveDown:   'Move Down',
  reload:     'Reload',
  dash:       'Dash',
  prizeWheel: 'Prize Wheel',
  pause:      'Pause',
};

// Load saved binds from localStorage, falling back to defaults
function loadKeybinds() {
  try {
    const saved = localStorage.getItem('clipblast_keybinds');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Only accept keys that exist in defaults (guards against stale saves)
      for (const action of Object.keys(KEYBIND_DEFAULTS)) {
        if (parsed[action]) KEYBINDS[action] = parsed[action];
      }
    }
  } catch(e) { /* ignore */ }
}

function saveKeybinds() {
  try { localStorage.setItem('clipblast_keybinds', JSON.stringify(KEYBINDS)); }
  catch(e) { /* ignore */ }
}

// Mutable copy — this is what the game reads
const KEYBINDS = { ...KEYBIND_DEFAULTS };
loadKeybinds();

// ── Helper: format a key name for display ──
function formatKey(k) {
  if (k === ' ')      return 'SPACE';
  if (k === 'Shift')  return 'SHIFT';
  if (k === 'Control')return 'CTRL';
  if (k === 'Alt')    return 'ALT';
  return k.toUpperCase();
}
