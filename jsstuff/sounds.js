// ============================================================
// CLIPBLAST: PARTY HUNTER — Sound Effects
// ============================================================

const SFX = {
  _cache: {},
  _muted: false,

  load(key, src) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    this._cache[key] = audio;
  },

  play(key, volumeOverride) {
    if (this._muted) return;
    const src = this._cache[key];
    if (!src) return;
    try {
      const clone = src.cloneNode();
      clone.volume = volumeOverride !== undefined ? volumeOverride : 0.6;
      clone.play().catch(() => {});
    } catch(e) {}
  },

  // Play one of several variants randomly
  playRandom(keys, volumeOverride) {
    const key = keys[Math.floor(Math.random() * keys.length)];
    this.play(key, volumeOverride);
  },
};

// Add this method to the SFX object, after the playRandom method:
playAt(key, sourceX, sourceY, volumeOverride) {
  if (this._muted) return;
  const src = this._cache[key];
  if (!src) return;
  if (typeof gs === 'undefined' || !gs.playerId) { this.play(key, volumeOverride); return; }
  const ppos = ECS.get(gs.playerId, 'pos');
  if (!ppos) { this.play(key, volumeOverride); return; }
  const FALLOFF_START = 180; // full volume within this radius
  const FALLOFF_END   = 520; // silent beyond this radius
  const dist = Math.hypot(sourceX - ppos.x, sourceY - ppos.y);
  if (dist > FALLOFF_END) return;
  const spatial = dist <= FALLOFF_START ? 1.0
    : 1.0 - ((dist - FALLOFF_START) / (FALLOFF_END - FALLOFF_START));
  const base = volumeOverride !== undefined ? volumeOverride : 0.6;
  try {
    const clone = src.cloneNode();
    clone.volume = Math.max(0, Math.min(1, base * spatial));
    clone.play().catch(() => {});
  } catch(e) {}
},

// ── Load all SFX ──

SFX.load('normalHit1',      'sounds/soundeffects/bullets/NormalHit1.mp3');
SFX.load('normalHit2',      'sounds/soundeffects/bullets/NormalHit2.mp3');
SFX.load('hit2x',           'sounds/soundeffects/bullets/2xHit.mp3');
SFX.load('hit3x',           'sounds/soundeffects/bullets/3xHit.mp3');
SFX.load('hit4x',           'sounds/soundeffects/bullets/4xHit.mp3');
SFX.load('dudHit',          'sounds/soundeffects/bullets/DudHit.mp3');
SFX.load('tearHit',         'sounds/soundeffects/bullets/TearHit.mp3');
SFX.load('bouncyHit',       'sounds/soundeffects/bullets/BouncyHit.mp3');
SFX.load('bowlingBallBounce','sounds/soundeffects/bullets/BowlingBallBounce.mp3');
SFX.load('bowlingBallHit',  'sounds/soundeffects/bullets/BowlingBallHit.mp3');


SFX.load('shoot1',          'sounds/soundeffects/player/Shoot1.mp3');
SFX.load('shoot2',          'sounds/soundeffects/player/Shoot2.mp3');
SFX.load('shoot3',          'sounds/soundeffects/player/Shoot3.mp3');
SFX.load('shoot4',          'sounds/soundeffects/player/Shoot4.mp3');
SFX.load('reloadStart1',    'sounds/soundeffects/player/ReloadStart1.mp3');
SFX.load('reloadStart2',    'sounds/soundeffects/player/ReloadStart2.mp3');
SFX.load('reloadStart3',    'sounds/soundeffects/player/ReloadStart3.mp3');
SFX.load('reloadFinish',    'sounds/soundeffects/player/ReloadFinish.mp3');
SFX.load('playerDamage',    'sounds/soundeffects/player/PlayerDamage.mp3');
SFX.load('playerDamage',    'sounds/soundeffects/player/ClippySpeak.mp3');

SFX.load('partyhatRide',    'sounds/soundeffects/enemies/PartyHat/PartyHatRide.mp3');

SFX.load('forkGrab',    'sounds/soundeffects/enemies/Utensil/ForkGrab.mp3');
SFX.load('spoonDamage',    'sounds/soundeffects/enemies/Utensil/SpoonDamage.mp3'); // spoon hits something

SFX.load('frostingLaunch',    'sounds/soundeffects/enemies/CakeBoss/FrostingLaunch.mp3');
SFX.load('frostingHit',    'sounds/soundeffects/enemies/CakeBoss/FrostingHit.mp3');


