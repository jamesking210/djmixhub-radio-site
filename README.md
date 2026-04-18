# DJMixHub.com radio site v5

This is the simplified v5 layout for **djmixhub.com**:

- one streamlined `index.html`
- in-page sections for `#home`, `#about`, and `#djs`
- one separate `terms.html`
- persistent player during normal navigation inside `index.html`
- live track metadata and album art from AzuraCast when available
- Docker-ready nginx deployment on port `8085`

## Station settings

- Main website domain: `djmixhub.com`
- AzuraCast host: `radio.djmixhub.com`
- Station shortcode: `djmixhub`
- Local Docker port: `8085`

## Deploy

```bash
cd /opt/djmixhub-radio-site
docker compose up -d --build
```

## Update later

```bash
git pull
docker compose up -d --build
```

## Important

Keep your existing image files in `assets/img`, especially:

- `logo.jpg`
- `logo.png`
- `JimboSliceChicago.png`
- `ChuckTheDJCA.png`

## Files no longer needed in this version

You no longer need separate content pages for:

- `about.html`
- `djs.html`

Everything for those sections now lives inside `index.html`.
