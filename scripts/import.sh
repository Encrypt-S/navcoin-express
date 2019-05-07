#!/bin/bash
echo
echo "IMPORTING wallet.dat"
echo

log=/opt/navdroid/express/log/import-wallet.log
touch $log
chmod 777 $log

now=$(date +"%m-%d-%Y %T")
echo "${now} - importing wallet" >> $log

time=$(date +"%s")

FILE=$1

# backup old wallet.dat file
mv /home/odroid/.navcoin4/wallet.dat /home/odroid/.navcoin4/${time}_wallet.dat

cp $FILE /home/odroid/.navcoin4/wallet.dat

sudo /bin/systemctl stop navcoin

echo "sleeping for 10s..."
echo
sleep 10

sudo /bin/systemctl start navcoin

echo "DONE"
echo

exit 0
