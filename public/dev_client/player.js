function getPlayerLevel(skill) {

    console.log("In getPlayerLevel");
    let level = 1;
    let body_index = getObjectIndex(players[client_player_index].body_id);
    let body_type_index = -1;
    if(body_index !== -1) {
        body_type_index = getObjectTypeIndex(objects[body_index].object_type_id);
    }
    


    if (skill === 'manufacturing') {

        level = 1 + Math.floor(difficult_level_modifier * Math.sqrt(players[client_player_index].manufacturing_skill_points));

        if(current_view === "ship") {
            let ship_coord_index = getShipCoordIndex({ 'ship_coord_id': players[client_player_index].ship_coord_id });
            let ship_index = getObjectIndex(ship_coords[ship_coord_index].ship_id);
            if(ship_index !== -1) {
                ship_type_index = getObjectTypeIndex(objects[ship_index].object_type_id);
            }
        }


        if (ship_type_index !== -1 && object_types[ship_type_index].manufacturing_modifier) {
            console.log("Ship is adding " + object_types[ship_type_index].manufacturing_modifier);
            level += object_types[ship_type_index].manufacturing_modifier;
        }

        if (body_type_index !== -1 && object_types[body_type_index].manufacturing_modifier) {
            console.log("Body is adding " + object_types[body_type_index].manufacturing_modifier);
            level += object_types[body_type_index].manufacturing_modifier;
        }

    }


    // Lets go through each of the player's equipped items too
    // I think we only need to do this when dealing with a player's body for now
    if (body_index !== -1) {
        for (let i = 0; i < equipment_linkers.length; i++) {
            if (equipment_linkers[i] && equipment_linkers[i].body_id === objects[body_index].id) {

                let equipped_object_index = -1;
                let equipped_object_type_index = -1;

                if (equipment_linkers[i].object_id) {
                    equipped_object_index = getObjectIndex(equipment_linkers[i].object_id);
                    if (equipped_object_index !== -1) {
                        equipped_object_type_index = getObjectTypeIndex(objects[equipped_object_index].object_type_id);
                    }
                } else if (equipment_linkers[i].object_type_id) {
                    equipped_object_type_index = getObjectTypeIndex(equipment_linkers[i].object_type_id);
                }

                if (equipped_object_type_index !== -1) {
                    if (skill === 'manufacturing' && object_types[equipped_object_type_index].manufacturing_modifier) {
                        level += object_types[equipped_object_type_index].manufacturing_modifier;
                    }
                }


            }
        }


        // And eating linkers!
        for(let i = 0; i < eating_linkers.length; i++) {
            if(eating_linkers[i] && eating_linkers[i].body_id === objects[body_index].id) {
                let race_linker_index = getRaceEatingLinkerIndex(object_types[body_type_index].race_id, eating_linkers[i].eating_object_type_id );

                if(race_eating_linkers[race_linker_index].manufacturing && skill === 'manufacturing') {
                    //console.log("Eating increased player attack by: " + race_eating_linkers[race_linker_index].attack);
                    level += race_eating_linkers[race_linker_index].manufacturing;
                }
            }
        }

        // And addiction!
        // and minuses for each addiction without a matching eating linker (addictions are held off while the player is still consuming them)
        for(let i = 0; i < addiction_linkers.length; i++) {

            if(addiction_linkers[i] && addiction_linkers[i].body_id === objects[body_index].id) {

                let still_eating = false;
                for(let j = 0; j < eating_linkers.length; j++) {
                    if(eating_linkers[j] && eating_linkers[j].body_id === objects[body_index].id) {
                        if(eating_linkers[j].eating_object_type_id === addiction_linkers[i].addicted_to_object_type_id) {
                            still_eating = true;
                        }
                    }
                }


                if(!still_eating) {
                    let race_linker_index = main.getRaceEatingLinkerIndex(object_types[body_type_index].race_id, addiction_linkers[i].addicted_to_object_type_id );

                    if(race_eating_linkers[race_linker_index].manufacturing && skill === 'manufacturing') {
                        console.log("Reduced player manufacturing due to addiction linker");
                        level -= addition_linkers[i].addiction_level * race_eating_linkers[race_linker_index].manufacturing;
                    }
                }

            }

        }

    }


    console.log("Returning: " + level);

    return level;
}