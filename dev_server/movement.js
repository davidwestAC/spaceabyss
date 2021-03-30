// @ts-check
var io_handler = require('./io.js');
var io = io_handler.io;
var database = require('./database.js');
var pool = database.pool;
const chalk = require('chalk');
const log = console.log;

const event = require('./event.js');
const game_object = require('./game_object.js');
const helper = require('./helper.js');
const main = require('./space_abyss' + process.env.FILE_SUFFIX + '.js');
const map = require('./map.js');
const monster = require('./monster.js');
const npc = require('./npc.js');
const planet = require('./planet.js');
const player = require('./player.js');
const world = require('./world.js');


async function adminMoveNpc(socket, dirty, npc_id, planet_coord_id) {
    try {

        log(chalk.red("CODE IT!"));
    } catch(error) {
        log(chalk.red("Error in movement.adminMoveNpc: " + error));
    }
}



function checkCanWalkOn(dirty, coord) {
    let can_walk_on = true;

    // If there's an object type, check that
    if(coord.object_type_id) {
        let object_type_index = main.getObjectTypeIndex(coord.object_type_id);
        if(!dirty.object_types[object_type_index].can_walk_on) {
            can_walk_on = false;
        }
    }

    // And always check the floor
    let floor_type_index = main.getFloorTypeIndex(coord.floor_type_id);
    if(!dirty.floor_types[floor_type_index].can_walk_on) {
        can_walk_on = false;
    }

    return can_walk_on;
}



async function checkDocking(socket, dirty, ship_index, previous_coord_index, coord_index) {
    try {


        // Lets get the single ship coord
        if(typeof dirty.objects[ship_index].current_coords === "undefined" || dirty.objects[ship_index].current_coords.length === 0) {

            let coord_object_index = -1

            if(dirty.coords[coord_index].object_id && dirty.coords[coord_index].object_id !== dirty.objects[ship_index].id) {
                coord_object_index = await game_object.getIndex(dirty, dirty.coords[coord_index].object_id);
            } else if(dirty.coords[coord_index].belongs_to_object_id && dirty.coords[coord_index].belongs_to_object_id !== dirty.objects[ship_index].id) {
                coord_object_index = await game_object.getIndex(dirty, dirty.coords[coord_index].belongs_to_object_id);
            }


            if(coord_object_index !== -1) {

                let coord_object_type_index = main.getObjectTypeIndex(dirty.objects[coord_object_index].object_type_id);


                if(dirty.object_types[coord_object_type_index].is_dockable) {
    
                    let player_ship_type_index = main.getObjectTypeIndex(dirty.objects[ship_index].object_type_id);
    
                    if(dirty.object_types[player_ship_type_index].is_dockable) {
                        return 'failedtodock';
                       
                    } else {
                        dockOnShip(socket, dirty, dirty.objects[coord_object_index].id);
                        return 'docked';
                    }
    
                }
            }


            

        } 
        // DOCKING FOR A LARGE SHIP
        else {

            let x_modification = 0;
            let y_modification = 0;
            // right
            if(dirty.coords[coord_index].tile_x > dirty.coords[previous_coord_index].tile_x) {
                x_modification++;
            } else if(dirty.coords[coord_index].tile_x < dirty.coords[previous_coord_index].tile_x) {
                x_modification--;
            } else if(dirty.coords[coord_index].tile_y > dirty.coords[previous_coord_index].tile_y) {
                y_modification++;
            }else if(dirty.coords[coord_index].tile_y < dirty.coords[previous_coord_index].tile_y) {
                y_modification--;
            } 

            
            //  Go through each of the coords the ship would be on after the move. If one is 
            // dockable, we'll be going there now!
            for(let i = 0; i < dirty.objects[ship_index].current_coords.length; i++) {

                let checking_coord_index = -1;

                if(x_modification > 0) {
                    await map.getCoordNeighbor(dirty, 'galaxy', dirty.objects[ship_index].current_coords[i].coord_index, 'right');
                    checking_coord_index = dirty.coords[dirty.objects[ship_index].current_coords[i].coord_index].right_coord_index;

                } else if(x_modification < 0) {
                    await map.getCoordNeighbor(dirty, 'galaxy', dirty.objects[ship_index].current_coords[i].coord_index, 'left');
                    checking_coord_index = dirty.coords[dirty.objects[ship_index].current_coords[i].coord_index].left_coord_index;
                } else if(y_modification > 0) {
                    await map.getCoordNeighbor(dirty, 'galaxy', dirty.objects[ship_index].current_coords[i].coord_index, 'down');
                    checking_coord_index = dirty.coords[dirty.objects[ship_index].current_coords[i].coord_index].down_coord_index;

                } else if(y_modification < 0) {
                    await map.getCoordNeighbor(dirty, 'galaxy', dirty.objects[ship_index].current_coords[i].coord_index, 'up');
                    checking_coord_index = dirty.coords[dirty.objects[ship_index].current_coords[i].coord_index].up_coord_index;
                }

                if(checking_coord_index !== -1) {
                    let coord_object_index = -1

                    if(dirty.coords[checking_coord_index].object_id && dirty.coords[checking_coord_index].object_id !== dirty.objects[ship_index].id) {
                        coord_object_index = await game_object.getIndex(dirty, dirty.coords[checking_coord_index].object_id);
                    } else if(dirty.coords[checking_coord_index].belongs_to_object_id && dirty.coords[checking_coord_index].belongs_to_object_id !== dirty.objects[ship_index].id) {
                        coord_object_index = await game_object.getIndex(dirty, dirty.coords[checking_coord_index].belongs_to_object_id);
                    }

                    if(coord_object_index !== -1) {
                        let coord_object_type_index = main.getObjectTypeIndex(dirty.objects[coord_object_index].object_type_id);


                        if(dirty.object_types[coord_object_type_index].is_dockable) {
    
                            let player_ship_type_index = main.getObjectTypeIndex(dirty.objects[ship_index].object_type_id);
    
                            if(dirty.object_types[player_ship_type_index].is_dockable) {
                                return 'failedtodock';
                            
                            } else {
                                dockOnShip(socket, dirty, dirty.objects[coord_object_index].id);
                                return 'docked';
                            }
    
                        }
                    }

                   
                }
                
            }
        }


        return 'nodocking';

    } catch(error) {
        log(chalk.red("Error in movement.checkDocking: " + error));
        console.error(error);

    }
}




async function checkObjectMovementRules(socket, dirty, object_id) {
    try {

        let passed_rules = false;
        let object_index = await game_object.getIndex(dirty, object_id);

        let object_player_index = await player.getIndex(dirty, { 'player_id': dirty.objects[object_index].player_id });
        let socket_player_index = await player.getIndex(dirty, { 'player_id': socket.player_id });


        // go through the object's rules, and as long as one matches, we are fine
        let object_rules = dirty.rules.filter(rule => rule.object_id === dirty.objects[object_index].id);
        if(object_rules.length > 0) {
            for(let rule of object_rules) {

                // If we made the door and there's an allow creator rule
                if(rule.rule === "allow_creator" && socket.player_id === dirty.objects[object_index].player_id) {
                    passed_rules = true;
                }

                // If we are of the same faction and there's a faction rule
                if(rule.rule === "allow_faction_players" && dirty.players[object_player_index].faction_id === dirty.players[socket_player_index].faction_id) {
                    passed_rules = true;
                }

                if(rule.rule === "allow_all_players") {
                    passed_rules = true;
                }
            }
        }

        return passed_rules;
    } catch(error) {
        log(chalk.red("Error in movement.checkObjectMovementRules: " + error));
    }

}

async function checkPlanetLanding(socket, dirty, ship_index, previous_coord_index, coord_index) {
    try {

        // Lets get the single ship coord out of the way
        if(typeof dirty.objects[dirty.players[socket.player_index].ship_index].current_coords === "undefined" || dirty.objects[ship_index].current_coords.length === 0) {


            let planet_index = -1;
            let linker_visual_only = false;
            if(dirty.coords[coord_index].planet_id) {
                planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.coords[coord_index].planet_id });
            } else if(dirty.coords[coord_index].belongs_to_planet_id) {
                planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.coords[coord_index].belongs_to_planet_id });

                // make sure it's not just a visual thing
                
                let planet_coord_index = await main.getCoordIndex({ 'coord_id': dirty.planets[planet_index].coord_id });

                let planet_type_index = dirty.planet_types.findIndex(function(obj) { return obj && obj.id === dirty.planets[planet_index].planet_type_id; });

                let x_difference = dirty.coords[coord_index].tile_x - dirty.coords[planet_coord_index].tile_x;
                let y_difference = dirty.coords[coord_index].tile_y - dirty.coords[planet_coord_index].tile_y;

                let display_linker_index = dirty.planet_type_display_linkers.findIndex(function(obj) {
                    return obj && obj.planet_type_id === dirty.planet_types[planet_type_index].id &&
                        obj.position_x === x_difference && obj.position_y === y_difference; });

                if(display_linker_index !== -1 && dirty.planet_type_display_linkers[display_linker_index].only_visual) {
                    linker_visual_only = true;
                    //console.log("Set linker_visual_only to true");
                } 
            }


            if(planet_index !== -1 && !linker_visual_only) {
                let player_ship_type_index = main.getObjectTypeIndex(dirty.objects[ship_index].object_type_id);

                if(dirty.object_types[player_ship_type_index].is_dockable) {
                    return 'failedtoland';
                
                } else {
                    switchToPlanet(socket, dirty, { 'planet_id': dirty.planets[planet_index].id,
                        'previous_coord_index': previous_coord_index });
                    return 'landed';
                }
            }


        } 
        // LARGE SHIP - NEED TO CHECK ALL NEW COORDS
        else {

            let x_modification = 0;
            let y_modification = 0;
            // right
            if(dirty.coords[coord_index].tile_x > dirty.coords[previous_coord_index].tile_x) {
                x_modification++;
            } else if(dirty.coords[coord_index].tile_x < dirty.coords[previous_coord_index].tile_x) {
                x_modification--;
            } else if(dirty.coords[coord_index].tile_y > dirty.coords[previous_coord_index].tile_y) {
                y_modification++;
            }else if(dirty.coords[coord_index].tile_y < dirty.coords[previous_coord_index].tile_y) {
                y_modification--;
            } 

            //  Go through each of the coords the ship would be on after the move. If one is 
            // dockable, we'll be going there now!
            for(let i = 0; i < dirty.objects[ship_index].current_coords.length; i++) {

                let checking_coord_index = -1;

                if(x_modification > 0) {
                    await map.getCoordNeighbor(dirty, 'galaxy', dirty.objects[ship_index].current_coords[i].coord_index, 'right');
                    checking_coord_index = dirty.coords[dirty.objects[ship_index].current_coords[i].coord_index].right_coord_index;

                } else if(x_modification < 0) {
                    await map.getCoordNeighbor(dirty, 'galaxy', dirty.objects[ship_index].current_coords[i].coord_index, 'left');
                    checking_coord_index = dirty.coords[dirty.objects[ship_index].current_coords[i].coord_index].left_coord_index;
                } else if(y_modification > 0) {
                    await map.getCoordNeighbor(dirty, 'galaxy', dirty.objects[ship_index].current_coords[i].coord_index, 'down');
                    checking_coord_index = dirty.coords[dirty.objects[ship_index].current_coords[i].coord_index].down_coord_index;

                } else if(y_modification < 0) {
                    
                    await map.getCoordNeighbor(dirty, 'galaxy', dirty.objects[ship_index].current_coords[i].coord_index, 'up');
                    checking_coord_index = dirty.coords[dirty.objects[ship_index].current_coords[i].coord_index].up_coord_index;
                    //console.log("up movement checking_coord_index: " + checking_coord_index);
                }

                if(checking_coord_index !== -1) {
                    //console.log("Checking coord tile_x,y: " + dirty.coords[checking_coord_index].tile_x + "," + dirty.coords[checking_coord_index].tile_y);
                    let planet_index = -1;
                    let linker_visual_only = false;
                    if(dirty.coords[checking_coord_index].planet_id) {
                        planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.coords[checking_coord_index].planet_id });
                    } else if(dirty.coords[checking_coord_index].belongs_to_planet_id) {
                        //console.log("A coord has a belongs_to_planet_id");
                        planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.coords[checking_coord_index].belongs_to_planet_id });

                        // make sure it's not just a visual thing
                        
                        let planet_coord_index = await main.getCoordIndex({ 'coord_id': dirty.planets[planet_index].coord_id });

                        let planet_type_index = dirty.planet_types.findIndex(function(obj) { return obj && obj.id === dirty.planets[planet_index].planet_type_id; });

                        let x_difference = dirty.coords[checking_coord_index].tile_x - dirty.coords[planet_coord_index].tile_x;
                        let y_difference = dirty.coords[checking_coord_index].tile_y - dirty.coords[planet_coord_index].tile_y;

                        let display_linker_index = dirty.planet_type_display_linkers.findIndex(function(obj) {
                            return obj && obj.planet_type_id === dirty.planet_types[planet_type_index].id &&
                                obj.position_x === x_difference && obj.position_y === y_difference; });

                        if(display_linker_index !== -1) {
                            //console.log(dirty.planet_type_display_linkers[display_linker_index]);
                        } else {
                            log(chalk.yellow("Did not find the display linker index"));
                        }
                        

                        if(display_linker_index !== -1 && dirty.planet_type_display_linkers[display_linker_index].only_visual) {
                            linker_visual_only = true;
                            //console.log("Set linker_visual_only to true");
                        } 
                    }


                    if(planet_index !== -1 && !linker_visual_only) {
                        let player_ship_type_index = main.getObjectTypeIndex(dirty.objects[ship_index].object_type_id);

                        if(dirty.object_types[player_ship_type_index].is_dockable) {
                            return 'failedtoland';
                        
                        } else {
                            console.log("going to switch to planet!");
                            switchToPlanet(socket, dirty, { 'planet_id': dirty.planets[planet_index].id,
                                'previous_coord_index': previous_coord_index });
                            return 'landed';
                        }
                    }
                }
                
            }
        }


        return 'nolanding';
    } catch(error) {
        log(chalk.red("Error in movement.checkPlanetLanding: " + error));
        console.error(error);

    }
}


async function dockOnShip(socket, dirty, object_id) {

    try {

        log(chalk.green("Docking on a dockable ship! (SPACE STATION!?!)"));

        let player_index = await player.getIndex(dirty, { 'player_id': socket.player_id });

        if(player_index === -1) {
            log(chalk.yellow("Could not find player"));
            return false;
        }

        let object_index = await game_object.getIndex(dirty, object_id);
        if(object_index === -1) {
            log(chalk.yellow("Could not find ship (object) we are docking with"));
            return false;
        }

        let ship_coord_index = -1;

        // try and place around the airlock if the ship has one
        if(typeof dirty.objects[object_index].airlock_index !== 'undefined' && dirty.objects[object_index].airlock_index !== -1) {
            console.log("Dockable station has an airlock");

            //console.log("Ship has an airlock: " + dirty.objects[ship_index].airlock_index);

            ship_coord_index = await world.getOpenCoordIndex(dirty, 'ship', dirty.objects[object_index].airlock_index, 'player', player_index, 2);

            console.log("ship_coord_index from getting around airlock is: " + ship_coord_index);

        } 

        if(ship_coord_index === -1) {
            // we need to find a ship coord to place the player on
            ship_coord_index = dirty.ship_coords.findIndex(function(obj) {
                return obj && obj.ship_id === dirty.objects[object_index].id && !obj.object_type_id && !obj.object_id && !obj.player_id && !obj.monster_id; });
        }


        


        if(ship_coord_index === -1) {
            log(chalk.yellow("Could not find ship coord to place player on. Ship id: " + dirty.objects[object_index].id));

            // Count how many coords are in memory
            let ship_coord_count = 0;
            for(let ship_coord of dirty.ship_coords) {
                if(ship_coord.ship_id === dirty.objects[object_index].id) {
                    ship_coord_count++;
                }
            }
            console.log("Have " + ship_coord_count + " coords from this ship in memory");
            return false;
        }

        console.log("going to place player on ship coord id: " + dirty.ship_coords[ship_coord_index].id);


        // get the galaxy coord that the player was on
        let coord_index = await main.getCoordIndex({'coord_id': dirty.players[player_index].coord_id });

        if(coord_index === -1) {
            log(chalk.yellow("Could not find galaxy coord that the player is moving from"));
            return false;
        }

        await main.updateCoordGeneric(socket, { 'coord_index': coord_index, 'player_id': false, 'object_id': false });
        await main.updateCoordGeneric(socket, { 'ship_coord_index': ship_coord_index, 'player_id': dirty.players[socket.player_index].id });


        dirty.players[player_index].previous_coord_id = false;
        dirty.players[player_index].coord_id = false;
        dirty.players[player_index].coord_index = -1;
        dirty.players[player_index].ship_coord_id = dirty.ship_coords[ship_coord_index].id;
        dirty.players[player_index].ship_coord_index = ship_coord_index;
        dirty.players[player_index].has_change = true;
        await player.sendInfo(socket, "ship_" + dirty.ship_coords[ship_coord_index].ship_id, dirty, dirty.players[player_index].id);
        await player.sendInfo(false, "galaxy", dirty, dirty.players[player_index].id);

        socket.leave("galaxy");
        socket.join("ship_" + dirty.ship_coords[ship_coord_index].ship_id);

        socket.emit('view_change_data', { 'view': 'ship'});
        map.updateMap(socket, dirty);

        // give the player's ship that they just used to enter the spaceport an attached to
        let ship_index = await game_object.getIndex(dirty, dirty.players[player_index].ship_id);

        // The ship is now docked at this other ship, make sure the player knows
        if(ship_index !== -1) {
            await game_object.removeFromCoord(dirty, ship_index);
            dirty.objects[ship_index].docked_at_object_id = dirty.ship_coords[ship_coord_index].ship_id;
            
            dirty.objects[ship_index].coord_id = false;
            dirty.objects[ship_index].coord_index = -1;
            dirty.objects[ship_index].current_coords = [];
            dirty.objects[ship_index].has_change = true;
            await game_object.sendInfo(socket, false, dirty, ship_index, 'movement.dockOnShip');
            
        }



    } catch(error) {
        log(chalk.red("Error in game.dockOnShip: " + error));
    }


}

/*
    data:   |   movement_direction   |   destination_coord_type   |   destination_coord_id
*/

/**
 * @param {Object} socket
 * @param {Object} dirty
 * @param {Object} data
 * @param {String} data.movement_direction
 * @param {String=} data.destination_coord_type
 * @param {number=} data.destination_coord_id
 * @param {String=} data.source

*/
async function move(socket, dirty, data) {

    try {


        //console.log("In movement.move");
        //if(data.source) {
        //    console.log("source:" + data.source);
        //    console.trace("here");
        //}

        // TODO don't allow warp hacking. Putting in a destination coord we couldn't really put it

        //let start = new process.hrtime();

        if(typeof socket.player_index === "undefined") {
            return false;
        }

        let player_index = socket.player_index;


        //console.log("In movement.move with socket id: " + socket.id + " player_id: " + dirty.players[socket.player_index].id +
        //    " socket.player_index: " + socket.player_index + " destination coord_id: " + data.destination_coord_id);


        if(data.destination_coord_type && data.destination_coord_type === 'planet' && !dirty.players[player_index].planet_coord_id ||
            data.destination_coord_type === 'ship' && !dirty.players[player_index].ship_coord_id ||
            data.destination_coord_type === 'galaxy' && !dirty.players[player_index].coord_id) {
            log(chalk.yellow("destination coord type mismatch!"));
            return false;
        }


        if(!socket.move_delay) {
            socket.move_delay = 500;
        }

        // The player is trying to move a ship with no engines
        if(socket.move_delay === 1000000) {
            //console.log("Player is trying to move a ship with no engines");

            socket.emit('result_info', { 'status': 'failure', 'text': 'Your ship needs engines!' });
            socket.emit('move_failure', { 'failed_coord_id': data.destination_coord_id,
            'return_to_coord_id': dirty.players[player_index].coord_id });
            return false;
        }

        let movement_delay = socket.move_delay;

        // We have a temporary movement modifier. Maybe a tile we are on is slowing us down (water for most body types)
        // or maybe even an enemy effect (spider web!)

        if(socket.movement_modifier) {

            movement_delay = movement_delay / socket.movement_modifier;
            //console.log("Socket has movement modifier: " + socket.movement_modifier + ". Changed movement delay to: " + movement_delay);
        }


        let time_allowed = true;

        // Not sure why we were doing the line below
        // let current_timestamp = Math.floor(new Date());
        let current_timestamp = Date.now();
        let next_move_available_at = socket.last_move_time + movement_delay;

        if (socket.last_move_time) {

        } else {
            //socket.last_move_time = Math.floor(new Date());
            socket.last_move_time = Date.now();
        }

        if(!time_allowed) {

            console.log("Client can't move yet");

            // If we are within 200 ms of our next move, queue this up at a next move
            /*
            if(socket.last_move_time + movement_delay - 200 < current_timestamp) {
                //console.log("Adding to player's next move queue!");
                let next_move_index = dirty.next_moves.findIndex(function(obj) { return obj && obj.player_id === socket.player_id; });

                let next_move_time = socket.last_move_time + movement_delay;
                let waiting_time = next_move_time - current_timestamp;
                //console.log("Set waiting time to: " + waiting_time);
                if(next_move_index === -1) {
                    dirty.next_moves.push({ 'player_id': socket.player_id, 'movement': data.movement, 'waiting_time': waiting_time });
                }
            }

            */

            return false;
        }

        // Re-calculate the socket's average move time
        if(!socket.move_totals) {
            socket.move_totals = 0;
        }
        let time_since_last_move = current_timestamp - socket.last_move_time;
        //console.log("Time since last move: " + time_since_last_move);
        socket.move_totals += time_since_last_move;
        //console.log("Socket move totals: " + socket.move_totals);
        if(!socket.move_count) {
            socket.move_count = 1;
        } else {
            socket.move_count++;
        }

        //console.log("Socket move count: " + socket.move_count);

        let average_move_delay = socket.move_totals / socket.move_count;
        //console.log("Socket average move delay: " + average_move_delay);
        if(socket.move_count > 10 && average_move_delay < movement_delay) {
            log(chalk.yellow("Client is repeatedly moving too fast! average: " + average_move_delay + " socket move delay: " + movement_delay));
            // send a move denied info to the client

            console.log(data.destination_coord_type);
            if(data.destination_coord_type === 'planet') {
                socket.emit('move_failure', { 'failed_planet_coord_id': data.destination_coord_id,
                    'return_to_planet_coord_id': dirty.players[player_index].planet_coord_id });

            } else if(data.destination_coord_type === 'ship') {
                socket.emit('move_failure', { 'failed_ship_coord_id': data.destination_coord_id,
                    'return_to_ship_coord_id': dirty.players[player_index].ship_coord_id });
            } else if(data.destination_coord_type === 'galaxy') {
                socket.emit('move_failure', { 'failed_coord_id': data.destination_coord_id,
                    'return_to_coord_id': dirty.players[player_index].coord_id });
            }

            return false;

        }


        //console.log("Setting last move time and removing movement modifier");
        //socket.last_move_time = Math.floor(new Date());
        //console.log("Accepted move: " + data.destination_coord_type + " " + data.destination_coord_id);
        socket.last_move_time = Date.now();

        if(typeof socket.movement_modifier === "undefined") {
            socket.movement_modifier = 1.00;    
        }



        // not sure with all the different conditions we should put this here
        //socket.emit('show_move_data', {'direction': data.movement});

        // remove an autopilot if this was a manual move and we are in the galaxy view
        if(data.source && data.source === 'manual' && !dirty.players[player_index].ship_coord_id) {
            let autopilot_index = dirty.autopilots.findIndex(function(obj) { return obj && obj.player_id === dirty.players[player_index].id; });

            if(autopilot_index !== -1) {
                console.log("Manual move removing autopilot");
                dirty.autopilots.splice(autopilot_index, 1);
            }
        }


        // Right now, the only case where we don't have a destination_coord_id is when there was no coord found next to a +1 or above
        // planet coord and the player may be falling.
        if(data.movement_direction && typeof data.destination_coord_id === 'undefined') {
            await movePlanetFall(socket, dirty, {'player_index': player_index, 'movement_direction': data.movement_direction });
        } else if(dirty.players[player_index].virtual_coord_id) {
            await moveVirtual(socket, dirty, data.destination_coord_id, data.movement_direction);
        } else if (dirty.players[player_index].planet_coord_id) {
            await movePlanet(socket, dirty, data.destination_coord_id, data.movement_direction);
        } else if (dirty.players[player_index].ship_coord_id) {
            await moveShip(socket, dirty, data.destination_coord_id, data.movement_direction);
        } else {

            // TODO need to use data.movement direction to get neighbor coord if possible
            let new_coord_index = await main.getCoordIndex({ 'coord_id': data.destination_coord_id });

            await moveGalaxy(socket, dirty, new_coord_index);
        }


    } catch(error) {
        log(chalk.red("Error in movement.move: " + error));
        console.error(error);
    }



}

