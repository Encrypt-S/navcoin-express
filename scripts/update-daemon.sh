#!/bin/bash

log=/home/odroid/navdroid/express/log/update-daemon.log
touch $log
chmod 777 $log

now=$(date +"%m-%d-%Y %T")
echo "${now} - update daemon" >> $log
echo "Finding latest version" >> $log

latest=$(curl https://api.github.com/repos/NAVCoin/navcoin-core/releases/latest) >> $log

next=false
for line in $latest
do
  if $next; then
    if [ ${#line} -lt 4 ]; then
      echo "Invalid release name: ${line}" >> $log
      exit 1
    fi
    tag="${line#?}"; tag="${tag%?}"; tag="${tag%?}"
  fi
  if echo $line | grep tag_name > /dev/null; then
    next=true
  else
    next=false
  fi
done

if [ -z "$tag" ]; then
  echo "Release not found" >> $log
  exit 2
fi

echo "Latest Version: $tag" >> $log

installed=$(find /home/odroid/navdroid -type d -maxdepth 1 -name 'navcoin-*')
installed="${installed:30}"

echo "Installed Version: $installed" >> $log

if [ "$installed" == "$tag" ]; then
 echo "already at latest version" >> $log
 exit 3
fi

echo "Update Required... Updating" >> $log

cd /home/odroid/navdroid

echo "Downloading latest version" >> $log
download="https://github.com/NAVCoin/navcoin-core/releases/download/${tag}/navcoin-${tag}-arm-linux-gnueabihf.tar.gz"

wget $download  >> $log
wgetreturn=$?

if [ $wgetreturn -ne 0 ]; then
  echo "Download failed" >> $log
  exit 4
fi

echo "Removing old files" >> $log
rm -rf /home/odroid/navdroid/navcoin-${installed}

echo "Expanding new version" >> $log
tar zxvf navcoin-${tag}-arm-linux-gnueabihf.tar.gz -C /home/odroid/navdroid/
rm navcoin-${tag}-arm-linux-gnueabihf.tar.gz

echo "Restarting navcoin daemon" >> $log
/home/odroid/navdroid/navcoin-${tag}/bin/navcoin-cli stop
sleep 2s
/home/odroid/navdroid/navcoin-${tag}/bin/navcoind &
echo "NavCoin has successfully updated to the latest version" >> $log

exit 0
