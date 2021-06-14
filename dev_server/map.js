var io_handler = require('./io.js');
var io = io_handler.io;
var database = require('./database.js');
var pool = database.pool;
const chalk = require('chalk');
const log = console.log;


const main = require('./space_abyss' + process.env.FILE_SUFFIX + '.js');
const monster = require('./monster.js');
const planet = require('./planet.js');
const player = require('./player.js');
const world = require('./world.js');
const helper = require('./helper.js');


// Given a coordinate, find out if there is a neighbor coord adjacent
/**
 * @returns {Promise<number>}
 */
async function getCoordNeighbor(dirty, coord_type, coord_index, direction) {

    try {

        let current_coord = {};

        if(coord_type === 'ship') {
            current_coord = dirty.ship_coords[coord_index];
        } else if(coord_type === 'galaxy') {
            current_coord = dirty.coords[coord_index];
        } else if(coord_type === 'planet') {
            current_coord = dirty.planet_coords[coord_index];
        }

        if(helper.isFalse(current_coord)) {
            log(chalk.yellow("Invalid coord sent in. " + coord_type + " index: " + coord_index));
            return false;
        }


        // If we already have a value, we can just send that along!
        if(direction === 'down' && typeof current_coord.down_coord_index !== 'undefined') {
            return current_coord.down_coord_index;
        }

        if(direction === 'up' && typeof current_coord.up_coord_index !== 'undefined') {
            return current_coord.up_coord_index;
        }

        if(direction === 'left' && typeof current_coord.left_coord_index !== 'undefined') {
            return current_coord.left_coord_index;
        }

        if(direction === 'right' && typeof current_coord.right_coord_index !== 'undefined') {
            return current_coord.right_coord_index;
        }

        // We're going to have to find the index
        let adjacent_coord_data = { 'tile_x': current_coord.tile_x, 'tile_y': current_coord.tile_y };

        if(direction === 'down') {
            adjacent_coord_data.tile_y++;
        } else if(direction === 'up') {
            adjacent_coord_data.tile_y--;
        } else if(direction === 'left') {
            adjacent_coord_data.tile_x--;
        } else if(direction === 'right') {
            adjacent_coord_data.tile_x++;
        }


        let adjacent_coord_index = -1;
        if(coord_type === 'ship') {
            adjacent_coord_data.ship_id = current_coord.ship_id;
            adjacent_coord_data.level = current_coord.level;

            adjacent_coord_index = await main.getShipCoordIndex(adjacent_coord_data);
        } else if(coord_type === 'planet') {
            adjacent_coord_data.planet_id = current_coord.planet_id;
            adjacent_coord_data.planet_level = current_coord.level;

            adjacent_coord_index = await main.getPlanetCoordIndex(adjacent_coord_data);
        } else if(coord_type === 'galaxy') {
            adjacent_coord_index = await main.getCoordIndex(adjacent_coord_data);
        }


        if(direction === 'down') {
            current_coord.down_coord_index = adjacent_coord_index;

            if(current_coord.up_coord_index === "undefined") {
                current_coord.up_coord_index = adjacent_coord_index;
            }

            if(adjacent_coord_index !== -1 && coord_type === 'ship' && typeof dirty.ship_coords[adjacent_coord_index].up_coord_index === "undefined") {
                dirty.ship_coords[adjacent_coord_index].up_coord_index = coord_index;
            } else if(adjacent_coord_index !== -1 && coord_type === 'planet' && typeof dirty.planet_coords[adjacent_coord_index].up_coord_index === "undefined") {
                dirty.planet_coords[adjacent_coord_index].up_coord_index = coord_index;
            } else if(adjacent_coord_index !== -1 && coord_type === 'galaxy' && typeof dirty.coords[adjacent_coord_index].up_coord_index === "undefined") {
                dirty.coords[adjacent_coord_index].up_coord_index = coord_index;
            }
        } else if(direction === 'up') {
            current_coord.up_coord_index = adjacent_coord_index;

            if(adjacent_coord_index !== -1 && coord_type === 'ship' && typeof dirty.ship_coords[adjacent_coord_index].down_coord_index === "undefined") {
                dirty.ship_coords[adjacent_coord_index].down_coord_index = coord_index;
            } else if(adjacent_coord_index !== -1 && coord_type === 'planet' && typeof dirty.planet_coords[adjacent_coord_index].down_coord_index === "undefined") {
                dirty.planet_coords[adjacent_coord_index].down_coord_index = coord_index;
            } else if(adjacent_coord_index !== -1 && coord_type === 'galaxy' && typeof dirty.coords[adjacent_coord_index].down_coord_index === "undefined") {
                dirty.coords[adjacent_coord_index].down_coord_index = coord_index;
            }
        } else if(direction === 'left') {
            current_coord.left_coord_index = adjacent_coord_index;

            if(adjacent_coord_index !== -1 && coord_type === 'ship' && typeof dirty.ship_coords[adjacent_coord_index].right_coord_index === "undefined") {
                dirty.ship_coords[adjacent_coord_index].right_coord_index = coord_index;
            } else if(adjacent_coord_index !== -1 && coord_type === 'planet' && typeof dirty.planet_coords[adjacent_coord_index].right_coord_index === "undefined") {
                dirty.planet_coords[adjacent_coord_index].right_coord_index = coord_index;
            } else if(adjacent_coord_index !== -1 && coord_type === 'galaxy' && typeof dirty.coords[adjacent_coord_index].right_coord_index === "undefined") {
                dirty.coords[adjacent_coord_index].right_coord_index = coord_index;
            }
        } else if(direction === 'right') {
            current_coord.right_coord_index = adjacent_coord_index;

            if(adjacent_coord_index !== -1 && coord_type === 'ship' && typeof dirty.ship_coords[adjacent_coord_index].left_coord_index === "undefined") {
                dirty.ship_coords[adjacent_coord_index].left_coord_index = coord_index;
            } else if(adjacent_coord_index !== -1 && coord_type === 'planet' && typeof dirty.planet_coords[adjacent_coord_index].left_coord_index === "undefined") {
                dirty.planet_coords[adjacent_coord_index].left_coord_index = coord_index;
            } else if(adjacent_coord_index !== -1 && coord_type === 'galaxy' && typeof dirty.coords[adjacent_coord_index].left_coord_index === "undefined") {
                dirty.coords[adjacent_coord_index].left_coord_index = coord_index;
            }
        }

        return adjacent_coord_index;


        /* Pretty sure the new code works and is much nicer... but saving just incase.
        if(coord_type === 'ship') {


            if(direction === 'down') {

                if(typeof dirty.ship_coords[coord_index].down_coord_index !== 'undefined') {
                    return dirty.ship_coords[coord_index].down_coord_index;
                }
                
                let checking_y = dirty.ship_coords[coord_index].tile_y + 1;
                let ship_coord_data = {  'ship_id': dirty.ship_coords[coord_index].ship_id,
                'level': dirty.ship_coords[coord_index].level, 'tile_x': dirty.ship_coords[coord_index].tile_x, 'tile_y': checking_y };
                let down_coord_index = await main.getShipCoordIndex(ship_coord_data);

                dirty.ship_coords[coord_index].down_coord_index = down_coord_index;

                // If our down coord doesn't have its up_coord_index set, we can set that right now!
                if(down_coord_index !== -1 && typeof dirty.ship_coords[down_coord_index].up_coord_index === 'undefined') {
                    dirty.ship_coords[down_coord_index].up_coord_index = coord_index;
                }

                return down_coord_index;
            } else if(direction === 'left') {

                if(typeof dirty.ship_coords[coord_index].left_coord_index !== 'undefined') {
                    return dirty.ship_coords[coord_index].left_coord_index;
                }

                let checking_x = dirty.ship_coords[coord_index].tile_x - 1;
                let ship_coord_data = {  'ship_id': dirty.ship_coords[coord_index].ship_id,
                'level': dirty.ship_coords[coord_index].level, 'tile_x': checking_x, 'tile_y': dirty.ship_coords[coord_index].tile_y };
                let left_coord_index = await main.getShipCoordIndex(ship_coord_data);

                dirty.ship_coords[coord_index].left_coord_index = left_coord_index;

                // If our left coord doesn't have its right_coord_index set, we can set that right now!
                if(left_coord_index !== -1 && typeof dirty.ship_coords[left_coord_index].right_coord_index === 'undefined') {
                    dirty.ship_coords[left_coord_index].right_coord_index = coord_index;
                }

                return left_coord_index;
            } else if(direction === 'right') {

                if(typeof dirty.ship_coords[coord_index].right_coord_index !== 'undefined') {
                    return dirty.ship_coords[coord_index].right_coord_index;
                }

                let checking_x = dirty.ship_coords[coord_index].tile_x + 1;
                let ship_coord_data = {  'ship_id': dirty.ship_coords[coord_index].ship_id,
                'level': dirty.ship_coords[coord_index].level, 'tile_x': checking_x, 'tile_y': dirty.ship_coords[coord_index].tile_y };
                let right_coord_index = await main.getShipCoordIndex(ship_coord_data);

                dirty.ship_coords[coord_index].right_coord_index = right_coord_index;

                // If our right coord doesn't have its left_coord_index set, we can set that right now!
                if(right_coord_index !== -1 && typeof dirty.ship_coords[right_coord_index].left_coord_index === 'undefined') {
                    dirty.ship_coords[right_coord_index].left_coord_index = coord_index;
                }

                return right_coord_index;
            } else if(direction === 'up') {

                if(typeof dirty.ship_coords[coord_index].up_coord_index !== 'undefined') {
                    return dirty.ship_coords[coord_index].up_coord_index;
                }

                let checking_y = dirty.ship_coords[coord_index].tile_y - 1;
                let ship_coord_data = {  'ship_id': dirty.ship_coords[coord_index].ship_id,
                'level': dirty.ship_coords[coord_index].level, 'tile_x': dirty.ship_coords[coord_index].tile_x, 'tile_y': checking_y };
                let up_coord_index = await main.getShipCoordIndex(ship_coord_data);

                dirty.ship_coords[coord_index].up_coord_index = up_coord_index;

                // If our up coord doesn't have its down_coord_index set, we can set that right now!
                if(up_coord_index !== -1 && typeof dirty.ship_coords[up_coord_index].down_coord_index === 'undefined') {
                    dirty.ship_coords[up_coord_index].down_coord_index = coord_index;
                }


                return up_coord_index;
            }
            
        }
        */


    } catch(error) {
        log(chalk.red("Error in map.getCoordNeighbor: " + error));
        console.error(error);        
    }

}

