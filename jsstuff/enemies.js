// ============================================================
// CLIPBLAST: PARTY HUNTER — Enemy Definitions + Behavior Trees
// ============================================================

const BOSS_PHASE = {
  IDLE:           'IDLE',
  SLAM_TELEGRAPH: 'SLAM_TELEGRAPH',
  SLAM_STRIKE:    'SLAM_STRIKE',
  SLAM_RECOVER:   'SLAM_RECOVER',
  SPIRAL:         'SPIRAL',
  VOLLEY:         'VOLLEY',
};

// ================================================================
// BEHAVIOR TREES
// ================================================================

// ── Scissors: always chase player ──
const BT_SCISSORS = new BTSelector(
  new BTAction((id, gs) => {
    if (gs.frozen) return BT.RUNNING;
    const pos = ECS.get(id, 'pos');
    const vel = ECS.get(id, 'vel');
    const phy = ECS.get(id, 'physics');
    const pp = playerPos(gs);
    if (!pp || !pos || !vel) return BT.FAILURE;
    const dx = pp.x - pos.x, dy = pp.y - pos.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (gs.bouncyHouse) {
      vel.vx += (dx / dist) * phy.speed * 0.04;
      vel.vy += (dy / dist) * phy.speed * 0.04;
      const spd = Math.hypot(vel.vx, vel.vy);
      if (spd > phy.speed * 1.3) { vel.vx = vel.vx/spd*phy.speed*1.3; vel.vy = vel.vy/spd*phy.speed*1.3; }
    } else {
      vel.vx = (vel.vx||0)*0.88 + (dx/dist)*phy.speed*0.18;
      vel.vy = (vel.vy||0)*0.88 + (dy/dist)*phy.speed*0.18;
      const spd = Math.hypot(vel.vx, vel.vy);
      if (spd > phy.speed) { vel.vx = vel.vx/spd*phy.speed; vel.vy = vel.vy/spd*phy.speed; }
    }
    return BT.RUNNING;
  })
);

// ── Floor 1: Mask ──
const BT_MASK = new BTSelector(
  new BTAction((id, gs) => {
    if (gs.frozen) return BT.RUNNING;
    const pos = ECS.get(id,'pos'), vel = ECS.get(id,'vel'), phy = ECS.get(id,'physics');
    const ai = ECS.get(id,'ai'), pp = playerPos(gs);
    if (!pp || !pos || !vel) return BT.FAILURE;

    const dx = pp.x - pos.x, dy = pp.y - pos.y, dist = Math.hypot(dx,dy)||1;

    ai.maskState = ai.maskState || 'SMILE';
    ai.maskTimer = (ai.maskTimer ?? 180) - 1;
    ai.shootCooldown = (ai.shootCooldown || 0);

    if (ai.maskState === 'SMILE') {
      // Chase player while smiling
      vel.vx = (vel.vx||0)*0.88 + (dx/dist)*phy.speed*0.18;
      vel.vy = (vel.vy||0)*0.88 + (dy/dist)*phy.speed*0.18;
      const spd = Math.hypot(vel.vx, vel.vy);
      if (spd > phy.speed) { vel.vx=vel.vx/spd*phy.speed; vel.vy=vel.vy/spd*phy.speed; }
      if (ai.maskTimer <= 0) {
        ai.maskState = 'CRY';
        ai.maskTimer = 140;
        ai.cryBurst = 5; // number of cry bursts
        ai.cryBurstTimer = 0;
        vel.vx *= 0.3; vel.vy *= 0.3;
      }
    } else {
      // Crying state — slow drift, fire tear bursts
      vel.vx *= 0.94; vel.vy *= 0.94;
      ai.cryBurstTimer = (ai.cryBurstTimer||0) - 1;
      if (ai.cryBurstTimer <= 0 && ai.cryBurst > 0) {
        ai.cryBurst--;
        ai.cryBurstTimer = 22;
        // Fire 3 tears in a spread, with downward gravity flag
        const aim = Math.atan2(dy, dx);
        for (const sa of [-0.28, 0, 0.28]) {
          const a = aim + sa;
          gs.enemyBullets.push({
            x: pos.x, y: pos.y,
            vx: Math.cos(a) * 2.2,  // half speed
            vy: Math.sin(a) * 2.2,
            life: 160, maxLife: 160,
            color: '#44aaff',
            isTear: true,           // gravity flag
            gravity: 0.045          // curves downward each frame
          });
        }
        spawnParticles(pos.x, pos.y, '#44aaff', 5);
      }
      if (ai.maskTimer <= 0) {
        ai.maskState = 'SMILE';
        ai.maskTimer = 150 + Math.random()*60;
      }
    }
    return BT.RUNNING;
  })
);

