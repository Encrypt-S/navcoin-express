#!/bin/bash

log=/home/odroid/navdroid/express/log/update-ui.log
touch $log
chmod 777 $log

forever stopall >> $log

echo "forever stopped" >> $log

cd /home/odroid/navdroid/angular
git pull >> $log
# npm install

echo "pulled angular" >> $log

cd /home/odroid/navdroid/express
git pull >> $log
# npm install

echo "pulled express" >> $log

echo "attempting to restart express" >> $log

cd /home/odroid/navdroid/express
forever start ./bin/www >> $log

echo "attempting to restart angular" >> $log

cd /home/odroid/navdroid/angular
forever start node_modules/@angular/cli/bin/ng serve --ssl true --proxy-config proxy.config.json --host 0.0.0.0  >> $log

echo "script finished" >> $log
