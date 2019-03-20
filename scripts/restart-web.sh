#!/bin/bash

forever stopall

cd /home/odroid/navdroid/express
forever start ./bin/www

cd /home/odroid/navdroid/angular
forever start node_modules/@angular/cli/bin/ng serve --ssl true --proxy-config proxy.config.json --host 0.0.0.0
