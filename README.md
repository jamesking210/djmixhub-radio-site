# DJMixHub Radio Site

DJMIXHUB is a self-hosted radio website project built around AzuraCast and Docker.

This repo ships with three site variants:

- `djmixhub-site`: the original custom player site on port `8085`
- `djmixhub-embed-site`: the embedded AzuraCast player site on port `8087`
- `djmixhub-hybrid-site`: the preferred production site on port `8088`

All three are static frontends served by Nginx and configured through public runtime environment variables.

## Recommended production site

If you want one site to deploy publicly right now, use:

- service: `djmixhub-hybrid-site`
- default local URL: `http://localhost:8088`

This is the best blend of the cleaner listener layout plus the custom sticky bottom player. It prefers HLS playback when available and falls back to the MP3 stream automatically.

## Site variants

### 1. Original custom player site

- service: `djmixhub-site`
- default URL: `http://localhost:8085`
- uses the original custom sticky player

Main files:

- `index.html`
- `styles.css`
- `script.js`
- `terms.html`
- `dj-data.js`

### 2. Embedded player site

- service: `djmixhub-embed-site`
- default URL: `http://localhost:8087`
- uses the AzuraCast public player inside an iframe

Main files:

- `embedded-site/index.html`
- `embedded-site/styles.css`
- `embedded-site/app.js`
- `embedded-site/terms.html`
- `embedded-site/dj-data.js`

### 3. Hybrid / production site

- service: `djmixhub-hybrid-site`
- default URL: `http://localhost:8088`
- cleaner listener layout plus custom bottom player
- prefers HLS playback and falls back to MP3

Main files:

- `hybrid-site/index.html`
- `hybrid-site/styles.css`
- `hybrid-site/app.js`
- `hybrid-site/terms.html`
- `hybrid-site/dj-data.js`

## Project layout

- `assets/`: station logo and DJ images
- `config.js`: local fallback config for the original custom player site
- `config.template.js`: Docker-rendered runtime config for the original custom player site
- `docker-compose.yml`: runs all site variants
- `Dockerfile`: image for the original custom player site
- `nginx.conf`: original custom player Nginx config
- `docker-entrypoint-generate-config.sh`: runtime config generator for the original site
- `embedded-site/`: embedded-player site on port `8087`
- `embedded-site/Dockerfile`: image for the embedded-player site
- `embedded-site/nginx.conf`: embedded-site Nginx config
- `embedded-site/docker-entrypoint-generate-config.sh`: runtime config generator for the embedded site
- `hybrid-site/`: production-oriented custom player site on port `8088`
- `hybrid-site/Dockerfile`: image for the production site
- `hybrid-site/nginx.conf`: production-site Nginx config
- `hybrid-site/docker-entrypoint-generate-config.sh`: runtime config generator for the production site

## Config pattern

This project does not read `.env` directly from browser JavaScript.

Instead:

1. Docker reads values from `.env`
2. each container generates a browser-safe `config.js` at startup
3. the frontend reads that generated runtime config

Only public values should go into this config. Do not place secrets in frontend-exposed variables.

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
- `PUBLIC_PLAYER_URL`
- `PUBLIC_MAIN_REPO_URL`
- `PUBLIC_AZURACAST_REPO_URL`
- `PUBLIC_GITHUB_URL`
- `PUBLIC_CONTACT_EMAIL`

Deployment config:

- `PORT`
- `EMBED_PORT`
- `HYBRID_PORT`
- `NODE_ENV`

## Local development

1. Copy the sample env file:

```bash
cp .env.example .env
```

2. Edit `.env` for your URLs, station shortcode, HLS/stream values, and contact info.

3. Build and run all sites:

```bash
docker compose up -d --build
```

4. Open:

- original custom player site: `http://localhost:8085`
- embedded player site: `http://localhost:8087`
- production hybrid site: `http://localhost:8088`

## Deploy from scratch on Ubuntu

