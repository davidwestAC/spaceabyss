//@ts-check
var io_handler = require('./io.js');
var io = io_handler.io;
var database = require('./database.js');
var pool = database.pool;
const { Worker, isMainThread, parentPort } = require('worker_threads');
const chalk = require('chalk');
const log = console.log;

const event = require('./event.js');
const game = require('./game.js');
const game_object = require('./game_object.js');
const helper = require('./helper.js');
const main = require('./space_abyss' + process.env.FILE_SUFFIX + '.js');
const map = require('./map.js');
const planet = require('./planet.js');
const player = require('./player.js');
const world = require('./world.js');


async function calculateDefense(dirty, monster_index, damage_types = [], attack_profile = false) {

    try {

        let monster_type_index = main.getMonsterTypeIndex(dirty.monsters[monster_index].monster_type_id);
        if(monster_type_index === -1) {
            log(chalk.yellow("Was unable to get monster type index in battle.calculateMonsterDefense"));
            return 1;

        }

        let defense = 1;

        if(dirty.monster_types[monster_type_index].defense) {
            defense = dirty.monster_types[monster_type_index].defense;
        }


        

        // Prioritize calculating based on a full attack profile being sent in

        if(attack_profile !== false) {

            if( typeof attack_profile.control_equipment_count !== 'undefined' && attack_profile.control_equipment_count !== 0 && 
                dirty.monster_types[monster_type_index].control_defense_modifier) {

                defense += (dirty.monster_types[monster_type_index].control_defense_modifier * attack_profile.control_equipment_count);

            }

            
            if( typeof attack_profile.corrosive_equipment_count !== 'undefined' && attack_profile.corrosive_equipment_count !== 0 && 
                dirty.monster_types[monster_type_index].corrosive_defense_modifier) {

                defense += (dirty.monster_types[monster_type_index].corrosive_defense_modifier * attack_profile.corrosive_equipment_count);

            }

            
            if( typeof attack_profile.electric_equipment_count !== 'undefined' && attack_profile.electric_equipment_count !== 0 && 
                dirty.monster_types[monster_type_index].electric_defense_modifier) {

                defense += (dirty.monster_types[monster_type_index].electric_defense_modifier * attack_profile.electric_equipment_count);

            }

            
            if( typeof attack_profile.explosion_equipment_count !== 'undefined' && attack_profile.explosion_equipment_count !== 0 && 
                dirty.monster_types[monster_type_index].explosion_defense_modifier) {

                defense += (dirty.monster_types[monster_type_index].explosion_defense_modifier * attack_profile.explosion_equipment_count);

            }

            
            if( typeof attack_profile.freezing_equipment_count !== 'undefined' && attack_profile.freezing_equipment_count !== 0 && 
                dirty.monster_types[monster_type_index].freezing_defense_modifier) {

                defense += (dirty.monster_types[monster_type_index].freezing_defense_modifier * attack_profile.freezing_equipment_count);

            }

            
            if( typeof attack_profile.gravity_equipment_count !== 'undefined' && attack_profile.gravity_equipment_count !== 0 && 
                dirty.monster_types[monster_type_index].gravity_defense_modifier) {

                defense += (dirty.monster_types[monster_type_index].gravity_defense_modifier * attack_profile.gravity_equipment_count);

            }

            if( typeof attack_profile.hacking_equipment_count !== 'undefined' && attack_profile.hacking_equipment_count !== 0 && 
                dirty.monster_types[monster_type_index].hacking_defense_modifier) {

                defense += (dirty.monster_types[monster_type_index].hacking_defense_modifier * attack_profile.hacking_equipment_count);

            }

            
            if( typeof attack_profile.heat_equipment_count !== 'undefined' && attack_profile.heat_equipment_count !== 0 && 
                dirty.monster_types[monster_type_index].heat_defense_modifier) {

                defense += (dirty.monster_types[monster_type_index].heat_defense_modifier * attack_profile.heat_equipment_count);

            }

            
            if( typeof attack_profile.laser_equipment_count !== 'undefined' && attack_profile.laser_equipment_count !== 0 && 
                dirty.monster_types[monster_type_index].laser_defense_modifier) {

                defense += (dirty.monster_types[monster_type_index].laser_defense_modifier * attack_profile.laser_equipment_count);

            }

            
            if( typeof attack_profile.melee_equipment_count !== 'undefined' && attack_profile.melee_equipment_count !== 0 && 
                dirty.monster_types[monster_type_index].melee_defense_modifier) {

                defense += (dirty.monster_types[monster_type_index].melee_defense_modifier * attack_profile.melee_equipment_count);

            }

            if( typeof attack_profile.piercing_equipment_count !== 'undefined' && attack_profile.piercing_equipment_count !== 0 && 
                dirty.monster_types[monster_type_index].piercing_defense_modifier) {
                    
                defense += (dirty.monster_types[monster_type_index].piercing_defense_modifier * attack_profile.piercing_equipment_count);
            }

            
            if( typeof attack_profile.plasma_equipment_count !== 'undefined' && attack_profile.plasma_equipment_count !== 0 && 
                dirty.monster_types[monster_type_index].plasma_defense_modifier) {

                defense += (dirty.monster_types[monster_type_index].plasma_defense_modifier * attack_profile.plasma_equipment_count);

            }

            
            if( typeof attack_profile.poison_equipment_count !== 'undefined' && attack_profile.poison_equipment_count !== 0 && 
                dirty.monster_types[monster_type_index].poison_defense_modifier) {

                defense += (dirty.monster_types[monster_type_index].poison_defense_modifier * attack_profile.poison_equipment_count);

            }

            
            if( typeof attack_profile.radiation_equipment_count !== 'undefined' && attack_profile.radiation_equipment_count !== 0 && 
                dirty.monster_types[monster_type_index].radiation_defense_modifier) {

                defense += (dirty.monster_types[monster_type_index].radiation_defense_modifier * attack_profile.radiation_equipment_count);

            }

        } else if(damage_types.length > 0) {


            for(let i = 0; i < damage_types.length; i++) {

                if(damage_types[i] === 'hacking' && dirty.monster_types[monster_type_index].hacking_defense_modifier) {
                    defense += dirty.monster_types[monster_type_index].hacking_defense_modifier;
                }

                if(damage_types[i] === 'piercing' && dirty.monster_types[monster_type_index].piercing_defense_modifier) {
                    defense += dirty.monster_types[monster_type_index].piercing_defense_modifier;
                }
            }


        }

        return defense;


    } catch(error) {
        log(chalk.red("Error in monster.calculateDefense: " + error));
        console.error(error);
    }


}

exports.calculateDefense = calculateDefense;


/**
 * Returns whether a monster can be placed on a coord
 *
 * @param {Object} dirty
 * @param {string} scope - The view
 * @param {Object} coord - The coord
 * @param {Object} data
 * @param {number=} data.monster_index - Array index of the monster
 * @param {number=} data.monster_type_id - Monster type id if we don't have a monster to pull from already
 * @param {Boolean=} data.event_provides_floor - If the event is going to provide a floor
 * @returns {Promise<boolean>}
 */
async function canPlace(dirty, scope, coord, data) {
    try {


        if(helper.isFalse(coord)) {
            log(chalk.yellow("Invalid coord passed into monster.canPlace"));
            console.trace("trace it!");
        }

        let debug_monster_type_id = 0;

        let checking_coords = [];

        // we need to have an object type id
        let monster_type_id = 0;

        // We can pass it in directly
        if(typeof data.monster_type_id !== "undefined") {
            monster_type_id = data.monster_type_id;
        }

        // Or grab it from an object being passed in
        if(typeof data.monster_index !== 'undefined') {
            monster_type_id = dirty.monsters[data.monster_index].monster_type_id;
        }

        if(monster_type_id === 0) {
            log(chalk.yellow("Need a monster type!"));
            console.trace("here");
            return false;
        }

        let monster_type_index = main.getMonsterTypeIndex(monster_type_id);
        

        if(monster_type_index === -1) {
            log(chalk.yellow("Could not find that monster type. data.monster_index: " + data.monster_index + " data.monster_type_id: " + data.monster_type_id));

            return false;
        }


        /************** COLLECT ALL THE COORDS ********************/
        let last_x = coord.tile_x + dirty.monster_types[monster_type_index].movement_tile_width - 1;
        let last_y = coord.tile_y + dirty.monster_types[monster_type_index].movement_tile_height - 1;

        for(let x = coord.tile_x; x <= last_x; x++) {
            for(let y = coord.tile_y; y <= last_y; y++) {


                let checking_coord_index = -1;
                if(scope === 'galaxy') {
                    checking_coord_index = await main.getCoordIndex({ 'tile_x': x, 'tile_y': y });

                    if(checking_coord_index !== -1) {
                        checking_coords.push(dirty.coords[checking_coord_index]);
                    }
                } else if(scope === 'planet') {
                    checking_coord_index = await main.getPlanetCoordIndex({ 'planet_id': coord.planet_id,
                        'planet_level': coord.level, 'tile_x': x, 'tile_y': y });

                    if(checking_coord_index !== -1) {
                        checking_coords.push(dirty.planet_coords[checking_coord_index]);
                    }
                } else if(scope === 'ship') {
                    checking_coord_index = await main.getShipCoordIndex({ 'ship_id': coord.ship_id,
                        'level': coord.level,
                        'tile_x': x, 'tile_y': y });

                    if(checking_coord_index !== -1) {
                        checking_coords.push(dirty.ship_coords[checking_coord_index]);
                    }
                }

                // We weren't able to find all the coords we needed to match up to all the display linkers
                if(checking_coord_index === -1) {

                    if(debug_monster_type_id === monster_type_id) {
                        log(chalk.yellow("Was unable to find coord at tile_x,tile_y: " + x + "," + y));
                    }
                    return false;
                }


            }
        }



        /********************** GO THROUGH EACH OF THE COORDS ***********************/
        for(let checking_coord of checking_coords) {

            if(checking_coord.npc_id || checking_coord.player_id) {
                if(debug_monster_type_id === monster_type_id) {
                    log(chalk.yellow("Blocked by player or npc"));
                }
                return false;
            }

            // No monster index passed in - we have to return false if there's another monster at any coord.
            if(typeof data.monster_index === "undefined") {
                if(checking_coord.monster_id || checking_coord.belongs_to_monster_id) {
                    if(debug_monster_type_id === monster_type_id) {
                        log(chalk.yellow("Blocked by monster"));
                    }
                    return false;
                }
            } else {
                if(checking_coord.monster_id && checking_coord.monster_id !== dirty.monsters[data.monster_index].id) {
                    if(debug_monster_type_id === monster_type_id) {
                        log(chalk.yellow("Blocked by monster"));
                    }
                    return false;
                } else if(checking_coord.belongs_to_monster_id && checking_coord.belongs_to_monster_id !== dirty.monsters[data.monster_index].id) {
                    if(debug_monster_type_id === monster_type_id) {
                        log(chalk.yellow("Blocked by monster"));
                    }
                    return false;
                }
            }

            if(checking_coord.object_type_id) {
                let object_type_index = dirty.object_types.findIndex(function(obj) { return obj && obj.id === checking_coord.object_type_id; });

                if(object_type_index !== -1) {
                    if(!dirty.object_types[object_type_index].can_walk_on) {
                        if(debug_monster_type_id === monster_type_id) {
                            log(chalk.yellow("Blocked by object type"));
                        }
                        return false;
                    }

                    // If the object type can have rules, we have to make sure we can go through it (like a door)
                    if(dirty.object_types[object_type_index].can_have_rules && checking_coord.object_id) {

                        let passed_rules = false;

                        for(let r = 0; r < dirty.rules.length; r++) {
                            if(dirty.rules[r] && dirty.rules[r].object_id === checking_coord.object_id) {
                                if(dirty.rules[r].rule === "allow_monsters") {
                                    passed_rules = true;
                                }
                            }
                        }

                        if(!passed_rules) {
                            if(debug_monster_type_id === monster_type_id) {
                                log(chalk.yellow("Did not pass rules"));
                            }
                            return false;
                        }

                    }
                }


            }

            // No matter the coord, if the floor type doesn't allow it, it doesn't allow it
            let floor_type_index = main.getFloorTypeIndex(checking_coord.floor_type_id);

            // Couldn't get the floor type of the coord - that's a false unless an event is creating that coord with a floor
            if(floor_type_index === -1 && typeof data.event_provides_floor === "undefined") {
                if(dirty.monster_types[monster_type_index].id === debug_monster_type_id) {
                    log(chalk.yellow("Can't place monsters on no floor if the placement doesn't provide a floor"));
                }
                return false;
            } else {

                if(!dirty.floor_types[floor_type_index].can_build_on) {

                    if(dirty.monster_types[monster_type_index].id === debug_monster_type_id) {
                        log(chalk.yellow("Can't place monsters on that floor type (Can't build on)"));
                    }
                    return false;
                }
    
                if(dirty.floor_types[floor_type_index].is_protected) {
    
                    if(dirty.monster_types[monster_type_index].id === debug_monster_type_id) {
                        log(chalk.yellow("Can't spawn monster - That floor type is protected"));
                    }
                    return false;
                }
    
            }

            

        }

        if(debug_monster_type_id === monster_type_id) {
            log(chalk.green("Returning true in monster.canPlace on debug monster type id"));
        }

        return true;
    } catch(error) {
        log(chalk.red("Error in monster.canPlace: " + error));
        console.error(error);
    }
}
exports.canPlace = canPlace;



