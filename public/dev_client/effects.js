/**
 * 
 * @param {Object} data 
 * @param {Array} data.damage_types
 * @param {number} data.x - The x location of whatever was hit
 * @param {number} data.y - The y location of whatever was hit
 * @param {string} data.damage_source_type
 * @param {string} data.damage_source_id
 * @param {int=} data.monster_id
 * @param {int=} data.npc_id
 * @param {int=} data.object_id
 * @param {int=} data.planet_id
 * @param {int=} data.player_id
 * @param {int=} data.coord_id
 * @param {String=} data.coord_type
 */
function addEffect(data) {

    let debug_effects = false;

    if(debug_effects) {
        console.log("Looking to add an effect. Currently there are: " + effect_sprites.length + " effect sprites");
    }


    let scene_game = game.scene.getScene('sceneGame');


    if(!data.damage_types || (data.damage_types && data.damage_types.length <= 0)) {
        console.log("%c Trying to add an effect, but no damage types: ", log_warning);
        console.log(data);
        console.trace();
        return false;
    }


    for(let i = 0; i < data.damage_types.length; i++) {

        if(debug_effects) {
            console.log("Damage type: " + data.damage_types[i]);
        }

        // If there's already an exact match sprite visible, we won't need another one
        for(let e = 0; e < effect_sprites.length; e++) {


            if(effect_sprites[e] && effect_sprites[e].visible === true && 
                effect_sprites[e].damage_source_id === data.damage_source_id && 
                effect_sprites[e].damage_source_type === data.damage_source_type && 
                effect_sprites[e].damage_type === data.damage_types[i]) {
                    if(debug_effects) {
                        console.log("Already have a sprite doing exactly this!");
                    }
                    return false;
            }
        }


        let effect_sprite_index = -1;

        // See if we have a non-visible effect sprite
        for(let e = 0; e < effect_sprites.length && effect_sprite_index === -1; e++) {

            if(effect_sprites[e] && effect_sprites[e].visible === false) {

                effect_sprite_index = e;

                // and lets just make sure data for this previous spite is reset
                effect_sprites[e].player_id = false;
                effect_sprites[e].monster_id = false;
                effect_sprites[e].object_id = false;
                effect_sprites[e].planet_id = false;
                effect_sprites[e].npc_id = false;
                effect_sprites[e].rotation = 0;
                effect_sprites[e].effect_type = false;
                effect_sprites[e].coord_id = false;
                effect_sprites[e].coord_type = "";
                if(effect_sprites[e].body) {
                    if(debug_effects) {
                        console.log("Effect sprite had physics on it! Removing ( I think)");
                    }
                    effect_sprites[e].body.setVelocity(0,0);
                    effect_sprites[e].body.setAcceleration(0,0);
                    effect_sprites[e].effect_type = "";
                    effect_sprites[e].body.setEnable(false);
                    effect_sprites[e].body = false;
                    effect_sprites[e].distance = false;
                }
                effect_sprites[effect_sprite_index].setOrigin(.5,.5);

                if(debug_effects) {
                    console.log("Found an invisible effect sprite we can re-use (index: " + effect_sprite_index + ")");
                }
            }

        }

        

        // If effect_sprite_index is still -1, we need to create a sprite
        if(effect_sprite_index === -1) {
            effect_sprite_index = effect_sprites.push(scene_game.add.sprite(data.x + 32, data.y + 32, '')) - 1;

            effect_sprites[effect_sprite_index].setDepth(11);

            if(debug_effects) {
                console.log("Created new effect sprite");
            }
        }


        // Let our effect sprite know the source and destination
        effect_sprites[effect_sprite_index].damage_type = data.damage_types[i];
        effect_sprites[effect_sprite_index].damage_source_type = data.damage_source_type;
        effect_sprites[effect_sprite_index].damage_source_id = data.damage_source_id;

        if(data.monster_id) {
            effect_sprites[effect_sprite_index].monster_id = data.monster_id;
        }

        if(data.npc_id) {
            effect_sprites[effect_sprite_index].npc_id = data.npc_id;
        }

        if(data.object_id) {
            effect_sprites[effect_sprite_index].object_id = data.object_id;
        }
        
        if(data.planet_id) {
            effect_sprites[effect_sprite_index].planet_id = data.planet_id;
        }

        if(data.player_id) {
            //console.log("Giving effect sprite player_id");
            effect_sprites[effect_sprite_index].player_id = data.player_id;
        }

        if(typeof data.coord_id !== 'undefined') {
            effect_sprites[effect_sprite_index].coord_id = data.coord_id;
            effect_sprites[effect_sprite_index].coord_type = data.coord_type;
        }

        let new_texture_key = false;
        let new_texture_animation_key = false;
        let effect_type = "point";

    
        // Setting the textures and offsets specific to the effect being drawn
        if(data.damage_types[i] === 'addiction' || data.damage_types[i] === 'decay') {
            new_texture_key = 'addiction-effect';
            new_texture_animation_key = 'addiction-effect-animation';
            data.x += 32;
        } /* else if(data.damage_types[i] === 'decay') {
            new_texture_key = 'decay-effect';
            new_texture_animation_key = 'decay-effect-animation';
            data.x += 32;
        } */ else if(data.damage_types[i] === 'energy') {
            new_texture_key = 'energy-effect';
            new_texture_animation_key = 'energy-effect-animation';
            data.x += 32;
            data.y += 32;
        } else if(data.damage_types[i] === 'explosion') {
            new_texture_key = 'explosion-effect';
            new_texture_animation_key = 'explosion-effect-animation';
            data.x += 32;
            data.y += 32;
        } else if(data.damage_types[i] === 'electric') {
            new_texture_key = 'electric-effect';
            new_texture_animation_key = 'electric-effect-animation';
            data.x += 32;
            data.y += 32;
            // testing
        }
        else if(data.damage_types[i] === 'electric-ball') {
            new_texture_key = 'electric-ball-effect';
            new_texture_animation_key = 'electric-ball-effect-animation';

            // Works well when a player is the destination

            data.x += 32;
            data.y += 32;
            
            
            // testing
            effect_type = 'projectile';
        } else if(data.damage_types[i] === 'freezing') {
            new_texture_key = 'electric-ball-effect';
            new_texture_animation_key = 'electric-ball-effect-animation';

            // Works well when a player is the destination

            data.x += 32;
            data.y += 32;
            
            
            // testing
            effect_type = 'projectile';
        } 
        else if(data.damage_types[i] === 'gravity') {
            new_texture_key = 'gravity-effect';
            new_texture_animation_key = 'gravity-effect-animation';
            data.x += 32;
            data.y += 32;
        }
        else if(data.damage_types[i] === 'hacking') {
            new_texture_key = 'hacking-effect';
            new_texture_animation_key = 'hacking-effect-animation';
            data.x += 32;
            data.y += 32;
        } else if(data.damage_types[i] === 'healing') {
            new_texture_key = 'healing-effect';
            new_texture_animation_key = 'healing-effect-animation';
            data.x += 32;
            data.y += 32;
        } else if(data.damage_types[i] === 'heat') {
            new_texture_key = 'heat-effect';
            new_texture_animation_key = 'heat-effect-animation';
            effect_type = 'beam';
            data.x += 32;
            data.y += 32;
        } else if(data.damage_types[i] === 'laser') {
            new_texture_key = 'laser-effect';
            new_texture_animation_key = 'laser-effect-animation';
            effect_type = 'beam';
            data.x += 32;
            data.y += 32;
        } else if(data.damage_types[i] === 'melee' || data.damage_types[i] === 'normal' || data.damage_types[i] === 'none') {
            new_texture_key = 'melee-effect';
            new_texture_animation_key = 'melee-effect-animation';
            data.x += 32;
            data.y += 32;
        }  else if(data.damage_types[i] === 'mining') {
            new_texture_key = 'mining-effect';
            new_texture_animation_key = 'mining-effect-animation';
            effect_type = 'beam';
            data.x += 32;
            data.y += 32;
        } else if(data.damage_types[i] === 'piercing') {
            new_texture_key = 'piercing-effect';
            new_texture_animation_key = 'piercing-effect-animation';
            data.x += 32;
            data.y += 32;
        } else if(data.damage_types[i] === 'poison' || data.damage_types[i] === 'corrosive') {
            new_texture_key = 'poison-effect';
            new_texture_animation_key = 'poison-effect-animation';
            data.x += 32;
        } else if(data.damage_types[i] === 'radiation') {
            new_texture_key = 'radiation-effect';
            new_texture_animation_key = 'radiation-effect-animation';
            data.x += 32;
        } else if(data.damage_types[i] === 'repairing') {
            new_texture_key = 'repairing-effect';
            new_texture_animation_key = 'repairing-effect-animation';
            data.x += 32;
        } else if(data.damage_types[i] === 'salvaging') {
            new_texture_key = 'salvaging-effect';
            new_texture_animation_key = 'salvaging-effect-animation';
            effect_type = 'beam';
            data.x += 32;
            data.y += 32;
        } else if(data.damage_types[i] === 'thorn') {
            new_texture_key = 'thorn-effect';
            new_texture_animation_key = 'thorn-effect-animation';
        }

        // We didn't find our texture!!!
        if(new_texture_key === false) {
            console.log("%c Not sure what to do with damage type " + data.damage_types[i], log_warning);
            return false;
        }


        //console.log("Rotation: " + effect_sprites[effect_sprite_index].rotation);
        //console.log("data.x,data.y: " + data.x + "," + data.y);

        effect_sprites[effect_sprite_index].effect_type = effect_type;

        // Player sprites are currently depth 5
        if(effect_sprites[effect_sprite_index].effect_type === 'beam') {
            effect_sprites[effect_sprite_index].setDepth(4);
        
        }



        if(!effect_sprites[effect_sprite_index].texture || effect_sprites[effect_sprite_index].texture.key !== new_texture_key) {
            if(debug_effects) {
                console.log("Switching texture for effect sprite");
            }
            effect_sprites[effect_sprite_index].setTexture(new_texture_key);

            effect_sprites[effect_sprite_index].play(new_texture_animation_key);

            // Reset the displayWidth
            effect_sprites[effect_sprite_index].displayWidth = effect_sprites[effect_sprite_index].width;
            effect_sprites[effect_sprite_index].displayHeight = effect_sprites[effect_sprite_index].height;
            
        } else {
            effect_sprites[effect_sprite_index].play(new_texture_animation_key);
        }

        // For a point, the x and y are the destination - whatever was damaged
        if(effect_type === 'point') {
            effect_sprites[effect_sprite_index].x = data.x;
            effect_sprites[effect_sprite_index].y = data.y;
            effect_sprites[effect_sprite_index].setVisible(true);
        } 
        // For a beam, the x and y are the source
        else if(effect_type === 'beam') {

            if(debug_effects) {
                console.log("Effect sprite is a beam!");
            }

            
            effect_sprites[effect_sprite_index].setOrigin(0,.5);

            // For a beam type, we are going to have to set the x,y to our damage source
             if(data.damage_source_type === 'monster') {

                let monster_index = getMonsterIndex(data.damage_source_id);
                if(monsters[monster_index].sprite) {
                    effect_sprites[effect_sprite_index].x = monsters[monster_index].sprite.x;
                    effect_sprites[effect_sprite_index].y = monsters[monster_index].sprite.y;
                } else {
                    // We might have a coord for this monster - nad we can use that
                    let attacking_monster_info = getMonsterInfo(monster_index);
                    if(attacking_monster_info.coord) {
                        effect_sprites[effect_sprite_index].x = tileToPixel(attacking_monster_info.coord.tile_x) + 32;
                        effect_sprites[effect_sprite_index].y = tileToPixel(attacking_monster_info.coord.tile_y) + 32;
                    }
                }

            } else if(data.damage_source_type === 'object') {
                let object_index = getObjectIndex(data.damage_source_id);
                let attacking_object_info = getObjectInfo(object_index);
                if(attacking_object_info.coord) {
                    effect_sprites[effect_sprite_index].x = tileToPixel(attacking_object_info.coord.tile_x) + 32;
                    effect_sprites[effect_sprite_index].y = tileToPixel(attacking_object_info.coord.tile_y) + 32;
                }
            } else if(data.damage_source_type === 'player') {
            
                let player_index = getPlayerIndex(data.damage_source_id);
                if(player_index !== -1) {
                    if(players[player_index].sprite) {
                        effect_sprites[effect_sprite_index].x = players[player_index].sprite.x;
                        effect_sprites[effect_sprite_index].y = players[player_index].sprite.y;
                    }
                } else {
                    socket.emit('request_player_info', { 'player_id': data.damage_source_id });
                }
                
                
                if(debug_effects) {
                    console.log("damage_source_type was player");
                }
            } 

            if(debug_effects) {
                console.log("data.x,y: " + data.x + ", " + data.y);
            }


            let distance = Phaser.Math.Distance.Between(effect_sprites[effect_sprite_index].x,
                effect_sprites[effect_sprite_index].y,
                data.x, data.y);
            let angle_between = Phaser.Math.Angle.Between(effect_sprites[effect_sprite_index].x, 
                effect_sprites[effect_sprite_index].y,
                data.x, data.y);

            effect_sprites[effect_sprite_index].displayWidth = distance;

            if(debug_effects) {
                console.log("Distance: " + distance);
            }

            effect_sprites[effect_sprite_index].rotation = angle_between;
            effect_sprites[effect_sprite_index].setVisible(true);

            effect_sprites[effect_sprite_index].destination_x = data.x;
            effect_sprites[effect_sprite_index].destination_y = data.y;

        } 
        // Going to need our effect to move towards the thing!
        else if(effect_type === 'projectile') {

            if(debug_effects) {
                console.log("Effect sprite is a projectile!");
            }
            
            effect_sprites[effect_sprite_index].setOrigin(0,.5);


            // For a projectile type, we are going to have to set the x,y to our damage source
            if(data.damage_source_type === 'monster') {

                let monster_index = getMonsterIndex(data.damage_source_id);
                if(monsters[monster_index].sprite) {
                    effect_sprites[effect_sprite_index].x = monsters[monster_index].sprite.x;
                    effect_sprites[effect_sprite_index].y = monsters[monster_index].sprite.y;
                } else {
                    // We might have a coord for this monster - nad we can use that
                    let attacking_monster_info = getMonsterInfo(monster_index);
                    if(attacking_monster_info.coord) {
                        effect_sprites[effect_sprite_index].x = tileToPixel(attacking_monster_info.coord.tile_x) + 32;
                        effect_sprites[effect_sprite_index].y = tileToPixel(attacking_monster_info.coord.tile_y) + 32;
                    }
                }

            } else if(data.damage_source_type === 'object') {
                let object_index = getObjectIndex(data.damage_source_id);
                let attacking_object_info = getObjectInfo(object_index);
                if(attacking_object_info.coord) {
                    effect_sprites[effect_sprite_index].x = tileToPixel(attacking_object_info.coord.tile_x) + 32;
                    effect_sprites[effect_sprite_index].y = tileToPixel(attacking_object_info.coord.tile_y) + 32;
                }
            } else if(data.damage_source_type === 'player') {
            
                let player_index = getPlayerIndex(data.damage_source_id);
                if(player_index !== -1) {
                    if(players[player_index].sprite) {
                        effect_sprites[effect_sprite_index].x = players[player_index].sprite.x;
                        effect_sprites[effect_sprite_index].y = players[player_index].sprite.y;
                    }
                } else {
                    socket.emit('request_player_info', { 'player_id': data.damage_source_id });
                }
                
                
                if(debug_effects) {
                    console.log("damage_source_type was player");
                }
            } 

            scene_game.physics.add.existing(effect_sprites[effect_sprite_index], false);
            
            scene_game.physics.moveTo(effect_sprites[effect_sprite_index], data.x, data.y, 800);
            effect_sprites[effect_sprite_index].body.setEnable();
            effect_sprites[effect_sprite_index].rotation = Phaser.Math.Angle.Between(effect_sprites[effect_sprite_index].x, effect_sprites[effect_sprite_index].y, data.x, data.y) - 45;

            effect_sprites[effect_sprite_index].setVisible(true);

            effect_sprites[effect_sprite_index].destination_x = data.x;
            effect_sprites[effect_sprite_index].destination_y = data.y;

            active_projectile_count++;

            //console.log("Set projectile destination_x,y: " + effect_sprites[effect_sprite_index].destination_x +"," + effect_sprites[effect_sprite_index].destination_y);

        }



    }



}


