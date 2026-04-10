// ============================================================
// CLIPBLAST: PARTY HUNTER — Draw Functions 
// ============================================================


function _drawUtensilShape(ctx, type, color, scale = 1) {
  ctx.strokeStyle = color;
  ctx.fillStyle   = color; 
  ctx.lineWidth   = 2.5 * scale;
  ctx.lineCap     = 'round';

  if (type === 'fork') {
    ctx.beginPath(); ctx.moveTo(0, 14 * scale); ctx.lineTo(0, -4 * scale); ctx.stroke();
    for (let i = -2; i <= 2; i += 2) {
      ctx.beginPath(); ctx.moveTo(0, -4 * scale); ctx.lineTo(i * scale, -14 * scale); ctx.stroke();
    }
  } else if (type === 'knife') {
    ctx.beginPath(); ctx.moveTo(0, 14 * scale); ctx.lineTo(0, 2 * scale); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 2 * scale);
    ctx.lineTo(4 * scale, -10 * scale);
    ctx.lineTo(0, -14 * scale);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'spoon') {
    ctx.beginPath(); ctx.moveTo(0, 14 * scale); ctx.lineTo(0, -2 * scale); ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, -8 * scale, 5 * scale, 7 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  } 
  
}

function drawUtensil(epos, ehp, ai, frozen) {
  const { x, y } = epos;
  const utensils    = ['fork', 'knife', 'spoon'];
  const colors      = { fork: '#ffcc88', knife: '#ccccee', spoon: '#ffddaa' };
  const orbitAngle  = ai.uOrbitAngle || 0;
  const activeIdx   = ai.uActiveIdx !== undefined ? ai.uActiveIdx : -1;
  const state       = ai.uState || 'IDLE';

  ctx.save();
  if (frozen) { ctx.globalAlpha = 0.7; ctx.shadowColor = '#aaccff'; ctx.shadowBlur = 16; }

  for (let i = 0; i < 3; i++) {
    if (state !== 'IDLE' && i === activeIdx) continue;
    const u     = utensils[i];
    const angle = orbitAngle + (i / 3) * Math.PI * 2;
    const ox    = x + Math.cos(angle) * 20;
    const oy    = y + Math.sin(angle) * 20;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(angle + Math.PI / 2);
    ctx.shadowColor = frozen ? '#aaccff' : colors[u];
    ctx.shadowBlur  = 8;
    _drawUtensilShape(ctx, u, frozen ? '#88aacc' : colors[u]);
    ctx.restore();
  }

  if (state !== 'IDLE' && activeIdx >= 0 && ai.uTipX !== undefined) {
    const u       = utensils[activeIdx];
    const tipAngle = ai.uLaunchDir
      ? Math.atan2(ai.uLaunchDir.y, ai.uLaunchDir.x)
      : 0;
    ctx.save();
    ctx.translate(ai.uTipX, ai.uTipY);
    ctx.rotate(tipAngle + Math.PI / 2);
    ctx.shadowColor = frozen ? '#aaccff' : colors[u];
    ctx.shadowBlur  = frozen ? 10 : 20;
    _drawUtensilShape(ctx, u, frozen ? '#aaddff' : colors[u], 1.4);
    ctx.restore();
  }

  ctx.restore();

  const bw = 36;
  ctx.fillStyle = '#330000'; ctx.fillRect(x - bw/2, y - 36, bw, 5);
  ctx.fillStyle = ehp.hp < ehp.maxHp/2 ? '#ff6666' : '#cccccc';
  ctx.fillRect(x - bw/2, y - 36, bw * (ehp.hp / ehp.maxHp), 5);
}



function drawMaskFrame(frameIndex, x, y, alpha = 1) {
  if (!maskSheetImg.complete || maskSheetImg.naturalWidth === 0) return;
  const col = frameIndex % MASK_COLS;
  const row = Math.floor(frameIndex / MASK_COLS);
  const DRAW_SIZE = 56;  // slightly larger since sheet has more detail
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(
    maskSheetImg,
    col * MASK_FRAME_W, row * MASK_FRAME_H, MASK_FRAME_W, MASK_FRAME_H,
    x - DRAW_SIZE / 2, y - DRAW_SIZE / 2, DRAW_SIZE, DRAW_SIZE
  );
  ctx.restore();
}

