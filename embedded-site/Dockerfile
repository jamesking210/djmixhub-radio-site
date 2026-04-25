FROM nginx:alpine

COPY embedded-site/nginx.conf /etc/nginx/conf.d/default.conf
COPY embedded-site/docker-entrypoint-generate-config.sh /docker-entrypoint.d/40-generate-config.sh
COPY embedded-site /usr/share/nginx/html
COPY assets /usr/share/nginx/html/assets

RUN chmod +x /docker-entrypoint.d/40-generate-config.sh

EXPOSE 80