/**
 * @param {Object} dirty
 * @param {number} monster_index
 * @param {number} damage_amount
 * @param {Object} data
 * @param {Array=} data.damage_types
 * @param {Object=} data.battle_linker
 * @param {Object=} data.monster_info
 * @param {number=} data.calculating_range
 * @param {String=} data.damage_source_type
 * @param {number=} data.damage_source_id
 */
async function damage(dirty, monster_index, damage_amount, data) {
    try {

        let monster_type_index = main.getMonsterTypeIndex(dirty.monsters[monster_index].monster_type_id);

        if(monster_type_index === -1) {
            console.log("Couldn't find monster type");
            return false;
        }

        // If we didn't pass in the monster info, grab it now
        if(!data.monster_info) {
            data.monster_info = await getCoordAndRoom(dirty, monster_index);
        }


        if(isNaN(damage_amount)) {
            log(chalk.yellow("Can't damage monster a NaN amount"));
            console.trace("Here's the culprit");
            return false;
        }


        let new_monster_hp = dirty.monsters[monster_index].current_hp - damage_amount;
        //console.log("Calculated new_monster_hp as: " + new_monster_hp + " have calculating_range as: " + data.calculating_range);

        if(!data.damage_types) {
            data.damage_types = [];
        }

        // send new monster info to the room

        // Normally the monster will be attacked through a direct battle linker
        if(data.battle_linker) {

            io.to(data.monster_info.room).emit('damaged_data',
                {'monster_id': dirty.monsters[monster_index].id, 'damage_amount': damage_amount, 'damage_types': data.damage_types,
                    'was_damaged_type': 'hp',
                    'damage_source_type': data.battle_linker.attacking_type, 'damage_source_id': data.battle_linker.attacking_id,
                    'calculating_range': data.calculating_range });
        }
        // But it's also possible it's not directly through a battle linker (splash, AOE damage, decay)
        else if(data.damage_source_type) {


            if(data.damage_source_type === 'decay') {
                io.to(data.monster_info.room).emit('damaged_data',
                    {   'monster_id': dirty.monsters[monster_index].id, 'damage_amount': damage_amount,
                        'damage_types': data.damage_types, 'was_damaged_type': 'hp',
                        'damage_source_type': data.damage_source_type });
            } else {
                io.to(data.monster_info.room).emit('damaged_data',
                    {   'monster_id': dirty.monsters[monster_index].id, 'damage_amount': damage_amount,
                        'damage_types': data.damage_types, 'was_damaged_type': 'hp',
                        'damage_source_type': data.damage_source_type, 'damage_source_id': data.damage_source_id,
                        'calculating_range': data.calculating_range });
            }




            if(data.damage_source_type !== 'decay') {
                // And the monster is going to be PISSED


                //console.log("Damage is not from a battle linker. Lets see if we can attack the source of the damage");

                // If the monster isn't already attacking something, attack the damage source
                let existing_battle_linker_index = dirty.battle_linkers.findIndex(function(obj) { return obj &&
                    obj.attacking_id === dirty.monsters[monster_index].id && obj.attacking_type === 'monster' });

                if(existing_battle_linker_index === -1) {
                    let battle_linker_data = {
                        'attacking_id': dirty.monsters[monster_index].id, 'attacking_type': 'monster',
                        'being_attacked_id': data.damage_source_id, 'being_attacked_type': data.damage_source_type };

                    //console.log("Battle linker data: ");
                    //console.log(battle_linker_data);

                    await world.addBattleLinker(false, dirty, battle_linker_data);
                }
            }

        } else {
            log(chalk.yellow("Should really add in some data about where this damage is coming from"));

        }



        if (new_monster_hp <= 0) {

            //console.log("Monster is killed");


            // It's a player that killed the monster
            if(data.battle_linker && data.battle_linker.attacking_type === 'player') {
                let player_index = await player.getIndex(dirty, { 'player_id': data.battle_linker.attacking_id });
                let previous_exp = dirty.players[player_index].exp;
                //console.log("Adding exp to player");

                if(helper.notFalse(dirty.monster_types[monster_type_index].exp)) {
                    dirty.players[player_index].exp = dirty.players[player_index].exp + dirty.monster_types[monster_type_index].exp;
                    dirty.players[player_index].has_change = true;
                } else {
                    log(chalk.red("BIG ISSUE! Monster type id: " + dirty.monster_types[monster_type_index].id + " gives no exp!"));
                }



                if(helper.isFalse(dirty.players[player_index].exp)) {
                    log(chalk.red("BIG ISSUE! Player just killed monster type id: " + dirty.monster_types[monster_type_index].id + " and has 0 exp!"));
                }

                await game.addKilledLinker(dirty.players[player_index].player_id, dirty.monsters[monster_index].monster_type_id);

                //console.log("Should be calling game.checkExp");
                game.checkExp(false, dirty, player_index, previous_exp);

                if(dirty.monster_types[monster_type_index].race_id) {

                    let race_index = main.getRaceIndex(dirty.monster_types[monster_type_index].race_id);

                    // lets modify the player's relationship with that race
                    await world.updatePlayerRelationship(io.sockets.connected[data.battle_linker.socket_id], dirty, player_index,
                        { 'type': 'race', 'type_index': race_index, 'change': -1 });

                }

                //let player_log_message = "";
                //world.addPlayerLog(dirty, player_index, dirty.players[player_index].name + " killed a " + dirty.monster_types[monster_type_index].name);
            }

            //console.log("Calling deleteMonster with monster index: " + monster_index);
            if(typeof data.battle_linker !== 'undefined' && data.battle_linker.attacking_type === 'player') {
                await deleteMonster(dirty, monster_index, { 'reason': 'battle', 'battle_linker': data.battle_linker,
                'reason_type': 'player', 'reason_id': data.battle_linker.attacking_id });
            } else {
                await deleteMonster(dirty, monster_index, { 'reason': 'battle', 'battle_linker': data.battle_linker });
            }
            
            //console.log("Done with deleteMonster");

        } else {
            //console.log("monster not dead yet");

            if(isNaN(new_monster_hp)) {
                log(chalk.red("We tried setting the monster's current hp to a NaN value: " + new_monster_hp));
            } else {
                dirty.monsters[monster_index].current_hp = new_monster_hp;
                dirty.monsters[monster_index].has_change = true;

                // send the monster info to players in the room
                io.to(data.monster_info.room).emit('monster_info', { 'monster': dirty.monsters[monster_index]});
            }



        }

    } catch(error) {
        log(chalk.red("Error in monster.damage: " + error));
        console.error(error);
    }
}

exports.damage = damage;

// monster_index   |   reason   |   skip_check_spawned_event
/**
 * @param {Object} dirty
 * @param {number} monster_index
 * @param {Object} data
 * @param {String=} data.reason
 * @param {boolean=} data.skip_check_spawned_event
 * @param {Object=} data.battle_linker
 * @param {String=} data.reason_type
 * @param {number=} data.reason_id
 */
