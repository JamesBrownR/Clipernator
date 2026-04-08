
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
  * Should replace the mask enemy with two pixel art sprites instead of the draw function if possinle... though not sure how I would do the crying or state change animation
  * the wave 11 boss fight is boring, party because the bullet it shoots do not go far enough. it is currently possible to dodge now but the boss still shoots too few bullets too slowly (UPDATE: Honestly the boss fight should be completely redesigned lol, not even sure what the current boss visual is supposed to be)

  * need to replace the scissors with a fork, knife, and spoon enemy (randomly chooses one to attack from, and it launches across the screen until it hits something then comes back and goes back to its idle animation of the three utencilts spinning around. the fork does no damage but grabs entities, the spoon knocks back entities and deals, the knife deals more damage (UPDATE: mostly works but the utensil enemy does not interact with other enemies, only the player, when it does hit a enemy the game crashes (2nd UPDATE: it usually works but sometimes crashes))
  * after the utensil enemy hits you, sometimes you become unable to move
  * When you throw the giftbox enemy at another enemy and it deals damage, it works fine. However if you throw it at a enemy and it kills that enemy, the game crashes (UPDATE: it usually works but sometimes crashes (Uncaught TypeError: Cannot read properties of undefined (reading 'type'))
  * The juggler enemy is a bit mindless, always chases the player instead of trying to keep distance. it should try and stay a certain distance away from the player, however if there is a ringmaster nearby it should go to it and circle around it to gain buffs
  * The ringmaster should not only make enemies faster, but it should increase their size and damage over time, until they reach a 'critial mass' and turn red - they are immune to explosives and all their attacks are explosive (and stop getting bigger). The buffs should also apply to enemies that  juggler is holding, if the juggler is getting the buffs.
  * if possible, there should be a animation of the stage getting bigger after you kill boss one, rather than a instant transition (UPDATE: This works but the note has not been removed since the game still pauses bullets briefly before continuing; it should be instant and have no pause)
  *  the wave scaling in floor two in kind of weird
Item stuff
  * Seemingly none of the floor 2 items currently work as expected. clownish works a bit better, but the nose does not visibly do a honking animation before shrinking back in size, the waves that fire are too fast and not thick enough. Mirror Maze works but when you shoot a shard it only lets one bullet be redirectic instead of all the bullets that hit the shard. how i want it to work is, for example you shoot a shard with 3 bullets, all three kill a enemy and create 3 more shards. Knocking Pins works but is too weak (like seriously, it needs to make  clippy 5x faster and do 10x or something the damage in bowling mode). Popcorn bucket does not feel very good to use but I will adress this more after the other items are fixed.
  * there needs be a pool of general items that can be offered on any floor, related to office/technology/retro stuff. Two ideas so far: Paper Cuts (any enemy that has been damaged takes 1 damage per second) and Extra Clips (you gain 25% max health and 25% ammo). To ensure this doesnt compete with the floor items too much there should only be 20% chance of one of these items showing up vs a 80% for floor-specific items (or upgrades to items you already have) (UPDATE: This works, but the note has not been removed because there should be at least 7 items from this pool)
  * SFP does not seem to stack with other damage modifiers
  * Extra clips does not seem to stack with other ammo modifiers. For example, you have gotten to 12 max ammo (most likely because of perfect baking) and you have extra clips, you only get 14 max ammo instead of 15. 25% of 10 is 2 and 25% of 12 is 3, so if it was stacking you should have 15 max ammo in this situation. the same thing probably is broken with the health, but this is harder to see without any other prominent health buffs (2nd UPDATE: This now works, but too well since it seems to be appling the buff twice. I had 14 max ammo from perfect baking and went up to 27. The thing is, I am kind of conflicted because I am considering if this could be a reasonable upgrade if the buff was reduced to 10% or something and the stacking was kept...) 
  *4 items should be shown on floor 2 (UPDATE: this works but since the grib has not been updated the four items go slightly outside the game space)
  * clownish and popcorn bucket will have upgrades when they are working correctly, the current upgrades are placeholders
  * what the hell is inferno rounds?
