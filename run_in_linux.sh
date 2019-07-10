#!/bin/sh
# sudo cp ./model/client/CTP/linux/x64/lib* /usr/local/lib
# sudo cp ./model/client/Sgit/linux/x64/lib* /usr/local/lib
# sudo npm install
# sudo npm install forever -g
fuser -k -n tcp 3000
/usr/bin/forever stop 0
rm /home/ubuntu/project/nodequant/nodequant/forever.log
/usr/bin/forever start -l /home/ubuntu/project/nodequant/nodequant/forever.log ./bin/www
