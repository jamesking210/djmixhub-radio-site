# DJMixHub.com radio site

A Docker-ready static website for **djmixhub.com** with:

- Home page
- About page
- DJ Bios page
- Persistent bottom player UI on every page
- Live track metadata pulled from AzuraCast when available
- Dark neon styling matched to the DJMixHub logo

## Station settings already wired in

- Main website domain: `djmixhub.com`
- AzuraCast host: `radio.djmixhub.com`
- Station shortcode: `djmixhub`
- Local Docker port: `8085`

## Folder layout

```text
.
├── about.html
├── assets
│   ├── css/styles.css
│   ├── img/logo.jpg
│   └── js/player.js
├── djs.html
├── docker-compose.yml
├── Dockerfile
├── index.html
├── nginx/default.conf
└── README.md
```

## Deploy on your NUC

```bash
cd /opt
git clone https://github.com/YOUR-USERNAME/djmixhub-radio-site.git
cd djmixhub-radio-site
docker compose up -d --build
```

Then open:

```text
http://NUC1-IP:8085
```

## Update the site later

After editing files:

```bash
docker compose up -d --build
```

## Reverse proxy idea

Point `djmixhub.com` to this container on port `8085` using your reverse proxy.

Examples:
- Nginx Proxy Manager
- Caddy
- SWAG
- Existing nginx/apache reverse proxy

## Edit the station content

### Home page
Edit:
- `index.html`

### About page
Edit:
- `about.html`

### DJ Bios
Edit:
- `djs.html`

## Edit the player behavior

All station/player config lives in:

- `assets/js/player.js`

The important values are:

```js
const STATION = {
  name: 'DJMixHub Live',
  shortcode: 'djmixhub',
  publicPlayerUrl: 'https://radio.djmixhub.com/public/djmixhub',
  liveApiUrl: 'https://radio.djmixhub.com/api/nowplaying/djmixhub',
  staticApiUrl: 'https://radio.djmixhub.com/api/nowplaying_static/djmixhub.json',
  fallbackStreamUrl: 'https://radio.djmixhub.com/listen/djmixhub/radio.mp3'
};
```

## Notes about AzuraCast metadata

Playback will still work with the fallback stream URL even if metadata fetching is blocked.
If the Now Playing data does not update, the most likely causes are:

- AzuraCast CORS settings need adjustment
- the public API path is different on your setup
- your station stream mount is using a different URL than the fallback URL

## Good next upgrades

- add real DJ photos
- add a schedule page
- add social links
- add a contact/request page
- add a background video or animated equalizer
- add mobile menu toggle
- add HTTPS redirect at the reverse proxy

## GitHub workflow

1. Create a new GitHub repo
2. Upload this project
3. Clone it to `nuc1`
4. Run `docker compose up -d --build`
5. Point `djmixhub.com` to port `8085`