exports.getCoordNeighbor = getCoordNeighbor;


async function sendColumn(socket, dirty, coord_type, direction, origin_tile_y, starting_coord_index, sending_column, block_direction = 'none') {
    try {

        //console.log("In sendColumn - Going to try and send column: " + sending_column + " coord type: " + coord_type + " starting_coord_index: " + starting_coord_index);
        // For our first implementation attempt - we're just doing down

        let current_coord = {};

        if(coord_type === 'ship') {
            current_coord = dirty.ship_coords[starting_coord_index];
        } else if(coord_type == 'planet') {
            current_coord = dirty.planet_coords[starting_coord_index];
        } else if(coord_type === 'galaxy') {
            current_coord = dirty.coords[starting_coord_index];
        }

        if(helper.isFalse(current_coord)) {
            log(chalk.yellow("coord is false in sendColumn"));
            return false;
        }

        // Out of bounds coord - not going to process it
        if(current_coord.tile_y > origin_tile_y + Math.floor(global.show_rows / 2) || current_coord.tile_y < origin_tile_y - Math.floor(global.show_rows / 2)) {
            //console.log("Out of bounds now - returning");
            return false;
        }


        // If we aren't at the column we are sending, we are going to be trying to move left/right. So make sure we have those.
        if(current_coord.tile_x !== sending_column) {
            if(direction === 'left' && typeof current_coord.left_coord_index === 'undefined') {

                //console.log("Still need to navigate left from " + current_coord.tile_x + "," + current_coord.tile_y);
                current_coord.left_coord_index = await getCoordNeighbor(dirty, coord_type, starting_coord_index, 'left');
                
            } else if(direction === 'right' && typeof current_coord.right_coord_index === 'undefined') {

                //console.log("Still need to navigate right from " + current_coord.tile_x + "," + current_coord.tile_y);
                current_coord.right_coord_index = await getCoordNeighbor(dirty, coord_type, starting_coord_index, 'right');
                
            }
        }
      


        // Actions to take if we are on the column we want to send
        if(current_coord.tile_x === sending_column) {
            //console.log("Found a coord on that column! Sending.")
            if(coord_type === 'ship') {
                socket.emit('ship_coord_info', { 'ship_coord': dirty.ship_coords[starting_coord_index] });
            } else if(coord_type === 'planet') {
                socket.emit('planet_coord_info', { 'planet_coord': dirty.planet_coords[starting_coord_index] });
            } else if(corod_type === 'galaxy') {
                socket.emit('coord_info', { 'coord': dirty.coords[starting_coord_index] });
            }
            

            if(current_coord.monster_id) {
                world.checkMonsterBattleConditions(dirty, current_coord.monster_id, 'player', dirty.players[socket.player_index].id, socket);
            }

            if(current_coord.object_id) {
                world.checkObjectBattleConditions(socket, dirty, current_coord.object_id, 'player', dirty.players[socket.player_index].id);
            }

             // up
             if(block_direction !== 'up') {
                current_coord.up_coord_index = await getCoordNeighbor(dirty, coord_type, starting_coord_index, 'up');

                if(current_coord.up_coord_index !== -1) {
                    await sendColumn(socket, dirty, coord_type, direction, origin_tile_y, current_coord.up_coord_index, sending_column, "down");
                }
             }
             
 
             // down
             if(block_direction !== 'down') {
                current_coord.down_coord_index = await getCoordNeighbor(dirty, coord_type, starting_coord_index, 'down');
 
                if(current_coord.down_coord_index !== -1) {
                    await sendColumn(socket, dirty, coord_type, direction, origin_tile_y, current_coord.down_coord_index, sending_column, "up");
                }
             }
             

        }

        // Actions to take if we aren't on the column we want to send
        if(current_coord.tile_x !== sending_column) {


            // Nothing left/right of us (depending on direction) so send up/down
            if( (direction === 'left' && current_coord.left_coord_index === -1) || (direction === 'right' && current_coord.right_coord_index === -1) ) {

    
                // up
                if(block_direction !== 'up') {
                    current_coord.up_coord_index = await getCoordNeighbor(dirty, coord_type, starting_coord_index, 'up');
    
                    if(current_coord.up_coord_index !== -1) {

                        //console.log("No coord " + direction + " " + current_coord.tile_x + "," + current_coord.tile_y + " - moving up");

                        await sendColumn(socket, dirty, coord_type, direction, origin_tile_y, current_coord.up_coord_index, sending_column, "down");
                    }
                }
                
    
                // down
                if(block_direction !== 'down') {
                    current_coord.down_coord_index = await getCoordNeighbor(dirty, coord_type, starting_coord_index, 'down');
    
                    if(current_coord.down_coord_index !== -1) {

                        //console.log("No coord " + direction + " " + current_coord.tile_x + "," + current_coord.tile_y + " - moving down");
                        await sendColumn(socket, dirty, coord_type, direction, origin_tile_y, current_coord.down_coord_index, sending_column, "up");
                    }
                }
                
    
    
            } 
            // A coord left/right - lets just move!
            else if(direction === 'left' && current_coord.left_coord_index !== -1) {
                //console.log("Moving left from tile_x,y: " + current_coord.tile_x + "," + current_coord.tile_y);
                await sendColumn(socket, dirty, coord_type, direction, origin_tile_y, current_coord.left_coord_index, sending_column);
            } else if(direction === 'right' && current_coord.right_coord_index !== -1) {
                //console.log("Moving right from tile_x,y: " + current_coord.tile_x + "," + current_coord.tile_y);
                await sendColumn(socket, dirty, coord_type, direction, origin_tile_y, current_coord.right_coord_index, sending_column);
            }
    
        }
        

    } catch(error) {
        log(chalk.red("Error in map.sendColumn: " + error));
        console.error(error);
    }

}

