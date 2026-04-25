FROM nginx:alpine

COPY hybrid-site/nginx.conf /etc/nginx/conf.d/default.conf
COPY hybrid-site/docker-entrypoint-generate-config.sh /docker-entrypoint.d/40-generate-config.sh
COPY hybrid-site /usr/share/nginx/html
COPY assets /usr/share/nginx/html/assets

RUN chmod +x /docker-entrypoint.d/40-generate-config.sh

EXPOSE 80
