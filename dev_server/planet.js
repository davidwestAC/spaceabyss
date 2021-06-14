//@ts-check
var io_handler = require('./io.js');
var io = io_handler.io;
var database = require('./database.js');
var pool = database.pool;
const chalk = require('chalk');
const log = console.log;

const game_object = require('./game_object.js');
const helper = require('./helper.js');
const main = require('./space_abyss' + process.env.FILE_SUFFIX + '.js');
const player = require('./player.js');



async function getCoordAndRoom(dirty, planet_index) {

    try {

        let room = "";
        let coord_index = -1;
        let scope = "";
        let coord = {};

        if (!dirty.planets[planet_index]) {
            log(chalk.yellow("Could not find the planet. Planet index: " + planet_index));
            return { 'room': room, 'coord_index': coord_index, 'coord': coord, 'scope': scope };
        }


        coord_index = await main.getCoordIndex(
            { 'coord_id': dirty.planets[planet_index].coord_id });
        if (coord_index !== -1) {
            room = "galaxy";
            scope = "galaxy";
            coord = dirty.coords[coord_index];
        }

        return { 'room': room, 'coord_index': coord_index, 'coord': coord, 'scope': scope };
    } catch (error) {
        log(chalk.red("Error in planet.getCoordAndRoom: " + error));
        console.error(error);
    }

}

exports.getCoordAndRoom = getCoordAndRoom;


/**
 * 
 * @param {Object} dirty 
 * @param {Object} data 
 * @param {number} data.planet_id
 * @param {string=} data.source
 */

async function getIndex(dirty, data) {
    try {

        data.planet_id = parseInt(data.planet_id);


        let planet_index = dirty.planets.findIndex(function(obj) { return obj && obj.id === data.planet_id; });

        if(planet_index === -1) {

            let [rows, fields] = await (pool.query("SELECT * FROM planets WHERE id = ?",
                [data.planet_id]));

            if(rows[0]) {

                // make sure we didn't add it in the time it took us to do the mysql query
                planet_index = dirty.planets.findIndex(function(obj) { return obj && obj.id === data.planet_id; });
                if(planet_index === -1) {
                    planet_index = dirty.planets.push(rows[0]) - 1;
                }

            }

        }

        return planet_index;

    } catch(error) {

        if(!data.source) {
            data.source = "";
        }
        log(chalk.red("Error in planet.getIndex: " + error + " source: " + data.source));
        console.error(error);
    }
}

exports.getIndex = getIndex;


// BIG NOTE! Will only re-generate floor for coors in memory. Gotta explore the entire planet level until we change the server to always load in all planet coords
async function regenerateFloor(dirty, planet_id, floor_level) {

    try {

        console.log("In planet.regenerateFloor. Planet id: " + planet_id + " floor_level: " + floor_level);

        let planet_index = await getIndex(dirty, { 'planet_id': planet_id });

        if(planet_index === -1) {
            log(chalk.yellow("Could not get planet"));
            return false;
        }

        for(let i = 0; i < dirty.planet_coords.length; i++) {

            if(dirty.planet_coords[i] && dirty.planet_coords[i].planet_id === planet_id && dirty.planet_coords[i].level === floor_level) {


                let floor_rarity = helper.rarityRoll();
                let coord_floor_type_ids = [];

                // grab the applicable floors
                for (let f = 0; f < dirty.planet_floor_linkers.length; f++) {
                    if (dirty.planet_floor_linkers[f].planet_type_id === dirty.planets[planet_index].planet_type_id &&
                        dirty.planet_floor_linkers[f].rarity <= floor_rarity &&
                        (floor_level <= dirty.planet_floor_linkers[f].highest_planet_level &&
                            floor_level >= dirty.planet_floor_linkers[f].lowest_planet_level)) {

                        coord_floor_type_ids.push(dirty.planet_floor_linkers[f].floor_type_id);

                    }
                }

                let floor_type_id = coord_floor_type_ids[Math.floor(Math.random() * coord_floor_type_ids.length)];
                dirty.planet_coords[i].floor_type_id = floor_type_id;
                dirty.planet_coords[i].has_change = true;

                sendCoordInfo(false, "planet_" + planet_id, dirty, { 'planet_coord_index': i });
            

            }

        }

    } catch(error) {
        log(chalk.red("Error in planet.regenerateFloor: " + error));
        console.error(error);
    }

}

exports.regenerateFloor = regenerateFloor;

/**
 * @param {Object} socket
 * @param {String} room
 * @param {Object} dirty
 * @param {Object} data
 * @param {number=} data.planet_coord_index
 * @param {number=} data.planet_coord_id
 */
async function sendCoordInfo(socket, room, dirty, data) {

    try {
        let coord_index = -1;

        if (data.planet_coord_index) {
            coord_index = data.planet_coord_index;
        } else if (data.planet_coord_id) {
            coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': data.planet_coord_id });
        }

        if (coord_index === -1) {
            return false;
        }

        if (socket) {
            socket.emit('planet_coord_info', { 'planet_coord': dirty.planet_coords[coord_index] });
        }

        if (room) {
            io.to(room).emit('planet_coord_info', { 'planet_coord': dirty.planet_coords[coord_index] });
        }

    } catch (error) {
        log(chalk.red("Error in planet.sendCoordInfo: " + error));
        console.error(error);

    }

}

exports.sendCoordInfo = sendCoordInfo;


// data:    planet_id   |   planet_index
async function sendInfo(socket, room, dirty, data) {

    try {

        if(data.planet_id) {
            let planet_id = parseInt(data.planet_id);

            if(!data.source) {
                data.source = false;
            }

            if(isNaN(planet_id)) {
                log(chalk.red("NaN planet_id sent into sendPlanetInfo. Source: " + data.source));
                console.trace("RRRRR");
                return false;
            }

            data.planet_index = await getIndex(dirty, {'planet_id': planet_id, 'source': 'planet.sendInfo' });

        } else if(data.planet_index) {

        }


        if(typeof data.planet_index === 'undefined' || data.planet_index === -1) {
            log(chalk.red("Could not send planet info"));

            if(data.source) {
                log(chalk.yellow("Source: " + data.source));
            }
            return false;
        }


        if(socket !== false) {
            socket.emit('planet_info', { 'planet': dirty.planets[data.planet_index] });
        }

        if(room !== false) {
            io.to(room).emit('planet_info', { 'planet': dirty.planets[data.planet_index] });
        }


        // we need to send things related to the planet. If there's a player, AI, AI rules
        if(dirty.planets[data.planet_index].player_id) {
            let planet_player_index = await player.getIndex(dirty, { 'player_id': dirty.planets[data.planet_index].player_id });
            if(planet_player_index !== -1){
                await player.sendInfo(socket, room, dirty, planet_player_index);
            }
            
        }

        // see if there is an AI on this planet
        if(dirty.planets[data.planet_index].ai_id) {
            //console.log("Calling sendObjectInfo from planet.sendInfo");
            let ai_index = await game_object.getIndex(dirty, dirty.planets[data.planet_index].ai_id);

            if(ai_index !== -1) {
                await game_object.sendInfo(socket, room, dirty, ai_index);
            }
            // AI is gone for some reason
            else {
                dirty.planets[data.planet_index].ai_id = false;
                dirty.planets[data.planet_index].has_change = true;
            }

        }

    } catch(error) {
        log(chalk.red("Error in planet.sendInfo: " + error));
        console.error(error);
    }



}

exports.sendInfo = sendInfo;