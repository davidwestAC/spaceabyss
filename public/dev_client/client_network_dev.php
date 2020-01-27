<script type="text/javascript">


    socket.on('addiction_linker_info', function(data) {

        if(!data.addiction_linker) {
            console.log("%c Got addiction linker with no data.addiction_linker", log_warning);
            console.log(data);
            return false;
        }

        console.log("%c Got addiction linker with id: " + data.addiction_linker.id, log_success);

        let linker_index = addiction_linkers.findIndex(function(obj) { return obj && obj.id === parseInt(data.addiction_linker.id); });

        if(data.remove && linker_index !== -1) {
            console.log("Deleted addiction linker");
            delete addiction_linkers[linker_index];
            generateAddictionDisplay();
            return;
        }

        if(linker_index === -1) {
            linker_index = addiction_linkers.push(data.addiction_linker) - 1;

        } else {

            addiction_linkers[linker_index] = data.addiction_linker;
        }

        console.log("Addiction linker index: " + linker_index);

        addiction_linkers[linker_index].id = parseInt(addiction_linkers[linker_index].id);

        generateAddictionDisplay();

    });


    var admin_functions = {};
    var admin_drawing_floor_type_id = false;
    socket.on('admin_data', function(data) {
        $('.main-button-wrapper').append(data.main_button_wrapper);

        admin_functions['setAdminDrawFloorID'] = new Function('floor_type_id', data.set_draw_function);
        admin_functions['showAdminOptions'] = new Function(data.options_function);
        admin_functions['toggleAdminDisplay'] = new Function(data.toggle_function);

    });


    socket.on('area_info', function(data) {

        data.area.id = parseInt(data.area.id);
        let area_index = areas.findIndex(function(obj) { return obj && obj.id === data.area.id });

        if(area_index === -1) {
            areas.push(data.area);
        } else {

            areas[area_index] = data.area;

            // If this area is being displayed, we want to refresh it
            if($("#area_" + areas[area_index].id).length > 0) {
                generateAreaDisplay(areas[area_index].id);
            }

        }

        if($("#area_management").is(":visible")) {
            generateAreaManagementDisplay();
        }
    });

    socket.on('assembled_in_linker_data', function(data) {

        data.assembled_in_linker.id = parseInt(data.assembled_in_linker.id);

        let assembled_in_linker_index = assembled_in_linkers.findIndex(function(obj) { return obj && obj.id === data.assembled_in_linker.id; });

        if(assembled_in_linker_index === -1) {
            //console.log("Pushing assembly linker with required_for_object_type_id: " + data.required_for_object_type_id);
            assembled_in_linkers.push(data.assembled_in_linker);
        }
    });

    socket.on('assembly_info', function(data) {

        console.log("Got assembly info");
        console.log(data.assembly);


        // lets see if we need to add this to our list of active assemblies
        let active_assembly_index = active_assemblies.findIndex(function (obj) { return obj && obj.id === parseInt(data.assembly.id); });
        if(active_assembly_index === -1) {
            console.log("Pushed new active assembly");
            active_assembly_index = active_assemblies.push(data.assembly) - 1;
            active_assemblies[active_assembly_index].id = parseInt(active_assemblies[active_assembly_index].id);
        }

        if(data.finished) {
            console.log("Got finished assembly info! Deleting it");
            delete active_assemblies[active_assembly_index];
        } else {
            // update the active assembly
            console.log("Updated existing assembly");
            active_assemblies[active_assembly_index] = data.assembly;
            active_assemblies[active_assembly_index].id = parseInt(active_assemblies[active_assembly_index].id);
        }

        redrawBars();
    });

    socket.on('floor_type_assembly_linker_data', function(data) {



        let assembly_linker_index = floor_type_assembly_linkers.findIndex(function(obj) { return obj && obj.id === parseInt(data.id); });

        if(assembly_linker_index === -1) {
            //console.log("Pushing assembly linker with required_for_object_type_id: " + data.required_for_object_type_id);
            floor_type_assembly_linkers.push(data);
        }
    });

    socket.on('object_type_assembly_linker_data', function(data) {


        let assembly_linker_index = object_type_assembly_linkers.findIndex(function(obj) { return obj && obj.id === parseInt(data.id); });

        if(assembly_linker_index === -1) {
            //console.log("Pushing assembly linker with required_for_object_type_id: " + data.required_for_object_type_id);
            object_type_assembly_linkers.push(data);
        }
    });

    socket.on('attacked_data', function(data) {
        // Right now this functionality is a duplicate of our hp_data function
        //console.log("We were attacked!!!!!!");
        //user_player.animations.play('explosion',2, false);
    });

    socket.on('battle_linker_info', function(data) {

        //console.log("Received battle linker info");
        if(!data.battle_linker) {
            console.log("Got battle linker info without a battle linker");
            console.log(data);
            return false;
        }

        //console.log(data);

        // We are using a node/javascript uuid for battle linkers since they aren't inserted into the database
        let battle_linker_index = battle_linkers.findIndex(function(obj) { return obj &&
             obj.id === data.battle_linker.id; });

        if(data.remove) {

            //console.log("Have remove battle linker info");

            if(battle_linker_index !== -1) {
                //console.log("Removing battle linker with id" + battle_linkers[battle_linker_index].id);

                delete battle_linkers[battle_linker_index];
                redrawBars();
            } else {
                //console.log("Didn't have it anyways");
            }
            return;



        } else if(data.battle_linker) {


            if(battle_linker_index === -1) {
                battle_linker_index = battle_linkers.push(data.battle_linker) - 1;

                // make sure our ints are really ints
                battle_linkers[battle_linker_index].attacking_id = parseInt(battle_linkers[battle_linker_index].attacking_id);
                battle_linkers[battle_linker_index].being_attacked_id = parseInt(battle_linkers[battle_linker_index].being_attacked_id);

            }

        } else {
            console.log("Got battle_linker_info without remove or battle_linker");
            console.log(data);
            console.log(data.something);
        }
    });


    socket.on('bid_linker_info', function(data) {
        console.log("Got bid linker info");

        data.bid_linker.id = parseInt(data.bid_linker.id);
        let bid_linker_index = bid_linkers.findIndex(function(obj) { return obj && obj.id === data.bid_linker.id });

        if(bid_linker_index !== -1 && data.remove) {
            delete bid_linkers[bid_linker_index];
            return;
        }

        if(bid_linker_index === -1) {
            bid_linkers.push(data.bid_linker);
        } else {

            bid_linkers[bid_linker_index] = data.bid_linker;

            /*
            // If this area is being displayed, we want to refresh it
            if($("#area_" + areas[area_index].id).length > 0) {
                generateAreaDisplay(areas[area_index].id);
            }
            */


        }



        /*
        if($("#area_management").is(":visible")) {
            generateAreaManagementDisplay();
        }

         */
    });


    socket.on('chat', function(data){

        // depending on the scope, change the div we put the message into

        if(data.scope == 'local') {
            $('#chat_local').append($('<p>').text(data.message));


            if(!$("#chat_local").is(":visible")) {
                unread_local_messages = unread_local_messages + 1;

                $('#chatswitch_local').text("Local (" + unread_local_messages + ")");
            } else {
                $('#chat_local').scrollTop = $('#chat_local').scrollHeight;
            }

        } else if(data.scope == 'global') {
            $('#chat_global').append($('<p>').text(data.message));


            if(!$("#chat_global").is(":visible")) {
                unread_global_messages = unread_global_messages + 1;

                $('#chatswitch_global').text("Global (" + unread_global_messages + ")");
            } else {
                $('#chat_global').scrollTop = $('#chat_global').scrollHeight;
            }


        } else if(data.scope == 'faction') {
            $('#chat_faction').append($('<p>').text(data.message));


            if(!$("#chat_faction").is(":visible")) {
                unread_faction_messages = unread_faction_messages + 1;

                $('#chatswitch_faction').text("Faction (" + unread_gfaction_messages + ")");
            } else {
                $('#chat_faction').scrollTop = $('#chat_faction').scrollHeight;
            }
        } else if(data.scope == 'system') {
            $('#chat_system').append($('<p>').text(data.message));


            if(!$("#chat_system").is(":visible")) {
                unread_system_messages = unread_system_messages + 1;

                $('#chatswitch_system').text("System (" + unread_system_messages + ")");
                //console.log("Chat system is not visible");
            } else {

                let out = document.getElementById("chat_system");

                out.scrollTop = out.scrollHeight - out.clientHeight;

                //console.log("Scrolled chat_system. scrollTop: " + out.scrollTop);
            }

        } else {
            $('#chat_system').append($('<p>').text("No scope message: " + data.message));



            if(!$("#chat_system").is(":visible")) {
                unread_system_messages = unread_system_messages + 1;

                $('#chatswitch_system').text("System (" + unread_global_messages + ")");

            } else {
                $('#chat_system').scrollTop = $('#chat_system').scrollHeight;

            }
        }


        if(data.is_important === 'true' || data.is_important === true) {

            text_important.setText(data.message);
            text_important.setVisible(true);
            text_important_time = our_time;
        }


    });

    socket.on('clear_equipment_linkers_data', function(data) {
        equipment_linkers = [];
    });

    socket.on('clear_map', function(data) {
        console.log("Got clear map data. Running resetMap");
        resetMap();
        redrawMap();

    });

    socket.on('connect', function() {
        console.log("Received connect data");


    });


    socket.on('coord_data', function(data) {
        console.log("%c Was sent coord data. Think we don't need this anymore", log_danger);


    });

    //  data:   damage_types (piercing,laser,repairing,healing,etc)   |   damage_source_type (monster,npc,player,object,etc)   |   damage_source_id
    socket.on('damaged_data', function(data) {

        //console.log(data.damage_types);

        let drawing_x = -100;
        let drawing_y = -100;

        if(data.monster_id) {
            let monster_index = getMonsterIndex(data.monster_id);
            if(monster_index === -1) {
                return false;
            }

            let monster_info = getMonsterInfo(monster_index);
            if(monster_info.coord) {
                drawing_x = tileToPixel(monster_info.coord.tile_x);
                drawing_y = tileToPixel(monster_info.coord.tile_y);
            }

        } else if(data.npc_id) {
            let npc_index = getNpcIndex(data.npc_id);
            if(npc_index === -1) {
                return false;
            }

            let npc_info = getNpcInfo(npc_index);
            if(npc_info.coord) {
                drawing_x = tileToPixel(npc_info.coord.tile_x);
                drawing_y = tileToPixel(npc_info.coord.tile_y);
            }
        } else if(data.object_id) {
            let object_index = getObjectIndex(data.object_id);
            if(object_index === -1) {
                return false;
            }

            let object_info = getObjectInfo(object_index);
            if(object_info.coord) {
                drawing_x = tileToPixel(object_info.coord.tile_x);
                drawing_y = tileToPixel(object_info.coord.tile_y);
            }
        } else if(data.player_id) {
            let player_index = getPlayerIndex(data.player_id);
            if(player_index === -1) {
                return false;
            }

            let player_info = getPlayerInfo(player_index);
            if(player_info.coord) {
                drawing_x = tileToPixel(player_info.coord.tile_x);
                drawing_y = tileToPixel(player_info.coord.tile_y);
            }
        } else if(data.planet_coord_id) {
            let coord_index = planet_coords.findIndex(function(obj) { return obj && obj.id === parseInt(data.planet_coord_id); });

            if(coord_index !== -1) {
                drawing_x = tileToPixel(planet_coords[coord_index].tile_x);
                drawing_y = tileToPixel(planet_coords[coord_index].tile_y);

            }

        }
        // Just showing an effect on a ship coord
        else if(data.ship_coord_id) {
            let coord_index = ship_coords.findIndex(function(obj) { return obj && obj.id === parseInt(data.ship_coord_id); });

            if(coord_index !== -1) {
                drawing_x = tileToPixel(ship_coords[coord_index].tile_x);
                drawing_y = tileToPixel(ship_coords[coord_index].tile_y);
            }

        }


        // Certain damage types will need the x,y of the attacker too. So lets get those now, since we are getting all the data
        // in this function
        let attacker_x = -100;
        let attacker_y = -100;

        if(data.damage_types && data.damage_types.includes('laser')) {
            if(data.damage_source_type === 'monster') {
                let attacking_monster_index = getMonsterIndex(data.damage_source_id);
                if(attacking_monster_index === -1) {
                    return false;
                }

                let attacking_monster_info = getMonsterInfo(attacking_monster_index);
                if(attacking_monster_info.coord) {
                    attacker_x = tileToPixel(attacking_monster_info.coord.tile_x);
                    attacker_y = tileToPixel(attacking_monster_info.coord.tile_y);
                }

            } else if(data.damage_source_type === 'player') {
                let attacking_player_index = getPlayerIndex(data.damage_source_id);
                if(attacking_player_index === -1) {
                    return false;
                }

                let attacking_player_info = getPlayerInfo(attacking_player_index);
                if(attacking_player_info.coord) {
                    attacker_x = tileToPixel(attacking_player_info.coord.tile_x);
                    attacker_y = tileToPixel(attacking_player_info.coord.tile_y);
                }
            } else if(data.damage_source_type === 'object') {
                let attacking_object_index = getObjectIndex(data.damage_source_id);
                if(attacking_object_index === -1) {
                    socket.emit('request_object_info', { 'object_id': data.damage_source_id });
                    return;
                }

                let attacking_object_type_index = getObjectTypeIndex(objects[attacking_object_index].object_type_id);

                // If this is an active ship
                if(object_types[attacking_object_type_index].is_ship) {

                }

                let attacking_object_info = getObjectInfo(attacking_object_index);
                if(attacking_object_info.coord) {
                    attacker_x = tileToPixel(attacking_object_info.coord.tile_x);
                    attacker_y = tileToPixel(attacking_object_info.coord.tile_y);
                }
            }
        }


        if(data.flavor_text) {
            console.log("Got damaged data with flavor tex!");
            text_important.setText(data.flavor_text);
            text_important.setVisible(true);
            text_important_time = our_time;
        }

        if(drawing_x === -100) {
            console.log("Not sure where to draw this");
            return false;
        }


        let function_data = data;
        function_data.x = drawing_x;
        function_data.y = drawing_y;
        function_data.attacker_x = attacker_x;
        function_data.attacker_y = attacker_y;



        addEffect(function_data);
        addInfoNumber(function_data);

    });



    /*
    socket.on('damaged_data', function(data) {
        console.log("Got damaged data");
        console.log(data);

        // sometimes we have a calculating range inputted, otherwise, make it -1;
        let calculating_range = -1;
        if(data.calculating_range) {
            calculating_range = data.calculating_range;
            //console.log("Range from server is: " + data.calculating_range);
        } else {
            //console.log("No range from server");
        }

        // Monster was damaged
        if(data.monster_id) {

            let monster_index = monsters.findIndex(function(obj) { return obj && obj.id === data.monster_id; });

            if(monster_index === -1) {
                console.log("Got damaged data, but don't have the monster");
                return false;
            }

            let coord_index = -1;
            let x = -100;
            let y = -100;
            if(monsters[monster_index].planet_coord_id) {
                coord_index = planet_coords.findIndex(function(obj) { return obj && obj.id === monsters[monster_index].planet_coord_id; });
                if(coord_index === -1) {
                    return false;
                }
                x = planet_coords[coord_index].tile_x * tile_size;
                y = planet_coords[coord_index].tile_y * tile_size;
            } else if(monsters[monster_index].ship_coord_id) {
                coord_index = ship_coords.findIndex(function(obj) { return obj && obj.id === monsters[monster_index].ship_coord_id; });
                if(coord_index === -1) {
                    return false;
                }
                x = ship_coords[coord_index].tile_x * tile_size;
                y = ship_coords[coord_index].tile_y * tile_size;
            }


            let info_number_data = { 'x': x, 'y': y, 'damage_amount': data.damage_amount, 'damage_type': data.was_damaged_type,
                'defender_type': 'monster', 'defender_id': data.monster_id, 'attacker_type': data.damage_source_type,
                'attacker_id': data.damage_source_id, 'calculating_range': calculating_range };

            console.log("Damage types in on('damaged_data')");
            console.log(data.damage_types);
            addEffect({ 'x': x, 'y': y, 'damage_types': data.damage_types });
            addInfoNumber(info_number_data);

            // TODO try and re-implement laser type stuff. Player -> monster action. Laser logic is in /old


            if(data.damage_source_type === 'player' && data.damage_source_id === player_id) {
                //console.log("Player has damaged monster");

                if(!monsters[monster_index].player_is_attacking) {
                    monsters[monster_index].player_is_attacking = true;
                }

                // lets add a system message that we damaged the monster
                $('#chat_system').append($('<p>').text("You attacked the monster for " + data.damage_amount + " damage"));



                if(!$("#chat_system").is(":visible")) {
                    unread_system_messages = unread_system_messages + 1;

                    $('#chatswitch_system').text("System (" + unread_system_messages + ")");
                    //console.log("chat system is not visible");
                } else {
                    let out = document.getElementById("chat_system");
                    let isScrolledToBottom = out.scrollHeight - out.clientHeight <= out.scrollTop + 1;

                    //if (isScrolledToBottom) {
                        out.scrollTop = out.scrollHeight - out.clientHeight
                    //}

                    //console.log("Scrolling chat system: " + out.scrollTop);
                }

            }

            // we COULD mabye put this in when the laser hits so we aren't updating the monster's HP before the hit
            if(data.was_damaged_type == 'hp') {

                //console.log("Monster's current hp: " + monsters[monster_index].current_hp);

                monsters[monster_index].current_hp = monsters[monster_index].current_hp - data.damage_amount;

                //console.log("Monster's hp after the attack: " + monsters[monster_index].current_hp + " data.damage_amount: " + data.damage_amount);

                if(monsters[monster_index].current_hp > 0) {
                    redrawBars();
                } else {
                    //console.log("Calling remove monster on " + monsters[monster_index].id + " since HP is <= 0");
                    removeMonster(monsters[monster_index].id);

                }
            }




        } else if(data.npc_id) {

            let npc_index = npcs.findIndex(function(obj) { return obj && obj.id == data.npc_id; });

            if(npc_index !== -1) {
                console.log("Found npc in npcs");

                let has_attack_box = false;
                let available_attack_box = false;
                // see if we have an attack box at this location
                for(let i = 0; i < attack_boxes.length; i++) {
                    if(attack_boxes[i].x == npcs[npc_index].x && attack_boxes[i].y == npcs[npc_index].y) {
                        // already have attack box here
                        has_attack_box = true;
                    }

                    if(attack_boxes[i].is_visible == false) {
                        available_attack_box = attack_boxes[i];
                    }
                }

                if(!has_attack_box && !available_attack_box) {
                    attack_boxes.push({ 'x': npcs[npc_index].x, 'y': npcs[npc_index].y, 'is_visible': true });
                }

                let info_number_data = { 'x': npcs[npc_index].x, 'y': npcs[npc_index].y, 'damage_amount': data.damage_amount, 'damage_type': data.was_damaged_type,
                    'defender_type': 'npc', 'defender_id': parseInt(data.npc_id), 'attacker_type': data.damage_source_type,
                    'attacker_id': data.damage_source_id, 'calculating_range': calculating_range };

                addInfoNumber(info_number_data);

                //addInfoNumber(npcs[npc_index].x, npcs[npc_index].y, data.damage_amount, data.was_damaged_type);

                // TODO try and re-implement laser type stuff. Player -> monster action. Laser logic is in /old


                if(data.damage_source_type === 'player' && data.damage_source_id === player_id) {
                    console.log("Player has damaged npc");

                    if(!npcs[npc_index].player_is_attacking) {
                        npcs[npc_index].player_is_attacking = true;
                    }

                }

                // we COULD mabye put this in when the laser hits so we aren't updating the monster's HP before the hit
                if(data.was_damaged_type == 'hp') {

                    console.log("NPC's current hp: " + npcs[npc_index].current_hp);

                    npcs[npc_index].current_hp = npcs[npc_index].current_hp - data.damage_amount;

                    console.log("NPC's hp after the attack: " + npcs[npc_index].current_hp + " data.damage_amount: " + data.damage_amount);

                    if(npcs[npc_index].current_hp > 0) {
                        redrawBars();
                    } else {
                        console.log("removing npc on " + npcs[npc_index].id + " since HP is <= 0");
                        // remove the tile


                    }
                }
            } else {
                console.log("Could not find monster id: " + data.monster_id + " in our list of monsters");
            }

        }
        // An Object Was Damaged
        else if(data.object_id) {

            let object_index = objects.findIndex(function(obj) { return obj && obj.id === data.object_id; });

            if(object_index === -1) {
                console.log("%c Object was damaged, but we don't have info for it ", log_warning);
                socket.emit('request_object_info', { 'object_id': data.object_id });
                return false;
            }

            let object_type_index = object_types.findIndex(function(obj) { return obj && obj.id === objects[object_index].object_type_id; });

            if(object_type_index === -1) {
                console.log("%c Could not find object type for object", log_warning);
            }

            // It's a ship, so it's on the galaxy

            if(object_types[object_type_index].is_ship) {

                let coord_index = coords.findIndex(function(obj) { return obj && obj.id === objects[object_index].coord_id; });

                if(coord_index !== -1) {

                    let info_number_data = { 'x': tileToPixel(coords[coord_index].tile_x), 'y': tileToPixel(coords[coord_index].tile_y),
                        'damage_amount': data.damage_amount, 'was_damaged_type': data.was_damaged_type,
                        'defender_type': 'object', 'defender_id': parseInt(data.object_id), 'attacker_type': data.damage_source_type,
                        'attacker_id': data.damage_source_id, 'calculating_range': calculating_range };

                    addInfoNumber(info_number_data);

                    //addInfoNumber(coords[coord_index].tile_x * tile_size, coords[coord_index].tile_y * tile_size, data.damage_amount, data.was_damaged_type);
                }

                // Find the player who's ship this is
                let player_index = players.findIndex(function(obj) { return obj && obj.id === objects[object_index].player_id; });

                // If the player who's ship this is isn't online, nearby, or us, we might not have that player's info on the client side
                if(player_index !== -1) {


                    // The ship attacked was our ship
                    if(players[player_index].id === player_id) {
                        // lets add a system message that we damaged the monster
                        $('#chat_system').append($('<p>').text("Ship attacked your ship for " + data.damage_amount + " damage"));

                        var height = 0;
                        $('#chat_system p').each(function(i, value){
                            height += parseInt($(this).height());
                        });

                        height += '';

                        $('#chat_system').animate({scrollTop: height});

                        if(!$("#chat_system").is(":visible")) {
                            unread_system_messages = unread_system_messages + 1;

                            $('#chatswitch_system').text("System (" + unread_system_messages + ")");
                        }
                    }
                }


            } else {
                //console.log("Found object in known object_placements!");

                if(objects[object_index].coord_id) {
                    let coord_index = coords.findIndex(function(obj) { return obj && obj.id === objects[object_index].coord_id; });

                    if(coord_index !== -1) {

                        let info_number_data = { 'x': tileToPixel(coords[coord_index].tile_x), 'y': tileToPixel(coords[coord_index].tile_y),
                            'damage_amount': data.damage_amount, 'damage_type': data.was_damaged_type,
                            'defender_type': 'object', 'defender_id': parseInt(data.object_id), 'attacker_type': data.damage_source_type,
                            'attacker_id': data.damage_source_id, 'calculating_range': calculating_range };

                        addInfoNumber(info_number_data);

                        //addInfoNumber(tileToPixel(planet_coords[coord_index].tile_x), tileToPixel(planet_coords[coord_index].tile_y), data.damage_amount, data.was_damaged_type);
                    }
                }

                if(objects[object_index].planet_coord_id) {
                    let coord_index = planet_coords.findIndex(function(obj) { return obj && obj.id === objects[object_index].planet_coord_id; });

                    if(coord_index !== -1) {

                        let drawing_x = tileToPixel(planet_coords[coord_index].tile_x);
                        let drawing_y = tileToPixel(planet_coords[coord_index].tile_y);


                        addEffect({ 'x': drawing_x, 'y': drawing_y, 'damage_types': data.damage_types, 'was_damaged_type': data.was_damaged_type });


                        let info_number_data = { 'x': drawing_x, 'y': drawing_y,
                            'damage_amount': data.damage_amount, 'damage_type': data.was_damaged_type,
                            'defender_type': 'object', 'defender_id': parseInt(data.object_id), 'attacker_type': data.damage_source_type,
                            'attacker_id': data.damage_source_id, 'calculating_range': calculating_range };

                        addInfoNumber(info_number_data);

                        //addInfoNumber(tileToPixel(planet_coords[coord_index].tile_x), tileToPixel(planet_coords[coord_index].tile_y), data.damage_amount, data.was_damaged_type);
                    }
                } else if(objects[object_index].ship_coord_id) {
                    let coord_index = ship_coords.findIndex(function(obj) { return obj && obj.id === objects[object_index].ship_coord_id; });

                    if(coord_index !== -1) {

                        let info_number_data = { 'x': tileToPixel(ship_coords[coord_index].tile_x), 'y': tileToPixel(ship_coords[coord_index].tile_y),
                            'damage_amount': data.damage_amount, 'damage_type': data.was_damaged_type,
                            'defender_type': 'object', 'defender_id': parseInt(data.object_id), 'attacker_type': data.damage_source_type,
                            'attacker_id': data.damage_source_id, 'calculating_range': calculating_range };

                        addInfoNumber(info_number_data);

                        //addInfoNumber(tileToPixel(planet_coords[coord_index].tile_x), tileToPixel(planet_coords[coord_index].tile_y), data.damage_amount, data.was_damaged_type);
                    }
                }



            }



            let hp_message = "Updating object's HP from: " + objects[object_index].current_hp;
            objects[object_index].current_hp = objects[object_index].current_hp - data.damage_amount;
            hp_message += " to: " + objects[object_index].current_hp;
            //console.log(hp_message);


            redrawBars();


            // we know the destination - now find the source and do the shot
            // lets start out with the easiest condition - where OUR player just shot an object
            if(data.damage_source_type === 'player' && data.damage_source_id === player_id) {
                //console.log("Player is shooting object");


                // TODO this better
                //attack_box.x = tileToPixel(known_object_placements[object_index].tile_x);
                //attack_box.y = tileToPixel(known_object_placements[object_index].tile_y);

                //user_player_is_attacking_type = 'object';
                //user_player_is_attacking_type_id = known_object_placements[object_index].id;


            }


        }
        // A player was damaged
        else if(data.player_id) {

            data.player_id = parseInt(data.player_id);

            let coord_index = -1;
            let tile_x = -100;
            let tile_y = -100;
            if(current_view === 'planet') {
                coord_index = planet_coords.findIndex(function(obj) { return obj && obj.player_id === data.player_id; });
                if(coord_index !== -1) {
                    tile_x = planet_coords[coord_index].tile_x;
                    tile_y = planet_coords[coord_index].tile_y;
                }

            } else if(current_view === 'ship') {
                coord_index = ship_coords.findIndex(function(obj) { return obj && obj.player_id === data.player_id; });
                if(coord_index !== -1) {
                    tile_x = ship_coords[coord_index].tile_x;
                    tile_y = ship_coords[coord_index].tile_y;
                }
            }


            let player_index = players.findIndex(function(obj) { return obj && obj.id === data.player_id; });

            if(coord_index !== -1) {

                let info_number_data = { 'x': tileToPixel(tile_x), 'y': tileToPixel(tile_y),
                    'damage_amount': data.damage_amount, 'damage_type': data.was_damaged_type,
                    'defender_type': 'player', 'defender_id': parseInt(data.player_id), 'attacker_type': data.damage_source_type,
                    'attacker_id': data.damage_source_id, 'calculating_range': calculating_range };

                addInfoNumber(info_number_data);

                //addInfoNumber(planet_coords[coord_index].tile_x * tile_size, planet_coords[coord_index].tile_y * tile_size, data.damage_amount, data.was_damaged_type);
            }

            if(player_index !== -1) {
                players[player_index].current_hp = players[player_index].current_hp - parseInt(data.damage_amount);

                redrawBars();
            }

            // It was us that was damaged
            if(data.player_id === player_id) {
                // lets add a system message that we damaged the monster
                if(data.damage_source_type === 'addiction') {
                    $('#chat_system').append($('<p>').text("Addiction damaged you for " + data.damage_amount + " damage"));
                } else if(data.damage_source_type === 'floor') {
                    $('#chat_system').append($('<p>').text("The floor damaged you for " + data.damage_amount + " damage"));
                } else if(data.damage_source_type === 'healing') {
                    $('#chat_system').append($('<p>').text("You healed " + data.damage_amount + " damage"));
                } else {

                    $('#chat_system').append($('<p>').text(data.damage_source_type + " attacked you for " + data.damage_amount + " damage"));
                }

                if(!$("#chat_system").is(":visible")) {
                    unread_system_messages = unread_system_messages + 1;

                    $('#chatswitch_system').text("System (" + unread_system_messages + ")");
                } else {
                    let out = document.getElementById("chat_system");

                    out.scrollTop = out.scrollHeight - out.clientHeight;

                    //console.log("Scrolled chat_system. scrollTop: " + out.scrollTop);
                }

                // update our details display
                generatePlayerInfoDisplay();
            }

        }
        // Just showing an effect on a planet coord
        else if(data.planet_coord_id) {
            let coord_index = planet_coords.findIndex(function(obj) { return obj && obj.id === parseInt(data.planet_coord_id); });

            if(coord_index !== -1) {
                let x = planet_coords[coord_index].tile_x * tile_size;
                let y = planet_coords[coord_index].tile_y * tile_size;

                let damage_types = [];
                damage_types.push(data.damage_type);
                addEffect({ 'x': x, 'y': y, 'damage_types': damage_types });
            }

        }
        // Just showing an effect on a ship coord
        else if(data.ship_coord_id) {
            let coord_index = ship_coords.findIndex(function(obj) { return obj && obj.id === parseInt(data.ship_coord_id); });

            if(coord_index !== -1) {
                let x = ship_coords[coord_index].tile_x * tile_size;
                let y = ship_coords[coord_index].tile_y * tile_size;
                let damage_types = [];
                damage_types.push(data.damage_type);
                addEffect({ 'x': x, 'y': y, 'damage_types': damage_types });
            }

        }

        if(data.flavor_text) {
            console.log("Got damaged data with flavor tex!");
            text_important.setText(data.flavor_text);
            text_important.setVisible(true);
            text_important_time = our_time;
        }
    });


    */


    socket.on('disconnect', function() {
        console.log("Disconnected");


        $("#error_container").show();
        $("#wrapper").hide();
        if(game) {
            game.destroy();
        }

    });


    socket.on('eating_linker_info', function(data) {
        //console.log("Got eating linker info. Ticks completed: " + data.eating_linker.ticks_completed);

        let eating_linker_index = eating_linkers.findIndex(function(obj) { return obj && obj.id === parseInt(data.eating_linker.id); });

        if(data.remove && eating_linker_index !== -1) {
            //console.log("Removing eating linker");
            delete eating_linkers[eating_linker_index];

        } else if(eating_linker_index === -1) {
            //console.log("Pushed to eating_linkers");
            eating_linker_index = eating_linkers.push(data.eating_linker) - 1;
            eating_linkers[eating_linker_index].id = parseInt(eating_linkers[eating_linker_index].id);
            eating_linkers[eating_linker_index].last_update = Math.floor(new Date());

            //console.log("Eating linker eating_object_type_id is: " + eating_linkers[eating_linker_index].eating_object_type_id);

        } else {
            eating_linkers[eating_linker_index] = data.eating_linker;
            eating_linkers[eating_linker_index].id = parseInt(eating_linkers[eating_linker_index].id);
            eating_linkers[eating_linker_index].last_update = Math.floor(new Date());
        }

        generateEatingLinkerDisplay();
        generateAddictionDisplay();


    });

    socket.on('equipment_linker_info', function(data) {


        data.equipment_linker.id = parseInt(data.equipment_linker.id);

        // see if we already have this equipment linker
        let equipment_linker_index = equipment_linkers.findIndex(function(obj) { return obj && obj.id === data.equipment_linker.id; });

        if(data.remove && equipment_linker_index !== -1) {
            delete equipment_linkers[equipment_linker_index];

        } else if(equipment_linker_index === -1) {
            //console.log("Pushed to equipment_linkers");
            equipment_linker_index = equipment_linkers.push(data.equipment_linker) - 1;

        } else {
            // Just updating it
            equipment_linkers[equipment_linker_index] = data.equipment_linker;


        }


        generateEquipmentDisplay();


    });


    socket.on('coord_info', function (data) {

        if(!data.coord) {
            console.log("%c coord_info without coord", log_warning);
            console.log(data);
            return false;
        }

        //console.log("Recieved coord info (galaxy coord)");

        let id = parseInt(data.coord.id);

        let coord_index = coords.findIndex(function(obj) { return obj && obj.id === id; });

        if(coord_index === -1) {
            coord_index = coords.push(data.coord) - 1;
            drawCoord('galaxy', coords[coord_index]);

            // we just added the coord that the player is on - we should insta center the player there if we are in the galaxy view
            if(coords[coord_index].player_id === client_player_id && current_view === 'galaxy') {
                movePlayerInstant(client_player_index, coords[coord_index].tile_x * tile_size + tile_size / 2,
                    coords[coord_index].tile_y * tile_size + tile_size / 2);
            }

            // Just added a coord with a planet
            if(coords[coord_index].planet_id) {

                let planet_index = planets.findIndex(function(obj) { return obj && obj.id === coords[coord_index].planet_id });

                if(planet_index !== -1) {
                    // We also might have belongs_belongs_to_planet_id coords that could use a redraw
                    let belongs_to_coords = coords.filter(coord => coord.belongs_to_planet_id === planets[planet_index].id);

                    if(belongs_to_coords.length > 0) {
                        belongs_to_coords.forEach(function(coord) {
                            drawCoord('galaxy', coord);
                        });
                    }
                }


            }
        } else {

            if(coords[coord_index].object_id !== data.coord.object_id || coords[coord_index].belongs_to_object_id !== data.coord.belongs_to_object_id) {
                //console.log(coords[coord_index].object_id + " doesn't match " + data.coord.object_id + " redrawing coord");
                drawCoord('galaxy', data.coord);
            }

            /*
            else if(coords[coord_index].player_id !== data.coord.player_id) {
                //console.log(coords[coord_index].player_id + " doesn't match " + data.coord.player_id + " redrawing coord");
                drawCoord('galaxy', data.coord);
            }
            */



            if(coords[coord_index].floor_type_id !== data.coord.floor_type_id) {
                //console.log(coords[coord_index].floor_type_id + " doesn't match " + data.coord.floor_type_id + " redrawing coord");
                drawCoord('galaxy', data.coord);
            }


            coords[coord_index] = data.coord;
        }


        if(coords[coord_index].npc_id) {
            console.log("Coord has an npc");
            let npc_index = npcs.findIndex(function(obj) { return obj && obj.id === parseInt(coords[coord_index].npc_id); });
            if(npc_index === -1) {
                console.log("We don't have this npc. Requesting it");
                socket.emit('request_npc_info', { 'npc_id': coords[coord_index].npc_id });
            }
        }

    });

    socket.on('faction_info', function(data) {

        console.log("Got faction info for faction with name: " + data.faction.name);

        let faction_index = factions.findIndex(function(obj) { return obj && obj.id === parseInt(data.faction.id); });

        if(faction_index === -1) {
            factions.push(data.faction);

            // If we just pushed our player's faction, lets update that faction display!
            if(client_player_index !== -1 && data.faction.id === players[client_player_index].faction_id) {
                console.log("This is the faction our player is in!");
                generateFactionDisplay();
            }
        }
    });


    socket.on('floor_type_info', function(data) {

        let floor_type_index = floor_types.findIndex(function(obj) { return obj && obj.id === parseInt(data.floor_type.id); });

        if(floor_type_index === -1) {
            floor_type_index = floor_types.push(data.floor_type) - 1;

            floor_types[floor_type_index].id = parseInt(floor_types[floor_type_index].id);
        }

    });

    socket.on('floor_type_display_linker_info', function(data) {

        let floor_type_display_linker_index = floor_type_display_linkers.findIndex(function(obj) {
            return obj && obj.id === parseInt(data.floor_type_display_linker.id); });

        if(floor_type_display_linker_index === -1) {
            floor_type_display_linkers.push(data.floor_type_display_linker);
        }
    });

    socket.on('inventory_item_info', function(data) {

        //console.log("Got inventory item info for inventory item id: " + data.inventory_item.id);

        let inventory_item = data.inventory_item;
        let inventory_index = inventory_items.findIndex(function (obj) { return obj && obj.id === parseInt(data.inventory_item.id); });

        if(data.remove && inventory_index !== -1) {
            console.log("Server said to remove inventory_item_id: " + data.inventory_item.id);


            delete inventory_items[inventory_index];

            console.log(inventory_items[inventory_index]);

            generateInventoryDisplay();

            console.log("Removed inventory item");
            return false;

        } else {

            // see if we have this in our inventory_items array
            let inventory_index = inventory_items.findIndex(function (obj) { return obj && obj.id === inventory_item.id; });
            if(inventory_index === -1) {
                inventory_index = inventory_items.push(inventory_item) - 1;
                inventory_items[inventory_index].id = parseInt(inventory_items[inventory_index].id);
            } else {
                // see if there's an update on the amount
                if(inventory_item.amount !== inventory_items[inventory_index].amount) {
                    inventory_items[inventory_index].amount = inventory_item.amount;
                }
            }

        }

        // If it inventory item was about us, update our inventory displayer and re-calculate the assembly list
        if(inventory_item.player_id && inventory_item.player_id === player_id) {
            generateInventoryDisplay();

            printAssemblyList();

        }


        // I don't think we need to actually do any of this and should just get the has_inventory value from the server
        /*
        if(!data.remove && inventory_item.owned_by_object_id) {

            // update the owned_by_object_id object's has_inventory
            let owning_object_index = objects.findIndex(function(obj) { return obj && obj.id === inventory_item.owned_by_object_id; });
            if(owning_object_index !== -1) {
                if(objects[owning_object_index].has_inventory === false) {
                    objects[owning_object_index].has_inventory = true
                }
                console.log("object id: " + objects[owning_object_index].id + " has_inventory: " + objects[owning_object_index].has_inventory);
            } else {
                console.log("Could not find owner object id: " + inventory_item.owned_by_object_id + " in our known_object_placements");
            }


        }
        */

        // lets populate our build/assemble tab
        $('#can_assemble_list').empty();

        //console.log("At object_types adding to assemble part");
        printAssemblyList();
    });


    socket.on('login_data', function(data) {
        //console.log("Got login_data");
        if(data.status == 'success' || data.is_logged_in == 'true') {
            logged_in = true;
            current_view = data.starting_view;
            console.log("%c We are logged in and set our starting view to: " + current_view, log_success);
            player_id = parseInt(data.player_id);
            client_player_id = parseInt(data.player_id);
            $("#login_container").hide();
            $("#chat_container").show();





            let player_index = players.findIndex(function(obj) { return obj && obj.id === parseInt(client_player_id); });

            if(player_index === -1) {
                console.log("Got login data, but don't have the us (client) in players. Requesting player info");
                socket.emit('request_player_info', { 'player_id': client_player_id });
            } else {
                console.log("Got login data, and already have our player in the players array!");
                client_player_index = player_index;

                if(!players[client_player_index].sprite) {
                    console.log("Creating our sprite");
                    createPlayerSprite(client_player_index);
                    client_player_info = getPlayerInfo(client_player_index);


                    if(client_player_info.coord && players[client_player_index.sprite]) {
                        console.log("Have coord for our player and sprite!");
                        players[client_player_index].sprite.x = client_player_info.coord.tile_x * tile_size + tile_size / 2;
                        players[client_player_index].sprite.y = client_player_info.coord.tile_y * tile_size + tile_size / 2;
                    } else {
                        console.log("Don't have coord for our player yet");
                    }
                }

                if(players[client_player_index].sprite) {
                    console.log("Following our player");
                    camera.startFollow(players[client_player_index].sprite);
                }

            }

            console.log("Got starting view as: " + current_view);



            // populate the launch button so we can navigate out of our starting view
            if(current_view === 'galaxy') {
                console.log("Emptied launch in login_data");
                $('#launch').empty();

                let html_string = "";

                html_string += "<button class='button is-success' id='viewchange' newview='ship'>";
                html_string += "<i class='fad fa-space-shuttle'></i> Ship View</button>";
                $('#launch').append(html_string);
            } else if(current_view === 'planet') {
                //$('#launch').empty();
                //$('#launch').append('<button class="btn btn-block btn-success" id="viewchange" newview="galaxy">Launch From Planet</button>');
            } else if(current_view === 'ship') {

                generateAirlockDisplay();

            }

            generateEquipmentDisplay();

            redrawMap();

        } else {
            $('#login_status').append("<span style='color:red;'>Login Failed</span>");
            console.log("%c Login failed", log_danger);
        }
    });


    socket.on('market_linker_info', function(data) {

        console.log("Got market linker info");

        data.market_linker.id = parseInt(data.market_linker.id);

        let market_linker_index = market_linkers.findIndex(function(obj) { return obj && obj.id === data.market_linker.id; });

        if(data.remove && market_linker_index !== -1) {

            delete market_linkers[market_linker_index];
            generateMarketDisplay();
            return;
        }

        if(market_linker_index === -1) {
            market_linker_index = market_linkers.push(data.market_linker) - 1;

        } else {
            market_linkers[market_linker_index] = data.market_linker;
        }

        generateMarketDisplay();

    });

    socket.on('mining_info', function(data) {


       let mining_linker_index = mining_linkers.findIndex(function(obj) { return obj && obj.id === data.mining_linker_id; });

       if(mining_linker_index === -1) {
           return false;
       }

        let object_index = objects.findIndex(function(obj) { return obj && obj.id === mining_linkers[mining_linker_index].object_id; });

        if(object_index === -1) {
            return false;
        }


        let info_number_x = -1000;
        let info_number_y = -1000;

        if(objects[object_index].coord_id) {
            let coord_index = coords.findIndex(function(obj) { return obj && obj.id === objects[object_index].coord_id; });
            if(coord_index === -1) {
                return false;
            }

            info_number_x = tileToPixel(coords[coord_index].tile_x);
            info_number_y = tileToPixel(coords[coord_index].tile_y);


        } else if(objects[object_index].planet_coord_id) {
            let planet_coord_index = planet_coords.findIndex(function(obj) { return obj && obj.id === objects[object_index].planet_coord_id; });
            if(planet_coord_index === -1) {
                return false;
            }

            info_number_x = tileToPixel(planet_coords[planet_coord_index].tile_x);
            info_number_y = tileToPixel(planet_coords[planet_coord_index].tile_y);
        }



        // add an info number
        let info_number_data = { 'x': info_number_x, 'y': info_number_y,
            'damage_amount': data.amount, 'damage_type': 'mining',
            'defender_type': 'object', 'defender_id': mining_linkers[mining_linker_index].object_id, 'attacker_type': 'player',
            'attacker_id': mining_linkers[mining_linker_index].player_id };


        let function_data = {'damage_amount': data.amount, 'x': info_number_x, 'y': info_number_y, 'damage_types': ['mining'] };
        console.log(function_data);
        addInfoNumber(function_data);
        addEffect(function_data);
        //addInfoNumber(info_number_data);




    });

    socket.on('mining_linker_info', function(data) {

        console.log("Got mining_linker_info with id : " + data.mining_linker.id);

        let index = mining_linkers.findIndex(function(obj) { return obj && obj.id === data.mining_linker.id; });


        if(data.remove && index !== -1) {
            delete mining_linkers[index];
            console.log("Removed mining linker");
            if(mining_beam_sprite) {
                mining_beam_sprite.setVisible(false);
            }
            redrawBars();
            return;
        } else if(index === -1) {
            index = mining_linkers.push(data.mining_linker) - 1;

        }

        // TODO support for other player's mining beams to show up

        // Lets try to have our beam for our mining linker
        if(mining_linkers[index].player_id === client_player_id) {

            let scene_game = game.scene.getScene('sceneGame');

            let object_index = objects.findIndex(function(obj) { return obj && obj.id === mining_linkers[index].object_id; });

            // Probably not in our view anymore
            if(object_index === -1) {
                return;
            }
            let object_info = getObjectInfo(object_index);

            let object_x_beam = tileToPixel(object_info.coord.tile_x) + 32;
            let object_y_beam = tileToPixel(object_info.coord.tile_y) + 32;


            if(mining_beam_sprite === false) {
                console.log("Creating mining sprite");
                mining_beam_sprite = scene_game.add.sprite(players[client_player_index].sprite.x, players[client_player_index].sprite.y, 'mining-beam');
                mining_beam_sprite.object_x = object_x_beam;
                mining_beam_sprite.object_y = object_y_beam;

                // I think it will be easier if we origin on a side
                mining_beam_sprite.setOrigin(0,.5);
                // Makes it too dull
                //mining_beam_sprite.alpha = 0.7;
            } else {
                mining_beam_sprite.object_index = object_index;
                mining_beam_sprite.object_x = object_x_beam;
                mining_beam_sprite.object_y = object_y_beam;
                mining_beam_sprite.x = players[client_player_index].sprite.x;
                mining_beam_sprite.y = players[client_player_index].sprite.y;
                mining_beam_sprite.setVisible(true);
                console.log("Making mining sprite visible");
            }

            mining_beam_sprite.anims.play('mining-beam');
            let distance = Phaser.Math.Distance.Between(players[client_player_index].sprite.x, players[client_player_index].sprite.y,
                object_x_beam, object_y_beam);
            let angle_between = Phaser.Math.Angle.Between(players[client_player_index].sprite.x, players[client_player_index].sprite.y,
                object_x_beam, object_y_beam);

            mining_beam_sprite.displayWidth = distance;
            // mining_beam_sprite.rotation = angle_between - 1.4;
            mining_beam_sprite.rotation = angle_between;

        }


        /* Trying to have the mining_linker different from the actual mining info being sent each time something is mined
        let object_index = objects.findIndex(function(obj) { return obj && obj.id === mining_linkers[index].object_id; });

        if(object_index !== -1) {
            let coord_index = coords.findIndex(function(obj) { return obj && obj.id === objects[object_index].coord_id; });
            if(coord_index !== -1) {

                // add an info number
                let info_number_data = { 'x': tileToPixel(coords[coord_index].tile_x), 'y': tileToPixel(coords[coord_index].tile_y),
                    'damage_amount': 10, 'damage_type': 'mining',
                    'defender_type': 'object', 'defender_id': mining_linkers[index].object_id, 'attacker_type': 'player',
                    'attacker_id': mining_linkers[index].player_id };

                addInfoNumber(info_number_data);

            }
        }
        */

    });

    socket.on('monster_action_data', function(data) {
       if(data.action == 'remove') {
           console.log("Got remove action from monster_action_data " + data.action + " " + data.monster_id);
           removeMonster(data.monster_id);
       }
    });

    socket.on('monster_info', function(data) {


        if(!data.monster) {
            console.log("%c Received monster info without a monster", log_warning);
            return false;
        }

        //console.log("Got monster info for monster id: " + data.monster.id);

        let monster_index = monsters.findIndex(function(obj) { return obj && obj.id === parseInt(data.monster.id); });

        if(data.remove) {

            removeMonster(data.monster.id);
            return;
        }

        client_player_info = getPlayerInfo(client_player_index);

        //console.log("Got monster info for monster id: " + data.monster.id);

        if(monster_index === -1) {
            //console.log("Did not have monster in monsters. Adding monster id: " + data.monster.id);


            monster_index = monsters.push(data.monster) - 1;
            monsters[monster_index].id = parseInt(monsters[monster_index].id);
            //console.log("Added monster id: " + monsters[monster_index].id + " monster type id: " + monsters[monster_index].monster_type_id);


            let monster_info = getMonsterInfo(monster_index);

            if(shouldDraw(client_player_info.coord, monster_info.coord, "monster_info")) {
                createMonsterSprite(monster_index);
            } else {
                console.log("%c Not drawing monster", log_warning);
                if(!client_player_info.coord) {
                    console.log("Client player doesn't have a coord yet");
                }

                if(!monster_info.coord) {
                    console.log("Don't have a coord for the monster yet");
                }
            }


            //showMonster(monsters[monster_index]);


        }
        // Already have the monster
        else {

            let monster_info = getMonsterInfo(monster_index);

            if(shouldDraw(client_player_info.coord, monster_info.coord, "monster_info")) {
                createMonsterSprite(monster_index);
            }

            // Monster moved on a planet
            if(monsters[monster_index].planet_coord_id && monsters[monster_index].planet_coord_id !== data.monster.planet_coord_id) {

                let old_planet_coord_index = planet_coords.findIndex(function(obj) { return obj && obj.id === monsters[monster_index].planet_coord_id; });

                if(client_player_info && client_player_info.coord &&
                    shouldDraw(client_player_info.coord, planet_coords[old_planet_coord_index], 'monster_info')) {
                    //console.log("Monster is on a new planet coord id. old: " + monsters[monster_index].planet_coord_id +
                    //    " new: " + data.monster.planet_coord_id);

                    let new_planet_coord_index = planet_coords.findIndex(function(obj) { return obj && obj.id === data.monster.planet_coord_id; });

                    if(new_planet_coord_index !== -1) {

                        createMonsterSprite(monster_index);

                        // get the monster type
                        let monster_type_index = monster_types.findIndex(function(obj) { return obj && obj.id === monsters[monster_index].monster_type_id; });

                        // and see if it's in a battle
                        let monster_battle_linker_index = battle_linkers.findIndex(function(obj) { return obj &&
                            (   (obj.attacking_id === monsters[monster_index].id && obj.attacking_type === 'monster') ||
                                (obj.being_attacked_id === monsters[monster_index].id && obj.being_attacked_type === 'monster')
                            ); });

                        let move_type = 'flow';

                        if(monster_battle_linker_index !== -1 && monster_types[monster_type_index].attack_movement_type === 'warp_to') {
                            move_type = 'warp';
                        }

                        if(move_type === 'flow') {
                            moveMonsterFlow(monster_index, planet_coords[new_planet_coord_index]);
                        } else if(move_type === 'warp') {
                            moveMonsterInstant(monster_index, planet_coords[new_planet_coord_index]);
                        }


                        //if(old_planet_coord_index !== -1) {
                        //    map.putTileAt(-1, planet_coords[old_planet_coord_index].tile_x, planet_coords[old_planet_coord_index].tile_y, false, 'layer_being');
                        //}

                        // It's possible the monster moved to where the client is trying to move to, but the monster got there first
                        //      snap the player back
                        if(planet_coords[new_planet_coord_index].id === client_move_planet_coord_id && client_move_planet_coord_id !== players[client_player_index].planet_coord_id) {

                            let return_to_planet_coord_index = planet_coords.findIndex(function(obj) { return obj && obj.id === players[client_player_index].planet_coord_id; });
                            if(return_to_planet_coord_index !== -1) {
                                let return_x = planet_coords[return_to_planet_coord_index].tile_x * tile_size + tile_size / 2;
                                let return_y = planet_coords[return_to_planet_coord_index].tile_y * tile_size + tile_size / 2;
                                client_move_planet_coord_id = players[client_player_index].planet_coord_id;
                                movePlayerInstant(client_player_index, return_x, return_y);

                            }

                        }


                    }

                }
            }





            // Monster moved on a ship
            if(monsters[monster_index].ship_coord_id && monsters[monster_index].ship_coord_id !== data.monster.ship_coord_id) {
                //console.log("Monster is on a new ship coord id. old: " + monsters[monster_index].ship_coord_id +
                //    " new: " + data.monster.ship_coord_id);

                let new_ship_coord_index = ship_coords.findIndex(function(obj) { return obj && obj.id === data.monster.ship_coord_id; });

                if(new_ship_coord_index !== -1) {
                    createMonsterSprite(monster_index);
                    moveMonsterFlow(monster_index, ship_coords[new_ship_coord_index]);

                    /*
                    let old_ship_coord_index = ship_coords.findIndex(function(obj) { return obj && obj.id === monsters[monster_index].ship_coord_id; });
                    if(old_ship_coord_index !== -1) {
                        map.putTileAt(-1, ship_coords[old_ship_coord_index].tile_x, ship_coords[old_ship_coord_index].tile_y, false, 'layer_being');
                    }
                    */

                    // It's possible the monster moved to where the client is trying to move to, but the monster got there first
                    //      snap the player back
                    if(ship_coords[new_ship_coord_index].id === client_move_ship_coord_id && client_move_ship_coord_id !== players[client_player_index].ship_coord_id) {

                        let return_to_ship_coord_index = ship_coords.findIndex(function(obj) { return obj && obj.id === players[client_player_index].ship_coord_id; });
                        if(return_to_ship_coord_index !== -1) {
                            let return_x = ship_coords[return_to_ship_coord_index].tile_x * tile_size + tile_size / 2;
                            let return_y = ship_coords[return_to_ship_coord_index].tile_y * tile_size + tile_size / 2;
                            client_move_ship_coord_id = players[client_player_index].ship_coord_id;
                            movePlayerInstant(client_player_index, return_x, return_y);
                        }

                    }

                }

            }

            // selectively push new values that would have changed from the server

            let need_redraw_bars = false;
            if(monsters[monster_index].current_hp !== data.monster.current_hp && monsters[monster_index].sprite) {
                console.log("Have monster info with an hp change. Going to redraw bars");
                need_redraw_bars = true;
            }

            monsters[monster_index].current_hp = data.monster.current_hp;
            monsters[monster_index].planet_id = data.monster.planet_id;
            monsters[monster_index].planet_level = data.monster.planet_level;
            monsters[monster_index].planet_coord_id = data.monster.planet_coord_id;
            monsters[monster_index].ship_coord_id = data.monster.ship_coord_id;
            // Can't use this when we are giving the monster a sprite
            //monsters[monster_index] = data.monster;
            //showMonster(monsters[monster_index]);

            if(need_redraw_bars) {
                redrawBars();
            }

        }


    });


    socket.on('monster_move_data', function(data) {
        // x and y inputted here are tile #s
        //console.log("Got monster move data");

        monsters.forEach(function(monster) {
            if(monster.id == data.monster_id) {

                var moving_direction = 'right';
                var data_x_pixel = tileToPixel(data.x);
                var data_y_pixel = tileToPixel(data.y);
                if(data_x_pixel < monster.x) {
                    moving_direction = 'left';
                } else if(data_y_pixel < monster.y) {
                    moving_direction = 'up';
                } else if(data_y_pixel > monster.y) {
                    moving_direction = 'down';
                }

                //console.log("Moving monster from x,y: " + monster.x + "," + monster.y + " to x,y:" + tileToPixel(data.x) + "," + tileToPixel(data.y));

                monster.is_moving = true;
                monster.moving_direction = moving_direction;

                /*
                // lets see if we can get a smooth move
                monster.x = data_x_pixel;
                monster.y = data_y_pixel;
                monster.tile_x = data.x;
                monster.tile_y = data.y;

                monster.monster_image.body.moveTo(1000, 64, angle);
                //monster.hp_bar.body.moveTo(1000, 64, angle);
                monster.hp_bar_image.body.moveTo(1000, 64, angle);
                */
                //game.physics.arcade.moveTo(monster.monster_image, tileToPixel(data.x), tileToPixel(data.y), 60);

                /*
                // starting off, INSTANT MOVE
                monster.x = data.x * tile_size;
                monster.y = data.y * tile_size;
                monster.monster_image.x = monster.x;
                monster.monster_image.y = monster.y;
                monster.tile_x = data.x;
                monster.tile_y = data.y;


                updateMonsterHealthDisplay(monster);

                console.log("Moved monster sprite to tile " + data.x + "," + data.y);
                */
            }
        });

    });


    socket.on('monster_type_info', function(data) {

        //console.log("Got monster type info");

        let monster_type_index = monster_types.findIndex(function(obj) { return obj && obj.id === parseInt(data.monster_type.id); });

        if(monster_type_index === -1) {
            monster_type_index = monster_types.push(data.monster_type) - 1;
            monster_types[monster_type_index].id = parseInt(monster_types[monster_type_index].id);
        }
    });

    socket.on('move_failure', function(data) {
        console.log("Got move failure info");
        console.log(data);

        if(data.failed_planet_coord_id) {
            let back_to_planet_coord_index = planet_coords.findIndex(function(obj) { return obj && obj.id === parseInt(data.return_to_planet_coord_id); });

            if(back_to_planet_coord_index === -1) {
                console.log("%c Server said to return to planet coord we aren't aware of. ", log_warning);
                return false;
            }

            let x = planet_coords[back_to_planet_coord_index].tile_x * tile_size + tile_size / 2;
            let y = planet_coords[back_to_planet_coord_index].tile_y * tile_size + tile_size / 2;

            movePlayerInstant(client_player_index, x, y);
        } else if(data.failed_ship_coord_id) {
            let back_to_ship_coord_index = ship_coords.findIndex(function(obj) { return obj && obj.id === parseInt(data.return_to_ship_coord_id); });

            if(back_to_ship_coord_index === -1) {
                console.log("%c Server said to return to ship coord we aren't aware of. ", log_warning);
                return false;
            }

            let x = ship_coords[back_to_ship_coord_index].tile_x * tile_size + tile_size / 2;
            let y = ship_coords[back_to_ship_coord_index].tile_y * tile_size + tile_size / 2;

            movePlayerInstant(client_player_index, x, y);
        } else if(data.failed_coord_id || data.return_to_coord_id) {
            let back_to_coord_index = coords.findIndex(function(obj) { return obj && obj.id === parseInt(data.return_to_coord_id); });

            if(back_to_coord_index === -1) {
                console.log("%c Server said to return to coord we aren't aware of. ", log_warning);
                return false;
            }

            let x = coords[back_to_coord_index].tile_x * tile_size + tile_size / 2;
            let y = coords[back_to_coord_index].tile_y * tile_size + tile_size / 2;

            movePlayerInstant(client_player_index, x, y);
        }


        // Got authoritative info from the server, client needs to match it
        client_move_planet_coord_id = 0;
        client_move_ship_coord_id = 0;
        client_move_coord_id = 0;
    });

    socket.on('move_player', function(data) {

    });

    socket.on('news', function (data) {
        console.log("Got news");
        $('#status').text(data.status);
        socket.emit('my other event', { my: 'data' });
        console.log("Connected");
        $("#status_container").hide();
        $("#chat_global").hide();
        $("#chat_faction").hide();
        $("#chat_system").hide();

        //console.log('Gathering our data');
        socket.emit('request_assembled_in_linker_data');
        socket.emit('request_assembly_linker_data');
        socket.emit('request_faction_data');
        socket.emit('request_floor_type_data');
        socket.emit('request_floor_type_display_linker_data');
        socket.emit('request_monster_type_data');
        socket.emit('request_object_type_data');
        socket.emit('request_object_type_display_linker_data');
        socket.emit('request_object_type_equipment_linker_data');
        socket.emit('request_floor_type_data');
        socket.emit('request_planet_type_data');
        socket.emit('request_planet_type_display_linker_data');
        socket.emit('request_race_data');
        socket.emit('request_race_eating_linker_data');


    });

    socket.on('npc_info', function(data) {

        console.log("Got npc info for npc id: " + data.npc.id);

        data.npc.id = parseInt(data.npc.id);

        //console.log("Received npc_info for npc id: " + data.npc.id);

        let npc_index = npcs.findIndex(function(obj) { return obj && obj.id === data.npc.id; });

        if(data.remove) {
            removeNpc(data.npc.id);
            return;
        }

        client_player_info = getPlayerInfo(client_player_index);

        if(npc_index === -1) {
            //console.log("Pushing npc");
            npc_index = npcs.push(data.npc) - 1;
            npcs[npc_index].id = parseInt(npcs[npc_index].id);

            let npc_info = getNpcInfo(npc_index);

            if(shouldDraw(client_player_info.coord, npc_info.coord, "npc_info")) {
                console.log("Should draw npc");
                createNpcSprite(npc_index);

                if(npcs[npc_index].current_hp !== npcs[npc_index].max_hp) {
                    console.log("redrawing bars due to npc hp");
                    redrawBars();
                }
            } else {
                //console.log("Not drawing this one right now");

            }
        } else {
            //console.log("Got updated npc info");

            let npc_info = getNpcInfo(npc_index);

            if(shouldDraw(client_player_info.coord, npc_info.coord, "npc_info")) {
                //console.log("Should draw npc");
                createNpcSprite(npc_index);
            } else {
                //console.log("Not drawing");
                //console.log(client_player_info.coord);
                //console.log(npc_info.coord);
            }

            // Npc moved on a planet
            if(npcs[npc_index].planet_coord_id && npcs[npc_index].planet_coord_id !== data.npc.planet_coord_id) {

                let old_planet_coord_index = planet_coords.findIndex(function(obj) { return obj && obj.id === npcs[npc_index].planet_coord_id; });

                if(client_player_info && client_player_info.coord &&
                    shouldDraw(client_player_info.coord, planet_coords[old_planet_coord_index], 'npc_info')) {
                    //console.log("Monster is on a new planet coord id. old: " + npcs[npc_index].planet_coord_id +


                    let new_planet_coord_index = planet_coords.findIndex(function(obj) { return obj && obj.id === data.npc.planet_coord_id; });

                    if(new_planet_coord_index !== -1) {

                        createNpcSprite(npc_index);
                        //console.log("Got that monster id : " + npcs[npc_index].id + " moved");
                        moveNpcFlow(npc_index, planet_coords[new_planet_coord_index]);


                    }

                }
            }


            // Npc moved on a ship
            if(npcs[npc_index].ship_coord_id && npcs[npc_index].ship_coord_id !== data.npc.ship_coord_id) {
                //console.log("Monster is on a new ship coord id. old: " + npcs[npc_index].ship_coord_id +
                //    " new: " + data.monster.ship_coord_id);

                let new_ship_coord_index = ship_coords.findIndex(function(obj) { return obj && obj.id === data.npc.ship_coord_id; });

                if(new_ship_coord_index !== -1 && shouldDraw(client_player_info.coord, npc_info.coord, 'npc_info')) {
                    createNpcSprite(npc_index);
                    moveNpcFlow(npc_index, ship_coords[new_ship_coord_index]);
                }

            }

            // Npc moved in the galaxy
            if(npcs[npc_index].coord_id && npcs[npc_index].coord_id !== data.npc.coord_id) {
                console.log("NPC is on a new galaxy coord id. old: " + npcs[npc_index].coord_id +
                    " new: " + data.npc.coord_id);

                let new_coord_index = coords.findIndex(function(obj) { return obj && obj.id === parseInt(data.npc.coord_id); });

                if(new_coord_index !== -1 && shouldDraw(client_player_info.coord, npc_info.coord, 'npc_info')) {

                    console.log("Going to flow the npc there");
                    createNpcSprite(npc_index);
                    moveNpcFlow(npc_index, coords[new_coord_index]);


                } else {
                    console.log("Couldn't find the coord, or not drawing npc");
                }

            }

            // Selectively update things from the server, since we'll have a sprite we don't want to erase
            npcs[npc_index].coord_id = data.npc.coord_id;
            if(parseInt(npcs[npc_index].current_hp) !== parseInt(data.npc.current_hp)) {
                console.log("NPC had health change. Redrawing bars");
                redrawBars();
            }
            npcs[npc_index].current_hp = data.npc.current_hp;
            npcs[npc_index].current_job_id = data.npc.current_job_id;
            npcs[npc_index].current_structure_type_id = data.npc.current_structure_type_id;
            npcs[npc_index].current_structure_type_is_built = data.npc.current_structure_type_is_built;
            npcs[npc_index].dream_job_id = data.npc.dream_job_id;
            npcs[npc_index].max_hp = data.npc.max_hp;
            npcs[npc_index].planet_coord_id = data.npc.planet_coord_id;
            npcs[npc_index].ship_coord_id = data.npc.ship_coord_id;


            // cases where the npc is now out of our current room
            if(current_view === 'planet' && !npcs[npc_index].planet_coord_id && npcs[npc_index].sprite) {
                destroyNpcSprite(npcs[npc_index]);
                npcs[npc_index].destination_x = false;
                npcs[npc_index].destination_y = false;
            }

            if(current_view === 'galaxy' && !npcs[npc_index].coord_id && npcs[npc_index].sprite) {
                destroyNpcSprite(npcs[npc_index]);
                npcs[npc_index].destination_x = false;
                npcs[npc_index].destination_y = false;
            }



        }


    });


    socket.on('object_info', function(data) {

        //console.log("Received object_info_data for object id: " + data.object.id);

        if(data.remove ) {
            console.log("%c Server said to remove object id: " + data.object.id, log_warning);

            let object_index = objects.findIndex(function(obj) { return obj && obj.id === parseInt(data.object.id); });


            if(object_index !== -1) {

                let object_type_index = object_types.findIndex(function(obj) { return obj && obj.id === objects[object_index].object_type_id; });
                let update_ship_management_display = false;
                if(object_types[object_type_index].is_ship && objects[object_index].player_id === client_player_id) {
                    console.log("Got remove data for a ship that was ours - it was destroyed and we should update our ship management display");
                    update_ship_management_display = true;
                }

                delete objects[object_index];

                if(update_ship_management_display) {
                    generateShipManagementDisplay();
                }
            }

            // remove any battle linkers with this object in it
            for(let i = 0; i < battle_linkers.length; i++) {
                if(battle_linkers[i]) {
                    if(battle_linkers[i].being_attacked_id === parseInt(data.object.id) && battle_linkers[i].being_attacked_type === 'object') {
                        delete battle_linkers[i];
                    }

                    // Could have already removed it before this check
                    if(battle_linkers[i] && battle_linkers[i].attacking_id === parseInt(data.object.id) && battle_linkers[i].attacking_type === 'object') {
                        delete battle_linkers[i];
                    }
                }

            }

            return;

        }



        if(!data.object) {
            console.log("Received object info without data.object");
            return false;
        }

        let object_index = objects.findIndex(function(obj) { return obj && obj.id === parseInt(data.object.id); });
        let object_info;

        // add it
        if(object_index === -1) {
            //console.log("Don't have this object yet");

            object_index = objects.push(data.object) - 1;
            objects[object_index].id = parseInt(objects[object_index].id);
            object_info = getObjectInfo(object_index);

            // Our body!
            if(client_player_id && players[client_player_index] && objects[object_index].id === players[client_player_index].body_id) {
                //console.log("Received our body object. Attempting to create and place our sprite");
                createPlayerSprite(client_player_index);
                if(players[client_player_index].sprite) {
                    //console.log("We have a sprite now");
                    client_player_info = getPlayerInfo(client_player_index);
                    if(client_player_info.coord) {
                        players[client_player_index].sprite.x = client_player_info.coord.tile_x * tile_size + tile_size / 2;
                        players[client_player_index].sprite.y = client_player_info.coord.tile_y * tile_size + tile_size / 2;
                        camera.startFollow(players[client_player_index].sprite);
                    } else {
                        console.log("Don't have the coord our player is at yet");

                        /*
                        if(current_view === 'planet') {
                            socket.emit('request_planet_coord_info')
                        } else if(current_view === 'ship') {

                        }
                        */
                    }
                }
                generateInventoryDisplay();
            }

            // Our ship - galaxy view!
            if(client_player_id && players[client_player_index] && objects[object_index].id === players[client_player_index].ship_id && current_view === 'galaxy') {
                console.log("Have our ship object. Attempting to create and place our sprite");
                createPlayerSprite(client_player_index);
                if(players[client_player_index].sprite) {
                    client_player_info = getPlayerInfo(client_player_index);
                    if(client_player_info.coord) {
                        players[client_player_index].sprite.x = client_player_info.coord.tile_x * tile_size + tile_size / 2;
                        players[client_player_index].sprite.y = client_player_info.coord.tile_y * tile_size + tile_size / 2;
                    } else {
                        console.log("Don't have galaxy coord our player is on yet");
                    }
                }

                generatePlayerInfoDisplay();
            }

            // Our ship - ship view!
            if(client_player_id && objects[object_index].id === players[client_player_index].ship_id && current_view === 'ship') {
                generateAirlockDisplay();
            }



            // It's also possible that the object was the body or the ship of another player
            players.forEach(function(player, i) {
               if(player.id === client_player_id) {
                   return false;
               }

               if(player.body_id === objects[object_index].id || player.ship_id === objects[object_index].id) {
                   createPlayerSprite(i);
                   let player_info = getPlayerInfo(i);
                   if(player_info.coord && player.sprite) {
                       player.sprite.x = player_info.coord.tile_x * tile_size + tile_size / 2;
                       player.sprite.y = player_info.coord.tile_y * tile_size + tile_size / 2;
                   }

               }
            });


            // If we have an inventory item with this object id, we need to re-generate the inventory display
            let inventory_index = inventory_items.findIndex(function(obj) { return obj && obj.object_id === objects[object_index].id; });
            if(inventory_index !== -1) {
                generateInventoryDisplay();
            }

            // If it's our ship, we update our management ship display
            let object_type_index = object_types.findIndex(function(obj) { return obj && obj.id === objects[object_index].object_type_id; });

            if(objects[object_index].player_id === client_player_id && object_types[object_type_index].is_ship) {
                generateShipManagementDisplay();
            }

            // If our view is a ship, and the new ship is docked at the same ship we are on
            if(object_types[object_type_index].is_ship && objects[object_index].docked_at_object_id && current_view === 'ship' &&
                objects[object_index].docked_at_object_id === client_player_info.coord.ship_id) {
                generateAirlockDisplay();
            }

            // If it's an object associated with a coord in our curent view, redraw that coord
            if(current_view === "galaxy" && objects[object_index].coord_id) {

                let coord_index = coords.findIndex(function(obj) { return obj && obj.id === objects[object_index].coord_id; });
                if(coord_index !== -1) {
                    drawCoord('galaxy', coords[coord_index]);
                }

            } else if(current_view === "ship" && objects[object_index].ship_coord_id) {

                let player_ship_coord_index = ship_coords.findIndex(function(obj) {
                    return obj && obj.id === players[client_player_index].ship_coord_id; });
                let object_ship_coord_index = ship_coords.findIndex(function(obj) {
                    return obj && obj.id === objects[object_index].ship_coord_id; });

                if(player_ship_coord_index !== -1 && object_ship_coord_index !== -1 &&
                    shouldDraw(ship_coords[player_ship_coord_index], ship_coords[object_ship_coord_index], 'on object_info')) {

                    drawCoord('ship', ship_coords[object_ship_coord_index]);
                }
            } else if(current_view === 'planet' && objects[object_index].planet_coord_id) {

                let player_planet_coord_index = planet_coords.findIndex(function(obj) {
                    return obj && obj.id === players[client_player_index].planet_coord_id; });
                let object_planet_coord_index = planet_coords.findIndex(function(obj) {
                    return obj && obj.id === objects[object_index].planet_coord_id; });

                if(player_planet_coord_index !== -1 && object_planet_coord_index !== -1 &&
                    shouldDraw(planet_coords[player_planet_coord_index], planet_coords[object_planet_coord_index])) {

                    drawCoord('planet', planet_coords[object_planet_coord_index]);
                }
            }

            else {
                //console.log("Got object info id: " + objects[object_index].id + ". Our current view is: " + current_view +
                //    " and the object's coord_id: " + objects[object_index].coord_id);
            }


            // If there's a tint, set that
            if(objects[object_index].tint) {

                let object_tile = map.getTileAt(object_info.coord.tile_x, object_info.coord.tile_y, false, 'layer_object');

                if(object_tile) {
                    object_tile.tint = objects[object_index].tint;
                }

            }

            // If there's a name, show that
            if(objects[object_index].name) {

                // Make sure the object doesn't match a current player body or ship
                let player_using_index = players.findIndex(function(obj) { return obj &&
                    (obj.body_id === objects[object_index].id || obj.ship_id === objects[object_index].id);  });

                if(player_using_index === -1) {
                    //console.log("Object has name, and is not an active body/ship. Setting that");
                    if(!objects[object_index].name_text) {
                        let scene_game = game.scene.getScene('sceneGame');

                        objects[object_index].name_text = scene_game.add.text(tileToPixel(object_info.coord.tile_x) - 18,
                            tileToPixel(object_info.coord.tile_y) - 14, objects[object_index].name, {
                                fontSize: 14,
                                padding: { x: 10, y: 5},
                                stroke: '#000000',
                                strokeThickness: 3,
                                fill: '#ffffff'});
                        objects[object_index].name_text.setDepth(11);


                    }
                }

            }

        }
        // Already have the object - don't have to insert, just update
        else {

            object_info = getObjectInfo(object_index);
            //console.log("Already have this object");
            // Looking for differences between the previous state of the object, and the current state that we just received.

            // An AI change - push the info to global!
            if( (data.object.ai_id || objects[object_index].ai_id) && parseInt(data.object.ai_id) !== parseInt(objects[object_index].ai_id)) {

                let global_message = "";

                // New AI
                if(data.object.ai_id) {
                    global_message = "An AI was built on a ship!";
                } else {
                    global_message = "An AI was destroyed on a ship!";
                }

                $('#chat_global').append($('<p>').text(global_message));


                if(!$("#chat_global").is(":visible")) {
                    unread_global_messages = unread_global_messages + 1;

                    $('#chatswitch_global').text("Global (" + unread_global_messages + ")");
                    console.log("Chat global is not visible");
                } else {
                    $('#chat_global').scrollTop = $('#chat_global').scrollHeight;
                    //console.log("Scrolled chat_global. scrollHeight: " + $('#chat_global').scrollHeight);
                }

            }

            if(data.object.is_active !== objects[object_index].is_active && !data.object.is_active) {
                let animation_index = animations.findIndex(function(obj) { return obj && obj.object_id === objects[object_index].id; });
                if(animation_index !== -1) {
                    delete animations[animation_index];
                }
            }

            let update_ship_management_display = false;
            // Name change - only case this matters right now is for if a client ship is renamed
            if(data.object.name !== objects[object_index].name && data.object.player_id === client_player_id) {
                console.log("We have a new name for an object that belongs to us");
                let object_type_index = object_types.findIndex(function(obj) { return obj &&
                    obj.id === objects[object_index].object_type_id; });

                if(object_types[object_type_index].is_ship) {
                    console.log("This was a ship. Going to regenerate the shipManagementDisplay");
                    update_ship_management_display = true;

                }
            }

            let redraw_object = false;
            let redraw_bars = false;

            // Player id change
            if(parseInt(data.object.player_id) !== parseInt(objects[object_index].player_id)) {
                //console.log("Player id on object has changed");

                redraw_object = true;
                // if this object has a coord that matches our view, and we should draw it, draw it!!!

            }

            if(parseInt(data.object.current_hp) !== parseInt(objects[object_index].current_hp)) {
                //console.log("Player id on object has changed");

                redraw_bars = true;

            }

            if(!Object.is(parseInt(objects[object_index].docked_at_planet_id), parseInt(data.object.docked_at_planet_id))) {
            //if(parseInt(objects[object_index].docked_at_planet_id) !== parseInt(data.object.docked_at_planet_id)) {
                if(objects[object_index].id === players[client_player_index].ship_id) {
                    console.log("Got docked_at_planet_id change for the player's ship");
                }

                console.log(parseInt(objects[object_index].docked_at_planet_id));
                console.log(parseInt(data.object.docked_at_planet_id));
                generateSpaceportDisplay();
            }


            // If there's a tint, set that
            if(data.object.tint && data.object.tint !== objects[object_index].tint) {
                console.log("Object has tint change. Setting tint");
                let object_tile = map.getTileAt(object_info.coord.tile_x, object_info.coord.tile_y, false, 'layer_object');

                if(object_tile) {
                    object_tile.tint = data.object.tint;
                }

            }

            // If there's a name, show that
            if(data.object.name && data.object.name !== objects[object_index].name) {
                console.log("Object has name change. Setting that");

                // The name could be removed
                if(data.object.name.length === 0) {
                    if(objects[object_index].name_text) {
                        objects[object_index].name_text.destroy();
                    }
                }
                if(!objects[object_index].name_text) {
                    let scene_game = game.scene.getScene('sceneGame');

                    objects[object_index].name_text = scene_game.add.text(tileToPixel(object_info.coord.tile_x) - 18,
                        tileToPixel(object_info.coord.tile_y) - 14, objects[object_index].name, {
                            fontSize: 14,
                            padding: { x: 10, y: 5},
                            stroke: '#000000',
                            strokeThickness: 3,
                            fill: '#ffffff'});

                    objects[object_index].name_text.setDepth(11);


                } else {
                    objects[object_index].name_text.setText(data.object.name);
                }
            }



            /*************************** AT THIS POINT IN THE FUNCTION WE LOSE KNOWING DIFFERENCES BETWEEN OLD AND NEW *********************/
            // We have to specifically change things, since objects could have name next associated with them.
            objects[object_index].name = data.object.name;
            objects[object_index].planet_coord_id = parseInt(data.object.planet_coord_id);
            objects[object_index].has_spawned_object = data.object.has_spawned_object;
            objects[object_index].planet_id = parseInt(data.object.planet_id);
            objects[object_index].current_hp = parseInt(data.object.current_hp);
            objects[object_index].has_inventory = data.object.has_inventory;
            objects[object_index].player_id = data.object.player_id;
            objects[object_index].energy = parseInt(data.object.energy);
            objects[object_index].faction_id = parseInt(data.object.faction_id);
            objects[object_index].ship_coord_id = parseInt(data.object.ship_coord_id);
            objects[object_index].npc_id = parseInt(data.object.npc_id);
            objects[object_index].coord_id = parseInt(data.object.coord_id);
            objects[object_index].spawned_object_type_amount = parseInt(data.object.spawned_object_type_amount);
            objects[object_index].is_active = data.object.is_active;
            objects[object_index].ship_id = parseInt(data.object.ship_id);
            objects[object_index].ai_id = parseInt(data.object.ai_id);
            objects[object_index].attached_to_id = parseInt(data.object.attached_to_id);
            objects[object_index].spawned_event_id = parseInt(data.object.spawned_event_id);
            objects[object_index].docked_at_planet_id = parseInt(data.object.docked_at_planet_id);
            objects[object_index].docked_at_object_id = parseInt(data.object.docked_at_object_id);
            objects[object_index].tint = data.object.tint;
            //objects[object_index] = data.object;

            if(update_ship_management_display) {
                generateShipManagementDisplay();
            }

            if(redraw_object === true) {

                //console.log("Redrawing coord with that object on it");

                if(objects[object_index].coord_id && current_view === 'galaxy') {
                    let object_coord_index = coords.findIndex(function(obj) { return obj &&
                        obj.id === objects[object_index].coord_id; });

                    client_player_info = getPlayerInfo(client_player_index);
                    if(object_coord_index !== -1 && shouldDraw(client_player_info.coord, coords[object_coord_index])) {
                        drawCoord('galaxy', coords[object_coord_index]);
                    }
                }else if(objects[object_index].planet_coord_id && current_view === 'planet') {
                    let object_coord_index = planet_coords.findIndex(function(obj) { return obj &&
                        obj.id === objects[object_index].planet_coord_id; });

                    client_player_info = getPlayerInfo(client_player_index);
                    if(object_coord_index !== -1 && shouldDraw(client_player_info.coord, planet_coords[object_coord_index])) {
                        drawCoord('planet', planet_coords[object_coord_index]);
                    }
                } else if(objects[object_index].ship_coord_id && current_view === 'ship') {
                    let object_coord_index = ship_coords.findIndex(function(obj) { return obj &&
                        obj.id === objects[object_index].ship_coord_id; });

                    client_player_info = getPlayerInfo(client_player_index);
                    if(object_coord_index !== -1 && shouldDraw(client_player_info.coord, ship_coords[object_coord_index])) {
                        drawCoord('ship', ship_coords[object_coord_index]);
                    }
                }
            }

            if(redraw_bars === true) {
                redrawBars();
            }

            // if we don't have the player that owns this object - lets get some basic info about them
            if(objects[object_index].player_id && objects[object_index].player_id !== player_id) {

                let other_player_index = players.findIndex(function (obj) { return obj && obj.id === objects[object_index].player_id; });

                if(other_player_index === -1) {
                    console.log("Object has player not in our other_players. Requesting their info");
                    socket.emit('request_player_info', { 'player_id': objects[object_index].player_id });
                }
            }

            // Updated info for the player's ship
            if(client_player_id && objects[object_index].id === players[client_player_index].ship_id && current_view === 'galaxy') {
                generatePlayerInfoDisplay();
            }






        }

        if(objects[object_index].is_active) {


            if(client_player_id && objects[object_index].id === players[client_player_index].ship_id) {

            } else {
                animateObject(objects[object_index]);
            }

        }

        // We only add the object if it's not our ship
        // TODO or another player's active ship
        if(client_player_index !== -1 && objects[object_index].id !== players[client_player_index].ship_id) {
            mapAddObject(objects[object_index]);
        }


        /*
        if(objects[object_index].object_type_id === 72) {
            //console.log("Got object that is AI!");

            if(objects[object_index].player_id === player_id) {
                generateAiRuleDisplay();
            }
        }
        */


    });

    socket.on('object_type_equipment_linker_info', function(data) {

        //console.log("Got race eating linker info");

        let object_type_equipment_linker_index = object_type_equipment_linkers.findIndex(function(obj) { return obj && obj.id === parseInt(data.object_type_equipment_linker.id); });

        if(object_type_equipment_linker_index === -1) {
            object_type_equipment_linker_index = object_type_equipment_linkers.push(data.object_type_equipment_linker) - 1;

            object_type_equipment_linkers[object_type_equipment_linker_index].id = parseInt(object_type_equipment_linkers[object_type_equipment_linker_index].id);

            //console.log("Added race eating linker. race_id: " + race_eating_linkers[race_eating_linker_index].race_id +
            //    " object type id: " + race_eating_linkers[race_eating_linker_index].object_type_id);
        }
    });


    socket.on('object_type_info', function(data) {

        let object_type_index = object_types.findIndex(function(obj) { return obj && obj.id === parseInt(data.object_type.id); });

        if(object_type_index === -1) {
            object_type_index = object_types.push(data.object_type) - 1;
            object_types[object_type_index].id = parseInt(object_types[object_type_index].id);
        }

        /* SHOULD NOT KEEP THIS HERE ITS INEFFICIENT */
        // lets populate our build/assemble tab
        $('#can_assemble_list').empty();

        //console.log("At object_types adding to assemble part");
        printAssemblyList();

    });

    socket.on('object_type_display_linker_info', function(data) {

        let object_type_display_linker_index = object_type_display_linkers.findIndex(function(obj) {
            return obj && obj.id === parseInt(data.object_type_display_linker.id); });

        if(object_type_display_linker_index === -1) {
            object_type_display_linkers.push(data.object_type_display_linker);
        }
    });

    socket.on('planet_coord_info', function (data) {



        let player_index = players.findIndex(function(obj) { return obj && obj.id === player_id; });
        let player_info;
        if(player_index !== -1) {
            player_info = getPlayerInfo(player_index);
        }


        if(!data.planet_coord) {
            console.log("%c planet_coord_info without planet coord", log_warning);
            return false;
        }

        let draw_coord = true;


        // If we don't have the planet coord, add it
        let coord_index = planet_coords.findIndex(function(obj) { return obj && obj.id === parseInt(data.planet_coord.id); });
        if(coord_index === -1) {

            coord_index = planet_coords.push(data.planet_coord) - 1;

            if(player_index === -1 || shouldDraw(player_info.coord, planet_coords[coord_index], 'planet_coord_info')) {
                //console.log("Didn't have planet coord id: " + planet_coords[coord_index].id + " x,y: " +
                //    planet_coords[coord_index].tile_x + "," + planet_coords[coord_index].tile_y + ". Adding and drawing");
                drawCoord('planet', planet_coords[coord_index]);
            } else {
                //console.log("Didn't have planet coord id: " + planet_coords[coord_index].id + " x,y: " +
                //    planet_coords[coord_index].tile_x + "," + planet_coords[coord_index].tile_y + ". Adding. NOT drawing");
            }

            // If we are just adding the coord where our player is at, snap them to it
            if(planet_coords[coord_index].player_id === client_player_id) {
                console.log("Would maybe insta move player now");

                if(spaceport_display_needs_regeneration) {

                    spaceport_display_needs_regeneration = false;
                    generateSpaceportDisplay();

                }
            }


        } else {

            // if the planet coord changed its floor type - we could possibly have an animation to remove
            // do this before we draw the updated data
            if(data.planet_coord.floor_type_id !== planet_coords[coord_index].floor_type_id) {
                let old_floor_type_index = floor_types.findIndex(function(obj) { return obj && obj.id === planet_coords[coord_index].floor_type_id; });

                if(old_floor_type_index !== -1) {
                    if(floor_types[old_floor_type_index].is_animated) {
                        let animation_index = animations.findIndex(function(obj) { return obj && obj.planet_coord_id === planet_coords[coord_index].id; });
                        if(animation_index !== -1) {
                            delete animations[animation_index];
                        }
                    }
                }
            }


            // Only want to draw coords we should draw
            if(player_index === -1 || shouldDraw(player_info.coord, planet_coords[coord_index], 'planet_coord_info')) {

                // So we'll be receiving planet coord info for planet coords off our screen when monsters move around on them
                // So I'm testing just always drawing the coord here. Otherwise we could do an additional check to see if there
                // is nothing on the floor layer, and draw based on that or changes.

                drawCoord('planet', data.planet_coord);

                /*
                if(planet_coords[coord_index].monster_id !== data.planet_coord.monster_id) {
                    //console.log("Drawing coord because monster id: " + data.planet_coord.monster_id + " moved");
                    drawCoord('planet', data.planet_coord);
                } else if(planet_coords[coord_index].object_id !== data.planet_coord.object_id ||
                    planet_coords[coord_index].belongs_to_object_id !== data.planet_coord.belongs_to_object_id) {

                    drawCoord('planet', data.planet_coord);
                } else if(planet_coords[coord_index].object_type_id !== data.planet_coord.object_type_id) {

                    drawCoord('planet', data.planet_coord);
                }

                if(planet_coords[coord_index].floor_type_id !== data.planet_coord.floor_type_id) {
                    //console.log(coords[coord_index].floor_type_id + " doesn't match " + data.coord.floor_type_id + " redrawing coord");
                    drawCoord('planet', data.planet_coord);
                }
                */
            }


            planet_coords[coord_index] = data.planet_coord;

        }


        if(planet_coords[coord_index].player_id === player_id && map_needs_redraw) {
            console.log("looks like we now have the planet coord the player is on - redrawing map");
            redrawMap();
        }

        if(planet_coords[coord_index].npc_id) {

            let npc_index = npcs.findIndex(function(obj) { return obj && obj.id === parseInt(planet_coords[coord_index].npc_id); });
            if(npc_index === -1) {
                console.log("We don't have this npc. Requesting it");
                socket.emit('request_npc_info', { 'npc_id': planet_coords[coord_index].npc_id });
            }
        }

        // In the case that we got the monster info before we got the coord the monster was on
        // we want to now show the monster since we have complete information
        if(planet_coords[coord_index].monster_id) {
            let monster_index = getMonsterIndex(planet_coords[coord_index].monster_id);
            if(monster_index !== -1) {
                let monster_info = getMonsterInfo(monster_index);

                if(shouldDraw(client_player_info.coord, monster_info.coord, "monster_info")) {
                    createMonsterSprite(monster_index);
                } else {
                    console.log("Not drawing monster");
                }
            }
        }


    });

    socket.on('planet_info', function(data) {

        if(!data.planet) {
            console.log("%c Received planet_info without planet", log_warning);
            return false;
        }

        let planet_id = parseInt(data.planet.id);
        //console.log("Have planet_info_data for planet id: " + data.id);
        let planet_index = planets.findIndex(function(obj) { return obj && obj.id === planet_id });

        if(planet_index === -1) {
            planet_index = planets.push(data.planet) - 1;

            // We also might have belongs_belongs_to_planet_id coords that could use a redraw
            let belongs_to_coords = coords.filter(coord => coord.belongs_to_planet_id === planets[planet_index].id);

            if(belongs_to_coords.length > 0) {
                belongs_to_coords.forEach(function(coord) {
                    drawCoord('galaxy', coord);
                });
            }

        } else {
            planets[planet_index] = data.planet;
        }

        // Lets redraw the coord where the planet is at
        let coord_index = coords.findIndex(function(obj) { return obj && obj.planet_id === planets[planet_index].id; });
        if(coord_index !== -1) {
            //console.log("Redrawing coord since we have updated planet information");
            drawCoord('galaxy', coords[coord_index]);
        }



    });

    socket.on('planet_type_info', function(data) {

        let planet_type_index = planet_types.findIndex(function(obj) { return obj && obj.id === parseInt(data.planet_type.id); });

        if(planet_type_index === -1) {
            planet_types.push(data.planet_type);
        }
    });

    socket.on('planet_type_display_linker_info', function(data) {

        let planet_type_display_linker_index = planet_type_display_linkers.findIndex(function(obj) {
            return obj && obj.id === parseInt(data.planet_type_display_linker.id); });

        if(planet_type_display_linker_index === -1) {
            planet_type_display_linkers.push(data.planet_type_display_linker);
        }
    });

    socket.on('player_count_info', function(data) {
       $('#players_connected').empty();
       $('#players_connected').append(data.player_count + " Players Connected");
    });

    socket.on('player_info', function(data) {

        if(!data.player) {
            console.log("%c Received player info without a player", log_warning);
            return false;
        }

        //console.log("Got player info for player id: " + data.player.id);

        let redraw_map = false;

        //console.log("Got player info data for player_id: " + data.player.id);

        let player_index = players.findIndex(function(obj) { return obj && obj.id === parseInt(data.player.id); });
        // If it's a player we should draw, we add a player sprite
        let player_info;
        client_player_info = getPlayerInfo(client_player_index);

        if(player_index === -1) {
            player_index = players.push(data.player) - 1;
            player_info = getPlayerInfo(player_index);

            addPlayer(player_index, player_info);


        }
        // Updated player info
        else {

            if(client_player_id && data.player.id === client_player_id) {
                //console.log("Calling updatePlayerClient");
                updatePlayerClient(data);
            } else {
                //console.log("Calling updatePlayer");
                updatePlayer(data, player_index);
            }


            // with a player we need to selectively add new values since there will be some client side
            // manipulation of some values
            let needs_redraw = false;
            if(parseInt(players[player_index].current_hp) !== parseInt(data.player.current_hp) && players[player_index].sprite) {
                console.log("Redrawing bars due to player hp change");
                needs_redraw = true;

            }

            players[player_index].current_hp = data.player.current_hp;
            players[player_index].max_hp = data.player.max_hp;


            let update_spaceport_display = false;
            if(client_player_id && data.player.id === client_player_id && current_view === 'planet') {

                if(players[client_player_index].planet_coord_id !== data.player.planet_coord_id) {
                    update_spaceport_display = true;
                }

            }

            players[player_index].planet_coord_id = data.player.planet_coord_id;

            let moved_on_ship = false;
            if(!Object.is(parseInt(players[player_index].ship_coord_id), parseInt(data.player.ship_coord_id))) {
                console.log("moved on ship." + parseInt(players[player_index].ship_coord_id) + "!== " + parseInt(data.player.ship_coord_id));
                moved_on_ship = true;
            }

            players[player_index].ship_coord_id = data.player.ship_coord_id;

            if(moved_on_ship) {
                generateAirlockDisplay();
            }


            players[player_index].coord_id = data.player.coord_id;
            players[player_index].planet_id = data.player.planet_id;

            // Player has switched bodies
            if(players[player_index].body_id !== parseInt(data.player.body_id)) {
                // Doesn't look like this is called if it's our client player - this stuff is already done
                // By the time we reach this point with client player. Haven't tested with non-client players
                players[player_index].body_id = data.player.body_id;
                //showPlayer(players[player_index]);
                generateInventoryDisplay();
                setPlayerMoveDelay(player_index);


            }


            // Player has switched ships
            if(players[player_index].ship_id !== parseInt(data.player.ship_id)) {


                players[player_index].ship_id = data.player.ship_id;

                if(parseInt(data.player.id) === client_player_id) {
                    console.log("WE have a new ship!!");
                    update_spaceport_display = true;
                }
                setPlayerMoveDelay(player_index);

                //showPlayer(players[player_index]);
            }



            players[player_index].name = data.player.name;
            players[player_index].exp = data.player.exp;

            if(players[player_index].faction_id !== data.player.faction_id) {
                players[player_index].faction_id = data.player.faction_id;
                generateFactionDisplay();
            }


            players[player_index].level = data.player.level;
            players[player_index].energy = data.player.energy;
            players[player_index].cooking_skill_points = data.player.cooking_skill_points;
            players[player_index].defending_skill_points = data.player.defending_skill_points;
            players[player_index].farming_skill_points = data.player.farming_skill_points;
            players[player_index].hacking_skill_poitns = data.player.hacking_skill_points;
            players[player_index].melee_skill_points = data.player.melee_skill_points;
            players[player_index].laser_skill_points = data.player.laser_skill_points;
            //console.log("Got updated laser skill points as: " + data.player.laser_skill_points);
            players[player_index].manufacturing_skill_points = data.player.manufacturing_skill_points;
            players[player_index].mining_skill_points = data.player.mining_skill_points;
            players[player_index].plasma_skill_points = data.player.plasma_skill_points;
            players[player_index].repairing_skill_points = data.player.repairing_skill_points;
            players[player_index].researching_skill_points = data.player.researching_skill_points;


            // If the old level doesn't match the new level, let the player know they LEVELED UP!!!!!
            if(data.player.salvaging_skill_points !== players[player_index].salvaging_skill_points) {

                let old_level = 1 + Math.floor(level_modifier * Math.sqrt(players[player_index].salvaging_skill_points));
                let new_level = 1 + Math.floor(level_modifier * Math.sqrt(data.player.salvaging_skill_points));

                if(new_level !== old_level) {

                    // level up text!
                    text_important.setText("Salvaging Has Leveled Up!");
                    text_important.setVisible(true);
                    text_important_time = our_time;

                    // Lets add a system message too for permanence!
                    $('#chat_system').append($('<p>').text(data.message));


                    if(!$("#chat_system").is(":visible")) {
                        unread_system_messages = unread_system_messages + 1;

                        $('#chatswitch_system').text("System (" + unread_system_messages + ")");
                        //console.log("Chat system is not visible");
                    } else {

                        let out = document.getElementById("chat_system");

                        out.scrollTop = out.scrollHeight - out.clientHeight;

                        //console.log("Scrolled chat_system. scrollTop: " + out.scrollTop);
                    }

                }
            }

            players[player_index].salvaging_skill_points = data.player.salvaging_skill_points;
            players[player_index].surgery_skill_points = data.player.surgery_skill_points;



            // Lets make sure some of our common player values are ints
            players[player_index].body_id = parseInt(players[player_index].body_id);
            players[player_index].coord_id = parseInt(players[player_index].coord_id);
            players[player_index].planet_coord_id = parseInt(players[player_index].planet_coord_id);
            players[player_index].ship_id = parseInt(players[player_index].ship_id);
            players[player_index].ship_coord_id = parseInt(players[player_index].ship_coord_id);

            // Make sure our client player info is updated
            if(client_player_id === data.player.id) {
                client_player_info = getPlayerInfo(client_player_index);
            }

            if(update_spaceport_display) {
                if(current_view === 'planet') {
                    generateSpaceportDisplay();
                } else if(current_view === 'ship') {
                    console.log("Generating airlock display again");
                    generateAirlockDisplay();
                }

            }

            // lets populate all our extra details
            if(players[player_index].id === client_player_id) {
                //console.log("Generating Player Details");
                generatePlayerInfoDisplay();
                generateFactionDisplay(client_player_id);


            }


            if(needs_redraw) {
                redrawBars();
            }
            //showPlayer(players[player_index]);
        }



    });

    socket.on('player_relationship_linker_info', function(data) {
        //console.log("Got player_relationship_linker_info");


        let player_relationship_linker_index = player_relationship_linkers.findIndex(function(obj) { return obj && obj.id === parseInt(data.player_relationship_linker.id); });

        if(player_relationship_linker_index === -1) {

            player_relationship_linkers.push(data.player_relationship_linker);

        } else {

            player_relationship_linkers[player_relationship_linker_index] = data.player_relationship_linker;
        }


        generateRelationshipDisplay();

    });

    socket.on('player_research_linker_info', function(data) {
        //console.log("Got player_research_linker_info");


        let player_research_linker_index = player_research_linkers.findIndex(function(obj) { return obj && obj.id === parseInt(data.player_research_linker.id); });

        if(player_research_linker_index === -1) {

            player_research_linkers.push(data.player_research_linker);

        } else {

            player_research_linkers[player_research_linker_index] = data.player_research_linker;
        }


        generateResearchDisplay();
        //generateDiscoveryDisplay();

    });

    socket.on('pong_client', function(data) {
        let latency = Date.now() - start_ping_time;
        $("#ping").empty();
        $("#ping").append("Server ping: " + latency);
    });

    socket.on('race_info', function(data) {

        let race_index = races.findIndex(function(obj) { return obj && obj.id === parseInt(data.race.id); });

        if(race_index === -1) {
            race_index = races.push(data.race) - 1;

            races[race_index].id = parseInt(races[race_index].id);

        }
    });

    socket.on('race_eating_linker_info', function(data) {

        //console.log("Got race eating linker info");

        let race_eating_linker_index = race_eating_linkers.findIndex(function(obj) { return obj && obj.id === parseInt(data.race_eating_linker.id); });

        if(race_eating_linker_index === -1) {
            race_eating_linker_index = race_eating_linkers.push(data.race_eating_linker) - 1;

            race_eating_linkers[race_eating_linker_index].id = parseInt(race_eating_linkers[race_eating_linker_index].id);

            //console.log("Added race eating linker. race_id: " + race_eating_linkers[race_eating_linker_index].race_id +
            //    " object type id: " + race_eating_linkers[race_eating_linker_index].object_type_id);
        }
    });

    socket.on('repair_info', function(data) {

        console.log("Got repair info for repair id: " + data.repairing_linker_id);

        let repairing_linker_index = repairing_linkers.findIndex(function(obj) { return obj && obj.id === data.repairing_linker_id; });

        if(repairing_linker_index === -1) {
            console.log("Could not find repairing linker with that ID: " + data.repairing_linker_id);
            return false;

        }


        let drawing_x = -1000;
        let drawing_y = -1000;
        let ship_coord_index = -1;
        let planet_coord_index = -1;

        // Add an info number
        let info_number_data = {
            'damage_amount': data.repaired_amount, 'damage_type': 'hp', 'damage_source_type': 'repairing',
            'attacker_type': 'player',
            'attacker_id': repairing_linkers[repairing_linker_index].player_id };


        if(repairing_linkers[repairing_linker_index].ship_coord_id) {

            console.log("Repair is happening on ship coord");
            ship_coord_index = ship_coords.findIndex(function(obj) { return obj && obj.id === repairing_linkers[repairing_linker_index].ship_coord_id; });


            // The user could be back in the galaxy view while the player is repairing
            if(ship_coord_index === -1) {

                // We can draw it on our ship
                if(current_view === 'galaxy') {
                    let ship_index = objects.findIndex(function(obj) { return obj && obj.id === players[client_player_index].ship_id; });
                    let coord_index = coords.findIndex(function(obj) { return obj && obj.id === objects[ship_index].coord_id; });
                    if(coord_index !== -1) {
                        drawing_x = tileToPixel(coords[coord_index].tile_x);
                        drawing_y = tileToPixel(coords[coord_index].tile_y);
                    }
                }

                console.log("Could not find ship coord id: " + repairing_linkers[repairing_linker_index].ship_coord_id);
                return false;
            } else {
                drawing_x = tileToPixel(ship_coords[ship_coord_index].tile_x);
                drawing_y = tileToPixel(ship_coords[ship_coord_index].tile_y);
            }

            info_number_data.defender_type = 'ship_coord';
            info_number_data.defender_id = ship_coords[ship_coord_index].id;
        } else if(repairing_linkers[repairing_linker_index].planet_coord_id) {
            planet_coord_index = planet_coords.findIndex(function(obj) { return obj && obj.id === repairing_linkers[repairing_linker_index].planet_coord_id; });

            if(planet_coord_index !== -1) {
                drawing_x = tileToPixel(planet_coords[planet_coord_index].tile_x);
                drawing_y = tileToPixel(planet_coords[planet_coord_index].tile_y);
                console.log("Repairing linker has planet_coord_id. Set drawing_x,drawing_y: " + drawing_x + "," + drawing_y);
                info_number_data.defender_type = 'planet_coord';
                info_number_data.defender_id = planet_coords[planet_coord_index].id;
            }
        }


        if(drawing_x === -1000) {
            return false;
        }

        info_number_data.drawing_x = drawing_x;
        info_number_data.drawing_y = drawing_y;


        addEffect({ 'x': drawing_x, 'y': drawing_y, 'damage_types': ['repairing']});
        addInfoNumber({'damage_amount': data.repaired_amount, 'x': drawing_x, 'y': drawing_y, 'damage_types': ['repairing']});

        //addInfoNumber(info_number_data);

        console.log("Added info number");
    });

    // Mostly to keep track that we are repairing something. Actual repair data comes in from repair_info
    socket.on('repairing_linker_info', function(data) {
        //console.log("Got repairing_linker_info");

        let index = repairing_linkers.findIndex(function(obj) {
            return obj && obj.id === data.repairing_linker.id; });

        if(data.remove && index !== -1) {
            delete repairing_linkers[index];
            console.log("Removed repairing linker");
            redrawBars();
            return;
        } else if(!data.remove && index === -1) {
            console.log("Pushing repairing linker");
            index = repairing_linkers.push(data.repairing_linker) - 1;
            repairing_linkers[index].player_id = parseInt(repairing_linkers[index].player_id);
            repairing_linkers[index].ship_coord_id = parseInt(repairing_linkers[index].ship_coord_id);

        }
    });

    socket.on('research_info', function(data) {
        //console.log("GOT RESEARCH INFO. Active research.");

        let research = data.research;

        // lets see if we need to add this to our list of active assemblies
        let research_index = researches.findIndex(function (obj) { return obj && obj.id === parseInt(research.id); });

        if(research_index !== -1 && (data.remove || data.finished)) {
            delete researches[research_index];

            redrawBars();
            return;
        }

        if(research_index === -1) {
            research_index = researches.push(research) - 1;
        } else {
            researches[research_index] = data.research;
        }

        researches[research_index].id = parseInt(researches[research_index].id);

        redrawBars();

    });

    socket.on('result_info', function(data) {

        console.log("Got result info");
        let scene_game = game.scene.getScene('sceneGame');

        let base_x = 0;
        let base_y = 0;

        let object_index = -1;


        if(data.object_id) {
            object_index = objects.findIndex(function(obj) { return obj && obj.id === parseInt(data.object_id); });
        }

        // If the result info is associated with an object and we have the object, - we can display it there
        if(object_index !== -1) {

            if(objects[object_index].ship_coord_id) {
                let coord_index = ship_coords.findIndex(function(obj) { return obj && obj.id === objects[object_index].ship_coord_id; });

                if(coord_index === -1) {
                    return false;
                }

                base_x = tileToPixel(ship_coords[coord_index].tile_x);
                base_y = tileToPixel(ship_coords[coord_index].tile_y);

            } else if(objects[object_index].planet_coord_id) {
                let coord_index = planet_coords.findIndex(function(obj) { return obj && obj.id === objects[object_index].planet_coord_id; });

                if(coord_index === -1) {
                    return false;
                }

                base_x = tileToPixel(planet_coords[coord_index].tile_x);
                base_y = tileToPixel(planet_coords[coord_index].tile_y);

            }
        } else {
            base_x = players[client_player_index].sprite.x;
            base_y = players[client_player_index].sprite.y;
        }



        // lets randomize the starting x/y a bit
        let rand_x = getRandomIntInclusive(-32, 32);
        let rand_y = getRandomIntInclusive(0, 32);

        let result_text = 'Success!';
        let fill = '#34f425';

        if(data.status === 'failure') {
            result_text = 'Failure.';
            fill = '#f44242';
        }

        if(data.text) {
            result_text = result_text + " " + data.text;
        }

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

    });



    socket.on('rule_info', function(data) {


        let rule_index = rules.findIndex(function(obj) { return obj && obj.id === parseInt(data.rule.id); });

        if(data.remove && rule_index !== -1) {

            console.log("Removing rule");

            let rule_object_id = rules[rule_index].object_id;
            let rule_object_index = objects.findIndex(function(obj) { return obj && obj.id === rule_object_id; });
            let rule_object_type_index = -1;
            if(rule_object_index !== -1) {
                rule_object_type_index = object_types.findIndex(function(obj) { return obj && obj.id === objects[rule_object_index].object_type_id; });
            }



            delete rules[rule_index];
            //generateAiRuleDisplay();

            if($("#management_object_" + rule_object_id).is(":visible")) {
                console.log("Managing this object is currently visible");

                // AI
                if(rule_object_type_index !== -1 && object_types[rule_object_type_index].id === 72) {
                    generateAiManagementDisplay(rule_object_index);
                } else {
                    generateNonAiManagementDisplay(rule_object_index);
                }

                //generateShipManagementDisplay();
            } else {
                console.log("Managing this object is currently not visible");
            }

            return;

        }

        if(rule_index === -1) {
            rule_index = rules.push(data.rule) - 1;

            // Make sure ints are ints after the long journey from database -> server -> client
            rules[rule_index].id = parseInt(rules[rule_index].id);
            rules[rule_index].object_id = parseInt(rules[rule_index].object_id);

            let rule_object_index = objects.findIndex(function(obj) { return obj && obj.id === rules[rule_index].object_id; });
            let rule_object_type_index = -1;
            if(rule_object_index !== -1) {
                rule_object_type_index = object_types.findIndex(function(obj) { return obj && obj.id === objects[rule_object_index].object_type_id; });
            }

            // if we are currently showing the management screen for the thing involved in this rule, we re-generate the display
            if($("#management_object_" + rules[rule_index].object_id).is(":visible")) {
                console.log("Managing this object is currently visible");
                if(rule_object_type_index !== -1 && object_types[rule_object_type_index].id === 72) {
                    generateAiManagementDisplay(rule_object_index);
                } else {
                    generateNonAiManagementDisplay(rule_object_index);
                }
                // Not sure about generating ship stuff there
                //generateShipManagementDisplay();
            }

        }
    });

    socket.on('salvaging_linker_info', function(data) {

        let index = salvaging_linkers.findIndex(function(obj) {
            return obj && obj.id === data.salvaging_linker.id; });

        if(data.remove && index !== -1) {
            delete salvaging_linkers[index];
            console.log("Removed salvaging linker");
            if(salvaging_beam_sprite) {
                salvaging_beam_sprite.setVisible(false);
            }
            redrawBars();

            return;
        } else if(index === -1) {
            index = salvaging_linkers.push(data.salvaging_linker) - 1;

            console.log("Pushed salvaging linker with id: " + salvaging_linkers[index].id);

        } else {

            let hp_change = salvaging_linkers[index].hp_left - data.salvaging_linker.hp_left;
            salvaging_linkers[index].hp_left = parseInt(data.salvaging_linker.hp_left);

            let object_index = objects.findIndex(function(obj) { return obj && obj.id === salvaging_linkers[index].object_id; });
            let object_info = getObjectInfo(object_index);
            let drawing_x = tileToPixel(object_info.coord.tile_x);
            let drawing_y = tileToPixel(object_info.coord.tile_y);

            //let info_number_data = { 'x': tileToPixel(object_info.coord.tile_x), 'y': tileToPixel(object_info.coord.tile_y),
            //    'damage_amount': hp_change, 'damage_type': 'salvaging',
            //    'defender_type': 'object', 'defender_id': salvaging_linkers[index].object_id, 'attacker_type': 'player',
            //    'attacker_id': salvaging_linkers[index].player_id };

            addEffect({ 'x': drawing_x, 'y': drawing_y, 'damage_types': ['repairing']});
            addInfoNumber({'damage_amount': data.repaired_amount, 'x': drawing_x, 'y': drawing_y, 'damage_types': ['repairing']});

            //addInfoNumber(info_number_data);
            redrawBars();

            if(salvaging_linkers[index].player_id === client_player_id) {
                let scene_game = game.scene.getScene('sceneGame');


                let object_x_beam = tileToPixel(object_info.coord.tile_x) + 32;
                let object_y_beam = tileToPixel(object_info.coord.tile_y) + 32;


                if(salvaging_beam_sprite === false) {
                    console.log("Creating salvaging beam sprite");
                    salvaging_beam_sprite = scene_game.add.sprite(players[client_player_index].sprite.x, players[client_player_index].sprite.y, 'salvaging-beam');
                    salvaging_beam_sprite.object_x = object_x_beam;
                    salvaging_beam_sprite.object_y = object_y_beam;

                    // I think it will be easier if we origin on a side
                    salvaging_beam_sprite.setOrigin(0,.5);
                    // Makes it too dull
                    //mining_beam_sprite.alpha = 0.7;
                } else {
                    salvaging_beam_sprite.object_index = object_index;
                    salvaging_beam_sprite.object_x = object_x_beam;
                    salvaging_beam_sprite.object_y = object_y_beam;
                    salvaging_beam_sprite.x = players[client_player_index].sprite.x;
                    salvaging_beam_sprite.y = players[client_player_index].sprite.y;
                    salvaging_beam_sprite.setVisible(true);
                    console.log("Making salvaging sprite visible");
                }

                salvaging_beam_sprite.anims.play('salvaging-beam');
                let distance = Phaser.Math.Distance.Between(players[client_player_index].sprite.x, players[client_player_index].sprite.y,
                    object_x_beam, object_y_beam);
                let angle_between = Phaser.Math.Angle.Between(players[client_player_index].sprite.x, players[client_player_index].sprite.y,
                    object_x_beam, object_y_beam);

                salvaging_beam_sprite.displayWidth = distance;
                // mining_beam_sprite.rotation = angle_between - 1.4;
                salvaging_beam_sprite.rotation = angle_between;
            }
        }

    });


    socket.on('ship_coord_info', function(data) {

        if(!data.ship_coord) {
            console.log("%c ship_coord_info without ship coord", log_warning);
            return false;
        }

        console.log("Got ship coord info. player id: " + data.ship_coord.player_id);

        let coord_index = ship_coords.findIndex(function(obj) { return obj && obj.id === parseInt(data.ship_coord.id) });

        if(coord_index === -1) {
            console.log("Adding ship coord");
            coord_index = ship_coords.push(data.ship_coord) - 1;
            drawCoord('ship', ship_coords[coord_index]);

            // we just added the coord that the player is on - we should insta center the player there
            if(client_player_index !== -1 && ship_coords[coord_index].player_id === client_player_id) {
                console.log("This coord has our player");

                if(!players[client_player_index].sprite) {
                    console.log("Trying to create our player sprite");
                    createPlayerSprite(client_player_index);
                } else {
                    console.log("Player already has a sprite");
                }

                movePlayerInstant(client_player_index, ship_coords[coord_index].tile_x * tile_size + tile_size / 2, ship_coords[coord_index].tile_y * tile_size + tile_size / 2);

                if(airlock_display_needs_regeneration) {

                    airlock_display_needs_regeneration = false;
                    generateAirlockDisplay();

                }
            }
        } else {

            console.log("Updating ship coord");

            // The coord has changes that we should redraw
            if(ship_coords[coord_index].monster_id !== data.ship_coord.monster_id) {
                drawCoord('ship', data.ship_coord);
            }
            /*
            else if(ship_coords[coord_index].player_id !== data.ship_coord.player_id) {
                //console.log(coords[coord_index].player_id + " doesn't match " + data.coord.player_id + " redrawing coord");
                drawCoord('ship', data.ship_coord);
            }
            */
            else if(ship_coords[coord_index].object_id !== data.ship_coord.object_id ||
                ship_coords[coord_index].belongs_to_object_id !== data.ship_coord.belongs_to_object_id) {
                drawCoord('ship', data.ship_coord);
            }
            else if(ship_coords[coord_index].object_type_id !== data.ship_coord.object_type_id) {
                drawCoord('ship', data.ship_coord);
            }
            else if(ship_coords[coord_index].floor_type_id !== data.ship_coord.floor_type_id) {
                //console.log(coords[coord_index].floor_type_id + " doesn't match " + data.coord.floor_type_id + " redrawing coord");
                drawCoord('ship', data.ship_coord);
            }

            ship_coords[coord_index] = data.ship_coord;

            if(ship_coords[coord_index].player_id === client_player_id) {
                console.log("Got update on coord with our player");
            }

            if(client_player_index !== -1 && !players[client_player_index].sprite && ship_coords[coord_index].player_id === client_player_id) {
                console.log("Found the player!");
                createPlayerSprite(client_player_index);
            }

        }




    });

    socket.on('ship_view_data', function(data) {
        generateAirlockDisplay();
    });



    // I don't think we should be getting this anymore. We should just be getting battle linker info
    // from the server
    socket.on('stop_attack_data', function(data) {

        console.log("Got stop_attack_data monster id: " + data.monster_id);

        if(data.monster_id) {
            let monster_index = monsters.findIndex(function(obj) { return obj && obj.id == data.monster_id; });

            if(monster_index != -1) {
                monsters[monster_index].player_is_attacking = false;
            }
        }


    });


    socket.on('view_change_data', function(data) {

        console.log("Got view change data: " + data.view);


        // we no longer have a destination x/y
        if(client_player_id) {
            players[client_player_index].destination_x = false;
            players[client_player_index].destination_y = false;
            client_move_ship_coord_id = 0;
            client_move_coord_id = 0;
            client_move_planet_coord_id = 0;
            client_move_start_time = 0;
            players[client_player_index].move_start_time = 0;
        }

        next_moves = [];


        // No matter the switch, we need to clear out npc sprites
        npcs.forEach(function(npc) {
            if(npc && npc.sprite) {
                npc.sprite.destroy();
                npc.sprite = false;
            }
        });
        npcs = [];

        if(data.view === 'galaxy') {

            console.log("View change to galaxy!");
            on_planet = false;

            console.log("Emptied launch");
            $('#launch').empty();

            let html_string = "";

            html_string += "<button class='button is-success' id='viewchange' newview='ship'>";
            html_string += "<i class='fad fa-space-shuttle'></i> Ship View</button>";
            $('#launch').append(html_string);

            current_view = 'galaxy';

            battle_linkers = [];
            monsters.forEach(function(monster) {
                if(monster.sprite) {
                    monster.sprite.destroy();
                    monster.sprite = false;
                }
            });
            monsters = [];


            planet_coords = [];

            console.log("Cleared players from client");
            players.forEach(function(player, i) {
                if(player.id !== client_player_id) {
                    if(player.sprite) {
                        player.sprite.destroy();
                    }

                    delete players[i];
                }
            });

            ship_coords = [];


            // player is just the pod
            redrawMap();

        } else if(data.view === 'planet') {

            //console.log("In planet section");
            current_view = 'planet';

            //$('#launch').empty();
            //$('#launch').append('<button class="btn btn-block btn-success" id="viewchange" newview="galaxy">Launch From Planet</button>');

            battle_linkers = [];
            coords = [];
            ship_coords = [];


        } else if(data.view === 'ship') {

            // I think if we are going from galaxy to ship we need to reset all the player sprites anyways
            if(current_view === 'galaxy') {
                console.log("Clearing all player sprites");
                players.forEach(function(player) {
                    if(player.sprite) {
                        player.sprite.destroy();
                        player.destination_x = false;
                        player.destination_y = false;
                    }
                });
            }



            //console.log("%c Changing view to ship. Seeing if the body updates", log_warning);
            current_view = 'ship';

            generateAirlockDisplay();

            // see what body the player has
            let player_index = players.findIndex(function(obj) { return obj && obj.id === player_id; });
            if(player_index !== -1) {

                //showPlayer(players[player_index]);

            }

            coords.splice(0, coords.length);
            //coords = [];
            planet_coords = [];

            // clear any mining and salvaging sprites
            if(mining_beam_sprite) {
                mining_beam_sprite.setVisible(false);
            }

            if(salvaging_beam_sprite) {
                salvaging_beam_sprite.setVisible(false);
            }



        }

        // clear out our researches and assemblies, since they applied on the previous screen
        active_assemblies = [];
        researches = [];

        //console.log("Calling resetMap");
        resetMap();
        //console.log("Calling redrawMap");
        redrawMap();

        setPlayerMoveDelay(client_player_index);

    });


</script>