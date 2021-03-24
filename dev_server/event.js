var io_handler = require('./io.js');
var io = io_handler.io;
var database = require('./database.js');
var pool = database.pool;
const { Worker, isMainThread, parentPort } = require('worker_threads');
const chalk = require('chalk');
const log = console.log;

//const game = require('./game.js');
const game_object = require('./game_object.js');
const helper = require('./helper.js');
const monster = require('./monster.js');
const main = require('./space_abyss' + process.env.FILE_SUFFIX + '.js');
const npc = require('./npc.js');
const planet = require('./planet.js');
const world = require('./world.js');
const player = require('./player.js');



// Check to see if a spawned event should be deleted
/**
 * @param {Object} dirty
 * @param {number} spawned_event_id
 * @param {Object} data
 * @param {String=} data.reason - (deleteobject, deletemonster)
 * @param {String=} data.reason_type - Type that caused this to happen - usually player
 * @param {number=} data.reason_id - ID of the 
 * 
 */
async function checkSpawnedEvent(dirty, spawned_event_id, data = {}) {

    try {

        spawned_event_id = parseInt(spawned_event_id);

        let spawned_event_index = dirty.spawned_events.findIndex(function(obj) { return obj && obj.id === spawned_event_id; });

        if(spawned_event_index === -1) {
            console.log("Didn't find index. Think we already deleted this");
            return false;
        }


        let event_index = getIndex(dirty, dirty.spawned_events[spawned_event_index].event_id);


        //console.log("Event despawn condition: " + dirty.events[event_index].despawn_condition);


        // See if there are any objects or monsters left with this spawned event id
        let objects = dirty.objects.filter(object => object.spawned_event_id === spawned_event_id);
        let monsters = dirty.monsters.filter(monster_filter => monster_filter.spawned_event_id === spawned_event_id);

        let should_delete_spawned_event = false;

        if(dirty.events[event_index].despawn_condition === 'destroy_monsters' && monsters.length === 0) {

            console.log("Set should_delete_spawned_event to true");
            should_delete_spawned_event = true;
        }

        if(objects.length === 0 && monsters.length === 0) {
            should_delete_spawned_event = true;
        }

        if(!should_delete_spawned_event) {
            console.log("Not deleting");
            return;
        }


        if(dirty.events[event_index].despawn_result === "disappear") {
            disappear(dirty, spawned_event_index, event_index);
            return;
        }

        // Not sure why we were putting this here
        //let spawned_event_index = dirty.spawned_events.findIndex(function(obj) { return obj && obj.id === spawned_event_id; });

        //console.log("Deleting");

        let delete_spawned_event_data = {};
        if(typeof data.reason_type !== 'undefined') {
            delete_spawned_event_data.reason_type = data.reason_type;
        }

        if(typeof data.reason_id !== 'undefined') {
            delete_spawned_event_data.reason_id = data.reason_id;
        }

        //console.log("delete_spawned_event_data:");
        //console.log(delete_spawned_event_data);

        await deleteSpawnedEvent(dirty, spawned_event_index, delete_spawned_event_data);

        return;


        //log(chalk.magenta("Deleting spawned event id: " + spawned_event_id + " event name: "
        //    + dirty.events[event_index].name + " objects/monsters" + objects.length + "/" + monsters.length));
        // We can delete the spawned event
        /*
        (pool.query("DELETE FROM spawned_events WHERE id = ?", [spawned_event_id]));

        if(spawned_event_index !== -1) {
            delete dirty.spawned_events[spawned_event_index];
        }
        */


    } catch(error) {
        log(chalk.red("Error in event.checkSpawnedEvent: " + error));
        console.error(error);
    }



}

exports.checkSpawnedEvent = checkSpawnedEvent;

/**
 * @param {Object} dirty
 * @param {number} spawned_event_index
 * @param {Object=} data
 * @param {String=} data.reason_type - type that caused this. Generally a player
 * @param {String=} data.reason_id - id of the type (generally a player id)
 */
