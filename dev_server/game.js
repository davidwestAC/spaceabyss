//@ts-check
var io_handler = require('./io.js');
var io = io_handler.io;
var database = require('./database.js');
var pool = database.pool;
const chalk = require('chalk');
const log = console.log;
const { v1: uuidv1 } = require('uuid');

const event = require('./event.js');
const game_object = require('./game_object.js');
const helper = require('./helper.js');
const inventory = require('./inventory.js');
const main = require('./space_abyss' + process.env.FILE_SUFFIX + '.js');
const map = require('./map.js');
const monster = require('./monster.js');
const movement = require('./movement.js');
const npc = require('./npc.js');
const planet = require('./planet.js');
const player = require('./player.js');
const world = require('./world.js');



    // I'm kind of making this function a little more general - so the system can build structures, not just npcs
    //  data:   structure_type_id   |   npc_index   |   is_forced   |   starting_tile_x   |   starting_tile_y   |   starting_level   |   planet_id   |   player_index

    async function buildStructure(dirty, data) {

        try {

            data.structure_type_id = parseInt(data.structure_type_id);

            log(chalk.green("Structure is being built"));

            let structure_index = -1;

            // Lets insert a structure, so we can give the coords a structure id for fast tear down if needed
            let sql = "";
            let inserts = [];
            if(typeof data.npc_index !== 'undefined' && data.npc_index !== -1) {
                sql = "INSERT INTO structures(npc_id, structure_type_id) VALUES(?, ?)";
                inserts = [dirty.npcs[data.npc_index].id, data.structure_type_id];
            } else if(typeof data.player_index !== 'undefined' && data.player_index !== -1) {
                console.log("Structure is associated with a player");
                sql = "INSERT INTO structures(player_id, structure_type_id) VALUES(?, ?)";
                inserts = [dirty.players[data.player_index].id, data.structure_type_id];
            } else {
                sql = "INSERT INTO structures(structure_type_id) VALUES(?)";
                inserts = [data.structure_type_id];
            }

            let [result] = await (pool.query(sql,
                inserts));

            let new_structure_id = result.insertId;

            // Gotta get the new structure and put it in dirty!
            let [rows, fields] = await (pool.query("SELECT * FROM structures WHERE id = ?", [new_structure_id]));
            if(rows[0]) {
                let new_structure = rows[0];
                new_structure.has_change = false;
                structure_index = dirty.structures.push(new_structure);

            }



            let structure_linkers = dirty.structure_type_linkers.filter(
                linker => linker.structure_type_id === data.structure_type_id);

            console.log("Got new structure id as: " + new_structure_id + " Found " + structure_linkers.length + " structure_type_linkers");

            let starting_tile_x = 0;
            let starting_tile_y = 0;
            let starting_level = 0;
            let planet_id = 0;




            // If we have an npc_index sent in, we move them around accordingly
            let npc_coord_index = -1;
            if(typeof data.npc_index !== 'undefined' && data.npc_index !== -1) {

                npc_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.npcs[data.npc_index].planet_coord_id });

                starting_tile_x = dirty.planet_coords[npc_coord_index].tile_x;
                starting_tile_y = dirty.planet_coords[npc_coord_index].tile_y;
                starting_level = dirty.planet_coords[npc_coord_index].level;
                planet_id = dirty.planet_coords[npc_coord_index].planet_id;


            } else {
                starting_tile_x = data.starting_tile_x;
                starting_tile_y = data.starting_tile_y;
                starting_level = data.starting_level;
                planet_id = data.planet_id;
            }





            structure_linkers.forEach(await async function(structure_linker, i) {

                try {
                    let tile_x = starting_tile_x + structure_linker.position_x;
                    let tile_y = starting_tile_y + structure_linker.position_y;
                    let planet_level = starting_level + structure_linker.level;


                    let planet_coord_data = { 'planet_id': planet_id,
                        'planet_level': planet_level,
                        'tile_x': tile_x, 'tile_y': tile_y, 'can_insert': true };
                    let checking_coord_index = await main.getPlanetCoordIndex(planet_coord_data);

                    //console.log("Going to try and put part of the structure at level/x/y/ " + planet_level + "/" + tile_x + "/" + tile_y);

                    if(checking_coord_index === -1) {
                        console.log("Could not find a planet coord at tile_x,y: " + tile_x + "," + tile_y);
                        return false;
                    }


                    let can_place_object_result =  game_object.canPlace(dirty, 'planet', dirty.planet_coords[checking_coord_index],
                        { 'object_type_id': structure_linker.object_type_id });

                    if( (data.is_forced && data.is_forced === true) || can_place_object_result) {

                        //console.log("Building structure linker");

                        // If it's forced, and there is an existing object/object_type_id, monster spawn - we remove it
                        if(data.is_forced && data.is_forced === true) {

                            if(dirty.planet_coords[checking_coord_index].object_id) {
                                let object_index = await game_object.getIndex(dirty, dirty.planet_coords[checking_coord_index].object_id);
                                if(object_index !== -1) {
                                    await game_object.deleteObject(dirty, { 'object_index': object_index, 'reason': "Forced in game.buildStructure" });
                                }

                            } else if(dirty.planet_coords[checking_coord_index].object_type_id) {
                                dirty.planet_coords[checking_coord_index].object_type_id = false;
                                dirty.planet_coords[checking_coord_index].has_change = true;
                            }

                            // Moving forward, I believe we'll only use spawns_monster_type_id on planet coords for more specific unique/boss/event
                            // monsters. So instead of removing the spawns_monster_type_id, we'll just let the spawn fail.
                            //if(dirty.planet_coords[checking_coord_index].spawns_monster_type_id) {
                            //    dirty.planet_coords[checking_coord_index].spawns_monster_type_id = false;
                            //    dirty.planet_coords[checking_coord_index].has_change = true;
                            //}
                        }

                        // lets build it!
                        if(structure_linker.object_type_id && structure_linker.object_type_id !== false) {
                            let insert_object_type_data = { 'object_type_id': structure_linker.object_type_id };

                            if(typeof data.npc_index !== 'undefined' && data.npc_index !== -1) {
                                insert_object_type_data.npc_id = dirty.npcs[data.npc_index].id;
                            } else if(typeof data.player_index !== 'undefined' && data.player_index !== -1) {
                                insert_object_type_data.player_id = dirty.players[data.player_index].id;
                            }

                            let new_object_index = await world.insertObjectType(false, dirty, insert_object_type_data);

                            await game_object.place(false, dirty, { 'object_index': new_object_index,
                                'planet_coord_index': checking_coord_index });
                            //await world.addObjectToPlanetCoord(dirty, new_object_index, checking_coord_index);
                            await world.objectFindTarget(dirty, new_object_index);
                        }

                        if(structure_linker.floor_type_id) {
                            dirty.planet_coords[checking_coord_index].floor_type_id = structure_linker.floor_type_id;
                            dirty.planet_coords[checking_coord_index].has_change = true;
                        }

                        dirty.planet_coords[checking_coord_index].structure_id = new_structure_id;
                        dirty.planet_coords[checking_coord_index].has_change = true;

                        // This is going to automatically be part of an area
                        // Currently there isn't the ability for anyone but Cadian to create a structure with areas in it.
                        if(structure_linker.area_name) {
                            console.log("Structure linker has an area_name!");
                            // See if there is already an area with this name
                            let area_index = dirty.areas.findIndex(function(obj) { return obj && obj.owner_id === 4 && obj.name === structure_linker.area_name; });

                            if(area_index === -1) {
                                let cadian_index = await player.getIndex(dirty, { 'id': 4});
                                createArea(false, dirty, structure_linker.area_name, cadian_index, true);
                            }

                        }


                    }

                    // This is where the structure has us placing the npc
                    if(structure_linker.place_npc === true && typeof data.npc_index !== 'undefined' && data.npc_index !== -1) {
                        // Lets move the NPC up there
                        await main.updateCoordGeneric(false, {'planet_coord_index': npc_coord_index, 'npc_id': false });
                        await main.updateCoordGeneric(false,  {'planet_coord_index': new_npc_coord_index, 'npc_id': dirty.npcs[data.npc_index].id });

                        dirty.npcs[data.npc_index].planet_coord_id = dirty.planet_coords[new_npc_coord_index].id;
                        dirty.npcs[data.npc_index].has_change = true;


                        world.sendNpcInfo(false, "planet_" + dirty.planet_coords[npc_coord_index].planet_id, dirty, dirty.npcs[data.npc_index].id);
                    }

                    // send the updated coord to the room
                    await planet.sendCoordInfo(false, "planet_" + dirty.planet_coords[checking_coord_index].planet_id, dirty,
                        { 'planet_coord_index': checking_coord_index });


                } catch(error) {
                    log(chalk.red("Error in game.buildStructure - going through linkers: " + error));
                    console.error(error);
                }


            });



        } catch(error) {
            log(chalk.red("Error in game.buildStructure: " + error));
            console.error(error);
        }

    }
    exports.buildStructure = buildStructure;


    /*
            object_id   |   inventory_item_index   |   planet_coord_index   |   ship_coord_index

            Things we add to planets in the placeAI function need to have counterparts in game.destroyObject (when an AI is destroyed)
     */
    async function placeAI(socket, dirty, data) {
        try {
            log(chalk.green("Attempting to place AI!"));

            let object_index = await game_object.getIndex(dirty, data.object_id);

            if(object_index === -1) {
                return false;
            }

            let player_index = await player.getIndex(dirty, { 'player_id': socket.player_id });

            let planet_index = -1;
            let ship_index = -1;

            if(data.planet_coord_index) {
                // lets get our planet. Make sure it's not azure, or already has an AI
                planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.planet_coords[data.planet_coord_index].planet_id, 'source': 'game.placeAI' });

                if(planet_index === -1) {
                    return false;
                }

                if(dirty.planets[planet_index].ai_id) {
                    socket.emit('chat', { 'message': "There is another AI here currently. You need to remove or destroy it to place yours"});
                    return false;
                }

            } else if(data.ship_coord_index) {
                ship_index = await game_object.getIndex(dirty, dirty.ship_coords[data.ship_coord_index].ship_id);

                if(ship_index === -1) {
                    return false;
                }

                if(dirty.objects[ship_index].ai_id) {
                    socket.emit('chat', { 'message': "There is another AI here currently. You need to remove or destroy it to place yours"});
                    return false;
                }
            }


            if(data.planet_coord_index) {
                await main.updateCoordGeneric(socket, { 'planet_coord_index': data.planet_coord_index,
                    'object_index': object_index });


                // The planet is now owned!
                dirty.planets[planet_index].player_id = socket.player_id;
                dirty.planets[planet_index].ai_id = dirty.objects[object_index].id;
                dirty.planets[planet_index].has_change = true;

                // Make sure the AI has the planet_id
                dirty.objects[object_index].planet_id = dirty.planets[planet_index].id;
                dirty.objects[object_index].has_change = true;


                // Sending this to everyone. Taking over a planet seems like a worthy thing to send to everyone
                // planet.sendInfo doesn't yet support global sends
                io.emit('planet_info', { 'planet': dirty.planets[planet_index] });
                io.emit('chat', {'scope': 'global',
                    'message': dirty.players[player_index].name + " has conquered the planet " + dirty.planets[planet_index].name });

                await world.addPlayerLog(dirty, player_index, dirty.players[player_index].name + " has taken over planet " + dirty.planets[planet_index].name, 
                    { 'planet_id': dirty.planets[planet_index].id });
            } else if(data.ship_coord_index) {
                await main.updateCoordGeneric(socket, { 'ship_coord_index': data.ship_coord_index, 'object_index': object_index });


                dirty.objects[ship_index].player_id = socket.player_id;
                dirty.objects[ship_index].ai_id = dirty.objects[object_index].id;
                dirty.objects[ship_index].has_change = true;

                log(chalk.cyan("Should have set ai_id for the ship!"));

                // Make sure the AI has the ship_id
                dirty.objects[object_index].ship_id = dirty.objects[ship_index].id;
                dirty.objects[object_index].has_change = true;

                // Sending this to everyone. Taking over a planet seems like a worthy thing to send to everyone
                // planet.sendInfo doesn't yet support global sends
                io.emit('object_info', { 'object': dirty.objects[ship_index] });
                io.emit('chat', {'scope': 'global', 'message': dirty.players[player_index].name + " has conquered a ship" });
                world.addPlayerLog(dirty, player_index, dirty.players[player_index].name + " has taken over ship " + dirty.objects[ship_index].name, 
                { 'ship_id': dirty.objects[ship_index].id } );
            }
        } catch(error) {
            log(chalk.red("Error in game.placeAI: " + error));
            console.error(error);
        }

    }

    exports.placeAI = placeAI;


    async function placeOnShip(socket, dirty, object_type_id, amount) {

        try {

            let placed = false;

            // Find a ship coord to place it on!'
            for(let i = 0; i < dirty.ship_coords.length && placed === false; i++) {
                if(dirty.ship_coords[i] && dirty.ship_coords[i].ship_id === dirty.players[socket.player_index].ship_id) {


                    // If it's not ice, look for a bulk container
                    if(!placed && dirty.ship_coords[i].object_id && dirty.ship_coords[i].object_type_id === 329 && object_type_id !== 331 ) {
                        let adding_to_data = {
                            'adding_to_type': 'object',
                            'adding_to_id': dirty.ship_coords[i].object_id,
                            'object_type_id': object_type_id,
                            'amount': amount
                        };

                        await inventory.addToInventory(socket, dirty, adding_to_data);
                        placed = true;

                    }

                    // Ice container for ice!
                    if(!placed && dirty.ship_coords[i].object_id && dirty.ship_coords[i].object_type_id === 330 && object_type_id  === 331 ) {
                        let adding_to_data = {
                            'adding_to_type': 'object',
                            'adding_to_id': dirty.ship_coords[i].object_id,
                            'object_type_id': object_type_id,
                            'amount': amount
                        };

                        await inventory.addToInventory(socket, dirty, adding_to_data);
                        placed = true;

                    }



                }
            }



            // If there wasn't a a container, find a floor coord
            for(let i = 0; i < dirty.ship_coords.length && placed === false; i++) {
                if (dirty.ship_coords[i] && dirty.ship_coords[i].ship_id === dirty.players[socket.player_index].ship_id) {
                    if(!dirty.ship_coords[i].object_id && !dirty.ship_coords[i].object_type_id) {
                        let can_place_result = await game_object.canPlace(dirty, 'ship', dirty.ship_coords[i], { 'object_type_id': object_type_id });

                        if(can_place_result === true) {
                            await main.updateCoordGeneric(socket, { 'ship_coord_index': i, 'object_type_id': object_type_id, 'amount': amount });
                            placed = true;

                            console.log("Found empty floor coord");
                        }
                    }
                }
            }

            return placed;
        } catch(error) {
            log(chalk.red("Error in game.placeOnShip: " + error));
            console.error(error);
        }

    }


    /**
     *
     * @param {Object} socket
     * @param {Object} dirty
     * @param {number} object_index
     * @param {Object} data
     * @param {number=} data.planet_coord_index
     * @param {number=} data.ship_coord_index
     * @returns {Promise<void>}
     */
    async function placePortal(socket, dirty, object_index, data) {

        try {

            //log(chalk.green("Attempting to place portal!"));

            let object_type_index = main.getObjectTypeIndex(dirty.objects[object_index].object_type_id);

            //console.log("Portal type: " + dirty.object_types[object_type_index].name);


            if(typeof data.planet_coord_index !== "undefined") {

                await main.updateCoordGeneric(socket, { 'planet_coord_index': data.planet_coord_index,
                    'object_index': object_index });


            } else if(typeof data.ship_coord_index !== "undefined") {

                await main.updateCoordGeneric(socket, { 'ship_coord_index': data.ship_coord_index,
                    'object_index': object_index });


            }

            let unattached_portal_index = -1;

            // If our portal object has a player_id, we will try and link based on that
            if(helper.notFalse(dirty.objects[object_index].player_id)) {
                console.log("Portal has a player id. Trying to match based on object type and player id");
                unattached_portal_index = dirty.objects.findIndex(function(obj) { return obj && obj.player_id === dirty.players[socket.player_index].id && 
                    obj.object_type_id === dirty.object_types[object_type_index].attaches_to_object_type_id && !obj.attached_to_id && obj.id !== dirty.objects[object_index].id; });

            } 
            // Otherwise, it's possible that our object has a spawned_event_id, and we can try to link based on that
            else if(dirty.objects[object_index].spawned_event_id) {
                console.log("Portal has a spawned event id!");
                unattached_portal_index = dirty.objects.findIndex(function(obj) { return obj && obj.spawned_event_id === dirty.objects[object_index].spawned_event_id && 
                    obj.object_type_id === dirty.object_types[object_type_index].attaches_to_object_type_id && !obj.attached_to_id && obj.id !== dirty.objects[object_index].id; });
            }


            // If there are display linkers, we would add those in now
            // see if the object type has display linkers that aren't only visual (takes up space)
            let display_linkers = dirty.object_type_display_linkers.filter(linker =>
                linker.object_type_id === dirty.object_types[object_type_index].id && !linker.only_visual);

            // This object will take up multiple tiles of space
            if(display_linkers.length > 0) {

                //console.log("Portal has display linkers");

                let origin_coord;
                if(typeof data.planet_coord_index !== 'undefined') {
                    origin_coord = dirty.planet_coords[data.planet_coord_index];
                } else if(typeof data.ship_coord_index !== 'undefined') {
                    origin_coord = dirty.ship_coords[data.ship_coord_index];
                }

                display_linkers.forEach(await async function(linker) {

                    // our coord. Already did it
                    if(linker.position_x === origin_coord.tile_x && linker.position_y === origin_coord.tile_y) {

                    } else {

                        //console.log("On non-origin display linker");
                        // get the coord that the display linker is about
                        let tile_x = origin_coord.tile_x + linker.position_x;
                        let tile_y = origin_coord.tile_y + linker.position_y;

                        let placing_coord_index = -1;
                        if(typeof data.planet_coord_index !== 'undefined') {
                            placing_coord_index = await main.getPlanetCoordIndex({ 'planet_id': origin_coord.planet_id,
                                'planet_level': origin_coord.level, 'tile_x': tile_x, 'tile_y': tile_y });
                        } else if(typeof data.ship_coord_index !== 'undefined') {
                            placing_coord_index = await main.getShipCoordIndex({ 'ship_id': origin_coord.ship_id,
                                'level': origin_coord.level,
                                'tile_x': tile_x, 'tile_y': tile_y });
                        }

                        if(placing_coord_index !== -1) {
                            let update_data = {};

                            if(typeof data.planet_coord_index !== 'undefined') {
                                update_data.planet_coord_index = placing_coord_index;
                            } else if(typeof data.ship_coord_index !== 'undefined') {
                                update_data.ship_coord_index = placing_coord_index;
                            }

                            if(tile_x === origin_coord.tile_x && tile_y === origin_coord.tile_y) {
                                update_data.object_index = object_index;
                            } else {
                                update_data.belongs_to_object_id = dirty.objects[object_index].id;
                            }

                            await main.updateCoordGeneric(socket, update_data);

                        }
                    }

                  

                });

            } 


            if(unattached_portal_index === -1) {
                //log(chalk.yellow("Could not find an unattached portal!!"));
                return;
            }

            // attach the portals
            dirty.objects[object_index].attached_to_id = dirty.objects[unattached_portal_index].id;
            dirty.objects[object_index].has_change = true;


            dirty.objects[unattached_portal_index].attached_to_id = dirty.objects[object_index].id;
            dirty.objects[unattached_portal_index].has_change = true;

            await game_object.sendInfo(socket, false, dirty, object_index, 'game.placePortal');
            await game_object.sendInfo(socket, false, dirty, unattached_portal_index, 'game.placePortal');


            


            //console.log("Finished in game.placePortal");



        } catch(error) {
            log(chalk.red("Error in game.placePortal: " + error));
            console.error(error);
        }
    }

    exports.placePortal = placePortal;



    /**
     * @param {Object} dirty
     * @param {Object} socket
     * @param {number} object_type_index
     * @param {Object} data
     * @param {number=} data.player_index
     * @param {number=} data.player_body_index
     * @param {number=} data.npc_index
     */

    async function addAddictionLinker(dirty, socket, object_type_index, data) {

        try {

            if(typeof data.npc_index !== "undefined") {
                log(chalk.yellow("NPCs getting addicted isn't supported yet"));
                return false;
            }

            if(object_type_index === -1 || !dirty.object_types[object_type_index].id) {
                log(chalk.yellow("Could not find object type passed in"));
                return false;
            }


            // see if there's an existing addiction linker
            let addiction_linker_index = dirty.addiction_linkers.findIndex(function(obj) { return obj &&
                obj.addicted_body_id === dirty.objects[data.player_body_index].id &&
                obj.addicted_to_object_type_id === dirty.object_types[object_type_index].id; })

            // Add it
            if(addiction_linker_index === -1) {
                let sql = "INSERT INTO addiction_linkers(addicted_to_object_type_id, addicted_body_id, addiction_level) VALUES(?,?,?)";
                let inserts = [dirty.object_types[object_type_index].id, dirty.objects[data.player_body_index].id, 1];

                let [result] = await (pool.query(sql, inserts));

                let new_id = result.insertId;

                console.log("Inserted new addiction linker id: " + new_id);

                let [rows, fields] = await (pool.query("SELECT * FROM addiction_linkers WHERE id = ?", [new_id]));
                if(rows[0]) {

                    let new_addiction_linker_index = dirty.addiction_linkers.push(rows[0]) - 1;

                    socket.emit('addiction_linker_info', { 'addiction_linker': dirty.addiction_linkers[new_addiction_linker_index] });

                }

            }
            // Increase it
            else {
                //console.log("Increasing addiction level");
                dirty.addiction_linkers[addiction_linker_index].addiction_level++;
                dirty.addiction_linkers[addiction_linker_index].tick_count = 0;
                dirty.addiction_linkers[addiction_linker_index].has_change = true;
            }

            // let the player know they are addicted
            socket.emit('addiction_linker_info', { 'addiction_linker': dirty.addiction_linkers[addiction_linker_index] });
        } catch(error) {
            log(chalk.red("Error in game.addAddictionLinker: " + error));
            console.error(error);
        }
    }

    exports.addAddictionLinker = addAddictionLinker;


    async function addAssembly(socket, dirty, assembler_object_id, being_assembled_object_type_id, amount) {

        try {
            let [result] = await (pool.query("INSERT INTO assemblies(amount_completed, assembler_object_id, " +
                "being_assembled_object_type_id, player_id, total_amount)VALUES(?,?,?,?,?)",
                [0, assembler_object_id, being_assembled_object_type_id, socket.player_id, amount]));

            if(result) {
                let new_id = result.insertId;
                //console.log("Got new assembly id: " + new_id);
                let [rows, fields] = await (pool.query("SELECT * FROM assemblies WHERE id = ?", [new_id]));
                if(rows[0]) {
                    let adding_assembly = rows[0];
                    adding_assembly.has_change = false;
                    let new_assembly_index = dirty.assemblies.push(adding_assembly) - 1;

                    if(socket) {
                        socket.emit('assembly_info', { 'assembly': dirty.assemblies[new_assembly_index]});
                    }
                }
            }
        } catch(error) {
            console.log("Error in addAssembly: " + error);
        }

    }

    exports.addAssembly = addAssembly;

    async function addKilledLinker(player_id, monster_type_id) {
        let [rows, fields] = await (pool.query("SELECT * FROM killed_linkers WHERE player_id = ? AND monster_type_id = ?", [player_id, monster_type_id]));

        if(rows[0]) {
            let [result] = await (pool.query("UPDATE killed_linkers SET monster_count=monster_count+1 WHERE id = ?", [rows[0].id]));
        } else {
            let [result] = await (pool.query("INSERT INTO killed_linkers(player_id,monster_type_id)VALUES(?,?)", [player_id, monster_type_id]));
        }
    }

    exports.addKilledLinker = addKilledLinker;


    // planet_coord_index   ||   ship_coord_index
    async function addPortal(socket, dirty, data) {

        try {

            log(chalk.green("In game.addPortal!"));

            let player_index = await player.getIndex(dirty, {'player_id': socket.player_id });

            if(player_index === -1) {
                return false;
            }

            let insert_object_type_data = { 'object_type_id': 47, 'source': 'game.addPortal' };
            let new_object_index = await world.insertObjectType(socket, dirty, insert_object_type_data);
            let room = "";

            if(data.planet_coord_index) {
                // object_id   |   coord_index   |   planet_coord_index   |   ship_coord_index
                await game_object.place(socket, dirty, { 'object_index': new_object_index,
                    'planet_coord_index': data.planet_coord_index });


            } else if(data.ship_coord_index) {

                await game_object.place(socket, dirty, { 'object_index': new_object_index, 'ship_coord_index': data.ship_coord_index });

            }

            // see if the player has another portal that isn't attached to anything yet
            let unattached_portal_index = dirty.objects.findIndex(function(obj) { return obj &&
                obj.player_id === dirty.players[player_index].id && obj.object_type_id === 47 && !obj.attached_to_id; });

            if(unattached_portal_index === -1) {
                return;
            }

            // attach the portals
            dirty.objects[new_object_index].attached_to_id = dirty.objects[unattached_portal_index].id;
            dirty.objects[new_object_index].has_change = true;


            dirty.objects[unattached_portal_index].attached_to_id = dirty.objects[new_object_index].id;
            dirty.objects[unattached_portal_index].has_change = true;

            await game_object.sendInfo(socket, room, dirty, new_object_index, 'game.addPortal');
            await game_object.sendInfo(socket, room, dirty, unattached_portal_index, 'game.addPortal');

            //console.log("Finished in game.addPortal");


        } catch(error) {
            log(chalk.red("Error in game.addPortal: " + error));
            console.error(error);
        }
    }

    exports.addPortal = addPortal;



    function addTradeLinker(socket, other_player_id) {
        /*
        // see if we have an existing trade linker (one trade at a time for each combination
        sql = "SELECT * FROM trade_linkers WHERE (initiating_player_id = ? AND other_player_id = ?) OR (initiating_player_id = ? AND other_player_id = ?) LIMIT 1";
        inserts = [socket.player_id, other_player_id, other_player_id, socket.player_id];
        sql = mysql.format(sql, inserts);
        pool.query("")
        */
    }

    exports.addTradeLinker = addTradeLinker;

    async function assemble(socket, dirty, data) {

        try {

            //console.log("data.being_assembled_in_object_id: " + data.being_assembled_in_object_id);

            let player_index = await player.getIndex(dirty, { 'player_id': socket.player_id });

            if(player_index === -1) {
                return false;
            }

            // If the assembly is happening on a coord, we are going through a manufacturer, shipyard, or something else
            let being_assembled_in_object_id = false;
            let assembler_object_index = -1;
            let amount = 1;

            if(data.being_assembled_in_object_id) {
                being_assembled_in_object_id = parseInt(data.being_assembled_in_object_id);
                // and try to find that object
                assembler_object_index = await game_object.getIndex(dirty, being_assembled_in_object_id);

                if(assembler_object_index === -1) {
                    log(chalk.yellow("Could not find the object it's being assembled in"));
                    return false;
                }
            }

            if(data.amount) {
                amount = data.amount;
            }


            if(data.object_type_id) {


                let object_type_id = parseInt(data.object_type_id);

                let object_type_index = main.getObjectTypeIndex(object_type_id);

                if(object_type_index === -1) {
                    log(chalk.yellow("Could not find object type for this"));
                    return false;
                }

                let requirements_met = await checkAssemblyRequirements(socket, dirty, 'object_type', object_type_id);

                if(!requirements_met) {
                    socket.emit('chat', { 'message': "Unable to assemble. Did not meet assembly requirements", 'scope': 'system'});
                    return false;
                }

                /**************** ASSEMBLED IN OBJECT ************************/
                if(dirty.object_types[object_type_index].assembled_in_object) {

                    let assembled_in_linker_index = dirty.assembled_in_linkers.findIndex(function(obj) { return obj &&
                        obj.object_type_id === dirty.object_types[object_type_index].id &&
                        obj.assembled_in_object_type_id === dirty.objects[assembler_object_index].object_type_id; });

                    if(assembled_in_linker_index === -1) {
                        log(chalk.yellow("That is not assembled there!"));
                        return false;
                    }



                    // make sure the object isn't already assembling something
                    let existing_assembly_index = dirty.assemblies.findIndex(function(obj) {
                        return obj && obj.assembler_object_id === dirty.objects[assembler_object_index].id; });

                    if(existing_assembly_index !== -1) {
                        socket.emit('chat', { 'message': "Unable to assemble. Already assembling something else"});
                        return false;
                    }


                    // Lets figure out the amount we are assembling
                    // Default is 1... that's easy

                    let minimum_amount_available = -1;
                    let assembly_linkers = dirty.assembly_linkers.filter(assembly_linker =>
                        assembly_linker.required_for_object_type_id === dirty.object_types[object_type_index].id);
                    // each time we meet the requirement set, we can increment the potential max_amount
                    for(let i = 0; i < dirty.inventory_items.length; i++ ){
                        if(dirty.inventory_items[i] && dirty.inventory_items[i].player_id === dirty.players[player_index].id && 
                            dirty.inventory_items[i].body_id === dirty.players[player_index].body_id) {

                            for(assembly_linker of assembly_linkers) {
                                if(dirty.inventory_items[i].object_type_id === assembly_linker.object_type_id) {

                                    let amount_for_this_requirement = Math.floor(dirty.inventory_items[i].amount / assembly_linker.amount);

                                    if(minimum_amount_available === -1) {
                                        minimum_amount_available = amount_for_this_requirement;
                                    } else {
                                        if(amount_for_this_requirement < minimum_amount_available) {
                                            minimum_amount_available = amount_for_this_requirement;
                                        }
                                    }

                                }
                            }

                        }
                    }

                    //console.log("Based on the player inventory they can assemble at least: " + minimum_amount_available + " of " + dirty.object_types[object_type_index].name);
                    //console.log("The player is wanting to assemble : " + amount);

                    let actual_amount_being_assembled = 0;
                    // We now take the smaller of the two
                    if(amount === 'all') {
                        actual_amount_being_assembled = minimum_amount_available;
                    } else if(parseInt(amount) === 10) {
                        if(minimum_amount_available >= 10) {
                            actual_amount_being_assembled = 10;
                        } else {
                            actual_amount_being_assembled = minimum_amount_available;
                        }
                    } else if(parseInt(amount) === 1) {
                        if(minimum_amount_available >= 1) {
                            actual_amount_being_assembled = 1;
                        }
                    }

                    //console.log("Actual amount we are assembling: " + actual_amount_being_assembled);

                    if(actual_amount_being_assembled === 0) {
                        log(chalk.yellow("We can't assemble any of that"));
                        return false;
                    }


                    // Remove all the stuff!
                    for(let i = 0; i < actual_amount_being_assembled; i++) {
                        await removeAssemblyItems(socket, dirty, 'object_type', object_type_id);
                    }

                    await addAssembly(socket, dirty, dirty.objects[assembler_object_index].id, dirty.object_types[object_type_index].id, actual_amount_being_assembled);





                    // set our assembler object is_active to true
                    dirty.objects[assembler_object_index].is_active = true;
                    let assembler_info = await game_object.getCoordAndRoom(dirty, assembler_object_index);
                    await game_object.sendInfo(socket, assembler_info.room, dirty, assembler_object_index, 'game.assemble');
                    //log(chalk.cyan("Object id: " + dirty.objects[assembler_object_index].id + " is active: " + dirty.objects[assembler_object_index].is_active));


                }
                /******************** NOT ASSEMBLED IN OBJECT - CAN BE ASSEMBLED BY PLAYER ANYWHERE **********************/
                else {

                    // since we are assembling something - we need to create an object to store things like it's HP if it's a fence or something
                    let insert_object_data = {
                        'object_type_id': dirty.object_types[object_type_index].id, 'amount': 1, 'source': 'game.assemble'
                    };

                    let new_object_index = await world.insertObjectType(socket, dirty, insert_object_data);



                    var adding_to_data = { 'adding_to_type':'player', 'adding_to_id':socket.player_id,
                        'object_id': dirty.objects[new_object_index].id,
                        'object_type_id':dirty.object_types[object_type_index].id, 'amount':1};

                    await inventory.addToInventory(socket, dirty, adding_to_data);

                    await removeAssemblyItems(socket, dirty, 'object_type', object_type_id);

                }




            } else if(data.floor_type_id) {

                console.log("Attempting to assemble floor type id: " + data.floor_type_id);

                let floor_type_index = dirty.floor_types.findIndex(function(obj) { return obj && obj.id === parseInt(data.floor_type_id); });

                if(floor_type_index === -1) {
                    log(chalk.yellow("Could not find floor type"));
                    return false;
                }


                let requirements_met = await checkAssemblyRequirements(socket, dirty, 'floor_type', dirty.floor_types[floor_type_index].id);

                if(!requirements_met) {
                    socket.emit('chat', { 'message': "Unable to assemble. Requirements not met"});
                    return false;
                }


                console.log("Assembly requirements met");
                // since it's a floor type, we don't need to add an object -

                let adding_to_data = { 'adding_to_type':'player', 'adding_to_id':socket.player_id,
                    'floor_type_id': dirty.floor_types[floor_type_index].id, 'amount':1};

                await inventory.addToInventory(socket, dirty, adding_to_data);

                await removeAssemblyItems(socket, dirty, 'floor_type', dirty.floor_types[floor_type_index].id);




            }

        } catch(error) {
            log(chalk.red("Error in game.assemble: " + error));
            console.error(error);
        }


    }

    exports.assemble = assemble;



    // Right now we are just using this for players buying a pod at a spaceport or an airlock - so they can switch out ships and such
    async function buyObjectType(socket, dirty, data) {
        try {

            if(!data.object_type_id) {
                return false;
            }

            data.object_type_id = parseInt(data.object_type_id);

            if(data.object_type_id !== 114) {
                log(chalk.yellow("Only supporting pods for now"));
                return false;
            }


            let object_type_index = main.getObjectTypeIndex(data.object_type_id);

            if(object_type_index === -1) {
                return false;
            }

            let player_index = await player.getIndex(dirty, { 'player_id': socket.player_id });
            if(player_index === -1) {
                return false;
            }



            // If the player is on a planet, they need to be at a spaceport
            if(dirty.players[player_index].planet_coord_id) {

                let planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.players[player_index].planet_coord_id });

                if(planet_coord_index === -1) {
                    return false;
                }

                if(dirty.planet_coords[planet_coord_index].floor_type_id !== 11) {
                    return false;
                }

                let insert_object_type_data = { 'object_type_id': 114, 'source': 'game.buyObjectType' };
                let new_object_index = await world.insertObjectType(socket, dirty, insert_object_type_data);

                dirty.objects[new_object_index].player_id = socket.player_id;
                dirty.objects[new_object_index].docked_at_planet_id = dirty.planet_coords[planet_coord_index].planet_id;
                dirty.objects[new_object_index].has_change = true;

                await game_object.sendInfo(socket, false, dirty, new_object_index, 'game.buyObjectType');

            } else if(dirty.players[player_index].ship_coord_id) {
                let ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.players[player_index].ship_coord_id });

                if(ship_coord_index === -1) {
                    return false;
                }

                let insert_object_type_data = { 'object_type_id': 114, 'source': 'game.buyObjectType' };
                let new_object_index = await world.insertObjectType(socket, dirty, insert_object_type_data);

                dirty.objects[new_object_index].player_id = socket.player_id;
                dirty.objects[new_object_index].has_change = true;

                // If we're on an airlock, JUMP OUT BOY!
                if(dirty.ship_coords[ship_coord_index].object_type_id === 266) {

                    console.log("Using emergency pod");

                    // get the galaxy coord of the ship we are on
                    let ship_index = await game_object.getIndex(dirty, dirty.ship_coords[ship_coord_index].ship_id);
                    let coord_index = await main.getCoordIndex({ 'coord_id': dirty.objects[ship_index].coord_id });

                    let tile_x_start = dirty.coords[coord_index].tile_x - 2;
                    let tile_y_start = dirty.coords[coord_index].tile_y - 2;
                    let tile_x_end = tile_x_start + 3;
                    let tile_y_end = tile_y_start + 3;

                    console.log("Checking coords: " + tile_x_start + "," + tile_y_start + " to " + tile_x_end + "," + tile_y_end);

                    let placing_galaxy_coord_index = -1;
                    let found_galaxy_coord = false;
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


                    if(placing_galaxy_coord_index !== -1) {


                        console.log("Found a a galaxy coord where we can put the pod");
                        game_object.place(socket, dirty, { 'object_index': new_object_index, 'coord_index': placing_galaxy_coord_index });

                        // Switch our ship to the new pod and put it in space near our other ship
                        await player.switchShip(socket, dirty, { 'ship_id': dirty.objects[new_object_index].id });
                        console.log("Switched ship");
                        //await movement.warpTo(socket, dirty, { 'player_index': player_index, 'warping_to': 'galaxy', 'base_coord_index': placing_galaxy_coord_index });
                        //console.log("Warped player to new galaxy coord");
                        socket.map_needs_cleared = true;

                        dirty.players[player_index].on_ship_id = dirty.objects[new_object_index].id;
                        dirty.players[player_index].previous_ship_coord_id = false;
                        dirty.players[player_index].ship_coord_id = false;
                        dirty.players[player_index].ship_coord_index = -1;
                        dirty.players[socket.player_index].coord_id = dirty.coords[placing_galaxy_coord_index].id;
                        dirty.players[socket.player_index].coord_index = placing_galaxy_coord_index;
                        dirty.players[socket.player_index].planet_coord_id = false;
                        dirty.players[socket.player_index].planet_coord_index = -1;
                        dirty.players[socket.player_index].has_change = true;
                        player.sendInfo(socket, false, dirty, dirty.players[socket.player_index].id);

                        world.removeBattleLinkers(dirty, { 'player_id': dirty.players[player_index].id });

                        //socket.emit('launched_data');

                        socket.emit('view_change_data', { 'view': 'galaxy' });

                        await map.updateMap(socket, dirty);

                        await world.setPlayerMoveDelay(socket, dirty, player_index);

                        // Doing this IN player.switchShip
                        //await map.updateMap(socket, dirty);
                    } else {
                        log(chalk.yellow("Could not find a galaxy coord to put the emergency pod on"));
                    }





                } else {

                    dirty.objects[new_object_index].docked_at_object_id = dirty.ship_coords[ship_coord_index].ship_id;
                    dirty.objects[new_object_index].has_change = true;

                    await game_object.sendInfo(socket, false, dirty, new_object_index, 'game.buyObjectType');
                }




            }


        } catch(error) {
            log(chalk.red("Error in game.buyObjectType: " + error));
            console.error(error);
        }
    }

    exports.buyObjectType = buyObjectType;



    async function calculatePlayerStats(socket, dirty) {
        if(socket.player_id) {

            let player_index = await player.getIndex(dirty, {'player_id':socket.player_id});

            let player_max_hp = 100 + (15 * dirty.players[player_index].level);
            let player_defense = 1;

            let equipment_linkers = dirty.equipment_linkers.filter(equipment_linker => equipment_linker.body_id === socket.player_body_id);

            equipment_linkers.forEach(function(equipment_linker) {
                let object_type_index = dirty.object_types.findIndex(function(obj) { return obj && obj.id === equipment_linker.object_type_id; });

                if(object_type_index !== -1) {

                    if(dirty.object_types[object_type_index].defense > 0) {
                        player_defense = player_defense + dirty.object_types[object_type_index].defense;
                    }

                }

            });



            socket.player_max_hp = player_max_hp;
            socket.player_defense = player_defense;

            dirty.players[player_index].max_hp = socket.player_max_hp;
            dirty.players[player_index].defense = socket.player_defense;
            dirty.players[player_index].has_change = true;

        }

    }
    exports.calculatePlayerStats = calculatePlayerStats;


    // data:        object_id   |   new_object_name
    async function changeObjectName(socket, dirty, data) {

        try {
            console.log("In game.changeObjectName");
            let object_index = await game_object.getIndex(dirty,  parseInt(data.object_id) );

            if(object_index === -1) {
                log(chalk.yellow("Could not find object"));
                return false;
            }

            if(socket.player_id !== dirty.objects[object_index].player_id) {
                log(chalk.yellow("Player doesn't down this object"));
                return false;
            }

            console.log("Player is changing name to: " + data.new_object_name);
            let new_name = helper.cleanStringInput(data.new_object_name);

            dirty.objects[object_index].name = new_name;
            dirty.objects[object_index].has_change = true;

            // Everyone should know the object has a new name
            game_object.sendInfo(socket, false, dirty, object_index, 'game.changeObjectName');


        } catch(error) {
            log(chalk.red("Error in game.changeObjectName: " + error));
            console.error(error);
        }
        
    }

    exports.changeObjectName = changeObjectName;


    // data:        object_id   |   new_object_tint
    async function changeObjectTint(socket, dirty, data) {

        try {
            //console.log("In game.changeObjectTint");
            let object_index = await game_object.getIndex(dirty,  parseInt(data.object_id) );

            if(object_index === -1) {
                log(chalk.yellow("Could not find object"));
                return false;
            }

            if(socket.player_id !== dirty.objects[object_index].player_id) {
                log(chalk.yellow("Player doesn't down this object"));
                return false;
            }

            //console.log("Player is changing tint to: " + data.new_object_tint);

            // Gotta replace the # with 0x
            let new_tint = data.new_object_tint.replace('#', '0x');
            new_tint = helper.cleanStringInput(new_tint);
            //console.log("Final new tint is: " + new_tint);

            dirty.objects[object_index].tint = new_tint;
            dirty.objects[object_index].has_change = true;

            // Everyone should know the object has a new tint
            game_object.sendInfo(socket, false, dirty, object_index, 'game.changeObjectTint');


        } catch(error) {
            log(chalk.red("Error in game.changeObjectTint: " + error));
            console.error(error);
        }

    }

    exports.changeObjectTint = changeObjectTint;

    async function changePlanetName(socket, dirty, data) {

        try {
            console.log("In game.changePlanetName");
            let planet_index = await planet.getIndex(dirty, { 'planet_id': data.planet_id, 'source': 'game.changePlanetName' });

            if(planet_index === -1) {
                log(chalk.yellow("Could not find planet"));
                return false;
            }

            if(!dirty.planets[planet_index].ai_id) {
                log(chalk.yellow("Planet does not have an ai. Can't change the name"));
                return false;
            }

            let ai_index = await game_object.getIndex(dirty, dirty.planets[planet_index].ai_id);

            if(ai_index === -1) {
                log(chalk.yellow("Could not find AI object"));
                return false;
            }

            if(socket.player_id !== dirty.objects[ai_index].player_id) {
                log(chalk.yellow("Player doesn't down this planet"));
                return false;
            }

            console.log("Player is changing name to: " + data.new_planet_name);
            let old_name = dirty.planets[planet_index].name;
            let new_name = helper.cleanStringInput(data.new_planet_name);

            dirty.planets[planet_index].name = new_name;
            dirty.planets[planet_index].has_change = true;

            // Everyone should know the planet has a new name
            io.emit('planet_info', { 'planet': dirty.planets[planet_index] });

            world.addPlayerLog(dirty, socket.player_index, dirty.players[socket.player_index].name + " has renamed planet " + old_name + " to " + new_name,
                { 'planet_id': dirty.planets[planet_index].id });



        } catch(error) {
            log(chalk.red("Error in game.changePlanetName: " + error));
        }

        console.log("In game.changePlanetName");
    }

    exports.changePlanetName = changePlanetName;



    async function changeShipName(socket, dirty, data) {

        try {
            console.log("In game.changeShipName");

            let ship_index = await game_object.getIndex(dirty, data.ship_id);


            if(ship_index === -1) {
                log(chalk.yellow("Could not find ship"));
                return false;
            }

            if(socket.player_id !== dirty.objects[ship_index].player_id) {
                log(chalk.yellow("Not their ship to change name of"));
                return false;
            }


            console.log("Player is changing name to: " + data.new_ship_name);
            let new_name = helper.cleanStringInput(data.new_ship_name);

            dirty.objects[ship_index].name = new_name;
            dirty.objects[ship_index].has_change = true;

            let object_info = await game_object.getCoordAndRoom(dirty, ship_index);
            await game_object.sendInfo(socket, object_info.room, dirty, ship_index, 'game.changeShipName');


        } catch(error) {
            log(chalk.red("Error in game.changeShipName: " + error));
            console.error(error);
        }

    }

    exports.changeShipName = changeShipName;


    async function checkAssemblyRequirements(socket, dirty, type, type_id) {
        let requirements_met = true;
        let player_inventory_items = dirty.inventory_items.filter(inventory_item => inventory_item.player_id == socket.player_id);

        let assembly_linkers = [];

        if(type == 'object_type') {
            assembly_linkers = dirty.assembly_linkers.filter(assembly_linker => assembly_linker.required_for_object_type_id == type_id);
        } else if(type == 'floor_type') {
            assembly_linkers = dirty.assembly_linkers.filter(assembly_linker => assembly_linker.required_for_floor_type_id == type_id);
        }


        for(let i = 0; i < assembly_linkers.length; i++) {
            let met_this_requirement = false;

            for(let j = 0; j < player_inventory_items.length; j++) {

                if(player_inventory_items[j].object_type_id == assembly_linkers[i].object_type_id && player_inventory_items[j].amount >= assembly_linkers[i].amount) {
                    met_this_requirement = true;
                }

            }

            if(!met_this_requirement) {
                requirements_met = false;
            }
        }

        return requirements_met;

    }


    function checkExp(socket, dirty, player_index, previous_exp) {
        //console.log("In game.checkExp");


        let previous_exp_level = 1 + Math.floor(global.level_modifier * Math.sqrt(previous_exp));
        let exp_level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.players[player_index].exp));


        if(exp_level > previous_exp_level) {

            log(chalk.green("Leveling up player"));


            dirty.players[player_index].level = exp_level;
            dirty.players[player_index].max_hp = dirty.players[player_index].max_hp + 15;
            dirty.players[player_index].has_change = true;

            calculatePlayerStats(socket, dirty);
            sendPlayerStats(socket, dirty);


        } else {
            //console.log("Player exp is not enough to level up. Current xp: " + dirty.players[player_index].exp);
        }

    }
    exports.checkExp = checkExp;


    // Combining the stuff from inventory.place, and game.convertInput
    // Converts X into Y!
    /**
     *
     * @param {Object} socket
     * @param {Object} dirty
     * @param {Object} data
     * @param {number} data.converter_object_id
     * @param {string} data.input_type
     * @param {number} data.input_object_type_id
     * @param {number=} data.npc_index
     * @param {boolean=} data.input_paid - In the case of an event, or another game mechanic pre-paying or skipping payment
     * @returns {Promise<boolean>}
     */
    async function convert(socket, dirty, data) {
        try {

            //console.log("In game.convert");

            let converter_object_index = await game_object.getIndex(dirty, parseInt(data.converter_object_id));

            if(converter_object_index === -1) {
                log(chalk.yellow("Could not find object the conversion is happening in"));
                return false;
            }

            // Figure our where our converter object is
            let converter_info = await game_object.getCoordAndRoom(dirty, converter_object_index);

            let converter_object_type_index = main.getObjectTypeIndex(dirty.objects[converter_object_index].object_type_id);

            if(converter_object_type_index === -1 || !dirty.object_types[converter_object_type_index].is_converter) {
                log(chalk.yellow("Couldn't find converter object type index, or its not a converter"));
                return false;
            }

            // STEP 2: Parse any other data that was sent in
            let inventory_item_index = -1;
            if(data.inventory_item_id) {
                //console.log("inventory_item_id passed in");
                inventory_item_index = await main.getInventoryItemIndex(parseInt(data.inventory_item_id));

                // Make sure the inventory item belongs to the player or npc
                if(inventory_item_index !== -1) {
                    if(socket) {
                        if(dirty.inventory_items[inventory_item_index].player_id !== dirty.players[socket.player_index].id) {
                            log(chalk.yellow("Inventory item doesn't belong to player"));
                        }
                    } else if(typeof data.npc_index !== 'undefined') {
                        if(dirty.inventory_items[inventory_item_index].npc_id !== dirty.npcs[data.npc_index].id) {
                            log(chalk.yellow("Inventory item doesn't belong to the npc"));
                        }
                    } else {
                        log(chalk.yellow("Unable to verify inventory item ownership"));
                        return false;
                    }
                }
            }


            // STEP 3: Find matching conversion linkers
            let conversion_linkers = [];

            if(data.input_type === "hp") {
                conversion_linkers = dirty.object_type_conversion_linkers.filter(linker =>
                    linker.object_type_id === dirty.object_types[converter_object_type_index].id &&
                    linker.input_type === "hp");
            } else if(data.input_type === "inventory_item" && inventory_item_index !== -1) {
                //console.log("Looking up via inventory item. trying to match conversion linker with object_type_id: " + dirty.object_types[converter_object_type_index].id +
                //    " and input_object_type_id: " + dirty.inventory_items[inventory_item_index].object_type_id);
                conversion_linkers = dirty.object_type_conversion_linkers.filter(linker =>
                    linker.object_type_id === dirty.object_types[converter_object_type_index].id &&
                    linker.input_object_type_id === dirty.inventory_items[inventory_item_index].object_type_id);
            }
            else if(data.input_type === "object_type" && data.input_object_type_id) {
                conversion_linkers = dirty.object_type_conversion_linkers.filter(linker =>
                    linker.object_type_id === dirty.object_types[converter_object_type_index].id &&
                    linker.input_object_type_id === data.input_object_type_id);
            } else {
                log(chalk.yellow("Not sure what conversion linkers we should grab"));
            }

            if(conversion_linkers.length === 0) {
                if(socket) {
                    socket.emit('chat', { 'message': 'That cannot be converted there', 'scope': 'system' });
                    socket.emit('result_info', { 'status': 'failure', 'text': 'That cannot be converted there' });
                }

                return false;
            }

            // Pick our conversion linker
            let using_conversion_linker = false;
            if(conversion_linkers.length > 1) {
                using_conversion_linker = conversion_linkers[Math.floor(Math.random()*conversion_linkers.length)];

            } else {
                using_conversion_linker = conversion_linkers[0];
            }





            // STEP 4. Take The conversion linker's input

            let input_paid = false;
            let new_storage_amount = 0;
            let converting_amount = 1;
            if(data.input_paid === true) {
                input_paid = true;
            } else {
                // We gotta take off some life from our player or our npc
                if(using_conversion_linker.input_type === "hp") {
                    if(socket) {
                        // TODO I think we need a damage type
                        player.damage(dirty, { 'player_index': socket.player_index, 'damage_amount': 50})
                    } else if(typeof data.npc_index !== 'undefined') {
                        // TODO not sure what we are doing here - and 99% positive it isn't working
                        npc.damage(dirty, data.npc_index, 50, {});
                    }

                    input_paid = true;
                } else if(using_conversion_linker.input_type === "object_type") {

                    // See if there was an inventory item passed in to pay for this
                    if(inventory_item_index !== -1) {


                        if(dirty.inventory_items[inventory_item_index].object_type_id === using_conversion_linker.input_object_type_id && 
                            using_conversion_linker.output_type === "energy") {

                            let i = 0;
                            input_paid = true;
                            //console.log("Starting energy is: " + dirty.objects[converter_object_index].energy);
                            let starting_storage_amount = dirty.objects[converter_object_index].energy;
                            new_storage_amount = dirty.objects[converter_object_index].energy;
                            while(i < dirty.inventory_items[inventory_item_index].amount && 
                                new_storage_amount < dirty.object_types[converter_object_type_index].max_energy_storage) {

                                i++;
                                new_storage_amount += using_conversion_linker.output_amount;
                                if(new_storage_amount >= dirty.object_types[converter_object_type_index].max_energy_storage) {
                                    new_storage_amount = dirty.object_types[converter_object_type_index].max_energy_storage;
                                }

                                //console.log("New storage amount is: " + new_storage_amount);

                                // and remove
                                await inventory.removeFromInventory(socket, dirty, { 'inventory_item_id': dirty.inventory_items[inventory_item_index].id, 'amount': 1 });

                            }

                            // Give the player some response about what happened.
                            // The converter was already full of energy
                            if(i === 0) {
                                socket.emit('result_info', { 'status': 'success', 'text': 'Energy was full' });
                            } else {
                                socket.emit('result_info', { 'status': 'success', 'text': "Converted " + i + " into energy" });
                            }

                            game_object.sendInfo(socket, false, dirty, converter_object_index);

                            // It's possible this converter object is a ship engine
                            if(typeof dirty.objects[converter_object_index].is_engine_for_ship_index !== 'undefined') {
                                //log(chalk.cyan("Converter is a ship engine!"));
                                let difference = new_storage_amount - starting_storage_amount;
                                dirty.objects[dirty.objects[converter_object_index].is_engine_for_ship_index].current_engine_energy += difference;
                                game_object.sendInfo(socket, '', dirty, dirty.objects[converter_object_index].is_engine_for_ship_index);
                                
                            }

                        }
                        // HP Effectively means healing. A player or npc is using an item to try and heal another thing
                        else if(dirty.inventory_items[inventory_item_index].object_type_id === using_conversion_linker.input_object_type_id && using_conversion_linker.output_type === "hp") {

                            // Reduce our inventory by 1
                            await inventory.removeFromInventory(socket, dirty, { 'inventory_item_id': dirty.inventory_items[inventory_item_index].id, 'amount': 1 });
                            input_paid = true;

                        }
                        // One type of object in, a different type of object out!
                        else if(dirty.inventory_items[inventory_item_index].object_type_id === using_conversion_linker.input_object_type_id && using_conversion_linker.output_type === "object_type") {
                            await inventory.removeFromInventory(socket, dirty, { 'inventory_item_id': dirty.inventory_items[inventory_item_index].id, 'amount': 1 });
                            input_paid = true;
                        }

                    }
                }

                else {
                    log(chalk.yellow("Shrugs 4h"));
                }
            }



            if(!input_paid) {
                console.log("Was unable to supply input");
                return false;
            }


            // STEP 5. OUTPUT!

            if(using_conversion_linker.output_destination === 'user_inventory') {
                console.log("Sending output to user inventory");

                // Lets build our adding_to_data
                let adding_to_data = {};

                if(socket) {
                    adding_to_data.adding_to_type = 'player';
                    adding_to_data.adding_to_id = dirty.players[socket.player_index].id;
                } else if(typeof data.npc_index !== 'undefined') {
                    adding_to_data.adding_to_type = 'npc';
                    adding_to_data.adding_to_id = dirty.npcs[data.npc_index].id;
                }

                let output_object_type_index = main.getObjectTypeIndex(using_conversion_linker.output_object_type_id);
                adding_to_data.object_type_id = dirty.object_types[output_object_type_index].id;


                if(dirty.object_types[output_object_type_index].assembled_as_object) {
                    let new_object_index = await world.insertObjectType(false, dirty, { 'object_type_id': dirty.object_types[output_object_type_index].id });


                    adding_to_data.object_id = dirty.objects[new_object_index].id;
                    adding_to_data.amount = 1;


                } else {
                    adding_to_data.amount = using_conversion_linker.output_amount;

                }

                console.log("Sending addToInventory with:");
                console.log(adding_to_data);
                await inventory.addToInventory(socket, dirty, adding_to_data);

            } else if(using_conversion_linker.output_destination === 'replace_self') {


                // Delete ourself
                await game_object.deleteObject(dirty, { 'object_index': converter_object_index, 'reason': 'game.convert - output replaces us' });

                if(using_conversion_linker.output_object_type_id) {
                    let output_object_type_index = main.getObjectTypeIndex(using_conversion_linker.output_object_type_id);

                    if(dirty.object_types[output_object_type_index].assembled_as_object) {
                        let insert_object_type_data = { 'object_type_id': using_conversion_linker.output_object_type_id, 'source': 'game.convert' };
                        let new_object_index = await world.insertObjectType(false, dirty, insert_object_type_data);


                        if(converter_info.scope === "planet") {
                            await game_object.place(socket, dirty, { 'object_index': new_object_index, 'planet_coord_index': converter_info.coord_index });
                        } else if(converter_info.scope === "ship") {
                            await game_object.place(socket, dirty, { 'object_index': new_object_index, 'ship_coord_index': converter_info.coord_index });
                        }



                    } else {
                        // We just need to update the coord, removing any existing object, or object type id
                        // and putting in the new one

                        let update_coord_data = {'object_type_id': using_conversion_linker.output_object_type_id,
                            'amount': using_conversion_linker.output_amount };
                        if(converter_info.scope === "planet") {
                            update_coord_data.planet_coord_index = converter_info.coord_index;

                        } else if(converter_info.scope === "ship") {
                            update_coord_data.ship_coord_index = converter_info.coord_index;
                        }

                        await main.updateCoordGeneric(socket, update_coord_data);

                        // I believe updateCoordGeneric will send our enough info
                        // planet.sendCoordInfo(false, "planet_" + dirty.planet_coords[data.planet_coord_index].planet_id, dirty, { 'planet_coord_index': data.planet_coord_index});
                    }

                }
            } else if(using_conversion_linker.output_destination === "storage") {
                dirty.objects[converter_object_index].energy = new_storage_amount;
                dirty.objects[converter_object_index].has_change = true;
            } else if(using_conversion_linker.output_destination === "self" && using_conversion_linker.output_type === "hp") {

                let farming_level = 1;
                let success = false;
                if(socket) {
                    farming_level = await player.getLevel(dirty, { 'player_index': socket.player_index, 'skill_type': 'farming' });


                } else if(typeof data.npc_index !== 'undefined') {
                    farming_level = await world.getNpcLevel(dirty, data.npc_index, 'farming');
                }

                success = world.complexityCheck(farming_level, dirty.object_types[converter_object_type_index].complexity);

                if(!success) {
                    let damage_amount = dirty.object_types[converter_object_type_index].complexity - farming_level;

                    await game_object.damage(dirty, converter_object_index, damage_amount, { 'object_info': converter_info });

                    await game_object.sendInfo(false, converter_info.room, dirty, converter_object_index);


                    if(socket) {
                        socket.emit('chat', { 'message': 'Your attempt to help has failed, and you have damaged it instead', 'scope': 'system' });
                    }

                    if(socket) {
                        await world.increasePlayerSkill(socket, dirty, socket.player_index, ['farming']);
                    } else if(typeof data.npc_index !== 'undefined') {
                        await world.increaseNpcSkill(dirty, data.npc_index, ['farming']);
                    }


                    if(socket) {
                        console.log("Sending result_info");
                        socket.emit('result_info', { 'status': 'failure', 'text': "You botched the job",
                            'object_id': dirty.objects[converter_object_index].id });
                    }

                } else {
                    console.log("Success");


                    let new_converter_object_hp = dirty.objects[converter_object_index].current_hp + using_conversion_linker.output_amount;

                    let level_difference = farming_level - dirty.object_types[converter_object_type_index].complexity;

                    // Reset to max we can heal to based on our level vs complexity
                    if(new_converter_object_hp > dirty.object_types[converter_object_type_index].hp + level_difference) {
                        new_converter_object_hp = dirty.object_types[converter_object_type_index].hp + level_difference;

                        // The player should be notified about this
                        let text = "You aren't skilled enough to increase HP further";
                        if(socket) {
                            socket.emit('chat', { 'scope': 'system', 'message': text, 'is_important': true });
                            socket.emit('result_info', { 'status': 'success', 'text': "As Healthy As Your Skills Can Make It!", 
                            'object_id': dirty.objects[converter_object_index].id});
                        }
                        
                    } else {

                        if(socket) {
                            socket.emit('chat', { 'message': 'You helped it stay in good condition', 'scope': 'system' });
                            socket.emit('result_info', { 'status': 'success', 'text':  "+" + using_conversion_linker.output_amount + "HP",
                            'object_id': dirty.objects[converter_object_index].id });
                        }

                    }

                    //log(chalk.cyan("Updated HP to: " + new_converter_object_hp));
                    dirty.objects[converter_object_index].current_hp = new_converter_object_hp;
                    dirty.objects[converter_object_index].has_change = true;

                    await game_object.sendInfo(socket, converter_info.room, dirty, converter_object_index);


                   


                    if(socket) {
                        await world.increasePlayerSkill(socket, dirty, socket.player_index, ['farming']);
                    } else if(typeof data.npc_index !== 'undefined') {
                        await world.increaseNpcSkill(dirty, data.npc_index, ['farming']);
                    }

                    if(socket) {
                        console.log("Sending result_info");
                        socket.emit('result_info', { 'status': 'success', 'object_id': dirty.objects[converter_object_index].id });
                    }

                }
            }

        } catch(error) {
            log(chalk.red("Error in game.convert: " + error));
            console.error(error);
        }
    }

    exports.convert = convert;


    /**
     * @param {Object} socket
     * @param {Object} dirty
     * @param {String} new_area_name
     * @param {number=} player_index - Normally we use the socket for which player to associate, but can pass in a player index to use that instead
     * @param {Boolean=} auto_market
     */
    async function createArea(socket, dirty, new_area_name, player_index = -1, auto_market = false) {

        try {
            console.log("In game.createArea");

            
            let sql = "";
            let inserts = [];

            if(socket && player_index === -1) {
                player_index = socket.player_index;
            }

            // Make sure that the player owns the ship/planet they are on
            // Skip this check for Cadian
            if(dirty.players[player_index].planet_coord_id && dirty.players[player_index].id !== 4) {

                let planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.players[player_index].planet_coord_id });

                if(planet_coord_index === -1) {
                    return false;
                }

                let planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.planet_coords[planet_coord_index].planet_id });

                if(planet_index === -1 || dirty.planets[planet_index].player_id !== dirty.players[player_index].id) {
                    socket.emit('chat', { 'scope': 'system', 'message': 'You need to own the planet to make rooms on it' });
                    return false;
                }

                sql = "INSERT INTO areas(name, owner_id, planet_id) VALUES(?,?,?)";
                inserts = [new_area_name, dirty.players[player_index].id, dirty.planets[planet_index].id];



            } else if(dirty.players[player_index].ship_coord_id && dirty.players[player_index].id !== 4) {
                let ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.players[player_index].ship_coord_id });

                if(ship_coord_index === -1) {
                    return false;
                }

                let ship_index = await game_object.getIndex(dirty, dirty.ship_coords[ship_coord_index].ship_id);

                if(ship_index === -1 || dirty.objects[ship_index].player_id !== dirty.players[player_index].id) {
                    socket.emit('chat', { 'scope': 'system', 'message': 'You need to own the ship to make rooms on it' });
                    return false;
                }

                if(auto_market === false) {
                    sql = "INSERT INTO areas(name, owner_id, ship_id, auto_market) VALUES(?,?,?,true)";
                    inserts = [new_area_name, dirty.players[player_index].id, dirty.objects[ship_index].id];
                } else {
                    sql = "INSERT INTO areas(name, owner_id, ship_id) VALUES(?,?,?)";
                    inserts = [new_area_name, dirty.players[player_index].id, dirty.objects[ship_index].id];
                }
                

            }

            // We probably don't want duplicate names
            let existing_area_index = dirty.areas.findIndex(function(obj) { return obj && obj.name === new_area_name });

            if(existing_area_index !== -1) {
                socket.emit('chat', { 'scope': 'system', 'message': 'There is already an area with this name' });
                return false;
            }

            // We can create the area



            let [result] = await (pool.query(sql,
                inserts));

            let new_id = result.insertId;
            console.log("Got new id as: " + new_id);

            //console.log("Got new inventory item id: " + new_id);
            let [rows, fields] = await (pool.query("SELECT * FROM areas WHERE id = ?", [new_id]));
            if(rows[0]) {
                let adding_area = rows[0];
                adding_area.has_change = false;

                let new_area_index = dirty.areas.push(adding_area) - 1;


                socket.emit('area_info', { 'area': dirty.areas[new_area_index] });

                console.log("Sent new area to socket");

                if(auto_market === true) {
                    world.changeArea(socket, dirty, new_id, { 'auto_market': true });

                }

            }


        } catch(error) {
            log(chalk.red("Error in game.createArea: " + error));
            console.error(error);
        }

    }

    exports.createArea = createArea;



    //      planet_index   |   damage_amount   |   battle_linker (OPTIONAL)   |   planet_info   |   calculating_range (OPTIONAL)
    //      reason   |   damage_types   |   damage_source_type   |   damage_source_id
    async function damagePlanet(dirty, data) {
        try {

            console.log("In damagePlanet with planet " + dirty.planets[data.planet_index].id);

            if(!data.damage_types) {
                data.damage_types = [];
            }

            //let object_type_index = main.getObjectTypeIndex(dirty.objects[data.object_index].object_type_id);


            let new_planet_hp = dirty.planets[data.planet_index].current_hp - data.damage_amount;

            // send new object info to the room
            if(data.battle_linker) {
                io.to(data.planet_info.room).emit('damaged_data',
                    {'planet_id': dirty.planets[data.planet_index].id, 'damage_amount': data.damage_amount, 'was_damaged_type': 'hp',
                        'damage_source_type': data.battle_linker.attacking_type, 'damage_source_id': data.battle_linker.attacking_id,
                        'damage_types': data.damage_types,
                        'calculating_range': data.calculating_range });

            }
            // We know the damage source type
            else if(data.damage_source_type) {
                io.to(data.planet_info.room).emit('damaged_data',
                    {'planet_id': dirty.planets[data.planet_index].id, 'damage_amount': data.damage_amount, 'was_damaged_type': 'hp',
                        'damage_source_type': data.damage_source_type, 'damage_source_id': data.damage_source_id,
                        'damage_types': data.damage_types,
                        'calculating_range': data.calculating_range });
            }

            else {
                io.to(data.planet_info.room).emit('damaged_data',
                    {   'planet_id': dirty.planets[data.planet_index].id, 'damage_amount': data.damage_amount,
                        'was_damaged_type': 'hp', 'damage_types': data.damage_types });

            }




            dirty.planets[data.planet_index].current_hp = new_planet_hp;
            dirty.planets[data.planet_index].has_change = true;
            await planet.sendInfo(false, data.planet_info.room, dirty, { 'planet_index': data.planet_index });



        } catch(error) {
            log(chalk.red("Error in game.damagePlanet: " + error));
            console.error(error);
        }
    }

    exports.damagePlanet = damagePlanet;



    async function decayMonsterType(dirty, monster_type_index) {

        try {

            for(let i = 0; i < dirty.monsters.length; i++) {

                if(dirty.monsters[i] && dirty.monsters[i].monster_type_id === dirty.monster_types[monster_type_index].id) {
                    await monster.damage(dirty, i, dirty.monster_types[monster_type_index].decay_rate, { 'damage_source_type': 'decay',
                        'damage_types': ['decay'] });
                }

            }


        } catch(error) {
            log(chalk.red("Error in game.decayMonsterType: " + error));
        }
    }



    // We use the npc_id instead of npc_index since if things went wrong maybe we don't actually have the NPC anymore but
    // they are still on planet coords
    async function deleteRule(socket, dirty, data) {

        try {

            let rule_id = parseInt(data.rule_id);
            log(chalk.green("Deleting rule: " + rule_id));

            let rule_index = await main.getRuleIndex(rule_id);

            if(rule_index === -1) {
                return false;
            }

            let object_index = await game_object.getIndex(dirty, dirty.rules[rule_index].object_id);

            if(object_index === -1) {
                return false;
            }

            if(dirty.objects[object_index].player_id !== socket.player_id) {
                return false;
            }

            // Remove our watched
            if(dirty.rules[rule_index].rule === "protect_3" || dirty.rules[rule_index].rule === "protect_4") {
                for(let i = 0; i < dirty.coords.length; i++) {
                    if(dirty.coords[i] && dirty.coords[i].watched_by_object_id === dirty.objects[object_index].id) {
                        await main.updateCoordGeneric(socket, { 'coord_index': i, 'watched_by_object_id': false });
                    }
                }
            }

            socket.emit('rule_info', { 'remove': true, 'rule': dirty.rules[rule_index] });

            delete dirty.rules[rule_index];

            await (pool.query("DELETE FROM rules WHERE id = ?", [rule_id]));

        } catch(error) {
            log(chalk.red("Error in game.deleteRule: " + error));
        }


    }

    exports.deleteRule = deleteRule;



    //  data:   structure_id
    async function deleteStructure(socket, dirty, data) {

        try {

            console.log("We are deleting a structure!");

            data.structure_id = parseInt(data.structure_id);

            let structure_index = await main.getStructureIndex({ 'structure_id': data.structure_id });

            if(structure_index === -1) {
                log(chalk.yellow("Could not find structure"));
                return false;
            }


            let planet_index = -1;
            let ship_index = -1;

            for(let i = 0; i < dirty.planet_coords.length; i++) {
                if(dirty.planet_coords[i] && dirty.planet_coords[i].structure_id === data.structure_id) {

                    if(planet_index === -1) {
                        planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.planet_coords[i].planet_id });
                    }


                    // IF THE LEVEL IS > 0, DELETE THE COORD ENTIRELY
                    if(dirty.planet_coords[i].level > 0) {
                        await deletePlanetCoord(dirty, { 'planet_coord_index': i});
                    }
                    // Just some cleanup on the coord
                    else {

                        // REMOVE OBJECTS/OBJECT TYPE ID
                        if(dirty.planet_coords[i].object_id) {
                            let object_index = await game_object.getIndex(dirty, dirty.planet_coords[i].object_id);

                            // Found the object - we can remove it from the planet coord via the deleteObject function
                            if(object_index !== -1) {
                                await game_object.deleteObject(dirty, {'object_index': object_index });
                            }
                            // Didn't find it - just remove it
                            else {
                                dirty.planet_coords[i].object_id = false;
                                dirty.planet_coords[i].object_type_id = false;
                                dirty.planet_coords[i].object_amount = 0;
                            }
                        }

                        else if(dirty.planet_coords[i].object_type_id) {

                            dirty.planet_coords[i].object_type_id = false;
                            dirty.planet_coords[i].object_amount = 0;


                        }

                        dirty.planet_coords[i].structure_id = false;

                        // we also want to put the floor back to an original type
                        let floor_linkers = dirty.planet_floor_linkers.filter(linker => linker.planet_type_id === dirty.planets[planet_index].planet_type_id
                            && dirty.planet_coords[i].level <= linker.highest_planet_level && dirty.planet_coords[i].level >= linker.lowest_planet_level);

                        // get a random floor linker
                        if(floor_linkers.length > 0) {
                            let floor_linker = floor_linkers[Math.floor(Math.random() * floor_linkers.length)];
                            dirty.planet_coords[i].floor_type_id = floor_linker.floor_type_id;
                        }


                        dirty.planet_coords[i].has_change = true;
                    }
                }
            }


            // TODO support structures on ships

            // and delete the structure
            await (pool.query("DELETE FROM structures WHERE id = ?", [data.structure_id]));

            delete dirty.structures[structure_index];



        } catch(error) {
            log(chalk.red("Error in game.deleteStructure: " + error));
            console.error(error);

        }
    }

    exports.deleteStructure = deleteStructure;


    //  data:   planet_index
    async function destroyPlanet(socket, dirty, data) {

        try {

            console.time("destroyPlanet");

            if(!socket.is_admin) {
                log(chalk.red("We think a socket with player id: " + socket.player_id + " is trying to be mr hacker man desctructo"));
                return false;
            }


            // Gotta make sure all the planet coords from the planet are in memory
            await loadEntirePlanet(dirty, { 'planet_index': data.planet_index });


            for(let i = 0; i < dirty.planet_coords.length; i++) {
                if(dirty.planet_coords[i] && dirty.planet_coords[i].planet_id === dirty.planets[data.planet_index].id) {

                    // Npcs die
                    if(dirty.planet_coords[i].npc_id) {
                        await npc.deleteNpc(dirty, dirty.planet_coords[i].npc_id);
                    }


                    // Monsters die
                    if(dirty.planet_coords[i].monster_id) {
                        let monster_index = await monster.getIndex(dirty, dirty.planet_coords[i].monster_id);
                        if(monster_index !== -1) {
                            await monster.deleteMonster(dirty, monster_index);
                        }

                    }

                    // Objects die
                    if(dirty.planet_coords[i].object_id) {
                        //console.log("Going to kill object id: " + dirty.planet_coords[i].object_id);
                        let object_index = await game_object.getIndex(dirty, dirty.planet_coords[i].object_id);
                        if(object_index !== -1) {
                            await game_object.deleteObject(dirty, { 'object_index': object_index });
                        }

                    }

                    // Players head to space
                    if(dirty.planet_coords[i].player_id) {

                        let player_index = await player.getIndex(dirty, { 'player_id': dirty.planet_coords[i].player_id });
                        if(player_index !== -1) {
                            let player_socket = world.getPlayerSocket(dirty, player_index);

                            await movement.switchToGalaxy(player_socket, dirty, player_index);
                        }

                    }

                    // LEAVE OUR MEMORY!
                    delete dirty.planet_coords[i];

                }
            }


            await (pool.query("DELETE FROM planet_coords WHERE planet_id = ?", [dirty.planets[data.planet_index].id]));

            // and delete any spawned events on this planet
            for(let i = 0; i < dirty.spawned_events.length; i++) {
                if(dirty.spawned_events[i] && dirty.spawned_events[i].planet_id === dirty.planet[data.planet_index].id) {
                    await event.deleteSpawnedEvent(dirty, i);
                }
            }

            dirty.planets[data.planet_index].ai_id = false;
            dirty.planets[data.planet_index].player_id = false;
            dirty.planets[data.planet_index].has_change = true;

            console.timeEnd("destroyPlanet");

        } catch(error) {
            log(chalk.red("Error in game.destroyPlanet: " + error));
            console.error(error);
        }
    }

    exports.destroyPlanet = destroyPlanet;


/**
 * Have a player or npc eat something
 * @param {Object} socket 
 * @param {Object} dirty 
 * @param {Object} data 
 * @param {number=} data.npc_index
 * @param {String=} data.inventory_item_id
 */
async function eat(socket, dirty, data) {

    try {

        if(socket !== false && !socket.player_id) {
            console.log("Invalid player data sent in");
            return false;
        }

        let npc_index = -1;
        if(typeof data.npc_index !== 'undefined') {
            npc_index = data.npc_index;
        } else {
            //console.log("Player is eating from inventory item id: " + data.inventory_item_id);
        }


        


        let inventory_item_id = parseInt(data.inventory_item_id);
        let inventory_item_index = dirty.inventory_items.findIndex(function(obj) {
            return obj && obj.id === inventory_item_id; });

        if(inventory_item_index === -1) {
            log(chalk.yellow("Could not find inventory item id: " + data.inventory_item_id));
            return false;
        }


        let inventory_item_object_type_index = dirty.object_types.findIndex(function(obj) {
            return obj && obj.id === dirty.inventory_items[inventory_item_index].object_type_id; });


        let player_body_index = -1;
        let player_body_object_type_index = -1;

        if(socket) {
            player_body_index = await game_object.getIndex(dirty, dirty.players[socket.player_index].body_id);
            player_body_object_type_index = dirty.object_types.findIndex(function(obj) {
                return obj && obj.id === dirty.objects[player_body_index].object_type_id; });
        }


        let race_eating_linker_index = -1;
        if(socket) {
            race_eating_linker_index = dirty.race_eating_linkers.findIndex(function(obj) { return obj &&
                obj.race_id === dirty.object_types[player_body_object_type_index].race_id &&
                obj.object_type_id ===  dirty.object_types[inventory_item_object_type_index].id;
            });
        } else {
            race_eating_linker_index = dirty.race_eating_linkers.findIndex(function(obj) { return obj &&
                obj.race_id === 13 &&
                obj.object_type_id ===  dirty.object_types[inventory_item_object_type_index].id;
            });
        }

        if(race_eating_linker_index === -1) {
            console.log("Didn't find a race eating linker");
            return false;
        }

        // make sure this type of thing isn't already being eaten
        let existing_eating_index = -1;
        if(socket) {
            existing_eating_index = dirty.eating_linkers.findIndex(function(obj) {
                return obj && obj.body_id === dirty.objects[player_body_index].id
                    && obj.eating_object_type_id === dirty.object_types[inventory_item_object_type_index].id; });
        } else {
            existing_eating_index = dirty.eating_linkers.findIndex(function(obj) {
                return obj && obj.npc_id === dirty.npcs[npc_index].id
                    && obj.eating_object_type_id === dirty.object_types[inventory_item_object_type_index].id; });
        }


        if(existing_eating_index !== -1) {

            if(socket) {
                socket.emit('chat', { 'message': 'You can only eat one of something at a time', 'scope': 'system' });
                socket.emit('result_info', { 'status': 'failure', 'text': "Already Eating This" });
            }

            return false;
        }

        // return false if we already have an entry in the database queue
        let database_queue_index = -1;

        if(socket) {
            database_queue_index = dirty.database_queue.findIndex(function(obj) { return obj &&
                obj.player_id === socket.player_id && obj.eating_object_type_id === dirty.object_types[inventory_item_object_type_index].id });
        } else {
            database_queue_index = dirty.database_queue.findIndex(function(obj) { return obj &&
                obj.npc_id === dirty.npcs[npc_index].id && obj.eating_object_type_id === dirty.object_types[inventory_item_object_type_index].id });
        }


        if(database_queue_index !== -1) {
            console.log("MySQL is slow. Eating");
            if(socket) {
                socket.emit('chat', { 'message': 'You can only eat one of something at a time', 'scope': 'system' });
            }

            return false;
        }

        let remove_inventory_data = { 'inventory_item_id': dirty.inventory_items[inventory_item_index].id, 'amount': 1};
        inventory.removeFromInventory(socket, dirty, remove_inventory_data);



        // add an entry to the database queue
        if(socket) {
            database_queue_index = dirty.database_queue.push({'player_id': socket.player_id, 'eating_object_type_id': dirty.object_types[inventory_item_object_type_index].id}) - 1;
        } else {
            database_queue_index = dirty.database_queue.push({'npc_id': dirty.npcs[npc_index].id, 'eating_object_type_id': dirty.object_types[inventory_item_object_type_index].id}) - 1;
        }

        // Lets insert this guy!
        let sql = "";
        let inserts = [];

        if(socket) {
            sql = "INSERT INTO eating_linkers(player_id, body_id, eating_object_type_id, ticks_completed)VALUES(?, ?, ?, 0)";
            inserts = [socket.player_id, dirty.objects[player_body_index].id, dirty.object_types[inventory_item_object_type_index].id];
        } else {
            sql = "INSERT INTO eating_linkers(npc_id, eating_object_type_id, ticks_completed)VALUES(?, ?, 0)"
            inserts = [dirty.npcs[npc_index].id, dirty.object_types[inventory_item_object_type_index].id]
        }

        let [result] = await (pool.query(sql, inserts));
        let insert_id = result.insertId;
        //console.log("Got insert id as: " + result.insertId);

        let eating_linker_index = await main.getEatingLinkerIndex({ 'id': insert_id});

        //console.log("New eating linker eating_object_type_id: " + dirty.eating_linkers[eating_linker_index].eating_object_type_id);

        // and remove it from the database queue
        //database_queue_index = database_queue.findIndex(function(obj) { return obj &&
        //    obj.player_id === socket.player_id && obj.eating_object_type_id === dirty.object_types[inventory_item_object_type_index].id });

        if(database_queue_index !== -1) {
            delete dirty.database_queue[database_queue_index];
        }

        if(eating_linker_index !== -1 && socket) {
            socket.emit('eating_linker_info', { 'eating_linker': dirty.eating_linkers[eating_linker_index]});
        }

        // see if the player or npc gets addicted
        // TODO support for npcs and addiction
        if(socket && dirty.race_eating_linkers[race_eating_linker_index].addiction_chance) {
            let rand_result = helper.getRandomIntInclusive(1,100);

            if(rand_result <= dirty.race_eating_linkers[race_eating_linker_index].addiction_chance) {
                // PLAYER IS ADDICTED
                log(chalk.cyan("ADDICTION HAS HAPPENED!"));

                let add_addiction_data = {};
                if(socket) {
                    add_addiction_data.player_index = socket.player_index;
                    add_addiction_data.player_body_index = player_body_index;
                }
                if(npc_index !== -1) {
                    add_addiction_data.npc_index = npc_index;
                }
                addAddictionLinker(dirty, socket, inventory_item_object_type_index, add_addiction_data);
                
            }
        }



    } catch(error) {
        log(chalk.red("Error in player.eat: " + error));
        console.error(error);
    }


}
exports.eat = eat;


    // data:    planet_index
    async function loadEntirePlanet(dirty, data) {
        try {

            let [rows, fields] = await (pool.query("SELECT * FROM planet_coords WHERE planet_id = ? ", [dirty.planets[data.planet_index].id]));


            if(rows[0]) {

                for(let i = 0; i < rows.length; i++) {

                    let adding_planet_coord = rows[i];

                    // lets make sure we weren't retarded and don't already have it
                    let final_check_index = dirty.planet_coords.findIndex(function(obj) { return obj && obj.id === adding_planet_coord.id; });
                    if(final_check_index === -1) {
                        adding_planet_coord.has_change = false;
                        dirty.planet_coords.push(adding_planet_coord) - 1;


                    }


                }



            }
        } catch(error) {
            log(chalk.red("Error in game.loadEntirePlanet: " + error));
            console.error(error);
        }
    }


    exports.loadEntirePlanet = loadEntirePlanet;

    // A client passed in object id  OR coord_id OR planet_coord_id OR ship_coord_id
    async function processDestroyData(socket, dirty, data) {

        try {

            if(data.object_id) {
                let object_index = await game_object.getIndex(dirty, data.object_id);

                // Doesn't exist. Lets do some quick double checking to make sure it's not associated with a coord
                if(object_index === -1) {

                    let planet_coord_index = dirty.planet_coords.findIndex(function(obj) { return obj && obj.object_id === data.object_id; });
                    if(planet_coord_index !== -1) {
                        await main.updateCoordGeneric(dirty, {'planet_coord_index': planet_coord_index, 'object_id': false });
                    }

                    let ship_coord_index = dirty.ship_coords.findIndex(function(obj) { return obj && obj.object_id === data.object_id; });
                    if(ship_coord_index !== -1) {
                        await main.updateCoordGeneric(dirty, {'ship_coord_index': ship_coord_index, 'object_id': false });
                    }

                    let temp_obeject = {};
                    temp_object.id = data.object_id;
                    socket.emit('object_info', { 'remove': true, 'object': temp_object });
                    return false;
                }

                if(socket.player_id === dirty.objects[object_index].player_id) {
                    console.log("Can destroy. Click and player owns it");
                    socket.emit('object_info', { 'remove': true, 'object': dirty.objects[object_index] });
                    await game_object.deleteObject( dirty, { 'object_index': object_index, 'reason': 'click' });

                    // Can't really send it with an object index after its been deleted
                    //await game_object.sendInfo(socket, false, dirty, object_index, 'game.processDestroyData');
                }
            }
            // Sometimes we might have an object type that is removable
            else if(data.planet_coord_id || data.ship_coord_id || data.coord_id) {

                let coord_index = -1;

                if(data.planet_coord_id) {
                    coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': data.planet_coord_id });

                    // Only want to process this info if there's an object type and no object
                    if(coord_index === -1 || dirty.planet_coords[coord_index].object_id || !dirty.planet_coords[coord_index].object_type_id) {
                        return false;
                    }

                    let object_type_index = main.getObjectTypeIndex({'object_type_id': dirty.planet_coords[coord_index].object_type_id });

                    if(object_type_index === -1) {
                        return false;
                    }

                    if(!dirty.object_types[object_type_index].can_be_attacked) {
                        return false
                    }

                    await main.updateCoordGeneric(socket, { 'planet_coord_index': coord_index, 'object_type_id': false });


                    io.to('planet_' + dirty.planet_coords[coord_index].planet_id).emit('planet_coord_info', { 'planet_coord': dirty.planet_coords[coord_index] });



                } else if(data.ship_coord_id) {
                    //console.log("Trying to destroy object type from ship coord id");
                    coord_index = await main.getShipCoordIndex({ 'ship_coord_id': data.ship_coord_id });

                    if(coord_index === -1) {
                        console.log("Could not find ship coord id: " + data.ship_coord_id);
                        return false;
                    }

                    if(dirty.ship_coords[coord_index].object_id) {
                        log(chalk.yellow("This has an object... and is only coded for an object type"));
                        return false;
                    }

                    if(!dirty.ship_coords[coord_index].object_type_id) {
                        log(chalk.yellow("Don't have an object type id at this ship coord"));
                        return false;
                    }


                    let object_type_index = main.getObjectTypeIndex(dirty.ship_coords[coord_index].object_type_id );

                    if(object_type_index === -1) {
                        return false;
                    }

                    if(!dirty.object_types[object_type_index].can_be_attacked) {
                        log(chalk.yellow("ship coord has an object type that cannot be attacked"));
                        return false
                    }

                    dirty.ship_coords[coord_index].object_type_id = false;
                    dirty.ship_coords[coord_index].has_change = true;

                    io.to('ship_' + dirty.ship_coords[coord_index].ship_id).emit('ship_coord_info', { 'ship_coord': dirty.ship_coords[coord_index] });

                }  else if(data.coord_id) {
                    coord_index = await main.getCoordIndex({ 'coord_id': data.coord_id });

                    // Only want to process this info if there's an object type and no object
                    if(coord_index === -1 || dirty.coords[coord_index].object_id || !dirty.coords[coord_index].object_type_id) {
                        return false;
                    }

                    let object_type_index = main.getObjectTypeIndex({'object_type_id': dirty.coords[coord_index].object_type_id });

                    if(object_type_index === -1) {
                        return false;
                    }

                    if(!dirty.object_types[object_type_index].can_be_attacked) {
                        return false
                    }

                    dirty.coords[coord_index].object_type_id = false;
                    dirty.coords[coord_index].has_change = true;

                    io.to("galaxy").emit('coord_info', { 'coord': dirty.coords[coord_index] });
                }

            }
        } catch(error) {
            log(chalk.red("Error in game.processDestroyData: " + error));
            console.error(error);
        }

    }
    exports.processDestroyData = processDestroyData;



    // Basic dropping of an object or object type. Some objects can be built. This doesn't build them,
    // just places them on the tile
    /**
     *
     * @param socket
     * @param dirty
     * @param {Object} data
     * @param {number} data.inventory_item_id
     * @param {number} data.x - tile x
     * @param {number} data.y - tile y
     * @returns {Promise<boolean>}
     */
    async function drop(socket, dirty, data) {

        try {

            let dropping_inventory_item_id = parseInt(data.inventory_item_id);
            let dropping_x = parseInt(data.x);
            let dropping_y = parseInt(data.y);


            //log(chalk.green("\nDropping " + dropping_inventory_item_id + " at " + dropping_x + "x" + dropping_y + " amount: " + data.amount));

            let inventory_item_index = await main.getInventoryItemIndex(dropping_inventory_item_id);

            if(inventory_item_index === -1) {
                return false;
            }

            let dropping_amount = dirty.inventory_items[inventory_item_index].amount;

            if( (data.amount === 10 || data.amount === "10") && dirty.inventory_items[inventory_item_index].amount >= 10) {
                dropping_amount = 10;
            } else if(data.amount === 1 || data.amount === "1") {
                dropping_amount = 1;
            }

            let player_index = await player.getIndex(dirty, { 'player_id': dirty.inventory_items[inventory_item_index].player_id });

            if(player_index === -1) {
                console.log("Couldn't find player for inventory item");
            }

            let object_index = -1;
            let object_type_index = -1;
            if(dirty.inventory_items[inventory_item_index].object_id) {
                object_index = await game_object.getIndex(dirty, dirty.inventory_items[inventory_item_index].object_id);

                if(object_index === -1) {
                    console.log("Inventory item points towards and object_id but we could not get it");

                    return false;
                }

                object_type_index = main.getObjectTypeIndex(dirty.objects[object_index].object_type_id);

                if(object_type_index === -1) {
                    log(chalk.yellow("Could not get object type id for object id: " + dirty.objects[object_index].id));
                    return false;
                }

            }
            // Just object types here baby!
            else if(dirty.inventory_items[inventory_item_index].object_type_id) {
                object_type_index = main.getObjectTypeIndex(dirty.inventory_items[inventory_item_index].object_type_id);

                if(object_type_index === -1) {
                    log(chalk.yellow("Could not get object type id for inventory item id: " + dirty.inventory_items[inventory_item_index].id));
                    return false;
                }
            }




            //console.log("Got inventory_item_index");

            let temp_coord = false;
            let coord_index = false;
            let scope = false;
            let update_data = {};

            if(dirty.players[player_index].planet_coord_id) {
                //console.log("player has planet coord id");

                // Can't place shipyards on planets
                if(dirty.inventory_items[inventory_item_index].object_id && dirty.objects[object_index].object_type_id === 116) {
                    socket.emit('chat', { 'message': "Can't place shipyards on planets. Shipyards must be built in space", 'scope': 'system' });
                    socket.emit('result_info', { 'status': 'failure', 'text': 'Place In Galaxy' });
                    return false;
                }

                let player_planet_coord_index = await main.getPlanetCoordIndex({'planet_coord_id': dirty.players[player_index].planet_coord_id });

                let planet_coord_data = { 'planet_id': dirty.planet_coords[player_planet_coord_index].planet_id,
                    'planet_level': dirty.planet_coords[player_planet_coord_index].level,
                    'tile_x': dropping_x, 'tile_y': dropping_y };
                let coord_index = await main.getPlanetCoordIndex(planet_coord_data);

                if(coord_index === -1) {
                    console.log("Could not find planet coord");
                    return false;
                }

                temp_coord = dirty.planet_coords[coord_index];
                scope = 'planet';
                update_data.planet_coord_index = coord_index;


            } else if(dirty.players[player_index].ship_coord_id) {

                // Can't place shipyards on other ships
                if(dirty.inventory_items[inventory_item_index].object_id && dirty.objects[object_index].object_type_id === 116) {
                    socket.emit('chat', { 'message': "Can't place shipyards on other ships. Shipyards must be built in space", 'scope': 'system' });
                    return false;
                }

                console.log("socket has ship_coord_id");

                let player_ship_coord_index = await main.getShipCoordIndex({'ship_coord_id': dirty.players[player_index].ship_coord_id });

                let ship_coord_data = { 'ship_id': dirty.ship_coords[player_ship_coord_index].ship_id,
                    'level': dirty.ship_coords[player_ship_coord_index].level,
                    'tile_x': dropping_x, 'tile_y': dropping_y };
                coord_index = await main.getShipCoordIndex(ship_coord_data);

                if(coord_index === -1) {
                    console.log("Couldn't find ship coord");
                    return false;
                }

                //console.log("Ship coord id: " + dirty.ship_coords[coord_index].id + " is_weapon_hardpoint: " + dirty.ship_coords[coord_index].is_weapon_hardpoint);

                temp_coord = dirty.ship_coords[coord_index];
                scope = 'ship';
                update_data.ship_coord_index = coord_index;



            } else if(dirty.players[player_index].coord_id) {

                // We can drop a shipyard. That's it so far!
                console.log("Player is dropping on galaxy (currently shipyard only)");

                let coord_data = { 'tile_x': dropping_x, 'tile_y': dropping_y };
                let coord_index = await main.getCoordIndex(coord_data);

                if(coord_index === -1) {
                    console.log("Couldn't find galaxy coord");
                    return false;
                }

                temp_coord = dirty.coords[coord_index];
                scope = 'galaxy';
                update_data.coord_index = coord_index;

            }


            // Some things require that they be placed on specific other things ( Thiol Extractor on a Thiol Deposit, Shipyard on Galaxy,  )
            let pre_verified_can_place = false;

            if(dirty.object_types[object_type_index].drop_requires_object_type_id) {
                if(temp_coord.object_type_id === dirty.object_types[object_type_index].drop_requires_object_type_id) {
                    pre_verified_can_place = true;
                } else {
                    // We need to get the required object type for a useful user message
                    let required_object_type_index = main.getObjectTypeIndex(dirty.object_types[object_type_index].drop_requires_object_type_id);

                    socket.emit('result_info', { 'status': 'failure', 'text': "Must place on " + dirty.object_types[required_object_type_index].name });
                    log(chalk.yellow("That must be placed on a specific type of object type"));
                    return false;
                }
            }

            if(scope === 'ship' && dirty.object_types[object_type_index].is_ship_weapon && temp_coord.is_weapon_hardpoint) {
                console.log("Pre verified can place TRUE!");
                pre_verified_can_place = true;
            } else if(scope === 'ship' && dirty.object_types[object_type_index].is_ship_engine && temp_coord.is_engine_hardpoint) {
                console.log("Pre verified can place TRUE!");
                pre_verified_can_place = true;
            }
            else {
                //console.log("Did not pre-verify. Scope: " + scope + " is_ship_weapon: " +
                //    dirty.object_types[object_type_index].is_ship_weapon + " is_weapon_hardpoint: " + temp_coord.is_weapon_hardpoint);
            }

            if(scope === 'ship' && dirty.object_types[object_type_index].is_ship_engine && temp_coord.is_engine_hardpoint) {
                pre_verified_can_place = true;
            }

            // We can only drop this on specific classes of floors ( think Spaceport and galaxy )
            if(helper.notFalse(dirty.object_types[object_type_index].drop_requires_floor_type_class)) {
                let floor_type_index = main.getFloorTypeIndex(temp_coord.floor_type_id);
                if(floor_type_index === -1 || dirty.floor_types[floor_type_index].class !== dirty.object_types[object_type_index].drop_requires_floor_type_class) {
                    socket.emit('result_info', { 'status': 'failure', 'text': "Must place on " + dirty.object_types[object_type_index].drop_requires_floor_type_class + " floor"});
                    log(chalk.yellow("That must be placed on a specific type of floor"));
                    return false;
                }
            }



            // Now that we've gathered our data - we can do the sending
            // See if there is already a matching object type here without an object present
            if(temp_coord.object_type_id && !temp_coord.object_id &&
                temp_coord.object_type_id === dirty.object_types[object_type_index].id) {
                console.log("Planet coord has this object_type_id and doesn't have an object id - so we can just update the amount");

                let amount_update_data = update_data;
                amount_update_data.amount = temp_coord.object_amount + dropping_amount;
                await main.updateCoordGeneric(socket, amount_update_data);


                let remove_inventory_data = { 'inventory_item_id': dirty.inventory_items[inventory_item_index].id,
                    'amount': dropping_amount };
                await inventory.removeFromInventory(socket, dirty, remove_inventory_data);
                await inventory.sendInventory(socket, false, dirty, 'player', socket.player_id);

            } else if(pre_verified_can_place || await game_object.canPlace(dirty, scope, temp_coord, { 'object_type_id': dirty.object_types[object_type_index].id })) {


                //console.log("Can place there! object_id: " + dirty.inventory_items[inventory_item_index].object_id);

                // we can only put one there
                if(dirty.inventory_items[inventory_item_index].object_id) {
                    console.log("Inventory item has object_id - can only move one (and there should only be one)");

                    // We need to see if there is an AI that would block this object from being placed there
                    //log(chalk.cyan("Need to check to see if an AI rule might prevent this"));
                    let ai_index = -1;
                    if(scope === 'planet') {
                        let planet_index = await planet.getIndex(dirty, { 'planet_id': temp_coord.planet_id, 'source': 'game.drop' });
                        if(planet_index !== -1 && dirty.planets[planet_index].ai_id) {
                            ai_index = await game_object.getIndex(dirty, dirty.planets[planet_index].ai_id);

                        }
                    } else if(scope === 'ship') {
                        let ship_index = await game_object.getIndex(dirty, temp_coord.ship_id);
                        if(ship_index !== -1 && dirty.objects[ship_index].ai_id) {
                            ai_index = await game_object.getIndex(dirty, dirty.objects[ship_index].ai_id);
                        }
                    }

                    if(ai_index !== -1) {
                        console.log("Found AI");
                        let ai_rules = dirty.rules.filter(rule => rule.object_id === dirty.objects[ai_index].id);
                        if(ai_rules.length > 0) {
                            for(let ai_rule of ai_rules ) {
                                // We're going to return false unless we are the ones that own the planet
                                if(ai_rule.rule === 'building_no_others') {
                                    if(socket.player_id !== dirty.objects[ai_index].player_id) {
                                        console.log("AI rule has denied the drop");
                                        socket.emit('result_info', { 'status': 'failure', 'text': "The AI has prevented this action" });
                                        socket.emit('chat', {'message': "The AI does not allow you to build here", 'scope': 'system' });
                                        return false;
                                    }
                                }
                            }
                        }
                    }

                    let object_update_data = update_data;
                    object_update_data.object_id = dirty.inventory_items[inventory_item_index].object_id;


                    // If there was a requirement that something else was there previously, we can remove that now
                    if(dirty.object_types[object_type_index].drop_requires_object_type_id && temp_coord.object_id) {
                        let removing_object_index = await game_object.getIndex(dirty, temp_coord.object_id);
                        if(removing_object_index !== -1) {
                            await game_object.deleteObject(dirty, { 'object_index': removing_object_index });
                        }
                    }

                    // In the case of a ship engine or weapon, we would remove whatever was there before too
                    if(dirty.object_types[object_type_index].is_ship_weapon && temp_coord.object_id) {
                        let removing_object_index = await game_object.getIndex(dirty, temp_coord.object_id);
                        if(removing_object_index !== -1) {
                            await game_object.deleteObject(dirty, { 'object_index': removing_object_index });
                        }
                    } else if(dirty.object_types[object_type_index].is_ship_weapon && temp_coord.object_type_id) {
                        await main.updateCoordGeneric(socket, { 'ship_coord_index': coord_index, 'object_type_id': false });
                    }

                    if(dirty.object_types[object_type_index].is_ship_engine && temp_coord.object_id) {
                        
                        let removing_object_index = await game_object.getIndex(dirty, temp_coord.object_id);
                        if(removing_object_index !== -1) {
                            await game_object.deleteObject(dirty, { 'object_index': removing_object_index });
                        }
                    } else if(dirty.object_types[object_type_index].is_ship_engine && temp_coord.object_type_id) {
                        await main.updateCoordGeneric(socket, { 'ship_coord_index': coord_index, 'object_type_id': false });
                    }

                    let placed_result = await game_object.place(socket, dirty, object_update_data);

                    console.log("placed_result: " + placed_result);

                    if(placed_result === true) {
                        await inventory.removeFromInventory(socket, dirty,
                            { 'inventory_item_id': dirty.inventory_items[inventory_item_index].id, 'amount': 1 });

                        await inventory.sendInventory(socket, false, dirty, 'player', socket.player_id);
                    }


                    // If this is an object type that spawns things, we need to GET IT GOING! IMMEDIATELY!!!
                    let spawn_linker_index = dirty.spawn_linkers.findIndex(function(obj) { return obj && obj.object_type_id === dirty.objects[object_index].object_type_id; });

                    if(spawn_linker_index !== -1 && dirty.object_types[object_type_index].is_active_frame_count > 1) {
                        console.log("Object type has a spawn linker, and frames - so we should set it as active");

                        dirty.objects[object_index].is_active = true;
                        await game_object.sendInfo(socket, false, dirty, object_index);
                    }

                    // If this was a ship engine, re-calculate the engine power for the ship
                    if(dirty.object_types[object_type_index].is_ship_engine) {
                        console.log("Added a ship engine to a ship. Going to call world.attachShipEngines");
                        let ship_index = await game_object.getIndex(dirty, temp_coord.ship_id);
                        if(ship_index !== -1) {
                            await world.attachShipEngines(dirty, ship_index);
                            await game_object.sendInfo(socket, false, dirty, ship_index);
                        }
                    }



                } else {
                    //console.log("No object id - just update object type id");

                    let type_update_data = update_data;
                    type_update_data.object_type_id = dirty.inventory_items[inventory_item_index].object_type_id;
                    type_update_data.amount = dropping_amount;

                    await main.updateCoordGeneric(socket, type_update_data);

                    let remove_inventory_data = { 'inventory_item_id': dirty.inventory_items[inventory_item_index].id,
                        'amount': dropping_amount };
                    await inventory.removeFromInventory(socket, dirty, remove_inventory_data);
                    await inventory.sendInventory(socket, false, dirty, 'player', socket.player_id);
                }


            } else {
                console.log("Unable to place object there");
                socket.emit('chat', {'message':'Unable to place object there', 'scope': 'system'});
                socket.emit('result_info', { 'status': 'failure', 'text': 'Unable to place there' });
            }



        } catch(error) {
            log(chalk.red("Error in game.drop: " + error));
            console.error(error);
        }

    }

    exports.drop = drop;



    //  data:   inventory_item_id   |   equip_slot
    async function equipItem(socket, dirty, data) {

        try {


            let inventory_item_id = parseInt(data.inventory_item_id);

            if(!socket.player_id) {
                return false;
            }


            let inventory_item_index = await main.getInventoryItemIndex(inventory_item_id);

            if(inventory_item_index === -1) {
                return false;
            }

            if(dirty.inventory_items[inventory_item_index].player_id !== dirty.players[socket.player_index].id) {
                return false;
            }


            // lets get the object type for the inventory item
            let object_type_index = dirty.object_types.findIndex(function(obj) {
                return obj && obj.id === dirty.inventory_items[inventory_item_index].object_type_id; });

            console.log("Got object type index as: " + object_type_index);

            // lets get the player body
            //TEMP HAVE A THING WHERE WE ADD IN BODY STUFF HERE. Should be added when the player is created.
            if(!dirty.players[socket.player_index].body_id) {
                await world.setPlayerBody(dirty, socket.player_index);

            }

            // Find the equipment linker associated with this object type and placement
            let equipment_linker_index = await main.getObjectTypeEquipmentLinkerIndex(
                { 'object_type_id': dirty.object_types[object_type_index].id, 'equip_slot': data.equip_slot});

            // Didn't find a linker. Let the player know that we can't equip it there
            if(equipment_linker_index === -1) {
                console.log("Did not find object_type_equipment linker with object_type_id: " + dirty.object_types[object_type_index].id +
                    " equip_slot: " + data.equip_slot);
                socket.emit('chat', { 'message': "Unable to equip. Cannot be equipped to that slot", 'scope': 'system'});
                return false;
            }


            //console.log("Checking to see what else the player has equipped at: " + data.equip_slot);
            let current_equip_slot_count = 0;
            let current_capacity_used = 0;
            let current_complexity = 0;

            dirty.equipment_linkers.forEach(function(equipment_linker, i) {
                if(equipment_linker.body_id === dirty.players[socket.player_index].body_id && equipment_linker.equip_slot === data.equip_slot) {
                    current_equip_slot_count++;

                    let existing_object_type_index = main.getObjectTypeIndex(equipment_linker.object_type_id);

                    current_complexity += dirty.object_types[existing_object_type_index].complexity;

                    let existing_equipment_linker_index = main.getObjectTypeEquipmentLinkerIndex(
                        { 'object_type_id': dirty.object_types[existing_object_type_index].id, 'equip_slot': equipment_linker.equip_slot });

                    if(existing_equipment_linker_index !== -1) {
                        current_capacity_used += dirty.object_type_equipment_linkers[existing_equipment_linker_index].capacity_used;
                    }
                }
            });

            console.log("Found that player already has: " + current_equip_slot_count + " things equipped here with a current capacity used of: " + current_capacity_used);

            let maximum_capacity = 0;
            // If the equip would exceed the maximum capacity for the slot, we can't equip it there
            if(data.equip_slot === 'head') {
                maximum_capacity = 5;
            } else if(data.equip_slot === 'body') {
                maximum_capacity = 7;
            } else if(data.equip_slot === 'left_arm' || data.equip_slot === 'right_arm') {
                maximum_capacity = 3;
            } else if(data.equip_slot === 'legs') {
                maximum_capacity = 4;
            }

            // If maximum_capacity is still 0, its an augment and there is no limit
            if(maximum_capacity !== 0 && current_capacity_used + dirty.object_type_equipment_linkers[equipment_linker_index].capacity_used > maximum_capacity) {
                socket.emit('chat', { 'message': "Unable to equip. Slot does not hae enough capacity to equip this.", 'scope': 'system'});
                return false;
            }

            // AUDO DOC IS REQUIRED. See if the player is on one
            if(current_equip_slot_count > 0 || dirty.object_type_equipment_linkers[equipment_linker_index].auto_doc_required) {


                let player_info = await player.getCoordAndRoom(dirty, socket.player_index);


                if(player_info.coord.object_type_id !== 140) {
                    console.log("Player is not standing on an auto doc. on coord id: " + player_info.coord.id + " object_id: " + player_info.coord.object_id + " Object type id here is: " + player_info.coord.object_type_id);
                    socket.emit('chat', { 'message': "Equipping this at this location requires an auto doc. You need to be standing on an auto doc", 'scope':'system' });
                    socket.emit('result_info', { 'status': 'failure', 'text': 'Auto Doc Required' });
                    return false;
                }

                // Now lets see who owns the auto doc
                let auto_doc_index = await game_object.getIndex(dirty, player_info.coord.object_id);

                if(auto_doc_index === -1) {
                    log(chalk.red("Auto doc isn't there!"));
                    return false;
                }

                let surgery_level = 1;
                let npc_index = await npc.getIndex(dirty, dirty.objects[auto_doc_index].npc_id);

                if(dirty.objects[auto_doc_index].npc_id) {


                    if(npc_index !== -1) {
                        surgery_level = 1 + Math.floor(global.difficult_level_modifier * Math.sqrt(dirty.npcs[npc_index].surgery_skill_points));

                        // surgery level is also the cost
                        let paid_cost = false;
                        for(let i = 0; i < dirty.inventory_items.length && paid_cost === false; i++) {

                            // Finding the player's credit inventory item
                            if(dirty.inventory_items[i] && dirty.inventory_items[i].player_id === dirty.players[socket.player_index].id && dirty.inventory_items[i].object_type_id === 74) {

                                if(dirty.inventory_items[i].amount >= surgery_level) {

                                    // remove from us
                                    let remove_inventory_data = { 'inventory_item_id': dirty.inventory_items[i].id, 'amount': surgery_level };
                                    await inventory.removeFromInventory(socket, dirty, remove_inventory_data);
                                    paid_cost = true;

                                    // give to npc

                                    let adding_to_data = { 'adding_to_type':'npc', 'adding_to_id': dirty.npcs[npc_index].id,
                                        'object_type_id': 74, 'amount': surgery_level };

                                    await inventory.addToInventory(socket, dirty, adding_to_data);

                                }
                                // Failed to pay for it
                                else {
                                    console.log("Player could not afford to pay the NPC");
                                    socket.emit('chat', { 'message': "Failed to pay credit cost of " + surgery_level, 'scope':'system' });
                                    socket.emit('result_info', { 'status': 'failure', 'text': 'Failed To Pay' });
                                    return false;
                                }

                            }
                        }

                    }

                } else if(dirty.objects[auto_doc_index].player_id && dirty.objects[auto_doc_index].player_id === dirty.players[socket.player_index].id) {
                    surgery_level = await player.getLevel(dirty,
                        { 'player_index': socket.player_index, 'scope': 'planet', 'skill_type': 'surgery' });
                }





                // COMPLEXITY CHECK


                //let surgery_level = 1 + Math.floor(global.difficult_level_modifier * Math.sqrt(dirty.players[player_index].surgery_skill_points));
                console.log("Surgery level is: " + surgery_level);
                if(npc_index !== -1) {
                    log(chalk.green("Its a doctor npc doing this!"));
                }

                let resulting_complexity = current_complexity + dirty.object_types[object_type_index].complexity;
                console.log("Complexity for this addition brings total to: " + resulting_complexity);


                let success = world.complexityCheck(surgery_level, resulting_complexity);

                // Equipping was not successful. The slot is a mangled mess and everything in it is destroyed
                if(success === false) {

                    // Since failure sucks, we are going to give the player surgery points for every item in the slot that was destroyed
                    let additional_points_gained = 0;
                    // everything in the equip slot is destroyed
                    dirty.equipment_linkers.forEach(await async function(equipment_linker, i) {

                        try {
                            if(equipment_linker.body_id === dirty.players[socket.player_index].body_id && equipment_linker.equip_slot === data.equip_slot) {

                                let deleting_type_index = main.getObjectTypeIndex(equipment_linker.object_type_id);
                                additional_points_gained += dirty.object_types[deleting_type_index].complexity;

                                socket.emit('equipment_linker_info', { 'equipment_linker': equipment_linker, 'remove': true });

                                await (pool.query("DELETE FROM equipment_linkers WHERE id = ?", [equipment_linker.id]));

                                delete dirty.equipment_linkers[i];


                            }
                        } catch(error) {
                            log(chalk.red("Error in game.equipItem - deleting: " + error));
                        }

                    });

                    // and the inventory item the player was trying this on
                    inventory.removeFromInventory(socket, dirty, { 'inventory_item_id': dirty.inventory_items[inventory_item_index].id, 'amount': 1 });

                    // I also want to damage the player based on the resulting complexity that they failed at
                    await player.damage(dirty, { 'player_index': socket.player_index, 'damage_amount': resulting_complexity,
                        'damage_types': [ 'normal' ], 'flavor_text': "You've been mangled a bit" });

                    if(npc_index !== -1) {
                        dirty.npcs[npc_index].surgery_skill_points += dirty.object_types[object_type_index].complexity + additional_points_gained;
                        dirty.npcs[npc_index].has_change = true;
                    } else {
                        dirty.players[socket.player_index].surgery_skill_points += dirty.object_types[object_type_index].complexity + additional_points_gained;
                        dirty.players[socket.player_index].has_change = true;
                    }

                    await player.sendInfo(socket, player_info.room, dirty, dirty.players[socket.player_index].id);

                    socket.emit('chat', { 'message': "Equipping item failed. Everything in the slot was destroyed", 'scope':'system' });
                    socket.emit('result_info', {'status': 'failure', 'text': "You botched the implant." } );
                    return false;
                }

                // increase surgery skill points
                // Doctor did it
                if(npc_index !== -1) {
                    dirty.npcs[npc_index].surgery_skill_points += dirty.object_types[object_type_index].complexity;
                    dirty.npcs[npc_index].has_change = true;
                } else {
                    dirty.players[socket.player_index].surgery_skill_points += dirty.object_types[object_type_index].complexity;
                    dirty.players[socket.player_index].has_change = true;
                }

            }



            // WE DID IT!!!!!!!

            // The sql is going to be slighty different if there is an object in the inventory item slot,
            //      or it's just a bunch of an object type

            let sql = "";
            let inserts = [];

            // An object. We just insert it
            if(dirty.inventory_items[inventory_item_index].object_id) {
                sql = "INSERT INTO equipment_linkers(body_id, equip_slot, player_id, object_id, object_type_id)VALUES(?, ?, ?, ?, ?)";
                inserts = [dirty.players[socket.player_index].body_id, data.equip_slot, socket.player_id, dirty.inventory_items[inventory_item_index].object_id, dirty.object_types[object_type_index].id];
            }
            // An object type that isn't consumed on attack - just one of it
            else if(dirty.inventory_items[inventory_item_index].object_type_id && !dirty.object_types[object_type_index].is_consumed_on_attack) {
                sql = "INSERT INTO equipment_linkers(amount, body_id, equip_slot, player_id, object_type_id)VALUES(?, ?, ?, ?, ?)";
                inserts = [1, dirty.players[socket.player_index].body_id, data.equip_slot, socket.player_id, dirty.object_types[object_type_index].id];
            }
            // An object type that is consumed on attack - all of it baby!
            else if(dirty.inventory_items[inventory_item_index].object_type_id && dirty.object_types[object_type_index].is_consumed_on_attack) {
                sql = "INSERT INTO equipment_linkers(amount, body_id, equip_slot, player_id, object_type_id)VALUES(?, ?, ?, ?, ?)";
                inserts = [dirty.inventory_items[inventory_item_index].amount, dirty.players[socket.player_index].body_id, data.equip_slot, socket.player_id, dirty.object_types[object_type_index].id];
            }

            let [result] = await (pool.query(sql, inserts));
            let insert_id = result.insertId;

            let new_equipment_index = await main.getEquipmentLinkerIndex({ 'equipment_linker_id': insert_id });
            //console.log("Got insert id as: " + result.insertId);


            //console.log("Sending new equipment linker info");

            socket.emit('equipment_linker_info', { 'equipment_linker': dirty.equipment_linkers[new_equipment_index]});

            if(dirty.inventory_items[inventory_item_index].object_id) {
                inventory.removeFromInventory(socket, dirty, {
                    'inventory_item_id': dirty.inventory_items[inventory_item_index].id, 'amount': 1 });
            }
            else if(dirty.inventory_items[inventory_item_index].object_type_id && !dirty.object_types[object_type_index].is_consumed_on_attack) {
                inventory.removeFromInventory(socket, dirty, {
                    'inventory_item_id': dirty.inventory_items[inventory_item_index].id, 'amount': 1 });
            }
            else if(dirty.inventory_items[inventory_item_index].object_type_id && dirty.object_types[object_type_index].is_consumed_on_attack) {
                inventory.removeFromInventory(socket, dirty, {
                    'inventory_item_id': dirty.inventory_items[inventory_item_index].id, 'amount': dirty.inventory_items[inventory_item_index].amount });
            }



            calculatePlayerStats(socket, dirty);







            await player.sendInfo(socket, false, dirty, dirty.players[socket.player_index].id);

            if(current_equip_slot_count > 0 || dirty.object_type_equipment_linkers[equipment_linker_index].auto_doc_required) {
                socket.emit('chat', { 'message': "Surgery was successful", 'scope':'system' });
                socket.emit('result_info', {'status': 'success', 'text': "Surgery successful" } );
            } else {
                socket.emit('chat', { 'message': "Equipping item was a success", 'scope':'system' });
                socket.emit('result_info', {'status': 'success', 'text': "Item Equipped" } );
            }





        } catch(error) {
            log(chalk.red("Error in game.equipItem: " + error));
            console.error(error);
        }
    }
    exports.equipItem = equipItem;

    //  data:   spawn_linker_index   |   object_index   |   monster_index

    async function finishSpawnLinker(dirty, data) {

        try {

            let debug_object_type_id = 315;

            if(typeof data.object_index !== "undefined" && dirty.objects[data.object_index].object_type_id === debug_object_type_id) {
                console.log("Finishing spawn linker id: " + dirty.spawn_linkers[data.spawn_linker_index].id + " for object id: " + dirty.objects[data.object_index].id);
            }


            let spawner_info = {};

            if(data.object_index) {
                spawner_info = await game_object.getCoordAndRoom(dirty, data.object_index);
            }

            if(data.monster_index) {
                spawner_info = await monster.getCoordAndRoom(dirty, data.monster_index);

                if(spawner_info.coord_index === -1) {
                    log(chalk.yellow("Could not get the coord index for monster id: " + dirty.monsters[data.monster_index]));
                    return false;
                }
            }

            // HAS SPAWNED OBJECT
            if(dirty.spawn_linkers[data.spawn_linker_index].spawns_location === 'has_spawned_object') {

                if(typeof data.object_index !== "undefined" && dirty.objects[data.object_index].object_type_id === debug_object_type_id) {
                    console.log("Spawn linker sets has_spawned_object");
                }

                if(data.object_index) {

                    dirty.objects[data.object_index].has_spawned_object = true;
                    dirty.objects[data.object_index].spawned_object_type_amount = dirty.spawn_linkers[data.spawn_linker_index].spawns_amount;
                    dirty.objects[data.object_index].current_spawn_linker_id = dirty.spawn_linkers[data.spawn_linker_index].id;

                    if(dirty.objects[data.object_index].is_active) {
                        dirty.objects[data.object_index].is_active = false;
                    }

                    dirty.objects[data.object_index].has_change = true;

                    await game_object.sendInfo(false, spawner_info.room, dirty, data.object_index);
                }

                if(data.monster_index) {

                    dirty.monsters[data.monster_index].has_spawned_object = true;
                    dirty.monsters[data.monster_index].spawned_monster_type_amount = dirty.spawn_linkers[data.spawn_linker_index].spawns_amount;
                    dirty.monsters[data.monster_index].current_spawn_linker_id = dirty.spawn_linkers[data.spawn_linker_index].id;
                    dirty.monsters[data.monster_index].has_change = true;

                    await monster.sendInfo(false, spawner_info.room, dirty, data.monster_index);
                }

            } else if(dirty.spawn_linkers[data.spawn_linker_index].spawns_location === 'adjacent') {

                if(typeof data.object_index !== "undefined" && dirty.objects[data.object_index].object_type_id === debug_object_type_id) {
                    console.log("Spawn linker spawns adjacent");
                }

                let spawn_adjacent_data = {};

                spawn_adjacent_data.scope = spawner_info.scope;
                spawn_adjacent_data.base_coord_index = spawner_info.coord_index;

                spawn_adjacent_data.spawning_amount = dirty.spawn_linkers[data.spawn_linker_index].spawns_amount;

                if(dirty.spawn_linkers[data.spawn_linker_index].spawns_object_type_id) {
                    spawn_adjacent_data.spawning_type = 'object';
                    spawn_adjacent_data.spawning_type_id = dirty.spawn_linkers[data.spawn_linker_index].spawns_object_type_id;
                }

                if(dirty.spawn_linkers[data.spawn_linker_index].spawns_monster_type_id) {
                    spawn_adjacent_data.spawning_type = 'monster';
                    spawn_adjacent_data.spawning_type_id = dirty.spawn_linkers[data.spawn_linker_index].spawns_monster_type_id;
                }


                /*
                if(data.monster_index) {
                    log(chalk.cyan("Monser id: " + dirty.monsters[data.monster_index].id + " is spawning something"));
                } else if(data.object_index) {
                    console.log("Object id: " + dirty.objects[data.object_index].id + " is spawning something");
                }
                console.log("Spawn linker id: " + dirty.spawn_linkers[data.spawn_linker_index].id + " Going to call spawnAdjacent with:");
                console.log(spawn_adjacent_data);
                */
                await world.spawnAdjacent(dirty, spawn_adjacent_data);
            } else if(dirty.spawn_linkers[data.spawn_linker_index].spawns_location === 'self') {
                if(typeof data.object_index !== "undefined" && dirty.objects[data.object_index].object_type_id === debug_object_type_id) {
                    console.log("Spawn linker replaces our object! self!");
                }

                // Delete what was there

                let spawned_event_id = false;

                if(typeof data.monster_index !== "undefined" && dirty.monsters[data.monster_index].spawned_event_id) {

                    spawned_event_id = dirty.monsters[data.monster_index].spawned_event_id;

                    let delete_monster_data = {};
                    if(helper.notFalse(dirty.monsters[data.monster_index].spawned_event_id)) {
                        delete_monster_data.skip_check_spawned_event = true;
                    }

                    await monster.deleteMonster(dirty, data.monster_index, delete_monster_data);
                }



                if(typeof data.object_index !== "undefined" && dirty.objects[data.object_index].spawned_event_id) {

                    spawned_event_id = dirty.objects[data.object_index].spawned_event_id;

                    console.log("The spawned event id of the object that is turning into something else: " + spawned_event_id);

                    let delete_object_data = { 'object_index': data.object_index };

                    if(helper.notFalse(dirty.objects[data.object_index].spawned_event_id)) {
                        log(chalk.green("Telling deleteObject to skip check spawned event"));
                        delete_object_data.skip_check_spawned_event = true;
                    }

                    await game_object.deleteObject(dirty, delete_object_data);
                }



                // Spawning a monster where we were
                if(helper.notFalse(dirty.spawn_linkers[data.spawn_linker_index].spawns_monster_type_id)) {
                    console.log("Spawning a monster where we used to be! Monster type id: " + dirty.spawn_linkers[data.spawn_linker_index].spawns_monster_type_id);
                    let spawn_monster_data = { 'spawned_event_id': spawned_event_id };

                    if(spawner_info.scope === 'planet') {
                        spawn_monster_data.planet_coord_index = spawner_info.coord_index;
                    } else if(spawner_info.scope === 'ship') {
                        spawn_monster_data.ship_coord_index = spawner_info.coord_index;
                    } else if(spawner_info.scope === 'galaxy') {
                        spawn_monster_data.coord_index = spawner_info.coord_index;
                    }

                    await monster.spawn(dirty, dirty.spawn_linkers[data.spawn_linker_index].spawns_monster_type_id, spawn_monster_data);
                }

                // Spawning an object where we were
                if(helper.notFalse(dirty.spawn_linkers[data.spawn_linker_index].spawns_object_type_id)) {
                    console.log("Spawning an object where we used to be! Object type id: " + dirty.spawn_linkers[data.spawn_linker_index].spawns_object_type_id);

                    let insert_object_type_data = { 'object_type_id': dirty.spawn_linkers[data.spawn_linker_index].spawns_object_type_id,
                        'spawned_event_id': spawned_event_id };

                    let new_object_index = await world.insertObjectType(false, dirty, insert_object_type_data);

                    let place_object_data = { 'object_index': new_object_index };

                    if(spawner_info.scope === 'planet') {
                        place_object_data.planet_coord_index = spawner_info.coord_index;
                    } else if(spawner_info.scope === 'ship') {
                        place_object_data.ship_coord_index = spawner_info.coord_index;
                    }

                    await game_object.place(false, dirty, place_object_data);
                }



            } else {
                log(chalk.yellow("Did not find a match for this linker's spawns_location: " + dirty.spawn_linkers[data.spawn_linker_index].spawns_location));
                console.error(error);
            }

        } catch(error) {
            log(chalk.red("Error in game.finishSpawnLinker:" + error));
            console.error(error);
        }
    }

    exports.finishSpawnLinker = finishSpawnLinker;

    /**
     * 
     * @param {Object} socket 
     * @param {Object} data 
     * @param {number=} data.object_id
     */
    async function fix(socket, dirty, data) {
        try {

            log(chalk.yellow("A client seems to think something needs fixing"));

            if(data.object_id) {

                console.log("An object potentially needs fixing. object.id: " + data.object_id);

                data.object_id = parseInt(data.object_id);

                let object_index = await game_object.getIndex(dirty, data.object_id);

                if(object_index === -1) {
                    // TODO tell the client to remove the object
                    log(chalk.yellow("Object doesn't exist"));
                    return false;
                }

                let object_type_index = main.getObjectTypeIndex(dirty.objects[object_index].object_type_id);
                if(object_type_index === -1) {
                    log(chalk.yellow("Could not get object type"));
                    return false;
                }

                // Scenario 1: The object has a coord id, but multiple coords have this object id
                if(dirty.objects[object_index].coord_id) {
                    console.log("Object has a coord id");

                    let matching_coord_index = await main.getCoordIndex({ 'coord_id': dirty.objects[object_index].coord_id });

                    if(matching_coord_index !== -1) {

                        // remove it from the other coords
                        for(let i = 0; i < dirty.coords.length; i++) {

                            if(dirty.coords[i] && dirty.coords[i].object_id === dirty.objects[object_index].id && dirty.coords[i].id !== dirty.coords[matching_coord_index].id) {

                                await main.updateCoordGeneric(socket, { 'coord_index': i, object_id: false });
                            }

                        }
                    }

                } else if(helper.isFalse(dirty.objects[object_index].coord_id) && helper.isFalse(dirty.objects[object_index].ship_coord_id) && 
                    helper.isFalse(dirty.objects[object_index].planet_coord_id)) {

                    console.log("Object has no type of coord");
                    // The object is nowhere. Lets see if it's a normal ship, and if so, remove it from galaxy coords
                    // We want to be very specific to start so there aren't unintended consequences
                    if(dirty.object_types[object_type_index].is_ship && !dirty.object_types[object_type_index].is_dockable) {
                        console.log("Object is a ship that is not dockable");

                        // See if the player that owns this ship is connected

                        for(let i = 0; i < dirty.coords.length; i++) {
                            if(dirty.coords[i] && dirty.coords[i].object_id === dirty.objects[object_index].id) {
                                log(chalk.red("Found a coords where the object_id (a ship) wasn't updated! " + dirty.coords[i].tile_x + "," + dirty.coords[i].tile_y));
                                await main.updateCoordGeneric(socket, { 'coord_index': i, 'object_id': false });
                            }
                        }
                    }
                    

                } else {
                    console.log("Object did not match any of our fixing criteria");
                }



            }


        } catch(error) {
            log(chalk.red("Error in game.fix: " + error));
            console.error(error);
        }
    } 

    exports.fix = fix;




    // WARNING WARNING WARNING::::::
    // *****************************
    // This function is actively making ships left out on the galaxy disappear!!!!!!!
    // I believe I originally wrote it when the player's ship wasn't disappearing properly from galaxy coords.
    // As it stands, if a ship is just left on the map, this function will make it disappear
    async function fixAll(dirty) {
        try {

            /*
            console.time("fixAll");

            // Lets focus on logged out players to start
            for(let i = 0; i < dirty.players.length; i++) {

                if(dirty.players[i] && helper.isFalse(dirty.players[i].coord_id) && helper.isFalse(dirty.players[i].planet_coord_id) && 
                    helper.isFalse(dirty.players[i].ship_coord_id)) {
                    //console.log("Player id: " + dirty.players[i].id + " looks to be logged out (not on any coord)");


                    let non_dockable_ship_object_type_ids = [];

                    for(let object_type of dirty.object_types) {
                        if(object_type.is_ship && !object_type.is_dockable) {
                            //console.log("Pushed non dockable ship type");
                            non_dockable_ship_object_type_ids.push(object_type.id);
                        }
                    }

                    let ship_ids = [];

                    for(let o = 0; o < dirty.objects.length; o++) {


                        if(dirty.objects[o] && dirty.objects[o].player_id === dirty.players[i].id && 
                            non_dockable_ship_object_type_ids.indexOf(dirty.objects[o].object_type_id) !== -1) {


                                //console.log("Pushed ship id: " + dirty.objects[o].id);
                                ship_ids.push(dirty.objects[o].id);

                        }
                    }


                    if(ship_ids.length > 0) {
                        //console.log("Player had ships");

                        for(let c = 0; c < dirty.coords.length; c++) {
                            if(dirty.coords[c] && dirty.coords[c].object_id && ship_ids.indexOf(dirty.coords[c].object_id) !== -1) {
                                log(chalk.red("In fixAll Found a coords where the object_id (a ship) wasn't updated! " + dirty.coords[c].tile_x + "," + dirty.coords[c].tile_y));
                                await main.updateCoordGeneric(socket, { 'coord_index': c, 'object_id': false });

                            }
                        }
                    }
                }
            }

            console.timeEnd("fixAll");

            */



        } catch(error) {
            log(chalk.red("Error in game.fixAll: " + error));
            console.error(error);
        }
    }

    exports.fixAll = fixAll;


    function getFloorTypes() {
        var floor_types = [];

        var sql = "SELECT * FROM floor_types";
        pool.query(sql, function(err, rows, fields) {
            if(err) throw(err);

            for(var i = 0; i < rows.length; i++) {
                floor_types.push(rows[i]);
            }

            console.log("Returning " + floor_types);

            return floor_types;

        });

    }
    exports.getFloorTypes = getFloorTypes;

    
    // TODO I still absolutely hate how this function iterates over all the ship coords a billion times.
    async function generateShipDamagedTiles(dirty, ship_index, being_repaired_coord_index = false) {
        try {
            //console.time("generateShipDamagedTiles");

            let ship_type_index = main.getObjectTypeIndex(dirty.objects[ship_index].object_type_id);
            if(ship_type_index === -1) {
                return false;
            }

            let ship_linkers = dirty.ship_linkers.filter(linker => linker.ship_type_id === dirty.object_types[ship_type_index].id);
            let ship_linker_count = ship_linkers.length;

            //console.log("Calculating damaged tiles for ship type: " + dirty.object_types[ship_type_index].name + " with ship linker count: " + ship_linker_count);

            let hp_per_tile = dirty.object_types[ship_type_index].hp / ship_linker_count;

            //console.log("HP per tile: " + hp_per_tile);

            let new_damaged_tile_count = 0;

            // There's some damage, we aren't going to have a 0 result
            if(dirty.objects[ship_index].current_hp !== dirty.object_types[ship_type_index].hp) {
                new_damaged_tile_count = Math.ceil((dirty.object_types[ship_type_index].hp - dirty.objects[ship_index].current_hp) / hp_per_tile);
            }

            if(typeof dirty.objects[ship_index].damaged_coord_count === "undefined") {

                let damaged_coord_count = 0;

                for(let i = 0; i < dirty.ship_coords.length; i++) {

                    // Coord exists and is for our ship - lets see if its damaged
                    if(dirty.ship_coords[i] && dirty.ship_coords[i].ship_id === dirty.objects[ship_index].id) {

                        let is_ship_wall_coord = false;
                        // See if the wall is damaged
                        if(dirty.ship_coords[i].object_type_id) {

                            let object_type_index = main.getObjectTypeIndex(dirty.ship_coords[i].object_type_id);

                            if(object_type_index !== -1) {

                                if(dirty.object_types[object_type_index].repaired_object_type_id) {
                                    damaged_coord_count++;
                                    is_ship_wall_coord = true;
                                }

                                if(dirty.object_types[object_type_index].is_ship_wall) {
                                    is_ship_wall_coord = true;
                                }
                                
                            }
                        }

                        if(!is_ship_wall_coord) {
                            let floor_type_index = main.getFloorTypeIndex(dirty.ship_coords[i].floor_type_id);
                            if(floor_type_index !== -1 && dirty.floor_types[floor_type_index].repaired_floor_type_id) {
                                damaged_coord_count++;
                            }
                        }
                    }
                }


                dirty.objects[ship_index].damaged_coord_count = damaged_coord_count;

            }

            // Heal a tile
            if(dirty.objects[ship_index].damaged_coord_count > new_damaged_tile_count) {


                let coords_to_repair = dirty.objects[ship_index].damaged_coord_count - new_damaged_tile_count;

                for(let i = 0; i < dirty.ship_coords.length && coords_to_repair > 0; i++) {

                    let repaired_coord = false;

                    // Coord exists and is for our ship - lets see if its damaged
                    if(dirty.ship_coords[i] && dirty.ship_coords[i].ship_id === dirty.objects[ship_index].id) {

                        let is_ship_wall_coord = false;
                        // See if the wall is damaged
                        if(dirty.ship_coords[i].object_type_id) {

                            let object_type_index = main.getObjectTypeIndex(dirty.ship_coords[i].object_type_id);

                            if(object_type_index !== -1) {

                                if(dirty.object_types[object_type_index].is_ship_wall) {
                                    is_ship_wall_coord = true;
                                }

                                // It's a wall we can heal
                                if(dirty.object_types[object_type_index].repaired_object_type_id) {
                                    dirty.ship_coords[i].object_type_id = dirty.object_types[object_type_index].repaired_object_type_id;
                                    repaired_coord = true;
                                    coords_to_repair--;
                                    dirty.objects[ship_index].damaged_coord_count--;
                                }

                                
                            }
                        }

                        if(!is_ship_wall_coord) {
                            let floor_type_index = main.getFloorTypeIndex(dirty.ship_coords[i].floor_type_id);
                            if(floor_type_index !== -1 && dirty.floor_types[floor_type_index].repaired_floor_type_id) {
                                dirty.ship_coords[i].floor_type_id = dirty.floor_types[floor_type_index].repaired_floor_type_id;
                                repaired_coord = true;
                                coords_to_repair--;
                                dirty.objects[ship_index].damaged_coord_count--;
                            }
                        }
                    }

                    if(repaired_coord) {

                        dirty.ship_coords[i].is_damaged = false;
                        dirty.ship_coords[i].has_change = true;

                        // Send the updated coord info
                        await world.sendShipCoordInfo(false, "ship_" + dirty.objects[ship_index].id, dirty, { 'ship_coord_index': i });

                        // Remove any repairing linkers on this coord
                        for(let r = 0; r < dirty.repairing_linkers.length; r++) {
                            if(dirty.repairing_linkers[r] && dirty.repairing_linkers[r].ship_coord_id === dirty.ship_coords[i].id) {
                                io.to(dirty.repairing_linkers[r].player_socket_id).emit('repairing_linker_info',
                                { 'remove': true, 'repairing_linker': dirty.repairing_linkers[r] });

                            delete dirty.repairing_linkers[r];
                            }
                        }
                    }
                }
            }
            // Damage a tile
            else if(dirty.objects[ship_index].damaged_coord_count < new_damaged_tile_count) {

                console.log("Going to try and damage a tile");
                let coords_to_damage = new_damaged_tile_count - dirty.objects[ship_index].damaged_coord_count;

                for(let i = 0; i < dirty.ship_coords.length && coords_to_damage > 0; i++) {

                    let damaged_coord = false;

                    // Coord exists and is for our ship - lets see if its damaged
                    if(dirty.ship_coords[i] && dirty.ship_coords[i].ship_id === dirty.objects[ship_index].id) {

                        let is_ship_wall_coord = false;
                        // See if the wall is damaged
                        if(dirty.ship_coords[i].object_type_id) {

                            let object_type_index = main.getObjectTypeIndex(dirty.ship_coords[i].object_type_id);

                            if(object_type_index !== -1) {

                                if(dirty.object_types[object_type_index].is_ship_wall) {
                                    console.log("On coord that is ship wall");
                                    is_ship_wall_coord = true;

                                    // see if there's an object type that repairs to us - then we can switch to that object type
                                    let turns_into_object_type_index = dirty.object_types.findIndex(function(obj) { return obj && 
                                        obj.repaired_object_type_id === dirty.object_types[object_type_index].id; });

                                    if(turns_into_object_type_index !== -1) {
                                        console.log("Changing wall to damaged type");
                                        dirty.ship_coords[i].object_type_id = dirty.object_types[turns_into_object_type_index].id;
                                        damaged_coord = true;
                                        coords_to_damage--;
                                        dirty.objects[ship_index].damaged_coord_count++;
                                    } else {
                                        console.log("No object type has repaired_object_type_id = " + dirty.object_types[object_type_index].id);
                                    }
                                }

                        
                            }
                        }

                        if(!is_ship_wall_coord) {

                            let turns_into_floor_type_index = dirty.floor_types.findIndex(function(obj) { return obj && 
                                obj.repaired_floor_type_id === dirty.ship_coords[i].floor_type_id; });

                            if(turns_into_floor_type_index !== -1) {
                                dirty.ship_coords[i].floor_type_id = dirty.floor_types[turns_into_floor_type_index].id;
                                damaged_coord = true;
                                coords_to_damage--;
                                dirty.objects[ship_index].damaged_coord_count++;
                            }

                        }
                    }

                    if(damaged_coord) {

                        dirty.ship_coords[i].is_damaged = true;
                        dirty.ship_coords[i].has_change = true;

                        // Send the updated coord info
                        await world.sendShipCoordInfo(false, "ship_" + dirty.objects[ship_index].id, dirty, { 'ship_coord_index': i });

                    }
                }
            }




            //console.timeEnd("generateShipDamagedTiles");
        } catch(error) {
            log(chalk.red("Error in game.generateShipDamagedTiles:" + error));
            console.error(error);
        }
    }

    exports.generateShipDamagedTiles = generateShipDamagedTiles;
    

    /*
    // If a coord index has been passed in, any healing should be done on that coord of the ship
    async function generateShipDamagedTiles(dirty, ship_index, being_repaired_coord_index = false) {

        try {
            console.time("generateShipDamagedTiles");

            let ship_type_index = main.getObjectTypeIndex(dirty.objects[ship_index].object_type_id);
            if(ship_type_index === -1) {
                return false;
            }



            let ship_linkers = dirty.ship_linkers.filter(linker => linker.ship_type_id === dirty.object_types[ship_type_index].id);
            let ship_linker_count = ship_linkers.length;

            //console.log("Calculating damaged tiles for ship type: " + dirty.object_types[ship_type_index].name + " with ship linker count: " + ship_linker_count);

            let hp_per_tile = dirty.object_types[ship_type_index].hp / ship_linker_count;

            //console.log("HP per tile: " + hp_per_tile);

            let damaged_tile_count = 0;

            // There's some damage, we aren't going to have a 0 result
            if(dirty.objects[ship_index].current_hp !== dirty.object_types[ship_type_index].hp) {
                damaged_tile_count = Math.ceil((dirty.object_types[ship_type_index].hp - dirty.objects[ship_index].current_hp) / hp_per_tile);
            }

            //console.log("Ship has " + dirty.objects[ship_index].current_hp + " current hp. Damaged tile count: " + damaged_tile_count);

            // see how many damaged tiles the ship actually has
            let current_damaged_ship_coords = dirty.ship_coords.filter(ship_coord => ship_coord.ship_id === dirty.objects[ship_index].id &&
                (ship_coord.object_type_id === 216 || ship_coord.floor_type_id === 23));

            //console.log("Ship currently has: " + current_damaged_ship_coords.length + " damaged coords");

            // Lets heal a tile!
            if(current_damaged_ship_coords.length > damaged_tile_count) {
                console.log("Healing a tile");

                let damaged_coord_index = -1;
                if(being_repaired_coord_index !== false) {
                    console.log("Was sent in a being_repaired_coord_index");
                    damaged_coord_index = being_repaired_coord_index;
                } else {
                    damaged_coord_index = dirty.ship_coords.findIndex(function(obj) { return obj &&
                        obj.ship_id === dirty.objects[ship_index].id && (obj.object_type_id === 216 || obj.floor_type_id === 23); });
                }

                if(damaged_coord_index === -1) {
                    log(chalk.yellow("Unable to find damaged coord"));
                    return false;
                }

                if(dirty.ship_coords[damaged_coord_index].object_type_id === 216) {
                    dirty.ship_coords[damaged_coord_index].object_type_id = 215;
                    dirty.ship_coords[damaged_coord_index].has_change = true;
                }

                if(dirty.ship_coords[damaged_coord_index].floor_type_id === 23) {
                    dirty.ship_coords[damaged_coord_index].floor_type_id = 14;
                    dirty.ship_coords[damaged_coord_index].has_change = true;
                }

                await world.sendShipCoordInfo(false, "ship_" + dirty.objects[ship_index].id, dirty, { 'ship_coord_index': damaged_coord_index });

                // If we just healed a coord that we being repaired, we remove the repairing linkers that were on that coord
                if(being_repaired_coord_index !== false) {
                    //console.log("Going to remove repairing linkers that were associated with the tile being healed");
                    dirty.repairing_linkers.forEach(function(repairing_linker, i) {
                        if(repairing_linker.ship_coord_id === dirty.ship_coords[damaged_coord_index].id) {

                            io.to(dirty.repairing_linkers.player_socket_id).emit('repairing_linker_info',
                                { 'remove': true, 'repairing_linker': dirty.repairing_linkers[i] });

                            delete dirty.repairing_linkers[i];
                        }
                    });

                }


            }
            // Lets damage a tile
            else if(current_damaged_ship_coords.length < damaged_tile_count) {
                console.log("Damaging a tile");

                // Lets damage floors before walls
                let damaging_coord_index = dirty.ship_coords.findIndex(function(obj) { return obj &&
                    obj.ship_id === dirty.objects[ship_index].id && obj.objct_type_id === 215; });

                if(damaging_coord_index === -1) {
                    damaging_coord_index = dirty.ship_coords.findIndex(function(obj) { return obj &&
                        obj.ship_id === dirty.objects[ship_index].id && obj.floor_type_id === 14 && !obj.object_type_id && !obj.object_id; });
                }


                if(damaging_coord_index === -1) {
                    log(chalk.yellow("Could not get a ship coord to damage"));
                    return false;
                }

                // Only going to damage a wall or a floor. Wall -> floor, since we won't be able to see the damaged floor
                if(dirty.ship_coords[damaging_coord_index].object_type_id === 215) {
                    dirty.ship_coords[damaging_coord_index].object_type_id = 216;
                    dirty.ship_coords[damaging_coord_index].has_change = true;
                    console.log("Updating wall");
                } else if(dirty.ship_coords[damaging_coord_index].floor_type_id === 14) {
                    dirty.ship_coords[damaging_coord_index].floor_type_id = 23;
                    dirty.ship_coords[damaging_coord_index].has_change = true;
                    console.log("Updating floor");
                }

                await world.sendShipCoordInfo(false, "ship_" + dirty.objects[ship_index].id, dirty, { 'ship_coord_index': damaging_coord_index });
            }

            console.timeEnd("generateShipDamagedTiles");




        } catch(error) {
            log(chalk.red("Error in game.generateShipDamagedTile: " + error));
            console.error(error);
        }
    }

    exports.generateShipDamagedTiles = generateShipDamagedTiles;
    */


    /*
    NOT USING THIS ANYMORE!!!!
    INSTEAD HAVE IT SPAWN THE THING AFTER SEVERAL TICKS (SEE KICK PLANT)
    async function growObject(dirty, object_id) {
        try {

            let object_index = await game_object.getIndex(dirty, object_id);

            if(object_index === -1) {
                return false;
            }

            let object_type_index = main.getObjectTypeIndex(dirty.objects[object_index].object_type_id);

            //log(chalk.cyan("Growing object id: " + dirty.objects[object_index].id + " spawned_event_id: "
            //    + dirty.objects[object_index].spawned_event_id + " planet_coord_id: " + dirty.objects[object_index].id));

            let grows_into_object_type_index = main.getObjectTypeIndex(dirty.object_types[object_type_index].grows_into_object_type_id);

            // TODO - Eventually we need some sort of system for a native environment

            let needs_complexity_check = false;
            let player_socket = false;
            let player_index = false;
            let success = true;

            // get the index of the coord that the object is on
            let coord_index = -1;
            if(dirty.objects[object_index].planet_coord_id) {
                coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.objects[object_index].planet_coord_id });
                console.log("Got coord index of planet_coord_id: " + dirty.objects[object_index].planet_coord_id + " as: " + coord_index);
            } else if(dirty.objects[object_index].ship_coord_id) {
                coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.objects[object_index].ship_coord_id });
            }

            if(coord_index === -1) {
                log(chalk.yellow("Did not find the coord that the object is on. object id: " + dirty.objects[object_index].id +
                    " planet_coord_id: " + dirty.objects[object_index].planet_coord_id + " ship_coord_id: " + dirty.objects[object_index].ship_coord_id));

                // We have an object on a planet coord that doesn't exist. Obviously did something wrong
                if(dirty.objects[object_index].planet_coord_id) {
                    console.log("Deleting object!");
                    await game_object.deleteObject(dirty, { 'object_index': object_index });
                }
                return false;
            }

            // If it's a Life Herb Seedling that's growing, we need to see if it's not on a Biogrove planet
            // If it's not planted on a biogrove planet, it's done by a player
            if(dirty.objects[object_index].object_type_id === 210 && dirty.objects[object_index].player_id) {

                let player_index = await player.getIndex(dirty, { 'player_id': dirty.objects[object_index].player_id });
                if(player_index !== -1) {
                    player_socket = await world.getPlayerSocket(dirty, player_index);
                }

                if(!dirty.objects[object_index].planet_coord_id) {
                    needs_complexity_check = true;
                } else {
                    // On a planet - make sure it's a biogrove planet type

                    if(coord_index !== -1) {
                        let planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.planet_coords[coord_index].planet_id, 'source': 'game.tickGrowths' });
                        if(planet_index !== -1 && dirty.planets[planet_index].planet_type_id !== 29) {
                            needs_complexity_check = true;
                        }
                    }
                }

            }

            if(needs_complexity_check) {
                let farming_level = await player.getLevel(dirty, { 'player_index': player_index, 'skill_type': 'farming' });

                success = world.complexityCheck(farming_level, dirty.object_types[object_type_index].complexity);
            }


            let spawned_event_id = 0;
            if(dirty.objects[object_index].spawned_event_id) {
                spawned_event_id = dirty.objects[object_index].spawned_event_id;
            }

            console.log("Deleting old object");

            await game_object.deleteObject(dirty, { 'object_index': object_index });

            if(success) {
                // object grows into the next stage
                // delete the old object

                console.log("Success. Going to create it");

                // create a new object
                let insert_object_type_data = { 'object_type_id': dirty.object_types[grows_into_object_type_index].id };

                // If this object was from a spawned event, we
                if(spawned_event_id !== 0) {
                    console.log("Giving a spawned event id of: " + spawned_event_id + " to the new object in its place!");
                    insert_object_type_data.spawned_event_id = spawned_event_id;
                }

                let new_object_id = await world.insertObjectType(socket, dirty, insert_object_type_data);
                let new_object_index = await game_object.getIndex(dirty, new_object_id);

                if(new_object_index === -1) {
                    log(chalk.red("Failed to insert object in game.tickGrowths. Was trying to create object type id: " + dirty.object_types[grows_into_object_type_index].id ));
                    return false;
                }

                await game_object.place(false, dirty, { 'object_index': new_object_index,
                    'planet_coord_index': coord_index });

                console.log("Placed new object id: " + dirty.objects[new_object_index].id + " with spawned event_id: " + dirty.objects[new_object_index].spawned_event_id);

                /*
                await world.addObjectToPlanetCoord(dirty, new_object_index, coord_index);


                // update the info on the planet or ship coord
                if(object.planet_coord_id) {
                    main.updateCoordGeneric(socket, {'planet_coord_index': coord_index, 'object_id': new_object_id,
                        'object_type_id': dirty.objects[new_object_index].object_type_id });
                } else if(object.ship_coord_id) {
                    main.updateCoordGeneric(socket, {'ship_coord_index': coord_index, 'object_id': new_object_id,
                        'object_type_id': dirty.objects[new_object_index].object_type_id });
                }

                 */
                /*

            } else {
                // spawn a monster where it was
                if(dirty.objects[object_index].planet_coord_id) {
                    let spawn_monster_data = { 'planet_coord_index': coord_index, 'monster_type_id': 53 };

                    if(spawned_event_id !== 0) {
                        spawn_monster_data.spawned_event_id = spawned_event_id;
                    }

                    await world.spawnMonster(dirty, spawn_monster_data);
                } else if(dirty.objects[object_index].ship_coord_id) {

                    let spawn_monster_data = { 'ship_coord_index': coord_index, 'monster_type_id': 53 };

                    if(spawned_event_id !== 0) {
                        spawn_monster_data.spawned_event_id = spawned_event_id;
                    }

                    await world.spawnMonster(dirty, spawn_monster_data);
                }

            }
        } catch(error) {
            log(chalk.red("Error in game.growObject: " + error));
        }
    }
    */




    // TODO Right now this is coded just for a player for now. Need to add in monsters and objects
    //      COORD_TYPE CAN BE: ..... it's not even used
    async function canInteract(socket, dirty, coord_type, the_coord) {

        try {

            if(typeof socket.player_index === 'undefined') {
                log(chalk.yellow("No player index on socket in canInteract: " + socket.player_index));
                return false;
            }


            if(dirty.players[socket.player_index].planet_coord_id) {

                let player_planet_coord_index = await player.getCoordIndex(dirty, socket.player_index, 'planet');


                // The planet id, and planet level must match
                if(dirty.planet_coords[player_planet_coord_index].planet_id !== the_coord.planet_id ||
                    dirty.planet_coords[player_planet_coord_index].level !== the_coord.level) {

                    if(dirty.planet_coords[player_planet_coord_index].planet_id !== the_coord.planet_id) {
                        log(chalk.yellow("Coord is not on the same planet. " + dirty.planet_coords[player_planet_coord_index].planet_id +
                            " vs: " + the_coord.planet_id));
                    }

                    if(dirty.planet_coords[player_planet_coord_index].planet_level !== the_coord.level) {
                        log(chalk.yellow("Coord is not on the same level. " + dirty.planet_coords[player_planet_coord_index].level +
                            " vs: " + the_coord.level));
                    }

                    return false;
                }

                let distance_x = Math.abs(dirty.planet_coords[player_planet_coord_index].tile_x - the_coord.tile_x);
                let distance_y = Math.abs(dirty.planet_coords[player_planet_coord_index].tile_y - the_coord.tile_y);

                if(distance_x <= 2 && distance_y <= 2) {
                    return true;
                } else {
                    //console.log("Too far away");
                    return false;
                }


            } else if(dirty.players[socket.player_index].ship_coord_id) {

                let player_ship_coord_index = await player.getCoordIndex(dirty, socket.player_index, 'ship');
            

                if(dirty.ship_coords[player_ship_coord_index].ship_id !== the_coord.ship_id) {
                    return false;
                }

                if(dirty.ship_coords[player_ship_coord_index].level !== the_coord.level) {
                    return false;
                }

                let distance_x = Math.abs(dirty.ship_coords[player_ship_coord_index].tile_x - the_coord.tile_x);
                let distance_y = Math.abs(dirty.ship_coords[player_ship_coord_index].tile_y - the_coord.tile_y);

                if(distance_x <= 2 && distance_y <= 2) {
                    return true;
                } else {
                    //console.log("Too far away");
                    return false;
                }

            } else if(dirty.players[socket.player_index].coord_id) {

                let player_coord_index = await player.getCoordIndex(dirty, socket.player_index, 'galaxy');

                let distance_x = Math.abs(dirty.coords[player_coord_index].tile_x - the_coord.tile_x);
                let distance_y = Math.abs(dirty.coords[player_coord_index].tile_y - the_coord.tile_y);

                if(distance_x <= 2 && distance_y <= 2) {
                    return true;
                } else {
                    //console.log("Too far away");
                    return false;
                }

            }


            // default is returning false.
            log(chalk.yellow("Not sure what we are comparing. Returning false. game.canInteract"));
            console.trace("here");
            return false;

        } catch(error) {
            log(chalk.red("Error in game.canInteract: " + error));
            console.error(error);
        }


    }


    async function hasLineOfSight(dirty, scope, starting_coord_index, destination_coord_index) {
        try {


            let blocked_line_of_sight = false;
            let tiles_inspected = 0;
            let done = false;
            let destination_coord = {};

            while(blocked_line_of_sight === false && tiles_inspected < 12 && done === false) {

                let tile_x_difference = 0;
                let tile_y_difference = 0;
                let starting_coord = {};
                

                if(scope === 'planet') {

                    starting_coord = dirty.planet_coords[starting_coord_index];
                    if(helper.isFalse(destination_coord)) {
                        destination_coord = dirty.planet_coords[destination_coord_index];
                    }

                    tile_x_difference = dirty.planet_coords[starting_coord_index].tile_x - dirty.planet_coords[destination_coord_index].tile_x;
                    tile_y_difference = dirty.planet_coords[starting_coord_index].tile_y - dirty.planet_coords[destination_coord_index].tile_y;

                } else if(scope === 'ship') {

                    starting_coord = dirty.ship_coords[starting_coord_index];
                    if(helper.isFalse(destination_coord)) {
                        destination_coord = dirty.ship_coords[destination_coord_index];
                    }

                    tile_x_difference = dirty.ship_coords[starting_coord_index].tile_x - dirty.ship_coords[destination_coord_index].tile_x;
                    tile_y_difference = dirty.ship_coords[starting_coord_index].tile_y - dirty.ship_coords[destination_coord_index].tile_y;
                } else if(scope === 'galaxy') {

                    starting_coord = dirty.coords[starting_coord_index];
                    if(helper.isFalse(destination_coord)) {
                        destination_coord = dirty.coords[destination_coord_index];
                    }
                    tile_x_difference = dirty.coords[starting_coord_index].tile_x - dirty.coords[destination_coord_index].tile_x;
                    tile_y_difference = dirty.coords[starting_coord_index].tile_y - dirty.coords[destination_coord_index].tile_y;

                }


                let checking_coord = {};

                // left or right
                if(Math.abs(tile_x_difference) >= Math.abs(tile_y_difference)) {

                    // left
                    if(tile_x_difference > 1) {
                        await map.getCoordNeighbor(dirty, scope, starting_coord_index, 'left');

                        if(starting_coord.left_coord_index === -1) {
                            blocked_line_of_sight = true;
                            done = true;
                        } else {

                            if(scope === 'planet') {
                                checking_coord = dirty.planet_coords[starting_coord.left_coord_index];
                            } else if(scope === 'ship') {
                                checking_coord = dirty.ship_coords[starting_coord.left_coord_index];
                            } else if(scope === 'galaxy') {
                                checking_coord = dirty.coords[starting_coord.left_coord_index];
                            }

                            starting_coord_index = starting_coord.left_coord_index;
                        }
                        
                    } 
                    // right
                    else if(tile_x_difference < -1) {
                        await map.getCoordNeighbor(dirty, scope, starting_coord_index, 'right');

                        if(starting_coord.right_coord_index === -1) {
                            blocked_line_of_sight = true;
                            done = true;
                        } else {

                            if(scope === 'planet') {
                                checking_coord = dirty.planet_coords[starting_coord.right_coord_index];
                            } else if(scope === 'ship') {
                                checking_coord = dirty.ship_coords[starting_coord.right_coord_index];
                            } else if(scope === 'galaxy') {
                                checking_coord = dirty.coords[starting_coord.right_coord_index];
                            }

                            starting_coord_index = starting_coord.right_coord_index;
                        }
                    }
                } 
                // up or down
                else {

                    // up
                    if(tile_y_difference > 1) {
                        await map.getCoordNeighbor(dirty, scope, starting_coord_index, 'up');

                        if(starting_coord.up_coord_index === -1) {
                            blocked_line_of_sight = true;
                            done = true;
                        } else {

                            if(scope === 'planet') {
                                checking_coord = dirty.planet_coords[starting_coord.up_coord_index];
                            } else if(scope === 'ship') {
                                checking_coord = dirty.ship_coords[starting_coord.up_coord_index];
                            } else if(scope === 'galaxy') {
                                checking_coord = dirty.coords[starting_coord.up_coord_index];
                            }

                            starting_coord_index = starting_coord.up_coord_index;
                        }
                    } 
                    // down
                    else if(tile_y_difference < 1) {
                        await map.getCoordNeighbor(dirty, scope, starting_coord_index, 'down');

                        if(starting_coord.down_coord_index === -1) {
                            blocked_line_of_sight = true;
                            done = true;
                        } else {

                            if(scope === 'planet') {
                                checking_coord = dirty.planet_coords[starting_coord.down_coord_index];
                            } else if(scope === 'ship') {
                                checking_coord = dirty.ship_coords[starting_coord.down_coord_index];
                            } else if(scope === 'galaxy') {
                                checking_coord = dirty.coords[starting_coord.down_coord_index];
                            }

                            starting_coord_index = starting_coord.down_coord_index;
                        }
                    }


                }


                // The one condition we have for blocking (for now anyways) is an object we can't walk on
                if(checking_coord.object_type_id) {
                    let object_type_index = main.getObjectTypeIndex(checking_coord.object_type_id);

                    if(!dirty.object_types[object_type_index].can_walk_on) {
                        blocked_line_of_sight = true;
                    }
                }

                tiles_inspected++;
            }


            if(blocked_line_of_sight) {
                return false;
            }

            return true;


        } catch(error){
            log(chalk.red("Error in game.hasLineOfSight: " + error));
            console.error(error);
        }
    }


    exports.hasLineOfSight = hasLineOfSight;


    async function mine(socket, dirty, data) {
        try {

            //log(chalk.green("Got mine request"));

            let object_index = await game_object.getIndex(dirty, parseInt(data.object_id));

            if(object_index === -1) {
                console.log("Could not find object");
                return false;
            }


            let object_type_index = dirty.object_types.findIndex(function(obj) { return obj &&
                obj.id === dirty.objects[object_index].object_type_id; });

            if(object_type_index === -1) {
                return false;
            }

            if(!dirty.object_types[object_type_index].can_be_mined) {
                log(chalk.yellow("Player is trying to mine something that is not mineable"));
                socket.emit('chat', { 'message': "That cannot be mined", 'scope': 'system' });
                return false;
            }

            // woot
            //console.log("Found all the basics");

            // Make sure the player isn't already mining this
            let mining_index = dirty.mining_linkers.findIndex(function(obj) { return obj &&
                obj.player_id === socket.player_id && obj.object_id === dirty.objects[object_index].id; });

            if(mining_index !== -1) {
                log(chalk.yellow("Player is already mining that"));
                return false;
            }

            let mining_linker = {
                'id': uuidv1(),
                'player_id': socket.player_id, 'object_id': dirty.objects[object_index].id,
                'player_socket_id': socket.id
            };

            dirty.mining_linkers.push(mining_linker);

            //console.log("Pushed mining linker");

            socket.emit('mining_linker_info', { 'mining_linker': mining_linker });



        } catch(error) {
            log(chalk.red("Error in game.mine: " + error));
        }
    }

    exports.mine = mine;


    //  data:   mining_linker_id   |   object_id
    async function mineStop(socket, dirty, data) {
        try {


            let mining_linker_index = -1;

            if(data.mining_linker_id) {
                mining_linker_index = dirty.mining_linkers.findIndex(function(obj) { return obj && obj.id === data.mining_linker_id; })
            } else if(data.object_id) {
                mining_linker_index = dirty.mining_linkers.findIndex(function(obj) { return obj && obj.player_id === dirty.players[socket.player_index].id &&
                    obj.object_id === parseInt(data.object_id); })
            }



            if(mining_linker_index !== -1) {
                // TODO we want to support showing mining from other players too
                socket.emit('mining_linker_info', { 'remove': true, 'mining_linker': dirty.mining_linkers[mining_linker_index] });


                delete dirty.mining_linkers[mining_linker_index];
            }
            // We didn't even find a mining linker!
            else if(data.mining_linker_id) {
                socket.emit('mining_linker_info', { 'remove': true, 'mining_linker': { 'id': data.mining_linker_id }});
            } else {
                log(chalk.yellow("Not sure how to remove a mining linker that doesn't exist via an object_id yet"));
            }


        } catch(error) {
            log(chalk.red("Error in game.mineStop: " + error));
            console.error(error);
        }
    }

    exports.mineStop = mineStop;



    //  data:   planet_coord_index
    async function deletePlanetCoord(dirty, data) {


        try {

            if(dirty.planet_coords[data.planet_coord_index].level <= 0) {
                log(chalk.red("Cannot delete a planet coord at level <= 0"));
                return false;
            }

            // Monsters on it die
            if(dirty.planet_coords[data.planet_coord_index].monster_id) {
                let monster_index = await monster.getIndex(dirty, dirty.planet_coords[data.planet_coord_index].monster_id);
                if(monster_index !== -1) {
                    await monster.deleteMonster(dirty, monster_index);
                }

            }

            // Objects are deleted
            if(dirty.planet_coords[data.planet_coord_index].object_id) {

                let object_index = await game_object.getIndex(dirty, dirty.planet_coords[data.planet_coord_index].object_id);
                if(object_index !== -1) {
                    await game_object.deleteObject(dirty, { 'object_index': object_index });
                }

            }

            // Players are moved to Spaceport
            await movement.warpTo(socket, dirty, { 'player_id': dirty.planet_coords[data.planet_coord_index].player_id,
                'planet_id': dirty.planet_coords[data.planet_coord_index].planet_id, 'warping_to': 'spaceport '});

            // Npcs are moved to Spaceport
            await movement.warpTo(socket, dirty, { 'npc_id': dirty.planet_coords[data.planet_coord_index].npc_id,
                'planet_id': dirty.planet_coords[data.planet_coord_index].planet_id, 'warping_to': 'spaceport '});


            // delete the object
            await (pool.query("DELETE FROM planet_coords WHERE id = ?", [dirty.planet_coords[data.planet_coord_index].id]));



            delete dirty.planet_coords[data.planet_coord_index];

        } catch(error) {
            log(chalk.red("Error in deletePlanetCoord: " + error));
            console.error(error);
        }
    }

    exports.deletePlanetCoord = deletePlanetCoord;



    async function deleteShip(socket, dirty, ship_id, reason) {

        try {
            console.log("In game.deleteShip for ship id: " + ship_id);

            let ship_index = await game_object.getIndex(dirty, ship_id);

            if(ship_index === -1) {
                return false;
            }

            // The player that owns the ship. This doesn't mean the player is using it as his ship (space stations)
            let player_index = await player.getIndex(dirty, { 'player_id': dirty.objects[ship_index].player_id });



            // TODO we need to make sure that we delete anything that was on the ship coords
            // TODO this includes checking every ship coord for various players. Think if a spacestation gets destroyed
            // TODO we also want to remove the player's inventory? Or maybe it's OK if they escape to their pod
            // delete the ship coords
            await (pool.query("DELETE FROM ship_coords WHERE ship_id = ?", [dirty.objects[ship_index].id]));

            dirty.ship_coords.forEach(await async function(ship_coord, i) {

                try {
                    if(ship_coord.ship_id === dirty.objects[ship_index].id) {

                        // If there's an object - delete it
                        if(ship_coord.object_id) {
                            let object_index = await game_object.getIndex(dirty, ship_coord.object_id);
                            if(object_index !== -1) {
                                await game_object.deleteObject(dirty, { 'object_index': object_index });
                            }

                        }

                        // Any players that don't have this set as their ship (this can include the ship owner - if a space station is removed)
                        if(ship_coord.player_id) {

                            let other_player_index = -1;
                            // Special case for the ship owner being there
                            if(ship_coord.player_id === dirty.players[player_index].id) {
                                other_player_index = player_index;
                            } else {
                                other_player_index = await player.getIndex(dirty, {'player_id': ship_coord.player_id });
                            }

                            // This player doesn't have this ship set as their ship, punt them back to the galaxy
                            if(other_player_index !== -1 && dirty.players[other_player_index].ship_id !== ship_coord.ship_id) {
                                let other_player_socket = await world.getPlayerSocket(dirty, other_player_index);
                                if(other_player_socket) {
                                    await movement.switchToGalaxy(other_player_socket, dirty, other_player_index, false);
                                }

                            }

                        }

                        if(ship_coord.monster_id) {
                            let monster_index = await monster.getIndex(dirty, ship_coord.monster_id);
                            if(monster_index === -1) {
                                await monster.deleteMonster(dirty, monster_index);
                            }
                        }

                        delete dirty.ship_coords[i];
                    }
                } catch(error) {
                    log(chalk.red("Error in game.deleteShip - ship_coord: " + error));
                }


            });

            // If a player had this as their ship, we need to generate them a default one
            // A player could have different ships - so we only want to do this on a match with the player's ship_id
            if(reason !== 'switchship' && dirty.players[player_index].ship_id === ship_id) {
                // give the player a new ship
                let new_ship_index = await world.insertObjectType(false, dirty, { 'object_type_id': 114, 'player_id': dirty.players[player_index].id });

                if(new_ship_index !== -1) {
                    dirty.players[player_index].ship_id = dirty.objects[new_ship_index].id;
                    dirty.players[player_index].has_change = true;
    
                    // I believe this is being taken care of in world.insertObjectType
                    //await world.generateShip(dirty, new_ship_index);
                    //await main.getShipCoords(new_ship_id);
                    await player.sendInfo(false, "galaxy", dirty, dirty.players[player_index].id);
                } else {
                    log(chalk.red("ERROR IN DELETE SHIP"));
                }
               

            }

        } catch(error) {
            log(chalk.red("Error in game.deleteShip: " + error));
            console.error(error);
        }

    }

    exports.deleteShip = deleteShip;

    async function metStructureRequirements(dirty, npc_index) {
        // get the requirements
        let requirements = dirty.structure_type_requirement_linkers.filter(
            linker => linker.structure_type_id === dirty.npcs[npc_index].dream_structure_type_id);

        let met_requirements = true;

        requirements.forEach(function (requirement, i) {

            console.log("Structure requires: " + requirement.amount + " of object type id: " + requirement.object_type_id);

            let npc_inventory_item_index = dirty.inventory_items.findIndex(function(obj) { return obj && obj.npc_id === dirty.npcs[npc_index].id
                && obj.object_type_id === requirement.object_type_id; });
            if(npc_inventory_item_index !== -1 && dirty.inventory_items[npc_inventory_item_index].amount >= requirement.amount) {

            } else {
                met_requirements = false;
                console.log("did not meet this requirement");
            }

        });

        return met_requirements;
    }


    async function objectSpawn(dirty, object_index, debug_object_type_id) {

        try {

            // The object needs a planet coord id, ship coord id, or a coord_id
            if(helper.isFalse(dirty.objects[object_index].planet_coord_id) && helper.isFalse(dirty.objects[object_index].ship_coord_id) && 
            helper.isFalse(dirty.objects[object_index].coord_id)) {
                log(chalk.yellow("Spawning object isn't on a coord. Maybe in inventory? Object id: " + dirty.objects[object_index].id));
                return false;
            }

            let object_type_index = main.getObjectTypeIndex(dirty.objects[object_index].object_type_id);

            // Grab a random spawn linker
            let rarity = helper.rarityRoll();
            let hp_percent = dirty.objects[object_index].current_hp / dirty.object_types[object_type_index].hp * 100;

            // Some object types aren't going to have proper HP values
            if(isNaN(hp_percent)) {
                hp_percent = 100;
            }

            if(dirty.objects[object_index].object_type_id === debug_object_type_id) {
                console.log("Rarity roll: " + rarity + " HP percent: " + hp_percent);
            }

            let object_type_spawn_linkers = dirty.spawn_linkers.filter(linker => linker.object_type_id === dirty.objects[object_index].object_type_id &&
                linker.rarity <= rarity && hp_percent >= linker.minimum_hp_percent && hp_percent <= linker.maximum_hp_percent);

            if(dirty.objects[object_index].object_type_id === debug_object_type_id) {
                console.log("object_type_spawn_linkers length: " + object_type_spawn_linkers.length);
            }


            if(object_type_spawn_linkers.length > 0) {

                let chosen_linker = object_type_spawn_linkers[Math.floor(Math.random()*object_type_spawn_linkers.length)];

                if(dirty.objects[object_index].object_type_id === debug_object_type_id) {
                    console.log("Chose spawn linker id: " + chosen_linker.id);
                }

                let met_requirements = true;

                // If the chosen linker requires a floor type, do that check now
                if(chosen_linker.requires_floor_type_class && chosen_linker.requires_floor_type_class !== 0) {
                    met_requirements = false;
                    let object_info = await game_object.getCoordAndRoom(dirty, object_index);
                    if(object_info.coord) {
                        let coord_floor_type_index = main.getFloorTypeIndex(object_info.coord.floor_type_id);

                        if(coord_floor_type_index !== -1 && dirty.floor_types[coord_floor_type_index].class === chosen_linker.requires_floor_type_class) {
                            met_requirements = true;
                        }
                    }

                }

                if(met_requirements) {
                    if(chosen_linker.ticks_required > 1) {
                        dirty.objects[object_index].current_spawn_linker_id = chosen_linker.id;
                        dirty.objects[object_index].spawner_tick_count = 1;
                        dirty.objects[object_index].has_change = true;
                    }
                    // We finish it
                    else {
                        // Gotta get the real spawn linker back
                        let spawn_linker_index = dirty.spawn_linkers.findIndex(function(obj) { return obj && obj.id === chosen_linker.id; });
                        await finishSpawnLinker(dirty, { 'object_index': object_index, 'spawn_linker_index': spawn_linker_index });

                    }
                }




            } else {
                if(dirty.objects[object_index].object_type_id === debug_object_type_id) {
                    console.log("Did not find any spawn linkers that matched this object");
                }
            }
        } catch(error) {
            log(chalk.red("Error in game.objectSpawn: " + error));
            console.error(error);
        }

    }

    exports.objectSpawn = objectSpawn;

    async function processAddictionLinker(dirty, i) {
        try {

            let addicted_object_type_index = main.getObjectTypeIndex(dirty.addiction_linkers[i].addicted_to_object_type_id);
            let body_index = await game_object.getIndex(dirty, dirty.addiction_linkers[i].addicted_body_id);

            


            // There's a possibility that the body doesn't exist anymore - that it was killed or something
            if(body_index === -1) {
                log(chalk.yellow("Doesn't look like that body exists anymore - removing the linker"));

                await (pool.query("DELETE FROM addiction_linkers WHERE id = ?", [dirty.addiction_linkers[i].id] ));
                delete dirty.addiction_linkers[i];
                return false;
            }

            console.log("Addicted body id: " + dirty.objects[body_index].id + " player id: " + dirty.objects[body_index].player_id);

            let body_type_index = main.getObjectTypeIndex(dirty.objects[body_index].object_type_id);
            let player_index = await player.getIndex(dirty, { 'player_id': dirty.objects[body_index].player_id });

            if(player_index === -1) {
                log(chalk.yellow("Can't find the player this body is supposed to be associated with. body's player id: " + dirty.objects[body_index].player_id));
                console.log("Removing addiction linker");


                await (pool.query("DELETE FROM addiction_linkers WHERE id = ?", [dirty.addiction_linkers[i].id] ));
                delete dirty.addiction_linkers[i];
                return false;
            }


            // If it's the player's body, lets only tick it while they are logged in
            if(dirty.objects[body_index].id === dirty.players[player_index].body_id) {
                let player_socket = world.getPlayerSocket(dirty, player_index);
                if(helper.isFalse(player_socket)) {
                    console.log("This is the player's active body, but they aren't connected. Holding off");
                    return false;
                }
            }

            let race_eating_index = dirty.race_eating_linkers.findIndex(function(obj) { return obj &&
                obj.race_id === dirty.object_types[body_type_index].race_id && obj.object_type_id === dirty.object_types[addicted_object_type_index].id; });
            let player_socket = await world.getPlayerSocket(dirty, player_index);

            if(race_eating_index === -1) {
                log(chalk.yellow("That body cannot eat that!"));
                if(helper.notFalse(player_socket)) {
                    player_socket.emit('addiction_linker_info', { 'remove': true, 'addiction_linker': dirty.addiction_linkers[i] });
                }
                await (pool.query("DELETE FROM addiction_linkers WHERE id = ?", [dirty.addiction_linkers[i].id] ));
                delete dirty.addiction_linkers[i];
                return;
            }

            // increment the tick count
            if(dirty.addiction_linkers[i].tick_count < dirty.race_eating_linkers[race_eating_index].addiction_tick_count) {


                // Gotta check and see if there's a -hp effect to apply
                let body_eating_linkers = dirty.eating_linkers.filter(linker => linker.body_id === dirty.players[player_index].body_id);

                let still_eating = false;
                for(let eating_linker of body_eating_linkers) {
                    if(eating_linker.eating_object_type_id === dirty.addiction_linkers[i].addicted_to_object_type_id) {
                        still_eating = true;
                    }
                }

                // apply any negative HP effect to the player and increase the tick count
                if(!still_eating) {

                    dirty.addiction_linkers[i].tick_count++;

                    if(helper.notFalse(player_socket)) {
                        player_socket.emit('addiction_linker_info', { 'addiction_linker': dirty.addiction_linkers[i] });
                    }



                    if(dirty.race_eating_linkers[race_eating_index].hp) {


                        let addiction_damage_amount = dirty.addiction_linkers[i].addiction_level * Math.abs(dirty.race_eating_linkers[race_eating_index].hp);

                        // Player has this body equippped
                        if(dirty.players[player_index].body_id === dirty.addiction_linkers[i].addicted_body_id) {
                            //console.log("Reduced player hp due to addiction linker");

                            // Something like poison will have -HP - we don't want poison to heal in this case.
                            

                            let new_player_hp = dirty.players[player_index].current_hp - addiction_damage_amount;

                            if(new_player_hp <= 0) {

                                console.log("Calling player.kill from tickAddictions");
                                let player_kill_result = await player.kill(dirty, player_index);

                                console.log("player kill result: " + player_kill_result);


                            } else {
                                // update the current hp for the player and the player's socket
                                dirty.players[player_index].current_hp = new_player_hp;
                                dirty.players[player_index].has_change = true;

                                if(helper.notFalse(player_socket)) {
                                    player_socket.emit('damaged_data', {
                                        'player_id': dirty.players[player_index].id, 'damage_amount': addiction_damage_amount, 'was_damaged_type': 'hp',
                                        'damage_types': ['addiction']
                                    });
                                }
                            }
                        } else {
                            console.log("Damaging body that player does not have equipped. Addition body id: " + dirty.addiction_linkers[i].addicted_body_id + 
                            "player_id: " + dirty.players[player_index].id + " player body_id: " + dirty.players[player_index].body_id);

                            let body_info = await game_object.getCoordAndRoom(dirty, body_index);
                            game_object.damage(dirty, body_index, addiction_damage_amount, { 'object_info': body_info });

                        }
                        
                    }

                } else {
                    // This addiction linker is on pause for now
                }

            }
            // We can remove the addiction linker
            else {

                if(helper.notFalse(player_socket)) {
                    player_socket.emit('addiction_linker_info', { 'remove': true, 'addiction_linker': dirty.addiction_linkers[i] });
                }
                await (pool.query("DELETE FROM addiction_linkers WHERE id = ?", [dirty.addiction_linkers[i].id] ));
                delete dirty.addiction_linkers[i];

            }

        } catch(error) {
            log(chalk.red("Error in game.processAddictionLinker: " + error));
            console.error(error);
        }
    }


    /*
       POSSIBLE ADMIN COMMANDS
       /spawn OBJECT_TYPE_ID
       /replaceCoordFloor COORD_ID NEW_FLOOR_TYPE_ID

   */

    async function processAdminChatMessage(socket, dirty, data) {
        try {

            if(data.message.includes("/addinventory")) {

                console.log("Was add inventory message");
                let split = data.message.split(" ");
                let amount = split[1];
                let object_type_name = "";
                for(let i = 2; i < split.length; i++) {
                    object_type_name +=  " " + split[i];
                }

                // and trim it
                object_type_name = object_type_name.trim();

                console.log("Adding " + amount + " of " + object_type_name + " to admin inventory");

                let object_type_index = dirty.object_types.findIndex(function(obj) {
                    return obj && obj.name.toUpperCase() === object_type_name.toUpperCase() });

                if(object_type_index === -1) {
                    console.log("Could not find that object type - /addinventory");
                    return false;
                }

                // If it's assembled as an object, we need to create an object for each one
                if(dirty.object_types[object_type_index].assembled_as_object) {


                    for(let x = 1; x <= amount; x++) {
                        let insert_object_type_data = { 'object_type_id': dirty.object_types[object_type_index].id,
                            'source': 'game.processAdminChatMessage - /addinventory' };
                        let new_object_index = await world.insertObjectType(socket, dirty, insert_object_type_data);

                        await inventory.addToInventory(socket, dirty, { 'adding_to_type': 'player', 'adding_to_id': socket.player_id,
                            'object_id': dirty.objects[new_object_index].id, 'amount': 1 });
                    }


                } else {
                    await inventory.addToInventory(socket, dirty, { 'adding_to_type': 'player', 'adding_to_id': socket.player_id,
                        'object_type_id': dirty.object_types[object_type_index].id, 'amount': amount });
                }



                console.log("Added");

            } else if(data.message.includes("/buildstructure ")) {
                console.log("Was build structure message");
                let split = data.message.split(" ");
                let structure_type_id = split[1];
                let planet_coord_id = parseInt(split[2]);

                let player_index = -1;
                if(split[3]) {
                    console.log("Build structure included a player id to give this structure to!");
                    player_index = await player.getIndex(dirty, { 'player_id': parseInt(split[3]) });
                }



                let planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': planet_coord_id });

                await buildStructure(dirty, { 'structure_type_id': structure_type_id, 'is_forced': true,
                    'starting_tile_x': dirty.planet_coords[planet_coord_index].tile_x, 'starting_tile_y': dirty.planet_coords[planet_coord_index].tile_y,
                    'starting_level': dirty.planet_coords[planet_coord_index].level, 'planet_id': dirty.planet_coords[planet_coord_index].planet_id,
                    'player_index': player_index });



            } else if(data.message.includes("/clearcoord ")) {
                // /clearcoord COORD_TYPE COORD_ID CLEARING_TYPE (object|player)
                console.log("Admin is clearing a coord of something");
                let split = data.message.split(" ");
                let coord_type = split[1];
                let coord_id = split[2];
                let clearing_type = split[3];

                if(coord_type === 'galaxy') {
                    let coord_index = await main.getCoordIndex({ 'coord_id': coord_id });
                    if(coord_index !== -1) {

                        if(clearing_type === "object") {
                            main.updateCoordGeneric(socket, { 'coord_index': coord_index, 'object_id': false, 'belongs_to_object_id': false });
                        }
                    }
                }

            } else if(data.message.includes("/connectlevel ")) {
                console.log("Was connect level message");
                let split = data.message.split(" ");
                let planet_id = split[1];
                let level = parseInt(split[2]);
                console.log("Admin is connecting level " + level + " of planet id: " + planet_id);

                let planet_index = await planet.getIndex(dirty, { 'planet_id': planet_id});

                if(planet_index === -1) {
                    log(chalk.yellow("Could not find that planet"));
                    return false;
                }

                let planet_type_index = main.getPlanetTypeIndex(dirty.planets[planet_index].planet_type_id);

                await world.connectLevel(socket, dirty, { 'planet_index': planet_index, 'planet_type_index': planet_type_index, 'connecting_level': level });

            }

            else if(data.message.includes("/deletenpc ")) {

                console.log("Was delete npc message");
                let split = data.message.split(" ");
                let npc_id = split[1];
                console.log("Admin is deleting npc id: " + npc_id);

                let npc_index = await npc.getIndex(dirty, npc_id);

                if(npc_index === -1) {
                    log(chalk.yellow("Could not find that npc"));
                    return false;
                }


                await npc.deleteNpc(dirty, dirty.npcs[npc_index].id);





            }
            else if(data.message.includes("/deleteobject ")) {
                console.log("Was deleteobject message");
                let split = data.message.split(" ");

                let object_id = split[1];

                let object_index = await game_object.getIndex(dirty, object_id);
                if(object_index !== -1) {
                    await game_object.deleteObject(dirty, { 'object_index': object_index });
                }




            }
            else if(data.message.includes("/deletestructure ")) {
                console.log("Was deletestructure message");

                let split = data.message.split(" ");

                let structure_id = split[1];

                deleteStructure(socket, dirty, { 'structure_id': structure_id});
            }
            else if(data.message.includes("/deletespawnedevent ")) {

                console.log("Was deletespawnedevent message");

                let split = data.message.split(" ");

                let spawned_event_id = parseInt(split[1]);
                let spawned_event_index = dirty.spawned_events.findIndex(function(obj) { return obj && obj.id === spawned_event_id; });

                
                if(spawned_event_index  === -1) {
                    console.log("Could not find spawned event");
                } else {
                    event.deleteSpawnedEvent(dirty, spawned_event_index);
                    
                }

                

            } else if(data.message.includes("/destroyplanet ")) {
                console.log("Was destroy planet message");
                let split = data.message.split(" ");
                let planet_id = split[1];
                console.log("Admin is destroying planet id: " + planet_id);

                let planet_index = await planet.getIndex(dirty, {'planet_id': planet_id});

                if(planet_index === -1) {
                    log(chalk.yellow("Could not find that planet"));
                    return false;
                }


                destroyPlanet(socket, dirty, { 'planet_index': planet_index });
            }  else if(data.message.includes("/dockcommand ")) {
                console.log("Got dockcommand");
                let split = data.message.split(" ");
                let object_id = parseInt(split[1]);
                console.log("Admin is warping ship id: " + object_id + " to azure planet");


                await movement.warpShipToAzurePlanet(socket, dirty, object_id);
            } else if(data.message.includes("/fix ")) {



                return false;

                let infected_index = await player.getIndex(dirty, { 'player_id': 64 });

                console.log("admin is fixing ships");

                for(let i = 0; i < dirty.objects.length; i++) {

                    if(dirty.objects[i] && dirty.objects[i].player_id === 64 && dirty.objects[i].object_type_id === 313 && dirty.objects[i].id !== 87268) {
                        console.log("Going to delete ship id: " + dirty.objects[i].id + " player id: " + dirty.objects[i].player_id);
                        await game_object.deleteObject(dirty, { 'object_index': i });
                        //deleteShip(false, dirty, dirty.objects[i].id, 'bug');
                        
                    }

                    if(dirty.objects[i] && dirty.objects[i].player_id === 64 && dirty.objects[i].object_type_id === 296 && dirty.objects[i].id !== 105859) {
                        console.log("Going to delete ship id: " + dirty.objects[i].id + " player id: " + dirty.objects[i].player_id);
                        await game_object.deleteObject(dirty, { 'object_index': i });
                        //deleteShip(false, dirty, dirty.objects[i].id, 'bug');
                        
                    }

                }

            }
            
            
            else if(data.message.includes("/generateplanet ")) {
                console.log("Was generate planet message");
                let split = data.message.split(" ");
                let planet_id = split[1];
                console.log("Admin is generating planet id: " + planet_id);

                let planet_index = await planet.getIndex(dirty, { 'planet_id': planet_id});

                if(planet_index === -1) {
                    log(chalk.yellow("Could not find that planet"));
                    return false;
                }

                let planet_type_index = main.getPlanetTypeIndex(dirty.planets[planet_index].planet_type_id);

                // Not looking like await/non await is making a difference
                await world.generatePlanet(socket, dirty, planet_index, planet_type_index);
            }

            else if(data.message.includes("/gift ")) {
                console.log("Was gift message");
                let split = data.message.split(" ");
                let player_id = parseInt(split[1]);
                let amount = parseInt(split[2]);
                let object_type_id = parseInt(split[3]);

                let gifting_to_player_index = await player.getIndex(dirty, { 'player_id': player_id });

                if(gifting_to_player_index === -1) {
                    log(chalk.yellow("Could not find that player"));
                    return false;
                }

                let gifting_object_type_index = main.getObjectTypeIndex(object_type_id);

                if(dirty.object_types[gifting_object_type_index].assembled_as_object) {
                    log(chalk.yellow("Code this!"));
                    return false;
                }

                console.log("gifting " + amount + " " + dirty.object_types[gifting_object_type_index].name + " to player " + dirty.players[gifting_to_player_index].id);

                await inventory.addToInventory({}, dirty, 
                    { 'adding_to_type': 'player', 'adding_to_id': player_id, 'amount': amount, 'object_type_id': object_type_id });
            }

            else if(data.message.includes("/kickplayer ")) {
                console.log("Admin is kicking player off");

                let split = data.message.split(" ");
                let kicking_player_id = split[1];

                let player_index = await player.getIndex(dirty, { 'player_id': kicking_player_id });
                let kicking_socket = await world.getPlayerSocket(dirty, player_index);

                main.disconnectPlayer(kicking_socket);
            }
            else if(data.message.includes("/move ")) {

                console.log("Was move message");
                let split = data.message.split(" ");
                let movement = split[1];
                console.log("Admin is moving: " + movement);

                let player_index = await player.getIndex(dirty, { 'player_id': socket.player_id });
                let player_info = await player.getCoordAndRoom(dirty, player_index);

                let new_level = dirty.planet_coords[player_info.coord_index].level + 1;

                if(movement === "down") {
                    new_level = dirty.planet_coords[player_info.coord_index].level - 1;
                }

                let found_coord_index = -1;


                for(let x = dirty.planet_coords[player_info.coord_index].tile_x - 2; x <= dirty.planet_coords[player_info.coord_index].tile_x + 2; x++) {
                    for(let y = dirty.planet_coords[player_info.coord_index].tile_y - 2; y <= dirty.planet_coords[player_info.coord_index].tile_y + 2; y++) {

                        if(found_coord_index === -1) {
                            let possible_coord_index = await main.getPlanetCoordIndex({ 'planet_id': dirty.planet_coords[player_info.coord_index].planet_id,
                                'planet_level': new_level, 'tile_x': x, 'tile_y': y });

                            if(possible_coord_index !== -1) {
                                let can_place_result = await player.canPlace(dirty, 'planet', dirty.planet_coords[possible_coord_index], player_index);

                                if(can_place_result) {
                                    // woot!
                                    console.log("Found a planet coord to move to");
                                    found_coord_index = possible_coord_index;
                                }
                            }
                        }



                    }
                }

                if(found_coord_index === -1) {
                    console.log("Did not find a possible planet coord to move to");
                    socket.emit('chat', { 'message': 'Did not find any possible coords to move to', 'scope': 'system' });
                    return false;
                }

                console.log("Found a planet coord to move to. level: " + dirty.planet_coords[found_coord_index].level + " x/y" +
                    dirty.planet_coords[found_coord_index].tile_x + "/" + dirty.planet_coords[found_coord_index].tile_y);

                await main.updateCoordGeneric(socket, { 'planet_coord_index': player_info.coord_index, 'player_id': false });
                await main.updateCoordGeneric(socket, { 'planet_coord_index': found_coord_index, 'player_id': dirty.players[player_index].id });

                dirty.players[player_index].planet_coord_id = dirty.planet_coords[found_coord_index].id;
                dirty.players[player_index].planet_coord_index = found_coord_index;
                dirty.players[player_index].has_change = true;
                await player.sendInfo(socket, "planet_" + dirty.planet_coords[found_coord_index].planet_id, dirty, dirty.players[player_index].id);

                socket.emit('clear_map');
                world.removeBattleLinkers(dirty, { 'player_id': dirty.players[player_index].id});
                await map.updateMap(socket, dirty);



            } else if(data.message.includes("/movenpc ")) {

                let split = data.message.split(" ");
                let npc_id = parseInt(split[1]);
                let destination_coord_id = split[2];

                console.log("Admin moving npc id: " + npc_id + " to planet coord id: " + destination_coord_id);
                movement.adminMoveNpc(socket, dirty, npc_id, destination_coord_id);

            } else if(data.message.includes("/moveobject ")) {
                console.log("Was sent in /moveobject message");
                let split = data.message.split(" ");
                let object_id = parseInt(split[1]);
                let coord_type = split[2];
                let coord_id = parseInt(split[3]);

                let object_index = await game_object.getIndex(dirty, object_id);

                if(object_index === -1) {
                    return false;
                }

                let place_data = {};
                place_data.object_index = object_index;

                if(coord_type === 'galaxy') {
                    let coord_index = await main.getCoordIndex({ 'coord_id': coord_id });
                    if(coord_index === -1) {
                        return false;
                    }

                    place_data.coord_index = coord_index;
                } else if(coord_type === 'planet') {
                    let coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': coord_id });
                    if(coord_index === -1) {
                        return false;
                    }

                    place_data.planet_coord_index = coord_index;
                } else if(coord_type === 'ship') {
                    let coord_index = await main.getShipCoordIndex({ 'ship_coord_id': coord_id });
                    if(coord_index === -1) {
                        return false;
                    }

                    place_data.ship_coord_index = coord_index;
                }


                let placed_result = await game_object.place(socket, dirty, place_data);

                console.log("Placed result: " + placed_result);
            }
            
            else if(data.message.includes("/moveplanet ")) {
                console.log("Was sent in /movePlanet message");

                let split = data.message.split(" ");
                let planet_id = parseInt(split[1]);
                let destination_coord_id = split[2];

                console.log("Moving planet id: " + planet_id + " to coord id " + destination_coord_id);

                await movement.moveEntirePlanet(socket, dirty, planet_id, destination_coord_id);
            } else if(data.message.includes("/moveto ")) {
                console.log("Was sent in /moveto message");
                let split = data.message.split(" ");
                let moving_to_type = split[1];
                let moving_to_id = parseInt(split[2]);

                if(moving_to_type === "planet") {
                    await movement.switchToPlanet(socket, dirty, { 'planet_id': moving_to_id });
                } else if(moving_to_type === "ship") {

                    // We need to get the ship so that we know it's in memory
                    let ship_index = await game_object.getIndex(dirty, moving_to_id);
                    
                    let ship_coord_index = -1

                    for(let i = 0; i < dirty.ship_coords.length && ship_coord_index === -1; i++) {

                        if(dirty.ship_coords[i] && dirty.ship_coords[i].ship_id === moving_to_id) {


                            let can_place_result = await player.canPlace(dirty, 'ship', dirty.ship_coords[i], socket.player_index);

                            if(can_place_result === true) {
                                ship_coord_index = i;
                            }

                        }

                    }

                    if(ship_coord_index === -1) {
                        return false;
                    }


            

                    dirty.players[socket.player_index].previous_coord_id = false;
                    dirty.players[socket.player_index].coord_id = false;
                    dirty.players[socket.player_index].coord_index = -1;
                    dirty.players[socket.player_index].ship_coord_id = dirty.ship_coords[ship_coord_index].id;
                    dirty.players[socket.player_index].ship_coord_index = -1;
                    dirty.players[socket.player_index].has_change = true;
                    socket.map_needs_cleared = true;
                    await player.sendInfo(socket, "ship_" + dirty.ship_coords[ship_coord_index].ship_id, dirty, dirty.players[socket.player_index].id);
                    
                    socket.emit('view_change_data', { 'view': 'ship'});
                    await map.updateMap(socket, dirty);
                }

                console.log("Done with admin moveto");
            }
            else if(data.message.includes("/regenerateplanetlevelfloor")) {
                console.log("Was sent /regenerateplanetlevelfloor message");
                let split = data.message.split(" ");
                let planet_id = parseInt(split[1]);
                let floor_level = parseInt(split[2]);
                await planet.regenerateFloor(dirty, planet_id, floor_level);

            } else if (data.message.includes("/reloadevent")) {
                console.log("Was sent /reloadevent message");
                let split = data.message.split(" ");
                let event_id = split[1];
                await world.reloadEvent(dirty, event_id);
            }
            else if(data.message.includes("/replacefloor")) {
                console.log("Was sent /replacefloor message");

                let split = data.message.split(" ");
                let coord_type = split[1];
                let coord_id = split[2];
                let floor_type_id = split[3];

                console.log("coord type: " + coord_type + " coord_id: " + coord_id + " floor_type_id: " + floor_type_id);

                if(!coord_id || !floor_type_id) {
                    console.log("Didn't get coord id or floor type id");
                    return false;
                }

                let coord_index = -1;

                if(coord_type === 'galaxy') {
                    coord_index = await main.getCoordIndex({ 'coord_id': coord_id });
                } else if(coord_type === 'planet') {
                    coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': coord_id });
                } else if(coord_type === 'ship') {
                    coord_index = await main.getShipCoordIndex({ 'ship_coord_id': coord_id });
                }


                if(coord_index === -1) {
                    console.log("Could not get coord_index");
                    return false;
                }

                let floor_type_index = main.getFloorTypeIndex(floor_type_id);

                if(floor_type_index === -1) {
                    console.log("Couldn't get floor type index");
                    return false;
                }

                if(coord_type === 'galaxy') {
                    await main.updateCoordGeneric(socket, { 'coord_index': coord_index, 'floor_type_id': floor_type_id });

                } else if(coord_type === 'planet') {
                    await main.updateCoordGeneric(socket, { 'planet_coord_index': coord_index, 'floor_type_id': floor_type_id });
                } else if(coord_type === 'ship') {
                    await main.updateCoordGeneric(socket, { 'ship_coord_index': coord_index, 'floor_type_id': floor_type_id });
                }




                console.log("Replaced floor of coord type: " + coord_type + " id: " + coord_id + " with floor type id: " + floor_type_id);
            }
            else if(data.message.includes("/sendmessage ")) {

                let split = data.message.split(" ");
                let message_to_send = "";
                for(let i = 1; i < split.length; i++) {
                    message_to_send +=  " " + split[i];
                }

                io.sockets.emit('admin_message', { 'message': message_to_send });


            } else if(data.message.includes("/setplanettype ")) {
                let split = data.message.split(" ");
                let planet_id = split[1];
                let planet_type_id = split[2];
                console.log("Going to set planet id: " + planet_id + " to planet type id: " + planet_type_id);

                let planet_index = await planet.getIndex(dirty, { 'planet_id': planet_id });

                if(planet_index === -1) {
                    console.log("Could not find planet");
                    return false;
                }

                let planet_type_index = main.getPlanetTypeIndex(planet_type_id);

                if(planet_type_index === -1) {
                    log(chalk.yellow("Could not get the planet type index"));
                    return false;
                }

                await world.setPlanetType(socket, dirty, { 'planet_index': planet_index, 'planet_type_index': planet_type_index });


            }
            else if(data.message.includes("/spawnevent")) {
                let split = data.message.split(" ");
                let coord_type = split[1];
                let coord_id = split[2];
                let event_id = split[3];
                console.log("Spawning event id: " + event_id + " on coord type: " + coord_type + " coord id: " + coord_id);

                let event_index = event.getIndex(dirty, event_id);

                if(event_index === -1) {
                    console.log("Could not find event id: " + event_id);
                    return false;
                }


                if(coord_type === 'galaxy') {
                    let coord_index = await main.getCoordIndex({ 'coord_id': coord_id });

                    if(coord_index === -1) {
                        console.log("Could not find coord (galaxy)");
                        return false;
                    }

                    await event.spawn(dirty, event_index, { 'coord_index': coord_index, 'force': true });
                } else if(coord_type === 'ship') {
                    let ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': coord_id });

                    if(ship_coord_index === -1) {
                        console.log("Could not find ship coord");
                        return false;
                    }

                    await event.spawn(dirty, event_index, { 'ship_coord_index': ship_coord_index });
                } else if(coord_type === 'planet') {
                    let planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': coord_id });

                    if(planet_coord_index === -1) {
                        console.log("Could not find planet coord");
                        return false;
                    }

                    await event.spawn(dirty, event_index, { 'planet_coord_index': planet_coord_index });
                }


            }
            else if(data.message.includes("/spawnmonster ")) {

                let split = data.message.split(" ");

                let monster_type_name = "";
                for(let i = 1; i < split.length; i++) {
                    monster_type_name +=  " " + split[i];
                }

                monster_type_name = monster_type_name.trim();


                let monster_type_index = dirty.monster_types.findIndex(function(obj) {
                    return obj && obj.name.toUpperCase() === monster_type_name.toUpperCase() });

                if(monster_type_index === -1) {
                    log(chalk.yellow("Could not find monster type with name: " + monster_type_name));
                    return false;
                }

                

                let player_index = socket.player_index;

                let spawn_monster_data = {};

                let found_coord_index = -1;

                if(dirty.players[socket.player_index].planet_coord_id) {

                    let coord_index = await main.getPlanetCoordIndex({'planet_coord_id': dirty.players[player_index].planet_coord_id });

                    if(coord_index === -1) {
                        return false;
                    }

                    // go through the coords around the player, seeing if we can place the object there
                    for(let x = dirty.planet_coords[coord_index].tile_x -1; x <= dirty.planet_coords[coord_index].tile_x + 1; x++) {
                        for(let y = dirty.planet_coords[coord_index].tile_y -1; y <= dirty.planet_coords[coord_index].tile_y + 1; y++) {

                            if(found_coord_index === -1) {
                                let checking_coord_index = await main.getPlanetCoordIndex({ 'planet_id': dirty.planet_coords[coord_index].planet_id,
                                    'planet_level': dirty.planet_coords[coord_index].level, 'tile_x': x, 'tile_y': y });

                                let monster_can_place_result = await monster.canPlace(dirty, 'planet',
                                    dirty.planet_coords[checking_coord_index], {'monster_type_id': dirty.monster_types[monster_type_index].id });

                                if(checking_coord_index !== -1 && monster_can_place_result === true ) {

                                    found_coord_index = checking_coord_index;
                                    spawn_monster_data.planet_coord_index = checking_coord_index;

                                }
                            }


                        }
                    }

                } else if(dirty.players[player_index].ship_coord_id) {

                    console.log("In ship");


                    let coord_index = await main.getShipCoordIndex({'ship_coord_id': dirty.players[player_index].ship_coord_id });

                    if(coord_index === -1) {
                        return false;
                    }

                    // go through the coords around the player, seeing if we can place the object there
                    for(let x = dirty.ship_coords[coord_index].tile_x -1; x <= dirty.ship_coords[coord_index].tile_x + 1; x++) {
                        for(let y = dirty.ship_coords[coord_index].tile_y -1; y <= dirty.ship_coords[coord_index].tile_y + 1; y++) {

                            if(found_coord_index === -1) {
                                let checking_coord_index = await main.getShipCoordIndex({
                                    'ship_id': dirty.ship_coords[coord_index].ship_id,
                                    'level': dirty.ship_coords[coord_index].level, 'tile_x': x, 'tile_y': y });

                                let monster_can_place_result = await monster.canPlace(dirty, 'ship',
                                    dirty.ship_coords[checking_coord_index], {'monster_type_id': dirty.monster_types[monster_type_index].id });

                                if(checking_coord_index !== -1 && monster_can_place_result === true ) {

                                    found_coord_index = checking_coord_index;
                                    spawn_monster_data.ship_coord_index = checking_coord_index;
                                }
                            }


                        }
                    }
                } else if(dirty.players[player_index].coord_id) {
                    let coord_index = await main.getCoordIndex({'coord_id': dirty.players[player_index].coord_id });

                    if(coord_index === -1) {
                        log(chalk.yellow("Could not get the galaxy coord the player is on"));
                        return false;
                    }

                    // go through the coords around the player, seeing if we can place the object there
                    for(let x = dirty.coords[coord_index].tile_x -1; x <= dirty.coords[coord_index].tile_x + 1; x++) {
                        for(let y = dirty.coords[coord_index].tile_y -1; y <= dirty.coords[coord_index].tile_y + 1; y++) {

                            if(found_coord_index === -1) {

                                let checking_coord_index = await main.getCoordIndex({
                                    'tile_x': x, 'tile_y': y });

                                let monster_can_place_result = await monster.canPlace(dirty, 'galaxy',
                                    dirty.coords[checking_coord_index], { 'monster_type_id': dirty.monster_types[monster_type_index].id });

                                if(checking_coord_index !== -1 &&  monster_can_place_result === true) {

                                    console.log("Found coord in galaxy for monster");
                                    found_coord_index = checking_coord_index;
                                    spawn_monster_data.coord_index = checking_coord_index;
                                }
                            }


                        }
                    }
                }






                if(found_coord_index === -1) {
                    console.log("Did not find a coord to spawn the monster on");
                    return false;
                }


                console.log("Going to call monster.spawn!");
                await monster.spawn(dirty, dirty.monster_types[monster_type_index].id, spawn_monster_data);


            }
            else if(data.message.includes("/spawnnpc ")) {

                let split = data.message.split(" ");
                let npc_job_id = split[1];

                let npc_job_index = dirty.npc_jobs.findIndex(function(obj) { return obj && obj.id === parseInt(npc_job_id); });

                if(npc_job_index === -1) {
                    log(chalk.yellow("Could not find npc job with id: " + parseInt(npc_job_id)));
                    return false;
                }

                console.log("Admin message to spawn npc with job: " + dirty.npc_jobs[npc_job_index].name);

                await npc.spawn(dirty, { 'npc_job_id': dirty.npc_jobs[npc_job_index].id });



            }
            else if(data.message.includes("/spawnobject")) {
                console.log("Was spawn object message");
                let split = data.message.split(" ");

                let amount = split[1];
                let object_type_name = "";
                for(let i = 2; i < split.length; i++) {
                    object_type_name +=  " " + split[i];
                }

                console.log("Spawning " + amount + " of " + object_type_name);

                object_type_name = object_type_name.trim();


                let object_type_index = dirty.object_types.findIndex(function(obj) {
                    return obj && obj.name.toUpperCase() === object_type_name.toUpperCase() });

                if(object_type_index === -1) {
                    console.log("Could not find that object type");
                    return false;
                }

                let player_index = await player.getIndex(dirty, {'player_id': socket.player_id});

                if(player_index === -1) {
                    return false;
                }

                let found_coord_index = -1;

                if(dirty.players[player_index].ship_coord_id) {

                    let coord_index = await main.getShipCoordIndex({'ship_coord_id': dirty.players[player_index].ship_coord_id });

                    if(coord_index === -1) {
                        return false;
                    }

                    // go through the coords around the player, seeing if we can place the object there
                    for(let x = dirty.ship_coords[coord_index].tile_x -1; x <= dirty.ship_coords[coord_index].tile_x + 1; x++) {
                        for(let y = dirty.ship_coords[coord_index].tile_y -1; y <= dirty.ship_coords[coord_index].tile_y + 1; y++) {

                            if(found_coord_index === -1) {
                                let checking_coord_index = await main.getShipCoordIndex({
                                    'ship_id': dirty.ship_coords[coord_index].ship_id,
                                    'level': dirty.ship_coords[coord_index].level, 'tile_x': x, 'tile_y': y });


                                if(checking_coord_index !== -1 && await game_object.canPlace(dirty, 'ship',
                                     dirty.ship_coords[checking_coord_index], { 'object_type_id': dirty.object_types[object_type_index].id })) {

                                    found_coord_index = checking_coord_index;
                                }
                            }


                        }
                    }


                } else if(dirty.players[player_index].coord_id) {
                    let coord_index = await main.getCoordIndex({'coord_id': dirty.players[player_index].coord_id });

                    if(coord_index === -1) {
                        return false;
                    }


                    // go through the coords around the player, seeing if we can place the object there
                    for(let x = dirty.coords[coord_index].tile_x -1; x <= dirty.coords[coord_index].tile_x + 1; x++) {
                        for(let y = dirty.coords[coord_index].tile_y -1; y <= dirty.coords[coord_index].tile_y + 1; y++) {

                            if(found_coord_index === -1) {
                                let checking_coord_index = await main.getCoordIndex({ 'tile_x': x, 'tile_y': y });

                                if(checking_coord_index !== -1 && await game_object.canPlace(dirty, 'galaxy', dirty.coords[checking_coord_index],
                                    { 'object_type_id': dirty.object_types[object_type_index].id })) {
                                    found_coord_index = checking_coord_index;
                                }
                            }


                        }
                    }
                } else if(dirty.players[player_index].planet_coord_id) {
                    let coord_index = await main.getPlanetCoordIndex({'planet_coord_id': dirty.players[player_index].planet_coord_id });

                    if(coord_index === -1) {
                        return false;
                    }

                    // go through the coords around the player, seeing if we can place the object there
                    for(let x = dirty.planet_coords[coord_index].tile_x -1; x <= dirty.planet_coords[coord_index].tile_x + 1; x++) {
                        for(let y = dirty.planet_coords[coord_index].tile_y -1; y <= dirty.planet_coords[coord_index].tile_y + 1; y++) {

                            if(found_coord_index === -1) {
                                let checking_coord_index = await main.getPlanetCoordIndex({ 'planet_id': dirty.planet_coords[coord_index].planet_id,
                                    'planet_level': dirty.planet_coords[coord_index].level, 'tile_x': x, 'tile_y': y });

                                if(checking_coord_index !== -1 && await game_object.canPlace(dirty, 'planet', dirty.planet_coords[checking_coord_index],
                                    { 'object_type_id': dirty.object_types[object_type_index].id })) {

                                    found_coord_index = checking_coord_index;

                                }
                            }


                        }
                    }
                }

                if(found_coord_index === -1) {
                    console.log("Did not find a coord to spawn the object on");
                    return false;
                }


                // Create and place the object
                let new_object_index = -1;
                if(dirty.object_types[object_type_index].assembled_as_object) {
                    new_object_index = await world.insertObjectType(socket, dirty, { 'object_type_id': dirty.object_types[object_type_index].id });

                    if(dirty.object_types[object_type_index].spawns_object_type_on_create) {
                        console.log("object type spawns something when created!");
                        await game_object.spawn(dirty, new_object_index);

                    }

                    if(dirty.players[player_index].ship_coord_id) {
                        console.log("Placing object on ship coord");
                        await game_object.place(socket, dirty, { 'object_index': new_object_index, 'ship_coord_index': found_coord_index });
                    } else if(dirty.players[player_index].coord_id) {
                        console.log("Placing object on galaxy coord id: " + dirty.coords[found_coord_index].id +" x/y: " + 
                        dirty.coords[found_coord_index].tile_x + "/" + dirty.coords[found_coord_index].tile_y);
                        await game_object.place(socket, dirty, { 'object_index': new_object_index, 'coord_index': found_coord_index });
                    } else if(dirty.players[player_index].planet_coord_id) {
                        await game_object.place(socket, dirty, { 'object_index': new_object_index, 'planet_coord_index': found_coord_index });
                    }


                } else {

                    if(dirty.players[player_index].ship_coord_id) {
                        await main.updateCoordGeneric(socket, { 'ship_coord_index': found_coord_index,
                            'object_type_id': dirty.object_types[object_type_index].id, 'amount': amount });
                    } else if(dirty.players[player_index].coord_id) {
                        await main.updateCoordGeneric(socket, { 'coord_index': found_coord_index,
                            'object_type_id': dirty.object_types[object_type_index].id, 'amount': amount });
                    } else if(dirty.players[player_index].planet_coord_id) {
                        await main.updateCoordGeneric(socket, { 'planet_coord_index': found_coord_index,
                            'object_type_id': dirty.object_types[object_type_index].id, 'amount': amount });
                    }


                }



            } else if(data.message.includes("/tickdecay")) {
                await tickDecay(dirty);
            } else if(data.message.includes("/tickthegreatnomad")) {

                await main.tickNomad(dirty, true);
                
            } else if(data.message.includes("/tickspawners")) {
                await tickSpawners(dirty);
            } else if(data.message.includes("/tickEvents")) {
                
                await event.tickSpawning(dirty);
                await event.tickSpawnedEvents(dirty);
            } else if(data.message.includes("/tickstorytellers")) {

                let split = data.message.split(" ");
                let forced_event_id = split[1];
                await world.tickStorytellers(dirty, forced_event_id);
            } else if(data.message.includes("/updateshiptype ")) {
                console.log("Was updateshiptype message");
                let split = data.message.split(" ");

                let object_type_id = split[1];
                await game_object.updateType(dirty, object_type_id);

            } else if(data.message.includes("/warptoazureplanet ")) {
                console.log("Was warp to azure planet message");
                let split = data.message.split(" ");

                let player_id = parseInt(split[1]);

                let player_index = await player.getIndex(dirty, { 'player_id': player_id });

                if(player_index === -1) {
                    log(chalk.yellow("Could not find player"));
                    return false;
                }

                await movement.warpTo(socket, dirty, { 'player_index': player_index, 'warping_to': 'spaceport', 'planet_id': 6 });

            } else if(data.message.includes("/warptonpc ")) {
                console.log("Was warp to npc message");
                let split = data.message.split(" ");

                let npc_id = parseInt(split[1]);


                await movement.warpTo(socket, dirty, { 'player_index': socket.player_index, 'warping_to': 'npc', 'warping_to_id': npc_id });

            }


        } catch(error) {
            log(chalk.red("Error in game.processAdminChatMessage: " + error));
            console.error(error);
        }

    }

    exports.processAdminChatMessage = processAdminChatMessage;


    async function processChatMessage(socket, dirty, data) {

        try {

            if(!socket.logged_in) {
                return false;
            }

            let sending_player_index = await player.getIndex(dirty, {'player_id': socket.player_id});

            if(sending_player_index === -1) {
                return false;
            }

            //console.log('Received message: ' + data.message + " with scope: " + data.scope);
            var message = socket.player_name + ": " + data.message;


            // Received a system message - admin?
            if(data.scope === "system") {

                // Lets try and process admin commands
                if(socket.is_admin) {
                    console.log("Socket is admin");
                    await processAdminChatMessage(socket, dirty, data);

                }

            } else if(data.scope === 'global') {
                io.emit('chat', { 'message': message, 'scope': data.scope, 'source_type': 'player', 'source_id': dirty.players[sending_player_index].id });
            } else {
                Object.keys(io.sockets.sockets).forEach(await async function(id) {
                    let other_socket = io.sockets.connected[id];

                    if(!other_socket.logged_in) {
                        return false;
                    }

                    let other_player_index = await player.getIndex(dirty, { 'player_id': socket.player_id });

                    if(other_player_index === -1) {
                        return false;
                    }

                    if(data.scope === 'local') {

                        // Galaxy - it's all local
                        if(dirty.players[sending_player_index].coord_id && dirty.players[other_player_index].coord_id) {
                            other_socket.emit('chat', {'message': message, 'scope': data.scope, 'source_type': 'player', 'source_id': dirty.players[sending_player_index].id });
                        }
                        // Planet - make sure they are on the same planet
                        else if(dirty.players[sending_player_index].planet_coord_id && dirty.players[other_player_index].planet_coord_id) {
                            let sending_planet_coord_index = await main.getPlanetCoordIndex({'planet_coord_id': dirty.players[sending_player_index].planet_coord_id });
                            let receiving_planet_coord_index = await main.getPlanetCoordIndex({'planet_coord_id': dirty.players[other_player_index].planet_coord_id });

                            if(dirty.planet_coords[sending_planet_coord_index].planet_id === dirty.planet_coords[receiving_planet_coord_index].planet_id) {
                                other_socket.emit('chat', {'message': message, 'scope': data.scope, 'source_type': 'player', 'source_id': dirty.players[sending_player_index].id });
                            }
                        }
                        // Ship - make sure they are on the same ship
                        else if(dirty.players[sending_player_index].ship_coord_id && dirty.players[other_player_index].ship_coord_id) {
                            let sending_ship_coord_index = await main.getShipCoordIndex({'ship_coord_id': dirty.players[sending_player_index].ship_coord_id });
                            let receiving_ship_coord_index = await main.getShipCoordIndex({'ship_coord_id': dirty.players[other_player_index].ship_coord_id });

                            if(dirty.ship_coords[sending_ship_coord_index].ship_id === dirty.ship_coords[receiving_ship_coord_index].ship_id) {
                                other_socket.emit('chat', {'message': message, 'scope': data.scope, 'source_type': 'player', 'source_id': dirty.players[sending_player_index].id });
                            }
                        }

                    } else if(data.scope === 'faction') {

                        if(dirty.players[sending_player_index].faction_id && dirty.players[sending_player_index].faction_id === dirty.players[other_player_index].faction_id) {
                            other_socket.emit('chat', {'message': message, 'scope': data.scope });
                        }

                    }

                });
            }

        } catch(error) {
            log(chalk.red("Error in game.processChatMessage: " + error));
        }



    }

    exports.processChatMessage = processChatMessage;

    async function processMiningLinker(dirty, i) {
        try {

            //log(chalk.green("Have mining linker: player_id: " + dirty.mining_linkers[i].player_id + " object id: " + dirty.mining_linkers[i].object_id));

            // lets get the object and the player
            let object_index = await game_object.getIndex(dirty, dirty.mining_linkers[i].object_id);
            let player_index = await player.getIndex(dirty, {'player_id':dirty.mining_linkers[i].player_id});

            if(object_index === -1 || player_index === -1) {
                log(chalk.yellow("Object or player no longer exists. Removing mining linker"));
                // object no longer exists - removing the mining linker
                io.to(dirty.mining_linkers[i].player_socket_id).emit('mining_linker_info', {
                    'remove': true, 'mining_linker': dirty.mining_linkers[i]
                });

                delete dirty.mining_linkers[i];
                return false;
            }

            let mining_socket = world.getPlayerSocket(dirty, player_index);

            // lets make sure we are in range
            // lets see if the player is close enough to the monster to hit it
            let player_info = await player.getCoordAndRoom(dirty, player_index);
            let object_info = await game_object.getCoordAndRoom(dirty, object_index);

            if(helper.isFalse(player_info.coord) || helper.isFalse(object_info.coord) ) {
                log(chalk.yellow("Could not get coord for player or object in processMiningLinker"));
                io.to(dirty.mining_linkers[i].player_socket_id).emit('mining_linker_info', {
                    'remove': true, 'mining_linker': dirty.mining_linkers[i]
                });

                delete dirty.mining_linkers[i];
                return false;
            }

            if(player_info.room !== object_info.room) {

                // Normally being not in the same room would auto mean we remove it. BUT, if the player is in a ship
                // Room, the mining linker is still valid if the ship they are on is close enough
                if(object_info.room === 'galaxy' && player_info.room.includes("ship_")) {
                    // TODO check on the ship moving away?
                } else {
                    log(chalk.yellow("Player and object are not in the same room - mining"));
                    io.to(dirty.mining_linkers[i].player_socket_id).emit('mining_linker_info', {
                        'remove': true, 'mining_linker': dirty.mining_linkers[i]
                    });

                    delete dirty.mining_linkers[i];
                    return false;
                }


            }

            if(player_info.coord.planet_id && player_info.coord.level !== object_info.coord.level) {
                log(chalk.yellow("Player and object aren't on the same level - mining"));

                log(chalk.yellow("Player and object are not in the same room - mining"));
                io.to(dirty.mining_linkers[i].player_socket_id).emit('mining_linker_info', {
                    'remove': true, 'mining_linker': dirty.mining_linkers[i]
                });

                delete dirty.mining_linkers[i];
                return false;
            }


            // see if the x and y are close enough for the attack to hit
            // Only check the distance if we are in the same room
            if(player_info.room === object_info.room) {
                let x_difference = Math.abs(player_info.coord.tile_x - object_info.coord.tile_x);
                let y_difference = Math.abs(player_info.coord.tile_y - object_info.coord.tile_y);

                if(x_difference > 2 || y_difference > 2) {
                    // we are out of range
                    log(chalk.yellow("Out of range"));

                    io.to(dirty.mining_linkers[i].player_socket_id).emit('chat', { 'message': "Too far away from mining object", 'scope': 'system' });

                    io.to(dirty.mining_linkers[i].player_socket_id).emit('mining_linker_info', {
                        'remove': true, 'mining_linker': dirty.mining_linkers[i]
                    });


                    delete dirty.mining_linkers[i];
                    return false;
                }
            }



            let object_type_index = dirty.object_types.findIndex(function (obj) {
                return obj && obj.id === dirty.objects[object_index].object_type_id;
            });

            let spawn_linker_index = dirty.spawn_linkers.findIndex(function(obj) { return obj && obj.id === dirty.objects[object_index].current_spawn_linker_id; });

            if(spawn_linker_index === -1) {
                log(chalk.yellow("It seems that object id: " + dirty.objects[object_index].id + " object type id: " + dirty.object_types[object_type_index].id + " is using the old spawning system!"));
                return false;
            }

            if(dirty.objects[object_index].spawned_object_type_amount <= 0) {

                io.to(dirty.mining_linkers[i].player_socket_id).emit('mining_linker_info', {
                    'remove': true, 'mining_linker': dirty.mining_linkers[i]
                });
                // nothing left. Remove the mining linker, and see what happens to the object

                delete dirty.mining_linkers[i];


                if (dirty.object_types[object_type_index].spawns_object_type_depleted === 'destroy') {


                    await game_object.deleteObject(dirty, {'object_index': object_index });
                    if(object_info.coord.planet_id) {
                        await planet.sendCoordInfo(false, object_info.room, dirty, { 'planet_coord_index': object_info.coord_index });
                    } else if(object_info.coord.ship_id) {
                        await world.sendShipCoordInfo(false, object_info.room, dirty, { 'ship_coord_index': object_info.coord_index });
                    } else {
                        await world.sendCoordInfo(false, "galaxy", dirty, { 'coord_index': object_info.coord_index });
                    }

                } else {
                    dirty.objects[object_index].has_spawned_object = false;
                    dirty.objects[object_index].has_change = true;
                    await game_object.sendInfo(false, object_info.room, dirty, object_index, 'game.processMiningLinker');
                }
                return false;
            }



            // Skill checks!!!
            let mining_level = await player.getLevel(dirty, { 'player_index': player_index, 'skill_type': 'mining' });
            let resulting_complexity = dirty.object_types[object_type_index].complexity;

            //console.log("Checking mining level: " + mining_level + " against complexity: " + resulting_complexity);
            let success = world.complexityCheck(mining_level, resulting_complexity);

            if(success === false) {
                //console.log("Mining Failed");
                dirty.players[player_index].mining_skill_points += resulting_complexity + 1;
                dirty.players[player_index].has_change = true;
                await player.sendInfo(mining_socket, false, dirty, dirty.players[player_index].id);
                mining_socket.emit('chat', {'message': 'Mining Failed'});
                mining_socket.emit('result_info', { 'status': 'failure', 'text': "Your beam is a bit weak"});
                return false;
            }


            dirty.players[player_index].mining_skill_points += 1;
            dirty.players[player_index].has_change = true;
            await player.sendInfo(mining_socket, false, dirty, dirty.players[player_index].id);

            let adding_amount = mining_level;
            if (dirty.objects[object_index].spawned_object_type_amount < adding_amount) {
                adding_amount = dirty.objects[object_index].spawned_object_type_amount;
            }

            dirty.objects[object_index].spawned_object_type_amount -= adding_amount;
            dirty.objects[object_index].has_change = true;

            // TODO we should send clients in the room info that the object updated


            io.to(object_info.room).emit('mining_linker_info', { 'mining_linker': dirty.mining_linkers[i] });

            
            //io.to(dirty.mining_linkers[i].player_socket_id).emit('mining_linker_info', {
            //    'mining_linker': dirty.mining_linkers[i]
            //});

            io.to(dirty.mining_linkers[i].player_socket_id).emit('mining_info', {
                'mining_linker_id': dirty.mining_linkers[i].id, 'amount': adding_amount
            });


            let spawned_object_type_index = main.getObjectTypeIndex(dirty.spawn_linkers[spawn_linker_index].spawns_object_type_id);


            // The thing being mined is in space - so it's being mined by a ship
            if(object_info.room === "galaxy" ) {

                let placed_result = await placeOnShip(mining_socket, dirty, dirty.spawn_linkers[spawn_linker_index].spawns_object_type_id, adding_amount);

            

                // Didn't find a ship coord, remove the mining linker
                if(placed_result === false) {
                    io.to(dirty.mining_linkers[i].player_socket_id).emit('mining_linker_info', {
                        'remove': true, 'mining_linker': dirty.mining_linkers[i]
                    });
                    // nothing left. Remove the mining linker, and see what happens to the object

                    delete dirty.mining_linkers[i];

                    mining_socket.emit('chat', {'message': 'Ship Has No Floor Space - Build More Bulk Containers?'});
                    mining_socket.emit('result_info', { 'status': 'failure', 'text': "Ship Has No Floor Space"});
                    return false;
                }

            }
            // Being mined on a ship or planet, add to the player's inventory
            else {
                let adding_to_data = {
                    'adding_to_type': 'player',
                    'adding_to_id': dirty.mining_linkers[i].player_id,
                    'object_type_id': dirty.spawn_linkers[spawn_linker_index].spawns_object_type_id,
                    'amount': adding_amount
                };

                await inventory.addToInventory(mining_socket, dirty, adding_to_data);
            }

            mining_socket.emit('result_info', { 'status': 'success',
            'text': "+" + adding_amount + " " + dirty.object_types[spawned_object_type_index].name,
            'object_id': dirty.objects[object_index].id });



            if(dirty.objects[object_index].spawned_object_type_amount <= 0) {

                io.to(dirty.mining_linkers[i].player_socket_id).emit('mining_linker_info', {
                    'remove': true, 'mining_linker': dirty.mining_linkers[i]
                });
                // nothing left. Remove the mining linker, and see what happens to the object

                delete dirty.mining_linkers[i];


                if (dirty.object_types[object_type_index].spawns_object_type_depleted === 'destroy') {


                    await game_object.deleteObject(dirty, {'object_index': object_index });
                    if(object_info.coord.planet_id) {
                        await planet.sendCoordInfo(false, object_info.room, dirty, { 'planet_coord_index': object_info.coord_index });
                    } else if(object_info.coord.ship_id) {
                        await world.sendShipCoordInfo(false, object_info.room, dirty, { 'ship_coord_index': object_info.coord_index });
                    } else {
                        await world.sendCoordInfo(false, "galaxy", dirty, { 'coord_index': object_info.coord_index });
                    }

                } else {
                    dirty.objects[object_index].has_spawned_object = false;
                    dirty.objects[object_index].has_change = true;
                    await game_object.sendInfo(false, object_info.room, dirty, object_index, 'game.processMiningLinker');
                }
            }


            //console.log("Finished with mining linker");

        } catch(error) {
            log(chalk.red("Error in game.processMiningLinker: " + error));
            console.error(error);
        }
    }

    // Players can repair objects, object types, and floor types
    async function processRepairingLinker(dirty, i) {

        try {
            let complexity = 0;

            if(!io.sockets.connected[dirty.repairing_linkers[i].player_socket_id]) {
                log(chalk.yellow("Looks like that player is not connected anymore"));
                delete dirty.repairing_linkers[i];
                return false;
            }

            let object_type_index = -1;
            let object_index = -1;
            let floor_type_index = -1;
            let ship_index = -1;
            let ship_type_index = -1;
            let room = '';
            let coord_type = 'none';


            // lets start figuring out what we are trying to repair. object, object type, floor type
            if(dirty.repairing_linkers[i].planet_coord_index) {

                room = "planet_" + dirty.planet_coords[dirty.repairing_linkers[i].planet_coord_index].planet_id;
                coord_type = 'planet';

                if(dirty.planet_coords[dirty.repairing_linkers[i].planet_coord_index].object_type_id) {
                    object_type_index = main.getObjectTypeIndex(dirty.planet_coords[dirty.repairing_linkers[i].planet_coord_index].object_type_id);
                    if(dirty.planet_coords[dirty.repairing_linkers[i].planet_coord_index].object_id) {
                        object_index = await game_object.getIndex(dirty, dirty.planet_coords[dirty.repairing_linkers[i].planet_coord_index].object_id);
                    }

                }

                floor_type_index = main.getFloorTypeIndex(dirty.planet_coords[dirty.repairing_linkers[i].planet_coord_index].floor_type_id);

            }

            if(dirty.repairing_linkers[i].ship_coord_index) {

                room = "ship_" + dirty.ship_coords[dirty.repairing_linkers[i].ship_coord_index].ship_id;
                coord_type = 'ship';

                if(dirty.ship_coords[dirty.repairing_linkers[i].ship_coord_index].object_type_id) {
                    object_type_index = main.getObjectTypeIndex(dirty.ship_coords[dirty.repairing_linkers[i].ship_coord_index].object_type_id);
                    if (dirty.ship_coords[dirty.repairing_linkers[i].ship_coord_index].object_id) {
                        object_index = await game_object.getIndex(dirty, dirty.ship_coords[dirty.repairing_linkers[i].ship_coord_index].object_id);
                    }
                }

                floor_type_index = main.getFloorTypeIndex(dirty.ship_coords[dirty.repairing_linkers[i].ship_coord_index].floor_type_id);

                // Since we're on a ship - get the ship info
                ship_index = await game_object.getIndex(dirty, dirty.ship_coords[dirty.repairing_linkers[i].ship_coord_index].ship_id);

                if(ship_index === -1) {
                    log(chalk.yellow("Could not find ship"));

                    io.sockets.connected[dirty.repairing_linkers[i].player_socket_id].emit('repairing_linker_info', {
                        'remove': true, 'repairing_linker': dirty.repairing_linkers[i]
                    });

                    delete dirty.repairing_linkers[i];

                    return false;
                }

                ship_type_index = main.getObjectTypeIndex(dirty.objects[ship_index].object_type_id);

            }


            // Object could be destroyed in the meantime - bad check here
            /*
            if(object_type_index === -1) {
                log(chalk.yellow("Could not find object type for repairing purposes"));
                io.sockets.connected[dirty.repairing_linkers[i].player_socket_id].emit('repairing_linker_info', {
                    'remove': true, 'repairing_linker': dirty.repairing_linkers[i] });
                delete dirty.repairing_linkers[i];
                return false;
            }
            */

            let found_something_to_repair = false;
            let repairing_type = 'none';

            if(object_type_index !== -1 && (dirty.object_types[object_type_index].can_be_repaired || dirty.object_types[object_type_index].repaired_object_type_id)) {
                found_something_to_repair = true;
                repairing_type = 'object|object_type';
                complexity = dirty.object_types[object_type_index].complexity;
            }

            if(!found_something_to_repair && floor_type_index !== -1 && dirty.floor_types[floor_type_index].repaired_floor_type_id) {
                found_something_to_repair = true;
                repairing_type = 'floor';
                complexity = dirty.floor_types[floor_type_index].complexity;
            }

            if(!found_something_to_repair) {
                log(chalk.yellow("Did not find anything to repair there"));
                io.sockets.connected[dirty.repairing_linkers[i].player_socket_id].emit('repairing_linker_info', {
                    'remove': true, 'repairing_linker': dirty.repairing_linkers[i] });
                delete dirty.repairing_linkers[i];
                return false;
            }



            // Identify the object type this thing is mostly made of
            let most_assembly_linker_index = -1;
            let most_amount = 0;
            // I guess lets juse use territe for now as a default
            let object_type_used_for_repair_id = 124;


            for(let al = 0; al < dirty.assembly_linkers.length; al++) {



                // if we're on a ship, and it's a ship wall, or just any floor on the ship, we are going to use what the ship is made of for the repair
                if(coord_type === 'ship' && ( (object_type_index !== -1 && dirty.object_types[object_type_index].is_ship_wall) || floor_type_index !== -1) ) {


                    if(dirty.assembly_linkers[al].required_for_object_type_id === dirty.object_types[ship_type_index].id && dirty.assembly_linkers[al].amount > most_amount) {
                        most_assembly_linker_index = al;
                        object_type_used_for_repair_id = dirty.assembly_linkers[al].object_type_id;
                        most_amount = dirty.assembly_linkers[al].amount;
                    }

                } else {
                    if(repairing_type === 'object|object_type' && object_type_index !== -1 && dirty.assembly_linkers[al].required_for_object_type_id === dirty.object_types[object_type_index].id &&
                        dirty.assembly_linkers[al].amount > most_amount) {
                        most_assembly_linker_index = al;
                        object_type_used_for_repair_id = dirty.assembly_linkers[al].object_type_id;
                        most_amount = dirty.assembly_linkers[al].amount;
                    }



                    if(repairing_type === 'floor' && floor_type_index !== -1 && dirty.assembly_linkers[al].required_for_floor_type_id === dirty.floor_types[floor_type_index].id &&
                        dirty.assembly_linkers[al].amount > most_amount) {
                        most_assembly_linker_index = al;
                        object_type_used_for_repair_id = dirty.assembly_linkers[al].object_type_id;
                        most_amount = dirty.assembly_linkers[al].amount;
                    }
                }

                
            }


            let object_type_used_for_repair_index = main.getObjectTypeIndex(object_type_used_for_repair_id);
            //console.log("We will use " + dirty.object_types[object_type_used_for_repair_index].name + " to repair this");

            let inventory_item_index = dirty.inventory_items.findIndex(function(obj) { return obj &&
                obj.player_id === dirty.repairing_linkers[i].player_id && obj.object_type_id === dirty.object_types[object_type_used_for_repair_index].id; });



            if(inventory_item_index === -1) {
                console.log("Player has none of that in their inventory");
                io.sockets.connected[dirty.repairing_linkers[i].player_socket_id].emit('result_info', { 'status': 'failure',
                    'text': "No " + dirty.object_types[object_type_used_for_repair_index].name + " in inventory" });

                let message_to_player = "";
                if(repairing_type === 'object|object_type') {
                    message_to_player = "No " + dirty.object_types[object_type_used_for_repair_index].name +
                        " in inventory to use to repair " + dirty.object_types[object_type_index].name + " with.";
                } else if(repairing_type === 'floor') {
                    message_to_player = "No " + dirty.object_types[object_type_used_for_repair_index].name +
                        " in inventory to use to repair floor " + dirty.floor_types[floor_type_index].name + " with.";
                }
                io.sockets.connected[dirty.repairing_linkers[i].player_socket_id].emit('chat',
                    { 'message': message_to_player, 'scope': 'system' });

                // remove the repairing_linker
                io.sockets.connected[dirty.repairing_linkers[i].player_socket_id].emit('repairing_linker_info', {
                    'remove': true, 'repairing_linker': dirty.repairing_linkers[i] });
                delete dirty.repairing_linkers[i];
                return false;
            }



            // use up one of the iron
            await inventory.removeFromInventory(io.sockets.connected[dirty.repairing_linkers[i].player_socket_id], dirty,
                { 'inventory_item_id': dirty.inventory_items[inventory_item_index].id, 'amount': 1 });


            // COMPLEXITY CHECK
            let repair_level = await player.getLevel(dirty, { 'player_index': dirty.repairing_linkers[i].player_index, 'skill_type': 'repairing' });
            let resulting_complexity = complexity;

            //console.log("Checking repair level: " + repair_level + " against complexity: " + resulting_complexity);
            let success = world.complexityCheck(repair_level, resulting_complexity);

            if(success === false) {
                //console.log("Repair Failed");
                dirty.players[dirty.repairing_linkers[i].player_index].repairing_skill_points += complexity + 1;
                dirty.players[dirty.repairing_linkers[i].player_index].has_change = true;
                player.sendInfo(io.sockets.connected[dirty.repairing_linkers[i].player_socket_id], false, dirty, dirty.players[dirty.repairing_linkers[i].player_index].id);
                io.sockets.connected[dirty.repairing_linkers[i].player_socket_id].emit('chat', {'message': 'Repairing Failed'});
                return false;
            }

            //console.log("Repair was a success");

            dirty.players[dirty.repairing_linkers[i].player_index].repairing_skill_points += 1;
            dirty.players[dirty.repairing_linkers[i].player_index].has_change = true;
            player.sendInfo(io.sockets.connected[dirty.repairing_linkers[i].player_socket_id], false, dirty,
                dirty.players[dirty.repairing_linkers[i].player_index].id);

            io.sockets.connected[dirty.repairing_linkers[i].player_socket_id].emit('repair_info', { 'repairing_linker_id': dirty.repairing_linkers[i].id, 'repaired_amount': repair_level });


            let done_with_repair = false;
            if(repairing_type === 'object|object_type') {
                if(object_index !== -1) {

                    dirty.objects[object_index].current_hp += repair_level;
                    

                    if(dirty.objects[object_index].current_hp > dirty.object_types[object_type_index].hp) {
                        dirty.objects[object_index].current_hp = dirty.object_types[object_type_index].hp;
                    }

                    dirty.objects[object_index].has_change = true;

                    if(dirty.objects[object_index].current_hp === dirty.object_types[object_type_index].hp) {
                        done_with_repair = true;

                    }

                    game_object.sendInfo(io.sockets.connected[dirty.repairing_linkers[i].player_socket_id], room, dirty, object_index);

                }
            }




            // Some extra things to do if we are on a ship
            if(ship_index !== -1) {
                let new_ship_hp = dirty.objects[ship_index].current_hp + repair_level + 10;


                //console.log("Increasing ship hp by: " + repair_level);
                // Increase the ship HP by the repair level
                if(new_ship_hp > dirty.object_types[ship_type_index].hp) {
                    new_ship_hp = dirty.object_types[ship_type_index].hp;
                }

                dirty.objects[ship_index].current_hp = new_ship_hp;
                dirty.objects[ship_index].has_change = true;
                await game_object.sendInfo(io.sockets.connected[dirty.repairing_linkers[i].player_socket_id], "ship_" + dirty.objects[ship_index].id, dirty, ship_index, 'game.processRepairingLinker');
                await game_object.sendInfo(false, "galaxy", dirty, ship_index, 'game.processRepairingLinker');



                await generateShipDamagedTiles(dirty, ship_index, dirty.repairing_linkers[i].ship_coord_index);

                // We can remove the repairing linker
                if(new_ship_hp >= dirty.object_types[ship_type_index].hp) {
                    done_with_repair = true;
                }


            }

            // We should be removing the repairing linker in generateShipDamagedTiles function
            if(done_with_repair && dirty.repairing_linkers[i]) {
                io.sockets.connected[dirty.repairing_linkers[i].player_socket_id].emit('repairing_linker_info', {
                    'remove': true, 'repairing_linker': dirty.repairing_linkers[i] });
                delete dirty.repairing_linkers[i];
            }


            //log(chalk.green("Did everything for the repair!"));


        } catch(error) {
            log(chalk.red("Error in game.processRepairingLinker:" + error));
            console.error(error);
        }

    }

    /**
     * @param {Object} dirty
     * @param {number} i - salvaging linker index
     */
    async function processSalvaging(dirty, i) {
        try {

            if(!dirty.active_salvagings[i]) {
                return false;
            }

            //console.log("Processing salvaging");

            // Later we will possibly be deleting all active salvagings with the indexes, so we need them separated
            let object_index = -1;
            let object_type_index = -1;
            let salvaging_coord = {};
            let salvaging_room = "";
            let object_info = {};


            let player_index = dirty.active_salvagings[i].player_index;

            // get the player's socket
            let socket = await world.getPlayerSocket(dirty, player_index);

            // player isn't connected anymore
            if(socket === false) {
                log(chalk.yellow("Player is not connected anymore. Removing active salvaging"));
                delete dirty.active_salvagings[i];
                return false;
            }

            // Make sure the player and the object are still close enough

            let player_info = await player.getCoordAndRoom(dirty, dirty.active_salvagings[i].player_index);



            if(typeof dirty.active_salvagings[i].object_index !== 'undefined') {
                
                object_index = dirty.active_salvagings[i].object_index;

                // Make sure the object still exists
                if(!dirty.objects[object_index]) {
                    world.sendActiveSalvaging(socket, false, dirty, i, true);
                    //log(chalk.yellow("Object no longer exists. Removing active salvaging. object_index was: " + object_index));
                    delete dirty.active_salvagings[i];
                    return false;
                }

                object_info = await game_object.getCoordAndRoom(dirty, dirty.active_salvagings[i].object_index);
                // The object type of the thing being salvaged - not the results
                object_type_index = main.getObjectTypeIndex(dirty.objects[object_index].object_type_id);
                salvaging_coord = object_info.coord;
                salvaging_room = object_info.room;
            }
            // We need to get the coord we are salvaging from
            else {
                if(dirty.active_salvagings[i].coord_type === 'planet') {

                    salvaging_coord = dirty.planet_coords[dirty.active_salvagings[i].coord_index];
                    salvaging_room = "planet_" + salvaging_coord.planet_id;
                } else if(dirty.active_salvagings[i].coord_type === 'ship') {
                    salvaging_coord = dirty.ship_coords[dirty.active_salvagings[i].coord_index];
                    salvaging_room = "ship_" + salvaging_coord.ship_id;
                } else if(dirty.active_salvagings[i].coord_type === 'galaxy') {
                    salvaging_coord = dirty.coords[dirty.active_salvagings[i].coord_index];
                    salvaging_room = "galaxy";
                }

                if(helper.isFalse(salvaging_coord.object_type_id)) {
                    world.sendActiveSalvaging(socket, false, dirty, i, true);
                    //log(chalk.yellow("object type at coord no longer exists. Removing active salvaging."));
                    delete dirty.active_salvagings[i];
                    return false;
                }

                object_type_index = main.getObjectTypeIndex(salvaging_coord.object_type_id);
            }
            


            if(helper.isFalse(player_info.coord) || helper.isFalse(salvaging_coord)) {
                log(chalk.yellow("Could not get coord for player or salvaging location in processSalvaging"));
                io.to(dirty.active_salvagings[i].player_socket_id).emit('salvaging_linker_info', {
                    'remove': true, 'salvaging_linker': dirty.active_salvagings[i]
                });

                delete dirty.active_salvagings[i];
                return false;
            }

            if(player_info.room !== salvaging_room) {
                

                // Normally being not in the same room would auto mean we remove it. BUT, if the player is in a ship
                // Room, the mining linker is still valid if the ship they are on is close enough
                if(salvaging_room === 'galaxy' && player_info.room.includes("ship_")) {
                    // TODO check on the ship moving away?
                } else {
                    console.log("Salvaging room mismatch. Player: " + player_info.room + " salvaging room: " + salvaging_room);
                    log(chalk.yellow("Player and object are not in the same room"));
                    io.to(dirty.active_salvagings[i].player_socket_id).emit('salvaging_linker_info', {
                        'remove': true, 'salvaging_linker': dirty.active_salvagings[i]
                    });

                    delete dirty.active_salvagings[i];
                    return false;
                }

            }

            if(player_info.coord.planet_id && player_info.coord.level !== salvaging_coord.level) {
                log(chalk.yellow("Player and object aren't on the same level"));

                io.to(dirty.active_salvagings[i].player_socket_id).emit('salvaging_linker_info', {
                    'remove': true, 'salvaging_linker': dirty.active_salvagings[i]
                });

                delete dirty.active_salvagings[i];
                return false;
            }

            // see if the x and y are close enough
            // Only check the distance if we are in the same room
            if(player_info.room === salvaging_room) {
                let x_difference = Math.abs(player_info.coord.tile_x - salvaging_coord.tile_x);
                let y_difference = Math.abs(player_info.coord.tile_y - salvaging_coord.tile_y);

                if(x_difference > 2 || y_difference > 2) {
                    // we are out of range
                    log(chalk.yellow("Out of range"));

                    io.to(dirty.active_salvagings[i].player_socket_id).emit('chat', { 'message': "Too far away from salvaging object", 'scope': 'system' });

                    io.to(dirty.active_salvagings[i].player_socket_id).emit('salvaging_linker_info', {
                        'remove': true, 'salvaging_linker': dirty.active_salvagings[i]
                    });


                    delete dirty.active_salvagings[i];
                    return false;
                }
            }




            /* So I like the idea of a canInteract function - but the actual function has gotten a bit outpaced by 
                the various conditions that can happen. Mining is fine if the player's ship is still around, even if the player
                is doing whatever, wherever in their ship, etc.
            let can_interact_result = canInteract(socket, dirty, player_info.scope, object_info.coord);

            if(can_interact_result === false) {
                log(chalk.yellow("Player is too far away. Removing active salvaging"));
                socket.emit('chat', { 'message': "You can't interact with that object right now",
                    'scope': 'system' });

                world.sendActiveSalvaging(socket, false, dirty, i, true);
                delete dirty.active_salvagings[i];

                return false;
            }
            */

            
            // We are salvaging stuff in chunks of 10 salvaging
            let previous_salvaging_chunk = 0;
            if(dirty.active_salvagings[i].total_salvaged > 0) {
                previous_salvaging_chunk = Math.floor(dirty.active_salvagings[i].total_salvaged / 10);
            }
            
            let salvaging_level = await player.getLevel(dirty, { 'player_index': dirty.active_salvagings[i].player_index, 'skill_type': 'salvaging' });


            dirty.active_salvagings[i].total_salvaged += salvaging_level;

            let new_salvaging_chunk = Math.floor(dirty.active_salvagings[i].total_salvaged / 10);

            dirty.players[dirty.active_salvagings[i].player_index].salvaging_skill_points += 1;
            await player.sendInfo(socket, false, dirty, dirty.players[player_index].id);


            world.sendActiveSalvaging(socket, false, dirty, i);

            // Nothing to do here, but send the updated salvaging linker information
            if(new_salvaging_chunk === previous_salvaging_chunk) {

                return;
            }


            // We've moved onto a new chunk! Or two! or 10!!! (if salvaging level is high enough)

            for(let c = 0; c < new_salvaging_chunk - previous_salvaging_chunk; c++) {

                // Pull the possible salvagings
                let rarity_roll = helper.rarityRoll();
                let possible_salvage_linkers = dirty.salvage_linkers.filter(linker_filter => 
                    linker_filter.object_type_id === dirty.object_types[object_type_index].id && linker_filter.rarity <= rarity_roll);

                if(possible_salvage_linkers.length === 0) {

                    if(object_index !== -1) {
                        socket.emit('result_info', { 'status': 'failure',
                        'text': "No finds this round",
                        'object_id': dirty.objects[object_index].id });
                    } else {
                        socket.emit('result_info', { 'status': 'failure',
                        'text': "No finds this round",
                        'coord_id': dirty.active_salvagings[i].coord_id,
                        'coord_type': dirty.active_salvagings[i].coord_type });
                    }
                    
                } 
                // 
                else {
                    let chosen_salvage_linker = possible_salvage_linkers[Math.floor(Math.random()*possible_salvage_linkers.length)];
                    

                    // complexity check on the salvage linker
                    let complexity_success = world.complexityCheck(salvaging_level, chosen_salvage_linker.complexity);


                    if(!complexity_success) {
                        //log(chalk.yellow("Salvaging failed"));

                        if(object_index !== -1) {
                            socket.emit('result_info', { 'status': 'failure',
                            'text': "Your beam mangled up something advanced",
                            'object_id': dirty.objects[object_index].id });
                            socket.emit('chat', { 'message': 'Your beam mangled up something advanced', 'scope': 'system' });
                        } else {
                            socket.emit('result_info', { 'status': 'failure',
                            'text': "Your beam mangled up something advanced",
                            'coord_id': dirty.active_salvagings[i].coord_id,
                            'coord_type': dirty.active_salvagings[i].coord_type });
                            socket.emit('chat', { 'message': 'Your beam mangled up something advanced', 'scope': 'system' });
                        }
                        


                    } 
                    // SUCCESS!!
                    else {

                        let salvaged_object_type_index = main.getObjectTypeIndex(chosen_salvage_linker.salvaged_object_type_id);

                    

                        // If it's assembled as an object, we need to create an object for each one
                        if(dirty.object_types[salvaged_object_type_index].assembled_as_object) {


                            for(let x = 1; x <= chosen_salvage_linker.amount; x++) {


                                if(salvaging_room === 'galaxy') {
                                    let place_on_ship_result = await placeOnShip(socket, dirty, dirty.object_types[salvaged_object_type_index].id, 1);
                        
                                    if(place_on_ship_result === false) {

                                        io.to(dirty.active_salvagings[i].player_socket_id).emit('salvaging_linker_info', {
                                            'remove': true, 'salvaging_linker': dirty.active_salvagings[i]
                                        });

                                        io.to(dirty.active_salvagings[i].player_socket_id).emit('result_info', {
                                            'status': 'failure', 'text': "Ship Has No Floor Space"
                                        });
                    
            
                    
                                        delete dirty.active_salvagings[i];
                                        return false;

                                    }
                                } else {

                                    let insert_object_type_data = { 'object_type_id': dirty.object_types[salvaged_object_type_index].id,
                                    'source': 'game.salvage' };
                                    let new_object_index = await world.insertObjectType(socket, dirty, insert_object_type_data);

                                    await inventory.addToInventory(socket, dirty, { 'adding_to_type': 'player', 'adding_to_id': socket.player_id,
                                        'object_id': dirty.objects[new_object_index].id, 'amount': 1 });        
                                }
        

                            }


                        } 
                        // We've salvaged an object type
                        else {

                            if(salvaging_room === 'galaxy') {
                                let placed_on_ship_result = await placeOnShip(socket, dirty, dirty.object_types[salvaged_object_type_index].id, chosen_salvage_linker.amount);

                                if(placed_on_ship_result === false) {
                                    io.to(dirty.active_salvagings[i].player_socket_id).emit('salvaging_linker_info', {
                                        'remove': true, 'salvaging_linker': dirty.active_salvagings[i]
                                    });

                                    io.to(dirty.active_salvagings[i].player_socket_id).emit('result_info', {
                                        'status': 'failure', 'text': "Ship Has No Floor Space"
                                    });
                
        
                                    delete dirty.active_salvagings[i];
                                    return false;

                                }

                            } else {
                                await inventory.addToInventory(socket, dirty, { 'adding_to_type': 'player', 'adding_to_id': socket.player_id,
                                'object_type_id': dirty.object_types[salvaged_object_type_index].id, 'amount': chosen_salvage_linker.amount });
                            }
                            
                        }


                        let result_info_data = { 'status': 'success', 'text': "+" + chosen_salvage_linker.amount + " " + dirty.object_types[salvaged_object_type_index].name};
                        if(typeof dirty.active_salvagings[i].object_index !== 'undefined') {

                            result_info_data.object_id = dirty.objects[object_index].id;
                        } else {
                            result_info_data.coord_id = salvaging_coord.id;
                            result_info_data.coord_type = dirty.active_salvagings[i].coord_type;
                        }
                        socket.emit('result_info', result_info_data );

                    }






                }

                // Reduce the object's hp by ten
                if(object_index !== -1) {
                    dirty.objects[object_index].current_hp -= 10;
                    dirty.objects[object_index].has_change = true;

                      // If the object's new hp <= 0, remove it
                    if(dirty.objects[object_index].current_hp <= 0) {
                        await game_object.deleteObject(dirty, {'object_index': object_index });

                        console.log("Deleted object");

                        
                        if(object_info.scope === 'galaxy') {
                            await world.sendCoordInfo(false, "galaxy", dirty, { 'coord_index': object_info.coord_index });
                        } else if(object_info.scope === 'planet') {
                            await world.sendCoordInfo(false, "planet" + object_info.coord.planet_id, dirty, { 'planet_coord_index': object_info.coord_index });

                        } else if(object_info.scope === 'ship') {
                            await world.sendCoordInfo(false, "ship_" + object_info.coord.ship_id, dirty, { 'ship_coord_index': object_info.coord_index });
                        }
                    } else {
                        await game_object.sendInfo(false, object_info.room, dirty, object_index);

                    }
                } 
                // Or decrement the object type by 1
                else {


                    let coord_update_data = {};
                    let check_spawned_event_id = 0;
                    if(dirty.active_salvagings[i].coord_type === 'galaxy') {
                       coord_update_data.coord_index = dirty.active_salvagings[i].coord_index;
                    } else if(dirty.active_salvagings[i].coord_type === 'planet') {
                        coord_update_data.planet_coord_index = dirty.active_salvagings[i].coord_index;
                    } else if(dirty.active_salvagings[i].coord_type === 'ship') {
                        coord_update_data.ship_coord_index = dirty.active_salvagings[i].coord_index;
                    }


                    let new_object_type_amount = salvaging_coord.object_amount - 1;
                    if(new_object_type_amount <= 0) {
                        coord_update_data.object_type_id = false;

                        if(salvaging_coord.spawned_event_id) {
                            check_spawned_event_id = salvaging_coord.spawned_event_id;
                            coord_update_data.spawned_event_id = false;
                        }
                    } else {
                        coord_update_data.object_type_id = salvaging_coord.object_type_id;
                        coord_update_data.amount = new_object_type_amount;
                    }

                    

                    await main.updateCoordGeneric(socket, coord_update_data);

                    if(check_spawned_event_id !== 0) {
                        event.checkSpawnedEvent(dirty, check_spawned_event_id);
                    }

                    if(new_object_type_amount <= 0) {
                        world.sendActiveSalvaging(socket, false, dirty, i, true);
                    }

                    
                }

            
    

            }
            

        } catch(error) {
            log(chalk.red("Error in game.processSalvaging: " + error));
            console.error(error);
        }
    }


    /**
     * @param {Object} socket
     * @param {Object} dirty
     * @param {Object} data
     * @param {number=} data.object_id
     * @param {number=} data.coord_id
     * @param {String=} data.coord_type
     */
    async function salvage(socket, dirty, data) {
        try {

            //log(chalk.green("Got salvage request"));


            if(typeof socket.player_index === 'undefined') {
                log(chalk.yellow("Socket doesn't have a player index"));
                return false;
            }


            if(typeof data.object_id !== 'undefined') {
                //console.log("Was sent in object id: " + data.object_id);
                let object_index = await game_object.getIndex(dirty, parseInt(data.object_id));

                if(object_index === -1) {
                    console.log("Could not find object");
                    return false;
                }
    
    
                let being_salvaged_object_type_index = dirty.object_types.findIndex(function(obj) { return obj &&
                    obj.id === dirty.objects[object_index].object_type_id; });
    
                if(being_salvaged_object_type_index === -1) {
                    return false;
                }
    
                if(!dirty.object_types[being_salvaged_object_type_index].can_be_salvaged) {
                    log(chalk.yellow("Player is trying to salvage something that is not salvagable"));
                    socket.emit('chat', { 'message': "That cannot be salvaged", 'scope': 'system' });
                    return false;
                }
    
                let salvaging_index = dirty.active_salvagings.findIndex(function(obj) { return obj &&
                    obj.player_id === socket.player_id && obj.object_id === dirty.objects[object_index].id; });
    
                if(salvaging_index !== -1) {
                    return false;
                }
    

    
                // If we are in the galaxy, we need to make sure the player isn't in a pod
                if(dirty.objects[object_index].coord_id) {
                    
                    let player_ship_index = await game_object.getIndex(dirty, dirty.players[socket.player_index].ship_id);
                    if(player_ship_index === -1) {
                        log(chalk.yellow("Could not find ship for player"));
                        return false;
                    }
    
                    // Can't salvage with a pod
                    if(dirty.objects[player_ship_index].object_type_id === 114) {
                        socket.emit('chat', { 'message': "You cannot salvage with a pod", 'scope': 'system' });
                        return false;
                    }
                }
    
    
                let active_salvaging_linker = {
                    'id': uuidv1(),
                    'player_id': socket.player_id, 'object_id': dirty.objects[object_index].id,
                    'player_index': socket.player_index, 'object_index': object_index,
                    'total_salvaged': 0,
                    'player_socket_id': socket.id
                };
    
                salvaging_index = dirty.active_salvagings.push(active_salvaging_linker) - 1;
    
    
                world.sendActiveSalvaging(socket, false, dirty, salvaging_index);


                // If the object type has an attack, it's going to attack back! (Things like Prison Ship)
                if(helper.notFalse(dirty.object_types[being_salvaged_object_type_index].attack_strength)) {
                     // Make sure the monster isn't already attacking something
                     let existing_battle_linker_index = dirty.battle_linkers.findIndex(function(obj) { return obj &&
                        obj.attacking_id === dirty.objects[object_index].id && obj.attacking_type === 'object'; });

                    if(existing_battle_linker_index === -1) {

                        let player_info = await player.getCoordAndRoom(dirty, socket.player_index);

                        let battle_linker_data = {
                            'id': uuidv1(),
                            'attacking_id': dirty.objects[object_index].id, 'attacking_type': 'object', 
                            'room': player_info.room,
                            'being_attacked_sock_id': socket.id,
                            'turn_count': 0
                        };

                        if(player_info.room === 'galaxy') {
                            battle_linker_data.being_attacked_type = 'object';
                            battle_linker_data.being_attacked_id = dirty.players[socket.player_index].ship_id;
                        } else {
                            battle_linker_data.being_attacked_type = 'player';
                            battle_linker_data.being_attacked_id = dirty.players[socket.player_index].id;
                        }

                        let new_battle_linker_index = dirty.battle_linkers.push(battle_linker_data) - 1;
                        
                        socket.emit('battle_linker_info', { 'battle_linker': dirty.battle_linkers[new_battle_linker_index] });
                        
                    }
                }


            } 
            // Salvaging based on a coord
            else if(typeof data.coord_id !== 'undefined') {
                let salvaging_coord_index = -1;
                let salvaging_coord = {};

                if(data.coord_type === 'galaxy') {
                    salvaging_coord_index = await main.getCoordIndex( {'coord_id': data.coord_id} );

                    if(salvaging_coord_index === -1) {
                        return false;
                    }

                    salvaging_coord = dirty.coords[salvaging_coord_index];
                } else if(data.coord_type === 'ship') {
                    salvaging_coord_index = await main.getShipCoordIndex( {'ship_coord_id': data.coord_id} );

                    if(salvaging_coord_index === -1) {
                        return false;
                    }

                    salvaging_coord = dirty.ship_coords[salvaging_coord_index];
                } else if(data.coord_type === 'planet') {
                    salvaging_coord_index = await main.getPlanetCoordIndex( {'planet_coord_id': data.coord_id} );

                    if(salvaging_coord_index === -1) {
                        return false;
                    }

                    salvaging_coord = dirty.planet_coords[salvaging_coord_index];
                }
                
                if(salvaging_coord_index === -1) {
                    console.log("Could not find object");
                    return false;
                }

                // The salvaging cood should have an object type, not an object
                if(salvaging_coord.object_id) {
                    log(chalk.yellow("Should be trying to salvage this a different way (via the object)"));
                    return false;
                }

    
    
                let object_type_index = dirty.object_types.findIndex(function(obj) { return obj &&
                    obj.id === salvaging_coord.object_type_id; });
    
                if(object_type_index === -1) {
                    return false;
                }
    
                if(!dirty.object_types[object_type_index].can_be_salvaged) {
                    log(chalk.yellow("Player is trying to salvage something that is not salvagable"));
                    socket.emit('chat', { 'message': "That cannot be salvaged", 'scope': 'system' });
                    return false;
                }
    
                let salvaging_index = dirty.active_salvagings.findIndex(function(obj) { return obj &&
                    obj.player_id === socket.player_id && obj.coord_id === salvaging_coord.id && obj.coord_type === data.coord_type; });
    
                if(salvaging_index !== -1) {
                    return false;
                }
    

    
                // If we are in the galaxy, we need to make sure the player isn't in a pod
                if(data.coord_type === 'galaxy') {
                    
                    let player_ship_index = await game_object.getIndex(dirty, dirty.players[socket.player_index].ship_id);
                    if(player_ship_index === -1) {
                        log(chalk.yellow("Could not find ship for player"));
                        return false;
                    }
    
                    // Can't salvage with a pod
                    if(dirty.objects[player_ship_index].object_type_id === 114) {
                        socket.emit('chat', { 'message': "You cannot salvage with a pod", 'scope': 'system' });
                        return false;
                    }
                }
    
    
                let active_salvaging_linker = {
                    'id': uuidv1(),
                    'player_id': socket.player_id, 
                    'player_index': socket.player_index,
                    'coord_index': salvaging_coord_index,
                    'coord_id': salvaging_coord.id, // We need the coord id so we can send that to the client - coord_index isn't going to do much for it.
                    'coord_type': data.coord_type,
                    'total_salvaged': 0,
                    'player_socket_id': socket.id
                };
    
                salvaging_index = dirty.active_salvagings.push(active_salvaging_linker) - 1;
    
    
                world.sendActiveSalvaging(socket, false, dirty, salvaging_index);
            }



        } catch(error) {
            log(chalk.red("Error in game.salvage: " + error));
            console.error(error);
        }
    }

    exports.salvage = salvage;

    async function salvageStop(socket, dirty, data) {
        try {

            //log(chalk.green("Got salvage stop request for id: " + data.salvaging_linker_id));

            let active_salvaging_index = dirty.active_salvagings.findIndex(function(obj) { return obj && obj.id === data.salvaging_linker_id; });

            if(active_salvaging_index !== -1) {
                //console.log("Stopping the salvaging");

                world.sendActiveSalvaging(socket, false, dirty, active_salvaging_index, true);
                delete dirty.active_salvagings[active_salvaging_index];
            } else {
                log(chalk.yellow("Looks like an invalid salvage stop request"));
                console.log(data);
            }

        } catch(error) {
            log(chalk.red("Error in game.salvageStop: " + error));
            console.error(error);
        }
    }

    exports.salvageStop = salvageStop;

    async function setAutopilotDestination(socket, dirty, destination_tile_x, destination_tile_y) {

        try {

            // I think we can just have an autopilots array and put in the relevant info
            let autopilot_index = dirty.autopilots.push({ 'id': uuidv1(), 'player_id': socket.player_id, 'destination_tile_x': parseInt(destination_tile_x),
                'destination_tile_y': parseInt(destination_tile_y) }) - 1;

            //console.log("Pushed autopilot: ");
            //console.log(dirty.autopilots[autopilot_index]);

        } catch(error) {
            log(chalk.red("Error in game.setAutopilotDestination: " + error));
        }

    }

    exports.setAutopilotDestination = setAutopilotDestination;


    async function tickAddictions(dirty) {
        try {

            for(let i = 0; i < dirty.addiction_linkers.length; i++) {

                if(dirty.addiction_linkers[i]) {

                    processAddictionLinker(dirty, i);

                }

                
            }


        } catch(error) {
            log(chalk.red("Error in game.tickAddiction: " + error));
            console.error(error);
        }
    }

    exports.tickAddictions = tickAddictions;


    // TODO this function is a mess
    async function tickAssemblies(dirty) {

        //console.log("In game.tickAssemblies");
        try {

            dirty.assemblies.forEach(await async function(assembly, i) {

                try {

                    let player_index = await player.getIndex(dirty, {'player_id':assembly.player_id});

                    // Player has been deleted or something? Crazy!
                    if(player_index === -1) {
                        console.log("No longer have player for assembly. Removing");
                        await (pool.query("DELETE FROM assemblies WHERE id = ?", [assembly.id]));

                        delete dirty.assemblies[i];
                        return false;
                    }

                    let player_socket = await world.getPlayerSocket(dirty, player_index);

                    let assembler_object_index = await game_object.getIndex(dirty, assembly.assembler_object_id);



                    if(assembler_object_index === -1) {
                        log(chalk.yellow("Could not find assembler object for this assembly. Assembler object id: " + assembly.assembler_object_id));
                        console.log("Maybe it was deleted or destoryed?");

                        console.log("Just going to delete the assembly");
                        await (pool.query("DELETE FROM assemblies WHERE id = ?", [assembly.id]));

                        delete dirty.assemblies[i];
                        console.log("It's gone");
                        return;
                    }

                    let assembler_object_type_id = dirty.objects[assembler_object_index].object_type_id;


                    let assembler_object_info = await game_object.getCoordAndRoom(dirty, assembler_object_index);
                    let assembled_in_linker_index =  dirty.assembled_in_linkers.findIndex(function(obj) { return obj &&
                        obj.object_type_id === assembly.being_assembled_object_type_id &&
                        obj.assembled_in_object_type_id === dirty.objects[assembler_object_index].object_type_id; });




                    let assembly_is_finished = false;

                    // The assembly has ticked to completion, or it's an admin and we don't want to wait to test everything
                    if(assembly.current_tick_count >= dirty.assembled_in_linkers[assembled_in_linker_index].tick_count ||
                        ( helper.notFalse(player_socket) && player_socket.is_admin === true) ) {
                        assembly_is_finished = true;
                    }

                    if(!assembly_is_finished) {

                        dirty.assemblies[i].current_tick_count++;
                        dirty.assemblies[i].has_change = true;

                        if(assembler_object_info) {
                            io.to(assembler_object_info.room).emit('assembly_info', { 'assembly': assembly });
                        }

                        return;
                    }


                    /************** ASSEMBLY IS FINISHED ********************/

                    //log(chalk.green("\nAssembly Finished"));

                    // We absolutely want the assembly to be deleted even if there are errors down the road. Making 700 ships is butt!
                    // Increment the amount completed
                    assembly.amount_completed++;

                    if(dirty.assemblies[i].amount_completed >= dirty.assemblies[i].total_amount) {

                        //console.log("Going to delete the assembly now");
                        await (pool.query("DELETE FROM assemblies WHERE id = ?", [dirty.assemblies[i].id]));

                        let temp_assembly = dirty.assemblies[i];

                        // let the room know the assembly is finished
                        io.to(assembler_object_info.room).emit('assembly_info', { 'assembly': dirty.assemblies[i], 'finished': true });
            
                        delete dirty.assemblies[i];



                        // Set it to not active if it isn't already deleted
                        if(dirty.objects[assembler_object_index]) {
                            dirty.objects[assembler_object_index].is_active = false;
                            await game_object.sendInfo(false, assembler_object_info.room, dirty, assembler_object_index, 'game.tickAssemblies');
                        }

                    } else {
                        dirty.assemblies[i].current_tick_count = 0;
                        dirty.assemblies[i].has_change = true;
                        // Just send the updated info
                        io.to(assembler_object_info.room).emit('assembly_info', { 'assembly': dirty.assemblies[i] });
                    }




                    let assembled_object_type_index = main.getObjectTypeIndex(assembly.being_assembled_object_type_id);


                    // We need to do a complexity check
                    // Cooking
                    let level = 1;
                    if(dirty.objects[assembler_object_index].object_type_id === 119) {
                        level = await player.getLevel(dirty, { 'player_index': player_index, 'skill_type': 'cooking' });

                    }
                    // Manufacturing
                    else {

                        

                        level = await player.getLevel(dirty, { 'player_index': player_index, 'skill_type': 'manufacturing', 'scope': assembler_object_info.scope,
                            'coord_index': assembler_object_info.coord_index });

                    }

                    let success = world.complexityCheck(level, dirty.object_types[assembled_object_type_index].complexity);

                    if(success) {

                        let new_object_index = -1;

                        // we just have to do an object_type_id insert into the assembler's inventory
                        if(!dirty.object_types[assembled_object_type_index].assembled_as_object) {
                            let adding_to_data = { 'adding_to_type': 'object', 'adding_to_id': assembly.assembler_object_id,
                                'amount':1,  'object_type_id': assembly.being_assembled_object_type_id  };

                            await inventory.addToInventory(player_socket, dirty, adding_to_data);
                        } else {
                            let object_data = {'object_type_id': assembly.being_assembled_object_type_id,
                                'player_id': dirty.objects[assembler_object_index].player_id };
                            new_object_index = await world.insertObjectType(false, dirty, object_data);
                            //console.log("Got new object id: " + new_object_id);
                            //console.log("Got new_object_index as: " + new_object_index);

                        }

                        if(helper.notFalse(player_socket)) {
                            player_socket.emit('result_info', { 'status': 'success',
                                'text': "Assembling " + dirty.object_types[assembled_object_type_index].name + " Succeeded!",
                                'object_id': dirty.objects[assembler_object_index].id });
                        }

                        //console.log("Deleted assembly and spliced out of dirty.assemblies");

                        // If it was a food processer, we use the cooking skill
                        if(dirty.objects[assembler_object_index].object_type_id === 119) {
                            //log(chalk.cyan("Assembly finished in a food processor"));
                            dirty.players[player_index].cooking_skill_points++;
                        } else {
                            // Otherwise we use the manufacturing skill points
                            dirty.players[player_index].manufacturing_skill_points++;

                        }

                        dirty.players[player_index].has_change = true;

                        if(helper.notFalse(player_socket)) {
                            await player.sendInfo(player_socket, false, dirty, dirty.players[player_index].id);
                            //await sendPlayerStats(player_socket, dirty);
                        }



                        //console.log("Just finished assembling object type id: " + assembly.being_assembled_object_type_id);

                        // In most cases, we add the object to the inventory of the assembler
                        // In the case of ships, we remove the assembler, and place the new ship on the tile it was at
                        if(dirty.object_types[assembled_object_type_index].is_ship) {
                            console.log("Ship was assembled. Deleting assembler and putting the ship where it was");

                            // Assembled on a planet - not currently supporting this
                            /*
                            if(dirty.objects[assembler_object_index].planet_coord_id) {
                                console.log("Getting planet coord index for planet coord id: " + dirty.objects[assembler_object_index].planet_coord_id);
                                let assembler_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.objects[assembler_object_index].planet_coord_id });

                                await game_object.deleteObject(dirty, { 'object_index': assembler_object_index });

                                if(assembler_coord_index === -1) {
                                    console.log("Could not get planet coord index");
                                } else {
                                    console.log("Adding assembled ship to planet coord. new_object_index: " +
                                        new_object_index + " assembler_coord_index: " + assembler_coord_index);
                                    // Place the new object on the coord
                                    await game_object.place(false, dirty, { 'object_index': new_object_index.id,
                                        'planet_coord_index': assembler_coord_index });

                                    // we gotta generate the ship
                                    console.log("Calling game.generateShip");
                                    await world.generateShip(dirty, new_object_index);
                                    await world.attachShipEngines(dirty, new_object_index);
                                    //await main.getShipCoords(new_object_id);
                                }



                            }
                            */
                            // Assembled on a ship - Not sure if we are supporting this either
                            if(dirty.objects[assembler_object_index].ship_coord_id) {
                                log(chalk.red("Ship assembled on a ship. Not sure about this one"));
                                let assembler_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.objects[assembler_object_index].ship_coord_id });
                                await game_object.deleteObject(dirty, { 'object_index':assembler_object_index });

                                console.log("Adding assembled ship to ship coord. EEEEEK");
                                // Place the new object on the coord
                                await game_object.place(false, dirty, { 'object_index': new_object_index,
                                    'ship_coord_index': assembler_coord_index });
                                /*
                                await world.addObjectToShipCoord(dirty, new_object_index, assembler_coord_index);
                                await world.sendShipCoordInfo(false, "ship_" + dirty.ship_coords[assembler_coord_index].ship_id, dirty,
                                    { 'ship_coord_index': assembler_coord_index});

                                 */
                            }
                            // Assembled in the galaxy
                            else if(dirty.objects[assembler_object_index].coord_id) {
                                let assembler_coord_index = await main.getCoordIndex({ 'coord_id': dirty.objects[assembler_object_index].coord_id });
                                await game_object.deleteObject(dirty, { 'object_index': assembler_object_index });

                                console.log("Adding assembled ship to coord. EEEEEK");
                                // Place the new object on the coord
                                await game_object.place(false, dirty, { 'object_index': new_object_index,
                                    'coord_index': assembler_coord_index });
                                /*
                                await world.addObjectToCoord(dirty, new_object_index, assembler_coord_index);
                                await world.sendCoordInfo(false, "galaxy", dirty,
                                    { 'coord_index': assembler_coord_index});

                                 */
                            }


                            // I believe this is being taken care of in world.insertObjectType
                            //await world.generateShip(dirty, new_object_index);
                            //await world.attachShipEngines(dirty, new_object_index);
                            //await main.getShipCoords(new_object_id);

                            console.log("Done generating and getting ship coords");

                        }
                        /**************** DIDN'T ASSEMBLE A SHIP ************************/
                        else {

                            if(dirty.object_types[assembled_object_type_index].assembled_as_object) {
                                //console.log("Going to add new object " + new_object_id + " to inventory of assembler");

                                let adding_to_data = { 'adding_to_type': 'object', 'adding_to_id': assembly.assembler_object_id,
                                    'amount':1, 'object_id': dirty.objects[new_object_index].id, 'object_type_id': assembly.being_assembled_object_type_id  };

                                await inventory.addToInventory(player_socket, dirty, adding_to_data);
                            }



                            if(dirty.players[player_index].socket_id) {
                                //console.log("Assembly player has socket_id: " + dirty.players[player_index].socket_id);

                                if(helper.notFalse(player_socket)) {
                                    console.log("Found player socket as connected. Sending assembly_info");
                                    player_socket.emit('assembly_info', { 'finished': true, 'assembly': dirty.assemblies[i] });
                                }

                            }




                            // send the new information to anyone in the room
                            // TODO it's possible someone could use this data to know what other people are building. Maybe tighten it up?
                            if(dirty.objects[assembler_object_index].ship_coord_id) {
                                let assembler_ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.objects[assembler_object_index].ship_coord_id });
                                if(assembler_ship_coord_index !== false) {
//                                            console.log("Calling sendObjectInfo from game.tickAssemblies");
                                    await game_object.sendInfo(false, "ship_" + dirty.ship_coords[assembler_ship_coord_index].ship_id,
                                        dirty, assembler_object_index, 'game.tickAssemblies');
                                    await inventory.sendInventory(false, "ship_" + dirty.ship_coords[assembler_ship_coord_index].ship_id, dirty,
                                        'object', dirty.objects[assembler_object_index].id);
                                }

                            } else if(dirty.objects[assembler_object_index].planet_coord_id) {
                                let assembler_planet_coord_index = await main.getPlanetCoordIndex({
                                    'planet_coord_id': dirty.objects[assembler_object_index].planet_coord_id });
                                if(assembler_planet_coord_index !== false) {
                                    //console.log("Calling sendObjectInfo from game.tickAssemblies");
                                    await game_object.sendInfo(false, "planet_" + dirty.planet_coords[assembler_planet_coord_index].planet_id,
                                        dirty, assembler_object_index, 'game.tickAssemblies');
                                    await inventory.sendInventory(false, "planet_" + dirty.planet_coords[assembler_planet_coord_index].planet_id,
                                        dirty, 'object', dirty.objects[assembler_object_index].id);
                                }
                            }

                        }


                    }

                    /****************************** ASSEMBLY FAILED *********************************/
                    else {


                        if(helper.notFalse(player_socket)) {


                            // Send a system message that the assembly has failed
                            player_socket.emit('chat', { 'message': dirty.object_types[assembled_object_type_index].name +
                                    " Assembly Failed. The complexity eluded you this time", 'scope': 'system'});

                            player_socket.emit('result_info', { 'status': 'failure',
                                'text': "Assembling " + dirty.object_types[assembled_object_type_index].name + " Failed",
                                'object_id': dirty.objects[assembler_object_index].id });
                        } else {
                            //console.log("This socket is not connected - for assembly fail");
                        }



                        if(dirty.assemblies[i]) {
                            // Increment the amount completed
                            dirty.assemblies[i].amount_completed++;

                            if(dirty.assemblies[i].amount_completed >= dirty.assemblies[i].total_amount) {

                                //console.log("Going to delete the assembly now");
                                await (pool.query("DELETE FROM assemblies WHERE id = ?", [dirty.assemblies[i].id]));

                                // let the room know the assembly is finished
                                io.to(assembler_object_info.room).emit('assembly_info', { 'assembly': dirty.assemblies[i], 'finished': true });

                                delete dirty.assemblies[i];


                                dirty.objects[assembler_object_index].is_active = false;
                                await game_object.sendInfo(false, assembler_object_info.room, dirty, assembler_object_index);
                            } else {

                                dirty.assemblies[i].current_tick_count = 0;
                                dirty.assemblies[i].has_change = true;
                                // Just send the updated info
                                io.to(assembler_object_info.room).emit('assembly_info', { 'assembly': dirty.assemblies[i] });

                            }
                        }




                        // extra skill points for a failed assembly
                        // If it was a food processer, we use the cooking skill
                        // It's possible the assembling objet is already deleted at this point
                        if(assembler_object_type_id === 119) {
                            //log(chalk.cyan("Assembly finished in a food processor"));
                            dirty.players[player_index].cooking_skill_points += dirty.object_types[assembled_object_type_index].complexity;
                        } else {
                            // Otherwise we use the manufcaturing skill points
                            dirty.players[player_index].manufacturing_skill_points += dirty.object_types[assembled_object_type_index].complexity;

                        }

                        dirty.players[player_index].has_change = true;

                        if(helper.notFalse(player_socket)) {
                            await player.sendInfo(player_socket, false, dirty, dirty.players[player_index].id);
                            //await sendPlayerStats(player_socket, dirty);
                        }
                    }








                } catch(error) {
                    log(chalk.red("Error in game.tickAssemblies - assembly: " + error));
                    console.error(error);
                }


            });

        } catch(error) {
            log(chalk.red("Error in game.tickAssemblies: " + error));
            console.error(error);
        }


    }
    exports.tickAssemblies = tickAssemblies;


    // So the goal is that we can support the AI to make it stronger by building
    // AI energy storage units and more cores
    // Totally not super obvious - but we tick the AI's energy up slowly up to the max energy provided by batteries
    async function tickAI(dirty) {

        //console.time("tickAI");
        // to start with just load the AIs that are in memory already
        // TODO we want to always load all AIs when the server starts up

        let ais = dirty.objects.filter(object => object.object_type_id === 72);

        ais.forEach(function(ai) {

            // see if there are any AI Batteries on the planet. If so, we increase the maximum amount of energy storage
            // TODO looks like we need to load AI Batteries when the server starts up
            let ai_battery_count = 0;

            if(ai.planet_coord_id) {
                let ai_batteries = dirty.objects.filter(object => object.object_type_id === 161 && object.planet_id === ai.planet_id);

                for(let ai_battery of ai_batteries) {
                    ai_battery_count++;
                }
            } else if(ai.ship_coord_id) {
                let ai_batteries = dirty.objects.filter(object => object.object_type_id === 161 && object.ship_id === ai.ship_id);

                for(let ai_battery of ai_batteries) {
                    ai_battery_count++;
                }
            }


            //console.log("Found " + ai_battery_count + " ai batteries for AI id: " + ai.id);

            // 20000 for each battery, and 200 default
            let ai_max_energy = (20000 * ai_battery_count) + 200;

            if(ai.energy < ai_max_energy) {
                //console.log("Increasing energy for ai");
                ai.energy += 6;
                ai.has_change = true;
            }

            if(ai.energy > ai_max_energy) {
                ai.energy = ai_max_energy;
            }
        });

        //console.timeEnd("tickAI");

    }

    exports.tickAI = tickAI;

    async function tickAutopilots(dirty) {

        try {

            if(dirty.autopilots.length === 0) {
                return false;
            }

            for(let autopilot of dirty.autopilots) {

                await processAutopilot(dirty, autopilot);



            }
        } catch(error) {
            log(chalk.red("Error in game.tickAutopilots: " + error));
            console.error(error);
        }
    }

    exports.tickAutopilots = tickAutopilots;


    async function tickDecay(dirty) {
        try {

            //log(chalk.green("In game.tickDecay"));
            console.time("tickDecay");

            let decaying_object_type_ids = []

            for(let i = 0; i < dirty.object_types.length; i++) {
                if(dirty.object_types[i].can_decay) {

                    decaying_object_type_ids.push(dirty.object_types[i].id);

                }
            }

            for(let i = 0; i < dirty.objects.length; i++) {
                if(dirty.objects[i] && decaying_object_type_ids.indexOf(dirty.objects[i].object_type_id) !== -1) {

                    let object_info = await game_object.getCoordAndRoom(dirty, i);
                    let object_type_index = main.getObjectTypeIndex(dirty.objects[i].object_type_id);

                    let decay_rate = dirty.object_types[object_type_index].default_decay_rate;
                    let object_floor_type_index = main.getFloorTypeIndex(object_info.coord.floor_type_id);

                    for(let d = 0; d < dirty.object_type_decay_linkers.length; d++) {
                        if(dirty.object_type_decay_linkers[d] && dirty.object_type_decay_linkers[d].object_type_id === dirty.object_types[object_type_index].id) {
                            if(helper.notFalse(dirty.object_type_decay_linkers[d].floor_type_id) && dirty.object_type_decay_linkers[d].floor_type_id === object_info.coord.floor_type_id) {
                                decay_rate = dirty.object_type_decay_linkers[d].decay_rate;
                            }

                            if(helper.notFalse(dirty.object_type_decay_linkers[d].floor_type_class) && dirty.floor_types[object_floor_type_index] &&
                            dirty.object_type_decay_linkers[d].floor_type_class === dirty.floor_types[object_floor_type_index].class) {
                                decay_rate = dirty.object_type_decay_linkers[d].decay_rate;
                            }

                            if(dirty.object_type_decay_linkers[d].decays_when_abandoned && !dirty.objects[i].player_id) {
                                decay_rate = dirty.object_type_decay_linkers[d].decay_rate;
                            }

                        }
                    }

                    // If the 
                    
                    if(object_info.scope === 'ship') {
                        let ship_index = await game_object.getIndex(dirty, object_info.coord.ship_id);
                        if(ship_index !== -1) {
                            let ship_type_index = main.getObjectTypeIndex(dirty.objects[ship_index].object_type_id);
                            
                            if(dirty.object_types[ship_type_index].decay_modifier) {
                                //console.log("Object is on a ship that has a decay_modifier");
                                
                                // Object types can have a decay_modifier
                                // A decay_modifier of 50 means that 50% of the time, the ship will skip a decay tick
                                // A decay_modifier of 30 means 30% of the time, a decay_modifier of 90 means 90% of the time
                                let ship_rand_result = helper.getRandomIntInclusive(1,100);

                                if(ship_rand_result < dirty.object_types[ship_type_index].decay_modifier) {
                                    //console.log("Ship is skipping decaying this time!")
                                    decay_rate = 0;
                                }

                            }
                        }
                        
                    }


                    if(decay_rate > 0) {

                    
                        let hp_decay = Math.ceil(dirty.object_types[object_type_index].hp * (decay_rate / 100) );

                        //console.log("Got hp_decay as: " + hp_decay);

                        let new_object_hp = dirty.objects[i].current_hp - hp_decay;
                        //console.log("Object is going from: " + dirty.objects[i].current_hp + " to " + new_object_hp);

                        await game_object.damage(dirty, i, hp_decay, {'object_info': object_info, 'reason': 'decay' });

                    }


                    // It's also possible that the object type isn't assembled as an object, and can decay. Life water. So we
                    // Go through the planet coords and ship coords

                    if(!dirty.object_types[object_type_index].assembled_as_object) {
                        for(let p = 0; p < dirty.planet_coords.length; p++) {
                            if(dirty.planet_coords[p] && dirty.planet_coords[p].object_type_id === dirty.object_types[object_type_index].id &&
                                !dirty.planet_coords[p].object_id) {

                                let decay_rate = dirty.object_types[object_type_index].default_decay_rate;
                                // see if the object is on a floor type that changes the decay rate

                                for(let d = 0; d < dirty.object_type_decay_linkers.length; d++) {
                                    if(dirty.object_type_decay_linkers[d] && dirty.object_type_decay_linkers[d].floor_type_id === dirty.planet_coords[p].floor_type_id) {
                                        decay_rate = dirty.object_type_decay_linkers[d].decay_rate;
                                    }
                                }


                                if(decay_rate > 0) {

                                    // See if it drops anything
                                    // Rarity roll
                                    let rarity_roll = helper.rarityRoll();

                                    console.log("Getting all drop linkers for object type id: " + dirty.object_types[object_type_index].id);
                                    let drop_linkers = dirty.drop_linkers.filter(drop_linker =>
                                        drop_linker.object_type_id === dirty.object_types[object_type_index].id &&
                                        drop_linker.reason === 'decay' && drop_linker.rarity <= rarity_roll);
                                    if(drop_linkers.length > 0) {


                                        let drop_linker = drop_linkers[Math.floor(Math.random() * drop_linkers.length)];


                                        if(drop_linker.dropped_monster_type_id) {

                                            await main.updateCoordGeneric(false, { 'planet_coord_index': i, 'object_type_id': false });

                                            monster.spawn(dirty, drop_linker.dropped_monster_type_id,
                                                { 'planet_coord_id': dirty.planet_coords[i].id });


                                        } else if(drop_linker.dropped_object_type_id) {

                                            await main.updateCoordGeneric(false, { 'planet_coord_index': i,
                                                'object_type_id': drop_linker.dropped_object_type_id, 'amount': drop_linker.amount });

                                        }


                                    }

                                }

                            }
                        }
                    }

                }
            }


            //log(chalk.cyan("\nTicking decaying floor types"));
            // For
            let decaying_floor_types = dirty.floor_types.filter(floor_type => floor_type.can_decay);

            for(let decaying_floor_type of decaying_floor_types) {
                //console.log("Floor type: " + decaying_floor_type.name + " decays");

                let decaying_planet_coords = dirty.planet_coords.filter(planet_coord => planet_coord.floor_type_id === decaying_floor_type.id);

                if(decaying_planet_coords.length > 0) {
                    for(let planet_coord of decaying_planet_coords) {
                        let drop_linkers = dirty.drop_linkers.filter(drop_linker => drop_linker.floor_type_id === decaying_floor_type.id);


                        let new_floor_type_id = 1;
                        // TODO support for more than one drop linker for a floor type. I guess.
                        if(drop_linkers.length > 0) {
                            for(let drop_linker of drop_linkers) {
                                new_floor_type_id = drop_linker.dropped_floor_type_id;
                                console.log("Set new floor type id to: " + new_floor_type_id);
                            }
                        }

                        let planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': planet_coord.id });

                        await main.updateCoordGeneric({}, { 'planet_coord_index': planet_coord_index, 'floor_type_id': new_floor_type_id });
                    }

                }


            }

            console.timeEnd("tickDecay");

        } catch(error) {
            log(chalk.red("Error in game.tickDecay: " + error));
            console.error(error);
        }
    }

    exports.tickDecay = tickDecay;


    async function tickEnergy(socket, dirty) {

        // TODO we want to redo this a bit so that a body on a healing tile can
        if(socket.player_id) {
            let player_index = await player.getIndex(dirty, {'player_id':socket.player_id});

            // get the player's body
            if(dirty.players[player_index].body_id) {
                let body_index = await game_object.getIndex(dirty, dirty.players[player_index].body_id);

                if(body_index !== -1) {
                    dirty.objects[body_index].energy++;
                    dirty.objects[body_index].has_change = true;
    
    
                    // Ruel bodies gain defense every 10,000 energy
                    if(dirty.objects[body_index].race_id === 11) {
                        if(dirty.objects[body_index].energy >= 10000) {
                            dirty.objects[body_index].defense++;
                            dirty.objects[body_index].energy -= 10000;
                            dirty.objects[body_index].has_change = true;
                        }
                    }
    
                    socket.emit('object_info', { 'object': dirty.objects[body_index] });
                }
            } else {
                chalk.yellow("Player id: " + dirty.players[player_index].id + " doesn't have a body id... maybe they just died?");
            
            }
            

        }

    }

    exports.tickEnergy = tickEnergy;


    async function tickFood(dirty) {

        try {
            //log(chalk.green("\nIn game.tickFood"));
            // get eating linkers for this player
            // I THINK I want to tick each object type a single time. Good luck doing that with an async forEach :/ Hmm.


            dirty.eating_linkers.forEach(await async function(eating_linker, i) {

                try {
                    //console.log("Processing eating linker id: " + eating_linker.id + " player_id: " + eating_linker.player_id +
                    //    " body_id: " + eating_linker.body_id + " eating_object_type_id: " + eating_linker.eating_object_type_id);

                    let player_index = -1;
                    let npc_index = -1;
                    let socket = {};
                    let body_index = -1;
                    let body_type_index = -1;

                    if(eating_linker.player_id) {
                        player_index = await player.getIndex(dirty, { 'player_id': eating_linker.player_id });

                        // Find the socket for this player
                        socket = world.getPlayerSocket(dirty, player_index);

                        body_index = await game_object.getIndex(dirty, eating_linker.body_id);

                        if(body_index === -1) {
                            log(chalk.yellow("Could not find the body. Probably died"));

                            if(helper.notFalse(socket)) {
                                socket.emit('eating_linker_info', {'remove': true, 'eating_linker': eating_linker });
                            }
                            let [result] = await (pool.query("DELETE FROM eating_linkers WHERE id = ?", [eating_linker.id]));
                            delete dirty.eating_linkers[i];
                            return;
                        }

                        body_type_index = main.getObjectTypeIndex(dirty.objects[body_index].object_type_id);
                    } else if(eating_linker.npc_id) {
                        console.log("Have eating linker for npc id: " + eating_linker.npc_id);
                        npc_index = await npc.getIndex(dirty, eating_linker.npc_id);

                        // Npc died!
                        if(npc_index === -1) {
                            console.log("Looks like npc is dead");
                            let [result] = await (pool.query("DELETE FROM eating_linkers WHERE id = ?", [eating_linker.id]));
                            delete dirty.eating_linkers[i];
                            return;
                        }
                    }



                    // Find the race eating linker
                    let race_linker_index = -1;
                    if(eating_linker.player_id) {
                        race_linker_index = dirty.race_eating_linkers.findIndex(function(obj) {
                            return obj && obj.race_id === dirty.object_types[body_type_index].race_id &&
                                obj.object_type_id === eating_linker.eating_object_type_id; });
                    } else {
                        race_linker_index = dirty.race_eating_linkers.findIndex(function(obj) {
                            return obj && obj.race_id === 13 &&
                                obj.object_type_id === eating_linker.eating_object_type_id; });
                    }


                    if(race_linker_index === -1) {
                        log(chalk.yellow("Could not find race eating linker. Deleting"));
                        let [result] = await (pool.query("DELETE FROM eating_linkers WHERE id = ?", [eating_linker.id]));

                        delete dirty.eating_linkers[i];
                    } else {
                        if(dirty.race_eating_linkers[race_linker_index].hp) {


                            let player_info = await player.getCoordAndRoom(dirty, player_index);

                            // Player has the body that is eating this equipped
                            if(eating_linker.player_id && dirty.players[player_index].body_id === eating_linker.body_id) {
                                let new_hp = dirty.players[player_index].current_hp + dirty.race_eating_linkers[race_linker_index].hp;

                                //console.log("New hp is: " + new_hp);

                                if(new_hp > dirty.players[player_index].max_hp) {
                                    new_hp = dirty.players[player_index].max_hp;
                                }
                                dirty.players[player_index].current_hp = new_hp;
                                dirty.players[player_index].has_change = true;

                                // Some eating linkers will reduce HP
                                if(dirty.race_eating_linkers[race_linker_index].hp < 0) {
                                    if(new_hp <= 0) {
                                        await player.kill(dirty, player_index, "You were killed by food/addiction/poison");
                                    }
                                }

                                

                                if(player_info.room) {
                                    await player.sendInfo(socket, player_info.room, dirty, dirty.players[player_index].id);
                                }


                                // send damaged data (healing) to player to display
                                if(helper.notFalse(socket)) {
                                    socket.emit('damaged_data', {
                                        'player_id': dirty.players[player_index].id,
                                        'damage_amount': dirty.race_eating_linkers[race_linker_index].hp,
                                        'was_damaged_type': 'hp',
                                        'damage_types': ['healing']
                                    });
                                }

                            } 
                            // Player ate this, but has a different body now
                            else if(eating_linker.player_id) {

                                dirty.objects[body_index].current_hp += dirty.race_eating_linkers[race_linker_index].hp;

                                if(dirty.objects[body_index].current_hp > dirty.object_types[body_type_index].hp) {
                                    dirty.objects[body_index].current_hp = dirty.object_types[body_type_index].hp;
                                    dirty.objects[body_index].has_change = true;
                                }

                                game_object.sendInfo(socket, player_info.room, dirty, body_index);


                            } else {
                                let new_hp = dirty.npcs[npc_index].current_hp + dirty.race_eating_linkers[race_linker_index].hp;

                                console.log("New hp is: " + new_hp);

                                if(new_hp > dirty.npcs[npc_index].max_hp) {
                                    new_hp = dirty.npcs[npc_index].max_hp;
                                }
                                dirty.npcs[npc_index].current_hp = new_hp;
                                dirty.npcs[npc_index].has_change = true;

                                let npc_info = await world.getNpcCoordAndRoom(dirty, npc_index);

                                world.sendNpcInfo(false, npc_info.room, dirty, dirty.npcs[npc_index].id);

                                io.to(npc_info.room).emit('damaged_data', {
                                    'npc_id': dirty.npcs[npc_index].id,
                                    'damage_amount': dirty.race_eating_linkers[race_linker_index].hp,
                                    'was_damaged_type': 'hp',
                                    'damage_types': ['healing']
                                });
                            }



                        } else {
                            //console.log("Race eating linker does not increase HP");
                        }

                        // increase ticks completed


                        if(eating_linker.ticks_completed + 1 >= dirty.race_eating_linkers[race_linker_index].tick_count) {

                            //console.log("Eating linker is completed");

                            if(helper.notFalse(socket)) {
                                //console.log("Letting the player know this eating linker is done");
                                socket.emit('eating_linker_info', {'remove': true, 'eating_linker': eating_linker });
                            } else {
                                //console.log("No player socket: " + socket);
                            }

                            // delete the eating linker
                            let [result] = await (pool.query("DELETE FROM eating_linkers WHERE id = ?", [eating_linker.id]));

                            delete dirty.eating_linkers[i];

                            // Not sure that is working...
                            //delete eating_linker;

                            //console.log("Tried deleting the eating_linker");


                        } else {
                            eating_linker.ticks_completed++;
                            eating_linker.has_change = true;
                            //console.log("Increased ticks compeleted to: " + eating_linker.ticks_completed);

                            if(helper.notFalse(socket)) {
                                socket.emit('eating_linker_info', { 'eating_linker': eating_linker });
                            } else {
                                //console.log("No socket to send updated eating linker info to: " + socket);
                            }
                        }


                    }
                } catch(error) {
                    log(chalk.red("Error in game.tickFood - eating_linker: " + error));
                    console.error(error);
                }


            });



        } catch(error) {
            log(chalk.red("Error in game.tickFood: " + error));
            console.error(error);
        }

    }

    exports.tickFood = tickFood;

    async function tickFloors(dirty) {

        try {
            //console.log("In tickFloors");

            // go through each connected socket
            Object.keys(io.sockets.sockets).forEach(await async function(id) {

                try {
                    socket = io.sockets.connected[id];

                    //console.log("Checking socket id: " + socket.id);

                    if(!socket.player_id) {
                        return false;
                    }

                    //console.log("Socket has player id: " + socket.player_id);
                    let player_index = await player.getIndex(dirty, {'player_id': socket.player_id});

                    if(player_index === -1) {
                        return false;
                    }

                    let hp_effect = 0;

                    let temp_coord;
                    let coord_index = -1;
                    let room;

                    if(dirty.players[player_index].ship_coord_id) {
                        //console.log("Player has ship_coord_id: " + dirty.players[player_index].ship_coord_id);
                        coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.players[player_index].ship_coord_id});

                        if(coord_index === -1) {
                            log(chalk.yellow("Could not find that ship coord"));
                            return false;
                        }

                        temp_coord = dirty.ship_coords[coord_index];
                        room = "ship_" + temp_coord.ship_id;
                    } else if(dirty.players[player_index].coord_id) {
                        //console.log("Player has coord id: " + dirty.players[player_index].coord_id);
                        coord_index = await main.getCoordIndex({ 'coord_id': dirty.players[player_index].coord_id});

                        if(coord_index === -1) {
                            log(chalk.yellow("Could not find that coord"));
                            return false;
                        }

                        temp_coord = dirty.coords[coord_index];
                        room = "galaxy";
                    } else if(dirty.players[player_index].planet_coord_id) {
                        coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.players[player_index].planet_coord_id});

                        if(coord_index === -1) {
                            log(chalk.yellow("Could not find that planet coord"));
                            return false;
                        }

                        temp_coord = dirty.planet_coords[coord_index];
                        room = "planet_" + temp_coord.planet_id;
                    }

                    if(coord_index === -1) {
                        return false;
                    }

                    let floor_type_index = main.getFloorTypeIndex(temp_coord.floor_type_id);

                    if(floor_type_index === -1) {
                        return false;
                    }

                    hp_effect = dirty.floor_types[floor_type_index].hp_effect;

                    if(hp_effect === 0) {
                        return false;
                    }

                    // Actually gonna be damaging the ship
                    if(room === "galaxy") {
                        let ship_index = await game_object.getIndex(dirty, dirty.players[player_index].ship_id);
                        if(ship_index === -1) {
                            log(chalk.yellow("Unable to get ship for player in galaxy"));
                            return false;
                        }

                        let new_ship_hp = dirty.objects[ship_index].current_hp + hp_effect;
                        // Resolve the hp effect
                        dirty.objects[ship_index].current_hp = new_ship_hp;
                        dirty.objects[ship_index].has_change = true;
                        await game_object.sendInfo(socket, room, dirty, ship_index);


                        if(hp_effect < 0) {
                            socket.emit('damaged_data', {
                                'object_id': dirty.objects[ship_index].id, 'damage_amount': Math.abs(hp_effect), 'was_damaged_type': 'hp',
                                'damage_source_type':'floor'
                            });


                        } else if(hp_effect > 0) {
                            socket.emit('damaged_data', {
                                'object_id': dirty.objects[player_index].id, 'damage_amount': hp_effect, 'was_damaged_type': 'hp',
                                'damage_source_type':'floor', 'damage_types': ['healing']
                            });
                        }

                        if(new_ship_hp <= 0) {
                            await deleteShip(socket, dirty, dirty.objects[ship_index].id, 'battle');

                        } else {

                            generateShipDamagedTiles(dirty, ship_index);
                        }
                    } else {
                        let new_player_hp = dirty.players[player_index].current_hp + hp_effect;
                        // Resolve the hp effect
                        dirty.players[player_index].current_hp = new_player_hp;
                        dirty.players[player_index].has_change = true;
                        await player.sendInfo(socket, room, dirty, dirty.players[player_index].id);

                        if(hp_effect < 0) {
                            socket.emit('damaged_data', {
                                'player_id': dirty.players[player_index].id, 'damage_amount': Math.abs(hp_effect), 'was_damaged_type': 'hp',
                                'damage_source_type':'floor'
                            });


                        } else if(hp_effect > 0) {
                            socket.emit('damaged_data', {
                                'player_id': dirty.players[player_index].id, 'damage_amount': hp_effect, 'was_damaged_type': 'hp',
                                'damage_source_type':'floor', 'damage_types': ['healing']
                            });
                        }

                        if(new_player_hp <= 0) {
                            console.log("Calling player.kill from tickFloors");
                            player.kill(dirty, player_index, "You were killed by the floor");
                        }
                    }




                } catch(error) {
                    log(chalk.red("Error in game.tickFloors - socket: " + error));
                }



            });
        } catch(error) {
            log(chalk.red("Error in game.tickFloors: " + error));
            console.error(error);
        }



    }

    exports.tickFloors = tickFloors;

    /*
    async function tickGrowths(dirty) {
        try {
            let growth_object_types = dirty.object_types.filter(object_type => object_type.grows_into_object_type_id);

            growth_object_types.forEach(function(object_type) {
                try {
                    //log(chalk.cyan("Found object type that grows into another thing. " + object_type.id));

                    // get objects of this type
                    let growing_objects = dirty.objects.filter(object => object.object_type_id === object_type.id);

                    if(growing_objects) {
                        growing_objects.forEach(async function(object) {

                            try {

                                growObject(dirty, object.id);

                            } catch(error) {
                                log(chalk.red("Error in game.tickGrowths - object_type - object: " + error));
                            }



                        });
                    }
                } catch(error) {
                    log(chalk.red("Error in game.tickGrows - object_type: " + error));
                    console.error(error);
                }


            });
        } catch(error) {
            log(chalk.red("Error in game.tickGrowths: " + error));
            console.error(error);
        }

    }

    exports.tickGrowths = tickGrowths;

    */


    async function tickMarketLinkers(dirty) {
        try {


            // convert to seconds
            let current_time = helper.getTimestampInSeconds();

            for(let i = 0; i < dirty.market_linkers.length; i++) {
                if(dirty.market_linkers[i]) {
                    console.log("Have market linker id: " + dirty.market_linkers[i].id + " ending at: " + dirty.market_linkers[i].ending_at);

                    // see if the ending at time is less than the current time.
                    let market_linker_end_timestamp = new Date(Date.parse(dirty.market_linkers[i].ending_at)).getTime();
                    let area_index = await main.getAreaIndex(dirty.market_linkers[i].area_id);

                    console.log("Got market_linker_end_timestamp as: " + market_linker_end_timestamp);


                    if(market_linker_end_timestamp < current_time) {
                        log(chalk.green("MARKET LINKER IS ENDING!"));


                        let highest_bid_linker_index = -1;

                        for(let b = 0; b < dirty.bid_linkers.length; b++) {
                            if(dirty.bid_linkers[b] && dirty.bid_linkers.area_id === dirty.market_linkers[i].area_id) {
                                if(highest_bid_linker_index === -1 || dirty.bid_linkers[b].price > dirty.bid_linkers[highest_bid_linker_index].price ) {
                                    highest_bid_linker_index = b;
                                }
                            }
                        }

                        // If there are no bids, the thing just ends
                        if(highest_bid_linker_index === -1) {
                            
                            // If the area has auto_market = true, we'll just extend out the ending date
                            dirty.market_linkers[i].ending_at = Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000);
                            dirty.market_linkers[i].has_update = true;

                        } else {

                            // Lets assign the area                        
                            dirty.areas[area_index].renting_player_id = dirty.bid_linkers[highest_bid_linker_index].player_id;
                            dirty.areas[area_index].price = dirty.bid_linkers[highest_bid_linker_index].price;
                            dirty.areas[area_index].is_accepted = true;
                            dirty.areas[area_index].has_change = true;
                        }


                        // Remove the bid linkers
                        for(let b = 0; b < dirty.bid_linkers.length; b++) {
                            if(dirty.bid_linkers[b] && dirty.bid_linkers.area_id === dirty.market_linkers[i].area_id) {

                                // If this linker did not win, refund them their credits
                                if(b !== highest_bid_linker_index) {
                                    
                                }

                                delete dirty.bid_linkers[b];
                            }
                        }

                        // And remove the market linker
                        delete dirty.market_linkers[i];

                    }


                }

            }
        } catch(error) {
            log(chalk.red("Error in game.tickMarketLinkers: " + error));
            console.error(error);
        }
    }

    exports.tickMarketLinkers = tickMarketLinkers;


    async function tickMonsterDecay(dirty) {


        try {

            for(let i = 0; i < dirty.monster_types.length; i++) {
                if(dirty.monster_types[i].decay_rate > 0) {

                    await decayMonsterType(dirty, i);
                }
            }

        } catch(error) {
            log(chalk.red("Error in game.tickMonsterDecay: " + error));
            console.error(error);
        }
    }

    exports.tickMonsterDecay = tickMonsterDecay;

    async function processAutopilot(dirty, autopilot) {
        try {

            log(chalk.green("\n In processAutopilot"));

            let player_index = await player.getIndex(dirty, { 'player_id': autopilot.player_id });
            let autopilot_index = dirty.autopilots.findIndex(function(obj) { return obj && obj.id === autopilot.id; });

            if(player_index === -1) {
                console.log("Could not find player");
                dirty.autopilots.splice(autopilot_index, 1);
                return;
            }

            let socket = await world.getPlayerSocket(dirty, player_index);

            if(socket === false) {
                console.log("Could not find player's socket");
                dirty.autopilots.splice(autopilot_index, 1);
                return;
            }

            // Make sure the player still has a coord id
            if(!dirty.players[player_index].coord_id) {
                console.log("Player doesn't have coord id");
                dirty.autopilots.splice(autopilot_index, 1);
                return;
            }

            let player_coord_index = await main.getCoordIndex({ 'coord_id': dirty.players[player_index].coord_id });
            console.log("Trying to find destination. Autopilot destination_tile_x, y: " + autopilot.destination_tile_x + "," + autopilot.destination_tile_y);
            let destination_coord_index = await main.getCoordIndex({ 'tile_x': autopilot.destination_tile_x, 'tile_y': autopilot.destination_tile_y });

            if(player_coord_index === -1) {
                console.log("Could not find player's coord");
                dirty.autopilots.splice(autopilot_index, 1);
                return;
            }

            if(destination_coord_index === -1) {
                console.log("Could not find destination coord");
                dirty.autopilots.splice(autopilot_index, 1);
                return;
            }


            if(player_coord_index === -1 || destination_coord_index === -1) {
                console.log("Could not find player's coord index or destination coord index");
                dirty.autopilots.splice(autopilot_index, 1);
                return;
            }

            // which whether the x or y has the biggest difference - Don't actually prioritize based on this yet
            let x_difference = Math.abs(dirty.coords[player_coord_index].tile_x - dirty.coords[destination_coord_index].tile_x);
            let y_difference = Math.abs(dirty.coords[player_coord_index].tile_y - dirty.coords[destination_coord_index].tile_y);

            if(x_difference === 0 && y_difference === 0) {
                console.log("Player is already at destination");
                dirty.autopilots.splice(autopilot_index, 1);
                return;
            }

            let next_coord_index = -1;
            let next_tile_x = dirty.coords[player_coord_index].tile_x;
            let next_tile_y = dirty.coords[player_coord_index].tile_y;
            let possible_next_moves = [];


            if(x_difference !== 0) {
                if(dirty.coords[player_coord_index].tile_x > dirty.coords[destination_coord_index].tile_x) {
                    next_tile_x--;

                } else {
                    next_tile_x++;
                }

                next_coord_index = await main.getCoordIndex({ 'tile_x': next_tile_x, 'tile_y': next_tile_y });
                if(next_coord_index !== -1) {
                    possible_next_moves.push( {'coord': dirty.coords[next_coord_index], 'coord_index': next_coord_index });
                }
            }

            // reset the next coord stuff
            next_coord_index = -1;
            next_tile_x = dirty.coords[player_coord_index].tile_x;
            next_tile_y = dirty.coords[player_coord_index].tile_y;


            if(y_difference !== 0) {
                if(dirty.coords[player_coord_index].tile_y > dirty.coords[destination_coord_index].tile_y) {
                    next_tile_y--;
                } else {
                    next_tile_y++;
                }

                next_coord_index = await main.getCoordIndex({ 'tile_x': next_tile_x, 'tile_y': next_tile_y });
                if(next_coord_index !== -1) {
                    possible_next_moves.push( {'coord': dirty.coords[next_coord_index], 'coord_index': next_coord_index });
                }
            }

            // we just want one move, but we have up to 2 potential moves!
            if(possible_next_moves.length === 0) {
                log(chalk.magenta("PATHINFINDING TIME"));
                return false;
            }

            let found_move = false;
            for(let possible_move of possible_next_moves) {

                let can_place_result = await player.canPlace(dirty, 'galaxy', dirty.coords[possible_move.coord_index], player_index);
                //let can_place_result = await main.canPlace('galaxy', dirty.coords[possible_move.coord_index], 'player', dirty.players[player_index].id);
                if(can_place_result) {
                    found_move = true;
                    console.log("Calling movement.moveGalaxy from game.processAutopilot");
                    await movement.moveGalaxy(socket, dirty, possible_move.coord_index);
                }
            }

            if(!found_move) {
                log(chalk.magenta("PATHFINDING TIME!"));
            }


        } catch(error) {
            log(chalk.red("Error in game.processAutopilot: " + error));
            console.error(error);
        }
    }

    async function tickStructure(dirty, npc_index) {

        try {

            //log(chalk.green("\nIn game.tickStructure"));

            let structure_index = dirty.structure_types.findIndex(function(obj) { return obj && obj.id === dirty.npcs[npc_index].current_structure_type_id; });

            if(structure_index === -1) {
                log(chalk.yellow("Unable to find structure: " + dirty.npcs[npc_index].current_structure_type_id));
                return;
            }


            let structure_linkers = dirty.structure_type_linkers.filter(linker => linker.structure_type_id === dirty.structure_types[structure_index].id);
            let npc_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.npcs[npc_index].planet_coord_id });


            let npc_did_action = false;
            for(let structure_linker of structure_linkers) {
                if(!npc_did_action) {
                    let tile_x = dirty.planet_coords[npc_coord_index].tile_x + structure_linker.position_x;
                    let tile_y = dirty.planet_coords[npc_coord_index].tile_y + structure_linker.position_y;
                    let planet_level = dirty.planet_coords[npc_coord_index].level + structure_linker.level;
                    //console.log("Planet level is: " + planet_level + ". planet coord level: " + dirty.planet_coords[npc_coord_index].level +
                    //    " structure_linker.level: " + structure_linker.level);
                    if(planet_level === null || planet_level === false || typeof planet_level === 'undefined') {
                        planet_level = 0;
                    }

                    let planet_coord_data = { 'planet_id': dirty.planet_coords[npc_coord_index].planet_id,
                        'planet_level': planet_level, 'tile_x': tile_x, 'tile_y': tile_y };
                    //console.log("Data we are sending to getPlanetCoordIndex: " + JSON.stringify(planet_coord_data, null, 4));
                    let checking_coord_index = await main.getPlanetCoordIndex(planet_coord_data);

                    if(checking_coord_index !== -1) {

                        //console.log("Found planet coord");

                        // Should have an object here - but something else is there
                        if(structure_linker.object_type_id && structure_linker.object_type_id !== dirty.planet_coords[checking_coord_index].object_type_id) {
                            //console.log("Should have object type id: " + structure_linker.object_type_id + " here but have object type id: " + dirty.planet_coords[checking_coord_index].object_type_id + "instead");

                            // let see if we can build it there
                            if(await game_object.canPlace(dirty, 'planet', dirty.planet_coords[checking_coord_index],
                                { 'object_type_id': structure_linker.object_type_id })) {
                                console.log("Can build it there! Lets do it");
                                if(structure_linker.object_type_id && structure_linker.object_type_id !== false) {
                                    let insert_object_type_data = { 'object_type_id': structure_linker.object_type_id,
                                        'npc_id': dirty.npcs[npc_index].id };
                                    let new_object_index = await world.insertObjectType(false, dirty, insert_object_type_data);

                                    await game_object.place(false, dirty, { 'object_index': new_object_index,
                                        'planet_coord_index': checking_coord_index });

                                    /*
                                    await world.addObjectToPlanetCoord(dirty, new_object_index, checking_coord_index);
                                     */
                                    await world.objectFindTarget(dirty, new_object_index);

                                    npc_did_action = true;
                                }
                            } else {
                                console.log("Something is blocking npc from building it there");

                                if(dirty.planet_coords[checking_coord_index].object_id) {
                                    console.log("A different object. Lets attack it");

                                    let battle_linker_data = {
                                        'attacking_id': dirty.npcs[npc_index].id, 'attacking_type': 'npc',
                                        'being_attacked_id': dirty.planet_coords[checking_coord_index].object_id, 'being_attacked_type': 'object'
                                    };
                                    world.addBattleLinker(false, dirty, battle_linker_data);
                                    npc_did_action = true;

                                } else if(dirty.planet_coords[checking_coord_index].player_id) {
                                    log(chalk.yellow("Would ask the player to move a few times"));
                                }

                            }

                        }
                        // Object that is part of this structure IS THERE! Lets see if we can do something with it
                        else if(structure_linker.object_type_id && structure_linker.object_type_id === dirty.planet_coords[checking_coord_index].object_type_id) {

                            //console.log("Object at coord matches what we want to have built");

                            let object_index = await game_object.getIndex(dirty, dirty.planet_coords[checking_coord_index].object_id);

                            if(object_index !== -1) {

                                if(dirty.objects[object_index].has_spawned_object) {

                                    let spawn_linker_index = dirty.spawn_linkers.findIndex(function(obj) { return obj && obj.id === dirty.objects[object_index].current_spawn_linker_id; });
                                    if(spawn_linker_index === -1) {
                                        log(chalk.yellow("object that is part of structure is on old spawner system"));
                                    } else {
                                        log(chalk.green("Object has a spawned object. NPC is going to harvest"));

                                        let object_type_index = dirty.object_types.findIndex(function(obj) { return obj && obj.id === dirty.objects[object_index].object_type_id; });

                                        if(object_type_index !== -1) {

                                            //console.log("Going to add spawned object to inventory");



                                            let vending_machine_object_index = dirty.objects.findIndex(function(obj) {
                                                return obj && obj.npc_id === dirty.npcs[npc_index].id && obj.object_type_id === 92; });

                                            if(vending_machine_object_index !== -1) {
                                                console.log("Found vending machine for NPC. Putting spawned object in it");


                                                let adding_to_data = { 'adding_to_type': 'object', 'adding_to_id': dirty.objects[vending_machine_object_index].id,
                                                    'object_type_id': dirty.spawn_linkers[spawn_linker_index].spawns_object_type_id,
                                                    'amount':dirty.spawn_linkers[spawn_linker_index].spawns_amount, 'price': 10 };

                                                await inventory.addToInventory(false, dirty, adding_to_data);
                                            } else {
                                                console.log("Did not find vending machine for NPC. NPC is putting in their pocket (large pockets ;) )");

                                                let adding_to_data = { 'adding_to_type': 'npc', 'adding_to_id': dirty.npcs[npc_index].id,
                                                    'object_type_id': dirty.spawn_linkers[spawn_linker_index].spawns_object_type_id,
                                                    'amount':dirty.spawn_linkers[spawn_linker_index].spawns_amount };

                                                await inventory.addToInventory(false, dirty, adding_to_data);
                                            }


                                            console.log("Set npc_did_action to true");

                                            dirty.objects[object_index].has_spawned_object = false;
                                            dirty.objects[object_index].has_change = true;
                                            //console.log("Calling sendObjectInfo from npc.tickStructure");
                                            await game_object.sendInfo(false, "planet_" + dirty.planet_coords[npc_coord_index].planet_id, dirty, object_index);

                                            return true;
                                            // TODO - not sure if we can do this at the map level so things get updated for everyone - or
                                            // TODO - access IO here to send the info to players in the same area
                                            //socket.emit('object_info_data', { 'object_id': dirty.objects[object_index].id, 'object_type_id': dirty.objects[object_index].object_type_id,
                                            //    'has_spawned_object': false });



                                            // TODO see if we increase the npc skill
                                            //if(dirty.object_types[object_type_index].spawns_object_type_id == 68) {
                                            //    dirty.players[socket.player_index].farming_skill_points++;
                                            //    dirty.players[socket.player_index].has_change = true;
                                            //
                                            //    sendPlayerStats(socket, dirty);
                                            //
                                            //}
                                        } else {
                                            console.log("Could not find object type");
                                        }
                                    }


                                }
                            }
                        } else {

                            // Not sure why we are outputing text here
                            /*
                            if(!structure_linker.object_type_id) {
                                console.log("No object type to put here");
                            } else {
                                console.log("Object type matches");
                            }

                            */
                        }
                    } else {
                        //log(chalk.yellow("Could not find planet coord in npc.tickStructures"));
                    }
                }
            }

        } catch(error) {
            log(chalk.red("Error in game.tickStructure: " + error));
            console.error(error);
        }



    }
    exports.tickStructure = tickStructure;




    // It's really important that mining linkers execute one after another, incase the thing being mined is
    // depleted mid way through a tick
    async function tickMining(dirty) {

        try {
            for(let i = 0; i < dirty.mining_linkers.length; i++) {

                if(dirty.mining_linkers[i]) {
                    await processMiningLinker(dirty, i);
                }

            }

        } catch(error) {
            log(chalk.red("Error in game.tickMining: " + error));
            console.error(error);
        }
    }

    exports.tickMining = tickMining;



    // want to avoid monster moving onto tiles that other monsters have moved onto
    // TODO IDEAS TO MAKE THIS MORE EFFICIENT
    // We know that this takes up a bunch of server time
    // What are some possible helpers? We could have the in-memory version of the monster have the planet_coord_index
    //      that the monster is currently on. Saves one lookup for each moved monster
    // We could only move some of the monsters on rooms that are currently active
    //      to do that, the easiest way might be to attach room info to the monster in memory
    async function tickMoveMonsters(dirty) {

        try {


            // idea: list of active rooms, then as we go through rooms, see if monster's room matches an active room.
            //      would need to attach a room to the monster - don't want to lookup every time

            //console.time("tickMoveMonsters");

            let room_keys = Object.keys(io.sockets.adapter.rooms);


            if(room_keys.length === 0) {
                //console.timeEnd("tickMoveMonsters");
                return;
            }


            for(let i = 0; i < dirty.monsters.length; i++) {

                if(dirty.monsters[i]) {


                    if(!dirty.monsters[i].room) {
                        log(chalk.yellow("Monster id: " + dirty.monsters[i].id + " doesn't have a room somehow. Lets try and grab it."));
                        await monster.fix(dirty, i);

                        // Lets grab it!
                        console.log("planet_coord_id: " + dirty.monsters[i].planet_coord_id + " ship coord id: " + dirty.monsters[i].ship_coord_id);


                    }

                    if(room_keys.includes(dirty.monsters[i].room)) {


                        let rand = helper.getRandomIntInclusive(1,4);

                        // Lets just move 1/4 each tick
                        if(rand === 2) {


                            let monster_type_index = main.getMonsterTypeIndex(dirty.monsters[i].monster_type_id);
                            if(monster_type_index !== -1) {

                                if(dirty.monster_types[monster_type_index].idle_movement_type !== 'none') {
                                    await monster.move(dirty, i, { 'reason': 'idle', 'monster_type_index': monster_type_index } );
                                }

                            }


                        }

                    }

                }

            }

            //console.timeEnd("tickMoveMonsters");
        } catch(error) {
            log(chalk.red("Error in game.tickMoveMonsters: " + error));
            console.error(error);
        }


    }

    exports.tickMoveMonsters = tickMoveMonsters;

    async function tickRepairs(dirty) {

        try {
            for(let i = 0; i < dirty.repairing_linkers.length; i++) {

                if(dirty.repairing_linkers[i]) {
                    await processRepairingLinker(dirty, i);
                }

            }

        } catch(error) {
            log(chalk.red("Error in game.tickRepairs: " + error));
        }
    }

    exports.tickRepairs = tickRepairs;


    async function tickResearches(dirty) {

        try {

            // New NEW way of iterating through arrays more synchronously combined with using delete instead of splice to keep array length.
            for(let i = 0; i < dirty.researches.length; i++) {
                if(dirty.researches[i]) {
                    let player_index = await player.getIndex(dirty, {'player_id': dirty.researches[i].player_id });
                    let object_type_index = dirty.object_types.findIndex(function(obj) { return obj && obj.id === dirty.researches[i].being_researched_object_type_id; });
                    let researcher_object_index = await game_object.getIndex(dirty, dirty.researches[i].researcher_object_id);

                    //console.log("have research. Current tick count: " + dirty.researches[i].current_tick_count);
                    //console.log("Object type research tick count: " + dirty.object_types[object_type_index].research_tick_count);

                    //console.log("Sending researcher_object_index: " + researcher_object_index);

                    let object_info = await game_object.getCoordAndRoom(dirty, researcher_object_index);
                    let room = object_info.room;
                    let coord_index = object_info.coord_index;


                    if(dirty.researches[i].current_tick_count < dirty.object_types[object_type_index].research_tick_count) {
                        //console.log("Not done yet. Ticking");

                        dirty.researches[i].current_tick_count++;
                        dirty.researches[i].has_change = true;

                        io.to(room).emit('research_info', { 'research': dirty.researches[i] });

                    } else {

                        let player_socket = await world.getPlayerSocket(dirty, player_index);

                        // COMPLEXITY CHECK - see if it was successful or if it failed


                        // Need some sort of algorithm to manage this complexity stuff
                        let research_level = await player.getLevel(dirty, { 'player_index': player_index, 'skill_type': 'researching',
                            'scope': object_info.scope, 'coord_index': object_info.coord_index });
                        console.log("Player research level is: " + research_level);



                        let success = world.complexityCheck(research_level, dirty.object_types[object_type_index].complexity);

                        if(success) {
                            // if the player doesn't already have a player_research_linkers entry for this, add it
                            let player_research_linker_index = dirty.player_research_linkers.findIndex(function(obj) {
                                return obj && obj.player_id === dirty.researches[i].player_id && obj.object_type_id === dirty.researches[i].being_researched_object_type_id; });

                            // gotta add it
                            if(player_research_linker_index === -1) {
                                let [result] = await (pool.query("INSERT INTO player_research_linkers(object_type_id,researches_completed,player_id)VALUES(?,1,?)",
                                    [dirty.researches[i].being_researched_object_type_id, dirty.researches[i].player_id]));
                                if(result) {
                                    let new_id = result.insertId;


                                    console.log("Got new player research linker id: " + new_id);
                                    let [rows, fields] = await (pool.query("SELECT * FROM player_research_linkers WHERE id = ?", [new_id]));
                                    if(rows[0]) {
                                        let adding_player_research_linker = rows[0];
                                        adding_player_research_linker.has_change = false;
                                        player_research_linker_index = dirty.player_research_linkers.push(adding_player_research_linker) - 1;
                                    }
                                }
                            } else {
                                // we can just increment it by one
                                dirty.player_research_linkers[player_research_linker_index].researches_completed += 1;
                                dirty.player_research_linkers[player_research_linker_index].has_change = true;

                            }




                            if(helper.notFalse(player_socket)) {
                                player_socket.emit('research_info', { 'remove': true, 'research': dirty.researches[i] });
                                player_socket.emit('player_research_linker_info', { 'player_research_linker': dirty.player_research_linkers[player_research_linker_index] });

                                player_socket.emit('chat', { 'message': dirty.object_types[object_type_index].name + " Research completed successfully", 'scope': 'system' });

                                player_socket.emit('result_info', { 'status': 'success',
                                    'text': "Researching " + dirty.object_types[object_type_index].name + " Succeeded!",
                                    'object_id': dirty.objects[researcher_object_index].id });
                            } else {
                                //console.log("This socket is not connected - for research success");
                            }

                            // remove the researches stuff
                            let [result] = await (pool.query("DELETE FROM researches WHERE id = ?", [dirty.researches[i].id]));

                            delete dirty.researches[i];

                            dirty.objects[researcher_object_index].is_active = false;
                            await game_object.sendInfo(false, room, dirty, researcher_object_index);

                            // update the player's manufacturing skill points
                            dirty.players[player_index].researching_skill_points++;
                            dirty.players[player_index].has_change = true;

                            if(helper.notFalse(player_socket)) {
                                await player.sendInfo(player_socket, false, dirty, dirty.players[player_index].id);
                            }

                        } else {



                            if(helper.notFalse(player_socket)) {
                                player_socket.emit('research_info', { 'remove': true, 'research': dirty.researches[i] });

                                // Send a system message that the research has failed
                                player_socket.emit('chat', { 'message': dirty.object_types[object_type_index].name +
                                        " Research Failed. The complexity eluded you this time", 'scope': 'system'});

                                player_socket.emit('result_info', { 'status': 'failure',
                                    'text': "Researching " + dirty.object_types[object_type_index].name + " Failed",
                                    'object_id': dirty.objects[researcher_object_index].id });
                            } else {
                                //console.log("This socket is not connected - for research failure");
                            }

                            // remove the researches stuff
                            let [result] = await (pool.query("DELETE FROM researches WHERE id = ?", [dirty.researches[i].id]));

                            delete dirty.researches[i];

                            dirty.objects[researcher_object_index].is_active = false;
                            await game_object.sendInfo(false, room, dirty, researcher_object_index);

                            // We increase skill points by the complexity of the thing we failed at
                            dirty.players[player_index].researching_skill_points += dirty.object_types[object_type_index].complexity;
                            dirty.players[player_index].has_change = true;
                        }





                    }
                }
            }


        } catch(error) {
            log(chalk.red("Error in game.tickResearches: " + error));
            console.error(error);
        }


    }
    exports.tickResearches = tickResearches;

    async function tickSalvaging(dirty) {

        //console.log("In game.tickSalvaging");

        try {
            for(let i = 0; i < dirty.active_salvagings.length; i++) {

                if(dirty.active_salvagings[i]) {
                    await processSalvaging(dirty, i);
                }

            }

        } catch(error) {
            log(chalk.red("Error in game.tickMining: " + error));
        }
    }

    exports.tickSalvaging = tickSalvaging;


    /**
     * 
     * @param {Object} dirty 
     * @param {Object} spawner
     * @param {number} spawner_index
     * @param {string} spawner_type - object or monster
     */
    async function processSpawner(dirty, spawner, spawner_index, spawner_type) {
        try {

            // We are set on a spawn linker that takes multiple ticks to complete
            if(spawner.current_spawn_linker_id !== 0) {
                let spawn_linker_index = dirty.spawn_linkers.findIndex(function(obj) { return obj && obj.id === spawner.current_spawn_linker_id; });

                if(spawn_linker_index === -1) {
                    log(chalk.yellow("Could not find a spawn_linker with id: " + spawner.current_spawn_linker_id));
                    return false;
                }

                // increment our object tick count;
                if(helper.isFalse(spawner.spawner_tick_count)) {
                    spawner.spawner_tick_count = 1;
                } else {
                    spawner.spawner_tick_count++;
                }
                
                spawner.has_change = true;


                // Finish the linker!
                if(spawner.spawner_tick_count >= dirty.spawn_linkers[spawn_linker_index].ticks_required) {

                    let finish_spawn_linker_data = { 'spawn_linker_index': spawn_linker_index };
                    if(spawner_type === 'object') {
                        finish_spawn_linker_data.object_index = spawner_index;
                    } else if(spawner_type === 'monster') {
                        finish_spawn_linker_data.monster_index = spawner_index;
                    }

                    finishSpawnLinker(dirty, finish_spawn_linker_data);

                    spawner.current_spawn_linker_id = false;
                    spawner.spawner_tick_count = 0;
                }
            }

        } catch(error) {
            log(chalk.red("Error in game.processSpawner: " + error));
            console.error(error);
        }
    }

    exports.processSpawner = processSpawner;


    async function tickSpawners(dirty) {

        try {
            //console.time("tickSpawners");
            //console.time("originalTickSpawners");
            //log(chalk.green("In game.tickObjectSpawners"));


            let spawning_object_type_ids = [];
            let spawning_monster_type_ids = [];
            let debug_object_type_id = 0;
            let debug_monster_type_ids = [];
            let debug_monster_type_id = 0;

            for(let i = 0; i < dirty.spawn_linkers.length; i++) {

                // This will result in some duplicate entries in the spawning_object_types array - shouldn't be an issue
                // beyond the array just being longer than it should
                if(dirty.spawn_linkers[i].object_type_id) {
                    spawning_object_type_ids.push(dirty.spawn_linkers[i].object_type_id);
                }

                if(helper.notFalse(dirty.spawn_linkers[i].monster_type_id)) {
                    spawning_monster_type_ids.push(dirty.spawn_linkers[i].monster_type_id);
                }
            }


            //console.time("tickSpawners.objects");
            // Go through our objects
            for(let i = 0; i < dirty.objects.length; i++) {

                if(dirty.objects[i] && dirty.objects[i].object_type_id === debug_object_type_id) {
                    console.log("Ticking spawning stuff for object id: " + dirty.objects[i].id);
                }

                // We have a has_spawned_object limit here, since we can't hold multiple things in has_spawned_object
                if(dirty.objects[i] &&
                    (helper.isFalse(dirty.objects[i].has_spawned_object)) &&
                    spawning_object_type_ids.indexOf(dirty.objects[i].object_type_id) !== -1) {

                    // We are set on a spawn linker that takes multiple ticks to complete
                    if( helper.notFalse(dirty.objects[i].current_spawn_linker_id) ) {

                        if(dirty.objects[i].object_type_id === debug_object_type_id) {
                            console.log("Object already has a spawn linker id!");
                        }

                        await processSpawner(dirty, dirty.objects[i], i, 'object');

                    }
                    // Object doesn't have an existing spawn_linker that it is working on
                    else {

                        if(dirty.objects[i].object_type_id === debug_object_type_id) {
                            console.log("Object does not have a current_spawn_linker_id");
                        }

                        await objectSpawn(dirty, i, debug_object_type_id);

                    }



                } else {
                    if(dirty.objects[i] && dirty.objects[i].object_type_id === debug_object_type_id) {

                        if(!helper.isFalse(dirty.objects[i].has_spawned_object)) {
                            console.log("Already has spawned object");
                        }

                        if(spawning_object_type_ids.indexOf(dirty.objects[i].object_type_id) === -1) {
                            console.log("Not found in our spawning object type ids array");
                        }



                    }
                }
            }

            //console.timeEnd("tickSpawners.objects");

            //console.time("tickSpawners.monsters");
            



            // Go through our monsters
            for(let i = 0; i < dirty.monsters.length; i++) {



                // We have a has_spawned_object limit here, since we can't hold multiple things in has_spawned_object
                if(dirty.monsters[i] && spawning_monster_type_ids.indexOf(dirty.monsters[i].monster_type_id) !== -1 &&
                    (!dirty.monsters[i].has_spawned_object || dirty.monsters[i].has_spawned_object === 0)
                    ) {

                    if(debug_monster_type_ids.indexOf(dirty.monsters[i].mosnter_type_id) !== -1) {
                        console.log("Trying to spawn something for monster id: " + dirty.monsters[i].id);
                    }


                    // We are set on a spawn linker that takes multiple ticks to complete
                    if( helper.notFalse(dirty.monsters[i].current_spawn_linker_id) ) {

                        if(debug_monster_type_ids.indexOf(dirty.monsters[i].mosnter_type_id) !== -1) {
                            console.log("Monster already has a spawn linker id!");
                        }

                        await processSpawner(dirty, dirty.monsters[i], i, 'monster');

                        /*
                        let spawn_linker_index = dirty.spawn_linkers.findIndex(function(obj) { return obj && obj.id === dirty.monsters[i].current_spawn_linker_id; });

                        if(spawn_linker_index === -1)  {
                            log(chalk.yellow("Could not find the spawn_linker that monster id: " + dirty.monsters[i].id + " has. current_spawn_linker_id: " + dirty.monsters[i].current_spawn_linker_id));
                        } else {
                            // increment our object tick count;
                            dirty.monsters[i].spawner_tick_count++;
                            dirty.monsters[i].has_change = true;

                            // Finish the linker!
                            if(dirty.monsters[i].spawner_tick_count >= dirty.spawn_linkers[spawn_linker_index].ticks_required) {

                                finishSpawnLinker(dirty, { 'monster_index': i, 'spawn_linker_index': spawn_linker_index });

                                dirty.monsters[i].current_spawn_linker_id = false;
                                dirty.monsters[i].spawner_tick_count = 0;
                            }
                        }
                        */



                    }
                    // Monster doesn't have an existing spawn_linker that it is working on
                    else {

                        if(debug_monster_type_ids.indexOf(dirty.monsters[i].mosnter_type_id) !== -1) {
                            console.log("No spawn linker id");
                        }


                        let monster_type_index = main.getMonsterTypeIndex(dirty.monsters[i].monster_type_id);

                        // Grab a random spawn linker
                        let rarity = helper.rarityRoll();
                        let hp_percent = dirty.monsters[i].current_hp / dirty.monster_types[monster_type_index].hp * 100;

                        let monster_type_spawn_linkers = dirty.spawn_linkers.filter(linker => linker.monster_type_id === dirty.monsters[i].monster_type_id &&
                            linker.rarity <= rarity && hp_percent >= linker.minimum_hp_percent && hp_percent <= linker.maximum_hp_percent);


                        if(monster_type_spawn_linkers.length > 0) {

                            let chosen_linker = monster_type_spawn_linkers[Math.floor(Math.random()*monster_type_spawn_linkers.length)];

                            //console.log("Chose spawn linker id: " + chosen_linker.id);

                            if(chosen_linker.ticks_required > 1) {
                                dirty.monsters[i].current_spawn_linker_id = chosen_linker.id;
                                dirty.monsters[i].spawner_tick_count = 1;
                                dirty.monsters[i].has_change = true;
                            }
                            // We finish it
                            else {
                                // Gotta get the real spawn linker back
                                let spawn_linker_index = dirty.spawn_linkers.findIndex(function(obj) { return obj && obj.id === chosen_linker.id; });
                                await finishSpawnLinker(dirty, { 'monster_index': i, 'spawn_linker_index': spawn_linker_index });

                            }


                        } else {
                            if(dirty.monsters[i].id === 6943) {
                                console.log("Didn't find a spawn linker");
                            }
                        }

                    }



                }
            }

            //console.timeEnd("tickSpawners.monsters");

            //console.timeEnd("originalTickSpawners");


            for(let i = 0; i < dirty.ship_coords.length; i++) {

                if(dirty.ship_coords[i] && dirty.ship_coords[i].spawns_monster_type_id && helper.isFalse(dirty.ship_coords[i].spawned_monster_id)) {
                    monster.spawn(dirty, dirty.ship_coords[i].spawns_monster_type_id, { 'ship_coord_index': i });
                }

            }



            //console.timeEnd("tickSpawners");

        } catch(error) {
            log(chalk.red("Error in game.tickSpawners: " + error));
            console.error(error);
        }



    }

    exports.tickSpawners = tickSpawners;


    async function tickTraps(dirty) {

        try {
            // get our object types that are traps
            let trap_object_types = dirty.object_types.filter(object_type => object_type.is_trap === true);

            trap_object_types.forEach(function(trap_object_type) {
                // get objects of this trap type with a planet coord id
                let trap_objects = dirty.objects.findIndex(function(obj) {
                    return obj && obj.object_type_id === trap_object_type.id && obj.planet_coord_id; });

                trap_objects.forEach(async function(trap_object) {

                    try {
                        // If the trap object doesn't already have something in it's inventory, add something!
                        let inventory_item_index = dirty.inventory_items.findIndex(function(obj) {
                            return obj && obj.owned_by_object_id === trap_object.id; });

                        // Nothing in this trap yet - lets find something to spawn
                        if(inventory_item_index === -1) {
                            // lets grab the rest of what we need ( the planet type the trap is on ) and see what we spawn
                            let planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': trap_object.planet_coord_id });
                            if(planet_coord_index !== -1) {
                                let planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.planet_coords[planet_coord_index].planet_id, 'source': 'game.tickTraps' });
                                if(planet_index !== -1) {

                                    let trap_linkers = dirty.trap_linkers.filter(trap_linker => trap_linker.object_type_id === trap_object.object_type_id);
                                    if(trap_linkers.length > 0) {
                                        let trap_linker = trap_linkers[Math.floor(Math.random() * trap_linkers.length)];
                                        console.log("Going to trap object_type_id: " + trap_linker.trapped_object_type_id);

                                        let adding_to_data = { 'adding_to_type':'object', 'adding_to_id':trap_object.id,
                                            'object_type_id':dirty.object_types[trapped_object_type_id].id, 'amount':1};

                                        await inventory.addToInventory(false, dirty, adding_to_data);

                                        // send this to anyone in the room
                                        await inventory.sendInventory(false, "planet_" + dirty.planets[planet_index].id, dirty, 'object', trap_object.id);

                                        console.log("Trapped!");


                                    }

                                }
                            }

                        }
                    } catch(error) {
                        log(chalk.red("Error in game.tickTraps - trap_object: " + error));
                    }


                });
            });
        } catch(error) {
            log(chalk.red("Error in game.tickTraps: " + error));
        }



    }

    exports.tickTraps = tickTraps;


    /**
     * @param {Object} socket
     * @param {Object} dirty
     * @param {Object} data
     * @param {number=} data.object_id
     * @param {number=} data.monster_id
     * @param {number=} data.planet_coord_id
     * @param {number=} data.ship_coord_id
     * @param {number=} data.coord_id
     */
    async function pickUp(socket, dirty, data) {

        try {

            let debug_object_type_ids = [];

            //log(chalk.green("Got pick up request"));
            //console.log(data);


            if(typeof socket.player_index === "undefined" || socket.player_index === -1) {
                log(chalk.yellow("Socket doesn't have a player"));
                return false;
            }


            let sql;
            let inserts;
            let object_index = -1;
            let object_type_index = -1;
            let monster_index = -1;
            let monster_type_index = -1;
            let scope = "";

            // Make sure the data for picking up an object is valid
            if(data.object_id) {
                data.object_id = parseInt(data.object_id);

                if(isNaN(data.object_id)) {
                    log(chalk.yellow("Invalid pickup object_id"));
                    return false;
                }

                object_index = await game_object.getIndex(dirty, data.object_id);

                if(object_index === -1) {
                    log(chalk.yellow("No object sss"));
                    return false;
                }
                object_type_index = main.getObjectTypeIndex(dirty.objects[object_index].object_type_id);

                if(object_type_index === -1) {
                    log(chalk.yellow("Can't find object type"));
                    return false;
                }
            }

            if(data.monster_id) {
                data.monster_id = parseInt(data.monster_id);

                if(isNaN(data.monster_id)) {
                    log(chalk.yellow("Invalid pickup monster_id"));
                    return false;
                }

                monster_index = await monster.getIndex(dirty, data.monster_id);

                if(monster_index === -1) {
                    log(chalk.yellow("No monster sss"));
                    return false;
                }
                monster_type_index = main.getMonsterTypeIndex(dirty.monsters[monster_index].monster_type_id);

                if(monster_type_index === -1) {
                    log(chalk.yellow("Can't find monster type"));
                    return false;
                }
            }


            let player_info = await player.getCoordAndRoom(dirty, socket.player_index);



            // and lets get the coord of the thing we are picking up ( object or object type )
            let picking_up_coord_index = -1;
            if(object_index !== -1) {

                if(dirty.objects[object_index].planet_coord_id) {
                    scope = 'planet';
                } else if(dirty.objects[object_index].ship_coord_id) {
                    scope = 'ship';
                } else if(dirty.objects[object_index].coord_id) {
                    scope = 'galaxy';
                }

                picking_up_coord_index = await game_object.getCoordIndex(dirty, object_index, scope);


            } else if(monster_index !== -1) {
                if(dirty.monsters[monster_index].planet_coord_id) {
                    scope = 'planet';
                } else if(dirty.monsters[monster_index].ship_coord_id) {
                    scope = 'ship';
                } else if(dirty.monsters[monster_index].coord_id) {
                    scope = 'galaxy';
                }

                picking_up_coord_index = await monster.getCoordIndex(dirty, monster_index, scope);
            } 
            // We were sent in just the coord. So we are probably trying to pickup an object
            else {

                if(typeof data.planet_coord_id !== 'undefined') {
                    scope = 'planet';
                    data.planet_coord_id = parseInt(data.planet_coord_id);
                    picking_up_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': data.planet_coord_id });
                } else if(typeof data.ship_coord_id !== 'undefined') {
                    scope = 'ship';
                    data.ship_coord_id = parseInt(data.ship_coord_id);
                    picking_up_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': data.ship_coord_id });
                } else if(typeof data.coord_id !== 'undefined') {
                    scope = 'galaxy';
                    data.coord_id = parseInt(data.coord_id);
                    picking_up_coord_index = await main.getCoordIndex({ 'coord_id': data.coord_id });
                }

            }

            if(picking_up_coord_index === -1) {
                log(chalk.yellow("Could not find coord to pick up from"));
                return false;
            }



            let can_interact = false;
            if(scope === "planet") {
                can_interact = await canInteract(socket, dirty, player_info.scope, dirty.planet_coords[picking_up_coord_index]);
            } else if(scope === "ship") {
                console.log("Checking in ship");
                can_interact = await canInteract(socket, dirty, player_info.scope, dirty.ship_coords[picking_up_coord_index]);
            } else if(scope === "galaxy") {
                console.log("Checking in galaxy. player_info.scope: " + player_info.scope);
                can_interact = await canInteract(socket, dirty, player_info.scope, dirty.coords[picking_up_coord_index]);
            }


            if(!can_interact) {
                //log(chalk.yellow("Player cannot interact with that coord"));
                socket.emit('result_info', { 'status': 'failure', 'text': "Too far away" });
                return false;
            }


            /*************** OBJECT HAS SPAWNED OBJECT ****************/
            if(object_index !== -1 && dirty.objects[object_index].has_spawned_object) {

                if(debug_object_type_ids.indexOf(dirty.objects[object_index].object_type_id) !== -1) {
                    console.log("Object has_spawned_object!");
                }

                // Object is still using the old system. Lets reset it
                if(!dirty.objects[object_index].current_spawn_linker_id) {

                    if(debug_object_type_ids.indexOf(dirty.objects[object_index].object_type_id) !== -1) {
                        console.log("Object is using the old spawning system. Resetting");
                    }

                    dirty.objects[object_index].has_spawned_object = false;
                    dirty.objects[object_index].current_spawn_linker_id = false;
                    dirty.objects[object_index].has_change = true;
                    let object_info = await game_object.getCoordAndRoom(dirty, object_index);
                    await game_object.sendInfo(false, object_info.room, dirty, object_index);
                    return false;
                }

                let spawn_linker_index = dirty.spawn_linkers.findIndex(function(obj) { return obj && obj.id === dirty.objects[object_index].current_spawn_linker_id; });

                if(spawn_linker_index === -1) {
                    log(chalk.yellow("Could not find spawn linker"));
                    return false;
                }


                //console.log("Object has a spawned object");
                //console.log("Going to add spawned object to inventory");


                let adding_to_data = { 'adding_to_type': 'player', 'adding_to_id': dirty.players[socket.player_index].id,
                    'object_type_id': dirty.spawn_linkers[spawn_linker_index].spawns_object_type_id, 'amount':dirty.spawn_linkers[spawn_linker_index].spawns_amount };

                await inventory.addToInventory(socket, dirty, adding_to_data);

                dirty.objects[object_index].has_spawned_object = false;
                dirty.objects[object_index].current_spawn_linker_id = false;
                dirty.objects[object_index].has_change = true;

                // If the object type has a frame count, we can set it back to active
                if(dirty.object_types[object_type_index].is_active_frame_count > 1) {
                    dirty.objects[object_index].is_active = true;
                }

                // TODO - not sure if we can do this at the map level so things get updated for everyone - or
                // TODO - access IO here to send the info to players in the same area
                //console.log("Calling sendObjectInfo from game.pickUp");
                await game_object.sendInfo(false, player_info.room, dirty, object_index);
                //socket.emit('object_info_data', { 'object_id': dirty.objects[object_index].id, 'object_type_id': dirty.objects[object_index].object_type_id,
                //    'has_spawned_object': false });


                // see if we increase the player skill
                if(dirty.spawn_linkers[spawn_linker_index].spawns_object_type_id === 68) {
                    dirty.players[socket.player_index].farming_skill_points++;
                    dirty.players[socket.player_index].has_change = true;

                    await sendPlayerStats(socket, dirty);

                }




                return;

            }


            /*************** MONSTER HAS SPAWNED OBJECT ****************/
            if(monster_index !== -1 && dirty.monsters[monster_index].has_spawned_object) {

                //console.log("Object has a spawned object");
                //console.log("Going to add spawned object to inventory");
                // Object is still using the old system. Lets reset it
                if(!dirty.monsters[monster_index].current_spawn_linker_id) {
                    dirty.monsters[monster_index].has_spawned_object = false;
                    dirty.monsters[monster_index].current_spawn_linker_id = false;
                    dirty.monsters[monster_index].has_change = true;
                    return false;
                }

                // Since the monster has a spawned object, it should also have a current_spawn_linker_id
                let spawn_linker_index = dirty.spawn_linkers.findIndex(function(obj) { return obj && obj.id === dirty.monsters[monster_index].current_spawn_linker_id; });

                if(spawn_linker_index === -1) {
                    log(chalk.yellow("Could not find spawn linker"));
                    return false;
                }


                let adding_to_data = { 'adding_to_type': 'player', 'adding_to_id': dirty.players[socket.player_index].id,
                    'object_type_id': dirty.spawn_linkers[spawn_linker_index].spawns_object_type_id, 'amount':dirty.spawn_linkers[spawn_linker_index].spawns_amount };

                inventory.addToInventory(socket, dirty, adding_to_data);

                dirty.monsters[monster_index].has_spawned_object = false;
                dirty.monsters[monster_index].current_spawn_linker_id = false;
                dirty.monsters[monster_index].has_change = true;

                await monster.sendInfo(false, player_info.room, dirty, { 'monster_index': monster_index });

                dirty.players[socket.player_index].farming_skill_points++;
                dirty.players[socket.player_index].has_change = true;

                sendPlayerStats(socket, dirty);

                // The monster has a chance of attacking us ( it felt the harvest, or was angered by it or something)
                // 100 is 100% chance, 50 is 50% chance
                let attack_chance = dirty.monster_types[monster_type_index].attack_chance_on_harvest;

                let player_farming_level = await player.getLevel(dirty, { 'player_index': socket.player_index, 'skill_type': 'farming' });

                attack_chance = attack_chance - player_farming_level;
                let rand = helper.getRandomIntInclusive(1,100);

                // Monster attacks as a result
                if(rand < attack_chance) {

                    // Make sure the monster isn't already attacking something
                    let existing_battle_linker_index = dirty.battle_linkers.findIndex(function(obj) { return obj &&
                        obj.attacking_id === dirty.monsters[monster_index].id && obj.attacking_type === 'monster'; });

                    if(existing_battle_linker_index === -1) {
                        let battle_linker_data = {
                            'id': uuidv1(),
                            'attacking_id': dirty.monsters[monster_index].id, 'attacking_type': 'monster', 'being_attacked_id': dirty.players[socket.player_index].id,
                            'being_attacked_type': 'player',
                            'room': player_info.room,
                            'turn_count': 0
                        };

                        if(socket !== false) {
                            battle_linker_data.being_attacked_socket_id = socket.id;
                        }

                        let new_battle_linker_index = dirty.battle_linkers.push(battle_linker_data) - 1;
                        if(socket) {
                            socket.emit('battle_linker_info', { 'battle_linker': dirty.battle_linkers[new_battle_linker_index] });
                        }
                    }



                }




                return;

            }


            /********************** OBJECT THAT WE CAN PICK UP *******************/
            // see if it's an object that can be picked up

            if(object_index !== -1 && dirty.object_types[object_type_index].can_pick_up) {

                let adding_to_data = { 'adding_to_type': 'player', 'adding_to_id': socket.player_id,
                    'object_id': dirty.objects[object_index].id, 'amount': 1 };
                inventory.addToInventory(socket, dirty, adding_to_data);

                if(player_info.scope === 'planet') {
                    await main.updateCoordGeneric(socket, { 'planet_coord_index': picking_up_coord_index, 'object_id': false });

                    dirty.objects[object_index].planet_coord_id = false;
                    dirty.objects[object_index].planet_coord_index = -1;
                    dirty.objects[object_index].has_change = true;
                } else if(player_info.scope === 'ship') {
                    await main.updateCoordGeneric(socket, { 'ship_coord_index': picking_up_coord_index, 'object_id': false });
                    
                    dirty.objects[object_index].ship_coord_id = false;
                    dirty.objects[object_index].ship_coord_index = -1;
                    dirty.objects[object_index].has_change = true;
                } else if(player_info.scope === 'galaxy') {
                    await main.updateCoordGeneric(socket, { 'coord_index': picking_up_coord_index, 'object_id': false });
                    
                    dirty.objects[object_index].coord_id = false;
                    dirty.objects[object_index].coord_index = -1;
                    dirty.objects[object_index].has_change = true;
                }


                return;

            }


            /******************** JUST PICKING UP AN OBJECT TYPE ***************/

            let amount = 0;
            let update_coord_data = { 'object_type_id': false };
            let check_spawned_event_id = 0;
            if(player_info.scope === 'planet') {

                object_type_index = main.getObjectTypeIndex(dirty.planet_coords[picking_up_coord_index].object_type_id);
                amount = dirty.planet_coords[picking_up_coord_index].object_amount;
                update_coord_data.planet_coord_index = picking_up_coord_index;

                if(dirty.planet_coords[picking_up_coord_index].spawned_event_id) {
                    check_spawned_event_id = dirty.planet_coords[picking_up_coord_index].spawned_event_id;
                    update_coord_data.spawned_event_id = false;

                }

                
            } else if(player_info.scope === 'ship') {
                object_type_index = main.getObjectTypeIndex(dirty.ship_coords[picking_up_coord_index].object_type_id);
                amount = dirty.ship_coords[picking_up_coord_index].object_amount;
                update_coord_data.ship_coord_index = picking_up_coord_index;

                if(dirty.ship_coords[picking_up_coord_index].spawned_event_id) {
                    check_spawned_event_id = dirty.ship_coords[picking_up_coord_index].spawned_event_id;
                    update_coord_data.spawned_event_id = false;

                }

            } else if(player_info.scope === 'galaxy') {
                object_type_index = main.getObjectTypeIndex(dirty.coords[picking_up_coord_index].object_type_id);
                amount = dirty.coords[picking_up_coord_index].object_amount;
                update_coord_data.coord_index = picking_up_coord_index;

                if(dirty.coords[picking_up_coord_index].spawned_event_id) {
                    check_spawned_event_id = dirty.coords[picking_up_coord_index].spawned_event_id;
                    update_coord_data.spawned_event_id = false;

                }
            }

            if(object_type_index === -1 ){
                log(chalk.yellow("Couldn't get object type"));
                return false;
            }

            if(!dirty.object_types[object_type_index].can_pick_up) {
                log(chalk.yellow("That object type cannot be picked up: " + dirty.object_types[object_type_index].can_pick_up +
                    " object_type_id: " + dirty.object_types[object_type_index].id));
                return false;
            }


            let adding_to_data = { 'adding_to_type': 'player', 'adding_to_id': socket.player_id,
                'object_type_id': dirty.object_types[object_type_index].id, 'amount': amount };

            inventory.addToInventory(socket, dirty, adding_to_data);


            await main.updateCoordGeneric(socket, update_coord_data);

            if(check_spawned_event_id !== 0) {
                event.checkSpawnedEvent(dirty, check_spawned_event_id);
            }

        } catch(error) {
            log(chalk.red("Error in game.pickUp: " + error));
            console.error(error);

        }


    }
    exports.pickUp = pickUp;




    /**
     * 
     * @param {Object} socket 
     * @param {Object} dirty 
     * @param {Object} data 
     * @param {number} data.inventory_item_id
     * @param {number=} data.planet_coord_id
     * @param {number=} data.ship_coord_id
     * 
     */
    async function plant(socket, dirty, data) {

        try {

            let planting_scope = '';
            let coord_index = -1;
            let planting_coord;
            let player_index = await player.getIndex(dirty, {'player_id':socket.player_id});

            if(player_index === -1) {
                log(chalk.yellow("Could not get player in game.plant"));
                return false;
            }

            let inventory_item_index = await main.getInventoryItemIndex(data.inventory_item_id);

            if(inventory_item_index === -1) {
                console.log("Could not find inventory item");
                return false;
            }

            console.log("Player is planting inventory id: " + data.inventory_item_id);

            let object_type_index = main.getObjectTypeIndex(dirty.inventory_items[inventory_item_index].object_type_id);
    
            if(!dirty.object_types[object_type_index].is_plantable) {
                return false;
            }

            if(dirty.inventory_items[inventory_item_index].player_id !== socket.player_id) {
                return false;
            }

            if(data.planet_coord_id) {
                console.log("Planting on planet");
                coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': data.planet_coord_id });
                if(coord_index === -1) {
                    log(chalk.yellow("Could not find the coord the player is planting on"));
                    return false;
                }

                planting_scope = 'planet';
                planting_coord = dirty.planet_coords[coord_index];
            } else if(data.ship_coord_id) {
                console.log("Planting on ship");
                coord_index = await main.getShipCoordIndex({ 'ship_coord_id': data.ship_coord_id });
                if(coord_index === -1) {
                    log(chalk.yellow("Could not find the coord the player is planting on"));
                    return false;
                }
                planting_scope = 'ship';
                planting_coord = dirty.ship_coords[coord_index];
            }


            let can_place_result = await game_object.canPlace(dirty, planting_scope, planting_coord,
            { 'object_type_id': dirty.inventory_items[inventory_item_index].object_type_id });

            if(!can_place_result) {
                console.log("Can't place there");
                return false;
            }

            let inserting_object_type_data = {
                'object_type_id': dirty.object_types[object_type_index].planted_object_type_id };

            let new_object_index = await world.insertObjectType(socket, dirty, inserting_object_type_data);


            if(planting_scope === 'planet') {
                await game_object.place(false, dirty, { 'object_index': new_object_index,
                'planet_coord_index': coord_index });
            } else if(planting_scope === 'ship') {
                await game_object.place(false, dirty, { 'object_index': new_object_index,
                'ship_coord_index': coord_index });
            }


            //await world.addObjectToPlanetCoord(dirty, new_object_index, planet_coord_index);
            await world.objectFindTarget(dirty, new_object_index);


            socket.emit('chat', { 'message': socket.player_name + ' planted ' + dirty.object_types[object_type_index].name});

            let remove_inventory_data = { 'player_index': socket.player_index, 'inventory_item_id': dirty.inventory_items[inventory_item_index].id,
                'amount': 1 };
            await inventory.removeFromInventory(socket, dirty, remove_inventory_data);


            dirty.players[player_index].farming_skill_points = dirty.players[player_index].farming_skill_points + 1;
            dirty.players[player_index].has_change = true;

        } catch(error) {
            console.log("Error in game.plant: " + error);
            console.error(error);
        }


    }
    exports.plant = plant;

    //  data:   area_id   |   price   |   rent_to_player_name
    async function rentArea(socket, dirty, data) {
        try {
            console.log("Got rent area data. area id: " + data.area_id + " rent_to_player: " + data.rent_to_player_name + " price: " + data.price);

            data.area_id = parseInt(data.area_id);

            // Make sure the socket player is the guy that owns it
            let area_index = await main.getAreaIndex(data.area_id);

            if(area_index === -1) {
                console.log("Could not find area");
                return false;
            }

            if(dirty.areas[area_index].owner_id !== socket.player_id) {
                log(chalk.yellow("Not that player's to manage"));
                return false;
            }

            // Find the renting player
            let renting_player_index = await player.getIndex(dirty, { 'name': data.rent_to_player_name });

            if(renting_player_index === -1) {
                log(chalk.yellow("Could not find player to rent to"));
                return false;
            }


            dirty.areas[area_index].renting_player_id = dirty.players[renting_player_index].id;
            dirty.areas[area_index].price = data.price;
            dirty.areas[area_index].is_accepted = false;
            dirty.areas[area_index].has_change = true;

            // Send the area info to the owner
            socket.emit('area_info', { 'area': dirty.areas[area_index] });

            // And the renting player if they are online
            let renting_player_socket = await world.getPlayerSocket(dirty, renting_player_index);

            if(renting_player_socket) {
                renting_player_socket.emit('area_info', { 'area': dirty.areas[area_index] });
            }

        } catch(error) {
            log(chalk.red("Error in game.rentArea: " + error));
            console.error(error);
        }
    }



    // Player is repairing something. Can be an object, object type, or floor type.
    //      DATA PASSED IN:     coord_id
    async function repair(socket, dirty, data) {
        try {

            console.log("Player is trying to repair coord with id: " + data.coord_id );
            data.coord_id = parseInt(data.coord_id);


            if(typeof socket.player_index === 'undefined') {
                log(chalk.yellow("Socket doesn't have a player index: " + socket.player_index));
                return false;
            }


            if(isNaN(data.coord_id)) {
                log(chalk.yellow("Invalid data.coord_id"));
                return false;
            }


            let coord_index = -1;

            if(dirty.players[socket.player_index].planet_coord_id) {
                coord_index = await main.getPlanetCoordIndex({'planet_coord_id': data.coord_id});

                if(coord_index === -1) {
                    log(chalk.yellow("Could not find that planet coord"));
                    return false;
                }

                if(!canInteract(socket, dirty, 'planet_coord', dirty.planet_coords[coord_index])) {
                    console.log("Player cannot interact with that planet coord");
                    return false;
                }

                // see if there's an existing repairing_linker
                let repairing_index = dirty.repairing_linkers.findIndex(function(obj) { return obj
                    && obj.player_id === dirty.players[socket.player_index].id && obj.planet_coord_id === dirty.planet_coords[coord_index].id; });

                if(repairing_index !== -1) {
                    console.log("Already have repair going");
                    return false;
                }

            } else if(dirty.players[socket.player_index].ship_coord_id) {
                coord_index = await main.getShipCoordIndex({'ship_coord_id': data.coord_id});

                if(coord_index === -1) {
                    log(chalk.yellow("Could not find that ship coord"));
                    return false;
                }

                if(!canInteract(socket, dirty, 'ship_coord', dirty.ship_coords[coord_index])) {
                    console.log("Player cannot interact with that ship coord");
                    return false;
                }

                // see if there's an existing repairing_linker
                let repairing_index = dirty.repairing_linkers.findIndex(function(obj) { return obj
                    && obj.player_id === dirty.players[socket.player_index].id && obj.ship_coord_id === dirty.ship_coords[coord_index].id; });

                if(repairing_index !== -1) {
                    console.log("Already have repair going");
                    return false;
                }
            } else {
                log(chalk.yellow("Unsupported game.repair state"));
                return false;
            }


            let repairing_linker = {
                'id': uuidv1(),
                'player_id': dirty.players[socket.player_index].id,
                'player_index': socket.player_index,
                'player_socket_id': socket.id
            };

            if(dirty.players[socket.player_index].planet_coord_id) {
                repairing_linker.planet_coord_id = dirty.planet_coords[coord_index].id;
                repairing_linker.planet_coord_index = coord_index;
            } else if(dirty.players[socket.player_index].ship_coord_id) {
                repairing_linker.ship_coord_id = dirty.ship_coords[coord_index].id;
                repairing_linker.ship_coord_index = coord_index;
            }

            let repairing_index = dirty.repairing_linkers.push(repairing_linker) - 1;

            console.log("Pushed repairing linker");

            socket.emit('repairing_linker_info', { 'repairing_linker': dirty.repairing_linkers[repairing_index] });

            console.log("Sent new repairing linker info to client");



        } catch(error) {
            log(chalk.red("Error in game.repair: " + error));
        }

    }

    exports.repair = repair;


    async function repairStop(socket, dirty, data) {
        try {
            let repairing_linker_index = dirty.repairing_linkers.findIndex(function(obj) { return obj && obj.player_id === socket.player_id &&
                obj.ship_coord_id === parseInt(data.coord_id); });

            if(repairing_linker_index === -1) {
                return false;
            }

            socket.emit('repairing_linker_info', { 'remove': true, 'repairing_linker': dirty.repairing_linkers[repairing_linker_index] });

            delete dirty.repairing_linkers[repairing_linker_index];
        } catch(error) {
            log(chalk.red("Error in game.repairStop: " + error));
        }
    }

    exports.repairStop = repairStop;


    async function removeAssemblyItems(socket, dirty, type, type_id) {

        try {

            for(let i = 0; i < dirty.assembly_linkers.length; i++) {

                let do_remove = false;
                if(type === 'object_type' && dirty.assembly_linkers[i].required_for_object_type_id &&
                    dirty.assembly_linkers[i].required_for_object_type_id === type_id) {
                    do_remove = true;

                    let remove_inventory_data = { 'player_index': socket.player_index, 'removing_object_type_id': dirty.assembly_linkers[i].object_type_id,
                        'amount': dirty.assembly_linkers[i].amount };
                    inventory.removeFromInventory(socket, dirty, remove_inventory_data);
                }

                if(type === 'floor_type' && dirty.assembly_linkers[i].required_for_floor_type_id &&
                    dirty.assembly_linkers[i].required_for_floor_type_id === type_id) {
                    do_remove = true;

                    let remove_inventory_data = { 'player_index': socket.player_index, 'removing_object_type_id': dirty.assembly_linkers[i].object_type_id,
                        'amount': dirty.assembly_linkers[i].amount };
                    inventory.removeFromInventory(socket, dirty, remove_inventory_data);
                }

                if(do_remove) {

                }
            }



        } catch(error) {
            log(chalk.red("Error in game.removeAssemblyItem: " + error));
            console.error(error);
        }



    }


    //
    async function replaceFloor(socket, dirty, data) {


        try {


            let dropping_inventory_item_id = parseInt(data.inventory_item_id);
            let x = parseInt(data.x);
            let y = parseInt(data.y);

            log(chalk.green("\nUsing inventory item id: " + dropping_inventory_item_id + " to replace floor at " + x + "x" + y));

            let inventory_item_index = await main.getInventoryItemIndex(dropping_inventory_item_id);

            if(inventory_item_index === -1) {
                log(chalk.yellow("Couldn't get inventory item for replaceFloor"));
                return false;
            }

            let player_index = await player.getIndex(dirty, {'player_id':socket.player_id});

            if(player_index === -1) {
                log(chalk.yellow("Could not get player in game.replaceFloor"));
                return false;
            }

            //console.log("Got inventory_item_index");

            let temp_coord = false;
            let coord_index = false;
            let scope = false;
            let update_data = {};


            // replacing floor on planet spot
            if(dirty.players[player_index].planet_coord_id) {

                let player_planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.players[player_index].planet_coord_id });

                let planet_coord_data = { 'planet_id': dirty.planet_coords[player_planet_coord_index].planet_id,
                    'planet_level': dirty.planet_coords[player_planet_coord_index].level,
                    'tile_x': x, 'tile_y': y };
                let planet_coord_index = await main.getPlanetCoordIndex(planet_coord_data);

                // See if it's a planet coord that we can create
                if(planet_coord_index === -1 && dirty.planet_coords[player_planet_coord_index].level > 0) {
                    console.log("Going to see if we can create the planet coord");

                    // so just check if there is an existing coord directly below
                    let below_level = dirty.planet_coords[player_planet_coord_index].level - 1;
                    let below_planet_coord_data = { 'planet_id': dirty.planet_coords[player_planet_coord_index].planet_id, 'planet_level': below_level,
                        'tile_x': x, 'tile_y': y };
                    let below_planet_coord_index = await main.getPlanetCoordIndex(below_planet_coord_data);

                    // we can create the planet coord
                    if(below_planet_coord_index !== -1) {
                        let new_planet_coord_data = { 'planet_id': dirty.planet_coords[player_planet_coord_index].planet_id,
                            'planet_level': dirty.planet_coords[player_planet_coord_index].level,
                            'tile_x': x, 'tile_y': y, 'can_insert': true };
                        planet_coord_index = await main.getPlanetCoordIndex(new_planet_coord_data);
                    } else {

                        socket.emit('result_info', { 'status': 'failure', 'text': "There is no coord below" });
                    }


                }

                if(planet_coord_index === -1) {
                    log(chalk.yellow("Planet coord does not exist"));
                    return false;
                }

                temp_coord = dirty.planet_coords[planet_coord_index];
                scope = 'planet';
                update_data.planet_coord_index = planet_coord_index;



                let planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.planet_coords[planet_coord_index].planet_id, 'source': 'game.replaceFloor' });



            }
            // replacing floor on ship
            else if(dirty.players[player_index].ship_coord_id) {

                let player_ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.players[player_index].ship_coord_id });

                let ship_coord_data = { 'ship_id': dirty.ship_coords[player_ship_coord_index].ship_id,
                    'level': dirty.ship_coords[player_ship_coord_index].level, 'tile_x': x, 'tile_y': y };
                let ship_coord_index = await main.getShipCoordIndex(ship_coord_data);

                if(ship_coord_index === -1) {
                    log(chalk.yellow("Could not find ship coord"));
                    return false;
                }

                temp_coord = dirty.ship_coords[ship_coord_index];
                scope = 'ship';
                update_data.ship_coord_index = ship_coord_index;


            }

            if(temp_coord.floor_type_id) {
                let floor_type_index = dirty.floor_types.findIndex(function(obj) { return obj && obj.id === temp_coord.floor_type_id; });

                if(dirty.floor_types[floor_type_index].is_protected) {
                    console.log("Floor type is protected. Can't replace it");
                    return false;
                }

                if(!dirty.floor_types[floor_type_index].can_build_on) {
                    console.log("Floor type does not allow building on. Returning false");
                    return false;
                }
            }

            // see if there is an AI that would block the floor replacing
            // We need to see if there is an AI that would block this object from being placed there
            //log(chalk.cyan("Need to check to see if an AI rule might prevent this"));
            let ai_index = -1;
            if(scope === 'planet') {
                let planet_index = await planet.getIndex(dirty, { 'planet_id': temp_coord.planet_id, 'source': 'game.replaceFloor' });
                if(planet_index !== -1 && dirty.planets[planet_index].ai_id) {
                    ai_index = await game_object.getIndex(dirty, dirty.planets[planet_index].ai_id);

                }
            } else if(scope === 'ship') {
                let ship_index = await game_object.getIndex(dirty, temp_coord.ship_id);
                if(ship_index !== -1 && dirty.objects[ship_index].ai_id) {
                    ai_index = await game_object.getIndex(dirty, dirty.objects[ship_index].ai_id);
                }
            }

            if(ai_index !== -1) {
                console.log("Found AI");
                let ai_rules = dirty.rules.filter(rule => rule.object_id === dirty.objects[ai_index].id);
                if(ai_rules.length > 0) {
                    for(let ai_rule of ai_rules ) {
                        // We're going to return false unless we are the ones that own the planet
                        if(ai_rule.rule === 'floor_no_others') {
                            if(socket.player_id !== dirty.objects[ai_index].player_id) {
                                console.log("AI rule has denied the floor replace");
                                socket.emit('result_info', { 'status': 'failure', 'text': "The AI has prevented this action" });
                                socket.emit('chat', {'message': "The AI does not allow you replace floors here", 'scope': 'system' });
                                return false;
                            }
                        }
                    }
                }
            }


            update_data.floor_type_id = dirty.inventory_items[inventory_item_index].floor_type_id;
            console.log("Update data sending into updateCoordGeneric: ");
            console.log(update_data);
            await main.updateCoordGeneric(socket, update_data);

            let remove_inventory_data = { 'inventory_item_id': dirty.inventory_items[inventory_item_index].id,
                'amount': 1 };
            await inventory.removeFromInventory(socket, dirty, remove_inventory_data);

        } catch(error) {
            log(chalk.red("Error in game.replaceFloor: " + error));
        }


    }
    exports.replaceFloor = replaceFloor;


    async function replaceFloorAdmin(socket, dirty, data) {
        try {


            data.floor_type_id = parseInt(data.floor_type_id);

            if(data.coord_id) {

                let coord_index = await main.getCoordIndex({ 'coord_id': parseInt(data.coord_id )});
                if(coord_index !== -1) {
                    await main.updateCoordGeneric(socket, { 'coord_index': coord_index, 'floor_type_id': data.floor_type_id });
                }


            } else if(data.planet_coord_id) {

                let planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': parseInt(data.planet_coord_id) });
                if(planet_coord_index !== -1) {
                    await main.updateCoordGeneric(socket, { 'planet_coord_index': planet_coord_index, 'floor_type_id': data.floor_type_id });
                }

            } else if(data.ship_coord_id) {

                let ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': parseInt(data.ship_coord_id) });
                if(ship_coord_index !== -1) {
                    await main.updateCoordGeneric(socket, { 'ship_coord_index': ship_coord_index, 'floor_type_id': data.floor_type_id });
                }

            }
        } catch(error) {
            log(chalk.red("Error in game.replaceFloorAdmin: " + error));
            console.error(error);
        }
    }

    exports.replaceFloorAdmin = replaceFloorAdmin;

    //  data:   inventory_item_id   |   ship_coord_id
    async function replaceShipWall(socket, dirty, data) {

        try {

            log(chalk.red("Not messing with the is_ship_wall stuff right now"));
            return false;

            data.inventory_item_id = parseInt(data.inventory_item_id);
            data.ship_coord_id = parseInt(data.ship_coord_id);


            let inventory_item_index = await main.getInventoryItemIndex(data.inventory_item_id);

            if(inventory_item_index === -1) {
                log(chalk.yellow("Couldn't get inventory item for replaceFloor"));
                return false;
            }


            if(typeof socket.player_index === 'undefined') {
                log(chalk.yellow("Could not get player in game.replaceShipWall"));
                return false;
            }

            //console.log("Got inventory_item_index");


            let ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': data.ship_coord_id });

            if(ship_coord_index === -1) {
                log(chalk.yellow("Could not find ship coord"));
                return false;
            }

            let ship_index = await game_object.getIndex(dirty, dirty.ship_coords[ship_coord_index].ship_id);

            if(ship_index === -1) {
                log(chalk.yellow("Could not find ship"));
                return false;
            }

            // For now lets limit it to ship owners
            if(dirty.objects[ship_index].player_id !== dirty.players[socket.player_index].id) {
                log(chalk.yellow("Can't replace walls on a ship that is not yours"));
                return false;
            }

            let update_data = { 'ship_coord_index': ship_coord_index };

            // We gotta make sure that the inventory item object type is_ship_wall

            let inventory_item_object_type_index = -1;
            let inventory_item_object_index = -1;

            if(dirty.inventory_items[inventory_item_index].object_id) {
                update_data.object_id = dirty.inventory_items[inventory_item_index].object_id;

                inventory_item_object_index = await game_object.getIndex(dirty, dirty.inventory_items[inventory_item_index].object_id);
                if(inventory_item_object_index !== -1) {
                    inventory_item_object_type_index = main.getObjectTypeIndex(dirty.objects[inventory_item_object_index].object_type_id);
                }


            } else if(dirty.inventory_items[inventory_item_index].object_type_id) {
                update_data.object_type_id = dirty.inventory_items[inventory_item_index].object_type_id;

                inventory_item_object_type_index = main.getObjectTypeIndex(dirty.inventory_items[inventory_item_index].object_type_id);
            }


            if(inventory_item_object_type_index === -1) {
                log(chalk.yellow("Could not get object type of inventory item"));
                return false;
            }

            if(!dirty.object_types[inventory_item_object_type_index].is_ship_wall) {
                log(chalk.yellow("The object type at inventory item id: " + dirty.inventory_items[inventory_item_index].id + " is not a ship wall"));
                return false;
            }

            await main.updateCoordGeneric(socket, update_data);

            let remove_inventory_data = { 'inventory_item_id': dirty.inventory_items[inventory_item_index].id,
                'amount': 1 };
            await inventory.removeFromInventory(socket, dirty, remove_inventory_data);





        } catch(error) {
            log(chalk.red("Error in game.replaceShipWall: " + error));
            console.error(error);
        }


    }
    exports.replaceShipWall = replaceShipWall;


    // We do a complexity check at the end of the research - once its completed not
    async function research(socket, dirty, data) {

        try {

            let player_index = await player.getIndex(dirty, {'player_id':socket.player_id});

            if(player_index === -1) {
                log(chalk.yellow("Could not get player in game.research"));
                return false;
            }

            let inventory_item_index = await main.getInventoryItemIndex(parseInt(data.inventory_item_id));

            if(inventory_item_index === -1) {
                console.log("Could not find inventory item in game.research");
                return false;

            }

            if(dirty.inventory_items[inventory_item_index].player_id !== dirty.players[player_index].id) {
                console.log("Inventory item does not belong to player");
                return false;
            }

            let researching_object_index = await game_object.getIndex(dirty, parseInt(data.researching_object_id));

            if(researching_object_index === -1) {
                console.log("Could not find researching object");
                return false;
            }

            let player_info = await player.getCoordAndRoom(dirty, player_index);
            let object_info = await game_object.getCoordAndRoom(dirty, researching_object_index);

            if(player_info.room !== object_info.room) {
                console.log("Player and object are not in the same room");
                return false;
            }


            // Make sure that object isn't already researching something
            let existing_research_index = dirty.researches.findIndex(function(obj) { return obj &&
                obj.researcher_object_id === dirty.objects[researching_object_index].id; });

            if(existing_research_index !== -1) {
                log(chalk.yellow("Researcher is already researching something"));
                return false;
            }



            let [result] = await (pool.query("INSERT INTO researches(researcher_object_id, being_researched_object_type_id, player_id)VALUES(?,?,?)",
                [dirty.objects[researching_object_index].id, dirty.inventory_items[inventory_item_index].object_type_id, socket.player_id]));

            if(result) {
                let new_id = result.insertId;
                let [rows, fields] = await (pool.query("SELECT * FROM researches WHERE id = ?", [new_id]));
                if(rows[0]) {
                    let adding_research = rows[0];
                    adding_research.has_change = false;
                    let research_index = dirty.researches.push(adding_research) - 1;

                    socket.emit('research_info', { 'research': dirty.researches[research_index] });

                    // set our assembler object is_active to true
                    dirty.objects[researching_object_index].is_active = true;
                    //console.log("Calling sendObjectInfo from game.research");
                    await game_object.sendInfo(false, object_info.room, dirty, researching_object_index);


                }
            }

            let remove_inventory_data = { 'inventory_item_id': dirty.inventory_items[inventory_item_index].id, 'amount': 1 };
            inventory.removeFromInventory(socket, dirty, remove_inventory_data);




        } catch(error) {
            log(chalk.red("Error in game.research: " + error));
        }



    }
    exports.research = research;

    async function sendAssembledInLinkerData(socket, dirty) {

        try {
            for(let i = 0; i < dirty.assembled_in_linkers.length; i++) {

                socket.emit('assembled_in_linker_data', { 'assembled_in_linker': dirty.assembled_in_linkers[i] });

            }
        } catch(error) {
            log(chalk.red("Error in game.sendAssembledInLinkerData: " + error));
        }


    }
    exports.sendAssembledInLinkerData = sendAssembledInLinkerData;


    async function sendAssemblyLinkerData(socket, dirty) {

        try {
            for(let i = 0; i < dirty.assembly_linkers.length; i++) {
                let assembly_linker = dirty.assembly_linkers[i];

                if(assembly_linker.required_for_object_type_id) {
                    socket.emit('object_type_assembly_linker_data', { 'id': assembly_linker.id, 'required_for_object_type_id': assembly_linker.required_for_object_type_id,
                        'object_type_id': assembly_linker.object_type_id, 'amount': assembly_linker.amount } );
                } else if(assembly_linker.required_for_floor_type_id) {
                    socket.emit('floor_type_assembly_linker_data', { 'id': assembly_linker.id, 'required_for_floor_type_id': assembly_linker.required_for_floor_type_id,
                        'object_type_id': assembly_linker.object_type_id, 'amount': assembly_linker.amount } );
                }


            }
        } catch(error) {
            log(chalk.red("Error in game.sendAssemblyLinkerData: " + error));
        }



    }
    exports.sendAssemblyLinkerData = sendAssemblyLinkerData;


    async function sendFloorTypeData(socket, dirty) {
        //console.log("Client is requesting floor_type data");

        dirty.floor_types.forEach(function(floor_type) {
            socket.emit('floor_type_info', { 'floor_type': floor_type } );
        });

    }

    exports.sendFloorTypeData = sendFloorTypeData;

    function sendFloorTypeDisplayLinkerData(socket, dirty) {
        //console.log("Client is requesting planet_type data");

        dirty.floor_type_display_linkers.forEach(function(display_linker, i) {
            socket.emit('floor_type_display_linker_info', { 'floor_type_display_linker': display_linker });
        });

    }

    exports.sendFloorTypeDisplayLinkerData = sendFloorTypeDisplayLinkerData;


    function sendMonsterTypeData(socket, dirty) {
        //console.log("Client is requesting monster_type data");

        dirty.monster_types.forEach(function(monster_type) {
            socket.emit('monster_type_info', { 'monster_type': monster_type });
        });



    }

    exports.sendMonsterTypeData = sendMonsterTypeData;

    function sendObjectTypeConversionLinkerData(socket, dirty) {
        //console.log("Client is requesting planet_type data");

        // We are sending a limited about of data about the conversion linkers (leaving off the results) so there is
        // mystery
        dirty.object_type_conversion_linkers.forEach(function(conversion_linker, i) {
            socket.emit('object_type_conversion_linker_info', { 'object_type_conversion_linker':
                    { 'id': conversion_linker.id, 'object_type_id': conversion_linker.object_type_id,
                    'input_object_type_id': conversion_linker.input_object_type_id,
                    'input_type': conversion_linker.input_type } });
        });

    }

    exports.sendObjectTypeConversionLinkerData = sendObjectTypeConversionLinkerData;


    function sendObjectTypeDisplayLinkerData(socket, dirty) {
        //console.log("Client is requesting planet_type data");

        dirty.object_type_display_linkers.forEach(function(display_linker, i) {
            socket.emit('object_type_display_linker_info', { 'object_type_display_linker': display_linker });
        });

    }

    exports.sendObjectTypeDisplayLinkerData = sendObjectTypeDisplayLinkerData;


    function sendPlanetTypeData(socket, dirty) {
        //console.log("Client is requesting planet_type data");

        dirty.planet_types.forEach(function(planet_type, i) {
            socket.emit('planet_type_info', { 'planet_type': planet_type });
        });

    }

    exports.sendPlanetTypeData = sendPlanetTypeData;

    function sendPlanetTypeDisplayLinkerData(socket, dirty) {
        //console.log("Client is requesting planet_type data");

        dirty.planet_type_display_linkers.forEach(function(display_linker, i) {
            socket.emit('planet_type_display_linker_info', { 'planet_type_display_linker': display_linker });
        });

    }

    exports.sendPlanetTypeDisplayLinkerData = sendPlanetTypeDisplayLinkerData;

    // TODO - This is obviously outdated - not sure if I want to keep it around.
    async function sendPlayerStats(socket, dirty) {

        try {
            //console.log("In sendPlayerStats");
            if(typeof socket.player_index === 'undefined' || socket.player_index === -1) {
                log(chalk.yellow("Can't set player stats for socket without a player yet"));
                return false;
            }


            for(let i = 0; i < dirty.equipment_linkers.length; i++) {
                if(dirty.equipment_linkers[i] && dirty.equipment_linkers[i].body_id === dirty.players[socket.player_index].body_id) {
                    //console.log("Sending equipment linker with amount: " + dirty.equipment_linkers[i].amount);
                    socket.emit('equipment_linker_info', { 'equipment_linker': dirty.equipment_linkers[i] });
                }
            }



            let admin_data = false;
            if(socket.is_admin) {
                admin_data = 'Populated By data: player_stats (games.js -> sendPlayerData). Used by socket.on(\'player_stats\'';
            }



            socket.emit('player_stats', { 'player_id': socket.player_id, 'name':socket.player_name, 'exp':socket.player_exp, 'level': socket.player_level,
                'attack': socket.player_attack, 'defense': socket.player_defense, 'player_hp': socket.player_current_hp, 'max_hp': socket.player_max_hp,
                'energy':socket.player_energy, 'is_admin':socket.is_admin, 'farming_skill_points':socket.farming_skill_points,
                'cooking_skill_points': dirty.players[socket.player_index].cooking_skill_points, 'manufacturing_skill_points':dirty.players[socket.player_index].manufacturing_skill_points,
                'laser_skill_points': dirty.players[socket.player_index].laser_skill_points, 'admin_data': admin_data });
        } catch(error) {
            log(chalk.red("Error in game.sendPlayerStats: " + error));
            console.error(error);
        }

    }

    exports.sendPlayerStats = sendPlayerStats;

    function sendObjectTypeData(socket, dirty) {
        //console.log("Client is requesting object_type data");

        dirty.object_types.forEach(function(object_type) {
            socket.emit('object_type_info', {  'object_type': object_type } );
        });


    }

    exports.sendObjectTypeData = sendObjectTypeData;

    function sendObjectTypeEquipmentLinkerData(socket, dirty) {
        //console.log("Client is requesting object_type_equipment_linker data");


        dirty.object_type_equipment_linkers.forEach(function(object_type_equipment_linker) {
            socket.emit('object_type_equipment_linker_info', {  'object_type_equipment_linker': object_type_equipment_linker } );
        });

    }

    exports.sendObjectTypeEquipmentLinkerData = sendObjectTypeEquipmentLinkerData;


    function sendRaceData(socket, dirty) {
        //console.log("Client is requesting race data");

        dirty.races.forEach(function(race, i) {
            socket.emit('race_info', { 'race': race });
        });

    }

    exports.sendRaceData = sendRaceData;

    function sendRaceEatingLinkerData(socket, dirty) {
        //console.log("Client is requesting race eating linker data");

        dirty.race_eating_linkers.forEach(function(race_eating_linker, i) {
            socket.emit('race_eating_linker_info', { 'race_eating_linker': race_eating_linker });
        });

    }

    exports.sendRaceEatingLinkerData = sendRaceEatingLinkerData;


    function sendRuleData(socket, dirty) {
        //console.log("Client is requesting rule data");

        dirty.rules.forEach(function(rule) {
            socket.emit('rule_info', { 'rule': rule });
        });

    }

    exports.sendRuleData = sendRuleData;

    async function sendUnreadMessageCount(socket, dirty) {

        try {

            //console.log("Sending unread message count");

            if(typeof socket.player_index === 'undefined') {
                socket.emit('unread_message_info', { 'unread_message_count': 0 });
                return;
            }

            let [rows, fields] = await (pool.query("SELECT unread_message_count FROM users WHERE id = ?", [dirty.players[socket.player_index].user_id]));
            if (rows[0]) {

                socket.emit('unread_message_info', { 'unread_message_count': rows[0].unread_message_count });
                return true;
            }

        } catch(error) {
            log(chalk.red("Error in game.sendUnreadMessageCount: " + error));
            console.error(error);
        }


    }

    exports.sendUnreadMessageCount = sendUnreadMessageCount;


    // Will move the player from the current body to the other one. Old body will stay where it was as an object on the tile
    async function switchBody(socket, dirty, new_body_id, move_inventory) {
        try {

            //log(chalk.green("Player is switching bodies"));

            if(typeof socket.player_index === "undefined") {
                log(chalk.yellow("Socket doesn't have player - can't switch bodies"));
                return false;
            }

            let player_index = socket.player_index;


            let object_index = await game_object.getIndex(dirty, new_body_id);
            let old_body_index = await game_object.getIndex(dirty, dirty.players[socket.player_index].body_id);

            if(object_index === -1 || old_body_index === -1) {
                log(chalk.yellow("Could not get either new or old body in game.switchBody"));
                return false;
            }



            let new_body_coord_index = -1;
            let old_player_coord_index = -1;
            let body_switch_allowed = true;

            if(dirty.players[player_index].planet_coord_id) {
                new_body_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.objects[object_index].planet_coord_id });
                old_player_coord_index = await main.getPlanetCoordIndex({'planet_coord_id': dirty.players[player_index].planet_coord_id });

                let can_interact_result = await canInteract(socket, dirty, 'planet_coord', dirty.planet_coords[new_body_coord_index]);
                if(can_interact_result === false) {
                    body_switch_allowed = false;
                }

                if(dirty.planet_coords[old_player_coord_index].object_id || dirty.planet_coords[old_player_coord_index].object_type_id) {
                    body_switch_allowed = false;
                }
            } else if(dirty.players[player_index].ship_coord_id) {
                new_body_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.objects[object_index].ship_coord_id });
                old_player_coord_index = await main.getShipCoordIndex({'ship_coord_id': dirty.players[player_index].ship_coord_id });
                let can_interact_result = await canInteract(socket, dirty, 'ship_coord', dirty.ship_coords[new_body_coord_index]);
                if(can_interact_result === false) {
                    body_switch_allowed = false;
                }

                if(dirty.ship_coords[old_player_coord_index].object_id || dirty.ship_coords[old_player_coord_index].object_type_id) {
                    body_switch_allowed = false;
                }
            }

            if(new_body_coord_index === -1) {
                log(chalk.yellow("Could not find coord for the body we are switching to. odd..."));
                return false;
            }



            // Make sure the body isn't already equipped by someone
            // Bodies will often have a player_id since players will create them
            // So we need to check to see if a player has this body
            //console.log("Seeing if the body is already in use");
            let other_player_index = await player.getIndex(dirty, { 'body_id': dirty.objects[object_index].id });

            //console.log("Other player index: " + other_player_index);

            // We have to check that no other player is using the body. This means grabbing from mysql.
            if(other_player_index !== -1 && other_player_index !== player_index) {
                body_switch_allowed = false;
            }

            if(!body_switch_allowed) {
                if(other_player_index !== -1) {
                    log(chalk.yellow("Body switch is not allowed. Body is being used by player id: " + dirty.players[other_player_index].id));
                    log(chalk.yellow("Their body id: " + dirty.players[other_player_index].body_id));
                    log(chalk.yellow("Our id: " + dirty.players[player_index].id + " body id: " + dirty.players[player_index].body_id));
                } else {
                    socket.emit('result_info', { 'status': 'failure', 'text': "Too far away, or body is on something" });
                }
                
                return false;
            }

            //console.log("Body switch is a go!");


            // Store the old body id
            let old_body_id = dirty.players[player_index].body_id;

            // Move the player to the new body
            dirty.players[player_index].body_id = dirty.objects[object_index].id;
            //console.log("Updated player body id to: " + dirty.players[player_index].body_id);

            if(dirty.objects[object_index].player_id !== dirty.players[player_index].id) {
                console.log("This body used to belong to a different player. Updating body's player_id");
                dirty.objects[object_index].player_id = dirty.players[player_index].id;
                dirty.objects[object_index].has_change = true;
            }

            // Have the old body store the current HP
            dirty.objects[old_body_index].current_hp = dirty.players[player_index].current_hp;
            dirty.objects[old_body_index].has_change = true;
        
            // Switch the player to whatever HP the new body has
            dirty.players[player_index].current_hp = dirty.objects[object_index].current_hp;
            
            dirty.players[player_index].has_change = true;

            // switch the coord that the player is on
            if(dirty.players[player_index].planet_coord_id) {

                //console.log("Updating player and coords");

                dirty.players[player_index].planet_coord_id = dirty.planet_coords[new_body_coord_index].id;
                dirty.players[player_index].planet_coord_index = new_body_coord_index;
                dirty.players[player_index].has_change = true;

                // update the old planet coord
                await main.updateCoordGeneric(socket, { 'planet_coord_index': old_player_coord_index,
                    'player_id': false, 'object_id': old_body_id, 'object_type_id': dirty.objects[old_body_index].object_type_id });

                // update the new planet coord
                await main.updateCoordGeneric(socket, { 'planet_coord_index': new_body_coord_index,
                    'player_id': dirty.players[player_index].id, 'object_id': false });

                await player.sendInfo(socket, "planet_" + dirty.planet_coords[new_body_coord_index].planet_id, dirty, dirty.players[player_index].id);

                // Make sure the old body knows where it is
                dirty.objects[old_body_index].planet_coord_id = dirty.planet_coords[old_player_coord_index].id;
                dirty.objects[old_body_index].planet_coord_index = old_player_coord_index;
                dirty.objects[old_body_index].has_change = true;
                await game_object.sendInfo(socket, "planet_" + dirty.planet_coords[new_body_coord_index].planet_id, dirty, old_body_index);


                dirty.objects[object_index].planet_coord_id = false;
                dirty.objects[object_index].planet_coord_index = -1;
                dirty.objects[object_index].has_change = true;
                await game_object.sendInfo(socket, "planet_" + dirty.planet_coords[new_body_coord_index].planet_id, dirty, object_index);

                console.log("Sending info to clients");


            } else if(dirty.players[player_index].ship_coord_id) {
                //console.log("Updating player, coords, and objects");

                //console.log("Old player ship coord id: " + dirty.players[player_index].ship_coord_id);

                dirty.players[player_index].ship_coord_id = dirty.ship_coords[new_body_coord_index].id;
                dirty.players[player_index].ship_coord_index = -1;
                dirty.players[player_index].has_change = true;
                main.clearPlayerExtraCoords(player_index);
                //console.log("Updated player id: " + dirty.players[player_index].id + " to ship coord id: " + dirty.players[player_index].ship_coord_id);

                // update the old ship coord
                await main.updateCoordGeneric(socket, { 'ship_coord_index': old_player_coord_index,
                    'player_id': false, 'object_id': old_body_id, 'object_type_id': dirty.objects[old_body_index].object_type_id });

                // update the new ship coord
                await main.updateCoordGeneric(socket, { 'ship_coord_index': new_body_coord_index,
                    'player_id': dirty.players[player_index].id, 'object_id': false });

                await player.sendInfo(socket, "ship_" + dirty.ship_coords[new_body_coord_index].ship_id, dirty, dirty.players[player_index].id);


                dirty.objects[old_body_index].ship_coord_id = dirty.ship_coords[old_player_coord_index].id;
                dirty.objects[old_body_index].ship_coord_index = old_player_coord_index;
                dirty.objects[old_body_index].has_change = true;
                await game_object.sendInfo(socket, "ship_" + dirty.ship_coords[new_body_coord_index].ship_id, dirty, old_body_index);

                dirty.objects[object_index].ship_coord_id = false;
                dirty.objects[object_index].ship_coord_index = -1;
                dirty.objects[object_index].has_change = true;
                await game_object.sendInfo(socket, "ship_" + dirty.ship_coords[new_body_coord_index].ship_id, dirty, object_index);

            }

            await map.updateMap(socket, dirty);

            // All the equipment_linkers will have changed
            socket.emit('clear_equipment_linkers_data');


            // get the new equipment linkers
            await player.getEquipment(dirty, dirty.players[player_index].body_id);

            // move inventory if the player wanted to
            //console.log("move_inventory: " + move_inventory);
            if(move_inventory === 'yes') {
                console.log("Moving inventory too!");

                for(let i = 0; i < dirty.inventory_items.length; i++) {
                    if(dirty.inventory_items[i] && dirty.inventory_items[i].player_id === dirty.players[player_index].id && dirty.inventory_items[i].body_id === old_body_id) {
                        dirty.inventory_items[i].body_id = new_body_id;
                        dirty.inventory_items[i].has_change = true;
                        inventory.sendInventoryItem(socket, "", dirty, i);
                    }
                }

            } else {
                //console.log("Not moving inventory");
            }



            // gotta re-calculate stats
            await calculatePlayerStats(socket, dirty);

            await sendPlayerStats(socket, dirty);
            


        } catch(error) {
            log(chalk.red("Error in game.switchBody: " + error));
            console.error(error);

        }


    }

    exports.switchBody = switchBody;


    async function trash(socket, dirty, data) {

        try {

            if(!socket.player_id) {
                return false;
            }

            let inventory_item_id = data.inventory_item_id;

            let inventory_item_index = await main.getInventoryItemIndex(inventory_item_id);

            if(inventory_item_index === -1) {
                log(chalk.yellow("Could not find inventory item to trash"));

                // We can still let the client know to trash this
                let temp_inventory_item = { id: inventory_item_id };
                socket.emit('inventory_item_info', { 'remove': true, 'inventory_item': temp_inventory_item });
                return false;
            }

            if(dirty.inventory_items[inventory_item_index].player_id !== socket.player_id) {
                log(chalk.yellow("Player is trying to trash inventory item that is not theirs"));
                return false;
            }


            await (pool.query("DELETE FROM inventory_items WHERE id = ?", [inventory_item_id]));

            socket.emit('inventory_item_info', { 'remove': true, 'inventory_item': dirty.inventory_items[inventory_item_index] });

            delete dirty.inventory_items[inventory_item_index];
            console.log(dirty.inventory_items[inventory_item_index]);

            //inventory.sendInventory(socket, false, dirty, 'player', socket.player_id);

            console.log("Trashed inventory item. Client should see this now.");




        } catch(error) {
            log(chalk.red("Error in game.trash: " + error));
        }


    }
    exports.trash = trash;


    async function useElevator(socket, dirty, elevator_id) {

        try {
            console.log("Player is using an elevator! ID: " + elevator_id);

            let elevator_index = await game_object.getIndex(dirty, elevator_id);

            if(elevator_index === -1) {
                log(chalk.yellow("Did not find elevator"));
                return false;
            }

            // we just need to make sure the player is within a REASONABLE tile_x/tile_y of the elevator, and in the same room

            let elevator_info = await game_object.getCoordAndRoom(dirty, elevator_index);
            let player_info = await player.getCoordAndRoom(dirty, socket.player_index);

            if(helper.isFalse(elevator_info.coord) || helper.isFalse(player_info.coord) ) {
                log(chalk.yellow("Either the elevator or the player didn't return a valid coord"));
                return false;
            }

            // Make sure they are in the same room
            if(elevator_info.room !== player_info.room) {
                log(chalk.yellow("Player is not in same room as elevator"));
                return false;
            }

            let x_difference = Math.abs(elevator_info.coord.tile_x - player_info.coord.destination_tile_x);
            let y_difference = Math.abs(elevator_info.coord.tile_y - player_info.coord.destination_tile_y);

            if(x_difference > 3 || y_difference > 3) {
                log(chalk.yellow("Player is too far away"));
                socket.emit('result_info', { 'status': 'failure', 'text': 'Too far away' });
                return false;
            }

            // find an open coord around the elevator
            let found_coord_index = -1;


            for(let x = elevator_info.coord.tile_x - 2; x <= elevator_info.coord.tile_x + 2; x++) {
                for(let y = elevator_info.coord.tile_y - 2; y <= elevator_info.coord.tile_y + 2; y++) {

                    if(found_coord_index === -1) {



                        if(dirty.objects[elevator_index].planet_coord_id) {

                            let possible_coord_index = await main.getPlanetCoordIndex({ 'planet_id': elevator_info.coord.planet_id,
                                'planet_level': elevator_info.coord.level, 'tile_x': x, 'tile_y': y });

                                
                            if(possible_coord_index !== -1) {

                                let can_place_result = await player.canPlace(dirty, 'planet', dirty.planet_coords[possible_coord_index], socket.player_index);
                                
                                if(can_place_result) {
                                    // woot!
                                    console.log("Found a planet coord to move to");
                                    found_coord_index = possible_coord_index;
                                }
                            }



                        } else if(dirty.objects[elevator_index].ship_coord_id) {

                            let possible_coord_index = await main.getShipCoordIndex({ 'ship_id': elevator_info.coord.ship_id,
                                'level': elevator_info.coord.level, 'tile_x': x, 'tile_y': y });

                            if(possible_coord_index !== -1) {


                                let can_place_result = await player.canPlace(dirty, 'ship', dirty.ship_coords[possible_coord_index], socket.player_index);
                                if(can_place_result) {
                                    // woot!
                                    found_coord_index = possible_coord_index;
                                }
                            }



                        }


                    }



                }
            }


            // move the player there
            if(found_coord_index !== -1) {
                if(elevator_info.coord.planet_id) {
                    await main.updateCoordGeneric(socket, { 'planet_coord_index': player_info.coord_index, 'player_id': false });
                    await main.updateCoordGeneric(socket, { 'planet_coord_index': found_coord_index, 'player_id': dirty.players[socket.player_index].id });

                    dirty.players[socket.player_index].planet_coord_id = dirty.planet_coords[found_coord_index].id;
                    dirty.players[socket.player_index].planet_coord_index = found_coord_index;
                    dirty.players[socket.player_index].has_change = true;
                    await player.sendInfo(socket, "planet_" + dirty.planet_coords[found_coord_index].planet_id, dirty, dirty.players[socket.player_index].id);

                    socket.emit('clear_map');
                    await world.removeBattleLinkers(dirty, { 'player_id': dirty.players[socket.player_index].id});
                    await map.updateMap(socket, dirty);
                } else if(elevator_info.coord.ship_id) {
                    await main.updateCoordGeneric(socket, { 'ship_coord_index': player_info.coord_index, 'player_id': false });
                    await main.updateCoordGeneric(socket, { 'ship_coord_index': found_coord_index, 'player_id': dirty.players[socket.player_index].id });

                    dirty.players[socket.player_index].ship_coord_id = dirty.ship_coords[found_coord_index].id;
                    dirty.players[socket.player_index].ship_coord_index = -1;
                    dirty.players[socket.player_index].has_change = true;
                    await player.sendInfo(socket, "ship_" + dirty.ship_coords[found_coord_index].ship_id, dirty, dirty.players[socket.player_index].id);

                    socket.emit('clear_map');
                    await world.removeBattleLinkers(dirty, { 'player_id': dirty.players[socket.player_index].id});
                    await map.updateMap(socket, dirty);
                }
            }





        } catch(error) {
            log(chalk.red("Error in world.useElevator: " + error));
            console.error(error);
        }

    }

    exports.useElevator = useElevator;