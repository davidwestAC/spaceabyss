//@ts-check
var io_handler = require('./io.js');
var io = io_handler.io;
var database = require('./database.js');
var pool = database.pool;
const PF = require('pathfinding');
const { v1: uuidv1 } = require('uuid');
const chalk = require('chalk');
const log = console.log;


const battle = require('./battle.js');
const event = require('./event.js');
const game = require('./game.js');
const game_object = require('./game_object.js');
const helper = require('./helper.js');
const main = require('./space_abyss' + process.env.FILE_SUFFIX + '.js');
const map = require('./map.js');
const monster = require('./monster.js');
const npc = require('./npc.js');
const planet = require('./planet.js');
const player = require('./player.js');



/*
 data:       attacking_id   |   attacking_type   |    being_attacked_id   |   being_attacked_type   |   ?being_attacked_socket_id?
 */
/**
 * @param {Object} socket
 * @param {Object} dirty
 * @param {Object} data
 * @param {number} data.attacking_id
 * @param {String} data.attacking_type
 * @param {number} data.being_attacked_id
 * @param {String} data.being_attacked_type
 * @param {number=} data.being_attacked_socket_id
 */
async function addBattleLinker(socket, dirty, data) {

    try {

        //console.log("In add battle linker");
        //console.log("Data passed into world.addBattleLinker: ");
        //console.log(data);

        if (data.attacking_id == null) {
            log(chalk.red("null attacking_id inputted. KILL ALL HUMANS"));
            return false;
        }


        let socket_id = false;
        let being_attacked_socket_id = false;
        let attacking_index = -1;
        let being_attacked_index = -1;
        let room = "";

        if (socket !== false) {
            socket_id = socket.id;
        }

        if (data.being_attacked_socket_id) {
            being_attacked_socket_id = data.being_attacked_socket_id;
        }


        // see if we already have the battle linker
        let battle_linker_index = dirty.battle_linkers.findIndex(function (obj) {
            return obj && obj.attacking_id === data.attacking_id && obj.attacking_type === data.attacking_type &&
                obj.being_attacked_id === data.being_attacked_id && obj.being_attacked_type === data.being_attacked_type
        });

        if (battle_linker_index !== -1) {
            //log(chalk.yellow("Already have a matching battle linker"));
            return false;
        }

        // attach and get our socket ids if we are dealing with players
        if (data.attacking_type === 'player') {
            attacking_index = await player.getIndex(dirty, { 'player_id': data.attacking_id });
            if (attacking_index !== -1) {
                // make sure the other player is connected
                Object.keys(io.sockets.sockets).forEach(function (id) {

                    if (io.sockets.connected[id].player_id === data.attacking_id) {
                        socket_id = id;
                    }

                });
            } else {
                // Can't attack if we aren't a player
                return false;
            }

            let attacking_player_info = await player.getCoordAndRoom(dirty, attacking_index);
            room = attacking_player_info.room;
        }

        if (data.being_attacked_type === 'player') {
            being_attacked_index = await player.getIndex(dirty, { 'player_id': data.being_attacked_id });
            if (being_attacked_index !== -1) {
                // make sure the other player is connected
                Object.keys(io.sockets.sockets).forEach(function (id) {

                    if (io.sockets.connected[id].player_id === data.being_attacked_id) {
                        being_attacked_socket_id = id;
                    }

                });
            } else {
                // Not gonna attack players we can't find
                return false;
            }

            if(helper.isFalse(room)) {
                let defending_player_info = await player.getCoordAndRoom(dirty, being_attacked_index);
                room = defending_player_info.room;
            }
            
        }


        // ATTACKER
        // Make sure the player attacking can attack. Can't attack if they are standing on a spaceport tile,
        //  or if they are in space and have a pod
        if (data.attacking_type === 'player') {



            // Spaceport tile check
            if (dirty.players[attacking_index].planet_coord_id) {
                let attacking_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.players[attacking_index].planet_coord_id });

                if (attacking_coord_index === -1) {
                    return false;
                }

                if(helper.notFalse(dirty.players[attacking_index].planet_coord_index) && 
                    dirty.planet_coords[dirty.players[attacking_index].planet_coord_index].id !== dirty.planet_coords[attacking_coord_index].id) {
                    log(chalk.yellow("Player planet_coord_index is desynced from the player's planet_coord_id!!!"));
                }

                if (dirty.planet_coords[attacking_coord_index].floor_type_id === 11 || dirty.planet_coords[attacking_coord_index].floor_type_id === 44) {
                    console.log("No attacking when spaceport tiles are involved");

                    // Let the player know this reason
                    socket.emit('chat', { 'message': "You can't attack while on a spaceport", 'scope': 'system' });
                    return false;
                }

                // On azure planet check
                // TODO I think I want to not code it this way. Rather have AIs on azure planets
                // That are just really powerful
                /*
                let planet_index = await planet.getIndex(dirty, dirty.players[attacking_index].planet_id);
                if(planet_index !== -1 && dirty.planets[planet_index].planet_type_id === 16) {

                    console.log("Can't attack players on azure planets. attacking type: " + data.attacking_type +
                        " being_attacked_type: " + data.being_attacked_type);
                    // and attack the other player
                    socket.emit('chat', { 'message': "Epic Azure planet system defense activated!", 'scope': 'local' });
                    return false;
                }
                */

            }

        } else if (data.attacking_type === 'object') {
            // We can't attack anyone if we are a pod
            // Make sure the object isn't a pod
            console.log("Object is attacking. data.attacking_id: " + data.attacking_id);
            let attacking_object_index = await game_object.getIndex(dirty, data.attacking_id);
            if (attacking_object_index === -1) {
                return false;
            }

            // TODO right now we are getting a message from this when the abandoned pod tries to attack us back
            if (dirty.objects[attacking_object_index].object_type_id === 114) {

                // Let the attacking player know you can't attack pods
                socket.emit('chat', {
                    'message': "Pods are your default ship. You can't attack, or be attacked in them. " +
                        "You can build more advanced ships if you build a shipyard in the galaxy", 'scope': 'system'
                });
                //console.log("Attacking object id: " + dirty.objects[attacking_object_index].id);
                return false;

            }
        }

        // DEFENDER
        // Make sure this player can actually be attacked right now
        // Can't attack npcs in their pod in space
        if (data.being_attacked_type === 'npc') {
            being_attacked_index = await npc.getIndex(dirty, data.being_attacked_id);
            if (dirty.npcs[being_attacked_index].coord_id && !dirty.npcs[being_attacked_index].ship_id) {
                console.log("No attacking npcs in pods");
                return false;
            }
        }
        // Spaceport tile or a pod ship means they can't be attacked
        if (data.being_attacked_type === 'player') {

            // Spaceport tile check
            if (dirty.players[being_attacked_index].planet_coord_id) {
                let being_attacked_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.players[being_attacked_index].planet_coord_id });

                if (being_attacked_coord_index === -1) {
                    return false;
                }

                if (dirty.planet_coords[being_attacked_coord_index].floor_type_id === 11 || dirty.planet_coords[being_attacked_coord_index].floor_type_id === 44) {
                    console.log("No attacking when spaceport tiles are involved");
                    return false;
                }


            }

        } else if (data.being_attacked_type === 'object') {
            // Make sure the object isn't a pod
            let being_attacked_object_index = await game_object.getIndex(dirty, data.being_attacked_id);
            if (being_attacked_object_index === -1) {
                return false;
            }

            if (dirty.objects[being_attacked_object_index].object_type_id === 114 && dirty.objects[being_attacked_object_index].player_id) {

                // Let the attacking player know you can't attack pods
                socket.emit('chat', { 'message': "Occupied pods cannot be attacked - only abandoned pods can be attacked", 'scope': 'system' });

                return false;
            }

        }


        // EVERYTHING CHECKED OUT. LETS ADD IT

        let battle_linker = {
            'id': uuidv1(),
            'attacking_id': data.attacking_id, 'attacking_type': data.attacking_type, 'being_attacked_id': data.being_attacked_id,
            'being_attacked_type': data.being_attacked_type, 'socket_id': socket_id, 'being_attacked_socket_id': being_attacked_socket_id,
            'turn_count': 0,
            'room': room
        };

        battle_linker_index = dirty.battle_linkers.push(battle_linker) - 1;

        //console.log("Added battle linker!");


        if (socket_id) {
            io.to(socket_id).emit('battle_linker_info', { 'something': 'yes', 'battle_linker': dirty.battle_linkers[battle_linker_index] });
        }

        if (being_attacked_socket_id) {
            io.to(being_attacked_socket_id).emit('battle_linker_info', { 'something': 'yes', 'battle_linker': dirty.battle_linkers[battle_linker_index] });
        }

        // If it's a player and they were attacking something else previously, we will stop that previous attack
        if (data.attacking_type === 'player') {
            let previous_battle_linker_index = dirty.battle_linkers.findIndex(function (obj) {
                return obj && obj.attacking_type === 'player' &&
                    obj.attacking_id === data.attacking_id && obj.id !== dirty.battle_linkers[battle_linker_index].id;
            });

            if (previous_battle_linker_index !== -1) {

                //console.log("Player had a previous battle linker. Lets remove it");

                if (dirty.battle_linkers[previous_battle_linker_index].socket_id) {
                    io.to(dirty.battle_linkers[previous_battle_linker_index].socket_id).emit('battle_linker_info',
                        { 'remove': 'true', 'battle_linker': dirty.battle_linkers[previous_battle_linker_index] });
                }

                if (dirty.battle_linkers[previous_battle_linker_index].being_attacked_socket_id) {
                    io.to(dirty.battle_linkers[previous_battle_linker_index].being_attacked_socket_id).emit('battle_linker_info',
                        { 'remove': true, 'battle_linker': dirty.battle_linkers[previous_battle_linker_index] });
                }

                // we need to send to the room as well
                if(typeof dirty.battle_linkers[previous_battle_linker_index].room !== 'undefined' && helper.notFalse(dirty.battle_linkers[previous_battle_linker_index].room)) {
                    io.to(dirty.battle_linkers[previous_battle_linker_index].room).emit('battle_linker_info', { 'remove': true, 'battle_linker': dirty.battle_linkers[previous_battle_linker_index] });
                }



                delete dirty.battle_linkers[previous_battle_linker_index];

            }
        }



    } catch (error) {
        log(chalk.red("Error in world.addBattleLinker: " + error));
        console.error(error);

    }


}

exports.addBattleLinker = addBattleLinker;

// Adding an object to a coord (galaxy)

async function addObjectToCoord(dirty, object_index, coord_index) {

    try {
        log(chalk.red("CALLING OUTDATED FUNCTION. Instead of this use world.insertObjectType and then game_object.place"));
        return false;
        console.log("Adding info to the galaxy coord");
        dirty.coords[coord_index].object_id = dirty.objects[object_index].id;
        dirty.coords[coord_index].object_type_id = dirty.objects[object_index].object_type_id;
        dirty.coords[coord_index].object_amount = 1;
        dirty.coords[coord_index].has_change = true;


        console.log("Adding info to the object");
        dirty.objects[object_index].coord_id = dirty.coords[coord_index].id;
        dirty.objects[object_index].has_change = true;

        //let new_object_type_index = dirty.object_types.findIndex(function(obj) { return obj && obj.id === dirty.objects[object_index].object_type_id; });

    } catch (error) {
        log(chalk.red("Error in addObjectToCoord: " + error));
    }



}
exports.addObjectToCoord = addObjectToCoord;

async function addObjectToPlanetCoord(dirty, object_index, planet_coord_index) {

    try {
        log(chalk.red("OUTDATED FUNCTION"));
        return false;
        log(chalk.cyan("Was passed in object_index: " + object_index + " planet_coord_index: " + planet_coord_index));


        if (!dirty.objects[object_index]) {
            log(chalk.red("Could not find this object in dirty"));

            dirty.objects.forEach(function (object, i) {
                console.log("Index: " + i + " Object id: " + object.id);
            });
            return false;
        }

        if (!dirty.planet_coords[planet_coord_index]) {
            log(chalk.red("Could not find this planet coord in dirty"));
            return false;
        }

        dirty.planet_coords[planet_coord_index].object_id = dirty.objects[object_index].id;
        dirty.planet_coords[planet_coord_index].object_type_id = dirty.objects[object_index].object_type_id;
        dirty.planet_coords[planet_coord_index].object_amount = 1;
        dirty.planet_coords[planet_coord_index].has_change = true;


        dirty.objects[object_index].planet_coord_id = dirty.planet_coords[planet_coord_index].id;
        dirty.objects[object_index].planet_id = dirty.planet_coords[planet_coord_index].planet_id;
        dirty.objects[object_index].has_change = true;

    } catch (error) {
        log(chalk.red("Error in world.addObjectToPlanetCoord: " + error));
    }



}
exports.addObjectToPlanetCoord = addObjectToPlanetCoord;

async function addObjectToShipCoord(dirty, object_index, ship_coord_index) {

    log(chalk.red("OUTDATED FUNCTION"));
    return false;

    dirty.ship_coords[ship_coord_index].object_id = dirty.objects[object_index].id;
    dirty.ship_coords[ship_coord_index].object_type_id = dirty.objects[object_index].object_type_id;
    dirty.ship_coords[ship_coord_index].object_amount = 1;
    dirty.ship_coords[ship_coord_index].has_change = true;


    dirty.objects[object_index].ship_coord_id = dirty.ship_coords[ship_coord_index].id;
    dirty.objects[object_index].ship_id = dirty.ship_coords[ship_coord_index].ship_id;
    dirty.objects[object_index].has_change = true;

}
exports.addObjectToShipCoord = addObjectToShipCoord;




/**
 * @param {Object} dirty
 * @param {number} player_index
 * @param {String} message
 * @param {Object} data
 * @param {number=} data.ship_id
 * @param {number=} data.planet_id
 * @param {number=} data.event_id
 * @param {String=} data.scope
 */
async function addPlayerLog(dirty, player_index, message, data = {}) {

    try {
        //console.log("In world.addPlayerLog");


        let player_id = 0;

        if(player_index !== -1 && dirty.players[player_index]) {
            player_id = dirty.players[player_index].id;
        }

        let sql = "INSERT INTO player_logs(player_id,message,month,year) VALUES(?,?,?,?)";
        let inserts = [player_id, message, dirty.galaxies[0].month, dirty.galaxies[0].year];

        let [result] = await (pool.query(sql, inserts));

        let new_player_log_id = result.insertId;

        if(data.ship_id) {
            let sql = "UPDATE player_logs SET ship_id = ? WHERE id = ?";
            let inserts = [data.ship_id, new_player_log_id];
    
            let [result] = await (pool.query(sql, inserts));
        }

        if(data.planet_id) {
            let sql = "UPDATE player_logs SET planet_id = ? WHERE id = ?";
            let inserts = [data.planet_id, new_player_log_id];
    
            let [result] = await (pool.query(sql, inserts));
        }

        if(data.event_id) {
            let sql = "UPDATE player_logs SET event_id = ? WHERE id = ?";
            let inserts = [data.event_id, new_player_log_id];
    
            let [result] = await (pool.query(sql, inserts));
        }

        if(data.scope) {
            let sql = "UPDATE player_logs SET scope = ? WHERE id = ?";
            let inserts = [data.scope, new_player_log_id];
    
            let [result] = await (pool.query(sql, inserts));
        }

        console.log("Done in world.addPlayerLog");

    } catch (error) {
        log(chalk.red("Error in world.addPlayerLog: " + error));
        console.error(error);
    }
}

exports.addPlayerLog = addPlayerLog;


/**
 * @param {Object} socket
 * @param {Object} dirty
 * @param {Object} data
 * @param {number} data.object_id
 * @param {String} data.new_rule
 * @param {Boolean=} data.allow Foribly allow the rule (e.g. used when creating ships)
 */
async function addRule(socket, dirty, data) {
    try {
        log(chalk.cyan("Got rule_data. Object id: " + data.object_id + " new rule: " + data.new_rule));

        // For now we are just going to have a master list
        let rule_values = [
            "allow_all_players", "allow_faction_players", "allow_creator", "allow_monsters", 
            "attack_all_players", "attack_all_players_except_creator", "attack_all_players_except_creator_faction",
            "building_no_others",
            "floor_no_others",
            "protect_all_players", "protect_creator", "protect_creator_property", "protect_self", "protect_players_from_players", "protect_players_from_monsters"
        ];

        // make sure the new rule is found in our array of rule values
        let in_array = false;
        for (let i = 0; i < rule_values.length; i++) {
            if (rule_values[i] === data.new_rule) {
                in_array = true;
            }
        }

        if (!in_array) {
            log(chalk.yellow("Was sent rule that isn't in our rule_values array: " + data.new_rule));
            return false;

        }

        // Make sure the socket player and the object player match
        let object_index = await game_object.getIndex(dirty, parseInt(data.object_id));

        if (object_index === -1) {
            log(chalk.yellow("Object index not found"));
            return false;

        }

        let can_add_rules = false;

        if(typeof data.allow !== 'undefined') {
            can_add_rules = true;
        } else if (helper.notFalse(socket) && dirty.players[socket.player_index].id === dirty.objects[object_index].player_id) {
            
            can_add_rules = true;
        }

        if(!can_add_rules) {
            log(chalk.yellow("Not that player's object to add rules for"));
            return false;
        }

        let sql = "INSERT INTO rules(object_id, rule) VALUES(?,?)";
        let inserts = [parseInt(data.object_id), data.new_rule];

        let [result] = await (pool.query(sql, inserts));

        let new_id = result.insertId;

        console.log("Inserted new rule id: " + new_id);


        let [rows, fields] = await (pool.query("SELECT * FROM rules WHERE id = ?", [new_id]));
        if (rows[0]) {
            let added_rule = rows[0];
            added_rule.has_change = false;
            dirty.rules.push(added_rule);

            let object_index = await game_object.getIndex(dirty, data.object_id);
            let object_info = await game_object.getCoordAndRoom(dirty, object_index);

            await sendRuleInfo(socket, object_info.room, dirty, added_rule.id);

            // Bit of extra work depending on the rule!

            // In the case of a protect_3_3 or protect_4_4 rule, we need to set that it is watching that area
            let split = data.new_rule.split("_");
            // For now, just protect in this
            if (split[0] !== "protect") {
                console.log("Not protect rule");
                return;
            }


            if (isNaN(split[1])) {
                console.log("Not numbered protect rule");
                return;
            }

            let protecting_radius = parseInt(split[1]);


            if (!object_info.room || object_info.room !== 'galaxy') {
                log(chalk.yellow("Currently only supporting in galaxy"));
            }

            let starting_tile_x = object_info.coord.tile_x - protecting_radius;
            let ending_tile_x = object_info.coord.tile_x + protecting_radius;
            let starting_tile_y = object_info.coord.tile_y - protecting_radius;
            let ending_tile_y = object_info.coord.tile_y + protecting_radius;

            for (let x = starting_tile_x; x <= ending_tile_x; x++) {
                for (let y = starting_tile_y; y <= ending_tile_y; y++) {
                    let coord_index = await main.getCoordIndex({ 'tile_x': x, 'tile_y': y });

                    if (coord_index !== -1 && !dirty.coords[coord_index].watched_by_object_id) {

                        main.updateCoordGeneric(socket, { 'coord_index': coord_index, 'watched_by_object_id': dirty.objects[object_index].id });
                    }
                }
            }


        }


    } catch (error) {
        log(chalk.red("Error in world.addRule: " + error));
        console.error(error);
    }

}

exports.addRule = addRule;

//  data:   area_id   |   planet_coord_id   |   ship_coord_id
async function addToArea(socket, dirty, data) {
    try {

        data.area_id = parseInt(data.area_id);
        data.planet_coord_id = parseInt(data.planet_coord_id);


        let area_index = await main.getAreaIndex(data.area_id);

        if (area_index === -1) {
            return false;
        }
        // make sure the socket owns the area
        if (dirty.areas[area_index].owner_id !== socket.player_id) {
            return false;
        }

        if (data.planet_coord_id) {
            let planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': data.planet_coord_id });

            if (planet_coord_index === -1) {
                return false;
            }

            dirty.planet_coords[planet_coord_index].area_id = dirty.areas[area_index].id;
            dirty.planet_coords[planet_coord_index].has_change = true;
        }

        if (data.ship_coord_id) {
            let ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': data.ship_coord_id });

            if (ship_coord_index === -1) {
                return false;
            }

            dirty.ship_coords[ship_coord_index].area_id = dirty.areas[area_index].id;
            dirty.ship_coords[ship_coord_index].has_change = true;
        }




    } catch (error) {
        log(chalk.red("Error in world.addToArea: " + error));
        console.error(error);
    }
}

exports.addToArea = addToArea;



/*
data:   ai_id   |   atacking_type   |   attacking_id
*/
/**
 *
 * @param {Object} dirty
 * @param {Object} data
 * @param {number} data.ai_id
 * @param {number} data.attacking_type
 * @param {number} data.attacking_id
 * @returns {Promise<boolean>}
 */