async function deleteSpawnedEvent(dirty, spawned_event_index, data = {}) {

    try {

        if(!dirty.spawned_events[spawned_event_index]) {
            log(chalk.yellow("Trying to delete a spawned event that we can't find!"));
            return false;
        }

        let event_index = getIndex(dirty, dirty.spawned_events[spawned_event_index].event_id);

        if(event_index === -1) {
            log(chalk.yellow("Could not find event for spawned event id: " + dirty.spawned_events[spawned_event_index].id));
            return false;
        }

        // TODO we do need a way to force the despawn for old/out of date spawned events
        if(dirty.events[event_index].despawn_result === 'disappear') {
            disappear(dirty, spawned_event_index, event_index);
            return;
        }


        //console.log("Despawning spawned event id: " + dirty.spawned_events[spawned_event_index].id);

        // Remove spawned objects - We skip the check spawned event check because... WE ARE ALREADY DELETING THE SPAWNED EVENT!
        for(let i = 0; i < dirty.objects.length; i++) {
            if(dirty.objects[i] && dirty.objects[i].spawned_event_id === dirty.spawned_events[spawned_event_index].id) {
                await game_object.deleteObject(dirty, { 'object_index': i, 'reason': 'Deleting Spawned Event', 'skip_check_spawned_event': true });

            }
        }

        // Remove spawned monsters - We skip the check spawned event check because... WE ARE ALREADY DELETING THE SPAWNED EVENT!
        for(let i = 0; i < dirty.monsters.length; i++) {
            if(dirty.monsters[i] && dirty.spawned_events[spawned_event_index] && dirty.monsters[i].spawned_event_id === dirty.spawned_events[spawned_event_index].id) {
                await monster.deleteMonster(dirty, i, { 'reason': 'Deleting Spawned Event', 'skip_check_spawned_event': true });
            }
        }



        // Event linkers can drop things when they despawn.
        // Events can 'give' object types when they despawn. Lets see if that is going to happen

        // Various event linkers are going to have drops, get our base tile_x, tile_y
        let origin_tile_x = 0;
        let origin_tile_y = 0;
        let origin_coord_index = -1;

        if(dirty.spawned_events[spawned_event_index].origin_planet_coord_id) {
            origin_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.spawned_events[spawned_event_index].origin_planet_coord_id });
            if(origin_coord_index !== -1) {
                origin_tile_x = dirty.planet_coords[origin_coord_index].tile_x;
                origin_tile_y = dirty.planet_coords[origin_coord_index].tile_y;
            }
        } else if(dirty.spawned_events[spawned_event_index].origin_ship_coord_id) {
            origin_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.spawned_events[spawned_event_index].origin_ship_coord_id });
            if(origin_coord_index !== -1) {
                origin_tile_x = dirty.ship_coords[origin_coord_index].tile_x;
                origin_tile_y = dirty.ship_coords[origin_coord_index].tile_y;
            }
        } else if(dirty.spawned_events[spawned_event_index].origin_coord_id) {
            let origin_coord_index = await main.getCoordIndex({ 'coord_id': dirty.spawned_events[spawned_event_index].origin_coord_id });
            if(origin_coord_index !== -1) {
                origin_tile_x = dirty.coords[origin_coord_index].tile_x;
                origin_tile_y = dirty.coords[origin_coord_index].tile_y;
            }
        }


        // WE PERFORM THE CONVERSION
        // In the old looping through event_linkers - we had the below in it. Conversions. and I DON'T KNOW WHY.
        //convert(false, dirty, { 'converter_object_id': dirty.planet_coords[linker_planet_coord_index].object_id,
        //    'input_type': 'object_type', 'input_object_type_id': dirty.event_linkers[e].gives_object_type_id,
        //    'input_paid': true });

        for(let e = 0; e < dirty.event_linkers[e].length; e++) {

            // We'll only be interested in event linkers associated with the event type - and for now, just the same level.
            if(dirty.event_linkers[e] && dirty.event_linkers[e].event_id === dirty.spawned_events[spawned_event_index].event_id &&
                dirty.event_linkers[e].level === 0) {



                // TODO NOW I need to factor in the rarity here and with monster drops. Find a place I'm already doing it.
                // I really guess I just gotta check all the stupid drop linkers
                let drop_linkers = dirty.drop_linkers.filter(drop_linker => drop_linker.event_linker_id === dirty.event_linkers[e].id);
                if(drop_linkers.length > 0) {

                    let event_linker_tile_x = origin_tile_x + dirty.event_linkers[e].position_x;
                    let event_linker_tile_y = origin_tile_y + dirty.event_linkers[e].position_y;


                    // get a random drop linker - and it will drop that
                    let drop_linker = drop_linkers[Math.floor(Math.random() * drop_linkers.length)];
                    //console.log("Going to drop object_type_id: " + drop_linker.dropped_object_type_id);

                    if(dirty.spawned_events[spawned_event_index].origin_planet_coord_id) {

                        let event_linker_coord_index = await main.getPlanetCoordIndex({ 'planet_id': dirty.planet_coords[origin_coord_index].planet_id,
                            'planet_level': dirty.planet_coords[origin_coord_index].level, 'tile_x': event_linker_tile_x, 'tile_y': event_linker_tile_y });

                        if(drop_linker.dropped_object_type_id) {
                            if(await game_object.canPlace(dirty, 'planet',dirty.planet_coords[event_linker_coord_index],
                                { 'object_type_id': drop_linker.dropped_object_type_id })) {

                                //console.log("Monster is dropping amount: " + drop_linker.amount + " of object_type_id: " + drop_linker.dropped_object_type_id);
                                await main.updateCoordGeneric(false, { 'planet_coord_index': event_linker_coord_index, 'object_type_id': drop_linker.dropped_object_type_id,
                                    'amount': drop_linker.amount });
                            }
                        }



                    } else if(dirty.spawned_events[spawned_event_index].origin_ship_coord_id) {

                        let event_linker_coord_index = await main.getShipCoordIndex({ 'ship_id': dirty.ship_coords[origin_coord_index].ship_id,
                            'level': dirty.ship_coords[origin_coord_index].level, 'tile_x': event_linker_tile_x, 'tile_y': event_linker_tile_y });

                        if(await game_object.canPlace(dirty, 'ship',dirty.ship_coords[event_linker_coord_index],
                            { 'object_type_id': drop_linker.dropped_object_type_id })) {
                            await main.updateCoordGeneric(false, { 'ship_coord_index': event_linker_coord_index, 'object_type_id': drop_linker.dropped_object_type_id,
                                'amount': drop_linker.amount });
                        }

                    } else if(dirty.spawned_events[spawned_event_index].origin_coord_id) {

                        let event_linker_coord_index = await main.geCoordIndex({ 'tile_x': event_linker_tile_x, 'tile_y': event_linker_tile_y });

                        if(await game_object.canPlace(dirty, 'galaxy',dirty.coords[event_linker_coord_index],
                            { 'object_type_id': drop_linker.dropped_object_type_id })) {
                            await main.updateCoordGeneric(false, { 'coord_index': event_linker_coord_index, 'object_type_id': drop_linker.dropped_object_type_id,
                                'amount': drop_linker.amount });
                        }

                    }

                }

            }
        }


        //console.log("going to check if a storyteller is associated with spawned event id: " + dirty.spawned_events[spawned_event_index].id);
        // See if this spawned event is associated with a storyteller, and if so, update the storyteller
        for(let i = 0; i < dirty.storytellers.length; i++) {
            if(dirty.storytellers[i].current_spawned_event_id === dirty.spawned_events[spawned_event_index].id) {

                console.log("The spawned event we are deleting is part of a storyteller!");
                console.log("the data that was passed in:");
                console.log(data);
                let player_log_data = { 'event_id': dirty.spawned_events[spawned_event_index].event_id};

                // If this event had a difficulty associated with it, we add a 'hero' player log
                if(dirty.events[event_index].difficulty && typeof data.reason_type !== 'undefined' && data.reason_type === 'player') {

                    
                    let player_index = await player.getIndex(dirty, { 'player_id': data.reason_id });
                    

                    let message = "The heroic " + dirty.players[player_index].name ;

                    if(dirty.spawned_events[spawned_event_index].planet_id) {
                        let planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.spawned_events[spawned_event_index].planet_id })
                        if(planet_index !== -1) {
                            message += " has saved the planet " + dirty.planets[planet_index].name;
                            player_log_data.planet_id = dirty.planets[planet_index].id;
                        }
                    }

                    if(dirty.spawned_events[spawned_event_index].event_id === 90) {
                        message += " from the bugs!";
                    } else if(dirty.spawned_events[spawned_event_index].event_id === 22) {
                        message += " from the Acid Fiend!";
                    } else {
                        message += " from the threat.";
                    }


                    world.addPlayerLog(dirty, player_index, message, player_log_data);
                    


                } else {

                    let message = "";

                    if(dirty.spawned_events[spawned_event_index].planet_id) {
                        let planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.spawned_events[spawned_event_index].planet_id })
                        if(planet_index !== -1) {
                            message += "The planet " + dirty.planets[planet_index].name;
                            player_log_data.planet_id = dirty.planets[planet_index].id;
                        }
                    }

                    if(dirty.spawned_events[spawned_event_index].event_id === 90) {
                        message += " is no longer being attacked by bugs.";
                    } else if(dirty.spawned_events[spawned_event_index].event_id === 22) {
                        message += " is no longer being attacked by an Acid Fiend.";
                    } else {
                        message +=" is no longer in danger.";
                    }


                    world.addPlayerLog(dirty, -1, message, player_log_data);
                    log(chalk.yellow("NO PLAYER FOR STORYTELLER EVENT ENDING????"));
                    console.log("Event difficulty:" + dirty.events[event_index].difficulty);
                }

                dirty.storytellers[i].current_spawned_event_id = 0;
                dirty.storytellers[i].previous_event_ticks = dirty.storytellers[i].current_event_ticks;
                dirty.storytellers[i].previous_difficulty = dirty.events[event_index].difficulty;
                dirty.storytellers[i].current_event_ticks = 0;
                dirty.storytellers[i].has_change = true;

            }
        }



        // and finally delete the spawned event
        await (pool.query("DELETE FROM spawned_events WHERE id = ?", [dirty.spawned_events[spawned_event_index].id]));
        delete dirty.spawned_events[spawned_event_index];



    } catch(error) {
        log(chalk.red("Error in event.deleteSpawnedEvent: " + error));
        console.error(error);
    }
}

exports.deleteSpawnedEvent = deleteSpawnedEvent;



