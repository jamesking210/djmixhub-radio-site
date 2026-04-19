# DJMixHub Radio Site

A simple, stylish, one-page static radio station website for **DJMixHub**.

This project is intentionally lightweight:

- One main `index.html`
- One separate `terms.html`
- Clean `styles.css`
- Small `script.js` for the player and station data
- Docker-ready with Nginx
- Runs on **port 8085**

## What it includes

- Dark, modern radio-station style
- Fixed bottom player
- Play and stop controls
- Current song title
- Artist name
- Listener count
- Album artwork from AzuraCast
- Terms agreement gate before listening
- One-page navigation for About / DJs / Schedule
- Schedule section that works now and can grow later

## Project structure

```text
.
├── assets/
│   ├── logo.svg
│   ├── logo.jpg
│   ├── JimboSliceChicago.png
│   └── ChuckTheDJCA.png
├── index.html
├── terms.html
├── styles.css
├── script.js
├── nginx.conf
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Player data source

The site reads station info from:

```text
/azuracast/api/nowplaying_static/djmixhub.json
```

Inside the container, Nginx proxies `/azuracast/` to:

```text
https://radio.djmixhub.com/
```

That keeps the front end simple and avoids browser-side cross-origin headaches for the metadata request.

## Local deploy

```bash
git clone https://github.com/jamesking210/djmixhub-radio-site.git
cd djmixhub-radio-site
docker compose up -d --build
```

Then open:

```text
http://YOUR-SERVER-IP:8085
```

## Reverse proxy idea

If you want this to live on `djmixhub.com`, point your reverse proxy at the website container on port `8085`.

Example idea:

- `djmixhub.com` -> this static site container on `8085`
- `radio.djmixhub.com` -> AzuraCast

## Customizing the logo

The project keeps `assets/logo.svg` as a safe fallback, but the current layout is wired to use these files if you add them:

```text
assets/logo.jpg
assets/JimboSliceChicago.png
assets/ChuckTheDJCA.png
```

If any of those files are missing, the site falls back cleanly instead of breaking the layout.

## Customizing the stream URL

The JavaScript uses this fallback stream URL:

```js
fallbackStreamUrl: 'https://radio.djmixhub.com/listen/djmixhub/radio.mp3'
```

If your public listen URL is different, update it in `script.js`.

## Notes

- The bottom player stays alive while moving around the one-page homepage.
- It is expected to stop if the listener opens the separate `terms.html` page.
- The schedule section already degrades gracefully if detailed show data is limited right now.
- Later, you can expand the schedule section to use richer AzuraCast schedule data or your own show feed.
