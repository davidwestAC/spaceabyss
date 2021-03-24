//@ts-check
/*
NODEJS VERSION 12.31.1
SOCKET.IO VERSION socket.io@2.something
*/
//const path = require('path');
//require('dotenv').config({ path: path.join(__dirname, '.env') }).load();
//require('dotenv').load();
require('dotenv').config();
//require('dotenv').config({ path: '/var/www/space.alphacoders.com/html/dev_server' });
//const dotenv_result = require('dotenv').config({ path: '/var/www'});

//if(dotenv_result.error) {
//    throw dotenv_result.error;
//}

const inits = require('inits');
const fs = require('fs');


//console.log(process.cwd());
//console.log(process.env.PWD);

/*
const options = {
    key: fs.readFileSync(process.env.SSLKEY),
    cert: fs.readFileSync(process.env.SSLCERT)
};

function handler(request, response) {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write('hello world');
    response.end();
}


var app = require('https').createServer(options, handler).listen(process.env.PORT);
var io = require('socket.io').listen(app);
*/

var io_handler = require('./io.js');
var io = io_handler.io;

var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

// Require and setup chalk
const chalk = require('chalk');
const log = console.log;

const { v1: uuidv1 } = require('uuid');

//const uuid = require('uuid/v1');


// Something about timing
const NS_PER_SEC = 1e9;


/*
var mysql = require('mysql2/promise');

var pool = mysql.createPool({
    host     : process.env.IPADDRESS,
    user     : process.env.MYSQLUSER,
    password : process.env.MYSQLPASSWORD,
    database : process.env.MYSQLDATABASE,
    connectionLimit: 10
});


var connection = mysql.createConnection({
    host     : process.env.IPADDRESS,
    user     : process.env.MYSQLUSER,
    password : process.env.MYSQLPASSWORD,
    database : process.env.MYSQLDATABASE
});
*/

var database = require('./database.js');
var pool = database.pool;

/**
 @typedef dirty.monster_types
 @type {Object}
 @property {number} movement_tile_width - Tile width of a monster
 @property {number} movement_tile_height - Tile height of a monster
 */

/**
 @typedef dirty.object_types
 @type {Object}
 @property {number} defense_modifier
 @property {number} manufacturing_modifier
 @property {boolean} can_walk_on
 @property {boolean} can_have_rules
 @property {boolean} assembled_as_object
 @property {boolean} spawns_in_galaxy
 @property {boolean} is_ship
 @property {number} spawns_object_type_id
 */

/**
 @typedef dirty.players
 @type {Object}
 @property {number} control_skill_points
 @property {number} corrosive_skill_points
 @property {number} defending_skill_points
 @property {number} electric_skill_points
 @property {number} explosion_skill_points
 @property {number} freezing_skill_points
 @property {number} hacking_skill_points
 @property {number} heat_skill_points
 @property {number} gravity_skill_points
 @property {number} melee_skill_points
 @property {number} piercing_skill_points
 @property {number} plasma_skill_points
 @property {number} poison_skill_points
 @property {number} radiation_skill_points
 */

/**
 @typedef dirty.spawn_linkers
 @type {Object}
 @property {string} spawns_location - self, adjacent, has_spawned_object
 */



global.difficult_level_modifier = 0.20;
global.level_modifier = 0.10;
global.move_delay = 500;
global.max_asteroid_count = 50;
global.max_npc_count = 1;
global.player_inventory_limit = 10;

// Not sure why this was +1 what the client was. I would think +2 would make more sense for no pop in
// Currently testing with an exact client match
// I THINK the +1 is particularly helpful for adding to the map when we make a move
global.show_rows = 10;
global.show_cols = 12;
global.battle_time = 100;



var dirty = [];
dirty.active_salvagings = [];
dirty.addiction_linkers = [];
dirty.admin_logs = [];
dirty.areas = [];
dirty.assembled_in_linkers = [];
dirty.assemblies = [];
dirty.assembly_linkers = [];
dirty.autopilots = [];
dirty.battle_linkers = [];
dirty.bid_linkers = [];
dirty.coords = [];
dirty.database_queue = [];
dirty.docking_rules = [];
dirty.drop_linkers = [];
dirty.eating_linkers = [];
dirty.events = [];
dirty.event_tick_linkers = [];
dirty.event_linkers = [];
dirty.factions = [];
dirty.faction_linkers = [];
dirty.floor_types = [];
dirty.floor_type_display_linkers = [];
dirty.elevator_linkers = [];
dirty.equipment_linkers = [];
dirty.inventory_items = [];
dirty.job_linkers = [];
dirty.market_linkers = [];
dirty.mining_linkers = [];
dirty.monster_types = [];
dirty.monster_type_attacks = [];
dirty.next_moves = [];
dirty.npcs = [];
dirty.npc_jobs = [];
dirty.npc_job_requirement_linkers = [];
dirty.structure_types = [];
dirty.structure_type_linkers = [];
dirty.structure_type_requirement_linkers = [];
dirty.npc_tasks = [];
dirty.object_types = [];
dirty.object_type_conversion_linkers = [];
dirty.object_type_decay_linkers = [];
dirty.object_type_display_linkers = [];
dirty.object_type_equipment_linkers = [];
dirty.objects = [];
dirty.planets = [];
dirty.planet_floor_linkers = [];
dirty.planet_coords = [];
dirty.planet_event_linkers = [];
dirty.planet_monster_linkers = [];
dirty.planet_object_linkers = [];
dirty.planet_type_impact_linkers = [];
dirty.planet_types = [];
dirty.planet_type_display_linkers = [];
dirty.players = [];
dirty.player_relationship_linkers = [];
dirty.player_research_linkers = [];
dirty.monsters = [];
dirty.races = [];
dirty.race_eating_linkers = [];
dirty.researches = [];
dirty.repairing_linkers = [];
dirty.rules = [];
dirty.salvage_linkers = [];
dirty.skin_purchase_linkers = [];
dirty.spawn_linkers = [];
dirty.spawned_events = [];
// Ships are just objects. dirty.objects
// dirty.ships = [];
dirty.ship_coords = [];
dirty.ship_linkers = [];
dirty.storytellers = [];
dirty.structures = [];
dirty.trap_linkers = [];
dirty.virtual_coords = [];
dirty.waiting_drops = [];






// Clear Players From Planet Coords
inits.init(1, function(callback) {


    pool.query("UPDATE planet_coords SET player_id = false WHERE player_id > 0", function(err, result) {
        if(err) throw err;

        console.log("Cleared players from planet coords");
        callback(null);
    });

});

// Clear Players From Galaxy Coords
inits.init(1, function(callback) {
    pool.query("UPDATE coords SET player_id = false, object_id = false, object_amount = false, object_type_id = false WHERE player_id > 0", function(err, result) {
        if(err) throw err;

        console.log("Cleared Players From Galaxy Coords");
        callback(null);
    });

});

// Clear Players From Ship Coords
inits.init(1, function(callback) {
    pool.query("UPDATE ship_coords SET player_id = false WHERE player_id > 0", function(err, result) {
        if(err) throw err;

        console.log("Cleared Players From Ship Coords");
        callback(null);
    });

});

inits.init(function(callback) {
    pool.query("SELECT * FROM addiction_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.addiction_linkers = rows;
        }

        console.log("Added addiction linkers into memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM areas", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.areas = rows;
        }

        console.log("Added areas into memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM assembled_in_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.assembled_in_linkers = rows;
        }

        console.log("Added assembled in linkers into memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM assemblies", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.assemblies = rows;
        }

        console.log("Loaded Assemblies Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM bid_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.bid_linkers = rows;
        }

        console.log("Loaded Bid Linkers Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM docking_rules", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.docking_rules = rows;
        }

        console.log("Loaded Docking Rules Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM eating_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.eating_linkers = rows;
        }

        console.log("Loaded Eating Linkers Into Memory");

        callback(null);
    });
});


inits.init(function(callback) {
    pool.query("SELECT * FROM events", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.events = rows;
        }

        console.log("Loaded Events Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM event_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.event_linkers = rows;
        }

        console.log("Loaded Event Linkers Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
   pool.query("SELECT * FROM factions", function(err, rows, fields) {
       if(err) throw err;

        if(rows[0]) {
            dirty.factions = rows;
        }

        console.log("Loaded Factions Into Memory");

        callback(null);
   });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM faction_linkers", function(err, rows, fields) {
        if(err) throw err;
 
         if(rows[0]) {
             dirty.faction_linkers = rows;
         }
 
         console.log("Loaded Faction Linkers Into Memory");
 
         callback(null);
    });
 });

inits.init(function(callback) {
    pool.query("SELECT * FROM floor_types", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.floor_types = rows;
        }

        console.log("Loaded Floor Types Into Memory");

        callback(null);
    });
});


inits.init(3, function(callback) {
    pool.query("SELECT * FROM floor_type_assembly_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            for(let i = 0; i < rows.length; i++) {
                dirty.assembly_linkers.push(rows[i]);
            }
        }

        console.log("Floor type assembly linkers loaded Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM floor_type_display_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.floor_type_display_linkers = rows;
        }

        console.log("Loaded Floor Type Display Linkers Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM galaxies WHERE id = 1", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.galaxies = rows;
        }

        console.log("Loaded Galaxy Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM job_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.job_linkers = rows;
        }

        console.log("Loaded Job Linkers Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM market_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.market_linkers = rows;
        }

        console.log("Loaded Market Linkers Into Memory");

        callback(null);
    });
});



// Load Monster Types Into Memory
inits.init(1, function(callback) {

    pool.query("SELECT * FROM monster_types", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.monster_types = rows;

            console.log("Loaded Monster Types Into Memory");

            callback(null);

        }

    });

});

inits.init(2, function(callback) {

    pool.query("SELECT * FROM monster_type_attacks", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.monster_type_attacks = rows;

            console.log("Loaded Monster Type Attacks Into Memory");

            callback(null);

        }

    });

});

inits.init(2, function(callback) {
    pool.query("SELECT * FROM drop_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.drop_linkers = rows;
        }

        console.log("Loaded Drop Linkers Into Memory");

        callback(null);
    });
});

// Need npc inventory items since we get the npcs in inits
inits.init(2, function(callback) {
    pool.query("SELECT * FROM inventory_items WHERE npc_id is not null", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            for(let i = 0; i < rows.length; i++) {
                dirty.inventory_items.push(rows[i]);
            }
        }

        console.log("Loaded NPC Inventory Items Into Memory");

        callback(null);
    });
});


// Need monsters associated with events so the events don't despawn
inits.init(1, function(callback) {
    pool.query("SELECT * FROM monsters WHERE spawned_event_id is not null", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            // Editing out the admin description
            for(let i = 0; i < rows.length; i++) {
                dirty.monsters.push(rows[i]);
            }
        }

        console.log("Loaded Monsters From Events Into Memory");

        callback(null);
    });
});

inits.init(2, async function(callback) {

    log(chalk.cyan("Testing grabbing room info for monsters"));

    for(let i = 0; i < dirty.monsters.length; i++ ) {
        if(dirty.monsters[i] && !dirty.monsters[i].room) {
            //console.log("Don't have room for monster id: " + dirty.monsters[i].id);

            if(dirty.monsters[i].planet_coord_id) {
                let planet_coord_index = await getPlanetCoordIndex({ 'planet_coord_id': dirty.monsters[i].planet_coord_id });
                if(planet_coord_index !== -1) {
                    dirty.monsters[i].planet_coord_index = planet_coord_index;
                    dirty.monsters[i].room = "planet_" + dirty.planet_coords[planet_coord_index].planet_id;
                } else {

                    // The monster's planet coord LITERALLY does not exist
                    log(chalk.yellow("Deleting monster id: " + dirty.monsters[i].id));
                    await monster.deleteMonster(dirty, i);
                }
            } else if(dirty.monsters[i].ship_coord_id) {
                let ship_coord_index = await getShipCoordIndex({ 'ship_coord_id': dirty.monsters[i].ship_coord_id });
                if(ship_coord_index !== -1) {
                    dirty.monsters[i].ship_coord_index = ship_coord_index;
                    dirty.monsters[i].room = "ship_" + dirty.ship_coords[ship_coord_index].ship_id;
                }
            } else if(dirty.monsters[i].coord_id) {
                let coord_index = await getCoordIndex({ 'coord_id': dirty.monsters[i].coord_id });
                if(coord_index !== -1) {
                    dirty.monsters[i].coord_index = coord_index;
                    dirty.monsters[i].room = "galaxy";
                }
            }
        }
    }

    console.log("Did it!");
    callback(null);

});


// Load NPC Jobs Into Memory
inits.init(4, function(callback) {

    pool.query("SELECT * FROM npc_jobs", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.npc_jobs = rows;

            console.log("Loaded Npc Jobs Into Memory");

            callback(null);

        }

    });

});

// Load NPC Jobs Into Memory
inits.init(4, function(callback) {

    pool.query("SELECT * FROM npc_job_requirement_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.npc_job_requirement_linkers = rows;

            console.log("Loaded Npc Job Requirement Linkers Into Memory");

            callback(null);

        }

    });

});



// Load NPCs Into Memory
inits.init(function(callback) {

    pool.query("SELECT * FROM npcs", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.npcs = rows;
        }

        console.log("Loaded NPCs Into Memory");

        callback(null);
    });


});

/*********************** OBJECT TYPES AND OBJECTS *********************/


// Load Object Types Into Memory
inits.init(1, function(callback) {

    pool.query("SELECT * FROM object_types", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {

            // Editing out the admin description
            for(let i = 0; i < rows.length; i++) {
                let object_type = rows[i];
                object_type.admin_description = "";
                dirty.object_types.push(object_type);
            }
            //dirty.object_types = rows;
        }

        console.log("Loaded Object Types Into Memory");

        callback(null);
    });


});



inits.init(2, function(callback) {

    pool.query("SELECT * FROM object_type_conversion_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.object_type_conversion_linkers = rows;
        }

        console.log("Loaded Object Types Conversion Linkers Into Memory");

        callback(null);
    });


});

inits.init(2, function(callback) {

    pool.query("SELECT * FROM object_type_decay_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.object_type_decay_linkers = rows;
        }

        console.log("Loaded Object Types Decay Linkers Into Memory");

        callback(null);
    });


});

// Load Object Types Into Memory
inits.init(2, function(callback) {

    pool.query("SELECT * FROM object_type_equipment_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.object_type_equipment_linkers = rows;
        }

        console.log("Loaded Object Types Equipment Linkers Into Memory");

        callback(null);
    });


});


// Load AIs into Memory
inits.init(2, function(callback) {
    pool.query("SELECT * FROM objects WHERE object_type_id = 72", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.objects = rows;
        }

        console.log("Loaded AIs Into Memory");

        callback(null);
    });
});

// Load AI Batteries, AI Cores, and Portals

inits.init(3, function(callback) {

    pool.query("SELECT * FROM objects WHERE object_type_id = 161 OR object_type_id = 162 OR object_type_id = 47", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            for(let i = 0; i < rows.length; i++) {
                dirty.objects.push(rows[i]);
            }
        }

        console.log("Added AI Batteries and AI Cores Into Memory");

        callback(null);
    });


});

// Load objects associated with a spawned event into memory so the events don't despawn prematurely
inits.init(function(callback) {
    pool.query("SELECT * FROM objects WHERE spawned_event_id", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            // Editing out the admin description
            for(let i = 0; i < rows.length; i++) {


                game_object.getIndex(dirty, rows[i].id);
                // This is butt for ships
                //dirty.objects.push(rows[i]);
            }
        }

        console.log("Loaded Objects From Events Into Memory");

        callback(null);
    });
});

// Load objects that spawn something into memory
inits.init(3, function(callback) {

    pool.query("SELECT objects.* FROM objects LEFT JOIN object_types ON object_types.id = objects.object_type_id " +
        "WHERE (object_types.spawns_monster_type_id != 0 OR object_types.spawns_object_type_id != 0)", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            for(let i = 0; i < rows.length; i++) {
                dirty.objects.push(rows[i]);
            }
        }

        console.log("Added Objects That Spawn Things (Other Objects Or Monsters) Into Memory");

        callback(null);
    });


});

inits.init(2, function(callback) {
    pool.query("SELECT * FROM object_type_assembly_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            for(let i = 0; i < rows.length; i++) {
                dirty.assembly_linkers.push(rows[i]);
            }
        }

        console.log("Object type assembly linkers loaded Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM object_type_display_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.object_type_display_linkers = rows;
        }

        console.log("Loaded Object Type Display Linkers Into Memory");

        callback(null);
    });
});

// Load up planet coords that spawn monsters
inits.init(1, function(callback) {
  

    pool.query("SELECT * FROM planet_coords", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.planet_coords = rows;
            console.log("Loaded " + rows.length + " planet coords");
        }

        console.log("Loaded planet coords into memory");

        callback(null);
    });
   
});

/*
// Load up planet coords that are > level 0
inits.init(function(callback) {


    pool.query("SELECT * FROM planet_coords WHERE level > 0", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            for(let i = 0; i < rows.length; i++) {
                dirty.planet_coords.push(rows[i]);
            }
            console.log("Loaded " + rows.length + " planet coords that are > level 0");
        }


        callback(null);
    });
   
    
});
*/


// Load up our planets!
inits.init(function(callback) {


    pool.query("SELECT * FROM planets", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.planets = rows;
        }


        callback(null);
    });
   
    
});


inits.init(function(callback) {
    pool.query("SELECT * FROM planet_event_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.planet_event_linkers = rows;
        }

        console.log("Loaded Planet Event Linkers Into Memory");

        callback(null);
    });
});

// Load Planet Floor Linkers into memory
inits.init(function(callback) {

    pool.query("SELECT * FROM planet_floor_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.planet_floor_linkers = rows;
        }


        callback(null);
    });


});

// Load Planet Monster Linkers into memory
inits.init(function(callback) {

    pool.query("SELECT * FROM planet_monster_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.planet_monster_linkers = rows;
        }


        callback(null);
    });


});

// Load Planet Object Linkers into memory
inits.init(function(callback) {

    pool.query("SELECT * FROM planet_object_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.planet_object_linkers = rows;
        }


        callback(null);
    });


});

inits.init(function(callback) {
    pool.query("SELECT * FROM planet_types", function(err, rows, fields) {
        if(err) throw err;

        // Editing out the admin description
        for(let i = 0; i < rows.length; i++) {
            let planet_type = rows[i];
            planet_type.admin_description = "";
            dirty.planet_types.push(planet_type);
        }

        console.log("Loaded Planet Types Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM planet_type_display_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.planet_type_display_linkers = rows;
        }

        console.log("Loaded Planet Type Display Linkers Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM planet_type_impact_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.planet_type_impact_linkers = rows;
        }

        console.log("Loaded Planet Type Impact Linkers Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM races", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.races = rows;
        }

        console.log("Loaded Races Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM race_eating_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.race_eating_linkers = rows;
        }

        console.log("Loaded Race Eating Linkers Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM researches", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.researches = rows;
        }

        console.log("Loaded Researches Into Memory");

        callback(null);
    });
});


