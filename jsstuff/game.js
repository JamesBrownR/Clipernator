// ============================================================
// CLIPBLAST: PARTY HUNTER  Game Core   
// ECS, game state, input, loop, HUD, pause, game over
// ============================================================
 
let gameRunning = false;
let animId = null;
let msgTimeout = null;
let keys = {};
let mouse = { x: CFG.W / 2, y: CFG.H / 2 };
let muzzleFlash = 0;
let meleeSwingTimer = 0;
let isPaused = false;
let lastTime = 0;

// ================================================================
// ECS CORE
// ================================================================
const ECS = {
  _nextId: 0,
  entities: new Set(),
  _comps: {},

  createEntity() {
    const id = this._nextId++;
    this.entities.add(id);
    return id;
  },
  destroyEntity(id) {
    this.entities.delete(id);
    for (const k in this._comps) this._comps[k].delete(id);
  },
  add(id, type, data) {
    if (!this._comps[type]) this._comps[type] = new Map();
    this._comps[type].set(id, data);
    return data;
  },
  get(id, type) {
    return this._comps[type] ? this._comps[type].get(id) : undefined;
  },
  has(id, type) {
    return !!(this._comps[type] && this._comps[type].has(id));
  },
  remove(id, type) {
    if (this._comps[type]) this._comps[type].delete(id);
  },
  query(...types) {
    const result = [];
    for (const id of this.entities) {
      if (types.every(t => this.has(id, t))) result.push(id);
    }
    return result;
  },
  clear() {
    this._nextId = 0;
    this.entities.clear();
    this._comps = {};
  }
};

// ── Helper ──
function playerPos(gs) {
  const ids = ECS.query('player', 'pos');
  if (!ids.length) return null;
  return ECS.get(ids[0], 'pos');
}

// ================================================================
// GAME STATE
// ================================================================
let gs = {};

function initGameState() {
  ECS.clear();

  gs = {
    score: 0, wave: 5,
    health: CFG.MAX_HEALTH, maxHealth: CFG.MAX_HEALTH,
    ammo: CFG.MAX_AMMO, maxAmmo: CFG.MAX_AMMO,
    reloading: false, reloadTimer: 0,
    invincible: 0,
    partyFreezeTimer: 0, speedBoostTimer: 0, confettiSlowTimer: 0,
    bullets: [], enemyBullets: [], particles: [], fieldItems: [], dashTrail: [],
    shakeX: 0, shakeY: 0,
    spawnTimer: 0, spawnInterval: CFG.SPAWN_INTERVAL_BASE,
    waveEnemiesLeft: 8, waveKills: 0,
    unlockedItems: [], itemCooldowns: {},
    pendingChoice: false,
    heldGiftBox: null,
    forkGrabbed: false,

   // Show opening Clippy tip on the player sprite
clippyIntroLines: [
  "It looks like you started a new game!",
  "WASD to move · Mouse to aim · Click to shoot",
  "R to reload · Shift to dash · P to pause",
  "Good luck... you'll need it.",
], 
clippyIntroTimer: 0, clippyIntroLine: 0, clippyIntroDone: false,
clippyPickupMsg: '',
clippyPickupTimer: 0,
    // Item flags
    bouncyHouse: false,
    hasDoubleCake: false, hasTripleCake: false, hasQuadCake: false,
    hasDash: false,
    dashCharges: 0, dashMaxCharges: CFG.DASH_MAX_CHARGES,
    dashCooldownTimer: 0, dashCooldownMax: CFG.DASH_COOLDOWN_FRAMES,
    dashTimer: 0, dashVx: 0, dashVy: 0,
    frozen: false,
    hasGlowsticks: false,
    glowCooldown: 0,
    hasShakeFizzlePop: false,
    sfpMeter: 0, sfpMax: 600, sfpFull: false,
    hasFlawlessBaking: true,
    flawlessThisWave: false,
    hasCursedCandles: false,
    candlesLit: 0, candleHpTimer: 0, candleRelightDelay: 0,
    hasRagingRings: false,
    ragingRingBullets: [],
    hasMirrorMaze: false,
    mirrorShards: [],
    mirrorPlayerShardTimer: 1,
    hasPopcornBucket: false, popcornKernels: [], popcornFrenzyTimer: 0,
    _kernelsCollected: 0,
    hasTightropeBoots: false,
    hasBowlingBall: false,
    bowlingBallReady: false,
    bowlingBallRegenTimer: 0,
    hasClownish: true,
    clownNoseSize: 0, clownNoseTimer: 0, clownNoseMax: 480,
    clownNoseHonkTimer: 0,
    clownConfuseActive: false,
    clownSoundWaves: [],
    speedBoostMult: CFG.SPEED_BOOST_MULT,

    // Boss
    bossId: null, bossActive: false,

    // Floor tracking
    floor: 1,
    transitioning: false,
    transitionT: 0,
    transitionDone: false,
    transitionStartW: CFG.W,
    transitionStartH: CFG.H,
    transitionEndW: 1050,
    transitionEndH: 690,

    // Tickets / prize wheel (Floor 2)
    tickets: 0,
    prizeEffect: null,
    sugarRushActive: false,
    ricochetActive: false,
    cursedSpinTimer: 0,
    drivingCar: null,
    drivingCarTimer: 0,
  };

  const pId = ECS.createEntity();
  ECS.add(pId, 'player', { invincible: 0 });
  ECS.add(pId, 'pos',    { x: worldW / 2, y: worldH / 2, angle: 0 });
  ECS.add(pId, 'vel',    { vx: 0, vy: 0 });
  gs.playerId = pId;

 //Apply difficulty chosen in intro
  if (typeof INTRO !== 'undefined') INTRO.applyDifficultyToGs(gs);
 
}