// ── Floor 2: Juggler ──
const BT_JUGGLER = new BTSelector(
  new BTAction((id, gs) => {
    if (gs.frozen) return BT.RUNNING;
    const pos = ECS.get(id,'pos'), vel = ECS.get(id,'vel'), phy = ECS.get(id,'physics');
    const ai = ECS.get(id,'ai'), pp = playerPos(gs);
    if (!pp || !pos || !vel) return BT.FAILURE;

    // Init juggler state
    if (!ai.juggleBalls)    ai.juggleBalls    = 6;
    if (!ai.juggleMax)      ai.juggleMax      = 6;
    if (!ai.juggleSlots)    ai.juggleSlots    = []; // array of {type:'ball'|'enemy', id?}
    if (!ai.regenTimer)     ai.regenTimer     = 0;
    if (!ai.throwCooldown)  ai.throwCooldown  = 60;
    if (!ai.sphereAngle)    ai.sphereAngle    = 0;

    // Fill slots with balls up to juggleBalls count
    while (ai.juggleSlots.filter(s=>s.type==='ball').length < ai.juggleBalls &&
           ai.juggleSlots.length < ai.juggleMax) {
      ai.juggleSlots.push({ type:'ball', phase: Math.random()*Math.PI*2 });
    }

    const dx = pp.x - pos.x, dy = pp.y - pos.y, dist = Math.hypot(dx,dy)||1;

    // Slow drift toward player
    vel.vx = (vel.vx||0)*0.9 + (dx/dist)*phy.speed*0.12;
    vel.vy = (vel.vy||0)*0.9 + (dy/dist)*phy.speed*0.12;
    const spd = Math.hypot(vel.vx,vel.vy);
    if (spd > phy.speed) { vel.vx=vel.vx/spd*phy.speed; vel.vy=vel.vy/spd*phy.speed; }

    // Roll sphere angle based on movement
    ai.sphereAngle += vel.vx * 0.06;

    // Capture nearby enemies into juggle slots
    if (ai.juggleSlots.length < ai.juggleMax) {
      for (const eid of ECS.query('enemy','pos','ai')) {
        if (eid === id) continue;
        const eai = ECS.get(eid,'ai');
        if (eai.juggled) continue;
        const epos = ECS.get(eid,'pos');
        if (Math.hypot(epos.x-pos.x, epos.y-pos.y) < 44) {
          eai.juggled = true;
          eai.juggledBy = id;
          ai.juggleSlots.push({ type:'enemy', id: eid, phase: Math.random()*Math.PI*2 });
          spawnParticles(epos.x, epos.y, '#ffdd00', 12);
          showMsg('JUGGLER CAPTURED AN ENEMY!');
          break;
        }
      }
    }

    // Position juggled enemies above juggler
    const t = Date.now() / 400;
    for (let i = 0; i < ai.juggleSlots.length; i++) {
      const slot = ai.juggleSlots[i];
      const slotAngle = (i / ai.juggleMax) * Math.PI * 2;
      const arcX = Math.cos(slotAngle + t) * 28;
      const arcY = -38 + Math.sin(slotAngle * 2 + t) * 18; // figure-8 arc above
      if (slot.type === 'enemy' && ECS.has(slot.id,'pos')) {
        const epos = ECS.get(slot.id,'pos');
        epos.x = pos.x + arcX;
        epos.y = pos.y + arcY;
      }
    }

    // Throw at player when close enough
    ai.throwCooldown--;
    if (ai.throwCooldown <= 0 && dist < 200 && ai.juggleSlots.length > 0) {
      ai.throwCooldown = 55;
      const slot = ai.juggleSlots.shift();
      if (slot.type === 'ball') {
        const throwSpd = 4.5;
        gs.enemyBullets.push({
          x: pos.x, y: pos.y - 38,
          vx: (dx/dist)*throwSpd, vy: (dy/dist)*throwSpd - 1.5,
          life: 150, maxLife: 150,
          color: '#ffdd00',
          isJuggleBall: true
        });
      } else if (slot.type === 'enemy' && ECS.has(slot.id,'pos')) {
        const eai = ECS.get(slot.id,'ai');
        eai.juggled = false;
        eai.juggledBy = null;
        // If cannonball, trigger charge immediately
        const etype = ECS.get(slot.id,'enemy').type;
        if (etype === 'cannonball') {
          eai.chargeState = 'TELEGRAPH';
          eai.chargeTimer = 20;
          eai.chargeTarget = { x: pp.x, y: pp.y };
        }
        spawnParticles(pos.x, pos.y - 38, '#ff8800', 8);
      }
    }

    // Regen balls over time when slots are empty
    if (ai.juggleBalls < ai.juggleMax) {
      ai.regenTimer++;
      if (ai.regenTimer >= 540) { // ~9 seconds
        ai.regenTimer = 0;
        ai.juggleBalls++;
      }
    }

    // Clean up dead juggled enemies from slots
    ai.juggleSlots = ai.juggleSlots.filter(s => {
      if (s.type === 'enemy' && !ECS.has(s.id,'pos')) return false;
      return true;
    });

    return BT.RUNNING;
  })
);

// ── GiftBox: slow drift + lunge ──
const BT_GIFTBOX = new BTSelector(
  new BTAction((id, gs) => {
    if (gs.frozen) return BT.RUNNING;
    const pos = ECS.get(id, 'pos');
    const vel = ECS.get(id, 'vel');
    const phy = ECS.get(id, 'physics');
    const ai  = ECS.get(id, 'ai');
    const pp  = playerPos(gs);
    if (!pp || !pos || !vel) return BT.FAILURE;
    const dx = pp.x - pos.x, dy = pp.y - pos.y;
    const dist = Math.hypot(dx, dy) || 1;
    ai.ambushTimer = (ai.ambushTimer||0) + 1;
    vel.vx = (vel.vx||0)*0.88 + (dx/dist)*phy.speed*0.18;
    vel.vy = (vel.vy||0)*0.88 + (dy/dist)*phy.speed*0.18;
    const spd = Math.hypot(vel.vx, vel.vy);
    if (spd > phy.speed) { vel.vx = vel.vx/spd*phy.speed; vel.vy = vel.vy/spd*phy.speed; }
    if (ai.ambushTimer > 90 && dist < 90) {
      vel.vx = (dx/dist)*9;
      vel.vy = (dy/dist)*9;
      ai.ambushTimer = 0;
      spawnParticles(pos.x, pos.y, '#ffaa00', 15);
    }
    return BT.RUNNING;
  })
);

