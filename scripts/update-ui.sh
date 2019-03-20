#!/bin/bash

log=/home/odroid/navdroid/express/log/update-ui.log
touch $log
chmod 777 $log

now=$(date +"%m-%d-%Y %T")

echo "${now} - updating ui" >> $log

forever stopall >> $log

cd /home/odroid/navdroid/angular
git pull >> $log
# npm install

cd /home/odroid/navdroid/express
git pull >> $log
# npm install

cd /home/odroid/navdroid/express
forever start ./bin/www >> $log

cd /home/odroid/navdroid/angular
forever start node_modules/@angular/cli/bin/ng serve --ssl true --proxy-config proxy.config.json --host 0.0.0.0  >> $log