// ================================================================
// HUD / MESSAGES
// ================================================================
function updateHUD() {
  document.getElementById('score-val').textContent = gs.score;
  document.getElementById('health-bar').style.width =
    Math.max(0, (gs.health / gs.maxHealth) * 100) + '%';
  document.getElementById('health-bar').style.background =
    gs.health < gs.maxHealth * 0.3 ? '#cc0000' : '#00aa00';
  document.getElementById('health-num').textContent = Math.max(0, gs.health);
  document.getElementById('ammo-val').textContent = gs.ammo + '/' + gs.maxAmmo;
  document.getElementById('wave-val').textContent = gs.wave;

  const ticketHud = document.getElementById('ticket-hud');
  if (ticketHud) {
    ticketHud.style.display = gs.floor === 2 ? 'flex' : 'none';
    document.getElementById('ticket-val').textContent = gs.tickets || 0;
  }
}

function showMsg(txt) {
  const el = document.getElementById('msg');
  el.textContent = txt;
  el.style.opacity = '1';
  clearTimeout(msgTimeout);
  msgTimeout = setTimeout(() => { el.style.opacity = '0'; }, 1800);
}

// ================================================================
// PAUSE CLIPPY RENDERING
// ================================================================

// Track pause mouse position for Clippy eye tracking
let _pauseMouseX = 0, _pauseMouseY = 0;

// Clippy sprite images for pause menu eye tracking
const _clippyPauseImgs = {
  forward: null, upleft: null, upright: null,
  worriedleft1: null, worriedleft2: null,
  worriedright1: null, worriedright2: null,
  sweatingleft: null, focusedleft: null,
  crouchingleft: null, crouchingright: null,
};

(function loadClippyPauseSprites() {
  const defs = {
    forward:        'sprites/clippy/Clippyforward.png',
    upleft:         'sprites/clippy/Clippyupleft.png',
    upright:        'sprites/clippy/Clippyupright.png',
    worriedleft1:   'sprites/clippy/Clippyworriedleft1.png',
    worriedleft2:   'sprites/clippy/Clippyworriedleft2.png',
    worriedright1:  'sprites/clippy/Clippyworriedright1.png',
    worriedright2:  'sprites/clippy/Clippyworriedright2.png',
    sweatingleft:   'sprites/clippy/Clippysweatingleft.png',
    focusedleft:    'sprites/clippy/Clippyfocusedleft.png',
    crouchingleft:  'sprites/clippy/Clippycrouchingleft.png',
    crouchingright: 'sprites/clippy/Clippycrouchingright.png',
  };
  for (const [k, src] of Object.entries(defs)) {
    const img = new Image(); img.src = src; _clippyPauseImgs[k] = img;
  }
})();

function _getClippyDirectionSprite(clippyCanvasX, clippyCanvasY, mouseX, mouseY) {
  const dx = mouseX - clippyCanvasX, dy = mouseY - clippyCanvasY;
  const deg = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
  // 0=right 90=down 180=left 270=up
  if (deg >= 337.5 || deg < 22.5)   return _clippyPauseImgs.worriedright2;
  if (deg < 67.5)                    return _clippyPauseImgs.crouchingright;
  if (deg < 112.5)                   return _clippyPauseImgs.forward;
  if (deg < 157.5)                   return _clippyPauseImgs.focusedleft;
  if (deg < 202.5)                   return _clippyPauseImgs.crouchingleft;
  if (deg < 247.5)                   return _clippyPauseImgs.upleft;
  if (deg < 292.5)                   return _clippyPauseImgs.worriedleft1;
  return _clippyPauseImgs.upright;
}

// The Clippy canvas for the pause menu — drawn onto a separate canvas
// positioned absolutely over the pause dialog, next to stats
let _pauseClippyCanvas = null;
let _pauseBubbleCanvas = null;
let _pauseClippyCtx = null;
let _pauseClippyAnimId = null;

