#!/bin/bash
echo "IMPORTING"

log=/home/odroid/navdroid/express/log/import-wallet.log
touch $log
chmod 777 $log

now=$(date +"%m-%d-%Y %T")
echo "${now} - importing wallet" >> $log

time=$(date +"%s")

FILE=$1

# possibly backup old wallet.dat file
# mv /home/odroid/.navcoin4/wallet.dat /home/odroid/.navcoin4/${time}_wallet.dat

cp $FILE /home/odroid/.navcoin4/wallet.dat

installed=$(find /home/odroid/navdroid -type d -maxdepth 1 -name 'navcoin-*')
installed="${installed:30}"

/home/odroid/navdroid/navcoin-${installed}/bin/navcoin-cli stop

sleep 5s

/home/odroid/navdroid/navcoin-${installed}/bin/navcoind &

exit 0