async function aiAttack(dirty, data) {

    try {

        let ai_index = await game_object.getIndex(dirty, data.ai_id);

        if (ai_index === -1) {
            return false;
        }

        if (dirty.objects[ai_index].energy < 100) {
            log(chalk.yellow("Not enough energy for any actions"));
            return false;
        }


        log(chalk.green("In battle.aiAttack. Having AI Attack type: " + data.attacking_type + " id: " + data.attacking_id));

        let energy_used = 100;
        let spawn_monster_type_id = 33;
        let spawn_monster_data = {};
        spawn_monster_data.attack_on_spawn_type = data.attacking_type;
        spawn_monster_data.attack_on_spawn_id = data.attacking_id;


        let scope = "";
        let room = "";
        let being_attacked_index = -1;
        let being_attacked_coord_index = -1;

        if(data.attacking_type === 'player') {
            being_attacked_index = await player.getIndex(dirty, { 'player_id': data.attacking_id });
        } else if(data.attacking_type === 'object') {
            being_attacked_index = await game_object.getIndex(dirty, data.attacking_id);
        } else if(data.attacking_type === 'monster') {
            being_attacked_index = await monster.getIndex(dirty, data.attacking_id);
        }

        if(being_attacked_index === -1) {
            log(chalk.yellow("Could not find what the AI is supposed to attack"));
            return false;
        }


        let origin_tile_x = -1;
        let origin_tile_y = -1;

        // Next up - find our scope and origin coord
        if(data.attacking_type === 'player' && dirty.players[being_attacked_index].planet_coord_id) {
            console.log("Set scope to planet");
            scope = 'planet';
            being_attacked_coord_index = await main.getPlanetCoordIndex(
                { 'planet_coord_id': dirty.players[being_attacked_index].planet_coord_id });
            if(being_attacked_coord_index === -1) {
                log(chalk.yellow("Could not find that planet coord"));
                return false;
            }
            origin_tile_x = dirty.planet_coords[being_attacked_coord_index].tile_x;
            origin_tile_y = dirty.planet_coords[being_attacked_coord_index].tile_y;

        } else if(data.attacking_type === 'player' && dirty.players[being_attacked_index].ship_coord_id) {
            console.log("Set scope to ship");
            scope = 'ship';
            being_attacked_coord_index = await main.getShipCoordIndex(
                { 'ship_coord_id': dirty.players[being_attacked_index].ship_coord_id });
            if(being_attacked_coord_index === -1) {
                log(chalk.yellow("Could not find that ship coord"));
                return false;
            }
            origin_tile_x = dirty.ship_coords[being_attacked_coord_index].tile_x;
            origin_tile_y = dirty.ship_coords[being_attacked_coord_index].tile_y;

        } else if(data.attacking_type === 'object' && dirty.objects[being_attacked_index].coord_id) {
            console.log("Set scope to galaxy");
            scope = 'galaxy';
            spawn_monster_type_id = 107;
            being_attacked_coord_index = await main.getCoordIndex({ 'coord_id': dirty.objects[being_attacked_index].coord_id });
            if(being_attacked_coord_index === -1) {
                log(chalk.yellow("Could not find that galaxy coord"));
                return false;
            }
            origin_tile_x = dirty.coords[being_attacked_coord_index].tile_x;
            origin_tile_y = dirty.coords[being_attacked_coord_index].tile_y;

        } else if(data.attacking_type === 'monster' && dirty.monsters[being_attacked_index].planet_coord_id) {
            console.log("Set scope to planet");
            scope = 'planet';
            being_attacked_coord_index = await main.getPlanetCoordIndex(
                { 'planet_coord_id': dirty.monsters[being_attacked_index].planet_coord_id });
            if(being_attacked_coord_index === -1) {
                log(chalk.yellow("Could not find that planet coord"));
                return false;
            }
            origin_tile_x = dirty.planet_coords[being_attacked_coord_index].tile_x;
            origin_tile_y = dirty.planet_coords[being_attacked_coord_index].tile_y;
        } else if(data.attacking_type === 'monster' && dirty.monsters[being_attacked_index].ship_coord_id) {
            console.log("Set scope to ship");
            scope = 'ship';
            being_attacked_coord_index = await main.getShipCoordIndex(
                { 'ship_coord_id': dirty.monsters[being_attacked_index].ship_coord_id });
            if(being_attacked_coord_index === -1) {
                log(chalk.yellow("Could not find that ship coord"));
                return false;
            }
            origin_tile_x = dirty.ship_coords[being_attacked_coord_index].tile_x;
            origin_tile_y = dirty.ship_coords[being_attacked_coord_index].tile_y;
        } else {

            console.log("Did not set scope");
            if(data.attacking_type === 'object') {
                console.log("galaxy/planet/ship coord_id: " + dirty.objects[being_attacked_index].coord_id + "," + dirty.objects[being_attacked_index].planet_coord_id +
                    "," + dirty.objects[being_attacked_index].ship_coord_id);
            }
        }

        console.log("Origin tile_x,y: " + origin_tile_x + "," + origin_tile_y);

        // Lets Find Our Coord!
        let placing_coord_index = -1;
        for(let x = origin_tile_x - 1; x <= origin_tile_x + 1 && placing_coord_index === -1; x++) {
            for(let y = origin_tile_y - 1; y <= origin_tile_y + 1 && placing_coord_index === -1; y++) {

                if(scope === 'planet') {
                    console.log("Checking planet x,y: " + x + "," + y);

                    let checking_data = {
                        'planet_id': dirty.planet_coords[being_attacked_coord_index].planet_id,
                        'planet_level': dirty.planet_coords[being_attacked_coord_index].level,
                        'tile_x': x, 'tile_y': y
                    };
                    let checking_planet_coord_index = await main.getPlanetCoordIndex(checking_data);

                    if (checking_planet_coord_index !== -1) {

                        let can_place_result = await monster.canPlace(dirty, 'planet',
                            dirty.planet_coords[checking_planet_coord_index],
                            { 'monster_type_id': spawn_monster_type_id });

                        if (can_place_result === true) {
                            placing_coord_index = checking_planet_coord_index;
                            spawn_monster_data.planet_coord_index = placing_coord_index;
                            room = "planet_" + dirty.planet_coords[checking_planet_coord_index].planet_id;

                        }

                    }

                } else if(scope === 'ship') {
                    console.log("Checking ship x,y: " + x + "," + y);

                    let checking_data = {
                        'ship_id': dirty.ship_coords[being_attacked_coord_index].ship_id,
                        'level': dirty.ship_coords[being_attacked_coord_index].level,
                        'tile_x': x, 'tile_y': y
                    };
                    let checking_ship_coord_index = await main.getShipCoordIndex(checking_data);

                    if (checking_ship_coord_index !== -1) {

                        let can_place_result = await monster.canPlace(dirty, 'ship',
                            dirty.ship_coords[checking_ship_coord_index],
                            { 'monster_type_id': spawn_monster_type_id });

                        if (can_place_result === true) {
                            placing_coord_index = checking_ship_coord_index;
                            spawn_monster_data.ship_coord_index = placing_coord_index;
                            room = "ship_" + dirty.ship_coords[checking_ship_coord_index].ship_id;

                        }

                    }

                } else if(scope === 'galaxy') {
                    console.log("Checking galaxy x,y: " + x + "," + y);
                    let checking_data = {
                        'tile_x': x, 'tile_y': y
                    };
                    let checking_coord_index = await main.getCoordIndex(checking_data);

                    if (checking_coord_index !== -1) {

                        let can_place_result = await monster.canPlace(dirty, 'galaxy',
                            dirty.coords[checking_coord_index],
                            { 'monster_type_id': spawn_monster_type_id });

                        if (can_place_result === true) {
                            placing_coord_index = checking_coord_index;
                            spawn_monster_data.coord_index = placing_coord_index;
                            room = "galaxy";

                        }

                    }

                } else {
                    log(chalk.yellow("No scope?"));
                }

            }
        }

        // If we can't place, open up a rift in FREAKING SPACE TIME AND GRAVITY THE CLEVER GIRL!
        if(placing_coord_index === -1) {
            log(chalk.cyan("AI IS DIRECLTY DOING DAMAGE BABY!! BUG OR CLEVER PLAYER!?!"));

            // AI attacks directly without using an edifice. 
            if(data.attacking_type === 'player') {
                player.damage(dirty, { 'player_index': being_attacked_index, 'damage_amount': 50, 'damage_types': [] });
            } else if(data.attacking_type === 'object') {
                let object_info = await game_object.getCoordAndRoom(dirty, being_attacked_index);
                game_object.damage(dirty, being_attacked_index, 50, { 'object_info': object_info });
            } else if(data.attacking_type === 'monster') {
                monster.damage(dirty, being_attacked_index, 50, {});
            }
            return false;
        }



        // The potential for escalation!
        // TODO eventually we should just 'attach' the AI core count to AIs like we do with ships to save on lookups
        if(data.attack_level === 2 && dirty.objects[ai_index].energy >= 500 && (scope === 'planet' || scope === 'ship') ) {
            let ai_core_count = 0;

            for(let i = 0; i < dirty.objects.length && ai_core_count < 1; i++ ) {
                if(dirty.objects[i] && dirty.objects[i].object_type_id === 162) {

                    if(dirty.objects[ai_index].planet_coord_id && dirty.objects[i].planet_id === dirty.objects[ai_index].planet_id) {
                        ai_core_count++;

                    } else if (dirty.objects[ai_index].ship_coord_id && dirty.objects[i].ship_id === dirty.objects[ai_index].ship_id) {
                        ai_core_count++;
                    }

                }
            }

            if(ai_core_count >= 1) {
                spawn_monster_type_id = 57;
                energy_used = 500;
                log(chalk.green("Set to spawn edifice"));

            }
            
        }


        spawn_monster_data.ai_id = dirty.objects[ai_index].id;
        monster.spawn(dirty, spawn_monster_type_id, spawn_monster_data);



        dirty.objects[ai_index].energy -= energy_used;
        dirty.objects[ai_index].has_change = true;

        // send the updated ai (object) info to the room
        console.log("Sending updated ai info to room");
        await game_object.sendInfo(false, room, dirty, ai_index);



    } catch (error) {
        log(chalk.red("Error in world.aiAttack: " + error));
        console.error(error);
    }

}

exports.aiAttack = aiAttack;


/* OLD FUNCTION
data:   ai_id   |   atacking_type   |   attacking_id
*/
/**
 *
 * @param dirty
 * @param data
 * @param {number} data.ai_id
 * @param {number} data.attacking_type
 * @param {number} data.attacking_id
 * @returns {Promise<boolean>}
 */
/*
async function aiAttack(dirty, data) {

    try {

        log(chalk.green("In battle.aiAttack. Having AI Attack type: " + data.attacking_type + " id: " + data.attacking_id));


        let ai_index = await game_object.getIndex(dirty, data.ai_id);

        if (ai_index === -1) {
            return false;
        }

        if (dirty.objects[ai_index].energy < 100) {
            log(chalk.yellow("Not enough energy for any actions"));
            return false;
        }



        let energy_used = 100;
        let spawn_monster_type_id = 33;
        let spawn_monster_data = {};

        // If we have AI Cores, and more energy, we can try and spawn an edifice
        if (data.attack_level === 2 && dirty.objects[ai_index].energy >= 500) {
            // lets see if there are enough AI Cores to spawn the higher level defense/attack
            let ai_core_count = 0;
            let ai_cores = dirty.objects.filter(object => object.object_type_id === 162 && object.planet_id === dirty.objects[ai_index].planet_id);

            for (let ai_core of ai_cores) {
                ai_core_count++;
            }

            console.log("Got AI core count: " + ai_core_count);

            if (ai_core_count >= 1) {
                spawn_monster_type_id = 57;
                energy_used = 500;
                log(chalk.green("Set to spawn edifice"));

            } else {
                log(chalk.yellow("Not enough cores for edifice"));
            }

        }

        let placing_planet_coord_index = -1;
        let placing_ship_coord_index = -1;
        let placing_coord_index = -1;
        let found_planet_coord = false;
        let found_ship_coord = false;
        let room = false;



        if (data.attacking_type === 'player') {

            //console.log("AI spawning monster on player");

            spawn_monster_data.attack_on_spawn_type = 'player';
            spawn_monster_data.attack_on_spawn_id = data.attacking_id;

            let being_attacked_index = await player.getIndex(dirty, { 'player_id': data.attacking_id });

            if (dirty.objects[ai_index].planet_coord_id) {
                let being_attacked_planet_coord_index = await main.getPlanetCoordIndex(
                    { 'planet_coord_id': dirty.players[being_attacked_index].planet_coord_id });

                if (being_attacked_planet_coord_index === -1) {
                    log(chalk.yellow("Could not find planet coord of the thing we are attacking"));
                    return false;
                }



                // we need to try and find a cord around the thing being attacked where we can put the
                // monster that the AI spawns.
                for (let x = dirty.planet_coords[being_attacked_planet_coord_index].tile_x - 1;
                    x <= dirty.planet_coords[being_attacked_planet_coord_index].tile_x + 1; x++) {
                    for (let y = dirty.planet_coords[being_attacked_planet_coord_index].tile_y - 1;
                        y <= dirty.planet_coords[being_attacked_planet_coord_index].tile_y + 1; y++) {

                        //console.log("Checking x,y: " + x + "," + y);

                        if (found_planet_coord === false) {
                            // (   planet_id   |   planet_level   |   tile_x   |   tile_y   )
                            let checking_data = {
                                'planet_id': dirty.planet_coords[being_attacked_planet_coord_index].planet_id,
                                'planet_level': dirty.planet_coords[being_attacked_planet_coord_index].level,
                                'tile_x': x, 'tile_y': y
                            };
                            let checking_planet_coord_index = await main.getPlanetCoordIndex(checking_data);

                            if (checking_planet_coord_index !== -1) {

                                let can_place_result = await main.canPlaceMonster('planet',
                                    dirty.planet_coords[checking_planet_coord_index],
                                    { 'monster_type_id': spawn_monster_type_id });

                                if (can_place_result) {
                                    placing_planet_coord_index = checking_planet_coord_index;
                                    spawn_monster_data.planet_coord_id = dirty.planet_coords[placing_planet_coord_index].id;
                                    room = "planet_" + dirty.objects[ai_index].planet_id;
                                    found_planet_coord = true;
                                }

                            }
                        }


                    }
                }

            } else if (dirty.objects[ai_index].ship_coord_id) {

                let being_attacked_ship_coord_index = await main.getShipCoordIndex(
                    { 'ship_coord_id': dirty.players[being_attacked_index].ship_coord_id });

                if (being_attacked_ship_coord_index === -1) {
                    log(chalk.yellow("Could not find ship coord of the thing we are attacking"));
                    return false;
                }



                // we need to try and find a cord around the thing being attacked where we can put the
                // monster that the AI spawns.
                for (let x = dirty.ship_coords[being_attacked_ship_coord_index].tile_x - 1;
                    x <= dirty.ship_coords[being_attacked_ship_coord_index].tile_x + 1; x++) {
                    for (let y = dirty.ship_coords[being_attacked_ship_coord_index].tile_y - 1;
                        y <= dirty.ship_coords[being_attacked_ship_coord_index].tile_y + 1; y++) {

                        console.log("Checking x,y: " + x + "," + y);

                        if (found_ship_coord === false) {
                            // (   ship_id   |   tile_x   |   tile_y   )
                            let checking_data = {
                                'ship_id': dirty.ship_coords[being_attacked_ship_coord_index].ship_id,
                                'level': dirty.ship_coords[being_attacked_ship_coord_index].level,
                                'tile_x': x, 'tile_y': y
                            };
                            let checking_ship_coord_index = await main.getShipCoordIndex(checking_data);

                            if (checking_ship_coord_index !== -1) {

                                let can_place_result = await main.canPlaceMonster('ship', dirty.ship_coords[checking_ship_coord_index],
                                    { 'monster_type_id': spawn_monster_type_id });


                                if (can_place_result) {
                                    placing_ship_coord_index = checking_ship_coord_index;
                                    spawn_monster_data.ship_coord_id = dirty.ship_coords[placing_ship_coord_index].id;
                                    room = "ship_" + dirty.ship_coords[being_attacked_ship_coord_index].ship_id;
                                    found_ship_coord = true;
                                }

                            }
                        }


                    }
                }
            }


        }

        if (!found_planet_coord && !found_ship_coord) {
            log(chalk.yellow("Did not find a coord for the monsters to spawn on"));
            return false;
        }


        log(chalk.cyan("Before spawnMonster function spawning monster type id: " + spawn_monster_type_id));

        spawnMonster(dirty, spawn_monster_type_id, spawn_monster_data);



        dirty.objects[ai_index].energy -= energy_used;
        dirty.objects[ai_index].has_change = true;

        // send the updated ai (object) info to the room
        console.log("Sending updated ai info to room");
        await game_object.sendInfo(false, room, dirty, ai_index);

    } catch (error) {
        log(chalk.red("Error in battle.aiAttack: " + error));
        console.error(error);
    }

}

exports.aiAttack = aiAttack;

*/


// Higher leve, more generic function than aiAttack. This is mean to see if we start retaliating against something
async function aiRetaliate(dirty, ai_index, attacking_type, attacking_id) {

    try {
        // AI is going to hit back the thing that violated its rules
        // Make sure that the AI isn't already engaged with this person
        let existing_attack_linkers = dirty.battle_linkers.filter(filtered => filtered.being_attacked_type === attacking_type &&
            filtered.being_attacked_id === attacking_id && filtered.attacking_type === 'monster');
        let already_attacking = false;

        for (let linker of existing_attack_linkers) {
            let monster_index = await monster.getIndex(dirty, linker.attacking_id);
            if (dirty.monsters[monster_index].monster_type_id === 33 || dirty.monsters[monster_index].monster_type_id === 57) {
                already_attacking = true;
            }
        }

        if (!already_attacking) {
            // and try and attack the attacking player
            let attack_data = {
                'ai_id': dirty.objects[ai_index].id,
                'attacking_type': attacking_type,
                'attacking_id': attacking_id
            };

            aiAttack(dirty, attack_data);
        } else {
            //console.log("AI is already attacking.");
        }
    } catch(error) {
        log(chalk.red("Error in world.aiRetaliate: " + error));
        console.error(error);
    }


}

exports.aiRetaliate = aiRetaliate;


// Used to associate the engine with the ship, so that we can easily add fuel, remove fuel from the engine objects
// as the ship moves around, as well as calculate speed
async function attachShipEngines(dirty, ship_index) {

    try {

        //console.time("attachShipEngines");

        let engine_object_type_ids = [];
        for(let i = 0; i < dirty.object_types.length; i++) {
            if(dirty.object_types[i] && dirty.object_types[i].is_ship_engine) {
                engine_object_type_ids.push(dirty.object_types[i].id);
            }
        }

        // Go through all the ship coords in dirty, finding engines
        let engine_indexes = [];
        let total_engine_power = 0;


        let current_engine_energy = 0;
        let max_engine_energy = 0;

        for (let i = 0; i < dirty.ship_coords.length; i++) {
            if (dirty.ship_coords[i] && dirty.ship_coords[i].ship_id === dirty.objects[ship_index].id && 
                engine_object_type_ids.indexOf(dirty.ship_coords[i].object_type_id) !== -1) {

                let drive_index = await game_object.getIndex(dirty, dirty.ship_coords[i].object_id);

                if (drive_index !== -1) {

                    engine_indexes.push(drive_index);

                    let drive_object_type_index = main.getObjectTypeIndex(dirty.ship_coords[i].object_type_id);
                    if(drive_object_type_index !== -1) {
                        total_engine_power += dirty.object_types[drive_object_type_index].engine_power;
                        current_engine_energy += dirty.objects[drive_index].energy;
                        max_engine_energy += dirty.object_types[drive_object_type_index].max_energy_storage;

                        // and why not let the drive know it's attached to the ship too
                        dirty.objects[drive_index].is_engine_for_ship_index = ship_index;
                    }

                } else {
                    console.log("Could not find ion drive to refuel");
                }

            }
        }

        dirty.objects[ship_index].engine_indexes = engine_indexes;
        dirty.objects[ship_index].current_engine_power = total_engine_power;
        dirty.objects[ship_index].current_engine_energy = current_engine_energy;
        dirty.objects[ship_index].max_engine_energy = max_engine_energy;

        //console.log("Set current_engine_power to: " + dirty.objects[ship_index].current_engine_power);

        //console.timeEnd("attachShipEngines");

    } catch (error) {
        log(chalk.red("Error in world.attachShipEngines: " + error));
        console.error(error);
    }
}

exports.attachShipEngines = attachShipEngines;


/**
 * @param {Object} socket
 * @param {Object} dirty
 * @param {number} area_id
 * @param {Object} data
 * @param {String=} data.new_name
 * @param data.put_on_market
 * @param {Boolean=} data.auto_market
 */
async function changeArea(socket, dirty, area_id, data) {
    try {

        if (isNaN(area_id)) {
            return false;
        }

        let area_index = await main.getAreaIndex(area_id);

        if (area_index === -1) {
            return false;
        }

        // Only the area owner can change it
        if (socket.player_id !== dirty.areas[area_index].owner_id) {
            log(chalk.yellow("Hacking area attempt"));
            return false;
        }


        if (data.new_name) {

            if (socket.player_id !== dirty.areas[area_index].owner_id) {
                return false;
            }

            console.log("Owner is renaming an area. New name: " + data.new_name);

            data.new_name = helper.cleanStringInput(data.new_name);

            console.log("New name after we clean it: " + data.new_name);

            dirty.areas[area_index].name = data.new_name;
            dirty.areas[area_index].has_change = true;

            socket.emit('area_info', { 'area': dirty.areas[area_index] });


        }

        if(typeof data.auto_market !== "undefined") {
            if(data.auto_market) {
                dirty.areas[area_index].auto_market = true;
            } else {
                dirty.areas[area_index].auto_market = false;
            }
            dirty.areas[area_index].has_change = true;
        }

        if (data.put_on_market) {

            // Can't already have a renting player id
            if (dirty.areas[area_index].renting_player_id) {
                log(chalk.yellow("Can't put an area with a renting player on the market"));
                // TODO send this info back to the socket
                return false;
            }

            let in_a_week_timestamp_seconds = Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000);
            // Doesn't work in this instance
            //in_a_week_timestamp.toISOString().slice(0, 19).replace('T', ' ');

            // Insert a market linker
            let [result] = await (pool.query("INSERT INTO market_linkers(area_id, planet_id, ship_id, ending_at)VALUES(?,?,?,?)",
                [dirty.areas[area_index].id, dirty.areas[area_index].planet_id, dirty.areas[area_index].ship_id, in_a_week_timestamp_seconds]));

            if (result) {
                let new_market_linker_id = result.insertId;
                console.log("Got new market linker id: " + new_market_linker_id);

                let [rows, fields] = await (pool.query("SELECT * FROM market_linkers WHERE id = ?", [new_market_linker_id]));
                if (rows[0]) {
                    let market_linker = rows[0];
                    market_linker.has_change = false;
                    let market_linker_index = dirty.market_linkers.push(market_linker) - 1;

                    socket.emit('market_linker_info', { 'market_linker': dirty.market_linkers[market_linker_index] });




                }
            }


        }
    } catch (error) {
        log(chalk.red("Error in world.changeArea: " + error));
        console.error(error);
    }
}

exports.changeArea = changeArea;


//  data:   (planet_coord_index   |   coord_index   |   ship_coord_index)   |   floor_type_id
async function changeFloor(dirty, data) {
    try {

        if (typeof data.floor_type_id === "undefined") {
            log(chalk.yellow("Not floor type id passed into world.changeFloor"));
            return false;
        }

        // Lets verify we can find that floor type
        let floor_type_index = main.getFloorTypeIndex(data.floor_type_id);

        if (floor_type_index === -1) {
            log(chalk.yellow("Could not find that floor type"));
            return false;
        }

        let room = "";

        if (typeof data.planet_coord_index !== "undefined") {
            //console.log("Changing floor type id to: " + floor_type_id);
            dirty.planet_coords[data.planet_coord_index].floor_type_id = dirty.floor_types[floor_type_index].id;
            dirty.planet_coords[data.planet_coord_index].has_change = true;

            io.to("planet_" + dirty.planet_coords[data.planet_coord_index].planet_id).emit('planet_coord_info', { 'planet_coord': dirty.planet_coords[data.planet_coord_index] });
        } else if (typeof data.ship_coord_index !== "undefined") {
            dirty.ship_coords[data.ship_coord_index].floor_type_id = dirty.floor_types[floor_type_index].id;
            dirty.ship_coords[data.ship_coord_index].has_change = true;
            io.to("ship_" + dirty.ship_coords[data.ship_coord_index].ship_id).emit('ship_coord_info', { 'ship_coord': dirty.ship_coords[data.ship_coord_index] });
        } else if (typeof data.coord_index !== "undefined") {
            dirty.coords[data.coord_index].floor_type_id = dirty.floor_types[floor_type_index].id;
            dirty.coords[data.coord_index].has_change = true;
            io.to("galaxy").emit('coord_info', { 'coord': dirty.coords[data.coord_index] });
        }



        // send the new planet coord info to the room

    } catch (error) {
        log(chalk.red("Error in world.changeFloor: " + error));
        console.error(error);
    }


}