function _createPauseClippyCanvas() {
  if (_pauseClippyCanvas) return;

  _pauseBubbleCanvas = document.createElement('canvas');
  _pauseBubbleCanvas.width = 220;
  _pauseBubbleCanvas.height = 100;
_pauseBubbleCanvas.style.cssText = `
    position: absolute; left: 8px; top: 18px;
    width: 230px; height: 110px;
    pointer-events: none; z-index: 9; background: transparent;
`;

  _pauseClippyCanvas = document.createElement('canvas');
  _pauseClippyCanvas.width = 100;
  _pauseClippyCanvas.height = 120;
 _pauseClippyCanvas.style.cssText = `
    position: absolute; right: 10px; top: 18px;
    width: 100px; height: 120px;
    image-rendering: pixelated; pointer-events: none; z-index: 10; background: transparent;
`;
  _pauseClippyCtx = _pauseClippyCanvas.getContext('2d');

  const statsFieldset = document.querySelector('#pause-menu fieldset');
  if (statsFieldset) {
    statsFieldset.style.position = 'relative';
    statsFieldset.style.overflow = 'visible';
    statsFieldset.appendChild(_pauseBubbleCanvas);
    statsFieldset.appendChild(_pauseClippyCanvas);
  }
}

function _removePauseClippyCanvas() {
  if (_pauseClippyCanvas && _pauseClippyCanvas.parentNode)
    _pauseClippyCanvas.parentNode.removeChild(_pauseClippyCanvas);
  if (_pauseBubbleCanvas && _pauseBubbleCanvas.parentNode)
    _pauseBubbleCanvas.parentNode.removeChild(_pauseBubbleCanvas);
  _pauseClippyCanvas = null;
  _pauseBubbleCanvas = null;
  _pauseClippyCtx = null;
  if (_pauseClippyAnimId) { cancelAnimationFrame(_pauseClippyAnimId); _pauseClippyAnimId = null; }
}

function _drawPauseClippy() {
  if (!_pauseClippyCtx || !_pauseClippyCanvas) return;
  const c = _pauseClippyCtx;
  const W = _pauseClippyCanvas.width;
  const H = _pauseClippyCanvas.height;
  c.clearRect(0, 0, W, H);  // transparent — no fillRect with a color

  const rect = _pauseClippyCanvas.getBoundingClientRect();
  const canvasCX = rect.left + rect.width / 2;
  const canvasCY = rect.top + rect.height * 0.35;

  const sprite = _getClippyDirectionSprite(canvasCX, canvasCY, _pauseMouseX, _pauseMouseY);
  const imgToDraw = (sprite && sprite.complete && sprite.naturalWidth > 0) ? sprite : _clippyPauseImgs.forward;

  if (imgToDraw && imgToDraw.complete && imgToDraw.naturalWidth > 0) {
    c.drawImage(imgToDraw, 0, 0, W, H);
  }

  // Draw bubble on separate canvas
  if (_pauseBubbleCanvas && _clippyBubbleText) {
    const bc = _pauseBubbleCanvas.getContext('2d');
    const BW = _pauseBubbleCanvas.width;
    const BH = _pauseBubbleCanvas.height;
    bc.clearRect(0, 0, BW, BH);
    _drawPauseBubbleOnCanvas(bc, BW, BH);
  }
}

