//@ts-check
var io_handler = require('./io.js');
var io = io_handler.io;
var database = require('./database.js');
var pool = database.pool;
const chalk = require('chalk');
const log = console.log;

const game = require('./game.js');
const game_object = require('./game_object.js');
const helper = require('./helper.js');
const inventory = require('./inventory.js');
const main = require('./space_abyss' + process.env.FILE_SUFFIX + '.js');
const map = require('./map.js');
const monster = require('./monster.js');
const movement = require('./movement.js');
const planet = require('./planet.js');
const world = require('./world.js');


async function calculateAttack(dirty, player_index, player_body_index, calculating_range) {

    try {

        if(player_index === -1) {
            log(chalk.yellow("Player index sent do player.calculateAttack was -1"));
            return false;
        }

        if(player_body_index === -1) {
            log(chalk.yellow("Player body index sent to do player.calculateAttack was -1"));
            return false;
        }

        let damage_amount = 0;
        let damage_types = [];
        let radius_damage_amounts = [];
        let decrement_equipment_linker_ids = [];

        let player_body_type_index = main.getObjectTypeIndex(dirty.objects[player_body_index].object_type_id);

        // default 5 attack at one range ( hands )
        if(calculating_range === 1) {
            damage_amount = 5;
        }

        // If the player's body type has an attack modifier, we change the attack by that amount
        if(dirty.object_types[player_body_type_index].attack_modifier) {
            damage_amount += dirty.object_types[player_body_type_index].attack_modifier;
        }

        //console.time("controlTime");
        let control_level = await getLevel(dirty, { 'player_index': player_index,
            'body_index': player_body_index, 'skill_type': 'control' });
        //console.timeEnd("controlTime");

        let corrosive_level = await getLevel(dirty, { 'player_index': player_index,
            'body_index': player_body_index, 'scope': 'planet', 'skill_type': 'corrosive' });
        let electric_level = await getLevel(dirty, { 'player_index': player_index,
            'body_index': player_body_index, 'scope': 'planet',  'skill_type': 'electric' });
        let explosion_level = await getLevel(dirty, { 'player_index': player_index,
            'body_index': player_body_index, 'scope': 'planet',  'skill_type': 'explosion' });
        let freezing_level = await getLevel(dirty, { 'player_index': player_index,
            'body_index': player_body_index, 'scope': 'planet',  'skill_type': 'freezing' });
        let hacking_level = await getLevel(dirty, { 'player_index': player_index,
            'body_index': player_body_index, 'scope': 'planet',  'skill_type': 'hacking' });
        let heat_level = await getLevel(dirty, { 'player_index': player_index,
            'body_index': player_body_index, 'scope': 'planet',  'skill_type': 'heat' });
        let gravity_level = await getLevel(dirty, { 'player_index': player_index,
            'body_index': player_body_index, 'scope': 'planet',  'skill_type': 'gravity' });
        let laser_level = await getLevel(dirty, { 'player_index': player_index,
            'body_index': player_body_index, 'scope': 'planet',  'skill_type': 'laser' });
        let melee_level = await getLevel(dirty, { 'player_index': player_index,
            'body_index': player_body_index, 'scope': 'planet',  'skill_type':'melee' } );
        let piercing_level = await getLevel(dirty, { 'player_index': player_index,
            'body_index': player_body_index, 'scope': 'planet',  'skill_type': 'piercing' });
        let plasma_level = await getLevel(dirty, { 'player_index': player_index,
            'body_index': player_body_index, 'scope': 'planet', 'skill_type': 'plasma' });
        let poison_level = await getLevel(dirty, { 'player_index': player_index,
            'body_index': player_body_index, 'scope': 'planet', 'skill_type': 'poison' });
        let radiation_level = await getLevel(dirty, { 'player_index': player_index,
            'body_index': player_body_index, 'scope': 'planet', 'skill_type': 'radiation' });


        let total_attacking_equipment_count = 0;
        let control_equipment_count = 0;
        let corrosive_equipment_count = 0;
        let electric_equipment_count = 0;
        let explosion_equipment_count = 0;
        let freezing_equipment_count = 0;
        let gravity_equipment_count = 0;
        let hacking_equipment_count = 0;
        let heat_equipment_count = 0;
        let laser_equipment_count = 0
        let melee_equipment_count = 0;
        let piercing_equipment_count = 0;
        let plasma_equipment_count = 0;
        let poison_equipment_count = 0;
        let radiation_equipment_count = 0;
        


        for(let equipment_linker of dirty.equipment_linkers) {
            if(equipment_linker && equipment_linker.body_id === dirty.players[player_index].body_id) {


                let object_type_index = dirty.object_types.findIndex(function(obj) { return obj && obj.id === equipment_linker.object_type_id; });
                if(object_type_index !== -1) {

                    // see if the object attack is in this range
                    if(dirty.object_types[object_type_index].min_attack_range <= calculating_range && dirty.object_types[object_type_index].max_attack_range >= calculating_range) {
                        //log(chalk.cyan("Have equipped item in range. Adding: " + dirty.object_types[object_type_index].attack_strength));
                        damage_amount += dirty.object_types[object_type_index].attack_strength;


                        // TODO flesh out all the damage types
                        if(dirty.object_types[object_type_index].equip_skill === 'control') {
                            control_equipment_count++;
                        } else if(dirty.object_types[object_type_index].equip_skill === 'corrosive') {
                            corrosive_equipment_count++;
                        } else if(dirty.object_types[object_type_index].equip_skill === 'electric') {
                            electric_equipment_count++;
                        } else if(dirty.object_types[object_type_index].equip_skill === 'explosion') {
                            explosion_equipment_count++;
                        } else if(dirty.object_types[object_type_index].equip_skill === 'freezing') {
                            freezing_equipment_count++;
                        } else if(dirty.object_types[object_type_index].equip_skill === 'gravity') {
                            gravity_equipment_count++;
                        } else if(dirty.object_types[object_type_index].equip_skill === 'hacking') {
                            hacking_equipment_count++;
                        } else if(dirty.object_types[object_type_index].equip_skill === 'heat') {
                            heat_equipment_count++;
                        } else if(dirty.object_types[object_type_index].equip_skill === 'laser') {
                            laser_equipment_count++;
                        } else if(dirty.object_types[object_type_index].equip_skill === 'melee') {
                            melee_equipment_count++;
                        } else if(dirty.object_types[object_type_index].equip_skill === 'piercing') {
                            piercing_equipment_count++;
                        } else if(dirty.object_types[object_type_index].equip_skill === 'poison') {
                            poison_equipment_count++;
                        } else if(dirty.object_types[object_type_index].equip_skill === 'radiation') {
                            radiation_equipment_count++;
                        }

                        // If the equip skill/(damage type) isn't in our damage types array yet, add it
                        let need_to_add_type = true;
                        for(let t = 0; t < damage_types.length; t++) {
                            if(damage_types[t] === dirty.object_types[object_type_index].equip_skill) {
                                need_to_add_type = false;
                            }
                        }

                        if(need_to_add_type) {
                            //console.log("Pushing damage type: " + dirty.object_types[object_type_index].equip_skill);
                            damage_types.push(dirty.object_types[object_type_index].equip_skill);
                        }

                        total_attacking_equipment_count++;

                        if(dirty.object_types[object_type_index].attack_radius) {
                            radius_damage_amounts.push({ 'radius': dirty.object_types[object_type_index].attack_radius,
                                'damage_amount': dirty.object_types[object_type_index].attack_strength,
                                'damage_type': dirty.object_types[object_type_index].equip_skill });
                        }

                        if(dirty.object_types[object_type_index].is_consumed_on_attack) {
                            //log(chalk.cyan("Consuming attack item"));
                            decrement_equipment_linker_ids.push(equipment_linker.id);
                        }

                    }
                }
            }
        }

        // Control
        if(control_equipment_count > 0) {
            let control_equipment_percent = control_equipment_count / total_attacking_equipment_count;
            let control_bonus = Math.floor(control_level * control_equipment_percent);

            if(control_bonus > 1) {
                damage_amount += control_bonus - 1;
            }
        }

        // Corrosive
        if(corrosive_equipment_count > 0) {
            let corrosive_equipment_percent = corrosive_equipment_count / total_attacking_equipment_count;
            let corrosive_bonus = Math.floor(corrosive_level * corrosive_equipment_percent);

            if(corrosive_bonus > 1) {
                damage_amount += corrosive_bonus - 1;
            }
        }

        // Electric
        if(electric_equipment_count > 0) {
            let electric_equipment_percent = electric_equipment_count / total_attacking_equipment_count;
            let electric_bonus = Math.floor(electric_level * electric_equipment_percent);

            if(electric_bonus > 1) {
                damage_amount += electric_bonus - 1;
            }
        }
        

        // Explosion
        if(explosion_equipment_count > 0) {
            let explosion_equipment_percent = explosion_equipment_count / total_attacking_equipment_count;
            let explosion_bonus = Math.floor(explosion_level * explosion_equipment_percent);

            if(explosion_bonus > 1) {
                damage_amount += explosion_bonus - 1;
            }
        }

        // Freezing
        if(freezing_equipment_count > 0) {
            let freezing_equipment_percent = freezing_equipment_count / total_attacking_equipment_count;
            let freezing_bonus = Math.floor(freezing_level * freezing_equipment_percent);

            if(freezing_bonus > 1) {
                damage_amount += freezing_bonus - 1;
            }
        }

        // Gravity
        if(gravity_equipment_count > 0) {
            let gravity_equipment_percent = gravity_equipment_count / total_attacking_equipment_count;
            let gravity_bonus = Math.floor(gravity_level * gravity_equipment_percent);

            if(gravity_bonus > 1) {
                damage_amount += gravity_bonus - 1;
            }
        }

        // Hacking
        if(hacking_equipment_count > 0) {
            let hacking_equipment_percent = hacking_equipment_count / total_attacking_equipment_count;
            let hacking_bonus = Math.floor(hacking_level * hacking_equipment_percent);

            if(hacking_bonus > 1) {
                damage_amount += hacking_bonus - 1;
            }
        }

        // Heat
        if(heat_equipment_count > 0) {
            let heat_equipment_percent = heat_equipment_count / total_attacking_equipment_count;
            let heat_bonus = Math.floor(heat_level * heat_equipment_percent);

            if(heat_bonus > 1) {
                damage_amount += heat_bonus - 1;
            }
        }

    
        // Laser percent
        if(laser_equipment_count > 0) {
            let laser_equipment_percent = laser_equipment_count / total_attacking_equipment_count;
            let laser_bonus = Math.floor(laser_level * laser_equipment_percent);

            if(laser_bonus > 1) {
                damage_amount += laser_bonus - 1;
            }
        }

        // Melee percent
        if(melee_equipment_count > 0) {
            let melee_equipment_percent = melee_equipment_count / total_attacking_equipment_count;
            let melee_bonus = Math.floor(melee_level * melee_equipment_percent);

            if(melee_bonus > 1) {
                damage_amount += melee_bonus - 1;
            }
        }

        // Piercing
        if(piercing_equipment_count > 0) {
            let piercing_equipment_percent = piercing_equipment_count / total_attacking_equipment_count;
            let piercing_bonus = Math.floor(piercing_level * piercing_equipment_percent);

            if(piercing_bonus > 1) {
                damage_amount += piercing_bonus - 1;
            }
        }

        // Plasma
        if(plasma_equipment_count > 0) {
            let plasma_equipment_percent = plasma_equipment_count / total_attacking_equipment_count;
            let plasma_bonus = Math.floor(plasma_level * plasma_equipment_percent);

            if(plasma_bonus > 1) {
                damage_amount += plasma_bonus - 1;
            }
        }

        // Poison
        if(poison_equipment_count > 0) {
            let poison_equipment_percent = poison_equipment_count / total_attacking_equipment_count;
            let poison_bonus = Math.floor(poison_level * poison_equipment_percent);

            if(poison_bonus > 1) {
                damage_amount += poison_bonus - 1;
            }
        }

        // Radiation
        if(radiation_equipment_count > 0) {
            let radiation_equipment_percent = radiation_equipment_count / total_attacking_equipment_count;
            let radiation_bonus = Math.floor(radiation_level * radiation_equipment_percent);

            if(radiation_bonus > 1) {
                damage_amount += radiation_bonus - 1;
            }
        }

        // There's also a situation where there is nothing equipped, and we are attacking at range one
        if(total_attacking_equipment_count === 0 && calculating_range === 1 && melee_level > 1) {
            damage_amount += melee_level - 1;
        }

        let body_eating_linkers = dirty.eating_linkers.filter(linker => linker.body_id === dirty.players[player_index].body_id);



        // and bonuses for eating linkers
        for(let eating_linker of body_eating_linkers) {
            if(eating_linker && eating_linker.body_id === dirty.players[player_index].body_id) {


                let race_linker_index = main.getRaceEatingLinkerIndex({
                    'race_id': dirty.object_types[player_body_type_index].race_id, 'object_type_id': eating_linker.eating_object_type_id
                });

                if(dirty.race_eating_linkers[race_linker_index].attack) {
                    //console.log("Eating increased player attack by: " + dirty.race_eating_linkers[race_linker_index].attack);
                    damage_amount += dirty.race_eating_linkers[race_linker_index].attack;
                }
            }
        }

        // and minuses for each addiction without a matching eating linker (addictions are held off while the player is still consuming them)
        let body_addiction_linkers = dirty.addiction_linkers.filter(linker => linker.addicted_body_id === dirty.players[player_index].body_id);
        for(let addiction_linker of body_addiction_linkers) {

            let still_eating = false;
            for(let eating_linker of body_eating_linkers) {
                if(eating_linker.eating_object_type_id === addiction_linker.addicted_to_object_type_id) {
                    still_eating = true;
                    //console.log("Player is still eating thing causing addiction");
                }
            }

            if(!still_eating) {

                //console.log("Player is not eating something they are addicted to");

                let race_linker_index = main.getRaceEatingLinkerIndex({
                    'race_id': dirty.object_types[player_body_type_index].race_id, 'object_type_id': addiction_linker.addicted_to_object_type_id
                });

                if(race_linker_index !== -1 && dirty.race_eating_linkers[race_linker_index].attack) {
                    //console.log("Reduced player attacked due to addiction linker");
                    damage_amount -= addiction_linker.addiction_level * dirty.race_eating_linkers[race_linker_index].attack;
                } else {
                    //console.log("Addiction did not influence attack");
                }

            }

        }

        // No equipment, range 1, no damage types present. The player is hitting with their hands
        if(damage_types.length === 0 && calculating_range === 1) {
            damage_types.push('melee');
        }


        return { 'damage_amount': damage_amount, 'damage_types': damage_types,
            'radius_damage_amounts': radius_damage_amounts,
            'decrement_equipment_linker_ids': decrement_equipment_linker_ids,
            'control_equipment_count': control_equipment_count,
            'corrosive_equipment_count': corrosive_equipment_count,
            'electric_equipment_count': electric_equipment_count,
            'explosion_equipment_count': explosion_equipment_count,
            'freezing_equipment_count': freezing_equipment_count,
            'gravity_equipment_count': gravity_equipment_count,
            'hacking_equipment_count': hacking_equipment_count,
            'heat_equipment_count': heat_equipment_count,
            'laser_equipment_count': laser_equipment_count,
            'melee_equipment_count': melee_equipment_count,
            'piercing_equipment_count': piercing_equipment_count,
            'plasma_equipment_count': plasma_equipment_count,
            'poison_equipment_count': poison_equipment_count,
            'radiation_equipment_count': radiation_equipment_count

        
        };
    } catch(error) {
        log(chalk.red("Error in player.calculateAttack: " + error));
        console.error(error);
    }

}

