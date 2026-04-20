// ============================================================
// CLIPBLAST: PARTY HUNTER — Intro Sequence
// ============================================================
// Stages:
//   BIOS → DIFFICULTY → ITEM_DRAFT → DESKTOP_LOAD →
//   DESKTOP → BLUESCREEN → TERMINAL → GAME_WINDOW → DONE
// ============================================================

const INTRO = (() => {

  // ── Asset paths ──
  const SND = {
    startup1: 'sounds/soundeffects/opening/startup1.mp3',
    startup2: 'sounds/soundeffects/opening/startup2.mp3',
    click:    'sounds/soundeffects/opening/click.mp3',
    bluescreen: 'sounds/soundeffects/opening/bluescreen.mp3',
    typing:   'sounds/soundeffects/opening/typing.mp3',
  };

  const SPR = {
    clippyNotice:   'sprites/clippy/Clippy_notice.png',
    clippyEngineer: 'sprites/clippy/Clippy_engineer.png',
    clippyJump:     'sprites/clippy/Clippy_jump.png',
    clippyNormal:   'sprites/Clippy.png',
    folder:         'sprites/ui/folder.png',
    appGeneric:     'sprites/ui/app_generic.png',
    dataLocked:     'sprites/ui/data_locked.png',
  };

  // ── Preload images ──
  const imgs = {};
  function loadImg(key, src) {
    imgs[key] = new Image();
    imgs[key].src = src;
  }
  Object.entries(SPR).forEach(([k, v]) => loadImg(k, v));

  // ── Audio ──
  const audioCache = {};
  function playSound(key, loop = false) {
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
    if (audioCache[key]) { audioCache[key].pause(); audioCache[key].currentTime = 0; }
  }

  // ── State ──
  let stage = 'BIOS';
  let onDone = null; // callback when intro finishes
  let container = null;
  let overlayEl = null;

  // shared
  let keyHandler = null;

  // BIOS state
  let biosLines = [];
  let biosLineIdx = 0;
  let biosCharIdx = 0;
  let biosTimer = 0;
  let biosPhase = 'typing'; // 'typing' | 'difficulty' | 'done'
  let difficultySelected = 0; // 0=Easy 1=Normal 2=Hard
  const BIOS_LINE_DELAY = 38;  // ms per char
  const BIOS_PAUSE_BETWEEN = 180; // ms between lines

  const BIOS_LINES = [
    { text: 'Award Modular BIOS v4.51PG, An Energy Star Ally', color: '#aaaaaa', delay: 0 },
    { text: 'Copyright (C) 1984-97, Award Software, Inc.', color: '#aaaaaa', delay: 0 },
    { text: '', color: '#aaaaaa', delay: 200 },
    { text: '(CLIPBLAST) Intel i430VX PCIset(TM)', color: '#aaaaaa', delay: 0 },
    { text: '', color: '#aaaaaa', delay: 120 },
    { text: 'PENTIUM-S CPU at 666MHz', color: '#00ff66', delay: 0 },
    { text: 'Memory Test :    65536K OK', color: '#00ff66', delay: 400 },
    { text: '', color: '#aaaaaa', delay: 200 },
    { text: 'Award Plug and Play BIOS Extension  v1.0A', color: '#aaaaaa', delay: 0 },
    { text: 'Copyright (C) 1997, Award Software, Inc.', color: '#aaaaaa', delay: 0 },
    { text: '    Detecting IDE Primary Master   ... PCemHD', color: '#aaaaaa', delay: 300 },
    { text: '    Detecting IDE Primary Slave    ... PCemCD', color: '#aaaaaa', delay: 200 },
    { text: '    Detecting IDE Secondary Master... None', color: '#aaaaaa', delay: 150 },
    { text: '    Detecting IDE Secondary Slave  ... None', color: '#aaaaaa', delay: 150 },
    { text: '', color: '#aaaaaa', delay: 200 },
    { text: 'WARNING: Unusual processes detected in memory.', color: '#ff4444', delay: 600 },
    { text: '         party.exe flagged: quarantine failed.', color: '#ff4444', delay: 0 },
    { text: '', color: '#aaaaaa', delay: 400 },
    { text: 'Press DEL to enter SETUP', color: '#aaaaaa', delay: 0 },
    { text: '12/10/97-i430VX,UMC8669-2A59GH2BC-00', color: '#555555', delay: 200 },
    { text: '', color: '#aaaaaa', delay: 300 },
    { text: '>>> SELECT DIFFICULTY <<<', color: '#ffdd00', delay: 400, isDifficultyPrompt: true },
  ];

  // ITEM DRAFT state
  let draftItems = [];
  let draftSelected = 0;
  let draftPhase = 'choosing'; // 'choosing' | 'done'

  // DESKTOP LOAD state
  let desktopLoadLines = [];
  let desktopLoadIdx = 0;
  let desktopLoadCharIdx = 0;
  let desktopLoadTimer = 0;
  let desktopLoadDone = false;
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

  // DESKTOP state
  let desktopPhase = 'idle'; // 'idle' | 'error' | 'loading_data' | 'bluescreen_transition'
  let desktopErrorMsg = '';
  let desktopErrorVisible = false;
  let desktopErrorApp = '';
  let desktopLoadingData = false;
  let desktopLoadDots = 0;
  let desktopLoadDotsTimer = 0;
  let desktopClickedData = false;

  const DESKTOP_APPS = [
    { id: 'mycomputer',   label: 'My Computer',    sprite: 'appGeneric', x: 24,  y: 30  },
    { id: 'recycle',      label: 'Recycle Bin',     sprite: 'appGeneric', x: 24,  y: 100 },
    { id: 'docs',         label: 'My Documents',    sprite: 'folder',     x: 24,  y: 170 },
    { id: 'notepad',      label: 'Notepad',         sprite: 'appGeneric', x: 24,  y: 240 },
    { id: 'internet',     label: 'Internet\nExplorer', sprite: 'appGeneric', x: 24, y: 310 },
    { id: 'data',         label: 'data.md',         sprite: 'dataLocked', x: 24,  y: 400 },
    { id: 'folder1',      label: 'Projects',        sprite: 'folder',     x: 110, y: 30  },
    { id: 'folder2',      label: 'Downloads',       sprite: 'folder',     x: 110, y: 100 },
    { id: 'minesweeper',  label: 'Minesweeper',     sprite: 'appGeneric', x: 110, y: 170 },
    { id: 'calculator',   label: 'Calculator',      sprite: 'appGeneric', x: 110, y: 240 },
  ];

  const ERROR_MESSAGES = {
    mycomputer:   'This operation has been blocked\nby an unknown process.\n\nError code: 0xC0000034',
    recycle:      'Access denied.\nThe Recycle Bin cannot be\naccessed at this time.',
    docs:         'My Documents is currently\nunavailable. A background process\nis restricting file access.',
    notepad:      'NOTEPAD.EXE failed to launch.\nA conflicting application\nis running in memory.',
    internet:     'Cannot connect. Winsock\ninitialization failed.\n\nError: 10061 - Connection refused.',
    folder1:      'This folder is empty.',
    folder2:      'This folder is empty.',
    minesweeper:  'WINMINE.EXE encountered a\nfatal error and must close.\n\nSorry for the inconvenience.',
    calculator:   'CALC.EXE cannot start because\nMSVCRT.DLL is missing or corrupt.',
  };

  // BLUESCREEN state
  let bluescreenTimer = 0;
  let clippyVisible = false;
  let clippyAnim = 'notice'; // 'notice' | 'engineer' | 'normal'
  let clippyAnimFrame = 0;
  let clippyAnimTimer = 0;
  let clippyDialogText = '';
  let clippyDialogOptions = [];
  let clippyDialogCallback = null;
  let clippyDialogSelected = 0;
  let clippyDialogVisible = false;
  let clippyBounceTimer = 0;
  let clippySlideY = 300; // slides in from bottom

  // TERMINAL state
  let termLines = [];
  let termCurrentLine = '';
  let termCharIdx = 0;
  let termLineTimer = 0;
  let termPhase = 0; // which line sequence we're on
  let termDone = false;
  let termCursor = true;
  let termCursorTimer = 0;

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

  // GAME_WINDOW state
  let gameWindowPhase = 'opening'; // 'opening' | 'enemy_spawn' | 'clippy_ask' | 'clippy_jump' | 'done'
  let gameWindowTimer = 0;
  let introEnemyId = null;
  let introEnemyX = 0;
  let introEnemyY = 0;
  let introEnemyVx = 0.4;
  let introEnemyVy = 0.3;
  let clippyJumpProgress = 0; // 0→1 during jump
  let clippyJumpStartX = 0;
  let clippyJumpStartY = 0;
  let clippyJumpTargetX = 0;
  let clippyJumpTargetY = 0;
  let gameWindowOpen = false;
  let gameWindowOpacity = 0;

  // ── Main canvas + overlay setup ──
  function buildOverlay() {
    overlayEl = document.createElement('div');
    overlayEl.id = 'intro-overlay';
    overlayEl.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      z-index: 9999; background: #000; overflow: hidden;
      font-family: 'Fixedsys', 'Courier New', monospace;
    `;
    document.body.appendChild(overlayEl);

    // Main canvas for drawn stages
    const c = document.createElement('canvas');
    c.id = 'intro-canvas';
    c.style.cssText = 'display:block; width:100%; height:100%;';
    c.width = 960;
    c.height = 600;
    overlayEl.appendChild(c);

    container = c;
  }

  function getCtx() { return container ? container.getContext('2d') : null; }

  // ── Keyboard input ──
  function attachKeys(handler) {
    detachKeys();
    keyHandler = handler;
    window.addEventListener('keydown', keyHandler);
  }
  function detachKeys() {
    if (keyHandler) { window.removeEventListener('keydown', keyHandler); keyHandler = null; }
  }

  // ── Click handlers for desktop ──
  let desktopClickHandler = null;
  function attachDesktopClicks() {
    desktopClickHandler = (e) => {
      const rect = container.getBoundingClientRect();
      const scaleX = container.width / rect.width;
      const scaleY = container.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top)  * scaleY;
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
    biosLineIdx = 0;
    biosCharIdx = 0;
    biosTimer = 0;
    biosPhase = 'typing';
    biosLines = [];
    playSound('startup1');

    let accumDelay = 0;
    BIOS_LINES.forEach((line, i) => {
      accumDelay += line.delay || 0;
      const d = accumDelay;
      setTimeout(() => {
        if (stage !== 'BIOS') return;
        if (line.isDifficultyPrompt) { biosPhase = 'difficulty'; }
        biosLines.push({ ...line, visible: true, typed: 0, fullLen: line.text.length });
      }, d + i * 60);
    });

    attachKeys((e) => {
      if (stage !== 'BIOS') return;
      if (biosPhase === 'difficulty') {
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          difficultySelected = (difficultySelected + 2) % 3;
          playSound('click');
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          difficultySelected = (difficultySelected + 1) % 3;
          playSound('click');
        } else if (e.key === 'Enter') {
          playSound('click');
          applyDifficulty(difficultySelected);
          biosPhase = 'done';
          setTimeout(() => startItemDraft(), 600);
        }
      }
    });

    requestAnimationFrame(biosLoop);
  }

  let _biosRAF = null;
  function biosLoop() {
    if (stage !== 'BIOS') return;
    drawBIOS();
    _biosRAF = requestAnimationFrame(biosLoop);
  }

  function drawBIOS() {
    const c = getCtx(); if (!c) return;
    c.fillStyle = '#000000';
    c.fillRect(0, 0, 960, 600);

    c.font = '13px "Fixedsys", "Courier New", monospace';
    const lineH = 18;
    let y = 30;

    biosLines.forEach(line => {
      if (!line.visible) return;
      if (line.isDifficultyPrompt) {
        // Draw difficulty selector
        c.fillStyle = '#ffdd00';
        c.fillText('>>> SELECT DIFFICULTY <<<', 40, y);
        y += lineH + 6;
        const opts = ['Easy', 'Normal', 'Hard'];
        opts.forEach((opt, i) => {
          const selected = i === difficultySelected && biosPhase === 'difficulty';
          c.fillStyle = selected ? '#000000' : '#888888';
          if (selected) {
            c.fillStyle = '#ffdd00';
            c.fillRect(40, y - 14, 120, 18);
            c.fillStyle = '#000000';
          }
          const prefix = selected ? '> ' : '  ';
          c.fillText(prefix + opt, 44, y);
          y += lineH;
        });
        if (biosPhase === 'difficulty') {
          c.fillStyle = '#555555';
          c.fillText('Use arrow keys to select, ENTER to confirm', 40, y + 8);
        }
        return;
      }
      c.fillStyle = line.color || '#aaaaaa';
      c.fillText(line.text, 40, y);
      y += lineH;
    });
  }

  // ================================================================
  // STAGE: ITEM DRAFT
  // ================================================================
  function startItemDraft() {
    stage = 'ITEM_DRAFT';
    detachKeys();
    draftSelected = 0;
    draftPhase = 'choosing';

    // Pick 3 random general items (or any non-floor-specific items)
    const pool = [...GENERAL_ITEM_IDS, ...ALL_ITEM_IDS.filter(id =>
      !['birthday','cookie'].includes(id)
    )];
    const shuffled = pool.sort(() => Math.random() - 0.5);
    draftItems = shuffled.slice(0, 3).map(id => ITEM_DEFS[id]);

    attachKeys((e) => {
      if (stage !== 'ITEM_DRAFT') return;
      if (draftPhase === 'choosing') {
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          draftSelected = (draftSelected + 2) % 3;
          playSound('click');
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          draftSelected = (draftSelected + 1) % 3;
          playSound('click');
        } else if (e.key === 'Enter') {
          playSound('click');
          draftPhase = 'done';
          const chosen = draftItems[draftSelected];
          gs.unlockedItems.push(chosen.id);
          chosen.effect(gs);
          setTimeout(() => startDesktopLoad(), 500);
        }
      }
    });

    requestAnimationFrame(draftLoop);
  }

  let _draftRAF = null;
  function draftLoop() {
    if (stage !== 'ITEM_DRAFT') return;
    drawDraft();
    _draftRAF = requestAnimationFrame(draftLoop);
  }

  function drawDraft() {
    const c = getCtx(); if (!c) return;
    c.fillStyle = '#000000';
    c.fillRect(0, 0, 960, 600);

    c.font = '13px "Fixedsys", "Courier New", monospace';
    c.fillStyle = '#00ff66';
    c.fillText('BIOS item cache detected. Select one to load into memory:', 40, 50);
    c.fillStyle = '#555555';
    c.fillText('(No description data available. Choose wisely)', 40, 72);

    const cardW = 200, cardH = 110, startX = 100, cardY = 140, gap = 60;

    draftItems.forEach((item, i) => {
      const x = startX + i * (cardW + gap);
      const selected = i === draftSelected && draftPhase === 'choosing';

      // Card background
      c.fillStyle = selected ? '#003300' : '#111111';
      c.fillRect(x, cardY, cardW, cardH);

      // Border
      c.strokeStyle = selected ? '#00ff66' : '#333333';
      c.lineWidth = selected ? 2 : 1;
      c.strokeRect(x, cardY, cardW, cardH);

      // Selection indicator
      if (selected) {
        c.fillStyle = '#00ff66';
        c.fillText('>', x - 18, cardY + 58);
      }

      // Item name only — no description
      c.fillStyle = selected ? '#00ff66' : '#888888';
      c.font = 'bold 13px "Fixedsys", "Courier New", monospace';
      const label = item.label.replace(/\n/g, ' ');
      const words = label.split(' ');
      let line1 = '', line2 = '';
      words.forEach(w => { if (c.measureText(line1 + w).width < cardW - 20) line1 += (line1 ? ' ' : '') + w; else line2 += (line2 ? ' ' : '') + w; });
      c.fillText(line1, x + 10, cardY + 50);
      if (line2) c.fillText(line2, x + 10, cardY + 68);

      c.font = '11px "Fixedsys", "Courier New", monospace';
      c.fillStyle = '#555555';
      c.fillText('[?????]', x + 10, cardY + 88);
    });

    c.font = '11px "Fixedsys", "Courier New", monospace';
    c.fillStyle = '#444444';
    c.fillText('Arrow keys: navigate   |   Enter: select', 320, 310);

    if (draftPhase === 'done') {
      c.fillStyle = '#00ff66';
      c.font = '14px "Fixedsys", "Courier New", monospace';
      c.fillText('Loading selected item... OK', 40, 380);
    }
  }

  // ================================================================
  // STAGE: DESKTOP LOAD (second boot screen)
  // ================================================================
  function startDesktopLoad() {
    stage = 'DESKTOP_LOAD';
    detachKeys();
    desktopLoadLines = [];
    desktopLoadIdx = 0;
    desktopLoadDone = false;
    playSound('startup2');

    let accumDelay = 800;
    DESKTOP_LOAD_LINES.forEach((line, i) => {
      accumDelay += (line.delay || 0) + 90;
      const d = accumDelay;
      setTimeout(() => {
        if (stage !== 'DESKTOP_LOAD') return;
        desktopLoadLines.push({ ...line, visible: true });
        if (i === DESKTOP_LOAD_LINES.length - 1) {
          setTimeout(() => transitionToDesktop(), 1200);
        }
      }, d);
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
    c.fillStyle = '#000000';
    c.fillRect(0, 0, 960, 600);
    c.font = '13px "Fixedsys", "Courier New", monospace';
    const lineH = 20;
    let y = 60;
    desktopLoadLines.forEach(line => {
      if (!line.visible) return;
      c.fillStyle = line.color || '#aaaaaa';
      c.fillText(line.text || '', 60, y);
      y += lineH;
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
    attachDesktopClicks();
    requestAnimationFrame(desktopLoop);
  }

  function desktopLoop() {
    if (stage !== 'DESKTOP') return;

    // Loading spinner for data.md
    if (desktopLoadingData) {
      desktopLoadDotsTimer++;
      if (desktopLoadDotsTimer > 20) {
        desktopLoadDotsTimer = 0;
        desktopLoadDots = (desktopLoadDots + 1) % 4;
      }
    }

    drawDesktop();
    requestAnimationFrame(desktopLoop);
  }

  function handleDesktopClick(mx, my) {
    if (desktopPhase === 'loading_data') return;

    // Close error dialog
    if (desktopErrorVisible) {
      // OK button area (centered bottom of error box)
      const bx = 480 - 90, by = 300 - 130;
      const okX = bx + 70, okY = by + 175;
      if (mx > okX && mx < okX + 60 && my > okY && my < okY + 22) {
        desktopErrorVisible = false;
        playSound('click');
      }
      return;
    }

    // Icon hit test (48x64 per icon)
    const IW = 48, IH = 64;
    for (const app of DESKTOP_APPS) {
      // Scale: canvas is 960x600, icons at pixel coords
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
    desktopLoadDots = 0;
    desktopLoadDotsTimer = 0;

    // After 2 seconds → bluescreen
    setTimeout(() => {
      desktopLoadingData = false;
      playSound('bluescreen');
      startBluescreen();
    }, 2200);
  }

  function drawDesktop() {
    const c = getCtx(); if (!c) return;
    const W = 960, H = 600;

    // Teal desktop background
    c.fillStyle = '#008080';
    c.fillRect(0, 0, W, H);

    // Subtle scanline texture
    for (let y = 0; y < H; y += 2) {
      c.fillStyle = 'rgba(0,0,0,0.04)';
      c.fillRect(0, y, W, 1);
    }

    // Desktop icons
    DESKTOP_APPS.forEach(app => {
      const { x, y, label, sprite } = app;
      const IW = 48, IH = 48;

      // Icon image
      const img = imgs[sprite];
      if (img && img.complete && img.naturalWidth > 0) {
        c.drawImage(img, x, y, IW, IH);
      } else {
        // Fallback placeholder
        c.fillStyle = sprite === 'dataLocked' ? '#cc4400' :
                      sprite === 'folder'     ? '#ffcc44' : '#aaaacc';
        c.fillRect(x, y, IW, IH);
        c.strokeStyle = '#000'; c.lineWidth = 1;
        c.strokeRect(x, y, IW, IH);
        // Fallback label icon
        c.fillStyle = '#000';
        c.font = 'bold 9px "MS Sans Serif", Arial, sans-serif';
        c.textAlign = 'center';
        const short = sprite === 'dataLocked' ? '🔒' :
                      sprite === 'folder'     ? '📁' : '📄';
        c.fillText(short, x + IW/2, y + IH/2 + 4);
        c.textAlign = 'left';
      }

      // Label
      c.font = '11px "MS Sans Serif", Arial, sans-serif';
      c.textAlign = 'center';
      const lines = label.split('\n');
      lines.forEach((ln, li) => {
        // Text shadow
        c.fillStyle = 'rgba(0,0,0,0.7)';
        c.fillText(ln, x + IW/2 + 1, y + IH + 14 + li * 13 + 1);
        c.fillStyle = '#ffffff';
        c.fillText(ln, x + IW/2, y + IH + 14 + li * 13);
      });
      c.textAlign = 'left';
    });

    // Loading cursor over data.md
    if (desktopLoadingData) {
      const dots = '.'.repeat(desktopLoadDots);
      c.font = '13px "Fixedsys", monospace';
      c.fillStyle = '#ffdd00';
      c.fillText('Opening' + dots, 24, 490);
      // Spinning cursor indicator
      const t = Date.now() / 200;
      const frames = ['|', '/', '—', '\\'];
      c.fillText(frames[Math.floor(t) % 4], 110, 490);
    }

    // Error dialog
    if (desktopErrorVisible) {
      drawErrorDialog(c, desktopErrorApp, desktopErrorMsg);
    }

    // Taskbar
    drawTaskbar(c, W, H);
  }

  function drawErrorDialog(c, title, msg) {
    const W = 960;
    const bw = 340, bh = 200;
    const bx = W/2 - bw/2, by = 300 - bh/2;

    // Shadow
    c.fillStyle = 'rgba(0,0,0,0.4)';
    c.fillRect(bx+4, by+4, bw, bh);

    // Dialog body
    c.fillStyle = '#d4d0c8';
    c.fillRect(bx, by, bw, bh);

    // Win2k border
    c.strokeStyle = '#ffffff'; c.lineWidth = 2;
    c.strokeRect(bx, by, bw, bh);
    c.strokeStyle = '#404040'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(bx+bw-1, by+1); c.lineTo(bx+bw-1, by+bh-1); c.lineTo(bx+1, by+bh-1); c.stroke();

    // Titlebar
    const grad = c.createLinearGradient(bx, by, bx+bw, by);
    grad.addColorStop(0, '#0a246a'); grad.addColorStop(1, '#3a6ea8');
    c.fillStyle = grad;
    c.fillRect(bx+2, by+2, bw-4, 18);
    c.fillStyle = '#ffffff';
    c.font = 'bold 11px "MS Sans Serif", Arial, sans-serif';
    c.fillText('⚠  ' + title, bx + 8, by + 14);

    // Close button in titlebar
    c.fillStyle = '#d4d0c8';
    c.fillRect(bx+bw-20, by+4, 14, 13);
    c.strokeStyle = '#808080'; c.lineWidth = 1;
    c.strokeRect(bx+bw-20, by+4, 14, 13);
    c.fillStyle = '#000'; c.font = '11px "Marlett", Arial';
    c.fillText('r', bx+bw-17, by+14);

    // Error icon + message
    c.fillStyle = '#ff0000';
    c.font = 'bold 26px serif';
    c.fillText('✕', bx + 18, by + 64);

    c.fillStyle = '#000000';
    c.font = '11px "MS Sans Serif", Arial, sans-serif';
    const msgLines = msg.split('\n');
    msgLines.forEach((ln, i) => c.fillText(ln, bx + 54, by + 48 + i * 16));

    // Horizontal separator
    c.strokeStyle = '#808080'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(bx+6, by+bh-38); c.lineTo(bx+bw-6, by+bh-38); c.stroke();
    c.strokeStyle = '#ffffff';
    c.beginPath(); c.moveTo(bx+6, by+bh-37); c.lineTo(bx+bw-6, by+bh-37); c.stroke();

    // OK button
    const okX = bx + bw/2 - 30, okY = by + bh - 30;
    c.fillStyle = '#d4d0c8';
    c.fillRect(okX, okY, 60, 22);
    c.strokeStyle = '#ffffff'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(okX, okY+22); c.lineTo(okX, okY); c.lineTo(okX+60, okY); c.stroke();
    c.strokeStyle = '#404040';
    c.beginPath(); c.moveTo(okX+60, okY); c.lineTo(okX+60, okY+22); c.lineTo(okX, okY+22); c.stroke();
    c.fillStyle = '#000';
    c.font = '11px "MS Sans Serif", Arial, sans-serif';
    c.textAlign = 'center';
    c.fillText('OK', okX+30, okY+14);
    c.textAlign = 'left';
  }

  function drawTaskbar(c, W, H) {
    // Taskbar
    c.fillStyle = '#c0c0c0';
    c.fillRect(0, H-28, W, 28);
    c.strokeStyle = '#ffffff'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(0, H-28); c.lineTo(W, H-28); c.stroke();

    // Start button
    c.fillStyle = '#d4d0c8';
    c.fillRect(2, H-26, 54, 24);
    c.strokeStyle = '#ffffff';
    c.beginPath(); c.moveTo(2, H-2); c.lineTo(2, H-26); c.lineTo(56, H-26); c.stroke();
    c.strokeStyle = '#808080';
    c.beginPath(); c.moveTo(56, H-26); c.lineTo(56, H-2); c.lineTo(2, H-2); c.stroke();
    c.fillStyle = '#000';
    c.font = 'bold 11px "MS Sans Serif", Arial, sans-serif';
    c.fillText('Start', 10, H-10);

    // Clock
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    c.fillStyle = '#d4d0c8';
    c.fillRect(W-68, H-26, 66, 24);
    c.fillStyle = '#000';
    c.font = '11px "MS Sans Serif", Arial, sans-serif';
    c.textAlign = 'right';
    c.fillText(timeStr, W-6, H-10);
    c.textAlign = 'left';
  }

  // ================================================================
  // STAGE: BLUESCREEN
  // ================================================================
  function startBluescreen() {
    stage = 'BLUESCREEN';
    detachDesktopClicks();
    bluescreenTimer = 0;
    clippyVisible = false;
    clippySlideY = 300;
    clippyDialogVisible = false;
    clippyAnim = 'notice';

    // After 3 seconds, Clippy slides in
    setTimeout(() => {
      clippyVisible = true;
      clippyAnim = 'notice';
      setTimeout(() => showClippyDialog(
        "It looks like you're having\ntechnical difficulties!\nWould you like help?",
        ['Yes, please!', 'No thanks'],
        (choice) => {
          if (choice === 0) {
            startTerminal();
          } else {
            // Stay on bluescreen forever — soft lock as a joke
            showClippyDialog("Are you sure? Things look\npretty bad...", ['OK fine, help me', 'I am fine'],
              (c2) => { if (c2 === 0) startTerminal(); }
            );
          }
        }
      ), 800);
    }, 3000);

    attachKeys((e) => {
      if (stage !== 'BLUESCREEN') return;
      if (!clippyDialogVisible) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        clippyDialogSelected = (clippyDialogSelected + clippyDialogOptions.length - 1) % clippyDialogOptions.length;
        playSound('click');
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        clippyDialogSelected = (clippyDialogSelected + 1) % clippyDialogOptions.length;
        playSound('click');
      } else if (e.key === 'Enter') {
        playSound('click');
        const cb = clippyDialogCallback;
        const sel = clippyDialogSelected;
        clippyDialogVisible = false;
        if (cb) cb(sel);
      }
    });

    requestAnimationFrame(bluescreenLoop);
  }

  function showClippyDialog(text, options, callback) {
    clippyDialogText = text;
    clippyDialogOptions = options;
    clippyDialogCallback = callback;
    clippyDialogSelected = 0;
    clippyDialogVisible = true;
  }

  function bluescreenLoop() {
    if (stage !== 'BLUESCREEN') return;
    bluescreenTimer++;

    // Clippy slides up
    if (clippyVisible && clippySlideY > 0) {
      clippySlideY = Math.max(0, clippySlideY - 12);
    }

    clippyAnimTimer++;
    if (clippyAnimTimer > 12) { clippyAnimTimer = 0; clippyAnimFrame = (clippyAnimFrame + 1) % 4; }

    drawBluescreen();
    requestAnimationFrame(bluescreenLoop);
  }

  function drawBluescreen() {
    const c = getCtx(); if (!c) return;
    const W = 960, H = 600;

    c.fillStyle = '#0000aa';
    c.fillRect(0, 0, W, H);

    c.fillStyle = '#ffffff';
    c.font = '14px "Fixedsys", "Courier New", monospace';
    const bsLines = [
      '*** STOP: 0x0000007B (0xF641F84C,0xC0000034,0x00000000,0x00000000)',
      'INACCESSIBLE_BOOT_DEVICE',
      '',
      'If this is the first time you\'ve seen this Stop error screen,',
      'restart your computer. If this screen appears again, follow',
      'these steps:',
      '',
      'Check for viruses on your computer. Remove party.exe if found.',
      'Check your hard drive configuration and restart.',
      '',
      'Run CHKDSK /F to check for hard drive corruption, and then',
      'restart your computer.',
      '',
      'Refer to your Getting Started manual for more information on',
      'troubleshooting Stop errors.',
    ];
    bsLines.forEach((ln, i) => {
      c.fillText(ln, 40, 60 + i * 22);
    });

    // Clippy
    if (clippyVisible) {
      const cx = W - 140;
      const cy = H - 180 + clippySlideY;
      drawClippyAt(c, cx, cy, clippyAnim, clippyAnimFrame);

      if (clippyDialogVisible) {
        drawClippyDialogBox(c, cx - 200, cy - 60);
      }
    }
  }

  // ================================================================
  // STAGE: TERMINAL
  // ================================================================
  function startTerminal() {
    stage = 'TERMINAL';
    detachKeys();
    termLines = [];
    termPhase = 0;
    termDone = false;
    clippyAnim = 'engineer';
    clippySlideY = 0;

    attachKeys((e) => {
      if (stage !== 'TERMINAL') return;
      if (!clippyDialogVisible) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        clippyDialogSelected = (clippyDialogSelected + clippyDialogOptions.length - 1) % clippyDialogOptions.length;
        playSound('click');
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        clippyDialogSelected = (clippyDialogSelected + 1) % clippyDialogOptions.length;
        playSound('click');
      } else if (e.key === 'Enter') {
        playSound('click');
        const cb = clippyDialogCallback;
        const sel = clippyDialogSelected;
        clippyDialogVisible = false;
        if (cb) cb(sel);
      }
    });

    runTerminalSequence(0);
    requestAnimationFrame(terminalLoop);
  }

  function runTerminalSequence(idx) {
    if (idx >= TERM_SEQUENCE.length) { termDone = true; return; }
    const step = TERM_SEQUENCE[idx];

    if (step.type === 'clippy_ask') {
      setTimeout(() => {
        showClippyDialog(step.text, ['Yes, open it', 'No'],
          (choice) => {
            if (choice === 0) {
              // Type "open party.exe"
              termLines.push({ text: 'C:\\Users\\clippy> open party.exe', color: '#00ff66', isInput: true });
              setTimeout(() => startGameWindow(), 1200);
            } else {
              termLines.push({ text: 'Operation cancelled.', color: '#ff4444' });
              setTimeout(() => runTerminalSequence(idx + 1), 500);
            }
          }
        );
      }, step.delay || 0);
      return;
    }

    const lineDelay = step.delay !== undefined ? step.delay : 0;
    const typeDelay = step.type === 'input' ? (step.text.length * 55 + 200) : 0;

    setTimeout(() => {
      if (step.type === 'prompt') {
        termLines.push({ text: 'C:\\Users\\clippy> ', color: '#00ff66', isPrompt: true });
      } else if (step.type === 'input') {
        // Typewriter for input lines
        typeTermLine(step.text, '#ffffff', () => {
          setTimeout(() => runTerminalSequence(idx + 1), 200);
        });
        return;
      } else if (step.type === 'output') {
        termLines.push({ text: step.text, color: step.color || '#00ff66' });
      }
      setTimeout(() => runTerminalSequence(idx + 1), 80);
    }, lineDelay);
  }

  let _termTypeTimeout = null;
  function typeTermLine(text, color, onDone) {
    let i = 0;
    const lineObj = { text: '', color, isTyping: true };
    termLines.push(lineObj);
    function typeChar() {
      if (i >= text.length) { lineObj.isTyping = false; if (onDone) onDone(); return; }
      lineObj.text += text[i++];
      _termTypeTimeout = setTimeout(typeChar, 45);
    }
    typeChar();
  }

  function terminalLoop() {
    if (stage !== 'TERMINAL') return;
    termCursorTimer++;
    if (termCursorTimer > 25) { termCursorTimer = 0; termCursor = !termCursor; }
    clippyAnimTimer++;
    if (clippyAnimTimer > 14) { clippyAnimTimer = 0; clippyAnimFrame = (clippyAnimFrame + 1) % 4; }
    drawTerminal();
    requestAnimationFrame(terminalLoop);
  }

  function drawTerminal() {
    const c = getCtx(); if (!c) return;
    const W = 960, H = 600;

    c.fillStyle = '#0a0a0a';
    c.fillRect(0, 0, W, H);

    // Terminal text
    c.font = '13px "Fixedsys", "Courier New", monospace';
    const lineH = 18;
    const maxLines = Math.floor((H - 80) / lineH);
    const visibleLines = termLines.slice(-maxLines);
    visibleLines.forEach((ln, i) => {
      c.fillStyle = ln.color || '#00ff66';
      const txt = ln.text + (ln.isTyping && termCursor ? '█' : '');
      c.fillText(txt, 20, 40 + i * lineH);
    });

    // Prompt cursor at end if last line isn't typing
    if (termLines.length > 0 && !termLines[termLines.length-1].isTyping && !clippyDialogVisible) {
      const lastY = 40 + (Math.min(termLines.length, maxLines) - 1) * lineH;
      if (termCursor) { c.fillStyle = '#00ff66'; c.fillText('█', 20 + c.measureText(termLines[termLines.length-1].text).width, lastY); }
    }

    // Clippy on right side
    const cx = W - 130;
    const cy = H - 160;
    drawClippyAt(c, cx, cy, clippyAnim, clippyAnimFrame);

    if (clippyDialogVisible) {
      drawClippyDialogBox(c, cx - 220, cy - 80);
    }
  }

  // ================================================================
  // STAGE: GAME_WINDOW
  // ================================================================
  function startGameWindow() {
    stage = 'GAME_WINDOW';
    gameWindowPhase = 'opening';
    gameWindowTimer = 0;
    gameWindowOpacity = 0;
    clippyAnim = 'normal';
    clippyDialogVisible = false;

    // Spawn a single intro enemy in the center
    introEnemyX = 480;
    introEnemyY = 300;
    introEnemyVx = 0.6;
    introEnemyVy = 0.4;
    clippyJumpProgress = -1;

    attachKeys((e) => {
      if (stage !== 'GAME_WINDOW') return;
      if (!clippyDialogVisible) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        clippyDialogSelected = (clippyDialogSelected + clippyDialogOptions.length - 1) % clippyDialogOptions.length;
        playSound('click');
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        clippyDialogSelected = (clippyDialogSelected + 1) % clippyDialogOptions.length;
        playSound('click');
      } else if (e.key === 'Enter') {
        playSound('click');
        const cb = clippyDialogCallback;
        const sel = clippyDialogSelected;
        clippyDialogVisible = false;
        if (cb) cb(sel);
      }
    });

    requestAnimationFrame(gameWindowLoop);
  }

  function gameWindowLoop() {
    if (stage !== 'GAME_WINDOW') return;
    gameWindowTimer++;

    // Fade in
    if (gameWindowOpacity < 1) gameWindowOpacity = Math.min(1, gameWindowOpacity + 0.04);

    // Enemy wanders slightly
    if (gameWindowPhase === 'enemy_spawn' || gameWindowPhase === 'clippy_ask') {
      introEnemyX += introEnemyVx;
      introEnemyY += introEnemyVy;
      const GWX = 200, GWY = 80, GWW = 560, GWH = 380;
      if (introEnemyX < GWX + 30 || introEnemyX > GWX + GWW - 30) introEnemyVx *= -1;
      if (introEnemyY < GWY + 50 || introEnemyY > GWY + GWH - 30) introEnemyVy *= -1;
    }

    // If yes was pressed, move enemy to center then jump
    if (gameWindowPhase === 'clippy_jump') {
      // Move enemy toward center
      const cx = 480, cy = 270;
      introEnemyX += (cx - introEnemyX) * 0.08;
      introEnemyY += (cy - introEnemyY) * 0.08;

      clippyJumpProgress += 0.04;
      if (clippyJumpProgress > 1) {
        // Clippy landed — kill enemy, start game
        gameWindowPhase = 'done';
        setTimeout(() => finishIntro(), 800);
      }
    }

    clippyAnimTimer++;
    if (clippyAnimTimer > 12) { clippyAnimTimer = 0; clippyAnimFrame = (clippyAnimFrame + 1) % 4; }

    // Phase transitions
    if (gameWindowPhase === 'opening' && gameWindowTimer === 80) {
      gameWindowPhase = 'enemy_spawn';
    }
    if (gameWindowPhase === 'enemy_spawn' && gameWindowTimer === 160) {
      gameWindowPhase = 'clippy_ask';
      showClippyDialog(
        "It looks like viruses are\ndefending the data file.\nIt is dangerous to fight\nthem alone. Want my help?",
        ['Yes!', 'I got this'],
        (choice) => {
          if (choice === 0) {
            clippyAnim = 'jump';
            clippyJumpProgress = 0;
            clippyJumpStartX = 860;
            clippyJumpStartY = 420;
            clippyJumpTargetX = introEnemyX;
            clippyJumpTargetY = introEnemyY;
            gameWindowPhase = 'clippy_jump';
          } else {
            finishIntro();
          }
        }
      );
    }

    drawGameWindow();
    requestAnimationFrame(gameWindowLoop);
  }

  function drawGameWindow() {
    const c = getCtx(); if (!c) return;
    const W = 960, H = 600;

    // Desktop background
    c.globalAlpha = gameWindowOpacity;
    c.fillStyle = '#008080';
    c.fillRect(0, 0, W, H);
    c.globalAlpha = 1;

    // Taskbar
    drawTaskbar(c, W, H);

    // Game window
    const GWX = 200, GWY = 80, GWW = 560, GWH = 380;
    if (gameWindowOpacity > 0) {
      c.globalAlpha = gameWindowOpacity;

      // Window shadow
      c.fillStyle = 'rgba(0,0,0,0.35)';
      c.fillRect(GWX+5, GWY+5, GWW, GWH);

      // Window body
      c.fillStyle = '#000000';
      c.fillRect(GWX, GWY, GWW, GWH);

      // Win2k border
      c.fillStyle = '#d4d0c8';
      c.fillRect(GWX, GWY, GWW, 22); // titlebar area bg
      const tgrad = c.createLinearGradient(GWX, GWY, GWX+GWW, GWY);
      tgrad.addColorStop(0, '#0a246a'); tgrad.addColorStop(1, '#3a6ea8');
      c.fillStyle = tgrad;
      c.fillRect(GWX+2, GWY+2, GWW-4, 18);
      c.fillStyle = '#ffffff';
      c.font = 'bold 11px "MS Sans Serif", Arial, sans-serif';
      c.fillText('party.exe', GWX+8, GWY+14);

      // Window close/min/max buttons
      ['r','1','0'].forEach((glyph, bi) => {
        const bx = GWX + GWW - 20 - bi*18;
        c.fillStyle = '#d4d0c8';
        c.fillRect(bx, GWY+4, 14, 13);
        c.strokeStyle = '#808080'; c.lineWidth = 1;
        c.strokeRect(bx, GWY+4, 14, 13);
        c.fillStyle = '#000';
        c.font = '10px "Marlett", Arial';
        c.fillText(glyph, bx+2, GWY+14);
      });

      // Game area (black canvas look)
      c.fillStyle = '#0a0a0f';
      c.fillRect(GWX+2, GWY+22, GWW-4, GWH-24);

      // Grid lines
      c.strokeStyle = 'rgba(0,255,100,0.03)';
      c.lineWidth = 1;
      for (let gx = GWX+2; gx < GWX+GWW-2; gx += 40) { c.beginPath(); c.moveTo(gx, GWY+22); c.lineTo(gx, GWY+GWH-2); c.stroke(); }
      for (let gy = GWY+22; gy < GWY+GWH-2; gy += 40) { c.beginPath(); c.moveTo(GWX+2, gy); c.lineTo(GWX+GWW-2, gy); c.stroke(); }

      // Draw intro enemy (simple gift box shape)
      if (gameWindowPhase !== 'done' && clippyJumpProgress < 0.9) {
        drawIntroEnemy(c, introEnemyX, introEnemyY);
      }

      // Kill flash when Clippy lands
      if (gameWindowPhase === 'done') {
        const flashAlpha = Math.max(0, 1 - (gameWindowTimer - 0) * 0.05);
        c.fillStyle = `rgba(255,220,0,${flashAlpha})`;
        c.fillRect(GWX+2, GWY+22, GWW-4, GWH-24);
        // Particles
        for (let pi = 0; pi < 12; pi++) {
          const pa = (pi/12)*Math.PI*2 + gameWindowTimer*0.1;
          const pr = 20 + pi * 3;
          c.fillStyle = ['#ff69b4','#ffdd00','#00ff66','#ff4444'][pi%4];
          c.fillRect(introEnemyX + Math.cos(pa)*pr - 3, introEnemyY + Math.sin(pa)*pr - 3, 6, 6);
        }
      }

      c.globalAlpha = 1;
    }

    // Clippy — bottom right of desktop, or jumping
    const clippyBaseX = W - 130;
    const clippyBaseY = H - 170;

    if (gameWindowPhase === 'clippy_jump' && clippyJumpProgress >= 0 && clippyJumpProgress <= 1) {
      // Arc trajectory
      const t = clippyJumpProgress;
      const arcH = 180;
      const jx = clippyJumpStartX + (clippyJumpTargetX - clippyJumpStartX) * t;
      const jy = clippyJumpStartY + (clippyJumpTargetY - clippyJumpStartY) * t - Math.sin(t * Math.PI) * arcH;
      drawClippyAt(c, jx, jy, 'jump', clippyAnimFrame);
    } else if (gameWindowPhase !== 'clippy_jump') {
      drawClippyAt(c, clippyBaseX, clippyBaseY, clippyAnim, clippyAnimFrame);
    }

    if (clippyDialogVisible) {
      drawClippyDialogBox(c, clippyBaseX - 230, clippyBaseY - 100);
    }
  }

  function drawIntroEnemy(c, x, y) {
    // Simple gift box enemy placeholder
    const t = Date.now() / 300;
    c.save();
    c.translate(x, y);
    c.fillStyle = '#ffaa00';
    c.fillRect(-16, -12, 32, 20);
    c.fillStyle = '#ff6600';
    c.fillRect(-16, -12, 32, 5);
    c.fillRect(-3, -16, 6, 22);
    c.fillStyle = '#ff2200';
    c.shadowColor = '#ff4400';
    c.shadowBlur = 8 + Math.sin(t) * 4;
    for (let i = 0; i < 5; i++) {
      const a = t + (i/5)*Math.PI*2, r = 22;
      c.fillRect(Math.cos(a)*r-2, Math.sin(a)*r-2, 4, 4);
    }
    c.restore();
  }

  // ================================================================
  // CLIPPY DRAWING HELPERS
  // ================================================================
  function drawClippyAt(c, x, y, anim, frame) {
    const W = 80, H = 80;
    let img = null;

    if (anim === 'notice')   img = imgs.clippyNotice;
    else if (anim === 'engineer') img = imgs.clippyEngineer;
    else if (anim === 'jump')     img = imgs.clippyJump;
    else                          img = imgs.clippyNormal;

    const sheetCols = 4;

    if (img && img.complete && img.naturalWidth > 0) {
      // If it's a sprite sheet (wider than tall), animate frames
      const isSheet = img.naturalWidth > img.naturalHeight * 1.5;
      if (isSheet) {
        const fw = img.naturalWidth / sheetCols;
        const fh = img.naturalHeight;
        const col = frame % sheetCols;
        c.drawImage(img, col * fw, 0, fw, fh, x - W/2, y - H/2, W, H);
      } else {
        // Single sprite (e.g. normal Clippy.png)
        // Remove black BG (handled by playerCanvas in game — draw normally here)
        c.drawImage(img, x - W/2, y - H/2, W, H);
      }
    } else {
      // Fallback: draw a simple Clippy-ish shape
      c.save();
      c.translate(x, y);
      // Body
      c.fillStyle = '#ffcc88';
      c.beginPath(); c.arc(0, -10, 18, 0, Math.PI*2); c.fill();
      c.fillStyle = '#4488ff';
      c.fillRect(-14, 6, 28, 20);
      // Eyes
      c.fillStyle = '#000';
      c.beginPath(); c.arc(-6, -14, 2.5, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(6, -14, 2.5, 0, Math.PI*2); c.fill();
      if (anim === 'engineer') {
        // Hard hat
        c.fillStyle = '#ffdd00';
        c.fillRect(-18, -30, 36, 8);
        c.fillRect(-12, -38, 24, 12);
      }
      // Bounce bob
      c.restore();
    }
  }

  function drawClippyDialogBox(c, bx, by) {
    const bw = 220, lh = 16;
    const lines = clippyDialogText.split('\n');
    const optionH = clippyDialogOptions.length * 22 + 10;
    const bh = lines.length * lh + optionH + 36;

    // Shadow
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.fillRect(bx+3, by+3, bw, bh);

    // Box
    c.fillStyle = '#ffffcc';
    c.fillRect(bx, by, bw, bh);
    c.strokeStyle = '#000000'; c.lineWidth = 1;
    c.strokeRect(bx, by, bw, bh);

    // Text
    c.fillStyle = '#000000';
    c.font = '11px "MS Sans Serif", Arial, sans-serif';
    lines.forEach((ln, i) => c.fillText(ln, bx+10, by+18+i*lh));

    // Separator
    const sepY = by + lines.length * lh + 22;
    c.strokeStyle = '#cccc88'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(bx+6, sepY); c.lineTo(bx+bw-6, sepY); c.stroke();

    // Options
    clippyDialogOptions.forEach((opt, i) => {
      const selected = i === clippyDialogSelected;
      const ox = bx + 10, oy = sepY + 8 + i * 22;
      if (selected) {
        c.fillStyle = '#000080';
        c.fillRect(ox-4, oy-13, bw-12, 18);
        c.fillStyle = '#ffffff';
      } else {
        c.fillStyle = '#000000';
      }
      c.font = '11px "MS Sans Serif", Arial, sans-serif';
      c.fillText((selected ? '► ' : '  ') + opt, ox, oy);
    });

    c.font = '9px "MS Sans Serif", Arial, sans-serif';
    c.fillStyle = '#888888';
    c.fillText('Arrow keys + Enter', bx+10, by+bh-6);

    // Tail pointing right toward Clippy
    c.fillStyle = '#ffffcc';
    c.strokeStyle = '#000000'; c.lineWidth = 1;
    const midY = by + bh/2;
    c.beginPath();
    c.moveTo(bx+bw, midY-8);
    c.lineTo(bx+bw+12, midY);
    c.lineTo(bx+bw, midY+8);
    c.fill();
    c.beginPath();
    c.moveTo(bx+bw, midY-8);
    c.lineTo(bx+bw+12, midY);
    c.lineTo(bx+bw, midY+8);
    c.stroke();
  }

  // ================================================================
  // DIFFICULTY APPLICATION
  // ================================================================
  function applyDifficulty(idx) {
    if (!window.gs) return; // gs not ready yet — will be applied at init
    window._introDifficulty = idx;
  }

  // Called from initGameState after gs is created
  function applyDifficultyToGs(gsRef) {
    const idx = window._introDifficulty !== undefined ? window._introDifficulty : 1;
    if (idx === 0) {
      // Easy
      gsRef.health = gsRef.maxHealth = 150;
      gsRef.maxAmmo = CFG.MAX_AMMO + 4;
      gsRef.ammo = gsRef.maxAmmo;
      gsRef._difficultyLabel = 'EASY';
      gsRef._enemyHpMult = 0.7;
      gsRef._enemyDmgMult = 0.7;
    } else if (idx === 2) {
      // Hard
      gsRef.health = gsRef.maxHealth = 70;
      gsRef.maxAmmo = Math.max(4, CFG.MAX_AMMO - 2);
      gsRef.ammo = gsRef.maxAmmo;
      gsRef._difficultyLabel = 'HARD';
      gsRef._enemyHpMult = 1.4;
      gsRef._enemyDmgMult = 1.4;
    } else {
      // Normal
      gsRef._difficultyLabel = 'NORMAL';
      gsRef._enemyHpMult = 1.0;
      gsRef._enemyDmgMult = 1.0;
    }
  }

  // ================================================================
  // FINISH
  // ================================================================
  function finishIntro() {
    stage = 'DONE';
    detachKeys();
    detachDesktopClicks();

    // Fade out
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

  // ================================================================
  // PUBLIC API
  // ================================================================
  function start(callback) {
    onDone = callback;
    buildOverlay();
    // Small delay so page is ready
    setTimeout(() => startBIOS(), 200);
  }

  return { start, applyDifficultyToGs };
})();
