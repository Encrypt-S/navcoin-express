#!/bin/bash

cd /home/odroid/navdroid/navcoin-angular
git checkout master
git pull

cd /home/odroid/navdroid/navcoin-express
git checkout master
git pull

forever stopall

forever start -c "npm start" /home/odroid/navdroid/navcoin-angular
forever start -c "npm start" /home/odroid/navdroid/navcoin-express