exports.calculateAttack = calculateAttack;


async function calculateDefense(dirty, player_index, damage_type = '') {

    try {
        // By default all players have one defense
        let player_defense = 1;

        // Base level + body/ship type
        let defense_level = await getLevel(dirty, { 'player_index': player_index, 'skill_type': 'defense' });

        let player_body_index = await game_object.getIndex(dirty, dirty.players[player_index].body_id);
        let player_body_type_index = main.getObjectTypeIndex(dirty.objects[player_body_index].object_type_id);


        // Start with defense as defense level
        player_defense = defense_level;


        if(damage_type === 'electric' && helper.notFalse(dirty.object_types[player_body_type_index].electric_defense_modifier) ) {
            
            player_defense += dirty.object_types[player_body_type_index].electric_defense_modifier;
        }





        let player_equipment_linkers = dirty.equipment_linkers.filter(linker => linker.body_id === dirty.players[player_index].body_id);

        for(let equipment_linker of player_equipment_linkers) {
            let object_type_index = dirty.object_types.findIndex(function(obj) { return obj && obj && obj.id === equipment_linker.object_type_id; });
            if(object_type_index !== -1) {
                // see if the object attack is in this range
                if(dirty.object_types[object_type_index].defense > 0) {
                    //log(chalk.cyan("Have equipped item in range. Adding: " + dirty.object_types[object_type_index].attack_strength));
                    player_defense += dirty.object_types[object_type_index].defense;
                }
            }
        }


        //console.log("In calculatePlayerDefense. attacks_defended: " + dirty.players[player_index].attacks_defended);
        // and we modify the final defense based on how many things the player is defending from this turn
        if(dirty.players[player_index].attacks_defended > 1) {
            //console.log("Doing math: " + player_defense + " / " + dirty.players[player_index].attacks_defended);
            player_defense = Math.ceil(player_defense / dirty.players[player_index].attacks_defended);

        }


        for(let i = 0; i < dirty.eating_linkers.length; i++) {
            if(dirty.eating_linkers[i] && dirty.eating_linkers[i].body_id === dirty.players[player_index].body_id) {
                let race_linker_index = main.getRaceEatingLinkerIndex({
                    'race_id': dirty.object_types[player_body_type_index].race_id, 'object_type_id': dirty.eating_linkers[i].eating_object_type_id
                });

                if(dirty.race_eating_linkers[race_linker_index].defense) {
                    //console.log("Eating increased player attack by: " + dirty.race_eating_linkers[race_linker_index].attack);
                    player_defense += dirty.race_eating_linkers[race_linker_index].defense;
                }
            }
        }

        return player_defense;
    } catch(error) {
        log(chalk.red("Error in player.calculateDefense: " + error));
        console.error(error);
    }


}

exports.calculateDefense = calculateDefense;


async function calculateMovementModifier(socket, dirty, scope, coord_index) {

    try {
        
        
        if(scope === 'ship' || scope === 'planet') {

            let previous_socket_movement_modifier = socket.movement_modifier;

            // Get the floor type of the tile we moved to, and put in a move modifier for the socket on the next
            // move if it's applicable
            let floor_type_index = -1;
            if(scope === 'planet') {
                floor_type_index = main.getFloorTypeIndex(dirty.planet_coords[coord_index].floor_type_id);
            } else if(scope === 'ship') {
                floor_type_index = main.getFloorTypeIndex(dirty.ship_coords[coord_index].floor_type_id);
            }
            

            if(floor_type_index !== -1 && dirty.floor_types[floor_type_index].movement_modifier) {

                socket.movement_modifier = dirty.floor_types[floor_type_index].movement_modifier;

            }

            //console.time("land/fluid_check");
            let player_body_index = await game_object.getIndex(dirty, dirty.players[socket.player_index].body_id);
            if(player_body_index !== -1) {
                let player_body_type_index = main.getObjectTypeIndex(dirty.objects[player_body_index].object_type_id);
                if(player_body_type_index !== -1) {
                    if(player_body_type_index !== -1 && floor_type_index !== -1 ) {

                        if(dirty.object_types[player_body_type_index].land_movement_modifier !== 1 && dirty.floor_types[floor_type_index].movement_type === 'land') {
                            socket.movement_modifier = socket.movement_modifier * dirty.object_types[player_body_type_index].land_movement_modifier;
                            //console.log("body land movement modifier changed socket.movement_modifier to: " + socket.movement_modifier);
                        }

                        
                        if(dirty.object_types[player_body_type_index].fluid_movement_modifier !== 1 && dirty.floor_types[floor_type_index].movement_type === 'fluid') {
                            socket.movement_modifier = socket.movement_modifier * dirty.object_types[player_body_type_index].fluid_movement_modifier;
                            //console.log("body land movement modifier changed socket.movement_modifier to: " + socket.movement_modifier);
                        }

                        
                        if(dirty.object_types[player_body_type_index].air_movement_modifier !== 1 && dirty.floor_types[floor_type_index].movement_type === 'air') {
                            socket.movement_modifier = socket.movement_modifier * dirty.object_types[player_body_type_index].air_movement_modifier;
                            //console.log("body land movement modifier changed socket.movement_modifier to: " + socket.movement_modifier);
                        }

                    }
                }
            }
            
            

            //console.timeEnd("land/fluid_check");

            if(socket.movement_modifier !== previous_socket_movement_modifier) {
                //console.log("Reset socket move count: " + socket.movement_modifier + " !== " + previous_socket_movement_modifier);
                socket.move_count = 1;
                socket.move_totals = 0;
            }

        } else {
            //console.log("Galaxy set socket move modifer to 1");
            socket.movement_modifier = 1;
        }

    } catch(error) {
        log(chalk.red("Error in player.calculateMovementModifier: " + error));
        console.error(error);
    }
}

