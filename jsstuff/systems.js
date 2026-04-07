// ============================================================
// CLIPBLAST: PARTY HUNTER — Systems
// All sys* functions, update(), spawn helpers,
// shoot/reload/dash, wave/item logic, tickets/prize wheel
// ============================================================

// ================================================================
// HELPERS
// ================================================================
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
    gs.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 28, maxLife: 28, color, size: 3 + Math.random() * 4 });
  }
}

function spawnPartyParticles(x, y) {
  const colors = ['#ff69b4','#ffdd00','#00ff66','#ff4444','#88aaff','#ffffff','#ffaa00','#ff88cc'];
  for (let i = 0; i < 60; i++) {
    const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 9;
    gs.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 90, maxLife: 90, color: colors[i % colors.length], size: 4 + Math.random() * 7 });
  }
}

function angleDiff(a, b) {
  let diff = (a - b + Math.PI) % (Math.PI * 2) - Math.PI;
  return Math.abs(diff);
}

function baseBulletDamage() {
  if (gs.hasQuadCake)   return 4;
  if (gs.hasTripleCake) return 3;
  if (gs.hasDoubleCake) return 2;
  return 1;
}

// Returns world position of gun muzzle tip for bullet spawn / muzzle flash
function gunMuzzlePos() {
  const tipDist = 90 * 0.68;
  return {
    x: gunX + Math.cos(gunAngle) * tipDist,
    y: gunY + Math.sin(gunAngle) * tipDist,
  };
}

// ================================================================
// EXPLOSIVE BULLET DETONATION
// Called whenever a bullet with isExplosive:true hits something.
// Deals AoE damage to enemies in radius, shakes screen, and
// freezes the game loop for a few frames (hitflash-style pause).
// ================================================================
function detonateExplosiveBullet(b, hitX, hitY) {
  const EXPLODE_RADIUS = 90;
  const EXPLODE_DMG    = (b.damageMult || 1) * 3;
  const FREEZE_FRAMES  = 3; // brief freeze on detonation

  spawnPartyParticles(hitX, hitY);
  spawnParticles(hitX, hitY, '#00ff88', 20);
  spawnParticles(hitX, hitY, '#ffffff', 12);
  gs.shakeX = 18; gs.shakeY = 18;
  gs.glowExplosionX = hitX;
  gs.glowExplosionY = hitY;
  gs.glowExplosionTimer = 10; // draw a ring flash for 10 frames

  // Brief game freeze (pause loop for N frames worth of ms)
  gs.explosionFreezeTimer = (gs.explosionFreezeTimer || 0) + FREEZE_FRAMES;

  // AoE damage to all enemies in radius
  const toKill = [];
  for (const eid of ECS.query('enemy', 'pos', 'hp')) {
    const epos = ECS.get(eid, 'pos');
    const ehp  = ECS.get(eid, 'hp');
    const d = Math.hypot(epos.x - hitX, epos.y - hitY);
    if (d < EXPLODE_RADIUS) {
      ehp.hp -= EXPLODE_DMG;
      ehp.hitFlash = 14;
      spawnParticles(epos.x, epos.y, '#00ff88', 8);
      if (ehp.hp <= 0) toKill.push(eid);
    }
  }
  for (const eid of toKill) {
    const epos = ECS.get(eid, 'pos');
    if (epos) spawnParticles(epos.x, epos.y, '#ff2222', 18);
    ECS.destroyEntity(eid);
    gs.score += Math.round(15 * gs.wave);
    gs.waveKills++;
    tryDropTicket();
    gs.health = Math.min(gs.maxHealth, gs.health + CFG.HEALTH_REGEN);
    updateHUD();
  }
  if (toKill.length > 0) checkWave();

  b.life = 0; // consume the bullet
}

// ================================================================
// ITEM-TRIGGERED HELPERS
// ================================================================

function triggerSFPHit() {
  if (!gs.hasShakeFizzlePop) return;
  if (gs.sfpFull) {
    const ppos = ECS.get(gs.playerId, 'pos');
    const shockDmg = baseBulletDamage() * 5;
    for (const id of ECS.query('enemy', 'pos', 'hp', 'vel')) {
      const epos = ECS.get(id, 'pos');
      const ehp  = ECS.get(id, 'hp');
      const evel = ECS.get(id, 'vel');
      const dx = epos.x - ppos.x, dy = epos.y - ppos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 400) {
        ehp.hp -= shockDmg; ehp.hitFlash = 16;
        const nd = dist > 1 ? dist : 1;
        evel.vx += (dx / nd) * 12;
        evel.vy += (dy / nd) * 12;
        spawnParticles(epos.x, epos.y, '#ff6600', 10);
        if (ehp.hp <= 0) {
          spawnParticles(epos.x, epos.y, '#ff2222', 18);
          ECS.destroyEntity(id);
          gs.score += Math.round(10 * gs.wave);
          gs.waveKills++;
          tryDropTicket();
          gs.health = Math.min(gs.maxHealth, gs.health + CFG.HEALTH_REGEN);
          updateHUD(); 
        }
      }
    }
    spawnPartyParticles(ppos.x, ppos.y);
    showMsg('SHOCKWAVE RELEASE!!!');
    setTimeout(() => checkWave(), 0);
  }
  gs.sfpMeter = 0;
  gs.sfpFull = false;
}

function unlockGlowsticks() {
  if (gs.hasGlowsticks) return;
  gs.hasGlowsticks = true;
  gs.unlockedItems.push('glowsticks');
  showMsg('GLOWSTICKS UNLOCKED! RIGHT-CLICK TO SWING & REFLECT SHOTS — REFLECTED SHOTS EXPLODE!');
  updateHUD();
}