exports.changeFloor = changeFloor;


// Right now this function is assuming that it's being called on things the monster is supposed
// to potentially attack
async function checkMonsterBattleConditions(dirty, monster_id, checking_type, checking_id, socket = false) {

    try {
        //log(chalk.green("Checking monster id: " + monster_id + " against " + checking_type + " id: " + checking_id));
        let monster_index = await monster.getIndex(dirty, monster_id);

        if (monster_index === -1) {
            log(chalk.yellow("Could not find monster"));
            return false;
        }

        let monster_type_index = dirty.monster_types.findIndex(function (obj) { return obj && obj.id === dirty.monsters[monster_index].monster_type_id; });

        if (monster_type_index === -1) {
            log(chalk.yellow("Could not find monster type"));
            return false;
        }

        if(!dirty.monster_types[monster_type_index].auto_attack) {
            //console.log("Monster type does not auto attack");
            return false;
        }


        //log(chalk.cyan("Monster auto attacks"));

        // see if the monster is already attacking something
        let battle_linker_index = dirty.battle_linkers.findIndex(function (obj) {
            return obj && obj.attacking_id === monster_id &&
                obj.attacking_type === 'monster';
        });

        // Monster is already attacking something
        if (battle_linker_index !== -1) {
            //console.log("Monster is already attacking something");
            return false;
        }


        //console.log("Monster is not attacking something yet");

        let can_attack = true;

        let player_index = -1;

        // If the monster is trying to attack a player, make sure the player isn't on a spaceport tile
        if (checking_type === 'player') {
            player_index = await player.getIndex(dirty, { 'player_id': checking_id });

            if(player_index === -1) {
                log(chalk.yellow("Could not find the player"));
                return false;
            }


            if(dirty.monsters[monster_index].planet_coord_id) {
                let player_coord_index = await player.getCoordIndex(dirty, player_index, 'planet');
                //let player_coord_index = await main.getPlanetCoordIndex(
                //    { 'planet_coord_id': dirty.players[player_index].planet_coord_id });

                if (player_coord_index !== -1) {
                    if (dirty.planet_coords[player_coord_index].floor_type_id === 11 || dirty.planet_coords[player_coord_index].floor_type_id === 44) {
                        //console.log("Player is on spaceport");
                        can_attack = false;
                    }
                }
            } 

               

        }

        if (!can_attack) {
            //console.log("Can't attack");
            return false;
        }


        let monster_info = await monster.getCoordAndRoom(dirty, monster_index);


        //console.log("Monster is not yet attacking anything. Poor " + checking_type + " ;)");

        let battle_linker_data = {
            'id': uuidv1(),
            'attacking_id': monster_id, 'attacking_type': 'monster', 'being_attacked_id': checking_id,
            'being_attacked_type': checking_type,
            'room': monster_info.room,
            'turn_count': 0
        };

        let player_socket = getPlayerSocket(dirty, player_index);

        if (helper.notFalse(player_socket)) {
            battle_linker_data.being_attacked_socket_id = player_socket.id;
        }

        let new_battle_linker_index = dirty.battle_linkers.push(battle_linker_data) - 1;

        if (helper.notFalse(player_socket)) {
            player_socket.emit('battle_linker_info', { 'battle_linker': dirty.battle_linkers[new_battle_linker_index] });

            // We could uncomment this to have the monster auto INSTA attack the player
            //battle.monsterAttackPlayer(dirty, dirty.battle_linkers[new_battle_linker_index]);
        }


    } catch (error) {
        log(chalk.red("Error in world.checkMonsterBattleConditions: " + error));
        console.error(error);
    }


}

exports.checkMonsterBattleConditions = checkMonsterBattleConditions;

async function checkObjectBattleConditions(socket, dirty, object_id, checking_type, checking_id) {
    try {

        let object_index = await game_object.getIndex(dirty, object_id);

        if (object_index === -1) {
            return false;
        }

        let object_type_index = main.getObjectTypeIndex(dirty.objects[object_index].object_type_id);

        if (object_type_index === -1) {
            return false;
        }

        if (!dirty.object_types[object_type_index].can_have_rules) {
            return false;
        }

        // see if the object is already attacking something
        let battle_linker_index = dirty.battle_linkers.findIndex(function (obj) {
            return obj &&
                obj.attacking_id === dirty.objects[object_index].id &&
                obj.attacking_type === 'object';
        });

        // Object is already attacking something
        if (battle_linker_index !== -1) {
            return false;
        }




        let player_index = -1;
        let player_info = {};
        if (checking_type === 'player') {
            player_index = await player.getIndex(dirty, { 'player_id': checking_id });

            if (player_index === -1) {
                log(chalk.yellow("Could not find the player"));
                return false;
                
            }

            player_info = await player.getCoordAndRoom(dirty, player_index);

            // If the player is on a spaceport tile, we won't be able to attack the player
            if (player_info.coord && (player_info.coord.floor_type_id === 11 || player_info.coord.floor_type_id === 44) ) {
                return false;
            }
        }

        // get any rules that the object has
        let object_rules = dirty.rules.filter(rule => rule.object_id === dirty.objects[object_index].id);

        // Go through the rules!
        let try_attacking = false;
        for (let rule of object_rules) {


            if (checking_type === 'player' && rule.rule === "attack_all_players") {
                try_attacking = true;
            }

            if (checking_type === 'player' && rule.rule === "attack_all_players_except_creator") {
                if (dirty.players[player_index].id !== dirty.objects[object_index].player_id) {
                    try_attacking = true;
                }
            }

            // TODO FACTION CHECK
        }

        if (!try_attacking) {
            return false;
        }



        let battle_linker_data = {
            'id': uuidv1(),
            'attacking_id': object_id, 'attacking_type': 'object', 'being_attacked_id': checking_id,
            'being_attacked_type': checking_type,
            'room': player_info.room,
            'turn_count': 0
        };

        if (socket !== false) {
            battle_linker_data.being_attacked_socket_id = socket.id;
        }

        let new_battle_linker_index = dirty.battle_linkers.push(battle_linker_data) - 1;

        if (socket) {
            socket.emit('battle_linker_info', { 'battle_linker': dirty.battle_linkers[new_battle_linker_index] });
        }


    } catch (error) {
        log(chalk.red("Error in world.checkObjectBattleConditions: " + error));
    }
}

exports.checkObjectBattleConditions = checkObjectBattleConditions;


//  data:   object_type_id   |   planet_coord_id   |   amount
async function checkPlanetImpact(dirty, data) {

    try {

        let planet_index = -1;


        if (data.planet_coord_id) {
            let planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': parseInt(data.planet_coord_id) });
            if (planet_coord_index !== -1) {
                planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.planet_coords[planet_coord_index].planet_id });
            }
        }

        if (planet_index === -1) {
            log(chalk.yellow("Was unable to find the planet"));
            return false;
        }


        // try and find a matching linker
        let linker_index = dirty.planet_type_impact_linkers.findIndex(function (obj) {
            return obj &&
                obj.planet_type_id === dirty.planets[planet_index].planet_type_id && obj.object_type_id === parseInt(data.object_type_id);
        });

        if (linker_index === -1) {
            console.log("No impact linker");
            return false;
        }


        dirty.planets[planet_index].current_hp += dirty.planet_type_impact_linkers[linker_index].hp_change;

        if (dirty.planets[planet_index].current_hp < 0) {
            dirty.planets[planet_index].current_hp = 0;
        } else if (dirty.planets[planet_index].current_hp > dirty.planets[planet_index].max_hp) {
            dirty.planets[planet_index].current_hp = dirty.planets[planet_index].max_hp;
        }
        dirty.planets[planet_index].has_change = true;


    } catch (error) {
        log(chalk.red("Error in world.checkPlanetImpact: " + error));
        console.error(error);
    }
}

exports.checkPlanetImpact = checkPlanetImpact;

function complexityCheck(level, complexity) {

    // If the player's surgery level is high enough, it's just gonna work
    if (level >= complexity) {
        return true;
    } else {
        let failure_max = complexity - level;
        let rand_result = helper.getRandomIntInclusive(1, 10);

        if (rand_result <= failure_max) {

        } else {

            return true;
        }
    }

    return false;
}

exports.complexityCheck = complexityCheck;


//  data:   planet_index   |   planet_type_index   |   connecting_level
async function connectLevel(socket, dirty, data) {

    try {

        console.log("In world.connectLevel");

        if (!socket.is_admin) {
            log(chalk.red("We think a socket with player id: " + socket.player_id + " is trying to be mr hacker WOman"));
            return false;
        }

        let size_underground = dirty.planet_types[data.planet_type_index].size_underground;

        let level_x_size = dirty.planet_types[data.planet_type_index].x_size_above;
        let level_y_size = dirty.planet_types[data.planet_type_index].y_size_above;
        let starting_x_offset = 0;
        let starting_y_offset = 0;

        if (data.connecting_level < 0) {
            level_x_size = dirty.planet_types[data.planet_type_index].x_size_under;
            level_y_size = dirty.planet_types[data.planet_type_index].y_size_under;

            if (dirty.planet_types[data.planet_type_index].x_size_above > dirty.planet_types[data.planet_type_index].x_size_under) {
                starting_x_offset = (dirty.planet_types[data.planet_type_index].x_size_above - dirty.planet_types[data.planet_type_index].x_size_under) / 2;
            }
            if (dirty.planet_types[data.planet_type_index].y_size_above > dirty.planet_types[data.planet_type_index].y_size_under) {
                starting_y_offset = (dirty.planet_types[data.planet_type_index].y_size_above - dirty.planet_types[data.planet_type_index].y_size_under) / 2;
            }
        }




        // So the grid is going to be the base size. We will have to translate the actual planet coords
        // back and forth due to the offset
        let grid = new PF.Grid(level_x_size, level_y_size);


        // First step is to find a non-walled coord
        // and then make sure it can go to any other non walled coord
        let base_coord_index = -1;
        for (let x = starting_x_offset; x < level_x_size + starting_x_offset; x++) {
            for (let y = starting_y_offset; y < level_y_size + starting_y_offset; y++) {

                let planet_coord_index = await main.getPlanetCoordIndex({
                    'planet_id': dirty.planets[data.planet_index].id,
                    'planet_level': data.connecting_level, 'tile_x': x, 'tile_y': y
                });

                if (base_coord_index === -1) {

                    if (planet_coord_index !== -1 && dirty.planet_coords[planet_coord_index].object_type_id !== dirty.planet_types[data.planet_type_index].wall_object_type_id) {
                        base_coord_index = planet_coord_index;
                    }
                }

                //grid.setWalkableAt(x, y, true);

                if (dirty.planet_coords[planet_coord_index].object_type_id === dirty.planet_types[data.planet_type_index].wall_object_type_id) {
                    grid.setWeightAt(x - starting_x_offset, y - starting_y_offset, 10);
                }


            }
        }

        //console.log("Our base coord tile_x/y: " + dirty.planet_coords[base_coord_index].tile_x + "/" + dirty.planet_coords[base_coord_index].tile_y);


        let finder = new PF.AStarFinder();

        let grid_backup = grid;


        for (let x = starting_x_offset; x < level_x_size + starting_x_offset; x++) {
            for (let y = starting_y_offset; y < level_y_size + starting_y_offset; y++) {

                let planet_coord_index = await main.getPlanetCoordIndex({
                    'planet_id': dirty.planets[data.planet_index].id,
                    'planet_level': data.connecting_level, 'tile_x': x, 'tile_y': y
                });


                // See how our base coord gets to this coord
                if (dirty.planet_coords[planet_coord_index].object_type_id !== dirty.planet_types[data.planet_type_index].wall_object_type_id &&
                    planet_coord_index !== base_coord_index) {

                    //console.log("Need to find path to " + dirty.planet_coords[planet_coord_index].tile_x + ", " + dirty.planet_coords[planet_coord_index].tile_y);

                    let path = finder.findPath(dirty.planet_coords[base_coord_index].tile_x - starting_x_offset, dirty.planet_coords[base_coord_index].tile_y - starting_y_offset,
                        dirty.planet_coords[planet_coord_index].tile_x - starting_x_offset, dirty.planet_coords[planet_coord_index].tile_y - starting_y_offset, grid);

                    //console.log(path);



                    // For any walled off tiles we went through, we need to unwall them
                    for (let p = 0; p < path.length; p++) {
                        let path_x = path[p][0];
                        let path_y = path[p][1];

                        //console.log("We went through tile_x,tile_y: " + path_x + "," + path_y);

                        let path_coord_index = await main.getPlanetCoordIndex({
                            'planet_id': dirty.planets[data.planet_index].id,
                            'planet_level': data.connecting_level, 'tile_x': path_x + starting_x_offset, 'tile_y': path_y + starting_y_offset
                        });

                        if (dirty.planet_coords[path_coord_index].object_type_id === dirty.planet_types[data.planet_type_index].wall_object_type_id) {
                            console.log("Removing wall at tile_x/y: " + path_x + "/" + path_y);
                            dirty.planet_coords[path_coord_index].object_type_id = false;
                            dirty.planet_coords[path_coord_index].has_change = true;

                            // and update the backup grid with the new weight
                            grid_backup.setWeightAt(path_x, path_y, 1);

                        }
                    }


                    // apparently the finder modifies the grid, so we have to reset it afterward
                    grid = grid_backup.clone();
                    //grid = grid_backup;
                }


            }
        }

    } catch (error) {
        log(chalk.red("Error in world.connectLevel: " + error));
        console.error(error);
    }
}

exports.connectLevel = connectLevel;


//  data:   coord_floor_type_ids   |   coord_monster_type_ids   |   coord_object_type_ids   |   level   |   tile_x
//          tile_y
async function createPlanetCoord(socket, dirty, data) {
    try {

        if (!socket.is_admin) {
            log(chalk.red("We think a socket with player id: " + socket.player_id + " is trying to be mr hacker man"));
            return false;
        }


        // Lets do a basic insert, and add things once we have the planet coord
        let sql = " INSERT INTO planet_coords(planet_id, level, tile_x, tile_y)VALUES(?, ? ,? ,?)";
        let inserts = [data.planet_id, data.level, data.tile_x, data.tile_y];

        let [result] = await (pool.query(sql, inserts));

        let new_id = result.insertId;

        let new_planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': new_id });

        // get a random floor
        let floor_type_id = data.coord_floor_type_ids[Math.floor(Math.random() * data.coord_floor_type_ids.length)];
        //console.log("Chose floor type id: " + floor_type_id);

        dirty.planet_coords[new_planet_coord_index].floor_type_id = floor_type_id;

        // and get more info about the floor type
        let floor_type_index = main.getFloorTypeIndex(floor_type_id);


        // We are being forced into a specific object type id ( generally a wall )
        if (data.object_type_id) {
            dirty.planet_coords[new_planet_coord_index].object_type_id = data.object_type_id;
        }

        if (floor_type_index === -1) {
            log(chalk.yellow("Don't have a floor type. data.coord_floor_type_ids was: "));
            console.log(data.coord_floor_type_ids);
            return false;
        }



        dirty.planet_coords[new_planet_coord_index].has_change = true;


    } catch (error) {
        log(chalk.red("Error in world.createPlanetCoord: " + error));
        console.error(error);
    }
}


/**
 * @param {Object} dirty
 * @param {number} ship_index
 * @param {Object} linker
 * @param {Object=} data
 * @param {number=} data.spawned_event_id
 */
async function createShipCoord(dirty, ship_index, linker, data = {}) {

    try {
        let sql = "";
        let inserts = [];

        let linker_object_type_index = -1;
        if (linker.object_type_id) {
            linker_object_type_index = main.getObjectTypeIndex(linker.object_type_id);

        }


        if (linker.spawns_monster_type_id) {
            sql = "INSERT INTO ship_coords(ship_id, tile_x, tile_y, level, object_type_id, floor_type_id, " +
                "is_engine_hardpoint, is_weapon_hardpoint, spawns_monster_type_id) VALUES(?,?,?,?,?,?,?,?,?)";
            inserts = [dirty.objects[ship_index].id, linker.position_x, linker.position_y, linker.level, linker.object_type_id, linker.floor_type_id,
            linker.is_engine_hardpoint, linker.is_weapon_hardpoint, linker.spawns_monster_type_id];

        } else {

            sql = "INSERT INTO ship_coords(ship_id, tile_x, tile_y, level, object_type_id, floor_type_id, is_engine_hardpoint, is_weapon_hardpoint) VALUES(?,?,?,?,?,?,?,?)";
            inserts = [dirty.objects[ship_index].id, linker.position_x, linker.position_y, linker.level, linker.object_type_id, linker.floor_type_id, linker.is_engine_hardpoint, linker.is_weapon_hardpoint];


        }


        let [result] = await (pool.query(sql, inserts));

        // Get the ID of the inserted ship coord
        let new_ship_coord_id = result.insertId;
        let new_ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': new_ship_coord_id });

        // We have a monster that we need to create, and add to the ship coord
        if (linker.spawns_monster_type_id || linker.monster_type_id) {
            let spawn_data = {};
            let spawned_monster_type_id = 0;
            spawn_data.ship_coord_index = new_ship_coord_index;

            if (linker.spawns_monster_type_id) {
                spawned_monster_type_id = linker.spawns_monster_type_id;
            } else if (linker.monster_type_id) {
                spawned_monster_type_id = linker.monster_type_id;
            }


            await monster.spawn(dirty, spawned_monster_type_id, spawn_data);
        }

        if (linker_object_type_index !== -1 && dirty.object_types[linker_object_type_index].assembled_as_object) {

            // Gotta spawn an object!
            let spawn_object_data = {'object_type_id': dirty.object_types[linker_object_type_index].id};
            if(typeof data.spawned_event_id !== 'undefined') {
                spawn_object_data.spawned_event_id = data.spawned_event_id;
            }

            let new_object_index = await insertObjectType(false, dirty, spawn_object_data);


            await game_object.place(false, dirty, { 'object_index': new_object_index, 'ship_coord_index': new_ship_coord_index, 'reason': 'generate_ship' });

            dirty.objects[new_object_index].player_id = dirty.objects[ship_index].player_id;
            dirty.objects[new_object_index].has_change = true;

            if(dirty.objects[new_object_index].object_type_id === 266) {
                console.log("Adding default allow creator rule to airlock");
                addRule({}, dirty, { 'object_id': dirty.objects[new_object_index].id, 'new_rule': 'allow_creator',
                    'allow': true });
                dirty.objects[ship_index].airlock_index = new_ship_coord_index;
            }
        }
    } catch(error) {
        log(chalk.red("Error in world.createShipCoord:" + error));
        console.error(error);
    }

}

exports.createShipCoord = createShipCoord;



// Returns an ai_index if the AI will protect the thing passed in
/**
 * 
 * @param {Object} dirty 
 * @param {number} damage_amount
 * @param {Object} coord
 * @param {string} attacking_type
 * @param {Object} data 
 * @param {number=} data.monster_index
 * @param {number=} data.object_index
 * @param {number=} data.planet_index
 * @param {number=} data.player_index
 * @param {Boolean=} data.show_output
 */
async function getAIProtector(dirty, damage_amount, coord, attacking_type, data) {

    try {

        //console.log("in getAIProtector. Attacking type: " + attacking_type);
        let ai_index = -1;
        let is_protected = false;
    
    
        if (data.monster_index) {
            // TODO code in AI's being able to protect monsters
        }
        // Checking for an object
        else if (typeof data.object_index !== 'undefined') {
    
            // Something like a ship that will directly have an ai_id
            if (dirty.objects[data.object_index].ai_id) {
                ai_index = await game_object.getIndex(dirty, dirty.objects[data.object_index].ai_id);
            } else {
    
                // Check the room we are in, and if there's one, see if the rules apply to us
                if (coord.planet_id) {
                    let planet_index = await planet.getIndex(dirty, { 'planet_id': coord.planet_id, 'source': 'world.getAIProtector' });
                    if (planet_index !== -1 && dirty.planets[planet_index].ai_id) {
                        ai_index = await game_object.getIndex(dirty, dirty.planets[planet_index].ai_id);
                    }
                } else if (coord.ship_id) {
                    let ship_index = await game_object.getIndex(dirty, coord.ship_id);
                    if (ship_index !== -1 && dirty.objects[ship_index].ai_id) {
                        ai_index = await game_object.getIndex(dirty, dirty.objects[ship_index].ai_id);
                    }
                }
    
            }
    
            // Didn't find an AI, no use in checking rules
            if (ai_index === -1) {
                if (data.show_output && data.show_output === true) {
                    //console.log("No AI was found");
                }
    
                return -1;
            }
    
            // Now we just need to make sure there's a rule that matches our relationship to the AI
            let rules = dirty.rules.filter(rule => rule.object_id === dirty.objects[ai_index].id);
    
            // Plain for since we want to await in here for the potential trues
            for (let i = 0; i < rules.length; i++) {
    
                if (rules[i].rule === 'protect_creator_property' && dirty.objects[data.object_index].player_id === dirty.objects[ai_index].player_id) {
                    is_protected = true;
                }
    
    
            }

        } else if(typeof data.planet_index !== 'undefined') {

            if(!dirty.planets[data.planet_index].ai_id) {
                return -1;
            }

            ai_index = await game_object.getIndex(dirty, dirty.planets[data.planet_index].ai_id);

            if(ai_index === -1) {
                return -1;
            }

            // Now we just need to make sure there's a rule that matches our relationship to the AI
            let rules = dirty.rules.filter(rule => rule.object_id === dirty.objects[ai_index].id);

            // Plain for since we want to await in here for the potential trues
            for (let i = 0; i < rules.length; i++) {
    
                if (rules[i].rule === 'protect_creator_property') {
                    is_protected = true;
                }
    
    
            }


        } else if (typeof data.player_index !== 'undefined') {
    

            // Check the room we are in, and if there's one, see if the rules apply to us
            if (coord.planet_id) {
                let planet_index = await planet.getIndex(dirty, { 'planet_id': coord.planet_id, 'source': 'world.getAIProtector - data.player_index' });
                if (planet_index !== -1 && dirty.planets[planet_index].ai_id) {
                    ai_index = await game_object.getIndex(dirty, dirty.planets[planet_index].ai_id);
                }
            } else if (coord.ship_id) {
                let ship_index = await game_object.getIndex(dirty, coord.ship_id);
                if (ship_index !== -1 && dirty.objects[ship_index].ai_id) {
                    ai_index = await game_object.getIndex(dirty, dirty.objects[ship_index].ai_id);
                }
            }
    
            // Didn't find an AI, no use in checking rules
            if (ai_index === -1) {
                if (data.show_output && data.show_output === true) {
                    //console.log("No AI was found");
                }
    
                return -1;
            }
    
            // Now we just need to make sure there's a rule that matches our relationship to the AI
            let rules = dirty.rules.filter(rule => rule.object_id === dirty.objects[ai_index].id);
    
            // Plain for since we want to await in here for the potential trues
            for (let i = 0; i < rules.length; i++) {
    
                if (rules[i].rule === 'protect_all_players') {
                    is_protected = true;
                }  else if(rules[i].rule === 'protect_players_from_players' && attacking_type === 'player') {
                    is_protected = true;
                } else if(rules[i].rule === 'protect_players_from_monsters' && attacking_type === 'monster') {

                } else if (rules[i].rule === 'protect_creator' && dirty.players[data.player_index].id === dirty.objects[ai_index].player_id) {
                    is_protected = true;
                }
    
                // TODO add in support for faction support
    
    
            }
        }
    
    
        if (!is_protected) {
            if (data.show_output && data.show_output === true) {
                console.log("Not protected");
            }
            return -1;
        }
    
        // See if there's enough energy
        if (dirty.objects[ai_index].energy < damage_amount) {
    
            if (data.show_output && data.show_output === true) {
                console.log("AI does not have enough energy");
            }
            return -1;
        }
    
        return ai_index;
    } catch(error) {
        log(chalk.red("Error in world.getAIProtector: " + error));
        console.error(error);
    }


}

