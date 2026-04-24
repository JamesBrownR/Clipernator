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

// ── Load all SFX ──
SFX.load('shoot1',          'sounds/soundeffects/bullets/Shoot1.mp3');
SFX.load('shoot2',          'sounds/soundeffects/bullets/Shoot2.mp3');
SFX.load('shoot3',          'sounds/soundeffects/bullets/Shoot3.mp3');
SFX.load('shoot4',          'sounds/soundeffects/bullets/Shoot4.mp3');
SFX.load('normalHit1',      'sounds/soundeffects/bullets/NormalHit1.mp3');
SFX.load('normalHit2',      'sounds/soundeffects/bullets/NormalHit2.mp3');
SFX.load('hit2x',           'sounds/soundeffects/bullets/2xHit.mp3');
SFX.load('hit3x',           'sounds/soundeffects/bullets/3xHit.mp3');
SFX.load('hit4x',           'sounds/soundeffects/bullets/4xHit.mp3');
SFX.load('dudHit',          'sounds/soundeffects/bullets/DudbHit.mp3');
SFX.load('tearHit',         'sounds/soundeffects/bullets/TearHit.mp3');
SFX.load('bouncyBullet',    'sounds/soundeffects/bullets/Bouncy_bulletBouncy.mp3');
SFX.load('bouncyHit',       'sounds/soundeffects/bullets/BouncyHit.mp3');
SFX.load('bowlingBallBounce','sounds/soundeffects/bullets/BowlingBallBounce.mp3');
SFX.load('bowlingBallHit',  'sounds/soundeffects/bullets/BowlingBallHit.mp3');
SFX.load('reloadStart1',    'sounds/soundeffects/player/ReloadStart1.mp3');
SFX.load('reloadStart2',    'sounds/soundeffects/player/ReloadStart2.mp3');
SFX.load('reloadStart3',    'sounds/soundeffects/player/ReloadStart3.mp3');
SFX.load('reloadFinish',    'sounds/soundeffects/player/ReloadFinish.mp3');
SFX.load('playerDamage',    'sounds/soundeffects/player/PlayerDamage.mp3');