inits.init(function(callback) {
    pool.query("SELECT * FROM rules", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.rules = rows;
        }

        console.log("Loaded Rules Into Memory");

        callback(null);
    });
});


inits.init(function(callback) {
    pool.query("SELECT * FROM salvage_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.salvage_linkers = rows;
        }

        console.log("Loaded Salvage Linkers Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM ship_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.ship_linkers = rows;
        }

        console.log("Loaded Ship Linkers Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM spawn_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.spawn_linkers = rows;
        }

        console.log("Loaded Spawn Linkers Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM spawned_events", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.spawned_events = rows;
        }

        console.log("Loaded Spawned Events Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM storytellers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.storytellers = rows;
        }

        console.log("Loaded Storytellers Into Memory");

        callback(null);
    });
});

inits.init(function(callback) {
    pool.query("SELECT * FROM structures", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.structures = rows;
        }

        console.log("Loaded Structures Into Memory");

        callback(null);
    });
});

// Load  Structure TYpes Into Memory
inits.init(4, function(callback) {

    pool.query("SELECT * FROM structure_types", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.structure_types = rows;

            console.log("Loaded Npc Structures Into Memory");

            callback(null);

        }

    });

});

inits.init(5, function(callback) {
    pool.query("SELECT * FROM structure_type_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.structure_type_linkers = rows;
        }

        console.log("Loaded Structure Type Linkers Into Memory");

        callback(null);
    });
});

inits.init(5, function(callback) {
    pool.query("SELECT * FROM structure_type_requirement_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.structure_type_requirement_linkers = rows;
        }

        console.log("Loaded Npc Structure Requirement Linkers Into Memory");

        callback(null);
    });
});


// TODO we need to load actual trap objects and their inventory into memory when the server starts
inits.init(function(callback) {
    pool.query("SELECT * FROM trap_linkers", function(err, rows, fields) {
        if(err) throw err;

        if(rows[0]) {
            dirty.trap_linkers = rows;
        }

        console.log("Loaded Trap Linkers Into Memory");

        callback(null);
    });
});


const battle = require('./battle.js');
const event = require('./event.js');
const faction = require('./faction.js');
const game = require('./game.js');
const game_object = require('./game_object.js');
const helper = require('./helper.js');
const inventory = require('./inventory.js');
const map = require('./map.js');
const monster = require('./monster.js');
const movement = require('./movement.js');
const npc = require('./npc.js');
const planet = require('./planet.js');
const player = require('./player.js');
const world = require('./world.js');


io.sockets.on('connection', function (socket) {

    log(chalk.green("Have new client connecting!"));


    game.sendMonsterTypeData(socket, dirty);
    game.sendObjectTypeData(socket, dirty);


    
    socket.emit('news', { status: 'Connected'});

    socket.logged_in = false;
    socket.map_needs_cleared = false;

    socket.on('ready', function(data) {
        socket.emit('news', { status: 'Connected'});
    });

    socket.on('add_to_area_data', function(data) {
        world.addToArea(socket, dirty, data);
    });

    socket.on('admin_drawing_floor_data', function(data) {

        if(!socket.is_admin) {
            log(chalk.red("Hacker attacker!"));
            return false;
        }

        log(chalk.green("Admin is drawing floor tile!"));

        game.replaceFloorAdmin(socket, dirty, data);


    });

    // Kind of a catch all for all the changes that people can make to areas
    socket.on('area_data', function(data) {
        console.log("Got area_data");
        world.changeArea(socket, dirty, parseInt(data.area_id), data);
    })

    // The player is assembling something (currently just in construction table
    socket.on('assemble_data', async function (data) {
        //console.log("Player is trying to assemble something!");

        await game.assemble(socket, dirty, data);
    });


    socket.on('attack_data', async function (data) {
        try {
            //console.log("Player is trying to attack something");

            if (data.monster_id) {

                data.monster_id = parseInt(data.monster_id);

                //console.log("Attacking monster id " + data.monster_id);

                let battle_linker_data = {
                    'attacking_id': socket.player_id, 'attacking_type': 'player',
                    'being_attacked_id': data.monster_id, 'being_attacked_type': 'monster' };

                world.addBattleLinker(socket, dirty, battle_linker_data);
                socket.attacking_id = data.monster_id;

                // monsters always attack back!

                let monster_battle_linker_data = {
                    'attacking_id': data.monster_id, 'attacking_type': 'monster',
                    'being_attacked_id': socket.player_id, 'being_attacked_type': 'player' };

                world.addBattleLinker(socket, dirty, monster_battle_linker_data);


            } else if(data.npc_id) {

                data.npc_id = parseInt(data.npc_id);

                //console.log("Attacking npc id " + data.npc_id);

                let battle_linker_data = {
                    'attacking_id': socket.player_id, 'attacking_type': 'player',
                    'being_attacked_id': data.npc_id, 'being_attacked_type': 'npc' };

                world.addBattleLinker(socket, dirty, battle_linker_data);
                socket.attacking_id = data.npc_id;

                // npcs always attack back!

                let npc_battle_linker_data = {
                    'attacking_id': data.npc_id, 'attacking_type': 'npc',
                    'being_attacked_id': socket.player_id, 'being_attacked_type': 'player',
                    'being_attacked_socket_id': socket.id };

                world.addBattleLinker(socket, dirty, npc_battle_linker_data);



            } else if (data.object_id) {

                data.object_id = parseInt(data.object_id);

                if(typeof socket.player_index === 'undefined' || socket.player_index === -1) {
                    return false;
                }

                //console.log("Player is attacking object with ID: " + data.object_id);

                // If we are in the galaxy view, it's gonna be object v object, not player v object


                // Attacking player is in the galaxy view
                if(dirty.players[socket.player_index].coord_id && !dirty.players[socket.player_index].ship_coord_id) {

                    console.log("Attack is happening in the galaxy");
                    let attacking_ship_index = await game_object.getIndex(dirty, dirty.players[socket.player_index].ship_id);

                    if(attacking_ship_index === -1) {
                        return false;
                    }

                    //console.log("Our attacking ship has id: " + dirty.objects[attacking_ship_index].id);

                    let battle_linker_data = {
                        'attacking_id': dirty.objects[attacking_ship_index].id, 'attacking_type': 'object',
                        'being_attacked_id': data.object_id, 'being_attacked_type': 'object' };

                    //console.log("Battle linker data: ");
                    //console.log(battle_linker_data);

                    world.addBattleLinker(socket, dirty, battle_linker_data);

                    //console.log("Set that we are attacking with our ship id: " + dirty.objects[attacking_ship_index].id);

                    // If the object is a ship, it's going to attack back- UNLESS WE are on a watched coord
                    let object_index = await game_object.getIndex(dirty, data.object_id);
                    let object_type_index = await getObjectTypeIndex(dirty.objects[object_index].object_type_id);

                    if(dirty.object_types[object_type_index].is_ship) {

                        let defender_coord_index = await getCoordIndex({ 'coord_id': dirty.objects[object_index].coord_id });

                        if(!dirty.coords[defender_coord_index].watched_by_object_id) {
                            let battle_linker_data = {
                                'attacking_id': data.object_id, 'attacking_type': 'object',
                                'being_attacked_id': dirty.objects[attacking_ship_index].id, 'being_attacked_type': 'object' };

                            world.addBattleLinker(socket, dirty, battle_linker_data);
                        } else {
                            console.log("Not attacking back; in watched zone");
                        }


                    }

                } else {
                    let battle_linker_data = {
                        'attacking_id': socket.player_id, 'attacking_type': 'player',
                        'being_attacked_id': data.object_id, 'being_attacked_type': 'object' };

                    world.addBattleLinker(socket, dirty, battle_linker_data);

                    // If the object is a ship, it's going to attack back
                    let object_index = await game_object.getIndex(dirty, data.object_id);
                    let object_type_index = await getObjectTypeIndex(dirty.objects[object_index].object_type_id);

                    if(dirty.object_types[object_type_index].is_ship) {
                        let battle_linker_data = {
                            'attacking_id': data.object_id, 'attacking_type': 'object',
                            'being_attacked_id': socket.player_id, 'being_attacked_type': 'player' };

                        world.addBattleLinker(socket, dirty, battle_linker_data);
                    }
                }



            }
            // ATTACKING A PLANET!
            else if(data.planet_id) {

                //console.log("Player is attacking a planet");

                data.planet_id = parseInt(data.planet_id);

                let attacking_ship_index = await game_object.getIndex(dirty, dirty.players[socket.player_index].ship_id);

                if(attacking_ship_index === -1) {
                    return false;
                }

                let battle_linker_data = {
                    'attacking_id': dirty.objects[attacking_ship_index].id, 'attacking_type': 'object',
                    'being_attacked_id': data.planet_id, 'being_attacked_type': 'planet' };

                world.addBattleLinker(socket, dirty, battle_linker_data);


            }
            // ATTACKING A PLAYER!
            else if(data.player_id) {

                data.player_id = parseInt(data.player_id);

                console.log("Player is attacking another player");

                let battle_linker_data = {
                    'attacking_id': socket.player_id, 'attacking_type': 'player',
                    'being_attacked_id': data.player_id, 'being_attacked_type': 'player' };


                world.addBattleLinker(socket, dirty, battle_linker_data);
            } else {
                console.log("Can't attack undefined");
            }
        } catch(error) {
            log(chalk.red("Error in attack_data: " + error));
            console.error(error);
        }

    });

    socket.on('attack_stop_data', function (data) {

        //console.log("Got attack_stop_data:");
        //console.log(data);
        battle.attackStop(socket, dirty, data);
    });

    socket.on('autopilot_destination', function(data) {
        log(chalk.green("Got autopilot destination! x,ty: " + data.destination_tile_x + " , " + data.destination_tile_y));
        game.setAutopilotDestination(socket, dirty, parseInt(data.destination_tile_x), parseInt(data.destination_tile_y));

    });

    socket.on('bid_data', function(data) {

        console.log("Got bid_data");
        world.submitBid(socket, dirty, data);
    });

    // The player is BUILDING SOMETHING!!!!!!
    socket.on('build_data', function (data) {
        game.build(socket, dirty, parseInt(data.inventory_item_id), parseInt(data.x), parseInt(data.y));
    });


    socket.on('buy_data', function(data) {

        if(data.inventory_item_id) {
            inventory.buy(socket, dirty, data);
        }
        // currently used to let players buy pods on stations AND emergency pods.....
        else if(data.object_type_id) {
            game.buyObjectType(socket, dirty, data);
        }

    });


    socket.on('chat_data', async function (data) {
        await game.processChatMessage(socket, dirty, data);
    });

    socket.on('claim_ship_data', async function(data) {
        console.log("Got claim_ship_data. data.ship_id: " + data.ship_id);
        await player.claimShip(socket, dirty, parseInt(data.ship_id));
    });

    socket.on('convert_data', async function(data) {
        await game.convert(socket, dirty, data);
    });

    socket.on('create_area_data', async function(data) {
        await game.createArea(socket, dirty, helper.cleanStringInput(data.new_area_name));
    });

    socket.on('create_faction_data', async function(data) {
       await faction.create(socket, dirty, data);
    });


    socket.on('delete_rule_data', function(data) {
        game.deleteRule(socket, dirty, data);
    });

    socket.on('destroy_data', function(data) {
        game.processDestroyData(socket, dirty, data, 'click');
    });

    socket.on('disconnect', function() {
        //console.log("Have auto disconnect");
        disconnectPlayer(socket);
    });

    socket.on('disconnect_data', async function () {
        console.log("Manual Disconnect");
        await disconnectPlayer(socket);
    });

    socket.on('dock_command_data', async function(data) {
        console.log("Got dock command");
        await movement.warpShipToAzurePlanet(socket, dirty, parseInt(data.ship_id));

    });

    socket.on('drop_data', async function (data) {
        await game.drop(socket, dirty, data);
    });

    socket.on('eat_data', function(data) {
        game.eat(socket, dirty, data);
    });

    socket.on('equip_data', function (data) {
        console.log("Player is equipping inventory_item id: " + data.inventory_item_id + " at equip slot: " + data.equip_slot);
        game.equipItem(socket, dirty, data);
    });

    socket.on('faction_join_data', function(data) {
        faction.join(socket, dirty, data);
    });

    socket.on('give_data', function(data) {
        inventory.transferInventory(socket, dirty, data);

    });

    socket.on('leave_faction_data', function(data) {
        faction.leave(socket, dirty);
    });

    socket.on('login_data', function (data) {
        loginPlayer(socket, dirty, data);
    });

    socket.on("map_update", function (data) {
        console.log("client is requesting a map update");
        if(socket.logged_in) {
            map.updateMap(socket, dirty);
        }
    });

    socket.on('mine_data', function (data) {
        game.mine(socket, dirty, data);
    });

    socket.on('mine_stop_data', function(data) {
        game.mineStop(socket, dirty, data);
    });

    socket.on('move_data', async function (data) {

        try {


            //console.log("Got move data for player id:" + dirty.players[socket.player_index].id + " socket.player_index: " +
            //    socket.player_index + " socket id: " + socket.id + " destination_coord_id: " + data.destination_coord_id);
            data.source = 'manual';
            await movement.move(socket, dirty, data);
        } catch(error) {
            log(chalk.red("Error on move_data: " + error));
            console.error(error);
        }

    });

    socket.on('object_name_data', async function(data) {
        await game.changeObjectName(socket, dirty, data);
    });

    socket.on('object_tint_data', async function(data) {
        await game.changeObjectTint(socket, dirty, data);
    });

    socket.on('pick_up_data', async function (data) {
        await game.pickUp(socket, dirty, data);
    });

    socket.on('ping_server', function(data) {
        socket.emit('pong_client');
    });

    socket.on('place_data', async function(data) {
        await inventory.place(socket, dirty, data);
    });

    socket.on('planet_name_data', async function(data) {
       await game.changePlanetName(socket, dirty, data);
    });

    socket.on('plant_data', async function (data) {
        await game.plant(socket, dirty, data);
    });


    socket.on('price_update_data', function(data) {
        console.log("Got price update data");
        inventory.priceUpdate(socket, dirty, parseInt(data.inventory_item_id), parseInt(data.new_price));
    });

    socket.on('reent_area_data', function(data) {
        game.rentArea(socket, dirty, data);
    });

    socket.on('request_assembled_in_linker_data', async function(data) {
        await game.sendAssembledInLinkerData(socket, dirty);
    });

    socket.on('request_assembly_linker_data', async function(data) {
        await game.sendAssemblyLinkerData(socket, dirty);
    });

    socket.on('request_elevator_linkers', async function(data) {
        await world.manageElevatorLinkers(socket, dirty, data.object_id);
    });

    socket.on('request_faction_data', async function(data) {
        await faction.sendData(socket, dirty);
    });

    socket.on('request_fix', async function(data) {
        console.log("Got request fix data");
        await game.fix(socket, dirty, data);
    });

    socket.on('request_skin_purchase_linker_data', async function() {
        await world.sendSkinPurchaseLinkers(socket, dirty);
    });

    socket.on('repair_data', async function(data) {
        await game.repair(socket, dirty, data);
    });

    socket.on('repair_stop_data', async function(data) {
        await game.repairStop(socket, dirty, data);
    });

    socket.on('replace_floor_data', async function(data) {
        await game.replaceFloor(socket, dirty, data);
    });

    socket.on('replace_ship_wall_data', async function(data) {
        await game.replaceShipWall(socket, dirty, data);
    });


    socket.on('request_floor_type_data', async function(data) {
       await game.sendFloorTypeData(socket, dirty);
    });

    socket.on('request_floor_type_display_linker_data', function(data) {
        game.sendFloorTypeDisplayLinkerData(socket, dirty);
    });

    socket.on('request_market_data', function(data) {
        world.sendMarketData(socket, dirty);
    });

    socket.on("request_monster_info", function(data) {
        if(socket.logged_in) {
            //console.log("In request_monster_info function. Client is requesting info for monster id: " + data.monster_id);
            monster.sendInfo(socket, false, dirty, { 'monster_id': data.monster_id });
        }

    });

    socket.on('request_monster_type_data', function(data) {
        game.sendMonsterTypeData(socket, dirty);
    });

    socket.on('request_news', function(data) {
        socket.emit('news', { status: 'Connected'});
    });

    socket.on('request_npc_info', function(data) {
        world.sendNpcInfo(socket, false, dirty, data.npc_id);
    });

    socket.on('request_object_info', async function(data) {

        try {
            data.object_id = parseInt(data.object_id);

            let object_index = await game_object.getIndex(dirty, data.object_id);

            if(object_index === -1) {
                let temp_object = {};
                temp_object.id = data.object_id;

                socket.emit('object_info', { 'object': temp_object, 'remove': true });
                return false;

            }

            await game_object.sendInfo(socket, false, dirty, object_index);
        } catch(error) {
            log(chalk.red("Error in main -> request_object_info: " + error));
            console.error(error);
        }



    });

    socket.on('request_object_type_data', function(data) {
        game.sendObjectTypeData(socket, dirty);
    });

    socket.on('request_object_type_conversion_linker_data', function(data) {
        game.sendObjectTypeConversionLinkerData(socket, dirty);
    });

    socket.on('request_object_type_display_linker_data', function(data) {
        game.sendObjectTypeDisplayLinkerData(socket, dirty);
    });

    socket.on('request_object_type_equipment_linker_data', function(data) {
        game.sendObjectTypeEquipmentLinkerData(socket, dirty);
    });

    socket.on('request_planet_info', async function(data) {

        data.planet_id = parseInt(data.planet_id);
        let planet_index = await planet.getIndex(dirty, { 'planet_id': data.planet_id });

        if(planet_index === -1) {
            return false;
        }
        
        await planet.sendInfo(socket, false, dirty, { 'planet_index': planet_index });

        // Lets send the coord the planet is on too
        if(typeof socket.player_index !== "undefined" && dirty.players[socket.player_index].coord_id) {
            let coord_index = await getCoordIndex({ 'coord_id': dirty.planets[planet_index].coord_id });

            if(coord_index !== -1) {
                await world.sendCoordInfo(socket, false, dirty, {'coord_index': coord_index });
            }
        }

    });


    socket.on('request_planet_type_data', function(data) {
        game.sendPlanetTypeData(socket, dirty);
    });

    socket.on('request_planet_type_display_linker_data', function(data) {
        game.sendPlanetTypeDisplayLinkerData(socket, dirty);
    });

    socket.on('request_player_count', function(data) {
        world.sendPlayerCount(socket);
    });

    socket.on('request_player_data', function(data) {
        game.sendPlayerStats(socket, dirty);
    });

    socket.on('request_race_data', function(data) {
        game.sendRaceData(socket, dirty);
    });

    socket.on('request_race_eating_linker_data', function(data) {
        game.sendRaceEatingLinkerData(socket, dirty);
    });

    socket.on("request_coord_info", function (data) {
        log(chalk.red("request_coord_info is deprecated. NOT SUPER SURE WHY.... BUT I HAD A REASON"));
        return false;
    });

    socket.on("request_planet_info", async function(data) {

        //console.log("Client is requesting planet info for planet id: " + data.planet_id);
        await planet.sendInfo(socket, false, dirty, { 'planet_id': data.planet_id, 'source': 'main.request_planet_info' });
    });

    socket.on("request_player_info", async function(data) {
        //console.log("in request_player_info function");

        await player.sendInfo(socket, false, dirty, data.player_id);

    });

    socket.on('request_rule_data', function(data) {
        game.sendRuleData(socket, dirty);
    });

    socket.on('request_unread_message_count', async function(data) {
        await game.sendUnreadMessageCount(socket, dirty);
    });

    socket.on('research_data', function(data) {
        game.research(socket, dirty, data);
    });

    socket.on('rule_data', function(data) {

        world.addRule(socket, dirty, data);
    });

    socket.on('salvage_data', async function (data) {
        await game.salvage(socket, dirty, data);
    });


    socket.on('salvage_stop_data', async function(data) {
        //console.log("Got salvage_stop_data");
        await game.salvageStop(socket, dirty, data);
    });


    socket.on('ship_name_data', async function(data) {
        await game.changeShipName(socket, dirty, data);
    });

    socket.on('skin_remove_data', async function(data) {
        console.log("Got skin remove data");
        await world.skinRemove(socket, dirty, data.skin_object_type_id);
    });

    socket.on('skin_use_data', async function(data) {
        console.log("Got skin use data");
        await world.skinUse(socket, dirty, data.skin_object_type_id);
    });

    socket.on('switch_body_data', function(data) {

        if(typeof data.object_id === 'undefined') {
            log(chalk.yellow("No object id sent into switch_body"));
            return false;
        }

        let new_body_id = parseInt(data.object_id);
        let move_inventory = helper.cleanStringInput(data.move_inventory);
        game.switchBody(socket, dirty, new_body_id, move_inventory);
    });

    socket.on('switch_ship_data', async function(data) {
        await player.switchShip(socket, dirty, data);
    });

    socket.on("trade_initiate", function(data) {

        game.addTradeLinker(socket, data.other_player_id)
    });

    socket.on('trash_data', async function (data) {
        await game.trash(socket, dirty, data);
    });

    socket.on('take_data', async function (data) {
        await inventory.take(socket, dirty, data.inventory_item_id, data.amount);
    });

    socket.on('use_elevator', async function(data) {

        await game.useElevator(socket, dirty, data.elevator_id);
    });

    socket.on('view_change_data', async function (data) {

        try {

            let player_index = await player.getIndex(dirty, { 'player_id': socket.player_id });

            if (data.new_view === 'ship') {
                await movement.switchToShip(socket, dirty);

                await world.setPlayerMoveDelay(socket, dirty, player_index);
                await map.updateMap(socket, dirty);


            } else if(data.new_view === 'galaxy') {

                await movement.switchToGalaxy(socket, dirty, player_index);
                await world.setPlayerMoveDelay(socket, dirty, player_index);
                await map.updateMap(socket, dirty);
                //movement.launchFromPlanet(socket, dirty);
            } else if(data.new_view === 'planet') {
                // probably have this commented out because we switch when the player moves onto a planet
                //movement.switchToPlanet(socket, dirty);
                log(chalk.yellow("In planet section of view_change_data but we don't do anything else here"));
                await world.setPlayerMoveDelay(socket, dirty, player_index);
            } else if(data.new_view === 'virtual') {
                console.log("Player is trying to enter the virtual view!");
                await movement.switchToVirtual(socket, dirty);
                await map.updateMap(socket, dirty);

            }

            /*
            else {
                console.log("Changing view to SPACE");
                socket.player_planet_id = false;
                socket.player_on_ship_id = false;

                socket.emit('launched_data');

                console.log("Player is back to viewing SPACEEEEE!");

                // update any ship_coords that have the player id
                var sql = "UPDATE ship_coords SET player_id = null WHERE player_id = ?";
                var inserts = [socket.player_id];
                sql = mysql.format(sql, inserts);
                pool.query(sql, function(err, result) {
                    if(err) throw err;
                });

                // TODO Fix the bugs causing us to need this
                var sql = "UPDATE planet_coords SET player_id = null WHERE player_id = ?";
                var inserts = [socket.player_id];
                sql = mysql.format(sql, inserts);
                pool.query(sql, function(err, result) {
                    if(err) throw err;

                })
            }
            */
        } catch(error) {
            log(chalk.red("Error in view_change_data: " + error));
            console.error(error);
        }



    });


    socket.on('unequip_data', function(data) {
        player.unequip(socket, dirty, data.equipment_linker_id);
        game.calculatePlayerStats(socket, dirty);
    });



});



