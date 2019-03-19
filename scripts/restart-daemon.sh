#!/bin/bash

installed=$(find /home/odroid/navdroid -type d -maxdepth 1 -name 'navcoin-*')
installed="${installed:30}"

/home/odroid/navdroid/navcoin-${installed}/bin/navcoin-cli stop
/home/odroid/navdroid/navcoin-${installed}/bin/navcoind &