exports.getAIProtector = getAIProtector;


async function getNpcCoordAndRoom(dirty, npc_index) {

    try {

        let room = false;
        let coord_index = -1;
        let scope = false;
        let coord = false;

        if (dirty.npcs[npc_index].coord_id) {
            coord_index = await main.getCoordIndex(
                { 'coord_id': dirty.npcs[npc_index].coord_id });
            if (coord_index !== -1) {
                room = "galaxy";
                scope = "galaxy";
                coord = dirty.coords[coord_index];
            }
        }

        if (dirty.npcs[npc_index].planet_coord_id) {
            coord_index = await main.getPlanetCoordIndex(
                { 'planet_coord_id': dirty.npcs[npc_index].planet_coord_id });
            if (coord_index !== -1) {
                room = "planet_" + dirty.planet_coords[coord_index].planet_id;
                scope = "planet";
                coord = dirty.planet_coords[coord_index];
            }

        } else if (dirty.npcs[npc_index].ship_coord_id) {
            coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.npcs[npc_index].ship_coord_id });
            if (coord_index !== -1) {
                room = "ship_" + dirty.ship_coords[coord_index].ship_id;
                scope = "ship";
                coord = dirty.ship_coords[coord_index];
            }
        }

        return { 'room': room, 'coord_index': coord_index, 'coord': coord, 'scope': scope };
    } catch (error) {
        log(chalk.red("Error in world.getNpcCoordAndRoom: " + error));
        console.error(error);
    }

}

exports.getNpcCoordAndRoom = getNpcCoordAndRoom;

async function getNpcLevel(dirty, npc_index, level_type) {

    try {
        let level = 1;


        // Go through each level type!

        // Generic attacking for npcs
        if (level_type === 'attacking') {
            level = 1 + Math.floor(level_modifier * Math.sqrt(dirty.npcs[npc_index].attacking_skill_points));

        } else if (level_type === 'cooking') {
            level = 1 + Math.floor(global.difficult_level_modifier * Math.sqrt(dirty.npcs[npc_index].cooking_skill_points));

        } else if (level_type === 'defense') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.npcs[npc_index].defending_skill_points));


        } else if (level_type === 'farming') {
            level = 1 + Math.floor(global.difficult_level_modifier * Math.sqrt(dirty.npcs[npc_index].farming_skill_points));
        } else if (level_type === 'manufacturing') {
            level = 1 + Math.floor(global.difficult_level_modifier * Math.sqrt(dirty.npcs[npc_index].manufacturing_skill_points));

        } else if (level_type === 'mining') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.npcs[npc_index].mining_skill_points));
        } else if (level_type === 'repairing') {
            level = 1 + Math.floor(global.level_modifier * Math.sqrt(dirty.npcs[npc_index].repairing_skill_points));
        } else if (level_type === 'researching') {
            level = 1 + Math.floor(global.difficult_level_modifier * Math.sqrt(dirty.npcs[npc_index].researching_skill_points));
        } else if (level_type === 'salvaging') {
            level = 1 + Math.floor(global.difficult_level_modifier * Math.sqrt(dirty.npcs[npc_index].salvaging_skill_points));
        }


        return level;
    } catch (error) {
        log(chalk.red("Error in world.getNpcLevel: " + error));
    }

}

exports.getNpcLevel = getNpcLevel;



// TODO make enslaving more complicated - general goal is to make it harder for more successful npcs

//  data:   slaver_player_index   |   slaver_npc_index   |   being_enslaved_npc_index
async function enslave(socket, dirty, data) {
    try {


        // Base chance of 25%
        let percent_chance = 25;

        // Which will increase if the npc doesn't have all of their HP
        if (dirty.npcs[data.being_enslaved_npc_index].current_hp / dirty.npcs[data.being_enslaved_npc_index].max_hp * 100 < 25) {
            percent_chance += 25;
        }

        if (percent_chance > 100) {
            percent_chance = 100;
        }

        // now lets do our rand roll
        let rand_roll = helper.getRandomIntInclusive(1, 100);

        // NPC IS ENSLAVED!
        if (rand_roll <= percent_chance) {
            log(chalk.cyan("NPC IS NOW ENSLAVED"));
            if (typeof data.slaver_player_index !== 'undefined') {
                dirty.npcs[data.being_enslaved_npc_index].enslaved_to_player_id = dirty.players[data.slaver_player_index].id;
            } else if (typeof data.slaver_npc_index !== 'undefined') {
                dirty.npcs[data.being_enslaved_npc_index].enslaved_to_npc_id = dirty.npcs[data.slaver_npc_index].id;
            }

            dirty.npcs[data.being_enslaved_npc_index].has_change = true;
        } else {
            console.log("Enslavement did not work");
        }


    } catch (error) {
        log(chalk.red("Error in world.enslave: " + error));
        console.error(error);
    }
}

exports.enslave = enslave;



async function generatePlanet(socket, dirty, planet_index, planet_type_index) {
    try {

        console.time("generatePlanet");
        planet_index = parseInt(planet_index);

        if (isNaN(planet_index) || planet_index === -1 || !dirty.planets[planet_index]) {
            log(chalk.yellow("Bad planet_index in world.setPlanetType"));
            return false;
        }

        if (!socket.is_admin) {
            log(chalk.red("We think a socket with player id: " + socket.player_id + " is trying to be mr hacker man"));
            return false;
        }

        if (dirty.planets[planet_index].planet_type_id === 26) {
            log(chalk.yellow("Forming planets can't be generated. Run /setplanettype PLANET_ID PLANET_TYPE_ID first"));
            return false;
        }

        log(chalk.green("Generating planet id: " + dirty.planets[planet_index].id));

        let planet_type_index = main.getPlanetTypeIndex(dirty.planets[planet_index].planet_type_id);

        let underground_x_offset = 0;
        let underground_y_offset = 0;
        if (dirty.planet_types[planet_type_index].x_size_above > dirty.planet_types[planet_type_index].x_size_under) {
            underground_x_offset = (dirty.planet_types[planet_type_index].x_size_above - dirty.planet_types[planet_type_index].y_size_under) / 2;

        }

        if (dirty.planet_types[planet_type_index].y_size_above > dirty.planet_types[planet_type_index].y_size_under) {
            underground_y_offset = (dirty.planet_types[planet_type_index].y_size_above - dirty.planet_types[planet_type_index].y_size_under) / 2;

        }

        dirty.planets[planet_index].x_size_above = dirty.planet_types[planet_type_index].x_size_above;
        dirty.planets[planet_index].y_size_above = dirty.planet_types[planet_type_index].y_size_above;
        dirty.planets[planet_index].x_size_under = dirty.planet_types[planet_type_index].x_size_under;
        dirty.planets[planet_index].y_size_under = dirty.planet_types[planet_type_index].y_size_under;
        dirty.planets[planet_index].has_change = true;

        for (let i = 0; i > dirty.planets[planet_index].lowest_depth; i--) {
            console.log("Generating planet level: " + i);
            await generatePlanetLevel(socket, dirty, {
                'planet_index': planet_index,
                'generating_level': i, 'planet_type_index': planet_type_index
            });


            // If we are at level 0, we need to add a spaceport
            if (i === 0) {
                console.log("Going to build spaceport!");
                let spaceport_start_x = Math.floor(dirty.planets[planet_index].x_size_above / 2) - 3;
                let spaceport_start_y = Math.floor(dirty.planets[planet_index].y_size_above / 2) - 3;

                await game.buildStructure(dirty, {
                    'structure_type_id': 4, 'starting_level': 0,
                    'starting_tile_x': spaceport_start_x, 'starting_tile_y': spaceport_start_y,
                    'planet_id': dirty.planets[planet_index].id, 'is_forced': true
                });
            }

            // For levels lower than 0, we need stairs/hole, and to connect up the caves
            if (i < 0) {

                console.log("Generating hole/stairs. We are working on level: " + i);

                let level_above = i + 1;

                let possible_hole_coords = dirty.planet_coords.filter(planet_coord =>
                    planet_coord.planet_id === dirty.planets[planet_index].id &&
                    planet_coord.level === level_above && !planet_coord.npc_id && !planet_coord.spawns_monster_type_id &&
                    planet_coord.floor_type_id !== 26 && planet_coord.floor_type_id !== 11 && planet_coord.floor_type_id !== 44 && 
                    !planet_coord.object_id &&
                    planet_coord.tile_x < dirty.planet_types[planet_type_index].x_size_under + underground_x_offset &&
                    planet_coord.tile_y < dirty.planet_types[planet_type_index].y_size_under + underground_y_offset &&
                    planet_coord.tile_x > underground_x_offset &&
                    planet_coord.tile_y > underground_y_offset);

                let hole_coord = possible_hole_coords[Math.floor(Math.random() * possible_hole_coords.length)];

                let stairs_coord_index = await main.getPlanetCoordIndex({
                    'planet_id': dirty.planets[planet_index].id,
                    'planet_level': i, 'tile_x': hole_coord.tile_x, 'tile_y': hole_coord.tile_y
                });

                if (stairs_coord_index === -1) {
                    log(chalk.yellow("Could not find a coord for the stairs. planet_id: " + dirty.planets[planet_index].id +
                        " planet_level: " + i + " tile_x,y: " + hole_coord.tile_x + "," + hole_coord.tile_y));
                } else {
                    dirty.planet_coords[stairs_coord_index].object_type_id = 63;
                    dirty.planet_coords[stairs_coord_index].has_change = true;


                    let hole_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': hole_coord.id });
                    dirty.planet_coords[hole_coord_index].object_type_id = 62;
                    dirty.planet_coords[hole_coord_index].has_change = true;

                    // Lets clear the tiles of walls around the stairs if we can or its needed
                    let starting_tile_x = dirty.planet_coords[stairs_coord_index].tile_x - 1;
                    let starting_tile_y = dirty.planet_coords[stairs_coord_index].tile_y - 1;

                    for (let x = starting_tile_x; x <= starting_tile_x + 2; x++) {
                        for (let y = starting_tile_y; y <= starting_tile_y + 2; y++) {

                            if (x === dirty.planet_coords[stairs_coord_index].tile_x && y === dirty.planet_coords[stairs_coord_index].tile_y) {

                            } else {

                                let other_coord_index = await main.getPlanetCoordIndex(
                                    {
                                        'planet_id': dirty.planet_coords[stairs_coord_index].planet_id,
                                        'planet_level': dirty.planet_coords[stairs_coord_index].level,
                                        'tile_x': x, 'tile_y': y
                                    });

                                if (other_coord_index !== -1) {

                                    // If the object type id is a wall of the planet, remove it!
                                    if (dirty.planet_coords[other_coord_index].object_type_id === dirty.planet_types[planet_type_index].wall_object_type_id) {
                                        dirty.planet_coords[other_coord_index].object_type_id = false;
                                        dirty.planet_coords[other_coord_index].has_change = true;
                                    }
                                }

                            }

                        }
                    }

                    // Lets clear the tiles of walls around the hole if we can or its needed

                    for (let x = starting_tile_x; x <= starting_tile_x + 2; x++) {
                        for (let y = starting_tile_y; y <= starting_tile_y + 2; y++) {

                            if (x === dirty.planet_coords[stairs_coord_index].tile_x && y === dirty.planet_coords[stairs_coord_index].tile_y) {

                            } else {

                                let other_coord_index = await main.getPlanetCoordIndex(
                                    {
                                        'planet_id': dirty.planet_coords[stairs_coord_index].planet_id,
                                        'planet_level': dirty.planet_coords[stairs_coord_index].level + 1,
                                        'tile_x': x, 'tile_y': y
                                    });

                                if (other_coord_index !== -1) {

                                    // If the object type id is a wall of the planet, remove it!
                                    if (dirty.planet_coords[other_coord_index].object_type_id === dirty.planet_types[planet_type_index].wall_object_type_id) {
                                        dirty.planet_coords[other_coord_index].object_type_id = false;
                                        dirty.planet_coords[other_coord_index].has_change = true;
                                    }
                                }

                            }

                        }
                    }



                    // A very inefficient quick fix for holes not being connected, since we are connecting the level below them.
                    // I liked having the connect level here, but I think it's gonna make sense to do it after we have the holes/stairs setup
                    /*
                    if(i + 1 < 0) {
                        let level_above = i + 1;
                        connectLevel(socket, dirty, { 'planet_index': planet_index,
                            'planet_type_index': planet_type_index, 'connecting_level': level_above });
                    }
                    connectLevel(socket, dirty, { 'planet_index': planet_index,
                        'planet_type_index': planet_type_index, 'connecting_level': i });

                    */
                }



            }



        }

        // Connect up all the levels
        for (let i = -1; i > dirty.planets[planet_index].lowest_depth; i--) {
            await connectLevel(socket, dirty, {
                'planet_index': planet_index,
                'planet_type_index': planet_type_index, 'connecting_level': i
            });
        }

        console.timeEnd("generatePlanet");



    } catch (error) {
        log(chalk.red("Error in world.generatePlanet: " + error));
        console.error(error);
    }
}

exports.generatePlanet = generatePlanet;


//  data:   planet_index   |   generating_level
async function generatePlanetLevel(socket, dirty, data) {
    try {


        if (!socket.is_admin) {
            log(chalk.red("We think a socket with player id: " + socket.player_id + " is trying to be mr hacker man"));
            return false;
        }

        let planet_type_index = main.getPlanetTypeIndex(dirty.planets[data.planet_index].planet_type_id);

        let stairs_x = -1;
        let stairs_y = -1;
        let entire_map = [[], []];


        let level_x_size = dirty.planet_types[planet_type_index].x_size_above;
        let level_y_size = dirty.planet_types[planet_type_index].y_size_above;
        let starting_x_offset = 0;
        let starting_y_offset = 0;

        if (data.generating_level < 0) {
            level_x_size = dirty.planet_types[planet_type_index].x_size_under;
            level_y_size = dirty.planet_types[planet_type_index].y_size_under;

            if (dirty.planet_types[planet_type_index].x_size_above > dirty.planet_types[planet_type_index].x_size_under) {
                starting_x_offset = (dirty.planet_types[planet_type_index].x_size_above - dirty.planet_types[planet_type_index].x_size_under) / 2;
            }
            if (dirty.planet_types[planet_type_index].y_size_above > dirty.planet_types[planet_type_index].y_size_under) {
                starting_y_offset = (dirty.planet_types[planet_type_index].y_size_above - dirty.planet_types[planet_type_index].y_size_under) / 2;
            }
        }



        // For levels < 0 we need to generate a cave structure
        if (data.generating_level < 0) {


            // See experiments/underground_level_test.js for a description of how this changes planets
            let chance_to_start_alive = 40;

            for (let x = starting_x_offset; x < level_x_size + starting_x_offset; x++) {
                for (let y = starting_y_offset; y < level_y_size + starting_y_offset; y++) {

                    if (!entire_map[x]) entire_map[x] = [];

                    let random_chance = helper.getRandomIntInclusive(1, 100);
                    if (random_chance < chance_to_start_alive) {
                        entire_map[x][y] = true;
                    } else {
                        entire_map[x][y] = false;
                    }
                }
            }

            entire_map = cellSimulationStep(entire_map, level_x_size, level_y_size, starting_x_offset, starting_y_offset);
            entire_map = cellSimulationStep(entire_map, level_x_size, level_y_size, starting_x_offset, starting_y_offset);


        }

        for (let x = starting_x_offset; x < level_x_size + starting_x_offset; x++) {
            for (let y = starting_y_offset; y < level_y_size + starting_y_offset; y++) {
                let floor_rarity = helper.rarityRoll();
                let object_rarity = helper.rarityRoll();
                let monster_rarity = helper.rarityRoll();

                let coord_floor_type_ids = [];
                let coord_object_type_ids = [];
                let coord_monster_type_ids = [];

                // grab the applicable floors
                for (let f = 0; f < dirty.planet_floor_linkers.length; f++) {
                    if (dirty.planet_floor_linkers[f].planet_type_id === dirty.planets[data.planet_index].planet_type_id &&
                        dirty.planet_floor_linkers[f].rarity <= floor_rarity &&
                        (data.generating_level <= dirty.planet_floor_linkers[f].highest_planet_level &&
                            data.generating_level >= dirty.planet_floor_linkers[f].lowest_planet_level)) {

                        coord_floor_type_ids.push(dirty.planet_floor_linkers[f].floor_type_id);

                    }
                }

                //console.log("Coord floor type ids: ");
                //console.log(coord_floor_type_ids);



                let coord_data = {};
                coord_data.planet_id = dirty.planets[data.planet_index].id;
                coord_data.level = data.generating_level;
                coord_data.tile_x = x;
                coord_data.tile_y = y;
                coord_data.coord_floor_type_ids = coord_floor_type_ids;

                // We are going to force a wall here
                if (data.generating_level < 0 && entire_map[x][y] === true) {
                    coord_data.object_type_id = dirty.planet_types[data.planet_type_index].wall_object_type_id;
                }

                await createPlanetCoord(socket, dirty, coord_data);

            }
        }



    } catch (error) {
        log(chalk.red("Error in world.generatePlanetLevel: " + error));
        console.error(error);
    }
}

exports.generatePlanetLevel = generatePlanetLevel;

function cellCountNeighbors(entire_map, x, y, x_size, y_size, starting_x_offset, starting_y_offset) {
    try {

        let count = 0;

        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                let near_x = x + i;
                let near_y = y + j;

                // our point
                if (i === 0 && j === 0) {

                }
                // A point off the map
                else if (near_x < starting_x_offset || near_y < starting_y_offset || near_x >= x_size + starting_x_offset || near_y >= y_size + starting_y_offset) {
                    count++;
                } else if (entire_map[near_x][near_y] === true) {
                    count++;
                }
            }
        }


        return count;

    } catch (error) {
        log(chalk.red("Error in world.cellCountNeighbors: " + error));
        console.error(error);
    }
}

function cellSimulationStep(old_map, x_size, y_size, starting_x_offset, starting_y_offset) {
    try {

        let birth_limit = 4;
        let death_limit = 3;

        let new_map = old_map;


        for (let x = starting_x_offset; x < x_size + starting_x_offset; x++) {
            for (let y = starting_y_offset; y < y_size + starting_y_offset; y++) {
                let near_alive_count = cellCountNeighbors(old_map, x, y, x_size, y_size, starting_x_offset, starting_y_offset);

                if (old_map[x][y] === true && near_alive_count < death_limit) {

                    new_map[x][y] = false;

                } else if (near_alive_count > birth_limit) {
                    new_map[x][y] = true;
                }
            }
        }

        return new_map;

    } catch (error) {
        log(chalk.red("Error in cellSimulationStep: " + error));
        console.error(error);
    }
}


/**
 * @param {Object} dirty
 * @param {number} ship_index
 * @param {Object=} data
 * @param {number=} data.spawned_event_index
 */
async function generateShip(dirty, ship_index, data = {}) {
    try {

        // lets get the ship linkers
        let ship_linkers = dirty.ship_linkers.filter(linker => linker.ship_type_id === dirty.objects[ship_index].object_type_id);

        for (let linker of ship_linkers) {

            await createShipCoord(dirty, ship_index, linker, data);

        }
    } catch (error) {
        log(chalk.red("Error in world.generateShip: " + error));
        console.error(error);
    }
}

exports.generateShip = generateShip;


/**
* @param {Object} dirty
* @param {String} coord_type
* @param {number} base_coord_index
* @param {('player'|'object'|'object_type'|'monster'|'monster_type')} placing_type
* @param {number} placing_index
* @param {number} distance_left
* @param {Array=} block_directions
* @returns {Promise<number>} - coord_index
*/

