// ============================================================
// CLIPBLAST: PARTY HUNTER — Systems    
// ============================================================ 

const CLIPPY_PICKUP_TIPS = {
  birthday:        "It looks like everyone stopped moving! Enjoy the party while it lasts.",
  cookie:          "7 times the speed AND reload? I calculated that. It took me 0.3 seconds.",
  doubledCake:     "40% of your bullets are now completely useless. Statistically speaking, I'm helping.",
  tripleCake:      "3x damage! The bad news is 45% of your shots are duds. The good news is I'm not a dud.",
  quadCake:        "Coin flip. I hope you know what you're doing.",
  bouncy:          "Boing! Everything bounces now. Including the consequences of your decisions.",
  dash:            "It looks like you're in a hurry! SHIFT to dash. You'll thank me when there are 12 enemies.",
  shakeFizzlePop:  "Don't. Get. Hit. I have never been hit in my life. I am a paperclip.",
  flawlessBaking:  "It looks like you want more ammo! Simply don't take damage. Simple.",
  cursedCandles:   "You're killing me to get more bullets. Totally fine. I'm fine.",
  mirrorMaze:      "Shoot the diamond thing. It will redirect bullets at enemies... hopefully.",
  popcornBucket:   "Collect popcorn... from corpses... for a frenzy. This is normal.",
  ragingRings:     "It looks like your bullets keep missing! Now they orbit you instead. Problem solved.",
  tightropeBoots:  "200% speed boost. Try not to run into a wall... it hurts.",
  clownish:        "It looks like you grew a nose! It honks. Enemies (and me) find this deeply unsettling.",
  bowlingBall:     "STRIKE! The next shot is a giant bowling ball. It pierces. It bounces. It judges.",
  paperCuts:       "Damaged enemies now bleed 1 HP per second. Every cut counts.",
  extraClips:      "It looks like you needed more HP AND ammo! Full heal included. You're welcome.",
  clownishUpgrade: "Bigger honk. Wider waves. More confusion. I have no further comment.",
  popcornBowl:  "3 kernels instead of 5, and the frenzy lasts longer. Now THAT'S a deal.",
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { 
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]; 
  }
  return a;  
}

function spawnParticles(x, y, color, n = 8) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 4;
    gs.particles.push({ x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, life: 28, maxLife: 28, color, size: 3 + Math.random()*4 });
  }
}

function spawnPartyParticles(x, y) {
  const colors = ['#ff69b4','#ffdd00','#00ff66','#ff4444','#88aaff','#ffffff','#ffaa00','#ff88cc'];
  for (let i = 0; i < 60; i++) {
    const a = Math.random()*Math.PI*2, sp = 2 + Math.random()*9;
    gs.particles.push({ x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, life: 90, maxLife: 90, color: colors[i%colors.length], size: 4+Math.random()*7 });
  }
}

function angleDiff(a, b) {
  let diff = (a - b + Math.PI) % (Math.PI*2) - Math.PI;
  return Math.abs(diff);
}

function baseBulletDamage() {
  if (gs.hasQuadCake)   return 4;
  if (gs.hasTripleCake) return 3;
  if (gs.hasDoubleCake) return 2;
  return 1;
}

function gunMuzzlePos() {
  const tipDist = 90 * 0.68;
  return { x: gunX + Math.cos(gunAngle)*tipDist, y: gunY + Math.sin(gunAngle)*tipDist };
}

function detonateExplosiveBullet(b, hitX, hitY) {
  const EXPLODE_RADIUS = 90;
  const EXPLODE_DMG    = (b.damageMult || 1) * 3;
  spawnPartyParticles(hitX, hitY);
  spawnParticles(hitX, hitY, '#00ff88', 20);
  spawnParticles(hitX, hitY, '#ffffff', 12);
  gs.shakeX = 18; gs.shakeY = 18;
  gs.glowExplosionX = hitX; gs.glowExplosionY = hitY; gs.glowExplosionTimer = 10;
  const toKill = [];
  for (const eid of ECS.query('enemy','pos','hp')) {
  const eai = ECS.get(eid,'ai');
  if (eai && eai.criticalMassImmune) continue;
    const epos = ECS.get(eid,'pos'), ehp = ECS.get(eid,'hp');
    if (Math.hypot(epos.x-hitX, epos.y-hitY) < EXPLODE_RADIUS) {
      ehp.hp -= EXPLODE_DMG; ehp.hitFlash = 14;
      spawnParticles(epos.x, epos.y, '#00ff88', 8);
      if (ehp.hp <= 0) toKill.push(eid);
    }
  }
 for (const eid of toKill) {
    if (!ECS.has(eid, 'pos')) continue;
    const epos = ECS.get(eid,'pos');
    const killedType = ECS.get(eid, 'enemy')?.type;  // read BEFORE destroy
    if (epos) spawnParticles(epos.x, epos.y, '#ff2222', 18);
    ECS.destroyEntity(eid);
    gs.score += Math.round(15*gs.wave); gs.waveKills++;
    tryDropTicket(); gs.health = Math.min(gs.maxHealth, gs.health+CFG.HEALTH_REGEN); updateHUD();
    if (killedType === 'cakeBoss' || killedType === 'boss2') handleBossDeath(eid);
  }
  if (toKill.length > 0) checkWave();
  b.life = 0;
}

function triggerSFPHit() {
  if (!gs.hasShakeFizzlePop) return;
  if (gs.sfpFull) {
    const ppos = ECS.get(gs.playerId,'pos');
    const shockDmg = baseBulletDamage()*5;
    for (const id of ECS.query('enemy','pos','hp','vel')) {
      const epos=ECS.get(id,'pos'), ehp=ECS.get(id,'hp'), evel=ECS.get(id,'vel');
      const dx=epos.x-ppos.x, dy=epos.y-ppos.y, dist=Math.hypot(dx,dy);
      if (dist < 400) {
        ehp.hp -= shockDmg; ehp.hitFlash = 16;
        const nd=dist>1?dist:1;
        evel.vx += (dx/nd)*12; evel.vy += (dy/nd)*12;
        spawnParticles(epos.x, epos.y, '#ff6600', 10);
        if (ehp.hp <= 0) {
          spawnParticles(epos.x, epos.y, '#ff2222', 18);
          ECS.destroyEntity(id);
          gs.score += Math.round(10*gs.wave); gs.waveKills++;
          tryDropTicket(); gs.health=Math.min(gs.maxHealth,gs.health+CFG.HEALTH_REGEN); updateHUD();
        }
      }
    }
    spawnPartyParticles(ppos.x, ppos.y);
    showMsg('SHOCKWAVE RELEASE!!!');
    setTimeout(() => checkWave(), 0);
  }
  gs.sfpMeter = 0; gs.sfpFull = false;
}

function unlockGlowsticks() {
  if (gs.hasGlowsticks) return;
  gs.hasGlowsticks = true;
  gs.unlockedItems.push('glowsticks');
  showMsg('GLOWSTICKS UNLOCKED! [F] OR RIGHT-CLICK TO SWING & REFLECT — REFLECTED SHOTS EXPLODE!');
  updateHUD();
}

function swingGlowsticks() {
  if (!gs.hasGlowsticks || gs.glowCooldown > 0) return;

  // Activate the melee window — cooldown only applied on miss
  meleeSwingTimer = CFG.MELEE_SWING_FRAMES;
  gs.meleeActiveTimer = CFG.MELEE_ACTIVE_FRAMES;
  gs.meleeDidReflect = false;
}

function tickMeleeWindow() {
  if (!gs.meleeActiveTimer || gs.meleeActiveTimer <= 0) return;
  gs.meleeActiveTimer--;

  const ppos = ECS.get(gs.playerId, 'pos');
  const meleeDmg = baseBulletDamage() * 3;

  // Box check: bullet must be within MELEE_RANGE AND in front of player (dot > 0.3)
  let didReflect = false;
  for (let i = gs.enemyBullets.length - 1; i >= 0; i--) {
    const eb = gs.enemyBullets[i];
    const dx = eb.x - ppos.x, dy = eb.y - ppos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > CFG.MELEE_RANGE) continue;
    // Must be in front half (dot product with gun facing)
    const dot = (dx / dist) * Math.cos(gunAngle) + (dy / dist) * Math.sin(gunAngle);
    if (dot < 0.1) continue;

    // Reflect it
    const isArc = eb.isArcBall;
    if (isArc) {
      const targetX = mouse.x, targetY = mouse.y;
      const GRAVITY = 0.15;
      const horizDist = Math.hypot(targetX - eb.x, targetY - eb.y);
      const HANG_TIME = Math.max(25, Math.min(55, horizDist / 10));
      gs.bullets.push({
        x: eb.x, y: eb.y,
        vx: (targetX - eb.x) / HANG_TIME,
        vy: -HANG_TIME * GRAVITY * 0.5,
        vyHoriz: (targetY - eb.y) / HANG_TIME,
        gravity: GRAVITY,
        angle: Math.atan2(targetY - eb.y, targetX - eb.x),
        life: HANG_TIME + 30, maxLife: HANG_TIME + 30,
        damageMult: baseBulletDamage() * 2,
        isDud: false, isReflected: true, isExplosive: true,
        isArcBall: true, isMirrorArc: true,
        targetX, targetY,
        startX: eb.x, startY: eb.y,
        shadowX: eb.x, shadowY: targetY,
        sizeScale: eb.sizeScale || 1.0,
      });
    } else {
      const reflectAngle = Math.atan2(mouse.y - eb.y, mouse.x - eb.x);
      const reflectSpeed = Math.max(8, Math.hypot(eb.vx, eb.vy) * 2.0);
      gs.bullets.push({
        x: eb.x, y: eb.y,
        vx: Math.cos(reflectAngle) * reflectSpeed,
        vy: Math.sin(reflectAngle) * reflectSpeed,
        angle: reflectAngle,
        life: CFG.BULLET_LIFE + 20, maxLife: CFG.BULLET_LIFE + 20,
        damageMult: baseBulletDamage() * 2,
        isDud: false, isReflected: true, isExplosive: true,
      });
    }
    gs.enemyBullets.splice(i, 1);
    spawnParticles(eb.x, eb.y, '#00ff88', 8);
    didReflect = true;

  } // Reflect bowling balls back as explosive shots
  for (let bi = gs.bullets.length - 1; bi >= 0; bi--) {
    const b = gs.bullets[bi];
    if (!b.isBowlingBall) continue;
    const dx = b.x - ppos.x, dy = b.y - ppos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > CFG.MELEE_RANGE) continue;
    const dot = (dx/dist)*Math.cos(gunAngle) + (dy/dist)*Math.sin(gunAngle);
    if (dot < 0.1) continue;
    // Redirect toward cursor as explosive
    const reflectAngle = Math.atan2(mouse.y - b.y, mouse.x - b.x);
    b.vx = Math.cos(reflectAngle) * 14;
    b.vy = Math.sin(reflectAngle) * 14;
    b.angle = reflectAngle;
    b.isExplosive = true;
    b.isReflected = true;
    b.bounces = 0; // reset bounces so it can keep going
    spawnParticles(b.x, b.y, '#00ff88', 12);
    showMsg('BOWLING BALL REDIRECTED!');
    didReflect = true;
  }
    // Reflect orbiting raging ring bullets
if (gs.hasRagingRings && gs.ragingRingBullets) {
  for (let ri = gs.ragingRingBullets.length - 1; ri >= 0; ri--) {
    const rb = gs.ragingRingBullets[ri];
    if (Math.hypot(rb.x - ppos.x, rb.y - ppos.y) > CFG.MELEE_RANGE) continue;
    const reflectAngle = Math.atan2(mouse.y - rb.y, mouse.x - rb.x);
    const reflectSpeed = CFG.BULLET_SPEED * 1.4;
    gs.bullets.push({
      x: rb.x, y: rb.y,
      vx: Math.cos(reflectAngle) * reflectSpeed,
      vy: Math.sin(reflectAngle) * reflectSpeed,
      angle: reflectAngle,
      life: CFG.BULLET_LIFE + 20, maxLife: CFG.BULLET_LIFE + 20,
      damageMult: rb.damageMult,
      isDud: false, isReflected: true, isExplosive: true,
    });
    gs.ragingRingBullets.splice(ri, 1);
    spawnParticles(rb.x, rb.y, '#aaaaff', 8);
    didReflect = true;
  }
}
  // Cannonball redirect (any state, not just CHARGING)
  for (const id of ECS.query('enemy', 'pos', 'hp', 'ai')) {
    const type = ECS.get(id, 'enemy').type;
    if (type !== 'cannonball') continue;
    const epos = ECS.get(id, 'pos'), eai = ECS.get(id, 'ai'), evel = ECS.get(id, 'vel');
    if (Math.hypot(epos.x - ppos.x, epos.y - ppos.y) > CFG.MELEE_RANGE + 10) continue;
    const chargeSpd = Math.max(14, Math.hypot(evel.vx, evel.vy));
    evel.vx = Math.cos(gunAngle) * chargeSpd;
    evel.vy = Math.sin(gunAngle) * chargeSpd;
    eai.chargeTarget = { x: epos.x + Math.cos(gunAngle) * 400, y: epos.y + Math.sin(gunAngle) * 400 };
    eai.chargeState = 'CHARGING';
    eai.reflectedByGlowstick = true;
    spawnParticles(epos.x, epos.y, '#00ff88', 18);
    gs.shakeX = 14; gs.shakeY = 14;
    showMsg('CANNONBALL REDIRECTED!');
    didReflect = true;
  }

  // Melee damage to enemies in front
  for (const id of ECS.query('enemy', 'pos', 'hp')) {
    const eai2 = ECS.get(id, 'ai'), type2 = ECS.get(id, 'enemy').type;
    if (type2 === 'cannonball' && eai2 && eai2.chargeState === 'CHARGING') continue;
    const epos = ECS.get(id, 'pos'), ehp = ECS.get(id, 'hp'), evel = ECS.get(id, 'vel');
    const dx = epos.x - ppos.x, dy = epos.y - ppos.y, dist = Math.hypot(dx, dy);
    if (dist >= CFG.MELEE_RANGE || dist < 5) continue;
    const dot = (dx/dist)*Math.cos(gunAngle) + (dy/dist)*Math.sin(gunAngle);
    if (dot < 0.1) continue;
    ehp.hp -= meleeDmg; ehp.hitFlash = 12;
    if (evel) { evel.vx += (dx / dist) * 7; evel.vy += (dy / dist) * 7; }
    spawnParticles(epos.x, epos.y, '#00ff88', 9);
    if (ehp.hp <= 0) {
        const type2 = ECS.get(id, 'enemy')?.type;
        if (type2 === 'cakeBoss' || type2 === 'boss2') handleBossDeath(id);
        spawnParticles(epos.x, epos.y, '#ff2222', 18);
        ECS.destroyEntity(id);
        gs.score += Math.round(15 * gs.wave); gs.waveKills++;
        tryDropTicket(); gs.health = Math.min(gs.maxHealth, gs.health + CFG.HEALTH_REGEN);
        updateHUD(); checkWave();
      }
  }

  if (didReflect) {
    gs.meleeActiveTimer = 0; // end window immediately on reflect
    gs.glowCooldown = 0;     // no cooldown on success
    gs.explosionFreezeTimer = (gs.explosionFreezeTimer || 0) + 5;
    gs.shakeX = 6; gs.shakeY = 6;
    gs.meleeDidReflect = true;
  }

  // On window expiry with no reflect — apply cooldown
  if (gs.meleeActiveTimer === 0 && !gs.meleeDidReflect) {
    gs.glowCooldown = CFG.GLOW_COOLDOWN;
  }
}

