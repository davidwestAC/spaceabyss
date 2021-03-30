#!/bin/bash

CLIENT_DEV_DIRECTORY="/mnt/c/spaceabyss/public/dev_client"

# put in the production port, and production phaser
sed -i 's/8010/8000/g' /mnt/c/spaceabyss/public/dev_client/index.html
sed -i 's/phaser-3.15.1.js/phaser-3.15.1.min.js/g' /mnt/c/spaceabyss/public/dev_client/index.html

# now lets make a copy for itch.io
mkdir /mnt/c/spaceabyss/itch.io/${1}

cp /mnt/c/spaceabyss/public/dev_client/client_click_${1}.js /mnt/c/spaceabyss/itch.io/${1}/client_click_${1}.js
cp /mnt/c/spaceabyss/public/dev_client/client_functions_${1}.js /mnt/c/spaceabyss/itch.io/${1}/client_functions_${1}.js
cp /mnt/c/spaceabyss/public/dev_client/client_network_${1}.js /mnt/c/spaceabyss/itch.io/${1}/client_network_${1}.js
cp /mnt/c/spaceabyss/public/dev_client/effects_${1}.js /mnt/c/spaceabyss/itch.io/${1}/effects_${1}.js
cp /mnt/c/spaceabyss/public/dev_client/index.html /mnt/c/spaceabyss/itch.io/${1}/index.html
cp /mnt/c/spaceabyss/public/dev_client/monster_${1}.js /mnt/c/spaceabyss/itch.io/${1}/monster_${1}.js
cp /mnt/c/spaceabyss/public/dev_client/planet_${1}.js /mnt/c/spaceabyss/itch.io/${1}/planet_${1}.js
cp /mnt/c/spaceabyss/public/dev_client/player_${1}.js /mnt/c/spaceabyss/itch.io/${1}/player_${1}.js


# put the development port and phaser back in
sed -i 's/8000/8010/g' /mnt/c/spaceabyss/public/dev_client/index.html
sed -i 's/phaser-3.15.1.min.js/phaser-3.15.1.js/g' /mnt/c/spaceabyss/public/dev_client/index.html


# rename our dev client to unversioned files to be nice on github
mv $CLIENT_DEV_DIRECTORY/client_click_${1}.js $CLIENT_DEV_DIRECTORY/client_click.js
mv $CLIENT_DEV_DIRECTORY/client_functions_${1}.js $CLIENT_DEV_DIRECTORY/client_functions.js
mv $CLIENT_DEV_DIRECTORY/client_network_${1}.js $CLIENT_DEV_DIRECTORY/client_network.js
mv $CLIENT_DEV_DIRECTORY/effects_${1}.js $CLIENT_DEV_DIRECTORY/effects.js
mv $CLIENT_DEV_DIRECTORY/monster_${1}.js $CLIENT_DEV_DIRECTORY/monster.js
mv $CLIENT_DEV_DIRECTORY/planet_${1}.js $CLIENT_DEV_DIRECTORY/planet.js
mv $CLIENT_DEV_DIRECTORY/player_${1}.js $CLIENT_DEV_DIRECTORY/player.js

# Update our index.html file to call the updated files
sed -i "s/client_functions_${1}/client_functions/g" $CLIENT_DEV_DIRECTORY/index.html
sed -i "s/client_network_${1}/client_network/g" $CLIENT_DEV_DIRECTORY/index.html
sed -i "s/client_click_${1}/client_click/g" $CLIENT_DEV_DIRECTORY/index.html
sed -i "s/effects_${1}/effects/g" $CLIENT_DEV_DIRECTORY/index.html
sed -i "s/monster_${1}/monster/g" $CLIENT_DEV_DIRECTORY/index.html
sed -i "s/planet_${1}/planet/g" $CLIENT_DEV_DIRECTORY/index.html
sed -i "s/player_${1}/player/g" $CLIENT_DEV_DIRECTORY/index.html