exports.sendColumn = sendColumn;

async function sendRow(socket, dirty, coord_type, direction, origin_tile_x, starting_coord_index, sending_row, block_direction = 'none') {
    try {

        //console.log("In sendRow - Going to try and send row: " + sending_row + " coord type: " + coord_type + " starting_coord_index: " + starting_coord_index);
        // For our first implementation attempt - we're just doing down

        let current_coord = {};

        if(coord_type === 'ship') {
            current_coord = dirty.ship_coords[starting_coord_index];
        } else if(coord_type == 'planet') {
            current_coord = dirty.planet_coords[starting_coord_index];
        } else if(coord_type === 'galaxy') {
            current_coord = dirty.coords[starting_coord_index];
        } else if(coord_type === 'virtual') {
            current_coord = dirty.virtual_coords[starting_coord_index];
        }

        if(helper.isFalse(current_coord)) {
            log(chalk.yellow("coord is false in sendRow"));
            return false;
        }

        // Out of bounds coord - not going to process it
        if(current_coord.tile_x > origin_tile_x + Math.floor(global.show_cols / 2) || current_coord.tile_x < origin_tile_x - Math.floor(global.show_cols / 2)) {
            //console.log("Out of bounds now - returning");
            return false;
        }


        // If we aren't at the row we are sending, we are going to be trying to move up/down. So make sure we have those.
        if(current_coord.tile_y !== sending_row) {
            if(direction === 'down' && typeof current_coord.down_coord_index === 'undefined') {

                //console.log("Still need to navigate down from " + current_coord.tile_x + "," + current_coord.tile_y);
                current_coord.down_coord_index = await getCoordNeighbor(dirty, coord_type, starting_coord_index, 'down');
                
            } else if(direction === 'up' && typeof current_coord.up_coord_index === 'undefined') {

                //console.log("Still need to navigate up from " + current_coord.tile_x + "," + current_coord.tile_y);
                current_coord.up_coord_index = await getCoordNeighbor(dirty, coord_type, starting_coord_index, 'up');
                
            }
        }
      


        // Actions to take if we are on the row we want to send
        if(current_coord.tile_y === sending_row) {
            //console.log("Found a coord on that row! Sending.")
            if(coord_type === 'ship') {
                socket.emit('ship_coord_info', { 'ship_coord': dirty.ship_coords[starting_coord_index] });
            } else if(coord_type === 'planet') {
                socket.emit('planet_coord_info', { 'planet_coord': dirty.planet_coords[starting_coord_index] });
            } else if(corod_type === 'galaxy') {
                socket.emit('coord_info', { 'coord': dirty.coords[starting_coord_index] });
            } else if(coord_type === 'virtual') {
                socket.emit('virtual_coord_info', { 'virtual_coord': dirty.virtual_coords[starting_coord_index] });
            }
            

            if(current_coord.monster_id) {
                world.checkMonsterBattleConditions(dirty, current_coord.monster_id, 'player', dirty.players[socket.player_index].id, socket);
            }

            if(current_coord.object_id) {
                world.checkObjectBattleConditions(socket, dirty, current_coord.object_id, 'player', dirty.players[socket.player_index].id);
            }

             // left
             if(block_direction !== 'left') {
                current_coord.left_coord_index = await getCoordNeighbor(dirty, coord_type, starting_coord_index, 'left');

                if(current_coord.left_coord_index !== -1) {
                    await sendRow(socket, dirty, coord_type, direction, origin_tile_x, current_coord.left_coord_index, sending_row, "right");
                }
             }
             
 
             // right
             if(block_direction !== 'right') {
                current_coord.right_coord_index = await getCoordNeighbor(dirty, coord_type, starting_coord_index, 'right');
 
                if(current_coord.right_coord_index !== -1) {
                    await sendRow(socket, dirty, coord_type, direction, origin_tile_x, current_coord.right_coord_index, sending_row, "left");
                }
             }
             

        }

        // Actions to take if we aren't on the row we want to send
        if(current_coord.tile_y !== sending_row) {


            // Nothing below/above us (depending on direction) so send left/right
            if( (direction === 'down' && current_coord.down_coord_index === -1) || (direction === 'up' && current_coord.up_coord_index === -1) ) {

    
                // left
                if(block_direction !== 'left') {
                    current_coord.left_coord_index = await getCoordNeighbor(dirty, coord_type, starting_coord_index, 'left');
    
                    if(current_coord.left_coord_index !== -1) {

                        //console.log("No coord " + direction + " " + current_coord.tile_x + "," + current_coord.tile_y + " - moving left");

                        await sendRow(socket, dirty, coord_type, direction, origin_tile_x, current_coord.left_coord_index, sending_row, "right");
                    }
                }
                
    
                // right
                if(block_direction !== 'right') {
                    current_coord.right_coord_index = await getCoordNeighbor(dirty, coord_type, starting_coord_index, 'right');
    
                    if(current_coord.right_coord_index !== -1) {

                        //console.log("No coord " + direction + " " + current_coord.tile_x + "," + current_coord.tile_y + " - moving right");
                        await sendRow(socket, dirty, coord_type, direction, origin_tile_x, current_coord.right_coord_index, sending_row, "left");
                    }
                }
                
    
    
            } 
            // A coord below - lets just move down!
            else if(direction === 'down' && current_coord.down_coord_index !== -1) {
                //console.log("Moving down from tile_x,y: " + current_coord.tile_x + "," + current_coord.tile_y);
                await sendRow(socket, dirty, coord_type, direction, origin_tile_x, current_coord.down_coord_index, sending_row);
            } else if(direction === 'up' && current_coord.up_coord_index !== -1) {
                //console.log("Moving up from tile_x,y: " + current_coord.tile_x + "," + current_coord.tile_y);
                await sendRow(socket, dirty, coord_type, direction, origin_tile_x, current_coord.up_coord_index, sending_row);
            }
    
        }
        

    } catch(error) {
        log(chalk.red("Error in map.sendRow: " + error));
        console.error(error);
    }

}

