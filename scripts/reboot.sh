#!/bin/bash

log=/home/odroid/navdroid/express/log/reboot.log
touch $log
chmod 777 $log

echo "attempting shutdown" >> $log

sudo /sbin/shutdown -r now >> $log

echo "script finished" >> $log


# cd /home/odroid/navdroid/express
# forever start ./bin/www

# cd /home/odroid/navdroid/angular
# forever start node_modules/@angular/cli/bin/ng serve --ssl true --proxy-config proxy.config.json --host 0.0.0.0