async function deleteMonster(dirty, monster_index, data = {}) {

    try {

        //console.log("In deleteMonster");

        if(!dirty.monsters[monster_index]) {
            log(chalk.yellow("Could not find the monster we are deleting. Monster index: " + monster_index));
            return false;
        }


        //log(chalk.yellow("MONSTER IS DEAD"));

        let monster_type_index = dirty.monster_types.findIndex(function(obj) { return obj && obj.id === dirty.monsters[monster_index].monster_type_id; });
        let planet_index = -1;


        if(monster_type_index === -1) {
            log(chalk.yellow("Could not find monster type for monster"));
            return false;
        }

        let monster_info = await getCoordAndRoom(dirty, monster_index);

        // No battle linker was passed in - something like decay could have killed this monster
        // But that doesn't mean it isn't engaged in battle. See if there is a relevant battle linker
        // Currently this is only for AI based monsters - I can't immediately think of a scenario that would warrant this 
        // for normal monsters
        if(typeof data.battle_linker === "undefined" && (dirty.monsters[monster_index].monster_type_id === 33 || 
            dirty.monsters[monster_index].monster_type_id === 57 || dirty.monsters[monster_index].monster_type_id === 107) ) {
            let battle_linker_index = dirty.battle_linkers.findIndex(function(obj) { return obj && obj.attacking_type === 'monster' && obj.attacking_id == dirty.monsters[monster_index].id; });
            if(battle_linker_index !== -1) {
                console.log("Monster died of something like decay, but we found a battle linker for this AI based monster");
                data.battle_linker = dirty.battle_linkers[battle_linker_index];
            }
        }



        // If the monster is associate with a coord, remove it from that coord
        if(monster_info.scope === 'galaxy') {
            await main.updateCoordGeneric(false, { 'coord_index': monster_info.coord_index, 'monster_id': false });
        } else if(monster_info.scope === 'planet') {
            await main.updateCoordGeneric(false, { 'planet_coord_index': monster_info.coord_index, 'monster_id': false });
            planet_index = await planet.getIndex(dirty, { 'planet_id': monster_info.coord.planet_id });
        } else if(monster_info.scope === 'ship') {
            await main.updateCoordGeneric(false, { 'ship_coord_index': monster_info.coord_index, 'monster_id': false });
            console.log("Updated ship coord to no object_id");
        }


        // If the monster has a movement_tile_width or movement_tile_height > 1, we need to go through the coords and remove any belongs_to_monster_id
        if(dirty.monster_types[monster_type_index].movement_tile_width > 1 || dirty.monster_types[monster_type_index].movement_tile_height > 1) {
            console.time("removeMonsterBelongs");

            if(monster_info.scope === 'galaxy') {

                for(let g = 0; g < dirty.coords.length; g++) {
                    if(dirty.coords[g] && dirty.coords[g].belongs_to_monster_id === dirty.monsters[monster_index].id) {
                        await main.updateCoordGeneric(false, { 'coord_index': g, 'belongs_to_monster_id': false });
                    }
                }

            } else if(monster_info.scope === 'planet') {

                for(let p = 0; p < dirty.planet_coords.length; p++) {
                    if(dirty.planet_coords[p] && dirty.planet_coords[p].belongs_to_monster_id === dirty.monsters[monster_index].id) {
                        await main.updateCoordGeneric(false, { 'planet_coord_index': p, 'belongs_to_monster_id': false });
                    }
                }

            } else if(monster_info.scope === 'ship') {

                for(let s = 0; s < dirty.ship_coords.length; s++) {
                    if(dirty.ship_coords[s] && dirty.ship_coords[s].belongs_to_monster_id === dirty.monsters[monster_index].id) {
                        await main.updateCoordGeneric(false, { 'ship_coord_index': s, 'belongs_to_monster_id': false });
                    }
                }

            }

            console.timeEnd("removeMonsterBelongs");


        }


        world.removeBattleLinkers(dirty, {'monster_id': dirty.monsters[monster_index].id });




        // grab the drop linkers for the monster type
        //console.log("Getting all drop linkers for monster type id: " + dirty.monster_types[monster_type_index].id);
        if(monster_info.coord_index !== -1) {
            let drop_linkers = dirty.drop_linkers.filter(drop_linker => drop_linker.monster_type_id === dirty.monster_types[monster_type_index].id);
            if(drop_linkers.length > 0) {
    
                // get a random drop linker - and it will drop that
                let drop_linker = drop_linkers[Math.floor(Math.random() * drop_linkers.length)];
                //console.log("Going to drop object_type_id: " + drop_linker.dropped_object_type_id);
    
    
                let drop_success = await placeDrop(dirty, monster_info.scope, drop_linker, monster_info.coord_index);
    
                if(drop_success === false && monster_info.coord.left_coord_index !== -1) {
                    drop_success = await placeDrop(dirty, monster_info.scope, drop_linker, monster_info.coord.left_coord_index);
                }
    
                if(drop_success === false && monster_info.coord.right_coord_index !== -1) {
                    drop_success = await placeDrop(dirty, monster_info.scope, drop_linker, monster_info.coord.right_coord_index);
                }
    
               
                if(drop_success === false) {
                    log(chalk.green("Put something in the waiting drops!"));
                    // We... couldn't find a spot!
                    if(monster_info.scope === "planet") {
                        dirty.waiting_drops.push({'object_type_id': drop_linker.dropped_object_type_id, 'amount': drop_linker.amount, 'planet_coord_index': monster_info.coord_index });
                    } else if(monster_info.scope === "ship") {
                        dirty.waiting_drops.push({'object_type_id': drop_linker.dropped_object_type_id, 'amount': drop_linker.amount, 'ship_coord_index': monster_info.coord_index });
                    }
    
                }
    
    
            } else {
                //console.log("Monster type id: " + dirty.monster_types[monster_type_index].id + " doesn't drop anything");
            }
        } else {
            console.log("Did not try and drop anything for monster id: " + dirty.monsters[monster_index].id + " because we could not find the coord it is on");
        }
        




        // an idea.. probably best to do it immediately
        //dirty.monsters[monster_index].is_dead = true;
        //dirty.monsters[monsteR_index].has_change = true;

        let monster_id = dirty.monsters[monster_index].id;


        // If a planet coord spawned the monster, we can update that to false
        //console.log("Going to set spawned monster id to false");
        // TODO I believe I can deprecate this - and in fact if I can't, I should do it differently
        if(monster_info.scope === 'planet') {
            let spawned_monster_planet_coord_index = await main.getPlanetCoordIndex({'spawned_monster_id': dirty.monsters[monster_index].id });
            if(spawned_monster_planet_coord_index !== -1) {
                dirty.planet_coords[spawned_monster_planet_coord_index].spawned_monster_id = false;
                dirty.planet_coords[spawned_monster_planet_coord_index].has_change = true;
            }
        } else if(monster_info.scope === 'ship') {
            let spawned_monster_ship_coord_index = await main.getShipCoordIndex({'spawned_monster_id': dirty.monsters[monster_index].id });
            if(spawned_monster_ship_coord_index !== -1) {
                dirty.ship_coords[spawned_monster_ship_coord_index].spawned_monster_id = false;
                dirty.ship_coords[spawned_monster_ship_coord_index].has_change = true;
            }
        }
        

        let check_spawned_event_id = 0;
        if(dirty.monsters[monster_index].spawned_event_id) {
            check_spawned_event_id = dirty.monsters[monster_index].spawned_event_id;
        }

        // Trying to not await due to time delay from MySQL
        (pool.query("DELETE FROM monsters WHERE id = ?", [dirty.monsters[monster_index].id]));

        delete dirty.monsters[monster_index];



        //log(chalk.yellow("Sending to anyone on planet to remove monster"));
        io.to(monster_info.room).emit('monster_info',
            { 'monster': { 'id': monster_id }, 'remove': true });




        // If this monster was spawned from an AI, we will have the AI escalate if it's able to
        // If we are an AI Daemon, we attempt to spawn the next level of AI helper, the AI....
        if( (dirty.monster_types[monster_type_index].id === 33 || dirty.monster_types[monster_type_index].id === 57) && helper.notFalse(data.battle_linker)) {
            log(chalk.cyan("AI is trying to advance attack/defense to the next level due to daemon death"));

            let ai_id = 0;

            if(monster_info.scope === "planet") {
                let planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.planet_coords[monster_info.coord_index].planet_id, 'source': 'game.deleteMonster' });
                ai_id = dirty.planets[planet_index].ai_id;

                if(data.battle_linker.attacking_type === "monster") {
                    // and try and attack the attacking player - WHO IS THE ATTACKER IN THIS FUNCTION
                    let attack_data = {
                        'ai_id': ai_id,
                        'attacking_type': data.battle_linker.being_attacked_type,
                        'attacking_id': data.battle_linker.being_attacked_id,
                        'attack_level': 2
                    };

                    await world.aiAttack(dirty, attack_data);
                } else {
                    // and try and attack the attacking player - WHO IS THE ATTACKER IN THIS FUNCTION
                    let attack_data = {
                        'ai_id': ai_id,
                        'attacking_type': data.battle_linker.attacking_type,
                        'attacking_id': data.battle_linker.attacking_id,
                        'attack_level': 2
                    };

                    await world.aiAttack(dirty, attack_data);
                }



            } else if(monster_info.scope === "ship") {
                let ship_index = await game_object.getIndex(dirty, dirty.ship_coords[monster_info.coord_index].ship_id);
                ai_id = dirty.objects[ship_index].ai_id;

                // and try and attack the attacking player
                let attack_data = {
                    'ai_id': ai_id,
                    'attacking_type': data.battle_linker.attacking_type,
                    'attacking_id': data.battle_linker.attacking_id,
                    'attack_level': 2
                };

                await world.aiAttack(dirty, attack_data);
            }

        }

        if(check_spawned_event_id !== 0 && typeof data.skip_check_spawned_event === 'undefined') {
            console.log("Monster was part of a spawned event");

            let spawned_event_index = dirty.spawned_events.findIndex(function(obj) { return obj && obj.id === check_spawned_event_id; });
            if(spawned_event_index !== -1 && planet_index !== -1) {
                console.log("Have the information we need to see if we modify the regular monster count");
                // We need to get the planet event linker to see if this was a regular monster spawn
                let planet_event_linker_index = dirty.planet_event_linkers.findIndex(function(obj) { return obj && 
                    obj.event_id === dirty.spawned_events[spawned_event_index].event_id && obj.planet_type_id === dirty.planets[planet_index].planet_type_id; });

                if(planet_event_linker_index !== -1 && dirty.planet_event_linkers[planet_event_linker_index].is_regular_monster_spawn) {
                    dirty.planets[planet_index].current_regular_monster_count--;
                    console.log("Reduced the current regular monster count on planet to: " + dirty.planets[planet_index].current_regular_monster_count);

                } else {
                    console.log("Did not reduce planet's regular monster count");
                }
            }

            let check_spawned_event_data = { 'reason': 'deletemonster' };
            if(typeof data.reason_type !== 'undefined') {
                check_spawned_event_data.reason_type = data.reason_type;
            }

            if(typeof data.reason_id !== 'undefined') {
                check_spawned_event_data.reason_id = data.reason_id;
            }

            await event.checkSpawnedEvent(dirty, check_spawned_event_id, check_spawned_event_data);
        }


    } catch(error) {
        log(chalk.red("Error in monster.deleteMonster: " + error));
        console.error(error);
    }



}

exports.deleteMonster = deleteMonster;


async function fix(dirty, monster_index) {

    try {

        console.log("Server thinks it needs to fix monster id: " + dirty.monsters[monster_index].id);

        if(!dirty.monsters[monster_index].room) {
            await getCoordAndRoom(dirty, monster_index);

            // The coord we are supposed to be on doesn't exist!
            if(!dirty.monsters[monster_index].room) {

                if(dirty.monsters[monster_index].ship_coord_id) {
                    console.log("Monster's ship_coord id: " + dirty.monsters[monster_index].ship_coord_id + " doesn't seem to exist anymore");
                    deleteMonster(dirty, monster_index);

                } else if(dirty.monsters[monster_index].planet_coord_id) {
                    console.log("Monster's planet_coord id: " + dirty.monsters[monster_index].planet_coord_id + " doesn't seem to exist anymore");
                    deleteMonster(dirty, monster_index);
                } else if(dirty.monsters[monster_index].coord_id) {
                    console.log("Monster's coord id: " + dirty.monsters[monster_index].coord_id + " doesn't seem to exist anymore");
                    deleteMonster(dirty, monster_index);
                }
                
                else {
                    console.log("Monster did not have a galaxy, ship or planet coord? Just deleting");
                    deleteMonster(dirty, monster_index);
                }

            }

        }

    } catch(error) {
        log(chalk.red("Error in monster.fix: " + error));
        console.error(error);
    }
}

exports.fix = fix;


async function getCoordAndRoom(dirty, monster_index) {

    try {

        let room = "";
        let coord_index = -1;
        let scope = "";
        let coord = {};

        // Monster isn't here
        if(!dirty.monsters[monster_index]) {
            log(chalk.yellow("Trying to get a monster that we couldn't find (being deleted?). monster_index: " + monster_index));
            return { 'room': room, 'coord_index': coord_index, 'coord': coord, 'scope': scope };
        }

        if(dirty.monsters[monster_index].coord_id) {
            coord_index = await main.getCoordIndex(
                { 'coord_id': dirty.monsters[monster_index].coord_id });
            if(coord_index !== -1) {
                room = "galaxy";
                scope = "galaxy";
                coord = dirty.coords[coord_index];
            }
        }

        if(dirty.monsters[monster_index].planet_coord_id) {

            coord_index = await getCoordIndex(dirty, monster_index, 'planet');

            if(coord_index !== -1) {
                room = "planet_" + dirty.planet_coords[coord_index].planet_id;
                scope = "planet";
                coord = dirty.planet_coords[coord_index];
            }

        } else if(dirty.monsters[monster_index].ship_coord_id) {

            coord_index = await getCoordIndex(dirty, monster_index, 'ship');

            if(coord_index !== -1 && dirty.ship_coords[coord_index]) {
                room = "ship_" + dirty.ship_coords[coord_index].ship_id;
                scope = "ship";
                coord = dirty.ship_coords[coord_index];
            } else if(coord_index !== -1 && !dirty.ship_coords[coord_index]) {
                log(chalk.yellow("Looks like a monster, id: " +  dirty.monsters[monster_index].id + " has an outdated ship coord index"));
                dirty.monsters[monster_index].ship_coord_index = -1;
            }
        } else if(dirty.monsters[monster_index].coord_id) {

            coord_index = await getCoordIndex(dirty, monster_index, 'galaxy');

            if(coord_index !== -1) {
                room = "galaxy";
                scope = "galaxy";
                coord = dirty.coords[coord_index];
            }
            
        }

        // Monsters should all have a room attribute
        if(dirty.monsters[monster_index].room !== room) {
            dirty.monsters[monster_index].room = room;
        }

        return { 'room': room, 'coord_index': coord_index, 'coord': coord, 'scope': scope };
    } catch(error) {
        log(chalk.red("Error in monster.getCoordAndRoom: " + error));
        console.error(error);
    }

}