exports.calculateMovementModifier = calculateMovementModifier;


/**
 * @param {Object} dirty
 * @param {String} scope
 * @param {Object} coord
 * @param {number} player_index
 * @param {boolean=} show_output
 * @returns {Promise<boolean>} 
 */
async function canPlace(dirty, scope, coord, player_index, show_output = false) {

    try {


        if(player_index === -1) {
            log(chalk.yellow("Invalide player index passed in"));
        }



        let checking_coords = [];

        // If we have a player id, use the body or a ship type, depending on the view
        let body_index = -1;
        let ship_index = -1;
        let type_index = -1;


        if(scope === 'planet' || scope === 'ship') {
            //console.log("Getting body");
            body_index = await game_object.getIndex(dirty, dirty.players[player_index].body_id);

            if(body_index === -1) {

                if(show_output) {
                    log(chalk.yellow("Could not get player's body"));
                }

                return false;
            }

            type_index = main.getObjectTypeIndex(dirty.objects[body_index].object_type_id);
        } else if(scope === 'galaxy') {
            //console.log("Getting ship");
            ship_index = await game_object.getIndex(dirty, dirty.players[player_index].ship_id);

            if(ship_index === -1) {

                if(show_output) {
                    log(chalk.yellow("Could not get player's ship. id: " + dirty.players[player_index].ship_id));
                }

                return false;
            }
            type_index = main.getObjectTypeIndex(dirty.objects[ship_index].object_type_id);
        }

        if(body_index === -1 && ship_index === -1) {

            if(show_output) {
                log(chalk.yellow("Couldn't get body or ship"));

                console.log("Player's ship id: " + dirty.players[player_index].ship_id);
                console.log("Ship's object type id: " + dirty.objects[ship_index].object_type_id);
            }

            return false;
        }

        if(type_index === -1) {

            if(show_output) {
                log(chalk.yellow("Couldn't get type for body or ship"));
            }

            return false;
        }


        //console.log("collecting the coords");
        /************************** COLLECT ALL THE COORDS *******************************/
        let last_x = coord.tile_x;
        let last_y = coord.tile_y;
        let movement_tile_width = 1;
        let movement_tile_height = 1;

        // see if the object type has non visual display linkers
        let display_linkers = dirty.object_type_display_linkers.filter(linker =>
            linker.object_type_id === dirty.object_types[type_index].id && !linker.only_visual);

        if(display_linkers.length > 0) {


            for(let linker of display_linkers) {
                let linker_movement_width = linker.position_x + 1;
                if(linker_movement_width > movement_tile_width) {
                    movement_tile_width = linker_movement_width;
                }

                let linker_movement_height = linker.position_y + 1;
                if(linker_movement_height > movement_tile_height) {
                    movement_tile_height = linker_movement_height;
                }
            }


            last_x = coord.tile_x + movement_tile_width - 1;
            last_y = coord.tile_y + movement_tile_height - 1;

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

                        if(show_output) {
                            console.log("Returning false on coord not found");
                        }

                        return false;
                    }


                }
            }
        } else {

            checking_coords.push(coord);
        }



        /********************** GO THROUGH EACH OF THE COORDS ***********************/
        for(let checking_coord of checking_coords) {
            //console.log("Checking coord id: " + checking_coord.id);

            if(checking_coord.floor_type_id) {
                let floor_type_index = main.getFloorTypeIndex(checking_coord.floor_type_id);

                if(floor_type_index !== -1) {
                    if(!dirty.floor_types[floor_type_index].can_walk_on) {

                        if(show_output) {
                            console.log("Returning false on " + checking_coord.tile_x + "," + checking_coord.tile_y + " can't walk on floor");
                        }

                        return false;
                    }
                }
            }

            if(checking_coord.monster_id || checking_coord.belongs_to_monster_id) {

                if(show_output) {
                    console.log("Returning false on " + checking_coord.tile_x + "," + checking_coord.tile_y + " monster");
                }

                return false;
            }

            if(checking_coord.npc_id) {

                if(show_output) {
                    console.log("Returning false on " + checking_coord.tile_x + "," + checking_coord.tile_y + " npc");
                }

                return false;
            }

            // We have a base object type here - no object/belongs object
            if(checking_coord.object_type_id && !checking_coord.object_id && !checking_coord.belongs_to_object_id) {
                let object_type_index = main.getObjectTypeIndex(checking_coord.object_type_id);

                if(object_type_index !== -1) {
                    if(!dirty.object_types[object_type_index].can_walk_on) {

                        if(show_output) {
                            console.log("Checking coord id: " + checking_coord.id + " scope: " + scope);
                            console.log("Returning false on " + checking_coord.tile_x + "," + checking_coord.tile_y + " not walkable object");
                        }

                        //log(chalk.yellow("Blocked by object_type_id"));
                        return false;
                    }
                }
            }

            if(checking_coord.object_id || checking_coord.belongs_to_object_id) {


                // If it's us... we're done with that coord
                if(scope === 'galaxy' && checking_coord.object_id &&
                    checking_coord.object_id === dirty.players[player_index].ship_id) {

                } else if(scope === 'galaxy' && checking_coord.belongs_to_object_id &&
                    checking_coord.belongs_to_object_id === dirty.players[player_index].ship_id) {

                } else {

                    let object_index = -1;
                    if(checking_coord.object_id) {
                        object_index = await game_object.getIndex(dirty, checking_coord.object_id);
                    } else if(checking_coord.belongs_to_object_id) {
                        object_index = await game_object.getIndex(dirty, checking_coord.belongs_to_object_id);
                    }

                    if(object_index !== -1) {
                        let object_type_index = main.getObjectTypeIndex(dirty.objects[object_index].object_type_id);
                        
                        // Previously I tried allowing the move if it was a dockable ship - HOWEVER - that ends up just making us disappear the dockable ship from space
                        // Instead we want to focus on having the player dock/land on planet in movement.moveGalaxy BEFORE we reach the point of checking in this function
                        // as it's more about actually PLACING the object on the coord
                        if(!dirty.object_types[object_type_index].can_walk_on) {

                            if(show_output) {
                                console.log("Returning false - object we can't walk on");
                            }

                            return false;
                        }
                    }
                }

            }


            //console.log("Checking coord planet id: " + checking_coord.planet_id);

            // || checking_coord.belongs_to_planet_id
            if(scope === 'galaxy' && checking_coord.planet_id) {

                if(show_output) {
                    console.log("Returning false on " + checking_coord.tile_x + "," + checking_coord.tile_y + " planet");
                }

                return false;
            }


            if(scope === 'galaxy' && checking_coord.belongs_to_planet_id) {

                // step 1. Find the base planet coord it

                let planet_index = await planet.getIndex(dirty, { 'planet_id': checking_coord.belongs_to_planet_id });

                if(planet_index !== -1) {
                    let origin_planet_coord_index = await main.getCoordIndex({ 'coord_id': dirty.planets[planet_index].coord_id });
                    if(origin_planet_coord_index !== -1) {

                        let linker_position_x = checking_coord.tile_x - dirty.coords[origin_planet_coord_index].tile_x;
                        let linker_position_y = checking_coord.tile_y - dirty.coords[origin_planet_coord_index].tile_y;

                        // step 2. Find the display linker we are trying to move to
                        let display_linker_index = dirty.planet_type_display_linkers.findIndex(function(obj) {
                            return obj.planet_type_id === dirty.planets[planet_index].planet_type_id && obj.position_x === linker_position_x &&
                                obj.position_y === linker_position_y; });

                        // step 3. Check if it's only_visual or not
                        if(display_linker_index !== -1 && !dirty.planet_type_display_linkers[display_linker_index].only_visual) {

                            if(show_output) {
                                console.log("Returning false on " + checking_coord.tile_x + "," + checking_coord.tile_y + " belongs to planet (not doing that anymore)");
                            }
                            // Same deal with the client - why and I returning false on an only visual coord?
                            return false;
                        }



                    }
                }



            }

            if(checking_coord.player_id && checking_coord.player_id !== dirty.players[player_index].id) {

                if(show_output) {
                    console.log("Returning false on " + checking_coord.tile_x + "," + checking_coord.tile_y + " other player");
                }

                return false;
            }

            // We have to make sure that the player can interact with this area
            if(checking_coord.area_id) {
                let area_index = await main.getAreaIndex(checking_coord.area_id);

                if(dirty.players[player_index].id !== dirty.areas[area_index].owner_id && dirty.players[player_index].id !== dirty.areas[area_index].renting_player_id) {

                    if(show_output) {
                        console.log("Returning false. Player doesn't have access to that area");
                    }
                    return false;
                }
            }



        }

        if(show_output) {
            console.log("Returning true");
        }

        return true;
    } catch(error) {
        log(chalk.red("Error in player.canPlace: " + error));
        console.error(error);
    }
}

exports.canPlace = canPlace;



