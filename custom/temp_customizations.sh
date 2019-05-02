#!/bin/sh
#
## Temporary
##
## OS customizations
#

# install packages
apt-get install sysstat # monitor with iostat

# set timezone to UTC
timedatectl set-timezone UTC

# fix date/time with ntpdate
service ntp stop && ntpdate -u time.nist.gov
service ntp start

# enable ssh
ufw allow ssh

# set vim as default editor
update-alternatives --set editor /usr/bin/vim.basic

# expand microsd filesystem on next boot
# this script points to a static drive variable and may break at some point
chmod +x fs_resize.sh
bash -x fs_resize.sh
