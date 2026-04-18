# DJMixHub.com radio site v6

This is the updated one-page layout for **djmixhub.com**:

- one streamlined `index.html`
- in-page sections for `#home`, `#about`, `#schedule`, and `#djs`
- one separate `terms.html`
- persistent player during normal navigation inside `index.html`
- bottom dock player shows the current album artwork from AzuraCast
- live track metadata, recent spins, and schedule data from AzuraCast when available
- Docker-ready nginx deployment on port `8085`

## Station settings

- Main website domain: `djmixhub.com`
- AzuraCast host: `radio.djmixhub.com`
- Station shortcode: `djmixhub`
- Assumed station ID for schedule API: `1`
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

## Schedule note

The schedule section tries these endpoints in `assets/js/player.js`:

- `https://radio.djmixhub.com/api/station/1/schedule?now=now&rows=12`
- `https://radio.djmixhub.com/api/station/djmixhub/schedule?now=now&rows=12`

If your schedule does not load, the most likely fix is updating the numeric station ID in `assets/js/player.js`.

## Files no longer needed in this version

You still do **not** need separate content pages for:

- `about.html`
- `djs.html`

Everything for those sections now lives inside `index.html`.
