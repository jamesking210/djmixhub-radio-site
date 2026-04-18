# DJMixHub.com basic site

A basic, stylish, professional one-page radio station website for AzuraCast.

## What this version does

- one-page `index.html`
- top nav scrolls to `#about`, `#djs`, and `#schedule`
- bottom player stays active because the listener stays on the same page
- pulls **now playing**, **listener count**, and **album art** from AzuraCast
- tries to load the AzuraCast public **schedule** and falls back gracefully if you do not have much scheduled yet
- separate `terms.html`
- Docker-ready on **port 8085**

## How it works with AzuraCast on the same machine

This site container proxies requests to AzuraCast through:

- `/azuracast/...`

The included Nginx config sends that traffic to `http://host.docker.internal/`, and `docker-compose.yml` includes the Linux host-gateway mapping so the container can reach AzuraCast running on the same machine.

## Start it

```bash
cd /opt/djmixhub-radio-site
 docker compose up -d --build
```

Then open:

```text
http://YOUR-SERVER-IP:8085
```

## If your AzuraCast stream path is different

Edit this line in `assets/js/player.js`:

```js
streamPath: '/azuracast/listen/djmixhub/radio.mp3'
```

## If your schedule endpoint behaves differently

The site currently tries:

- `/azuracast/api/station/{station_id}/schedule`
- `/azuracast/api/station/djmixhub/schedule`

If your AzuraCast build exposes schedule differently, update the fetch logic in `assets/js/player.js`.