exports.sendRow = sendRow;

async function updateMap(socket, dirty) {
    try {

        if(!socket.logged_in) {
            return false;
        }

        let player_index = await player.getIndex(dirty, {'player_id': socket.player_id });


        if(dirty.players[player_index].virtual_coord_id) {
            await updateMapVirtual(socket, dirty);
        } else if(dirty.players[player_index].planet_coord_id) {
            //console.log("socket player planet_id: " + socket.player_player_id);
            await updateMapPlanet(socket, dirty);
        } else if(dirty.players[player_index].ship_coord_id) {
            await updateMapShip(socket, dirty);
        } else if(dirty.players[player_index].coord_id) {
            await updateMapGalaxy(socket, dirty);
        } else {
            console.log("Not sure where the player is. Not sure what map to send");
        }

    } catch(error){
        console.error("map.updateMap failed: " + error);
        console.error(error);
    }
}

exports.updateMap = updateMap;

// TODO switch to a similar style to updateMapShip. I think we can store the galaxy size globally, so we never have to lookup
// TODO coords that aren't in the galaxy space.
async function updateMapGalaxy(socket, dirty) {
    try {
        //console.time("updateMapGalaxy");
        //console.log("In updateMapGalaxy");

        //console.log("In updateMapPlanet");
        let player_index = await player.getIndex(dirty, { 'player_id': socket.player_id });

        if(player_index === -1) {
            log(chalk.yellow("Unable to find socket player in map.updateMapPlanet"));
            return;
        }

        let coord_index = await main.getCoordIndex({ 'coord_id': dirty.players[player_index].coord_id });

        if(coord_index === -1) {
            log(chalk.yellow("Could not find player's galaxy coord to update the map"));
            return false;
        }

        let starting_x = dirty.coords[coord_index].tile_x - Math.floor(global.show_cols / 2);
        let starting_y = dirty.coords[coord_index].tile_y - Math.floor(global.show_rows / 2);
        let ending_x = starting_x + global.show_cols + 1;
        let ending_y = starting_y + global.show_rows + 1;

        if(starting_x < 0) { starting_x = 0; }

        if(starting_y < 0) { starting_y = 0; }



        for(let i = starting_x; i < ending_x; i++) {
            for (let j = starting_y; j < ending_y; j++) {

                let other_coord_index = await main.getCoordIndex({ 'tile_x': i, 'tile_y': j});

                if(other_coord_index !== -1) {


                    socket.emit('coord_info', { 'coord': dirty.coords[other_coord_index] });

                    if(dirty.coords[other_coord_index].planet_id && dirty.coords[other_coord_index].planet_id !== 0) {
                        //console.log("Coord has a planet id: " + dirty.coords[other_coord_index].planet_id);
                        await planet.sendInfo(socket, false, dirty,
                            { 'planet_id': dirty.coords[other_coord_index].planet_id, 'source': 'map.updateMapGalaxy' });
                    }

                    if(dirty.coords[other_coord_index].monster_id) {
                        await monster.sendInfo(socket, false, dirty, { 'monster_id': dirty.coords[other_coord_index].monster_id });
                        // Not sure we currently have a scenario that would use this
                        //await world.checkMonsterBattleConditions(dirty, dirty.planet_coords[sending_coord_index].monster_id, 'player', socket.player_id, socket);
                    }


                }
            }
        }

        //console.timeEnd("updateMapGalaxy");

    } catch(error) {
        log(chalk.red("Error in map.updateMapGalaxy: " + error));
        console.error(error);
    }


}


