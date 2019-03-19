#!/bin/bash

installed=$(find /home/odroid/navdroid -name 'navcoin-*' -type d -maxdepth 1)
installed="${installed:30}"

/home/odroid/navdroid/navcoin-${installed}/bin/navcoin-cli stop
/home/odroid/navdroid/navcoin-${tag}/bin/navcoind &
