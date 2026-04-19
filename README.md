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

The site reads station info directly from:

```text
https://radio.djmixhub.com/api/nowplaying_static/djmixhub.json
```

The stream fallback also points directly at:

```text
https://radio.djmixhub.com/listen/djmixhub/radio.mp3
```

This keeps the site simple and avoids relying on a local metadata proxy.

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

The current layout is wired to use these files:

```text
assets/logo.jpg
assets/JimboSliceChicago.png
assets/ChuckTheDJCA.png
```

Keep `assets/logo.jpg` in place so the brand image appears everywhere across the site and player.

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