async function disappear(dirty, spawned_event_index, event_index) {

    try {

        console.time("timeToDisappear");



        // I'm a bit worried that this will despawn parts of the spawned event
        // Especially ship on ship stuff
        for(let i = 0; i < dirty.objects.length; i++) {
            if(dirty.objects[i] && dirty.objects[i].spawned_event_id === dirty.spawned_events[spawned_event_index].id) {

                if(dirty.objects[i].planet_coord_id) {
                    await game_object.removeFromCoord(dirty, i);
                } else if(dirty.objects[i].ship_coord_id && dirty.spawned_events[spawned_event_index].origin_ship_coord_id) {

                    // Lets just make sure it's the same ship we are talking about to be safe
                    let origin_ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.spawned_events[spawned_event_index].origin_ship_coord_id });
                    let object_ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.objects[i].ship_coord_id });

                    if(origin_ship_coord_index !== -1 && object_ship_coord_index !== -1 && 
                        dirty.ship_coords[origin_ship_coord_index].ship_id === dirty.ship_coords[object_ship_coord_index].ship_id) {
                            await game_object.removeFromCoord(dirty, i);
                    } else {
                        log(chalk.yellow("Found an instance where we think that not checking for an identical ship would have despawned part of the event"));
                    }

                    
                } else if(dirty.objects[i].coord_id && dirty.spawned_events[spawned_event_index].origin_coord_id) {
                    await game_object.removeFromCoord(dirty, i);
                }
            }
        }

        if(dirty.spawned_events[spawned_event_index].origin_planet_coord_id) {

            dirty.spawned_events[spawned_event_index].origin_planet_coord_id = false;

        } else if(dirty.spawned_events[spawned_event_index].origin_ship_coord_id) {

            dirty.spawned_events[spawned_event_index].origin_ship_coord_id = false;

        } else if(dirty.spawned_events[spawned_event_index].origin_coord_id) {

            dirty.spawned_events[spawned_event_index].origin_coord_id = false;
        }

        dirty.spawned_events[spawned_event_index].is_despawned = true;
        dirty.spawned_events[spawned_event_index].tick_count = 1;
        dirty.spawned_events[spawned_event_index].has_change = true;

        console.timeEnd("timeToDisappear");

    } catch(error) {
        log(chalk.red("Error in event.disappear: " + error));
        console.error(error);
    }

}

exports.disappear = disappear;


function getIndex(dirty, event_id) {
    return dirty.events.findIndex(function(obj) { return obj && obj.id === parseInt(event_id); });
}

exports.getIndex = getIndex;


function getSpawnedEventIndex(dirty, spawned_event_id) {
    return dirty.spawned_events.findIndex(function(obj) { return obj && obj.id === parseInt(spawned_event_id); });
}

exports.getSpawnedEventIndex = getSpawnedEventIndex;

/**
 *
 * @param {Object} dirty
 * @param {number} event_index
 * @param {Object} data
 * @param {string=} data.scope
 * @param {number=} data.planet_coord_index
 * @param {number=} data.ship_coord_index
 * @param {number=} data.coord_index
 * @param {number=} data.planet_id
 * @param {number=} data.planet_event_linker_id 
 * @param {boolean=} data.force - Used when an admin is spawning the event. Forces us past limit checks
 * @returns {Promise<number>} spawned_event_index
 */