async function getOpenCoordIndex(dirty, coord_type, base_coord_index, placing_type, placing_index, distance_left, block_directions = []) {

    try {

        //console.log("In getOpenCoordIndex");

        let base_coord = {};
        if(coord_type === 'ship') {
            base_coord = dirty.ship_coords[base_coord_index];
        } else if(coord_type === 'planet') {
            base_coord = dirty.planet_coords[base_coord_index];
        } else if(coord_type === 'galaxy') {
            base_coord = dirty.coords[base_coord_index];
        } else if(coord_type === 'virtual') {
            base_coord = dirty.virtual_coords[base_coord_index];
        }

        if(helper.isFalse(base_coord)) {
            log(chalk.yellow("Invalid base coord sent into getOpenCoordIndex"));
            console.trace("this");
            return -1;
        }

        if(placing_type === 'object_type' && helper.isFalse(dirty.object_types[placing_index])) {
            log(chalk.yellow("Invalid object type sent in getOpenCoordIndex."));
            console.trace("here");
            return -1;
        }

        // If there's no block direction, try the base coord. Otherwise we will have already tried the base coord
        if(block_directions.length < 1) {
            if(placing_type === 'player') {
                let can_place_result = await player.canPlace(dirty, coord_type, base_coord, placing_index);

                if(can_place_result === true) {
                    return base_coord_index;
                }

            } else if(placing_type === 'object') {
                let can_place_result = await game_object.canPlace(dirty, coord_type, base_coord,  {'object_index': placing_index } );

                if(can_place_result === true) {
                    return base_coord_index;
                }
            } else if(placing_type === 'object_type') {
                let can_place_result = await game_object.canPlace(dirty, coord_type, base_coord,  {'object_type_id': dirty.object_types[placing_index].id } );
                
                if(can_place_result === true) {
                    return base_coord_index;
                }
            } else if(placing_type === 'monster') {
                let can_place_result = await monster.canPlace(dirty, coord_type, base_coord,  {'monster_index': placing_index } );
                
                if(can_place_result === true) {
                    return base_coord_index;
                }
            } else if(placing_type === 'monster_type') {
                let can_place_result = await monster.canPlace(dirty, coord_type, base_coord,  {'monster_type_id': dirty.monster_types[placing_index].id } );
                
                if(can_place_result === true) {
                    return base_coord_index;
                }
            }
        }

        // left
        if(!block_directions.includes('left')) {

            await map.getCoordNeighbor(dirty, coord_type, base_coord_index, 'left');


            if(base_coord.left_coord_index !== -1) {
    
                let left_coord = {};
    
                if(coord_type === 'ship') {
                    left_coord = dirty.ship_coords[dirty.ship_coords[base_coord_index].left_coord_index];
                } else if(coord_type === 'planet') {
                    left_coord = dirty.planet_coords[dirty.planet_coords[base_coord_index].left_coord_index];
                } else if(coord_type === 'galaxy') {
                    left_coord = dirty.coords[dirty.coords[base_coord_index].left_coord_index];
                } else if(coord_type === 'virtual') {
                    left_coord = dirty.virtual_coords[dirty.virtual_coords[base_coord_index].left_coord_index];
                }
    
    
                if(placing_type === 'player') {
                    let can_place_result = await player.canPlace(dirty, coord_type, left_coord, placing_index);
    
                    if(can_place_result === true) {
                        return base_coord.left_coord_index;
                    }
                } else if(placing_type === 'object') {
                    let can_place_result = await game_object.canPlace(dirty, coord_type, left_coord,  {'object_index': placing_index } );
    
                    if(can_place_result === true) {
                        return base_coord.left_coord_index;
                    }
                } else if(placing_type === 'object_type') {
                    let can_place_result = await game_object.canPlace(dirty, coord_type, left_coord,  {'object_type_id': dirty.object_types[placing_index].id } );
                    
                    if(can_place_result === true) {
                        //console.log("Can place result was true");
                        return base_coord.left_coord_index;
                    }
                } else if(placing_type === 'monster') {
                    let can_place_result = await monster.canPlace(dirty, coord_type, left_coord,  {'monster_index': placing_index } );
                    
                    if(can_place_result === true) {
                        return base_coord_index;
                    }
                } else if(placing_type === 'monster_type') {
                    let can_place_result = await monster.canPlace(dirty, coord_type, left_coord,  {'monster_type_id': dirty.monster_types[placing_index].id } );
                    
                    if(can_place_result === true) {
                        return base_coord_index;
                    }
                }
                
            }
        }
        

        //right
        if(!block_directions.includes('right')) {
            await map.getCoordNeighbor(dirty, coord_type, base_coord_index, 'right');

            if(base_coord.right_coord_index !== -1) {
                let right_coord = {};
    
                if(coord_type === 'ship') {
                    right_coord = dirty.ship_coords[dirty.ship_coords[base_coord_index].right_coord_index];
                } else if(coord_type === 'planet') {
                    right_coord = dirty.planet_coords[dirty.planet_coords[base_coord_index].right_coord_index];
                } else if(coord_type === 'galaxy') {
                    right_coord = dirty.coords[dirty.coords[base_coord_index].right_coord_index];
                } else if(coord_type === 'virtual') {
                    right_coord = dirty.virtual_coords[dirty.virtual_coords[base_coord_index].right_coord_index];
                }
        
        
                if(placing_type === 'player') {
                    let can_place_result = await player.canPlace(dirty, coord_type, right_coord, placing_index);
        
                    if(can_place_result === true) {
                        return base_coord.right_coord_index;
                    }
                } else if(placing_type === 'object') {
                    let can_place_result = await game_object.canPlace(dirty, coord_type, right_coord,  {'object_index': placing_index } );
    
                    if(can_place_result === true) {
                        return base_coord.right_coord_index;
                    }
                } else if(placing_type === 'object_type') {
                    let can_place_result = await game_object.canPlace(dirty, coord_type, right_coord,  {'object_type_id': dirty.object_types[placing_index].id } );
                    
                    if(can_place_result === true) {
                        return base_coord.right_coord_index;
                    }
                } else if(placing_type === 'monster') {
                    let can_place_result = await monster.canPlace(dirty, coord_type, right_coord,  {'monster_index': placing_index } );
                    
                    if(can_place_result === true) {
                        return base_coord_index;
                    }
                } else if(placing_type === 'monster_type') {
                    let can_place_result = await monster.canPlace(dirty, coord_type, right_coord,  {'monster_type_id': dirty.monster_types[placing_index].id } );
                    
                    if(can_place_result === true) {
                        return base_coord_index;
                    }
                }
            } 
        }
        

        // up
        if(!block_directions.includes('up')) {

            await map.getCoordNeighbor(dirty, coord_type, base_coord_index, 'up');

            if(base_coord.up_coord_index !== -1) {
                let up_coord = {};
    
                if(coord_type === 'ship') {
                    up_coord = dirty.ship_coords[dirty.ship_coords[base_coord_index].up_coord_index];
                } else if(coord_type === 'planet') {
                    up_coord = dirty.planet_coords[dirty.planet_coords[base_coord_index].up_coord_index];
                } else if(coord_type === 'galaxy') {
                    up_coord = dirty.coords[dirty.coords[base_coord_index].up_coord_index];
                } else if(coord_type === 'virtual') {
                    up_coord = dirty.virtual_coords[dirty.virtual_coords[base_coord_index].up_coord_index];
                }
        
        
                if(placing_type === 'player') {
                    let can_place_result = await player.canPlace(dirty, coord_type, up_coord, placing_index);
        
                    if(can_place_result === true) {
                        return base_coord.up_coord_index;
                    }
                } else if(placing_type === 'object') {
                    let can_place_result = await game_object.canPlace(dirty, coord_type, up_coord,  {'object_index': placing_index } );
    
                    if(can_place_result === true) {
                        return base_coord.up_coord_index;
                    }
                } else if(placing_type === 'object_type') {
                    let can_place_result = await game_object.canPlace(dirty, coord_type, up_coord,  {'object_type_id': dirty.object_types[placing_index].id } );
                    
                    if(can_place_result === true) {
                        return base_coord.up_coord_index;
                    }
                } else if(placing_type === 'monster') {
                    let can_place_result = await monster.canPlace(dirty, coord_type, up_coord,  {'monster_index': placing_index } );
                    
                    if(can_place_result === true) {
                        return base_coord_index;
                    }
                } else if(placing_type === 'monster_type') {
                    let can_place_result = await monster.canPlace(dirty, coord_type, up_coord,  {'monster_type_id': dirty.monster_types[placing_index].id } );
                    
                    if(can_place_result === true) {
                        return base_coord_index;
                    }
                }
            }

            
        }
        

        // down
        if(!block_directions.includes('down')) {
            await map.getCoordNeighbor(dirty, coord_type, base_coord_index, 'down');

            if(base_coord.down_coord_index !== -1) {
                let down_coord = {};
    
                if(coord_type === 'ship') {
                    down_coord = dirty.ship_coords[dirty.ship_coords[base_coord_index].down_coord_index];
                } else if(coord_type === 'planet') {
                    down_coord = dirty.planet_coords[dirty.planet_coords[base_coord_index].down_coord_index];
                } else if(coord_type === 'galaxy') {
                    down_coord = dirty.coords[dirty.coords[base_coord_index].down_coord_index];
                } else if(coord_type === 'virtual') {
                    down_coord = dirty.virtual_coords[dirty.virtual_coords[base_coord_index].down_coord_index];
                }
        
        
                if(placing_type === 'player') {
                    let can_place_result = await player.canPlace(dirty, coord_type, down_coord, placing_index);
        
                    if(can_place_result === true) {
                        return base_coord.down_coord_index;
                    }
                } else if(placing_type === 'object') {
                    let can_place_result = await game_object.canPlace(dirty, coord_type, down_coord,  {'object_index': placing_index } );
    
                    if(can_place_result === true) {
                        return base_coord.down_coord_index;
                    }
                } else if(placing_type === 'object_type') {
                    let can_place_result = await game_object.canPlace(dirty, coord_type, down_coord,  {'object_type_id': dirty.object_types[placing_index].id } );
                    
                    if(can_place_result === true) {
                        return base_coord.down_coord_index;
                    }
                } else if(placing_type === 'monster') {
                    let can_place_result = await monster.canPlace(dirty, coord_type, down_coord,  {'monster_index': placing_index } );
                    
                    if(can_place_result === true) {
                        return base_coord_index;
                    }
                } else if(placing_type === 'monster_type') {
                    let can_place_result = await monster.canPlace(dirty, coord_type, down_coord,  {'monster_type_id': dirty.monster_types[placing_index].id } );
                    
                    if(can_place_result === true) {
                        return base_coord_index;
                    }
                }
            }
            
        }
        

        //console.log("Didn't find a spot at base, left/right/up/down");

        // Didn't find a coord, and we have some disance left we can go
        if(distance_left > 0) {

            //console.log("Going to new base coords. Distance left: " + distance_left);
            //console.log(block_directions);
            let new_distance = distance_left - 1;

            if(base_coord.left_coord_index !== -1 && !block_directions.includes('left')) {
                //console.log("left");
                let new_block_directions = [...block_directions];
                new_block_directions.push('right');
                let found_coord_index = await getOpenCoordIndex(dirty, coord_type, base_coord.left_coord_index, placing_type, placing_index, new_distance, block_directions);
                if(found_coord_index !== -1) {
                    return found_coord_index;
                }
            }

            //console.log("Done with left on Distance left: " + distance_left);
            //console.log(block_directions);

            if(base_coord.right_coord_index !== -1 && !block_directions.includes('right')) {
                //console.log("right");
                let new_block_directions = [...block_directions];
                new_block_directions.push('left');
                let found_coord_index = await getOpenCoordIndex(dirty, coord_type, base_coord.right_coord_index, placing_type, placing_index, new_distance, block_directions);
                if(found_coord_index !== -1) {
                    return found_coord_index;
                }
            }

            //console.log("Done with right on Distance left: " + distance_left);
            //console.log(block_directions);

            if(base_coord.up_coord_index !== -1 && !block_directions.includes('up')) {
                //console.log("up");
                let new_block_directions = [...block_directions];
                new_block_directions.push('down');
                let found_coord_index = await getOpenCoordIndex(dirty, coord_type, base_coord.up_coord_index, placing_type, placing_index, new_distance, block_directions);
                if(found_coord_index !== -1) {
                    return found_coord_index;
                }
            }

            if(base_coord.down_coord_index !== -1 && !block_directions.includes('down')) {
                //console.log("down");

                
                let new_block_directions = [...block_directions];
                new_block_directions.push('up');
                let found_coord_index = await getOpenCoordIndex(dirty, coord_type, base_coord.down_coord_index, placing_type, placing_index, new_distance, block_directions);
                if(found_coord_index !== -1) {
                    return found_coord_index;
                }
            }
        }


        return -1;



    } catch(error) {
        log(chalk.red("Error in world.getOpenCoordIndex: " + error));
        console.error(error);
    }

}

exports.getOpenCoordIndex = getOpenCoordIndex;



function getPlayerSocket(dirty, player_index) {

    try {

        let returning_socket = {};

        for (let id of Object.keys(io.sockets.sockets)) {

            //socket = io.sockets.connected[id];
            if (io.sockets.connected[id].player_id === dirty.players[player_index].id) {
                //console.log("Returning found socket");
                returning_socket = io.sockets.connected[id];
            }
        }

        return returning_socket;
    } catch (error) {
        log(chalk.red("Error in world.getPlayerSocket: " + error));
        console.error(error);
    }



}

exports.getPlayerSocket = getPlayerSocket;

async function increaseNpcSkill(dirty, npc_index, skill_types) {


    try {


        for (let i = 0; i < skill_types.length; i++) {

            if (skill_types[i]) {

                if (skill_types[i] === 'control') {
                    dirty.npcs[npc_index].control_skill_points++;
                    dirty.npcs[npc_index].has_change = true;
                } else if (skill_types[i] === 'cooking') {
                    dirty.npcs[npc_index].cooking_skill_points++;
                    dirty.npcs[npc_index].has_change = true;
                } else if (skill_types[i] === 'defending') {
                    dirty.npcs[npc_index].defending_skill_points++;
                    dirty.npcs[npc_index].has_change = true;
                } else if (skill_types[i] === 'farming') {
                    dirty.npcs[npc_index].farming_skill_points++;
                    dirty.npcs[npc_index].has_change = true;
                } else if (skill_types[i] === 'hacking') {
                    dirty.npcs[npc_index].hacking_skill_points++;
                    dirty.npcs[npc_index].has_change = true;
                } else if (skill_types[i] === 'manufacturing') {
                    dirty.npcs[npc_index].manufacturing_skill_points++;
                    dirty.npcs[npc_index].has_change = true;
                } else if (skill_types[i] === 'melee') {
                    dirty.npcs[npc_index].melee_skill_points++;
                    dirty.npcs[npc_index].has_change = true;
                } else if (skill_types[i] === 'researching') {
                    dirty.npcs[npc_index].researching_skill_points++;
                    dirty.npcs[npc_index].has_change = true;
                } else if (skill_types[i] === 'surgery') {
                    dirty.npcs[npc_index].surgery_skill_points++;
                    dirty.npcs[npc_index].has_change = true;
                }
            }
        }


    } catch (error) {
        log(chalk.red("Error in increaseNpcSkill: " + error));
        console.error(error);
    }



}
exports.increaseNpcSkill = increaseNpcSkill;


async function increasePlayerSkill(socket, dirty, player_index, skill_types) {


    try {

        //console.log("In world.increasePlayerSkill. Skill types: ");
        //console.log(skill_types);

        for (let i = 0; i < skill_types.length; i++) {

            if (skill_types[i]) {

                if (skill_types[i] === 'control') {
                    dirty.players[player_index].control_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'cooking') {
                    dirty.players[player_index].cooking_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'corrosive') {
                    dirty.players[player_index].corrosive_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'defending') {
                    dirty.players[player_index].defending_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'electric') {
                    dirty.players[player_index].electric_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'explosion') {
                    dirty.players[player_index].explosion_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'farming') {
                    dirty.players[player_index].farming_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'freezing') {
                    dirty.players[player_index].freezing_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'hacking') {
                    dirty.players[player_index].hacking_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'heat') {
                    dirty.players[player_index].heat_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'gravity') {
                    dirty.players[player_index].gravity_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'laser') {
                    dirty.players[player_index].laser_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'manufacturing') {
                    dirty.players[player_index].manufacturing_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'melee') {
                    dirty.players[player_index].melee_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'mining') {
                    dirty.players[player_index].mining_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'piercing') {
                    dirty.players[player_index].piercing_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'plasma') {
                    dirty.players[player_index].plasma_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'poison') {
                    dirty.players[player_index].poison_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'radiation') {
                    dirty.players[player_index].radiation_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'repairing') {
                    dirty.players[player_index].repairing_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'researching') {
                    dirty.players[player_index].researching_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'salvaging') {
                    dirty.players[player_index].salvaging_skill_points++;
                    dirty.players[player_index].has_change = true;
                } else if (skill_types[i] === 'surgery') {
                    dirty.players[player_index].surgery_skill_points++;
                    dirty.players[player_index].has_change = true;
                }
            }
        }




        /*
        if(skill_type === 'attacking') {
            //console.log("Increasing skill related to player attacking at a distance of: " + calculating_range);

            // TODO     eventually we need some sort of system that limits someone equipping all different types of
            // TODO     systems. Well, I guess we should.
            let laser_skill_increases = false;
            let plasma_skill_increases = false;
            let melee_skill_increases = false;

            if(calculating_range === 1) {
                melee_skill_increases = true;
            }

            // lets get the equipment that could have attacked
            // find the player attack at this range
            dirty.equipment_linkers.forEach(function(equipment_linker, i) {
                if(equipment_linker.player_id === dirty.players[player_index].id) {
                    let object_type_index = dirty.object_types.findIndex(function(obj) { return obj && obj.id === equipment_linker.object_type_id; });
                    if(object_type_index !== -1) {
                        // see if the object attack is in this range
                        if(dirty.object_types[object_type_index].min_attack_range <= calculating_range && dirty.object_types[object_type_index].max_attack_range >= calculating_range) {


                            if(dirty.object_types[object_type_index].equip_skill === 'laser') {
                                laser_skill_increases = true;
                            }

                            if(dirty.object_types[object_type_index].equip_skill === 'plasma') {
                                plasma_skill_increases = true;

                            } else if(dirty.object_types[object_type_index].equip_skill === 'melee') {
                                dirty.players[player_index].melee_skill_points++;
                                dirty.players[player_index].has_change = true;
                            }

                        }
                    }
                }
            });

            if(laser_skill_increases) {
                dirty.players[player_index].laser_skill_points++;
                dirty.players[player_index].has_change = true;
            }

            if(plasma_skill_increases) {
                dirty.players[player_index].plasma_skill_points++;
                dirty.players[player_index].has_change = true;
            }

            if(melee_skill_increases) {
                dirty.players[player_index].melee_skill_points++;
                dirty.players[player_index].has_change = true;
            }

        } else if(skill_type === 'defending') {
            //console.log("Increasing skill related to player defending ");
            dirty.players[player_index].defending_skill_points++;
            dirty.players[player_index].has_change = true;

        } else if(skill_type === 'cooking') {
            dirty.players[player_index].cooking_skill_points++;
            dirty.players[player_index].has_change = true;

        } else if(skill_type === 'farming') {
            dirty.players[player_index].farming_skill_points++;
            dirty.players[player_index].has_change = true;

        } else if(skill_type === 'manufacturing') {
            dirty.players[player_index].manufacturing_skill_points++;
            dirty.players[player_index].has_change = true;
        } else if(skill_type === 'researching') {
            dirty.players[player_index].researching_skill_points++;
            dirty.players[player_index].has_change = true;
        } else if(skill_type === 'surgery') {
            dirty.players[player_index].surgery_skill_points++;
            dirty.players[player_index].has_change = true;
        }


        */

        socket.emit('player_info', { 'player': dirty.players[player_index] });


    } catch (error) {
        log(chalk.red("Error in increasePlayerSkill: " + error));
        console.error(error);
    }



}
exports.increasePlayerSkill = increasePlayerSkill;

// object_type_id   |   player_id   |   npc_id   |   spawned_event_id
// in an effort to specialize this function we only take in the object_type_id, insert it, and return the new object.
// associating with coords is done elsewhere
/**
 * @param {Object} socket
 * @param {Object} dirty
 * @param {Object} data
 * @param {number} data.object_type_id
 * @param {number=} data.player_id
 * @param {number=} data.npc_id
 * @param {number=} data.spawned_event_id
 * @returns {Promise<number>} - object_index
 */
async function insertObjectType(socket, dirty, data) {
    try {

        if (!data.object_type_id) {
            log(chalk.yellow("No object_type_id passed into world.insertObjectType"));
            if (data.source) {
                log(chalk.yellow("Source: " + data.source));
            }
            return -1;
        }

        //console.log("in insertObjectType. Going to insert object_type_id: " + data.object_type_id);

        let object_type_index = dirty.object_types.findIndex(function (obj) { return obj && obj.id === data.object_type_id; });

        if (object_type_index === -1) {
            log(chalk.yellow("Could not find object type"));
            return -1;
        }




        // we need to create an object
        let sql;
        let inserts;

        //
        let npc_id = false;
        let player_id = false;
        if (socket !== false) {
            player_id = socket.player_id;
        } else if (data.player_id) {
            player_id = data.player_id;
        }

        if (data.npc_id) {
            npc_id = data.npc_id;
        }

        let spawned_event_id = false;
        if (data.spawned_event_id) {
            spawned_event_id = data.spawned_event_id;
        }

        //console.log("In insert object type. spawned_event_id: " + spawned_event_id);


        // lets have a base object type insert - and add/change things based on unique attributes of that object type

        sql = "INSERT INTO objects(object_type_id,current_hp,spawned_event_id)VALUES(?,?,?)";
        inserts = [dirty.object_types[object_type_index].id, dirty.object_types[object_type_index].hp,
            spawned_event_id];


        let [result] = await (pool.query(sql, inserts));


        if (!result) {
            log(chalk.yellow("Seems like we failed the object insert"));
            return -1;
        }


        let object_id = result.insertId;
        //console.log("Did object insert. Got object_id: " + object_id);

        // we really should make sure that we add the object into dirty here I think
        let object_index = await game_object.getIndex(dirty, object_id);

        if (npc_id !== false) {
            dirty.objects[object_index].npc_id = npc_id;
            dirty.objects[object_index].has_change = true;
        }

        if (player_id !== false) {
            dirty.objects[object_index].player_id = player_id;
            dirty.objects[object_index].has_change = true;
        }

        // See if there are spawn linkers
        let object_type_spawn_linkers = [];
        for (let i = 0; i < dirty.spawn_linkers.length; i++) {
            if (dirty.spawn_linkers[i] && dirty.spawn_linkers[i].object_type_id === dirty.object_types[object_type_index].id) {
                object_type_spawn_linkers.push(dirty.spawn_linkers[i]);
            }
        }

        if (object_type_spawn_linkers.length > 0) {
            dirty.objects[object_index].spawns_object = true;
            dirty.objects[object_index].has_change = true;
        }

        if (dirty.object_types[object_type_index].is_ship) {

            let generate_ship_data = {};
            if(typeof data.spawned_event_id !== 'undefined') {
                generate_ship_data.spawned_event_id = data.spawned_event_id;
            }
            await generateShip(dirty, object_index, generate_ship_data);

            if (dirty.object_types[object_type_index].needs_engines) {
                await attachShipEngines(dirty, object_index);
            }

            //await main.getShipCoords(object_id);

        }

        if (dirty.object_types[object_type_index].max_energy_storage && dirty.object_types[object_type_index].max_energy_storage > 1) {
            dirty.objects[object_index].energy = dirty.object_types[object_type_index].max_energy_storage;
            dirty.objects[object_index].has_change = true;
        }



        return object_index;


    } catch (error) {
        log(chalk.red("Error in world.insertObjectType: " + error));
        console.error(error);
    }
}
exports.insertObjectType = insertObjectType;