function swingGlowsticks() {
  if (!gs.hasGlowsticks || gs.glowCooldown > 0) return;
  gs.glowCooldown = CFG.GLOW_COOLDOWN;
  meleeSwingTimer = CFG.MELEE_SWING_FRAMES;

  const ppos = ECS.get(gs.playerId, 'pos');
  // Melee damage scales with bullet damage — base 3x bullet damage
  const meleeDmg = baseBulletDamage() * 3;

  // ── Reflect enemy bullets in range ──
  // Reflected bullets become EXPLOSIVE: they detonate on next collision.
  for (let i = gs.enemyBullets.length - 1; i >= 0; i--) {
    const eb = gs.enemyBullets[i];
    const dx = eb.x - ppos.x, dy = eb.y - ppos.y;
    const dist = Math.hypot(dx, dy);
    if (dist < CFG.MELEE_RANGE) {
      const reflectAngle = Math.atan2(-eb.vy, -eb.vx);
      const reflectSpeed = Math.max(8, Math.hypot(eb.vx, eb.vy) * 2.0);
      const reflected = {
        x: eb.x, y: eb.y,
        vx: Math.cos(reflectAngle) * reflectSpeed,
        vy: Math.sin(reflectAngle) * reflectSpeed,
        life: 120, maxLife: 120,
        angle: reflectAngle,
        damageMult: baseBulletDamage() * 2,
        isDud: false,
        isReflected: true,
        isExplosive: true   // ← KEY: reflected bullets explode on impact
      };
      gs.bullets.push(reflected);
      gs.enemyBullets.splice(i, 1);
      spawnParticles(eb.x, eb.y, '#00ff88', 8);
    }
  }

  // ── Reflect / deflect charging cannonballs ──
  for (const id of ECS.query('enemy', 'pos', 'hp', 'ai')) {
    const type = ECS.get(id, 'enemy').type;
    if (type !== 'cannonball') continue;
    const epos = ECS.get(id, 'pos');
    const eai  = ECS.get(id, 'ai');
    const ehp  = ECS.get(id, 'hp');
    const evel = ECS.get(id, 'vel');
    if (eai.chargeState !== 'CHARGING') continue;
    const dx = epos.x - ppos.x, dy = epos.y - ppos.y;
    const dist = Math.hypot(dx, dy);
    if (dist < CFG.MELEE_RANGE + 10) {
      // Reflect the cannonball — reverse its velocity toward wherever the player aimed
      const reflectAngle = gunAngle; // send it in the gun's facing direction
      const chargeSpd = Math.hypot(evel.vx, evel.vy);
      evel.vx = Math.cos(reflectAngle) * Math.max(chargeSpd, 14);
      evel.vy = Math.sin(reflectAngle) * Math.max(chargeSpd, 14);
      eai.chargeTarget = {
        x: epos.x + Math.cos(reflectAngle) * 400,
        y: epos.y + Math.sin(reflectAngle) * 400,
      };
      // Mark it so that when it hits something it detonates like an explosive bullet
      eai.reflectedByGlowstick = true;

      spawnParticles(epos.x, epos.y, '#00ff88', 18);
      spawnParticles(epos.x, epos.y, '#ffffff', 8);
      gs.shakeX = 14; gs.shakeY = 14;
      showMsg('CANNONBALL REDIRECTED! IT\'LL EXPLODE ON IMPACT!');
      continue; // don't also do the explode-on-reflect logic below
    }
  }

  // ── Normal melee hits on enemies in the swing cone ──
  for (const id of ECS.query('enemy', 'pos', 'hp')) {
    const eai2 = ECS.get(id, 'ai');
    const type2 = ECS.get(id, 'enemy').type;
    if (type2 === 'cannonball' && eai2 && eai2.chargeState === 'CHARGING') continue;
    const epos = ECS.get(id, 'pos');
    const ehp  = ECS.get(id, 'hp');
    const evel = ECS.get(id, 'vel');
    const dx = epos.x - ppos.x, dy = epos.y - ppos.y;
    const dist = Math.hypot(dx, dy);
    if (dist < CFG.MELEE_RANGE && dist > 5) {
      const enemyAngle = Math.atan2(dy, dx);
      if (angleDiff(enemyAngle, gunAngle) < CFG.MELEE_CONE_ANGLE) {
        ehp.hp -= meleeDmg; ehp.hitFlash = 12;
        const knockDist = dist > 0 ? dist : 1;
        if (evel) { evel.vx += (dx / knockDist) * 7; evel.vy += (dy / knockDist) * 7; }
        spawnParticles(epos.x, epos.y, '#00ff88', 9);
        if (ehp.hp <= 0) {
          spawnParticles(epos.x, epos.y, '#ff2222', 18);
          ECS.destroyEntity(id);
          gs.score += Math.round(15 * gs.wave);
          gs.waveKills++;
          tryDropTicket();
          gs.health = Math.min(gs.maxHealth, gs.health + CFG.HEALTH_REGEN);
          updateHUD(); checkWave();
        }
      }
    }
  }
  const muzzle = gunMuzzlePos();
  spawnParticles(muzzle.x, muzzle.y, '#00ff88', 14);
}

