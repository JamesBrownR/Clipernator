// ============================================================
// CLIPBLAST: PARTY HUNTER — Config  
// ============================================================

const CFG = {
  W: 700, H: 460,
  PLAYER_SPEED: 4,
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

   WAVE_ENEMIES_FLOOR2_BASE: 5,   // floor 2 starts lighter
  WAVE_ENEMIES_FLOOR2_GROWTH: 2, // and scales more gently

  
  BOSS_WAVE: 10,
  BOSS2_WAVE: 26,
  BOSS_BASE_HP: 240,
  BOSS_SPEED: 1.8,

  CLOWN_CAR_SPEED: 4.2,
CLOWN_CAR_EJECT_INTERVAL: 240,
CLOWN_CAR_BOUNCE_MAX: 5,
CLOWN_CAR_TAKEOVER_FRAMES: 240,
MINI_CLOWN_SPEED: 3.8,

  
  MELEE_SWING_FRAMES: 18,
  MELEE_RANGE: 95,
  MELEE_CONE_ANGLE: 1.1,
  MELEE_DAMAGE: 4,
  GLOW_COOLDOWN: 45,
  MELEE_ACTIVE_FRAMES: 8,  // how many frames the hitbox is live
};

let worldW = CFG.W;
let worldH = CFG.H;
let renderScale = 1.0;

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const playerImg = new Image();
let playerCanvas = null;

playerImg.onload = function() {
  const off = document.createElement('canvas');
  off.width  = playerImg.naturalWidth;
  off.height = playerImg.naturalHeight;
  const offCtx = off.getContext('2d');
  offCtx.drawImage(playerImg, 0, 0);
  const imageData = offCtx.getImageData(0, 0, off.width, off.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    if (r < 30 && g < 30 && b < 30) { data[i+3] = 0; }
  }
  offCtx.putImageData(imageData, 0, 0);
  playerCanvas = off;
};
playerImg.src = '/Clipernator/sprites/Clippy.png';

const shotgunImg = new Image();
shotgunImg.src = '/Clipernator/sprites/Shotgun.png';

let gunAngle = 0;
let gunRecoil = 0;
let playerMoveAngle = 0;
let gunX = 0;
let gunY = 0;
let playerBobTimer = 0;

const normalBulletImg = new Image();
normalBulletImg.src = '/Clipernator/sprites/bullets/normalbullet.png';

const dudBulletImg = new Image();
dudBulletImg.src = '/Clipernator/sprites/bullets/dudbullet.png'; // pill image

const TearBulletImg = new Image();
TearBulletImg.src = '/Clipernator/sprites/bullets/TearBullet.png'; // water balloon image

const PurpleTearBulletImg = new Image();
PurpleTearBulletImg.src = '/Clipernator/sprites/bullets/PurpleTearBullet.png';

const RedTearBulletImg = new Image();
RedTearBulletImg.src = '/Clipernator/sprites/bullets/RedTearBullet.png';

const arcBallImg = new Image();
arcBulletImg = arcBallImg; // alias
arcBallImg.onload = function() {
  const off = document.createElement('canvas');
  off.width = arcBallImg.naturalWidth; off.height = arcBallImg.naturalHeight;
  const offCtx = off.getContext('2d');
  offCtx.drawImage(arcBallImg, 0, 0);
  const d = offCtx.getImageData(0, 0, off.width, off.height);
  for (let i = 0; i < d.data.length; i += 4) {
    if (d.data[i] < 25 && d.data[i+1] < 25 && d.data[i+2] < 25) d.data[i+3] = 0;
  }
  offCtx.putImageData(d, 0, 0);
  arcBallCanvas = off;
};
arcBallImg.src = '/Clipernator/sprites/bullets/arcball.png'; // sphere image
let arcBallCanvas = null;


const bouncyBulletImg = new Image();
bouncyBulletImg.src = '/Clipernator/sprites/bullets/bouncybullet.png';

const bullet2xImg = new Image();
bullet2xImg.src = '/Clipernator/sprites/bullets/bullet2x.png';

const bullet3xImg = new Image();
bullet3xImg.src = '/Clipernator/sprites/bullets/bullet3x.png';

const bullet4xImg = new Image();
bullet4xImg.src = '/Clipernator/sprites/bullets/bullet4x.png';



// At the top of draw.js, add this with the other image loaders (near playerImg/shotgunImg)

const forkSheetImg = new Image();
forkSheetImg.src = '/Clipernator/sprites/enemies/Utensil/Fork/ForkSheet.png';

const forkTipImg = new Image();
forkTipImg.src = '/Clipernator/sprites/enemies/Utensil/Fork/ForkTip.png';