// When users right click on an elevator, they will need to know what floors they can go to
// This function generates this information, and sends it
async function manageElevatorLinkers(socket, dirty, object_id) {


    try {


        object_id = parseInt(object_id);

        let object_index = await game_object.getIndex(dirty, object_id);

        if (object_index === -1) {
            log(chalk.yellow("Invalid object sent into world.manageElevatorLinkers"));
            return false;
        }

        // It's possible an elevator can be in an inventory. We won't mess with linkers if that is the case
        if (!dirty.objects[object_index].planet_coord_id && !dirty.objects[object_index].ship_coord_id) {
            log(chalk.yellow("That elevator is probably in an inventory for now!"));
            return false;
        }


        let base_elevator_linker_index = -1;
        let highest_elevator_linker_group = 0;

        // Try to see if our object has an elevator linker yet
        for (let i = 0; i < dirty.elevator_linkers.length; i++) {
            if (dirty.elevator_linkers[i]) {

                if (dirty.elevator_linkers[i].group_id > highest_elevator_linker_group) {
                    highest_elevator_linker_group = dirty.elevator_linkers[i].group_id;
                }

                if (dirty.elevator_linkers.object_id === dirty.objects[object_index].id) {
                    base_elevator_linker_index = i;
                }

            }

        }


        // Our elevator is not yet in
        if (base_elevator_linker_index === -1) {

            log(chalk.green("Our elevator is not yet in a group. Going to generate this group!"));

            let new_elevator_group_id = highest_elevator_linker_group + 1;

            let planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.objects[object_index].planet_coord_id });

            if (planet_coord_index === -1) {
                log(chalk.yellow("Could not find the planet coord the elevator is on"));
                return false;
            }

            base_elevator_linker_index = dirty.elevator_linkers.push({
                'id': uuidv1(),
                'object_id': dirty.objects[object_index].id, 'level': dirty.planet_coords[planet_coord_index].level, 'group_id': new_elevator_group_id
            }) - 1;

            socket.emit('elevator_linker_info', { 'elevator_linker': dirty.elevator_linkers[base_elevator_linker_index] });

            // Check levels going down
            let starting_level = dirty.planet_coords[planet_coord_index].level;
            let next_level_down = starting_level - 1;
            let next_level_up = starting_level + 1;
            let found_level_down = true;
            let found_level_up = true;

            while (found_level_down === true) {

                let down_planet_coord_index = await main.getPlanetCoordIndex({
                    'planet_id': dirty.planet_coords[planet_coord_index].planet_id,
                    'planet_level': next_level_down, 'tile_x': dirty.planet_coords[planet_coord_index].tile_x, 'tile_y': dirty.planet_coords[planet_coord_index].tile_y
                });

                if (down_planet_coord_index === -1 || dirty.planet_coords[down_planet_coord_index].object_type_id !== 269) {
                    found_level_down = false;
                } else {
                    next_level_down--;

                    /// If there's already a match, remove it - this way when a new elevator is placed, we ensure that everything connected is linked
                    let previous_down_index = dirty.elevator_linkers.findIndex(function (obj) { return obj && obj.object_id === dirty.planet_coords[down_planet_coord_index].object_id; });
                    if (previous_down_index !== -1) {
                        delete dirty.elevator_linkers[previous_down_index];
                    }

                    let down_elevator_linker_index = dirty.elevator_linkers.push({
                        'id': uuidv1(),
                        'object_id': dirty.planet_coords[down_planet_coord_index].object_id, 'level': dirty.planet_coords[down_planet_coord_index].level,
                        'group_id': new_elevator_group_id
                    }) - 1;
                    socket.emit('elevator_linker_info', { 'elevator_linker': dirty.elevator_linkers[down_elevator_linker_index] });

                }


            }

            // Check levels going up
            while (found_level_up === true) {

                let up_planet_coord_index = await main.getPlanetCoordIndex({
                    'planet_id': dirty.planet_coords[planet_coord_index].planet_id,
                    'planet_level': next_level_up, 'tile_x': dirty.planet_coords[planet_coord_index].tile_x, 'tile_y': dirty.planet_coords[planet_coord_index].tile_y
                });

                if (up_planet_coord_index === -1 || dirty.planet_coords[up_planet_coord_index].object_type_id !== 269) {
                    found_level_up = false;
                } else {
                    next_level_up++;

                    /// If there's already a match, remove it - this way when a new elevator is placed, we ensure that everything connected is linked
                    let previous_up_index = dirty.elevator_linkers.findIndex(function (obj) { return obj && obj.object_id === dirty.planet_coords[up_planet_coord_index].object_id; });
                    if (previous_up_index !== -1) {
                        delete dirty.elevator_linkers[previous_up_index];
                    }

                    let up_elevator_linker_index = dirty.elevator_linkers.push({
                        'id': uuidv1(),
                        'object_id': dirty.planet_coords[up_planet_coord_index].object_id, 'level': dirty.planet_coords[up_planet_coord_index].level,
                        'group_id': new_elevator_group_id
                    }) - 1;
                    socket.emit('elevator_linker_info', { 'elevator_linker': dirty.elevator_linkers[up_elevator_linker_index] });

                }


            }
        } else {

            // Just send all the elevator linkers in this group
            for (let i = 0; i < dirty.elevator_linkers.length; i++) {
                if (dirty.elevator_linkers[i] && dirty.elevator_linkers[i].group_id === dirty.elevator_linkers[base_elevator_linker_index].group_id) {
                    socket.emit('elevator_linker_info', { 'elevator_linker': dirty.elevator_linkers[i] });
                }
            }

        }

        console.log("Finished in world.manageElevatorLinkers");



    } catch (error) {
        log(chalk.red("Error in world.manageElevatorLinkers: " + error));
        console.error(error);
    }


}

exports.manageElevatorLinkers = manageElevatorLinkers;


// When pulling from MySQL, nodejs doesn't like seeing numbers as ints sometimes
function processInventoryItem(dirty, index) {
    dirty.inventory_items[index].id = parseInt(dirty.inventory_items[index].id);

    if (dirty.inventory_items[index].player_id) {
        dirty.inventory_items[index].player_id = parseInt(dirty.inventory_items[index].player_id);
    }

    if (dirty.inventory_items[index].npc_id) {
        dirty.inventory_items[index].npc_id = parseInt(dirty.inventory_items[index].npc_id);
    }

    if (dirty.inventory_items[index].owned_by_object_id) {
        dirty.inventory_items[index].owned_by_object_id = parseInt(dirty.inventory_items[index].owned_by_object_id);
    }
}

exports.processInventoryItem = processInventoryItem;

async function objectFindTarget(dirty, object_index) {
    try {
        let object_type_index = main.getObjectTypeIndex(dirty.objects[object_index].object_type_id);

        // Only do all this for object types with attack strength
        // TODO we need a better colum in our database for this. Something like object_types.auto_attack or something. Or
        // TODO attack_on_creation. SOMETHING

        if (!dirty.object_types[object_type_index].attack_strength) {
            return;
        }

        let coord_index = -1;
        let starting_x = 0;
        let starting_y = 0;

        // object could be on a planet coord, or a ship coord
        if (dirty.objects[object_index].planet_coord_id) {
            coord_index = await game_object.getCoordIndex(dirty, object_index, 'planet');

            if (coord_index === -1) {
                return false;
            }

            starting_x = dirty.planet_coords[coord_index].tile_x - 4;
            starting_y = dirty.planet_coords[coord_index].tile_y - 3;

        } else if (dirty.objects[object_index].ship_coord_id) {
            coord_index = await game_object.getCoordIndex(dirty, object_index, 'ship');

            if (coord_index === -1) {
                return false;
            }

            starting_x = dirty.ship_coords[coord_index].tile_x - 4;
            starting_y = dirty.ship_coords[coord_index].tile_y - 3;
        }


        let sent_battle_target = false;

        for (let i = starting_x; i <= starting_x + 8; i++) {
            for (let j = starting_y; j <= starting_y + 6; j++) {

                if (sent_battle_target) {
                    return;
                }

                let checking_coord_index = -1;
                let temp_coord = {};

                if (dirty.objects[object_index].planet_coord_id) {
                    let planet_coord_data = {
                        'planet_id': dirty.planet_coords[coord_index].planet_id, 'planet_level': dirty.planet_coords[coord_index].level,
                        'tile_x': i, 'tile_y': j
                    };
                    checking_coord_index = await main.getPlanetCoordIndex(planet_coord_data);

                    if (checking_coord_index !== -1) {
                        temp_coord = dirty.planet_coords[checking_coord_index];
                    }
                } else if (dirty.objects[object_index].ship_coord_id) {
                    let ship_coord_data = {
                        'ship_id': dirty.ship_coords[coord_index].planet_id,
                        'level': dirty.ship_coords[coord_index].level, 'tile_x': i, 'tile_y': j
                    };
                    checking_coord_index = await main.getShipCoordIndex(ship_coord_data);

                    if (checking_coord_index !== -1) {
                        temp_coord = dirty.ship_coords[checking_coord_index];
                    }
                }

                if (helper.notFalse(temp_coord)) {

                    // There's an object! See if we attack it!
                    // Currently we attack objects that are owned by a player, but not part of our faction, or us
                    if (temp_coord.object_id) {
                        let checking_object_index = await game_object.getIndex(dirty, temp_coord.object_id);

                        if (checking_object_index !== -1) {

                            if (dirty.objects[checking_object_index].faction_id &&
                                dirty.objects[checking_object_index].faction_id !== dirty.objects[object_index].faction_id) {

                                let battle_linker_data = {
                                    'attacking_id': dirty.objects[object_index].id, 'attacking_type': 'object',
                                    'being_attacked_id': dirty.objects[checking_object_index].id, 'being_attacked_type': 'object'
                                };

                                await addBattleLinker(false, dirty, battle_linker_data);

                                sent_battle_target = true;

                            } else if (dirty.objects[checking_object_index].player_id &&
                                dirty.objects[checking_object_index].player_id !== dirty.objects[object_index].player_id) {

                                let battle_linker_data = {
                                    'attacking_id': dirty.objects[object_index].id, 'attacking_type': 'object',
                                    'being_attacked_id': dirty.objects[checking_object_index].id, 'being_attacked_type': 'object'
                                };

                                await addBattleLinker(false, dirty, battle_linker_data);

                                sent_battle_target = true;
                            }
                        }
                    }

                    // There's a player! See if we attack it
                    if (temp_coord.player_id) {
                        let checking_player_index = await player.getIndex(dirty, { 'player_id': dirty.objects[object_index].player_id });

                        if (checking_player_index !== -1) {
                            if (dirty.players[checking_player_index].faction_id &&
                                dirty.players[checking_player_index].faction_id !== dirty.objects[object_index].faction_id) {

                                let battle_linker_data = {
                                    'attacking_id': dirty.objects[object_index].id, 'attacking_type': 'object',
                                    'being_attacked_id': dirty.players[checking_player_index].id, 'being_attacked_type': 'player'
                                };

                                await addBattleLinker(false, dirty, battle_linker_data);

                                sent_battle_target = true;

                            } else if (dirty.players[checking_player_index].player_id &&
                                dirty.players[checking_player_index].player_id !== dirty.objects[object_index].player_id) {

                                let battle_linker_data = {
                                    'attacking_id': dirty.objects[object_index].id, 'attacking_type': 'object',
                                    'being_attacked_id': dirty.players[checking_player_index].id, 'being_attacked_type': 'player'
                                };

                                await addBattleLinker(false, dirty, battle_linker_data);

                                sent_battle_target = true;
                            }
                        }
                    }

                }

            }
        }

    } catch (error) {
        log(chalk.red("Error in game.objectFindTarget: " + error));
        console.error(error);
    }
}
exports.objectFindTarget = objectFindTarget;




async function reloadEvent(dirty, event_id) {

    try {

        // Step 1: Purge this event
        let event_index = event.getIndex(dirty, event_id);

        if (event_index === -1) {
            console.log("Event not found");
            return false;
        }

        // purge event linkers
        for (let i = 0; i < dirty.event_linkers.length; i++) {
            if (dirty.event_linkers[i] && dirty.event_linkers[i].event_id === event_id) {
                delete dirty.event_linkers[i];
            }
        }


        // purge event planet linkers
        for (let i = 0; i < dirty.planet_event_linkers.length; i++) {
            if (dirty.planet_event_linkers[i] && dirty.planet_event_linkers[i].event_id === event_id) {
                delete dirty.planet_event_linkers[i];
            }
        }

        // reload the event
        let [rows, fields] = await (pool.query("SELECT * FROM events WHERE id = ?", [event_id]));
        if (rows[0]) {

            dirty.events.push(rows[0]);


        }

        // reload the event linkers
        let [linker_rows, linker_fields] = await (pool.query("SELECT * FROM event_linkers WHERE event_id = ?", [event_id]));
        if (rows[0]) {

            for (let i = 0; i < linker_rows.length; i++) {
                dirty.event_linkers.push(linker_rows[i]);
            }


        }

        // reload the event planet linkers
        let [planet_linker_rows, planet_linker_fields] = await (pool.query("SELECT * FROM planet_event_linkers WHERE event_id = ?", [event_id]));
        if (rows[0]) {

            for (let i = 0; i < planet_linker_rows.length; i++) {
                dirty.event_linkers.push(planet_linker_rows[i]);
            }


        }

        log(chalk.green("Admin reloaded event id: " + event_id));


    } catch (error) {
        log(chalk.red("Error in world.reloadEvent: " + error));
        console.error(error);
    }
}

exports.reloadEvent = reloadEvent;


//  battle_linker_id   |   monster_id   |   npc_id   |   object_id   |   player_id
/**
 * @param {Object} dirty
 * @param {Object} data
 * @param {number=} data.battle_linker_id
 * @param {number=} data.monster_id
 * @param {number=} data.npc_id
 * @param {number=} data.object_id
 * @param {number=} data.player_id
 * 
 */
async function removeBattleLinkers(dirty, data) {

    try {
        // Just removing one battle linker
        if (data.battle_linker_id) {
            let battle_linker_index = main.getBattleLinkerIndex(data.battle_linker_id);

            if (battle_linker_index === -1) {
                return false;
            }

            //console.log("Sending remove battle linker id: " + dirty.battle_linkers[battle_linker_index].id);

            if (dirty.battle_linkers[battle_linker_index].socket_id) {
                io.to(dirty.battle_linkers[battle_linker_index].socket_id).emit('battle_linker_info',
                    { 'remove': true, 'battle_linker': dirty.battle_linkers[battle_linker_index] });
            }

            if (dirty.battle_linkers[battle_linker_index].being_attacked_socket_id) {
                io.to(dirty.battle_linkers[battle_linker_index].being_attacked_socket_id).emit('battle_linker_info',
                    { 'remove': true, 'battle_linker': dirty.battle_linkers[battle_linker_index] });
            }


            // we need to send to the room as well
            if(typeof dirty.battle_linkers[battle_linker_index].room !== 'undefined' && helper.notFalse(dirty.battle_linkers[battle_linker_index].room)) {
                io.to(dirty.battle_linkers[battle_linker_index].room).emit('battle_linker_info', { 'remove': true, 'battle_linker': dirty.battle_linkers[battle_linker_index] });
            }
            


            delete dirty.battle_linkers[battle_linker_index];
        }
        // Removing all of one type
        else {

            for(let i = 0; i < dirty.battle_linkers.length; i++) {

                if(dirty.battle_linkers[i]) {
                    let remove_battle_linker = false;
    
                    if (data.monster_id) {
                        //console.log("In removeBattleLinkers for monster id: " + data.monster_id);
                        if (
                            (dirty.battle_linkers[i].attacking_type === 'monster' && dirty.battle_linkers[i].attacking_id === data.monster_id) ||
                            (dirty.battle_linkers[i].being_attacked_type === 'monster' && dirty.battle_linkers[i].being_attacked_id === data.monster_id)
                        ) {
                            //log(chalk.cyan("Removing battle linker with monster"));
                            remove_battle_linker = true;

                        }
                    }
    
                    if (data.npc_id) {
                        if (
                            (dirty.battle_linkers[i].attacking_type === 'npc' && dirty.battle_linkers[i].attacking_id === data.npc_id) ||
                            (dirty.battle_linkers[i].being_attacked_type === 'npc' && dirty.battle_linkers[i].being_attacked_id === data.npc_id)
                        ) {
                            //log(chalk.cyan("Removing battle linker with npc"));
                            remove_battle_linker = true;
    
                        }
                    }
    
                    if (data.object_id) {
                        if (
                            (dirty.battle_linkers[i].attacking_type === 'object' && dirty.battle_linkers[i].attacking_id === data.object_id) ||
                            (dirty.battle_linkers[i].being_attacked_type === 'object' && dirty.battle_linkers[i].being_attacked_id === data.object_id)
                        ) {
                            //log(chalk.cyan("Removing battle linker with object"));
                            remove_battle_linker = true;
    
                        }
                    }
    
                    if (data.player_id) {
                        //console.log("In removeBattleLinkers for player id: " + data.player_id);
    
                        if (
                            (dirty.battle_linkers[i].attacking_type === 'player' && dirty.battle_linkers[i].attacking_id === data.player_id) ||
                            (dirty.battle_linkers[i].being_attacked_type === 'player' && dirty.battle_linkers[i].being_attacked_id === data.player_id)
                        ) {
                            //log(chalk.cyan("Removing battle linker with player"));
                            remove_battle_linker = true;
                        }
                    }
    
    
                    if (remove_battle_linker) {
    
                        if (dirty.battle_linkers[i].socket_id) {
                            //console.log("Sending to socket_id");
                            io.to(dirty.battle_linkers[i].socket_id).emit('battle_linker_info', { 'remove': true, 'battle_linker': dirty.battle_linkers[i] });
                        }
    
                        if (dirty.battle_linkers[i].being_attacked_socket_id) {
                            //console.log("Sending to being_attacked_socket_id");
                            io.to(dirty.battle_linkers[i].being_attacked_socket_id).emit('battle_linker_info', { 'remove': true, 'battle_linker': dirty.battle_linkers[i] });
                        }

                        // we need to send to the room as well
                        if(typeof dirty.battle_linkers[i].room !== 'undefined' && helper.notFalse(dirty.battle_linkers[i].room)) {
                            io.to(dirty.battle_linkers[i].room).emit('battle_linker_info', { 'remove': true, 'battle_linker': dirty.battle_linkers[i] });
                        }
    
                        delete dirty.battle_linkers[i];
                    }
                }

            }

        }

    } catch (error) {
        log(chalk.red("Error in world.removeBattleLinkers: " + error));
        console.error(error);
    }

}

exports.removeBattleLinkers = removeBattleLinkers;

// data:    planet_coord_id     |   ship_coord_id
async function sendAreas(socket, room, dirty, data) {

    try {

        let planet_coord_index = -1;
        let ship_coord_index = -1;

        if (data.planet_coord_id) {
            let planet_coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': parseInt(data.planet_coord_id) });
            if (planet_coord_index === -1) {
                return false;
            }

        }

        if (data.ship_coord_id) {
            let ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': parseInt(data.ship_coord_id) });
            if (ship_coord_index === -1) {
                return false;
            }
        }

        for (let i = 0; i < dirty.areas.length; i++) {
            if (dirty.areas[i]) {
                if ((planet_coord_index !== -1 && dirty.planet_coords[planet_coord_index].planet_id === dirty.areas[i].planet_id) ||
                    (ship_coord_index !== -1 && dirty.ship_coords[ship_coord_index].ship_id === dirty.areas[i].ship_id)
                ) {
                    if (socket) {
                        socket.emit('area_info', { 'area': dirty.areas[i] });
                    }

                    if (room) {
                        socket.emit('area_info', { 'area': dirty.areas[i] });
                    }
                }
            }

        }

    } catch (error) {
        log(chalk.red("Error in world.sendAreas: " + error));
        console.error(error);
    }
}

exports.sendAreas = sendAreas;

function sendActiveSalvaging(socket, room, dirty, active_salvaging_index, remove = false) {
    try {

        // remove the index stuff before we send it
        let temp_salvaging = {
            'id': dirty.active_salvagings[active_salvaging_index].id,
            'player_id': dirty.active_salvagings[active_salvaging_index].player_id,
            'total_salvaged': dirty.active_salvagings[active_salvaging_index].total_salvaged
        };

        if(typeof dirty.active_salvagings[active_salvaging_index].object_id !== 'undefined') {
            temp_salvaging.object_id = dirty.active_salvagings[active_salvaging_index].object_id;
        } else {
            temp_salvaging.coord_id = dirty.active_salvagings[active_salvaging_index].coord_id;
            temp_salvaging.coord_type = dirty.active_salvagings[active_salvaging_index].coord_type;
        }



        if (socket) {
            if (remove === true) {
                socket.emit('salvaging_linker_info', {
                    'salvaging_linker': temp_salvaging,
                    'remove': true
                });
            } else {
                socket.emit('salvaging_linker_info', { 'salvaging_linker': temp_salvaging });
            }

        }

        if (room) {
            if (remove === true) {
                io.to(room).emit('salvaging_linker_info', { 'salvaging_linker': temp_salvaging, 'remove': true });
            } else {
                io.to(room).emit('salvaging_linker_info', { 'salvaging_linker': temp_salvaging });
            }
        }

    } catch (error) {
        log(chalk.red("Error in world.sendActiveSalvaging: " + error));
    }
}

exports.sendActiveSalvaging = sendActiveSalvaging;


/**
 * 
 * @param {Object} socket 
 * @param {string} room 
 * @param {Object} dirty 
 * @param {Object} data 
 * @param {number=} data.coord_id
 * @param {number=} data.coord_index
 */
async function sendCoordInfo(socket, room, dirty, data) {

    try {
        let coord_index = -1;

        if (data.coord_index) {
            coord_index = data.coord_index;
        } else if (data.coord_id) {
            coord_index = await main.getCoordIndex({ 'coord_id': data.coord_id });
        }

        if (coord_index === -1) {
            return false;
        }

        if (socket) {
            socket.emit('coord_info', { 'coord': dirty.coords[coord_index] });
        }

        if (room) {
            io.to(room).emit('coord_info', { 'coord': dirty.coords[coord_index] });
        }

    } catch (error) {
        log(chalk.red("Error in world.sendCoordInfo: " + error));
    }

}

exports.sendCoordInfo = sendCoordInfo;