/**
 * 
 * @param {Object} socket 
 * @param {Object} dirty 
 * @param {number} ship_id 
 */
async function claimShip(socket, dirty, ship_id) {
    try {


        if(isNaN(ship_id)) {
            log(chalk.yellow("isNaN ship_id"));
            return false;
        }

        log(chalk.cyan("Player is claiming a ship! with id: " + ship_id));

        if(typeof socket.player_index === 'undefined') {
            log(chalk.yellow("Socket doesn't have a player yet"));
            return false;
        }
        let ship_index = await game_object.getIndex(dirty, parseInt(ship_id));

        if(ship_index === -1) {
            log(chalk.yellow("Couldn't find ship"));
            return false;
        }



        // Make sure the new ship isn't owned by someone already
        if(dirty.objects[ship_index].npc_id || (dirty.objects[ship_index].player_id && dirty.objects[ship_index].player_id !== dirty.players[socket.player_index].id) ) {
            console.log("Can't claim a ship that is already owned by someone");
            socket.emit('chat', { 'message': "Can't claim ship. Already owned", 'scope':'system' });
            socket.emit('result_info', { 'status': 'failure', 'text': "That ship is already owned"});
            return false;
        }

        let ship_object_type_index = main.getObjectTypeIndex(dirty.objects[ship_index].object_type_id);

        if(!dirty.object_types[ship_object_type_index].can_be_claimed) {
            console.log("This cannot be claimed");
            socket.emit('chat', { 'message': "Cannot be claimed", 'scope':'system' });
            socket.emit('result_info', { 'status': 'failure', 'text': dirty.object_types[ship_object_type_index].name + " will not let you claim it" });
            return false; 
        }

        if(dirty.object_types[ship_object_type_index].id === 114) {
            console.log("Can't just claim a pod");
            socket.emit('chat', { 'message': "Cannot be claimed", 'scope':'system' });
            socket.emit('result_info', { 'status': 'failure', 'text': "You can't claim pods (but can switch to them)" });
            return false; 
        }


        // The new ship is now controlled by the player
        dirty.objects[ship_index].player_id = dirty.players[socket.player_index].id;
        dirty.objects[ship_index].has_change = true;

        await game_object.sendInfo(socket, "galaxy", dirty, ship_index);


        for(let i = 0; i < dirty.ship_coords.length; i++) {
            if(dirty.ship_coords[i] && dirty.ship_coords[i].ship_id === dirty.objects[ship_index].id) {

                // Switch the airlock over to the claiming player too
                if(dirty.ship_coords[i].object_type_id === 266) {
                    let changing_object_index = await game_object.getIndex(dirty, dirty.ship_coords[i].object_id);
                    if(changing_object_index !== -1) {
                        dirty.objects[changing_object_index].player_id = dirty.players[socket.player_index].id;
                        dirty.objects[changing_object_index].has_change = true;
                    }
                }

            }
        }


    } catch(error) {
        log(chalk.red("Error in player.claimShip: " + error));
        console.error(error);
    }
}

exports.claimShip = claimShip;


/**
 * 
 * @param {Object} dirty 
 * @param {Object} data 
 * @param {number} data.player_index
 * @param {number} data.damage_amount
 * @param {Array} data.damage_types
 * @param {Object=} data.battle_linker
 * @param {number=} data.calculating_range
 * @param {String=} data.flavor_text
 * @param {String=} data.damage_effect;
 */
async function damage(dirty, data) {
    try {



        let new_player_hp = dirty.players[data.player_index].current_hp - data.damage_amount;


        if(isNaN(new_player_hp)) {
            log(chalk.red("Something damaged a player and set their HP to NaN!!!!"));
            console.trace("INVESTIGATE!");

            if(isNan(dirty.players[data.player_index].current_hp)) {
                log(chalk.red("Player has NaN HP! Gave them 100 HP!"));
                dirty.players[data.player_index].current_hp = 100;
                dirty.players[data.player_index].has_change = true;
            }
            return false;
        }

        if(!data.flavor_text) {
            data.flavor_text = false;
        } else {
            //console.log("In player.damage with flavor text: " + data.flavor_text);
        }

        let sending_damage_types = ['normal'];
        if(typeof data.damage_types !== 'undefined') {
            sending_damage_types = data.damage_types;
        }


        // We're going to override the damage types
        if(typeof data.damage_effect !== 'undefined' && helper.notFalse(data.damage_effect)) {
            sending_damage_types = [data.damage_effect];
        }

        let player_socket = {};

        if(data.battle_linker && data.battle_linker.being_attacked_socket_id) {
            player_socket = io.sockets.connected[data.battle_linker.being_attacked_socket_id];
        } else {
            player_socket = await world.getPlayerSocket(dirty, data.player_index);
        }

        if(new_player_hp <= 0) {
            console.log("Calling player.kill");

            let died_message = "";
            // Lets see if we can't get some decent killed messages here
            if(typeof data.battle_linker !== "undefined") {
                if(data.battle_linker.attacking_type === "monster") {
                    let monster_index = await monster.getIndex(dirty, data.battle_linker.attacking_id);
                    if(monster_index !== -1) {
                        let monster_type_index = main.getMonsterTypeIndex(dirty.monsters[monster_index].monster_type_id);
                        if(monster_type_index !== -1) {
                            died_message = "You were killed by a " + dirty.monster_types[monster_type_index].name;
                        }
                    }
                } else if(data.battle_linker.attacking_type === "player") {
                    let killed_by_player_index = await getIndex(dirty, { 'player_id': data.battle_linker.attacking_id });
                    if(killed_by_player_index !== -1) {
                        died_message = "You were killed by the player " + dirty.players[killed_by_player_index].name;
                    }
                    

                } else if(data.battle_linker.attacking_type === "object") {
                    died_message = "You were killed by an object";
                }
            }

            kill(dirty, data.player_index, died_message);
        } else {
            dirty.players[data.player_index].current_hp = new_player_hp;
            dirty.players[data.player_index].has_change = true;

            await world.increasePlayerSkill(player_socket, dirty, data.player_index, ['defending']);

            if(data.battle_linker) {
                if(helper.notFalse(player_socket)) {
                    io.sockets.connected[data.battle_linker.being_attacked_socket_id].emit('damaged_data', {
                        'player_id': dirty.players[data.player_index].id, 'damage_amount': data.damage_amount, 'was_damaged_type': 'hp',
                        'damage_source_type': data.battle_linker.attacking_type, 'damage_source_id': data.battle_linker.attacking_id,
                        'damage_types': sending_damage_types,
                        'calculating_range': data.calculating_range, 'flavor_text': data.flavor_text
                    });
                }

            } else {


                if(helper.notFalse(player_socket)) {
                    player_socket.emit('damaged_data', {
                        'player_id': dirty.players[data.player_index].id, 'damage_amount': data.damage_amount,
                        'damage_types': sending_damage_types, 'was_damaged_type': 'hp',
                    })
                }




            }


        }

        if(typeof data.damage_types !== 'undefined' && data.damage_types.length !== 0) {
            for(let i = 0; i < data.damage_types.length; i++) {

                if(data.damage_types[i] === 'poison') {
                    //console.log("Player was attacked by a poison attack!");
                    let player_body_index = await game_object.getIndex(dirty, dirty.players[data.player_index].body_id);
                    let object_type_index = main.getObjectTypeIndex(365);
                    game.addAddictionLinker(dirty, player_socket, object_type_index, { 'player_index': data.player_index, 'player_body_index': player_body_index });
                }
            }
        }
    } catch(error) {
        log(chalk.red("Error in player.damage: " + error));
        console.error(error);
    }

}

exports.damage = damage;

async function getCoordAndRoom(dirty, player_index) {

    try {

        let room = "";
        let coord_index = -1;
        let scope = "";
        let coord = {};

        if (dirty.players[player_index].coord_id) {

            coord_index = await getCoordIndex(dirty, player_index, 'galaxy');

            if (coord_index !== -1) {
                room = "galaxy";
                scope = "galaxy";
                coord = dirty.coords[coord_index];
            }
        }

        if (dirty.players[player_index].planet_coord_id) {

            coord_index = await getCoordIndex(dirty, player_index, 'planet');            

            if (coord_index !== -1) {
                room = "planet_" + dirty.planet_coords[coord_index].planet_id;
                scope = "planet";
                coord = dirty.planet_coords[coord_index];
            }

        } else if (dirty.players[player_index].ship_coord_id) {

            coord_index = await getCoordIndex(dirty, player_index, 'ship');


            if (coord_index !== -1) {
                room = "ship_" + dirty.ship_coords[coord_index].ship_id;
                scope = "ship";
                coord = dirty.ship_coords[coord_index];
            }
        }

        return { 'room': room, 'coord_index': coord_index, 'coord': coord, 'scope': scope };
    } catch (error) {
        log(chalk.red("Error in player.getCoordAndRoom: " + error));
    }

}

exports.getCoordAndRoom = getCoordAndRoom;


// The point of this function is to transition to using a planet_coord_index|ship_coord_index|coord_index on the player
// Most of the code in here is basically error checking while we transition. We can't trust the indexes yet, so issue warnings
// when they would have been wrong, or something wasn't updated
// scope is basically for the same thing. We shouldn't technically need it if we're updating the objects properly
async function getCoordIndex(dirty, player_index, scope) {
    try {

        if(scope === 'planet') {

            if(typeof dirty.players[player_index].planet_coord_index === 'undefined') {
                log(chalk.yellow("in player.getCoordIndex. planet_coord_index was undefined still"));
                return await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.players[player_index].planet_coord_id });
            
            }
            return dirty.players[player_index].planet_coord_index;

        } else if(scope === 'ship') {
            
            if(typeof dirty.players[player_index].ship_coord_index === 'undefined') {
                log(chalk.yellow("in player.getCoordIndex. ship_coord_index was undefined still"));
                return await main.getShipCoordIndex({ 'ship_coord_id': dirty.players[player_index].ship_coord_id });
            
            }
            
            return dirty.players[player_index].ship_coord_index;

        } else if(scope === 'galaxy') {

            if(typeof dirty.players[player_index].coord_index === 'undefined') {
                log(chalk.yellow("in player.getCoordIndex. coord_index was undefined still"));
                return await main.getCoordIndex({ 'coord_id': dirty.players[player_index].coord_id });
            
            }
            
            return dirty.players[player_index].coord_index;

        }

        

    } catch(error) {
        log(chalk.red("Error in game_object.getCoordIndex: " + error));
        console.error(error);
    }
}

