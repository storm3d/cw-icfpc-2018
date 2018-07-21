#!/usr/bin/env bash
set -e
for i in {001..186}
do
    num=$(printf "%03d" $i)
    /usr/bin/env node dist/index.js $1 $2 $num
done