exports.getCoordAndRoom = getCoordAndRoom;

// The point of this function is to transition to using a planet_coord_index|ship_coord_index|coord_index on the game monster
// Most of the code in here is basically error checking while we transition. We can't trust the indexes yet, so issue warnings
// when they would have been wrong, or something wasn't updated
// scope is basically for the same thing. We shouldn't technically need it if we're updating the monsters properly
async function getCoordIndex(dirty, monster_index, scope) {
    try {

        if(scope === 'planet') {

            if(typeof dirty.monsters[monster_index].coord_index !== 'undefined' && dirty.monsters[monster_index].coord_index !== -1) {
                log(chalk.yellow("Getting planet coord index for monster, but it looks like it has a coord_index too!"));
            }

            if(typeof dirty.monsters[monster_index].ship_coord_index !== 'undefined' && dirty.monsters[monster_index].ship_coord_index !== -1) {
                log(chalk.yellow("Getting planet coord index for monster, but it looks like it has a ship_coord_index too!"));
            }

            if(typeof dirty.monsters[monster_index].planet_coord_index === 'undefined') {
                log(chalk.yellow("in game_monster.getCoordIndex. planet_coord_index was undefined still"));
                return await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.monsters[monster_index].planet_coord_id });
            
            }
            return dirty.monsters[monster_index].planet_coord_index;

            let planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.monsters[monster_index].planet_coord_id });

            if(typeof dirty.monsters[monster_index].planet_coord_index !== 'undefined' && dirty.monsters[monster_index].planet_coord_index !== -1) {
                if(dirty.planet_coords[dirty.monsters[monster_index].planet_coord_index].id !== dirty.planet_coords[planet_coord_index].id) {
                    log(chalk.yellow("monster had a planet coord index, but it was out of date"));
                }

            }

            return planet_coord_index;


        } else if(scope === 'ship') {
            
            if(typeof dirty.monsters[monster_index].coord_index !== 'undefined' && dirty.monsters[monster_index].coord_index !== -1) {
                log(chalk.yellow("Getting planet coord index for monster, but it looks like it has a coord_index too!"));
            }

            if(typeof dirty.monsters[monster_index].planet_coord_index !== 'undefined' && dirty.monsters[monster_index].planet_coord_index !== -1) {
                log(chalk.yellow("Getting ship coord index for monster, but it looks like it has a planet_coord_index too!"));
            }

            if(typeof dirty.monsters[monster_index].ship_coord_index === 'undefined') {
                log(chalk.yellow("in game_monster.getCoordIndex. ship_coord_index was undefined still"));
                return await main.getShipCoordIndex({ 'ship_coord_id': dirty.monsters[monster_index].ship_coord_id });
            
            }
            
            return dirty.monsters[monster_index].ship_coord_index;

            let ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.monsters[monster_index].ship_coord_id });

            if(typeof dirty.monsters[monster_index].ship_coord_index !== 'undefined' && dirty.monsters[monster_index].ship_coord_index !== -1) {
                if(dirty.ship_coords[dirty.monsters[monster_index].ship_coord_index].id !== dirty.ship_coords[ship_coord_index].id) {
                    log(chalk.yellow("monster had a planet coord index, but it was out of date"));
                }

            }

            return ship_coord_index;


        } else if(scope === 'galaxy') {
            if(typeof dirty.monsters[monster_index].ship_coord_index !== 'undefined' && dirty.monsters[monster_index].ship_coord_index !== -1) {
                log(chalk.yellow("Getting coord index (galaxy) for monster, but it looks like it has a ship_coord_index too!"));
            }

            if(typeof dirty.monsters[monster_index].planet_coord_index !== 'undefined' && dirty.monsters[monster_index].planet_coord_index !== -1) {
                log(chalk.yellow("Getting coord index (galaxy) for monster, but it looks like it has a planet_coord_index too!"));
            }

            if(typeof dirty.monsters[monster_index].coord_index === 'undefined') {
                log(chalk.yellow("in game_monster.getCoordIndex. coord_index was undefined still"));
                return await main.getCoordIndex({ 'coord_id': dirty.monsters[monster_index].coord_id });
            
            }
            
            return dirty.monsters[monster_index].coord_index;


            let coord_index = await main.getCoordIndex({ 'coord_id': dirty.monsters[monster_index].coord_id });

            if(typeof dirty.monsters[monster_index].coord_index !== 'undefined' && dirty.monsters[monster_index].coord_index !== -1) {
                if(dirty.coords[dirty.monsters[monster_index].coord_index].id !== dirty.coords[coord_index].id) {
                    log(chalk.yellow("monster had a coord index (galaxy), but it was out of date"));
                }

            }

            return coord_index;
        }

        

    } catch(error) {
        log(chalk.red("Error in game_monster.getCoordIndex: " + error));
        console.error(error);
    }
}

exports.getCoordIndex = getCoordIndex;


async function getIndex(dirty, monster_id) {


    try {

        monster_id = parseInt(monster_id);

        if(monster_id === 0 || isNaN(monster_id)) {
            log(chalk.yellow("0 or NaN sent into monster.getIndex"));
            return -1;
        }

        //console.log("In monster.getIndex. Seeing if we have monster with id: " + monster_id);

        let monster_index = dirty.monsters.findIndex(function(obj) { return obj && obj && obj.id === monster_id; });

        if(monster_index === -1) {
            //console.log("Did not find monster id: " + monster_id + " in dirty");

            try {
                let [rows, fields] = await (pool.query("SELECT * FROM monsters WHERE id = ?",
                    [monster_id]));

                if(rows[0]) {
                    let adding_monster = rows[0];
                    adding_monster.has_change = false;


                    // Since MySQL is slow - we re-check to make sure we didn't already add the monster
                    monster_index = dirty.monsters.findIndex(function(obj) { return obj && obj.id === parseInt(monster_id); });
                    if(monster_index !== -1) {
                        log(chalk.yellow("Looks like we already added the monster"));
                    } else {
                        //console.log("Adding monster id: " + monster.id);
                        monster_index = dirty.monsters.push(adding_monster) - 1;

                        // Make sure the id is an int
                        dirty.monsters[monster_index].id = parseInt(dirty.monsters[monster_index].id);
                        //console.log("Pushed new monster to dirty. monster_index: " + monster_index);


                        // the monster is associated with an AI
                        if(adding_monster.object_id) {
                            //console.log("Monster has object id - grabbing that: " + monster.object_id);
                            await game_object.getIndex(dirty, adding_monster.object_id);
                        }

                        // and associate the monster with a room and coord index
                        if(dirty.monsters[monster_index].planet_coord_id) {
                            let planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.monsters[monster_index].planet_coord_id });
                            if(planet_coord_index !== -1) {
                                dirty.monsters[monster_index].planet_coord_index = planet_coord_index;
                                dirty.monsters[monster_index].room = "planet_" + dirty.planet_coords[planet_coord_index].planet_id;
                            } else {

                                // The monster's planet coord LITERALLY does not exist
                                log(chalk.yellow("Deleting monster id: " + dirty.monsters[monster_index].id));
                                await deleteMonster(dirty, monster_index);

                            }
                        } else if(dirty.monsters[monster_index].ship_coord_id) {
                            let ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.monsters[monster_index].ship_coord_id });
                            if(ship_coord_index !== -1) {
                                dirty.monsters[monster_index].ship_coord_index = ship_coord_index;
                                dirty.monsters[monster_index].room = "ship_" + dirty.ship_coords[ship_coord_index].ship_id;
                            }
                        } else if(dirty.monsters[monster_index].coord_id) {
                            let coord_index = await main.getCoordIndex({ 'coord_id': dirty.monsters[monster_index].coord_id });
                            if(coord_index !== -1) {
                                dirty.monsters[monster_index].coord_index = coord_index;
                                dirty.monsters[monster_index].room = "galaxy";
                            }
                        }
                    }




                    return monster_index;

                }
            } catch(error) {
                console.error("Unable to get monster from database: " + error);
            }

        } else {
            //console.log("Found monster");
        }

        //console.log("Returning: " + monster_index);

        return monster_index;
    } catch(error) {
        log(chalk.red("Error in monster.getIndex: " + error));
        console.error(error);
    }


}

exports.getIndex = getIndex;

/**
 *
 * @param dirty
 * @param {number} i - Monster Index
 * @param {Object} data
 * @param {number=} data.monster_type_index
 * @param {Object=} data.battle_linker
 * @param {string=} data.reason
 * @returns {Promise<boolean>}
 */