async function spawn(dirty, event_index, data) {

    try {

        

        let debug_event_ids = [108];

        let planet_index = -1;
        let planet_event_linker_index = -1;
        let origin_tile_x = -1;
        let origin_tile_y = -1;
        let origin_planet_level = 0;
        let origin_ship_level = 0;
        let origin_planet_coord_id = 0;
        let origin_coord_index = -1;
        let event_scope = '';
        let spawned_event_id = 0;
        let spawned_event_index = -1;


        if(event_index === -1 || !dirty.events[event_index]) {
            log(chalk.yellow("Could not find event"));
            return -1;
        }

        let event_linkers = dirty.event_linkers.filter(event_linker => event_linker.event_id === dirty.events[event_index].id);
        if(event_linkers.length === 0) {
            log(chalk.yellow("No linkers associated with event id: " + dirty.events[event_index].id));
            return -1;
        }

        if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
            console.log("In event.spawn for event id: " + dirty.events[event_index].id + " name: " + dirty.events[event_index].name);
        }



        /***** STEP 1: FIND THE ORIGIN X,Y ********/

        if(data.planet_id) {
            planet_index = await planet.getIndex(dirty, { 'planet_id': data.planet_id, 'source': 'event.spawn' });

            if(planet_index === -1) {
                if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                    console.log("Could not get the planet this event is supposed to spawn on");
                }
                return -1;
            }

            // find the planet_event_linker
            if(typeof data.planet_event_linker_id !== 'undefined') {
                planet_event_linker_index = dirty.planet_event_linkers.findIndex(function(obj) { return obj && obj.id === data.planet_event_linker_id; });
            } else {
                planet_event_linker_index = dirty.planet_event_linkers.findIndex(function(obj) {
                    return obj && obj.event_id === dirty.events[event_index].id &&
                        obj.planet_type_id === dirty.planets[planet_index].planet_type_id });
            }
            

            if(planet_event_linker_index === -1) {
                log(chalk.yellow("Could not find planet event linker"));
                return -1;
            }

            // Find possible planet coords where this can spawn at
            let possible_planet_coords = [];

            if( helper.notFalse(dirty.events[event_index].requires_floor_type_id) ) {
                if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                    console.log("Event requires a specific floor type id");
                }

                possible_planet_coords = dirty.planet_coords.filter(
                    planet_coord => planet_coord.planet_id === dirty.planets[planet_index].id &&
                        planet_coord.floor_type_id === dirty.events[event_index].requires_floor_type_id &&
                        planet_coord.level <= dirty.planet_event_linkers[planet_event_linker_index].highest_planet_level &&
                        planet_coord.level >= dirty.planet_event_linkers[planet_event_linker_index].lowest_planet_level
                );


            } else if( helper.notFalse(dirty.events[event_index].requires_floor_type_class) ) {

                if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                    console.log("Event requires a specific floor type class: " + dirty.events[event_index].requires_floor_type_class);
                }

                // get the floor types that have this class
                let class_floor_type_ids = [];
                for(let i = 0; i < dirty.floor_types.length; i++) {
                    if(dirty.floor_types[i].class === dirty.events[event_index].requires_floor_type_class) {
                        class_floor_type_ids.push(dirty.floor_types[i].id);
                    }
                }

                possible_planet_coords = dirty.planet_coords.filter(
                    planet_coord => planet_coord.planet_id === dirty.planets[planet_index].id &&
                        class_floor_type_ids.includes(planet_coord.floor_type_id) &&
                        planet_coord.level <= dirty.planet_event_linkers[planet_event_linker_index].highest_planet_level &&
                        planet_coord.level >= dirty.planet_event_linkers[planet_event_linker_index].lowest_planet_level
                );

            }

            else {


                possible_planet_coords = dirty.planet_coords.filter(
                    planet_coord => planet_coord.planet_id === dirty.planets[planet_index].id &&
                        planet_coord.level <= dirty.planet_event_linkers[planet_event_linker_index].highest_planet_level &&
                        planet_coord.level >= dirty.planet_event_linkers[planet_event_linker_index].lowest_planet_level &&
                        helper.isFalse(planet_coord.object_type_id)
                );


            }

            let origin_planet_coord = possible_planet_coords[Math.floor(Math.random() * possible_planet_coords.length)];
            origin_planet_coord_id = origin_planet_coord.id;
            //console.log("got random matching planet coord Set origin planet coord_id to: " + origin_planet_coord_id);
            origin_tile_x = origin_planet_coord.tile_x;
            origin_tile_y = origin_planet_coord.tile_y;
            origin_planet_level = origin_planet_coord.level;
            event_scope = 'planet';

            if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                console.log("Set origin planet coord id to: " + origin_planet_coord_id);
            }


        } else if(typeof data.planet_coord_index !== "undefined") {

            planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.planet_coords[data.planet_coord_index].planet_id, 'source': 'event.spawn' });
            origin_tile_x = dirty.planet_coords[data.planet_coord_index].tile_x;
            origin_tile_y = dirty.planet_coords[data.planet_coord_index].tile_y;
            origin_planet_level = dirty.planet_coords[data.planet_coord_index].level;
            origin_planet_coord_id = dirty.planet_coords[data.planet_coord_index].id;
            //console.log("had data.planet_coord_index. Set origin planet coord_id to: " + origin_planet_coord_id);
            event_scope = 'planet';

            // find the planet_event_linker
            planet_event_linker_index = dirty.planet_event_linkers.findIndex(function(obj) {
                return obj && obj.event_id === dirty.events[event_index].id &&
                    obj.planet_type_id === dirty.planets[planet_index].planet_type_id });

            if(planet_event_linker_index === -1) {
                log(chalk.yellow("Could not find planet event linker"));
                return -1;
            }


        } else if(typeof data.ship_coord_index !== "undefined") {
            origin_tile_x = dirty.ship_coords[data.ship_coord_index].tile_x;
            origin_tile_y = dirty.ship_coords[data.ship_coord_index].tile_y;
            origin_ship_level = dirty.ship_coords[data.ship_coord_index].level;

            event_scope = 'ship';
        } else if(typeof data.coord_index !== "undefined") {
            origin_tile_x = dirty.coords[data.coord_index].tile_x;
            origin_tile_y = dirty.coords[data.coord_index].tile_y;

            event_scope = 'galaxy';
            origin_coord_index = data.coord_index;
        } else if(data.scope === 'galaxy') {


            origin_tile_x = helper.getRandomIntInclusive(2,98);
            origin_tile_y = helper.getRandomIntInclusive(2,98);

            event_scope = 'galaxy';

            origin_coord_index = await main.getCoordIndex({ 'tile_x': origin_tile_x, 'tile_y': origin_tile_y });


        }

        if(origin_tile_x === -1 || origin_tile_y === -1) {
            log(chalk.yellow("Could not find origin tile"));
            return -1;
        }



        // TODO listen to the event's min and max planet level
        // TODO when we do this we need to figure out the lowest level on that particular planet
        // TODO structure_types has a multi level implementation - but it's a little odd since we move the NPC up



        // see if we are going to be able to do this event here

        let can_spawn = true;

        // make sure that we aren't exceeding the limit of the planet
        // Not 100% sure how to do this. For now just check the object or monster at 0,0 and see how many of them
        // we find
        if( event_scope === 'planet' && dirty.planet_event_linkers[planet_event_linker_index].limit_per_planet) {
            if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                console.log("Event " + dirty.events[event_index].name + " has a limit of: " +
                    dirty.planet_event_linkers[planet_event_linker_index].limit_per_planet + " on planet type id: " +
                    dirty.planets[planet_index].planet_type_id);
            }


            // see how many events with this id the planet has
            let currently_spawned = dirty.spawned_events.filter(spawned_event => spawned_event.planet_event_linker_id === dirty.planet_event_linkers[planet_event_linker_index].id &&
                spawned_event.planet_id === dirty.planets[planet_index].id && helper.isFalse(spawned_event.is_despawned));

            if(currently_spawned.length >= dirty.planet_event_linkers[planet_event_linker_index].limit_per_planet) {

                if(typeof data.force === 'undefined') {
                    can_spawn = false;

                    if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                        log(chalk.yellow("Can't spawn. Planet is at limit. Found " + currently_spawned.length + " existing events of this type"));
                    }
    
                    return -1;
                } else {
                    if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                        log(chalk.yellow("Admin is forcing spawn. Planet is at limit. Found " + currently_spawned.length + " existing events of this type"));
                    }
                }
                

            }

            //console.log("Found " + currently_spawned.length + " of that event already on the planet");

        } else if(event_scope === 'galaxy' && helper.notFalse(dirty.events[event_index].galaxy_limit)) {

            let spawned_in_galaxy_count = 0;
            for(let s = 0; s < dirty.spawned_events.length; s++) {

                if(dirty.spawned_events[s] && dirty.spawned_events[s].event_id === dirty.events[event_index].id && 
                    helper.isFalse(dirty.spawned_events[s].is_despawned)) {
                    spawned_in_galaxy_count++;
                }

            }

            if(spawned_in_galaxy_count >= dirty.events[event_index].galaxy_limit) {

                if(typeof data.force === 'undefined') {
                    if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                        log(chalk.yellow("Can't spawn. Galaxy is at limit. Found " + spawned_in_galaxy_count + " existing events of this type"));
                    }
    
                    return -1;
                } else {
                    if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                        log(chalk.yellow("Admin is forcing spawn! Galaxy is at limit. Found " + spawned_in_galaxy_count + " existing events of this type"));
                    }
                }


            }

        }



        for(let event_linker of event_linkers) {

            // we don't have to check an event linker if it's spawn_off_grid parameter is set to true
            // We spawn something like a ship off grid if it's being portaled into
            if(helper.isFalse(event_linker.spawns_off_grid)) {
                let tile_x = origin_tile_x + event_linker.position_x;
                let tile_y = origin_tile_y + event_linker.position_y;
                let tile_level = 0;
                if(event_scope === 'planet') {
                    tile_level = origin_planet_level + event_linker.level;
                } else if(event_scope === 'ship') {
                    tile_level = origin_ship_level + event_linker.level;
                }
    
    
                // If the event linker has a object, make sure we can place an object there
    
                let checking_coord_index = -1;
                let checking_coord = false;
                if(event_scope === 'planet') {
                    let planet_coord_data = { 'planet_id': dirty.planets[planet_index].id,
                        'planet_level': tile_level, 'tile_x': tile_x, 'tile_y': tile_y };
                        
                    // I think this is OK here - but it doesn't make multi level events suddenly work
                    if(tile_level > 0) {
                        planet_coord_data.can_insert = true;
                    }
    
                    if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                        //console.log("Data going into getPlanetCoordIndex:");
                        //console.log(planet_coord_data);
                    }
    
                    checking_coord_index = await main.getPlanetCoordIndex(planet_coord_data);
    
                    if(checking_coord_index === -1) {
                        log(chalk.yellow("Could not find the coord we are checking"));
                        console.log(planet_coord_data);
                        return false;
                    }
                } else if(event_scope === 'ship') {
    
                    checking_coord_index = await main.getShipCoordIndex({
                        'ship_id': dirty.ship_coords[data.ship_coord_index].ship_id,
                        'level': tile_level, 'tile_x': tile_x, 'tile_y': tile_y
                    });
                } else if(event_scope === 'galaxy') {
                    checking_coord_index = await main.getCoordIndex({ 'tile_x': tile_x, 'tile_y': tile_y });
                }
    
                if(checking_coord_index === -1) {
                    can_spawn = false;
    
                    if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                        log(chalk.yellow("Was unable to find the coord to check. tile_x,tile_y: " + tile_x + "," + tile_y));
                    }
    
                    return false;
    
                }
    
    
                if(event_scope === 'planet') {
                    checking_coord = dirty.planet_coords[checking_coord_index];
                } else if(event_scope === 'ship') {
                    checking_coord = dirty.ship_coords[checking_coord_index];
                } else if(event_scope === 'galaxy') {
                    checking_coord = dirty.coords[checking_coord_index];
                }
    
    
                let can_place_object_result = false;
                if(event_linker.object_type_id) {
    
                    if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                        log(chalk.yellow("Going to check to see if we can place an object on a coord with floor_type_id: " + checking_coord.floor_type_id));
                    }
    
                    can_place_object_result = await game_object.canPlace(dirty, event_scope, checking_coord,
                        { 'object_type_id': event_linker.object_type_id });
                }
    
    
                if(event_linker.object_type_id && can_place_object_result === false) {
                    can_spawn = false;
                    if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1 && event_scope === 'planet') {
                        log(chalk.yellow("Couldn't put an object type on coord at " +
                            dirty.planet_coords[checking_coord_index].tile_x + "," + dirty.planet_coords[checking_coord_index].tile_y))
                    }
    
                } else {
    
    
                    if(event_linker.object_type_id && debug_event_ids.indexOf(dirty.events[event_index].id) !== -1 ) {
                        console.log("Looks like we can place there. can_place_object_result: " + can_place_object_result);
                    }
    
                    if(event_linker.object_type_id && checking_coord.floor_type_id === 26) {
                        log(chalk.red("game_object.canPlace should NOT have returned true on this coord"));
                        can_spawn = false;
                    }
    
                }
    
    
    
                let can_place_floor_result = false;
                if(helper.notFalse(event_linker.floor_type_id)) {
    
                    if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                        console.log("Event linker has a floor_type_id: " + event_linker.floor_type_id);
                    }
    
                    can_place_floor_result = await main.canPlaceFloor({ 'scope': event_scope, 'coord': checking_coord,
                        'floor_type_id': event_linker.floor_type_id });
    
                } else if(event_linker.floor_type_class) {
    
                    if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                        console.log("Event linker has a floor_type_class");
                    }
    
                    can_place_floor_result = await main.canPlaceFloor({ 'scope': event_scope, 'coord': checking_coord,
                        'floor_type_class': event_linker.floor_type_class });
    
                }
    
                if(event_linker.floor_type_id && can_place_floor_result === false) {
                    can_spawn = false;
                    if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                        log(chalk.yellow("Couldn't put floor on coord at " +
                            checking_coord.tile_x + "," + checking_coord.tile_y))
                    }
    
    
                }
    
                let can_place_monster_result = false;
                if(event_linker.monster_type_id) {
    
                    let place_monster_data = { 'monster_type_id': event_linker.monster_type_id };
                    if(event_linker.floor_type_id) {
                        place_monster_data.event_provides_floor = true;
                    }
    
                    can_place_monster_result = await monster.canPlace(dirty, event_scope,checking_coord, place_monster_data);
    
                }
    
                if(event_linker.monster_type_id && can_place_monster_result === false) {
                    can_spawn = false;
                    if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                        log(chalk.yellow("Couldn't put monster type on coord at " +
                            dirty.planet_coords[checking_coord_index].tile_x + "," + dirty.planet_coords[checking_coord_index].tile_y))
                    }
                }


                let can_place_npc_result = false;
                if(event_linker.npc_job_id) {
                    can_place_npc_result = await npc.canPlace(dirty, event_scope, checking_coord, 0);
                }

                if(event_linker.npc_job_id && can_place_npc_result === false) {
                    can_spawn = false;
                    if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                        log(chalk.yellow("Couldn't put npc on coord at " +
                            checking_coord.tile_x + "," + checking_coord.tile_y))
                    }
                }

            } else {
                if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                    console.log("Skipped seeing if we can place this linker. spawns_off_grid is true");
                }
                
            }

        }


        if(!can_spawn) {
            if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                log(chalk.yellow("Was unable to spawn the event"));
            }

            return -1;
        }


        if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
            log(chalk.green("Can spawn this event here!"));
        }

        // See if we have a spawned_event with this event id that is despawned. We can reuse that instead of creating a new one
        let reusing_spawned_event_index = dirty.spawned_events.findIndex(function(obj) { return obj && obj.event_id === dirty.events[event_index].id &&
            helper.notFalse(obj.is_despawned); });

        if(reusing_spawned_event_index !== -1) { 
            log(chalk.green("Found a despawned spawned event we can use!"));
            console.time("timetoPlaceAgain");

            if(event_scope === 'planet') {
                dirty.spawned_events[reusing_spawned_event_index].origin_planet_coord_id = origin_planet_coord_id;

            } else if(event_scope === 'ship') {
                dirty.spawned_events[reusing_spawned_event_index].origin_ship_coord_id = dirty.ship_coords[data.ship_coord_index].id;
                
            } else if(event_scope === 'galaxy') {
                dirty.spawned_events[reusing_spawned_event_index].origin_coord_id = dirty.coords[origin_coord_index].id;
            }



            for(let i = 0; i < event_linkers.length; i++) {

                // Things spawned off the grid will still be there from a spawned event that was only despawned
                if(!event_linkers[i].spawns_off_grid) {
                    
                    // There should be an object of this type associated with the spawned_event
                    if(event_linkers[i].object_type_id) {
                        let disappeared_object_index = dirty.objects.findIndex(function(obj) { return obj && obj.object_type_id === event_linkers[i].object_type_id && 
                            obj.spawned_event_id == dirty.spawned_events[reusing_spawned_event_index].id; });

                        if(disappeared_object_index !== -1) {

                            let tile_x = origin_tile_x + event_linkers[i].position_x;
                            let tile_y = origin_tile_y + event_linkers[i].position_y;
                            let tile_level = 0;
                            if(event_scope === 'planet') {
                                tile_level = origin_planet_level + event_linkers[i].level;
                            } else if(event_scope === 'ship') {
                                tile_level = origin_ship_level + event_linkers[i].level;
                            }

                            let linker_coord_index = -1;
                            let linker_coord = false;
                            if(event_scope === 'planet') {
                                let planet_coord_data = { 'planet_id': dirty.planets[planet_index].id,
                                    'planet_level': tile_level, 'tile_x': tile_x, 'tile_y': tile_y };
                                linker_coord_index = await main.getPlanetCoordIndex(planet_coord_data);
                                linker_coord = dirty.planet_coords[linker_coord_index];
                            } else if(event_scope === 'ship') {
            
                                linker_coord_index = await main.getShipCoordIndex({
                                    'ship_id': dirty.ship_coords[data.ship_coord_index].ship_id,
                                    'level': tile_level, 'tile_x': tile_x, 'tile_y': tile_y
                                });
                                linker_coord = dirty.ship_coords[linker_coord_index];
                            } else if(event_scope === 'galaxy') {
                                linker_coord_index = await main.getCoordIndex({ 'tile_x': tile_x, 'tile_y': tile_y });
                                linker_coord = dirty.coords[linker_coord_index];
                            }

                            if(event_scope === 'planet') {
                                await game_object.place(false, dirty, { 'object_index': disappeared_object_index,
                                    'planet_coord_index': linker_coord_index });
    
                                //console.log("Object's planet_coord_id: " + dirty.objects[new_object_index].planet_coord_id);
                            } else if(event_scope === 'ship') {
                                await game_object.place(false, dirty, { 'object_index': disappeared_object_index,
                                    'ship_coord_index': linker_coord_index });
    
                                //console.log("Object's ship_coord_id: " + dirty.objects[new_object_index].ship_coord_id);
                            } else if(event_scope === 'galaxy') {
                                await game_object.place(false, dirty, { 'object_index': disappeared_object_index,
                                    'coord_index': linker_coord_index });
    
                                //console.log("Object's coord_id: " + dirty.objects[new_object_index].coord_id);
                            }
                        }
                    }

                }

            }

            dirty.spawned_events[reusing_spawned_event_index].is_despawned = false;
            dirty.spawned_events[reusing_spawned_event_index].has_change = true;

            console.timeEnd("timetoPlaceAgain");


            return reusing_spawned_event_index;

        } 


        // Lets add a spawned event
        let sql = "";
        let inserts = "";
        if(event_scope === 'planet') {

            //console.log("Before insert origin_planet_coord_id: " + origin_planet_coord_id);
            sql = "INSERT INTO spawned_events(event_id,planet_id,origin_planet_coord_id,planet_event_linker_id) VALUES(?,?,?,?)";
            inserts = [dirty.events[event_index].id, dirty.planets[planet_index].id, origin_planet_coord_id, dirty.planet_event_linkers[planet_event_linker_index].id];
        } else if(event_scope === 'ship') {
            sql = "INSERT INTO spawned_events(event_id,ship_id,origin_ship_coord_id) VALUES(?,?,?)";
            inserts = [dirty.events[event_index].id, dirty.ship_coords[data.ship_coord_index].ship_id, dirty.ship_coords[data.ship_coord_index].id];
        } else if(event_scope === 'galaxy') {
            sql = "INSERT INTO spawned_events(event_id,origin_coord_id) VALUES(?,?)";
            inserts = [dirty.events[event_index].id, dirty.coords[origin_coord_index].id];
        }



        let [result] = await (pool.query(sql,inserts));

        spawned_event_id = result.insertId;


        let [rows, fields] = await (pool.query("SELECT * FROM spawned_events WHERE id = ?", [spawned_event_id]));
        if(rows[0]) {
            let spawned_event = rows[0];
            spawned_event.has_change = false;

            spawned_event_index = dirty.spawned_events.push(spawned_event) - 1;

        }

        //console.log("Inserted spawned event");

        // Now that we've inserted the spawned event, we can insert each of the event linkers
        event_linkers.forEach(await async function(event_linker) {

            try {
                let tile_x = origin_tile_x + event_linker.position_x;
                let tile_y = origin_tile_y + event_linker.position_y;
                let tile_level = 0;
                if(event_scope === 'planet') {
                    tile_level = origin_planet_level + event_linker.level;
                } else if(event_scope === 'ship') {
                    tile_level = origin_ship_level + event_linker.level;
                }

                let linker_coord_index = -1;
                let linker_coord = false;
                if(event_scope === 'planet') {
                    let planet_coord_data = { 'planet_id': dirty.planets[planet_index].id,
                        'planet_level': tile_level, 'tile_x': tile_x, 'tile_y': tile_y };
                    linker_coord_index = await main.getPlanetCoordIndex(planet_coord_data);
                    linker_coord = dirty.planet_coords[linker_coord_index];
                } else if(event_scope === 'ship') {

                    linker_coord_index = await main.getShipCoordIndex({
                        'ship_id': dirty.ship_coords[data.ship_coord_index].ship_id,
                        'level': tile_level, 'tile_x': tile_x, 'tile_y': tile_y
                    });
                    linker_coord = dirty.ship_coords[linker_coord_index];
                } else if(event_scope === 'galaxy') {
                    linker_coord_index = await main.getCoordIndex({ 'tile_x': tile_x, 'tile_y': tile_y });
                    linker_coord = dirty.coords[linker_coord_index];
                }


                if(event_linker.object_type_id) {

                    let event_linker_object_type_index = main.getObjectTypeIndex(event_linker.object_type_id);

                    if(dirty.object_types[event_linker_object_type_index].assembled_as_object) {
                        let insert_object_type_data = { 'object_type_id': event_linker.object_type_id, 'spawned_event_id': spawned_event_id };
                        let new_object_index = await world.insertObjectType(false, dirty, insert_object_type_data);
                        
                        if(new_object_index === -1) {
                            log(chalk.yellow("Failed to insert object type in event.spawn"));
                            return false;
                        }
    
                        let new_object_id = dirty.objects[new_object_index].id;
                        
    
                        if(new_object_index === -1) {
                            log(chalk.yellow("Was unable to get object index from object id: " + new_object_id + " in event.spawn"));
                            return false;
                        }
    
                        if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                            console.log("Created new object id: " + dirty.objects[new_object_index].id +
                                " with spawned_event_id: " + dirty.objects[new_object_index].spawned_event_id);
                        }
    
                        if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                            console.log("Linker spawns_off_grid is: " + event_linker.spawns_off_grid);
                        }
    
                        if(helper.isFalse(event_linker.spawns_off_grid)) {
                            
                            if(event_scope === 'planet') {
                                await game_object.place(false, dirty, { 'object_index': new_object_index,
                                    'planet_coord_index': linker_coord_index });
    
                                //console.log("Object's planet_coord_id: " + dirty.objects[new_object_index].planet_coord_id);
                            } else if(event_scope === 'ship') {
                                await game_object.place(false, dirty, { 'object_index': new_object_index,
                                    'ship_coord_index': linker_coord_index });
    
                                //console.log("Object's ship_coord_id: " + dirty.objects[new_object_index].ship_coord_id);
                            } else if(event_scope === 'galaxy') {
                                await game_object.place(false, dirty, { 'object_index': new_object_index,
                                    'coord_index': linker_coord_index });
    
                                //console.log("Object's coord_id: " + dirty.objects[new_object_index].coord_id);
                            }
                        } else {
    
                            if(debug_event_ids.indexOf(dirty.events[event_index].id) !== -1) {
                                console.log("Skipped adding this linker to a coordinate. spawns_off_grid is true");
                            }
                            
                        }
                    } 
                    // Object type is not assembled as an object - we can just update the coord with the object type
                    else {

                        if(event_scope === 'planet') {
                            main.updateCoordGeneric({}, { 'planet_coord_index': linker_coord_index, 'object_type_id': event_linker.object_type_id, 'amount': 1,
                                'spawned_event_id': spawned_event_id });
                        } else if(event_scope === 'ship') {
                            main.updateCoordGeneric({}, { 'ship_coord_index': linker_coord_index, 'object_type_id': event_linker.object_type_id, 'amount': 1,
                                'spawned_event_id': spawned_event_id });
                        } else if(event_scope === 'galaxy') {
                            main.updateCoordGeneric({}, { 'coord_index': linker_coord_index, 'object_type_id': event_linker.object_type_id, 'amount': 1,
                                'spawned_event_id': spawned_event_id });
                        }

                    }

                    

                    


                    /*
                    await world.addObjectToPlanetCoord(dirty, new_object_index, checking_coord_index);
                    await game.objectFindTarget(dirty, new_object_index);

                     */
                }

                if( helper.notFalse(event_linker.floor_type_id) ) {
                    if(event_scope === 'planet') {
                        await world.changeFloor(dirty, { 'planet_coord_index': linker_coord_index, 'floor_type_id': event_linker.floor_type_id });
                    } else if(event_scope === 'ship') {
                        await world.changeFloor(dirty, { 'ship_coord_index': linker_coord_index, 'floor_type_id': event_linker.floor_type_id });
                    } else if(event_scope === 'galaxy') {
                        await world.changeFloor(dirty, { 'coord_index': linker_coord_index, 'floor_type_id': event_linker.floor_type_id });
                    }
                } else if( helper.notFalse(event_linker.floor_type_class) ) {

                    console.log("Event linker has a floor type class")


                    if(event_scope === 'planet') {

                        let rarity_roll = helper.rarityRoll();
                        let possible_floor_type_ids = [];

                        for(let f = 0; f < dirty.planet_floor_linkers.length; f++) {

                            // Check to see if this is a linker that applies to our planet and level and rarity roll
                            if(dirty.planet_floor_linkers[f] && dirty.planet_floor_linkers[f].planet_type_id === dirty.planets[planet_index].planet_type_id && 
                                dirty.planet_floor_linkers[f].lowest_planet_level <= dirty.planet_coords[linker_coord_index].level && 
                                dirty.planet_floor_linkers[f].highest_planet_level >= dirty.planet_coords[linker_coord_index].level &&
                                dirty.planet_floor_linkers[f].rarity <= rarity_roll
                                ) {

                                let planet_floor_type_index = main.getFloorTypeIndex(dirty.planet_floor_linkers[f].floor_type_id);
                                if(planet_floor_type_index !== -1 && dirty.floor_types[planet_floor_type_index].class === event_linker.floor_type_class) {
                                    possible_floor_type_ids.push(dirty.floor_types[planet_floor_type_index].id);
                                }



                            }
                        }

                        let chosen_floor_type_id = 0;
                        if(possible_floor_type_ids.length > 1) {
                            chosen_floor_type_id = possible_floor_type_ids[Math.floor(Math.random() * possible_floor_type_ids.length)];
                        } else if(possible_floor_type_ids.length === 1) {
                            chosen_floor_type_id = possible_floor_type_ids[0];
                        } else if(possible_floor_type_ids.length === 0) {
                            log(chalk.yellow("No possible floor types found"));
                        }

                        if(chosen_floor_type_id !== 0) {
                            await world.changeFloor(dirty, { 'planet_coord_index': linker_coord_index, 'floor_type_id': chosen_floor_type_id });
                        }

                    }


                }

                if(event_linker.monster_type_id) {

                    let spawn_monster_data = { 'spawned_event_id': spawned_event_id };
                    if(event_scope === 'planet') {
                        spawn_monster_data.planet_coord_index = linker_coord_index;

                    } else if(event_scope === 'ship') {
                        spawn_monster_data.ship_coord_index = linker_coord_index;

                    } else if(event_scope === 'galaxy') {
                        spawn_monster_data._coord_index = linker_coord_index;
                        log(chalk.red("CODE IT BOY!"));
                    }

                    await monster.spawn(dirty, event_linker.monster_type_id, spawn_monster_data);

                }

                if(event_linker.npc_job_id) {
                    npc.spawn(dirty, event_linker.npc_job_id);
                }

                // If there's an hp effect, have it hurt non-event things at this spot
                if(event_linker.hp_effect) {
                    console.log("Spawning event has a hp effect at this location");

                    if(linker_coord.object_id) {
                        let object_index = await game_object.getIndex(dirty, linker_coord.object_id);

                        // We found the object here and it's not from our event
                        if(object_index !== -1 && dirty.objects[object_index].spawned_event_id !== spawned_event_id) {
                            let object_info = await game_object.getCoordAndRoom(dirty, object_index);

                            await game_object.damage(dirty, object_index, event_linker.hp_effect, {'object_info': object_info, 'reason': 'event' });
                        }
                    }
                    else if(linker_coord.object_type_id) {
                        let object_type_index = dirty.object_types.findIndex(function(obj) {
                            return obj && obj.id === linker_coord.object_type_id; });

                        // We can't store an updated HP amount for a non object object type, so it would just be destroyed
                        if(object_type_index !== -1 && dirty.object_types[object_type_index].can_be_attacked) {

                            if(event_scope === 'planet') {
                                await main.updateCoordGeneric(false, { 'planet_coord_index': linker_coord_index, 'object_type_id': false });
                            } else if(event_scope === 'ship') {
                                await main.updateCoordGeneric(false, { 'ship_coord_index': linker_coord_index, 'object_type_id': false });
                            } else if(event_scope === 'galaxy') {
                                await main.updateCoordGeneric(false, { 'coord_index': linker_coord_index, 'object_type_id': false });
                            }


                        }
                    }


                }
            } catch(error) {
                log(chalk.red("Error in event.spawn - event_linker: " + error));
                console.error(error);
            }



        });


        return spawned_event_index;


    } catch(error) {
        log(chalk.red("Error in event.spawn: " + error));
        console.error(error);
    }



}