function drawMask(epos, ehp, ai, frozen) {
  const { x, y } = epos;

  // Init animation state
  if (ai.maskAnimFrame  === undefined) ai.maskAnimFrame  = 0;
  if (ai.maskAnimTimer  === undefined) ai.maskAnimTimer  = 0;
  if (ai.maskAnimState  === undefined) ai.maskAnimState  = 'SMILE';
  const ANIM_SPEED = 12; // frames per sprite frame

  const prevState = ai.maskAnimState;

  // Sync animation state to behavior state
  if (ai.maskState === 'SMILE' && ai.maskAnimState === 'CRY') {
    ai.maskAnimState = 'TO_SMILE';
    ai.maskAnimFrame = 0;
    ai.maskAnimTimer = 0;
  } else if (ai.maskState === 'CRY' && ai.maskAnimState === 'SMILE') {
    ai.maskAnimState = 'TO_CRY';
    ai.maskAnimFrame = 0;
    ai.maskAnimTimer = 0;
  }

  // Advance animation timer
  ai.maskAnimTimer++;
  if (ai.maskAnimTimer >= ANIM_SPEED) {
    ai.maskAnimTimer = 0;
    ai.maskAnimFrame++;

    // Handle state transitions
    if (ai.maskAnimState === 'SMILE') {
      if (ai.maskAnimFrame >= MASK_SMILE_FRAMES.length)
        ai.maskAnimFrame = 0; // loop
    } else if (ai.maskAnimState === 'TO_CRY') {
      if (ai.maskAnimFrame >= MASK_TO_CRY_FRAMES.length) {
        ai.maskAnimState = 'CRY';
        ai.maskAnimFrame = 0;
      }
    } else if (ai.maskAnimState === 'CRY') {
      if (ai.maskAnimFrame >= MASK_CRY_FRAMES.length)
        ai.maskAnimFrame = 0; // loop
    } else if (ai.maskAnimState === 'TO_SMILE') {
      if (ai.maskAnimFrame >= MASK_TO_SMILE_FRAMES.length) {
        ai.maskAnimState = 'SMILE';
        ai.maskAnimFrame = 0;
      }
    }
  }

  // Pick sprite frame index
// Pick current and next frame index for cross-fade
  let frameIndex, nextFrameIndex;
  const blendT = ai.maskAnimTimer / ANIM_SPEED; // 0→1 over each frame

  function getFrameList(state) {
    if (state === 'SMILE')    return MASK_SMILE_FRAMES;
    if (state === 'TO_CRY')   return MASK_TO_CRY_FRAMES;
    if (state === 'CRY')      return MASK_CRY_FRAMES;
    if (state === 'TO_SMILE') return MASK_TO_SMILE_FRAMES;
    return MASK_SMILE_FRAMES;
  }

  const currentList = getFrameList(ai.maskAnimState);
  frameIndex = currentList[ai.maskAnimFrame] ?? currentList[0];

  // Next frame — wrap or peek into next state
  const nextFramePos = ai.maskAnimFrame + 1;
  if (nextFramePos < currentList.length) {
    nextFrameIndex = currentList[nextFramePos];
  } else {
    // Peek at first frame of next state
    if      (ai.maskAnimState === 'SMILE')    nextFrameIndex = MASK_TO_CRY_FRAMES[0];
    else if (ai.maskAnimState === 'TO_CRY')   nextFrameIndex = MASK_CRY_FRAMES[0];
    else if (ai.maskAnimState === 'CRY')      nextFrameIndex = MASK_TO_SMILE_FRAMES[0];
    else if (ai.maskAnimState === 'TO_SMILE') nextFrameIndex = MASK_SMILE_FRAMES[0];
    else nextFrameIndex = frameIndex;
  }



 

 const baseAlpha = frozen ? 0.7 : 1;
  const orient = ai.maskOrient || 0;
  const orientAngle = orient * (Math.PI / 2);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(orientAngle);
  drawMaskFrame(frameIndex, 0, 0, baseAlpha);
  ctx.restore();

 
  if (frozen) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#aaccff';
    ctx.beginPath();
    ctx.ellipse(x, y, 24, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Confused tint
  if (ai.confused) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.ellipse(x, y, 24, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Health bar
  const bw = 50;
  ctx.fillStyle = '#330000';
  ctx.fillRect(x - bw/2, y - 36, bw, 5);
  ctx.fillStyle = ai.confused ? '#00ffff' : (ehp.hp < ehp.maxHp/2 ? '#ff6666' : '#4488ff');
  ctx.fillRect(x - bw/2, y - 36, bw * (ehp.hp / ehp.maxHp), 5);
}

function drawGiftBox(epos, ehp, ai, frozen) {
  const { x, y } = epos;
  const windup = ai.windupTimer || 0;
  const windupRatio = Math.min(1, windup / 120);
  const heldByPlayer = ai.heldByPlayer || false;

  const shakeAmt = windupRatio * 5;
  const sx = x + (Math.random() - 0.5) * shakeAmt;
  const sy = y + (Math.random() - 0.5) * shakeAmt;

  ctx.save();
  ctx.translate(sx, sy);
  if (frozen) ctx.globalAlpha = 0.65;

  const r = Math.round(255);
  const g = Math.round(102 - windupRatio * 102);
  const b = Math.round(153 - windupRatio * 153);
  const boxColor = frozen ? '#77aaff' : `rgb(${r},${g},${b})`;

  ctx.shadowColor = frozen ? '#88ccff' : (windupRatio > 0.6 ? '#ff2200' : '#ffaa00');
  ctx.shadowBlur = 16 + windupRatio * 20;

  ctx.fillStyle = boxColor;
  ctx.fillRect(-17, -17, 34, 34);

  ctx.fillStyle = '#ffee00';
  ctx.fillRect(-18, -6, 36, 8);
  ctx.fillRect(-6, -18, 8, 36);

  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(-8, -28);
  ctx.lineTo(8, -28);
  ctx.closePath();
  ctx.fill();

  if (windupRatio > 0 && !frozen) {
    const ticks = Math.floor(windupRatio * 8);
    ctx.strokeStyle = '#ff2200';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 8;
    for (let i = 0; i < ticks; i++) {
      const ta = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const r1 = 22, r2 = 28;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ta) * r1, Math.sin(ta) * r1);
      ctx.lineTo(Math.cos(ta) * r2, Math.sin(ta) * r2);
      ctx.stroke();
    }
    if (windupRatio > 0.75) {
      ctx.font = `bold ${8 + windupRatio * 4}px "Press Start 2P"`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 14;
      ctx.fillText('!', 0, 6);
    }
  }

  if (heldByPlayer) {
    ctx.strokeStyle = '#ffdd00';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();

  const bw = 40;
  ctx.fillStyle = '#330000'; ctx.fillRect(x - bw/2, y - 40, bw, 5);
  ctx.fillStyle = ehp.hp < ehp.maxHp/2 ? '#ff6666' : '#cc0000';
  ctx.fillRect(x - bw/2, y - 40, bw * (ehp.hp / ehp.maxHp), 5);

  if (windupRatio > 0 && !frozen) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - bw/2, y - 32, bw, 4);
    ctx.fillStyle = `rgb(${Math.round(255)},${Math.round(100 * (1 - windupRatio))},0)`;
    ctx.fillRect(x - bw/2, y - 32, bw * windupRatio, 4);
  }
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

