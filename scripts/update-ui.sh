#!/bin/bash

cd /home/odroid/navdroid/angular
git pull

cd /home/odroid/navdroid/express
git pull

forever stopall

forever start -c "npm start" /home/odroid/navdroid/angular
forever start -c "npm start" /home/odroid/navdroid/express