function _drawPauseBubbleOnCanvas(c, W, H) {
  if (!_clippyBubbleText) return;
  const pad = 9, r = 7;
  const bw = W - 28, bh = H - 14, bx = 18, by = 4;
  const tailMidY = by + bh * 0.42;
  c.clearRect(0, 0, W, H);
  c.save();
  // Bubble body with tail on LEFT side pointing toward Clippy
  c.beginPath();
  c.moveTo(bx + r, by);
  c.lineTo(bx + bw - r, by);
  c.arcTo(bx + bw, by, bx + bw, by + r, r);
  c.lineTo(bx + bw, by + bh - r);
  c.arcTo(bx + bw, by + bh, bx + bw - r, by + bh, r);
  c.lineTo(bx + r, by + bh);
  c.arcTo(bx, by + bh, bx, by + bh - r, r);
  // Left side: leave gap for tail
  c.lineTo(bx, tailMidY + 10);
  c.lineTo(bx - 14, tailMidY);   // tail tip points left toward Clippy
  c.lineTo(bx, tailMidY - 10);
  c.lineTo(bx, by + r);
  c.arcTo(bx, by, bx + r, by, r);
  c.closePath();
  c.fillStyle = '#ffffcc';
  c.shadowColor = 'rgba(0,0,0,0.15)'; c.shadowBlur = 4;
  c.shadowOffsetX = 1; c.shadowOffsetY = 1;
  c.fill();
  c.shadowColor = 'transparent'; c.shadowBlur = 0;
  c.strokeStyle = '#999977'; c.lineWidth = 1.2; c.stroke();
  c.restore();
  c.fillStyle = '#000';
  c.font = '10px "MS Sans Serif", Arial, sans-serif';
  c.textBaseline = 'top';
  const maxW = bw - pad * 2 - 4;
  const words = _clippyBubbleText.split(' ');
  const lines = []; let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (c.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  const lineH = 14, totalH = lines.length * lineH;
  const startY = by + pad + Math.max(0, (bh - totalH - pad) / 2);
  for (let i = 0; i < lines.length; i++) c.fillText(lines[i], bx + pad, startY + i * lineH);
}

function _drawPauseClippyBubble(c, W, H) {
  if (!_clippyBubbleText) return;

  const bubbleW = W + 80;
  const bubbleH = 90;
  const bubbleX = -90; // to the left of Clippy
  const bubbleY = 0;
  const tailX = W * 0.3;
  const tailY = bubbleH;
  const r = 8;

  c.save();

  // Draw bubble
  c.fillStyle = '#ffffcc';
  c.strokeStyle = '#000000';
  c.lineWidth = 1.5;

  c.beginPath();
  c.moveTo(bubbleX + r, bubbleY);
  c.lineTo(bubbleX + bubbleW - r, bubbleY);
  c.arcTo(bubbleX + bubbleW, bubbleY, bubbleX + bubbleW, bubbleY + r, r);
  c.lineTo(bubbleX + bubbleW, bubbleY + bubbleH - r);
  c.arcTo(bubbleX + bubbleW, bubbleY + bubbleH, bubbleX + bubbleW - r, bubbleY + bubbleH, r);
  // bottom right before tail
  c.lineTo(tailX + 14, bubbleY + bubbleH);
  // tail pointing down-right toward Clippy body
  c.lineTo(tailX + 7, bubbleY + bubbleH + 14);
  c.lineTo(tailX - 2, bubbleY + bubbleH);
  // rest of bottom
  c.lineTo(bubbleX + r, bubbleY + bubbleH);
  c.arcTo(bubbleX, bubbleY + bubbleH, bubbleX, bubbleY + bubbleH - r, r);
  c.lineTo(bubbleX, bubbleY + r);
  c.arcTo(bubbleX, bubbleY, bubbleX + r, bubbleY, r);
  c.closePath();

  c.fillStyle = '#ffffcc';
  c.fill();
  c.strokeStyle = '#000000';
  c.lineWidth = 1.5;
  c.stroke();

  // Text
  c.fillStyle = '#000000';
  c.font = '10px "MS Sans Serif", Arial, sans-serif';
  c.textBaseline = 'top';
  const padX = 8, padY = 8;
  const maxTextW = bubbleW - padX * 2 - 4;
  const words = _clippyBubbleText.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (c.measureText(test).width > maxTextW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  const lineH = 14;
  const totalH = lines.length * lineH;
  const startY = bubbleY + padY + Math.max(0, (bubbleH - totalH) / 2 - padY);
  for (let i = 0; i < lines.length; i++) {
    c.fillText(lines[i], bubbleX + padX, startY + i * lineH);
  }

  c.restore();
}

function _startPauseClippyLoop() {
  if (_pauseClippyAnimId) cancelAnimationFrame(_pauseClippyAnimId);
  function tick() {
    if (!isPaused) { _pauseClippyAnimId = null; return; }
    _drawPauseClippy();
    _pauseClippyAnimId = requestAnimationFrame(tick);
  }
  tick();
}

// ================================================================
// GAME OVER / PAUSE
// ================================================================
function gameOver() {
  gameRunning = false;
  cancelAnimationFrame(animId);
  draw();
  const overlay = document.getElementById('overlay');
  overlay.style.display = 'flex';
  const h1 = overlay.querySelector('h1');
  const sub = overlay.querySelector('.sub');
  const btn = document.getElementById('startBtn');
  if (h1) { h1.innerHTML = `GAME OVER<br>SCORE: ${gs.score}`; h1.style.color = '#ff3333'; h1.style.textShadow = '0 0 20px #ff3333'; }
  if (sub) sub.textContent = `WAVE ${gs.wave} · PRESS PLAY TO RETRY`;
  if (btn) btn.textContent = 'PLAY AGAIN';
}

function togglePause() {
  if (gs.pendingChoice) return;
  isPaused = !isPaused;
  if (isPaused) {
    gameRunning = false;
    cancelAnimationFrame(animId);
    document.getElementById('pause-menu').style.display = 'flex';
    renderPauseMenu();
    _createPauseClippyCanvas();
    _startPauseClippyLoop();
    clippyIdleTip();
  } else {
    _removePauseClippyCanvas();
    document.getElementById('pause-menu').style.display = 'none';
    gameRunning = true;
    lastTime = performance.now();
    loop();
  }
}

function renderPauseMenu() {
  const statsEl = document.getElementById('pause-stat-lines');
  const dmgLabel = gs.hasQuadCake ? '4x (50% dud)' : gs.hasTripleCake ? '3x (45% dud)' :
                   gs.hasDoubleCake ? '2x (40% dud)' : '1x';
  const speedMult = gs.speedBoostTimer > 0 ? (gs.speedBoostMult || CFG.SPEED_BOOST_MULT) :
                    gs.hasTightropeBoots ? 3.00 : 1;
  const speedVal  = speedMult.toFixed(2) + 'x';
  const bulletsPerShot = CFG.BULLET_COUNT + (gs.hasCursedCandles ? gs.candlesLit * 2 : 0);

  let lines = [
    `HP .............. ${Math.max(0,gs.health)} / ${gs.maxHealth}`,
    `Wave ............ ${gs.wave}`,
    `Score ........... ${gs.score}`,
    `Damage .......... ${dmgLabel}`,
    `Speed ........... ${speedVal}`,
    `Clip Size ....... ${gs.maxAmmo}`,
    `Bullets/Shot .... ${bulletsPerShot}`,
  ];
  if (gs.hasCursedCandles)  lines.push(`Candles ......... ${gs.candlesLit}/5 lit`);
  if (gs.hasFlawlessBaking) lines.push(`Flawless Wave ... ${gs.flawlessThisWave ? 'YES [ok]' : 'NO [x]'}`);
  if (gs.hasDash)           lines.push(`Dash Charges .... ${gs.dashCharges}/${gs.dashMaxCharges}`);
  if (gs.hasShakeFizzlePop) lines.push(`SFP Meter ....... ${gs.sfpFull ? 'FULL ⚡' : Math.round((gs.sfpMeter/gs.sfpMax)*100)+'%'}`);

  statsEl.textContent = lines.join('\n');

  // Items Win2k icon squares with tooltip
  const container = document.getElementById('pause-items');
  container.innerHTML = '';

  if (gs.unlockedItems.length === 0) {
    const empty = document.createElement('span');
    empty.style.cssText = 'font-size:10px; color:#666; font-family:"Microsoft Sans Serif","MS Sans Serif",Arial,sans-serif;';
    empty.textContent = '(No items yet)';
    container.appendChild(empty);
  } else {
    gs.unlockedItems.forEach(id => {
      if (id === 'doubledCake' && (gs.hasTripleCake || gs.hasQuadCake)) return;
      if (id === 'tripleCake' && gs.hasQuadCake) return;
      const def = ITEM_DEFS[id];
      if (!def) return;

      const card = document.createElement('div');
      card.className = 'pause-item-card';
      card.textContent = def.icon;

      const tip = document.createElement('div');
      tip.className = 'tip';
      tip.textContent = def.label.replace(/\n/g,' ');
      card.appendChild(tip);

      card.addEventListener('click', () => clippyExplain(id));

      container.appendChild(card);
    });
  }
}

const CLIPPY_ITEM_TIPS = {
  birthday:        "Surprise! BIRTHDAY PARTY freezes all enemies for 3 seconds.",
  cookie:          "It looks like you're slow! GOLDEN COOKIE gives you 7x speed AND reload speed for 7 seconds.",
  doubledCake:     "It looks like you want more damage! DOUBLE CAKE makes every bullet 2x damage... but 40% are duds.",
  tripleCake:      "TRIPLE CAKE = 3x damage, 45% dud chance. Worth it!",
  quadCake:        "It looks like you're a gambler! QUAD CAKE = 4x damage but half your bullets are duds. High risk!",
  bouncy:          "BOUNCY HOUSE makes bullets, enemies, AND you bounce off walls.",
  dash:            "Need to dodge? PARTY POPPER lets you SHIFT-dash through enemies. 3 charges.",
  shakeFizzlePop:  "SHAKE FIZZLE POP charges a meter. When full, you're buffed, and get hit for a massive shockwave.",
  flawlessBaking:  "It looks like you're arrogant! FLAWLESS BAKING rewards a clean wave with +2 max ammo.",
  cursedCandles:   "It looks like... you love pain! CURSED CANDLES drain 5 HP/sec but each lit candle adds +2 bullets per shot.",
  mirrorMaze:      "Bullets are flying everywhere.. MIRROR MAZE lets you redirect them. Shoot the shard!",
  popcornBucket:   "Collect 5 POPCORN KERNELS from kills for a bullet frenzy.",
  ragingRings:     "It looks like bullets keep missing! RAGING RINGS captures them to orbit you at 3x damage instead.",
  tightropeBoots:  "It looks like you want to go faster! TIGHTROPE BOOTS gives +200% move speed. Zoom.",
  clownish:        "You have a nose! CLOWNISH grows a blue nose over time. It HONKS and confuses nearby enemies.",
  bowlingBall:     "Want to bowl? Next shot fires a giant ball that pierces, bounces, and explodes on expiry.",
  paperCuts:       "PAPER CUTS makes any damaged enemy bleed 1 HP per second.",
  extraClips:      "EXTRA CLIPS gives +15% max HP and ammo, and fully heals you... it stacks!",
  clownishUpgrade: "Placeholder! LOL...",
  popcornUpgrade:  "It looks like you want bigger frenzies! MEGA POPCORN only needs 3 kernels and lasts 6 seconds.",
};

let _clippyBubbleText = "It looks like you discovered how to PAUSE! Click an item to learn what it does.";

// Legacy canvas kept for compatibility (hidden)
function drawClippyBubble() {
  // No-op — bubble is now drawn on the Clippy canvas directly
}

function clippyExplain(itemId) {
  const tip = CLIPPY_ITEM_TIPS[itemId];
  if (tip) {
    _clippyBubbleText = tip;
  }
}

// Random idle Clippy tips shown in pause menu
const CLIPPY_IDLE_TIPS = [
  "It looks like you're paused! The enemies are waiting... patiently?",
  "Did you know? Confused enemies deal 3x damage to other enemies!",
  "Need help? Try clicking an item above to learn about it.",
  "It looks like the Ringmaster is nearby! Stay away... he buffs all his friends.",
  "Did you know? Glowstick reflects bullets back as explosives with no cooldown on success!",
  "SHIFT dashes through enemies and damages them.",
  "Did you know? Gift boxes can be grabbed with E and thrown at enemies!",
  "Each candle you blow out makes it more aggressive.",
  "Did you know? Bowling balls pierce ALL enemies and explode when they expire!",
  "It looks like you're doing great! ...probably.",
];

let _clippyIdleIdx = 0;
function clippyIdleTip() {
  _clippyBubbleText = CLIPPY_IDLE_TIPS[_clippyIdleIdx % CLIPPY_IDLE_TIPS.length];
  _clippyIdleIdx++;
}

// ================================================================
// KEYBIND SCREEN
// ================================================================
let _listeningAction = null;
let _keybindKeyHandler = null;

function openKeybindScreen() {
  document.getElementById('pause-menu').style.display = 'none';
  const screen = document.getElementById('keybind-screen');
  screen.style.display = 'flex';
  renderKeybindRows();
}

function closeKeybindScreen() {
  document.getElementById('keybind-screen').style.display = 'none';
  document.getElementById('pause-menu').style.display = 'flex';
  cancelKeybindListen();
}

function renderKeybindRows() {
  const container = document.getElementById('keybind-rows');
  container.innerHTML = '';

  for (const action of Object.keys(KEYBIND_DEFAULTS)) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; gap:12px; font-family:"Microsoft Sans Serif","MS Sans Serif",Arial,sans-serif;';

    const label = document.createElement('span');
    label.style.cssText = 'font-size:11px; color:#000; min-width:150px;';
    label.textContent = KEYBIND_LABELS[action];

    const btn = document.createElement('button');
    btn.id = `kb-btn-${action}`;
    btn.style.cssText = `
      font-family:'Microsoft Sans Serif','MS Sans Serif',Arial,sans-serif;
      font-size:11px; color:#000; background:#d4d0c8;
      border-top:2px solid #fff; border-left:2px solid #fff;
      border-right:2px solid #404040; border-bottom:2px solid #404040;
      padding:2px 10px; cursor:pointer; min-width:80px; text-align:center;
    `;
    btn.textContent = formatKey(KEYBINDS[action]);
    btn.dataset.action = action;
    btn.addEventListener('click', () => startKeybindListen(action));

    row.appendChild(label);
    row.appendChild(btn);
    container.appendChild(row);
  }
}

function startKeybindListen(action) {
  cancelKeybindListen();
  _listeningAction = action;

  const btn = document.getElementById(`kb-btn-${action}`);
  if (btn) {
    btn.style.background = '#000080';
    btn.style.color = '#fff';
    btn.textContent = '...';
  }

  const hint = document.getElementById('keybind-listening-hint');
  hint.style.opacity = '1';

  _keybindKeyHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.key === 'Escape') { cancelKeybindListen(); return; }

    const newKey = e.key;
    for (const other of Object.keys(KEYBINDS)) {
      if (other !== action && KEYBINDS[other] === newKey) {
        KEYBINDS[other] = KEYBINDS[action];
        const otherBtn = document.getElementById(`kb-btn-${other}`);
        if (otherBtn) otherBtn.textContent = formatKey(KEYBINDS[other]);
      }
    }
    KEYBINDS[action] = newKey;
    saveKeybinds();
    cancelKeybindListen();
    renderKeybindRows();
  };

  document.addEventListener('keydown', _keybindKeyHandler, { capture: true });
}

