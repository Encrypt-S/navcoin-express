#!/bin/bash

#TODO check if this process is already running

echo "Finding latest version"

now=$(date +"%m-%d-%Y %T")

touch /home/odroid/navdroid/express/log/update.json
chmod 777 /home/odroid/navdroid/express/log/update.json
latest=$(curl https://api.github.com/repos/NAVCoin/navcoin-core/releases/latest)

next=false
for line in $latest
do
  if $next; then
    if [ ${#line} -lt 4 ]; then
      echo "Invalid release name: ${line}"
      echo "{\"last_run\":\"${now}\",\"success\":false,\"code\":\"INVALID_RELEASE\"}" > /home/odroid/navdroid/express/log/update.json
      exit 0
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
  echo "{\"last_run\":\"${now}\",\"success\":false,\"code\":\"NO_RELEASE\"}" > /home/odroid/navdroid/express/log/update.json
  echo "Release not found"
  exit 0
fi

echo "Latest Version: $tag"

installed=$(find /home/odroid/navdroid -type d -maxdepth 1 -name 'navcoin-*')
installed="${installed:30}"

echo "Installed Version: $installed"

if [ "$installed" == "$tag" ]; then
 echo "already at latest version"
 exit 1
fi

echo "Update Required... Updating"

cd /home/odroid/navdroid

echo "Downloading latest version"
download="https://github.com/NAVCoin/navcoin-core/releases/download/${tag}/navcoin-${tag}-arm-linux-gnueabihf.tar.gz"

wget $download
wgetreturn=$?

if [ $wgetreturn -ne 0 ]; then
  echo "Download failed"
  echo "{\"last_run\":\"${now}\",\"success\":false,\"code\":\"FAILED_DOWNLOAD\"}" > /home/odroid/navdroid/express/log/update.json
  exit 0
fi

echo "Removing old files"
rm -rf /home/odroid/navdroid/navcoin-${installed}

echo "Expanding new version"
tar zxvf navcoin-${tag}-arm-linux-gnueabihf.tar.gz -C /home/odroid/navdroid/
rm navcoin-${tag}-arm-linux-gnueabihf.tar.gz

echo "Restarting navcoin daemon"
/home/odroid/navdroid/navcoin-${tag}/bin/navcoin-cli stop
/home/odroid/navdroid/navcoin-${tag}/bin/navcoind &
echo "NavCoin has successfully updated to the latest version"
echo "{\"last_run\":\"${now}\",\"success\":true,\"code\":\"UPDATE_INSTALLED\"}" > /home/odroid/navdroid/express/log/update.json

exit 0