async function move(dirty, i, data) {

    try {


        let battle_linker_index = dirty.battle_linkers.findIndex(function(obj) {
            return obj && obj.attacking_type === 'monster' && obj.attacking_id === dirty.monsters[i].id;
        });

        // make sure the monster isn't attacking something if this is an idle movement
        if(data.reason === 'idle' && battle_linker_index !== -1) {
            return false;
        }



        /************ STEP 1. DETERMINE THE DESTINATION COORD!!!!!! *****************/
        let new_x = -1;
        let new_y = -1;
        let old_coord = {};
        let old_coord_index = -1;
        let scope;
        let room;
        let planet_coord_index = -1;
        let attacking_coord = {};
        let attacking_coord_index = -1;



        // Get the current coord the monster is on
        if(dirty.monsters[i].planet_coord_id) {

            if(typeof dirty.monsters[i].planet_coord_index !== "undefined") {
                planet_coord_index = dirty.monsters[i].planet_coord_index;
            } else {
                planet_coord_index = await main.getPlanetCoordIndex(
                    { 'planet_coord_id': dirty.monsters[i].planet_coord_id });
    
                if(planet_coord_index === -1) {
                    return false;
                }
            }

           

            old_coord = dirty.planet_coords[planet_coord_index];
            old_coord_index = planet_coord_index;
            scope = 'planet';
            room = "planet_" + old_coord.planet_id;
        } else if(dirty.monsters[i].ship_coord_id) {
            let ship_coord_index = await main.getShipCoordIndex(
                { 'ship_coord_id': dirty.monsters[i].ship_coord_id });

            if(ship_coord_index === -1) {
                return false;
            }

            old_coord = dirty.ship_coords[ship_coord_index];
            old_coord_index = ship_coord_index;
            scope = 'ship';
            room = "ship_" + old_coord.ship_id;
        } else if(dirty.monsters[i].coord_id) {
            let coord_index = await main.getCoordIndex(
                { 'coord_id': dirty.monsters[i].coord_id });

            if(coord_index === -1) {
                return false;
            }

            old_coord = dirty.coords[coord_index];
            old_coord_index = coord_index;
            scope = 'galaxy';
            room = "galaxy";
        }


        // Get the destination coord
        let new_coord_index = -1;
        let new_coord = {};


        // If we already have a path, we just use that!
        if(typeof dirty.monsters[i].path !== "undefined" && dirty.monsters[i].path[0]) {

            new_x = dirty.monsters[i].path[0][0];
            new_y = dirty.monsters[i].path[0][1];
            //console.log("Reading from path to send monster to x,y: " + new_x + "," + new_y);


            // Remove the part of the path we just used
            dirty.monsters[i].path.splice(0, 1);

        } else {

            let change_x = -1;
            let change_y = -1;


            if(data.reason === 'idle' && (dirty.monster_types[data.monster_type_index].idle_movement_type === 'default' ||
                !dirty.monster_types[data.monster_type_index].idle_movement_type)) {

                //console.log("Doing idle movement");
                // get a random x/y around this coord


                if (helper.getRandomIntInclusive(0, 1) === 1) {
                    change_x = 1;
                }

                if (helper.getRandomIntInclusive(0, 1) === 1) {
                    change_y = 1;
                }

                // randomly set one to 0 - so we aren't moving diagonal
                if (helper.getRandomIntInclusive(0, 1) === 1) {
                    change_x = 0;
                } else {
                    change_y = 0;
                }

                new_x = old_coord.tile_x + change_x;
                new_y = old_coord.tile_y + change_y;
            } else if(data.reason === 'battle') {
                //console.log("Doing battle move");

                // get the thing the monster is attacking

                if(data.battle_linker.being_attacked_type === 'player') {
                    let player_index = await player.getIndex(dirty, { 'player_id': data.battle_linker.being_attacked_id });

                    if(dirty.players[player_index].planet_coord_id) {
                        let player_planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.players[player_index].planet_coord_id });
                        attacking_coord = dirty.planet_coords[player_planet_coord_index];
                        attacking_coord_index = player_planet_coord_index;
                    } else if(dirty.players[player_index].ship_coord_id) {
                        let player_ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.players[player_index].ship_coord_id });
                        attacking_coord = dirty.ship_coords[player_ship_coord_index];
                        attacking_coord_index = player_ship_coord_index;
                    }
                } else if(data.battle_linker.being_attacked_type === 'object') {
                    let object_index = await game_object.getIndex(dirty, data.battle_linker.being_attacked_id);

                    if(dirty.objects[object_index].planet_coord_id) {
                        let object_planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.objects[object_index].planet_coord_id });
                        attacking_coord = dirty.planet_coords[object_planet_coord_index];
                        attacking_coord_index = object_planet_coord_index;
                    } else if(dirty.objects[object_index].ship_coord_id) {
                        let object_ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.objects[object_index].ship_coord_id });
                        attacking_coord = dirty.ship_coords[object_ship_coord_index];
                        attacking_coord_index = object_ship_coord_index;
                    } else if(dirty.objects[object_index].coord_id) {
                        let object_coord_index = await main.getCoordIndex({ 'coord_id': dirty.objects[object_index].coord_id });
                        attacking_coord = dirty.coords[object_coord_index];
                        attacking_coord_index = object_coord_index;
                    }
                }

                let x_difference = main.diff(attacking_coord.tile_x, old_coord.tile_x);
                let y_difference = main.diff(attacking_coord.tile_y, old_coord.tile_y);

                // Monsters that move closer won't need to move any closer
                if(x_difference <= 1 && y_difference <= 1 && dirty.monster_types[data.monster_type_index].attack_movement_type !== 'warp_away' && 
                    dirty.monster_types[data.monster_type_index].attack_movement_type !== 'move_away') {
                    return;
                }


                if( dirty.monster_types[data.monster_type_index].attack_movement_type === 'default' ||
                    !dirty.monster_types[data.monster_type_index].attack_movement_type ) {

                    let rand_move = helper.getRandomIntInclusive(1,2);

                    if(x_difference !== 0 && rand_move === 1) {
                        if(attacking_coord.tile_x > old_coord.tile_x) {
                            new_x = old_coord.tile_x + 1;
                            change_x = 1;
                        } else {
                            new_x = old_coord.tile_x - 1;
                            change_x = -1;
                        }

                        new_y = old_coord.tile_y;
                        change_y = 0;
                    } else if(y_difference !== 0 && rand_move === 2) {
                        if(attacking_coord.tile_y > old_coord.tile_y) {
                            new_y = old_coord.tile_y + 1;
                            change_y = 1;
                        } else {
                            new_y = old_coord.tile_y - 1;
                            change_y = -1;
                        }

                        new_x = old_coord.tile_x;
                        change_x = 0;
                    } else if(x_difference !== 0) {
                        if(attacking_coord.tile_x > old_coord.tile_x) {
                            new_x = old_coord.tile_x + 1;
                            change_x = 1;
                        } else {
                            new_x = old_coord.tile_x - 1;
                            change_x = -1;
                        }

                        new_y = old_coord.tile_y;
                        change_y = 0;
                    } else if(y_difference !== 0) {
                        if(attacking_coord.tile_y > old_coord.tile_y) {
                            new_y = old_coord.tile_y + 1;
                            change_y = 1;
                        } else {
                            new_y = old_coord.tile_y - 1;
                            change_y = -1;
                        }

                        new_x = old_coord.tile_x;
                        change_x = 0; 
                    }

                } else if(dirty.monster_types[data.monster_type_index].attack_movement_type === 'move_away') {

                    let rand_move = helper.getRandomIntInclusive(1,2);

                    if(x_difference !== 0 && rand_move === 1) {
                        if(attacking_coord.tile_x > old_coord.tile_x) {
                            new_x = old_coord.tile_x - 1;
                            change_x = -1;
                        } else {
                            new_x = old_coord.tile_x + 1;
                            change_x = 1;
                        }

                        new_y = old_coord.tile_y;
                        change_y = 0;
                    } else if(y_difference !== 0 && rand_move === 2) {
                        if(attacking_coord.tile_y > old_coord.tile_y) {
                            new_y = old_coord.tile_y - 1;
                            change_y = -1;
                        } else {
                            new_y = old_coord.tile_y + 1;
                            change_y = 1;
                        }

                        new_x = old_coord.tile_x;
                        change_x = 0;
                    } else if(x_difference !== 0) {
                        if(attacking_coord.tile_x > old_coord.tile_x) {
                            new_x = old_coord.tile_x - 1;
                            change_x = -1;
                        } else {
                            new_x = old_coord.tile_x + 1;
                            change_x = 1;
                        }

                        new_y = old_coord.tile_y;
                        change_y = 0;
                    } else if(y_difference !== 0) {
                        if(attacking_coord.tile_y > old_coord.tile_y) {
                            new_y = old_coord.tile_y - 1;
                            change_y = -1;
                        } else {
                            new_y = old_coord.tile_y + 1;
                            change_y = 1;
                        }

                        new_x = old_coord.tile_x;
                        change_x = 0; 
                    }

                } else if(dirty.monster_types[data.monster_type_index].attack_movement_type === 'warp_away') {

                    console.log("Monster type warps away");

                    // we're randomly going to warp left/right/up/down away from the coord that we are attacking
                    let random_direction = helper.getRandomIntInclusive(1,4);

                    let direction = 'left';
                    // right
                    if(random_direction === 2) {
                        direction = 'right';
                    } else if(random_direction === 3) {
                        direction = 'up';
                    } else if(random_direction === 4) {
                        direction = 'down';
                    }

                    let can_still_move = true;
                    let base_coord_index = attacking_coord_index;
                    let destination_coord_index = -1;
                    while(can_still_move) {


                        let base_coord = {};
                        if(scope === 'planet') {
                            base_coord = dirty.planet_coords[base_coord_index];
                        } else if(scope === 'ship') {
                            base_coord = dirty.ship_coords[base_coord_index];
                        }

                        await map.getCoordNeighbor(dirty, scope, base_coord_index, direction);

                        if(base_coord.left_coord_index !== -1) {

                            let test_placing_coord = {};
                            let test_index = -1;
                            if(scope === 'planet') {
                                if(direction === 'left' && base_coord.left_coord_index !== -1) {
                                    test_placing_coord = dirty.planet_coords[base_coord.left_coord_index];
                                    test_index = base_coord.left_coord_index;
                                } else if(direction === 'right' && base_coord.right_coord_index !== -1) {
                                    test_placing_coord = dirty.planet_coords[base_coord.right_coord_index];
                                    test_index = base_coord.right_coord_index;
                                } else if(direction === 'up' && base_coord.up_coord_index !== -1) {
                                    test_placing_coord = dirty.planet_coords[base_coord.up_coord_index];
                                    test_index = base_coord.up_coord_index;
                                } else if(direction === 'down' && base_coord.down_coord_index !== -1) {
                                    test_placing_coord = dirty.planet_coords[base_coord.down_coord_index];
                                    test_index = base_coord.down_coord_index;
                                }
                                

                            } else if(scope === 'ship') {
                                if(direction === 'left' && base_coord.left_coord_index !== -1) {
                                    test_placing_coord = dirty.ship_coords[base_coord.left_coord_index];
                                    test_index = base_coord.left_coord_index;
                                } else if(direction === 'right' && base_coord.right_coord_index !== -1) {
                                    test_placing_coord = dirty.ship_coords[base_coord.right_coord_index];
                                    test_index = base_coord.right_coord_index;
                                } else if(direction === 'up' && base_coord.up_coord_index !== -1) {
                                    test_placing_coord = dirty.ship_coords[base_coord.up_coord_index];
                                    test_index = base_coord.up_coord_index;
                                } else if(direction === 'down' && base_coord.down_coord_index !== -1) {
                                    test_placing_coord = dirty.ship_coords[base_coord.down_coord_index];
                                    test_index = base_coord.down_coord_index;
                                }
                            }

                            if(helper.notFalse(test_placing_coord)) {
                                let can_place_result = await canPlace(dirty, scope, test_placing_coord, { 'monster_index': i});

                                if(can_place_result === true) {
                                    destination_coord_index = test_index;
    
                                    // and run again with the test_index as our new base_index
                                    base_coord_index = test_index;
                                } else {
                                    can_still_move = false;
                                }
                            } else {
                                can_still_move = false;
                            }

                            

                        } else {
                            can_still_move = false;
                        }
                    }

                    if(destination_coord_index === -1) {
                        console.log("Could not find destination for warp_away");
                    } else {
                        console.log("Found a destination!");

                        new_coord_index = destination_coord_index;
                        if(scope === 'planet') {
                            new_coord = dirty.planet_coords[destination_coord_index];
                        } else if(scope === 'ship') {
                            new_coord = dirty.ship_coords[destination_coord_index];
                        }

                        new_x = new_coord.tile_x;
                        new_y = new_coord.tile_y;
                        
                    }




                } else if(dirty.monster_types[data.monster_type_index].attack_movement_type === 'warp_to') {

                    let found_coord = false;

                    for(let x = attacking_coord.tile_x - 1;
                        x <= attacking_coord.tile_x + 1; x++) {
                        for(let y = attacking_coord.tile_y - 1;
                            y <= attacking_coord.tile_y + 1; y++) {

                            if(!found_coord) {
                                let checking_data = {};

                                if(scope === 'planet') {

                                    let checking_data = { 'planet_id': attacking_coord.planet_id,
                                        'planet_level': attacking_coord.level,
                                        'tile_x': x, 'tile_y':y };
                                    let checking_coord_index = await main.getPlanetCoordIndex(checking_data);

                                    if(checking_coord_index !== -1) {
                                        let monster_can_place_result = await canPlace(dirty, 'planet',
                                        dirty.planet_coords[checking_coord_index], {'monster_index': i });

                                        if(checking_coord_index !== -1 && monster_can_place_result === true ) {

                                            new_x = dirty.planet_coords[checking_coord_index].tile_x;
                                            new_y = dirty.planet_coords[checking_coord_index].tile_y;

                                            change_x = new_x - old_coord.tile_x;
                                            change_y = new_y - old_coord.tile_y;
                                            found_coord = true;

                                        }
                                    }

                                    
                                } else if(scope === 'ship') {

                                    let checking_data = { 'ship_id': attacking_coord.ship_id,
                                        'level': attacking_coord.level,
                                        'tile_x': x, 'tile_y':y };
                                    let checking_coord_index = await main.getShipCoordIndex(checking_data);

                                    let monster_can_place_result = await canPlace(dirty, 'ship',
                                        dirty.ship_coords[checking_coord_index], { 'monster_index': i });

                                    if(checking_coord_index !== -1 && monster_can_place_result === true ) {

                                        new_x = dirty.ship_coords[checking_coord_index].tile_x;
                                        new_y = dirty.ship_coords[checking_coord_index].tile_y;

                                        change_x = new_x - old_coord.tile_x;
                                        change_y = new_y - old_coord.tile_y;

                                        found_coord = true;

                                    }

                                } else if(scope === 'galaxy') {
                                    console.log("Monster is warp moving in galaxy");

                                    let checking_data = { 'tile_x': x, 'tile_y':y };
                                    let checking_coord_index = await main.getCoordIndex(checking_data);

                                    let monster_can_place_result = await canPlace(dirty, 'galaxy',
                                        dirty.coords[checking_coord_index], { 'monster_index': i });

                                    if(checking_coord_index !== -1 && monster_can_place_result === true ) {

                                        new_x = dirty.coords[checking_coord_index].tile_x;
                                        new_y = dirty.coords[checking_coord_index].tile_y;

                                        change_x = new_x - old_coord.tile_x;
                                        change_y = new_y - old_coord.tile_y;

                                        found_coord = true;
                                        console.log("Found new coord to place at!");

                                    }
                                }


                            }


                        }
                    }

                }

            }

            else {
                log(chalk.yellow("Not sure what move we are doing on this monster. reason: " + data.reason +
                    " idle movement type: " + dirty.monster_types[data.monster_type_index].idle_movement_type));
                return false;
            }
        }



        if( new_coord_index === -1 && (new_x === -1 || new_y === -1) ) {
            //log(chalk.yellow("-1 for new_x or new_y, and no new coord index"));
            return false;
        }





        /************* STEP 2. SEE IF WE CAN PLACE ****************/

        let last_x = new_x + dirty.monster_types[data.monster_type_index].movement_tile_width - 1;
        let last_y = new_y + dirty.monster_types[data.monster_type_index].movement_tile_height - 1;


        // If we haven't already gotten the new coord
        if(new_coord_index === -1) {
            if(dirty.monsters[i].ship_coord_id) {

                new_coord_index = await main.getShipCoordIndex({
                    'ship_id': old_coord.ship_id, 'level': old_coord.level, 'tile_x': new_x, 'tile_y': new_y
                });
    
                if(new_coord_index === -1) {
                    return false;
                }
    
                new_coord = dirty.ship_coords[new_coord_index];
    
            } else if(dirty.monsters[i].planet_coord_id) {
    
                // We've lost any direction information at this point - so we can just check for x,y changes to see if we can pull neighbor coords
                let used_new_system = false;
                // UP
                if(old_coord.tile_x === new_x && old_coord.tile_y === (new_y + 1) ) {
                    await map.getCoordNeighbor(dirty, 'planet', old_coord_index, 'up');
                    new_coord_index = old_coord.up_coord_index;
                    used_new_system = true;
                }
                // DOWN
                else if(old_coord.tile_x === new_x && old_coord.tile_y === (new_y - 1) ) {
                    await map.getCoordNeighbor(dirty, 'planet', old_coord_index, 'down');
                    new_coord_index = old_coord.down_coord_index;
                    used_new_system = true;
                }
                // LEFT
                else if(old_coord.tile_y === new_y && old_coord.tile_x === (new_x + 1) ) {
                    await map.getCoordNeighbor(dirty, 'planet', old_coord_index, 'left');
                    new_coord_index = old_coord.left_coord_index;
                    used_new_system = true;
                }
                // RIGHT
                else if(old_coord.tile_y === new_y && old_coord.tile_x === (new_x - 1) ) {
                    await map.getCoordNeighbor(dirty, 'planet', old_coord_index, 'right');
                    new_coord_index = old_coord.right_coord_index;
                    used_new_system = true;
                }
                
    
                if(!used_new_system) {
                    new_coord_index = await main.getPlanetCoordIndex({
                        'planet_id': old_coord.planet_id, 'planet_level': old_coord.level,
                        'tile_x': new_x, 'tile_y': new_y
                    });
                }
                
                
    
    
                
    
                if(new_coord_index === -1) {
                    return false;
                }
    
                new_coord = dirty.planet_coords[new_coord_index];
            } else if(dirty.monsters[i].coord_id) {

                console.log("Trying to move monster in the galaxy!")

                // We've lost any direction information at this point - so we can just check for x,y changes to see if we can pull neighbor coords
                let used_new_system = false;
                // UP
                if(old_coord.tile_x === new_x && old_coord.tile_y === (new_y + 1) ) {
                    await map.getCoordNeighbor(dirty, 'galaxy', old_coord_index, 'up');
                    new_coord_index = old_coord.up_coord_index;
                    used_new_system = true;
                }
                // DOWN
                else if(old_coord.tile_x === new_x && old_coord.tile_y === (new_y - 1) ) {
                    await map.getCoordNeighbor(dirty, 'galaxy', old_coord_index, 'down');
                    new_coord_index = old_coord.down_coord_index;
                    used_new_system = true;
                }
                // LEFT
                else if(old_coord.tile_y === new_y && old_coord.tile_x === (new_x + 1) ) {
                    await map.getCoordNeighbor(dirty, 'galaxy', old_coord_index, 'left');
                    new_coord_index = old_coord.left_coord_index;
                    used_new_system = true;
                }
                // RIGHT
                else if(old_coord.tile_y === new_y && old_coord.tile_x === (new_x - 1) ) {
                    await map.getCoordNeighbor(dirty, 'galaxy', old_coord_index, 'right');
                    new_coord_index = old_coord.right_coord_index;
                    used_new_system = true;
                }
                
    
                if(!used_new_system) {
                    new_coord_index = await main.getCoordIndex({ 'tile_x': new_x, 'tile_y': new_y });
                }
                    
    
                if(new_coord_index === -1) {
                    return false;
                }
    
                new_coord = dirty.coords[new_coord_index];
            }
        }

    

        //if(dirty.monsters[i].id === 5128) {
        //    can_place_data.debug = true;
        //}

        let can_place = await canPlace(dirty, scope, new_coord, { 'monster_index': i });


        if(!can_place) {


            // If we have a path and we just failed to place, the path is invalid!
            if(typeof dirty.monsters[i].path !== "undefined" && dirty.monsters[i].path.length > 0) {
                //console.log("Monster path failed");
                dirty.monsters[i].path = [];
                dirty.monsters[i].ticks_until_next_path = 8;
            }

            // If we can't place due to a player made object, lets switch and attack that object instead!
            // TODO if we had canPlace return an array including 
            if(battle_linker_index !== -1 && dirty.battle_linkers[battle_linker_index].being_attacked_type === 'player') {
                //console.log("Monster can't move and is attacking player");
                if(scope === 'planet' && dirty.planet_coords[new_coord_index].object_id) {
                    let object_index = await game_object.getIndex(dirty, dirty.planet_coords[new_coord_index].object_id);
                    if(object_index !== -1) {
                        if(dirty.objects[object_index].player_id) {
                            console.log("A player built object is blocking the monster. The monster is now going to attack it");

                            // remove the previous battle linker
                            await world.removeBattleLinkers(dirty, { 'battle_linker_id': dirty.battle_linkers[battle_linker_index].id });

                            // add in the new battle linker
                            await world.addBattleLinker({}, dirty, { 'attacking_id': dirty.monsters[i].id, 'attacking_type': 'monster',
                                'being_attacked_id': dirty.objects[object_index].id, 'being_attacked_type': 'object' });

                        }
                    }
                }
            }

            //if(dirty.monsters[i].id === 5128) {
            //    console.log("Can't do the move");
            //}


            // We can only do pathfinding for monsters that are 1 tile
            // TODO this is currently limited to just planet coords - lets add in support for other coord types
            if(helper.notFalse(attacking_coord) && dirty.monsters[i].planet_coord_id && (typeof dirty.monsters[i].path === "undefined" || dirty.monsters[i].path.length === 0) && 
                dirty.monster_types[data.monster_type_index].movement_tile_width === 1 &&
                dirty.monster_types[data.monster_type_index].movement_tile_height === 1) {

            
                // Lets delay pathfinding attempts a bit
                if(dirty.monsters[i].ticks_until_next_path && dirty.monsters[i].ticks_until_next_path > 1) {
                    dirty.monsters[i].ticks_until_next_path--;
                    return false;
                }
                //console.log("monster id: " + dirty.monsters[i].id + " monster type " + dirty.monster_types[data.monster_type_index].name + " is calling pathfinding!");

                dirty.monsters[i].ticks_until_next_path = 8;
                //log(chalk.cyan("MONSTER PATHFINDING TIME!"));

                const worker = new Worker('./worker_pathfinding.js');


                worker.on('message', (path) => {
                    //console.log("Monster id: " + dirty.monsters[i].id + " path from worker is:");
                    //console.log(path);
                    dirty.monsters[i].path = path;
                });

                worker.on('error', (error) => {
                    console.log("Worker error!");
                    console.error(error);
                });

                worker.on('exit', (code) => {
                    //console.log("Worker exited! Code: ");
                    //console.log(code);


                });

                worker.on('online', () => {
                    //console.log("Worker is online");
                });


                let pathfinding_coords = [];
                for(let c = 0; c < dirty.planet_coords.length; c++) {
                    if(dirty.planet_coords[c] && dirty.planet_coords[c].planet_id === dirty.planet_coords[planet_coord_index].planet_id &&
                        dirty.planet_coords[c].level === dirty.planet_coords[planet_coord_index].level &&
                        dirty.planet_coords[c].tile_x >= dirty.planet_coords[planet_coord_index].tile_x - 3 &&
                        dirty.planet_coords[c].tile_x <= dirty.planet_coords[planet_coord_index].tile_x + 3 &&
                        dirty.planet_coords[c].tile_y >= dirty.planet_coords[planet_coord_index].tile_y - 3 &&
                        dirty.planet_coords[c].tile_y <= dirty.planet_coords[planet_coord_index].tile_y + 3) {
                        pathfinding_coords.push(dirty.planet_coords[c]);
                    }
                }

                //console.log("Sending " + pathfinding_coords.length + " coords into the pathfinding worker");

                let worker_data = { 'coords': pathfinding_coords, 'monster': dirty.monsters[i],
                    'origin_x': dirty.planet_coords[planet_coord_index].tile_x, 'origin_y': dirty.planet_coords[planet_coord_index].tile_y,
                    'destination_x': attacking_coord.tile_x, 'destination_y': attacking_coord.tile_y };

                worker.postMessage(worker_data);
            }
            return false;


        }



        /**************** STEP 3: COLLECT THE CURRENT COORDS THE MONSTER IS ON ************************/
        let current_coords = [];

        let old_last_x = old_coord.tile_x + dirty.monster_types[data.monster_type_index].movement_tile_width - 1;
        let old_last_y = old_coord.tile_y + dirty.monster_types[data.monster_type_index].movement_tile_height - 1

        if(dirty.monster_types[data.monster_type_index].movement_tile_width > 1 ||
            dirty.monster_types[data.monster_type_index].movement_tile_height > 1) {

            for(let ox = old_coord.tile_x; ox <= old_last_x; ox++) {
                for(let oy = old_coord.tile_y; oy <= old_last_y; oy++) {

                    if(dirty.monsters[i].planet_coord_id) {
                        let current_planet_coord_index = await main.getPlanetCoordIndex({ 'tile_x': ox, 'tile_y': oy,
                            'planet_level': old_coord.level, 'planet_id': old_coord.planet_id });

                        if(current_planet_coord_index !== -1) {
                            current_coords.push({'planet_coord_id': dirty.planet_coords[current_planet_coord_index].id,
                                'planet_coord_index': current_planet_coord_index, 'still_used': false });
                        }
                    } else if(dirty.monsters[i].ship_coord_id) {
                        let current_ship_coord_index = await main.getShipCoordIndex({ 'tile_x': ox, 'tile_y': oy,
                            'level': old_coord.level,
                            'ship_id': old_coord.ship_id });
                        if(current_ship_coord_index !== -1) {
                            current_coords.push({ 'ship_coord_id': dirty.ship_coords[current_ship_coord_index].id,
                                'ship_coord_index': current_ship_coord_index, 'still_used': false });
                        }
                    } else if(dirty.monsters[i].coord_id) {
                        let current_coord_index = await main.getCoordIndex({ 'tile_x': ox, 'tile_y': oy });
                        if(current_coord_index !== -1) {
                            current_coords.push({ 'coord_id': dirty.coords[current_coord_index].id,
                                'coord_index': current_coord_index, 'still_used': false });
                        } 
                    }

                    //current_coords.push({ 'tile_x': ox, 'tile_y': oy, 'still_used': false });
                }
            }
        }
        // We just have to push the current coord the monster is on
        else {

            if(dirty.monsters[i].planet_coord_id) {
                current_coords.push({ 'planet_coord_id': old_coord.id, 'planet_coord_index': old_coord_index,
                    'still_used': false });
            } else if(dirty.monsters[i].ship_coord_id) {
                current_coords.push({ 'ship_coord_id': old_coord.id, 'ship_coord_index': old_coord_index,
                    'still_used': false });
            } else if(dirty.monsters[i].coord_id) {
                current_coords.push({ 'coord_id': old_coord.id, 'coord_index': old_coord_index,
                    'still_used': false });
            }

        }



        /********* STEP 3: PLACE THE MONSTER THERE **************/



        for(let x = new_x; x <= last_x; x++) {
            for(let y = new_y; y <= last_y; y++) {

                let placing_coord_index = -1;
                let update_data = {};
                if(dirty.monsters[i].planet_coord_id) {
                    placing_coord_index = await main.getPlanetCoordIndex({
                        'planet_id': old_coord.planet_id, 'planet_level': old_coord.level,
                        'tile_x': x, 'tile_y': y
                    });

                    update_data.planet_coord_index = placing_coord_index;
                } else if(dirty.monsters[i].ship_coord_id) {
                    placing_coord_index = await main.getShipCoordIndex({
                        'ship_id': old_coord.ship_id, 'level': old_coord.level,
                        'tile_x': x, 'tile_y': y
                    });

                    update_data.ship_coord_index = placing_coord_index;
                } else if(dirty.monsters[i].coord_id) {
                    placing_coord_index = await main.getCoordIndex({
                        'tile_x': x, 'tile_y': y
                    });

                    update_data.coord_index = placing_coord_index;
                }



                if(x === new_x && y === new_y) {
                    update_data.monster_id = dirty.monsters[i].id;

                    //console.log("Placing monster on coord. data: ");
                    //console.log(update_data);
                    await main.updateCoordGeneric(false, update_data);
                } else {


                    // If it's the previous coord, we were on, we need the monster_id to be false
                    if(x === old_coord.tile_x && y === old_coord.tile_y) {
                        update_data.monster_id = false;
                        update_data.belongs_to_monster_id = dirty.monsters[i].id;
                        await main.updateCoordGeneric(false, update_data);
                    } else {
                        update_data.belongs_to_monster_id = dirty.monsters[i].id;
                        await main.updateCoordGeneric(false, update_data);
                    }


                }

                let current_coord_index = -1;
                if(dirty.monsters[i].planet_coord_id) {
                    current_coord_index = current_coords.findIndex(function(obj) { return obj &&
                        obj.planet_coord_index === placing_coord_index; });
                } else if(dirty.monsters[i].ship_coord_id) {
                    current_coord_index = current_coords.findIndex(function(obj) { return obj &&
                        obj.ship_coord_index === placing_coord_index; });
                } else if(dirty.monsters[i].coord_id) {
                    current_coord_index = current_coords.findIndex(function(obj) { return obj &&
                        obj.coord_index === placing_coord_index; });
                }

                if(current_coord_index !== -1) {
                    current_coords[current_coord_index].still_used = true;
                }

            }
        }


        // foreach current coords not used, remove it!

        for(let oc = 0; oc < current_coords.length; oc++) {

            if(current_coords[oc].still_used === false) {
                let update_data = {};

                if(typeof current_coords[oc].planet_coord_index !== 'undefined') {
                    update_data.planet_coord_index = current_coords[oc].planet_coord_index;
                } else if(typeof current_coords[oc].ship_coord_index !== 'undefined') {
                    update_data.ship_coord_index = current_coords[oc].ship_coord_index;
                } else if(typeof current_coords[oc].coord_index !== 'undefined') {
                    update_data.coord_index = current_coords[oc].coord_index;
                }

                update_data.monster_id = false;
                //console.log("Removing monster from coord. data: ");
                //console.log(update_data);
                await main.updateCoordGeneric(false, update_data);

            }

        }

        if(scope === 'planet') {
            dirty.monsters[i].planet_coord_id = new_coord.id;
            dirty.monsters[i].planet_coord_index = new_coord_index;
            dirty.monsters[i].has_change = true;
        } else if(scope === 'ship') {
            dirty.monsters[i].ship_coord_id = new_coord.id;
            dirty.monsters[i].ship_coord_index = new_coord_index;
            dirty.monsters[i].has_change = true;
        } else if(scope === 'galaxy') {
            dirty.monsters[i].coord_id = new_coord.id;
            dirty.monsters[i].coord_index = new_coord_index;
            dirty.monsters[i].has_change = true;
            console.log("End of monster.move. Updated monster coord id to: " + dirty.monsters[i].coord_id);
        }

        // update the room with the move
        io.to(room).emit('monster_info', { 'monster': dirty.monsters[i] });


    } catch(error) {
        log(chalk.red("Error in monster.move: " + error));
        console.error(error);
    }

}