function removeEffects(removing_type, removing_id) {

    //console.log("Removing effects from " + removing_type + " id: " + removing_id);

    for(let i = 0; i < effect_sprites.length; i++) {
        if(effect_sprites[i] && effect_sprites[i].visible) {
            
            
            if(removing_type === 'object' && effect_sprites[i].object_id && effect_sprites[i].object_id === removing_id) {

                //console.log("Found effect on object. No longer visible!");
                effect_sprites[i].object_id = false;
                effect_sprites[i].setVisible(false);
            } else if(removing_type === 'coord' && effect_sprites[i].coord_id && effect_sprites[i].coord_id === removing_id) {
                effect_sprites[i].coord_id = false;
                effect_sprites[i].coord_type = "";
                effect_sprites[i].setVisible(false);
            }
        }
    }


}


function updateEffectSprites(moved_type, moved_index) {
    //console.log("In updateEffectSprites");

    
    for(let i = 0; i < effect_sprites.length; i++) {

        if(effect_sprites[i] && effect_sprites[i].visible && effect_sprites[i].effect_type === 'beam') {

            //console.log("In updateEffectSprites with moved: " + moved_type);


            let effect_needs_update = false;

            /*

            if( effect_sprites[i].object_id) {

                console.log("Have an effect sprite to update!");
    
                let object_index = getObjectIndex(effect_sprites[i].object_id);
                let object_info = getObjectInfo(object_index);
    
                let object_x_beam = tileToPixel(object_info.coord.tile_x) + 32;
                let object_y_beam = tileToPixel(object_info.coord.tile_y) + 32;
    
                effect_sprites[i].x = players[client_player_index].sprite.x;
                effect_sprites[i].y = players[client_player_index].sprite.y;
    
                let distance = Phaser.Math.Distance.Between(players[client_player_index].sprite.x, players[client_player_index].sprite.y,
                object_x_beam, object_y_beam);
                let angle_between = Phaser.Math.Angle.Between(players[client_player_index].sprite.x, players[client_player_index].sprite.y,
                object_x_beam, object_y_beam);
    
                effect_sprites[i].displayWidth = distance;

                effect_sprites[i].rotation = angle_between;
    
            } 
            */

    

            // Monster that is the beam destination moved
            if(moved_type === 'monster' && effect_sprites[i].monster_id === monsters[moved_index].id) {
                effect_needs_update = true;
                effect_sprites[i].destination_x = monsters[moved_index].sprite.x;
                effect_sprites[i].destination_y = monsters[moved_index].sprite.y;
            }
            
            // Object that is the beam destination moved
            if(moved_type === 'object' && effect_sprites[i].object_id === objects[moved_index].id) {

                // The client has lost track of where this object is, we can actually remove the effect
                if(!objects[moved_index].sprite) {
                    removeEffects('object', objects[moved_index].id);
                } else {
                    effect_needs_update = true;
                    effect_sprites[i].destination_x = objects[moved_index].sprite.x;
                    effect_sprites[i].destination_y = objects[moved_index].sprite.y;
                }
                
            }


            // Monster that is the beam source moved
            if(moved_type === 'monster' && effect_sprites[i].damage_source_type === 'monster' && effect_sprites[i].damage_source_id === monsters[moved_index].id) {

                effect_needs_update = true;
                effect_sprites[i].x = monsters[moved_index].sprite.x;
                effect_sprites[i].y = monsters[moved_index].sprite.y;

                

            } 

            // Player that is the beam source moved
            if(moved_type === 'player' && effect_sprites[i].damage_source_type === 'player' && effect_sprites[i].damage_source_id === players[moved_index].id) {

                //console.log("Player that is beam source moved");
                //console.log("Updating beam x,y from: " + effect_sprites[i].x + "," + effect_sprites[i].y + " to: " + players[moved_index].sprite.x + "," + players[moved_index].sprite.y);

                effect_needs_update = true;
                effect_sprites[i].x = players[moved_index].sprite.x;
                effect_sprites[i].y = players[moved_index].sprite.y;

                

            } 

            // Player that is the beam destination moved
            if(moved_type === 'player' && effect_sprites[i].player_id === players[moved_index].id) {

                //console.log("Updating effect where player is the destination");
                effect_needs_update = true;
                effect_sprites[i].destination_x = players[moved_index].sprite.x;
                effect_sprites[i].destination_y = players[moved_index].sprite.y;
            }
            
            
            if(moved_type === 'object' && effect_sprites[i].damage_source_type === 'object' && effect_sprites[i].damage_source_id === objects[moved_index].id) {

                //console.log("Effect with object attacking needs update!");
                effect_needs_update = true;


                // We're going to track the player sprite instead of the object if this is a ship
                let object_is_active_ship = false;
                let player_index = -1;
                for(let p = 0; p < players.length; p++) {
                    if(players[p] && players[p].ship_id === objects[moved_index].id) {
                        object_is_active_ship = true;
                        player_index = p;
                    }
                }

                if(current_view === 'galaxy' && object_is_active_ship) {
                    effect_sprites[i].x = players[player_index].sprite.x;
                    effect_sprites[i].y = players[player_index].sprite.y;
    

                } else if(objects[moved_index].sprite) {
                    effect_sprites[i].x = objects[moved_index].sprite.x;
                    effect_sprites[i].y = objects[moved_index].sprite.y;
                }

            }


            if(effect_needs_update) {
                let distance = Phaser.Math.Distance.Between(effect_sprites[i].x, effect_sprites[i].y,
                    effect_sprites[i].destination_x, effect_sprites[i].destination_y);
                let angle_between = Phaser.Math.Angle.Between(effect_sprites[i].x, effect_sprites[i].y,
                    effect_sprites[i].destination_x, effect_sprites[i].destination_y);
    
                effect_sprites[i].displayWidth = distance;

                effect_sprites[i].rotation = angle_between;

                //console.log("updated sprite to distance: " + effect_sprites[i].displayWidth + " angle: " + effect_sprites[i].rotation);
    
            }


          


    
        } else if(effect_sprites[i] && effect_sprites[i].effect_type === 'projectile') {

            if(effect_sprites[i].visible ) {

                // Player that is the beam destination moved
                if(moved_type === 'player' && effect_sprites[i].player_id === players[moved_index].id) {
                    let scene_game = game.scene.getScene('sceneGame');

                    //console.log("Updating effect where player is the destination");
                    effect_needs_update = true;
                    effect_sprites[i].destination_x = players[moved_index].sprite.x;
                    effect_sprites[i].destination_y = players[moved_index].sprite.y;
                    scene_game.physics.moveTo(effect_sprites[i], effect_sprites[i].destination_x, effect_sprites[i].destination_y, 50);
                }


                let distance = Phaser.Math.Distance.Between(effect_sprites[i].x, effect_sprites[i].y, effect_sprites[i].destination_x, effect_sprites[i].destination_y);

                let remove_effect = false;
    
                if(distance < 20 || distance > 2000) {
                    remove_effect = true;
    
                }
    
                if(typeof effect_sprites[i].previous_distance !== 'undefined' && notFalse(effect_sprites[i].previous_distance) && 
                effect_sprites[i].distance > effect_sprites[i].previous_distance) {
                    remove_effect = true;
                }
    
    
                if(remove_effect) {
                    //console.log("At destination");
                    let scene_game = game.scene.getScene('sceneGame');
    
    
    
                    // spawn the hit animation
                    /*
                    if(electric_effect_sprite === false) {
                        electric_effect_sprite = scene_game.add.sprite(range_sprites[i].destination_x + 32, range_sprites[i].destination_y + 32, 'electric-effect');
                        //fire_attack_sprite.on('animationcomplete', fireCompleteCallback, this);
                        electric_effect_sprite.anims.play('electric-effect');
                    } else {
                        electric_effect_sprite.x = range_sprites[i].destination_x;
                        electric_effect_sprite.y = range_sprites[i].destination_y;
                        electric_effect_sprite.setVisible(true);
                        electric_effect_sprite.anims.play('electric-effect');
                    }
                    */
    
                    if(effect_sprites[i].texture.key === 'electric-ball-effect') {
                        // The - 32 should center the electic effect on monsters a bit better. Not sure if this is messing up or improving how it looks on players
                        addEffect({ 'x': effect_sprites[i].destination_x - 32, 'y': effect_sprites[i].destination_y - 32, 'damage_types': ['electric']});
                    } 
    
                    effect_sprites[i].body.setVelocity(0,0);
                    effect_sprites[i].body.setAcceleration(0,0);
                    effect_sprites[i].effect_type = "";
                    effect_sprites[i].body.setEnable(false);
                    //if(effect_sprites[i].body) {
                    //    effect_sprites[i].body.kill();
                    //}
                    //effect_sprites[i].body = false;
                    effect_sprites[i].setVisible(false);
                    
                    
                    active_projectile_count--;
                } else {
                    effect_sprites[i].previous_distance = distance;
                }
            } else {
                //console.log("Not visible");
            }

          
            


        }

       
    }


}