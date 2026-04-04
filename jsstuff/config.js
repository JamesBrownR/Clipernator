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
const playerImg = new Image();
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