exports.getCoordIndex = getCoordIndex;


async function getEquipment(dirty, body_id) {

    try {

        if(isNaN(body_id)) {
            log(chalk.red("Nan value passed in as body id: " + body_id));
            return false;
        }

        let [rows, fields] = await (pool.query("SELECT * FROM equipment_linkers WHERE body_id = ?",
            [body_id]));

        if(rows[0]) {
            for(let i = 0; i < rows.length; i++) {
                let equipment_linker = rows[i];
                // see if we already have the equipment linker, if not, add it
                let equipment_linker_index = dirty.equipment_linkers.findIndex(function(obj) { return obj && obj.id === equipment_linker.id });
                if(equipment_linker_index === -1) {
                    equipment_linker.has_change = false;
                    dirty.equipment_linkers.push(equipment_linker);
                    //console.log("Added that player id: " + equipment_linker.player_id + " has object type id: " + equipment_linker.object_type_id + " equipped");
                }

            }
        }
    } catch(error) {
        log(chalk.red("Error in player.getEquipment: " + error));
        console.error(error);
    }



}

exports.getEquipment = getEquipment;


// we pull in a socket_id from the function instead of the database ideally - because the database might not have updated yet.
// TODO RIGHT NOW we are adding in the ability to query for a player by body id

//      data: body_id   |   name   |   player_id   |   source
/**
 * @param {Object} dirty
 * @param {Object} data
 * @param {number=} data.player_id
 * @param {number=} data.body_id
 * @param {String=} data.name
 * @param {String=} data.source
 */
async function getIndex(dirty, data) {

    try {
        //console.log("In player.getIndex");

        if(!data.source) {
            data.source = '';
        }

        // Looking up via id, and the id is malformed
        if(data.player_id) {

            if(isNaN(data.player_id)) {
                log(chalk.yellow("Player id was NaN. Source: " + data.source));
                console.log(data);
                return -1;
            }

        }

        if(data.body_id) {

            if(isNaN(data.body_id)) {
                log(chalk.yellow("Body id was NaN. Source: " + data.source));
                console.log(data);
                return -1;
            }

        }


        let player_index = -1;

        if(data.player_id) {
            player_index = dirty.players.findIndex(function(obj) { return obj && obj.id === data.player_id; });
        }
        // Its important to note that with a check on something that can change - their body - we can have an instance
        // where mysql wants to return a different value than we have in dirty (player just updated body,
        // dirty isn't written yet)
        else if(data.body_id) {
            player_index = dirty.players.findIndex(function(obj) { return obj && obj.body_id === data.body_id; });
        } else if(data.name) {

            data.name = helper.cleanStringInput(name);
            player_index = dirty.players.findIndex(function(obj) { return obj && obj.name === data.name });
        }

        if(player_index === -1) {

            //console.log("Did not find player in dirty. Was sent in player_id: " + data.player_id + " body_id: " + data.body_id);
            //console.trace("Seeing what called this");

            let where_part;
            let inserts;

            if(data.player_id) {
                where_part = 'WHERE id = ?';
                inserts = [data.player_id];
            } else if(data.body_id) {
                where_part = 'WHERE body_id = ?';
                inserts = [data.body_id];
            } else if(data.name) {
                where_part = 'WHERE name = ?';
                inserts = [data.name];
            }

            let [rows, fields] = await (pool.query("SELECT * FROM players " + where_part, inserts));

            if(rows[0]) {
                let adding_player = rows[0];

                // If someone has a long description, I don't want it being sent around everywhere
                adding_player.description = "";

                adding_player.has_change = false;
                //console.log("Adding player id: " + adding_player.id + " name: " + adding_player.name);


                // Since the MySQL query is so slow - we could have added the player inbetween then and now. FINAL CHECK!
                // Here we can just checked based on the ID we got back
                player_index = dirty.players.findIndex(function(obj) { return obj && obj.id === adding_player.id; });

                /*
                if(data.player_id) {
                    player_index = dirty.players.findIndex(function(obj) { return obj && obj.id === data.player_id; });
                } else if(data.body_id) {
                    player_index = dirty.players.findIndex(function(obj) { return obj && obj.body_id === data.body_id; });
                } else if(data.name) {
                    player_index = dirty.players.findIndex(function(obj) { return obj && obj.name === data.name })
                }

                */

                if(player_index !== -1) {
                    //log(chalk.yellow("Looks like we already added the player"));

                    // We've already found the player in dirty - we were passed in a body id, and that player's body id doesn't
                    // match what mysql still had ( dirty data has changes that haven't been written yet )
                    if(data.body_id && dirty.players[player_index].body_id !== data.body_id) {
                        return -1;
                    }
                } else {
                    player_index = dirty.players.push(adding_player) - 1;

                    dirty.players[player_index].id = parseInt(dirty.players[player_index].id);
                    dirty.players[player_index].body_id = parseInt(dirty.players[player_index].body_id);
                    dirty.players[player_index].attacks_defended = 0;

                    //console.log("Testing!!! Player index on dirty is: " + player_index);
                    //console.log("Player name at dirty.players index " + player_index + " is....: " + dirty.players[player_index].name);

                    // Brand new created player won't actually have a body when this is first called
                    if(dirty.players[player_index].body_id) {
                        await getEquipment(dirty, dirty.players[player_index].body_id);
                    }

                    await getInventory(dirty, player_index);
                    await getResearchLinkers(dirty, dirty.players[player_index].id);
                    await getRelationshipLinkers(dirty, dirty.players[player_index].id);
                    await getShips(dirty, player_index);

                }



            }
        }


        //console.log("Returning player index: " + player_index);

        return player_index;


    } catch(error) {
        log(chalk.red("Error in player.getIndex: " + error));
        console.error(error);
    }

}

exports.getIndex = getIndex;


// 
async function getInventory(dirty, player_index) {

    //console.log("In player.getInventory");

    try {
        let [rows, fields] = await (pool.query("SELECT * FROM inventory_items WHERE inventory_items.player_id = ?",
            [dirty.players[player_index].id]));

        if(rows[0]) {
            for(let i = 0; i < rows.length; i++) {

                let inventory_item = rows[i];
                //console.log("player " + player_id + " has inventory item id: " + inventory_item.id);

                // see if we already have the equipment linker, if not, add it
                let ii_index = dirty.inventory_items.findIndex(function(obj) { return obj && obj.id === inventory_item.id; });
                if(ii_index === -1) {
                    inventory_item.has_change = false;
                    let new_inventory_item_index = dirty.inventory_items.push(inventory_item) - 1;
                    world.processInventoryItem(dirty, new_inventory_item_index);
                    //console.log("Added that player id: " + inventory_item.player_id + " has inventory object type id: " + inventory_item.object_type_id);

                    if(!dirty.inventory_items[new_inventory_item_index].body_id) {
                        console.log("Inventory item of player has no body id. Lets set one!");
                        dirty.inventory_items[new_inventory_item_index].body_id = dirty.players[player_index].body_id;
                        dirty.inventory_items[new_inventory_item_index].has_change = true;
                        

                    }
                }

            }
        }
    } catch(error) {
        console.log("Error in player.getInventory: " + error);
        console.error(error);
    }

}

exports.getInventory = getInventory;



/**
 * @param {Object} dirty
 * @param {Object} data
 * @param {number} data.player_index
 * @param {String} data.skill_type
 * @param {number=} data.body_index
 * @param {String=} data.scope
 * @param {number=} data.coord_index
 * @return {Promise<number>}
 * 
 */
