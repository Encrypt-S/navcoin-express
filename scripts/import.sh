#!/bin/bash
echo "IMPORTING"

log=/home/odroid/navdroid/express/log/import-wallet.log
touch $log
chmod 777 $log

now=$(date +"%m-%d-%Y %T")
echo "${now} - importing wallet" >> $log

FILE=$1

mv /home/odroid/.navcoin4/wallet.dat /home/odroid/.navcoin4/${date}_wallet.dat

cp $FILE /home/odroid/.navcoin4/wallet.dat

exit 0
