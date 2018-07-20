#!/bin/sh
set -e
zip -r submission.zip $1
sha=$(shasum -a 256 submission.zip | awk '{ print $1 }')
scp submission.zip bodva@thebodva.com:/var/www/thebodva.com/www/upload
curl -L \
  --data-urlencode action=submit \
  --data-urlencode privateID=e196b3421b5141ed8763a5837d0612ed \
  --data-urlencode submissionURL=https://thebodva.com/upload/submission.zip \
  --data-urlencode submissionSHA=$sha \
  https://script.google.com/macros/s/AKfycbzQ7Etsj7NXCN5thGthCvApancl5vni5SFsb1UoKgZQwTzXlrH7/exec