exports.spawn = spawn;

async function spawnOnPlanet(dirty, i, debug_planet_type_id) {

    try {
        if(dirty.planets[i].planet_type_id === debug_planet_type_id) {
            log(chalk.cyan("Spawning events for planet id: " + dirty.planets[i].id + " planet_type_id: " + dirty.planets[i].planet_type_id));
        }


        // Figure out the % HP the planet has

        if(helper.isFalse(dirty.planets[i].current_hp)) {
            dirty.planets[i].current_hp = 1;
            dirty.planets[i].has_change = true;
        }

        let hp_percent = dirty.planets[i].current_hp / dirty.planets[i].max_hp * 100;

        

        // rarity roll for every planet
        let rarity = helper.rarityRoll();

        if(dirty.planets[i].planet_type_id === debug_planet_type_id) {
            console.log("Rarity roll: " + rarity);
        }

        let planet_event_linkers = dirty.planet_event_linkers.filter(planet_event_linker =>
            planet_event_linker.planet_type_id === dirty.planets[i].planet_type_id && planet_event_linker.rarity <= rarity &&
            planet_event_linker.minimum_planet_hp_percent <= hp_percent && planet_event_linker.maximum_planet_hp_percent >= hp_percent);

        if(planet_event_linkers.length === 0) {
            return false;
        }



        if(dirty.planets[i].planet_type_id === debug_planet_type_id) {
            console.log("Have " + planet_event_linkers.length + " events for planet type id: " + dirty.planets[i].planet_type_id);
            //console.log(planet_event_linkers);
        }

        let random_planet_event_linker = planet_event_linkers[Math.floor(Math.random() * planet_event_linkers.length)];



        // get the event
        let event_index = dirty.events.findIndex(function(obj) { return obj && obj.id === random_planet_event_linker.event_id; });

        if(event_index !== -1 && dirty.planets[i].planet_type_id === debug_planet_type_id) {
            console.log("Randomly chose event id: " + dirty.events[event_index].id + " " + dirty.events[event_index].name);
        } else if(dirty.planets[i].planet_type_id === debug_planet_type_id) {
            log(chalk.yellow("Could not find that event. event id: " + random_planet_event_linker.event_id));
        }

        if(event_index !== -1 && dirty.events[event_index].is_active) {
            if(dirty.planets[i].planet_type_id === debug_planet_type_id) {
                console.log("Going to try to spawn event " + dirty.events[event_index].name + " id: " + dirty.events[event_index].id + " on planet id: " + dirty.planets[i].id);
            }
            
            let spawned_event_index = await spawn(dirty, event_index, { 'planet_id': dirty.planets[i].id, 'planet_event_linker_id': random_planet_event_linker.id });

            if(dirty.planets[i].planet_type_id === debug_planet_type_id) {
                console.log("spawned_event_index: " + spawned_event_index);
            }

            if(spawned_event_index !== -1 && random_planet_event_linker.is_regular_monster_spawn) {
                dirty.planets[i].current_regular_monster_count++;
                //console.log("Increased the regular monster count on planet id: " + dirty.planets[i].id + " to: " + dirty.planets[i].current_regular_monster_count);
            } else if(random_planet_event_linker.is_regular_monster_spawn) {
                //log(chalk.yellow("Linker is a regular monster spawn, but we did not increment the current_regular_monster_count. Planet id: " + dirty.planets[i].id + " spawned_event_index: " + spawned_event_index));
            }
        }

        
    } catch(error) {
        log(chalk.red("Error in event.spawnOnPlanet: " + error));
        console.error(error);
    }
}

