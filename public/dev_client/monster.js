function moveMonsterInstant(monster_index, to_coord) {

    if (!monsters[monster_index].sprite) {
        createMonsterSprite(monster_index);
    }

    let destination_x = to_coord.tile_x * tile_size + tile_size / 2 + monsters[monster_index].sprite_x_offset;
    let destination_y = to_coord.tile_y * tile_size + tile_size / 2 + monsters[monster_index].sprite_y_offset;

    monsters[monster_index].sprite.x = destination_x;
    monsters[monster_index].sprite.y = destination_y;

    monsters[monster_index].destination_x = false;
    monsters[monster_index].destination_y = false;

    console.log("moveMonsterInstant monster id: " + monsters[monster_index].id + " to tile_x,tile_y: " + to_coord.tile_x + "," + to_coord.tile_y);

    // If there's an effect associated with this monster, we need to move it to!
    console.log("Updating effect sprites for a ")
    updateEffectSprites('monster', monster_index);

}

function moveMonsterFlow(monster_index, to_coord) {
    if (!monsters[monster_index].sprite) {
        createMonsterSprite(monster_index);

        if (!monsters[monster_index].sprite) {
            console.log("%c Failing to load monster sprite for monster type id: " + monsters[monster_index].monster_type_id, log_warning);
            return false;
        }
    }

    let destination_x = to_coord.tile_x * tile_size + tile_size / 2 + monsters[monster_index].sprite_x_offset;
    let destination_y = to_coord.tile_y * tile_size + tile_size / 2 + monsters[monster_index].sprite_y_offset;

    // If the monster's sprite is far away from the destination coord, we should just warp the monster there instead
    if (Math.abs(monsters[monster_index].sprite.x - destination_x) > 100 ||
        Math.abs(monsters[monster_index].sprite.y - destination_y) > 100) {

        monsters[monster_index].destination_x = false;
        monsters[monster_index].destination_y = false;
        monsters[monster_index].sprite.x = destination_x;
        monsters[monster_index].sprite.y = destination_y;
        return;
    }

    monsters[monster_index].destination_x = destination_x;
    monsters[monster_index].destination_y = destination_y;

}


function removeMonster(monster_id) {


    let removing_monster_id = parseInt(monster_id);
    //console.log("Removing monster id: " + monster_id);

    let monster_index = monsters.findIndex(function (obj) { return obj && obj.id === parseInt(monster_id); });


    if (monster_index !== -1) {

        if (monsters[monster_index].sprite) {
            monsters[monster_index].sprite.destroy();
            monsters[monster_index].sprite = false;
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

        delete monsters[monster_index];
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

    // lets remove any battle linkers with this monster id in them
    battle_linkers.forEach(function (battle_linker, i) {
        if (battle_linker.attacking_type === 'monster' && battle_linker.attacking_id === removing_monster_id) {

            delete battle_linkers[i];
            console.log("Removed battle linker - attacking monster");
        }

        if (battle_linker.being_attacked_type === 'monster' && battle_linker.being_attacked_id === removing_monster_id) {

            delete battle_linkers[i];
            console.log("Removed battle linker - mosnter is being attacked");
        }
    });


    // If there are any effects associated with this, remove them
    for(let i = 0; i < effect_sprites.length; i++) {

        if(effect_sprites[i] && effect_sprites[i].monster_id === removing_monster_id) {

            effect_sprites[i].monster_id = false;
            effect_sprites[i].setVisible(false);

        }
    }

    //console.log("Done removing monster");

    redrawBars();
    return;

}