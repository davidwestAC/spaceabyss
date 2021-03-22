# Space Abyss
The full client and server of Space Abyss: https://space.alphacoders.com

Back when I was 13 or so, a kind developer let me buy an old version of his game for $20. 
That started my journey. I hope Space Abyss can help someone else start their journey.

The code of Space Abyss is open sourced under the MIT license.
I've either drawn or paid to have drawn all the art in Space Abyss. It is open sourced under the MIT license as well.
Please check the artists page (https://space.alphacoders.com/artists) for further details regarding any sound/music used in game.
Please check the licenses of any software Space Abyss makes use of ( Phaser, Socket.io, etc ) to make sure
you are in line with all of their licenses as well.


# Technology Used
Client - HTML5 via Phaser 3 (3.15.1) ( https://phaser.io ) 

Server - Nodejs Version 12.18.0

I'm using Socket.io ( https://socket.io ) to communicate between the two.

Currently I have Space Abyss running on Ubuntu 20.04

You can find a database schema dump as well as the package.json at the root level of this repo.

# Work In Progress
Space Abyss is in active, early development. For the time being, there isn't going to be an easy 
setup guide; instead I'm just going to be building it. Things like the database can be intuited for now from 
the code, but I know that's a large barrier to understanding/running something. I'll try to clean up and 
prioritize areas that I get the most questions about.


#Structure
The client is in public/dev_client

The server is in dev_server

If you want only the schema of the database, you can use database-schema-0.2.38.sql

If you want to have a populated list of objects types, monster types, and how they interact with each other, You'll also want to import populated-game-structure-0.2.38.sql

My current ideas are collected at helper_info/ideas.txt. There are other useful files for world building in there.

# Contact
You can email me at spaceabyss@alphacoders.com . If you want to chat, we have a discord at https://discord.gg/5WMUMa8

# Other Notes
I'm probably doing plenty of things wrong. I tend to learn as I go - and I don't know what I don't know. 
Please try to be kind, and give examples if you're suggesting to do something another way. I may have a 
different idea, but I will always appreciate advice. 
