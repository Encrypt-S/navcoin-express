#!/bin/bash

/usr/local/bin/navcoind &
forever start -c "npm start" /home/odroid/navdroid/navcoin-angular
forever start -c "npm start" /home/odroid/navdroid/navcoin-express
