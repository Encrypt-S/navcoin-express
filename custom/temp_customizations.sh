#!/bin/sh
#
# configure navdroid
#
VERSION="4.5.2"

# set timezone to UTC
timedatectl set-timezone UTC

# add odroid user
useradd -m -G sudo,nopasswdlogin,ssh,users -p Om16ojfOaLNA6 -s /bin/bash odroid

# sudoers
echo "Cmnd_Alias NAV_CMDS = /sbin/reboot, /sbin/shutdown, /bin/systemctl start navcoin-core, /bin/systemctl stop navcoin-core, /bin/systemctl restart navcoin-core, /bin/systemctl start navcoin-angular, /bin/systemctl stop navcoin-angular, /bin/systemctl restart navcoin-angular, /bin/systemctl start navcoin-express, /bin/systemctl stop navcoin-express, /bin/systemctl restart navcoin-express, /bin/systemctl start navdroid, /bin/systemctl stop navdroid, /bin/systemctl restart navdroid" >> /etc/sudoers
echo "odroid ALL=NOPASSWD: NAV_CMDS" >> /etc/sudoers

# create odroid cron
su - odroid -c '(crontab -l 2>/dev/null; echo "@reboot /home/odroid/navcoin-express/scripts/startup.sh") | crontab -'

# add repo
add-apt-repository -y ppa:bitcoin/bitcoin

# update apt
apt -y update
apt -y upgrade
apt -y dist-upgrade
apt -y autoremove

PKGLIST="build-essential\
       	libcurl3-dev\
	libtool\
	autotools-dev\
	automake\
	pkg-config\
	libssl-dev\
	libevent-dev\
	bsdmainutils\
	libqrencode-dev\
	libboost-all-dev\
	libminiupnpc-dev\
	synaptic htop\
	libunbound-dev\
	libzmq3-dev\
	zram-config\
	git\
	libdb4.8-dev\
	libdb4.8++-dev\
	ntp\
	ntpdate\
	sysstat\
	screen\
	checkinstall\
	nginx\
	vim\
	openssh-server\
	ufw"

# install packages
apt -y install $PKGLIST
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

# disable services
systemctl disable alsa-restore
systemctl disable cups
systemctl disable cups-browsed
systemctl disable openvpn
#systemctl disable wpa_supplicant


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
checkinstall -D -y --maintainer "info@navcoin.org" --pkgname navcoin-core --pkgversion $VERSION --requires nginx,build-essential,libcurl3-dev,libtool,autotools-dev,automake,pkg-config,zram-config,git,ntp

# clean up
make clean

########################
# install angular #
########################
cd /home/odroid
git clone https://github.com/Encrypt-S/navcoin-angular.git
git clone https://github.com/Encrypt-S/navcoin-express.git
chown -R odroid:odroid /home/odroid/navcoin*

# clear bash history
#history -c
cat /dev/null > ~/.bash_history