async function getLevel(dirty, data) {

    try {
        let level = 1;

        let body_index = -1;
        let body_type_index = -1;

        let ship_index = -1;
        let ship_type_index = -1;

        if (!data.scope || data.scope !== 'galaxy') {

            if (data.body_index) {
                body_index = data.body_index;
            } else {
                body_index = await game_object.getIndex(dirty, dirty.players[data.player_index].body_id);

                if (body_index === -1) {
                    log(chalk.yellow("Could not get a body for the player"));
                    return 1;
                }
            }


            body_type_index = main.getObjectTypeIndex(dirty.objects[body_index].object_type_id);
        }

        // Go through each level type!
        if (data.skill_type === 'control') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.players[data.player_index].control_skill_points));
        } else if (data.skill_type === 'cooking') {
            level = 1 + Math.floor(global.difficult_level_modifier * Math.sqrt(dirty.players[data.player_index].cooking_skill_points));

        } else if (data.skill_type === 'corrosive') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.players[data.player_index].corrosive_skill_points));
        } else if (data.skill_type === 'defense') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.players[data.player_index].defending_skill_points));

            // If it's the galaxy view, we need the player's ship's defense
            if (!data.scope || data.scope === 'galaxy') {
                ship_index = await game_object.getIndex(dirty, dirty.players[data.player_index].ship_id);
    
                if (ship_index === -1) {
                    log(chalk.yellow("Could not get a ship for the player"));
                    return 1;
                }
    
    
                ship_type_index = main.getObjectTypeIndex(dirty.objects[ship_index].object_type_id);
    
            }

            if (body_type_index !== -1 && dirty.object_types[body_type_index].defense_modifier) {
                level += dirty.object_types[body_type_index].defense_modifier;
            }

            if (ship_type_index !== -1 && dirty.object_types[ship_type_index].defense_modifier) {
                level += dirty.object_types[ship_type_index].defense_modifier;
            }

        } else if (data.skill_type === 'electric') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.players[data.player_index].electric_skill_points));
        } else if (data.skill_type === 'explosion') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.players[data.player_index].explosion_skill_points));
        } else if (data.skill_type === 'farming') {
            level = 1 + Math.floor(global.difficult_level_modifier * Math.sqrt(dirty.players[data.player_index].farming_skill_points));

            if (body_type_index !== -1 && dirty.object_types[body_type_index].farming_modifier) {
                level += dirty.object_types[body_type_index].farming_modifier;
                console.log("Body type added: " + dirty.object_types[body_type_index].farming_modifier + " to farming level");
            }
        } else if (data.skill_type === 'freezing') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.players[data.player_index].freezing_skill_points));
        } else if (data.skill_type === 'hacking') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.players[data.player_index].hacking_skill_points));
        }
        else if (data.skill_type === 'heat') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.players[data.player_index].heat_skill_points));
        } else if (data.skill_type === 'gravity') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.players[data.player_index].gravity_skill_points));
        } else if (data.skill_type === 'laser') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.players[data.player_index].laser_skill_points));
        }
        else if (data.skill_type === 'manufacturing') {

            level = 1 + Math.floor(global.difficult_level_modifier * Math.sqrt(dirty.players[data.player_index].manufacturing_skill_points));

            if(data.scope === 'ship' && typeof data.coord_index !== 'undefined') {
                let ship_index = await game_object.getIndex(dirty, dirty.ship_coords[data.coord_index].ship_id);
                if(ship_index !== -1) {
                    ship_type_index = main.getObjectTypeIndex(dirty.objects[ship_index].object_type_id);
                }


            }

            if (ship_type_index !== -1 && dirty.object_types[ship_type_index].manufacturing_modifier) {
                level += dirty.object_types[ship_type_index].manufacturing_modifier;
            }

            if (body_type_index !== -1 && dirty.object_types[body_type_index].manufacturing_modifier) {
                level += dirty.object_types[body_type_index].manufacturing_modifier;
            }

        } else if (data.skill_type === 'melee') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.players[data.player_index].melee_skill_points));
        } else if (data.skill_type === 'mining') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.players[data.player_index].mining_skill_points));


            // If it's the galaxy view, we need the player's ship's defense
            if (!data.scope || data.scope === 'galaxy') {
                ship_index = await game_object.getIndex(dirty, dirty.players[data.player_index].ship_id);
    
                if (ship_index === -1) {
                    log(chalk.yellow("Could not get a ship for the player"));
                    return 1;
                }
    
    
                ship_type_index = main.getObjectTypeIndex(dirty.objects[ship_index].object_type_id);
    
            }

            if (ship_type_index !== -1 && dirty.object_types[ship_type_index].mining_modifier) {
                level += dirty.object_types[ship_type_index].mining_modifier;
            }


            // Body could help too
            if (body_type_index !== -1 && dirty.object_types[body_type_index].mining_modifier) {
                level += dirty.object_types[body_type_index].mining_modifier;
            }

        } else if (data.skill_type === 'piercing') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.players[data.player_index].piercing_skill_points));
        } else if (data.skill_type === 'plasma') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.players[data.player_index].plasma_skill_points));
        } else if (data.skill_type === 'poison') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.players[data.player_index].poison_skill_points));
        } else if (data.skill_type === 'radiation') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.players[data.player_index].radiation_skill_points));
        } else if (data.skill_type === 'repairing') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.players[data.player_index].repairing_skill_points));
        } else if (data.skill_type === 'researching') {
            level = 1 + Math.floor(global.difficult_level_modifier * Math.sqrt(dirty.players[data.player_index].researching_skill_points));

            if(data.scope === 'ship' && typeof data.coord_index !== 'undefined') {
                let ship_index = await game_object.getIndex(dirty, dirty.ship_coords[data.coord_index].ship_id);
                if(ship_index !== -1) {
                    ship_type_index = main.getObjectTypeIndex(dirty.objects[ship_index].object_type_id);
                    
                    if(ship_type_index === -1) {
                        console.log("Could not get the ship type ");
                    }

                } else {
                    console.log("Could not get ship");
                }

            } else {
                console.log("Scope has us not checking for ship");
            }


            if (ship_type_index !== -1 && dirty.object_types[ship_type_index].researching_modifier) {
                level += dirty.object_types[ship_type_index].researching_modifier;
                console.log("Ship type added: " + dirty.object_types[ship_type_index].researching_modifier + " to researching level");
            } else if(ship_type_index !== -1) {
                console.log("Didn't add from ship. ship_type_index: " + ship_type_index + " ship type researching modifier: " + dirty.object_types[ship_type_index].researching_modifier);
            }

            if (body_type_index !== -1 && dirty.object_types[body_type_index].researching_modifier) {
                level += dirty.object_types[body_type_index].researching_modifier;
                console.log("Body type added: " + dirty.object_types[body_type_index].researching_modifier + " to researching level");
            }

        } else if (data.skill_type === 'salvaging') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.players[data.player_index].salvaging_skill_points));
        } else if (data.skill_type === 'surgery') {
            level = 1 + Math.floor(global.difficult_level_modifier * Math.sqrt(dirty.players[data.player_index].surgery_skill_points));
        }

        // Lets go through each of the player's equipped items too
        // I think we only need to do this when dealing with a player's body for now
        if (body_index !== -1) {
            for (let i = 0; i < dirty.equipment_linkers.length; i++) {
                if (dirty.equipment_linkers[i] && dirty.equipment_linkers[i].body_id === dirty.objects[body_index].id) {

                    let equipped_object_index = -1;
                    let equipped_object_type_index = -1;

                    if (dirty.equipment_linkers[i].object_id) {
                        equipped_object_index = await game_object.getIndex(dirty, dirty.equipment_linkers[i].object_id);
                        if (equipped_object_index !== -1) {
                            equipped_object_type_index = main.getObjectTypeIndex(dirty.objects[equipped_object_index].object_type_id);
                        }
                    } else if (dirty.equipment_linkers[i].object_type_id) {
                        equipped_object_type_index = main.getObjectTypeIndex(dirty.equipment_linkers[i].object_type_id);
                    }

                    if (equipped_object_type_index !== -1) {
                        if (data.skill_type === 'manufacturing' && dirty.object_types[equipped_object_type_index].manufacturing_modifier) {
                            log(chalk.green("Equipped item is adding manufacturing level (augment?!?)!"));
                            level += dirty.object_types[equipped_object_type_index].manufacturing_modifier;
                        }
                    }


                }
            }


            // And eating linkers!
            for(let i = 0; i < dirty.eating_linkers.length; i++) {
                if(dirty.eating_linkers[i] && dirty.eating_linkers[i].body_id === dirty.objects[body_index].id) {
                    let race_linker_index = main.getRaceEatingLinkerIndex({
                        'race_id': dirty.object_types[body_type_index].race_id, 'object_type_id': dirty.eating_linkers[i].eating_object_type_id
                    });

                    if(dirty.race_eating_linkers[race_linker_index].manufacturing && data.skill_type === 'manufacturing') {
                        //console.log("Eating increased player attack by: " + dirty.race_eating_linkers[race_linker_index].attack);
                        level += dirty.race_eating_linkers[race_linker_index].manufacturing;
                    }
                }
            }

            // And addiction!
            // and minuses for each addiction without a matching eating linker (addictions are held off while the player is still consuming them)
            for(let i = 0; i < dirty.addiction_linkers.length; i++) {

                if(dirty.addiction_linkers[i] && dirty.addiction_linkers[i].body_id === dirty.objects[body_index].id) {

                    let still_eating = false;
                    for(let j = 0; j < dirty.eating_linkers.length; j++) {
                        if(dirty.eating_linkers[j] && dirty.eating_linkers[j].body_id === dirty.objects[body_index].id) {
                            if(dirty.eating_linkers[j].eating_object_type_id === dirty.addiction_linkers[i].addicted_to_object_type_id) {
                                still_eating = true;
                            }
                        }
                    }


                    if(!still_eating) {
                        let race_linker_index = main.getRaceEatingLinkerIndex({
                            'race_id': dirty.object_types[body_type_index].race_id, 'object_type_id': dirty.addiction_linkers[i].addicted_to_object_type_id
                        });
    
                        if(dirty.race_eating_linkers[race_linker_index].manufacturing && data.skill_type === 'manufacturing') {
                            console.log("Reduced player manufacturing due to addiction linker");
                            level -= dirty.addition_linkers[i].addiction_level * dirty.race_eating_linkers[race_linker_index].manufacturing;
                        }
                    }

                }

            }

        }

      
        if(data.skill_type === 'manufacturing') {
            //console.log("Manufacturing level returned: " + level);
        }



        return level;
    } catch (error) {
        log(chalk.red("Error in player.getLevel: " + error));
        console.error(error);
    }

}

exports.getLevel = getLevel;


async function getRelationshipLinkers(dirty, player_id) {

    try {
        let [rows, fields] = await (pool.query("SELECT * FROM player_relationship_linkers WHERE player_id = ?",
            [player_id]));

        if(rows[0]) {
            for(let i = 0; i < rows.length; i++) {
                let player_relationship_linker = rows[i];
                // see if we already have the relationship linker, if not, add it
                let player_relationship_linker_index = dirty.player_relationship_linkers.findIndex(function(obj) { return obj && obj.id === player_relationship_linker.id; });
                if(player_relationship_linker_index === -1) {
                    player_relationship_linker.has_change = false;
                    dirty.player_relationship_linkers.push(player_relationship_linker);

                }

            }
        }
    } catch(error) {
        log(chalk.red("Error in player.getRelationshipLinkers: " + error));
    }

}

exports.getRelationshipLinkers = getRelationshipLinkers;

async function getResearchLinkers(dirty, player_id) {

    try {
        let [rows, fields] = await (pool.query("SELECT * FROM player_research_linkers WHERE player_id = ?",
            [player_id]));

        if(rows[0]) {
            for(let i = 0; i < rows.length; i++) {
                let player_research_linker = rows[i];
                // see if we already have the research linker, if not, add it
                let player_research_linker_index = dirty.player_research_linkers.findIndex(function(obj) { return obj && obj.id === player_research_linker.id });
                if(player_research_linker_index === -1) {
                    player_research_linker.has_change = false;
                    dirty.player_research_linkers.push(player_research_linker);
                    //console.log("Added that player id: " + player_research_linker.player_id + " has research linker for object type id: " + player_research_linker.object_type_id );
                }

            }
        }
    } catch(error) {
        log(chalk.red("Error in player.getResearchLinkers: " + error));
        console.error(error);
    }

}

