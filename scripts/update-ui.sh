#!/bin/bash

log=/home/odroid/navdroid/express/log/update-ui.log
touch $log
chmod 777 $log

now=$(date +"%m-%d-%Y %T")

forever stopall >> $log

echo "${now} - forever stopped" >> $log

cd /home/odroid/navdroid/angular
git pull >> $log
# npm install

echo "${now} - pulled angular" >> $log

cd /home/odroid/navdroid/express
git pull >> $log
# npm install

echo "${now} - pulled express" >> $log

echo "${now} - attempting to restart express" >> $log

cd /home/odroid/navdroid/express
forever start ./bin/www >> $log

echo "${now} - attempting to restart angular" >> $log

cd /home/odroid/navdroid/angular
forever start node_modules/@angular/cli/bin/ng serve --ssl true --proxy-config proxy.config.json --host 0.0.0.0  >> $log

echo "${now} - script finished" >> $log
