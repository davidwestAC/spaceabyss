<?php
// TODO pretty sure client_move_start_time and client_move_pixel_amount can be deprecated fully in favor of players[index].move_start_time and players[index].move_pixel_count
include('config.php');
?>

<script type="text/javascript">
    // Get settings from cookies on the client
    var debug_mode = false;
    var mobile_mode = false;

    if (document.cookie.split(';').filter((item) => item.includes('debug_mode=1')).length) {
        debug_mode = true;
    }


</script>


<?php
    if(isset($_GET['mobile'])) {
        ?>
        <script type="text/javascript">
            mobile_mode = true;
            console.log("Set mobile mode to true");
        </script>


        <?php
    }
?>

<script src="https://space.alphacoders.com:<?php echo $port; ?>/socket.io/socket.io.js"></script>

<script type="text/javascript">
    var socket = false;
    if(io) {
        console.log("Connecting to space.alphacoders.com:<?php echo $port; ?>");
        socket = io.connect('space.alphacoders.com:<?php echo $port; ?>', { secure: true });

        socket.on('connect', () => {
            socket.emit('ready');
        });

    } else {
        console.log("%c Could not find io", log_danger);
    }

</script>

<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Space Abyss</title>

    



    <script src="//space.alphacoders.com/jquery-3.3.1.min.js"></script>
    <script src="//space.alphacoders.com/phaser-3.15.1.js"></script>

    <script src="client_functions_<?php echo $client_version; ?>.js"></script>
    <script src="client_network_<?php echo $client_version; ?>.js"></script>
    <script src="client_click_<?php echo $client_version; ?>.js"></script>
    <script src="effects_<?php echo $client_version; ?>.js"></script>
    <script src="monster_<?php echo $client_version; ?>.js"></script>
    <script src="planet_<?php echo $client_version; ?>.js"></script>
    <script src="player_<?php echo $client_version; ?>.js"></script>


    <link href="//space.alphacoders.com/bulma-0.7.2/css/bulma.min.css" rel="stylesheet" media="screen">
    <script src='//space.alphacoders.com/spectrum.js'></script>
    <link rel='stylesheet' href='//space.alphacoders.com/spectrum.css' />
    <link href="//space.alphacoders.com/fontawesome-pro-5.13.1-web/css/all.css" rel="stylesheet">
    <style type="text/css">


        .white-text {
            color:white;
        }

        a.compact {
            padding: 6px;
        }

        a.main-button {
            padding-top:20px;
            padding-bottom:20px;
        }

        body {
            margin: 0;
        }

        div.chat {
            width:100%; height:100px; background:#e8e8e8; overflow:auto;
        }

        div.chat-container {
            display:block; order: 3; display:none;
        }

        div.flex-wrapper {
            width:100%; display:flex;
        }

        div.game-column {
            width:704px;
        }
        
        div.message-inline {
            display:inline-block;
        }

        div.player_equipment {
            padding:20px;
            margin:10px;
            background-color:white;
            border-radius:8px;
            border: 2px solid #56a7c5;
        }

        div.shown-options {
            background-color: white;
            padding: 10px;
            border: 1px #ababab solid;
            border-radius: 8px;
        }


        i.main-cion {
            padding:4px; border:2px solid black; border-radius:6px;
        }

        span.error-message {
            color: red;
            background-color: black;
            padding: 5px;
            margin: 5px 5px 5px 5px;
            line-height: 2;
        }

        table.assemble {
            display: inline-block;
            margin: 10px;
        }

        td.equipment {
            width:33%;
        }
    </style>
</head>
<body style="background-image: url('https://space.alphacoders.com/void.png'); background-repeat: repeat; height:100%;">



<div id="login_container">

    <div class="columns">
        <div class="column is-half is-offset-one-quarter">
            <br><br><br>
            <div class="message is-info">
                <div class="message-body">
                    <h3 class="is-size-3">Game Login</h3>
                    <form class="form-control" id="login">

                        <div id="login_status">

                        </div>

                        <div class="field">
                            <label class="label">Email</label>
                            <input id="email" type="email" class="input">
                        </div>

                        <div class="field">
                            <label class="label">Player Name</label>
                            <input id="player_name" type="text" class="input">
                        </div>

                        <div class="field">
                            <label class="label">Password</label>
                            <input id="password" type="password" class="input">
                        </div>

                        <button type="submit" class="button is-info">Login</button>

                    </form>
                </div>
            </div>
        </div>
    </div>

</div>



<div id="status_container">
    <div class="columns">
        <div class="column is-half is-offset-one-quarter">
            <br><br><br>
            <div class="message is-success">

                <div class="message-body">
                    <h1 class="is-size-1">Loading and Connecting</h1>
                    This should disappear once the game is loaded, and you have an active connection to the server.
                    If it does not disappear after more than 20 seconds, <a class="button is-warning" href="https://space.alphacoders.com/game.php">Reload the page and Relogin</a><br>
                </div>
            </div>
        </div>
    </div>

</div>

<div id="error_container" style="display:none;">
    <div class="columns">
        <div class="column is-half is-offset-one-quarter">
            <br><br><br>
            <div class="message is-danger">

                <div class="message-body">
                    <h1 class="is-size-1">Disconnected</h1>
                    You have lost your connection to Space Abyss
                    <a class="button is-warning" href="https://space.alphacoders.com/game.php">Reload the page and Relogin</a><br><br>

                    <a href="https://space.alphacoders.com" class="button is-default">Back Home</a>
                </div>
            </div>
        </div>
    </div>

</div>



<div id="wrapper" class="flex-wrapper">

    <div class="game-column">
        <div id="the_game" style="float:left; order: 1;">

        </div>

        <div id="chat_container" class="chat-container">
            <div style="width:100%; display:block; overflow:auto;">
                <button id="chatswitch_local" class="button is-default">Local</button>
                <button id="chatswitch_global" class="button is-default">Global</button>
                <button id="chatswitch_faction" class="button is-default">Faction</button>
                <button id="chatswitch_system" class="button is-default">System</button>
                <button id="help" class="button is-success">Help</button>
                </ul>
            </div>
            <div class="chat" id="chat_local">
                <p>This is local chat - your current planet, or the galaxy</p>
            </div>
            <div class="chat" id="chat_global">
                <p>This is global chat - everyone can see this</p>
            </div>
            <div class="chat" id="chat_faction">
                <p>This is faction chat. Members of your faction can see this.</p>
            </div>
            <div class="chat" id="chat_system">
                <p>This is system chat. System messages like HP amounts show up here.</p>
            </div>


            <form action="">
                <input id="chat_message" autocomplete="off">
                <button onclick="submitChatMessage(); return false;" type="submit">Send</button>
            </form>
        </div>



    </div>
    <div style="flex: 1; order: 2; margin-left:10px; margin-top:10px; height: 100vh; overflow-y: scroll;">

        <!-- Our line of buttons! -->
        <script type="text/javascript">

            function toggleAssembleDisplay() {


                if($("#can_assemble_list").is(":visible")) {
                    $("#can_assemble_list").hide();
                    $("#can_assemble_list").empty();

                } else {
                    $('#can_assemble_list').show();
                    printAssemblyList();
                }

            }

            function toggleFactionDisplay() {


                if($("#faction").is(":visible")) {
                    $("#faction").hide();
                    $("#faction").empty();

                } else {
                    $('#faction').show();
                    generateFactionDisplay();
                }

            }

            function toggleInventoryDisplay() {


                if($("#inventory").is(":visible")) {
                    $("#inventory").hide();
                    $("#inventory").empty();

                } else {
                    $('#inventory').show();
                    generateInventoryDisplay();
                }

            }

            function toggleManagementOptionsDisplay() {
                if($("#management_options").is(":visible")) {
                    $("#management_options").hide();
                    $("#management_options").empty();


                } else {
                    $('#management_options').show();

                    generateManagementOptionsDisplay();

                }
            }

            function toggleManagementDisplay(object_index = -1) {


                if($("#management").is(":visible")) {
                    $("#management").hide();
                    $("#management").empty();
                    
                    //$('#area_management').hide();
                    //$('#area_management').empty();

                    //$('#ship_management').hide();
                    //$('#ship_management').empty();

                } else {
                    $('#management').show();
                    //$('#area_management').show();
                    //$('#ship_management').show();

                    generateNonAiManagementDisplay(object_index);
                    //generateAreaManagementDisplay();
                    //generateShipManagementDisplay();
                }

            }

            function toggleAiManagementDisplay(object_index = -1) {
                if($("#ai_management").is(":visible")) {
                    $("#ai_management").hide();
                    $("#ai_management").empty();


                } else {
                    $('#ai_management').show();

                    generateAiManagementDisplay(object_index);

                }
            }

            function toggleAreaManagementDisplay() {
                if($("#area_management").is(":visible")) {
                    $("#area_management").hide();
                    $("#area_management").empty();


                } else {
                    $('#area_management').show();

                    generateAreaManagementDisplay();

                }
            }

            function togglePlayerEquipmentDisplay() {

                if($("#player_equipment").is(":visible")) {
                    $("#player_equipment").hide();
                    $("#player_equipment").empty();

                } else {
                    $('#player_equipment').show();
                    generateEquipmentDisplay();
                }

            }

            function togglePlayerInfoDisplay() {

                console.log("in togglePlayerInfoDisplay");

                if($("#player_stats").is(":visible")) {
                    $("#player_stats").hide();
                    $("#player_stats").empty();

                } else {
                    $('#player_stats').show();
                    generatePlayerInfoDisplay();
                }

            }

            function toggleRelationshipDisplay() {


                if($("#relationships").is(":visible")) {
                    $("#relationships").hide();
                    $("#relationships").empty();

                } else {
                    $('#relationships').show();
                    generateRelationshipDisplay();
                }

            }

            function toggleResearchDisplay() {


                if($("#research").is(":visible")) {
                    $("#research").hide();
                    $("#research").empty();
                    $('#discoveries').empty();

                } else {
                    $('#research').show();
                    generateResearchDisplay();
                }

            }

            function toggleSettingsDisplay() {
                if($("#settings").is(":visible")) {
                    $("#settings").hide();
                } else {
                    $('#settings').show();
                }
            }

        </script>


        <div class="main-button-wrapper" style="margin-bottom:10px;">
            <a class="button is-default main-button" onclick="toggleInventoryDisplay();">
                <i class="fal fa-backpack fa-2x" class="main-icon"></i>
            </a>

            <a class="button is-default main-button" onclick="togglePlayerEquipmentDisplay();">
                <i class="fas fa-helmet-battle fa-2x" class="main-icon"></i>
            </a>

            <a class="button is-default main-button" onclick="togglePlayerInfoDisplay();">
                <i class="fas fa-book fa-2x" class="main-icon"></i>
            </a>

            <a class="button is-default main-button" onclick="toggleAssembleDisplay();">
                <i class="fas fa-industry-alt fa-2x" class="main-icon"></i>
            </a>

            <a class="button is-default main-button" onclick="toggleResearchDisplay();">
                <i class="fad fa-vials fa-2x" class="main-icon"></i>
            </a>

            <a class="button is-default main-button" onclick="toggleRelationshipDisplay();">
                <i class="fas fa-heartbeat fa-2x" class="main-icon"></i>
            </a>

            <a class="button is-default main-button" onclick="toggleManagementOptionsDisplay();">
                <i class="fas fa-tasks fa-2x" class="main-icon"></i>
            </a>

            <a class="button is-default main-button" onclick="toggleFactionDisplay();">
                <i class="fad fa-users-crown fa-2x" class="main-icon"></i>
            </a>

            <a class="button is-default main-button" onclick="toggleSettingsDisplay();">
                <i class="fad fad fa-cogs fa-2x" class="main-icon"></i>
            </a>


        </div>
        



        <!-- The content of our buttons! -->
        <div>
            <div id="launch" class="message-is-info" style="display:inline-block; margin-top:10px; padding:10px;"></div>

            <div id="inventory" style="margin-bottom:10px;"></div>

            <div id="addiction" class="white-text">

            </div>

            <div id="eating_data" class="white-text">

            </div>

            <!-- starts out invisible -->
            <div id="player_equipment" style="display:none;"></div>

            <div id="player_stats" class="white-text" style="display:none;"></div>

            <div id="can_assemble_list" class="white-text" style="display:none;"></div>

            <div id="research" class="white-text" style="display:none;"></div>
            <div id="discoveries"></div>

            <div id="relationships" class="white-text" style="display:none;"></div>

            <div id="management_options" class="white-text" style="display:none;"></div>

            <div id="object_management" style="display:none; margin-top:10px; margin-left:10px;"></div>

            <div id="ai_management" style="display:none; margin-top:10px; margin-left:10px;"></div>

            <div id="ship_management" style="display:none; margin-top:10px; margin-left:10px;"></div>
            
            <div id="area_management" style="display:none; margin-top:10px; margin-left:10px;"></div>

            <div id="market" style="display:none;"></div>

            <div id="faction" class="white-text" style="display:none;"></div>

            <div id="other_player_data">

            </div>
            <div id="attack_box">

            </div>





            <div id="trade">

            </div>


            <div id="planet_data">

            </div>

            <div id="coord_data" class="white-text">

            </div>
            <div id="object_inventory">
            </div>

            <div id="admin_data">

            </div>


            <div id="settings" class="white-text" style="display:none">
                <div id="players_connected">Grabbing # Of Players Connected</div>
                <br>
                <div id="ping">Ping</div>
                <br>
                <button id="disconnect">Logout Of Game/Disconnect</button>
                <br><br>
                <button id="clear_tiles">Clear Tiles</button>



                <div id="debug_mode">

                </div>
            </div>

        </div>



    </div>






