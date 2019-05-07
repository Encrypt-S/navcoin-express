#!/bin/bash

log=/opt/navdroid/express/log/reboot.log
touch $log
chmod 777 $log

now=$(date +"%m-%d-%Y %T")

echo "${now} - rebooting" >> $log

sudo /sbin/reboot -f >> $log

echo "script finished" >> $log