async function updateMapPlanet(socket, dirty) {
    try {


        if(typeof socket.player_index === "undefined") {
            log(chalk.yellow("No player index yet"));
            return false;
        }

        let player_index = socket.player_index;

        let coord_index = -1;
        
        coord_index = await main.getPlanetCoordIndex({ 'planet_coord_id': dirty.players[player_index].planet_coord_id });

        if(coord_index === -1) {
            log(chalk.yellow("Could not find player's planet coord to update the map"));
            return false;
        }


        let planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.planet_coords[coord_index].planet_id });

        let starting_x = dirty.planet_coords[coord_index].tile_x - Math.floor(global.show_cols / 2);
        let starting_y = dirty.planet_coords[coord_index].tile_y - Math.floor(global.show_rows / 2);
        let ending_x = starting_x + global.show_cols + 1;
        let ending_y = starting_y + global.show_rows + 1;

        // No point in querying planet coords less than 0 since they don't exist
        
        if(dirty.planet_coords[coord_index].level >= 0) {
            if(starting_x < 0) { starting_x = 0; }
            if(starting_y < 0) { starting_y = 0; }

            if(ending_x >= dirty.planets[planet_index].x_size_above) {
                ending_x = dirty.planets[planet_index].x_size_above - 1;
            }

            if(ending_y > dirty.planets[planet_index].y_size_above) {
                ending_y = dirty.planets[planet_index].y_size_above - 1;
            }
        } else {

            let underground_x_offset = 0;
            let underground_y_offset = 0;
            if (dirty.planets[planet_index].x_size_above > dirty.planets[planet_index].x_size_under) {
                underground_x_offset = (dirty.planets[planet_index].x_size_above - dirty.planets[planet_index].y_size_under) / 2;

            }

            if (dirty.planets[planet_index].y_size_above > dirty.planets[planet_index].y_size_under) {
                underground_y_offset = (dirty.planets[planet_index].y_size_above - dirty.planets[planet_index].y_size_under) / 2;
            }

            if(starting_x < underground_x_offset) {
                starting_x = underground_x_offset;
            }

            if(starting_y < underground_y_offset) {
                starting_y = underground_y_offset;
            }

            if(ending_x >= dirty.planets[planet_index].x_size_under + underground_x_offset) {
                ending_x = dirty.planets[planet_index].x_size_under + underground_x_offset - 1;
            }

            if(ending_y >= dirty.planets[planet_index].y_size_under + underground_y_offset) {
                ending_y = dirty.planets[planet_index].y_size_under + underground_y_offset - 1;
            }

        }



        


        let found_coords = [];

        // Initial testing is that this is like 10x faster than grabbing each coord we need
        for(let i = 0; i < dirty.planet_coords.length; i++) {
            if(dirty.planet_coords[i] && dirty.planet_coords[i].planet_id === dirty.planet_coords[coord_index].planet_id &&
                dirty.planet_coords[i].level === dirty.planet_coords[coord_index].level &&
                dirty.planet_coords[i].tile_x <= ending_x && dirty.planet_coords[i].tile_x >= starting_x &&
                dirty.planet_coords[i].tile_y <= ending_y && dirty.planet_coords[i].tile_y >= starting_y) {

                found_coords.push({ 'tile_x': dirty.planet_coords[i].tile_x, 'tile_y': dirty.planet_coords[i].tile_y, 'planet_coord_index': i });

            }
        }

        // quick iterate through our map, and run getPlanetCoordIndex on the ones we didn't find

        for(let i = starting_x; i <= ending_x; i++) {
            for (let j = starting_y; j <= ending_y; j++) {

                let in_found_coords = false;
                let sending_coord_index = -1;

                for(let p = 0; p < found_coords.length && in_found_coords === false; p++) {
                    if(found_coords[p].tile_x === i && found_coords[p].tile_y === j) {
                        in_found_coords = true;
                        sending_coord_index = found_coords[p].planet_coord_index;
                    }
                }

                // We will already have all planet coords > level 0 in memory guarenteed
                if(!in_found_coords && dirty.planet_coords[coord_index].level <= 0) {


                    //console.log("Did not find coord tile_x,y: " + i + "," + j + " in found coords");
                    let planet_coord_data = { 'planet_id': dirty.planet_coords[coord_index].planet_id,
                        'planet_level': dirty.planet_coords[coord_index].level, 'tile_x': i, 'tile_y': j };
                    sending_coord_index = await main.getPlanetCoordIndex(planet_coord_data);
                }

                if(sending_coord_index !== -1) {
                    socket.emit('planet_coord_info', { 'planet_coord': dirty.planet_coords[sending_coord_index] });


                    if(dirty.planet_coords[sending_coord_index].monster_id) {
                        await monster.sendInfo(socket, false, dirty, { 'monster_id': dirty.planet_coords[sending_coord_index].monster_id });
                        await world.checkMonsterBattleConditions(dirty, dirty.planet_coords[sending_coord_index].monster_id, 'player', socket.player_id, socket);
                    }

                    if(dirty.planet_coords[sending_coord_index].object_id) {
                        await world.checkObjectBattleConditions(socket, dirty, dirty.planet_coords[sending_coord_index].object_id, 'player', socket.player_id);
                    }

                    if(dirty.planet_coords[sending_coord_index].player_id) {
                        let coord_player_index = await player.getIndex(dirty, { 'player_id': dirty.planet_coords[sending_coord_index].player_id });
                        if(coord_player_index !== -1) {
                            await player.sendInfo(socket, false, dirty, dirty.planet_coords[sending_coord_index].player_id);
                        }
                        
                    }
                }

            }
        }

        //console.timeEnd("updateMapPlanet");

    } catch(error) {
        log(chalk.red("Error in map.updateMapPlanet:" + error));
        console.error(error);
    }


    
}