// ================================================================
// SYSTEM 1: Player Movement
// ================================================================
// ================================================================
// SYSTEM 1: Player Movement  — REPLACE the existing sysPlayerMovement
// ================================================================
function sysPlayerMovement() {
  const pId = gs.playerId;
  const pos = ECS.get(pId, 'pos');
  const vel = ECS.get(pId, 'vel');
  const dashing = gs.dashTimer > 0;
  const slowed  = gs.confettiSlowTimer > 0;

  let speedMult = 1;
  if (gs.speedBoostTimer > 0) speedMult = gs.speedBoostMult || CFG.SPEED_BOOST_MULT;
  if (gs.sfpFull) speedMult = Math.max(speedMult, 1.3);
  if (gs.hasTightropeBoots) speedMult = Math.max(speedMult, 1.25);

  const topSpd = slowed
    ? CFG.PLAYER_SPEED * 0.45
    : (gs.speedBoostTimer > 0 ? CFG.PLAYER_SPEED * speedMult : CFG.PLAYER_SPEED);

  if (dashing) {
    gs.dashTimer--;
    gs.dashTrail.push({ x: pos.x, y: pos.y, life: 12, angle: playerMoveAngle });
    vel.vx = gs.dashVx;
    vel.vy = gs.dashVy;
  } else {
    let ix = 0, iy = 0;
    if (!gs.forkGrabbed) {
      // Primary binds from KEYBINDS; arrow keys always work as fallback
      if (keys[KEYBINDS.moveLeft]  || keys['ArrowLeft'])  ix--;
      if (keys[KEYBINDS.moveRight] || keys['ArrowRight']) ix++;
      if (keys[KEYBINDS.moveUp]    || keys['ArrowUp'])    iy--;
      if (keys[KEYBINDS.moveDown]  || keys['ArrowDown'])  iy++;
    }
    if (ix && iy) { ix *= 0.707; iy *= 0.707; }
    if (ix || iy) { vel.vx += ix * 0.38 * topSpd; vel.vy += iy * 0.38 * topSpd; }
    else { vel.vx *= 0.82; vel.vy *= 0.82; }
    const spd = Math.hypot(vel.vx, vel.vy);
    if (spd > topSpd) { vel.vx = vel.vx / spd * topSpd; vel.vy = vel.vy / spd * topSpd; }
  }

  pos.x += vel.vx;
  pos.y += vel.vy;

  const bouncy = gs.bouncyHouse;
  if (pos.x < CFG.WALL_PAD)          { pos.x = CFG.WALL_PAD;          vel.vx = bouncy ? Math.abs(vel.vx)  : 0; }
  if (pos.x > worldW - CFG.WALL_PAD) { pos.x = worldW - CFG.WALL_PAD; vel.vx = bouncy ? -Math.abs(vel.vx) : 0; }
  if (pos.y < CFG.WALL_PAD)          { pos.y = CFG.WALL_PAD;          vel.vy = bouncy ? Math.abs(vel.vy)  : 0; }
  if (pos.y > worldH - CFG.WALL_PAD) { pos.y = worldH - CFG.WALL_PAD; vel.vy = bouncy ? -Math.abs(vel.vy) : 0; }

  const moveSpd = Math.hypot(vel.vx, vel.vy);
  if (moveSpd > 0.5) {
    playerMoveAngle = Math.atan2(vel.vy, vel.vx);
  } else {
    let da = gunAngle - playerMoveAngle;
    while (da > Math.PI)  da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    playerMoveAngle += da * 0.04;
  }

  if (moveSpd > 0.5) {
    playerBobTimer += moveSpd * 0.08;
  } else {
    playerBobTimer *= 0.85;
  }

  const MAX_HOLD_DIST = 50;
  const mdx = mouse.x - pos.x;
  const mdy = mouse.y - pos.y;
  const mouseDist = Math.hypot(mdx, mdy) || 1;
  const holdDist = Math.min(mouseDist, MAX_HOLD_DIST);
  const targetGunX = pos.x + (mdx / mouseDist) * holdDist;
  const targetGunY = pos.y + (mdy / mouseDist) * holdDist;

  gunX += (targetGunX - gunX) * 0.18;
  gunY += (targetGunY - gunY) * 0.18;

  gunAngle = Math.atan2(mouse.y - gunY, mouse.x - gunX);
  const targetGunAngle = Math.atan2(mouse.y - pos.y, mouse.x - pos.x);
  let da = targetGunAngle - gunAngle;
  while (da > Math.PI)  da -= Math.PI * 2;
  while (da < -Math.PI) da += Math.PI * 2;
  gunAngle += da * 0.25;

  gs.dashTrail = gs.dashTrail.filter(t => { t.life--; return t.life > 0; });

  if (gs.heldGiftBox !== null) {
    if (!ECS.has(gs.heldGiftBox, 'pos')) {
      gs.heldGiftBox = null;
    } else {
      const hbpos = ECS.get(gs.heldGiftBox, 'pos');
      const ppos = ECS.get(gs.playerId, 'pos');
      hbpos.x = ppos.x + Math.cos(gunAngle) * 36;
      hbpos.y = ppos.y + Math.sin(gunAngle) * 36;
    }
  }
}
// ================================================================
// SYSTEM 2: AI (Behavior Trees)
// ================================================================
function sysAI() {
  gs.frozen = gs.partyFreezeTimer > 0;
  const enemies = ECS.query('enemy', 'pos', 'vel', 'ai', 'physics');
  for (const id of enemies) {

    const ai2 = ECS.get(id,'ai');
    if (ai2 && ai2.juggled) {
      const type = ECS.get(id,'enemy').type;
      if (type === 'mask') {
        const pos2 = ECS.get(id,'pos');
        const pp2 = playerPos(gs);
        if (pp2 && ai2.shootCooldown !== undefined) {
          ai2.shootCooldown = (ai2.shootCooldown||120) - 1;
          if (ai2.shootCooldown <= 0) {
            ai2.shootCooldown = 90;
            const adx = pp2.x-pos2.x, ady = pp2.y-pos2.y;
            const aim = Math.atan2(ady,adx);
            gs.enemyBullets.push({
              x:pos2.x, y:pos2.y,
              vx:Math.cos(aim)*0.5, vy:Math.sin(aim)*0.5,   // slowed by half
              life:140, maxLife:140, color:'#44aaff',
              isTear:true, gravity:0.045
            });
          }
        }
      }
      const hp2 = ECS.get(id,'hp');
      if (hp2 && hp2.hitFlash > 0) hp2.hitFlash--;
      continue;
    }
    
   const type = ECS.get(id, 'enemy').type;
    const bt = ENEMY_BTS[type];
    if (bt) bt.tick(id, gs);

    // Entity may have been destroyed by its own BT (e.g. giftbox exploding)
    if (!ECS.has(id, 'pos') || !ECS.has(id, 'vel')) continue;

    const pos = ECS.get(id, 'pos');
    const vel = ECS.get(id, 'vel');

    // ── Reflected cannonball: check if it hit something and should detonate ──
    if (ai2 && ai2.reflectedByGlowstick && type === 'cannonball') {
      const ppos = ECS.get(gs.playerId, 'pos');
      const hitWall = pos.x < 30 || pos.x > worldW - 30 || pos.y < 30 || pos.y > worldH - 30;
      let hitEnemy = false;
      for (const oid of ECS.query('enemy', 'pos', 'hp')) {
        if (oid === id) continue;
        const op = ECS.get(oid, 'pos');
        if (Math.hypot(op.x - pos.x, op.y - pos.y) < 40) { hitEnemy = true; break; }
      }
      if (hitWall || hitEnemy) {
        // Detonate like an explosive bullet
        const fakeBullet = { damageMult: baseBulletDamage() * 4, life: 1, isExplosive: true };
        detonateExplosiveBullet(fakeBullet, pos.x, pos.y);
        spawnParticles(pos.x, pos.y, '#ff4400', 30);
        gs.shakeX = 22; gs.shakeY = 22;
        showMsg('CANNONBALL EXPLODES!!!');
        ECS.destroyEntity(id);
        gs.score += Math.round(25 * gs.wave);
        gs.waveKills++;
        tryDropTicket();
        updateHUD(); checkWave();
        continue;
      }
    }

    pos.x += vel.vx;
    pos.y += vel.vy;
    if (gs.bouncyHouse) {
      if (pos.x < 18)          { pos.x = 18;          vel.vx =  Math.abs(vel.vx); spawnParticles(pos.x, pos.y, '#88ffdd', 4); }
      if (pos.x > worldW - 18) { pos.x = worldW - 18; vel.vx = -Math.abs(vel.vx); spawnParticles(pos.x, pos.y, '#88ffdd', 4); }
      if (pos.y < 18)          { pos.y = 18;          vel.vy =  Math.abs(vel.vy); spawnParticles(pos.x, pos.y, '#88ffdd', 4); }
      if (pos.y > worldH - 18) { pos.y = worldH - 18; vel.vy = -Math.abs(vel.vy); spawnParticles(pos.x, pos.y, '#88ffdd', 4); }
    } else {
      const pp = ECS.get(gs.playerId, 'pos');
      if (pp) pos.angle = Math.atan2(pp.y - pos.y, pp.x - pos.x);
      pos.x = Math.max(-40, Math.min(worldW + 40, pos.x));
      pos.y = Math.max(-40, Math.min(worldH + 40, pos.y));
    }

    const hp = ECS.get(id, 'hp');
    if (hp && hp.hitFlash > 0) hp.hitFlash--;

    const phy2 = ECS.get(id, 'physics');
    if (ai2 && phy2) {
      if (ai2.confused) {
        ai2.confuseTimer--;
        if (ai2.confuseTimer <= 0) { ai2.confused = false; }
        else {
          let nearEnemy = null, nearD = 999999;
          for (const oid of ECS.query('enemy', 'pos')) {
            if (oid === id) continue;
            const od = Math.hypot(ECS.get(oid,'pos').x - pos.x, ECS.get(oid,'pos').y - pos.y);
            if (od < nearD) { nearD = od; nearEnemy = ECS.get(oid,'pos'); }
          }
          if (nearEnemy) {
            const cdx = nearEnemy.x - pos.x, cdy = nearEnemy.y - pos.y, cd = Math.hypot(cdx,cdy)||1;
            vel.vx = (vel.vx||0)*0.88 + (cdx/cd)*phy2.speed*0.2;
            vel.vy = (vel.vy||0)*0.88 + (cdy/cd)*phy2.speed*0.2;
          }
        }
      }
      if (ai2.ringmasterBuffed) {
        ai2.ringmasterBuffTimer = (ai2.ringmasterBuffTimer || 0) - 1;
        phy2._baseSpeed = phy2._baseSpeed || phy2.speed;
        phy2.speed = phy2._baseSpeed * 1.4;
        if (ai2.ringmasterBuffTimer <= 0) {
          ai2.ringmasterBuffed = false;
          phy2.speed = phy2._baseSpeed;
        }
      } else if (phy2._baseSpeed) {
        phy2.speed = phy2._baseSpeed;
      }
    }
  }

  // ── Paper Cuts: tick damage on damaged enemies ──
  if (gs.hasPaperCuts) {
    gs.paperCutsTimer = (gs.paperCutsTimer || 0) + 1;
    if (gs.paperCutsTimer >= 60) {
      gs.paperCutsTimer = 0;
      for (const id of ECS.query('enemy', 'hp')) {
        const ehp = ECS.get(id, 'hp');
        if (ehp.hp < ehp.maxHp) {
          ehp.hp -= 1; ehp.hitFlash = 4;
          if (ehp.hp <= 0) {
            const epos = ECS.get(id, 'pos');
            if (epos) spawnParticles(epos.x, epos.y, '#ff2222', 10);
            ECS.destroyEntity(id);
            gs.score += Math.round(5 * gs.wave); gs.waveKills++;
            tryDropTicket();
            gs.health = Math.min(gs.maxHealth, gs.health + CFG.HEALTH_REGEN);
            updateHUD(); checkWave();
          }
        }
      }
    }
  }
}

