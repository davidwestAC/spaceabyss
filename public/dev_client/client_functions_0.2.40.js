
// data:    x   |   y   |   damage_amount   |   was_damaged_type   |   damage_source_type  |   damage_types
/**
 * @param {number} x
 * @param {number} y
 * @param {Object} data
 * @param {number=} data.damage_amount
 * @param {string=} data.was_damaged_type
 * @param {string=} data.damage_source_type
 * @param {string[]=} data.damage_types
 * @param {string=} data.fill_color - The color of the text
 * @param {string=} data.text - Specific text to add
 *
*/
function addInfoNumber(x, y, data) {
    let scene_game = game.scene.getScene('sceneGame');

    if (typeof data.damage_amount === "undefined") {
        data.damage_amount = 0;
    }
    if (typeof data.was_damaged_type === "undefined") {
        data.was_damaged_type = false;
    }
    if (typeof data.damage_source_type === "undefined") {
        data.damage_source_type = false;
    }
    if (typeof data.damage_types === "undefined") {
        data.damage_types = [];
    }


    let info_number_index = info_numbers.push({ 'amount': data.damage_amount, 'was_damaged_type': data.was_damaged_type, 'pixels_moved': 0 }) - 1;

    let fill = '#6982f4';

    if (data.fill_color) {
        fill = data.fill_color;
    } else {
        // For things like healing and repairing, they should be the only entry in the damage_types array
        if (data.damage_types && (data.damage_types[0] === "repairing" || data.damage_types[0] === 'mining')) {
            fill = '#6982f4';
        } else if (data.damage_types && data.damage_types[0] === 'healing') {
            fill = '#34f425';
        } else if (data.was_damaged_type === "hp") {
            fill = '#f44242';
        } else if (data.damage_amount <= 0) {
            fill = '#969696';
        }
    }




    // lets randomize the starting x/y a bit
    let starting_x = getRandomIntInclusive(-32, 32);
    let starting_y = getRandomIntInclusive(0, 32);

    let game_width = 64 * show_cols;
    // Our max width game width - our start
    let text_width = game_width - starting_x;

    let the_text = "";
    if (data.text) {
        the_text = data.text;
    } else {
        the_text = data.damage_amount
    }

    info_numbers[info_number_index].text = scene_game.add.text(x + starting_x, y - starting_y,
        the_text, {
        fontSize: 20,
        padding: { x: 10, y: 5 },
        fill: fill,
        wordWrap: { width: text_width },
        stroke: "#000000",
        strokeThickness: 1

    });

    info_numbers[info_number_index].text.setFontStyle('bold');
    info_numbers[info_number_index].text.setDepth(11);
}


// Basically just calls addInfoNumber. I could deprecate this entirely if I wanted to
function addLagText() {
    addInfoNumber(players[client_player_index].sprite.x, players[client_player_index].sprite.y,
        { 'fill_color': "#f44242", 'text': "Lag." });
    /*
    let scene_game = game.scene.getScene('sceneGame');
    // Let see if adding some text helps players
    base_x = players[client_player_index].sprite.x;
    base_y = players[client_player_index].sprite.y;
    let rand_x = getRandomIntInclusive(-32, 32);
    let rand_y = getRandomIntInclusive(0, 32);
    result_text = 'Lag.';
    fill = '#f44242';
    let info_number_index = info_numbers.push({ 'amount': 0, 'was_damaged_type': false, 'pixels_moved': 0}) - 1;

    // We're going to need to wrap this text if it's gonna go off the edge
    let game_width = 64 * show_cols;
    // Our max width game width - our start
    let text_width = game_width - rand_x;

    info_numbers[info_number_index].text = scene_game.add.text(base_x + rand_x, base_y - rand_y,
        result_text, { fontSize: 16,
            padding: { x: 10, y: 5},
            fill: fill,
            wordWrap: { width: text_width }

        });
    info_numbers[info_number_index].text.setFontStyle('bold');
    // Layer above is depth 10
    info_numbers[info_number_index].text.setDepth(11);
    */
}


function addPlayer(player_index, player_info) {

    //console.log("In addPlayer");
    //console.log(player_info);



    // If the player we just added is us, always show us :D
    if (client_player_id && players[player_index].id === client_player_id) {

        client_player_index = player_index;
        if (!players[client_player_index].sprite) {
            createPlayerSprite(client_player_index);

            client_player_info = getPlayerInfo(client_player_index);

            if (client_player_info.coord && players[client_player_index].sprite) {

                players[client_player_index].sprite.x = client_player_info.coord.tile_x & tile_size;
                players[client_player_index].sprite.y = client_player_info.coord.tile_y & tile_size;

                camera.startFollow(players[client_player_index].sprite);
            }

        }



    } else if (player_info.coord === false || client_player_info.coord === false) {

        // Not going to have enough info to addPlayer

    } else if (shouldDraw(client_player_info.coord, player_info.coord)) {
        console.log("Should draw returned true");

        if (!players[player_index].sprite) {

            createPlayerSprite(player_index);
        }
        movePlayerInstant(player_index, player_info.coord.tile_x * tile_size + tile_size / 2, player_info.coord.tile_y * tile_size + tile_size / 2);



    } else {
        console.log("Not drawing this player");
    }

    redrawBars();

    // It's also possible that once we got a player, we now know that an object is a current ship of that player.
    // If that player has a coord id, we should not draw it
    if (players[player_index].coord_id) {
        let ship_index = objects.findIndex(function (obj) { return obj && obj.id === players[player_index].ship_id });
        if (ship_index !== -1) {
            console.log("Already had a ship object id: " + objects[ship_index].id + ", but didn't know if was an active ship. Now we know it's the active ship of a player in the galaxy");


            let ship_coord_index = -1;
            for(let i = 0; i < coords.length; i++) {
                if(coords[i] && (coords[i].object_id === objects[ship_index].id || coords[i].belongs_to_object_id === objects[ship_index].id)) {
                    map.putTileAt(-1, coords[i].tile_x, coords[i].tile_y, false, 'layer_object');
                    ship_coord_index = i;
                }
            }

            console.log("Cleared out the ship");

            console.log("Ship coord index: " + ship_coord_index);

            // and draw the player if we are supposed to
            if (ship_coord_index !== -1 && shouldDraw(client_player_info.coord, coords[ship_coord_index])) {
                console.log("Should draw returned true");
        
                if (!players[player_index].sprite) {
        
                    createPlayerSprite(player_index);
                }
                //movePlayerInstant(player_index, player_info.coord.tile_x * tile_size + tile_size / 2, player_info.coord.tile_y * tile_size + tile_size / 2);
            }

        }
    }

    setPlayerMoveDelay(player_index);

}

function animateFloor(planet_coord_id) {
    // see if we already have an animated object
    let animation_index = animations.findIndex(function (obj) { return obj && obj.planet_coord_id === planet_coord_id; });

    if (animation_index !== -1) {
        return;
    }

    animations.push({ 'planet_coord_id': planet_coord_id, 'current_frame': 1 });


}

function animateObject(object) {
    // see if we already have an animated object
    let animation_index = animations.findIndex(function (obj) { return obj && obj.object_id === object.id; });

    if (animation_index !== -1) {
        return;
    }

    let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === object.object_type_id; });

    if (object_types[object_type_index].is_active_frame_count === 1) {
        console.log("%c Can't animate object type with one frame", log_warning);
        return false;
    }

    animations.push({ 'object_id': object.id, 'current_frame': 1 });


}


function canPlacePlayer(scope, coord, player_index, show_output = false) {

    if (typeof player_index === 'undefined') {
        return false;
    }

    let checking_coords = [];

    // If we have a player id, use the body or a ship type, depending on the view
    let body_index = -1;
    let ship_index = -1;
    let type_index = -1;


    if (scope === 'planet' || scope === 'ship') {
        //console.log("Getting body");
        body_index = getObjectIndex(players[player_index].body_id);

        if (body_index === -1) {

            if (show_output) {
                console.log("Could not get player's body");
            }

            return false;
        }

        type_index = getObjectTypeIndex(objects[body_index].object_type_id);
    } else if (scope === 'galaxy') {
        //console.log("Getting ship");
        ship_index = getObjectIndex(players[player_index].ship_id);

        if (ship_index === -1) {

            if (show_output) {
                console.log("Could not get player's ship. id: " + players[player_index].ship_id);
            }

            return false;
        }
        type_index = getObjectTypeIndex(objects[ship_index].object_type_id);
    }

    if (body_index === -1 && ship_index === -1) {

        if (show_output) {
            console.log("Couldn't get body or ship");

            console.log("Player's ship id: " + players[player_index].ship_id);
            console.log("Ship's object type id: " + objects[ship_index].object_type_id);
        }

        return false;
    }

    if (type_index === -1) {

        if (show_output) {
            console.log("Couldn't get type for body or ship");

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
    let display_linkers = object_type_display_linkers.filter(linker =>
        linker.object_type_id === object_types[type_index].id && !linker.only_visual);

    if (display_linkers.length > 0) {


        for (let linker of display_linkers) {
            let linker_movement_width = linker.position_x + 1;
            if (linker_movement_width > movement_tile_width) {
                movement_tile_width = linker_movement_width;
            }

            let linker_movement_height = linker.position_y + 1;
            if (linker_movement_height > movement_tile_height) {
                movement_tile_height = linker_movement_height;
            }
        }


        last_x = coord.tile_x + movement_tile_width - 1;
        last_y = coord.tile_y + movement_tile_height - 1;

        for (let x = coord.tile_x; x <= last_x; x++) {
            for (let y = coord.tile_y; y <= last_y; y++) {


                let checking_coord_index = -1;
                if (scope === 'galaxy') {
                    checking_coord_index = getCoordIndex({ 'tile_x': x, 'tile_y': y });

                    if (checking_coord_index !== -1) {
                        checking_coords.push(coords[checking_coord_index]);
                    }
                } else if (scope === 'planet') {
                    checking_coord_index = getPlanetCoordIndex({
                        'planet_id': coord.planet_id,
                        'planet_level': coord.level, 'tile_x': x, 'tile_y': y
                    });

                    if (checking_coord_index !== -1) {
                        checking_coords.push(planet_coords[checking_coord_index]);
                    }
                } else if (scope === 'ship') {
                    checking_coord_index = getShipCoordIndex({
                        'ship_id': coord.ship_id,
                        'tile_x': x, 'tile_y': y
                    });

                    if (checking_coord_index !== -1) {
                        checking_coords.push(ship_coords[checking_coord_index]);
                    }
                }

                // We weren't able to find all the coords we needed to match up to all the display linkers
                if (checking_coord_index === -1) {

                    if (show_output) {
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
    for (let checking_coord of checking_coords) {
        //console.log("Checking coord id: " + checking_coord.id);

        let object_type_index = -1;
        if (checking_coord.object_type_id) {
            object_type_index = getObjectTypeIndex(checking_coord.object_type_id);
        }

        let object_index = -1;
        if (checking_coord.object_id) {
            object_index = getObjectIndex(checking_coord.object_id);
        } else if (checking_coord.belongs_to_object_id) {
            object_index = getObjectIndex(checking_coord.belongs_to_object_id);
        }


        if (checking_coord.floor_type_id) {
            let floor_type_index = getFloorTypeIndex(checking_coord.floor_type_id);

            if (floor_type_index !== -1) {
                if (!floor_types[floor_type_index].can_walk_on) {

                    if (show_output) {
                        console.log("Returning false on " + checking_coord.tile_x + "," + checking_coord.tile_y + " can't walk on floor");
                    }

                    return false;
                }
            }
        }

        // Coord has a monster
        if (checking_coord.monster_id || checking_coord.belongs_to_monster_id) {

            if (show_output) {
                console.log("Returning false on " + checking_coord.tile_x + "," + checking_coord.tile_y + " monster");
            }

            return false;
        }

        // Coord has an npc
        if (checking_coord.npc_id) {

            if (show_output) {
                console.log("Returning false on " + checking_coord.tile_x + "," + checking_coord.tile_y + " npc");
            }

            return false;
        }

        // We have a base object type here - no object/belongs object
        if (checking_coord.object_type_id && !checking_coord.object_id && !checking_coord.belongs_to_object_id) {


            if (object_type_index !== -1) {

                // We want to be able to move onto dockable ships

                if (object_types[object_type_index].is_ship && object_types[object_type_index].is_dockable) {
                    // we good!

                } else if (!object_types[object_type_index].can_walk_on) {

                    if (show_output) {
                        console.log("Checking coord id: " + checking_coord.id + " scope: " + scope);
                        console.log("Returning false on " + checking_coord.tile_x + "," + checking_coord.tile_y + " not walkable object");
                    }

                    //log(chalk.yellow("Blocked by object_type_id"));
                    return false;
                }
            }
        }

        // The coord has an object - either directly, or belonging to that object
        if (checking_coord.object_id || checking_coord.belongs_to_object_id) {


            // If it's us... we're done with that coord
            if (scope === 'galaxy' && checking_coord.object_id &&
                checking_coord.object_id === players[player_index].ship_id) {

            } else if (scope === 'galaxy' && checking_coord.belongs_to_object_id &&
                checking_coord.belongs_to_object_id === players[player_index].ship_id) {

            } else {


                if (object_index !== -1) {
                    let object_type_index = getObjectTypeIndex(objects[object_index].object_type_id);


                    if (!object_types[object_type_index].can_walk_on && !object_types[object_type_index].is_dockable) {

                        if (show_output) {
                            console.log("Returning false");
                        }

                        return false;
                    }
                }
            }


        }


        //console.log("Checking coord planet id: " + checking_coord.planet_id);

        // || checking_coord.belongs_to_planet_id
        if (scope === 'galaxy' && checking_coord.planet_id) {

            /*
            if (show_output) {
                console.log("Returning false on " + checking_coord.tile_x + "," + checking_coord.tile_y + " planet");
            }

            return false;
            */
            let planet_index = getPlanetIndex({ 'planet_id': checking_coord.planet_id });
            if(planets[planet_index].planet_type_id === 26) {
                if (show_output) {
                    console.log("Returning false on forming planet");
                }
                return false;   
            }

        }


        if (scope === 'galaxy' && checking_coord.belongs_to_planet_id) {

            // step 1. Find the base planet coord it

            let planet_index = getPlanetIndex({ 'planet_id': checking_coord.belongs_to_planet_id });

            if (planet_index !== -1) {
                let origin_planet_coord_index = getCoordIndex({ 'coord_id': planets[planet_index].coord_id });
                if (origin_planet_coord_index !== -1) {

                    let linker_position_x = checking_coord.tile_x - coords[origin_planet_coord_index].tile_x;
                    let linker_position_y = checking_coord.tile_y - coords[origin_planet_coord_index].tile_y;

                    // step 2. Find the display linker we are trying to move to
                    let display_linker_index = planet_type_display_linkers.findIndex(function (obj) {
                        return obj.planet_type_id === planets[planet_index].planet_type_id && obj.position_x === linker_position_x &&
                            obj.position_y === linker_position_y;
                    });

                    // step 3. Check if it's only_visual or not
                    if (display_linker_index !== -1 && !planet_type_display_linkers[display_linker_index].only_visual) {

                        if (show_output) {
                            console.log("Move would have the ship overlap with the planet (aren't we just going to land on it then?)");
                        }
                        // I honestly am not sure why I was returning false here. Seeing how things are with this commented out
                        //return false;
                    }



                }
            }



        }

        if (checking_coord.player_id && checking_coord.player_id !== players[player_index].id) {

            if (show_output) {
                console.log("Returning false on " + checking_coord.tile_x + "," + checking_coord.tile_y + " other player");
            }

            return false;
        }


        // Special case - The Great Nomad
        if(scope === 'galaxy' && object_type_index !== -1 && object_types[object_type_index].id === 351) {
            console.log("PLAYER IS TRYING TO LAND ON THE GREAT NOMAD");


            // We allow it!
            if (localStorage.getItem("allowthegreatnomad") === "true") {

            } 
            // Players need to confirm
            else {
                $('#click_menu').css({
                    'top': 250, 'left': 250, 'position': 'absolute', 'max-height': '400px', 'max-width': '640px',
                    'overflow-y': 'scroll', 'overflow-x': 'scroll', 'padding': '10px'
                }).fadeIn('fast');
            
                $('#click_menu').empty();
    
                $('#click_menu').append("This ship is The Great Nomad. No player can control it. It will randomly leave and re-enter our galaxy.<br><br>");
                $('#click_menu').append("While outside of the galaxy, there is no way to return other than dying");
                $('#click_menu').append("<button id='thegreatnomad' class='button is-info'>I understand the risks. Let me dock at The Great Nomad</button>");
                return false;
            }

        }

        /*
        * I want to say that the checks above  ( if(checking_coord.object_id || checking_coord.belongs_to_object_id) { ) cover this case
        if(checking_coord.belongs_to_object_id && checking_coord.belongs_to_object_id !== players[player_index].body_id &&
            checking_coord.belongs_to_object_id !== players[player_index].ship_id) {
            if(show_output) {
                console.log("Returning false on " + checking_coord.tile_x + "," + checking_coord.tile_y + " belongs to other object");
            }

            return false;
        }
        */

    }

    if (show_output) {
        console.log("Returning true");
    }

    return true;

}

function clearTiles(direction) {
    /*
    if(direction == 'up') {

        var y = user_player.player_image.y - 3;
        for(var x = user_player.player_image.x - (show_cols / 2) - 2; x < user_player.player_image.x + show_cols / 2 + 2; x++ ) {

            let tileX = layer_floor.getTileX(x);
            let tileY = layer_floor.getTileY(y);


            map.putTileAt(20, tileX, tileY, null, 'layer_object');
        }
    }
    */
}

// Used to clear the things we need to clear when a player moves levels
function clearPreviousLevel() {
    battle_linkers = [];

    // and remove the monster sprites that are on a different level
    // and add sprites for monsters that are now on our level
    monsters.forEach(function (monster, i) {

        if (monsters[i].sprite) {
            monster.sprite.destroy();
            monster.sprite = false;

            // I think that I need to delete the monsters here. When the player is switching levels, back and forth
            // it's seeing monsters in a previous position.
            delete monsters[i];
        }



        /*
        // I get trying to keep monsters that we currently have that are the current level, but we aren't
        // passing any of that info into this function at the moment.
        let monster_coord_index = planet_coords.findIndex(function(obj) {
            return obj && obj.id === monster.planet_coord_id;
        });

        if(monster_coord_index === -1) {
            return false;
        }

        if(monster_coord_index !== -1 && monster.sprite &&
            planet_coords[monster_coord_index].level !== planet_coords[new_planet_coord_index].level) {
            monster.sprite.destroy();
            monster.sprite = false;
        }

        if(monster_coord_index !== -1 && !monster.sprite &&
            planet_coords[monster_coord_index].level === planet_coords[new_planet_coord_index].level &&
            shouldDraw(client_player_info.coord, planet_coords[monster_coord_index])) {
            createMonsterSprite(i);
        }
        */
    });

    npcs.forEach(function(npc, i) {
        if(npcs[i].sprite) {
            npc.sprite.destroy();
            npc.sprite = false;
            delete npcs[i];
        }
    });

    players.forEach(function (player, i) {

        if (player.id === client_player_id) {
            return false;
        }

        if (!player.planet_coord_id) {
            return false;
        }

        // I THINK we can just destroy the other players always - if it looks like we need to have these conditions back in,
        // we need to filter by view too.
        destroyPlayerSprite(player);

        /*
        let other_planet_coord_index = planet_coords.findIndex(function(obj) { return obj &&
            obj.id === player.planet_coord_id; });

        if(other_planet_coord_index === -1) {
            destroyPlayerSprite(player);
        } else if(planet_coords[other_planet_coord_index].planet_id !== planet_coords[new_planet_coord_index].planet_id ||
            planet_coords[other_planet_coord_index].level !== planet_coords[new_planet_coord_index].level) {
            destroyPlayerSprite(player);
        } else if(planet_coords[other_planet_coord_index].planet_id === planet_coords[new_planet_coord_index].planet_id &&
            planet_coords[other_planet_coord_index].level === planet_coords[new_planet_coord_index].level) {
            createPlayerSprite(i);
        }
        */

    });

    // remove the animations we have
    animations.splice(0, animations.length);

    // remove the names we have drawn and clear tints
    for (let i = 0; i < objects.length; i++) {
        if (objects[i]) {

            if (objects[i].name_text) {
                objects[i].name_text.destroy();
                objects[i].name_text = false;
            }

            if (objects[i].tint) {
                let object_info = getObjectInfo(i);
                if (object_info.coord) {
                    let object_tile = map.getTileAt(object_info.coord.tile_x, object_info.coord.tile_y, false, 'layer_object');
                    if (object_tile) {
                        object_tile.tint = "0xffffff";
                        //object_tile.clearTint();
                    }
                }
            }

        }
    }

    // clear our effects
    // If there are any effects associated with this, remove them
    for(let i = 0; i < effect_sprites.length; i++) {

        if(effect_sprites[i] && effect_sprites[i].visible) {

            if(effect_sprites[i].monster_id) {
                effect_sprites[i].monster_id = false;
            }

            if(effect_sprites[i].npc_id) {
                effect_sprites[i].npc_id = false;
            }

            if(effect_sprites[i].object_id) {
                effect_sprites[i].object_id = false;
            }

            if(effect_sprites[i].planet_id) {
                effect_sprites[i].planet_id = false;
            }

            if(effect_sprites[i].player_id) {
                effect_sprites[i].player_id = false;
            }
            effect_sprites[i].setVisible(false);

        }
    }
}

function createMonsterSprite(monster_index) {

    if (monsters[monster_index].sprite) {
        return true;
    }

    //console.log("In craeteMonsterSprite");
    let new_texture_key = false;
    let new_texture_animation_key = false;


    let scene_game = game.scene.getScene('sceneGame');

    let monster_type_index = monster_types.findIndex(function (obj) {
        return obj && obj.id === monsters[monster_index].monster_type_id
    });

    if(monster_type_index === -1) {
        return false;
    }

    let monster_sprite_index = monster_sprites.findIndex(function(obj) { return obj && obj.monster_type_id === monsters[monster_index].monster_type_id; });

    new_texture_key = urlName(monster_types[monster_type_index].name);
    new_texture_animation_key = new_texture_key + "-animation";
    //console.log("Setting texture/animation to: " + new_texture_key + " , " + new_texture_animation_key);

    if (!monsters[monster_index].sprite) {

        if (scene_game.textures.exists(new_texture_key)) {
            monsters[monster_index].sprite = scene_game.add.sprite(-1000, -1000, new_texture_key);
            monsters[monster_index].sprite.anims.play(new_texture_animation_key);
            monsters[monster_index].sprite.setDepth(3);

            // and move it to where it needs to be
            let monster_info = getMonsterInfo(monster_index);

            monsters[monster_index].sprite_x_offset = 0;
            monsters[monster_index].sprite_y_offset = 0;

            if (new_texture_key === "slaver-guard") {
                monsters[monster_index].sprite_y_offset = -6;
            }

            if (new_texture_key === "robot-janitor") {
                monsters[monster_index].sprite_y_offset = -6;
            }

            if(monster_sprite_index !== -1) {
                if(typeof monster_sprites[monster_sprite_index].x_offset !== 'undefined') {
                    monsters[monster_index].sprite_x_offset = monster_sprites[monster_sprite_index].x_offset;
                }
    
                if(typeof monster_sprites[monster_sprite_index].y_offset !== 'undefined') {
                    monsters[monster_index].sprite_y_offset = monster_sprites[monster_sprite_index].y_offset;
                }
            }
            

            if (monster_info.coord) {
                monsters[monster_index].sprite.x = monster_info.coord.tile_x * tile_size + tile_size / 2 + monsters[monster_index].sprite_x_offset;
                monsters[monster_index].sprite.y = monster_info.coord.tile_y * tile_size + tile_size / 2 + monsters[monster_index].sprite_y_offset;
            }
        } else {
            console.log("%c Don't have sprite for monster. Should grab it via monster_sprites", log_warning);

            loadMonsterSprites('monster_type', monsters[monster_index].monster_type_id);
        }



    }

}

function createNpcSprite(npc_index) {

    //console.log("In craeteMonsterSprite");


    let new_texture_key = 'npc';
    let new_texture_animation_key = "npc-animation";


    let scene_game = game.scene.getScene('sceneGame');


    // If the npc has a ship, the viewing player is in the galaxy view, we draw the ship!
    if (current_view === 'galaxy') {

        // Npc has a specific ship
        if (npcs[npc_index].ship_id) {
            let ship_index = objects.findIndex(function (obj) { return obj && obj.id === npcs[npc_index].ship_id; });

            if (ship_index === -1) {
                socket.emit('request_object_info', { 'object_id': npcs[npc_index].ship_id });
            } else {
                let ship_type_index = object_types.findIndex(function (obj) { return obj && obj.id === objects[ship_index].object_type_id; });
                if (ship_type_index !== -1) {
                    new_texture_key = 'bug-ship';
                    new_texture_animation_key = 'bug-ship-animation';
                }
            }
        }
        // We're gonna fake it a little and just draw their pod
        else {
            new_texture_key = 'npc-pod';
            new_texture_animation_key = 'npc-pod-animation';
        }

    }


    // Straight create
    if (!npcs[npc_index].sprite) {
        //console.log("Creating npc sprite with new_texture_key: " + new_texture_key);
        npcs[npc_index].sprite = scene_game.add.sprite(-1000, -1000, new_texture_key);
        npcs[npc_index].sprite.anims.play(new_texture_animation_key);

        if (npcs[npc_index].current_hp !== npcs[npc_index].max_hp) {
            redrawBars();
        }
    }
    // Update
    else if (npcs[npc_index].sprite.texture.key !== new_texture_key) {
        //console.log("Updating npc sprite with new_texture_key: " + new_texture_key);
        npcs[npc_index].sprite.setTexture(new_texture_key);
        npcs[npc_index].sprite.anims.play(new_texture_animation_key);
    }


    // and move it to where it needs to be
    let npc_info = getNpcInfo(npc_index);

    npcs[npc_index].sprite_x_offset = 0;
    npcs[npc_index].sprite_y_offset = 0;

    if (new_texture_key === "npc") {
        npcs[npc_index].sprite_y_offset = -6;
    }

    if (npc_info.coord) {
        npcs[npc_index].sprite.x = npc_info.coord.tile_x * tile_size + tile_size / 2 + npcs[npc_index].sprite_x_offset;
        npcs[npc_index].sprite.y = npc_info.coord.tile_y * tile_size + tile_size / 2 + npcs[npc_index].sprite_y_offset;
    } else {
        console.log("Drew npc at -1000,-1000 :(");
    }


}


function createPlayerSprite(player_index) {
    //console.log("In createPlayerSprite for player " + players[player_index].name);
    //console.trace();

    if (typeof player_index === 'undefined' || player_index === -1) {
        console.log("Not drawing undefined/invalid player");
        return false;
    }

    // If the player isn't in the same room/level as us, there's no need to try creating their sprite
    // Player isn't even logged in right now
    if (players[player_index].planet_coord_id === 0 && players[player_index].ship_coord_id === 0 && players[player_index].coord_id === 0) {
        console.log("All coords are false for this player");
        return false;
    }

    let new_texture_key = false;
    let new_texture_animation_key = false;
    let new_movement_display = 'flip';
    let new_sprite_x_offset = 0;
    let new_sprite_y_offset = 0;
    let body_index = -1;
    let ship_index = -1;
    let used_skin = false;


    let scene_game = game.scene.getScene('sceneGame');

    if (current_view === 'galaxy') {
        // figure out what ship we have
        ship_index = objects.findIndex(function (obj) { return obj && obj.id === players[player_index].ship_id; });

        if (ship_index === -1) {
            //console.log("%c at time of creating the player id: " + players[player_index].id + " sprite, we don't have the player's ship object",  log_warning);
            socket.emit('request_object_info', { 'object_id': players[player_index].ship_id, 'source': 'createPlayerSprite' });
            return false;
        }


        // THE 'IDLE' FOR SHIPS - DOWN ANIMATION


        // ASTEROID SHIP
        if (objects[ship_index].object_type_id === 298) {
            new_texture_key = 'player-asteroid-ship';
            new_texture_animation_key = 'player-asteroid-ship-animation';
            new_movement_display = 'static';
        }
        else if(objects[ship_index].object_type_id === 313) {
            new_texture_key = 'player-blockade-runner';
            new_texture_animation_key = 'player-blockade-runner-down-animation';
        } else if (objects[ship_index].object_type_id === 238) {                    // CARGO SHIP
            new_texture_key = 'player-cargo-ship';
            new_texture_animation_key = 'player-cargo-ship-down-animation';
            //new_movement_display = 'rotate';

        } else if (objects[ship_index].object_type_id === 271) {                    // DESTROYER
            new_texture_key = 'player-destroyer';
            new_texture_animation_key = 'player-destroyer-down-animation';
            //new_movement_display = 'rotate';
            new_sprite_x_offset = 32;
            new_sprite_y_offset = 32;

        } else if (objects[ship_index].object_type_id === 345) {                    // GARDEN SHIP
            new_texture_key = 'player-garden-ship';
            new_texture_animation_key = 'player-garden-ship-animation';
            // Not sure I want any movement display
            //new_movement_display = 'flip';
            new_movement_display = 'static';
            new_sprite_x_offset = 32;
            new_sprite_y_offset = 32;
        } else if (objects[ship_index].object_type_id === 114) {                    // POD

            let use_luxury_pod = false;
            if(skin_purchase_linkers.length > 0) {
                for(let sk = 0; sk < skin_purchase_linkers.length; sk++) {
                    if(skin_purchase_linkers[sk].object_type_id === 437) {
                        use_luxury_pod = true;
                    }
                }
            }

            if(use_luxury_pod) {
                new_texture_key = 'player-luxury-pod';
                new_texture_animation_key = 'player-luxury-pod-animation';
            } else {
                new_texture_key = 'player-pod';
                new_texture_animation_key = 'player-pod-animation';
            }
            

        } else if (objects[ship_index].object_type_id === 212) {
            new_texture_key = 'player-cutter';
            new_texture_animation_key = 'player-cutter-down-animation';
            //new_movement_display = 'rotate';
        } else if (objects[ship_index].object_type_id === 339) {                    // FIGHTER
            new_texture_key = 'player-fighter';
            new_texture_animation_key = 'player-fighter-down-animation';

        } else if(objects[ship_index].object_type_id === 296) {
            new_texture_key = 'player-lancer';
            new_texture_animation_key = 'player-lancer-down-animation';
        } else if(objects[ship_index].object_type_id === 387) {
            new_texture_key = 'player-living-wood-ship';
            new_texture_animation_key = 'player-living-wood-ship-animation';
        } else if (objects[ship_index].object_type_id === 239) {
            new_texture_key = 'player-mining-ship';
            new_texture_animation_key = 'player-mining-ship-down-animation';
            //new_movement_display = 'rotate';
        } else if (objects[ship_index].object_type_id === 233) {
            new_texture_key = 'player-shuttle';
            new_texture_animation_key = 'player-shuttle-down-animation';
            //new_movement_display = 'rotate';
        } else if (objects[ship_index].object_type_id === 155) {                // SPACE STATION
            new_texture_key = 'player-space-station';
            new_texture_animation_key = 'player-space-station-animation';
            // Not sure I want any movement display
            //new_movement_display = 'flip';
            new_movement_display = 'static';
            new_sprite_x_offset = 32;
            new_sprite_y_offset = 32;
        } else if (objects[ship_index].object_type_id === 270) {
            new_texture_key = 'player-royal-cruiser';
            new_texture_animation_key = 'player-royal-cruiser-animation';
            new_movement_display = 'flip';
            new_sprite_y_offset = 32;
        } else if(objects[ship_index].object_type_id === 335) {                 // SCIENCE VESSEL
            new_texture_key = 'player-science-vessel';
            new_texture_animation_key = 'player-science-vessel-animation';
        } else if(objects[ship_index].object_type_id === 369) {                 // SILK SHIP
            new_texture_key = 'player-silk-ship';
            new_texture_animation_key = 'player-silk-ship-animation';
        } else if(objects[ship_index].object_type_id === 381) {
            new_texture_key = 'player-water-ship';
            new_texture_animation_key = 'player-water-ship-animation';
        }
        else {
            // DEFAULT!!!!!!!
            console.log("%c Using Default Ship Display", log_warning);


            let use_luxury_pod = false;
            if(skin_purchase_linkers.length > 0) {
                for(let sk = 0; sk < skin_purchase_linkers.length; sk++) {
                    if(skin_purchase_linkers[sk].object_type_id === 437) {
                        use_luxury_pod = true;
                    }
                }
            }

            if(use_luxury_pod) {
                new_texture_key = 'player-luxury-pod';
                new_texture_animation_key = 'player-luxury-pod-animation';
            } else {
                new_texture_key = 'player-pod';
                new_texture_animation_key = 'player-pod-animation';
            }
        }


    } else if (current_view === 'planet' || current_view === 'ship') {

        // If the player has a skin_object_type_id set, we use that
        if (players[player_index].skin_object_type_id) {

            if (players[player_index].skin_object_type_id === 322) {
                new_texture_key = 'player-galaxy';
                new_texture_animation_key = 'player-galaxy-idle-animation';
                new_sprite_y_offset = -6;
                used_skin = true;
            }
        }

        // Normal body!
        if (used_skin === false) {
            //console.log("View is planet or ship");
            body_index = objects.findIndex(function (obj) { return obj && obj.id === players[player_index].body_id; });

            if (body_index === -1) {
                //console.log("%c at time of creating the player id: " + players[player_index].id + " sprite, we don't have the player's " +
                //    "body object id: " + players[player_index].body_id + ". Requesting it",  log_warning);
                socket.emit('request_object_info', { 'object_id': players[player_index].body_id });
                return false;
            }

            // HUMAN
            if (objects[body_index].object_type_id === 110) {
                new_texture_key = 'player-human';
                new_texture_animation_key = 'player-human-idle-animation';
                new_sprite_y_offset = -6;
            }
            // MANUFACTURING
            else if (objects[body_index].object_type_id === 219) {
                new_texture_key = 'player-manufacturing';
                new_texture_animation_key = 'player-manufacturing-idle-animation';
            } 
            // MLM
            else if (objects[body_index].object_type_id === 108) {
                new_texture_key = 'player-mlm';
                new_texture_animation_key = 'player-mlm-idle-animation';
            } 
            // OCTOPUS
            else if (objects[body_index].object_type_id === 344) {
                new_texture_key = 'player-octopus';
                new_texture_animation_key = 'player-octopus-idle-animation';
            } 
            // REINFORCED HUMAN
            else if (objects[body_index].object_type_id === 232) {
                new_texture_key = 'player-reinforced-human';
                new_texture_animation_key = 'player-reinforced-human-idle-animation';
            } 
            // RESEARCHING
            else if(objects[body_index].object_type_id === 411) {
                new_texture_key = 'player-researching';
                new_texture_animation_key = 'player-researching-idle-animation';
            }
            // RUEL
            else if (objects[body_index].object_type_id === 142) {
                new_texture_key = 'player-ruel';
                new_texture_animation_key = 'player-ruel-idle-animation';
            }
            // VUEG
            else if(objects[body_index].object_type_id === 439) {
                new_texture_key = 'player-vueg';
                new_texture_animation_key = 'player-vueg-idle-animation';
            }
            // DEFAULT!
            else {
                console.log("%c Using Default Body Display to draw player " + players[player_index].id, log_warning);

                new_texture_key = 'player-human';
                new_texture_animation_key = 'player-human-idle-animation';
                new_sprite_y_offset = -6;
            }
        }


    } else {
        console.log("%c at time of creating the player sprite, we don't have a current view", log_warning);
        //players[player_index].sprite = scene_game.add.sprite(-1000,-1000,'player-pod');
        //players[player_index].sprite.anims.play('player-pod-animation');
    }

    if (new_texture_key === false) {
        console.log("New texture key is false");
        return false;
    }

    // We get to create it
    if (!players[player_index].sprite) {

        let player_info = getPlayerInfo(player_index);

        if (player_info.coord) {

            if(scene_game.textures.exists(new_texture_key)) {

                players[player_index].sprite = scene_game.add.sprite(-1000, -1000, new_texture_key);

                players[player_index].sprite.anims.play(new_texture_animation_key);
    
                players[player_index].sprite.x = player_info.coord.tile_x * tile_size + tile_size / 2 + new_sprite_x_offset;
                players[player_index].sprite.y = player_info.coord.tile_y * tile_size + tile_size / 2 + new_sprite_y_offset;
    
                if (client_player_id && players[player_index].id === client_player_id) {
                    camera.startFollow(players[player_index].sprite);
                }
    
                players[player_index].movement_display = new_movement_display;
                players[player_index].sprite_x_offset = new_sprite_x_offset;
                players[player_index].sprite_y_offset = new_sprite_y_offset;
    
                setPlayerMoveDelay(player_index);
            } else {
                console.log("New player image isn't loaded yet");

                if(ship_index !== -1) {
                    console.log("Loading Ship Sprite");
                    loadPlayerSprites(objects[ship_index].object_type_id);
                } else if(used_skin) {
                    console.log("Loading Skin Sprite");
                    loadPlayerSprites(players[player_index].skin_object_type_id);
                } else if(body_index !== -1) {
                    console.log("Loading Body Sprite");
                    loadPlayerSprites(objects[body_index].object_type_id);
                }
                
                
            }


          

        } 
        // It's a ship sprite for another player. They are in their ship view, but we are in the galaxy view. Their ship is around us
        else if(!player_info.coord && players[player_index].ship_coord_id && current_view === 'galaxy') {

            console.log("Drawing another player in the ship view");
            let ship_index = getObjectIndex(players[player_index].ship_id);

            let ship_coord_index = getCoordIndex({'coord_id': players[player_index].coord_id });
            if(ship_coord_index !== -1) {
                if(scene_game.textures.exists(new_texture_key)) {

                    console.log("Ship is on coord id: " + coords[ship_coord_index].id);

                    players[player_index].sprite = scene_game.add.sprite(-1000, -1000, new_texture_key);

                    players[player_index].sprite.anims.play(new_texture_animation_key);
        
                    players[player_index].sprite.x = coords[ship_coord_index].tile_x * tile_size + tile_size / 2 + new_sprite_x_offset;
                    players[player_index].sprite.y = coords[ship_coord_index].tile_y * tile_size + tile_size / 2 + new_sprite_y_offset;
        
                    if (client_player_id && players[player_index].id === client_player_id) {
                        camera.startFollow(players[player_index].sprite);
                    }
        
                    players[player_index].movement_display = new_movement_display;
                    players[player_index].sprite_x_offset = new_sprite_x_offset;
                    players[player_index].sprite_y_offset = new_sprite_y_offset;
        
                    setPlayerMoveDelay(player_index);
                } else {
                    console.log("New player image isn't loaded yet");

                    if(ship_index !== -1) {
                        console.log("Loading Ship Sprite");
                        loadPlayerSprites(objects[ship_index].object_type_id);
                    } else if(used_skin) {
                        console.log("Loading Skin Sprite");
                        loadPlayerSprites(players[player_index].skin_object_type_id);
                    } else if(body_index !== -1) {
                        console.log("Loading Body Sprite");
                        loadPlayerSprites(objects[body_index].object_type_id);
                    }
                    
                    
                }
            } else {
                console.log("Couldn't get ship coord index from player's coord_id: " + players[player_index].coord_id);
            }
                
 
            
        } else {
            //console.log("%c No idea where to put player sprite for player id: " + players[player_index].id + "!", log_warning);
            //console.log("Player id: " + players[player_index].id + " coord_id: " + players[player_index].coord_id + 
            //" ship_coord_id: " + players[player_index].ship_coord_id + " planet_coord_id: " + players[player_index].planet_coord_id);
        
        }


    }
    // Just a switch!
    else if (players[player_index].sprite.texture.key !== new_texture_key) {

        if(scene_game.textures.exists(new_texture_key)) {
            //console.log("Switching texture for player id: " + players[player_index].id);
            players[player_index].sprite.setTexture(new_texture_key);
            players[player_index].sprite.anims.play(new_texture_animation_key);

            let player_info = getPlayerInfo(player_index);
            if (player_info.coord) {
                players[player_index].sprite.x = player_info.coord.tile_x * tile_size + tile_size / 2 + new_sprite_x_offset;
                players[player_index].sprite.y = player_info.coord.tile_y * tile_size + tile_size / 2 + new_sprite_y_offset;
            }
            players[player_index].movement_display = new_movement_display;
            players[player_index].sprite_x_offset = new_sprite_x_offset;
            players[player_index].sprite_y_offset = new_sprite_y_offset;
            players[player_index].sprite.angle = 0;
            players[player_index].sprite.flipX = false;

            setPlayerMoveDelay(player_index);

        } else {
            console.log("New player image isn't loaded yet");

            if(ship_index !== -1) {
                console.log("Loading Ship Sprite");
                loadPlayerSprites(objects[ship_index].object_type_id);
            } else if(used_skin) {
                console.log("Loading Skin Sprite");
                loadPlayerSprites(players[player_index].skin_object_type_id);
            } else if(body_index !== -1) {
                console.log("Loading Body Sprite");
                loadPlayerSprites(objects[body_index].object_type_id);
            }
        }


    }


    /*
    console.log("At end: sprite texture key: ");
    if(players[player_index].sprite) {
        console.log(players[player_index].sprite.texture);
        console.log(players[player_index].sprite.texture.key);
        console.log(players[player_index].sprite.texture['key']);
    } else {
        console.log("No sprite yet");
    }
    */


    if (players[player_index].sprite) {
        try {
            players[player_index].sprite.setDepth(5);
            //players[player_index].sprite.depth = 5;
        } catch (error) {
            console.log("%c Error setting player sprite depth: " + error, log_danger);
        }

    }

    // We just drew us - lets update the other player's around us
    if(players[player_index].sprite && player_index === client_player_index) {

        for(let i = 0; i < players.length; i++) {

            if(players[i] && i !== client_player_index) {

                let update_other_player_data = {};
                update_other_player_data.player = players[i];
                updatePlayer(update_other_player_data, i);
            }
        }

        if(current_view === 'planet') {
            generateSpaceportDisplay();
        }
    }


}

function destroyNpcSprite(npc) {

    if (!npc) {
        return false;
    }

    //console.log("Called destroyPlayerSprite");

    if (npc.sprite) {
        console.log("Destroying sprite for npc id: " + npc.id);
        npc.sprite.destroy();
        npc.sprite = false;
    }

    npc.sprite = false;
    npc.destination_x = false;
    npc.destination_y = false;
}

function destroyPlayerSprite(player) {

    if (!player) {
        console.log("%c No valid player sent into destroyPlayerSprite", log_warning);
    }

    //console.log("Called destroyPlayerSprite");

    if (player.sprite) {

        player.sprite.destroy();
        player.sprite = false;
    }

    player.sprite = false;
    player.destination_x = false;
    player.destination_y = false;
}


function displayClickNpc(npc_id) {


    let adding_html = "";


    let npc_index = getNpcIndex(npc_id);

    if(npc_index === -1) {
        socket.emit('request_npc_info', { 'npc_id': npc_id });
        adding_html += "A NPC";
        return;
    }


    adding_html += npcs[npc_index].name + " ( A NPC )";

    if(debug_mode) {
        adding_html += " ID: " + npcs[npc_index].id;
    }

    $('#coord_data').append(adding_html + "<br>");
}

function displayClickObject(object_id) {
    let object_index = objects.findIndex(function (obj) { return obj && obj.id === object_id; });

    if (object_index === -1) {
        //console.log("Requesting object info");
        socket.emit('request_object_info', { 'object_id': object_id });
        return false;
    }


    let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === objects[object_index].object_type_id; });

    if (object_type_index === -1) {
        console.log("%c Could not find an object type for object id: " + objects[object_index].id, log_warning);
        return false;
    }

    $('#coord_data').append(object_types[object_type_index].name + "<br>");


    if(object_types[object_type_index].max_energy_storage) {
        $('#coord_data').append("Energy: " + objects[object_index].energy + "/" + object_types[object_type_index].max_energy_storage + "<br>");
    } else if(objects[object_index].energy) {
        $('#coord_data').append("Energy: " + objects[object_index].energy + "<br>");
    }


    if (objects[object_index].player_id) {
        let player_index = players.findIndex(function (obj) { return obj && obj.id === objects[object_index].player_id; });
        if (player_index !== -1) {
            $('#coord_data').append("&nbsp;&nbsp;Owned By Player <a target='_blank' href='https://space.alphacoders.com/player/view/" + 
                players[player_index].id + "'>" + players[player_index].name + "</a><br>");

        } else {
            socket.emit('request_player_info', { 'player_id': objects[object_index].player_id });
        }

        // In the case of an object owned by a player, and being a ship - there's a potential for an AI and rules
        if (objects[object_index].ai_id) {

            let ai_index = objects.findIndex(function (obj) { return obj && obj.id === objects[object_index].ai_id });

            if (ai_index !== -1) {
                $('#coord_data').append("&nbsp;&nbsp;An AI Is Present<br>");


                // get any AI Rules
                rules.forEach(function (rule) {
                    if (rule.object_id === objects[ai_index].id) {
                        $('#coord_data').append("&nbsp;&nbsp;&nbsp;&nbsp;AI Rule: " + displayRule(rule.rule) + " <br>");
                    }
                });
            } else {
                $('#coord_data').append("&nbsp;&nbsp;Need AI Data<br>");
                socket.emit('request_object_info', { 'object_id': objects[object_index].ai_id });
            }
        }
    }

    if (objects[object_index].npc_id) {
        $('#coord_data').append("&nbsp;&nbsp;Owned By NPC ID: " + objects[object_index].npc_id);
    }

    if (objects[object_index].current_hp !== object_types[object_type_index].hp) {
        $('#coord_data').append("&nbsp;&nbsp;HP: " + objects[object_index].current_hp + "/" + object_types[object_type_index].hp);
    }

    if(object_types[object_type_index].max_energy_storage) {

        $('#coord_data').append("&nbsp;&nbsp;Energy: " + objects[object_index].energy + "/" + object_types[object_type_index].max_energy_storage + " <br>");
        
    }

    if (debug_mode) {
        $('#coord_data').append("&nbsp;&nbsp;Object ID: " + object_id + "<br>");
        $('#coord_data').append("&nbsp;&nbsp;Has inventory: " + objects[object_index].has_inventory + "<br>");

        $('#coord_data').append("&nbsp;&nbsp;Current HP: " + objects[object_index].current_hp + "<br>");


        if (object_types[object_type_index].spawns_object_type_id) {
            let spawned_object_type_index = object_types.findIndex(function (obj) {
                return obj &&
                    obj.id === object_types[object_type_index].spawns_object_type_id;
            });

            if (spawned_object_type_index !== -1) {
                $('#coord_data').append("&nbsp;&nbsp;Spawns " + object_types[spawned_object_type_index].name + "<br>");
            }
        }

        if (objects[object_index].spawned_event_id) {
            $('#coord_data').append("&nbsp;&nbsp;Spawned Event ID:" + objects[object_index].spawned_event_id + "<br>");
        }


    }


    if (object_types[object_type_index].is_ship && !objects[object_index].player_id && !objects[object_index].npc_id) {
        $('#coord_data').append("This ship has been abandoned");
    }


}


function displayRule(rule_text) {

    if (rule_text === "attack_all_players") {
        return "<span class='tag is-danger'>Attack All Players <i class=\"fas fa-swords\"></i></span>";
    } else if (rule_text === 'protect_all_players') {
        return "<span class='tag is-success'>Protect All Players  <i class=\"fas fa-shield-check\"></i></span>";
    } else if (rule_text === 'protect_players_from_players') {
        return "<span class='tag is-success'>Protect PVP  <i class=\"fas fa-shield-check\"></i></span>";
    } else if (rule_text === 'protect_creator_property') {
        return "Protect Creator Property";
    } else if (rule_text === 'protect_all_npcs') {
        return "Protect All NPCs";
    } else if (rule_text === 'building_no_others') {
        return "Only Owner Can Build";
    } else if (rule_text === 'floor_no_others') {
        return "Only Owner Can Replace Floors";
    }

    return rule_text;
}

// We don't actually draw players in this
function drawCoord(type, coord) {


    // We might get coords before we have a player - if that's happening just always draw them
    if (client_player_index !== -1) {

        let show_coord = false;


        if (type === 'planet' && players[client_player_index].planet_coord_id) {
            // make sure the level is the same
            let player_coord_index = planet_coords.findIndex(function (obj) { return obj && obj.id === players[client_player_index].planet_coord_id; });

            // We don't actually have our planet coord yet, just draw things
            if (player_coord_index === -1) {
                show_coord = true;
            } else if (coord.level === planet_coords[player_coord_index].level) {
                show_coord = true;
            }

        }

        if (type === 'galaxy' && current_view === 'galaxy') {
            show_coord = true;
        }

        if (type === 'ship' && players[client_player_index].ship_coord_id) {
            let player_coord_index = ship_coords.findIndex(function (obj) { return obj && obj.id === players[client_player_index].ship_coord_id; });

            // We don't actually have our ship coord yet, just draw things
            if (player_coord_index === -1) {
                show_coord = true;
            } else if (coord.level === ship_coords[player_coord_index].level && coord.ship_id === ship_coords[player_coord_index].ship_id) {
                show_coord = true;
            }
        }


        if (!show_coord) {
            return false;
        }
    }



    // clear out previous above level
    // THIS IS FOR TESTING THE fillBlankSpaces stuff!
    // Generally this works - but there are a couple of issues. 1. Planets can't start at 0,0 for it work.
    // They would need to start at like 10,10. Secondly, the layer above bit is still showing up here/there, or getting
    // removed where it shouldn't be getting removed.
    /*
    let tile_below = map.getTileAt(coord.tile_x, coord.tile_y - 1, false, 'layer_object');
    if(tile_below && tile_below.index !== 274) {
        map.putTileAt(-1, coord.tile_x, coord.tile_y, false, 'layer_above');
    }
    */



    // The Floor!
    if (coord.floor_type_id) {

        let floor_type_index = floor_types.findIndex(function (obj) { return obj && obj.id === coord.floor_type_id; });

        if (floor_type_index !== -1) {
            mapAddFloor(coord.floor_type_id, coord.tile_x, coord.tile_y, coord);

            if (floor_types[floor_type_index].is_animated) {
                if (type === 'planet') {
                    animateFloor(coord.id)
                }

            }
        }




    } else {
        map.putTileAt(-1, coord.tile_x, coord.tile_y, false, 'layer_floor');
    }


    // The Object!
    let object_index = 1;
    let draw_object = true;


    if (coord.object_id) {

        //console.log("Coord has object");

        object_index = objects.findIndex(function (obj) { return obj && obj.id === coord.object_id; });

        if (object_index === -1) {
            draw_object = false;
            socket.emit('request_object_info', { 'object_id': coord.object_id });
            //console.log("Don't have object info");


        } else if (client_player_index !== -1 && objects[object_index].id === players[client_player_index].ship_id) {

            // don't draw the player's ship
            //console.log("Our ship.Not drawing");

        }
        else {

            // we also don't draw it here if it's the active ship of another player, and we are both on the galaxy view
            let other_player_index = players.findIndex(function (obj) { return obj && obj.ship_id === coord.object_id; });

            if (other_player_index !== -1) {
                //console.log("Object is other player's ship");

                // Doesn't hurt to check and see if we draw the player here
                if(shouldDraw(client_player_info.coord, coord)) {
                    //console.log("Creating other player sprite!");
                    createPlayerSprite(other_player_index);
                } else {

                    //console.log("Other player's ship is not in a spot we should draw");

                }
                draw_object = false;

                /*
                // Make sure the object is removed from any galaxy coords 
                if(current_view === 'galaxy') {
                    console.log("Removing ")
                    for(let c = 0; c < coords.length; c++) {
                        if(coords[c] && coords[c].object_id === players[other_player_index].ship_id || coords[c].belongs_to_object_id === players[other_player_index].ship_id) {

                        }
                    }
                }
                */
            }

            // we also don't draw it here if it's the active ship of an npc in the galaxy
            let npc_index = npcs.findIndex(function (obj) { return obj && obj.ship_id === coord.object_id; });
            if (npcs[npc_index] && !npcs[npc_index].planet_coord_id) {
                draw_object = false;
            }

            // Not someone's active ship. Draw it
            if (draw_object) {

                mapAddObject(objects[object_index]);
            }
            // Someone's active ship, but we are in the galaxy view and they aren't. ( So we won't be drawing the player's sprite)
            else if (current_view === 'galaxy' && other_player_index !== -1 && players[other_player_index].ship_coord_id) {
                //console.log("Drawing object id: " + objects[object_index].id);
                mapAddObject(objects[object_index]);
            } else {
                //console.log("Other player's id: " + players[other_player_index].id + " ship, and they are in the galaxy " +
                //    "view too. coord id: " + players[other_player_index].coord_id);
            }


        }
    } else if (coord.belongs_to_object_id) {

    }
    else if (coord.object_type_id) {

        mapAddObjectType(coord, coord.tile_x, coord.tile_y);
    } else {
        map.putTileAt(-1, coord.tile_x, coord.tile_y, false, 'layer_object');
    }

    // A planet!
    if (coord.planet_id && coord.planet_id !== 0 && current_view === 'galaxy') {
        //console.log("Drawing planet. coord type: " + type + " coord id: " + coord.id);

        let planet_index = planets.findIndex(function (obj) { return obj && obj.id === coord.planet_id; });

        if (planet_index === -1) {


            socket.emit('request_planet_info', { 'planet_id': coord.planet_id });

        } else {

            let planet_type_index = planet_types.findIndex(function (obj) { return obj && obj.id === planets[planet_index].planet_type_id; });

            // see if we have an origin display linker for this planet
            let origin_linker_index = planet_type_display_linkers.findIndex(function (obj) {
                return obj &&
                    obj.planet_type_id === planet_types[planet_type_index].id && obj.position_x === 0 &&
                    obj.position_y === 0;
            });

            if (origin_linker_index !== -1) {
                map.putTileAt(planet_type_display_linkers[origin_linker_index].game_file_index,
                    coord.tile_x, coord.tile_y, false, 'layer_object');
            } else {
                map.putTileAt(planet_types[planet_type_index].game_file_index,
                    coord.tile_x, coord.tile_y, false, 'layer_object');
            }



        }

    } else if (coord.belongs_to_planet_id > 0 && current_view === 'galaxy') {


        let planet_index = planets.findIndex(function (obj) { return obj && obj.id === coord.belongs_to_planet_id; });

        if (planet_index === -1) {


            socket.emit('request_planet_info', { 'planet_id': coord.belongs_to_planet_id });
            return;
        }

        // find the origin planet coord
        let origin_coord_index = coords.findIndex(function (obj) { return obj && obj.planet_id === coord.belongs_to_planet_id; });
        if (origin_coord_index === -1) {
            //console.log("Don't have origin for planet yet");
            return;
        }


        // get the x and y difference, and see what display linker we use
        let x_difference = coord.tile_x - coords[origin_coord_index].tile_x;
        let y_difference = coord.tile_y - coords[origin_coord_index].tile_y;

        let display_linker_index = planet_type_display_linkers.findIndex(function (obj) {
            return obj &&
                obj.planet_type_id === planets[planet_index].planet_type_id && obj.position_x === x_difference &&
                obj.position_y === y_difference;
        });

        if (display_linker_index === -1) {
            console.log("Could not find a display linker that matched position x,y: " + x_difference + "," + y_difference);
            return false;
        }


        // TODO we need to listen to the layer of the linker. Could just be a display linker
        //console.log("Adding " + planet_type_display_linkers[display_linker_index].game_file_index + " at coord");
        map.putTileAt(planet_type_display_linkers[display_linker_index].game_file_index,
            coord.tile_x, coord.tile_y, false, planet_type_display_linkers[display_linker_index].layer);


    }

    // A unique display for ship coords with is_weapon_hardpoint or is_engine_hardpoint and no object
    if(coord.ship_id && !coord.object_id && (coord.is_weapon_hardpoint || coord.is_engine_hardpoint)) {
        //console.log("Placed empty hardpoint image");
        map.putTileAt(106,
            coord.tile_x, coord.tile_y, false, 'layer_object');
        map.putTileAt(95, coord.tile_x, coord.tile_y - 1, false, 'layer_above');
    }

}


function drawSalvageBar(salvaging_linker_index) {

    if (!salvaging_linkers[salvaging_linker_index]) {
        return false;
    }

    //console.log("Have salvaging linker in redrawBars");
    // get the object
    let drawing_x = -1000;
    let drawing_y = -1000;

    if(typeof salvaging_linkers[salvaging_linker_index].object_id !== 'undefined') {
        let object_index = objects.findIndex(function (obj) { return obj && obj.id === salvaging_linkers[salvaging_linker_index].object_id; });

        if (object_index === -1) {
            return false;
        }
    
        // objects currently only have hp . So we have to compare the object hp with the object type hp
        let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === objects[object_index].object_type_id; });
    
        if (object_type_index === -1) {
            console.log("Could not get object type");
            return false;
        }
    
        let object_info = getObjectInfo(object_index);
    
        if (object_info.coord === false) {
            //console.log("Could not find coord for object");
            return false;
        }
    
    
    
        drawing_x = object_info.coord.tile_x * tile_size;
        drawing_y = (object_info.coord.tile_y * tile_size) + tile_size - 16;
    } else {
        if(salvaging_linkers[salvaging_linker_index].coord_type === 'galaxy') {
            let salvaging_coord_index = getCoordIndex({ 'coord_id': salvaging_linkers[salvaging_linker_index].coord_id });
            if(salvaging_coord_index !== -1) {
                drawing_x = coords[salvaging_coord_index].tile_x * tile_size;
                drawing_y = (coords[salvaging_coord_index].tile_y * tile_size) + tile_size - 16;
            }
        } else if(salvaging_linkers[salvaging_linker_index].coord_type === 'ship') {
            let salvaging_coord_index = getShipCoordIndex({ 'ship_coord_id': salvaging_linkers[salvaging_linker_index].coord_id });
            if(salvaging_coord_index !== -1) {
                drawing_x = ship_coords[salvaging_coord_index].tile_x * tile_size;
                drawing_y = (ship_coords[salvaging_coord_index].tile_y * tile_size) + tile_size - 16;
            }
        } else if(salvaging_linkers[salvaging_linker_index].coord_type === 'planet') {
            let salvaging_coord_index = getPlanetCoordIndex({ 'planet_coord_id': salvaging_linkers[salvaging_linker_index].coord_id });
            if(salvaging_coord_index !== -1) {
                drawing_x = planet_coords[salvaging_coord_index].tile_x * tile_size;
                drawing_y = (planet_coords[salvaging_coord_index].tile_y * tile_size) + tile_size - 16;
            }
        }
    }



    // Completely arbitrary
    let percent_of_chunk = 5;

    if(salvaging_linkers[salvaging_linker_index].total_salvaged === 0) {

    } else if(salvaging_linkers[salvaging_linker_index].total_salvaged < 10) {

        percent_of_chunk = Math.floor(salvaging_linkers[salvaging_linker_index].total_salvaged / 10 * 100);


    } else {
        percent_of_chunk = Math.floor(salvaging_linkers[salvaging_linker_index].total_salvaged % 10) * 10;
    }


    // Blue bar for salvaging
    graphics.fillStyle(0x4287f5);


    let hp_bar_length = 64 * percent_of_chunk / 100;


    let rect = new Phaser.Geom.Rectangle(drawing_x, drawing_y, hp_bar_length, 8);
    graphics.fillRectShape(rect);
}


function fireCompleteCallback(animation, frame) {
    console.log("in fireCompleteCallback");
    this.destroy();
    //console.log("Destroyed fire sprite (done animating)");
    //sprite.anims.play('fire_attack');
}


// We take in what the player has researched, and we show things that are assembled via things the player has researched
function generateDiscoveryDisplay(object_type_id) {

    let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === parseInt(object_type_id); });

    $('#discoveries').empty();

    let html_string = "";
    html_string += "<div class='message is-success message-inline' style='margin-top:10px;'><div class='message-body'>";

    html_string += "<strong>Discoveries from researching " + object_types[object_type_index].name + ":</strong><br>";


    let can_assemble_object_types = object_types.filter(object_type => object_type.is_assembled);

    if (can_assemble_object_types && can_assemble_object_types.length > 0) {

        can_assemble_object_types.forEach(function (object_type) {

            // get the assembly linkers
            let assembly_linkers = object_type_assembly_linkers.filter(linker => linker.required_for_object_type_id === object_type.id);

            if (assembly_linkers.length === 0) {
                return false;
            }


            let researched_all_items = true;
            let has_applicable_linker = false;


            if (player_research_linkers.length === 0) {
                researched_all_items = false;
            }

            for (let assembly_linker of assembly_linkers) {

                if (assembly_linker.object_type_id === object_types[object_type_index].id) {
                    has_applicable_linker = true;
                }

                let assembly_object_type = object_types.findIndex(function (obj) { return obj && obj.id === assembly_linker.object_type_id; });
                let researched_this_item = false;


                for (let research_linker of player_research_linkers) {
                    if (research_linker.object_type_id === assembly_linker.object_type_id
                        && research_linker.researches_completed >= object_types[assembly_object_type].research_times_required) {
                        researched_this_item = true;
                    }
                }

                if (!researched_this_item) {
                    researched_all_items = false;
                }
            }

            // It's also possible that this object type has a required_research_object_type_id
            if (object_type.required_research_object_type_id === object_types[object_type_index].id) {

                html_string += printDiscovery(object_type, assembly_linkers);
            } else {
                if (!researched_all_items || !has_applicable_linker) {
                    return false;
                }

                // show the assembly

                html_string += printDiscovery(object_type, assembly_linkers);

                //$('#discoveries').append(generateAssemblyListItem(object_type, object_type_assembly_linkers));
            }



        });
    }


    html_string += "</div></div>";
    $('#discoveries').append(html_string);

}

function generateEatingLinkerDisplay() {

    if(client_player_index === -1 || !players[client_player_index]) {
        return false;
    }
    //console.log("In generateEatingLinkerDisplay");

    $('#eating_data').empty();

    let player_index = players.findIndex(function (obj) { return obj && obj.id === player_id; });

    if(player_index === -1) {
        return false;
    }
    let body_index = objects.findIndex(function (obj) { return obj && obj.id === players[player_index].body_id; });
    let body_type_index = object_types.findIndex(function (obj) { return obj && obj.id === objects[body_index].object_type_id; });

    let active_count = 0;
    for (let eating_linker of eating_linkers) {
        if (eating_linker && eating_linker.player_id === players[client_player_index].id && eating_linker.body_id === players[client_player_index].body_id) {
            active_count++;
        }
    }

    if (active_count === 0) {
        return;
    }

    let html_string = "";

    html_string += "<div class='message is-success message-inline'><div class='message-body'><i class='fas fa-cookie-bite'></i>";

    eating_linkers.forEach(function (eating_linker) {
        if (eating_linker && eating_linker.player_id === player_id) {

            let race_eating_linker_index = race_eating_linkers.findIndex(function (obj) {
                return obj &&
                    obj.race_id === object_types[body_type_index].race_id && obj.object_type_id === eating_linker.eating_object_type_id;
            });

            if (race_eating_linker_index !== -1) {
                let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === eating_linker.eating_object_type_id; });

                // If we have the player's body, we can get the race eating linker



                html_string += " " + object_types[object_type_index].name;

                if (race_eating_linkers[race_eating_linker_index].hp) {
                    html_string += " +" + race_eating_linkers[race_eating_linker_index].hp + "<i class=\"fad fa-heart\"></i> ";
                }

                if (race_eating_linkers[race_eating_linker_index].attack) {
                    html_string += " +" + race_eating_linkers[race_eating_linker_index].attack + "<i class=\"fas fa-swords\"></i></span> ";
                }

                if (race_eating_linkers[race_eating_linker_index].defense) {
                    html_string += " +" + race_eating_linkers[race_eating_linker_index].defense + "<i class=\"fad fa-shield-alt\"></i> ";
                }

                html_string += " " + eating_linker.ticks_completed +
                    "/" + race_eating_linkers[race_eating_linker_index].tick_count + "<br>";
            } else {
                console.log("Couldn't find race eating linker for this eating linker");
            }


        }
    });

    html_string += "</div></div>";

    $('#eating_data').append(html_string);
}

function generateFactionDisplay() {
    console.log("Generating faction display");

    if (!$("#faction").is(":visible")) {
        return false;
    }

    if (client_player_index === -1) {
        return false;
    }


    let player_faction_linker_index = faction_linkers.findIndex(function(obj) { return obj && obj.player_id === players[client_player_index].id; });

    $('#faction').empty();



    let html_string = "";
    html_string += "<div class='message is-dark message-inline'><div class='message-body'><strong>Factions:</strong><br>";

    // Allow them to create a faction or join one
    if (player_faction_linker_index === -1) {
        html_string += "<form action='#'>";
        html_string += "<input type=\"text\" class=\"input\" name=\"faction_name\" id=\"faction_name\">";
        html_string += "<input onclick=\"submitCreateFaction(); return false;\" type=\"submit\" class=\"button is-default\" value=\"Create Faction\">";
        html_string += "</form>";

        /*
        html_string += "<br>Top Factions:<br>";

        // Show the players the top factions
        factions.forEach(function(faction) {
            html_string += faction.name + ": " + faction.player_count + " members<br>";
        });
        */

        // Link to where they can search for factions
        html_string += "<a target=\"_blank\" href=\"https://space.alphacoders.com/faction\">View All Factions</a>";

        // Let them join by faction id
        html_string += "<form action='#'>";
        html_string += "<div class='field is-horizontal'>";
        html_string += "<input type='text' class='input' name='factionjoin' id='factionjoin' placeholder='faction id'>";
        html_string += "<input class='button is-default' onclick=\"submitFactionJoin(); return false;\" type=\"submit\" value=\"Join Faction\">";
        html_string += "</div>";
        html_string += "</form>";

    } else {
        let faction_index = factions.findIndex(function (obj) { return obj && obj.id === faction_linkers[player_faction_linker_index].faction_id; });
        if (faction_index !== -1) {
            html_string += "Your current faction: <a target='_blank' href='https://space.alphacoders.com/faction/view/" +
                factions[faction_index].id + "'>" + factions[faction_index].name + "</a> ";
        } else {
            html_string += "Your current faction id: <a target='_blank' href='https://space.alphacoders.com/faction/view/" +
                players[client_player_index].faction_id + "'>" + players[client_player_index].faction_id + "</a> ";
        }

        html_string += " <button class='button is-danger is-small is-pulled-right' id='leavefaction'>Leave</button>";
    }





    html_string += "</div></div>";
    $('#faction').append(html_string);
}



function generateFuelDisplay() {

    if(current_view === 'planet') {
        $('#fuel').empty();
        return;
    }

    if(client_player_index === -1) {
        return false;
    }

    let client_ship_index = objects.findIndex(function (obj) { return obj && obj.id === players[client_player_index].ship_id; });

    if(client_ship_index === -1) {
        return false;
    }

    // If we are just on our own ship, and it's not a dockable ship, the only option is to head back to the galaxy view
    let client_ship_type_index = object_types.findIndex(function (obj) { return obj.id === objects[client_ship_index].object_type_id; });

    if (object_types[client_ship_type_index].is_dockable) {
        on_ship_is_dockable = true;
    }

    // FUEL?????????
    if(client_ship_type_index !== -1) {
        if(object_types[client_ship_type_index].needs_engines) {

            $('#fuel').empty();

        
            if(current_view !== 'planet') {
                if(typeof objects[client_ship_index].current_engine_energy !== 'undefined') {

                    let html_string = "";
    
                    if(objects[client_ship_index].current_engine_energy * 3 < objects[client_ship_index].max_engine_energy) {
    
                        html_string += "&nbsp;<span class='has-text-danger'><i class=\"fad fa-gas-pump\"></i> Engine fuel: " + objects[client_ship_index].current_engine_energy  + "/" + 
                        objects[client_ship_index].max_engine_energy + "</span>";
    
                    } else {
                        html_string += "&nbsp;<span class='has-text-info'><i class=\"fad fa-gas-pump\"></i> Engine fuel: " + objects[client_ship_index].current_engine_energy  + "/" + 
                        objects[client_ship_index].max_engine_energy + "</span>";
                    }
    
                    $('#fuel').append(html_string);
    
                }
            }

            
        }
    }
}

// Shows all our stuff
function generatePlayerInfoDisplay() {

    if (!$("#player_stats").is(":visible")) {
        return false;
    }

    // Don't have the player yet
    if (client_player_index === -1) {
        return false;
    }

    $('#player_stats').empty();

    let html_string = "";

    html_string += "<div class='message message-inline'><div class='message-body'>";

    // If we are in the galaxy view, we want to show data about our ship above our player info, since that's the HP that will be
    let ship_index = objects.findIndex(function (obj) { return obj && obj.id === players[client_player_index].ship_id });
    if (ship_index !== -1) {

        let ship_object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === objects[ship_index].object_type_id; });

        html_string += "Ship Current HP: " + objects[ship_index].current_hp + "<br>";
        html_string += "Ship Max HP: " + object_types[ship_object_type_index].hp + "<br>";

    } else {
        //console.log("Unable to find player ship. Requesting it");
        socket.emit('request_object_info', { 'object_id': players[client_player_index].ship_id });
    }

    html_string += "Current HP: " + players[client_player_index].current_hp + "<br>";
    html_string += "Max HP: " + players[client_player_index].max_hp + "<br>";
    html_string += "Name: " + players[client_player_index].name + "<br>";
    html_string += "Exp: " + players[client_player_index].exp + "<br>";
    html_string += "Level: " + players[client_player_index].level + "<br>";
    html_string += "Attack: <br>";


    // We calculate the attack and defense on the fly.... I guess. We are
    // changing it a lot right now.
    // Default player stats is 5 attack range one (hitting with hands)
    let attack_ranges = [];
    attack_ranges[1] = 5;


    // for generating and showing our attack, we need to actually grab equipment linkers
    equipment_linkers.forEach(function (equipment_linker) {
        if (equipment_linker.player_id === players[client_player_index].id) {
            let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === equipment_linker.object_type_id; });

            if (object_type_index !== -1) {
                if (object_types[object_type_index].attack_strength) {

                    for (let i = 1; i < 6; i++) {
                        if (object_types[object_type_index].min_attack_range >= i
                            && object_types[object_type_index].max_attack_range <= i) {
                            attack_ranges[i] += object_types[object_type_index].attack_strength;
                            //console.log("Adding attack: " + object_types[object_type_index].attack_strength +
                            //    " to attack range: " + i);
                        }
                    }
                }
            } else {
                console.log("Have equipment linker we couldn't find object type for. Equipment linker id: " + equipment_linker.id);
            }

        }
    });

    for (let i = 0; i < 6; i++) {
        if (attack_ranges[i]) {
            if (attack_ranges[i] && attack_ranges[i] > 0) {
                html_string += "Attack at range: " + i + ": " + attack_ranges[i] + "<br>";

            }
        }
    }

    // Defense can be a little simpler and just stack
    let defense = 1;
    let defense_level = 1 + Math.floor(level_modifier * Math.sqrt(players[client_player_index].defending_skill_points));

    // For now we are just letting the level = the starting defense. Potentially going to make this more flexible
    defense = defense_level;

    equipment_linkers.forEach(function (equipment_linker) {
        if (equipment_linker.player_id === players[client_player_index].id && equipment_linker.body_id === players[client_player_index].body_id) {
            let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === equipment_linker.object_type_id; });
            if (object_type_index !== -1 && object_types[object_type_index].defense > 0) {
                //console.log("Equipment is adding defense: " + object_types[object_type_index].defense);
                defense += object_types[object_type_index].defense;
            }

        }
    });


    html_string += "Defending Skill Points: " + players[client_player_index].defending_skill_points + "<br>";
    html_string += "Defense: " + defense + "<br>";


    // get the player body
    let body_index = objects.findIndex(function (obj) { return obj && obj.id === players[client_player_index].body_id; });

    if (body_index !== -1) {
        html_string += "Body Energy: " + objects[body_index].energy + "<br>";

    }

    html_string += "</div></div>";
    html_string += "<div class='message message-inline'><div class='message-body'>";

    html_string += "<strong>Battle Skills</strong><br>";


    // CONTROL
    html_string += "Control: " + players[client_player_index].control_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let control_level = 1 + Math.floor(level_modifier * Math.sqrt(players[client_player_index].control_skill_points));

    html_string += " Level: " + control_level;

    if (control_level > 1) {
        let additional_damage = control_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_damage + "  <i class=\"fas fa-swords\"></i></span>";

    }
    html_string += "<br>";


    // CORROSIVE
    html_string += "Corrosive: " + players[client_player_index].corrosive_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let corrosive_level = 1 + Math.floor(level_modifier * Math.sqrt(players[client_player_index].corrosive_skill_points));

    html_string += " Level: " + corrosive_level;

    if (corrosive_level > 1) {
        let additional_damage = corrosive_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_damage + "  <i class=\"fas fa-swords\"></i></span>";

    }
    html_string += "<br>";



    // ELECTRIC
    html_string += "Electric: " + players[client_player_index].electric_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let electric_level = 1 + Math.floor(level_modifier * Math.sqrt(players[client_player_index].electric_skill_points));

    html_string += " Level: " + electric_level;

    if (electric_level > 1) {
        let additional_damage = electric_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_damage + "  <i class=\"fas fa-swords\"></i></span>";

    }
    html_string += "<br>";

    // EXPLOSION
    html_string += "Explosion: " + players[client_player_index].explosion_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let explosion_level = 1 + Math.floor(level_modifier * Math.sqrt(players[client_player_index].explosion_skill_points));

    html_string += " Level: " + explosion_level;

    if (explosion_level > 1) {
        let additional_damage = explosion_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_damage + "  <i class=\"fas fa-swords\"></i></span>";

    }
    html_string += "<br>";


    // FREEZE
    html_string += "Freeze: " + players[client_player_index].freeze_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let freeze_level = 1 + Math.floor(level_modifier * Math.sqrt(players[client_player_index].freeze_skill_points));

    html_string += " Level: " + freeze_level;

    if (freeze_level > 1) {
        let additional_damage = freeze_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_damage + "  <i class=\"fas fa-swords\"></i></span>";

    }
    html_string += "<br>";



    // HACKING
    html_string += "Hacking: " + players[client_player_index].hacking_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let hacking_level = 1 + Math.floor(level_modifier * Math.sqrt(players[client_player_index].hacking_skill_points));

    html_string += " Level: " + hacking_level;

    if (hacking_level > 1) {
        let additional_damage = hacking_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_damage + "  <i class=\"fas fa-swords\"></i></span>";

    }
    html_string += "<br>";

    // HEAT
    html_string += "Heat: " + players[client_player_index].heat_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let heat_level = 1 + Math.floor(level_modifier * Math.sqrt(players[client_player_index].heat_skill_points));

    html_string += " Level: " + heat_level;

    if (heat_level > 1) {
        let additional_damage = heat_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_damage + "  <i class=\"fas fa-swords\"></i></span>";

    }
    html_string += "<br>";

    // GRAVITY
    html_string += "Gravity: " + players[client_player_index].gravity_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let gravity_level = 1 + Math.floor(level_modifier * Math.sqrt(players[client_player_index].gravity_skill_points));

    html_string += " Level: " + gravity_level;

    if (gravity_level > 1) {
        let additional_damage = gravity_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_damage + "  <i class=\"fas fa-swords\"></i></span>";

    }
    html_string += "<br>";

    // LASER
    html_string += "Laser: " + players[client_player_index].laser_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let laser_level = 1 + Math.floor(level_modifier * Math.sqrt(players[client_player_index].laser_skill_points));

    html_string += " Level: " + laser_level;

    if (laser_level > 1) {
        let additional_damage = laser_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_damage + "  <i class=\"fas fa-swords\"></i></span>";

    }
    html_string += "<br>";

    // MELEE
    html_string += "Melee: " + players[client_player_index].melee_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let melee_level = 1 + Math.floor(level_modifier * Math.sqrt(players[client_player_index].melee_skill_points));

    html_string += " Level: " + melee_level;

    if (melee_level > 1) {
        let additional_damage = melee_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_damage + "  <i class=\"fas fa-swords\"></i></span>";

    }
    html_string += "<br>";



    // PIERCING
    html_string += "Piercing: " + players[client_player_index].piercing_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let piercing_level = 1 + Math.floor(level_modifier * Math.sqrt(players[client_player_index].piercing_skill_points));

    html_string += " Level: " + piercing_level;

    if (piercing_level > 1) {
        let additional_damage = piercing_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_damage + "  <i class=\"fas fa-swords\"></i></span>";

    }
    html_string += "<br>";


    // PLASMA
    html_string += "Plasma: " + players[client_player_index].plasma_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let plasma_level = 1 + Math.floor(level_modifier * Math.sqrt(players[client_player_index].plasma_skill_points));

    html_string += " Level: " + plasma_level;

    if (plasma_level > 1) {
        let additional_damage = plasma_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_damage + "  <i class=\"fas fa-swords\"></i></span>";

    }
    html_string += "<br>";

    // POISON
    html_string += "Poison: " + players[client_player_index].poison_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let poison_level = 1 + Math.floor(level_modifier * Math.sqrt(players[client_player_index].poison_skill_points));

    html_string += " Level: " + poison_level;

    if (poison_level > 1) {
        let additional_damage = poison_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_damage + "  <i class=\"fas fa-swords\"></i></span>";

    }
    html_string += "<br>";


    // RADIATION
    html_string += "Radiation: " + players[client_player_index].radiation_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let radiation_level = 1 + Math.floor(level_modifier * Math.sqrt(players[client_player_index].radiation_skill_points));

    html_string += " Level: " + radiation_level;

    if (radiation_level > 1) {
        let additional_damage = radiation_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_damage + "  <i class=\"fas fa-swords\"></i></span>";

    }
    html_string += "<br>";


    html_string += "</div></div>";






    /******************* LIFE SKILLS *******************************/
    html_string += "<div class='message message-inline'><div class='message-body'>";

    html_string += "<strong>Life Skills</strong><br>";

    // COOKING
    html_string += "Cooking: " + players[client_player_index].cooking_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let cooking_level = 1 + Math.floor(difficult_level_modifier * Math.sqrt(players[client_player_index].cooking_skill_points));

    html_string += " Level: " + cooking_level;

    if (cooking_level > 1) {
        let additional_skill = cooking_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_skill + " </span>";

    }
    html_string += "<br>";


    // FARMING
    html_string += "Farming: " + players[client_player_index].farming_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let farming_level = 1 + Math.floor(difficult_level_modifier * Math.sqrt(players[client_player_index].farming_skill_points));

    html_string += " Level: " + farming_level;

    if (farming_level > 1) {
        let additional_skill = farming_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_skill + " </span>";

    }
    html_string += "<br>";




    // MANUFACTURING
    html_string += "Manufacturing: " + players[client_player_index].manufacturing_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let manufacturing_level = 1 + Math.floor(difficult_level_modifier * Math.sqrt(players[client_player_index].manufacturing_skill_points));

    html_string += " Level: " + manufacturing_level;

    if (manufacturing_level > 1) {
        let additional_skill = manufacturing_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_skill + " </span>";

    }
    html_string += "<br>";



    // MINING
    html_string += "Mining: " + players[client_player_index].mining_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let mining_level = 1 + Math.floor(level_modifier * Math.sqrt(players[client_player_index].mining_skill_points));

    html_string += " Level: " + mining_level;

    if (mining_level > 1) {
        let additional_skill = mining_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_skill + " </span>";

    }
    html_string += "<br>";


    // REPAIRING
    html_string += "Repairing: " + players[client_player_index].repairing_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let repairing_level = 1 + Math.floor(level_modifier * Math.sqrt(players[client_player_index].repairing_skill_points));

    html_string += " Level: " + repairing_level;

    if (repairing_level > 1) {
        let additional_skill = repairing_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_skill + " </span>";

    }
    html_string += "<br>";


    // RESEARCHING
    html_string += "Researching: " + players[client_player_index].researching_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let researching_level = 1 + Math.floor(difficult_level_modifier * Math.sqrt(players[client_player_index].researching_skill_points));

    html_string += " Level: " + researching_level;

    if (researching_level > 1) {
        let additional_skill = researching_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_skill + " </span>";

    }
    html_string += "<br>";



    // SALVAGING
    html_string += "Salvaging: " + players[client_player_index].salvaging_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let salvaging_level = 1 + Math.floor(level_modifier * Math.sqrt(players[client_player_index].salvaging_skill_points));

    html_string += " Level: " + salvaging_level;

    if (salvaging_level > 1) {
        let additional_skill = salvaging_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_skill + " </span>";

    }
    html_string += "<br>";



    // SURGERY
    html_string += "Surgery: " + players[client_player_index].surgery_skill_points;
    // lets start doing some client side level stuff just to see how it shows
    let surgery_level = 1 + Math.floor(difficult_level_modifier * Math.sqrt(players[client_player_index].surgery_skill_points));

    html_string += " Level: " + surgery_level;

    if (surgery_level > 1) {
        let additional_skill = surgery_level - 1;
        html_string += " <span class='tag is-success'>+" + additional_skill + " </span>";

    }
    html_string += "<br>";



    html_string += "</div></div>";

    $('#player_stats').append(html_string);

}

function generateRelationshipDisplay() {

    if (!$("#relationships").is(":visible")) {
        return false;
    }

    $('#relationships').empty();

    for (let linker of player_relationship_linkers) {

        if (linker.race_id) {
            let race_index = races.findIndex(function (obj) { return obj && obj.id === linker.race_id; });

            let adding_string = "<div id='player_relationship_linker_" + linker.id + "'>";

            adding_string += races[race_index].name + ": " + linker.score;

            adding_string += "</div>";


            $('#relationships').append(adding_string);
        }



    }
}

function generateResearchDisplay() {

    if (!$("#research").is(":visible")) {
        return false;
    }

    $('#research').empty();

    let adding_string = "";

    adding_string += "<div class='message is-dark message-inline'><div class='message-body'>";

    for (let linker of player_research_linkers) {

        let research_object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === linker.object_type_id; });

        adding_string += "<div id='player_research_linker_" + linker.id + "'>";

        adding_string += object_types[research_object_type_index].name + ": Completed " + linker.researches_completed;
        adding_string += "/" + object_types[research_object_type_index].research_times_required;

        if (linker.researches_completed >= object_types[research_object_type_index].research_times_required) {
            adding_string += "<button class='button is-default is-small' " +
                "id='showdiscoveries_" + object_types[research_object_type_index].id + "'" +
                " object_type_id='" + object_types[research_object_type_index].id + "'>Show Discoveries</button>";
        }

        adding_string += "</div>";

    }

    adding_string += "</div></div>";

    $('#research').append(adding_string);
}

function getMonsterInfo(monster_index) {

    let coord_index = -1;
    let scope = false;
    let coord = false;

    if (monsters[monster_index].coord_id) {
        coord_index = coords.findIndex(function (obj) { return obj && obj.id === monsters[monster_index].coord_id; });
        if (coord_index !== -1) {
            scope = "galaxy";
            coord = coords[coord_index];
        }
    }

    if (monsters[monster_index].planet_coord_id) {

        coord_index = planet_coords.findIndex(function (obj) { return obj && obj.id === monsters[monster_index].planet_coord_id; });
        if (coord_index !== -1) {
            scope = "planet";
            coord = planet_coords[coord_index];
        }

    } else if (monsters[monster_index].ship_coord_id) {
        coord_index = ship_coords.findIndex(function (obj) { return obj && obj.id === monsters[monster_index].ship_coord_id; });
        if (coord_index !== -1) {
            scope = "ship";
            coord = ship_coords[coord_index];
        }
    }

    return { 'coord_index': coord_index, 'coord': coord, 'scope': scope };
}

function getNpcInfo(npc_index) {

    let coord_index = -1;
    let scope = false;
    let coord = false;

    if (npcs[npc_index].coord_id) {
        
        coord_index = coords.findIndex(function (obj) { return obj && obj.id === npcs[npc_index].coord_id; });
        if (coord_index !== -1) {

            scope = "galaxy";
            coord = coords[coord_index];
        } else {
            //console.log("Couldn't find it");
        }
    }

    if (npcs[npc_index].planet_coord_id) {

        coord_index = planet_coords.findIndex(function (obj) { return obj && obj.id === npcs[npc_index].planet_coord_id; });
        if (coord_index !== -1) {
            scope = "planet";
            coord = planet_coords[coord_index];
        }

    } else if (npcs[npc_index].ship_coord_id) {
        coord_index = ship_coords.findIndex(function (obj) { return obj && obj.id === npcs[npc_index].ship_coord_id; });
        if (coord_index !== -1) {
            scope = "ship";
            coord = ship_coords[coord_index];
        }
    }

    return { 'coord_index': coord_index, 'coord': coord, 'scope': scope };
}

/**
 * 
 * @param {number} object_index 
 */
function getObjectInfo(object_index) {

    let coord_index = -1;
    let scope = false;
    let coord = false;

    if (object_index === -1) {
        return { 'coord_index': coord_index, 'coord': coord, 'scope': scope };
    }


    if (objects[object_index].coord_id) {
        coord_index = coords.findIndex(function (obj) { return obj && obj.id === objects[object_index].coord_id; });
        if (coord_index !== -1) {
            scope = "galaxy";
            coord = coords[coord_index];
        }
    } else if (objects[object_index].planet_coord_id) {

        coord_index = planet_coords.findIndex(function (obj) { return obj && obj.id === objects[object_index].planet_coord_id; });
        if (coord_index !== -1) {
            scope = "planet";
            coord = planet_coords[coord_index];
        }

    } else if (objects[object_index].ship_coord_id) {
        coord_index = ship_coords.findIndex(function (obj) { return obj && obj.id === objects[object_index].ship_coord_id; });
        if (coord_index !== -1) {
            scope = "ship";
            coord = ship_coords[coord_index];
        }
    }

    return { 'coord_index': coord_index, 'coord': coord, 'scope': scope };
}

function getPlanetInfo(planet_index) {

    if (planet_index === -1) {
        return false;
    }

    let coord_index = -1;
    let scope = false;
    let coord = false;


    coord_index = coords.findIndex(function (obj) { return obj && obj.id === planets[planet_index].coord_id; });
    if (coord_index !== -1) {
        scope = "galaxy";
        coord = coords[coord_index];
    }


    return { 'coord_index': coord_index, 'coord': coord, 'scope': scope };
}

function getPlayerInfo(player_index) {

    let coord_index = -1;
    let scope = false;
    let coord = false;

    if (!players[player_index] || typeof player_index === 'undefined' || player_index === -1) {
        return { 'coord_index': coord_index, 'coord': coord, 'scope': scope };
    }

    if (players[player_index].ship_coord_id) {
        coord_index = ship_coords.findIndex(function (obj) { return obj && obj.id === players[player_index].ship_coord_id; });
        if (coord_index !== -1) {
            scope = "ship";
            coord = ship_coords[coord_index];
        }
    } else if (players[player_index].coord_id) {
        coord_index = coords.findIndex(function (obj) { return obj && obj.id === players[player_index].coord_id; });
        if (coord_index !== -1) {
            scope = "galaxy";
            coord = coords[coord_index];
        }
    } else if (players[player_index].planet_coord_id) {

        coord_index = planet_coords.findIndex(function (obj) { return obj && obj.id === players[player_index].planet_coord_id; });
        if (coord_index !== -1) {
            scope = "planet";
            coord = planet_coords[coord_index];
        }

    }

    return { 'coord_index': coord_index, 'coord': coord, 'scope': scope };
}


function getPlayerObjectTypeIndex(showing_player) {

    let player_object_type_index = -1;
    if (current_view === 'galaxy') {
        //console.log("Player's ship id: " + showing_player.ship_id);
        // SHIP!!
        let player_ship_index = objects.findIndex(function (obj) { return obj && obj.id === showing_player.ship_id; });
        if (player_ship_index !== -1) {
            player_object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === objects[player_ship_index].object_type_id; });
        } else {
            //console.log("%c Did not find ship in our objects. Requesting info for object id: " + showing_player.ship_id, log_warning);
            socket.emit('request_object_info', { object_id: showing_player.ship_id });
        }
    } else {
        // BODY!!
        let player_body_index = objects.findIndex(function (obj) { return obj && obj.id === showing_player.body_id; });

        if (player_body_index !== -1) {
            player_object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === objects[player_body_index].object_type_id; });


        } else {
            console.log("%c Did not find body in our objects. Requesting info for object id: " + showing_player.body_id, log_warning);
            socket.emit('request_object_info', { object_id: showing_player.body_id });
        }
    }

    return player_object_type_index;
}

function generateAirlockDisplay() {

    //console.log("In generateAirlockDisplay");

    $('#launch').empty();


    let client_ship_index = objects.findIndex(function (obj) { return obj && obj.id === players[client_player_index].ship_id; });

    if (client_ship_index === -1 && client_player_index !== -1) {
        console.log("Could not find client's ship. Requesting it");
        socket.emit('request_object_info', { 'object_id': players[client_player_index].ship_id });
    }


    let ship_coord_index = ship_coords.findIndex(function (obj) { return obj && obj.id === players[client_player_index].ship_coord_id; });
    let on_ship_index = -1;
    let on_ship_type_index = -1;
    if(ship_coord_index !== -1) {
        on_ship_index = getObjectIndex(ship_coords[ship_coord_index].ship_id);
        if(on_ship_index !== -1) {
            on_ship_type_index = getObjectTypeIndex(objects[on_ship_index].object_type_id);
        }
    }

    if (client_ship_index === -1 || ship_coord_index === -1) {
        airlock_display_needs_regeneration = true;
    } else {
        // We need to update our client_player_info
        client_player_info = getPlayerInfo(client_player_index);
    }

    let on_ship_is_dockable = false;

    if (client_ship_index !== -1 && ship_coord_index !== -1 && ship_coords[ship_coord_index].ship_id === objects[client_ship_index].id) {
        //console.log("We are on our ship");
        $('#launch').append('<button class="button is-success" id="viewchange" newview="galaxy"><i class="fad fa-stars"></i> Back To Galaxy</button>');

        generateFuelDisplay();


    } else if (current_view === "ship") {

        $('#launch').append('<button class="button is-success" id="viewchange" newview="galaxy"><i class="fad fa-rocket"></i> Launch With Current Ship</button>');
    } else {
        console.log("%c Didn't draw back to galaxy OR launch buttons");
    }

    if(on_ship_type_index !== -1 && object_types[on_ship_type_index].is_dockable) {
        on_ship_is_dockable = true;
    }

    let docked_ships = [];

    // We're on a ship that is dockable - a few more options
    if (on_ship_is_dockable) {
        // show the docked ships the player has here
        docked_ships = objects.filter(obj => obj.player_id === client_player_id && obj.docked_at_object_id === client_player_info.coord.ship_id);

        let has_pod = false;

        if (docked_ships.length > 0) {

            $('#launch').append("<br>");


            docked_ships.forEach(function (ship) {


                let html_string = showDockedShip(ship);


                $('#launch').append(html_string);

                if (ship.object_type_id === 114) {
                    has_pod = true;
                }
            });
        }

        // we should only let the player have one pod at a spaceport
        // TODO check this on the server side David!
        if (!has_pod) {
            //$('#launch').append('<button class="button is-default" id="buy_pod" object_type_id="114">Buy A Pod</button>');
        }

        // If we own the station, we can switch to that too
        if (ship_coord_index !== -1) {
            let on_ship_index = objects.findIndex(function (obj) { return obj && obj.id === ship_coords[ship_coord_index].ship_id; });

            if (on_ship_index !== -1) {
                if (objects[on_ship_index].player_id === client_player_id) {

                    //console.log("Player owns the ship they are docked at id: " + objects[on_ship_index].id);

                    // The station is already our current ship
                    if (objects[on_ship_index].id === players[client_player_index].ship_id) {
                        $('#launch').append("<span class='tag is-success'>Station Is Current Ship</span>");
                    }
                    // we can switch to the station
                    else {

                        if (debug_mode) {
                            $('#launch').append("Ship ID: " + objects[on_ship_index].id);
                        }

                        if (objects[on_ship_index].name) {
                            $('#launch').append(" " + objects[on_ship_index].name + " ");
                        }

                        $('#launch').append("<button id='switchship_" + objects[on_ship_index].id + "' object_id='" +
                            objects[on_ship_index].id + "' class='button is-warning is-small'>Switch To Station</button>");
                    }


                }
            }


        } else {
            console.log("Ship coord index is -1");
        }
    }


    if (ship_coord_index !== -1 && ship_coords[ship_coord_index].object_type_id === 266) {


        let show_emergency_pod = true;

        if(on_ship_is_dockable && docked_ships.length > 0) {
            show_emergency_pod = false;
        }

        // Lets only show the Use Emergency Pod button if the player doesn't have another ship they can undock with
        //console.log("Player is on an airlock");
        if(show_emergency_pod) {
            console.log("Showing emergency pod button");
            $('#launch').append('<button class="button is-danger" id="buy_pod" object_type_id="114">Use Emergency Pod</button>');
        }
        

    } else {
        //console.log("Player ship coord id: " + players[client_player_index].ship_coord_id);
    }




}

function generateSpaceportDisplay() {


    // Don't generate this if we are in the galaxy view or ship view
    if (current_view === 'galaxy' || current_view === 'ship') {
        return false;
    }

    client_player_info = getPlayerInfo(client_player_index);

    if (!client_player_info.coord) {
        spaceport_display_needs_regeneration = true;
        return false;
    }

    if (client_player_info.coord.floor_type_id === 11) {

        let html_string = "";


        //console.log("Emptied launch in generateSpaceportDisplay");
        $('#launch').empty();

        html_string += "<div class='white-text'>";
        html_string += "<button class='button is-success' id='viewchange' newview='galaxy'>" +
            "<i class='fad fa-rocket'></i>&nbsp; Launch From Planet With Current Ship</button><br>";





        // show the docked ships the player has here
        let docked_ships = objects.filter(obj => obj.player_id === client_player_id && obj.docked_at_planet_id === client_player_info.coord.planet_id);

        let has_pod = false;

        if (docked_ships.length > 0) {
            //console.log("Player has at least one ship docked at this planet");


            docked_ships.forEach(function (ship) {

                html_string += showDockedShip(ship);



                if (ship.object_type_id === 114) {
                    has_pod = true;
                }
            });
        }

        // we should only let the player have one pod at a spaceport
        if (!has_pod) {
            html_string += "<button class='button is-default' id='buy_pod' object_type_id='114'>Buy A Pod</button>";
        }

        html_string += "</div>";

        $('#launch').append(html_string);
    } else {
        //console.log("Emptied launch in generateSpaceportDisplay");
        $('#launch').empty();
    }
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

function isFalse(the_value) {

    if(typeof the_value === "undefined" || the_value === 0 || the_value === "0" ||
        the_value === false || the_value === null || the_value === "null" || 
        (the_value.constructor === Object && Object.keys(the_value).length === 0) ) {
        return true;
    }

    return false;
}


function notFalse(the_value) {

    if(typeof the_value === "undefined" || the_value === 0 || the_value === "0" ||
        the_value === false || the_value === null || the_value === "null" || the_value === "") {
        return false;
    }

    return true;
}

function playBackgroundMusic(type, type_id) {

    if(!play_sounds) {
        return false;
    }

    console.log("In playBackgroundMusic type: " + type + " type_id: " + type_id);

    let scene_game = game.scene.getScene('sceneGame');

    if(type === 'planet_type' && type_id === 30) {

        console.log("Going to play corporation planet background music");

        // Load up the file if we don't have it already
        // Phaser 3.23+ required
        let rand_num = getRandomIntInclusive(1,2);

        if(rand_num === 1) {
            if(!sound_corporation_1) {
                scene_game.load.on('filecomplete', processAudioFile, this);
                scene_game.load.audio('corporation_1', ['https://space.alphacoders.com/corporation_1.mp3']);
                scene_game.load.start();
            } else {
    
                //sound_corporation_1.on('ended', function() { console.log("In sound corporation 1 ended"); playBackgroundMusic(type, type_id); });
                sound_corporation_1.play();
            }
                
        } else {
            if(!sound_corporation_2) {
                scene_game.load.on('filecomplete', processAudioFile, this);
                scene_game.load.audio('corporation_2', ['https://space.alphacoders.com/corporation_2.mp3']);
                scene_game.load.start();
            } else {
    
                //sound_corporation_2.on('ended', function() { console.log("In sound corporation 2 ended"); playBackgroundMusic(type, type_id); });
                sound_corporation_2.play();
            }
                
        }


        
    
        

    } else if(type === 'galaxy') {
        if(sound_corporation_1) {
            sound_corporation_1.stop();
        }
    }

}


function playDamageSound(damage_types) {

    if(!play_sounds) {
        return false;
    }

    let scene_game = game.scene.getScene('sceneGame');

    for(let i = 0; i < damage_types.length; i++) {


        if(damage_types[i] === 'electric') {
            if(sound_electric) {
                sound_electric.play();
            } else {
                scene_game.load.on('filecomplete', processAudioFile, this);
                scene_game.load.audio('electric', ['https://space.alphacoders.com/electricity.mp3']);
                scene_game.load.start();
            }
        } else if(damage_types[i] === 'hacking') {
            if(sound_hacking) {
                sound_hacking.play();
            } else {
                scene_game.load.on('filecomplete', processAudioFile, this);
                scene_game.load.audio('hacking', ['https://space.alphacoders.com/hacking.mp3']);
                scene_game.load.start();
            }
        } else if(damage_types[i] === 'healing') {
            if(sound_healing) {
                sound_healing.play();
            } else {
                scene_game.load.on('filecomplete', processAudioFile, this);
                scene_game.load.audio('healing', ['https://space.alphacoders.com/healing.wav']);
                scene_game.load.start();
            }
        } else if(damage_types[i] === 'laser') {

            if(sound_laser) {
                sound_laser.play();
            } else {
                scene_game.load.on('filecomplete', processAudioFile, this);
                scene_game.load.audio('laser', ['https://space.alphacoders.com/laser.wav']);
                scene_game.load.start();
            }
        } else if(damage_types[i] === 'melee') {
            if(sound_melee) {
                sound_melee.play();
            } else {
                scene_game.load.on('filecomplete', processAudioFile, this);
                scene_game.load.audio('melee', ['https://space.alphacoders.com/melee.mp3']);
                scene_game.load.start();
            }
        } else if(damage_types[i] === 'piercing') {
            if(sound_piercing) {
                sound_piercing.play();
            } else {
                scene_game.load.on('filecomplete', processAudioFile, this);
                scene_game.load.audio('piercing', ['https://space.alphacoders.com/piercing.mp3']);
                scene_game.load.start();
            }
        } else {
           
            if(sound_melee) {
                sound_melee.play();
            } else {
                scene_game.load.on('filecomplete', processAudioFile, this);
                scene_game.load.audio('melee', ['https://space.alphacoders.com/melee.mp3']);
                scene_game.load.start();
            }
            
        }
    }

}

function pointerDownDesktop(pointer, pointerTileX, pointerTileY) {


    if (client_player_index === -1) {
        return false;
    }

    if (pointer.leftButtonDown()) {


        $('#click_menu').empty();
        $('#click_menu').hide();

        // NEW SYSTEM
        $('#coord_data').empty();
        $('#coord_data').attr('class', 'message is-info');
        $('#coord_data').attr('style', 'display:inline-block; margin-top:10px; padding:10px;');



        let coord_index = -1;
        let temp_coord = false;
        let coord_tile_x = false;
        let coord_tile_y = false;

        let player_info = getPlayerInfo(client_player_index);

        if (current_view === 'ship') {
            coord_index = ship_coords.findIndex(function (obj) { return obj && obj.level === player_info.coord.level && obj.tile_x === pointerTileX && obj.tile_y === pointerTileY; });
            if (coord_index !== -1) {

                if (admin_drawing_floor_type_id) {
                    socket.emit('admin_drawing_floor_data', { 'ship_coord_id': ship_coords[coord_index].id, 'floor_type_id': admin_drawing_floor_type_id });
                    return false;
                }

                temp_coord = ship_coords[coord_index];
                coord_tile_x = ship_coords[coord_index].tile_x;
                coord_tile_y = ship_coords[coord_index].tile_y;
            }

        } else if (current_view === 'galaxy') {
            coord_index = coords.findIndex(function (obj) { return obj && obj.tile_x === pointerTileX && obj.tile_y === pointerTileY; });
            if (coord_index !== -1) {

                if (admin_drawing_floor_type_id) {
                    socket.emit('admin_drawing_floor_data', { 'coord_id': coords[coord_index].id, 'floor_type_id': admin_drawing_floor_type_id });
                    return false;
                }
                temp_coord = coords[coord_index];
                coord_tile_x = coords[coord_index].tile_x;
                coord_tile_y = coords[coord_index].tile_y;
            }


        } else if (current_view === 'planet') {




            coord_index = planet_coords.findIndex(function (obj) {
                return obj && obj.tile_x === pointerTileX &&
                    obj.tile_y === pointerTileY && obj.level === player_info.coord.level;
            });

            if (coord_index !== -1) {

                if (admin_drawing_floor_type_id) {
                    socket.emit('admin_drawing_floor_data', { 'planet_coord_id': planet_coords[coord_index].id, 'floor_type_id': admin_drawing_floor_type_id });
                    return false;
                }
                temp_coord = planet_coords[coord_index];
                coord_tile_x = planet_coords[coord_index].tile_x;
                coord_tile_y = planet_coords[coord_index].tile_y;

            }
        }

        if (temp_coord) {




            $('#coord_data').append("<strong>" + temp_coord.tile_x + "," + temp_coord.tile_y + "</strong>");
            if (debug_mode) {
                $("#coord_data").append(" ID: " + temp_coord.id);
            }

            $('#coord_data').append("<br>");


            if (temp_coord.planet_id && current_view === 'galaxy') {

                displayClickPlanet(temp_coord.planet_id);


            } else if (temp_coord.belongs_to_planet_id) {

                displayClickPlanet(temp_coord.belongs_to_planet_id);


                if (debug_mode) {
                    $('#coord_data').append("Belongs to planet id: " + temp_coord.belongs_to_planet_id + "<br>");
                }
            }

            if (temp_coord.monster_id) {


                let monster_index = monsters.findIndex(function (obj) { return obj && obj.id === temp_coord.monster_id; });
                if (monster_index !== -1) {

                    let monster_type_index = monster_types.findIndex(function (obj) { return obj && obj.id === monsters[monster_index].monster_type_id; });

                    if (monster_type_index !== -1) {

                        $('#coord_data').append("Monster " + monster_types[monster_type_index].name + "<br>");
                        if (debug_mode) {
                            $('#coord_data').append("&nbsp;&nbsp;ID: " + monsters[monster_index].id + "<br>");
                            $('#coord_data').append("&nbsp;&nbsp;Monster Type ID: " + monster_types[monster_type_index].id + "<br>");
                            if (monsters[monster_index].spawned_event_id) {
                                $('#coord_data').append("&nbsp;&nbsp;Spawned Event ID:" + monsters[monster_index].spawned_event_id + "<br>");
                            }
                        }


                    }
                } else if (debug_mode) {
                    $('#coord_data').append("Coord has monster id " + temp_coord.monster_id + " but we don't have this monster<br>");
                }
            } else if (temp_coord.belongs_to_monster_id) {
                if (debug_mode) {
                    $('#coord_data').append("Belongs to monster id: " + temp_coord.belongs_to_monster_id + "<br>");
                }
            }


            if (temp_coord.object_id) {

                displayClickObject(temp_coord.object_id);


            } else if (temp_coord.belongs_to_object_id) {

                displayClickObject(temp_coord.belongs_to_object_id);
                if (debug_mode) {
                    $('#coord_data').append("Belongs to object id: " + temp_coord.belongs_to_object_id);

                }
            }
            else if (temp_coord.object_type_id) {

                let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === temp_coord.object_type_id; });
                if (object_type_index !== -1) {

                    if (temp_coord.object_amount > 1) {
                        $('#coord_data').append(temp_coord.object_amount + " ");
                    }

                    $('#coord_data').append(object_types[object_type_index].name);

                    if (debug_mode) {
                        $('#coord_data').append("Object Type ID (No object): " + temp_coord.object_type_id);
                    }

                    $('#coord_data').append("<br>");
                }


            }

            if (temp_coord.player_id) {

                let other_player_index = players.findIndex(function (obj) { return obj && obj.id === temp_coord.player_id; });

                if (other_player_index !== -1) {
                    $('#coord_data').append("Player " + players[other_player_index].name);

                    if (debug_mode) {
                        $('#coord_data').append(" ID: " + players[other_player_index].id);
                    }

                    $('#coord_data').append("<br>");

                    if (current_view === "galaxy") {
                        let other_ship_index = objects.findIndex(function (obj) {
                            return obj &&
                                obj.id === players[other_player_index].ship_id;
                        });
                        if (other_ship_index !== -1) {
                            let other_ship_type_index = object_types.findIndex(function (obj) {
                                return obj &&
                                    obj.id === objects[other_ship_index].object_type_id;
                            });
                            if (other_ship_type_index !== -1) {
                                $('#coord_data').append("Ship: " + object_types[other_ship_type_index].name);

                                if (debug_mode) {
                                    $('#coord_data').append(" Ship ID: " + objects[other_ship_index].id);
                                }

                                $('#coord_data').append("<br>");
                            }

                        } else {
                            socket.emit('request_object_info', { 'object_id': players[other_player_index].ship_id });
                        }
                    }

                } else {
                    console.log("Don't have player info. Requesting it");
                    socket.emit('request_player_info', { 'player_id': temp_coord.player_id });
                }

            }


            if (temp_coord.npc_id) {

                displayClickNpc(temp_coord.npc_id);
               

            }

            if(temp_coord.floor_type_id === 44) {
                $('#coord_data').append("This is a Spaceport Merchant Spot!<br>");
            }

            if (temp_coord.floor_type_id && debug_mode) {
                let floor_type_index = floor_types.findIndex(function (obj) { return obj && obj.id === temp_coord.floor_type_id; });
                if (floor_type_index !== -1) {
                    $('#coord_data').append("Floor: " + floor_types[floor_type_index].name + "<br>");
                }
            }

            if (temp_coord.spawns_monster_type_id) {
                $('#coord_data').append("Spawns monster type id: " + temp_coord.spawns_monster_type_id);
            }

            if (temp_coord.area_id) {
                let area_index = areas.findIndex(function (obj) { return obj && obj.id === temp_coord.area_id; });

                if (area_index !== -1) {
                    $('#coord_data').append("Area: " + areas[area_index].name + "<br>");
                } else {
                    $('#coord_data').append("Area ID: " + temp_coord.area_id + "<br>");
                    socket.emit('request_area_data', { 'area_id': temp_coord.area_id });
                }
            }

            if (temp_coord.structure_id && debug_mode) {
                $('#coord_data').append("Structure ID: " + temp_coord.structure_id);
            }

            if(temp_coord.is_engine_hardpoint) {
                $('#coord_data').append("Engine Hardpoint");
            }

            if(temp_coord.is_weapon_hardpoint) {
                $('#coord_data').append("Weapon Hardpoint");
            }

        } else {

            $('#coord_data').append("Unable to find coord. Current view is: " + current_view);
        }



    } else if (pointer.rightButtonDown()) {

        showClickMenu(pointer);

    }
}

function printAssemblyList(assembling_object = false, coord = false) {


    let player_can_build_something = false;
    let player_inventory_items = inventory_items.filter(inventory_item => inventory_item.player_id === player_id &&
        inventory_item.body_id === players[client_player_index].body_id);




    /******************************************* BASIC ASSEMBLIES !!!!!!!!!!!!!!! ***********************************************/
    // generate the default can_assemble_list
    // basic assemblies. Is assembled, no research required, and doesn't need to be assembled in another object type
    if (assembling_object === false) {

        if (!$("#can_assemble_list").is(":visible")) {
            return false;
        }

        $('#can_assemble_list').empty();
        let html_string = "";

        html_string += "<div class='message is-info'><div class='message-body'>";

        if(players[client_player_index].exp < 50) {
            html_string += "<div class='notification is-info'>New Player Tip: You will need 20 Territe to build a Manufacturer. You can build more things in a manufacturer</div>";
        }


        let could_assemble_something = false;

        object_types.forEach(function (object_type) {


            // Object type is assembled
            if (object_type.is_assembled && !object_type.required_research_object_type_id) {

                // See if there is an assembled in linker
                let assembled_in_linker_index = assembled_in_linkers.findIndex(function (obj) { return obj && obj.object_type_id === object_type.id; });

                if (assembled_in_linker_index === -1) {
                    // Check Assembly Linkers
                    let object_assembly_linkers = object_type_assembly_linkers.filter(linker => linker.required_for_object_type_id === object_type.id);

                    let requirements_met = true;

                    object_assembly_linkers.forEach(function (assembly_linker) {
                        let met_this_requirement = false;
                        player_inventory_items.forEach(function (inventory_item) {
                            if (inventory_item.object_type_id === assembly_linker.object_type_id && inventory_item.amount >= assembly_linker.amount) {
                                met_this_requirement = true;
                            }
                        });

                        if (!met_this_requirement) {
                            requirements_met = false;
                        }
                    });

                    if (requirements_met) {
                        html_string += generateAssemblyListItem(object_type, object_assembly_linkers);

                        if (!could_assemble_something) {
                            could_assemble_something = true;
                        }
                    }
                }



            }
        });


        floor_types.forEach(function (floor_type) {


            // Object type is assembled
            if (floor_type.is_assembled) {


                // See if there is an assembled in linker
                let assembled_in_linker_index = assembled_in_linkers.findIndex(function (obj) { return obj && obj.floor_type_id === floor_type.id; });

                if (assembled_in_linker_index === -1) {
                    // Check Assembly Linkers
                    let floor_assembly_linkers = floor_type_assembly_linkers.filter(linker => linker.required_for_floor_type_id === floor_type.id);

                    let requirements_met = true;

                    floor_assembly_linkers.forEach(function (assembly_linker) {
                        let met_this_requirement = false;
                        player_inventory_items.forEach(function (inventory_item) {
                            if (inventory_item.object_type_id === assembly_linker.object_type_id && inventory_item.amount >= assembly_linker.amount) {
                                met_this_requirement = true;
                            }
                        });

                        if (!met_this_requirement) {
                            requirements_met = false;
                        }
                    });

                    if (requirements_met) {
                        html_string += generateAssemblyListItemFloor(floor_type, floor_assembly_linkers);

                        if (!could_assemble_something) {
                            could_assemble_something = true;
                        }
                    }
                }



            }
        });


        if (!could_assemble_something) {
            html_string += "<a target='_blank' href='/site/tutorial'>Check Out The Tutorial For Beginner Info</a>";
        }

        html_string += "</div></div>";

        $('#can_assemble_list').append(html_string);





    }

    /*********************************** ASSEMBLIES HAPPENING IN AN OBJECT ***********************************************************************/

    else if (assembling_object.is_active) {

        let html_string = "";

        // try and get the thing that is being assembled
        let assembly_index = active_assemblies.findIndex(function (obj) { return obj && obj.assembler_object_id === assembling_object.id; });

        if (assembly_index !== -1) {
            if (assembly_index !== -1) {
                let being_assembled_object_type_index = object_types.findIndex(function (obj) {
                    return obj && obj.id === active_assemblies[assembly_index].being_assembled_object_type_id
                });

                html_string += " Assembling " + object_types[being_assembled_object_type_index].name + " ";
                html_string += " Working On Tick: " + active_assemblies[assembly_index].current_tick_count + "/";

                // get the assembled_in_linker
                let assembled_in_linker_index = assembled_in_linkers.findIndex(function (obj) {
                    return obj && obj.object_type_id === object_types[being_assembled_object_type_index].id &&
                        obj.assembled_in_object_type_id === assembling_object.object_type_id;
                });

                if (assembled_in_linker_index !== -1) {
                    html_string += assembled_in_linkers[assembled_in_linker_index].tick_count;
                }

                //html_string += object_types[being_assembled_object_type_index].assembly_time;

                html_string += " Completed " + active_assemblies[assembly_index].amount_completed + "/";
                html_string += active_assemblies[assembly_index].total_amount;
            }
        } else {
            html_string += "Already Assembling Something";
        }


        $('#click_menu').append(html_string);

    }
    else {



        let html_string = "";



        if(assembling_object.player_id !== client_player_id && 
            (assembling_object.object_type_id === 116 || assembling_object.object_type_id === 435 || assembling_object.object_type_id === 436) ) {

            html_string += "<div class='message is-danger'><div class='message-body'>This is not your shipyard. If you build a ship in it, it will belong to the player that owns the shipyard</div></div>";
        }



        html_string += "<div class='message is-info'><div class='message-header'>Things You Can Assemble</div>";

        object_types.forEach(function (object_type) {

            // See if there is a matching assembled_in_linker for this object type
            let assembled_in_linker_index = assembled_in_linkers.findIndex(function (obj) {
                return obj && obj.object_type_id === object_type.id &&
                    obj.assembled_in_object_type_id === assembling_object.object_type_id;
            });

            if (assembled_in_linker_index === -1) {
                return false;
            }

            if(!object_type.is_assembled) {
                return false;
            }


            // Check Assembly Linkers
            let object_assembly_linkers = object_type_assembly_linkers.filter(linker => linker.required_for_object_type_id === object_type.id);

            let requirements_met = true;
            let research_requirement_met = true;

            object_assembly_linkers.forEach(function (assembly_linker) {
                let met_this_requirement = false;
                player_inventory_items.forEach(function (inventory_item) {
                    if (inventory_item.object_type_id === assembly_linker.object_type_id && inventory_item.amount >= assembly_linker.amount) {
                        met_this_requirement = true;
                    }
                });

                if (!met_this_requirement) {
                    requirements_met = false;
                }
            });


            // Check Research Linkers
            if (object_type.required_research_object_type_id) {
                let required_object_index = object_types.findIndex(function (obj) { return obj && obj.id === object_type.required_research_object_type_id; });

                // see if the player has this researched
                let player_research_linker_index = player_research_linkers.findIndex(function (obj) {
                    return obj && obj.object_type_id === object_type.required_research_object_type_id;
                });

                if (player_research_linker_index !== -1) {
                    if (player_research_linkers[player_research_linker_index].researches_completed >= object_types[required_object_index].research_times_required) {

                    } else {
                        research_requirement_met = false;
                    }
                } else {
                    research_requirement_met = false;
                }
            }


            if (requirements_met && research_requirement_met) {
                html_string += generateAssemblyListItem(object_type, object_assembly_linkers, assembling_object);
            }


        });


        floor_types.forEach(function (floor_type) {

            
            // See if there is a matching assembled_in_linker for this object type
            let assembled_in_linker_index = assembled_in_linkers.findIndex(function (obj) {
                return obj && obj.floor_type_id === floor_type.id &&
                    obj.assembled_in_object_type_id === assembling_object.object_type_id;
            });

            if (assembled_in_linker_index === -1) {
                return false;
            }

            if(!floor_type.is_assembled) {
                return false;
            }



            console.log("Floor type id: " + floor_type.id + " " + floor_type.name + "is assembled here!");


            // Check Assembly Linkers
            let floor_assembly_linkers = floor_type_assembly_linkers.filter(linker => linker.required_for_floor_type_id === floor_type.id);

            let requirements_met = true;

            floor_assembly_linkers.forEach(function (assembly_linker) {
                let met_this_requirement = false;
                player_inventory_items.forEach(function (inventory_item) {
                    if (inventory_item.object_type_id === assembly_linker.object_type_id && inventory_item.amount >= assembly_linker.amount) {
                        met_this_requirement = true;
                    }
                });

                if (!met_this_requirement) {
                    requirements_met = false;
                    console.log("Failed to meet requirements");
                }
            });

            if (requirements_met) {
                console.log("generating floor display");
                html_string += generateAssemblyListItemFloor(floor_type, floor_assembly_linkers, false, assembling_object);

            }
            



            
        });



        html_string += "</div>";

        $('#click_menu').append(html_string);



        //console.log("Trying to show things we could assemble");

        html_string = "";
        html_string += "<div class='message is-dark'><div class='message-header'>Things You Can't Assemble Yet</div>";





        // Ternary in my code!!!!!
        // BE VERY careful with sorting like this - it CHANGES THE ORDER OF THE ORIGINAL ARRAY unless we do [...array]
        let sorted_object_types = [...object_types].sort((a, b) => (a.complexity > b.complexity) ? 1 : -1);

        // Lets mess with showing what the player COULD build if they had enough stuff
        sorted_object_types.forEach(function (object_type) {

            if (!object_type.is_assembled) {
                return false;
            }

            let assembled_in_linker_index = assembled_in_linkers.findIndex(function (obj) {
                return obj && obj.object_type_id === object_type.id &&
                    obj.assembled_in_object_type_id === assembling_object.object_type_id;
            });

            if (assembled_in_linker_index === -1) {
                return false;
            }


            // Check Assembly Linkers
            let object_assembly_linkers = object_type_assembly_linkers.filter(linker => linker.required_for_object_type_id === object_type.id);

            let requirements_met = true;
            let research_requirement_met = true;

            object_assembly_linkers.forEach(function (assembly_linker) {
                let met_this_requirement = false;
                player_inventory_items.forEach(function (inventory_item) {
                    if (inventory_item.object_type_id === assembly_linker.object_type_id && inventory_item.amount >= assembly_linker.amount) {
                        met_this_requirement = true;
                    }
                });

                if (!met_this_requirement) {
                    requirements_met = false;
                }
            });


            let failure_reason = false;
            // Check Research Linkers
            if (object_type.required_research_object_type_id) {
                let required_object_index = object_types.findIndex(function (obj) { return obj && obj.id === object_type.required_research_object_type_id; });

                // see if the player has this researched
                let player_research_linker_index = player_research_linkers.findIndex(function (obj) {
                    return obj && obj.object_type_id === object_type.required_research_object_type_id;
                });

                if (player_research_linker_index !== -1) {
                    if (player_research_linkers[player_research_linker_index].researches_completed >= object_types[required_object_index].research_times_required) {

                    } else {
                        research_requirement_met = false;
                        failure_reason = "Requires more " + object_types[required_object_index].name + " Research";
                    }
                } else {
                    research_requirement_met = false;
                    failure_reason = "Requires " + object_types[required_object_index].name + " Research";
                }
            }

            if (!research_requirement_met) {
                html_string += generateAssemblyListItem(object_type, object_assembly_linkers, assembling_object, false, failure_reason);
            } else if (!requirements_met) {
                html_string += generateAssemblyListItem(object_type, object_assembly_linkers, assembling_object, false);
            }




        });



        html_string += "</div>";

        $('#click_menu').append(html_string);

    }


}

function printDiscovery(object_type, assembly_linkers) {
    let html_string = "";

    html_string += "<div class='box has-text-centered' style='display: inline-block;'>";

    html_string += object_type.name + "<br>";
    html_string += "<img src='https://space.alphacoders.com/images/" + urlName(object_type.name) + ".png'><br>";

    // Show what is required to assemble it
    assembly_linkers.forEach(function (assembly_linker) {

        let required_object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === assembly_linker.object_type_id; });

        html_string += " " + assembly_linker.amount + " ";
        if (required_object_type_index !== -1) {
            html_string += object_types[required_object_type_index].name + " <img style='width:16px; height:16px;' src='https://space.alphacoders.com/images/" +
                urlName(object_types[required_object_type_index].name) + ".png'>";
        } else {
            html_string += "" + assembly_linker.object_type_id;
        }

        html_string += "<br>";


    });

    // and show what it is assembled in
    if (object_type.assembly_object_type_id) {
        let assembled_in_object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === object_type.assembly_object_type_id; });
        html_string += "In: " + object_types[assembled_in_object_type_index].name + "<br>";
    }

    html_string += "</div>";

    return html_string;
}


function generateAddictionDisplay() {

    if (client_player_index === -1) {
        return false;
    }

    //console.log("Generating addiction display");
    $('#addiction').empty();

    // If there are no longer any active addiction linkers, we can remove the div
    let active_count = 0;
    for (let addiction_linker of addiction_linkers) {
        if (addiction_linker && addiction_linker.addicted_body_id === players[client_player_index].body_id) {
            active_count++;
        }
    }

    if (active_count === 0) {
        return;
    }


    let body_index = objects.findIndex(function (obj) { return obj && obj.id === players[client_player_index].body_id; });

    if(body_index === -1) {
        // We just don't have this information yet
        return false;
    }

    let body_type_index = object_types.findIndex(function (obj) { return obj && obj.id === objects[body_index].object_type_id; });


    let adding_string = "";
    adding_string += "<div class='message is-danger message-inline'><div class='message-body'><i class='fas fa-skull-crossbones'></i>";

    // TODO turn this into a normal for with a simple if addiction_linkers[i] check
    let active_addiction_linkers = addiction_linkers.filter(n => n);
    for (let addiction_linker of active_addiction_linkers) {

        //console.log("Processing addiction linker:");
        //console.log(addiction_linker);
        if (addiction_linker && addiction_linker.addicted_body_id === players[client_player_index].body_id) {

            let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === addiction_linker.addicted_to_object_type_id; });
            let race_eating_linker_index = race_eating_linkers.findIndex(function (obj) {
                return obj && obj.race_id === object_types[body_type_index].race_id &&
                    obj.object_type_id === addiction_linker.addicted_to_object_type_id;
            });

            if(race_eating_linker_index !== -1) {
                // Poison! We're going to change the text a little
                if(object_types[object_type_index].id === 365) {
                    adding_string += "Poisoned"; 
                } else {
                    adding_string += "Addicted to " + object_types[object_type_index].name ;
                }

                adding_string += " Tick " + addiction_linker.tick_count + "/" +
                    race_eating_linkers[race_eating_linker_index].addiction_tick_count;


                // See if there's an eating linker that is stopping negative effects for now
                let eating_linker_index = eating_linkers.findIndex(function (obj) {
                    return obj && obj.body_id === players[client_player_index].body_id &&
                        obj.eating_object_type_id === addiction_linker.addicted_to_object_type_id;
                });

                // The player isn't still consuming this item - addiction has set in
                if (eating_linker_index === -1) {
                    if (race_eating_linkers[race_eating_linker_index].hp) {
                        let negative_hp_amount = race_eating_linkers[race_eating_linker_index].hp * addiction_linker.addiction_level;
                        adding_string += " -" + negative_hp_amount + " HP ";
                    }

                    if (race_eating_linkers[race_eating_linker_index].attack) {
                        let negative_attack_amount = race_eating_linkers[race_eating_linker_index].attack * addiction_linker.addiction_level;
                        adding_string += " -" + negative_attack_amount + " Attack ";
                    }

                    if (race_eating_linkers[race_eating_linker_index].defense) {
                        let negative_defense_amount = race_eating_linkers[race_eating_linker_index].defense * addiction_linker.addiction_level;
                        adding_string += " -" + negative_defense_amount + " Defense ";
                    }
                }


            adding_string += "<br>";
            } else {
                console.log("%c Warning: Race doesn't have an eating linker for this!", log_warning);
            }







        } else {
            console.log("Not our body");
        }
    }


    adding_string += "</div></div>";
    $('#addiction').append(adding_string);


}


// If we are sending in a specific object index, only show for that one AI
function generateAiManagementDisplay(object_index = -1) {

    if (!$("#ai_management").is(":visible")) {
        return false;
    }

    if (client_player_index === -1) {
        return false;
    }

    $('#ai_management').empty();

    let html_string = "";
    html_string += "<div class='message is-info message-inline'><div class='message-body'>";

    for (let j = 0; j < objects.length; j++) {


        if (objects[j] &&
            ((object_index === -1 && objects[j].object_type_id === 72 && objects[j].player_id === client_player_id) ||
                (object_index !== -1 && j === object_index)
            )
        ) {

            if (objects[j].name) {
                html_string += "<strong>" + objects[j].name + "</strong>";
            } else {
                html_string += "<strong>" + objects[j].id + "</strong>";
            }

            html_string += "<button class='button is-default is-small' " +
                "id='showobject_" + objects[j].id + "'" +
                " object_id='" + objects[j].id + "'>Show</button>";
            html_string += ":<br>";
            html_string += "<div id='management_object_" + objects[j].id + "'></div>";



        }
    }


    html_string += "</div></div>";


    $('#click_menu').empty();
    $('#click_menu').hide();

    $('#ai_management').empty();
    $('#ai_management').append(html_string);


}

function generateAssemblyListItem(object_type, object_assembly_linkers, assembling_object = false, can_assemble = true, failure_reason = false) {


    let manufacturing_level = 1 + Math.floor(difficult_level_modifier * Math.sqrt(players[client_player_index].manufacturing_skill_points));

    let html_string = "";
    html_string += "<table class='assemble'><tr><td><div class='center'><strong>" + object_type.name + "</strong>";

    if(object_type.complexity > manufacturing_level + 10) {
        html_string += " <span class='tag is-danger' style='padding:2px; line-height:1; height: 1.4em;'>Too Complex</span>";
    } else if(object_type.complexity > manufacturing_level) {
        html_string += " <span class='tag is-warning' style='padding:2px; line-height:1; height: 1.4em;'>Hard</span>";
    } else {
        html_string += " <span class='tag is-success' style='padding:2px; line-height:1; height: 1.4em;'>Easy</span>";
    }
    
    html_string += "<br>";
    html_string += "<img src='https://space.alphacoders.com/images/" + urlName(object_type.name) + ".png'>";

    // Show what is required to assemble it

    if (failure_reason !== false) {
        html_string += failure_reason;
    } else {
        object_assembly_linkers.forEach(function (assembly_linker) {

            let required_object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === assembly_linker.object_type_id; });

            html_string += "<br> " + assembly_linker.amount + " ";
            if (required_object_type_index !== -1) {
                html_string += object_types[required_object_type_index].name + " <a target='_blank' href='https://space.alphacoders.com/object-type/view/" + 
                object_types[required_object_type_index].id + "'><img style='width:16px; height:16px;' src='https://space.alphacoders.com/images/" +
                    urlName(object_types[required_object_type_index].name) + ".png'></a>";

                    

                
            } else {
                html_string += "" + assembly_linker.object_type_id;
            }


        });
    }



    if (can_assemble) {

        html_string += "<div class='center'>Assemble: ";

        if (assembling_object === false || ( assembling_object.object_type_id !== 116 && assembling_object.object_type_id !== 435 && assembling_object.object_type_id !== 436 )) {
            html_string += " <button id='assemble_" + object_type.id + "_all' class='button is-default is-small' ";
            html_string += " object_type_id='" + object_type.id + "' ";
            if(assembling_object !== false) {
                html_string += " being_assembled_in_object_id='" + assembling_object.id + "'";
            }
            html_string += "amount='all'>All</button>";

            html_string += " <button id='assemble_" + object_type.id + "_10' class='button is-default is-small' ";
            html_string += " object_type_id='" + object_type.id + "' ";

            if(assembling_object !== false) {
                html_string += " being_assembled_in_object_id='" + assembling_object.id + "'";
            }

            html_string += " amount='10'>10</button>";

            html_string += " <button id='assemble_" + object_type.id + "_1' class='button is-default is-small' ";
            html_string += " object_type_id='" + object_type.id + "' ";

            if(assembling_object !== false) {
                html_string += " being_assembled_in_object_id='" + assembling_object.id + "'";
            }

            html_string += " amount='1'>1</button>";

        } else {
            html_string += " <button id='assemble_" + object_type.id + "_1' class='button is-default is-small' ";
            html_string += " object_type_id='" + object_type.id + "' ";

            if(assembling_object !== false) {
                html_string += " being_assembled_in_object_id='" + assembling_object.id + "'";
            }

            html_string += " amount='1'>Assemble</button>";
        }

        html_string += "</div>";


    }



    html_string += "</td></tr></table>";

    return html_string;
}

function generateAssemblyListItemFloor(floor_type, floor_assembly_linkers, coord = false, assembling_object = false) {
    let html_string = "";
    html_string += "<table class='assemble'><tr><td><div class='center'><strong>" + floor_type.name + " Floor</strong><br>";
    html_string += "<img src='https://space.alphacoders.com/images/floor-" + urlName(floor_type.name) + ".png'>";

    // Show what is required to assemble it
    floor_assembly_linkers.forEach(function (assembly_linker) {

        let required_object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === assembly_linker.object_type_id; });

        html_string += "<br> " + assembly_linker.amount + " ";
        if (required_object_type_index !== -1) {
            html_string += object_types[required_object_type_index].name + " <img style='width:16px; height:16px;' src='https://space.alphacoders.com/images/" +
                urlName(object_types[required_object_type_index].name) + ".png'>";
        } else {
            html_string += "" + assembly_linker.object_type_id;
        }


    });

    html_string += "<div class='center'><button id='assemblefloor_" + floor_type.id + "' ";

    // enter in the coord type and coord id depending on our view
    if (coord) {
        if (current_view === 'planet') {
            html_string += " coord_type='planet' coord_id='" + coord.id + "' ";
        } else if (current_view === 'ship') {
            html_string += " coord_type='ship' coord_id='" + coord.id + "' ";
        } else if (current_view === 'galaxy') {
            html_string += " coord_type='galaxy' coord_id='" + coord.id + "' ";
        }
    }

    html_string += " being_assembled_in_object_id='" + assembling_object.id + "'";

    html_string += " floor_type_id='" + floor_type.id + "' class='button is-default' source='generateAssemblyListItemFloor'>Assemble</button></div>";
    html_string += "</td></tr></table>";

    return html_string;
}


// I THINK We are just using printAssemblyList now??????
function generateCanAssembleListDeprecated() {
    console.log("%c In generateCanAssembleList. We think this is deprecated", log_danger);
    $('#can_assemble_list').empty();
    can_assemble_list = [];

    let player_can_build_something = false;
    let player_inventory_items = inventory_items.filter(inventory_item => inventory_item.player_id === player_id &&
        inventory_item.body_id === players[client_player_index].body_id);


    for (let i = 0; i < object_types.length; i++) {
        if (object_types[i].is_assembled) {
            console.log("Seeing if player can assemble object type: " + object_types[i].name);
            let requirements_met = true;
            // let go through its assembly linkers

            let object_assembly_linkers = object_type_assembly_linkers.filter(linker => linker.required_for_object_type_id === object_types[i].id);

            for (let j = 0; j < object_assembly_linkers.length; j++) {
                console.log("It requires " + object_assembly_linkers[j].amount + " of " + object_assembly_linkers[j].object_type_id);
                let met_this_requirement = false;

                for (let k = 0; k < player_inventory_items.length; k++) {

                    if (player_inventory_items[k].object_type_id === object_assembly_linkers[j].object_type_id &&
                        player_inventory_items[k].amount >= object_assembly_linkers[j].amount) {
                        met_this_requirement = true;
                        console.log("Met this requirement");
                    }
                }

                if (!met_this_requirement) {
                    requirements_met = false;
                }
            }

            let research_requirement_met = true;
            // if this assembly requires research
            if (object_types[i].required_research_object_type_id) {

                let required_object_index = object_types.findIndex(function (obj) { return obj && obj.id == object_types[i].required_research_object_type_id; });

                // see if the player has this researched
                let player_research_linker_index = player_research_linkers.findIndex(function (obj) {
                    return obj && obj.object_type_id == object_types[i].required_research_object_type_id;
                });

                if (player_research_linker_index != -1) {
                    if (player_research_linkers[player_research_linker_index].researches_completed >= object_types[required_object_index].research_times_required) {

                    } else {
                        research_requirement_met = false;
                    }
                } else {
                    research_requirement_met = false;
                }

            }

            if (requirements_met && research_requirement_met) {
                console.log("Met all requirements");

                let new_assemble_index = can_assemble_list.push({ 'object_type_id': object_types[i].id }) - 1;

                // lets add in scopes - so we can show only items for generally assembling, in a manufacturer, cloning vat, etc
                if (object_types[i].assembly_object_type_id) {
                    can_assemble_list[new_assemble_index].assembly_object_type_id = object_types[i].assembly_object_type_id;
                } else {
                    can_assemble_list[new_assemble_index].assembly_object_type_id = false;
                }
            }
        }
    }


    printAssemblyList(false, can_assemble_list);

    for (let i = 0; i < floor_types.length; i++) {
        //console.log("Checking floor type: " + floor_types[i].name);
        if (floor_types[i].is_assembled) {
            //console.log("Can potentially be assembled type: " + floor_types[i].name);
            let requirements_met = true;
            // let go through its assembly linkers

            let floor_assembly_linkers = floor_type_assembly_linkers.filter(linker => linker.required_for_floor_type_id == floor_types[i].id);

            for (let j = 0; j < floor_assembly_linkers.length; j++) {
                let met_this_requirement = false;

                for (let k = 0; k < player_inventory_items.length; k++) {

                    if (player_inventory_items[k].object_type_id == floor_assembly_linkers[j].object_type_id && player_inventory_items[k].amount >= floor_assembly_linkers[j].amount) {
                        met_this_requirement = true;
                    }
                }

                if (!met_this_requirement) {
                    requirements_met = false;
                }
            }

            if (requirements_met) {
                //console.log("Can assemble floor type");
                var html_string = "<table class='assemble'><tr><td><div class='center'><strong>" + floor_types[i].name + "</strong><br>";



                // show all the requirements

                for (let j = 0; j < floor_assembly_linkers.length; j++) {
                    let nested_object_type_index = object_types.findIndex(function (obj) { obj.id == floor_assembly_linkers[j].object_type_id; });
                    html_string += floor_assembly_linkers.amount + " " + object_types[nested_object_type_index].name + "<br>";
                }


                html_string += "</div>";


                html_string += "<div class='center'><button id='assemblefloor_" + floor_types[i].id + "' class='button is-default'>Assemble</button></div>";


                html_string += "</td><td>";

                html_string += "<img src='https://space.alphacoders.com/images/" + urlName(floor_types[i].name) + ".png'>";

                html_string += "</td></tr></table>";

                $('#can_assemble_list').append(html_string);
            }
        }
    }


    if ($('#can_assemble_list').is(':empty')) {
        $('#can_assemble_list').append("We have a <a target='_blank' href='https://space.alphacoders.com/site/tutorial'>tutorial</a> that can help you get started");
    }

}

function generateEquipmentDisplay() {

    // If our inventory isn't visible, don't show anything
    if (!$("#player_equipment").is(":visible")) {
        return false;
    }

    if (client_player_index === -1) {
        return false;
    }



    let augment_string = "";
    let augment_capacity_used = 0;
    let head_string = "";
    let head_capacity_used = 0;
    let left_arm_string = "";
    let left_arm_capacity_used = 0;
    let body_string = "";
    let body_capacity_used = 0;
    let right_arm_string = "";
    let right_arm_capacity_used = 0;
    let legs_string = "";
    let legs_capacity_used = 0;


    let equipment_layout_string = "<div style='display:flex;'>";
    equipment_layout_string += "<div id='equipment_augment' class='player_equipment'><span class='has-text-centered'><strong>Augments</strong></span><br></div>";
    equipment_layout_string += "<div id='equipment_head' class='player_equipment'><strong>Head</strong></div>";
    equipment_layout_string += "</div><div style='display:flex;'>";
    equipment_layout_string += "<div id='equipment_left_arm' class='player_equipment'><strong>Left Arm</strong></div>";
    equipment_layout_string += "<div id='equipment_body' class='player_equipment'><strong>Body</strong></div>";
    equipment_layout_string += "<div id='equipment_right_arm' class='player_equipment'><strong>Right Arm</strong></div>";
    equipment_layout_string += "</div><div style='display:flex;'>";
    equipment_layout_string += "<div id='equipment_legs' class='player_equipment'><strong>Legs</strong></div>";
    equipment_layout_string += "</div><div style='display:flex;'>";
    equipment_layout_string += "<div id='equipment_body_type' class='player_equipment'><strong>Body Type</strong></div>";
    equipment_layout_string += "<div id='equipment_skins' class='player_equipment'><strong>Skins Purchased</strong></div>";
    equipment_layout_string += "</div>";
    


    equipment_linkers.forEach(function (equipment_linker) {
        if (equipment_linker.body_id === players[client_player_index].body_id) {

            let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === equipment_linker.object_type_id; });

            if (object_type_index === -1) {
                console.log("Could not find object type for equipment linker");
                return false;
            }
            let object_linker_index = object_type_equipment_linkers.findIndex(function (obj) {
                return obj && obj.object_type_id === equipment_linker.object_type_id && obj.equip_slot === equipment_linker.equip_slot;
            });

            if (object_linker_index === -1) {
                console.log("Could not find the object we have equipped");
                return false;
            }

            let equipment_linker_string = "<br>";

            if (equipment_linker.amount > 1) {
                equipment_linker_string += equipment_linker.amount + " ";
            }

            equipment_linker_string += " <img title='" + object_types[object_type_index].name + "' style='width:32px; height:32px;' " +
                " src='https://space.alphacoders.com/images/" + urlName(object_types[object_type_index].name) + ".png'>";

            equipment_linker_string += " ( ";
            if (object_types[object_type_index].attack_strength) {
                equipment_linker_string += " + " + object_types[object_type_index].attack_strength + " attack";
            }

            if (object_types[object_type_index].defense) {
                equipment_linker_string += " + " + object_types[object_type_index].defense + " defense";
            }
            equipment_linker_string += " )";
            equipment_linker_string += "<button class='button is-warning is-small' id='unequip_" + equipment_linker.id +
                "' equipment_linker_id='" + equipment_linker.id + "'>Unequip</button>";

            if (equipment_linker.equip_slot === 'augment') {
                augment_string += equipment_linker_string;
                augment_capacity_used += object_type_equipment_linkers[object_linker_index].capacity_used;
            } else if (equipment_linker.equip_slot === 'head') {
                head_string += equipment_linker_string;
                head_capacity_used += object_type_equipment_linkers[object_linker_index].capacity_used;
            } else if (equipment_linker.equip_slot === 'left_arm') {
                left_arm_string += equipment_linker_string;
                left_arm_capacity_used += object_type_equipment_linkers[object_linker_index].capacity_used;
            } else if (equipment_linker.equip_slot === 'body') {
                body_string += equipment_linker_string;
                body_capacity_used += object_type_equipment_linkers[object_linker_index].capacity_used;
            } else if (equipment_linker.equip_slot === 'right_arm') {
                right_arm_string += equipment_linker_string;
                right_arm_capacity_used += object_type_equipment_linkers[object_linker_index].capacity_used;
            } else if (equipment_linker.equip_slot === 'legs') {
                legs_string += equipment_linker_string;
                legs_capacity_used += object_type_equipment_linkers[object_linker_index].capacity_used;
            }




        }

    });

    $('#player_equipment').empty();
    $('#player_equipment').append(equipment_layout_string);
    $('#equipment_augment').append(augment_string);
    $('#equipment_head').append(head_string);
    $('#equipment_left_arm').append(left_arm_string);
    $('#equipment_body').append(body_string);
    $('#equipment_right_arm').append(right_arm_string);
    $('#equipment_legs').append(legs_string);

    // For each slot, show how full it is

    $('#equipment_augment').append("<br>" + augment_capacity_used + "/Infinite Cap Used");
    $('#equipment_head').append("<br>" + head_capacity_used + "/5 Cap Used");
    $('#equipment_left_arm').append("<br>" + left_arm_capacity_used + "/3 Cap Used");
    $('#equipment_body').append("<br>" + body_capacity_used + "/7 Cap Used");
    $('#equipment_right_arm').append("<br>" + right_arm_capacity_used + "/3 Cap Used");
    $('#equipment_legs').append("<br>" + legs_capacity_used + "/4 Cap Used");

    // and show stats on the body type
    let body_index = objects.findIndex(function (obj) { return obj && obj.id === players[client_player_index].body_id; });
    if (body_index !== -1) {

        let body_type_index = object_types.findIndex(function (obj) { return obj && obj.id === objects[body_index].object_type_id; });
        let body_type_string = object_types[body_type_index].name + "<br> ";


        if (object_types[body_type_index].mining_modifier) {
            body_type_string += " " + object_types[body_type_index].mining_modifier + " Mining<br>";
        }

        if (object_types[body_type_index].move_delay !== 500) {
            body_type_string += " " + object_types[body_type_index].move_delay + " Move Delay<br>";
        }

        if (object_types[body_type_index].attack_modifier) {
            body_type_string += " " + object_types[body_type_index].attack_modifier + " Attack<br>";
        }

        if (object_types[body_type_index].defense_modifier) {
            body_type_string += " " + object_types[body_type_index].defense_modifier + " Defense<br>";
        }

        if (object_types[body_type_index].hp_modifier) {
            body_type_string += " " + object_types[body_type_index].hp_modifier + " HP<br>";
        }

        if (object_types[body_type_index].manufacturing_modifier) {
            body_type_string += " " + object_types[body_type_index].manufacturing_modifier + " Manufacturing<br>";
        }

        $('#equipment_body_type').append(body_type_string);



    } else {
        console.log("Don't have player's body object");
    }


    // If the user has purchased any skins, show them, and let them select them here

    if (skin_purchase_linkers.length > 0) {

        let skin_string = "<br>";

        for (let i = 0; i < skin_purchase_linkers.length; i++) {

            // For now, lets just not show the pod, and have the new pod always be the one that shows for the player
            if(skin_purchase_linkers[i].object_type_id === 437) {

            } else {
                let skin_object_type_index = getObjectTypeIndex(skin_purchase_linkers[i].object_type_id);
                skin_string += object_types[skin_object_type_index].name;
                skin_string += " <button class='button is-success is-small' skin_object_type_id='" + skin_purchase_linkers[i].object_type_id + "' id='skin_use_" + skin_purchase_linkers[i].object_type_id + "'>Use</button>";
                skin_string += " <button class='button is-warning is-small' skin_object_type_id='" + skin_purchase_linkers[i].object_type_id + "' id='skin_remove_" + skin_purchase_linkers[i].object_type_id + "'>Remove</button>";
            }

            
        }


        $('#equipment_skins').append(skin_string);
    }



}

function generateInventoryDisplay() {

    // If our inventory isn't visible, don't show anything
    if (!$("#inventory").is(":visible")) {
        return false;
    }

    // Don't have info about the client player yet
    if (client_player_index === -1) {
        return false;
    }

    //console.log("%c Generating inventory display", log_success);
    $('#inventory').empty();

    inventory_items.forEach(function (inventory_item, i) {
        // Only use our inventory items for the main display
        if (inventory_item.player_id !== players[client_player_index].id) {
            return false;
        }

        if(inventory_item.body_id !== players[client_player_index].body_id) {
            return false;
        }

        generateInventoryItemDisplay(i);

        /*
        let object_type_index = -1;
        let floor_type_index = -1;
        if (inventory_item.object_id) {
            let object_index = objects.findIndex(function (obj) { return obj && obj.id === inventory_item.object_id; });
            if (object_index === -1) {
                //console.log("Have inventory item but don't have the object associated with it. object id: "
                //    + inventory_item.object_id + ". Requesting info");
                socket.emit('request_object_info', { 'object_id': inventory_item.object_id });
                return;
            }

            object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === objects[object_index].object_type_id; });
        } if (inventory_item.object_type_id) {
            object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === inventory_item.object_type_id; });
        } else if (inventory_item.floor_type_id) {
            floor_type_index = floor_types.findIndex(function (obj) { return obj && obj.id === inventory_item.floor_type_id; });
        }


        // TODO
        // I want to change the appearance of the linear gradient depending on how the player can interact with the item
        // DEFAULT: linear-gradient(141deg, #cacaca 0%, #aaa 51%, #8e8e8e 75%)
        // CAN EAT: linear-gradient(141deg, #cff0ff 0%, #01afff 51%, #007fae 75%)
        // EQUIPABLE: linear-gradient(141deg, #ffc3c3 0%, #a83e3e 51%, #642424 75%)


        // Wrapper div
        let adding_string = "";

        // see if the client is currently eating this

        let eating_linker_index = eating_linkers.findIndex(function(obj) { return obj && obj.eating_object_type_id === inventory_item.object_type_id && 
            obj.body_id === players[client_player_index].body_id });

        let addiction_linker_index = addiction_linkers.findIndex(function(obj) { return obj && obj.addicted_to_object_type_id === inventory_item.object_type_id && 
            obj.addicted_body_id === players[client_player_index].body_id; });

        // or is currently addicted to this

        if(eating_linker_index !== -1) {

            adding_string += "<div id='inventory_item_" + inventory_item.id + "' style=' " +
            " display:inline-block; border: 2px solid black; width:64px; height:64px; " +
            " border-radius: 4px; box-shadow: 1px 3px 4px #2cf939; margin:2px; " +
            " background-image: linear-gradient(141deg, #c3ffcf 0%, #1fdb34 51%, #2ce838 75%); " +
            " ' ";

        } else if(addiction_linker_index !== -1) {

            adding_string += "<div id='inventory_item_" + inventory_item.id + "' style=' " +
            " display:inline-block; border: 2px solid black; width:64px; height:64px; " +
            " border-radius: 4px; box-shadow: 1px 3px 4px #f92c2c; margin:2px; " +
            " background-image: linear-gradient(141deg, #ffc3c3 0%, #db1f1f 51%, #e82c2c 75%); " +
            " ' ";
        } else {
            adding_string += "<div id='inventory_item_" + inventory_item.id + "' style=' " +
                " display:inline-block; border: 2px solid black; width:64px; height:64px; " +
                " border-radius: 4px; box-shadow: 1px 3px 4px #2cc2f9; margin:2px; " +
                " background-image: linear-gradient(141deg, #c3faff 0%, #1fc8db 51%, #2cb5e8 75%); " +
                " ' ";
        }




        if (object_type_index !== -1) {
            adding_string += " title='" + object_types[object_type_index].name + "' ";
        } else if (floor_type_index !== -1) {
            adding_string += " title='" + floor_types[floor_type_index].name + "' ";
        }

        adding_string += " onclick='showInventoryOptions(" + inventory_item.id + ")'>";


        // Internal div
        if (object_type_index !== -1) {
            adding_string += "<div style='width:60px; height:60px; background-size: cover; position:relative; " +
                " background-image: url(https://space.alphacoders.com/images/" + urlName(object_types[object_type_index].name) + ".png); '>";
        } else if (floor_type_index !== -1) {
            adding_string += "<div style='width:60px; height:60px; background-size: cover; position:relative; " +
                " background-image: url(https://space.alphacoders.com/images/floor-" + urlName(floor_types[floor_type_index].name) + ".png); '>";
        }






        adding_string += "<span style='color:white; font-size:20px; text-shadow: 1px 1px black; position:absolute; right: 6px; bottom: 0;'>";
        adding_string += inventory_item.amount;
        adding_string += "</span>";

        adding_string += "</div>";





        // End wrapper div
        adding_string += "</div>";
        $('#inventory').append(adding_string);

        */
    });
}

function generateInventoryItemDisplay(inventory_item_index) {

    //console.log("In generateInventoryItem");


    // Don't have info about the client player yet
    if (client_player_index === -1) {
        return false;
    }

    if (inventory_items[inventory_item_index].player_id !== players[client_player_index].id) {
        return false;
    }

    if(inventory_items[inventory_item_index].body_id !== players[client_player_index].body_id) {
        return false;
    }

    let mode = "add";
    if( $("#inventory_item_" + inventory_items[inventory_item_index].id).length ) {
        mode = "update";
    }



    let object_type_index = -1;
    let floor_type_index = -1;
    if (inventory_items[inventory_item_index].object_id) {
        let object_index = objects.findIndex(function (obj) { return obj && obj.id === inventory_items[inventory_item_index].object_id; });
        if (object_index === -1) {
            //console.log("Have inventory item but don't have the object associated with it. object id: "
            //    + inventory_item.object_id + ". Requesting info");
            socket.emit('request_object_info', { 'object_id': inventory_items[inventory_item_index].object_id });
            return;
        }

        object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === objects[object_index].object_type_id; });
    } if (inventory_items[inventory_item_index].object_type_id) {
        object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === inventory_items[inventory_item_index].object_type_id; });
    } else if (inventory_items[inventory_item_index].floor_type_id) {
        floor_type_index = floor_types.findIndex(function (obj) { return obj && obj.id === inventory_items[inventory_item_index].floor_type_id; });
    }

    // Wrapper div
    let adding_string = "";

    if(mode === 'add') {
        adding_string += "<div id='inventory_item_" + inventory_items[inventory_item_index].id + "' " +
            " style='display:inline-block; width:64px; height:64px;'>";
    }


    // see if the client is currently eating this

    let eating_linker_index = eating_linkers.findIndex(function(obj) { return obj && obj.eating_object_type_id === inventory_items[inventory_item_index].object_type_id && 
        obj.body_id === players[client_player_index].body_id });

    let addiction_linker_index = addiction_linkers.findIndex(function(obj) { return obj && obj.addicted_to_object_type_id === inventory_items[inventory_item_index].object_type_id && 
        obj.addicted_body_id === players[client_player_index].body_id; });

    // or is currently addicted to this

    if(eating_linker_index !== -1) {

        adding_string += "<div style=' " +
        " border-radius: 4px; box-shadow: 1px 3px 4px #2cf939; margin:2px; " +
        " background-image: linear-gradient(141deg, #c3ffcf 0%, #1fdb34 51%, #2ce838 75%); " +
        " ' ";

    } else if(addiction_linker_index !== -1) {

        adding_string += "<div style=' " +
        " border-radius: 4px; box-shadow: 1px 3px 4px #f92c2c; margin:2px; " +
        " background-image: linear-gradient(141deg, #ffc3c3 0%, #db1f1f 51%, #e82c2c 75%); " +
        " ' ";
    } else {
        adding_string += "<div style=' " +
            " border-radius: 4px; box-shadow: 1px 3px 4px #2cc2f9; margin:2px; " +
            " background-image: linear-gradient(141deg, #c3faff 0%, #1fc8db 51%, #2cb5e8 75%); " +
            " ' ";
    }




    if (object_type_index !== -1) {
        adding_string += " title='" + object_types[object_type_index].name + "' ";
    } else if (floor_type_index !== -1) {
        adding_string += " title='" + floor_types[floor_type_index].name + "' ";
    }

    adding_string += " onclick='showInventoryOptions(" + inventory_items[inventory_item_index].id + ")'>";


    // Internal div
    if (object_type_index !== -1) {
        adding_string += "<div style='width:60px; height:60px; background-size: cover; position:relative; " +
            " background-image: url(https://space.alphacoders.com/images/" + urlName(object_types[object_type_index].name) + ".png); '>";
    } else if (floor_type_index !== -1) {
        adding_string += "<div style='width:60px; height:60px; background-size: cover; position:relative; " +
            " background-image: url(https://space.alphacoders.com/images/floor-" + urlName(floor_types[floor_type_index].name) + ".png); '>";
    }






    adding_string += "<span style='color:white; font-size:20px; text-shadow: 1px 1px black; position:absolute; right: 6px; bottom: 0;'>";
    adding_string += inventory_items[inventory_item_index].amount;
    adding_string += "</span>";

    adding_string += "</div>";





    // End wrapper div
    adding_string += "</div>";


    if(mode === 'add') {
        adding_string += "</div>";
    }

    if( mode === "update" ) {
        //console.log("Updating just that inventory item");
        $("#inventory_item_" + inventory_items[inventory_item_index].id).empty();
        $("#inventory_item_" + inventory_items[inventory_item_index].id).append(adding_string);
    } else {
        //console.log("Appending new inventory item");
        $('#inventory').append(adding_string);
    }


}


function generateNonAiManagementDisplay(object_index = -1) {

    if (!$("#object_management").is(":visible")) {
        return false;
    }

    if (client_player_index === -1) {
        return false;
    }

    console.log("In generateNonAiManagementDisplay with object_index: " + object_index);

    $('#object_management').empty();

    let html_string = "";
    html_string += "<div class='message is-info message-inline'><div class='message-body'>";

    // Lets try a close button
    html_string += "";

    // go through the objects we know about, and if they are something we manage, show that
    object_types.forEach(function (object_type, i) {

        if (object_type.is_ship) {
            return false;
        }

        // We are expanding objects that can be managed - name and tint for most
        //if(!object_type.can_have_rules) {
        //    return false;
        //}

        objects.forEach(function (object, j) {

            if (object_index !== -1 && j !== object_index) {
                return false;
            }

            // We separate out ships and AI's from this display
            if (object.object_type_id === 72) {
                return false;
            }

            if (object.player_id === client_player_id && object.object_type_id === object_type.id) {

                if (object.name) {
                    html_string += "<strong>" + object.name + "</strong>";
                } else {
                    html_string += "<strong>" + object.id + "</strong>";
                }

                html_string += "<button class='button is-default is-small' " +
                    "id='showobject_" + object.id + "'" +
                    " object_id='" + object.id + "'>Show</button>";
                html_string += ":<br>";
                // we need some identifier so that if we get new rules in, we know if it matches the AI that we are showing rules on
                html_string += "<div id='management_object_" + object.id + "'></div>";



            }
        });

    });


    html_string += "</div></div>";


    $('#click_menu').empty();
    $('#click_menu').hide();

    $('#object_management').empty();
    $('#object_management').append(html_string);

    if (object_index !== -1) {
        $("#objectcolor_" + objects[object_index].id).spectrum({
            color: "#f00",
            preferredFormat: "hex",
        });
    }


}

function generateManagementOptionsDisplay() {

    console.log("In generateManagementOptionsDisplay");

    if (!$("#management_options").is(":visible")) {
        return false;
    }

    let html_string = "";

    html_string += "<div class='message is-dark message-inline'><div class='message-body'>";
    html_string += "Management. Expand: ";
    html_string += " <button class='button is-info' id='showareaoptions'>Areas</button> ";
    html_string += " <button class='button is-info' id='showaioptions'>AIs</button> ";
    html_string += " <button class='button is-info' id='showshipoptions'>Ships</button> ";
    html_string += " <button class='button is-info' id='showobjectoptions'>Objects</button> ";
    html_string += " <button class='button is-info' id='showmarketoptions'>Market</button> ";
    html_string += " <button class='button is-success' id='showtaskoptions'>Tasks</button> ";
    html_string += "</div></div>";

    $('#management_options').empty();
    $('#management_options').append(html_string);
}

function generateAreaDisplay(area_id) {

    area_id = parseInt(area_id);

    let area_index = areas.findIndex(function (obj) { return obj && obj.id === area_id; });

    if (area_index === -1) {
        console.log("Could not find area");
        return false;
    }

    let html_string = "";

    // Things to display if we are the owner
    if (areas[area_index].owner_id === client_player_id) {

        // Rename Option
        html_string += "<form action='#'>";
        html_string += "<div class='field is-horizontal'>";
        html_string += "<input type='text' class='input' name='areaname_" + areas[area_index].id + "' id='areaname_" + areas[area_index].id + "'>";
        html_string += "<input class='button is-default' onclick=\"renameArea(" + areas[area_index].id + "); return false;\" type=\"submit\" value=\"Rename\">";
        html_string += "</div>";
        html_string += "</form>";


        // The area could be waiting for someone to accept renting it
        if (areas[area_index].renting_player_id) {

            let renting_player_index = players.findIndex(function (obj) { return obj && obj.id === areas[area_index].renting_player_id; });

            if (areas[area_index].is_accepted) {

                if (renting_player_index === -1) {
                    socket.emit('request_player_info', { 'player_id': areas[area_index].renting_player_id });
                    html_string += " Rented by player id " + areas[area_index].renting_player_id;
                } else {
                    html_string += " Rented by " + players[renting_player_index].name;
                }

                html_string += " for " + areas[area_index].price + " credits/month";

                // TODO evict option

            } else {
                html_string += " waiting to be accepted by ";
                if (renting_player_index === -1) {
                    html_string += " player id " + areas[area_index].renting_player_id;
                } else {
                    html_string += " " + players[renting_player_index].name;
                }

                // TODO cancel button
            }

        } else {
            // Option to manually rent to someone
            html_string += "<strong>Rent To Specific Player:</strong><br>";
            html_string += "<form action='#'>";
            html_string += "<div class='field is-horizontal'>";
            html_string += "<label class='label'>Player Name</label>";
            html_string += "<input type='text' class='input' name='rent_to_player_name_" + areas[area_index].id + "' id='rent_to_player_name_" + areas[area_index].id + "'>";
            html_string += "<label class='label'>Credits/Month</label>";
            html_string += "<input type='text' class='input' name='price_" + areas[area_index].id + "' id='price_" + areas[area_index].id + "'>";
            html_string += "<input class='button is-default' onclick=\"rentToPlayer(" + areas[area_index].id + "); return false;\" type=\"submit\" value=\"Rent to player\">";
            html_string += "</div>";
            html_string += "</form>";

            // Or put it on the market
            // Only give the option if it isn't already on the market
            let on_market = false;
            for (let i = 0; i < market_linkers.length; i++) {
                if (market_linkers[i].area_id === areas[area_index].id) {
                    on_market = true;
                }
            }

            if (!on_market) {
                html_string += "<br><button class='button is-info' id='areaputonmarket_" + areas[area_index].id + "' area_id='" + areas[area_index].id + "'>Put On Market</button>";
            } else {
                html_string += "<br>On The Market";
            }



        }


        html_string += "<br>";

    }
    // Options for us as the renting player
    else if (areas[area_index].renting_player_id === client_player_id) {
        html_string += "Renting Options";
    }

    $("#area_" + area_id).empty();
    $("#area_" + area_id).append(html_string);


}

function generateAreaManagementDisplay() {

    if (!$("#area_management").is(":visible")) {
        return false;
    }

    let html_string = "";

    html_string += "<div class='message is-info message-inline'><div class='message-body'>";

    // Create a room form

    html_string += "<strong>Create An Area:</strong>";
    html_string += "<form action='#'>";
    html_string += "<div class='field is-horizontal'>";
    html_string += "<input type='text' class='input' name='create_area_name' id='create_area_name'>";
    html_string += "<input class='button is-default' onclick=\"createArea(); return false;\" type=\"submit\" value=\"Create New Area\">";
    html_string += "</div>";
    html_string += "</form>";


    for (let i = 0; i < areas.length; i++) {

        if (areas[i]) {
            if (areas[i].owner_id === client_player_id || areas[i].renting_player_id === client_player_id) {
                html_string += "<strong>" + areas[i].name + "</strong>";
                html_string += "<button class='button is-default is-small' " +
                    "id='showarea_" + areas[i].id + "'" +
                    " area_id='" + areas[i].id + "'>Show</button>";
                html_string += ":<br>";
                html_string += "<div id='area_" + areas[i].id + "'></div>";
            }
        }

    }


    html_string += "</div></div>";

    $('#area_management').empty();
    $('#area_management').append(html_string);
}


// Basic info for the local market
function generateMarketDisplay() {

    if (!$("#market").is(":visible")) {
        return false;
    }

    let html_string = "";

    html_string += "<div class='message is-info message-inline' style='margin-top:10px;'><div class='message-body'>";
    html_string += "<strong>Local Areas On The Market</strong><br>";

    let planet_coord_index = -1;
    let ship_coord_index = -1;

    if (players[client_player_index].planet_coord_id) {

        planet_coord_index = planet_coords.findIndex(function (obj) { return obj && obj.id === players[client_player_index].planet_coord_id; });

    } else if (players[client_player_index].ship_coord_id) {
        ship_coord_index = ship_coords.findIndex(function (obj) { return obj && obj.id === players[client_player_index].ship_coord_id; });
    }



    for (let i = 0; i < market_linkers.length; i++) {
        if (market_linkers[i] && ((planet_coord_index !== -1 && market_linkers[i].planet_id === planet_coords[planet_coord_index].planet_id) ||
            (ship_coord_index !== -1 && market_linkers[i].ship_id === ship_coords[ship_coord_index].ship_id))) {

            // Show the area name if we have the area
            let area_index = areas.findIndex(function (obj) { return obj && obj.id === market_linkers[i].area_id; });
            if (area_index !== -1) {
                html_string += " Area: " + areas[area_index].name + " ";
            } else {
                html_string += "Market Linker ID: " + market_linkers[i].id + " ";
            }

            // And the bids for it



            // And when it ends

            html_string += "<button class='button is-default is-small' " +
                "id='showmarketlinker_" + market_linkers[i].id + "'" +
                " market_linker_id='" + market_linkers[i].id + "'>Show</button>";
            html_string += ":<br>";
            html_string += "<div id='market_linker_" + market_linkers[i].id + "'></div>";

        }
    }




    /*
    for(let i = 0; i < areas.length; i++) {

        if(areas[i]) {
            if(areas[i].owner_id === client_player_id || areas[i].renting_player_id === client_player_id) {
                html_string += "<strong>" + areas[i].name + "</strong>";
                html_string += "<button class='button is-default is-small' " +
                    "id='showarea_" + areas[i].id + "'" +
                    " area_id='" + areas[i].id + "'>Show</button>";
                html_string += ":<br>";
                html_string += "<div id='area_" + areas[i].id + "'></div>";
            }
        }

    }
    */


    html_string += "</div></div>";

    $('#market').empty();
    $('#market').append(html_string);
}

function generateMarketLinkerDisplay(market_linker_id) {

    market_linker_id = parseInt(market_linker_id);

    let market_linker_index = market_linkers.findIndex(function (obj) { return obj && obj.id === market_linker_id; });

    if (market_linker_index === -1) {
        console.log("Could not find market_linker");
        return false;
    }

    let area_index = areas.findIndex(function (obj) { return obj && obj.id === market_linkers[market_linker_index].area_id; });


    if (area_index === -1) {
        return false;
    }

    let html_string = "";

    // Show the current bids
    let bid_count = 0;
    for (let i = 0; i < bid_linkers.length; i++) {
        if (bid_linkers[i] && bid_linkers[i].area_id === areas[area_index].id) {
            bid_count++;
            html_string += "Price: " + bid_linkers[i].price + "<br>";
        }
    }

    if (bid_count === 0) {
        html_string += "No bids yet<br>";
    }

    // and the ending time - using seconds instead of milliseconds

    let timestamp_difference = market_linkers[market_linker_index].ending_at - (Date.now() / 1000);

    let divide_by_day = 24 * 60 * 60;
    let days_until_end = Math.floor(timestamp_difference / divide_by_day);


    html_string += "<br>Ending In " + days_until_end + " Days<br>";

    // Submit Bid Option
    html_string += "<strong>Bid</strong><br>";
    html_string += "<form action='#'>";
    html_string += "<div class='field is-horizontal'>";
    html_string += "<input type='text' class='input' name='bid_" + areas[area_index].id + "' id='bid_" + areas[area_index].id + "'>";
    html_string += "<input class='button is-default' onclick=\"submitBid(" + areas[area_index].id + "); return false;\" type=\"submit\" value=\"Submit Bid\">";
    html_string += "</div>";
    html_string += "</form>";


    $("#market_linker_" + market_linker_id).empty();
    $("#market_linker_" + market_linker_id).append(html_string);


}


function generateObjectDisplay(object_id) {

    object_id = parseInt(object_id);

    let object_index = objects.findIndex(function (obj) { return obj && obj.id === object_id; });

    if (object_index === -1) {
        console.log("Could not find object");
        return false;
    }

    let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === objects[object_index].object_type_id; });

    let html_string = "";

    if (objects[object_index].name) {
        html_string += " " + objects[object_index].name + " ";
    }

    if (debug_mode) {
        html_string += " ID " + objects[object_index].id;
    }

    html_string += ": ";

    html_string += " <button class='button is-danger is-small' id='destroy_object_" + objects[object_index].id + "' object_id='" + objects[object_index].id + "'>Destroy</button>";

    html_string += "<br>";



    html_string += "<form action='#'>";
    html_string += "<div class='field is-horizontal'>";
    html_string += "<input type='text' class='input' name='object_" + objects[object_index].id + "_name' id='object_" + objects[object_index].id + "_name'>";
    html_string += "<input class='button is-default' onclick=\"submitObjectName(" + objects[object_index].id + "); return false;\" type=\"submit\" value=\"Change Name\">";
    html_string += "</div>";
    html_string += "</form>";



    /**************************************** RULES SECTION ******************************************/

    if (object_types[object_type_index].can_have_rules) {

        // AI RULES
        if (object_types[object_type_index].id === 72) {
            // AI on a planet
            if (objects[object_index].planet_coord_id) {

                // show the planet and let them change the planet name
                let planet_coord_index = planet_coords.findIndex(function (obj) { return obj && obj.id === objects[object_index].planet_coord_id; })
                if (planet_coord_index !== -1) {
                    let planet_index = planets.findIndex(function (obj) { return obj && obj.id === planet_coords[planet_coord_index].planet_id; });
                    if (planet_index !== -1) {
                        html_string += "Planet Name: " + planets[planet_index].name + " ";
                        html_string += "<form action='#'>";
                        html_string += "<div class='field is-horizontal'>";
                        html_string += "<input type='text' class='input' name='planet_" + planets[planet_index].id + "_name' id='planet_" + planets[planet_index].id + "_name'>";
                        html_string += "<input class='button is-default' onclick=\"submitPlanetName(" + planets[planet_index].id + "); return false;\" type=\"submit\" value=\"Change Planet Name\">";
                        html_string += "</div>";
                        html_string += "</form>";
                    } else {
                        console.log("333 request");
                        socket.emit('request_planet_info', { 'planet_id': planet_coords[planet_coord_index].planet_id });
                    }
                }

            } else if (objects[object_index].ship_coord_id) {

                // show the ship and let them change the ship name
                let ship_coord_index = ship_coords.findIndex(function (obj) { return obj && obj.id === objects[object_index].ship_coord_id; })
                if (ship_coord_index !== -1) {
                    let ship_index = objects.findIndex(function (obj) { return obj && obj.id === ship_coords[ship_coord_index].ship_id; });
                    if (ship_index !== -1) {
                        html_string += "Ship Name: " + objects[ship_index].name + " ";
                        html_string += "<form action='#'>";
                        html_string += "<input type='text' name='object_" + objects[ship_index].id + "_name' id='object_" + objects[ship_index].id + "_name'>";
                        html_string += "<input onclick=\"submitObjectName(" + objects[ship_index].id + "); return false;\" type=\"submit\" value=\"Change Ship Name\">";
                        html_string += "</form>";
                    } else {
                        socket.emit('request_object_info', { 'object_id': ship_coords[ship_coord_index].ship_id, 'reason': 'Need ship' });
                    }
                }
            }




            html_string += "<strong>Add A Rule:</strong>";
            html_string += "<form action='#'>";
            html_string += "<div class='field is-horizontal'>";
            html_string += "<div class='select'>";
            html_string += "<select id=\"" + objects[object_index].id + "_new_rule\">";
            html_string += "<option value='attack_all_players'>Attack All Players</option>";
            html_string += "<option value='attack_all_players_except_creator'>Attack All Players Except Creator</option>";
            html_string += "<option value='attack_all_players_except_creator_faction'>Attack All Players Except Creator Faction</option>";
            html_string += "<option value='protect_all_players'>Protect All Players</option>";
            html_string += "<option value='protect_players_from_players'>Protect All Players From Players</option>";
            html_string += "<option value='protect_players_from_monsters'>Protect All Players From Monsters</option>";
            html_string += "<option value='protect_creator'>Protect Creator</option>";
            html_string += "<option value='protect_creator_property'>Protect Creator Property</option>";
            html_string += "<option value='protect_self'>Protect Self</option>";
            html_string += "<option value='building_no_others'>Others can't build</option>";
            html_string += "<option value='floor_no_others'>Others can't replace floor</option>";
            html_string += "</select>";
            html_string += "</div>";
            html_string += "<input class='button is-default' onclick=\"submitRule(" + objects[object_index].id + "); return false;\" type=\"submit\" value=\"Submit Rule\">";
            html_string += "</div>";

            html_string += "</form>";
        }
        // DEFENSE DRONE
        else if (objects[object_index].object_type_id === 71) {
            html_string += "<form action='#'>";
            html_string += "<select id=\"" + objects[object_index].id + "_new_rule\">";
            html_string += "<option value='attack_all_players'>Attack All Players</option>";
            html_string += "<option value='attack_all_players_except_creator'>Attack All Players Except Creator</option>";
            html_string += "<option value='attack_all_players_except_creator_faction'>Attack All Players Except Creator Faction</option>";
            html_string += "</select>";
            html_string += "<input onclick=\"submitRule(" + objects[object_index].id + "); return false;\" type=\"submit\" value=\"Add Rule\">";
            html_string += "</form>";
        }

        // Doors
        else if (objects[object_index].object_type_id === 185 || objects[object_index].object_type_id === 266) {
            html_string += "<form action='#'>";
            html_string += "<select id=\"" + objects[object_index].id + "_new_rule\">";
            html_string += "<option value='allow_all_players'>Allow All Players</option>";
            html_string += "<option value='allow_faction_players'>Allow Faction Players</option>";
            html_string += "<option value='allow_creator'>Allow Creating Player</option>";
            html_string += "<option value='allow_monsters'>Allow Monsters</option>";
            html_string += "</select>";
            html_string += "<input onclick=\"submitRule(" + objects[object_index].id + "); return false;\" type=\"submit\" value=\"Add Rule\">";
            html_string += "</form>";
        }

        // SPACELANE BEACON
        else if (objects[object_index].object_type_id === 288) {
            html_string += "<form action='#'>";
            html_string += "<select id=\"" + objects[object_index].id + "_new_rule\">";
            html_string += "<option value='protect_3'>Protect 3x3 Area</option>";
            html_string += "<option value='protect_4'>Protect 4x4 Area</option>";
            html_string += "</select>";
            html_string += "<input onclick=\"submitRule(" + objects[object_index].id + "); return false;\" type=\"submit\" value=\"Add Rule\">";
            html_string += "</form>";
        }



        // show current rules and allow the user to remove them
        rules.forEach(function (rule) {
            if (rule.object_id === objects[object_index].id) {

                if (rule.rule === 'floor_no_others') {
                    html_string += "Others can't replace floors";
                } else {
                    html_string += rule.rule;
                }
                html_string += " <button class='button is-danger is-small' id='deleterule_" +
                    rule.id + "' rule_id='" + rule.id + "'>Delete Rule</button><br>";
            }
        });
    }





    // Tint
    html_string += "<strong>Change Tint</strong>";
    html_string += "<form action='#'>";
    html_string += "<div class='field is-horizontal'>";
    html_string += "<input type='text' name='objectcolor_" + objects[object_index].id + "' id='objectcolor_" + objects[object_index].id + "'>";
    html_string += "<input class='button is-default' onclick=\"objectTint(" + objects[object_index].id + "); return false;\" type=\"submit\" value=\"Set Tint\">";
    html_string += "</div>";
    html_string += "</form>";




    // if the ship is docked somewhere, display that
    if (objects[object_index].docked_at_planet_id) {
        let planet_index = planets.findIndex(function (obj) { return obj && obj.id === objects[object_index].docked_at_planet_id; });

        if (planet_index !== -1) {
            html_string += " Docked At Planet " + planets[planet_index].name;
        } else {
            html_string += " Docked At A Planet";

            console.log("444 request planet_id: " + objects[object_index].docked_at_planet_id);
            socket.emit('request_planet_info', { 'planet_id': objects[object_index].docked_at_planet_id });
        }
    } else if (objects[object_index].docked_at_object_id) {
        let docked_index = objects.findIndex(function (obj) { return obj && obj.id === objects[object_index].docked_at_object_id; });

        if (docked_index !== -1) {
            html_string += " Docked At " + objects[docked_index].name;
        } else {
            html_string += " Docked At A Station";

            socket.emit('request_object_info', { 'object_id': objects[object_index].docked_at_object_id, 'reason': 'Need docked at object' });
        }
    }



    $("#management_object_" + object_id).empty();
    $("#management_object_" + object_id).append(html_string);

    $("#objectcolor_" + objects[object_index].id).spectrum({
        color: "#f00",
        preferredFormat: "hex",
    });


}



function generateShipManagementDisplay() {

    if (!$("#ship_management").is(":visible")) {
        return false;
    }

    let html_string = "";

    html_string += "<div class='message is-info message-inline'><div class='message-body'>";

    let ship_object_types = object_types.filter(object_type => object_type.is_ship);

    for (let object_type of ship_object_types) {
        // see if the player has any of these
        let player_ships = objects.filter(object => object.player_id === client_player_id && object.object_type_id === object_type.id);

        if (player_ships && player_ships.length > 0) {
            for (let ship of player_ships) {

                let ship_type_index = object_types.findIndex(function (obj) { return obj.id === ship.object_type_id; });


                if (ship.name) {
                    html_string += "<strong>" + ship.name + "</strong>";
                } else {
                    html_string += " ID " + ship.id + " ";
                }

                if (ship.id === players[client_player_index].ship_id) {
                    html_string += " <span class='tag is-info'>Current Ship</span> ";
                }

                html_string += "<button class='button is-default is-small' " +
                    "id='showobject_" + ship.id + "'" +
                    " object_id='" + ship.id + "'>Show</button>";
                html_string += ":<br>";
                html_string += "<div id='management_object_" + ship.id + "'></div>";




            }
        }
    }

    html_string += "</div></div>";

    $('#ship_management').empty();
    $('#ship_management').append(html_string);
}

function generateTakeBuyMenu(object_id) {

    let object_index = getObjectIndex(object_id);

    let take_string = "<div class='message is-success'>";
        take_string += "<div class='message-header'>Take/Buy</div>";


        // get anything that is in this object, and add in a take option
        let object_inventory_items = inventory_items.filter(inventory_item => inventory_item.owned_by_object_id === objects[object_index].id);

        object_inventory_items.forEach(function (inventory_item) {
            //console.log("Has inventory item id: " + inventory_item.id);
            let inventory_item_object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === inventory_item.object_type_id; });
            if (inventory_item_object_type_index !== -1) {

                // It's ours - we can take from it
                if (objects[object_index].player_id === client_player_id || (!inventory_item.player_id && !inventory_item.npc_id && !inventory_item.price)) {


                    if(objects[object_index].object_type_id === 92) {
                        take_string += "<div style='display:block;'>";
                    }





                    if(objects[object_index].object_type_id !== 92 || 
                        (objects[object_index].object_type_id === 92 && players[client_player_index].id === objects[object_index].player_id) ) {


                            take_string += "<div style='display:inline-block; position:relative; width:174px; height:74px; " +
                            " background-image: url(https://space.alphacoders.com/images/" +
                            urlName(object_types[inventory_item_object_type_index].name) + ".png); background-repeat: no-repeat; " +
                            " background-position: top; " +
                            " border: 1px #c8c1c1 solid; border-radius:6px; margin:2px;'>";
    
    
                            take_string += "<div style='position:absolute; right: 4px; top: 0;'>" + inventory_item.amount + "</div>";
        
                            take_string += "<div style='position:absolute; right: 4px; bottom: 0;'>";


                            if (inventory_item.amount === 1) {
                                take_string += "<button id='take_" + inventory_item.id + "_all' class='button is-default is-small' " +
                                    " storage_object_id='" + objects[object_index].id + "' " +
                                    " inventory_item_id='" + inventory_item.id + "' amount='all'>Take</button>";
                            } else {
                                take_string += "Take:";
        
                                take_string += "<button id='take_" + inventory_item.id + "_all' class='button is-default is-small' " +
                                    " storage_object_id='" + objects[object_index].id + "' " +
                                    " inventory_item_id='" + inventory_item.id + "' amount='all'>All</button>";
        
                                if (inventory_item.amount >= 100) {
                                    take_string += "<button id='take_" + inventory_item.id + "_100' class='button is-default is-small' " +
                                        " storage_object_id='" + objects[object_index].id + "' " +
                                        " inventory_item_id='" + inventory_item.id + "' amount='100'>100</button>";
        
                                }
        
                                if (inventory_item.amount >= 10) {
                                    take_string += "<button id='take_" + inventory_item.id + "_10' class='button is-default is-small' " +
                                        " storage_object_id='" + objects[object_index].id + "' " +
                                        " inventory_item_id='" + inventory_item.id + "' amount='10'>10</button>";
        
                                }
        
                                take_string += "<button id='take_" + inventory_item.id + "_1' class='button is-default is-small' " +
                                    " storage_object_id='" + objects[object_index].id + "' " +
                                    " inventory_item_id='" + inventory_item.id + "' amount='1'>1</button>";
                            }


                            take_string += "</div>";


                            take_string += "</div>";
        

                        }
                  


                    if(objects[object_index].object_type_id === 92 && client_player_id === objects[object_index].player_id) {
                        take_string += "<div style='display:inline-block; position:relative; width:146px; height:74px; " +
                        " border: 1px #c8c1c1 solid; border-radius:6px; margin:2px; margin-top:-102px;'>";
                        

                        take_string += "<strong>Sell Each For:</strong>";
                        take_string += "<form action='#'>";
                        take_string += "<div class='field is-horizontal'>";
                        let inventory_price = 0;
                        if(inventory_item.price) {
                            inventory_price = inventory_item.price;
                        }
                        take_string += "<input type='text' class='input' style='width:84px;' name='price_" + inventory_item.id + "' id='price_" + inventory_item.id +"' value='" + inventory_price +"'>";
                        take_string += "<input class='button is-default' onclick=\"submitPriceUpdate(" + inventory_item.id + "); return false;\" type=\"submit\" value=\"Sell\">";
                        take_string += "</div>";
                        take_string += "</form>";

                        take_string += "</div>";
                    }

                    if(objects[object_index].object_type_id === 92) {
                        take_string += "</div>";
                    }


                }
                // It's something that is being sold
                else if (inventory_item.price) {
                    take_string += "<img style='width:28px;' src='https://space.alphacoders.com/images/" + urlName(object_types[inventory_item_object_type_index].name) + ".png'>" +
                        "<button class='button is-default' id='buy_" + inventory_item.id + "' storage_object_id='" + objects[object_index].id + "' " +
                        " inventory_item_id='" + inventory_item.id + "'>Buy $" + inventory_item.price + "</button><br>";
                } 



            }
        });

        take_string += "</div>";

        $('#click_menu').append(take_string);

        $('#click_menu').append("<br>");

}


function generateTaskDisplay() {

    if (!$("#task_management").is(":visible")) {
        return false;
    }

    if (client_player_index === -1) {
        return false;
    }

    console.log("In generateTaskDisplay");

    use_tasks = localStorage.getItem('use_tasks');


    

    $('#task_management').empty();

    let html_string = "";
    html_string += "<div class='message is-info message-inline'><div class='message-body'>";

    // Lets try a close button
    html_string += "Not sure what you CAN do? Tasks are a way of guiding you to explore features of Space Abyss!<br><br>";

    if(!use_tasks){
        html_string += "<button id='activatetasks' class='button is-success'>Activate Our Task System</button><br><br>";
    }
    

    html_string += "<strong>Tasks:</strong><br>";
    for(let i = 0; i < tasks.length; i++) {


        // see if the task is completed
        let completed_task = localStorage.getItem("task_" + tasks[i].id);

        if(completed_task) {
            html_string += "<span class='tag is-success'>" + tasks[i].name + " <i class='fad fa-check-circle'></i></span>";
        } else {
            html_string += tasks[i].name;


            if(use_tasks) {
                html_string += ": " + tasks[i].description;
            }
        }

        
        html_string += "<br>";
    }


    html_string += "<br><strong>NOTE:</strong> Tasks are meant to be helpful, and are only stored on your local browser. " +
        " So don't get too attached to the idea of having them all marked as complete.";


    html_string += "</div></div>";


    $('#click_menu').empty();
    $('#click_menu').hide();

    $('#task_management').append(html_string);


}

/**
 * @param {Object} data
 * @param {number=} data.coord_id
 * @param {number=} data.tile_x
 * @param {number=} data.tile_y
 */
function getCoordIndex(data) {
    if (data.coord_id) {
        return coords.findIndex(function (obj) { return obj && obj.id === parseInt(data.coord_id); });
    } else {
        return coords.findIndex(function (obj) { return obj && obj.tile_x === parseInt(data.tile_x) && obj.tile_y === parseInt(data.tile_y); });
    }
}

function getCoordNeighbor(coord_type, coord_index, direction) {

    let debug_coord_ids = [13305,13306];

    let current_coord = {};

    if(coord_type === 'ship') {
        current_coord = ship_coords[coord_index];
    } else if(coord_type === 'galaxy') {
        current_coord = coords[coord_index];
    } else if(coord_type === 'planet') {
        current_coord = planet_coords[coord_index];
    }

    if(isFalse(current_coord)) {
        console.log("Invalid coord sent in. " + coord_type + " index: " + coord_index);
        return false;
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

        adjacent_coord_index = getShipCoordIndex(adjacent_coord_data);
    } else if(coord_type === 'planet') {
        adjacent_coord_data.planet_id = current_coord.planet_id;
        adjacent_coord_data.planet_level = current_coord.level;

        adjacent_coord_index = getPlanetCoordIndex(adjacent_coord_data);
    } else if(coord_type === 'galaxy') {
        adjacent_coord_index = getCoordIndex(adjacent_coord_data);
    }


    if(direction === 'down') {
        current_coord.down_coord_index = adjacent_coord_index;

        if(debug_coord_ids.indexOf(current_coord.id) !== -1) {
            console.log("coord id: " + current_coord.id + " set down coord index to: " + current_coord.down_coord_index);
        }

        //if(current_coord.up_coord_index === "undefined") {
        //    current_coord.up_coord_index = adjacent_coord_index;
        //}

        if(adjacent_coord_index !== -1 && coord_type === 'ship' && typeof ship_coords[adjacent_coord_index].up_coord_index === "undefined") {

            if(debug_coord_ids.indexOf(ship_coords[adjacent_coord_index].id) !== -1) {
                console.log("%c Updated coord id: " + ship_coords[adjacent_coord_index].id + " up_coord_index from: " + ship_coords[adjacent_coord_index].up_coord_index + " to: " + 
                    coord_index);
            }
            ship_coords[adjacent_coord_index].up_coord_index = coord_index;
        /*
        if(adjacent_coord_index !== -1 && coord_type === 'ship' && ( typeof ship_coords[adjacent_coord_index].up_coord_index === "undefined" || ship_coords[adjacent_coord_index].up_coord_index === -1 )) {
            ship_coords[adjacent_coord_index].up_coord_index = coord_index;

            console.log("Ship coord needed up coord index updated");

            if(ship_coords[adjacent_coord_index].object_type_id) {
                let adjacent_object_type_index = getObjectTypeIndex(ship_coords[adjacent_coord_index].object_type_id);
                if(object_types[adjacent_object_type_index].is_wall) {
                    console.log("Redrawing wall");
                    mapAddWall(ship_coords[adjacent_coord_index], adjacent_object_type_index, ship_coords[adjacent_coord_index].tile_x, ship_coords[adjacent_coord_index].tile_y);
                }
                
            }
            */

        } else if(adjacent_coord_index !== -1 && coord_type === 'planet' && typeof planet_coords[adjacent_coord_index].up_coord_index === "undefined") {
            planet_coords[adjacent_coord_index].up_coord_index = coord_index;
        } else if(adjacent_coord_index !== -1 && coord_type === 'galaxy' && typeof coords[adjacent_coord_index].up_coord_index === "undefined") {
            coords[adjacent_coord_index].up_coord_index = coord_index;
        }
    } else if(direction === 'up') {
        current_coord.up_coord_index = adjacent_coord_index;

        if(adjacent_coord_index !== -1 && coord_type === 'ship' && typeof ship_coords[adjacent_coord_index].down_coord_index === "undefined") {

            if(debug_coord_ids.indexOf(ship_coords[adjacent_coord_index].id) !== -1) {
                console.log("%c Updated coord id: " + ship_coords[adjacent_coord_index].id + " down_coord_index from: " + ship_coords[adjacent_coord_index].down_coord_index + " to: " + 
                    coord_index);
            }
            ship_coords[adjacent_coord_index].down_coord_index = coord_index;

        /*
        if(adjacent_coord_index !== -1 && coord_type === 'ship' && (typeof ship_coords[adjacent_coord_index].down_coord_index === "undefined" || ship_coords[adjacent_coord_index].down_coord_index === -1)) {
            ship_coords[adjacent_coord_index].down_coord_index = coord_index;
            console.log("Ship coord needed down coord index updated");
            if(debug_coord_ids.indexOf(ship_coords[adjacent_coord_index].id) !== -1) {
                console.log("Our debug coord id " + ship_coords[adjacent_coord_index].id + " needed its down coord index updated");
            }


            if(ship_coords[adjacent_coord_index].object_type_id) {
                let adjacent_object_type_index = getObjectTypeIndex(ship_coords[adjacent_coord_index].object_type_id);
                if(object_types[adjacent_object_type_index].is_wall) {
                    console.log("Redrawing wall");
                    mapAddWall(ship_coords[adjacent_coord_index], adjacent_object_type_index, ship_coords[adjacent_coord_index].tile_x, ship_coords[adjacent_coord_index].tile_y);
                }
                
            }
            */  
    
           
        } else if(adjacent_coord_index !== -1 && coord_type === 'planet' && typeof planet_coords[adjacent_coord_index].down_coord_index === "undefined") {
            planet_coords[adjacent_coord_index].down_coord_index = coord_index;
        } else if(adjacent_coord_index !== -1 && coord_type === 'galaxy' && typeof coords[adjacent_coord_index].down_coord_index === "undefined") {
            coords[adjacent_coord_index].down_coord_index = coord_index;
        }
    } else if(direction === 'left') {
        current_coord.left_coord_index = adjacent_coord_index;

        if(adjacent_coord_index !== -1 && coord_type === 'ship' && typeof ship_coords[adjacent_coord_index].right_coord_index === "undefined") {
            ship_coords[adjacent_coord_index].right_coord_index = coord_index;
        } else if(adjacent_coord_index !== -1 && coord_type === 'planet' && typeof planet_coords[adjacent_coord_index].right_coord_index === "undefined") {
            planet_coords[adjacent_coord_index].right_coord_index = coord_index;
        } else if(adjacent_coord_index !== -1 && coord_type === 'galaxy' && typeof coords[adjacent_coord_index].right_coord_index === "undefined") {
            coords[adjacent_coord_index].right_coord_index = coord_index;
        }
    } else if(direction === 'right') {
        current_coord.right_coord_index = adjacent_coord_index;

        if(adjacent_coord_index !== -1 && coord_type === 'ship' && typeof ship_coords[adjacent_coord_index].left_coord_index === "undefined") {
            ship_coords[adjacent_coord_index].left_coord_index = coord_index;
        } else if(adjacent_coord_index !== -1 && coord_type === 'planet' && typeof planet_coords[adjacent_coord_index].left_coord_index === "undefined") {
            planet_coords[adjacent_coord_index].left_coord_index = coord_index;
        } else if(adjacent_coord_index !== -1 && coord_type === 'galaxy' && typeof coords[adjacent_coord_index].left_coord_index === "undefined") {
            coords[adjacent_coord_index].left_coord_index = coord_index;
        }
    }

    return adjacent_coord_index;

}

function getFloorTypeIndex(floor_type_id) {
    return floor_types.findIndex(function (obj) { return obj && obj.id === parseInt(floor_type_id); });
}

function getMonsterIndex(monster_id) {
    let monster_index = -1;
    monster_id = parseInt(monster_id);

    if (isNaN(monster_id)) {
        return monster_index;
    }

    monster_index = monsters.findIndex(function (obj) { return obj && obj.id === monster_id; });

    return monster_index;
}

function getNpcIndex(npc_id) {
    let npc_index = -1;
    npc_id = parseInt(npc_id);

    if (isNaN(npc_id)) {
        return npc_index;
    }

    npc_index = npcs.findIndex(function (obj) { return obj && obj.id === npc_id; });

    return npc_index;
}

function getObjectIndex(object_id) {
    let object_index = -1;
    object_id = parseInt(object_id);

    if (isNaN(object_id)) {
        return object_index;
    }

    object_index = objects.findIndex(function (obj) { return obj && obj.id === object_id; });

    return object_index;
}

function getObjectTypeIndex(object_type_id) {
    let object_type_index = -1;
    object_type_id = parseInt(object_type_id);

    if (isNaN(object_type_id)) {
        return object_type_index;
    }

    object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === object_type_id; });

    return object_type_index;
}

/**
 * 
 * @param {Object} data 
 * @param {number} data.planet_id
 */
function getPlanetIndex(data) {
    return planets.findIndex(function (obj) { return obj && obj.id === parseInt(data.planet_id); });
}

/**
 * @param {Object} data
 * @param {number=} data.planet_coord_id
 * @param {number=} data.planet_id
 * @param {number=} data.planet_level
 * @param {number=} data.tile_x
 * @param {number=} data.tile_y
 */
function getPlanetCoordIndex(data) {

    if(typeof data.planet_coord_id !== 'undefined') {

        return planet_coords.findIndex(function(obj) { return obj && obj.id === parseInt(data.planet_coord_id); });
    } else {
        return planet_coords.findIndex(function (obj) {
            return obj && obj.planet_id === parseInt(data.planet_id) &&
                obj.level === parseInt(data.planet_level) && obj.tile_x === parseInt(data.tile_x) &&
                obj.tile_y === parseInt(data.tile_y);
        });
    }
    
}

function getPlayerIndex(player_id) {
    let player_index = -1;
    player_id = parseInt(player_id);

    if (isNaN(player_id)) {
        return player_index;
    }

    player_index = players.findIndex(function (obj) { return obj && obj.id === player_id; });

    return player_index;
}

//  data:   ship_id   |   level   |    tile_x   |   tile_y
/**
 * @param {number=} ship_coord_id
 * @param {number=} ship_id
 * @param {number=} level
 * @param {number=} tile_x
 * @param {number=} tile_y
 */
function getShipCoordIndex(data) {


    if(typeof data.ship_coord_id !== 'undefined') {
        return ship_coords.findIndex(function(obj) { return obj && obj.id === parseInt(data.ship_coord_id); });
    } else {
        return ship_coords.findIndex(function (obj) {
            return obj && obj.ship_id === parseInt(data.ship_id) &&
                obj.level === parseInt(data.level) &&
                obj.tile_x === parseInt(data.tile_x) && obj.tile_y === parseInt(data.tile_y);
        });
    }


}

function halfTile() {
    return parseInt(tile_size / 2);
}

function mapAddFloor(floor_type_id, tile_x, tile_y, coord) {

    let floor_type_index = floor_types.findIndex(function (obj) { return obj && obj.id === parseInt(floor_type_id); });

    if (floor_type_index === -1) {
        return false;
    }


    // see if we have display linker for this floor type
    let display_linkers = floor_type_display_linkers.filter(
        display_linker => display_linker.floor_type_id === floor_types[floor_type_index].id);

    if (display_linkers.length > 0) {
        //console.log("Using floor display linkers for floor type id: " + floor_types[floor_type_index].id);
        display_linkers.forEach(function (linker) {
            let linker_tile_x = tile_x + linker.position_x;
            let linker_tile_y = tile_y + linker.position_y;

            let current_tile = map.getTileAt(linker_tile_x, linker_tile_y, false, linker.layer);

            // Draw it if it's not there, or we don't have an animator controlling it
            if (!current_tile || (current_tile.index !== linker.game_file_index && !floor_types[floor_type_index].is_animated)) {
                map.putTileAt(linker.game_file_index, linker_tile_x, linker_tile_y, false, linker.layer);
            } else {
                //console.log("Not drawing linker floor");
            }

            //console.log("Putting game file index " + linker.game_file_index + " at " + linker_tile_x + "," + linker_tile_y + " on layer " + linker.layer);

        });
    } else if (coord.watched_by_object_id) {
        let current_tile = map.getTileAt(tile_x, tile_y, false, 'layer_floor');
        if (!current_tile || current_tile.index !== 58) {
            map.putTileAt(58, tile_x, tile_y, false, 'layer_floor');
        }
    }
    else {



        let current_tile = map.getTileAt(tile_x, tile_y, false, 'layer_floor');
        if (!current_tile || current_tile.index !== floor_types[floor_type_index].game_file_index) {
            map.putTileAt(floor_types[floor_type_index].game_file_index, tile_x, tile_y, false, 'layer_floor');
        }
        //console.log("Adding floor game file index to map: "  + floor_types[floor_type_index].game_file_index);

    }



}

function mapAddObjectType(coord, tile_x, tile_y) {
    object_type_id = coord.object_type_id;
    let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === parseInt(object_type_id); });


    if (object_type_index === -1) {
        return false;
    }

    if(object_types[object_type_index].is_wall) {
        mapAddWall(coord, object_type_index, tile_x, tile_y);
        return;
    }

    // we might have display linkers for this
    let display_linkers = object_type_display_linkers.filter(linker =>
        linker.object_type_id === object_types[object_type_index].id);


    // We have display linkers
    if (display_linkers.length > 0) {


        display_linkers.forEach(function (linker) {
            let linker_tile_x = parseInt(tile_x + linker.position_x);
            let linker_tile_y = parseInt(tile_y + linker.position_y);



            // TODO Test this more. Seems like we do actually need to check below too, since when we move around we are grabbing
            // TODO     tiles in different orders



            // Temp replace with a different above
            //if(linker.object_type_id === 215 && linker.position_y === -1) {
            //    map.putTileAt(10, linker_tile_x, linker_tile_y, false, linker.layer);
            //}

            // WALLS
            // For walls, we have an additional extended tile for when there is a wall above/below
            if (object_types[object_type_index].is_wall && linker.position_x === 0 && linker.position_y === 0) {

                if (linker_tile_x === 2 && linker_tile_y === 19) {
                    console.log("At 2,19");
                }

                let above_y = parseInt(linker_tile_y - 1);
                let below_y = parseInt(linker_tile_y + 1);
                let above_index = -1;
                let below_index = -1;
                let coord_above = false;
                let coord_below = false;

                if (current_view === 'ship') {
                    above_index = ship_coords.findIndex(function (obj) {
                        return obj && obj.tile_x === linker_tile_x &&
                            obj.tile_y === above_y;
                    });
                    below_index = ship_coords.findIndex(function (obj) {
                        return obj && obj.tile_x === linker_tile_x &&
                            obj.tile_y === below_y;
                    });

                    if (above_index !== -1) {
                        coord_above = ship_coords[above_index];
                    }

                    if (below_index !== -1) {
                        coord_below = ship_coords[below_index];
                    }
                } else if (current_view === 'planet') {
                    above_index = planet_coords.findIndex(function (obj) {
                        return obj && obj.tile_x === linker_tile_x &&
                            obj.tile_y === above_y;
                    });
                    below_index = planet_coords.findIndex(function (obj) {
                        return obj && obj.tile_x === linker_tile_x &&
                            obj.tile_y === below_y;
                    });

                    if (above_index !== -1) {
                        coord_above = planet_coords[above_index];
                    }

                    if (below_index !== -1) {
                        coord_below = planet_coords[below_index];
                    }
                } else {
                    //console.log("Current view is not ship or planet: " + current_view);
                }



                let current_tile = map.getTileAt(linker_tile_x, linker_tile_y, false, linker.layer);
                let extended_index = linker.game_file_index + 1;

                // If there's a wall above, it needs to be extended
                if (above_index !== -1 && coord_above.object_type_id === object_types[object_type_index].id) {


                    // Lets see if we need to change the tile
                    let above_tile = map.getTileAt(linker_tile_x, above_y, false, linker.layer);

                    if (above_tile && above_tile.index === extended_index) {
                        // don't have to change it

                    } else {

                        // Do the linker's game file index instead of the object game file index. Increased flexibility.
                        map.putTileAt(extended_index, linker_tile_x, above_y, false, linker.layer);

                    }
                }

                // If there's a wall below, our coord needs to be extended!
                if (below_index !== -1 && coord_below.object_type_id === object_types[object_type_index].id) {


                    if (current_tile && current_tile.index === extended_index) {
                        // nothing to do
                    } else {
                        map.putTileAt(extended_index, linker_tile_x, linker_tile_y, false, linker.layer);
                    }


                }
                // Default for our current tile
                else {

                    if (!current_tile || current_tile.index !== linker.game_file_index) {
                        map.putTileAt(linker.game_file_index, linker_tile_x, linker_tile_y, false, linker.layer);
                    }


                }


            } else {
                map.putTileAt(linker.game_file_index, linker_tile_x, linker_tile_y, false, linker.layer);
            }



            // Lets try and test a very specific case. Ship wall, and try to do extended ones if there is already a wall below
            /*
            if(object_types[object_type_index].id === 215 && linker.position_x === 0 && linker.position_y === 0) {

                let above_y = parseInt(linker_tile_y - 1);
                let below_y = parseInt(linker_tile_y + 1);

                // see if there's supposed to be a wall below ( we draw top -> down, so there won't be anything on the map itself yet )
                // Not even sure if we'll have the coord at this point. Might need to check above as well
                if(current_view === 'ship') {



                    let ship_coord_above_index = ship_coords.findIndex(function(obj) { return obj && obj.tile_x === linker_tile_x &&
                        obj.tile_y === above_y; });


                    if(ship_coord_above_index !== -1) {

                        if(ship_coords[ship_coord_above_index].object_type_id === 215) {
                            map.putTileAt(271, linker_tile_x, above_y, false, linker.layer);
                        }
                    }

                    let ship_coord_below_index = ship_coords.findIndex(function(obj) { return obj && obj.tile_x === linker_tile_x &&
                        obj.tile_y === above_y; });

                    if(ship_coord_below_index !== -1) {
                        if(ship_coords[ship_coord_below_index].object_type_id === 215) {
                            map.putTileAt(271, linker_tile_x, above_y, false, linker.layer);
                        }
                    }

                }

            } else if(object_types[object_type_index].id === 61 && linker.position_x === 0 && linker.position_y === 0) {
                let above_y = parseInt(linker_tile_y - 1);

                if(current_view === 'planet') {
                    let planet_coord_above_index = planet_coords.findIndex(function(obj) { return obj && obj.tile_x === linker_tile_x &&
                        obj.tile_y === above_y; });


                    if(planet_coord_above_index !== -1) {

                        if(planet_coords[planet_coord_above_index].object_type_id === 61) {
                            map.putTileAt(274, linker_tile_x, above_y, false, linker.layer);
                        }
                    }
                }
            }
            */




        });


    } else {
        // The normal display
        let layer = 'layer_object';


        //console.log("Putting game file index: " + object_types[object_type_index].game_file_index + " at tile_x,tile_y: " + tile_x + "," + tile_y);
        map.putTileAt(object_types[object_type_index].game_file_index, tile_x, tile_y, false, layer);
    }



}

// If we need to access something here, we need to make sure map.js in planet_data and ship_data is sending the data
function mapAddObject(object) {


    if (!object) {
        return false;
    }

    let object_index = objects.findIndex(function (obj) { return obj && obj.id === object.id; });

    if (object_index === -1) {
        
        return false;
    }

    let object_info = getObjectInfo(object_index);

    if (!object_info.coord && !objects[object_index].docked_at_planet_id && !objects[object_index].docked_at_object_id) {

        console.log("Could not get coord for object id: " + object.id);
        socket.emit('request_fix', { 'object_id': object.id });
        console.log("Sent request_fix");
        
        return false;
    }

    let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === objects[object_index].object_type_id; });

    if (object_type_index === -1) {
        console.log("%c No object type id for object id: " + object.id + " ?!?", log_danger);
        return false;
    }

    //console.log("In mapAddObject for: " + object_types[object_type_index].name);

    // see if the object type has display linkers

    // I THINK that for this, we just want to show only the original and the visual ones
    // Since I THINK we are going to have belongs_to_object_id put on non-just visual tiles
    // For now lets just draw all of them and see if anything goes wrong
    // TODO support spawning with display linkers
    let display_linkers = object_type_display_linkers.filter(linker =>
        linker.object_type_id === object_types[object_type_index].id);



    if (display_linkers.length > 0) {


        // If the object has a spawned object, we'll need to increase the linker game file indexes by the width of the object
        if(notFalse(object.has_spawned_object)) {
         
            let object_width = 1;
            for(let i = 0; i < display_linkers.length; i++) {
                if(display_linkers[i].position_x + 1 > object_width) {
                    object_width = display_linkers[i].position_x + 1;
                }
            }

            //console.log("Set object with spawned object width to: " + object_width);

            display_linkers.forEach(function (linker) {

                let linker_final_game_file_index = linker.game_file_index + object_width;

                let linker_tile_x = object_info.coord.tile_x + linker.position_x;
                let linker_tile_y = object_info.coord.tile_y + linker.position_y;

    
                let current_tile = map.getTileAt(linker_tile_x, linker_tile_y, false, linker.layer);
    
                // Draw it if it's not there, or we don't have an animator controlling it
                if (!current_tile || (current_tile.index !== linker_final_game_file_index)) {
                    map.putTileAt(linker_final_game_file_index, linker_tile_x, linker_tile_y, false, linker.layer);
    
                }
    
            });
        } 
        // we can draw the object based directly on its linkers
        else {
            display_linkers.forEach(function (linker) {
                let linker_tile_x = object_info.coord.tile_x + linker.position_x;
                let linker_tile_y = object_info.coord.tile_y + linker.position_y;
    
                let current_tile = map.getTileAt(linker_tile_x, linker_tile_y, false, linker.layer);
    
                // Draw it if it's not there, or we don't have an animator controlling it
                if (!current_tile || (current_tile.index !== linker.game_file_index)) {
                    map.putTileAt(linker.game_file_index, linker_tile_x, linker_tile_y, false, linker.layer);
    
                }
    
            });
        }


     


    } 
    // There are a few more options for objects that aren't larger than 1x1
    else {
        if (object.has_spawned_object && (object.has_spawned_object === true || object.has_spawned_object === 1)) {


            //console.log("%c Using has_spawned_object_game_file_index", log_warning);
            //console.log("Spawned object at " + object_info.coord.tile_x);
            map.putTileAt(object_types[object_type_index].has_spawned_object_game_file_index, object_info.coord.tile_x, object_info.coord.tile_y, false, 'layer_object');

        }  else if(object.energy && object.energy >= object_types[object_type_index].max_energy_storage && object_types[object_type_index].is_full_game_file_index > 0) {
            map.putTileAt(object_types[object_type_index].is_full_game_file_index, object_info.coord.tile_x, object_info.coord.tile_y, false, 'layer_object');
        }
        
        else {
            let layer = 'layer_object';

            // make sure the object isn't a ship
            // I think I like having this check outside of mapDrawObject
            /*
            let is_active_ship = false;
            players.forEach(function (player, i) {
                if (player.ship_id === object.id) {
                    is_actives_ship = true;
                    //console.log("Not drawing object id: " + object.id + " on tilemap. is active ship");
                }
            });
            */

            //if (!is_active_ship) {


                map.putTileAt(object_types[object_type_index].game_file_index, object_info.coord.tile_x, object_info.coord.tile_y, false, layer);
            //}


        }
    }




}

function mapAddWall(coord, object_type_index, tile_x, tile_y) {

    let debug_coord_ids = [];

    if(debug_coord_ids.indexOf(coord.id) !== -1) {
        console.log("%c In mapAddWall for debug coord id: " + coord.id, log_warning);
    }


    let coord_index = -1;
    let scope = 'planet';
    
    if(coord.planet_id) {
        coord_index = planet_coords.findIndex(function(obj) { return obj && obj.id === coord.id; });
    } else if(coord.ship_id) {
        scope = 'ship';
        coord_index = ship_coords.findIndex(function(obj) { return obj && obj.id === coord.id; });
    }

    

    if(coord_index === -1) {
        console.log("Could not find the coord the wall is on");
        return false;
    }

    // look for coords above or below us. If either has our index as -1, we have to update them as well

    getCoordNeighbor(scope, coord_index, 'up');
    getCoordNeighbor(scope, coord_index, 'down');

    let wall_above = false;
    let wall_below = false;


    // There's a coord below
    if(coord.down_coord_index !== -1) {

        if(debug_coord_ids.indexOf(coord.id) !== -1) {
            console.log("There is a coord below. down_coord_index: " + coord.down_coord_index);
        }

        let down_coord = {};
        if(scope === 'planet' && planet_coords[coord.down_coord_index]) {
            down_coord = planet_coords[coord.down_coord_index];
        } else if(scope === 'ship' && ship_coords[coord.down_coord_index]) {
            down_coord = ship_coords[coord.down_coord_index];
        }

        if(notFalse(down_coord) && down_coord.object_type_id) {

            let down_coord_object_type_index = getObjectTypeIndex(down_coord.object_type_id);
    
            if(object_types[down_coord_object_type_index].is_wall) {
                wall_below = true;
            }
    
    
            // The coord below us didn't have correct information about what was above it
            if(down_coord.up_coord_index === 'undefined' || down_coord.up_coord_index === -1 && 
                object_types[down_coord_object_type_index].is_wall) {
                //console.log("Coord below needs to be updated");

                if(debug_coord_ids.indexOf(coord.id) !== -1) {
                    console.log("Coord below needs to be updated");
                }
                

                mapAddWall(down_coord, down_coord_object_type_index, down_coord.tile_x, down_coord.tile_y);
                
                
            }
        }

        
    }


    // There's a coord above
    if(coord.up_coord_index !== -1) {

        if(debug_coord_ids.indexOf(coord.id) !== -1) {
            console.log("There is a coord above");
        }

        let up_coord = {};
        if(scope === 'planet' && planet_coords[coord.up_coord_index]) {
            up_coord = planet_coords[coord.up_coord_index];
        } else if(scope === 'ship' && ship_coords[coord.up_coord_index]) {
            up_coord = ship_coords[coord.up_coord_index];
        }

        if(notFalse(up_coord) && up_coord.object_type_id) {
            if(debug_coord_ids.indexOf(coord.id) !== -1) {
                console.log("Coord above has an object type id");
            }
    
            let up_coord_object_type_index = getObjectTypeIndex(up_coord.object_type_id);
    
            if(object_types[up_coord_object_type_index].is_wall) {
                if(debug_coord_ids.indexOf(coord.id) !== -1) {
                    console.log("Coord above object type is a wall");
                }
                wall_above = true;
            }

            if(debug_coord_ids.indexOf(coord.id) !== -1) {
                console.log("Coord above (id: " + up_coord.id + ") down_coord_index: " + up_coord.down_coord_index);
            }
    
            // The coord above us didn't have correct information about what was below it
            if(typeof up_coord.down_coord_index === 'undefined' || up_coord.down_coord_index === -1 && 
                object_types[up_coord_object_type_index].is_wall) {
                
                    if(debug_coord_ids.indexOf(coord.id) !== -1) {
                        console.log("Coord above needs to be updated");
                    }
                
    
                mapAddWall(up_coord, up_coord_object_type_index, up_coord.tile_x, up_coord.tile_y);
    
                
            }
        }
    }
    

    if(debug_coord_ids.indexOf(coord.id) !== -1) {
        console.log("Wall above: " + wall_above + " wall below: " + wall_below);
    }

    let above_display_linker_index = object_type_display_linkers.findIndex(function(obj) { return obj.object_type_id === object_types[object_type_index].id && 
        obj.layer === 'layer_above'; });
    let face_display_linker_index = object_type_display_linkers.findIndex(function(obj) { return obj.object_type_id === object_types[object_type_index].id && 
        obj.layer === 'layer_object'; });

    // and now us - if we have no wall below, just draw the face
    if(!wall_below) {
        if(debug_coord_ids.indexOf(coord.id) !== -1) {
            console.log("Coord id: " + coord.id + " Placed full face");
            console.log("Placed object game file index: " + object_type_display_linkers[face_display_linker_index].game_file_index);
        }

        map.putTileAt(object_type_display_linkers[face_display_linker_index].game_file_index, coord.tile_x, coord.tile_y, false, 'layer_object');
    } else if(wall_above) {
        if(debug_coord_ids.indexOf(coord.id) !== -1) {
            console.log("Coord id: " + coord.id + " Placed full above tile");
        }
        map.putTileAt(object_type_display_linkers[above_display_linker_index].game_file_index, coord.tile_x, coord.tile_y, false, 'layer_above');
    } else if(!wall_above && wall_below) {
        map.putTileAt(object_type_display_linkers[above_display_linker_index].game_file_index, coord.tile_x, coord.tile_y, false, 'layer_above');
    }
    
    if(!wall_above) {
        //console.log("Placed 1/2 above tile");
        if(coord.tile_y === 0) {
            map.putTileAt(object_type_display_linkers[above_display_linker_index].game_file_index, coord.tile_x, coord.tile_y, false, 'layer_above');
        } else {
            map.putTileAt(object_type_display_linkers[above_display_linker_index].game_file_index + 1, coord.tile_x, coord.tile_y -1, false, 'layer_above');
        }
        
    }
    
    if(debug_coord_ids.indexOf(coord.id) !== -1) {
        console.log("At the end of mapAddWall, coord id: " + coord.id + " down_coord_index: " + coord.down_coord_index);
    }



}

function checkForClientMove(time, tile_x = false, tile_y = false) {


    let debug_moving = false;


    if (client_player_index === -1) {

        if(debug_moving) {
            console.log("Don't have client player");
        }
        return false;
    }

    if (!upKey.isDown && !downKey.isDown && !leftKey.isDown && !rightKey.isDown) {

        return false;
    }

    let time_since_last_move = time - last_move_sent;

    // Trying -50 to see if it helps movement flow
    if (time_since_last_move < (move_delay - 50)) {

        if(debug_moving) {
            console.log("Client can't move yet");
        }
        
        return false;

    }

    if (tile_x !== false) {
        console.log("In movePlayer with tile_x,tile_y: " + tile_x + "," + tile_y);
    }


    let player_trying_to_move = false;
    let movement_direction = false;
    let checking_coord_index = -1;


    let player_info = getPlayerInfo(client_player_index);

    if (!player_info.coord) {
        if(debug_moving) {
            console.log("Could not find player's coord");
        }
        return false;
    }



    // Player is trying to move
    if (upKey.isDown || downKey.isDown || leftKey.isDown || rightKey.isDown) {

        //console.log("%c User is trying to move player and move is available", log_success);
        player_trying_to_move = true;

        // get our movement direction


        let tile_x_checking = false;
        let tile_y_checking = false;
        let player_coord_index = -1;


        // ship_coord_id before coord_id is important since being on our ship is a view - ship is still on a galaxy coord
        if (players[client_player_index].ship_coord_id) {

            // return false if the client and server don't agree on the ship coord the client is on
            if (client_move_ship_coord_id && client_move_ship_coord_id !== players[client_player_index].ship_coord_id) {
                console.log("%c Server and client don't agree on the ship coord the player is on", log_warning);

                // If it's been this way for a while (testing at 2 seconds), reset the client back to server
                let been_this_way_time = our_time - players[client_player_index].move_start_time;
                if (been_this_way_time > 2000) {
                    console.log("Been this way too long. " + been_this_way_time + "ms. Resetting player");
                    addLagText();




                    client_move_ship_coord_id = 0;
                    let return_to_ship_coord_index = ship_coords.findIndex(function (obj) { return obj && obj.id === players[client_player_index].ship_coord_id; });
                    if (return_to_ship_coord_index !== -1) {
                        let return_x = ship_coords[return_to_ship_coord_index].tile_x * tile_size + tile_size / 2;
                        let return_y = ship_coords[return_to_ship_coord_index].tile_y * tile_size + tile_size / 2;
                        movePlayerInstant(client_player_index, return_x, return_y);
                    }

                }
                return false;
            }

            player_coord_index = ship_coords.findIndex(function (obj) { return obj && obj.id === players[client_player_index].ship_coord_id; });

            if (player_coord_index !== -1) {
                tile_x_checking = ship_coords[player_coord_index].tile_x;
                tile_y_checking = ship_coords[player_coord_index].tile_y;
            }
        } else if (players[client_player_index].coord_id) {

            if(debug_moving) {
                console.log("client is in galaxy");
            }

            // return false if the client and server don't agree on the galaxy coord the client is on
            if (client_move_coord_id && client_move_coord_id !== players[client_player_index].coord_id) {
                console.log("%c Server and client don't agree on the coord the player is on client_move_coord_id: " + client_move_coord_id + " player coord_id: " + players[client_player_index].coord_id, log_warning);

                // If it's been this way for a while (testing at 2 seconds), reset the client back to server
                let been_this_way_time = our_time - players[client_player_index].move_start_time;
                if (been_this_way_time > 2000) {
                    console.log("Been this way too long. " + been_this_way_time + "ms. Resetting player");
                    addLagText();
                    client_move_coord_id = 0;
                    let return_to_coord_index = coords.findIndex(function (obj) { return obj && obj.id === players[client_player_index].coord_id; });
                    if (return_to_coord_index !== -1) {
                        let return_x = coords[return_to_coord_index].tile_x * tile_size + tile_size / 2;
                        let return_y = coords[return_to_coord_index].tile_y * tile_size + tile_size / 2;
                        movePlayerInstant(client_player_index, return_x, return_y);
                    }

                }
                return false;
            }

            player_coord_index = coords.findIndex(function (obj) { return obj && obj.id === players[client_player_index].coord_id; });
            if (player_coord_index !== -1) {
                tile_x_checking = coords[player_coord_index].tile_x;
                tile_y_checking = coords[player_coord_index].tile_y;
            }
        } else if (players[client_player_index].planet_coord_id) {

            // return false if the client and server don't agree on the planet coord the client is on
            if (client_move_planet_coord_id && client_move_planet_coord_id !== players[client_player_index].planet_coord_id) {
                console.log("%c Server and client don't agree on the planet coord the player is on", log_warning);

                // If it's been this way for a while (testing at 2 seconds), reset the client back to server
                let been_this_way_time = our_time - players[client_player_index].move_start_time;
                if (been_this_way_time > 2000) {
                    console.log("Been this way too long. " + been_this_way_time + "ms. Resetting player");
                    addLagText();
                    client_move_planet_coord_id = 0;
                    let return_to_planet_coord_index = planet_coords.findIndex(function (obj) { return obj && obj.id === players[client_player_index].planet_coord_id; });
                    if (return_to_planet_coord_index !== -1) {
                        let return_x = planet_coords[return_to_planet_coord_index].tile_x * tile_size + tile_size / 2;
                        let return_y = planet_coords[return_to_planet_coord_index].tile_y * tile_size + tile_size / 2;
                        movePlayerInstant(client_player_index, return_x, return_y);
                    }

                }
                return false;
            }

            player_coord_index = planet_coords.findIndex(function (obj) { return obj && obj.id === players[client_player_index].planet_coord_id; });
            if (player_coord_index !== -1) {
                tile_x_checking = planet_coords[player_coord_index].tile_x;
                tile_y_checking = planet_coords[player_coord_index].tile_y;
            }
        }


        if (upKey.isDown) {
            movement_direction = 'up';
            tile_y_checking--;
            //user_player.player_image.animations.play('up', 2, true);
        } else if (downKey.isDown) {
            movement_direction = 'down';
            tile_y_checking++;
            //user_player.player_image.animations.play('idle', 2, true);
        } else if (leftKey.isDown) {
            movement_direction = 'left';
            tile_x_checking--;
            //user_player.player_image.animations.play('left', 2, true);
        } else if (rightKey.isDown) {
            movement_direction = 'right';
            tile_x_checking++;
            //user_player.player_image.animations.play('right', 2, true);
        }

        if (players[client_player_index].ship_coord_id) {
            checking_coord_index = ship_coords.findIndex(function (obj) {
                return obj && obj.tile_x === tile_x_checking &&
                    obj.level === player_info.coord.level && obj.tile_y === tile_y_checking;
            });
        } else if (players[client_player_index].coord_id) {
            checking_coord_index = coords.findIndex(function (obj) {
                return obj && obj.tile_x === tile_x_checking &&
                    obj.tile_y === tile_y_checking;
            });
        } else if (players[client_player_index].planet_coord_id) {
            //console.log("Finding planet coord at : " + tile_x_checking + "," + tile_y_checking + "level: " + player_info.coord.level +
            //    " planet id: " + player_info.coord.planet_id);
            checking_coord_index = planet_coords.findIndex(function (obj) {
                return obj && obj.tile_x === tile_x_checking &&
                    obj.tile_y === tile_y_checking && obj.level === player_info.coord.level && obj.planet_id === player_info.coord.planet_id;
            });
        }




    }


    /********************* MOBILE ******************************/
    if (tile_x !== false) {
        console.log("In mobile part of movePlayer");
        player_trying_to_move = true;
        if (players[client_player_index].ship_coord_id) {
            checking_coord_index = ship_coords.findIndex(function (obj) {
                return obj && obj.tile_x === tile_x &&
                    obj.tile_y === tile_y;
            });
        } else if (players[client_player_index].coord_id) {
            checking_coord_index = coords.findIndex(function (obj) {
                return obj && obj.tile_x === tile_x &&
                    obj.tile_y === tile_y;
            });
        } else if (players[client_player_index].planet_coord_id) {
            checking_coord_index = planet_coords.findIndex(function (obj) {
                return obj && obj.tile_x === tile_x &&
                    obj.tile_y === tile_y;
            });
        }

        if (tile_x > player_info.coord.tile_x) {
            movement_direction = 'right';
        } else if (tile_x < player_info.coord.tile_x) {
            movement_direction = 'left';
        } else if (tile_y > player_info.coord.tile_y) {
            movement_direction = 'down';
        } else if (tile_y < player_info.coord.tile_y) {
            movement_direction = 'up';
        }

        console.log("Set movement direction to: " + movement_direction);
        console.log("Player tile_x,tile_y: " + player_info.coord.tile_x + "," + player_info.coord.tile_y);
    }
    /*********************** END MOBILE PART? *********************/

    

    if (!player_trying_to_move) {
        if(debug_moving) {
            console.log("Player is not trying to move");
        }
        
        return false;
    }

    if (checking_coord_index === -1) {

        if(debug_moving) {
            console.log("Could not find coord to check");
        }
        

        // If our level is > 1 send it anyways - maybe we fall
        if (players[client_player_index].planet_coord_id && player_info.coord.level > 0) {
            console.log("Sending anyways to see if we fall");


            socket.emit('move_data', { 'movement_direction': movement_direction });
            last_move_sent = time;
            console.log("Sent move data from checkForClientMove");
        }
        return false;
    }


    let deny_move = false;




    //console.log("Checking coord with x,y: " + tile_x_checking + "," + tile_y_checking);

    // ship_coord_id before coord_id is important since being on our ship is a view - ship is still on a galaxy coord
    if (players[client_player_index].ship_coord_id) {

        let can_place_result = canPlacePlayer('ship', ship_coords[checking_coord_index], client_player_index);

        if (can_place_result === false) {

            if(debug_moving) {
                console.log("Can place in galaxy result false");
            }
            deny_move = true;
        }

        /* Removed this in favor of using our canPlacePlaceFunction. Only keeping in 0.2.28 incase we are missing some case in canPlacePlayer.
        if (ship_coords[checking_coord_index] && ship_coords[checking_coord_index].object_type_id) {
            let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === ship_coords[checking_coord_index].object_type_id; });

            if (object_type_index !== -1) {
                //console.log("%c Object type id at coord: " + ship_coords[checking_coord_index].object_type_id, log_warning);
                if (!object_types[object_type_index].can_walk_on) {
                    deny_move = true;
                }
            }

        }

        if (ship_coords[checking_coord_index].player_id) {
            deny_move = true;
        }

        if(ship_coords[checking_coord_index].monster_id) {
            deny_move = true;
        }
        */
    } else if (players[client_player_index].coord_id) {

        if(debug_moving) {
            console.log("Moving in galaxy");
        }
        


        // Special cases like if there's a planet
        if (coords[checking_coord_index].planet_id || coords[checking_coord_index].belongs_to_planet_id) {

        }
        // Normal cases
        else {

            let show_can_place_debug = false;
            if(debug_moving) {
                show_can_place_debug = true;
            }
            let can_place_result = canPlacePlayer('galaxy', coords[checking_coord_index], client_player_index, show_can_place_debug);


            if (can_place_result === false) {

                if(debug_moving) {
                    console.log("Can place in galaxy result false");
                }
                deny_move = true;
            }
        }


    } else if (players[client_player_index].planet_coord_id) {
        //console.log("Move is on planet coord");

        let can_place_result = canPlacePlayer('planet', planet_coords[checking_coord_index], client_player_index);

        if (can_place_result === false) {

            if(debug_moving) {
                console.log("Can place in galaxy result false");
            }
            deny_move = true;
        }
    }

    if (deny_move) {
        if(debug_moving) {
            console.log("Move was denied");
        }


        if(players[client_player_index].planet_coord_id) {

            //console.log("move failed on planet");

            if(last_failed_move_coord_id === planet_coords[checking_coord_index].id && getRandomIntInclusive(1,30) === 3) {
                addInfoNumber(players[client_player_index].sprite.x, players[client_player_index].sprite.y,
                    { 'fill_color': "#f44242", 'text': "Can't Move There" });
            }

            last_failed_move_coord_id = planet_coords[checking_coord_index].id;
        }
        
        
        return false;
    }

    if (movement_direction === false) {

        if(debug_moving) {
            console.log("Movement direction was false");
        }
        
        return false;
    }


    // AND START THE MOVE!
    if (players[client_player_index].ship_coord_id) {
        if(debug_moving) {
            console.log("Calling initiateMovePlayerFlow - ship");
        }
        initiateMovePlayerFlow(client_player_index, 'ship', ship_coords[checking_coord_index], 'movePlayer');
    } else if (players[client_player_index].planet_coord_id) {
        if(debug_moving) {
            console.log("Calling initiateMovePlayerFlow - planet");
        }
        initiateMovePlayerFlow(client_player_index, 'planet', planet_coords[checking_coord_index], 'movePlayer');
    } else if (players[client_player_index].coord_id) {
        if(debug_moving) {
            console.log("Calling initiateMovePlayerFlow - galaxy");
        }
        initiateMovePlayerFlow(client_player_index, 'galaxy', coords[checking_coord_index], 'movePlayer');
    }



    /*
    if(player_is_moving) {

        //user_player.player_image.animations.play('idle',2, true);

        if(moving_direction == 'up') {
            user_player.player_image.y--;
        } else if(moving_direction == 'down') {
            user_player.player_image.y++;
        } else if(moving_direction == 'left') {
            user_player.player_image.x--;
        } else if(moving_direction == 'right') {
            user_player.player_image.x++;
        }

        updateHealthDisplay(user_player);

        total_moved++;

        if(total_moved >= tile_size) {
            player_is_moving = false;
            total_moved = 0;
            console.log("Player is done moving");
        }
    }
    */
}



var monster_sprites = [];
monster_sprites.push({ 'key': 'acid-fiend',             'monster_type_id': 74, 'planet_type_id': 15, 'frame_width': 64, 'frame_height': 68, 'frame_count': 10, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'acid-fly',               'monster_type_id': 70, 'planet_type_id': 15, 'frame_width': 64, 'frame_height': 64, 'frame_count': 6, 'frame_rate': 12 });
monster_sprites.push({ 'key': 'algae-king',             'monster_type_id': 113, 'planet_type_id': 16, 'frame_width': 64, 'frame_height': 64, 'frame_count': 4, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'alphablue',              'monster_type_id': 145, 'frame_width': 126, 'frame_height': 128, 'frame_count': 10, 'frame_rate': 18 });
monster_sprites.push({ 'key': 'beetle-knight',          'monster_type_id': 148, 'frame_width': 64, 'frame_height': 64, 'frame_count': 1, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'bionic-crab',            'monster_type_id': 105, 'planet_type_id': 34, 'frame_width': 64, 'frame_height': 64, 'frame_count': 9, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'blossomtis',             'monster_type_id': 116, 'planet_type_id': 29, 'frame_width': 68, 'frame_height': 68, 'frame_count': 6, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'bluearray',              'monster_type_id': 143, 'frame_width': 64, 'frame_height': 64, 'frame_count': 10, 'frame_rate': 14 });
monster_sprites.push({ 'key': 'blueware',               'monster_type_id': 144, 'frame_width': 64, 'frame_height': 64, 'frame_count': 6, 'frame_rate': 14 });
monster_sprites.push({ 'key': 'burger-drone',           'monster_type_id': 118, 'planet_type_id': 30, 'frame_width': 64, 'frame_height': 64, 'frame_count': 23, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'burster',                'monster_type_id': 120, 'planet_type_id': 7, 'frame_width': 64, 'frame_height': 64, 'frame_count': 11, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'cherree',                'monster_type_id': 117, 'planet_type_id': 29, 'frame_width': 144, 'frame_height': 132, 'frame_count': 7, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'construction-worker',    'monster_type_id': 112, 'planet_type_id': 30, 'frame_width': 64, 'frame_height': 66, 'frame_count': 7, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'converted-mechanoid',    'monster_type_id': 146, 'frame_width': 72, 'frame_height': 70, 'frame_count': 18, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'crystal-guard',          'monster_type_id': 51,  'frame_width': 64, 'frame_height': 64, 'frame_count': 8, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'data-guard',             'monster_type_id': 136, 'planet_type_id': 19, 'frame_width': 64, 'frame_height': 68, 'frame_count': 8, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'forest-prince',          'monster_type_id': 147, 'frame_width': 160, 'frame_height': 140, 'frame_count': 8, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'frost-spider',           'monster_type_id': 114, 'planet_type_id': 11, 'frame_width': 64, 'frame_height': 64, 'frame_count': 3, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'gang-smasher',           'monster_type_id': 111, 'planet_type_id': 30, 'frame_width': 64, 'frame_height': 68, 'frame_count': 8, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'gang-gunner',            'monster_type_id': 110, 'planet_type_id': 30, 'frame_width': 64, 'frame_height': 66, 'frame_count': 9, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'gang-boss',              'monster_type_id': 109, 'planet_type_id': 30, 'frame_width': 64, 'frame_height': 82, 'frame_count': 7, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'jellyfish',              'monster_type_id': 108, 'planet_type_id': 34, 'frame_width': 64, 'frame_height': 64, 'frame_count': 8, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'mini-walker',            'monster_type_id': 149, 'frame_width': 82, 'frame_height': 88, 'frame_count': 10, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'primewall',              'monster_type_id': 134, 'frame_width': 160, 'frame_height': 122, 'frame_count': 13, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'observer',               'monster_type_id': 121, 'ship_type_id': 351, 'frame_width': 64, 'frame_height': 64, 'frame_count': 5, 'frame_rate': 6 });
monster_sprites.push({ 'key': 'sea-urchin',             'monster_type_id': 106, 'planet_type_id': 34, 'frame_width': 64, 'frame_height': 64, 'frame_count': 12, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'take-out-drone',         'monster_type_id': 119, 'planet_type_id': 30, 'frame_width': 64, 'frame_height': 64, 'frame_count': 24, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'trae',                   'monster_type_id': 44, 'planet_type_id': 29, 'frame_width': 104, 'frame_height': 104, 'frame_count': 10, 'frame_rate': 6 });
monster_sprites.push({ 'key': 'trae-seedling',          'monster_type_id': 48, 'planet_type_id': 29, 'frame_width': 72, 'frame_height': 72, 'frame_count': 6, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'trae-sproutling',        'monster_type_id': 101, 'planet_type_id': 29, 'frame_width': 64, 'frame_height': 64, 'frame_count': 5, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'vooard',                 'monster_type_id': 123, 'planet_type_id': 7, 'frame_width': 156, 'frame_height': 126, 'frame_count': 14, 'frame_rate': 10, 'x_offset': 0, 'y_offset': 0 });
monster_sprites.push({ 'key': 'widden',                 'monster_type_id': 42, 'ship_type_id': 352, 'frame_width': 138, 'frame_height': 120, 'frame_count': 10, 'frame_rate': 8 });
monster_sprites.push({ 'key': 'warmind',                'monster_type_id': 24, 'frame_width': 72, 'frame_height': 148, 'frame_count': 10, 'frame_rate': 8, 'y_offset': -32 });

// Not sure how to do it more efficiently than just calculate the new and old level for... every skill!
function checkLevelIncrease(old_player_data, new_player_data) {

    if (client_player_index === -1 || !players[client_player_index].sprite) {
        return false;
    }

    let drawing_x = players[client_player_index].sprite.x;
    let drawing_y = players[client_player_index].sprite.y;

    let old_control_level = 1 + Math.floor(level_modifier * Math.sqrt(old_player_data.control_skill_points));
    let new_control_level = 1 + Math.floor(level_modifier * Math.sqrt(new_player_data.control_skill_points));
    if (new_control_level > old_control_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'Control Skill Leveled Up!' });
        text_important.setText("Control Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_cooking_level = 1 + Math.floor(difficult_level_modifier * Math.sqrt(old_player_data.cooking_skill_points));
    let new_cooking_level = 1 + Math.floor(difficult_level_modifier * Math.sqrt(new_player_data.cooking_skill_points));
    if (new_cooking_level > old_cooking_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'Cooking Skill Leveled Up!' });
        text_important.setText("Cooking Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_corrosive_level = 1 + Math.floor(level_modifier * Math.sqrt(old_player_data.corrosive_skill_points));
    let new_corrosive_level = 1 + Math.floor(level_modifier * Math.sqrt(new_player_data.corrosive_skill_points));
    if (new_corrosive_level > old_corrosive_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'Corrosive Skill Leveled Up!' });
        text_important.setText("Corrosive Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_defending_level = 1 + Math.floor(level_modifier * Math.sqrt(old_player_data.defending_skill_points));
    let new_defending_level = 1 + Math.floor(level_modifier * Math.sqrt(new_player_data.defending_skill_points));
    if (new_defending_level > old_defending_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'Defending Skill Leveled Up!' });
        text_important.setText("Defending Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_electric_level = 1 + Math.floor(level_modifier * Math.sqrt(old_player_data.electric_skill_points));
    let new_electric_level = 1 + Math.floor(level_modifier * Math.sqrt(new_player_data.electric_skill_points));
    if (new_electric_level > old_electric_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'Electric Skill Leveled Up!' });
        text_important.setText("Electric Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_explosion_level = 1 + Math.floor(level_modifier * Math.sqrt(old_player_data.explosion_skill_points));
    let new_explosion_level = 1 + Math.floor(level_modifier * Math.sqrt(new_player_data.explosion_skill_points));
    if (new_explosion_level > old_explosion_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'Explosion Skill Leveled Up!' });
        text_important.setText("Explosion Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_farming_level = 1 + Math.floor(difficult_level_modifier * Math.sqrt(old_player_data.farming_skill_points));
    let new_farming_level = 1 + Math.floor(difficult_level_modifier * Math.sqrt(new_player_data.farming_skill_points));
    if (new_farming_level > old_farming_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'Farming Skill Leveled Up!' });
        text_important.setText("Farming Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_freeze_level = 1 + Math.floor(level_modifier * Math.sqrt(old_player_data.freeze_skill_points));
    let new_freeze_level = 1 + Math.floor(level_modifier * Math.sqrt(new_player_data.freeze_skill_points));
    if (new_freeze_level > old_freeze_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'Freeze Skill Leveled Up!' });
        text_important.setText("Freeze Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_hacking_level = 1 + Math.floor(level_modifier * Math.sqrt(old_player_data.hacking_skill_points));
    let new_hacking_level = 1 + Math.floor(level_modifier * Math.sqrt(new_player_data.hacking_skill_points));
    if (new_hacking_level > old_hacking_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'Hacking Skill Leveled Up!' });
        text_important.setText("Hacking Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_heat_level = 1 + Math.floor(level_modifier * Math.sqrt(old_player_data.heat_skill_points));
    let new_heat_level = 1 + Math.floor(level_modifier * Math.sqrt(new_player_data.heat_skill_points));
    if (new_heat_level > old_heat_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'heat Skill Leveled Up!' });
        text_important.setText("heat Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_gravity_level = 1 + Math.floor(level_modifier * Math.sqrt(old_player_data.gravity_skill_points));
    let new_gravity_level = 1 + Math.floor(level_modifier * Math.sqrt(new_player_data.gravity_skill_points));
    if (new_gravity_level > old_gravity_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'gravity Skill Leveled Up!' });
        text_important.setText("gravity Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_laser_level = 1 + Math.floor(level_modifier * Math.sqrt(old_player_data.laser_skill_points));
    let new_laser_level = 1 + Math.floor(level_modifier * Math.sqrt(new_player_data.laser_skill_points));
    if (new_laser_level > old_laser_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'laser Skill Leveled Up!' });
        text_important.setText("laser Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }


    let old_melee_level = 1 + Math.floor(level_modifier * Math.sqrt(old_player_data.melee_skill_points));
    let new_melee_level = 1 + Math.floor(level_modifier * Math.sqrt(new_player_data.melee_skill_points));
    if (new_melee_level > old_melee_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'melee Skill Leveled Up!' });
        text_important.setText("melee Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_manufacturing_level = 1 + Math.floor(difficult_level_modifier * Math.sqrt(old_player_data.manufacturing_skill_points));
    let new_manufacturing_level = 1 + Math.floor(difficult_level_modifier * Math.sqrt(new_player_data.manufacturing_skill_points));
    if (new_manufacturing_level > old_manufacturing_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'manufacturing Skill Leveled Up!' });
        text_important.setText("manufacturing Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_mining_level = 1 + Math.floor(level_modifier * Math.sqrt(old_player_data.mining_skill_points));
    let new_mining_level = 1 + Math.floor(level_modifier * Math.sqrt(new_player_data.mining_skill_points));
    if (new_mining_level > old_mining_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'mining Skill Leveled Up!' });
        text_important.setText("mining Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_piercing_level = 1 + Math.floor(level_modifier * Math.sqrt(old_player_data.piercing_skill_points));
    let new_piercing_level = 1 + Math.floor(level_modifier * Math.sqrt(new_player_data.piercing_skill_points));
    if (new_piercing_level > old_piercing_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'piercing Skill Leveled Up!' });
        text_important.setText("piercing Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_plasma_level = 1 + Math.floor(level_modifier * Math.sqrt(old_player_data.plasma_skill_points));
    let new_plasma_level = 1 + Math.floor(level_modifier * Math.sqrt(new_player_data.plasma_skill_points));
    if (new_plasma_level > old_plasma_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'plasma Skill Leveled Up!' });
        text_important.setText("plasma Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_poison_level = 1 + Math.floor(level_modifier * Math.sqrt(old_player_data.poison_skill_points));
    let new_poison_level = 1 + Math.floor(level_modifier * Math.sqrt(new_player_data.poison_skill_points));
    if (new_poison_level > old_poison_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'poison Skill Leveled Up!' });
        text_important.setText("poison Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_radiation_level = 1 + Math.floor(level_modifier * Math.sqrt(old_player_data.radiation_skill_points));
    let new_radiation_level = 1 + Math.floor(level_modifier * Math.sqrt(new_player_data.radiation_skill_points));
    if (new_radiation_level > old_radiation_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'radiation Skill Leveled Up!' });
        text_important.setText("radiation Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_repairing_level = 1 + Math.floor(level_modifier * Math.sqrt(old_player_data.repairing_skill_points));
    let new_repairing_level = 1 + Math.floor(level_modifier * Math.sqrt(new_player_data.repairing_skill_points));
    if (new_repairing_level > old_repairing_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'repairing Skill Leveled Up!' });
        text_important.setText("repairing Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_researching_level = 1 + Math.floor(difficult_level_modifier * Math.sqrt(old_player_data.researching_skill_points));
    let new_researching_level = 1 + Math.floor(difficult_level_modifier * Math.sqrt(new_player_data.researching_skill_points));
    if (new_researching_level > old_researching_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'researching Skill Leveled Up!' });
        text_important.setText("researching Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_salvaging_level = 1 + Math.floor(level_modifier * Math.sqrt(old_player_data.salvaging_skill_points));
    let new_salvaging_level = 1 + Math.floor(level_modifier * Math.sqrt(new_player_data.salvaging_skill_points));
    if (new_salvaging_level > old_salvaging_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'salvaging Skill Leveled Up!' });
        text_important.setText("salvaging Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }

    let old_surgery_level = 1 + Math.floor(difficult_level_modifier * Math.sqrt(old_player_data.surgery_skill_points));
    let new_surgery_level = 1 + Math.floor(difficult_level_modifier * Math.sqrt(new_player_data.surgery_skill_points));
    if (new_surgery_level > old_surgery_level) {
        addInfoNumber(drawing_x, drawing_y, { 'fill_color': '#FFFFFF', 'text': 'surgery Skill Leveled Up!' });
        text_important.setText("surgery Skill Leveled Up!");
        text_important.setVisible(true);
        text_important_time = our_time;
    }



}


function loadAudio() {
    
    let scene_game = game.scene.getScene('sceneGame');
    // Lets try some audio stuff

    scene_game.load.on('filecomplete', processAudioFile, this);
    scene_game.load.audio('level-up', ['https://space.alphacoders.com/level-up.wav']);
    scene_game.load.start();

    scene_game.load.on('filecomplete', processAudioFile, this);
    scene_game.load.audio('engine', ['https://space.alphacoders.com/engine.mp3']);
    scene_game.load.start();
    

}

function processAudioFile(key, type, texture) {
    console.log("In processAudioFile with key: " + key);
    let scene_game = game.scene.getScene('sceneGame');
    

    /****************** PLANETS *****************/
    if(key === 'corporation_1') { 
        sound_corporation_1 = scene_game.sound.add('corporation_1', {volume: 0.25 });
        sound_corporation_1.on('ended', function() { console.log("In sound corporation 1 ended"); playBackgroundMusic('planet_type', 30); });
        sound_corporation_1.play();
    }

    if(key === 'corporation_2') { 
        sound_corporation_2 = scene_game.sound.add('corporation_2', {volume: 0.25 });
        sound_corporation_2.on('ended', function() { console.log("In sound corporation 2 ended"); playBackgroundMusic('planet_type', 30); });
        sound_corporation_2.play();
    }

    if(key === 'frozen_1') { 
        sound_frozen_1 = scene_game.sound.add('frozen_1', {volume: 0.5 });
        sound_frozen_1.play();
    }

    if(key === 'inferno_1') { 
        sound_inferno_1 = scene_game.sound.add('inferno_1', {volume: 0.5 });
        sound_inferno_1.play();
    }


    /************* NOT PLANETS!!! *************/

    if(key === "engine") {
        sound_engine = scene_game.sound.add('engine', { volume: 0.25, loop: true });
    }

    if(key === "electric") {
        sound_electric = scene_game.sound.add('electric', { volume: 0.4 });
        sound_electric.play();
    }

    if(key === "hacking") {
        sound_hacking = scene_game.sound.add('hacking', { volume: 0.5 });
        sound_hacking.play();
    }

    if(key === "healing") {
        sound_healing = scene_game.sound.add('healing', { volume: 0.5 });
        sound_healing.play();
    }

    if(key === "laser") {
        sound_laser = scene_game.sound.add('laser', {volume: 0.5 });
        sound_laser.play();
    }

    if(key === "level-up") {
        level_up_music = scene_game.sound.add('level-up');
    }

    if(key === 'melee') {
        sound_melee = scene_game.sound.add('melee', { volume: 0.8 });
        sound_melee.play();
    }

    if(key === 'piercing') {
        sound_piercing = scene_game.sound.add('piercing', { volume: 0.5 });
        sound_piercing.play();
    }






    
}

function loadPlayerSprites(object_type_id) {

    console.log("In loadPlayerSprites");


    // DESTROYER
    if(object_type_id === 271) {

        let scene_game = game.scene.getScene('sceneGame');

        if(!scene_game.textures.exists('player-destroyer')) {
            scene_game.load.on('filecomplete', processPlayerFile, this);
            scene_game.load.spritesheet('player-destroyer', "https://space.alphacoders.com/images/destroyer-animated.png",
                { frameWidth: 128, frame_height: 128, endFrame: 12 });
            scene_game.load.start();
        }
    }
    // GARDEN SHIP
    else if(object_type_id === 345) {
        console.log("Loading in garden ship");
        let scene_game = game.scene.getScene('sceneGame');

        if(!scene_game.textures.exists('player-garden-ship')) {
            scene_game.load.on('filecomplete', processPlayerFile, this);
            scene_game.load.spritesheet('player-garden-ship', "https://space.alphacoders.com/images/garden-ship-animated.png",
                { frameWidth: 128, frame_height: 128, endFrame: 2 });
            scene_game.load.start();
        }
    }
    // RESEARCHING BODY
    else if(object_type_id === 411) {

        let scene_game = game.scene.getScene('sceneGame');

        if(!scene_game.textures.exists('player-researching')) {
            scene_game.load.on('filecomplete', processPlayerFile, this);
            scene_game.load.spritesheet('player-researching', "https://space.alphacoders.com/images/researching-body-animated.png",
                { frameWidth: 64, frame_height: 64, endFrame: 30 });
            scene_game.load.start();
        }
    } 
    // SILK SHIP
    else if(object_type_id === 369) {

        let scene_game = game.scene.getScene('sceneGame');

        if(!scene_game.textures.exists('player-silk-ship')) {
            scene_game.load.on('filecomplete', processPlayerFile, this);
            scene_game.load.spritesheet('player-silk-ship', "https://space.alphacoders.com/images/silk-ship-animated.png",
                { frameWidth: 64, frame_height: 64, endFrame: 8 });
            scene_game.load.start();
        }
    }
    // VUEG BODY
    else if(object_type_id === 439) {

        let scene_game = game.scene.getScene('sceneGame');

        if(!scene_game.textures.exists('player-vueg')) {
            scene_game.load.on('filecomplete', processPlayerFile, this);
            scene_game.load.spritesheet('player-vueg', "https://space.alphacoders.com/images/vueg-body-animated.png",
                { frameWidth: 64, frame_height: 64, endFrame: 31 });
            scene_game.load.start();
        }
    } 
}


function loadMonsterSprites(type, type_id) {


    let scene_game = game.scene.getScene('sceneGame');

    for (let i = 0; i < monster_sprites.length; i++) {
        if (monster_sprites[i] && 
            ( (type === 'planet' && monster_sprites[i].planet_type_id === type_id) || 
              (type === 'ship' && monster_sprites[i].ship_type_id === type_id) ||
              (type === 'monster_type' && monster_sprites[i].monster_type_id === type_id)
              
              ) && 
            !scene_game.textures.exists(monster_sprites[i].key)) {

            scene_game.load.on('filecomplete', processFile, this);
            console.log("")
            scene_game.load.spritesheet(monster_sprites[i].key, "https://space.alphacoders.com/images/" + monster_sprites[i].key + ".png",
                { frameWidth: monster_sprites[i].frame_width, frameHeight: monster_sprites[i].frame_height, endFrame: monster_sprites[i].frame_count });
            scene_game.load.start();
        }
    }

}

function processFile(key, type, texture) {

    let scene_game = game.scene.getScene('sceneGame');

    //console.log("In processFile for key: " + key);

    // If we already have this key, it's already being
    //if(scene_game.textures.exists(key)) {
    //    return false;
    //}

    let monster_sprites_index = monster_sprites.findIndex(function (obj) { return obj && obj.key === key; });

    if (monster_sprites_index === -1) {
        //console.log("%c Could not find " + key + " in monster_sprites");
        return false;
    }

    let frame_count_minus_one = monster_sprites[monster_sprites_index].frame_count - 1;

    let anims_config = {};
    anims_config.key = key + "-animation";
    anims_config.frames = scene_game.anims.generateFrameNumbers(key, { 'start': 0, end: frame_count_minus_one, first: frame_count_minus_one });
    anims_config.frameRate = monster_sprites[monster_sprites_index].frame_rate;
    anims_config.repeat = -1;
    scene_game.anims.create(anims_config);


    // Now that we have the sprite - if we have a monster with this type, lets draw it
    for(let i = 0; i < monsters.length; i++) {
        if(monsters[i] && monsters[i].monster_type_id === monster_sprites[monster_sprites_index].monster_type_id) {



            createMonsterSprite(i);

        }
    }


}

function processPlayerFile(key, type, texture) {

    console.log("In processPlayerFile");
    let scene_game = game.scene.getScene('sceneGame');


    let loaded_object_type_id = 0;
    let loaded_type = "";


    // DESTROYER
    if(key === 'player-destroyer') {
        loaded_object_type_id = 271;
        loaded_type = "ship";


        let player_destroyer_left_config = {
            key: 'player-destroyer-left-animation',
            frames: scene_game.anims.generateFrameNumbers('player-destroyer', { start: 0, end: 2, first: 2 }),
            frameRate: 4,
            repeat: -1
        };

        scene_game.anims.create(player_destroyer_left_config);

        let player_destroyer_right_config = {
            key: 'player-destroyer-right-animation',
            frames: scene_game.anims.generateFrameNumbers('player-destroyer', { start: 3, end: 5, first: 5 }),
            frameRate: 4,
            repeat: -1
        };

        scene_game.anims.create(player_destroyer_right_config);

        let player_destroyer_up_config = {
            key: 'player-destroyer-up-animation',
            frames: scene_game.anims.generateFrameNumbers('player-destroyer', { start: 6, end: 8, first: 8 }),
            frameRate: 4,
            repeat: -1
        };

        scene_game.anims.create(player_destroyer_up_config);

        let player_destroyer_down_config = {
            key: 'player-destroyer-down-animation',
            frames: scene_game.anims.generateFrameNumbers('player-destroyer', { start: 9, end: 11, first: 11 }),
            frameRate: 4,
            repeat: -1
        };

        scene_game.anims.create(player_destroyer_down_config);
    }
    // GARDEN SHIP
    else if(key === 'player-garden-ship') {

        console.log("Creating garden ship animation");
        loaded_object_type_id = 345;
        loaded_type = "ship";

        let player_garden_ship_config = {
            key: 'player-garden-ship-animation',
            frames: scene_game.anims.generateFrameNumbers('player-garden-ship', { start: 0, end: 1, first: 1 }),
            frameRate: 2,
            repeat: -1
        };
        scene_game.anims.create(player_garden_ship_config);
    }
    // RESEARCHING
    else if(key === 'player-researching') {

        console.log("Processing researching body");
        loaded_object_type_id = 411;
        loaded_type = "body";


        let player_researching_idle_config = {
            key: 'player-researching-idle-animation',
            frames: scene_game.anims.generateFrameNumbers('player-researching', { start: 0, end: 5, first: 5 }),
            frameRate: 4,
            repeat: -1
        };
        scene_game.anims.create(player_researching_idle_config);


        let player_researching_left_config = {
            key: 'player-researching-left-animation',
            frames: scene_game.anims.generateFrameNumbers('player-researching', { start: 6, end: 11, first: 11 }),
            frameRate: 4,
            repeat: -1
        };

        scene_game.anims.create(player_researching_left_config);

        let player_researching_right_config = {
            key: 'player-researching-right-animation',
            frames: scene_game.anims.generateFrameNumbers('player-researching', { start: 12, end: 17, first: 17 }),
            frameRate: 4,
            repeat: -1
        };
        scene_game.anims.create(player_researching_right_config);

        let player_researching_up_config = {
            key: 'player-researching-up-animation',
            frames: scene_game.anims.generateFrameNumbers('player-researching', { start: 18, end: 23, first: 23 }),
            frameRate: 4,
            repeat: -1
        };

        scene_game.anims.create(player_researching_up_config);

        let player_researching_down_config = {
            key: 'player-researching-down-animation',
            frames: scene_game.anims.generateFrameNumbers('player-researching', { start: 24, end: 29, first: 29 }),
            frameRate: 4,
            repeat: -1
        };
        scene_game.anims.create(player_researching_down_config);

        


    } 
    // SILK SHIP
    else if(key === 'player-silk-ship') {
        loaded_object_type_id = 369;
        loaded_type = "ship";


        let player_silk_ship_config = {
            key: 'player-silk-ship-animation',
            frames: this.anims.generateFrameNumbers('player-silk-ship', { start: 0, end: 7, first: 7 }),
            frameRate: 2,
            repeat: -1
        };
        this.anims.create(player_silk_ship_config);
                    
    } 
    // VUEG
    else if(key === 'player-vueg') {

        console.log("Processing vueg body");
        loaded_object_type_id = 439;
        loaded_type = "body";


        let player_vueg_idle_config = {
            key: 'player-vueg-idle-animation',
            frames: scene_game.anims.generateFrameNumbers('player-vueg', { start: 0, end: 6, first: 6 }),
            frameRate: 4,
            repeat: -1
        };
        scene_game.anims.create(player_vueg_idle_config);


        let player_vueg_left_config = {
            key: 'player-vueg-left-animation',
            frames: scene_game.anims.generateFrameNumbers('player-vueg', { start: 7, end: 12, first: 12 }),
            frameRate: 4,
            repeat: -1
        };

        scene_game.anims.create(player_vueg_left_config);

        let player_vueg_right_config = {
            key: 'player-vueg-right-animation',
            frames: scene_game.anims.generateFrameNumbers('player-vueg', { start: 13, end: 18, first: 18 }),
            frameRate: 4,
            repeat: -1
        };
        scene_game.anims.create(player_vueg_right_config);

        let player_vueg_up_config = {
            key: 'player-vueg-up-animation',
            frames: scene_game.anims.generateFrameNumbers('player-vueg', { start: 19, end: 24, first: 24 }),
            frameRate: 4,
            repeat: -1
        };

        scene_game.anims.create(player_vueg_up_config);

        let player_vueg_down_config = {
            key: 'player-vueg-down-animation',
            frames: scene_game.anims.generateFrameNumbers('player-vueg', { start: 25, end: 30, first: 30 }),
            frameRate: 4,
            repeat: -1
        };
        scene_game.anims.create(player_vueg_down_config);

        


    } 




    // Now lets create a player sprite for any players that are using this
    for(let i = 0; i < players.length; i++) {
        if(players[i]) {

            if(loaded_type === "body") {
                let body_index = objects.findIndex(function(obj) { return obj && obj.id === players[i].body_id; });
                if(body_index !== -1 && objects[body_index].object_type_id === loaded_object_type_id) {
                    console.log("Going to re-try creating player sprite");
                    createPlayerSprite(i);
                    
                }
            } else if(loaded_type === "ship") {
                let ship_index = objects.findIndex(function(obj) { return obj && obj.id === players[i].ship_id; });
                if(ship_index !== -1 && objects[ship_index].object_type_id === loaded_object_type_id) {
                    createPlayerSprite(i);
                }
            }
            

        }
    }
}

function moveNpcFlow(npc_index, to_coord) {
    console.log("In moveNpcFlow");
    if (!npcs[npc_index].sprite) {
        createNpcSprite(npc_index);
    }

    npcs[npc_index].destination_x = to_coord.tile_x * tile_size + tile_size / 2 + npcs[npc_index].sprite_x_offset;
    npcs[npc_index].destination_y = to_coord.tile_y * tile_size + tile_size / 2 + npcs[npc_index].sprite_y_offset;
}


function moveNpcs() {
    let moving_npcs = npcs.filter(npc => npc.destination_x || npc.destination_y);

    if (moving_npcs.length) {
        moving_npcs.forEach(function (npc) {

            if (!npc.sprite) {
                return false;
            }

            // E.g. 1000 / 500 * 1 = 2 (default) or 1000/500 * .5 = 1 (water)
            let npc_move_speed = 2;

            if (npc.sprite.x < npc.destination_x) {

                if (npc.sprite.x + npc_move_speed > npc.destination_x) {
                    npc.sprite.x = npc.destination_x;

                } else {
                    npc.sprite.x += npc_move_speed;
                }

            } else if (npc.sprite.x > npc.destination_x) {

                if (npc.sprite.x - npc_move_speed < npc.destination_x) {
                    npc.sprite.x = npc.destination_x;
                } else {
                    npc.sprite.x -= npc_move_speed;
                }


            } else if (npc.sprite.y < npc.destination_y) {

                if (npc.sprite.y + npc_move_speed > npc.destination_y) {
                    npc.sprite.y = npc.destination_y;
                } else {
                    npc.sprite.y += npc_move_speed;

                    // npc sprite is lagging behind (FRAME RATE!!). Extra pixel!
                    if (npc.destination_y - npc.sprite.y > 100) {
                        console.log("Increasing speed to cach up!");
                        npc.sprite.y += 1;
                    }
                }


            } else if (npc.sprite.y > npc.destination_y) {

                if (npc.sprite.y - npc_move_speed < npc.destination_y) {
                    npc.sprite.y = npc.destination_y;
                } else {
                    npc.sprite.y -= npc_move_speed;

                    let y_difference = npc.sprite.y - npc.destination_y;
                    //console.log("Y difference: " + y_difference);
                    // npc sprite is lagging behind (FRAME RATE!!). Extra pixel!
                    if (npc.sprite.y - npc.destination_y > 100) {
                        console.log("Increasing speed to catch up!");
                        npc.sprite.y -= 1;
                    }
                }

            }
            if (npc.sprite.y === npc.destination_y && npc.sprite.x === npc.destination_x) {
                npc.destination_x = false;
                npc.destination_y = false;
            }


        });

        redrawBars();
    }
}


// This function can move MORE THAN JUST THE CLIENT PLAYER!
function initiateMovePlayerFlow(player_index, destination_coord_type, destination_coord, source = '') {


    client_move_coord_id = 0;
    if (typeof destination_coord === 'undefined') {
        return false;
    }

    if (source === false) {
        //console.log("In initiateMovePlayerFlow. No source");
    } else {
        //console.log("In initiateMovePlayerFlow. Source: " + source);
    }

    if (!players[player_index].sprite) {
        createPlayerSprite(player_index);
    }

    // If the player is already moving, lets ignore this
    if (players[player_index].destination_x) {

        if(player_index === client_player_index) {
            //console.log("Ignoring due to player already having a destination_x");
            return false;
        } else {

            let new_destination_x = destination_coord.tile_x * tile_size + tile_size / 2 + players[player_index].sprite_x_offset;
            let new_destination_y = destination_coord.tile_y * tile_size + tile_size / 2 + players[player_index].sprite_y_offset;
            // For non client players, lets try just warping them to their previous destination_x/y if the new one is different
            if(players[player_index].destination_x === new_destination_y && players[player_index].destination_y === new_destination_y) {
                console.log("Other player already has this destination, ignoring");
                return false;
            }

            // Not the same! Warp em, and we'll continue to set things below
            movePlayerInstant(player_index, players[player_index].destination_x, players[player_index].destination_y);

        }

    }

    players[player_index].move_start_time = our_time;
    players[player_index].move_pixel_amount = 0;
    players[player_index].frames_to_idle = 0;

    players[player_index].destination_x = destination_coord.tile_x * tile_size + tile_size / 2 + players[player_index].sprite_x_offset;
    players[player_index].destination_y = destination_coord.tile_y * tile_size + tile_size / 2 + players[player_index].sprite_y_offset;
    players[player_index].destination_coord_id = destination_coord.id;


    // Some extra things if we are moving our client player
    if (client_player_index !== -1 && player_index === client_player_index && source !== 'updatePlayerClient > galaxy') {

        //console.log("Sending move data: coord_id: " + destination_coord.id);

        let movement_direction = 'unknown';
        if(players[player_index].destination_x < players[player_index].sprite.x) {
            movement_direction = 'left';
        } else if(players[player_index].destination_x > players[player_index].sprite.x) {
            movement_direction = 'right';
        } else if(players[player_index].destination_y < players[player_index].sprite.y) {
            movement_direction = 'up';
        } else if(players[player_index].destination_y > players[player_index].sprite.y) {
            movement_direction = 'down';
        }

        socket.emit('move_data', { 'destination_coord_type': destination_coord_type, 'destination_coord_id': destination_coord.id, 'movement_direction': movement_direction });
        last_move_sent = our_time;
        //console.log("Sent move data from initiateMovePlayerFlow source: " + source);

        // Reset the # of pixels
        client_move_pixel_amount = 0;
        client_move_start_time = our_time;
        if (destination_coord_type === 'planet') {
            client_move_planet_coord_id = destination_coord.id;
        } else if (destination_coord_type == 'ship') {
            client_move_ship_coord_id = destination_coord.id;
        } else if (destination_coord_type === 'galaxy') {
            client_move_coord_id = destination_coord.id;
        }
        frames_to_idle = 0;
    }


    // If the moving player already has a destination, we nee to queue the new destination up
    /*
    if(players[player_index].destination_x || players[player_index].destination_y) {
        //console.log("Player is already moving. Destination: " + players[player_index].destination_x + "," + players[player_index].destination_y);

        let existing_next_move_index = next_moves.findIndex(function(obj) { return obj &&
            obj.player_id === players[player_index].id && obj.destination_coord.id === to_coord.id });

        if(existing_next_move_index === -1) {
            //console.log("Pushed to next moves");
            next_moves.push({ 'player_id': players[player_index].id, 'destination_coord': to_coord });
        }

        return;
    }*/






    //console.log("Set destination x,y to: " + players[player_index].destination_x + "," + players[player_index].destination_y);

    // If the destination x/y is really far from the current x/y, we need to just pop the player there
    if (players[player_index].sprite && (Math.abs(players[player_index].destination_x - players[player_index].sprite.x) > 200 ||
        Math.abs(players[player_index].destination_y - players[player_index].sprite.y) > 200)) {
        console.log("Player is too far away. Insta moving");
        movePlayerInstant(player_index, players[player_index].destination_x, players[player_index].destination_y);
    }

    if (players[player_index].sprite) {



        /***************** BLOCKADE RUNNER ******************/
        if (players[player_index].sprite.texture.key === 'player-blockade-runner') {

            // LEFT !
            if (players[player_index].destination_x < players[player_index].sprite.x) {

                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-blockade-runner-left-animation') {
                    players[player_index].sprite.anims.play('player-blockade-runner-left-animation');
                }

            }
            // RIGHT!
            else if (players[player_index].destination_x > players[player_index].sprite.x) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-blockade-runner-right-animation') {
                    players[player_index].sprite.anims.play('player-blockade-runner-right-animation');
                }


            }
            // UP!
            else if (players[player_index].destination_y < players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-blockade-runner-up-animation') {
                    players[player_index].sprite.anims.play('player-blockade-runner-up-animation');
                }
            }
            // DOWN!
            else if (players[player_index].destination_y > players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-blockade-runner-down-animation') {
                    players[player_index].sprite.anims.play('player-blockade-runner-down-animation');
                }
            }
        }

        /***************** CARGO SHIP ******************/
        else if (players[player_index].sprite.texture.key === 'player-cargo-ship') {

            // LEFT !
            if (players[player_index].destination_x < players[player_index].sprite.x) {

                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-cargo-ship-left-animation') {
                    players[player_index].sprite.anims.play('player-cargo-ship-left-animation');
                }

            }
            // RIGHT!
            else if (players[player_index].destination_x > players[player_index].sprite.x) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-cargo-ship-right-animation') {
                    players[player_index].sprite.anims.play('player-cargo-ship-right-animation');
                }


            }
            // UP!
            else if (players[player_index].destination_y < players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-cargo-ship-up-animation') {
                    players[player_index].sprite.anims.play('player-cargo-ship-up-animation');
                }
            }
            // DOWN!
            else if (players[player_index].destination_y > players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-cargo-ship-down-animation') {
                    players[player_index].sprite.anims.play('player-cargo-ship-down-animation');
                }
            }
        }

        /********** CUTTER ************/
        else if (players[player_index].sprite.texture.key === 'player-cutter') {
            // LEFT !
            if (players[player_index].destination_x < players[player_index].sprite.x) {

                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-cutter-left-animation') {
                    players[player_index].sprite.anims.play('player-cutter-left-animation');
                }

            }
            // RIGHT!
            else if (players[player_index].destination_x > players[player_index].sprite.x) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-cutter-right-animation') {
                    players[player_index].sprite.anims.play('player-cutter-right-animation');
                }


            }
            // UP!
            else if (players[player_index].destination_y < players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-cutter-up-animation') {
                    players[player_index].sprite.anims.play('player-cutter-up-animation');
                }
            }
            // DOWN!
            else if (players[player_index].destination_y > players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-cutter-down-animation') {
                    players[player_index].sprite.anims.play('player-cutter-down-animation');
                }
            }
        }

        /********** DESTROYER ************/
        else if (players[player_index].sprite.texture.key === 'player-destroyer') {
            // LEFT !
            if (players[player_index].destination_x < players[player_index].sprite.x) {

                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-destroyer-left-animation') {
                    players[player_index].sprite.anims.play('player-destroyer-left-animation');
                }

            }
            // RIGHT!
            else if (players[player_index].destination_x > players[player_index].sprite.x) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-destroyer-right-animation') {
                    players[player_index].sprite.anims.play('player-destroyer-right-animation');
                }


            }
            // UP!
            else if (players[player_index].destination_y < players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-destroyer-up-animation') {
                    players[player_index].sprite.anims.play('player-destroyer-up-animation');
                }
            }
            // DOWN!
            else if (players[player_index].destination_y > players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-destroyer-down-animation') {
                    players[player_index].sprite.anims.play('player-destroyer-down-animation');
                }
            }
        }
        /***************** FIGHTER (SHIP!) ******************/
        else if (players[player_index].sprite.texture.key === 'player-fighter') {

            // LEFT !
            if (players[player_index].destination_x < players[player_index].sprite.x) {

                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-fighter-left-animation') {
                    players[player_index].sprite.anims.play('player-fighter-left-animation');
                }

            }
            // RIGHT!
            else if (players[player_index].destination_x > players[player_index].sprite.x) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-fighter-right-animation') {
                    players[player_index].sprite.anims.play('player-fighter-right-animation');
                }


            }
            // UP!
            else if (players[player_index].destination_y < players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-fighter-up-animation') {
                    players[player_index].sprite.anims.play('player-fighter-up-animation');
                }
            }
            // DOWN!
            else if (players[player_index].destination_y > players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-fighter-down-animation') {
                    players[player_index].sprite.anims.play('player-fighter-down-animation');
                }
            }
        }

        /********** GALAXY *************/
        else if (players[player_index].sprite.texture.key === 'player-galaxy') {

            // LEFT !
            if (players[player_index].destination_x < players[player_index].sprite.x) {

                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-galaxy-left-animation') {
                    players[player_index].sprite.anims.play('player-galaxy-left-animation');
                }

            }
            // RIGHT!
            else if (players[player_index].destination_x > players[player_index].sprite.x) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-galaxy-right-animation') {
                    players[player_index].sprite.anims.play('player-galaxy-right-animation');
                }

            }
            // UP!
            else if (players[player_index].destination_y < players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-galaxy-up-animation') {
                    players[player_index].sprite.anims.play('player-galaxy-up-animation');
                }
            }
            // DOWN!
            else if (players[player_index].destination_y > players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-galaxy-down-animation') {
                    players[player_index].sprite.anims.play('player-galaxy-down-animation');
                }
            }
        }
        /********** HUMAN *************/
        else if (players[player_index].sprite.texture.key === 'player-human') {

            // LEFT !
            if (players[player_index].destination_x < players[player_index].sprite.x) {

                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-human-left-animation') {
                    players[player_index].sprite.anims.play('player-human-left-animation');
                }

            }
            // RIGHT!
            else if (players[player_index].destination_x > players[player_index].sprite.x) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-human-right-animation') {
                    players[player_index].sprite.anims.play('player-human-right-animation');
                }

            }
            // UP!
            else if (players[player_index].destination_y < players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-human-up-animation') {
                    players[player_index].sprite.anims.play('player-human-up-animation');
                }
            }
            // DOWN!
            else if (players[player_index].destination_y > players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-human-down-animation') {
                    players[player_index].sprite.anims.play('player-human-down-animation');
                }
            }
        }

        /************ LANCER *******************/
        else if (players[player_index].sprite.texture.key === 'player-lancer') {

            // LEFT !
            if (players[player_index].destination_x < players[player_index].sprite.x) {

                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-lancer-left-animation') {
                    players[player_index].sprite.anims.play('player-lancer-left-animation');
                }

            }
            // RIGHT!
            else if (players[player_index].destination_x > players[player_index].sprite.x) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-lancer-right-animation') {
                    players[player_index].sprite.anims.play('player-lancer-right-animation');
                }


            }
            // UP!
            else if (players[player_index].destination_y < players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-lancer-up-animation') {
                    players[player_index].sprite.anims.play('player-lancer-up-animation');
                }
            }
            // DOWN!
            else if (players[player_index].destination_y > players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-lancer-down-animation') {
                    players[player_index].sprite.anims.play('player-lancer-down-animation');
                }
            }
        }

        /********** MANUFACTURING *************/
        else if (players[player_index].sprite.texture.key === 'player-manufacturing') {

            // LEFT !
            if (players[player_index].destination_x < players[player_index].sprite.x) {

                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-manufacturing-left-animation') {
                    players[player_index].sprite.anims.play('player-manufacturing-left-animation');
                }

            }
            // RIGHT!
            else if (players[player_index].destination_x > players[player_index].sprite.x) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-manufacturing-right-animation') {
                    players[player_index].sprite.anims.play('player-manufacturing-right-animation');
                }

            }
            // UP!
            else if (players[player_index].destination_y < players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-manufacturing-up-animation') {
                    players[player_index].sprite.anims.play('player-manufacturing-up-animation');
                }
            }
            // DOWN!
            else if (players[player_index].destination_y > players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-manufacturing-down-animation') {
                    players[player_index].sprite.anims.play('player-manufacturing-down-animation');
                }
            }
        }

        
        /************ MINING SHIP *******************/
        else if (players[player_index].sprite.texture.key === 'player-mining-ship') {

            // LEFT !
            if (players[player_index].destination_x < players[player_index].sprite.x) {

                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-mining-ship-left-animation') {
                    players[player_index].sprite.anims.play('player-mining-ship-left-animation');
                }

            }
            // RIGHT!
            else if (players[player_index].destination_x > players[player_index].sprite.x) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-mining-ship-right-animation') {
                    players[player_index].sprite.anims.play('player-mining-ship-right-animation');
                }


            }
            // UP!
            else if (players[player_index].destination_y < players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-mining-ship-up-animation') {
                    players[player_index].sprite.anims.play('player-mining-ship-up-animation');
                }
            }
            // DOWN!
            else if (players[player_index].destination_y > players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-mining-ship-down-animation') {
                    players[player_index].sprite.anims.play('player-mining-ship-down-animation');
                }
            }
        }

        /********** MLM *************/
        else if (players[player_index].sprite.texture.key === 'player-mlm') {

            // LEFT !
            if (players[player_index].destination_x < players[player_index].sprite.x) {

                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-mlm-left-animation') {
                    players[player_index].sprite.anims.play('player-mlm-left-animation');
                }

            }
            // RIGHT!
            else if (players[player_index].destination_x > players[player_index].sprite.x) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-mlm-right-animation') {
                    players[player_index].sprite.anims.play('player-mlm-right-animation');
                }


            }
            // UP!
            else if (players[player_index].destination_y < players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-mlm-up-animation') {
                    players[player_index].sprite.anims.play('player-mlm-up-animation');
                }
            }
            // DOWN!
            else if (players[player_index].destination_y > players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-mlm-down-animation') {
                    players[player_index].sprite.anims.play('player-mlm-down-animation');
                }
            }
        }

        /********** OCTOPUS *************/
        else if (players[player_index].sprite.texture.key === 'player-octopus') {

            // LEFT !
            if (players[player_index].destination_x < players[player_index].sprite.x) {

                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-octopus-left-animation') {
                    players[player_index].sprite.anims.play('player-octopus-left-animation');
                }

            }
            // RIGHT!
            else if (players[player_index].destination_x > players[player_index].sprite.x) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-octopus-right-animation') {
                    players[player_index].sprite.anims.play('player-octopus-right-animation');
                }

            }
            // UP!
            else if (players[player_index].destination_y < players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-octopus-up-animation') {
                    players[player_index].sprite.anims.play('player-octopus-up-animation');
                }
            }
            // DOWN!
            else if (players[player_index].destination_y > players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-octopus-down-animation') {
                    players[player_index].sprite.anims.play('player-octopus-down-animation');
                }
            }
        }

        /********** REINFORCED HUMAN *************/
        else if (players[player_index].sprite.texture.key === 'player-reinforced-human') {

            // LEFT !
            if (players[player_index].destination_x < players[player_index].sprite.x) {

                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-reinforced-human-left-animation') {
                    players[player_index].sprite.anims.play('player-reinforced-human-left-animation');
                }

            }
            // RIGHT!
            else if (players[player_index].destination_x > players[player_index].sprite.x) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-reinforced-human-right-animation') {
                    players[player_index].sprite.anims.play('player-reinforced-human-right-animation');
                }

            }
            // UP!
            else if (players[player_index].destination_y < players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-reinforced-human-up-animation') {
                    players[player_index].sprite.anims.play('player-reinforced-human-up-animation');
                }
            }
            // DOWN!
            else if (players[player_index].destination_y > players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-reinforced-human-down-animation') {
                    players[player_index].sprite.anims.play('player-reinforced-human-down-animation');
                }
            }
        }


        /********** RESEARCHING *************/
        else if (players[player_index].sprite.texture.key === 'player-researching') {

            // LEFT !
            if (players[player_index].destination_x < players[player_index].sprite.x) {

                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-researching-left-animation') {
                    players[player_index].sprite.anims.play('player-researching-left-animation');
                }

            }
            // RIGHT!
            else if (players[player_index].destination_x > players[player_index].sprite.x) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-researching-right-animation') {
                    players[player_index].sprite.anims.play('player-researching-right-animation');
                }

            }
            // UP!
            else if (players[player_index].destination_y < players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-researching-up-animation') {
                    players[player_index].sprite.anims.play('player-researching-up-animation');
                }
            }
            // DOWN!
            else if (players[player_index].destination_y > players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-researching-down-animation') {
                    players[player_index].sprite.anims.play('player-researching-down-animation');
                }
            }
        }

        /***************************** RUEL *******************************/
        else if (players[player_index].sprite.texture.key === 'player-ruel') {

            // LEFT !
            if (players[player_index].destination_x < players[player_index].sprite.x) {

                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-ruel-left-animation') {
                    players[player_index].sprite.anims.play('player-ruel-left-animation');
                }

            }
            // RIGHT!
            else if (players[player_index].destination_x > players[player_index].sprite.x) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-ruel-right-animation') {
                    players[player_index].sprite.anims.play('player-ruel-right-animation');
                }


            }
            // UP!
            else if (players[player_index].destination_y < players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-ruel-up-animation') {
                    players[player_index].sprite.anims.play('player-ruel-up-animation');
                }
            }
            // DOWN!
            else if (players[player_index].destination_y > players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-ruel-down-animation') {
                    players[player_index].sprite.anims.play('player-ruel-down-animation');
                }
            }
        }
        /**************** SHUTTLE ***************************/
        else if (players[player_index].sprite.texture.key === 'player-shuttle') {

            // LEFT !
            if (players[player_index].destination_x < players[player_index].sprite.x) {
                //console.log("Shuttle left animation");

                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-shuttle-left-animation') {
                    players[player_index].sprite.anims.play('player-shuttle-left-animation');
                }

            }
            // RIGHT!
            else if (players[player_index].destination_x > players[player_index].sprite.x) {
                //console.log("Shuttle right animation");
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-shuttle-right-animation') {
                    players[player_index].sprite.anims.play('player-shuttle-right-animation');
                }


            }
            // UP!
            else if (players[player_index].destination_y < players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-shuttle-up-animation') {
                    players[player_index].sprite.anims.play('player-shuttle-up-animation');
                }
            }
            // DOWN!
            else if (players[player_index].destination_y > players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-shuttle-down-animation') {
                    players[player_index].sprite.anims.play('player-shuttle-down-animation');
                }
            }

        }

        /********** VUEG *************/
        else if (players[player_index].sprite.texture.key === 'player-vueg') {

            // LEFT !
            if (players[player_index].destination_x < players[player_index].sprite.x) {

                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-vueg-left-animation') {
                    players[player_index].sprite.anims.play('player-vueg-left-animation');
                }

            }
            // RIGHT!
            else if (players[player_index].destination_x > players[player_index].sprite.x) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-vueg-right-animation') {
                    players[player_index].sprite.anims.play('player-vueg-right-animation');
                }

            }
            // UP!
            else if (players[player_index].destination_y < players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-vueg-up-animation') {
                    players[player_index].sprite.anims.play('player-vueg-up-animation');
                }
            }
            // DOWN!
            else if (players[player_index].destination_y > players[player_index].sprite.y) {
                if (players[player_index].sprite.anims.getCurrentKey() !== 'player-vueg-down-animation') {
                    players[player_index].sprite.anims.play('player-vueg-down-animation');
                }
            }
        }


        else {
            // by default we flip sprites, unless the player has a movement_display set
            if (players[player_index].movement_display && players[player_index].movement_display === 'rotate') {

                if (players[player_index].destination_x < players[player_index].sprite.x) {

                    //console.log("Set angle to -90");
                    players[player_index].sprite.angle = -90;
                } else if (players[player_index].destination_x > players[player_index].sprite.x) {
                    players[player_index].sprite.angle = 90;
                    //console.log("Set angle to 90");
                } else if (players[player_index].destination_y > players[player_index].sprite.y) {
                    players[player_index].sprite.angle = 180;
                    //console.log("Set angle to 180");
                } else if (players[player_index].destination_y < players[player_index].sprite.y) {
                    players[player_index].sprite.angle = 0;
                    //console.log("Set angle to 0");
                }

            } else if (players[player_index].movement_display && players[player_index].movement_display === 'flip') {
                if (players[player_index].destination_x < players[player_index].sprite.x && !players[player_index].sprite.flipX) {
                    //console.log("X flipping player sprite");
                    players[player_index].sprite.flipX = true;
                } else if (players[player_index].destination_x > players[player_index].sprite.x && players[player_index].sprite.flipX) {
                    players[player_index].sprite.flipX = false;
                }
            } else {

                // Default is NONE! Currently the Space Station sets us to 'static'

            }


        }


    }


    // If there's a mining or a salvaging beam, and we are 3+ tiles away, lets remove the beam
    if (client_player_index !== -1 && player_index === client_player_index) {
        
        for(let i = 0; i < mining_linkers.length; i++) {
            if(mining_linkers[i] && mining_linkers[i].player_id === players[client_player_index].id) {
                let object_index = getObjectIndex(mining_linkers[i].object_id);

                if(object_index !== -1) {
                    let object_info = getObjectInfo(object_index);
            
                    // It's possible that we won't have the coord for the mining if we are back to viewing the ship
                    if(object_info.coord !== false && client_player_info && client_player_info.coord) {
                        if(Math.abs(object_info.coord.tile_x - client_player_info.coord.tile_x) >= 3 || 
                        Math.abs(object_info.coord.tile_y - client_player_info.coord.tile_y) >= 3) {
                            console.log("Client is proactively removing mining beam");
                            removeEffects('object', mining_linkers[i].object_id);
                        }
                    }
                }
                
            }
        }

        for(let i = 0; i < salvaging_linkers.length; i++) {
            if(salvaging_linkers[i] && salvaging_linkers[i].player_id === players[client_player_index].id) {
                let object_index = getObjectIndex(salvaging_linkers[i].object_id);

                if(object_index !== -1) {
                    let object_info = getObjectInfo(object_index);
            
                    // It's possible that we won't have the coord for the mining if we are back to viewing the ship
                    if(object_info.coord !== false && client_player_info && client_player_info.coord) {
                        if(Math.abs(object_info.coord.tile_x - client_player_info.coord.tile_x) >= 3 || 
                        Math.abs(object_info.coord.tile_y - client_player_info.coord.tile_y) >= 3) {
                            console.log("Client is proactively removing salvaging beam");
                            removeEffects('object', salvaging_linkers[i].object_id);
                        }
                    }
                }
                
            }
        }


    }



}

function movePlayerInstant(player_index, x, y) {

    //console.log("in movePlayerInstant");

    players[player_index].destination_x = false;
    players[player_index].destination_y = false;

    // if the moving player doesn't have a sprite, we add the sprite
    if (!players[player_index].sprite) {
        createPlayerSprite(player_index);
    }

    if (!players[player_index].sprite) {
        return false;
    }

    players[player_index].sprite.x = x + players[player_index].sprite_x_offset;
    players[player_index].sprite.y = y + players[player_index].sprite_y_offset;

    if (players[player_index].id === client_player_id) {
        //console.log("function movePlayerInstant centering camera at tile_x,tile_y: " + tile_x + "," + tile_y);
        // True is setting roundPixels to true. Testing this to get rid of tile bleed in Phaser 3.24.1
        //camera.startFollow(players[player_index].sprite, true);
        camera.startFollow(players[player_index].sprite);
        //camera.centerOn(x, y);
    }

    //console.log("Moved player sprite to: " + x + "," + y);

    /*
    // Don't advance the animation, just pop the player to where we are saying!
    let animation_index = animations.findIndex(function(obj) { return obj && obj.player_id === moving_player.id; });
    if(animation_index !== -1) {
        let player_object_type_index = getPlayerObjectTypeIndex(moving_player);
        if(player_object_type_index !== -1) {
            let drawing_game_index = object_types[player_object_type_index].game_file_index + (animations[animation_index].current_frame - 1);
            let tile_x = pixelToTileX(x);
            let tile_y = pixelToTileY(y);
            //console.log("Drawing player at " + tile_x + "," + tile_y + " in movePlayerInstant");

            // We are trying different combinations of moving/centering the camera to try and fix visual glitches
            if(moving_player.id === player_id) {
                //console.log("function movePlayerInstant centering camera at tile_x,tile_y: " + tile_x + "," + tile_y);
                camera.centerOn(tileToPixel(tile_x), tileToPixel(tile_y));
            }
            map.putTileAt(drawing_game_index, tile_x, tile_y, false, 'layer_being');



        }


    }
    */

    redrawBars();
    return;


}

function pixelToTileX(pixel_number) {
    return Math.floor(pixel_number / tile_size);
}

function pixelToTileY(pixel_number) {
    return Math.floor(pixel_number / tile_size);
    //return Math.floor(pixel_number / (tile_size * 2) );
}


function redrawBars(source = '') {

    //console.log("Redrawing bars. source: " + source);

    graphics.clear();
    graphics.depth = 3;

    // we get our player 
    let our_player_index = players.findIndex(function (obj) { return obj && obj.id === player_id; });
    if (our_player_index === -1) {
        return false;
    }

    let our_player_info = getPlayerInfo(our_player_index);

    // ASSEMBLIES

    active_assemblies.forEach(function (active_assembly, i) {
        //console.log("In redrawBars for assemblies. Current tick count: " + active_assembly.current_tick_count);

        let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === active_assembly.being_assembled_object_type_id; });
        let assembler_object_index = getObjectIndex(active_assembly.assembler_object_id);
        let assembled_in_linker_index = -1;
        if(assembler_object_index !== -1) {
            assembled_in_linker_index = assembled_in_linkers.findIndex(function(obj) { return obj && obj.object_type_id === active_assembly.being_assembled_object_type_id && 
                obj.assembled_in_object_type_id === objects[assembler_object_index].object_type_id; });
        } else {
            //console.log("Could not find assembler object. id: " + active_assembly.assember_objet_id);
        }


        let percent_complete = 1;
        //console.log("Total assembly time: " + object_types[object_type_index].assembly_time);

        if (active_assembly.current_tick_count >= 1 && assembled_in_linker_index !== -1) {
            percent_complete = active_assembly.current_tick_count / assembled_in_linkers[assembled_in_linker_index].tick_count * 100;
        } else if(assembled_in_linker_index === -1) {
            //console.log("Could not find assembled_in_linker, percent is remaining at 1");
        }

        graphics.fillStyle(0x4286f4);

        let hp_bar_length = 64 * percent_complete / 100;
        //console.log("This assembly percent: " + hp_bar_length);

        // lets find our assembler object id's location on the map to show the bar
        let object_index = objects.findIndex(function (obj) { return obj && obj.id === active_assembly.assembler_object_id; });

        if (object_index === -1) {
            return false;
        }

        let object_info = getObjectInfo(object_index);

        if (object_info.coord === false) {
            return false;
        }

        if (!shouldDraw(our_player_info.coord, object_info.coord, 'redrawBars - assemblies')) {
            return false;
        }


        let rect_x = tileToPixel(object_info.coord.tile_x);
        let rect_y = tileToPixel(object_info.coord.tile_y);


        //console.log("Drawing bar at: " + rect_x + "," + rect_y);
        //console.log("Player is at: " + user_player.x + ", " + user_player.y);
        let rect = new Phaser.Geom.Rectangle(rect_x, rect_y, hp_bar_length, 8);
        rect.depth = 3;
        graphics.fillRectShape(rect);
        graphics.depth = 3;


    });


    // BATTLE LINKERS
    battle_linkers.forEach(function (battle_linker, i) {
        //console.log("Looking to draw box for battle linker attacking_type: " + battle_linker.attacking_type + " being_attacked_type: " + battle_linker.being_attacked_type);

        if(client_player_index === -1) {
            console.log("Don't have player yet");
            return false;
        }

        graphics.depth = 1;

        // TODO NPCS!!!!!

        // YELLOWS BEFORE REDS

        // A monster is attacking us
        if (battle_linker.being_attacked_type === 'player' && battle_linker.being_attacked_id === client_player_id && battle_linker.attacking_type === 'monster') {


            if (client_player_info.coord) {
                graphics.lineStyle(1, 0xffff00, 1);
                graphics.strokeRect(tileToPixel(client_player_info.coord.tile_x), tileToPixel(client_player_info.coord.tile_y), 64, 64);
            } else {
                //console.log("Don't have player's coord yet");
            }
            

            // yellow on the monster
            let monster_index = monsters.findIndex(function (obj) { return obj && obj.id === battle_linker.attacking_id; });
            if (monster_index !== -1) {
                let monster_info = getMonsterInfo(monster_index);
                if (monster_info.coord) {
                    graphics.lineStyle(1, 0xffff00, 1);
                    graphics.strokeRect(tileToPixel(monster_info.coord.tile_x), tileToPixel(monster_info.coord.tile_y), 64, 64);
                } else {
                    console.log("Don't have monster's coord yet");
                }
            } else {
                //console.log("Don't have monster yet");
                socket.emit('request_monster_info', { 'monster_id': battle_linker.attacking_id });
            }
        }

        // An object is attacking us
        if (battle_linker.being_attacked_type === 'player' && battle_linker.being_attacked_id === player_id && battle_linker.attacking_type === 'object') {

            // yellow on us
            let player_index = players.findIndex(function (obj) { return obj && obj.id === battle_linker.being_attacked_id; });
            if (player_index !== -1) {
                let player_info = getPlayerInfo(player_index);
                if (player_info.coord) {
                    graphics.lineStyle(1, 0xffff00, 1);
                    graphics.strokeRect(tileToPixel(player_info.coord.tile_x), tileToPixel(player_info.coord.tile_y), 64, 64);
                }
            }

            // yellow on the object
            let object_index = objects.findIndex(function (obj) { return obj && obj.id === battle_linker.attacking_id; });
            if (object_index !== -1) {
                let object_info = getObjectInfo(object_index);
                if (object_info.coord) {
                    graphics.lineStyle(1, 0xffff00, 1);
                    graphics.strokeRect(tileToPixel(object_info.coord.tile_x), tileToPixel(object_info.coord.tile_y), 64, 64);
                }
            }
        }

        // We draw object v object if either of the objects are associated with us
        if (battle_linker.attacking_type === 'object' && battle_linker.being_attacked_type === 'object') {

            let being_attacked_object_index = objects.findIndex(function (obj) { return obj && obj.id === battle_linker.being_attacked_id; });
            let attacking_object_index = objects.findIndex(function (obj) { return obj && obj.id === battle_linker.attacking_id; });

            if (being_attacked_object_index !== -1 && attacking_object_index !== -1) {
                // At least one of the objects is associated with us
                if (objects[being_attacked_object_index].player_id === player_id || objects[attacking_object_index].player_id === player_id) {

                    let attacking_object_info = getObjectInfo(attacking_object_index);
                    if (attacking_object_info.coord) {
                        graphics.lineStyle(1, 0xffff00, 1);
                        graphics.strokeRect(tileToPixel(attacking_object_info.coord.tile_x), tileToPixel(attacking_object_info.coord.tile_y), 64, 64);
                    }

                    let being_attacked_object_info = getObjectInfo(being_attacked_object_index);
                    if (being_attacked_object_info.coord) {
                        graphics.lineStyle(1, 0xffff00, 1);
                        graphics.strokeRect(tileToPixel(being_attacked_object_info.coord.tile_x), tileToPixel(being_attacked_object_info.coord.tile_y), 64, 64);
                    }

                }
            }

        }

        // A player is attacking us
        if (battle_linker.being_attacked_type === 'player' && battle_linker.being_attacked_id === player_id && battle_linker.attacking_type === 'player') {

            // yellow on us
            let player_index = players.findIndex(function (obj) { return obj && obj.id === battle_linker.being_attacked_id; });
            if (player_index !== -1) {
                let player_info = getPlayerInfo(player_index);
                if (player_info.coord) {
                    graphics.lineStyle(1, 0xffff00, 1);
                    graphics.strokeRect(tileToPixel(player_info.coord.tile_x), tileToPixel(player_info.coord.tile_y), 64, 64);
                }
            }

            // yellow on the player attacking us
            let attacking_player_index = players.findIndex(function (obj) { return obj && obj.id === battle_linker.attacking_id; });
            if (attacking_player_index !== -1) {
                let attacking_player_info = getPlayerInfo(attacking_player_index);
                if (attacking_player_info.coord) {
                    graphics.lineStyle(1, 0xffff00, 1);
                    graphics.strokeRect(tileToPixel(attacking_player_info.coord.tile_x), tileToPixel(attacking_player_info.coord.tile_y), 64, 64);
                }
            }
        }

        // We are attacking a monster
        if (battle_linker.being_attacked_type === 'monster' && battle_linker.attacking_type === 'player' && battle_linker.attacking_id === player_id) {
            let monster_index = monsters.findIndex(function (obj) { return obj && obj.id === battle_linker.being_attacked_id; });

            if (monster_index === -1) {
                return false;
            }

            let monster_info = getMonsterInfo(monster_index);
            if (monster_info.coord === false) {
                return false;
            }

            graphics.lineStyle(2, 0xf44242, 1);
            graphics.strokeRect(tileToPixel(monster_info.coord.tile_x), tileToPixel(monster_info.coord.tile_y), 64, 64);
        }

        // We are attacking a npc
        if (battle_linker.being_attacked_type === 'npc' && battle_linker.attacking_type === 'player' && battle_linker.attacking_id === player_id) {
            let npc_index = npcs.findIndex(function (obj) { return obj && obj.id === battle_linker.being_attacked_id; });

            if (npc_index === -1) {
                return false;
            }

            let npc_info = getNpcInfo(npc_index);
            if (npc_info.coord === false) {
                return false;
            }

            graphics.lineStyle(2, 0xf44242, 1);
            graphics.strokeRect(tileToPixel(npc_info.coord.tile_x), tileToPixel(npc_info.coord.tile_y), 64, 64);
        }


        // We are attacking an object
        if (battle_linker.being_attacked_type === 'object' && battle_linker.attacking_type === 'player' && battle_linker.attacking_id === player_id) {

            let object_index = objects.findIndex(function (obj) { return obj && obj.id === battle_linker.being_attacked_id; });

            if (object_index === -1) {
                return false;
            }

            let object_info = getObjectInfo(object_index);
            if (object_info.coord === false) {
                return false;
            }

            graphics.lineStyle(2, 0xf44242, 1);
            graphics.strokeRect(tileToPixel(object_info.coord.tile_x), tileToPixel(object_info.coord.tile_y), 64, 64);

        }

        // We are attacking a player
        if (battle_linker.being_attacked_type === 'player' && battle_linker.attacking_type === 'player' && battle_linker.attacking_id === player_id) {

            let player_index = players.findIndex(function (obj) { return obj && obj.id === battle_linker.being_attacked_id; });

            if (player_index === -1) {
                return false;
            }

            let player_info = getPlayerInfo(player_index);
            if (player_info.coord === false) {
                return false;
            }

            graphics.lineStyle(2, 0xf44242, 1);
            graphics.strokeRect(tileToPixel(player_info.coord.tile_x), tileToPixel(player_info.coord.tile_y), 64, 64);

        }

    });


    // MINING LINKERS
    mining_linkers.forEach(function (mining_linker, i) {
        //console.log("In redrawBars. Have mining linker");

        let object_index = objects.findIndex(function (obj) { return obj && obj.id === mining_linker.object_id; });

        if (object_index !== -1) {
            let coord_index = coords.findIndex(function (obj) { return obj && obj.id === objects[object_index].coord_id; });
            if (coord_index !== -1) {
                //console.log("Found object planet coord");
                graphics.lineStyle(2, 0xffff00, 1);
                graphics.strokeRect(tileToPixel(coords[coord_index].tile_x), tileToPixel(coords[coord_index].tile_y), 64, 64);
            }
        }

    });


    // MONSTERS
    monsters.forEach(function (monster, i) {
        let monster_type_index = monster_types.findIndex(function (obj) { return obj && obj.id === monster.monster_type_id; });

        if (monster_type_index === -1) {
            return false;
        }

        if (monster.current_hp === monster_types[monster_type_index].hp) {
            return false;
        }

        let monster_info = getMonsterInfo(i);

        if (!monster_info.coord) {
            return false;
        }

        if (!shouldDraw(our_player_info.coord, monster_info.coord, 'redrawBars - monsters')) {
            return false;
        }

        let hp_percent = 1;

        if (monster.current_hp > 1) {
            hp_percent = monster.current_hp / monster_types[monster_type_index].hp * 100;
        }

        if (hp_percent < 32) {
            graphics.fillStyle(0xff0000);
        }
        else if (hp_percent < 64) {
            graphics.fillStyle(0xffff00);
        }
        else {
            graphics.fillStyle(0x00ff00);
        }

        let hp_bar_length = 64 * hp_percent / 100;

        //console.log("Hp percent: " + hp_percent + " hp bar length: " + hp_bar_length);

        let rect = new Phaser.Geom.Rectangle(tileToPixel(monster_info.coord.tile_x), tileToPixel(monster_info.coord.tile_y), hp_bar_length, 8);
        graphics.fillRectShape(rect);

    });




    // NPCS
    for (let i = 0; i < npcs.length; i++) {

        if (npcs[i] && npcs[i].current_hp !== npcs[i].max_hp) {

            let npc_info = getNpcInfo(i);

            if (npc_info.coord) {
                // lets determine the color and the size of the hp bar
                if (npcs[i].current_hp >= 1) {
                    npcs[i].hp_percent = npcs[i].current_hp / npcs[i].max_hp * 100;
                } else {
                    npcs[i].hp_percent = 1;
                }

                //console.log("Got map coord HP percent as: " + map_coords[i].hp_percent);

                // some simple colour changing to make it look like a health bar
                if (npcs[i].hp_percent < 32) {
                    graphics.fillStyle(0xff0000);
                }
                else if (npcs[i].hp_percent < 64) {
                    graphics.fillStyle(0xffff00);
                }
                else {
                    graphics.fillStyle(0x00ff00);
                }

                let hp_bar_length = 64 * npcs[i].hp_percent / 100;

                let drawing_x = tileToPixel(npc_info.coord.tile_x);
                let drawing_y = tileToPixel(npc_info.coord.tile_y);

                let rect = new Phaser.Geom.Rectangle(drawing_x, drawing_y, hp_bar_length, 8);
                graphics.fillRectShape(rect);
            }



        }

    }


    // OBJECTS
    objects.forEach(function (object, i) {

        // objects currently only have hp . So we have to compare the object hp with the object type hp
        let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === object.object_type_id; });

        if (object_type_index === -1) {
            return false;
        }

        if (object.current_hp === object_types[object_type_index].hp) {
            return false;
        }

        let object_info = getObjectInfo(i);

        if (object_info.coord === false) {
            return false;
        }

        // If the object is a non-dockable ship with a player id, we draw it in players
        if (object_types[object_type_index].is_ship && !object_types[object_type_index].is_dockable && object.player_id) {
            return false;
        }


        let drawing_x = object_info.coord.tile_x * tile_size;
        let drawing_y = object_info.coord.tile_y * tile_size;



        // lets determine the color and the size of the hp bar
        if (object.current_hp >= 1) {
            object.hp_percent = object.current_hp / object_types[object_type_index].hp * 100;
        } else {
            object.hp_percent = 1;
        }

        //console.log("Got map coord HP percent as: " + map_coords[i].hp_percent);

        // some simple colour changing to make it look like a health bar
        if (object.hp_percent > 100) {
            graphics.fillStyle(0x00ffaa);
        } else if (object.hp_percent < 32) {
            graphics.fillStyle(0xff0000);
        }
        else if (object.hp_percent < 64) {
            graphics.fillStyle(0xffff00);
        }
        else {
            graphics.fillStyle(0x00ff00);
        }

        let hp_bar_length = 64 * object.hp_percent / 100;

        if (hp_bar_length > 64) {
            hp_bar_length = 64;
        }


        //console.log("Drawing at x,y: " + drawing_x + "," + drawing_y);
        let rect = new Phaser.Geom.Rectangle(drawing_x, drawing_y, hp_bar_length, 8);
        graphics.fillRectShape(rect);





    });

    // PLAYERS
    players.forEach(function (player, i) {

        let drawing_x = 0;
        let drawing_y = 0;
        let draw_bar = false;
        let hp_percent = 0;

        if (!player.sprite) {
            return false;
        }

        // Ship HP Display
        if (current_view === 'galaxy') {
            // get the player's ship
            let ship_index = objects.findIndex(function (obj) { return obj && obj.id === player.ship_id; });

            if (ship_index === -1) {
                return false;
            }

            let ship_type_index = object_types.findIndex(function (obj) { return obj && obj.id === objects[ship_index].object_type_id; });

            if (ship_type_index === -1) {
                return false;
            }

            //console.log("Found basics");

            if (objects[ship_index].current_hp !== object_types[ship_type_index].hp) {
                //console.log("Ship has damage");

                let coord_index = coords.findIndex(function (obj) { return obj && obj.id === player.coord_id; });
                if (coord_index !== -1) {
                    //console.log("should be drawing bar");
                    //drawing_x = tileToPixel(coords[coord_index].tile_x);
                    //drawing_y = tileToPixel(coords[coord_index].tile_y);
                    draw_bar = true;

                    // lets determine the color and the size of the hp bar
                    if (objects[ship_index].current_hp >= 1) {
                        hp_percent = objects[ship_index].current_hp / object_types[ship_type_index].hp * 100;
                    } else {
                        hp_percent = 1;
                    }

                    //console.log("Set hp_percent to: " + hp_percent);


                }
            }
        }
        // The actual player HP :)
        else {
            if (player.current_hp === player.max_hp) {
                return false;
            }

            let player_info = getPlayerInfo(i);

            if (player_info.coord === false) {
                return false;
            }

            let should_draw_result = shouldDraw(our_player_info.coord, player_info.coord, 'redrawBars - players');

            if (should_draw_result === false) {
                //console.log("shouldDraw for player " + player.id + " " + player.name + " returned false");
                //console.log(our_player_info.coord);
                //console.log(player_info.coord);
                return false;
            }

            //drawing_x = tileToPixel(player_info.coord.tile_x);
            //drawing_y = tileToPixel(player_info.coord.tile_y);



            draw_bar = true;
            // lets determine the color and the size of the hp bar
            if (player.current_hp >= 1) {
                player.hp_percent = player.current_hp / player.max_hp * 100;
            } else {
                player.hp_percent = 1;
            }

            hp_percent = player.hp_percent;


        }

        if (draw_bar === true) {

            drawing_x = player.sprite.x - 32;
            drawing_y = player.sprite.y - 40;

            //console.log("Drawing bar at " + drawing_x + "," + drawing_y);
            //console.log("Got map coord HP percent as: " + map_coords[i].hp_percent);

            // some simple colour changing to make it look like a health bar
            if (hp_percent < 32) {
                graphics.fillStyle(0xff0000);
            }
            else if (hp_percent < 64) {
                graphics.fillStyle(0xffff00);
            }
            else {
                graphics.fillStyle(0x00ff00);
            }

            let hp_bar_length = 64 * hp_percent / 100;

            //console.log("Hp percent: " + hp_percent + " hp bar length: " + hp_bar_length);

            let rect = new Phaser.Geom.Rectangle(drawing_x, drawing_y, hp_bar_length, 8);
            graphics.fillRectShape(rect);

            //console.log("Drew bar");
        }


    });


    // RESEARCHES
    researches.forEach(function (research) {
        //console.log("In redrawBars for researches. Current tick count: " + research.current_tick_count);

        let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === research.being_researched_object_type_id; });
        let percent_complete = 1;
        //console.log("Total research time: " + object_types[object_type_index].research_tick_count);

        if (research.current_tick_count >= 1) {
            percent_complete = research.current_tick_count / object_types[object_type_index].research_tick_count * 100;
        }

        graphics.fillStyle(0x4286f4);

        let hp_bar_length = 64 * percent_complete / 100;
        //console.log("This assembly percent: " + hp_bar_length);

        // lets find our researcher object id's location on the map to show the bar
        let object_index = objects.findIndex(function (obj) { return obj && obj.id === research.researcher_object_id; });


        if (object_index !== -1) {

            let rect_x = false;
            let rect_y = false;
            if (objects[object_index].planet_coord_id) {
                let coord_index = planet_coords.findIndex(function (obj) { return obj && obj.id === objects[object_index].planet_coord_id; });
                if (coord_index !== -1) {
                    rect_x = tileToPixel(planet_coords[coord_index].tile_x);
                    rect_y = tileToPixel(planet_coords[coord_index].tile_y);
                }
            } else if (objects[object_index].ship_coord_id) {
                let coord_index = ship_coords.findIndex(function (obj) { return obj && obj.id === objects[object_index].ship_coord_id; });
                if (coord_index !== -1) {
                    rect_x = tileToPixel(ship_coords[coord_index].tile_x);
                    rect_y = tileToPixel(ship_coords[coord_index].tile_y);
                }
            }


            //console.log("Drawing bar at: " + rect_x + "," + rect_y);
            //console.log("Player is at: " + user_player.x + ", " + user_player.y);
            let rect = new Phaser.Geom.Rectangle(rect_x, rect_y, hp_bar_length, 8);
            rect.depth = 3;
            graphics.fillRectShape(rect);
            graphics.depth = 3;
        } else {
            //console.log("Could not find researcher object id: " + research.researcher_object_id);
        }
    });


    // SALVAGING LINKERS
    for (let i = 0; i < salvaging_linkers.length; i++) {
        drawSalvageBar(i);

    }

}


function redrawObject(object_index) {


    let object_info = false;
    
    let player_using_index = players.findIndex(function(obj) { return obj &&
        (obj.body_id === objects[object_index].id || obj.ship_id === objects[object_index].id);  });

    // Removed the name!
    if( (objects[object_index].name && objects[object_index].name.length === 0) || (!objects[object_index].name && objects[object_index].name_text) ) {
        if(objects[object_index].name_text) {
            objects[object_index].name_text.destroy();
        }
    }

    // Make sure the object doesn't match a current player body or ship
    if(objects[object_index].name && !objects[object_index].name_text && player_using_index === -1) {

        //console.log("Object has name, and is not an active body/ship. Setting that");

        let scene_game = game.scene.getScene('sceneGame');
        object_info = getObjectInfo(object_index);

        objects[object_index].name_text = scene_game.add.text(tileToPixel(object_info.coord.tile_x) - 18,
            tileToPixel(object_info.coord.tile_y) - 14, objects[object_index].name, {
                fontSize: 14,
                padding: { x: 10, y: 5},
                stroke: '#000000',
                strokeThickness: 3,
                fill: '#ffffff'});
        objects[object_index].name_text.setDepth(11);


            
        
    } else if(objects[object_index].name && objects[object_index].name_text && objects[object_index].name !== objects[object_index].name_text.text) {
        objects[object_index].name_text.setText(objects[object_index].name);
    } else if(objects[object_index].name_text && player_using_index !== -1) {
        objects[object_index].name_text.destroy();
    }


    // If there's a tint, set that
    if(objects[object_index].tint) {
        console.log("Object has tint change. Setting tint");

        if(object_info === false) {
            object_info = getObjectInfo(object_index);
        }
        let object_tile = map.getTileAt(object_info.coord.tile_x, object_info.coord.tile_y, false, 'layer_object');

        if(object_tile) {
            object_tile.tint = objects[object_index].tint;
        }

    }


}


function removeNpc(npc_id) {


    npc_id = parseInt(npc_id);
    //console.log("Have monster info to remove: " + monster_id);

    let npc_index = npcs.findIndex(function (obj) { return obj && obj.id === npc_id; });


    if (npc_index !== -1) {

        if (npcs[npc_index].sprite) {
            npcs[npc_index].sprite.destroy();
            npcs[npc_index].sprite = false;
        }

        /*
        if(monsters[monster_index].planet_coord_id) {
            console.log("Monster had a planet coord id: " + monsters[monster_index].planet_coord_id);
            let old_planet_coord_index = planet_coords.findIndex(function(obj) { return obj && obj.id === monsters[monster_index].planet_coord_id; });
            if(old_planet_coord_index !== -1) {
                map.putTileAt(-1, planet_coords[old_planet_coord_index].tile_x, planet_coords[old_planet_coord_index].tile_y, false, 'layer_being');
                console.log("Removed monster from planet coord");
            } else {
                console.log("Could not find that planet coord");
            }
        }

        if(monsters[monster_index].ship_coord_id) {
            let old_ship_coord_index = ship_coords.findIndex(function(obj) { return obj && obj.id === monsters[monster_index].ship_coord_id; });
            if(old_ship_coord_index !== -1) {
                map.putTileAt(-1, ship_coords[old_ship_coord_index].tile_x, ship_coords[old_ship_coord_index].tile_y, false, 'layer_being');
                console.log("Removed monster from ship coord");
            }
        }
        */

        delete npcs[npc_index];
        //console.log("Removed monster");

        redrawBars();


    } else {
        //console.log("Don't have this monster");


    }

    // still remove it from any coords
    /*
    let planet_coord_index = planet_coords.findIndex(function(obj) { return obj && obj.monster_id === monster_id; });
    if(planet_coord_index !== -1) {
        console.log("Found a planet coord with this monster");
        map.putTileAt(-1, planet_coords[planet_coord_index].tile_x, planet_coords[planet_coord_index].tile_y, false, 'layer_being');
    }

    let ship_coord_index = ship_coords.findIndex(function(obj) { return obj && obj.monster_id === monster_id; });
    if(ship_coord_index !== -1) {
        console.log("Found a ship coord with this monster");
        map.putTileAt(-1, ship_coords[ship_coord_index].tile_x, ship_coords[ship_coord_index].tile_y, false, 'layer_being');
    }
    */

    // lets remove any battle linkers with this npc id in them
    battle_linkers.forEach(function (battle_linker, i) {
        if (battle_linker.attacking_type === 'npc' && battle_linker.attacking_id === npc_id) {

            delete battle_linkers[i];
            //console.log("Removed battle linker - attacking np");
        }

        if (battle_linker.being_attacked_type === 'npc' && battle_linker.being_attacked_id === npc_id) {

            delete battle_linkers[i];
            //console.log("Removed battle linker - npc being attacked");
        }
    });

    //console.log("Done removing monster");

    redrawBars();
    return;

}

function redrawMap() {

    //console.log("In redrawMap");


    if (!client_player_id) {
        return false;
    }

    let player_info = getPlayerInfo(client_player_index);

    if (!player_info.coord) {
        //console.log("%c Could not find the coord the player is on to redraw the map", log_warning);
        map_needs_redraw = true;
        return false;
    }

    let starting_x = player_info.coord.tile_x - Math.ceil(show_cols / 2) - 2;
    let starting_y = player_info.coord.tile_y - Math.ceil(show_rows / 2) - 2;
    let ending_x = player_info.coord.tile_x + Math.ceil(show_cols / 2) + 3;
    let ending_y = player_info.coord.tile_y + Math.ceil(show_cols / 2) + 3;


    //console.log("Redrawing tiles x,y: " + starting_x + "," + starting_y + " to: " + ending_x + "," + ending_y);

    for (let x = starting_x; x <= ending_x; x++) {
        for (let y = starting_y; y <= ending_y; y++) {


            if (current_view === 'planet') {
                // match a planet coord
                let planet_coord_index = planet_coords.findIndex(function (obj) {
                    return obj && obj.planet_id === player_info.coord.planet_id &&
                        obj.level === player_info.coord.level && obj.tile_x === x && obj.tile_y === y;
                });

                if (planet_coord_index !== -1) {
                    drawCoord('planet', planet_coords[planet_coord_index]);
                }
            } else if (current_view === 'galaxy') {
                let coord_index = coords.findIndex(function (obj) { return obj && obj.tile_x === x && obj.tile_y === y; });
                if (coord_index !== -1) {
                    drawCoord('galaxy', coords[coord_index]);
                }
            } else if (current_view === 'ship') {
                let coord_index = ship_coords.findIndex(function (obj) { return obj && obj.level === player_info.coord.level && obj.tile_x === x && obj.tile_y === y; });
                if (coord_index !== -1) {
                    drawCoord('ship', ship_coords[coord_index]);
                }
            }

        }
    }

    map_needs_redraw = false;

    // and center our player
    movePlayerInstant(client_player_index, player_info.coord.tile_x * tile_size + tile_size / 2, player_info.coord.tile_y * tile_size + tile_size / 2);

    // and draw any monsters we now need to
    for (let i = 0; i < monsters.length; i++) {
        if (monsters[i]) {
            let monster_info = getMonsterInfo(i);

            if (shouldDraw(client_player_info.coord, monster_info.coord, "monster_info")) {
                //console.log("%c Drawing monster from redrawMap", log_success);
                createMonsterSprite(i);
            }
        }

    }
}

// So this seems to create a ton of slowdown. Probably the old one not getting removed, or something else bad
function resetMap() {
    //console.log("Resetting map");

    let saved_objects = [];

    if (client_player_id) {
        objects.forEach(function (object, i) {

            let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === object.object_type_id; });

            // if the object id matches our body id, save it
            if (object.id === players[client_player_index].body_id) {
                //console.log("In resetmap - saving body object id: " + object.id);
                saved_objects.push(object);
            }

            // Same with our current ship
            if (object.player_id === client_player_id && object_types[object_type_index].is_ship) {
                //console.log("Saving ship id: " + object.id);
                saved_objects.push(object);
            }

            // And things we own that have rules
            if (object.player_id === client_player_id && object_types[object_type_index].can_have_rules) {
                saved_objects.push(object);
            }




        });
    }

    // Gotta remove name texts and tints for objects that are going away
    for (let i = 0; i < objects.length; i++) {
        if (objects[i]) {

            if (objects[i].name_text) {
                objects[i].name_text.destroy();
                objects[i].name_text = false;
            }

            if (objects[i].tint) {
                let object_info = getObjectInfo(i);
                if (object_info.coord) {
                    let object_tile = map.getTileAt(object_info.coord.tile_x, object_info.coord.tile_y, false, 'layer_object');
                    if (object_tile) {
                        object_tile.tint = "0xffffff";
                        //object_tile.clearTint();
                    }
                }
            }

        }
    }

    objects = [];

    objects = saved_objects;


    for (let i = 0; i < 100; i++) {
        for (let j = 0; j < 100; j++) {
            map.putTileAt(-1, i, j, false, 'layer_object');
            map.putTileAt(-1, i, j, false, 'layer_floor');
            //map.putTileAt(-1, i, j, false, 'layer_being');
            map.putTileAt(-1, i, j, false, 'layer_above');
        }
    }

    // maybe switch this to rectangles drawn via graphics based on user_player_attacking
    /*
    let attack_box_node = document.getElementById("attack_box");
    while (attack_box_node.firstChild) {
        attack_box_node.removeChild(attack_box_node.firstChild);
    }
    */

    // Any active animations, mining, or salvaging shouldn't move with us to the next level
    animations.splice(0, animations.length);



    // This helped with the game trying to render bits and pieces of multiple layers of planets
    ship_coords.splice(0, ship_coords.length);
    planet_coords.splice(0, planet_coords.length);

    //coords = [];
    //coords.splice(0, coords.length);


    /*
    monsters.forEach(function(monster, i) {
        if(monster.monster_image) {
            monster.monster_image.destroy();
        }

        delete monsters[i];

    });

    //monsters = [];
    monsters.splice(0, monsters.length);
    */

    // lets try and save a specific object or two ..... eeek.


    //planets = [];
    //planet_coords = [];

    // remove other player sprites
    for (let i = 0; i < players.length; i++) {
        if (players[i] && i !== client_player_index && players[i].sprite) {
            destroyPlayerSprite(players[i]);
        }
    }

    // change our sprite
    destroyPlayerSprite(players[client_player_index]);
    createPlayerSprite(client_player_index);

    // clear out all the players except for our player
    /*
    players.forEach(function(player, i) {

        if(player.id !== player_id) {
            delete players[i];
        }

    });
    */

    //ship_coords = [];
    //user_player_attacking = [];




    redrawBars();
}

function setPlayerMoveDelay(player_index) {

    //console.log("In setPlayerMoveDelay");



    if (!players[player_index].current_move_delay) {
        players[player_index].current_move_delay = 500;
    }

    if (current_view === 'planet' || current_view === 'ship') {

        // bodies can have different move delays too!
        let body_index = objects.findIndex(function (obj) { return obj && obj.id === players[player_index].body_id; });
        if (body_index === -1) {
            socket.emit('request_object_info', { 'object_id': players[player_index].body_id, 'reason': 'Need player body' });
            return false;
        }

        let body_type_index = object_types.findIndex(function (obj) { return obj.id === objects[body_index].object_type_id; });

        if (object_types[body_type_index].move_delay && object_types[body_type_index].move_delay !== 500) {
            players[player_index].current_move_delay = object_types[body_type_index].move_delay;

        } else {
            players[player_index].current_move_delay = 500;
        }

        //console.log("In planet or ship view. Set current_move_delay to: " + players[player_index].current_move_delay);

    } else if (current_view === 'galaxy') {

        let ship_index = objects.findIndex(function (obj) { return obj && obj.id === players[player_index].ship_id });

        if (ship_index === -1) {
            //console.log("Don't have our ship object. Requesting it");
            socket.emit('request_object_info', { 'object_id': players[player_index].ship_id, 'reason': 'Need player ship' });
            return false;
        }

        let ship_type_index = object_types.findIndex(function (obj) { return obj.id === objects[ship_index].object_type_id; });

        if (object_types[ship_type_index].move_delay) {
            players[player_index].current_move_delay = object_types[ship_type_index].move_delay;

        } else if (!object_types[ship_type_index].move_delay) {
            // ship doesn't have a move delay set
            players[player_index].current_move_delay = 500;
            console.log("%c Set a move delay for this ship David!", log_warning);
        }

        if(object_types[ship_type_index].needs_engines && typeof objects[ship_index].current_engine_power !== 'undefined') {

            let ship_move_delay = object_types[ship_type_index].move_delay * ( object_types[ship_type_index].engine_power_required / objects[ship_index].current_engine_power);
            // Ships can't go faster than their max speed
            if(ship_move_delay < object_types[ship_type_index].move_delay) {
                ship_move_delay = object_types[ship_type_index].move_delay;
            }

            if(!isNaN(ship_move_delay)) {
                players[player_index].current_move_delay = ship_move_delay;
            } else {
                console.log("%c Ship tried to set move delay to NaN", log_warning);
            }
            

            
        }


    } else {
        console.log("%c Can't set player move delay yet", log_warning);
    }


    //console.log("Set player id: " + players[player_index].id + " move delay to: " + players[player_index].current_move_delay);

}

// Seeing if we should draw the other coord, based on the base coord
function shouldDraw(base_coord, other_coord, source = false, debug = false) {


    let debug_other_coord_ids = [];
    if (!base_coord) {
        if (debug || debug_other_coord_ids.indexOf(other_coord.id) !== -1) {
            console.log("No base coord in shouldDraw. source: " + source);
        }

        return false;
    }

    if (!other_coord) {
        if (debug || debug_other_coord_ids.indexOf(other_coord.id) !== -1) {
            console.log("No other coord in shouldDraw. source: " + source);
        }

        return false;
    }

    let tile_x_difference = Math.abs(base_coord.tile_x - other_coord.tile_x);
    let tile_y_difference = Math.abs(base_coord.tile_y - other_coord.tile_y);

    if (tile_x_difference > 10 || tile_y_difference > 10) {
        if (debug || debug_other_coord_ids.indexOf(other_coord.id) !== -1) {
            console.log("Tile difference is too high. Returning false");
        }

        return false;
    }

    // galaxy - neither has a planet id and ship id
    if (!base_coord.planet_id && !base_coord.ship_id && !other_coord.planet_id && !other_coord.ship_id) {
        return true;
    }

    // galaxy - we're in the galaxy view and they are in the ship view
    if(!base_coord.planet_id && !base_coord.ship_id && other_coord.ship_id) {
        console.log("Other coord has a ship id");
        // see if the ship is close to use
        let other_ship_index = getObjectIndex(other_coord.ship_id);
        if(other_ship_index !== -1) {
            if(objects[other_ship_index].coord_id) {
                console.log("Using the other ship to see if we draw");
                let other_galaxy_coord = getCoordIndex({ 'coord_id': objects[other_ship_index].coord_id });
                let new_tile_x_difference = Math.abs(base_coord.tile_x - other_galaxy_coord.tile_x);
                let new_tile_y_difference = Math.abs(base_coord.tile_y - other_galaxy_coord.tile_y);
                if(new_tile_x_difference <= 8 && new_tile_y_difference <= 8) {
                    return true;
                }
            }
        }
    }

    // Some npcs won't actually have ships - and we just draw a pod for them in space.
    if(!base_coord.planet_id && !base_coord.ship_id && other_coord.npc_id) {
        return true;
    }

    // Ship view - both on the same ship and level
    if (base_coord.ship_id && other_coord.ship_id && base_coord.ship_id === other_coord.ship_id &&
        base_coord.level === other_coord.level) {
        return true;
    }

    // Planet view - both on same level of the same planet
    if (base_coord.planet_id && other_coord.planet_id && base_coord.planet_id === other_coord.planet_id &&
        base_coord.level === other_coord.level) {
        return true;
    }

    if (debug || debug_other_coord_ids.indexOf(other_coord.id) !== -1) {
        console.log("Default return false. base_coord:");
        console.log(base_coord);
        console.log("other_coord:");
        console.log(other_coord);
    }


    return false;

}


function showClickMenu(pointer) {

    if (client_player_index === -1) {
        console.log("No client player yet");
        return false;
    }

    let current_timestamp = Math.floor(new Date());

    if (last_click_div_move + 500 > current_timestamp) {
        return;
    }

    let worldPoint = pointer.positionToCamera(camera);

    let tile_x = worldPointToTileX(worldPoint.x);
    let tile_y = worldPointToTileY(worldPoint.y);
    //let tile_x = pixelToTileX(worldPoint.x);
    //let tile_y = pixelToTileY(worldPoint.y);

    //let tile_x = map.worldToTileX(worldPoint.x);
    //let tile_y = map.worldToTileY(worldPoint.y);

    //console.log("%c Showing click menu at " + mouse_x + "x" + mouse_y, log_warning);

    $('#click_menu').css({
        'top': mouse_y, 'left': mouse_x, 'position': 'absolute', 'max-height': '400px', 'max-width': '640px',
        'overflow-y': 'scroll', 'overflow-x': 'scroll', 'padding': '10px'
    }).fadeIn('fast');

    $('#click_menu').empty();

    //console.log("Got tile x, tile y of click as: " + tile_x + "," + tile_y);

    let coord_index = -1;
    let coord_x = 0;
    let coord_y = 0;
    // generic coord
    let coord = false;


    let player_info = getPlayerInfo(client_player_index);

    if (current_view === 'planet') {

        coord_index = planet_coords.findIndex(function (obj) {
            return obj && obj.tile_x === tile_x &&
                obj.tile_y === tile_y && obj.level === player_info.coord.level && obj.planet_id === player_info.coord.planet_id;
        });
        if (coord_index !== -1) {
            coord = planet_coords[coord_index];
            coord_x = planet_coords[coord_index].tile_x;
            coord_y = planet_coords[coord_index].tile_y;
        }
    } else if (current_view === 'ship') {
        coord_index = ship_coords.findIndex(function (obj) {
            return obj && obj.ship_id === player_info.coord.ship_id &&
                obj.level === player_info.coord.level && obj.tile_x === tile_x && obj.tile_y === tile_y;
        });
        if (coord_index !== -1) {
            coord = ship_coords[coord_index];
            coord_x = ship_coords[coord_index].tile_x;
            coord_y = ship_coords[coord_index].tile_y;
        }
    } else if (current_view === 'galaxy') {
        coord_index = coords.findIndex(function (obj) { return obj && obj.tile_x === tile_x && obj.tile_y === tile_y; });
        if (coord_index !== -1) {
            coord = coords[coord_index];
            coord_x = coords[coord_index].tile_x;
            coord_y = coords[coord_index].tile_y;
        }
    }

    let player_inventory_items = inventory_items.filter(inventory_item => inventory_item.player_id === client_player_id &&
        inventory_item.body_id === players[client_player_index].body_id);


    // For most things we display, we want to have a coord
    if (coord_index !== -1) {

        let tile_object_type_id = false;

        // FLOOR
        if (coord.floor_type_id) {
            showClickMenuFloor(coord);

        }


        // MONSTER
        if (coord.monster_id) {
            showClickMenuMonster(coord);

        }


        // OBJECTS
        if (coord.object_id || coord.belongs_to_object_id) {
            showClickMenuObject(coord);

        } else if (coord.object_type_id) {
            showClickMenuObjectType(coord);

        }

        // NPC
        if (coord.npc_id) {
            showClickMenuNpc(coord);

        }

        // SHIP ENGINE
        if (coord.is_engine_hardpoint) {
            console.log("Player right clicked on a coord that is a engine hardpoint");
            showClickMenuShipEngine(coord);
            return true;
        }

        // SHIP WEAPON
        if (coord.is_weapon_hardpoint) {
            console.log("Player right clicked on a coord that is a weapon hardpoint");
            showClickMenuShipWeapon(coord);
            return true;
        }

        if (current_view === "galaxy" && (coord.planet_id || coord.belongs_to_planet_id)) {
            //console.log("Going to show click menu for planet id: " + coord.planet_id + " / " + coord.belongs_to_planet_id);
            showClickMenuPlanet(coord);
        }


        // Player
        if (coord.player_id && coord.player_id !== client_player_id && current_view !== 'galaxy') {

            let other_player_index = players.findIndex(function (obj) { return obj && obj.id === coord.player_id; });

            // Give the player the option to attack them
            // see if we are already attacking based on the battle linkers we have
            let player_is_attacking = false;
            battle_linkers.forEach(function (battle_linker, i) {
                if (battle_linker.attacking_type === 'player' && battle_linker.attacking_id === client_player_id &&
                    battle_linker.being_attacked_type === 'player' && battle_linker.being_attacked_id === coord.player_id) {
                    player_is_attacking = true;
                }
            });

            if (player_is_attacking) {
                $('#click_menu').append("<button id='attackstop_player_" + coord.player_id + "' " +
                    "player_id='" + coord.player_id + " class='button is-warning is-small'>Stop Attacking Player</button>");
            } else {

                $('#click_menu').append("<button id='attack_player_" + coord.player_id + "' " +
                    "player_id='" + coord.player_id + "' class='button is-warning is-small' source='player-generic'>Attack Player</button>");
            }

            $('#click_menu').append("<br><a target='_blank' href='https://space.alphacoders.com/player/view/" + players[other_player_index].id + "'>View Profile</a>");
        }


        // Show options for player inventory items
        // There's a limited amount of stuff that we can put in space. Like a shipyard!
        if (current_view === 'galaxy') {

            player_inventory_items.forEach(function (inventory_item) {

                let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === inventory_item.object_type_id; });

                if (object_type_index === -1) {
                    console.log("Couldn't find object type for inventory item id: " + inventory_item.id);
                } else {

                    if (object_types[object_type_index].drop_requires_floor_type_class === 'galaxy') {

                        $('#click_menu').append("<br>" + object_types[object_type_index].name + ": ");
                        $('#click_menu').append(
                            "<button id='drop_" + inventory_item.id + "' x='" + tile_x + "' y='" + tile_y + "' class='button is-default'>Drop</button>"
                        );
                    }
                }

            });
        }
        // Some options for planet/ship stuff
        else {


            if (!coord.player_id && !coord.monster_id && !coord.npc_id && !coord.object_id && !coord.object_type_id) {


                player_inventory_items.forEach(function (inventory_item) {
                    if (inventory_item.object_type_id) {

                        let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === inventory_item.object_type_id; });

                        // Not doing the is_ship_wall stuff right now
                        //   if(object_type_index !== -1 && !object_types[object_type_index].is_ship_wall) {
                        if (object_type_index !== -1) {

                            let inventory_options_string = "";

                            inventory_options_string += "<div style='display:inline-block; position:relative; width:146px; height:74px; " +
                                " background-image: url(https://space.alphacoders.com/images/" +
                                urlName(object_types[object_type_index].name) + ".png); background-repeat: no-repeat; " +
                                " background-position: top; " +
                                " border: 1px #c8c1c1 solid; border-radius:6px; margin:2px;'>";

                            inventory_options_string += "<div style='position:absolute; right: 4px; bottom: 0;'>";


                            // if there's nothing on the tile - drop. Otherwise change based on what object is already there
                            if (tile_object_type_id === false) {


                                // PLANT
                                if (object_types[object_type_index].is_plantable === true || object_types[object_type_index].is_plantable === 'true' ||
                                    object_types[object_type_index].is_plantable === 1) {
                                    inventory_options_string += "<button id='plant_" + inventory_item.id + "' x='" + tile_x +
                                        "' y='" + tile_y + "'";
                                        
                                    if(current_view === 'planet') {
                                        inventory_options_string += " planet_coord_id='" + coord.id + "' ";
                                    } else if(current_view === 'ship') {
                                        inventory_options_string += " ship_coord_id='" + coord.id + "' ";

                                    }
                                        
                                    inventory_options_string += " class='button is-success is-small'>Plant</button><br>";

                                }

                                inventory_options_string += "Drop:";

                                if (inventory_item.amount === 1) {
                                    inventory_options_string += "<button id='drop_" + inventory_item.id + "_all' x='" +
                                        tile_x + "' y='" + tile_y +
                                        "' class='button is-default is-small'>All</button>";

                                } else {
                                    inventory_options_string += "<button id='drop_" + inventory_item.id + "_all' x='" + tile_x +
                                        "' y='" + tile_y + "' amount='all' class='button is-default is-small'>All</button>";

                                    inventory_options_string += "<button id='drop_" + inventory_item.id + "_10' x='" + tile_x +
                                        "' y='" + tile_y + "' amount='10' class='button is-default is-small'>10</button>";

                                    inventory_options_string += "<button id='drop_" + inventory_item.id + "_1' x='" + tile_x +
                                        "' y='" + tile_y + "' amount='1' class='button is-default is-small'>1</button>";


                                }


                            }


                            inventory_options_string += "</div>";

                            inventory_options_string += "</div>";

                            $('#click_menu').append(inventory_options_string);





                        }


                    } else if (inventory_item.floor_type_id) {
                        let floor_type_index = floor_types.findIndex(function (obj) { return obj && obj.id === inventory_item.floor_type_id; });

                        if (floor_type_index !== -1) {

                            $('#click_menu').append("<button id='replacefloor_" + inventory_item.id + "' " +
                                "x='" + tile_x + "' y='" + tile_y + "' class='button is-default'>Replace Floor: " + floor_types[floor_type_index].name + "</button><br>")
                        }
                    }

                });
            }

            // Let the player change the floor
            // Have this in above too
            /*
            player_inventory_items.forEach(function (inventory_item) {
                if(inventory_item.floor_type_id) {
                    let floor_type_index = floor_types.findIndex(function(obj) { return obj && obj.id === inventory_item.floor_type_id; });

                    if(floor_type_index !== -1) {

                        $('#click_menu').append(floor_types[floor_type_index].name + ": ");
                        $('#click_menu').append("<button id='replacefloor_" + inventory_item.id + "' " +
                            "x='" + tile_x + "' y='" + tile_y + "' class='btn btn-default'>Replace Floor</button><br>")
                    }
                }

            });
             */
        }


        // If the player is on a planet, and they control the planet, they can do things like add/remove the coord from a room

        if (!coord.monster_id && players[client_player_index].planet_coord_id) {


            let planet_index = planets.findIndex(function (obj) { return obj && obj.id === coord.planet_id; });
            if (planet_index !== -1 && planets[planet_index].player_id === client_player_id) {

                $('#click_menu').append("<button id='manage_areas' class='button is-default'>Manage Areas</button>");


                // If the coord doesn't already have an area, give us the option to add it to an area
                if (!coord.area_id) {
                    // Go through the areas we have, giving the player the option of adding that coord to the area
                    for (let i = 0; i < areas.length; i++) {
                        console.log("Checking area id: " + areas[i].id);
                        if (areas[i] && areas[i].owner_id === players[client_player_index].id && areas[i].planet_id === planets[planet_index].id) {
                            $('#click_menu').append("<button id='addtoarea_" + coord.id + "' planet_coord_id='"
                                + coord.id + "' area_id='" + areas[i].id + "' class='button is-default'>Add To Area: " + areas[i].name + "</button>");
                        }
                    }
                }



            } 
        } 
        // Same if we're on a ship, and it's our ship

    }
    // There was no coord here. However! If we are > level 0 on a planet,
    // there's a possibility that we can add a floor here
    else {



        if (players[client_player_index].planet_coord_id) {
            let client_planet_coord_index = planet_coords.findIndex(function (obj) { return obj && obj.id === players[client_player_index].planet_coord_id; });
            if (client_planet_coord_index !== -1) {
                if (planet_coords[client_planet_coord_index].level > 0) {

                    // Give the user an add floor option


                    player_inventory_items.forEach(function (inventory_item) {
                        if (inventory_item.floor_type_id) {
                            let floor_type_index = floor_types.findIndex(function (obj) { return obj && obj.id === inventory_item.floor_type_id; });

                            if (floor_type_index !== -1) {

                                $('#click_menu').append(floor_types[floor_type_index].name + ": ");
                                $('#click_menu').append("<button id='replacefloor_" + inventory_item.id + "' " +
                                    "x='" + tile_x + "' y='" + tile_y + "' class='button is-default'>Add Floor</button><br>")
                            }
                        }

                    });
                }
            }
        }

    }


    last_click_div_move = current_timestamp;


}

function showClickMenuFloor(coord) {
    let floor_type_index = floor_types.findIndex(function (obj) { return obj && obj.id === coord.floor_type_id; });

    if (floor_type_index !== -1) {
        //console.log("Got floor type index");
        if (floor_types[floor_type_index].repaired_floor_type_id) {

            //console.log("Floor type has repaired floor type id");

            // see if we are already repairing it
            let repairing_linker_index = repairing_linkers.findIndex(function (obj) {
                return obj && obj.player_id === client_player_id &&
                    obj.ship_coord_id === coord.id;
            });


            if (repairing_linker_index === -1) {
                $('#click_menu').append("<button id='repair_" + coord.id + "' " +
                    "coord_id='" + coord.id + "' class='button is-success'>" +
                    "Repair</button><br>");
            } else {
                $('#click_menu').append("<button id='repairstop_" + coord.id + "' " +
                    "coord_id='" + coord.id + "' class='button is-warning is-small'>" +
                    "Stop Repairing</button>");
            }

        } else {
            //console.log("Floor type does not have repaired floor type id");
        }
    }
}

function showClickMenuMonster(coord) {
    //console.log("Coord has monster id");
    let monster_index = monsters.findIndex(function (obj) { return obj && obj.id === coord.monster_id; });

    if (monster_index !== -1) {
        //console.log("Showing monster options");
        let monster_type_index = monster_types.findIndex(function (obj) { return obj && obj.id === monsters[monster_index].monster_type_id; });


        // see if we are already attacking based on the battle linkers we have
        let player_is_attacking = false;
        battle_linkers.forEach(function (battle_linker, i) {
            if (battle_linker.attacking_type === 'player' && battle_linker.attacking_id === client_player_id &&
                battle_linker.being_attacked_type === 'monster' && battle_linker.being_attacked_id === monsters[monster_index].id) {
                player_is_attacking = true;
            }
        });

        if (player_is_attacking) {
            $('#click_menu').append("<button id='attackstop_monster_" + monsters[monster_index].id + "' " +
                "monster_id='" + monsters[monster_index].id + "' class='button is-warning is-small'>" +
                "Stop Attacking " + monster_types[monster_type_index].name + "</button><br>");
        } else {

            // Generally, a monster's base attack is about 10% of HP - give it some wiggle room with / 8 instead of a straight / 10
            if(monster_types[monster_type_index].hp && monster_types[monster_type_index].hp / 8 > (players[client_player_index].max_hp) ) {
                $('#click_menu').append("<div class='notification is-danger' style='padding:10px;'>WARNING: This monster can kill you in 1 hit</div><br>");
            }



            $('#click_menu').append("<button id='attack_" + monsters[monster_index].id + "' " +
                "monster_id='" + monsters[monster_index].id + "' class='button is-warning is-small'>" +
                "Attack " + monster_types[monster_type_index].name + "</button><br>");
        }

        // It's also possible that the monster type is something that spawns stuff
        if (monsters[monster_index].has_spawned_object) {
            $('#click_menu').append("<button class='button is-default' id='pickup_" + coord.monster_id +
                "' monster_id='" + coord.monster_id + "'>Harvest " + monster_types[monster_type_index].name + "</button><br>");
        }

    }
}

function showClickMenuNpc(coord) {
    let npc_index = npcs.findIndex(function (obj) { return obj && obj.id === coord.npc_id; });

    if (npc_index === -1) {
        return false;
    }


    console.log("Showing npc options");

    // see if we are already attacking based on the battle linkers we have
    let player_is_attacking = false;
    battle_linkers.forEach(function (battle_linker, i) {
        if (battle_linker.attacking_type === 'player' && battle_linker.attacking_id === client_player_id &&
            battle_linker.being_attacked_type === 'npc' && battle_linker.being_attacked_id === npcs[npc_index].id) {
            player_is_attacking = true;
        }
    });

    if (player_is_attacking) {
        $('#click_menu').append("<button id='attackstop_" + npcs[npc_index].id +
            "' npc_id='" + npcs[npc_index].id + "' class='button is-warning is-small'>Stop Attacking</button>");
    } else {

        // We won't be able to attack the npc if it's the galaxy view and they don't have a ship (npc's version of a pod)
        if (current_view === 'galaxy' && !npcs[npc_index].ship_id) {
            // no pod attack
        } else {
            $('#click_menu').append("<button id='attack_" + npcs[npc_index].id + "' npc_id='" +
                npcs[npc_index].id + "' class='button is-warning is-small'>Attack NPC " + npcs[npc_index].name + "</button><br>");
        }


    }

    if (!npcs[npc_index].enslaved_to_player_id && !npcs[npc_index].enslaved_to_npc_id) {
        // We can ask the npc if they want to work for us on our ship
        $('#click_menu').append("<button id='work' class='button'>Invite To Work On Ship (Testing)</button><br>");
    }
    else if (npcs[npc_index].enslaved_to_player_id && npcs[npc_index].enslaved_to_player_id === client_player_id) {
        $('#click_menu').append("<button id='work_order_or_enslavement_order'>Force To Work On Ship</button><br>");
    } else {
        $('#click_menu').append(npcs[npc_index].name + " isn't interested in you");
    }


    // If the NPC wants something, we can potentially give them some of that to increase our relationship with them
    if (npcs[npc_index].wants_object_type_id) {
        let wanted_object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === npcs[npc_index].wants_object_type_id; });
        $('#click_menu').append(npcs[npc_index].name + " wants " + object_types[wanted_object_type_index].name);

        // Go through our inventory and, if we have some, give us the option of giving them to the npc
        for (let i = 0; i < inventory_items.length; i++) {
            if (typeof inventory_items[i] !== 'undefined' && inventory_items[i].player_id === client_player_id &&
                inventory_items[i].object_type_id === npcs[npc_index].wants_object_type_id) {
                $('#click_menu').append("<button id='givenpc_" + inventory_items[i].id + "' npc_id='" +
                    npcs[npc_index].id + "' inventory_item_id='" + inventory_items[i].id +
                    "' class='button is-success is-small'>Give " + npcs[npc_index].name + " a " +
                    object_types[wanted_object_type_index].name + "</button>");
            }
        }
    } else {
        $('#click_menu').append("<br>" + npcs[npc_index].name + " has no desires<br>");
    }

    // and buying inventory
    let npc_inventory_item_count = 0;
    for(let i = 0; i < inventory_items.length; i++) {
        if(typeof inventory_items[i] && inventory_items[i].npc_id !== 'undefined' &&  inventory_items[i].npc_id === npcs[npc_index].id) {
            npc_inventory_item_count++;

            if(inventory_items[i].price) {

                let inventory_object_type_index = getObjectTypeIndex(inventory_items[i].object_type_id);

                $('#click_menu').append("<img style='width:28px;'" +
                " src='https://space.alphacoders.com/images/" + urlName(object_types[inventory_object_type_index].name) + ".png'>" +
                "<button class='button is-small' id='buy_" + inventory_items[i].id + "' npc_id='" + npcs[npc_index].id + "' " +
                " inventory_item_id='" + inventory_items[i].id + "'>Buy $" + inventory_items[i].price + "</button><br>");
            } else {


                
            }
        }
    }

    if(debug_mode) {
        if(npc_inventory_item_count === 0) {
            $('#click_menu').append("<br>No inventory items");
        }               
    }



}

function showClickMenuObject(coord) {
    //console.log("Has object id");
    let attack_object_shown = false;
    let object_index = -1;

    if(coord.object_id) {
        object_index = objects.findIndex(function (obj) { return obj && obj.id === coord.object_id; });
    } else if(coord.belongs_to_object_id) {
        object_index = objects.findIndex(function (obj) { return obj && obj.id === coord.belongs_to_object_id; });
    }

    

    if (object_index === -1) {
        return false;
    }

    let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === objects[object_index].object_type_id; });

    if (object_type_index === -1) {
        return false;
    }


    // If the object type is a stairs, and the player is standing on the coord, let them move onto it to move up
    if(object_types[object_type_index].is_portal && coord.id === client_player_info.coord.id) {
        console.log("Player right clicked on portal that they are on");
        $('#click_menu').append("<button id='moveportal' class='button is-default'>Go Back</button>");
        
    }


    // SPAWNING OTHER THINGS
    if (objects[object_index].has_spawned_object) {
        //console.log("User right clicked on something that spawns other things!");

        // TODO probably should find a better way of distinguishing between things that are mined over time, or insta-picked up
        if (objects[object_index].has_spawned_object && !object_types[object_type_index].can_be_mined) {
            $('#click_menu').append("<button class='button is-default' id='pickup_" + coord.object_id + "' object_id='" + coord.object_id + "'>Harvest</button><br>");

        }

    }

    if (object_types[object_type_index].can_be_mined) {

        // Mine or stop mining if we are already mining it
        let is_mining = false;
        for (let i = 0; i < mining_linkers.length; i++) {
            if (mining_linkers[i] && mining_linkers[i].player_id === client_player_id && mining_linkers[i].object_id === objects[object_index].id) {
                is_mining = true;
            }
        }

        if (is_mining) {
            if(coord.object_id) {
                $('#click_menu').append("<button id='minestop_object_" + coord.object_id + "' object_id='" + coord.object_id +
                "' class='button is-default is-small'>Stop Mining</button><br>");
            } else if(coord.belongs_to_object_id) {
                $('#click_menu').append("<button id='minestop_object_" + coord.belongs_to_object_id + "' object_id='" + coord.belongs_to_object_id +
                "' class='button is-default is-small'>Stop Mining</button><br>");
            }
            
        } else if (objects[object_index].has_spawned_object) {
            if(coord.object_id) {
                $('#click_menu').append("<button id='mine_object_" + coord.object_id + "' object_id='" + coord.object_id +
                "' class='button is-default is-small'>Mine</button><br>");
            } else if(coord.belongs_to_object_id) {
                $('#click_menu').append("<button id='mine_object_" + coord.belongs_to_object_id + "' object_id='" + coord.belongs_to_object_id +
                "' class='button is-default is-small'>Mine</button><br>");
            }
            
        }


    }


    // If this is a research station, see if we have a research associated with it
    



    // Object has inventory. If it's ours, let us take it. If it has a price, let us buy it
    if (objects[object_index].has_inventory) {
        //console.log("Object should have inventory");
        generateTakeBuyMenu(objects[object_index].id);
    }


    // SHIP OPTIONS
    if (object_types[object_type_index].is_ship) {

        //console.log("%c Player right clicked on a ship", log_warning);

        // If the ship is on a planet coord and doesn't have a player id, we can claim it. Switch ship

        // get the object index for the ship that our player is in
        let client_ship_index = objects.findIndex(function (obj) { return obj && obj.id === players[client_player_index].ship_id; });


        if (!objects[object_index].npc_id && !objects[object_index].player_id) {

            // Not completely sure my new IF is going to take care of every case
            //if(!objects[object_index].player_id ||
            //    (objects[object_index].player_id === client_player_id && objects[object_index].id !== players[client_player_index].ship_id)) {



            if(object_types[object_type_index].can_be_claimed) {


                // Turns out claiming pods is a mess (non-abandoned pods everywhere)
                if(object_types[object_type_index].id !== 114) {

                    $('#click_menu').append("<button id='claimship_" + objects[object_index].id +
                    "' class='button is-info is-small'>Claim Ship</button><br>");
                }
                

                if(objects[client_ship_index].object_type_id === 114) {
                    $('#click_menu').append("<button id='switchship_" + objects[object_index].id +
                    "' class='button is-warning is-small'>Claim and Switch To Ship (Abandons Pod)</button><br>");
                } else {
                    $('#click_menu').append("<button id='switchship_" + objects[object_index].id +
                    "' class='button is-warning is-small'>Claim and Switch To Ship</button><br>");
                }
                
            }

            
        } else if (objects[object_index].player_id === client_player_id && objects[object_index].id !== players[client_player_index].ship_id) {

            // If we are in a pod, it will be abandoned, otherwise it will still be our ship
            if(objects[client_ship_index].object_type_id === 114) {
                $('#click_menu').append("<button id='switchship_" + objects[object_index].id + "' object_id='" + objects[object_index].id +
                "' class='button is-warning is-small'>Switch To (Abandons Pod)</button>");
            } else {

        


                $('#click_menu').append("<button id='switchship_" + objects[object_index].id + "' object_id='" + objects[object_index].id +
                "' class='button is-warning is-small'>Switch To</button>");

                // Only show the Dock At Azure Planet button if the ship is not dockable itself
                if(!object_types[object_type_index].is_dockable) {
                    $('#click_menu').append("<button id='dockcommand_" + objects[object_index].id + "' object_id='" + objects[object_index].id +
                    "' class='button is-warning is-small'>Dock At Azure Planet</button><br>");
                }
                
            }

            

        }


        



        // Give the player the option to attack the ship
        // see if we are already attacking based on the battle linkers we have
        let player_is_attacking = false;
        battle_linkers.forEach(function (battle_linker, i) {
            if (battle_linker.attacking_type === 'object' && battle_linker.attacking_id === objects[client_ship_index].id &&
                battle_linker.being_attacked_type === 'object' && battle_linker.being_attacked_id === coord.object_id) {
                player_is_attacking = true;
            }
        });

        // I think we don't need these here
        /*
        if(player_is_attacking) {
            $('#click_menu').append("<button id='attackstop_object_" + coord.object_id + "' " +
                "object_id='" + coord.object_id + " class='btn btn-warning btn-sm'>Stop Attacking</button>");
        } else {
            $('#click_menu').append("<button id='attack_object_" + coord.object_id + "' " +
                "object_id='" + coord.object_id + "' class='btn btn-warning btn-sm' source='ship_options'>Attack</button>");
            attack_object_shown = true;
        }
        */

        // If it's Our ship, we can also set a destination
        if (coord.object_id === players[client_player_index].ship_id || coord.belongs_to_object_id === players[client_player_index].ship_id) {

            $('#click_menu').append("<button class='button is-info' id='showautopilot' " +
                "top='" + mouse_y + "' left='" + mouse_x + "'>Set Autopilot Destination</button>");
        }


        // We want the player to be able to just have their ship next to the other ship, and move through the airlock
        // Gotta make sure the ships are close enough to each other

        // Not actually sure I want to go that route, and just focus on is_dockable stuff
        //$('#click_menu').append("<button class='button' id='moveairlock_" + objects[object_index].id + "'>Move Through Airlocks</button>");



    }


    /*
    // Now that we have tint and name options for basically everything we own - no need for a more specific management button
    if(object_types[object_type_index].can_have_rules) {

        // For now just limit the ability add rules to the person that created the object
        if(objects[object_index].player_id === client_player_id) {
            $('#click_menu').append("<button id='manage_" + objects[object_index].id +
                "' object_id='" + objects[object_index].id + "' class='button is-default is-small'>Manage</button>");
        }
    }
    */



    // Elevator! Give the player the option to move to the different floors this elevator can go to!
    if (objects[object_index].object_type_id === 269) {

        // Find our base elevator linker
        let elevator_linker_index = elevator_linkers.findIndex(function (obj) { return obj && obj.object_id === objects[object_index].id });

        if (elevator_linker_index === -1) {
            console.log("Could not find an elevator linker for the elevator we right clicked on");
        } else {

            let showing_elevator_levels = [];

            for (let i = 0; i < elevator_linkers.length; i++) {
                if (elevator_linkers[i] && elevator_linkers[i].group_id === elevator_linkers[elevator_linker_index].group_id) {
                    showing_elevator_levels.push(elevator_linkers[i]);
                }
            }

            showing_elevator_levels.sort((a, b) => (a.level < b.level) ? 1 : -1)

            if (showing_elevator_levels.length > 0) {
                for (let i = 0; i < showing_elevator_levels.length; i++) {
                    $('#click_menu').append("<button id='use_elevator_" + showing_elevator_levels[i].object_id + "'>Head To Level " + showing_elevator_levels[i].level + "</button><br>");
                }
            }
        }



    }


    // REPAIRING
    if (object_types[object_type_index].repaired_object_type_id || object_types[object_type_index].can_be_repaired) {


        let repairing_linker_index = -1;

        if (coord.ship_id) {
            repairing_linker_index = repairing_linkers.findIndex(function (obj) {
                return obj && obj.player_id === client_player_id &&
                    obj.ship_coord_id === coord.id;
            });
        } else if (coord.planet_id) {
            repairing_linker_index = repairing_linkers.findIndex(function (obj) {
                return obj && obj.player_id === client_player_id &&
                    obj.planet_coord_id === coord.id;
            });
        }

        let show_repair_option = false;

        if (object_index !== -1 && objects[object_index].current_hp < object_types[object_type_index].hp) {
            show_repair_option = true;
        } else if (object_type_index !== -1 && object_types[object_type_index].repaired_object_type_id) {
            show_repair_option = true;
        }

        if (repairing_linker_index === -1 && show_repair_option) {
            $('#click_menu').append("<button id='repair_" + coord.id + "' " +
                "coord_id='" + coord.id + "' class='button is-success'>" +
                "Repair</button><br>");
        } else if (repairing_linker_index !== -1) {
            $('#click_menu').append("<button id='repairstop_" + coord.id + "' " +
                "coord_id='" + coord.id + "' class='button is-warning is-small'>" +
                "Stop Repairing</button>");
        }

    }


    // If it belongs to us, we can place things in it
    // Commented out: objects[object_index].player_id === player_id
    // Reason: We are going to do multiple tiers of things that can have inventory. Higher tiers will be 'smart' with rules
    if (object_types[object_type_index].can_have_inventory) {
        // let players put their stuff in
        let player_inventory_items = inventory_items.filter(inventory_item => inventory_item.player_id === client_player_id &&
            inventory_item.body_id === players[client_player_index].body_id);

        player_inventory_items.forEach(function (inventory_item) {
            let inventory_item_object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === inventory_item.object_type_id; });
            if (inventory_item_object_type_index !== -1) {

                let put_in_string = "";
                put_in_string += "<div style='display:inline-block; position:relative; width:146px; height:74px; " +
                    " background-image: url(https://space.alphacoders.com/images/" +
                    urlName(object_types[inventory_item_object_type_index].name) + ".png); background-repeat: no-repeat; " +
                    " background-position: top; " +
                    " border: 1px #c8c1c1 solid; border-radius:6px; margin:2px;'>";

                put_in_string += "<div style='position:absolute; right: 4px; bottom: 0;'>";

                put_in_string += "Put In:";

                put_in_string += "<button  id='place_" +
                    inventory_item.id + "_all' class='button is-default is-small' storage_object_id='" + objects[object_index].id + "' " +
                    " inventory_item_id='" + inventory_item.id + "' amount='all'>All</button>";

                put_in_string += "<button  id='place_" +
                    inventory_item.id + "_10' class='button is-default is-small' storage_object_id='" + objects[object_index].id + "' " +
                    " inventory_item_id='" + inventory_item.id + "' amount='10'>10</button>";

                put_in_string += "<button  id='place_" +
                    inventory_item.id + "_1' class='button is-default is-small' storage_object_id='" + objects[object_index].id + "' " +
                    " inventory_item_id='" + inventory_item.id + "' amount='1'>1</button>";

                put_in_string += "</div>";



                put_in_string += "</div>";

                $('#click_menu').append(put_in_string);

                /*
                $('#click_menu').append("<img style='width:28px;' src='https://space.alphacoders.com/" + urlName(object_types[object_type_index].name) + ".png'>" +
                    "<button id='place_" + inventory_item.id + "' class='button is-default' storage_object_id='" + objects[object_index].id + "' " +
                    " inventory_item_id='" + inventory_item.id + "'>Put In</button><br>");
                */
            }

        });
    }



    // Commented out: && objects[object_index].player_id === player_id
    // Reason: We are going to do multiple tiers of things that can have inventory. Higher tiers will be 'smart' with rules
    if (object_types[object_type_index].is_converter) {
        $('#click_menu').append("<div>");

        
        let conversion_linkers = object_type_conversion_linkers.filter(linker => linker.object_type_id === object_types[object_type_index].id);

        if (conversion_linkers) {
            conversion_linkers.forEach(function (conversion_linker) {


                if (conversion_linker.input_type === "hp") {
                    $('#click_menu').append("<button class='button is-default' id='convert_hp' converter_object_id='" + objects[object_index].id + "'>Get paid for some life force</button>");
                }

                if (conversion_linker.input_type === "object_type") {
                    // let players put their stuff in and see what happens!
                    let player_inventory_items = inventory_items.filter(inventory_item => inventory_item.player_id === client_player_id &&
                        inventory_item.body_id === players[client_player_index].body_id);

                    player_inventory_items.forEach(function (inventory_item) {
                        let item_object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === inventory_item.object_type_id; });
                        if (item_object_type_index !== -1 && object_types[item_object_type_index].id === conversion_linker.input_object_type_id) {
                            $('#click_menu').append(object_types[item_object_type_index].name +
                                "<button class='button is-default' id='convert_" + inventory_item.id + "' converter_object_id='" + objects[object_index].id + "' " +
                                " inventory_item_id='" + inventory_item.id + "'>Convert</button><br>");
                        }

                    });
                }
            });
        }



        $('#click_menu').append("</div>");
    }



    // See if anything can be dropped onto this
    let can_be_dropped_object_types = object_types.filter(object_type => object_type.drop_requires_object_type_id === objects[object_index].object_type_id);
    if (can_be_dropped_object_types.length > 0) {
        // For each of these, see if the client player has an inventory item that matches
        for (let i = 0; i < can_be_dropped_object_types.length; i++) {
            let inventory_item_index = inventory_items.findIndex(function (obj) { return obj && obj.player_id === client_player_id && obj.object_type_id === can_be_dropped_object_types[i].id; });
            if (inventory_item_index !== -1) {
                $('#click_menu').append(can_be_dropped_object_types[i].name + " <button id='drop_" + inventory_items[inventory_item_index].id + "_1' x='" + coord.tile_x +
                    "' y='" + coord.tile_y + "' amount='1' class='button is-default is-small'>Place On</button>");
            }
        }
    }



    /******************** INDIVIDUAL THINGS. SHOULD TRY AND MAKE FLAGS LIKE can_store_items, can_manage, etc ****************/

    if (objects[object_index].object_type_id === 360) {    // AUGMENTATION STATION
        console.log("User right clicked on Augmentation Station!");
        //if(objects[object_index].player_id === player_id) {

        printAssemblyList(objects[object_index], coord);
        //}


    }

    if (objects[object_index].object_type_id === 119) {  // FOOD REPLICATOR

        printAssemblyList(objects[object_index], coord);

    }



    if (objects[object_index].object_type_id === 90) {    // MANUFACTURER
        //console.log("User right clicked on Manufacturer!");
        //if(objects[object_index].player_id === player_id) {

        printAssemblyList(objects[object_index], coord);
        //}


    }



    

    if (objects[object_index].object_type_id === 402) {    // ARCHITECT STATION
        //console.log("User right clicked on Manufacturer!");
        //if(objects[object_index].player_id === player_id) {

        printAssemblyList(objects[object_index], coord);
        //}


    }



    if (objects[object_index].object_type_id === 116 || objects[object_index].object_type_id === 435 || objects[object_index].object_type_id === 436) { // SHIPYARDS
        printAssemblyList(objects[object_index], coord);
    }


    if (objects[object_index].object_type_id === 126) {   // CLONING VAT

        console.log("User right clicked on Cloning Vat");
        printAssemblyList(objects[object_index], coord);
        shown_options = true;

    }

    if (objects[object_index].object_type_id === 127) {  // RESEARCHER
        //console.log("Research station options");

        // Show a research menu
        shown_options = true;


        let researcher_is_active = false;
        for(let i = 0; i < researches.length; i++) {

            if(researches[i]) {
                if(researches[i].researcher_object_id === objects[object_index].id) {
                    researcher_is_active = true;
    
                    let html_string = "Researching ";
    
                    let being_researched_object_type_index = getObjectTypeIndex(researches[i].being_researched_object_type_id);
    
                    html_string += object_types[being_researched_object_type_index].name + " Tick " + researches[i].current_tick_count + "/" + 
                        object_types[being_researched_object_type_index].research_tick_count;
    
    
    
                    $('#click_menu').append(html_string);
    
                }
            }

           
        }


        if(!researcher_is_active) {
            let player_inventory_items = inventory_items.filter(inventory_item => inventory_item.player_id === client_player_id &&
                inventory_item.body_id === players[client_player_index].body_id);
    
            player_inventory_items.forEach(function (inventory_item) {
                let inventory_item_object_type_index = object_types.findIndex(function (obj) {
                    return obj && obj.id === inventory_item.object_type_id;
                });
                if (inventory_item_object_type_index !== -1) {
    
                    //  Only show if the player hasn't already maxed out the research
                    let research_linker_index = player_research_linkers.findIndex(function (obj) {
                        return obj &&
                            obj.player_id === client_player_id && obj.object_type_id === object_types[inventory_item_object_type_index].id;
                    });
    
                    // Player is already done researching that
                    if (research_linker_index !== -1 && player_research_linkers[research_linker_index].researches_completed >= object_types[inventory_item_object_type_index].research_times_required) {
    
                    } else if (object_types[inventory_item_object_type_index].can_be_researched) {
                        $('#click_menu').append(object_types[inventory_item_object_type_index].name +
                            "<button id='research_" + inventory_item.id + "' object_id='" + objects[object_index].id +
                            "' class='button is-default is-small'>Research</button><br>");
                    }
    
    
                }
    
            });
        }
      
    }

    // FORGE
    if (objects[object_index].object_type_id === 177) {

        $('#click_menu').append("<div style='margin-bottom:10px;'>");

        printAssemblyList(objects[object_index], coord);

        $('#click_menu').append("</div>");

    }


    //  AUTO DOC Show some cool auto doc implanting options
    if (objects[object_index].object_type_id === 140) {

        let client_body_index = objects.findIndex(function (obj) { return obj && obj.id === players[client_player_index].body_id; });

        let object_npc_index = -1;
        if (objects[object_index].npc_id) {
            object_npc_index = getNpcIndex(objects[object_index].npc_id);
            if (object_npc_index === -1) {
                console.log("Not sure if we should request npc info here. Could be a decent spot, but the NPC could also be dead");
            }
        }

        for (let i = 0; i < inventory_items.length; i++) {

            if (inventory_items[i] && inventory_items[i].player_id === client_player_id) {

                // see if there's an equip linker that requires an auto doc
                for (let j = 0; j < object_type_equipment_linkers.length; j++) {

                    // We found an object_type_equipment_linker that matches the object_type of the inventory item
                    if (object_type_equipment_linkers[j].object_type_id === inventory_items[i].object_type_id) {

                        let auto_doc_required = false;

                        if (object_type_equipment_linkers[j].auto_doc_required) {
                            auto_doc_required = true;
                        }

                        // If there's already something else there, we will need an auto doc too
                        let current_equipment_in_slot = 0;
                        let current_capacity_used = 0;

                        for (let e = 0; e < equipment_linkers.length; e++) {
                            if (equipment_linkers[e] && equipment_linkers[e].body_id === objects[client_body_index].id &&
                                equipment_linkers[e].equip_slot === object_type_equipment_linkers[j].equip_slot) {

                                let existing_equipment_linker_index = object_type_equipment_linkers.findIndex(function (obj) {
                                    return obj && obj.object_type_id === equipment_linkers[e].object_type_id && obj.equip_slot === object_type_equipment_linkers[j].equip_slot;
                                });

                                if (existing_equipment_linker_index !== -1) {
                                    current_equipment_in_slot++;
                                    current_capacity_used += object_type_equipment_linkers[existing_equipment_linker_index].capacity_used;
                                }

                            }
                        }

                        if (current_equipment_in_slot > 0) {
                            auto_doc_required = true;
                        }


                        if (auto_doc_required) {

                            let inventory_item_object_type_index = object_types.findIndex(function (obj) {
                                return obj && obj.id === inventory_items[i].object_type_id;
                            });


                            // Two different scenarios

                            // 1. Its our auto doc
                            if (objects[object_index].player_id && client_player_id && objects[object_index].player_id === client_player_id) {
                                $('#click_menu').append("<img style='width:32px; height:32px;' " +
                                    "src='https://space.alphacoders.com/images/" + urlName(object_types[inventory_item_object_type_index].name) + ".png'> " +
                                    "<button id='equip_" + inventory_items[i].id + "_" + object_type_equipment_linkers[j].equip_slot +
                                    "' inventory_item_id='" + inventory_items[i].id + "' equip_slot='" + object_type_equipment_linkers[j].equip_slot + "' " +
                                    " class='button is-small'>Implant " + object_types[inventory_item_object_type_index].name + " Into Your " +
                                    object_type_equipment_linkers[j].equip_slot + "</button><br>");
                            }
                            // 2. It's the auto doc of an npc
                            if (objects[object_index].npc_id && object_npc_index !== -1) {
                                let npc_surgery_level = 1 + Math.floor(difficult_level_modifier * Math.sqrt(npcs[object_npc_index].surgery_skill_points));

                                $('#click_menu').append("<img style='width:32px; height:32px;' " +
                                    "src='https://space.alphacoders.com/images/" + urlName(object_types[inventory_item_object_type_index].name) + ".png'> " +
                                    "<button id='equip_" + inventory_items[i].id + "_" + object_type_equipment_linkers[j].equip_slot +
                                    "' inventory_item_id='" + inventory_items[i].id + "' equip_slot='" + object_type_equipment_linkers[j].equip_slot + "' " +
                                    " class='button is-small'>Pay $" + npc_surgery_level + " Credits: Implant " + object_types[inventory_item_object_type_index].name + " Into Your " +
                                    object_type_equipment_linkers[j].equip_slot + "</button><br>");
                            }



                        }
                    }

                }
            }
        }
    }



    //  AUTO DOC Show some cool auto doc implanting options
    if (objects[object_index].object_type_id === 376) {
        $('#click_menu').append("<button class='button is-info' id='viewchange_virtual' newview='virtual'>Enter Virtual Realm</button>");

    }

    // IRON DOOR
    /*
    if(objects[object_index].object_type_id === 185) {
        if(objects[object_index].player_id === player_id) {
            $('#click_menu').append("<button id='manage_" + objects[object_index].id + "' object_id='" + objects[object_index].id + "'>Manage</button>");
        }

    }
    */



    // Switch Body Options
    if (object_types[object_type_index].race_id) {
        $('#click_menu').append("<button id='switchbody_" + objects[object_index].id +
            "_nomove' move_inventory='no' class='button is-warning is-small'>Switch To Body</button>");

        $('#click_menu').append("<button id='switchbody_" + objects[object_index].id +
            "_yesmove' move_inventory='yes' class='button is-warning is-small'>Switch to Body and Move Inventory</button>");
    }


    // Pick Up
    if (object_types[object_type_index].can_pick_up) {
        $('#click_menu').append("<button id='pickup_" + coord.object_id + "' class='button is-default is-small' object_id='" + coord.object_id + "'>Pick Up</button><br>");
    }


    // If it's our object, let try offering setting tint and name options
    if (objects[object_index].player_id === client_player_id) {
        let options_string = "<br><button class='button is-default is-small is-primary' id='manage_" + objects[object_index].id + "' object_id='" + objects[object_index].id + "'>Manage</button>";

        $('#click_menu').append(options_string);
    }

    // Salvaging
    if (object_types[object_type_index].can_be_salvaged) {

        showSalvageOption(object_index, object_type_index);
    }





    // Let abandoned pods be attackable too
    if (object_types[object_type_index].can_be_attacked || (object_types[object_type_index].id === 114 && isFalse(objects[object_index].player_id)) ) {
        //console.log("can be attacked (or abandoned pod)");

        // see if we are already attacking based on the battle linkers we have
        let player_is_attacking = false;
        let active_battle_linkers = battle_linkers.filter(n => n);
        if (active_battle_linkers.length > 0) {
            for (let battle_linker of battle_linkers) {
                if (battle_linker) {
                    //console.log("Checking against battle linker: ");
                    //console.log(battle_linker);
                    if (battle_linker.attacking_type === 'player' && battle_linker.attacking_id === client_player_id &&
                        battle_linker.being_attacked_type === 'object' && battle_linker.being_attacked_id === objects[object_index].id) {
                        //console.log("Found matching battle linker");
                        player_is_attacking = true;
                    }

                    // If we are in the galaxy, we should check object v object too
                    if (current_view === "galaxy" && battle_linker.attacking_type === 'object' &&
                        battle_linker.attacking_id === players[client_player_index].ship_id &&
                        battle_linker.being_attacked_type === 'object' && battle_linker.being_attacked_id === objects[object_index].id) {
                        //console.log("Found matching battle linker");
                        player_is_attacking = true;
                    }
                }

            }
        }



        if (player_is_attacking) {
            console.log("Player is attacking the object");
            $('#click_menu').append("<button id='attackstop_object_" + objects[object_index].id + "' " +
                "object_id='" + objects[object_index].id + "' class='button is-warning is-small'>" +
                "Stop Attacking</button>");
        } else {

            // It's our object, we can do whatever we want with it!
            if (objects[object_index].player_id && objects[object_index].player_id === client_player_id) {

                $('#click_menu').append("<br><button id='attack_" + objects[object_index].id + "' object_id='" + objects[object_index].id +
                    "' class='button is-warning is-small' source='object_type_can_be_attacked'>Attack " +
                    object_types[object_type_index].name + "</button>");

                $('#click_menu').append("<br><button id='destroy_" + objects[object_index].id + "' object_id='" + objects[object_index].id +
                    "' class='button is-danger is-small is-pulled-right' source='object_type_can_be_attacked'>Destroy " +
                    object_types[object_type_index].name + "</button>");
            }
            // Just an attack option
            else {

                // No attack option if we are in the galaxy view and in a pod
                let pod_in_galaxy = false;
                if(current_view === 'galaxy') {
                    let player_ship_index = objects.findIndex(function(obj) { return obj && obj.id === players[client_player_index].ship_id; });
                    if(player_ship_index !== -1 && objects[player_ship_index].object_type_id === 114) {
                        pod_in_galaxy = true;
                    }
                    
                }

                if(!pod_in_galaxy) {
                    $('#click_menu').append("<br><button id='attack_" + objects[object_index].id + "' object_id='" + objects[object_index].id +
                    "' class='button is-warning is-small' source='object_type_can_be_attacked'>Attack " +
                    object_types[object_type_index].name + "</button><br>");
                } else {
                    $('#click_menu').append("<br><a target='_blank' href='https://space.alphacoders.com/site/tutorial/ship-building'>Build A Better Ship To Attack</a>");
                }
                
            }
        }





    }




}

function showClickMenuObjectType(coord) {
    //console.log("In showClickMenuObjectType");
    // there's an object type here - but no object id

    let object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === coord.object_type_id; });

    if (object_type_index !== -1) {


        // Repair
        //console.log("Got floor type index");
        if (object_types[object_type_index].repaired_object_type_id) {

            //console.log("Floor type has repaired floor type id");

            // see if we are already repairing it
            let repairing_linker_index = repairing_linkers.findIndex(function (obj) {
                return obj && obj.player_id === client_player_id &&
                    obj.ship_coord_id === coord.id;
            });


            if (repairing_linker_index === -1) {
                $('#click_menu').append("<button id='repair_" + coord.id + "' " +
                    "coord_id='" + coord.id + "' class='button is-success'>" +
                    "Repair</button><br>");
            } else {
                $('#click_menu').append("<button id='repairstop_" + coord.id + "' " +
                    "coord_id='" + coord.id + "' class='button is-warning is-small'>" +
                    "Stop Repairing</button>");
            }

        } else {
            //console.log("Object type does not have repaired object type id");
        }


        // Pick Up
        if (object_types[object_type_index].can_pick_up) {
            //console.log("Object type can be picked up");

            let html_string = "<button id='pickup_" + coord.id + "' class='button is-default is-small' ";
            if (coord.planet_id) {
                html_string += " planet_coord_id='" + coord.id + "' ";
            } else if (coord.ship_id) {
                html_string += " ship_coord_id='" + coord.id + "' ";
            } else { 
                html_string += " coord_id='" + coord.id + "' ";
            }

            html_string += ">Pick Up</button>";

            $('#click_menu').append(html_string);
        }

        // Salvaging
        if (object_types[object_type_index].can_be_salvaged) {
            //console.log("Can be salvaged");

            showSalvageOption(-1, object_type_index, coord);
        } else {
            console.log("Can't be salvaged");
        }


        // If the object type is a stairs, and the player is standing on the coord, let them move onto it to move up
        if(object_types[object_type_index].is_stairs && coord.id === client_player_info.coord.id) {
            console.log("Player right clicked on stairs that they are on");
            $('#click_menu').append("<button id='moveupstairs' class='button is-default'>Move Up Stairs</button>");
            
        }

        // If the object type is a stairs, and the player is standing on the coord, let them move onto it to move up
        if(object_types[object_type_index].is_hole && coord.id === client_player_info.coord.id) {
            console.log("Player right clicked on hole that they are on");
            $('#click_menu').append("<button id='moveupstairs' class='button is-default'>Move Down Hole</button>");
            
        }

        // If it's just an object type and it can be attacked - it's just insta-destroyed
        // There is no object to keep track of a current HP for
        if (object_types[object_type_index].can_be_attacked) {
            if (current_view === 'planet') {
                $('#click_menu').append("<br><br><button id='destroy_" + coord.id + "' planet_coord_id='" +
                    coord.id + "' class='button is-danger is-small'>Destroy " + object_types[object_type_index].name + "</button>");
            } else if (current_view === 'ship') {
                $('#click_menu').append("<br><br><button id='destroy_" + coord.id + "' ship_coord_id='"
                    + coord.id + "' class='button is-danger is-small'>Destroy " + object_types[object_type_index].name + "</button>");
            } else if (current_view === 'galaxy') {
                $('#click_menu').append("<br><br><button id='destroy_" + coord.id + "' coord_id='" +
                    coord.id + "' class='button is-danger is-small'>Destroy " + object_types[object_type_index].name + "</button>");
            }

        }

    }

    // We want to let the player replace a ship wall with other wall objects
    if (current_view === "ship" && object_types[object_type_index].is_wall) {

        // I guess we can just go through the inventory and see if there's an object/object type match
        for (let i = 0; i < inventory_items.length; i++) {
            if (inventory_items[i] && inventory_items[i].player_id === client_player_id) {


                let inventory_item_object_type_index = -1;
                if (inventory_items[i].object_type_id) {
                    inventory_item_object_type_index = getObjectTypeIndex(inventory_items[i].object_type_id);
                } else if (inventory_items[i].object_id) {
                    let inventory_item_object_index = getObjectIndex(inventory_items[i].object_id);
                    if (inventory_item_object_index !== -1) {
                        inventory_item_object_type_index = getObjectTypeIndex(objects[inventory_item_object_index].object_type_id);
                    }
                }



                // Not doing is_ship_wall right now
                /*
                if(inventory_item_object_type_index !== -1 && object_types[inventory_item_object_type_index].is_ship_wall) {
                    $("#click_menu").append("<button id='replaceshipwall_" + inventory_items[i].id +
                        "' inventory_item_id='" + inventory_items[i].id + "' ship_coord_id='" + coord.id + "'>" +
                        "Replace ship wall with " + object_types[inventory_item_object_type_index].name + "</button>");
                }
                */

            }
        }

    }
}

function showClickMenuPlanet(coord) {

    console.log("Showing click menu for planet id: " + coord.planet_id + "/" + coords.belongs_to_planet_id);

    if (client_player_index === -1) {
        return false;
    }

    // If we aren't in a pod, we can potentially attack it
    let client_ship_index = getObjectIndex(players[client_player_index].ship_id);
    let client_ship_type_index = getObjectTypeIndex(objects[client_ship_index].object_type_id);

    if (object_types[client_ship_type_index].id === 114) {
        return false;
    }

    let planet_id = 0;
    if (coord.planet_id) {
        planet_id = coord.planet_id;
    } else if (coord.belongs_to_planet_id) {
        planet_id = coord.belongs_to_planet_id;
    }

    let planet_index = getPlanetIndex({ 'planet_id': planet_id });

    // see if we are already attacking based on the battle linkers we have
    let player_is_attacking = false;

    for (let i = 0; i < battle_linkers.length && player_is_attacking === false; i++) {
        if (battle_linkers[i] && battle_linkers[i].attacking_type === 'object' && battle_linkers[i].attacking_id === players[client_player_index].ship_id &&
            battle_linkers[i].being_attacked_type === 'planet' && battle_linkers[i].being_attacked_id === planet_id) {
            player_is_attacking = true;
            console.log("Player is already attacking this planet!");
        }
    }



    if (player_is_attacking) {
        console.log("Player is attacking the planet");
        $('#click_menu').append("<button id='attackstop_planet_" + planet_id + "' " +
            "planet_id='" + planet_id + "' class='button is-warning is-small'>" +
            "Stop Attacking</button>");
    } else {
        //console.log("Going to give the playet the opportunity to attack the planet");

        let attack_text = "Attack Planet";

        if (planet_index !== -1) {
            attack_text = "Attack Planet " + planets[planet_index].name;
        }

        // Can't just use coord.planet_id here because the coord could be a belongs_to_planet_id coord
        $('#click_menu').append("<br><button id='attack_planet_" + planet_id + "' planet_id='" + planet_id +
            "' class='button is-warning is-small' source='planet_attack'>" + attack_text + "</button><br>");

    }


}

function showClickMenuShipEngine(coord) {

    // Go through the player's inventory, and let them drop (install) an engine here

    let ship_engine_string = "";

    let had_ship_engine_in_inventory = false;

    for (let i = 0; i < inventory_items.length; i++) {
        if (inventory_items[i] && inventory_items[i].player_id === players[client_player_index].id) {

            let object_type_index = getObjectTypeIndex(inventory_items[i].object_type_id);

            if (object_type_index !== -1 && object_types[object_type_index].is_ship_engine) {

                if(!had_ship_engine_in_inventory) {
                    had_ship_engine_in_inventory = true;
                }

                ship_engine_string += "<div style='display:inline-block; position:relative; width:146px; height:74px; " +
                    " background-image: url(https://space.alphacoders.com/images/" +
                    urlName(object_types[object_type_index].name) + ".png); background-repeat: no-repeat; " +
                    " background-position: top; " +
                    " border: 1px #c8c1c1 solid; border-radius:6px; margin:2px;'>";

                ship_engine_string += "<div style='position:absolute; right: 4px; bottom: 0;'>";

                ship_engine_string += "<button id='drop_" + inventory_items[i].id + "_1' x='" + coord.tile_x +
                    "' y='" + coord.tile_y + "' amount='1' class='button is-default is-small'>Install</button>";


                ship_engine_string += "</div>";

                ship_engine_string += "</div>";

            }

        }
    }

    if(!had_ship_engine_in_inventory) {
        ship_engine_string += "You can install a ship engine here. Build ship engines in a Manufacturer!";
    }

    $('#click_menu').append(ship_engine_string);
}


function showClickMenuShipWeapon(coord) {

    // Go through the player's inventory, and let them drop (install) a weapon here

    let ship_weapon_string = "";
    let had_ship_weapon_in_inventory = false;

    for (let i = 0; i < inventory_items.length; i++) {
        if (inventory_items[i] && inventory_items[i].player_id === players[client_player_index].id) {

            let object_type_index = getObjectTypeIndex(inventory_items[i].object_type_id);

            if (object_type_index !== -1 && object_types[object_type_index].is_ship_weapon) {

                if(!had_ship_weapon_in_inventory) {
                    had_ship_weapon_in_inventory = true;
                }

                ship_weapon_string += "<div style='display:inline-block; position:relative; width:146px; height:74px; " +
                    " background-image: url(https://space.alphacoders.com/images/" +
                    urlName(object_types[object_type_index].name) + ".png); background-repeat: no-repeat; " +
                    " background-position: top; " +
                    " border: 1px #c8c1c1 solid; border-radius:6px; margin:2px;'>";

                ship_weapon_string += "<div style='position:absolute; right: 4px; bottom: 0;'>";

                ship_weapon_string += "<button id='drop_" + inventory_items[i].id + "_1' x='" + coord.tile_x +
                    "' y='" + coord.tile_y + "' amount='1' class='button is-default is-small'>Install</button>";


                ship_weapon_string += "</div>";

                ship_weapon_string += "</div>";

            }

        }
    }

    if(!had_ship_weapon_in_inventory) {
        ship_weapon_string += "You can install a ship weapon here. Build ship weapons in a Forge!";
    }

    $('#click_menu').append(ship_weapon_string);

}

function showDockedShip(ship) {

    let html_string = "";
    html_string += "<div class='white-text'>";

    let docked_ship_type_index = object_types.findIndex(function (obj) {
        return obj &&
            obj.id === ship.object_type_id;
    });


    html_string += object_types[docked_ship_type_index].name;

    if (ship.name) {
        html_string += ": " + ship.name;
    }

    if (debug_mode) {
        html_string += " ID: " + ship.id;
    }

    if (ship.id === players[client_player_index].ship_id) {
        html_string += "<span class='tag is-success'>Current Ship</span>";

    } else {
        html_string += "<button id='switchship_" + ship.id + "' object_id='" + ship.id + "' class='button is-warning is-small'>Switch To</button>";
    }

    html_string += "</div>";

    html_string += "<br>";

    return html_string;
}


function showInventoryOptions(inventory_item_id) {

    //let mouse_x = event.clientX;
    //let mouse_y = event.clientY;


    $('#click_menu').css({
        'top': mouse_y, 'left': mouse_x, 'position': 'absolute', 'max-height': '400px', 'max-width': '600px',
        'overflow-y': 'scroll', 'overflow-x': 'scroll', 'padding': '10px'
    }).fadeIn('fast');

    $('#click_menu').empty();

    let inventory_item_index = inventory_items.findIndex(function (obj) { return obj && obj.id === inventory_item_id; });



    let object_type_index = -1;
    let floor_type_index = -1;
    if (inventory_items[inventory_item_index].object_id) {
        let object_index = objects.findIndex(function (obj) { return obj && obj.id === inventory_items[inventory_item_index].object_id; });
        if (object_index === -1) {
            //console.log("Have inventory item but don't have the object associated with it. object id: "
            //    + inventory_items[inventory_item_index].object_id + ". Requesting info");
            socket.emit('request_object_info', { 'object_id': inventory_items[inventory_item_index].object_id });
            return;
        }

        object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === objects[object_index].object_type_id; });
    } if (inventory_items[inventory_item_index].object_type_id) {
        object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === inventory_items[inventory_item_index].object_type_id; });
    } else if (inventory_items[inventory_item_index].floor_type_id) {
        floor_type_index = floor_types.findIndex(function (obj) { return obj && obj.id === inventory_items[inventory_item_index].floor_type_id; });
    }


    let adding_string = "";

    if (object_type_index !== -1) {

        adding_string += object_types[object_type_index].name + "<br>";
        if (object_types[object_type_index].is_equippable) {
            //console.log("Object type " + object_types[object_type_index].name + " is equippable");

            let type_equipment_linkers = object_type_equipment_linkers.filter(linker => linker.object_type_id === object_types[object_type_index].id);

            //console.log("Length of type_equipment_linkers: " + type_equipment_linkers.length);
            if (type_equipment_linkers.length > 0) {
                //console.log("Adding equip button stuff");



                type_equipment_linkers.forEach(function (linker) {
                    adding_string += "<button id='equip_" + inventory_items[inventory_item_index].id + "_" + linker.equip_slot +
                        "' inventory_item_id='" + inventory_items[inventory_item_index].id + "' equip_slot='"
                        + linker.equip_slot + "' class='button is-small'>" + linker.equip_slot + "</button>";
                });


            }

            //adding_string += "<button id='equip_" + inventory_items[inventory_item_index].id + "' class='btn btn-info btn-xs'>Equip</button>";
        }

        // see if the body the player has can eat this
        let body_index = objects.findIndex(function (obj) { return obj && obj.id === players[client_player_index].body_id; });
        if (body_index !== -1) {

            let body_object_type_index = object_types.findIndex(function (obj) { return obj && obj.id === objects[body_index].object_type_id; });

            //console.log("Our body's race id: " + object_types[body_object_type_index].race_id);

            // now lets see if the race can eat this one
            race_eating_linkers.forEach(function (race_eating_linker) {


                if (race_eating_linker.race_id === object_types[body_object_type_index].race_id && race_eating_linker.object_type_id === object_types[object_type_index].id) {
                    adding_string += "<button id='eat_" + inventory_items[inventory_item_index].id + "' class='button is-info'>Eat</button><br>";
                }
            });
        }
    }

    adding_string += "<br><button id='trash_" + inventory_items[inventory_item_index].id + "' class='button is-danger is-small is-pulled-right'><span class='glyphicon glyphicon-trash'></span> Trash</button>";
    $('#click_menu').append(adding_string);
}


// We can show a salvage option for both objects and object types
// In the case of an object type, the object_index will be -1

function showSalvageOption(object_index, object_type_index, coord = {}) {
    //console.log("In showSalvageOption");
    // If we are already salvaging it, give us the option to stop
    let is_being_salvaged = false;
    let coord_type = "";
    let salvaging_linker_index = -1;

    if(coord.planet_id) {
        coord_type = "planet";
    } else if(coord.ship_id) {
        coord_type = "ship";
    } else {
        coord_type = "galaxy";
    }

    // Salvage is on an object
    if(object_index !== -1) {
        for (let s = 0; s < salvaging_linkers.length; s++) {
            if (salvaging_linkers[s]) {
                if (salvaging_linkers[s].object_id === objects[object_index].id && salvaging_linkers[s].player_id === client_player_id) {
                    is_being_salvaged = true;
                    salvaging_linker_index = s;
                    console.log("This object is being salvaged");
                }
            }

        }
    }
    // Salvage is happening on a coord
    else if(notFalse(coord)) {
        for (let s = 0; s < salvaging_linkers.length; s++) {
            if (salvaging_linkers[s]) {
                if (salvaging_linkers[s].coord_id === coord.id && salvaging_linkers[s].player_id === client_player_id) {
                    is_being_salvaged = true;
                    salvaging_linker_index = s;
                    console.log("This coord is being salvaged by the player");
                }
            }

        }
    }



    if (is_being_salvaged) {

        $('#click_menu').append("<button id='salvagestop_" + salvaging_linkers[salvaging_linker_index].id + 
        "' salvaging_linker_id='" + salvaging_linkers[salvaging_linker_index].id +
        "' class='button is-warning is-small'>Stop Salvaging</button><br>");
        
    
    } else {

        // if it's in the galaxy, we can't salvage if our ship is a pod
        let player_can_salvage = true;
        if ( (object_index !== -1 && objects[object_index].coord_id) || (notFalse(coord) && !coord.planet_id && !coord.ship_id) ) {
            let player_ship_index = objects.findIndex(function (obj) { return obj && obj.id === players[client_player_index].ship_id; });
            if (player_ship_index !== -1 && objects[player_ship_index].object_type_id === 114) {
                player_can_salvage = false;
                $('#click_menu').append("<a target='_blank' href='https://space.alphacoders.com/site/tutorial/ship-building'>Build A Better Ship To Salvage</a>");
            }
        }

        if (player_can_salvage) {
            if(object_index !== -1) {
                $('#click_menu').append("<button id='salvage_object_" + objects[object_index].id + "' object_id='" + objects[object_index].id +
                "' class='button is-default is-small is-info'>Salvage</button><br>");
            } else {
                $('#click_menu').append("<button id='salvage_coord_" + coord.id + "' coord_id='" + coord.id + "' coord_type='" + coord_type +
                "' class='button is-default is-small is-info'>Salvage</button><br>");
            }
            
        }

    }
}


function switchChat(new_chat_tab) {
    if(new_chat_tab == 'local') {
        current_chat = 'local';
        $('#chat_global').hide();
        $('#chatswitch_global').attr('disabled', false);
        $('#chat_faction').hide();
        $('#chatswitch_faction').attr('disabled', false);
        $('#chat_local').show();
        $('#chatswitch_local').attr('disabled', true);
        $('#chat_system').hide();
        $('#chatswitch_system').attr('disabled', false);

        unread_local_messages = 0;

        $('#chatswitch_local').text("Local");


    } else if(new_chat_tab == 'global') {
        current_chat = 'global';
        $('#chat_local').hide();
        $('#chatswitch_local').attr('disabled', false);
        $('#chat_faction').hide();
        $('#chatswitch_faction').attr('disabled', false);
        $('#chat_global').show();
        $('#chatswitch_global').attr('disabled', true);
        $('#chat_system').hide();
        $('#chatswitch_system').attr('disabled', false);

        unread_global_messages = 0;

        $('#chatswitch_global').text("Global");

    } else if(new_chat_tab == 'faction') {
        current_chat = 'faction';
        $('#chat_local').hide();
        $('#chatswitch_local').attr('disabled', false);
        $('#chat_global').hide();
        $('#chatswitch_global').attr('disabled', false);
        $('#chat_faction').show();
        $('#chatswitch_faction').attr('disabled', true);
        $('#chat_system').hide();
        $('#chatswitch_system').attr('disabled', false);

        unread_faction_messages = 0;

        $('#chatswitch_faction').text("Faction");
    } else if(new_chat_tab == 'system') {
        current_chat = 'system';
        $('#chat_local').hide();
        $('#chatswitch_local').attr('disabled', false);
        $('#chat_global').hide();
        $('#chatswitch_global').attr('disabled', false);
        $('#chat_faction').hide();
        $('#chatswitch_faction').attr('disabled', false);
        $('#chat_system').show();
        $('#chatswitch_system').attr('disabled', true);

        unread_system_messages = 0;

        $('#chatswitch_system').text("System");

        let out = document.getElementById("chat_system");

        out.scrollTop = out.scrollHeight - out.clientHeight;

    }

    $('#chat_message').focus();
}


function tileToPixel(tile_number) {
    return tile_number * tile_size;
}



function urlName(name) {
    //console.log("Called urlName on name: " + name);
    return name.split(' ').join('-').toLowerCase();
}


// Updating a player that is NOT the client player
function updatePlayer(data, player_index) {

    let updated_planet_coord_id = false;
    let updated_ship_coord_id = false;
    let updated_coord_id = false;

    if (current_view === 'planet') {

        // We're on a planet and they aren't
        if (!data.player.planet_coord_id || data.player.planet_coord_id === 0) {
            destroyPlayerSprite(players[player_index]);
            players[player_index].destination_x = false;
            players[player_index].destination_y = false;
        } else {


            let coord_index = planet_coords.findIndex(function (obj) { return obj && obj.id === data.player.planet_coord_id; });

            if (coord_index !== -1 && shouldDraw(client_player_info.coord, planet_coords[coord_index])) {
                // If they don't have a sprite, insta move them there
                if (!players[player_index].sprite) {
                    players[player_index].planet_coord_id = data.player.planet_coord_id;
                    updated_planet_coord_id = true;
                    createPlayerSprite(player_index);

                    movePlayerInstant(player_index, planet_coords[coord_index].tile_x * tile_size + tile_size / 2,
                        planet_coords[coord_index].tile_y * tile_size + tile_size / 2);
                }
                // Otherwise, flow them there
                else if (data.player.planet_coord_id !== players[player_index].planet_coord_id) {
                    //console.log("Other player: " + players[player_index].name + " moved to planet coord id: " + data.player.planet_coord_id);
                    players[player_index].planet_coord_id = data.player.planet_coord_id;
                    updated_planet_coord_id = true;
                    initiateMovePlayerFlow(player_index, 'planet', planet_coords[coord_index], 'updatePlayer > planet');
                }

                if (parseInt(data.player.skin_object_type_id) !== players[player_index].skin_object_type_id) {

                    console.log("Player changed skin");
                    players[player_index].skin_object_type_id = parseInt(data.player.skin_object_type_id);

                    createPlayerSprite(player_index);
                }


                // Player switched bodies!
                if (data.player.body_id !== players[player_index].body_id) {
                    let old_body_index = objects.findIndex(function (obj) { return obj && obj.id === players[player_index].body_id; });

                    players[player_index].body_id = parseInt(data.player.body_id);
                    createPlayerSprite(player_index);
                    setPlayerMoveDelay(player_index);

                    // If the new body previously had a name on it, we remove that now
                    let new_body_index = objects.findIndex(function (obj) { return obj && obj.id === data.player.body_id; });
                    if(new_body_index === -1) {
                        socket.emit('request_object_info', { 'object_id': data.player.body_id });
                    } else if (objects[new_body_index].name_text) {
                        objects[new_body_index].name_text.destroy();
                    }

                    // and if the old body has a name, add in its name text
                    if (objects[old_body_index].name) {
                        redrawObject(old_body_index);
                    }
                }


            }
            // Our client doesn't have the coord where the player is, or the player moved somewhere out of drawing range
            else if (coord_index === -1 || !shouldDraw(client_player_info.coord, planet_coords[coord_index])) {
                destroyPlayerSprite(players[player_index]);
                players[player_index].destination_x = false;
                players[player_index].destination_y = false;
            }


        }



    } else if (current_view === 'ship') {
        if (!data.player.ship_coord_id || data.player.ship_coord_id === 0) {
            destroyPlayerSprite(players[player_index]);
        } else {
            let coord_index = ship_coords.findIndex(function (obj) { return obj && obj.id === data.player.ship_coord_id; });

            if (coord_index !== -1 && shouldDraw(client_player_info.coord, ship_coords[coord_index])) {

                // TODO this isn't really the most efficient way to go about it
                // TODO maybe add in a player.sprite_source = 'galaxy'/'ship' or something so we can insta-know if the sprite is outdated
                createPlayerSprite(player_index);
                // If they don't have a sprite, insta move them there
                if (!players[player_index].sprite) {
                    createPlayerSprite(player_index);

                    movePlayerInstant(player_index, ship_coords[coord_index].tile_x * tile_size + tile_size / 2,
                        ship_coords[coord_index].tile_y * tile_size + tile_size / 2);
                }
                // Otherwise, flow them there
                else if (data.player.ship_coord_id !== players[player_index].ship_coord_id) {
                    players[player_index].ship_coord_id = data.player.ship_coord_id;
                    updated_ship_coord_id = true;
                    initiateMovePlayerFlow(player_index, 'ship', ship_coords[coord_index], 'updatePlayer > ship');
                }

                // Player switched bodies!
                if (data.player.body_id !== players[player_index].body_id) {

                    let old_body_index = objects.findIndex(function (obj) { return obj && obj.id === players[player_index].body_id; });

                    players[player_index].body_id = parseInt(players[player_index].body_id);
                    createPlayerSprite(player_index);
                    setPlayerMoveDelay(player_index);

                    // If the new body previously had a name on it, we remove that now
                    let new_body_index = objects.findIndex(function (obj) { return obj && obj.id === data.player.body_id; });
                    if(new_body_index === -1) {

                        socket.emit('request_object_info', { 'object_id': data.player.body_id });

                    } else if (objects[new_body_index].name_text) {
                        objects[new_body_index].name_text.destroy();
                    }

                    // and if the old body has a name, add in its name text
                    if (objects[old_body_index].name) {
                        let old_body_info = getObjectInfo(old_body_index);
                        let scene_game = game.scene.getScene('sceneGame');

                        objects[old_body_index].name_text = scene_game.add.text(tileToPixel(old_body_info.coord.tile_x) - 18,
                            tileToPixel(old_body_info.coord.tile_y) - 14, objects[old_body_index].name, {
                            fontSize: 14,
                            padding: { x: 10, y: 5 },
                            stroke: '#000000',
                            strokeThickness: 3,
                            fill: '#ffffff'
                        });
                        objects[old_body_index].name_text.setDepth(11);
                    }
                }
            }


        }
    } else if (current_view === 'galaxy') {


        // Seems like they switched to a planet
        if(data.player.planet_coord_id) {
            destroyPlayerSprite(players[player_index]);
        }

        // We're also going to want to destroy the player's ship sprite if they are docking on another ship
        // Not sure if this will work as intended
        if(isFalse(data.player.coord_id)) {

            //console.log("Calling destroyPlayerSprite from updatePlayer");

            destroyPlayerSprite(players[player_index]);

            // If the player's previous ship is dockable - we want to make sure it's drawn immediately
            let player_ship_index = getObjectIndex(players[player_index].ship_id);
            if(player_ship_index !== -1) {
                let player_ship_type_index = getObjectTypeIndex(objects[player_ship_index].object_type_id);
                if(player_ship_type_index !== -1 && object_types[player_ship_type_index].is_dockable) {
                    console.log("Adding dockable ship base sprite back in");
                    mapAddObject(objects[player_ship_index]);
                }
            }

        }

        if (!data.player.coord_id || data.player.coord_id === 0) {
            // Just gonna comment this out for now. What we have happening is that when other players are switching
            // to their ship views, it's removing the ship from the galaxy view. This is not ideal.
            //destroyPlayerSprite(players[player_index]);
        } else {
            let coord_index = coords.findIndex(function (obj) { return obj && obj.id === data.player.coord_id; });

            if (coord_index === -1) {
                console.log("Other player moved to a galaxy coord we don't have");
                return false;
            }

            if (!shouldDraw(client_player_info.coord, coords[coord_index])) {
                console.log("Not drawing this other player galaxy move");
                return false;
            }


            // If they don't have a sprite, insta move them there
            if (!players[player_index].sprite) {
                players[player_index].coord_id = data.player.coord_id;
                createPlayerSprite(player_index);

                movePlayerInstant(player_index, coords[coord_index].tile_x * tile_size + tile_size / 2,
                    coords[coord_index].tile_y * tile_size + tile_size / 2);
            }
            // Otherwise, flow them there
            else if (data.player.coord_id !== players[player_index].coord_id) {
                players[player_index].coord_id = data.player.coord_id;
                updated_coord_id = true;
                initiateMovePlayerFlow(player_index, 'galaxy', coords[coord_index], 'updatePlayer > galaxy');
            } else {
                //console.log("There was no move");
            }

            // Player switched ships!
            if (data.player.ship_id !== players[player_index].ship_id && shouldDraw(client_player_info.coord, coords[coord_index])) {
                console.log("A player we shouldDraw just switched ships. Re-doing player sprite");
                players[player_index].ship_id = parseInt(data.player.ship_id);
                createPlayerSprite(player_index);
                setPlayerMoveDelay(player_index);
            }

        }


    }

    if(!updated_coord_id) {
        players[player_index].coord_id = data.player.coord_id;
    }

    if(!updated_planet_coord_id) {
        players[player_index].planet_coord_id = data.player.planet_coord_id;
    }

    if(!updated_ship_coord_id) {
        players[player_index].ship_coord_id = data.player.ship_coord_id;
    }


}

function updatePlayerClient(data) {


    let update_spaceport_display = false;
    let updated_client_planet_coord_id = false;
    let updated_client_ship_coord_id = false;

    // We switched planet levels
    if (current_view === 'planet') {


        if (data.player.planet_coord_id) {

            let client_moved = false;
            let client_moved_levels = false;


            let new_planet_coord_index = planet_coords.findIndex(function (obj) { return obj && obj.id === data.player.planet_coord_id; });

            if (new_planet_coord_index !== -1 && planet_coords[new_planet_coord_index].level !== client_player_info.coord.level) {
                client_moved_levels = true;
            }

            // Player switched ships on a planet - so switching in a spaceport
            if (players[client_player_index].ship_id !== data.player.ship_id) {
                update_spaceport_display = true;
            }

            if (players[client_player_index].planet_coord_id !== data.player.planet_coord_id) {
                //console.log("Server sent that client moved in planet view to coord id: " + data.player.planet_coord_id);
                update_spaceport_display = true;
                client_moved = true;
            }

            

            if (new_planet_coord_index === -1) {
                socket.emit('request_planet_coord_info', { 'planet_coord_id': data.player.planet_coord_id });
                return false;
            }


            // Normal planet move
            if (players[client_player_index].planet_coord_id !== data.player.planet_coord_id && planet_coords[new_planet_coord_index].level === client_player_info.coord.level) {



                // No point in sending the move if the player is already moving there
                if (players[client_player_index].destination_x &&
                    players[client_player_index].destination_coord_id === planet_coords[new_planet_coord_index].id) {

                } else {
                    updated_client_planet_coord_id = true;
                    players[client_player_index].planet_coord_id = data.player.planet_coord_id;
                    initiateMovePlayerFlow(client_player_index, 'planet', planet_coords[new_planet_coord_index], 'updatePlayerClient > planet');
                }


            }

            // We moved levels
            if (client_moved_levels) {

                updated_client_planet_coord_id = true;
                players[client_player_index].planet_coord_id = data.player.planet_coord_id;

                clearPreviousLevel();


                client_move_planet_coord_id = false;
                movePlayerInstant(client_player_index,
                    planet_coords[new_planet_coord_index].tile_x * tile_size + tile_size / 2,
                    planet_coords[new_planet_coord_index].tile_y * tile_size + tile_size / 2);



                //redrawMap();




            }



            // We aren't doing any of this in any of the other views
            /*
            let starting_x = planet_coords[new_planet_coord_index].tile_x - 6;
            let starting_y = planet_coords[new_planet_coord_index].tile_y - 6;
            let ending_x = planet_coords[new_planet_coord_index].tile_x + 6;
            let ending_y = planet_coords[new_planet_coord_index].tile_y + 6;

            // depending on the direction that we moved, we want to just make sure a specific line of planet coords are re-drawn
            if(planet_coords[new_planet_coord_index].tile_x > client_player_info.coord.tile_x) {
                starting_x = ending_x;
            } else if(planet_coords[new_planet_coord_index].tile_x < client_player_info.coord.tile_x) {
                ending_x = starting_x;
            } else if(planet_coords[new_planet_coord_index].tile_y > client_player_info.coord.tile_y) {
                starting_y = ending_y;
            } else if(planet_coords[new_planet_coord_index].tile_y < client_player_info.coord.tile_y) {
                ending_y = starting_y;
            }

            //console.log("Move has us redrawing from: " + starting_x + "," + starting_y + " to: " +
            //    ending_x + "," + ending_y);

            for(let x = starting_x; x <= ending_x; x++) {
                for(let y = starting_y; y <=ending_y; y++) {
                    let drawing_index = planet_coords.findIndex(function(obj) { return obj &&
                        obj.planet_id === planet_coords[new_planet_coord_index].planet_id &&
                        obj.level === planet_coords[new_planet_coord_index].level &&
                        obj.tile_x === x && obj.tile_y === y;
                    });

                    if(drawing_index !== -1) {
                        //console.log("Movement is drawing a coord");
                        drawCoord('planet', planet_coords[drawing_index]);
                    }
                }
            }


            */

            if (client_moved && client_player_info.coord && client_player_info.coord.level < 0) {

                // THIS IS FOR TESTING THE fillBlankSpaces stuff!
                // Generally this works - but there are a couple of issues. 1. Planets can't start at 0,0 for it work.
                // They would need to start at like 10,10. Secondly, the layer above bit is still showing up here/there, or getting
                // removed where it shouldn't be getting removed.
                //fillBlankSpaces();
                /*
                let filling_start = performance.now();

                for(let x = client_player_info.coord.tile_x - Math.ceil(show_cols / 2) - 1; x <= client_player_info.coord.tile_x + Math.floor(show_cols / 2) + 1; x++) {
                    for(let y = client_player_info.coord.tile_y - Math.ceil(show_rows / 2) - 1; y <= client_player_info.coord.tile_y + Math.floor(show_rows / 2) + 1; y++) {

                        let have_planet_coord_index = planet_coords.findIndex(function(obj) { return obj && obj.planet_id === client_player_info.coord.planet_id &&
                            obj.level === client_player_info.coord.level && obj.tile_x === x && obj.tile_y === y });
                        if(have_planet_coord_index === -1) {

                            // Probably faster if we just check to see if something is there first.
                            let object_tile = map.getTileAt(x, y, false, 'layer_object');
                            if(!object_tile) {
                                // DRAW A WALL
                                map.putTileAt(274, x, y, false, 'layer_object');

                                let above_y = y - 1;
                                let above_tile = map.getTileAt(x, above_y, false, 'layer_above');
                                if(!above_tile) {
                                    map.putTileAt(2, x, above_y, false, 'layer_above');
                                }

                            }



                        }


                    }

                }

                let filling_end = performance.now();
                console.log("Filling blank spaces took: " + (filling_end - filling_start) + " milliseconds ");


                 */
            }



        }
    }
    else if (current_view === 'ship') {
        if (data.player.ship_coord_id) {


            let client_changed_levels = false;



            let previous_coord_index = -1;
            if(players[client_player_index].ship_coord_id) {
                previous_coord_index = ship_coords.findIndex(function(obj) { return obj && obj.id === players[client_player_index].ship_coord_id });
            }
            
            let coord_index = ship_coords.findIndex(function (obj) { return obj && obj.id === data.player.ship_coord_id; });

            if (coord_index !== -1 && ship_coords[coord_index] && ship_coords[coord_index].level !== client_player_info.coord.level) {
                client_changed_levels = true;
            }

            if (coord_index === -1) {
                socket.emit('request_ship_coord_info', { 'ship_coord_id': data.player.ship_coord_id });
            }
            // Normal Ship Move
            else if (players[client_player_index].ship_coord_id !== data.player.ship_coord_id && ship_coords[coord_index].level === client_player_info.coord.level) {
                //console.log("Moving to ship coord id: " + ship_coords[coord_index].id + " tile x,y: " + ship_coords[coord_index].tile_x + "," + ship_coords[coord_index].tile_y);
                players[client_player_index].ship_coord_id = data.player.ship_coord_id;
                updated_client_ship_coord_id = true;
                initiateMovePlayerFlow(client_player_index, 'ship', ship_coords[coord_index], 'updatePlayerClient > ship');
            }
            // We moved to a different level
            
            if (client_changed_levels) {
                players[client_player_index].ship_coord_id = data.player.ship_coord_id;
                updated_client_ship_coord_id = true;
            
                clearPreviousLevel();
                client_move_ship_coord_id = false;

                movePlayerInstant(client_player_index,
                    ship_coords[coord_index].tile_x * tile_size + tile_size / 2,
                    ship_coords[coord_index].tile_y * tile_size + tile_size / 2);
            }


            if((coord_index !== -1 && ship_coords[coord_index].object_type_id === 266) || (previous_coord_index !== -1 && ship_coords[previous_coord_index].object_type_id === 266)) {
                //console.log("Calling generateAirlockDisplay 1");
                generateAirlockDisplay();
            }



            if(!updated_client_ship_coord_id) {
                players[client_player_index].ship_coord_id = data.player.ship_coord_id;
            }


        }
    }

    // Galaxy view and we moved
    else if (current_view === 'galaxy' && data.player.coord_id && data.player.coord_id !== client_player_info.coord.id) {
        

        let coord_index = coords.findIndex(function (obj) { return obj && obj.id === data.player.coord_id; });


        players[client_player_index].coord_id = data.player.coord_id;
        if (coord_index !== -1) {
            initiateMovePlayerFlow(client_player_index, 'galaxy', coords[coord_index], 'updatePlayerClient > galaxy');
        }


    } else if (current_view === 'galaxy' && players[client_player_index].ship_coord_id) {

        let coord_index = coords.findIndex(function (obj) { return obj && obj.id === data.player.coord_id; });

        if (coord_index !== -1) {
            console.log("Would insta-move now");
            //movePlayerInstant(players[client_player_index], )
        }

    }

    if ((data.player.skin_object_type_id || players[client_player_index].skin_object_type_id) && parseInt(data.player.skin_object_type_id) !== parseInt(players[client_player_index].skin_object_type_id)) {

        console.log("Client Player changed skin");
        console.log("data: " + parseInt(data.player.skin_object_type_id) + " player: " + parseInt(players[client_player_index].skin_object_type_id));
        players[client_player_index].skin_object_type_id = parseInt(data.player.skin_object_type_id);

        createPlayerSprite(client_player_index);
    }

    if (parseInt(data.player.body_id) !== players[client_player_index].body_id) {

        let old_body_index = objects.findIndex(function (obj) { return obj && obj.id === players[client_player_index].body_id; });

        players[client_player_index].body_id = parseInt(data.player.body_id);
        createPlayerSprite(client_player_index);
        generateInventoryDisplay();


        if (current_view === 'planet') {
            // and we insta move
            let player_coord_index = planet_coords.findIndex(function (obj) { return obj && obj.id === data.player.planet_coord_id; });
            if (player_coord_index !== -1) {
                movePlayerInstant(client_player_index, planet_coords[player_coord_index].tile_x * tile_size + tile_size / 2,
                    planet_coords[player_coord_index].tile_y * tile_size + tile_size / 2);
            }
        } else if (current_view === 'ship') {
            // and we insta move
            let player_coord_index = ship_coords.findIndex(function (obj) { return obj && obj.id === data.player.ship_coord_id; });
            if (player_coord_index !== -1) {
                movePlayerInstant(client_player_index, ship_coords[player_coord_index].tile_x * tile_size + tile_size / 2,
                    ship_coords[player_coord_index].tile_y * tile_size + tile_size / 2);
            }
        }

        //console.log("Generating new equipment display due to new body");
        generateEquipmentDisplay();
        // If the new body previously had a name on it, we remove that now
        let new_body_index = objects.findIndex(function (obj) { return obj && obj.id === data.player.body_id; });
        if(new_body_index === -1) {

            socket.emit('request_object_info', { 'object_id': data.player.body_id });

        } else if (objects[new_body_index].name_text) {
            objects[new_body_index].name_text.destroy();
        }

        // and if the old body has a name, add in its name text
        if (objects[old_body_index].name) {
            redrawObject(old_body_index);
        
        }


    }

    // Player switched ships in the galaxy view
    if (current_view === 'galaxy' && parseInt(data.player.ship_id) !== players[client_player_index].ship_id) {

        console.log("Our player switched ships");

        let old_ship_id = players[client_player_index].ship_id;

        let old_ship_index = objects.findIndex(function (obj) { return obj && obj.id === old_ship_id; });

        // SET THE NEW SHIP ID
        players[client_player_index].ship_id = parseInt(data.player.ship_id);
        createPlayerSprite(client_player_index);

        // and we insta move
        let player_coord_index = coords.findIndex(function (obj) { return obj && obj.id === data.player.coord_id; });
        if (player_coord_index !== -1) {
            movePlayerInstant(client_player_index, coords[player_coord_index].tile_x * tile_size + tile_size / 2,
                coords[player_coord_index].tile_y * tile_size + tile_size / 2);
        }

        // and we redraw the coord with the old ship

        console.log("Old ship id: " + old_ship_id + "  index: " + old_ship_index + " old ship coord id: " + objects[old_ship_index].coord_id);

        if (old_ship_index !== -1 && objects[old_ship_index].coord_id) {

            let object_coord_index = coords.findIndex(function (obj) {
                return obj &&
                    obj.id === objects[old_ship_index].coord_id;
            });

            if (object_coord_index !== -1) {
                console.log("Redrawing coord with old ship on it");
                drawCoord('galaxy', coords[object_coord_index]);
            } else {
                console.log("Couldn't find old ship coord");
            }

        } else {
            console.log("Couldn't find old ship index or it doesn't have a coord id");
        }



        setPlayerMoveDelay(client_player_index);

        // If the new ship previously had a name on it, we remove that now
        let new_ship_index = objects.findIndex(function (obj) { return obj && obj.id === data.player.ship_id; });
        if (objects[new_ship_index].name_text) {
            objects[new_ship_index].name_text.destroy();
        }

        // and if the old body has a name, add in its name text
        if (objects[old_ship_index].name) {
            redrawObject(old_ship_index);
        }

        // and remove the new ship from the coords its on (we are using a sprite now)
        for(let i = 0; i < coords.length; i++) {
            if(coords[i] && ( coords[i].object_id === objects[new_ship_index].id || coords[i].belongs_to_object_id === objects[new_ship_index].id) ) {
                map.putTileAt(-1, coords[i].tile_x, coords[i].tile_y, false, 'layer_object');
            }
        }

    }


    if(!updated_client_planet_coord_id) {
        players[client_player_index].planet_coord_id = data.player.planet_coord_id;
    }

    if(!updated_client_ship_coord_id) {
        players[client_player_index].ship_coord_id = data.player.ship_coord_id;
    }


    players[client_player_index].coord_id = data.player.coord_id;
    

}

function worldPointToTileX(x) {
    return Math.floor(x / tile_size);
}

function worldPointToTileY(y) {
    // 3.17 weird stuff
    //return Math.floor(y / tile_size) + 5;
    return Math.floor(y / tile_size);
    //return Math.floor(pixel_number / (tile_size * 2) );
}



setInterval(function(){ 
    if(connected === false) {
        console.log("Not seeing us as connected");
        if(socket) {
            socket.emit('request_news');
        }
        
    }

}, 3000);



setInterval(function() {

    if(new_player_joined && notify_on_new_player) {

        if(document.title === "New Player Joined!") {
            document.title = "Space Abyss";
        } else {
            document.title = "New Player Joined!";
        }

        

    }

    if(!document.hidden && document.title === "New Player Joined!") {
        document.title = "Space Abyss";
        new_player_joined = false;
    }

}, 3000);