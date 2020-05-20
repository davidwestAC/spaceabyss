var io_handler = require('./io.js');
var io = io_handler.io;
var database = require('./database.js');
var pool = database.pool;
const { Worker, isMainThread, parentPort } = require('worker_threads');
const chalk = require('chalk');
const log = console.log;

const game_object = require('./game_object.js');
const helper = require('./helper.js');
const inventory = require('./inventory.js');
const main = require('./space_abyss' + process.env.FILE_SUFFIX + '.js');
const movement = require('./movement.js');
const world = require('./world.js');


    // Actions specific to the bugAttack NPC job
    async function bugAttackCode(dirty, npc_index) {
        try {

            if(!dirty.npcs[npc_index].planet_coord_id) {

                // Non forming array of planets
                let possible_planets = dirty.planets.filter(planet_filter => planet_filter.planet_type_id !== 26);
                let chosen_planet = possible_planets[Math.floor(Math.random()*possible_planets.length)];

                if(!chosen_planet) {
                    log(chalk.yellow("No non-forming planets in memory"));
                    return false;
                }

                console.log("Looks like planet id: " + chosen_planet.id + " is gonna get a bug attack");

                // Lets find a galaxy coord around the planet to park our bug ship next to
                let chosen_planet_coord_index = dirty.coords.findIndex(function(obj) { return obj &&
                    obj.planet_id === chosen_planet.id; });

                if(chosen_planet_coord_index === -1) {
                    console.log("Could not find the coord the planet is on");
                    return false;
                }

                // We're going to park at -1,-1 to the planet's coord
                let destination_tile_x = dirty.coords[chosen_planet_coord_index].tile_x - 1;
                let destination_tile_y = dirty.coords[chosen_planet_coord_index].tile_y - 1;



                dirty.npc_tasks.push({ 'npc_id': dirty.npcs[npc_index].id, 'destination_tile_x': destination_tile_x,
                    'destination_tile_y': destination_tile_y, 'destination_planet_id': chosen_planet.id });

                log(chalk.cyan("Destination set! Poor planet!"));
            }
            /******************** WITHOUT STRUCTURE, ON A PLANET **********************/
            else {

                // If there's a coord that spawns a monster around us, we take it over and replace it with
                // something else
                let npc_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.npcs[npc_index].planet_coord_id });

                if(npc_coord_index === -1) {
                    log(chalk.yellow("Could not get planet coord index for the npc"));
                    return false;

                }

                // Go through the -1 to +1 seeing if there's a coord with spawns_monster_type_id that we haven't taken over yet
                for(let x = dirty.planet_coords[npc_coord_index].tile_x - 1; x <= dirty.planet_coords[npc_coord_index].tile_x + 1; x++) {
                    for(let y = dirty.planet_coords[npc_coord_index].tile_y - 1; y <= dirty.planet_coords[npc_coord_index].tile_y + 1; y++) {
                        let planet_coord_index = await main.getPlanetCoordIndex({ 'planet_id': dirty.planet_coords[npc_coord_index].planet_id,
                            'planet_level': dirty.planet_coords[npc_coord_index].level, 'tile_x': x, 'tile_y': y });

                        if(planet_coord_index !== -1) {
                            if(dirty.planet_coords[planet_coord_index].spawns_monster_type_id) {
                                console.log("NPC found a coord that spawns a monster");

                                // Lets cap it, if it's not already capped

                                if(dirty.planet_coords[planet_coord_index].object_type_id !== 262) {
                                    let insert_object_type_data = { 'object_type_id': 262,
                                        'npc_id': dirty.npcs[npc_index].id };
                                    let new_object_id = await world.insertObjectType(false, dirty, insert_object_type_data);
                                    let new_object_index = await main.getObjectIndex(new_object_id);

                                    await main.placeObject(false, dirty, { 'object_index': new_object_index,
                                        'planet_coord_index': planet_coord_index });
                                }

                            }
                        }
                    }
                }

                // and randomly move
                moveRandom(dirty, npc_index);



            }
        } catch(error) {
            log(chalk.red("Error in npc.bugAttackCode: " + error));
            console.error(error);
        }
    }

    async function canBuildStructure(dirty, npc_index, structure_linkers) {

        try {
            let npc_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.npcs[npc_index].planet_coord_id });

            let can_build = true;

            // If the structure has multiple levels, the NPC will be moving up. E.g. from 0 to +1. We need to know how
            // many levels the structure has, and check if we can build it with the npc moved up to their final level

            let lowest_level = 0;

            for(let i = 0; i < structure_linkers.length; i++) {
                if(structure_linkers[i] && structure_linkers[i].level < lowest_level) {
                    lowest_level = structure_linkers[i].level;
                }
            }

            // Not loving a var with a name 'pretend' in it
            let pretend_npc_level = 0 + Math.abs(lowest_level);

            for(let i = 0; i < structure_linkers.length && can_build; i++) {
                if(structure_linkers[i]) {
                    let tile_x = dirty.planet_coords[npc_coord_index].tile_x + structure_linkers[i].position_x;
                    let tile_y = dirty.planet_coords[npc_coord_index].tile_y + structure_linkers[i].position_y;
                    let planet_level = pretend_npc_level + structure_linkers[i].level;

                    let planet_coord_data = { 'planet_id': dirty.planet_coords[npc_coord_index].planet_id,
                        'planet_level': planet_level, 'tile_x': tile_x, 'tile_y': tile_y };
                    let checking_coord_index = await main.getPlanetCoordIndex(planet_coord_data);

                    if(checking_coord_index === -1 && planet_level > 0) {
                        // It's fine if a higher level coord doesn't exist at this point
                    } else if(checking_coord_index === -1) {
                        console.log("Returning false in canBuildStructure. Coord doesn't exist");
                        can_build = false;
                    } else {

                        let can_place_result = await main.canPlace('planet', dirty.planet_coords[checking_coord_index], 'building', false);
                        if(!can_place_result) {
                            console.log("Can place returned false on tile_x,y: " + tile_x + ", " + tile_y);
                            can_build = false;
                        }

                    }
                }
            }


            structure_linkers.forEach(await async function(structure_linker, i) {

                try {
                    let tile_x = dirty.planet_coords[npc_coord_index].tile_x + structure_linker.position_x;
                    let tile_y = dirty.planet_coords[npc_coord_index].tile_y + structure_linker.position_y;
                    let planet_level = pretend_npc_level + structure_linker.level;

                    let planet_coord_data = { 'planet_id': dirty.planet_coords[npc_coord_index].planet_id,
                        'planet_level': planet_level, 'tile_x': tile_x, 'tile_y': tile_y };
                    let checking_coord_index = await main.getPlanetCoordIndex(planet_coord_data);

                    if(checking_coord_index === -1 && planet_level > 0) {
                        // It's fine if a higher level coord doesn't exist at this point
                    } else if(checking_coord_index === -1) {
                        can_build = false;
                    } else if(await main.canPlace('planet', dirty.planet_coords[checking_coord_index], 'building', false) === false) {

                        can_build = false;
                    }
                } catch(error) {
                    log(chalk.red("Error in npc.canBuildStructure - checking linkers: " + error));
                }


            });

            return can_build;
        } catch(error) {
            log(chalk.red("Error in npc.canBuildStructure: " + error));
        }

    }
    exports.canBuildStrcuture = canBuildStructure;


    // Actions specific to the bugAttack NPC job
    async function doctorCode(dirty, npc_index) {
        try {

            if(!dirty.npcs[npc_index].planet_coord_id) {

                // Non forming/azure array of planets
                let possible_planets = dirty.planets.filter(planet_filter => planet_filter.planet_type_id !== 26 && planet_filter.planet_type_id !== 16);
                let chosen_planet = possible_planets[Math.floor(Math.random()*possible_planets.length)];

                if(!chosen_planet) {
                    log(chalk.yellow("No non-forming planets in memory"));
                    return false;
                }

                console.log("Looks like planet id: " + chosen_planet.id + " is gonna get a doctor!");

                // Lets find a galaxy coord around the planet to park our bug ship next to
                let chosen_planet_coord_index = dirty.coords.findIndex(function(obj) { return obj &&
                    obj.planet_id === chosen_planet.id; });

                if(chosen_planet_coord_index === -1) {
                    console.log("Could not find the coord the planet is on");
                    return false;
                }


                let destination_tile_x = dirty.coords[chosen_planet_coord_index].tile_x;
                let destination_tile_y = dirty.coords[chosen_planet_coord_index].tile_y;



                dirty.npc_tasks.push({ 'npc_id': dirty.npcs[npc_index].id, 'destination_tile_x': destination_tile_x,
                    'destination_tile_y': destination_tile_y, 'destination_planet_id': chosen_planet.id });

                log(chalk.cyan("Destination set! Doctor is coming!"));
            }
            /******************** WITHOUT STRUCTURE, ON A PLANET **********************/
            else {

                // and randomly move
                moveRandom(dirty, npc_index);



            }
        } catch(error) {
            log(chalk.red("Error in npc.doctorCode: " + error));
            console.error(error);
        }
    }


    async function moveRandom(dirty, npc_index) {
        try {

            let coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.npcs[npc_index].planet_coord_id });

            if(coord_index === -1) {
                log(chalk.yellow("Could not get the planet coord that the npc is on. planet_coord_id: " + dirty.npcs[npc_index].planet_coord_id));
                return false;
            }
            // MOVE

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

            let new_npc_x = dirty.planet_coords[coord_index].tile_x + random_x_change;
            let new_npc_y = dirty.planet_coords[coord_index].tile_y + random_y_change;

            // lets get the new potential planet coord and see if they can move there
            let new_coord_data = {
                'planet_id': dirty.planet_coords[coord_index].planet_id,
                'planet_level': dirty.planet_coords[coord_index].level, 'tile_x': new_npc_x,
                'tile_y': new_npc_y
            };
            let new_coord_index = await main.getPlanetCoordIndex(new_coord_data);

            if(new_coord_index !== -1) {
                await movement.movePlanetNpc(dirty, npc_index, false, new_coord_index);
            }
        } catch(error) {
            log(chalk.red("Error in npc.moveRandom: " + error));
            console.error(error);
        }
    }


    // Putting a certain # of npcs in our world
    async function npcActions(dirty, database_queue) {

        try {

            //console.log("In npc.npcActions");

            // We want a certain number of npcs in our world
            let total_npc_count = 3;

            let current_npcs = dirty.npcs.filter(n => n);

            if(current_npcs.length < total_npc_count) {
                console.log("Not enough npcs. Spawning one");
                await spawnNpc(dirty);
            }


            dirty.npcs.forEach(function(npc, i) {
                try {

                    if(!npc) {
                        return false;
                    }


                    let task_index = dirty.npc_tasks.findIndex(function(obj) { return obj && obj.npc_id === npc.id; });


                    // I think we want to prioritize running to a safe place if our hp is low, and eating things if we have them
                    if(dirty.npcs[i].current_hp < dirty.npcs[i].max_hp) {

                        // Make sure that isn't already a task
                        let existing_eating_task_index = dirty.npc_tasks.findIndex(function(obj) { return obj && obj.npc_id === dirty.npcs[i].id &&
                            obj.action && obj.action === 'eat'});
                        if(existing_eating_task_index === -1) {
                            dirty.npc_tasks.push({ 'npc_id': dirty.npcs[i].id, 'action': 'eat'});
                            console.log("Pushed an npc_task that npc id: " + dirty.npcs[i].id + " should try to eat something");
                        }

                    }
                    if(dirty.npcs[i].current_hp * 2 < dirty.npcs[i].max_hp) {
                        let existing_escape_task_index = dirty.npc_tasks.findIndex(function(obj) { return obj && obj.npc_id === dirty.npcs[i].id &&
                            obj.action && obj.action === 'escape'});
                        if(existing_escape_task_index === -1) {
                            dirty.npc_tasks.push({'npc_id': dirty.npcs[i].id, 'action': 'escape'});
                            console.log("Pushed an npc_task that npc id: " + dirty.npcs[i].id + " should try to escape");
                        }
                    }

                    if(task_index !== -1) {
                        performNpcTask(dirty, database_queue, i, task_index);
                    } else {
                        setNpcTask(dirty, i);
                    }




                } catch(error) {
                    log(chalk.red("Error in game.npcActions -> npc: " + error));
                }
            });


        } catch(error) {
            log(chalk.red("Error in game.npcActions: " + error));
        }
    }

    exports.npcActions = npcActions;


    async function npcPickUp(dirty, npc_index, coord_index) {

        try {


            // If the coord spawns something and it's there, we take that
            let object_index = -1;
            let object_type_index = -1;

            if(dirty.planet_coords[coord_index].object_id) {
                object_index = await main.getObjectIndex(dirty.planet_coords[coord_index].object_id);
                object_type_index = main.getObjectTypeIndex(dirty.objects[object_index].object_type_id);
            } else if(dirty.planet_coords[coord_index].object_type_id) {
                object_type_index = main.getObjectTypeIndex(dirty.planet_coords[coord_index].object_type_id);
            }



            // We have an object, it spawns something, and that something is there
            if(object_index !== -1 && dirty.objects[object_index].has_spawned_object) {

                let object_info = await game_object.getCoordAndRoom(dirty, object_index);
                let spawn_linker_index = dirty.spawn_linkers.findIndex(function(obj) { return obj && obj.id === dirty.objects[object_index].current_spawn_linker_id; });
                if(spawn_linker_index === -1) {
                    log(chalk.yellow("Object id: " + dirty.objects[object_index].id + " is on the old spawner system - npcPickUp"));
                    return false;
                }

                let adding_to_data = { 'adding_to_type': 'npc', 'adding_to_id': dirty.npcs[npc_index].id,
                    'object_type_id': dirty.spawn_linkers[spawn_linker_index].spawns_object_type_id, 'amount':dirty.spawn_linkers[spawn_linker_index].spawns_amount };

                await inventory.addToInventory(pool, socket, dirty, adding_to_data);

                dirty.objects[object_index].has_spawned_object = false;
                dirty.objects[object_index].has_change = true;

                // send the updated object info to the room
                await game_object.sendInfo(false, object_info.room, dirty, object_index, 'npc.npcPickUp');

                // and the npc increases in farming skill points
                dirty.npcs[npc_index].farming_skill_points++;
                dirty.npcs[npc_index].has_change = true;

            } else if(dirty.object_types[object_type_index].can_pick_up) {


                if(dirty.planet_coords[coord_index].object_id) {
                    let adding_to_data = { 'adding_to_type': 'npc', 'adding_to_id': dirty.npcs[npc_index].id,
                        'object_id': dirty.planet_coords[coord_index].object_id };

                    await inventory.addToInventory(pool, socket, dirty, adding_to_data);

                    await main.updateCoordGeneric(false, { 'planet_coord_index': coord_index, 'object_id': false, 'object_type_id': false });
                } else {
                    let adding_to_data = { 'adding_to_type': 'npc', 'adding_to_id': dirty.npcs[npc_index].id,
                        'object_type_id': dirty.planet_coords[coord_index].object_type_id, 'amount':dirty.planet_coords[coord_index].object_amount };

                    await inventory.addToInventory(pool, socket, dirty, adding_to_data);

                    await main.updateCoordGeneric(false, { 'planet_coord_index': coord_index, 'object_id': false, 'object_type_id': false });
                }


            }



        } catch(error) {
            log(chalk.red("Error in npc.npcPickUp: " + error));
            console.error(error);
        }
    }

    exports.npcPickUp = npcPickUp;


    async function performNpcTask(dirty, database_queue, npc_index, task_index) {
        try {

            //console.log("Task index: " + task_index);
            //console.log(dirty.npc_tasks[task_index]);
            // we have a destination - lets move towards there!

            if(dirty.npc_tasks[task_index].action === 'eat') {
                log(chalk.cyan("NPC is trying to eat!"));

                // see if we have an inventory item that we can eat
                let ate_something = false;
                for(let i = 0; i < dirty.inventory_items.length && ate_something === false; i++) {
                    if(dirty.inventory_items[i] && dirty.inventory_items[i].npc_id === dirty.npcs[npc_index].id) {
                        console.log("Npc has inventory item with object_type_id: " + dirty.inventory_items[i].object_type_id);

                        let eating_linker_index = dirty.race_eating_linkers.findIndex(function(obj) {
                            return obj && obj.race_id === 13 && obj.object_type_id === dirty.inventory_items[i].object_type_id;
                        });

                        if(eating_linker_index !== -1) {
                            log(chalk.green("Npc has something they can eat!"));
                            main.eat(false, dirty, database_queue, { 'npc_index': npc_index, 'inventory_item_id': dirty.inventory_items[i].id });

                            // and we can remove the task
                            dirty.npc_tasks.splice(task_index, 1);
                            console.log("Removed eating task for this npc");
                        }

                    }
                }
            }
            else if(dirty.npc_tasks[task_index].action === 'escape') {
                log(chalk.cyan("NPC is trying to escape!"));

                if(dirty.npcs[npc_index].current_hp * 2 > dirty.npcs[npc_index].max_hp) {

                }
            }
            // Move towards our destination
            else if(dirty.npc_tasks[task_index].destination_tile_x) {
                console.log("Npc has a destination. tile_x,tile_y: " + dirty.npc_tasks[task_index].destination_tile_x + " " + dirty.npc_tasks[task_index].destination_tile_y);

                // Npc is currently moving around the galaxy
                if(dirty.npcs[npc_index].coord_id) {

                    let npc_coord_index = await main.getCoordIndex({ 'coord_id': dirty.npcs[npc_index].coord_id });
                    let x_difference = Math.abs(dirty.coords[npc_coord_index].tile_x - dirty.npc_tasks[task_index].destination_tile_x);
                    let y_difference = Math.abs(dirty.coords[npc_coord_index].tile_y - dirty.npc_tasks[task_index].destination_tile_y);

                    if(x_difference === 0 && y_difference === 0) {
                        console.log("Npc is already at destination. Npc is at " + dirty.coords[npc_coord_index].tile_x + "," + dirty.coords[npc_coord_index].tile_y);

                        // The npc's ship isn't going to be directly on the planet, just next to it
                        if(dirty.npcs[npc_index].current_job_id === 5) {
                            console.log("For bug attack npc, trying to just put the NPC on the planet, leaving the bug ship there");
                            movement.switchToPlanetNpc(dirty, npc_index, dirty.npc_tasks[task_index].destination_planet_id);
                        }
                        delete dirty.npc_tasks[task_index];
                        //dirty.npc_tasks.splice(task_index, 1);




                        return;
                    }

                    let next_coord_index = -1;
                    let next_tile_x = dirty.coords[npc_coord_index].tile_x;
                    let next_tile_y = dirty.coords[npc_coord_index].tile_y;
                    let possible_next_moves = [];

                    // We previously pathfound a path for this npc because they were stuck
                    if(dirty.npc_tasks[task_index].path && dirty.npc_tasks[task_index].path.length > 0) {

                        // grab the first coord, and put it into our possible moves array
                        let path_tile_x = dirty.npc_tasks[task_index].path[0][0];
                        let path_tile_y = dirty.npc_tasks[task_index].path[0][1];
                        console.log("Reading from path to send npc to x,y: " + path_tile_x + "," + path_tile_y);


                        next_coord_index = await main.getCoordIndex({ 'tile_x': path_tile_x, 'tile_y': path_tile_y });
                        if(next_coord_index !== -1) {
                            possible_next_moves.push( {'coord': dirty.coords[next_coord_index], 'coord_index': next_coord_index });
                        }

                        // Remove the part of the path we just used
                        dirty.npc_tasks[task_index].path.splice(0, 1);


                    } else {
                        if(x_difference !== 0) {
                            console.log("Current tile x: " + dirty.coords[npc_coord_index].tile_x +
                                " Destination tile x: " + dirty.npc_tasks[task_index].destination_tile_x);
                            if(dirty.coords[npc_coord_index].tile_x > dirty.npc_tasks[task_index].destination_tile_x) {

                                next_tile_x--;

                            } else {
                                next_tile_x++;
                            }

                            console.log("not at destination x. Trying to get coord at x,y: " + next_tile_x + "," + next_tile_y);

                            next_coord_index = await main.getCoordIndex({ 'tile_x': next_tile_x, 'tile_y': next_tile_y });
                            if(next_coord_index !== -1) {
                                possible_next_moves.push( {'coord': dirty.coords[next_coord_index], 'coord_index': next_coord_index });
                            }
                        }

                        // reset the next coord stuff
                        next_coord_index = -1;
                        next_tile_x = dirty.coords[npc_coord_index].tile_x;
                        next_tile_y = dirty.coords[npc_coord_index].tile_y;


                        if(y_difference !== 0) {
                            console.log("Current tile y: " + dirty.coords[npc_coord_index].tile_y +
                                " Destination tile y: " + dirty.npc_tasks[task_index].destination_tile_y);
                            if(dirty.coords[npc_coord_index].tile_y > dirty.npc_tasks[task_index].destination_tile_y) {
                                next_tile_y--;
                            } else {
                                next_tile_y++;
                            }

                            console.log("not at destination y. Trying to get coord at x,y: " + next_tile_x + "," + next_tile_y);

                            next_coord_index = await main.getCoordIndex({ 'tile_x': next_tile_x, 'tile_y': next_tile_y });
                            if(next_coord_index !== -1) {
                                possible_next_moves.push( {'coord': dirty.coords[next_coord_index], 'coord_index': next_coord_index });
                            }
                        }
                    }


                    let found_move = false;
                    for(let possible_move of possible_next_moves) {

                        let can_place_result = await main.canPlaceNpc('galaxy', dirty.coords[possible_move.coord_index], dirty.npcs[npc_index].id, task_index);
                        if(can_place_result) {
                            found_move = true;
                            await movement.moveGalaxyNpc(dirty, npc_index, task_index, possible_move.coord_index);
                        } else {
                            console.log("False on canPlaceNpc");
                        }
                    }

                    if(!found_move) {
                        log(chalk.magenta("PATHFINDING TIME! Could not find move"));

                        const worker = new Worker('./worker_pathfinding.js');


                        worker.on('message', (path) => {
                            console.log("Got a path from the worker: ");
                            console.log(path);
                            dirty.npc_tasks[task_index].path = path;
                        });

                        worker.on('error', (error) => {
                            console.log("Worker error!");
                            console.error(error);
                        });

                        worker.on('exit', (code) => {
                            console.log("Worker exited! Code: ");
                            console.log(code);


                        });

                        worker.on('online', () => {
                            console.log("Worker is online");
                        });


                        let pathfinding_coords = [];
                        for(let c = 0; c < dirty.coords.length; c++) {
                            if(dirty.coords[c] && dirty.coords[c].tile_x >= dirty.coords[npc_coord_index].tile_x - 3 && dirty.coords[c].tile_x <= dirty.coords[npc_coord_index].tile_x + 3 &&
                                dirty.coords[c].tile_y >= dirty.coords[npc_coord_index].tile_y - 3 && dirty.coords[c].tile_y <= dirty.coords[npc_coord_index].tile_y + 3) {
                                pathfinding_coords.push(dirty.coords[c]);
                            }
                        }

                        worker_data = { 'coords': pathfinding_coords, 'npc': dirty.npcs[npc_index],
                            'origin_x': dirty.coords[npc_coord_index].tile_x, 'origin_y': dirty.coords[npc_coord_index].tile_y,
                            'destination_x': dirty.npc_tasks[task_index].destination_tile_x, 'destination_y': dirty.npc_tasks[task_index].destination_tile_y };

                        worker.postMessage(worker_data);

                    }

                } else if(dirty.npcs[npc_index].planet_coord_id) {

                    // For now with npcs, we're just going to skip the whole spaceport thing for launching
                    if(dirty.npc_tasks[task_index].destination_planet_id) {
                        console.log("NPC needs to launch from the planet!");
                        await movement.switchToGalaxyNpc(dirty, npc_index, task_index);
                    } else {
                        console.log("Npc is moving on planet");

                        let npc_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.npcs[npc_index].planet_coord_id });
                        let x_difference = Math.abs(dirty.planet_coords[npc_coord_index].tile_x - dirty.npc_tasks[task_index].destination_tile_x);
                        let y_difference = Math.abs(dirty.planet_coords[npc_coord_index].tile_y - dirty.npc_tasks[task_index].destination_tile_y);

                        if(x_difference === 0 && y_difference === 0) {
                            console.log("Player is already at destination");
                            delete dirty.npc_tasks[task_index];
                            //dirty.npc_tasks.splice(task_index, 1);

                            return;
                        }

                        let next_coord_index = -1;
                        let next_tile_x = dirty.planet_coords[npc_coord_index].tile_x;
                        let next_tile_y = dirty.planet_coords[npc_coord_index].tile_y;
                        let possible_next_moves = [];

                        if(x_difference !== 0) {
                            console.log("Current tile x: " + dirty.planet_coords[npc_coord_index].tile_x +
                                " Destination tile x: " + dirty.npc_tasks[task_index].destination_tile_x);
                            if(dirty.planet_coords[npc_coord_index].tile_x > dirty.npc_tasks[task_index].destination_tile_x) {

                                next_tile_x--;

                            } else {
                                next_tile_x++;
                            }

                            console.log("not at destination x. Trying to get coord at x,y: " + next_tile_x + "," + next_tile_y);

                            next_coord_index = await main.getPlanetCoordIndex({ 'planet_id': dirty.planet_coords[npc_coord_index].planet_id,
                                'planet_level': dirty.planet_coords[npc_coord_index].level, 'tile_x': next_tile_x, 'tile_y': next_tile_y });
                            if(next_coord_index !== -1) {
                                possible_next_moves.push( {'coord': dirty.planet_coords[next_coord_index], 'coord_index': next_coord_index });
                            }
                        }

                        // reset the next coord stuff
                        next_coord_index = -1;
                        next_tile_x = dirty.planet_coords[npc_coord_index].tile_x;
                        next_tile_y = dirty.planet_coords[npc_coord_index].tile_y;


                        if(y_difference !== 0) {
                            console.log("Current tile y: " + dirty.planet_coords[npc_coord_index].tile_y +
                                " Destination tile y: " + dirty.npc_tasks[task_index].destination_tile_y);
                            if(dirty.planet_coords[npc_coord_index].tile_y > dirty.npc_tasks[task_index].destination_tile_y) {
                                next_tile_y--;
                            } else {
                                next_tile_y++;
                            }

                            console.log("not at destination y. Trying to get coord at x,y: " + next_tile_x + "," + next_tile_y);

                            next_coord_index = await main.getPlanetCoordIndex({ 'planet_id': dirty.planet_coords[npc_coord_index].planet_id,
                                'planet_level': dirty.planet_coords[npc_coord_index].level, 'tile_x': next_tile_x, 'tile_y': next_tile_y });
                            if(next_coord_index !== -1) {
                                possible_next_moves.push( {'coord': dirty.planet_coords[next_coord_index], 'coord_index': next_coord_index });
                            }
                        }

                        // we just want one move, but we have up to 2 potential moves!
                        if(possible_next_moves.length === 0) {
                            log(chalk.magenta("PATHINFINDING TIME. No possible_next_moves. planet."));
                            return false;
                        }

                        let found_move = false;
                        for(let possible_move of possible_next_moves) {

                            let can_place_result = await main.canPlaceNpc('planet', dirty.planet_coords[possible_move.coord_index], 'npc', dirty.npcs[npc_index].id);
                            if(can_place_result) {
                                found_move = true;
                                await movement.movePlanetNpc(dirty, npc_index, task_index, possible_move.coord_index);
                            } else {
                                console.log("False on canPlaceNpc");
                            }
                        }

                        if(!found_move) {
                            log(chalk.magenta("PATHFINDING TIME! Could not find move. planet."));
                        }
                    }


                }


            }
        } catch(error) {
            log(chalk.red("Error in npc.performNpcTask: " + error));
            console.error(error);
        }
    }

    exports.performNpcTask = performNpcTask;


    async function setNpcStructure(dirty, npc_index) {

        let planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.npcs[npc_index].planet_id, 'source': 'game.setNpcStructure' });

        if(planet_index !== -1) {
            // Algae farm on azure planets
            if(dirty.planets[planet_index].planet_type_id === 16) {

                dirty.npcs[npc_index].current_structure_type_id = 1;
                dirty.npcs[npc_index].current_structure_type_is_built = false;
                dirty.npcs[npc_index].has_change = true;

            }
            // Start with a maggot farm on corporation planets
            else if(dirty.planets[planet_index].planet_type_id === 30) {

                dirty.npcs[npc_index].current_structure_type_id = 3;
                dirty.npcs[npc_index].current_structure_type_is_built = false;
                dirty.npcs[npc_index].dream_structure_type_id = 2;
                dirty.npcs[npc_index].has_change = true;

            }
        }

        await world.sendNpcInfo(false, "planet_" + dirty.npcs[npc_index].planet_id, dirty, dirty.npcs[npc_index].id);

    }

    exports.setNpcStructure = setNpcStructure;


    async function setNpcTask(dirty, npc_index) {
        try {

            //console.log("In setNpcTask");

            // If the npc has a current_structure_id but it's not built, lets make sure the npc has the things required
            // to build it

            if(dirty.npcs[npc_index].current_structure_type_id && !dirty.npcs[npc_index].current_structure_type_is_built &&
                dirty.npcs[npc_index].planet_coord_id) {
                tryToBuildStructure(dirty, npc_index);

            }
            /************** NPC MAINTAINS THEIR STRUCTURE ******************/
            else if(dirty.npcs[npc_index].current_structure_type_id && dirty.npcs[npc_index].current_structure_type_is_built) {

                // DREAM JOB NOT STRUCTURE
                if(dirty.npcs[npc_index].dream_job_id) {

                    let able_to_follow_dream = true;
                    let job_requirement_linkers = dirty.npc_job_requirement_linkers.filter(linker =>
                        linker.npc_job_id === dirty.npcs[npc_index].dream_job_id);
                    if(job_requirement_linkers.length > 0) {
                        for(let requirement_linker of job_requirement_linkers) {
                            let inventory_index = dirty.inventory_items.findIndex(function(obj) { return obj &&
                                obj.npc_id === dirty.npcs[npc_index].id && obj.object_type_id === requirement_linker.object_type_id; });

                            if(inventory_index === -1 || dirty.inventory_items[inventory_index].amount < requirement_linker.amount) {
                                able_to_follow_dream = false;
                            }
                        }
                    }

                    if(able_to_follow_dream) {


                        dirty.npcs[npc_index].current_job_id = dirty.npcs[npc_index].dream_job_id;
                        dirty.npcs[npc_index].current_structure_type_id = false;
                        dirty.npcs[npc_index].current_structure_type_is_built = false;

                        // see if the npc has more dreams!
                        let rand_dream = helper.getRandomIntInclusive(1,10);
                        // dream!
                        if(rand_dream <= 5) {
                            console.log("Npc is going to dream for yet another job!");
                            let possible_dream_jobs = dirty.job_linkers.filter(job_linker =>
                                job_linker.job_id === dirty.npcs[npc_index].current_job_id && job_linker.next_job_id);

                            if(possible_dream_jobs.length > 0) {
                                console.log("Current job has dream jobs");
                                let dream_job = possible_dream_jobs[Math.floor(Math.random()*possible_dream_jobs.length)];
                                console.log("Dream job is: " + dream_job.name);
                                dirty.npcs[npc_index].dream_job_id = dream_job.id;

                            }
                        } else {
                            console.log("Npc is not going to dream about a further job");
                        }

                        dirty.npcs[npc_index].has_change = true;
                        return;

                    }
                }

                // Can't do tickStructure here either due to placeObject
                //await tickStructure(dirty, npc_index);

                /*
                let able_to_follow_dream = false;
                // see if they have a dream structure, and if the requirement for it is met
                if(dirty.npcs[npc_index].dream_structure_type_id) {


                    let met_requirements = await metStructureRequirements(dirty, npc_index);

                    if(met_requirements) {
                        log(chalk.green("NPC id: " + dirty.npcs[npc_index].id + " met requirements to build dream structure"));
                        able_to_follow_dream = true;

                        // Step 1: delete any objects that they own
                        dirty.objects.forEach(function(obj, i) {
                            if(obj.npc_id === dirty.npcs[npc_index].id) {
                                console.log("NPC owns object id: " + obj.id);
                                deleteObject(io, pool, dirty, { 'object_index': i });
                            }
                        });

                        // set their current structure to the dream structure
                        dirty.npcs[npc_index].current_structure_type_id = dirty.npcs[npc_index].dream_structure_type_id;
                        dirty.npcs[npc_index].dream_structure_type_id = false;
                        dirty.npcs[npc_index].current_structure_type_is_built = false;
                        dirty.npcs[npc_index].has_change = true;
                        await world.sendNpcInfo(false, "planet_" + dirty.npcs[npc_index].planet_id, dirty, dirty.npcs[npc_index].id);
                        // TODO MULTI LEVEL DREAMS
                    } else {
                        console.log("NPC did not meet requirements to build dream structure yet");
                    }
                }

                if(!able_to_follow_dream) {
                    // otherwise they continue with their current structure.
                    // Npc already has a structure. They tend to it
                    //console.log("NPC already has structure. Now they tend to it");

                }

                */
            }
            /************************** NPC DOESN'T HAVE A STRUCTURE *****************************/
            else {

                if(dirty.npcs[npc_index].current_job_id === 3) {
                    doctorCode(dirty, npc_index);
                }
                // If we are a bug attack job, and we don't have a planet coord id, lets find a random planet to attack
                if(dirty.npcs[npc_index].current_job_id === 5) {
                    bugAttackCode(dirty, npc_index);


                } else if(dirty.npcs[npc_index].current_job_id === 6) {
                    slaverCode(dirty, npc_index);
                }
            }


        } catch(error) {
            log(chalk.red("Error in npc.setNpcTask: " + error));
        }
    }

    exports.setNpcTask = setNpcTask;

    async function slaverCode(dirty, npc_index) {
        try {

            // See if we have any slaves
            let current_slave_count = 0;
            for(let i = 0; i < dirty.npcs.length; i++) {

                // We manage this slave
                if(dirty.npcs[i] && dirty.npcs[i].enslaved_to_npc_id === dirty.npcs[npc_index].id) {
                    current_slave_count++;



                    let enslaved_task_index = dirty.npc_tasks.findIndex(function(obj) { return obj && obj.npc_id === dirty.npcs[i].id });

                    // Only nee to assign a  task if they don't already have a task
                    if(enslaved_task_index === -1) {
                        log(chalk.green("Enslaved npc doesn't have a task"));
                        // We manage this slave
                        // See if we need to tell them to head to the slaver planet
                        let need_to_send_to_slaver_planet = true;
                        if(dirty.npcs[i].planet_coord_id) {
                            let current_planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.npcs[i].planet_coord_id });
                            let planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.planet_coords[current_planet_coord_index].planet_id });
                            if(dirty.planets[planet_index].planet_type_id === 31) {
                                need_to_send_to_slaver_planet = false;
                            }
                        }

                        if(need_to_send_to_slaver_planet) {
                            let slaver_planet_index = dirty.planets.findIndex(function(obj) { return obj && obj.planet_type_id === 31; });
                            if(slaver_planet_index !== -1) {
                                let coord_index = dirty.coords.findIndex(function(obj) { return obj &&
                                    obj.planet_id === dirty.planets[slaver_planet_index].id; });

                                if(coord_index === -1) {
                                    console.log("Could not find the coord the planet is on");
                                    return false;
                                }


                                let destination_tile_x = dirty.coords[coord_index].tile_x;
                                let destination_tile_y = dirty.coords[coord_index].tile_y;

                                dirty.npc_tasks.push({ 'npc_id': dirty.npcs[npc_index].id, 'destination_tile_x': destination_tile_x,
                                    'destination_tile_y': destination_tile_y, 'destination_planet_id': dirty.planets[slaver_planet_index].id });

                                log(chalk.green("Told enslaved npc to go to the slaver planet"));
                            }
                        }
                    }


                }
            }

            // No slaves. Lets get one
            if(current_slave_count === 0) {
                // See if we are on a corporation planet
                let on_corporation_planet = false;
                if(dirty.npcs[npc_index].planet_coord_id) {
                    let planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.npcs[npc_index].planet_coord_id });
                    if(planet_coord_index !== -1) {
                        let planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.planet_coords[planet_coord_index].planet_id });
                        if(planet_index !== -1 && dirty.planets[planet_index].planet_type_id === 30) {
                            on_corporation_planet = true;
                        }
                    }
                }

                // Lets head to one
                if(on_corporation_planet === false) {
                    let possible_planets = dirty.planets.filter(planet_filter => planet_filter.planet_type_id === 30);
                    let chosen_planet = possible_planets[Math.floor(Math.random()*possible_planets.length)];

                    if(!chosen_planet) {
                        log(chalk.yellow("No corporation planets in memory"));
                        return false;
                    }

                    let chosen_planet_coord_index = dirty.coords.findIndex(function(obj) { return obj &&
                        obj.planet_id === chosen_planet.id; });

                    if(chosen_planet_coord_index === -1) {
                        console.log("Could not find the coord the planet is on");
                        return false;
                    }


                    let destination_tile_x = dirty.coords[chosen_planet_coord_index].tile_x;
                    let destination_tile_y = dirty.coords[chosen_planet_coord_index].tile_y;

                    dirty.npc_tasks.push({ 'npc_id': dirty.npcs[npc_index].id, 'destination_tile_x': destination_tile_x,
                        'destination_tile_y': destination_tile_y, 'destination_planet_id': chosen_planet.id });

                    log(chalk.cyan("Destination set! Poor planet!"));
                }
                // We're on a corporation planet! Try to find an NPC
                else {
                    let npc_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.npcs[npc_index].planet_coord_id });

                    if(npc_coord_index === -1) {
                        log(chalk.yellow("Could not get planet coord index for the npc"));
                        return false;

                    }


                    // Go through the -1 to +1 seeing if there's a coord with and npc to enslave
                    for(let x = dirty.planet_coords[npc_coord_index].tile_x - 1; x <= dirty.planet_coords[npc_coord_index].tile_x + 1; x++) {
                        for(let y = dirty.planet_coords[npc_coord_index].tile_y - 1; y <= dirty.planet_coords[npc_coord_index].tile_y + 1; y++) {
                            let planet_coord_index = await main.getPlanetCoordIndex({ 'planet_id': dirty.planet_coords[npc_coord_index].planet_id,
                                'planet_level': dirty.planet_coords[npc_coord_index].level, 'tile_x': x, 'tile_y': y });

                            if(planet_coord_index !== -1) {
                                if(dirty.planet_coords[planet_coord_index].npc_id && dirty.planet_coords[planet_coord_index].npc_id !== dirty.npcs[npc_index].id) {
                                    log(chalk.green("Slaver found a potential victim"));
                                    let being_enslaved_npc_index = await main.getNpcIndex(dirty.planet_coords[planet_coord_index].npc_id);
                                    if(being_enslaved_npc_index !== -1) {
                                        world.enslave(false, dirty, { 'slaver_npc_index': npc_index, 'being_enslaved_npc_index': being_enslaved_npc_index });
                                    }




                                }
                            }
                        }
                    }

                    // and randomly move
                    moveRandom(dirty, npc_index);

                }
            }


        } catch(error) {
            log(chalk.red("Error in npc.slaverCode: " + error));
            console.error(error);
        }
    }

    exports.slaverCode = slaverCode;


    // In data: npc_job_id
    async function spawnNpc(dirty, data = false) {
        try {

            log(chalk.green("\n Spawning NPC"));

            let possible_names = ['Aganon','Cheris','Dezken','Encaledus','Ethra','Farosh','Grax','Grum','Gruss','Hish','Hiul','Issash','Kirix','Kujen','Laru','Liozh',
                'Mak','Mikodez','Okik','Raasek','Rahal','Rosk',
                'Sissix','Tkrit','Tokamak','Toum'];


            // 1. GIVE THE NPC A RANDOM STARTER JOB

            let starter_job = false;
            if(!data.npc_job_id) {
                console.log("giving npc a random starter job");
                let starter_jobs = dirty.npc_jobs.filter(job => job.is_starter);


                starter_job = starter_jobs[Math.floor(Math.random()*starter_jobs.length)];
            } else {
                console.log("Npc is being spawned with a specific job");
                let starter_job_index = dirty.npc_jobs.findIndex(function(obj) { return obj && obj.id === parseInt(data.npc_job_id); });
                starter_job = dirty.npc_jobs[starter_job_index];
            }


            console.log("Starting an NPC with the job: " + starter_job.name);

            // If this job has a structure, we put that as their current_structure_type_id
            let starting_structure_id = 0;
            let structure_linker_index = dirty.job_linkers.findIndex(function(obj) { return obj && obj.job_id === starter_job.id &&
                obj.structure_type_id; });

            if(structure_linker_index !== -1) {
                console.log("Job has a npc structure linker");
                starting_structure_id = dirty.job_linkers[structure_linker_index].structure_type_id;
            }


            let [result] = await (pool.query("INSERT INTO npcs(attack_strength, name, current_hp, current_job_id, " +
                "current_structure_type_id,  max_hp)VALUES(?, ?, ?, ?, ?, ?)",
                [5, possible_names[Math.floor(Math.random()*possible_names.length)], 100, starter_job.id,
                    starting_structure_id,  100]));


            if(!result) {
                log(chalk.yellow("Failed to insert npc"));
                return false;
            }

            let new_id = result.insertId;

            //console.log("Got new npc id: " + new_id);
            let npc_index = await main.getNpcIndex(new_id);

            if(npc_index === -1) {
                log(chalk.yellow("Was unable to get npc index for npc id: " + new_id));
                return false;
            }

            // Depending on the job, the npc might have a ship!
            // Bug attack - we get a big ol' bug ship!
            if(starter_job.id === 5) {

                console.log("Creating a ship for npc id: " + dirty.npcs[npc_index].id);
                let new_ship_id = await world.insertObjectType(false, dirty, { 'object_type_id': 260, 'npc_id': dirty.npcs[npc_index].id });
                let new_ship_index = await main.getObjectIndex(new_ship_id);
                dirty.npcs[npc_index].ship_id = new_ship_id;
                dirty.npcs[npc_index].has_change = true;

                // I believe this is being taken care of in world.insertObjectType
                //await world.generateShip(dirty, new_ship_index);

                // and give the ship the rule, 'attack all players'
                await world.addRule(false, dirty, { 'object_id': dirty.objects[new_ship_index].id, 'new_rule': 'attack_all_players' });


            }



            // 2. SEE IF THE NPC IS GOING TO HAVE A DREAM JOB
            let rand_dream = helper.getRandomIntInclusive(1,10);
            // dream!
            if(rand_dream <= 5) {
                console.log("Spawning npc is going to dream for another job!");
                let possible_dream_jobs = dirty.job_linkers.filter(job_linker =>
                    job_linker.job_id === dirty.npcs[npc_index].current_job_id && job_linker.next_job_id);

                if(possible_dream_jobs.length > 0) {
                    console.log("Current job has dream jobs");
                    let dream_job = possible_dream_jobs[Math.floor(Math.random()*possible_dream_jobs.length)];
                    console.log("Dream job is: " + dream_job.name);
                    dirty.npcs[npc_index].dream_job_id = dream_job.id;
                    dirty.npcs[npc_index].has_change = true;

                }
            } else {
                console.log("Npc is not going to dream about a further job");
            }

            // 3. PLACE THE NPC
            console.log("Placing npc on a galaxy coord. Getting a random one");
            // get a random galaxy coord, and try to place the player there
            let placed_npc = false;
            let max_tries = 100;
            let current_tries = 1;

            while(!placed_npc && current_tries < max_tries) {
                let random_x = Math.floor(Math.random() * 20);
                let random_y = Math.floor(Math.random() * 20);

                let coord_data = { 'tile_x': random_x, 'tile_y': random_y};
                let coord_index = await main.getCoordIndex(coord_data);
                let can_place = await main.canPlaceNpc('galaxy', dirty.coords[coord_index], dirty.npcs[npc_index].id) ;
                if(can_place) {
                    console.log("Found galaxy coord to place npc on! (index: " + coord_index + " id: " +
                        dirty.coords[coord_index].id + " tile_x: " + dirty.coords[coord_index].tile_x +
                        " tile_y: " + dirty.coords[coord_index].tile_y);
                    let coord_data = { 'coord_index': coord_index, 'npc_id': dirty.npcs[npc_index].id };

                    // If the npc has a ship, we update the object_id of the coord too
                    if(dirty.npcs[npc_index].ship_id) {
                        coord_data.object_id = dirty.npcs[npc_index].ship_id;
                    }
                    await main.updateCoordGeneric(false, coord_data);
                    placed_npc = true;

                    dirty.npcs[npc_index].coord_id = dirty.coords[coord_index].id;
                    dirty.npcs[npc_index].has_change = true;

                    await world.sendNpcInfo(false, "galaxy", dirty, dirty.npcs[npc_index].id);
                }
            }



        } catch(error) {
            log(chalk.red("Error in game.spawnNpc: " + error));
        }
    }

    exports.spawnNpc = spawnNpc;

    async function tickNpcSkills(dirty) {

        try {

            for(let i = 0; i < dirty.npcs.length; i++) {
                if(dirty.npcs[i]) {

                    // increase a skill based on a job
                    if(dirty.npcs[i].current_job_id === 3) {
                        dirty.npcs[i].surgery_skill_points++;
                        dirty.npcs[i].has_change = true;
                    }

                }
            }

        } catch(error) {
            log(chalk.red("Error in npc.tickNpcSkills: " + error));
            console.error(error);
        }

    }

    exports.tickNpcSkills = tickNpcSkills;

    async function tryToBuildStructure(dirty, npc_index) {
        try {
            //console.log("Npc has a structure it wants to build, but hasn't built yet");

            // go through the requirements, and if we don't meet one, work towards meeting it!
            let requirement_linkers = dirty.structure_type_requirement_linkers.filter(linker =>
                linker.structure_type_id === dirty.npcs[npc_index].current_structure_type_id);

            let met_all_requirements = true;
            if (requirement_linkers.length > 0) {
                //console.log("Structure has requirement linkers");
                for (let requirement_linker of requirement_linkers) {

                    //console.log("Requires " + requirement_linker.amount + " of " + requirement_linker.object_type_id);

                    // see if the npc has this in their inventory
                    let inventory_item_index = dirty.inventory_items.findIndex(function (obj) {
                        return obj &&
                            obj.npc_id === dirty.npcs[npc_index].id && obj.object_type_id === requirement_linker.object_type_id;
                    });

                    if (inventory_item_index === -1 || dirty.inventory_items[inventory_item_index].amount < requirement_linker.amount) {

                        met_all_requirements = false;

                        // WE NEED TO FIND SOME ALGAE!!!!!
                        if (requirement_linker.object_type_id === 68) {

                            console.log("Npc needs more algae!");

                            dirty.npcs[npc_index].wants_object_type_id = 68;
                            dirty.npcs[npc_index].has_change = true;

                            if (inventory_item_index === -1) {
                                console.log("Have no algae yet");
                            } else {
                                console.log("Have: " + dirty.inventory_items[inventory_item_index].amount + " and need: " + requirement_linker.amount);
                            }

                            if (!dirty.npcs[npc_index].planet_coord_id) {
                                console.log("Npc doesn't have a planet coord yet. Finding azure planets.");


                                // Algae farmer. Lets find the galaxy coord of an azure planet
                                let azure_planets = dirty.planets.filter(planet_filter => planet_filter.planet_type_id === 16);

                                if (azure_planets.length === 0) {
                                    console.log("No azure planets... MEMORY????");
                                    return;
                                }

                                let random_azure_planet = false;
                                if (azure_planets.length === 1) {
                                    random_azure_planet = azure_planets[0];
                                } else {
                                    random_azure_planet = azure_planets[Math.floor(Math.random() * azure_planets.length)];
                                }


                                console.log("Npc is going to try and get to azure planet id: " + random_azure_planet.id);

                                let coord_index = await main.getCoordIndex({'coord_id': random_azure_planet.coord_id});

                                dirty.npc_tasks.push({
                                    'npc_id': dirty.npcs[npc_index].id,
                                    'destination_tile_x': dirty.coords[coord_index].tile_x,
                                    'destination_tile_y': dirty.coords[coord_index].tile_y,
                                    'destination_planet_id': random_azure_planet.id
                                });

                                console.log("\nPushed npc task:");
                                console.log("destination_tile_x: " + dirty.coords[coord_index].tile_x + ", destination_tile_y: " + dirty.coords[coord_index].tile_y);


                            } else {
                                console.log("Algae farmer has a planet coord id!");

                                let npc_coord_index = await main.getPlanetCoordIndex({
                                    'planet_coord_id': dirty.npcs[npc_index].planet_coord_id
                                });

                                // see if there's an algae pad around us - harvest it if so
                                //console.log("Seeing if we can harvest a tile immediately around us");
                                //console.time("npc-search");
                                let surrounding_tiles = [];
                                let harvesting_coord_index = -1;
                                for (let x = dirty.planet_coords[npc_coord_index].tile_x - 1; x <= dirty.planet_coords[npc_coord_index].tile_x + 1; x++) {
                                    for (let y = dirty.planet_coords[npc_coord_index].tile_y - 1; y <= dirty.planet_coords[npc_coord_index].tile_y + 1; y++) {
                                        if (harvesting_coord_index === -1) {
                                            let other_coord_index = await main.getPlanetCoordIndex({
                                                'planet_id': dirty.planet_coords[npc_coord_index].planet_id,
                                                'planet_level': dirty.planet_coords[npc_coord_index].level,
                                                'tile_x': x,
                                                'tile_y': y
                                            });

                                            if (other_coord_index) {
                                                if (dirty.planet_coords[other_coord_index].object_type_id === 69) {
                                                    let object_index = await main.getObjectIndex(dirty.planet_coords[other_coord_index].object_id);
                                                    if (object_index !== -1 && dirty.objects[object_index].has_spawned_object) {
                                                        harvesting_coord_index = other_coord_index;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                //console.timeEnd("npc-search");

                                if (harvesting_coord_index !== -1) {
                                    console.log("Found something to harvest around us");
                                    await npcPickUp(dirty, npc_index, harvesting_coord_index);
                                    return;
                                }


                                // otherwise, lets find some algae to harvest

                                // see if there's any algae pads visible
                                let algae_pad_coords = dirty.planet_coords.filter(planet_coord =>
                                    planet_coord.planet_id === dirty.planet_coords[npc_coord_index].planet_id &&
                                    planet_coord.level === 0 && planet_coord.object_type_id === 69);

                                if (algae_pad_coords.length > 0) {
                                    console.log("NPC sees algae pads");

                                    let closest_coord_index = -1;
                                    let closest_distance = 100;

                                    for (let coord of algae_pad_coords) {
                                        let coord_object = await main.getObjectIndex(coord.object_id);

                                        // It's a candidate
                                        if (dirty.objects[coord_object].has_spawned_object) {
                                            let total_distance = Math.abs(dirty.planet_coords[npc_coord_index].tile_x - coord.tile_x) +
                                                Math.abs(dirty.planet_coords[npc_coord_index].tile_y - coord.tile_y);

                                            if (total_distance < closest_distance) {

                                                let coord_index = await main.getPlanetCoordIndex({'planet_coord_id': coord.id});
                                                let can_place_npc = await main.canPlaceNpc('planet', dirty.planet_coords[coord_index], dirty.npcs[npc_index].id);
                                                if (can_place_npc) {
                                                    closest_coord_index = coord_index;
                                                    closest_distance = total_distance;
                                                }

                                            }

                                        }

                                    }


                                    if (closest_coord_index !== -1) {
                                        console.log("Closest full algae pad is " + closest_distance + " tiles away");


                                        dirty.npc_tasks.push({
                                            'npc_id': dirty.npcs[npc_index].id,
                                            'destination_tile_x': dirty.planet_coords[closest_coord_index].tile_x,
                                            'destination_tile_y': dirty.planet_coords[closest_coord_index].tile_y,
                                        });

                                    } else {
                                        console.log("Did not find any algae pads with algae");
                                    }

                                } else {
                                    console.log("Could not find any algae pads");
                                }


                            }
                        } else if (requirement_linker.object_type_id === 144) {
                            //console.log("Npc needs more maggots!");

                            dirty.npcs[npc_index].wants_object_type_id = 144;
                            dirty.npcs[npc_index].has_change = true;

                            if (!dirty.npcs[npc_index].planet_coord_id) {
                                //console.log("Npc doesn't have a planet coord yet. Finding corporation planets.");


                                // Maggot farmer. Lets find the galaxy coord of a corporation planet
                                let corporation_planets = dirty.planets.filter(planet_filter => planet_filter.planet_type_id === 30);

                                if (corporation_planets.length === 0) {
                                    log(chalk.yellow("No corporation planets... MEMORY????"));
                                    return;
                                }

                                let random_planet = false;
                                if (corporation_planets.length === 1) {
                                    random_planet = corporation_planets[0];
                                } else {
                                    random_planet = corporation_planets[Math.floor(Math.random() * corporation_planets.length)];
                                }


                                //console.log("Npc is going to try and get to corporation planet id: " + random_planet.id);

                                let coord_index = await main.getCoordIndex({'coord_id': random_planet.coord_id});

                                dirty.npc_tasks.push({
                                    'npc_id': dirty.npcs[npc_index].id,
                                    'destination_tile_x': dirty.coords[coord_index].tile_x,
                                    'destination_tile_y': dirty.coords[coord_index].tile_y,
                                    'destination_planet_id': random_planet.id
                                });

                                console.log("\nPushed npc task:");
                                console.log("destination_tile_x: " + dirty.coords[coord_index].tile_x + ", destination_tile_y: " + dirty.coords[coord_index].tile_y);


                            } else {
                                //console.log("Maggot farmer has a planet coord id!");

                                let npc_coord_index = await main.getPlanetCoordIndex({
                                    'planet_coord_id': dirty.npcs[npc_index].planet_coord_id
                                });

                                if (npc_coord_index === -1) {
                                    log(chalk.yellow("Something is wrong with the planet coord the npc is on. planet_coord_id: " + dirty.npcs[npc_index].planet_coord_id));
                                    return false;
                                }

                                // see if there's a geno rat around us - attack it if so
                                //console.log("Seeing if we can pick up some maggots or attack a geno rat immediately around us");
                                //console.time("npc-search");
                                let surrounding_tiles = [];
                                let attacking_monster = false;
                                let npc_search_tiles = 2;

                                for (let x = dirty.planet_coords[npc_coord_index].tile_x - npc_search_tiles; x <= dirty.planet_coords[npc_coord_index].tile_x + npc_search_tiles; x++) {
                                    for (let y = dirty.planet_coords[npc_coord_index].tile_y - npc_search_tiles; y <= dirty.planet_coords[npc_coord_index].tile_y + npc_search_tiles; y++) {
                                        if (!attacking_monster) {
                                            //console.log("X,Y:" + x + "," + y);

                                            let planet_coord_data = {
                                                'planet_id': dirty.planet_coords[npc_coord_index].planet_id,
                                                'planet_level': dirty.planet_coords[npc_coord_index].level,
                                                'tile_x': x,
                                                'tile_y': y
                                            };
                                            //console.log("Planet coord data before sending it:");
                                            //console.log(planet_coord_data);
                                            let other_coord_index = await main.getPlanetCoordIndex(planet_coord_data);

                                            if (other_coord_index === -1) {
                                                //console.log("Could not find planet coord");
                                            } else {

                                                // Npc should pick it up
                                                if (dirty.planet_coords[other_coord_index].object_type_id === 144) {
                                                    npcPickUp(dirty, npc_index, other_coord_index);
                                                }

                                                if (dirty.planet_coords[other_coord_index].monster_id) {

                                                    let monster_index = await main.getMonsterIndex(dirty.planet_coords[other_coord_index].monster_id);

                                                    if (monster_index !== -1 && dirty.monsters[monster_index].monster_type_id === 31) {

                                                        let npc_battle_linker_data = {
                                                            'attacking_id': dirty.npcs[npc_index].id,
                                                            'attacking_type': 'npc',
                                                            'being_attacked_id': dirty.monsters[monster_index].id,
                                                            'being_attacked_type': 'monster'
                                                        };

                                                        world.addBattleLinker(io, socket, dirty, npc_battle_linker_data);

                                                        attacking_monster = true;
                                                    }

                                                }
                                            }
                                        }
                                    }
                                }


                                // otherwise, lets just move around

                                moveRandom(dirty, npc_index);


                            }
                        }

                    }
                }
            }


            // we can try to build the structure
            if (met_all_requirements) {
                console.log("Npc id: " + dirty.npcs[npc_index].id + " met all the requirements to build structure id: " +
                    dirty.npcs[npc_index].current_structure_type_id + " !");

                let structure_linkers = dirty.structure_type_linkers.filter(
                    linker => linker.structure_type_id === dirty.npcs[npc_index].current_structure_type_id);

                let can_build_result = await canBuildStructure(dirty, npc_index, structure_linkers);

                if (can_build_result === true) {


                    // We can't put buildStructure in npc.js because it's going to be placing objects, which requires
                    // TONS of game functions - So we set a temporary in memory flag, can_build_structure
                    dirty.npcs[npc_index].can_build_structure = true;
                    return;

                    /*
                    await buildStructure(dirty, npc_index, structure_linkers);

                    dirty.npcs[npc_index].current_structure_type_is_built = true;
                    dirty.npcs[npc_index].has_change = true;
                    */

                } else {
                    console.log("But we can't build there. Moving randomly");


                    moveRandom(dirty, npc_index);


                }


            }
        } catch (error) {
            log(chalk.red("Error in npc.tryToBuildStructure: " + error));
            console.error(error);
        }
    }

    module.exports = {
        npcActions,
        tickNpcSkills
    }