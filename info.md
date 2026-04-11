# CLIPBLAST: PARTY HUNTER — Design Reference

## General Notes
- "Entities" usually refers to both the player and enemies, but can also refer to bosses or projectiles
- Goal is to make floor 1 & 2 as good as possible before adding more floors
- When suggesting changes, tell me what part of the code to add or change, do not remake entire files unless necessary

---

## Item Rules
1. Items can be permanent or temporary
2. Items can affect the player, enemies, environment, or a combination
3. Items can have only positive effects, or both positive and negative effects — never only negative
4. Items can and should interact with each other
5. Item names should be loosely related to their effect

---

## Known Issues / TODO
- Floor 2 wave scaling is off: wave 11 feels slow, then enemies spike suddenly after
- Clownish sound waves travel too far
- Knocking Pins feels too slow regardless of speed multiplier
- Popcorn Bucket feels weak / low impact
- General item pool needs at least 5 more items
- Clownish and Popcorn Bucket upgrades are placeholders until base items feel good
- what the hell is Inferno Rounds?
- Stage expansion after boss 1 death causes a brief bullet pause that should be seamless

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
- **Raging Rings** 💫 — player bullets that touch the player begin orbiting at 3x damage, max 8 rings; glowstick can fling them toward cursor as explosive shots. Permanent
- **Knocking Pins** 🎳 — temporarily auto-charges player toward nearest enemy; player becomes the bowling ball. Temporary, field pickup
- **Tightrope Boots** 👢 — +100% move speed, dashing makes player intangible. Permanent
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
- **Mask** — alternates between SMILE (chases) and CRY (stops, fires spread of gravity-affected tear bullets)
- **Gift Box** — slow wind-up explosion on proximity; player can grab and throw it
- **Party Hat** — fast, periodically speed-dives at player
- **Cake Boss** (wave 11) — multi-phase: candle shots, spin bounce, frosting arc balls; loses a candle per HP threshold; at 1 candle enters permanent spiral

### Floor 2
- **Birthday Bomber** — charges at player when close
- **Piñata** — tanky, leaks particles at low HP
- **Balloon Witch** — orbits player at distance, fires homing bullets
- **Streamer Ghost** — phases out every few seconds, teleports near player
- **Cannonball** — telegraphs then charges across arena; can be reflected by glowstick at any time into an explosion
- **Ringmaster** — flees player, buffs nearby enemies (speed, size, damage, HP); enemies in aura long enough reach Critical Mass (immune to explosives, 3x damage, explode on contact)
- **Juggler** — captures nearby enemies and juggles them; throws arc balls and captured enemies at player; orbits ringmaster if one is nearby
- **Boss 2** (wave 26) — spiral, summon, and volley phases; phase 2 at 50% HP

---