exports.move = move;


/**
 * @param {Object} dirty
 * @param {String} scope
 * @param {Object} drop_linker
 * @param {number} coord_index
 */
async function placeDrop(dirty, scope, drop_linker, coord_index) {
    try {

        let dropping_coord_index = -1;

        let base_coord = {};
        if(scope === 'ship') {
            base_coord = dirty.ship_coords[coord_index];
        } else if(scope === 'planet') {
            base_coord = dirty.planet_coords[coord_index];
        } else if(scope === 'galaxy') {
            base_coord = dirty.coords[coord_index];
        }

        // try the base coord
        let can_place_result = await game_object.canPlace(dirty, scope, base_coord,
            { 'object_type_id': drop_linker.dropped_object_type_id });

        if(can_place_result === true) {
            dropping_coord_index = coord_index;
        }

        // If that fails, try the coord to the left
        if(dropping_coord_index === -1) {
            await map.getCoordNeighbor(dirty, scope, coord_index, 'left');

            if(base_coord.left_coord_index !== -1) {
                let trying_left_coord = {};
                if(scope === 'planet') {
                    trying_left_coord = dirty.planet_coords[base_coord.left_coord_index];
                } else if(scope === 'galaxy') {
                    trying_left_coord = dirty.coords[base_coord.left_coord_index];
                } else if(scope === 'ship') {
                    trying_left_coord = dirty.ship_coords[base_coord.left_coord_index];
                }

                if(helper.notFalse(trying_left_coord)) {
                    can_place_result = await game_object.canPlace(dirty, scope, trying_left_coord,
                        { 'object_type_id': drop_linker.dropped_object_type_id });

                    if(can_place_result === true) {
                        dropping_coord_index = base_coord.left_coord_index;
                    }
                }
                
            }
        }

        // Failed again? RIGHT!
        if(dropping_coord_index === -1) {
            await map.getCoordNeighbor(dirty, scope, coord_index, 'right');

            if(base_coord.right_coord_index !== -1) {
                let trying_right_coord = {};
                if(scope === 'planet') {
                    trying_right_coord = dirty.planet_coords[base_coord.right_coord_index];
                } else if(scope === 'galaxy') {
                    trying_right_coord = dirty.coords[base_coord.right_coord_index];
                } else if(scope === 'ship') {
                    trying_right_coord = dirty.ship_coords[base_coord.right_coord_index];
                }

                if(helper.notFalse(trying_right_coord)) {
                    can_place_result = await game_object.canPlace(dirty, scope, trying_right_coord,
                        { 'object_type_id': drop_linker.dropped_object_type_id });

                    if(can_place_result === true) {
                        dropping_coord_index = base_coord.right_coord_index;
                    }
                }
                
            }
        }

        // STILL failed? UP!
        if(dropping_coord_index === -1) {
            await map.getCoordNeighbor(dirty, scope, coord_index, 'up');

            if(base_coord.up_coord_index !== -1) {
                let trying_up_coord = {};
                if(scope === 'planet') {
                    trying_up_coord = dirty.planet_coords[base_coord.up_coord_index];
                } else if(scope === 'galaxy') {
                    trying_up_coord = dirty.coords[base_coord.up_coord_index];
                } else if(scope === 'ship') {
                    trying_up_coord = dirty.ship_coords[base_coord.up_coord_index];
                }

                if(helper.notFalse(trying_up_coord)) {
                    can_place_result = await game_object.canPlace(dirty, scope, trying_up_coord,
                        { 'object_type_id': drop_linker.dropped_object_type_id });

                    if(can_place_result === true) {
                        dropping_coord_index = base_coord.up_coord_index;
                    }
                }
                
            }
        }

        // One left! Down!
        if(dropping_coord_index === -1) {
            await map.getCoordNeighbor(dirty, scope, coord_index, 'down');

            if(base_coord.down_coord_index !== -1) {
                let trying_down_coord = {};
                if(scope === 'planet') {
                    trying_down_coord = dirty.planet_coords[base_coord.down_coord_index];
                } else if(scope === 'galaxy') {
                    trying_down_coord = dirty.coords[base_coord.down_coord_index];
                } else if(scope === 'ship') {
                    trying_down_coord = dirty.ship_coords[base_coord.down_coord_index];
                }

                if(helper.notFalse(trying_down_coord)) {
                    can_place_result = await game_object.canPlace(dirty, scope, trying_down_coord,
                        { 'object_type_id': drop_linker.dropped_object_type_id });

                    if(can_place_result === true) {
                        dropping_coord_index = base_coord.down_coord_index;
                    }
                }
                
            }
        }



        if(dropping_coord_index !== -1) {
            if(scope === 'planet') {
                //console.log("Monster is dropping amount: " + drop_linker.amount + " of object_type_id: " + drop_linker.dropped_object_type_id);
                await main.updateCoordGeneric(false, { 'planet_coord_index': dropping_coord_index, 'object_type_id': drop_linker.dropped_object_type_id,
                    'amount': drop_linker.amount });
            } else if(scope === 'ship') {
                //console.log("Monster is dropping amount: " + drop_linker.amount + " of object_type_id: " + drop_linker.dropped_object_type_id);
                await main.updateCoordGeneric(false, { 'ship_coord_index': dropping_coord_index, 'object_type_id': drop_linker.dropped_object_type_id,
                    'amount': drop_linker.amount });
            } else if(scope === 'galaxy') {
                await main.updateCoordGeneric(false, { 'coord_index': dropping_coord_index, 'object_type_id': drop_linker.dropped_object_type_id,
                    'amount': drop_linker.amount });
            }

            return true;
        }

        return false;



    } catch(error) {
        log(chalk.red("Error in monster.placeDrop: " + error));
        console.error(error);
    }

}

