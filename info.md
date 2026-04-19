# CLIPERNATOR — Design Reference

## General Notes
- "Entities" usually refers to both the player and enemies, but can also refer to bosses or projectiles
- Goal is to make floor 1 & 2 as good as possible before adding more floors
- When suggesting changes, tell me what part of the code to add or change, do not remake entire files unless necessary
- Sometimes game states are modified for play testing. I'm not playing 30 minutes until wave 19 to see if mirror maze is reflectable with bowling balls.

- want MS Sans Serif to be used for most of the UI, and for fixedsys to be used in a few specific areas, like how microsoft did it: MS Sans Serif was a bitmap, proportional UI font used for Windows interface text in early Windows versions, and Microsoft Sans Serif later replaced it as the TrueType successor distributed with Windows 2000 and later. In practice, this family was used for dialog boxes, labels, and general interface text rather than code-like text areas. Fixedsys was a bitmap, monospaced font originally used as the system font in Windows 1.0 and 2.0, and later it remained the default font in Notepad through the Windows 9x/ME era. It was mainly associated with old-style text display and legacy editor use rather than general GUI text.
- When you press the minimize button the game just closes and becomes a tiny tab in the middle of the screen. this is funny and should be kept.

---

## Item Rules
1. Items can be permanent or temporary
2. Items can affect the player, enemies, environment, or a combination
3. Items can have only positive effects, or both positive and negative effects (never only negative)
4. Items can and should interact with each other
5. Item names should be at least loosely related to their effect

---

## Problems, somewhat ordered by importance 


* replace all cake boss, items, bosses, etc with cartoon style
* replace ui with windows 2000 style
* unsure which style items should have

 
  
* the cake boss should not mindlessly go to the center all the time. it should just hover around the stage as a idle animation
* i dont know if cutscenes are possible in html, but if so  I would like a animation of the cake boss falling from the sky
* there should be a slightl delay between when the boss is defeated and when the stage expands. it should also expand slower
* clippy should probably have a animation, rather than just being a single sprite

- General item pool needs at least 5 more items
- Clownish is still a bit iffy. wave radius should be expanded slightly. confused enemies should do 3x damage to other enemies (both from contact damage and bullets). confused enemies currently still dont do contact damage. cannonballs that are confused dont charge at enemies and explode. all enemeies when confused should attack other enenmies
- Water Balloon enemies should shoot projectiles from slightly outside themselves, their bullets should not spawn on their hitbox
- reflected cannon balls should not stop the charge until they hit something. current if you are at one side of that stage and reflect a cannonball to another, it stops before it explodes on a wall
- cannon ball charge speed should be reduced by 20%
- Clownish upgrade is placeholder
- im not sure tightrope boots actually works

- floor 2 boss doesnt work at all, and will be completely redesigned after floor one is finished
  


## Item Pools

### Floor 1 Items (ALL_ITEM_IDS)
- **Birthday Party** 🎂 — all enemies lose movement for 3 seconds. Temporary, field pickup, 
- **Golden Cookie** 🍪 — 7x speed + 7x reload speed for 7 seconds. Temporary, field pickup
- **Double Layered Cake** 🍰🍰 — every bullet: 40% dud, 60% 2x damage. Permanent
- **Triple Layered Cake** 🍰🍰🍰 — every bullet: 45% dud, 55% 3x damage. Replaces Double. Permanent
- **Quadruple Layered Cake** 🍰🍰🍰🍰 — every bullet: 50% dud, 50% 4x damage. Replaces Triple. Permanent
- **Bouncy House** 🏠 — bullets, enemies, and player all bounce off walls. Permanent
- **Party Popper** 🎉 (Dash) — SHIFT to dash, damages enemies on contact, 3 charges. Permanent
- **Shake Fizzle Pop** 🥤 — meter fills over time; while full: +speed +damage; on hit: shockwave burst and meter resets. Permanent
- **Flawless Baking** 🧁 — complete a wave without taking damage: +2 max ammo. Permanent
- **Cursed Candles** 🕯️ — 5 candles orbit player, drain 5 HP/sec, each lit candle adds +2 bullets/shot. Candles relight over time. Permanent

### Floor 2 Items (FLOOR2_ITEM_IDS)
- **Mirror Maze** 🪞 — one shard orbits player; shoot the shard to redirect bullets toward nearest enemy or shard; kills spawn new shards. Permanent
- **Popcorn Bucket** 🍿 — enemies drop kernels on death; collect 5 for a 4-second bullet explosion frenzy. Permanent
- **Raging Rings** 💫 — player bullets that touch the player begin orbiting at 3x damage, max 16 rings; Permanent
- **Bowling Balls** 🎳 — Pierces enemies, damages each one it passes through (no b.life = 0 on hit)
   - Explodes on expiry/too many bounces
   - Reflectable by glowstick (already handled since tickMeleeWindow iterates gs.bullets — just needs to not skip isBowlingBall)
   - Mirror shard hit → redirected ball + spawn second ball toward nearest enemy
   - Grey preview circle at gun tip while queued
   - Always uses full cake multiplier, never dud
   
- **Tightrope Boots** 👢 — +200% move speed. Permanent
- **Clownish** 🔵 — a nose grows over time; when fully grown and near an enemy it honks, emitting two expanding sound waves that confuse all enemies they pass through. Permanent

### General Items (any floor, ~20% chance, GENERAL_ITEM_IDS)
- **Paper Cuts** 📄 — any enemy that has taken damage loses 1 HP per second until dead. Permanent
- **Extra Clips** 📎 — +15% max HP and +15% max ammo, full heal on pickup. Stacks. Permanent
- *(needs at least 5 more items in this pool — office/technology/retro theme)*



---

## Glowsticks / Melee
- Right-click or F to activate
- everything reflected is explosive
- Activates an instant hitbox box in front of the player for `MELEE_ACTIVE_FRAMES` frames
- Zero delay between button press and hitbox being live
- Reflects enemy bullets and raging ring bullets toward the player's cursor as explosive shots
- Cannonball enemies can be redirected by glowstick at any time (not just while charging)
- **No cooldown on successful reflect** — cooldown only applies on miss
- Brief game freeze (explosionFreezeTimer) on successful reflect
- Melee also damages enemies in front for baseDamage * 3

---

## Enemy Behaviors

### Floor 1
- **Utensil** (fork/knife/spoon) — body drifts toward player; orbiting utensil launches at player on a timer; knife bleeds, spoon knocks back, fork grabs and slows
- **Water Balloon** — moves around randomly and fires gravity-affected bullets at the player
- **Gift Box** — slow wind-up explosion on proximity; player can grab and throw it
- **Party Hat** — fast, periodically speed-dives at player
- **Cake Boss** (wave 11) — multi-phase: candle shots, spin bounce, frosting arc balls; loses a candle per HP threshold; at 1 candle enters permanent spiral

### Floor 2


- **Cannonball** — telegraphs then charges across arena; can be reflected by glowstick at any time into an explosion
- **Ringmaster** — flees player, buffs nearby enemies (speed, size, damage, HP); enemies in aura long enough reach Critical Mass (immune to explosives, 3x damage, explode on contact)
- **Juggler** — captures nearby enemies and juggles them; throws arc balls and captured enemies at player; orbits ringmaster if one is nearby
- Clown car - drives around and throws clowns
- Clowns - chases enemies, gives them extra speed when on them
- **Boss 2** (wave 26) — spiral, summon, and volley phases; phase 2 at 50% HP

---