// ── PartyHat: fast + periodic speed dives ──
const BT_PARTYHAT = new BTSelector(
  new BTAction((id, gs) => {
    if (gs.frozen) return BT.RUNNING;
    const pos = ECS.get(id, 'pos');
    const vel = ECS.get(id, 'vel');
    const phy = ECS.get(id, 'physics');
    const ai  = ECS.get(id, 'ai');
    const pp  = playerPos(gs);
    if (!pp || !pos || !vel) return BT.FAILURE;
    const dx = pp.x - pos.x, dy = pp.y - pos.y;
    const dist = Math.hypot(dx, dy) || 1;
    ai.diveTimer = (ai.diveTimer||0) + 1;
    vel.vx = (vel.vx||0)*0.88 + (dx/dist)*phy.speed*0.18;
    vel.vy = (vel.vy||0)*0.88 + (dy/dist)*phy.speed*0.18;
    const spd = Math.hypot(vel.vx, vel.vy);
    if (spd > phy.speed) { vel.vx = vel.vx/spd*phy.speed; vel.vy = vel.vy/spd*phy.speed; }
    if (ai.diveTimer > 70 && dist < 140) {
      phy.speed = Math.min(phy.speed * 1.5, 5.5);
      ai.diveTimer = -150;
      spawnParticles(pos.x, pos.y, '#ffdd00', 8);
    }
    const base = (1.2 + gs.wave * 0.12) * ENEMY_DEFS.partyHat.speedMult;
    if (phy.speed > base) phy.speed = Math.max(phy.speed * 0.985, base);
    return BT.RUNNING;
  })
);

