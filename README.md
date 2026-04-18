# DJMixHub.com v4

This v4 package restructures the site into a **single-page front end** so the built-in player can keep playing while visitors move between sections in the same browser tab.

## What changed

- Home, About, DJ Bios, and Terms now live inside one `index.html` shell
- navigation uses hash routes (`#home`, `#about`, `#djs`, `#terms`)
- the player is no longer duplicated across separate full HTML pages
- album art is pulled from AzuraCast when available and falls back to the DJMixHub logo
- ChuckTheDJCA now explicitly includes **Northern California**
- `about.html`, `djs.html`, and `terms.html` are redirect wrappers for old links

## Important note about images

This package is meant to be merged into your **existing GitHub repo**.

It does **not** include the existing binary DJ image files from your repo, so keep your current `assets/img/` folder contents, especially:

- `assets/img/logo.jpg`
- `assets/img/logo.png`
- `assets/img/JimboSliceChicago.png`
- `assets/img/ChuckTheDJCA.png`

## Files included

- `index.html`
- `about.html`
- `djs.html`
- `terms.html`
- `assets/css/styles.css`
- `assets/js/player.js`
- `Dockerfile`
- `docker-compose.yml`
- `nginx/default.conf`

## Deploy or update

```bash
cd /opt/djmixhub-radio-site
git pull
docker compose up -d --build
```

## If you are uploading manually to GitHub

Unzip this package, copy the included files over the existing repo files, commit, and push.