// UI button click sounds
(function() {
  const _clickAudio = new Audio('sounds/soundeffects/opening/click.mp3');
  function playUIClick() {
    try {
      const a = _clickAudio.cloneNode();
      a.volume = 0.5;
      a.play().catch(() => {});
    } catch(e) {}
  }
  // Attach to all Win2k-style buttons in the HUD and wrapper
  document.addEventListener('click', function(e) {
    const el = e.target;
    // HUD titlebar buttons, w2k-btn class, pause menu buttons, keybind buttons
    if (
      el.closest('#hud-controls') ||
      el.classList.contains('w2k-btn') ||
      el.closest('#pause-menu button') ||
      el.closest('#keybind-screen button') ||
      el.id === 'startBtn' ||
      el.id === 'skip-btn' ||
      el.id === 'floor-btn' ||
      el.id === 'keybind-back-btn' ||
      el.id === 'keybind-reset-btn'
    ) {
      playUIClick();
    }
  }, true); // capture phase so it fires before game click handlers
})();

function cancelKeybindListen() {
  if (_keybindKeyHandler) {
    document.removeEventListener('keydown', _keybindKeyHandler, { capture: true });
    _keybindKeyHandler = null;
  }
  _listeningAction = null;
  const hint = document.getElementById('keybind-listening-hint');
  if (hint) hint.style.opacity = '0';
}