// ================================================================
// SYSTEM 3: Bullet Movement + Bouncing
// ================================================================
function sysBullets() {
  gs.bullets = gs.bullets.filter(b => {
    if (gs.hasFunhouseDistortion) {
      let nearest = null, nearDist = 999999;
      for (const eid of ECS.query('enemy','pos')) {
        const ep = ECS.get(eid,'pos');
        const d = Math.hypot(ep.x - b.x, ep.y - b.y);
        if (d < nearDist) { nearDist = d; nearest = ep; }
      }
      if (nearest && nearDist < 300) {
        const dx = nearest.x - b.x, dy = nearest.y - b.y, dist = Math.hypot(dx,dy)||1;
        b.vx += (dx/dist)*0.28; b.vy += (dy/dist)*0.28;
        const spd = Math.hypot(b.vx,b.vy);
        if (spd > CFG.BULLET_SPEED*1.1) { b.vx=b.vx/spd*CFG.BULLET_SPEED*1.1; b.vy=b.vy/spd*CFG.BULLET_SPEED*1.1; }
      }
    }

    b.x += b.vx; b.y += b.vy; b.life--;

    if (gs.bouncyHouse) {
      let bounced = false;
      if (b.x <= 4)         { b.x = 4;         b.vx =  Math.abs(b.vx); b.angle = Math.atan2(b.vy,b.vx); bounced = true; }
      if (b.x >= worldW-4)  { b.x = worldW-4;  b.vx = -Math.abs(b.vx); b.angle = Math.atan2(b.vy,b.vx); bounced = true; }
      if (b.y <= 4)         { b.y = 4;         b.vy =  Math.abs(b.vy); b.angle = Math.atan2(b.vy,b.vx); bounced = true; }
      if (b.y >= worldH-4)  { b.y = worldH-4;  b.vy = -Math.abs(b.vy); b.angle = Math.atan2(b.vy,b.vx); bounced = true; }
      if (bounced) {
        b.bounces = (b.bounces || 0) + 1;
        spawnParticles(b.x, b.y, '#88ffdd', 3);

        // Explosive bullets detonate on wall bounce too
        if (b.isExplosive) {
          detonateExplosiveBullet(b, b.x, b.y);
          return false;
        }

        if (gs.hasMirrorMaze && b.bounces === 1) {
          const perp = Math.atan2(b.vy, b.vx) + Math.PI / 2;
          gs.bullets.push({
            x: b.x, y: b.y,
            vx: Math.cos(perp)*CFG.BULLET_SPEED, vy: Math.sin(perp)*CFG.BULLET_SPEED,
            angle: perp, life: CFG.BULLET_LIFE,
            damageMult: b.damageMult, isDud: b.isDud,
            bounces: 99
          });
        }
      }
      return b.life > 0 && (b.bounces || 0) <= 8;
    }

    // Out-of-bounds: explosive bullets detonate at the wall edge
    const oob = b.x < -10 || b.x > worldW+10 || b.y < -10 || b.y > worldH+10;
    if (oob && b.isExplosive) {
      const clampX = Math.max(0, Math.min(worldW, b.x));
      const clampY = Math.max(0, Math.min(worldH, b.y));
      detonateExplosiveBullet(b, clampX, clampY);
      return false;
    }

    return b.life > 0 && !oob;
  });
}

// ================================================================
// SYSTEM 4: Bullet → Enemy Collision
// ================================================================
function sysBulletEnemyCollision() {
  for (const b of gs.bullets) {
    if (b.life <= 0) continue;
    for (const id of ECS.query('enemy', 'pos', 'hp')) {
      const eai = ECS.get(id, 'ai');
      if (eai && eai.phased) continue;

      const epos = ECS.get(id, 'pos');
      const ehp  = ECS.get(id, 'hp');
      if (Math.hypot(b.x - epos.x, b.y - epos.y) < 30) {
        // Explosive bullets: AoE detonate instead of single-target hit
        if (b.isExplosive) {
          detonateExplosiveBullet(b, b.x, b.y);
          break;
        }

        if (b.isDud) { b.life = 0; spawnParticles(b.x, b.y, '#666666', 3); break; }
        const dmg = b.damageMult || 1;
        ehp.hp -= dmg; ehp.hitFlash = 12; b.life = 0;
        spawnParticles(b.x, b.y, dmg > 1 ? '#ff44ff' : '#ff6644', 6);

        if (gs.popcornFrenzyTimer > 0) {
          spawnParticles(b.x, b.y, '#ffdd00', 12);
          for (const aoeId of ECS.query('enemy','pos','hp')) {
            if (aoeId === id) continue;
            const ap = ECS.get(aoeId,'pos');
            if (Math.hypot(ap.x - b.x, ap.y - b.y) < 55) {
              const ah = ECS.get(aoeId,'hp');
              ah.hp -= dmg * 0.6; ah.hitFlash = 8;
            }
          }
        }

        if (ehp.hp <= 0) {
          const type = ECS.get(id, 'enemy').type;
          if (type === 'boss') handleBossDeath(id);

          if (gs.ricochetActive) {
            let nearest = null, nearDist = 999999;
            for (const oid of ECS.query('enemy','pos')) {
              if (oid === id) continue;
              const od = Math.hypot(ECS.get(oid,'pos').x - epos.x, ECS.get(oid,'pos').y - epos.y);
              if (od < nearDist) { nearDist = od; nearest = ECS.get(oid,'pos'); }
            }
            if (nearest) {
              const rd = Math.hypot(nearest.x - epos.x, nearest.y - epos.y)||1;
              gs.bullets.push({ x:epos.x, y:epos.y, vx:(nearest.x-epos.x)/rd*CFG.BULLET_SPEED, vy:(nearest.y-epos.y)/rd*CFG.BULLET_SPEED, angle:0, life:CFG.BULLET_LIFE, damageMult: dmg, isDud: false });
              spawnParticles(epos.x, epos.y, '#4499ff', 6);
            }
          }

          spawnParticles(epos.x, epos.y, '#ff2222', 18);
          if (gs.hasPopcornBucket && Math.random() < 0.22) {
            gs.popcornKernels.push({ x: epos.x + (Math.random()-.5)*20, y: epos.y + (Math.random()-.5)*20 });
          }
          ECS.destroyEntity(id);
          gs.score += Math.round(10 * gs.wave * (dmg > 1 ? 1.6 : 1));
          gs.waveKills++;
          tryDropTicket();
          gs.health = Math.min(gs.maxHealth, gs.health + CFG.HEALTH_REGEN);
          updateHUD(); checkWave();
        }
        break;
      }
    }
  }
  gs.bullets = gs.bullets.filter(b => b.life > 0);
}

// ================================================================
// SYSTEM 5: Dash → Enemy Collision
// ================================================================
function sysDashCollision() {
  if (gs.dashTimer <= 0) {
    for (const id of ECS.query('enemy', 'ai')) ECS.get(id,'ai').dashHit = false;
    return;
  }
  const ppos = ECS.get(gs.playerId, 'pos');
  const pvel = ECS.get(gs.playerId, 'vel');
  // Dash damage scales with current player speed
  const dashSpd = Math.hypot(pvel.vx, pvel.vy);
  const speedScale = Math.max(1, dashSpd / CFG.DASH_SPEED);
  for (const id of ECS.query('enemy', 'pos', 'hp', 'ai')) {
    const epos = ECS.get(id, 'pos');
    const ehp  = ECS.get(id, 'hp');
    const ai   = ECS.get(id, 'ai');
    if (!ai.dashHit && Math.hypot(ppos.x - epos.x, ppos.y - epos.y) < 32) {
      const dashDmg = baseBulletDamage() * 2 * speedScale;
      ehp.hp -= dashDmg; ehp.hitFlash = 14; ai.dashHit = true;
      spawnParticles(epos.x, epos.y, '#ffaa00', 10);
      if (ehp.hp <= 0) {
        spawnParticles(epos.x, epos.y, '#ff2222', 16);
        ECS.destroyEntity(id);
        gs.score += 10 * gs.wave; gs.waveKills++; tryDropTicket();
        gs.health = Math.min(gs.maxHealth, gs.health + CFG.HEALTH_REGEN);
        updateHUD(); checkWave();
      }
    }
  }
}