// ── Boss (Floor 1) ──
const BT_BOSS = new BTSelector(
  new BTAction((id, gs) => {
    if (gs.frozen) return BT.RUNNING;
    const pos = ECS.get(id, 'pos');
    const vel = ECS.get(id, 'vel');
    const phy = ECS.get(id, 'physics');
    const ai  = ECS.get(id, 'ai');
    const hp  = ECS.get(id, 'hp');
    const pp  = playerPos(gs);
    if (!pp || !pos || !vel) return BT.FAILURE;

    const phase2 = hp.hp < hp.maxHp * 0.5;

    // Drift toward center
    const cx = worldW / 2, cy = worldH / 2;
    const toCX = cx - pos.x, toCY = cy - pos.y;
    const distCenter = Math.hypot(toCX, toCY);
    if (distCenter > 180) {
      vel.vx += (toCX / distCenter) * 0.08;
      vel.vy += (toCY / distCenter) * 0.08;
    } else {
      vel.vx += (Math.random() - 0.5) * 0.12;
      vel.vy += (Math.random() - 0.5) * 0.12;
    }
    const spd = Math.hypot(vel.vx, vel.vy);
    const maxSpd = phase2 ? phy.speed * 1.5 : phy.speed;
    if (spd > maxSpd) { vel.vx = vel.vx/spd*maxSpd; vel.vy = vel.vy/spd*maxSpd; }

    if (pos.x < 80)          vel.vx += 0.3;
    if (pos.x > worldW - 80) vel.vx -= 0.3;
    if (pos.y < 80)          vel.vy += 0.3;
    if (pos.y > worldH - 80) vel.vy -= 0.3;

    ai.bossPhase    = ai.bossPhase    || BOSS_PHASE.IDLE;
    ai.phaseTimer   = ai.phaseTimer   ?? 120;
    ai.spiralAngle  = ai.spiralAngle  || 0;
    ai.volleyCount  = ai.volleyCount  || 0;
    ai.volleyTimer  = ai.volleyTimer  || 0;
    ai.slamTarget   = ai.slamTarget   || null;
    ai.slamRadius   = ai.slamRadius   || 0;
    ai.slamWarning  = ai.slamWarning  || 0;

    const dx = pp.x - pos.x, dy = pp.y - pos.y;

    if (ai.bossPhase === BOSS_PHASE.IDLE) {
      ai.phaseTimer--;
      if (ai.phaseTimer <= 0) {
        const roll = Math.random();
        if (roll < 0.33) {
          ai.bossPhase  = BOSS_PHASE.SLAM_TELEGRAPH;
          ai.slamTarget = { x: pp.x, y: pp.y };
          ai.slamRadius = 0;
          ai.slamWarning = 90;
          showMsg('⚠️ INCOMING SLAM!');
        } else if (roll < 0.66) {
          ai.bossPhase = BOSS_PHASE.SPIRAL;
          ai.phaseTimer = phase2 ? 220 : 160;
          ai.spiralAngle = 0;
        } else {
          ai.bossPhase  = BOSS_PHASE.VOLLEY;
          ai.volleyCount = phase2 ? 5 : 3;
          ai.volleyTimer = 0;
        }
      }
    }
    else if (ai.bossPhase === BOSS_PHASE.SLAM_TELEGRAPH) {
      vel.vx *= 0.85; vel.vy *= 0.85;
      ai.slamWarning--;
      ai.slamRadius = (1 - ai.slamWarning / 90) * 70;
      if (ai.slamWarning <= 0) {
        ai.bossPhase = BOSS_PHASE.SLAM_STRIKE;
        ai.phaseTimer = 8;
      }
    }
    else if (ai.bossPhase === BOSS_PHASE.SLAM_STRIKE) {
      vel.vx *= 0.7; vel.vy *= 0.7;
      ai.phaseTimer--;
      const slamDist = Math.hypot(pp.x - ai.slamTarget.x, pp.y - ai.slamTarget.y);
      if (slamDist < 70 && gs.invincible <= 0) {
        gs.health -= 35;
        gs.invincible = CFG.INVINCIBLE_FRAMES;
        gs.shakeX = 28; gs.shakeY = 28;
        gs.flawlessThisWave = false;
        triggerSFPHit();
        spawnParticles(pp.x, pp.y, '#cc00ff', 20);
        updateHUD();
        if (gs.health <= 0) { gameOver(); return BT.FAILURE; }
      }
      spawnParticles(ai.slamTarget.x, ai.slamTarget.y, '#cc00ff', 30);
      spawnParticles(ai.slamTarget.x, ai.slamTarget.y, '#ffffff', 15);
      if (phase2) {
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          gs.enemyBullets.push({ x: ai.slamTarget.x, y: ai.slamTarget.y, vx: Math.cos(a)*3.5, vy: Math.sin(a)*3.5, life: 120, maxLife: 120, color: '#cc00ff' });
        }
      }
      if (ai.phaseTimer <= 0) {
        ai.bossPhase = BOSS_PHASE.SLAM_RECOVER;
        ai.phaseTimer = 60;
        showMsg('BOSS STUNNED!');
      }
    }
    else if (ai.bossPhase === BOSS_PHASE.SLAM_RECOVER) {
      vel.vx *= 0.8; vel.vy *= 0.8;
      ai.phaseTimer--;
      if (ai.phaseTimer <= 0) {
        ai.bossPhase = BOSS_PHASE.IDLE;
        ai.phaseTimer = phase2 ? 60 : 90;
        ai.slamTarget = null;
      }
    }
    else if (ai.bossPhase === BOSS_PHASE.SPIRAL) {
      vel.vx *= 0.92; vel.vy *= 0.92;
      ai.phaseTimer--;
      const spiralRate = phase2 ? 4 : 6;
      if (ai.phaseTimer % spiralRate === 0) {
        const arms = phase2 ? 4 : 3;
        for (let arm = 0; arm < arms; arm++) {
          const a = ai.spiralAngle + (arm / arms) * Math.PI * 2;
          const spd2 = phase2 ? 4.5 : 3.5;
          gs.enemyBullets.push({ x: pos.x, y: pos.y, vx: Math.cos(a)*spd2, vy: Math.sin(a)*spd2, life: 140, maxLife: 140, color: '#cc00ff' });
        }
        ai.spiralAngle += phase2 ? 0.18 : 0.14;
      }
      if (ai.phaseTimer <= 0) {
        ai.bossPhase = BOSS_PHASE.IDLE;
        ai.phaseTimer = phase2 ? 50 : 80;
      }
    }
    else if (ai.bossPhase === BOSS_PHASE.VOLLEY) {
      vel.vx *= 0.88; vel.vy *= 0.88;
      ai.volleyTimer--;
      if (ai.volleyTimer <= 0 && ai.volleyCount > 0) {
        const aim = Math.atan2(dy, dx);
        const count = phase2 ? 9 : 7;
        for (let i = 0; i < count; i++) {
          const spread = phase2 ? 0.55 : 0.45;
          const a = aim + (i / (count - 1) - 0.5) * spread * 2;
          gs.enemyBullets.push({ x: pos.x, y: pos.y, vx: Math.cos(a)*5.5, vy: Math.sin(a)*5.5, life: 110, maxLife: 110, color: '#ff44ff' });
        }
        spawnParticles(pos.x, pos.y, '#ff00ff', 10);
        ai.volleyCount--;
        ai.volleyTimer = phase2 ? 22 : 30;
        if (ai.volleyCount === 0) {
          ai.bossPhase = BOSS_PHASE.IDLE;
          ai.phaseTimer = phase2 ? 40 : 70;
        }
      }
    }

    return BT.RUNNING;
  })
);

// ── Floor 2: Birthday Bomber ──
const BT_BIRTHDAY_BOMBER = new BTSelector(
  new BTAction((id, gs) => {
    if (gs.frozen) return BT.RUNNING;
    const pos = ECS.get(id,'pos'), vel = ECS.get(id,'vel'), phy = ECS.get(id,'physics');
    const ai = ECS.get(id,'ai'), pp = playerPos(gs);
    if (!pp || !pos || !vel) return BT.FAILURE;
    const dx = pp.x - pos.x, dy = pp.y - pos.y;
    const dist = Math.hypot(dx,dy)||1;
    ai.chargeTimer = (ai.chargeTimer||0) + 1;
    if (dist < 160 && ai.chargeTimer > 60) {
      vel.vx = (dx/dist)*phy.speed*1.8;
      vel.vy = (dy/dist)*phy.speed*1.8;
      ai.chargeTimer = 0;
      spawnParticles(pos.x, pos.y, '#ff4400', 6);
    } else {
      vel.vx = (vel.vx||0)*0.88 + (dx/dist)*phy.speed*0.18;
      vel.vy = (vel.vy||0)*0.88 + (dy/dist)*phy.speed*0.18;
      const spd = Math.hypot(vel.vx,vel.vy);
      if (spd > phy.speed) { vel.vx=vel.vx/spd*phy.speed; vel.vy=vel.vy/spd*phy.speed; }
    }
    return BT.RUNNING;
  })
);