function sysRagingRings() {
  if (!gs.hasRagingRings) return;
  const ppos = ECS.get(gs.playerId, 'pos');
  const ORBIT_RADIUS = 52;
  const ORBIT_SPEED = 0.055;
  const MAX_RINGS = 16;

  // Check if any active player bullets are touching the player — convert to orbit
  if (gs.ragingRingBullets.length < MAX_RINGS) {
    for (let i = gs.bullets.length - 1; i >= 0; i--) {
      if (gs.ragingRingBullets.length >= MAX_RINGS) break;
      const b = gs.bullets[i];
      if (b.life <= 0) continue;
      if (b.isOrbiting) continue;
      if (Math.hypot(b.x - ppos.x, b.y - ppos.y) < 28) {
        // Convert to orbiting bullet
        const angle = Math.atan2(b.y - ppos.y, b.x - ppos.x);
        gs.ragingRingBullets.push({
          angle,
          damageMult: (b.damageMult || 1) * 3,
          isDud: false,
        });
        gs.bullets.splice(i, 1);
        spawnParticles(ppos.x, ppos.y, '#aaaaff', 6);
      }
    }
  }

  // Tick orbiting bullets
  for (const rb of gs.ragingRingBullets) {
    rb.angle += ORBIT_SPEED;
    rb.x = ppos.x + Math.cos(rb.angle) * ORBIT_RADIUS;
    rb.y = ppos.y + Math.sin(rb.angle) * ORBIT_RADIUS;
  }

  // Check orbiting bullet collisions with enemies
  const toRemove = new Set();
  for (let ri = 0; ri < gs.ragingRingBullets.length; ri++) {
    const rb = gs.ragingRingBullets[ri];
    for (const eid of ECS.query('enemy', 'pos', 'hp')) {
      const eai = ECS.get(eid, 'ai');
      if (eai && eai.phased) continue;
      const epos = ECS.get(eid, 'pos'), ehp = ECS.get(eid, 'hp');
      if (Math.hypot(rb.x - epos.x, rb.y - epos.y) < 30) {
        if (rb.isDud) { toRemove.add(ri); break; }
        ehp.hp -= rb.damageMult; ehp.hitFlash = 12;
        spawnParticles(epos.x, epos.y, '#aaaaff', 6);
        toRemove.add(ri);
        if (ehp.hp <= 0) {
          spawnParticles(epos.x, epos.y, '#ff2222', 18);
          ECS.destroyEntity(eid);
          gs.score += Math.round(10 * gs.wave); gs.waveKills++;
          tryDropTicket(); gs.health = Math.min(gs.maxHealth, gs.health + CFG.HEALTH_REGEN);
          updateHUD(); checkWave();
        }
        break;
      }
    }
  }
  gs.ragingRingBullets = gs.ragingRingBullets.filter((_, i) => !toRemove.has(i));
}

// ── Helper: try to fire a Mirror Maze ricochet from a kill position ──
function sysMirrorMaze() {
  if (!gs.hasMirrorMaze) return;
  const ppos = ECS.get(gs.playerId, 'pos');
  const ORBIT_R = 130;
  const REDIRECT_RANGE = 350;
  const SHARD_HIT_R = 14;
  const CHAIN_MAX = 10000; // Why does this exist lol
  const REGEN_FRAMES = 900;

  // ── Tick player shard regen ──
  if (gs.mirrorPlayerShardTimer > 0) {
    gs.mirrorPlayerShardTimer--;
    if (gs.mirrorPlayerShardTimer === 0) {
      gs.mirrorShards.push({ orbiting: true, angle: Math.random() * Math.PI * 2, x: 0, y: 0 });
      showMsg('MIRROR SHARD RESTORED!');
    }
  }

  // ── Update orbiting shard position ──
  for (const s of gs.mirrorShards) {
    if (s.orbiting) {
      s.angle += 0.018;
      s.x = ppos.x + Math.cos(s.angle) * ORBIT_R;
      s.y = ppos.y + Math.sin(s.angle) * ORBIT_R;
    }
  }

  // ── Two-pass: collect all bullet→shard hits this frame ──
  // Map: shardIndex → [bulletIndices]
  const shardHits = new Map(); // shardIdx -> array of bulletIdxs

  for (let bi = 0; bi < gs.bullets.length; bi++) {
    const b = gs.bullets[bi];
    if (b.life <= 0) continue;
    if ((b.chainDepth || 0) >= CHAIN_MAX) continue;

    for (let si = 0; si < gs.mirrorShards.length; si++) {
      const s = gs.mirrorShards[si];
      if (Math.hypot(b.x - s.x, b.y - s.y) > SHARD_HIT_R) continue;

      if (!shardHits.has(si)) shardHits.set(si, []);
      shardHits.get(si).push(bi);
      break; // one shard per bullet per frame is fine
    }
  }

  if (shardHits.size === 0) return;

  const shardsToRemove = new Set();
  const bulletsToKill = new Set();
  const bulletsToAdd = [];

  for (const [si, bulletIdxs] of shardHits) {
    if (shardsToRemove.has(si)) continue;
    const s = gs.mirrorShards[si];

    // Find redirect target (shared for all bullets hitting this shard)
    let targetX = null, targetY = null;

    // Priority 1: nearest other shard
    let nearestShardDist = 999999;
    for (let si2 = 0; si2 < gs.mirrorShards.length; si2++) {
      if (si2 === si || shardsToRemove.has(si2)) continue;
      const s2 = gs.mirrorShards[si2];
      const sd = Math.hypot(s2.x - s.x, s2.y - s.y);
      if (sd < REDIRECT_RANGE && sd < nearestShardDist) {
        nearestShardDist = sd;
        targetX = s2.x;
        targetY = s2.y;
      }
    }

    // Priority 2: nearest enemy
    if (targetX === null) {
      let nearestEnemyDist = 999999;
      for (const eid of ECS.query('enemy', 'pos')) {
        const epos = ECS.get(eid, 'pos');
        const ed = Math.hypot(epos.x - s.x, epos.y - s.y);
        if (ed < REDIRECT_RANGE && ed < nearestEnemyDist) {
          nearestEnemyDist = ed;
          targetX = epos.x;
          targetY = epos.y;
        }
      }
    }

// Only consume shard if we have somewhere to redirect
    if (targetX === null) continue;
    shardsToRemove.add(si);
    if (s.orbiting) gs.mirrorPlayerShardTimer = REGEN_FRAMES;
    spawnParticles(s.x, s.y, '#ccddff', 12);

    // Redirect ALL bullets that hit this shard
    for (const bi of bulletIdxs) {
      const b = gs.bullets[bi];
      bulletsToKill.add(bi);

      if (targetX !== null) {
        const dx = targetX - s.x, dy = targetY - s.y;
        const dist2 = Math.hypot(dx, dy) || 1;
     if (b.isArcBall && targetX !== null) {
  const GRAVITY = 0.15;
  const horizDist = Math.hypot(targetX - s.x, targetY - s.y);
  const HANG_TIME = Math.max(25, Math.min(55, horizDist / 10)); // 2.5x speed = half hang time
  bulletsToAdd.push({
    x: s.x, y: s.y,
    vx: (targetX - s.x) / HANG_TIME,
    vy: -HANG_TIME * GRAVITY * 0.5,
    vyHoriz: (targetY - s.y) / HANG_TIME,
    gravity: GRAVITY,
    angle: Math.atan2(targetY - s.y, targetX - s.x),
    life: HANG_TIME + 30, maxLife: HANG_TIME + 30,
    damageMult: (b.damageMult || 1) * 5.0,
    isDud: false, isExplosive: true,
    isArcBall: true, isMirrorRicochet: true,
    isMirrorArc: true, // flag for red color
    targetX, targetY,
    startX: s.x, startY: s.y,
    shadowX: s.x, shadowY: targetY,
    sizeScale: 1.2,
    chainDepth: (b.chainDepth || 0) + 1,
  });
} // ── Bowling ball hits shard: redirect + spawn second ball toward nearest enemy ──
if (b.isBowlingBall) {
  // Redirect the ball itself toward the target at 2x speed (decays back to base naturally via friction)
  const BOOSTED_SPEED = 14;
  bulletsToAdd.push({
    x: s.x, y: s.y,
    vx: (dx / dist2) * BOOSTED_SPEED,
    vy: (dy / dist2) * BOOSTED_SPEED,
    angle: Math.atan2(dy, dx),
    life: 220, maxLife: 220,
    damageMult: (b.damageMult || 1) * 2,
    isDud: false,
    isBowlingBall: true,
    bounces: 0,
    hitEnemies: new Set(),
    chainDepth: (b.chainDepth || 0) + 1,
    _mirrorBoosted: true,
  });
  // Also spawn a bonus ball toward nearest enemy
  let nearestEnemyX = null, nearestEnemyY = null, nearestDist = 999999;
  for (const eid of ECS.query('enemy', 'pos')) {
    const epos = ECS.get(eid, 'pos');
    const ed = Math.hypot(epos.x - s.x, epos.y - s.y);
    if (ed < nearestDist) { nearestDist = ed; nearestEnemyX = epos.x; nearestEnemyY = epos.y; }
  }
  if (nearestEnemyX !== null && Math.hypot(nearestEnemyX - targetX, nearestEnemyY - targetY) > 40) {
    const bdx = nearestEnemyX - s.x, bdy = nearestEnemyY - s.y, bd = Math.hypot(bdx, bdy) || 1;
    bulletsToAdd.push({
      x: s.x, y: s.y,
      vx: (bdx / bd) * 7, vy: (bdy / bd) * 7,
      angle: Math.atan2(bdy, bdx),
      life: 180, maxLife: 180,
      damageMult: (b.damageMult || 1) * 1.5,
      isDud: false,
      isBowlingBall: true,
      bounces: 0,
      hitEnemies: new Set(),
      chainDepth: (b.chainDepth || 0) + 1,
    });
    showMsg('SPARE!!!');
  } else {
    showMsg('MIRROR STRIKE!!!');
  }
  spawnParticles(s.x, s.y, '#aaaaaa', 12);
} else {
  bulletsToAdd.push({
    x: s.x, y: s.y,
    vx: (dx / dist2) * CFG.BULLET_SPEED * 2.5,
    vy: (dy / dist2) * CFG.BULLET_SPEED * 2.5,
    angle: Math.atan2(dy, dx),
    life: CFG.BULLET_LIFE + 30,
    maxLife: CFG.BULLET_LIFE + 30,
    damageMult: (b.damageMult || 1) * 5.0,
    isDud: false,
    isRedirected: true,
    chainDepth: (b.chainDepth || 0) + 1,
    isMirrorRicochet: true,
  });
}
      }
    }
    spawnParticles(s.x, s.y, '#8899ff', 8);
  }

  // Apply removals
  gs.mirrorShards = gs.mirrorShards.filter((_, i) => !shardsToRemove.has(i));
  for (const bi of bulletsToKill) gs.bullets[bi].life = 0;
  for (const nb of bulletsToAdd) gs.bullets.push(nb);
}

function _spawnMiniClown(x, y, gs) {
  const def = ENEMY_DEFS['miniClown'];
  const baseHp = 1 + Math.floor(gs.wave / 2);
  const id = ECS.createEntity();
  ECS.add(id, 'enemy', { type: 'miniClown' });
  ECS.add(id, 'pos', { x, y, angle: 0 });
  ECS.add(id, 'vel', { vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 });
  ECS.add(id, 'hp', { hp: Math.ceil(baseHp * def.hpMult), maxHp: Math.ceil(baseHp * def.hpMult), hitFlash: 0 });
  ECS.add(id, 'physics', { speed: CFG.MINI_CLOWN_SPEED });
  ECS.add(id, 'ai', { shootCooldown: 0, dashHit: false });
  spawnParticles(x, y, '#ff4400', 6);
}