exports.getResearchLinkers = getResearchLinkers;



async function getShips(dirty, player_index) {


    //log(chalk.green("\nIN GETPLAYERSHIPS"));

    // Get object types that are ships
    let ship_object_type_ids = [];

    for(let object_type of dirty.object_types) {
        if(object_type.is_ship) {
            ship_object_type_ids.push('"' + object_type.id + '"');
        }
    }



    try {
        let [rows, fields] = await (pool.query("SELECT id FROM objects WHERE player_id = ? AND object_type_id IN(" + ship_object_type_ids.join(',') + ")",
            [dirty.players[player_index].id]));

        if(rows[0]) {
            for(let i = 0; i < rows.length; i++) {
                //log(chalk.cyan("Found ship id: " + rows[i].id));

                await game_object.getIndex(dirty, rows[i].id);

            }
        }
    } catch(error) {
        log(chalk.red("Error in player.getShips: " + error));
        console.error(error);
    }

}

exports.getShips = getShips;


async function kill(dirty, player_index, killed_by_text = "") {

    try {

        // return false if we already have an entry in the database queue
        let database_queue_index = dirty.database_queue.findIndex(function(obj) { return obj &&
            obj.player_id === dirty.players[player_index].id && obj.action === 'kill' });;

        if(database_queue_index !== -1) {
            console.log("Already killing player");
            return false;
        }

        // Immediately put in a memory block from multi killing the player
        database_queue_index = dirty.database_queue.push({'player_id': dirty.players[player_index].id, 'action': 'kill' }) - 1;

        log(chalk.green("\nPlayer id: " + dirty.players[player_index].id + " has died"));


        // First thing we do is remove all battle linkers
        world.removeBattleLinkers(dirty, { 'player_id': dirty.players[player_index].id });

        // Get the socket the player is connected with
        let player_socket = world.getPlayerSocket(dirty, player_index);
        if(helper.isFalse(player_socket)) {
            console.log("Player doesn't look to be currently connected");
        } else {
            console.log("Got player socket id as: " + player_socket.id);
        }


        // We're going to spawn a dead body whether we can place it or not
        let insert_object_type_data = { 'object_type_id': 151 };
        let new_object_index = await world.insertObjectType(false, dirty, insert_object_type_data);


        console.log("Created the dead body");

        // Players can die while on a planet, in their ship, or if their ship got destroyed

        if(dirty.players[player_index].planet_coord_id) {
            let coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.players[player_index].planet_coord_id });

            // player is off this planet coord
            dirty.planet_coords[coord_index].player_id = false;
            dirty.planet_coords[coord_index].has_change = true;


            let can_place_result = await game_object.canPlace(dirty, 'planet', dirty.planet_coords[coord_index],
                { 'object_type_id': 151 });

            // place the dead body
            if(can_place_result) {
                

                await game_object.place(false, dirty, { 'object_index': new_object_index,
                    'planet_coord_index': coord_index });

                /*
                await world.addObjectToPlanetCoord(dirty, new_object_index, coord_index);
                await planet.sendCoordInfo(false, "planet_" + dirty.planet_coords[coord_index].planet_id,
                    dirty, { 'planet_coord_index': coord_index});
                */
                console.log("Added it to planet coord, and sent planet coord info");

            } else {

                dirty.waiting_drops.push({'object_index': new_object_index, 'planet_coord_index': coord_index });
                log(chalk.yellow("Could not place dead body. Pushed to waiting_drops"));
            }


        }
        // Ship ID before coord id
        else if(dirty.players[player_index].ship_coord_id) {
            let coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.players[player_index].ship_coord_id });



            // Don't want to overwrite the object that is already on the tile
            if(!dirty.ship_coords[coord_index].object_id) {
                console.log("Trying to place the dead body on the ship");
                await main.updateCoordGeneric(player_socket, { 'ship_coord_index': coord_index, 'player_id': false, 'object_index': new_object_index });
            } else {
                dirty.waiting_drops.push({'object_index': new_object_index, 'ship_coord_index': coord_index });
                log(chalk.yellow("Could not place dead body. Pushed to waiting_drops"));
            }




            console.log("Added it to ship coord, and sent ship coord info");

        } else if(dirty.players[player_index].coord_id) {
            /// ?????????????????
            log(chalk.yellow("Ship should have been damaged, not player. Maybe ship got to 0 HP?"));
            return false;
        }


        // lets see what the player has on their body, and put it in the dead body
        let body_index = await game_object.getIndex(dirty, dirty.players[player_index].body_id);
        console.log("Got body index as: " + body_index + ". Player body id was: " + dirty.players[player_index].body_id);

        // Unequip all the items (this puts basically everything back into the inventory of the player



        for(let equipment_linker of dirty.equipment_linkers) {
            if(equipment_linker) {
                if(equipment_linker.body_id === dirty.objects[body_index].id) {
                    await unequip(player_socket, dirty, equipment_linker.id);
                }
            }

        }


        // Remove inventory items from this body, and put them in the dead body
        for(let i = 0; i < dirty.inventory_items.length; i++) {
            if(dirty.inventory_items[i] && dirty.inventory_items[i].player_id === dirty.players[player_index].id && dirty.inventory_items[i].body_id === dirty.objects[body_index].id) {

                // remove the inventory item
                let remove_data = { 'inventory_item_id': dirty.inventory_items[i].id, 'amount': dirty.inventory_items[i].amount };
                let add_data = { 'adding_to_type': 'object', 'adding_to_id': dirty.objects[new_object_index].id, 'amount': dirty.inventory_items[i].amount };
                if(dirty.inventory_items[i].object_id) {
                    add_data.object_id = dirty.inventory_items[i].object_id;
                }

                if(dirty.inventory_items[i].object_type_id) {
                    add_data.object_type_id = dirty.inventory_items[i].object_type_id;
                }
                await inventory.removeFromInventory(player_socket, dirty, remove_data);

                await inventory.addToInventory(player_socket, dirty, add_data);
            }
        }


        //console.log("Moved inventory items into dead body");

        // delete the old body
        console.log("Going to delete the old body. Body index: " + body_index);
        let delete_body_result = await game_object.deleteObject(dirty, { 'object_index': body_index });

        console.log("Tried to delete the old body. Result: " + delete_body_result);

        // give the player a new body
        // TODO we want to have a cost for body switching for any reason
        await world.setPlayerBody(dirty, player_index);

        // and put our HP back to max
        dirty.players[player_index].current_hp = dirty.players[player_index].max_hp;
        dirty.players[player_index].has_change = true;



        console.log("DONE WITH THE NEW STUFF");



        
        if(helper.notFalse(player_socket)) {
            await movement.switchToGalaxy(player_socket, dirty, player_index, 'death');
            player_socket.emit('message_data', { 'message': "Your body was killed", 'scope': 'system' });
        }
        

        // and clear out the database queue
        delete dirty.database_queue[database_queue_index];


        // and lets add in a player log of what killed them
        if(helper.isFalse(killed_by_text)) {
            killed_by_text = "You died from an unknown source";
        }
        world.addPlayerLog(dirty, player_index, killed_by_text, { 'scope': 'personal' });


        return true;

    } catch(error) {
        log(chalk.red("Error in player.kill: " + error));
        console.error(error);
    }
}

exports.kill = kill;

async function sendInfo(socket, room, dirty, player_id) {

    try {
        player_id = parseInt(player_id);
        //console.log("In sendPlayerInfo with player_id " + player_id);

        let player_index = await getIndex(dirty, { 'player_id': player_id });

        if (player_index === -1) {
            log(chalk.red("Unable to find player"));
            return false;
        }


        if (helper.notFalse(socket)) {
            socket.emit('player_info', { 'player': dirty.players[player_index] });
        }

        if (helper.notFalse(room)) {
            io.to(room).emit('player_info', { 'player': dirty.players[player_index] });
        }




        // If we are requesting player info for the player that the socket belongs to, grab an AI objects
        // and AI rules
        // Not sure we need this here. We send the info when the player logs in
        /*
        if(socket.player_id === player_id) {
            sendPlayerAIs(socket, room, dirty, player_id);

        }

        */
    } catch (error) {
        log(chalk.red("Error in player.sendInfo: " + error));
        console.error(error);
    }

}

exports.sendInfo = sendInfo;


async function sendShips(socket, dirty, player_index) {

    try {

        // lets create an array of the object type ids that are ships
        let object_type_ids = [];
        for(let i = 0; i < dirty.object_types.length; i++) {
            if(dirty.object_types[i] && dirty.object_types[i].is_ship) {
                object_type_ids.push(dirty.object_types[i].id);
            }
        }

        for(let s = 0; s < dirty.objects.length; s++) {
            if(dirty.objects[s] && dirty.objects[s].player_id === dirty.players[player_index].id &&
                object_type_ids.includes(dirty.objects[s].object_type_id)) {

                await game_object.sendInfo(socket, false, dirty, s);
            }
        }

    } catch(error) {
        log(chalk.red("Error in sendPlayerShips: " + error));
        console.error(error);
    }


}

exports.sendShips = sendShips;


async function setShipIndex(socket, dirty) {

    try {

        let player_ship_index = await game_object.getIndex(dirty, dirty.players[socket.player_index].ship_id);
        dirty.players[socket.player_index].ship_index = player_ship_index;
        return true;
    } catch(error) {
        log(chalk.red("Error in player.setShipIndex: " + error));
        console.error(error);
    }
}

exports.setShipIndex = setShipIndex;


// There are two general scenarios where this is called
// 1. Claiming and switching to a ship in the galaxy mode
// 2. Switching to a different ship at a spaceport
/**
 * @param {Object} socket
 * @param {Object} dirty
 * @param {Object} data
 * @param {number} data.ship_id
 */
