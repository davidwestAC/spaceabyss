#!/bin/bash
# Puts versioning back into a local development environment after we push a version to github
CLIENT_DEV_DIRECTORY="/mnt/c/spaceabyss/public/dev_client"


# Puts the development version back into dev
mv $CLIENT_DEV_DIRECTORY/client_click.js $CLIENT_DEV_DIRECTORY/client_click_${1}.js
mv $CLIENT_DEV_DIRECTORY/client_functions.js $CLIENT_DEV_DIRECTORY/client_functions_${1}.js
mv $CLIENT_DEV_DIRECTORY/client_network.js $CLIENT_DEV_DIRECTORY/client_network_${1}.js
mv $CLIENT_DEV_DIRECTORY/effects.js $CLIENT_DEV_DIRECTORY/effects_${1}.js
mv $CLIENT_DEV_DIRECTORY/monster.js $CLIENT_DEV_DIRECTORY/monster_${1}.js
mv $CLIENT_DEV_DIRECTORY/planet.js $CLIENT_DEV_DIRECTORY/planet_${1}.js
mv $CLIENT_DEV_DIRECTORY/player.js $CLIENT_DEV_DIRECTORY/player_${1}.js

# Update our index.html file to call the updated files
sed -i "s/client_functions.js/client_functions_${1}.js/g" $CLIENT_DEV_DIRECTORY/index.html
sed -i "s/client_network.js/client_network_${1}.js/g" $CLIENT_DEV_DIRECTORY/index.html
sed -i "s/client_click.js/client_click_${1}.js/g" $CLIENT_DEV_DIRECTORY/index.html
sed -i "s/effects.js/effects_${1}.js/g" $CLIENT_DEV_DIRECTORY/index.html
sed -i "s/monster.js/monster_${1}.js/g" $CLIENT_DEV_DIRECTORY/index.html
sed -i "s/planet.js/planet_${1}.js/g" $CLIENT_DEV_DIRECTORY/index.html
sed -i "s/player.js/player_${1}.js/g" $CLIENT_DEV_DIRECTORY/index.html