#!/bin/sh
#
## Temporary
##
## OS customizations
#

#!/bin/bash
#
# configure navdroid
#

# set timezone to UTC
timedatectl set-timezone UTC

# add odroid user
useradd -m -p Om16ojfOaLNA6 -s /bin/bash odroid

# add repo
add-apt-repository ppa:bitcoin/bitcoin

# update apt
apt -y update
apt -y upgrade
apt -y dist-upgrade
apt -y autoremove

# install packages
apt -y install build-essential libcurl3-dev libtool autotools-dev automake pkg-config libssl-dev libevent-dev bsdmainutils libqrencode-dev libboost-all-dev libminiupnpc-dev synaptic htop libunbound-dev libzmq3-dev zram-config git libdb4.8-dev libdb4.8++-dev ntp ntpdate sysstat screen checkinstall nginx vim openssh-server
apt -y --fix-broken install

# set vim as default editor
update-alternatives --set editor /usr/bin/vim.basic

# fix date/time with ntpdate
service ntp stop && ntpdate -u time.google.com
service ntp start

# enable ssh
update-rc.d ssh enable

# enable ssh
ufw allow ssh
ufw allow http
ufw allow https
ufw allow from any proto tcp port 4200
ufw enable

# expand microsd filesystem on next boot
# this script points to a static drive variable and may break at some point
#chmod +x fs_resize_navdroid.sh
#bash -x fs_resize_navdroid.sh


########################
# install navcoin-core #
########################
cd /home/odroid
git clone https://github.com/navcoin/navcoin-core.git
cd navcoin-core
./autogen.sh
./configure CFLAGS="-O2 -mtune=cortex-a15.cortex-a7 -mfpu=neon" CXXFLAGS="-O2 -mtune=cortex-a15.cortex-a7 -mfpu=neon" --enable-hardening --without-gui --enable-upnp-default
make -j3

# checkinstall to generate dpkg
checkinstall -D -y --maintainer "info@navcoin.org" --pkgname navcoin-core --pkgversion 4.5.2 --requires nginx,build-essential,libcurl3-dev,libtool,autotools-dev,automake,pkg-config,zram-config,git,ntp

# clean up
make clean


# clear bash history
#history -c
cat /dev/null > ~/.bash_history