// ── Floor 2: Piñata ──
const BT_PINATA = new BTSelector(
  new BTAction((id, gs) => {
    if (gs.frozen) return BT.RUNNING;
    const pos = ECS.get(id,'pos'), vel = ECS.get(id,'vel'), phy = ECS.get(id,'physics');
    const hp = ECS.get(id,'hp'), pp = playerPos(gs);
    if (!pp || !pos || !vel) return BT.FAILURE;
    const dx = pp.x-pos.x, dy = pp.y-pos.y, dist = Math.hypot(dx,dy)||1;
    vel.vx = (vel.vx||0)*0.88 + (dx/dist)*phy.speed*0.18;
    vel.vy = (vel.vy||0)*0.88 + (dy/dist)*phy.speed*0.18;
    const spd = Math.hypot(vel.vx,vel.vy);
    if (spd > phy.speed) { vel.vx=vel.vx/spd*phy.speed; vel.vy=vel.vy/spd*phy.speed; }
    const ratio = hp.hp / hp.maxHp;
    if (ratio < 0.3 && Math.random() < 0.05) spawnParticles(pos.x, pos.y, '#ff88ff', 3);
    return BT.RUNNING;
  })
);

// ── Floor 2: Balloon Witch ──
const BT_BALLOON_WITCH = new BTSelector(
  new BTAction((id, gs) => {
    if (gs.frozen) return BT.RUNNING;
    const pos = ECS.get(id,'pos'), vel = ECS.get(id,'vel'), phy = ECS.get(id,'physics');
    const ai = ECS.get(id,'ai'), pp = playerPos(gs);
    if (!pp || !pos || !vel) return BT.FAILURE;
    const dx = pp.x-pos.x, dy = pp.y-pos.y, dist = Math.hypot(dx,dy)||1;
    const targetDist = 180;
    const orbitAngle = Math.atan2(dy,dx) + 0.015;
    const tx = pp.x - Math.cos(orbitAngle)*targetDist;
    const ty = pp.y - Math.sin(orbitAngle)*targetDist;
    vel.vx = (vel.vx||0)*0.88 + ((tx-pos.x)/80)*phy.speed*0.18;
    vel.vy = (vel.vy||0)*0.88 + ((ty-pos.y)/80)*phy.speed*0.18;
    const spd = Math.hypot(vel.vx,vel.vy);
    if (spd > phy.speed) { vel.vx=vel.vx/spd*phy.speed; vel.vy=vel.vy/spd*phy.speed; }
    ai.shootCooldown = (ai.shootCooldown||150) - 1;
    if (ai.shootCooldown <= 0) {
      ai.shootCooldown = 150;
      const aim = Math.atan2(dy,dx);
      gs.enemyBullets.push({ x:pos.x, y:pos.y, vx:Math.cos(aim)*2.5, vy:Math.sin(aim)*2.5, life:200, maxLife:200, color:'#9944ff', homing:true, homingStrength:0.04 });
      spawnParticles(pos.x, pos.y, '#9944ff', 5);
    }
    return BT.RUNNING;
  })
);

// ── Floor 2: Streamer Ghost ──
const BT_STREAMER_GHOST = new BTSelector(
  new BTAction((id, gs) => {
    if (gs.frozen) return BT.RUNNING;
    const pos = ECS.get(id,'pos'), vel = ECS.get(id,'vel'), phy = ECS.get(id,'physics');
    const ai = ECS.get(id,'ai'), pp = playerPos(gs);
    if (!pp || !pos || !vel) return BT.FAILURE;
    const dx = pp.x-pos.x, dy = pp.y-pos.y, dist = Math.hypot(dx,dy)||1;
    ai.phaseTimer = (ai.phaseTimer||0) + 1;
    const cycle = ai.phaseTimer % 135;
    ai.phased = cycle >= 90;
    if (!ai.phased) {
      vel.vx = (vel.vx||0)*0.88 + (dx/dist)*phy.speed*0.18;
      vel.vy = (vel.vy||0)*0.88 + (dy/dist)*phy.speed*0.18;
      const spd = Math.hypot(vel.vx,vel.vy);
      if (spd > phy.speed) { vel.vx=vel.vx/spd*phy.speed; vel.vy=vel.vy/spd*phy.speed; }
    } else {
      if (cycle === 90) {
        pos.x = pp.x + (Math.random()-.5)*120;
        pos.y = pp.y + (Math.random()-.5)*120;
        pos.x = Math.max(40, Math.min(worldW-40, pos.x));
        pos.y = Math.max(40, Math.min(worldH-40, pos.y));
        spawnParticles(pos.x, pos.y, '#44ffcc', 12);
      }
      vel.vx *= 0.7; vel.vy *= 0.7;
    }
    return BT.RUNNING;
  })
);

