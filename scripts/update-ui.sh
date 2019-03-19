#!/bin/bash

cd /home/odroid/navdroid/angular
git checkout master
git pull

cd /home/odroid/navdroid/express
git checkout master
git pull

forever stopall

forever start -c "npm start" /home/odroid/navdroid/angular
forever start -c "npm start" /home/odroid/navdroid/express