function _clownCarExplode(id, pos, gs, playerDriving) {
  spawnPartyParticles(pos.x, pos.y);
  spawnParticles(pos.x, pos.y, '#ffdd00', 30);
  gs.shakeX = 24; gs.shakeY = 24;

  // Spawn a burst of mini clowns
  const count = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    _spawnMiniClown(pos.x + Math.cos(a) * 30, pos.y + Math.sin(a) * 30, gs);
  }

  // Damage nearby enemies
  const toKill = [];
  for (const eid of ECS.query('enemy', 'pos', 'hp')) {
    if (eid === id) continue;
    const epos = ECS.get(eid, 'pos'), ehp = ECS.get(eid, 'hp');
    if (Math.hypot(epos.x - pos.x, epos.y - pos.y) < 120) {
      ehp.hp -= baseBulletDamage() * 6; ehp.hitFlash = 14;
      if (ehp.hp <= 0) toKill.push({ eid, x: epos.x, y: epos.y });
    }
  }
  for (const { eid, x, y } of toKill) {
    if (!ECS.has(eid, 'pos')) continue;
    spawnParticles(x, y, '#ff2222', 14);
    ECS.destroyEntity(eid);
    gs.score += Math.round(10 * gs.wave); gs.waveKills++;
    tryDropTicket(); gs.health = Math.min(gs.maxHealth, gs.health + CFG.HEALTH_REGEN);
    updateHUD();
  }

  // Damage player if not driving
  if (!playerDriving) {
    const ppos = ECS.get(gs.playerId, 'pos');
    if (ppos && Math.hypot(pos.x - ppos.x, pos.y - ppos.y) < 120 && gs.invincible <= 0) {
      gs.health -= 25; gs.invincible = CFG.INVINCIBLE_FRAMES;
      gs.flawlessThisWave = false;
      triggerSFPHit(); updateHUD();
      if (gs.health <= 0) { gameOver(); return; }
    }
  }

  if (ECS.has(id, 'pos')) {
    ECS.destroyEntity(id);
    gs.waveKills++;
  }
  showMsg('CLOWN CAR EXPLODES! MINI CLOWNS EVERYWHERE!');
  setTimeout(() => checkWave(), 0);
}

function sysPlayerMovement() {


  if (gs.forkGrabbed) {
    let anyGrabbing = false;
    for (const id of ECS.query('enemy', 'ai')) {
      const ai2 = ECS.get(id, 'ai');
      if (ai2.uForkGrabTimer > 0) { anyGrabbing = true; break; }
    }
    if (!anyGrabbing) { gs.forkGrabbed = false; }
  }
  
  const pId=gs.playerId, pos=ECS.get(pId,'pos'), vel=ECS.get(pId,'vel');
  const dashing=gs.dashTimer>0, slowed=gs.confettiSlowTimer>0;
  let speedMult=1;
  if (gs.speedBoostTimer>0) speedMult=gs.speedBoostMult||CFG.SPEED_BOOST_MULT;
  if (gs.sfpFull) speedMult=Math.max(speedMult,1.3);
  if (gs.hasTightropeBoots) speedMult=Math.max(speedMult,3.00);
  const topSpd=slowed?CFG.PLAYER_SPEED*0.45:(gs.speedBoostTimer>0?CFG.PLAYER_SPEED*speedMult:CFG.PLAYER_SPEED);
  if (dashing) {
    gs.dashTimer--; gs.dashTrail.push({x:pos.x,y:pos.y,life:12,angle:playerMoveAngle});
    vel.vx=gs.dashVx; vel.vy=gs.dashVy;
  } else {
    let ix=0,iy=0;
    if (!gs.forkGrabbed) {
      if (keys[KEYBINDS.moveLeft]||keys['ArrowLeft'])  ix--;
      if (keys[KEYBINDS.moveRight]||keys['ArrowRight']) ix++;
      if (keys[KEYBINDS.moveUp]||keys['ArrowUp'])    iy--;
      if (keys[KEYBINDS.moveDown]||keys['ArrowDown']) iy++;
    }
    if (ix&&iy){ix*=0.707;iy*=0.707;}

    // ── Spoon knockback: bypass friction for a few frames ──
    if (gs.spoonKnockbackTimer > 0) {
      gs.spoonKnockbackTimer--;
      // Don't apply movement input friction — let the knockback carry through
      // but still allow the player to steer slightly
      if (ix||iy) { vel.vx+=ix*0.15*topSpd; vel.vy+=iy*0.15*topSpd; }
      // Minimal drag only
      vel.vx *= 0.96; vel.vy *= 0.96;
    } else {
      if (ix||iy){vel.vx+=ix*0.38*topSpd;vel.vy+=iy*0.38*topSpd;}
      else{vel.vx*=0.82;vel.vy*=0.82;}
      const spd=Math.hypot(vel.vx,vel.vy);
      if (spd>topSpd){vel.vx=vel.vx/spd*topSpd;vel.vy=vel.vy/spd*topSpd;}
    }
  }

  // near the top of sysPlayerMovement, after dashing block:
if (gs.knockingPinsActive) {
  // Skip all friction/cap logic — velocity is set directly by sysTimers each frame
  pos.x += vel.vx; pos.y += vel.vy;
  const bouncy = gs.bouncyHouse;
  if (pos.x < CFG.WALL_PAD) { pos.x = CFG.WALL_PAD; vel.vx = bouncy ? Math.abs(vel.vx) : 0; }
  if (pos.x > worldW - CFG.WALL_PAD) { pos.x = worldW - CFG.WALL_PAD; vel.vx = bouncy ? -Math.abs(vel.vx) : 0; }
  if (pos.y < CFG.WALL_PAD) { pos.y = CFG.WALL_PAD; vel.vy = bouncy ? Math.abs(vel.vy) : 0; }
  if (pos.y > worldH - CFG.WALL_PAD) { pos.y = worldH - CFG.WALL_PAD; vel.vy = bouncy ? -Math.abs(vel.vy) : 0; }
  gunX = pos.x; gunY = pos.y; // keep gun synced during pin charge
  gunAngle = Math.atan2(vel.vy, vel.vx);
  return;
}
  pos.x+=vel.vx; pos.y+=vel.vy;
  const bouncy=gs.bouncyHouse;
  if (pos.x<CFG.WALL_PAD){pos.x=CFG.WALL_PAD;vel.vx=bouncy?Math.abs(vel.vx):0;}
  if (pos.x>worldW-CFG.WALL_PAD){pos.x=worldW-CFG.WALL_PAD;vel.vx=bouncy?-Math.abs(vel.vx):0;}
  if (pos.y<CFG.WALL_PAD){pos.y=CFG.WALL_PAD;vel.vy=bouncy?Math.abs(vel.vy):0;}
  if (pos.y>worldH-CFG.WALL_PAD){pos.y=worldH-CFG.WALL_PAD;vel.vy=bouncy?-Math.abs(vel.vy):0;}
  const moveSpd=Math.hypot(vel.vx,vel.vy);
  if (moveSpd>0.5){playerMoveAngle=Math.atan2(vel.vy,vel.vx);}
  else{let da=gunAngle-playerMoveAngle;while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;playerMoveAngle+=da*0.04;}
  if (moveSpd>0.5) playerBobTimer+=moveSpd*0.08; else playerBobTimer*=0.85;
  const MAX_HOLD_DIST=50, mdx=mouse.x-pos.x, mdy=mouse.y-pos.y;
  const mouseDist=Math.hypot(mdx,mdy)||1, holdDist=Math.min(mouseDist,MAX_HOLD_DIST);
  gunX+=(pos.x+(mdx/mouseDist)*holdDist-gunX)*0.18;
  gunY+=(pos.y+(mdy/mouseDist)*holdDist-gunY)*0.18;
  gunAngle=Math.atan2(mouse.y-gunY,mouse.x-gunX);
  let da=Math.atan2(mouse.y-pos.y,mouse.x-pos.x)-gunAngle;
  while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;
  gunAngle+=da*0.25;
  gs.dashTrail=gs.dashTrail.filter(t=>{t.life--;return t.life>0;});
  if (gs.heldGiftBox!==null){
    if (!ECS.has(gs.heldGiftBox,'pos')){gs.heldGiftBox=null;}
    else{const hbpos=ECS.get(gs.heldGiftBox,'pos'),ppos=ECS.get(gs.playerId,'pos');hbpos.x=ppos.x+Math.cos(gunAngle)*36;hbpos.y=ppos.y+Math.sin(gunAngle)*36;}
  }
}

function sysConfusedEnemyCollision() {
const confusedIds = [...ECS.query('enemy', 'pos', 'hp', 'ai')].filter(id => {
    const ai = ECS.get(id, 'ai');
    return ai && ai.confused;
  });
  if (confusedIds.length < 2) return;

  const toKill = [];
  for (let i = 0; i < confusedIds.length; i++) {
    for (let j = i + 1; j < confusedIds.length; j++) {
      const idA = confusedIds[i], idB = confusedIds[j];
      if (!ECS.has(idA, 'pos') || !ECS.has(idB, 'pos')) continue;
      const posA = ECS.get(idA, 'pos'), posB = ECS.get(idB, 'pos');
      if (Math.hypot(posA.x - posB.x, posA.y - posB.y) < 28) {
        const hpA = ECS.get(idA, 'hp'), hpB = ECS.get(idB, 'hp');
        hpA.hp -= 8; hpA.hitFlash = 10;
        hpB.hp -= 8; hpB.hitFlash = 10;
        spawnParticles((posA.x+posB.x)/2, (posA.y+posB.y)/2, '#4488ff', 8);
        if (hpA.hp <= 0) toKill.push({ id: idA, x: posA.x, y: posA.y });
        if (hpB.hp <= 0) toKill.push({ id: idB, x: posB.x, y: posB.y });
      }
    }
  }
  for (const { id, x, y } of toKill) {
    if (!ECS.has(id, 'pos')) continue;
    spawnParticles(x, y, '#ff2222', 14);
    ECS.destroyEntity(id);
    gs.score += Math.round(10 * gs.wave);
    gs.waveKills++;
    tryDropTicket();
    gs.health = Math.min(gs.maxHealth, gs.health + CFG.HEALTH_REGEN);
    updateHUD();
  }
  if (toKill.length > 0) setTimeout(() => checkWave(), 0);
}
     