async function sendMarketData(socket, dirty) {

    try {

        console.log("Socket is requesting market data");
        let planet_coord_index = -1;
        let ship_coord_index = -1;

        if (dirty.players[socket.player_index].planet_coord_id) {
            planet_coord_index = await player.getCoordIndex(dirty, socket.player_index, 'planet');

            if (planet_coord_index === -1) {
                return false;
            }


        } else if (dirty.players[socket.player_index].ship_coord_id) {
            ship_coord_index = await player.getCoordIndex(dirty, socket.player_index, 'ship');

            if (ship_coord_index === -1) {
                return false;
            }

        }

        for (let i = 0; i < dirty.market_linkers.length; i++) {
            if (dirty.market_linkers[i] &&
                (planet_coord_index !== -1 && (dirty.market_linkers[i].planet_id === dirty.planet_coords[planet_coord_index].planet_id) ||
                    (ship_coord_index !== -1 && dirty.market_linkers[i].ship_id === dirty.planet_coords[planet_coord_index].ship_id))) {

                console.log("Sending information for market linker id: " + dirty.market_linkers[i].id);

                // Gotta send area info, bid linkers, and then the market linker info
                let area_index = await main.getAreaIndex(dirty.market_linkers[i].area_id);

                if (area_index !== -1) {
                    socket.emit('area_info', { 'area': dirty.areas[area_index] });

                    for (let b = 0; b < dirty.bid_linkers.length; b++) {
                        if (dirty.bid_linkers[b] && dirty.bid_linkers[b].area_id === dirty.areas[area_index].id) {
                            socket.emit('bid_linker_info', { 'bid_linker': dirty.bid_linkers[b] });
                        }
                    }
                }


                socket.emit('market_linker_info', { 'market_linker': dirty.market_linkers[i] });
            }
        }

    } catch (error) {
        log(chalk.red("Error in world.sendMarketData: " + error));
        console.error(error);
    }
}

exports.sendMarketData = sendMarketData;


async function sendNpcInfo(socket, room, dirty, npc_id) {

    try {
        let npc_index = await npc.getIndex(dirty, npc_id);

        if (npc_index === -1) {
            console.log("Sending remove npc " + npc_id + " to player");
            socket.emit('npc_info', { 'npc_id': npc_id, 'action': 'remove' });

            // if a coord still has this npc id, lets remove that as well
            let planet_coord_index = dirty.planet_coords.findIndex(function (obj) { return obj && obj.npc_id === npc_id; });
            if (planet_coord_index !== -1) {
                dirty.planet_coords[planet_coord_index].npc_id = false;
                dirty.planet_coords[planet_coord_index].has_change = true;
            }

            let ship_coord_index = dirty.ship_coords.findIndex(function (obj) { return obj && obj.npc_id === npc_id; });
            if (ship_coord_index !== -1) {
                dirty.ship_coords[ship_coord_index].npc_id = false;
                dirty.ship_coords[ship_coord_index].has_change = true;
            }

            let coord_index = dirty.coords.findIndex(function (obj) { return obj && obj.npc_id === npc_id; });
            if (coord_index !== -1) {
                dirty.coords[coord_index].npc_id = false;
                dirty.coords[coord_index].has_change = true;
            }


            return;
        }


        if (socket !== false) {
            socket.emit('npc_info', { 'npc': dirty.npcs[npc_index] });
        }

        if (room !== false) {
            io.to(room).emit('npc_info', { 'npc': dirty.npcs[npc_index] });
        }

        // Send any inventory items that have a price
        if (dirty.npcs[npc_index].has_inventory) {
            //console.log("npc id: " + dirty.npcs[npc_index].id + " has inventory. Sending items with a price");

            dirty.inventory_items.forEach(function (inventory_item, i) {
                if (inventory_item.npc_id === dirty.npcs[npc_index].id && inventory_item.price) {
                    if (socket !== false) {
                        socket.emit('inventory_item_info', { 'inventory_item': dirty.inventory_items[i] });
                    }

                    if (room !== false) {
                        io.to(room).emit('inventory_item_info', { 'inventory_item': dirty.inventory_items[i] });
                    }
                }
            });
        }


        if (dirty.npcs[npc_index].ship_id) {
            let ship_index = await game_object.getIndex(dirty, dirty.npcs[npc_index].ship_id);
            if (ship_index !== -1) {
                await game_object.sendInfo(socket, room, dirty, ship_index, 'world.sendNpcInfo');
            }

        }


    } catch (error) {
        log(chalk.red("Error in world.sendNpcInfo: " + error));
        console.error(error);
    }



}

exports.sendNpcInfo = sendNpcInfo;


async function sendPlayerAIs(socket, room, dirty, player_id) {
    try {

        player_id = parseInt(player_id);

        for (let a = 0; a < dirty.objects.length; a++) {
            if (dirty.objects[a] && dirty.objects[a].player_id === player_id && dirty.objects[a].object_type_id === 72) {
                //log(chalk.cyan("Player has an ai. Sending that object"));


                await game_object.sendInfo(socket, room, dirty, a);



                // see if there are any ai_rules attached to this AI
                let rules = dirty.rules.filter(rule => rule.object_id === dirty.objects[a].id);
                if (rules) {
                    rules.forEach(function (rule) {

                        sendRuleInfo(socket, room, dirty, rule.id);
                    });
                }

                // We also send any areas that the player created on the planet/ship the AI is on
                if (dirty.objects[a].planet_coord_id) {

                    let planet_coord_index = await game_object.getCoordIndex(dirty, a, 'planet');

                   

                    if (planet_coord_index !== -1) {
                        await planet.sendInfo(socket, room, dirty, { 'planet_id': dirty.planet_coords[planet_coord_index].planet_id });
                        await sendAreas(socket, room, dirty, { 'planet_id': dirty.planet_coords[planet_coord_index].planet_id });
                    }

                } else if (dirty.objects[a].ship_coord_id) {
                    let ship_coord_index = await main.getShipCoordIndex({ 'ship_coord_id': dirty.objects[a].ship_coord_id });
                    if (ship_coord_index !== -1) {
                        let ship_index = await game_object.getIndex(dirty, dirty.ship_coords[ship_coord_index].ship_id);
                        await game_object.sendInfo(socket, room, dirty, ship_index, 'world.sendPlayerAIs');
                        await sendAreas(socket, room, dirty, { 'ship_id': dirty.ship_coords[ship_coord_index].ship_id });
                    }
                }
            }
        }
    } catch (error) {
        log(chalk.red("Error in world.sendPlayerAIs: " + error));
        console.error(error);
    }
}

exports.sendPlayerAIs = sendPlayerAIs;

async function sendPlayerAreas(socket, dirty, player_index) {
    try {

        for (let i = 0; i < dirty.areas.length; i++) {
            if (dirty.areas[i].owner_id === socket.player_id || dirty.areas[i].renting_player_id === socket.player_id) {
                socket.emit('area_info', { 'area': dirty.areas[i] });
            }
        }

    } catch (error) {
        log(chalk.red("Error in world.sendPlayerAreas: " + error));
        console.error(error);
    }
}

exports.sendPlayerAreas = sendPlayerAreas;

function sendPlayerCount(socket) {
    try {

        //console.log("In sendPlayerCount");
        socket.emit('player_count_info', { 'player_count': Object.keys(io.sockets.sockets).length });


    } catch (error) {
        log(chalk.red("Error in world.sendPlayerCount: " + error));
        console.error(error);
    }
}

exports.sendPlayerCount = sendPlayerCount;


async function sendRuleInfo(socket, room, dirty, rule_id) {
    try {
        let rule_index = await main.getRuleIndex(rule_id);

        if (rule_index !== -1) {
            if (helper.notFalse(socket)) {
                socket.emit('rule_info', { 'rule': dirty.rules[rule_index] });
            } else if (helper.notFalse(room)) {
                io.to(room).emit('rule_info', { 'rule': dirty.rules[rule_index] });
            }
        }
    } catch (error) {
        log(chalk.red("Error in world.sendRuleInfo: " + error));
        console.error(error);
    }
}

exports.sendRuleInfo = sendRuleInfo;

// ship_coord_index   OR   ship_coord_id
async function sendShipCoordInfo(socket, room, dirty, data) {

    try {
        let coord_index = -1;

        if (data.ship_coord_index) {
            coord_index = data.ship_coord_index;
        } else if (data.ship_coord_id) {
            coord_index = await main.getShipCoordIndex({ 'ship_coord_id': data.ship_coord_id });
        }

        if (coord_index === -1) {
            return false;
        }

        if (socket) {
            socket.emit('ship_coord_info', { 'ship_coord': dirty.ship_coords[coord_index] });
        }

        if (room) {
            io.to(room).emit('ship_coord_info', { 'ship_coord': dirty.ship_coords[coord_index] });
        }

    } catch (error) {
        log(chalk.red("Error in world.sendShipCoordInfo: " + error));
    }

}

exports.sendShipCoordInfo = sendShipCoordInfo;

async function sendSkinPurchaseLinkers(socket, dirty) {

    try {


        let [rows, fields] = await (pool.query("SELECT * FROM skin_purchase_linkers WHERE user_id = ?", [dirty.players[socket.player_index].user_id]));

        if (rows[0]) {

            for (let i = 0; i < rows.length; i++) {

                let existing_skin_purchase_linker_index = dirty.skin_purchase_linkers.findIndex(function (obj) { return obj && obj.id === rows[i].id; });

                if (existing_skin_purchase_linker_index === -1) {
                    dirty.skin_purchase_linkers.push(rows[i]);
                }

                socket.emit('skin_purchase_linker_info', { 'skin_purchase_linker': rows[i] });
            }

        }


    } catch (error) {
        log(chalk.red("Error in world.sendSkinPurchaseLinkers: " + error));
        console.error(error);
    }
}

exports.sendSkinPurchaseLinkers = sendSkinPurchaseLinkers;


// Sets the planet_type_id of a planet
// data:    planet_index   |   planet_type_index
async function setPlanetType(socket, dirty, data) {

    try {

        console.log("In world.setPlanetType");

        data.planet_index = parseInt(data.planet_index);
        data.planet_type_index = parseInt(data.planet_type_index);


        if (isNaN(data.planet_index) || data.planet_index === -1 || !dirty.planets[data.planet_index]) {
            log(chalk.yellow("Bad planet_index in world.setPlanetType"));
            return false;
        }

        if (isNaN(data.planet_type_index) || data.planet_type_index === -1 || !dirty.planet_types[data.planet_type_index]) {
            log(chalk.yellow("Bad planet_type_index in world.setPlanetType"));
            return false;
        }

        if (!socket.is_admin) {
            log(chalk.red("We think a socket with player id: " + socket.player_id + " is trying to be mr hacker man"));
            return false;

        }

        console.log("Setting planet id: " + dirty.planets[data.planet_index].id + " to planet type id: " + dirty.planet_types[data.planet_type_index].id);

        let coord_index = await main.getCoordIndex({ 'coord_id': dirty.planets[data.planet_index].coord_id });


        let can_place_all_tiles = true;
        let planet_type_has_display_linkers = false;
        for (let i = 0; i < dirty.planet_type_display_linkers.length; i++) {
            if (dirty.planet_type_display_linkers[i].planet_type_id === dirty.planet_types[data.planet_type_index].id) {
                planet_type_has_display_linkers = true;
                if (dirty.planet_type_display_linkers[i].position_x === 0 && dirty.planet_type_display_linkers[i].position_y === 0) {

                } else {
                    let checking_tile_x = dirty.coords[coord_index].tile_x + dirty.planet_type_display_linkers[i].position_x;
                    let checking_tile_y = dirty.coords[coord_index].tile_y + dirty.planet_type_display_linkers[i].position_y;

                    let checking_coord_index = await main.getCoordIndex({ 'tile_x': checking_tile_x, 'tile_y': checking_tile_y });

                    if (checking_coord_index === -1 || dirty.coords[checking_coord_index].player_id || dirty.coords[checking_coord_index].object_id ||
                        (dirty.coords[checking_coord_index].planet_id && dirty.coords[checking_coord_index].planet_id !== dirty.planets[data.planet_index].id) ||
                        (dirty.coords[checking_coord_index].belongs_to_planet_id && dirty.coords[checking_coord_index].belongs_to_planet_id !== dirty.planets[data.planet_index].id) ||
                        dirty.coords[checking_coord_index].npc_id) {

                        if (checking_coord_index === -1) {
                            console.log("Returning false. Did not find coord at tile_x,y: " + checking_tile_x + "," + checking_tile_y);
                        } else {
                            console.log("Returning false on coord id: " + dirty.coords[checking_coord_index].id +
                                " tile_x,y: " + dirty.coords[checking_coord_index].tile_x + "," + dirty.coords[checking_coord_index].tile_y);
                        }
                        can_place_all_tiles = false;
                    }
                }
            }
        }

        if (can_place_all_tiles === false) {
            log(chalk.yellow("Can't place all tiles. Returning false."));
            return false;
        }

        if (!planet_type_has_display_linkers) {
            log(chalk.yellow("Player type doesn't have display linkers"));
            return false;
        }

        console.log("Can place all tiles");
        for (let i = 0; i < dirty.planet_type_display_linkers.length; i++) {
            if (dirty.planet_type_display_linkers[i].planet_type_id === dirty.planet_types[data.planet_type_index].id) {

                if (dirty.planet_type_display_linkers[i].position_x === 0 && dirty.planet_type_display_linkers[i].position_y === 0) {

                } else {
                    let checking_tile_x = dirty.coords[coord_index].tile_x + dirty.planet_type_display_linkers[i].position_x;
                    let checking_tile_y = dirty.coords[coord_index].tile_y + dirty.planet_type_display_linkers[i].position_y;

                    let checking_coord_index = await main.getCoordIndex({ 'tile_x': checking_tile_x, 'tile_y': checking_tile_y });

                    if (checking_coord_index !== -1) {
                        console.log("Set belongs_to_planet_id");
                        dirty.coords[checking_coord_index].belongs_to_planet_id = dirty.planets[data.planet_index].id;
                        dirty.coords[checking_coord_index].has_change = true;
                    } else {
                        console.log("Couldn't find coord at " + checking_tile_x + "," + checking_tile_y);
                    }
                }
            }
        }


        dirty.planets[data.planet_index].type = dirty.planet_types[data.planet_type_index].name;
        dirty.planets[data.planet_index].planet_type_id = dirty.planet_types[data.planet_type_index].id;
        dirty.planets[data.planet_index].current_hp = 1000000;
        dirty.planets[data.planet_index].max_hp = 1000000;
        dirty.planets[data.planet_index].x_size_above = dirty.planet_types[data.planet_type_index].x_size_above;
        dirty.planets[data.planet_index].y_size_above = dirty.planet_types[data.planet_type_index].y_size_above;
        dirty.planets[data.planet_index].x_size_under = dirty.planet_types[data.planet_type_index].x_size_under;
        dirty.planets[data.planet_index].y_size_under = dirty.planet_types[data.planet_type_index].y_size_under;

        dirty.planets[data.planet_index].lowest_depth = -1 * helper.getRandomIntInclusive(dirty.planet_types[data.planet_type_index].min_depth,
            dirty.planet_types[data.planet_type_index].max_depth);

        dirty.planets[data.planet_index].has_change = true;


    } catch (error) {
        log(chalk.red("Error in world.setPlanetType: " + error));
        console.error(error);
    }
}

exports.setPlanetType = setPlanetType;


async function setPlayerBody(dirty, player_index) {
    try {
        console.log("Player doesn't have a body. Inserting one. Default to human body");
        // let get the basic human body type
        let body_object_type_index = main.getObjectTypeIndex(110);
        let body_object_index = await insertObjectType({}, dirty,
            { 'object_type_id': dirty.object_types[body_object_type_index].id, 'player_id': dirty.players[player_index].id });
        if (body_object_index !== -1) {
            dirty.players[player_index].body_id = dirty.objects[body_object_index].id;
            dirty.players[player_index].current_hp = dirty.object_types[body_object_type_index].hp;
            dirty.players[player_index].has_change = true;

            dirty.objects[body_object_index].player_id = dirty.players[player_index].id;
            dirty.objects[body_object_index].has_change = true;
        } else {
            log(chalk.red("Unable to give player a body"));
        }

        console.log("Done with body");
    } catch (error) {
        log(chalk.red("Error in world.setPlayerBody: " + error));
    }

}

exports.setPlayerBody = setPlayerBody;

async function setPlayerMoveDelay(socket, dirty, player_index) {

    try {

        //console.log("In setPlayerMoveDelay");

        if (dirty.players[player_index].planet_coord_id || dirty.players[player_index].ship_coord_id) {
            //console.log("Player is on planet or ship");

            let body_index = await game_object.getIndex(dirty, dirty.players[player_index].body_id);

            if (body_index !== -1) {
                let body_type_index = main.getObjectTypeIndex(dirty.objects[body_index].object_type_id);

                if (body_type_index === -1) {
                    log(chalk.yellow("Did not find object type of body id: " + dirty.objects[body_index].id));
                } else if (!dirty.object_types[body_type_index].move_delay) {
                    socket.move_delay = 500;
                } else {
                    socket.move_delay = dirty.object_types[body_type_index].move_delay;
                }

            } else {
                log(chalk.yellow("Did not find body in objects"));
            }


        } else if (dirty.players[player_index].coord_id) {

            let ship_index = await game_object.getIndex(dirty, dirty.players[player_index].ship_id);

            if (ship_index !== -1) {
                let ship_type_index = main.getObjectTypeIndex(dirty.objects[ship_index].object_type_id);
                if (ship_type_index !== -1) {
                    if (dirty.object_types[ship_type_index].move_delay) {


                        socket.move_delay = dirty.object_types[ship_type_index].move_delay;

                        if(dirty.object_types[ship_type_index].needs_engines && typeof dirty.objects[ship_index].current_engine_power !== 'undefined') {

                            // Division by 0 is bad stuff - just set it to 1000000 and if move delay is 1000000, always deny the move
                            if(dirty.objects[ship_index].current_engine_power === 0) {
                                socket.move_delay = 1000000;
                            } else {
                                socket.move_delay = socket.move_delay * ( dirty.object_types[ship_type_index].engine_power_required / dirty.objects[ship_index].current_engine_power);
                            }

                            

                            //console.log("Ship engines changed move delay to: " + socket.move_delay);
                        } else {
                            if(!dirty.object_types[ship_type_index].needs_engines) {
                                //console.log("Ship does not require engines");
                            }

                            if(typeof dirty.objects[ship_index].current_engine_power === 'undefined') {
                                console.log("Ship current_engine_power is undefined");
                            }
                        }
                        
                    }
                }
            }
        } else {
            console.log("Apparently we are calling this before we place the player");
        }



        // Just incase we failed to set it - set it to the default
        if (!socket.move_delay) {
            socket.move_delay = 500;
            console.log("Defaulted to 500 move delay");
        }

        // With any move_delay change, the old average isn't going to apply.
        socket.move_totals = 0;
        socket.move_count = 0;
        //log(chalk.magenta("Set client move_delay to: " + socket.move_delay));

    } catch (error) {
        log(chalk.red("Error in world.setPlayerMoveDelay: " + error));
        console.error(error);
    }
}

exports.setPlayerMoveDelay = setPlayerMoveDelay;


async function skinRemove(socket, dirty, skin_object_type_id) {
    try {

        let player_info = await player.getCoordAndRoom(dirty, socket.player_index);

        dirty.players[socket.player_index].skin_object_type_id = false;
        dirty.players[socket.player_index].has_change = true;

        await player.sendInfo( socket, player_info.room, dirty, dirty.players[socket.player_index].id);

        console.log("Done in skin remove");

    } catch (error) {
        log(chalk.red("Error in world.skinRemove: " + error));
        console.error(error);
    }
}

exports.skinRemove = skinRemove;

async function skinUse(socket, dirty, skin_object_type_id) {
    try {

        skin_object_type_id = parseInt(skin_object_type_id);
        // Make sure there is a skin_purchase_linker
        let skin_purchase_linker_index = dirty.skin_purchase_linkers.findIndex(function (obj) {
            return obj &&
                obj.user_id === dirty.players[socket.player_index].user_id && obj.object_type_id === skin_object_type_id;
        });

        if (skin_purchase_linker_index === -1) {
            log(chalk.yellow("Player is trying to use a skin they don't own"));
            socket.emit('result_info', { 'failure': "Not owned" });
            return false;
        }

        let player_info = await player.getCoordAndRoom(dirty, socket.player_index);

        dirty.players[socket.player_index].skin_object_type_id = skin_object_type_id;
        dirty.players[socket.player_index].has_change = true;

        await player.sendInfo( socket, player_info.room, dirty, dirty.players[socket.player_index].id);

    } catch (error) {
        log(chalk.red("Error in world.skinUse: " + error));
        console.error(error);
    }
}

exports.skinUse = skinUse;


/**
 * @param {Object} dirty
 * @param {Object} data
 * @param {('planet'|'ship'|'galaxy')} data.scope
 * @param {number} data.base_coord_index
 * @param {('object'|'monster')} data.spawning_type
 * @param {number} data.spawning_type_id
 * @param {number} data.spawning_amount
 */