// FUNCTION TIME


async function clearMonsterExtraCoords(monster_index) {
    try {

        let monster_type_index = getMonsterTypeIndex(dirty.monsters[monster_index].monster_type_id);

        if(dirty.monsters[monster_index].planet_coord_id) {
            let monster_coord_index = await getPlanetCoordIndex({ 'planet_coord_id': dirty.monsters[monster_index].planet_coord_id});

            dirty.planet_coords.forEach(function(planet_coord, i) {

                if(planet_coord.monster_id === dirty.monsters[monster_index].id || planet_coord.belongs_to_monster_id === dirty.monsters[monster_index].id) {
                    // If the tile x,y is outside the movement tile_width/height, we remove it
                    if(Math.abs(planet_coord.tile_x - dirty.planet_coords[monster_coord_index].tile_x) > dirty.monster_types[monster_type_index].movement_tile_width ||
                        Math.abs(planet_coord.tile_y - dirty.planet_coords[monster_coord_index].tile_y) > dirty.monster_types[monster_type_index].movement_tile_height
                    ) {
                        log(chalk.red("We think we should remove monster id/belongs_to_monster_id from a planet coord!"));
                        console.log("Monster's planet coord tile x,y: " + dirty.planet_coords[monster_coord_index].tile_x +
                            "," + dirty.planet_coords[monster_coord_index].tile_y);

                        console.log("Monster id: " + dirty.monsters[monster_index].id + " type: " + dirty.monster_types[monster_type_index].name);
                        console.log("The offending planet coord's tile x/y: " + planet_coord.tile_x + "," + planet_coord.tile_y );

                        if(planet_coord.monster_id === dirty.monsters[monster_index].id) {
                            updateCoordGeneric(false, { 'planet_coord_index': i, 'monster_id': false });
                        }

                        if(planet_coord.belongs_to_monster_id === dirty.monsters[monster_index].id) {
                            updateCoordGeneric(false, { 'planet_coord_index': i, 'belongs_to_monster_id': false });
                        }

                    }
                }

            });

        }

    } catch(error) {
        log(chalk.red("Error in main.clearMonsterExtraCoords: " + error));
    }
}

module.exports.clearMonsterExtraCoords = clearMonsterExtraCoords;


async function clearObjectExtraCoords(object_index) {

    try {

        let object_type_index = getObjectTypeIndex(dirty.objects[object_index].object_type_id);

        let display_linkers = dirty.object_type_display_linkers.filter(linker =>
            linker.object_type_id === dirty.object_types[object_type_index].id && !linker.only_visual);

        let movement_tile_width = getObjectTileWidth(display_linkers);
        let movement_tile_height = getObjectTileHeight(display_linkers);

        if(dirty.objects[object_index].coord_id) {

            let object_coord_index = await getCoordIndex({ 'coord_id': dirty.objects[object_index].coord_id });

            dirty.coords.forEach(function(coord, i) {

                if(coord.object_id === dirty.objects[object_index].id || coord.belongs_to_object_id === dirty.objects[object_index].id) {

                    // If the tile x,y is outside the movement tile_width/height, we remove it
                    if(Math.abs(coord.tile_x - dirty.coords[object_coord_index].tile_x) > movement_tile_width ||
                        Math.abs(coord.tile_y - dirty.coords[object_coord_index].tile_y) > movement_tile_height
                    ) {
                        log(chalk.red("We think we should remove object id/belongs_to_object id from a coord!"));
                        console.log("Object's coord tile_x/y: " + dirty.coords[object_coord_index].tile_x + "," + dirty.coords[object_coord_index].tile_y);
                        console.log("Offending coord's tile_x/y: " + coord.tile_x + "," + coord.tile_y);

                        if(coord.object_id === dirty.objects[object_index].id) {
                            updateCoordGeneric(false, { 'coord_index': i, 'object_id': false });
                        }

                        if(coord.belongs_to_object_id === dirty.objects[object_index].id) {
                            updateCoordGeneric(false, { 'coord_index': i, 'belongs_to_object_id': false });
                        }
                    }

                }
            });
        }

    } catch(error) {
        log(chalk.red("Error in main.clearObjectExtraCoords: " + error));
    }


}

module.exports.clearObjectExtraCoords = clearObjectExtraCoords;


function clearPlayerExtraCoords(player_index) {

    try {
        //console.log("In clearPlayerExtraCoords");
        // Galaxy - get any other coords and fix them
        if(dirty.players[player_index].coord_id) {

            dirty.coords.forEach(function(coord, i) {

                if(coord.player_id === dirty.players[player_index].id && coord.id !== dirty.players[player_index].coord_id) {
                    log(chalk.red("Found A Galaxy Coord The Player Should Not Be On. ID: " + coord.id));

                    updateCoordGeneric(false, { 'coord_index': i, 'player_id': false });

                }

            });
        }
    } catch(error) {
        log(chalk.red("Error in main.clearPlayerExtraCoords: " + error));
    }


}

module.exports.clearPlayerExtraCoords = clearPlayerExtraCoords;



async function getAreaIndex(area_id) {

    let area_index = -1;

    if(area_id) {

        area_id = parseInt(area_id);
        area_index = dirty.areas.findIndex(function(obj) { return obj && obj.id === area_id; });

        // try grabbing it from the database
        if(area_index === -1) {
            let [rows, fields] = await (pool.query("SELECT * FROM areas WHERE id = ?", [area_id]));

            if(rows[0]) {
                let area = rows[0];
                area.has_change = false;
                area_index = dirty.areas.push(area) - 1;

                // double sure the id is an int
                dirty.areas[area_index].id = parseInt(dirty.areas[area_index].id);
            }
        }
    }

    return area_index;

}

module.exports.getAreaIndex = getAreaIndex;


async function getEatingLinkerIndex(data) {

    let eating_linker_index = -1;

    if(data.id) {

        data.id = parseInt(data.id);
        eating_linker_index = dirty.eating_linkers.findIndex(function(obj) { return obj && obj.id === data.id; });

        // try grabbing it from the database
        if(eating_linker_index === -1) {
            let [rows, fields] = await (pool.query("SELECT * FROM eating_linkers WHERE id = ?", [data.id]));

            if(rows[0]) {
                let eating_linker = rows[0];
                eating_linker.has_change = false;
                //console.log("Adding eating linker id: " + eating_linker.id + " to dirty");
                eating_linker_index = dirty.eating_linkers.push(eating_linker) - 1;
                //console.log("New eating_linker index: " + eating_linker_index);

                // double sure the id is an int
                dirty.eating_linkers[eating_linker_index].id = parseInt(dirty.eating_linkers[eating_linker_index].id);
                //console.log("In getEatingLinkerIndex eating_object_type_id is : " + dirty.eating_linkers[eating_linker_index].eating_object_type_id);

            }
        }
    }

    return eating_linker_index;

}

module.exports.getEatingLinkerIndex = getEatingLinkerIndex;


async function getEquipmentLinkerIndex(data) {
    try {

        if(!data.equipment_linker_id) {
            return false;
        }

        data.equipment_linker_id = parseInt(data.equipment_linker_id);

        if(isNaN(data.equipment_linker_id)) {
            return false;
        }

        let equipment_linker_index = dirty.equipment_linkers.findIndex(function(obj) { return obj &&
            obj.id === data.equipment_linker_id; });

        if(equipment_linker_index === -1) {
            let [rows, fields] = await (pool.query("SELECT * FROM equipment_linkers WHERE id = ?", [data.equipment_linker_id]));

            if(rows[0]) {
                let equipment_linker = rows[0];
                equipment_linker.has_change = false;
                equipment_linker_index = dirty.equipment_linkers.push(equipment_linker) - 1;
            }
        }


       return equipment_linker_index;

    } catch(error) {
        log(chalk.red("Error in main.getEquipmentLinkerIndex: " + error));
        console.error(error);
    }
}

module.exports.getEquipmentLinkerIndex = getEquipmentLinkerIndex;


async function getInventoryItemIndex(inventory_item_id) {
    //console.log("In getInventoryItemIndex");

    inventory_item_id = parseInt(inventory_item_id);

    if(isNaN(inventory_item_id)) {
        log(chalk.yellow("Invalid inventory_item_id passed in"));
        return false;
    }



    let inventory_item_index = dirty.inventory_items.findIndex(function(obj) { return obj && obj.id === inventory_item_id; });

    if(inventory_item_index === -1) {

        try {
            let [rows, fields] = await (pool.query("SELECT * FROM inventory_items WHERE id = ?",
                [inventory_item_id]));

            if(rows[0]) {
                let inventory_item = rows[0];
                inventory_item.has_change = false;
                console.log("Adding inventory item id: " + inventory_item.id);
                inventory_item_index = dirty.inventory_items.push(inventory_item) - 1;
                world.processInventoryItem(dirty, inventory_item_index);

            }
        } catch(error) {
            console.error("Unable to get inventory item from database: " + error);
        }

    }

    //console.log("Returning inventory item index: " + inventory_item_index);
    return inventory_item_index;
}

module.exports.getInventoryItemIndex = getInventoryItemIndex;


function getMonsterTypeIndex(monster_type_id) {
    return dirty.monster_types.findIndex(function(obj) { return obj && obj.id === parseInt(monster_type_id); });
}

module.exports.getMonsterTypeIndex = getMonsterTypeIndex;




function getPlanetTypeIndex(planet_type_id) {

    planet_type_id = parseInt(planet_type_id);
    return dirty.planet_types.findIndex(function(obj) { return obj && obj.id === planet_type_id; });
}

module.exports.getPlanetTypeIndex = getPlanetTypeIndex;


async function getPlayerRelationshipLinkerIndex(player_index, type, type_index) {

    try {

        let relationship_index = -1;
        if(type === 'race') {
            relationship_index = dirty.player_relationship_linkers.findIndex(function(obj) { return obj &&
                obj.player_id === dirty.players[player_index].id && obj.race_id === dirty.races[type_index].id; });
        } else if(type === 'npc') {
            relationship_index = dirty.player_relationship_linkers.findIndex(function(obj) { return obj &&
                obj.player_id === dirty.players[player_index].id && obj.npc_id === dirty.npcs[type_index].id; });
        }



        if(relationship_index === -1) {

            let sql = "";
            let inserts = [];

            if(type === 'race') {
                sql = "SELECT * FROM player_relationship_linkers WHERE player_id = ? AND race_id = ?";
                inserts = [dirty.players[player_index].id, dirty.races[type_index].id];
            } else if(type === 'npc') {
                sql = "SELECT * FROM player_relationship_linkers WHERE player_id = ? AND npc_id = ?";
                inserts = [dirty.players[player_index].id, dirty.npcs[type_index].id];
            }

            let [rows, fields] = await (pool.query(sql,
                inserts));

            if(rows[0]) {

                relationship_index = dirty.player_relationship_linkers.push(rows[0]) - 1;


            } else {
                // We need to create it
                let insert_sql = "";
                let insert_inserts = [];

                if(type === 'race') {
                    insert_sql = "INSERT INTO player_relationship_linkers(player_id, race_id) VALUES(?,?)";
                    insert_inserts = [dirty.players[player_index].id, dirty.races[type_index].id];
                } else if(type === 'npc') {
                    insert_sql = "INSERT INTO player_relationship_linkers(player_id, npc_id) VALUES(?,?)";
                    insert_inserts = [dirty.players[player_index].id, dirty.npcs[type_index].id];
                }

                let [result] = await (pool.query(insert_sql,
                    insert_inserts));

                let new_id = result.insertId;
                console.log("Got new id as: " + new_id);

                let [rows, fields] = await (pool.query("SELECT * FROM player_relationship_linkers WHERE id = ?",
                    [new_id]));

                if(rows[0]) {
                    relationship_index = dirty.player_relationship_linkers.push(rows[0]) - 1;

                }

            }
        }

        return relationship_index;
    } catch(error) {
        log(chalk.red("Error in getPlayerRelationshipLinkerIndex: " + error));
    }


}

module.exports.getPlayerRelationshipLinkerIndex = getPlayerRelationshipLinkerIndex;


//  data:   ship_coord_id   OR   (   ship_id   |   level   |   tile_x   |   tile_y   )
/**
 * 
 * @param {Object} data 
 * @param {number=} data.ship_coord_id
 * @param {number=} data.ship_id
 * @param {number=} data.level
 * @param {number=} data.tile_x
 * @param {number=} data.tile_y
 * @param {number=} data.spawned_monster_id
 */