// ================================================================
// SYSTEM 6: Enemy → Player Collision
// ================================================================
function sysEnemyPlayerCollision() {
  if (gs.invincible > 0 || gs.frozen || (gs.dashTimer > 0 && gs.hasTightropeBoots)) return;
  const ppos = ECS.get(gs.playerId, 'pos');
  if (!ppos) return; 

  for (const id of ECS.query('enemy', 'pos')) {
    const epos = ECS.get(id, 'pos');
    if (Math.hypot(ppos.x - epos.x, ppos.y - epos.y) < 28) {
      const contactDmg = gs.knockingPinsActive ? 8 : 20;
      gs.health -= contactDmg; gs.invincible = CFG.INVINCIBLE_FRAMES;
      gs.shakeX = 16; gs.shakeY = 16;
      gs.flawlessThisWave = false;
      triggerSFPHit();
      spawnParticles(ppos.x, ppos.y, '#ff3333', 14);
      updateHUD();
      if (gs.health <= 0) { gameOver(); return; }
      return;
    }
  }
}

// ================================================================
// SYSTEM 7: Enemy Bullets
// ================================================================
function sysEnemyBullets() {
  const ppos = ECS.get(gs.playerId, 'pos');
  gs.enemyBullets = gs.enemyBullets.filter(eb => {
    if (!gs.frozen) { eb.x += eb.vx; eb.y += eb.vy; eb.life--; }
    if (eb.isTear && eb.gravity) {
      eb.vy += eb.gravity;
    }

    if (eb.homing) {
      const dx = ppos.x - eb.x, dy = ppos.y - eb.y, dist = Math.hypot(dx,dy)||1;
      eb.vx += (dx/dist) * (eb.homingStrength||0.04);
      eb.vy += (dy/dist) * (eb.homingStrength||0.04);
      const spd = Math.hypot(eb.vx,eb.vy);
      if (spd > 2) { eb.vx=eb.vx/spd*2; eb.vy=eb.vy/spd*2; }
    }

    if (gs.bouncyHouse) {
      let bounced = false;
      if (eb.x <= 4)          { eb.x = 4;          eb.vx =  Math.abs(eb.vx); bounced = true; }
      if (eb.x >= worldW - 4) { eb.x = worldW - 4; eb.vx = -Math.abs(eb.vx); bounced = true; }
      if (eb.y <= 4)          { eb.y = 4;          eb.vy =  Math.abs(eb.vy); bounced = true; }
      if (eb.y >= worldH - 4) { eb.y = worldH - 4; eb.vy = -Math.abs(eb.vy); bounced = true; }
      if (bounced) { eb.bounces = (eb.bounces || 0) + 1; spawnParticles(eb.x, eb.y, '#88ffdd', 3); }
      if (eb.life <= 0 || eb.bounces > 8) return false;
    } else {
      if (eb.life <= 0 || eb.x < -10 || eb.x > worldW+10 || eb.y < -10 || eb.y > worldH+10) return false;
    }

    if (gs.invincible <= 0 && Math.hypot(eb.x - ppos.x, eb.y - ppos.y) < 20) {
      gs.health -= 15; gs.invincible = CFG.INVINCIBLE_FRAMES;
      gs.shakeX = 10; gs.shakeY = 10;
      gs.flawlessThisWave = false;
      triggerSFPHit();
      spawnParticles(ppos.x, ppos.y, '#ff69b4', 10);
      updateHUD();
      if (gs.health <= 0) { gameOver(); return false; }
      return false;
    }
    return true;
  });
}

// ================================================================
// SYSTEM 8: Field Item Pickup
// ================================================================
function sysFieldItemPickup() {
  const ppos = ECS.get(gs.playerId, 'pos');
  for (let i = gs.fieldItems.length - 1; i >= 0; i--) {
    const fi = gs.fieldItems[i];
    if (Math.hypot(ppos.x - fi.x, ppos.y - fi.y) < 34) {
      const def = ITEM_DEFS[fi.id];
      gs.itemCooldowns[fi.id] = Date.now();
      gs.fieldItems.splice(i, 1);
      def.effect(gs);
      const permanent = new Set(['bouncy','dash','doubledCake','tripleCake','quadCake','shakeFizzlePop','flawlessBaking','cursedCandles','glowsticks','paperCuts','extraClips','clownishUpgrade','popcornUpgrade']);
      if (!permanent.has(fi.id)) {
        setTimeout(() => { if (gameRunning) trySpawnFieldItems(); }, def.spawnCooldown);
      }
    }
  }
}

// ================================================================
// SYSTEM 9: Popcorn Kernel Pickup
// ================================================================
function sysPopcorn() {
  if (!gs.hasPopcornBucket || !gs.popcornKernels) return;
  const ppos = ECS.get(gs.playerId,'pos');
  const kernelGoal = gs.hasPopcornUpgrade ? 3 : 5;
  gs.popcornKernels = gs.popcornKernels.filter(k => {
    if (Math.hypot(k.x - ppos.x, k.y - ppos.y) < 22) {
      spawnParticles(k.x, k.y, '#ffdd00', 4);
      gs._kernelsCollected = (gs._kernelsCollected||0) + 1;
      if (gs._kernelsCollected >= kernelGoal) {
        gs._kernelsCollected = 0;
        gs.popcornFrenzyTimer = gs.hasPopcornUpgrade ? 360 : 240;
        showMsg(gs.hasPopcornUpgrade ? '🍿 MEGA FRENZY! MASSIVE EXPLOSION RADIUS!' : '🍿 POPCORN FRENZY! BULLETS EXPLODE!');
        spawnPartyParticles(ppos.x, ppos.y);
      }
      return false;
    }
    return true;
  });
}

