#!/bin/bash

log=/home/odroid/navdroid/express/log/update-ui.log
touch $log
chmod 777 $log

now=$(date +"%m-%d-%Y %T")
echo "${now} - update ui" >> $log

cd /home/odroid/navdroid/angular
git pull
# npm install

cd /home/odroid/navdroid/express
git pull
# npm install
