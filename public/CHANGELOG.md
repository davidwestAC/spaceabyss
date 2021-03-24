## [0.2.40] - 2021-03-24


### Added
- System message when salvaging fails, and links to the tutorial via the help button about it.
- Purple Algae, Purple Juice


### Changed
- Removed test.html (https://github.com/Luke100000/spaceabyss/commit/771717961cf0d06209018bbc93465824689c933a)
- Admin ability to spawn events now can go past the planet/galaxy limit.


### Fixed
- Bug with admins spawning events in the galaxy
- Ability to pick up object types from the galaxy
- Display issue with broken giants not disappearing once fully salvaged
- Object types associated with a spawned event will now give that coord a spawned event id
- Vueg player body will now idle after movement like the other bodies
- Monsters not being harvestable
- 

### Notes For Developers
- I'm still playing catchup on improvements from Luke100000. I'm hoping to have caught up to the current commit with the next update (probably coming next week)
- 4 Database changes in 0.2.40
- alter table space_abyss_dev.coords ADD spawned_event_id int default 0;
- alter table space_abyss_dev.planet_coords ADD spawned_event_id int default 0;
- alter table space_abyss_dev.ship_coords ADD spawned_event_id int default 0;
- alter table space_abyss_dev.players CHANGE freeze_skill_points freezing_skill_points int default 1;

## [0.2.39] - 2021-03-22


### Fixed
- Issue with not exporting monster.getCoordIndex
- Issue with picking objects up from the galaxy not removing them from the coord (hotfixed in 0.2.38 on 3/19/2020)
- Issue with monsters having an outdated ship coord index


### Changed
- Asteroid city spawn from 2 to 1 at a time
- Diamond Asteroids from Asteroid Cities are now more rare
- Players are now soft deleted initially, instead of fully deleted. Need to expand on this system (will add in the user that deleted it, 
reasoning, and require email verification to fully delete)


## [0.2.38] - 2021-03-18

### Added
- Vueg player body
- Space Debris (Food, Power, and Tech versions)
- Ability to pick up things in space
- Ability to salvage object types

### Fixed
- Bug where the display on a galaxy coord wouldn't update when the object type on the coord changed.
- Bug with objects spawning monsters
- Did a pretty good bugpass on the game_object file. Lots of misc small fixes.
- Dying from poison while logged off. There is still the potential to for this to impact an old body if it was 'gifted' to you after you died. 
It's fixed for all new bodies.

### Changed
- Cleaned up usages of game_object.getCoordAndRoom

## [0.2.37] - 2021-03-08


### Added
- The game now stores when you login. I'm thinking about using this to potentially greet new players when they first login.
- Premium skin for the player pod. Currently it will only show for you - I just have to think properly about how to expand the skin system so it will 
show for others too, and possibly allow more flexibility.

### Fixed
- Had another typo causing moving on stairs in ships to error (hotfixed in 0.2.36)
- Error with market timestamps
- Bug with receiving damage without a damage type

### Changed
- Data Guards are now weak to hacking and drop power cells and ai fragments
- First set of server performance improvements using indexes instead of coord lookups on players, objects, and monsters
- Small update to Data Breach
- Small update to Zuran Cruiser Wreck
- Crystal Spiders no longer drop Crystals. Replaced with Silk.
- Crystal Guard drops Diamonds instead of Crystal
- Cherree's now drop Life Water
- Blossomtis now drop Life Water

## [0.2.36] - 2021-03-02

### Fixed
- Deleted the ~1000 asteroids created and not put anywhere by the asteroid cities


### Changed
- Almost more like a fix, but the coords that are checked when a player is trying to launch from a planet are much more exhaustive. Players and ships should 
get stuck less often/virtually never
- Made the same change above for launching from another ship as well
- Image for Shipyard and Large Shipyard have been updated



## [0.2.35] - 2021-02-27

### Added
- Ability to more directly report an issue with a ship, body, or item through the website (previously the only way this could be done was via Discord)
- A loose mesage integration into the client of Space Abyss
- BlueArray, BlueWare, AlphaBlue monsters. 


### Fixed
- Fire floor walk speed
- Blossomtis sprite disappearing for a bit every animation loop
- Heat Lance not doing any damage
- Asteroid cities, and potentially others objects, were spawning things that couldn't be placed


### Changed
- Updated Cherroy Blossom Floor sprites

## [0.2.34] - 2021-02-25

### Added
- Large Shipyard. Previously there could be issues if someone was building a multi tile ship in a single tile shipyard
- Heat Lance
- A couple of nebulae to add to the galaxy environment. Visual only, but they give it some spice! (I'll have to fly around space and add them)


### Fixed
- A bug with switching ships introduced in the last version (typo!)


### Changed
- Multi tile ships can no longer be built in a normal shipyard
- Updated Sprite for Hack Dust
- Updated Sprite for Power Cell

## [0.2.33] - 2021-02-23

### Added
- The start of a messaging system. Player name locations in several areas of the client are now clickable, and lead to the profile page of the player. 
You can then send them a message if you want to
- Descriptions for players
- A player's faction is linked to on their player page now

### Fixed
- Now preventing logging into the same character from multiple places at the same time
- Some storyteller text

### Changed
- Performance Improvements on the server for inserting objects
- The way we protect against xss and other attacks in things like desriptions. 
- Updated game login page to look a bit more custom
- Tested database backups
- I have the backbone for a very significant server performance update in place. I'll be watching the logs to see if things are good to push in the next version.

## [0.2.32] - 2021-02-08

### Added
- Site Rules
- Email notifications when an AI is under siege (50% energy or less. More options for players to fine tune this will come in the future)
- Life Tea
- Images for Blossomtis, Cherree, Converted Mechanoid, and Forest Prince
- Derelict Mining Outpost
- Asteroid City


### Fixed
- Image and being able to pick up Corrupted Battery Packs
- Renaming a planet galaxy events not having the planet id attached to them


### Changed
- DDrone normal spawn has been replaced with a Mini Walker on machine planets ( the point is to add some variety to the color/look of the creatures on level -3 and -4)
- Expanded Data Breach
- LOTS of balancing and additions to consumables. Really did spend a lot of time on this. Previously consumables were added based on feel - now there's a basic system 
behind them to try to balance most things out. There will still be exceptions for variety/lore/world building purposes.
- Expanded The Great Nomad

## [0.2.31] - 2021-01-22


### Added
- Admin ability to kick a player off
- Users can now be banned

### Fixed
- Algae King's attack now works
- You can now repair broken ship walls
- Many bugs with Vending Machines


### Changed
- Repairing ships is now 10x less expensive

## [0.2.30] - 2021-01-20

### Fixed
- Bug where an item could be placed in multiple spots at the same time via pick up, and hence the same item could be equipped in multiple slots
- Issue where typing a faction name was almost impossible due to the box refreshing and erasing your typing

## [0.2.29] - 2021-01-20

### Added
- Beginnings of a system for banning users
- Admin ability to clear a coord of something

### Fixed
- Destroyers (and other 2x2 tile ships) now have spot where they can undock from the sun (hotfixed in 0.2.28)
- Take menu in Chrome displaying odd
- Bug with AI not advancing their defense on planets properly


### Changed
- Login is now asynchronous, and removed a bunch of really bad old code related to logging in.

## [0.2.28] - 2021-01-19


### Added
- Take 100 button
- You can hold shift to keep the take/buy menu open
- Personal player logs when you are killed by something ( you can see these on your player's profile )
- Setup daily offsite backups (this type of stuff isn't shown in the code)


### Fixed
- Dying only moves the objects in your now dead body, not ALL of your bodies (hotfixed in 0.2.27)
- Planets not spawning some objects properly (e.g. Desert planet not having as many Dust Growths as I told it to )
- Dockable ships being able to dock at the Azure planet via the 'Dock At Azure Planet' command
- You can now no longer swap bodies if the old body is on an object/object type (this causes the object/object type to disappear)
- Several issues with AI spawning it's daemons and edifices
- Issue where giving a body to someone else would cause addictions to not properly see the body as equipped, 
and potentially kill the body without dropping like an equipped body
- If you happen to have an extra coord assigned to your player on your ship, you can now walk through the fake you (kind of a bandaid type of fix)
- Manufacturing augment display
- Monsters bypassing AI rules
- AI Space Construct bypassing shields
- AI Space Construct moving in the galaxy

### Changed
- Vending Machine is now made in the Manufacturer, and costs 2 refined territe instead of 100 credits
- Living Wood ship now additionally has a chance to delay decay (similar to the Garden Ship)
- Complexity of Green Juice and Blue Juice increased to match their tier, instead of being just 1
- You can't take items from a vending machine if you aren't the owner of the vending machine
- Bulk Container can be salvaged
- Updated Forge, Research Station, and Food Replicator sprites

## [0.2.27] - 2021-01-13

### Added
- The first actual use of a projectile effect! The Volt Rifle now throws an electrical bolt at enemies.
- Hack Dust
- Gaian Plasma Deposit
- Gaian Plasma
- Admin ability to manually tick decay
- Monsters will now attack player built objects if those player built objects aren't preventing them from attacking a player they are 
engaged with combat.
- Green Juice
- Blue Juice
- Garden Ship


### Fixed
- Bug when rules are deleted (hotfixed in 0.2.26)
- Bug when going through a portal location on a planet then leaving that planet and trying to move your ship (hotfixed in 0.2.26)
- Bug where being addicted to something without a valid race eating linker would cause you to not be able to attack
- Some fixes with the storytelling system
- Image for Large Ice Comet
- Bug with newly created ships not seeing their airlock in some instances


### Changed
- Wreck object type now drops some nicer stuff than just Territe
- Acid Egg event is no longer part of the storytellers
- Some of the text surrounding the storytelling system
- Increased Algae Puffs tick count from 20 to 40

## [0.2.26] - 2020-12-30

### Added
- Primewall

### Fixed
- Monsters from ships showing up on planets (I did manually push this into a hotfix for 0.2.25 already )
- Temp fix for ships destroyer size and larger for undocking from space stations. Eventually I want to code this differently
- Medium sized ships being able to dock at Space Stations from the left or top. Re-coded a significant portion of how ships move through the galaxy.
- Bug with using an emergency pod removing the previous ship the player was on from the galaxy
- Issue with taking decayed inventory items (algae vats that were left in the manufacturer for a long time)
- Issue with the storyteller finding an event when there is no previous difficulty (for some reason)
- Large ice comets were just spawning ice at their location and disappearing. New ones will need to be mined like normal
- Stairs out showing up on Machine Hills
- Thiol Canisters can now be picked up
- Monsters not being deleted when a ship is deleted
- Crystal Guard image

### Changed
- Increased Vooard base attack range from 1 to 2
- Verification for The Great Nomad from cookie to localstorage
- The lookups that monsters use when spawning things. There was a rogue monster taking 600ms to constantly try and fail spawning something
- Warmind from taking up two vertical tiles to one vertical tile 
- Warmind sprite

## [0.2.25] - 2020-12-22


### Added
- Support for projectile type effects, and effect chaining (e.g. ball of electricity moves towards a destination, and releases the energy upon arriving at the destination)
- Broken Giant on Machine Planets
- Machine Hill on Azure Planets
- You can now move through portals you are already on by right clicking on them, and clicking 'Go Back' (Similar to stairs)


### Fixed
- A performance issue with monster's destination x/y not being reset properly, causing the client to update effects every frame.
- Dying in a Corporation Headquarters, or other type of spawned portal
- Researching body can now be assembled
- Bug with ship walls not showing up properly
- Finished assembly info being sent
- I THINK I have improved the issue where monsters would appear on the wrong tile.
- Pieces of larger ships staying on the map after a player switches to them
- Lag message after switching ships (not impossible it still shows up, but it's been improved)
- Missing map bits after switching ships
- Missing map bits after switching bodies
- Destroyer image and animations
- Researching body image and animations


### Changed
- Improved the language of Manufacturers to be less confusing
- Ships now spawn with engines by default. You can still swap out the engines with a different type if you want to. Increased the engien power required for ships 
tier 3+, reduced number of engine slots, and defaulted to thiol drives for those tier 3+ ships


## [0.2.24] - 2020-12-16

### Added
- Ship coords can now have a fixed monster type that they spawn one at a time.
- Corporation Headquarters (You'll find them on Corporation Planets!)
- Ship coord support for the spawned_monster_id column, similar to planet coord support for this
- Expanded the Desert Cruiser Wreck, The Great Nomad, Data Breach

### Fixed
- Acid Fly and Acid Fiend image
- Large Comets can now be mined


### Changed
- Some types of events will now disappear instead of being fully deleted. For example, the Corporation headquarters creates a lot of 
coords, and it's kind of a waste of server resources to just delete it all, and then re-create it when the event spawns somewhere else. 
Now the server can re-use these!
- Widden image
- Removed Gange Building spawn from Corporation planets. I'm preferring the new style of having a neat image players can move onto vs spawning 
the entire thing in real space on the world

## [0.2.23] - 2020-12-10


### Added
- Text on screen when a player talks

### Fixed
- Larger objects that spawn objects will now correctly show if the have the spawned object and can be mined/harvested
- Bug with mining from non-origin coords for large objects
- Bug with researching on ships without a researching modifier
- Issue with players showing up on your ship when they aren't on your ship
- Bug with another player's ship not showing if they were in their ship view while you were in the galaxy view



## [0.2.22] - 2020-12-5

### Changed
- I'm changing files and my build process around to hopefully get the game on itch.io

## [0.2.21] - 2020-12-2

### Added
- The room now gets information about when a player stops attacking something.
- Large Dust Growth to Desert Planets
- Large Comet that shows up in the galaxy

### Fixed
- A small conceptual bug with moving players other than the client - but this significantly improves the movement of other players!


### Changed
- Moved more functions around

## [0.2.20] - 2020-11-28


### Added
- Data Breach - Something fun that can spawn on Machine Planets
- Data Guard
- Player Researching Body
- Diamond Battery
- Jelly Rod
- Volt Rifle
- Chem Blaster
- Acid Egg Storyteller event
- Client ability to load in player and ships images after initial preload. As we add content, the number of images we've been needing to load has gotten 
to be quite a bit - and we're just getting started. The client is moving towards more dynamically loading just the images the player encounters.


### Fixed
- Bug that sometimes caused player bodies/ships to flip incorrectly.


### Changed
- Acid Fiend Sprite
- Acid Fly Sprite
- Bug Spawner Sprite
- Zuran Cruiser Wreck Sprite
- Silk Ship Sprite
- Silk Floor Sprite
- Lots of changes to monster strengths and weaknesses. Mostly just adding some in, as most 
monsters still don't have any set for them.


## [0.2.19] - 2020-11-25

### Added
- When a ship is first generated, the airlock will automatically spawn with a rule that allows the creating player onto it


### Fixed
- Display of damaged ship walls
- Anyone that's played Space Abyss has known about a bug that sometimes shows the wrong name for the Attack/Destroy buttons at the end of some lists. 
This has been fixed!
- Display of M Man (as a side note, the M Man, M AT, M HP names aren't as great as I hoped they would be. I will probably change them soon)
- Many airlocks did not have a player id set, or did not match their ship. I believe I have fixed the cause of this, and now I've updated the broken airlocks

### Changed
- Instead of generating our entire inventory list every time a single inventory item changes, if we already have the inventory item being displayed, we just 
update that display instead

## [0.2.18] - 2020-11-23


### Added 
- Galaxy News when a player loses control of a planet
- Message when you try to eat something, but are already eating it
- Credits on the game login screen
- Color coding for inventory items that you are currently eating or are addicted to. It can be hard to read the list of things you are eating in the middle of 
battle, so I think having a color display on the inventory items will make it more clear when you can eat something again.
- The client will now proactively remove mining and salvaging beams if the player moves too far away from the object that is being mined/salvaged

### Fixed
- You can now equip diamond armor
- Fighter ship image now shows up properly
- Some links within the game client pointing to the old client location
- Laser gun and laser rifle showing up as question marks when dropped on the floor


### Changed
- Using a minified version of Phaser on production. In theory this should make for a pretty good reduction in initial page load time for new players

## [0.2.17] - 2020-11-22

### Fixed
- Images not showing up on drop menu

## [0.2.16] - 2020-11-20

### Added
- Factions should be functional from the website end of things. There still may be server functionality that doesn't properly support factions yet
- Faction names must be between 2 and 60 characters


### Changed
- Lots of directory updates, other small updates as we move the website's frontend from Laravel5.1 to Laravel5.5

## [0.2.15] - 2020-11-17


### Added
- Tons of work on audio. It's going to take me a lot of time to get audio that doesn't sound like butt. I might need to get someone that can do sound effects 
specifically for Space Abyss.
- Architect Station. The construction of all the floors/walls has been moved to this station.

### Fixed
- Bug with dying due to addiction

### Changed
- Floor types now need to be assembled in something (for now, they will all be in the Architect Station)
- More monsters on the Azure planet and Machine planet will also sometimes drop AI Dust
- Increased number of times AI Fragments have to be researched
- Started to revamp the faction system... and by revamp I mean actually start working to get them to a point where they are usable. Lots more work to do on this,
but the body addiction dying bug was kind of big.

## [0.2.14] - 2020-11-10

### Fixed
- NPCs will now not show up on every level of a planet
- If a player's body dies while they are offline (addictions killing the body or something) the server will give them a new body when the log back on

### Changed
- Pods now have a 'Build A Better Ship' in salvaging and attacking instances where it can't participate
- Mag Dust now drop Territe and Credits commonly, and Dirt Piles rarely. I think this will be more useful for new players. It was a little weird that the second 
monster many players will see would drop something used so obscurely (and potentially not really used in the future)
- Doing quite a bit more audio testing, as well as testing what kinds of breaking changes I'll encounter as I upgrade Phaser (ooof it's a lot)


## [0.2.13] - 2020-11-6

### Added
- Admin ability to warp ships to the Azure planet. Going to use this to 'find' the lost ships in the galaxy from the bug mentioned in 0.2.11

### Fixed
- Events spawning with limits were being limited by the total number of that event on the planet, instead of by the number of spawned events directly 
associated with that planet event linker. This has been fixed. Since old spawned events don't have this information, there will be extra monster/spawners 
on planets for a bit
- NPCs should be more successfull at finding planets when the server first
- Some progress bars on manufacturing would be too long or too short; they were still referencing an old system for calculating progress.


## [0.2.12] - 2020-11-5


### Changed
- Despawned all events > 2000 ticks due to a bug with despawning events. There's an auto purge at 10000 ticks, but that's a month

### Fixed
- Client bug when removing equipment and using the task system
- Bug where the server wouldn't say to remove a failed research.
- Client bug that prevented the research station menu from being displayed


## [0.2.11] - 2020-11-4

### Fixed
- Disappearing ships! This should now be stopped from happening. Next up I'm going to code an admin function to dock ships at the Azure planet. I don't want 
to just spawn all the lost ships in space; not everyone would be the first to find their ship(s).
- Science Vessel sprite should show up when ship is not active
- Diamond Deposit should show up
- Bug that wasn't giving extra manufacturing points on a failed assembly
- Bug with moving around the function that calculates player attack


### Added
- Working on adding audio to the client. Off by default while I mess with it over the course of the next several weeks.

## [0.2.10] - 2020-11-2

### Added
- Bodies can now give a bonus or negative to researching
- Manufacturing body now also gives a +2 to researching
- MLM body gives a +1 to research
- Science Vessel - Gives a +3 to research stations on it
- Fuel display for ships that require engines
- Acid Egg
- Event with lower difficulty than the bug spawner - spawning an acid egg that turns into... something!

### Changed
- No longer clearing assemblies and researches when the player switches views. This should make manufacturers, forges, research stations, etc, show what 
they are doing more often.
- Increased Voonita, Transporter, and AI Dust spawn amounts on Desert Planets
- Voon Egg sprite


### Fixed
- The initial wreck type in the galaxy won't disappear if you move onto it anymore

## [0.2.9] - 2020-10-28


### Fixed
- M HP and M AT will now stack properly

### Added
- M Man - manufacturing boost created from moss.
- Clients will now receive limited information about spawned events associated with the game's storyteller
- Galaxy news messages when a player defeats a negative galactic event
- Warnings are displayed on a planet's information if there is a dangerous galaxy event happening on the planet

## [0.2.8] - 2020-10-26

### Added
- More planet types that the initial storyteller event can spawn on

### Fixed
- Old spawned events will now be deleted when a planet is destroyed by an admin
- Ice blocks not spawning on Frozen Planet
- Lots of bugs with events spawning
- Diamond asteroid display

### Changed
- All planet coords now load when the server starts up. There were too many issues with trying to selectively load planet coords at startup
- Increased the chance of a successful monster spawn 
- Increased the spawn rate of AI Dust Deposits on the main level of the desert planet

## [0.2.7] - 2020-10-23


### Added
- Error message when trying to switch bodies from too far away
- Global message when a player logs in. Eventually I'll turn this off, but I feel its important for community buildint at this stage of Space Abyss's development
- Option to have your browser notify you when another player logs in.
- Line of Sight for ranged weapons (only active on players for now )

### Fixed
- Inventory being taken from non active bodies while assembling 
- Manufacturing Augment can now be assembled again - in the Augmentation Station


### Changed
- Default chat set to global
- debug mode is using browser local storage instead of a cookie. The server doesn't need to know if you are using debug mode or not
- The way walls are drawn. This should make them look better overall.


## [0.2.6] - 2020-10-20


### Fixed
- Some spawning was looking for a socket that was never there and throwing errors. Now passing in an empty Object
- Jelly should now stack properly all the time
- Blue Algae should now stack properly all the time
- Inventory items sometimes going to the wrong body

### Changed
- Eating and addiction linkers will now stick with the body they originally were on. This also gives players the ability to go from body to body, healing them up. 
- Getting to the point of researching AI Fragments was INCREDIBLY difficult. Failures on researching weren't increasing skill fast enough. I'm now using the same
system as with manufacturing. Increasing skill by the full complexity of the item on a failure.

## [0.2.5] - 2020-10-17

### Added

### Fixed
- Various menus would still show all inventory items from all bodies a player has as being immediately usable. No more!
- Quite a few events weren't spawning properly. The Water planet in particular was pretty barren. I should have drastically improved this.


### Changed


## [0.2.4] - 2020-10-17


### Added
- A task system. The idea with this system is to help players that don't enjoy the organic discovery inherent in the Space Abyss sandbox style environment.
- Forager NPC job. Will go around to different planets, harvest things, and will sell them to players.
- Bug Attack NPC job. Will travel to a planet and royally screw it up
- Admin warp to npc
- Events can spawn NPCs
- Acid flies now drop Exodium (there isn't a super relevant tier 3 drop for them, so this will at least be useful)
- Player logs (they're kind of almost event/galaxy logs now) can have a ship_id or planet_id attached to them

### Fixed
- Blue Algae can now be picked up
- Wrecks and Zuran Cruiser Wrecks weren't spawning properly in the galaxy
- Desert Storm floor tile
- Admin spawning objects
- Only active events will spawn in the galaxy
- You can now move onto a portal from any tile that it is on, not just the base tile
- Events will now listen to the planet HP requirements to spawn

### Changed
- Lots of updates to the NPC system code

## [0.2.3] - 2020-09-30


### Added
- Milk Slerm Egg
- Milk Slerm Eggs can grow into Milk Slerms
- Milk Slerms can drop Milk Slerm Eggs
- When you switch bodies, you now have the option of moving your inventory with you, or leaving it on the previous body. This lets players setup bodies 
with different sets of inventory based what tasks they want that body to accomplish.
- Slerm Berry Egg
- Slerm Berry Egg as potential drop from Slerm Berry Tree
- Vooard now drops AI Dust
- Icer Pistol
- Diamond
- Diamond Deposit
- Diamond Armor - chest/body, legs, and helmet
- Diamond Asteroid
- Slerm Armor - chest/body, legs, and helmet
- Rare Inferno Core drop to AI Forge


### Fixed
- The body of an inventory item was not being updated after the creation of the inventory item
- Display for plasma skill
- Game file index for Corrosive Goo

### Changed
- Slerm Berries no longer have the potential to spawn things. This didn't work anyway since Slerm Berries stack. Replaced this functionality with a Slerm Berry Egg object.
- Voonita spawn levels from 0 to -3 to 0 to -1
- Scrapslog spawning from rare to common
- Desert Cruiser Wreck will now de-spawn after about a day and a half
- Updated sprite for Hull Welder
- Updated image for Coral Bloom and Coral Fragment
- Added a spawn to The Great Nomad

## [0.2.2] - 2020-09-23


### Added
- Object Types now have two additional properties - is_portal and attaches_to_object_type_id. This lets different object types be portals, and lets the look 
of the enterance/exit be different.
- Event linkers now have a spawns_off_grid property. Events can be created that will spawn something (right now ships with portals in them) off grid to make extra 
caves and areas to explore beyond the default planet makeup
- Added Desert Cave #1 event
- Burster spawning on Desert Planet
- Corrosive Goo
- Vooard spawning on Desert Planet
- Water Ship
- Living Wood Ship
- Coral Bloom
- Coral Fragment
- Silk Ship
- Increased Bionic Crab hp, exp, and damage
- Increased Sea Urchin hp, exp, and damage
- Increased Jellyfish hp, exp, and damage
- Decreased Laser Rifle damage from 10 to 6
- Decreased Laser Gun damage from 5 to 2

### Fixed
- Monsters and players showing up in the wrong view
- Ships wouldn't load into memory if not owned by a player unless a player saw that ship in space.


### Changed
- Expanded The Great Nomad


## [0.2.1] - 2020-09-11

### Added
- Silk Fragment
- Spiders on Azure Planets now drop Silk Fragments
- Broken Nanite Clusters now drop AI Dust
- Algae King now drops Living Wood, Algae, and Blue Algae
- Protein Powder
- Voon eggs can be made into Powder
- Human bodies can eat Protein Powder
- Kick Plants can now be farmed on Spaceships (Use Ice or Life Water to heal them, same idea as Algae Vats)
- is_damaged property to ship coords. This should make it easier for the server to go through and find damaged tiles to heal, and undamaged tiles to damage.
- Support for ship walls and floors that aren't the normal ship wall/floor. Water, desert, and more coming soon (the reasons for this are also coming soon)!
- A new monster movement type - warp away.
- Burster Monster
- Observer Monster

### Fixed
- Multiple beam fixes. Mining beams would sometimes disappear, or laser beams would show up at the wrong destination (looked like monsters were attacking each other)
- Additional effect fixes. Resetting things like rotation and sprite origin for a re-used sprite.
- Broken Nanite Cluster Animation having an empty frame.
- Slerm Milk can now be picked up.
- Admin ability to spawn monsters on ships wasn't working. This really only applies to testing monsters.
- Bug with monsters moving on ships. Turns out the ship coords were never actually saving that a monster was on them.


### Changed
- Players will no longer get a skill increase for attacking objects that don't attack back (doors, walls, etc)
- Increased the dirt pile amount that Mag Dust will drop from 1 to 4
- When first docking at or otherwise going to a ship, if that ship has an airlock, the server will try to place the player near the airlock first.
- Did another pass at using neighbor coords to place and drop things. I'm slowly getting a good and fast system working.
- To repair a ship, you will now need the material that ship was made out of (commonly Territe for beginner ships, Exodium for the next tier of ships, etc)
- The order of the 'Switch To' and 'Dock At Azure Planet' buttons. Switch To is now the first button
- Started up The Great Nomad moving in and out of the galaxy
- Increased pod health from 10 to 30. Pods were insta-dying in the area around the sun. I think it was too confusing for new players.

## [0.2.0] - 2020-08-29


### Added 
- Energy Blade
- Consumables for Slerm player body types
- Players now have the ability to move up stairs they are currently on. Right Click -> Move Up Stairs

### Fixed
- Bug with trying to add an adjacent index back if the adjacent coord was not found
- Bug with pathfinding going out of bounds of the grid when we fail to find a path, and then try to find paths around it
- Mutliple other bugs with pathfinding, as well as efficiency changes

### Changed
- Warmind spawning removed from level -7 of machine worlds
- Reduced Glitched God damage
- All current monsters on the Water Plant are now weak to Electric attacks.
- Voon Matriarch spawning changed from Rare to Epic
- Message when you can't increase HP of a spawner further (e.g. an Algae Vat) from a failure message to a success message, just letting you know that more 
is pointless.
- Recoded how monster drops happen to use the new coord_index system
- If an object type can be walked on, it will now drop undeath a player/npc/monster
- Drops of a Warmind. Warminds can now drop AI Fragments. This gives players multiple paths to get AI Fragments. Manufacturing from AI Dust, or monster battling. 
Removed Battery drop of Warminds. Changed Power Cell drop for Warminds from Rare to Common, and increased amount from 2 to 4
- Increased Portal complexity from 20 to 26
- Monsters that move adjacent now use the new coord neighbor index system
- Basic planet movement now uses neighbor indexes. We also send the player's updated information before sending the additional off screen coords
- DDrone hacking defense modifier changed from -4 to -3
- Warmind hacking defense modifier changed from 0 to -3


## [0.1.28] - 2020-08-20


### Added
- Admin can warp a player back to the Azure planet in limited circumstances now
- Monster attacks can now have an additional effect. The first example of this is going to be the Trae having a thorn effect show up on the player
- Ice Sleem. Consumable by human bodies.
- Portal image added
- Voonita can now drop AI Dust


### Fixed
- Bug that was allowing players to pick up things no matter how far away they were
- Bug that would cause some objects to not immediately update on the client when a player harvested them


### Changed
- Minimum HP requirement for Blue Algae to spawn from an Algae Vat has been increased from 100% to 101%
- Cyberskell HP from 200 to 100 (will probably go back up if I decide to increase attack - which I think I will)
- admin spawning monster type command changed from using an ID to a name
- Updated the object ID of The Great Nomad to match production server
- Gave the Reinforced Human Body additional defense to all damage types
- Building a portal now needs to be done in a Manufacturer. Increased complexity from 10 to 20
- Reduced Voonita HP from 50 to 25
- Increased Transporter drops to 50 Credits/200 AI Dust/10 Exoskeleton Fragments.
- Changed how the server finds additional ship coords to send to the player as the player moves. Tiles are now grabbing and storing the indexes of their up/down/left/right 
neighbors - and once they know that, traversing space around the player is extremely quick for the server.
- Removed Nano Bonder drop from Macro Viruses


## [0.1.27] - 2020-08-13

### Added
- Warning message when players attempt to dock at The Great Nomad
- Admin function to tick The Great Nomad
- Danger message if a player is thinking about attacking a monster that is likely to near instantly kill them, or insta kill them.
- Admin ability to gift items to players if they lost items somehow


### Fixed
- Objects that can not be assembled will now not show up, even if those objects have assembly linkers associated with them.
- Issues with placing objects with multiple tiles
- Bug with researching while the player is offline
- Maggot Burgers and Mech Take Out can be picked up and attacked
- An error or two when players died
- Players can no longer be attacked on Spaceport Merchant tiles


### Changed
- Implemented the start of a new system I've been thinking about for quite a while now. Tiles/coords will grab the array index of their neighbors to the top/bottom/left/right, 
so we can traverse those indexes rather than searching the entire array. Currently this is only active for grabbing new ship tiles/coords in ships. If I don't notice 
any large issues with it, I'll keep expanding this system. It takes the lookup times on a pod from 300ms to 1ms and should scale much better
- Reduced 'Crush' attack damage from 150 to 75 for Trae
- Regenerated the BioGrove, Inferno, and Frozon Planets

## [0.1.26] - 2020-08-11


### Added
- Temporary script to fix the extra 1400 or so ships

### Fixed
- Couldn't land on Azure planets
- Potential fix for the infinite assembly bug (not tested yet)


## [0.1.25] - 2020-08-11

### Added
- Admin function to regenerate the floor of a planet level
- Generic message when moving to a tile isn't going to work
- Fire Wall
- Fire Lava and Fire Simple floors
- Two advertisement drones (monsters) on the Corporation Planet
- Maggot Burgers
- Mech Take Out
- Cherry Blossom and Cherry Blossom Sipmle floor
- Cherree (monster)
- Boomtis

### Fixed
- Warmind should now show up
- Clients will no longer think they can move onto a tile with part of a monster on it
- When monsters that take up multiple tiles die, they will now be removed from all tiles.
- Asteroid Ship display

### Changed
- Most monsters on the Machine Planet Type spawned on 3 different levels. I want to increase variety, and have reduced that to an average of 2 levels.
- Reduced Warmind HP
- Complexity and tier of some items. I'm going to try and standardize the complexities of the different tiers a little. Otherwise things get a little too confusing.
- Ice and Ice Simple floor tiles
- Ice Wall spite
- Fire floor spite
- The Great Nomad sprite
- Maggot sprite


## [0.1.24] - 2020-08-06

### Added
- Monsters can now have a 'move away' attack movement type. This will generally be the default movement pattern for ranged monsters.
- Admins can now send a new 'admin' type of message globally to notify everyone if the server is going to shut down or something else important.

### Fixed
- Autopilot
- Message warning players that if you build a ship in someone else's shipyard, it will not belong to you when it is complete.
- Manufacturing Thiol Drives and Blasters
- Monster beams were not following the monsters. It will now follow the monsters as they move.
- Bug that would cause many of the same effect sprites to be created needlessly.
- Bug that would cause all beam sprites directed towards a player disappear when only one needed to be removed.
- Continuously redrawing hp bars unnecessarily
- A bug that was immediately deleting new battle linkers when a player moved down a hole or up stairs


### Changed
- When switching ships, only pods will be abandoned. Other ships will remain yours, and you can command the ships you aren't using to dock/warp to the Azure planet. Eventually I want them to autopilot to the nearest planet, but that's a lot more difficult to implement.
- Made credits a more common drop on monsters - especially on corporation planets

## [0.1.23] - 2020-07-27


### Added
- Things you can eat can now impact your manufacturing abilities
- Support for events generating new planet coords above level 0
- An event that spawns a building with special enemies to be defeated (event is not yet active, just waiting on the sprite animations to finish). More of this coming!
- Ability for events to spawn monsters on a coord that didn't have a floor prior to the event
- Admin ability to despawn events
- Players can now assemble the Octopus Body
- The start of content for Water planets (basic enemy types + objects on level 0 to -2)
- Monsters can now poison players. Poison stacks.


### Fixed
- Not leveling up until the server restarted


### Changed
- Switching Font Awesome (it's what we're using for icons) from a kit they host, to self hosted.
- AIs now take 10 Power Cells instead of 10 Batteries to manufacture
- Lots of sprite updates
- Lots of code refactoring

## [0.1.22] - 2020-07-16


### Added
- Wrecks and other salvagable material can spawn in the galaxy.
- Augmentation Station
- Stabbing Gloves, Urchins, Urchin Spines, Bionic Crabs
- Manufacturing Body sprite - ability to manufacture - and benefits
- Reinforced Human Body sprite - ability to manufacture - and benefits


### Fixed
- Various bugs with monsters on ships
- Octopus body sprite
- Asteroid ships weren't spawning in the galaxy


### Changed
- Most monsters had HP that was 10x Exp. I've decreased the base monster HP to 5x Exp. This means existing monsters will have LONG HP bars.
- Changed part of Reinforced Human Body assembly requirements from 5 AI Fragments to 1 AI Fragment
- The various cores associated with augmentation are now built in an Augmentation Station instead of the Forge
- Augments are built in the Augmentation Station
- Machine planet has been regenerated

## [0.1.21] - 2020-06-29


### Added
- Ability to update ship types when there are changes. This is currently mostly focused on adding ship coords, and changing the object/floor/monster spawn on a coord. 
Would need added funtionality to remove previous coords, or remove an object type without changing it. Test before doing more than adding ship coords.


### Fixed
- Being brought back to a planet if you previously logged out or were disconnected on a planet, and then logged out/disconnected on a ship


## [0.1.20] - 2020-06-26

### Added
- Manufacturing Core, Laser Core, Hacking Core
- Decay rate to AI Space Constructs
- Floor types have an additional property - movement type. This can be land,fluid, or air. Different player bodies will get different movement 
bonuses/penalties based on the type of floor tile they are walking on. This lets the Octopus body be fast in the water, and slow on land.
- Exodium Asteroid

### Fixed 
- A bug with repairing damaged tiles on ships
- Connecting levels on planet genaration (was using the old single underground offset instead of the new separate x,y underground offset)


### Changed
- Removed the Advanced Forge while I continue to get closer to working on the type of functionality it's supposed to provide
- Increased AI complexity from 20 to 22
- Increased complexity of Power Cell from 1 to 10
- Increased Defense Drone complexity from 5 to 10
- Manufacturing Bodies, Manufacturing Augments now require Manufacturing Cores instead of AI Fragments
- Removed energy storage from AI batteries, and increased their complexity from 1 to 10
- Increased complexity of AI core from 1 to 20
- Increased decay rate of AI Edifice and AI Daemon
- Now show the energy of an AI directly on it
- Once the update is pushed, I'll be re-generating the Water planet type. Still no monsters on it, but they are coming!

## [0.1.19] - 2020-06-23


### Added
- While complexity is a mechanic I'm super fond of, I think adding some clarity for players on what to expect when manufacturing things will prevent some 
needless wasting of resources and frustration. I've added a tag next to the name of things you can assemble to show how difficult it is for the player.
- A function to try and help fix when ships aren't removed properly from their coords
- AIs can now spawn monsters in the Galaxy to protect the planet and ships they are protecting.

### Fixed
- Error killing players that are attacked by objects
- Image for Microcontroller, Crystal, Blockade Runner, Lancer, Thiol Extractor


### Changed
- Instead of a single per attack bonus, attack bonuses are applied for each piece of equipment
- Ion drive now takes 10 ticks instead of 20 ( In general, building ship engines should take a long time, but this is the intro one )
- When switching bodies, the player is set to the current HP of the new body.
- Pod HP changed from 100 to 10 so abandoned pods decay faster and are quicker to kill.

## [0.1.18] - 2020-06-21

### Fixed
- Hopefully I finally squashed the bug that was causing the 'Back To Galaxy' button to disappear
- Potentially fixed an issue that sometimes put players on ship 2 (yes, a ship with ID 2)
- Bug with inventory items not always updating to the database

### Changed
- Algae Vats produce 6 Algae instead of 2 Algae


## [0.1.17] - 2020-06-20


### Added
- Ships more advanced than a pod now need engines to move. The first set of ships will be created with engines, a ship shield, and energy storage. 
More advaned ships do not come with any of this. Players will need to add engines to the ship. It's effectively a way of transitioning players into the sandbox of ships.
If a ship has no engines, it will not move. 
- Admin ability to move any object to any place (Currently there are disappeared Space Stations on the galaxy - now it's easy to bring them back in game)
- A 'Claim Ship' button

### Fixed
- Airlock display now shows up when you move onto an airlock
- Many bugs relating to docking on larger ships/stations, and controlling dockable ships/stations.
- Bug that wasn't writing new player data until the server shutdown


### Changed
- Voon Steaks can now be picked up
- Updated ship types to the new engine/weapon system
- When determining whether a player can be placed on a ship, use the canPlacePlayer function over the previous custom IF statement.



## [0.1.16] - 2020-06-16


### Fixed
- Old manufacturers, research stations, forges, and food replicators have been set to 10 HP to match the new ones.
- Hopefully another fix or two so the 'Back To Galaxy' button doesn't disapper
- Fix for effect sprites when mining is stopped

### Changed
- The color of an HP bar with HP > 100%

## [0.1.15] - 2020-06-16

### Fixed
- A bug with showing effects that would cause some buttons to not show up

## [0.1.14] - 2020-06-16

### Added
- Helpful messages about the results when a player is healing something like an Algae Vat

### Fixed
- Bodies and other waiting drops that are objects will no longer spawn on wall tiles in -1 and below, removing a wall that was supposed to be unremovable :D

### Changed
- Simplified the inventory.place function. I had begun moving about 1/2 of it to game.convert, and finished this.
- New manufacturers, forges, research stations, and food replicators spawn with 10 HP to work with the recently updated salvaging system
- Algae vats can no longer be salvaged
- Trae will no longer drop Trae Seedlings. This didn't work in the server anyways. If I wanted to re-ad this in the future, I should have it drop an object type
that grows into a monster.
- More monsters on the machine planet are weak to hacking damage.

## [0.1.13] - 2020-06-14

### Fixed
- Invalid waiting drops will now be deleted. Investigating where they are coming from (I believe it's monsters)


### Changed
- Reduced the frequency at which the server will try and place waiting drops (10 seconds -> 60 seconds)


## [0.1.12] - 2020-06-13

### Added
- The server will continue to try and place monster drops, and player drops (deaths) that are unable to initially place

### Fixed
- The bodies of players should drop in more cases now. Previously if the body couldn't drop on the coord it wanted, it wouldn't be created, and all the inventory
would be lost. It's now created regardless. See Added for how we then process it.


### Changed
- The failure message you receive when you try and land on a forming planet has been changed from 'Spaceport is full' to 'Planet Is Forming'


## [0.1.11] - 2020-06-12

### Added
- A couple of territe deposits will spawn on the top level of desert and slaver planets

### Fixed
- Objects attacking players would set their HP to NaN - which isn't a great HP to have as a player. Added in a return false and some tracing to see if this is happening anywhere else.
- Beam type effects will be removed when something is out of range of an object.
- Objects can't attack players on Spaceport tiles


### Changed
- Increased the amount of asteroids and comets that can spawn in the galaxy from 12 and 6 to 50 and 50, respectively.
- Removed the Nano Bonder requirement for assembling a Forge
- Assembly Requirements for Thiol Extractor from 10 Territe to 5 Refined Territe. 
- Complexity of Thiol Extractor reduced from 20 to 12
- Updated Algae Power Cell. Lots of changes. Required Algae research. Increased complexity. Eatable by machine bodies. Added in images. 
- Reduced the number of times algae has to be researched from 20 to 10
- Territe deposits spawn 10 Territe instead of 8 Territe
- The right side of the game will now only scroll the right side instead of the entire page.

## [0.1.10] - 2020-06-11

### Fixed
- You can now switch bodies - and other things that look for interactions will now work better

## [0.1.9] - 2020-06-11


### Fixed
- You can now register again! Registration was a bit broken after the server move. EEEk!
- The last coord of planets will now be sent. Off by one errors are rough.
- An error with getting inventory items would cause the 'Back To Galaxy' button to disappear

## [0.1.8] - 2020-06-10

### Fixed
- Some of the changes made to make players show up better made movement worse when the server was moderately laggy. I've improved this.

## [0.1.7] - 2020-06-10

### Added


### Fixed
- Previously, if you logged in the galaxy and another player was around you, you would not see the player until they moved. Fixed this in the galaxy.
- The ships of other players now disappear when they land on a planet and you are still in the galaxy.
- A few other delays with showing other players.
- If you buy a pod, it will now re-generate the spaceport display immediately.
- Local message sending should now work in the galaxy
- Chat should scroll to the bottom properly now


### Changed
- Planets in the galaxy will now show up sooner. Less pop in.

## [0.1.6] - 2020-06-10


### Added


### Fixed
- Player sprites now disappear when players logout
- Basic manufacturing without being assembled in an object works again
- Previously, if you logged in the galaxy and another player was around you, you would not see the player until they moved. Fixed this in the galaxy.
- The ships of other players now disappear when they land on a planet and you are still in the galaxy.
- A few other delays with showing other players.
- If you buy a pod, it will now re-generate the spaceport display immediately.
- Local message sending should now work in the galaxy
- Chat should scroll to the bottom properly now


### Changed
- Planets in the galaxy will now show up sooner. Less pop in.

## [0.1.5] - 2020-06-09


### Added


### Fixed
- Various bugs with the server switch
- Bug with converting things (using water to heal an algae vat)
- Repair effect
- Shuttles can't be walked on anymore (this makes them disappear)
- The process that runs Space Abyss works a little differently on the new server. A couple of instances of the game were running simultaneously O_o Fixed this.
- Fixed some residual issues from multiple instances of the game trying to run at the same time.

### Changed
- Planet types and planets now have 4 attributes for size, x and y for both above and under ground. This gives a little more flexability to planet shapes. 
- Worked on some efficiency improvements for moving monsters.
- Server!!! Space Abyss now has its own server.
- Updated the Azure planet to the new generation system


## [0.1.4] - 2020-06-05


### Added
- is_full_game_file_index property to object types. Now things that store energy can visually show players if they are full or not.
- You now receive a more clear success message when landing on a planet, and your ion drives are refilled.
- An error message if you are trying to place a floor, and there is no coord below.

### Fixed
- A little if statement bug that caused the right animation to display instead of the left animation sometimes
- Issue with text going off the game screen.
- Ice can now be mined into ice containers
- Kick beans, when planted, now turn into kick plants, not kick beans
- Multiple issues with tint and object names
- Multiples of the same effect type will now be displayed
- Bug with monsters spawning things
- AI's spawning defensive monster types
- If the object in an inventory item can no longer be found, the inventory item will be deleted.
- I BELIEVE that I have fixed another bug with monsters not showing up on the correct tile.

### Changed
- Object types now use a max_energy_storage property instead of max_storage for clarity
- Object types now have a is_active_frame_count property instead of a frame_count property, again for clarity
- Energy storage can now be assembled, and not just spawned on certain ships when they are created.
- Expanded the energy storage capacity of AI batteries, and made them more difficult to assemble.
- Assembly requirements from Ship Shield Generators and Voon Steaks

## [0.1.3] - 2020-05-27

### Added
- Healing effect sprite, hacking effect sprite, piercing effect sprite
- I'm testing the idea of an in-game help system. Added a 'help' button next to the chat buttons. When clicked, this will pull up 
the most recent failure messages that a player has received, more text about them, and link them to the relevant tutorial page.


### Fixed
- There were quite a few bugs with the new effects. Just visual things like not following monsters, or not disappearing all the time. Lots of fixes for theses
- Bug with attacking objects leftover from testing dependancy issues
- Events spawning in the galaxy was bugged. They weren't getting the galaxy coord at the time of the event insert. Fixed this.
- Player attack now has all the possible damage types added/calculated.
- Fixed many major bugs with pathfinding
- Galaxy events weren't listening to their limit. Now there's over a hundred asteroids in space XD
- Mining in your ship could cause you to not be able to walk around your ship anymore if the tiles were full.
- Bug with calculating player HP when defending from monsters
- Taking part of an inventory item would make it disappear until your client had to re-pull the information for that inventory item.
- Logging into the game should work better. The client needed a connected response from the server, but sometimes the server would send that before 
the client was ready to accept it. Why? No idea! Now the client will ask for that connected message every few seconds until it receives one it 
is ready for.


### Changed
- Spacelane Beacons, Algae Power Cells, and normal Power Cells now assembly requirements.
- Manufacturer assembly requirements. No longer requires nano bonders. I think in general I like having one or two main requirements for something,
rather than a main requirement and a 'bonding/linking/ agent. This changed the manufacturer's salvaging too.
- Merged mining and salvaging beams with the new effects sprites
- Lots of updates to make mining and salvaging flow better
- The spawning rate and decay rates of things were really out of whack in practice. Changed decay from one tick every 10 minutes to one tick every 2 hours. 
Changed spawning from one tick every 2 hours to one tick every 10 minutes.

## [0.1.2] - 2020-05-19

### Added
- Mini Drones now drop batteries
- CNS Stimulant can now be made from Kick Beans in the Food Replicator.
- Heat effect sprite
- Object types (including bodies) can now be weak to electric attacks. The machine body is weak to electric attacks.


### Fixed
- Thiol Extractors can now be assembled.
- Some object spawners were bugged.
- Stairs can now be placed at level 0 and above again.


### Changed

- Ore mined in a ship now defaults to dropping somewhere on the ship floor. Players can build storage containers to 
auto stack ore.
- Wow I'm stupid. This whole time I've been adding in game files, and then passing them as parameters to subsequent 
game files. This has meant that if a function needed to talk to many part of the game, that function would have to be 
in one of the last files loaded. Turns out.... I could have just done things a more normal way from the start, and 
just require the other files outside of the module exports. More server files will be created as I decouple the massive game.js. This 
ended up being a MASSIVE refactoring of code - but I can split up the codebase so much better now.
- Tons of other game code refactoring.
- Re-did effect sprites. Effect sprites now have a specific image, and a more generic type associated with them. Instead of laser sprites, melee sprites,
it's all now effect sprites using the different textures. 


## [0.1.1] - 2020-05-08

### Added
- Players now have a skin_object_type_id - which is how we are planning on supporting Space Abyss financially - cosmetic skins.
- Added the basics of the skin and promotion system.
- Added support for elevators
- Support for planet types having an above ground size, and a below ground size. Centered the lower levels so they weren't
at the top left corner of the planets, but rather the middle.
- Since we currently only support one object/object_type per tile, if a monster drops something and that tile already 
has something, instead of just not dropping it, the game will check the tiles around the monster to see if it can drop 
there. If it cannot do that either, it is added to a queue of things waiting to drop (not currently used).

### Fixed
- Defense from eating is now applied properly.
- Moving through water works better now.

### Changed
- A bit of work on areas and market linkers. Still a long ways to go on this front before it works intuitively.


## [0.1.0] - 2020-04-21

### Added
- Monsters can now spawn in space.
- Comets spawn in the galaxy. They can be mined for ice blocks
- A new property to object types - spawns_in_galaxy. Boolean. This lets the asteroid system turn into more of a system
for anything that spawns directly in the galaxy
- Objects like asteroids and comets can now move around the galaxy
- Monster types can now be weak or strong to all damage types
- Object types can now be weak or strong against heat/freezing damage types 
- Message text whenever something levels up. There was previously intermittent support for this, but it wasn't obvious 
enough.
- The server is now sending conversion linkers to the client. The result parts of the conversion linkers aren't sent. 
This still removes a bit of mystery, but being a farmer in Space Abyss basically sucked when you had to scroll through 
your entire inventory every time. 
- Admins can reload an event and all it's linkers and planet linkers from the database while the server is running

### Changed
- COMPLETELY changed how monsters and objects spawn on planets. 
- OLD WAY: Previously, there were set objects and monsters during 
planet creation. A big downside of this is that I needed to regenerate a planet everytime I added in 
a new object or monster that I wanted to spawn on the planet. If the number that spawned felt wrong, I had to re-generate 
the entire planet. If there was a bug and players destroyed something they shouldn't - I could either manually add it back 
in or... regenerate the planet.
- NEW WAY: Monsters and objects spawn via the event system. So I can change a monster or objects spawn behavior without 
regenerating the entire planet. 
- Changed the frame count and attackability of various spawners to work with the new system.
- Most edible things have had their duration doubled. I've found that only 10 ticks as a minimum goes by really fast. So 
the new general minimum is 20 ticks.


### Fixed
- Some spawners that don't spawn with HP and can't be attacked were failing to spawn things since their
hp_percent was NaN.
- Picking up Life Water
- Equipping wasn't working for some of the Exodium and Quick Matter set
- Lots of skills weren't updating properly. Lots of little broken bits around that system. Fixed them.
- Various bugs with switching views
- Display issue with the Primordial Ooze Pool
- Asteroids would show up on any view when they moved - made the shouldDraw checks more consistent on all views,
and fixed quite a few bugs that showed up from that.
- Spawned events were being deleted from memory, but not the database. This caused a bunch of old spawned events to 
always appear after a server startup, delaying events.


## [0.0.13] - 2020-04-02

### Added
- A bit of work on Frozen Planets. They can now generate successfully - and added an ice block event.


### Changed
- COMPLETELY reworked the spawning system to incorporate the growing system, and turned it into a linker - so monsters and 
objects can spawn/turn into different things with different % chances, rarities, requirements, etc. The system is 
vastly more flexible, and the code that runs it is better.


### Fixed
- I didn't realize how broken the event system was. Even just spawning a basic small block of ice as an event wasn't
working properly. Spent a lot of time improving and fixing bugs with the event system.

## [0.0.12] - 2020-03-29

### Added
- Visual response to the client when converting things into energy
- Crystal Bee, Crystal Golem, AI Forge, and Corrupted Scientist - @UnfuneralOD https://twitter.com/UnfuneralOD
- Failure message when there is a failed mining complexity check
- Allow admin users to bypass the ticking of assemblies. Things still have to tick once, but for testing purposes 
it was a pain to reduce the tick amount, test, and then increase the tick amount again. I can always test the feel 
with actual tick amounts on a non-admin character.
- Players can now attack planets.

### Fixed
- Bug with deleting spawned events. A bit of bad copy/pasta.
- Rock wall was still using the old image location. It has been updated.
- Multi tile ships can successfully launch from planets if they are designed to do so.
- Bug that caused a clean clearing of a previous level/display to fail when multiple players were nearby
- Damage occurring on a different level than the client won't show up anymore
- Bug that made a different player switching to their ship view cause your client to think you needed 
to generate an airlock display as well, which made your 'View Ship' option disappear.
- Bug with new object info not being sent to the room if it was also being sent to the socket
- The admin function to set a planet type wasn't working - it is now.


## [0.0.11] - 2020-03-05

### Added
- Re-vamped the object and monster spawning system. Monsters can now spawn harvestable items. A current example of 
this in game right now is Milk Slerms spawning Slerm Milk, which you can harvest from them.
- Monsters have a new attribute, attack_chance_on_harvest . Now we can have stronger monsters with harvestable 
things, and some risk involved. Higher farming level decreases the risk of the monster attacking.
- OUR FIRST LOGO! Courtesy of @UnfuneralOD https://twitter.com/UnfuneralOD
- New movement style - static. Now sprites can be set to either a simple flip, having up/down/left/right, or just 
move along with their single animation. This is for large things like Space Stations that look odd if they flip around
really fast.
- Failure messages and an immediate bounce back if a large, dockable ship is trying to land on a planet, or dock with 
 another large ship, (they can't do either)

### Changed
- New ship interior sprites from @UnfuneralOD ( https://twitter.com/UnfuneralOD ). Floor, wall, 
airlock, ion engines
- Complexity for Defense Drones (they were the default of 1)
- The assembly requirements and complexity for Corrupted Battery Packs
- Hull welder uses heat skill
- Previously events could only spawn one object type when they de-spawned or were otherwise deleted/killed. I've 
moved that to the drop linker table, and its associated with the individual event linkers. This way, the 
drops of an event are basically the same as a drop from a monster. This will let me have random and rare drops 
when something like a dust storm ends (it's 'uncovering' treasure or something)
- Removed the option to assemble 'all' and '10' when assembling from a shipyard, since the shipyard gets used up at the
end of the assembly.

### Fixed
- Movement speed for MLM body
- I believe I have fixed an issue with new players switching back out of their ship

## [0.0.10] - 2020-01-27

### Added
- Electric effect for an electric damage type
- Pathfinding for monsters that take up a single tile of space


### Fixed
- The floor of planet coords that were brought in during monster movement will now be drawn
- Added a couple of conditions in which monsters are drawn, so in general monster sprites should be drawn quicker


## [0.0.9] - 2020-01-22

### Added
- A failure message when trying to replace a floor or 'build' something, but the ruling AI doesn't allow it
- Started more of the structure for factions. Joining, creating, leaving, viewing. Still have a long way to go, but 
will push this and then continue down the path with factions.
- An admin interface to make the designing of ships easier. This isn't directly part of the client/server, but part
of the Space Abyss website. I think I need to eventually include that in this repository too.
- Support for ships with multiple levels (still need to test this a bunch)
- The ability to use batteries to add power to AI Batteries
- An asteroid ship. The first multi level ship. Currently in testing. Uses a new type of ship engine, a Thiol Drive.
- Admins can now spawn events in the galaxy and ship
- Support for events to spawn in a ship or a galaxy. Crazy how big and far this change ended up reaching.

### Changed
- Made the cargo ship larger
- Decreased the cost of the shuttle significantly, since it's smaller than the cargo ship and the mining ship
- The salvaging opportunities of the forge (added nano bonder)
- Food replicator can now be salvaged for 1/2 resources back.
- Research Station can now be salvaged for 1/2 resources back.
- Sprite changes: Spacelane beacon. Machine walls. Rock Walls. Territe. Syntite. Some floors. 
@UnfuneralOD https://twitter.com/UnfuneralOD

### Fixed
- When objects are placed on a planet or ship, set a planet_id/ship_id for that object (this is used for AIs associating
 AI Batteries/AI Cores with themselves)
- Remove names and tints of objects when the player changes levels or views
- AIs won't protect players they are attacking
- Spaceport merchant spots are now protected
- Various bugs related to when salvaging finishes
- Bug when a ship or other object with associated things was loaded in from an event. Nothing, like ship coords,
were being grabbed from the database and attached. Should have that all fixed but just calling getObjectIndex 
from the init function
- Dead bodies of players could overwrite the location of static stairs. I've fixed this, and put in an extra 
check in the placeObject function that will throw a warning and prevent it if something like this is happening 
somewhere else.


## [0.0.8] - 2020-01-13

### Added
- Support for augments. Augments are neural enhancements that always require an auto doc to equip. I king of wanted 
them to completely burn a body on failure, but for now I am going to keep it consistent with other equip spots. 
Failure will just burn the spot, and take away some HP. For now I think the consistency, and the game's general 
ability to communicate disaster make burning an entire body too detrimental. It's still possible to fail until you 
have 0 HP and the body dies.
- The basics of a doctor NPC. Once an NPC with the dream of becoming a doctor obtains 100 credits, they are able 
to build a clinic with a pair of auto docs. 
- The ability for a user to use an auto doc from a doctor npc. This uses the NPC's surgery skill, rather than the 
player's surgery skill. This should open up the pathway for players to offer surgery stuff down the road as well. 
- A doctor npc's surgery skill will slowly increase as they tinker with.... bodies.

### Changed
- When going up stairs, or down a hole, the server will try to place you in tiles surrounding the hole/stairs 
if the main tile is blocked by something.
- Moved and resized the 'Trash' button on inventory items so it's not the first thing you mouseoever
- Optimized when checking to see if an NPC can build a structure. Stops searching subsequent coords if one has 
already failed
- New Robot Janitor and Crystal Spider Baby sprites from @RunninBlood ( https://twitter.com/RunninBlood )
- Put Crystal Spider Babies on the surface level of Mountain planet types, and made Crystal Spiders stronger, and 
spawning them starting at -1 instead.
- Changed the drops of Crystal Spiders and Crystal Guards to include dropping Crystals

### Fixed
- Assemblies using the old assembly tick count, instead of the new one which is based on the object we're 
using for the assembly.
- Placing multi-tile ships on the galaxy
- When a player's HP changes, we now redraw the hp bar
- A few different bugs when players die that interrupted the dying process
- Player surgery level was not being calculated



## [0.0.7] - 2020-01-04

### Added
- watched_by_object_id column to the object_types table - setting up for protected Spacelanes
- Spacelane beacon object, and all the logic behind supporting it
- More messages about fuel for non-default ships. The game doesn't communicate that there are fuel 
requirements very well
- Ability to jump out the airlock with an emergency pod if you are truly stuck on your ship

### Changed
- Re-worked how we go through planet coords for the map update. The old way actually didn't scale well at all - 
running getPlanetCoordIndex for each coord. Instead we just iterate through all the planet coords once, 
adding in what we need, and running getPlanetCoordIndex on the not found ones against our index. Old way could 
easily get to 100ms per player (super unsustainable). New way is ~2-5ms per player.
- Did a similar re-coding for a ship coords update. Difference is even more drastic here. 300ms -> .2 to 1ms
- Trying less frequent total map updates for players ( 5 -> 20 seconds ). In theory the goal is to not have this 
on setIncrement at all.
- Airlocks can now have rules 
- Can no longer walk on Ion Drives

### Fixed
- Bug setting new coords to belong to planets switching planet types
- Defense drone assembly location
- Critical bug that could switch sockets when logging in
- Damage types being sent when objects attack other objects
- I had broken ship refueling with some typos.
- Animations showing from previous levels after you switch levels


## [0.0.6] - 2019-12-28

### Added
- Exodium armor set. Using placeholder sprites for now
- Thiol Extractors now spawn thiol canisters
- Added a planet_type_impact_linkers table, which we will be able to use to increase or decrease planet HP based 
on object types being produced/generated from the planet ( current goal is Thiol extraction from acid planets 
reducing hp)
- Added a drop_requires_object_type_id property to object types to support needing to drop a Thiol Extractor on 
a Thiol Deposit
- Thiol Deposists now spawn on Acid planets as an event.
- Placeholder images for thiol deposit, thiol extractor, and thiol cannister
- Added a navbar to the Space Abyss website
- A bypass for the new disabled 'Play Space Abyss' button
- Added in game assets psd files. I use Photopea to open/edit these.

### Changed
- Updated the complexity of Chitin Body ( armor ) to 6 to match the rest of the set
- AI Fragment complexity increased from 14 to 18
- Updated the assembly requirements for laser guns and laser rifles
- Made Monitors weak to hacking attacks
- Re-coded the game.tickObjectSpawners function
- Thiol extractors can only be placed on thiol deposits
- The large 'Play Space Abyss' button on the website now is disabled if the above steps aren't met. You still don't
need to login to the website to play the game, but this should be more clear for new players.
- New sprites for slaver planet, corporation planet, and dirt walls from @UnfuneralOD

### Fixed
- Auto doc required message appearing as a success instead of failure.
- Mini drones not moving when attacking
- Game file index for acid floors
- Hull welders can now be picked up, Chitin legs can now be picked up
- Bug when placing an object type on that same object type
- Failed login redirecting to 404 pages on the website

## [0.0.5] - 2019-12-23

### Added
- Result message when trying to equip something normally, but an auto doc is required

### Fixed
- Only stack equippable items if they are consumed on attack
- Exodium can now be picked up
- An error sending player stats when switching bodies that prevented some of the equipment a player had on from showing.
- Display depth of important_text. Previously, it was showing under the top of walls. Now it shows above them.



## [0.0.4] - 2019-12-22
### Fixed
- Melee attack skill not incrementing on a range 1 attack when the player had no equipment.

## [0.0.3] - 2019-12-22
### Fixed
- Bug that prevented eating from working

## [0.0.2] - 2019-12-22

### Added
- MLM bodies can now eat batteries for HP regeneration
- Added in a deep rock floor tileset for mountain planet levels -1 and lower. Drawn by UnfuneralOD

### Changed
- Machine world size increased from 20 tile to 30 tiles
- Circuitry spawn changed from common to rare
- Auto generated stairs and hole on planets are now using new sprites by UnfuneralOD
- Changed the rock floor tileset to new sprites drawn by UnfuneralOD

### Fixed
- Corrected the sprite for the cutter before we have the animation.

## [0.0.1] - 2019-12-21
### Added 
- Changelog. Space Abyss is coming along nicely, and I think it would be neat to start to have a better record of the changes happening to the game.
- Corporation walls, so corporation planets are no longer using dirt walls as a placeholder (which looks awful)
- Cracked city floor tiles, and added them to corporation planets when they generate.
- Power cell. More energy storage than a battery. Added it to the drop linkers of various monsters.
- Mini drone. Spawns on machine planets.
- Lots of other changes prior to starting to keep track of things

### Changed
- New placeholder sprite for the Warmind
- New placeholder sprite for the DDrone
- Updated the placeholder machine wall sprites to our new format

### Fixed
- Editing in reasons and rarity for the things monsters drop
- You can now stop attacking an npc ( but it won't stop them attacking you back)