async function getShipCoordIndex(data) {

    try {
        let ship_coord_index = -1;

        if(data.ship_coord_id) {
            ship_coord_index = dirty.ship_coords.findIndex(function(obj) {
                return obj && obj.id === parseInt(data.ship_coord_id);
            });
        } else if(typeof data.spawned_monster_id !== "undefined") {
            ship_coord_index = dirty.ship_coords.findIndex(function(obj) { return obj && obj.spawned_monster_id === parseInt(data.spawned_monster_id); });
        } else {
            ship_coord_index = dirty.ship_coords.findIndex(function(obj) {
                return obj && obj.ship_id === parseInt(data.ship_id) && obj.level === parseInt(data.level) &&
                    obj.tile_x === parseInt(data.tile_x) && obj.tile_y === parseInt(data.tile_y)
            });
        } 

        // we need to try and find it in the database
        if(ship_coord_index === -1) {

            let where_part;
            let inserts;
            if(data.ship_coord_id) {
                where_part = 'WHERE ship_coords.id = ?';
                inserts = [data.ship_coord_id];

            } else if(typeof data.spawned_monster_id !== "undefined") {
                where_part = 'WHERE ship_coords.spawned_monster_id = ?';
                inserts = [data.spawned_monster_id];
            } else {
                where_part = 'WHERE ship_coords.ship_id = ? AND ship_coords.level = ? AND ship_coords.tile_x = ? AND ship_coords.tile_y = ?';
                inserts = [data.ship_id, data.level, data.tile_x, data.tile_y];
            }

            let [rows, fields] = await (pool.query("SELECT * FROM ship_coords " + where_part,
                inserts));

            if(rows[0]) {
                let adding_ship_coord = rows[0];
                adding_ship_coord.has_change = false;
                ship_coord_index = dirty.ship_coords.push(adding_ship_coord) - 1;
            }
        }

        return ship_coord_index;
    } catch(error) {
        log(chalk.red("Error in getShipCoordIndex: " + error));
        console.error(error);
    }

}

module.exports.getShipCoordIndex = getShipCoordIndex;


// lets just grab the IDs of the planet coords - and use our getPlanetCoordIndex function for actually checking/adding them

async function grabPlanetCoords(planet_id, grabbing_type) {

    let [rows, fields] = await (pool.query("SELECT planet_coords.id FROM planet_coords " +
        "WHERE planet_coords.planet_id = ? AND planet_coords.level = ? AND planet_coords.floor_type_id = 11", [planet_id, 0]));

    if(rows[0]) {
        for(let i = 0; i < rows.length; i++) {
            await getPlanetCoordIndex({'planet_coord_id': rows[i].id});
        }
    }
}

module.exports.grabPlanetCoords = grabPlanetCoords;


async function loginPlayer(socket, dirty, data) {

    try {

        let trying_player_name = data.player_name;
        let trying_email = data.email;
        let trying_password = data.password;
        let valid_user = false;

        //console.log("Socket id: " + socket.id + " sent login info: " + trying_player_name + " " + trying_email + "," + trying_password);

        let [rows, fields] = await (pool.query("SELECT id,name,password,password_temp,password_node,is_banned FROM users WHERE email = ?", [trying_email]));

        if(!rows[0]) {
            socket.emit('login_data', { 'status': 'failed'});
            dirty.admin_logs.push({ 'type': "failed_login", "text": "Failed login for player name: " + trying_player_name + ", email: " + trying_email });

            return false;
        }


        let user = rows[0];

        if(user.is_banned) {
            socket.emit('login_data', { 'status': 'Failed. You Are Banned' });
            return false;
        }


        // 1. OLD LOGIN METHOD
        //let modified_trying_password = crypto.createHash('sha256').update(trying_password).digest('base64');

        // we need to convert the password to the 'node' version.
        let user_pass_php = rows[0].password;
        let user_password_node_version = user_pass_php.replace(/^\$2y(.+)$/i, '$2a$1');


        bcrypt.compare(trying_password, user_password_node_version, async function(err, res) {

            console.log("New login res: " + res);

            if(res === false) {

                socket.emit('login_data', { 'status':'failed' });
                return false;
            }


            [rows, fields] = await (pool.query("SELECT * FROM players WHERE user_id = ? AND name = ?", [user.id, trying_player_name]));

            if(!rows[0]) {
                console.log("Unable to find player");
                socket.emit('login_data', { 'status':'failed' });
                return false;
            }
            
            let logging_in_player = rows[0];
            let already_connected = false;


            if(helper.notFalse(logging_in_player.is_deleted)) {
                socket.emit('login_data', { 'status':'Player Is Deleted' });
                return false;
            }
    
            // Prevent players from accidently logging in multiple times
            for(var socket_id in io.sockets.sockets) {
                //console.log("Checking socket " + socket_id);
                if(io.sockets.sockets[socket_id].player_id === logging_in_player.id) {
                    socket.emit('login_data', { 'status':'failed' });
                    return false;
                }
            }


    
            let placed_player = false;
            let starting_view = false;
    
            let [result] = await (pool.query("UPDATE players SET socket_id = ? WHERE id = ?", [socket.id, user.id]));
    
            socket.player_index = await player.getIndex(dirty, {'player_id':logging_in_player.id, 'source': 'main.loginPlayer' });
            let player_index = socket.player_index;
    
            log(chalk.green("Got socket player index as: " + socket.player_index));
    
    
    
            socket.logged_in = true;
            socket.placed_player = false;
            socket.player_id = logging_in_player.id;
            socket.player_body_id = logging_in_player.body_id;
            socket.player_defense = logging_in_player.defense;
    
            // Deprecated
            socket.player_exp = logging_in_player.exp;
            
            socket.player_faction_id = logging_in_player.faction_id;
            socket.player_food_ticks = logging_in_player.food_ticks;
            socket.player_current_hp = logging_in_player.current_hp;
            socket.player_level = logging_in_player.level;
            socket.player_name = logging_in_player.name;
    
            socket.player_ship_id = logging_in_player.ship_id;
    
    
            socket.player_range = logging_in_player.attack_range;
    
            socket.player_max_hp = logging_in_player.max_hp;
            socket.player_energy = logging_in_player.energy;
    
            // lets try send the display linkers fast! before any map data
            game.sendObjectTypeEquipmentLinkerData(socket, dirty);
            game.sendPlanetTypeDisplayLinkerData(socket, dirty);
    
            if (dirty.players[socket.player_index].is_admin) {
                socket.is_admin = true;
                console.log("Set is_admin TO TRUE");
    
                // send admin build buttons
                socket.emit('admin_data', {
                    'main_button_wrapper': '<a class="button is-default main-button" onclick="admin_functions.toggleAdminDisplay();"><i class="fad fa-toolbox fa-2x" class="main-icon"></i></a>',
                    'set_draw_function': 'admin_drawing_floor_type_id = floor_type_id;',
                    'options_function': 'let html_string = ""; html_string += "<button class=\\"button\\" onclick=\\"admin_functions.setAdminDrawFloorID(false);\\">None</button>"; floor_types.forEach(function(floor_type) { html_string += "<button class=\\"button\\" onclick=\\"admin_functions.setAdminDrawFloorID(" + floor_type.id + ");\\">" + floor_type.name + "</button>"; }); $("#admin_data").append(html_string);',
                    'toggle_function': 'if($("#admin_data").is(":visible")) { $("#admin_data").hide(); $("#admin_data").empty(); } else { $("#admin_data").show(); admin_functions.showAdminOptions(); }'
                });
            } else {
                socket.is_admin = false;
                console.log("Set is admin to FALSE");
            }
    
            // Gotta make sure the player HAS A BODY!
            // lets get the player body
            let resend_player_info = false;
    
            if(!dirty.players[socket.player_index].body_id) {
                console.log("Player does not have a body. Giving them a new body");
                await world.setPlayerBody(dirty, player_index);
                resend_player_info = true;
            } else {
                // second way a player might not have a body
                let body_index = await game_object.getIndex(dirty, dirty.players[socket.player_index].body_id);
    
                if(body_index === -1) {
                    log(chalk.yellow("Player did not have a body when logging in!!"));
                    await world.setPlayerBody(dirty, player_index);
                }
            }
    
            
    
            // Make sure the player's ship still exists
            let ship_index = -1;
            if(dirty.players[player_index].ship_id) {
                ship_index = await game_object.getIndex(dirty, dirty.players[player_index].ship_id);
            }
    
            if(ship_index === -1) {
                console.log("Creating a ship for player id: " + dirty.players[player_index].id);
                let new_ship_index = await world.insertObjectType(false, dirty, { 'object_type_id': 114, 'player_id': dirty.players[player_index].id });

                if(new_ship_index !== -1) {
                    dirty.players[player_index].ship_id = dirty.objects[new_ship_index].id;
                    dirty.players[player_index].has_change = true;
                } else {
                    log(chalk.red("Error creating a ship for player!"));
                }
                
    
                // I believe this is being taken care of in world.insertObjectType
                //await world.generateShip(dirty, new_ship_index);
                resend_player_info = true;
            }
            // And make sure we have the ship coords in memory
            else {
                await getShipCoords(ship_index);
            }
    
            dirty.players[player_index].ship_index = ship_index;
    
            if(dirty.players[player_index].previous_planet_coord_id) {
                log(chalk.green("Trying to set player on planet. have previous planet coord id: " + dirty.players[player_index].previous_planet_coord_id));
    
                // the player should have a planet coord id - see if we can place them back there. If not - place them in the galaxy close to the planet
    
    
                let planet_coord_index = await getPlanetCoordIndex({'planet_coord_id': dirty.players[player_index].previous_planet_coord_id });
    
                if(planet_coord_index !== -1) {
    
                    let can_place_result = await player.canPlace(dirty, 'planet', dirty.planet_coords[planet_coord_index], player_index);
    
                    if(can_place_result === true) {
    
                        starting_view = 'planet';
                        socket.join("planet_" + dirty.planet_coords[planet_coord_index].planet_id);
    
                        // update the planet coord
                        let planet_coord_data = { 'planet_coord_index': planet_coord_index, 'player_id': socket.player_id };
                        await updateCoordGeneric(socket, planet_coord_data);
                        dirty.players[player_index].planet_coord_id = dirty.planet_coords[planet_coord_index].id;
                        dirty.players[player_index].planet_coord_index = planet_coord_index;
                        dirty.players[player_index].ship_coord_id = false;
                        dirty.players[player_index].ship_coord_index = -1;
                        dirty.players[player_index].has_change = true;
                        await player.sendInfo(socket, "planet_" + dirty.planet_coords[planet_coord_index].planet_id,
                            dirty, dirty.players[player_index].id);
                        placed_player = true;
    
                        // To dynamically load in just the monsters we initially need, the client is going to need to know
                        // what planet type we are on
                        let planet_index = await planet.getIndex(dirty, { 'planet_id': dirty.planet_coords[planet_coord_index].planet_id });
                        if(planet_index !== -1) {
                            await planet.sendInfo(socket, false, dirty, { 'planet_index': planet_index });
                        }
    
    
                        await map.updateMap(socket, dirty);
    
                    }
                } else {
                    console.log("Could not get index for previous planet coord id: " + dirty.players[player_index].previous_planet_coord_id);
                    dirty.players[socket.player_index].previous_planet_coord_id = false;
                    dirty.players[socket.player_index].has_change = true;
                }
    
    
            }
    
            if(dirty.players[player_index].previous_ship_coord_id && !placed_player) {
                log(chalk.green("Trying to set player on ship. have previous ship coord id: " + dirty.players[player_index].previous_ship_coord_id));
    
    
                // lets get that coord and see if we can place the player there
                let ship_coord_index = await getShipCoordIndex({ 'ship_coord_id': dirty.players[player_index].previous_ship_coord_id });
    
                if(ship_coord_index !== -1) {
    
                    // make sure the ship is loaded into memory
                    let ship_index = await game_object.getIndex(dirty, dirty.ship_coords[ship_coord_index].ship_id);
    
    
                    let can_place_result = await player.canPlace(dirty, 'ship', dirty.ship_coords[ship_coord_index], player_index);
    
                    if(can_place_result === true) {
    
                        
    
                        // Setting the room before we send out all the info
                        starting_view = 'ship';
                        socket.join("ship_" + dirty.ship_coords[ship_coord_index].ship_id);
    
                        let ship_coord_data = { 'ship_coord_index': ship_coord_index, 'player_id': dirty.players[player_index].id };
                        await updateCoordGeneric(socket, ship_coord_data);
                        placed_player = true;
    
                        dirty.players[player_index].ship_coord_id = dirty.ship_coords[ship_coord_index].id;
                        dirty.players[player_index].ship_coord_index = ship_coord_index;
                        dirty.players[player_index].planet_coord_id = false;
                        dirty.players[player_index].planet_coord_index = -1;
                        dirty.players[player_index].has_change = true;
    
                        await player.sendInfo(socket, "ship_" + dirty.ship_coords[ship_coord_index].ship_id, dirty, dirty.players[player_index].id);
                        await map.updateMap(socket, dirty);
                        await player.sendInfo(socket, "ship_" + dirty.ship_coords[ship_coord_index].ship_id, dirty, dirty.players[player_index].id);
    
                        console.log("Should have player at ship x,y: " + dirty.ship_coords[ship_coord_index].tile_x + "," +
                            dirty.ship_coords[ship_coord_index].tile_y);
    
    
                        placed_player = true;
    
                        // If we had a previous galaxy coord, we want to try to place the ship there as well
                        if(dirty.players[player_index].previous_coord_id) {
                            console.log("Player has a previous galaxy coord as well. Trying to put their ship on it");
                            let coord_index = await getCoordIndex({'coord_id': dirty.players[player_index].previous_coord_id});
    
    
                            let can_place_result = await player.canPlace(dirty, 'galaxy', dirty.coords[coord_index], player_index);
                            //let can_place_result = await canPlace('galaxy', dirty.coords[coord_index], 'player', dirty.players[player_index].id);
                            if(can_place_result) {
                                let coord_data = { 'coord_index': coord_index, 'player_id': dirty.players[player_index].id,
                                    'object_id': dirty.players[player_index].ship_id };
                                await updateCoordGeneric(socket, coord_data);
                            }
                        }
    
                    } else {
                        log(chalk.yellow("Cannot place player there. Going to default to galaxy."));
                        console.log(dirty.ship_coords[ship_coord_index]);
    
                        // Since we failed to place the player on the ship, we are gonna end up shunting them back to the galaxy
                        // We need to clear the ship_coord_id from the player
                        dirty.players[player_index].previous_ship_coord_id = false;
                        dirty.players[player_index].has_change = true;
                    }
                } else {
                    console.log("Got -1 index for ship coord id: " + dirty.players[player_index].previous_ship_coord_id);
                    dirty.players[socket.player_index].ship_coord_id = false;
                    dirty.players[socket.player_index].ship_coord_index = -1;
                    dirty.players[socket.player_index].has_change = true;
                }
    
    
            }
    
            if(dirty.players[player_index].previous_coord_id && !placed_player) {
                log(chalk.green("Trying to set player in galaxy"));
    
                let coord_index = -1;
    
    
                console.log("Trying to get index for galaxy coord: " + dirty.players[player_index].previous_coord_id);
                coord_index = await getCoordIndex({ 'coord_id': dirty.players[player_index].previous_coord_id });
    
    
    
                if(coord_index !== -1) {
    
    
                    let can_place_result = await player.canPlace(dirty, 'galaxy', dirty.coords[coord_index], player_index);
    
                    if(can_place_result === true) {
                        console.log("Coord index: " + coord_index);
    
                        let player_ship_index = await game_object.getIndex(dirty, dirty.players[player_index].ship_id);
    
                        await updateCoordGeneric(socket, { 'coord_index': coord_index, 'player_id': dirty.players[player_index].id,
                            'object_id': dirty.players[player_index].ship_id });
    
                        placed_player = true;
                        dirty.players[player_index].coord_id = dirty.coords[coord_index].id;
                        dirty.players[player_index].coord_index = coord_index;
                        dirty.players[player_index].planet_coord_id = false;
                        dirty.players[player_index].planet_coord_index = -1;
                        dirty.players[player_index].ship_coord_id = false;
                        dirty.players[player_index].ship_coord_index = -1;
                        dirty.players[player_index].has_change = true;
    
                        if(player_ship_index !== -1) {
                            dirty.objects[player_ship_index].coord_id = dirty.coords[coord_index].id;
                            dirty.objects[player_ship_index].coord_index = coord_index;
                            dirty.objects[player_ship_index].has_change = true;
                            await game_object.sendInfo(socket, "galaxy", dirty, player_ship_index);
                        }
    
                        await player.sendInfo(socket, "galaxy", dirty, dirty.players[player_index].id);
    
                        await map.updateMap(socket, dirty);
    
                        starting_view = 'galaxy';
                        socket.join("galaxy");
                    } else {
                        console.log("Found galaxy coord but could not place player there");
                    }
                } else {
                    console.log("Got -1 index for player coord id: " + dirty.players[player_index].coord_id);
                }
    
    
    
    
            }
    
            // put the player on a random galaxy coord
            if(!placed_player) {
                console.log("Was not able to place player on planet or specific galaxy coord. Getting a random one");
                // get a random galaxy coord, and try to place the player there
                let max_tries = 100;
                let current_tries = 1;
    
                while(!placed_player && current_tries < max_tries) {
                    current_tries++;
                    let random_x = Math.floor(Math.random() * 20);
                    let random_y = Math.floor(Math.random() * 20);
    
                    let coord_data = { 'tile_x': random_x, 'tile_y': random_y};
                    let coord_index = await getCoordIndex(coord_data);
    
                    let can_place_result = await player.canPlace(dirty, 'galaxy', dirty.coords[coord_index], player_index);
    
                    if(can_place_result === true) {
                        console.log("Found galaxy coord to place player on! (index: " + coord_index + " id: " +
                            dirty.coords[coord_index].id + " tile_x: " + dirty.coords[coord_index].tile_x +
                            " tile_y: " + dirty.coords[coord_index].tile_y);
                        let coord_data = { 'coord_index': coord_index, 'player_id': dirty.players[player_index].id };
                        await updateCoordGeneric(socket, coord_data);
                        placed_player = true;
    
                        dirty.players[socket.player_index].coord_id = dirty.coords[coord_index].id;
                        dirty.players[socket.player_index].coord_index = coord_index;
                        dirty.players[socket.player_index].planet_coord_id = false;
                        dirty.players[socket.player_index].planet_coord_index = -1;
                        dirty.players[socket.player_index].ship_coord_id = false;
                        dirty.players[socket.player_index].ship_coord_index = -1;
                        dirty.players[socket.player_index].has_change = true;
    
                        await map.updateMap(socket, dirty);
                        socket.emit('chat', {'message':'Placed on random galaxy coord', 'scope':'system'});
                        starting_view = 'galaxy';
                        socket.join("galaxy");
                        placed_player = true;
                    }
                }
            }
    
            console.log("Sending successful login information");
            socket.emit('login_data',
                {'status': 'success', 'player_id': socket.player_id,
                    'player_current_hp': socket.player_current_hp, 'player_max_hp': socket.player_max_hp, 'starting_view': starting_view });
    
            await game.sendPlayerStats(socket, dirty);
            await player.sendInfo(socket, false, dirty, socket.player_id);
    
    
            //populate client inventory data
    
            await inventory.sendInventory(socket, false, dirty, 'player', dirty.players[player_index].id);
    
            // send the player's research linkers
            //console.log("Sending research linkers");
            let player_research_linkers = dirty.player_research_linkers.filter(linker => linker.player_id === dirty.players[player_index].id);
            for(let i = 0; i < player_research_linkers.length; i++) {
                socket.emit('player_research_linker_info', { 'player_research_linker': player_research_linkers[i] });
            }
    
            // send the player's relationship linkers
            //console.log("Sending relationship linkers");
            let player_relationship_linkers = dirty.player_relationship_linkers.filter(linker => linker.player_id === dirty.players[player_index].id);
            for(let i = 0; i < player_relationship_linkers.length; i++) {
                socket.emit('player_relationship_linker_info', { 'player_relationship_linker': player_relationship_linkers[i] });
            }
    
            // send any AIs the player has, and any AI rules attached to them
            //console.log("Searching for ais for player id: " + dirty.players[player_index].id);
    
            await world.sendPlayerAIs(socket, false, dirty, dirty.players[player_index].id);
    
    
    
            // On login we gave the player a body or a ship - we need to immediately send this new info too!
            if(resend_player_info) {
                console.log("Gave player a body or a ship on login. Resending player stats and info");
                let player_info = await player.getCoordAndRoom(dirty, player_index);
                await game.sendPlayerStats(socket, dirty);
                await player.sendInfo(socket, player_info.room, dirty, socket.player_id);
    
            }
    
            await world.setPlayerMoveDelay(socket, dirty, player_index);
    
            //console.log("going to send player's ships");
            await player.sendShips(socket, dirty, player_index);
            await world.sendPlayerAreas(socket, dirty, player_index);
    
            let faction_linker_index = faction.getLinkerIndex(dirty, dirty.players[player_index].id);
            // If the player has a faction, we send that faction info
            if(faction_linker_index !== -1) {
    
                socket.emit('faction_linker_info', { 'faction_linker': dirty.faction_linkers[faction_linker_index] });
                let faction_index = faction.getIndex(dirty, dirty.players[player_index].faction_id);
    
                if(faction_index !== -1) {
                    socket.emit('faction_info', { 'faction': dirty.factions[faction_index] });
                }
            }
    
    
            io.emit('chat', { 'scope': 'global',
                 'message': "The player " + dirty.players[socket.player_index].name + " has entered the galaxy!"});
    
    
            // If the storyteller has a current event, we can send that now
            for(let i = 0; i < dirty.storytellers.length; i++) {
                if(dirty.storytellers[i] && dirty.storytellers[i].current_spawned_event_id) {
                    //console.log("Storyteller has a current_spawned_event_id");
    
                    let spawned_event_index = dirty.spawned_events.findIndex(function(obj) { return obj && obj.id === dirty.storytellers[i].current_spawned_event_id; });
                    if(spawned_event_index !== -1) {
                        let event_index = event.getIndex(dirty, dirty.spawned_events[spawned_event_index].event_id);
                        if(event_index !== -1) {
                            io.emit('spawned_event_info', { 'spawned_event': dirty.spawned_events[spawned_event_index] });
                            io.emit('event_info', { 'event': dirty.events[event_index] });
                        }
                        
                    }
    
                }
            }

            dirty.players[socket.player_index].last_login = helper.getTimestampInSeconds();

            dirty.players[socket.player_index].has_change = true;


        });


    } catch(error) {
        log(chalk.red("Error in loginPlayer:" + error));
        console.error(error);
    }


}

