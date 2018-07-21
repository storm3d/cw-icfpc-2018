#!/usr/bin/env bash
set -e
/usr/bin/env yarn start
for i in {001..186}
do
    num=$(printf "%03d" $i)
    echo $num
    /usr/bin/env node dist/index.js $1 $2 $num
done