</div>

<script type="text/javascript">
    if(debug_mode) {
        $('#debug_mode').append("Debug Mode True <button id=\"debug_mode\">Toggle Debug Mode</button>");
    } else {
        $('#debug_mode').append("Debug Mode False <button id=\"debug_mode\">Toggle Debug Mode</button>");
    }

</script>



<div id="click_menu" style="background-color:white; border-radius:5px; padding:3px; display:none;">

</div>


</body>
</html>


<script>

    var camera;
    var logged_in = false;
    var connected = false;

    var mouse_x;
    var mouse_y;
    var move_delay = 500;
    //var show_rows = 7;
    //var show_cols = 9;
    var show_rows = 9;
    var show_cols = 11;
    var tile_size = 64;

    var active_assemblies = [];
    var addiction_linkers = [];
    var animations = [];
    var bid_linkers = [];
    var areas = [];
    var assembled_in_linkers = [];
    var attack_boxes = [];
    var battle_linkers = [];
    var can_assemble_list = [];
    var chat_local = [];
    var chat_faction = [];
    var chat_global = [];
    var chat_system = [];

    var coords = [];
    var eating_linkers = [];
    var elevator_linkers = [];
    var equipment_linkers = [];
    var corporations = [];
    var eating_linkers = [];
    var factions = [];
    var floor_types = [];
    var floor_type_assembly_linkers = [];
    var floor_type_display_linkers = [];
    var graphics;
    var info_numbers = [];
    var inventory_items = [];
    var objects = [];
    var market_linkers = [];
    var mining_linkers = [];
    var monsters = [];
    var monster_types = [];
    var next_moves = [];
    var npcs = [];
    var object_types = [];
    var object_type_assembly_linkers = [];
    var object_type_conversion_linkers = [];
    var object_type_display_linkers = [];
    var object_type_equipment_linkers = [];
    var planets = [];
    var planet_coords = [];
    var planet_types = [];
    var planet_type_display_linkers = [];
    var players = [];
    var player_relationship_linkers = [];
    var player_research_linkers = [];
    var races = [];
    var race_eating_linkers = [];
    var recent_failure_messages = [];
    var repairing_linkers = [];
    var researches = [];
    var rules = [];
    var salvaging_linkers = [];
    var ship_coords = [];
    var skin_purchase_linkers = [];
    var user_player_attacking = [];

    var animations;
    var attack_rectangle;
    var current_player_image = false;
    var current_chat = 'local';
    var current_view = 'unknown';
    var level_modifier = 0.10;
    var difficult_level_modifier = 0.20;

    var effect_sprites = [];

    var level_up_music;


    var airlock_display_needs_regeneration = false;
    var client_move_coord_id;
    var client_move_planet_coord_id;
    var client_move_ship_coord_id;
    var client_move_start_time;
    var client_move_pixel_amount = 0;
    var client_player_id;
    var client_player_index = -1;
    var client_player_info;
    var frame_delay = 300;
    var frames_to_idle = 0;
    var on_chest = false;
    var player_image = "Player";
    var pixels_moved = 0;
    var last_failed_move_coord_id = 0;
    var last_frame_update = 0;          // Used for animation our tilemap stuff
    var last_move;
    var last_click_div_move = 0;
    var last_pointer_up = false;
    var page_start_time = Date.now();
    var on_planet = false;
    var max_hp = 100;
    var current_hp = 100;
    var our_time;
    var map_needs_redraw = false;
    var need_to_place_player = true;
    var player_id;
    var player;
    var player_health_bar;
    var cursors;
    var upKey;
    var downKey;
    var leftKey;
    var rightKey;
    var enemy;
    var player_is_moving = false;
    var pointer_down_time = 0;
    var pointer_up_time = 10000;
    var moving_direction = false;
    var spaceport_display_needs_regeneration = false;
    var text_admin;
    var text_admin_time;
    var text_important;
    var text_important_time;
    var total_moved = 0;



    var above_tiles;
    var floor_tiles;
    var last_move_sent = 0;
    var layer_floor;
    var layer_object;
    var layer_being;
    var layer_above;
    var map;
    var monsters;
    var object_tiles;
    var tiles;
    var user_player = false;


    var explosion;
    var explosions;
    var damage_energies;

    var hp_bar_y_offset = 30;
    var chat_mode = 'local';
    $('#chatswitch_local').attr('disabled', true);
    var unread_local_messages = 0;
    var unread_global_messages = 0;
    var unread_faction_messages = 0;
    var unread_system_messages = 0;


    var last_need_coord_data = Math.floor(new Date());







    //console.log(socket);

    var log_success = 'color: #42f471; background-color:black;';
    var log_warning = 'color: #f1f441; background-color:black;';
    var log_danger = 'color: #f44141; background-color:black;';

</script>