exports.placeDrop = placeDrop;

/**
 * @param {Object} socket
 * @param {String} room
 * @param {Object} dirty
 * @param {Object} data
 * @param {number=} data.monster_index
 * @param {number=} data.monster_id
 * 
 */
async function sendInfo(socket, room, dirty, data) {

    try {
        let monster_index = -1;

        if (data.monster_index) {
            monster_index = data.monster_index;
        } else if (data.monster_id) {
            monster_index = await getIndex(dirty, data.monster_id);
        }

        if (monster_index !== -1) {
            if (socket) {
                socket.emit('monster_info', { 'monster': dirty.monsters[monster_index] });
            }

            if (room) {
                io.to(room).emit('monster_info', { 'monster': dirty.monsters[monster_index] });
            }

        }
        // No monster there - let the client know to remove it. We can only do that if we were
        // sent in an ID rather than an index
        else if (data.monster_id) {

            if (helper.notFalse(socket)) {
                socket.emit('monster_info', { 'remove': true, 'monster': { 'id': data.monster_id } });
            }

            if (helper.notFalse(room)) {
                io.to(room).emit('monster_info', { 'remove': true, 'monster': { 'id': data.monster_id } });
            }

            // since the monster doesn't exist anymore, we want to make sure that no coords have this monster
            let planet_coord_index = dirty.planet_coords.findIndex(function (obj) { return obj && obj.monster_id === data.monster_id; });
            if (planet_coord_index !== -1) {
                log(chalk.yellow("Planet coord had a monster id: " + data.monster_id + " that no longer exists"));
                main.updateCoordGeneric(false, { 'planet_coord_index': planet_coord_index, 'monster_id': false });
            }

            let ship_coord_index = dirty.ship_coords.findIndex(function (obj) { return obj && obj.monster_id === data.monster_id; });
            if (ship_coord_index !== -1) {
                log(chalk.yellow("Ship coord had a monster id: " + data.monster_id + " that no longer exists"));
                main.updateCoordGeneric(false, { 'ship_coord_index': ship_coord_index, 'monster_id': false });
            }

        }
    } catch (error) {
        log(chalk.red("Error in monster.sendInfo: " + error));
        console.error(error);
    }


}