function drawCakeBoss(epos, ehp, ai, frozen) {
  const { x, y } = epos;
  const t = Date.now() / 300;
  const totalCandles = 5;
  const candlesLit = ai.candlesLit ?? 5;
  const spin = ai.idleSpin || 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  if (frozen) ctx.globalAlpha = 0.7;

  // Bottom tier
  ctx.shadowColor = frozen ? '#aaccff' : '#ff69b4';
  ctx.shadowBlur = 20;
  ctx.fillStyle = frozen ? '#4488cc' : '#ff69b4';
  ctx.fillRect(-36, 10, 72, 22);
  ctx.fillStyle = frozen ? '#88aadd' : '#ff99cc';
  ctx.fillRect(-36, 6, 72, 6);

  // Middle tier
  ctx.fillStyle = frozen ? '#5599dd' : '#ff4499';
  ctx.fillRect(-26, -10, 52, 18);
  ctx.fillStyle = frozen ? '#88aadd' : '#ff88bb';
  ctx.fillRect(-26, -14, 52, 6);

  // Top tier
  ctx.fillStyle = frozen ? '#6699cc' : '#cc2277';
  ctx.fillRect(-16, -26, 32, 14);
  ctx.fillStyle = frozen ? '#88aadd' : '#ff66aa';
  ctx.fillRect(-16, -30, 32, 6);

  // Frosting drips
  ctx.fillStyle = frozen ? '#aaccff' : '#ffffff';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(-28 + i * 14, 6, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(-20 + i * 13, -14, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Candles
  for (let i = 0; i < totalCandles; i++) {
    const angle = (i / totalCandles) * Math.PI * 2;
    const cr = 11;
    const cx2 = Math.cos(angle) * cr;
    const cy2 = Math.sin(angle) * cr - 30;
    const isLit = i < candlesLit;

    ctx.save();
    ctx.translate(cx2, cy2);

    // Candle body
    ctx.fillStyle = isLit ? '#f5deb3' : '#666666';
    ctx.shadowColor = isLit ? '#ff8800' : 'transparent';
    ctx.shadowBlur = isLit ? 8 : 0;
    ctx.fillRect(-3, -10, 6, 14);

    // Wick
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, -13);
    ctx.stroke();

    // Flame
    if (isLit && !frozen) {
      const flicker = Math.sin(t * 8 + i * 1.3) * 1.5;
      ctx.fillStyle = '#ffff88';
      ctx.shadowColor = '#ff8800';
      ctx.shadowBlur = 14 + flicker;
      ctx.beginPath();
      ctx.ellipse(0, -16 + flicker * 0.3, 3, 5 + flicker, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(0, -16 + flicker * 0.3, 1.2, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Snuffed smoke wisp
    if (!isLit) {
      ctx.globalAlpha = 0.4 + Math.sin(t * 2 + i) * 0.2;
      ctx.strokeStyle = '#aaaaaa';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.quadraticCurveTo(3, -18, 0, -24);
      ctx.stroke();
      ctx.globalAlpha = frozen ? 0.7 : 1;
    }

    ctx.restore();
  }

  ctx.restore();

  // Spin bounce glow
  if (ai.bossPhase === 'SPIN_BOUNCE') {
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 40) * 0.3;
    ctx.strokeStyle = '#ff2200';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(x, y, 44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Telegraph glow for frosting
  if (ai.bossPhase === 'FROSTING_CHARGE') {
    const progress = 1 - (ai.phaseTimer / 60);
    ctx.save();
    ctx.globalAlpha = progress * 0.7;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(x, y, 20 + progress * 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // HP bar
  const bw = 80;
  ctx.fillStyle = '#330000';
  ctx.fillRect(x - bw / 2, y - 62, bw, 8);
  ctx.fillStyle = ehp.hp < ehp.maxHp * 0.3 ? '#ff2200' : '#ff69b4';
  ctx.fillRect(x - bw / 2, y - 62, bw * (ehp.hp / ehp.maxHp), 8);

  // Candle pip indicators under HP bar
  for (let i = 0; i < totalCandles; i++) {
    const isLit = i < candlesLit;
    ctx.fillStyle = isLit ? '#ffdd00' : '#333333';
    ctx.shadowColor = isLit ? '#ffaa00' : 'transparent';
    ctx.shadowBlur = isLit ? 6 : 0;
    ctx.beginPath();
    ctx.arc(x - 16 + i * 8, y - 68, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
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

function drawJuggler(epos, ehp, ai, frozen) {
  const {x, y} = epos;
  const t = Date.now() / 300;
  const sphereAngle = ai.sphereAngle || 0;

  ctx.save(); ctx.translate(x, y);
  if (frozen) { ctx.globalAlpha=0.7; ctx.shadowColor='#aaccff'; }
  else { ctx.shadowColor='#ffdd00'; ctx.shadowBlur=18; }

  const SPHERE_R = 14;
  ctx.save(); ctx.translate(0, 18);
  ctx.fillStyle = frozen ? '#4488cc' : '#cc8800';
  ctx.beginPath(); ctx.arc(0, 0, SPHERE_R, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = frozen ? '#88aadd' : '#ffcc44';
  ctx.lineWidth = 2.5; ctx.save();
  ctx.rotate(sphereAngle);
  ctx.beginPath(); ctx.moveTo(-SPHERE_R, 0); ctx.lineTo(SPHERE_R, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -SPHERE_R); ctx.lineTo(0, SPHERE_R); ctx.stroke();
  ctx.restore(); ctx.restore();

  const wobble = Math.sin(t * 1.4) * 0.12;
  ctx.save(); ctx.rotate(wobble);
  ctx.fillStyle = frozen ? '#88aacc' : '#ffcc99';
  ctx.beginPath(); ctx.arc(0, -2, 10, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = frozen ? '#4488cc' : '#ff6600';
  ctx.fillRect(-8, 6, 16, 14);
  ctx.strokeStyle = frozen ? '#88aacc' : '#ffcc99';
  ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-8, 10); ctx.lineTo(-18, -4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, 10);  ctx.lineTo(18, -4);  ctx.stroke();
  ctx.restore();

  const slotCount = ai.juggleSlots ? ai.juggleSlots.length : 0;
  for (let i = 0; i < slotCount; i++) {
    const slot = ai.juggleSlots[i];
    if (slot.type !== 'ball') continue;
    const slotAngle = (i / Math.max(ai.juggleMax, 1)) * Math.PI * 2;
    const arcX = Math.cos(slotAngle + t * 1.2) * 28;
    const arcY = -38 + Math.sin(slotAngle * 2 + t * 1.2) * 16;
    const ballColors = ['#ff4444','#ffdd00','#00ff88','#ff69b4','#4488ff','#ff8800'];
    ctx.save(); ctx.translate(arcX, arcY);
    ctx.fillStyle = ballColors[i % ballColors.length];
    ctx.shadowColor = ballColors[i % ballColors.length];
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  ctx.restore();

  const bw = 48;
  ctx.fillStyle='#330000'; ctx.fillRect(x-bw/2, y-46, bw, 6);
  ctx.fillStyle=ehp.hp<ehp.maxHp/2?'#ff6666':'#ffaa00';
  ctx.fillRect(x-bw/2, y-46, bw*(ehp.hp/ehp.maxHp), 6);
}

// ============================================================
// PLAYER DRAW
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

  const GUN_W = 90;
  const GUN_H = 20;
  const GRIP_X = GUN_W * 0.32;
  const GRIP_Y = GUN_H * 0.6;
  const recoilDist = gunRecoil * 6;

  const gx = gunX - Math.cos(gunAngle) * recoilDist;
  const gy = gunY - Math.sin(gunAngle) * recoilDist;

  const aimingLeft = Math.cos(gunAngle) < 0;

  const sourceImg = playerCanvas || playerImg;
  if (sourceImg && (sourceImg.complete !== false)) {
    const BODY_W = 36;
    const BODY_H = 56;
    const bob = Math.sin(playerBobTimer) * 1.0;
    ctx.save();
    ctx.translate(x, y + bob);
    if (blinking) ctx.globalAlpha = 0.35;
    const movingLeft = Math.cos(playerMoveAngle) < 0;
    if (movingLeft) ctx.scale(-1, 1);
    ctx.drawImage(sourceImg,
      290, 160, 440, 740,
      -BODY_W / 2, -BODY_H * 0.75,
      BODY_W, BODY_H
    );
    ctx.restore();
  }

  if (shotgunImg.complete && shotgunImg.naturalWidth > 0) {
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(gunAngle);
    if (aimingLeft) ctx.scale(1, -1);
    if (blinking) ctx.globalAlpha = 0.35;
    ctx.drawImage(shotgunImg,
      56, 523, 897, 195,
      -GRIP_X, -GRIP_Y,
      GUN_W, GUN_H
    );
    ctx.restore();
  }

  if (gunRecoil > 0) gunRecoil = Math.max(0, gunRecoil - 0.08);

 // ── Clownish nose — grows as timer fills, honks (squishes) on blast ──
  if (gs.hasClownish) {
    const honking = gs.clownNoseHonkTimer > 0;
    const honkProgress = honking ? gs.clownNoseHonkTimer / 14 : 0;
    // Nose is only visible while growing OR briefly during honk
    const visible = gs.clownNoseSize > 0 || honking;
    if (visible) {
      const baseR = 2.5 + gs.clownNoseSize * 5; // max ~7.5px — smaller than before
      ctx.save();
      ctx.translate(ppos.x, ppos.y - 10);
      if (honking) {
        // Squish: wide and flat immediately after blast, then spring back
        const squishX = 1 + honkProgress * 0.9;  // stretches wide
        const squishY = 1 - honkProgress * 0.55; // flattens vertically
        ctx.scale(squishX, squishY);
      }
      ctx.shadowColor = '#4488ff';
      ctx.shadowBlur = honking ? 20 : 6 + gs.clownNoseSize * 10;
      ctx.fillStyle = honking ? '#ffffff' : (gs.clownNoseSize > 0.85 ? '#aaccff' : '#4488ff');
      ctx.globalAlpha = honking ? 1.0 : 0.65 + gs.clownNoseSize * 0.35;
      const drawR = honking ? Math.max(baseR, 4) : baseR;
      ctx.beginPath(); ctx.arc(0, 0, drawR, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
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
    if (b.isMirror)             { color='#8899ff'; glow='#aabbff'; }
    else if (b.damageMult >= 4) { color='#ff3333'; glow='#ff8888'; }
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

  // Mirror shards
if (gs.hasMirrorMaze && gs.mirrorShards) {
  const t = Date.now() / 400;
  for (const s of gs.mirrorShards) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(t + (s.angle || 0));
    ctx.shadowColor = '#8899ff';
    ctx.shadowBlur = 18 + Math.sin(t * 3) * 6;
    ctx.strokeStyle = '#ccddff';
    ctx.lineWidth = 2;
    // Diamond shard shape
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#8899ff';
    ctx.fill();
    ctx.globalAlpha = 1;
    // Orbiting shard: pulsing ring to distinguish it
    if (s.orbiting) {
      ctx.globalAlpha = 0.4 + Math.sin(t * 4) * 0.2;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  // Regen timer arc under player
  if (gs.mirrorPlayerShardTimer > 0) {
    const ppos2 = ECS.get(gs.playerId, 'pos');
    const progress = 1 - (gs.mirrorPlayerShardTimer / 900);
    ctx.save();
    ctx.strokeStyle = '#8899ff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.shadowColor = '#8899ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(ppos2.x, ppos2.y, 82, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

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
for (const b of gs.bullets) {
 if (b.isArcBall) {
  // Shadow
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(b.shadowX, b.shadowY || b.y, 18 * (b.sizeScale||1), 8 * (b.sizeScale||1), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Ball
  const arcColor = b.isMirrorArc ? '#ff2244' : '#00ff88';
  const arcGlow  = b.isMirrorArc ? '#ff0022' : '#00ffaa';
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.fillStyle = arcColor;
  ctx.shadowColor = arcGlow;
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.arc(0, 0, 10 * (b.sizeScale||1), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
} else {
    drawBullet(b);
  }
}
  // Enemy bullets
  for(const eb of gs.enemyBullets) {
    ctx.save(); ctx.globalAlpha=eb.life/eb.maxLife;
    // ── Arc ball: draw ground shadow first, then ball ──
    if (eb.isArcBall) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#000000';
     const shadowScale = eb.sizeScale || 1.0;
      ctx.beginPath();
      ctx.ellipse(eb.shadowX, eb.shadowY, 18 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // Draw the ball itself
     const spin = Date.now() / 80;
      const bScale = eb.sizeScale || 1.0;
      const bR = 9 * bScale;
      const bColor = eb.isCannonball ? '#ff6600' : (eb.isArcEnemy ? '#ff8800' : '#ffdd00');
      const bGlow = eb.isCannonball ? '#ff4400' : (eb.isArcEnemy ? '#ff6600' : '#ffaa00');
      ctx.save();
      ctx.translate(eb.x, eb.y);
      ctx.rotate(spin);
      ctx.fillStyle = bColor; ctx.shadowColor = bGlow; ctx.shadowBlur = 14 * bScale;
      ctx.beginPath(); ctx.arc(0, 0, bR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = bGlow; ctx.lineWidth = 2 * bScale;
      ctx.beginPath(); ctx.moveTo(-bR, 0); ctx.lineTo(bR, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -bR); ctx.lineTo(0, bR); ctx.stroke();
      ctx.restore();
      ctx.restore();
      continue; // skip default bullet drawing
    }
    if (eb.isTear) {
      const tearAngle = Math.atan2(eb.vy, eb.vx);
      ctx.translate(eb.x, eb.y); ctx.rotate(tearAngle + Math.PI/2);
      ctx.fillStyle='#44aaff'; ctx.shadowColor='#44aaff'; ctx.shadowBlur=10;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.bezierCurveTo(4, -2, 4, 4, 0, 6);
      ctx.bezierCurveTo(-4, 4, -4, -2, 0, -6);
      ctx.fill();
    } else if (eb.isConfused) {
      // Cyan diamond shape to distinguish confused shots
      ctx.fillStyle='#00ffff'; ctx.shadowColor='#00ffff'; ctx.shadowBlur=10;
      ctx.save(); ctx.translate(eb.x, eb.y); ctx.rotate(Math.PI/4);
      ctx.fillRect(-4,-4,8,8);
      ctx.restore();
    } else {
      ctx.fillStyle=eb.color; ctx.shadowColor=eb.color; ctx.shadowBlur=8;
      ctx.beginPath(); ctx.arc(eb.x,eb.y,5,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  // Enemies
  const frozen = gs.partyFreezeTimer > 0;
 // Replace the enemies draw section (the for...of ECS.query loop):
for(const id of ECS.query('enemy','pos','hp')) {
  const epos = ECS.get(id,'pos');
  const ehp  = ECS.get(id,'hp');
  const ai   = ECS.get(id,'ai');
  const type = ECS.get(id,'enemy').type;
  const isPhased = ai && ai.phased;
  const alpha = isPhased ? 0.22 : (ehp.hitFlash > 0 ? (Math.random()>.5?1:.3) : 1);
  
  const sizeScale = (ai && ai.rmSizeScale) ? ai.rmSizeScale : 1.0;
  const isCritMass = ai && ai.criticalMass;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Scale up + red tint for buffed/critical mass enemies
  if (sizeScale !== 1.0) {
    const cx = epos.x, cy = epos.y;
    ctx.translate(cx, cy);
    ctx.scale(sizeScale, sizeScale);
    ctx.translate(-cx, -cy);
  }

  if (type==='utensil')     drawUtensil(epos, ehp, ai, frozen);
  else if (type==='mask')        drawMask(epos, ehp, ai, frozen);
  else if (type==='giftBox')     drawGiftBox(epos, ehp, ai, frozen);
  else if (type==='partyHat')    drawPartyHat(epos, ehp, frozen);
  else if (type==='cannonball')  drawCannonball(epos, ehp, ai, frozen);
  else if (type==='ringmaster')  drawRingmaster(epos, ehp, ai, frozen);
  else if (type==='juggler')     drawJuggler(epos, ehp, ai, frozen);
  else if (type === 'cakeBoss') drawCakeBoss(epos, ehp, ai, frozen);

  // Red critical mass overlay
  // Critical mass: pulsing red OUTLINE only, not a filled overlay
if (isCritMass) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 80) * 0.3;
  ctx.strokeStyle = '#ff2200';
  ctx.shadowColor = '#ff4400';
  ctx.shadowBlur = 14;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(epos.x, epos.y, (ENEMY_DEFS[type]?.size || 28) * sizeScale + 4, 0, Math.PI * 2);
  ctx.stroke();
}

  ctx.restore();
}

  // Muzzle flash
  if (muzzleFlash > 0) {
    const tipDist = 90 * 0.68;
    const mx = gunX + Math.cos(gunAngle) * tipDist;
    const my = gunY + Math.sin(gunAngle) * tipDist;
    ctx.save(); ctx.globalAlpha=muzzleFlash/10;
    ctx.fillStyle='#ffcc44'; ctx.shadowColor='#ffaa00'; ctx.shadowBlur=40;
    ctx.beginPath(); ctx.arc(mx, my, 22, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  drawPlayer();

  // ── Clownish sound waves (two expanding rings after nose blast) ──
  if (gs.clownSoundWaves && gs.clownSoundWaves.length > 0) {
    const ppos2 = ECS.get(gs.playerId, 'pos');
    for (const w of gs.clownSoundWaves) {
      const progress = w.r / w.maxR;
      ctx.save();
      ctx.globalAlpha = (1 - progress) * 0.7;
      ctx.strokeStyle = '#4488ff';
      ctx.lineWidth = 18 - progress * 10;
      ctx.shadowColor = '#4488ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

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
    ctx.rotate(gunAngle + (progress * 2.8 - 1.4));
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

  // Glow explosion ring
  if (gs.glowExplosionTimer && gs.glowExplosionTimer > 0) {
    const progress = 1 - (gs.glowExplosionTimer / 10);
    const ringR = 20 + progress * 80;
    ctx.save();
    ctx.globalAlpha = (1 - progress) * 0.85;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 6 - progress * 4;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(gs.glowExplosionX, gs.glowExplosionY, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = (1 - progress) * 0.4;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(gs.glowExplosionX, gs.glowExplosionY, ringR * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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