exports.spawnOnPlanet = spawnOnPlanet;


async function tickRegularMonsterSpawns(dirty) {

    try {


        for(let i = 0; i < dirty.planets.length; i++) {
            if(dirty.planets[i] && dirty.planets[i].planet_type_id !== 26) {

                // Planets don't automatically come with any knowledge of the % of regular monster they are at
                if(typeof dirty.planets[i].maximum_regular_monster_count === 'undefined') {
                    let maximum_regular_monster_count = 0;
                    let current_regular_monster_count = 0;

                    for(let pe = 0; pe < dirty.planet_event_linkers.length; pe++) {
                        if(dirty.planet_event_linkers[pe] && dirty.planet_event_linkers[pe].planet_type_id === dirty.planets[i].planet_type_id && 
                            dirty.planet_event_linkers[pe].is_regular_monster_spawn) {


                                maximum_regular_monster_count += dirty.planet_event_linkers[pe].limit_per_planet;

                            }
                    }

                    dirty.planets[i].maximum_regular_monster_count = maximum_regular_monster_count;

                    //console.log("Set planet maximum_regular_monster_count to: " + dirty.planets[i].maximum_regular_monster_count);

                    // gotta figure out a way to see how many monsters we have right now
                    // most basic (but a little less than 100% accurate) is to just count the number of monsters on the planet
                    for(let m = 0; m < dirty.monsters.length; m++) {

                        if(dirty.monsters[m] && dirty.monsters[m].planet_coord_id) {
                            if(typeof dirty.monsters[m].planet_coord_index === 'undefined') {

                            }

                            if(dirty.monsters[m].planet_coord_index !== -1) {
                                if(dirty.planet_coords[dirty.monsters[m].planet_coord_index].planet_id === dirty.planets[i].id) {
                                    current_regular_monster_count++;
                                }
                            }
                        }

                    }

                    dirty.planets[i].current_regular_monster_count = current_regular_monster_count;
                    //console.log("planet currently has: " + current_regular_monster_count + " monsters");
                }



                if(dirty.planets[i].current_regular_monster_count * 2 < dirty.planets[i].maximum_regular_monster_count) {
                    console.log("Planet id: " + dirty.planets[i].id + " is low on monsters ( " + dirty.planets[i].current_regular_monster_count + 
                    "/" + dirty.planets[i].maximum_regular_monster_count + ") - lets spawn some FAST!!!");

                    let spawn_count = 0;
                    while(spawn_count < 5) {

                        await spawnOnPlanet(dirty, i);
                        spawn_count++;
                    }
                }
                


            }
        }

    } catch(error) {
        log(chalk.red("Error in event.tickRegularMonsterSpawns: " + error));
        console.error(error);
    }

}

