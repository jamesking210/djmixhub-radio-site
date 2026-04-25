FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint-generate-config.sh /docker-entrypoint.d/40-generate-config.sh
COPY . /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.d/40-generate-config.sh

EXPOSE 80
