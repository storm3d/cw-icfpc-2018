#!/bin/sh
set -e
privateID=e196b3421b5141ed8763a5837d0612ed
cd $1
zip --password $privateID submission.zip *
mv submission.zip .. && cd ..
sha=$(shasum -a 256 submission.zip | awk '{ print $1 }')
scp submission.zip bodva@thebodva.com:/var/www/thebodva.com/www/upload
curl -L \
  --data-urlencode action=submit \
  --data-urlencode privateID=$privateID \
  --data-urlencode submissionURL=https://thebodva.com/upload/submission.zip \
  --data-urlencode submissionSHA=$sha \
  https://script.google.com/macros/s/AKfycbzQ7Etsj7NXCN5thGthCvApancl5vni5SFsb1UoKgZQwTzXlrH7/exec