document.getElementById('keybind-back-btn').addEventListener('click', closeKeybindScreen);
document.getElementById('keybind-reset-btn').addEventListener('click', () => {
  for (const k of Object.keys(KEYBIND_DEFAULTS)) KEYBINDS[k] = KEYBIND_DEFAULTS[k];
  saveKeybinds();
  renderKeybindRows();
  cancelKeybindListen();
});

// ================================================================
// GAME LOOP
// ================================================================
function loop(timestamp = 0) {
  if (!gameRunning) return;
  lastTime = timestamp;
  update();
  draw();
  animId = requestAnimationFrame(loop);
}

function startGame() {
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('item-choice').style.display = 'none';
  _doStartGame();
}

   function _doStartGame() {
     gameRunning = true;
     isPaused = false;
     muzzleFlash = 0;
     meleeSwingTimer = 0;
     initGameState();
     updateHUD();
     lastTime = performance.now();
     loop();
   }

function tryPickUpGiftBox() {
  if (gs.heldGiftBox !== null) {
    throwGiftBox();
    return;
  }
  for (const id of ECS.query('enemy', 'pos', 'ai')) {
    const type = ECS.get(id, 'enemy').type;
    if (type !== 'giftBox') continue;
    const epos = ECS.get(id, 'pos');
    const ppos = ECS.get(gs.playerId, 'pos');
    if (Math.hypot(epos.x - ppos.x, epos.y - ppos.y) < 48) {
      gs.heldGiftBox = id;
      ECS.get(id, 'ai').heldByPlayer = true;
      ECS.get(id, 'vel').vx = 0;
      ECS.get(id, 'vel').vy = 0;
      showMsg('GIFT BOX GRABBED! RIGHT-CLICK TO THROW!');
      return;
    }
  }
}

