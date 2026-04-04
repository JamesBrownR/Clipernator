// ============================================================
// CLIPBLAST: PARTY HUNTER — Draw Functions
// ============================================================

function drawScissors(epos, ehp, frozen) {
  const { x, y, angle } = epos;
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  if (frozen) { ctx.shadowColor='#aaccff'; ctx.shadowBlur=18; ctx.globalAlpha=0.7; }
  else { ctx.shadowColor='#ff3333'; ctx.shadowBlur=12; }
  const openAmt = frozen ? 0.05 : Math.abs(Math.sin(Date.now()/100))*.5;
  ctx.save(); ctx.rotate(openAmt);
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(22,-6); ctx.lineTo(24,0); ctx.lineTo(0,0);
  ctx.fillStyle=frozen?'#4488cc':'#cc2222'; ctx.fill();
  ctx.strokeStyle=frozen?'#88ccff':'#ff4444'; ctx.lineWidth=1.5; ctx.stroke(); ctx.restore();
  ctx.save(); ctx.rotate(-openAmt);
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(22,6); ctx.lineTo(24,0); ctx.lineTo(0,0);
  ctx.fillStyle=frozen?'#4488cc':'#cc2222'; ctx.fill();
  ctx.strokeStyle=frozen?'#88ccff':'#ff4444'; ctx.lineWidth=1.5; ctx.stroke(); ctx.restore();
  ctx.fillStyle=frozen?'#aaddff':'#ffcc00'; ctx.beginPath(); ctx.arc(0,0,4.5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=frozen?'#88aacc':'#aa8800'; ctx.beginPath(); ctx.arc(0,0,2,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=frozen?'#6699cc':'#999'; ctx.lineWidth=3.5; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-4,-4); ctx.arc(-11,-9,6.5,0,Math.PI*1.4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-4,4);  ctx.arc(-11,9,6.5,0,Math.PI*1.4,true); ctx.stroke();
  ctx.restore();
  const bw=34;
  ctx.fillStyle='#330000'; ctx.fillRect(x-bw/2,y-34,bw,5);
  ctx.fillStyle=ehp.hp<ehp.maxHp/2?'#ff6666':'#cc0000'; ctx.fillRect(x-bw/2,y-34,bw*(ehp.hp/ehp.maxHp),5);
}

function drawClown(epos, ehp, frozen) {
  const {x,y,angle}=epos;
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
  if (frozen) { ctx.globalAlpha=0.7; ctx.shadowColor='#aaccff'; } else { ctx.shadowColor='#ff44aa'; }
  ctx.shadowBlur=14;
  ctx.fillStyle=frozen?'#88aaff':'#ff6699'; ctx.beginPath(); ctx.arc(0,-4,14,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=frozen?'#ffffff':'#330011'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,6,8,.3,Math.PI-.3); ctx.stroke();
  ctx.fillStyle='#000'; ctx.fillRect(-6,-8,4,5); ctx.fillRect(3,-8,4,5);
  ctx.fillStyle='#ff0000'; ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=frozen?'#aaccff':'#aa00aa'; ctx.fillRect(-15,-18,30,8);
  ctx.fillStyle='#ffdd00'; ctx.beginPath(); ctx.moveTo(-6,-16); ctx.lineTo(0,-32); ctx.lineTo(6,-16); ctx.fill();
  ctx.restore();
  const bw=40; ctx.fillStyle='#330000'; ctx.fillRect(x-bw/2,y-40,bw,5);
  ctx.fillStyle=ehp.hp<ehp.maxHp/2?'#ff6666':'#cc0000'; ctx.fillRect(x-bw/2,y-40,bw*(ehp.hp/ehp.maxHp),5);
}

function drawGiftBox(epos, ehp, ai, frozen) {
  const {x,y}=epos;
  ctx.save(); ctx.translate(x,y);
  if (frozen) ctx.globalAlpha=0.65;
  const shake = ai.ambushTimer > 60 ? Math.sin(Date.now()/30)*2 : 0;
  ctx.shadowColor=frozen?'#88ccff':'#ffaa00'; ctx.shadowBlur=16;
  ctx.fillStyle=frozen?'#77aaff':'#ff6699'; ctx.fillRect(-17+shake,-17,34,34);
  ctx.fillStyle='#ffee00'; ctx.fillRect(-18,-6,36,8); ctx.fillRect(-6,-18,8,36);
  ctx.fillStyle='#ff0000'; ctx.beginPath(); ctx.moveTo(0,-18); ctx.lineTo(-8,-28); ctx.lineTo(8,-28); ctx.fill();
  ctx.restore();
  const bw=40; ctx.fillStyle='#330000'; ctx.fillRect(x-bw/2,y-40,bw,5);
  ctx.fillStyle=ehp.hp<ehp.maxHp/2?'#ff6666':'#cc0000'; ctx.fillRect(x-bw/2,y-40,bw*(ehp.hp/ehp.maxHp),5);
}

function drawPartyHat(epos, ehp, frozen) {
  const {x,y,angle}=epos;
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle+(frozen?0:Math.sin(Date.now()/80)*.4));
  if (frozen) ctx.globalAlpha=0.7;
  ctx.shadowColor=frozen?'#aaccff':'#ffdd00'; ctx.shadowBlur=18;
  ctx.fillStyle=frozen?'#88ccff':'#ff6699'; ctx.beginPath(); ctx.moveTo(0,-22); ctx.lineTo(-14,12); ctx.lineTo(14,12); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(0,-24,5,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#ffffff'; ctx.lineWidth=2;
  for(let i=-10;i<12;i+=6){ctx.beginPath(); ctx.moveTo(-12,i); ctx.lineTo(12,i+4); ctx.stroke();}
  ctx.restore();
  const bw=36; ctx.fillStyle='#330000'; ctx.fillRect(x-bw/2,y-38,bw,5);
  ctx.fillStyle=ehp.hp<ehp.maxHp/2?'#ff6666':'#cc0000'; ctx.fillRect(x-bw/2,y-38,bw*(ehp.hp/ehp.maxHp),5);
}

function drawBoss(epos, ehp, frozen) {
  const {x,y,angle} = epos;
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  if (frozen) ctx.globalAlpha = 0.7;
  ctx.shadowColor = frozen ? '#aaccff' : '#cc00ff';
  ctx.shadowBlur = 28;
  ctx.fillStyle = frozen ? '#88aaff' : '#9900cc';
  ctx.beginPath(); ctx.arc(0,0,32,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#330011';
  ctx.fillRect(-18,-12,36,10);
  ctx.fillStyle = '#ff0000';
  ctx.beginPath(); ctx.arc(0,4,12,0.4,Math.PI-0.4); ctx.fill();
  ctx.fillStyle = '#ffdd00';
  ctx.beginPath(); ctx.moveTo(-22,-26); ctx.lineTo(-12,-38); ctx.lineTo(-4,-26); ctx.lineTo(4,-38); ctx.lineTo(12,-26); ctx.lineTo(22,-38); ctx.lineTo(-22,-26); ctx.fill();
  ctx.restore();
  const bw = 72;
  ctx.fillStyle = '#330000'; ctx.fillRect(x-bw/2, y-52, bw, 8);
  ctx.fillStyle = '#cc00ff'; ctx.fillRect(x-bw/2, y-52, bw * (ehp.hp/ehp.maxHp), 8);
}

function drawCannonball(epos, ehp, ai, frozen) {
  const {x,y} = epos;
  const charging = ai.chargeState === 'CHARGING';
  const telegraph = ai.chargeState === 'TELEGRAPH';
  ctx.save(); ctx.translate(x, y);
  if (frozen) { ctx.globalAlpha = 0.7; ctx.shadowColor = '#aaccff'; }
  else { ctx.shadowColor = charging ? '#ffffff' : '#ff6600'; ctx.shadowBlur = charging ? 30 : (telegraph ? 20 + Math.sin(Date.now()/80)*8 : 12); }
  const color = frozen ? '#4488cc' : (charging ? '#ffffff' : (telegraph ? '#ffaa00' : '#cc4400'));
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = frozen ? '#aaddff' : (charging ? '#ffffee' : '#ff8844');
  ctx.beginPath(); ctx.arc(-5, -5, 5, 0, Math.PI*2); ctx.fill();
  if (!charging) {
    ctx.strokeStyle = telegraph ? '#ffff00' : '#886622';
    ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0,-15); ctx.quadraticCurveTo(8,-22,4,-30); ctx.stroke();
    if (telegraph) {
      ctx.fillStyle='#ffff00'; ctx.shadowColor='#ffff00'; ctx.shadowBlur=10;
      ctx.beginPath(); ctx.arc(4,-30,3,0,Math.PI*2); ctx.fill();
    }
  }
  ctx.restore();
  const bw = 36;
  ctx.fillStyle='#330000'; ctx.fillRect(x-bw/2, y-34, bw, 5);
  ctx.fillStyle=ehp.hp<ehp.maxHp/2?'#ff6666':'#ff6600'; ctx.fillRect(x-bw/2, y-34, bw*(ehp.hp/ehp.maxHp), 5);
}

function drawRingmaster(epos, ehp, ai, frozen) {
  const {x,y} = epos;
  ctx.save(); ctx.translate(x,y);
  if (frozen) { ctx.globalAlpha=0.7; ctx.shadowColor='#aaccff'; }
  else { ctx.shadowColor='#cc0044'; ctx.shadowBlur=16; }
  ctx.fillStyle = frozen ? '#4488cc' : '#880022';
  ctx.fillRect(-14, -4, 28, 22);
  ctx.fillStyle = frozen ? '#aaddff' : '#cc0033';
  ctx.beginPath(); ctx.moveTo(-14,-4); ctx.lineTo(0,6); ctx.lineTo(-14,10); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(14,-4); ctx.lineTo(0,6); ctx.lineTo(14,10); ctx.closePath(); ctx.fill();
  ctx.fillStyle = frozen ? '#88aacc' : '#ffcc99';
  ctx.beginPath(); ctx.arc(0,-12,10,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = frozen ? '#4466aa' : '#110011';
  ctx.fillRect(-12,-28,24,16); ctx.fillRect(-9,-46,18,20);
  ctx.fillStyle = frozen ? '#88aadd' : '#cc0044';
  ctx.fillRect(-9,-32,18,4);
  if (!frozen) {
    const t = Date.now()/600;
    ctx.globalAlpha = 0.18 + Math.sin(t)*0.06;
    ctx.strokeStyle = '#cc0044'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(0,0,160,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  const bw = 38;
  ctx.fillStyle='#330000'; ctx.fillRect(x-bw/2, y-42, bw, 5);
  ctx.fillStyle=ehp.hp<ehp.maxHp/2?'#ff6666':'#cc0044'; ctx.fillRect(x-bw/2, y-42, bw*(ehp.hp/ehp.maxHp), 5);
}

function drawTightrope(epos, ehp, frozen) {
  const {x,y} = epos;
  const t = Date.now()/200;
  ctx.save(); ctx.translate(x,y);
  if (frozen) { ctx.globalAlpha=0.7; ctx.shadowColor='#aaccff'; }
  else { ctx.shadowColor='#00ccff'; ctx.shadowBlur=14; }
  ctx.strokeStyle = frozen ? '#aaddff' : '#00aacc';
  ctx.lineWidth=3; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-22, Math.sin(t)*3); ctx.lineTo(22, -Math.sin(t)*3); ctx.stroke();
  ctx.fillStyle = frozen ? '#4488cc' : '#0088cc';
  ctx.fillRect(-6, -8, 12, 16);
  ctx.fillStyle = frozen ? '#88aacc' : '#ffcc99';
  ctx.beginPath(); ctx.arc(0,-14,8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = frozen ? '#aaddff' : '#00ffff';
  ctx.shadowColor = frozen ? '#aaccff' : '#00ffff'; ctx.shadowBlur=8;
  ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.fillText('★',0,1);
  ctx.restore();
  const bw=32;
  ctx.fillStyle='#330000'; ctx.fillRect(x-bw/2,y-34,bw,5);
  ctx.fillStyle=ehp.hp<ehp.maxHp/2?'#ff6666':'#00aacc'; ctx.fillRect(x-bw/2,y-34,bw*(ehp.hp/ehp.maxHp),5);
}

// ============================================================
// PLAYER DRAW — split body + gun sprites
// Body faces movement direction (playerMoveAngle)
// Gun faces mouse (gunAngle) with recoil and flip
// ============================================================
function drawPlayer() {
  const ppos = ECS.get(gs.playerId, 'pos');
  let {x, y} = ppos;

  if (gs.hasShakeFizzlePop && !gs.sfpFull) {
    const ratio = gs.sfpMeter / gs.sfpMax;
    const shake = ratio * 5;
    x += (Math.random() - 0.5) * shake;
    y += (Math.random() - 0.5) * shake;
  }

  const blinking = gs.invincible > 0 && Math.floor(gs.invincible / 5) % 2 === 0;

  // ── SFP aura ──
  if (gs.hasShakeFizzlePop) {
    const ratio = gs.sfpFull ? 1 : gs.sfpMeter / gs.sfpMax;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = ratio * 0.55;
    ctx.fillStyle = gs.sfpFull ? '#ff8800' : '#ff2200';
    ctx.shadowColor = gs.sfpFull ? '#ffaa00' : '#ff0000';
    ctx.shadowBlur = 20 + ratio * 20;
    ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ── Gun constants ──
  // Shotgun content is ~4.6:1 aspect ratio, muzzle RIGHT, stock LEFT
  // Grip/trigger is ~32% from the left of the content = pivot point
  const GUN_W = 124;
  const GUN_H = 27;                    // 124 / 4.6 ≈ 27
  const GRIP_X = GUN_W * 0.32;        // pivot from left edge: where the trigger/grip is
  const GRIP_Y = GUN_H * 0.6;         // pivot slightly below center (gun sits lower)
  const GUN_DIST = 10;                 // how far gun center floats from player center
  const recoilDist = gunRecoil * 8;

  // Gun pivot position in world space
  const gx = x + Math.cos(gunAngle) * (GUN_DIST - recoilDist);
  const gy = y + Math.sin(gunAngle) * (GUN_DIST - recoilDist);

  // When aiming left, flip the gun vertically so it doesn't go upside-down
  const aimingLeft = Math.cos(gunAngle) < 0;

  // ── BODY ──
  // Always drawn upright. Flips horizontally when moving left.
  // Uses playerMoveAngle only to decide left/right flip — never rotates.
  if (playerImg.complete && playerImg.naturalWidth > 0) {
    // Body sprite content is ~276x579 in a 1024x1024 canvas
    // Content center X ≈ (207+483)/2 = 345, center Y ≈ (204+783)/2 = 493
    // We draw it centered on player position, upright
    const BODY_W = 36;
    const BODY_H = 56;  // portrait — taller than wide

    ctx.save();
    ctx.translate(x, y);
    if (blinking) ctx.globalAlpha = 0.35;

    // Flip horizontally when moving left
    const movingLeft = Math.cos(playerMoveAngle) < 0;
    if (movingLeft) ctx.scale(-1, 1);

    // Draw centered, slightly offset up so feet are at player collision center
    ctx.drawImage(playerImg,
      207, 204, 276, 579,           // source: just the content area
      -BODY_W / 2, -BODY_H * 0.6,  // dest: centered X, offset Y upward
      BODY_W, BODY_H
    );
    ctx.restore();
  }

  // ── GUN ──
  if (shotgunImg.complete && shotgunImg.naturalWidth > 0) {
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(gunAngle);
    if (aimingLeft) ctx.scale(1, -1);  // flip vertically when aiming left
    if (blinking) ctx.globalAlpha = 0.35;

    // Draw gun with pivot at grip position
    // Source: content area cols 56-953, rows 523-718
    ctx.drawImage(shotgunImg,
      56, 523, 897, 195,   // source content area
      -GRIP_X, -GRIP_Y,    // dest: pivot at grip
      GUN_W, GUN_H
    );
    ctx.restore();
  }

  if (gunRecoil > 0) gunRecoil = Math.max(0, gunRecoil - 0.08);

  // ── Clownish nose ──
  if (gs.hasClownish && gs.clownNoseSize > 0) {
    const noseR = 4 + gs.clownNoseSize * 14;
    ctx.save();
    ctx.translate(ppos.x, ppos.y - 10);
    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 10 + gs.clownNoseSize * 20;
    ctx.fillStyle = gs.clownNoseSize > 0.85 ? '#ffffff' : '#4488ff';
    ctx.globalAlpha = 0.7 + gs.clownNoseSize * 0.3;
    ctx.beginPath(); ctx.arc(0, 0, noseR, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  ctx.globalAlpha = 1;

  // ── Orbiting candles ──
  if (gs.hasCursedCandles) {
    const t = Date.now() / 1200;
    const orbitR = 44;
    const headY = -22;
    for (let i = 0; i < 5; i++) {
      const a = t + (i / 5) * Math.PI * 2;
      const cx = x + Math.cos(a) * orbitR;
      const cy = y + headY + Math.sin(a) * (orbitR * 0.35);
      const isLit = i < gs.candlesLit;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = isLit ? '#f5deb3' : '#aaaaaa';
      ctx.shadowColor = isLit ? '#ff8800' : 'transparent';
      ctx.shadowBlur = isLit ? 10 : 0;
      ctx.fillRect(-2.5, -7, 5, 10);
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, -10); ctx.stroke();
      if (isLit) {
        const flicker = Math.sin(Date.now() / 60 + i * 1.3) * 1.5;
        ctx.fillStyle = '#ffff88'; ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 12 + flicker;
        ctx.beginPath(); ctx.ellipse(0, -13 + flicker * 0.3, 2.5, 4 + flicker, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.ellipse(0, -13 + flicker * 0.3, 1, 2, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }
}

function drawBullet(b) {
  ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.angle);
  if (b.isDud) {
    ctx.fillStyle='#777'; ctx.shadowColor='#555'; ctx.shadowBlur=4; ctx.fillRect(-7,-1.5,14,3);
  } else {
    let color, glow;
    if (b.damageMult >= 4)      { color='#ff3333'; glow='#ff8888'; }
    else if (b.damageMult >= 3) { color='#cc44ff'; glow='#ee88ff'; }
    else if (b.damageMult >= 2) { color='#4488ff'; glow='#88bbff'; }
    else                        { color=gs.bouncyHouse?'#88ffdd':'#ffcc44'; glow=gs.bouncyHouse?'#00ffcc':'#ff8800'; }
    ctx.fillStyle=color; ctx.shadowColor=glow; ctx.shadowBlur=b.damageMult>1?16:9;
    const sc=b.damageMult>1?1.4:1;
    ctx.fillRect(-8*sc,-2.5*sc,16*sc,5*sc);
  }
  ctx.restore();
}

function draw() {
  ctx.clearRect(0,0,CFG.W,CFG.H);
  ctx.save();
  ctx.scale(renderScale, renderScale);
  ctx.translate(Math.round(gs.shakeX*.4), Math.round(gs.shakeY*.4));

  // Background + grid
  if (gs.floor === 2) {
    ctx.fillStyle = 'rgba(25,8,0,1)';
    ctx.fillRect(0, 0, worldW, worldH);
    ctx.strokeStyle = 'rgba(255,80,0,0.045)'; ctx.lineWidth = 1;
  } else {
    ctx.strokeStyle = 'rgba(0,255,100,0.035)'; ctx.lineWidth = 1;
  }
  for(let x=0; x<worldW; x+=40){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,worldH); ctx.stroke(); }
  for(let y=0; y<worldH; y+=40){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(worldW,y); ctx.stroke(); }

  // Party freeze tint
  if (gs.partyFreezeTimer > 0) {
    const alpha = Math.min(.18, gs.partyFreezeTimer/CFG.PARTY_FREEZE_FRAMES*.18);
    ctx.fillStyle=`rgba(255,100,200,${alpha})`; ctx.fillRect(0, 0, worldW, worldH);
  }

  // Field items
  for(const fi of gs.fieldItems) ITEM_DEFS[fi.id].draw(fi);

  // Popcorn kernels
  if (gs.hasPopcornBucket && gs.popcornKernels) {
    for (const k of gs.popcornKernels) {
      ctx.save(); ctx.translate(k.x, k.y);
      ctx.fillStyle = '#ffcc00'; ctx.shadowColor='#ffaa00'; ctx.shadowBlur=8;
      ctx.beginPath(); ctx.ellipse(0,0,5,7,0.3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ff8800';
      ctx.beginPath(); ctx.moveTo(-2,-4); ctx.lineTo(2,-4); ctx.lineTo(0,4); ctx.fill();
      ctx.restore();
    }
  }

  // Dash trail
  for(const t of gs.dashTrail) {
    ctx.save(); ctx.globalAlpha=(t.life/12)*.5;
    ctx.strokeStyle='#ffaa00'; ctx.lineWidth=3.5*1.4; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.shadowColor='#ffcc00'; ctx.shadowBlur=8;
    const s=1.4; ctx.save(); ctx.translate(t.x,t.y); ctx.rotate(t.angle+Math.PI/2);
    ctx.beginPath(); ctx.moveTo(-7*s,15*s); ctx.lineTo(-7*s,-9*s); ctx.arcTo(-7*s,-17*s,0,-17*s,7*s); ctx.arcTo(7*s,-17*s,7*s,-9*s,7*s); ctx.lineTo(7*s,11*s); ctx.stroke();
    ctx.restore(); ctx.restore();
  }

  // Bouncy wall glow
  if (gs.bouncyHouse) {
    const t=Date.now()/600, alpha=.12+Math.sin(t)*.06;
    ctx.strokeStyle=`rgba(136,255,221,${alpha})`; ctx.lineWidth=6;
    ctx.strokeRect(3, 3, worldW-6, worldH-6);
  }

  // Player bullets
  for(const b of gs.bullets) drawBullet(b);

  // Enemy bullets
  for(const eb of gs.enemyBullets) {
    ctx.save(); ctx.globalAlpha=eb.life/eb.maxLife;
    ctx.fillStyle=eb.color; ctx.shadowColor=eb.color; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.arc(eb.x,eb.y,5,0,Math.PI*2); ctx.fill(); ctx.restore();
  }

  // Enemies
  const frozen = gs.partyFreezeTimer > 0;
  for(const id of ECS.query('enemy','pos','hp')) {
    const epos = ECS.get(id,'pos');
    const ehp  = ECS.get(id,'hp');
    const ai   = ECS.get(id,'ai');
    const type = ECS.get(id,'enemy').type;
    const isPhased = ai && ai.phased;
    const alpha = isPhased ? 0.22 : (ehp.hitFlash > 0 ? (Math.random()>.5?1:.3) : 1);
    ctx.save(); ctx.globalAlpha=alpha;
    if      (type==='scissors')   drawScissors(epos, ehp, frozen);
    else if (type==='clown')      drawClown(epos, ehp, frozen);
    else if (type==='giftBox')    drawGiftBox(epos, ehp, ai, frozen);
    else if (type==='partyHat')   drawPartyHat(epos, ehp, frozen);
    else if (type==='boss')       drawBoss(epos, ehp, frozen);
    else if (type==='cannonball') drawCannonball(epos, ehp, ai, frozen);
    else if (type==='ringmaster') drawRingmaster(epos, ehp, ai, frozen);
    else if (type==='tightrope')  drawTightrope(epos, ehp, frozen);
    ctx.restore();
  }

  // Muzzle flash — positioned at gun tip
  if (muzzleFlash > 0) {
    // Gun tip is ~(GUN_W - GRIP_OFFSET_X) ahead along gunAngle from gun center
   const tipDist = 10 + (124 * 0.68);
const mx = ECS.get(gs.playerId,'pos').x + Math.cos(gunAngle) * tipDist;
const my = ECS.get(gs.playerId,'pos').y + Math.sin(gunAngle) * tipDist;
    ctx.save(); ctx.globalAlpha=muzzleFlash/10;
    ctx.fillStyle='#ffcc44'; ctx.shadowColor='#ffaa00'; ctx.shadowBlur=40;
    ctx.beginPath(); ctx.arc(mx, my, 22, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  drawPlayer();

  // Knocking Pins overlay
  if (gs.knockingPinsActive) {
    const ppos2 = ECS.get(gs.playerId,'pos');
    const t2 = Date.now()/200;
    ctx.save(); ctx.globalAlpha=0.55;
    ctx.fillStyle='#3333cc'; ctx.shadowColor='#6666ff'; ctx.shadowBlur=20;
    ctx.beginPath(); ctx.arc(ppos2.x, ppos2.y, 22, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle='#1111aa';
    for(let i=0;i<3;i++){const a=t2+i*2.09; ctx.beginPath(); ctx.arc(ppos2.x+Math.cos(a)*9, ppos2.y+Math.sin(a)*9, 4, 0, Math.PI*2); ctx.fill();}
    ctx.restore();
    const ratio2 = gs.knockingPinsTimer/300;
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(ppos2.x-26, ppos2.y+30, 52, 5);
    ctx.fillStyle='#6666ff'; ctx.fillRect(ppos2.x-26, ppos2.y+30, 52*ratio2, 5);
  }

  // Particles
  for(const p of gs.particles) {
    ctx.save(); ctx.globalAlpha=p.life/p.maxLife;
    ctx.fillStyle=p.color; ctx.shadowColor=p.color; ctx.shadowBlur=5;
    ctx.fillRect(p.x-p.size/2, p.y-p.size/2, p.size, p.size); ctx.restore();
  }

  // Reload bar
  if (gs.reloading) {
    const prog=1-(gs.reloadTimer/CFG.RELOAD_FRAMES);
    const ppos=ECS.get(gs.playerId,'pos');
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(ppos.x-26,ppos.y+26,52,8);
    ctx.fillStyle='#ffdd00'; ctx.shadowColor='#ffdd00'; ctx.shadowBlur=6;
    ctx.fillRect(ppos.x-26,ppos.y+26,52*prog,8); ctx.shadowBlur=0;
  }

  // SFP meter
  if (gs.hasShakeFizzlePop) {
    const ppos2 = ECS.get(gs.playerId, 'pos');
    const ratio = gs.sfpMeter / gs.sfpMax;
    const bw = 52;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(ppos2.x - bw/2, ppos2.y + 38, bw, 6);
    const col = gs.sfpFull ? '#ff8800' : `rgb(${Math.round(200*ratio+55)},${Math.round(80*(1-ratio))},0)`;
    ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = gs.sfpFull ? 10 : 4;
    ctx.fillRect(ppos2.x - bw/2, ppos2.y + 38, bw * ratio, 6);
    ctx.shadowBlur = 0;
  }

  // Speed ring
  if (gs.speedBoostTimer > 0) {
    const ppos=ECS.get(gs.playerId,'pos');
    ctx.save(); ctx.globalAlpha=.35+.2*Math.sin(Date.now()/80);
    ctx.strokeStyle='#ffdd00'; ctx.lineWidth=2; ctx.shadowColor='#ffdd00'; ctx.shadowBlur=10;
    ctx.beginPath(); ctx.arc(ppos.x,ppos.y,30,0,Math.PI*2); ctx.stroke(); ctx.restore();
  }

  // Confetti slow ring
  if (gs.confettiSlowTimer > 0) {
    const ppos=ECS.get(gs.playerId,'pos');
    ctx.save(); ctx.globalAlpha=.4+.2*Math.sin(Date.now()/60);
    ctx.strokeStyle='#ff69b4'; ctx.lineWidth=2; ctx.shadowColor='#ff69b4'; ctx.shadowBlur=10;
    ctx.beginPath(); ctx.arc(ppos.x,ppos.y,30,0,Math.PI*2); ctx.stroke(); ctx.restore();
  }

  // Dash pips
  if (gs.hasDash) {
    const ppos=ECS.get(gs.playerId,'pos');
    const pipW=12,pipH=4,pipGap=4,total=gs.dashMaxCharges;
    const totalW=total*pipW+(total-1)*pipGap;
    const startX=ppos.x-totalW/2, py=ppos.y+36;
    for(let i=0;i<total;i++){
      const filled=i<gs.dashCharges;
      ctx.fillStyle=filled?'#ffaa00':'#442200'; ctx.shadowColor=filled?'#ffcc00':'transparent'; ctx.shadowBlur=filled?6:0;
      ctx.fillRect(startX+i*(pipW+pipGap),py,pipW,pipH);
    }
    ctx.shadowBlur=0;
    if(gs.dashCharges<gs.dashMaxCharges){
      const prog=gs.dashCooldownTimer/gs.dashCooldownMax, i=gs.dashCharges;
      ctx.fillStyle='#885500'; ctx.fillRect(startX+i*(pipW+pipGap),py,pipW*prog,pipH);
    }
  }

  // Glowstick aura + swing
  const ppos = ECS.get(gs.playerId, 'pos');
  if (gs.hasGlowsticks) {
    ctx.save();
    ctx.globalAlpha = 0.25 + Math.sin(Date.now()/120) * 0.1;
    ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 22;
    ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(ppos.x, ppos.y, 42, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }
  if (meleeSwingTimer > 0) {
    const progress = meleeSwingTimer / CFG.MELEE_SWING_FRAMES;
    ctx.save();
    ctx.translate(ppos.x, ppos.y);
    ctx.rotate(gunAngle + (progress * 2.8 - 1.4)); // swing arc follows gun angle
    ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 30;
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(32, -9, 38, 18);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(32, -4, 38, 8);
    ctx.restore();
    meleeSwingTimer--;
  }

  ctx.restore();

  // Boss slam overlays
  for (const id of ECS.query('enemy')) {
    const type = ECS.get(id, 'enemy').type;
    if (type !== 'boss') continue;
    const ai = ECS.get(id, 'ai');
    if (!ai) continue;
    if (ai.bossPhase === BOSS_PHASE.SLAM_TELEGRAPH && ai.slamTarget) {
      const prog = 1 - (ai.slamWarning / 90);
      ctx.save();
      ctx.globalAlpha = 0.25 + prog * 0.45;
      ctx.strokeStyle = '#cc00ff'; ctx.lineWidth = 3 + prog * 4; ctx.shadowColor = '#cc00ff'; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(ai.slamTarget.x, ai.slamTarget.y, ai.slamRadius, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = prog * 0.18; ctx.fillStyle = '#cc00ff'; ctx.fill();
      ctx.restore();
    }
    if (ai.bossPhase === BOSS_PHASE.SLAM_RECOVER) {
      const epos = ECS.get(id, 'pos');
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(Date.now() / 60) * 0.2;
      ctx.fillStyle = '#00ff88'; ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.arc(epos.x, epos.y, 40, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    if (ai.bossPhase === BOSS_PHASE.SLAM_STRIKE && ai.slamTarget) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.shadowColor = '#cc00ff'; ctx.shadowBlur = 40;
      ctx.beginPath(); ctx.arc(ai.slamTarget.x, ai.slamTarget.y, 70, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  }

  // Vignette
  const g=ctx.createRadialGradient(CFG.W/2,CFG.H/2,CFG.H*.28,CFG.W/2,CFG.H/2,CFG.H*.9);
  g.addColorStop(0,'transparent');
  g.addColorStop(1, gs.floor===2 ? 'rgba(40,5,0,0.65)' : 'rgba(0,0,0,0.55)');
  ctx.fillStyle=g; ctx.fillRect(0,0,CFG.W,CFG.H);

  // Freeze label
  if (gs.partyFreezeTimer > 0) {
    ctx.save(); ctx.font='7px "Press Start 2P"'; ctx.textAlign='center';
    ctx.fillStyle='#ff69b4'; ctx.shadowColor='#ff69b4'; ctx.shadowBlur=12;
    ctx.fillText('PARTY TIME! ENEMIES FROZEN!', CFG.W/2, CFG.H-16); ctx.restore();
  }

  // Prize wheel banner
  if (gs.prizeEffect && gs.prizeEffect.timer > 0) {
    const ratio = gs.prizeEffect.timer / 600;
    const alpha = Math.min(1, ratio * 4);
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.font = '7px "Press Start 2P"'; ctx.textAlign = 'center';
    ctx.fillStyle = '#ffdd00'; ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 14;
    ctx.fillText(gs.prizeEffect.name, worldW/2, 32);
    const bw = 120;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(worldW/2-bw/2, 38, bw, 5);
    ctx.fillStyle = '#ffdd00'; ctx.fillRect(worldW/2-bw/2, 38, bw*Math.min(1,ratio), 5);
    ctx.restore();
  }
}