exports.tickRegularMonsterSpawns = tickRegularMonsterSpawns;

async function tickSpawnedEvents(dirty) {

    try {
        for(let i = 0; i < dirty.spawned_events.length; i++) {
            if(dirty.spawned_events[i]) {
                //console.log("Checking on spawned event id: " + dirty.spawned_events[i].id);

                dirty.spawned_events[i].tick_count++;
                dirty.spawned_events[i].has_change = true;

                let event_index = dirty.events.findIndex(function(obj) { return obj && obj.id === dirty.spawned_events[i].event_id; });



                // See if we despawn the event - Either do it because it's been ticking for FOREVER!!! Or it has a tick_count
                // specified and we are over that
                if(dirty.spawned_events[i].tick_count > 10000 ||
                    (helper.notFalse(dirty.events[event_index].tick_count) && dirty.spawned_events[i].tick_count > dirty.events[event_index].tick_count )) {
                    //console.log("Going to delete spawned event id: " + dirty.spawned_events[i].id);
                    //console.log("Spawned event tick count: " + dirty.spawned_events[i].tick_count + " Event tick count: " + dirty.events[event_index].tick_count);
                    await deleteSpawnedEvent(dirty, i);
                }



                // Now that we've deleted any object or monsters associated with the event, calling this
                // will despawn it
                //await checkSpawnedEvent(dirty, dirty.spawned_events[i].id);
            }

        }

    } catch(error) {
        log(chalk.red("Error in event.tickSpawnedEvents: " + error));
        console.error(error);
    }
}