function sysAI() {
  gs.frozen=gs.partyFreezeTimer>0;

  // ── Clean up juggled flags for any enemy whose juggler has died ──
  for (const id of ECS.query('enemy','ai')) {
    if (!ECS.has(id, 'enemy')) continue;
    const ai2 = ECS.get(id,'ai');
    if (ai2.juggled && ai2.juggledBy !== undefined) {
      if (!ECS.has(ai2.juggledBy, 'pos')) {
        // Juggler is gone — free this enemy
        ai2.juggled = false;
        ai2.juggledBy = null;
        // Restore normal physics so the enemy can move again
        const evel = ECS.get(id,'vel');
        if (evel) { evel.vx = (Math.random()-.5)*2; evel.vy = (Math.random()-.5)*2; }
      }
    }
  }

 

for (const id of [...ECS.query('enemy','pos','vel','ai','physics')]) {

     // Guard: entity may have been destroyed mid-iteration
    if (!ECS.has(id, 'enemy') || !ECS.has(id, 'pos')) continue;

    
    const ai2=ECS.get(id,'ai');
// Thrown enemies need full position updates — skip only the BT tick, not movement
   // Thrown enemies: skip BT entirely, just let velocity carry them
    if (ai2 && ai2.thrownByFork) {
      const hp2 = ECS.get(id,'hp'); if (hp2 && hp2.hitFlash > 0) hp2.hitFlash--;
      const pos2 = ECS.get(id,'pos'), vel2 = ECS.get(id,'vel');
      if (pos2 && vel2) {
        // Decay velocity slightly so it doesn't go forever, but keep most speed
        vel2.vx *= 0.97; vel2.vy *= 0.97;
        pos2.x += vel2.vx; pos2.y += vel2.vy;
        // Wall clamp
        pos2.x = Math.max(CFG.WALL_PAD, Math.min(worldW - CFG.WALL_PAD, pos2.x));
        pos2.y = Math.max(CFG.WALL_PAD, Math.min(worldH - CFG.WALL_PAD, pos2.y));
      }
      ai2.forkThrowTimer--;
      if (ai2.forkThrowTimer <= 0) { ai2.thrownByFork = false; }
      continue; // skip BT and normal position update
    }

   if (ai2 && ai2.juggled && !ai2.thrownByFork) {
      const type=ECS.get(id,'enemy').type;
      if (type==='waterballoon') {
        const pos2=ECS.get(id,'pos'),pp2=playerPos(gs);
        if (pp2) {
          ai2.shootCooldown=(ai2.shootCooldown||120)-1;
          if (ai2.shootCooldown<=0) {
            ai2.shootCooldown=90;
            const aim=Math.atan2(pp2.y-pos2.y,pp2.x-pos2.x);
            gs.enemyBullets.push({x:pos2.x,y:pos2.y,vx:Math.cos(aim)*0.5,vy:Math.sin(aim)*0.5,life:140,maxLife:140,color:'#44aaff',isTear:true,gravity:0.045});
          }
        }
      }
      const hp2=ECS.get(id,'hp'); if (hp2&&hp2.hitFlash>0) hp2.hitFlash--;
      continue;
    }
   const type=ECS.get(id,'enemy').type;
const bt=ENEMY_BTS[type];
if (bt) {
if (ai2 && ai2.confused) {
        const prevCount = gs.enemyBullets.length;
        // Only tick BT to capture any bullets it would fire (we'll redirect them)
        // but first zero velocity so BT movement doesn't override confused movement
        const velRef = ECS.get(id, 'vel');
        const savedVx = velRef ? velRef.vx : 0;
        const savedVy = velRef ? velRef.vy : 0;
        bt.tick(id, gs);
        // Restore vel — confused movement block below will set it properly
        if (velRef) { velRef.vx = savedVx; velRef.vy = savedVy; }
    if (gs.enemyBullets.length > prevCount) {
      const cpos = ECS.get(id, 'pos');
      let nearestPos = null, nearestDist = 999999;
      for (const oid of ECS.query('enemy', 'pos')) {
        if (oid === id) continue;
        const op = ECS.get(oid, 'pos');
        const od = Math.hypot(op.x - cpos.x, op.y - cpos.y);
        if (od < nearestDist) { nearestDist = od; nearestPos = op; }
      }
      const newBullets = gs.enemyBullets.splice(prevCount);
for (const nb of newBullets) {
  if (nb.isArcBall) continue;
  // If no other enemy to target, discard the bullet entirely
  if (!nearestPos) continue;
  const dx = nearestPos.x - nb.x, dy = nearestPos.y - nb.y;
  const dist = Math.hypot(dx, dy) || 1;
  const spd = Math.hypot(nb.vx, nb.vy) || CFG.BULLET_SPEED * 0.7;
  const vx = (dx / dist) * spd;
  const vy = (dy / dist) * spd;
  gs.bullets.push({
    x: nb.x, y: nb.y, vx, vy,
    angle: Math.atan2(vy, vx),
    life: nb.life || CFG.BULLET_LIFE + 10,
    maxLife: nb.maxLife || CFG.BULLET_LIFE + 10,
    damageMult: 3, isDud: false,
  });
}
    }
  } else {
    bt.tick(id, gs);
  }
}
    // Skip position update for player-driven car (sysTimers handles it)
if (type === 'clownCar' && gs.drivingCar === id) continue;
   if (!ECS.has(id,'pos')||!ECS.has(id,'vel')) continue;
    const pos=ECS.get(id,'pos'),vel=ECS.get(id,'vel');
    // Attached clowns update their own position inside BT_MINI_CLOWN — skip the sysAI position update
    if (type === 'miniClown' && ai2 && ai2.clownState === 'ATTACHED') {
      const hp2 = ECS.get(id,'hp'); if (hp2 && hp2.hitFlash > 0) hp2.hitFlash--;
      continue;
    }

if (ai2&&ai2.reflectedByGlowstick&&ECS.has(id,'enemy')&&ECS.get(id,'enemy').type==='cannonball') {
      const hitWall=pos.x<30||pos.x>worldW-30||pos.y<30||pos.y>worldH-30;
      let hitEnemy=false;
      for (const oid of ECS.query('enemy','pos')) {
        if (oid===id) continue;
        if (Math.hypot(ECS.get(oid,'pos').x-pos.x,ECS.get(oid,'pos').y-pos.y)<40){hitEnemy=true;break;}
      }
      if (hitWall||hitEnemy) {
        detonateExplosiveBullet({damageMult:baseBulletDamage()*4,life:1,isExplosive:true},pos.x,pos.y);
        spawnParticles(pos.x,pos.y,'#ff4400',30); gs.shakeX=22;gs.shakeY=22;
        showMsg('CANNONBALL EXPLODES!!!');
        ECS.destroyEntity(id); gs.score+=Math.round(25*gs.wave); gs.waveKills++;
        tryDropTicket(); updateHUD(); checkWave(); continue;
      }
    }

    pos.x+=vel.vx; pos.y+=vel.vy;
    if (gs.bouncyHouse) {
      if (pos.x<18){pos.x=18;vel.vx=Math.abs(vel.vx);spawnParticles(pos.x,pos.y,'#88ffdd',4);}
      if (pos.x>worldW-18){pos.x=worldW-18;vel.vx=-Math.abs(vel.vx);spawnParticles(pos.x,pos.y,'#88ffdd',4);}
      if (pos.y<18){pos.y=18;vel.vy=Math.abs(vel.vy);spawnParticles(pos.x,pos.y,'#88ffdd',4);}
      if (pos.y>worldH-18){pos.y=worldH-18;vel.vy=-Math.abs(vel.vy);spawnParticles(pos.x,pos.y,'#88ffdd',4);}
    } else {
      const pp=ECS.get(gs.playerId,'pos');
      if (pp) pos.angle=Math.atan2(pp.y-pos.y,pp.x-pos.x);
    }
    const hp=ECS.get(id,'hp'); if (hp&&hp.hitFlash>0) hp.hitFlash--;
    const phy2=ECS.get(id,'physics');
    if (ai2&&phy2) {
      // Confused enemies chase and shoot nearest enemy
      if (ai2.confused) {
        ai2.confuseTimer--;
        if (ai2.confuseTimer<=0) { ai2.confused=false; ai2.confuseColor=null; }
        else {
          ai2.confuseColor='#4488ff';
          let nearEnemy=null,nearD=999999;
          for (const oid of ECS.query('enemy','pos')) {
            if (oid===id) continue;
            const od=Math.hypot(ECS.get(oid,'pos').x-pos.x,ECS.get(oid,'pos').y-pos.y);
            if (od<nearD){nearD=od;nearEnemy={pos:ECS.get(oid,'pos'),id:oid};}
          }
          if (nearEnemy) {
  const cdx=nearEnemy.pos.x-pos.x,cdy=nearEnemy.pos.y-pos.y,cd=Math.hypot(cdx,cdy)||1;
  vel.vx=(vel.vx||0)*0.88+(cdx/cd)*phy2.speed*0.22;
  vel.vy=(vel.vy||0)*0.88+(cdy/cd)*phy2.speed*0.22;
  // Contact damage to nearest enemy
  if (cd < 28 && ECS.has(nearEnemy.id, 'hp')) {
    const nehp = ECS.get(nearEnemy.id, 'hp');
    nehp.hp -= 3; nehp.hitFlash = 10;
    spawnParticles(nearEnemy.pos.x, nearEnemy.pos.y, '#4488ff', 5);
    if (nehp.hp <= 0) {
      spawnParticles(nearEnemy.pos.x, nearEnemy.pos.y, '#ff2222', 14);
      ECS.destroyEntity(nearEnemy.id);
      gs.score += Math.round(10 * gs.wave); gs.waveKills++;
      tryDropTicket(); gs.health = Math.min(gs.maxHealth, gs.health + CFG.HEALTH_REGEN);
      updateHUD(); setTimeout(() => checkWave(), 0);
    }
  }
} else {
  // No other enemies — wander slowly, ignore player
  if (!ai2._confuseWanderAngle) ai2._confuseWanderAngle = Math.random() * Math.PI * 2;
  if (!ai2._confuseWanderTimer) ai2._confuseWanderTimer = 0;
  ai2._confuseWanderTimer--;
  if (ai2._confuseWanderTimer <= 0) {
    ai2._confuseWanderAngle = Math.random() * Math.PI * 2;
    ai2._confuseWanderTimer = 60 + Math.floor(Math.random() * 60);
  }
  vel.vx = (vel.vx||0)*0.88 + Math.cos(ai2._confuseWanderAngle)*phy2.speed*0.12;
  vel.vy = (vel.vy||0)*0.88 + Math.sin(ai2._confuseWanderAngle)*phy2.speed*0.12;
}
        }
      }
       // ── Clown rider buffs ──
    if (ai2.clownRiders && ai2.clownRiders > 0) {
      const stackCount = ai2.clownRiders;
      // Speed boost: +20% per clown, stacking
      phy2._clownBaseSpeed = phy2._clownBaseSpeed || phy2.speed;
      const targetSpeed = phy2._clownBaseSpeed * (1 + stackCount * 0.20);
      phy2.speed = Math.min(targetSpeed, phy2._clownBaseSpeed * 2.5); // cap at 2.5x
      // Attack cooldown reduction: stored on ai for BTs to read
      ai2.clownCooldownMult = Math.max(0.35, 1.0 - stackCount * 0.18);
    } else {
      // No clowns — restore base speed if it was boosted
      if (phy2._clownBaseSpeed) {
        phy2.speed = phy2._clownBaseSpeed;
        delete phy2._clownBaseSpeed;
      }
      ai2.clownCooldownMult = 1.0;
    }
    // Reset rider count each tick — BT_MINI_CLOWN re-increments it each frame for attached clowns.
    // Only reset if this entity is not a miniClown itself (clowns don't have riders).
    if (ECS.get(id, 'enemy').type !== 'miniClown') ai2.clownRiders = 0;
    }
    // Reset rider count each tick — BT_MINI_CLOWN re-increments it each frame for attached clowns
    ai2.clownRiders = 0;
      if (ai2.ringmasterBuffed) {
        ai2.ringmasterBuffTimer=(ai2.ringmasterBuffTimer||0)-1;
        phy2._baseSpeed=phy2._baseSpeed||phy2.speed;
        phy2.speed=phy2._baseSpeed*1.4;
        if (ai2.ringmasterBuffTimer<=0){ai2.ringmasterBuffed=false;phy2.speed=phy2._baseSpeed;}
      } else if (phy2._baseSpeed) { phy2.speed=phy2._baseSpeed; }
    }
  

  // Paper Cuts
  if (gs.hasPaperCuts) {
    gs.paperCutsTimer=(gs.paperCutsTimer||0)+1;
    if (gs.paperCutsTimer>=60) {
      gs.paperCutsTimer=0;
      for (const id of ECS.query('enemy','hp')) {
        const ehp=ECS.get(id,'hp');
        if (ehp.hp<ehp.maxHp) {
          ehp.hp-=1; ehp.hitFlash=4;
          if (ehp.hp<=0) {
            const epos=ECS.get(id,'pos'); if (epos) spawnParticles(epos.x,epos.y,'#ff2222',10);
            ECS.destroyEntity(id); gs.score+=Math.round(5*gs.wave); gs.waveKills++;
            tryDropTicket(); gs.health=Math.min(gs.maxHealth,gs.health+CFG.HEALTH_REGEN); updateHUD(); checkWave();
          }
        }
      }
    }
  }
}

function sysBullets() {
  gs.bullets=gs.bullets.filter(b=>{
  
b.x += b.vx; b.y += b.vy; b.life--;
if (b.isArcBall) {
  b.vy += b.gravity;
  b.y  += b.vyHoriz;
  b.shadowX = b.x;
  // Impact: when remaining life drops below the buffer or close to target
  if (b.life < 30 || Math.hypot(b.x - b.targetX, b.y - b.targetY) < 28) {
    if (b.isExplosive) {
      detonateExplosiveBullet(b, b.x, b.y);
    }
    b.life = 0;
    spawnParticles(b.x, b.y, '#00ff88', 20);
    gs.shakeX = 14; gs.shakeY = 14;
    return false; // filtered out below
  }
}    // ── Bowling ball: always bounces, pierces, explodes on expiry ──
if (b.isBowlingBall) {
  let bounced = false;
  if (b.x <= 18)         { b.x = 18;          b.vx =  Math.abs(b.vx); bounced = true; }
  if (b.x >= worldW - 18){ b.x = worldW - 18; b.vx = -Math.abs(b.vx); bounced = true; }
  if (b.y <= 18)         { b.y = 18;           b.vy =  Math.abs(b.vy); bounced = true; }
  if (b.y >= worldH - 18){ b.y = worldH - 18;  b.vy = -Math.abs(b.vy); bounced = true; }
  if (bounced) {
    b.bounces = (b.bounces || 0) + 1;
    spawnParticles(b.x, b.y, '#aaaaaa', 6);
    if (b.bounces >= 6) {
      detonateExplosiveBullet(b, b.x, b.y);
      return false;
    }
  }
  if (b.life <= 0) {
    detonateExplosiveBullet(b, b.x, b.y);
    return false;
  }
  return true;
}
    if (gs.bouncyHouse) {
      let bounced=false;
      if (b.x<=4){b.x=4;b.vx=Math.abs(b.vx);b.angle=Math.atan2(b.vy,b.vx);bounced=true;}
      if (b.x>=worldW-4){b.x=worldW-4;b.vx=-Math.abs(b.vx);b.angle=Math.atan2(b.vy,b.vx);bounced=true;}
      if (b.y<=4){b.y=4;b.vy=Math.abs(b.vy);b.angle=Math.atan2(b.vy,b.vx);bounced=true;}
      if (b.y>=worldH-4){b.y=worldH-4;b.vy=-Math.abs(b.vy);b.angle=Math.atan2(b.vy,b.vx);bounced=true;}
      if (bounced) {
        b.bounces=(b.bounces||0)+1; spawnParticles(b.x,b.y,'#88ffdd',3);
        if (b.isExplosive){detonateExplosiveBullet(b,b.x,b.y);return false;}
        if (gs.hasMirrorMaze&&b.bounces===1) {
          const perp=Math.atan2(b.vy,b.vx)+Math.PI/2;
          gs.bullets.push({x:b.x,y:b.y,vx:Math.cos(perp)*CFG.BULLET_SPEED,vy:Math.sin(perp)*CFG.BULLET_SPEED,angle:perp,life:CFG.BULLET_LIFE,damageMult:b.damageMult,isDud:b.isDud,bounces:99});
        }
      }
      return b.life>0&&(b.bounces||0)<=8;
    }
    const oob=b.x<-10||b.x>worldW+10||b.y<-10||b.y>worldH+10;
    if (oob&&b.isExplosive){detonateExplosiveBullet(b,Math.max(0,Math.min(worldW,b.x)),Math.max(0,Math.min(worldH,b.y)));return false;}
    return b.life>0&&!oob;
  });
}

