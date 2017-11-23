#!/bin/sh

npm install

echo '*/2 * * * * node /var/weather/src/cron/index >> /var/log/cron.log 2>&1' > /etc/crontabs/root

touch /var/log/cron.log

# crond -l 2 -f && tail -f /var/log/cron.log
crond && tail -f /var/log/cron.log