async function spawnAdjacent(dirty, data) {
    try {

        //log(chalk.cyan("Starting up spawnAdjacent"));

        //console.time("spawnAdjacent");
        let base_coord = {};
        if (data.scope === 'planet') {
            base_coord = dirty.planet_coords[data.base_coord_index];
        } else if (data.scope === 'ship') {
            base_coord = dirty.ship_coords[data.base_coord_index];
        } else if(data.scope === 'galaxy') {
            base_coord = dirty.coords[data.base_coord_index];
        }

        if(helper.isFalse(base_coord)) {
            log(chalk.yellow("Invalid base coord sent into world.spawnAdjacent"));
            console.trace("here");
            return false;
        }


        // spawnAdjacent won't know if an object type spawn is JUST an object type, or could be an object too
        // I don't think there are any instances of us actually spawning an object
        let placing_index = -1;
        let spawning_type_for_get_open_coord_index = data.spawning_type;
        let being_spawned_object_type_index = -1;
        
        // Keep this as an object type until we confirm an open coord so we aren't spawning 
        // objects we can't place anywhere
        if(spawning_type_for_get_open_coord_index === 'object') {
            
            being_spawned_object_type_index = main.getObjectTypeIndex(data.spawning_type_id);
             
            spawning_type_for_get_open_coord_index = 'object_type';
            placing_index = being_spawned_object_type_index;
        
            
        } else if(spawning_type_for_get_open_coord_index === 'monster') {

            let monster_type_index = main.getMonsterTypeIndex(data.spawning_type_id);
            placing_index = monster_type_index;

            spawning_type_for_get_open_coord_index = 'monster_type';


        }



        //let placing_coord_index = -1;
        //let placing_coord = false;

        let placing_coord = {};
        let placing_coord_index = await getOpenCoordIndex(dirty, data.scope, data.base_coord_index, spawning_type_for_get_open_coord_index, placing_index, 1);

        if(placing_coord_index === -1) {
            placing_coord_index = await getOpenCoordIndex(dirty, data.scope, data.base_coord_index, spawning_type_for_get_open_coord_index, placing_index, 3);
        }

        if (placing_coord_index === -1) {
            log(chalk.yellow("No space around to spawn"));
            return false;
        }

        if(dirty.object_types[being_spawned_object_type_index].assembled_as_object) {
            console.log("Now lets create it!");
            spawning_type_for_get_open_coord_index = 'object';

            // and we have to create the object
            placing_index = await insertObjectType({}, dirty, { 'object_type_id': dirty.object_types[being_spawned_object_type_index].id });

        }

        // If it was an object type, and that object type is assembled as an object, we can now create it


        if(data.scope === 'planet') {

            placing_coord = dirty.planet_coords[placing_coord_index];
        } else if(data.scope === 'ship') {
            placing_coord = dirty.ship_coords[placing_coord_index];
        } else if(data.scope === 'galaxy') {
            placing_coord = dirty.coords[placing_coord_index];
        }

        if (data.spawning_type === 'object') {



            // We need to insert an object, and add it to the coord
            if (dirty.object_types[being_spawned_object_type_index].assembled_as_object) {

                let place_object_data = { 'object_index': placing_index };
                if (data.scope === 'planet') {
                    place_object_data.planet_coord_index = placing_coord_index;
                } else if (data.scope === 'ship') {
                    place_object_data.ship_coord_index = placing_coord_index;
                } else if(data.scope === 'galaxy') {
                    place_object_data.coord_index = placing_coord_index;
                }

                await game_object.place({}, dirty, place_object_data);



            }
            // We only need to set the object_type_id and the amount for the coord
            else {

                let update_coord_data = { 'object_type_id': dirty.object_types[being_spawned_object_type_index].id };

                // We can just increment the count
                if (placing_coord.object_type_id === data.spawning_type_id) {
                    update_coord_data.amount = placing_coord.object_amount + data.spawning_amount;
                } else {
                    update_coord_data.amount = data.spawning_amount;
                }

                if (data.scope === "planet") {
                    update_coord_data.planet_coord_index = placing_coord_index;
                } else if (data.scope === "ship") {
                    update_coord_data.ship_coord_index = placing_coord_index;

                } else if(data.scope === 'galaxy') {
                    update_coord_data.coord_index = placing_coord_index;
                }

                await main.updateCoordGeneric({}, update_coord_data);

            }



        } else if (data.spawning_type === 'monster') {
            let spawn_monster_data = { };
            if (data.scope === 'planet') {
                spawn_monster_data.planet_coord_index = placing_coord_index;
            } else if (data.scope === 'ship') {
                spawn_monster_data.ship_coord_index = placing_coord_index;
            } else if(data.scope === 'galaxy') {
                spawn_monster_data.coord_index = placing_coord_index;
            }

            await monster.spawn(dirty, data.spawning_type_id, spawn_monster_data);

            return true;

        }

        //console.timeEnd("spawnAdjacent");


    } catch (error) {
        log(chalk.red("Error in world.spawnAdjacent: " + error));
        console.error(error);
    }
}


exports.spawnAdjacent = spawnAdjacent;


/*
// Deprecated in favor of event.tickSpawning. Keeping it around just for now incase there's some functionality difference I didn't notice
async function spawnGalaxyObjects(dirty) {

    try {

        let spawns_in_galaxy_object_type_ids = [];
        for(let i = 0; i < dirty.object_types.length; i++) {
            if(dirty.object_types[i] && dirty.object_types[i].spawns_in_galaxy) {
                spawns_in_galaxy_object_type_ids.push(dirty.object_types[i].id);
            }
        }


        let galaxy_object_count = 0;
        for(let i = 0; i < dirty.objects.length && galaxy_object_count < global.max_asteroid_count; i++) {
            if(dirty.objects[i] && spawns_in_galaxy_object_type_ids.indexOf(dirty.objects[i].object_type_id) !== -1) {
                galaxy_object_count++;
            }
        }

        if(galaxy_object_count >= global.max_asteroid_count) {
            return false;
        }

        console.log("Not at max galaxy objects. Attempting to spawn one");



        // choose a random galaxy coord
        //random_x = 4;
        //random_y = 6;
        let random_x = parseInt(Math.floor(Math.random() * 100));
        let random_y = parseInt(Math.floor(Math.random() * 100));
        let random_object_type_id = spawns_in_galaxy_object_type_ids[Math.floor(Math.random()*spawns_in_galaxy_object_type_ids.length)];


        let coord_index = dirty.coords.findIndex(function(obj) { return obj && obj.tile_x === random_x && obj.tile_y === random_y; });

        if(coord_index === -1) {
            return false;
        }

        let can_place_result = await game_object.canPlace(dirty, 'galaxy', dirty.coords[coord_index],
            { 'object_type_id': random_object_type_id });


        if(!can_place_result) {
            console.log("Can't place our galaxy object here");
            return false;
        }

        console.log("Found galaxy coord we can put a galaxy object on (index: " + coord_index + " id: " + dirty.coords[coord_index].id + " tile_x: " + dirty.coords[coord_index].tile_x + " tile_y: " + dirty.coords[coord_index].tile_y);

        let inserting_object_type_data = {
            'object_type_id': random_object_type_id };
        let new_object_id = await insertObjectType(false, dirty, inserting_object_type_data);

        if(!new_object_id) {
            log(chalk.yellow("Failed to insert new object. Returning false"));
            return false;
        }


        let new_object_index = dirty.objects.findIndex(function(obj) { return obj && obj.id === new_object_id; });

        if(new_object_index !== -1) {
            await game_object.place(false, dirty, { 'object_index': new_object_index,
                'coord_index': coord_index });
            //await world.addObjectToCoord(dirty, new_object_index, coord_index);
        } else {
            log(chalk.yellow("Could not get index for new object id: " + new_object_id));
        }



    } catch(error) {
        log(chalk.red("Error in world.spawnGalaxyObjects: " + error));
        console.error(error);
    }
}

exports.spawnGalaxyObjects = spawnGalaxyObjects;

 */






async function shielded(dirty, damage_amount, object_index) {

    try {
        let object_type_index = main.getObjectTypeIndex(dirty.objects[object_index].object_type_id);

        if (!dirty.object_types[object_type_index].is_ship) {
            return false;
        }

        console.log("Seeing if ship is shielded");

        // see if we have energy storage with energy
        let energy_storage_ship_coords = dirty.ship_coords.filter(ship_coord => ship_coord.ship_id === dirty.objects[object_index].id &&
            ship_coord.object_type_id === 160);

        if (energy_storage_ship_coords.length > 0) {
            for (let energy_ship_coord of energy_storage_ship_coords) {

                let coord_object_index = await game_object.getIndex(dirty, energy_ship_coord.object_id);

                if (coord_object_index !== -1 && dirty.objects[coord_object_index].energy >= damage_amount) {

                    // now just see if we have a shield to process this!
                    let shield_generator_ship_coords = dirty.ship_coords.filter(ship_coord => ship_coord.ship_id === dirty.objects[object_index].id &&
                        ship_coord.object_type_id === 48);

                    if (shield_generator_ship_coords.length > 0) {

                        dirty.objects[coord_object_index].energy -= damage_amount;
                        dirty.objects[coord_object_index].has_change = true;

                        return true;

                        for (let shield_ship_coord of shield_generator_ship_coords) {

                            // TODO - make it so shields take a while to process/absorb incoming damage. This would require separating an attack out into its parts

                        }
                    }
                }

            }
        }


        return false;

    } catch (error) {
        log(chalk.red("Error in world.shielded: " + error));
        console.error(error);
    }

}

exports.shielded = shielded;


// data: area_id   |   price
async function submitBid(socket, dirty, data) {

    try {

        console.log("Player is submitting a bid!");

        let sql = "INSERT INTO bid_linkers(player_id, area_id, price) VALUES(?,?,?)";
        let inserts = [socket.player_id, data.area_id, data.price];

        let [result] = await (pool.query(sql, inserts));

        let new_bid_linker_id = result.insertId;

        console.log("Got new bid linker id: " + new_bid_linker_id);

        let [rows, fields] = await (pool.query("SELECT * FROM bid_linkers WHERE id = ?", [new_bid_linker_id]));
        if (rows[0]) {
            let bid_linker = rows[0];
            bid_linker.has_change = false;
            let bid_linker_index = dirty.bid_linkers.push(bid_linker) - 1;

            // Gotta send the bid to everyone on the ship/planet
            let area_index = await main.getAreaIndex(data.area_id);

            if (area_index !== -1) {
                if (dirty.areas[area_index].planet_id) {
                    io.to("planet_" + dirty.areas[area_index].planet_id).emit('bid_linker_info', { 'bid_linker': dirty.bid_linkers[bid_linker_index] });
                } else if (dirty.areas[area_index].ship_id) {
                    io.to("ship_" + dirty.areas[area_index].ship_id).emit('bid_linker_info', { 'bid_linker': dirty.bid_linkers[bid_linker_index] });
                }
            }






        }


    } catch (error) {
        log(chalk.red("Error in world.submitBid: " + error));
        console.error(error);
    }
}

exports.submitBid = submitBid;


async function tickGalaxy(dirty) {

    try {
        for(let i = 0; i < dirty.galaxies.length; i++) {


            if(dirty.galaxies[i]) {
                dirty.galaxies[i].month++;
    
                if(dirty.galaxies[i].month >= 13) {
                    dirty.galaxies[i].month = 1;
                    dirty.galaxies[i].year++;
                }
            }
    
        }
    } catch(error) {
        log(chalk.red("Error in world.tickGalaxy: " + error));
        console.error(error);
    }
   

}

exports.tickGalaxy = tickGalaxy;


async function tickNomad(dirty, admin_command = false) {

     try {

        console.log("In world.tickNomad");

        // Admin commands always tick The Great Nomad. Otherwise it's a 10% chance every 12 hours
        if(admin_command === false) {
            let rand_chance = helper.getRandomIntInclusive(1,10);

            if(rand_chance !== 4) {
                return false;
            }
        }
        

        let nomad_index = await game_object.getIndex(dirty, 105913);

        if(nomad_index === -1) {
            log(chalk.yellow("Could not find The Great Nomad"));
            return false;
        }


        // Remove it from the coord
        if(dirty.objects[nomad_index].coord_id) {

            console.log("Removing The Great Nomad From coord id: " + dirty.objects[nomad_index].coord_id);

            game_object.removeFromCoord(dirty, nomad_index);

            addPlayerLog(dirty, -1, "The Great Nomad has left the galaxy");

            
            

        } 
        // Try to add it to a random galaxy coord
        else {

            let random_x = helper.getRandomIntInclusive(4,96);
            let random_y = helper.getRandomIntInclusive(4,96)

            // testing on the same coord each time
            let coord_index = await main.getCoordIndex({ 'tile_x': random_x, 'tile_y': random_y });

            if(coord_index === -1) {
                log(chalk.yellow("Could not find galaxy coord at: " + random_x + "," + random_y));
                return false;
            }

            let can_place_result = await game_object.canPlace(dirty, 'galaxy', dirty.coords[coord_index], { 'object_index': nomad_index });

            if(can_place_result) {
                console.log("Trying to place The Great Nomad at: " + random_x + "," + random_y);
                let placed_result = await game_object.place(false, dirty, { 'object_index': nomad_index, 'coord_index': coord_index });

                if(placed_result) {
                    console.log("Successfully placed The Great Nomad");
                    addPlayerLog(dirty, -1, "The Great Nomad has returned to the galaxy");

                    game_object.sendInfo(false, "ship_" + dirty.objects[nomad_index].id, dirty, nomad_index);
                    game_object.sendInfo(false, 'galaxy', dirty, nomad_index);
                } else {
                    log(chalk.yellow("Failed to place The Great Nomad"));
                }

                
            } else {
                console.log("Can't place The Great Nomad at: " + random_x + "," + random_y);
            }

        }



     } catch(error) {
         log(chalk.red("Error in world.tickNomad: " + error));
         console.error(error);
     }

}

exports.tickNomad = tickNomad;



/**
 * @param {Object} dirty
 * @param {number} force_event_id
 * 
 */
async function tickStorytellers(dirty, force_event_id = 0) {

    try {



        //console.log("in tickStorytellers");
        for(let i = 0; i < dirty.storytellers.length; i++) {

            if(helper.isFalse(dirty.storytellers[i].current_spawned_event_id)) {

                console.log("No current spawned event");

                // If there's no current spawned event, randomly choose a good/bad one!
                let rand_chance = helper.getRandomIntInclusive(1,100);
                console.log("Rand chance: " + rand_chance);
                if(rand_chance < 4 || force_event_id) {

                    let difficulty_ceiling = 5;
                    let difficulty_floor = 0;

                    if(dirty.storytellers[i].previous_difficulty && dirty.storytellers[i].previous_difficulty > 5) {
                        difficulty_ceiling = dirty.storytellers[i].previous_difficulty;
                        difficulty_floor = difficulty_ceiling - 5;
                    }


                    // If the previous event took a long time for players to remove, we can tick difficulty down a bit
                    if(dirty.storytellers[i].previous_difficulty && dirty.storytellers[i].previous_event_ticks > 100 && difficulty_ceiling > 5) {
                        difficulty_ceiling -= 5;
                        difficulty_floor -= 5;

                    } 
                    // Players took care of this fast, we can increase difficulty
                    else if(dirty.storytellers[i].previous_difficulty) {
                        difficulty_ceiling += 5;
                        difficulty_floor += 5;
                    }
    

                    let possible_events = dirty.events.filter(event_filter => event_filter.difficulty <= difficulty_ceiling);
                    if(possible_events.length > 0) {

                        let chosen_event = possible_events[Math.floor(Math.random()*possible_events.length)];

                        let event_index = event.getIndex(dirty, chosen_event.id);

                        let chosen_planet_index = helper.getRandomIntInclusive(0, dirty.planets.length - 1);

                        if(dirty.planets[chosen_planet_index]) {
                            console.log("Storyller is going to try to spawn event " + dirty.events[event_index].name + " on planet id: " + dirty.planets[chosen_planet_index].id);
                            let spawned_event_index = await event.spawn(dirty, event_index, { 'planet_id': dirty.planets[chosen_planet_index].id });

                            console.log("spawned_event_index:");
                            console.log(spawned_event_index);

                            if(spawned_event_index === -1) {
                                console.log("Looks like the event failed to spawn");
                            } else {
                                dirty.storytellers[i].current_spawned_event_id = dirty.spawned_events[spawned_event_index].id;
                                dirty.storytellers[i].current_event_ticks = 0;
                                dirty.storytellers[i].has_change = true;

                                let planet_type_index = main.getPlanetTypeIndex(dirty.planets[chosen_planet_index].planet_type_id);
                                // add a player log!!

                                let player_log_message = "The " + dirty.planet_types[planet_type_index].name + " planet " + dirty.planets[chosen_planet_index].name;

                                if(dirty.events[event_index].id === 90) {
                                    player_log_message += " is being attacked by bugs";
                                } else if(dirty.events[event_index].id === 22) {
                                    player_log_message += " is being attacked by an Acid Fiend";
                                }


                                addPlayerLog(dirty, -1,  player_log_message,
                                    { 'planet_id': dirty.planets[chosen_planet_index].id, 'event_id': chosen_event.id });
                            }
                        } else {
                            console.log("Was unable to pick a planet. chosen_planet_index: " + chosen_planet_index);
                        }

                        
        
                    } else {
                        log(chalk.yellow("WARNING! Storyteller has no events in the difficult range " + difficulty_floor + " - " + difficulty_ceiling))
                    }




                    
                }

            } else {
                //console.log("Ticking current event");

                dirty.storytellers[i].current_event_ticks++;
                dirty.storytellers[i].has_change = true;
            }




        }
        
    } catch(error) {
        log(chalk.red("Error in world.tickStorytellers: " + error));
        console.error(error);
    }



}

exports.tickStorytellers = tickStorytellers;



// Waiting drops will either have an object_index, or an object_type_id. Waiting drops will also either have a planet_coord_index, or a ship_coord_index
async function tickWaitingDrops(dirty) {

    try {

        //let hrstart = new process.hrtime();
        //console.log("In world.tickWaitingDrops");

        for(let i = 0; i < dirty.waiting_drops.length; i++) {

            if(dirty.waiting_drops[i]) {
                //console.log("Have waiting drop!");
                //console.log(dirty.waiting_drops[i]);

                if(typeof dirty.waiting_drops[i].object_type_id !== 'undefined' && helper.isFalse(dirty.waiting_drops[i].object_type_id)) {
                    log(chalk.yellow("INVALID WAITING LINKER!"));
                    delete dirty.waiting_drops[i];

                }

                let place_around_data = {};
                let coord_type = 'none';
                let base_coord_index = -1;
                let placing_index = -1;
                let placing_type = 'none';


                // 
                if(typeof dirty.waiting_drops[i].planet_coord_index !== "undefined") {
                    place_around_data.planet_coord_index = dirty.waiting_drops[i].planet_coord_index;
                    coord_type = 'planet';
                    base_coord_index = dirty.waiting_drops[i].planet_coord_index;
                }

                if(typeof dirty.waiting_drops[i].ship_coord_index !== "undefined") {
                    place_around_data.ship_coord_index = dirty.waiting_drops[i].ship_coord_index;
                    coord_type = 'ship';
                    base_coord_index = dirty.waiting_drops[i].ship_coord_index;
                }

                if(typeof dirty.waiting_drops[i].coord_index !== "undefined") {
                    place_around_data.coord_index = dirty.waiting_drops[i].coord_index;
                    coord_type = 'galaxy';
                    base_coord_index = dirty.waiting_drops[i].coord_index;
                }

                if(typeof dirty.waiting_drops[i].virtual_coord_index !== "undefined") {
                    place_around_data.virtual_coord_index = dirty.waiting_drops[i].virtual_coord_index;
                    coord_type = 'virtual';
                    base_coord_index = dirty.waiting_drops[i].virtual_coord_index;
                }

                if(typeof dirty.waiting_drops[i].object_index !== "undefined") {
                    place_around_data.object_index = dirty.waiting_drops[i].object_index;
                    placing_type = 'object';
                    placing_index = dirty.waiting_drops[i].object_index;
                }

                if(typeof dirty.waiting_drops[i].object_type_id !== "undefined") {
                    place_around_data.object_type_id = dirty.waiting_drops[i].object_type_id;
                    placing_type = 'object_type';
                    placing_index = main.getObjectTypeIndex(dirty.waiting_drops[i].object_type_id);
                
                }


                //console.time("gameobject.canPlaceAround");
                //let old_placing_coord_index = await game_object.canPlaceAround(dirty, 2, place_around_data);
                //console.timeEnd("gameobject.canPlaceAround");

                //console.time("getOpenCoordIndex");
                let placing_coord_index = await getOpenCoordIndex(dirty, coord_type, base_coord_index, placing_type, placing_index, 2);
                //console.timeEnd("getOpenCoordIndex");


                if(placing_coord_index !== -1) {
                    log(chalk.green("We found a coord where we can put our waiting drop!"));

                    let update_coord_data = {};
                    let placing_coord = {};

                    // Get our planet/ship/galaxy/virtual set
                    if(coord_type === 'planet') {
                        placing_coord = dirty.planet_coords[placing_coord_index];
                        update_coord_data.planet_coord_index = placing_coord_index;
                      
                    } else if(coord_type === 'ship') {
                        placing_coord = dirty.ship_coords[placing_coord_index];
                        update_coord_data.ship_coord_index = placing_coord_index;
                       
                    } else if(coord_type === 'galaxy') {
                        placing_coord = dirty.coords[placing_coord_index];
                        update_coord_data.coord_index = placing_coord_index;
                    } else if(coord_type === 'virtual') {
                        placing_coord = dirty.virtual_coords[placing_coord_index];
                        update_coord_data.virtual_coord_index = placing_coord_index;
                    }



                    // It's possible that if we are dropping an object type, we returned a coord with that object type already on it, and we are 
                    // only incrementing the amount of the coord
                    let only_updating_amount = false;
                    if(typeof dirty.waiting_drops[i].object_type_id !== "undefined" && placing_coord.object_type_id === dirty.waiting_drops[i].object_type_id) {
                        console.log("Old coord amount: " + placing_coord.object_amount + " waiting drops amount: " + dirty.waiting_drops[i].amount);
                        only_updating_amount = true;
                        update_coord_data.amount = placing_coord.object_amount + dirty.waiting_drops[i].amount;
                        console.log("update_coord_data.amount: " + update_coord_data.amount);

                    }


                    if(!only_updating_amount) {
                        if(typeof dirty.waiting_drops[i].object_index !== "undefined") {
                            update_coord_data.object_index = dirty.waiting_drops[i].object_index;
                        }
        
                        if(typeof dirty.waiting_drops[i].object_type_id !== "undefined") {
                            update_coord_data.object_type_id = dirty.waiting_drops[i].object_type_id;
                        }
    
                        if(dirty.waiting_drops[i].amount) {
                            update_coord_data.amount = dirty.waiting_drops[i].amount;
                        }
    
                    }
                   
                    
                    console.log("Sending to updateCoordGeneric:");
                    console.log(update_coord_data);

                    await main.updateCoordGeneric(false, update_coord_data);
                    console.log("Should have done it!");
                    delete dirty.waiting_drops[i];

                }
                

            }

        }

        //let hrend = process.hrtime(hrstart);
        //console.info('Time to process waitingDrops (hr): %ds %dms', hrend[0], hrend[1] / 1000000);

    } catch(error) {
        log(chalk.red("Error in world.tickWaitingDrops: " + error));
        console.error(error);
    }


}

exports.tickWaitingDrops = tickWaitingDrops;


// type   |   type_index   |   change
async function updatePlayerRelationship(socket, dirty, player_index, data) {
    try {

        let relationship_linker_index = await main.getPlayerRelationshipLinkerIndex(player_index, data.type, data.type_index);

        if (relationship_linker_index === -1) {
            log(chalk.yellow("Wasn't able to get the player's relationship linker for some reason...."));
            return false;
        }

        // lets update it
        dirty.player_relationship_linkers[relationship_linker_index].score += data.change;
        dirty.player_relationship_linkers[relationship_linker_index].has_change = true;




    } catch (error) {
        log(chalk.red("Error in world.updatePlayerRelationship: " + error));
    }
}

exports.updatePlayerRelationship = updatePlayerRelationship;