function sysBulletEnemyCollision() {
  for (const b of gs.bullets) {
    if (b.life<=0) continue;
    for (const id of ECS.query('enemy','pos','hp')) {
      const eai=ECS.get(id,'ai');
      if (eai&&eai.phased) continue;
      const epos=ECS.get(id,'pos'),ehp=ECS.get(id,'hp');
      if (Math.hypot(b.x-epos.x,b.y-epos.y)<30) {
        if (b.isExplosive){detonateExplosiveBullet(b,b.x,b.y);break;}
        if (b.isDud){b.life=0;spawnParticles(b.x,b.y,'#666666',3);break;}

        // ── Bowling ball: pierce, don't kill bullet ──
        if (b.isBowlingBall) {
          if (!b.hitEnemies.has(id)) {
            b.hitEnemies.add(id);
            const dmg = b.damageMult || 1;
            ehp.hp -= dmg; ehp.hitFlash = 14;
            spawnParticles(epos.x, epos.y, '#aaaaaa', 8);
            spawnParticles(epos.x, epos.y, '#333344', 5);
            if (ehp.hp <= 0) {
              spawnParticles(epos.x, epos.y, '#ff2222', 18);
              if (gs.hasPopcornBucket && Math.random() < 0.22)
                gs.popcornKernels.push({x:epos.x+(Math.random()-.5)*20,y:epos.y+(Math.random()-.5)*20});
              if (gs.hasMirrorMaze) {
                gs.mirrorShards.push({ orbiting: false, x: epos.x, y: epos.y, angle: Math.random()*Math.PI*2 });
                spawnParticles(epos.x, epos.y, '#ccddff', 10);
              }

             const bbType = ECS.get(id, 'enemy')?.type;
if (bbType === 'clownCar') {
  _clownCarExplode(id, epos, gs, false);
  b.life = 0;
  break;
}
              
              ECS.destroyEntity(id);
              gs.score += Math.round(10*gs.wave*(dmg>1?1.6:1)); gs.waveKills++;
              tryDropTicket(); gs.health=Math.min(gs.maxHealth,gs.health+CFG.HEALTH_REGEN);
              updateHUD(); checkWave();
            }
          }
          continue; // don't break — keep checking other enemies
        }

        const dmg=b.damageMult||1;
        ehp.hp-=dmg; ehp.hitFlash=12; b.life=0;
        spawnParticles(b.x,b.y,dmg>1?'#ff44ff':'#ff6644',6);

        if (gs.popcornFrenzyTimer > 0) {
  spawnParticles(b.x, b.y, '#ffdd00', 16);
  spawnParticles(b.x, b.y, '#ff8800', 8);
  const frenzyRadius = gs.hasPopcornBowl ? 330 : 165;
  const frenzyDmg    = gs.hasPopcornBowl ? dmg * 2.0 : dmg;
  for (const aoeId of ECS.query('enemy', 'pos', 'hp')) {
    if (aoeId === id) continue;
    const ap = ECS.get(aoeId, 'pos');
    if (Math.hypot(ap.x - b.x, ap.y - b.y) < frenzyRadius) {
      const ah = ECS.get(aoeId, 'hp');
      ah.hp -= frenzyDmg;
      ah.hitFlash = 10;
      spawnParticles(ap.x, ap.y, '#ffcc00', 5);
    }
  }
}

      

        if (ehp.hp<=0) {
          const type=ECS.get(id,'enemy').type;
if (type === 'boss' || type === 'cakeBoss') handleBossDeath(id);
          if (gs.ricochetActive) {
            let nearest=null,nearDist=999999;
            for (const oid of ECS.query('enemy','pos')) {
              if (oid===id) continue;
              const od=Math.hypot(ECS.get(oid,'pos').x-epos.x,ECS.get(oid,'pos').y-epos.y);
              if (od<nearDist){nearDist=od;nearest=ECS.get(oid,'pos');}
            }
            if (nearest) {
              const rd=Math.hypot(nearest.x-epos.x,nearest.y-epos.y)||1;
              gs.bullets.push({x:epos.x,y:epos.y,vx:(nearest.x-epos.x)/rd*CFG.BULLET_SPEED,vy:(nearest.y-epos.y)/rd*CFG.BULLET_SPEED,angle:0,life:CFG.BULLET_LIFE,damageMult:dmg,isDud:false});
              spawnParticles(epos.x,epos.y,'#4499ff',6);
            }
          }

          spawnParticles(epos.x,epos.y,'#ff2222',18);
          if (gs.hasPopcornBucket&&Math.random()<0.22)
            gs.popcornKernels.push({x:epos.x+(Math.random()-.5)*20,y:epos.y+(Math.random()-.5)*20});
          ECS.destroyEntity(id);
          // Death shard from redirected bullet
if (gs.hasMirrorMaze) {
  gs.mirrorShards.push({ orbiting: false, x: epos.x, y: epos.y, angle: Math.random() * Math.PI * 2 });
  spawnParticles(epos.x, epos.y, '#ccddff', 10);
}
          gs.score+=Math.round(10*gs.wave*(dmg>1?1.6:1)); gs.waveKills++;
          tryDropTicket(); gs.health=Math.min(gs.maxHealth,gs.health+CFG.HEALTH_REGEN); updateHUD(); checkWave();
        }
        break;
      }
    }
  }
  gs.bullets=gs.bullets.filter(b=>b.life>0);
}

function sysDashCollision() {
  if (gs.dashTimer<=0){for (const id of ECS.query('enemy','ai')) ECS.get(id,'ai').dashHit=false;return;}
  const ppos=ECS.get(gs.playerId,'pos'),pvel=ECS.get(gs.playerId,'vel');
  const dashSpd=Math.hypot(pvel.vx,pvel.vy),speedScale=Math.max(1,dashSpd/CFG.DASH_SPEED);
  for (const id of ECS.query('enemy','pos','hp','ai')) {
    const epos=ECS.get(id,'pos'),ehp=ECS.get(id,'hp'),ai=ECS.get(id,'ai');
    if (!ai.dashHit&&Math.hypot(ppos.x-epos.x,ppos.y-epos.y)<32) {
      ehp.hp-=baseBulletDamage()*2*speedScale; ehp.hitFlash=14; ai.dashHit=true;
      spawnParticles(epos.x,epos.y,'#ffaa00',10);
      if (ehp.hp<=0){spawnParticles(epos.x,epos.y,'#ff2222',16);ECS.destroyEntity(id);gs.score+=10*gs.wave;gs.waveKills++;tryDropTicket();gs.health=Math.min(gs.maxHealth,gs.health+CFG.HEALTH_REGEN);updateHUD();checkWave();}
    }
  }
}

function sysEnemyPlayerCollision() {


   

 
  // Tightrope Boots: intangible while dashing
  if (gs.dashTimer > 0 && gs.hasTightropeBoots) return;
  if (gs.invincible>0||gs.frozen) return;
  const ppos=ECS.get(gs.playerId,'pos'); if (!ppos) return;

 
  for (const id of ECS.query('enemy','pos')) {
    const epos=ECS.get(id,'pos');
    if (Math.hypot(ppos.x-epos.x,ppos.y-epos.y)<28) {

     const eaiCheck2 = ECS.get(id, 'ai');
if (eaiCheck2 && eaiCheck2.thrownByFork) {
  eaiCheck2.thrownByFork = false;
  gs.health -= 30; // harder hit than normal contact
  gs.invincible = CFG.INVINCIBLE_FRAMES;
  gs.shakeX = 20; gs.shakeY = 20;
  gs.flawlessThisWave = false;
  triggerSFPHit();
  spawnParticles(ppos.x, ppos.y, '#ffcc88', 18);
  updateHUD();
  if (gs.health <= 0) { gameOver(); return; }
  return;
}
      // Add before gs.health -= line, inside the enemy loop:
const eaiCheck = ECS.get(id,'ai');
if (eaiCheck && eaiCheck.criticalMass && gs.invincible <= 0) {
  if (!eaiCheck.explodeCooldown || eaiCheck.explodeCooldown <= 0) {
    eaiCheck.explodeCooldown = 120;
    detonateExplosiveBullet({damageMult: eaiCheck.rmDmgMult || 3, life:1, isExplosive:true}, epos.x, epos.y);
    gs.health -= 20;
    gs.invincible = CFG.INVINCIBLE_FRAMES;
    gs.flawlessThisWave = false;
    updateHUD();
    if (gs.health <= 0) { gameOver(); return; }
  }
  return;
}



     
      // Knocking Pins: reduced contact damage (8 instead of 20),
      // and the bowl itself damages the enemy it rams into
      if (gs.knockingPinsActive) {
        gs.health-=2; gs.invincible=CFG.INVINCIBLE_FRAMES;
        gs.shakeX=16;gs.shakeY=16; gs.flawlessThisWave=false;
        // Deal damage to the enemy being bowled into
        const ehp=ECS.get(id,'hp');
        if (ehp) {
          ehp.hp-=baseBulletDamage()*120; ehp.hitFlash=14;
          spawnParticles(epos.x,epos.y,'#3333cc',10);
// Knock nearby enemies away from impact
              for (const oid of ECS.query('enemy','pos','vel')) {
                if (oid === id) continue;
                const op = ECS.get(oid,'pos'), ov = ECS.get(oid,'vel');
                const od = Math.hypot(op.x-epos.x, op.y-epos.y);
                if (od < 80) { ov.vx += (op.x-epos.x)/(od||1)*18; ov.vy += (op.y-epos.y)/(od||1)*18; }
              }          if (ehp.hp<=0){
            spawnParticles(epos.x,epos.y,'#ff2222',18);
            ECS.destroyEntity(id);
            gs.score+=Math.round(12*gs.wave); gs.waveKills++;
            tryDropTicket(); gs.health=Math.min(gs.maxHealth,gs.health+CFG.HEALTH_REGEN); updateHUD(); checkWave();
            if (gs.health<=0){gameOver();return;}
            return;
          }
        }
        triggerSFPHit(); spawnParticles(ppos.x,ppos.y,'#3333cc',10); updateHUD();
        if (gs.health<=0){gameOver();return;} return;
      }

      // Replace the gs.health -= 20 line (non-knocking-pins path):
let contactMult = 1;
for (const cid of ECS.query('enemy','pos')) {
  const cepos = ECS.get(cid,'pos');
  if (Math.hypot(ppos.x-cepos.x, ppos.y-cepos.y) < 28) {
    const ceai = ECS.get(cid,'ai');
    if (ceai && ceai.rmDmgMult) contactMult = ceai.rmDmgMult;
    break;
  }
}
gs.health -= Math.round(20 * contactMult);
      gs.invincible=CFG.INVINCIBLE_FRAMES;
      gs.shakeX=16;gs.shakeY=16; gs.flawlessThisWave=false;
      triggerSFPHit(); spawnParticles(ppos.x,ppos.y,'#ff3333',14); updateHUD();
      if (gs.health<=0){gameOver();return;} return;
    }
  }
}

