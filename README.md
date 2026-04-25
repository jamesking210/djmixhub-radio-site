# DJMixHub Radio Site

DJMIXHUB is a self-hosted radio website project built around AzuraCast and Docker.

This repo now ships with two separate site variants:

- `djmixhub-site`: the custom player site on port `8085`
- `djmixhub-embed-site`: the embedded AzuraCast player site on port `8087`

Both are static frontends served by Nginx and configured through public runtime environment variables.

## Site variants

### 1. Custom Player Site

- service: `djmixhub-site`
- default URL: `http://localhost:8085`
- uses the custom sticky player in `script.js`

Main files:

- `index.html`
- `styles.css`
- `script.js`
- `terms.html`
- `dj-data.js`

### 2. Embedded Player Site

- service: `djmixhub-embed-site`
- default URL: `http://localhost:8087`
- uses the AzuraCast public player inside an iframe

Main files:

- `embedded-site/index.html`
- `embedded-site/styles.css`
- `embedded-site/app.js`
- `embedded-site/terms.html`
- `embedded-site/dj-data.js`

## Project layout

- `assets/`: station logo and DJ images
- `config.js`: local fallback config for the custom player site
- `config.template.js`: Docker-rendered runtime config for the custom player site
- `docker-compose.yml`: runs both websites
- `Dockerfile`: image for the custom player site
- `embedded-site/Dockerfile`: image for the embedded-player site
- `nginx.conf`: custom player Nginx config
- `embedded-site/nginx.conf`: embedded-site Nginx config
- `docker-entrypoint-generate-config.sh`: runtime config generator for the custom player site
- `embedded-site/docker-entrypoint-generate-config.sh`: runtime config generator for the embedded site

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
- `PUBLIC_PLAYER_URL`
- `PUBLIC_MAIN_REPO_URL`
- `PUBLIC_AZURACAST_REPO_URL`
- `PUBLIC_GITHUB_URL`
- `PUBLIC_CONTACT_EMAIL`

Deployment config:

- `PORT`
- `EMBED_PORT`
- `NODE_ENV`

## Local development

1. Copy the sample env file:

```bash
cp .env.example .env
```

2. Edit `.env` for your URLs, station shortcode, and contact info.

3. Build and run both sites:

```bash
docker compose up -d --build
```

4. Open:

- custom player site: `http://localhost:8085`
- embedded player site: `http://localhost:8087`

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
- `PUBLIC_PLAYER_URL`
- `PUBLIC_CONTACT_EMAIL`
- `PORT`
- `EMBED_PORT`

### 4. Build and start both sites

```bash
docker compose up -d --build
```

### 5. Verify

```bash
docker compose ps
```

Default local ports:

- custom player site: `8085`
- embedded player site: `8087`

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
```

## Stop or restart

Stop both:

```bash
docker compose down
```

Restart both:

```bash
docker compose restart
```

## Reverse proxy notes

A common setup is:

- `djmixhub.com` -> custom player site or embedded site
- `radio.djmixhub.com` -> AzuraCast

If you want both site variants publicly accessible, give them different subdomains, for example:

- `djmixhub.com` -> one preferred frontend
- `embed.djmixhub.com` -> embedded-player frontend
- `radio.djmixhub.com` -> AzuraCast

## Content updates

### Add or edit DJs

Custom player site:

- add a square image to `assets/`
- add a DJ object in `dj-data.js`

Embedded-player site:

- add a square image to `assets/`
- add a DJ object in `embedded-site/dj-data.js`

### Change public site values

- update `.env`
- rebuild the affected container with `docker compose up -d --build`

## Notes

- `config.js` files in the repo are safe local fallbacks
- Docker-generated runtime config overrides them inside containers
- the custom player site uses AzuraCast now-playing data directly
- the embedded site uses the AzuraCast public player URL plus now-playing data for display
