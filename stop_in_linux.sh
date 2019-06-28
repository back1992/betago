#!/bin/sh
# sudo cp ./model/client/CTP/linux/x64/lib* /usr/local/lib
# sudo cp ./model/client/Sgit/linux/x64/lib* /usr/local/lib
# sudo npm install
# sudo npm install forever -g
fuser -k -n tcp 3000
/usr/local/bin/forever stop 0
