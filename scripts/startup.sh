#!/bin/bash

installed=$(find /home/odroid/navdroid -type d -maxdepth 1 -name 'navcoin-*')
installed="${installed:30}"

/home/odroid/navdroid/navcoin-${installed}/bin/navcoind &

forever start -c "npm start" /home/odroid/navdroid/angular
forever start -c "npm start" /home/odroid/navdroid/express