exports.tickSpawnedEvents = tickSpawnedEvents;


async function tickSpawning(dirty) {


    try {

        let debug_planet_type_id = 0;


        // Spawn Events On Every Planet!
        for(let i = 0; i < dirty.planets.length; i++) {
            if(dirty.planets[i]) {

                spawnOnPlanet(dirty, i, debug_planet_type_id);

            }
        }


        // Spawn Events In The Galaxy!
        let galaxy_event_index = -1;
        let galaxy_rarity = helper.rarityRoll();

        let galaxy_linkers = dirty.events.filter(event_filter =>
            event_filter.spawns_in_galaxy && event_filter.rarity <= galaxy_rarity && event_filter.is_active);

        if(galaxy_linkers.length > 0) {
            let random_galaxy_event = galaxy_linkers[Math.floor(Math.random() * galaxy_linkers.length)];

            // get the event
            galaxy_event_index = dirty.events.findIndex(function(obj) { return obj && obj.id === random_galaxy_event.id; });
        } else {
            console.log("No relevant galaxy linkers");
        }

        if(galaxy_event_index === -1) {
            log(chalk.yellow("Could not find the galaxy event"));
            return false;
        }

        if(!dirty.events[galaxy_event_index].is_active) {
            log(chalk.yellow("Picked a galaxy event that isn't active yet"));
            return false;
        }


        await spawn(dirty, galaxy_event_index, { 'scope': 'galaxy'});




    } catch(error) {
        log(chalk.red("Error in event.tickSpawning: " + error));
        console.error(error);
    }

}

exports.tickSpawning = tickSpawning;

