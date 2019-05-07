#!/bin/bash

sudo /bin/systemctl stop navcoin

echo "sleeping for 30s..."
echo
sleep 30s

sudo /usr/local/bin/navcoind -zapwallettxes=1 &

echo "DONE"
echo


exit 0
