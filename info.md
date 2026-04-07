
- "Entities" usually referes to both the player and enemies, but can also refer to bosses or projectiles.
- Goal is to make floor 1&2 as good as possible before adding more

Item Rules: 

1) items can be permanent or temporary
2) items can affect the player, enemies, environment, or a combination really
3) items can have only positive, or both negative and positive effects, but not only negative effects (negative effects on enemies are considered positive effects)
4) items can affect each other, in fact that is kind of the point 
5) the name of an item must be related to its effect, even if loosely

Changes (I need to make a lot of changes, not sure where to start):

  * make dash damage scale with player speed, if it doesn't already
  * make melee damage scale with bullet damage
  * make melee (glowsticks) do more base damage
  * make glowsticks be able to reflect projectiles, anything that is reflected should also become an explosive (so it explodes on impact). to be clear, reflected projectiles should not explode instantly, but should become explosive such that it detonated when it collides with something after the glowstick reflected it. It should also pause the game few a few frames like hitflash (Update, this seems to be implimented but this note has not been removed because it seems that hitflash is incorrectly activated when a reflected entity hits something, instead of it being activated when you reflect something.)
  * floor 2 should have 15 levels before the boss (so wave 25)

  
Make enemies more interactive overall:
  * The enemy that wiggles and balances on a sphere while juggling 6-10 balls above it. I would like a mechanic where it can pick up other enemies and juggle them also, while they can attack as they are being juggegled, and if close enough to the player it throws the enemy at them. If it throws a cannonball enemy it immedietly goes into its dashing mode toward the player. It would also be funny to see it juggiling enemies that are also juggiling balls as they collectively throw balls toward the player
  * the glowsicks should be able to reflect cannonball enemies as they charge toward the player, making them charge in the direction the player hit them
  * The bullets on all the enemies need to be slowed down by like half, they are too fast to dodge generally
  * Should replace the mask enemy with two pixel art sprites instead of the draw function... though not sure how I would do the crying or state change animation
  * need to replace the scissors with a fork, knife, and spoon enemy (randomly chooses one to attack from, and it launches across the screen until it hits something then comes back and goes back to its idle animation of the three utencilts spinning around. the fork does no damage but grabs entities, the spoon knocks back entities and deals, the knife deals more damage
  * When you throw the giftbox enemy at another enemy and it deals damage, it works fine. However if you throw it at a enemy and it kills that enemy, the game crashes
  * the pause menu should have a way of changing keybinds, if possible
  * the item displays on the pause menu are too big, and kind of dumb. There item slots should be smaller, it should only show the item description on hover, and it should not be capitalized or so short that it barely communicated information, for example
  * if possible, there should be a animation of the stage getting bigger after you kill boss one, rather than a instant transition.

Item stuff
  * clownish, mirror maze, funhouse distortion and possibly other floor 2 items don't work (UPDATE: Seemingly none of the floor 2 items currently work as expected. Clownish makes enemies chase each other but does not make them attack or deal damage to each other, and theya re not colored blue to indicated they are distracted. There are also supposed be two "sound" waves visually emanating from the clown's nose when clownish is activated to make it clear to see; the clown nose is also too big visually. Mirror Maze doesn't work at all, it is supposed to reflect bullets from an enemy you shoot and kill to the nearest enemy, and obviously the bullet's lifetime timer should reset on every kill. Funhouse distortion doesn't work; it is supposed to curve bullets slightly toward enemies. Popcorn bucket does not feel very good to use but I will adress this more after the other items are fixed)
  * When enemy bullets touch walls and you have bouncy house, they should become "your" bullets, not staying enemy bullets
  * there needs be a pool of general items that can be offered on any floor, related to office/technology/retro stuff. Two ideas so far: Paper Cuts (any enemy that has been damaged takes 1 damage per second) and Extra Clips (you gain 25% max health and 25% ammo). To ensure this doesnt compete with the floor items too much there should only be 20% chance of one of these items showing up vs a 80% for floor specific items (or upgrades to items you already have) (UPDATE: This works, but the note has not been removed because there should be at least 7 items from this pool)
  * clownish and popcorn bucket will have upgrades
  