async function switchShip(socket, dirty, data) {
    try {
        log(chalk.cyan("Player is switching to ship(object) with id: " + data.ship_id));

        let player_index = await getIndex(dirty, { 'player_id': socket.player_id });

        if(player_index === -1) {
            log(chalk.yellow("Could not find player. Returning false"));
            return false;
        }

        // So lets go through the various scenarios
        // 1. Player was on a pod, now they aren't
        // 2. Player was already on another ship


        // ship is an object, and we store it as the player's ship_id
        let old_ship_index = await game_object.getIndex(dirty, dirty.players[player_index].ship_id);
        let new_ship_index = await game_object.getIndex(dirty, parseInt(data.ship_id));

        if(!old_ship_index) {
            log(chalk.yellow("Couldn't find old ship index"));
            return false;
        }

        if(dirty.objects[old_ship_index].id === dirty.objects[new_ship_index].id) {
            console.log("Can't claim your current ship");
            socket.emit('chat', { 'message': "Can't reclaim your current ship", 'scope':'system' });
            return false;
        }

        // Make sure the new ship isn't owned by someone already
        if(dirty.objects[new_ship_index].player_id && dirty.objects[new_ship_index].player_id !== socket.player_id) {
            console.log("Can't claim a ship that is already owned by someone");
            socket.emit('chat', { 'message': "Can't claim ship. Already owned", 'scope':'system' });
            return false;
        }

        let new_ship_object_type_index = main.getObjectTypeIndex(dirty.objects[new_ship_index].object_type_id);

        if(!dirty.object_types[new_ship_object_type_index].can_be_claimed) {
            console.log("This cannot be claimed");
            socket.emit('chat', { 'message': "Cannot be claimed", 'scope':'system' });
            return false; 
        }




        // Switch is happening in a spaceport
        if(dirty.players[player_index].planet_coord_id) {
            dirty.players[player_index].ship_id = dirty.objects[new_ship_index].id;
            dirty.players[player_index].ship_index = new_ship_index;
            dirty.players[player_index].ship_coord_id = false;
            dirty.players[player_index].ship_coord_index = -1;
            dirty.players[player_index].previous_ship_coord_id = false;
            dirty.players[player_index].has_change = true;
            await sendInfo(socket, false, dirty, dirty.players[player_index].id);
        }
        // Switch is happening on a ship
        // 1. Switching to the ship our other ship is docked at, since we own both
        // 2. Switching between two ships docked at a station we are on
        // 3. Jumping out of a ship via an emergency pod
        if(dirty.players[player_index].ship_coord_id) {

            console.log("Player is switching to ship: " + dirty.objects[new_ship_index].id + " while on another ship");

            dirty.players[player_index].ship_id = dirty.objects[new_ship_index].id;
            dirty.players[player_index].ship_index = new_ship_index;
            dirty.players[player_index].has_change = true;

            // We switched ships while on a ship that isn't dockable - meaning we jumped out!
            
            if(!dirty.objects[old_ship_index].is_dockable && dirty.objects[new_ship_index].object_type_id === 114 && 
                helper.notFalse(dirty.objects[new_ship_index].coord_id) && dirty.objects[new_ship_index].coord_id !== dirty.objects[old_ship_index].coord_id) {
                log(chalk.cyan("An emergency pod was used!"));

                console.log("Old ship is on coord id: " + dirty.objects[old_ship_index].coord_id);
                let old_ship_coord_index = await main.getCoordIndex({ 'coord_id': dirty.objects[old_ship_index].coord_id });
                if(old_ship_coord_index !== -1) {
                    main.updateCoordGeneric(socket, { 'coord_index': old_ship_coord_index, 'object_id': dirty.objects[old_ship_index].id });
                }

                let previous_ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.players[player_index].ship_coord_id });

                main.updateCoordGeneric(socket, { 'ship_coord_index': previous_ship_coord_index, 'player_id': false });
                

                dirty.players[player_index].ship_coord_id = false;
                dirty.players[player_index].ship_coord_index = -1;
                dirty.players[player_index].previous_ship_coord_id = false;
                dirty.players[player_index].has_change = true;

            }

            

            // We're still at the same place on the ship we are currently on
            else {

                console.log("Just set a new ship_id for the player");

            }
            


            await sendInfo(socket, false, dirty, dirty.players[player_index].id);

            // If our new ship is docked at something, we remove our player from the galaxy coord
            if(dirty.players[player_index].coord_id && dirty.objects[new_ship_index].docked_at_object_id) {

                let coord_index = await main.getCoordIndex({ 'coord_id': dirty.players[player_index].coord_id });
                await main.updateCoordGeneric(socket, { 'coord_index': coord_index, 'player_id': false });

                dirty.players[player_index].coord_id = false;
                dirty.players[player_index].coord_index = -1;
                dirty.players[player_index].has_change = true;
                await sendInfo(socket, "galaxy", dirty, dirty.players[player_index].id);
                await sendInfo(socket, "ship_" + dirty.objects[new_ship_index].id, dirty, dirty.players[player_index].id);
            }


        }

        // Switching ships could happen on a planet, or on a galaxy
        // If we are on the galaxy, we are moving the player to the coord with the new ship
        else if(dirty.objects[new_ship_index].coord_id) {

            let new_ship_coord_index = await main.getCoordIndex({'coord_id': dirty.objects[new_ship_index].coord_id});
            let old_player_coord_index = await main.getCoordIndex({'coord_id': dirty.players[player_index].coord_id});

            if(new_ship_coord_index === -1 || old_player_coord_index === -1) {
                return false;
            }

            // The old ship is now on a coord (set in updateCoordGeneric)
            // If it's a pod, we remove the player from it
            if(dirty.objects[old_ship_index].object_type_id === 114) {
                dirty.objects[old_ship_index].player_id = false;
                dirty.objects[old_ship_index].has_change = true;
                await game_object.sendInfo(socket, "galaxy", dirty, old_ship_index);
            }
            


            console.log("Old coord should still have the old ship on it");
            // The player leaves the old ship on the coord they were on (leaving that coord)
            await main.updateCoordGeneric(socket, { 'coord_index': old_player_coord_index,
                'object_id': dirty.objects[old_ship_index].id, 'player_id': false });

            // And moves to the new ship
            await main.updateCoordGeneric(socket, { 'coord_index': new_ship_coord_index, 'object_id': false,
                'player_id': dirty.players[player_index].id });


            // The player now owns the new ship, and moves to the coord where it was
            dirty.players[player_index].ship_id = dirty.objects[new_ship_index].id;
            dirty.players[player_index].ship_index = new_ship_index;
            dirty.players[player_index].coord_id = dirty.coords[new_ship_coord_index].id;
            dirty.players[player_index].coord_index = new_ship_coord_index;
            dirty.players[player_index].ship_coord_id = false;
            dirty.players[player_index].ship_coord_index = -1;
            dirty.players[player_index].previous_ship_coord_id = false;
            dirty.players[player_index].has_change = true;
            await sendInfo(socket, "galaxy", dirty, dirty.players[player_index].id);
            await map.updateMap(socket, dirty);
            world.setPlayerMoveDelay(socket, dirty, player_index);
            



        }

        dirty.players[player_index].ship_index = new_ship_index;


        // Finally, we want to switch the airlock and the engines over to the player that now owns the ship ( if it's a different player for this ship )
        if(dirty.objects[new_ship_index].player_id !== dirty.players[player_index].id) {

            // The new ship is now controlled by the player
            dirty.objects[new_ship_index].player_id = dirty.players[player_index].id;
            dirty.objects[new_ship_index].has_change = true;

            await game_object.sendInfo(socket, "galaxy", dirty, new_ship_index);


            for(let i = 0; i < dirty.ship_coords.length; i++) {
                if(dirty.ship_coords[i] && dirty.ship_coords[i].ship_id === dirty.objects[new_ship_index].id) {

                    if(dirty.ship_coords[i].object_type_id === 265 || dirty.ship_coords[i].object_type_id === 266) {
                        let changing_object_index = await game_object.getIndex(dirty, dirty.ship_coords[i].object_id);
                        if(changing_object_index !== -1) {
                            dirty.objects[changing_object_index].player_id = dirty.players[player_index].id;
                            dirty.objects[changing_object_index].has_change = true;
                        }
                    }

                }
            }
        }







    } catch(error) {
        log(chalk.red("Error in player.switchShip: " + error));
        console.error(error);
    }
}

exports.switchShip = switchShip;



async function unequip(socket, dirty, equipment_linker_id) {

    try {

        equipment_linker_id = parseInt(equipment_linker_id);

        console.log("Player is unequipping equipment_linker_id: " + equipment_linker_id);

        let equipment_linker_index = dirty.equipment_linkers.findIndex(function(obj) { return obj && obj.id === equipment_linker_id; });

        if(equipment_linker_index === -1) {
            return false;
        }


        if(dirty.equipment_linkers[equipment_linker_index].object_id) {
            let adding_to_data = { 'adding_to_type': 'player', 'adding_to_id': socket.player_id,
                'object_id': dirty.equipment_linkers[equipment_linker_index].object_id,
                'object_type_id': dirty.equipment_linkers[equipment_linker_index].object_type_id, 'amount':1 };
            await inventory.addToInventory(socket, dirty, adding_to_data);
        } else {
            let adding_to_data = { 'adding_to_type': 'player', 'adding_to_id': socket.player_id,
                'object_type_id': dirty.equipment_linkers[equipment_linker_index].object_type_id, 'amount': dirty.equipment_linkers[equipment_linker_index].amount };
            await inventory.addToInventory(socket, dirty, adding_to_data);
        }

        // emit equipment data
        socket.emit('equipment_linker_info', { 'remove': true, 'equipment_linker': dirty.equipment_linkers[equipment_linker_index] });


        await (pool.query("DELETE FROM equipment_linkers WHERE id = ?", [dirty.equipment_linkers[equipment_linker_index].id]));

        delete dirty.equipment_linkers[equipment_linker_index];


    } catch(error) {
        log(chalk.red("Error in player.unequip: " + error));
        console.error(error);
    }

}
exports.unequip = unequip;

module.exports = {
    calculateAttack,
    calculateDefense,
    calculateMovementModifier,
    canPlace,
    claimShip,
    damage,
    getCoordAndRoom,
    getCoordIndex,
    getEquipment,
    getIndex,
    getInventory,
    getLevel,
    getRelationshipLinkers,
    getResearchLinkers,
    getShips,
    kill,
    sendInfo,
    sendShips,
    setShipIndex,
    switchShip,
    unequip
}