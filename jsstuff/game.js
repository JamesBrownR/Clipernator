// ============================================================
// CLIPBLAST: PARTY HUNTER — Game Core
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
    score: 0, wave: 10,
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
    flawlessThisWave: true,
    hasCursedCandles: false,
    candlesLit: 0, candleHpTimer: 0, candleRelightDelay: 0,
    hasInfernoRounds: true,
    hasMirrorMaze: true,
    hasPopcornBucket: false, popcornKernels: [], popcornFrenzyTimer: 0,
    _kernelsCollected: 0,
    hasFunhouseDistortion: true,
    hasTightropeBoots: false,
    knockingPinsActive: false, knockingPinsTimer: 0,
    hasClownish: true,
    clownNoseSize: 0, clownNoseTimer: 0, clownNoseMax: 480,
    clownConfuseActive: false,
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
  document.getElementById('health-num').textContent = Math.max(0, gs.health);
  document.getElementById('ammo-val').textContent = gs.ammo + '/' + gs.maxAmmo;
  document.getElementById('wave-val').textContent = gs.wave;

  const ticketHud = document.getElementById('ticket-hud');
  if (ticketHud) {
    ticketHud.style.display = gs.floor === 2 ? 'inline' : 'none';
    document.getElementById('ticket-val').textContent = gs.tickets || 0;
  }

  const f2 = gs.floor === 2;
  const t = Date.now() / 600;
  const circus = f2 ? ['#ff2200','#ff6600','#ffcc00','#ff6600'][Math.floor(t) % 4] : null;
  const primary   = f2 ? circus : 'var(--green)';
  const glow1     = f2 ? circus : 'var(--green2)';
  const glowRgba  = f2 ? 'rgba(255,80,0,0.15)'  : 'rgba(0,255,100,0.1)';
  const insetRgba = f2 ? 'rgba(255,60,0,0.06)'  : 'rgba(0,255,100,0.04)';

  const wrapper = document.getElementById('wrapper');
  const hud     = document.getElementById('hud');
  const bot     = document.getElementById('bottom-bar');
  wrapper.style.border    = `3px solid ${primary}`;
  wrapper.style.boxShadow = `0 0 30px ${glow1}, 0 0 60px ${glowRgba}, inset 0 0 30px ${insetRgba}`;
  hud.style.borderBottom  = `3px solid ${primary}`;
  bot.style.borderTop     = `3px solid ${primary}`;
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
  overlay.querySelector('h1').innerHTML = `GAME OVER<br>SCORE: ${gs.score}`;
  overlay.querySelector('.sub').textContent = `WAVE ${gs.wave} · PRESS PLAY TO RETRY`;
  overlay.querySelector('h1').style.color = '#ff3333';
  overlay.querySelector('h1').style.textShadow = '0 0 20px #ff3333';
  document.getElementById('startBtn').textContent = 'PLAY AGAIN';
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
  const dmg = gs.hasQuadCake ? 4 : gs.hasTripleCake ? 3 : gs.hasDoubleCake ? 2 : 1;
  const dmgLabel = gs.hasQuadCake ? '4x (50% dud)' : gs.hasTripleCake ? '3x (45% dud)' :
                   gs.hasDoubleCake ? '2x (40% dud)' : '1x';
  const speedMult = gs.speedBoostTimer > 0 ? (gs.speedBoostMult || CFG.SPEED_BOOST_MULT) : 1;
  const speedVal  = (CFG.PLAYER_SPEED * speedMult).toFixed(1);
  const bulletsPerShot = CFG.BULLET_COUNT + (gs.hasCursedCandles ? gs.candlesLit * 2 : 0);

  let statLines = [
    `HP .............. ${Math.max(0, gs.health)} / ${gs.maxHealth}`,
    `WAVE ............ ${gs.wave}`,
    `SCORE ........... ${gs.score}`,
    `DAMAGE .......... ${dmgLabel}`,
    `SPEED ........... ${speedVal}${speedMult > 1 ? ' (BOOSTED)' : ''}`,
    `CLIP SIZE ....... ${gs.maxAmmo}`,
    `BULLETS/SHOT .... ${bulletsPerShot}`,
  ];
  if (gs.hasCursedCandles)  statLines.push(`CANDLES ......... ${gs.candlesLit}/5 LIT`);
  if (gs.hasFlawlessBaking) statLines.push(`FLAWLESS WAVE ... ${gs.flawlessThisWave ? 'YES ✓' : 'NO ✗'}`);
  if (gs.hasDash)           statLines.push(`DASH CHARGES .... ${gs.dashCharges}/${gs.dashMaxCharges}`);
  if (gs.hasShakeFizzlePop) statLines.push(`SFP METER ....... ${gs.sfpFull ? 'FULL! ⚡' : Math.round((gs.sfpMeter / gs.sfpMax) * 100) + '%'}`);
  statsEl.innerHTML = statLines.join('<br>');

  const container = document.getElementById('pause-items');
  container.innerHTML = '';

  if (gs.unlockedItems.length === 0) {
    const empty = document.createElement('div');
    empty.style.color = '#555';
    empty.style.fontSize = '8px';
    empty.textContent = '(No items unlocked yet)';
    container.appendChild(empty);
  } else {
    gs.unlockedItems.forEach(id => {
      if (id === 'doubledCake' && (gs.hasTripleCake || gs.hasQuadCake)) return;
      if (id === 'tripleCake' && gs.hasQuadCake) return;
      const def = ITEM_DEFS[id];
      if (!def) return;

      const card = document.createElement('div');
      card.style.cssText = `
        position:relative; width:54px; height:54px;
        border:1px solid #00cc44; background:#001a10;
        display:flex; align-items:center; justify-content:center;
        font-size:22px; cursor:default;
        box-shadow:0 0 8px rgba(0,255,100,0.2);
      `;
      if (id === 'doubledCake')    { card.style.borderColor='#4488ff';  card.style.background='#001133'; }
      else if (id === 'tripleCake') { card.style.borderColor='#cc44ff'; card.style.background='#220022'; }
      else if (id === 'quadCake')   { card.style.borderColor='#ff3333'; card.style.background='#220000'; }
      else if (id === 'cursedCandles') { card.style.borderColor='#ff8800'; card.style.background='#1a0a00'; }

      card.textContent = def.icon;

      // Tooltip on hover
      const tip = document.createElement('div');
      tip.style.cssText = `
        display:none; position:absolute; bottom:calc(100% + 6px); left:50%;
        transform:translateX(-50%);
        background:#001a10; border:1px solid #00cc44;
        padding:8px 10px; white-space:nowrap; z-index:99;
        font-family:'Press Start 2P',monospace; font-size:6px;
        color:var(--green); line-height:1.9; text-align:left;
        box-shadow:0 0 12px rgba(0,255,100,0.3);
        pointer-events:none;
      `;
      tip.innerHTML = `<span style="color:var(--yellow)">${def.label.replace(/\n/g,' ')}</span><br>${def.desc.replace(/\n/g,'<br>')}`;
      card.appendChild(tip);
      card.addEventListener('mouseenter', () => { tip.style.display = 'block'; });
      card.addEventListener('mouseleave', () => { tip.style.display = 'none'; });

      container.appendChild(card);
    });
  }

  // Keybind button
  let kbBtn = document.getElementById('pause-keybind-btn');
  if (!kbBtn) {
    kbBtn = document.createElement('button');
    kbBtn.id = 'pause-keybind-btn';
    kbBtn.style.cssText = `
      font-family:'Press Start 2P',monospace; font-size:8px;
      color:#000; background:var(--green); border:none;
      padding:10px 22px; cursor:pointer;
      box-shadow:3px 3px 0 var(--green2); margin-top:14px; letter-spacing:1px;
    `;
    kbBtn.textContent = 'KEYBINDS';
    kbBtn.addEventListener('click', openKeybindScreen);
    document.getElementById('pause-menu').appendChild(kbBtn);
  }
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
    row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; gap:24px;';

    const label = document.createElement('span');
    label.style.cssText = 'font-size:7px; color:var(--green); letter-spacing:1px;';
    label.textContent = KEYBIND_LABELS[action];

    const btn = document.createElement('button');
    btn.id = `kb-btn-${action}`;
    btn.style.cssText = `
      font-family:'Press Start 2P',monospace; font-size:7px;
      color:var(--yellow); background:#002200; border:1px solid var(--gray);
      padding:5px 12px; cursor:pointer; min-width:80px; text-align:center;
      letter-spacing:1px; transition:border-color 0.15s, color 0.15s;
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

  // Highlight the button being remapped
  const btn = document.getElementById(`kb-btn-${action}`);
  if (btn) {
    btn.style.color = '#ff4400';
    btn.style.borderColor = '#ff4400';
    btn.textContent = '...';
  }

  const hint = document.getElementById('keybind-listening-hint');
  hint.style.opacity = '1';

  _keybindKeyHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      cancelKeybindListen();
      return;
    }

    const newKey = e.key;

    // If another action already uses this key, swap them
    for (const other of Object.keys(KEYBINDS)) {
      if (other !== action && KEYBINDS[other] === newKey) {
        KEYBINDS[other] = KEYBINDS[action]; // swap
        const otherBtn = document.getElementById(`kb-btn-${other}`);
        if (otherBtn) otherBtn.textContent = formatKey(KEYBINDS[other]);
      }
    }

    KEYBINDS[action] = newKey;
    saveKeybinds();

    cancelKeybindListen();
    renderKeybindRows(); // full re-render to reflect all changes cleanly
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
  const overlay = document.getElementById('overlay');
  overlay.querySelector('h1').innerHTML = 'CLIPBLAST<br>PARTY HUNTER';
  overlay.querySelector('h1').style.color = 'var(--green)';
  overlay.querySelector('h1').style.textShadow = '0 0 20px var(--green), 0 0 40px var(--green2)';
  overlay.querySelector('.sub').innerHTML = 'A PAPERCLIP. A SHOTGUN.<br>AN ETERNAL CRAVING FOR BIRTHDAY PARTIES.';
  document.getElementById('startBtn').textContent = 'PLAY GAME';
  gameRunning = true;
  isPaused = false;
  muzzleFlash = 0;
  meleeSwingTimer = 0;
  initGameState();
  updateHUD();
  loop();
}

function tryPickUpGiftBox() {
  const ppos = ECS.get(gs.playerId, 'pos');
  if (gs.heldGiftBox !== null) {
    throwGiftBox();
    return;
  }
  for (const id of ECS.query('enemy', 'pos', 'ai')) {
    const type = ECS.get(id, 'enemy').type;
    if (type !== 'giftBox') continue;
    const epos = ECS.get(id, 'pos');
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

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - rect.left) / renderScale;
  mouse.y = (e.clientY - rect.top)  / renderScale;
});

document.addEventListener('keydown', e => {
  // Keybind screen intercepts its own keys via capture listener — don't handle here
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

// Animate circus border on floor 2
setInterval(() => { if (gs && gs.floor === 2) updateHUD(); }, 300);