function sysEnemyBullets() {
  const ppos=ECS.get(gs.playerId,'pos');
  gs.enemyBullets=gs.enemyBullets.filter(eb=>{
    if (!gs.frozen){eb.x+=eb.vx;eb.y+=eb.vy;eb.life--;}
if (eb.isTear) {
  if (eb.gravX !== undefined) { eb.vx += eb.gravX; eb.vy += eb.gravY; }
  else if (eb.gravity) eb.vy += eb.gravity;
}

// ── Arc ball physics ──
if (eb.isArcBall) {
  eb.vy += eb.gravity;
  eb.y  += eb.vyHoriz; // vertical world-movement toward target
  // Check if ball has reached target Y or gone past it
  const traveled = Math.hypot(eb.x - eb.startX, eb.y - eb.startY + eb.vyHoriz);
  const totalDist = Math.hypot(eb.targetX - eb.startX, eb.targetY - eb.startY);
  if (eb.life < eb.maxLife - eb.hangTime || Math.hypot(eb.x - eb.targetX, eb.y - eb.targetY) < 22) {
    // Impact!
    spawnParticles(eb.x, eb.y, '#ffdd00', 20);
    spawnParticles(eb.x, eb.y, '#ff8800', 12);
    gs.shakeX = 10; gs.shakeY = 10;
   const scale = eb.sizeScale || 1.0;
        const impactR = Math.round(55 * scale);
        const impactShake = Math.round(10 * scale);

        // Cannonball arc: big explosion on landing
        if (eb.isCannonball) {
          detonateExplosiveBullet({ damageMult: (eb.rmDmgMult || 1) * 4, life: 1, isExplosive: true }, eb.x, eb.y);
          spawnParticles(eb.x, eb.y, '#ff4400', Math.round(30 * scale));
          gs.shakeX = Math.round(22 * scale); gs.shakeY = Math.round(22 * scale);
          // Release the carried enemy entity at landing
          if (eb.carriedId && ECS.has(eb.carriedId, 'pos')) ECS.destroyEntity(eb.carriedId);
          return false;
        }

        // Arc enemy landing: release the enemy at the landing spot
    // Frosting arc: spawn giftbox on impact if flagged
if (eb.isFrosting && eb.spawnGiftBox) {
  const gid = ECS.createEntity();
  const def = ENEMY_DEFS['giftBox'];
  const baseHp = 1 + Math.floor(gs.wave / 2);
  ECS.add(gid, 'enemy', { type: 'giftBox' });
  ECS.add(gid, 'pos', { x: eb.x, y: eb.y, angle: 0 });
  ECS.add(gid, 'vel', { vx: 0, vy: 0 });
  ECS.add(gid, 'hp', { hp: Math.ceil(baseHp * def.hpMult), maxHp: Math.ceil(baseHp * def.hpMult), hitFlash: 0 });
  ECS.add(gid, 'physics', { speed: 0.8 });
  ECS.add(gid, 'ai', { windupTimer: 0, exploded: false, heldByPlayer: false, thrown: false, dashHit: false });
  spawnParticles(eb.x, eb.y, '#ffaa00', 14);
  showMsg('A GIFT BOX FELL FROM THE FROSTING!');
}
        if (eb.isArcEnemy && eb.carriedId && ECS.has(eb.carriedId, 'pos')) {
          const cpos = ECS.get(eb.carriedId, 'pos');
          cpos.x = eb.x; cpos.y = eb.y;
          const cai = ECS.get(eb.carriedId, 'ai');
          const cvel = ECS.get(eb.carriedId, 'vel');
          if (cai) { cai.juggled = false; cai.juggledBy = null; }
          if (cvel) { cvel.vx = (Math.random() - 0.5) * 3; cvel.vy = (Math.random() - 0.5) * 3; }
          spawnParticles(eb.x, eb.y, '#ff8800', 14);
          return false;
        }

        spawnParticles(eb.x, eb.y, '#ffdd00', Math.round(20 * scale));
        spawnParticles(eb.x, eb.y, '#ff8800', Math.round(12 * scale));
        gs.shakeX = impactShake; gs.shakeY = impactShake;
        if (gs.invincible <= 0 && Math.hypot(eb.x - ppos.x, eb.y - ppos.y) < impactR) {
          gs.health -= Math.round(18 * (eb.rmDmgMult || 1) * scale);
          gs.invincible = CFG.INVINCIBLE_FRAMES;
          gs.shakeX = Math.round(16 * scale); gs.shakeY = Math.round(16 * scale);
          gs.flawlessThisWave = false;
          triggerSFPHit(); updateHUD();
          if (gs.health <= 0) { gameOver(); return false; }
        }
        return false;
  }
  // Update shadow position (tracks directly below ball's world XY)
  eb.shadowX = eb.x;
  eb.shadowY = eb.targetY; // shadow stays at ground level at target
}
    if (eb.homing) {
      const dx=ppos.x-eb.x,dy=ppos.y-eb.y,dist=Math.hypot(dx,dy)||1;
      eb.vx+=(dx/dist)*(eb.homingStrength||0.04); eb.vy+=(dy/dist)*(eb.homingStrength||0.04);
      const spd=Math.hypot(eb.vx,eb.vy); if (spd>2){eb.vx=eb.vx/spd*2;eb.vy=eb.vy/spd*2;}
    }

    // Friendly-fire: confused enemy bullets hit other enemies
    if (eb.friendlyFire) {
      for (const eid of ECS.query('enemy','pos','hp')) {
        if (eid===eb.sourceId) continue;
        const epos2=ECS.get(eid,'pos'),ehp2=ECS.get(eid,'hp');
        if (Math.hypot(eb.x-epos2.x,eb.y-epos2.y)<22) {
          ehp2.hp-=2; ehp2.hitFlash=10;
          spawnParticles(epos2.x,epos2.y,'#4488ff',5);
          if (ehp2.hp<=0) {
            spawnParticles(epos2.x,epos2.y,'#ff2222',14); ECS.destroyEntity(eid);
            gs.score+=Math.round(8*gs.wave); gs.waveKills++;
            tryDropTicket(); gs.health=Math.min(gs.maxHealth,gs.health+CFG.HEALTH_REGEN); updateHUD(); checkWave();
          }
          return false;
        }
      }
    }

    if (gs.bouncyHouse) {
      let bounced=false;
      if (eb.x<=4){eb.x=4;eb.vx=Math.abs(eb.vx);bounced=true;}
      if (eb.x>=worldW-4){eb.x=worldW-4;eb.vx=-Math.abs(eb.vx);bounced=true;}
      if (eb.y<=4){eb.y=4;eb.vy=Math.abs(eb.vy);bounced=true;}
      if (eb.y>=worldH-4){eb.y=worldH-4;eb.vy=-Math.abs(eb.vy);bounced=true;}
      if (bounced&&!eb.friendlyFire) {
        eb.bounces=(eb.bounces||0)+1;
        spawnParticles(eb.x,eb.y,'#88ffdd',3);
        gs.bullets.push({
          x:eb.x,y:eb.y,vx:eb.vx,vy:eb.vy,
          angle:Math.atan2(eb.vy,eb.vx),life:80,maxLife:80,damageMult:1,isDud:false,bounces:eb.bounces
        });
        return false;
      }
      if (eb.life<=0||eb.bounces>8) return false;
    } else {
      if (eb.life<=0||eb.x<-10||eb.x>worldW+10||eb.y<-10||eb.y>worldH+10) return false;
    }

    if (!eb.friendlyFire&&gs.invincible<=0&&Math.hypot(eb.x-ppos.x,eb.y-ppos.y)<20) {
      const bulletDmg = Math.round(15 * (eb.rmDmgMult || 1));
      gs.health -= bulletDmg;
      gs.invincible=CFG.INVINCIBLE_FRAMES; gs.shakeX=10;gs.shakeY=10;
      gs.flawlessThisWave=false; triggerSFPHit();
      spawnParticles(ppos.x,ppos.y,'#ff69b4',10); updateHUD();
      if (gs.health<=0){gameOver();return false;} return false;
    }
    return true;
  });
}

function sysFieldItemPickup() {
  const ppos=ECS.get(gs.playerId,'pos');
  for (let i=gs.fieldItems.length-1;i>=0;i--) {
    const fi=gs.fieldItems[i];
    if (Math.hypot(ppos.x-fi.x,ppos.y-fi.y)<34) {
      const def=ITEM_DEFS[fi.id]; gs.itemCooldowns[fi.id]=Date.now(); gs.fieldItems.splice(i,1); def.effect(gs);
      // Show Clippy pickup tip
      if (CLIPPY_PICKUP_TIPS[fi.id]) {
        gs.clippyPickupMsg = CLIPPY_PICKUP_TIPS[fi.id];
        gs.clippyPickupTimer = 240; // 4 seconds
      }
      const permanent=new Set(['bouncy','dash','doubledCake','tripleCake','quadCake','shakeFizzlePop','flawlessBaking','cursedCandles','glowsticks','paperCuts','extraClips','clownishUpgrade','popcornBowl']);
      if (!permanent.has(fi.id)) setTimeout(()=>{if(gameRunning)trySpawnFieldItems();},def.spawnCooldown);
    }
  }
}

function sysPopcorn() {
  if (!gs.hasPopcornBucket||!gs.popcornKernels) return;
  const ppos=ECS.get(gs.playerId,'pos');
  const kernelGoal=gs.hasPopcornBowl?3:5;
  gs.popcornKernels=gs.popcornKernels.filter(k=>{
    if (Math.hypot(k.x-ppos.x,k.y-ppos.y)<22) {
      spawnParticles(k.x,k.y,'#ffdd00',4);
      gs._kernelsCollected=(gs._kernelsCollected||0)+1;
      if (gs._kernelsCollected>=kernelGoal) {
        gs._kernelsCollected=0;
        gs.popcornFrenzyTimer=gs.hasPopcornBowl?360:240;
        showMsg(gs.hasPopcornBowl?'🍿 MEGA FRENZY! MASSIVE EXPLOSION RADIUS!':'🍿 POPCORN FRENZY! BULLETS EXPLODE!');
        spawnPartyParticles(ppos.x,ppos.y);
      }
      return false;
    }
    return true;
  });
}

function sysTimers() {
  // ── Always run these regardless of transition state ──
  for (const p of gs.particles){p.x+=p.vx;p.y+=p.vy;p.vx*=0.91;p.vy*=0.91;p.life--;}
  gs.particles=gs.particles.filter(p=>p.life>0);
 gs.shakeX*=0.72; gs.shakeY*=0.72;
if (Math.abs(gs.shakeX) < 0.1) gs.shakeX = 0;
if (Math.abs(gs.shakeY) < 0.1) gs.shakeY = 0;
  if (muzzleFlash>0) muzzleFlash--;
  if (gs.glowExplosionTimer>0) gs.glowExplosionTimer--;

  // Stage growth — auto-descend when done, no panel
  if (gs.transitioning && !gs.transitionDone) {
    gs.transitionT = Math.min(1, gs.transitionT + 1/90);
    const t=gs.transitionT, ease=t<0.5?2*t*t:-1+(4-2*t)*t;
    worldW=gs.transitionStartW+(gs.transitionEndW-gs.transitionStartW)*ease;
    worldH=gs.transitionStartH+(gs.transitionEndH-gs.transitionStartH)*ease;
    renderScale=CFG.W/worldW;
    canvas.height=Math.round(worldH*renderScale);
    if (gs.transitionT>=1) {
      worldW=gs.transitionEndW; worldH=gs.transitionEndH;
      renderScale=CFG.W/worldW; canvas.height=Math.round(worldH*renderScale);
      gs.transitionDone=true; gs.transitioning=false;
      gs.floor=2;
      unlockGlowsticks(); trySpawnFieldItems();
      showMsg('WELCOME TO THE BIG TOP!');
      const hint=document.getElementById('bottom-hint');
      if (hint) hint.textContent=`WASD:MOVE | MOUSE:AIM | CLICK:SHOOT | ${formatKey(KEYBINDS.reload)}:RELOAD | SHIFT:DASH | ${formatKey(KEYBINDS.prizeWheel)}:PRIZE WHEEL (3 TICKETS)`;
      updateHUD();
    }
  }

 

  if (gs.partyFreezeTimer>0) gs.partyFreezeTimer--;
  if (gs.speedBoostTimer>0)  gs.speedBoostTimer--;
  if (gs.confettiSlowTimer>0) gs.confettiSlowTimer--;
  if (gs.invincible>0) gs.invincible--;
  if (gs.glowCooldown>0) gs.glowCooldown--;
  if (gs.spoonKnockbackTimer>0) gs.spoonKnockbackTimer--;

  if (gs.explosionFreezeTimer>0){gs.explosionFreezeTimer--;return;}
  if (gs.glowExplosionTimer>0) gs.glowExplosionTimer--;

  if (gs.reloading) {
    const reloadSpeed=gs.speedBoostTimer>0?Math.max(1,Math.round(gs.speedBoostMult||1)):1;
    gs.reloadTimer-=reloadSpeed;
    if (gs.reloadTimer<=0){gs.reloading=false;gs.ammo=gs.maxAmmo;updateHUD();showMsg('RELOADED!');}
  }
  if (gs.ammo===0&&!gs.reloading) startReload();

  if (gs.hasCursedCandles) {
    if (gs.candleRelightDelay>0){gs.candleRelightDelay--;}
    else {
      gs.candleHpTimer=(gs.candleHpTimer||0)+1;
      if (gs.candleHpTimer>=60) {
        gs.candleHpTimer=0; gs.health-=5; gs.flawlessThisWave=false;
        if (gs.health<=0){gameOver();return;}
        if (gs.candlesLit<5){
          gs.candlesLit=Math.min(5,gs.candlesLit+1);
          showMsg(gs.candlesLit===5?"ALL CANDLES LIT! +10 BULLETS PER SHOT":`CANDLE LIT! +${gs.candlesLit*2} BULLETS PER SHOT`);
        }
        updateHUD();
      }
    }
  }

 // Clippy intro sequence
if (gs.clippyIntroLines && !gs.clippyIntroDone) {
  gs.clippyIntroTimer++;
  if (gs.clippyIntroTimer >= 210) { // ~3.5 sec per line
    gs.clippyIntroTimer = 0;
    gs.clippyIntroLine = (gs.clippyIntroLine || 0) + 1;
    if (gs.clippyIntroLine >= gs.clippyIntroLines.length) {
      gs.clippyIntroDone = true;
    }
  }
}

  if (gs.hasShakeFizzlePop&&!gs.sfpFull) {
    gs.sfpMeter=Math.min(gs.sfpMax,gs.sfpMeter+1);
    if (gs.sfpMeter>=gs.sfpMax){gs.sfpFull=true;showMsg('SHAKE FIZZLE POP — FULLY CHARGED!!!');}
  }

  if (gs.hasDash&&gs.dashCharges<gs.dashMaxCharges) {
    gs.dashCooldownTimer++;
    if (gs.dashCooldownTimer>=gs.dashCooldownMax) {
      gs.dashCooldownTimer=0; gs.dashCharges++; updateHUD();
      if (gs.dashCharges===gs.dashMaxCharges) showMsg('DASH FULLY CHARGED!');
    }
  }

  for (const id of ECS.query('enemy','ai')) {
  const eai = ECS.get(id,'ai');
  if (eai.explodeCooldown > 0) eai.explodeCooldown--;
}
  


  if (gs.prizeEffect){gs.prizeEffect.timer--;if(gs.prizeEffect.timer<=0){gs.sugarRushActive=false;gs.ricochetActive=false;gs.prizeEffect=null;}}

  if (gs.cursedSpinTimer>0) {
    gs.cursedSpinTimer--;
    if (gs.cursedSpinTimer===0) {
      for (const eid of ECS.query('enemy','physics')) {
        const ephy=ECS.get(eid,'physics');
        if (ephy._cursedBase){ephy.speed=ephy._cursedBase;delete ephy._cursedBase;}
        const eai=ECS.get(eid,'ai'); if (eai) eai.cursedDmgBoost=false;
      }
    }
  }

  if (gs.knockingPinsActive) {
    gs.knockingPinsTimer--;
    if (gs.knockingPinsTimer<=0){gs.knockingPinsActive=false;showMsg('KNOCKING PINS WORE OFF!');}
    else {
      const ppos=ECS.get(gs.playerId,'pos'),pvel=ECS.get(gs.playerId,'vel');
      let nearest=null,nearDist=999999;
      for (const eid of ECS.query('enemy','pos')) {
        const ep=ECS.get(eid,'pos'),d=Math.hypot(ep.x-ppos.x,ep.y-ppos.y);
        if (d<nearDist){nearDist=d;nearest=ep;}
      }
if (nearest) {
        const dx = nearest.x - ppos.x, dy = nearest.y - ppos.y, dist = Math.hypot(dx, dy) || 1;
        const pinSpeed = 18; // raw pixels/frame — bypasses speed cap in movement system
        pvel.vx = (dx / dist) * pinSpeed;
        pvel.vy = (dy / dist) * pinSpeed;
      }    }
  }

  // Clownish: nose grows, blasts bullets + spawns waves; WAVES confuse enemies on contact
if (gs.popcornFrenzyTimer>0) gs.popcornFrenzyTimer--;



  // Bowling ball regen: every 15 seconds after use, give one back
  if (gs.hasBowlingBall && !gs.bowlingBallReady) {
    gs.bowlingBallRegenTimer = (gs.bowlingBallRegenTimer || 0) + 1;
    if (gs.bowlingBallRegenTimer >= 1200) { // 20 sec at 60fps
      gs.bowlingBallReady = true;
      gs.bowlingBallRegenTimer = 0;
      showMsg('BOWLING BALL READY!');
      spawnParticles(ECS.get(gs.playerId,'pos').x, ECS.get(gs.playerId,'pos').y, '#aaaaaa', 10);
    }
  }

 if (gs.hasClownish) {
    if (gs.clownNoseHonkTimer > 0) gs.clownNoseHonkTimer--;
    if (gs.clownNoseCooldown > 0) { gs.clownNoseCooldown--; }
    else {
    gs.clownNoseTimer++;
    gs.clownNoseSize = gs.clownNoseTimer / gs.clownNoseMax;
  if (gs.clownNoseTimer >= gs.clownNoseMax) {
    // Only blast if there's an enemy within 100px
    const ppos3 = ECS.get(gs.playerId, 'pos');
    const nearbyEnemy = ECS.query('enemy', 'pos').some(eid => {
      const ep = ECS.get(eid, 'pos');
      return Math.hypot(ep.x - ppos3.x, ep.y - ppos3.y) < 100;
    });

   if (nearbyEnemy) {
      gs.clownNoseHonkTimer = 14;
      // Defer the reset so the honk squish animation has frames to play
      setTimeout(() => { gs.clownNoseTimer = 0; gs.clownNoseSize = 0; }, 200);

      // Two waves with different speeds — NO stray bullets
  const waveMaxR = gs.hasClownishUpgrade ? 220 : 160;
      gs.clownSoundWaves = [
        { x: ppos3.x, y: ppos3.y, r: 8, maxR: waveMaxR, life: 55, maxLife: 55, speed: 2.4, hitEnemies: new Set() },
        { x: ppos3.x, y: ppos3.y, r: 8, maxR: waveMaxR, life: 44, maxLife: 55, speed: 1.5, hitEnemies: new Set() },
      ];
      gs.clownNoseCooldown = gs.hasClownishUpgrade ? 180 : 300;
      showMsg(gs.hasClownishUpgrade ? 'MEGA CLOWN BLAST! WAVES CONFUSE ENEMIES!' : 'HONK! WAVES CONFUSE NEARBY ENEMIES!');
    } else {
      // No enemy nearby — hold at full, don't reset, keep honk timer ticking
      gs.clownNoseTimer = gs.clownNoseMax; // stay full, don't overflow
    }
  }
}
 }
  // Tick sound wave rings — enemies the wave front passes through get confused
  if (gs.clownSoundWaves && gs.clownSoundWaves.length > 0) {
    const confuseDur = gs.hasClownishUpgrade ? 480 : 300;
    const waveThickness = 18; // px band — enemy must be within this of the wave front
    gs.clownSoundWaves = gs.clownSoundWaves.filter(w => {
      // Expand ring at its own fixed speed rather than easing
      w.r = Math.min(w.maxR, w.r + w.speed);
      w.life--;
      // Check each enemy against this wave's leading edge
      for (const eid of ECS.query('enemy', 'pos', 'ai')) {
        if (w.hitEnemies.has(eid)) continue;
        const epos = ECS.get(eid, 'pos');
        const d = Math.hypot(epos.x - w.x, epos.y - w.y);
        if (d >= w.r - waveThickness && d <= w.r + 4) {
          w.hitEnemies.add(eid);
          const eai = ECS.get(eid, 'ai');
          if (eai) {
            eai.confused = true;
            eai.confuseTimer = confuseDur;
            eai.confuseShootTimer = 0;
            spawnParticles(epos.x, epos.y, '#4488ff', 6);
          }
        }
      }
      return w.life > 0 && w.r < w.maxR;
    });
  }
}