// ── Floor 2: Boss 2 ──
const BT_BOSS2 = new BTSelector(
  new BTAction((id, gs) => {
    if (gs.frozen) return BT.RUNNING;
    const pos = ECS.get(id,'pos'), vel = ECS.get(id,'vel'), phy = ECS.get(id,'physics');
    const ai = ECS.get(id,'ai'), hp = ECS.get(id,'hp'), pp = playerPos(gs);
    if (!pp || !pos || !vel) return BT.FAILURE;
    const phase2 = hp.hp < hp.maxHp * 0.5;
    const dx = pp.x - pos.x, dy = pp.y - pos.y;

    const cx = worldW/2, cy = worldH/2;
    const toCX = cx-pos.x, toCY = cy-pos.y;
    const distCenter = Math.hypot(toCX,toCY);
    if (distCenter > 160) { vel.vx += (toCX/distCenter)*0.1; vel.vy += (toCY/distCenter)*0.1; }
    else { vel.vx += (dx/Math.hypot(dx,dy)||1)*0.06; vel.vy += (dy/Math.hypot(dx,dy)||1)*0.06; }
    const spd = Math.hypot(vel.vx,vel.vy);
    const maxSpd = phase2 ? phy.speed*1.8 : phy.speed*1.2;
    if (spd > maxSpd) { vel.vx=vel.vx/spd*maxSpd; vel.vy=vel.vy/spd*maxSpd; }
    if (pos.x<80) vel.vx+=0.4; if (pos.x>worldW-80) vel.vx-=0.4;
    if (pos.y<80) vel.vy+=0.4; if (pos.y>worldH-80) vel.vy-=0.4;

    ai.bossPhase = ai.bossPhase || 'IDLE';
    ai.phaseTimer = ai.phaseTimer ?? 100;
    ai.spiralAngle = ai.spiralAngle || 0;
    ai.volleyCount = ai.volleyCount || 0;
    ai.volleyTimer = ai.volleyTimer || 0;

    if (ai.bossPhase === 'IDLE') {
      ai.phaseTimer--;
      if (ai.phaseTimer <= 0) {
        const roll = Math.random();
        if (roll < 0.4) { ai.bossPhase = 'SPIRAL'; ai.phaseTimer = phase2 ? 180 : 130; ai.spiralAngle = 0; }
        else if (roll < 0.7) { ai.bossPhase = 'SUMMON'; ai.phaseTimer = phase2 ? 3 : 2; }
        else { ai.bossPhase = 'VOLLEY'; ai.volleyCount = phase2 ? 6 : 4; ai.volleyTimer = 0; }
      }
    } else if (ai.bossPhase === 'SPIRAL') {
      vel.vx *= 0.92; vel.vy *= 0.92; ai.phaseTimer--;
      const rate = phase2 ? 3 : 5;
      if (ai.phaseTimer % rate === 0) {
        const arms = phase2 ? 5 : 3;
        for (let arm=0;arm<arms;arm++) {
          const a = ai.spiralAngle + (arm/arms)*Math.PI*2;
          gs.enemyBullets.push({x:pos.x,y:pos.y,vx:Math.cos(a)*4,vy:Math.sin(a)*4,life:150,maxLife:150,color:'#ff4400'});
        }
        ai.spiralAngle += phase2 ? 0.2 : 0.15;
      }
      if (ai.phaseTimer<=0) { ai.bossPhase='IDLE'; ai.phaseTimer=phase2?45:70; }
    } else if (ai.bossPhase === 'SUMMON') {
      for (let i=0;i<ai.phaseTimer;i++) {
        const angle = Math.random()*Math.PI*2;
        const r = 100+Math.random()*80;
        const sx = Math.max(40,Math.min(worldW-40, pos.x+Math.cos(angle)*r));
        const sy = Math.max(40,Math.min(worldH-40, pos.y+Math.sin(angle)*r));
        const types2 = ['birthdayBomber','balloonWitch','streamerGhost'];
        const stype = types2[Math.floor(Math.random()*types2.length)];
        const def2 = ENEMY_DEFS[stype];
        const baseHp2 = 1 + Math.floor(gs.wave/2);
        const sid = ECS.createEntity();
        ECS.add(sid,'enemy',{type:stype}); ECS.add(sid,'pos',{x:sx,y:sy,angle:0});
        ECS.add(sid,'vel',{vx:0,vy:0}); ECS.add(sid,'hp',{hp:Math.ceil(baseHp2*def2.hpMult),maxHp:Math.ceil(baseHp2*def2.hpMult),hitFlash:0});
        ECS.add(sid,'physics',{speed:(1.2+Math.random()*0.6+gs.wave*0.1)*def2.speedMult});
        ECS.add(sid,'ai',{shootCooldown:120,chargeTimer:0,phaseTimer:0,phased:false});
        spawnParticles(sx,sy,'#ff4400',10);
      }
      showMsg('BOSS SUMMONS MINIONS!');
      ai.bossPhase = 'IDLE'; ai.phaseTimer = phase2 ? 60 : 90;
    } else if (ai.bossPhase === 'VOLLEY') {
      vel.vx *= 0.88; vel.vy *= 0.88; ai.volleyTimer--;
      if (ai.volleyTimer <= 0 && ai.volleyCount > 0) {
        const aim = Math.atan2(dy,dx);
        const count = phase2 ? 10 : 7;
        for (let i=0;i<count;i++) {
          const spread = phase2 ? 0.6 : 0.4;
          const a = aim + (i/(count-1)-.5)*spread*2;
          gs.enemyBullets.push({x:pos.x,y:pos.y,vx:Math.cos(a)*6,vy:Math.sin(a)*6,life:110,maxLife:110,color:'#ff4400'});
        }
        spawnParticles(pos.x,pos.y,'#ff4400',10);
        ai.volleyCount--; ai.volleyTimer = phase2 ? 20 : 28;
        if (ai.volleyCount===0) { ai.bossPhase='IDLE'; ai.phaseTimer=phase2?40:65; }
      }
    }
    return BT.RUNNING;
  })
);

