#!/bin/bash

/usr/local/bin/navcoind &
forever start -c "npm start" /home/odroid/navdroid/angular
forever start -c "npm start" /home/odroid/navdroid/express
