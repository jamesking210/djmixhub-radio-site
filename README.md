# DJMixHub Radio Site

DJMixHub is a self-hosted radio website for `djmixhub.com`, built around AzuraCast and Docker.

This repo now contains one site only: the production site that runs at port `8088` locally and is intended to be reverse-proxied to `djmixhub.com`.

## What it includes

- custom sticky bottom player
- AzuraCast now-playing, queue, and history data
- faster realtime metadata updates via AzuraCast high-performance now-playing with fallback polling
- DJ roster from one editable data file
- Docker-ready static site served by Nginx

## Project layout

- `index.html`: main homepage
- `terms.html`: listener terms page
- `styles.css`: site styles
- `app.js`: player logic, realtime now-playing updates, and UI behavior
- `dj-data.js`: DJ roster data
- `config.template.js`: runtime config template rendered inside Docker
- `config.js`: safe local fallback config
- `docker-compose.yml`: single-site local/prod container setup
- `Dockerfile`: image definition for the production site
- `nginx.conf`: Nginx site config
- `docker-entrypoint-generate-config.sh`: generates browser-safe runtime config from env vars
- `assets/`: logo and DJ images

## Config pattern

The frontend does not read `.env` directly.

Instead:

1. Docker reads values from `.env`
2. the container generates a browser-safe `config.js` on startup
3. the site reads that runtime config in the browser

Only public values belong in this config.

## Environment variables

Public site config:

- `PUBLIC_SITE_URL`
- `PUBLIC_SITE_NAME`
- `PUBLIC_SITE_TAGLINE`
- `PUBLIC_RADIO_BASE_URL`
- `PUBLIC_STATION_SHORTCODE`
- `PUBLIC_STATION_NAME`
- `PUBLIC_NOW_PLAYING_URL`
- `PUBLIC_STREAM_URL`
- `PUBLIC_HLS_URL`
- `PUBLIC_SUBMIT_MIX_URL`
- `PUBLIC_MAIN_REPO_URL`
- `PUBLIC_AZURACAST_REPO_URL`
- `PUBLIC_GITHUB_URL`
- `PUBLIC_CONTACT_EMAIL`
- `PUBLIC_CONTACT_PHONE`

Deployment config:

- `PORT`
- `NODE_ENV`

## Local development

1. Copy the sample env file:

```bash
cp .env.example .env
```

2. Edit `.env` for your station URLs, stream settings, and contact info.

3. Build and run the site:

```bash
docker compose up -d --build
```

4. Open:

```text
http://localhost:8088
```

## Recommended `.env` example

```env
PUBLIC_SITE_URL=https://djmixhub.com
PUBLIC_SITE_NAME=DJMIXHUB
PUBLIC_SITE_TAGLINE=Open Source Energy. Community Sourced Mixes.
PUBLIC_RADIO_BASE_URL=https://radio.djmixhub.com
PUBLIC_STATION_SHORTCODE=djmixhub
PUBLIC_STATION_NAME=DJMIXHUB
PUBLIC_NOW_PLAYING_URL=https://radio.djmixhub.com/api/nowplaying/djmixhub
PUBLIC_STREAM_URL=https://radio.djmixhub.com/listen/djmixhub/radio.mp3
PUBLIC_HLS_URL=
PUBLIC_SUBMIT_MIX_URL=https://submit.djmixhub.com
PUBLIC_MAIN_REPO_URL=https://github.com/jamesking210/djmixhub-radio-site
PUBLIC_AZURACAST_REPO_URL=https://github.com/AzuraCast/AzuraCast
PUBLIC_GITHUB_URL=https://github.com/jamesking210
PUBLIC_CONTACT_EMAIL=djmixhubradio@gmail.com
PUBLIC_CONTACT_PHONE=833-666-7977
PORT=8088
NODE_ENV=production
```

If your AzuraCast HLS playlist URL is stable, set `PUBLIC_HLS_URL` explicitly. If you leave it blank, the site can still discover `station.hls_url` from AzuraCast metadata and fall back to MP3 when needed.

## Deploy from scratch on Ubuntu

These steps assume a clean Ubuntu server.

### 1. Install Docker and Git

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clone the repo

```bash
sudo mkdir -p /opt/custom-dockers
sudo chown "$USER":"$USER" /opt/custom-dockers
cd /opt/custom-dockers
git clone https://github.com/jamesking210/djmixhub-radio-site.git
cd djmixhub-radio-site
```

### 3. Create your env file

```bash
cp .env.example .env
nano .env
```

### 4. Build and start the site

```bash
docker compose up -d --build
```

### 5. Verify

```bash
docker compose ps
```

### 6. Open locally

```text
http://YOUR-SERVER-IP:8088
```

## LinuxBox2 deploy/update

Initial deploy:

```bash
sudo mkdir -p /opt/custom-dockers
sudo chown "$USER":"$USER" /opt/custom-dockers
cd /opt/custom-dockers
git clone https://github.com/jamesking210/djmixhub-radio-site.git
cd djmixhub-radio-site
cp .env.example .env
nano .env
docker compose up -d --build
docker compose ps
```

Update after a GitHub push:

```bash
cd /opt/custom-dockers/djmixhub-radio-site
git pull origin main
docker compose up -d --build
docker compose ps
```

If you only changed `.env`:

```bash
cd /opt/custom-dockers/djmixhub-radio-site
nano .env
docker compose up -d --build
```

## Stop or restart

Stop the site:

```bash
cd /opt/custom-dockers/djmixhub-radio-site
docker compose down
```

Restart the site:

```bash
docker compose restart
```

## Reverse proxy notes

Typical setup:

- `djmixhub.com` -> this site
- `radio.djmixhub.com` -> AzuraCast

## Content updates

### Add or edit DJs

- add a square image to `assets/`
- add a DJ object in `dj-data.js`

### Change public site values

- update `.env`
- rebuild with `docker compose up -d --build`

## Notes

- `config.js` in the repo is only a safe local fallback
- Docker-generated runtime config overrides it inside containers
- the site uses AzuraCast now-playing data directly
- the site prefers HLS when available and falls back to MP3 automatically