// ── Carnival: Human Cannonball ──
const BT_CANNONBALL = new BTSelector(
  new BTAction((id, gs) => {
    if (gs.frozen) return BT.RUNNING;
    const pos = ECS.get(id,'pos'), vel = ECS.get(id,'vel'), phy = ECS.get(id,'physics');
    const ai = ECS.get(id,'ai'), pp = playerPos(gs);
    if (!pp || !pos || !vel) return BT.FAILURE;
    ai.chargeState = ai.chargeState || 'IDLE';
    ai.chargeTimer = (ai.chargeTimer || 0) - 1;

    if (ai.chargeState === 'IDLE') {
      const dx = pp.x - pos.x, dy = pp.y - pos.y, dist = Math.hypot(dx,dy)||1;
      vel.vx = (vel.vx||0)*0.9 + (dx/dist)*phy.speed*0.1;
      vel.vy = (vel.vy||0)*0.9 + (dy/dist)*phy.speed*0.1;
      if (ai.chargeTimer <= 0) {
        ai.chargeTarget = { x: pp.x, y: pp.y };
        ai.chargeState = 'TELEGRAPH';
        ai.chargeTimer = 70;
        vel.vx *= 0.2; vel.vy *= 0.2;
        spawnParticles(pos.x, pos.y, '#ff6600', 8);
        showMsg('CANNONBALL INCOMING!');
      }
    } else if (ai.chargeState === 'TELEGRAPH') {
      vel.vx *= 0.85; vel.vy *= 0.85;
      if (ai.chargeTimer % 12 === 0) spawnParticles(pos.x, pos.y, '#ff4400', 5);
      if (ai.chargeTimer <= 0) {
        const tx = ai.chargeTarget.x - pos.x, ty = ai.chargeTarget.y - pos.y;
        const tDist = Math.hypot(tx,ty)||1;
        vel.vx = (tx/tDist) * 18;
        vel.vy = (ty/tDist) * 18;
        ai.chargeState = 'CHARGING';
        ai.chargeTimer = 80;
      }
    } else if (ai.chargeState === 'CHARGING') {
      spawnParticles(pos.x, pos.y, '#ff6600', 2);
      const hitWall = pos.x < 30 || pos.x > worldW-30 || pos.y < 30 || pos.y > worldH-30;
      if (hitWall || ai.chargeTimer <= 0) {
        const ppos2 = ECS.get(gs.playerId, 'pos');
        if (Math.hypot(pos.x - ppos2.x, pos.y - ppos2.y) < 80 && gs.invincible <= 0) {
          gs.health -= 15; gs.invincible = CFG.INVINCIBLE_FRAMES;
          gs.shakeX = 14; gs.shakeY = 14;
          gs.flawlessThisWave = false;
          updateHUD(); if (gs.health <= 0) { gameOver(); return BT.FAILURE; }
        }
        spawnParticles(pos.x, pos.y, '#ff4400', 20);
        vel.vx *= 0.1; vel.vy *= 0.1;
        ai.chargeState = 'RECOVER';
        ai.chargeTimer = 120;
      }
    } else if (ai.chargeState === 'RECOVER') {
      vel.vx *= 0.92; vel.vy *= 0.92;
      if (ai.chargeTimer <= 0) {
        ai.chargeState = 'IDLE';
        ai.chargeTimer = 90 + Math.random()*60;
      }
    }
    return BT.RUNNING;
  })
);

// ── Carnival: Ringmaster ──
const BT_RINGMASTER = new BTSelector(
  new BTAction((id, gs) => {
    if (gs.frozen) return BT.RUNNING;
    const pos = ECS.get(id,'pos'), vel = ECS.get(id,'vel'), phy = ECS.get(id,'physics');
    const ai = ECS.get(id,'ai'), pp = playerPos(gs);
    if (!pp || !pos || !vel) return BT.FAILURE;
    const dx = pp.x - pos.x, dy = pp.y - pos.y, dist = Math.hypot(dx,dy)||1;
    const AURA_RANGE = 160;

    const flee = dist < 120;
    if (flee) {
      vel.vx = (vel.vx||0)*0.88 - (dx/dist)*phy.speed*0.25;
      vel.vy = (vel.vy||0)*0.88 - (dy/dist)*phy.speed*0.25;
    } else {
      const orbitAngle = Math.atan2(dy,dx) + 0.012;
      const tx = pp.x - Math.cos(orbitAngle)*220;
      const ty = pp.y - Math.sin(orbitAngle)*220;
      vel.vx = (vel.vx||0)*0.88 + ((tx-pos.x)/100)*phy.speed*0.2;
      vel.vy = (vel.vy||0)*0.88 + ((ty-pos.y)/100)*phy.speed*0.2;
    }
    const spd = Math.hypot(vel.vx,vel.vy);
    if (spd > phy.speed) { vel.vx=vel.vx/spd*phy.speed; vel.vy=vel.vy/spd*phy.speed; }

    for (const eid of ECS.query('enemy','pos','physics','ai')) {
      if (eid === id) continue;
      const epos = ECS.get(eid,'pos');
      const eai  = ECS.get(eid,'ai');
      if (Math.hypot(epos.x-pos.x, epos.y-pos.y) < AURA_RANGE) {
        eai.ringmasterBuffed = true;
        eai.ringmasterBuffTimer = 6;
      }
    }

    ai.shootCooldown = (ai.shootCooldown||180) - 1;
    if (ai.shootCooldown <= 0 && dist < 280) {
      ai.shootCooldown = 180;
      const aim = Math.atan2(dy,dx);
      for (const sa of [-0.35, -0.18, 0, 0.18, 0.35]) {
        const a = aim + sa;
        gs.enemyBullets.push({ x:pos.x, y:pos.y, vx:Math.cos(a)*3, vy:Math.sin(a)*3, life:130, maxLife:130, color:'#cc0044' });
      }
      spawnParticles(pos.x, pos.y, '#cc0044', 8);
    }
    return BT.RUNNING;
  })
);

