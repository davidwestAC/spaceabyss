function displayClickPlanet(planet_id) {

    let planet_index = planets.findIndex(function (obj) { return obj && obj.id === planet_id; });
    if (planet_index === -1) {
        $('#coord_data').append("No planet info<br>");
    } else {

        // if there's a spawned event with this planet, something BAD is going on 
        for(let i = 0; i < spawned_events.length; i++) {
            if(spawned_events[i] && spawned_events[i].planet_id === planets[planet_index].id) {


                if(spawned_events[i].event_id === 90) {
                    $('#coord_data').append("<span class='tag is-danger'>WARNING!! This planet is being infested by bugs. It is currently a dangerous place to explore.</span><br>");
                }
                

            }
        }

        $('#coord_data').append("<strong>" + planets[planet_index].name + "</strong><br>");

        let planet_type_index = planet_types.findIndex(function (obj) { return obj && obj.id === planets[planet_index].planet_type_id; });
        if (planet_type_index !== -1) {
            $('#coord_data').append("&nbsp;&nbsp;Type: <strong>" + planet_types[planet_type_index].name + "</strong><br>");
        } else {
            $('#coord_data').append("Unknown planet type<br>");
        }

        if (debug_mode) {
            $('#coord_data').append("&nbsp;&nbsp;ID: " + planet_id + "<br>");
            $('#coord_data').append("&nbsp;&nbsp;Type ID: " + planet_types[planet_type_index].id + "<br>");
        }

        if (planets[planet_index].player_id) {
            let player_index = players.findIndex(function (obj) { return obj && obj.id === planets[planet_index].player_id; });

            if (player_index !== -1) {
                console.log("Showing updated player thing");
                $('#coord_data').append("&nbsp;&nbsp;Owned By Player: <a target='_blank' href='https://space.alphacoders.com/player/view/" + players[player_index].id + "'>" + players[player_index].name + "</a><br>");
            } else {
                $('#coord_data').append("&nbsp;&nbsp;Owned By Player Id: " + planets[planet_index].player_id + "<br>");
            }
        } else {
            $('#coord_data').append("&nbsp;&nbsp;Unclaimed<br>");
        }



        if (planets[planet_index].ai_id) {
            // see if we have the player



            // see if there is an AI on the planet
            let ai_index = objects.findIndex(function (obj) { return obj && obj.id === planets[planet_index].ai_id; });

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
                socket.emit('request_object_info', { 'object_id': planets[planet_index].ai_id });
            }




        } else {
            $('#coord_data').append("&nbsp;&nbsp;No AI<br>");
        }

        // Planet HP
        $('#coord_data').append("&nbsp;&nbsp;HP: " + planets[planet_index].current_hp + "/" + planets[planet_index].max_hp);



    }
}