module.exports.loginPlayer = loginPlayer;


/**
 * 
 * @param {Object} data 
 * @param {String} data.scope
 * @param {Object} data.coord
 * @param {number=} data.floor_type_id
 * @param {String=} data.floor_type_class
 * @param {Boolean=} data.show_output
 */
async function canPlaceFloor(data) {
    try {

        let debug_floor_type_id = 0;



        // No matter the coord, if the floor type doesn't allow it, it doesn't allow it

        // If the floor doesn't yet EXIST - I guess we can allow it?
        if(helper.isFalse(data.coord.floor_type_id)) {
            return true;
        }

        let coord_floor_type_index = getFloorTypeIndex(data.coord.floor_type_id);

        if(coord_floor_type_index === -1) {
            if(data.show_output || data.floor_type_id === debug_floor_type_id) {
                log(chalk.yellow("Could not get floor type of coord"));
            }
            return false;
        }


        if(!dirty.floor_types[coord_floor_type_index].can_build_on || dirty.floor_types[coord_floor_type_index].is_protected) {

            if(data.show_output || (data.floor_type_id && data.floor_type_id === debug_floor_type_id )) {
                log(chalk.yellow("Can't build on that floor type or its protected"));
            }
            return false;
        }

        return true;

    } catch(error) {
        log(chalk.red("Error in main.canPlaceFloor: " + error));
        console.error(error);
    }
}

module.exports.canPlaceFloor = canPlaceFloor;



// some of the movement rules are different for monsters vs for players. E.g. players can move onto spaceport files
async function canPlace(scope, coord, placing_type, placing_id, data = false) {

    try {

        let checking_coords = [];


        // MONSTER!!!!!!!!!!!!!!!
        if(placing_type === 'monster') {

            let monster_type_index = dirty.monster_types.findIndex(function(obj) { return obj && obj.id === parseInt(data.monster_type_id); });

            if(monster_type_index === -1) {
                console.log("Could not find monster type");
                return false;
            }

            /************** COLLECT ALL THE COORDS ********************/
            let last_x = coord.tile_x + dirty.monster_types[monster_type_index].movement_tile_width - 1;
            let last_y = coord.tile_y + dirty.monster_types[monster_type_index].movement_tile_height - 1;

            for(let x = coord.tile_x; x <= last_x; x++) {
                for(let y = coord.tile_y; y <= last_y; y++) {


                    let checking_coord_index = -1;
                    if(scope === 'galaxy') {
                        checking_coord_index = await getCoordIndex({ 'tile_x': x, 'tile_y': y });

                        if(checking_coord_index !== -1) {
                            checking_coords.push(dirty.coords[checking_coord_index]);
                        }
                    } else if(scope === 'planet') {
                        checking_coord_index = await getPlanetCoordIndex({ 'planet_id': coord.planet_id,
                            'planet_level': coord.level, 'tile_x': x, 'tile_y': y });

                        if(checking_coord_index !== -1) {
                            checking_coords.push(dirty.planet_coords[checking_coord_index]);
                        }
                    } else if(scope === 'ship') {
                        checking_coord_index = await getShipCoordIndex({ 'ship_id': coord.ship_id,
                            'level': coord.level,
                            'tile_x': x, 'tile_y': y });

                        if(checking_coord_index !== -1) {
                            checking_coords.push(dirty.ship_coords[checking_coord_index]);
                        }
                    }

                    // We weren't able to find all the coords we needed to match up to all the display linkers
                    if(checking_coord_index === -1) {
                        return false;
                    }


                }
            }



            /********************** GO THROUGH EACH OF THE COORDS ***********************/
            for(let checking_coord of checking_coords) {

                if(checking_coord.npc_id || checking_coord.player_id) {
                    //log(chalk.yellow("Blocked by npc or player"));
                    return false;
                }

                if(placing_id === false) {
                    if(checking_coord.monster_id || checking_coord.belongs_to_monster_id) {
                        //log(chalk.yellow("Blocked by monster id: " + coord.monster_id));
                        return false;
                    }
                } else {
                    if(checking_coord.monster_id && checking_coord.monster_id !== placing_id) {
                        return false;
                    } else if(checking_coord.belongs_to_monster_id && checking_coord.belongs_to_monster_id !== placing_id) {
                        return false;
                    }
                }

                if(checking_coord.object_type_id) {
                    let object_type_index = dirty.object_types.findIndex(function(obj) { return obj && obj.id === checking_coord.object_type_id; });

                    if(object_type_index !== -1) {
                        if(!dirty.object_types[object_type_index].can_walk_on) {
                            //log(chalk.yellow("Blocked by object_type_id"));
                            return false;
                        }

                        // If the object type can have rules, we have to make sure we can go through it (like a door)
                        if(dirty.object_types[object_type_index].can_have_rules && checking_coord.object_id) {

                            let passed_rules = false;

                            for(let r = 0; r < dirty.rules.length; r++) {
                                if(dirty.rules[r].object_id === checking_coord.object_id) {
                                    if(dirty.rules[r].rule === "allow_monsters") {
                                        passed_rules = true;
                                    }
                                }
                            }

                            if(!passed_rules) {
                                return false;
                            }

                        }
                    }


                }

                if(checking_coord.floor_type_id === 11) {
                    //log(chalk.yellow("Blocked by spaceport"));
                    return false;
                }

            }

            return true;
        }


        // OBJECT!!!!!!!!!!!!!!!
        if(placing_type === 'object') {
            log(chalk.red("Use game_object.canPlace instead!"));
            return false;
        }


        // PLAYER
        if(placing_type === 'player') {
            log(chalk.red("Use player.canPlace instead"));
            return false;

        }



        if(scope === 'planet') {

            if(placing_type === 'building') {

                // only things like spaceport tiles, hole, stairs will block it (npc will attack monsters, clear objects)
                // TODO maybe factor in player things?

                if(coord.object_type_id === 63 || coord.object_type_id === 62 || coord.floor_type_id === 11 || coord.floor_type_id === 44) {
                    return false;
                } else {
                    return true;
                }

                // We also can't place on
                let floor_type_index = getFloorTypeIndex(coord.floor_type_id);
                if(floor_type_index === -1 || !dirty.floor_types[floor_type_index].can_walk_on || dirty.floor_types[floor_type_index].is_protected || !dirty.floor_types[floor_type_index].can_build_on) {
                    return false;
                }

            } else if(placing_type === 'floor') {

                // just make sure the floor isn't protected
                let floor_type_index = dirty.floor_types.findIndex(function(obj) { return obj && obj.id === coord.floor_type_id; });

                if(dirty.floor_types[floor_type_index].is_protected || !dirty.floor_types[floor_type_index].can_build_on) {
                    return false;
                }

                return true;

            }

        }

    } catch(error) {
        log(chalk.red("Error in canPlace: " + error));
        console.error(error);
    }

}

module.exports.canPlace = canPlace;



// Removing battle linkers and the player from the coord they are on.
// We keep the coord value in the player, so that when the player logs back on, we have a place to put them again.
async function disconnectPlayer(socket) {
    try {
        //console.log("Disconnecting player");

        if(!socket.player_id) {
            //console.log("Socket was never associated with a player");
            return false;
        }

        let player_index = await player.getIndex(dirty, { 'player_id': socket.player_id, 'source': 'main.disconnectPlayer' });

        //console.log("Got player index as: " + player_index);
        if(player_index === -1) {
            log(chalk.yellow("Unable to find that player"));
            return false;
        }

        // remove battle linkers with this player in it
        world.removeBattleLinkers(dirty, { 'player_id': dirty.players[player_index].id });

        //console.log("Removed battle linkers");

        // get the relevant coord with the player and update it to no player

        let player_info = await player.getCoordAndRoom(dirty, player_index);

        //console.log("player id: " + dirty.players[player_index].id + " name: " + dirty.players[player_index].name);
        //console.log("player planet_coord_id: " + dirty.players[player_index].planet_coord_id);
        //console.log("player ship_coord_id: " + dirty.players[player_index].ship_coord_id);
        //console.log("player coord_id: " + dirty.players[player_index].coord_id);

        if(dirty.players[player_index].planet_coord_id) {
            //console.log("Disconnecting player was on a planet. Removing from that planet coord");

            let planet_coord_index = await getPlanetCoordIndex({ 'planet_coord_id': dirty.players[player_index].planet_coord_id });

            dirty.players[player_index].previous_planet_coord_id = dirty.players[player_index].planet_coord_id;
            dirty.players[player_index].planet_coord_id = false;
            dirty.players[player_index].planet_coord_index = -1;
            dirty.players[player_index].previous_ship_coord_id = false;
            dirty.players[player_index].previous_coord_id = false;
            dirty.players[player_index].has_change = true;




            if(planet_coord_index !== -1) {

                await updateCoordGeneric(socket, {'planet_coord_index': planet_coord_index, 'player_id': false });

            }


        }

        if(dirty.players[player_index].ship_coord_id) {

            let ship_coord_index = await getShipCoordIndex({ 'ship_coord_id': dirty.players[player_index].ship_coord_id });

            //console.log("Going to set previous_ship_coord_id");

            // Trying to get placing the player back in the galaxy based on the player, not the ship ( since we can't leave it on the coord )
            if(dirty.players[player_index].coord_id) {
                dirty.players[player_index].previous_coord_id = dirty.players[player_index].coord_id;
            }

            dirty.players[player_index].previous_ship_coord_id = dirty.players[player_index].ship_coord_id;
            dirty.players[player_index].previous_planet_coord_id = false;
            dirty.players[player_index].ship_coord_id = false;
            dirty.players[player_index].ship_coord_index = -1;
            dirty.players[player_index].has_change = true;



            if(ship_coord_index !== -1) {
                await updateCoordGeneric(socket, {'ship_coord_index': ship_coord_index, 'player_id': false });
            }
        }

        if(dirty.players[player_index].coord_id) {

            let coord_index = await getCoordIndex({ 'coord_id': dirty.players[player_index].coord_id });

            //console.log("Going to set previous_coord_id");

            dirty.players[player_index].previous_coord_id = dirty.players[player_index].coord_id;
            dirty.players[player_index].previous_planet_coord_id = false;
            // Not sure if we want this here. We do want the player to return to the galaxy view if they logged off in the galaxy view,
            // But we do lose the coord the player was on
            //dirty.players[player_index].previous_ship_coord_id = false;
            dirty.players[player_index].coord_id = false;
            dirty.players[player_index].coord_index = -1;
            dirty.players[player_index].has_change = true;


            if(coord_index !== -1) {
                await updateCoordGeneric(socket, {'coord_index': coord_index, 'player_id': false });

                // If the player is in a normal ship, we remove the normal ship from that coord as well
                // However we don't remove the object if it's something that is larger (is_dockable)
                let ship_index = await game_object.getIndex(dirty, dirty.players[player_index].ship_id);
                let ship_type_index = getObjectTypeIndex(dirty.objects[ship_index].object_type_id);

                if(!dirty.object_types[ship_type_index].is_dockable) {
                    await updateCoordGeneric(socket, {'coord_index': coord_index, 'object_id': false });

                    // and make sure the ship knows it isn't there anymore
                    await game_object.removeFromCoord(dirty, ship_index);
                    dirty.objects[ship_index].coord_id = false;
                    dirty.objects[ship_index].coord_index = -1
                    dirty.objects[ship_index].has_change = true;
                    await game_object.sendInfo(false, "galaxy", dirty, ship_index);
                    log(chalk.yellow("Removing ship from ALL coords?"));
                    
                }

                //console.log("Should have removed the player from the coord, the ship from the coord, and sent the info to the room");
                //console.log("Coord object id: " + dirty.coords[coord_index].object_id);


            }

            //console.log("Set player's previous_coord_id to: " + dirty.players[player_index].previous_coord_id);

        }

        //console.log("Sending updated player info to the room");

        await player.sendInfo(socket, player_info.room, dirty, dirty.players[player_index].id);
        io.to(player_info.room).emit('logout_info', { 'player_id': dirty.players[player_index].id });


        socket.disconnect();
    } catch(error) {
        log(chalk.red("Error in disconnectPlayer: " + error));
        console.error(error);
    }

}

module.exports.disconnectPlayer = disconnectPlayer;


// Disconnects EVERYONE!
async function disconnectPlayers() {
    try {

        for(let id of Object.keys(io.sockets.sockets)) {
            socket = io.sockets.connected[id];

            await disconnectPlayer(socket);
        }


        // found the player - now make sure they aren't already connected
        /*
        Object.keys(io.sockets.sockets).forEach(function(id) {
            //console.log("ID:" + id);
            socket = io.sockets.connected[id];

            disconnectPlayer(socket);

        });
         */
    } catch(error) {
        log(chalk.red("Error in disconnectPlayers: " + error));
    }
}

module.exports.disconnectPlayers = disconnectPlayers;




//  data:   coord_id   OR   (   tile_x   |   tile_y   )
/**
 *
 * @param {Object} data
 * @param {number=} data.coord_id
 * @param {number=} data.tile_x
 * @param {number=} data.tile_y
 * @returns {Promise<number>}
 */
async function getCoordIndex(data) {
    try {
        let coord_index = -1;

        data.coord_id = parseInt(data.coord_id);

        if(data.coord_id) {
            coord_index = dirty.coords.findIndex(function(obj) {
                return obj && obj.id === parseInt(data.coord_id);
            });
        } else {
            coord_index = dirty.coords.findIndex(function(obj) {
                return obj && obj.tile_x === parseInt(data.tile_x) && obj.tile_y === parseInt(data.tile_y);
            });
        }

        // we need to add it
        if(coord_index === -1) {

            let where_part;
            let inserts;
            if(data.coord_id) {
                where_part = 'WHERE coords.id = ?';
                inserts = [data.coord_id];

            } else {
                where_part = 'WHERE coords.tile_x = ? AND coords.tile_y = ?';
                inserts = [data.tile_x, data.tile_y];
            }

            let sql = "SELECT * FROM coords " + where_part;

            //log(chalk.yellow("Running sql: " + sql));
            let [rows, fields] = await (pool.query(sql, inserts));

            if(rows[0]) {
                let adding_coord = rows[0];

                // quick triple check that it isn't already in there
                let final_check_index = dirty.coords.findIndex(function(obj) { return obj && obj.id === adding_coord.id; });
                if(final_check_index === -1) {
                    adding_coord.has_change = false;
                    coord_index = dirty.coords.push(adding_coord) - 1;

                    //console.log("Added planet coord id: " + dirty.planet_coords[planet_coord_index].id + " to dirty");
                } else {

                    return final_check_index;
                }




                // We'll want the planet in memory, as well as anything that owns the planet
                if(adding_coord.planet_id) {
                    //console.log("Adding coord has a planet id: " + adding_coord.planet_id);
                    let planet_index = await planet.getIndex(dirty, { 'planet_id': adding_coord.planet_id, 'source': 'main.getCoordIndex' });
                    if(planet_index !== -1) {
                        if(dirty.planets[planet_index].player_id) {
                            await player.getIndex(dirty, {'player_id':dirty.planets[planet_index].player_id, 'source': 'main.getCoordIndex' });
                        }
                    } else {
                        console.log("Could not find a planet with that ID");
                    }

                }

            }
        }

        //console.log("Returning coord index: " + coord_index);
        return coord_index;
    } catch(error) {
        log(chalk.red("Error in getCoordIndex: " + error));
    }

}