// ── Carnival: Tightrope Walker ──
const BT_TIGHTROPE = new BTSelector(
  new BTAction((id, gs) => {
    if (gs.frozen) return BT.RUNNING;
    const pos = ECS.get(id,'pos'), vel = ECS.get(id,'vel'), phy = ECS.get(id,'physics');
    const ai = ECS.get(id,'ai');
    if (!pos || !vel) return BT.FAILURE;

    ai.moveDir = ai.moveDir ?? (Math.random() < 0.5 ? 'H' : 'V');
    ai.stepTimer = (ai.stepTimer ?? 0) - 1;
    ai.moveSign = ai.moveSign ?? (Math.random() < 0.5 ? 1 : -1);

    if (ai.moveDir === 'H') { vel.vx = phy.speed * ai.moveSign; vel.vy = 0; }
    else { vel.vx = 0; vel.vy = phy.speed * ai.moveSign; }

    const atEdge = pos.x < 50 || pos.x > worldW-50 || pos.y < 50 || pos.y > worldH-50;
    if (atEdge || ai.stepTimer <= 0) {
      const bulletCount = 12;
      for (let i = 0; i < bulletCount; i++) {
        const a = (i / bulletCount) * Math.PI * 2;
        gs.enemyBullets.push({ x:pos.x, y:pos.y, vx:Math.cos(a)*3.5, vy:Math.sin(a)*3.5, life:100, maxLife:100, color:'#00ccff' });
      }
      spawnParticles(pos.x, pos.y, '#00ccff', 10);
      ai.moveDir = ai.moveDir === 'H' ? 'V' : 'H';
      ai.moveSign = Math.random() < 0.5 ? 1 : -1;
      ai.stepTimer = 80 + Math.random()*60;
      if (pos.x < 50)        pos.x = 55;
      if (pos.x > worldW-50) pos.x = worldW-55;
      if (pos.y < 50)        pos.y = 55;
      if (pos.y > worldH-50) pos.y = worldH-55;
    }
    return BT.RUNNING;
  })
);

// ================================================================
// ENEMY BT MAP
// ================================================================
const ENEMY_BTS = {
  scissors:       BT_SCISSORS,
 mask:           BT_MASK, 
  giftBox:        BT_GIFTBOX,
  partyHat:       BT_PARTYHAT,
  boss:           BT_BOSS,
  birthdayBomber: BT_BIRTHDAY_BOMBER,
  pinata:         BT_PINATA,
  balloonWitch:   BT_BALLOON_WITCH,
  streamerGhost:  BT_STREAMER_GHOST,
  boss2:          BT_BOSS2,
  cannonball:     BT_CANNONBALL,
  ringmaster:     BT_RINGMASTER,
  tightrope:      BT_TIGHTROPE,
};

// ================================================================
// ENEMY DEFINITIONS
// ================================================================
const ENEMY_DEFS = {
  scissors:       { hpMult: 1.0, speedMult: 1.0,  size: 28, color: '#cc2222' },
 mask:    { hpMult: 1.1, speedMult: 1.05, size: 28, color: '#44aaff' },
  juggler: { hpMult: 2.0, speedMult: 0.55, size: 36, color: '#ffdd00' },
  giftBox:        { hpMult: 2.2, speedMult: 0.6,  size: 34, color: '#ffaa00' },
  partyHat:       { hpMult: 0.8, speedMult: 1.4,  size: 26, color: '#ffdd00' },
  boss:           { hpMult: 1,   speedMult: 0.4,  size: 55, color: '#9900cc' },
  birthdayBomber: { hpMult: 1.4, speedMult: 0.85, size: 30, color: '#ff4400' },
  pinata:         { hpMult: 4.0, speedMult: 0.5,  size: 38, color: '#ff88ff' },
  balloonWitch:   { hpMult: 1.1, speedMult: 1.1,  size: 28, color: '#9944ff' },
  streamerGhost:  { hpMult: 0.9, speedMult: 1.3,  size: 26, color: '#44ffcc' },
  boss2:          { hpMult: 1,   speedMult: 0.45, size: 60, color: '#ff2200' },
  cannonball:     { hpMult: 1.6, speedMult: 0.5,  size: 30, color: '#ff6600' },
  ringmaster:     { hpMult: 1.2, speedMult: 0.7,  size: 32, color: '#cc0044' },
  tightrope:      { hpMult: 0.8, speedMult: 1.1,  size: 24, color: '#00ccff' },
};