async function updateMapShip(socket, dirty) {
    //console.log("Sending ship_data from updateMapShip");
    //console.time("updateMapShip");

    let player_index = await player.getIndex(dirty, { 'player_id': socket.player_id });

    if(player_index === -1) {
        log(chalk.yellow("Unable to find socket player in map.updateMapPlanet"));
        return;
    }

    let player_ship_coord_index = await main.getShipCoordIndex({'ship_coord_id': dirty.players[player_index].ship_coord_id });

    if(player_ship_coord_index === -1) {
        log(chalk.yellow("Could not find player's ship coord to update the map"));
        return false;
    }



    
    let starting_x = dirty.ship_coords[player_ship_coord_index].tile_x - Math.floor(global.show_cols / 2);
    let starting_y = dirty.ship_coords[player_ship_coord_index].tile_y - Math.floor(global.show_rows / 2);
    let ending_x = starting_x + global.show_cols + 1;
    let ending_y = starting_y + global.show_rows + 1;

    if(starting_x < 0) { starting_x = 0; }

    if(starting_y < 0) { starting_y = 0; }

    


    // FOR NOW THIS IS SLOWER. 10MS - but it will scale. I think inefficiencies in object lookups might 
    // be hurting it. 
    // TODO MAYBE: we could get fancy and send our row first

    // Just call sendRow for each bit of the map!
    /*
    for(let i = starting_y; i <= ending_y; i++) {

        let direction = 'up';
        if(i > dirty.ship_coords[player_ship_coord_index].tile_y) {
            direction = 'down';
        }

        await sendRow(socket, dirty, 'ship', direction, dirty.ship_coords[player_ship_coord_index].tile_x, 
            player_ship_coord_index, i);
    }
    */

    


    // I think the only feasible way to do this is to always just make sure
    // active ship coords are loaded - we are almost never going to have full screens

    

    for(let i = 0; i < dirty.ship_coords.length; i++) {
        if(dirty.ship_coords[i] && dirty.ship_coords[i].ship_id === dirty.ship_coords[player_ship_coord_index].ship_id &&
            dirty.ship_coords[i].level === dirty.ship_coords[player_ship_coord_index].level &&
            dirty.ship_coords[i].tile_x <= ending_x && dirty.ship_coords[i].tile_x >= starting_x &&
            dirty.ship_coords[i].tile_y <= ending_y && dirty.ship_coords[i].tile_y >= starting_y ) {

            //console.log("Sending ship coord id: " + dirty.ship_coords[i]);
            socket.emit('ship_coord_info', { 'ship_coord': dirty.ship_coords[i] });

            
            if(dirty.ship_coords[i].monster_id) {
                await monster.sendInfo(socket, false, dirty, { 'monster_id': dirty.ship_coords[i].monster_id });
                await world.checkMonsterBattleConditions(dirty, dirty.ship_coords[i].monster_id, 'player', socket.player_id, socket);
            }

            if(dirty.ship_coords[i].object_id) {
                await world.checkObjectBattleConditions(socket, dirty, dirty.ship_coords[i].object_id, 'player', socket.player_id);
            }

            if(dirty.ship_coords[i].player_id) {
                let ship_coord_player_index = await player.getIndex(dirty, { 'player_id': dirty.ship_coords[i].player_id });
                if(ship_coord_player_index !== -1) {
                    await player.sendInfo(socket, false, dirty, ship_coord_player_index);
                }
                
            }
        }
    }

}


