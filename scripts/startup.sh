#!/bin/bash

installed=$(find /home/odroid/navdroid -type d -maxdepth 1 -name 'navcoin-*')
installed="${installed:30}"

/home/odroid/navdroid/navcoin-${installed}/bin/navcoin-cli stop
/home/odroid/navdroid/navcoin-${installed}/bin/navcoind &

forever stopall

cd /home/odroid/navdroid/express
forever start ./bin/www

cd /home/odroid/navdroid/angular
forever start node_modules/@angular/cli/bin/ng serve --ssl true --proxy-config proxy.config.json --host 0.0.0.0