These steps assume a clean Ubuntu server and a GitHub-hosted copy of this repo.

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
git clone https://github.com/jamesking210/djmixhub-radio-site.git
cd djmixhub-radio-site
```

### 3. Create your runtime config

```bash
cp .env.example .env
nano .env
```

Set at minimum:

- `PUBLIC_SITE_URL`
- `PUBLIC_RADIO_BASE_URL`
- `PUBLIC_STATION_SHORTCODE`
- `PUBLIC_NOW_PLAYING_URL`
- `PUBLIC_STREAM_URL`
- `PUBLIC_CONTACT_EMAIL`
- `HYBRID_PORT`

Optional but recommended:

- `PUBLIC_HLS_URL`
- `PUBLIC_MAIN_REPO_URL`
- `PUBLIC_AZURACAST_REPO_URL`
- `PUBLIC_GITHUB_URL`

Recommended minimum `.env` values for the production `8088` site:

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
PUBLIC_MAIN_REPO_URL=https://github.com/jamesking210/djmixhub-radio-site
PUBLIC_AZURACAST_REPO_URL=https://github.com/AzuraCast/AzuraCast
PUBLIC_GITHUB_URL=https://github.com/jamesking210
PUBLIC_CONTACT_EMAIL=djmixhubradio@gmail.com
HYBRID_PORT=8088
NODE_ENV=production
```

If your AzuraCast HLS playlist URL is stable, set `PUBLIC_HLS_URL` explicitly. If you leave it blank, the `8088` site can still discover `station.hls_url` from AzuraCast metadata and fall back to MP3 when needed.

### 4. Build and start the production site

If LinuxBox2 is only meant to host the preferred production frontend:

```bash
docker compose up -d --build djmixhub-hybrid-site
```

If you want all variants available too:

```bash
docker compose up -d --build
```

### 5. Verify

```bash
docker compose ps
```

Default local ports:

- original custom player site: `8085`
- embedded player site: `8087`
- production hybrid site: `8088`

### 6. Open the production site

```text
http://YOUR-SERVER-IP:8088
```

## Deploy the preferred production site on LinuxBox2

For a brand-new Ubuntu box that already has Docker and Docker Compose:

```bash
git clone https://github.com/jamesking210/djmixhub-radio-site.git
cd djmixhub-radio-site
cp .env.example .env
nano .env
docker compose up -d --build djmixhub-hybrid-site
docker compose ps
```

## Update LinuxBox2 after future edits

If you edited files directly on LinuxBox2:

```bash
cd djmixhub-radio-site
docker compose up -d --build djmixhub-hybrid-site
```

If you pushed updates to GitHub from another machine:

```bash
cd djmixhub-radio-site
git pull origin main
docker compose up -d --build djmixhub-hybrid-site
```

If you changed `.env` values:

```bash
cd djmixhub-radio-site
nano .env
docker compose up -d --build djmixhub-hybrid-site
```

## Update the site after an edit

If you edited files locally on the server:

```bash
cd djmixhub-radio-site
docker compose up -d --build
```

If you pushed changes to GitHub from another machine and want to update the server:

```bash
cd djmixhub-radio-site
git pull origin main
docker compose up -d --build
```

If you only want to rebuild one site:

```bash
docker compose up -d --build djmixhub-site
docker compose up -d --build djmixhub-embed-site
docker compose up -d --build djmixhub-hybrid-site
```

## Stop or restart

Stop all sites:

```bash
docker compose down
```

Restart all sites:

```bash
docker compose restart
```

Restart only the production site:

```bash
docker compose restart djmixhub-hybrid-site
```

## Reverse proxy notes

A common setup is:

- `djmixhub.com` -> preferred production frontend
- `radio.djmixhub.com` -> AzuraCast

If you want multiple variants publicly accessible, use separate subdomains, for example:

- `djmixhub.com` -> `djmixhub-hybrid-site`
- `embed.djmixhub.com` -> embedded-player frontend
- `classic.djmixhub.com` -> original custom-player frontend
- `radio.djmixhub.com` -> AzuraCast

## Content updates

### Add or edit DJs

Original custom player site:

- add a square image to `assets/`
- add a DJ object in `dj-data.js`

Embedded-player site:

- add a square image to `assets/`
- add a DJ object in `embedded-site/dj-data.js`

Hybrid production site:

- add a square image to `assets/`
- add a DJ object in `hybrid-site/dj-data.js`

### Change public site values

- update `.env`
- rebuild the affected container with `docker compose up -d --build`

## Notes

- `config.js` files in the repo are safe local fallbacks
- Docker-generated runtime config overrides them inside containers
- the original custom player site uses AzuraCast now-playing data directly
- the embedded site uses the AzuraCast public player URL plus now-playing data for display
- the hybrid production site uses the custom bottom player, prefers HLS when available, and falls back to MP3 automatically
