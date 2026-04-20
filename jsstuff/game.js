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
    hasClownish: false,
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
  } else {
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
  drawClippyBubble();

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

let _clippyBubbleText = "It looks like you discovered how to PAUSE! Click an item above to learn what it does.";

function drawClippyBubble() {
  const canvas = document.getElementById('clippy-bubble-canvas');
  if (!canvas) return;
  const c = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const SCALE = 3;
  const lw = Math.floor(W / SCALE), lh = Math.floor(H / SCALE);

  const off = document.createElement('canvas');
  off.width = lw; off.height = lh;
  const oc = off.getContext('2d');

  // Background fill
  oc.fillStyle = '#ffffcc';
  oc.fillRect(0, 0, lw, lh);

  // Rounded border — fill the whole canvas with padding
  const pad = 1.6;
  const radius = 30; // in low-res pixels = 12px rendered
  oc.strokeStyle = '#000000';
  oc.lineWidth = 1.5;
  oc.beginPath();
  oc.roundRect(pad, pad, lw - pad * 2 - 6, lh - pad * 2, radius);
  oc.fillStyle = '#ffffcc';
  oc.fill();
  oc.stroke();

  // Tail on right side pointing toward Clippy image
  const tailY = Math.floor(lh / 2);
  const tailX = lw - 6 - pad; // right edge of the bubble box
  // Outline triangle
  oc.beginPath();
  oc.moveTo(tailX, tailY - 4);
  oc.lineTo(tailX + 6, tailY);
  oc.lineTo(tailX, tailY + 4);
  oc.strokeStyle = '#000000';
  oc.lineWidth = 1;
  oc.stroke();
  // Fill triangle (cover the border edge)
  oc.beginPath();
  oc.moveTo(tailX + 1, tailY - 3);
  oc.lineTo(tailX + 5, tailY);
  oc.lineTo(tailX + 1, tailY + 3);
  oc.fillStyle = '#ffffcc';
  oc.fill();

  // Scale up to main canvas (pixelated for the chunky rounded corners)
  c.clearRect(0, 0, W, H);
  c.imageSmoothingEnabled = false;
  c.drawImage(off, 0, 0, lw, lh, 0, 0, W, H);

  // Text at full resolution on top — crisp
  c.fillStyle = '#000000';
  c.font = '11px "MS Sans Serif", Arial, sans-serif';
  c.textBaseline = 'top';
  const maxW = W - 28; // leave room for tail
  const words = _clippyBubbleText.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (c.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  const lineH = 14;
  const startY = Math.max(6, Math.floor((H - lines.length * lineH) / 2));
  for (let i = 0; i < lines.length; i++) {
    c.fillText(lines[i], 8, startY + i * lineH);
  }
}

function clippyExplain(itemId) {
  const tip = CLIPPY_ITEM_TIPS[itemId];
  if (tip) {
    _clippyBubbleText = tip;
    drawClippyBubble();
    const img = document.getElementById('clippy-pause-img');
    if (img) {
      img.style.transition = 'transform 0.1s';
      img.style.transform = 'rotate(-12deg) scale(1.12)';
      setTimeout(() => { img.style.transform = 'rotate(4deg) scale(1.05)'; }, 100);
      setTimeout(() => { img.style.transform = 'rotate(0deg) scale(1)'; }, 220);
    }
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
  drawClippyBubble();
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
