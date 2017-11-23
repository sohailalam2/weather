FROM mhart/alpine-node


WORKDIR /var/weather

COPY  ./src /var/weather/src/
COPY  ./config.json /var/weather/config.json
COPY  ./package.json /var/weather/package.json
COPY  ./start-cron.sh /var/weather/start-cron.sh
COPY  ./start-web.sh /var/weather/start-web.sh

RUN echo \
    && set -ex \
    && npm install \
    && chmod +x /var/weather/*.sh

EXPOSE 8080

VOLUME /var/weather