// ================================================================
// SYSTEM 10: Timers
// ================================================================
function sysTimers() {
  if (gs.partyFreezeTimer > 0) gs.partyFreezeTimer--;
  if (gs.speedBoostTimer > 0)  gs.speedBoostTimer--;
  if (gs.confettiSlowTimer > 0) gs.confettiSlowTimer--;
  if (gs.invincible > 0) gs.invincible--;
  if (gs.glowCooldown > 0) gs.glowCooldown--;

  // Explosion freeze timer: skip advancing the game for N frames
  if (gs.explosionFreezeTimer > 0) {
    gs.explosionFreezeTimer--;
    // (loop() will still call draw, but we can short-circuit update by returning early)
    // We return here so all other timers and systems also pause — true hitlag effect
    return;
  }

  // Glow explosion ring visual timer
  if (gs.glowExplosionTimer > 0) gs.glowExplosionTimer--;

  if (gs.reloading) {
    const reloadSpeed = gs.speedBoostTimer > 0 ? Math.max(1, Math.round(gs.speedBoostMult || 1)) : 1;
    gs.reloadTimer -= reloadSpeed;
    if (gs.reloadTimer <= 0) {
      gs.reloading = false; gs.ammo = gs.maxAmmo;
      updateHUD(); showMsg('RELOADED!');
    }
  }
  if (gs.ammo === 0 && !gs.reloading) startReload();

  if (gs.hasCursedCandles) {
    if (gs.candleRelightDelay > 0) {
      gs.candleRelightDelay--;
    } else {
      gs.candleHpTimer = (gs.candleHpTimer || 0) + 1;
      if (gs.candleHpTimer >= 60) {
        gs.candleHpTimer = 0;
        gs.health -= 5;
        gs.flawlessThisWave = false;
        if (gs.health <= 0) { gameOver(); return; }
        if (gs.candlesLit < 5) {
          gs.candlesLit = Math.min(5, gs.candlesLit + 1);
          showMsg(gs.candlesLit === 5
            ? "ALL CANDLES LIT! +10 BULLETS PER SHOT"
            : `CANDLE LIT! +${gs.candlesLit * 2} BULLETS PER SHOT`);
        }
        updateHUD();
      }
    }
  }

  if (gs.hasShakeFizzlePop && !gs.sfpFull) {
    gs.sfpMeter = Math.min(gs.sfpMax, gs.sfpMeter + 1);
    if (gs.sfpMeter >= gs.sfpMax) { gs.sfpFull = true; showMsg('SHAKE FIZZLE POP — FULLY CHARGED!!!'); }
  }

  if (gs.hasDash && gs.dashCharges < gs.dashMaxCharges) {
    gs.dashCooldownTimer++;
    if (gs.dashCooldownTimer >= gs.dashCooldownMax) {
      gs.dashCooldownTimer = 0; gs.dashCharges++;
      updateHUD();
      if (gs.dashCharges === gs.dashMaxCharges) showMsg('DASH FULLY CHARGED!');
    }
  }

  for (const p of gs.particles) { p.x += p.vx; p.y += p.vy; p.vx *= 0.91; p.vy *= 0.91; p.life--; }
  gs.particles = gs.particles.filter(p => p.life > 0);

  gs.shakeX *= 0.72;
  gs.shakeY *= 0.72;
  if (muzzleFlash > 0) muzzleFlash--;

  if (gs.prizeEffect) {
    gs.prizeEffect.timer--;
    if (gs.prizeEffect.timer <= 0) {
      gs.sugarRushActive = false;
      gs.ricochetActive  = false;
      gs.prizeEffect     = null;
    }
  }

  if (gs.cursedSpinTimer > 0) {
    gs.cursedSpinTimer--;
    if (gs.cursedSpinTimer === 0) {
      for (const eid of ECS.query('enemy','physics')) {
        const ephy = ECS.get(eid,'physics');
        if (ephy._cursedBase) { ephy.speed = ephy._cursedBase; delete ephy._cursedBase; }
        const eai = ECS.get(eid,'ai');
        if (eai) eai.cursedDmgBoost = false;
      }
    }
  }

  if (gs.knockingPinsActive) {
    gs.knockingPinsTimer--;
    if (gs.knockingPinsTimer <= 0) {
      gs.knockingPinsActive = false;
      showMsg('KNOCKING PINS WORE OFF!');
    } else {
      const ppos = ECS.get(gs.playerId,'pos');
      const pvel = ECS.get(gs.playerId,'vel');
      let nearest = null, nearDist = 999999;
      for (const eid of ECS.query('enemy','pos')) {
        const ep = ECS.get(eid,'pos');
        const d = Math.hypot(ep.x - ppos.x, ep.y - ppos.y);
        if (d < nearDist) { nearDist = d; nearest = ep; }
      }
      if (nearest) {
        const dx = nearest.x - ppos.x, dy = nearest.y - ppos.y, dist = Math.hypot(dx,dy)||1;
        pvel.vx = (dx/dist) * CFG.PLAYER_SPEED * 2.2;
        pvel.vy = (dy/dist) * CFG.PLAYER_SPEED * 2.2;
      }
    }
  }

  if (gs.popcornFrenzyTimer > 0) gs.popcornFrenzyTimer--;

  if (gs.hasClownish) {
    gs.clownNoseTimer++;
    gs.clownNoseSize = gs.clownNoseTimer / gs.clownNoseMax;
    if (gs.clownNoseTimer >= gs.clownNoseMax) {
      gs.clownNoseTimer = 0;
      const ppos3 = ECS.get(gs.playerId, 'pos');
      const near = ECS.query('enemy','pos').filter(id =>
        Math.hypot(ECS.get(id,'pos').x - ppos3.x, ECS.get(id,'pos').y - ppos3.y) < 200
      );
      if (near.length >= 2) {
        // Upgraded clownish: shoots more bullets in a ring
        const bulletCount = gs.hasClownishUpgrade ? 8 : 2;
        for (let bi = 0; bi < bulletCount; bi++) {
          const ba = gs.hasClownishUpgrade
            ? (bi / bulletCount) * Math.PI * 2
            : gunAngle + (bi === 0 ? -0.5 : 0.5);
          gs.bullets.push({ x:ppos3.x, y:ppos3.y, vx:Math.cos(ba)*8, vy:Math.sin(ba)*8, life:80, maxLife:80, angle:ba, damageMult:gs.hasClownishUpgrade ? 3 : 2, isDud:false });
        }
        spawnPartyParticles(ppos3.x, ppos3.y);
        showMsg(gs.hasClownishUpgrade ? 'MEGA CLOWN BLAST! RING OF CONFUSION!' : 'CLOWN NOSE BLAST! ENEMIES CONFUSED!');
        for (const eid of near) {
          const eai = ECS.get(eid,'ai');
          if (eai) { eai.confused = true; eai.confuseTimer = gs.hasClownishUpgrade ? 480 : 300; }
        }
      }
    }
  }
}

// ================================================================
// SYSTEM 11: Spawner
// ================================================================
function sysSpawner() {
  gs.spawnTimer++;
  if (gs.spawnTimer >= gs.spawnInterval) { gs.spawnTimer = 0; spawnEnemy(); }
}

// ================================================================
// MASTER UPDATE
// ================================================================
function update() {
  sysPlayerMovement();
  sysAI();
  sysBullets();
  sysBulletEnemyCollision();
  sysDashCollision();
  sysEnemyPlayerCollision();
  sysEnemyBullets();
  sysFieldItemPickup();
  sysPopcorn();
  sysTimers();
  sysSpawner();
}

// ================================================================
// SPAWN HELPERS
// ================================================================
function spawnEnemy() {
  if (gs.bossActive) return;
  const total = ECS.query('enemy').length;
  if (gs.waveKills + total >= gs.waveEnemiesLeft) return;

  let x, y, attempts = 0;
  const ppos = ECS.get(gs.playerId, 'pos');
  do {
    const side = Math.floor(Math.random() * 4);
    if      (side === 0) { x = Math.random() * worldW; y = -40; }
    else if (side === 1) { x = worldW + 40;             y = Math.random() * worldH; }
    else if (side === 2) { x = Math.random() * worldW; y = worldH + 40; }
    else                 { x = -40;                     y = Math.random() * worldH; }
    attempts++;
  } while (Math.hypot(x - ppos.x, y - ppos.y) < CFG.SAFE_SPAWN_DIST && attempts < 8);

  let type = 'utensil';
 
  const roll = Math.random();

  if (gs.floor === 2) {
    if (gs.wave >= 15) {
      if (roll < 0.30)      type = 'ringmaster';
      else if (roll < 0.62) type = 'cannonball';
      else                  type = 'juggler';
    } else {
      if (roll < 0.45) type = 'cannonball';
      else             type = 'juggler';
    }
  } else if (gs.wave >= 6) {
    if (roll < 0.30)      type = 'mask';
    else if (roll < 0.52) type = 'giftBox';
    else if (roll < 0.72) type = 'partyHat';
    // else utensil
  } else if (gs.wave >= 5) {
    if (roll < 0.32)      type = 'mask';
    else if (roll < 0.58) type = 'partyHat';
  } else if (gs.wave >= 4) {
    if (roll < 0.35) type = 'mask';
  }

  const def    = ENEMY_DEFS[type];
  const baseHp = 1 + Math.floor(gs.wave / 2);
  const id     = ECS.createEntity();
  const subtypes = ['fork', 'knife', 'spoon'];
  ECS.add(id, 'enemy', {
    type,
    subtype: type === 'utensil'
      ? subtypes[Math.floor(Math.random() * 3)]
      : undefined
  });
  ECS.add(id, 'pos',     { x, y, angle: 0 });
  ECS.add(id, 'vel',     { vx: 0, vy: 0 });
  ECS.add(id, 'hp',      { hp: Math.ceil(baseHp * def.hpMult), maxHp: Math.ceil(baseHp * def.hpMult), hitFlash: 0 });
  ECS.add(id, 'physics', { speed: (1.2 + Math.random() * 0.6 + gs.wave * 0.12) * def.speedMult });
  ECS.add(id, 'ai',      { shootCooldown: 120, ambushTimer: 0, diveTimer: 0, dashHit: false });
}