<script type="text/javascript">

    var SceneGame = new Phaser.Class({
        Extends: Phaser.Scene,

        initialize:

        function SceneGame() {
            Phaser.Scene.call(this, { key: 'sceneGame', 'active': true });
        },

        preload: function() {

            this.load.image('void', 'https://space.alphacoders.com/void.png');

            // PLAYER SPRITESHEETS - end frame is total frame count
            this.load.spritesheet('player-pod', 'https://space.alphacoders.com/player-pod-animated.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 2 });

            this.load.spritesheet('player-cutter', 'https://space.alphacoders.com/cutter-animated.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 12 });

            this.load.spritesheet('player-galaxy', 'https://space.alphacoders.com/player-galaxy-animated.png',
                { frameWidth: 64, frameHeight: 60, endFrame: 30 });

            this.load.spritesheet('player-human', 'https://space.alphacoders.com/player-human-animated.png',
                { frameWidth: 64, frameHeight: 70, endFrame: 26 });

                
            this.load.spritesheet('player-manufacturing', 'https://space.alphacoders.com/manufacturing-body-animated.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 28 });

            this.load.spritesheet('player-mlm', 'https://space.alphacoders.com/player-mlm-animated.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 36 });

            this.load.spritesheet('player-octopus', 'https://space.alphacoders.com/player-octopus-body-animated.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 30 });

            this.load.spritesheet('player-reinforced-human', 'https://space.alphacoders.com/reinforced-human-body-animated.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 28 });

            this.load.spritesheet('player-ruel', 'https://space.alphacoders.com/ruel-body-animated.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 36 });

            // Ships
            this.load.spritesheet('player-asteroid-ship', 'https://space.alphacoders.com/asteroid-ship-animated.png',
                { 'frameWidth': 64, 'frameHeight': 64, endFrame: 3 });

            this.load.spritesheet('player-blockade-runner', 'https://space.alphacoders.com/blockade-runner-animated.png',
                { 'frameWidth': 64, 'frameHeight': 64, endFrame: 12 });

            this.load.spritesheet('player-shuttle', 'https://space.alphacoders.com/shuttle-animated.png',
                { 'frameWidth': 64, 'frameHeight': 64, endFrame: 16 });

            this.load.spritesheet('player-cargo-ship', 'https://space.alphacoders.com/cargo-ship-animated.png',
                { 'frameWidth': 64, 'frameHeight': 64, endFrame: 16 });

            this.load.spritesheet('player-destroyer', 'https://space.alphacoders.com/destroyer-animated.png',
                { 'frameWidth': 128, 'frameHeight': 128, endFrame: 2 });

            this.load.spritesheet('player-fighter', 'https://space.alphacoders.com/fighter-animated.png',
            { 'frameWidth': 64, 'frameHeight': 64, endFrame: 16 });

            this.load.spritesheet('player-lancer', 'https://space.alphacoders.com/lancer-animated.png',
                { 'frameWidth': 64, 'frameHeight': 64, endFrame: 12 });

            this.load.spritesheet('player-mining-ship', 'https://space.alphacoders.com/mining-ship-animated.png',
                { 'frameWidth': 64, 'frameHeight': 64, endFrame: 16 });

            this.load.spritesheet('player-royal-cruiser', 'https://space.alphacoders.com/royal-cruiser-animated.png',
                { 'frameWidth': 64, 'frameHeight': 128, endFrame: 2 });

            this.load.spritesheet('player-space-station', 'https://space.alphacoders.com/space-station-animated.png',
                { 'frameWidth': 96, 'frameHeight': 96, endFrame: 12});

            // MONSTER SPRITESHEETS - end frame is total frame count
            this.load.spritesheet('acid-fiend', 'https://space.alphacoders.com/acid-fiend.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 3 });
            this.load.spritesheet('acid-fly', 'https://space.alphacoders.com/acid-fly.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 3 });
            this.load.spritesheet('ai-daemon', 'https://space.alphacoders.com/ai-daemon.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 2 });
            this.load.spritesheet('ai-edifice', 'https://space.alphacoders.com/ai-edifice.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 2 });
            this.load.spritesheet('ai-forge', 'https://space.alphacoders.com/ai-forge.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 12 });
            this.load.spritesheet('ai-space-construct', 'https://space.alphacoders.com/ai-space-construct.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 2 });
            this.load.spritesheet('ananke', 'https://space.alphacoders.com/ananke.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 3 });
            this.load.spritesheet('bird', 'https://space.alphacoders.com/bird.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 2 });
            this.load.spritesheet('broken-nanite-cluster', 'https://space.alphacoders.com/broken-nanite-cluster.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 3 });
            this.load.spritesheet('carnivorous-plant-baby', 'https://space.alphacoders.com/carnivorous-plant-baby.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 2 });
            this.load.spritesheet('corrupted-scientist', 'https://space.alphacoders.com/corrupted-scientist.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 12 });
            this.load.spritesheet('crab-slerm', 'https://space.alphacoders.com/crab-slerm.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 3 });
            this.load.spritesheet('crystal-bee', 'https://space.alphacoders.com/crystal-bee.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 12 });
            this.load.spritesheet('crystal-spider', 'https://space.alphacoders.com/crystal-spider.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 4 });
            this.load.spritesheet('crystal-spider-baby', 'https://space.alphacoders.com/crystal-spider-baby.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 7 });
            this.load.spritesheet('crystal-golem', 'https://space.alphacoders.com/crystal-golem.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 12 });
            this.load.spritesheet('cyberskell', 'https://space.alphacoders.com/cyberskell.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 2 });
            this.load.spritesheet('ddrone', 'https://space.alphacoders.com/ddrone.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 19 });
            this.load.spritesheet('geno-rat', 'https://space.alphacoders.com/geno-rat.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 3 });
            this.load.spritesheet('glitched-god', 'https://space.alphacoders.com/glitched-god.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 2 });
            this.load.spritesheet('legend', 'https://space.alphacoders.com/legend.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 2 });
            this.load.spritesheet('living-tree', 'https://space.alphacoders.com/living-tree.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 2 });
            this.load.spritesheet('macro-virus', 'https://space.alphacoders.com/nano-virus.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 2 });
            this.load.spritesheet('mag-dust', 'https://space.alphacoders.com/mag-dust.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 6 });
            this.load.spritesheet('matriarch', 'https://space.alphacoders.com/matriarch.png',
                { frameWidth: 64, frameHeight: 128, endFrame: 3 });
            this.load.spritesheet('milk-slerm', 'https://space.alphacoders.com/milk-slerm.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 6 });
            this.load.spritesheet('mini-drone', 'https://space.alphacoders.com/mini-drone.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 7 });
            this.load.spritesheet('monitor', 'https://space.alphacoders.com/monitor.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 2 });

            this.load.spritesheet('process', 'https://space.alphacoders.com/process.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 6 });
            this.load.spritesheet('robot-janitor', 'https://space.alphacoders.com/robot-janitor.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 4 });
            this.load.spritesheet('scrapslog', 'https://space.alphacoders.com/scrapslog.png',
                { frameWidth: 68, frameHeight: 68, endFrame: 16 });
            this.load.spritesheet('slave', 'https://space.alphacoders.com/slave.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 1 });
            this.load.spritesheet('slaver', 'https://space.alphacoders.com/slaver.png',
                { frameWidth: 76, frameHeight: 76, endFrame: 4 });
            this.load.spritesheet('slaver-guard', 'https://space.alphacoders.com/slaver-guard.png',
                { frameWidth: 72, frameHeight: 76, endFrame: 4 });
            this.load.spritesheet('snail', 'https://space.alphacoders.com/snail.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 2 });
            this.load.spritesheet('spider', 'https://space.alphacoders.com/spider.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 3 });
            this.load.spritesheet('smasher', 'https://space.alphacoders.com/smasher.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 2 });
            this.load.spritesheet('suut', 'https://space.alphacoders.com/suut.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 2 });
            this.load.spritesheet('tortured-soul', 'https://space.alphacoders.com/tortured-soul.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 3 });
            this.load.spritesheet('transporter', 'https://space.alphacoders.com/transporter.png?234',
                { frameWidth: 64, frameHeight: 64, endFrame: 2 });
            this.load.spritesheet('voon-guardian', 'https://space.alphacoders.com/voon-guardian.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 1 });
            this.load.spritesheet('voonita', 'https://space.alphacoders.com/voonita.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 2 });
            this.load.spritesheet('vueg-baby', 'https://space.alphacoders.com/vueg-baby.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 3 });
            this.load.spritesheet('warmind', 'https://space.alphacoders.com/warmind.png',
                { frameWidth: 64, frameHeight: 96, endFrame: 3 });
            this.load.spritesheet('world-leech', 'https://space.alphacoders.com/world-leech.png',
                { frameWidth: 128, frameHeight: 128, endFrame: 2 });
            this.load.spritesheet('young-slerm', 'https://space.alphacoders.com/young-slerm.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 3 });


            // NPC
            this.load.spritesheet('npc', 'https://space.alphacoders.com/npc.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 2 });
            this.load.spritesheet('npc-pod', 'https://space.alphacoders.com/npc-pod-animated.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 2 });
            this.load.spritesheet('bug-ship', 'https://space.alphacoders.com/bug-ship-animated.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 4 });

            // EFFECTS!!! - END FRAME IS THE TOTAL FRAME COUNT

            this.load.spritesheet('addiction-effect', 'https://space.alphacoders.com/addiction-effect.png', {
               frameWidth: 64, frameHeight: 128, endFrame: 8
            });

            this.load.spritesheet('blocked-effect', 'https://space.alphacoders.com/blocked-effect.png', {
                frameWidth: 64, frameHeight: 64, endFrame: 7
            });

            this.load.spritesheet('electric-effect', 'https://space.alphacoders.com/electric-effect.png', {
                frameWidth: 64, frameHeight: 64, endFrame: 6
            });

            this.load.spritesheet('explosion-effect', 'https://space.alphacoders.com/explosion-effect.png', {
                frameWidth: 64, frameHeight: 64, endFrame: 12
            });

            this.load.spritesheet('energy-effect', 'https://space.alphacoders.com/energy_hit.png', {
                frameWidth: 64, frameHeight: 64, endFrame: 4
            });

            this.load.spritesheet('fire-effect', 'https://space.alphacoders.com/Fire0.png', {
                frameWidth: 64, frameHeight: 128, endFrame: 8
            });

            this.load.spritesheet('hacking-effect', 'https://space.alphacoders.com/hacking-effect.png', {
                frameWidth: 64, frameHeight: 64, endFrame: 12
            });

            this.load.spritesheet('healing-effect', 'https://space.alphacoders.com/healing-effect.png', {
                frameWidth: 64, frameHeight: 64, endFrame: 5
            });

            this.load.spritesheet('heat-effect', 'https://space.alphacoders.com/heat-effect.png', {
                frameWidth: 64, frameHeight: 64, endFrame: 3
            });

            this.load.spritesheet('gravity-effect', 'https://space.alphacoders.com/gravity-effect.png', {
                frameWidth: 64, frameHeight: 64, endFrame: 3
            });

            this.load.spritesheet('laser-effect', 'https://space.alphacoders.com/laser-effect.png', {
                frameWidth: 64, frameHeight: 64, endFrame: 3
            });

            this.load.spritesheet('melee-effect', 'https://space.alphacoders.com/melee-effect.png', {
                frameWidth: 64, frameHeight: 64, endFrame: 9
            });

            this.load.spritesheet('piercing-effect', 'https://space.alphacoders.com/piercing-effect.png', {
                frameWidth: 64, frameHeight: 64, endFrame: 5
            });

            this.load.spritesheet('poison-effect', 'https://space.alphacoders.com/poison-effect.png', {
               frameWidth: 64, frameHeight: 128, endFrame: 8
            });

            /* Old mining
            this.load.spritesheet('mining', 'https://space.alphacoders.com/mining.png', {
               frameWidth: 64, frameHeight: 64, endFrame: 11
            });
            */
            this.load.spritesheet('radiation-effect', 'https://space.alphacoders.com/radiation-effect.png', {
               frameWidth: 64, frameHeight: 128, endFrame: 8
            });

            this.load.spritesheet('repairing-effect', 'https://space.alphacoders.com/repairing.png', {
                frameWidth: 16, frameHeight: 80, endFrame: 11
            });


            // For the time being, we are keeping mining and salvaging separate. Probably
            // should combine them at some point
            this.load.spritesheet('mining-effect', 'https://space.alphacoders.com/mining-beam.png', {
                frameWidth: 192, frameHeight: 64, endFrame: 6
            });


            this.load.spritesheet('salvaging-effect', 'https://space.alphacoders.com/salvaging-beam.png', {
                frameWidth: 256, frameHeight: 64, endFrame: 6
            });


            // THE MAIN GAME!!! OBJECTS AND PLAYERS
            this.load.spritesheet('above-images', 'https://space.alphacoders.com/above-images.png?334',
                { frameWidth: 64, frameHeight: 64 });
            this.load.spritesheet('floor-images', 'https://space.alphacoders.com/floor-images.png',
                { frameWidth: 64, frameHeight: 64 });
            this.load.spritesheet('object-images', 'https://space.alphacoders.com/object-images.png?233',
                { frameWidth: 64, frameHeight: 64 });



            // attack effects

            this.load.spritesheet('damage_energies_sheet', 'https://space.alphacoders.com/energy-hit.png',
                { frameWidth: 64, frameHeight: 64, endFrame: 3 });




            this.load.image('attack_box', 'https://space.alphacoders.com/attack_box.png');


            // Lets try some audio stuff
            this.load.audio('level-up', ['https://space.alphacoders.com/level-up.wav']);
        },

        create: function() {

            // initialize basic controls and camera
            this.input.mouse.disableContextMenu();

            void_tile = this.add.tileSprite(400, 300, 800, 600, 'void');
            void_tile.setScrollFactor(0);

            camera = this.cameras.main;
            //cursors = this.input.keyboard.createCursorKeys();
            upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
            downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
            leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
            rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);


            graphics = this.add.graphics( { fillStyle: { color: 0x44fc62 } });

            // add in tilemaps
            map = this.make.tilemap({ width: 100, height: 100, tileWidth: 64, tileHeight: 64 });
            above_tiles = map.addTilesetImage('above-images', null, 64, 64);
            floor_tiles = map.addTilesetImage('floor-images', null, 64, 64);
            object_tiles = map.addTilesetImage('object-images', null, 64, 64);
            //tiles = map.addTilesetImage('game_images', null, 64, 128);
            layer_floor = map.createBlankDynamicLayer('layer_floor', floor_tiles);
            layer_object = map.createBlankDynamicLayer('layer_object', object_tiles);
            //layer_being = map.createBlankDynamicLayer('layer_being', tiles);
            layer_above = map.createBlankDynamicLayer('layer_above', above_tiles);
            layer_above.setDepth(10);


            /*********** ANINMATIONS ***************/



            /*********** PLAYER ANIMATIONS end is total frame count - 1 (starts at 0)  **************/


            // Asteroid Ship
            let player_asteroid_ship_config = {
                key: 'player-asteroid-ship-animation',
                frames: this.anims.generateFrameNumbers('player-asteroid-ship', { start: 0, end: 2, first: 2 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(player_asteroid_ship_config);

            // BLOCKADE RUNNER
            let player_blockade_runner_left_config = {
                key: 'player-blockade-runner-left-animation',
                frames: this.anims.generateFrameNumbers('player-blockade-runner', { start: 0, end: 2, first: 2 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_blockade_runner_left_config);

            let player_blockade_runner_right_config = {
                key: 'player-blockade-runner-right-animation',
                frames: this.anims.generateFrameNumbers('player-blockade-runner', { start: 3, end: 5, first: 5 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_blockade_runner_right_config);

            let player_blockade_runner_up_config = {
                key: 'player-blockade-runner-up-animation',
                frames: this.anims.generateFrameNumbers('player-blockade-runner', { start: 6, end: 8, first: 8 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_blockade_runner_up_config);

            let player_blockade_runner_down_config = {
                key: 'player-blockade-runner-down-animation',
                frames: this.anims.generateFrameNumbers('player-blockade-runner', { start: 9, end: 11, first: 11 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_blockade_runner_down_config);


            // CARGO SHIP
            let player_cargo_ship_left_config = {
                key: 'player-cargo-ship-left-animation',
                frames: this.anims.generateFrameNumbers('player-cargo-ship', { start: 0, end: 3, first: 3 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_cargo_ship_left_config);

            let player_cargo_ship_right_config = {
                key: 'player-cargo-ship-right-animation',
                frames: this.anims.generateFrameNumbers('player-cargo-ship', { start: 4, end: 7, first: 7 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_cargo_ship_right_config);

            let player_cargo_ship_up_config = {
                key: 'player-cargo-ship-up-animation',
                frames: this.anims.generateFrameNumbers('player-cargo-ship', { start: 8, end: 11, first: 11 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_cargo_ship_up_config);

            let player_cargo_ship_down_config = {
                key: 'player-cargo-ship-down-animation',
                frames: this.anims.generateFrameNumbers('player-cargo-ship', { start: 12, end: 15, first: 15 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_cargo_ship_down_config);


            // PLAYER CUTTER
            let player_cutter_left_config = {
                key: 'player-cutter-left-animation',
                frames: this.anims.generateFrameNumbers('player-cutter', { start: 0, end: 2, first: 2 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_cutter_left_config);

            let player_cutter_right_config = {
                key: 'player-cutter-right-animation',
                frames: this.anims.generateFrameNumbers('player-cutter', { start: 3, end: 5, first: 5 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_cutter_right_config);

            let player_cutter_up_config = {
                key: 'player-cutter-up-animation',
                frames: this.anims.generateFrameNumbers('player-cutter', { start: 6, end: 8, first: 8 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_cutter_up_config);

            let player_cutter_down_config = {
                key: 'player-cutter-down-animation',
                frames: this.anims.generateFrameNumbers('player-cutter', { start: 9, end: 11, first: 11 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_cutter_down_config);



            // PLAYER DESTROYER
            let player_destroyer_up_config = {
                key: 'player-destroyer-up-animation',
                frames: this.anims.generateFrameNumbers('player-destroyer', { start: 0, end: 0, first: 0 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(player_destroyer_up_config);

            let player_destroyer_down_config = {
                key: 'player-destroyer-down-animation',
                frames: this.anims.generateFrameNumbers('player-destroyer', { start: 0, end: 0, first: 0 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(player_destroyer_down_config);

            let player_destroyer_left_config = {
                key: 'player-destroyer-left-animation',
                frames: this.anims.generateFrameNumbers('player-destroyer', { start: 1, end: 1, first: 1 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(player_destroyer_left_config);

            let player_destroyer_right_config = {
                key: 'player-destroyer-right-animation',
                frames: this.anims.generateFrameNumbers('player-destroyer', { start: 1, end: 1, first: 1 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(player_destroyer_right_config);


            // PLAYER FIGHTER (A SHIP!)
            let player_fighter_left_config = {
                key: 'player-fighter-left-animation',
                frames: this.anims.generateFrameNumbers('player-fighter', { start: 0, end: 3, first: 3 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_fighter_left_config);

            let player_fighter_right_config = {
                key: 'player-fighter-right-animation',
                frames: this.anims.generateFrameNumbers('player-fighter', { start: 4, end: 7, first: 7 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_fighter_right_config);

            let player_fighter_up_config = {
                key: 'player-fighter-up-animation',
                frames: this.anims.generateFrameNumbers('player-fighter', { start: 8, end: 11, first: 11 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_fighter_up_config);

            let player_fighter_down_config = {
                key: 'player-fighter-down-animation',
                frames: this.anims.generateFrameNumbers('player-fighter', { start: 12, end: 15, first: 15 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_fighter_down_config);


            // PLAYER HUMAN

            /*
            let player_human_config = {
                key: 'player-human-animation',
                frames: this.anims.generateFrameNumbers('player-human', { start: 0, end: 3, first: 3 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_human_config);
            */

            let player_human_idle_config = {
                key: 'player-human-idle-animation',
                frames: this.anims.generateFrameNumbers('player-human', { start: 0, end: 3, first: 3 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_human_idle_config);


            let player_human_left_config = {
                key: 'player-human-left-animation',
                frames: this.anims.generateFrameNumbers('player-human', { start: 4, end: 8, first: 4 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_human_left_config);

            let player_human_right_config = {
                key: 'player-human-right-animation',
                frames: this.anims.generateFrameNumbers('player-human', { start: 9, end: 13, first: 13 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_human_right_config);

            let player_human_up_config = {
                key: 'player-human-up-animation',
                frames: this.anims.generateFrameNumbers('player-human', { start: 14, end: 19, first: 19 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_human_up_config);

            let player_human_down_config = {
                key: 'player-human-down-animation',
                frames: this.anims.generateFrameNumbers('player-human', { start: 20, end: 25, first: 25 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_human_down_config);


            // PLAYER GALAXY

            let player_galaxy_idle_config = {
                key: 'player-galaxy-idle-animation',
                frames: this.anims.generateFrameNumbers('player-galaxy', { start: 0, end: 5, first: 5 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_galaxy_idle_config);


            let player_galaxy_left_config = {
                key: 'player-galaxy-left-animation',
                frames: this.anims.generateFrameNumbers('player-galaxy', { start: 6, end: 11, first: 11 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_galaxy_left_config);

            let player_galaxy_right_config = {
                key: 'player-galaxy-right-animation',
                frames: this.anims.generateFrameNumbers('player-galaxy', { start: 12, end: 17, first: 17 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_galaxy_right_config);

            let player_galaxy_up_config = {
                key: 'player-galaxy-up-animation',
                frames: this.anims.generateFrameNumbers('player-galaxy', { start: 18, end: 23, first: 23 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_galaxy_up_config);

            let player_galaxy_down_config = {
                key: 'player-galaxy-down-animation',
                frames: this.anims.generateFrameNumbers('player-galaxy', { start: 24, end: 29, first: 29 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_galaxy_down_config);


            // LANCER
            let player_lancer_left_config = {
                key: 'player-lancer-left-animation',
                frames: this.anims.generateFrameNumbers('player-lancer', { start: 0, end: 2, first: 2 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_lancer_left_config);

            let player_lancer_right_config = {
                key: 'player-lancer-right-animation',
                frames: this.anims.generateFrameNumbers('player-lancer', { start: 3, end: 5, first: 5 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_lancer_right_config);

            let player_lancer_up_config = {
                key: 'player-lancer-up-animation',
                frames: this.anims.generateFrameNumbers('player-lancer', { start: 6, end: 8, first: 8 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_lancer_up_config);

            let player_lancer_down_config = {
                key: 'player-lancer-down-animation',
                frames: this.anims.generateFrameNumbers('player-lancer', { start: 9, end: 11, first: 11 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_lancer_down_config);

            // PLAYER MINING SHIP

            let player_mining_ship_left_config = {
                key: 'player-mining-ship-left-animation',
                frames: this.anims.generateFrameNumbers('player-mining-ship', { start: 0, end: 3, first: 3 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_mining_ship_left_config);

            let player_mining_ship_right_config = {
                key: 'player-mining-ship-right-animation',
                frames: this.anims.generateFrameNumbers('player-mining-ship', { start: 4, end: 7, first: 7 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_mining_ship_right_config);

            let player_mining_ship_up_config = {
                key: 'player-mining-ship-up-animation',
                frames: this.anims.generateFrameNumbers('player-mining-ship', { start: 8, end: 11, first: 11 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_mining_ship_up_config);

            let player_mining_ship_down_config = {
                key: 'player-mining-ship-down-animation',
                frames: this.anims.generateFrameNumbers('player-mining-ship', { start: 12, end: 15, first: 15 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_mining_ship_down_config);



            // PLAYER MANUFACTURING

            let player_manufacturing_idle_config = {
                key: 'player-manufacturing-idle-animation',
                frames: this.anims.generateFrameNumbers('player-manufacturing', { start: 0, end: 3, first: 3 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_manufacturing_idle_config);


            let player_manufacturing_left_config = {
                key: 'player-manufacturing-left-animation',
                frames: this.anims.generateFrameNumbers('player-manufacturing', { start: 4, end: 9, first: 9 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_manufacturing_left_config);

            let player_manufacturing_right_config = {
                key: 'player-manufacturing-right-animation',
                frames: this.anims.generateFrameNumbers('player-manufacturing', { start: 10, end: 15, first: 15 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_manufacturing_right_config);

            let player_manufacturing_up_config = {
                key: 'player-manufacturing-up-animation',
                frames: this.anims.generateFrameNumbers('player-manufacturing', { start: 16, end: 21, first: 21 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_manufacturing_up_config);

            let player_manufacturing_down_config = {
                key: 'player-manufacturing-down-animation',
                frames: this.anims.generateFrameNumbers('player-manufacturing', { start: 22, end: 27, first: 27 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_manufacturing_down_config);






            // PLAYER MLM

            let player_mlm_idle_config = {
                key: 'player-mlm-idle-animation',
                frames: this.anims.generateFrameNumbers('player-mlm', { start: 0, end: 11, first: 11 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_mlm_idle_config);


            let player_mlm_left_config = {
                key: 'player-mlm-left-animation',
                frames: this.anims.generateFrameNumbers('player-mlm', { start: 12, end: 17, first: 17 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_mlm_left_config);

            let player_mlm_right_config = {
                key: 'player-mlm-right-animation',
                frames: this.anims.generateFrameNumbers('player-mlm', { start: 18, end: 23, first: 23 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_mlm_right_config);

            let player_mlm_up_config = {
                key: 'player-mlm-up-animation',
                frames: this.anims.generateFrameNumbers('player-mlm', { start: 24, end: 29, first: 29 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_mlm_up_config);

            let player_mlm_down_config = {
                key: 'player-mlm-down-animation',
                frames: this.anims.generateFrameNumbers('player-mlm', { start: 30, end: 35, first: 35 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_mlm_down_config);


            // PLAYER OCTOPUS

            let player_octopus_idle_config = {
                key: 'player-octopus-idle-animation',
                frames: this.anims.generateFrameNumbers('player-octopus', { start: 0, end: 5, first: 5 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_octopus_idle_config);


            let player_octopus_left_config = {
                key: 'player-octopus-left-animation',
                frames: this.anims.generateFrameNumbers('player-octopus', { start: 6, end: 11, first: 11 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_octopus_left_config);

            let player_octopus_right_config = {
                key: 'player-octopus-right-animation',
                frames: this.anims.generateFrameNumbers('player-octopus', { start: 12, end: 17, first: 17 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_octopus_right_config);

            let player_octopus_up_config = {
                key: 'player-octopus-up-animation',
                frames: this.anims.generateFrameNumbers('player-octopus', { start: 18, end: 23, first: 23 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_octopus_up_config);

            let player_octopus_down_config = {
                key: 'player-octopus-down-animation',
                frames: this.anims.generateFrameNumbers('player-octopus', { start: 24, end: 29, first: 29 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_octopus_down_config);


            // PLAYER POD

            let player_pod_config = {
                key: 'player-pod-animation',
                frames: this.anims.generateFrameNumbers('player-pod', { start: 0, end: 1, first: 1 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_pod_config);



            // PLAYER REINFORCED HUMAN
            let player_reinforced_human_idle_config = {
                key: 'player-reinforced-human-idle-animation',
                frames: this.anims.generateFrameNumbers('player-reinforced-human', { start: 0, end: 3, first: 3 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_reinforced_human_idle_config);


            let player_reinforced_human_left_config = {
                key: 'player-reinforced-human-left-animation',
                frames: this.anims.generateFrameNumbers('player-reinforced-human', { start: 4, end: 9, first: 9 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_reinforced_human_left_config);

            let player_reinforced_human_right_config = {
                key: 'player-reinforced-human-right-animation',
                frames: this.anims.generateFrameNumbers('player-reinforced-human', { start: 10, end: 15, first: 15 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_reinforced_human_right_config);

            let player_reinforced_human_up_config = {
                key: 'player-reinforced-human-up-animation',
                frames: this.anims.generateFrameNumbers('player-reinforced-human', { start: 16, end: 21, first: 21 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_reinforced_human_up_config);

            let player_reinforced_human_down_config = {
                key: 'player-reinforced-human-down-animation',
                frames: this.anims.generateFrameNumbers('player-reinforced-human', { start: 22, end: 27, first: 27 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_reinforced_human_down_config);


            // PLAYER ROYAL CRUISER

            let player_royal_cruiser_config = {
                key: 'player-royal_cruiser-animation',
                frames: this.anims.generateFrameNumbers('player-royal-cruiser', { start: 0, end: 0, first: 0 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(player_royal_cruiser_config);



          


            // PLAYER RUEL

            let player_ruel_idle_config = {
                key: 'player-ruel-idle-animation',
                frames: this.anims.generateFrameNumbers('player-ruel', { start: 0, end: 11, first: 11 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_ruel_idle_config);


            let player_ruel_left_config = {
                key: 'player-ruel-left-animation',
                frames: this.anims.generateFrameNumbers('player-ruel', { start: 12, end: 17, first: 17 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_ruel_left_config);

            let player_ruel_right_config = {
                key: 'player-ruel-right-animation',
                frames: this.anims.generateFrameNumbers('player-ruel', { start: 18, end: 23, first: 23 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_ruel_right_config);

            let player_ruel_up_config = {
                key: 'player-ruel-up-animation',
                frames: this.anims.generateFrameNumbers('player-ruel', { start: 24, end: 29, first: 29 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_ruel_up_config);

            let player_ruel_down_config = {
                key: 'player-ruel-down-animation',
                frames: this.anims.generateFrameNumbers('player-ruel', { start: 30, end: 35, first: 35 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(player_ruel_down_config);
            
            
            // PLAYER SHUTTLE

            let player_shuttle_left_config = {
                key: 'player-shuttle-left-animation',
                frames: this.anims.generateFrameNumbers('player-shuttle', { start: 0, end: 3, first: 3 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_shuttle_left_config);

            let player_shuttle_right_config = {
                key: 'player-shuttle-right-animation',
                frames: this.anims.generateFrameNumbers('player-shuttle', { start: 4, end: 7, first: 7 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_shuttle_right_config);

            let player_shuttle_up_config = {
                key: 'player-shuttle-up-animation',
                frames: this.anims.generateFrameNumbers('player-shuttle', { start: 8, end: 11, first: 11 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_shuttle_up_config);

            let player_shuttle_down_config = {
                key: 'player-shuttle-down-animation',
                frames: this.anims.generateFrameNumbers('player-shuttle', { start: 12, end: 15, first: 15 }),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(player_shuttle_down_config);


            let player_space_station_config = {
                key: 'player-space-station-animation',
                frames: this.anims.generateFrameNumbers('player-space-station', { start: 0, end: 11, first: 11 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(player_space_station_config);






            /******************* MONSTER ANIMATIONS - end is total frame count - 1 (starts at 0) **************/

            let acid_fiend_config = {
                key: 'acid-fiend-animation',
                frames: this.anims.generateFrameNumbers('acid-fiend', { start: 0, end: 2, first: 2 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(acid_fiend_config);

            let acid_fly_config = {
                key: 'acid-fly-animation',
                frames: this.anims.generateFrameNumbers('acid-fly', { start: 0, end: 2, first: 2 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(acid_fly_config);

            let ai_daemon_config = {
                key: 'ai-daemon-animation',
                frames: this.anims.generateFrameNumbers('ai-daemon', { start: 0, end: 1, first: 1 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(ai_daemon_config);

            let ai_edifice_config = {
                key: 'ai-edifice-animation',
                frames: this.anims.generateFrameNumbers('ai-edifice', { start: 0, end: 1, first: 1 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(ai_edifice_config);

            let ai_forge_config = {
                key: 'ai-forge-animation',
                frames: this.anims.generateFrameNumbers('ai-forge', { start: 0, end: 11, first: 11 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(ai_forge_config);

            let ai_space_construct_config = {
                key: 'ai-space-construct-animation',
                frames: this.anims.generateFrameNumbers('ai-space-construct', { start: 0, end: 3, first: 3 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(ai_space_construct_config);

            let ananke_config = {
                key: 'ananke-animation',
                frames: this.anims.generateFrameNumbers('ananke', { start: 0, end: 2, first: 2 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(ananke_config);

            let bird_config = {
                key: 'bird-animation',
                frames: this.anims.generateFrameNumbers('bird', { start: 0, end: 1, first: 1 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(bird_config);

            let broken_nanite_cluster_config = {
                key: 'broken-nanite-cluster-animation',
                frames: this.anims.generateFrameNumbers('broken-nanite-cluster', { start: 0, end: 3, first: 3 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(broken_nanite_cluster_config);


            let carnivorous_plant_baby_config = {
                key: 'carnivorous-plant-baby-animation',
                frames: this.anims.generateFrameNumbers('carnivorous-plant-baby', { start: 0, end: 1, first: 1 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(carnivorous_plant_baby_config);

            let corrupted_scientist_config = {
                key: 'corrupted-scientist-animation',
                frames: this.anims.generateFrameNumbers('corrupted-scientist', { start: 0, end: 11, first: 11 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(corrupted_scientist_config);

            let crab_slerm_config = {
                key: 'crab-slerm-animation',
                frames: this.anims.generateFrameNumbers('crab-slerm', { start: 0, end: 2, first: 2 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(crab_slerm_config);

            let crystal_spider_config = {
                key: 'crystal-spider-animation',
                frames: this.anims.generateFrameNumbers('crystal-spider', { start: 0, end: 3, first: 3 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(crystal_spider_config);


            let crystal_bee_config = {
                key: 'crystal-bee-animation',
                frames: this.anims.generateFrameNumbers('crystal-bee', { start: 0, end: 11, first: 11 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(crystal_bee_config);

            let crystal_golem_config = {
                key: 'crystal-golem-animation',
                frames: this.anims.generateFrameNumbers('crystal-golem', { start: 0, end: 11, first: 11 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(crystal_golem_config);

            let crystal_spider_baby_config = {
                key: 'crystal-spider-baby-animation',
                frames: this.anims.generateFrameNumbers('crystal-spider-baby', { start: 0, end: 6, first: 6 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(crystal_spider_baby_config);

            let cyberskell_config = {
                key: 'cyberskell-animation',
                frames: this.anims.generateFrameNumbers('cyberskell', { start: 0, end: 1, first: 1 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(cyberskell_config);

            let ddrone_config = {
                key: 'ddrone-animation',
                frames: this.anims.generateFrameNumbers('ddrone', { start: 0, end: 18, first: 18 }),
                frameRate: 6,
                repeat: -1
            };
            this.anims.create(ddrone_config);

            let geno_rat_config = {
                key: 'geno-rat-animation',
                frames: this.anims.generateFrameNumbers('geno-rat', { start: 0, end: 2, first: 2 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(geno_rat_config);

            let legend_config = {
                key: 'legend-animation',
                frames: this.anims.generateFrameNumbers('legend', { start: 0, end: 1, first: 1 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(legend_config);

            let living_tree_config = {
                key: 'living-tree-animation',
                frames: this.anims.generateFrameNumbers('living-tree', { start: 0, end: 1, first: 1 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(living_tree_config);

            let macro_virus_config = {
                key: 'macro-virus-animation',
                frames: this.anims.generateFrameNumbers('macro-virus', { start: 0, end: 1, first: 1 }),
                frameRate: 5,
                repeat: -1
            };
            this.anims.create(macro_virus_config);

            let matriarch_config = {
                key: 'matriarch-animation',
                frames: this.anims.generateFrameNumbers('matriarch', { start: 0, end: 2, first: 2 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(matriarch_config);

            let mag_dust_config = {
                key: 'mag-dust-animation',
                frames: this.anims.generateFrameNumbers('mag-dust', { start: 0, end: 5, first: 5 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(mag_dust_config);

            let milk_slerm_config = {
                key: 'milk-slerm-animation',
                frames: this.anims.generateFrameNumbers('milk-slerm', { start: 0, end: 5, first: 5 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(milk_slerm_config);

            let mini_drone_config = {
                key: 'mini-drone-animation',
                frames: this.anims.generateFrameNumbers('mini-drone', { start: 0, end: 6, first: 6 }),
                frameRate: 6,
                repeat: -1
            };
            this.anims.create(mini_drone_config);

            let monitor_config = {
                key: 'monitor-animation',
                frames: this.anims.generateFrameNumbers('monitor', { start: 0, end: 1, first: 1 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(monitor_config);



            let process_config = {
                key: 'process-animation',
                frames: this.anims.generateFrameNumbers('process', { start: 0, end: 5, first: 5 }),
                frameRate: 6,
                repeat: -1
            };
            this.anims.create(process_config);

            let robot_janitor_config = {
                key: 'robot-janitor-animation',
                frames: this.anims.generateFrameNumbers('robot-janitor', { start: 0, end: 3, first: 3 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(robot_janitor_config);

            let scrapslog_config = {
                key: 'scrapslog-animation',
                frames: this.anims.generateFrameNumbers('scrapslog', { start: 0, end: 15, first: 15 }),
                frameRate: 6,
                repeat: -1
            };
            this.anims.create(scrapslog_config);

            let slave_config = {
                key: 'slave-animation',
                frames: this.anims.generateFrameNumbers('slave', { start: 0, end: 0, first: 0 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(slave_config);

            let slaver_config = {
                key: 'slaver-animation',
                frames: this.anims.generateFrameNumbers('slaver', { start: 0, end: 3, first: 3 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(slaver_config);


            let slaver_guard_config = {
                key: 'slaver-guard-animation',
                frames: this.anims.generateFrameNumbers('slaver-guard', { start: 0, end: 3, first: 3 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(slaver_guard_config);

            let snail_config = {
                key: 'snail-animation',
                frames: this.anims.generateFrameNumbers('snail', { start: 0, end: 1, first: 1 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(snail_config);

            let spider_config = {
                key: 'spider-animation',
                frames: this.anims.generateFrameNumbers('spider', { start: 0, end: 2, first: 2 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(spider_config);

            let suut_config = {
                key: 'suut-animation',
                frames: this.anims.generateFrameNumbers('suut', { start: 0, end: 1, first: 1 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(suut_config);


            let tortured_soul_config = {
                key: 'tortured-soul-animation',
                frames: this.anims.generateFrameNumbers('tortured-soul', { start: 0, end: 2, first: 2 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(tortured_soul_config);


            let transporter_config = {
                key: 'transporter-animation',
                frames: this.anims.generateFrameNumbers('transporter', { start: 0, end: 2, first: 2 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(transporter_config);

            let voon_guardian_config = {
                key: 'voon-guardian-animation',
                frames: this.anims.generateFrameNumbers('voon-guardian', { start: 0, end: 1, first: 1 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(voon_guardian_config);

            let voonita_config = {
                key: 'voonita-animation',
                frames: this.anims.generateFrameNumbers('voonita', { start: 0, end: 1, first: 1 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(voonita_config);

            let vueg_baby_config = {
                key: 'vueg-baby-animation',
                frames: this.anims.generateFrameNumbers('vueg-baby', { start: 0, end: 2, first: 2 }),
                frameRate: 4,
                repeat: -1
            };
            this.anims.create(vueg_baby_config);

            let warmind_config = {
                key: 'warmind-animation',
                frames: this.anims.generateFrameNumbers('warmind', { start: 0, end: 2, first: 2 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(warmind_config);

            let world_leech_config = {
                key: 'world-leech-animation',
                frames: this.anims.generateFrameNumbers('world-leech', { start: 0, end: 1, first: 1 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(world_leech_config);

            let young_slerm_config = {
                key: 'young-slerm-animation',
                frames: this.anims.generateFrameNumbers('young-slerm', { start: 0, end: 2, first: 2 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(young_slerm_config);


            // NPCS
            let npc_config = {
                key: 'npc-animation',
                frames: this.anims.generateFrameNumbers('npc', { start: 0, end: 1, first: 1 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(npc_config);

            let npc_pod_config = {
                key: 'npc-pod-animation',
                frames: this.anims.generateFrameNumbers('npc-pod', { start: 0, end: 1, first: 1 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(npc_pod_config);

            let bug_ship_config = {
                key: 'bug-ship-animation',
                frames: this.anims.generateFrameNumbers('bug-ship', { start: 0, end: 3, first: 3 }),
                frameRate: 2,
                repeat: -1
            };
            this.anims.create(bug_ship_config);



            // EFFECTS - END IS TOTAL # of FRAMES - 1 SINCE WE START AT 0

            var addiction_effect_config = {
                key: 'addiction-effect-animation',
                frames: this.anims.generateFrameNumbers('addiction-effect', { start: 0, end: 7, first: 0 } ),
                frameRate: 10,
                hideOnComplete: true
            };

            this.anims.create(addiction_effect_config);

            var blocked_config = {
                key: 'blocked-effect-animation',
                frames: this.anims.generateFrameNumbers('blocked-effect', { start: 0, end: 6, first: 0 } ),
                frameRate: 10,
                hideOnComplete: true
            };

            this.anims.create(blocked_config);

            var electric_effect_config = {
                key: 'electric-effect-animation',
                frames: this.anims.generateFrameNumbers('electric-effect', { start: 0, end: 5, first: 0 } ),
                frameRate: 10,
                hideOnComplete: true
            };

            this.anims.create(electric_effect_config);

            var energy_effect_config = {
                key: 'energy-effect-animation',
                frames: this.anims.generateFrameNumbers('energy-effect', { start: 0, end: 2, first: 0 } ),
                frameRate: 10,
                hideOnComplete: true
            };

            this.anims.create(energy_effect_config);


            var explosion_effect_config = {
                key: 'explosion-effect-animation',
                frames: this.anims.generateFrameNumbers('explosion-effect', { start: 0, end: 11, first: 0 } ),
                frameRate: 10,
                hideOnComplete: true
            };

            this.anims.create(explosion_effect_config);

            var fire_effect_config = {
                key: 'fire-effect-animation',
                frames: this.anims.generateFrameNumbers('fire-effect', { start: 0, end: 7, first: 0 } ),
                frameRate: 10,
                hideOnComplete: true
            };

            this.anims.create(fire_effect_config);

            var hacking_effect_config = {
                key: 'hacking-effect-animation',
                frames: this.anims.generateFrameNumbers('hacking-effect', { start: 0, end: 11, first: 0 } ),
                frameRate: 10,
                hideOnComplete: true
            };

            this.anims.create(hacking_effect_config);


            var healing_effect_config = {
                key: 'healing-effect-animation',
                frames: this.anims.generateFrameNumbers('healing-effect', { start: 0, end: 4, first: 0 } ),
                frameRate: 10,
                hideOnComplete: true
            };

            this.anims.create(healing_effect_config);

            var heat_effect_config = {
                key: 'heat-effect-animation',
                frames: this.anims.generateFrameNumbers('heat-effect', { start: 0, end: 2, first: 0 } ),
                frameRate: 10,
                repeat: -1
            };

            this.anims.create(heat_effect_config);

    

            var laser_effect_config = {
                key: 'laser-effect-animation',
                frames: this.anims.generateFrameNumbers('laser-effect', { start: 0, end: 2, first: 2 } ),
                frameRate: 10,
                repeat: -1
            };

            this.anims.create(laser_effect_config);

            var melee_effect_config = {
                key: 'melee-effect-animation',
                frames: this.anims.generateFrameNumbers('melee-effect', { start: 0, end: 8, first: 0 } ),
                frameRate: 10,
                hideOnComplete: true
            };

            this.anims.create(melee_effect_config);

            var piercing_effect_config = {
                key: 'piercing-effect-animation',
                frames: this.anims.generateFrameNumbers('piercing-effect', { start: 0, end: 4, first: 0 } ),
                frameRate: 10,
                hideOnComplete: true
            };

            this.anims.create(piercing_effect_config);

            var poison_effect_config = {
                key: 'poison-effect-animation',
                frames: this.anims.generateFrameNumbers('poison-effect', { start: 0, end: 7, first: 0 } ),
                frameRate: 10,
                hideOnComplete: true
            };

            this.anims.create(poison_effect_config);


            var radiation_effect_config = {
                key: 'radiation-effect-animation',
                frames: this.anims.generateFrameNumbers('radiation-effect', { start: 0, end: 7, first: 0 } ),
                frameRate: 10,
                hideOnComplete: true
            };

            this.anims.create(radiation_effect_config);


            var repairing_effect_config = {
                key: 'repairing-effect-animation',
                frames: this.anims.generateFrameNumbers('repairing-effect', { start: 0, end: 10, first: 0 } ),
                frameRate: 10,
                hideOnComplete: true
            };

            this.anims.create(repairing_effect_config);


            var mining_effect_config = {
                key: 'mining-effect-animation',
                frames: this.anims.generateFrameNumbers('mining-effect', { start: 0, end: 5, first: 0 } ),
                frameRate: 4,
                repeat: -1
            };

            this.anims.create(mining_effect_config);

            var salvaging_effect_config = {
                key: 'salvaging-effect-animation',
                frames: this.anims.generateFrameNumbers('salvaging-effect', { start: 0, end: 5, first: 0 } ),
                frameRate: 10,
                repeat: -1
            };

            this.anims.create(salvaging_effect_config);




            // INPUT

            this.input.on('pointerdown', function(pointer) {

                pointer_down_time = our_time;

                if(mobile_mode) {

                } else {
                    //let worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                    let worldPoint = pointer.positionToCamera(this.cameras.main);
                    //console.log("Worldpoint x,y: " + worldPoint.x + "," + worldPoint.y);

                    let pointerTileX = worldPointToTileX(worldPoint.x);
                    let pointerTileY = worldPointToTileY(worldPoint.y);
                    // Doesn't work in phaser 3.17. Gotta add 5 to y tile for some reason
                    //let pointerTileX = pixelToTileX(worldPoint.x);
                    //let pointerTileY = pixelToTileY(worldPoint.y);
                    //console.log("pointerdown tile_x/y: " + pointerTileX + "," + pointerTileY);
                    pointerDownDesktop(pointer, pointerTileX, pointerTileY);
                }


            });

            this.input.on('pointerup', function(pointer) {

                pointer_up_time = our_time;

                if(mobile_mode) {
                    console.log("Pointer up. last_pointer_up: " + last_pointer_up);

                    //let worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                    let worldPoint = pointer.positionToCamera(camera);
                    console.log("Worldpoint x,y: " + worldPoint.x + "," + worldPoint.y);


                    let tile_x = pixelToTileX(worldPoint.x);
                    let tile_y = pixelToTileY(worldPoint.y);
                    console.log("Worldpoint to tile_x/y: " + tile_x + "," + tile_y);

                    // If the click menu is visible, we are just closing it
                    if($("#click_menu").is(":visible")) {
                        console.log("Closing click menu");
                        $("#click_menu").hide();
                        return;
                    }

                    if(last_pointer_up === false) {
                        last_pointer_up = our_time;
                        console.log("Set last pointer up to time: " + our_time);
                    } else {
                        // if the last pointer up was < 500, it's a double tap
                        if(our_time - last_pointer_up < 500) {
                            console.log("Showing click menu based on double tap criteria");
                            showClickMenu(pointer);
                            return;
                        }
                    }

                    last_pointer_up = our_time;

                    if(pointer_up_time - pointer_down_time > 500) {
                    //if(pointer.getDuration() > 500) {
                        console.log("Showing click menu based on long press criteria up_time - down_time: " + pointer_up_time + " - " + pointer_down_time);
                        showClickMenu(pointer);
                        return;
                    }

                    console.log("Sending mobile single click move");



                    checkForClientMove(our_time, tile_x, tile_y);
                }





            });

            text_important = this.add.text(60, 528, 'This is the important text', {
                fontSize: '16px',
                padding: { x: 10, y: 5 },
                backgroundColor: '#000000',
                fill: '#ffffff',
                align: 'center',
                wordWrap: { width: 576 }
            });
            text_important.setScrollFactor(0);
            text_important.setDepth(11);
            text_important.setVisible(false);

            text_admin = this.add.text(60, 250, 'This is admin text', {
                fontSize: '18px',
                padding: { x: 10, y: 5 },
                backgroundColor: '#000000',
                fill: '#ad42f5',
                align: 'center',
                wordWrap: { width: 576 }
            });
            text_admin.setScrollFactor(0);
            text_admin.setDepth(11);
            text_admin.setVisible(false);

            level_up_music = this.sound.add('level-up');
            //level_up_music.play();
        },

        update: function(time, delta) {

            our_time = time;


            checkForClientMove(time);
            //moveMonsters(time);

            // For the client we keep the animation for 10 extra frames to make things more smooth looking
            /* Trying to deprecate client only in favor of all players having this ability
            if(frames_to_idle !== 0) {
                frames_to_idle--;

                if(frames_to_idle <= 0) {
                    if(players[client_player_index].sprite.texture.key === 'player-human') {
                        //console.log("Switching back to idle");
                        players[client_player_index].sprite.anims.play('player-human-idle-animation');
                    } else if(players[client_player_index].sprite.texture.key === 'player-mlm') {
                        //console.log("Switching back to idle");
                        players[client_player_index].sprite.anims.play('player-mlm-idle-animation');
                    }
                }
            }
            */

            moveNpcs();



            let had_moving_player = false;
            for(let i = 0; i < players.length; i++) {

                // Tail end of movement to smooth it out
                if(players[i] && players[i].sprite && players[i].frames_to_idle !== 0) {
                    players[i].frames_to_idle--;

                    if(players[i].frames_to_idle <= 0) {
                        if(players[i].sprite.texture.key === 'player-galaxy') {
                            players[i].sprite.anims.play('player-galaxy-idle-animation');
                        } 
                        else if(players[i].sprite.texture.key === 'player-human') {
                            //console.log("Switching back to idle");
                            players[i].sprite.anims.play('player-human-idle-animation');
                        } 
                        else if(players[i].sprite.texture.key === 'player-manufacturing') {
                            players[i].sprite.anims.play('player-manufacturing-idle-animation');
                        } 
                        else if(players[i].sprite.texture.key === 'player-mlm') {
                            //console.log("Switching back to idle");
                            players[i].sprite.anims.play('player-mlm-idle-animation');
                        } 
                        else if(players[i].sprite.texture.key === 'player-octopus') {
                            //console.log("Switching back to idle");
                            players[i].sprite.anims.play('player-octopus-idle-animation');
                        } 
                        else if(players[i].sprite.texture.key === 'player-reinforced-human') {
                            players[i].sprite.anims.play('player-reinforced-human-idle-animation');
                        }
                        else if(players[i].sprite.texture.key === 'player-ruel') {
                            players[i].sprite.anims.play('player-ruel-idle-animation');
                        }
                    }
                }


                if(players[i] && (players[i].destination_x || players[i].destination_y) ) {

                    if(!players[i].sprite) {
                        return false;
                    }

                    if(had_moving_player === false) {
                        had_moving_player = true;
                    }


                    if(!players[i].current_move_delay) {
                        setPlayerMoveDelay(i);
                    }


                    // we need to get the floor type of the coord we are moving to
                    let movement_modifier = false;
                    let floor_modifier = 1;
                    let floor_type_index = -1;
                    if(players[i].destination_coord_id) {
                        if(current_view === 'planet') {
                            let coord_index = planet_coords.findIndex(function(obj) { return obj && obj.id === players[i].destination_coord_id; });
                            if(coord_index !== -1) {
                                floor_type_index = floor_types.findIndex(function(obj) { return obj && obj.id === planet_coords[coord_index].floor_type_id; });

                                if(floor_type_index !== -1 && floor_types[floor_type_index].movement_modifier) {

                                    //player_move_speed = 1;
                                    floor_modifier = floor_types[floor_type_index].movement_modifier;
                                }
                            }
                        } else if(current_view === 'ship') {
                            let ship_coord_index = ship_coords.findIndex(function(obj) { return obj && obj.id === players[i].destination_coord_id; });
                            if(ship_coord_index !== -1) {
                                floor_type_index = floor_types.findIndex(function(obj) { return obj && obj.id === ship_coords[ship_coord_index].floor_type_id; });

                                if(floor_type_index !== -1 && floor_types[floor_type_index].movement_modifier) {

                                    //player_move_speed = 1;
                                    floor_modifier = floor_types[floor_type_index].movement_modifier;
                                }
                            }
                        } else if(current_view === 'galaxy') {
                            let coord_index = coords.findIndex(function(obj) { return obj && obj.id === players[i].destination_coord_id; });
                            if(coord_index !== -1) {
                                floor_type_index = floor_types.findIndex(function(obj) { return obj && obj.id === coords[coord_index].floor_type_id; });

                                if(floor_type_index !== -1 && floor_types[floor_type_index].movement_modifier) {

                                    //player_move_speed = 1;
                                    floor_modifier = floor_types[floor_type_index].movement_modifier;
                                }
                            }
                        }
                    }


                    // See if the body the player has is going to change things
                    if(floor_type_index !== -1 && current_view !== 'galaxy') {
                        let player_body_index = getObjectIndex(players[i].body_id);
                        if(player_body_index !== -1) {
                            let player_body_type_index = getObjectTypeIndex(objects[player_body_index].object_type_id);
                            if(player_body_type_index !== -1) {
                                
                                if(object_types[player_body_type_index].land_movement_modifier !== 1 && floor_types[floor_type_index].movement_type === 'land') {
                                    floor_modifier = floor_modifier * object_types[player_body_type_index].land_movement_modifier;
                                    //console.log("body land movement modifier changed floor_modifier to: " + floor_modifier);
                                }

                                
                                if(object_types[player_body_type_index].fluid_movement_modifier !== 1 && floor_types[floor_type_index].movement_type === 'fluid') {
                                    floor_modifier = floor_modifier * object_types[player_body_type_index].fluid_movement_modifier;
                                    //console.log("body fluid movement modifier changed socket.movement_modifier to: " + floor_modifier);
                                }

                                
                                if(object_types[player_body_type_index].air_movement_modifier !== 1 && floor_types[floor_type_index].movement_type === 'air') {
                                    floor_modifier = floor_modifier * object_types[player_body_type_index].air_movement_modifier;
                                    //console.log("body air movement modifier changed socket.movement_modifier to: " + floor_modifier);
                                }


                                
                            }
                        }

                    }


                    // Higher numbers slow us down, smaller numbers speed us up.
                    let player_move_speed_division = 68;

                    // E.g. Default speed is 500 ms. 1/2 a second.
                    // tile_width / 1000ms / move_delay * floor_modifier
                    // OLD E.g. 1000 / 500 * 1 = 2 (default) or 1000/500 * .5 = 1 (water)
                    //let player_move_speed = 64 * ( 1000 / players[i].current_move_delay * floor_modifier) / 60;
                    // Trying /64 instead of /60 to maybe get a few less instances of the player moving too fast.
                    //let player_move_speed = 64 * ( 1000 / players[i].current_move_delay * floor_modifier) / 60;
                    //let player_move_speed = 64 * ( 1000 / players[i].current_move_delay * floor_modifier) / 64;
                    let player_move_speed = 64 * ( 1000 / players[i].current_move_delay * floor_modifier) / player_move_speed_division;
                    
                    // Commented this out while I was fixing some screen jumping. This didn't seem to be the cause at all.
                    // lets round it now
                    //player_move_speed = +(player_move_speed.toFixed(2));

                
                    //console.log("Player move speed: " + player_move_speed);
                    //let player_move_speed = 1000 / players[i].current_move_delay * floor_modifier;

                    if(player_move_speed === 0) {
                        console.log("%c Movement speed shouldn't be 0", log_warning);
                        player_move_speed = 1;
                        //player_move_speed = 2;
                    }


                    // I like the idea of the stuff below - in the end I had a hard time with the complexity, and adjusting it to things like
                    //  player_move_speed_division . Might need to bring it back at some point - I know it was due to if a client was lagging or something

                    /*
                    // Maybe a better way of doing it is going to be to see how many pixels we have left, and how
                    // many we should have left
                    let move_time_left = players[i].move_start_time + (players[i].current_move_delay / floor_modifier) - our_time;
                    //let move_time_left = client_move_start_time + (players[i].current_move_delay / floor_modifier) - our_time;
                    

                    
                    // We should be there
                    if(move_time_left < 0) {
                        players[i].sprite.x = players[i].destination_x;
                        players[i].sprite.y = players[i].destination_y;
                    } else {
                        let ideal_pixels_left = (Math.floor(move_time_left) / 1000) * player_move_speed_division * player_move_speed;
                        let actual_pixels_left = 0;
                        if(players[i].sprite.x !== players[i].destination_x) {
                            actual_pixels_left = Math.abs(players[i].sprite.x - players[i].destination_x);
                        } else if(players[i].sprite.y !== players[i].destination_y) {
                            actual_pixels_left = Math.abs(players[i].sprite.y - players[i].destination_y);
                        }
                        
                        if(actual_pixels_left > ideal_pixels_left + 4) {
                            player_move_speed += actual_pixels_left - ideal_pixels_left;
                        }
                        
                    }
                    */

                    //
                    /*
                    // We want to complete the move in the current_move_delay * floor_modifier amount of time
                    // e.g. We want to move 64 pixels in 500 ms. At 60 frames/second that means we are moving
                    // 64 pixels in 30 frames
                    //console.log("Player move speed is: " + player_move_speed);
                    let move_time_so_far = our_time - client_move_start_time;
                    let ideal_pixels_so_far = (Math.floor(move_time_so_far) / 1000) * 60 * player_move_speed;

                    //console.log("We've been moving for " + move_time_so_far + "ms. Ideally we've moved the player " +
                    //    ideal_pixels_so_far);
                    if(client_move_pixel_amount < ideal_pixels_so_far) {
                        player_move_speed = ideal_pixels_so_far - client_move_pixel_amount;
                    }
                    */

                    // See how many pixels we SHOULD have moved by this time

                    // To test we can increase the player_move_speed to match what we want to have moved right now


                    if(client_player_index !== -1 && client_player_index === i) {
                        client_move_pixel_amount += player_move_speed;
                    }

                    players[i].move_pixel_amount += player_move_speed;


                    if(players[i].sprite.x < players[i].destination_x) {

                        if(players[i].sprite.x + player_move_speed > players[i].destination_x) {
                            players[i].sprite.x = players[i].destination_x;

                        } else {
                            players[i].sprite.x += player_move_speed;
                        }

                    } else if(players[i].sprite.x > players[i].destination_x) {

                        if(players[i].sprite.x - player_move_speed < players[i].destination_x) {
                            players[i].sprite.x = players[i].destination_x;
                        } else {
                            players[i].sprite.x -= player_move_speed;
                        }


                    } else if(players[i].sprite.y < players[i].destination_y) {

                        if(players[i].sprite.y + player_move_speed > players[i].destination_y) {
                            players[i].sprite.y = players[i].destination_y;
                        } else {
                            players[i].sprite.y += player_move_speed;

                            /*
                            // player sprite is lagging behind (FRAME RATE!!). Extra pixel!
                            if(players[i].destination_y - players[i].sprite.y > 100) {
                                console.log("Increasing speed to cach up!");
                                players[i].sprite.y += 1;
                            }
                            */
                        }


                    } else if(players[i].sprite.y > players[i].destination_y) {

                        if(players[i].sprite.y - player_move_speed < players[i].destination_y) {
                            players[i].sprite.y = players[i].destination_y;
                        } else {
                            players[i].sprite.y -= player_move_speed;

                            /*
                            let y_difference = players[i].sprite.y - players[i].destination_y;
                            //console.log("Y difference: " + y_difference);
                            // player sprite is lagging behind (FRAME RATE!!). Extra pixel!
                            if(players[i].sprite.y - players[i].destination_y > 100) {
                                console.log("Increasing speed to catch up!");
                                players[i].sprite.y -= 1;
                            }
                            */
                        }

                    }


                    updateEffectSprites('player', i);

                    if(current_view === 'galaxy') {
                        
                        let player_ship_index = getObjectIndex(players[i].ship_id);
                        updateEffectSprites('object', player_ship_index);
                    }
                    
                
                    
                    

                    if(players[i].sprite.y === players[i].destination_y && players[i].sprite.x === players[i].destination_x) {
                        players[i].destination_x = false;
                        players[i].destination_y = false;
                        players[i].destination_coord_id = false;
                    }


                    // The player has finished moving. See if there's a next move queued up

                    if(players[i].destination_x === false || players[i].destination_y === false) {
                        //console.log("Player finished moving. Checking to see if a next move is queued up");
                        let next_move_index = next_moves.findIndex(function(obj) { return obj && obj.player_id === players[i].id; });

                        if(next_move_index !== -1) {
                            //console.log("Found next move for our player!");
                            movePlayerFlow(i, next_moves[next_move_index].destination_coord, 'update: next move');
                            // we can safely keep the next moves array small, and don't have to worry about maintaining indexes
                            //delete next_moves[next_move_index];
                            next_moves.splice(next_move_index, 1);
                        } else {

                            players[i].frames_to_idle = 10;
                            /*
                            if(i === client_player_index) {
                                frames_to_idle = 10;
                            }

                            // switch back to an idle animation if we are in the human body
                            else if(players[i].sprite.texture.key === 'player-human') {
                                //console.log("Switching back to idle");
                                players[i].sprite.anims.play('player-human-idle-animation');
                                
                                // Lets check on the timing of this - if the animation is ending before 
                                // our next move is available.
                                //console.log("Switching back to idle animation. Next move has been available for: ");
                                let time_since_last_move = our_time - last_move_sent;
                                //console.log("It's been " + time_since_last_move + "ms since the last move");
                                
                                let available_for_time = our_time - last_move_sent + move_delay - 50;
                                //console.log(available_for_time);
                                

                            }

                            else if(players[i].sprite.texture.key === 'player-mlm') {
                                //console.log("Switching back to idle");
                                players[i].sprite.anims.play('player-mlm-idle-animation');

                                // Lets check on the timing of this - if the animation is ending before
                                // our next move is available.
                                //console.log("Switching back to idle animation. Next move has been available for: ");
                                let time_since_last_move = our_time - last_move_sent;
                                //console.log("It's been " + time_since_last_move + "ms since the last move");

                                let available_for_time = our_time - last_move_sent + move_delay - 50;
                                //console.log(available_for_time);


                            }
                            */
                        }
                    }

                }
            }

            if(had_moving_player) {
                redrawBars('update - had_moving_player');
            }



            let moved_a_monster = false;
            let monster_move_speed = 2;
            for(let i = 0; i < monsters.length; i++) {

                if(monsters[i] && monsters[i].sprite && monsters[i].destination_x !== false && typeof monsters[i].destination_x !== 'undefined') {
                    moved_a_monster = true;


                    if(monsters[i].sprite.x < monsters[i].destination_x) {

                        if(monsters[i].sprite.x + monster_move_speed > monsters[i].destination_x) {
                            monsters[i].sprite.x = monsters[i].destination_x;
                            monsters[i].destination_x = false;
                        } else {
                            monsters[i].sprite.x += monster_move_speed;
                        }

                    } else if(monsters[i].sprite.x > monsters[i].destination_x) {

                        if(monsters[i].sprite.x - monster_move_speed < monsters[i].destination_x) {
                            monsters[i].sprite.x = monsters[i].destination_x;
                            monsters[i].destination_x = false;
                        } else {
                            monsters[i].sprite.x -= monster_move_speed;
                        }


                    } else if(monsters[i].sprite.y < monsters[i].destination_y) {

                        if(monsters[i].sprite.y + monster_move_speed > monsters[i].destination_y) {
                            monsters[i].sprite.y = monsters[i].destination_y;
                            monsters[i].destination_y = false;
                        } else {
                            monsters[i].sprite.y += monster_move_speed;
                        }

                    } else if(monsters[i].sprite.y > monsters[i].destination_y) {

                        if(monsters[i].sprite.y - monster_move_speed < monsters[i].destination_y) {
                            monsters[i].sprite.y = monsters[i].destination_y;
                            monsters[i].destination_y = false;
                        } else {
                            monsters[i].sprite.y -= monster_move_speed;
                        }

                    }

                    updateEffectSprites('monster', i);

                }
            }

            if(moved_a_monster) {
                redrawBars('update - moving_monsters');
            }


            /*
            let moving_monsters = monsters.filter(monster => monster.destination_x !== false && monster.destination_x !== 'undefined' && monster.sprite);

            if(moving_monsters.length) {
                console.log("Have " + moving_monsters.length + " moving monsters");

                let monster_move_speed = 2;

                moving_monsters.forEach(function(monster) {
                    // Lets clear out destinations for any monster that
                    if(!monster.sprite) {
                        monster.destination_x = false;
                        monster.destination_y = false;
                        //console.log("No sprite for that monster");
                        return false;
                    }

                    console.log("Monster id: " + monster.id + " is moving from " + monster.sprite.x + " to destination x: " + monster.destination_x);


                });
                redrawBars('update - moving_monsters');
            }
            */

            if(info_numbers) {

                for(let i = 0; i < info_numbers.length; i++) {
                    if(info_numbers[i]) {
                        if(info_numbers[i].pixels_moved < 120) {

                            if(info_numbers[i].text) {
                                info_numbers[i].text.y -= .5;
                                info_numbers[i].pixels_moved += .5;

                                if(info_numbers[i].pixels_moved > 60) {
                                    info_numbers[i].text.alpha -= 0.010;
                                }
                            } else {
                                delete info_numbers[i];
                            }

                        } else {
                            info_numbers[i].text.destroy();
                            info_numbers[i].text = false;
                            delete info_numbers[i];
                        }
                    }
                }

            }


            if(time > frame_delay + last_frame_update) {
                last_frame_update = time;

                /*
                
                monsters.forEach(function(showing_monster) {
                    showMonster(showing_monster);
                });

                // We are going to animate every player
                players.forEach(function(showing_player) {

                    //showPlayer(showing_player);

                });
                */


                for(let i = 0; i < animations.length; i++) {
                    if(animations[i]) {
                        if(animations[i].object_id) {
                            let object_index = objects.findIndex(function(obj) { return obj && obj.id === animations[i].object_id; });

                            if(object_index !== -1) {
                                let tile_x = 0;
                                let tile_y = 0;

                                let object_info = getObjectInfo(object_index);

                                if(object_info.coord) {
                                    tile_x = object_info.coord.tile_x;
                                    tile_y = object_info.coord.tile_y;
                                }


                                let object_type_index = object_types.findIndex(function(obj) { return obj && obj.id === objects[object_index].object_type_id; });

                                // move to the next frame, or reset
                                let next_frame = animations[i].current_frame + 1;
                                if(next_frame > object_types[object_type_index].is_active_frame_count) {
                                    next_frame = 1;
                                }

                                animations[i].current_frame = next_frame;


                                let game_file_index = object_types[object_type_index].game_file_index + (next_frame - 1);
                                map.putTileAt(game_file_index, tile_x, tile_y, false, 'layer_object');

                            } else {
                                console.log("Couldn't find object for animation. Deleting it.");
                                delete animations[i];
                            }
                        }

                        // animating the floor
                        if(animations[i] && animations[i].planet_coord_id) {
                            let planet_coord_index = planet_coords.findIndex(function(obj) { return obj && obj.id === animations[i].planet_coord_id; });

                            if(planet_coord_index !== -1) {
                                let floor_type_index = floor_types.findIndex(function(obj) { return obj && obj.id === planet_coords[planet_coord_index].floor_type_id; });
                                if(floor_type_index !== -1) {


                                    let next_frame = animations[i].current_frame + 1;

                                    if(next_frame > floor_types[floor_type_index].frame_count) {
                                    //if(next_frame > 2) {
                                        next_frame = 1;
                                    }

                                    // alright, we are animating this floor! See if it's via display linkers, or just the game file index
                                    let display_linkers = floor_type_display_linkers.filter(linker => linker.floor_type_id === floor_types[floor_type_index].id);

                                    if(display_linkers.length > 0) {

                                        
                                        //console.log("Floor frame: " + next_frame);

                                        for(linker of display_linkers) {

                                            let linker_tile_x = planet_coords[planet_coord_index].tile_x + linker.position_x;
                                            let linker_tile_y = planet_coords[planet_coord_index].tile_y + linker.position_y;

                                            map.putTileAt(linker.game_file_index + (next_frame - 1), linker_tile_x,
                                                linker_tile_y, false, linker.layer);
                                        }
                                        animations[i].current_frame = next_frame;


                                    } else {


                                        map.putTileAt(floor_types[floor_type_index].game_file_index + (next_frame - 1),
                                            planet_coords[planet_coord_index].tile_x, planet_coords[planet_coord_index].tile_y,
                                            false, 'layer_floor');
                                    }

                                    animations[i].current_frame = next_frame;

                                }
                            }
                        }
                        
                    }
                }



            }

        

            if(text_important_time && text_important_time + 5000 < time) {
                text_important_time = false;
                text_important.setVisible(false);
            }

            if(text_admin_time && text_admin_time + 5000 < time) {
                text_admin_time = false;
                text_admin.setVisible(false);
            }

        }

    });


    var config = {
        type: Phaser.WEBGL,
        width: 704,
        height: 576,
        backgroundColor: '#ffffff',
        parent: 'the_game',
        physics: {
            default: 'arcade'
        },
        pixelArt: true,
        scene: [ SceneGame ]
    };


    /*
    var config = {
        type: Phaser.WEBGL,
        scale: {
            mode: Phaser.Scale.FIT,
            width: 576,
            height: 448,
            parent: 'the_game',
        },
        backgroundColor: '#ffffff',
        parent: 'the_game',
        physics: {
            default: 'arcade'
        },
        pixelArt: true,
        scene: [ SceneGame ]
    };
    */
    game = new Phaser.Game(config);

    </script>






<?php
//include_once("" . $client_click_name);
?>

<script type="text/javascript">

    $(document).ready(function(){
        $( "#login" ).submit(function( event ) {
            var local_email = $('#email').val();
            var local_player_name = $('#player_name').val();
            var local_password = $('#password').val();
            socket.emit('login_data', {player_name: local_player_name, email: local_email, password: local_password });
            //console.log("Sending login data:" + local_player_name + ", " + local_email);
            event.preventDefault();
            document.getElementById('the_game').focus();
        });
    });

    $(document).mousemove( function(e) {
        mouse_x = e.pageX;
        mouse_y = e.pageY;
    });

    var start_ping_time;

    setInterval(function() {
        // Do something every minute
        if(logged_in) {
            // handled on the server side now :D
            // socket.emit("map_update");
            // console.log("requesting map update");
            // socket.emit("battle_update");

            /*

            other_players.forEach(function(other_player) {
                console.log("emitting request_player_info for " + other_player.player_id);
                socket.emit('request_player_info', {other_player_id: other_player.player_id});
            });

            monsters.forEach(function (monster) {
                console.log("emitting request_monster_info for" + monster.monster_id);
                socket.emit('request_monster_info', {'monster_id': monster.monster_id});
            });

            */
            socket.emit('request_player_count');
            start_ping_time = Date.now();
            socket.emit('ping_server');
        } else {
            console.log("NOT LOGGED IN");
        }


    }, 60000);
</script>


<script type="text/javascript">
    var height = 0;
    $('#chat_new p').each(function(i, value){
        height += parseInt($(this).height());
    });

    height += '';

    $('#chat_new').animate({scrollTop: height});
</script>