module.exports.getCoordIndex = getCoordIndex;


//  data:   planet_coord_id   OR   (   planet_id   |   planet_level   |   tile_x   |   tile_y   ) OR spawned_monster_id
//          can_insert

/**
 *
 * @param {Object} data
 * @param {number=} data.planet_coord_id
 * @param {number=} data.planet_id
 * @param {number=} data.planet_level
 * @param {number=} data.tile_x
 * @param {number=} data.tile_y
 * @param {number=} data.spawned_monster_id
 * @param {boolean=} data.can_insert
 * @returns {Promise<number|*>}
 */
async function getPlanetCoordIndex(data) {

    try {

        if(data.level) {
            log(chalk.yellow("getPlanetCoordIndex sees data.level INSTEAD OF data.planet_level!"));
        }

        if(data.debug && data.debug === true) {
            console.log(data);
        }
        let planet_coord_index = -1;

        if(data.planet_coord_id) {
            //console.log("Checking based on id");
            planet_coord_index = dirty.planet_coords.findIndex(function(obj) {
                return obj && obj.id === parseInt(data.planet_coord_id);
            });
        } else if(data.monster_id) { // TODO huh? Monster id?
            planet_coord_index = dirty.planet_coords.findIndex(function(obj) { return obj && obj.spawned_monster_id === parseInt(data.spawned_monster_id); });
        } else if(data.planet_id) {

            if(data.tile_x < 0 || data.tile_y < 0) {
                //console.log("Returning -1 on getPlanetCoordIndex. No coords < 0");
                return -1;
            }

            //console.log("Checking based on planet id: " + data.planet_id + " planet_level: " + data.planet_level + " tile_x: " + data.tile_x + " and tile_y: " + data.tile_y);
            planet_coord_index = dirty.planet_coords.findIndex(function(obj) {
                return obj && obj.planet_id === parseInt(data.planet_id) && obj.level === parseInt(data.planet_level) &&
                    obj.tile_x === parseInt(data.tile_x) && obj.tile_y === parseInt(data.tile_y);
            });
        } else if(data.spawned_monster_id) {
            planet_coord_index = dirty.planet_coords.findIndex(function(obj) { return obj && obj.spawned_monster_id === parseInt(data.spawned_monster_id); });
        }
        else {
            log(chalk.red("Odd data sent into getPlanetCoordIndex data.planet_coord_id: " + data.planet_coord_id +
                " data.planet_id: " + data.planet_id + " data.planet_level: " + data.planet_level + " data.tile_x: " + data.tile_x +
                " data.tile_y: " + data.tile_y));
            console.trace("TRACED!");
            return -1;
        }

        // Never try and get a planet coord that is out of range of the planet
        if(planet_coord_index === -1 && data.planet_id && data.planet_level) {
            let planet_index = await planet.getIndex(dirty, { 'planet_id': data.planet_id });

            // Planet has been regenerated and is using the new x/y above x/y below system
            if(planet_index !== -1 && dirty.planets[planet_index].x_size_above) {

                let underground_x_offset = 0;
                let underground_y_offset = 0;
                if (dirty.planets[planet_index].x_size_above > dirty.planets[planet_index].x_size_under) {
                    underground_x_offset = (dirty.planets[planet_index].x_size_above - dirty.planets[planet_index].y_size_under) / 2;

                }

                if (dirty.planets[planet_index].y_size_above > dirty.planets[planet_index].y_size_under) {
                    underground_y_offset = (dirty.planets[planet_index].y_size_above - dirty.planets[planet_index].y_size_under) / 2;
                }

                if(data.planet_level >= 0) {
                    if(data.tile_x > dirty.planets[planet_index].x_size_above || data.tile_y > dirty.planets[planet_index].y_size_above) {
                        console.log("Returning -1 on getPlanetCoordIndex. No coords > " + dirty.planets[planet_index].x_size_above + "," + dirty.planets[planet_index].y_size_above + "on this planet");
                        return -1;
                    }
                } else {

                    if(data.tile_x < underground_x_offset || data.tile_y < underground_y_offset ||
                        data.tile_x >= dirty.planets[planet_index].x_size_under + underground_x_offset || 
                        data.tile_y >= dirty.planets[planet_index].y_size_under + underground_y_offset) {
                            //console.log("Returning -1 on getPlanetCoordIndex. Underground was out of bounds");
                            return -1;
                        }

                }
            }
        }

        // we need to add it
        if(planet_coord_index === -1) {
            if(data.debug && data.debug === true) {
                console.log("Did not find planet coord. Going to see if it's hanging out in the database");
            }

            let where_part;
            let inserts;
            if(data.planet_coord_id) {
                where_part = 'WHERE id = ?';
                inserts = [data.planet_coord_id];

            } else if(data.monster_id || data.spawned_monster_id) {
                where_part = " WHERE spawned_monster_id = ?";
                inserts = [data.monster_id];
            } else if(data.planet_id) {
                where_part = " WHERE planet_id = ? AND level = ? AND tile_x = ? AND tile_y = ?";
                inserts = [data.planet_id, data.planet_level, data.tile_x, data.tile_y];
            } else {
                log(chalk.yellow("Odd data sent to main.getPlanetCoordIndex: "));
                console.log(data);

                return -1;
            }

            let [rows, fields] = await (pool.query("SELECT * FROM planet_coords " + where_part, inserts));


            if(rows[0]) {
                if(data.debug && data.debug === true) {
                    console.log("Planet coord was found in database");
                }
                let adding_planet_coord = rows[0];

                // lets make sure we weren't retarded and don't already have it
                let final_check_index = dirty.planet_coords.findIndex(function(obj) { return obj && obj.id === adding_planet_coord.id; });
                if(final_check_index === -1) {
                    adding_planet_coord.has_change = false;
                    planet_coord_index = dirty.planet_coords.push(adding_planet_coord) - 1;

                    //console.log("Added planet coord id: " + dirty.planet_coords[planet_coord_index].id + " to dirty");
                } else {
                    //console.log("WE ALREADY HAVE THE FUCKING COORD");

                    return final_check_index;
                }


            } else {

                if(data.debug && data.debug === true) {
                    console.log("Planet coord was not found in the database");
                }

                // If the level is > 0 and there is a coord below - create the coord
                if(data.planet_level > 0 && data.can_insert && data.can_insert === true) {
                    console.log("Dealing with level > 0. Checking for an existing coord below");
                    // see if there's a coord below
                    let lower_level = data.planet_level - 1;
                    let lower_level_data = { 'planet_id': data.planet_id, 'planet_level': lower_level, 'tile_x': data.tile_x, 'tile_y': data.tile_y };
                    let lower_coord_index = await getPlanetCoordIndex(lower_level_data);
                    if(lower_coord_index !== -1) {
                        console.log("There is a coord below. Going to insert a new planet coord here!");

                        // sweet - there's a coord under so we can create this coord above
                        let [result] = await (pool.query("INSERT INTO planet_coords(planet_id, tile_x, tile_y, level) VALUES(?,?,?,?)",
                            [data.planet_id, data.tile_x, data.tile_y, data.planet_level]));

                        let new_id = result.insertId;
                        console.log("Got new id as: " + new_id);
                        let new_coord_data = {'planet_coord_id': new_id};
                        planet_coord_index = await getPlanetCoordIndex(new_coord_data);

                        return planet_coord_index;
                    }

                }


            }
        }

        return planet_coord_index;
    } catch(error) {
        log(chalk.red("Error in getPlanetCoordIndex: " + error));
        console.error(error);
    }



}

module.exports.getPlanetCoordIndex = getPlanetCoordIndex;





// We should have ALL the battle_linkers memory
function getBattleLinkerIndex(battle_linker_id) {
    try {
        return dirty.battle_linkers.findIndex(function(obj) { return obj && obj.id === battle_linker_id; });
    } catch(error) {
        log(chalk.red("Error in getBattleLinkerIndex: " + error));
    }

}

module.exports.getBattleLinkerIndex = getBattleLinkerIndex;


function getFloorTypeIndex(floor_type_id) {
    return dirty.floor_types.findIndex(function(obj) { return obj && obj.id === parseInt(floor_type_id); });
}

module.exports.getFloorTypeIndex = getFloorTypeIndex;


async function getObjectInventory(object_id) {

    try {
        let [rows, fields] = await (pool.query("SELECT * FROM inventory_items WHERE inventory_items.owned_by_object_id = ?",
            [object_id]));

        if(rows[0]) {
            for(let i = 0; i < rows.length; i++) {
                let inventory_item = rows[i];

                // see if we already have the equipment linker, if not, add it
                let ii_index = dirty.inventory_items.findIndex(function(obj) { return obj && obj.id === inventory_item.id });
                if(ii_index === -1) {
                    //console.log("Adding object inventory item id: " + inventory_item.id);
                    inventory_item.has_change = false;
                    let new_inventory_item_index = dirty.inventory_items.push(inventory_item) - 1;
                    world.processInventoryItem(dirty, new_inventory_item_index);

                    //console.log("Added that object id: " + inventory_item.owned_by_object_id + " has inventory object type id: " + inventory_item.object_type_id);
                }

            }
        }
    } catch(error) {
        log(chalk.red("Error in getObjectInventory"));
    }

}

module.exports.getObjectInventory = getObjectInventory;



function getObjectTileHeight(display_linkers) {
    try {
        let movement_tile_height = 1;

        if(display_linkers.length === 0) {
            return movement_tile_height;
        }

        for(let linker of display_linkers) {
            let linker_movement_height = linker.position_y + 1;
            if(linker_movement_height > movement_tile_height) {
                movement_tile_height = linker_movement_height;
            }

        }

        return movement_tile_height;

    } catch(error) {
        log(chalk.red("Error in main.getObjectTileHeight: " + error));
    }
}

module.exports.getObjectTileHeight = getObjectTileHeight;

function getObjectTileWidth(display_linkers) {
    try {
        let movement_tile_width = 1;

        if(display_linkers.length === 0) {
            return movement_tile_width;
        }

        for(let linker of display_linkers) {
            let linker_movement_width = linker.position_x + 1;
            if(linker_movement_width > movement_tile_width) {
                movement_tile_width = linker_movement_width;
            }

        }

        return movement_tile_width;

    } catch(error) {
        log(chalk.red("Error in main.getObjectTileWidth: " + error));
    }
}

module.exports.getObjectTileWidth = getObjectTileWidth;



//  data:
function getObjectTypeEquipmentLinkerIndex(data) {


    try {
        data.object_type_id = parseInt(data.object_type_id);

        return dirty.object_type_equipment_linkers.findIndex(function(obj) { return obj && obj.object_type_id === data.object_type_id &&
            obj.equip_slot === data.equip_slot; });
    } catch(error) {
        log(chalk.red("Error in getObjectTypeEquipmentLinkerIndex: " + error));
        console.error(error);
    }

}

module.exports.getObjectTypeEquipmentLinkerIndex = getObjectTypeEquipmentLinkerIndex;


function getObjectTypeIndex(object_type_id) {

    try {
        return dirty.object_types.findIndex(function(obj) { return obj && obj.id === parseInt(object_type_id); });
    } catch(error) {
        log(chalk.red("Error in getObjectTypeIndex: " + error));
    }




}

module.exports.getObjectTypeIndex = getObjectTypeIndex;


function getRaceIndex(race_id) {
    try {

        race_id = parseInt(race_id);
        return dirty.races.findIndex(function(obj) { return obj && obj.id === race_id; });

    } catch(error) {
        log(chalk.red("Error in main.getRaceIndex: " + error));
    }
}

module.exports.getRaceIndex = getRaceIndex;


async function getRuleIndex(rule_id) {

    try {
        rule_id = parseInt(rule_id);
        let rule_index = dirty.rules.findIndex(function(obj) { return obj && obj.id === rule_id; });

        if(rule_index === -1) {
            let [rows, fields] = await (pool.query("SELECT * FROM rules WHERE id = ?", [rule_id]));

            if(rows[0]) {

                rule_index = dirty.rules.push(rows[0]) - 1;

                dirty.rules[rule_index].id = parseInt(dirty.rules[rule_index].id);
                dirty.rules[rule_index].object_id = parseInt(dirty.rules[rule_index].object_id);
            }
        }

        return rule_index;
    } catch(error) {
        log(chalk.red("Error in getRuleIndex: " + error));
    }


}

module.exports.getRuleIndex = getRuleIndex;

function getRaceEatingLinkerIndex(data) {
    try {
        return dirty.race_eating_linkers.findIndex(function(obj) { return obj && obj.race_id === data.race_id &&
            obj.object_type_id === data.object_type_id; });
    } catch(error) {
        log(chalk.red("Error in getRaceEatingLinkerIndex: " + error));
    }

}

module.exports.getRaceEatingLinkerIndex = getRaceEatingLinkerIndex;

async function getRules(object_id) {
    try {
        //console.log("In getRules for object_id: " + object_id);
        let object_index = await game_object.getIndex(dirty, object_id);

        if(object_index === -1) {
            return false;
        }

        let [rows, fields] = await (pool.query("SELECT * FROM rules WHERE object_id = ?", [object_id]));

        if(rows[0]) {
            //console.log("Found at least one rule");
            for(let i = 0; i < rows.length; i++) {
                let rule = rows[i];

                // just make sure we don't already have it
                let rule_index = dirty.rules.findIndex(function(obj) { return obj && obj.id === parseInt(rule.id); });

                // Don't already have it in memory, add it
                if(rule_index === -1) {
                    rule_index = dirty.rules.push(rule) - 1;

                    dirty.rules[rule_index].id = parseInt(dirty.rules[rule_index].id);
                    dirty.rules[rule_index].object_id = parseInt(dirty.rules[rule_index].object_id);

                }
            }
        }
    } catch(error) {
        log(chalk.red("Error in main.getRules: " + error));
        console.error(error);
    }

}

module.exports.getRules = getRules;

async function getShipCoords(ship_index) {

    try {

        //console.log("In getShipCoords");
        let [rows, fields] = await (pool.query("SELECT * FROM ship_coords WHERE ship_id = ?",
            [dirty.objects[ship_index].id]));

        if(rows[0]) {

            let airlock_index = -1;

            for(let i = 0; i < rows.length; i++) {

                let ship_coord = rows[i];
                //console.log("Adding ship coord id: " + ship_coord.id + " ship_id: " + ship_coord.ship_id + " object_type_id: " + ship_coord.object_type_id);

                // see if we already have the ship coord
                let ship_coord_index = dirty.ship_coords.findIndex(function(obj) { return obj && obj.id === ship_coord.id; });
                if(ship_coord_index === -1) {
                    ship_coord.has_change = false;
                    ship_coord_index = dirty.ship_coords.push(ship_coord) - 1;
                }

                if(dirty.ship_coords[ship_coord_index].object_type_id === 266) {
                    airlock_index = ship_coord_index;
                }
            }

            dirty.objects[ship_index].airlock_index = airlock_index;
            //log(chalk.magenta("Set airlock index for ship to: " + dirty.objects[ship_index].airlock_index));
        } else {
            log(chalk.yellow("No ship coords for this ship"));
        }
    } catch(error) {
        log(chalk.red("Error in getShipCoords: " + error));
        console.error(error);
    }

}

module.exports.getShipCoords = getShipCoords;


//  data:   structure_id
function getStructureIndex(data) {
    try {

        return dirty.structures.findIndex(function(obj) { return obj && obj.id === data.structure_id; });

    } catch(error) {
        log(chalk.red("Error in getStructureIndex: " + error));

    }

}

module.exports.getStructureIndex = getStructureIndex;


// CREDIT:
// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array?page=1&tab=votes#tab-top
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

module.exports.shuffle = shuffle;


//  data:   coord_index   |   planet_coord_index   |   ship_coord_index   |   object_type_id   |   amount
// typeof checks since indexes can be 0
/**
 *
 * @param {Object} socket
 * @param {Object} data
 * @param {number=} data.coord_index
 * @param {number=} data.planet_coord_index
 * @param {number=} data.ship_coord_index
 * @param {number=} data.object_id
 * @param {number=} data.object_type_id
 * @param {number=} data.amount
 * @param {number=} data.spawned_event_id
 * @returns {Promise<boolean>}
 */