const knifeSheetImg = new Image();
knifeSheetImg.src = '/Clipernator/sprites/enemies/Utensil/Knife/KnifeSheet.png';

const knifeTipImg = new Image();
knifeTipImg.src = '/Clipernator/sprites/enemies/Utensil/Knife/KnifeTip.png';

const spoonSheetImg = new Image();
spoonSheetImg.src = '/Clipernator/sprites/enemies/Utensil/Spoon/SpoonSheet.png';

const spoonTipImg = new Image();
spoonTipImg.src = '/Clipernator/sprites/enemies/Utensil/Spoon/SpoonTip.png';



const partyHatImg = new Image();
partyHatImg.src = '/Clipernator/sprites/enemies/PartyHat/PartyHat.png';


const partyHatIdleSheet = new Image();
partyHatIdleSheet.src = '/Clipernator/sprites/enemies/PartyHat/PartyHatIdleSheet.png';

const partyHatTransitionSheet = new Image();
partyHatTransitionSheet.src = '/Clipernator/sprites/enemies/PartyHat/PartyHatTransitionSheet.png';
 
const partyHatDiveSheet = new Image();
partyHatDiveSheet.src = '/Clipernator/sprites/enemies/PartyHat/PartyHatDiveSheet.png';

const partyHatDiveImg = new Image();
partyHatDiveImg.src = '/Clipernator/sprites/enemies/PartyHat/PartyHatDive.png';

const partyHatRecoverSheet = new Image();
partyHatRecoverSheet.src = '/Clipernator/sprites/enemies/PartyHat/PartyHatRecoverSheet.png';

const waterBalloonIdleSheet = new Image();
waterBalloonIdleSheet.src = '/Clipernator/sprites/enemies/WaterBalloon/WaterBalloonIdleSheet.png';

const waterBalloonTurnSheet = new Image();
waterBalloonTurnSheet.src = '/Clipernator/sprites/enemies/WaterBalloon/WaterBalloonTurnSheet.png';

const waterBalloonShootSheet = new Image();
waterBalloonShootSheet.src = '/Clipernator/sprites/enemies/WaterBalloon/WaterBalloonShootSheet.png';

const waterBalloonIdleSheetRed = new Image();
waterBalloonIdleSheetRed.src = '/Clipernator/sprites/enemies/WaterBalloon/WaterBalloonIdleSheetRed.png';

const waterBalloonTurnSheetRed = new Image();
waterBalloonTurnSheetRed.src = '/Clipernator/sprites/enemies/WaterBalloon/WaterBalloonTurnSheetRed.png';

const waterBalloonShootSheetRed = new Image();
waterBalloonShootSheetRed.src = '/Clipernator/sprites/enemies/WaterBalloon/WaterBalloonShootSheetRed.png';


const maskSheetImg = new Image();
maskSheetImg.src = '/Clipernator/sprites/enemies/Mask/MaskSheet.png';

// Water balloon sprite sheets (mask enemy)
// All sheets: 1024×1024 per frame
const WB_IDLE_COLS   = 3;  WB_IDLE_FW   = 1024; // 3072-wide sheet
const WB_IDLE_FRAMES = 8;
const WB_TURN_COLS   = 2;  WB_TURN_FW   = 1024; // 2048-wide sheet
const WB_TURN_FRAMES = 4;
const WB_SHOOT_COLS  = 3;  WB_SHOOT_FW  = 1024; // 3072-wide sheet
const WB_SHOOT_FRAMES = 8;
const WB_FRAME_H = 1024; // same for all sheets

const giftBoxIdleSheet = new Image();
giftBoxIdleSheet.src = '/Clipernator/sprites/enemies/GiftBox/GiftBoxIdleSheet.png';

// ================================================================
// KEYBINDS
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
  glowstick:  'f',
  throwItem:  'e',
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
  glowstick:  'Glowstick / Melee',
  throwItem:  'Pick Up / Throw',
};

function loadKeybinds() {
  try {
    const saved = localStorage.getItem('clipblast_keybinds');
    if (saved) {
      const parsed = JSON.parse(saved);
      for (const action of Object.keys(KEYBIND_DEFAULTS)) {
        if (parsed[action]) KEYBINDS[action] = parsed[action];
      }
    }
  } catch(e) {}
}

function saveKeybinds() {
  try { localStorage.setItem('clipblast_keybinds', JSON.stringify(KEYBINDS)); }
  catch(e) {}
}

const KEYBINDS = { ...KEYBIND_DEFAULTS };
loadKeybinds();

function formatKey(k) {
  if (k === ' ')       return 'SPACE';
  if (k === 'Shift')   return 'SHIFT';
  if (k === 'Control') return 'CTRL';
  if (k === 'Alt')     return 'ALT';
  return k.toUpperCase();
}
