
- "Entities" usually refers to both the player and enemies, but can also refer to bosses or projectiles.
- Goal is to make floor 1&2 as good as possible before adding more

Item Rules: 

1) items can be permanent or temporary
2) items can affect the player, enemies, environment, or a combination really
3) items can have only positive, or both negative and positive effects, but not only negative effects (negative effects on enemies are considered positive effects)
4) items can affect each other, in fact that is kind of the point 
5) the name of an item should be related to its effect, even if loosely

Changes (I need to make a lot of changes, not sure where to start):

 
  * make glowsticks be able to reflect projectiles, anything that is reflected should also become an explosive (so it explodes on impact). to be clear, reflected projectiles should not explode instantly, but should become explosive such that it detonated when it collides with something after the glowstick reflected it. It should also pause the game few a few frames like hitflash (UPDATE: this seems to be implemented, but this note has not been removed because it seems that hitflash is incorrectly activated when a reflected entity hits something, instead of it being activated when you reflect something.)
  * floor 2 should have 15 levels before the boss (so wave 25)
  * the wave 11 boss fight is boring, party because the bullet it shoots do not go far enough. The main reason though is it shoots too many bullets at once so it is currently impossible to dodge them by moving in between them, making your only option tanking or staying as far as possible
  * The pause menu, by defualt, shows you having 1x damage and 3.2 speed. it should be standardized to either show your damage and speed multiple or damage and speed amount

  
Make enemies more interactive overall:
  * The enemy that wiggles and balances on a sphere while juggling balls above it. I would like a mechanic where it can pick up other enemies and juggle them also, while they can attack as they are being juggegled, and if close enough to the player it throws the enemy at them. If it throws a cannonball enemy it immedietly goes into its dashing mode toward the player. It would also be funny to see it juggiling enemies that are also juggiling balls as they collectively throw balls toward the player (UPDATE: this kind of works but it seems lie when a juggler picks up a enemy and you kill the juggler the enemy it picked up justs stops working. Also the juggler should instantly shoot the enemies it is holding, prioritizing them over regular bullets (regular bullets shoot too slowly, though this is more general)
  * The bullets on all the enemies need to be slowed down by like half, they are too fast to dodge generally
  * Should replace the mask enemy with two pixel art sprites instead of the draw function if possinle... though not sure how I would do the crying or state change animation
  * need to replace the scissors with a fork, knife, and spoon enemy (randomly chooses one to attack from, and it launches across the screen until it hits something then comes back and goes back to its idle animation of the three utencilts spinning around. the fork does no damage but grabs entities, the spoon knocks back entities and deals, the knife deals more damage (UPDATE: mostly works but the utensil enemy does not interact with other enemies, only the player. also the spoon does not seem to knock the player back, at least not noticably)
  * When you throw the giftbox enemy at another enemy and it deals damage, it works fine. However if you throw it at a enemy and it kills that enemy, the game crashes
  * if possible, there should be a animation of the stage getting bigger after you kill boss one, rather than a instant transition (UPDATE: This works but the note has not been removed since the game still pauses briefly before continuing; it should be instant and have no pause)

Item stuff
  * Seemingly none of the floor 2 items currently work as expected. Clownish makes enemies chase each other and attack or deal damage to each other. But it is realy janky, inconsistent and hard to tell what is happening. There are also supposed be two "sound" waves visually emanating from the clown's nose on clippy when clownish is activated. These are supposed to be what confuse enemies; in others all enemies that touch one of the waves become confused. the clown nose is also slightly too big and does not visually honk when activated. Mirror Maze works incorrectly. It is supposed to redirect all bullets that hit an enemy to the nearest enemy, currently it seems to only do it with one bulet. Rolling Pins does not seem to reduct the contact damage the player takes by 90%, and it does not make clippy do any damage when bowing toward enemies. Popcorn bucket does not feel very good to use but I will adress this more after the other items are fixed)
  * there needs be a pool of general items that can be offered on any floor, related to office/technology/retro stuff. Two ideas so far: Paper Cuts (any enemy that has been damaged takes 1 damage per second) and Extra Clips (you gain 25% max health and 25% ammo). To ensure this doesnt compete with the floor items too much there should only be 20% chance of one of these items showing up vs a 80% for floor specific items (or upgrades to items you already have) (UPDATE: This works, but the note has not been removed because there should be at least 7 items from this pool)
  * Floor 2 should offer 4 items instead of 3
  * SFP does not seem to stack with other damage modifiers
  * Extra clips does not seem to stack with other ammo modifiers. For example, you have gotten to 12 max ammo (most likely because of perfect baking) and you have extra clips, you only get 14 max ammo instead of 15. 25% of 10 is 2 and 25% of 12 is 3, so if it was stacking you should have 15 max ammo in this situation. the same thing probably is broken with the health, but this is harder to see without any other prominent health buffs
  * clownish and popcorn bucket will have upgrades when they are working correctly, the current upgrades are placeholders
  
