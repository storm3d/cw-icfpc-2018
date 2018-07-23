#!/usr/bin/env bash
set -e
yarn run launch
privateID=e196b3421b5141ed8763a5837d0612ed
timestamp=$(date +"%H%M%S")
filename=submission$timestamp.zip

cp -vnpr ./dfltTracesF/* ./$1
cd $1
zip --password $privateID $filename *
mv $filename .. && cd ..
sha=$(shasum -a 256 $filename | awk '{ print $1 }')
#scp $filename bodva@thebodva.com:/var/www/thebodva.com/www/upload
#curl -L \
# --data-urlencode action=submit \
# --data-urlencode privateID=$privateID \
# --data-urlencode submissionURL=https://thebodva.com/upload/$filename \
# --data-urlencode submissionSHA=$sha \
# https://script.google.com/macros/s/AKfycbzQ7Etsj7NXCN5thGthCvApancl5vni5SFsb1UoKgZQwTzXlrH7/exec
#rm -rf $filename