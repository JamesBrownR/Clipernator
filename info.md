
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

 
  * make glowsticks be able to reflect projectiles, anything that is reflected should also become an explosive (so it explodes on impact). to be clear, reflected projectiles should not explode instantly, but should become explosive such that it detonated when it collides with something after the glowstick reflected it. It should also pause the game few a few frames like hitflash (UPDATE: this seems to be implemented, but this note has not been removed because it seems that hitflash is incorrectly activated when a reflected entity hits something, instead of it being activated when you reflect something. also, when you reflect a projectile the glowstick cooldown should instantly be set to zero)
 

  
Make enemies more interactive overall:
  * cannonball enemies should always be able to be reflected, even when thye arent charging
  * cannonball enemies charging speed should be lowered by 20%

  
 
  * WHen the player reflects juggler thrown balls they become normal straight projectiles. make is so when a player reflected a projectiled it inherents the same projectile type. FOr example when a player reflects a lobbed projectile it should lob back as their own projectile whereever the cursor currently is


  * if possible, there should be a animation of the stage getting bigger after you kill boss one, rather than a instant transition (UPDATE: This works but the note has not been removed since the game still pauses bullets briefly before continuing; it should be instant and have no pause)
  *  the wave scaling in floor two in kind of weird (11 is very slow everyone after is very fast)
  
Item stuff
  * Seemingly none of the floor 2 items currently work as expected. clownish works a bit better, but the nose does not visibly do a honking animation before shrinking back in size, the waves that fire are too fast and not thick enough. Mirror Maze : when you shoot a shard it only lets one bullet be redirectic instead of all the bullets that hit the shard. how i want it to work is, for example you shoot a shard with 3 bullets, all three kill a enemy and create 3 more shards. Knocking Pins works but is too weak (like seriously, it needs to make  clippy 5x faster and do 10x or something the damage in bowling mode). Popcorn bucket does not feel very good, feels kinda useless to use but I will adress this more after the other items are fixed (UPDATE:  Mirror Maze works sometimes, but other times when you shoot a shard and it kills a enemy it doesnt spawn another shard. It should spawn a shard on every enemy it kills and there should be no limit to the amount of shards that can spawn, if there is one. Also redirected bullets should be 10x faster so they can't miss).
  * there needs be a pool of general items that can be offered on any floor, related to office/technology/retro stuff. Two ideas so far: Paper Cuts (any enemy that has been damaged takes 1 damage per second) and Extra Clips (you gain 25% max health and 25% ammo). To ensure this doesnt compete with the floor items too much there should only be 20% chance of one of these items showing up vs a 80% for floor-specific items (or upgrades to items you already have) (UPDATE: This works, but the note has not been removed because there should be at least 7 items from this pool)
  
  * clownish and popcorn bucket will have upgrades when they are working correctly, the current upgrades are placeholders
  * why does clownish spawn a bunch of confetti around the playerw
  * what the hell is inferno rounds?