function sysOobCleanup() {
  for (const id of ECS.query('enemy', 'pos', 'ai')) {
    const pos = ECS.get(id, 'pos');
    const ai  = ECS.get(id, 'ai');
    const oob = pos.x < -60 || pos.x > worldW + 60 || pos.y < -60 || pos.y > worldH + 60;
    if (oob) {
      ai._oobTimer = (ai._oobTimer || 0) + 1;
      if (ai._oobTimer >= 300) { // 5 seconds at 60fps
        ECS.destroyEntity(id);
        gs.waveKills++;
        checkWave();
      }
    } else {
      ai._oobTimer = 0;
    }
  }
}

function sysSpawner() {
  gs.spawnTimer++;
  if (gs.spawnTimer>=gs.spawnInterval){gs.spawnTimer=0;spawnEnemy();}
}

function update() {
  sysPlayerMovement(); sysAI(); sysBullets(); sysBulletEnemyCollision();
  sysDashCollision(); sysEnemyPlayerCollision(); sysConfusedEnemyCollision();  sysEnemyBullets();
  sysFieldItemPickup(); sysPopcorn();  sysRagingRings(); sysMirrorMaze(); 
  sysOobCleanup(); sysTimers(); sysSpawner(); 
  tickMeleeWindow(); 
}

function spawnEnemy() {
  if (gs.bossActive) return;
const total = [...ECS.query('enemy')].length;
  if (gs.waveKills+total>=gs.waveEnemiesLeft) return;
  let x,y,attempts=0;
  const ppos=ECS.get(gs.playerId,'pos');
  do {
  x = CFG.WALL_PAD + Math.random() * (worldW - CFG.WALL_PAD * 2);
  y = CFG.WALL_PAD + Math.random() * (worldH - CFG.WALL_PAD * 2);
  attempts++;
} while (Math.hypot(x - ppos.x, y - ppos.y) < CFG.SAFE_SPAWN_DIST && attempts < 12);

  let type='utensil';
  const roll=Math.random();
  if (gs.floor === 2) {
    // Wave-gated unlock curve — new enemy type introduced each bracket
    // Cannonball unlocks first (wave 1 of floor 2 = wave 12+)
    // Juggler unlocks wave 14+, Ringmaster wave 17+, Clown Car wave 20+
    // Rarity stays weighted even after all unlock: cannonball most common, clownCar rarest
    const w = gs.wave;
    if (w >= 20) {
      // All four active — cannonball most common, clown car rarest
      if      (roll < 0.38) type = 'cannonball';
      else if (roll < 0.66) type = 'juggler';
      else if (roll < 0.84) type = 'ringmaster';
      else                  type = 'clownCar';
    } else if (w >= 17) {
      // Ringmaster joins — no clown car yet
      if      (roll < 0.42) type = 'cannonball';
      else if (roll < 0.74) type = 'juggler';
      else                  type = 'ringmaster';
    } else if (w >= 14) {
      // Juggler joins cannonball
      if      (roll < 0.55) type = 'cannonball';
      else                  type = 'juggler';
    } else {
      // Only cannonball (waves 12–13)
      type = 'cannonball';
    }
  } else if (gs.wave>=6){
    if(roll<0.30)type='waterballoon';else if(roll<0.52)type='giftBox';else if(roll<0.72)type='partyHat';
  } else if (gs.wave>=5){
    if(roll<0.32)type='waterballoon';else if(roll<0.58)type='partyHat';
  } else if (gs.wave>=4){ if(roll<0.35)type='waterballoon'; }

  const def=ENEMY_DEFS[type],baseHp=1+Math.floor(gs.wave/2),id=ECS.createEntity();
  const subtypes=['fork','knife','spoon'];
  ECS.add(id,'enemy',{type,subtype:type==='utensil'?subtypes[Math.floor(Math.random()*3)]:undefined});
  ECS.add(id,'pos',{x,y,angle:0}); ECS.add(id,'vel',{vx:0,vy:0});

 
 const hpMult = (gs._enemyHpMult || 1.0);
 ECS.add(id,'hp',{hp:Math.ceil(baseHp*def.hpMult*hpMult), maxHp:Math.ceil(baseHp*def.hpMult*hpMult), hitFlash:0});

 
  ECS.add(id,'physics',{speed:(1.2+Math.random()*0.6+gs.wave*0.12)*def.speedMult});
ECS.add(id,'ai',{shootCooldown:120,ambushTimer:0,diveTimer:0,dashHit:false,balloonOrient:type==='waterballoon'?Math.floor(Math.random()*4):0});  spawnParticles(x, y, '#ff4400', 10);
}

function spawnBoss() {
  const ppos = ECS.get(gs.playerId, 'pos');
  const x = ppos.x > worldW / 2 ? 120 : worldW - 120;
  const y = ppos.y > worldH / 2 ? 120 : worldH - 120;
  const id = ECS.createEntity();
  const bossHp = CFG.BOSS_BASE_HP + gs.wave * 12;
  ECS.add(id, 'enemy', { type: 'cakeBoss' });
  ECS.add(id, 'pos', { x, y, angle: 0 });
  ECS.add(id, 'vel', { vx: 0, vy: 0 });
  ECS.add(id, 'hp', { hp: bossHp, maxHp: bossHp, hitFlash: 0 });
  ECS.add(id, 'physics', { speed: CFG.BOSS_SPEED });
  ECS.add(id, 'ai', {
    bossPhase: 'IDLE', phaseTimer: 140,
    candlesLit: 5, candleTimer: 80,
    idleSpin: 0, spiralAngle: 0,
    bounceCount: 0, permanentSpiral: false,
    shootCooldown: 0, ambushTimer: 0,
    diveTimer: 0, dashHit: false,
  });
  spawnParticles(x, y, '#ff69b4', 20);
  gs.bossId = id;
}

function shoot() {
  if (gs.ammo<=0||gs.reloading) return;
  gs.ammo--; muzzleFlash=10; updateHUD(); gunRecoil=1.0;
  gs.shakeX=(Math.random()-.5)*13; gs.shakeY=(Math.random()-.5)*13;
  const muzzle=gunMuzzlePos();

  // ── Bowling Ball shot ──
  if (gs.bowlingBallReady) {
    gs.bowlingBallReady = false;
    const dmg = baseBulletDamage() * 8; // always full multiplier, never dud
    gs.bullets.push({
      x: muzzle.x, y: muzzle.y,
      vx: Math.cos(gunAngle) * 10.0,
      vy: Math.sin(gunAngle) * 10.0,
      angle: gunAngle,
      life: 220, maxLife: 220,
      damageMult: dmg,
      isDud: false,
      isBowlingBall: true,
      bounces: 0,
      hitEnemies: new Set(), // pierce tracking
    });
    gs.shakeX = (Math.random()-.5)*8; gs.shakeY = (Math.random()-.5)*8;
    spawnParticles(muzzle.x, muzzle.y, '#aaaaaa', 10);
    showMsg('STRIKE!!!');
    return;
  }

  let doubleCount=0;
  const totalBullets=CFG.BULLET_COUNT+(gs.hasCursedCandles?gs.candlesLit*2:0);
  for (let i=0;i<totalBullets;i++) {
    const a=gunAngle+(Math.random()-.5)*.32;
    let damageMult = baseBulletDamage();
    let isDud = false;
    if (gs.hasQuadCake)        { if (Math.random() < 0.50) isDud = true; }
    else if (gs.hasTripleCake) { if (Math.random() < 0.45) isDud = true; }
    else if (gs.hasDoubleCake) { if (Math.random() < 0.40) isDud = true; }
    const finalMult = isDud ? 1 : damageMult * (gs.sfpFull ? 1.5 : 1);
    gs.bullets.push({
      x: muzzle.x, y: muzzle.y,
      vx: Math.cos(a) * CFG.BULLET_SPEED,
      vy: Math.sin(a) * CFG.BULLET_SPEED,
      angle: a, life: CFG.BULLET_LIFE,
      damageMult: finalMult, isDud
    });
  }
  spawnParticles(muzzle.x,muzzle.y,doubleCount>0?'#ff44ff':'#ff8800',doubleCount>0?8:6);
}

function startReload() {
  if (gs.reloading||gs.ammo===gs.maxAmmo) return;
  gs.reloading=true; gs.reloadTimer=CFG.RELOAD_FRAMES; showMsg('RELOADING...');
}