function throwGiftBox() {
  if (gs.heldGiftBox === null) return;
  const id = gs.heldGiftBox;
  if (!ECS.has(id, 'pos')) { gs.heldGiftBox = null; return; }
  const ai  = ECS.get(id, 'ai');
  const vel = ECS.get(id, 'vel');
  ai.heldByPlayer = false;
  ai.thrown = true;
  gs.heldGiftBox = null;
  const epos = ECS.get(id, 'pos');
  const dx = mouse.x - epos.x, dy = mouse.y - epos.y;
  const dist = Math.hypot(dx, dy) || 1;
  vel.vx = (dx / dist) * 9;
  vel.vy = (dy / dist) * 9;
  showMsg('GIFT BOX THROWN!');
}

// ================================================================
// INPUT
// ================================================================
canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  if (!gameRunning) return;
  if (gs.hasGlowsticks) { swingGlowsticks(); return; }
  tryPickUpGiftBox();
});

document.addEventListener('keydown', e => {
  if (document.getElementById('keybind-screen').style.display === 'flex') return;

  if (e.key === KEYBINDS.pause) {
    togglePause();
    return;
  }

  if (isPaused) {
    if (e.key === 'Escape') {
      _removePauseClippyCanvas();
      document.getElementById('pause-menu').style.display = 'none';
      isPaused = false;
      gameRunning = false;
      document.getElementById('overlay').style.display = 'flex';
    }
    return;
  }

  keys[e.key] = true;

  if (!gameRunning) return;

  if (e.key === KEYBINDS.reload)     { startReload(); }
  if (e.key === KEYBINDS.prizeWheel) { spinPrizeWheel(); e.preventDefault(); }
  if (e.key === KEYBINDS.dash)       { tryDash(); e.preventDefault(); }
  if (e.key === KEYBINDS.glowstick)  { swingGlowsticks(); e.preventDefault(); }
});

document.addEventListener('keyup', e => { keys[e.key] = false; });

canvas.addEventListener('click', () => { if (gameRunning) shoot(); });

// Track mouse globally for pause Clippy eye direction
document.addEventListener('mousemove', e => {
  _pauseMouseX = e.clientX;
  _pauseMouseY = e.clientY;
});

// ================================================================
// BUTTON LISTENERS
// ================================================================
document.getElementById('startBtn').addEventListener('click', startGame);