function spawnBoss() {
  const ppos = ECS.get(gs.playerId, 'pos');
  const x = ppos.x > worldW / 2 ? 120 : worldW - 120;
  const y = ppos.y > worldH / 2 ? 120 : worldH - 120;
  const id = ECS.createEntity();
  ECS.add(id, 'enemy',   { type: 'boss' });
  ECS.add(id, 'pos',     { x, y, angle: 0 });
  ECS.add(id, 'vel',     { vx: 0, vy: 0 });
  ECS.add(id, 'hp',      { hp: CFG.BOSS_BASE_HP + gs.wave * 12, maxHp: CFG.BOSS_BASE_HP + gs.wave * 12, hitFlash: 0 });
  ECS.add(id, 'physics', { speed: CFG.BOSS_SPEED });
  ECS.add(id, 'ai', {
    shootCooldown: 90, ambushTimer: 0, diveTimer: 0, dashHit: false,
    bossPhase: BOSS_PHASE.IDLE, phaseTimer: 120,
    spiralAngle: 0, volleyCount: 0, volleyTimer: 0,
    slamTarget: null, slamRadius: 0, slamWarning: 0
  });
  gs.bossId = id;
}

// ================================================================
// SHOOT / RELOAD / DASH
// ================================================================
function shoot() {
  if (gs.ammo <= 0 || gs.reloading) return;
  gs.ammo--; muzzleFlash = 10; updateHUD();

  gunRecoil = 1.0;

  const ppos = ECS.get(gs.playerId, 'pos');
  gs.shakeX = (Math.random() - .5) * 13;
  gs.shakeY = (Math.random() - .5) * 13;

  const muzzle = gunMuzzlePos();

  let doubleCount = 0;
  const totalBullets = CFG.BULLET_COUNT + (gs.hasCursedCandles ? gs.candlesLit * 2 : 0);
  for (let i = 0; i < totalBullets; i++) {
    const a = gunAngle + (Math.random() - .5) * .32;
    let damageMult = 1, isDud = false;
    if (gs.hasQuadCake) {
      if (Math.random() < 0.50) isDud = true; else { damageMult = 4; doubleCount++; }
    } else if (gs.hasTripleCake) {
      if (Math.random() < 0.45) isDud = true; else { damageMult = 3; doubleCount++; }
    } else if (gs.hasDoubleCake) {
      if (Math.random() < 0.40) isDud = true; else { damageMult = 2; doubleCount++; }
    }
    gs.bullets.push({
      x: muzzle.x,
      y: muzzle.y,
      vx: Math.cos(a) * CFG.BULLET_SPEED,
      vy: Math.sin(a) * CFG.BULLET_SPEED,
      angle: a, life: CFG.BULLET_LIFE,
      damageMult: isDud ? 1 : damageMult * (gs.sfpFull ? 1.5 : 1),
      isDud
    });
  }
  spawnParticles(muzzle.x, muzzle.y, doubleCount > 0 ? '#ff44ff' : '#ff8800', doubleCount > 0 ? 8 : 6);
}

function startReload() {
  if (gs.reloading || gs.ammo === gs.maxAmmo) return;
  gs.reloading = true;
  gs.reloadTimer = CFG.RELOAD_FRAMES;
  showMsg('RELOADING...');
}

function tryDash() {
  if (!gs.hasDash || gs.dashCharges <= 0 || gs.dashTimer > 0) return;
  gs.dashCharges--; updateHUD();
  const ppos = ECS.get(gs.playerId, 'pos');
  const pvel = ECS.get(gs.playerId, 'vel');
  const spd = Math.hypot(pvel.vx, pvel.vy);
  if (spd > 0.3) {
    gs.dashVx = (pvel.vx / spd) * CFG.DASH_SPEED;
    gs.dashVy = (pvel.vy / spd) * CFG.DASH_SPEED;
  } else {
    gs.dashVx = Math.cos(gunAngle) * CFG.DASH_SPEED;
    gs.dashVy = Math.sin(gunAngle) * CFG.DASH_SPEED;
  }
  gs.dashTimer = CFG.DASH_FRAMES;
  gs.invincible = Math.max(gs.invincible, CFG.DASH_FRAMES + 4);
  spawnParticles(ppos.x, ppos.y, '#ffaa00', 8);
}

// ================================================================
// WAVE / ITEM CHOICE
// ================================================================
function checkWave() {
  if (gs.waveKills >= gs.waveEnemiesLeft && ECS.query('enemy').length === 0) {
    const completed = gs.wave;

    if (gs.hasFlawlessBaking && gs.flawlessThisWave) {
      gs.maxAmmo += 2;
      gs.ammo = Math.min(gs.ammo + 2, gs.maxAmmo);
      updateHUD();
      showMsg('FLAWLESS BAKING! +2 MAX AMMO!');
      spawnPartyParticles(CFG.W / 2, CFG.H / 2);
    }

    gs.wave++;
    gs.spawnInterval = Math.max(55, CFG.SPAWN_INTERVAL_BASE - gs.wave * CFG.WAVE_SPAWN_SPEEDUP);
    gs.waveEnemiesLeft = CFG.WAVE_ENEMIES_BASE + gs.wave * CFG.WAVE_ENEMIES_GROWTH;
    gs.waveKills = 0;
    gs.flawlessThisWave = true;

    if (gs.hasCursedCandles && gs.candlesLit > 0) {
      const ammoLost = gs.candlesLit * 2;
      gs.maxAmmo = Math.max(CFG.MAX_AMMO, gs.maxAmmo - ammoLost);
      gs.ammo = Math.min(gs.ammo, gs.maxAmmo);
      gs.candlesLit = 0;
      gs.candleHpTimer = 0;
      gs.candleRelightDelay = 180;
      showMsg('CANDLES SNUFFED! THEY WILL RELIGHT...');
    }

    updateHUD();

    if (gs.wave === CFG.BOSS_WAVE) {
      gs.bossActive = true;
      spawnBoss();
      gs.spawnInterval = Math.max(120, CFG.SPAWN_INTERVAL_BASE * 2);
      showMsg('BOSS INCOMING — WAVE ' + gs.wave + '!');
    } else if (completed % 3 === 0) {
      setTimeout(() => offerItemChoice(), 300);
    } else {
      showMsg(`WAVE ${gs.wave} - INCOMING!`);
      trySpawnFieldItems();
    }
  }
}

function trySpawnFieldItems() {
  const now = Date.now();
  const permanent = new Set(['bouncy','dash','doubledCake','tripleCake','quadCake','shakeFizzlePop','flawlessBaking','cursedCandles','glowsticks','paperCuts','extraClips','clownishUpgrade','popcornUpgrade']);
  for (const id of gs.unlockedItems) {
    if (gs.fieldItems.some(fi => fi.id === id)) continue;
    if (id === 'bouncy'          && gs.bouncyHouse)        continue;
    if (id === 'dash'            && gs.hasDash)            continue;
    if (id === 'doubledCake'     && gs.hasDoubleCake)      continue;
    if (id === 'tripleCake'      && gs.hasTripleCake)      continue;
    if (id === 'quadCake'        && gs.hasQuadCake)        continue;
    if (id === 'shakeFizzlePop'  && gs.hasShakeFizzlePop)  continue;
    if (id === 'flawlessBaking'  && gs.hasFlawlessBaking)  continue;
    if (id === 'cursedCandles'   && gs.hasCursedCandles)   continue;
    if (id === 'glowsticks') continue;
    if (id === 'paperCuts'       && gs.hasPaperCuts)       continue;
    if (id === 'extraClips'      && gs.hasExtraClips)      continue;
    if (id === 'clownishUpgrade' && gs.hasClownishUpgrade) continue;
    if (id === 'popcornUpgrade'  && gs.hasPopcornUpgrade)  continue;
    const def = ITEM_DEFS[id];
    const last = gs.itemCooldowns[id] || 0;
    if (now - last >= def.spawnCooldown || last === 0) {
      gs.fieldItems.push({ id, x: 80 + Math.random() * (worldW - 160), y: 80 + Math.random() * (worldH - 160), phase: Math.random() * Math.PI * 2 });
    }
  }
}