async function updateCoordGeneric(socket, data) {

    try {
        let coord;
        let room;
        let info_emitted;
        let coord_type;
        let sending_data = {};

        if(typeof data.coord_index !== 'undefined') {
            //console.log("Got coord index in updateCoordGeneric");
            coord = dirty.coords[data.coord_index];
            room = "galaxy";
            info_emitted = "coord_info";
            coord_type = "coord";
            sending_data = { 'coord': coord };
        } else if(typeof data.planet_coord_index !== 'undefined') {
            coord = dirty.planet_coords[data.planet_coord_index];
            room = "planet_" + coord.planet_id;
            info_emitted = "planet_coord_info";
            coord_type = "planet_coord";
            sending_data = { 'planet_coord': coord };
        } else if(typeof data.ship_coord_index !== 'undefined') {
            coord = dirty.ship_coords[data.ship_coord_index];
            room = "ship_" + coord.ship_id;
            info_emitted = "ship_coord_info";
            coord_type = "ship_coord";
            sending_data = { 'ship_coord': coord };
        }

        if(coord === false || typeof coord === 'undefined') {
            log(chalk.yellow("Returning false in updateCoordGeneric. Data sent in"));
            log(data);
            return false;
        }



        if(typeof data.belongs_to_monster_id !== 'undefined') {

            //console.log("Have data.monster_id: " + data.monster_id);
            if(data.belongs_to_monster_id === false) {
                //console.log("Setting planet coord id: " + dirty.planet_coords[data.planet_coord_index].id + " to monster_id: false");
                coord.belongs_to_monster_id = false;
                coord.monster_id = false;
                coord.monster_type_id = false;
                coord.has_change = true;
            } else {
                //console.log("Setting planet coord id: " + dirty.planet_coords[planet_coord_index].id + " to monster_id: " + data.monster_id);
                coord.belongs_to_monster_id = parseInt(data.belongs_to_monster_id);
                coord.has_change = true;
            }
        }

        if(typeof data.belongs_to_object_id !== 'undefined') {
            //console.log("Have data.monster_id: " + data.monster_id);
            if(data.belongs_to_object_id === false) {
                //console.log("Setting planet coord id: " + dirty.planet_coords[data.planet_coord_index].id + " to monster_id: false");
                coord.belongs_to_object_id = false;
                coord.object_type_id = false;
                coord.has_change = true;
            } else {

                let object_index = -1;
                if(typeof data.object_index !== 'undefined') {
                    object_index = data.object_index;
                } else {
                    object_index = await game_object.getIndex(dirty, data.belongs_to_object_id);
                }

                //console.log("Setting planet coord id: " + dirty.planet_coords[planet_coord_index].id + " to monster_id: " + data.monster_id);
                coord.belongs_to_object_id = parseInt(data.belongs_to_object_id);
                coord.object_type_id = parseInt(dirty.objects[object_index].object_type_id);
                coord.has_change = true;
            }
        }

        if(typeof data.belongs_to_planet_id !== 'undefined') {
            if(data.belongs_to_planet_id === false) {
                coord.belongs_to_planet_id = false;
                coord.has_change = true;
            } else {
                coord.belongs_to_planet_id = parseInt(data.belongs_to_planet_id);
                coord.has_change = true;
            }
        }

        if(typeof data.floor_type_id !== 'undefined') {
            coord.floor_type_id = parseInt(data.floor_type_id);
            coord.has_change = true;
        }

        if(typeof data.monster_id !== 'undefined') {

            //console.log("Have data.monster_id: " + data.monster_id);
            if(data.monster_id === false) {
                //console.log("Setting planet coord id: " + dirty.planet_coords[data.planet_coord_index].id + " to monster_id: false");
                coord.belongs_to_monster_id = false;
                coord.monster_id = false;
                coord.monster_type_id = false;
                coord.has_change = true;
            } else {
                //console.log("Setting planet coord id: " + dirty.planet_coords[planet_coord_index].id + " to monster_id: " + data.monster_id);
                coord.monster_id = parseInt(data.monster_id);
                coord.has_change = true;
            }
        }

        if(typeof data.npc_id !== 'undefined') {
            //console.log("Have data.npc_id: " + data.npc_id);
            if(data.npc_id === false) {
                coord.npc_id = false;
                coord.has_change = true;
            } else {
                coord.npc_id = parseInt(data.npc_id);
                coord.has_change = true;
            }
        }

        if(typeof data.object_id !== 'undefined' || typeof data.object_index !== 'undefined') {

            // Was sent in an object id, and it's value is false
            if(typeof data.object_id !== 'undefined' && data.object_id === false) {
                coord.object_id = false;
                coord.object_amount = 0;
                coord.object_type_id = false;
                coord.has_change = true;
            } else {

                let object_index = -1;
                if(typeof data.object_index !== 'undefined') {
                    object_index = data.object_index;
                } else {
                    object_index = await game_object.getIndex(dirty, data.object_id);
                }


                // the object will also need to be associated with the coord

                if(object_index !== -1) {

                    coord.object_id = parseInt(dirty.objects[object_index].id);
                    coord.object_amount = 1;
                    coord.object_type_id = dirty.objects[object_index].object_type_id;
                    coord.has_change = true;

                    if(coord_type === "coord") {
                        dirty.objects[object_index].coord_id = coord.id;
                        if(typeof data.coord_index === 'undefined') {
                            log(chalk.yellow("In updateCoordGeneric. Should really pass a coord_index in here!"));
                            console.trace("here");
                        } else {
                            dirty.objects[object_index].coord_index = data.coord_index;
                        }
                        dirty.objects[object_index].has_change = true;
                    } else if(coord_type === "planet_coord") {
                        dirty.objects[object_index].planet_coord_id = coord.id;
                        if(typeof data.planet_coord_index === 'undefined') {
                            log(chalk.yellow("In updateCoordGeneric. Should really pass a planet_coord_index in here!"));
                            console.trace("here");
                        } else {
                            dirty.objects[object_index].planet_coord_index = data.planet_coord_index;
                        }
                        
                        dirty.objects[object_index].has_change = true;
                    } else if(coord_type === "ship_coord") {
                        dirty.objects[object_index].ship_coord_id = coord.id;
                        if(typeof data.ship_coord_index === 'undefined') {
                            log(chalk.yellow("In updateCoordGeneric. Should really pass a ship_coord_index in here!"));
                            console.trace("here");
                        } else {
                            dirty.objects[object_index].ship_coord_index = data.ship_coord_index;
                        }
                        dirty.objects[object_index].has_change = true;
                    }

                    await game_object.sendInfo(socket, room, dirty, object_index );
                }
            }
        }
        else if(typeof data.object_type_id !== 'undefined') {
            if(data.object_type_id === false) {
                coord.object_type_id = false;
                coord.object_amount = false;
                coord.has_change = true;
            } else {
                coord.object_type_id = parseInt(data.object_type_id);
                if(data.amount) {
                    coord.object_amount = parseInt(data.amount);
                } else {
                    coord.object_amount = 1;
                }
                coord.has_change = true;
            }
        }
        // We are just updating the amount
        else if(typeof data.amount !== 'undefined') {
            coord.object_amount = parseInt(data.amount);
            coord.has_change = true;
        }

        if(typeof data.planet_id !== 'undefined') {
            if(data.planet_id === false) {
                coord.planet_id = false;
                coord.has_change = true;
            } else {
                coord.planet_id = parseInt(data.planet_id);
                coord.has_change = true;
            }
        }

        if(typeof data.player_id !== 'undefined') {
            if(data.player_id === false) {
                coord.player_id = false;
                coord.has_change = true;
            } else {
                //log(chalk.yellow("Set player id for planet coord id: " + dirty.planet_coords[planet_coord_index].id + " to player_id: " + data.player_id));
                coord.player_id = parseInt(data.player_id);
                coord.has_change = true;

            }
        }

        if(typeof data.spawned_monster_id !== 'undefined') {
            if(data.spawned_monster_id === false) {
                coord.spawned_monster_id = false;
                coord.has_change = true;
            } else {
                coord.spawned_monster_id = parseInt(data.spawned_monster_id);
                coord.has_change = true;
            }
        }

        if(typeof data.spawned_event_id !== 'undefined') {

            //console.log("Have data.monster_id: " + data.monster_id);
            if(data.spawned_event_id === false) {
                //console.log("Setting planet coord id: " + dirty.planet_coords[data.planet_coord_index].id + " to monster_id: false");
                coord.spawned_event_id = false;
                coord.has_change = true;
            } else {
                //console.log("Setting planet coord id: " + dirty.planet_coords[planet_coord_index].id + " to monster_id: " + data.monster_id);
                coord.spawned_event_id = parseInt(data.spawned_event_id);
                coord.has_change = true;
            }
        }

        if(typeof data.watched_by_object_id !== 'undefined') {
            if(data.watched_by_object_id === false) {
                coord.watched_by_object_id = false;
                coord.has_change = true;
            } else {
                coord.watched_by_object_id = parseInt(data.watched_by_object_id);
                coord.has_change = true;
            }
        }


        //console.log("Sending to room: " + room + " info_emitted: " + info_emitted + " coord type: " + coord_type + " id: " + coord.id + " player id: "
        //    + coord.player_id + " object_id: " + coord.object_id + " monster_id: " + coord.monster_id);

        io.to(room).emit(info_emitted, sending_data);
    } catch(error) {
        log(chalk.red("Error in updateCoordGeneric: " + error));
        console.error(error);
    }


}

module.exports.updateCoordGeneric = updateCoordGeneric;


async function writeDirty(show_output = false) {


    dirty.admin_logs.forEach(function(admin_log, i) {
        let sql = "INSERT INTO admin_logs(type,text, created_at) VALUES(?,?,?)";
        let inserts = [admin_log.type, admin_log.text, new Date().toISOString().slice(0, 19).replace('T', ' ')];
        pool.query(sql, inserts, function(err, result) {
            if(err) throw err;
        });

        delete dirty.admin_logs[i];

    });


    dirty.areas.forEach(function(area, i) {
        if(area.has_change) {
            let sql = "UPDATE areas SET description = ?, is_accepted = ?, name = ?, price = ?, renting_player_id = ?, auto_market = ? WHERE id = ?";
            let inserts = [area.description, area.is_accepted, area.name, area.price, area.renting_player_id, area.auto_market, area.id];
            pool.query(sql, inserts, function(err, result) {
                if(err) throw err;
            });


            dirty.areas[i].has_change = false;
        }
    });

    //console.log("Writing dirty data");
    dirty.coords.forEach(function(coord, i) {
        if(coord.has_change) {
            //onsole.log("Coord has a change (floor_type_id, player_id, id) (" + coord.floor_type_id + ", " +  coord.player_id + "," + coord.id + ")");
            let sql = "UPDATE coords SET belongs_to_object_id = ?, belongs_to_planet_id = ?, floor_type_id = ?, " +
                "npc_id = ?, object_amount = ?, object_id = ?, object_type_id = ?, planet_id = ?, player_id = ?, spawned_event_id = ?, watched_by_object_id = ? WHERE id = ?";
            let inserts = [coord.belongs_to_object_id, coord.belongs_to_planet_id, coord.floor_type_id, coord.npc_id,
                coord.object_amount, coord.object_id, coord.object_type_id, coord.planet_id, coord.player_id, coord.spawned_event_id, coord.watched_by_object_id, coord.id];
            pool.query(sql, inserts, function(err, result) {
                if(err) throw err;
            });


            dirty.coords[i].has_change = false;
        }
    });


    dirty.equipment_linkers.forEach(function(equipment_linker, i) {
        if(equipment_linker.has_change) {
            let sql = "UPDATE equipment_linkers SET amount = ? WHERE id = ?";
            let inserts = [equipment_linker.amount, equipment_linker.id];
            pool.query(sql, inserts, function(err, result) {
                if(err) throw err;
            });

            dirty.equipment_linkers[i].has_change = false;
        }
    });


    dirty.factions.forEach(function(faction, i) {

        if(faction.has_change) {
            let sql = "UPDATE factions SET player_count = ? WHERE id = ?";
            let inserts = [faction.player_count, faction.id];
            pool.query(sql, inserts, function(err, result) {
                if(err) throw err;
            });

            dirty.factions[i].has_change = false;
        }
    });


    // This is following the new way
    for(let i = 0; i < dirty.inventory_items.length; i++) {
        if(dirty.inventory_items[i] && dirty.inventory_items[i].has_change) {
            //console.log("Inventory item id: " + dirty.inventory_items[i].id + " new amount: " + dirty.inventory_items[i].amount);
            let sql = "UPDATE inventory_items SET amount = ?, body_id = ?, price = ? WHERE id = ?";
            let inserts = [dirty.inventory_items[i].amount, dirty.inventory_items[i].body_id, dirty.inventory_items[i].price, dirty.inventory_items[i].id];
            pool.query(sql, inserts, function(err, result) {
                if(err) throw err;
            });

            dirty.inventory_items[i].has_change = false;
        }
    }

    for(let i = 0; i < dirty.market_linkers.length; i++) {
        if(dirty.market_linkers[i] && dirty.market_linkers[i].has_change) {

            let sql = "UPDATE market_linkers SET ending_at = ? WHERE id = ?";
            let inserts = [dirty.market_linkers[i].ending_at, dirty.market_linkers[i].id];
            pool.query(sql, inserts, function(err, result) {
                if(err) throw err;
            });

            dirty.market_linkers[i].has_change = false;

        }
    }

    /*
    // Old way
    dirty.inventory_items.forEach(function(inventory_item, i) {
        if(inventory_item.has_change) {
            //console.log("Inventory item id: " + inventory_item.id + " new amount: " + inventory_item.amount);
            let sql = "UPDATE inventory_items SET amount = ? WHERE id = ?";
            let inserts = [inventory_item.amount, inventory_item.id];
            pool.query(sql, inserts, function(err, result) {
                if(err) throw err;
            });

            dirty.inventory_items[i].has_change = false;

        }
    });
    */

    dirty.monsters.forEach(function(writing_monster, i) {
        try {
            if(monster && writing_monster.has_change) {
                //console.log("Updating monster id: " + writing_monster.id);
                //console.log(monster);
                let sql = "UPDATE monsters SET current_hp = ?, current_spawn_linker_id = ?, has_spawned_object = ?, planet_coord_id = ?, ship_coord_id = ?, spawner_tick_count = ? WHERE id = ?";
                let inserts = [writing_monster.current_hp, writing_monster.current_spawn_linker_id, writing_monster.has_spawned_object, writing_monster.planet_coord_id, writing_monster.ship_coord_id, writing_monster.spawner_tick_count, writing_monster.id];
                pool.query(sql, inserts, function(err, result) {
                    if(err) throw err;
                });

                //console.log("Updated the monster");
                dirty.monsters[i].has_change = false;

            }
        } catch(error) {
            log(chalk.red("Error writing dirty monsters: " + error));
            console.error(error);
        }

    });

    dirty.npcs.forEach(function(writing_npc, i) {
        if(writing_npc.has_change) {
            let sql = "UPDATE npcs SET attacking_skill_points = ?, coord_id = ?, current_hp = ?, current_structure_type_id = ?, " +
                "current_structure_type_is_built = ?, " +
                "defending_skill_points = ?, dream_job_id = ?, dream_structure_type_id = ?, enslaved_to_player_id = ?, enslaved_to_npc_id = ?, farming_skill_points = ?, " +
                "has_inventory = ?, planet_coord_id = ?, planet_id = ?, ship_coord_id = ?, ship_id = ?, surgery_skill_points = ?, wants_object_type_id = ? WHERE id = ?";
            let inserts = [writing_npc.attacking_skill_points, writing_npc.coord_id, writing_npc.current_hp, writing_npc.current_structure_type_id, writing_npc.current_structure_type_is_built,
                writing_npc.defending_skill_points, writing_npc.dream_job_id, writing_npc.dream_structure_type_id, writing_npc.enslaved_to_player_id, writing_npc.enslaved_to_npc_id, writing_npc.farming_skill_points, writing_npc.has_inventory,
                writing_npc.planet_coord_id, writing_npc.planet_id,
                writing_npc.ship_coord_id, writing_npc.ship_id, writing_npc.surgery_skill_points, writing_npc.wants_object_type_id, writing_npc.id];
            pool.query(sql, inserts, function(err, result) {
                if(err) throw err;
            });

            writing_npc.has_change = false;
        }
    });

    dirty.objects.forEach(function(object, i) {
        if(object.has_change) {
            //console.log("Object has a change (energy, id) (" + object.energy + "," + object.id + ")");
            let sql = "UPDATE objects SET ai_id = ?, attached_to_id = ?, coord_id = ?, current_hp = ?, current_spawn_linker_id = ?, docked_at_object_id = ?, docked_at_planet_id = ?, energy = ?, " +
                "has_inventory = ?, has_spawned_object = ?, name = ?, " +
                "npc_id = ?, planet_coord_id = ?, planet_id = ?, player_id = ?, ship_id = ?, ship_coord_id = ?, " +
                "spawned_object_type_amount = ?, spawner_tick_count = ?, spawns_object = ?, tint = ? WHERE id = ?";
            let inserts = [object.ai_id, object.attached_to_id, object.coord_id, object.current_hp, object.current_spawn_linker_id, object.docked_at_object_id, object.docked_at_planet_id,
                object.energy, object.has_inventory, object.has_spawned_object,
                object.name, object.npc_id, object.planet_coord_id, object.planet_id, object.player_id, object.ship_id, object.ship_coord_id,
                object.spawned_object_type_amount, object.spawner_tick_count, object.spawns_object, object.tint, object.id];
            pool.query(sql, inserts, function(err, result) {
                if(err) throw err;
            });


            dirty.objects[i].has_change = false;
        }
    });


    dirty.planets.forEach(function(writing_planet, i) {
        if(writing_planet.has_change) {
            let sql = "UPDATE planets SET ai_id = ?, coord_id = ?, current_hp = ?, lowest_depth = ?, max_hp = ?, name = ?, " +
                "planet_type_id = ?, player_id = ?, type = ?, x_size_above = ?, y_size_above = ?, x_size_under = ?, y_size_under = ? WHERE id = ?";
            let inserts = [writing_planet.ai_id, writing_planet.coord_id, writing_planet.current_hp, writing_planet.lowest_depth, writing_planet.max_hp, writing_planet.name,
                writing_planet.planet_type_id, writing_planet.player_id, writing_planet.type, writing_planet.x_size_above, writing_planet.y_size_above, writing_planet.x_size_under, writing_planet.y_size_under, writing_planet.id];

            pool.query(sql, inserts, function(err, result) {
                if(err) throw err;
            });

            dirty.planets[i].has_change = false;
        }
    });


    dirty.planet_coords.forEach(function(planet_coord, i) {
        if(planet_coord.has_change) {
            //console.log("Planet coord id: " + planet_coord.id + " has a change. object type id: " + planet_coord.object_type_id);
            let sql = "UPDATE planet_coords SET area_id = ?, belongs_to_monster_id = ?, belongs_to_object_id = ?, floor_type_id = ?, npc_id = ?, player_id = ?, monster_id = ?, object_amount = ?, object_id = ?, " +
                "object_type_id = ?, spawned_event_id = ?, spawned_monster_id = ?, spawns_monster_type_id = ?, structure_id = ? WHERE id = ?";
            let inserts = [planet_coord.area_id, planet_coord.belongs_to_monster_id, planet_coord.belongs_to_object_id, planet_coord.floor_type_id, planet_coord.npc_id, planet_coord.player_id, planet_coord.monster_id, planet_coord.object_amount, planet_coord.object_id,
                planet_coord.object_type_id, planet_coord.spawned_event_id, planet_coord.spawned_monster_id, planet_coord.spawns_monster_type_id, planet_coord.structure_id, planet_coord.id];

            pool.query(sql, inserts, function(err, result) {
                if(err) throw err;
            });

            dirty.planet_coords[i].has_change = false;

        }
    });

    for(let i = 0; i < dirty.players.length; i++) {
        if(dirty.players[i] && dirty.players[i].has_change) {
            await writePlayerDirty(dirty.players[i], i);
        }
    }

    /*
    I legit think this was not working.
    dirty.players.forEach(function(writing_player, i) {
        if(player.has_change) {
            writePlayerDirty(writing_player, i);
        }
    });
    */

    dirty.player_relationship_linkers.forEach(function(linker, i) {
        if(linker.has_change) {
            let sql = "UPDATE player_relationship_linkers SET score = ? WHERE id = ?";
            let inserts = [linker.score, linker.id];

            pool.query(sql, inserts, function(err, result) {
                if(err) throw err;
            });

            dirty.player_relationship_linkers[i].has_change = false;
        }
    });
    

    dirty.player_research_linkers.forEach(function(linker, i) {
        if(linker.has_change) {
            let sql = "UPDATE player_research_linkers SET researches_completed = ? WHERE id = ?";
            let inserts = [linker.researches_completed, linker.id];

            pool.query(sql, inserts, function(err, result) {
                if(err) throw err;
            });

            dirty.player_research_linkers[i].has_change = false;

        }
    });



    dirty.ship_coords.forEach(function(ship_coord, i) {
        if(ship_coord.has_change) {
            //console.log("Ship coord has a change");
            let sql = "UPDATE ship_coords SET area_id = ?, belongs_to_monster_id = ?, belongs_to_object_id = ?, floor_type_id = ?, " +
                "is_damaged = ?, monster_id = ?, object_amount = ?, object_id = ?, object_type_id = ?, player_id = ?, structure_id = ?, spawned_event_id = ?, spawned_monster_id = ? WHERE id = ?";
            let inserts = [ship_coord.area_id, ship_coord.belongs_to_monster_id, ship_coord.belongs_to_objct_id, ship_coord.floor_type_id,
                ship_coord.is_damaged, ship_coord.monster_id, ship_coord.object_amount, ship_coord.object_id, ship_coord.object_type_id, ship_coord.player_id, ship_coord.structure_id, ship_coord.spawned_event_id, ship_coord.spawned_monster_id,
                ship_coord.id];

            pool.query(sql, inserts, function(err, result) {
                if(err) throw err;
            });

            dirty.ship_coords[i].has_change = false;

        }
    });

    dirty.spawned_events.forEach(function(spawned_event, i) {

        if(spawned_event.has_change) {
            //console.log("Updating spawned event id: " + spawned_event.id + " is_despawned: " + spawned_event.is_despawned);
            let sql = "UPDATE spawned_events SET is_despawned = ?, origin_coord_id = ?, origin_planet_coord_id = ?, origin_ship_coord_id = ?, tick_count = ? WHERE id = ?";
            let inserts = [spawned_event.is_despawned, spawned_event.origin_coord_id, spawned_event.origin_planet_coord_id, spawned_event.origin_coord_id, spawned_event.tick_count, spawned_event.id];

            pool.query(sql, inserts, function(err, result) {
                if(err) throw err;
            });

            dirty.spawned_events[i].has_change = false;
        }

    });

    for(let i = 0; i < dirty.storytellers.length; i++) {
        if(dirty.storytellers[i] && dirty.storytellers[i].has_change) {

            let sql = "UPDATE storytellers SET current_event_ticks = ?, current_spawned_event_id = ?, previous_difficulty = ?, previous_event_ticks = ? WHERE id = ?";
            let inserts = [dirty.storytellers[i].current_event_ticks, dirty.storytellers[i].current_spawned_event_id,
                dirty.storytellers[i].previous_difficulty, dirty.storytellers[i].previous_event_ticks, dirty.storytellers[i].id];
            pool.query(sql, inserts, function(err, result) {
                if(err) throw err;
            });

            dirty.storytellers[i].has_change = false;

        }
    }

}