exports.move = move;

    async function moveEntirePlanet(socket, dirty, planet_id, destination_coord_id) {
        try {
            console.log("In movement.moveEntirePlanet");

            let planet_index = await planet.getIndex(dirty, { 'planet_id': planet_id });

            if(planet_index === -1) {
                console.log("Could not find planet");
                return false;
            }

            let previous_coord_index = await main.getCoordIndex({ 'coord_id': dirty.planets[planet_index].coord_id });

            let new_coord_index = await main.getCoordIndex({ 'coord_id': parseInt(destination_coord_id) });
            //let new_coord_index = await main.getCoordIndex({ 'tile_x': new_tile_x, 'tile_y':new_tile_y });

            if(new_coord_index === -1) {
                log(chalk.yellow("Could not find coord planet is trying to move to"));
                return false;
            }

            let new_tile_x = dirty.coords[new_coord_index].tile_x;
            let new_tile_y = dirty.coords[new_coord_index].tile_y;


            let display_linkers = dirty.planet_type_display_linkers.filter(linker =>
                linker.planet_type_id === dirty.planets[planet_index].planet_type_id);

            // If there are no display linkers, we can do a simple coord switch
            if(display_linkers.length === 0) {
                await main.updateCoordGeneric(socket, { 'coord_index': previous_coord_index, 'planet_id': false });
                await main.updateCoordGeneric(socket, { 'coord_index': new_coord_index, 'planet_id': dirty.planets[planet_index].id });

                dirty.planets[planet_index].coord_id = dirty.coords[new_coord_index].id;
                dirty.players[planet_index].coord_index = new_coord_index;
                dirty.planets[planet_index].has_change = true;

                await planet.sendInfo(socket, "galaxy", dirty, { 'planet_index': planet_index });
                return;
            }


            // Create an index of the coords we are currently at, and if any don't match the new coords, remove data from them
            let current_coords = [];
            for(let linker of display_linkers) {
                let linker_tile_x = dirty.coords[previous_coord_index].tile_x + linker.position_x;
                let linker_tile_y = dirty.coords[previous_coord_index].tile_y + linker.position_y;

                current_coords.push({ 'tile_x': linker_tile_x, 'tile_y': linker_tile_y, 'still_used': false });
            }

            // DOING NOW. JUST DO EACH LINKER!!!
            for(let linker of display_linkers) {

                let linker_tile_x = new_tile_x + linker.position_x;
                let linker_tile_y = new_tile_y + linker.position_y;

                let placing_coord_index = await main.getCoordIndex({ 'tile_x': linker_tile_x, 'tile_y': linker_tile_y });

                // If it's the previous coord we were on, we need the player_id and object_id to be false
                if(linker_tile_x === dirty.coords[previous_coord_index].tile_x &&
                    linker_tile_y === dirty.coords[previous_coord_index].tile_y) {

                    await main.updateCoordGeneric(false, { 'coord_index': placing_coord_index, 'planet_id': false });
                    await main.updateCoordGeneric(false, { 'coord_index': placing_coord_index,
                        'belongs_to_planet_id': dirty.planets[planet_index].id });

                }
                // It's the coord we are moving to
                else if(linker_tile_x === new_tile_x && linker_tile_y === new_tile_y) {

                    if(dirty.coords[placing_coord_index].belongs_to_planet_id) {
                        await main.updateCoordGeneric(false, { 'coord_index': placing_coord_index,
                            'belongs_to_planet_id': false });
                    }

                    await main.updateCoordGeneric(false, { 'coord_index': placing_coord_index,
                        'planet_id': dirty.planets[planet_index].id });
                }

                // Standard belongs to update
                else {
                    await main.updateCoordGeneric(false, { 'coord_index': placing_coord_index,
                        'belongs_to_planet_id': dirty.planets[planet_index].id });
                }

                let current_coord_index = current_coords.findIndex(function(obj) { return obj &&
                    obj.tile_x === linker_tile_x && obj.tile_y === linker_tile_y });
                if(current_coord_index !== -1) {
                    current_coords[current_coord_index].still_used = true;
                }

            }

            // foreach current coords not used, remove it!
            for(let old_coord of current_coords) {
                if(old_coord.still_used === false) {

                    let old_coord_index = await main.getCoordIndex({ 'tile_x': old_coord.tile_x, 'tile_y': old_coord.tile_y });

                    await main.updateCoordGeneric(false, { 'coord_index': old_coord_index,
                        'planet_id': false, 'belongs_to_planet_id': false });

                }
            }



            // send the updated planet info
            dirty.planets[planet_index].coord_id = dirty.coords[new_coord_index].id;
            dirty.planets[planet_index].coord_index = new_coord_index;
            dirty.planets[planet_index].has_change = true;
            await planet.sendInfo(socket, "galaxy", dirty, { 'planet_index': planet_index });

        } catch(error) {
            log(chalk.red("Error in movement.moveEntirePlanet: " + error));
        }
    }

    exports.moveEntirePlanet = moveEntirePlanet;


    async function moveGalaxy(socket, dirty, coord_index) {
        try {
            //console.time("moveGalaxy");

            if(typeof socket.player_index === 'undefined') {
                log(chalk.yellow("Can't move in galaxy. No socket.player_index yet"));
                return false;
            }

            if(typeof dirty.players[socket.player_index].ship_index === "undefined" || dirty.players[socket.player_index].ship_index === -1 ) {
                log(chalk.yellow("Player doesn't seem to have a ship index set"));
                await player.setShipIndex(socket, dirty);
            }

            // Going to use this in the function to reduce the complexity of reading the code below
            let ship_index = dirty.players[socket.player_index].ship_index;

            let player_ship_type_index = main.getObjectTypeIndex(dirty.objects[ship_index].object_type_id);

            if(player_ship_type_index === -1) {
                log(chalk.yellow("Could not find the type of ship the player has"));
                return false;
            }

            // get the coord the player is currently on
            let previous_coord_index = -1;
            if(typeof dirty.players[socket.player_index].coord_index !== "undefined" && dirty.players[socket.player_index].coord_index !== -1) {
                previous_coord_index = dirty.players[socket.player_index].coord_index;
                //console.log("Set previous_coord_index to: " + previous_coord_index);
            } else {
                //log(chalk.yellow("Player did not have a coord_index - having to grab the coord index"));
                previous_coord_index = await main.getCoordIndex({'coord_id': dirty.players[socket.player_index].coord_id});
                dirty.players[socket.player_index].coord_index = previous_coord_index;
            }
            

            if(previous_coord_index === -1) {
                log(chalk.yellow("Unable to find coord player was previously on in movement.moveGalaxy"));
                return false;
            }

            // Make sure the coords are close enough
            if( Math.abs(dirty.coords[previous_coord_index].tile_x - dirty.coords[coord_index].tile_x) > 1 ||
                Math.abs(dirty.coords[previous_coord_index].tile_y - dirty.coords[coord_index].tile_y) > 1) {
                log(chalk.yellow("Move is too far away. In moveGalaxy"));
                console.log("Player id: " + dirty.players[socket.player_index].id + " tried to move from x,y: " +
                    dirty.coords[previous_coord_index].tile_x + "," + dirty.coords[previous_coord_index].tile_y + " to x,y: "
                    + dirty.coords[coord_index].tile_x + "," + dirty.coords[coord_index].tile_y);
                return false;
            }

            // get the display linkers, if there are any, and determine the movement tile width/height
            let ship_display_linkers = dirty.object_type_display_linkers.filter(linker =>
                linker.object_type_id === dirty.object_types[player_ship_type_index].id);

            // For ships larger than a single tile, we need to make sure we have all the current coords for the ship
            if(ship_display_linkers.length > 0 && (typeof dirty.objects[ship_index].current_coords === "undefined" || ship_display_linkers.length !== dirty.objects[ship_index].current_coords.length) ) {
                //console.log("Ship needs current coords updated");
                await game_object.getShipCurrentCoords(socket, dirty, ship_display_linkers);
                //console.log(dirty.objects[ship_index].current_coords);
                
            }

            /******* DOCKING ***************/
            let docked_result = await checkDocking(socket, dirty, ship_index, previous_coord_index, coord_index);


            if(docked_result === 'docked') {
                return true;
            } else if(docked_result === 'failedtodock') {
                socket.emit('chat', { 'message': "You cannot dock on another ship with a dockable ship", 'scope': 'system' });
                socket.emit('move_failure', { 'failed_coord_id': dirty.coords[coord_index].id,
                    'return_to_coord_id': dirty.coords[previous_coord_index].id });
                socket.emit('result_info', { 'status': 'failure', 'text': "Dockable ships can't dock" });
                return false;
            }

            /******* LANDING ON PLANET ***************/
            let landed_result = await checkPlanetLanding(socket, dirty, ship_index, previous_coord_index, coord_index);

            //console.log("Landed Result: " + landed_result);

            if(landed_result === 'landed') {
                return true;
            } else if(landed_result === 'failedtoland') {
                socket.emit('chat', { 'message': "You cannot land on a planet with a large, dockable ship", 'scope': 'system' });
                    socket.emit('move_failure', { 'failed_coord_id': dirty.coords[coord_index].id,
                        'return_to_coord_id': dirty.coords[previous_coord_index].id });
                    socket.emit('result_info', { 'status': 'failure', 'text': "Dockable ships can't land" });
            }

            // TODO I would eventually like to get to the point of using our neighbor system with this
            let can_place = await player.canPlace(dirty, 'galaxy', dirty.coords[coord_index], socket.player_index, false);

            if(!can_place) {

                console.log("Can't do the move in moveGalaxy");
                return false;
            }

            let paid_for_move = await payForGalaxyMove(socket, dirty, ship_index);

            if(paid_for_move === false) {
                console.log("Engine has no energy");
                socket.emit('chat', { 'message': "Your engines need more fuel. Refuel, or jump out the airlock and come back with fuel", 'scope': 'system' });
                socket.emit('result_info', { 'status': 'failure', 'text': "No fuel" });
                socket.emit('move_failure', { 'failed_coord_id': dirty.coords[coord_index].id,
                    'return_to_coord_id': dirty.coords[previous_coord_index].id });
                return false;
            }

            /***** MOVE IS VALID - GRABBING AND SENDING NEW COORDS BEFORE THE MOVE *******/
            let starting_y = -1;
            let ending_y = -1;
            let starting_x = -1;
            let ending_x = -1;

            // We only need to send new planet coords to the client
            if(dirty.coords[coord_index].tile_y < dirty.coords[previous_coord_index].tile_y) {

                starting_y = dirty.coords[coord_index].tile_y - Math.floor(global.show_rows / 2);
                ending_y = starting_y;
                starting_x = dirty.coords[coord_index].tile_x - Math.floor(global.show_cols / 2);
                ending_x = dirty.coords[coord_index].tile_x + Math.floor(global.show_cols / 2);

            } else if(dirty.coords[coord_index].tile_y > dirty.coords[previous_coord_index].tile_y) {
                starting_y = dirty.coords[coord_index].tile_y + Math.floor(global.show_rows / 2);
                ending_y = starting_y;
                starting_x = dirty.coords[coord_index].tile_x - Math.floor(global.show_cols / 2);
                ending_x = dirty.coords[coord_index].tile_x + Math.floor(global.show_cols / 2);
            } else if(dirty.coords[coord_index].tile_x < dirty.coords[previous_coord_index].tile_x) {
                starting_x = dirty.coords[coord_index].tile_x - Math.floor(global.show_cols / 2);
                ending_x = starting_x;
                starting_y = dirty.coords[coord_index].tile_y - Math.floor(global.show_rows / 2);
                ending_y = dirty.coords[coord_index].tile_y + Math.floor(global.show_rows / 2);
            } if(dirty.coords[coord_index].tile_x > dirty.coords[previous_coord_index].tile_x) {
                starting_x = dirty.coords[coord_index].tile_x + Math.floor(global.show_cols / 2);
                ending_x = starting_x;
                starting_y = dirty.coords[coord_index].tile_y - Math.floor(global.show_rows / 2);
                ending_y = dirty.coords[coord_index].tile_y + Math.floor(global.show_rows / 2);
            }

            //console.log("Movement has us sending new coords from x: " + starting_x + " - " + ending_x + " y: " + starting_y + " - " + ending_y);

            for(let i = starting_x; i <= ending_x; i++) {
                for(let j = starting_y; j <= ending_y; j++) {

                    // coords don't exist < 0
                    if(i >= 0 && j >= 0) {
                        //console.log("Sending planet coord x,y: " + i + "," + j + " due to move");
                        let galaxy_coord_data = {  'tile_x': i, 'tile_y': j };
                        let galaxy_coord_index = await main.getCoordIndex(galaxy_coord_data);

                        if(galaxy_coord_index !== -1) {

                            // Send the socket the planet too
                            if(dirty.coords[galaxy_coord_index].planet_id && dirty.coords[galaxy_coord_index].planet_id !== 0) {
                                await planet.sendInfo(socket, false, dirty,
                                    { 'planet_id': dirty.coords[galaxy_coord_index].planet_id, 'source': 'movement.moveGalaxy' });
                            }

                            socket.emit('coord_info', { 'coord': dirty.coords[galaxy_coord_index] });

                            if(dirty.coords[galaxy_coord_index].monster_id) {
                                await monster.sendInfo(socket, "", dirty, { 'monster_id': dirty.coords[galaxy_coord_index].monster_id });
                                // Not sure we currently have a scenario that would use this
                                //await world.checkMonsterBattleConditions(dirty, dirty.planet_coords[sending_coord_index].monster_id, 'player', socket.player_id, socket);
                            }


                        }
                    }

                }
            }



            // Just a small ship. EASY MOVE!
            if(ship_display_linkers.length === 0) {
                await main.updateCoordGeneric(socket, { 'coord_index': previous_coord_index, 'player_id': false,
                    'object_id': false });
                await main.updateCoordGeneric(socket, { 'coord_index': coord_index,
                    'player_id': dirty.players[socket.player_index].id, 'object_id': dirty.players[socket.player_index].ship_id });

                dirty.players[socket.player_index].coord_id = dirty.coords[coord_index].id;
                dirty.players[socket.player_index].coord_index = coord_index;
                dirty.players[socket.player_index].has_change = true;
                await player.sendInfo(socket, "galaxy", dirty, dirty.players[socket.player_index].id);

                dirty.objects[ship_index].coord_id = dirty.coords[coord_index].id;
                dirty.objects[ship_index].coord_index = coord_index;
                dirty.objects[ship_index].has_change = true;
                await game_object.sendInfo(socket, "galaxy", dirty, ship_index, 'movement.moveGalaxy');

                await player.calculateMovementModifier(socket, dirty, 'galaxy', coord_index);
                //console.timeEnd("moveGalaxy");
                return;
            }

            /************** MOVING A LARGER SHIP ***************/

            let current_coords = [];

            for(let linker of ship_display_linkers) {
                let linker_tile_x = dirty.coords[previous_coord_index].tile_x + linker.position_x;
                let linker_tile_y = dirty.coords[previous_coord_index].tile_y + linker.position_y;

                current_coords.push({ 'tile_x': linker_tile_x, 'tile_y': linker_tile_y, 'still_used': false });
            }


            for(let linker of ship_display_linkers) {
                let linker_tile_x = dirty.coords[coord_index].tile_x + linker.position_x;
                let linker_tile_y = dirty.coords[coord_index].tile_y + linker.position_y;

                let placing_coord_index = await main.getCoordIndex({ 'tile_x': linker_tile_x, 'tile_y': linker_tile_y });

                // If it's the previous coord we were on, we need the player_id and object_id to be false
                // and switch it to a belongs_to_object_id
                if(linker_tile_x === dirty.coords[previous_coord_index].tile_x &&
                    linker_tile_y === dirty.coords[previous_coord_index].tile_y) {

                    await main.updateCoordGeneric(false, { 'coord_index': placing_coord_index, 'player_id': false, 'object_id': false });
                    await main.updateCoordGeneric(false, { 'coord_index': placing_coord_index,
                        'belongs_to_object_id': dirty.players[socket.player_index].ship_id });

                }
                // It's the coord we are moving to
                else if(linker_tile_x === dirty.coords[coord_index].tile_x && linker_tile_y === dirty.coords[coord_index].tile_y) {

                    if(dirty.coords[placing_coord_index].belongs_to_object_id) {
                        await main.updateCoordGeneric(false, { 'coord_index': placing_coord_index,
                            'belongs_to_object_id': false });
                    }

                    await main.updateCoordGeneric(false, { 'coord_index': placing_coord_index,
                        'player_id': dirty.players[socket.player_index].id, 'object_id': dirty.players[socket.player_index].ship_id });
                }

                // Standard belongs to update
                else {
                    await main.updateCoordGeneric(false, { 'coord_index': placing_coord_index,
                        'belongs_to_object_id': dirty.players[socket.player_index].ship_id });
                }

                let current_coord_index = current_coords.findIndex(function(obj) { return obj &&
                    obj.tile_x === linker_tile_x && obj.tile_y === linker_tile_y });
                if(current_coord_index !== -1) {
                    current_coords[current_coord_index].still_used = true;
                }
            }


            // foreach current coords not used, remove it!
            for(let old_coord of current_coords) {
                if(old_coord.still_used === false) {

                    let old_coord_index = await main.getCoordIndex({ 'tile_x': old_coord.tile_x, 'tile_y': old_coord.tile_y });

                    await main.updateCoordGeneric(false, { 'coord_index': old_coord_index,
                        'player_id': false, 'object_id': false, 'belongs_to_object_id': false });

                }
            }

            dirty.players[socket.player_index].coord_id = dirty.coords[coord_index].id;
            dirty.players[socket.player_index].coord_index = coord_index;
            dirty.players[socket.player_index].has_change = true;

            await player.sendInfo(socket, "galaxy", dirty, dirty.players[socket.player_index].id);

            dirty.objects[ship_index].coord_id = dirty.coords[coord_index].id;
            dirty.objects[ship_index].coord_index = coord_index;
            dirty.objects[ship_index].has_change = true;
            await game_object.sendInfo(socket, "galaxy", dirty, ship_index, 'movement.moveGalaxy');

            //await map.updateMap(socket, dirty);


            // If our ship type is a dockable ship type
            if(dirty.object_types[player_ship_type_index].is_dockable) {
                log(chalk.cyan("Dockable ship moved. I think we need to code in changing the coord_id for any ship docked here"));

                // Here I was thinking I might need to move the coord_id of the ships that are docked, but anymore I think we have all that
                // reset. I don't BELIEVE I need to do anything with the idea below.
                // Don't like filters anymore
                //let docked_ships = dirty.objects.filter(object => object.docked_at_object_id === dirty.objects[ship_index].id);

            }


            await player.calculateMovementModifier(socket, dirty, 'galaxy', coord_index);
            await game_object.getShipCurrentCoords(socket, dirty, ship_display_linkers);

            //console.timeEnd("moveGalaxy");

        } catch(error) {
            log(chalk.red("Error in movement.moveGalaxy: " + error));
            console.error(error);
        }


    }

    exports.moveGalaxy = moveGalaxy;


    // OLDDDDDDD????????????? I BET WE DON'T USE THIS 1/18/2021
    async function moveGalaxyOld(socket, dirty, coord_index) {
        try {

            console.time("moveGalaxyOld");

            //console.log("in moveGalaxy for player id:" + dirty.players[socket.player_index].id + " socket.player_index: " +
            //    socket.player_index + " socket id: " + socket.id + " destination_coord_id: " + dirty.coords[coord_index].id);

            if(typeof socket.player_index === 'undefined') {
                log(chalk.yellow("Can't move in galaxy. No socket.player_index yet"));
                return false;
            }


            let player_ship_index = await game_object.getIndex(dirty, dirty.players[socket.player_index].ship_id);

            if(player_ship_index === -1) {
                log(chalk.yellow("Could not get the player's ship"));
                return false;
            }

            let player_ship_type_index = main.getObjectTypeIndex(dirty.objects[player_ship_index].object_type_id);

            if(player_ship_type_index === -1) {
                log(chalk.yellow("Could not find the type of ship the player has"));
                return false;
            }


            // get the coord the player is currently on
            let previous_coord_index = await main.getCoordIndex({'coord_id': dirty.players[socket.player_index].coord_id});

            if(previous_coord_index === -1) {
                log(chalk.yellow("Unable to find coord player was previously on in movement.moveGalaxy"));
                return false;
            }

            // Make sure the coords are close enough
            if( Math.abs(dirty.coords[previous_coord_index].tile_x - dirty.coords[coord_index].tile_x) > 1 ||
                Math.abs(dirty.coords[previous_coord_index].tile_y - dirty.coords[coord_index].tile_y) > 1) {
                log(chalk.yellow("Move is too far away. In moveGalaxy"));
                console.log("Player id: " + dirty.players[socket.player_index].id + " tried to move from x,y: " +
                    dirty.coords[previous_coord_index].tile_x + "," + dirty.coords[previous_coord_index].tile_y + " to x,y: "
                    + dirty.coords[coord_index].tile_x + "," + dirty.coords[coord_index].tile_y);
                return false;
            }

            // get the display linkers, if there are any, and determine the movement tile width/height
            console.time("getDisplayLinkers");
            let ship_display_linkers = dirty.object_type_display_linkers.filter(linker =>
                linker.object_type_id === dirty.object_types[player_ship_type_index].id);
            console.timeEnd("getDisplayLinkers");


            // MAKE SURE SHIP KNOWS WHERE IT IS (ALL COORDS)


            // DOCKABLE STATION CHECK FOR ANY COORDS IT IS MOVING TO

            // LANDING ON PLANET CHECK FOR ANY COORDS IT IS MOVING TO

            let current_coords = [];
            for(let linker of ship_display_linkers) {
                let linker_tile_x = dirty.coords[previous_coord_index].tile_x + linker.position_x;
                let linker_tile_y = dirty.coords[previous_coord_index].tile_y + linker.position_y;

                current_coords.push({ 'tile_x': linker_tile_x, 'tile_y': linker_tile_y, 'still_used': false });
            }


            /************** STEP 1. GET ALL THE INFO ABOUT THE DESTINATION COORD ******************/
            // Notes: Can place grabs the ship linkers

            let object_index = -1;
            let object_type_index = -1;
            let planet_index = -1;
            let planet_type_index = -1;
            let planet_visual_only = false;

             // If there's an object - lets get some info about it
             if(dirty.coords[coord_index].object_id && dirty.coords[coord_index].object_id !== dirty.objects[player_ship_index].id) {
                object_index = await game_object.getIndex(dirty, dirty.coords[coord_index].object_id);

                // The object that was there no longer exists
                if(object_index === -1) {
                    log(chalk.yellow("Galaxy coord had an deleted object id on it: " + dirty.coords[coord_index].object_id));
                    dirty.coords[coord_index].object_id = false;
                    dirty.coords[coord_index].object_type_id = false;
                    dirty.coords[coord_index].has_change = true;
                    return false;
                }

                object_type_index = main.getObjectTypeIndex(dirty.objects[object_index].object_type_id);
            } else if(dirty.coords[coord_index].belongs_to_object_id && dirty.coords[coord_index].belongs_to_object_id !== dirty.objects[player_ship_index].id) {
                object_index = await game_object.getIndex(dirty, dirty.coords[coord_index].belongs_to_object_id);

                // The object that was there no longer exists
                if(object_index === -1) {
                    log(chalk.yellow("Galaxy coord had an deleted belongs to object id on it: " + dirty.coords[coord_index].belongs_to_object_id));
                    dirty.coords[coord_index].belongs_to_object_id = false;
                    dirty.coords[coord_index].object_type_id = false;
                    dirty.coords[coord_index].has_change = true;
                    return false;
                }

                object_type_index = main.getObjectTypeIndex(dirty.objects[object_index].object_type_id);
            }

            if(dirty.coords[coord_index].planet_id) {
                planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.coords[coord_index].planet_id });
            } else if(dirty.coords[coord_index].belongs_to_planet_id) {
                planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.coords[coord_index].belongs_to_planet_id });

                // make sure it's not just a visual thing
                
                let planet_coord_index = await main.getCoordIndex({ 'coord_id': dirty.planets[planet_index].coord_id });

                planet_type_index = dirty.planet_types.findIndex(function(obj) { return obj && obj.id === dirty.planets[planet_index].planet_type_id; });

                let x_difference = dirty.coords[coord_index].tile_x - dirty.coords[planet_coord_index].tile_x;
                let y_difference = dirty.coords[coord_index].tile_y - dirty.coords[planet_coord_index].tile_y;

                let display_linker_index = dirty.planet_type_display_linkers.findIndex(function(obj) {
                    return obj && obj.planet_type_id === dirty.planet_types[planet_type_index].id &&
                        obj.position_x === x_difference && obj.position_y === y_difference; });

                if(display_linker_index !== -1 && dirty.planet_type_display_linkers[display_linker_index].only_visual) {
                    planet_visual_only = true;
                    console.log("Set planet visual only to true");
                } 
            }


            // With a big ship, lets also check an additional coord in the direction of movement. No 3x3 ships should be able to land on planets
            if(current_coords.length !== 0 && object_index === -1) {

                console.log("Move with a big ship!, and origin coord didn't have an object");

                let additional_coord = {};

                // move to the right
                if(dirty.coords[coord_index].tile_x > dirty.coords[previous_coord_index].tile_x) {
                    await map.getCoordNeighbor(dirty, 'galaxy', coord_index, 'right');

                    if(dirty.coords[coord_index].right_coord_index !== -1) {
                        additional_coord = dirty.coords[dirty.coords[coord_index].right_coord_index];
                    }
                } else if(dirty.coords[coord_index].tile_y > dirty.coords[previous_coord_index].tile_y) {
                    await map.getCoordNeighbor(dirty, 'galaxy', coord_index, 'down');

                    if(dirty.coords[coord_index].down_coord_index !== -1) {
                        additional_coord = dirty.coords[dirty.coords[coord_index].down_coord_index];
                    }
                }

                // If there's an object - lets get some info about it
                if(additional_coord.object_id) {
                    console.log("Additional coord had an object_id");
                    object_index = await game_object.getIndex(dirty, additional_coord.object_id);
    
                    object_type_index = main.getObjectTypeIndex(dirty.objects[object_index].object_type_id);
                } else if(additional_coord.belongs_to_object_id) {
                    console.log("Additional coord had a belongs_to_object_id");
                    object_index = await game_object.getIndex(dirty, additional_coord.belongs_to_object_id);
                    object_type_index = main.getObjectTypeIndex(dirty.objects[object_index].object_type_id);
                }

                if(additional_coord.planet_id) {
                    console.log("Additional coord has planet id");
                    planet_index = await planet.getIndex(dirty, { 'planet_id': additional_coord.planet_id });
                } else if(additional_coord.belongs_to_planet_id) {
                    console.log("Additional coord has belongs to planet id");
                    planet_index = await planet.getIndex(dirty, { 'planet_id': additional_coord.belongs_to_planet_id });

                    let planet_coord_index = await main.getCoordIndex({ 'coord_id': dirty.planets[planet_index].coord_id });

                    planet_type_index = dirty.planet_types.findIndex(function(obj) { return obj && obj.id === dirty.planets[planet_index].planet_type_id; });
    
                    let x_difference = additional_coord.tile_x - dirty.coords[planet_coord_index].tile_x;
                    let y_difference = additional_coord.tile_y - dirty.coords[planet_coord_index].tile_y;
    
                    let display_linker_index = dirty.planet_type_display_linkers.findIndex(function(obj) {
                        return obj && obj.planet_type_id === dirty.planet_types[planet_type_index].id &&
                            obj.position_x === x_difference && obj.position_y === y_difference; });
    
                    if(display_linker_index && dirty.planet_type_display_linkers[display_linker_index].only_visual) {
                        console.log("Set planet visual only to true");
                        planet_visual_only = true;
                    } else if(display_linker_index !== -1 && planet_visual_only === true && !dirty.planet_type_display_linkers[display_linker_index].only_visual) {
                        console.log("Additional coord overrode planet_visual_only - set it back to false");
                        planet_visual_only = false;
                    }
                }
            }
           



            /******************* STEP 2. SEE IF WE CAN PLACE ******************/

            // If there's an object there, see if it's a dockable ship, and try to dock if we aren't, ourselves, in
            // something like a space station
            if(object_index !== -1 && object_index !== player_ship_index && dirty.object_types[object_type_index].is_dockable) {
                console.log("Destination coords have object");

                if(dirty.object_types[player_ship_type_index].is_dockable) {
                    socket.emit('chat', { 'message': "You cannot dock on another ship with a dockable ship", 'scope': 'system' });
                    socket.emit('move_failure', { 'failed_coord_id': dirty.coords[coord_index].id,
                        'return_to_coord_id': dirty.coords[previous_coord_index].id });
                    socket.emit('result_info', { 'status': 'failure', 'text': "Dockable ships can't dock" });
                } else {
                    dockOnShip(socket, dirty, dirty.objects[object_index].id);
                }

                return;

            }
            // The potential to land on the planet - if we aren't piloting a dockable ship ourselves
            else if( planet_index !== -1 && !planet_visual_only && dirty.planets[planet_index].planet_type_id !== 26) {
                console.log("THere's a planet we can dock at");

                if(dirty.object_types[player_ship_type_index].is_dockable) {
                    socket.emit('chat', { 'message': "You cannot land on a planet with a large, dockable ship", 'scope': 'system' });
                    socket.emit('move_failure', { 'failed_coord_id': dirty.coords[coord_index].id,
                        'return_to_coord_id': dirty.coords[previous_coord_index].id });
                    socket.emit('result_info', { 'status': 'failure', 'text': "Dockable ships can't land" });
                    return;
                } 
                
                await switchToPlanet(socket, dirty, { 'planet_id': dirty.planets[planet_index].id,
                        'previous_coord_index': previous_coord_index });
                return;

            }


            // THIS CHECKS ALL THE COORDS


            let can_place = await player.canPlace(dirty, 'galaxy', dirty.coords[coord_index], socket.player_index, true);
            //let can_place = await main.canPlace('galaxy', dirty.coords[coord_index], 'player', dirty.players[player_index].id);

            if(!can_place) {

                console.log("Can't do the move in moveGalaxy");
                return false;
            }

            // Make sure the engines have energy
            // Remove energy from the engines
            let paid_for_move = false;

            if(dirty.objects[player_ship_index].engine_indexes) {
                for(let i = 0; i < dirty.objects[player_ship_index].engine_indexes.length; i++) {
                    if(!paid_for_move && dirty.objects[dirty.objects[player_ship_index].engine_indexes[i]].energy >= 1) {
                        dirty.objects[dirty.objects[player_ship_index].engine_indexes[i]].energy--;
                        dirty.objects[dirty.objects[player_ship_index].engine_indexes[i]].has_change = true;
                        dirty.objects[player_ship_index].current_engine_energy--;
                        game_object.sendInfo(socket, false, dirty, dirty.objects[player_ship_index].engine_indexes[i]);
    
                        if(dirty.objects[dirty.objects[player_ship_index].engine_indexes[i]].object_type_id === 265 && dirty.objects[dirty.objects[player_ship_index].engine_indexes[i]].energy === 200) {
                            socket.emit('result_info', {'status': 'failure', 'text': 'Engine Low On Fuel' });
                        }
    
                        if(dirty.objects[dirty.objects[player_ship_index].engine_indexes[i]].object_type_id === 265 && dirty.objects[dirty.objects[player_ship_index].engine_indexes[i]].energy === 100) {
                            socket.emit('result_info', {'status': 'failure', 'text': 'Dock At Planet Soon!' });
                        }
    
                        if(dirty.objects[dirty.objects[player_ship_index].engine_indexes[i]].object_type_id === 265 && dirty.objects[dirty.objects[player_ship_index].engine_indexes[i]].energy === 50) {
                            socket.emit('result_info', {'status': 'failure', 'text': 'Engine Critically Low On Fuel' });
                        }
    
                        paid_for_move = true;
                    }
    
                }
            }
            

            // Some ships don't need engines
            if(!dirty.object_types[player_ship_type_index].needs_engines || dirty.objects[player_ship_index].id < 81089) {
                paid_for_move = true;
            }


            if(paid_for_move === false) {
                console.log("Engine has no energy");
                socket.emit('chat', { 'message': "Your engines need more fuel. Refuel, or jump out the airlock and come back with fuel", 'scope': 'system' });
                socket.emit('result_info', { 'status': 'failure', 'text': "No fuel" });
                socket.emit('move_failure', { 'failed_coord_id': dirty.coords[coord_index].id,
                    'return_to_coord_id': dirty.coords[previous_coord_index].id });
                return false;
            }

            // We can do the move. Send out new coords!
            // get are going to grab the new coords that we need BEFORE we send that they player has moved
            let starting_y = -1;
            let ending_y = -1;
            let starting_x = -1;
            let ending_x = -1;

            // We only need to send new planet coords to the client
            if(dirty.coords[coord_index].tile_y < dirty.coords[previous_coord_index].tile_y) {

                starting_y = dirty.coords[coord_index].tile_y - Math.floor(global.show_rows / 2);
                ending_y = starting_y;
                starting_x = dirty.coords[coord_index].tile_x - Math.floor(global.show_cols / 2);
                ending_x = dirty.coords[coord_index].tile_x + Math.floor(global.show_cols / 2);

            } else if(dirty.coords[coord_index].tile_y > dirty.coords[previous_coord_index].tile_y) {
                starting_y = dirty.coords[coord_index].tile_y + Math.floor(global.show_rows / 2);
                ending_y = starting_y;
                starting_x = dirty.coords[coord_index].tile_x - Math.floor(global.show_cols / 2);
                ending_x = dirty.coords[coord_index].tile_x + Math.floor(global.show_cols / 2);
            } else if(dirty.coords[coord_index].tile_x < dirty.coords[previous_coord_index].tile_x) {
                starting_x = dirty.coords[coord_index].tile_x - Math.floor(global.show_cols / 2);
                ending_x = starting_x;
                starting_y = dirty.coords[coord_index].tile_y - Math.floor(global.show_rows / 2);
                ending_y = dirty.coords[coord_index].tile_y + Math.floor(global.show_rows / 2);
            } if(dirty.coords[coord_index].tile_x > dirty.coords[previous_coord_index].tile_x) {
                starting_x = dirty.coords[coord_index].tile_x + Math.floor(global.show_cols / 2);
                ending_x = starting_x;
                starting_y = dirty.coords[coord_index].tile_y - Math.floor(global.show_rows / 2);
                ending_y = dirty.coords[coord_index].tile_y + Math.floor(global.show_rows / 2);
            }

            //console.log("Movement has us sending new coords from x: " + starting_x + " - " + ending_x + " y: " + starting_y + " - " + ending_y);

            for(let i = starting_x; i <= ending_x; i++) {
                for(let j = starting_y; j <= ending_y; j++) {

                    // coords don't exist < 0
                    if(i >= 0 && j >= 0) {
                        //console.log("Sending planet coord x,y: " + i + "," + j + " due to move");
                        let galaxy_coord_data = {  'tile_x': i, 'tile_y': j };
                        let galaxy_coord_index = await main.getCoordIndex(galaxy_coord_data);

                        if(galaxy_coord_index !== -1) {

                            // Send the socket the planet too
                            if(dirty.coords[galaxy_coord_index].planet_id && dirty.coords[galaxy_coord_index].planet_id !== 0) {
                                await planet.sendInfo(socket, false, dirty,
                                    { 'planet_id': dirty.coords[galaxy_coord_index].planet_id, 'source': 'movement.moveGalaxy' });
                            }

                            socket.emit('coord_info', { 'coord': dirty.coords[galaxy_coord_index] });


                        }
                    }

                }
            }



            // Just a small ship. EASY MOVE!
            if(ship_display_linkers.length === 0) {
                await main.updateCoordGeneric(socket, { 'coord_index': previous_coord_index, 'player_id': false,
                    'object_id': false });
                await main.updateCoordGeneric(socket, { 'coord_index': coord_index,
                    'player_id': dirty.players[socket.player_index].id, 'object_id': dirty.players[socket.player_index].ship_id });

                dirty.players[socket.player_index].coord_id = dirty.coords[coord_index].id;
                dirty.players[socket.player_index].coord_index = coord_index;
                dirty.players[socket.player_index].has_change = true;
                await player.sendInfo(socket, "galaxy", dirty, dirty.players[socket.player_index].id);

                dirty.objects[player_ship_index].coord_id = dirty.coords[coord_index].id;
                dirty.objects[player_ship_index].coord_index = coord_index;
                dirty.objects[player_ship_index].has_change = true;
                await game_object.sendInfo(socket, "galaxy", dirty, player_ship_index, 'movement.moveGalaxy');

                await player.calculateMovementModifier(socket, dirty, 'galaxy', coord_index);
                console.timeEnd("moveGalaxyOld");
                return;
            }


            for(let linker of ship_display_linkers) {
                let linker_tile_x = dirty.coords[coord_index].tile_x + linker.position_x;
                let linker_tile_y = dirty.coords[coord_index].tile_y + linker.position_y;

                let placing_coord_index = await main.getCoordIndex({ 'tile_x': linker_tile_x, 'tile_y': linker_tile_y });

                // If it's the previous coord we were on, we need the player_id and object_id to be false
                // and switch it to a belongs_to_object_id
                if(linker_tile_x === dirty.coords[previous_coord_index].tile_x &&
                    linker_tile_y === dirty.coords[previous_coord_index].tile_y) {

                    await main.updateCoordGeneric(false, { 'coord_index': placing_coord_index, 'player_id': false, 'object_id': false });
                    await main.updateCoordGeneric(false, { 'coord_index': placing_coord_index,
                        'belongs_to_object_id': dirty.players[socket.player_index].ship_id });

                }
                // It's the coord we are moving to
                else if(linker_tile_x === dirty.coords[coord_index].tile_x && linker_tile_y === dirty.coords[coord_index].tile_y) {

                    if(dirty.coords[placing_coord_index].belongs_to_object_id) {
                        await main.updateCoordGeneric(false, { 'coord_index': placing_coord_index,
                            'belongs_to_object_id': false });
                    }

                    await main.updateCoordGeneric(false, { 'coord_index': placing_coord_index,
                        'player_id': dirty.players[socket.player_index].id, 'object_id': dirty.players[socket.player_index].ship_id });
                }

                // Standard belongs to update
                else {
                    await main.updateCoordGeneric(false, { 'coord_index': placing_coord_index,
                        'belongs_to_object_id': dirty.players[socket.player_index].ship_id });
                }

                let current_coord_index = current_coords.findIndex(function(obj) { return obj &&
                    obj.tile_x === linker_tile_x && obj.tile_y === linker_tile_y });
                if(current_coord_index !== -1) {
                    current_coords[current_coord_index].still_used = true;
                }
            }


            // foreach current coords not used, remove it!
            for(let old_coord of current_coords) {
                if(old_coord.still_used === false) {

                    let old_coord_index = await main.getCoordIndex({ 'tile_x': old_coord.tile_x, 'tile_y': old_coord.tile_y });

                    await main.updateCoordGeneric(false, { 'coord_index': old_coord_index,
                        'player_id': false, 'object_id': false, 'belongs_to_object_id': false });

                }
            }

            dirty.players[socket.player_index].coord_id = dirty.coords[coord_index].id;
            dirty.players[socket.player_index].coor_index = coord_index;
            dirty.players[socket.player_index].has_change = true;

            await player.sendInfo(socket, "galaxy", dirty, dirty.players[socket.player_index].id);

            dirty.objects[player_ship_index].coord_id = dirty.coords[coord_index].id;
            dirty.objects[player_ship_index].coord_index = coord_index;
            dirty.objects[player_ship_index].has_change = true;
            await game_object.sendInfo(socket, "galaxy", dirty, player_ship_index, 'movement.moveGalaxy');

            //await map.updateMap(socket, dirty);


            // If our ship type is a dockable ship type
            if(dirty.object_types[player_ship_type_index].is_dockable) {
                log(chalk.cyan("Dockable ship moved. I think we need to code in changing the coord_id for any ship docked here"));

                // Don't like filters anymore
                let docked_ships = dirty.objects.filter(object => object.docked_at_object_id === dirty.objects[player_ship_index].id);

            }


            await player.calculateMovementModifier(socket, dirty, 'galaxy', coord_index);



            /******************************************* TEMP THING THAT SHOULD LET US KNOW IF WE AREN'T CLEARING COORDS RIGHT ***************/
            // Player and multiple coords
            //main.clearPlayerExtraCoords(player_index);

            // If the player is moving a larger ship
            //main.clearObjectExtraCoords(player_ship_index);

            /******************************************* END TEMP THING ************************************************************/

            console.timeEnd("moveGalaxyOld");

        } catch(error) {
            log(chalk.red("Error in movement.moveGalaxy: " + error));
            console.error(error);
        }


    }

    exports.moveGalaxyOld = moveGalaxyOld;

    async function moveGalaxyObject(dirty, object_index, previous_coord_index, coord_index) {
        try {



            // Don't want to move onto an object, dockable ship or something..... yet!
            if(dirty.coords[coord_index].object_id || dirty.coords[coord_index].object_type_id) {
                return false;
            }



            let can_place = await game_object.canPlace(dirty, 'galaxy', dirty.coords[coord_index], { 'object_index': object_index });

            if(!can_place) {
                return false;
            }


            await main.updateCoordGeneric(false, { 'coord_index': previous_coord_index, 'object_id': false });
            await main.updateCoordGeneric(false, { 'coord_index': coord_index,
                'object_id': dirty.objects[object_index].id });



            dirty.objects[object_index].coord_id = dirty.coords[coord_index].id;
            dirty.objects[object_index].coord_index = coord_index;
            dirty.objects[object_index].has_change = true;

            await game_object.sendInfo(false, "galaxy", dirty, object_index);


        } catch(error) {
            log(chalk.red("Error in movement.moveGalaxyObject: " + error));
            console.error(error);
        }
    }

    exports.moveGalaxyObject = moveGalaxyObject;


    async function moveGalaxyObjects(dirty) {

        try {

            let spawns_in_galaxy_object_type_ids = [];
            for(let i = 0; i < dirty.object_types.length; i++) {
                if(dirty.object_types[i] && dirty.object_types[i].spawns_in_galaxy) {
                    spawns_in_galaxy_object_type_ids.push(dirty.object_types[i].id);
                }
            }


            let galaxy_object_count = 0;
            for(let i = 0; i < dirty.objects.length; i++) {
                if(dirty.objects[i] && spawns_in_galaxy_object_type_ids.indexOf(dirty.objects[i].object_type_id) !== -1) {

                    let rand_move = Math.random(1,10);

                    if(rand_move === 6) {
                        //let hrstart = new process.hrtime();
                        let coord_index = await main.getCoordIndex({ 'coord_id': dirty.objects[i].coord_id });

                        if(coord_index === -1) {
                            log(chalk.yellow("Could not find the coord that object id: " + dirty.objects[i].id + " is on"));
    
                        } else {
    
                            // Lets move this guy!
                            let move_direction = Math.random();
                            let up_or_down = Math.random();
                            let random_x_change = 0;
                            let random_y_change = 0;
    
                            if (move_direction > .50) {
                                move_direction = 'x';
    
                                if (up_or_down > .50) {
                                    random_x_change = 1;
                                } else {
                                    random_x_change = -1;
                                }
    
                            } else {
                                move_direction = 'y';
    
                                if (up_or_down > .50) {
                                    random_y_change = 1;
                                } else {
                                    random_y_change = -1;
                                }
                            }
    
                            let new_object_x = dirty.coords[coord_index].tile_x + random_x_change;
                            let new_object_y = dirty.coords[coord_index].tile_y + random_y_change;
    
                            if(new_object_x < 0 || new_object_x > 100 || new_object_y < 0 || new_object_y > 100) {
                                // Not moving off the galaxy
                            } else {
    
                                // lets get the new potential planet coord and see if they can move there
                                let new_coord_data = {
                                    'tile_x': new_object_x,
                                    'tile_y': new_object_y
                                };
                                let new_coord_index = await main.getCoordIndex(new_coord_data);
    
                                if(new_coord_index !== -1) {
                                    await moveGalaxyObject(dirty, i, coord_index, new_coord_index);
                                }
                            }
    
    
                        }

                        //let hrend = process.hrtime(hrstart);
                        //console.info('time to move ONE galaxy object (hr): %ds %dms', hrend[0], hrend[1] / 1000000);
                    }

                

                }
            }

        } catch(error) {
            log(chalk.red("Error in movement.moveGalaxyObjects: " + error));
            console.error(error);
        }
    }

    exports.moveGalaxyObjects = moveGalaxyObjects;

    async function moveGalaxyNpc(dirty, npc_index, task_index, coord_index) {
        try {

            let previous_coord_index = await main.getCoordIndex({'coord_id': dirty.npcs[npc_index].coord_id});

            // Don't want to move onto an object, dockable ship or something..... yet!
            if(dirty.coords[coord_index].object_id || dirty.coords[coord_index].object_type_id) {
                return false;
            }

            // Kinda just ignoring only visual stuff for now
            if( (dirty.coords[coord_index].planet_id && dirty.npc_tasks[task_index].destination_planet_id &&
                dirty.coords[coord_index].planet_id === dirty.npc_tasks[task_index].destination_planet_id)
                || (dirty.coords[coord_index].belongs_to_planet_id && dirty.npc_tasks[task_index].destination_planet_id &&
                dirty.coords[coord_index].belongs_to_planet_id === dirty.npc_tasks[task_index].destination_planet_id)

            ) {
                console.log("NPC Found the planet they were going to!");
                // SWITCH TO PLANET
                let landing_result = await switchToPlanetNpc(dirty, npc_index, dirty.npc_tasks[task_index].destination_planet_id);
                if(landing_result) {
                    console.log("And successfully landed there! TASK COMPLETED!");
                    dirty.npc_tasks.splice(task_index, 1);
                } else {
                    console.log("Failed to land on planet");
                }
                return;
            }

            let can_place = await npc.canPlace(dirty, 'galaxy', dirty.coords[coord_index], 'npc', dirty.npcs[npc_index].id);

            if(!can_place) {
                console.log("Can't do the move - moveGalaxyNpc");
                return false;
            }

            // Some npcs will have a ship, others won't
            if(dirty.npcs[npc_index].ship_id) {
                console.log("Did a move where the npc has a ship");
                await main.updateCoordGeneric(false, { 'coord_index': previous_coord_index, 'npc_id': false, 'object_id': false });
                await main.updateCoordGeneric(false, { 'coord_index': coord_index,
                    'npc_id': dirty.npcs[npc_index].id, 'object_id': dirty.npcs[npc_index].ship_id });
            } else {
                await main.updateCoordGeneric(false, { 'coord_index': previous_coord_index, 'npc_id': false });
                await main.updateCoordGeneric(false, { 'coord_index': coord_index,
                    'npc_id': dirty.npcs[npc_index].id });
            }


            dirty.npcs[npc_index].coord_id = dirty.coords[coord_index].id;
            dirty.npcs[npc_index].coord_index = coord_index;
            dirty.npcs[npc_index].has_change = true;

            await world.sendNpcInfo(false, "galaxy", dirty, dirty.npcs[npc_index].id);


        } catch(error) {
            log(chalk.red("Error in movement.moveGalaxyNpc: " + error));
            console.error(error);
        }
    }

    exports.moveGalaxyNpc = moveGalaxyNpc;


    async function movePlanet(socket, dirty, destination_coord_id, movement_direction) {

        try {

            //console.time("movePlanet");
            if(typeof socket.player_index === 'undefined') {
                log(chalk.yellow("Can't move - socket doesn't have a player yet"));
                return false;
            }


            let previous_planet_coord_index = await main.getPlanetCoordIndex({'planet_coord_id': dirty.players[socket.player_index].planet_coord_id});

            if(previous_planet_coord_index === -1) {
                log(chalk.yellow("Unable to find previous planet coord for player in movement.movePlanet"));
                return;
            }


            let planet_coord_index = -1;

            //console.time("neighbor");
            if(movement_direction === 'left') {
                await map.getCoordNeighbor(dirty, 'planet', previous_planet_coord_index, 'left');
                planet_coord_index = dirty.planet_coords[previous_planet_coord_index].left_coord_index;
            } else if(movement_direction === 'right') {
                await map.getCoordNeighbor(dirty, 'planet', previous_planet_coord_index, 'right');
                planet_coord_index = dirty.planet_coords[previous_planet_coord_index].right_coord_index;
            } else if(movement_direction === 'up') {
                await map.getCoordNeighbor(dirty, 'planet', previous_planet_coord_index, 'up');
                planet_coord_index = dirty.planet_coords[previous_planet_coord_index].up_coord_index;
            } else if(movement_direction === 'down') {
                await map.getCoordNeighbor(dirty, 'planet', previous_planet_coord_index, 'down');
                planet_coord_index = dirty.planet_coords[previous_planet_coord_index].down_coord_index;
            } 
            //console.timeEnd("neighbor");

            if(planet_coord_index === -1 && destination_coord_id) {
                log(chalk.red("Neighbor returned nothing, but movement had a destination sent in!"));
                planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': destination_coord_id });
            }


            if(planet_coord_index === -1) {
                log(chalk.yellow("Could not find the planet coord player is trying to move to"));
                return false;
            }

            // Check for a mismatch (temp debugging) {
            if(dirty.planet_coords[planet_coord_index].id !== destination_coord_id) {
                log(chalk.red("Neighbor coord and destination coord are not the same!!!"));
                return false;
            }
            

            // TODO this allows for diagonal movement hacking. Check for total change. x total change, y total change. Total can't be more than 1
            // Make sure the coords are close enough
            if( Math.abs(dirty.planet_coords[previous_planet_coord_index].tile_x - dirty.planet_coords[planet_coord_index].tile_x) > 1 ||
                Math.abs(dirty.planet_coords[previous_planet_coord_index].tile_y - dirty.planet_coords[planet_coord_index].tile_y) > 1) {
                log(chalk.yellow("Move is too far away. In movePlanet"));
                return false;
            }



            let can_move_to = await player.canPlace(dirty, 'planet', dirty.planet_coords[planet_coord_index], socket.player_index);
            //let can_move_to = await main.canPlace('planet', dirty.planet_coords[planet_coord_index], 'player', dirty.players[player_index].id);

            if(!can_move_to) {
                console.log("Can't move there");
                return false;
            }

            let object_type_index = -1;
            if(dirty.planet_coords[planet_coord_index].object_type_id) {
                //console.log("Got object type id");
                object_type_index = main.getObjectTypeIndex(dirty.planet_coords[planet_coord_index].object_type_id);
            }


            // PORTALS!!!!
            if (dirty.planet_coords[planet_coord_index].object_type_id && dirty.object_types[object_type_index].is_portal) {

                //console.log("Object type is portal");

                let portal_id = 0;
                if(dirty.planet_coords[planet_coord_index].object_id) {
                    portal_id = dirty.planet_coords[planet_coord_index].object_id;
                } else if(dirty.planet_coords[planet_coord_index].belongs_to_object_id) {
                    portal_id = dirty.planet_coords[planet_coord_index].belongs_to_object_id;
                }

                await moveThroughPortal(socket, dirty, portal_id);

            }
            // HOLES
            else if (dirty.planet_coords[planet_coord_index].object_type_id && dirty.object_types[object_type_index].is_hole) {
                //console.log("Player is trying to go down a hole");

                let new_planet_level = dirty.planet_coords[previous_planet_coord_index].level - 1;
                let stairs_index = await main.getPlanetCoordIndex({'planet_id': dirty.planet_coords[planet_coord_index].planet_id,
                    'planet_level': new_planet_level, 'tile_x': dirty.planet_coords[planet_coord_index].tile_x, 'tile_y': dirty.planet_coords[planet_coord_index].tile_y});

                if(stairs_index !== -1) {
                    //console.log("Found stairs");

                    let moving_to_coord_index = -1;

                    // In most cases, we can just put them on the stairs


                    let can_place_result = await player.canPlace(dirty, 'planet', dirty.planet_coords[stairs_index], socket.player_index);

                    if(can_place_result) {
                        moving_to_coord_index = stairs_index;
                    }

                    // If the hole coord is blocked, we try the coords around it
                    if(moving_to_coord_index === -1) {
                        for(let x = dirty.planet_coords[stairs_index].tile_x - 1; x <= dirty.planet_coords[stairs_index].tile_x + 1 && moving_to_coord_index === -1; x++) {
                            for(let y = dirty.planet_coords[stairs_index].tile_y -1; y <= dirty.planet_coords[stairs_index].tile_y + 1 && moving_to_coord_index === -1; y++) {

                                let trying_index = await main.getPlanetCoordIndex({'planet_id': dirty.planet_coords[planet_coord_index].planet_id,
                                    'planet_level': new_planet_level, 'tile_x': x, 'tile_y': y });

                                if(trying_index !== -1) {

                                    can_place_result = await player.canPlace(dirty, 'planet', dirty.planet_coords[trying_index], socket.player_index);

                                    if(can_place_result) {
                                        moving_to_coord_index = trying_index;
                                    }
                                }




                            }
                        }
                    }

                    if(moving_to_coord_index !== -1) {
                        world.removeBattleLinkers(dirty, { 'player_id': dirty.players[socket.player_index].id });

                        // we basically skip moving onto the actual hole, and move directly to the stairs
                        await main.updateCoordGeneric(socket, {'planet_coord_index': previous_planet_coord_index, 'player_id': false });

                        // SKIP THE HOLE!!!!
                        //await main.updateCoordGeneric(socket, {'planet_coord_index': hole_index, 'player_id': false });

                        await main.updateCoordGeneric(socket, {'planet_coord_index': moving_to_coord_index, 'player_id': socket.player_id });

                        dirty.players[socket.player_index].planet_coord_id = dirty.planet_coords[moving_to_coord_index].id;
                        dirty.players[socket.player_index].planet_coord_index = moving_to_coord_index;
                        dirty.players[socket.player_index].has_change = true;
                        // send the updated player info
                        await player.sendInfo(socket, "planet_" + dirty.planet_coords[moving_to_coord_index].planet_id, dirty,
                            dirty.players[socket.player_index].id);

                        socket.emit('clear_map');

                        await map.updateMap(socket, dirty);
                        
                    } else {
                        console.log("Something is blocking the stairs and the area around the stairs");
                        socket.emit('move_failure', { 'failed_planet_coord_id': dirty.planet_coords[moving_to_coord_index].id,
                            'return_to_planet_coord_id': dirty.players[socket.player_index].planet_coord_id });
                        socket.emit('result_info', { 'status': 'failure', 'text': 'Something is blocking the stairs below' });
                    }
                } else {
                    console.log("Unable to find hole above stairs");
                }

            }
            // STAIRS
            else if (dirty.planet_coords[planet_coord_index].object_type_id && dirty.object_types[object_type_index].is_stairs) {


                // get the coord we would actually be moving to ( think warp to the planet coord above )
                let new_planet_level = dirty.planet_coords[previous_planet_coord_index].level + 1;
                let hole_index = await main.getPlanetCoordIndex({'planet_id': dirty.planet_coords[planet_coord_index].planet_id,
                    'planet_level': new_planet_level, 'tile_x': dirty.planet_coords[planet_coord_index].tile_x, 'tile_y': dirty.planet_coords[planet_coord_index].tile_y });

                if(hole_index !== -1) {

                    let moving_to_coord_index = -1;

                    // In most cases, we can just put them on the hole

                    let can_place_result = await player.canPlace(dirty, 'planet', dirty.planet_coords[hole_index], socket.player_index);

                    if(can_place_result) {
                        moving_to_coord_index = hole_index;
                    }

                    // If the hole coord is blocked, we try the coords around it
                    if(moving_to_coord_index === -1) {
                        for(let x = dirty.planet_coords[hole_index].tile_x - 1; x <= dirty.planet_coords[hole_index].tile_x + 1 && moving_to_coord_index === -1; x++) {
                            for(let y = dirty.planet_coords[hole_index].tile_y -1; y <= dirty.planet_coords[hole_index].tile_y + 1 && moving_to_coord_index === -1; y++) {

                                let trying_index = await main.getPlanetCoordIndex({'planet_id': dirty.planet_coords[planet_coord_index].planet_id,
                                    'planet_level': new_planet_level, 'tile_x': x, 'tile_y': y });

                                if(trying_index !== -1) {

                                    can_place_result = await player.canPlace(dirty, 'planet', dirty.planet_coords[trying_index], socket.player_index);

                                    if(can_place_result) {
                                        moving_to_coord_index = trying_index;
                                    }
                                }




                            }
                        }
                    }



                    if(moving_to_coord_index !== -1) {

                        world.removeBattleLinkers(dirty, { 'player_id': dirty.players[socket.player_index].id});

                        // MOVE DIRECTLY ONTO THE HOLE
                        await main.updateCoordGeneric(socket, { 'planet_coord_index': previous_planet_coord_index, 'player_id': false });

                        //await main.updateCoordGeneric(socket, {'planet_coord_index': stairs_index, 'player_id': false });

                        await main.updateCoordGeneric(socket, {'planet_coord_index': moving_to_coord_index, 'player_id': socket.player_id });

                        dirty.players[socket.player_index].planet_coord_id = dirty.planet_coords[moving_to_coord_index].id;
                        dirty.players[socket.player_index].planet_coord_index = moving_to_coord_index;
                        dirty.players[socket.player_index].has_change = true;
                        await player.sendInfo(socket, "planet_" + dirty.planet_coords[moving_to_coord_index].planet_id, dirty, dirty.players[socket.player_index].id);

                        socket.emit('clear_map');
                        
                        await map.updateMap(socket, dirty);

                    } else {
                        console.log("Something is blocking the hole, AND the space around it!");
                        socket.emit('move_failure', { 'failed_planet_coord_id': dirty.planet_coords[moving_to_coord_index].id,
                            'return_to_planet_coord_id': dirty.players[socket.player_index].planet_coord_id });
                        socket.emit('result_info', { 'status': 'failure', 'text': 'Something is blocking the hole above' });

                    }
                } else {
                    console.log("Unable to find hole above stairs");
                }





            }
            // Basic Move
            else {
                //console.log("In basic move");
                //console.time("otherCoords");

                let passed_rules = true;


                if(object_type_index !== -1 &&  dirty.object_types[object_type_index].can_have_rules && dirty.planet_coords[planet_coord_index].object_id) {
                    passed_rules = await checkObjectMovementRules(socket, dirty, dirty.planet_coords[planet_coord_index].object_id);
                }

                if(!passed_rules) {
                    socket.emit('move_failure', { 'failed_planet_coord_id': dirty.planet_coords[planet_coord_index].id,
                        'return_to_planet_coord_id': dirty.planet_coords[previous_planet_coord_index].id });
                    socket.emit('result_info', { 'status': 'failure', 'text': 'Not allowed due to rules',
                        'object_id': dirty.planet_coords[planet_coord_index].object_id });
                    return false;
                }

                // get are going to grab the new coords that we need BEFORE we send that they player has moved
                let starting_y = -1;
                let ending_y = -1;
                let starting_x = -1;
                let ending_x = -1;

                // We only need to send new planet coords to the client
                if(dirty.planet_coords[previous_planet_coord_index].tile_y > dirty.planet_coords[planet_coord_index].tile_y) {
                //if (movement_direction === "up") {

                    starting_y = dirty.planet_coords[planet_coord_index].tile_y - Math.floor(global.show_rows / 2);
                    ending_y = starting_y;
                    starting_x = dirty.planet_coords[planet_coord_index].tile_x - Math.floor(global.show_cols / 2);
                    ending_x = dirty.planet_coords[planet_coord_index].tile_x + Math.floor(global.show_cols / 2);

                }
                else if(dirty.planet_coords[previous_planet_coord_index].tile_y < dirty.planet_coords[planet_coord_index].tile_y) {
                //else if(movement_direction === "down") {
                    starting_y = dirty.planet_coords[planet_coord_index].tile_y + Math.floor(global.show_rows / 2);
                    ending_y = starting_y;
                    starting_x = dirty.planet_coords[planet_coord_index].tile_x - Math.floor(global.show_cols / 2);
                    ending_x = dirty.planet_coords[planet_coord_index].tile_x + Math.floor(global.show_cols / 2);
                }
                else if(dirty.planet_coords[previous_planet_coord_index].tile_x > dirty.planet_coords[planet_coord_index].tile_x) {
                //else if(movement_direction === "left") {
                    starting_x = dirty.planet_coords[planet_coord_index].tile_x - Math.floor(global.show_cols / 2);
                    ending_x = starting_x;
                    starting_y = dirty.planet_coords[planet_coord_index].tile_y - Math.floor(global.show_rows / 2);
                    ending_y = dirty.planet_coords[planet_coord_index].tile_y + Math.floor(global.show_rows / 2);
                }
                else if(dirty.planet_coords[previous_planet_coord_index].tile_x < dirty.planet_coords[planet_coord_index].tile_x) {
                //else if(movement_direction === "right") {
                    starting_x = dirty.planet_coords[planet_coord_index].tile_x + Math.floor(global.show_cols / 2);
                    ending_x = starting_x;
                    starting_y = dirty.planet_coords[planet_coord_index].tile_y - Math.floor(global.show_rows / 2);
                    ending_y = dirty.planet_coords[planet_coord_index].tile_y + Math.floor(global.show_rows / 2);
                }

                //console.log("Movement has us sending new coords from x: " + starting_x + " - " + ending_x + " y: " + starting_y + " - " + ending_y);


                let planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.planet_coords[planet_coord_index].planet_id });


                await main.updateCoordGeneric(socket, {'planet_coord_index': previous_planet_coord_index, 'player_id': false });
                await main.updateCoordGeneric(socket, {'planet_coord_index': planet_coord_index, 'player_id': dirty.players[socket.player_index].id });

                // send the updated player info
                dirty.players[socket.player_index].planet_coord_id = dirty.planet_coords[planet_coord_index].id;
                dirty.players[socket.player_index].planet_coord_index = planet_coord_index;
                dirty.players[socket.player_index].has_change = true;
                await player.sendInfo(socket, "planet_" + dirty.planet_coords[planet_coord_index].planet_id, dirty, dirty.players[socket.player_index].id);


                // player moved onto a spaceport tile - remove any battle linkers with them. SAFE.
                if(dirty.planet_coords[planet_coord_index].floor_type_id === 11 || dirty.planet_coords[planet_coord_index].floor_type_id === 44) {
                    //console.log("Player moved onto spaceport. Removing battle linkers");
                    await world.removeBattleLinkers(dirty, { 'player_id': socket.player_id });
                } else {

                    // we need to see if this planet has an AI on it, and if so - if the player violated those rules with
                    // the move
                    let planet_index = await planet.getIndex(dirty, {'planet_id':dirty.planet_coords[planet_coord_index].planet_id, 'source': 'movement.movePlanet' });
                    if(planet_index !== -1 && dirty.planets[planet_index].player_id) {

                        // see if that player has built an AI
                        let ai_index = dirty.objects.findIndex(function(obj) {
                            return obj && obj.player_id === dirty.planets[planet_index].player_id && obj.object_type_id === 72; });
                        if(ai_index !== -1) {
                            //console.log("There is an AI on this planet. AI id: " + dirty.objects[ai_index].id);


                            dirty.rules.forEach(function(rule) {
                                if(rule.object_id === dirty.objects[ai_index].id) {
                                    //console.log("Checking rule: " + rule.rule);

                                    if(rule.rule === 'attack_all_players') {
                                        console.log("Player moved on a planet with attack_all_players as a rule");
                                        let ai_attack_data = {
                                            'ai_id': dirty.objects[ai_index].id, 'attacking_type': 'player',
                                            'attacking_id': socket.player_id };
                                        world.aiAttack(dirty, ai_attack_data);
                                    }
                                }
                            });

                        }

                    }


                }


                for(let i = starting_x; i <= ending_x; i++) {
                    for(let j = starting_y; j <= ending_y; j++) {

                        let try_to_find_coord = true;

                        // No coords less than 0,0
                        if(i < 0 || j < 0) {
                            try_to_find_coord = false;

                        } 

                        // No coords at x_size_above or y_size_above either (since we start at 0,0)
                        if(dirty.planet_coords[planet_coord_index].level >= 0 && 
                            ( i >= dirty.planets[planet_index].x_size_above || j >= dirty.planets[planet_index].y_size_above) ) {
                                try_to_find_coord = false;
                        } 
                        
                        if(dirty.planet_coords[planet_coord_index].level < 0) {

                            let underground_x_offset = 0;
                            let underground_y_offset = 0;
                            if (dirty.planets[planet_index].x_size_above > dirty.planets[planet_index].x_size_under) {
                                underground_x_offset = (dirty.planets[planet_index].x_size_above - dirty.planets[planet_index].y_size_under) / 2;
            
                            }
            
                            if (dirty.planets[planet_index].y_size_above > dirty.planets[planet_index].y_size_under) {
                                underground_y_offset = (dirty.planets[planet_index].y_size_above - dirty.planets[planet_index].y_size_under) / 2;
                            }

                            if(i < underground_x_offset || j < underground_y_offset || i >= underground_x_offset + dirty.planets[planet_index].x_size_under || 
                                j >= underground_y_offset + dirty.planets[planet_index].y_size_under ) {
                                try_to_find_coord = false;

                            }
                        


                        }
                        



                        if(try_to_find_coord) {
                            //console.log("Sending planet coord x,y: " + i + "," + j + " due to move");
                            let planet_coord_data = { 'planet_id': dirty.planet_coords[planet_coord_index].planet_id,
                                'planet_level': dirty.planet_coords[planet_coord_index].level, 'tile_x': i, 'tile_y': j };
                            let other_planet_coord_index = await main.getPlanetCoordIndex(planet_coord_data);

                            if(other_planet_coord_index !== -1) {

                                socket.emit('planet_coord_info', { 'planet_coord': dirty.planet_coords[other_planet_coord_index] });


                                if(dirty.planet_coords[other_planet_coord_index].monster_id) {
                                    await monster.sendInfo(socket, false, dirty, { 'monster_id': dirty.planet_coords[other_planet_coord_index].monster_id });
                                    await world.checkMonsterBattleConditions(dirty, dirty.planet_coords[other_planet_coord_index].monster_id, 'player', socket.player_id, socket);
                                }

                                if(dirty.planet_coords[other_planet_coord_index].object_id) {
                                    await world.checkObjectBattleConditions(socket, dirty, dirty.planet_coords[other_planet_coord_index].object_id, 'player', socket.player_id);
                                }

                                
                                if(dirty.planet_coords[other_planet_coord_index].player_id) {
                                    await player.sendInfo(socket, false, dirty, dirty.planet_coords[other_planet_coord_index].player_id);
                                }

                            }
                        }

                    }
                }

                //console.timeEnd("otherCoords");

                await player.calculateMovementModifier(socket, dirty, 'planet', planet_coord_index);

                //await map.updateMap(socket, dirty);


            }

            //console.timeEnd("movePlanet");

        } catch(error) {
            log(chalk.red("Error in movement.movePlanet: " + error));
            console.error(error);
        }
    }

    exports.movePlanet = movePlanet;


    // data:    player_index    |   movement_direction
    async function movePlanetFall(socket, dirty, data) {

        try {

            let previous_planet_coord_index = await main.getPlanetCoordIndex({'planet_coord_id': dirty.players[data.player_index].planet_coord_id});

            if(previous_planet_coord_index === -1) {
                log(chalk.yellow("Unable to find previous planet coord for player in movement.movePlanet"));
                return;
            }

            if(dirty.planet_coords[previous_planet_coord_index].level <= 0) {
                log(chalk.yellow("Can't fall on levels 0 or under"));
                return false;
            }

            let checking_x = dirty.planet_coords[previous_planet_coord_index].tile_x;
            let checking_y = dirty.planet_coords[previous_planet_coord_index].tile_y;

            if(data.movement_direction === 'up') {
                checking_y--;
            } else if(data.movement_direction === 'down') {
                checking_y++;
            } else if(data.movement_direction === 'left') {
                checking_x--;
            } else if(data.movement_direction === 'right') {
                checking_x++;
            }

            for(let l = dirty.planet_coords[previous_planet_coord_index].level -1; l >= 0; l--) {
                console.log("Seeing if there's a coord on level: " + l);

                let falling_planet_coord_data = { 'planet_id': dirty.planet_coords[previous_planet_coord_index].planet_id,
                    'planet_level': l,
                    'tile_x': checking_x, 'tile_y': checking_y };
                let falling_planet_coord_index = await main.getPlanetCoordIndex(falling_planet_coord_data);


                if(falling_planet_coord_index !== -1) {
                    // lets see if we can place the player there
                    world.removeBattleLinkers(dirty, { 'player_id': dirty.players[data.player_index].id });

                    let can_place_result = await player.canPlace(dirty, 'planet', dirty.planet_coords[falling_planet_coord_index], data.player_index);

                    if(can_place_result === true) {
                        console.log("Found a coord below, and the player can fall onto it");
                        await main.updateCoordGeneric(socket, {'planet_coord_index': previous_planet_coord_index, 'player_id': false });

                        await main.updateCoordGeneric(socket, {'planet_coord_index': falling_planet_coord_index, 'player_id': socket.player_id });

                        dirty.players[data.player_index].planet_coord_id = dirty.planet_coords[falling_planet_coord_index].id;
                        dirty.players[data.player_index].planet_coord_index = falling_planet_coord_index;
                        dirty.players[data.player_index].has_change = true;
                        // send the updated player info
                        await player.sendInfo(socket, "planet_" + dirty.planet_coords[falling_planet_coord_index].planet_id,
                            dirty, dirty.players[data.player_index].id);

                        socket.emit('clear_map');

                        await map.updateMap(socket, dirty);
                        
                        return;
                    }
                }
            }
        } catch(error) {
            log(chalk.red("Error in movement.movePlanetFall: " + error));
            console.error(error);
        }
    }

    async function movePlanetNpc(dirty, npc_index, task_index, coord_index) {

        try {

            //console.log("in movePlanetNpc");

            let previous_coord_index = await main.getPlanetCoordIndex({'planet_coord_id': dirty.npcs[npc_index].planet_coord_id});

            if(previous_coord_index === -1) {
                log(chalk.yellow("Unable to find previous planet coord for npc in movement.movePlanetNpc"));
                return;
            }


            let can_place = await npc.canPlace(dirty, 'planet', dirty.planet_coords[coord_index], 'npc', dirty.npcs[npc_index].id);

            if(!can_place) {
                //console.log("Can't do the move - movePlanetNpc");
                return false;
            }

            await main.updateCoordGeneric(false, { 'planet_coord_index': previous_coord_index, 'npc_id': false });
            await main.updateCoordGeneric(false, { 'planet_coord_index': coord_index,
                'npc_id': dirty.npcs[npc_index].id });

            dirty.npcs[npc_index].planet_coord_id = dirty.planet_coords[coord_index].id;
            dirty.npcs[npc_index].planet_coord_index = coord_index;
            dirty.npcs[npc_index].has_change = true;

            await world.sendNpcInfo(false, "planet_" + dirty.planet_coords[coord_index].planet_id, dirty, dirty.npcs[npc_index].id);


            /*
            let new_tile_x = dirty.planet_coords[previous_planet_coord_index].tile_x;
            let new_tile_y = dirty.planet_coords[previous_planet_coord_index].tile_y;


            if (movement_direction === "up") {
                new_tile_y--;
            } else if (movement_direction === "down") {
                new_tile_y++;
            } else if (movement_direction === "left") {
                new_tile_x--;
            } else if (movement_direction === "right") {
                new_tile_x++
            }

            let planet_coord_data = { 'planet_id': dirty.planet_coords[previous_planet_coord_index].planet_id,
                'planet_level': dirty.planet_coords[previous_planet_coord_index].level,
                'tile_x': new_tile_x, 'tile_y': new_tile_y };
            let planet_coord_index = await main.getPlanetCoordIndex(planet_coord_data);

            if(planet_coord_index === -1) {
                log(chalk.yellow("Could not find the planet coord player is trying to move to"));

                // The player FALLLLLLLSSS!!!!!
                if(dirty.planet_coords[previous_planet_coord_index].level > 0) {
                    console.log("Attempting to get the player to fall from level: " + dirty.planet_coords[previous_planet_coord_index].level);

                    for(let l = dirty.planet_coords[previous_planet_coord_index].level -1; l >= 0; l--) {
                        console.log("Seeing if there's a coord on level: " + l);

                        let falling_planet_coord_data = { 'planet_id': dirty.planet_coords[previous_planet_coord_index].planet_id,
                            'planet_level': l,
                            'tile_x': new_tile_x, 'tile_y': new_tile_y };
                        let falling_planet_coord_index = await main.getPlanetCoordIndex(falling_planet_coord_data);


                        if(falling_planet_coord_index !== -1) {
                            // lets see if we can place the player there
                            if(await main.canPlace('planet', dirty.planet_coords[falling_planet_coord_index], 'player', dirty.players[player_index].id)) {
                                console.log("Found a coord below, and the player can fall onto it");
                                await main.updateCoordGeneric(socket, {'planet_coord_index': previous_planet_coord_index, 'player_id': false });

                                await main.updateCoordGeneric(socket, {'planet_coord_index': falling_planet_coord_index, 'player_id': socket.player_id });

                                dirty.players[player_index].planet_coord_id = dirty.planet_coords[falling_planet_coord_index].id;
                                dirty.players[player_index].has_change = true;
                                // send the updated player info
                                await world.sendPlayerInfo(socket, "planet_" + dirty.planet_coords[falling_planet_coord_index].planet_id,
                                    dirty, dirty.players[player_index].id);

                                socket.emit('clear_map');

                                await map.updateMap(socket, dirty);
                                world.removeBattleLinkers(dirty, { 'player_id': dirty.players[player_index].id });
                                return;
                            }
                        }
                    }
                }

                return false;
            }

            let can_move_to = await main.canPlace('planet', dirty.planet_coords[planet_coord_index], 'player', dirty.players[player_index].id);

            if(!can_move_to) {
                return false;
            }

            let object_type_index = -1;
            if(dirty.planet_coords[planet_coord_index].object_type_id) {
                object_type_index = main.getObjectTypeIndex(dirty.planet_coords[planet_coord_index].object_type_id);
            }


            if (dirty.planet_coords[planet_coord_index].object_type_id === 47) {

                moveThroughPortal(socket, dirty, dirty.planet_coords[planet_coord_index].object_id);

            }
            // Object types that move you down. Holes.
            else if (dirty.planet_coords[planet_coord_index].object_type_id && dirty.object_types[object_type_index].is_hole) {
                console.log("Player is trying to go down a hole");

                let new_planet_level = dirty.planet_coords[previous_planet_coord_index].level - 1;
                let stairs_index = await main.getPlanetCoordIndex({'planet_id': dirty.planet_coords[planet_coord_index].planet_id,
                    'planet_level': new_planet_level, 'tile_x': new_tile_x, 'tile_y': new_tile_y});

                if(stairs_index !== -1) {
                    console.log("Found stairs");
                    if(await main.canPlace('planet', dirty.planet_coords[stairs_index], 'player', socket.player_id)) {

                        // we basically skip moving onto the actual hole, and move directly to the stairs
                        await main.updateCoordGeneric(socket, {'planet_coord_index': previous_planet_coord_index, 'player_id': false });

                        // SKIP THE HOLE!!!!
                        //await main.updateCoordGeneric(socket, {'planet_coord_index': hole_index, 'player_id': false });

                        await main.updateCoordGeneric(socket, {'planet_coord_index': stairs_index, 'player_id': socket.player_id });

                        dirty.players[player_index].planet_coord_id = dirty.planet_coords[stairs_index].id;
                        dirty.players[player_index].has_change = true;
                        // send the updated player info
                        await world.sendPlayerInfo(socket, "planet_" + dirty.planet_coords[stairs_index].planet_id, dirty, dirty.players[player_index].id);

                        socket.emit('clear_map');

                        await map.updateMap(socket, dirty);
                        world.removeBattleLinkers(dirty, { 'player_id': dirty.players[player_index].id });
                    } else {
                        console.log("Something is already on the stairs");
                    }
                } else {
                    console.log("Unable to find hole above stairs");
                }

            } else if (dirty.planet_coords[planet_coord_index].object_type_id && dirty.object_types[object_type_index].is_stairs) {
                // STAIRS

                // get the coord we would actually be moving to ( think warp to the planet coord above )
                let new_planet_level = dirty.planet_coords[previous_planet_coord_index].level + 1;
                let hole_index = await main.getPlanetCoordIndex({'planet_id': dirty.planet_coords[planet_coord_index].planet_id,
                    'planet_level': new_planet_level, 'tile_x': new_tile_x, 'tile_y': new_tile_y});

                if(hole_index !== -1) {
                    if(await main.canPlace('planet', dirty.planet_coords[hole_index], 'player', socket.player_id)) {

                        // MOVE DIRECTLY ONTO THE HOLE
                        await main.updateCoordGeneric(socket, { 'planet_coord_index': previous_planet_coord_index, 'player_id': false });

                        //await main.updateCoordGeneric(socket, {'planet_coord_index': stairs_index, 'player_id': false });

                        await main.updateCoordGeneric(socket, {'planet_coord_index': hole_index, 'player_id': socket.player_id });

                        dirty.players[player_index].planet_coord_id = dirty.planet_coords[hole_index].id;
                        dirty.players[player_index].has_change = true;
                        await world.sendPlayerInfo(socket, "planet_" + dirty.planet_coords[hole_index].planet_id, dirty, dirty.players[player_index].id);

                        socket.emit('clear_map');
                        world.removeBattleLinkers(dirty, { 'player_id': dirty.players[player_index].id});
                        await map.updateMap(socket, dirty);

                    } else {
                        console.log("Something is blocking the hole");

                    }
                } else {
                    console.log("Unable to find hole above stairs");
                }





            }
            // Basic Move
            else {
                //console.log("In basic move");

                let passed_rules = true;


                if(object_type_index !== -1 &&  dirty.object_types[object_type_index].can_have_rules && dirty.planet_coords[planet_coord_index].object_id) {
                    passed_rules = await checkObjectMovementRules(socket, dirty, dirty.planet_coords[planet_coord_index].object_id);
                }

                if(!passed_rules) {
                    console.log("Did not pass rules");
                    return false;
                }

                // get are going to grab the new coords that we need BEFORE we send that they player has moved
                let starting_y = -1;
                let ending_y = -1;
                let starting_x = -1;
                let ending_x = -1;

                // We only need to send new planet coords to the client
                if (movement_direction === "up") {

                    starting_y = new_tile_y - Math.floor(global.show_rows / 2);
                    ending_y = starting_y;
                    starting_x = new_tile_x - Math.floor(global.show_cols / 2);
                    ending_x = new_tile_x + Math.floor(global.show_cols / 2);

                } else if(movement_direction === "down") {
                    starting_y = new_tile_y + Math.floor(global.show_rows / 2);
                    ending_y = starting_y;
                    starting_x = new_tile_x - Math.floor(global.show_cols / 2);
                    ending_x = new_tile_x + Math.floor(global.show_cols / 2);
                } else if(movement_direction === "left") {
                    starting_x = new_tile_x - Math.floor(global.show_cols / 2);
                    ending_x = starting_x;
                    starting_y = new_tile_y - Math.floor(global.show_rows / 2);
                    ending_y = new_tile_y + Math.floor(global.show_rows / 2);
                } else if(movement_direction === "right") {
                    starting_x = new_tile_x + Math.floor(global.show_cols / 2);
                    ending_x = starting_x;
                    starting_y = new_tile_y - Math.floor(global.show_rows / 2);
                    ending_y = new_tile_y + Math.floor(global.show_rows / 2);
                }

                //console.log("Movement has us sending new coords from x: " + starting_x + " - " + ending_x + " y: " + starting_y + " - " + ending_y);

                for(let i = starting_x; i <= ending_x; i++) {
                    for(let j = starting_y; j <= ending_y; j++) {

                        // coords don't exist < 0
                        if(i >= 0 && j >= 0) {
                            //console.log("Sending planet coord x,y: " + i + "," + j + " due to move");
                            let planet_coord_data = { 'planet_id': dirty.planet_coords[planet_coord_index].planet_id,
                                'planet_level': dirty.planet_coords[planet_coord_index].level, 'tile_x': i, 'tile_y': j };
                            let other_planet_coord_index = await main.getPlanetCoordIndex(planet_coord_data);

                            if(other_planet_coord_index !== -1) {

                                socket.emit('planet_coord_info', { 'planet_coord': dirty.planet_coords[other_planet_coord_index] });


                                if(dirty.planet_coords[other_planet_coord_index].monster_id) {
                                    world.sendMonsterInfo(socket, false, dirty, { 'monster_id': dirty.planet_coords[planet_coord_index].monster_id });
                                    world.checkMonsterBattleConditions(dirty, dirty.planet_coords[other_planet_coord_index].monster_id, 'player', socket.player_id, socket);
                                }

                                if(dirty.planet_coords[other_planet_coord_index].object_id) {
                                    world.checkObjectBattleConditions(socket, dirty, dirty.planet_coords[other_planet_coord_index].object_id, 'player', socket.player_id);
                                }

                            }
                        }

                    }
                }


                await main.updateCoordGeneric(socket, {'planet_coord_index': previous_planet_coord_index, 'player_id': false });
                await main.updateCoordGeneric(socket, {'planet_coord_index': planet_coord_index, 'player_id': dirty.players[player_index].id });

                // send the updated player info
                dirty.players[player_index].planet_coord_id = dirty.planet_coords[planet_coord_index].id;
                dirty.players[player_index].has_change = true;
                await world.sendPlayerInfo(socket, "planet_" + dirty.planet_coords[planet_coord_index].planet_id, dirty, dirty.players[player_index].id);


                // player moved onto a spaceport tile - remove any battle linkers with them. SAFE.
                if(dirty.planet_coords[planet_coord_index].floor_type_id === 11) {
                    //console.log("Player moved onto spaceport. Removing battle linkers");
                    await world.removeBattleLinkers(dirty, { 'player_id': socket.player_id });
                } else {

                    // we need to see if this planet has an AI on it, and if so - if the player violated those rules with
                    // the move
                    let planet_index = await planet.getIndex(dirty, {'planet_id':dirty.planet_coords[planet_coord_index].planet_id, 'source': 'movement.movePlanet' });
                    if(planet_index !== -1 && dirty.planets[planet_index].player_id) {

                        // see if that player has built an AI
                        let ai_index = dirty.objects.findIndex(function(obj) {
                            return obj && obj.player_id === dirty.planets[planet_index].player_id && obj.object_type_id === 72; });
                        if(ai_index !== -1) {
                            //console.log("There is an AI on this planet. AI id: " + dirty.objects[ai_index].id);


                            dirty.rules.forEach(function(rule) {
                                if(rule.object_id === dirty.objects[ai_index].id) {
                                    //console.log("Checking rule: " + rule.rule);

                                    if(rule.rule === 'attack_all_players') {
                                        console.log("Player moved on a planet with attack_all_players as a rule");
                                        let ai_attack_data = {
                                            'ai_id': dirty.objects[ai_index].id, 'attacking_type': 'player',
                                            'attacking_id': socket.player_id };
                                        world.aiAttack(dirty, ai_attack_data);
                                    }
                                }
                            });

                        }

                    }


                }

                // Get the floor type of the tile we moved to, and put in a move modifier for the socket on the next
                // move if it's applicable
                let floor_type_index = main.getFloorTypeIndex(dirty.planet_coords[planet_coord_index].floor_type_id);

                if(floor_type_index !== -1 && dirty.floor_types[floor_type_index].movement_modifier) {
                    console.log("Player moved on a tile that makes them faster/slower. Setting movement modifier");
                    socket.movement_modifier = dirty.floor_types[floor_type_index].movement_modifier;
                }



                //await map.updateMap(socket, dirty);


            }


            */

        } catch(error) {
            log(chalk.red("Error in movement.movePlanetNpc: " + error));
            console.error(error);
        }
    }

    exports.movePlanetNpc = movePlanetNpc;

    async function moveShip(socket, dirty, destination_coord_id, movement_direction) {

        try {


            if(typeof socket.player_index === "undefined" || socket.player_index === -1) {
                log(chalk.yellow("Socket does not have a player_index yet"));
                return false;
            }

            let player_index = socket.player_index;



            let previous_ship_coord_index = await main.getShipCoordIndex({'ship_coord_id': dirty.players[player_index].ship_coord_id});

            if(previous_ship_coord_index === -1) {
                log(chalk.yellow("Unable to find previous ship coord for player movement.moveShip"));
                return;
            }


            let ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': destination_coord_id });

            if(ship_coord_index === -1) {
                return false;
            }

            let ship_index = await game_object.getIndex(dirty, dirty.ship_coords[ship_coord_index].ship_id);

            // Make sure the coords are close enough
            if( Math.abs(dirty.ship_coords[previous_ship_coord_index].tile_x - dirty.ship_coords[ship_coord_index].tile_x) > 1 ||
                Math.abs(dirty.ship_coords[previous_ship_coord_index].tile_y - dirty.ship_coords[ship_coord_index].tile_y) > 1) {
                log(chalk.yellow("Move is too far away. In moveShip"));
                return false;
            }

            let can_move_to = await player.canPlace(dirty, 'ship', dirty.ship_coords[ship_coord_index], player_index);


            //let can_move_to = await main.canPlace('ship', dirty.ship_coords[ship_coord_index], 'player', dirty.players[player_index].id);

            if(!can_move_to) {
                return false;
            }

            let object_type_index = -1;
            if(dirty.ship_coords[ship_coord_index].object_type_id) {
                object_type_index = main.getObjectTypeIndex(dirty.ship_coords[ship_coord_index].object_type_id);
            }

            // PORTALS!!!!
            if (dirty.ship_coords[ship_coord_index].object_type_id && dirty.object_types[object_type_index].is_portal) {

                await moveThroughPortal(socket, dirty, dirty.ship_coords[ship_coord_index].object_id);

            }
            // HOLES
            else if (dirty.ship_coords[ship_coord_index].object_type_id && dirty.object_types[object_type_index].is_hole) {
                //console.log("Player is trying to go down a hole");

                let new_ship_level = dirty.ship_coords[previous_ship_coord_index].level - 1;
                let stairs_index = await main.getShipCoordIndex({'ship_id': dirty.ship_coords[ship_coord_index].ship_id,
                    'level': new_ship_level, 'tile_x': dirty.ship_coords[ship_coord_index].tile_x, 'tile_y': dirty.ship_coords[ship_coord_index].tile_y});

                if(stairs_index !== -1) {
                    //console.log("Found stairs");

                    let moving_to_coord_index = await world.getOpenCoordIndex(dirty, 'ship', stairs_index, 'player', socket.player_index, 1);;

                    // In most cases, we can just put them on the stairs


                    let can_place_result = await player.canPlace(dirty, 'ship', dirty.ship_coords[stairs_index], socket.player_index);

            

                    if(moving_to_coord_index !== -1) {

                        world.removeBattleLinkers(dirty, { 'player_id': dirty.players[socket.player_index].id });
                        // we basically skip moving onto the actual hole, and move directly to the stairs
                        await main.updateCoordGeneric(socket, {'ship_coord_index': previous_ship_coord_index, 'player_id': false });

                        // SKIP THE HOLE!!!!
                        //await main.updateCoordGeneric(socket, {'ship_coord_index': hole_index, 'player_id': false });

                        await main.updateCoordGeneric(socket, {'ship_coord_index': moving_to_coord_index, 'player_id': socket.player_id });

                        dirty.players[socket.player_index].ship_coord_id = dirty.ship_coords[moving_to_coord_index].id;
                        dirty.players[socket.player_index].ship_coord_index = moving_to_coord_index;
                        dirty.players[socket.player_index].has_change = true;
                        // send the updated player info
                        await player.sendInfo(socket, "ship_" + dirty.ship_coords[moving_to_coord_index].ship_id, dirty,
                            dirty.players[socket.player_index].id);

                        socket.emit('clear_map');

                        await map.updateMap(socket, dirty);
                        
                    } else {
                        console.log("Something is blocking the stairs and the area around the stairs");
                        socket.emit('move_failure', { 'failed_ship_coord_id': dirty.ship_coords[stairs_index].id,
                            'return_to_ship_coord_id': dirty.players[socket.player_index].ship_coord_id });
                        socket.emit('result_info', { 'status': 'failure', 'text': 'Something is blocking the stairs below' });
                    }
                } else {
                    console.log("Unable to find hole above stairs");
                }

            }
            // STAIRS
            else if (dirty.ship_coords[ship_coord_index].object_type_id && dirty.object_types[object_type_index].is_stairs) {


                // get the coord we would actually be moving to ( think warp to the ship coord above )
                let new_ship_level = dirty.ship_coords[previous_ship_coord_index].level + 1;
                let hole_index = await main.getShipCoordIndex({'ship_id': dirty.ship_coords[ship_coord_index].ship_id,
                    'level': new_ship_level, 'tile_x': dirty.ship_coords[ship_coord_index].tile_x, 'tile_y': dirty.ship_coords[ship_coord_index].tile_y });

                if(hole_index !== -1) {

                    let moving_to_coord_index = await world.getOpenCoordIndex(dirty, 'ship', hole_index, 'player', socket.player_index, 1);

                    if(moving_to_coord_index !== -1) {

                        world.removeBattleLinkers(dirty, { 'player_id': dirty.players[socket.player_index].id});
                        // MOVE DIRECTLY ONTO THE HOLE
                        await main.updateCoordGeneric(socket, { 'ship_coord_index': previous_ship_coord_index, 'player_id': false });

                        //await main.updateCoordGeneric(socket, {'ship_coord_index': stairs_index, 'player_id': false });

                        await main.updateCoordGeneric(socket, {'ship_coord_index': moving_to_coord_index, 'player_id': socket.player_id });

                        dirty.players[socket.player_index].ship_coord_id = dirty.ship_coords[moving_to_coord_index].id;
                        dirty.players[socket.player_index].ship_coord_index = moving_to_coord_index;
                        dirty.players[socket.player_index].has_change = true;
                        await player.sendInfo(socket, "ship_" + dirty.ship_coords[moving_to_coord_index].ship_id, dirty, dirty.players[socket.player_index].id);

                        socket.emit('clear_map');
                        
                        await map.updateMap(socket, dirty);

                    } else {
                        console.log("Something is blocking the hole, AND the space around it!");
                        socket.emit('move_failure', { 'failed_ship_coord_id': dirty.ship_coords[hole_index].id,
                            'return_to_ship_coord_id': dirty.players[socket.player_index].ship_coord_id });
                        socket.emit('result_info', { 'status': 'failure', 'text': 'Something is blocking the hole above' });

                    }
                } else {
                    console.log("Unable to find hole above stairs");
                }





            }
            // Basic move
            else {

                let passed_rules = true;

                if(object_type_index !== -1 && dirty.object_types[object_type_index].can_have_rules && dirty.ship_coords[ship_coord_index].object_id) {
                    passed_rules = await checkObjectMovementRules(socket, dirty, dirty.ship_coords[ship_coord_index].object_id);
                }

                if(!passed_rules) {
                    socket.emit('move_failure', { 'failed_ship_coord_id': dirty.ship_coords[ship_coord_index].id,
                        'return_to_ship_coord_id': dirty.ship_coords[previous_ship_coord_index].id });
                    socket.emit('result_info', { 'status': 'failure', 'text': 'Not allowed due to rules',
                        'object_id': dirty.ship_coords[ship_coord_index].object_id });
                    return false;
                }


                // most basic move - tie into our placePlayer function

                // get are going to grab the new coords that we need BEFORE we send that they player has moved
                let starting_y = -1;
                let ending_y = -1;
                let starting_x = -1;
                let ending_x = -1;
                let send_additional_coords = true;

                // We only need to send new ship coords to the client
                // MOVED UP
                if(dirty.ship_coords[previous_ship_coord_index].tile_y > dirty.ship_coords[ship_coord_index].tile_y) {
                //if (movement_direction === "up") {

                    starting_y = dirty.ship_coords[ship_coord_index].tile_y - Math.floor(global.show_rows / 2);
                    ending_y = starting_y;
                    starting_x = dirty.ship_coords[ship_coord_index].tile_x - Math.floor(global.show_cols / 2);
                    ending_x = dirty.ship_coords[ship_coord_index].tile_x + Math.floor(global.show_cols / 2);



                    //console.time("sendRow");
                    
                    let sending_row = dirty.ship_coords[ship_coord_index].tile_y - (Math.floor(global.show_rows / 2));


                    let begin_time = Date.now();

                    await map.sendRow(socket, dirty, 'ship', 'up', dirty.ship_coords[ship_coord_index].tile_x, ship_coord_index, sending_row);

                    let end_time = Date.now();
                    let time_difference = end_time - begin_time;

                    // Sometimes this lookup will take too long initially, and then we don't want to call all the additional ones.
                    if(time_difference < 30) {
                        // Ships can have very different shapes, so we are going to do a little extra work and sendRow from 3 spots to hopefully see every coordinate
                        // lets move left and right a few tiles and call sendRow from there
                        let final_left_coord_index = ship_coord_index;
                        let hit_nothing = false;
                        for(let x = dirty.ship_coords[ship_coord_index].tile_x - 1; x > dirty.ship_coords[ship_coord_index].tile_x - 4 && !hit_nothing; x--) {
                            await map.getCoordNeighbor(dirty, 'ship', final_left_coord_index, 'left');
                            if(dirty.ship_coords[final_left_coord_index].left_coord_index !== -1) {
                                final_left_coord_index = dirty.ship_coords[final_left_coord_index].left_coord_index;
                            } else {
                                hit_nothing = true;
                            }
                        }

                        if(final_left_coord_index !== ship_coord_index) {
                            await map.sendRow(socket, dirty, 'ship', 'up', dirty.ship_coords[final_left_coord_index].tile_x, final_left_coord_index, sending_row);
                        }

                        let final_right_coord_index = ship_coord_index;
                        hit_nothing = false;
                        for(let x = dirty.ship_coords[ship_coord_index].tile_x + 1; x < dirty.ship_coords[ship_coord_index].tile_x + 4 && !hit_nothing; x++) {
                            await map.getCoordNeighbor(dirty, 'ship', final_right_coord_index, 'right');
                            if(dirty.ship_coords[final_right_coord_index].right_coord_index !== -1) {
                                final_right_coord_index = dirty.ship_coords[final_right_coord_index].right_coord_index;
                            } else {
                                hit_nothing = true;
                            }
                        }

                        if(final_right_coord_index !== ship_coord_index) {
                            await map.sendRow(socket, dirty, 'ship', 'up', dirty.ship_coords[final_right_coord_index].tile_x, final_right_coord_index, sending_row);
                        }

                    } 


                    

                    //console.timeEnd("sendRow");

                    
                    /*
                    // @ts-ignore
                    let destination_coord_index = await helper.getDestinationCoordIndex(dirty, 'ship', ship_coord_index, 'up', Math.floor(global.show_rows / 2));

                    if(destination_coord_index === -1) {
                        //console.log("Don't bother sending additional coords");
                        send_additional_coords = false;
                    } else {
                        //console.log("Should send additional coords");
                    }
                    */

                }
                // MOVED DOWN
                if(dirty.ship_coords[previous_ship_coord_index].tile_y < dirty.ship_coords[ship_coord_index].tile_y) {
                
                    starting_y = dirty.ship_coords[ship_coord_index].tile_y + Math.floor(global.show_rows / 2);
                    ending_y = starting_y;
                    starting_x = dirty.ship_coords[ship_coord_index].tile_x - Math.floor(global.show_cols / 2);
                    ending_x = dirty.ship_coords[ship_coord_index].tile_x + Math.floor(global.show_cols / 2);


                    //console.time("sendRow");
                    
                    let sending_row = dirty.ship_coords[ship_coord_index].tile_y + (Math.floor(global.show_rows / 2));

                    let begin_time = Date.now();
                    
                    await map.sendRow(socket, dirty, 'ship', 'down', dirty.ship_coords[ship_coord_index].tile_x, ship_coord_index, sending_row);

                    let end_time = Date.now();
                    let time_difference = end_time - begin_time;

                    // Sometimes this lookup will take too long initially, and then we don't want to call all the additional ones.
                    if(time_difference < 30) {

                        // Ships can have very different shapes, so we are going to do a little extra work and sendRow from 3 spots to hopefully see every coordinate
                        // lets move left and right a few tiles and call sendRow from there
                        let final_left_coord_index = ship_coord_index;
                        let hit_nothing = false;
                        for(let x = dirty.ship_coords[ship_coord_index].tile_x - 1; x > dirty.ship_coords[ship_coord_index].tile_x - 4 && !hit_nothing; x--) {
                            await map.getCoordNeighbor(dirty, 'ship', final_left_coord_index, 'left');
                            if(dirty.ship_coords[final_left_coord_index].left_coord_index !== -1) {
                                final_left_coord_index = dirty.ship_coords[final_left_coord_index].left_coord_index;
                            } else {
                                hit_nothing = true;
                            }
                        }

                        if(final_left_coord_index !== ship_coord_index) {
                            await map.sendRow(socket, dirty, 'ship', 'down', dirty.ship_coords[final_left_coord_index].tile_x, final_left_coord_index, sending_row);
                        }

                        let final_right_coord_index = ship_coord_index;
                        hit_nothing = false;
                        for(let x = dirty.ship_coords[ship_coord_index].tile_x + 1; x < dirty.ship_coords[ship_coord_index].tile_x + 4 && !hit_nothing; x++) {
                            await map.getCoordNeighbor(dirty, 'ship', final_right_coord_index, 'right');
                            if(dirty.ship_coords[final_right_coord_index].right_coord_index !== -1) {
                                final_right_coord_index = dirty.ship_coords[final_right_coord_index].right_coord_index;
                            } else {
                                hit_nothing = true;
                            }
                        }

                        if(final_right_coord_index !== ship_coord_index) {
                            await map.sendRow(socket, dirty, 'ship', 'down', dirty.ship_coords[final_right_coord_index].tile_x, final_right_coord_index, sending_row);
                        }
                    }


                    //console.timeEnd("sendRow");

                    /*
                    // @ts-ignore
                    let destination_coord_index = await helper.getDestinationCoordIndex(dirty, 'ship', ship_coord_index, 'down', Math.floor(global.show_rows / 2));

                    if(destination_coord_index === -1) {
                        //console.log("Don't bother sending additional coords");
                        send_additional_coords = false;
                    } else {
                        //console.log("Should send additional coords");
                    }
                    */
                }
                // MOVED LEFT
                if(dirty.ship_coords[previous_ship_coord_index].tile_x > dirty.ship_coords[ship_coord_index].tile_x) {
                
                    starting_x = dirty.ship_coords[ship_coord_index].tile_x - Math.floor(global.show_cols / 2);
                    ending_x = starting_x;
                    starting_y = dirty.ship_coords[ship_coord_index].tile_y - Math.floor(global.show_rows / 2);
                    ending_y = dirty.ship_coords[ship_coord_index].tile_y + Math.floor(global.show_rows / 2);


                    //console.time("sendColumn");
                    
                    let sending_column = dirty.ship_coords[ship_coord_index].tile_x - (Math.floor(global.show_cols / 2));
                    //log(chalk.cyan("Telling server to send column: " + sending_column + " to a client"));
                    
                    let begin_time = Date.now();

                    await map.sendColumn(socket, dirty, 'ship', 'left', dirty.ship_coords[ship_coord_index].tile_y, ship_coord_index, sending_column);

                    let end_time = Date.now();
                    let time_difference = end_time - begin_time;

                    // Sometimes this lookup will take too long initially, and then we don't want to call all the additional ones.
                    if(time_difference < 30) {

                        // Ships can have very different shapes, so we are going to do a little extra work and sendColumn from 3 spots to hopefully see every coordinate
                        // lets move up and right a few tiles and call sendRow from there
                        let final_up_coord_index = ship_coord_index;
                        let hit_nothing = false;
                        for(let y = dirty.ship_coords[ship_coord_index].tile_y - 1; y > dirty.ship_coords[ship_coord_index].tile_y - 4 && !hit_nothing; y--) {
                            await map.getCoordNeighbor(dirty, 'ship', final_up_coord_index, 'up');
                            if(dirty.ship_coords[final_up_coord_index].up_coord_index !== -1) {
                                final_up_coord_index = dirty.ship_coords[final_up_coord_index].up_coord_index;
                            } else {
                                hit_nothing = true;
                            }
                        }

                        if(final_up_coord_index !== ship_coord_index) {
                            await map.sendColumn(socket, dirty, 'ship', 'left', dirty.ship_coords[final_up_coord_index].tile_y, final_up_coord_index, sending_column);
                        }

                        let final_down_coord_index = ship_coord_index;
                        hit_nothing = false;
                        for(let y = dirty.ship_coords[ship_coord_index].tile_y + 1; y < dirty.ship_coords[ship_coord_index].tile_y + 4 && !hit_nothing; y++) {
                            await map.getCoordNeighbor(dirty, 'ship', final_down_coord_index, 'down');
                            if(dirty.ship_coords[final_down_coord_index].down_coord_index !== -1) {
                                final_down_coord_index = dirty.ship_coords[final_down_coord_index].down_coord_index;
                            } else {
                                hit_nothing = true;
                            }
                        }

                        if(final_down_coord_index !== ship_coord_index) {
                            await map.sendColumn(socket, dirty, 'ship', 'left', dirty.ship_coords[final_down_coord_index].tile_y, final_down_coord_index, sending_column);
                        }
                    }


                    //console.timeEnd("sendColumn");
                    
                
                    // @ts-ignore
                    /*
                    let destination_coord_index = await helper.getDestinationCoordIndex(dirty, 'ship', ship_coord_index, 'left', Math.floor(global.show_cols / 2));

                    if(destination_coord_index === -1) {
                        //console.log("Don't bother sending additional coords");
                        send_additional_coords = false;
                    } else {
                        //console.log("Should send additional coords");
                    }
                    */
                }
                // RIGHT
                if(dirty.ship_coords[previous_ship_coord_index].tile_x < dirty.ship_coords[ship_coord_index].tile_x) {
                //else if(movement_direction === "right") {
                    starting_x = dirty.ship_coords[ship_coord_index].tile_x + Math.floor(global.show_cols / 2);
                    ending_x = starting_x;
                    starting_y = dirty.ship_coords[ship_coord_index].tile_y - Math.floor(global.show_rows / 2);
                    ending_y = dirty.ship_coords[ship_coord_index].tile_y + Math.floor(global.show_rows / 2);

                    //console.time("sendColumn");
                    
                    let sending_column = dirty.ship_coords[ship_coord_index].tile_x + (Math.floor(global.show_cols / 2));
                    

                    let begin_time = Date.now();

                    await map.sendColumn(socket, dirty, 'ship', 'right', dirty.ship_coords[ship_coord_index].tile_y, ship_coord_index, sending_column);

                    let end_time = Date.now();
                    let time_difference = end_time - begin_time;

                    // Sometimes this lookup will take too long initially, and then we don't want to call all the additional ones.
                    if(time_difference < 30) {
                        // Ships can have very different shapes, so we are going to do a little extra work and sendColumn from 3 spots to hopefully see every coordinate
                        // lets move up and right a few tiles and call sendRow from there
                        let final_up_coord_index = ship_coord_index;
                        let hit_nothing = false;
                        for(let y = dirty.ship_coords[ship_coord_index].tile_y - 1; y > dirty.ship_coords[ship_coord_index].tile_y - 4 && !hit_nothing; y--) {
                            await map.getCoordNeighbor(dirty, 'ship', final_up_coord_index, 'up');
                            if(dirty.ship_coords[final_up_coord_index].up_coord_index !== -1) {
                                final_up_coord_index = dirty.ship_coords[final_up_coord_index].up_coord_index;
                            } else {
                                hit_nothing = true;
                            }
                        }

                        if(final_up_coord_index !== ship_coord_index) {
                            await map.sendColumn(socket, dirty, 'ship', 'right', dirty.ship_coords[final_up_coord_index].tile_y, final_up_coord_index, sending_column);
                        }

                        let final_down_coord_index = ship_coord_index;
                        hit_nothing = false;
                        for(let y = dirty.ship_coords[ship_coord_index].tile_y + 1; y < dirty.ship_coords[ship_coord_index].tile_y + 4 && !hit_nothing; y++) {
                            await map.getCoordNeighbor(dirty, 'ship', final_down_coord_index, 'down');
                            if(dirty.ship_coords[final_down_coord_index].down_coord_index !== -1) {
                                final_down_coord_index = dirty.ship_coords[final_down_coord_index].down_coord_index;
                            } else {
                                hit_nothing = true;
                            }
                        }

                        if(final_down_coord_index !== ship_coord_index) {
                            await map.sendColumn(socket, dirty, 'ship', 'right', dirty.ship_coords[final_down_coord_index].tile_y, final_down_coord_index, sending_column);
                        }
                    }

                    //console.timeEnd("sendColumn");

                    /*
                    // @ts-ignore
                    let destination_coord_index = await helper.getDestinationCoordIndex(dirty, 'ship', ship_coord_index, 'right', Math.floor(global.show_cols / 2));

                    if(destination_coord_index === -1) {
                        //console.log("Don't bother sending additional coords");
                        send_additional_coords = false;
                    } else {
                        //console.log("Should send additional coords");
                    }
                    */

                    /*
                    let moving_coord_index = ship_coord_index;

                    // We start at our x, and start looking to the right
                    for(let i = dirty.ship_coords[ship_coord_index].tile_x; i <= ending_x && send_additional_coords; i++) {

                        console.log("Seeing if coord at " + dirty.ship_coords[moving_coord_index].tile_x + "," + dirty.ship_coords[moving_coord_index].tile_y + " has a right index");

                        if(typeof dirty.ship_coords[moving_coord_index].right_coord_index !== 'undefined') {

                            // No coord there. Stop
                            if(dirty.ship_coords[moving_coord_index].right_coord_index === -1) {
                                console.log("Nothing to the right. Stopping");
                                send_additional_coords = false;
                            } else {
                                console.log("Found index to the right");
                                moving_coord_index = dirty.ship_coords[moving_coord_index].right_coord_index;
                            }
                        } 
                        // grab the index
                        else {
                            console.log("No index yet");
                            let checking_tile_x = i + 1;
                            let ship_coord_data = {  'ship_id': dirty.ship_coords[moving_coord_index].ship_id,
                            'level': dirty.ship_coords[moving_coord_index].level, 'tile_x': checking_tile_x, 'tile_y': dirty.ship_coords[moving_coord_index].tile_y };
                            console.log(ship_coord_data);
                            let additional_ship_coord_index = await main.getShipCoordIndex(ship_coord_data);

                            dirty.ship_coords[moving_coord_index].right_coord_index = additional_ship_coord_index;

                            if(additional_ship_coord_index !== -1) {
                                moving_coord_index = dirty.ship_coords[moving_coord_index].right_coord_index;
                                console.log("Found index");
                            } else {
                                send_additional_coords = false;
                                console.log("Did not find index");
                            }

                        }

                    }
                    */
                }

                //console.log("Movement has us sending new coords from x: " + starting_x + " - " + ending_x + " y: " + starting_y + " - " + ending_y);


                await main.updateCoordGeneric(socket, {'ship_coord_index': previous_ship_coord_index, 'player_id': false });
                await main.updateCoordGeneric(socket, {'ship_coord_index': ship_coord_index, 'player_id': socket.player_id });

                // send the updated player info
                dirty.players[player_index].ship_coord_id = dirty.ship_coords[ship_coord_index].id;
                dirty.players[player_index].ship_coord_index = ship_coord_index;
                dirty.players[player_index].has_change = true;
                await player.sendInfo(socket, "ship_" + dirty.ship_coords[ship_coord_index].ship_id, dirty, dirty.players[player_index].id);


                /*
                console.time("additionalCoords");
                for(let i = starting_x; i <= ending_x && send_additional_coords; i++) {
                    for(let j = starting_y; j <= ending_y; j++) {

                        // coords don't exist < 0
                        if(i >= 0 && j >= 0) {
                            //console.log("Sending planet coord x,y: " + i + "," + j + " due to move");
                            let ship_coord_data = {  'ship_id': dirty.ship_coords[ship_coord_index].ship_id,
                                'level': dirty.ship_coords[ship_coord_index].level, 'tile_x': i, 'tile_y': j };
                            let additional_ship_coord_index = await main.getShipCoordIndex(ship_coord_data);

                            if(additional_ship_coord_index !== -1) {

                                socket.emit('ship_coord_info', { 'ship_coord': dirty.ship_coords[additional_ship_coord_index] });

                                if(dirty.ship_coords[additional_ship_coord_index].monster_id) {
                                    world.checkMonsterBattleConditions(dirty, dirty.ship_coords[additional_ship_coord_index].monster_id, 'player', socket.player_id, socket);
                                }

                                if(dirty.ship_coords[additional_ship_coord_index].object_id) {
                                    world.checkObjectBattleConditions(socket, dirty, dirty.ship_coords[additional_ship_coord_index].object_id, 'player', socket.player_id);
                                }

                            }
                        }

                    }
                }

                console.timeEnd("additionalCoords");\
                */


                //await map.updateMap(socket, dirty);

                // If there's an AI, see if the move violated any rules
                if(dirty.objects[ship_index].ai_id) {


                    // see if that player has built an AI
                    let ai_index = await game_object.getIndex(dirty, dirty.objects[ship_index].ai_id);

                    if(ai_index !== -1) {
                        //console.log("There is an AI on this planet. AI id: " + dirty.objects[ai_index].id);

                        let sent_attack = false;
                        for(let rule of dirty.rules) {
                            if(rule.object_id === dirty.objects[ai_index].id) {
                                //console.log("Checking rule: " + rule.rule);

                                if(!sent_attack) {
                                    if(rule.rule === 'attack_all_players') {
                                        console.log("Player moved on a ship with attack_all_players as a rule");
                                        let ai_attack_data = {
                                            'ai_id': dirty.objects[ai_index].id, 'attacking_type': 'player',
                                            'attacking_id': socket.player_id };
                                        world.aiAttack(dirty, ai_attack_data);
                                        sent_attack = true;
                                    }
                                }

                            }
                        }



                    }


                }

                await player.calculateMovementModifier(socket, dirty, 'ship', ship_coord_index);
            }


        } catch(error) {
            log(chalk.red("Error in movement.moveShip: " + error));
            console.error(error);

        }

    }

    exports.moveShip = moveShip;




    async function moveThroughPortal(socket, dirty, portal_id) {
        try {

            //console.log("In moveThroughPortal");
            let portal_index = await game_object.getIndex(dirty, portal_id);

            if(portal_index === -1) {
                return false;
            }

            let attached_index = await game_object.getIndex(dirty, dirty.objects[portal_index].attached_to_id);

            if(attached_index === -1) {
                log(chalk.yellow("Portal is not attached to another portal"));
                socket.emit('chat', { 'message': "No connected portal", 'scope': 'system' });
                return false;
            }

            let moving_to_coord_index = -1;
            let temp_coord = {};
            let moving_to_scope = '';
            // If there's already a player on the end portal, we can't move
            if(dirty.objects[attached_index].planet_coord_id) {
                moving_to_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.objects[attached_index].planet_coord_id });

                if(moving_to_coord_index === -1) {
                    log(chalk.yellow("Could not find planet coord attached portal is supposed to be on"));
                    return false;
                }
                temp_coord = dirty.planet_coords[moving_to_coord_index];
                moving_to_scope = 'planet';
            } else if(dirty.objects[attached_index].ship_coord_id) {
                moving_to_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.objects[attached_index].ship_coord_id });

                if(moving_to_coord_index === -1) {
                    log(chalk.yellow("Could not find ship coord attached portal is supposed to be on"));
                    return false;
                }

                temp_coord = dirty.ship_coords[moving_to_coord_index];
                moving_to_scope = 'ship';
            }

            if(temp_coord.player_id) {
                socket.emit('chat', { 'message': "Another player is blocking the destination", 'scope': 'system' });
                return false;
            }

            if(temp_coord.monster_id) {
                socket.emit('chat', {'message': "Monster is blocking the destination", 'scope': 'system' });
            }

            let player_index = await player.getIndex(dirty, {'player_id':socket.player_id});

            if(dirty.players[player_index].planet_coord_id) {
                let previous_planet_coord_index = await main.getPlanetCoordIndex({'planet_coord_id': dirty.players[player_index].planet_coord_id });
                // Remove the player from the coord that they are on
                main.updateCoordGeneric(socket, { 'planet_coord_index': previous_planet_coord_index, 'player_id': false });

                socket.leave("planet_" + dirty.planet_coords[previous_planet_coord_index].planet_id);
            } else if(dirty.players[player_index].ship_coord_id) {
                let previous_ship_coord_index = await main.getShipCoordIndex({'ship_coord_id': dirty.players[player_index].ship_coord_id });

                // Remove the player from the coord that they are on
                main.updateCoordGeneric(socket, { 'ship_coord_index': previous_ship_coord_index, 'player_id': false });

                socket.leave("ship_" + dirty.ship_coords[previous_ship_coord_index].planet_id);
            }


            // Lets move the player to the next portal
            if(moving_to_scope === 'planet') {

                main.updateCoordGeneric(socket, { 'planet_coord_index': moving_to_coord_index, 'player_id': socket.player_id });

                dirty.players[player_index].planet_coord_id = temp_coord.id;
                dirty.players[player_index].planet_coord_index = moving_to_coord_index;
                dirty.players[player_index].ship_coord_id = false;
                dirty.players[player_index].ship_coord_index = -1;
                dirty.players[player_index].previous_ship_coord_id = false;
                dirty.players[player_index].coord_index = -1;
                dirty.players[player_index].has_change = true;
                await player.sendInfo(socket, "planet_" + temp_coord.planet_id, dirty, dirty.players[player_index].id);

                socket.join("planet_" + dirty.planet_coords[moving_to_coord_index].planet_id);

                // We're going to get the planet so we can send a planet type - so we know what monster sprites to dynamically load
                let moving_to_planet_index = await planet.getIndex(dirty, { 'planet_id': temp_coord.planet_id });

                socket.emit('view_change_data', { 'view': 'planet', 'planet_type_id': dirty.planets[moving_to_planet_index].planet_type_id });

            } else if (moving_to_scope === 'ship') {

                main.updateCoordGeneric(socket, { 'ship_coord_index': moving_to_coord_index, 'player_id': socket.player_id });

                dirty.players[player_index].ship_coord_id = temp_coord.id;
                dirty.players[player_index].ship_coord_index = moving_to_coord_index;
                dirty.players[player_index].coord_id = false;
                dirty.players[player_index].coord_index = -1;
                dirty.players[player_index].planet_coord_id = false;
                dirty.players[player_index].planet_coord_index = -1;
                dirty.players[player_index].previous_planet_coord_id = false;
                dirty.players[player_index].has_change = true;
                await player.sendInfo(socket, "ship_" + dirty.ship_coords[moving_to_coord_index].ship_id, dirty, dirty.players[player_index].id);

                socket.emit('view_change_data', { 'view': 'ship' });

                socket.join("ship_" + dirty.ship_coords[moving_to_coord_index].ship_id);
            }

            await map.updateMap(socket, dirty);


            //log(chalk.green("Done with portal move"));



        } catch(error) {
            log(chalk.red("Error in movement.moveThroughPortal: " + error));
            console.error(error);
        }
    }


    async function moveVirtual(socket, dirty, destination_coord_id, movement_direction) {
        try {

            socket.emit('result_info', { 'status': 'failure', 'text': "You are too weak to move in the virtual realm" });
        } catch(error) {
            log(chalk.red("Error in movement.moveVirtual: " + error));
            console.error(error);
        }
    }


