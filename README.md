# DJMixHub.com v7

This package tightens the site into a more professional one-page radio layout with:

- one-page `index.html` with `#home`, `#about`, `#schedule`, and `#djs`
- separate `terms.html`
- bottom player with **70x70 album artwork**
- refreshed AzuraCast metadata handling
- schedule section that tries multiple AzuraCast public schedule endpoints and falls back gracefully
- professional dark radio styling

## Keep your existing image assets

Do **not** delete your current image files in `assets/img/`. Keep:

- `assets/img/logo.jpg`
- `assets/img/logo.png`
- `assets/img/JimboSliceChicago.png`
- `assets/img/ChuckTheDJCA.png`

This package includes the folder structure, but your current image files should remain in place.

## Deploy

```bash
cd /opt/djmixhub-radio-site
git pull
docker compose up -d --build
```

Or overwrite the repo files with this package and push them to GitHub first.
