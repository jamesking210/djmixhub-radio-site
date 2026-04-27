#!/bin/sh
set -eu

: "${PUBLIC_SITE_URL:=https://djmixhub.com}"
: "${PUBLIC_SITE_NAME:=DJMIXHUB}"
: "${PUBLIC_SITE_TAGLINE:=Open Source Energy. Community Sourced Mixes.}"
: "${PUBLIC_RADIO_BASE_URL:=https://radio.djmixhub.com}"
: "${PUBLIC_STATION_SHORTCODE:=djmixhub}"
: "${PUBLIC_STATION_NAME:=DJMIXHUB}"
: "${PUBLIC_NOW_PLAYING_URL:=https://radio.djmixhub.com/api/nowplaying/djmixhub}"
: "${PUBLIC_STREAM_URL:=}"
: "${PUBLIC_HLS_URL:=}"
: "${PUBLIC_PLAYER_URL:=https://radio.djmixhub.com/public/djmixhub}"
: "${PUBLIC_TWITCH_CHANNEL:=djmixhub}"
: "${PUBLIC_MAIN_REPO_URL:=https://github.com/jamesking210/djmixhub-radio-site}"
: "${PUBLIC_AZURACAST_REPO_URL:=https://github.com/AzuraCast/AzuraCast}"
: "${PUBLIC_GITHUB_URL:=https://github.com/jamesking210}"
: "${PUBLIC_CONTACT_EMAIL:=djmixhubradio@gmail.com}"

envsubst '
${PUBLIC_SITE_URL}
${PUBLIC_SITE_NAME}
${PUBLIC_SITE_TAGLINE}
${PUBLIC_RADIO_BASE_URL}
${PUBLIC_STATION_SHORTCODE}
${PUBLIC_STATION_NAME}
${PUBLIC_NOW_PLAYING_URL}
${PUBLIC_STREAM_URL}
${PUBLIC_HLS_URL}
${PUBLIC_PLAYER_URL}
${PUBLIC_TWITCH_CHANNEL}
${PUBLIC_MAIN_REPO_URL}
${PUBLIC_AZURACAST_REPO_URL}
${PUBLIC_GITHUB_URL}
${PUBLIC_CONTACT_EMAIL}
' < /usr/share/nginx/html/config.template.js > /usr/share/nginx/html/config.js