exports.sendInfo = sendInfo;


/**
 *
 * @param dirty
 * @param {number} monster_type_id
 * @param {Object} data
 * @param {number=} data.planet_coord_id
 * @param {number=} data.planet_coord_index
 * @param {number=} data.ship_coord_id
 * @param {number=} data.ship_coord_index
 * @param {number=} data.coord_id
 * @param {number=} data.coord_index
 * @param {number=} data.spawned_event_id
 * @param {string=} data.attack_on_spawn_type
 * @param {number=} data.attack_on_spawn_id
 * @param {number=} data.ai_id
 * @returns {Promise<boolean>}
 */
async function spawn(dirty, monster_type_id, data) {

    try {

        let coord_index = -1;
        let scope = 'planet';
        let placing_coord;

        // PLANET
        if (data.planet_coord_id) {
            coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': data.planet_coord_id });
            placing_coord = dirty.planet_coords[coord_index];
        } else if (data.planet_coord_index) {
            coord_index = data.planet_coord_index;
            placing_coord = dirty.planet_coords[coord_index];
        }
        // SHIP
        else if (data.ship_coord_id) {
            coord_index = await main.getShipCoordIndex({ 'ship_coord_id': data.ship_coord_id });
            scope = 'ship';
            placing_coord = dirty.ship_coords[coord_index];
        } else if (data.ship_coord_index) {
            coord_index = data.ship_coord_index;
            scope = 'ship';
            placing_coord = dirty.ship_coords[coord_index];
        }
        // GALAXY
        else if (data.coord_id) {
            coord_index = await main.getCoordIndex({ 'coord_id': data.coord_id });
            scope = 'galaxy';
            placing_coord = dirty.coords[coord_index];
        } else if (data.coord_index) {
            coord_index = data.coord_index;
            scope = 'galaxy';
            placing_coord = dirty.coords[coord_index];
        }

        let monster_type_index = main.getMonsterTypeIndex(monster_type_id);

        if (coord_index === -1 || monster_type_index === -1) {

            if(coord_index === -1) {
                log(chalk.yellow("Could not spawn monster - did not find coord"));
            }

            if(monster_type_index === -1) {
                log(chalk.yellow("Could not spawn monster - did not find monster type id: " + monster_type_id));
            }
            
            return false;
        }

        let spawned_event_id = 0;
        if (data.spawned_event_id) {
            spawned_event_id = data.spawned_event_id;
        }

        let can_place_monster_result = await canPlace(dirty, scope, placing_coord, { 'monster_type_id': monster_type_id });

        if (can_place_monster_result !== true) {
            return false;
        }

        let sql = "";
        let inserts = [];
        let room = "";

        if (scope === 'planet') {


            sql = "INSERT INTO monsters(monster_type_id, type, exp, current_hp, max_hp, attack_strength, planet_id, planet_level, planet_coord_id, spawned_event_id) VALUES(?,?,?,?,?,?,?,?,?,?)";
            inserts = [dirty.monster_types[monster_type_index].id, dirty.monster_types[monster_type_index].name, dirty.monster_types[monster_type_index].exp,
            dirty.monster_types[monster_type_index].hp, dirty.monster_types[monster_type_index].hp, dirty.monster_types[monster_type_index].attack_strength,
            dirty.planet_coords[coord_index].planet_id, dirty.planet_coords[coord_index].level, dirty.planet_coords[coord_index].id, spawned_event_id];



            room = "planet_" + dirty.planet_coords[coord_index].planet_id;


        } else if (scope === 'ship') {

            sql = "INSERT INTO monsters(monster_type_id, type, exp, current_hp, max_hp, attack_strength, ship_id, ship_coord_id, spawned_event_id) VALUES(?,?,?,?,?,?,?,?,?)";
            inserts = [dirty.monster_types[monster_type_index].id, dirty.monster_types[monster_type_index].name, dirty.monster_types[monster_type_index].exp,
            dirty.monster_types[monster_type_index].hp, dirty.monster_types[monster_type_index].hp, dirty.monster_types[monster_type_index].attack_strength,
            dirty.ship_coords[coord_index].ship_id, dirty.ship_coords[coord_index].id, spawned_event_id];

            room = "ship_" + dirty.ship_coords[coord_index].ship_id;

        } else if (scope === 'galaxy') {

            console.log("Spawning in galaxy");

            sql = "INSERT INTO monsters(monster_type_id, type, exp, current_hp, max_hp, attack_strength, coord_id, spawned_event_id) VALUES(?,?,?,?,?,?,?,?)";
            inserts = [dirty.monster_types[monster_type_index].id, dirty.monster_types[monster_type_index].name, dirty.monster_types[monster_type_index].exp,
            dirty.monster_types[monster_type_index].hp, dirty.monster_types[monster_type_index].hp, dirty.monster_types[monster_type_index].attack_strength,
            dirty.coords[coord_index].id, spawned_event_id];

            room = "galaxy";
        }





        let [result] = await (pool.query(sql, inserts));
        //pool.query(monster_sql, monster_inserts, function(err, result) {


        //console.log("Inserted monster");

        let new_monster_id = result.insertId;
        let new_monster_index = await getIndex(dirty, new_monster_id);
        //console.log("Got new monster id: " + new_monster_id);

        if (scope === 'planet') {
            await main.updateCoordGeneric(false, {
                'planet_coord_index': coord_index, 'monster_id': new_monster_id,
                'spawned_monster_id': new_monster_id
            });
        } else if (scope === 'ship') {
            await main.updateCoordGeneric(false, { 'ship_coord_index': coord_index, 'monster_id': new_monster_id,
                'spawned_monster_id': new_monster_id });
        } else if (scope === 'galaxy') {
            await main.updateCoordGeneric(false, { 'coord_index': coord_index, 'monster_id': new_monster_id });
        }

        if(typeof data.ai_id !== 'undefined') {
            dirty.monsters[new_monster_index].object_id = data.ai_id;
        }

        await sendInfo(false, room, dirty, { 'monster_id': new_monster_id });

        // and if the monster has a larger width/height, add in the belongs to stuff
        if (dirty.monster_types[monster_type_index].movement_tile_width > 1 ||
            dirty.monster_types[monster_type_index].movement_tile_height > 1) {
            console.log("This is a large monster. Adding the belongs_to_monster_id stuff");
            // Try just moving it where it currently is?
            // TODO. I think if we changed game.moveMonster to accept a specific destination coord, we could do it that way
            // Then we don't need placeMonster and moveMonster - just moveMonster!
        }


        // Sometimes monsters are spawned to automatically attack a player
        if (data.attack_on_spawn_id && data.attack_on_spawn_type) {
            console.log("Monster was spawned to attack " + data.attack_on_spawn_type + " id " + data.attack_on_spawn_id);

            let battle_linker_data = {
                'attacking_id': new_monster_id, 'attacking_type': 'monster',
                'being_attacked_id': data.attack_on_spawn_id, 'being_attacked_type': data.attack_on_spawn_type
            };
            await world.addBattleLinker(false, dirty, battle_linker_data);

            // I THINK this is where the ai daemon stuff will always show up
            if (data.attack_on_spawn_type === 'player' &&
                (dirty.monster_types[monster_type_index].id === 33 || dirty.monster_types[monster_type_index].id === 57)) {
                log(chalk.yellow("AI THING SPAWNED CHECK"));

                // get the player socket
                let being_attacked_player_index = await player.getIndex(dirty, { 'player_id': data.attack_on_spawn_id });
                if (being_attacked_player_index !== -1) {
                    let being_attacked_player_socket = world.getPlayerSocket(dirty, being_attacked_player_index);
                    if (being_attacked_player_socket) {
                        being_attacked_player_socket.emit('chat', { 'message': "You have violated the rules of the ruling AI.", 'scope': 'local', 'is_important': true });
                    }
                }


            }
        }

    } catch (error) {
        log(chalk.red("Error in monster.spawn: " + error));
        console.error(error);
    }

}

exports.spawn = spawn;