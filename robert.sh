#!/bin/sh
# rm ~/.forever/forever.log
#redis-cli flushall
fuser -k -n tcp 3000
rm ./nohup.out
nohup node ./bin/www
