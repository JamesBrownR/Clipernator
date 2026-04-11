
- "Entities" usually refers to both the player and enemies, but can also refer to bosses or projectiles.
- Goal is to make floor 1&2 as good as possible before adding more
- When suggesting changes, tell me what part of the code to add or change, do not remake entire files unless neccessary

Item Rules: 

1) items can be permanent or temporary
2) items can affect the player, enemies, environment, or a combination really
3) items can have only positive, or both negative and positive effects, but not only negative effects (negative effects on enemies are considered positive effects)
4) items can affect each other, in fact that is kind of the point 
5) the name of an item should be related to its effect, even if loosely

Changes (I need to make a lot of changes, not sure where to start):

 

  * Glowstick functionality should be reworked. Rightnow it seems the hitbox is a line that slowly moves from one side to the other. I would like it to function more like a box in front of the player, and when you use glowsicks it activates the box in front of the play, when it is on cooldown it is inactive. This should mean that the delay between the player pressing the glowsticks button and a projectile in front of them getting reflected is zero. aside from the functionality I would also like to change the animation from being a swing to one side from the other to being a sort of double slash animation that happens in front of the player. Beyond that,I would like he glowsticks to pause the game for a few frames when you reflect something (not when a reflected object hits something), make all reflected projectiles go to the players cursor, and set the glowstick cooldown to zero if a player successfully reflects something (make there be a cooldown only if the player misses). (UPDATE: this works and note will be removed soon)
 

  
Make enemies more interactive overall:
  * cannonball enemies should always be able to be reflected, even when thye arent charging. If you reflect a cannon ball enemy while it is not charging, it should charge in the direction you reflect it, moving somewhere until it explodes
  * cannonball enemies charging speed should be lowered by 20%

  
 



  * if possible, there should be a animation of the stage getting bigger after you kill boss one, rather than a instant transition (UPDATE: This works but the note has not been removed since the game still pauses bullets briefly before continuing; it should be instant and have no pause)
  *  the wave scaling in floor two in kind of weird (11 is very slow everyone after is very fast)
  
Item stuff
* clownish works but the waves it shoots goes too far. Knocking Pins works but is too slow, even when i increase "CFG.PLAYER_SPEED * #" it doesnt go any faster. Popcorn bucket does not feel very good, feels kinda useless to use. 
  * there needs be a pool of general items that can be offered on any floor, related to office/technology/retro stuff. Two ideas so far: Paper Cuts (any enemy that has been damaged takes 1 damage per second) and Extra Clips (you gain 25% max health and 25% ammo). To ensure this doesnt compete with the floor items too much there should only be 20% chance of one of these items showing up vs a 80% for floor-specific items (or upgrades to items you already have) (UPDATE: This works, but the note has not been removed because there should be at least 7 items from this pool)
  
  * clownish and popcorn bucket will have upgrades when they are working correctly, the current upgrades are placeholders
  * why does clownish spawn a bunch of confetti around the playerw
  * what the hell is inferno rounds?