document.getElementById('floor-btn').addEventListener('click', () => {
  document.getElementById('floor-transition').style.display = 'none';
  gs.floor = 2;
  worldW = 1050;
  worldH = 690;
  renderScale = CFG.W / worldW;
  unlockGlowsticks();
  trySpawnFieldItems();
  showMsg('WELCOME TO THE BIG TOP!');
  const hint = document.getElementById('bottom-hint');
  if (hint) hint.textContent = `WASD:MOVE | MOUSE:AIM | CLICK:SHOOT | ${formatKey(KEYBINDS.reload)}:RELOAD | SHIFT:DASH | ${formatKey(KEYBINDS.prizeWheel)}:PRIZE WHEEL (3 TICKETS)`;
  updateHUD();
  gameRunning = true;
  loop();
});

// ================================================================
// ITEM CHOICE (uses Win2k card style from index.html CSS)
// ================================================================
function offerItemChoice() {
  gs.pendingChoice = true; gameRunning = false; cancelAnimationFrame(animId); draw();
  const choiceEl = document.getElementById('item-choice');
  const cardsEl  = document.getElementById('item-cards');
  cardsEl.innerHTML = '';

  const floorPool = gs.floor === 2 ? FLOOR2_ITEM_IDS : ALL_ITEM_IDS;
  let floorAvailable = floorPool.filter(id => {
    if (id==='doubledCake' && (gs.hasTripleCake||gs.hasQuadCake)) return false;
    if (id==='tripleCake'  && (!gs.hasDoubleCake||(gs.hasTripleCake||gs.hasQuadCake))) return false;
    if (id==='quadCake'    && (!gs.hasTripleCake||gs.hasQuadCake)) return false;
    return !gs.unlockedItems.includes(id);
  });
  const upgradePool = [];
  if (gs.hasClownish && !gs.hasClownishUpgrade)   upgradePool.push('clownishUpgrade');
  if (gs.hasPopcornBucket && !gs.hasPopcornUpgrade) upgradePool.push('popcornUpgrade');
  floorAvailable = [...floorAvailable, ...upgradePool];
  const generalAvailable = GENERAL_ITEM_IDS.filter(id => !gs.unlockedItems.includes(id));

  let offered = [], fi = 0, gi = 0;
  const shuffledFloor   = shuffle(floorAvailable);
  const shuffledGeneral = shuffle(generalAvailable);
  const slotCount = gs.floor === 2 ? 4 : 3;

  for (let slot = 0; slot < slotCount; slot++) {
    const useGeneral = generalAvailable.length > 0 && gi < shuffledGeneral.length && Math.random() < 0.20;
    if (useGeneral)                       offered.push(shuffledGeneral[gi++]);
    else if (fi < shuffledFloor.length)   offered.push(shuffledFloor[fi++]);
    else if (gi < shuffledGeneral.length) offered.push(shuffledGeneral[gi++]);
  }
  offered = [...new Set(offered)].slice(0, slotCount);

  for (const id of offered) {
    const def     = ITEM_DEFS[id];
    const isOwned = gs.unlockedItems.includes(id);
    const card    = document.createElement('div');
    card.className = `item-card${isOwned ? ' already-owned' : ''}`;

    card.innerHTML = `
      <div class="ic-icon">${def.icon}</div>
      <div class="ic-name">${def.label.replace(/\n/g,'<br>')}</div>
      <div class="ic-desc">${def.desc.replace(/\n/g,'<br>')}${isOwned ? '<br><i>(owned)</i>' : ''}</div>
    `;

 if (!isOwned) {
  card.addEventListener('click', () => {
    gs.unlockedItems.push(id);
    def.effect(gs);
    choiceEl.style.display = 'none';
    gs.pendingChoice = false;
    gameRunning = true;
    trySpawnFieldItems();
    updateHUD();
    // Clippy pickup tip
    if (typeof CLIPPY_PICKUP_TIPS !== 'undefined' && CLIPPY_PICKUP_TIPS[id]) {
      gs.clippyPickupMsg = CLIPPY_PICKUP_TIPS[id];
      gs.clippyPickupTimer = 300;
    }
    loop();
  });
}
    cardsEl.appendChild(card);
  }

  choiceEl.style.display = 'flex';
  const skipBtn  = document.getElementById('skip-btn');
  const allOwned = offered.length === 0 || offered.every(id => gs.unlockedItems.includes(id));
  skipBtn.style.display = allOwned ? 'block' : 'none';
  skipBtn.onclick = () => {
    choiceEl.style.display = 'none';
    gs.pendingChoice = false;
    gameRunning = true;
    trySpawnFieldItems();
    updateHUD();
    loop();
  };
}

setInterval(() => {
  if (typeof gs !== 'undefined' && gs && gs.floor === 2 && gameRunning) updateHUD();
}, 300);

// Auto-start intro immediately when the page loads — no Play button needed
window.addEventListener('load', () => {
  if (typeof INTRO !== 'undefined' && !window._introPlayed) {
    window._introPlayed = true;
    document.getElementById('overlay').style.display = 'none';
    INTRO.start(() => {
      _doStartGame();
    });
  }
});