async function writePlayerDirty(writing_player, i, show_output = false) {
    try {
        if(show_output) {
            console.log("Player " + dirty.players[i].id + " has a change!!!");
        }

        let sql = "UPDATE players SET body_id = ?, coord_id = ?, control_skill_points = ?, cooking_skill_points = ?, " +
            "corrosive_skill_points = ?, current_hp = ?, defense = ?, defending_skill_points = ?, electric_skill_points = ?, energy = ?, exp = ?, " +
            "explosion_skill_points = ?, faction_id = ?, farming_skill_points = ?,  freezing_skill_points = ?, hacking_skill_points = ?, " +
            "heat_skill_points = ?, gravity_skill_points = ?, laser_skill_points = ?, last_login = ?, level = ?, max_hp = ?, " +
            "manufacturing_skill_points = ?, melee_skill_points = ?, mining_skill_points = ?, " +
            "piercing_skill_points = ?, planet_coord_id = ?, planet_id = ?, " +
            "planet_level = ?, plasma_skill_points = ?, poison_skill_points = ?, previous_coord_id = ?, previous_planet_coord_id = ?, " +
            "previous_ship_coord_id = ?, radiation_skill_points = ?, repairing_skill_points = ?, " +
            "researching_skill_points = ?, salvaging_skill_points = ?, ship_coord_id = ?, ship_id = ?, " +
            "skin_object_type_id = ?, surgery_skill_points = ? WHERE id = ?";
        let inserts = [writing_player.body_id, writing_player.coord_id, writing_player.control_skill_points, writing_player.cooking_skill_points,
            writing_player.corrosive_skill_points, writing_player.current_hp, writing_player.defense, writing_player.defending_skill_points, writing_player.electric_skill_points, writing_player.energy, writing_player.exp,
            writing_player.explosion_skill_points, writing_player.faction_id, writing_player.farming_skill_points, writing_player.freezing_skill_points, writing_player.hacking_skill_points,
            writing_player.heat_skill_points, writing_player.gravity_skill_points, writing_player.laser_skill_points, writing_player.last_login, writing_player.level, writing_player.max_hp,
            writing_player.manufacturing_skill_points, writing_player.melee_skill_points, writing_player.mining_skill_points,
            writing_player.piercing_skill_points, writing_player.planet_coord_id, writing_player.planet_id,
            writing_player.planet_level, writing_player.plasma_skill_points, writing_player.poison_skill_points, writing_player.previous_coord_id, writing_player.previous_planet_coord_id,
            writing_player.previous_ship_coord_id, writing_player.radiation_skill_points, writing_player.repairing_skill_points,
            writing_player.researching_skill_points, writing_player.salvaging_skill_points, writing_player.ship_coord_id, writing_player.ship_id,
            writing_player.skin_object_type_id, writing_player.surgery_skill_points, writing_player.id];


        /*
        console.log("sql:");
        console.log(sql);
        console.log("inserts:");
        console.log(inserts);
        */

        let [result] = await (pool.query(sql, inserts));


        if(show_output) {
            console.log("Wrote player data to database");
        }

        /*
        pool.query(sql, inserts, function(err, result) {
            if(err) throw err;



        });

        */

        dirty.players[i].has_change = false;
    } catch(error) {
        log(chalk.red("Error in main.writePlayerDirty: " + error));
        console.error(error);
    }

}


// will only spawn monsters if the planet coords are in memory
// we could always initially put the planet coords that spawn something in memory. Not sure yet.
async function spawnMonsters(dirty) {


    try {
        //log(chalk.green("Now spawning monsters"));
        // lets filter our planet coords by the ones that spawn mosnters
        let planet_coords = dirty.planet_coords.filter(planet_coord => parseInt(planet_coord.spawns_monster_type_id) > 0 && !planet_coord.spawned_monster_id);

        planet_coords.forEach(await async function(planet_coord) {

            try {
                await monster.spawn(dirty,  planet_coord.spawns_monster_type_id,{ 'planet_coord_id':planet_coord.id });
            } catch(error) {
                log(chalk.red("Error in spawnMonsters: " + error));
                console.error(error);
            }

        });


    } catch(error) {
        log(chalk.red("Failed in spawnMonsters: " + error));
        console.error(error);
    }

}





function diff(a,b){return Math.abs(a-b);}

module.exports.diff = diff;



async function npcActions(dirty) {
    try {

        await npc.npcActions(dirty);
    } catch(error) {
        log(chalk.red("Error in main.npcActions: " + error));
        console.error(error);
    }

}

async function tickAddictions(dirty) {
    try {
        await game.tickAddictions(dirty);
    } catch(error) {
        log(chalk.red("Error in main.tickAddictions: " + error));
        console.error(error);
    }

}

async function tickAI(dirty) {
    try {
        await game.tickAI(dirty);
    } catch(error) {
        log(chalk.red("Error in main.tickAI: " + error));
        console.error(error);
    }
}

async function tickAssemblies(dirty) {
    //console.log("In tickAssemblies");

    try {
        await game.tickAssemblies(dirty);
    } catch(error) {
        log(chalk.red("Error in main.tickAssemblies: " + error));
        console.error(error);
    }


}

async function tickAutopilots(dirty) {
    try {
        await game.tickAutopilots(dirty);
    } catch(error) {
        log(chalk.red("Error calling game.tickAutopilots: " + error));
        console.err(error);
    }

}


async function tickBattleLinkers(dirty, pool) {

    try {

        let connected_count = 0;

        Object.keys(io.sockets.sockets).forEach(function(id) {
            //console.log("ID:" + id);

            socket = io.sockets.connected[id];

            game.tickEnergy(socket, dirty);
            connected_count++;

        });

        if(connected_count > 0) {

            await battle.doLinkers(dirty);

            // we reset the player's defended count after all the battle linkers have been executed
            dirty.players.forEach(function(player) {
                if(player.attacks_defended && player.attacks_defended > 0) {
                    player.attacks_defended = 0;
                }
            });



        }



    } catch(error) {
        log(chalk.red("Error calling battle.doLinkers: " + error));
        console.error(error);
    }
}


async function tickDecay(dirty) {
    try {
        await game.tickDecay(dirty);
    } catch(error) {
        log(chalk.red("Error calling game.tickDecay: " + error));
    }
}

async function tickFixAll(dirty) {
    try {
        await game.fixAll(dirty);
    } catch(error) {
        log(chalk.red("Error calling game.fixAll: " + error));
        console.err(error);
    }

}

async function tickFloors(dirty) {
    try {
        await game.tickFloors(dirty);
    } catch(error) {
        log(chalk.red("Error in main.tickFloors:" + error));
        console.error(error);
    }

}

async function tickFood(dirty) {
    try {
        await game.tickFood(dirty);
    } catch(error) {
        log(chalk.red("Error calling game.tickFood: " + error));
    }

}

async function tickEvents(dirty) {
    try {
        //log(chalk.yellow("going to call event.tickSpawning"));
        //console.time("event.tickSpawning");
        await event.tickSpawning(dirty);
        //console.timeEnd("event.tickSpawning");
        await event.tickSpawnedEvents(dirty);
        //await game.tickEvents(dirty);
    } catch(error) {
        log(chalk.red("Error calling event.tickSpawning, or event.tickSpawnedEvents:" + error));
        console.error(error);
    }
}

async function tickRegularMonsterSpawns(dirty) {

    try {

        event.tickRegularMonsterSpawns(dirty);

    } catch(error) {
        log(chalk.red("Error in tickRegularMonsterSpawns: " + error));
        console.error(error);
    }
}

/*
async function tickGrowths(dirty) {
    try {
        game.tickGrowths(dirty);
        log(chalk.yellow("Calling game.tickGrowths"));
    } catch(error) {
        log(chalk.red("Error calling game.tickGrowths: " + error));
    }
}

*/

async function tickGalaxy(dirty) {
    try {

        world.tickGalaxy(dirty);

    } catch(error) {
        log(chalk.red("Error in tickGalaxy: " + error));
        console.error(error);
    } 
}

async function tickGalaxyObjects(dirty) {
    try {
        //let hrstart = new process.hrtime();
        await movement.moveGalaxyObjects(dirty);
        //let hrend = process.hrtime(hrstart);
        //console.info('Execution time movement.moveGalaxyObjects (hr): %ds %dms', hrend[0], hrend[1] / 1000000);
    } catch(error) {
        log(chalk.red("Error in tickGalaxyObjects: " + error));
        console.error(error);
    }
}

async function tickMarketLinkers(dirty) {
    try {


        await game.tickMarketLinkers(dirty);

    } catch(error) {
        log(chalk.red("Error in main.tickMarketLinkers"));
    }
}



async function tickMining() {

    try {
        await game.tickMining(dirty);
    } catch(error) {
        log(chalk.red("Error calling game.tickMining: " + error));
        console.error(error);
    }

}

async function tickMonsterDecay(dirty) {
    try {
        await game.tickMonsterDecay(dirty);
    } catch(error) {
        log(chalk.red("Error calling game.tickMonsterDecay: " + error));
    }
}


/*
async function tickMonsterSpawns(dirty) {
    try {
        game.tickMonsterSpawns(dirty);
    } catch(error) {
        log(chalk.red("Error in calling game.tickMonsterSpawns: " + error));
    }
}

*/

async function tickMoveMonsters(dirty) {
    try {
        // TODO another pass at efficiency for this.
        //let hrstart = new process.hrtime();
        await game.tickMoveMonsters(dirty);
        //let hrend = process.hrtime(hrstart);
        //console.info('Execution time game.tickMoveMonsters (hr): %ds %dms', hrend[0], hrend[1] / 1000000);
        
    } catch(error) {
        log(chalk.red("Error in calling game.tickMoveMonsters: " + error));
        console.error(error);
    }
}

// Every 10th of a secnod
async function tickNextMoves(dirty) {

    try {

        if(dirty.next_moves.length > 0) {

            dirty.next_moves.forEach(await async function(next_move, i) {
               //console.log("Have next move for player id: " + next_move.player_id + " with a waiting time of: " + next_move.waiting_time);

               if(next_move.waiting_time <= 100) {
                   let player_index = await player.getIndex(dirty, { 'player_id': next_move.player_id });
                   let player_socket = world.getPlayerSocket(dirty, player_index);
                   await movement.move(player_socket, dirty, { 'movement': next_move.movement });
                   dirty.next_moves.splice(i, 1);

               } else {
                   next_move.waiting_time -= 100;
               }
            });
        }

        // and monsters in battle
        if(battle) {
            await battle.moveMonsters(dirty);
        }


    } catch(error) {
        log(chalk.red("Error in tickNextMoves: " + error));
        console.error(error);
    }
}

async function tickNomad(dirty) {
    try {
        await world.tickNomad(dirty);
    } catch(error) {
        log(chalk.red("Error calling world.tickNomad: " + error));
    }
}

module.exports.tickNomad = tickNomad;


async function tickNpcSkills() {
    try {
        await npc.tickNpcSkills(dirty);
    } catch(error) {
        log(chalk.red("Error in tickNpcSkills"));
        console.error(error);
    }
}

/*
// USING GAME.TICKSPAWNERS INSTEAD!
async function tickObjectSpawners(dirty) {
    try {


        game.tickObjectSpawners(dirty);

    } catch(error) {
        log(chalk.red("Error in tickObjectSpawners"));
    }
}

*/


async function tickRepairs(dirty) {

    try {
        await game.tickRepairs(dirty);
    } catch(error) {
        log(chalk.red("Error calling game.tickRepairs: " + error));
    }

}

async function tickResearches(dirty) {
    //console.log("In tickResearches");

    await game.tickResearches(dirty);
}

async function tickSpawners(dirty) {
    //let hrstart = new process.hrtime();
    await game.tickSpawners(dirty);
    //let hrend = process.hrtime(hrstart);
    //console.info('Execution time game.tickSpawners (hr): %ds %dms', hrend[0], hrend[1] / 1000000);
}

async function tickSalvaging(dirty) {

    try {
        await game.tickSalvaging(dirty);
    } catch(error) {
        log(chalk.red("Error calling game.tickSalvaging: " + error));
    }

}

async function tickStorytellers(dirty) {
    await world.tickStorytellers(dirty);
}

async function tickTraps(dirty) {
    await game.tickTraps(dirty);
}

async function tickWaitingDrops(dirty) {
    await world.tickWaitingDrops(dirty);
}

async function updateMaps(dirty) {
    Object.keys(io.sockets.sockets).forEach(function(id) {

        socket = io.sockets.connected[id];

        if(socket.logged_in === true) {

            map.updateMap(socket, dirty);
        }
    });
}




// Every 10th second
setInterval(tickNextMoves, 100, dirty);

// Every 2 seconds
setInterval(tickAutopilots, 2000, dirty);


// 5 seconds
setInterval(tickAutopilots, 5000, dirty);
setInterval(tickBattleLinkers, 5000, dirty, pool);
setInterval(tickFloors, 5000, dirty);
setInterval(tickFood, 5000, dirty);
setInterval(tickMining, 5000);
setInterval(tickRepairs, 5000, dirty);
setInterval(tickSalvaging, 5000, dirty);

// 10 seconds
setInterval(tickMoveMonsters, 10000, dirty);


// 20 seconds
setInterval(tickAddictions, 20000, dirty);
setInterval(npcActions, 20000, dirty);
setInterval(tickAssemblies, 20000, dirty);
setInterval(updateMaps, 20000, dirty);
setInterval(writeDirty, 20000);


// 30 seconds
setInterval(tickResearches, 30000, dirty);
setInterval(tickMonsterDecay, 30000, dirty);
setInterval(tickAI, 30000, dirty);


// 60 seconds
setInterval(tickRegularMonsterSpawns, 60000, dirty);
setInterval(tickWaitingDrops, 60000, dirty);


// 150 seconds ( 2 and a 1/2 minutes)
//setInterval(spawnGalaxyObjects, 150000, dirty);
//setInterval(spawnMonsters, 150000, dirty);
//setInterval(async() => { await spawnMonsters(dirty); }, 150000);



// 300 seconds ( 5 minutes )
setInterval(tickEvents, 300000, dirty);
setInterval(tickGalaxyObjects, 300000, dirty);
setInterval(tickStorytellers, 300000, dirty);
setInterval(tickTraps, 300000, dirty);

// 600 seconds ( 10 minutes )
setInterval(tickMarketLinkers, 600000, dirty);
setInterval(tickSpawners, 600000, dirty);


// 1 hour
setInterval(tickFixAll, 3600000, dirty);
setInterval(tickNpcSkills, 3600000);

// 2 hours
setInterval(tickDecay, 7200000, dirty);


// 12 hours
setInterval(tickNomad, 43200000, dirty);


// 24 hours
// We're basically ticking a month every day - ~1 to 30 ratio of time
setInterval(tickGalaxy, 86400000, dirty);


/*
async function shutdown() {
    log(chalk.cyan("GOT STOP SIGNAL! DO STUFF!!!!"));
    await disconnectPlayers();
    await writeDirty();
    log(chalk.cyan("WROTE DIRTY. TIME TO DIE"));
}

process.on('SIGINT', shutdown.bind(null));
*/


inits.stop(1, async function(callback) {

    console.log("STOP DISCONNECTING PLAYERS");
    await disconnectPlayers();
    console.log("FINISHED DISCONNECTING PLAYERS");
    callback(null);

});

inits.stop(2, async function(callback) {

    console.log("KILLING THE SEVER! WRITING FINAL DIRTY");


    for(let i = 0; i < dirty.players.length; i++) {
        if(dirty.players[i] && dirty.players[i].has_change) {
            await writePlayerDirty(dirty.players[i], i, true);
        }
    }

    //await writeDirty(true);
    console.log("FINISHED WRITING FINAL DIRTY");
    callback(null);

});