async function payForGalaxyMove(socket, dirty, ship_index) {
    try {

        let paid_for_move = false;
        let ship_type_index = main.getObjectTypeIndex(dirty.objects[ship_index].object_type_id);

        if(dirty.objects[ship_index].engine_indexes) {
            for(let i = 0; i < dirty.objects[ship_index].engine_indexes.length; i++) {
                if(!paid_for_move && dirty.objects[dirty.objects[ship_index].engine_indexes[i]].energy >= 1) {
                    dirty.objects[dirty.objects[ship_index].engine_indexes[i]].energy--;
                    dirty.objects[dirty.objects[ship_index].engine_indexes[i]].has_change = true;
                    dirty.objects[ship_index].current_engine_energy--;
                    game_object.sendInfo(socket, false, dirty, dirty.objects[ship_index].engine_indexes[i]);

                    if(dirty.objects[dirty.objects[ship_index].engine_indexes[i]].object_type_id === 265 && dirty.objects[dirty.objects[ship_index].engine_indexes[i]].energy === 200) {
                        socket.emit('result_info', {'status': 'failure', 'text': 'Engine Low On Fuel' });
                    }

                    if(dirty.objects[dirty.objects[ship_index].engine_indexes[i]].object_type_id === 265 && dirty.objects[dirty.objects[ship_index].engine_indexes[i]].energy === 100) {
                        socket.emit('result_info', {'status': 'failure', 'text': 'Dock At Planet Soon!' });
                    }

                    if(dirty.objects[dirty.objects[ship_index].engine_indexes[i]].object_type_id === 265 && dirty.objects[dirty.objects[ship_index].engine_indexes[i]].energy === 50) {
                        socket.emit('result_info', {'status': 'failure', 'text': 'Engine Critically Low On Fuel' });
                    }

                    paid_for_move = true;
                }

            }
        }
        

        // Some ships don't need engines
        if(!dirty.object_types[ship_type_index].needs_engines || dirty.objects[ship_index].id < 81089) {
            paid_for_move = true;
        }

        return paid_for_move;

    } catch(error) {
        log(chalk.red("Error in movement.payForGalaxyMove: " + error));
        console.error(error);
    }
}

    /*
            DATA
            scope (planet, galaxy, ship)    |   planet_id   |   planet_level   |   x   |   y   |   previous_x   |   previous_y   |   previous_planet_level
                                            |   previous_planet_coord_id   |   previous_coord_id (for galaxy)
     */

    async function placePlayer(socket, dirty, data) {

        let player_index = await player.getIndex(dirty, {'player_id': socket.player_id});

        if(player_index === -1) {
            log(chalk.yellow("Could not find player for movement.placePlayer"));
            return false;
        }

        if(data.scope === 'galaxy') {

            console.log("Trying to place player at galaxy " + data.x + "," + data.y);

            let placing_coord_index = await main.getCoordIndex({'tile_x': data.x, 'tile_y': data.y });

            if(placing_coord_index === -1) {
                log(chalk.yellow("Couldn't find coord we are supposed to be placing player at"));
                return false;
            }

            dirty.players[player_index].coord_id = dirty.coords[placing_coord_index].id;
            dirty.players[player_index].coord_index = placing_coord_index;
            dirty.players[player_index].has_change = true;


            let previous_coord_index = -1;
            if(data.previous_coord_id) {
                previous_coord_index = await main.getCoordIndex({ 'coord_id': data.previous_coord_id });
            } else if(data.previous_x && data.previous_y) {
                previous_coord_index = await main.getCoordIndex({ 'tile_x': data.previous_x, 'tile_y': data.previous_y });
            }

            await main.updateCoordGeneric(socket, { 'coord_index': previous_coord_index, 'player_id': false });

            let new_coord_index = await main.getCoordIndex({ 'tile_x': data.x, 'tile_y': data.y });
            await main.updateCoordGeneric(socket, { 'cooord_index': new_coord_index, 'player_id': socket.player_id });

            await player.sendInfo(socket, "galaxy", dirty, dirty.players[player_index].id);


        } else if(data.scope === 'planet') {

            let placing_coord_index = await main.getPlanetCoordIndex({'planet_id': data.planet_id, 'planet_level': data.planet_level,
                'tile_x': data.x, 'tile_y': data.x });

            if(placing_coord_index === -1) {
                log(chalk.yellow("Could not find planet coords we are placing player on"));
                return false;
            }

            dirty.players[player_index].planet_coord_id = dirty.planet_coords[placing_coord_index].id;
            dirty.players[player_index].planet_coord_index = placing_coord_index;
            dirty.players[player_index].has_change = true;



            let previous_planet_coord_index = -1;


            // update the previous planet coord
            if(data.previous_planet_coord_id) {

                previous_planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': data.previous_planet_coord_id });


            } else if(data.previous_x && data.previous_y) {
                log(chalk.yellow("Not sure why were are using previous_x, previous_y. Returning false"));
                return false;
                //previous_planet_coord_index = await main.getPlanetCoordIndex({ 'planet_id': socket.player_planet_id,
                //    'planet_level': socket.player_planet_level, 'tile_x': data.previous_x, 'tile_y': data.previous_y });


            }

            await main.updateCoordGeneric(socket, { 'planet_coord_index': previous_planet_coord_index, 'player_id': false });
            await main.updateCoordGeneric(socket, {'planet_coord_index': placing_coord_index, 'player_id': dirty.players[player_index].id });
            await player.sendInfo(socket, "planet_" + dirty.planet_coords[placing_coord_index].planet_id, dirty, dirty.players[player_index].id);


        } else {
            console.log("NO SCOPE FOR movement.placePlayer");
        }


    }

    exports.placePlayer = placePlayer;

    /**
     *
     * @param socket
     * @param dirty
     * @param {Object} data
     * @param {number} data.planet_id
     * @param {number=} data.previous_coord_index
     * @returns {Promise<boolean>}
     */
    async function switchToPlanet(socket, dirty, data) {

        try {

            let player_index = await player.getIndex(dirty, {'player_id':socket.player_id});

            if(player_index === -1) {
                return false;
            }

            await main.grabPlanetCoords(data.planet_id, 'spaceport');

            let spaceport_index = await warpTo(socket, dirty, { 'player_index': player_index, 'warping_to': 'spaceport', 'planet_id': data.planet_id });

            if(spaceport_index === -1) {
                let failed_planet_index = await planet.getIndex(dirty, { 'planet_id': data.planet_id });
                if(failed_planet_index !== -1 && dirty.planets[failed_planet_index].planet_type_id === 26) {


                    if(typeof data.previous_coord_index !== 'undefined') {
                        socket.emit('move_failure', {
                            'return_to_coord_id': dirty.coords[data.previous_coord_index].id });
                    }
                    
                    socket.emit('result_info', { 'status': 'failure', 'text': 'Planet Is Forming' });
                    return false;


                } else {
                    console.log("Looks like spaceport tiles are full. Planet id: " + data.planet_id);
                    //socket.emit('chat', {'message': 'Spaceport is full', 'scope':'system'});
    
                    if(typeof data.previous_coord_index !== 'undefined') {
                        socket.emit('move_failure', {
                            'return_to_coord_id': dirty.coords[data.previous_coord_index].id });
                    }
                    
                    socket.emit('result_info', { 'status': 'failure', 'text': 'Spaceport Is Full' });
                    return false;
                }
                
            }



            // give the player's ship that they just used to enter the spaceport an attached to
            let ship_index = await game_object.getIndex(dirty, dirty.players[player_index].ship_id);

            let send_refuel_message = false;

            // The ship is now docked at this planet, make sure the player knows
            if(ship_index !== -1) {
                dirty.objects[ship_index].docked_at_planet_id = dirty.planet_coords[spaceport_index].planet_id;

                // and we need to remove the ship from the galaxy coords its on
                await game_object.removeFromCoord(dirty, ship_index);


                dirty.objects[ship_index].coord_id = false;
                dirty.objects[ship_index].coord_index = -1;
                dirty.objects[ship_index].current_coords = [];
                dirty.objects[ship_index].has_change = true;
                dirty.players[player_index].coord_id = false;
                dirty.players[player_index].coord_index = -1;
                dirty.players.has_change = true;

                // If the ship has an ion drive, the spaceport fills it back up

                try {
                    //console.time("spaceportFillUp");



                    for(let i = 0; i < dirty.objects[ship_index].engine_indexes.length; i++) {

                        if(dirty.objects[dirty.objects[ship_index].engine_indexes[i]] && dirty.objects[dirty.objects[ship_index].engine_indexes[i]].object_type_id === 265) {

                            let ion_drive_object_type_index = main.getObjectTypeIndex(dirty.objects[dirty.objects[ship_index].engine_indexes[i]].object_type_id);

                            if(ion_drive_object_type_index !== -1) {
                                send_refuel_message = true;


                                let energy_difference = dirty.object_types[ion_drive_object_type_index].max_energy_storage - dirty.objects[dirty.objects[ship_index].engine_indexes[i]].energy;
                                dirty.objects[ship_index].current_engine_energy += energy_difference;

                                dirty.objects[dirty.objects[ship_index].engine_indexes[i]].energy = dirty.object_types[ion_drive_object_type_index].max_energy_storage;
                                dirty.objects[dirty.objects[ship_index].engine_indexes[i]].has_change = true;
                            }



                        }

                    }
                    //console.timeEnd("spaceportFillUp");
                } catch(error) {
                    log(chalk.red("Error in refueling:"  + error));
                    console.error(error);
                }



                dirty.objects[ship_index].has_change = true;
                await game_object.sendInfo(socket, false, dirty, ship_index, 'movement.switchToPlanet');



            }

            // We're going to get the planet so we can send a planet type - so we know what monster sprites to dynamically load
            let moving_to_planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.planet_coords[spaceport_index].planet_id });

            socket.emit('view_change_data', { 'view': 'planet', 'planet_type_id': dirty.planets[moving_to_planet_index].planet_type_id });



            await player.sendInfo(socket, false, dirty, dirty.players[player_index].id);
            await player.sendInfo(false, "galaxy", dirty, dirty.players[player_index].id);
            await player.sendInfo(false, "planet_" + dirty.planet_coords[spaceport_index].planet_id, dirty, dirty.players[player_index].id);

            // immediately update the map for the socket
            await map.updateMap(socket, dirty);

            //socket.emit('landed_on_planet_data', { 'planet_id': socket.player_planet_id });



            await world.setPlayerMoveDelay(socket, dirty, player_index);



            // We are trying to get this to show up on the new view, so putting it last
            if(send_refuel_message) {
                socket.emit('chat', { 'message': "Your ship's ion drives have been refueled", 'scope': 'system' });
                socket.emit('result_info', { 'status': 'success', 'text': "Your ship's ion drives have been refueled" });
            }
            




        } catch(error) {
            log(chalk.red("Error in movement.switchToPlanet: " + error));
            console.error(error);
        }


    }

    exports.switchToPlanet = switchToPlanet;

    async function switchToPlanetNpc(dirty, npc_index, planet_id) {

        try {


            await main.grabPlanetCoords(planet_id, 'spaceport');

            let found_planet_coord_id = 0;
            let spaceport_coords = dirty.planet_coords.filter(planet_coord => planet_coord.planet_id === planet_id && planet_coord.floor_type_id === 11);
            if(spaceport_coords.length > 0) {
                for(let coord of spaceport_coords) {

                    if(found_planet_coord_id === 0) {
                        if(await npc.canPlace(dirty, 'planet', coord, dirty.npcs[npc_index].id)) {
                            found_planet_coord_id = coord.id;
                        }
                    }

                }
            }

            if(found_planet_coord_id === 0) {
                console.log("Looks like spaceport tiles are full for NPC");
                return false;
            }

            let spaceport_index = await main.getPlanetCoordIndex({'planet_coord_id': found_planet_coord_id});

            console.log("Found a planet coord! id: " + dirty.planet_coords[spaceport_index].id);


            // Found it all - time for the updates!
            let previous_coord_index = await main.getCoordIndex({ 'coord_id': dirty.npcs[npc_index].coord_id });
            if(previous_coord_index !== -1) {
                await main.updateCoordGeneric({}, { 'coord_index': previous_coord_index, 'npc_id': false });
            } else {
                log(chalk.yellow("Failed finding the galaxy coord the npc used to be on: " + dirty.npcs[npc_index].coord_id ));
            }



            //console.log("Updated Coord");

            await main.updateCoordGeneric({}, { 'planet_coord_index': spaceport_index, 'npc_id': dirty.npcs[npc_index].id });


            dirty.npcs[npc_index].planet_coord_id = dirty.planet_coords[spaceport_index].id;
            dirty.npcs[npc_index].planet_coord_index = spaceport_index;
            dirty.npcs[npc_index].coord_id = false;
            dirty.npcs[npc_index].coord_index = -1;
            //console.log("Setting npc coord id to false");
            dirty.npcs[npc_index].has_change = true;

            //console.log("Removing battle linkers");
            world.removeBattleLinkers(dirty, { 'npc_id': dirty.npcs[npc_index].id });


            await world.sendNpcInfo(false, "galaxy", dirty, dirty.npcs[npc_index].id);
            await world.sendNpcInfo(false, "planet_" + dirty.planet_coords[spaceport_index].planet_id, dirty, dirty.npcs[npc_index].id);


            dirty.npcs[npc_index].room = "planet_" + dirty.planet_coords[spaceport_index].planet_id;
            return true;

        } catch(error) {
            log(chalk.red("Error in movement.switchToPlaner: " + error));
        }


    }

    exports.switchToPlanetNpc = switchToPlanetNpc;

    async function switchToGalaxy(socket, dirty, player_index, reason = false) {

        try {


            //console.time("switchToGalaxy");


            if(!dirty.players[player_index]) {
                log(chalk.yellow("Could not get player"));
                return false;
            }

            /***** SWITCH TO GALAXY FROM PLANET ******/
            if (dirty.players[player_index].planet_coord_id ) {
                let planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.players[player_index].planet_coord_id });

                let planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.planet_coords[planet_coord_index].planet_id, 'source': 'movement.switchToGalaxy' });
                let ship_index = await game_object.getIndex(dirty, dirty.players[player_index].ship_id);

                let ship_type_index = main.getObjectTypeIndex(dirty.objects[ship_index].object_type_id);

                // If the reason isn't death, we need to make sure the player is on a spaceport tile
                if(reason === false) {

                    if(dirty.planet_coords[planet_coord_index].floor_type_id !== 11) {
                        socket.emit('chat', { 'message': "Can only leave planets from the spaceport", 'scope': 'system' });
                        console.log("Denied. Not on Spaceport tile");
                        return false;
                    }
                }

                let warp_to_coord_index = -1;
                let planet_galaxy_coord_index = await main.getCoordIndex({ 'coord_id': dirty.planets[planet_index].coord_id });

                console.time("getOpenCoordIndex");
                let placing_coord_index = await world.getOpenCoordIndex(dirty, 'galaxy', planet_galaxy_coord_index, 'player', player_index, 2);
                console.timeEnd("getOpenCoordIndex");

                if(placing_coord_index !== -1) {
                    warp_to_coord_index = await warpTo(socket, dirty, { 'player_index': player_index, 'warping_to': 'galaxy', 'base_coord_index': placing_coord_index });
                } else {
                    console.time("getOpenCoordIndexLonger");
                    placing_coord_index = await world.getOpenCoordIndex(dirty, 'galaxy', planet_galaxy_coord_index, 'player', player_index, 4);
                    console.timeEnd("getOpenCoordIndexLonger");

                    if(placing_coord_index !== -1) {
                        warp_to_coord_index = await warpTo(socket, dirty, { 'player_index': player_index, 'warping_to': 'galaxy', 'base_coord_index': placing_coord_index });
                    }
                }


                /* Keeping for a tiny bit (0.2.26) just incase the new way above has some weird bug I'm not expecting
                console.time("oldWay");
                // TODO right now we are just choosing two coords. We really need to try all the coords around the actual planet!
                // So for larger ships - and really ships in general - if we can't spawn around the
                // top left, we need to try other coordinates around the ship

                // lets create an array of coords we can warp to

                // planet coord
                let potential_coord_indexes = [];
                let coord_index = await main.getCoordIndex({ 'coord_id': dirty.planets[planet_index].coord_id });
                potential_coord_indexes.push(coord_index);

                // assuming a 3x3 planet.... eeek....
                let bottom_right_tile_x = dirty.coords[coord_index].tile_x + 3;
                let bottom_right_tile_y = dirty.coords[coord_index].tile_y + 3;
                let bottom_right_coord_index = await main.getCoordIndex({ 'tile_x': bottom_right_tile_x, 'tile_y': bottom_right_tile_y});
                //console.log("Bottom right coord index: " + bottom_right_coord_index);
                potential_coord_indexes.push(bottom_right_coord_index);

                // top right
                let top_right_tile_x = dirty.coords[coord_index].tile_x + 4;
                let top_right_tile_y = dirty.coords[coord_index].tile_y;
                let top_right_coord_index = await main.getCoordIndex({ 'tile_x': top_right_tile_x, 'tile_y': top_right_tile_y});
                //console.log("Bottom right coord index: " + bottom_right_coord_index);
                potential_coord_indexes.push(top_right_coord_index);

                let warp_to_coord_index = -1;

                for(let i = 0; i < potential_coord_indexes.length && warp_to_coord_index === -1; i++) {
                    if(potential_coord_indexes === -1 ) {
                        log(chalk.yellow("Invalid potential_coord_index"));
                    } else {
                        //console.log("Trying to warp to tile_x,tile_y: " + dirty.coords[coord_index].tile_x + "," + dirty.coords[coord_index].tile_y);
                        warp_to_coord_index = await warpTo(socket, dirty, { 'player_index': player_index, 'warping_to': 'galaxy', 'base_coord_index': potential_coord_indexes[i] });
                    }

                }

                console.timeEnd("oldWay");
                */


                if(warp_to_coord_index === -1) {
                    log(chalk.yellow("Warp failed"));
                    socket.emit('chat', { 'message': "The area of space around the planet is too full for your ship to launch" });
                    socket.emit('result_info', { 'status': 'failure', 'text': "Space around planet is too full", 'scope': 'system' });
                    return false;
                }

                socket.map_needs_cleared = true;

                dirty.objects[ship_index].docked_at_planet_id = false;
                dirty.objects[ship_index].has_change = true;

                world.removeBattleLinkers(dirty, { 'player_id': dirty.players[player_index].id });


                //socket.emit('launched_data');


                socket.emit('view_change_data', { 'view': 'galaxy' });

                await map.updateMap(socket, dirty);

                await world.setPlayerMoveDelay(socket, dirty, player_index);



            }
            // Switching to galaxy from ship
            else if (dirty.players[player_index].ship_coord_id) {
                //console.log("In movement.switchToGalaxy - ship_coord_id");

                let ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.players[player_index].ship_coord_id });

                if(ship_coord_index === -1) {
                    log(chalk.yellow("Could not find ship coord"));
                    return false;
                }

                // The ship we are on
                let ship_index = await game_object.getIndex(dirty, dirty.ship_coords[ship_coord_index].ship_id);

                if(ship_index === -1) {
                    log(chalk.yellow("Could not find ship"));
                    return false;
                }



                let player_ship_index = await game_object.getIndex(dirty, dirty.players[player_index].ship_id);

                if(player_ship_index === -1) {
                    log(chalk.yellow("Could not find the ship the player is on"));
                    return false;
                }


                let ship_galaxy_coord_index = await main.getCoordIndex({ 'coord_id': dirty.objects[ship_index].coord_id });

                if(ship_galaxy_coord_index === -1) {
                    console.log("Ship is not IN the galaxy...")


                    // Normally we would place somewhere randomly in the galaxy. If we are on The Great Nomad - we're stuck out of the galaxy for now
                    if(dirty.objects[ship_index].object_type_id === 351) {


                        socket.emit('result_info', { 'status': 'failure', 'text': 'The Great Nomad is currently out beyond our galaxy' });
                        return false;

                    } else if(helper.notFalse(dirty.objects[ship_index].spawned_event_id)) {
                        console.log("ship with no galaxy coord has a spawned event id!");
                        let spawned_event_index = await event.getSpawnedEventIndex(dirty, dirty.objects[ship_index].spawned_event_id);

                        if(spawned_event_index === -1) {
                            log(chalk.yellow("Unable to find the spawned_event"));
                            return false;
                        } 


                        if(dirty.spawned_events[spawned_event_index].planet_id) {
                            let planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.spawned_events[spawned_event_index].planet_id});
                            if(planet_index !== -1) {
                                let potential_coord_indexes = [];
                                let coord_index = await main.getCoordIndex({ 'coord_id': dirty.planets[planet_index].coord_id });
                                potential_coord_indexes.push(coord_index);
                
                                // assuming a 3x3 planet.... eeek....
                                let bottom_right_tile_x = dirty.coords[coord_index].tile_x + 3;
                                let bottom_right_tile_y = dirty.coords[coord_index].tile_y + 3;
                                let bottom_right_coord_index = await main.getCoordIndex({ 'tile_x': bottom_right_tile_x, 'tile_y': bottom_right_tile_y});
                                //console.log("Bottom right coord index: " + bottom_right_coord_index);
                                potential_coord_indexes.push(bottom_right_coord_index);
                
                                let warp_to_coord_index = -1;
                
                                for(let i = 0; i < potential_coord_indexes.length && warp_to_coord_index === -1; i++) {
                                    if(potential_coord_indexes[i] === -1 ) {
                                        log(chalk.yellow("Invalid potential_coord_index"));
                                    } else {
                                        //console.log("Trying to warp to tile_x,tile_y: " + dirty.coords[coord_index].tile_x + "," + dirty.coords[coord_index].tile_y);
                                        warp_to_coord_index = await warpTo(socket, dirty, { 'player_index': player_index, 'warping_to': 'galaxy', 'base_coord_index': potential_coord_indexes[i] });
                                    }
                
                                }
                
                
                                if(warp_to_coord_index === -1) {
                                    log(chalk.yellow("Warp failed"));
                                    socket.emit('chat', { 'message': "The area of space around the planet is too full for your ship to launch" });
                                    socket.emit('result_info', { 'status': 'failure', 'text': "Space around planet is too full", 'scope': 'system' });
                                    return false;
                                }
                
                                socket.map_needs_cleared = true;
                
                                dirty.objects[ship_index].docked_at_planet_id = false;
                                dirty.objects[ship_index].has_change = true;
                
                                world.removeBattleLinkers(dirty, { 'player_id': dirty.players[player_index].id });
                
                
                                //socket.emit('launched_data');
                
                
                                socket.emit('view_change_data', { 'view': 'galaxy' });
                
                                await map.updateMap(socket, dirty);
                
                                await world.setPlayerMoveDelay(socket, dirty, player_index);


                                return true;
                            }
                            
                        }
                    }
                    
                    else {
                        log(chalk.yellow("Could not find the galaxy coord that the ship is on. Placing randomly in galaxy"));

                        // We gotta randomly place it SOMEWHERE!!!!
                        let max_tries = 50;
                        let current_tries = 1;
                        let placed_ship = false;
    
                        while(!placed_ship && current_tries < max_tries) {
                            current_tries++;
                            let random_x = Math.floor(Math.random() * 20);
                            let random_y = Math.floor(Math.random() * 20);
    
                            let coord_data = { 'tile_x': random_x, 'tile_y': random_y};
                            let coord_index = await main.getCoordIndex(coord_data);
    
                            let can_place_result = await player.canPlace(dirty, 'galaxy', dirty.coords[coord_index], player_index);
                            //let can_place_result = await main.canPlace('galaxy', dirty.coords[coord_index], 'player', dirty.players[player_index].id);
                            if(can_place_result) {
                                placed_ship = true;
                                console.log("Found galaxy coord to place player's ship on! (index: " + coord_index + " id: " +
                                    dirty.coords[coord_index].id + " tile_x: " + dirty.coords[coord_index].tile_x +
                                    " tile_y: " + dirty.coords[coord_index].tile_y);
    
                                dirty.objects[player_ship_index].coord_id = dirty.coords[coord_index].id;
                                dirty.objects[player_ship_index].coord_index = coord_index;
                                dirty.objects[player_ship_index].has_change = true;
                                let coord_data = { 'coord_index': coord_index, 'object_id': dirty.objects[player_ship_index].id };
                                await main.updateCoordGeneric(socket, coord_data);
    
                                ship_galaxy_coord_index = coord_index;
    
                            }
                        }
                        return false;
                    }


                    
                }

                // OK LETS REDO THE STUPID SCENARIOS
                // 1. Our current ship is docked at another ship
                // 2. It's just us and our ship, change the view


                // 1. OUR SHIP IS DOCKED
                // TODO REDO THIS WITH world.getOpenCoordIndex
                if(dirty.objects[player_ship_index].docked_at_object_id) {
                    //console.log("Launching FROM docked ship. Docked ship is on galaxy coord id: " + dirty.coords[ship_galaxy_coord_index].id);

                    let found_galaxy_coord = false;

                    console.time("getOpenCoordIndex");
                    let placing_galaxy_coord_index = await world.getOpenCoordIndex(dirty, 'galaxy', ship_galaxy_coord_index, 'player', player_index, 2);
                    console.timeEnd("getOpenCoordIndex");
    
                    if(placing_galaxy_coord_index !== -1) {
                        found_galaxy_coord = true;
                    } else {
                        console.time("getOpenCoordIndexLonger");
                        placing_galaxy_coord_index = await world.getOpenCoordIndex(dirty, 'galaxy', ship_galaxy_coord_index, 'player', player_index, 4);
                        console.timeEnd("getOpenCoordIndexLonger");
    
                        if(placing_galaxy_coord_index !== -1) {
                            found_galaxy_coord = true;
                        }
                    }
    

                    /* Keeping for a tiny bit (0.2.36) just incase there's some weird bug with the new way above
                    let tile_x_start = dirty.coords[ship_galaxy_coord_index].tile_x - 2;
                    let tile_y_start = dirty.coords[ship_galaxy_coord_index].tile_y - 2;
                    let tile_x_end = tile_x_start + 3;
                    let tile_y_end = tile_y_start + 3;

                    //console.log("Checking coords: " + tile_x_start + "," + tile_y_start + " to " + tile_x_end + "," + tile_y_end);

                    let placing_galaxy_coord_index = -1;
                    
                    for(let i = tile_x_start; i < tile_x_end; i++) {
                        for(let j = tile_y_start; j < tile_y_end; j++) {
                            if(!found_galaxy_coord) {

                                let possible_coord_index = await main.getCoordIndex({'tile_x': i, 'tile_y': j});

                                if(possible_coord_index !== -1) {

                                    let can_place_result = await player.canPlace(dirty, 'galaxy', dirty.coords[possible_coord_index], player_index);
                                    //let can_place_result = await main.canPlace('galaxy', dirty.coords[possible_coord_index], 'player', dirty.players[player_index].id);
                                    //console.log("Can place result: " + can_place_result);
                                    if(can_place_result === true) {
                                        placing_galaxy_coord_index = possible_coord_index;
                                        //console.log("Found a galaxy coord to place the player at. ID: " + dirty.coords[placing_galaxy_coord_index].id);
                                        found_galaxy_coord = true;
                                    }
                                }


                            }
                        }
                    }
                    */

                    if(!found_galaxy_coord) {
                        socket.emit('chat', { 'scope': 'system', 'message': 'The space around the ship you are docked at is currently full' });
                        console.timeEnd("switchToGalaxy");
                        return false;
                    }


                    socket.leave("ship_" + dirty.objects[ship_index].id);


                    socket.join('galaxy');

                    dirty.players[player_index].on_ship_id = false;
                    dirty.players[player_index].previous_ship_coord_id = false;
                    dirty.players[player_index].ship_coord_id = false;
                    dirty.players[player_index].ship_coord_index = -1;
                    dirty.players[player_index].coord_id = dirty.coords[placing_galaxy_coord_index].id;
                    dirty.players[player_index].coord_index = placing_galaxy_coord_index;
                    dirty.players[player_index].planet_coord_id = false;
                    dirty.players[player_index].planet_coord_index = -1;
                    dirty.players[player_index].has_change = true;

                    dirty.objects[player_ship_index].coord_id = dirty.coords[placing_galaxy_coord_index].id;
                    dirty.objects[player_ship_index].coord_index = placing_galaxy_coord_index;
                    dirty.objects[player_ship_index].docked_at_object_id = false;
                    dirty.objects[player_ship_index].has_change = true;
                    await game_object.sendInfo(socket, "galaxy", dirty, player_ship_index, 'movement.switchToGalaxy');


                    await main.updateCoordGeneric(socket, { 'ship_coord_index':ship_coord_index, 'player_id': false });
                    await game_object.place(socket, dirty, { 'object_index': player_ship_index, 'coord_index': placing_galaxy_coord_index });
                    //await main.updateCoordGeneric(socket, { 'coord_index': placing_galaxy_coord_index, 'player_id': socket.player_id,
                    //    'object_id': dirty.players[player_index].ship_id});
                    await player.sendInfo(socket, "galaxy", dirty, dirty.players[player_index].id);
                    await player.sendInfo(socket, "ship_" + dirty.ship_coords[ship_coord_index].ship_id, dirty, dirty.players[player_index].id);


                    socket.emit('view_change_data', { 'view': 'galaxy' });

                    await map.updateMap(socket, dirty);


                }
                // Just back to the galaxy view from our ship (not docked on anything)
                else {
                    //console.log("PLAIN LAUNCH!");
                    
                    dirty.players[player_index].on_ship_id = false;
                    dirty.players[player_index].previous_ship_coord_id = dirty.players[player_index].ship_coord_id;
                    dirty.players[player_index].ship_coord_id = false;
                    dirty.players[player_index].ship_coord_index = -1;
                    dirty.players[player_index].coord_id = dirty.coords[ship_galaxy_coord_index].id;
                    dirty.players[player_index].coord_index = ship_galaxy_coord_index;
                    dirty.players[player_index].planet_coord_id = false;
                    dirty.players[player_index].planet_coord_index = -1;
                    dirty.players[player_index].has_change = true;


                    await main.updateCoordGeneric(socket, { 'ship_coord_index':ship_coord_index, 'player_id': false });
                    await main.updateCoordGeneric(socket, { 'coord_index': ship_galaxy_coord_index, 'player_id': socket.player_id
                    });
                    await player.sendInfo(socket, "galaxy", dirty, dirty.players[player_index].id);
                    await player.sendInfo(socket, "ship_" + dirty.ship_coords[ship_coord_index].ship_id, dirty, dirty.players[player_index].id);


                    socket.join('galaxy');
                    socket.leave("ship_" + dirty.objects[ship_index].id);
                    socket.emit('view_change_data', { 'view': 'galaxy' });

                    await map.updateMap(socket, dirty);
                }

            }
            /// EHH???? Switch to galaxy from... galaxy?
            else {
                
                await switchToShip(socket, dirty);
                await switchToGalaxy(socket, dirty, player_index);
            }

            //console.timeEnd("switchToGalaxy");



        } catch(error) {
            log(chalk.red("Error switching to galaxy: " + error));
            console.error(error);
        }


    }

    exports.switchToGalaxy = switchToGalaxy;

    async function switchToGalaxyNpc(dirty, npc_index) {

        try {
            console.log("NPC Launching from the ship or planet its on");


            let coord_index = -1;

            if(dirty.npcs[npc_index].planet_coord_id) {
                let planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.npcs[npc_index].planet_coord_id });
                let planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.planet_coords[planet_coord_index].planet_id });
                coord_index = await main.getCoordIndex({ 'coord_id': dirty.planets[planet_index].coord_id });

            } else if(dirty.npcs[npc_index].ship_coord_id) {
                let ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.npcs[npc_index].ship_coord_id });
                let ship_index = await game_object.getIndex(dirty, dirty.ship_coords[ship_coord_index].ship_id);
                coord_index = await main.getCoordIndex({ 'coord_id': dirty.objects[ship_index].coord_id });
            }

            if(coord_index === -1) {
                log(chalk.yellow("Failed to launch"));
                return false;
            }

            await warpTo(false, dirty, { 'npc_index': npc_index, 'warping_to': 'galaxy', 'base_coord_index': coord_index });


            return true;

        } catch(error) {
            log(chalk.red("Error in movement.switchToPlaner: " + error));
            console.error(error);
        }


    }

    exports.switchToGalaxyNpc = switchToGalaxyNpc;


    async function switchToShip(socket, dirty) {
        try {


            if(typeof socket.player_index === "undefined") {
                log(chalk.yellow("Socket doesn't have player index yet"));
                return false;
            }
            let player_index = socket.player_index;
            let ship_index = await game_object.getIndex(dirty, dirty.players[player_index].ship_id);

            //console.log("socket.player_index: " + player_index);
            //console.log("player's ship_id: " + dirty.players[player_index].ship_id + " Got ship_index as: " + ship_index);

            if(ship_index === -1) {
                log(chalk.yellow("Could not find ship in objects"));
                return false;
            }

            if(player_index === -1) {
                log(chalk.yellow("Could not find player"));
                return false;
            }

            // see if we can place the player where they were previously on the ship
            //console.log("Trying to find ship coord with this player on it already");
            let ship_coord_index = -1;
            if(dirty.players[player_index].previous_ship_coord_id) {
                ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.players[player_index].previous_ship_coord_id });
            }


            //console.log("ship_coord_index: " + ship_coord_index);

            // well - lets find one then
            if(ship_coord_index === -1) {
                console.log("Did not find such a coord. Finding something on ship id: " + dirty.objects[ship_index].id + " where object_type_id == false");

                if(typeof dirty.objects[ship_index].airlock_index === 'undefined') {
                    log(chalk.yellow("Ship has undefined airlock index. Trying to get ship coords"));
                    await main.getShipCoords(ship_index);
                }

                // try and place around the airlock if the ship has one
                if(typeof dirty.objects[ship_index].airlock_index !== 'undefined' && dirty.objects[ship_index].airlock_index !== -1) {

                    //console.log("Ship has an airlock: " + dirty.objects[ship_index].airlock_index);

                    ship_coord_index = await world.getOpenCoordIndex(dirty, 'ship', dirty.objects[ship_index].airlock_index, 'player', player_index, 2);

                } 
                // otherwise, we just try and place anywhere
                else {

                    for(let i = 0; i < dirty.ship_coords.length && ship_coord_index === -1; i++) {

                        if(dirty.ship_coords[i] && dirty.ship_coords[i].ship_id === dirty.objects[ship_index].id) {
    
    
                            let can_place_result = await player.canPlace(dirty, 'ship', dirty.ship_coords[i], player_index);
    
                            if(can_place_result === true) {
                                ship_coord_index = i;
                            }
    
                            /*
                            Removed in favor of using player.canPlace. Leaving for an update or two just incase I notice some changes. 0.1.17
                            // If there's nothing there, we can place the player
                            if(!dirty.ship_coords[i].object_type_id && !dirty.ship_coords[i].player_id && !dirty.ship_coords[i].monster_id && 
                                !dirty.ship_coords[i].npc_id) {
                                ship_coord_index = i;
                            } else if(dirty.ship_coords[i].object_type_id) {
    
                                // See if this is something we can walk on
                                let coord_object_type_index = main.getObjectTypeIndex(dirty.ship_coords[i].object_type_id);
                                if(coord_object_type_index !== -1 && dirty.object_types[coord_object_type_index].can_walk_on) {
                                    ship_coord_index = i;
                                }
    
                            }
                            */
    
                        }
    
                    }
                }


            }

            if(ship_coord_index !== -1) {


                // get the galaxy coord that the player was on
                let coord_index = dirty.coords.findIndex(function(obj) { return obj && obj.player_id === dirty.players[player_index].coord_id; });

                if(coord_index !== -1) {
                    await main.updateCoordGeneric(socket, { 'coord_index': coord_index, 'player_id': false });
                    socket.leave('galaxy');
                }

                await main.updateCoordGeneric(socket, { 'ship_coord_index': ship_coord_index, 'player_id': socket.player_id });

                socket.map_needs_cleared = true;




                dirty.players[player_index].ship_coord_id = dirty.ship_coords[ship_coord_index].id;
                dirty.players[player_index].ship_coord_index = ship_coord_index;
                dirty.players[player_index].has_change = true;

                socket.join("ship_" + dirty.ship_coords[ship_coord_index].ship_id);

                await player.sendInfo(socket, "ship_" + dirty.ship_coords[ship_coord_index].ship_id, dirty, dirty.players[player_index].id);
                // Players in the galaxy need to know that the player isn't in the galaxy anymore too
                await player.sendInfo(socket, "galaxy", dirty, dirty.players[player_index].id);


                socket.emit('view_change_data', { 'view': 'ship'});
                await map.updateMap(socket, dirty);




            } else {
                console.log("Unable to find ship coord to place player on");
            }



        } catch(error) {
            log(chalk.red("Error switching to ship view in movement.switchToShip: " + error));
            console.error(error);
        }


    }

    exports.switchToShip = switchToShip;


    async function switchToVirtual(socket, dirty) {
        try {

            if(typeof socket.player_index === "undefined") {
                log(chalk.yellow("Socket doesn't have player index yet"));
                return false;
            }

            // If we don't have an virtual coords yet, lets make a grid of them!
            if(dirty.virtual_coords.length === 0) {
                console.log("No virtual coords yet. Making some");
                for(let x = 0; x < 10; x++) {
                    for(let y = 0; y < 10; y++) {

                        dirty.virtual_coords.push({ 'tile_x': x, 'tile_y': y, 'floor_type_id': 73 });

                    }
                }
            }

            console.log("Going to place on a virtual coord");
            let placing_coord_index = -1;
            // Place on a random virtual coord
            for(let i = 0; i < dirty.virtual_coords.length && placing_coord_index === -1; i++) {
                if(dirty.virtual_coords[i] && !dirty.virtual_coords[i].player_id && !dirty.virtual_coords[i].monster_id) {
                    placing_coord_index = i;
                }
            }

            if(placing_coord_index === -1) {
                log(chalk.yellow("Failed to place player"));
                return false;
            }

            dirty.players[socket.player_index].virtual_coord_id = dirty.virtual_coords[placing_coord_index].id;
            dirty.players[socket.player_index].virtual_coord_index = placing_coord_index;

            socket.join("virtual");

            await player.sendInfo(socket, "virtual", dirty, dirty.players[socket.player_index].id);

            socket.emit('view_change_data', { 'view': 'virtual'});
            await map.updateMap(socket, dirty);
            

        } catch(error) {
            log(chalk.red("Error in movement.switchToVirtual: " + error));
            console.error(error);
        }
    }

    exports.switchToVirtual = switchToVirtual;


    // Takes a ship, and docks it at the one Azure planet we have
    async function warpShipToAzurePlanet(socket, dirty, ship_id) {

        try {

            if(typeof socket.player_index === "undefined") {
                log(chalk.yellow("Socket is not associated with a player"));
                return false;
            }

            console.log("In warpShipToAzurePlanet");

            let ship_index = await game_object.getIndex(dirty, ship_id);

            if(ship_index === -1) {
                log(chalk.yellow("Could not find ship"));
                return false;
            }

            let object_type_index = main.getObjectTypeIndex(dirty.objects[ship_index].object_type_id);

        
            if(dirty.objects[ship_index].object_type_id === 114) {
                log(chalk.yellow("Cannot warp pods to Azure planet"));
                return false;
            }

            if(dirty.object_types[object_type_index].is_dockable) {
                log(chalk.yellow("Dockable ships cannot dock at the Azure planet"));
                return false;
            }

            if(!socket.is_admin && dirty.objects[ship_index].player_id !== dirty.players[socket.player_index].id) {
                log(chalk.yellow("Ship does not belong to the player"));
                return false;
            }

            if(dirty.objects[ship_index].id === dirty.players[socket.player_index].ship_id) {
                log(chalk.yellow("Can't warp the ship you are currently in"));
                return false;
            }

            let azure_planet_index = dirty.planets.findIndex(function(obj) { return obj && obj.planet_type_id === 16; });
            let coord_index = await main.getCoordIndex({ 'coord_id': dirty.objects[ship_index].coord_id });

            dirty.objects[ship_index].docked_at_planet_id = dirty.planets[azure_planet_index].id;
            dirty.objects[ship_index].coord_id = false;
            dirty.objects[ship_index].coord_index = -1;
            dirty.objects[ship_index].has_change = true;
            game_object.sendInfo(socket, "galaxy", dirty, ship_index);

            await main.updateCoordGeneric(socket, { 'coord_index': coord_index, 'object_id': false });




        } catch(error) {
            log(chalk.red("Error in movement.warpShipToAzurePlanet: " + error));
            console.error(error);
        }

    }

    exports.warpShipToAzurePlanet = warpShipToAzurePlanet;


    // Currently I think this is basically just used for dying, and launching from a planet

    /**
     * @param {Object} socket
     * @param {Object} dirty
     * @param {Object} data
     * @param {number=} data.player_index
     * @param {number=} data.npc_index
     * @param {number=} data.player_id
     * @param {number=} data.npc_id
     * @param {String} data.warping_to
     * @param {number=} data.warping_to_id
     * @param {number=} data.planet_id
     * @param {number=} data.base_coord_index
     */
    async function warpTo(socket, dirty, data) {

        try {

            let new_room = "";
            let npc_index = -1;
            let old_room = "";
            let player_index = -1;
            let placing_type = '';
            let placing_id = 0;
            let placing_thing;
            let placing_socket = {};
            let placing_data = {};
            let removing_data = {};

            if(typeof data.player_index !== 'undefined') {
                player_index = data.player_index;
                placing_type = 'player';
            } else if(data.player_id) {
                player_index = await player.getIndex(dirty, { 'player_id': data.player_id });

                if(player_index === -1) {
                    log(chalk.yellow("Could not find player"));
                    return -1;
                }
                placing_type = 'player';
            }

            if(typeof data.npc_index !== 'undefined') {
                npc_index = data.npc_index;
                placing_type = 'npc';
            } else if(data.npc_id) {
                npc_index = await npc.getIndex(dirty, data.npc_id);

                if(npc_index === -1) {
                    log(chalk.yellow("Could not find npc"));
                    return -1;
                }
                placing_type = 'npc';
            }

            if(placing_type === 'player') {

                placing_thing = dirty.players[player_index];
                placing_id = dirty.players[player_index].id;
                placing_data.player_id = placing_id;
                removing_data.player_id = false;

                // Get the player's socket
                placing_socket = await world.getPlayerSocket(dirty, player_index);

            } else if(placing_type === 'npc') {

                placing_thing = dirty.npcs[npc_index];
                placing_id = dirty.npcs[npc_index].id;
                placing_data.npc_id = placing_id;
                removing_data.npc_id = false;


            }

            if(typeof data.base_coord_index !== 'undefined' && data.base_coord_index === -1) {
                log(chalk.yellow("Warning: Invalid base_coord_index passed into movement.warpTo"));
                console.trace("Here");
                return -1;
            }


            /************** FIND A DESTINATION BEFORE DOING ALL THE UPDATING ******************/
            let destination_coord_index = -1;

            if(data.warping_to === 'spaceport') {

                if(!data.planet_id) {
                    log(chalk.yellow("If warping to a spaceport, must include planet_id in data"));
                    return -1;
                }
                // Go through planet coords, trying to find a spaceport tile on this planet we can land on
                for(let i = 0; i < dirty.planet_coords.length && destination_coord_index === -1; i++) {
                    if(dirty.planet_coords[i] && dirty.planet_coords[i].planet_id === data.planet_id && dirty.planet_coords[i].floor_type_id === 11) {
                    
                        let can_place_result = false;
                        if(placing_type === 'player') {
                            //console.log("Seeing if we can place player there");

                            can_place_result = await player.canPlace(dirty, 'planet', dirty.planet_coords[i], player_index);

                        } else if(placing_type === 'npc') {
                            can_place_result = await npc.canPlace(dirty, 'planet', dirty.planet_coords[i], placing_id);
                        }

                        if(can_place_result) {
                            destination_coord_index = i;
                            placing_data.planet_coord_index = i;
                            new_room = "planet_" + dirty.planet_coords[i].planet_id;
                        }
                    }
                }

            } else if(data.warping_to === 'galaxy') {

                // No base coord index - lets just get a random one
                if(typeof data.base_coord_index === 'undefined') {

                    let found_coord = false;
                    let max_tries = 20;
                    let current_tries = 1;

                    while(!found_coord && current_tries < max_tries) {
                        current_tries++;

                        let random_galaxy_x = helper.getRandomIntInclusive(1, 40);
                        let random_galaxy_y = helper.getRandomIntInclusive(1, 40);

                        let coord_data = { 'tile_x': random_galaxy_x, 'tile_y': random_galaxy_y};
                        let coord_index = await main.getCoordIndex(coord_data);
                        let can_place_result = false;
                        if(placing_type === 'player') {

                            can_place_result = await player.canPlace(dirty, 'galaxy', dirty.coords[coord_index], player_index);
                        } else if(placing_type === 'npc') {
                            can_place_result = await npc.canPlace(dirty, 'galaxy', dirty.coords[coord_index], placing_id);
                        }

                        if(can_place_result) {
                            found_coord = true;
                            destination_coord_index = coord_index;
                            placing_data.coord_index = coord_index;
                            new_room = "galaxy";
                        }
                    }

                } else {
                    // We have a base coord index - lets try and find a coord around it
                    let tile_x_start = dirty.coords[data.base_coord_index].tile_x - 1;
                    let tile_y_start = dirty.coords[data.base_coord_index].tile_y - 1;
                    let tile_x_end = tile_x_start + 2;
                    let tile_y_end = tile_y_start + 2;


                    let found_galaxy_coord = false;
                    for(let i = tile_x_start; i < tile_x_end; i++) {
                        for(let j = tile_y_start; j < tile_y_end; j++) {
                            if(!found_galaxy_coord) {

                                let coord_index = await main.getCoordIndex({'tile_x': i, 'tile_y': j});

                                if(coord_index !== -1) {

                                    let can_place_result = false;

                                    if(placing_type === 'player') {

                                        can_place_result = await player.canPlace(dirty, 'galaxy', dirty.coords[coord_index], player_index);
                                    } else if(placing_type === 'npc') {
                                        can_place_result = await npc.canPlace(dirty, 'galaxy', dirty.coords[coord_index], placing_id);
                                    }

                                    if(can_place_result) {
                                        destination_coord_index = coord_index;
                                        found_galaxy_coord = true;
                                        placing_data.coord_index = coord_index;
                                        new_room = "galaxy";
                                    }
                                }


                            }
                        }
                    }
                }

                if(destination_coord_index === -1) {
                    log(chalk.yellow("No destination_coord_index found in galaxy"));
                    return -1;
                }

                // We're going to be placing the player's ship too
                if(placing_type === 'player') {
                    placing_data.object_id = dirty.players[player_index].ship_id;
                }



            } else if(data.warping_to === 'npc') {

                console.log("Warping to npc!!!");

                let warping_to_npc_index = await npc.getIndex(dirty, data.warping_to_id);

                if(warping_to_npc_index === -1) {
                    log(chalk.yellow("Could not find the npc we are warping to"));
                    return false;
                }

                // lets start looking at coords around the npc
                if(dirty.npcs[warping_to_npc_index].planet_coord_id) {

                    

                    
                    let base_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.npcs[warping_to_npc_index].planet_coord_id });

                    if(base_coord_index === -1) {
                        log(chalk.yellow("Could not find the planet coord the npc is on"));
                        return false;
                    }

                    console.time("warpToNpc");
                    if(placing_type === 'player') {
                        destination_coord_index = await world.getOpenCoordIndex(dirty, 'planet', base_coord_index, 'player', player_index, 2);
                    } else if(placing_type === 'npc') {
                        destination_coord_index = await world.getOpenCoordIndex(dirty, 'planet', base_coord_index, 'npc', npc_index);
                    }
                    console.timeEnd("warpToNpc");



                    if(destination_coord_index !== -1) {
                        placing_data.coord_index = destination_coord_index;
                        new_room = "planet_" + dirty.planet_coords[base_coord_index].planet_id;
                    }


                } else {
                    log(chalk.yellow("Havent' coded warping to npc in galaxy/ship yet"));
                    return false;
                }

            }


            if(destination_coord_index === -1) {
                log(chalk.yellow("Was unable to find a destination coord"));
                return -1;
            }


            /************* REMOVE FROM PREVIOUS LOCATION *****************/

            if(placing_thing.coord_id) {

                let old_room = "galaxy";

                let previous_coord_index = await main.getCoordIndex({ 'coord_id': placing_thing.coord_id });
                removing_data.coord_index = previous_coord_index;

                if(placing_type === 'player') {

                    // We only want to remove the ship from the coord if it is OUR ship
                    if(dirty.coords[previous_coord_index].object_id && dirty.coords[previous_coord_index].object_id === placing_thing.ship_id) {
                        removing_data.object_id = false;
                    }


                    // I don't think we actually need to set the previous coord id here
                    //placing_thing.previous_coord_id = placing_thing.coord_id;

                    // I'm not sure I need to be messing with previous_ things at all.
                    //placing_thing.previous_coord_id = false;
                    //placing_thing.previous_ship_coord_id = false;

                }

                placing_thing.coord_id = false;

            } else if(placing_thing.planet_coord_id) {

                let previous_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': placing_thing.planet_coord_id});

                old_room = "planet_" + dirty.planet_coords[previous_coord_index].planet_id;
                removing_data.planet_coord_index = previous_coord_index;

                placing_thing.planet_coord_id = false;

            } else if(placing_thing.ship_coord_id) {

                // If we were on a ship that isn't our current ship, we'll be removed from that coord as well (in a case like being docked at a ship
                // and then launching from it
                let leaving_ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': placing_thing.ship_coord_id });
                let leaving_ship_index = await game_object.getIndex(dirty, dirty.ship_coords[leaving_ship_coord_index].ship_id);
                if(dirty.objects[leaving_ship_index].id !== placing_thing.ship_id) {

                    old_room = "ship_" + dirty.objects[leaving_ship_index].id;

                    removing_data.ship_coord_index = leaving_ship_coord_index;
                    placing_thing.ship_coord_id = false;

                }

            }
            placing_thing.has_change = true;

            await main.updateCoordGeneric(placing_socket, removing_data);


            // Remove battle linkers
            if(placing_type === 'player') {
                world.removeBattleLinkers(dirty, { 'player_id': dirty.players[player_index].id });
            } else if(placing_type === 'npc') {
                world.removeBattleLinkers(dirty, { 'npc_id': dirty.npcs[npc_index].id });
            }


            // Remove repairs
            for(let i = 0; i < dirty.repairing_linkers.length; i++) {
                if(dirty.repairing_linkers[i]) {
                    if(placing_type === 'player' && dirty.repairing_linkers[i].player_id === placing_id) {

                        if(placing_socket) {
                            placing_socket.emit('repairing_linker_info', { 'remove': true, 'repairing_linker': dirty.repairing_linkers[i] });
                        }
                        delete dirty.repairing_linkers[i];
                    }
                }
            }



            /************** PLACE AT NEW LOCATION ********************/
            if(data.warping_to === 'galaxy') {
                await main.updateCoordGeneric(socket, placing_data);
                placing_thing.coord_id = dirty.coords[destination_coord_index].id;
                placing_thing.has_change = true;

                if(helper.notFalse(socket)) {
                    socket.emit('view_change_data', { 'view': 'galaxy' });
                }

                // I believe we need to place the player's ship here too
                if(placing_type === 'player') {
                    log(chalk.cyan("Worried about this. Placing the ship there too!"));
                    game_object.place(socket, dirty, { 'object_index': dirty.players[player_index].ship_index, 'coord_index': destination_coord_index });
                }
                
            } else if(data.warping_to === 'spaceport') {
                await main.updateCoordGeneric(socket, placing_data);
                placing_thing.planet_coord_id = dirty.planet_coords[destination_coord_index].id;
                placing_thing.has_change = true;
                socket.emit('clear_map');
                map.updateMap(socket, dirty);


            } else if(data.warping_to === 'npc') {
                await main.updateCoordGeneric(socket, placing_data);
                placing_thing.planet_coord_id = dirty.planet_coords[destination_coord_index].id;
                placing_thing.has_change = true;
                socket.emit('clear_map');
                map.updateMap(socket, dirty);
            }

            if(old_room !== new_room && helper.notFalse(placing_socket)) {
                placing_socket.leave(old_room);
                placing_socket.join(new_room);
            }

            // We have to send the updated things info
            if(placing_type === 'player') {
                io.to(old_room).emit('player_info', { 'player': placing_thing });
                io.to(new_room).emit('player_info', { 'player': placing_thing });
            } else if(placing_type === 'npc') {
                io.to(old_room).emit('npc_info', { 'npc': placing_thing });
                io.to(new_room).emit('npc_info', { 'npc': placing_thing });
            }

            // Set the new room
            placing_thing.room = new_room;


            return destination_coord_index;

        } catch(error) {
            log(chalk.red("Error in movement.warpTo: " + error));
            console.error(error);
        }
    }

    exports.warpTo = warpTo;


    module.exports = {
        move,
        moveGalaxy,
        moveGalaxyOld,
        moveGalaxyNpc,
        moveGalaxyObjects,
        movePlanetNpc,
        switchToGalaxy,
        switchToGalaxyNpc,
        switchToPlanet,
        switchToShip,
        warpShipToAzurePlanet,
        warpTo
    }