// So we effectively have a few different ways of going through and getting all the coords for the map
// 1. We can iterate through a multidimensional array, grabbing each one
// 2. We can store the x and y's that we want, and iterate through the coords a single time, sending along the matching ones
// 3. We can use a neighbor system
//      3a. Currently 
async function updateMapVirtual(socket, dirty) {

    try {
        console.time("updateMapVirtual");

        let virtual_start = 0;
        let virtual_end = 9;

        if(typeof socket.player_index === "undefined") {
            log(chalk.yellow("No player index yet"));
            return false;
        }

        let coord_index = -1;
        if(typeof dirty.players[socket.player_index].virtual_coord_index !== "undefined" && dirty.players[socket.player_index] !== -1) {
            coord_index = dirty.players[socket.player_index].virtual_coord_index;
        }

        let starting_y = dirty.virtual_coords[coord_index].tile_y - Math.floor(global.show_rows / 2);
        let ending_y = starting_y + global.show_rows + 1;

        if(starting_y < virtual_start) {
            starting_y = virtual_start;
        }

        if(ending_y > virtual_end) {
            ending_y = virtual_end;
        }

        for(let y = starting_y; y <= ending_y; y++) {
            let direction = 'up';

            if(y > dirty.virtual_coords[coord_index].tile_y) {
                direction = 'down';
            }
            await sendRow(socket, dirty, 'virtual', direction, dirty.virtual_coords[coord_index].tile_x, coord_index, y);
        }

        

        console.timeEnd("updateMapVirtual");

    } catch(error) {
        log(chalk.red("Error in map.updateMapVirtual: " + error));
        console.error(error);
    }

}
