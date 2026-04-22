// ============================================================
// CLIPBLAST: PARTY HUNTER — Intro Sequence
// ============================================================

const INTRO = (() => {

  const SND = {
    startup1:   'sounds/soundeffects/opening/startup1.mp3',
    startup2:   'sounds/soundeffects/opening/startup2.ogg',
    startup3:   'sounds/soundeffects/opening/startup3.mp3',
    click:      'sounds/soundeffects/opening/click.mp3',
    switch:     'sounds/soundeffects/opening/switch.mp3',
    confirm:    'sounds/soundeffects/opening/confirm.mp3',
    bluescreen: 'sounds/soundeffects/opening/bluescreen.mp3',
    fixing: 'sounds/soundeffects/opening/fixing.mp3',

    typing1: 'sounds/soundeffects/opening/typing1.mp3',
typing2: 'sounds/soundeffects/opening/typing2.mp3',
typing3: 'sounds/soundeffects/opening/typing3.mp3',
  };

  const SPR = {
// In SPR object, replace clippy entries with:
clippyNotice1:   'sprites/clippy/Clippysurprisedleft.png',
clippyNotice2:   'sprites/clippy/Clippyworriedright1.png',
clippyNormal1:   'sprites/clippy/Clippyforward.png',
clippyNormal2:   'sprites/clippy/Clippyupleft.png',
clippyNormal3:   'sprites/clippy/Clippyworriedright2.png',
clippyWatching1: 'sprites/clippy/Clippyupright.png',
clippyWatching2: 'sprites/clippy/Clippyupleft.png',
clippyStressed1: 'sprites/clippy/Clippysweatingleft.png',
clippyStressed2: 'sprites/clippy/Clippyfocused.png',
clippyJump1:     'sprites/clippy/Clippyupright.png',
clippyJump2:     'sprites/clippy/Clippycrouchingleft.png',
    clippyNormal:   'sprites/Clippy.png',
    folder:         'sprites/ui/folder.png',
    appGeneric:   'sprites/ui/app_generic.png',
    computer:     'sprites/ui/computer.png',
    calculator:   'sprites/ui/calculator.png',
    trash:   'sprites/ui/trash.png',
    dataLocked:     'sprites/ui/data_locked.png',
    sapmovy:        'sprites/ui/sapmovy.png',
    drawalogo:      'sprites/ui/drawalogo.png',
  };

 const CLIPPY_FRAME_COUNTS = {
  notice:          2,
  engineer:        4,
  jump:            2,
  normal:          3,
  watching:        2,
  bluescreen_idle: 2,
};
  const imgs = {};
  function loadImg(key, src) {
    imgs[key] = new Image();
    imgs[key].src = src;
  }
  Object.entries(SPR).forEach(([k, v]) => loadImg(k, v));

  // Replace the existing audioCache/playSound setup at the top of the INTRO IIFE with this:

const audioCache = {};
let audioCtx = null;
let startup2Source = null; // Web Audio source node for seamless looping

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// Preload startup2 as a decoded buffer for seamless looping
let startup2Buffer = null;
fetch('sounds/soundeffects/opening/startup2.ogg')
  .then(r => r.arrayBuffer())
  .then(ab => getAudioCtx().decodeAudioData(ab))
  .then(buf => { startup2Buffer = buf; })
  .catch(() => {});

function playStartup2Loop() {
  if (!startup2Buffer) return;
  stopStartup2Loop();
  const ctx = getAudioCtx();
  startup2Source = ctx.createBufferSource();
  startup2Source.buffer = startup2Buffer;
  startup2Source.loop = true;
  startup2Source.loopStart = 0;
  startup2Source.loopEnd = startup2Buffer.duration;
  startup2Source.connect(ctx.destination);
  startup2Source.start(0);
}

function stopStartup2Loop() {
  if (startup2Source) {
    try { startup2Source.stop(); } catch(e) {}
    startup2Source = null;
  }
}

function playSound(key, loop = false) {
  if (key === 'startup2') { playStartup2Loop(); return; }
  try {
    if (!audioCache[key]) {
      audioCache[key] = new Audio(SND[key]);
      audioCache[key].loop = loop;
    }
    audioCache[key].currentTime = 0;
    audioCache[key].play().catch(() => {});
  } catch(e) {}
}

function stopSound(key) {
  if (key === 'startup2') { stopStartup2Loop(); return; }
  if (audioCache[key]) { audioCache[key].pause(); audioCache[key].currentTime = 0; }
}
  function stopAllMusic() {
    ['startup1', 'startup2', 'startup3'].forEach(k => stopSound(k));
  }

  let stage = 'BIOS';
  let onDone = null;
  let container = null;
  let overlayEl = null;
  let keyHandler = null;

  // ── BIOS state ──
  let biosPhase = 'typing';
  let difficultySelected = 0;

  // Memory test animation
  let memTestValue = 0;
  const memTestTarget = 65536;
  let memTestDone = false;
  let memTestStarted = false;
  let memTestLineVisible = false;

  // IDE detection animation
  let ideLines = [];
  let ideLineIdx = 0;
  let ideAnimTimer = 0;
  let ideAnimStarted = false;

  // Blinking cursor
  let biosCursor = true;
  let biosCursorTimer = 0;

  // Rendered line buckets
  let biosPreLines = [];
  let biosPostMemLines = [];
  let biosPostIdeLines = [];
  let postMemStarted = false;
  let postIdeStarted = false;

  // ── FIX: IDE detect lines now come AFTER PCI listing (reordered) ──
  const BIOS_LINES_PRE = [
    { text: 'Drawa Modular BIOS v4.51PG, An Energy Star Ally', color: '#aaaaaa', delay: 0 },
    { text: 'Copyright (C) 1984-97, Drawa Software, Inc.', color: '#aaaaaa', delay: 0 },
    { text: '', color: '#aaaaaa', delay: 600 },
    { text: '', color: '#aaaaaa', delay: 600 },
    { text: 'PENTIUM-S CPU at 666MHz', color: '#00ff66', delay: 500 },
  ];

  const BIOS_LINES_POST_MEM = [
    { text: '', color: '#aaaaaa', delay: 600 },
    { text: 'Drawa Plug and Play BIOS Extension  v1.0A', color: '#aaaaaa', delay: 400 },
    { text: 'Copyright (C) 1997, Drawa Software, Inc.', color: '#aaaaaa', delay: 0 },
    { text: '', color: '#aaaaaa', delay: 300 },
    // PCI listing comes FIRST now
    { text: 'PCI Device Listing...', color: '#aaaaaa', delay: 500 },
    { text: 'Bus No.  Device No.  Func No.  Vendor/Device Class  IRQ', color: '#555555', delay: 0 },
    { text: '  0         0          0       8086/7100  Host/PCI            --', color: '#555555', delay: 400 },
    { text: '  0         7          0       8086/7110  ISA                 --', color: '#555555', delay: 400 },
    { text: '  0         7          1       8086/7111  IDE                  9', color: '#555555', delay: 400 },
    { text: '  0         7          2       8086/7112  USB                 11', color: '#555555', delay: 400 },
    { text: '', color: '#aaaaaa', delay: 300 },
  ];

  // IDE detection now happens AFTER PCI listing
  const IDE_DETECT_LINES = [
    { text: '    Detecting IDE Primary Master   ... PCemHD', color: '#aaaaaa' },
    { text: '    Detecting IDE Primary Slave    ... PCemCD', color: '#aaaaaa' },
    { text: '    Detecting IDE Secondary Master ... None',   color: '#aaaaaa' },
    { text: '    Detecting IDE Secondary Slave  ... None',   color: '#aaaaaa' },
    { text: '', color: '#aaaaaa' },
  ];

  // Post-IDE lines: warnings + difficulty
  const BIOS_LINES_POST_IDE = [
    { text: 'WARNING: Unusual processes detected in memory.', color: '#ff4444', delay: 800 },
    { text: '         party.exe flagged: quarantine failed.', color: '#ff4444', delay: 0 },
    { text: '', color: '#aaaaaa', delay: 500 },
    // ── FIX: renamed to "PROCESSOR CALIBRATION", horizontal layout handled in draw ──
    { text: '>>> PROCESSOR CALIBRATION <<<', color: '#ffffff', delay: 600, isDifficultyPrompt: true },
  ];

  // Item draft
  let draftItems = [];
  let draftSelected = 0;
  let draftPhase = 'choosing';
  let draftCount = 0;

  // Desktop load
  let desktopLoadLines = [];
  const DESKTOP_LOAD_LINES = [
    { text: 'Microsoft Windows 98', color: '#ffffff', delay: 0 },
    { text: 'Copyright Microsoft Corporation 1981-1998', color: '#aaaaaa', delay: 0 },
    { text: '', delay: 200 },
    { text: 'Loading system components...', color: '#00ff66', delay: 300 },
    { text: '  [OK] KERNEL32.DLL', color: '#00ff66', delay: 180 },
    { text: '  [OK] USER32.DLL', color: '#00ff66', delay: 120 },
    { text: '  [OK] GDI32.DLL', color: '#00ff66', delay: 120 },
    { text: '  [!!] PARTY.EXE  ............. flagged', color: '#ff4444', delay: 400 },
    { text: '  [OK] SHELL32.DLL', color: '#00ff66', delay: 200 },
    { text: '', delay: 150 },
    { text: 'Starting Windows...', color: '#ffffff', delay: 500 },
  ];

  // Desktop
  let desktopPhase = 'idle';
  let desktopErrorMsg = '';
  let desktopErrorVisible = false;
  let desktopErrorApp = '';
  let desktopLoadingData = false;
  let desktopLoadDots = 0;
  let desktopLoadDotsTimer = 0;
  let desktopClickedData = false;

  const DESKTOP_APPS = [
    { id: 'mycomputer',  label: 'My Computer',  sprite: 'computer',    x: 24,  y: 30  },
    { id: 'calculator',  label: 'Calculator',   sprite: 'calculator',  x: 110, y: 170 },
    { id: 'recycle',     label: 'Trash',        sprite: 'trash',       x: 24,  y: 100 },
    { id: 'docs',        label: 'My Documents', sprite: 'folder',      x: 24,  y: 170 },
    { id: 'notepad',     label: 'Notepad',      sprite: 'notes',       x: 24,  y: 240 },
    { id: 'internet',    label: 'Sapmovy',      sprite: 'sapmovy',     x: 24,  y: 310 },
    { id: 'data',        label: 'data.md',      sprite: 'dataLocked',  x: 24,  y: 400 },
    { id: 'folder1',     label: 'Projects',     sprite: 'folder',      x: 110, y: 30  },
    { id: 'folder2',     label: 'Downloads',    sprite: 'folder',      x: 110, y: 100 },
  ];

  const ERROR_MESSAGES = {
    mycomputer:  'This operation has been blocked\nby an unknown process.\n\nError code: 0xC0000034',
    recycle:     'Access denied.\nThe Recycle Bin cannot be\naccessed at this time.',
    docs:        'My Documents is currently\nunavailable. A background process\nis restricting file access.',
    notepad:     'NOTEPAD.EXE failed to launch.\nA conflicting application\nis running in memory.',
    internet:    'Cannot connect. Winsock\ninitialization failed.\n\nError: 10061 - Connection refused.',
    folder1:     'This folder is empty.',
    folder2:     'This folder is empty.',
    calculator:  'CALC.EXE cannot start because\nMSVCRT.DLL is missing or corrupt.',
  };

  // Bluescreen / Clippy
  let bluescreenTimer = 0;
  let clippyVisible = false;
  let clippyAnim = 'notice';
  let clippyAnimFrame = 0;
  let clippyAnimTimer = 0;
  let clippyDialogText = '';
  let clippyDialogOptions = [];
  let clippyDialogCallback = null;
  let clippyDialogSelected = 0;
  let clippyDialogVisible = false;
  let clippySlideY = 300;

  // Terminal
  let termLines = [];
  let termCursor = true;
  let termCursorTimer = 0;
  let termDone = false;

  const TERM_SEQUENCE = [
    { type: 'output', text: 'Microsoft Windows [Version 10.0.19570.1000]', color: '#00ff66', delay: 0 },
    { type: 'output', text: '(c) 2020 Microsoft Corporation. All rights reserved.', color: '#00ff66', delay: 0 },
    { type: 'prompt', text: '', delay: 400 },
    { type: 'input',  text: 'tasklist | findstr /i "blocking"', delay: 80 },
    { type: 'output', text: '', delay: 200 },
    { type: 'output', text: 'Image Name          PID   Session   Mem Usage', color: '#00ff66', delay: 0 },
    { type: 'output', text: '=================== ===== ========= ==========', color: '#555555', delay: 0 },
    { type: 'output', text: 'party.exe           4096  Console   ???K', color: '#ff4444', delay: 0 },
    { type: 'output', text: '', delay: 300 },
    { type: 'prompt', text: '', delay: 200 },
    { type: 'input',  text: 'query party.exe --verbose', delay: 80 },
    { type: 'output', text: '', delay: 200 },
    { type: 'output', text: '[party.exe] Status: ACTIVE. Blocking 14 processes', color: '#ffdd00', delay: 0 },
    { type: 'output', text: '[party.exe] Origin: UNKNOWN. First seen 00:00:00', color: '#ffdd00', delay: 0 },
    { type: 'output', text: '[party.exe] Threat level: ███████ CRITICAL', color: '#ff4444', delay: 0 },
    { type: 'output', text: '', delay: 500 },
    { type: 'clippy_ask', text: 'party.exe is preventing you from\nopening files. Would you like\nme to open it?', delay: 0 },
  ];

  // Game window
  let gameWindowPhase = 'opening';
  let gameWindowTimer = 0;
  let introEnemyX = 0, introEnemyY = 0, introEnemyVx = 0.6, introEnemyVy = 0.4;
  let clippyJumpProgress = -1;
  let gameWindowOpacity = 0;

  // ── Overlay setup ──
  function buildOverlay() {
    overlayEl = document.createElement('div');
    overlayEl.id = 'intro-overlay';
    overlayEl.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      z-index: 9999; background: #000; overflow: hidden;
      font-family: 'Fixedsys', 'Courier New', monospace;
    `;
    document.body.appendChild(overlayEl);
    const c = document.createElement('canvas');
    c.id = 'intro-canvas';
    c.style.cssText = 'display:block; width:100%; height:100%;';
    c.width = 960; c.height = 600;
    overlayEl.appendChild(c);
    container = c;
  }

  function getCtx() { return container ? container.getContext('2d') : null; }

  function attachKeys(handler) {
    detachKeys();
    keyHandler = handler;
    window.addEventListener('keydown', keyHandler);
  }
  function detachKeys() {
    if (keyHandler) { window.removeEventListener('keydown', keyHandler); keyHandler = null; }
  }

  let desktopClickHandler = null;
  function attachDesktopClicks() {
    desktopClickHandler = (e) => {
      const rect = container.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (container.width / rect.width);
      const my = (e.clientY - rect.top)  * (container.height / rect.height);
      handleDesktopClick(mx, my);
    };
    container.addEventListener('click', desktopClickHandler);
  }
  function detachDesktopClicks() {
    if (desktopClickHandler) { container.removeEventListener('click', desktopClickHandler); desktopClickHandler = null; }
  }

  // ================================================================
  // STAGE: BIOS
  // ================================================================
  function startBIOS() {
    stage = 'BIOS';
    biosPhase = 'typing';
    biosPreLines = []; biosPostMemLines = []; biosPostIdeLines = [];
    memTestValue = 0; memTestDone = false; memTestStarted = false; memTestLineVisible = false;
    postMemStarted = false; postIdeStarted = false;
    ideLineIdx = 0; ideAnimTimer = 0; ideAnimStarted = false; ideLines = [];
    biosCursor = true; biosCursorTimer = 0;

    // ── FIX: startup1 plays immediately, startup2 loops right after startup1 ends ──
    playSound('startup1');
    // startup2 loops from the start — runs in background under startup1
    // Use a timeout roughly matching startup1 length to start the loop seamlessly
    // We preload startup2 immediately so there's no gap when it starts looping
    if (!audioCache['startup2']) {
      audioCache['startup2'] = new Audio(SND['startup2']);
      audioCache['startup2'].loop = true;
    }
    // Start startup2 at low volume immediately so it's buffered, then fade in after startup1
    // Simpler: just start looping startup2 after startup1 finishes (~2s typical chime)
    setTimeout(() => {
      if (stage === 'BIOS' || stage === 'ITEM_DRAFT' || stage === 'DESKTOP_LOAD') {
        audioCache['startup2'].currentTime = 0;
        audioCache['startup2'].play().catch(() => {});
      }
    }, 2000);

    let acc = 0;
    BIOS_LINES_PRE.forEach((line, i) => {
      acc += (line.delay || 0);
      setTimeout(() => {
        if (stage !== 'BIOS') return;
        biosPreLines.push({ ...line });
        if (i === BIOS_LINES_PRE.length - 1) {
          setTimeout(() => { if (stage === 'BIOS') { memTestLineVisible = true; memTestStarted = true; } }, 300);
        }
      }, acc + i * 110);
    });

    attachKeys((e) => {
      if (stage !== 'BIOS') return;
      if (biosPhase === 'difficulty') {
        // ── FIX: play switch sound BEFORE updating selection ──
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          playSound('switch');
          setTimeout(() => { difficultySelected = (difficultySelected + 2) % 3; }, 30);
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          playSound('switch');
          setTimeout(() => { difficultySelected = (difficultySelected + 1) % 3; }, 30);
        } else if (e.key === 'Enter') {
          playSound('confirm');
          applyDifficulty(difficultySelected);
          biosPhase = 'done';
          draftCount = difficultySelected === 0 ? 0 : difficultySelected === 1 ? 1 : 2;
          setTimeout(() => startItemDraft(), 600);
        }
      }
    });

    requestAnimationFrame(biosLoop);
  }

  function biosLoop() {
    if (stage !== 'BIOS') return;

    // Cursor blink
    biosCursorTimer++;
    if (biosCursorTimer >= 30) { biosCursorTimer = 0; biosCursor = !biosCursor; }

    // Memory test count-up
    if (memTestStarted && !memTestDone) {
      memTestValue = Math.min(memTestValue + Math.ceil(memTestTarget / 50), memTestTarget);
      if (memTestValue >= memTestTarget) {
        memTestValue = memTestTarget;
        memTestDone = true;
        if (!postMemStarted) {
          postMemStarted = true;
          let acc2 = 200;
          BIOS_LINES_POST_MEM.forEach((line, i) => {
            acc2 += (line.delay || 0);
            setTimeout(() => {
              if (stage !== 'BIOS') return;
              biosPostMemLines.push({ ...line });
              // IDE detect starts after ALL post-mem lines (PCI listing) are done
              if (i === BIOS_LINES_POST_MEM.length - 1) {
                setTimeout(() => { if (stage === 'BIOS') ideAnimStarted = true; }, 400);
              }
            }, acc2 + i * 110);
          });
        }
      }
    }

    // IDE detection: one line per ~13 frames — now runs AFTER PCI listing
    if (ideAnimStarted && ideLineIdx < IDE_DETECT_LINES.length) {
      ideAnimTimer++;
      if (ideAnimTimer >= 13) {
        ideAnimTimer = 0;
        ideLines.push({ ...IDE_DETECT_LINES[ideLineIdx] });
        ideLineIdx++;
        if (ideLineIdx >= IDE_DETECT_LINES.length && !postIdeStarted) {
          postIdeStarted = true;
          let acc3 = 300;
          BIOS_LINES_POST_IDE.forEach((line, i) => {
            acc3 += (line.delay || 0);
            setTimeout(() => {
              if (stage !== 'BIOS') return;
              if (line.isDifficultyPrompt) biosPhase = 'difficulty';
              biosPostIdeLines.push({ ...line });
            }, acc3 + i * 90);
          });
        }
      }
    }

    drawBIOS();
    requestAnimationFrame(biosLoop);
  }

  function drawBIOS() {
    const c = getCtx(); if (!c) return;
    const W = 960, H = 600;
    c.fillStyle = '#000000'; c.fillRect(0, 0, W, H);

    // ── FIX: logo and text centered (shifted right from x=40 to x=200, logo centered) ──
    const logo = imgs.drawalogo;
    if (logo && logo.complete && logo.naturalWidth > 0) {
      const lw = 180, lh = Math.round(logo.naturalHeight * (lw / logo.naturalWidth));
      // Center the logo horizontally
      c.drawImage(logo, W / 2 - lw / 2, 20, lw, lh);
    }

    c.font = '13px "Fixedsys", "Courier New", monospace';
    const lineH = 18;
    // ── FIX: start text more toward center of screen ──
    const textX = 200;
    let y = 60;

    for (const line of biosPreLines) {
      c.fillStyle = line.color || '#aaaaaa';
      c.fillText(line.text, textX, y);
      y += lineH;
    }

    if (memTestLineVisible) {
      c.fillStyle = '#00ff66';
      c.fillText(`Memory Test :  ${String(memTestValue).padStart(6, ' ')}K OK`, textX, y);
      y += lineH;
    }

    for (const line of biosPostMemLines) {
      c.fillStyle = line.color || '#aaaaaa';
      c.fillText(line.text, textX, y);
      y += lineH;
    }

    for (const line of ideLines) {
      c.fillStyle = line.color || '#aaaaaa';
      c.fillText(line.text, textX, y);
      y += lineH;
    }

    for (const line of biosPostIdeLines) {
      if (line.isDifficultyPrompt) {
        // ── FIX: white text, "PROCESSOR CALIBRATION", horizontal layout ──
        c.fillStyle = '#ffffff';
        c.fillText('>>> PROCESSOR CALIBRATION <<<', textX, y);
        y += lineH + 8;

        const opts = ['Easy', 'Normal', 'Hard'];
        const optW = 100;
        const totalW = opts.length * optW;
        const startOptX = textX;

        opts.forEach((opt, i) => {
          const sel = i === difficultySelected && biosPhase === 'difficulty';
          const ox = startOptX + i * optW;
          if (sel) {
            c.fillStyle = '#ffffff';
            c.fillRect(ox - 2, y - 14, optW - 6, 18);
            c.fillStyle = '#000000';
          } else {
            c.fillStyle = '#888888';
          }
          c.fillText((sel ? '> ' : '  ') + opt, ox, y);
        });
        y += lineH;

        if (biosPhase === 'difficulty') {
          c.fillStyle = '#555555';
          c.fillText('Use arrow keys to select, ENTER to confirm', textX, y + 8);
          y += lineH + 8;
        }
      } else {
        c.fillStyle = line.color || '#aaaaaa';
        c.fillText(line.text, textX, y);
        y += lineH;
      }
    }

    // Blinking grey cursor on the last line while typing
    if (biosPhase === 'typing' && biosCursor) {
      const allLines = [
        ...biosPreLines,
        ...(memTestLineVisible ? [{ text: `Memory Test :  ${String(memTestValue).padStart(6, ' ')}K OK` }] : []),
        ...biosPostMemLines,
        ...ideLines,
        ...biosPostIdeLines.filter(l => !l.isDifficultyPrompt),
      ];
      if (allLines.length > 0) {
        const last = allLines[allLines.length - 1];
        const tw = c.measureText(last.text || '').width;
        const curY = 60 + (allLines.length - 1) * lineH;
        c.fillStyle = '#888888';
        c.fillRect(textX + tw + 2, curY - 12, 8, 14);
      }
    }
  }

  // ================================================================
  // STAGE: ITEM DRAFT
  // ================================================================
  const BASE_ITEM_IDS = ['paperCuts', 'extraClips'];

  function startItemDraft() {
    stage = 'ITEM_DRAFT';
    detachKeys();
    draftSelected = 0;
    draftPhase = 'choosing';

    if (draftCount === 0) { setTimeout(() => startDesktopLoad(), 400); return; }

    const pool = [];
    for (let i = 0; i < 3; i++) pool.push(BASE_ITEM_IDS[i % BASE_ITEM_IDS.length]);
    pool.sort(() => Math.random() - 0.5);
    draftItems = pool.slice(0, 3).map(id => ITEM_DEFS[id]);

    let pickedCount = 0;

    attachKeys((e) => {
      if (stage !== 'ITEM_DRAFT') return;
      if (draftPhase !== 'choosing') return;
      // ── FIX: play switch sound BEFORE updating selection ──
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        playSound('switch');
        setTimeout(() => { draftSelected = (draftSelected + 2) % 3; }, 30);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        playSound('switch');
        setTimeout(() => { draftSelected = (draftSelected + 1) % 3; }, 30);
      } else if (e.key === 'Enter') {
        playSound('confirm');
        const chosen = draftItems[draftSelected];
        if (!gs.unlockedItems.includes(chosen.id)) gs.unlockedItems.push(chosen.id);
        chosen.effect(gs);
        pickedCount++;
        if (pickedCount >= draftCount) { draftPhase = 'done'; setTimeout(() => startDesktopLoad(), 500); }
        else {
          const pool2 = [];
          for (let i = 0; i < 3; i++) pool2.push(BASE_ITEM_IDS[i % BASE_ITEM_IDS.length]);
          pool2.sort(() => Math.random() - 0.5);
          draftItems = pool2.map(id => ITEM_DEFS[id]);
          draftSelected = 0;
        }
      }
    });

    requestAnimationFrame(draftLoop);
  }

  function draftLoop() {
    if (stage !== 'ITEM_DRAFT') return;
    drawDraft();
    requestAnimationFrame(draftLoop);
  }

  function drawDraft() {
    const c = getCtx(); if (!c) return;
    c.fillStyle = '#000000'; c.fillRect(0, 0, 960, 600);
    c.font = '13px "Fixedsys", "Courier New", monospace';
    c.fillStyle = '#00ff66';
    c.fillText('BIOS item cache detected. Select one to load into memory:', 40, 50);
    c.fillStyle = '#555555';
    c.fillText('(DESCRIPTION DATA: UNAVAILABLE)', 40, 72); // this should be in red

    const cardW = 200, cardH = 110, startX = 100, cardY = 140, gap = 60;
    draftItems.forEach((item, i) => {
      const x = startX + i * (cardW + gap);
      const sel = i === draftSelected && draftPhase === 'choosing';
      c.fillStyle = sel ? '#003300' : '#111111'; c.fillRect(x, cardY, cardW, cardH);
      c.strokeStyle = sel ? '#00ff66' : '#333333'; c.lineWidth = sel ? 2 : 1; c.strokeRect(x, cardY, cardW, cardH);
      if (sel) { c.fillStyle = '#00ff66'; c.fillText('>', x - 18, cardY + 58); }
      c.fillStyle = sel ? '#00ff66' : '#888888';
      c.font = 'bold 13px "Fixedsys", "Courier New", monospace';
      const label = item.label.replace(/\n/g, ' ');
      const words = label.split(' ');
      let l1 = '', l2 = '';
      words.forEach(w => { if (c.measureText(l1 + w).width < cardW - 20) l1 += (l1 ? ' ' : '') + w; else l2 += (l2 ? ' ' : '') + w; });
      c.fillText(l1, x + 10, cardY + 50);
      if (l2) c.fillText(l2, x + 10, cardY + 68);
      c.font = '11px "Fixedsys", "Courier New", monospace';
      c.fillStyle = '#555555'; c.fillText('[?????]', x + 10, cardY + 88);
    });

    c.font = '11px "Fixedsys", "Courier New", monospace';
    c.fillStyle = '#444444';
    c.fillText('Arrow keys: navigate   |   Enter: select', 320, 310);

    if (draftPhase === 'done') {
      c.fillStyle = '#00ff66'; c.font = '14px "Fixedsys", "Courier New", monospace';
      c.fillText('Loading selected item... OK', 40, 380);
    }
  }

  // ================================================================
  // STAGE: DESKTOP LOAD
  // ================================================================
  function startDesktopLoad() {
    stage = 'DESKTOP_LOAD';
    detachKeys();
    desktopLoadLines = [];
    // ── FIX: stop startup1 if still playing, keep startup2 looping — do NOT play startup3 here ──
    stopSound('startup1');
    // startup2 continues looping through this screen — no change needed

    let acc = 800;
    DESKTOP_LOAD_LINES.forEach((line, i) => {
      acc += (line.delay || 0) + 90;
      setTimeout(() => {
        if (stage !== 'DESKTOP_LOAD') return;
        desktopLoadLines.push({ ...line, visible: true });
        if (i === DESKTOP_LOAD_LINES.length - 1) setTimeout(() => transitionToDesktop(), 1200);
      }, acc);
    });

    requestAnimationFrame(desktopLoadLoop);
  }

  function desktopLoadLoop() {
    if (stage !== 'DESKTOP_LOAD') return;
    drawDesktopLoad();
    requestAnimationFrame(desktopLoadLoop);
  }

  function drawDesktopLoad() {
    const c = getCtx(); if (!c) return;
    c.fillStyle = '#000000'; c.fillRect(0, 0, 960, 600);
    c.font = '13px "Fixedsys", "Courier New", monospace';
    let y = 60;
    desktopLoadLines.forEach(line => {
      if (!line.visible) return;
      c.fillStyle = line.color || '#aaaaaa';
      c.fillText(line.text || '', 60, y);
      y += 20;
    });
  }

  // ================================================================
  // STAGE: DESKTOP
  // ================================================================
  function transitionToDesktop() {
    stage = 'DESKTOP';
    desktopPhase = 'idle';
    desktopErrorVisible = false;
    desktopLoadingData = false;
    desktopClickedData = false;
    // ── FIX: stop startup2 and play startup3 only NOW when desktop appears ──
    stopSound('startup2');
    playSound('startup3');
    attachDesktopClicks();
    requestAnimationFrame(desktopLoop);
  }

  function desktopLoop() {
    if (stage !== 'DESKTOP') return;
    if (desktopLoadingData) {
      desktopLoadDotsTimer++;
      if (desktopLoadDotsTimer > 20) { desktopLoadDotsTimer = 0; desktopLoadDots = (desktopLoadDots + 1) % 4; }
    }
    drawDesktop();
    requestAnimationFrame(desktopLoop);
  }

  function handleDesktopClick(mx, my) {
    if (desktopPhase === 'loading_data') return;

    if (desktopErrorVisible) {
      const bw = 340, bh = 210, bx = 960/2 - bw/2, by = 300 - bh/2;
      const okX = bx + bw/2 - 30, okY = by + bh - 34;
      if (mx > okX && mx < okX + 60 && my > okY && my < okY + 22) {
        desktopErrorVisible = false;
        playSound('click');
      }
      return;
    }

    const IW = 48, IH = 64;
    for (const app of DESKTOP_APPS) {
      if (mx >= app.x && mx <= app.x + IW && my >= app.y && my <= app.y + IH) {
        playSound('click');
        if (app.id === 'data') {
          handleDataClick();
        } else if (app.sprite === 'folder') {
          desktopErrorVisible = true;
          desktopErrorApp = app.label;
          desktopErrorMsg = ERROR_MESSAGES[app.id] || 'This folder is empty.';
        } else {
          desktopErrorVisible = true;
          desktopErrorApp = app.label.replace('\n', ' ');
          desktopErrorMsg = ERROR_MESSAGES[app.id] || 'This application cannot be opened.';
        }
        return;
      }
    }
  }

  function handleDataClick() {
    if (desktopClickedData) return;
    desktopClickedData = true;
    desktopPhase = 'loading_data';
    desktopLoadingData = true;
    desktopLoadDots = 0; desktopLoadDotsTimer = 0;
    setTimeout(() => {
      desktopLoadingData = false;
      stopSound('startup3');
      playSound('bluescreen');
      startBluescreen();
    }, 2200);
  }

  function drawDesktop() {
    const c = getCtx(); if (!c) return;
    const W = 960, H = 600;
    c.fillStyle = '#008080'; c.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 2) { c.fillStyle = 'rgba(0,0,0,0.04)'; c.fillRect(0, y, W, 1); }

    DESKTOP_APPS.forEach(app => {
      const { x, y, label, sprite } = app;
      const IW = 48, IH = 48;
      const img = imgs[sprite];
      if (img && img.complete && img.naturalWidth > 0) {
        c.drawImage(img, x, y, IW, IH);
      } else {
        c.fillStyle = sprite === 'dataLocked' ? '#cc4400' : sprite === 'folder' ? '#ffcc44' : '#aaaacc';
        c.fillRect(x, y, IW, IH);
        c.strokeStyle = '#000'; c.lineWidth = 1; c.strokeRect(x, y, IW, IH);
        c.fillStyle = '#000'; c.font = 'bold 9px "MS Sans Serif", Arial, sans-serif'; c.textAlign = 'center';
        c.fillText(sprite === 'dataLocked' ? '🔒' : sprite === 'folder' ? '📁' : '📄', x + IW/2, y + IH/2 + 4);
        c.textAlign = 'left';
      }
      c.font = '11px "MS Sans Serif", Arial, sans-serif'; c.textAlign = 'center';
      label.split('\n').forEach((ln, li) => {
        c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillText(ln, x + IW/2 + 1, y + IH + 14 + li * 13 + 1);
        c.fillStyle = '#ffffff';          c.fillText(ln, x + IW/2,     y + IH + 14 + li * 13);
      });
      c.textAlign = 'left';
    });

    if (desktopLoadingData) {
      const dots = '.'.repeat(desktopLoadDots);
      c.font = '13px "Fixedsys", monospace'; c.fillStyle = '#ffdd00';
      c.fillText('Opening' + dots, 24, 490);
      c.fillText(['|','/','\u2014','\\'][Math.floor(Date.now()/200)%4], 110, 490);
    }

    if (desktopErrorVisible) drawErrorDialog(c, desktopErrorApp, desktopErrorMsg);
    drawTaskbar(c, W, H);
  }

  function drawErrorDialog(c, title, msg) {
    const bw = 340, bh = 210, bx = 960/2 - bw/2, by = 300 - bh/2;
    c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(bx+4, by+4, bw, bh);
    c.fillStyle = '#d4d0c8'; c.fillRect(bx, by, bw, bh);
    c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.strokeRect(bx, by, bw, bh);
    c.strokeStyle = '#404040'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(bx+bw-1, by+1); c.lineTo(bx+bw-1, by+bh-1); c.lineTo(bx+1, by+bh-1); c.stroke();
    const grad = c.createLinearGradient(bx, by, bx+bw, by);
    grad.addColorStop(0, '#0a246a'); grad.addColorStop(1, '#3a6ea8');
    c.fillStyle = grad; c.fillRect(bx+2, by+2, bw-4, 18);
    c.fillStyle = '#ffffff'; c.font = 'bold 11px "MS Sans Serif", Arial, sans-serif';
    c.fillText('\u26a0  ' + title, bx + 8, by + 14);
    c.fillStyle = '#ff0000'; c.font = 'bold 26px serif'; c.fillText('\u2715', bx + 18, by + 64);
    c.fillStyle = '#000000'; c.font = '11px "MS Sans Serif", Arial, sans-serif';
    msg.split('\n').forEach((ln, i) => c.fillText(ln, bx + 54, by + 48 + i * 16));
    c.strokeStyle = '#808080'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(bx+6, by+bh-42); c.lineTo(bx+bw-6, by+bh-42); c.stroke();
    c.strokeStyle = '#ffffff';
    c.beginPath(); c.moveTo(bx+6, by+bh-41); c.lineTo(bx+bw-6, by+bh-41); c.stroke();
    const okX = bx + bw/2 - 30, okY = by + bh - 34;
    c.fillStyle = '#d4d0c8'; c.fillRect(okX, okY, 60, 22);
    c.strokeStyle = '#ffffff'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(okX, okY+22); c.lineTo(okX, okY); c.lineTo(okX+60, okY); c.stroke();
    c.strokeStyle = '#404040';
    c.beginPath(); c.moveTo(okX+60, okY); c.lineTo(okX+60, okY+22); c.lineTo(okX, okY+22); c.stroke();
    c.fillStyle = '#000'; c.font = '11px "MS Sans Serif", Arial, sans-serif';
    c.textAlign = 'center'; c.fillText('OK', okX+30, okY+14); c.textAlign = 'left';
  }

  function drawTaskbar(c, W, H) {
    c.fillStyle = '#c0c0c0'; c.fillRect(0, H-28, W, 28);
    c.strokeStyle = '#ffffff'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(0, H-28); c.lineTo(W, H-28); c.stroke();
    c.fillStyle = '#d4d0c8'; c.fillRect(2, H-26, 54, 24);
    c.strokeStyle = '#ffffff'; c.beginPath(); c.moveTo(2,H-2); c.lineTo(2,H-26); c.lineTo(56,H-26); c.stroke();
    c.strokeStyle = '#808080'; c.beginPath(); c.moveTo(56,H-26); c.lineTo(56,H-2); c.lineTo(2,H-2); c.stroke();
    c.fillStyle = '#000'; c.font = 'bold 11px "MS Sans Serif", Arial, sans-serif'; c.fillText('Start', 10, H-10);
    const timeStr = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    c.fillStyle = '#d4d0c8'; c.fillRect(W-68, H-26, 66, 24);
    c.fillStyle = '#000'; c.font = '11px "MS Sans Serif", Arial, sans-serif';
    c.textAlign = 'right'; c.fillText(timeStr, W-6, H-10); c.textAlign = 'left';
  }

  // ================================================================
  // STAGE: BLUESCREEN
  // ================================================================
  function startBluescreen() {
    stage = 'BLUESCREEN';
    detachDesktopClicks();
    bluescreenTimer = 0; clippyVisible = false; clippySlideY = 300; clippyDialogVisible = false; clippyAnim = 'notice';

    setTimeout(() => {
      clippyVisible = true; clippyAnim = 'notice'; clippyAnimFrame = 0;
setTimeout(() => showClippyDialog(
  "It looks like you're having\ntechnical difficulties!\nNeed help?",
  ['Yes, please!', 'No thanks'],
  (choice) => {
    clippyAnim = 'bluescreen_idle';
    if (choice === 0) startTerminal();
    else showClippyDialog("Are you sure? Things look\npretty bad...", ['OK fine, help me', 'Bug off'],
      (c2) => { if (c2 === 0) startTerminal(); });
  }
), 800);
    }, 3000);

    attachKeys((e) => {
      if (stage !== 'BLUESCREEN') return;
      if (!clippyDialogVisible) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        playSound('switch');
        setTimeout(() => { clippyDialogSelected = (clippyDialogSelected + clippyDialogOptions.length - 1) % clippyDialogOptions.length; }, 30);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        playSound('switch');
        setTimeout(() => { clippyDialogSelected = (clippyDialogSelected + 1) % clippyDialogOptions.length; }, 30);
      } else if (e.key === 'Enter') { playSound('confirm'); const cb = clippyDialogCallback, sel = clippyDialogSelected; clippyDialogVisible = false; if (cb) cb(sel); }
    });

    requestAnimationFrame(bluescreenLoop);
  }

  function showClippyDialog(text, options, callback) {
    clippyDialogText = text; clippyDialogOptions = options; clippyDialogCallback = callback;
    clippyDialogSelected = 0; clippyDialogVisible = true;
  }

  function bluescreenLoop() {
    if (stage !== 'BLUESCREEN') return;
    bluescreenTimer++;
    if (clippyVisible && clippySlideY > 0) clippySlideY = Math.max(0, clippySlideY - 12);

    
    clippyAnimTimer--;
if (clippyAnimTimer <= 0) {
  const count = CLIPPY_FRAME_COUNTS[clippyAnim] || 1;
  if (count > 1) {
    let next;
    do { next = Math.floor(Math.random() * count); } while (next === clippyAnimFrame);
    clippyAnimFrame = next;
  }
  clippyAnimTimer = 60 + Math.floor(Math.random() * 120); // 1 to 3 seconds
}
    
    drawBluescreen();
    requestAnimationFrame(bluescreenLoop);
  }

  function drawBluescreen() {
    const c = getCtx(); if (!c) return;
    const W = 960, H = 600;
    c.fillStyle = '#0000aa'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#ffffff'; c.font = '14px "Fixedsys", "Courier New", monospace';
    [
      '*** STOP: 0x0000007B (0xF641F84C,0xC0000034,0x00000000,0x00000000)',
      'INACCESSIBLE_BOOT_DEVICE', '',
      "If this is the first time you've seen this Stop error screen,",
      'restart your computer. If this screen appears again, follow these steps:',
      '', 'Check for viruses on your computer. Remove party.exe if found.',
      'Check your hard drive configuration and restart.', '',
      'Run CHKDSK /F to check for hard drive corruption, and then restart.',
      '', 'Refer to your Getting Started manual for more information on',
      'troubleshooting Stop errors.',
    ].forEach((ln, i) => c.fillText(ln, 40, 60 + i * 22));
    if (clippyVisible) {
      const cx = W - 140, cy = H - 180 + clippySlideY;
      drawClippyAt(c, cx, cy, clippyAnim, clippyAnimFrame);
      if (clippyDialogVisible) drawClippyDialogBox(c, cx - 200, cy - 60);
    }
  }

  // ================================================================
  // STAGE: TERMINAL
  // ================================================================
 function startTerminal() {
  stage = 'TERMINAL';
  detachKeys();
  termLines = []; termDone = false; clippyAnim = 'engineer'; clippySlideY = 0;
  playSound('fixing', true);

    attachKeys((e) => {
      if (stage !== 'TERMINAL') return;
      if (!clippyDialogVisible) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        playSound('switch');
        setTimeout(() => { clippyDialogSelected = (clippyDialogSelected + clippyDialogOptions.length - 1) % clippyDialogOptions.length; }, 30);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        playSound('switch');
        setTimeout(() => { clippyDialogSelected = (clippyDialogSelected + 1) % clippyDialogOptions.length; }, 30);
      } else if (e.key === 'Enter') { playSound('confirm'); const cb = clippyDialogCallback, sel = clippyDialogSelected; clippyDialogVisible = false; if (cb) cb(sel); }
    });

    runTerminalSequence(0);
    requestAnimationFrame(terminalLoop);
  }

  function runTerminalSequence(idx) {
    if (idx >= TERM_SEQUENCE.length) { termDone = true; return; }
    const step = TERM_SEQUENCE[idx];
   if (step.type === 'clippy_ask') {
  setTimeout(() => {
    stopSound('fixing');
    clippyAnim = 'normal';  // switch back to normal sprite
    clippyAnimFrame = 0;
    showClippyDialog(step.text, ['Yes, open it', 'No'], (choice) => {
          if (choice === 0) { termLines.push({ text: 'C:\\Users\\clippy> open party.exe', color: '#00ff66' }); setTimeout(() => startGameWindow(), 1200); }
          else { termLines.push({ text: 'Operation cancelled.', color: '#ff4444' }); setTimeout(() => runTerminalSequence(idx + 1), 500); }
        });
      }, step.delay || 0);
      return;
    }
    setTimeout(() => {
      if (step.type === 'prompt') termLines.push({ text: 'C:\\Users\\clippy> ', color: '#00ff66' });
      else if (step.type === 'input') { typeTermLine(step.text, '#ffffff', () => setTimeout(() => runTerminalSequence(idx + 1), 200)); return; }
      else if (step.type === 'output') termLines.push({ text: step.text, color: step.color || '#00ff66' });
      setTimeout(() => runTerminalSequence(idx + 1), 80);
    }, step.delay || 0);
  }

  function playTypeSound() {
  const key = 'typing' + (1 + Math.floor(Math.random() * 3));
  // Can't use audioCache for this — need a fresh Audio each time
  // so multiple overlapping clicks can play simultaneously
  try {
    const a = new Audio(SND[key]);
    a.volume = 0.4;
    a.play().catch(() => {});
  } catch(e) {}
}

  function typeTermLine(text, color, onDone) {
    let i = 0;
    const lineObj = { text: '', color, isTyping: true };
    termLines.push(lineObj);
    function typeChar() {
      if (i >= text.length) { lineObj.isTyping = false; if (onDone) onDone(); return; }
      lineObj.text += text[i++];
      playTypeSound(); 
      setTimeout(typeChar, 45);
    }
    typeChar();
  }

  function terminalLoop() {
    if (stage !== 'TERMINAL') return;
    termCursorTimer++; if (termCursorTimer > 25) { termCursorTimer = 0; termCursor = !termCursor; }
   
    clippyAnimTimer--;
if (clippyAnimTimer <= 0) {
  const count = CLIPPY_FRAME_COUNTS[clippyAnim] || 1;
  if (count > 1) {
    let next;
    do { next = Math.floor(Math.random() * count); } while (next === clippyAnimFrame);
    clippyAnimFrame = next;
  }
  clippyAnimTimer = 60 + Math.floor(Math.random() * 120); // 1 to 3 seconds
}
    
    drawTerminal();
    requestAnimationFrame(terminalLoop);
  }

  function drawTerminal() {
    const c = getCtx(); if (!c) return;
    const W = 960, H = 600;
    c.fillStyle = '#0a0a0a'; c.fillRect(0, 0, W, H);
    c.font = '13px "Fixedsys", "Courier New", monospace';
    const lineH = 18, maxLines = Math.floor((H - 80) / lineH);
    const vis = termLines.slice(-maxLines);
    vis.forEach((ln, i) => {
      c.fillStyle = ln.color || '#00ff66';
      c.fillText(ln.text + (ln.isTyping && termCursor ? '\u2588' : ''), 20, 40 + i * lineH);
    });
    const last = termLines[termLines.length - 1];
    if (last && !last.isTyping && termCursor && !clippyDialogVisible) {
      c.fillStyle = '#00ff66';
      c.fillText('\u2588', 20 + c.measureText(last.text).width, 40 + (Math.min(termLines.length, maxLines) - 1) * lineH);
    }
    const cx = W - 130, cy = H - 160;
    drawClippyAt(c, cx, cy, clippyAnim, clippyAnimFrame);
    if (clippyDialogVisible) drawClippyDialogBox(c, cx - 220, cy - 80);
  }

  // ================================================================
  // STAGE: GAME WINDOW
  // ================================================================
  function startGameWindow() {
    stage = 'GAME_WINDOW';
    gameWindowPhase = 'opening'; gameWindowTimer = 0; gameWindowOpacity = 0;
   clippyAnim = 'watching'; clippyAnimFrame = 0; clippyDialogVisible = false;
    introEnemyX = 480; introEnemyY = 300; introEnemyVx = 0.6; introEnemyVy = 0.4;
    clippyJumpProgress = -1;

    attachKeys((e) => {
      if (stage !== 'GAME_WINDOW') return;
      if (!clippyDialogVisible) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        playSound('switch');
        setTimeout(() => { clippyDialogSelected = (clippyDialogSelected + clippyDialogOptions.length - 1) % clippyDialogOptions.length; }, 30);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        playSound('switch');
        setTimeout(() => { clippyDialogSelected = (clippyDialogSelected + 1) % clippyDialogOptions.length; }, 30);
      } else if (e.key === 'Enter') { playSound('confirm'); const cb = clippyDialogCallback, sel = clippyDialogSelected; clippyDialogVisible = false; if (cb) cb(sel); }
    });

    requestAnimationFrame(gameWindowLoop);
  }

  function gameWindowLoop() {
    if (stage !== 'GAME_WINDOW') return;
    gameWindowTimer++;
    if (gameWindowOpacity < 1) gameWindowOpacity = Math.min(1, gameWindowOpacity + 0.04);
    if (gameWindowPhase === 'enemy_spawn' || gameWindowPhase === 'clippy_ask') {
      introEnemyX += introEnemyVx; introEnemyY += introEnemyVy;
      const GWX = 200, GWY = 80, GWW = 560, GWH = 380;
      if (introEnemyX < GWX + 30 || introEnemyX > GWX + GWW - 30) introEnemyVx *= -1;
      if (introEnemyY < GWY + 50 || introEnemyY > GWY + GWH - 30) introEnemyVy *= -1;
    }
    if (gameWindowPhase === 'clippy_jump') {
      introEnemyX += (480 - introEnemyX) * 0.08; introEnemyY += (300 - introEnemyY) * 0.08;
      clippyJumpProgress += 0.04;
       clippyAnimFrame = clippyJumpProgress > 0.8 ? 1 : 0; 
      if (clippyJumpProgress > 1) { gameWindowPhase = 'done'; setTimeout(() => finishIntro(), 800); }
    }

    
    clippyAnimTimer--;
if (clippyAnimTimer <= 0) {
  const count = CLIPPY_FRAME_COUNTS[clippyAnim] || 1;
  if (count > 1) {
    let next;
    do { next = Math.floor(Math.random() * count); } while (next === clippyAnimFrame);
    clippyAnimFrame = next;
  }
  clippyAnimTimer = 60 + Math.floor(Math.random() * 120); // 1 to 3 seconds
}
    
    if (gameWindowPhase === 'opening' && gameWindowTimer === 80) gameWindowPhase = 'enemy_spawn';
    if (gameWindowPhase === 'enemy_spawn' && gameWindowTimer === 160) {
      gameWindowPhase = 'clippy_ask';
        clippyAnim = 'normal'; clippyAnimFrame = 0;
      showClippyDialog(
        "It looks like viruses are\ndefending the data file.\nIt is dangerous to fight\nthem alone. Want my help?",
        ['Yes!', 'I got this'],
        (choice) => {
          if (choice === 0) { clippyAnim = 'jump'; clippyJumpProgress = 0; gameWindowPhase = 'clippy_jump'; }
          else finishIntro();
        }
      );
    }
    drawGameWindow();
    requestAnimationFrame(gameWindowLoop);
  }

  function drawGameWindow() {
    const c = getCtx(); if (!c) return;
    const W = 960, H = 600;
    c.globalAlpha = gameWindowOpacity;
    c.fillStyle = '#008080'; c.fillRect(0, 0, W, H);
    c.globalAlpha = 1;
    drawTaskbar(c, W, H);
    const GWX = 200, GWY = 80, GWW = 560, GWH = 380;
    c.globalAlpha = gameWindowOpacity;
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(GWX+5, GWY+5, GWW, GWH);
    c.fillStyle = '#000000'; c.fillRect(GWX, GWY, GWW, GWH);
    c.fillStyle = '#d4d0c8'; c.fillRect(GWX, GWY, GWW, 22);
    const tg = c.createLinearGradient(GWX, GWY, GWX+GWW, GWY);
    tg.addColorStop(0, '#0a246a'); tg.addColorStop(1, '#3a6ea8');
    c.fillStyle = tg; c.fillRect(GWX+2, GWY+2, GWW-4, 18);
    c.fillStyle = '#ffffff'; c.font = 'bold 11px "MS Sans Serif", Arial, sans-serif'; c.fillText('party.exe', GWX+8, GWY+14);
    c.fillStyle = '#0a0a0f'; c.fillRect(GWX+2, GWY+22, GWW-4, GWH-24);
    c.strokeStyle = 'rgba(0,255,100,0.03)'; c.lineWidth = 1;
    for (let gx = GWX+2; gx < GWX+GWW-2; gx += 40) { c.beginPath(); c.moveTo(gx, GWY+22); c.lineTo(gx, GWY+GWH-2); c.stroke(); }
    for (let gy = GWY+22; gy < GWY+GWH-2; gy += 40) { c.beginPath(); c.moveTo(GWX+2, gy); c.lineTo(GWX+GWW-2, gy); c.stroke(); }
    if (gameWindowPhase !== 'done' && clippyJumpProgress < 0.9) drawIntroEnemy(c, introEnemyX, introEnemyY);
    if (gameWindowPhase === 'done') {
      c.fillStyle = `rgba(255,220,0,${Math.max(0, 1 - gameWindowTimer * 0.05)})`; c.fillRect(GWX+2, GWY+22, GWW-4, GWH-24);
      for (let pi = 0; pi < 12; pi++) {
        const pa = (pi/12)*Math.PI*2 + gameWindowTimer*0.1, pr = 20 + pi * 3;
        c.fillStyle = ['#ff69b4','#ffdd00','#00ff66','#ff4444'][pi%4];
        c.fillRect(introEnemyX + Math.cos(pa)*pr - 3, introEnemyY + Math.sin(pa)*pr - 3, 6, 6);
      }
    }
    c.globalAlpha = 1;
    const clippyBaseX = W - 130, clippyBaseY = H - 170;
    if (gameWindowPhase === 'clippy_jump' && clippyJumpProgress >= 0 && clippyJumpProgress <= 1) {
      const t = clippyJumpProgress;
      const jx = clippyBaseX + (introEnemyX - clippyBaseX) * t;
      const jy = clippyBaseY + (introEnemyY - clippyBaseY) * t - Math.sin(t * Math.PI) * 180;
      drawClippyAt(c, jx, jy, 'jump', clippyAnimFrame);
    } else if (gameWindowPhase !== 'clippy_jump') {
      drawClippyAt(c, clippyBaseX, clippyBaseY, clippyAnim, clippyAnimFrame);
    }
    if (clippyDialogVisible) drawClippyDialogBox(c, clippyBaseX - 230, clippyBaseY - 100);
  }

  function drawIntroEnemy(c, x, y) {
    const t = Date.now() / 300;
    c.save(); c.translate(x, y);
    c.fillStyle = '#ffaa00'; c.fillRect(-16, -12, 32, 20);
    c.fillStyle = '#ff6600'; c.fillRect(-16, -12, 32, 5); c.fillRect(-3, -16, 6, 22);
    c.fillStyle = '#ff2200'; c.shadowColor = '#ff4400'; c.shadowBlur = 8 + Math.sin(t) * 4;
    for (let i = 0; i < 5; i++) { const a = t+(i/5)*Math.PI*2, r=22; c.fillRect(Math.cos(a)*r-2, Math.sin(a)*r-2, 4, 4); }
    c.restore();
  }

  // ================================================================
  // CLIPPY HELPERS
  // ================================================================
function drawClippyAt(c, x, y, anim, frame) {
  const W = 80, H = 80;
  let img = null;
  let flipX = false;

  if (anim === 'engineer') {
    img = imgs['clippyEngineer' + (frame + 1)] || imgs.clippyEngineer1;
  } else if (anim === 'notice') {
    img = frame === 0 ? imgs.clippyNotice1 : imgs.clippyNotice2;
  } else if (anim === 'normal') {
    img = [imgs.clippyNormal1, imgs.clippyNormal2, imgs.clippyNormal3][frame % 3];
  } else if (anim === 'watching') {
    // watching1 = upright, watching2 = upleft (mirrored to face right)
    img = frame === 0 ? imgs.clippyWatching1 : imgs.clippyWatching2;
    if (frame === 1) flipX = true;
  } else if (anim === 'bluescreen_idle') {
    img = frame === 0 ? imgs.clippyStressed1 : imgs.clippyStressed2;
  } else if (anim === 'jump') {
    img = frame === 0 ? imgs.clippyJump1 : imgs.clippyJump2;
    // jump1 (upright) needs to face left, jump2 (crouching) needs to face right
    if (frame === 0) flipX = true;
  } else {
    img = imgs.clippyNormal1;
  }

  if (img && img.complete && img.naturalWidth > 0) {
    c.save();
    c.translate(x, y);
    if (flipX) c.scale(-1, 1);
    c.drawImage(img, -W/2, -H/2, W, H);
    c.restore();
  } else {
    c.save(); c.translate(x, y);
    c.fillStyle = '#ffcc88'; c.beginPath(); c.arc(0, -10, 18, 0, Math.PI*2); c.fill();
    c.fillStyle = '#4488ff'; c.fillRect(-14, 6, 28, 20);
    c.restore();
  }
}

  function drawClippyDialogBox(c, bx, by) {
    const bw = 220, lh = 16;
    const lines = clippyDialogText.split('\n');
    const optionH = clippyDialogOptions.length * 22 + 10;
    const bh = lines.length * lh + optionH + 36;
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(bx+3, by+3, bw, bh);
    c.fillStyle = '#ffffcc'; c.fillRect(bx, by, bw, bh);
    c.strokeStyle = '#000000'; c.lineWidth = 1; c.strokeRect(bx, by, bw, bh);
    c.fillStyle = '#000000'; c.font = '11px "MS Sans Serif", Arial, sans-serif';
    lines.forEach((ln, i) => c.fillText(ln, bx+10, by+18+i*lh));
    const sepY = by + lines.length * lh + 22;
    c.strokeStyle = '#cccc88'; c.beginPath(); c.moveTo(bx+6, sepY); c.lineTo(bx+bw-6, sepY); c.stroke();
    clippyDialogOptions.forEach((opt, i) => {
      const sel = i === clippyDialogSelected;
      const ox = bx+10, oy = sepY+8+i*22;
      if (sel) { c.fillStyle = '#000080'; c.fillRect(ox-4, oy-13, bw-12, 18); c.fillStyle = '#ffffff'; }
      else c.fillStyle = '#000000';
      c.font = '11px "MS Sans Serif", Arial, sans-serif';
      c.fillText((sel ? '\u25ba ' : '  ') + opt, ox, oy);
    });
    c.font = '9px "MS Sans Serif", Arial, sans-serif'; c.fillStyle = '#888888';
    c.fillText('Arrow keys + Enter', bx+10, by+bh-6);
    const midY = by + bh/2;
    c.fillStyle = '#ffffcc'; c.strokeStyle = '#000000'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(bx+bw, midY-8); c.lineTo(bx+bw+12, midY); c.lineTo(bx+bw, midY+8); c.fill();
    c.beginPath(); c.moveTo(bx+bw, midY-8); c.lineTo(bx+bw+12, midY); c.lineTo(bx+bw, midY+8); c.stroke();
  }

  // ================================================================
  // DIFFICULTY
  // ================================================================
  function applyDifficulty(idx) { window._introDifficulty = idx; }

  function applyDifficultyToGs(gsRef) {
    const idx = window._introDifficulty !== undefined ? window._introDifficulty : 1;
    if (idx === 0) {
      gsRef.health = gsRef.maxHealth = 150; gsRef.maxAmmo = CFG.MAX_AMMO + 4; gsRef.ammo = gsRef.maxAmmo;
      gsRef._difficultyLabel = 'EASY'; gsRef._enemyHpMult = 0.7; gsRef._enemyDmgMult = 0.7;
    } else if (idx === 2) {
      gsRef.health = gsRef.maxHealth = 70; gsRef.maxAmmo = Math.max(4, CFG.MAX_AMMO - 2); gsRef.ammo = gsRef.maxAmmo;
      gsRef._difficultyLabel = 'HARD'; gsRef._enemyHpMult = 1.4; gsRef._enemyDmgMult = 1.4;
    } else {
      gsRef._difficultyLabel = 'NORMAL'; gsRef._enemyHpMult = 1.0; gsRef._enemyDmgMult = 1.0;
    }
  }

  // ================================================================
  // FINISH
  // ================================================================
  function finishIntro() {
    stage = 'DONE'; detachKeys(); detachDesktopClicks(); stopAllMusic();
    let alpha = 0;
    const fadeInterval = setInterval(() => {
      alpha += 0.05;
      if (alpha >= 1) {
        clearInterval(fadeInterval);
        if (overlayEl) { overlayEl.parentNode.removeChild(overlayEl); overlayEl = null; }
        if (onDone) onDone();
      } else {
        const c = getCtx();
        if (c) { c.fillStyle = `rgba(0,0,0,${alpha})`; c.fillRect(0,0,960,600); }
      }
    }, 30);
  }

  function start(callback) {
    onDone = callback;
    buildOverlay();
    setTimeout(() => startBIOS(), 200);
  }

  return { start, applyDifficultyToGs };
})();
