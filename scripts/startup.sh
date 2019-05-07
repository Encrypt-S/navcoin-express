#!/bin/bash

sudo /bin/systemctl stop navcoin
sudo /bin/systemctl stop navcoin-repair

sleep 10

sudo /bin/systemctl start navcoin

echo "DONE"
echo

# modify below here

forever stopall

cd /home/odroid/navdroid/express
forever start ./bin/www

cd /home/odroid/navdroid/angular
forever start node_modules/@angular/cli/bin/ng serve --ssl true --proxy-config proxy.config.json --host 0.0.0.0