function tryDash() {
  if (!gs.hasDash||gs.dashCharges<=0||gs.dashTimer>0) return;
  gs.dashCharges--; updateHUD();
  const ppos=ECS.get(gs.playerId,'pos'),pvel=ECS.get(gs.playerId,'vel');
  const spd=Math.hypot(pvel.vx,pvel.vy);
  if (spd>0.3){gs.dashVx=(pvel.vx/spd)*CFG.DASH_SPEED;gs.dashVy=(pvel.vy/spd)*CFG.DASH_SPEED;}
  else{gs.dashVx=Math.cos(gunAngle)*CFG.DASH_SPEED;gs.dashVy=Math.sin(gunAngle)*CFG.DASH_SPEED;}
  gs.dashTimer=CFG.DASH_FRAMES; gs.invincible=Math.max(gs.invincible,CFG.DASH_FRAMES+4);
  spawnParticles(ECS.get(gs.playerId,'pos').x,ECS.get(gs.playerId,'pos').y,'#ffaa00',8);
}

function checkWave() {
  if (gs.waveKills>=gs.waveEnemiesLeft&&ECS.query('enemy').length===0) {
    const completed=gs.wave;
    if (gs.hasFlawlessBaking && gs.flawlessThisWave) {
      gs.maxAmmo += 2;
      if (gs.hasExtraClips) gs.maxAmmo = Math.ceil(gs.maxAmmo * 1.25);
      gs.ammo = Math.min(gs.ammo + 2, gs.maxAmmo);
      updateHUD();
      showMsg('FLAWLESS BAKING! +2 MAX AMMO!');
      spawnPartyParticles(CFG.W/2, CFG.H/2);
    }

    if (gs.floor === 2) {
      const f2wave = gs.wave - 11;
      gs.waveEnemiesLeft = CFG.WAVE_ENEMIES_FLOOR2_BASE + Math.max(1, f2wave) * CFG.WAVE_ENEMIES_FLOOR2_GROWTH;
      gs.spawnInterval = Math.max(75, CFG.SPAWN_INTERVAL_BASE - Math.max(1, f2wave) * CFG.WAVE_SPAWN_SPEEDUP);
    } else {
      const f2wave = gs.wave - 11;
gs.waveEnemiesLeft = CFG.WAVE_ENEMIES_FLOOR2_BASE + Math.max(1, f2wave) * CFG.WAVE_ENEMIES_FLOOR2_GROWTH;
gs.spawnInterval = Math.max(75, CFG.SPAWN_INTERVAL_BASE - Math.max(1, f2wave) * CFG.WAVE_SPAWN_SPEEDUP);
    }

    gs.waveKills=0; gs.flawlessThisWave=true;
    if (gs.hasCursedCandles&&gs.candlesLit>0) {
      gs.maxAmmo=Math.max(CFG.MAX_AMMO,gs.maxAmmo-gs.candlesLit*2);
      gs.ammo=Math.min(gs.ammo,gs.maxAmmo); gs.candlesLit=0; gs.candleHpTimer=0;
      gs.candleRelightDelay=180; showMsg('CANDLES SNUFFED! THEY WILL RELIGHT...');
    }
    updateHUD();
   
gs.wave++;

if (completed === CFG.BOSS_WAVE) {
  gs.wave--; // revert — stay on wave 10 until boss dies
  gs.bossActive = true;
  spawnBoss();
  gs.waveEnemiesLeft = 5;
  gs.waveKills = 0;
  gs.spawnInterval = Math.max(120, CFG.SPAWN_INTERVAL_BASE * 2);
  gs.flawlessThisWave = true;
  showMsg('BOSS INCOMING — WAVE ' + gs.wave + '!');
  updateHUD();
  return;
}

if (gs.floor === 2 && gs.wave === CFG.BOSS2_WAVE) {
      // ... boss2 spawn 
      gs.bossActive = true;
      // spawn boss2
      const ppos = ECS.get(gs.playerId, 'pos');
      const x = ppos.x > worldW/2 ? 160 : worldW - 160;
      const y = ppos.y > worldH/2 ? 160 : worldH - 160;
      const id = ECS.createEntity();
      ECS.add(id, 'enemy', { type: 'boss2' });
      ECS.add(id, 'pos', { x, y, angle: 0 });
      ECS.add(id, 'vel', { vx: 0, vy: 0 });
      const b2hp = CFG.BOSS_BASE_HP + gs.wave * 16;
      ECS.add(id, 'hp', { hp: b2hp, maxHp: b2hp, hitFlash: 0 });
      ECS.add(id, 'physics', { speed: CFG.BOSS_SPEED * 1.1 });
     ECS.add(id, 'ai', {
  bossPhase: 'IDLE', phaseTimer: 100,
  spiralAngle: 0, volleyCount: 0, volleyTimer: 0,
  shootCooldown: 120, ambushTimer: 0, diveTimer: 0, dashHit: false,
  balloonOrient: Math.floor(Math.random() * 4)
});

      
      gs.bossId = id;
      showMsg('THE RINGMASTER BOSS — WAVE ' + gs.wave + '!');
    } else if (completed % 3 === 0) {
      setTimeout(()=>offerItemChoice(),300);
    } else {
      showMsg(`WAVE ${gs.wave} - INCOMING!`); trySpawnFieldItems();
    }
    
  }
}

function trySpawnFieldItems() {
  const now=Date.now();
  const permanent=new Set(['bouncy','dash','doubledCake','tripleCake','quadCake','shakeFizzlePop','flawlessBaking','cursedCandles','glowsticks','paperCuts','extraClips','clownishUpgrade','popcornBowl']);
  for (const id of gs.unlockedItems) {
    if (gs.fieldItems.some(fi=>fi.id===id)) continue;
    if (id==='bouncy'&&gs.bouncyHouse) continue;
    if (id==='dash'&&gs.hasDash) continue;
    if (id==='doubledCake'&&gs.hasDoubleCake) continue;
    if (id==='tripleCake'&&gs.hasTripleCake) continue;
    if (id==='quadCake'&&gs.hasQuadCake) continue;
    if (id==='shakeFizzlePop'&&gs.hasShakeFizzlePop) continue;
    if (id==='flawlessBaking'&&gs.hasFlawlessBaking) continue;
    if (id==='cursedCandles'&&gs.hasCursedCandles) continue;
    if (id==='glowsticks') continue;
    if (id==='paperCuts'&&gs.hasPaperCuts) continue;
    if (id==='extraClips'&&gs.hasExtraClips) continue;
    if (id==='clownishUpgrade'&&gs.hasClownishUpgrade) continue;
    if (id==='popcornBowl'&&gs.hasPopcornBowl) continue;
    const def=ITEM_DEFS[id],last=gs.itemCooldowns[id]||0;
    if (now-last>=def.spawnCooldown||last===0)
      gs.fieldItems.push({id,x:80+Math.random()*(worldW-160),y:80+Math.random()*(worldH-160),phase:Math.random()*Math.PI*2});
  }
}

const GENERAL_ITEM_IDS=['paperCuts','extraClips'];

function offerItemChoice() {
  gs.pendingChoice=true; gameRunning=false; cancelAnimationFrame(animId); draw();
  const choiceEl=document.getElementById('item-choice'),cardsEl=document.getElementById('item-cards');
  cardsEl.innerHTML='';
  const floorPool=gs.floor===2?FLOOR2_ITEM_IDS:ALL_ITEM_IDS;
let floorAvailable=floorPool.filter(id=>{
    if(id==='doubledCake'&&(gs.hasTripleCake||gs.hasQuadCake))return false;
    if(id==='tripleCake'&&(!gs.hasDoubleCake||(gs.hasTripleCake||gs.hasQuadCake)))return false;
    if(id==='quadCake'&&(!gs.hasTripleCake||gs.hasQuadCake))return false;
    return !gs.unlockedItems.includes(id);
  });
  const upgradePool=[];
  if(gs.hasClownish&&!gs.hasClownishUpgrade) upgradePool.push('clownishUpgrade');
  if(gs.hasPopcornBucket&&!gs.hasPopcornBowl) upgradePool.push('popcornBowl');
  floorAvailable=[...floorAvailable,...upgradePool];
  const generalAvailable=GENERAL_ITEM_IDS.filter(id=>!gs.unlockedItems.includes(id));
  let offered=[],fi=0,gi=0;
  const shuffledFloor=shuffle(floorAvailable),shuffledGeneral=shuffle(generalAvailable);
const slotCount = gs.floor === 2 ? 4 : 3;
for (let slot=0;slot<slotCount;slot++) {    const useGeneral=generalAvailable.length>0&&gi<shuffledGeneral.length&&Math.random()<0.20;
    if(useGeneral)offered.push(shuffledGeneral[gi++]);
    else if(fi<shuffledFloor.length)offered.push(shuffledFloor[fi++]);
    else if(gi<shuffledGeneral.length)offered.push(shuffledGeneral[gi++]);
  }
offered=[...new Set(offered)].slice(0, gs.floor === 2 ? 4 : 3);
  for (const id of offered) {
    const def=ITEM_DEFS[id],isOwned=gs.unlockedItems.includes(id);
    const card=document.createElement('div');
    card.className=`item-card${isOwned?' already-owned':''}`;
    if(id==='doubledCake'){card.style.background='#001133';card.style.borderColor='#4488ff';}
    else if(id==='tripleCake'){card.style.background='#220022';card.style.borderColor='#cc44ff';}
    else if(id==='quadCake'){card.style.background='#220000';card.style.borderColor='#ff3333';}
    else if(id==='paperCuts'){card.style.background='#001a1a';card.style.borderColor='#00ffcc';}
    else if(id==='extraClips'){card.style.background='#1a1a00';card.style.borderColor='#ffdd00';}
    else if(id==='clownishUpgrade'){card.style.background='#001133';card.style.borderColor='#4488ff';}
    else if(id==='popcornBowl'){card.style.background='#1a0a00';card.style.borderColor='#ffaa00';}
   card.innerHTML = `
  <div class="ic-icon">${
    def.img
      ? `<img src="${def.img}" style="width:100px;height:100px;image-rendering:pixelated;">`
      : def.icon
  }</div><div class="ic-name">${def.label.replace(/\n/g,'<br>')}</div><div class="ic-desc">${def.desc.replace(/\n/g,'<br>')}${isOwned?'<br><br>[OWNED]':''}</div>`;
    if (!isOwned) card.addEventListener('click',()=>{gs.unlockedItems.push(id);def.effect(gs);choiceEl.style.display='none';gs.pendingChoice=false;gameRunning=true;trySpawnFieldItems();updateHUD();loop();});
    cardsEl.appendChild(card);
  }
  choiceEl.style.display='flex';
  const skipBtn=document.getElementById('skip-btn');
  const allOwned=offered.length===0||offered.every(id=>gs.unlockedItems.includes(id));
  skipBtn.style.display=allOwned?'block':'none';
  skipBtn.onclick=()=>{choiceEl.style.display='none';gs.pendingChoice=false;gameRunning=true;trySpawnFieldItems();updateHUD();loop();};
}

function tryDropTicket() {
  if (gs.floor!==2) return;
  if (Math.random()<0.5&&gs.tickets<10){gs.tickets++;updateHUD();}
}

function spinPrizeWheel() {
  if (gs.floor!==2||gs.tickets<3||!gameRunning) return;
  gs.tickets-=3; updateHUD();
  const roll=Math.random(); let name;
  if(roll<0.18){name="🔴 CURSED SPIN! ENEMIES ENRAGED!";gs.cursedSpinTimer=480;for(const eid of ECS.query('enemy','physics','ai')){const ephy=ECS.get(eid,'physics');ephy._cursedBase=ephy._cursedBase||ephy.speed;ephy.speed=ephy._cursedBase*1.5;ECS.get(eid,'ai').cursedDmgBoost=true;}spawnParticles(ECS.get(gs.playerId,'pos').x,ECS.get(gs.playerId,'pos').y,'#ff0000',20);gs.prizeEffect={name,timer:480};}
  else if(roll<0.36){name="🟡 SUGAR RUSH! 3x SPEED!";gs.sugarRushActive=true;gs.speedBoostTimer=600;gs.speedBoostMult=3;gs.prizeEffect={name,timer:600};}
  else if(roll<0.52){name="🟢 BIG WINNER! FULL HEAL!";gs.health=gs.maxHealth;gs.invincible=300;spawnPartyParticles(ECS.get(gs.playerId,'pos').x,ECS.get(gs.playerId,'pos').y);gs.prizeEffect={name,timer:180};updateHUD();}
  else if(roll<0.68){name="🔵 RICOCHET! CHAIN BULLETS!";gs.ricochetActive=true;gs.prizeEffect={name,timer:600};}
  else if(roll<0.84){name="🟣 SPOTLIGHT! ENEMIES FROZEN!";gs.partyFreezeTimer=180;spawnPartyParticles(ECS.get(gs.playerId,'pos').x,ECS.get(gs.playerId,'pos').y);gs.prizeEffect={name,timer:180};}
  else{name="⚪ DUD. YOU GOT SCAMMED.";gs.prizeEffect={name,timer:180};}
  showMsg(name);
}

function handleBossDeath(id) {
  if (gs.bossId !== id) return;
  gs.bossActive = false;
  gs.bossId = null;
  gs.wave++;
  gs.waveKills = 0;
  gs.waveEnemiesLeft = CFG.WAVE_ENEMIES_BASE + gs.wave * CFG.WAVE_ENEMIES_GROWTH;
  gs.spawnInterval = Math.max(55, CFG.SPAWN_INTERVAL_BASE - gs.wave * CFG.WAVE_SPAWN_SPEEDUP);
  gs.flawlessThisWave = true;
  updateHUD();
  showMsg('BOSS DEFEATED! ARENA EXPANDING...');
  // Delay the transition slightly so death particles finish
  setTimeout(() => {
    gs.transitioning = true;
    gs.transitionT = 0;
    gs.transitionStartW = worldW;
    gs.transitionStartH = worldH;
    gs.transitionEndW = 1050;
    gs.transitionEndH = 690;
    gs.transitionDone = false;
  }, 1200);
}
