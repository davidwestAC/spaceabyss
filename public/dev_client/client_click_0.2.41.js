function createArea() {
    console.log("In createArea");
    let new_area_name = $('#create_area_name').val();

    if(new_area_name !== "") {
        console.log("Trying to create new area with name: " + new_area_name);
        socket.emit('create_area_data', { 'new_area_name': new_area_name });
        $('#create_area_name').val("");
    }
}

function objectTint(object_id) {
    console.log("In objectTint");
    let new_object_tint = $("#objectcolor_" + object_id).val();

    console.log("New object tint is: " + new_object_tint);

    socket.emit('object_tint_data', { 'object_id': object_id, 'new_object_tint': new_object_tint });

    $("#objectcolor_" + object_id).val("");
}

function rentToPlayer(area_id) {
    console.log("In rentToPlayer");
    let rent_to_player_name = $("#rent_to_player_name_" + area_id).val();
    let price = $("#price_" + area_id).val();

    if(rent_to_player_name !== "") {
        console.log("Trying to sending direct renting data for area " + area_id + " to player: " + rent_to_player_name);
        socket.emit('rent_area_data', { 'area_id': area_id, 'rent_to_player_name': rent_to_player_name, 'price': price });
        $("#rent_to_player_name_" + area_id).val("");
        $("#price_" + area_id).val("");
    }
}

function submitAutopilotDestination() {
    console.log("In setAutopilotDestination");
    let destination_tile_x = $('#destination_tile_x').val();
    let destination_tile_y = $('#destination_tile_y').val();

    console.log("Sending destination tile x, y: " + destination_tile_x + ", " + destination_tile_y);

    socket.emit('autopilot_destination', { 'destination_tile_x': destination_tile_x, 'destination_tile_y': destination_tile_y });

    $('#click_menu').empty();
    $('#click_menu').hide();
}

function submitChatMessage() {
    
    let message = $('#chat_message').val();
    socket.emit('chat_data', { 'message': message, 'scope': current_chat });
    $('#chat_message').val('');

}

function submitCreateFaction() {
    console.log("In submitCreateFaction");
    let faction_name = $('#faction_name').val();
    console.log("Sending faction name: " + faction_name);
    socket.emit('create_faction_data', { 'name': faction_name });

}

function submitFactionJoin() {
    console.log("In submitFactionJoin");
    let faction_id = $('#factionjoin').val();
    console.log("Sending faction id: " + faction_id);
    socket.emit('faction_join_data', { 'faction_id': faction_id });
}

function submitObjectName(object_id) {
    console.log("In submitObjectName");
    let new_object_name = $('#object_' + object_id + '_name').val();

    if(new_object_name !== "") {
        console.log("Sending id: " + object_id + " name: " + new_object_name);
        socket.emit('object_name_data', { 'object_id': object_id, 'new_object_name': new_object_name });
    }
}

function submitPlanetName(planet_id) {
    console.log("In submitPlanetName");
    let new_planet_name = $('#planet_' + planet_id + '_name').val();

    if(new_planet_name !== "") {
        console.log("Sending id: " + planet_id + " name: " + new_planet_name);
        socket.emit('planet_name_data', { 'planet_id': planet_id, 'new_planet_name': new_planet_name });
    }
}

function submitPriceUpdate(inventory_item_id) {
    console.log("Player is updating the price of an inventory item");
    var new_price = $("#price_" + inventory_item_id).val();

    socket.emit('price_update_data', { 'inventory_item_id': inventory_item_id, 'new_price': new_price });
}



function renameArea(area_id) {
    console.log("In renameArea");
    let new_area_name = $("#areaname_" + area_id).val();

    console.log("New area name is: " + new_area_name);

    socket.emit('area_data', { 'area_id': area_id, 'new_name': new_area_name });

    $("#areaname_" + area_id).val("");
}

function renameObject(object_id) {
    console.log("In renameObject");
    let new_object_name = $("#objectname_" + object_id).val();

    console.log("New object name is: " + new_object_name);

    socket.emit('object_name_data', { 'object_id': object_id, 'new_object_name': new_object_name });

    $("#objectname_" + object_id).val("");
}

function submitBid(area_id) {
    console.log("In submitBid");
    let bid_price = $("#bid_" + area_id).val();

    console.log("Submitting bid price: " + bid_price);

    socket.emit('bid_data', { 'area_id': area_id, 'price': bid_price });


}


function submitRule(object_id) {
    console.log("Calling submitRule");

    let new_rule = $('#' + object_id + "_new_rule").val();

    console.log("Object id: " + object_id + " new rule: " + new_rule);

    if( new_rule !== "") {

        socket.emit('rule_data', { 'object_id': object_id, 'new_rule': new_rule });
    }
}

function submitShipName(ship_id) {
    console.log("In submitShipName");
    let new_ship_name = $('#ship_' + ship_id + '_name').val();

    if(new_ship_name !== "") {
        console.log("Sending id: " + ship_id + " name: " + new_ship_name);
        socket.emit('ship_name_data', { 'ship_id': ship_id, 'new_ship_name': new_ship_name });
        $('#ship_' + ship_id + '_name').val("");
    }
}

