
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
  * make glowsticks be able to reflect projectiles
  * the player sprite looks horrible for some reason
  
Make enemies more interactive overall:
  * The enemy that wiggles and balances on a sphere while juggling 6-10 balls above it. I would like a mechanic where it can pick up other enemies and juggle them also, while they can attack as they are being juggegled, and if close enough to the player it throws the enemy at them. If it throws a cannonball enemy it immedietly goes into its dashing mode toward the player. It would also be funny to see it juggiling enemies that are also juggiling balls as they collectively throw balls toward the player
  * the glowsicks should be able to reflect cannonball enemies as they charge toward the player, and they should explode on impact when this happens
  * the clown enemies on floor one should be replaced with something birthday related
  * The bullets on all the enemies need to be slowed down by like half, they are too fast to dodge generally
  * Should replace the mask enemy with two pixel art sprites instead of the draw function... though not sure how I would do the crying or state change animation
  * need to replace the scissors with a fork, knife, and spoon enemy (randomly chooses one to attack from, and it launches across the screen until it hits something then comes back and goes back to its idle animation of the three utencilts spinning around. the fork does no damage but grabs entities, the spoon knocks back entities and deals, the knife deals more damage
  * also need to change the gift box enemy to slowly wind up when the player is near it, until it explodes and deals damage to all entities around it (if possible the player should also be able to right click to pick it up and throw it, and when they are holding it it still winds up so they have to throw it fast)

Item stuff
  * clownish, mirror maze, funhouse distortion and possibly other floor 2 items don't work
  * there needs be a pool of general items that can be offered on any floor, related to office/technology stuff. Two ideas so far: Paper Cuts (any enemy that has been damaged takes 1 damage per second) and Extra Clips (you gain 25% max health and 25% ammo). To ensure this doesnt compete with the floor items too much there should only be 20% chance of one of these items showing up vs a 80% for floor specific items (or upgrades to items you already have)
  * clownish and popcorn bucket will have upgrades