// ── Item pool pools ──
// General items: can appear on any floor (20% chance to replace a floor-specific pick)
const GENERAL_ITEM_IDS = ['paperCuts', 'extraClips'];

function offerItemChoice() {
  gs.pendingChoice = true;
  gameRunning = false;
  cancelAnimationFrame(animId);
  draw();

  const choiceEl = document.getElementById('item-choice');
  const cardsEl  = document.getElementById('item-cards');
  cardsEl.innerHTML = '';

  // Build floor-specific pool
  const floorPool = gs.floor === 2 ? FLOOR2_ITEM_IDS : ALL_ITEM_IDS;

  let floorAvailable = floorPool.filter(id => {
    if (id === 'tripleCake' && !gs.hasDoubleCake) return false;
    if (id === 'quadCake'   && !gs.hasTripleCake) return false;
    if (id === 'knockingPins') return true;
    return !gs.unlockedItems.includes(id);
  });

  // Upgrade items unlock when their prerequisite is owned
  const upgradePool = [];
  if (gs.hasClownish && !gs.hasClownishUpgrade) upgradePool.push('clownishUpgrade');
  if (gs.hasPopcornBucket && !gs.hasPopcornUpgrade) upgradePool.push('popcornUpgrade');
  floorAvailable = [...floorAvailable, ...upgradePool];

  // General items available (not yet owned)
  const generalAvailable = GENERAL_ITEM_IDS.filter(id => !gs.unlockedItems.includes(id));

  // Build offered slots: up to 3
  // Each slot: 20% chance to be filled by a general item if any available
  let offered = [];
  const shuffledFloor = shuffle(floorAvailable);
  const shuffledGeneral = shuffle(generalAvailable);
  let fi = 0, gi = 0;

  for (let slot = 0; slot < 3; slot++) {
    const useGeneral = generalAvailable.length > 0 && gi < shuffledGeneral.length && Math.random() < 0.20;
    if (useGeneral) {
      offered.push(shuffledGeneral[gi++]);
    } else if (fi < shuffledFloor.length) {
      offered.push(shuffledFloor[fi++]);
    } else if (gi < shuffledGeneral.length) {
      offered.push(shuffledGeneral[gi++]);
    }
  }

  // Deduplicate
  offered = [...new Set(offered)].slice(0, 3);

  for (const id of offered) {
    const def = ITEM_DEFS[id];
    const isOwned = gs.unlockedItems.includes(id);
    const card = document.createElement('div');
    card.className = `item-card${isOwned ? ' already-owned' : ''}`;
    if (id === 'doubledCake') { card.style.background='#001133'; card.style.borderColor='#4488ff'; }
    else if (id === 'tripleCake') { card.style.background='#220022'; card.style.borderColor='#cc44ff'; }
    else if (id === 'quadCake')   { card.style.background='#220000'; card.style.borderColor='#ff3333'; }
    else if (id === 'paperCuts')  { card.style.background='#001a1a'; card.style.borderColor='#00ffcc'; }
    else if (id === 'extraClips') { card.style.background='#1a1a00'; card.style.borderColor='#ffdd00'; }
    else if (id === 'clownishUpgrade') { card.style.background='#001133'; card.style.borderColor='#4488ff'; }
    else if (id === 'popcornUpgrade')  { card.style.background='#1a0a00'; card.style.borderColor='#ffaa00'; }
    card.innerHTML = `
      <div class="ic-icon">${def.icon}</div>
      <div class="ic-name">${def.label.replace(/\n/g,'<br>')}</div>
      <div class="ic-desc">${def.desc.replace(/\n/g,'<br>')}${isOwned ? '<br><br>[OWNED]' : ''}</div>
    `;
    if (!isOwned) {
      card.addEventListener('click', () => {
        gs.unlockedItems.push(id);
        def.effect(gs);
        choiceEl.style.display = 'none';
        gs.pendingChoice = false; gameRunning = true;
        trySpawnFieldItems(); updateHUD(); loop();
      });
    }
    cardsEl.appendChild(card);
  }

  choiceEl.style.display = 'flex';
  const skipBtn = document.getElementById('skip-btn');
  const allOwned = offered.length === 0 || offered.every(id => gs.unlockedItems.includes(id));
  skipBtn.style.display = allOwned ? 'block' : 'none';
  skipBtn.onclick = () => {
    choiceEl.style.display = 'none'; gs.pendingChoice = false; gameRunning = true;
    trySpawnFieldItems(); updateHUD(); loop();
  };
}

// ================================================================
// TICKETS + PRIZE WHEEL
// ================================================================
function tryDropTicket() {
  if (gs.floor !== 2) return;
  if (Math.random() < 0.5 && gs.tickets < 10) {
    gs.tickets++;
    updateHUD();
  }
}

function spinPrizeWheel() {
  if (gs.floor !== 2 || gs.tickets < 3 || !gameRunning) return;
  gs.tickets -= 3;
  updateHUD();

  const roll = Math.random();
  let name;

  if (roll < 0.18) {
    name = "🔴 CURSED SPIN! ENEMIES ENRAGED!";
    gs.cursedSpinTimer = 480;
    for (const eid of ECS.query('enemy','physics','ai')) {
      const ephy = ECS.get(eid,'physics');
      ephy._cursedBase = ephy._cursedBase || ephy.speed;
      ephy.speed = ephy._cursedBase * 1.5;
      ECS.get(eid,'ai').cursedDmgBoost = true;
    }
    spawnParticles(ECS.get(gs.playerId,'pos').x, ECS.get(gs.playerId,'pos').y, '#ff0000', 20);
    gs.prizeEffect = { name, timer: 480 };
  } else if (roll < 0.36) {
    name = "🟡 SUGAR RUSH! 3x SPEED!";
    gs.sugarRushActive = true;
    gs.speedBoostTimer = 600;
    gs.speedBoostMult  = 3;
    gs.prizeEffect = { name, timer: 600 };
  } else if (roll < 0.52) {
    name = "🟢 BIG WINNER! FULL HEAL!";
    gs.health = gs.maxHealth;
    gs.invincible = 300;
    spawnPartyParticles(ECS.get(gs.playerId,'pos').x, ECS.get(gs.playerId,'pos').y);
    gs.prizeEffect = { name, timer: 180 };
    updateHUD();
  } else if (roll < 0.68) {
    name = "🔵 RICOCHET! CHAIN BULLETS!";
    gs.ricochetActive = true;
    gs.prizeEffect = { name, timer: 600 };
  } else if (roll < 0.84) {
    name = "🟣 SPOTLIGHT! ENEMIES FROZEN!";
    gs.partyFreezeTimer = 180;
    spawnPartyParticles(ECS.get(gs.playerId,'pos').x, ECS.get(gs.playerId,'pos').y);
    gs.prizeEffect = { name, timer: 180 };
  } else {
    name = "⚪ DUD. YOU GOT SCAMMED.";
    gs.prizeEffect = { name, timer: 180 };
  }

  showMsg(name);
}

// ================================================================
// BOSS KILL HANDLER
// ================================================================
function handleBossDeath(id) {
  if (gs.bossId !== id) return;
  gs.bossActive = false;
  gs.bossId     = null;

  gs.transitioning     = true;
  gs.transitionT       = 0;
  gs.transitionStartW  = worldW;
  gs.transitionStartH  = worldH;
  gs.transitionEndW    = 1050;
  gs.transitionEndH    = 690;
  gs.transitionDone    = false;

  document.getElementById('floor-hud').textContent = 'FLOOR 1 CLEARED';
  document.getElementById('floor-transition').querySelector('h2').innerHTML =
    '⬇️ DESCENDING TO<br>FLOOR 2 ⬇️';
  // Don't show the panel yet — show it once the animation finishes
}