$(document).on('click', 'button', function () {
    //console.log("Clicked button");
    var clicked_id = this.id;
    var clicked_x = false;
    var clicked_y = false;

    var split_name = clicked_id.split("_");
    //console.log("Got click on action: " + split_name[0] + " id: " + split_name[1]);

    if(split_name.length == 3) {

    }

    if(split_name[0] === 'activatetasks') {
        localStorage.setItem('use_tasks', true);

        console.log("Using local storage?");

        generateTaskDisplay();
    }

    // Adding a planet or ship coord to an area
    if(split_name[0] === 'addtoarea') {
        let area_id = $('#' + clicked_id).attr('area_id');

        let planet_coord_id = $("#" + clicked_id).attr('planet_coord_id');

        socket.emit('add_to_area_data', { 'area_id': area_id, 'planet_coord_id': planet_coord_id });
        $('#click_menu').empty();
        $('#click_menu').hide();
    }

    // Assemble objects. Depending on the class of the object type, we might need to send in the tile_x and tile_y values
    // to grab a corresponding manufacturer
    if(split_name[0] === 'assemble') {
        //console.log("Have assemble click");


        let assembling_object_type_id = $('#' + clicked_id).attr('object_type_id');

        if($('#' + clicked_id).attr('being_assembled_in_object_id')) {

            let being_assembled_in_object_id = $('#' + clicked_id).attr('being_assembled_in_object_id');
            let amount = $('#' + clicked_id).attr('amount');

            socket.emit("assemble_data", { 'object_type_id': assembling_object_type_id,
                'being_assembled_in_object_id': being_assembled_in_object_id, 'amount': amount });
        }
        else {
            console.log("Sending assemble_data with object_type_id", 'background: #222; color: #bada55');
            socket.emit("assemble_data", { 'object_type_id': assembling_object_type_id});
        }

        $('#click_menu').empty();
        $('#click_menu').hide();

    }


    if(split_name[0] == 'assemblefloor') {
        console.log("Have assemblefloor click");

        var clicked_tile_x = false;
        var clicked_tile_y = false;
        console.log("tile_x attribute: " + $('#' + clicked_id).attr('tile_x'));
        let being_assembled_in_object_id = $('#' + clicked_id).attr('being_assembled_in_object_id');
        if($('#' + clicked_id).attr('tile_x')) {
            console.log("Assembly click has tile_x");
            var clicked_tile_x = $('#' + clicked_id).attr('tile_x');
            var clicked_tile_y = $('#' + clicked_id).attr('tile_y');

            socket.emit("assemble_data", {floor_type_id: split_name[1], 'tile_x': clicked_tile_x, 'tile_y': clicked_tile_y, 'being_assembled_in_object_id': being_assembled_in_object_id });
        } else {
            socket.emit("assemble_data", {floor_type_id: split_name[1], 'being_assembled_in_object_id': being_assembled_in_object_id});
        }

        $('#click_menu').empty();
        $('#click_menu').hide();

    }


    if(split_name[0] === 'areaputonmarket') {
        let area_id = $("#" + clicked_id).attr('area_id');
        console.log("Player is putting area id: " + area_id + " on the open market");

        socket.emit('area_data', { 'area_id': area_id, 'put_on_market': true });
    }


    // Our new attack function
    if(split_name[0] === 'attack') {

        if($('#' + clicked_id).attr('monster_id')) {
            socket.emit("attack_data", { monster_id: $('#' + clicked_id).attr('monster_id') });
        }

        if($('#' + clicked_id).attr('npc_id')) {
            socket.emit("attack_data", { npc_id: $('#' + clicked_id).attr('npc_id') });
        }

        if($('#' + clicked_id).attr('object_id')) {
            socket.emit("attack_data", { object_id: $('#' + clicked_id).attr('object_id') });
        }

        if($('#' + clicked_id).attr('planet_id')) {
            socket.emit("attack_data", { 'planet_id': $('#' + clicked_id).attr('planet_id') });
        }

        if($('#' + clicked_id).attr('player_id')) {
            socket.emit("attack_data", { player_id: $('#' + clicked_id).attr('player_id') });
        }

        $('#click_menu').empty();
        $('#click_menu').hide();
    }


    if(split_name[0] === 'attackstop') {

        if($('#' + clicked_id).attr('monster_id')) {
            socket.emit("attack_stop_data", { monster_id: $('#' + clicked_id).attr('monster_id') });
        }

        if($('#' + clicked_id).attr('npc_id')) {
            console.log("User clicked to stop attacking npc");
            socket.emit("attack_stop_data", { npc_id: $('#' + clicked_id).attr('npc_id') });
        }

        if($('#' + clicked_id).attr('object_id')) {
            socket.emit("attack_stop_data", { object_id: $('#' + clicked_id).attr('object_id') });
        }

        if($('#' + clicked_id).attr('planet_id')) {
            console.log("User clicked to stop attacking planet");
            socket.emit("attack_stop_data", { planet_id: $('#' + clicked_id).attr('planet_id') });
        }

        if($('#' + clicked_id).attr('player_id')) {
            socket.emit("attack_stop_data", { player_id: $('#' + clicked_id).attr('player_id') });
        }

        $('#click_menu').empty();
        $('#click_menu').hide();
    }



    if(split_name[0] === "build") {
        let clicked_x = $('#' + clicked_id).attr('x');
        let clicked_y = $('#' + clicked_id).attr('y');


        // split_name[1] is populated by the actual ID of the inventory spot in our database
        socket.emit("build_data", { inventory_item_id: split_name[1], x: clicked_x, y: clicked_y});

        $('#click_menu').empty();
        $('#click_menu').hide();
    }


    if(split_name[0] === 'buy') {

        if($('#' + clicked_id).attr('inventory_item_id')) {
            let inventory_item_id = $('#' + clicked_id).attr('inventory_item_id');
            socket.emit('buy_data', { inventory_item_id: inventory_item_id });

            console.log("Sending that player is buying from inventory item id: " + inventory_item_id);

        } else if($('#' + clicked_id).attr('object_type_id')) {
            let object_type_id = $('#' + clicked_id).attr('object_type_id');
            console.log("Sending that player is buying object type id: " + object_type_id);
            socket.emit('buy_data', { object_type_id: object_type_id });
        }

        $('#click_menu').empty();
        $('#click_menu').hide();
    }


    if(split_name[0] == 'chatswitch') {


        switchChat(split_name[1]);


    }

    if(split_name[0] === 'claimship') {
        console.log("Player is claiming ship id: " + split_name[1]);
        socket.emit('claim_ship_data', { 'ship_id': split_name[1] });

        $('#click_menu').empty();
        $('#click_menu').hide();
    }

    if(split_name[0] == 'clear') {
        resetMap();
    }

    if(split_name[0] === 'convert') {
        //console.log("Got convert data");

        let converter_object_id = $('#' + clicked_id).attr('converter_object_id');

        // A couple different basic options - converting something from our inventory
        if($("#" + clicked_id).attr('inventory_item_id')) {
            let inventory_item_id = $('#' + clicked_id).attr('inventory_item_id');
            let amount = $('#' + clicked_id).attr('amount');

            socket.emit('convert_data', { 'input_type': 'inventory_item', inventory_item_id: inventory_item_id, converter_object_id: converter_object_id,
                'amount': amount });

            //console.log("Sent convert_data with inventory_item_id: " + inventory_item_id);
        }
        // Or putting in our HP (life force)
        else if(split_name[1] === 'hp') {
            socket.emit('convert_data', { 'input_type': 'hp', converter_object_id: converter_object_id });
        }


        $('#click_menu').empty();
        $('#click_menu').hide();
    }

    // Toggle debug mode
    if(split_name[0] === 'debug') {

        console.log("debug mode click");

        $('#debug_mode').empty();

        let current_debug_status = localStorage.getItem("debug");
        console.log("current_debug_status:");
        console.log(current_debug_status);

        // localStorage only actually stores values as strings 
        if(current_debug_status === null || current_debug_status === false || current_debug_status === "false") {


            $('#debug_mode').append("Debug Mode True");
            $('#debug_mode').append("<button id=\"debug_mode\">Toggle Debug Mode</button>");

            localStorage.setItem("debug", true);
            debug_mode = true;

            console.log("Set debug_mode to true");
        } else {

            localStorage.setItem("debug", false);
            debug_mode = false;


            $('#debug_mode').append("Debug Mode False");
            $('#debug_mode').append("<button id=\"debug_mode\">Toggle Debug Mode</button>");
            console.log("Set debug_mode to false");
        }
    }



    if(split_name[0] === 'deleterule') {
        let rule_id = $('#' + clicked_id).attr('rule_id');

        socket.emit('delete_rule_data', { 'rule_id': rule_id });
    }

    if(split_name[0] === 'destroy') {

        if($('#' + clicked_id).attr('object_id')) {
            socket.emit("destroy_data", { object_id: $('#' + clicked_id).attr('object_id') });
        }

        if($('#' + clicked_id).attr('planet_coord_id')) {
            socket.emit("destroy_data", { planet_coord_id: $('#' + clicked_id).attr('planet_coord_id') });
        }

        if($('#' + clicked_id).attr('ship_coord_id')) {
            socket.emit("destroy_data", { ship_coord_id: $('#' + clicked_id).attr('ship_coord_id') });
        }

        if($('#' + clicked_id).attr('coord_id')) {
            socket.emit("destroy_data", { coord_id: $('#' + clicked_id).attr('coord_id') });
        }




        $('#click_menu').empty();
        $('#click_menu').hide();

    }

    if(split_name[0] == 'disconnect') {
        socket.emit('disconnect_data', {'disconnect':'oh yeah'});
    }

    if(split_name[0] === 'dockcommand') {

        console.log("Sending dock_command_data with ship id: " + split_name[1]);
        socket.emit('dock_command_data', { 'ship_id': split_name[1] });

        $('#click_menu').empty();
        $('#click_menu').hide();
    }

    if(split_name[0] == 'drop') {

        clicked_x = $('#' + clicked_id).attr('x');
        clicked_y = $('#' + clicked_id).attr('y');
        let amount = 'all';
        if($('#' + clicked_id).attr('amount')) {
            amount = $('#' + clicked_id).attr('amount');
        }

        socket.emit("drop_data", {inventory_item_id: split_name[1], 'x': clicked_x, 'y':clicked_y,
            'amount': amount });

        $('#click_menu').empty();
        $('#click_menu').hide();
    }

    if(split_name[0] == 'eat') {
        socket.emit("eat_data", { inventory_item_id: split_name[1]});
        $('#click_menu').empty();
        $('#click_menu').hide();
    }

    if(split_name[0] === 'equip') {

        let inventory_item_id =  $('#' + clicked_id).attr('inventory_item_id');
        let equip_slot =  $('#' + clicked_id).attr('equip_slot');

        console.log("Player is trying to equip inventory item id: " + inventory_item_id + " to equip slot: " + equip_slot + " (clicked id: " + clicked_id + ")");

        socket.emit("equip_data", { 'inventory_item_id': inventory_item_id, 'equip_slot': equip_slot });

        $('#click_menu').empty();
        $('#click_menu').hide();
    }


    if(split_name[0] == 'give') {
        console.log("Parsing give data");

        var giving_to_player_id = $('#' + clicked_id).attr('player_id');

        console.log("Giving inventory id: " + split_name[1] + " to player " + giving_to_player_id);
        socket.emit('give_data', {inventory_item_id: split_name[1], receiving_id: giving_to_player_id});

    }

    if(split_name[0] === 'givenpc') {
        console.log("Got givenpc click");

        socket.emit('give_data', { 'npc_id': $('#' + clicked_id).attr('npc_id'), 'inventory_item_id': $('#' + clicked_id).attr('inventory_item_id') });

        $('#click_menu').empty();
        $('#click_menu').hide();
    }


    if(split_name[0] === 'help') {

        $('#click_menu').css({
            'top': 250, 'left': 250, 'position': 'absolute', 'max-height': '400px', 'max-width': '640px',
            'overflow-y': 'scroll', 'overflow-x': 'scroll', 'padding': '10px'
        }).fadeIn('fast');
    
        $('#click_menu').empty();



        $('#click_menu').append("<a target='_blank' class='button is-success is-small' href='https://space.alphacoders.com/site/tutorial'>View Our Tutorial!</a><br>");
        if(client_player_index !== -1 && players[client_player_index]) {
            $('#click_menu').append("<a target='_blank' class='button is-info is-small' href='https://space.alphacoders.com/player/view/" + players[client_player_index].id + "'>Report A Problem</a><br>");
        } 
        

        // Go through recent failure messages
        for(let i = recent_failure_messages.length - 1; i > recent_failure_messages.length - 10; i--) {

            if(recent_failure_messages[i]) {

                $('#click_menu').append("<span class='error-message'>Error: " + recent_failure_messages[i].text + "</span><br>");

                if(recent_failure_messages[i].text === 'Your beam mangled up something advanced') {
                    $('#click_menu').append("<a target='_blank' class='button is-small' href='https://space.alphacoders.com/site/tutorial/salvaging'>Salvaging Tutorial</a> This object has some complex/advanced salvage opportunities. " + 
                        "As your salvaging levels up, you'll succeed more often here. <a target='_blank' class='button is-small' href='https://space.alphacoders.com/site/tutorial/complexity'>Complexity</a>");
                }

                if(recent_failure_messages[i].text === 'Ship Has No Floor Space') {
                    $('#click_menu').append("<a target='_blank' class='button is-small' href='https://space.alphacoders.com/site/tutorial/mining'>Mining Tutorial</a> By default, the things your ship " + 
                    "mines and salvages are put on random floor tiles on your ship. Build a Bulk Container for most things, or an Ice Container for ice specifically, and your " + 
                    "ship will automatically store mined/salvaged materials in it.<br><br>You can always just switch to your ship view and pick things up as they are mined/salvaged too.");
                }

                if(recent_failure_messages[i].text === 'Your beam is a bit weak') {
                    $('#click_menu').append("<a target='_blank' class='button is-small' href='https://space.alphacoders.com/site/tutorial/mining'>Mining Tutorial</a> This object has some complex/advanced mining opportunities. " + 
                        "As your mining levels up, you'll succeed more often here. <a target='_blank' class='button is-small' href='https://space.alphacoders.com/site/tutorial/complexity'>Complexity</a>");
                }

                if(recent_failure_messages[i].text.includes('Assembling') && recent_failure_messages[i].text.includes('Failed')) {
                    $('#click_menu').append("<a target='_blank' class='button is-small' href='https://space.alphacoders.com/site/tutorial/manufacturing'>Manufacturing Tutorial</a> The object that you " + 
                    " tried to make has a higher <a target='_blank' class='button is-small' href='https://space.alphacoders.com/site/tutorial/complexity'>complexity</a> than your manufacturing skill." + 
                    " keep manufacturing things, and your level will increase, making difficult things easier.");
                }


                $('#click_menu').append("<br><br>");
            }

        }


    }

    if(split_name[0] === 'hidearea') {

        let area_id = $('#' + clicked_id).attr('area_id');

        $("#area_" + area_id).empty();

        // and we want to replace the hide button with a show discoveries button
        let show_string =  "<button class='button is-default is-small' " +
            "id='showarea_" + area_id + "'" +
            " area_id='" + area_id + "'>Show</button>";
        $('#' + clicked_id).replaceWith( show_string );

        $("#area_" + area_id).removeClass('shown-options');
    }

    if(split_name[0] === 'hidediscoveries') {

        let object_type_id = $('#' + clicked_id).attr('object_type_id');

        $('#discoveries').empty();

        // and we want to replace the hide button with a show discoveries button
        let show_string =  "<button class='button is-default is-small' " +
            "id='showdiscoveries_" + object_type_id + "'" +
            " object_type_id='" + object_type_id + "'>Show Discoveries</button>";
        $('#' + clicked_id).replaceWith( show_string );
    }


    if(split_name[0] === 'hidemarketlinker') {

        let market_linker_id = $('#' + clicked_id).attr('market_linker_id');

        $("#marker_linker_" + market_linker_id).empty();

        // and we want to replace the hide button with a show discoveries button
        let show_string =  "<button class='button is-default is-small' " +
            "id='showmarketlinker_" + market_linker_id + "'" +
            " market_linker_id='" + market_linker_id + "'>Show</button>";
        $('#' + clicked_id).replaceWith( show_string );
    }

    if(split_name[0] === 'hideobject') {

        let object_id = $('#' + clicked_id).attr('object_id');

        $("#management_object_" + object_id).empty();

        // and we want to replace the hide button with a show discoveries button
        let show_string =  "<button class='button is-default is-small' " +
            "id='showobject_" + object_id + "'" +
            " object_id='" + object_id + "'>Show</button>";
        $('#' + clicked_id).replaceWith( show_string );

        $("#management_object_" + object_id).removeClass('shown-options');
    }

    if(split_name[0] === 'leavefaction') {
        console.log("Player clicked to leave their faction");

        socket.emit('leave_faction_data', {});

    }

    if(split_name[0] === 'manage' && split_name[1] && split_name[1] === 'areas') {

        toggleAreaManagementDisplay();
        $('#click_menu').empty();
        $('#click_menu').hide();

    } else if(split_name[0] === 'manage') {





        console.log("Clicked on div with id: " + clicked_id);

        // We can highlight the div of the object we are choosing to manage

        let shown_specific = false;
        let object_index = -1;
        if( $('#' + clicked_id).attr('object_id')) {
            console.log("Clicking to manage a specific object");

            object_index = objects.findIndex(function(obj) { return obj && obj.id === parseInt($('#' + clicked_id).attr('object_id')); });
            if(object_index !== -1) {

                let object_type_index = object_types.findIndex(function(obj) { return obj && obj.id === objects[object_index].object_type_id; });


                // AI
                if(object_types[object_type_index].id === 72) {

                    toggleAiManagementDisplay(object_index);
                    $('#click_menu').empty();
                    $('#click_menu').hide();

                    shown_specific = true;
                } else if(object_types[object_type_index].is_ship) {
                    $('#ship_management').show();
                    generateShipManagementDisplay();

                    generateObjectDisplay(objects[object_index].id);

                    // and we want to replace the showdiscoveries button with a hide discoveries button
                    let hide_string =  "<button class='button is-warning is-small' " +
                        "id='hideobject_" + objects[object_index].id + "'" +
                        " object_id='" + objects[object_index].id + "'>Hide</button>";
                    $('#showobject_' + objects[object_index].id).replaceWith( hide_string );

                    $("#management_object_" + objects[object_index].id).addClass('shown-options');
                }
                // General object display
                else {
                    $('#object_management').show();

                    generateNonAiManagementDisplay(object_index);

                    //generateObjectDisplay(objects[object_index].id);

                    // and we want to replace the showdiscoveries button with a hide discoveries button
                    let hide_string =  "<button class='button is-warning is-small' " +
                        "id='hideobject_" + objects[object_index].id + "'" +
                        " object_id='" + objects[object_index].id + "'>Hide</button>";
                    $('#showobject_' + objects[object_index].id).replaceWith( hide_string );

                    $("#management_object_" + objects[object_index].id).addClass('shown-options');
                }
            }
        }

        if(!shown_specific) {

            if(object_index !== -1) {
                toggleManagementDisplay(object_index);
            } else {
                toggleManagementDisplay();
            }


        }





    }

    if(split_name[0] === 'messages') {
        console.log("Player is trying to open their messages");
        if(client_player_index !== -1 && players[client_player_index]) {
            window.open("https://space.alphacoders.com/user/messages/" + players[client_player_index].user_id);
        }
        
    }

    if(split_name[0] === 'mine') {

        socket.emit('mine_data', { 'object_id': $('#' + clicked_id).attr('object_id')});

        $('#click_menu').empty();
        $('#click_menu').hide();

    }

    if(split_name[0] === 'minestop') {

        let stop_mining_object_id = $("#" + clicked_id).attr('object_id');

        //console.log("player clicked to stop mining object id: " + stop_mining_object_id);
        //console.log("Finding a mining linker with player id: " + client_player_id + " object_id: " + stop_mining_object_id);

        // lets find the mining linker
        let mining_linker_index = mining_linkers.findIndex(function(obj) { return obj && parseInt(obj.player_id) === parseInt(client_player_id) &&
            parseInt(obj.object_id) === parseInt(stop_mining_object_id); });

        if(mining_linker_index !== -1) {
            socket.emit('mine_stop_data', { 'mining_linker_id': mining_linkers[mining_linker_index].id });
        }
        // Hmm. Just remove the mining sprite, and send off the object id
        else {
            console.log("Could not find a matching mining linker");
            socket.emit('mine_stop_data', { 'object_id': stop_mining_object_id });

            for(let i = 0; i < mining_linkers.length; i++) {
                if(mining_linkers[i]) {
                    console.log(mining_linkers[i]);
                }
            }

            for(let e = 0; e < effect_sprites.length; e++) {

                if(effect_sprites[e] && effect_sprites[e].visible && effect_sprites[e].object_id === stop_mining_object_id && 
                    effect_sprites[e].damage_source_type === 'player' && effect_sprites[e].damage_source_id === players[client_player_index].id) {
                        effect_sprites[e].object_id = false;
                        effect_sprites[e].setVisible(false);
                    }

            }
           
            redrawBars();
        }




        $('#click_menu').empty();
        $('#click_menu').hide();

    }

    if(split_name[0] === "movedownhole") {
        socket.emit('move_data', { 'destination_coord_type': client_player_info.scope, 'destination_coord_id': client_player_info.coord.id, 'movement_direction': 'none' });
        $('#click_menu').empty();
        $('#click_menu').hide();
    }

    if(split_name[0] === "moveportal") {
        socket.emit('move_data', { 'destination_coord_type': client_player_info.scope, 'destination_coord_id': client_player_info.coord.id, 'movement_direction': 'none' });
        $('#click_menu').empty();
        $('#click_menu').hide();
    }

    if(split_name[0] === "moveupstairs") {
        socket.emit('move_data', { 'destination_coord_type': client_player_info.scope, 'destination_coord_id': client_player_info.coord.id, 'movement_direction': 'none' });
        $('#click_menu').empty();
        $('#click_menu').hide();
    }


    if(split_name[0] === "notifynewplayer") {
        $('#notify_on_new_player').empty();

        let current_notify_status = localStorage.getItem("notify_on_new_player");

        if(current_notify_status === null || current_notify_status === false || current_notify_status === "false") {


            $('#notify_on_new_player').append("Notify on new player True");
            $('#notify_on_new_player').append("<button id=\"notifynewplayer\">Change to False</button>");

            localStorage.setItem("notify_on_new_player", true);
            notify_on_new_player = true;
        } else {

            localStorage.setItem("notify_on_new_player", false);
            notify_on_new_player = false;


            $('#notify_on_new_player').append("Notify on new player False");
            $('#notify_on_new_player').append("<button id=\"notifynewplayer\">Change to True</button>");
        }
    }


    if(split_name[0] === "pickup") {

        //console.log("Got pickup click");


        if($('#' + clicked_id).attr('object_id')) {
            socket.emit("pick_up_data", { 'object_id': $('#' + clicked_id).attr('object_id') });
        } else if($('#' + clicked_id).attr('monster_id')) {
            socket.emit("pick_up_data", {'monster_id': $('#' + clicked_id).attr('monster_id')});
        } else if($('#' + clicked_id).attr('planet_coord_id')) {
            socket.emit("pick_up_data", { 'planet_coord_id': $('#' + clicked_id).attr('planet_coord_id') });
        } else if($('#' + clicked_id).attr('ship_coord_id')) {
            socket.emit("pick_up_data", { 'ship_coord_id': $('#' + clicked_id).attr('ship_coord_id') });
        } else if($('#' + clicked_id).attr('coord_id')) {
            console.log("Sending pick up data with coord_id");
            socket.emit("pick_up_data", { 'coord_id': $('#' + clicked_id).attr('coord_id') });
        }


        $('#click_menu').empty();
        $('#click_menu').hide();

    }

    if(split_name[0] === 'place') {
        console.log("Got place data");

        let inventory_item_id = $('#' + clicked_id).attr('inventory_item_id');
        let storage_object_id = $('#' + clicked_id).attr('storage_object_id');
        let amount = $('#' + clicked_id).attr('amount');



        socket.emit('place_data', { inventory_item_id: inventory_item_id, storage_object_id: storage_object_id,
            'amount': amount });

        $('#click_menu').empty();
        $('#click_menu').hide();
    }


    if(split_name[0] == 'plant') {

        console.log("Got plant data");
        console.log("Got clicked_id as " + clicked_id);
        let clicked_x = $('#' + clicked_id).attr('x');
        let clicked_y = $('#' + clicked_id).attr('y');
        let planet_coord_id = 0;
        if($('#' + clicked_id).attr('planet_coord_id')) {
            planet_coord_id = $('#' + clicked_id).attr('planet_coord_id');

            socket.emit("plant_data", {inventory_item_id: split_name[1], planet_coord_id: planet_coord_id });
        } else if($('#' + clicked_id).attr('ship_coord_id')) {
            ship_coord_id = $('#' + clicked_id).attr('ship_coord_id');
            socket.emit("plant_data", {inventory_item_id: split_name[1], ship_coord_id, ship_coord_id });
        }


        

        $('#click_menu').empty();
        $('#click_menu').hide();
    }

    if(split_name[0] == 'playerdata') {
        console.log("Asking for updated player data");
        socket.emit('request_player_data');
    }

    if(split_name[0] == 'replacefloor') {
        let clicked_x = $('#' + clicked_id).attr('x');
        let clicked_y = $('#' + clicked_id).attr('y');

        socket.emit("replace_floor_data", { inventory_item_id: split_name[1], x: clicked_x, y: clicked_y});

        $('#click_menu').empty();
        $('#click_menu').hide();
    }

    if(split_name[0] == 'replaceshipwall') {
        let inventory_item_id = $('#' + clicked_id).attr('inventory_item_id');
        let ship_coord_id = $('#' + clicked_id).attr('ship_coord_id');

        console.log("Sending " + inventory_item_id + " " + ship_coord_id);

        socket.emit("replace_ship_wall_data", { inventory_item_id: inventory_item_id, ship_coord_id: ship_coord_id });

        $('#click_menu').empty();
        $('#click_menu').hide();
    }


    if(split_name[0] === 'repair') {
        //console.log("Got repair click");
        let coord_id = $('#' + clicked_id).attr('coord_id');
        socket.emit('repair_data', { coord_id: coord_id });

        $('#click_menu').empty();
        $('#click_menu').hide();
    }

    if(split_name[0] === 'repairstop') {
        //console.log("Got repairstop click");
        let coord_id = $('#' + clicked_id).attr('coord_id');
        socket.emit('repair_stop_data', { coord_id: coord_id });

        $('#click_menu').empty();
        $('#click_menu').hide();
    }

    if(split_name[0] == 'research') {
        //console.log("Got research click");
        //console.log("Got clicked_id as " + clicked_id);

        let clicked_object_id = $('#' + clicked_id).attr('object_id');


        //console.log("Sending research data. inventory_id: " + split_name[1] + " in object id: " + clicked_object_id);
        socket.emit("research_data", {inventory_item_id: split_name[1], 'researching_object_id': clicked_object_id });

        $('#click_menu').empty();
        $('#click_menu').hide();
    }

    if(split_name[0] === 'salvage') {

        // Salvaging an object
        if($('#' + clicked_id).attr('object_id')) {
            let sending_object_id = $('#' + clicked_id).attr('object_id');
            //console.log("Sending salvage request with object id: " + sending_object_id);
            
            socket.emit('salvage_data', { 'object_id': sending_object_id });
        }
        // Salvaging an object type from a coord
        else if($('#' + clicked_id).attr('coord_id')) {

            let sending_coord_id = $('#' + clicked_id).attr('coord_id');
            let sending_coord_type = $('#' + clicked_id).attr('coord_type');
            //console.log("Sending salvage request with coord id: " + sending_coord_id + ", coord_type: " + sending_coord_type);
            socket.emit('salvage_data', { 'coord_id': sending_coord_id, 'coord_type': sending_coord_type });
        }
        

        

        $('#click_menu').empty();
        $('#click_menu').hide();

    }

    if(split_name[0] === 'salvagestop') {
        console.log("player clicked to stop salvaging something");

        socket.emit('salvage_stop_data', { 'salvaging_linker_id': $('#' + clicked_id).attr('salvaging_linker_id')});


        $('#click_menu').empty();
        $('#click_menu').hide();

    }

    if(split_name[0] === 'showaioptions') {

        if($("#ai_management").is(":visible")) {
            $("#ai_management").hide();
            $("#ai_management").empty();


        } else {
            $('#ai_management').show();
            generateAiManagementDisplay();
        }


    }

    if(split_name[0] === 'showareaoptions') {

        if($("#area_management").is(":visible")) {
            $("#area_management").hide();
            $("#area_management").empty();


        } else {
            $('#area_management').show();
            generateAreaManagementDisplay();
        }


    }

    if(split_name[0] === 'showarea') {
        console.log("Got showarea click");

        let area_id = $('#' + clicked_id).attr('area_id');


        generateAreaDisplay(area_id);

        // and we want to replace the showdiscoveries button with a hide discoveries button
        let hide_string =  "<button class='button is-warning is-small' " +
            "id='hidearea_" + area_id + "'" +
            " area_id='" + area_id + "'>Hide</button>";
        $('#' + clicked_id).replaceWith( hide_string );

        $("#area_" + area_id).addClass('shown-options');
    }

    if(split_name[0] === 'showautopilot') {

        let top = $('#' + clicked_id).attr('top');
        let left = $('#' + clicked_id).attr('left');

        $('#click_menu').css({
            'top': top, 'left': left, 'position':'absolute', 'height':'200px', 'max-width': '600px',
            'overflow-y':'scroll', 'overflow-x': 'scroll', 'padding':'10px'
        }).fadeIn('fast');

        $('#click_menu').empty();

        // Lets do a form to let the player give the server an x,y destination
        let html_string = "";
        html_string += "<form action='#'>";
        html_string += "<label>X Coord</label><input type='number' name='destination_tile_x' id='destination_tile_x'><br>";
        html_string += "<label>Y Coord</label><input type='number' name='destination_tile_y' id='destination_tile_y'><br>";

        html_string += "<input class='button is-default' onclick=\"submitAutopilotDestination(); return false;\" type=\"submit\" value=\"Submit Destination\">";
        html_string += "</form>";

        $('#click_menu').append(html_string);


    }

    if(split_name[0] === 'showdiscoveries') {
        console.log("Got showdiscoveries click");

        let object_type_id = $('#' + clicked_id).attr('object_type_id');
        console.log("Player is showing discoveries for object type id: " + object_type_id);

        generateDiscoveryDisplay(object_type_id);

        // and we want to replace the showdiscoveries button with a hide discoveries button
        let hide_string =  "<button class='button is-warning is-small' " +
            "id='hidediscoveries_" + object_type_id + "'" +
            " object_type_id='" + object_type_id + "'>Hide Discoveries</button>";
        $('#' + clicked_id).replaceWith( hide_string );
    }

    if(split_name[0] === 'showmarketlinker') {
        console.log("Got showmarketlinker click");

        let market_linker_id = $('#' + clicked_id).attr('market_linker_id');


        generateMarketLinkerDisplay(market_linker_id);

        // and we want to replace the show button with a hide  button
        let hide_string =  "<button class='button is-warning is-small' " +
            "id='hidemarketlinker_" + market_linker_id + "'" +
            " market_linker_id='" + market_linker_id + "'>Hide</button>";
        $('#' + clicked_id).replaceWith( hide_string );
    }

    if(split_name[0] === 'showmarketoptions') {

        if($("#market").is(":visible")) {
            $("#market").hide();
            $("#market").empty();


        } else {
            $('#market').show();
            generateMarketDisplay();


            socket.emit('request_market_data');


        }


    }

    if(split_name[0] === 'showobject') {
        console.log("Got showobject click");

        let object_id = $('#' + clicked_id).attr('object_id');


        generateObjectDisplay(object_id);

        // and we want to replace the showdiscoveries button with a hide discoveries button
        let hide_string =  "<button class='button is-warning is-small' " +
            "id='hideobject_" + object_id + "'" +
            " object_id='" + object_id + "'>Hide</button>";
        $('#' + clicked_id).replaceWith( hide_string );

        $("#management_object_" + object_id).addClass('shown-options');
    }

    if(split_name[0] === 'showobjectoptions') {

        if($("#object_management").is(":visible")) {
            $("#object_management").hide();
            $("#object_management").empty();


        } else {
            $('#object_management').show();
            generateNonAiManagementDisplay();
        }


    }

    if(split_name[0] === 'showshipoptions') {

        if($("#ship_management").is(":visible")) {
            $("#ship_management").hide();
            $("#ship_management").empty();


        } else {
            $('#ship_management').show();
            generateShipManagementDisplay();
        }


    }

    if(split_name[0] === 'showtaskoptions') {

        if($("#task_management").is(":visible")) {
            $("#task_management").hide();
            $("#task_management").empty();


        } else {
            $('#task_management').show();
            generateTaskDisplay();
        }


    }


    if(split_name[0] === 'skin' && split_name[1] === 'use') {
        console.log("Played clicked to use a skin");
        let skin_object_type_id = $('#' + clicked_id).attr('skin_object_type_id');
        socket.emit('skin_use_data', { 'skin_object_type_id': skin_object_type_id });
    }

    if(split_name[0] === 'skin' && split_name[1] === 'remove') {
        console.log("Played clicked to remove a skin");
        let skin_object_type_id = $('#' + clicked_id).attr('skin_object_type_id');
        socket.emit('skin_remove_data', { 'skin_object_type_id': skin_object_type_id });
    }


    // Toggle debug mode
    if(split_name[0] === 'sound') {

        console.log("sound click");

        $('#sound').empty();

        //let current_sound_status = localStorage.getItem("sound");
        //console.log("current_sound_status:");
        //console.log(current_sound_status);

        // localStorage only actually stores values as strings 
        if(play_sounds === false) {
        //if(current_sound_status === null || current_sound_status === false || current_sound_status === "false") {


            $('#sound').append("Sound ON");
            $('#sound').append("<button id=\"sound\">Toggle Sound</button>");

            localStorage.setItem("sound", true);
            play_sounds = true;

            if(audio_loaded === false) {
                loadAudio();
                audio_loaded = true;
            }
            

            console.log("Set play_sounds to true");
        } else {

            localStorage.setItem("sound", false);
            play_sounds = false;


            $('#sound').append("Sound OFF");
            $('#sound').append("<button id=\"sound\">Toggle Sound</button>");
            console.log("Set sound off");

            //if(sound_engine && sound_engine.isPlaying) {
            //    sound_engine.stop();
            //}

            let scene_game = game.scene.getScene('sceneGame');

            scene_game.sound.stopAll();
        }
    }


    if(split_name[0] == "spawnmonster") {
        console.log("Admin spawning monster");
        var clicked_x = $('#' + clicked_id).attr('x');
        var clicked_y = $('#' + clicked_id).attr('y');
        socket.emit("spawn_monster_data", { 'monster_type_id': split_name[1], x: clicked_x, y: clicked_y});
    }

    if(split_name[0] === 'switchbody') {
        //console.log("player is switching bodies");


        let move_inventory = $('#' + clicked_id).attr('move_inventory');
        socket.emit('switch_body_data', { 'object_id': split_name[1], 'move_inventory': move_inventory });


        $('#click_menu').empty();
        $('#click_menu').hide();
    }

    if(split_name[0] === 'switchship') {
        socket.emit('switch_ship_data', { 'ship_id': split_name[1] });

        $('#click_menu').empty();
        $('#click_menu').hide();
    }

    if(split_name[0] === 'take') {
        console.log("player is taking item from a chest or something!!");

        let inventory_item_id = $('#' + clicked_id).attr('inventory_item_id');

        let amount = 1;
        if($('#' + clicked_id).attr('amount')) {
            amount = $('#' + clicked_id).attr('amount');
        }
        
        socket.emit('take_data', { inventory_item_id: inventory_item_id, 'amount': amount });

        //console.log("Sending that player is taking inventory item id: " + inventory_item_id);

        if(!shiftKey.isDown) {
            $('#click_menu').empty();
            $('#click_menu').hide();
        } else {
            console.log("Took from something while holding shift. Lets update that display now....");
            let storage_object_id = $('#' + clicked_id).attr('storage_object_id');
            console.log("got storage object id: " + storage_object_id);
            if(storage_object_id) {
                let storage_object_index = getObjectIndex(storage_object_id);
                let object_info = getObjectInfo(storage_object_index);
                if(object_info.coord) {
                    $('#click_menu').empty();
                    showClickMenuObject(object_info.coord);
                }
                
                // find a planet or ship coord with this object
                //generateTakeBuyMenu(storage_object_id);
            }
            // Don't have enough info to showClickMenuObject. Need to pass in owner object too I suppose
        }
        
    }

    // The player wants to dock at The Great Nomad after understanding the risks
    if(split_name[0] === 'thegreatnomad') {

        $('#click_menu').empty();
        $('#click_menu').hide();

        //document.cookie = "thegreatnomad=1";
        localStorage.setItem('allowthegreatnomad', true);

    }


    if(split_name[0] == 'trade') {
        console.log("Initiating trade with player");
        socket.emit('trade_initiate', {other_player_id: split_name[1]});
    }

    if(split_name[0] == 'trash') {

        socket.emit("trash_data", {inventory_item_id: split_name[1] });
        $('#click_menu').empty();
        $('#click_menu').hide();
    }

    if(split_name[0] == 'unequip') {
        console.log("Player is unequipping item");

        let equipment_linker_id = $('#' + clicked_id).attr('equipment_linker_id');
        console.log("Player is unequipping equipment_linker_id: " + equipment_linker_id);

        socket.emit('unequip_data', { 'equipment_linker_id': equipment_linker_id });
    }

    if(split_name[0] === 'use' && split_name[1] === 'elevator') {
        console.log("Player is using an elevator!");
        let elevator_being_used_id = split_name[2];

        socket.emit('use_elevator', { 'elevator_id': elevator_being_used_id });

    }

    if(split_name[0] === 'viewchange') {
        let new_view = $('#' + clicked_id).attr('newview');

        socket.emit('view_change_data', { 'new_view': new_view });
    }



});
